import Foundation
import Combine

@MainActor
class AuthViewModel: ObservableObject {
    @Published var currentUser: UserProfile?
    @Published var users: [UserProfile] = []
    @Published var errorMessage: String?
    @Published var isLoading: Bool = false
    @Published var isSyncing: Bool = false
    @Published var lastSyncTime: Date? = nil
    
    private let usersKey = "bauzeit_ios_users"
    private let sessionUserKey = "bauzeit_ios_session_user_id"
    private var syncTimer: Timer?
    
    // Master Admin Code to create an Owner account
    let adminMasterCodes = ["CHEF2026", "JASIN2026", "BAUZEIT2026"]
    
    init() {
        loadUsers()
        Task {
            await syncWithCloud()
        }
        startAutoSyncTimer()
    }
    
    private func startAutoSyncTimer() {
        syncTimer?.invalidate()
        syncTimer = Timer.scheduledTimer(withTimeInterval: 8.0, repeats: true) { [weak self] _ in
            Task { @MainActor in
                await self?.syncWithCloud()
            }
        }
    }
    
    var isOwner: Bool {
        currentUser?.role == .owner
    }
    
    var isMember: Bool {
        currentUser?.role == .member
    }
    
    func loadUsers() {
        if let data = UserDefaults.standard.data(forKey: usersKey),
           let decoded = try? JSONDecoder().decode([UserProfile].self, from: data) {
            self.users = decoded
        } else {
            self.users = []
        }
        
        if let currentId = UserDefaults.standard.string(forKey: sessionUserKey),
           let found = users.first(where: { $0.id == currentId }) {
            self.currentUser = found
        }
    }
    
    private func saveUsers() {
        if let encoded = try? JSONEncoder().encode(users) {
            UserDefaults.standard.set(encoded, forKey: usersKey)
        }
    }
    
    /// Synchronisiert alle Benutzerprofile bidirektional mit Firebase Cloud Firestore
    func syncWithCloud() async {
        isSyncing = true
        defer { isSyncing = false }
        
        guard let cloudUsers = await CloudSyncManager.shared.fetchCloudUsers() else {
            return
        }
        
        var merged: [UserProfile] = cloudUsers
        
        // Lokale Nutzer, die noch nicht in der Cloud sind (oder per E-Mail abgleichen), hochladen
        for localUser in users {
            if let cloudIdx = merged.firstIndex(where: {
                $0.id == localUser.id || $0.email.lowercased() == localUser.email.lowercased()
            }) {
                // Cloud-Eintrag existiert bereits -> falls lokale ID abweicht, auf Cloud-ID vereinheitlichen
                let unified = merged[cloudIdx]
                if currentUser?.id == localUser.id || currentUser?.email.lowercased() == localUser.email.lowercased() {
                    currentUser = unified
                    UserDefaults.standard.set(unified.id, forKey: sessionUserKey)
                }
            } else {
                merged.append(localUser)
                await CloudSyncManager.shared.pushUser(localUser)
            }
        }
        
        self.users = merged
        saveUsers()
        
        if let currentId = UserDefaults.standard.string(forKey: sessionUserKey),
           let found = users.first(where: { $0.id == currentId }) {
            self.currentUser = found
        }
        self.lastSyncTime = Date()
    }
    
    func login(email: String, password: String, stayLoggedIn: Bool = true) -> Bool {
        let cleanEmail = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !cleanEmail.isEmpty, !password.isEmpty else {
            errorMessage = "Bitte E-Mail und Passwort eingeben."
            return false
        }
        
        if let matched = users.first(where: { $0.email.lowercased() == cleanEmail }) {
            self.currentUser = matched
            if stayLoggedIn {
                UserDefaults.standard.set(matched.id, forKey: sessionUserKey)
            } else {
                UserDefaults.standard.removeObject(forKey: sessionUserKey)
            }
            self.errorMessage = nil
            Task { await syncWithCloud() }
            return true
        } else {
            // Falls Konto gerade auf einem anderen Gerät erstellt wurde: asynchron aus Cloud nachladen
            Task {
                await syncWithCloud()
                if let cloudMatched = users.first(where: { $0.email.lowercased() == cleanEmail }) {
                    self.currentUser = cloudMatched
                    if stayLoggedIn {
                        UserDefaults.standard.set(cloudMatched.id, forKey: sessionUserKey)
                    }
                    self.errorMessage = nil
                } else {
                    self.errorMessage = "Kein Konto mit dieser E-Mail gefunden. Bitte erstelle zuerst ein neues Konto oder nutze den Schnell-Start."
                }
            }
            return false
        }
    }
    
    func quickStart(as role: UserRole) {
        if let existing = users.first(where: { $0.role == role }) {
            self.currentUser = existing
            UserDefaults.standard.set(existing.id, forKey: sessionUserKey)
            self.errorMessage = nil
            Task { await syncWithCloud() }
            return
        }
        
        let isChef = (role == .owner)
        let defaultId = isChef ? "user_owner_default" : "user_member_default"
        let newAccount = UserProfile(
            id: defaultId,
            email: isChef ? "chef@bauzeit.de" : "mitarbeiter@bauzeit.de",
            displayName: isChef ? "Chef (Inhaber)" : "Mitarbeiter",
            role: role,
            workerRate: isChef ? 0.0 : 12.0,
            clientRate: 35.0,
            phoneNumber: nil,
            createdAt: Date()
        )
        users.append(newAccount)
        saveUsers()
        
        self.currentUser = newAccount
        UserDefaults.standard.set(newAccount.id, forKey: sessionUserKey)
        self.errorMessage = nil
        
        Task {
            await CloudSyncManager.shared.pushUser(newAccount)
            await syncWithCloud()
        }
    }
    
    func register(name: String, email: String, password: String, adminCode: String, stayLoggedIn: Bool = true) -> Bool {
        let cleanEmail = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let cleanName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let cleanAdminCode = adminCode.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        
        guard !cleanEmail.isEmpty, !password.isEmpty else {
            errorMessage = "Bitte alle Pflichtfelder ausfüllen."
            return false
        }
        
        if password.count < 6 {
            errorMessage = "Das Passwort muss mindestens 6 Zeichen lang sein."
            return false
        }
        
        var role: UserRole = .member
        if !cleanAdminCode.isEmpty {
            if adminMasterCodes.contains(cleanAdminCode) {
                role = .owner
            } else {
                errorMessage = "Ungültiger Admin-Code. Lass das Feld leer, um dich als Mitarbeiter zu registrieren."
                return false
            }
        }
        
        // Wenn der Inhaber dieses Konto (E-Mail) bereits angelegt hat oder es schon existiert -> direkt verknüpfen & einloggen!
        if let existingIdx = users.firstIndex(where: { $0.email.lowercased() == cleanEmail }) {
            var existingUser = users[existingIdx]
            if !cleanName.isEmpty {
                existingUser.displayName = cleanName
            }
            if !cleanAdminCode.isEmpty && role == .owner {
                existingUser.role = .owner
            }
            users[existingIdx] = existingUser
            saveUsers()
            self.currentUser = existingUser
            if stayLoggedIn {
                UserDefaults.standard.set(existingUser.id, forKey: sessionUserKey)
            }
            self.errorMessage = nil
            Task {
                await CloudSyncManager.shared.pushUser(existingUser)
                await syncWithCloud()
            }
            return true
        }
        
        let newUser = UserProfile(
            id: UUID().uuidString,
            email: cleanEmail,
            displayName: cleanName.isEmpty ? cleanEmail.components(separatedBy: "@").first ?? "Nutzer" : cleanName,
            role: role,
            workerRate: role == .owner ? 0.0 : 12.0,
            clientRate: 35.0,
            phoneNumber: nil,
            createdAt: Date()
        )
        
        users.append(newUser)
        saveUsers()
        
        self.currentUser = newUser
        if stayLoggedIn {
            UserDefaults.standard.set(newUser.id, forKey: sessionUserKey)
        } else {
            UserDefaults.standard.removeObject(forKey: sessionUserKey)
        }
        self.errorMessage = nil
        
        Task {
            await CloudSyncManager.shared.pushUser(newUser)
            await syncWithCloud()
        }
        return true
    }
    
    func addNewWorker(name: String, email: String, workerRate: Double, clientRate: Double, phone: String?) -> Bool {
        let cleanEmail = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let cleanName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        
        // Wenn E-Mail bereits existiert, aktualisiere den bestehenden Mitarbeiter statt Fehler
        if let idx = users.firstIndex(where: { $0.email.lowercased() == cleanEmail }) {
            var updated = users[idx]
            if !cleanName.isEmpty { updated.displayName = cleanName }
            if workerRate > 0 { updated.workerRate = workerRate }
            if clientRate > 0 { updated.clientRate = clientRate }
            if let phone = phone, !phone.isEmpty { updated.phoneNumber = phone }
            users[idx] = updated
            saveUsers()
            Task {
                await CloudSyncManager.shared.pushUser(updated)
                await syncWithCloud()
            }
            return true
        }
        
        let newWorker = UserProfile(
            id: UUID().uuidString,
            email: cleanEmail.isEmpty ? "mitarbeiter_\(Int(Date().timeIntervalSince1970))@bauzeit.de" : cleanEmail,
            displayName: cleanName.isEmpty ? "Mitarbeiter" : cleanName,
            role: .member,
            workerRate: workerRate > 0 ? workerRate : 12.0,
            clientRate: clientRate > 0 ? clientRate : 35.0,
            phoneNumber: phone,
            createdAt: Date()
        )
        
        users.append(newWorker)
        saveUsers()
        Task {
            await CloudSyncManager.shared.pushUser(newWorker)
            await syncWithCloud()
        }
        return true
    }
    
    func updateWorker(_ worker: UserProfile) {
        if let idx = users.firstIndex(where: { $0.id == worker.id }) {
            users[idx] = worker
            saveUsers()
            if currentUser?.id == worker.id {
                currentUser = worker
            }
            Task {
                await CloudSyncManager.shared.pushUser(worker)
            }
        }
    }
    
    func switchUser(to user: UserProfile) {
        self.currentUser = user
        UserDefaults.standard.set(user.id, forKey: sessionUserKey)
        Task {
            await syncWithCloud()
        }
    }
    
    func logout() {
        self.currentUser = nil
        UserDefaults.standard.removeObject(forKey: sessionUserKey)
    }
}

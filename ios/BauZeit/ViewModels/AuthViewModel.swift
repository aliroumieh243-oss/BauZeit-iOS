import Foundation
import Combine

class AuthViewModel: ObservableObject {
    @Published var currentUser: UserProfile?
    @Published var users: [UserProfile] = []
    @Published var errorMessage: String?
    @Published var isLoading: Bool = false
    
    private let usersKey = "bauzeit_ios_users"
    private let sessionUserKey = "bauzeit_ios_session_user_id"
    
    // Master Admin Code to create an Owner account
    let adminMasterCodes = ["CHEF2026", "JASIN2026", "BAUZEIT2026"]
    
    init() {
        loadUsers()
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
            // Fresh start: Zero accounts
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
    
    func login(email: String, password: String) -> Bool {
        let cleanEmail = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !cleanEmail.isEmpty, !password.isEmpty else {
            errorMessage = "Bitte E-Mail und Passwort eingeben."
            return false
        }
        
        if let matched = users.first(where: { $0.email.lowercased() == cleanEmail }) {
            self.currentUser = matched
            UserDefaults.standard.set(matched.id, forKey: sessionUserKey)
            self.errorMessage = nil
            return true
        } else {
            errorMessage = "Kein Konto mit dieser E-Mail gefunden. Bitte erstelle zuerst ein neues Konto."
            return false
        }
    }
    
    func register(name: String, email: String, password: String, adminCode: String) -> Bool {
        let cleanEmail = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let cleanName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let cleanAdminCode = adminCode.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        
        guard !cleanEmail.isEmpty, !password.isEmpty else {
            errorMessage = "Bitte alle Pflichtfelder ausfüllen."
            return false
        }
        
        if users.contains(where: { $0.email.lowercased() == cleanEmail }) {
            errorMessage = "Ein Konto mit dieser E-Mail existiert bereits."
            return false
        }
        
        // Determine role: by default Member, or Owner if valid admin code is provided
        var role: UserRole = .member
        if !cleanAdminCode.isEmpty {
            if adminMasterCodes.contains(cleanAdminCode) {
                role = .owner
            } else {
                errorMessage = "Ungültiger Admin-Code. Lass das Feld leer, um dich als Mitarbeiter zu registrieren."
                return false
            }
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
        UserDefaults.standard.set(newUser.id, forKey: sessionUserKey)
        self.errorMessage = nil
        return true
    }
    
    func addNewWorker(name: String, email: String, workerRate: Double, clientRate: Double, phone: String?) -> Bool {
        let cleanEmail = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if users.contains(where: { $0.email.lowercased() == cleanEmail }) {
            return false
        }
        
        let newWorker = UserProfile(
            id: UUID().uuidString,
            email: cleanEmail,
            displayName: name.trimmingCharacters(in: .whitespacesAndNewlines),
            role: .member,
            workerRate: workerRate > 0 ? workerRate : 12.0,
            clientRate: clientRate > 0 ? clientRate : 35.0,
            phoneNumber: phone,
            createdAt: Date()
        )
        
        users.append(newWorker)
        saveUsers()
        return true
    }
    
    func updateWorker(_ worker: UserProfile) {
        if let idx = users.firstIndex(where: { $0.id == worker.id }) {
            users[idx] = worker
            saveUsers()
            if currentUser?.id == worker.id {
                currentUser = worker
            }
        }
    }
    
    func logout() {
        self.currentUser = nil
        UserDefaults.standard.removeObject(forKey: sessionUserKey)
    }
}

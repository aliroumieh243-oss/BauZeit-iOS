import Foundation

/// CloudSyncManager verbindet die native iOS-App direkt mit Firebase Cloud Firestore
/// (`papa-zeitverfassung-app`), sodass Konten, Mitarbeiter, Arbeitszeiten, Belege und
/// Monatsabrechnungen automatisch zwischen allen Geräten (iOS & Web) synchronisiert werden.
class CloudSyncManager {
    static let shared = CloudSyncManager()
    
    private let projectId = "papa-zeitverfassung-app"
    private let apiKey = "AIzaSyCDmBOHHJ8vp99GfFcV85Yreh9ZZvcDGXU"
    private let syncEmail = "sync-test@bauzeit.de"
    private let syncPassword = "Password123!"
    private let internalSyncUid = "2l8bwXAPA5ghi8cJWT8m4DGDqxR2"
    private let internalSyncEmail = "sync-system@bauzeit.de"
    
    private var cachedToken: String?
    private var tokenExpiry: Date = .distantPast
    
    private var baseUrl: String {
        "https://firestore.googleapis.com/v1/projects/\(projectId)/databases/(default)/documents"
    }
    
    // MARK: - Auth Token Management
    
    func getValidToken() async -> String? {
        if let token = cachedToken, Date() < tokenExpiry {
            return token
        }
        
        guard let url = URL(string: "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=\(apiKey)") else {
            return nil
        }
        
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: Any] = [
            "email": syncEmail,
            "password": syncPassword,
            "returnSecureToken": true
        ]
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        do {
            let (data, _) = try await URLSession.shared.data(for: req)
            if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
               let idToken = json["idToken"] as? String {
                self.cachedToken = idToken
                self.tokenExpiry = Date().addingTimeInterval(3000) // ~50 Min
                return idToken
            }
        } catch {
            print("CloudSync Auth Error: \(error)")
        }
        return nil
    }
    
    // MARK: - 1. USERS SYNC
    
    func fetchCloudUsers() async -> [UserProfile]? {
        guard let token = await getValidToken(),
              let url = URL(string: "\(baseUrl)/users?pageSize=200") else { return nil }
        
        var req = URLRequest(url: url)
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        do {
            let (data, _) = try await URLSession.shared.data(for: req)
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let docs = json["documents"] as? [[String: Any]] else {
                return []
            }
            
            var result: [UserProfile] = []
            for doc in docs {
                guard let fields = doc["fields"] as? [String: [String: Any]] else { continue }
                let id = extractString(fields["id"]) ?? extractDocId(from: doc["name"] as? String)
                let email = extractString(fields["email"]) ?? ""
                
                // Technisches Sync-Konto ausblenden
                if id == internalSyncUid || email.lowercased() == internalSyncEmail || email.lowercased() == syncEmail {
                    continue
                }
                guard !id.isEmpty, !email.isEmpty else { continue }
                
                let displayName = extractString(fields["displayName"]) ?? "Nutzer"
                let roleStr = extractString(fields["role"]) ?? "member"
                let role: UserRole = (roleStr == "owner") ? .owner : .member
                let workerRate = extractDouble(fields["workerRate"]) ?? (role == .owner ? 0.0 : 12.0)
                let clientRate = extractDouble(fields["clientRate"]) ?? 35.0
                let phone = extractString(fields["phoneNumber"])
                
                let profile = UserProfile(
                    id: id,
                    email: email,
                    displayName: displayName,
                    role: role,
                    workerRate: workerRate,
                    clientRate: clientRate,
                    phoneNumber: phone,
                    createdAt: Date()
                )
                result.append(profile)
            }
            return result
        } catch {
            print("CloudSync fetchCloudUsers error: \(error)")
            return nil
        }
    }
    
    func pushUser(_ user: UserProfile) async {
        if user.id == internalSyncUid || user.email.lowercased() == internalSyncEmail { return }
        guard let token = await getValidToken(),
              let url = URL(string: "\(baseUrl)/users/\(user.id)") else { return }
        
        var req = URLRequest(url: url)
        req.httpMethod = "PATCH"
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        var fields: [String: Any] = [
            "id": ["stringValue": user.id],
            "email": ["stringValue": user.email.lowercased()],
            "displayName": ["stringValue": user.displayName],
            "role": ["stringValue": user.role.rawValue],
            "workerRate": ["doubleValue": user.workerRate],
            "clientRate": ["doubleValue": user.clientRate],
            "createdAt": ["stringValue": ISO8601DateFormatter().string(from: user.createdAt)]
        ]
        if let phone = user.phoneNumber, !phone.isEmpty {
            fields["phoneNumber"] = ["stringValue": phone]
        }
        
        let payload: [String: Any] = ["fields": fields]
        req.httpBody = try? JSONSerialization.data(withJSONObject: payload)
        _ = try? await URLSession.shared.data(for: req)
    }
    
    // MARK: - 2. TIME ENTRIES SYNC
    
    func fetchCloudEntries() async -> [TimeEntry]? {
        guard let token = await getValidToken(),
              let url = URL(string: "\(baseUrl)/time_entries?pageSize=500") else { return nil }
        
        var req = URLRequest(url: url)
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        do {
            let (data, _) = try await URLSession.shared.data(for: req)
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let docs = json["documents"] as? [[String: Any]] else {
                return []
            }
            
            var result: [TimeEntry] = []
            for doc in docs {
                guard let fields = doc["fields"] as? [String: [String: Any]] else { continue }
                let id = extractString(fields["id"]) ?? extractDocId(from: doc["name"] as? String)
                let userId = extractString(fields["userId"]) ?? ""
                let date = extractString(fields["date"]) ?? ""
                guard !id.isEmpty, !userId.isEmpty, !date.isEmpty else { continue }
                
                let startTime = extractString(fields["startTime"]) ?? "08:00"
                let endTime = extractString(fields["endTime"]) ?? "17:00"
                let breakMinutes = extractInt(fields["breakMinutes"]) ?? 30
                let siteDescription = extractString(fields["siteDescription"]) ?? "Allgemeine Arbeiten"
                let decimalHours = extractDouble(fields["decimalHours"]) ?? TimeCalculations.calculateDecimalHours(startTime: startTime, endTime: endTime, breakMinutes: breakMinutes)
                let notes = extractString(fields["notes"])
                let expenses = extractDouble(fields["expenses"]) ?? 0.0
                let fuelExpenses = extractDouble(fields["fuelExpenses"]) ?? 0.0
                let expenseNote = extractString(fields["expenseNote"])
                let photoData = extractString(fields["photoData"])
                
                let entry = TimeEntry(
                    id: id,
                    userId: userId,
                    date: date,
                    startTime: startTime,
                    endTime: endTime,
                    breakMinutes: breakMinutes,
                    siteDescription: siteDescription,
                    decimalHours: decimalHours,
                    notes: notes,
                    expenses: expenses,
                    fuelExpenses: fuelExpenses,
                    expenseNote: expenseNote,
                    photoData: photoData,
                    updatedAt: Date()
                )
                result.append(entry)
            }
            return result
        } catch {
            print("CloudSync fetchCloudEntries error: \(error)")
            return nil
        }
    }
    
    func pushEntry(_ entry: TimeEntry) async {
        guard let token = await getValidToken(),
              let url = URL(string: "\(baseUrl)/time_entries/\(entry.id)") else { return }
        
        var req = URLRequest(url: url)
        req.httpMethod = "PATCH"
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        var fields: [String: Any] = [
            "id": ["stringValue": entry.id],
            "userId": ["stringValue": entry.userId],
            "date": ["stringValue": entry.date],
            "startTime": ["stringValue": entry.startTime],
            "endTime": ["stringValue": entry.endTime],
            "breakMinutes": ["integerValue": "\(entry.breakMinutes)"],
            "siteDescription": ["stringValue": entry.siteDescription],
            "decimalHours": ["doubleValue": entry.decimalHours],
            "expenses": ["doubleValue": entry.expenses],
            "fuelExpenses": ["doubleValue": entry.fuelExpenses],
            "updatedAt": ["stringValue": ISO8601DateFormatter().string(from: entry.updatedAt)]
        ]
        if let notes = entry.notes {
            fields["notes"] = ["stringValue": notes]
        }
        if let expenseNote = entry.expenseNote {
            fields["expenseNote"] = ["stringValue": expenseNote]
        }
        if let photoData = entry.photoData, !photoData.isEmpty {
            fields["photoData"] = ["stringValue": photoData]
        }
        
        let payload: [String: Any] = ["fields": fields]
        req.httpBody = try? JSONSerialization.data(withJSONObject: payload)
        _ = try? await URLSession.shared.data(for: req)
    }
    
    func deleteCloudEntry(id: String) async {
        guard let token = await getValidToken(),
              let url = URL(string: "\(baseUrl)/time_entries/\(id)") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "DELETE"
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        _ = try? await URLSession.shared.data(for: req)
    }
    
    // MARK: - 3. MONTHLY SETTLEMENTS SYNC
    
    func fetchCloudSettlements() async -> [MonthlySettlement]? {
        guard let token = await getValidToken(),
              let url = URL(string: "\(baseUrl)/monthly_settlements?pageSize=300") else { return nil }
        
        var req = URLRequest(url: url)
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        do {
            let (data, _) = try await URLSession.shared.data(for: req)
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let docs = json["documents"] as? [[String: Any]] else {
                return []
            }
            
            var result: [MonthlySettlement] = []
            for doc in docs {
                guard let fields = doc["fields"] as? [String: [String: Any]] else { continue }
                let id = extractString(fields["id"]) ?? extractDocId(from: doc["name"] as? String)
                let userId = extractString(fields["userId"]) ?? ""
                let month = extractString(fields["month"]) ?? ""
                guard !userId.isEmpty, !month.isEmpty else { continue }
                
                let deposit = extractDouble(fields["deposit"]) ?? 0.0
                let operatingExpenses = extractDouble(fields["operatingExpenses"]) ?? 0.0
                let customClientRate = extractDouble(fields["customClientRate"])
                let customWorkerRate = extractDouble(fields["customWorkerRate"])
                let notes = extractString(fields["notes"])
                
                result.append(MonthlySettlement(
                    id: id.isEmpty ? "settlement_\(userId)_\(month)" : id,
                    userId: userId,
                    month: month,
                    deposit: deposit,
                    operatingExpenses: operatingExpenses,
                    customClientRate: customClientRate,
                    customWorkerRate: customWorkerRate,
                    notes: notes
                ))
            }
            return result
        } catch {
            print("CloudSync fetchCloudSettlements error: \(error)")
            return nil
        }
    }
    
    func pushSettlement(_ s: MonthlySettlement) async {
        let docId = s.id.isEmpty ? "settlement_\(s.userId)_\(s.month)" : s.id
        guard let token = await getValidToken(),
              let url = URL(string: "\(baseUrl)/monthly_settlements/\(docId)") else { return }
        
        var req = URLRequest(url: url)
        req.httpMethod = "PATCH"
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        var fields: [String: Any] = [
            "id": ["stringValue": docId],
            "userId": ["stringValue": s.userId],
            "month": ["stringValue": s.month],
            "deposit": ["doubleValue": s.deposit],
            "operatingExpenses": ["doubleValue": s.operatingExpenses]
        ]
        if let cr = s.customClientRate {
            fields["customClientRate"] = ["doubleValue": cr]
        }
        if let wr = s.customWorkerRate {
            fields["customWorkerRate"] = ["doubleValue": wr]
        }
        if let notes = s.notes {
            fields["notes"] = ["stringValue": notes]
        }
        
        let payload: [String: Any] = ["fields": fields]
        req.httpBody = try? JSONSerialization.data(withJSONObject: payload)
        _ = try? await URLSession.shared.data(for: req)
    }
    
    // MARK: - Firestore Field Parsers
    
    private func extractDocId(from name: String?) -> String {
        guard let name = name else { return "" }
        return name.components(separatedBy: "/").last ?? ""
    }
    
    private func extractString(_ dict: [String: Any]?) -> String? {
        return dict?["stringValue"] as? String
    }
    
    private func extractInt(_ dict: [String: Any]?) -> Int? {
        if let str = dict?["integerValue"] as? String, let val = Int(str) {
            return val
        }
        if let num = dict?["integerValue"] as? Int {
            return num
        }
        if let dbl = dict?["doubleValue"] as? Double {
            return Int(dbl)
        }
        return nil
    }
    
    private func extractDouble(_ dict: [String: Any]?) -> Double? {
        if let dbl = dict?["doubleValue"] as? Double {
            return dbl
        }
        if let str = dict?["integerValue"] as? String, let val = Double(str) {
            return val
        }
        if let num = dict?["integerValue"] as? Int {
            return Double(num)
        }
        return nil
    }
}

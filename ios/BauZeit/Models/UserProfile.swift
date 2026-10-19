import Foundation

enum UserRole: String, Codable {
    case owner = "owner"
    case member = "member"
    
    var title: String {
        switch self {
        case .owner: return "Inhaber (Owner)"
        case .member: return "Mitarbeiter"
        }
    }
}

struct UserProfile: Identifiable, Codable {
    let id: String
    var email: String
    var displayName: String
    var role: UserRole
    var workerRate: Double // e.g. 12.00 €/h
    var clientRate: Double // e.g. 35.00 €/h (Mitarbeiter AR)
    var phoneNumber: String?
    var createdAt: Date = Date()
    
    var isOwner: Bool {
        role == .owner
    }
}

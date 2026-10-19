import Foundation

struct TimeEntry: Identifiable, Codable {
    var id: String = UUID().uuidString
    var userId: String
    var date: String // "YYYY-MM-DD"
    var startTime: String // "08:00"
    var endTime: String // "17:00"
    var breakMinutes: Int // 0, 10, 30, 40
    var siteDescription: String
    var decimalHours: Double
    var notes: String?
    var updatedAt: Date = Date()
}

struct MonthlySettlement: Identifiable, Codable {
    var id: String
    var userId: String
    var month: String // "YYYY-MM"
    var deposit: Double // "Anzahlung", z. B. 208.50 €
    var operatingExpenses: Double // "Jasin Betriebskosten", z. B. 0.00 €
    var customClientRate: Double?
    var customWorkerRate: Double?
    var notes: String?
}

struct MonthlyCalculations {
    let totalHours: Double
    let clientTotalAmount: Double // Mitarbeiter AR: totalHours * clientRate (z.B. 2.712,50 €)
    let workerTotalAmount: Double // Mitarbeiter Lohn: totalHours * workerRate (z.B. 930,00 €)
    let deposit: Double // Anzahlung (z.B. 208,50 €)
    let operatingExpenses: Double // Jasin Betriebskosten (z.B. 0,00 €)
    let netPayout: Double // Endgültiger Gesamtlohn: workerTotalAmount - deposit (z.B. 721,50 €)
    let clientRate: Double
    let workerRate: Double
}

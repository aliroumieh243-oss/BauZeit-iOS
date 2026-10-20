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
    var expenses: Double = 0.0 // Geld ausgegeben (z. B. Material, Werkzeug, Einkauf)
    var fuelExpenses: Double = 0.0 // Benzingeld / Spritkosten
    var expenseNote: String? = nil // Notiz zu den Ausgaben (z. B. "Tanken Shell")
    var updatedAt: Date = Date()
    
    enum CodingKeys: String, CodingKey {
        case id, userId, date, startTime, endTime, breakMinutes, siteDescription, decimalHours, notes, expenses, fuelExpenses, expenseNote, updatedAt
    }
    
    init(
        id: String = UUID().uuidString,
        userId: String,
        date: String,
        startTime: String,
        endTime: String,
        breakMinutes: Int,
        siteDescription: String,
        decimalHours: Double,
        notes: String? = nil,
        expenses: Double = 0.0,
        fuelExpenses: Double = 0.0,
        expenseNote: String? = nil,
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.userId = userId
        self.date = date
        self.startTime = startTime
        self.endTime = endTime
        self.breakMinutes = breakMinutes
        self.siteDescription = siteDescription
        self.decimalHours = decimalHours
        self.notes = notes
        self.expenses = expenses
        self.fuelExpenses = fuelExpenses
        self.expenseNote = expenseNote
        self.updatedAt = updatedAt
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try container.decodeIfPresent(String.self, forKey: .id) ?? UUID().uuidString
        self.userId = try container.decode(String.self, forKey: .userId)
        self.date = try container.decode(String.self, forKey: .date)
        self.startTime = try container.decode(String.self, forKey: .startTime)
        self.endTime = try container.decode(String.self, forKey: .endTime)
        self.breakMinutes = try container.decode(Int.self, forKey: .breakMinutes)
        self.siteDescription = try container.decodeIfPresent(String.self, forKey: .siteDescription) ?? "Allgemeine Arbeiten"
        self.decimalHours = try container.decode(Double.self, forKey: .decimalHours)
        self.notes = try container.decodeIfPresent(String.self, forKey: .notes)
        self.expenses = try container.decodeIfPresent(Double.self, forKey: .expenses) ?? 0.0
        self.fuelExpenses = try container.decodeIfPresent(Double.self, forKey: .fuelExpenses) ?? 0.0
        self.expenseNote = try container.decodeIfPresent(String.self, forKey: .expenseNote)
        self.updatedAt = try container.decodeIfPresent(Date.self, forKey: .updatedAt) ?? Date()
    }
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
    let clientTotalAmount: Double // Kunden-Abrechnung AR: totalHours * clientRate
    let workerTotalAmount: Double // Grundlohn: totalHours * workerRate
    let totalExpenses: Double // Summe Auslagen / Material
    let totalFuelExpenses: Double // Summe Benzingeld
    let deposit: Double // Geleistete Anzahlung
    let operatingExpenses: Double // Jasin Betriebskosten
    let netPayout: Double // Endgültige Auszahlung: workerTotalAmount + totalExpenses + totalFuelExpenses - deposit
    let clientRate: Double
    let workerRate: Double
}

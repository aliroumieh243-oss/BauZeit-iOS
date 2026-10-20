import Foundation
import Combine

class TimeTrackingViewModel: ObservableObject {
    @Published var selectedMonth: String
    @Published var selectedWorkerId: String = ""
    @Published var allEntries: [TimeEntry] = []
    @Published var allSettlements: [MonthlySettlement] = []
    
    private let entriesKey = "bauzeit_ios_entries"
    private let settlementsKey = "bauzeit_ios_settlements"
    
    init() {
        // Standardmäßig auf den aktuellen Monat einstellen (z. B. "2026-10")
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM"
        self.selectedMonth = formatter.string(from: Date())
        
        loadData()
    }
    
    func loadData() {
        if let data = UserDefaults.standard.data(forKey: entriesKey),
           let decoded = try? JSONDecoder().decode([TimeEntry].self, from: data) {
            self.allEntries = decoded
        } else {
            self.allEntries = []
        }
        
        if let data = UserDefaults.standard.data(forKey: settlementsKey),
           let decoded = try? JSONDecoder().decode([MonthlySettlement].self, from: data) {
            self.allSettlements = decoded
        } else {
            self.allSettlements = []
        }
    }
    
    private func saveData() {
        if let encoded = try? JSONEncoder().encode(allEntries) {
            UserDefaults.standard.set(encoded, forKey: entriesKey)
        }
        if let encoded = try? JSONEncoder().encode(allSettlements) {
            UserDefaults.standard.set(encoded, forKey: settlementsKey)
        }
    }
    
    func getFilteredEntries(for userId: String, month: String) -> [TimeEntry] {
        allEntries
            .filter { $0.userId == userId && $0.date.hasPrefix(month) }
            .sorted { $0.date < $1.date }
    }
    
    func getSettlement(for userId: String, month: String) -> MonthlySettlement {
        if let found = allSettlements.first(where: { $0.userId == userId && $0.month == month }) {
            return found
        }
        return MonthlySettlement(
            id: "settlement_\(userId)_\(month)",
            userId: userId,
            month: month,
            deposit: 0.0,
            operatingExpenses: 0.0
        )
    }
    
    func saveEntry(
        id: String?,
        userId: String,
        date: String,
        startTime: String,
        endTime: String,
        breakMinutes: Int,
        siteDescription: String,
        notes: String?,
        expenses: Double = 0.0,
        fuelExpenses: Double = 0.0,
        expenseNote: String? = nil,
        photoData: String? = nil
    ) {
        let decimalHours = TimeCalculations.calculateDecimalHours(
            startTime: startTime,
            endTime: endTime,
            breakMinutes: breakMinutes
        )
        
        let entryId = id ?? UUID().uuidString
        let newEntry = TimeEntry(
            id: entryId,
            userId: userId,
            date: date,
            startTime: startTime,
            endTime: endTime,
            breakMinutes: breakMinutes,
            siteDescription: siteDescription.isEmpty ? "Allgemeine Arbeiten" : siteDescription,
            decimalHours: decimalHours,
            notes: notes,
            expenses: expenses,
            fuelExpenses: fuelExpenses,
            expenseNote: expenseNote,
            photoData: photoData,
            updatedAt: Date()
        )
        
        if let idx = allEntries.firstIndex(where: { $0.id == entryId }) {
            allEntries[idx] = newEntry
        } else if let idx = allEntries.firstIndex(where: { $0.userId == userId && $0.date == date }) {
            allEntries[idx] = newEntry
        } else {
            allEntries.append(newEntry)
        }
        
        saveData()
    }
    
    func deleteEntry(id: String) {
        allEntries.removeAll { $0.id == id }
        saveData()
    }
    
    func updateSettlement(userId: String, month: String, deposit: Double, operatingExpenses: Double, notes: String? = nil) {
        let settlementId = "settlement_\(userId)_\(month)"
        let updated = MonthlySettlement(
            id: settlementId,
            userId: userId,
            month: month,
            deposit: deposit,
            operatingExpenses: operatingExpenses,
            notes: notes
        )
        
        if let idx = allSettlements.firstIndex(where: { $0.userId == userId && $0.month == month }) {
            allSettlements[idx] = updated
        } else {
            allSettlements.append(updated)
        }
        
        saveData()
    }
}

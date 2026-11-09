import Foundation
import Combine

@MainActor
class TimeTrackingViewModel: ObservableObject {
    @Published var selectedMonth: String
    @Published var selectedWorkerId: String = ""
    @Published var allEntries: [TimeEntry] = []
    @Published var allSettlements: [MonthlySettlement] = []
    @Published var isSyncing: Bool = false
    
    private let entriesKey = "bauzeit_ios_entries"
    private let settlementsKey = "bauzeit_ios_settlements"
    private var syncTimer: Timer?
    
    init() {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM"
        self.selectedMonth = formatter.string(from: Date())
        
        loadData()
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
    
    /// Synchronisiert alle Zeiteinträge und Monatsabrechnungen bidirektional mit Firebase Cloud Firestore
    func syncWithCloud() async {
        isSyncing = true
        defer { isSyncing = false }
        
        async let cloudEntriesTask = CloudSyncManager.shared.fetchCloudEntries()
        async let cloudSettlementsTask = CloudSyncManager.shared.fetchCloudSettlements()
        
        let (fetchedEntries, fetchedSettlements) = await (cloudEntriesTask, cloudSettlementsTask)
        
        if let cloudEntries = fetchedEntries {
            var mergedEntries = cloudEntries
            for local in allEntries {
                if !mergedEntries.contains(where: { $0.id == local.id || ($0.userId == local.userId && $0.date == local.date) }) {
                    mergedEntries.append(local)
                    await CloudSyncManager.shared.pushEntry(local)
                }
            }
            self.allEntries = mergedEntries
        }
        
        if let cloudSettlements = fetchedSettlements {
            var mergedSettlements = cloudSettlements
            for local in allSettlements {
                if !mergedSettlements.contains(where: { $0.userId == local.userId && $0.month == local.month }) {
                    mergedSettlements.append(local)
                    await CloudSyncManager.shared.pushSettlement(local)
                }
            }
            self.allSettlements = mergedSettlements
        }
        
        saveData()
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
        
        let existingForDate = allEntries.first(where: { $0.userId == userId && $0.date == date })
        let entryId = id ?? existingForDate?.id ?? "entry_\(userId)_\(date)"
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
        Task {
            await CloudSyncManager.shared.pushEntry(newEntry)
        }
    }
    
    func deleteEntry(id: String) {
        allEntries.removeAll { $0.id == id }
        saveData()
        Task {
            await CloudSyncManager.shared.deleteCloudEntry(id: id)
        }
    }
    
    func updateSettlement(
        userId: String,
        month: String,
        deposit: Double,
        operatingExpenses: Double,
        customClientRate: Double? = nil,
        customWorkerRate: Double? = nil,
        notes: String? = nil
    ) {
        let settlementId = "settlement_\(userId)_\(month)"
        let existing = allSettlements.first(where: { $0.userId == userId && $0.month == month })
        let updated = MonthlySettlement(
            id: settlementId,
            userId: userId,
            month: month,
            deposit: deposit,
            operatingExpenses: operatingExpenses,
            customClientRate: customClientRate ?? existing?.customClientRate,
            customWorkerRate: customWorkerRate ?? existing?.customWorkerRate,
            notes: notes ?? existing?.notes
        )
        
        if let idx = allSettlements.firstIndex(where: { $0.userId == userId && $0.month == month }) {
            allSettlements[idx] = updated
        } else {
            allSettlements.append(updated)
        }
        
        saveData()
        Task {
            await CloudSyncManager.shared.pushSettlement(updated)
        }
    }
    
    // MARK: - Month Navigation Helpers
    
    func previousMonth() {
        let parts = selectedMonth.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 2 else { return }
        var year = parts[0]
        var month = parts[1] - 1
        if month < 1 {
            month = 12
            year -= 1
        }
        selectedMonth = String(format: "%04d-%02d", year, month)
    }
    
    func nextMonth() {
        let parts = selectedMonth.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 2 else { return }
        var year = parts[0]
        var month = parts[1] + 1
        if month > 12 {
            month = 1
            year += 1
        }
        selectedMonth = String(format: "%04d-%02d", year, month)
    }
    
    func formattedMonthTitle(for monthStr: String? = nil, isArabic: Bool = false) -> String {
        let target = monthStr ?? selectedMonth
        let parts = target.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 2 else { return target }
        let year = parts[0]
        let month = parts[1]
        
        let germanMonths = [
            "Januar", "Februar", "März", "April", "Mai", "Juni",
            "Juli", "August", "September", "Oktober", "November", "Dezember"
        ]
        let arabicMonths = [
            "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
            "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
        ]
        
        guard month >= 1 && month <= 12 else { return target }
        let name = isArabic ? arabicMonths[month - 1] : germanMonths[month - 1]
        return "\(name) \(year)"
    }
    
    func shortMonthLabel(for monthStr: String, isArabic: Bool = false) -> String {
        let parts = monthStr.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 2 else { return monthStr }
        let yearShort = String(parts[0]).suffix(2)
        let month = parts[1]
        let germanShort = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
        let arabicShort = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
        guard month >= 1 && month <= 12 else { return monthStr }
        let name = isArabic ? arabicShort[month - 1] : germanShort[month - 1]
        return "\(name) '\(yearShort)"
    }
    
    var quickSelectableMonths: [String] {
        let parts = selectedMonth.split(separator: "-").compactMap { Int($0) }
        let currentYear = parts.first ?? 2026
        var months: [String] = []
        for m in 1...12 {
            months.append(String(format: "%04d-%02d", currentYear, m))
        }
        return months
    }
}

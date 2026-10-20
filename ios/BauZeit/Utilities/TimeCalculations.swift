import Foundation

enum TimeCalculations {
    
    /// Berechnet exakt die Dezimalstunden: (Ende - Beginn - Pause)
    /// Beispiel: 08:00 bis 17:00 mit 30 Min. Pause = 510 Min. = 8.50 Dezimalstunden.
    static func calculateDecimalHours(startTime: String, endTime: String, breakMinutes: Int) -> Double {
        let startParts = startTime.split(separator: ":").compactMap { Int($0) }
        let endParts = endTime.split(separator: ":").compactMap { Int($0) }
        
        guard startParts.count == 2, endParts.count == 2 else { return 0.0 }
        
        let startMinutes = startParts[0] * 60 + startParts[1]
        var endMinutes = endParts[0] * 60 + endParts[1]
        
        if endMinutes < startMinutes {
            endMinutes += 24 * 60
        }
        
        let workedMinutes = endMinutes - startMinutes - breakMinutes
        if workedMinutes <= 0 { return 0.0 }
        
        let decimal = Double(workedMinutes) / 60.0
        return (decimal * 100).rounded() / 100.0
    }
    
    static func formatHours(_ hours: Double) -> String {
        let formatter = NumberFormatter()
        formatter.locale = Locale(identifier: "de_DE")
        formatter.minimumFractionDigits = 2
        formatter.maximumFractionDigits = 2
        return formatter.string(from: NSNumber(value: hours)) ?? String(format: "%.2f", hours)
    }
    
    static func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.locale = Locale(identifier: "de_DE")
        formatter.numberStyle = .currency
        formatter.currencyCode = "EUR"
        return formatter.string(from: NSNumber(value: amount)) ?? String(format: "%.2f €", amount)
    }
    
    static func calculateSettlement(
        entries: [TimeEntry],
        clientRate: Double = 35.0,
        workerRate: Double = 12.0,
        deposit: Double = 0.0,
        operatingExpenses: Double = 0.0
    ) -> MonthlyCalculations {
        let totalHours = entries.reduce(0.0) { $0 + $1.decimalHours }
        let roundedHours = (totalHours * 100).rounded() / 100.0
        
        let clientTotal = ((roundedHours * clientRate) * 100).rounded() / 100.0
        let workerTotal = ((roundedHours * workerRate) * 100).rounded() / 100.0
        
        let totalExpenses = entries.reduce(0.0) { $0 + $1.expenses }
        let totalFuelExpenses = entries.reduce(0.0) { $0 + $1.fuelExpenses }
        
        // Endgültige Auszahlung: Lohn + Auslagen-Erstattung + Benzingeld-Erstattung - Anzahlung
        let netPayout = (((workerTotal + totalExpenses + totalFuelExpenses - deposit)) * 100).rounded() / 100.0
        
        return MonthlyCalculations(
            totalHours: roundedHours,
            clientTotalAmount: clientTotal,
            workerTotalAmount: workerTotal,
            totalExpenses: totalExpenses,
            totalFuelExpenses: totalFuelExpenses,
            deposit: deposit,
            operatingExpenses: operatingExpenses,
            netPayout: netPayout,
            clientRate: clientRate,
            workerRate: workerRate
        )
    }
}

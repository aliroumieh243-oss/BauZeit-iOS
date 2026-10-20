import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

struct WorkerSummaryView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var timeVM: TimeTrackingViewModel
    
    var currentUser: UserProfile? {
        authVM.currentUser
    }
    
    var userEntries: [TimeEntry] {
        guard let u = currentUser else { return [] }
        return timeVM.getFilteredEntries(for: u.id, month: timeVM.selectedMonth)
    }
    
    var userSettlement: MonthlySettlement {
        guard let u = currentUser else {
            return MonthlySettlement(id: "", userId: "", month: timeVM.selectedMonth, deposit: 0, operatingExpenses: 0)
        }
        return timeVM.getSettlement(for: u.id, month: timeVM.selectedMonth)
    }
    
    var calculations: MonthlyCalculations {
        let u = currentUser
        let workerRate = userSettlement.customWorkerRate ?? u?.workerRate ?? 12.0
        return TimeCalculations.calculateSettlement(
            entries: userEntries,
            clientRate: u?.clientRate ?? 35.0,
            workerRate: workerRate,
            deposit: userSettlement.deposit,
            operatingExpenses: userSettlement.operatingExpenses
        )
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Header
                VStack(alignment: .leading, spacing: 4) {
                    Text("Monatsabrechnung (\(timeVM.selectedMonth))")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                        .textCase(.uppercase)
                    Text("Deine Lohnübersicht")
                        .font(.title2)
                        .fontWeight(.heavy)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)
                .padding(.top, 12)
                
                // Hauptkarte
                VStack(spacing: 16) {
                    HStack(spacing: 12) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Geleistete Stunden")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.blue)
                            Text("\(TimeCalculations.formatHours(calculations.totalHours)) h")
                                .font(.title)
                                .fontWeight(.black)
                            Text("\(userEntries.count) Einsatztage")
                                .font(.system(size: 11))
                                .foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(14)
                        .background(Color.blue.opacity(0.08))
                        .cornerRadius(16)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Dein Stundenlohn")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.green)
                            Text(TimeCalculations.formatCurrency(calculations.workerRate))
                                .font(.title)
                                .fontWeight(.black)
                            Text("pro Stunde")
                                .font(.system(size: 11))
                                .foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(14)
                        .background(Color.green.opacity(0.08))
                        .cornerRadius(16)
                    }
                    
                    Divider()
                    
                    // Detaillierte Posten
                    VStack(spacing: 10) {
                        HStack {
                            Text("Grundlohn:")
                                .font(.footnote)
                                .foregroundColor(.secondary)
                            Spacer()
                            Text(TimeCalculations.formatCurrency(calculations.workerTotalAmount))
                                .font(.footnote)
                                .fontWeight(.bold)
                        }
                        
                        // Benzingeld Erstattung
                        if calculations.totalFuelExpenses > 0 {
                            HStack {
                                HStack(spacing: 4) {
                                    Image(systemName: "fuelpump.fill").foregroundColor(.orange).font(.caption2)
                                    Text("Benzingeld-Erstattung:")
                                }
                                .font(.footnote)
                                .foregroundColor(.secondary)
                                Spacer()
                                Text("+ \(TimeCalculations.formatCurrency(calculations.totalFuelExpenses))")
                                    .font(.footnote)
                                    .fontWeight(.bold)
                                    .foregroundColor(.orange)
                            }
                        }
                        
                        // Auslagen / Material Erstattung
                        if calculations.totalExpenses > 0 {
                            HStack {
                                HStack(spacing: 4) {
                                    Image(systemName: "banknote.fill").foregroundColor(.green).font(.caption2)
                                    Text("Material / Auslagen-Erstattung:")
                                }
                                .font(.footnote)
                                .foregroundColor(.secondary)
                                Spacer()
                                Text("+ \(TimeCalculations.formatCurrency(calculations.totalExpenses))")
                                    .font(.footnote)
                                    .fontWeight(.bold)
                                    .foregroundColor(.green)
                            }
                        }
                        
                        // Anzahlung
                        if calculations.deposit > 0 {
                            HStack {
                                Text("Bereits erhaltene Anzahlung:")
                                    .font(.footnote)
                                    .foregroundColor(.secondary)
                                Spacer()
                                Text("- \(TimeCalculations.formatCurrency(calculations.deposit))")
                                    .font(.footnote)
                                    .fontWeight(.bold)
                                    .foregroundColor(.red)
                            }
                        }
                        
                        Divider()
                        
                        HStack {
                            VStack(alignment: .leading, spacing: 1) {
                                Text("Endgültiger Gesamtlohn")
                                    .font(.subheadline)
                                    .fontWeight(.bold)
                                Text("Auszahlungsbetrag")
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                            }
                            Spacer()
                            Text(TimeCalculations.formatCurrency(calculations.netPayout))
                                .font(.title)
                                .fontWeight(.black)
                                .foregroundColor(.green)
                        }
                    }
                }
                .padding(18)
                .background(Color.cardBackground)
                .cornerRadius(22)
                .shadow(color: .black.opacity(0.05), radius: 8, y: 4)
                .padding(.horizontal, 16)
                
                // Einsätze des Monats
                VStack(alignment: .leading, spacing: 8) {
                    Text("Alle Einsätze in diesem Monat (\(userEntries.count))")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.secondary)
                        .textCase(.uppercase)
                        .padding(.horizontal, 16)
                    
                    if userEntries.isEmpty {
                        Text("Noch keine Arbeitszeiten für diesen Monat eingetragen.")
                            .font(.footnote)
                            .foregroundColor(.secondary)
                            .padding(16)
                            .frame(maxWidth: .infinity)
                            .background(Color.cardBackground)
                            .cornerRadius(16)
                            .padding(.horizontal, 16)
                    } else {
                        VStack(spacing: 6) {
                            ForEach(userEntries) { entry in
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("\(entry.date): \(entry.startTime) – \(entry.endTime) Uhr")
                                            .font(.footnote)
                                            .fontWeight(.bold)
                                        Text(entry.siteDescription)
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                            .lineLimit(1)
                                    }
                                    Spacer()
                                    VStack(alignment: .trailing, spacing: 2) {
                                        Text("\(TimeCalculations.formatHours(entry.decimalHours)) h")
                                            .font(.caption)
                                            .fontWeight(.bold)
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 3)
                                            .background(Color.green.opacity(0.12))
                                            .foregroundColor(.green)
                                            .cornerRadius(6)
                                        
                                        if entry.fuelExpenses > 0 || entry.expenses > 0 {
                                            Text("+ \(TimeCalculations.formatCurrency(entry.fuelExpenses + entry.expenses)) Spesen")
                                                .font(.system(size: 9, weight: .semibold))
                                                .foregroundColor(.orange)
                                        }
                                    }
                                }
                                .padding(12)
                                .background(Color.cardBackground)
                                .cornerRadius(12)
                            }
                        }
                        .padding(.horizontal, 16)
                    }
                }
            }
            .padding(.bottom, 24)
        }
        .background(Color.appBackground)
    }
}

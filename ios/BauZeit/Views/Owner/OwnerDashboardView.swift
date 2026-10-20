import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

struct OwnerDashboardView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var timeVM: TimeTrackingViewModel
    @EnvironmentObject var lang: LanguageManager
    
    @State private var selectedWorkerId: String = ""
    @State private var isAddWorkerPresented: Bool = false
    @State private var isEditingSettlement: Bool = false
    @State private var isMonthlyDocPresented: Bool = false
    
    @State private var depositText: String = "0"
    @State private var operatingText: String = "0"
    
    var workers: [UserProfile] {
        authVM.users.filter { $0.role == .member }
    }
    
    var activeWorker: UserProfile? {
        workers.first(where: { $0.id == selectedWorkerId }) ?? workers.first
    }
    
    var activeWorkerEntries: [TimeEntry] {
        guard let w = activeWorker else { return [] }
        return timeVM.getFilteredEntries(for: w.id, month: timeVM.selectedMonth)
    }
    
    var currentSettlement: MonthlySettlement? {
        guard let w = activeWorker else { return nil }
        return timeVM.getSettlement(for: w.id, month: timeVM.selectedMonth)
    }
    
    var calculations: MonthlyCalculations {
        let w = activeWorker
        let clientRate = currentSettlement?.customClientRate ?? w?.clientRate ?? 35.0
        let workerRate = currentSettlement?.customWorkerRate ?? w?.workerRate ?? 12.0
        let deposit = currentSettlement?.deposit ?? 0.0
        let operating = currentSettlement?.operatingExpenses ?? 0.0
        
        return TimeCalculations.calculateSettlement(
            entries: activeWorkerEntries,
            clientRate: clientRate,
            workerRate: workerRate,
            deposit: deposit,
            operatingExpenses: operating
        )
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                
                // MARK: - Header & Worker Selector
                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("\(lang.text("Inhaber-Übersicht")) (\(timeVM.selectedMonth))")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.orange)
                                .textCase(.uppercase)
                            Text(lang.text("Abrechnung & Finanzen"))
                                .font(.title2)
                                .fontWeight(.heavy)
                        }
                        Spacer()
                        Button(action: { isAddWorkerPresented = true }) {
                            Label(lang.text("Arbeiter"), systemImage: "person.badge.plus")
                                .font(.caption)
                                .fontWeight(.bold)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                        }
                    }
                    
                    if workers.isEmpty {
                        Text("Noch keine Mitarbeiter angelegt. Tippe oben auf '+ Arbeiter'.")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .padding(.vertical, 8)
                    } else {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(workers) { worker in
                                    Button(action: {
                                        #if canImport(UIKit)
                                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                        #endif
                                        selectedWorkerId = worker.id
                                    }) {
                                        HStack(spacing: 6) {
                                            Circle()
                                                .fill(Color.blue.opacity(0.2))
                                                .frame(width: 20, height: 20)
                                                .overlay(Text(String(worker.displayName.prefix(1))).font(.system(size: 10, weight: .bold)))
                                            Text(worker.displayName)
                                                .font(.caption)
                                                .fontWeight(.bold)
                                        }
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 8)
                                        .background((activeWorker?.id == worker.id) ? Color.blue : Color.fieldBackground)
                                        .foregroundColor((activeWorker?.id == worker.id) ? .white : .primary)
                                        .cornerRadius(12)
                                    }
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 12)
                
                // MARK: - KI-Monatsdokument & Tabellen-Export Banner
                Button(action: {
                    #if canImport(UIKit)
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                    #endif
                    isMonthlyDocPresented = true
                }) {
                    HStack(spacing: 12) {
                        Circle()
                            .fill(Color.white.opacity(0.2))
                            .frame(width: 38, height: 38)
                            .overlay(Image(systemName: "sparkles").foregroundColor(.white).font(.system(size: 18, weight: .bold)))
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text(lang.isArabic ? "تقرير وتصدير الجدول الذكي" : "KI-Monatsdokument & Tabellen-Export")
                                .font(.subheadline)
                                .fontWeight(.bold)
                            Text(lang.isArabic ? "جاهز للنقل المباشر إلى الإكسل أو الجداول" : "Alle Daten fertig vorbereitet für Excel / Tabelle")
                                .font(.caption2)
                                .opacity(0.9)
                        }
                        Spacer()
                        Image(systemName: lang.isArabic ? "chevron.left" : "chevron.right")
                            .font(.footnote)
                            .opacity(0.8)
                    }
                    .padding(14)
                    .background(LinearGradient(colors: [Color.blue, Color.purple], startPoint: .leading, endPoint: .trailing))
                    .foregroundColor(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .shadow(color: Color.blue.opacity(0.3), radius: 8, y: 3)
                }
                .padding(.horizontal, 16)
                
                // MARK: - Financial Card
                if let worker = activeWorker {
                    VStack(alignment: .leading, spacing: 14) {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("\(lang.text("Monatsabrechnung")) \(timeVM.selectedMonth)")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(.secondary)
                                    .textCase(.uppercase)
                                Text(worker.displayName)
                                    .font(.headline)
                                    .fontWeight(.bold)
                            }
                            Spacer()
                            Button(action: {
                                if isEditingSettlement {
                                    saveSettlement()
                                } else {
                                    depositText = String(format: "%.2f", currentSettlement?.deposit ?? 0.0)
                                    operatingText = String(format: "%.2f", currentSettlement?.operatingExpenses ?? 0.0)
                                    isEditingSettlement = true
                                }
                            }) {
                                Text(isEditingSettlement ? lang.text("Fertig") : (lang.isArabic ? "تعديل السلفة" : "Anzahlung / Kosten"))
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 5)
                                    .background(Color.fieldBackground)
                                    .cornerRadius(8)
                            }
                        }
                        
                        Divider()
                        
                        // Highlights: AR vs Worker
                        HStack(spacing: 12) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("\(lang.text("Kunden-Abrechnung AR")) (\(TimeCalculations.formatCurrency(calculations.clientRate))/h)")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(.blue)
                                Text(TimeCalculations.formatCurrency(calculations.clientTotalAmount))
                                    .font(.title3)
                                    .fontWeight(.black)
                                Text("\(TimeCalculations.formatHours(calculations.totalHours)) h")
                                    .font(.system(size: 10))
                                    .foregroundColor(.secondary)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(12)
                            .background(Color.blue.opacity(0.08))
                            .cornerRadius(14)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text("\(lang.text("Mitarbeiter-Lohn")) (\(TimeCalculations.formatCurrency(calculations.workerRate))/h)")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(.green)
                                Text(TimeCalculations.formatCurrency(calculations.workerTotalAmount))
                                    .font(.title3)
                                    .fontWeight(.black)
                                Text(lang.isArabic ? "الراتب الأساسي" : "Grundlohn vor Spesen")
                                    .font(.system(size: 10))
                                    .foregroundColor(.secondary)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(12)
                            .background(Color.green.opacity(0.08))
                            .cornerRadius(14)
                        }
                        
                        // Aufschlüsselung inklusive Benzin und Auslagen
                        VStack(spacing: 8) {
                            HStack {
                                Text(lang.text("Geleistete Monatsstunden:"))
                                    .font(.footnote)
                                    .foregroundColor(.secondary)
                                Spacer()
                                Text("\(TimeCalculations.formatHours(calculations.totalHours)) \(lang.text("Std."))")
                                    .font(.footnote)
                                    .fontWeight(.bold)
                            }
                            
                            // Benzingeld
                            if calculations.totalFuelExpenses > 0 {
                                HStack {
                                    HStack(spacing: 4) {
                                        Image(systemName: "fuelpump.fill").foregroundColor(.orange).font(.caption2)
                                        Text(lang.text("Erstattung Benzingeld:"))
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
                            
                            // Material & Auslagen
                            if calculations.totalExpenses > 0 {
                                HStack {
                                    HStack(spacing: 4) {
                                        Image(systemName: "banknote.fill").foregroundColor(.green).font(.caption2)
                                        Text(lang.text("Erstattung Material / Auslagen:"))
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
                            HStack {
                                Text(lang.text("Geleistete Anzahlung (Abzug):"))
                                    .font(.footnote)
                                    .foregroundColor(.secondary)
                                Spacer()
                                if isEditingSettlement {
                                    TextField("0.00", text: $depositText)
                                        .frame(width: 80)
                                        .multilineTextAlignment(.trailing)
                                        #if os(iOS)
                                        .keyboardType(.decimalPad)
                                        .textFieldStyle(RoundedBorderTextFieldStyle())
                                        #endif
                                } else {
                                    Text("- \(TimeCalculations.formatCurrency(calculations.deposit))")
                                        .font(.footnote)
                                        .fontWeight(.bold)
                                        .foregroundColor(.red)
                                }
                            }
                            
                            // Betriebskosten
                            HStack {
                                Text(lang.text("Jasin Betriebskosten:"))
                                    .font(.footnote)
                                    .foregroundColor(.secondary)
                                Spacer()
                                if isEditingSettlement {
                                    TextField("0.00", text: $operatingText)
                                        .frame(width: 80)
                                        .multilineTextAlignment(.trailing)
                                        #if os(iOS)
                                        .keyboardType(.decimalPad)
                                        .textFieldStyle(RoundedBorderTextFieldStyle())
                                        #endif
                                } else {
                                    Text(TimeCalculations.formatCurrency(calculations.operatingExpenses))
                                        .font(.footnote)
                                        .fontWeight(.bold)
                                }
                            }
                            
                            Divider()
                            
                            HStack {
                                VStack(alignment: .leading, spacing: 1) {
                                    Text(lang.text("Endgültiger Gesamtlohn"))
                                        .font(.footnote)
                                        .fontWeight(.bold)
                                    Text(lang.text("Inkl. Spesen & nach Anzahlung"))
                                        .font(.system(size: 10))
                                        .foregroundColor(.secondary)
                                }
                                Spacer()
                                Text(TimeCalculations.formatCurrency(calculations.netPayout))
                                    .font(.title2)
                                    .fontWeight(.black)
                                    .foregroundColor(.green)
                            }
                            .padding(.top, 4)
                        }
                    }
                    .padding(16)
                    .background(Color.cardBackground)
                    .cornerRadius(20)
                    .shadow(color: .black.opacity(0.05), radius: 8, y: 4)
                    .padding(.horizontal, 16)
                    
                    // Einsätze-Liste
                    VStack(alignment: .leading, spacing: 8) {
                        Text("\(lang.text("Erfasste Einsätze")) (\(activeWorkerEntries.count))")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.secondary)
                            .textCase(.uppercase)
                            .padding(.horizontal, 16)
                        
                        if activeWorkerEntries.isEmpty {
                            Text(lang.isArabic ? "لا توجد ساعات عمل مسجلة لهذا الشهر حتى الآن." : "Noch keine Arbeitszeiten für diesen Monat eingetragen.")
                                .font(.footnote)
                                .foregroundColor(.secondary)
                                .padding(16)
                                .frame(maxWidth: .infinity)
                                .background(Color.cardBackground)
                                .cornerRadius(16)
                                .padding(.horizontal, 16)
                        } else {
                            VStack(spacing: 6) {
                                ForEach(activeWorkerEntries) { entry in
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
                                                Text("+ \(TimeCalculations.formatCurrency(entry.fuelExpenses + entry.expenses))")
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
            }
            .padding(.bottom, 24)
        }
        .background(Color.appBackground)
        .sheet(isPresented: $isAddWorkerPresented) {
            AddWorkerSheet()
        }
        .sheet(isPresented: $isMonthlyDocPresented) {
            MonthlyDocumentView()
        }
    }
    
    private func saveSettlement() {
        guard let w = activeWorker else { return }
        let dep = Double(depositText.replacingOccurrences(of: ",", with: ".")) ?? 0.0
        let op = Double(operatingText.replacingOccurrences(of: ",", with: ".")) ?? 0.0
        timeVM.updateSettlement(userId: w.id, month: timeVM.selectedMonth, deposit: dep, operatingExpenses: op)
        isEditingSettlement = false
    }
}

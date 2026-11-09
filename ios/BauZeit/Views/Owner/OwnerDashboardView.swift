import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

struct OwnerSelectedDayItem: Identifiable {
    let id = UUID()
    let dateStr: String
    let formattedDate: String
    let userId: String
    let existingEntry: TimeEntry?
}

struct OwnerDashboardView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var timeVM: TimeTrackingViewModel
    @EnvironmentObject var lang: LanguageManager
    
    // "ALL" = Gesamtübersicht über alle Mitarbeiter, sonst worker.id
    @State private var viewModeWorkerId: String = ""
    @State private var isAddWorkerPresented: Bool = false
    @State private var isEditingSettlement: Bool = false
    @State private var isMonthlyDocPresented: Bool = false
    @State private var viewedPhotoEntry: TimeEntry? = nil
    @State private var editingDayItem: OwnerSelectedDayItem? = nil
    
    // Bearbeitbare Felder für die Monatsabrechnung
    @State private var workerNameText: String = ""
    @State private var workerRateText: String = "12.00"
    @State private var clientRateText: String = "35.00"
    @State private var depositText: String = "0.00"
    @State private var operatingText: String = "0.00"
    @State private var settlementNotesText: String = ""
    
    var workers: [UserProfile] {
        authVM.users.filter { $0.role == .member }
    }
    
    var isAllWorkersMode: Bool {
        viewModeWorkerId == "ALL"
    }
    
    var activeWorker: UserProfile? {
        if viewModeWorkerId == "ALL" { return nil }
        return workers.first(where: { $0.id == viewModeWorkerId }) ?? workers.first
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
    
    // Gesamt-Berechnung über alle Mitarbeiter für den gewählten Monat
    var allWorkersSummary: (hours: Double, clientAR: Double, baseWage: Double, fuel: Double, expenses: Double, deposit: Double, operating: Double, netPayout: Double, entryCount: Int) {
        var hours = 0.0
        var clientAR = 0.0
        var baseWage = 0.0
        var fuel = 0.0
        var expenses = 0.0
        var deposit = 0.0
        var operating = 0.0
        var netPayout = 0.0
        var count = 0
        
        for w in workers {
            let entries = timeVM.getFilteredEntries(for: w.id, month: timeVM.selectedMonth)
            let s = timeVM.getSettlement(for: w.id, month: timeVM.selectedMonth)
            let calc = TimeCalculations.calculateSettlement(
                entries: entries,
                clientRate: s.customClientRate ?? w.clientRate,
                workerRate: s.customWorkerRate ?? w.workerRate,
                deposit: s.deposit,
                operatingExpenses: s.operatingExpenses
            )
            hours += calc.totalHours
            clientAR += calc.clientTotalAmount
            baseWage += calc.workerTotalAmount
            fuel += calc.totalFuelExpenses
            expenses += calc.totalExpenses
            deposit += calc.deposit
            operating += calc.operatingExpenses
            netPayout += calc.netPayout
            count += entries.count
        }
        return (hours, clientAR, baseWage, fuel, expenses, deposit, operating, netPayout, count)
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                
                // MARK: - 1. Monats- & Mitarbeiter-Umschalter Card
                VStack(alignment: .leading, spacing: 12) {
                    // Titelzeile + "+ Arbeiter"
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(lang.text("Inhaber-Übersicht"))
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.orange)
                                .textCase(.uppercase)
                            Text(lang.text("Abrechnung & Finanzen"))
                                .font(.title3)
                                .fontWeight(.heavy)
                        }
                        Spacer()
                        Button(action: { isAddWorkerPresented = true }) {
                            Label(lang.text("Arbeiter"), systemImage: "person.badge.plus")
                                .font(.caption)
                                .fontWeight(.bold)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 7)
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                        }
                    }
                    
                    // Monats-Umschalter (< Monat Jahr >)
                    HStack {
                        Button(action: {
                            #if canImport(UIKit)
                            UIImpactFeedbackGenerator(style: .light).impactOccurred()
                            #endif
                            isEditingSettlement = false
                            timeVM.previousMonth()
                        }) {
                            Image(systemName: lang.isArabic ? "chevron.right" : "chevron.left")
                                .font(.system(size: 14, weight: .bold))
                                .frame(width: 36, height: 36)
                                .background(Color.fieldBackground)
                                .foregroundColor(.primary)
                                .cornerRadius(10)
                        }
                        
                        Spacer()
                        
                        VStack(spacing: 1) {
                            Text(lang.isArabic ? "شهر المحاسبة" : "ABRECHNUNGSMONAT")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(.secondary)
                            Text(timeVM.formattedMonthTitle(isArabic: lang.isArabic))
                                .font(.headline)
                                .fontWeight(.black)
                        }
                        
                        Spacer()
                        
                        Button(action: {
                            #if canImport(UIKit)
                            UIImpactFeedbackGenerator(style: .light).impactOccurred()
                            #endif
                            isEditingSettlement = false
                            timeVM.nextMonth()
                        }) {
                            Image(systemName: lang.isArabic ? "chevron.left" : "chevron.right")
                                .font(.system(size: 14, weight: .bold))
                                .frame(width: 36, height: 36)
                                .background(Color.fieldBackground)
                                .foregroundColor(.primary)
                                .cornerRadius(10)
                        }
                    }
                    .padding(8)
                    .background(Color.fieldBackground.opacity(0.5))
                    .cornerRadius(14)
                    
                    // Schnell-Auswahl Leiste für Monate
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 6) {
                            ForEach(timeVM.quickSelectableMonths, id: \.self) { mStr in
                                let isSelected = (timeVM.selectedMonth == mStr)
                                Button(action: {
                                    #if canImport(UIKit)
                                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                    #endif
                                    isEditingSettlement = false
                                    timeVM.selectedMonth = mStr
                                }) {
                                    Text(timeVM.shortMonthLabel(for: mStr, isArabic: lang.isArabic))
                                        .font(.system(size: 11, weight: isSelected ? .bold : .medium))
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 6)
                                        .background(isSelected ? Color.orange : Color.fieldBackground)
                                        .foregroundColor(isSelected ? .white : .secondary)
                                        .cornerRadius(8)
                                }
                            }
                        }
                    }
                    
                    Divider()
                    
                    // Mitarbeiter-Wechsler inkl. "Alle (Gesamt)"
                    if workers.isEmpty {
                        Text(lang.isArabic ? "لم يتم إضافة عمال بعد. اضغط على '+ عامل' في الأعلى." : "Noch keine Mitarbeiter angelegt. Tippe oben auf '+ Arbeiter'.")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .padding(.vertical, 6)
                    } else {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                // Chip 0: Alle Mitarbeiter (Gesamtübersicht)
                                Button(action: {
                                    #if canImport(UIKit)
                                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                    #endif
                                    isEditingSettlement = false
                                    viewModeWorkerId = "ALL"
                                }) {
                                    HStack(spacing: 6) {
                                        Image(systemName: "chart.bar.doc.horizontal.fill")
                                            .font(.system(size: 11, weight: .bold))
                                        Text(lang.isArabic ? "الكل (\(workers.count))" : "Alle (\(workers.count))")
                                            .font(.caption)
                                            .fontWeight(.bold)
                                    }
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .background(isAllWorkersMode ? Color.purple : Color.fieldBackground)
                                    .foregroundColor(isAllWorkersMode ? .white : .primary)
                                    .cornerRadius(12)
                                }
                                
                                // Einzelne Mitarbeiter Chips mit Monatsstunden-Badge
                                ForEach(workers) { worker in
                                    let wHours = timeVM.getFilteredEntries(for: worker.id, month: timeVM.selectedMonth)
                                        .reduce(0.0) { $0 + $1.decimalHours }
                                    let isSelected = (!isAllWorkersMode && activeWorker?.id == worker.id)
                                    
                                    Button(action: {
                                        #if canImport(UIKit)
                                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                        #endif
                                        isEditingSettlement = false
                                        viewModeWorkerId = worker.id
                                        timeVM.selectedWorkerId = worker.id
                                    }) {
                                        HStack(spacing: 6) {
                                            Circle()
                                                .fill(isSelected ? Color.white.opacity(0.25) : Color.blue.opacity(0.2))
                                                .frame(width: 20, height: 20)
                                                .overlay(
                                                    Text(String(worker.displayName.prefix(1)))
                                                        .font(.system(size: 10, weight: .bold))
                                                )
                                            Text(worker.displayName)
                                                .font(.caption)
                                                .fontWeight(.bold)
                                            Text("(\(TimeCalculations.formatHours(wHours))h)")
                                                .font(.system(size: 10, weight: .semibold))
                                                .opacity(0.85)
                                        }
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 8)
                                        .background(isSelected ? Color.blue : Color.fieldBackground)
                                        .foregroundColor(isSelected ? .white : .primary)
                                        .cornerRadius(12)
                                    }
                                }
                            }
                        }
                    }
                }
                .padding(16)
                .background(Color.cardBackground)
                .cornerRadius(20)
                .shadow(color: .black.opacity(0.05), radius: 8, y: 4)
                .padding(.horizontal, 16)
                .padding(.top, 8)
                
                // MARK: - 2. KI-Monatsdokument & Echte Tabellen-Export Banner
                Button(action: {
                    #if canImport(UIKit)
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                    #endif
                    isMonthlyDocPresented = true
                }) {
                    HStack(spacing: 12) {
                        Circle()
                            .fill(Color.white.opacity(0.2))
                            .frame(width: 40, height: 40)
                            .overlay(Image(systemName: "tablecells.fill").foregroundColor(.white).font(.system(size: 18, weight: .bold)))
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text(lang.isArabic ? "تقرير وتصدير الجدول الحقيقي (.xls / CSV)" : "KI-Monatsdokument & Echte Tabelle")
                                .font(.subheadline)
                                .fontWeight(.bold)
                            Text(lang.isArabic ? "جدول منسق بالكامل للإكسل والطباعة" : "Strukturierte Tabelle ansehen & als Excel (.xls) / CSV teilen")
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
                
                // MARK: - 3A. Modus "Alle Mitarbeiter (Gesamtübersicht)"
                if isAllWorkersMode {
                    let tot = allWorkersSummary
                    VStack(alignment: .leading, spacing: 14) {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(lang.isArabic ? "ملخص الشركة الكامل" : "GESAMTBETRIEB • MONATSÜBERSICHT")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(.purple)
                                Text("\(timeVM.formattedMonthTitle(isArabic: lang.isArabic)) (\(workers.count) \(lang.isArabic ? "عمال" : "Mitarbeiter"))")
                                    .font(.headline)
                                    .fontWeight(.bold)
                            }
                            Spacer()
                            Text("\(TimeCalculations.formatHours(tot.hours)) h")
                                .font(.subheadline)
                                .fontWeight(.black)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 5)
                                .background(Color.purple.opacity(0.12))
                                .foregroundColor(.purple)
                                .cornerRadius(8)
                        }
                        
                        Divider()
                        
                        HStack(spacing: 12) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(lang.isArabic ? "إجمالي حساب العملاء AR" : "Kunden-AR Gesamt")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(.blue)
                                Text(TimeCalculations.formatCurrency(tot.clientAR))
                                    .font(.title3)
                                    .fontWeight(.black)
                                Text("\(tot.entryCount) \(lang.isArabic ? "إدخالات" : "Einsatztage")")
                                    .font(.system(size: 10))
                                    .foregroundColor(.secondary)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(12)
                            .background(Color.blue.opacity(0.08))
                            .cornerRadius(14)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(lang.isArabic ? "إجمالي صافي الرواتب" : "Auszahlung Gesamt")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(.green)
                                Text(TimeCalculations.formatCurrency(tot.netPayout))
                                    .font(.title3)
                                    .fontWeight(.black)
                                Text(lang.isArabic ? "شامل المصاريف والسلف" : "Inkl. Spesen & nach Anzahlung")
                                    .font(.system(size: 10))
                                    .foregroundColor(.secondary)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(12)
                            .background(Color.green.opacity(0.08))
                            .cornerRadius(14)
                        }
                        
                        // Vergleichs-Liste aller Mitarbeiter zum direkten Anklicken & Bearbeiten
                        VStack(alignment: .leading, spacing: 8) {
                            Text(lang.isArabic ? "اضغط على أي عامل لتعديل محاسبته:" : "Mitarbeiter-Abrechnungen (Antippen zum Bearbeiten):")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.secondary)
                                .padding(.top, 4)
                            
                            ForEach(workers) { w in
                                let wEntries = timeVM.getFilteredEntries(for: w.id, month: timeVM.selectedMonth)
                                let s = timeVM.getSettlement(for: w.id, month: timeVM.selectedMonth)
                                let c = TimeCalculations.calculateSettlement(
                                    entries: wEntries,
                                    clientRate: s.customClientRate ?? w.clientRate,
                                    workerRate: s.customWorkerRate ?? w.workerRate,
                                    deposit: s.deposit,
                                    operatingExpenses: s.operatingExpenses
                                )
                                
                                Button(action: {
                                    viewModeWorkerId = w.id
                                    timeVM.selectedWorkerId = w.id
                                }) {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 3) {
                                            Text(w.displayName)
                                                .font(.subheadline)
                                                .fontWeight(.bold)
                                                .foregroundColor(.primary)
                                            Text("\(TimeCalculations.formatHours(c.totalHours)) h • Lohn: \(TimeCalculations.formatCurrency(c.workerRate))/h • Anzahlung: \(TimeCalculations.formatCurrency(c.deposit))")
                                                .font(.system(size: 11))
                                                .foregroundColor(.secondary)
                                        }
                                        Spacer()
                                        VStack(alignment: .trailing, spacing: 3) {
                                            Text(TimeCalculations.formatCurrency(c.netPayout))
                                                .font(.subheadline)
                                                .fontWeight(.black)
                                                .foregroundColor(.green)
                                            HStack(spacing: 3) {
                                                Text(lang.isArabic ? "فتح وتعديل" : "Bearbeiten")
                                                Image(systemName: "pencil")
                                            }
                                            .font(.system(size: 10, weight: .bold))
                                            .foregroundColor(.blue)
                                        }
                                    }
                                    .padding(12)
                                    .background(Color.fieldBackground.opacity(0.6))
                                    .cornerRadius(12)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                    .padding(16)
                    .background(Color.cardBackground)
                    .cornerRadius(20)
                    .shadow(color: .black.opacity(0.05), radius: 8, y: 4)
                    .padding(.horizontal, 16)
                }
                
                // MARK: - 3B. Einzelner Mitarbeiter (Komplett bearbeitbar)
                if let worker = activeWorker {
                    VStack(alignment: .leading, spacing: 14) {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("\(lang.text("Monatsabrechnung")) • \(timeVM.formattedMonthTitle(isArabic: lang.isArabic))")
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
                                    startEditingSettlement(for: worker)
                                }
                            }) {
                                HStack(spacing: 4) {
                                    Image(systemName: isEditingSettlement ? "checkmark.circle.fill" : "slider.horizontal.3")
                                    Text(isEditingSettlement
                                         ? (lang.isArabic ? "حفظ التغييرات" : "Speichern")
                                         : (lang.isArabic ? "تعديل المحاسبة بالكامل" : "Alles bearbeiten"))
                                }
                                .font(.caption)
                                .fontWeight(.bold)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 7)
                                .background(isEditingSettlement ? Color.green : Color.blue.opacity(0.12))
                                .foregroundColor(isEditingSettlement ? .white : .blue)
                                .cornerRadius(10)
                            }
                        }
                        
                        Divider()
                        
                        // Vollständiger Bearbeitungsmodus für die Monatsabrechnung
                        if isEditingSettlement {
                            VStack(alignment: .leading, spacing: 10) {
                                Text(lang.isArabic ? "تعديل جميع بيانات المحاسبة لهذا الشهر:" : "Alle Abrechnungswerte für diesen Monat anpassen:")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.blue)
                                
                                editFieldRow(
                                    label: lang.isArabic ? "اسم العامل:" : "Name des Mitarbeiters:",
                                    text: $workerNameText,
                                    isNumeric: false
                                )
                                editFieldRow(
                                    label: lang.isArabic ? "أجر الساعة للعامل (€/h):" : "Mitarbeiter-Stundenlohn (€/h):",
                                    text: $workerRateText
                                )
                                editFieldRow(
                                    label: lang.isArabic ? "سعر الساعة للعميل AR (€/h):" : "Kunden-Abrechnungssatz AR (€/h):",
                                    text: $clientRateText
                                )
                                editFieldRow(
                                    label: lang.isArabic ? "السلفة المدفوعة (€):" : "Geleistete Anzahlung / Vorschuss (€):",
                                    text: $depositText
                                )
                                editFieldRow(
                                    label: lang.isArabic ? "مصاريف التشغيل (€):" : "Jasin Betriebskosten / Abzüge (€):",
                                    text: $operatingText
                                )
                                editFieldRow(
                                    label: lang.isArabic ? "ملاحظة المحاسبة:" : "Abrechnungs-Notiz:",
                                    text: $settlementNotesText,
                                    isNumeric: false
                                )
                                
                                HStack(spacing: 10) {
                                    Button(action: { isEditingSettlement = false }) {
                                        Text(lang.text("Abbrechen"))
                                            .font(.caption)
                                            .fontWeight(.bold)
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, 10)
                                            .background(Color.fieldBackground)
                                            .foregroundColor(.secondary)
                                            .cornerRadius(10)
                                    }
                                    Button(action: saveSettlement) {
                                        Text(lang.isArabic ? "حفظ المحاسبة" : "Abrechnung speichern")
                                            .font(.caption)
                                            .fontWeight(.bold)
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, 10)
                                            .background(Color.green)
                                            .foregroundColor(.white)
                                            .cornerRadius(10)
                                    }
                                }
                                .padding(.top, 4)
                            }
                            .padding(12)
                            .background(Color.blue.opacity(0.05))
                            .cornerRadius(14)
                        }
                        
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
                        
                        // Aufschlüsselung inklusive Benzin, Auslagen, Anzahlung, Betriebskosten
                        VStack(spacing: 8) {
                            HStack {
                                Text(lang.text("Geleistete Monatsstunden:"))
                                    .font(.footnote)
                                    .foregroundColor(.secondary)
                                Spacer()
                                Text("\(TimeCalculations.formatHours(calculations.totalHours)) \(lang.text("Std.")) (\(activeWorkerEntries.count) \(lang.isArabic ? "أيام" : "Tage"))")
                                    .font(.footnote)
                                    .fontWeight(.bold)
                            }
                            
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
                                    .foregroundColor(calculations.totalFuelExpenses > 0 ? .orange : .secondary)
                            }
                            
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
                                    .foregroundColor(calculations.totalExpenses > 0 ? .green : .secondary)
                            }
                            
                            HStack {
                                Text(lang.text("Geleistete Anzahlung (Abzug):"))
                                    .font(.footnote)
                                    .foregroundColor(.secondary)
                                Spacer()
                                Text("- \(TimeCalculations.formatCurrency(calculations.deposit))")
                                    .font(.footnote)
                                    .fontWeight(.bold)
                                    .foregroundColor(.red)
                            }
                            
                            HStack {
                                Text(lang.text("Jasin Betriebskosten:"))
                                    .font(.footnote)
                                    .foregroundColor(.secondary)
                                Spacer()
                                Text(TimeCalculations.formatCurrency(calculations.operatingExpenses))
                                    .font(.footnote)
                                    .fontWeight(.bold)
                            }
                            
                            if let note = currentSettlement?.notes, !note.isEmpty {
                                HStack {
                                    Text(lang.isArabic ? "ملاحظة:" : "Bemerkung:")
                                        .font(.footnote)
                                        .foregroundColor(.secondary)
                                    Spacer()
                                    Text(note)
                                        .font(.footnote)
                                        .fontWeight(.medium)
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
                    
                    // MARK: - 4. Einsätze-Liste (Direkt antippen zum Bearbeiten + Neuer Tag Button)
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text("\(lang.text("Erfasste Einsätze")) (\(activeWorkerEntries.count))")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.secondary)
                                .textCase(.uppercase)
                            Spacer()
                            Button(action: {
                                openNewEntryForWorker(worker)
                            }) {
                                HStack(spacing: 4) {
                                    Image(systemName: "plus.circle.fill")
                                    Text(lang.isArabic ? "إضافة يوم عمل" : "+ Tag eintragen")
                                }
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.blue)
                            }
                        }
                        .padding(.horizontal, 16)
                        
                        if activeWorkerEntries.isEmpty {
                            VStack(spacing: 10) {
                                Text(lang.isArabic ? "لا توجد ساعات عمل مسجلة لهذا الشهر حتى الآن." : "Noch keine Arbeitszeiten für diesen Monat eingetragen.")
                                    .font(.footnote)
                                    .foregroundColor(.secondary)
                                Button(action: { openNewEntryForWorker(worker) }) {
                                    Text(lang.isArabic ? "+ تسجيل أول يوم عمل" : "+ Ersten Arbeitstag für \(worker.displayName) eintragen")
                                        .font(.caption)
                                        .fontWeight(.bold)
                                        .padding(.horizontal, 14)
                                        .padding(.vertical, 8)
                                        .background(Color.blue.opacity(0.12))
                                        .foregroundColor(.blue)
                                        .cornerRadius(10)
                                }
                            }
                            .padding(20)
                            .frame(maxWidth: .infinity)
                            .background(Color.cardBackground)
                            .cornerRadius(16)
                            .padding(.horizontal, 16)
                        } else {
                            VStack(spacing: 8) {
                                ForEach(activeWorkerEntries) { entry in
                                    HStack {
                                        VStack(alignment: .leading, spacing: 3) {
                                            HStack(spacing: 6) {
                                                Text("\(entry.date): \(entry.startTime) – \(entry.endTime) Uhr")
                                                    .font(.footnote)
                                                    .fontWeight(.bold)
                                                
                                                if let p = entry.photoData, !p.isEmpty {
                                                    Button(action: {
                                                        viewedPhotoEntry = entry
                                                    }) {
                                                        HStack(spacing: 3) {
                                                            Image(systemName: "camera.fill")
                                                            Text(lang.text("Beleg"))
                                                        }
                                                        .font(.system(size: 9, weight: .bold))
                                                        .foregroundColor(.white)
                                                        .padding(.horizontal, 6)
                                                        .padding(.vertical, 2)
                                                        .background(Color.blue)
                                                        .cornerRadius(4)
                                                    }
                                                    .buttonStyle(.plain)
                                                }
                                            }
                                            Text(entry.siteDescription)
                                                .font(.caption)
                                                .foregroundColor(.secondary)
                                                .lineLimit(1)
                                            
                                            if entry.fuelExpenses > 0 || entry.expenses > 0 {
                                                HStack(spacing: 8) {
                                                    if entry.fuelExpenses > 0 {
                                                        Text("⛽ \(TimeCalculations.formatCurrency(entry.fuelExpenses))")
                                                            .font(.system(size: 10, weight: .semibold))
                                                            .foregroundColor(.orange)
                                                    }
                                                    if entry.expenses > 0 {
                                                        Text("💶 \(TimeCalculations.formatCurrency(entry.expenses))")
                                                            .font(.system(size: 10, weight: .semibold))
                                                            .foregroundColor(.green)
                                                    }
                                                }
                                            }
                                        }
                                        Spacer()
                                        HStack(spacing: 8) {
                                            Text("\(TimeCalculations.formatHours(entry.decimalHours)) h")
                                                .font(.caption)
                                                .fontWeight(.bold)
                                                .padding(.horizontal, 8)
                                                .padding(.vertical, 4)
                                                .background(Color.green.opacity(0.12))
                                                .foregroundColor(.green)
                                                .cornerRadius(6)
                                            
                                            Button(action: {
                                                editingDayItem = OwnerSelectedDayItem(
                                                    dateStr: entry.date,
                                                    formattedDate: entry.date,
                                                    userId: worker.id,
                                                    existingEntry: entry
                                                )
                                            }) {
                                                Image(systemName: "pencil.circle.fill")
                                                    .font(.system(size: 20))
                                                    .foregroundColor(.blue)
                                            }
                                            .buttonStyle(.plain)
                                        }
                                    }
                                    .padding(12)
                                    .background(Color.cardBackground)
                                    .cornerRadius(14)
                                    .contentShape(Rectangle())
                                    .onTapGesture {
                                        editingDayItem = OwnerSelectedDayItem(
                                            dateStr: entry.date,
                                            formattedDate: entry.date,
                                            userId: worker.id,
                                            existingEntry: entry
                                        )
                                    }
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
        .onAppear {
            if viewModeWorkerId.isEmpty {
                if !timeVM.selectedWorkerId.isEmpty {
                    viewModeWorkerId = timeVM.selectedWorkerId
                } else if let first = workers.first {
                    viewModeWorkerId = first.id
                    timeVM.selectedWorkerId = first.id
                }
            }
        }
        .sheet(isPresented: $isAddWorkerPresented) {
            AddWorkerSheet()
        }
        .sheet(isPresented: $isMonthlyDocPresented) {
            MonthlyDocumentView()
        }
        .sheet(item: $editingDayItem) { item in
            TimeEntrySheet(
                dateStr: item.dateStr,
                formattedDate: item.formattedDate,
                userId: item.userId,
                existingEntry: item.existingEntry
            )
        }
        .sheet(item: $viewedPhotoEntry) { entry in
            FullScreenPhotoViewer(
                base64String: entry.photoData ?? "",
                title: "\(entry.date) • \(entry.siteDescription)"
            )
        }
    }
    
    @ViewBuilder
    private func editFieldRow(label: String, text: Binding<String>, isNumeric: Bool = true) -> some View {
        HStack {
            Text(label)
                .font(.caption)
                .foregroundColor(.primary)
            Spacer()
            TextField("", text: text)
                .font(.caption.weight(.bold))
                .frame(width: isNumeric ? 95 : 150)
                .multilineTextAlignment(.trailing)
                .padding(.horizontal, 8)
                .padding(.vertical, 6)
                .background(Color.cardBackground)
                .cornerRadius(8)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.blue.opacity(0.3), lineWidth: 1))
                #if os(iOS)
                .keyboardType(isNumeric ? .decimalPad : .default)
                #endif
        }
    }
    
    private func startEditingSettlement(for worker: UserProfile) {
        let s = currentSettlement
        workerNameText = worker.displayName
        workerRateText = String(format: "%.2f", s?.customWorkerRate ?? worker.workerRate)
        clientRateText = String(format: "%.2f", s?.customClientRate ?? worker.clientRate)
        depositText = String(format: "%.2f", s?.deposit ?? 0.0)
        operatingText = String(format: "%.2f", s?.operatingExpenses ?? 0.0)
        settlementNotesText = s?.notes ?? ""
        isEditingSettlement = true
    }
    
    private func saveSettlement() {
        guard var w = activeWorker else { return }
        let wRate = Double(workerRateText.replacingOccurrences(of: ",", with: ".")) ?? w.workerRate
        let cRate = Double(clientRateText.replacingOccurrences(of: ",", with: ".")) ?? w.clientRate
        let dep = Double(depositText.replacingOccurrences(of: ",", with: ".")) ?? 0.0
        let op = Double(operatingText.replacingOccurrences(of: ",", with: ".")) ?? 0.0
        let cleanName = workerNameText.trimmingCharacters(in: .whitespacesAndNewlines)
        
        if !cleanName.isEmpty {
            w.displayName = cleanName
        }
        w.workerRate = wRate
        w.clientRate = cRate
        authVM.updateWorker(w)
        
        timeVM.updateSettlement(
            userId: w.id,
            month: timeVM.selectedMonth,
            deposit: dep,
            operatingExpenses: op,
            customClientRate: cRate,
            customWorkerRate: wRate,
            notes: settlementNotesText.trimmingCharacters(in: .whitespacesAndNewlines)
        )
        #if canImport(UIKit)
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        #endif
        isEditingSettlement = false
    }
    
    private func openNewEntryForWorker(_ worker: UserProfile) {
        let defaultDate = "\(timeVM.selectedMonth)-01"
        editingDayItem = OwnerSelectedDayItem(
            dateStr: defaultDate,
            formattedDate: defaultDate,
            userId: worker.id,
            existingEntry: nil
        )
    }
}

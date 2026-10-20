import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

struct CalendarView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var timeVM: TimeTrackingViewModel
    @EnvironmentObject var lang: LanguageManager
    
    let targetUserId: String?
    
    @State private var selectedDayInfo: DayInfo?
    @State private var isShowingTodaySheet: Bool = false
    
    // Automatisch auf das aktuelle reale Datum initialisieren
    @State private var year: Int = Calendar.current.component(.year, from: Date())
    @State private var month: Int = Calendar.current.component(.month, from: Date())
    
    struct DayInfo: Identifiable {
        let id: String // "YYYY-MM-DD"
        let dateStr: String
        let dayOfWeek: String
        let dayNumber: Int
        let formattedDate: String
        let isWeekend: Bool
        let isToday: Bool
        let entry: TimeEntry?
    }
    
    var activeUserId: String {
        targetUserId ?? authVM.currentUser?.id ?? ""
    }
    
    var monthString: String {
        String(format: "%04d-%02d", year, month)
    }
    
    var todayIsoString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Date())
    }
    
    var todayFormattedString: String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: lang.isArabic ? "ar" : "de_DE")
        formatter.dateFormat = "EEE. dd. MMM"
        return formatter.string(from: Date())
    }
    
    var monthNames: [String] {
        lang.monthNames
    }
    
    var weekdayNames: [String] {
        lang.weekdayNames
    }
    
    var daysForMonth: [DayInfo] {
        var calendar = Calendar(identifier: .gregorian)
        calendar.locale = Locale(identifier: lang.isArabic ? "ar" : "de_DE")
        
        var components = DateComponents()
        components.year = year
        components.month = month
        components.day = 1
        
        guard let startOfMonth = calendar.date(from: components),
              let range = calendar.range(of: .day, in: .month, for: startOfMonth) else {
            return []
        }
        
        let entries = timeVM.getFilteredEntries(for: activeUserId, month: monthString)
        let entriesDict = Dictionary(uniqueKeysWithValues: entries.map { ($0.date, $0) })
        let todayStr = todayIsoString
        
        var result: [DayInfo] = []
        for day in range {
            components.day = day
            guard let date = calendar.date(from: components) else { continue }
            
            let weekdayIndex = calendar.component(.weekday, from: date) - 1
            let dayOfWeek = (weekdayIndex >= 0 && weekdayIndex < weekdayNames.count) ? weekdayNames[weekdayIndex] : ""
            let isWeekend = (weekdayIndex == 0 || weekdayIndex == 6)
            
            let dateIso = String(format: "%04d-%02d-%02d", year, month, day)
            let monthName = (month - 1 < monthNames.count) ? monthNames[month - 1] : ""
            let formatted = String(format: "%@ %02d. %@", dayOfWeek, day, String(monthName.prefix(4)))
            
            result.append(DayInfo(
                id: dateIso,
                dateStr: dateIso,
                dayOfWeek: dayOfWeek,
                dayNumber: day,
                formattedDate: formatted,
                isWeekend: isWeekend,
                isToday: (dateIso == todayStr),
                entry: entriesDict[dateIso]
            ))
        }
        return result
    }
    
    var monthlyEntries: [TimeEntry] {
        timeVM.getFilteredEntries(for: activeUserId, month: monthString)
    }
    
    var totalHoursForMonth: Double {
        monthlyEntries.reduce(0.0) { $0 + $1.decimalHours }
    }
    
    var totalFuelForMonth: Double {
        monthlyEntries.reduce(0.0) { $0 + $1.fuelExpenses }
    }
    
    var totalExpensesForMonth: Double {
        monthlyEntries.reduce(0.0) { $0 + $1.expenses }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            
            // MARK: - Modern Month Navigator Bar
            HStack(spacing: 12) {
                Button(action: prevMonth) {
                    Image(systemName: lang.isArabic ? "chevron.right" : "chevron.left")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.primary)
                        .padding(10)
                        .background(Color.fieldBackground)
                        .clipShape(Circle())
                }
                
                Spacer()
                
                VStack(spacing: 2) {
                    Text("\(monthNames[month - 1]) \(String(year))")
                        .font(.system(size: 20, weight: .heavy, design: .rounded))
                        .foregroundColor(.primary)
                }
                
                Spacer()
                
                // Schnell-Sprung zu "Heute"
                if !isCurrentMonthDisplayed {
                    Button(action: jumpToToday) {
                        Text(lang.text("Heute"))
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.blue)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color.blue.opacity(0.12))
                            .clipShape(Capsule())
                    }
                }
                
                Button(action: nextMonth) {
                    Image(systemName: lang.isArabic ? "chevron.left" : "chevron.right")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.primary)
                        .padding(10)
                        .background(Color.fieldBackground)
                        .clipShape(Circle())
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color.cardBackground)
            
            // MARK: - Kompakte KPI Monats-Karten
            HStack(spacing: 10) {
                // Stunden
                HStack(spacing: 10) {
                    Circle()
                        .fill(Color.blue.opacity(0.15))
                        .frame(width: 36, height: 36)
                        .overlay(Image(systemName: "clock.fill").foregroundColor(.blue).font(.system(size: 16)))
                    
                    VStack(alignment: .leading, spacing: 1) {
                        Text(lang.text("Monatsstunden"))
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.secondary)
                        Text("\(TimeCalculations.formatHours(totalHoursForMonth)) \(lang.text("Std."))")
                            .font(.system(size: 16, weight: .black, design: .rounded))
                            .foregroundColor(.primary)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(10)
                .background(Color.cardBackground)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                .shadow(color: .black.opacity(0.04), radius: 6, y: 2)
                
                // Tage & Einsätze
                HStack(spacing: 10) {
                    Circle()
                        .fill(Color.green.opacity(0.15))
                        .frame(width: 36, height: 36)
                        .overlay(Image(systemName: "calendar.badge.checkmark").foregroundColor(.green).font(.system(size: 16)))
                    
                    VStack(alignment: .leading, spacing: 1) {
                        Text(lang.text("Arbeitstage"))
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.secondary)
                        Text("\(monthlyEntries.count) \(lang.text("Tage"))")
                            .font(.system(size: 16, weight: .black, design: .rounded))
                            .foregroundColor(.primary)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(10)
                .background(Color.cardBackground)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                .shadow(color: .black.opacity(0.04), radius: 6, y: 2)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            
            // Auslagen-Banner falls vorhanden
            if totalFuelForMonth > 0 || totalExpensesForMonth > 0 {
                HStack(spacing: 14) {
                    if totalFuelForMonth > 0 {
                        HStack(spacing: 4) {
                            Image(systemName: "fuelpump.fill")
                                .foregroundColor(.orange)
                                .font(.caption)
                            Text("\(lang.text("Benzin:")) \(TimeCalculations.formatCurrency(totalFuelForMonth))")
                                .font(.caption)
                                .fontWeight(.bold)
                        }
                    }
                    if totalExpensesForMonth > 0 {
                        HStack(spacing: 4) {
                            Image(systemName: "banknote.fill")
                                .foregroundColor(.green)
                                .font(.caption)
                            Text("\(lang.text("Auslagen:")) \(TimeCalculations.formatCurrency(totalExpensesForMonth))")
                                .font(.caption)
                                .fontWeight(.bold)
                        }
                    }
                    Spacer()
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 6)
            }
            
            // MARK: - Aufgeräumte Tages-Liste
            List {
                ForEach(daysForMonth) { day in
                    Button(action: {
                        #if canImport(UIKit)
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        #endif
                        selectedDayInfo = day
                    }) {
                        HStack(spacing: 12) {
                            
                            // Datums-Badge (Heute wird blau hervorgehoben!)
                            VStack(spacing: 2) {
                                Text(day.dayOfWeek)
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(day.isToday ? .white : (day.entry != nil ? .blue : (day.isWeekend ? .secondary : .primary)))
                                
                                Text(String(format: "%02d", day.dayNumber))
                                    .font(.system(size: 16, weight: .black, design: .rounded))
                                    .foregroundColor(day.isToday ? .white : .primary)
                            }
                            .frame(width: 44, height: 44)
                            .background(
                                day.isToday
                                ? Color.blue
                                : (day.entry != nil ? Color.blue.opacity(0.12) : Color.fieldBackground)
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .stroke(day.isToday ? Color.blue : Color.clear, lineWidth: 2)
                            )
                            
                            // Mittlerer Bereich: Arbeitszeit oder dezenter Leerzustand
                            VStack(alignment: .leading, spacing: 3) {
                                if let e = day.entry {
                                    HStack(spacing: 6) {
                                        Text("\(e.startTime) – \(e.endTime) Uhr")
                                            .font(.subheadline)
                                            .fontWeight(.bold)
                                            .foregroundColor(.primary)
                                        
                                        if e.breakMinutes > 0 {
                                            Text("(\(e.breakMinutes)m P.)")
                                                .font(.caption2)
                                                .foregroundColor(.secondary)
                                        }
                                    }
                                    
                                    Text(e.siteDescription)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                        .lineLimit(1)
                                    
                                    // Spesen-Badges direkt am Tag
                                    if e.fuelExpenses > 0 || e.expenses > 0 {
                                        HStack(spacing: 6) {
                                            if e.fuelExpenses > 0 {
                                                Text("⛽ \(TimeCalculations.formatCurrency(e.fuelExpenses))")
                                                    .font(.system(size: 10, weight: .bold))
                                                    .foregroundColor(.orange)
                                            }
                                            if e.expenses > 0 {
                                                Text("💶 \(TimeCalculations.formatCurrency(e.expenses))")
                                                    .font(.system(size: 10, weight: .bold))
                                                    .foregroundColor(.green)
                                            }
                                        }
                                        .padding(.top, 1)
                                    }
                                } else {
                                    Text(day.isWeekend
                                         ? lang.text("Wochenende")
                                         : (day.isToday ? lang.text("Heute (Noch nicht erfasst)") : lang.text("Kein Eintrag")))
                                        .font(.subheadline)
                                        .fontWeight(day.isToday ? .semibold : .regular)
                                        .foregroundColor(day.isToday ? .blue : .secondary)
                                }
                            }
                            
                            Spacer()
                            
                            // Rechter Bereich: Stunden-Pille oder direktes Plus zum Eintragen
                            if let e = day.entry {
                                Text("\(TimeCalculations.formatHours(e.decimalHours)) \(lang.text("Std."))")
                                    .font(.system(size: 12, weight: .bold, design: .rounded))
                                    .padding(.horizontal, 9)
                                    .padding(.vertical, 5)
                                    .background(Color.green.opacity(0.14))
                                    .foregroundColor(.green)
                                    .clipShape(Capsule())
                            } else {
                                Image(systemName: "plus.circle.fill")
                                    .font(.system(size: 22))
                                    .foregroundColor(day.isToday ? .blue : Color.gray.opacity(0.4))
                            }
                        }
                        .padding(.vertical, 3)
                    }
                }
            }
            #if os(iOS)
            .listStyle(.insetGrouped)
            #endif
        }
        .background(Color.appBackground)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button(action: {
                    #if canImport(UIKit)
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                    #endif
                    isShowingTodaySheet = true
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: "plus")
                        Text(lang.text("Heute"))
                    }
                    .font(.footnote)
                    .fontWeight(.bold)
                }
            }
        }
        // Sheet beim Tippen auf einen beliebigen Tag
        .sheet(item: $selectedDayInfo) { day in
            TimeEntrySheet(
                dateStr: day.dateStr,
                formattedDate: day.formattedDate,
                userId: activeUserId,
                existingEntry: day.entry
            )
        }
        // Schnell-Sheet für "Heute" oben rechts
        .sheet(isPresented: $isShowingTodaySheet) {
            let todayIso = todayIsoString
            let existing = timeVM.allEntries.first(where: { $0.userId == activeUserId && $0.date == todayIso })
            TimeEntrySheet(
                dateStr: todayIso,
                formattedDate: todayFormattedString,
                userId: activeUserId,
                existingEntry: existing
            )
        }
        .onAppear {
            syncSelectedMonth()
        }
    }
    
    var isCurrentMonthDisplayed: Bool {
        let currentY = Calendar.current.component(.year, from: Date())
        let currentM = Calendar.current.component(.month, from: Date())
        return year == currentY && month == currentM
    }
    
    private func jumpToToday() {
        year = Calendar.current.component(.year, from: Date())
        month = Calendar.current.component(.month, from: Date())
        syncSelectedMonth()
    }
    
    private func prevMonth() {
        if month == 1 {
            month = 12
            year -= 1
        } else {
            month -= 1
        }
        syncSelectedMonth()
    }
    
    private func nextMonth() {
        if month == 12 {
            month = 1
            year += 1
        } else {
            month += 1
        }
        syncSelectedMonth()
    }
    
    private func syncSelectedMonth() {
        timeVM.selectedMonth = monthString
    }
}

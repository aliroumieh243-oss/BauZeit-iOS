import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

struct CalendarView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var timeVM: TimeTrackingViewModel
    
    let targetUserId: String?
    
    @State private var selectedDayInfo: DayInfo?
    @State private var year: Int = 2026
    @State private var month: Int = 6
    
    struct DayInfo: Identifiable {
        let id: String // "YYYY-MM-DD"
        let dateStr: String
        let dayOfWeek: String
        let dayNumber: Int
        let formattedDate: String
        let isWeekend: Bool
        let entry: TimeEntry?
    }
    
    var activeUserId: String {
        targetUserId ?? authVM.currentUser?.id ?? ""
    }
    
    var monthString: String {
        String(format: "%04d-%02d", year, month)
    }
    
    let monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni",
                      "Juli", "August", "September", "Oktober", "November", "Dezember"]
    let weekdayNames = ["So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa."]
    
    var daysForMonth: [DayInfo] {
        var calendar = Calendar(identifier: .gregorian)
        calendar.locale = Locale(identifier: "de_DE")
        
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
        
        var result: [DayInfo] = []
        for day in range {
            components.day = day
            guard let date = calendar.date(from: components) else { continue }
            
            let weekdayIndex = calendar.component(.weekday, from: date) - 1
            let dayOfWeek = weekdayNames[weekdayIndex]
            let isWeekend = (weekdayIndex == 0 || weekdayIndex == 6)
            
            let dateIso = String(format: "%04d-%02d-%02d", year, month, day)
            let formatted = String(format: "%@ %02d. %@", dayOfWeek, day, monthNames[month - 1].prefix(3) as CVarArg)
            
            result.append(DayInfo(
                id: dateIso,
                dateStr: dateIso,
                dayOfWeek: dayOfWeek,
                dayNumber: day,
                formattedDate: formatted,
                isWeekend: isWeekend,
                entry: entriesDict[dateIso]
            ))
        }
        return result
    }
    
    var totalHoursForMonth: Double {
        timeVM.getFilteredEntries(for: activeUserId, month: monthString)
            .reduce(0.0) { $0 + $1.decimalHours }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Month Stepper Header
            HStack {
                Button(action: prevMonth) {
                    Image(systemName: "chevron.left")
                        .font(.headline)
                        .padding(8)
                        .background(Color.fieldBackground)
                        .clipShape(Circle())
                }
                
                Spacer()
                
                VStack(spacing: 2) {
                    Text("Arbeitszeiterfassung")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.blue)
                        .textCase(.uppercase)
                    Text("\(monthNames[month - 1]) \(String(year))")
                        .font(.title3)
                        .fontWeight(.heavy)
                }
                
                Spacer()
                
                Button(action: nextMonth) {
                    Image(systemName: "chevron.right")
                        .font(.headline)
                        .padding(8)
                        .background(Color.fieldBackground)
                        .clipShape(Circle())
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color.cardBackground)
            
            // Monthly Summary Pills
            HStack(spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Monatsstunden")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.blue)
                        Text("\(TimeCalculations.formatHours(totalHoursForMonth)) Std.")
                            .font(.headline)
                            .fontWeight(.black)
                    }
                    Spacer()
                }
                .padding(12)
                .background(Color.blue.opacity(0.08))
                .cornerRadius(16)
                
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Erfasste Tage")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.green)
                        Text("\(timeVM.getFilteredEntries(for: activeUserId, month: monthString).count) Tage")
                            .font(.headline)
                            .fontWeight(.black)
                    }
                    Spacer()
                }
                .padding(12)
                .background(Color.green.opacity(0.08))
                .cornerRadius(16)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            
            // Days List
            List {
                ForEach(daysForMonth) { day in
                    Button(action: { selectedDayInfo = day }) {
                        HStack(spacing: 14) {
                            // Date badge
                            VStack(spacing: 1) {
                                Text(day.dayOfWeek)
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(day.entry != nil ? .blue : (day.isWeekend ? .secondary : .primary))
                                Text(String(format: "%02d", day.dayNumber))
                                    .font(.system(size: 16, weight: .black, design: .rounded))
                            }
                            .frame(width: 44, height: 44)
                            .background(day.entry != nil ? Color.blue.opacity(0.12) : Color.fieldBackground)
                            .cornerRadius(12)
                            
                            // Day Details
                            VStack(alignment: .leading, spacing: 3) {
                                if let e = day.entry {
                                    Text("\(e.startTime) – \(e.endTime) Uhr")
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                        .foregroundColor(.primary)
                                    Text(e.siteDescription)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                        .lineLimit(1)
                                } else {
                                    Text(day.isWeekend ? "Wochenende" : "Keine Arbeitszeit erfasst")
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)
                                    Text("Tippen zum Eintragen")
                                        .font(.system(size: 11))
                                        .foregroundColor(.blue)
                                }
                            }
                            
                            Spacer()
                            
                            // Hours badge
                            if let e = day.entry {
                                Text("\(TimeCalculations.formatHours(e.decimalHours)) h")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.green.opacity(0.15))
                                    .foregroundColor(.green)
                                    .cornerRadius(8)
                            } else {
                                Image(systemName: "plus.circle")
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.vertical, 2)
                    }
                }
            }
            #if os(iOS)
            .listStyle(.insetGrouped)
            #endif
        }
        .background(Color.appBackground)
        .sheet(item: $selectedDayInfo) { day in
            TimeEntrySheet(
                dateStr: day.dateStr,
                formattedDate: day.formattedDate,
                userId: activeUserId,
                existingEntry: day.entry
            )
        }
    }
    
    private func prevMonth() {
        if month == 1 {
            month = 12
            year -= 1
        } else {
            month -= 1
        }
        timeVM.selectedMonth = monthString
    }
    
    private func nextMonth() {
        if month == 12 {
            month = 1
            year += 1
        } else {
            month += 1
        }
        timeVM.selectedMonth = monthString
    }
}

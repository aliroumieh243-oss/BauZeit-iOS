import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

struct MonthlyDocumentView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var timeVM: TimeTrackingViewModel
    @EnvironmentObject var lang: LanguageManager
    
    @State private var selectedFilterWorkerId: String = "ALL"
    @State private var activePreviewTab: Int = 0 // 0 = Echte Tabelle, 1 = Textbericht
    @State private var copiedNotice: Bool = false
    @State private var isSharing: Bool = false
    @State private var shareURL: URL? = nil
    
    var workers: [UserProfile] {
        authVM.users.filter { $0.role == .member }
    }
    
    var filteredWorkers: [UserProfile] {
        if selectedFilterWorkerId == "ALL" {
            return workers
        }
        return workers.filter { $0.id == selectedFilterWorkerId }
    }
    
    var filteredEntries: [TimeEntry] {
        let allowedIds = Set(filteredWorkers.map { $0.id })
        return timeVM.allEntries
            .filter { $0.date.hasPrefix(timeVM.selectedMonth) && allowedIds.contains($0.userId) }
            .sorted { $0.date < $1.date }
    }
    
    var tableExportText: String {
        AIDocumentGenerator.generateTableExport(
            workers: workers,
            month: timeVM.selectedMonth,
            entries: timeVM.allEntries,
            settlements: timeVM.allSettlements,
            filterWorkerId: selectedFilterWorkerId
        )
    }
    
    var formattedReportText: String {
        AIDocumentGenerator.generateFormattedReport(
            workers: workers,
            month: timeVM.selectedMonth,
            entries: timeVM.allEntries,
            settlements: timeVM.allSettlements,
            filterWorkerId: selectedFilterWorkerId
        )
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    
                    // MARK: - Month & Worker Filter Bar
                    VStack(spacing: 12) {
                        HStack {
                            Button(action: { timeVM.previousMonth() }) {
                                Image(systemName: lang.isArabic ? "chevron.right" : "chevron.left")
                                    .font(.system(size: 14, weight: .bold))
                                    .frame(width: 34, height: 34)
                                    .background(Color.fieldBackground)
                                    .cornerRadius(10)
                            }
                            Spacer()
                            VStack(spacing: 2) {
                                Text(lang.isArabic ? "شهر المحاسبة" : "ABRECHNUNGSMONAT")
                                    .font(.system(size: 9, weight: .bold))
                                    .foregroundColor(.orange)
                                Text(timeVM.formattedMonthTitle(isArabic: lang.isArabic))
                                    .font(.headline)
                                    .fontWeight(.black)
                            }
                            Spacer()
                            Button(action: { timeVM.nextMonth() }) {
                                Image(systemName: lang.isArabic ? "chevron.left" : "chevron.right")
                                    .font(.system(size: 14, weight: .bold))
                                    .frame(width: 34, height: 34)
                                    .background(Color.fieldBackground)
                                    .cornerRadius(10)
                            }
                        }
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                Button(action: { selectedFilterWorkerId = "ALL" }) {
                                    HStack(spacing: 5) {
                                        Image(systemName: "person.3.fill")
                                            .font(.system(size: 10))
                                        Text(lang.isArabic ? "جميع العمال" : "Alle Mitarbeiter (\(workers.count))")
                                            .font(.caption)
                                            .fontWeight(.bold)
                                    }
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 7)
                                    .background(selectedFilterWorkerId == "ALL" ? Color.blue : Color.fieldBackground)
                                    .foregroundColor(selectedFilterWorkerId == "ALL" ? .white : .primary)
                                    .cornerRadius(10)
                                }
                                
                                ForEach(workers) { w in
                                    Button(action: { selectedFilterWorkerId = w.id }) {
                                        Text(w.displayName)
                                            .font(.caption)
                                            .fontWeight(.bold)
                                            .padding(.horizontal, 12)
                                            .padding(.vertical, 7)
                                            .background(selectedFilterWorkerId == w.id ? Color.blue : Color.fieldBackground)
                                            .foregroundColor(selectedFilterWorkerId == w.id ? .white : .primary)
                                            .cornerRadius(10)
                                    }
                                }
                            }
                        }
                    }
                    .padding(14)
                    .background(Color.cardBackground)
                    .cornerRadius(18)
                    .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
                    .padding(.horizontal, 16)
                    
                    // MARK: - Hero Action & Export Card
                    VStack(alignment: .leading, spacing: 12) {
                        HStack(spacing: 12) {
                            Circle()
                                .fill(LinearGradient(
                                    colors: [Color.blue, Color.purple],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ))
                                .frame(width: 42, height: 42)
                                .overlay(Image(systemName: "tablecells.fill").foregroundColor(.white).font(.system(size: 18, weight: .bold)))
                            
                            VStack(alignment: .leading, spacing: 2) {
                                Text(lang.isArabic ? "جدول وتقرير الشهر الذكي" : "Echte Monats-Tabelle & Export")
                                    .font(.subheadline)
                                    .fontWeight(.bold)
                                Text(lang.isArabic ? "تصدير مباشر كجدول إكسل منسق أو نسخ فوري" : "Als echte Excel-Tabelle (.xls), CSV oder per 1-Klick Kopieren")
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                            }
                        }
                        
                        Divider()
                        
                        // Export Buttons
                        VStack(spacing: 8) {
                            // 1. Echte Excel-Tabelle (.xls)
                            Button(action: prepareAndShareExcelTable) {
                                HStack {
                                    Image(systemName: "tablecells.badge.ellipsis")
                                    Text(lang.isArabic ? "تصدير كجدول إكسل حقيقي (.xls)" : "Echte Excel-Tabelle erstellen & teilen (.xls)")
                                        .fontWeight(.bold)
                                }
                                .font(.footnote)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 13)
                                .background(Color.green)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                                .shadow(color: Color.green.opacity(0.25), radius: 5, y: 2)
                            }
                            
                            HStack(spacing: 8) {
                                // 2. 1-Klick Kopieren
                                Button(action: copyForTable) {
                                    HStack(spacing: 5) {
                                        Image(systemName: copiedNotice ? "checkmark.circle.fill" : "doc.on.doc.fill")
                                        Text(copiedNotice
                                             ? (lang.isArabic ? "تم النسخ!" : "Kopiert!")
                                             : (lang.isArabic ? "نسخ للجدول" : "Tabelle kopieren"))
                                            .fontWeight(.bold)
                                    }
                                    .font(.caption)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 11)
                                    .background(copiedNotice ? Color.green : Color.blue)
                                    .foregroundColor(.white)
                                    .cornerRadius(12)
                                }
                                
                                // 3. CSV Teilen
                                Button(action: prepareAndShareCSV) {
                                    HStack(spacing: 5) {
                                        Image(systemName: "square.and.arrow.up")
                                        Text(lang.isArabic ? "ملف CSV" : "Als CSV-Tabelle")
                                            .fontWeight(.bold)
                                    }
                                    .font(.caption)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 11)
                                    .background(Color.fieldBackground)
                                    .foregroundColor(.primary)
                                    .cornerRadius(12)
                                }
                            }
                        }
                    }
                    .padding(16)
                    .background(Color.cardBackground)
                    .cornerRadius(18)
                    .shadow(color: .black.opacity(0.05), radius: 8, y: 3)
                    .padding(.horizontal, 16)
                    
                    if copiedNotice {
                        HStack(spacing: 8) {
                            Image(systemName: "checkmark.seal.fill")
                                .foregroundColor(.green)
                            Text(lang.isArabic
                                 ? "تم نسخ الجدول! الصقه مباشرة في إكسل أو جداول غوغل."
                                 : "Tabelle in der Zwischenablage! Einfach in Excel, Numbers oder Google Sheets einfügen.")
                                .font(.caption)
                                .fontWeight(.semibold)
                                .foregroundColor(.green)
                        }
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.green.opacity(0.12))
                        .cornerRadius(12)
                        .padding(.horizontal, 16)
                    }
                    
                    // MARK: - View Mode Switcher (Echte Tabelle vs. Textbericht)
                    Picker("Ansicht", selection: $activePreviewTab) {
                        Text(lang.isArabic ? "📊 جدول حقيقي" : "📊 Echte Tabelle").tag(0)
                        Text(lang.isArabic ? "📄 تقرير نصي" : "📄 Text-Bericht").tag(1)
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal, 16)
                    
                    if activePreviewTab == 0 {
                        // MARK: - ECHTE VISUELLE TABELLE 1: Mitarbeiter-Abrechnung
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Image(systemName: "person.2.crop.square.stack.fill")
                                    .foregroundColor(.blue)
                                Text(lang.isArabic ? "الجدول 1: محاسبة العمال والرواتب" : "Tabelle 1: Monatsabrechnung & Löhne")
                                    .font(.caption)
                                    .fontWeight(.black)
                                    .textCase(.uppercase)
                                Spacer()
                                Text(lang.isArabic ? "اسحب لليمين/اليسار ↔" : "Horizontal scrollen ↔")
                                    .font(.system(size: 9, weight: .semibold))
                                    .foregroundColor(.secondary)
                            }
                            .padding(.horizontal, 16)
                            
                            ScrollView(.horizontal, showsIndicators: true) {
                                VStack(spacing: 0) {
                                    // Header Row
                                    HStack(spacing: 0) {
                                        tableHeaderCell(lang.isArabic ? "العامل" : "Mitarbeiter", width: 115, align: .leading)
                                        tableHeaderCell(lang.isArabic ? "أيام" : "Tage", width: 48, align: .trailing)
                                        tableHeaderCell(lang.isArabic ? "ساعات" : "Stunden", width: 68, align: .trailing)
                                        tableHeaderCell(lang.isArabic ? "الساعة" : "Lohn/h", width: 68, align: .trailing)
                                        tableHeaderCell(lang.isArabic ? "الأساسي" : "Grundlohn", width: 82, align: .trailing)
                                        tableHeaderCell(lang.isArabic ? "العميل AR" : "Kunden-AR", width: 86, align: .trailing)
                                        tableHeaderCell(lang.isArabic ? "وقود" : "Benzin", width: 70, align: .trailing)
                                        tableHeaderCell(lang.isArabic ? "مصاريف" : "Auslagen", width: 72, align: .trailing)
                                        tableHeaderCell(lang.isArabic ? "سلفة" : "Anzahlung", width: 78, align: .trailing)
                                        tableHeaderCell(lang.isArabic ? "الصافي" : "Auszahlung", width: 92, align: .trailing)
                                    }
                                    .background(Color(red: 0.12, green: 0.23, blue: 0.54))
                                    
                                    // Worker Rows
                                    let summaryRows = buildSummaryRows()
                                    ForEach(Array(summaryRows.enumerated()), id: \.element.id) { index, row in
                                        HStack(spacing: 0) {
                                            tableDataCell(row.workerName, width: 115, align: .leading, isBold: true)
                                            tableDataCell("\(row.days)", width: 48, align: .trailing)
                                            tableDataCell("\(TimeCalculations.formatHours(row.hours)) h", width: 68, align: .trailing, isBold: true)
                                            tableDataCell(TimeCalculations.formatCurrency(row.workerRate), width: 68, align: .trailing)
                                            tableDataCell(TimeCalculations.formatCurrency(row.baseWage), width: 82, align: .trailing)
                                            tableDataCell(TimeCalculations.formatCurrency(row.clientAR), width: 86, align: .trailing, color: .blue, isBold: true)
                                            tableDataCell(TimeCalculations.formatCurrency(row.fuel), width: 70, align: .trailing, color: row.fuel > 0 ? .orange : .primary)
                                            tableDataCell(TimeCalculations.formatCurrency(row.expenses), width: 72, align: .trailing, color: row.expenses > 0 ? .green : .primary)
                                            tableDataCell("- \(TimeCalculations.formatCurrency(row.deposit))", width: 78, align: .trailing, color: row.deposit > 0 ? .red : .secondary)
                                            tableDataCell(TimeCalculations.formatCurrency(row.netPayout), width: 92, align: .trailing, color: .green, isBold: true)
                                        }
                                        .background(index % 2 == 0 ? Color.cardBackground : Color.fieldBackground.opacity(0.55))
                                        Divider()
                                    }
                                    
                                    // Total Row
                                    let tot = calculateTotalSummary(rows: summaryRows)
                                    HStack(spacing: 0) {
                                        tableDataCell(lang.isArabic ? "المجموع" : "GESAMT", width: 115, align: .leading, isBold: true)
                                        tableDataCell("\(tot.days)", width: 48, align: .trailing, isBold: true)
                                        tableDataCell("\(TimeCalculations.formatHours(tot.hours)) h", width: 68, align: .trailing, isBold: true)
                                        tableDataCell("-", width: 68, align: .trailing)
                                        tableDataCell(TimeCalculations.formatCurrency(tot.baseWage), width: 82, align: .trailing, isBold: true)
                                        tableDataCell(TimeCalculations.formatCurrency(tot.clientAR), width: 86, align: .trailing, color: .blue, isBold: true)
                                        tableDataCell(TimeCalculations.formatCurrency(tot.fuel), width: 70, align: .trailing, color: .orange, isBold: true)
                                        tableDataCell(TimeCalculations.formatCurrency(tot.expenses), width: 72, align: .trailing, color: .green, isBold: true)
                                        tableDataCell("- \(TimeCalculations.formatCurrency(tot.deposit))", width: 78, align: .trailing, color: .red, isBold: true)
                                        tableDataCell(TimeCalculations.formatCurrency(tot.netPayout), width: 92, align: .trailing, color: .green, isBold: true)
                                    }
                                    .background(Color.blue.opacity(0.12))
                                }
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 14)
                                        .stroke(Color.secondary.opacity(0.25), lineWidth: 1)
                                )
                                .padding(.horizontal, 16)
                            }
                        }
                        
                        // MARK: - ECHTE VISUELLE TABELLE 2: Einzelaufstellung aller Tage
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Image(systemName: "calendar.day.timeline.left")
                                    .foregroundColor(.purple)
                                Text(lang.isArabic ? "الجدول 2: تفصيل أيام العمل (\(filteredEntries.count))" : "Tabelle 2: Einzelaufstellung Einsatztage (\(filteredEntries.count))")
                                    .font(.caption)
                                    .fontWeight(.black)
                                    .textCase(.uppercase)
                                Spacer()
                            }
                            .padding(.horizontal, 16)
                            
                            if filteredEntries.isEmpty {
                                Text(lang.isArabic ? "لا توجد إدخالات مسجلة لهذا الشهر." : "Keine Tage für diesen Filter im gewählten Monat eingetragen.")
                                    .font(.footnote)
                                    .foregroundColor(.secondary)
                                    .frame(maxWidth: .infinity)
                                    .padding(20)
                                    .background(Color.cardBackground)
                                    .cornerRadius(14)
                                    .padding(.horizontal, 16)
                            } else {
                                ScrollView(.horizontal, showsIndicators: true) {
                                    VStack(spacing: 0) {
                                        // Header
                                        HStack(spacing: 0) {
                                            tableHeaderCell(lang.isArabic ? "التاريخ" : "Datum", width: 86, align: .leading)
                                            tableHeaderCell(lang.isArabic ? "العامل" : "Mitarbeiter", width: 100, align: .leading)
                                            tableHeaderCell(lang.isArabic ? "الوقت" : "Uhrzeit", width: 92, align: .center)
                                            tableHeaderCell(lang.isArabic ? "استراحة" : "Pause", width: 54, align: .trailing)
                                            tableHeaderCell(lang.isArabic ? "ساعات" : "Stunden", width: 66, align: .trailing)
                                            tableHeaderCell(lang.isArabic ? "الموقع / الورشة" : "Baustelle / Einsatzort", width: 165, align: .leading)
                                            tableHeaderCell(lang.isArabic ? "وقود" : "Benzin", width: 68, align: .trailing)
                                            tableHeaderCell(lang.isArabic ? "مصاريف" : "Auslagen", width: 68, align: .trailing)
                                            tableHeaderCell(lang.isArabic ? "إيصال" : "Beleg", width: 58, align: .center)
                                        }
                                        .background(Color(red: 0.18, green: 0.16, blue: 0.45))
                                        
                                        ForEach(Array(filteredEntries.enumerated()), id: \.element.id) { idx, e in
                                            let wName = workers.first(where: { $0.id == e.userId })?.displayName ?? "Mitarbeiter"
                                            let hasPhoto = (e.photoData != nil && !e.photoData!.isEmpty)
                                            HStack(spacing: 0) {
                                                tableDataCell(e.date, width: 86, align: .leading, isBold: true)
                                                tableDataCell(wName, width: 100, align: .leading)
                                                tableDataCell("\(e.startTime)–\(e.endTime)", width: 92, align: .center)
                                                tableDataCell("\(e.breakMinutes)m", width: 54, align: .trailing)
                                                tableDataCell("\(TimeCalculations.formatHours(e.decimalHours)) h", width: 66, align: .trailing, color: .blue, isBold: true)
                                                tableDataCell(e.siteDescription, width: 165, align: .leading)
                                                tableDataCell(e.fuelExpenses > 0 ? TimeCalculations.formatCurrency(e.fuelExpenses) : "-", width: 68, align: .trailing, color: e.fuelExpenses > 0 ? .orange : .secondary)
                                                tableDataCell(e.expenses > 0 ? TimeCalculations.formatCurrency(e.expenses) : "-", width: 68, align: .trailing, color: e.expenses > 0 ? .green : .secondary)
                                                tableDataCell(hasPhoto ? "📷 Ja" : "-", width: 58, align: .center, color: hasPhoto ? .blue : .secondary, isBold: hasPhoto)
                                            }
                                            .background(idx % 2 == 0 ? Color.cardBackground : Color.fieldBackground.opacity(0.55))
                                            Divider()
                                        }
                                    }
                                    .clipShape(RoundedRectangle(cornerRadius: 14))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 14)
                                            .stroke(Color.secondary.opacity(0.25), lineWidth: 1)
                                    )
                                    .padding(.horizontal, 16)
                                }
                            }
                        }
                    } else {
                        // MARK: - Textbericht Vorschau
                        VStack(alignment: .leading, spacing: 8) {
                            Text(lang.isArabic ? "معاينة التقرير النصي" : "Textbericht-Vorschau")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.secondary)
                                .textCase(.uppercase)
                                .padding(.horizontal, 16)
                            
                            Text(formattedReportText)
                                .font(.system(size: 11, design: .monospaced))
                                .lineSpacing(3)
                                .padding(14)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color.cardBackground)
                                .cornerRadius(14)
                                .padding(.horizontal, 16)
                        }
                    }
                    
                    Spacer(minLength: 30)
                }
                .padding(.top, 12)
            }
            .background(Color.appBackground)
            .navigationTitle(lang.isArabic ? "تقرير وجدول الشهر" : "Monats-Tabelle & Export")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(lang.isArabic ? "تم" : "Fertig") { dismiss() }
                        .fontWeight(.bold)
                }
            }
            .sheet(isPresented: $isSharing) {
                if let url = shareURL {
                    ShareSheet(activityItems: [url])
                }
            }
        }
    }
    
    // MARK: - Table Builder Helpers
    
    struct WorkerSummaryRow: Identifiable {
        let id: String
        let workerName: String
        let days: Int
        let hours: Double
        let workerRate: Double
        let baseWage: Double
        let clientAR: Double
        let fuel: Double
        let expenses: Double
        let deposit: Double
        let netPayout: Double
    }
    
    private func buildSummaryRows() -> [WorkerSummaryRow] {
        filteredWorkers.map { w in
            let wEntries = timeVM.allEntries.filter { $0.userId == w.id && $0.date.hasPrefix(timeVM.selectedMonth) }
            let settlement = timeVM.allSettlements.first(where: { $0.userId == w.id && $0.month == timeVM.selectedMonth })
            let calc = TimeCalculations.calculateSettlement(
                entries: wEntries,
                clientRate: settlement?.customClientRate ?? w.clientRate,
                workerRate: settlement?.customWorkerRate ?? w.workerRate,
                deposit: settlement?.deposit ?? 0.0,
                operatingExpenses: settlement?.operatingExpenses ?? 0.0
            )
            return WorkerSummaryRow(
                id: w.id,
                workerName: w.displayName,
                days: wEntries.count,
                hours: calc.totalHours,
                workerRate: calc.workerRate,
                baseWage: calc.workerTotalAmount,
                clientAR: calc.clientTotalAmount,
                fuel: calc.totalFuelExpenses,
                expenses: calc.totalExpenses,
                deposit: calc.deposit,
                netPayout: calc.netPayout
            )
        }
    }
    
    private func calculateTotalSummary(rows: [WorkerSummaryRow]) -> WorkerSummaryRow {
        WorkerSummaryRow(
            id: "TOTAL",
            workerName: "GESAMT",
            days: rows.reduce(0) { $0 + $1.days },
            hours: rows.reduce(0.0) { $0 + $1.hours },
            workerRate: 0,
            baseWage: rows.reduce(0.0) { $0 + $1.baseWage },
            clientAR: rows.reduce(0.0) { $0 + $1.clientAR },
            fuel: rows.reduce(0.0) { $0 + $1.fuel },
            expenses: rows.reduce(0.0) { $0 + $1.expenses },
            deposit: rows.reduce(0.0) { $0 + $1.deposit },
            netPayout: rows.reduce(0.0) { $0 + $1.netPayout }
        )
    }
    
    @ViewBuilder
    private func tableHeaderCell(_ title: String, width: CGFloat, align: Alignment) -> some View {
        Text(title)
            .font(.system(size: 10, weight: .bold))
            .foregroundColor(.white)
            .lineLimit(1)
            .frame(width: width, alignment: align)
            .padding(.vertical, 9)
            .padding(.horizontal, 6)
    }
    
    @ViewBuilder
    private func tableDataCell(_ text: String, width: CGFloat, align: Alignment, color: Color = .primary, isBold: Bool = false) -> some View {
        Text(text)
            .font(.system(size: 11, weight: isBold ? .bold : .regular))
            .foregroundColor(color)
            .lineLimit(1)
            .frame(width: width, alignment: align)
            .padding(.vertical, 8)
            .padding(.horizontal, 6)
    }
    
    // MARK: - Export Actions
    
    private func copyForTable() {
        #if canImport(UIKit)
        UIPasteboard.general.string = tableExportText
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        #endif
        withAnimation {
            copiedNotice = true
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 4) {
            withAnimation {
                copiedNotice = false
            }
        }
    }
    
    private func prepareAndShareExcelTable() {
        let fileName = "BauZeit_Tabelle_\(timeVM.selectedMonth).xls"
        let path = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)
        let htmlTable = AIDocumentGenerator.generateExcelHTMLTable(
            workers: workers,
            month: timeVM.selectedMonth,
            entries: timeVM.allEntries,
            settlements: timeVM.allSettlements,
            filterWorkerId: selectedFilterWorkerId
        )
        try? htmlTable.write(to: path, atomically: true, encoding: .utf8)
        self.shareURL = path
        self.isSharing = true
    }
    
    private func prepareAndShareCSV() {
        let fileName = "BauZeit_Tabelle_\(timeVM.selectedMonth).csv"
        let path = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)
        let bom = "\u{FEFF}"
        let csvContent = bom + tableExportText.replacingOccurrences(of: "\t", with: ";")
        try? csvContent.write(to: path, atomically: true, encoding: .utf8)
        self.shareURL = path
        self.isSharing = true
    }
}

#if os(iOS)
struct ShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
#endif

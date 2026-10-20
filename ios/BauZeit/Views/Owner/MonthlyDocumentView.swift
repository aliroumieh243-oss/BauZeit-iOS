import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

struct MonthlyDocumentView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var timeVM: TimeTrackingViewModel
    @EnvironmentObject var lang: LanguageManager
    
    @State private var copiedNotice: Bool = false
    @State private var isSharing: Bool = false
    @State private var shareURL: URL? = nil
    
    var workers: [UserProfile] {
        authVM.users.filter { $0.role == .member }
    }
    
    var tableExportText: String {
        AIDocumentGenerator.generateTableExport(
            workers: workers,
            month: timeVM.selectedMonth,
            entries: timeVM.allEntries,
            settlements: timeVM.allSettlements
        )
    }
    
    var formattedReportText: String {
        AIDocumentGenerator.generateFormattedReport(
            workers: workers,
            month: timeVM.selectedMonth,
            entries: timeVM.allEntries,
            settlements: timeVM.allSettlements
        )
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    
                    // MARK: - Hero Action Card
                    VStack(alignment: .leading, spacing: 14) {
                        HStack(spacing: 12) {
                            Circle()
                                .fill(LinearGradient(
                                    colors: [Color.blue, Color.purple],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ))
                                .frame(width: 44, height: 44)
                                .overlay(Image(systemName: "sparkles").foregroundColor(.white).font(.system(size: 20)))
                            
                            VStack(alignment: .leading, spacing: 2) {
                                Text(lang.isArabic ? "تقرير الجدول الذكي جاهز" : "KI-Monatsdokument bereit")
                                    .font(.headline)
                                    .fontWeight(.bold)
                                Text(lang.isArabic ? "جاهز للنقل المباشر إلى جداول إكسل أو غوغل شيتس" : "Perfekt vorbereitet zur Übertragung in deine Tabellen")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        
                        Divider()
                        
                        // Action Buttons
                        VStack(spacing: 10) {
                            // Kopieren Button
                            Button(action: copyForTable) {
                                HStack {
                                    Image(systemName: copiedNotice ? "checkmark.circle.fill" : "doc.on.doc.fill")
                                    Text(copiedNotice
                                         ? (lang.isArabic ? "تم النسخ بنجاح!" : "Kopiert! Bereit zum Einfügen")
                                         : (lang.isArabic ? "نسخ للجدول (إكسل / غوغل)" : "In Tabelle einfügen (Kopieren)"))
                                        .fontWeight(.bold)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(copiedNotice ? Color.green : Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(14)
                                .shadow(color: (copiedNotice ? Color.green : Color.blue).opacity(0.3), radius: 6, y: 3)
                            }
                            
                            // CSV Teilen Button
                            Button(action: prepareAndShareCSV) {
                                HStack {
                                    Image(systemName: "square.and.arrow.up")
                                    Text(lang.isArabic ? "مشاركة كملف إكسل (.csv)" : "Als Excel / CSV Datei teilen")
                                        .fontWeight(.semibold)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(Color.fieldBackground)
                                .foregroundColor(.primary)
                                .cornerRadius(14)
                            }
                        }
                    }
                    .padding(18)
                    .background(Color.cardBackground)
                    .cornerRadius(20)
                    .shadow(color: .black.opacity(0.06), radius: 10, y: 4)
                    .padding(.horizontal, 16)
                    
                    // Notice wenn kopiert
                    if copiedNotice {
                        HStack(spacing: 8) {
                            Image(systemName: "info.circle.fill")
                                .foregroundColor(.green)
                            Text(lang.isArabic
                                 ? "افتح برنامج الإكسل أو جداول غوغل واضغط 'لصق' وستنزل البيانات مرتبة في أعمدة."
                                 : "Öffne jetzt Excel oder Google Tabellen und drücke auf 'Einfügen' – alles wird in Spalten sortiert!")
                                .font(.caption)
                                .foregroundColor(.green)
                        }
                        .padding(12)
                        .background(Color.green.opacity(0.12))
                        .cornerRadius(12)
                        .padding(.horizontal, 16)
                    }
                    
                    // MARK: - Vorschau Dokument
                    VStack(alignment: .leading, spacing: 10) {
                        Text(lang.isArabic ? "معاينة التقرير الكامل" : "Dokumentenvorschau")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.secondary)
                            .textCase(.uppercase)
                            .padding(.horizontal, 16)
                        
                        Text(formattedReportText)
                            .font(.system(size: 12, design: .monospaced))
                            .lineSpacing(3)
                            .padding(16)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.cardBackground)
                            .cornerRadius(16)
                            .shadow(color: .black.opacity(0.04), radius: 6, y: 2)
                            .padding(.horizontal, 16)
                    }
                    
                    Spacer(minLength: 30)
                }
                .padding(.top, 12)
            }
            .background(Color.appBackground)
            .navigationTitle(lang.isArabic ? "تقرير الشهر" : "Monatsdokument")
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
    
    private func prepareAndShareCSV() {
        let fileName = "BauZeit_\(timeVM.selectedMonth).csv"
        let path = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)
        
        // CSV mit Semikolon für deutsches Excel / Google Sheets
        let csvContent = tableExportText.replacingOccurrences(of: "\t", with: ";")
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

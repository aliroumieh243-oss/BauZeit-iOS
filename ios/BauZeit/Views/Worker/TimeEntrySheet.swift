import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

struct TimeEntrySheet: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var timeVM: TimeTrackingViewModel
    @EnvironmentObject var lang: LanguageManager
    
    let dateStr: String // "YYYY-MM-DD"
    let formattedDate: String // "Mo. 19. Okt"
    let userId: String
    let existingEntry: TimeEntry?
    
    // Echte native iOS-Uhrzeiten als Date
    @State private var startDate: Date = Calendar.current.date(bySettingHour: 8, minute: 0, second: 0, of: Date()) ?? Date()
    @State private var endDate: Date = Calendar.current.date(bySettingHour: 17, minute: 0, second: 0, of: Date()) ?? Date()
    @State private var breakMinutes: Int = 30
    @State private var siteDescription: String = ""
    @State private var notes: String = ""
    
    // Neue Ausgaben-Felder: Benzin & Geld ausgegeben
    @State private var fuelExpensesText: String = ""
    @State private var expensesText: String = ""
    @State private var expenseNote: String = ""
    
    let breakOptions = [0, 15, 30, 45, 60]
    let sitePresets = [
        "Baustelle HafenCity - Trockenbau",
        "Villa Blankenese - Spachtelarbeiten",
        "Gewerbepark Nord - Deckenbau",
        "EFH Bergedorf - Trennwände",
        "Büro Altona - Brandschutz"
    ]
    
    private var timeFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter
    }
    
    var startTimeString: String {
        timeFormatter.string(from: startDate)
    }
    
    var endTimeString: String {
        timeFormatter.string(from: endDate)
    }
    
    var liveDecimalHours: Double {
        TimeCalculations.calculateDecimalHours(
            startTime: startTimeString,
            endTime: endTimeString,
            breakMinutes: breakMinutes
        )
    }
    
    var parsedFuelExpenses: Double {
        Double(fuelExpensesText.replacingOccurrences(of: ",", with: ".").trimmingCharacters(in: .whitespaces)) ?? 0.0
    }
    
    var parsedExpenses: Double {
        Double(expensesText.replacingOccurrences(of: ",", with: ".").trimmingCharacters(in: .whitespaces)) ?? 0.0
    }
    
    var body: some View {
        NavigationView {
            Form {
                // MARK: - Live Arbeitszeit & Auslagen Hero Card
                Section {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(lang.text("Geleistete Arbeitszeit"))
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.blue)
                                    .textCase(.uppercase)
                                Text("\(startTimeString) bis \(endTimeString) Uhr")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                            Spacer()
                            VStack(alignment: .trailing, spacing: 1) {
                                Text("\(TimeCalculations.formatHours(liveDecimalHours)) \(lang.text("Std."))")
                                    .font(.system(size: 24, weight: .black, design: .rounded))
                                    .foregroundColor(.blue)
                                Text("\(lang.text("Pause:")) \(breakMinutes) \(lang.text("Minuten"))")
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                            }
                        }
                        
                        // Zusätzliche Erstattungs-Vorschau falls Benzin/Ausgaben eingetragen sind
                        if parsedFuelExpenses > 0 || parsedExpenses > 0 {
                            Divider()
                            HStack {
                                if parsedFuelExpenses > 0 {
                                    HStack(spacing: 4) {
                                        Image(systemName: "fuelpump.fill")
                                            .foregroundColor(.orange)
                                            .font(.caption)
                                        Text("\(lang.text("Benzin:")) \(TimeCalculations.formatCurrency(parsedFuelExpenses))")
                                            .font(.caption)
                                            .fontWeight(.semibold)
                                    }
                                }
                                Spacer()
                                if parsedExpenses > 0 {
                                    HStack(spacing: 4) {
                                        Image(systemName: "banknote.fill")
                                            .foregroundColor(.green)
                                            .font(.caption)
                                        Text("\(lang.text("Auslagen:")) \(TimeCalculations.formatCurrency(parsedExpenses))")
                                            .font(.caption)
                                            .fontWeight(.semibold)
                                    }
                                }
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }
                
                // MARK: - Arbeitszeiten mit echter nativer iOS-Uhr
                Section(lang.text("Arbeitszeit (Beginn & Ende)")) {
                    DatePicker(lang.text("Arbeitsbeginn"), selection: $startDate, displayedComponents: .hourAndMinute)
                        .datePickerStyle(.compact)
                    
                    DatePicker(lang.text("Feierabend"), selection: $endDate, displayedComponents: .hourAndMinute)
                        .datePickerStyle(.compact)
                }
                
                // MARK: - Tägliche Pause
                Section(lang.text("Tägliche Pause")) {
                    HStack {
                        Image(systemName: "cup.and.saucer.fill")
                            .foregroundColor(.brown)
                        Text(lang.text("Pause:"))
                        Spacer()
                        Text("\(breakMinutes) \(lang.text("Minuten"))")
                            .fontWeight(.bold)
                    }
                    
                    // Schnellauswahl-Pills für Pause
                    HStack(spacing: 8) {
                        ForEach(breakOptions, id: \.self) { mins in
                            Button(action: {
                                #if canImport(UIKit)
                                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                #endif
                                breakMinutes = mins
                            }) {
                                Text(mins == 0 ? lang.text("Keine") : "\(mins)m")
                                    .font(.caption)
                                    .fontWeight(breakMinutes == mins ? .bold : .regular)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 8)
                                    .background(breakMinutes == mins ? Color.brown : Color.gray.opacity(0.12))
                                    .foregroundColor(breakMinutes == mins ? .white : .primary)
                                    .cornerRadius(8)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.vertical, 2)
                    
                    Stepper("\(lang.text("Pause:")) \(breakMinutes) \(lang.text("Minuten"))", value: $breakMinutes, in: 0...180, step: 5)
                        .font(.footnote)
                }
                
                // MARK: - Baustelle & Einsatzort
                Section(lang.text("Baustelle / Einsatzort")) {
                    HStack {
                        Image(systemName: "building.2.fill")
                            .foregroundColor(.blue)
                        TextField(lang.text("z.B. Baustelle HafenCity"), text: $siteDescription)
                    }
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 6) {
                            ForEach(sitePresets, id: \.self) { preset in
                                Button(action: {
                                    siteDescription = preset
                                }) {
                                    Text(preset.components(separatedBy: " - ").first ?? preset)
                                        .font(.caption2)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 5)
                                        .background(Color.gray.opacity(0.15))
                                        .foregroundColor(.primary)
                                        .cornerRadius(6)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.vertical, 2)
                    }
                }
                
                // MARK: - Auslagen & Benzingeld
                Section {
                    // Benzingeld
                    HStack {
                        Label(lang.text("Benzingeld / Sprit"), systemImage: "fuelpump.fill")
                            .foregroundColor(.orange)
                        Spacer()
                        TextField("0,00", text: $fuelExpensesText)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 90)
                        Text("€")
                            .foregroundColor(.secondary)
                    }
                    
                    // Sonstige Auslagen / Material
                    HStack {
                        Label(lang.text("Geld ausgegeben"), systemImage: "banknote.fill")
                            .foregroundColor(.green)
                        Spacer()
                        TextField("0,00", text: $expensesText)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 90)
                        Text("€")
                            .foregroundColor(.secondary)
                    }
                    
                    // Notiz zu den Ausgaben
                    if !fuelExpensesText.isEmpty || !expensesText.isEmpty {
                        HStack {
                            Image(systemName: "text.bubble.fill")
                                .foregroundColor(.secondary)
                            TextField(lang.text("Zweck (z.B. Tanken Sprinter, Schrauben OBI)"), text: $expenseNote)
                                .font(.footnote)
                        }
                    }
                } header: {
                    Text(lang.text("Auslagen & Fahrtkosten"))
                }
                
                // MARK: - Allgemeine Notizen
                Section(lang.text("Optionale Notizen")) {
                    TextField(lang.text("Besonderheiten, Wetter, Zusatzarbeiten..."), text: $notes)
                        .font(.footnote)
                }
                
                // MARK: - Löschen Button falls Eintrag existiert
                if let existing = existingEntry {
                    Section {
                        Button(role: .destructive, action: {
                            timeVM.deleteEntry(id: existing.id)
                            dismiss()
                        }) {
                            HStack {
                                Spacer()
                                Image(systemName: "trash.fill")
                                Text(lang.text("Tageseintrag löschen"))
                                    .fontWeight(.semibold)
                                Spacer()
                            }
                        }
                    }
                }
            }
            .navigationTitle(formattedDate)
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(lang.text("Abbrechen")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(lang.text("Speichern")) {
                        #if canImport(UIKit)
                        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                        #endif
                        timeVM.saveEntry(
                            id: existingEntry?.id,
                            userId: userId,
                            date: dateStr,
                            startTime: startTimeString,
                            endTime: endTimeString,
                            breakMinutes: breakMinutes,
                            siteDescription: siteDescription,
                            notes: notes.isEmpty ? nil : notes,
                            expenses: parsedExpenses,
                            fuelExpenses: parsedFuelExpenses,
                            expenseNote: expenseNote.isEmpty ? nil : expenseNote
                        )
                        dismiss()
                    }
                    .fontWeight(.bold)
                }
            }
            .onAppear {
                if let e = existingEntry {
                    let parser = DateFormatter()
                    parser.dateFormat = "HH:mm"
                    if let s = parser.date(from: e.startTime) {
                        startDate = s
                    }
                    if let end = parser.date(from: e.endTime) {
                        endDate = end
                    }
                    breakMinutes = e.breakMinutes
                    siteDescription = e.siteDescription
                    notes = e.notes ?? ""
                    
                    if e.fuelExpenses > 0 {
                        fuelExpensesText = String(format: "%.2f", e.fuelExpenses)
                    }
                    if e.expenses > 0 {
                        expensesText = String(format: "%.2f", e.expenses)
                    }
                    expenseNote = e.expenseNote ?? ""
                }
            }
        }
    }
}

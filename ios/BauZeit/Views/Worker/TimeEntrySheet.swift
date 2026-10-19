import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

struct TimeEntrySheet: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var timeVM: TimeTrackingViewModel
    
    let dateStr: String // "YYYY-MM-DD"
    let formattedDate: String // "Mi. 01. Jun"
    let userId: String
    let existingEntry: TimeEntry?
    
    @State private var startTime: String = "08:00"
    @State private var endTime: String = "17:00"
    @State private var breakMinutes: Int = 30
    @State private var siteDescription: String = ""
    @State private var notes: String = ""
    
    let startPresets = ["07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "13:30"]
    let endPresets = ["16:00", "16:30", "17:00", "17:30", "18:00", "18:40"]
    let breakPresets = [0, 10, 15, 30, 40, 45, 60]
    let sitePresets = [
        "Baustelle HafenCity - Trockenbau",
        "Villa Blankenese - Spachtelarbeiten",
        "Gewerbepark Nord - Akustikdecken",
        "Einfamilienhaus Bergedorf - Trennwände",
        "Büroetage Altona - Brandschutzverkleidung"
    ]
    
    var liveDecimalHours: Double {
        TimeCalculations.calculateDecimalHours(startTime: startTime, endTime: endTime, breakMinutes: breakMinutes)
    }
    
    var body: some View {
        NavigationView {
            Form {
                liveCalculationSection
                startTimeSection
                endTimeSection
                breakSection
                siteSection
                
                if let existing = existingEntry {
                    Section {
                        Button(role: .destructive, action: {
                            timeVM.deleteEntry(id: existing.id)
                            dismiss()
                        }) {
                            HStack {
                                Spacer()
                                Image(systemName: "trash")
                                Text("Tageseintrag löschen")
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
                    Button("Abbrechen") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Speichern") {
                        timeVM.saveEntry(
                            id: existingEntry?.id,
                            userId: userId,
                            date: dateStr,
                            startTime: startTime,
                            endTime: endTime,
                            breakMinutes: breakMinutes,
                            siteDescription: siteDescription,
                            notes: notes
                        )
                        dismiss()
                    }
                    .fontWeight(.bold)
                }
            }
            .onAppear {
                if let e = existingEntry {
                    startTime = e.startTime
                    endTime = e.endTime
                    breakMinutes = e.breakMinutes
                    siteDescription = e.siteDescription
                    notes = e.notes ?? ""
                }
            }
        }
    }
    
    private var liveCalculationSection: some View {
        Section {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Geleistete Arbeitszeit")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                    Text("\(startTime) bis \(endTime) (Pause: \(breakMinutes)m)")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 1) {
                    Text("\(TimeCalculations.formatHours(liveDecimalHours)) Std.")
                        .font(.system(size: 22, weight: .black, design: .rounded))
                        .foregroundColor(.blue)
                    Text("Dezimalstunden")
                        .font(.system(size: 10))
                        .foregroundColor(.secondary)
                }
            }
            .padding(.vertical, 4)
        }
    }
    
    private var startTimeSection: some View {
        Section("Beginn (Startzeit)") {
            HStack {
                Image(systemName: "clock.fill")
                    .foregroundColor(.blue)
                TextField("08:00", text: $startTime)
                    .font(.system(.body, design: .monospaced))
            }
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(startPresets, id: \.self) { preset in
                        Button(action: { startTime = preset }) {
                            Text(preset)
                                .font(.caption)
                                .fontWeight(startTime == preset ? .bold : .regular)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(startTime == preset ? Color.blue : Color.gray.opacity(0.15))
                                .foregroundColor(startTime == preset ? .white : .primary)
                                .cornerRadius(8)
                        }
                    }
                }
                .padding(.vertical, 4)
            }
        }
    }
    
    private var endTimeSection: some View {
        Section("Enden (Feierabend)") {
            HStack {
                Image(systemName: "clock.badge.checkmark.fill")
                    .foregroundColor(.orange)
                TextField("17:00", text: $endTime)
                    .font(.system(.body, design: .monospaced))
            }
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(endPresets, id: \.self) { preset in
                        Button(action: { endTime = preset }) {
                            Text(preset)
                                .font(.caption)
                                .fontWeight(endTime == preset ? .bold : .regular)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(endTime == preset ? Color.orange : Color.gray.opacity(0.15))
                                .foregroundColor(endTime == preset ? .white : .primary)
                                .cornerRadius(8)
                        }
                    }
                }
                .padding(.vertical, 4)
            }
        }
    }
    
    private var breakSection: some View {
        Section("Tägliche Pause") {
            HStack {
                Image(systemName: "cup.and.saucer.fill")
                    .foregroundColor(.brown)
                Text("\(breakMinutes) Minuten")
            }
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(breakPresets, id: \.self) { preset in
                        Button(action: { breakMinutes = preset }) {
                            Text(preset == 0 ? "00:00" : String(format: "00:%02d", preset))
                                .font(.caption)
                                .fontWeight(breakMinutes == preset ? .bold : .regular)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(breakMinutes == preset ? Color.brown : Color.gray.opacity(0.15))
                                .foregroundColor(breakMinutes == preset ? .white : .primary)
                                .cornerRadius(8)
                        }
                    }
                }
                .padding(.vertical, 4)
            }
        }
    }
    
    private var siteSection: some View {
        Section("Baustelle Beschreibung / Einsatzort") {
            TextField("z.B. Baustelle HafenCity - Trockenbau", text: $siteDescription)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    ForEach(sitePresets, id: \.self) { preset in
                        Button(action: { siteDescription = preset }) {
                            Text(preset.components(separatedBy: " - ").first ?? preset)
                                .font(.system(size: 11))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.gray.opacity(0.15))
                                .foregroundColor(.secondary)
                                .cornerRadius(6)
                        }
                    }
                }
                .padding(.vertical, 2)
            }
        }
    }
}

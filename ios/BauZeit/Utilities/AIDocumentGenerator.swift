import Foundation

struct AIDocumentGenerator {
    
    /// Erzeugt ein strukturiertes Tabellendokument (TSV / Tab-getrennt), das direkt mit 1-Klick
    /// in Google Tabellen, Excel oder Numbers in exakte Spalten eingefügt werden kann.
    static func generateTableExport(
        workers: [UserProfile],
        month: String,
        entries: [TimeEntry],
        settlements: [MonthlySettlement]
    ) -> String {
        var lines: [String] = []
        
        // Titel & Metadaten
        lines.append("BAUZEIT • MONATSABRECHNUNG & ZEITERFASSUNG")
        lines.append("Abrechnungsmonat:\t\(month)")
        lines.append("Erstellt am:\t\(DateFormatter.localizedString(from: Date(), dateStyle: .medium, timeStyle: .short))")
        lines.append("")
        
        // Block 1: Zusammenfassung je Mitarbeiter
        lines.append("ÜBERSICHT ALLER MITARBEITER")
        lines.append("Mitarbeiter\tStunden (h)\tStundenlohn (€)\tGrundlohn (€)\tBenzin (€)\tAuslagen (€)\tAnzahlung (€)\tAuszahlung (€)")
        
        var totalAllHours: Double = 0.0
        var totalAllPayout: Double = 0.0
        var totalAllFuel: Double = 0.0
        var totalAllExpenses: Double = 0.0
        
        for w in workers {
            let workerEntries = entries.filter { $0.userId == w.id && $0.date.hasPrefix(month) }
            let settlement = settlements.first(where: { $0.userId == w.id && $0.month == month })
            let calc = TimeCalculations.calculateSettlement(
                entries: workerEntries,
                clientRate: settlement?.customClientRate ?? w.clientRate,
                workerRate: settlement?.customWorkerRate ?? w.workerRate,
                deposit: settlement?.deposit ?? 0.0,
                operatingExpenses: settlement?.operatingExpenses ?? 0.0
            )
            
            totalAllHours += calc.totalHours
            totalAllPayout += calc.netPayout
            totalAllFuel += calc.totalFuelExpenses
            totalAllExpenses += calc.totalExpenses
            
            lines.append("\(w.displayName)\t\(TimeCalculations.formatHours(calc.totalHours))\t\(String(format: "%.2f", calc.workerRate))\t\(String(format: "%.2f", calc.workerTotalAmount))\t\(String(format: "%.2f", calc.totalFuelExpenses))\t\(String(format: "%.2f", calc.totalExpenses))\t\(String(format: "%.2f", calc.deposit))\t\(String(format: "%.2f", calc.netPayout))")
        }
        
        lines.append("GESAMT BETRIEB\t\(TimeCalculations.formatHours(totalAllHours))\t-\t-\t\(String(format: "%.2f", totalAllFuel))\t\(String(format: "%.2f", totalAllExpenses))\t-\t\(String(format: "%.2f", totalAllPayout))")
        lines.append("")
        lines.append("================================================================================")
        lines.append("")
        
        // Block 2: Detaillierte Tage-Tabelle für die Buchhaltung
        lines.append("EINZELAUFSTELLUNG ALLER TAGE & EINSÄTZE")
        lines.append("Mitarbeiter\tDatum\tBeginn\tEnde\tPause (Min)\tStunden\tBaustelle / Einsatzort\tBenzin (€)\tAuslagen (€)\tBeleg\tNotiz")
        
        let sortedEntries = entries.filter { $0.date.hasPrefix(month) }.sorted { $0.date < $1.date }
        for e in sortedEntries {
            let workerName = workers.first(where: { $0.id == e.userId })?.displayName ?? "Mitarbeiter"
            let fuelStr = e.fuelExpenses > 0 ? String(format: "%.2f", e.fuelExpenses) : "0,00"
            let expStr = e.expenses > 0 ? String(format: "%.2f", e.expenses) : "0,00"
            let receiptStr = (e.photoData != nil && !e.photoData!.isEmpty) ? "Ja (Foto)" : "-"
            let note = (e.expenseNote ?? e.notes ?? "").replacingOccurrences(of: "\t", with: " ")
            
            lines.append("\(workerName)\t\(e.date)\t\(e.startTime)\t\(e.endTime)\t\(e.breakMinutes)\t\(TimeCalculations.formatHours(e.decimalHours))\t\(e.siteDescription)\t\(fuelStr)\t\(expStr)\t\(receiptStr)\t\(note)")
        }
        
        return lines.joined(separator: "\n")
    }
    
    /// Erzeugt ein formatiertes Textdokument zum Lesen oder Ausdrucken
    static func generateFormattedReport(
        workers: [UserProfile],
        month: String,
        entries: [TimeEntry],
        settlements: [MonthlySettlement]
    ) -> String {
        var doc = ""
        doc += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        doc += "   BAUZEIT • INTELLIGENTES MONATSDOKUMENT        \n"
        doc += "   Abrechnungsmonat: \(month)                     \n"
        doc += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        
        for w in workers {
            let workerEntries = entries.filter { $0.userId == w.id && $0.date.hasPrefix(month) }
            let settlement = settlements.first(where: { $0.userId == w.id && $0.month == month })
            let calc = TimeCalculations.calculateSettlement(
                entries: workerEntries,
                clientRate: settlement?.customClientRate ?? w.clientRate,
                workerRate: settlement?.customWorkerRate ?? w.workerRate,
                deposit: settlement?.deposit ?? 0.0,
                operatingExpenses: settlement?.operatingExpenses ?? 0.0
            )
            
            doc += "👤 MITARBEITER: \(w.displayName.uppercased())\n"
            doc += "  • Geleistete Stunden:  \(TimeCalculations.formatHours(calc.totalHours)) Std. (\(workerEntries.count) Einsatztage)\n"
            doc += "  • Stundenlohn:         \(TimeCalculations.formatCurrency(calc.workerRate))/h\n"
            doc += "  • Grundlohn:           \(TimeCalculations.formatCurrency(calc.workerTotalAmount))\n"
            if calc.totalFuelExpenses > 0 {
                doc += "  • ⛽ Benzingeld-Erstattung: \(TimeCalculations.formatCurrency(calc.totalFuelExpenses))\n"
            }
            if calc.totalExpenses > 0 {
                doc += "  • 💶 Material & Auslagen:   \(TimeCalculations.formatCurrency(calc.totalExpenses))\n"
            }
            if calc.deposit > 0 {
                doc += "  • ⚠️ Abzug Anzahlung:      - \(TimeCalculations.formatCurrency(calc.deposit))\n"
            }
            doc += "  ─────────────────────────────────────────────\n"
            doc += "  💰 ENDGÜLTIGER AUSZAHLUNGSBETRAG: \(TimeCalculations.formatCurrency(calc.netPayout))\n\n"
            
            if !workerEntries.isEmpty {
                doc += "  Tagesliste:\n"
                for e in workerEntries {
                    var extra = ""
                    if e.fuelExpenses > 0 { extra += " [⛽ \(TimeCalculations.formatCurrency(e.fuelExpenses))]" }
                    if e.expenses > 0 { extra += " [💶 \(TimeCalculations.formatCurrency(e.expenses))]" }
                    doc += "   - \(e.date): \(e.startTime)–\(e.endTime) (\(TimeCalculations.formatHours(e.decimalHours))h) • \(e.siteDescription)\(extra)\n"
                }
                doc += "\n"
            }
            doc += "-------------------------------------------------\n\n"
        }
        
        return doc
    }
}

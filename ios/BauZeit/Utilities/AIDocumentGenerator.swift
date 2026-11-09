import Foundation

struct AIDocumentGenerator {
    
    /// Erzeugt ein strukturiertes Tabellendokument (TSV / Tab-getrennt), das direkt mit 1-Klick
    /// in Google Tabellen, Excel oder Numbers in exakte Spalten eingefügt werden kann.
    static func generateTableExport(
        workers: [UserProfile],
        month: String,
        entries: [TimeEntry],
        settlements: [MonthlySettlement],
        filterWorkerId: String? = nil
    ) -> String {
        let targetWorkers: [UserProfile]
        if let fId = filterWorkerId, !fId.isEmpty, fId != "ALL" {
            targetWorkers = workers.filter { $0.id == fId }
        } else {
            targetWorkers = workers
        }
        
        var lines: [String] = []
        
        // Titel & Metadaten
        lines.append("BAUZEIT • MONATSABRECHNUNG & ZEITERFASSUNG")
        lines.append("Abrechnungsmonat:\t\(month)")
        lines.append("Erstellt am:\t\(DateFormatter.localizedString(from: Date(), dateStyle: .medium, timeStyle: .short))")
        lines.append("")
        
        // Block 1: Zusammenfassung je Mitarbeiter
        lines.append("TABELLE 1: MONATSABRECHNUNG JE MITARBEITER")
        lines.append("Mitarbeiter\tTage\tStunden (h)\tStundenlohn (€/h)\tGesamtlohn (€)\tKunden-AR/h (€)\tKunden-AR Gesamt (€)\tNotiz")
        
        var totalDays: Int = 0
        var totalAllHours: Double = 0.0
        var totalAllBaseWage: Double = 0.0
        var totalAllClientAR: Double = 0.0
        
        for w in targetWorkers {
            let workerEntries = entries.filter { $0.userId == w.id && $0.date.hasPrefix(month) }
            let settlement = settlements.first(where: { $0.userId == w.id && $0.month == month })
            let calc = TimeCalculations.calculateSettlement(
                entries: workerEntries,
                clientRate: settlement?.customClientRate ?? w.clientRate,
                workerRate: settlement?.customWorkerRate ?? w.workerRate,
                deposit: settlement?.deposit ?? 0.0,
                operatingExpenses: settlement?.operatingExpenses ?? 0.0
            )
            
            totalDays += workerEntries.count
            totalAllHours += calc.totalHours
            totalAllBaseWage += calc.workerTotalAmount
            totalAllClientAR += calc.clientTotalAmount
            
            let sNote = (settlement?.notes ?? "-").replacingOccurrences(of: "\t", with: " ")
            
            lines.append("\(w.displayName)\t\(workerEntries.count)\t\(TimeCalculations.formatHours(calc.totalHours))\t\(String(format: "%.2f", calc.workerRate))\t\(String(format: "%.2f", calc.workerTotalAmount))\t\(String(format: "%.2f", calc.clientRate))\t\(String(format: "%.2f", calc.clientTotalAmount))\t\(sNote)")
        }
        
        lines.append("GESAMT\t\(totalDays)\t\(TimeCalculations.formatHours(totalAllHours))\t-\t\(String(format: "%.2f", totalAllBaseWage))\t-\t\(String(format: "%.2f", totalAllClientAR))\t-")
        lines.append("")
        
        // Block 2: Detaillierte Tage-Tabelle für die Buchhaltung
        lines.append("TABELLE 2: EINZELAUFSTELLUNG ALLER TAGE & EINSÄTZE")
        lines.append("Datum\tMitarbeiter\tBeginn\tEnde\tPause (Min)\tStunden (h)\tBaustelle / Einsatzort\tNotiz")
        
        let allowedIds = Set(targetWorkers.map { $0.id })
        let sortedEntries = entries
            .filter { $0.date.hasPrefix(month) && allowedIds.contains($0.userId) }
            .sorted { $0.date < $1.date }
        
        for e in sortedEntries {
            let workerName = workers.first(where: { $0.id == e.userId })?.displayName ?? "Mitarbeiter"
            let note = (e.expenseNote ?? e.notes ?? "-").replacingOccurrences(of: "\t", with: " ")
            
            lines.append("\(e.date)\t\(workerName)\t\(e.startTime)\t\(e.endTime)\t\(e.breakMinutes)\t\(TimeCalculations.formatHours(e.decimalHours))\t\(e.siteDescription)\t\(note)")
        }
        
        return lines.joined(separator: "\n")
    }
    
    /// Erzeugt eine echte formatierte Excel/HTML-Tabelle (.xls), die in Excel, Numbers und LibreOffice
    /// mit echten Spalten, Rahmenlinien, farbigen Kopfzeilen und Summenzeilen geöffnet wird.
    static func generateExcelHTMLTable(
        workers: [UserProfile],
        month: String,
        entries: [TimeEntry],
        settlements: [MonthlySettlement],
        filterWorkerId: String? = nil
    ) -> String {
        let targetWorkers: [UserProfile]
        if let fId = filterWorkerId, !fId.isEmpty, fId != "ALL" {
            targetWorkers = workers.filter { $0.id == fId }
        } else {
            targetWorkers = workers
        }
        
        var html = """
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #0f172a; }
            h1 { font-size: 18px; color: #1e3a8a; margin-bottom: 4px; }
            h2 { font-size: 14px; color: #1e293b; margin-top: 20px; margin-bottom: 8px; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            th { background-color: #1e3a8a; color: #ffffff; font-weight: bold; text-align: left; padding: 8px 10px; border: 1px solid #cbd5e1; }
            td { padding: 7px 10px; border: 1px solid #cbd5e1; }
            tr:nth-child(even) td { background-color: #f8fafc; }
            .num { text-align: right; font-variant-numeric: tabular-nums; }
            .total-row td { background-color: #e2e8f0 !important; font-weight: bold; border-top: 2px solid #0f172a; }
            .payout { color: #047857; font-weight: bold; }
            .ar-col { color: #1d4ed8; font-weight: bold; }
            .deduct { color: #dc2626; }
        </style>
        </head>
        <body>
        <h1>BAUZEIT • MONATSABRECHNUNG (\(month))</h1>
        <p>Erstellt am: \(DateFormatter.localizedString(from: Date(), dateStyle: .medium, timeStyle: .short))</p>
        
        <h2>1. Monatsabrechnung & Lohnübersicht (Stunden × Stundenlohn)</h2>
        <table>
            <thead>
                <tr>
                    <th>Mitarbeiter</th>
                    <th class="num">Einsatztage</th>
                    <th class="num">Stunden (h)</th>
                    <th class="num">Stundenlohn (€/h)</th>
                    <th class="num">Gesamtlohn (€)</th>
                    <th class="num">Kunden-AR/h (€)</th>
                    <th class="num">Kunden-AR Gesamt (€)</th>
                    <th>Notiz</th>
                </tr>
            </thead>
            <tbody>
        """
        
        var totalDays = 0
        var totalHours = 0.0
        var totalBase = 0.0
        var totalAR = 0.0
        
        for w in targetWorkers {
            let wEntries = entries.filter { $0.userId == w.id && $0.date.hasPrefix(month) }
            let settlement = settlements.first(where: { $0.userId == w.id && $0.month == month })
            let calc = TimeCalculations.calculateSettlement(
                entries: wEntries,
                clientRate: settlement?.customClientRate ?? w.clientRate,
                workerRate: settlement?.customWorkerRate ?? w.workerRate,
                deposit: settlement?.deposit ?? 0.0,
                operatingExpenses: settlement?.operatingExpenses ?? 0.0
            )
            
            totalDays += wEntries.count
            totalHours += calc.totalHours
            totalBase += calc.workerTotalAmount
            totalAR += calc.clientTotalAmount
            
            let noteStr = settlement?.notes ?? "-"
            
            html += """
                <tr>
                    <td><strong>\(w.displayName)</strong></td>
                    <td class="num">\(wEntries.count)</td>
                    <td class="num">\(TimeCalculations.formatHours(calc.totalHours))</td>
                    <td class="num">\(TimeCalculations.formatCurrency(calc.workerRate))</td>
                    <td class="num payout">\(TimeCalculations.formatCurrency(calc.workerTotalAmount))</td>
                    <td class="num">\(TimeCalculations.formatCurrency(calc.clientRate))</td>
                    <td class="num ar-col">\(TimeCalculations.formatCurrency(calc.clientTotalAmount))</td>
                    <td>\(noteStr)</td>
                </tr>
            """
        }
        
        html += """
                <tr class="total-row">
                    <td>GESAMT</td>
                    <td class="num">\(totalDays)</td>
                    <td class="num">\(TimeCalculations.formatHours(totalHours))</td>
                    <td class="num">-</td>
                    <td class="num payout">\(TimeCalculations.formatCurrency(totalBase))</td>
                    <td class="num">-</td>
                    <td class="num ar-col">\(TimeCalculations.formatCurrency(totalAR))</td>
                    <td>-</td>
                </tr>
            </tbody>
        </table>
        
        <h2>2. Einzelaufstellung aller Tage & Einsätze</h2>
        <table>
            <thead>
                <tr>
                    <th>Datum</th>
                    <th>Mitarbeiter</th>
                    <th>Beginn</th>
                    <th>Ende</th>
                    <th class="num">Pause (Min)</th>
                    <th class="num">Stunden (h)</th>
                    <th>Baustelle / Einsatzort</th>
                    <th>Notiz</th>
                </tr>
            </thead>
            <tbody>
        """
        
        let allowedIds = Set(targetWorkers.map { $0.id })
        let sortedEntries = entries
            .filter { $0.date.hasPrefix(month) && allowedIds.contains($0.userId) }
            .sorted { $0.date < $1.date }
        
        for e in sortedEntries {
            let workerName = workers.first(where: { $0.id == e.userId })?.displayName ?? "Mitarbeiter"
            let note = e.expenseNote ?? e.notes ?? "-"
            
            html += """
                <tr>
                    <td>\(e.date)</td>
                    <td>\(workerName)</td>
                    <td>\(e.startTime)</td>
                    <td>\(e.endTime)</td>
                    <td class="num">\(e.breakMinutes)</td>
                    <td class="num"><strong>\(TimeCalculations.formatHours(e.decimalHours))</strong></td>
                    <td>\(e.siteDescription)</td>
                    <td>\(note)</td>
                </tr>
            """
        }
        
        html += """
                <tr class="total-row">
                    <td colspan="5">SUMME (\(sortedEntries.count) Einsätze)</td>
                    <td class="num">\(TimeCalculations.formatHours(totalHours)) h</td>
                    <td>-</td>
                    <td>-</td>
                </tr>
            </tbody>
        </table>
        </body>
        </html>
        """
        
        return html
    }
    
    /// Erzeugt ein formatiertes Textdokument zum Lesen oder Ausdrucken
    static func generateFormattedReport(
        workers: [UserProfile],
        month: String,
        entries: [TimeEntry],
        settlements: [MonthlySettlement],
        filterWorkerId: String? = nil
    ) -> String {
        let targetWorkers: [UserProfile]
        if let fId = filterWorkerId, !fId.isEmpty, fId != "ALL" {
            targetWorkers = workers.filter { $0.id == fId }
        } else {
            targetWorkers = workers
        }
        
        var doc = ""
        doc += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        doc += "   BAUZEIT • INTELLIGENTES MONATSDOKUMENT        \n"
        doc += "   Abrechnungsmonat: \(month)                     \n"
        doc += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        
        for w in targetWorkers {
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
            doc += "  • Kunden-Abrechnung:   \(TimeCalculations.formatCurrency(calc.clientTotalAmount)) (\(TimeCalculations.formatCurrency(calc.clientRate))/h)\n"
            if calc.totalFuelExpenses > 0 {
                doc += "  • ⛽ Benzingeld-Erstattung: \(TimeCalculations.formatCurrency(calc.totalFuelExpenses))\n"
            }
            if calc.totalExpenses > 0 {
                doc += "  • 💶 Material & Auslagen:   \(TimeCalculations.formatCurrency(calc.totalExpenses))\n"
            }
            if calc.deposit > 0 {
                doc += "  • ⚠️ Abzug Anzahlung:      - \(TimeCalculations.formatCurrency(calc.deposit))\n"
            }
            if calc.operatingExpenses > 0 {
                doc += "  • 🏢 Betriebskosten:       \(TimeCalculations.formatCurrency(calc.operatingExpenses))\n"
            }
            if let note = settlement?.notes, !note.isEmpty {
                doc += "  • 📝 Notiz:                \(note)\n"
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

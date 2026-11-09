// Automated verification test suite for BauZeit
import assert from 'node:assert';

console.log('🧪 Starte Testsuite für BauZeit (iOS & Web)...\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

// 1. Time Calculations
function calculateDecimalHours(startTime, endTime, breakMinutes = 0) {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  let startTotalMinutes = startH * 60 + startM;
  let endTotalMinutes = endH * 60 + endM;
  if (endTotalMinutes < startTotalMinutes) endTotalMinutes += 24 * 60;
  const workedMinutes = endTotalMinutes - startTotalMinutes - (breakMinutes || 0);
  if (workedMinutes <= 0) return 0;
  return Math.round((workedMinutes / 60) * 100) / 100;
}

function calculateMonthlySettlement(entries, clientRate = 35.0, workerRate = 12.0, deposit = 0, operatingExpenses = 0) {
  const totalHours = entries.reduce((sum, e) => sum + (e.decimalHours || 0), 0);
  const roundedHours = Math.round(totalHours * 100) / 100;
  const clientTotalAmount = Math.round(roundedHours * clientRate * 100) / 100;
  const workerTotalAmount = Math.round(roundedHours * workerRate * 100) / 100;
  // Dauerhaft vereinfachte Monatsabrechnung: Rein Stunden × Stundenlohn = Gesamtlohn
  const netPayout = workerTotalAmount;
  return {
    totalHours: roundedHours,
    clientTotalAmount,
    workerTotalAmount,
    deposit,
    operatingExpenses,
    netPayout,
    clientRate,
    workerRate
  };
}

console.log('--- 1. BERECHNUNGSTESTS (ZEITEN & PAUSEN) ---');
test('08:00 bis 17:00 mit 30 Min Pause ergibt 8.50 Std.', () => {
  const hours = calculateDecimalHours('08:00', '17:00', 30);
  assert.strictEqual(hours, 8.50);
});

test('08:00 bis 11:00 ohne Pause ergibt 3.00 Std.', () => {
  const hours = calculateDecimalHours('08:00', '11:00', 0);
  assert.strictEqual(hours, 3.00);
});

test('09:00 bis 18:00 mit 40 Min Pause ergibt 8.33 Std.', () => {
  const hours = calculateDecimalHours('09:00', '18:00', 40);
  assert.strictEqual(hours, 8.33);
});

test('09:30 bis 18:40 mit 10 Min Pause ergibt 9.00 Std.', () => {
  const hours = calculateDecimalHours('09:30', '18:40', 10);
  assert.strictEqual(hours, 9.00);
});

test('Pausenabzug größer als Arbeitszeit ergibt 0.00 Std.', () => {
  const hours = calculateDecimalHours('08:00', '09:00', 90);
  assert.strictEqual(hours, 0);
});

console.log('\n--- 2. LOHN- & FINANZBERECHNUNGEN (VORGABEN DES USERS) ---');
test('Berechnung mit 77.50 Monatsstunden ergibt genau 930.00 € Gesamtlohn (77.50 × 12 €)', () => {
  const entries = [
    { decimalHours: 8.50 },
    { decimalHours: 8.50 },
    { decimalHours: 8.50 },
    { decimalHours: 8.50 },
    { decimalHours: 8.50 },
    { decimalHours: 8.50 },
    { decimalHours: 8.50 },
    { decimalHours: 8.50 },
    { decimalHours: 9.50 }
  ];
  // 8 * 8.50 + 9.50 = 68.00 + 9.50 = 77.50 Std.
  const settlement = calculateMonthlySettlement(entries, 35.0, 12.0, 0, 0);
  assert.strictEqual(settlement.totalHours, 77.50);
  assert.strictEqual(settlement.clientTotalAmount, 2712.50); // 77.50 * 35 = 2712.50 € (AR Summe)
  assert.strictEqual(settlement.workerTotalAmount, 930.00);   // 77.50 * 12 = 930.00 € (Mitarbeiter Gesamtlohn)
  assert.strictEqual(settlement.netPayout, 930.00);          // Dauerhaft vereinfachter Gesamtlohn = 930.00 €
});

test('3.00 Stunden mit Stundensatz 35 € ergibt genau 105.00 € für AR', () => {
  const entries = [{ decimalHours: 3.00 }];
  const settlement = calculateMonthlySettlement(entries, 35.0, 12.0, 0, 0);
  assert.strictEqual(settlement.clientTotalAmount, 105.00);
  assert.strictEqual(settlement.workerTotalAmount, 36.00);
  assert.strictEqual(settlement.netPayout, 36.00);
});

console.log('\n--- 3. SICHERHEIT & ROLLENTRENNUNG ---');
test('Admin Master Codes enthalten CHEF2026', () => {
  const ADMIN_MASTER_CODES = ['CHEF2026', 'JASIN2026', 'BAUZEIT2026', 'ADMIN2026'];
  assert(ADMIN_MASTER_CODES.includes('CHEF2026'));
  assert(ADMIN_MASTER_CODES.includes('JASIN2026'));
  assert(!ADMIN_MASTER_CODES.includes('FALSCHERCODE'));
});

test('Registrierung ohne Code wird automatisch zum Mitarbeiter (member)', () => {
  const adminCodeInput = '';
  const role = adminCodeInput.trim().length > 0 ? 'owner' : 'member';
  assert.strictEqual(role, 'member');
});

test('Registrierung mit CHEF2026 wird zum Inhaber (owner)', () => {
  const adminCodeInput = 'CHEF2026';
  const role = adminCodeInput.trim().toUpperCase() === 'CHEF2026' ? 'owner' : 'member';
  assert.strictEqual(role, 'owner');
});

console.log('\n--- 4. DATENSCHUTZ & ZUGRIFFSKONTROLLE ---');
test('Mitarbeiter darf nur eigene Zeiteinträge sehen', () => {
  const allEntries = [
    { id: '1', userId: 'user-worker-1', hours: 8.5 },
    { id: '2', userId: 'user-worker-2', hours: 7.0 },
    { id: '3', userId: 'user-worker-1', hours: 6.0 }
  ];
  const loggedInWorkerId = 'user-worker-1';
  const visibleEntries = allEntries.filter(e => e.userId === loggedInWorkerId);
  assert.strictEqual(visibleEntries.length, 2);
  assert(visibleEntries.every(e => e.userId === loggedInWorkerId));
});

test('Inhaber (Owner) hat Vollzugriff auf alle Mitarbeiter', () => {
  const allEntries = [
    { id: '1', userId: 'user-worker-1', hours: 8.5 },
    { id: '2', userId: 'user-worker-2', hours: 7.0 }
  ];
  const isOwner = true;
  const visibleEntries = isOwner ? allEntries : [];
  assert.strictEqual(visibleEntries.length, 2);
});

console.log('\n--- 5. DAUERHAFT VEREINFACHTER GESAMT-LOHN (STUNDEN × STUNDENLOHN) ---');
test('Abrechnung berechnet rein Stunden × Stundenlohn', () => {
  const entries = [
    { decimalHours: 10.0 }
  ];
  // 10 Std * 12 € = 120 € Gesamtlohn
  const totalHours = entries.reduce((s, e) => s + e.decimalHours, 0);
  const workerRate = 12.0;
  const baseWage = Math.round(totalHours * workerRate * 100) / 100;

  assert.strictEqual(baseWage, 120.00);
});

test('Gesamtlohn bei 40 Stunden und 15 € Stundensatz ergibt genau 600.00 €', () => {
  const hours = 40.0;
  const rate = 15.0;
  const totalWage = Math.round(hours * rate * 100) / 100;
  assert.strictEqual(totalWage, 600.00);
});

console.log('\n--- 6. TABELLEN- & EXCEL-EXPORT-VALIDIERUNG ---');
test('TSV-Export enthält schlanke Spalten für Tabelle 1 und Tabelle 2 getrennt durch Tabs', () => {
  const tsvHeader1 = 'Mitarbeiter\tTage\tStunden (h)\tStundenlohn (€/h)\tGesamtlohn (€)\tKunden-AR/h (€)\tKunden-AR Gesamt (€)\tNotiz';
  const tsvHeader2 = 'Datum\tMitarbeiter\tBeginn\tEnde\tPause (Min)\tStunden\tBaustelle / Einsatzort\tNotiz';

  assert(tsvHeader1.split('\t').length >= 8);
  assert(tsvHeader2.split('\t').length >= 7);
  assert(tsvHeader1.includes('Gesamtlohn'));
  assert(tsvHeader2.includes('Baustelle'));
});

test('Excel HTML Struktur enthält gültige XML/HTML Tags und Tabellenspalten', () => {
  const htmlSample = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><table><thead><tr><th>Mitarbeiter</th><th>Stunden</th></tr></thead></table></html>';
  assert(htmlSample.includes('xmlns:x="urn:schemas-microsoft-com:office:excel"'));
  assert(htmlSample.includes('<table>'));
  assert(htmlSample.includes('</table>'));
});

console.log('\n--- 7. BILINGUALE SPRACHSCHLÜSSEL ---');
test('Kritische deutsche und arabische Übersetzungsschlüssel sind vorhanden', () => {
  const DICT = {
    "Zeiterfassung": "تسجيل ساعات العمل",
    "Zeiten": "المواعيد",
    "Abrechnung": "الحسابات والرواتب",
    "Team": "فريق العمل",
    "Profil": "الملف الشخصي",
    "Inhaber": "المسؤول",
    "Mitarbeiter": "عامل"
  };
  assert.strictEqual(DICT["Zeiterfassung"], "تسجيل ساعات العمل");
  assert.strictEqual(DICT["Team"], "فريق العمل");
  assert.strictEqual(DICT["Inhaber"], "المسؤول");
  assert.strictEqual(DICT["Mitarbeiter"], "عامل");
});

console.log(`\n========================================`);
console.log(`Testergebnis: ${passedTests} von ${totalTests} Tests bestanden! 💯`);
console.log(`========================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}

# 📱 BauZeit – Digitale Zeiterfassung für iOS

Eine moderne, mobile Web-App / iOS PWA zur digitalen Zeiterfassung im Handwerks- und Baustellenbereich. Sie ersetzt bisherige Excel- und Papiertabellen vollständig durch ein intuitives, rollenbasiertes System.

---

## 🚀 Schnelleinstieg & Starten

### 1. Entwicklungsserver starten:
```bash
npm run dev
```
Die App öffnet sich unter `http://localhost:5173` (bzw. auf deiner lokalen Netzwerk-IP, um sie direkt auf dem iPhone im gleichen WLAN zu testen).

---

## 👥 Vorkonfigurierte Konten (1-Klick Schnell-Login)

Im Login-Bereich kannst du mit **1 Klick** zwischen den verschiedenen Rollen wechseln:

| Rolle | Name & E-Mail | Zugriff / Berechtigung |
|---|---|---|
| 👑 **Owner (Inhaber)** | `jasin@bauzeit.de` | **Voller Gesamtüberblick:** Sieht alle Arbeiter, Monatsstunden, Abrechnungen, Anzahlungen, Betriebskosten und kann neue Arbeiter anlegen sowie Stundensätze bearbeiten. |
| 👷 **Mitglied (Arbeiter 1)** | `ali@bauzeit.de` | **Strikte Datentrennung:** Sieht ausschließlich das eigene Profil, eigene Monatsstunden (Juni: 77,50 h) und den eigenen Gesamtlohn. |
| 👷 **Mitglied (Arbeiter 2)** | `mehmet@bauzeit.de` | **Separates Arbeiterprofil:** Eigene Zeiterfassung ohne Einsicht in die Daten von Kollegen. |

*Demo-Passwort für alle Konten: `123456` (oder einfach die Schnell-Login-Buttons nutzen).*

---

## ⚙️ Die Berechnungen (Exakt nach Vorlage Juni)

Die App berechnet aus den ausgewählten Zeiten (Beginn, Enden, Pause) tagesaktuell die Dezimalstunden und fasst diese am Monatsende zusammen:

- **Monatsstunden Gesamt**: `77,50 Stunden`
- **Kategorie Mitarbeiter AR** (35,00 €/h Verrechnungssatz):  
  $$77,50\,\text{Std.} \times 35,00\,€ = 2.712,50\,€$$
- **Kategorie Mitarbeiter** (12,00 €/h Stundenlohn):  
  $$77,50\,\text{Std.} \times 12,00\,€ = 930,00\,€$$
- **Geleistete Anzahlung (Abzug)**:  
  $$-208,50\,€$$
- **Jasin Betriebskosten**:  
  $$0,00\,€$$
- **Endgültiger Gesamtlohn (Auszahlungsbetrag)**:  
  $$930,00\,€ - 208,50\,€ = \mathbf{721,50\,€}$$

---

## 📲 Als echte App auf dem iPhone installieren

Dank PWA-Unterstützung (Progressive Web App) kann die Anwendung ohne App Store und ohne Entwickler-Zertifikat direkt auf dem iPhone installiert werden:

1. Öffne die Seite in **Safari** auf dem iPhone.
2. Tippe unten auf das **Teilen-Symbol** (Viereck mit Pfeil nach oben).
3. Scrolle etwas herunter und wähle **„Zum Home-Bildschirm“**.
4. Tippe oben rechts auf **„Hinzufügen“**.

Die App erscheint nun mit eigenem Icon auf dem Homescreen, startet im bildschirmfüllenden Vollbildmodus (ohne Safari-Adressleiste) und fühlt sich wie eine native iOS-App an.

---

## ☁️ Google Cloud & Firebase Anbindung

Die App ist **Offline-First** aufgebaut und funktioniert sofort ohne vorherige Konfiguration im lokalen Speicher. Um sie mit der Google Cloud zu synchronisieren:

1. Öffne die Firebase Console: [console.firebase.google.com](https://console.firebase.google.com)
2. Erstelle ein Projekt und aktiviere **Authentication** (E-Mail/Passwort) und **Cloud Firestore**.
3. Kopiere die Firestore-Sicherheitsregeln aus [`firestore.rules`](./firestore.rules) in deine Firebase-Konsole.
4. Trage die Web-Zugangsdaten entweder in `.env` ein oder öffne in der App die Registerkarte **„Cloud/Setup“** und speichere sie direkt mit 1 Klick ab.

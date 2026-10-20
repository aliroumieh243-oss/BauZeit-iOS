import Foundation
import SwiftUI
import Combine

enum AppLanguage: String, CaseIterable, Identifiable {
    case german = "de"
    case arabic = "ar"
    
    var id: String { rawValue }
    
    var displayName: String {
        switch self {
        case .german: return "Deutsch 🇩🇪"
        case .arabic: return "العربية 🇸🇦"
        }
    }
}

class LanguageManager: ObservableObject {
    @Published var currentLanguage: AppLanguage {
        didSet {
            UserDefaults.standard.set(currentLanguage.rawValue, forKey: "bauzeit_app_language")
        }
    }
    
    init() {
        let saved = UserDefaults.standard.string(forKey: "bauzeit_app_language") ?? "de"
        self.currentLanguage = AppLanguage(rawValue: saved) ?? .german
    }
    
    var isArabic: Bool {
        currentLanguage == .arabic
    }
    
    // MARK: - Monatsnamen
    var monthNames: [String] {
        if isArabic {
            return ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
                    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
        } else {
            return ["Januar", "Februar", "März", "April", "Mai", "Juni",
                    "Juli", "August", "September", "Oktober", "November", "Dezember"]
        }
    }
    
    // MARK: - Wochentagsnamen
    var weekdayNames: [String] {
        if isArabic {
            return ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
        } else {
            return ["So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa."]
        }
    }
    
    // MARK: - Wörterbuch Übersetzungen
    func text(_ key: String) -> String {
        guard isArabic else { return key }
        
        let dict: [String: String] = [
            // Navigation & Tabs
            "Zeiterfassung": "تسجيل ساعات العمل",
            "Zeiten": "المواعيد",
            "Abrechnung": "الحسابات والرواتب",
            "Profil": "الملف الشخصي",
            "Übersicht": "لوحة التحكم",
            "Chef-Übersicht": "إدارة العمل والحسابات",
            "Mein Profil": "حسابي الشخصي",
            "Inhaber-Konto": "حساب المسؤول",
            
            // Header & Aktionen
            "BauZeit": "BauZeit • وقت البناء",
            "Digitale Zeiterfassung für Handwerk & Baustelle": "نظام تسجيل ساعات العمل للورش ومواقع البناء",
            "Anmelden": "تسجيل الدخول",
            "Konto erstellen": "إنشاء حساب جديد",
            "Geschützter Login": "تسجيل دخول آمن",
            "Neues Mitarbeiterkonto anlegen": "تسجيل عامل جديد",
            "Abmelden": "تسجيل الخروج",
            "Speichern": "حفظ",
            "Abbrechen": "إلغاء",
            "Löschen": "حذف",
            "Tageseintrag löschen": "حذف تسجيل هذا اليوم",
            "Fertig": "تم",
            
            // Formular-Felder
            "Vollständiger Name": "الاسم الكامل",
            "Vor- und Nachname": "الاسم الأول والعائلة",
            "E-Mail Adresse": "البريد الإلكتروني",
            "Passwort": "كلمة المرور",
            "Admin-Sicherheitscode (Optional)": "رمز أمان المسؤول (اختياري)",
            "Nur für Inhaber": "للمسؤول فقط",
            "Code für Admin-Rechte": "رمز صلاحيات الإدارة",
            
            // Zeiterfassung Felder
            "Arbeitszeit (Beginn & Ende)": "أوقات العمل (البداية والنهاية)",
            "Arbeitsbeginn": "بداية العمل",
            "Feierabend": "نهاية العمل",
            "Tägliche Pause": "الاستراحة اليومية",
            "Pause:": "الاستراحة:",
            "Minuten": "دقيقة",
            "Keine": "بدون",
            "Baustelle / Einsatzort": "موقع العمل / الورشة",
            "z.B. Baustelle HafenCity": "مثال: ورشة هامبورغ",
            "Geleistete Arbeitszeit": "ساعات العمل المنجزة",
            "Pause": "استراحة",
            
            // Finanzen & Auslagen (Benzin & Geld)
            "Auslagen & Fahrtkosten": "المصاريف وبنزين التنقل",
            "Benzingeld / Sprit": "مصاريف الوقود / البنزين",
            "Geld ausgegeben": "مصاريف ومشتريات العمل",
            "Zweck (z.B. Tanken Sprinter, Schrauben OBI)": "سبب الصرف (مثال: بنزين، براغي، مواد)",
            "Optionale Notizen": "ملاحظات إضافية",
            "Besonderheiten, Wetter, Zusatzarbeiten...": "أي تفاصيل أخرى...",
            
            // Kalender & Dashboard
            "Monatsstunden": "ساعات هذا الشهر",
            "Arbeitstage": "أيام العمل",
            "Heute": "اليوم",
            "Heute (Noch nicht erfasst)": "اليوم (لم يتم التسجيل بعد)",
            "Wochenende": "عطلة نهاية الأسبوع",
            "Kein Eintrag": "لا يوجد تسجيل",
            "Std.": "ساعة",
            "Tage": "أيام",
            "Benzin:": "وقود:",
            "Auslagen:": "مصاريف:",
            "Spesen": "مصاريف",
            
            // Abrechnung
            "Deine Lohnübersicht": "ملخص الراتب المستحق",
            "Monatsabrechnung": "كشف حساب الشهر",
            "Geleistete Stunden": "الساعات المنجزة",
            "Dein Stundenlohn": "أجر الساعة",
            "Einsatztage": "أيام العمل",
            "pro Stunde": "لكل ساعة",
            "Grundlohn:": "الراتب الأساسي:",
            "Benzingeld-Erstattung:": "تعويض مصاريف الوقود:",
            "Material / Auslagen-Erstattung:": "تعويض المشتريات والمواد:",
            "Bereits erhaltene Anzahlung:": "سلفة مسبقة (مخصومة):",
            "Endgültiger Gesamtlohn": "صافي الراتب النهائي",
            "Auszahlungsbetrag": "المبلغ الصافي للدفع",
            "Alle Einsätze in diesem Monat": "جميع أيام العمل المسجلة هذا الشهر",
            
            // Chef Übersicht
            "Inhaber-Übersicht": "نظرة عامة للمسؤول",
            "Abrechnung & Finanzen": "الحسابات المالية والأجور",
            "Arbeiter": "عامل جديد",
            "Kunden-Abrechnung AR": "حساب الفواتير للعميل",
            "Mitarbeiter-Lohn": "أجر العامل",
            "Geleistete Monatsstunden:": "ساعات الشهر الإجمالية:",
            "Erstattung Benzingeld:": "تعويض الوقود:",
            "Erstattung Material / Auslagen:": "تعويض المصاريف:",
            "Geleistete Anzahlung (Abzug):": "الدفعة المقدمة (خصم):",
            "Jasin Betriebskosten:": "المصاريف التشغيلية:",
            "Inkl. Spesen & nach Anzahlung": "شامل المصاريف وبعد خصم السلفة",
            "Erfasste Einsätze": "الأيام المسجلة",
            
            // KI & Dokument Export
            "KI-Monatsdokument & Tabellen-Export": "تقرير وتصدير الجدول الذكي",
            "In Tabelle einfügen (Kopieren)": "نسخ للجدول (إكسل)",
            "Als Excel / CSV teilen": "مشاركة كملف إكسل",
            "In Zwischenablage kopiert!": "تم نسخ البيانات إلى الحافظة بنجاح!"
        ]
        
        return dict[key] ?? key
    }
}

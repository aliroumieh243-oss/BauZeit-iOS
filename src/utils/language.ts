export type AppLanguage = 'de' | 'ar';

const STORAGE_KEY = 'bauzeit_app_language';

export function getSavedLanguage(): AppLanguage {
  const saved = localStorage.getItem(STORAGE_KEY);
  return (saved === 'ar' || saved === 'de') ? saved : 'de';
}

export function saveLanguage(lang: AppLanguage): void {
  localStorage.setItem(STORAGE_KEY, lang);
  if (lang === 'ar') {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  } else {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'de';
  }
}

const DICTIONARY: Record<string, string> = {
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
  "Geleistete Arbeitszeit": "ساعات العمل المنجزة",
  
  // Finanzen & Auslagen (Benzin & Geld)
  "Auslagen & Fahrtkosten": "المصاريف وبنزين التنقل",
  "Benzingeld / Sprit": "مصاريف الوقود / البنزين",
  "Geld ausgegeben": "مصاريف ومشتريات العمل",
  "Zweck": "سبب الصرف",
  "Optionale Notizen": "ملاحظات إضافية",
  
  // Kalender & Dashboard
  "Monatsstunden": "ساعات هذا الشهر",
  "Arbeitstage": "أيام العمل",
  "Heute": "اليوم",
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
  "Als Excel / CSV teilen": "تحميل كملف إكسل",
  "In Zwischenablage kopiert!": "تم نسخ البيانات إلى الحافظة بنجاح!"
};

export function t(key: string, lang: AppLanguage = getSavedLanguage()): string {
  if (lang === 'ar' && DICTIONARY[key]) {
    return DICTIONARY[key];
  }
  return key;
}

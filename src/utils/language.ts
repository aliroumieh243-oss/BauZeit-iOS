import { useState, useEffect } from 'react';

export type AppLanguage = 'de' | 'ar';

const STORAGE_KEY = 'bauzeit_app_language';

export function getSavedLanguage(): AppLanguage {
  const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : 'de';
  return (saved === 'ar' || saved === 'de') ? saved : 'de';
}

export function saveLanguage(lang: AppLanguage): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lang);
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'de';
    }
  }
}

// Initial setup on module execution
if (typeof window !== 'undefined') {
  const initial = getSavedLanguage();
  if (initial === 'ar') {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  } else {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'de';
  }
}

export function useLanguage() {
  const [lang, setLangState] = useState<AppLanguage>(getSavedLanguage());

  const toggleLanguage = () => {
    const nextLang: AppLanguage = lang === 'de' ? 'ar' : 'de';
    saveLanguage(nextLang);
    setLangState(nextLang);
    window.dispatchEvent(new Event('languagechange'));
  };

  useEffect(() => {
    const handleStorage = () => {
      setLangState(getSavedLanguage());
    };
    window.addEventListener('languagechange', handleStorage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('languagechange', handleStorage);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return { lang, toggleLanguage, isArabic: lang === 'ar' };
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
  "Dauerhaft angemeldet bleiben": "البقاء مسجلاً للدخول دائماً",
  "Schnell-Start": "دخول سريع",
  "Als Chef (Inhaber) starten": "الدخول كمسؤول (المدير)",
  "Als Mitarbeiter starten": "الدخول كعامل",
  
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
  "Beleg / Foto (Optional)": "إرفاق صورة الفاتورة / الوصل",
  "Foto / Beleg auswählen": "اختيار صورة أو إيصال",
  "Foto entfernen": "حذف الصورة",
  "Foto ansehen": "عرض الصورة",
  "Beleg": "إيصال",
  "Beleg vorhanden": "يوجد إيصال",
  "Quittung, Tankbeleg oder Baustelle": "إيصال أو وقود أو موقع العمل",
  "Zweck (z.B. Tanken Sprinter, Schrauben OBI)": "سبب الصرف (مثال: بنزين، براغي، مواد)",
  
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
  "Tageszeiten ansehen": "عرض ساعات العمل اليومية",
  "Abrechnung Exportieren": "تصدير الحسابات",
  "Schließen": "إغلاق",
  "Sprache": "اللغة",
  
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
  "KI-Monatsdokument bereit": "تقرير الجدول الذكي جاهز",
  "Perfekt vorbereitet zur Übertragung in deine Tabellen": "جاهز للنقل المباشر إلى جداول إكسل أو غوغل شيتس",
  "In Tabelle einfügen (Kopieren)": "نسخ للجدول (إكسل)",
  "Kopiert! Bereit zum Einfügen": "تم النسخ! جاهز للصق في إكسل",
  "Als Excel / CSV teilen": "تحميل كملف إكسل",
  "Als CSV herunterladen": "تحميل كملف CSV",
  "In Zwischenablage kopiert!": "تم نسخ البيانات إلى الحافظة بنجاح!",
  
  // Neue Funktionen & Erweiterungen
  "Team": "فريق العمل",
  "Inhaber": "المسؤول",
  "Mitarbeiter": "عامل",
  "Team & Sätze": "فريق العمل والأجور",
  "Mitarbeiterverwaltung": "إدارة الموظفين",
  "Tageszeiten der Arbeiter": "أوقات عمل العمال",
  "Tägliche Zeiterfassung": "تسجيل ساعات العمل اليومية",
  "Mein Kalender": "تقويمي",
  "Meine Abrechnung": "حساباتي وأجري",
  "Lohn & Monatsstunden": "الراتب وساعات الشهر",
  "Mitarbeiter auswählen": "اختيار العامل",
  "Jetzt mit Cloud synchronisieren": "المزامنة مع السحابة الآن",
  "Synchronisiere...": "جارٍ المزامنة...",
  "Erfolgreich synchronisiert!": "تمت المزامنة بنجاح!",
  "Echtzeit Cloud-Synchronisierung": "مزامنة سحابية مباشرة",
  "Alle Konten, Zeiten & Abrechnungen werden automatisch zwischen Web & iPhone übertragen.": "تتم مزامنة جميع الحسابات والمواعيد تلقائياً بين الموقع والآيفون.",
  "Zwischen Konten wechseln": "التبديل بين الحسابات",
  "Wechseln →": "تبديل ←",
  "Strikte Datentrennung aktiv": "عزل خصوصية البيانات مفعّل",
  "Du kannst ausschließlich deine eigenen Arbeitszeiten und Baustelleneinsätze sehen. Andere Arbeiter haben keinerlei Einblick in deine Stunden oder Abrechnungen.": "يمكنك فقط الاطلاع على ساعات عملك ومواقعك الخاصة. لا يمكن لأي عامل آخر رؤية ساعاتك أو راتبك.",
  "Als iPhone-App installieren": "تثبيت كتطبيق للآيفون",
  "Vom Konto abmelden": "تسجيل الخروج من الحساب",
  "Status": "الحالة",
  "Aktiv": "نشط",
  "Excel (.xls)": "ملف إكسل (.xls)",
  "Echte Monats-Tabelle & Export": "جدول وتصدير الشهر الكامل",
  "Monatsabrechnung bearbeiten": "تعديل حسابات الشهر",
  "Alles bearbeiten": "تعديل الكل",
  "Änderungen speichern": "حفظ التغييرات"
};

export function t(key: string, lang: AppLanguage = getSavedLanguage()): string {
  if (lang === 'ar' && DICTIONARY[key]) {
    return DICTIONARY[key];
  }
  return key;
}

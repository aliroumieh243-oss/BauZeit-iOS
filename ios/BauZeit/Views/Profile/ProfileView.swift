import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

struct ProfileView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var timeVM: TimeTrackingViewModel
    @EnvironmentObject var lang: LanguageManager
    @State private var syncSuccessBanner: Bool = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                
                // MARK: - Sprachauswahl (Deutsch / العربية)
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: "globe")
                            .foregroundColor(.blue)
                        Text(lang.isArabic ? "لغة التطبيق" : "App-Sprache")
                            .font(.headline)
                            .fontWeight(.bold)
                    }
                    
                    Picker("Sprache", selection: $lang.currentLanguage) {
                        ForEach(AppLanguage.allCases) { language in
                            Text(language.displayName).tag(language)
                        }
                    }
                    #if os(iOS)
                    .pickerStyle(.segmented)
                    #endif
                }
                .padding(16)
                .background(Color.cardBackground)
                .cornerRadius(18)
                .shadow(color: .black.opacity(0.04), radius: 6, y: 2)
                .padding(.horizontal, 16)
                
                // MARK: - User Card
                VStack(spacing: 12) {
                    Circle()
                        .fill(Color.blue)
                        .frame(width: 72, height: 72)
                        .overlay(
                            Image(systemName: authVM.isOwner ? "crown.fill" : "person.fill")
                                .font(.system(size: 32))
                                .foregroundColor(.white)
                        )
                        .padding(.top, 10)
                    
                    Text(authVM.currentUser?.displayName ?? (lang.isArabic ? "مستخدم" : "Nutzer"))
                        .font(.title3)
                        .fontWeight(.bold)
                    
                    Text(authVM.currentUser?.email ?? "")
                        .font(.footnote)
                        .foregroundColor(.secondary)
                    
                    Text(authVM.isOwner
                         ? (lang.isArabic ? "المسؤول (صاحب العمل)" : "Owner (Inhaber / Administrator)")
                         : (lang.isArabic ? "عامل" : "Mitarbeiter"))
                        .font(.caption)
                        .fontWeight(.bold)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 4)
                        .background(authVM.isOwner ? Color.orange.opacity(0.15) : Color.blue.opacity(0.15))
                        .foregroundColor(authVM.isOwner ? .orange : .blue)
                        .clipShape(Capsule())
                    
                    if !authVM.isOwner {
                        Divider()
                            .padding(.vertical, 4)
                        
                        HStack {
                            Text(lang.isArabic ? "أجر الساعة:" : "Dein Stundenlohn:")
                                .font(.footnote)
                                .foregroundColor(.secondary)
                            Spacer()
                            Text(TimeCalculations.formatCurrency(authVM.currentUser?.workerRate ?? 12.0) + "/h")
                                .font(.footnote)
                                .fontWeight(.bold)
                        }
                    }
                }
                .padding(20)
                .frame(maxWidth: .infinity)
                .background(Color.cardBackground)
                .cornerRadius(22)
                .shadow(color: .black.opacity(0.05), radius: 8, y: 4)
                .padding(.horizontal, 16)
                
                // MARK: - Cloud-Synchronisierung Card
                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        Image(systemName: "icloud.and.arrow.up.fill")
                            .foregroundColor(.blue)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(lang.isArabic ? "المزامنة السحابية نشطة" : "Echtzeit Cloud-Synchronisierung")
                                .font(.subheadline)
                                .fontWeight(.bold)
                            Text(lang.isArabic
                                 ? "يتم نقل جميع الحسابات والساعات تلقائياً بين جميع الأجهزة"
                                 : "Alle Konten, Zeiten & Abrechnungen werden automatisch übertragen.")
                                .font(.system(size: 11))
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                    }
                    
                    Button(action: {
                        Task {
                            await authVM.syncWithCloud()
                            await timeVM.syncWithCloud()
                            syncSuccessBanner = true
                            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                                syncSuccessBanner = false
                            }
                        }
                    }) {
                        HStack {
                            if authVM.isSyncing || timeVM.isSyncing {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Image(systemName: syncSuccessBanner ? "checkmark.circle.fill" : "arrow.triangle.2.circlepath")
                            }
                            Text(syncSuccessBanner
                                 ? (lang.isArabic ? "تمت المزامنة بنجاح!" : "Erfolgreich synchronisiert!")
                                 : (lang.isArabic ? "مزامنة البيانات الآن" : "Jetzt mit Cloud synchronisieren"))
                                .font(.caption)
                                .fontWeight(.bold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 11)
                        .background(syncSuccessBanner ? Color.green : Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                }
                .padding(16)
                .background(Color.cardBackground)
                .cornerRadius(18)
                .shadow(color: .black.opacity(0.04), radius: 6, y: 2)
                .padding(.horizontal, 16)
                
                // MARK: - Schnell-Kontowechsel (zwischen vorhandenen Konten wechseln)
                if authVM.users.count > 1 {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(lang.isArabic ? "تبديل الحساب السريع" : "Zwischen Konten wechseln (\(authVM.users.count))")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.secondary)
                            .textCase(.uppercase)
                        
                        ForEach(authVM.users) { u in
                            let isCurrent = (authVM.currentUser?.id == u.id)
                            Button(action: {
                                authVM.switchUser(to: u)
                                if u.role == .member {
                                    timeVM.selectedWorkerId = u.id
                                }
                            }) {
                                HStack {
                                    Circle()
                                        .fill(u.role == .owner ? Color.orange.opacity(0.2) : Color.blue.opacity(0.2))
                                        .frame(width: 28, height: 28)
                                        .overlay(
                                            Image(systemName: u.role == .owner ? "crown.fill" : "person.fill")
                                                .font(.system(size: 12))
                                                .foregroundColor(u.role == .owner ? .orange : .blue)
                                        )
                                    VStack(alignment: .leading, spacing: 1) {
                                        Text(u.displayName)
                                            .font(.footnote)
                                            .fontWeight(.bold)
                                            .foregroundColor(.primary)
                                        Text(u.email)
                                            .font(.system(size: 10))
                                            .foregroundColor(.secondary)
                                    }
                                    Spacer()
                                    if isCurrent {
                                        Text(lang.isArabic ? "نشط" : "Aktiv")
                                            .font(.system(size: 10, weight: .bold))
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 3)
                                            .background(Color.green.opacity(0.15))
                                            .foregroundColor(.green)
                                            .cornerRadius(6)
                                    } else {
                                        Text(lang.isArabic ? "تبديل" : "Wechseln")
                                            .font(.system(size: 10, weight: .bold))
                                            .foregroundColor(.blue)
                                    }
                                }
                                .padding(10)
                                .background(isCurrent ? Color.blue.opacity(0.06) : Color.fieldBackground.opacity(0.5))
                                .cornerRadius(12)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(16)
                    .background(Color.cardBackground)
                    .cornerRadius(18)
                    .shadow(color: .black.opacity(0.04), radius: 6, y: 2)
                    .padding(.horizontal, 16)
                }
                
                // MARK: - Privacy Guarantee Banner
                HStack(alignment: .top, spacing: 12) {
                    Image(systemName: "lock.shield.fill")
                        .font(.title2)
                        .foregroundColor(.green)
                    
                    VStack(alignment: .leading, spacing: 3) {
                        Text(lang.isArabic ? "خصوصية تامة وحماية للبيانات" : "Strikte Datentrennung aktiv")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.green)
                        Text(lang.isArabic
                             ? "لك حق الوصول فقط إلى ساعات عملك وحسابك الشخصي. لا يمكن لأي عامل آخر الاطلاع على بياناتك."
                             : "Du hast ausschließlich Zugriff auf dein eigenes Profil und deine eigenen Arbeitszeiten. Andere Arbeiter können deine Daten nicht einsehen.")
                            .font(.system(size: 11))
                            .foregroundColor(.secondary)
                            .lineSpacing(2)
                    }
                }
                .padding(16)
                .background(Color.green.opacity(0.08))
                .cornerRadius(18)
                .padding(.horizontal, 16)
                
                // MARK: - Logout Button
                Button(role: .destructive, action: {
                    authVM.logout()
                }) {
                    HStack {
                        Spacer()
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                        Text(lang.isArabic ? "تسجيل الخروج" : "Abmelden")
                            .fontWeight(.bold)
                        Spacer()
                    }
                    .padding(.vertical, 14)
                    .background(Color.cardBackground)
                    .foregroundColor(.red)
                    .cornerRadius(18)
                    .shadow(color: .black.opacity(0.04), radius: 6, y: 2)
                }
                .padding(.horizontal, 16)
                
                Spacer()
            }
            .padding(.top, 16)
        }
        .background(Color.appBackground)
    }
}

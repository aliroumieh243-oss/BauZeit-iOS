import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

struct LoginView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @Environment(\.colorScheme) var colorScheme
    
    @State private var isRegisterMode: Bool = false
    @State private var name: String = ""
    @State private var email: String = ""
    @State private var password: String = ""
    @State private var adminCode: String = ""
    @State private var showPassword: Bool = false
    
    var isDark: Bool {
        colorScheme == .dark
    }
    
    var body: some View {
        ZStack {
            // MARK: - Premium Background (Eliminates all black bars & empty letterboxing)
            backgroundLayer
                .ignoresSafeArea()
            
            // Subtle ambient lighting glow
            VStack {
                Circle()
                    .fill(Color.blue.opacity(isDark ? 0.22 : 0.12))
                    .frame(width: 340, height: 340)
                    .blur(radius: 80)
                    .offset(y: -120)
                Spacer()
            }
            .ignoresSafeArea()
            
            // MARK: - Main Scrollable Content
            ScrollView(showsIndicators: false) {
                VStack(spacing: 28) {
                    
                    // MARK: - App Logo & Brand Header
                    VStack(spacing: 12) {
                        ZStack {
                            // Ambient Icon Glow
                            RoundedRectangle(cornerRadius: 24, style: .continuous)
                                .fill(Color.blue.opacity(0.35))
                                .frame(width: 88, height: 88)
                                .blur(radius: 14)
                            
                            // App Icon Image
                            if let uiImg = UIImage(named: "AppLogo") {
                                Image(uiImage: uiImg)
                                    .resizable()
                                    .aspectRatio(contentMode: .fit)
                                    .frame(width: 88, height: 88)
                                    .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 22, style: .continuous)
                                            .stroke(Color.white.opacity(0.2), lineWidth: 1)
                                    )
                                    .shadow(color: .black.opacity(0.2), radius: 10, y: 5)
                            } else {
                                // High-End Fallback Icon
                                ZStack {
                                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                                        .fill(LinearGradient(
                                            colors: [Color(red: 0.08, green: 0.25, blue: 0.55), Color(red: 0.04, green: 0.12, blue: 0.32)],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        ))
                                        .frame(width: 88, height: 88)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 22, style: .continuous)
                                                .stroke(Color.white.opacity(0.2), lineWidth: 1)
                                        )
                                    
                                    Image(systemName: "wrench.and.screwdriver.fill")
                                        .font(.system(size: 36))
                                        .foregroundStyle(LinearGradient(
                                            colors: [Color(red: 0.98, green: 0.82, blue: 0.45), Color(red: 0.88, green: 0.65, blue: 0.25)],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        ))
                                }
                                .shadow(color: .black.opacity(0.2), radius: 10, y: 5)
                            }
                        }
                        .padding(.top, 24)
                        
                        VStack(spacing: 6) {
                            Text("BauZeit")
                                .font(.system(size: 32, weight: .black, design: .rounded))
                                .foregroundColor(.primary)
                            
                            Text("Digitale Zeiterfassung für Handwerk & Baustelle")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 24)
                        }
                    }
                    
                    // MARK: - Login / Register Card
                    VStack(alignment: .leading, spacing: 20) {
                        
                        // Switcher: Anmelden vs Konto erstellen
                        HStack(spacing: 0) {
                            modeButton(title: "Anmelden", active: !isRegisterMode) {
                                withAnimation(.spring(response: 0.35, dampingFraction: 0.75)) {
                                    isRegisterMode = false
                                    authVM.errorMessage = nil
                                }
                            }
                            
                            modeButton(title: "Konto erstellen", active: isRegisterMode) {
                                withAnimation(.spring(response: 0.35, dampingFraction: 0.75)) {
                                    isRegisterMode = true
                                    authVM.errorMessage = nil
                                }
                            }
                        }
                        .padding(4)
                        .background(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.05))
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        
                        // Section Subheader
                        Text(isRegisterMode ? "Neues Mitarbeiterkonto anlegen" : "Geschützter Login")
                            .font(.system(size: 17, weight: .semibold, design: .rounded))
                            .foregroundColor(.primary)
                        
                        // Error Notice (if any)
                        if let err = authVM.errorMessage {
                            HStack(alignment: .top, spacing: 10) {
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .foregroundColor(.red)
                                    .font(.system(size: 16))
                                Text(err)
                                    .font(.caption)
                                    .fontWeight(.medium)
                                    .foregroundColor(.red)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.red.opacity(0.12))
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .stroke(Color.red.opacity(0.25), lineWidth: 1)
                            )
                        }
                        
                        // Form Input Fields
                        VStack(spacing: 14) {
                            if isRegisterMode {
                                inputField(
                                    label: "Vollständiger Name",
                                    icon: "person.fill",
                                    placeholder: "Vor- und Nachname"
                                ) {
                                    TextField("Vor- und Nachname", text: $name)
                                        #if os(iOS)
                                        .autocapitalization(.words)
                                        .textContentType(.name)
                                        #endif
                                }
                            }
                            
                            inputField(
                                label: "E-Mail Adresse",
                                icon: "envelope.fill",
                                placeholder: "name@bauzeit.de"
                            ) {
                                TextField("name@bauzeit.de", text: $email)
                                    #if os(iOS)
                                    .keyboardType(.emailAddress)
                                    .autocapitalization(.none)
                                    .disableAutocorrection(true)
                                    .textContentType(.emailAddress)
                                    #endif
                            }
                            
                            inputField(
                                label: "Passwort",
                                icon: "lock.fill",
                                placeholder: "Passwort"
                            ) {
                                HStack {
                                    if showPassword {
                                        TextField("Passwort", text: $password)
                                            #if os(iOS)
                                            .autocapitalization(.none)
                                            #endif
                                    } else {
                                        SecureField("Passwort", text: $password)
                                    }
                                    
                                    Button(action: { showPassword.toggle() }) {
                                        Image(systemName: showPassword ? "eye.slash.fill" : "eye.fill")
                                            .foregroundColor(.secondary)
                                            .font(.system(size: 15))
                                    }
                                }
                            }
                            
                            // Optional Admin Code for Owner Signup
                            if isRegisterMode {
                                VStack(alignment: .leading, spacing: 6) {
                                    HStack {
                                        Text("Admin-Sicherheitscode (Optional)")
                                            .font(.caption)
                                            .fontWeight(.bold)
                                            .foregroundColor(.secondary)
                                        Spacer()
                                        Text("Nur für Inhaber")
                                            .font(.system(size: 11, weight: .semibold))
                                            .foregroundColor(.orange)
                                    }
                                    
                                    HStack(spacing: 12) {
                                        Image(systemName: "key.fill")
                                            .foregroundColor(.orange)
                                            .frame(width: 20)
                                        SecureField("Code für Admin-Rechte", text: $adminCode)
                                            #if os(iOS)
                                            .autocapitalization(.allCharacters)
                                            #endif
                                    }
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 12)
                                    .background(inputBackground)
                                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                                            .stroke(adminCode.isEmpty ? Color.clear : Color.orange.opacity(0.4), lineWidth: 1)
                                    )
                                }
                            }
                        }
                        
                        // Primary Action Submit Button
                        Button(action: handleAction) {
                            HStack(spacing: 8) {
                                Spacer()
                                Text(isRegisterMode ? "Konto erstellen" : "Anmelden")
                                    .font(.system(size: 17, weight: .bold, design: .rounded))
                                Image(systemName: "arrow.right")
                                    .font(.system(size: 16, weight: .bold))
                                Spacer()
                            }
                            .padding(.vertical, 15)
                            .background(
                                LinearGradient(
                                    colors: [Color.blue, Color(red: 0.05, green: 0.42, blue: 0.95)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .foregroundColor(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                            .shadow(color: Color.blue.opacity(0.4), radius: 10, y: 5)
                        }
                        .padding(.top, 6)
                    }
                    .padding(22)
                    .background(cardBackgroundLayer)
                    .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 24, style: .continuous)
                            .stroke(cardBorderColor, lineWidth: 1)
                    )
                    .shadow(color: .black.opacity(isDark ? 0.35 : 0.07), radius: 18, y: 8)
                    .padding(.horizontal, 20)
                    .frame(maxWidth: 480)
                    
                    Spacer(minLength: 40)
                }
            }
            #if os(iOS)
            .scrollDismissesKeyboard(.interactively)
            #endif
        }
    }
    
    // MARK: - View Helpers & Subviews
    
    @ViewBuilder
    private var backgroundLayer: some View {
        if isDark {
            LinearGradient(
                colors: [
                    Color(red: 0.06, green: 0.09, blue: 0.16),
                    Color(red: 0.03, green: 0.04, blue: 0.08)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
        } else {
            LinearGradient(
                colors: [
                    Color(red: 0.96, green: 0.97, blue: 0.99),
                    Color(red: 0.92, green: 0.94, blue: 0.97)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
        }
    }
    
    @ViewBuilder
    private var cardBackgroundLayer: some View {
        if isDark {
            Color(red: 0.11, green: 0.14, blue: 0.22).opacity(0.95)
        } else {
            Color.white
        }
    }
    
    private var cardBorderColor: Color {
        isDark ? Color.white.opacity(0.12) : Color.black.opacity(0.06)
    }
    
    private var inputBackground: Color {
        isDark ? Color.white.opacity(0.08) : Color(uiColor: .secondarySystemBackground)
    }
    
    private func modeButton(title: String, active: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 14, weight: active ? .bold : .medium, design: .rounded))
                .foregroundColor(active ? .primary : .secondary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(
                    active
                    ? (isDark ? Color.white.opacity(0.18) : Color.white)
                    : Color.clear
                )
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .shadow(color: active ? .black.opacity(0.08) : .clear, radius: 4, y: 2)
        }
    }
    
    private func inputField<Content: View>(
        label: String,
        icon: String,
        placeholder: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(.secondary)
            
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .foregroundColor(Color.blue.opacity(0.85))
                    .font(.system(size: 15))
                    .frame(width: 20)
                
                content()
                    .foregroundColor(.primary)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(inputBackground)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.04), lineWidth: 1)
            )
        }
    }
    
    private func handleAction() {
        #if canImport(UIKit)
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        #endif
        if isRegisterMode {
            _ = authVM.register(name: name, email: email, password: password, adminCode: adminCode)
        } else {
            _ = authVM.login(email: email, password: password)
        }
    }
}

import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

struct LoginView: View {
    @EnvironmentObject var authVM: AuthViewModel
    
    @State private var isRegisterMode: Bool = false
    @State private var name: String = ""
    @State private var email: String = ""
    @State private var password: String = ""
    @State private var adminCode: String = ""
    @State private var showPassword: Bool = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // App Logo & Header
                VStack(spacing: 8) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 24, style: .continuous)
                            .fill(LinearGradient(
                                colors: [Color.blue, Color.blue.opacity(0.8)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ))
                            .frame(width: 80, height: 80)
                            .shadow(color: .black.opacity(0.12), radius: 10, y: 5)
                        
                        Image(systemName: "clock.badge.checkmark.fill")
                            .font(.system(size: 38))
                            .foregroundColor(.white)
                    }
                    .padding(.top, 40)
                    
                    Text("BauZeit")
                        .font(.system(size: 28, weight: .black, design: .rounded))
                        .foregroundColor(.primary)
                    
                    Text("Digitale Zeiterfassung für Handwerk & Baustelle")
                        .font(.footnote)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                
                // Card
                VStack(alignment: .leading, spacing: 18) {
                    // Segmented Picker
                    Picker("", selection: $isRegisterMode) {
                        Text("Anmelden").tag(false)
                        Text("Konto erstellen").tag(true)
                    }
                    #if os(iOS)
                    .pickerStyle(.segmented)
                    #endif
                    .padding(.bottom, 6)
                    
                    Text(isRegisterMode ? "Neues Mitarbeiterkonto anlegen" : "Geschützter Login")
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    if let err = authVM.errorMessage {
                        HStack(alignment: .top, spacing: 8) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.red)
                            Text(err)
                                .font(.caption)
                                .foregroundColor(.red)
                        }
                        .padding(10)
                        .background(Color.red.opacity(0.1))
                        .cornerRadius(12)
                    }
                    
                    // Form fields
                    VStack(spacing: 14) {
                        if isRegisterMode {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Vollständiger Name")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.secondary)
                                
                                HStack {
                                    Image(systemName: "person.fill")
                                        .foregroundColor(.secondary)
                                    TextField("Vor- und Nachname", text: $name)
                                        #if os(iOS)
                                        .autocapitalization(.words)
                                        #endif
                                }
                                .padding(12)
                                .background(Color.fieldBackground)
                                .cornerRadius(12)
                            }
                        }
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text("E-Mail Adresse")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.secondary)
                            
                            HStack {
                                Image(systemName: "envelope.fill")
                                    .foregroundColor(.secondary)
                                TextField("name@bauzeit.de", text: $email)
                                    #if os(iOS)
                                    .keyboardType(.emailAddress)
                                    .autocapitalization(.none)
                                    #endif
                            }
                            .padding(12)
                            .background(Color.fieldBackground)
                            .cornerRadius(12)
                        }
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Passwort")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.secondary)
                            
                            HStack {
                                Image(systemName: "lock.fill")
                                    .foregroundColor(.secondary)
                                
                                if showPassword {
                                    TextField("Passwort", text: $password)
                                } else {
                                    SecureField("Passwort", text: $password)
                                }
                                
                                Button(action: { showPassword.toggle() }) {
                                    Image(systemName: showPassword ? "eye.slash.fill" : "eye.fill")
                                        .foregroundColor(.secondary)
                                }
                            }
                            .padding(12)
                            .background(Color.fieldBackground)
                            .cornerRadius(12)
                        }
                        
                        // Secret Admin Code (Only in Registration Mode)
                        if isRegisterMode {
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Text("Admin-Sicherheitscode (Optional)")
                                        .font(.caption)
                                        .fontWeight(.bold)
                                        .foregroundColor(.secondary)
                                    Spacer()
                                    Text("Nur für Inhaber")
                                        .font(.system(size: 10))
                                        .foregroundColor(.orange)
                                }
                                
                                HStack {
                                    Image(systemName: "key.fill")
                                        .foregroundColor(.orange)
                                    SecureField("Code für Admin-Rechte", text: $adminCode)
                                }
                                .padding(12)
                                .background(Color.fieldBackground)
                                .cornerRadius(12)
                            }
                        }
                    }
                    
                    Button(action: handleAction) {
                        HStack {
                            Spacer()
                            Text(isRegisterMode ? "Konto erstellen" : "Anmelden")
                                .fontWeight(.bold)
                            Image(systemName: "arrow.right")
                            Spacer()
                        }
                        .padding(.vertical, 14)
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(16)
                    }
                    .padding(.top, 6)
                }
                .padding(20)
                .background(Color.cardBackground)
                .cornerRadius(24)
                .shadow(color: .black.opacity(0.06), radius: 12, y: 6)
                .padding(.horizontal, 16)
                
                Spacer(minLength: 30)
            }
        }
        .background(Color.appBackground)
    }
    
    private func handleAction() {
        if isRegisterMode {
            _ = authVM.register(name: name, email: email, password: password, adminCode: adminCode)
        } else {
            _ = authVM.login(email: email, password: password)
        }
    }
}

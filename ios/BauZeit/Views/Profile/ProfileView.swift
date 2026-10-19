import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

struct ProfileView: View {
    @EnvironmentObject var authVM: AuthViewModel
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // User Card
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
                    
                    Text(authVM.currentUser?.displayName ?? "Nutzer")
                        .font(.title3)
                        .fontWeight(.bold)
                    
                    Text(authVM.currentUser?.email ?? "")
                        .font(.footnote)
                        .foregroundColor(.secondary)
                    
                    Text(authVM.isOwner ? "Owner (Inhaber / Administrator)" : "Mitarbeiter")
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
                            Text("Dein Stundenlohn:")
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
                
                // Privacy Guarantee Banner
                HStack(alignment: .top, spacing: 12) {
                    Image(systemName: "lock.shield.fill")
                        .font(.title2)
                        .foregroundColor(.green)
                    
                    VStack(alignment: .leading, spacing: 3) {
                        Text("Strikte Datentrennung aktiv")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.green)
                        Text("Du hast ausschließlich Zugriff auf dein eigenes Profil und deine eigenen Arbeitszeiten. Andere Arbeiter können deine Daten nicht einsehen.")
                            .font(.system(size: 11))
                            .foregroundColor(.secondary)
                            .lineSpacing(2)
                    }
                }
                .padding(16)
                .background(Color.green.opacity(0.08))
                .cornerRadius(18)
                .padding(.horizontal, 16)
                
                // Logout Button
                Button(role: .destructive, action: {
                    authVM.logout()
                }) {
                    HStack {
                        Spacer()
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                        Text("Abmelden")
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

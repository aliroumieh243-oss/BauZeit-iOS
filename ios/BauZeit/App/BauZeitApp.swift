import SwiftUI

@main
struct BauZeitApp: App {
    @StateObject private var authVM = AuthViewModel()
    @StateObject private var timeVM = TimeTrackingViewModel()
    
    var body: some Scene {
        WindowGroup {
            MainContentView()
                .environmentObject(authVM)
                .environmentObject(timeVM)
        }
    }
}

struct MainContentView: View {
    @EnvironmentObject var authVM: AuthViewModel
    
    var body: some View {
        Group {
            if authVM.currentUser == nil {
                LoginView()
            } else if authVM.isOwner {
                OwnerTabView()
            } else {
                WorkerTabView()
            }
        }
    }
}

struct WorkerTabView: View {
    var body: some View {
        TabView {
            NavigationView {
                CalendarView(targetUserId: nil)
                    .navigationTitle("Mein Kalender")
                    #if os(iOS)
                    .navigationBarTitleDisplayMode(.inline)
                    #endif
            }
            .tabItem {
                Label("Kalender", systemImage: "calendar")
            }
            
            NavigationView {
                WorkerSummaryView()
                    .navigationTitle("Abrechnung")
                    #if os(iOS)
                    .navigationBarTitleDisplayMode(.inline)
                    #endif
            }
            .tabItem {
                Label("Abrechnung", systemImage: "chart.bar.fill")
            }
            
            NavigationView {
                ProfileView()
                    .navigationTitle("Mein Profil")
                    #if os(iOS)
                    .navigationBarTitleDisplayMode(.inline)
                    #endif
            }
            .tabItem {
                Label("Profil", systemImage: "person.fill")
            }
        }
    }
}

struct OwnerTabView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var timeVM: TimeTrackingViewModel
    
    var body: some View {
        TabView {
            NavigationView {
                OwnerDashboardView()
                    .navigationTitle("Chef-Übersicht")
                    #if os(iOS)
                    .navigationBarTitleDisplayMode(.inline)
                    #endif
            }
            .tabItem {
                Label("Übersicht", systemImage: "chart.pie.fill")
            }
            
            NavigationView {
                CalendarView(targetUserId: authVM.users.first(where: { $0.role == .member })?.id)
                    .navigationTitle("Arbeiter-Zeiten")
                    #if os(iOS)
                    .navigationBarTitleDisplayMode(.inline)
                    #endif
            }
            .tabItem {
                Label("Zeiten", systemImage: "calendar")
            }
            
            NavigationView {
                ProfileView()
                    .navigationTitle("Inhaber-Konto")
                    #if os(iOS)
                    .navigationBarTitleDisplayMode(.inline)
                    #endif
            }
            .tabItem {
                Label("Profil", systemImage: "person.crop.circle.fill")
            }
        }
    }
}

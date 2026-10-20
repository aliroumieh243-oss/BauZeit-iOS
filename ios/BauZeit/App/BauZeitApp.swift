import SwiftUI
#if canImport(FirebaseCore)
import FirebaseCore
#endif

#if os(iOS)
import UIKit

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil
    ) -> Bool {
        #if canImport(FirebaseCore)
        FirebaseApp.configure()
        #endif
        return true
    }
}
#endif

@main
struct BauZeitApp: App {
    #if os(iOS)
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
    #endif

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
                    .navigationTitle("Zeiterfassung")
                    #if os(iOS)
                    .navigationBarTitleDisplayMode(.inline)
                    #endif
            }
            .tabItem {
                Label("Zeiten", systemImage: "calendar.badge.clock")
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
                    .navigationTitle("Zeiterfassung")
                    #if os(iOS)
                    .navigationBarTitleDisplayMode(.inline)
                    #endif
            }
            .tabItem {
                Label("Zeiten", systemImage: "calendar.badge.clock")
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

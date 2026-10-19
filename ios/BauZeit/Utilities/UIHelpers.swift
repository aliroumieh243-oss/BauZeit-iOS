import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

extension Color {
    static var appBackground: Color {
        #if canImport(UIKit)
        return Color(uiColor: .systemGroupedBackground)
        #else
        return Color(red: 0.95, green: 0.95, blue: 0.97)
        #endif
    }
    
    static var cardBackground: Color {
        #if canImport(UIKit)
        return Color(uiColor: .systemBackground)
        #else
        return Color.white
        #endif
    }
    
    static var fieldBackground: Color {
        #if canImport(UIKit)
        return Color(uiColor: .secondarySystemBackground)
        #else
        return Color.gray.opacity(0.12)
        #endif
    }
}

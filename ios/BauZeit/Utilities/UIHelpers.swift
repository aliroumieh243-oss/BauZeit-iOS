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

#if canImport(UIKit)
extension UIImage {
    func resizedTo(maxDimension: CGFloat = 1024) -> UIImage {
        let maxSide = max(size.width, size.height)
        guard maxSide > maxDimension, maxSide > 0 else { return self }
        
        let ratio = maxDimension / maxSide
        let newSize = CGSize(width: size.width * ratio, height: size.height * ratio)
        
        let renderer = UIGraphicsImageRenderer(size: newSize)
        return renderer.image { _ in
            self.draw(in: CGRect(origin: .zero, size: newSize))
        }
    }
}
#endif

struct FullScreenPhotoViewer: View {
    @Environment(\.dismiss) var dismiss
    let base64String: String
    var title: String = "Beleg / Foto"
    
    private var uiImage: UIImage? {
        #if canImport(UIKit)
        guard let data = Data(base64Encoded: base64String) else { return nil }
        return UIImage(data: data)
        #else
        return nil
        #endif
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()
                
                #if canImport(UIKit)
                if let img = uiImage {
                    Image(uiImage: img)
                        .resizable()
                        .scaledToFit()
                        .padding(8)
                } else {
                    Text("Foto kann nicht geladen werden")
                        .foregroundColor(.gray)
                }
                #else
                Text("Vorschau nur auf iOS verfügbar")
                    .foregroundColor(.white)
                #endif
            }
            .navigationTitle(title)
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title3)
                            .foregroundColor(.white)
                    }
                }
            }
        }
    }
}

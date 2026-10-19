// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "BauZeit",
    platforms: [
        .iOS(.v16),
        .macOS(.v13)
    ],
    products: [
        .library(
            name: "BauZeit",
            targets: ["BauZeit"]
        )
    ],
    dependencies: [
        .package(url: "https://github.com/firebase/firebase-ios-sdk.git", from: "11.0.0")
    ],
    targets: [
        .target(
            name: "BauZeit",
            dependencies: [
                .product(name: "FirebaseCore", package: "firebase-ios-sdk"),
                .product(name: "FirebaseAnalytics", package: "firebase-ios-sdk")
            ],
            path: "BauZeit",
            exclude: ["Info.plist", "Google-Client.plist", "GoogleService-Info.plist"]
        )
    ]
)

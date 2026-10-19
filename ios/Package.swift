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
        .package(url: "https://github.com/firebase/firebase-ios-sdk.git", exact: "10.29.0")
    ],
    targets: [
        .target(
            name: "BauZeit",
            dependencies: [
                .product(name: "FirebaseAnalytics", package: "firebase-ios-sdk")
            ],
            path: "BauZeit",
            exclude: ["Info.plist", "Google-Client.plist", "GoogleService-Info.plist"]
        )
    ]
)

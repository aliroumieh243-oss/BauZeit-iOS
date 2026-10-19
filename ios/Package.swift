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
    targets: [
        .target(
            name: "BauZeit",
            path: "BauZeit",
            exclude: ["Info.plist", "Google-Client.plist"]
        )
    ]
)

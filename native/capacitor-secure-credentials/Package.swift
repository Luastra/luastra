// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "LuastraSecureCredentials",
    platforms: [.iOS(.v15)],
    products: [.library(name: "LuastraCapacitorSecureCredentials", targets: ["LuastraSecureCredentialsPlugin"])],
    dependencies: [.package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")],
    targets: [.target(
        name: "LuastraSecureCredentialsPlugin",
        dependencies: [.product(name: "Capacitor", package: "capacitor-swift-pm")],
        path: "ios/Sources/LuastraSecureCredentialsPlugin"
    )]
)

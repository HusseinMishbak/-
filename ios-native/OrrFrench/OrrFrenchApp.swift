import SwiftUI

@main
struct OrrFrenchApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var authStore = NativeAuthStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .environmentObject(authStore)
                .environment(\.layoutDirection, appState.language.isRightToLeft ? .rightToLeft : .leftToRight)
                .tint(OrrTheme.violet)
                .preferredColorScheme(.light)
        }
    }
}

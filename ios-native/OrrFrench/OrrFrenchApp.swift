import SwiftUI

@main
struct OrrFrenchApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .environment(\.layoutDirection, appState.language.isRightToLeft ? .rightToLeft : .leftToRight)
                .tint(OrrTheme.violet)
                .preferredColorScheme(.light)
        }
    }
}

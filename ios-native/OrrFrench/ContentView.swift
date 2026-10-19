import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var app: AppState
    @EnvironmentObject private var auth: NativeAuthStore
    @State private var syncTask: Task<Void, Never>?

    var body: some View {
        TabView(selection: $app.selectedTab) {
            DashboardView()
                .tabItem { Label(app.language.text("home"), systemImage: "house.fill") }
                .tag(AppTab.home)

            CourseView()
                .tabItem { Label(app.language.text("course"), systemImage: "books.vertical.fill") }
                .tag(AppTab.course)

            StudySessionView()
                .tabItem { Label(app.language.text("study"), systemImage: "timer") }
                .tag(AppTab.study)

            ProgressDashboardView()
                .tabItem { Label(app.language.text("progress"), systemImage: "chart.bar.fill") }
                .tag(AppTab.progress)

            SettingsView()
                .tabItem { Label(app.language.text("account"), systemImage: "slider.horizontal.3") }
                .tag(AppTab.settings)
        }
        .toolbarBackground(.visible, for: .tabBar)
        .toolbarBackground(.ultraThinMaterial, for: .tabBar)
        .background(OrrTheme.canvas)
        .task {
            if auth.session != nil { await app.synchronize(with: auth) }
        }
        .onChange(of: app.dataVersion) { _, _ in
            guard auth.session != nil else { return }
            syncTask?.cancel()
            syncTask = Task {
                try? await Task.sleep(for: .seconds(1))
                guard !Task.isCancelled else { return }
                await app.synchronize(with: auth)
            }
        }
        .onChange(of: auth.session?.userID) { oldValue, newValue in
            guard oldValue != newValue, newValue != nil else { return }
            Task { await app.synchronize(with: auth) }
        }
    }
}

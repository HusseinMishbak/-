import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var app: AppState

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
    }
}

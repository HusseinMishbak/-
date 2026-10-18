import SwiftUI

enum OrrTheme {
    static let ink = Color(red: 0.14, green: 0.15, blue: 0.26)
    static let muted = Color(red: 0.43, green: 0.44, blue: 0.54)
    static let violet = Color(red: 0.42, green: 0.29, blue: 0.88)
    static let pink = Color(red: 0.96, green: 0.30, blue: 0.66)
    static let cyan = Color(red: 0.13, green: 0.70, blue: 0.87)
    static let lavender = Color(red: 0.95, green: 0.92, blue: 1.0)
    static let blush = Color(red: 1.0, green: 0.92, blue: 0.97)
    static let sky = Color(red: 0.88, green: 0.96, blue: 1.0)
    static let canvas = Color(red: 0.985, green: 0.98, blue: 1.0)
    static let line = Color(red: 0.91, green: 0.89, blue: 0.95)
    static let hero = LinearGradient(colors: [pink.opacity(0.96), violet.opacity(0.92), cyan.opacity(0.82)], startPoint: .topLeading, endPoint: .bottomTrailing)
    static let pastel = LinearGradient(colors: [blush, lavender, sky], startPoint: .topLeading, endPoint: .bottomTrailing)
}

struct OrrCard<Content: View>: View {
    var padding: CGFloat = 18
    @ViewBuilder var content: Content
    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.white.opacity(0.94), in: RoundedRectangle(cornerRadius: 24, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 24, style: .continuous).stroke(OrrTheme.line.opacity(0.75), lineWidth: 1))
            .shadow(color: OrrTheme.ink.opacity(0.035), radius: 14, x: 0, y: 7)
    }
}

struct SectionHeading: View {
    let title: String
    let subtitle: String?
    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title).font(.title2.bold()).foregroundStyle(OrrTheme.ink)
            if let subtitle {
                Text(subtitle).font(.subheadline).foregroundStyle(OrrTheme.muted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

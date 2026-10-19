import SwiftUI
import AVFoundation
import Combine

struct DashboardView: View {
    @EnvironmentObject private var app: AppState
    private let columns = [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    header

                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 28).fill(OrrTheme.pastel)
                        VStack(alignment: .leading, spacing: 13) {
                            Label(app.language.text("appTitle"), systemImage: "sparkles")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(OrrTheme.violet)
                            Text(app.language.text("greeting"))
                                .font(.system(size: 27, weight: .bold, design: .rounded))
                                .foregroundStyle(OrrTheme.ink)
                                .fixedSize(horizontal: false, vertical: true)
                            Text(app.language.text("tagline"))
                                .font(.subheadline)
                                .foregroundStyle(OrrTheme.muted)
                            Button {
                                app.selectedTab = .study
                            } label: {
                                HStack {
                                    Text(app.language.text("startSession"))
                                    Image(systemName: "arrow.up.right")
                                }
                                .font(.subheadline.bold())
                                .foregroundStyle(.white)
                                .padding(.horizontal, 17).padding(.vertical, 12)
                                .background(OrrTheme.hero, in: Capsule())
                            }
                            .buttonStyle(.plain)
                            .padding(.top, 3)
                        }
                        .padding(22)
                    }
                    .fixedSize(horizontal: false, vertical: true)

                    LazyVGrid(columns: columns, spacing: 10) {
                        MetricTile(symbol: "flame.fill", value: "\(app.streak)", title: app.language.text("streak"), tint: OrrTheme.pink, fill: OrrTheme.blush)
                        MetricTile(symbol: "sparkles", value: "\(app.points)", title: app.language.text("points"), tint: OrrTheme.violet, fill: OrrTheme.lavender)
                    }

                    weeklyGoal

                    VStack(alignment: .leading, spacing: 12) {
                        SectionHeading(title: app.language.text("todayLesson"), subtitle: app.language.text("lessonDescription"))
                        OrrCard {
                            HStack(spacing: 14) {
                                ZStack {
                                    RoundedRectangle(cornerRadius: 18).fill(OrrTheme.blush)
                                    Image(systemName: "text.bubble.fill").font(.system(size: 27)).foregroundStyle(OrrTheme.pink)
                                }
                                .frame(width: 62, height: 62)
                                VStack(alignment: .leading, spacing: 6) {
                                    Text(app.language.text("lessonTitle")).font(.headline).foregroundStyle(OrrTheme.ink)
                                    Text("Bonjour · Je m’appelle…").font(.subheadline).foregroundStyle(OrrTheme.violet)
                                    Button(app.language.text("continueLesson")) { app.selectedTab = .vocabulary }
                                        .font(.subheadline.bold())
                                        .padding(.top, 3)
                                }
                                Spacer(minLength: 0)
                            }
                        }
                    }

                    OrrCard {
                        HStack(spacing: 12) {
                            Image(systemName: "rectangle.stack.fill")
                                .font(.title2).foregroundStyle(OrrTheme.violet)
                                .frame(width: 48, height: 48)
                                .background(OrrTheme.lavender, in: RoundedRectangle(cornerRadius: 15))
                            VStack(alignment: .leading, spacing: 4) {
                                Text(app.language.text("dueReview")).font(.headline).foregroundStyle(OrrTheme.ink)
                                Text(app.language.text("reviewHint")).font(.caption).foregroundStyle(OrrTheme.muted)
                            }
                            Spacer()
                            Text("\(app.dueVocabulary.count)").font(.title2.bold()).foregroundStyle(OrrTheme.violet)
                        }
                        Button { app.libraryCategory = .vocabulary; app.selectedTab = .course } label: {
                            Text(app.language.text("vocabulary"))
                                .font(.subheadline.bold()).frame(maxWidth: .infinity)
                                .padding(.vertical, 12).background(OrrTheme.lavender, in: RoundedRectangle(cornerRadius: 14))
                        }
                        .buttonStyle(.plain).foregroundStyle(OrrTheme.violet).padding(.top, 10)
                    }
                }
                .padding(.horizontal, 17).padding(.top, 14).padding(.bottom, 24)
            }
            .background(OrrTheme.canvas.ignoresSafeArea())
            .navigationBarHidden(true)
        }
    }

    private var header: some View {
        HStack(spacing: 11) {
            ZStack {
                Circle().fill(OrrTheme.pastel)
                Image(systemName: "person.crop.circle.fill").font(.system(size: 29)).foregroundStyle(OrrTheme.violet)
            }
            .frame(width: 46, height: 46)
            VStack(alignment: .leading, spacing: 3) {
                Text(app.language.text("home")).font(.title3.bold()).foregroundStyle(OrrTheme.ink)
                Text(app.language.text("tagline")).font(.caption).foregroundStyle(OrrTheme.muted).lineLimit(1)
            }
            Spacer()
            Image(systemName: "bell.badge").font(.title3).foregroundStyle(OrrTheme.ink)
                .frame(width: 42, height: 42)
                .background(.white, in: Circle())
        }
    }

    private var weeklyGoal: some View {
        OrrCard {
            HStack {
                VStack(alignment: .leading, spacing: 5) {
                    Text(app.language.text("weeklyGoal")).font(.headline).foregroundStyle(OrrTheme.ink)
                    Text(app.language.text("weeklyHours")).font(.caption).foregroundStyle(OrrTheme.muted)
                }
                Spacer()
                Text("\(Int(min(Double(app.minutesThisWeek) / 480.0 * 100, 100)))%")
                    .font(.title2.bold()).foregroundStyle(OrrTheme.violet)
            }
            ProgressView(value: Double(min(app.minutesThisWeek, 480)), total: 480)
                .tint(OrrTheme.violet).padding(.vertical, 8)
            Text("\(app.minutesThisWeek) / 480 · " + app.language.text("minutesRemaining"))
                .font(.caption).foregroundStyle(OrrTheme.muted)
        }
    }
}

private struct MetricTile: View {
    let symbol: String
    let value: String
    let title: String
    let tint: Color
    let fill: Color

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: symbol).font(.title3).foregroundStyle(tint)
                .frame(width: 42, height: 42).background(fill, in: RoundedRectangle(cornerRadius: 14))
            VStack(alignment: .leading, spacing: 4) {
                Text(value).font(.system(size: 22, weight: .bold, design: .rounded)).foregroundStyle(OrrTheme.ink)
                Text(title).font(.caption).foregroundStyle(OrrTheme.muted).lineLimit(2)
            }
            Spacer(minLength: 0)
        }
        .padding(14).frame(maxWidth: .infinity, alignment: .leading)
        .background(.white, in: RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(OrrTheme.line.opacity(0.7), lineWidth: 1))
    }
}

struct VocabularyView: View {
    @EnvironmentObject private var app: AppState
    @State private var revealed = false

    private var currentCard: VocabularyCard? { app.dueVocabulary.first }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    SectionHeading(title: app.language.text("vocabulary"), subtitle: app.language.text("reviewHint"))

                    if let card = currentCard {
                        HStack {
                            Label(app.language.text("dueReview"), systemImage: "rectangle.stack.fill")
                                .font(.subheadline.bold()).foregroundStyle(OrrTheme.violet)
                            Spacer()
                            Text("\(app.dueVocabulary.count) / \(app.vocabulary.count)")
                                .font(.caption.bold()).foregroundStyle(OrrTheme.muted)
                        }

                        VStack(spacing: 16) {
                            HStack {
                                Text("A1 · FRENCH").font(.caption2.bold()).tracking(1.5).foregroundStyle(OrrTheme.violet)
                                Spacer()
                                Text("#\(card.reviewCount + 1)").font(.caption).foregroundStyle(OrrTheme.muted)
                            }
                            Text(card.french)
                                .font(.system(size: 33, weight: .bold, design: .rounded))
                                .foregroundStyle(OrrTheme.ink)
                                .multilineTextAlignment(.center)
                                .frame(maxWidth: .infinity).padding(.vertical, 12)
                            Button {
                                speak(card.french)
                            } label: {
                                Label("🔊", systemImage: "speaker.wave.2.fill")
                                    .font(.subheadline.bold()).padding(.horizontal, 18).padding(.vertical, 11)
                                    .background(OrrTheme.sky, in: Capsule())
                            }.buttonStyle(.plain).foregroundStyle(OrrTheme.violet)

                            if revealed {
                                VStack(spacing: 8) {
                                    Text(app.language == .arabic ? card.arabic : card.english)
                                        .font(.title2.bold()).foregroundStyle(OrrTheme.violet)
                                    Text(app.language.text("example") + ": " + card.example)
                                        .font(.body).foregroundStyle(OrrTheme.muted).multilineTextAlignment(.center)
                                }
                                .frame(maxWidth: .infinity).padding(17)
                                .background(OrrTheme.pastel, in: RoundedRectangle(cornerRadius: 18))
                                .transition(.opacity.combined(with: .move(edge: .top)))
                            } else {
                                Button {
                                    withAnimation(.spring(response: 0.32)) { revealed = true }
                                } label: {
                                    Text(app.language.text("reveal"))
                                        .font(.headline).frame(maxWidth: .infinity).padding(.vertical, 14)
                                        .background(OrrTheme.hero, in: RoundedRectangle(cornerRadius: 16)).foregroundStyle(.white)
                                }.buttonStyle(.plain)
                            }

                            if revealed {
                                Button(app.language.text("knewIt")) {
                                    app.review(card, knewIt: true)
                                    revealed = false
                                }
                                .font(.headline).frame(maxWidth: .infinity).padding(.vertical, 14)
                                .background(OrrTheme.violet, in: RoundedRectangle(cornerRadius: 16)).foregroundStyle(.white)

                                Button(app.language.text("reviewAgain")) {
                                    app.review(card, knewIt: false)
                                    revealed = false
                                }
                                .font(.subheadline.bold()).frame(maxWidth: .infinity).padding(.vertical, 12)
                                .background(OrrTheme.blush, in: RoundedRectangle(cornerRadius: 16)).foregroundStyle(OrrTheme.pink)
                            }
                        }
                        .padding(22)
                        .background(.white, in: RoundedRectangle(cornerRadius: 28))
                        .overlay(RoundedRectangle(cornerRadius: 28).stroke(OrrTheme.line, lineWidth: 1))
                        .shadow(color: OrrTheme.ink.opacity(0.04), radius: 16, y: 8)
                    } else {
                        OrrCard {
                            VStack(spacing: 16) {
                                Image(systemName: "checkmark.seal.fill").font(.system(size: 48)).foregroundStyle(OrrTheme.violet)
                                Text(app.language.text("allCaughtUp")).font(.headline).foregroundStyle(OrrTheme.ink).multilineTextAlignment(.center)
                                Text(app.language.text("availableCards") + ": \(app.vocabulary.count)")
                                    .font(.subheadline).foregroundStyle(OrrTheme.muted)
                            }.frame(maxWidth: .infinity).padding(.vertical, 25)
                        }
                    }

                    SectionHeading(title: app.language.text("availableCards"), subtitle: nil)
                    ForEach(app.vocabulary.prefix(8)) { word in
                        HStack(spacing: 12) {
                            VStack(alignment: .leading, spacing: 5) {
                                Text(word.french).font(.headline).foregroundStyle(OrrTheme.ink)
                                Text(app.language == .arabic ? word.arabic : word.english).font(.subheadline).foregroundStyle(OrrTheme.muted)
                            }
                            Spacer()
                            Image(systemName: word.dueAt <= .now ? "circle.fill" : "checkmark.circle.fill")
                                .font(.caption).foregroundStyle(word.dueAt <= .now ? OrrTheme.pink : OrrTheme.violet)
                        }
                        .padding(14).background(.white, in: RoundedRectangle(cornerRadius: 17))
                    }
                }
                .padding(17).padding(.bottom, 24)
            }
            .background(OrrTheme.canvas.ignoresSafeArea())
            .navigationTitle(app.language.text("vocabulary"))
            .navigationBarTitleDisplayMode(.inline)
            .onChange(of: currentCard?.id) { _, _ in revealed = false }
        }
    }

    private func speak(_ phrase: String) {
        let utterance = AVSpeechUtterance(string: phrase)
        utterance.voice = AVSpeechSynthesisVoice(language: "fr-FR")
        utterance.rate = 0.46
        SpeechService.synthesizer.stopSpeaking(at: .immediate)
        SpeechService.synthesizer.speak(utterance)
    }
}

private enum SpeechService {
    static let synthesizer = AVSpeechSynthesizer()
}

struct StudySessionView: View {
    @EnvironmentObject private var app: AppState
    @State private var selectedSkill: StudySkill = .vocabulary
    @State private var selectedDuration = 25
    @State private var showingTimer = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    SectionHeading(title: app.language.text("startSession"), subtitle: app.language.text("tagline"))
                    OrrCard {
                        VStack(alignment: .leading, spacing: 14) {
                            Text(app.language.text("chooseSkill")).font(.headline).foregroundStyle(OrrTheme.ink)
                            ForEach(StudySkill.allCases) { skill in
                                Button { selectedSkill = skill } label: {
                                    HStack(spacing: 13) {
                                        Image(systemName: skill.symbol).font(.title3).foregroundStyle(selectedSkill == skill ? .white : OrrTheme.violet)
                                            .frame(width: 44, height: 44)
                                            .background(selectedSkill == skill ? OrrTheme.violet : OrrTheme.lavender, in: RoundedRectangle(cornerRadius: 14))
                                        Text(app.language.text(skill.copyKey)).font(.subheadline.bold())
                                            .foregroundStyle(OrrTheme.ink)
                                        Spacer()
                                        if selectedSkill == skill { Image(systemName: "checkmark.circle.fill").foregroundStyle(OrrTheme.violet) }
                                    }
                                    .padding(10)
                                    .background(selectedSkill == skill ? OrrTheme.lavender.opacity(0.75) : Color.clear, in: RoundedRectangle(cornerRadius: 16))
                                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(selectedSkill == skill ? OrrTheme.violet.opacity(0.28) : OrrTheme.line, lineWidth: 1))
                                }.buttonStyle(.plain)
                            }

                            Text(app.language.text("duration")).font(.headline).foregroundStyle(OrrTheme.ink).padding(.top, 5)
                            HStack(spacing: 9) {
                                ForEach([15, 25, 45], id: \.self) { length in
                                    Button { selectedDuration = length } label: {
                                        VStack(spacing: 4) {
                                            Text("\(length)").font(.title2.bold())
                                            Text(app.language.text("minutes")).font(.caption)
                                        }
                                        .frame(maxWidth: .infinity).padding(.vertical, 14)
                                        .foregroundStyle(selectedDuration == length ? .white : OrrTheme.ink)
                                        .background(selectedDuration == length ? OrrTheme.violet : OrrTheme.canvas, in: RoundedRectangle(cornerRadius: 17))
                                    }.buttonStyle(.plain)
                                }
                            }

                            Button { showingTimer = true } label: {
                                Label(app.language.text("beginTimer"), systemImage: "timer")
                                    .font(.headline).frame(maxWidth: .infinity).padding(.vertical, 15)
                                    .background(OrrTheme.hero, in: RoundedRectangle(cornerRadius: 16)).foregroundStyle(.white)
                            }.buttonStyle(.plain).padding(.top, 5)
                        }
                    }
                    OrrCard {
                        Label(app.language.text("thisWeek"), systemImage: "calendar")
                            .font(.headline).foregroundStyle(OrrTheme.ink)
                        Text("\(app.minutesThisWeek) / 480 " + app.language.text("minutesRemaining"))
                            .font(.subheadline).foregroundStyle(OrrTheme.muted).padding(.top, 5)
                        ProgressView(value: Double(min(app.minutesThisWeek, 480)), total: 480).tint(OrrTheme.violet).padding(.top, 6)
                    }
                }.padding(17).padding(.bottom, 24)
            }
            .background(OrrTheme.canvas.ignoresSafeArea())
            .navigationTitle(app.language.text("study"))
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $showingTimer) {
                StudyTimerSheet(duration: selectedDuration, skill: selectedSkill)
                    .environmentObject(app)
            }
        }
    }
}

private struct StudyTimerSheet: View {
    @EnvironmentObject private var app: AppState
    @Environment(\.dismiss) private var dismiss
    let duration: Int
    let skill: StudySkill
    @State private var remainingSeconds: Int
    @State private var isRunning = true
    @State private var finished = false
    @State private var saved = false
    private let ticker = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    init(duration: Int, skill: StudySkill) {
        self.duration = duration
        self.skill = skill
        _remainingSeconds = State(initialValue: duration * 60)
    }

    private var totalSeconds: Int { duration * 60 }
    private var timeLabel: String {
        String(format: "%02d:%02d", remainingSeconds / 60, remainingSeconds % 60)
    }

    var body: some View {
        VStack(spacing: 24) {
            HStack {
                Text(app.language.text("study")).font(.headline)
                Spacer()
                Button(app.language.text("done")) { dismiss() }.font(.subheadline.bold())
            }
            .padding(.top, 20)

            Spacer()
            Image(systemName: skill.symbol).font(.system(size: 39)).foregroundStyle(OrrTheme.violet)
                .frame(width: 90, height: 90).background(OrrTheme.pastel, in: RoundedRectangle(cornerRadius: 28))
            Text(app.language.text(skill.copyKey)).font(.title2.bold()).foregroundStyle(OrrTheme.ink)
            Text(timeLabel)
                .font(.system(size: 61, weight: .bold, design: .rounded).monospacedDigit())
                .foregroundStyle(OrrTheme.violet)
                .contentTransition(.numericText())
            ProgressView(value: Double(remainingSeconds), total: Double(totalSeconds))
                .tint(OrrTheme.violet).padding(.horizontal, 20)

            if finished {
                Label(app.language.text("sessionFinished"), systemImage: "checkmark.seal.fill")
                    .font(.headline).foregroundStyle(OrrTheme.violet)
                Button(app.language.text("done")) { dismiss() }
                    .font(.headline).frame(maxWidth: .infinity).padding(.vertical, 15)
                    .background(OrrTheme.violet, in: RoundedRectangle(cornerRadius: 17)).foregroundStyle(.white)
            } else {
                HStack(spacing: 10) {
                    Button {
                        isRunning.toggle()
                    } label: {
                        Label(app.language.text(isRunning ? "pause" : "resume"), systemImage: isRunning ? "pause.fill" : "play.fill")
                            .frame(maxWidth: .infinity).padding(.vertical, 14)
                            .background(OrrTheme.lavender, in: RoundedRectangle(cornerRadius: 16))
                    }.buttonStyle(.plain).foregroundStyle(OrrTheme.violet)

                    Button {
                        finishAndSave()
                    } label: {
                        Text(app.language.text("finishSave"))
                            .frame(maxWidth: .infinity).padding(.vertical, 14)
                            .background(OrrTheme.violet, in: RoundedRectangle(cornerRadius: 16)).foregroundStyle(.white)
                    }.buttonStyle(.plain)
                }
            }
            Spacer()
            Text(app.language.text("nativeNote")).font(.caption).foregroundStyle(OrrTheme.muted).multilineTextAlignment(.center)
                .padding(.bottom, 12)
        }
        .padding(.horizontal, 22)
        .background(OrrTheme.canvas.ignoresSafeArea())
        .environment(\.layoutDirection, app.language.isRightToLeft ? .rightToLeft : .leftToRight)
        .onReceive(ticker) { _ in
            guard isRunning, !finished, remainingSeconds > 0 else { return }
            remainingSeconds -= 1
            if remainingSeconds == 0 { finishAndSave() }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    private func finishAndSave() {
        guard !saved else { return }
        isRunning = false
        saved = true
        finished = true
        let elapsed = max(0, totalSeconds - remainingSeconds)
        let minutes = elapsed == 0 ? 0 : Int(ceil(Double(elapsed) / 60.0))
        app.recordSession(minutes: minutes, skill: skill)
    }
}

struct ProgressDashboardView: View {
    @EnvironmentObject private var app: AppState

    private var weekdayBars: [(String, Int)] {
        let calendar = Calendar.current
        let start = calendar.dateInterval(of: .weekOfYear, for: .now)?.start ?? calendar.startOfDay(for: .now)
        let symbols = calendar.shortStandaloneWeekdaySymbols ?? calendar.shortWeekdaySymbols
        let mondayFirst = Array(symbols.dropFirst()) + [symbols[0]]
        return (0..<7).map { offset in
            let day = calendar.date(byAdding: .day, value: offset, to: start) ?? start
            let minutes = app.sessions.filter { calendar.isDate($0.completedAt, inSameDayAs: day) }.reduce(0) { $0 + $1.minutes }
            return (mondayFirst[offset], minutes)
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    SectionHeading(title: app.language.text("progress"), subtitle: app.language.text("thisWeek"))
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 11) {
                        StatCard(value: "\(app.minutesThisWeek)", unit: app.language.text("minutes"), title: app.language.text("minutesStudied"), symbol: "clock.fill", tint: OrrTheme.cyan, tintFill: OrrTheme.sky)
                        StatCard(value: "\(app.completedThisWeek.count)", unit: "", title: app.language.text("sessionsCompleted"), symbol: "checkmark.circle.fill", tint: OrrTheme.violet, tintFill: OrrTheme.lavender)
                        StatCard(value: "\(app.streak)", unit: app.language.text("dayShort"), title: app.language.text("streak"), symbol: "flame.fill", tint: OrrTheme.pink, tintFill: OrrTheme.blush)
                        StatCard(value: "\(app.points)", unit: "XP", title: app.language.text("points"), symbol: "sparkles", tint: OrrTheme.violet, tintFill: OrrTheme.lavender)
                    }

                    OrrCard {
                        HStack {
                            SectionHeading(title: app.language.text("weeklyGoal"), subtitle: app.language.text("weeklyHours"))
                            Spacer()
                            Text("\(Int(min(Double(app.minutesThisWeek) / 480.0 * 100, 100)))%")
                                .font(.title2.bold()).foregroundStyle(OrrTheme.violet)
                        }
                        ProgressView(value: Double(min(app.minutesThisWeek, 480)), total: 480).tint(OrrTheme.violet).padding(.vertical, 10)
                        Text("\(app.minutesThisWeek) / 480 " + app.language.text("minutesRemaining"))
                            .font(.caption).foregroundStyle(OrrTheme.muted)
                    }

                    OrrCard {
                        SectionHeading(title: app.language.text("thisWeek"), subtitle: app.language.text("minutesStudied"))
                        HStack(alignment: .bottom, spacing: 11) {
                            ForEach(Array(weekdayBars.enumerated()), id: \.offset) { _, item in
                                VStack(spacing: 8) {
                                    RoundedRectangle(cornerRadius: 8)
                                        .fill(item.1 > 0 ? AnyShapeStyle(OrrTheme.hero) : AnyShapeStyle(OrrTheme.line.opacity(0.6)))
                                        .frame(maxWidth: .infinity)
                                        .frame(height: CGFloat(max(8, min(125, item.1 == 0 ? 8 : item.1 * 2))))
                                    Text(item.0).font(.caption2).foregroundStyle(OrrTheme.muted)
                                }
                            }
                        }.frame(height: 155, alignment: .bottom).padding(.top, 16)
                    }

                    SectionHeading(title: app.language.text("recentSessions"), subtitle: nil)
                    if app.sessions.isEmpty {
                        OrrCard {
                            Text(app.language.text("noSessions")).font(.subheadline).foregroundStyle(OrrTheme.muted)
                                .frame(maxWidth: .infinity, alignment: .center).padding(.vertical, 16)
                        }
                    } else {
                        ForEach(app.sessions.prefix(8)) { record in
                            HStack(spacing: 12) {
                                Image(systemName: "checkmark.circle.fill").font(.title2).foregroundStyle(OrrTheme.violet)
                                VStack(alignment: .leading, spacing: 5) {
                                    Text(app.language.text(StudySkill(rawValue: record.skill)?.copyKey ?? "study")).font(.headline).foregroundStyle(OrrTheme.ink)
                                    Text(record.completedAt.formatted(date: .abbreviated, time: .shortened)).font(.caption).foregroundStyle(OrrTheme.muted)
                                }
                                Spacer()
                                Text("\(record.minutes) " + app.language.text("minutes")).font(.subheadline.bold()).foregroundStyle(OrrTheme.violet)
                            }
                            .padding(14).background(.white, in: RoundedRectangle(cornerRadius: 17))
                        }
                    }
                }.padding(17).padding(.bottom, 25)
            }
            .background(OrrTheme.canvas.ignoresSafeArea())
            .navigationTitle(app.language.text("progress"))
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

private struct StatCard: View {
    let value: String
    let unit: String
    let title: String
    let symbol: String
    let tint: Color
    let tintFill: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 9) {
            Image(systemName: symbol).font(.title3).foregroundStyle(tint).frame(width: 40, height: 40)
                .background(tintFill, in: RoundedRectangle(cornerRadius: 13))
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(value).font(.system(size: 28, weight: .bold, design: .rounded)).foregroundStyle(OrrTheme.ink)
                Text(unit).font(.caption).foregroundStyle(OrrTheme.muted)
            }
            Text(title).font(.caption).foregroundStyle(OrrTheme.muted).lineLimit(2)
        }
        .frame(maxWidth: .infinity, minHeight: 126, alignment: .leading).padding(15)
        .background(.white, in: RoundedRectangle(cornerRadius: 21))
        .overlay(RoundedRectangle(cornerRadius: 21).stroke(OrrTheme.line, lineWidth: 1))
    }
}

struct SettingsView: View {
    @EnvironmentObject private var app: AppState
    @EnvironmentObject private var auth: NativeAuthStore
    @State private var email = ""
    @State private var password = ""
    @State private var fullName = ""
    @State private var isCreatingAccount = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    SectionHeading(title: app.language.text("account"), subtitle: app.language.text("appTitle"))

                    OrrCard {
                        HStack(spacing: 14) {
                            Image(systemName: "globe").font(.title2).foregroundStyle(OrrTheme.violet)
                                .frame(width: 50, height: 50).background(OrrTheme.lavender, in: RoundedRectangle(cornerRadius: 16))
                            VStack(alignment: .leading, spacing: 5) {
                                Text(app.language.text("language")).font(.headline).foregroundStyle(OrrTheme.ink)
                                Text(app.language.displayName).font(.caption).foregroundStyle(OrrTheme.muted)
                            }
                            Spacer()
                            Picker(app.language.text("language"), selection: $app.language) {
                                ForEach(AppLanguage.allCases) { language in
                                    Text(language.displayName).tag(language)
                                }
                            }
                            .labelsHidden().pickerStyle(.menu)
                        }
                    }

                    VStack(alignment: .leading, spacing: 14) {
                        SectionHeading(title: app.language.text("accountCloud"), subtitle: app.language.text("authHint"))
                        OrrCard {
                            if let session = auth.session {
                                Label(app.language.text("signedInAs"), systemImage: "person.crop.circle.fill")
                                    .font(.subheadline.bold()).foregroundStyle(OrrTheme.ink)
                                Text(session.email).font(.body).foregroundStyle(OrrTheme.violet).textSelection(.enabled)
                                HStack(spacing: 10) {
                                    Button {
                                        Task { await app.synchronize(with: auth) }
                                    } label: {
                                        Label(app.language.text("syncNow"), systemImage: "arrow.triangle.2.circlepath")
                                            .font(.subheadline.bold()).frame(maxWidth: .infinity).padding(.vertical, 13)
                                            .background(OrrTheme.violet, in: RoundedRectangle(cornerRadius: 14)).foregroundStyle(.white)
                                    }.buttonStyle(.plain).disabled(auth.isBusy)
                                    Button {
                                        Task { await auth.signOut() }
                                    } label: {
                                        Text(app.language.text("signOut")).font(.subheadline.bold())
                                            .padding(.horizontal, 14).padding(.vertical, 13)
                                            .background(OrrTheme.blush, in: RoundedRectangle(cornerRadius: 14)).foregroundStyle(OrrTheme.pink)
                                    }.buttonStyle(.plain).disabled(auth.isBusy)
                                }.padding(.top, 5)
                            } else {
                                if isCreatingAccount {
                                    TextField(app.language.text("fullName"), text: $fullName)
                                        .textContentType(.name)
                                        .padding(12).background(OrrTheme.canvas, in: RoundedRectangle(cornerRadius: 13))
                                }
                                TextField(app.language.text("email"), text: $email)
                                    .textContentType(.emailAddress).keyboardType(.emailAddress)
                                    .textInputAutocapitalization(.never).autocorrectionDisabled()
                                    .padding(12).background(OrrTheme.canvas, in: RoundedRectangle(cornerRadius: 13))
                                SecureField(app.language.text("password"), text: $password)
                                    .textContentType(isCreatingAccount ? .newPassword : .password)
                                    .padding(12).background(OrrTheme.canvas, in: RoundedRectangle(cornerRadius: 13))

                                Button {
                                    Task {
                                        if isCreatingAccount {
                                            let created = await auth.signUp(email: email, password: password, fullName: fullName)
                                            if created { await app.synchronize(with: auth) }
                                        } else {
                                            let signedIn = await auth.signIn(email: email, password: password)
                                            if signedIn { await app.synchronize(with: auth) }
                                        }
                                    }
                                } label: {
                                    HStack {
                                        if auth.isBusy { ProgressView().tint(.white) }
                                        Text(app.language.text(isCreatingAccount ? "signUp" : "signIn"))
                                    }
                                    .font(.headline).frame(maxWidth: .infinity).padding(.vertical, 14)
                                    .background(OrrTheme.hero, in: RoundedRectangle(cornerRadius: 15)).foregroundStyle(.white)
                                }.buttonStyle(.plain).disabled(auth.isBusy || email.isEmpty || password.isEmpty || (isCreatingAccount && fullName.isEmpty))

                                if !isCreatingAccount {
                                    Button {
                                        Task { await auth.sendPasswordRecovery(email: email) }
                                    } label: {
                                        Text(app.language.text("forgotPassword"))
                                            .font(.subheadline).frame(maxWidth: .infinity).padding(.vertical, 5)
                                    }
                                    .buttonStyle(.plain)
                                    .disabled(auth.isBusy || email.isEmpty)
                                }

                                Button {
                                    isCreatingAccount.toggle()
                                    auth.setStatus("")
                                } label: {
                                    Text(app.language.text(isCreatingAccount ? "signIn" : "signUp"))
                                        .font(.subheadline.bold()).frame(maxWidth: .infinity).padding(.vertical, 8)
                                }.buttonStyle(.plain)
                            }

                            if !auth.statusMessage.isEmpty {
                                Text(auth.statusMessage).font(.caption).foregroundStyle(OrrTheme.muted)
                                    .lineSpacing(3).textSelection(.enabled).padding(.top, 3)
                            }
                        }
                    }

                    OrrCard {
                        HStack(spacing: 13) {
                            Image(systemName: "iphone.gen3").font(.title2).foregroundStyle(OrrTheme.violet)
                                .frame(width: 48, height: 48).background(OrrTheme.pastel, in: RoundedRectangle(cornerRadius: 15))
                            VStack(alignment: .leading, spacing: 5) {
                                Text(app.language.text("nativeApp")).font(.headline).foregroundStyle(OrrTheme.ink)
                                Text(app.language.text("levelDetail")).font(.subheadline).foregroundStyle(OrrTheme.muted)
                            }
                        }
                        Divider().padding(.vertical, 6)
                        Text(app.language.text("nativeNote"))
                            .font(.subheadline).lineSpacing(4).foregroundStyle(OrrTheme.muted)
                    }

                    OrrCard {
                        Label(app.language.text("about"), systemImage: "info.circle")
                            .font(.headline).foregroundStyle(OrrTheme.ink)
                        Text(app.language.text("appTitle") + " · 0.2 Native")
                            .font(.subheadline).foregroundStyle(OrrTheme.muted).padding(.top, 5)
                        Text(app.language.text("levelDetail"))
                            .font(.caption.bold()).foregroundStyle(OrrTheme.violet).padding(.top, 8)
                    }
                }.padding(17).padding(.bottom, 25)
            }
            .background(OrrTheme.canvas.ignoresSafeArea())
            .navigationTitle(app.language.text("account"))
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

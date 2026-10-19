import SwiftUI
import AVFoundation

struct CourseView: View {
    @EnvironmentObject private var app: AppState
    @State private var selectedEntry: CourseEntry?
    private let catalog = NativeCurriculumCatalog.shared

    private var entries: [CourseEntry] {
        switch app.libraryCategory {
        case .textbook: return catalog.textbook
        case .roadmap: return catalog.roadmap
        case .citizenship: return catalog.citizenship
        case .vocabulary: return []
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 17) {
                    SectionHeading(title: app.language.text("course"), subtitle: app.language.text("courseSubtitle"))
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            categoryButton(.textbook, title: app.language.text("textbook"))
                            categoryButton(.roadmap, title: app.language.text("roadmap"))
                            categoryButton(.citizenship, title: app.language.text("citizenship"))
                            categoryButton(.vocabulary, title: app.language.text("vocabulary"))
                        }
                    }

                    HStack(spacing: 9) {
                        summaryBadge("\(catalog.textbook.count)", app.language.text("textbook"))
                        summaryBadge("\(catalog.roadmap.count)", app.language.text("roadmap"))
                        summaryBadge("\(catalog.citizenship.count)", app.language.text("citizenship"))
                    }

                    if app.libraryCategory == .vocabulary {
                        vocabularyList
                    } else if entries.isEmpty {
                        OrrCard { Text(app.language.text("curriculumLoadFailed")).foregroundStyle(OrrTheme.muted) }
                    } else {
                        ForEach(entries) { entry in
                            Button { selectedEntry = entry } label: {
                                HStack(spacing: 13) {
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 16).fill(categoryColor(app.libraryCategory).opacity(0.12))
                                        Image(systemName: categorySymbol(app.libraryCategory)).font(.title3).foregroundStyle(categoryColor(app.libraryCategory))
                                    }.frame(width: 51, height: 51)
                                    VStack(alignment: .leading, spacing: 5) {
                                        HStack(spacing: 6) {
                                            Text(entry.level).font(.caption2.bold()).foregroundStyle(categoryColor(app.libraryCategory))
                                            Text("·").foregroundStyle(OrrTheme.muted)
                                            Text(entry.subtitle).font(.caption2).foregroundStyle(OrrTheme.muted).lineLimit(1)
                                        }
                                        Text(entry.title).font(.headline).foregroundStyle(OrrTheme.ink).multilineTextAlignment(.leading)
                                        Text(entry.description).font(.caption).foregroundStyle(OrrTheme.muted).lineLimit(2).multilineTextAlignment(.leading)
                                    }
                                    Spacer(minLength: 0)
                                    Image(systemName: "chevron.left").font(.caption.bold()).foregroundStyle(OrrTheme.muted)
                                }
                                .padding(14)
                                .background(.white, in: RoundedRectangle(cornerRadius: 20))
                                .overlay(RoundedRectangle(cornerRadius: 20).stroke(OrrTheme.line, lineWidth: 1))
                            }.buttonStyle(.plain)
                        }
                    }
                    Text(app.language.text("nativeCurriculumNote"))
                        .font(.caption).foregroundStyle(OrrTheme.muted).lineSpacing(4)
                        .padding(.top, 4)
                }.padding(17).padding(.bottom, 24)
            }
            .background(OrrTheme.canvas.ignoresSafeArea())
            .navigationTitle(app.language.text("course"))
            .navigationBarTitleDisplayMode(.inline)
            .onChange(of: app.libraryCategory) { _, _ in selectedEntry = nil }
            .sheet(item: $selectedEntry) { entry in
                CourseEntryDetailView(entry: entry)
                    .environmentObject(app)
            }
        }
    }

    private func categoryButton(_ value: CourseCategory, title: String) -> some View {
        Button { app.libraryCategory = value } label: {
            Text(title).font(.subheadline.bold())
                .padding(.horizontal, 14).padding(.vertical, 10)
                .foregroundStyle(app.libraryCategory == value ? .white : OrrTheme.ink)
                .background(app.libraryCategory == value ? OrrTheme.violet : .white, in: Capsule())
                .overlay(Capsule().stroke(app.libraryCategory == value ? OrrTheme.violet : OrrTheme.line, lineWidth: 1))
        }.buttonStyle(.plain)
    }

    private var vocabularyList: some View {
        VStack(alignment: .leading, spacing: 11) {
            SectionHeading(title: app.language.text("vocabulary"), subtitle: "\(app.vocabulary.count) " + app.language.text("availableCards"))
            ForEach(app.vocabulary) { word in
                HStack(spacing: 11) {
                    VStack(alignment: .leading, spacing: 5) {
                        Text(word.french).font(.headline).foregroundStyle(OrrTheme.ink)
                        Text(app.language == .arabic ? word.arabic : word.english).font(.subheadline).foregroundStyle(OrrTheme.muted)
                        if !word.example.isEmpty { Text(word.example).font(.caption).foregroundStyle(OrrTheme.violet) }
                    }
                    Spacer(minLength: 0)
                    Button { speak(word.french) } label: { Image(systemName: "speaker.wave.2.fill").padding(10).background(OrrTheme.lavender, in: Circle()) }
                        .buttonStyle(.plain)
                    if word.dueAt > .now {
                        Image(systemName: "checkmark.circle.fill").foregroundStyle(.green)
                    }
                }
                .padding(13).background(.white, in: RoundedRectangle(cornerRadius: 16))
            }
        }
    }

    private func categoryColor(_ value: CourseCategory) -> Color {
        switch value {
        case .textbook: return OrrTheme.violet
        case .roadmap: return OrrTheme.cyan
        case .citizenship: return OrrTheme.pink
        case .vocabulary: return OrrTheme.violet
        }
    }

    private func categorySymbol(_ value: CourseCategory) -> String {
        switch value {
        case .textbook: return "book.closed.fill"
        case .roadmap: return "map.fill"
        case .citizenship: return "person.2.fill"
        case .vocabulary: return "rectangle.stack.fill"
        }
    }
}

private struct CourseEntryDetailView: View {
    @EnvironmentObject private var app: AppState
    @Environment(\.dismiss) private var dismiss
    let entry: CourseEntry
    @State private var showQuiz = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(entry.level.uppercased()).font(.caption.bold()).tracking(1.4).foregroundStyle(OrrTheme.violet)
                        Text(entry.title).font(.largeTitle.bold()).foregroundStyle(OrrTheme.ink)
                        Text(entry.description).font(.body).foregroundStyle(OrrTheme.muted).lineSpacing(4)
                        if !entry.grammar.isEmpty {
                            Label(entry.grammar, systemImage: "text.book.closed").font(.subheadline).foregroundStyle(OrrTheme.violet)
                                .padding(12).frame(maxWidth: .infinity, alignment: .leading)
                                .background(OrrTheme.lavender, in: RoundedRectangle(cornerRadius: 15))
                        }
                    }

                    if !entry.task.isEmpty {
                        OrrCard {
                            Label(app.language.text("practiceTask"), systemImage: "target").font(.headline).foregroundStyle(OrrTheme.ink)
                            Text(entry.task).font(.subheadline).foregroundStyle(OrrTheme.muted).lineSpacing(4).padding(.top, 4)
                        }
                    }

                    if !entry.days.isEmpty {
                        SectionHeading(title: app.language.text("lessonContent"), subtitle: "\(entry.days.count) " + app.language.text("lessons"))
                        ForEach(Array(entry.days.enumerated()), id: \.element.id) { index, day in
                            VStack(alignment: .leading, spacing: 10) {
                                HStack(alignment: .top) {
                                    Text("\(index + 1)").font(.caption.bold()).foregroundStyle(.white)
                                        .frame(width: 26, height: 26).background(OrrTheme.violet, in: Circle())
                                    Text(day.title).font(.headline).foregroundStyle(OrrTheme.ink)
                                }
                                if !day.explanation.isEmpty {
                                    Text(day.explanation).font(.subheadline).foregroundStyle(OrrTheme.muted).lineSpacing(4)
                                }
                                if !day.task.isEmpty {
                                    Label(day.task, systemImage: "checkmark.circle").font(.caption).foregroundStyle(OrrTheme.ink)
                                }
                                ForEach(day.examples) { example in
                                    VStack(alignment: .leading, spacing: 4) {
                                        Button { speak(example.french) } label: {
                                            Label(example.french, systemImage: "speaker.wave.2.fill").font(.body.bold())
                                                .foregroundStyle(OrrTheme.violet).multilineTextAlignment(.leading)
                                        }.buttonStyle(.plain)
                                        if !example.arabic.isEmpty {
                                            Text(example.arabic).font(.subheadline).foregroundStyle(OrrTheme.muted)
                                        }
                                    }.padding(11).frame(maxWidth: .infinity, alignment: .leading)
                                        .background(OrrTheme.canvas, in: RoundedRectangle(cornerRadius: 13))
                                }
                            }.padding(15).background(.white, in: RoundedRectangle(cornerRadius: 18))
                                .overlay(RoundedRectangle(cornerRadius: 18).stroke(OrrTheme.line, lineWidth: 1))
                        }
                    }

                    if !entry.vocabulary.isEmpty {
                        SectionHeading(title: app.language.text("vocabulary"), subtitle: nil)
                        ForEach(entry.vocabulary) { word in
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(word.french).font(.headline).foregroundStyle(OrrTheme.ink)
                                    Text(word.arabic).font(.subheadline).foregroundStyle(OrrTheme.muted)
                                    if !word.example.isEmpty {
                                        Text(word.example).font(.caption).foregroundStyle(OrrTheme.violet)
                                    }
                                }
                                Spacer()
                                Button { speak(word.french) } label: { Image(systemName: "speaker.wave.2.fill").padding(10).background(OrrTheme.lavender, in: Circle()) }
                                    .buttonStyle(.plain)
                            }.padding(13).background(.white, in: RoundedRectangle(cornerRadius: 15))
                        }
                    }

                    if !entry.questions.isEmpty {
                        Button { showQuiz = true } label: {
                            Label(app.language.text("takeQuiz") + " (\(entry.questions.count))", systemImage: "checkmark.circle.fill")
                                .font(.headline).frame(maxWidth: .infinity).padding(.vertical, 15)
                                .background(OrrTheme.hero, in: RoundedRectangle(cornerRadius: 17)).foregroundStyle(.white)
                        }.buttonStyle(.plain).padding(.top, 4)
                    }
                }.padding(17).padding(.bottom, 30)
            }
            .background(OrrTheme.canvas.ignoresSafeArea())
            .navigationTitle(app.language.text("lessonContent"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarTrailing) { Button(app.language.text("done")) { dismiss() } } }
            .sheet(isPresented: $showQuiz) {
                NativeQuizView(title: entry.title, questions: entry.questions)
                    .environmentObject(app)
            }
        }
    }

    private func speak(_ phrase: String) {
        let utterance = AVSpeechUtterance(string: phrase)
        utterance.voice = AVSpeechSynthesisVoice(language: "fr-FR")
        utterance.rate = 0.46
        SpeechServiceNative.synthesizer.stopSpeaking(at: .immediate)
        SpeechServiceNative.synthesizer.speak(utterance)
    }
}

private enum SpeechServiceNative {
    static let synthesizer = AVSpeechSynthesizer()
}

private enum CorrectionMode: String, CaseIterable, Identifiable {
    case afterEach, atEnd
    var id: String { rawValue }
}

struct NativeQuizView: View {
    @EnvironmentObject private var app: AppState
    @Environment(\.dismiss) private var dismiss
    let title: String
    let questions: [PracticeQuestion]
    @State private var correctionMode: CorrectionMode = .afterEach
    @State private var answers: [String: String] = [:]
    @State private var finished = false

    private var correctCount: Int {
        questions.filter { question in
            guard let answer = answers[question.id] else { return false }
            return question.accepts(answer)
        }.count
    }

    private var answeredCount: Int { answers.values.filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }.count }
    private var correctionsVisible: Bool { correctionMode == .afterEach || finished }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    VStack(alignment: .leading, spacing: 7) {
                        Text(title).font(.title2.bold()).foregroundStyle(OrrTheme.ink)
                        Text(app.language.text("correctionMode")).font(.subheadline).foregroundStyle(OrrTheme.muted)
                    }
                    Picker(app.language.text("correctionMode"), selection: $correctionMode) {
                        Text(app.language.text("afterEach")).tag(CorrectionMode.afterEach)
                        Text(app.language.text("atEnd")).tag(CorrectionMode.atEnd)
                    }.pickerStyle(.segmented).disabled(finished)

                    if finished {
                        OrrCard {
                            Text(app.language.text("quizResult")).font(.headline).foregroundStyle(OrrTheme.ink)
                            Text("\(correctCount) / \(questions.count)")
                                .font(.system(size: 38, weight: .bold, design: .rounded)).foregroundStyle(OrrTheme.violet)
                            ProgressView(value: Double(correctCount), total: Double(max(questions.count, 1))).tint(OrrTheme.violet)
                            Text("\(answeredCount) " + app.language.text("answered")).font(.caption).foregroundStyle(OrrTheme.muted)
                        }
                    }

                    ForEach(Array(questions.enumerated()), id: \.element.id) { index, question in
                        questionCard(question, number: index + 1)
                    }

                    if !finished {
                        Button {
                            app.recordQuiz(title: title, correct: correctCount, total: questions.count)
                            finished = true
                        } label: {
                            Text(app.language.text("finishQuiz"))
                                .font(.headline).frame(maxWidth: .infinity).padding(.vertical, 15)
                                .background(OrrTheme.hero, in: RoundedRectangle(cornerRadius: 16)).foregroundStyle(.white)
                        }.buttonStyle(.plain)
                    } else {
                        Button(app.language.text("done")) { dismiss() }
                            .font(.headline).frame(maxWidth: .infinity).padding(.vertical, 15)
                            .background(OrrTheme.violet, in: RoundedRectangle(cornerRadius: 16)).foregroundStyle(.white)
                            .buttonStyle(.plain)
                    }
                }.padding(17).padding(.bottom, 30)
            }
            .background(OrrTheme.canvas.ignoresSafeArea())
            .navigationTitle(app.language.text("quiz"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarTrailing) { Button(app.language.text("close")) { dismiss() } } }
        }
    }

    @ViewBuilder
    private func questionCard(_ question: PracticeQuestion, number: Int) -> some View {
        VStack(alignment: .leading, spacing: 11) {
            Text("\(number). \(question.prompt)").font(.headline).foregroundStyle(OrrTheme.ink).fixedSize(horizontal: false, vertical: true)
            if question.isMultipleChoice {
                ForEach(question.options, id: \.self) { option in
                    Button { if !finished { answers[question.id] = option } } label: {
                        HStack(spacing: 10) {
                            Image(systemName: answers[question.id] == option ? "largecircle.fill.circle" : "circle")
                                .foregroundStyle(answers[question.id] == option ? OrrTheme.violet : OrrTheme.muted)
                            Text(option).font(.subheadline).foregroundStyle(OrrTheme.ink).multilineTextAlignment(.leading)
                            Spacer(minLength: 0)
                        }.padding(11)
                            .background(answers[question.id] == option ? OrrTheme.lavender : OrrTheme.canvas, in: RoundedRectangle(cornerRadius: 12))
                    }.buttonStyle(.plain).disabled(finished)
                }
            } else {
                TextField(app.language.text("typeAnswer"), text: Binding(
                    get: { answers[question.id] ?? "" },
                    set: { answers[question.id] = $0 }
                ))
                .textInputAutocapitalization(.never).autocorrectionDisabled()
                .padding(12).background(OrrTheme.canvas, in: RoundedRectangle(cornerRadius: 13))
                .disabled(finished)
            }
            if correctionsVisible, let selected = answers[question.id], !selected.isEmpty {
                let correct = question.accepts(selected)
                Label(correct ? app.language.text("correct") : app.language.text("notQuite"),
                      systemImage: correct ? "checkmark.circle.fill" : "info.circle.fill")
                    .font(.subheadline.bold()).foregroundStyle(correct ? Color.green : OrrTheme.pink)
                if !correct || finished {
                    Text(app.language.text("answer") + ": " + question.answerText)
                        .font(.subheadline).foregroundStyle(OrrTheme.violet)
                }
                if !question.explanation.isEmpty {
                    Text(question.explanation).font(.caption).foregroundStyle(OrrTheme.muted).lineSpacing(3)
                }
            }
        }.padding(15).frame(maxWidth: .infinity, alignment: .leading)
            .background(.white, in: RoundedRectangle(cornerRadius: 19))
            .overlay(RoundedRectangle(cornerRadius: 19).stroke(OrrTheme.line, lineWidth: 1))
    }
}

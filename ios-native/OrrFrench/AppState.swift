import Foundation
import SwiftUI

struct VocabularyCard: Identifiable, Codable, Hashable {
    let id: String
    let french: String
    let arabic: String
    let english: String
    let example: String
    var reviewStage: Int = 0
    var dueAt: Date = .distantPast
    var reviewCount: Int = 0
}

struct StudyRecord: Identifiable, Codable {
    let id: UUID
    let completedAt: Date
    let minutes: Int
    let skill: String

    init(completedAt: Date = .now, minutes: Int, skill: String) {
        self.id = UUID()
        self.completedAt = completedAt
        self.minutes = minutes
        self.skill = skill
    }
}

enum StudySkill: String, CaseIterable, Identifiable {
    case vocabulary, grammar, listening, speaking, reading
    var id: String { rawValue }
    var copyKey: String {
        switch self {
        case .vocabulary: return "vocabSkill"
        case .grammar: return "grammarSkill"
        case .listening: return "listeningSkill"
        case .speaking: return "speakingSkill"
        case .reading: return "readingSkill"
        }
    }
    var symbol: String {
        switch self {
        case .vocabulary: return "character.book.closed.fill"
        case .grammar: return "text.book.closed.fill"
        case .listening: return "headphones"
        case .speaking: return "waveform"
        case .reading: return "book.fill"
        }
    }
}

struct QuizRecord: Identifiable, Codable {
    let id: UUID
    let completedAt: Date
    let title: String
    let correct: Int
    let total: Int

    init(completedAt: Date = .now, title: String, correct: Int, total: Int) {
        self.id = UUID()
        self.completedAt = completedAt
        self.title = title
        self.correct = correct
        self.total = total
    }
}

enum AppTab: Hashable {
    case home, course, study, progress, settings
}

@MainActor
final class AppState: ObservableObject {
    @Published var language: AppLanguage {
        didSet { UserDefaults.standard.set(language.rawValue, forKey: Self.languageKey) }
    }
    @Published var selectedTab: AppTab = .home
    @Published var libraryCategory: CourseCategory = .textbook
    @Published private(set) var vocabulary: [VocabularyCard]
    @Published private(set) var sessions: [StudyRecord]
    @Published private(set) var quizAttempts: [QuizRecord]
    @Published private(set) var dataVersion = 0

    private static let languageKey = "orr.native.language.v1"
    private static let wordsKey = "orr.native.vocabulary.v1"
    private static let sessionsKey = "orr.native.sessions.v1"
    private static let quizzesKey = "orr.native.quizzes.v1"

    init() {
        let savedLanguage = UserDefaults.standard.string(forKey: Self.languageKey) ?? AppLanguage.arabic.rawValue
        self.language = AppLanguage(rawValue: savedLanguage) ?? .arabic

        let savedWords: [VocabularyCard] = {
            guard let data = UserDefaults.standard.data(forKey: Self.wordsKey),
                  let decoded = try? JSONDecoder().decode([VocabularyCard].self, from: data) else { return [] }
            return decoded
        }()
        let importedWords = NativeCurriculumCatalog.shared.vocabulary.map {
            VocabularyCard(id: $0.id, french: $0.french, arabic: $0.arabic, english: $0.english, example: $0.example)
        }
        let baseWords = importedWords.isEmpty ? Self.seedVocabulary : importedWords
        let savedByID = Dictionary(savedWords.map { ($0.id, $0) }, uniquingKeysWith: { _, latest in latest })
        let baseIDs = Set(baseWords.map(\.id))
        self.vocabulary = baseWords.map { word in
            guard let saved = savedByID[word.id] else { return word }
            var updated = word
            updated.reviewStage = saved.reviewStage
            updated.dueAt = saved.dueAt
            updated.reviewCount = saved.reviewCount
            return updated
        } + savedWords.filter { !baseIDs.contains($0.id) }

        if let data = UserDefaults.standard.data(forKey: Self.sessionsKey),
           let saved = try? JSONDecoder().decode([StudyRecord].self, from: data) {
            self.sessions = saved
        } else {
            self.sessions = []
        }
        if let data = UserDefaults.standard.data(forKey: Self.quizzesKey),
           let saved = try? JSONDecoder().decode([QuizRecord].self, from: data) {
            self.quizAttempts = saved
        } else {
            self.quizAttempts = []
        }
        persistVocabulary()
    }

    var dueVocabulary: [VocabularyCard] {
        vocabulary.filter { $0.dueAt <= .now }.sorted { $0.dueAt < $1.dueAt }
    }

    var completedThisWeek: [StudyRecord] {
        let calendar = Calendar.current
        let start = calendar.dateInterval(of: .weekOfYear, for: .now)?.start ?? calendar.startOfDay(for: .now)
        return sessions.filter { $0.completedAt >= start }.sorted { $0.completedAt > $1.completedAt }
    }

    var minutesThisWeek: Int { completedThisWeek.reduce(0) { $0 + $1.minutes } }
    var points: Int { sessions.reduce(0) { $0 + ($1.minutes * 2) } + vocabulary.reduce(0) { $0 + ($1.reviewCount * 5) } + quizAttempts.reduce(0) { $0 + ($1.correct * 3) } }

    var streak: Int {
        let calendar = Calendar.current
        let activeDays = Set(sessions.map { calendar.startOfDay(for: $0.completedAt) })
        let today = calendar.startOfDay(for: .now)
        var cursor = activeDays.contains(today) ? today : (calendar.date(byAdding: .day, value: -1, to: today) ?? today)
        var count = 0
        while activeDays.contains(cursor) {
            count += 1
            guard let previous = calendar.date(byAdding: .day, value: -1, to: cursor) else { break }
            cursor = previous
        }
        return count
    }

    func recordSession(minutes: Int, skill: StudySkill) {
        guard minutes > 0 else { return }
        sessions.insert(StudyRecord(minutes: minutes, skill: skill.rawValue), at: 0)
        persistSessions()
        dataVersion += 1
    }

    func recordQuiz(title: String, correct: Int, total: Int) {
        guard total > 0 else { return }
        quizAttempts.insert(QuizRecord(title: title, correct: correct, total: total), at: 0)
        if quizAttempts.count > 200 { quizAttempts = Array(quizAttempts.prefix(200)) }
        guard let data = try? JSONEncoder().encode(quizAttempts) else { return }
        UserDefaults.standard.set(data, forKey: Self.quizzesKey)
        dataVersion += 1
    }

    func review(_ card: VocabularyCard, knewIt: Bool) {
        guard let index = vocabulary.firstIndex(where: { $0.id == card.id }) else { return }
        vocabulary[index].reviewCount += 1
        if knewIt {
            vocabulary[index].reviewStage = min(5, vocabulary[index].reviewStage + 1)
            let intervals = [1, 3, 7, 14, 30]
            let interval = intervals[min(vocabulary[index].reviewStage - 1, intervals.count - 1)]
            vocabulary[index].dueAt = Calendar.current.date(byAdding: .day, value: interval, to: .now) ?? .now.addingTimeInterval(Double(interval) * 86_400)
        } else {
            vocabulary[index].reviewStage = 0
            vocabulary[index].dueAt = .now.addingTimeInterval(10 * 60)
        }
        persistVocabulary()
        dataVersion += 1
    }

    private func persistVocabulary() {
        guard let data = try? JSONEncoder().encode(vocabulary) else { return }
        UserDefaults.standard.set(data, forKey: Self.wordsKey)
    }

    private func persistSessions() {
        guard let data = try? JSONEncoder().encode(sessions) else { return }
        UserDefaults.standard.set(data, forKey: Self.sessionsKey)
    }

    private static let seedVocabulary: [VocabularyCard] = [
        .init(id: "bonjour", french: "Bonjour", arabic: "مرحباً", english: "Hello", example: "Bonjour, comment allez-vous ?"),
        .init(id: "merci", french: "Merci", arabic: "شكراً", english: "Thank you", example: "Merci beaucoup pour votre aide."),
        .init(id: "au-revoir", french: "Au revoir", arabic: "إلى اللقاء", english: "Goodbye", example: "Au revoir et à demain."),
        .init(id: "sil-vous-plait", french: "S’il vous plaît", arabic: "من فضلك", english: "Please", example: "Un café, s’il vous plaît."),
        .init(id: "je-mappelle", french: "Je m’appelle…", arabic: "اسمي…", english: "My name is…", example: "Bonjour, je m’appelle Lina."),
        .init(id: "comment", french: "Comment ça va ?", arabic: "كيف الحال؟", english: "How are you?", example: "Salut ! Comment ça va ?"),
        .init(id: "oui", french: "Oui", arabic: "نعم", english: "Yes", example: "Oui, je comprends."),
        .init(id: "non", french: "Non", arabic: "لا", english: "No", example: "Non, merci."),
        .init(id: "famille", french: "La famille", arabic: "العائلة", english: "Family", example: "Ma famille habite à Nancy."),
        .init(id: "eau", french: "L’eau", arabic: "الماء", english: "Water", example: "Je voudrais de l’eau."),
        .init(id: "aujourdhui", french: "Aujourd’hui", arabic: "اليوم", english: "Today", example: "Aujourd’hui, j’étudie le français."),
        .init(id: "apprendre", french: "Apprendre", arabic: "يتعلّم", english: "To learn", example: "J’aime apprendre le français.")
    ]
}
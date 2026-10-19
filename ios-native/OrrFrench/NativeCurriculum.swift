import Foundation

struct NativeWord: Identifiable, Hashable {
    let id: String
    let french: String
    let arabic: String
    let english: String
    let example: String
}

struct CourseExample: Identifiable, Hashable {
    let id: String
    let french: String
    let arabic: String
}

struct CourseDay: Identifiable, Hashable {
    let id: String
    let title: String
    let task: String
    let explanation: String
    let examples: [CourseExample]
}

struct PracticeQuestion: Identifiable, Hashable {
    let id: String
    let prompt: String
    let options: [String]
    let answerText: String
    let acceptedAnswers: [String]
    let explanation: String

    var isMultipleChoice: Bool { !options.isEmpty }

    func accepts(_ input: String) -> Bool {
        let normalized = input.trimmingCharacters(in: .whitespacesAndNewlines)
            .folding(options: [.caseInsensitive, .diacriticInsensitive], locale: Locale(identifier: "fr_FR"))
        let answers = ([answerText] + acceptedAnswers).map {
            $0.trimmingCharacters(in: .whitespacesAndNewlines)
                .folding(options: [.caseInsensitive, .diacriticInsensitive], locale: Locale(identifier: "fr_FR"))
        }
        return !normalized.isEmpty && answers.contains(normalized)
    }
}

enum CourseCategory: String, CaseIterable, Identifiable {
    case textbook, roadmap, citizenship
    var id: String { rawValue }
}

struct CourseEntry: Identifiable {
    let id: String
    let category: CourseCategory
    let level: String
    let title: String
    let subtitle: String
    let description: String
    let grammar: String
    let task: String
    let days: [CourseDay]
    let questions: [PracticeQuestion]
    let vocabulary: [NativeWord]
}

struct NativeCurriculumCatalog {
    static let shared = load()

    let textbook: [CourseEntry]
    let roadmap: [CourseEntry]
    let citizenship: [CourseEntry]
    let vocabulary: [NativeWord]

    private static func load() -> NativeCurriculumCatalog {
        guard let url = Bundle.main.url(forResource: "NativeCurriculum", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let root = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else {
            return NativeCurriculumCatalog(textbook: [], roadmap: [], citizenship: [], vocabulary: [])
        }

        let units = root["bookUnits"] as? [[String: Any]] ?? []
        let roadmapMonths = root["roadmapMonths"] as? [[Any]] ?? []
        let citizenshipModules = root["citizenshipTrack"] as? [[String: Any]] ?? []
        let vocabularyRows = root["additionalVocabulary"] as? [[String: Any]] ?? []

        let textbook: [CourseEntry] = units.map { unit in
            let number = intValue(unit["u"]) ?? 0
            let name = string(unit["name"])
            let days = (unit["days"] as? [[String: Any]] ?? []).enumerated().map { index, day in
                CourseDay(
                    id: "book-\(number)-day-\(index + 1)",
                    title: string(day["title"]),
                    task: string(day["task"]),
                    explanation: string(day["explanation"]),
                    examples: examples(day["examples"] as? [[String: Any]] ?? [])
                )
            }
            let practice = unit["practice"] as? [String: Any] ?? [:]
            let questions = questions(from: practice["quiz"] as? [[String: Any]] ?? [], prefix: "book-\(number)-quiz")
                + fillQuestions(from: practice["fill"] as? [[String: Any]] ?? [], prefix: "book-\(number)-fill")
            let vocab = (practice["match"] as? [[String: Any]] ?? []).compactMap { row -> NativeWord? in
                guard let fr = row["fr"] as? String, let ar = row["ar"] as? String else { return nil }
                return NativeWord(id: "match-\(number)-\(fr)", french: fr, arabic: ar, english: "", example: "")
            }
            return CourseEntry(
                id: "book-\(number)", category: .textbook, level: "A1",
                title: name, subtitle: "Unité \(number) · \(days.count) leçons",
                description: string(unit["focus"]), grammar: string(unit["grammar"]),
                task: string(unit["sequence"] as? [String: Any]? ?? [:], key: "learningFocus"),
                days: days, questions: questions, vocabulary: vocab
            )
        }

        var roadmap: [CourseEntry] = []
        for month in roadmapMonths {
            guard month.count > 4 else { continue }
            let monthNumber = intValue(month[0]) ?? 0
            let level = month[1] as? String ?? "A2–B2"
            let monthTitle = month[2] as? String ?? "Roadmap"
            let monthPurpose = month[3] as? String ?? ""
            let topics = month[4] as? [[Any]] ?? []
            for (topicIndex, topic) in topics.enumerated() {
                guard topic.count >= 4 else { continue }
                let title = topic[0] as? String ?? "Learning topic"
                let description = topic[1] as? String ?? ""
                let task = topic[2] as? String ?? ""
                let detail = topic[3] as? [String: Any] ?? [:]
                let detailVocab = (detail["vocab"] as? [[String: Any]] ?? []).compactMap { row -> NativeWord? in
                    guard let fr = row["fr"] as? String else { return nil }
                    return NativeWord(id: "road-\(monthNumber)-\(topicIndex)-\(fr)", french: fr,
                                      arabic: row["ar"] as? String ?? "", english: "",
                                      example: row["example"] as? String ?? "")
                }
                roadmap.append(CourseEntry(
                    id: "roadmap-\(monthNumber)-\(topicIndex + 1)", category: .roadmap, level: level,
                    title: title, subtitle: "\(monthTitle) · Mois \(monthNumber)",
                    description: description + (monthPurpose.isEmpty ? "" : "\n\n\(monthPurpose)"),
                    grammar: string(detail["grammar"]), task: task, days: roadmapDays(detail),
                    questions: questions(from: detail["quiz"] as? [[String: Any]] ?? [], prefix: "road-\(monthNumber)-\(topicIndex)"),
                    vocabulary: detailVocab
                ))
            }
        }

        let citizenship: [CourseEntry] = citizenshipModules.map { item in
            let n = intValue(item["n"]) ?? 0
            let title = string(item["title"])
            let vocab = (item["vocab"] as? [[String: Any]] ?? []).compactMap { row -> NativeWord? in
                guard let fr = row["fr"] as? String else { return nil }
                return NativeWord(id: "citizen-\(n)-\(fr)", french: fr, arabic: row["ar"] as? String ?? "",
                                  english: "", example: row["example"] as? String ?? "")
            }
            let dialogueExamples = examples(item["phrases"] as? [[String: Any]] ?? [])
            let days = [CourseDay(id: "citizen-\(n)-overview", title: "مقدمة الوحدة",
                                  task: string(item["task"]), explanation: string(item["introduction"]),
                                  examples: dialogueExamples)]
            return CourseEntry(
                id: "citizenship-\(n)", category: .citizenship, level: string(item["level"]),
                title: title, subtitle: string(item["theme"]), description: string(item["objective"]),
                grammar: string(item["grammar"]), task: string(item["task"]), days: days,
                questions: questions(from: item["quiz"] as? [[String: Any]] ?? [], prefix: "citizen-\(n)"),
                vocabulary: vocab
            )
        }

        let vocabulary = vocabularyRows.compactMap { row -> NativeWord? in
            guard let fr = row["fr"] as? String, !fr.isEmpty else { return nil }
            return NativeWord(id: row["id"] as? String ?? fr, french: fr, arabic: row["ar"] as? String ?? "",
                              english: row["en"] as? String ?? "", example: row["example"] as? String ?? "")
        }
        return NativeCurriculumCatalog(textbook: textbook, roadmap: roadmap, citizenship: citizenship, vocabulary: vocabulary)
    }

    private static func roadmapDays(_ detail: [String: Any]) -> [CourseDay] {
        let sessions = detail["sessions"] as? [[String: Any]] ?? []
        return sessions.enumerated().map { index, session in
            CourseDay(id: "session-\(index)", title: string(session["title"]),
                      task: string(session["output"]), explanation: string(session["instructions"]),
                      examples: examples((session["examples"] as? [[String: Any]]) ?? []))
        }
    }

    private static func questions(from rows: [[String: Any]], prefix: String) -> [PracticeQuestion] {
        rows.enumerated().compactMap { index, row in
            let prompt = (row["q"] as? String) ?? (row["prompt"] as? String) ?? ""
            guard !prompt.isEmpty else { return nil }
            let options = row["options"] as? [String] ?? []
            let answer = intValue(row["answer"])
            let answerText = (row["answer"] as? String) ?? ((answer != nil && options.indices.contains(answer!)) ? options[answer!] : "")
            let accepted = (row["accepted"] as? [String]) ?? []
            return PracticeQuestion(id: "\(prefix)-\(index)", prompt: prompt, options: options,
                                    answerText: answerText, acceptedAnswers: accepted,
                                    explanation: string(row["why"]))
        }
    }

    private static func fillQuestions(from rows: [[String: Any]], prefix: String) -> [PracticeQuestion] {
        rows.enumerated().compactMap { index, row in
            let prompt = string(row["prompt"])
            guard !prompt.isEmpty else { return nil }
            let answer = string(row["answer"])
            let accepted = (row["accepted"] as? [String]) ?? []
            return PracticeQuestion(id: "\(prefix)-\(index)", prompt: prompt, options: [],
                                    answerText: answer, acceptedAnswers: accepted,
                                    explanation: string(row["why"] ?? row["hint"]))
        }
    }

    private static func examples(_ rows: [[String: Any]]) -> [CourseExample] {
        rows.enumerated().compactMap { index, row in
            guard let fr = row["fr"] as? String else { return nil }
            let ar = (row["ar"] as? String) ?? (row["translation"] as? String) ?? ""
            return CourseExample(id: "\(index)-\(fr)", french: fr, arabic: ar)
        }
    }

    private static func string(_ value: Any?) -> String { value as? String ?? "" }
    private static func string(_ value: [String: Any], key: String) -> String { value[key] as? String ?? "" }
    private static func intValue(_ value: Any?) -> Int? {
        if let value = value as? Int { return value }
        if let value = value as? NSNumber { return value.intValue }
        return nil
    }
}

import Foundation

enum AppLanguage: String, CaseIterable, Identifiable, Codable {
    case arabic = "ar"
    case english = "en"
    case french = "fr"

    var id: String { rawValue }
    var isRightToLeft: Bool { self == .arabic }

    var displayName: String {
        switch self {
        case .arabic: return "العربية"
        case .english: return "English"
        case .french: return "Français"
        }
    }

    func text(_ key: String) -> String {
        AppCopy.values[key]?[self] ?? key
    }
}

private enum AppCopy {
    static let values: [String: [AppLanguage: String]] = [
        "appTitle": [.arabic: "أور الفرنسية", .english: "Orr French", .french: "Orr Français"],
        "greeting": [.arabic: "أهلاً بك في رحلتك الفرنسية", .english: "Welcome to your French journey", .french: "Bienvenue dans votre parcours de français"],
        "tagline": [.arabic: "تقدّم بخطوات صغيرة كل يوم", .english: "Make progress in small steps every day", .french: "Progressez un peu chaque jour"],
        "home": [.arabic: "الرئيسية", .english: "Home", .french: "Accueil"],
        "vocabulary": [.arabic: "المفردات", .english: "Vocabulary", .french: "Vocabulaire"],
        "study": [.arabic: "جلسة دراسة", .english: "Study", .french: "Étudier"],
        "progress": [.arabic: "التقدّم", .english: "Progress", .french: "Progrès"],
        "account": [.arabic: "الإعدادات", .english: "Settings", .french: "Réglages"],
        "streak": [.arabic: "أيام متتالية", .english: "Day streak", .french: "Jours consécutifs"],
        "points": [.arabic: "نقاط التعلّم", .english: "Learning points", .french: "Points d’apprentissage"],
        "weeklyGoal": [.arabic: "الهدف الأسبوعي", .english: "Weekly goal", .french: "Objectif hebdomadaire"],
        "weeklyHours": [.arabic: "8 ساعات أسبوعياً", .english: "8 hours a week", .french: "8 heures par semaine"],
        "minutesRemaining": [.arabic: "دقيقة منجزة من 480", .english: "minutes completed of 480", .french: "minutes effectuées sur 480"],
        "todayLesson": [.arabic: "درس اليوم", .english: "Today's lesson", .french: "Leçon du jour"],
        "lessonTitle": [.arabic: "التعارف وتقديم النفس", .english: "Introductions and greetings", .french: "Se présenter et saluer"],
        "lessonDescription": [.arabic: "تدرّب على التحية والتعريف بنفسك باللغة الفرنسية.", .english: "Practice greetings and introducing yourself in French.", .french: "Entraînez-vous à saluer et à vous présenter en français."],
        "continueLesson": [.arabic: "متابعة التعلّم", .english: "Continue learning", .french: "Continuer"],
        "startSession": [.arabic: "ابدأ جلسة الدراسة", .english: "Start a study session", .french: "Commencer une séance"],
        "chooseSkill": [.arabic: "اختر مهارة التدريب", .english: "Choose a study focus", .french: "Choisissez une compétence"],
        "duration": [.arabic: "مدة الجلسة", .english: "Session length", .french: "Durée de la séance"],
        "minutes": [.arabic: "دقيقة", .english: "min", .french: "min"],
        "vocabSkill": [.arabic: "المفردات", .english: "Vocabulary", .french: "Vocabulaire"],
        "grammarSkill": [.arabic: "القواعد", .english: "Grammar", .french: "Grammaire"],
        "listeningSkill": [.arabic: "الاستماع", .english: "Listening", .french: "Écoute"],
        "speakingSkill": [.arabic: "التحدث", .english: "Speaking", .french: "Expression orale"],
        "readingSkill": [.arabic: "القراءة", .english: "Reading", .french: "Lecture"],
        "beginTimer": [.arabic: "ابدأ المؤقت", .english: "Start timer", .french: "Lancer le minuteur"],
        "pause": [.arabic: "إيقاف مؤقت", .english: "Pause", .french: "Pause"],
        "resume": [.arabic: "استئناف", .english: "Resume", .french: "Reprendre"],
        "finishSave": [.arabic: "إنهاء الجلسة وحفظها", .english: "Finish and save session", .french: "Terminer et enregistrer"],
        "sessionFinished": [.arabic: "أحسنت! اكتملت الجلسة", .english: "Well done! Session complete", .french: "Bravo ! Séance terminée"],
        "done": [.arabic: "تم", .english: "Done", .french: "Terminé"],
        "dueReview": [.arabic: "بطاقات للمراجعة", .english: "Cards due", .french: "Cartes à réviser"],
        "frenchAudio": [.arabic: "استمع إلى النطق", .english: "Listen to pronunciation", .french: "Écouter la prononciation"],
        "reveal": [.arabic: "إظهار المعنى", .english: "Reveal meaning", .french: "Afficher le sens"],
        "knewIt": [.arabic: "عرفتها", .english: "I knew it", .french: "Je la connaissais"],
        "reviewAgain": [.arabic: "أحتاج إلى مراجعتها", .english: "Review again", .french: "À revoir"],
        "allCaughtUp": [.arabic: "أحسنت! لا توجد بطاقات مستحقة الآن.", .english: "All caught up! No cards are due right now.", .french: "Bravo ! Aucune carte à réviser pour le moment."],
        "reviewHint": [.arabic: "حاول تذكّر المعنى قبل كشف الإجابة.", .english: "Try to remember the meaning before revealing it.", .french: "Essayez de retrouver le sens avant de révéler la réponse."],
        "thisWeek": [.arabic: "هذا الأسبوع", .english: "This week", .french: "Cette semaine"],
        "sessionsCompleted": [.arabic: "جلسات مكتملة", .english: "Sessions completed", .french: "Séances terminées"],
        "minutesStudied": [.arabic: "دقائق الدراسة", .english: "Minutes studied", .french: "Minutes étudiées"],
        "recentSessions": [.arabic: "الجلسات الأخيرة", .english: "Recent sessions", .french: "Séances récentes"],
        "noSessions": [.arabic: "ابدأ أول جلسة لتظهر هنا.", .english: "Start your first session to see it here.", .french: "Commencez votre première séance pour la voir ici."],
        "language": [.arabic: "لغة التطبيق", .english: "App language", .french: "Langue de l’application"],
        "nativeApp": [.arabic: "تطبيق آيفون أصلي", .english: "Native iPhone app", .french: "Application iPhone native"],
        "nativeNote": [.arabic: "هذه النسخة تستخدم واجهات iOS الأصلية وتحفظ تقدّمك على هذا الجهاز. ربط الحساب والمزامنة السحابية ونقل المنهج الكامل ستُضاف وتُختبر في مراحل لاحقة.", .english: "This build uses native iOS screens and saves progress on this device. Account sign-in, cloud sync, and the complete curriculum migration will be added and tested in later phases.", .french: "Cette version utilise des écrans iOS natifs et enregistre la progression sur cet appareil. La connexion, la synchronisation cloud et la migration du programme complet seront ajoutées et testées dans les prochaines étapes."],
        "about": [.arabic: "عن أور", .english: "About Orr", .french: "À propos d’Orr"],
        "level": [.arabic: "المسار التعليمي", .english: "Learning pathway", .french: "Parcours d’apprentissage"],
        "levelDetail": [.arabic: "من A1 إلى B2", .english: "A1 to B2", .french: "De A1 à B2"],
        "reviewSaved": [.arabic: "حُفظت المراجعة", .english: "Review saved", .french: "Révision enregistrée"],
        "example": [.arabic: "مثال", .english: "Example", .french: "Exemple"],
        "answer": [.arabic: "الإجابة", .english: "Answer", .french: "Réponse"],
        "availableCards": [.arabic: "بطاقات متاحة", .english: "Available cards", .french: "Cartes disponibles"],
        "dayShort": [.arabic: "يوم", .english: "day", .french: "jour"]
    ]
}
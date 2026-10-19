import SwiftUI
import AVFoundation
import Combine

struct SpeakingPromptOption: Identifiable, Hashable {
    let id: String
    let level: String
    let title: String
    let prompt: String

    static let all: [SpeakingPromptOption] = {
        let catalog = NativeCurriculumCatalog.shared
        let fromCitizenship = catalog.citizenship.map {
            SpeakingPromptOption(id: $0.id, level: $0.level, title: $0.title, prompt: $0.task.isEmpty ? $0.description : $0.task)
        }
        let fromRoadmap = catalog.roadmap.map {
            SpeakingPromptOption(id: $0.id, level: $0.level, title: $0.title, prompt: $0.task.isEmpty ? $0.description : $0.task)
        }
        let content = (fromCitizenship + fromRoadmap).filter { !$0.prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
        return content.isEmpty ? [
            SpeakingPromptOption(id: "a1-introduction", level: "A1", title: "التعريف بالنفس", prompt: "قدّم نفسك بالفرنسية لمدة دقيقة، واذكر اسمك وأصلك ومكان سكنك وسبب تعلمك الفرنسية.")
        ] : content
    }()
}

@MainActor
final class NativeAudioRecorder: ObservableObject {
    @Published private(set) var isRecording = false
    @Published private(set) var duration: TimeInterval = 0
    @Published private(set) var fileURL: URL?
    @Published private(set) var message = ""
    @Published private(set) var isBusy = false

    private var recorder: AVAudioRecorder?

    func startRecording() async {
        guard !isRecording, !isBusy else { return }
        isBusy = true
        defer { isBusy = false }
        let granted: Bool = await withCheckedContinuation { continuation in
            AVAudioSession.sharedInstance().requestRecordPermission { allowed in
                continuation.resume(returning: allowed)
            }
        }
        guard granted else {
            message = "لم يُمنح إذن الميكروفون. فعّله من إعدادات الخصوصية في الجهاز."
            return
        }
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playAndRecord, mode: .spokenAudio, options: [.defaultToSpeaker, .allowBluetooth])
            try audioSession.setActive(true)
            let url = FileManager.default.temporaryDirectory
                .appendingPathComponent("orr-speaking-\(UUID().uuidString).m4a")
            let settings: [String: Any] = [
                AVFormatIDKey: kAudioFormatMPEG4AAC,
                AVSampleRateKey: 44_100,
                AVNumberOfChannelsKey: 1,
                AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
            ]
            let next = try AVAudioRecorder(url: url, settings: settings)
            next.delegate = nil
            next.isMeteringEnabled = true
            guard next.record() else {
                throw NSError(domain: "OrrSpeaking", code: -2, userInfo: [NSLocalizedDescriptionKey: "تعذّر بدء التسجيل الصوتي."])
            }
            recorder = next
            fileURL = url
            duration = 0
            message = "بدأ التسجيل. تحدث بالفرنسية بوضوح، ويمكنك الإيقاف خلال خمس دقائق."
            isRecording = true
        } catch {
            message = error.localizedDescription
            try? AVAudioSession.sharedInstance().setActive(false)
        }
    }

    func refreshDuration() {
        guard isRecording, let recorder else { return }
        duration = min(recorder.currentTime, 300)
        if duration >= 300 {
            stopRecording()
            message = "وصل التسجيل إلى الحد الأقصى وهو خمس دقائق."
        }
    }

    func stopRecording() {
        guard isRecording else { return }
        duration = min(recorder?.currentTime ?? duration, 300)
        recorder?.stop()
        recorder = nil
        isRecording = false
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        message = duration > 0 ? "اكتمل التسجيل. استمع إلى المدة، ثم أرسل الإجابة للمراجعة." : "لم تُحفظ مدة تسجيل. أعد المحاولة."
    }

    func clearRecording() {
        if isRecording { stopRecording() }
        if let fileURL { try? FileManager.default.removeItem(at: fileURL) }
        fileURL = nil
        duration = 0
        message = ""
    }
}

struct SpeakingSubmissionSheet: View {
    @EnvironmentObject private var app: AppState
    @EnvironmentObject private var auth: NativeAuthStore
    @Environment(\.dismiss) private var dismiss
    @StateObject private var recorder = NativeAudioRecorder()
    @State private var selectedPromptID = SpeakingPromptOption.all.first?.id ?? "a1-introduction"
    @State private var isSubmitting = false
    @State private var submitted = false
    @State private var localError = ""
    private let ticker = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    private var chosenPrompt: SpeakingPromptOption {
        SpeakingPromptOption.all.first(where: { $0.id == selectedPromptID }) ?? SpeakingPromptOption.all[0]
    }

    private var durationLabel: String {
        let seconds = Int(recorder.duration)
        return String(format: "%02d:%02d", seconds / 60, seconds % 60)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    SectionHeading(title: app.language.text("speakingSubmission"),
                                   subtitle: app.language.text("speakingSubmissionHint"))

                    OrrCard {
                        Text(app.language.text("chooseSpeakingTask")).font(.headline).foregroundStyle(OrrTheme.ink)
                        Picker(app.language.text("chooseSpeakingTask"), selection: $selectedPromptID) {
                            ForEach(SpeakingPromptOption.all) { option in
                                Text("\(option.level) · \(option.title)").tag(option.id)
                            }
                        }
                        .pickerStyle(.menu)
                        .tint(OrrTheme.violet)
                        Divider().padding(.vertical, 4)
                        Text(chosenPrompt.prompt).font(.body).foregroundStyle(OrrTheme.ink).lineSpacing(4)
                        Text(chosenPrompt.level).font(.caption.bold()).foregroundStyle(OrrTheme.violet)
                            .padding(.horizontal, 10).padding(.vertical, 6)
                            .background(OrrTheme.lavender, in: Capsule())
                    }

                    OrrCard {
                        HStack {
                            Image(systemName: recorder.isRecording ? "waveform" : "mic.fill")
                                .font(.system(size: 28)).foregroundStyle(recorder.isRecording ? OrrTheme.pink : OrrTheme.violet)
                                .frame(width: 58, height: 58).background(OrrTheme.pastel, in: RoundedRectangle(cornerRadius: 18))
                            VStack(alignment: .leading, spacing: 5) {
                                Text(recorder.isRecording ? app.language.text("recordingInProgress") : app.language.text("speakingRecording"))
                                    .font(.headline).foregroundStyle(OrrTheme.ink)
                                Text(durationLabel).font(.system(size: 25, weight: .bold, design: .rounded).monospacedDigit())
                                    .foregroundStyle(OrrTheme.violet)
                            }
                            Spacer()
                            if recorder.isRecording {
                                Circle().fill(OrrTheme.pink).frame(width: 10, height: 10)
                            }
                        }

                        if recorder.isRecording {
                            Button {
                                recorder.stopRecording()
                            } label: {
                                Label(app.language.text("stopRecording"), systemImage: "stop.fill")
                                    .font(.headline).frame(maxWidth: .infinity).padding(.vertical, 14)
                                    .background(OrrTheme.pink, in: RoundedRectangle(cornerRadius: 15)).foregroundStyle(.white)
                            }.buttonStyle(.plain)
                        } else if recorder.fileURL == nil {
                            Button {
                                Task { await recorder.startRecording() }
                            } label: {
                                HStack {
                                    if recorder.isBusy { ProgressView().tint(.white) }
                                    Label(app.language.text("startRecording"), systemImage: "mic.fill")
                                }
                                .font(.headline).frame(maxWidth: .infinity).padding(.vertical, 14)
                                .background(OrrTheme.hero, in: RoundedRectangle(cornerRadius: 15)).foregroundStyle(.white)
                            }.buttonStyle(.plain).disabled(recorder.isBusy)
                        } else {
                            Label(app.language.text("recordingReady"), systemImage: "checkmark.circle.fill")
                                .font(.subheadline.bold()).foregroundStyle(OrrTheme.violet)
                            Button {
                                recorder.clearRecording()
                            } label: {
                                Label(app.language.text("recordAgain"), systemImage: "arrow.clockwise")
                                    .font(.subheadline.bold()).frame(maxWidth: .infinity).padding(.vertical, 12)
                                    .background(OrrTheme.lavender, in: RoundedRectangle(cornerRadius: 14)).foregroundStyle(OrrTheme.violet)
                            }.buttonStyle(.plain)
                        }
                    }

                    if auth.session == nil {
                        OrrCard {
                            Label(app.language.text("loginNeededForSpeaking"), systemImage: "person.crop.circle.badge.exclamationmark")
                                .font(.subheadline).foregroundStyle(OrrTheme.pink)
                            Text(app.language.text("authHint")).font(.caption).foregroundStyle(OrrTheme.muted)
                            Button(app.language.text("accountCloud")) { dismiss(); app.selectedTab = .settings }
                                .font(.subheadline.bold()).padding(.top, 4)
                        }
                    } else if let fileURL = recorder.fileURL, !recorder.isRecording, recorder.duration > 0 {
                        Button {
                            Task {
                                isSubmitting = true
                                localError = ""
                                do {
                                    try await auth.submitSpeakingRecording(
                                        fileURL: fileURL,
                                        assessmentKey: chosenPrompt.id,
                                        prompt: chosenPrompt.prompt,
                                        durationSeconds: recorder.duration
                                    )
                                    submitted = true
                                    recorder.clearRecording()
                                    auth.setStatus(app.language.text("speakingSubmitted"))
                                } catch {
                                    localError = error.localizedDescription
                                }
                                isSubmitting = false
                            }
                        } label: {
                            HStack {
                                if isSubmitting { ProgressView().tint(.white) }
                                Label(app.language.text("submitSpeaking"), systemImage: "arrow.up.circle.fill")
                            }
                            .font(.headline).frame(maxWidth: .infinity).padding(.vertical, 15)
                            .background(OrrTheme.violet, in: RoundedRectangle(cornerRadius: 16)).foregroundStyle(.white)
                        }.buttonStyle(.plain).disabled(isSubmitting)
                    }

                    if !recorder.message.isEmpty {
                        Text(recorder.message).font(.caption).foregroundStyle(OrrTheme.muted).lineSpacing(3)
                    }
                    if !localError.isEmpty {
                        Text(localError).font(.caption).foregroundStyle(OrrTheme.pink).textSelection(.enabled)
                    }
                    if submitted {
                        OrrCard {
                            Label(app.language.text("speakingSubmitted"), systemImage: "checkmark.seal.fill")
                                .font(.headline).foregroundStyle(OrrTheme.violet)
                            Button(app.language.text("done")) { dismiss() }
                                .font(.subheadline.bold()).padding(.top, 4)
                        }
                    }
                    Text(app.language.text("speakingPrivacyNote"))
                        .font(.caption).foregroundStyle(OrrTheme.muted).lineSpacing(4)
                }
                .padding(17).padding(.bottom, 30)
            }
            .background(OrrTheme.canvas.ignoresSafeArea())
            .navigationTitle(app.language.text("speakingSubmission"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(app.language.text("close")) {
                        recorder.clearRecording()
                        dismiss()
                    }
                }
            }
            .onReceive(ticker) { _ in recorder.refreshDuration() }
            .environment(\.layoutDirection, app.language.isRightToLeft ? .rightToLeft : .leftToRight)
        }
    }
}

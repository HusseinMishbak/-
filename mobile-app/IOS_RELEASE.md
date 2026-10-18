# iPhone release checklist — Orr French

## Current build target

The repository builds an iOS Simulator app in GitHub Actions. The simulator artifact is useful for checking layout and navigation, but it is not signed for installation on a physical iPhone and is not an App Store release.

## Before testing on a real iPhone

1. Open the generated Xcode project on a Mac with a supported Xcode version.
2. Select the `App` target and set the correct Apple Developer Team and a unique Bundle Identifier. The current identifier is `com.husseinmishbak.orrfrench`.
3. Confirm the app display name is `أور الفرنسية` and inspect the generated icon and launch screen.
4. Build to a real iPhone, then test the microphone permission prompt and a complete speaking-recording flow.
5. Verify student registration, sign-in, email confirmation, password reset, quiz scoring, cloud progress, and sign-out.

## Supabase authentication

The web app currently uses the hosted site as its authentication redirect. For the first mobile test, verify confirmation and password-reset links on an actual device and return to the app to sign in. A polished production release should add verified iOS Universal Links or a registered custom URL scheme, handle the native app-open callback, and allowlist the exact redirect URI in Supabase Auth settings. Do not change the production redirect until the corresponding iOS callback and Supabase allowlist are ready.

## Privacy and App Store readiness

- Publish a privacy policy that explains account data, learning progress, recordings, retention, and deletion/contact procedures.
- Complete App Store Connect privacy disclosures to match actual data flows and any third-party services.
- The microphone permission purpose is configured in the build script; ensure the app only asks for microphone access when a learner chooses a speaking/recording activity.
- Confirm that recordings and student progress are protected by Supabase Row Level Security and private Storage policies.
- Test VoiceOver, Dynamic Type, RTL Arabic layout, French and English interface modes, dark/light device settings, keyboard resizing, rotation on iPad, and small-screen overflow.
- Verify all required app icons and launch-screen assets in Xcode. Review the app's age rating, support URL, marketing text, screenshots, and export-compliance answers before submission.
- Use TestFlight for a real-device beta. A simulator artifact alone is not suitable for distribution to learners.

## Recommended device acceptance tests

| Area | Pass condition |
|---|---|
| Launch and navigation | Opens reliably; bottom tabs switch to the intended learning sections |
| Language switching | Arabic, English, and French labels and layout direction update together |
| Audio | French playback works; recording requests permission only after user action |
| Assessments | Per-question feedback and whole-test correction behave as configured in the platform |
| Authentication | Existing account can sign in; email/reset links return to a usable flow |
| Sync | Progress persists after closing/reopening and signing in on another device |
| Network failure | Cached shell can open; online-only auth and cloud sync show honest connection errors |
| Accessibility | VoiceOver labels are meaningful and controls have adequate touch targets |

# iPhone App Store release — UR / Orr French

## Current state

The repository includes a Capacitor 8 mobile project and an iOS Simulator build workflow. A simulator .app artifact is not a signed iPhone app and is not an App Store release. The App Store/TestFlight workflow added in this branch requires signing credentials owned by the app publisher.

## Phase A — simulator build

The Build iOS simulator app workflow creates a simulator build. Open GitHub, then Actions, then Build iOS simulator app to inspect its status and download the artifact. A simulator app is useful for QA but cannot be installed on a physical iPhone.

## Phase B — Apple account and app record

1. Enroll the publisher in the Apple Developer Program (currently USD 99/year, with local pricing shown by Apple): https://developer.apple.com/programs/
2. In Certificates, Identifiers & Profiles, register the explicit Bundle ID: com.husseinmishbak.orrfrench.
3. Create an Apple Distribution certificate and export the certificate and private key together as a password-protected P12 file.
4. Create an App Store Connect distribution provisioning profile for the same Bundle ID and the distribution certificate.
5. In App Store Connect, create an app record using the same Bundle ID. Name suggestion: أور الفرنسية; English display name: Orr French. The name is subject to availability.
6. Create an App Store Connect Team API key with permission to upload builds. Download the P8 private key immediately; Apple does not let you download that same key again after leaving the page.

## Phase C — add repository secrets safely

In GitHub → Repository Settings → Secrets and variables → Actions, add these repository secrets. Never paste certificates or API private keys into chat, commits, source files, issues or logs.

| Secret | Value |
|---|---|
| APPLE_TEAM_ID | The Team ID shown in your Apple Developer membership |
| IOS_CERTIFICATE_P12_BASE64 | Base64 encoding of the password-protected Apple Distribution P12 file |
| IOS_CERTIFICATE_PASSWORD | The password used when exporting that P12 file |
| IOS_PROVISIONING_PROFILE_BASE64 | Base64 encoding of the App Store provisioning profile |
| APP_STORE_CONNECT_KEY_ID | Key ID shown when you create the Team API key |
| APP_STORE_CONNECT_ISSUER_ID | Issuer ID shown in App Store Connect |
| APP_STORE_CONNECT_API_KEY_P8 | Full text of the downloaded P8 private key |

Run Build and upload iOS to TestFlight from GitHub → Actions. With all secrets set, it builds a signed IPA and uploads it to TestFlight. The workflow is manual to avoid publishing a build unexpectedly.

## Phase D — TestFlight and App Store review

1. Wait for Apple to process the uploaded build in App Store Connect.
2. Install the build through TestFlight on a real iPhone. Test account creation, login, confirmation/password reset, audio recording, both assessment correction modes, Arabic feedback, and cloud sync after relaunch.
3. Add the public privacy policy URL: https://husseinmishbak.github.io/-/privacy.html. The policy is available in Arabic, English and French.
4. Add a support URL such as https://github.com/HusseinMishbak/-/issues, category, age rating, localizations, App Store icon, screenshots, description and review notes. Supply a working demo account to App Review if sign-in is required to review the main features.
5. Declare data practices in App Store Connect to match the app, including account identifiers, study progress and submitted recordings. Apple requires a public privacy policy and accurate privacy disclosures.
6. Submit the build for App Review. TestFlight upload is not the same as public App Store approval.

## Authentication note

The web app currently sends email confirmation and password-reset callbacks to its hosted website. Verify those flows from TestFlight on an actual iPhone. Before broad public release, implement a verified Universal Link or registered custom URL scheme and allowlist it in Supabase Auth without breaking web sign-in.

## Review-quality note

Apple's 4.2 guideline expects useful, app-like functionality beyond a wrapped website. This project includes local lesson assets, interactive tests, vocabulary review, speaking recording and phone-specific navigation, but Apple decides acceptance during review. Complete device testing and fix issues before submitting.

# UR French Learning — Version 2 installation

## What Version 2 adds first

- An installable Progressive Web App (PWA) using the existing GitHub Pages site.
- A cached application shell for quicker repeat launches and limited offline access.
- Cloud sync for the learning dashboard (study minutes, streak, XP, spaced-review state) through the existing signed-in Supabase account.
- The existing lesson progress, quiz grading and Arabic feedback remain on their current data path.

## Deploy and enable cross-device progress

1. Merge the Version 2 branch/pull request into `main` and wait for GitHub Pages to publish the change.
2. Open the Supabase project used by the site, select **SQL Editor**, create a new query, paste the contents of `supabase/upgrade-v2.sql`, and run it once.
3. Open the live site online and sign in. Existing lesson/quiz cloud sync continues to use the current `student_progress` schema; the migration adds the separate `learning_experience` JSON field for the new dashboard.
4. On each phone, open the same site and sign in using the **same account**. Dashboard progress can then load from the cloud. A guest session or a device with no sign-in stores its dashboard data locally only.

## Install on Android

1. Open the live site in Chrome.
2. Use the browser menu and choose **Install app** or **Add to Home screen** (the exact label depends on the device/browser).
3. Confirm the installation. Launch UR from the new home-screen icon and sign in.
4. Repeat on every phone you want to use. Installation itself is per device; the signed-in account synchronizes the supported progress.

## Install on iPhone

1. Open the live site in **Safari**.
2. Tap **Share**, then **Add to Home Screen**.
3. Confirm the name and tap **Add**.
4. Open the home-screen icon and sign in. Repeat on each iPhone/iPad.

## Important scope notes

- This first Version 2 milestone is an installable web app, not yet a separately signed Android APK/AAB or iOS App Store package. The repository currently has no native Android/iOS project or Capacitor build configuration.
- Core pages and selected same-origin assets are cached. Audio, speech voices, Google Fonts, CDN libraries and cloud syncing may still require internet access.
- Cloud sync of the new dashboard requires the SQL migration in step 2. Until it is applied, the dashboard continues to save locally and the existing lesson/quiz sync is kept separate.
- Before calling this production-ready, verify on real Android and iOS devices: sign-in, app relaunch, switching between two phones, lesson completion, both quiz grading modes, Arabic result feedback, audio permissions, and recovery/login links.
- For official Play Store/App Store distribution, a later milestone must create and test native Android/iOS packaging, signing, icons/screenshots, privacy details, and store listings.

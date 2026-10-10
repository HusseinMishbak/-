# French Learning Platform — deployment and account setup

This repository contains an Arabic RTL French-learning platform with two sequential learning months. Supabase provides student accounts, cloud progress, and quiz history. The frontend uses only the public publishable key; no service-role or secret key belongs in browser code.

## Learning content

- **Month 1 — A1.1:** the existing four-week beginner path, including introductions, pronunciation, numbers, family, school/work, food, and the city.
- **Month 2 — A1.2:** four more weeks and 24 trackable sessions on `être` and `avoir`, articles, gender/plural and adjectives, family/home descriptions, questions, negation, daily routines, shopping, food, prices, directions, and transport.
- **Interactive material:** Wordwall links, including the user-provided `être` audio matching activity, plus related games for `avoir`, articles, numbers, and negation.
- **In-platform assessment:** the month-two multiple-choice review gives instant feedback. When the learner is signed in, its score is submitted to `quiz_attempts`; external Wordwall results do not automatically sync to Supabase.

## Current backend setup

- Project: `Learning French` (`yycilzamasypqpvevrup`).
- Tables: `profiles`, `student_progress`, and `quiz_attempts`.
- RLS is enabled on all three tables. The teacher-check helper is in the non-exposed `private` schema; trigger functions are not executable as public/authenticated RPCs.
- The Supabase security advisor showed no findings after the RLS hardening migration.
- `index.html` is configured with the project's URL and the public publishable key. **Never put a `service_role` or secret key in browser code.**

## 1. Publish the website

Open [GitHub Pages settings](https://github.com/HusseinMishbak/-/settings/pages). Choose **Deploy from a branch**, branch `main`, folder `/(root)`, and save.

Expected project site: <https://husseinmishbak.github.io/-/>

The actual deployed URL should be confirmed in GitHub Pages settings. If you rename the repository or use a custom domain, use that actual URL in the next step.

## 2. Configure Supabase Auth redirects

Open [Supabase URL Configuration](https://supabase.com/dashboard/project/yycilzamasypqpvevrup/auth/url-configuration).

Set **Site URL** to the actual published site. If the address above is the live one, use:

```text
https://husseinmishbak.github.io/-/
```

Add that exact address to **Redirect URLs** too. A mismatch can send learners to the wrong path after email confirmation or password reset.

## 3. Student registration and sign-in

1. Open the published site and go to **حساب الطالب**.
2. For a new email, register with a display name and a strong password.
3. If email confirmation is enabled, open the Supabase confirmation message and click its link, then return to the site and sign in.
4. If the site says the email is already registered, do not keep signing up with the same address. Use **تسجيل الدخول** or **نسيت كلمة المرور؟**.
5. If no email arrives, check spam/junk. Confirm the Site URL and allowed Redirect URLs in step 2.

The account form now distinguishes an already-registered email and handles network exceptions with a visible message instead of leaving the submit button busy.

## 4. Grant the teacher role

Every new account receives the `student` role. To authorize a teacher account, first register and confirm that account, then run this one-time statement in [Supabase SQL Editor](https://supabase.com/dashboard/project/yycilzamasypqpvevrup/sql/new), substituting the exact registration email:

```sql
update public.profiles
set role = 'teacher'
where lower(email) = lower('YOUR_SIGNUP_EMAIL@example.com');
```

The query should update exactly one row. Sign out and sign back in to refresh the role. There is no teacher-role switch in the public interface; only an administrator should grant this role.

## Data access and privacy

- `profiles`: display name, email, and role.
- `student_progress`: completed sessions/weeks, notes, last section, and latest quiz data.
- `quiz_attempts`: submitted quiz score, percentage, answer selections, and timestamp.
- Students can read/update their own progress and submit their own attempts. Teachers can read student profiles, progress, and quiz attempts through RLS.
- Before inviting the public, publish a privacy notice explaining collected data, purpose, retention, contact information, and deletion requests. Inform learners that a teacher can view their name, email, progress, and recorded quiz history.

## Important limitations

- I verified the repository content and JavaScript syntax, the three database tables, their RLS flags, migration records, and the absence of current Supabase security-advisor findings.
- A browser-based end-to-end check of the current public Pages deployment is still needed.
- Quiz scoring takes place in the browser, so these results are appropriate for practice and progress tracking, not high-stakes certification or official grading.
- Removing a user should be done through Supabase Auth administration; linked profile/progress/history rows are configured to cascade on account deletion.


## Speaking assessments and teacher review

- Every unit in the eight-unit Entre Nous 1 starter path now has a pronunciation lab: French examples, a slow-playback button, a short recording task, playback, and local download.
- The placement test and end-of-month evaluation include speaking samples. Placement and monthly recordings are intended to be about 60–90 seconds; unit recordings are shorter.
- If the learner is signed in and explicitly checks the consent box, the recording uploads to the private Supabase Storage bucket `student-audio`; metadata is saved to `speaking_submissions`. Without sign-in, playback and download remain local and no recording is uploaded.
- A teacher-authorized account can open a student's progress detail, listen to submitted recordings, and score speaking using five rubric criteria (message clarity, sentence formation, vocabulary, comprehension/response, pronunciation/rhythm), each scored 0–2 for a total of 10, then save feedback. The audio bucket is private; storage and row-level security policies permit access only to the recording owner and a teacher role.
- Pronunciation-and-recording labs are embedded in the eight textbook-unit panels and in each citizenship/integration module, as well as the placement and monthly speaking tests.
- The placement multiple-choice result is also added to `quiz_attempts` for signed-in learners. Speaking submissions are assessed by the teacher, not automatically scored by speech recognition.
- The uploaded Month 1 guide emphasizes listening without reading, listening with text, repeating aloud 3–5 times, and recording/comparing. The final monthly speaking task is 60–90 seconds; the website implements these as repeatable in-app practice and teacher-reviewed recordings.

### Enable the owner/teacher view

The existing owner profile in the current Supabase project has been granted the `teacher` role. Sign out and sign back in on the live site to refresh the role in the browser. New accounts still receive `student` by default; use the SQL below only when granting teacher access to another explicitly authorized account.

Register the owner's account as a student first, confirm the email if required, then run this one-time query in Supabase SQL Editor (replace the email with the exact owner account email):

```sql
update public.profiles
set role = 'teacher'
where lower(email) = lower('OWNER_EMAIL@example.com');
```

Confirm exactly one row is updated, then sign out and sign back in. The teacher menu, student tracking, quiz results, and audio review are shown only for role `teacher`. Do not grant this role to a public student account.

## Audio practice controls

- French text marked as French (including the lesson examples and grammar phrases) is clickable; press it to hear the browser's French voice. A nearby **🔊** button is also added when there is not already a speaker button.
- On tasks whose instructions ask the learner to speak, pronounce, present, role-play, or record an answer, a microphone control is displayed.
- The older inline microphone controls still record locally for quick practice. The dedicated pronunciation labs inside the book units and the placement/monthly speaking tests additionally support playback and download, then optional upload to the private `student-audio` bucket after the signed-in learner explicitly consents. A submitted test recording becomes visible to the student and teacher-authorized accounts only.
- Pronunciation playback uses the browser's Web Speech voice available on the device. The sound and voice quality therefore vary by browser and operating system; some devices may not have a French voice installed.
- Microphone recording needs a secure context (HTTPS) and browser permission. If blocked, enable microphone access in the browser settings and reload the page.


## Months 3–20: expanded A2 → DELF B2 learning path

The `curriculum.js` file provides a structured 18-month roadmap (72 weekly modules) beyond the Entre Nous A1 course. Each roadmap week includes:

- Four guided study sessions with instructions and a practical output.
- Four topic-oriented French–Arabic vocabulary flashcards with example sentences.
- A four-question multiple-choice quiz with immediate correction and explanations.
- A writing prompt with a model sentence/answer, plus speaking prompts that can use the browser microphone recorder.
- Four level-appropriate external resource links, selected for A2, B1, B2 or DELF B2 practice.

The month and week sections are expandable. Open **خارطة الطريق إلى B2**, expand a month, then open **دروس الأسبوع والتمارين والألعاب** in any week. Weekly lesson checkboxes and week completion are stored through the same progress system used by the rest of the platform; quiz attempts are sent to Supabase for signed-in learners.

### External learning resources referenced in weekly plans

- TV5MONDE: A2 <https://apprendre.tv5monde.com/fr/exercices/a2-elementaire>, B1 <https://apprendre.tv5monde.com/fr/exercices/b1-intermediaire>, B2 <https://apprendre.tv5monde.com/fr/exercices/b2-avance>.
- Wordwall activity collections: A2 <https://wordwall.net/fr-fr/community/fle/a2>, B1 <https://wordwall.net/fr-fr/community/fle/niveau-b1>, B2 <https://wordwall.net/fr-fr/community/fle/b2>.
- RFI — Journal en français facile: <https://francaisfacile.rfi.fr/fr/podcasts/journal-en-français-facile/>.
- Official DELF level references from France Éducation international: A2 <https://www.france-education-international.fr/diplome/delf-tout-public/niveau-a2>, B1 <https://www.france-education-international.fr/diplome/delf-tout-public/niveau-b1>, B2 <https://www.france-education-international.fr/diplome/delf-tout-public/niveau-b2>.

The external links are supplementary. Their results remain on the external websites and are not automatically imported into student records. The in-platform weekly quiz is the activity that can record its score in Supabase.

### Progress counter

The core counter currently tracks **336 learning sessions**: 48 sessions aligned with the eight Entre Nous 1 units plus 288 sessions across the 72 roadmap weeks. Week-completion checks are tracked separately. The 24 earlier month-two practice tasks remain available as optional material and are not included in this core-session denominator.

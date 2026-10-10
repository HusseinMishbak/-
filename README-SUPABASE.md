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

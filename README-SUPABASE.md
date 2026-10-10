# French A1.1 — deployment and account setup

This repository contains the Arabic RTL French-learning SPA. The frontend is wired to the Supabase project **Learning French** (`yycilzamasypqpvevrup`) using only the public publishable key. No service-role or secret key is included in browser code.

## Current setup status

- `index.html` is configured with the project URL and public publishable key.
- The Supabase project is active.
- Database tables created: `profiles`, `student_progress`, and `quiz_attempts`.
- Row Level Security (RLS) is enabled on all three tables.
- Security hardening migration is applied. The teacher-check helper lives in the non-exposed `private` schema, and trigger functions cannot be called directly as public/authenticated RPCs.
- Automated Supabase security advisor check returned no findings after hardening.
- The live URL, public sign-up, email confirmation, and teacher role still need the final settings below.

## 1. Enable the public website

Open [GitHub Pages settings](https://github.com/HusseinMishbak/-/settings/pages). Under **Build and deployment**, select **Deploy from a branch**, choose branch `main`, folder `/(root)`, and save.

Expected project-site URL: <https://husseinmishbak.github.io/-/>

## 2. Configure Supabase Auth redirects

Open [Supabase URL Configuration](https://supabase.com/dashboard/project/yycilzamasypqpvevrup/auth/url-configuration):

- **Site URL:** `https://husseinmishbak.github.io/-/`
- Add this exact URL to **Redirect URLs**: `https://husseinmishbak.github.io/-/`

Use the actual live URL if you later rename the repository or use a custom domain. Supabase uses these settings for email confirmation and password-reset redirects.

## 3. First test as a student

1. Open the live website and go to the account section.
2. Register with an email address and a strong password.
3. Confirm the message sent by Supabase, if email confirmation is enabled.
4. Sign in and mark a lesson complete.
5. Refresh the page, then sign in from another browser/device to confirm cloud synchronization.

## 4. Grant the teacher role to your own account

New accounts are always assigned the `student` role. After you register your own account, open [Supabase SQL Editor](https://supabase.com/dashboard/project/yycilzamasypqpvevrup/sql/new) and run this one-time statement, replacing the address with the exact email you used to sign up:

```sql
update public.profiles
set role = 'teacher'
where lower(email) = lower('YOUR_SIGNUP_EMAIL@example.com');
```

The query should update exactly one row. If it updates zero rows, finish registration first and verify the email. Sign out and sign in again after granting the role. There is no teacher-role switch in the public interface.

## Data and security

- `profiles` stores display name, email, and role.
- `student_progress` stores completed checkboxes, completed weeks, notes, last section, and latest quiz result.
- `quiz_attempts` stores submitted quiz scores, percentages, answers, and timestamps.
- A student can read/update their own progress and submit their own quiz attempts. A teacher can read student progress and quiz attempts through RLS.
- Public access is limited to the course content and the public publishable API key. **Never place a Supabase `service_role` or secret key in `index.html`.**

## Important limitations

- I have verified the repository files, database tables, RLS flags, migration records, and the Supabase security advisor after hardening. I have not yet been able to verify a live GitHub Pages URL or perform a browser-based end-to-end registration test.
- Quiz scores are currently calculated in the browser. They are suitable for practice and learning progress, not high-stakes certification or official grades.
- Before inviting the public, publish a privacy notice describing collected data, purpose, retention, contact information, and deletion requests. Tell learners that the teacher account can view their email, name, lesson progress, and quiz history.
- Removing a user should be done through Supabase Auth administration; related profile/progress/history rows are configured to cascade on account deletion.

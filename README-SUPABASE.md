# French A1.1 — enable student accounts and cloud progress

The static website can be hosted on GitHub Pages. Supabase supplies authentication and a PostgreSQL database for each student's account, progress, and quiz history.

## What you need

- A Supabase project.
- The project URL.
- The **public publishable key** (or legacy `anon` key) from the project's API settings.
- Never use a `service_role`/secret key in `index.html`, GitHub, or any browser-facing code.

## Setup

1. Create/open your project at <https://supabase.com/dashboard>.
2. Open **SQL Editor → New query**. Paste and run the entire `supabase/schema.sql` file from this repository.
3. In Supabase, open **Project Settings → API** (or **Connect**, depending on the dashboard UI). Copy the Project URL and the public publishable/anon key.
4. Edit `index.html`, find these constants near the start of the final JavaScript block, and replace their placeholder values:

   ```js
   const SUPABASE_URL='https://YOUR-PROJECT.supabase.co';
   const SUPABASE_ANON_KEY='YOUR-PUBLISHABLE-OR-ANON-KEY';
   ```

   The URL and publishable/anon key are intentionally public client settings. Database access is controlled by the RLS rules in `schema.sql`. Do not add a service-role key.

5. In **Authentication → URL Configuration**, set the Site URL to your final GitHub Pages URL, for example `https://husseinmishbak.github.io/-/` if you publish from the `-` repository. Add that exact URL to the allowed redirect URLs. Add the same origin/path used by the deployed site.
6. Commit the updated `index.html` to the repository and make sure GitHub Pages is enabled from the `main` branch root (`/(root)`).
7. Open the live site, create an account, and follow the email-confirmation flow if enabled. Log in after confirmation.
8. To grant your teacher account access, run this **separate one-time** statement in SQL Editor after the account exists (replace the example email):

   ```sql
   update public.profiles
   set role = 'teacher'
   where lower(email) = lower('your-email@example.com');
   ```

   Then sign out and sign back in. There is intentionally no teacher-role switch in the student interface. Only an administrator working in the Supabase SQL Editor should grant this role.

## Data model

- `profiles`: display name, email and role. A trigger creates every profile with the `student` role. The browser has no direct permission to update a profile's role.
- `student_progress`: each student's completion checkboxes, completed weeks, notes and latest quiz result.
- `quiz_attempts`: a record each time a logged-in student submits the interactive quiz.

The teacher dashboard can read student profiles, progress and quiz attempts through Row Level Security (RLS). A student can access only their own profile, progress and attempts.

## Important limitations and privacy notes

- `localStorage` continues to provide a local fallback. When logged in, progress is also synchronized to the student's Supabase account; different users on the same browser get separate account-scoped local state.
- The monthly interactive quiz is formative. Client-side scores can be manipulated by a technically skilled user; do not use them for high-stakes certification or final grades without moving scoring to a trusted server/Edge Function.
- The teacher dashboard displays account email, name, progress and recorded quiz performance to the teacher account. Explain this to students before they register and collect only necessary data. If minors use the platform, follow applicable parental-consent and privacy rules.
- Account deletion should be performed by an administrator through Supabase Auth (and will cascade to the profile, progress and quiz history). Before opening registration to the public, publish a privacy notice that identifies the controller, purpose, retention period, contact point, and how to request deletion.
- Supabase free-plan limits and dashboard labels may change; check your project's current plan and settings.
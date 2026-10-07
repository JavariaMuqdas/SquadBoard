# SquadBoard — Group Project Task Tracker

```
frontend/   React + Vite + Tailwind (Home page + Auth pages)
backend/    Laravel 11 drop-in files for the Auth module (Sanctum, invitations, Google login)
```

## Run it
1. **Backend** — follow `backend/README.md` (create Laravel app, copy files, `.env`, `php artisan migrate --seed`, `php artisan serve`).
2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev        # http://localhost:5173
   ```
3. Try it with the seeded data:
   - Log in: `leader@squadboard.test` / `password123`
   - Open the invite links printed by `php artisan migrate --seed` to test invite signup.

## Auth pages
| Route | Page |
|---|---|
| `/login` | Login (supports `?invite=TOKEN`) |
| `/register` | Signup with Student/Supervisor picker (supports `?invite=TOKEN` → email + role locked) |
| `/invite/:token` | Invitation preview → create account / log in / accept |
| `/forgot-password`, `/reset-password/:token` | Password reset |
| `/app` | Protected dashboard placeholder |

Google button: add Google's official "G" mark as `frontend/public/google-g.svg` (from Google's sign-in branding guidelines) — the button shows text only until then.

# SquadBoard API (Laravel 11) — Authentication module

These are **drop-in files** for a fresh Laravel 11 app. They add:
individual accounts (Student / Supervisor), Sanctum SPA cookie login, invite-based joining,
password reset, and Google login.

## 1. Create Laravel and install packages
```bash
composer create-project laravel/laravel:^11.0 backend
cd backend
php artisan install:api          # installs Sanctum + routes/api.php
composer require laravel/socialite
```

## 2. Copy these files in (overwrite when asked)
```
app/Exceptions/InvitationException.php
app/Http/Controllers/Api/Auth/{Register,Login,PasswordReset}Controller.php
app/Http/Controllers/Api/InvitationController.php
app/Http/Controllers/Auth/GoogleController.php
app/Http/Requests/Auth/{Register,Login}Request.php
app/Http/Resources/UserResource.php
app/Models/{User,Project,Invitation}.php
app/Providers/AppServiceProvider.php
app/Services/InvitationService.php
bootstrap/app.php
config/cors.php
config/squadboard.php
database/migrations/2026_10_07_00000{1,2,3}_*.php
database/seeders/DatabaseSeeder.php
routes/api.php
routes/web.php
tests/Feature/AuthTest.php
```
Then paste the block from `config/ADD-TO-services.php.txt` into `config/services.php`.

## 3. Configure
```bash
cp .env.example .env      # use the .env.example from this folder
php artisan key:generate
# create the MySQL database "squadboard" (phpMyAdmin / MySQL Workbench / XAMPP)
php artisan migrate --seed
```
The seeder prints a demo leader login and two invite links you can open in the React app.

## 4. Run
```bash
php artisan serve          # http://localhost:8000
```
Frontend: `npm run dev` in `frontend/` (http://localhost:5173). Vite proxies `/api`, `/sanctum`
and `/oauth` to Laravel, so the browser sees one origin and cookies just work.

## 5. Test
```bash
php artisan test --filter=AuthTest
```

## Endpoints
| Method | URL | Auth | Purpose |
|---|---|---|---|
| GET | /sanctum/csrf-cookie | – | Call first; sets XSRF cookie |
| POST | /api/register | guest | name, email, password, password_confirmation, role, terms, invite_token? |
| POST | /api/login | guest | email, password, remember?, invite_token? |
| POST | /api/forgot-password | guest | email |
| POST | /api/reset-password | guest | token, email, password, password_confirmation |
| GET | /api/invitations/{token} | public | Invite preview (project, inviter, email, account_exists, status) |
| POST | /api/invitations/{token}/accept | user | Accept as the logged-in user |
| GET | /api/user | user | Current user |
| POST | /api/logout | user | Log out |
| GET | /oauth/google/redirect?role=&invite= | – | Google login (full-page redirect) |

## Rules enforced on the server
- One email = one account (stored lowercase, unique). Google login links to an existing account with the same email.
- Invite tokens are random 48-char strings; only their SHA-256 hash is stored. Expire after `INVITE_EXPIRY_DAYS` (7).
- Invite signup: email must equal the invited email; account role is set from the invite (supervisor invite → supervisor account).
- Wrong account accepting an invite → 403 `email_mismatch` with a clear message.
- Used / expired / revoked invites → 410 with a reason.
- Login: 5 wrong attempts per minute per email+IP, then locked out briefly.
- Forgot password never reveals whether an email is registered.

## Google login setup
1. Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID (Web).
2. Authorized redirect URI: `http://localhost:5173/oauth/google/callback`
3. Put the client ID/secret in `.env`.

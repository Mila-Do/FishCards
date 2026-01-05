# Specyfikacja Techniczna Systemu Autentykacji FishCards

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1 Komponenty Layout i Nawigacji

#### 1.1.1 Rozszerzenie Layout.astro
**Lokalizacja:** `src/layouts/Layout.astro`

**Zmiany wymagane:**
- Dodanie nagłówka (header) z nawigacją główną aplikacji
- Implementacja komponentu nawigacyjnego z przyciskami logowania/wylogowania w prawym górnym rogu
- Obsługa przekazywania stanu autentykacji do komponentów React
- Integracja z Astro.cookies dla obsługi sesji po stronie serwera

**Struktura nagłówka:**
```
Header (Astro component)
├── Logo/Brand (lewy róg)
├── Nawigacja główna (centrum)
│   ├── Link: "Generator" (/generator)
│   ├── Link: "Moje Fiszki" (/flashcards)
│   └── Link: "Sesja Nauki" (/learning - nowa strona)
└── Sekcja użytkownika (prawy róg)
    ├── [Gdy niezalogowany]: Przycisk "Zaloguj się"
    └── [Gdy zalogowany]: Dropdown menu z opcjami wylogowania
```

#### 1.1.2 Nowy komponent AuthButton (React)
**Lokalizacja:** `src/components/auth/AuthButton.tsx`

**Odpowiedzialności:**
- Wyświetlanie przycisku "Zaloguj się" dla niezalogowanych użytkowników
- Wyświetlanie dropdown menu z opcjami użytkownika dla zalogowanych
- Obsługa akcji wylogowania (wywołanie API + redirect)
- Obsługa otwierania modala usuwania konta
- Zarządzanie stanem loading podczas operacji auth

**Dropdown menu opcje:**
- Wyświetlanie email użytkownika
- Link "Wyloguj się"
- Link "Usuń konto" (otwiera DeleteAccountModal)

**Props interfejs:**
- `isAuthenticated: boolean`
- `userEmail?: string`
- `onLogout: () => Promise<void>`

### 1.2 Strony Autentykacji

#### 1.2.1 Strona Logowania
**Lokalizacja:** `src/pages/auth/login.astro`

**Struktura:**
- Layout podstawowy z wyłączoną nawigacją auth (ukrycie przycisków login)
- Komponent React `LoginForm` dla interaktywności
- Server-side logic sprawdzający czy użytkownik już zalogowany (redirect do /generator)
- Obsługa query params dla redirectów po logowaniu

#### 1.2.2 Komponent LoginForm (React)
**Lokalizacja:** `src/components/auth/LoginForm.tsx`

**Funkcjonalności:**
- Formularz z polami email + password
- Walidacja client-side (email format, password minimum length)
- Wyświetlanie błędów z API (nieprawidłowe dane, problemy sieciowe)
- Loading states podczas żądań do API
- Link do strony rejestracji i odzyskiwania hasła
- Obsługa submit przez API endpoint `/api/auth/login`

**Walidacja:**
- Email: format email + wymagane
- Password: minimum 8 znaków + wymagane
- Błędy wyświetlane pod polami w czasie rzeczywistym

#### 1.2.3 Strona Rejestracji
**Lokalizacja:** `src/pages/auth/register.astro`

**Struktura:**
- Podobna do strony logowania
- Komponent React `RegisterForm`
- Server-side redirect dla zalogowanych użytkowników

#### 1.2.4 Komponent RegisterForm (React)
**Lokalizacja:** `src/components/auth/RegisterForm.tsx`

**Funkcjonalności:**
- Formularz: email, password, confirmPassword
- Walidacja rozszerzona (potwierdzenie hasła, siła hasła)
- Natychmiastowa aktywacja konta po rejestracji (zgodnie z US-001)
- Automatyczne logowanie po pomyślnej rejestracji
- Komunikat o pomyślnej rejestracji i przekierowanie
- Link do strony logowania

**Walidacja:**
- Email: format + unikalność (sprawdzana server-side)
- Password: minimum 8 znaków, jedna wielka, jedna mała litera, jedna cyfra
- ConfirmPassword: zgodność z password
- CAPTCHA lub inne zabezpieczenie antyspamowe (opcjonalne w MVP)

#### 1.2.5 Strona Odzyskiwania Hasła
**Lokalizacja:** `src/pages/auth/forgot-password.astro`

**Komponenty:**
- `ForgotPasswordForm.tsx` - formularz z email
- `PasswordResetForm.tsx` - formularz z nowym hasłem (tylko dla linków z email)

#### 1.2.6 Komponent Usuwania Konta
**Lokalizacja:** `src/components/auth/DeleteAccountModal.tsx`

**Funkcjonalności:**
- Modal z potwierdzeniem usunięcia konta
- Wymaganie ponownego wprowadzenia hasła dla bezpieczeństwa
- Wyświetlanie informacji o konsekwencjach (trwałe usunięcie fiszek)
- Checkbox z potwierdzeniem zrozumienia konsekwencji
- Przycisk dostępny w dropdown menu użytkownika (AuthButton)

**Proces UX:**
1. Użytkownik klika "Usuń konto" w dropdown menu
2. Modal wyświetla ostrzeżenie o trwałym usunięciu danych
3. Użytkownik musi wprowadzić hasło i zaznaczyć checkbox potwierdzenia
4. Po kliknięciu "Usuń na zawsze" - wywołanie API i przekierowanie do strony głównej

### 1.3 Ochrona Stron i Przekierowania

#### 1.3.1 Middleware Server-side
**Rozszerzenie:** `src/middleware/index.ts`

**Nowe funkcjonalności:**
- Sprawdzanie autentykacji dla stron chronionych (/flashcards, /generator, /learning)
- Przekierowania niezalogowanych użytkowników do /auth/login
- Przekierowania zalogowanych użytkowników z stron auth do /generator
- Obsługa session cookies + JWT tokens

#### 1.3.2 Komponenty z warunkami renderowania
**Aktualizowane strony:**
- `/generator` - dostęp tylko dla zalogowanych
- `/flashcards` - dostęp tylko dla zalogowanych  
- `/` (index) - przekierowanie na /generator dla zalogowanych, informacje o aplikacji dla niezalogowanych

### 1.4 Komunikaty i Obsługa Błędów

#### 1.4.1 Komponent AuthMessage (React)
**Lokalizacja:** `src/components/auth/AuthMessage.tsx`

**Typy komunikatów:**
- SUCCESS: "Rejestracja udana - sprawdź email"
- ERROR: błędy logowania/rejestracji
- INFO: "Wylogowano pomyślnie"
- WARNING: "Sesja wygasła - zaloguj się ponownie"

#### 1.4.2 Obsługa błędów walidacji
**Strategie:**
- Client-side: walidacja w czasie rzeczywistym, błędy pod polami
- Server-side: zwracanie strukturalnych błędów z API
- Network errors: obsługa problemów połączenia

**Struktura błędów API:**
```typescript
interface AuthError {
  code: string; // 'INVALID_CREDENTIALS', 'EMAIL_TAKEN', 'WEAK_PASSWORD'
  message: string; // wiadomość użytkownikowa po polsku
  field?: string; // pole formularza którego dotyczy błąd
}
```

## 2. LOGIKA BACKENDOWA

### 2.1 Endpointy API Autentykacji

#### 2.1.1 POST /api/auth/login
**Lokalizacja:** `src/pages/api/auth/login.ts`

**Input validation (Zod schema):**
```typescript
const LoginSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
  password: z.string().min(1, "Hasło jest wymagane")
});
```

**Proces:**
1. Walidacja danych wejściowych
2. Wywołanie Supabase Auth signInWithPassword
3. Ustawianie session cookies (HttpOnly, Secure, SameSite)
4. Zwrócenie tokenu lub błędu

**Response:**
- 200: `{ success: true, user: UserData, redirectTo: string }`
- 400: `{ error: AuthError }`
- 500: `{ error: { code: 'SERVER_ERROR', message: 'Błąd serwera' } }`

#### 2.1.2 POST /api/auth/register
**Lokalizacja:** `src/pages/api/auth/register.ts`

**Input validation:**
```typescript
const RegisterSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
  password: z.string()
    .min(8, "Hasło musi mieć minimum 8 znaków")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Hasło musi zawierać małą i wielką literę oraz cyfrę")
});
```

**Proces (zgodnie z US-001 - natychmiastowa aktywacja):**
1. Walidacja danych
2. Sprawdzenie czy email nie jest zajęty
3. Wywołanie Supabase Auth signUp z automatyczną aktywacją konta
4. Natychmiastowe logowanie użytkownika (zgodnie z US-001)
5. Zwrócenie danych użytkownika i przekierowanie do /generator

**Uwaga MVP:** W celu uproszczenia procesu rejestracji i zgodności z wymaganiami PRD (US-001), pomijamy weryfikację email w MVP. Użytkownik zostaje natychmiast zalogowany po rejestracji.

#### 2.1.3 POST /api/auth/logout
**Lokalizacja:** `src/pages/api/auth/logout.ts`

**Proces:**
1. Wywołanie Supabase Auth signOut
2. Wyczyszczenie session cookies
3. Invalidacja tokenów
4. Zwrócenie potwierdzenia

#### 2.1.4 POST /api/auth/forgot-password
**Lokalizacja:** `src/pages/api/auth/forgot-password.ts`

**Process:**
1. Walidacja email
2. Wywołanie Supabase Auth resetPasswordForEmail
3. Zwrócenie komunikatu (zawsze sukces - security by obscurity)

#### 2.1.5 POST /api/auth/reset-password  
**Lokalizacja:** `src/pages/api/auth/reset-password.ts`

**Process:**
1. Walidacja tokenu resetowania i nowego hasła
2. Wywołanie Supabase Auth updateUser
3. Automatyczne logowanie po zmianie hasła

#### 2.1.6 POST /api/auth/delete-account
**Lokalizacja:** `src/pages/api/auth/delete-account.ts`

**Process (zgodnie z RODO):**
1. Uwierzytelnienie użytkownika (sprawdzenie sesji)
2. Potwierdzenie hasła użytkownika
3. Usunięcie wszystkich powiązanych danych:
   - Fiszki użytkownika (tabela flashcards)
   - Historie generowań (tabela generations)
   - Logi błędów generowania (tabela generation_error_logs)
4. Wywołanie Supabase Auth admin.deleteUser()
5. Wylogowanie i wyczyszczenie sesji
6. Zwrócenie potwierdzenia usunięcia

**Security:**
- Wymaga potwierdzenia hasła
- Rate limiting: 1 próba / 24 godziny per użytkownika
- Audit log operacji usunięcia konta

### 2.2 Middleware i Session Management

#### 2.2.1 Rozszerzenie middleware
**Aktualizacja:** `src/middleware/index.ts`

**Nowe funkcje:**
- `checkPageAuth()` - sprawdzanie dostępu do stron
- `getSessionFromCookies()` - odczyt sesji z ciasteczek
- `refreshTokenIfNeeded()` - odświeżanie wygasających tokenów

**Protected routes:**
```typescript
const PROTECTED_PAGES = ['/generator', '/flashcards', '/learning'];
const AUTH_PAGES = ['/auth/login', '/auth/register', '/auth/forgot-password'];
```

#### 2.2.2 Session Service
**Lokalizacja:** `src/lib/services/session-service.ts`

**Odpowiedzialności:**
- Ustawianie i odczytywanie session cookies
- Walidacja tokenów Supabase
- Obsługa odświeżania tokenów
- Integracja z Astro.cookies

### 2.3 Walidacja i Security

#### 2.3.1 Auth Validation Schemas
**Lokalizacja:** `src/lib/validation/auth-schemas.ts`

**Schemas:**
- `LoginSchema`
- `RegisterSchema`
- `ForgotPasswordSchema`
- `ResetPasswordSchema`
- `DeleteAccountSchema`

#### 2.3.2 Rate Limiting dla Auth
**Rozszerzenie:** `src/lib/rate-limiter.ts`

**Nowe limity:**
- Login attempts: 5 prób / 15 minut per IP
- Registration: 3 rejestracje / godzinę per IP
- Password reset: 3 żądania / godzinę per IP
- Account deletion: 1 próba / 24 godziny per użytkownika

### 2.4 Server-side Rendering Updates

#### 2.4.1 Aktualizacja astro.config.mjs
**Zmiany:**
- Konfiguracja session middleware
- Ustawienia cookies (domain, secure flags)
- CORS settings dla auth endpoints

#### 2.4.2 Context Locals Extension
**Rozszerzenie typów:**
```typescript
declare namespace App {
  interface Locals {
    supabase: SupabaseClient;
    userId?: string;
    user?: User; // Supabase User object
    session?: Session; // Supabase Session
  }
}
```

## 3. SYSTEM AUTENTYKACJI

### 3.1 Integracja Supabase Auth z Astro

#### 3.1.1 Konfiguracja Supabase Auth
**Rozszerzenie:** `src/db/supabase.client.ts`

**Nowe funkcje:**
- Konfiguracja auth flow (natychmiastowa aktywacja konta, password reset)
- Custom auth event listeners
- Session persistence settings
- Redirect URLs configuration

#### 3.1.2 Auth Service Layer
**Lokalizacja:** `src/lib/services/auth-service.ts`

**Klasa AuthService:**
```typescript
class AuthService {
  async login(email: string, password: string): Promise<AuthResult>;
  async register(email: string, password: string): Promise<AuthResult>;
  async logout(): Promise<void>;
  async resetPassword(email: string): Promise<void>;
  async updatePassword(newPassword: string, token: string): Promise<AuthResult>;
  async deleteAccount(password: string): Promise<void>;
  async getCurrentUser(): Promise<User | null>;
  async refreshSession(): Promise<Session | null>;
}
```

### 3.2 Client-side Auth Context

#### 3.2.1 React Auth Provider
**Lokalizacja:** `src/components/auth/AuthProvider.tsx`

**Odpowiedzialności:**
- Globalne zarządzanie stanem autentykacji
- Synchronizacja z server-side session
- Obsługa auth events (login, logout)
- Udostępnianie auth context dla komponentów

**Context interface:**
```typescript
interface AuthContext {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

### 3.3 Hooks i Utilities

#### 3.3.1 Auth Hooks
**Lokalizacja:** `src/lib/hooks/use-auth.ts`

**Custom hooks:**
- `useAuth()` - podstawowy hook dostępu do auth context
- `useRequireAuth()` - hook z automatycznym przekierowaniem
- `useAuthRedirect()` - hook zarządzający przekierowaniami

#### 3.3.2 Auth Guards
**Lokalizacja:** `src/lib/auth/guards.ts`

**Komponenty ochronne:**
- `RequireAuth` - wrapper wymagający autentykacji
- `RequireGuest` - wrapper dla stron dostępnych tylko dla gości
- `ProtectedRoute` - uniwersalny guard z customową logiką

### 3.4 Security Implementation

#### 3.4.1 CSRF Protection
**Implementacja:**
- Tokeny CSRF w formularzach
- Walidacja Origin/Referer headers
- SameSite cookies configuration

#### 3.4.2 XSS Prevention
**Środki ochrony:**
- Content Security Policy headers
- Sanitizacja inputów użytkownika
- HttpOnly cookies dla sesji

#### 3.4.3 Session Security
**Konfiguracja:**
- Secure cookies w production
- Short token lifetime (15 min access, 7 dni refresh)
- Automatyczne odświeżanie tokenów
- Logout on suspicious activity

### 3.5 Error Handling i Monitoring

#### 3.5.1 Auth Error Types
**Standardowe błędy:**
- `INVALID_CREDENTIALS` - błędne dane logowania
- `USER_NOT_FOUND` - użytkownik nie istnieje
- `EMAIL_ALREADY_TAKEN` - email już zajęty
- `WEAK_PASSWORD` - za słabe hasło
- `SESSION_EXPIRED` - wygasła sesja
- `NETWORK_ERROR` - problemy połączenia

#### 3.5.2 Logging i Audit
**Implementacja:**
- Logowanie prób logowania (success/failure)
- Monitoring podejrzanej aktywności
- Audit trail dla działań użytkowników
- Metryki auth conversion rates

## 4. MIGRACJE I KONFIGURACJA BAZY DANYCH

### 4.1 Supabase Auth Schema
**Informacja:** Supabase automatycznie zarządza tabelami auth (auth.users, auth.sessions)

**Wymagane konfiguracje:**
- **Wyłączenie obowiązkowej weryfikacji email** (zgodnie z US-001 - natychmiastowa aktywacja)
- Email templates (reset password - rejestracja nie wymaga email)
- Redirect URLs (production vs development)
- Rate limiting settings
- Security policies

### 4.2 RLS Policies
**Aktualizacje zabezpieczeń:**
- Flashcards table: dostęp tylko dla właściciela (`user_id = auth.uid()`)
- Generations table: podobne ograniczenia
- Generation_error_logs: zabezpieczenie danych wrażliwych

### 4.3 Database Triggers
**Opcjonalne usprawnienia:**
- Auto-update `updated_at` timestamps
- Audit triggers dla śledzenia zmian
- Cleanup triggers dla starych sesji

## 5. TESTING STRATEGY

### 5.1 Unit Tests
**Komponenty do testowania:**
- AuthService methods
- Validation schemas
- Auth hooks functionality
- Form components behavior

### 5.2 Integration Tests
**Scenariusze:**
- Pełny flow rejestracji
- Login/logout cycle
- Password reset process
- Protected routes access

### 5.3 E2E Tests
**Critical paths:**
- User registration → automatic login → access to flashcards
- Password reset flow
- Session timeout handling
- Security boundary testing

## 6. DEPLOYMENT CONSIDERATIONS

### 6.1 Environment Variables
**Nowe zmienne:**
- `SUPABASE_JWT_SECRET` - do weryfikacji tokenów
- `AUTH_REDIRECT_URL` - base URL dla redirectów
- `SMTP_*` - konfiguracja email (jeśli custom)

### 6.2 Production Security
**Checklist:**
- HTTPS enforcement
- Secure cookie configuration
- CSP headers implementation
- Rate limiting activation
- Auth error messages obfuscation

### 6.3 Monitoring i Alerts
**Metryki:**
- Authentication success/failure rates
- Session duration statistics
- Password reset frequency
- Security incident detection

---

*Specyfikacja przygotowana zgodnie z wymaganiami PRD oraz architekturą techniczną opartą na Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui oraz Supabase Auth.*
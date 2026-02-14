# Feature Flags - Plan Implementacji

## Cel
Rozdzielenie deploymentów od releasów poprzez system feature flags, umożliwiający kontrolę dostępności funkcjonalności na poziomie środowisk (local, integration, production).

## Zakres Zastosowania
- Endpointy API (collections, auth)
- Strony Astro (logowanie, rejestracja, reset hasła)
- Widoczność kolekcji dla użytkownika

## Założenia Techniczne

### 1. Lokalizacja i Struktura
- **Ścieżka modułu**: `src/features/`
- **Pliki**:
  - `src/features/index.ts` - główny moduł z eksportowanym API
  - `src/features/config.ts` - konfiguracja flag per środowisko
  - `src/features/types.ts` - typy TypeScript

### 2. Typ Wartości Flag
- **Boolean only**: `true` (włączone) / `false` (wyłączone)
- Brak złożonych typów danych
- Proste i czytelne

### 3. Struktura Nazewnictwa
**Zagnieżdżona struktura** z kropkową notacją:

```
auth.login
auth.register
auth.resetPassword
collections.create
collections.read
collections.update
collections.delete
collections.visibility
```

### 4. Konfiguracja Środowisk
Statyczna konfiguracja definiowana w build-time dla trzech środowisk:
- `local` - środowisko deweloperskie
- `integration` - środowisko testowe
- `prod` - środowisko produkcyjne

Środowisko określane przez zmienną: `ENV_NAME`

### 5. API Modułu

#### Główna funkcja
```typescript
isFeatureEnabled(featureKey: string): boolean
```

**Zachowanie**:
- Pobiera wartość flagi dla aktualnego środowiska
- Zwraca `false` dla niezdefiniowanych flag (fail-safe)
- Zwraca `false` gdy środowisko nie jest zdefiniowane (`ENV_NAME` = null/undefined)
- Loguje każde odpytanie o wartość flagi (diagnostyka)

**Przykłady użycia**:
```typescript
// Backend - endpoint API
if (isFeatureEnabled('auth.login')) {
  // logika logowania
}

// Frontend - strona Astro
if (isFeatureEnabled('auth.register')) {
  // renderuj formularz rejestracji
}

// Widoczność kolekcji
if (isFeatureEnabled('collections.visibility')) {
  // pokaż kolekcje użytkownikowi
}
```

#### Dodatkowe funkcje pomocnicze
```typescript
// Pobranie wszystkich flag dla środowiska
// Zwraca wszystkie flagi jako false gdy środowisko nie jest zdefiniowane
getAllFeatures(): Features

// Sprawdzenie czy flaga istnieje w konfiguracji
featureExists(featureKey: string): boolean

// Pobranie aktualnego środowiska (może zwrócić null jeśli ENV_NAME nie jest ustawiony)
getEnvironment(): Environment | null
```

### 6. Mechanizmy Wsparcia

#### Logowanie
- **Poziom**: INFO
- **Format**: `[FeatureFlag] Checking '${featureKey}' in '${env}': ${value}`
- **Cel**: Ułatwienie diagnostyki i debugowania w różnych środowiskach

Przykład logu:
```
[FeatureFlag] Checking 'auth.login' in 'local': true
[FeatureFlag] Checking 'collections.create' in 'prod': false
[FeatureFlag] Checking 'unknown.feature' in 'integration': false (undefined)
[FeatureFlag] Environment not defined (ENV_NAME is null/undefined), returning false for "auth.login"
[FeatureFlag] Environment not defined (ENV_NAME is null/undefined), returning all flags as false
```

#### Obsługa Błędów
- Brak lub niepoprawna zmienna `ENV_NAME` → **wszystkie flagi zwracają `false`** (bezpieczny domyślny stan)
- `getEnvironment()` zwraca `null` gdy środowisko nie jest zdefiniowane
- Niezdefiniowana flaga → zwraca `false` + log z informacją
- Brak rzucania wyjątków - bezpieczne działanie aplikacji
- **Fail-safe design:** aplikacja nigdy się nie wywróci z powodu flag funkcjonalności

### 7. Uniwersalność (Frontend + Backend)
- **Jeden moduł** dla całej aplikacji
- **Import standardowy**: `import { isFeatureEnabled } from '@/features'`
- **Brak zależności** od środowiska wykonania (SSR/client-side)
- **Tree-shakeable** - niewykorzystane fragmenty usuwane przy bundlowaniu

### 8. Rozszerzalność
- Łatwe dodawanie nowych flag w `config.ts`
- Możliwość dodania nowych środowisk
- Struktura zagnieżdżona pozwala na logiczne grupowanie
- Type-safe dzięki TypeScript (autocomplete dla kluczy)

### 9. Konfiguracja Początkowa

#### Flagi dla `auth`:
- `auth.login` - dostępność logowania
- `auth.register` - dostępność rejestracji
- `auth.resetPassword` - dostępność resetowania hasła

#### Flagi dla `collections`:
- `collections.create` - tworzenie kolekcji
- `collections.read` - odczyt kolekcji
- `collections.update` - aktualizacja kolekcji
- `collections.delete` - usuwanie kolekcji
- `collections.visibility` - widoczność kolekcji dla użytkownika

### 10. Przykładowa Konfiguracja Środowisk

```typescript
const features = {
  local: {
    auth: {
      login: true,
      register: true,
      resetPassword: true,
    },
    collections: {
      create: true,
      read: true,
      update: true,
      delete: true,
      visibility: true,
    }
  },
  integration: {
    auth: {
      login: true,
      register: true,
      resetPassword: false, // testujemy bez reset
    },
    collections: {
      create: true,
      read: true,
      update: true,
      delete: false, // bez usuwania na integracji
      visibility: true,
    }
  },
  prod: {
    auth: {
      login: true,
      register: false, // rejestracja wyłączona
      resetPassword: true,
    },
    collections: {
      create: false, // tworzenie wyłączone
      read: true,
      update: false,
      delete: false,
      visibility: true,
    }
  }
}
```

## Kolejne Kroki (po implementacji)

1. **Integracja z endpointami API** (`src/pages/api/`)
2. **Integracja ze stronami Astro** (auth pages)
3. **Integracja z logiką widoczności kolekcji**
4. **Testy jednostkowe** dla modułu feature flags
5. **Dokumentacja użycia** dla zespołu

## Korzyści

- ✅ Deployment niezależny od release
- ✅ Kontrola funkcjonalności per środowisko
- ✅ Bezpieczne testowanie nowych features
- ✅ Łatwy rollback (zmiana flagi zamiast revert kodu)
- ✅ A/B testing (przyszłość)
- ✅ Stopniowe udostępnianie funkcjonalności
- ✅ **Safe by default:** Niezdefiniowane środowisko = wszystkie funkcje wyłączone
- ✅ **Fail-safe design:** Brak wyjątków, zawsze zwracane są prawidłowe wartości

## Ograniczenia

- ⚠️ Statyczna konfiguracja (zmiana wymaga redeployu)
- ⚠️ Brak dynamicznej zmiany w runtime
- ⚠️ Brak per-user flags (na razie)
- ⚠️ Brak dashboardu zarządzania flagami

---

**Status**: ✅ Zaimplementowano  
**Data implementacji**: 2026-02-14  
**Wersja**: 1.0.0

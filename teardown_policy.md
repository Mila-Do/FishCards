# Teardown Policy - Strategia czyszczenia bazy danych w testach E2E

## 📋 Spis treści

1. [Wprowadzenie](#wprowadzenie)
2. [Założenia początkowe](#założenia-początkowe)
3. [Dwa główne podejścia](#dwa-główne-podejścia)
4. [Porównanie strategii](#porównanie-strategii)
5. [Drzewo decyzyjne](#drzewo-decyzyjne)
6. [Najlepsze praktyki](#najlepsze-praktyki)
7. [Implementacja](#implementacja)
8. [Podsumowanie](#podsumowanie)

---

## Wprowadzenie

Testy E2E (End-to-End) zazwyczaj tworzą dane testowe w bazie danych (użytkowników, posty, zamówienia itp.). Bez odpowiedniej strategii czyszczenia, dane te:
- Zaśmiecają bazę danych
- Mogą powodować konflikty między testami
- Utrudniają debugowanie
- Spowalniają kolejne uruchomienia testów

**Kluczowe pytanie:** Kiedy i jak czyścić dane testowe?

---

## Założenia początkowe

Przed wyborem strategii teardown, zidentyfikuj następujące aspekty swojego projektu:

### 1. **Model tworzenia użytkowników testowych**

#### Wariant A: Predefiniowany użytkownik testowy
```
✓ Jeden stały użytkownik (np. test@example.com)
✓ Dane logowania w zmiennych środowiskowych
✓ Testy logują się na istniejące konto
```

#### Wariant B: Dynamiczne tworzenie użytkowników
```
✓ Każdy test tworzy nowego użytkownika
✓ Email z timestampem (np. test-1739012345678@example.com)
✓ Testy rejestrują nowe konta
```

### 2. **Typ bazy danych i uprawnienia**

- **Supabase / Firebase:** RLS (Row Level Security) + Admin API
- **PostgreSQL:** Własne role i uprawnienia
- **MongoDB:** Role-based access control
- **SQL tradycyjny:** User privileges

### 3. **Izolacja testów**

- Czy testy mogą działać równolegle?
- Czy testy dzielą dane?
- Czy testy są niezależne?

### 4. **Typ danych testowych**

- Dane statyczne (nie zmieniają się między testami)
- Dane dynamiczne (każdy test tworzy nowe)
- Relacje między tabelami (foreign keys)

---

## Dwa główne podejścia

### 🔵 Strategia 1: Per-Test Teardown (czyszczenie po każdym teście)

#### Koncepcja
Czyszczenie danych **po każdym pojedynczym teście** używając klucza publicznego (ograniczone uprawnienia).

#### Implementacja (Playwright)
```typescript
import { test as teardown } from '@playwright/test';

teardown('cleanup database', async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLIC_KEY  // Public key - ograniczone uprawnienia
  );

  // Czyszczenie tylko danych bieżącego użytkownika testowego
  await supabase
    .from('user_data')
    .delete()
    .eq('user_id', process.env.E2E_USER_ID);
});
```

#### Charakterystyka
- ⏰ **Kiedy:** Po każdym teście
- 🔑 **Uprawnienia:** Public/anon key (respektuje RLS)
- 🎯 **Zakres:** Tylko dane jednego predefiniowanego użytkownika
- 👤 **Użytkownicy:** Konto pozostaje, usuwane tylko dane
- ⚡ **Wydajność:** Wolniejsze (N × czas czyszczenia)

---

### 🟢 Strategia 2: Global Teardown (czyszczenie po wszystkich testach)

#### Koncepcja
Czyszczenie **raz na końcu** wszystkich testów używając klucza administracyjnego (pełne uprawnienia).

#### Implementacja (Playwright)
```typescript
// playwright.config.ts
export default defineConfig({
  globalTeardown: './global-teardown.ts',
});

// global-teardown.ts
async function globalTeardown() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY  // Service role - admin
  );

  // 1. Identyfikacja wszystkich użytkowników testowych
  const { data: users } = await supabase.auth.admin.listUsers();
  const testUsers = users.filter(u => 
    u.email.match(/^test-e2e-\d+@example\.com$/) ||
    u.id === process.env.E2E_USER_ID
  );

  // 2. Usuwanie danych wszystkich użytkowników testowych
  const testUserIds = testUsers.map(u => u.id);
  
  await supabase.from('user_data').delete().in('user_id', testUserIds);
  await supabase.from('other_table').delete().in('user_id', testUserIds);

  // 3. Usuwanie kont użytkowników
  for (const user of testUsers) {
    await supabase.auth.admin.deleteUser(user.id);
  }
}
```

#### Charakterystyka
- ⏰ **Kiedy:** Raz po wszystkich testach
- 🔑 **Uprawnienia:** Service role key (omija RLS)
- 🎯 **Zakres:** Wszyscy użytkownicy testowi (predefiniowani + dynamiczni)
- 👤 **Użytkownicy:** Całkowite usunięcie kont
- ⚡ **Wydajność:** Szybsze (1 × czas czyszczenia)

---

## Porównanie strategii

### Tabela decyzyjna

| Kryterium | Per-Test Teardown | Global Teardown |
|-----------|-------------------|-----------------|
| **Częstotliwość czyszczenia** | Po każdym teście | Raz na końcu |
| **Wymagane uprawnienia** | Public key (RLS) | Service role key (admin) |
| **Izolacja testów** | ✅ Doskonała | ⚠️ Umiarkowana |
| **Szybkość wykonania** | 🐌 Wolniejsze | ⚡ Szybsze |
| **Złożoność implementacji** | 🟢 Prosta | 🟡 Średnia |
| **Bezpieczeństwo** | ✅ Wyższe | ⚠️ Niższe (service key) |
| **Obsługa dynamicznych użytkowników** | ❌ Nie | ✅ Tak |
| **Usuwanie kont testowych** | ❌ Nie | ✅ Tak |
| **Stan bazy między testami** | ✅ Zawsze czysty | ⚠️ Zaśmiecony do końca |
| **Debugowanie** | ✅ Łatwiejsze | ⚠️ Trudniejsze |
| **Równoległe uruchamianie** | ✅ Bezpieczne | ⚠️ Możliwe konflikty |
| **CI/CD friendly** | ✅ Tak | ✅ Tak |

### Szczegółowe porównanie

#### 🔵 Per-Test Teardown - Kiedy wybrać?

**✅ Wybierz gdy:**
- Masz **jednego predefiniowanego** użytkownika testowego
- **Nie tworzysz** nowych kont w testach (tylko logujesz)
- Potrzebujesz **czystej bazy przed każdym testem**
- Chcesz uniknąć **service role key**
- Testy muszą być **w pełni izolowane**
- Debugujesz testy i potrzebujesz **czystego stanu** w każdym momencie
- Masz **prostą strukturę danych** (kilka tabel)

**❌ Unikaj gdy:**
- Testy dynamicznie tworzą użytkowników
- Masz **wiele relacji** między tabelami (FK constraints)
- Testy są **wolne** i czyszczenie dodatkowo je spowalnia
- Potrzebujesz **usuwać konta** testowe całkowicie

**📊 Przykładowy scenariusz:**
```
Aplikacja TODO z:
- 1 użytkownik testowy (test@example.com)
- Tabele: tasks, categories
- Testy: CRUD na task'ach
- Proste relacje

✓ Per-Test Teardown idealnie pasuje
```

---

#### 🟢 Global Teardown - Kiedy wybrać?

**✅ Wybierz gdy:**
- Testy **dynamicznie tworzą** użytkowników (rejestracja)
- Potrzebujesz **usuwać konta** testowe
- Masz **wiele użytkowników** testowych jednocześnie
- Wydajność jest **kluczowa** (wolne czyszczenie)
- Masz **złożoną strukturę** relacji w bazie
- Testy są **długotrwałe** (Global teardown raz na końcu)
- Akceptujesz użycie **service role key** (admin)

**❌ Unikaj gdy:**
- Testy są **ścisle zależne** od czystej bazy
- Nie możesz użyć **service role key** (bezpieczeństwo)
- Potrzebujesz **debugować** z czystym stanem między testami
- Masz **konfliktujące dane** między testami

**📊 Przykładowy scenariusz:**
```
E-commerce z:
- Dynamiczna rejestracja (test-1234@example.com)
- Tabele: users, orders, products, payments, reviews
- Testy: Pełny flow rejestracji → zamówienie → płatność
- Złożone relacje + foreign keys

✓ Global Teardown idealnie pasuje
```

---

## Drzewo decyzyjne

```
START: Wybór strategii Teardown
│
├─ Czy testy TWORZĄ nowych użytkowników?
│  │
│  ├─ NIE (tylko logowanie na istniejące konto)
│  │  └─→ 🔵 Per-Test Teardown
│  │
│  └─ TAK (dynamiczna rejestracja)
│     └─→ Czy możesz użyć Service Role Key?
│        │
│        ├─ NIE (ograniczenia bezpieczeństwa)
│        │  └─→ 🔵 Per-Test Teardown + manualne czyszczenie
│        │
│        └─ TAK
│           └─→ 🟢 Global Teardown
│
└─ Czy izolacja między testami jest KRYTYCZNA?
   │
   ├─ TAK (każdy test musi mieć czystą bazę)
   │  └─→ 🔵 Per-Test Teardown
   │
   └─ NIE (testy są niezależne od siebie)
      └─→ Czy wydajność jest priorytetem?
         │
         ├─ TAK (testy są wolne)
         │  └─→ 🟢 Global Teardown
         │
         └─ NIE
            └─→ 🔵 Per-Test Teardown (prostsze)
```

---

## Najlepsze praktyki

### 🛡️ Bezpieczeństwo

#### 1. Identyfikacja użytkowników testowych
**Zawsze używaj ścisłych wzorców:**

```typescript
// ❌ ZŁE - za ogólne
if (email.includes('test')) { ... }

// ✅ DOBRE - precyzyjne wzorce
const testUserPatterns = [
  /^test-e2e-\d{13,}@example\.com$/,  // Timestamp (13+ cyfr)
  /^e2e-[a-f0-9-]{36}@test\.com$/,    // UUID
];

const isTestUser = testUserPatterns.some(pattern => 
  pattern.test(user.email)
);
```

#### 2. Podwójna weryfikacja przed usunięciem

```typescript
// Weryfikacja przed usunięciem każdego użytkownika
for (const user of usersToDelete) {
  const isTestUser = verifyIsTestUser(user);
  
  if (!isTestUser) {
    console.error(`🚨 SAFETY BLOCK: Refusing to delete ${user.email}`);
    continue; // SKIP!
  }
  
  await deleteUser(user.id);
}
```

#### 3. Service Role Key - ochrona

```bash
# .env.test (NIGDY nie commituj do repo!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# .gitignore
.env.test
.env*.local
```

---

### ⚡ Wydajność

#### 1. Optymalizacja kolejności usuwania

```typescript
// ✅ DOBRE - respektuj foreign keys
// 1. Usuń tabele zależne (z FK)
await db.from('order_items').delete().in('user_id', testUserIds);
await db.from('reviews').delete().in('user_id', testUserIds);

// 2. Usuń tabele główne
await db.from('orders').delete().in('user_id', testUserIds);
await db.from('products').delete().in('owner_id', testUserIds);

// 3. Usuń użytkowników
for (const userId of testUserIds) {
  await auth.admin.deleteUser(userId);
}
```

#### 2. Batch operations

```typescript
// ❌ ZŁE - pojedyncze operacje
for (const user of users) {
  await db.from('data').delete().eq('user_id', user.id);
}

// ✅ DOBRE - batch delete
await db.from('data').delete().in('user_id', userIds);
```

---

### 🧪 Izolacja testów

#### 1. Unikalne identyfikatory

```typescript
// Każdy test ma unikalny timestamp
const timestamp = Date.now();
const testEmail = `test-e2e-${timestamp}@example.com`;

// Lub UUID
import { randomUUID } from 'crypto';
const testEmail = `e2e-${randomUUID()}@test.com`;
```

#### 2. Prefiks namespace dla danych

```typescript
const testData = {
  title: `E2E_TEST_${timestamp}_My Task`,
  description: `Test data created at ${new Date().toISOString()}`,
};

// Łatwe czyszczenie:
await db.from('tasks')
  .delete()
  .like('title', 'E2E_TEST_%');
```

---

### 📊 Monitoring i logowanie

#### 1. Szczegółowe logi czyszczenia

```typescript
console.log('🧹 Starting teardown...');
console.log(`📋 Found ${users.length} test users`);
users.forEach(u => console.log(`   - ${u.email} (${u.id})`));

console.log(`✅ Deleted ${count} records`);
console.log('✨ Teardown completed');
```

#### 2. Metryki wydajności

```typescript
const startTime = Date.now();

await performCleanup();

const duration = Date.now() - startTime;
console.log(`⏱️ Cleanup took ${duration}ms`);
```

#### 3. Error handling

```typescript
try {
  await cleanupDatabase();
} catch (error) {
  console.error('❌ Teardown failed:', error);
  // NIE rzucaj błędu - nie przerywaj test suite
  // Tylko loguj problem
}
```

---

## Implementacja

### 🔵 Przykład: Per-Test Teardown

#### Struktura plików
```
tests/
├── teardown.ts              # Plik teardown
├── auth.spec.ts
└── dashboard.spec.ts
```

#### teardown.ts
```typescript
import { test as teardown } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

teardown('cleanup database', async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLIC_KEY!
  );

  const userId = process.env.E2E_USER_ID!;

  // Czyszczenie danych w kolejności (respektuj FK)
  await supabase.from('comments').delete().eq('user_id', userId);
  await supabase.from('posts').delete().eq('user_id', userId);
  await supabase.from('user_settings').delete().eq('user_id', userId);

  console.log('✅ Cleaned up data for test user');
});
```

#### playwright.config.ts
```typescript
export default defineConfig({
  projects: [
    {
      name: 'setup',
      testMatch: /teardown\.ts/,  // Wykonuje się po każdym teście
    },
    {
      name: 'tests',
      dependencies: ['setup'],     // Teardown po testach
      testMatch: /.*\.spec\.ts/,
    },
  ],
});
```

---

### 🟢 Przykład: Global Teardown

#### Struktura plików
```
tests/
├── global-teardown.ts       # Global teardown
├── auth.spec.ts
└── dashboard.spec.ts

playwright.config.ts
```

#### global-teardown.ts
```typescript
import { createClient } from '@supabase/supabase-js';

async function globalTeardown() {
  console.log('🧹 Starting global teardown...');

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,  // Admin key
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    // 1. Identyfikacja użytkowników testowych
    const { data: allUsers } = await supabase.auth.admin.listUsers();
    
    const testUsers = allUsers.users.filter((user) => {
      const email = user.email || '';
      return (
        /^test-e2e-\d{13,}@example\.com$/.test(email) ||
        user.id === process.env.E2E_USER_ID
      );
    });

    if (testUsers.length === 0) {
      console.log('✅ No test users found');
      return;
    }

    console.log(`📋 Found ${testUsers.length} test users`);

    const testUserIds = testUsers.map((u) => u.id);

    // 2. Usuwanie danych (respektuj foreign keys)
    const tables = ['comments', 'posts', 'user_settings'];
    
    for (const table of tables) {
      const { count } = await supabase
        .from(table)
        .delete({ count: 'exact' })
        .in('user_id', testUserIds);
      
      console.log(`✅ Deleted ${count} records from ${table}`);
    }

    // 3. Usuwanie kont
    let deletedCount = 0;
    for (const user of testUsers) {
      await supabase.auth.admin.deleteUser(user.id);
      deletedCount++;
    }

    console.log(`✅ Deleted ${deletedCount} user accounts`);
    console.log('✨ Teardown completed');

  } catch (error) {
    console.error('❌ Teardown failed:', error);
    // Nie rzucaj błędu - pozwól testom zakończyć się
  }
}

export default globalTeardown;
```

#### playwright.config.ts
```typescript
import { defineConfig } from '@playwright/test';
import { config } from 'dotenv';

config({ path: '.env.test' });

export default defineConfig({
  testDir: './tests',
  globalTeardown: './tests/global-teardown.ts',  // ← Kluczowa linia
  
  use: {
    baseURL: 'http://localhost:3000',
  },
});
```

#### .env.test
```bash
# Public key (dla testów)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_PUBLIC_KEY=eyJhbG...

# Service role key (dla teardown)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...  # NIGDY nie commituj!

# Test user
E2E_USER_ID=9f8e8911-912d-4c0b-92a0-4604845e4ee6
E2E_USERNAME=test@example.com
E2E_PASSWORD=Test123!
```

---

## Podejście hybrydowe

Możesz połączyć obydwie strategie:

```typescript
// teardown.ts - czyszczenie danych po każdym teście
teardown('cleanup data', async () => {
  // Używa public key, usuwa tylko DANE
  await supabase.from('posts').delete().eq('user_id', TEST_USER_ID);
});

// global-teardown.ts - usuwanie kont na końcu
async function globalTeardown() {
  // Używa service role, usuwa KONTA użytkowników
  for (const user of dynamicTestUsers) {
    await supabase.auth.admin.deleteUser(user.id);
  }
}
```

**Kiedy stosować:**
- Masz mix: predefiniowany user + dynamiczne konta
- Potrzebujesz czystych danych między testami
- Ale też chcesz usuwać utworzone konta

---

## Podsumowanie

### 📊 Macierz wyboru strategii

| Scenariusz | Predefiniowany User | Dynamiczni Users | Strategia |
|------------|---------------------|------------------|-----------|
| Blog CRUD | ✅ | ❌ | 🔵 Per-Test |
| E-commerce | ✅ | ✅ | 🟢 Global |
| Auth flow | ❌ | ✅ | 🟢 Global |
| Todo App | ✅ | ❌ | 🔵 Per-Test |
| Social Media | ✅ | ✅ | 🔵+🟢 Hybrid |

### ✅ Checklist przed implementacją

- [ ] Zidentyfikowałem model użytkowników testowych (predef/dynamic)
- [ ] Określiłem wymagania bezpieczeństwa (public vs service key)
- [ ] Zmapowałem relacje między tabelami (foreign keys)
- [ ] Wybrałem strategię teardown
- [ ] Zaimplementowałem ścisłe wzorce identyfikacji testowych userów
- [ ] Dodałem podwójną weryfikację przed usunięciem
- [ ] Zabezpieczyłem service role key (jeśli używam)
- [ ] Dodałem szczegółowe logowanie
- [ ] Przetestowałem czyszczenie na środowisku dev
- [ ] Udokumentowałem wybór strategii dla zespołu

### 🎯 Złota zasada

> **Nigdy nie usuwaj danych, których nie jesteś w 100% pewien, że są testowe.**
> 
> Lepiej pozostawić kilka testowych rekordów niż przypadkowo usunąć dane produkcyjne.

---

## Referencje

- [Playwright Global Setup/Teardown](https://playwright.dev/docs/test-global-setup-teardown)
- [Supabase Testing Guide](https://supabase.com/docs/guides/local-development/testing/overview)
- [Supabase Admin API](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser)
- [Testing Best Practices - Martin Fowler](https://martinfowler.com/articles/practical-test-pyramid.html)

---

**Autor:** Notatka powstała na podstawie analizy kursowego przykładu oraz własnej implementacji  
**Data utworzenia:** 2025-02-08  
**Wersja:** 1.0

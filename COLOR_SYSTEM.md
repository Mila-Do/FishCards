# 🎨 Funkcjonalny System Kolorów

## Przegląd

Aplikacja wykorzystuje funkcjonalny system kolorów oparty na przeznaczeniu, nie na nazwach kolorów. Dzięki temu łatwo można zmieniać kolory bez modyfikowania komponentów.

## 🌙 Główny Motyw - Dark Navy Mode

Aplikacja jest zoptymalizowana pod ciemny granatowy motyw z paletą:

- **Ciemne granaty**: Tło główne i powierzchnie
- **Niebieskie**: Główne akcje i przyciski
- **Błękitne**: Akcenty i stany pozytywne (zamiast zielonych)
- **Czerwienie**: Błędy i stany niebezpieczne
- **Żółcie**: Ostrzeżenia

## 📋 Zmienne CSS

### Kolory Podstawowe

```css
--background: oklch(0.08 0.05 240) /* Bardzo ciemny granatowy - tło główne */ --foreground: oklch(0.92 0 0)
  /* Jasny tekst */;
```

### Kolory Funkcjonalne

#### Primary (Niebieski) - Główne akcje

```css
--primary: oklch(0.55 0.15 220) /* Blue-400 - jasny niebieski */ --primary-foreground: oklch(0.98 0 0)
  /* Biały tekst na primary */ --primary-hover: oklch(0.45 0.18 220) /* Blue-500 - hover state */;
```

#### Secondary (Granat) - Akcje drugorzędne

```css
--secondary: oklch(0.45 0.12 240) /* Navy-500 - jasniejszy granat */ --secondary-foreground: oklch(0.92 0 0)
  /* Jasny tekst na secondary */ --secondary-hover: oklch(0.35 0.15 240) /* Navy-600 - hover state */;
```

#### Accent (Błękitny) - Akcenty i podkreślenia

```css
--accent: oklch(0.65 0.12 200) /* Light blue-300 - błękitny */ --accent-foreground: oklch(0.08 0.05 240)
  /* Ciemny granat na accent */ --accent-hover: oklch(0.75 0.1 200) /* Light blue-200 - hover */;
```

#### Surface - Karty i sekcje

```css
--surface: oklch(0.12 0 0) /* Gray-900 */ --surface-foreground: oklch(0.92 0 0) /* Tekst na surface */
  --surface-border: oklch(0.2 0 0) /* Granice surface */;
```

#### Success (Błękitny) - Stany pozytywne

```css
--success: oklch(0.65 0.12 200) /* Light blue-300 - błękitny zamiast zielonego */
  --success-foreground: oklch(0.08 0.05 240) /* Ciemny granat na success */ --success-muted: oklch(0.15 0.08 200)
  /* Light blue-900/20 - tło success */;
```

#### Warning (Żółty) - Ostrzeżenia

```css
--warning: oklch(0.7 0.15 80) /* Amber-400 */ --warning-foreground: oklch(0.08 0 0) /* Tekst na warning */
  --warning-muted: oklch(0.15 0.08 80) /* Tło warning */;
```

#### Danger (Czerwony) - Błędy

```css
--danger: oklch(0.65 0.25 25) /* Red-400 */ --danger-foreground: oklch(0.08 0 0) /* Tekst na danger */
  --danger-muted: oklch(0.15 0.08 25) /* Tło danger */;
```

#### Muted - Elementy drugorzędne

```css
--muted: oklch(0.25 0 0) /* Gray-700 */ --muted-foreground: oklch(0.65 0 0) /* Gray-400 */;
```

## 🎯 Zastosowanie w Komponentach

### Klasy Tailwind

#### Kolory główne

- `bg-background` / `text-foreground` - Tło i tekst główny
- `bg-surface` / `text-surface-foreground` - Karty i sekcje

#### Akcje

- `bg-primary` / `text-primary-foreground` - Główne przyciski
- `bg-secondary` / `text-secondary-foreground` - Przyciski drugorzędne
- `text-accent` / `border-accent` - Akcenty i linki

#### Stany

- `bg-success` / `text-success` - Pozytywne (zaakceptowane)
- `bg-warning` / `text-warning` - Ostrzeżenia (progress)
- `bg-danger` / `text-danger` - Błędy (odrzucone)

#### Elementy drugorzędne

- `text-muted-foreground` - Tekst pomocniczy
- `border-surface-border` - Granice sekcji

### Przykłady użycia

```tsx
// Główny przycisk akcji
<Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
  Generuj fiszki
</Button>

// Karta z zawartością
<Card className="bg-surface border-surface-border">
  <CardContent className="text-surface-foreground">
    Zawartość karty
  </CardContent>
</Card>

// Komunikat błędu
<div className="bg-danger-muted border-danger text-danger">
  Wystąpił błąd
</div>

// Tekst pomocniczy
<p className="text-muted-foreground">
  Dodatkowe informacje
</p>
```

## 🔄 Zmiana Kolorów

Aby zmienić schemat kolorów, wystarczy zmodyfikować zmienne CSS w `src/styles/global.css`:

### Przykład - Zmiana na niebieski motyw:

```css
.dark {
  --primary: oklch(0.55 0.15 240); /* Blue-400 */
  --primary-hover: oklch(0.45 0.18 240); /* Blue-500 */
  --accent: oklch(0.65 0.12 240); /* Blue-300 */
  /* ... */
}
```

### Przykład - Zmiana na fioletowy motyw:

```css
.dark {
  --primary: oklch(0.55 0.15 280); /* Purple-400 */
  --primary-hover: oklch(0.45 0.18 280); /* Purple-500 */
  --accent: oklch(0.65 0.12 280); /* Purple-300 */
  /* ... */
}
```

## ✨ Zalety Systemu

1. **Funkcjonalne nazwy** - `primary` zamiast `blue-600`
2. **Łatwa zmiana motywu** - tylko zmienne CSS
3. **Spójność** - wszystkie komponenty używają tych samych tokenów
4. **Dostępność** - kolory dobrane pod kątem kontrastu
5. **Skalowalnośc** - łatwo dodać nowe kolory funkcjonalne

## 🎨 Paleta Kolorów (Dark Navy Mode)

| Funkcja    | Kolor          | Zastosowanie               |
| ---------- | -------------- | -------------------------- |
| Primary    | Blue-400       | Główne przyciski, linki    |
| Secondary  | Navy-500       | Przyciski drugorzędne      |
| Accent     | Light Blue-300 | Akcenty, podkreślenia      |
| Success    | Light Blue-300 | Stany pozytywne (błękitny) |
| Warning    | Amber-400      | Ostrzeżenia                |
| Danger     | Red-400        | Błędy, usuwanie            |
| Surface    | Dark Navy-900  | Karty, sekcje              |
| Background | Very Dark Navy | Tło główne                 |
| Muted      | Dark Navy-700  | Elementy drugorzędne       |

Wszystkie kolory są zoptymalizowane pod kątem czytelności i dostępności w ciemnym granatowym motywie.

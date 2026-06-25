# Ostatnia Tarcza

Kosmiczna strzelanka 2D w obronie Ziemi przed atakującym Rojem obcych.
Działa w przeglądarce na desktopie i urządzeniach mobilnych.

**Stack:** [Phaser 3](https://phaser.io) + [Vite](https://vitejs.dev) · grafika: [Kenney — Simple Space](https://kenney.nl)

## Wymagania

- Node.js (wersja przypięta w `.nvmrc` — `nvm use` ją aktywuje)

## Uruchomienie

```bash
nvm use            # aktywuje przypiętą wersję Node
npm install        # instalacja zależności (raz)
npm run dev        # serwer deweloperski → http://localhost:5173
npm run dev -- --host   # dostęp z telefonu w tej samej sieci Wi-Fi
```

Build produkcyjny (statyczny, do wrzucenia na dowolny hosting — GitHub Pages, Netlify…):

```bash
npm run build      # generuje dist/
npm run preview    # podgląd builda lokalnie
```

## Sterowanie

- **Desktop:** strzałki / WASD do ruchu, ogień automatyczny. Mysz też porusza statkiem (przeciąganie).
- **Mobile:** przeciągnij palcem, by przesuwać statek. Ogień automatyczny.

## Rozgrywka (MVP — Sektor 1: Pas Asteroid)

Odpieraj 5 fal Roju zakończonych mini-bossem (Krążownik Roju). Chroń integralność
Ziemi — każdy wróg, który ucieknie dołem ekranu, ją uszkadza. Zbieraj power-upy:

- ➕ **Naprawa** — przywraca punkt życia statku
- ❗ **Potrójny ogień** — czasowo potrójny strzał
- ✚ **Tarcza** — chwilowa nietykalność

## Struktura

```
src/
  main.js              # konfiguracja Phasera, rejestr scen
  config.js            # wymiary, kolory, ścieżki assetów, balans
  starfield.js         # przewijane paralaksowe tło z gwiazd
  scenes/
    BootScene.js       # ładowanie assetów + proceduralne tekstury
    MenuScene.js       # ekran tytułowy
    BriefingScene.js   # briefing fabularny (efekt pisania)
    GameScene.js       # rdzeń rozgrywki
    ResultScene.js     # ekran zwycięstwa / porażki
assets/                # grafika Kenneya (serwowana jako publicDir Vite)
```

## Plan rozbudowy

Kolejne sektory (Orbita Marsa, Stacja Przeładunkowa, Pas Księżycowy, Niebo nad Ziemią),
bossowie, dźwięk, więcej typów wrogów i wzorców ataku.

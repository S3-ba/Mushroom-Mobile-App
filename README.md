# 🍄 Grzybobranie

Mobilna aplikacja grzybiarska napisana w **React Native + Expo (SDK 58)** — projekt zadania rekrutacyjnego Software Mansion.
Atlas grzybów z modelami 3D, rozpoznawanie ze zdjęcia, mapa obserwacji, dziennik zbiorów, forum, poradnik i quiz — a wszystko tak, żeby dało się z tego korzystać **w lesie, bez zasięgu**.

> ⚠️ Aplikacja ma charakter edukacyjny. Rozpoznawanie ze zdjęcia to tylko podpowiedź — **nigdy nie jedz grzyba wyłącznie na tej podstawie**. Wątpliwe okazy pokaż grzyboznawcy (np. w lokalnym sanepidzie). Przy podejrzeniu zatrucia dzwoń na 112.

## Zrzuty ekranu i wideo

**[do uzupełnienia: nagranie GIF/MP4 lub zrzuty ekranu z folderu `docs/screenshots`]**

| Menu | Atlas | Szczegóły + 3D | Rozpoznawanie |
| --- | --- | --- | --- |
| `docs/screenshots/home.png` | `docs/screenshots/atlas.png` | `docs/screenshots/detail.png` | `docs/screenshots/recognize.png` |

## Platforma i testowanie

- **Przygotowana głównie pod:** Android (emulator) — **[do uzupełnienia po testach]**
- **Testowane na fizycznym urządzeniu:** **[do uzupełnienia: tak / nie — jakie urządzenie]**
- iOS: kod jest wieloplatformowy (Expo), ale **[do uzupełnienia: czy testowano]**

## Uruchomienie

Wymagania: **Node.js ≥ 22.13**, Android Studio z emulatorem (obraz z Google Play / Google APIs, żeby działała mapa).

```bash
git clone <adres-repozytorium> && cd grzybobranie
npm install
npx expo install --fix      # dopasowuje wersje bibliotek do dokładnie tych, które wspiera Expo SDK 58
npx expo start --android    # Expo CLI doinstaluje Expo Go (SDK 58) na emulatorze
```

- Przy pierwszym uruchomieniu podaj internet: aplikacja pobierze zdjęcia z Wikipedii (opcjonalnie — przycisk „Pobierz” w Atlasie zapisuje je na urządzeniu).
- `npm test` — testy logiki (filtry, ranking rozpoznawania na syntetycznych obrazach, statystyki, quiz, spójność bazy gatunków).
- `npm run typecheck` — sprawdzenie typów, `npx expo-doctor` — diagnostyka projektu.
- Development build (opcjonalnie): `npx expo run:android`. Mapa w buildzie natywnym wymaga klucza Google Maps (`android.config.googleMaps.apiKey` w `app.json`); w Expo Go działa bez konfiguracji.

## Funkcje

| Moduł | Co robi |
| --- | --- |
| **Menu główne** | Fotografia grzyba w tle (z Wikimedia Commons, z powolnym „Ken Burns”; offline — wbudowana ilustracja), karta „Sezon teraz” z alertem o gatunkach trujących, przyciski do wszystkich modułów. |
| **Pływający pasek nawigacji** | Widoczny na każdym ekranie (także na szczegółach i w formularzach), 6 pozycji, wyróżniona akcja „Rozpoznaj”, animowana „pigułka” aktywnej zakładki, chowa się przy klawiaturze. Quiz mieszka razem z poradnikiem w zakładce **Nauka**. |
| **Atlas** | 25 gatunków. Wyszukiwarka (bez wrażliwości na polskie znaki), filtry cech: jadalność, spód kapelusza, siedlisko, „teraz w sezonie”, „łatwe do rozpoznania”. Szczegóły: parallax, cechy rozpoznawcze, kalendarz owocnikowania (SVG), **sobowtóry z ostrzeżeniami**, wskazówki, **model 3D** (obracany palcem, pinch-to-zoom). |
| **Rozpoznawanie** | Aparat / galeria / zdjęcie przykładowe → animowana analiza → ranking kandydatów z oznaczeniem jadalności, ostrzeżeniem o trujących i możliwością **doprecyzowania cech** (ranking przelicza się na żywo). Z wyniku można dodać zbiór lub zapytać na forum. |
| **Mapa** | Prawdziwe obserwacje gatunków w Polsce z API **GBIF** zagregowane do siatki (heat-grid), filtr dla konkretnego grzyba, warstwa „Moje znaleziska”, lokalizacja użytkownika, nawigacja do znaleziska w zewnętrznej aplikacji map, ciemny styl mapy w kolorach aplikacji. |
| **Zbiory** | Dodawanie zbiorów ze zdjęciem, gatunkiem, liczbą, wagą, notatką i lokalizacją; **podsumowanie dnia**, statystyki, wykres 7 dni (SVG), historia pogrupowana po dniach. |
| **Forum** | Wpisy „Co to za grzyb?” i „Pochwal się” ze zdjęciem, komentarze (z możliwością wskazania gatunku z atlasu), **polubienia** z animacją, oznaczanie rozwiązania. Dane lokalne (patrz niżej). |
| **Nauka** | **Poradnik** dla początkujących (ekwipunek z zapisywaną listą kontrolną, gdzie i kiedy zbierać, bezpieczeństwo, mity vs fakty, pasek postępu czytania) oraz **Quiz** (8 losowych pytań z puli 26, wyjaśnienia, passa, rekord). |

## Tryb offline

| Działa bez internetu | Wymaga internetu (przy pierwszym użyciu), potem działa z cache |
| --- | --- |
| Cała baza gatunków, opisy, filtry, wyszukiwarka | Zdjęcia gatunków (Wikipedia) — przycisk „Pobierz zdjęcia” w Atlasie |
| Modele 3D i ilustracje (generowane proceduralnie) | Obserwacje na mapie (GBIF) — zapisują się per gatunek |
| **Rozpoznawanie** (analiza na urządzeniu) | Kafelki mapy bazowej (zależą od dostawcy) |
| Poradnik, quiz, zbiory, forum (dane lokalne), checklista | |

Dane użytkownika (zbiory, forum, ustawienia) trzymane są lokalnie: `zustand` + `AsyncStorage`, zdjęcia kopiowane do katalogu dokumentów aplikacji.

## Jak działa rozpoznawanie (uczciwie)

Silnik jest **w całości offline i bez natywnych modułów ML** (działa w Expo Go):

1. Zdjęcie jest zmniejszane do ~96 px (`expo-image-manipulator`) i dekodowane w JS (`jpeg-js`).
2. Środek kadru (ważony rozkładem Gaussa) jest klasyfikowany piksel po pikselu do palety typowych barw kapeluszy w przestrzeni **CIE-Lab**; tło (zieleń liści, niebo, cień) jest odrzucane.
3. Rozkład barw + wykrycie białych kropek są porównywane z profilem każdego z 25 gatunków.
4. Użytkownik może potwierdzić cechy (spód, miejsce, pierścień, kształt) — to działa jak klucz oznaczania i mocno zawęża wynik.

To **heurystyka, nie sieć neuronowa** — dlatego wynik jest pokazywany jako „dopasowanie” (maks. 92%), z poziomem pewności i zawsze z ostrzeżeniem. Silnik jest odseparowany (`src/features/recognition`), więc podmiana na model TFLite / API wymaga zaimplementowania jednej funkcji zwracającej listę kandydatów.

## Architektura

```
src/
├─ app/                      # Expo Router (file-based routing)
│  ├─ _layout.tsx            # fonty, SafeArea, Toasty, ekran powitalny z zastrzeżeniem
│  └─ (tabs)/
│     ├─ _layout.tsx         # Tabs z ukrytym domyślnym paskiem + <FloatingTabBar/>
│     ├─ index.tsx           # menu główne
│     ├─ learn.tsx           # poradnik + quiz
│     ├─ recognize.tsx       # kamera → analiza → wynik
│     ├─ map.tsx             # mapa obserwacji
│     ├─ atlas/ harvest/ forum/   # zagnieżdżone stosy (lista → szczegóły/formularz)
├─ components/               # ui/ (prymitywy), mushroom/ (karty, 3D, SVG), FloatingTabBar
├─ features/                 # logika domenowa: recognition, atlas (filtry), guide, quiz, map, forum
├─ services/                 # Wikipedia API, GBIF API, pliki, przetwarzanie obrazu
├─ store/                    # zustand (+persist): zbiory, forum, ustawienia, toast
├─ data/                     # baza 25 gatunków + typy
├─ theme/ hooks/ utils/
```

Najważniejsze decyzje:

- **Pasek nawigacji poza `Tabs`** – własny `FloatingTabBar` czyta aktywną zakładkę z URL (`usePathname`) i nawiguje routerem, więc jest widoczny także na ekranach zagnieżdżonych i nie zależy od wewnętrznych API React Navigation.
- **Modele 3D bez plików** – każdy gatunek opisuje parametryczny `Model3D` (profil kapelusza, trzon, pierścień, blaszki/rurki, kropki, kępy, półki); `three.js` buduje geometrię z `LatheGeometry`, a ten sam opis generuje ilustrację SVG. Widok 3D ładuje się leniwie i ma `ErrorBoundary` (w razie problemu z GL pokazuje ilustrację).
- **Dane z API + cache** – zdjęcia i metadane z Wikipedia REST API (cache w `AsyncStorage` + dysk `expo-image`), obserwacje z GBIF (agregacja do siatki 0,2°×0,3° i zapis lokalny).
- **Mikroanimacje (Reanimated)** – sprężynowe skalowanie przycisków z haptyką, ślizgająca się pigułka paska, parallax w szczegółach, przeliczanie rankingu z animacją układu, „pop” polubień, trzęsienie błędnej odpowiedzi w quizie, wykresy SVG rosnące od zera. Efekty są stonowane.
- **Bezpieczeństwo w UX** – ostrzeżenia przy gatunkach trujących, lista sobowtórów, jednorazowe zastrzeżenie przy pierwszym uruchomieniu, brak sformułowań „na pewno jadalny”.

## Źródła danych i licencje

- Zdjęcia: **Wikipedia / Wikimedia Commons** (różne licencje CC; w aplikacji jest odnośnik do źródła przy każdym gatunku).
- Obserwacje: **GBIF.org** (otwarte dane o bioróżnorodności; licencje zależne od zbioru danych).
- Czcionki: Fraunces i DM Sans (SIL OFL). Ikony: Ionicons / Material Community Icons.
- Treści opisowe (atlas, poradnik, quiz) zostały napisane na potrzeby projektu; klasyfikacja jadalności zgodna z polskimi atlasami grzybów.

## Ograniczenia i dalszy rozwój

- **Forum działa lokalnie** (bez serwera) — dane są odizolowane w `src/store/forum.ts`, więc podpięcie Supabase/Firebase to zmiana w jednym pliku. Wpisy oznaczone „przykład” to dane demonstracyjne.
- Rozpoznawanie oparte na kolorze i cechach — kolejny krok to model ML (np. TFLite w development buildzie).
- Mapa bazowa nie jest cache’owana offline (obserwacje i znaleziska tak).
- Pomysły: powiadomienia o sezonie, kafelki mapy offline, eksport zbiorów, wersja w innych językach.

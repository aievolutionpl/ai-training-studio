<div align="center">

# AI Training Studio

### Od tematu do szkolenia, które potrafisz poprowadzić.

**Edytowalny PowerPoint · skrypt trenera · materiały uczestnika**

[![Tests](https://github.com/aievolutionpl/ai-training-studio/actions/workflows/test.yml/badge.svg)](https://github.com/aievolutionpl/ai-training-studio/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/code-MIT-4338ca)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-166534)](https://nodejs.org/)

Lokalny warsztat AI Evolution Polska dla trenerów, twórców szkoleń i zespołów firmowych.

</div>

## Co otrzymujesz

Podajesz temat, odbiorców i cel. Wybierasz jeden z ośmiu stylów, poprawiasz konspekt i zlecasz opracowanie Codex. Edytujesz wynik, sprawdzasz raport i pobierasz pakiet.

| Plik                          | Do czego służy                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| `prezentacja.pptx`            | Edytowalne teksty, kształty i diagramy. Osadzone obrazy i ikony, odtwarzanie offline. |
| `skrypt-trenera.md`           | Narracja do **każdego slajdu**, wskazówki prowadzenia i szacowany czas.               |
| `materialy-uczestnika.md`     | Objaśnienia treści, cele i miejsce na pracę własną. Bez pola notatek trenera.         |
| `slownik.md`                  | Pojęcia z definicjami i przykładami.                                                  |
| `cwiczenia.md`                | Karty pracy do ćwiczeń w prezentacji.                                                 |
| `plan-szkolenia.md`           | Kolejność slajdów i szacowany rozkład czasu.                                          |
| `zrodla.md`                   | Źródła i opis wspieranych twierdzeń, do kontroli przez trenera.                       |
| `test-uczestnika.md`          | Opcjonalny test, wybierany przy tworzeniu.                                            |
| `TYLKO-TRENER-klucz-testu.md` | Oddzielne odpowiedzi i wyjaśnienia.                                                   |
| `deck.json`                   | Wspólne, edytowalne źródło wszystkich materiałów.                                     |
| `kontrola-jakosci.json`       | Uwagi o tekście, narracji, czasie i brakach.                                          |

Po udanej generacji serwer zapisuje ZIP i osobne dokumenty w `projects/<id>/`. ZIP pobierzesz również z edytora. Dokumenty są w Markdown, otwieranym w edytorze tekstu; eksport DOCX nie jest jeszcze dostępny.

## Uruchom w kilka minut

Wymagania: **Node.js 22+**, konto i aktywne logowanie Codex do generowania. Sam podgląd oraz eksport gotowego JSON nie wymagają logowania.

```bash
git clone https://github.com/aievolutionpl/ai-training-studio.git
cd ai-training-studio
npm ci
npx codex login
npm start
```

Otwórz **http://localhost:4317**. W Windows możesz użyć `Start-Studio.ps1` po instalacji zależności.

1. Określ temat, odbiorców, cel i czas. Punkt wyjścia: **40 minut / 20 slajdów**.
2. Obejrzyj style i wybierz kierunek wizualny. Test końcowy domyślnie jest wyłączony.
3. Dostosuj konspekt przed generacją.
4. Sprawdź teksty, skrypty, źródła i raport. Dobierz ikony oraz ilustracje.
5. Pobierz ZIP. Otwórz PPTX w PowerPoint i przejrzyj slajdy przed szkoleniem.

**Nie wysyłaj uczestnikom całego ZIP bez sprawdzenia zawartości:** może zawierać klucz testu i prywatne instrukcje prowadzenia.

## Osiem kierunków wizualnych

| Styl            | Charakter                                            |
| --------------- | ---------------------------------------------------- |
| AI Evolution    | Granat, fiolet, ilustracyjna okładka                 |
| Editorial       | Ciepły papier, szeryfowa typografia, ceglasty akcent |
| Swiss Precision | Jasna siatka, niebieski akcent, czytelna treść       |
| Midnight        | Ciemna zieleń, złoto, spokojny keynote               |
| Human First     | Ciepła, zielona paleta i ilustracyjna okładka        |
| Blueprint       | Techniczna typografia, granat i turkus               |
| Bold Ideas      | Żółty i fioletowy kontrast dla warsztatu             |
| Soft Gradient   | Różowa paleta i śliwkowy tekst                       |

Każdy styl ma podgląd w aplikacji. Układy: okładka, karty, proces, porównanie, ćwiczenie i główna myśl. Procesy i porównania powstają z natywnych obiektów PowerPoint.

<p align="center">
<img src="public/icons/target.svg" width="42" alt="Cel" /> &nbsp;
<img src="public/icons/group.svg" width="42" alt="Zespół" /> &nbsp;
<img src="public/icons/ai.svg" width="42" alt="AI" /> &nbsp;
<img src="public/icons/chart.svg" width="42" alt="Wykres" /> &nbsp;
<img src="public/icons/shield.svg" width="42" alt="Bezpieczeństwo" /> &nbsp;
<img src="public/icons/microphone.svg" width="42" alt="Narracja" />
</p>

**Astra Icons:** 12 dołączonych ikon SVG, wybór w edytorze, kolor dopasowany do stylu w PPTX. Bez CDN i bez dodatkowego frameworka. Ikony są obiektami graficznymi SVG, nie natywnymi kształtami do rozbierania na części.

## Jak pisze trener

Agent otrzymuje zasady: jedna myśl na slajd, wyjaśnienie pojęcia, przykład z firmy, ćwiczenie i omówienie. Przykłady fikcyjne mają być oznaczone. Bez wymyślonych statystyk, pustych sloganów i wstępów o „dynamicznie zmieniającym się świecie”.

`voiceScript` zawiera wypowiedź, `notes` instrukcje prowadzenia, a `participantNotes` samodzielne objaśnienie dla uczestnika. Docelowo skrypt ma **120–280 słów**, czyli około 1–2 minut przy 140 słowach/min. To szacunek, nie pomiar. Raport uwzględnia dodatkowo `activityMinutes` i ostrzega o rozbieżności z czasem modułu. Skrypt jest tekstem, nie plikiem audio.

## Obrazy: Codex i fal.ai

**W rozmowie Codex:** aplikacja przygotowuje `imagegen-task.json`. Przekaż go agentowi z poleceniem użycia wbudowanego imagegen. Po wygenerowaniu:

```bash
node image-import.mjs ABSOLUTE_IMAGE_PATH CACHE_ID
```

Importer zwróci ścieżkę `generated/...png`, którą dołączasz w edytorze. Przeglądarka i proces Codex CLI **nie mają automatycznego dostępu** do imagegen z rozmowy.

**Zewnętrzny program:** ustaw `FAL_KEY` w środowisku serwera i wywołuj `POST /api/images` z `provider: "fal"`. Przykład PowerShell:

```powershell
$env:FAL_KEY = '<twój-klucz>'
$env:FAL_MAX_IMAGES = '6'
npm start
```

Nie umieszczaj klucza w kodzie ani briefie. `.env.example` dokumentuje zmienne; `npm start` nie wczytuje `.env` automatycznie. Profile: podgląd FLUX Schnell, final FLUX dev. Cache i deduplikacja ograniczają ponowne generowanie. Limit dotyczy prób podczas uruchomienia serwera, nie budżetu w dolarach. Nie wykonujemy automatycznych ponowień płatnych żądań. Szczegóły: [IMAGE-WORKFLOW.md](IMAGE-WORKFLOW.md).

## Praca bez interfejsu

```bash
npm run export -- deck.json output.pptx
npm test
```

CLI zapisuje PPTX, ZIP szkolenia i dokumenty obok pliku wyjściowego. Dołączony [przykład brief-ai.json](examples/brief-ai.json) zawiera 5 slajdów na 10 minut, skrypty po około 160 słów i ćwiczenia. Wypróbuj `npm run export -- examples/brief-ai.json przyklad.pptx`. Agent pracujący w repo powinien zacząć od [AGENTS.md](AGENTS.md).

Najważniejsze moduły: `engine.mjs` i `layouts.mjs` renderują PPTX; `training.mjs` waliduje i pakuje materiały; `training-prompt.mjs` definiuje instrukcje dydaktyczne; `images.mjs` obsługuje ilustracje; `server.mjs` uruchamia zadania i zapisuje wyniki; `public/` zawiera lokalny edytor.

## Co wykorzystujemy z innych projektów

- **PptxGenJS:** rzeczywisty silnik eksportu.
- **Astra Icons:** dołączone pliki SVG z licencją MIT.
- **Presenton:** opcjonalny adapter API, bez działającej instancji w zestawie.
- **PPTAgent:** inspiracja podziałem oceny treści, wyglądu i spójności. Nasz raport to reguły, nie model vision.
- **Quarto:** inspiracja wspólnym źródłem prezentacji i dokumentacji. Nie jest zależnością.
- **Genspark:** inspiracja kolejnością brief → konspekt → edytor. Nie kopiujemy kodu ani zamkniętych szablonów.

Pełne informacje: [integracje](REPOSITORY-INTEGRATIONS.md), [licencje i pochodzenie](THIRD-PARTY-NOTICES.md).

## Status i ograniczenia

To rozwijane **lokalne studio**, nie gotowa wieloużytkownikowa usługa SaaS.

- Research jest zadaniem Codex z włączonym wyszukiwaniem. Źródła wymagają kontroli człowieka; nie ma niezależnego automatycznego fact-checkera.
- Konspekt początkowy jest szkieletem dydaktycznym do edycji, nie wynikiem osobnego researchu.
- HTML pokazuje przybliżenie. Testy sprawdzają eksport, strukturę ZIP, notatki, ikony i materiały; nie potwierdzają wyglądu w PowerPoint.
- Czcionki nie są osadzane. Zainstaluj je na komputerze prezentującym lub sprawdź zamienniki.
- Renderowanie PNG/PDF wymaga działającej automatyzacji PowerPoint (`render-powerpoint.ps1`). Na obecnym hoście COM nie był dostępny.
- Brak importu masterów PPTX, DOCX/PDF materiałów i nagrywania głosu.
- `npm audit` zgłasza dwa wpisy high w zależności image-size. Przeczytaj [SECURITY.md](SECURITY.md) przed użyciem niezaufanych plików.
- Generowanie Codex wymaga sieci i dostępnego limitu konta. fal.ai wymaga osobnego klucza i rozliczenia. Nie obiecujemy dostępu do API w ramach subskrypcji Codex.

## Rozwój

Zgłoszenia i PR mile widziane. Priorytety: zgodność podglądu z PPTX, wizualne testy regresji, eksport DOCX/PDF oraz mocniejsza walidacja źródeł. Do zmian eksportera dodaj test struktury wynikowego pliku i sprawdź rzeczywisty slajd.

Kod: MIT. Materiały zewnętrzne zachowują własne licencje. Nazwa i logo AI Evolution Polska identyfikują autora projektu.

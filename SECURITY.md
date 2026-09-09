# Bezpieczeństwo lokalnego Studio

Studio to narzędzie jednoosobowe. Serwer nasłuchuje na 127.0.0.1 i sprawdza Host oraz Origin. Nie wystawiaj go przez tunel ani na publicznym serwerze. Brakuje uwierzytelniania, izolacji użytkowników i produkcyjnych limitów zadań.

- Klucze ustawiaj w środowisku procesu. Nie zapisuj ich w briefach, promptach, JSON prezentacji ani repo.
- projects/ zawiera briefy, odpowiedzi i pakiety. public/assets/generated/ zawiera obrazy. Te foldery i .env są ignorowane przez Git.
- Research i generowanie wymagają sieci. Brief trafia do usługi skonfigurowanej przez logowanie Codex; prompt obrazu trafia do fal.ai tylko po wybraniu tego dostawcy.
- Materiały dla uczestnika i klucz testu są oddzielnymi plikami, ale pełny ZIP zawiera oba. Trener wybiera pliki przed rozesłaniem.
- Markdown jest tekstem, nie wykonujemy osadzonego HTML. Sprawdź linki przed otwarciem.
- Import obrazów dopuszcza PNG/JPEG z limitem 12 MB. Nie importuj niezaufanych plików. SVG pochodzą wyłącznie z dołączonego zestawu ikon.

## Znane zależności

`npm audit` na 2026-09-09 wykazuje dwa wpisy high w łańcuchu PptxGenJS / image-size, dotyczące parserów ICNS/JXL/HEIF. Te formaty nie są obsługiwane przez importer Studio. To ograniczenie ekspozycji, nie naprawa biblioteki. Szczegóły: DEPENDENCY-NOTES.md. Nie używaj automatycznego downgrade eksportera proponowanego przez `npm audit fix --force`.

Nie publikuj sekretów w zgłoszeniach GitHub. Opisz problem z użyciem syntetycznych danych i minimalnego przykładu.

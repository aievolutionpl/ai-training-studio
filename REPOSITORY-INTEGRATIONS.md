# Wykorzystanie repozytoriów — stan implementacji

## PptxGenJS

Zależność produkcyjna MIT. Własne kompozycje natywnego PowerPoint w engine.mjs i layouts.mjs. Proces ma numerowane kroki i łączniki, porównanie ma dwie kolumny, ćwiczenie panel prowadzącego i instrukcje. Obrazy osadzone lokalnie.

## Presenton

presenton.mjs implementuje prawdziwe wywołanie API /api/v1/ppt/presentation/generate, przekazując już opracowaną treść przez slides_markdown. Wymaga uruchomionej instancji i klucza. Nie jest domyślnym backendem; nie przetestowano na żywej instancji. Źródło kontraktu: https://github.com/presenton/presenton (README, dostęp 2026-09-08). Nie kopiowano kodu projektu.

## PPTAgent

Własny quality.mjs ocenia reguły w trzech kategoriach content/design/coherence. To nie PPTEval ani model oceny wizualnej. Raport nigdy nie oznacza slajdów jako wizualnie sprawdzonych. Źródło inspiracji: https://github.com/icip-cas/PPTAgent.

## Quarto

Eksport skryptu trenera jako Markdown z tego samego źródła. Nie wymaga Quarto, nie uruchamia konwersji Quarto. https://quarto.org/docs/presentations/powerpoint.html

## Slidev i dom-to-pptx

Nie włączono do pipeline'u. Wprowadzenie drugiego renderera bez testów zgodności zwiększyłoby rozbieżności podglądu i PowerPoint. Własny eksport pozostaje natywny.

## Weryfikacja wizualna

render-powerpoint.ps1 eksportuje PNG oraz PDF przez PowerPoint COM, jeśli Office jest prawidłowo zarejestrowany. Próba 2026-09-08 zwróciła REGDB_E_CLASSNOTREG. Istnienie POWERPNT.EXE nie oznacza dostępności COM. Nie uzyskano podglądów z PowerPoint na tym hoście.

# Obrazy: Codex i aplikacje zewnętrzne

Codex: edytor → Ilustracja → Codex imagegen → pobierz imagegen-task.json. W rozmowie Codex poproś o wygenerowanie obrazu według plan.prompt i import z plan.id przez image-import.mjs. Wklej otrzymaną ścieżkę generated/...png w edytorze. PNG/JPEG zostaje osadzony w PPTX. Nie ma automatycznego mostu z przeglądarki do narzędzia imagegen.

fal.ai: ustaw FAL_KEY w zmiennej środowiskowej procesu serwera. Sam plik .env nie jest automatycznie ładowany. Uruchom Studio ponownie. Nie wpisuj klucza w czacie ani przeglądarce.

API: POST /api/images, JSON {provider:"fal",quality:"draft",prompt:"...",style:"..."}. Zwraca status, asset i url. POST /api/export przyjmuje slide.image z otrzymaną ścieżką. GET /api/images/config pokazuje dostępność klucza, nigdy jego wartość.

Profile: draft = fal-ai/flux/schnell, 4 kroki, 1024×576; final = fal-ai/flux/dev, 28 kroków, 1536×864. To konserwatywne profile początkowe, nie wynik porównawczego benchmarku. Źródła kontraktów: https://fal.ai/models/fal-ai/flux/schnell/api oraz https://fal.ai/models/fal-ai/flux/dev/api (2026-09-08).

Optymalizacja: jedna ilustracja na żądanie; cache zależny od pełnego promptu, stylu i jakości; współdzielenie równoczesnych identycznych żądań; limit 6 prób fal na uruchomienie (FAL_MAX_IMAGES); brak automatycznych płatnych retry. Limit nie jest budżetem walutowym i resetuje się przy restarcie. Błąd po stronie dostawcy może być płatny. Cache nie zakłada identyczności kolejnych wersji modelu. Klucz wymagany do testu na żywo; bez klucza dostępne są testy kontraktów i tryb Codex.

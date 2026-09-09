# Pracownia slajdów

Otwórz http://localhost:4317/editor.html?module=M01 albo wybierz „Edytuj w Studio” w galerii BUR. Uruchomienie całego systemu: START_BUR.ps1.

## Praca na slajdzie

- Kliknij element, aby go zaznaczyć. Dwuklik w napis umożliwia pisanie bezpośrednio na slajdzie.
- Przeciągaj elementy, używaj uchwytów rozmiaru i obrotu. Shift + klik zaznacza kilka elementów.
- Panel po prawej ustawia pozycję, rozmiar, obrót, krycie, krój, wielkość i styl tekstu, kolory oraz obramowanie. Tekst można też zmienić w polu „Treść”.
- „Tekst”, „Prostokąt”, „Koło” i „Linia” dodają obiekty. „3 kroki” wstawia edytowalną infografikę z trzema kartami i połączeniami.
- Biblioteka zawiera istniejące okładki, ilustracje, ikony i teksturę tła. Wgrywaj własne PNG/JPG do 8 MB. Obrazy zapisują się lokalnie w bibliotece.
- Tło zmienisz próbnikiem koloru albo obrazem z biblioteki. Pierwotne tło jest zablokowane przed przypadkowym przesunięciem; warstwy można odblokować kłódką.
- Warstwy pozwalają zaznaczać elementy schowane pod innymi. Dostępne są przesuwanie na wierzch/spód, wyrównanie, duplikowanie i usuwanie.
- Miniatury pozwalają przełączać slajdy. Przyciski pod nimi dodają, duplikują, usuwają i zmieniają kolejność slajdów. Kursowy oryginał ma 20 slajdów; własny projekt może mieć 1–60.
- „Prezentuj” powiększa pokaz w panelu. Strzałki zmieniają slajd, Esc kończy pokaz.

## Zapis i eksport

Zmiany zapisują się automatycznie po sekundzie bezczynności, a „Zapisz” zapisuje od razu. Wskaźnik w nagłówku potwierdza wynik. Każdy moduł ma osobny plik w projects/bur-2026-09-09/editor-drafts/Mxx.json. Oryginalne deck.json i PPTX pozostają punktem wyjścia. Notatki prowadzącego są częścią projektu.

„Pobierz projekt” zapisuje kopię JSON, którą można ponownie otworzyć w tym systemie. Projekt odwołuje się do lokalnej biblioteki obrazów: przenosząc go na drugi komputer, przenieś także public/assets/generated i public/icons/modern. „PowerPoint” pobiera prezentację z natywnymi tekstami, kształtami i osadzonymi obrazami. To eksport bieżącego projektu; pliki oryginału w galerii pozostają osobnymi materiałami.

Nie jest to pełna implementacja Microsoft PowerPoint. Wejściem jest istniejący moduł Studio lub projekt JSON edytora; dowolne zewnętrzne PPTX nie są obecnie importowane. Eksport obejmuje obsługiwane elementy, nie zawiera złożonych animacji ani zagnieżdżonych grup. Podgląd przeglądarkowy i PowerPoint mogą minimalnie różnić się metryką tekstu — po większej zmianie tekstu sprawdź eksport na ekranie prezentacji.

## Silnik i utrzymanie

Canvas: Fabric.js 7.4.0, MIT, https://github.com/fabricjs/fabric.js. Eksport: obecny PptxGenJS. Biblioteka jest dostarczona lokalnie w public/vendor/fabric.min.js, licencja w public/vendor/FABRIC-LICENSE; internet nie jest potrzebny do pracy z istniejącymi assetami. Nie wymaga serwera dokumentów ani konta zewnętrznego.

Kod: visual-editor.mjs (sceny, biblioteka, walidacja, zapis, eksport), public/editor.html/css/js (panel), server.mjs (API). npm test obejmuje wszystkie 14 modułów i walidację importu. Test przeglądarkowy: projects/bur-2026-09-09/editor-qa.py. Test używa projektu M01; nie uruchamiaj go na własnym zapisanym M01 bez kopii.

Przed publikacją osobnego serwisu trzeba ponownie ocenić zależności i model dostępu. Obecnie serwer jest lokalny. npm audit wskazuje istniejący problem image-size/PptxGenJS; upload edytora ogranicza pliki do PNG/JPG z kontrolą nagłówka i wymiarów. Fabric jest w wersji 7.4.0, bez zależności opcjonalnych serwera canvas.

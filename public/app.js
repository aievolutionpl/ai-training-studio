if(new URLSearchParams(location.search).has('module')&&!new URLSearchParams(location.search).has('simple'))location.replace('/editor.html'+location.search);
import {burPreview} from './bur-preview.js';
import {slidePreview} from './preview.js';
const $ = (s) => document.querySelector(s),
  esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const css = document.createElement("link");
css.rel = "stylesheet";
css.href = "/final.css";
document.head.append(css);
const previewCss = document.createElement("link");
previewCss.rel = "stylesheet";
previewCss.href = "/slide-preview.css";
document.head.append(previewCss);
const styles = await (await fetch("/api/styles")).json();
let selected = "evolution",
  view = "create",
  index = 0,
  deck = null,
  busy = false;
try {
  deck = JSON.parse(localStorage.getItem("aievo-deck"));
  selected = deck?.style || selected;
} catch {}
const burModule=new URLSearchParams(location.search).get('module');
if(/^M(0[1-9]|1[0-4])$/.test(burModule||'')){
  const response=await fetch(`/bur-files/${burModule}/deck.json`);
  if(response.ok){deck=await response.json();selected=deck.style;view='editor';}
}
const brief = {
  topic: "",
  audience: "Pracownicy i menedżerowie",
  count: 20,
  minutes: 40,
  goal: "",
  context: "",
  includeQuiz: false,
};
const theme = (id) => styles.find((s) => s.id === id) || styles[0];
function slide(
  t,
  s = {
    title: "Przyszłość pracy zaczyna się teraz",
    layout: "cover",
    points: ["AI w praktyce Twojej firmy:: jeden proces, jeden wynik, jedna decyzja"],
  },
  opts = {},
) {
  if (deck?.burEdition && deck.slides.includes(s))
    return burPreview(deck, s, deck.slides.indexOf(s));
  const owned = Array.isArray(deck?.slides) && deck.slides.includes(s);
  return slidePreview(t, s, {
    index: opts.index ?? (owned ? deck.slides.indexOf(s) : 0),
    total: opts.total ?? (owned ? deck.slides.length : 8),
    deck: owned ? deck : {},
  });
}
function cards() {
  return `<div class="style-grid">${styles.map((t) => `<article class="style-card ${selected === t.id ? "selected" : ""}" data-select="${t.id}" tabindex="0" role="button" aria-label="Wybierz ${t.name}">${slide(t)}<div class="style-meta"><div><strong>${t.name}</strong><br><small>${t.tag}</small></div><button data-preview="${t.id}">Podgląd ↗</button></div></article>`).join("")}</div>`;
}
function save() {
  localStorage.setItem("aievo-deck", JSON.stringify(deck));
}
function toast(s) {
  $("#toast").textContent = s;
  $("#toast").style.display = "block";
  setTimeout(() => ($("#toast").style.display = "none"), 4500);
}
function render() {
  document
    .querySelectorAll("nav button")
    .forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  $("#breadcrumb").textContent = {
    create: "Nowa prezentacja",
    styles: "Biblioteka stylów",
    editor: "Moja prezentacja",
    guide: "Warsztat Codex",
  }[view];
  if (view === "create")
    $("#content").innerHTML =
      `<div class="eyebrow">TWOJE NASTĘPNE ŚWIETNE SZKOLENIE</div><h1>Masz wiedzę. <em>Nadaj jej formę.</em></h1><p class="lead">Od pierwszej myśli do prezentacji, którą z przyjemnością pokażesz.</p><div class="steps"><span><b>1</b> Opowiedz o temacie</span><span><b>2</b> Wybierz swój styl</span><span><b>3</b> Twórz z Codex</span></div><section class="panel"><div class="panel-title"><h2><span class="number">01</span> O czym porozmawiamy?</h2><span class="muted">Brief szkolenia</span></div><label for="topic">Temat modułu</label><input id="topic" data-field="topic" value="${esc(brief.topic)}" placeholder="np. Agenci AI w codziennej pracy działu sprzedaży"><div class="fields"><div><label>Uczestnicy</label><input data-field="audience" value="${esc(brief.audience)}"></div><div><label>Czas · minuty</label><input data-field="minutes" type="number" min="10" max="180" value="${brief.minutes}"></div><div><label>Liczba slajdów</label><input data-field="count" type="number" min="5" max="40" value="${brief.count}"></div></div><label>Co uczestnik powinien umieć po szkoleniu?</label><input data-field="goal" value="${esc(brief.goal)}" placeholder="np. Zaprojektować pierwszy proces wspierany przez AI"><label>Kontekst firmy, przykłady i materiały źródłowe</label><textarea data-field="context" placeholder="Branża, poziom wiedzy, ważne informacje, źródła…">${esc(brief.context)}</textarea></section><section class="panel"><div class="panel-title"><div><h2><span class="number">02</span> Wybierz charakter prezentacji</h2><span class="muted">8 stylów • podgląd przed generowaniem • zmienisz go też później</span></div></div>${cards()}</section><div class="actions"><button class="secondary" id="demo">Otwórz przykład bez generowania</button><button class="primary" id="generate" ${busy ? "disabled" : ""}>${busy ? "Codex pracuje…" : "Zbuduj z Codex ✦"}</button></div><div id="jobstatus"></div>`;
  if (view === "styles")
    $("#content").innerHTML =
      `<div class="eyebrow">BIBLIOTEKA KIERUNKÓW WIZUALNYCH</div><h1>Jeden temat. <em>Osiem osobowości.</em></h1><p class="lead">Zobacz okładkę, slajd merytoryczny i proces. Wybierz styl dla swojego modułu.</p>${cards()}<div class="actions"><span class="muted">Wybrano: ${theme(selected).name}</span><button class="primary" id="back">Użyj stylu →</button></div>`;
  if (view === "editor") {
    if (!deck) {
      $("#content").innerHTML =
        '<h1>Twoja pierwsza prezentacja</h1><p class="lead">Utwórz moduł z Codex lub otwórz przykład, żeby poznać edytor.</p><button class="primary" id="demo">Otwórz przykład</button>';
      return;
    }
    const s = deck.slides[index];
    $("#content").innerHTML =
      `<div class="eyebrow">EDYTOR MODUŁU</div><h1>${esc(deck.title)}</h1><div class="actions">${deck.burEdition ? `<select id="burpalette" aria-label="Paleta modułu" style="width:210px">${Array.from({length:14},(_,i)=>"M"+String(i+1).padStart(2,"0")).map(id=>`<option value="${id}" ${id===(deck.paletteModule||deck.moduleId)?"selected":""}>Paleta ${id}</option>`).join("")}</select>` : `<select id="deckstyle" style="width:210px">${styles.map((t) => `<option value="${t.id}" ${t.id === deck.style ? "selected" : ""}>${t.name}</option>`).join("")}</select>`}<div><button class="secondary" id="json">Zapisz JSON</button> <button class="secondary" id="import">Otwórz JSON</button> <button class="primary" id="export">Pobierz PowerPoint ↓</button></div></div><div class="editor"><div class="thumbs">${deck.slides.map((s, i) => `<button data-slide="${i}" class="${index === i ? "active" : ""}">${slide(theme(deck.style), s)}</button>`).join("")}</div><div><div id="stage">${slide(theme(deck.style), s)}</div><section class="panel" style="margin-top:18px"><span class="muted">Slajd ${index + 1} / ${deck.slides.length} · zmiany zapisują się lokalnie</span><label>Tytuł</label><input id="title" maxlength="120" value="${esc(s.title)}"><div class="edit-fields"><div><label>Treść: jeden punkt w wierszu (maks. 4)</label><textarea id="points">${esc(s.points.join("\n"))}</textarea></div><div><label>Notatki trenera</label><textarea id="notes">${esc(s.notes)}</textarea></div></div><label>Układ</label><select id="layout">${["cover", "cards", "process", "statement", "exercise", "comparison", "image", "anatomy", "evidence", "timeline", "decision", "case", "matrix"].map((l) => `<option ${l === s.layout ? "selected" : ""}>${l}</option>`).join("")}</select><div class="actions"><button class="secondary" id="prev">← Poprzedni</button><button class="primary" id="apply">Zapisz slajd</button><button class="secondary" id="next">Następny →</button></div></section></div></div>`;
  }
  if (view === "guide")
    $("#content").innerHTML =
      `<div class="eyebrow">TWÓJ WARSZTAT</div><h1>Dobry slajd zaczyna się <em>od myśli.</em></h1><section class="panel guide"><h2>Jak pracuje studio</h2><p>Brief → scenariusz Codex → podgląd i edycja → PowerPoint. Generowanie korzysta z zainstalowanego Codex CLI i jego aktualnego logowania. Gotowy plik ma osadzone obrazy, edytowalne teksty, kształty oraz notatki. Otworzysz go offline.</p><h2>Pomysły sprawdzone w repozytoriach</h2><p><a href="https://github.com/gitbrent/PptxGenJS" target="_blank" rel="noreferrer">PptxGenJS</a>: natywne obiekty PowerPoint i notatki trenera — to silnik eksportu.</p><p><a href="https://github.com/presenton/presenton" target="_blank" rel="noreferrer">Presenton</a>: wybór stylu przed generacją i oddzielenie treści od szablonu — inspiracja przepływem pracy.</p><p><a href="https://github.com/icip-cas/PPTAgent" target="_blank" rel="noreferrer">PPTAgent</a>: osobna ocena treści, wyglądu i narracji — stosuj te trzy pytania przy przeglądzie.</p><h2>Zasady dobrej prezentacji</h2><p>Jedna myśl na slajd. Tytuł mówi, co wynika z treści. Proces pokazuj jako kroki, porównanie jako dwa pola. Szczegóły przenieś do notatek. Przeplataj wiedzę przykładami i ćwiczeniami. Zawsze sprawdzaj fakty i prawdziwy wygląd pliku w PowerPoint.</p><h2>Praca z Codex w tym folderze</h2><p>Poproś: „Przeczytaj AGENTS.md. Przygotuj moduł 40 minut, 20 slajdów na temat […], zapisz deck.json i wyeksportuj PPTX”. W aplikacji możesz otworzyć ten sam JSON.</p><p>Eksport terminalowy: <code>npm run export -- deck.json wynik.pptx</code></p><p>Ilustracje AI są obrazami; treść i diagramy pozostają oddzielnymi elementami. Ilustracje: imagegen w rozmowie Codex lub fal.ai z kluczem ustawionym na serwerze.</p></section>`;
}
document.addEventListener("input", (e) => {
  if (e.target.dataset.field)
    brief[e.target.dataset.field] =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
});
document.addEventListener("keydown", (e) => {
  if (e.target.dataset.select && ["Enter", " "].includes(e.key)) {
    e.preventDefault();
    selected = e.target.dataset.select;
    render();
  }
});
document.addEventListener("change", async (e) => {
  if(e.target.id==='burpalette'){
    const source=await(await fetch(`/bur-files/${e.target.value}/deck.json`)).json();
    deck.burTheme={...source.burTheme};deck.paletteModule=source.moduleId;
    save();render();return;
  }
  if (e.target.id === "deckstyle") {
    deck.style = e.target.value;
    selected = deck.style;
    save();
    render();
  }
});
document.addEventListener("click", async (e) => {
  try {
    const v = e.target.closest("[data-view]");
    if (v) {
      view = v.dataset.view;
      render();
      return;
    }
    const preview = e.target.closest("[data-preview]");
    if (preview) {
      const t = theme(preview.dataset.preview);
      $("#preview").innerHTML =
        `<button class="close">✕</button><h2>${t.name}</h2><p class="lead">${t.desc}</p><div class="preview-grid">${slide(t, undefined, { index: 0, total: 4 })}${slide(t, { title: "Trzy role AI w Twojej firmie", layout: "cards", points: ["Asystent:: przygotowuje pierwszą wersję tekstu", "Analityk:: porządkuje i porównuje informacje", "Partner:: proponuje warianty do oceny"] }, { index: 1, total: 4 })}${slide(t, { title: "Od pomysłu do wdrożenia", layout: "process", points: ["Wybierz zadanie:: powtarzalne i sprawdzalne", "Przetestuj wynik:: na dziesięciu realnych sprawach", "Oceń jakość:: według kryteriów spisanych wcześniej"] }, { index: 2, total: 4 })}${slide(t, { title: "Zaprojektuj własny przypadek użycia", layout: "exercise", activityMinutes: 12, points: ["Opisz zadanie:: co dziś zajmuje najwięcej czasu", "Zdefiniuj dobry wynik:: po czym poznasz jakość", "Zaplanuj kontrolę:: kto sprawdza przed wysyłką"] }, { index: 3, total: 4 })}</div>`;
      $("#preview").showModal();
      return;
    }
    if (e.target.closest(".close")) return $("#preview").close();
    const c = e.target.closest("[data-select]");
    if (c) {
      selected = c.dataset.select;
      render();
      return;
    }
    const thumb = e.target.closest("[data-slide]");
    if (thumb) {
      index = Number(thumb.dataset.slide);
      render();
      return;
    }
    switch (e.target.id) {
      case "back":
        view = "create";
        render();
        break;
      case "demo":
        deck = await (await fetch("/api/demo?style=" + selected)).json();
        index = 0;
        view = "editor";
        save();
        render();
        break;
      case "apply": {
        const s = deck.slides[index],
          pts = $("#points").value.split("\n").filter(Boolean);
        if (pts.length > 4 || pts.some((p) => p.length > 180))
          throw Error("Użyj maksymalnie 4 punktów po 180 znaków.");
        Object.assign(s, {
          title: $("#title").value,
          points: pts,
          notes: $("#notes").value,
          layout: $("#layout").value,
        });
        save();
        render();
        toast("Slajd zapisany");
        break;
      }
      case "prev":
        index = Math.max(0, index - 1);
        render();
        break;
      case "next":
        index = Math.min(deck.slides.length - 1, index + 1);
        render();
        break;
      case "export": {
        const r = await fetch("/api/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(deck),
        });
        if (!r.ok) throw Error((await r.json()).error);
        download(await r.blob(), "AI-Evolution.pptx");
        toast("PowerPoint gotowy");
        break;
      }
      case "json":
        download(
          new Blob([JSON.stringify(deck, null, 2)], {
            type: "application/json",
          }),
          "deck.json",
        );
        break;
      case "import": {
        const f = document.createElement("input");
        f.type = "file";
        f.accept = ".json";
        f.onchange = async () => {
          try {
            const d = JSON.parse(await f.files[0].text());
            const r = await fetch("/api/export", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(d),
            });
            if (!r.ok) throw Error((await r.json()).error);
            deck = d;
            index = 0;
            save();
            render();
          } catch (e) {
            toast(e.message);
          }
        };
        f.click();
        break;
      }
      case "generate": {
        if (busy) return;
        if (brief.topic.trim().length < 4) throw Error("Wpisz temat modułu.");
        busy = true;
        render();
        const r = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...brief, style: selected }),
        });
        const job = await r.json();
        if (!r.ok) throw Error(job.error);
        poll(job.id);
        break;
      }
    }
  } catch (err) {
    busy = false;
    toast(err.message);
    if ($("#generate")) $("#generate").disabled = false;
  }
});
function download(b, name) {
  const a = document.createElement("a"),
    u = URL.createObjectURL(b);
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
async function poll(id) {
  try {
    const j = await (await fetch("/api/jobs/" + id)).json();
    if ($("#jobstatus"))
      $("#jobstatus").innerHTML =
        `<div class="status">${esc(j.message)}${j.status === "running" ? '<div class="progress"></div>' : ""}</div>`;
    if (j.status === "running") return setTimeout(() => poll(id), 2500);
    busy = false;
    if (j.status === "done") {
      deck = j.deck;
      index = 0;
      save();
      view = "editor";
      render();
      toast("Twój moduł jest gotowy");
    } else {
      toast(j.message);
      if ($("#generate")) $("#generate").disabled = false;
    }
  } catch (e) {
    busy = false;
    toast("Utracono połączenie: " + e.message);
  }
}
const nativeRender = render;
render = function () {
  nativeRender();
  if (view === "editor" && deck) {
    const actions = document.createElement("div");
    actions.className = "actions";
    actions.innerHTML =
      '<button class="secondary" id="quality-check">Sprawdź jakość modułu</button><button class="secondary" id="trainer-guide">Pobierz skrypt trenera</button>';
    $("#content").append(actions);
  }
};
document.addEventListener("click", async (e) => {
  if (!["quality-check", "trainer-guide"].includes(e.target.id)) return;
  try {
    const r = await fetch(
      e.target.id === "quality-check" ? "/api/review" : "/api/handout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deck),
      },
    );
    if (!r.ok) throw Error("Nie udało się przygotować raportu.");
    if (e.target.id === "trainer-guide")
      return download(await r.blob(), "skrypt-trenera.md");
    const q = await r.json();
    const AREAS = {
      design: "Układ i czytelność",
      content: "Treść",
      language: "Język",
      coherence: "Spójność modułu",
      research: "Źródła",
      script: "Skrypt trenera",
      materials: "Materiały uczestnika",
      timing: "Czas",
      assessment: "Test",
    };
    const grouped = q.issues.reduce((acc, i) => {
      (acc[i.area] ||= []).push(i);
      return acc;
    }, {});
    $("#preview").innerHTML =
      '<button class="close">✕</button><h2>Przegląd szkolenia</h2><p>' +
      esc(q.summary) +
      '</p><p class="muted">Kontrola reguł treści i narracji. Nie zastępuje przeglądu wizualnego PPTX.</p>' +
      (q.issues.length
        ? Object.entries(grouped)
            .map(
              ([area, list]) =>
                "<h3>" +
                esc(AREAS[area] || area) +
                " <small>(" +
                list.length +
                ")</small></h3>" +
                list
                  .map(
                    (i) =>
                      "<p><strong>" +
                      esc(i.slide ? "Slajd " + i.slide : "Moduł") +
                      "</strong> · " +
                      esc(i.message) +
                      "</p>",
                  )
                  .join(""),
            )
            .join("")
        : "<p>Bez uwag strukturalnych. Sprawdź jeszcze wygląd slajdów w PowerPoint.</p>");
    $("#preview").showModal();
  } catch (err) {
    toast(err.message);
  }
});
const refs = await (await fetch("/references/catalog.json")).json();
let reference = null,
  outlineApproved = false;
const previousRender = render;
render = function () {
  previousRender();
  if (view === "styles") {
    const section = document.createElement("section");
    section.className = "panel";
    section.style.marginTop = "30px";
    section.innerHTML =
      '<h2>Pobrane wzorce PowerPoint</h2><p class="lead">Oryginalne pliki do obejrzenia w PowerPoint. Wybór przekazuje kierunek wizualny do briefu.</p><div class="style-grid">' +
      refs
        .map(
          (r) =>
            '<article class="panel" style="padding:15px;margin:0">' +
            (r.preview
              ? '<img src="/references/' +
                r.preview +
                '" alt="Podgląd Velis" style="width:100%;height:120px;object-fit:contain">'
              : '<div style="height:120px;display:grid;place-items:center;background:#f1edf7;color:#8062a1">PPTX · wzorzec okładki</div>') +
            "<h3>" +
            esc(r.name) +
            '</h3><p class="muted">' +
            esc(r.description) +
            '</p><p class="muted">' +
            esc(r.author) +
            " · " +
            esc(r.license) +
            '</p><a href="/references/' +
            r.file +
            '" download>Otwórz PowerPoint ↓</a><p><a href="' +
            r.source +
            '" target="_blank" rel="noreferrer">Źródło</a></p><button class="secondary" data-ref="' +
            r.id +
            '">Użyj jako referencji</button></article>',
        )
        .join("") +
      "</div>";
    $("#content").append(section);
  }
  if (view === "editor" && deck) {
    const b = document.createElement("div");
    b.className = "actions";
    b.innerHTML =
      '<button class="secondary" id="snapshot">Zapisz kopię wersji</button><button class="secondary" id="restore-snapshot">Przywróć ostatnią kopię</button>';
    $("#content").append(b);
  }
};
document.addEventListener(
  "click",
  (e) => {
    if (e.target.id !== "generate" || outlineApproved) return;
    e.stopImmediatePropagation();
    if (brief.topic.trim().length < 4) return toast("Wpisz temat modułu.");
    const roles = [
      "Otwarcie i cel modułu",
      "Dlaczego ten temat jest ważny",
      "Co uczestnik będzie umiał",
      "Najważniejsze pojęcia",
      "Przykład z pracy firmy",
      "Proces krok po kroku",
      "Ćwiczenie praktyczne",
      "Omówienie ćwiczenia",
      "Typowe błędy",
      "Jak ocenić jakość",
      "Przykład zastosowania",
      "Porównanie podejść",
      "Dobre praktyki",
      "Ćwiczenie w parach",
      "Omówienie wyników",
      "Plan małego pilotażu",
      "Odpowiedzialność w zespole",
      "Sprawdzenie wiedzy",
      "Plan działania",
      "Podsumowanie",
    ];
    const n = Math.max(5, Math.min(40, Number(brief.count) || 20));
    $("#preview").innerHTML =
      '<button class="close">✕</button><h2>Najpierw dopracuj konspekt</h2><p class="lead">Proponowany szkielet dydaktyczny. Dostosuj tytuły do swojego tematu przed przekazaniem ich Codex.</p><textarea id="outline-draft" style="min-height:330px">' +
      esc(
        Array.from(
          { length: n },
          (_, i) => roles[i] || "Dodatkowy przykład " + (i - 19),
        ).join("\n"),
      ) +
      '</textarea><button class="primary" id="approve-outline">Zatwierdź konspekt i generuj</button>';
    $("#preview").showModal();
  },
  true,
);
document.addEventListener("click", (e) => {
  const r = e.target.closest("[data-ref]");
  if (r) {
    reference = refs.find((x) => x.id === r.dataset.ref);
    brief.context +=
      "\nReferencja wizualna: " + reference.name + ". " + reference.description;
    toast("Referencja dodana do briefu");
  }
  if (e.target.id === "approve-outline") {
    brief.context +=
      "\nZatwierdzony konspekt (zachowaj kolejność):\n" +
      $("#outline-draft").value;
    outlineApproved = true;
    $("#preview").close();
    $("#generate").click();
    outlineApproved = false;
  }
  if (e.target.id === "snapshot" && deck) {
    localStorage.setItem("aievo-snapshot", JSON.stringify(deck));
    toast("Kopia zapisana");
  }
  if (e.target.id === "restore-snapshot") {
    try {
      const copy = JSON.parse(localStorage.getItem("aievo-snapshot"));
      if (!copy) return toast("Najpierw zapisz kopię.");
      deck = copy;
      index = 0;
      save();
      render();
      toast("Przywrócono kopię");
    } catch {
      toast("Nie można odczytać kopii");
    }
  }
});
const beforeImages = render;
render = function () {
  beforeImages();
  if (view === "editor" && deck) {
    const panel = document.createElement("section");
    panel.className = "panel";
    panel.innerHTML =
      '<h2>Ilustracja do bieżącego slajdu</h2><p class="muted">Codex: przygotuj zadanie dla imagegen. Zewnętrzny program: fal.ai z kluczem serwera.</p><label>Dostawca</label><select id="image-provider"><option value="codex">Codex · imagegen</option><option value="fal">fal.ai · płatne API</option></select><label>Jakość</label><select id="image-quality"><option value="draft">Podgląd · Schnell · 1024 × 576</option><option value="final">Final · FLUX dev · 1536 × 864</option></select><label>Opis ilustracji</label><textarea id="image-prompt">' +
      esc(deck.slides[index].title) +
      '</textarea><button class="primary" id="create-image">Przygotuj obraz</button><div id="image-result"></div><label>Ścieżka obrazu po imporcie z Codex</label><input id="image-path" placeholder="generated/identyfikator.png"><button class="secondary" id="attach-image">Dołącz obraz</button>';
    $("#content").append(panel);
    if (deck.slides[index].image) {
      const img = document.createElement("img");
      img.src = "/assets/" + deck.slides[index].image;
      img.style.cssText = "width:100%;max-height:300px;object-fit:contain";
      panel.prepend(img);
    }
  }
};
document.addEventListener("click", async (e) => {
  if (e.target.id === "attach-image") {
    const v = $("#image-path").value.trim();
    if (!/^generated\/[a-f0-9]{64}\.(png|jpg)$/.test(v))
      return toast("Wklej ścieżkę zwróconą przez importer.");
    const r = await fetch("/assets/" + v);
    if (!r.ok) return toast("Obraz nie istnieje. Najpierw go zaimportuj.");
    deck.slides[index].image = v;
    save();
    render();
    return;
  }
  if (e.target.id !== "create-image") return;
  const target = deck.slides[index];
  e.target.disabled = true;
  try {
    const r = await fetch("/api/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: $("#image-provider").value,
        quality: $("#image-quality").value,
        prompt: $("#image-prompt").value,
        style: theme(deck.style).desc,
      }),
    });
    const result = await r.json();
    if (!r.ok) throw Error(result.error);
    if (result.status === "done") {
      target.image = result.asset;
      save();
      render();
      toast(
        result.cached
          ? "Użyto zapisanego obrazu"
          : "Obraz zapisany i dołączony",
      );
    } else {
      $("#image-result").innerHTML =
        "<p>Przekaż poniższy plik do rozmowy Codex. Poproś o użycie imagegen i import wyniku.</p>";
      download(
        new Blob([JSON.stringify(result, null, 2)], {
          type: "application/json",
        }),
        "imagegen-task.json",
      );
    }
  } catch (err) {
    toast(err.message);
  } finally {
    const b = $("#create-image");
    if (b) b.disabled = false;
  }
});

const trainingRender = render;
render = function () {
  trainingRender();
  if (view === "create") {
    const p = document.createElement("section");
    p.className = "panel training-options";
    p.innerHTML =
      '<h2>Pakiet szkoleniowy</h2><p>Po generowaniu otrzymasz PowerPoint, skrypt trenera do każdego slajdu, podręcznik uczestnika, słownik i karty pracy.</p><label class="check-row"><input type="checkbox" data-field="includeQuiz" ' +
      (brief.includeQuiz ? "checked" : "") +
      "> Dodaj test końcowy i osobny klucz odpowiedzi</label>";
    $("#content .actions").before(p);
  }
  if (view === "editor" && deck) {
    const s = deck.slides[index],
      p = document.createElement("section");
    p.className = "panel training-editor";
    p.innerHTML =
      '<div class="panel-title"><h2>Scenariusz prowadzenia</h2><span id="voice-count" class="pill"></span></div><label for="voice-script">Powiedz uczestnikom · cel: 120–280 słów</label><textarea id="voice-script" rows="9">' +
      esc(s.voiceScript || "") +
      '</textarea><div class="fields"><div><label for="participant-notes">Objaśnienie do materiałów uczestnika</label><textarea id="participant-notes" rows="5">' +
      esc(s.participantNotes || "") +
      '</textarea></div><div><label for="activity-minutes">Czas ćwiczenia · minuty</label><input id="activity-minutes" type="number" min="0" max="60" value="' +
      (s.activityMinutes || 0) +
      '"></div></div><h3>Ikona slajdu · Astra Icons</h3><div class="icon-picker">' +
      [
        "ai",
        "target",
        "group",
        "chart",
        "shield",
        "document",
        "clock",
        "microphone",
        "lamp",
        "check-circle",
        "search",
        "apis",
      ]
        .map(
          (n) =>
            '<button class="secondary ' +
            (s.icon === n ? "chosen" : "") +
            '" data-icon="' +
            n +
            '" aria-label="Ikona ' +
            n +
            '" title="' +
            n +
            '"><img src="/icons/' +
            n +
            '.svg" alt=""></button>',
        )
        .join("") +
      '<button class="secondary" data-icon="">Bez ikony</button></div><div class="actions"><span class="muted">Skrypt i objaśnienia zapisują się podczas pisania.</span><button class="primary" id="training-package">Pobierz cały pakiet ZIP ↓</button></div><p class="muted">ZIP zawiera również klucz testu, jeśli istnieje. Uczestnikom przekazuj tylko przeznaczone dla nich pliki.</p>';
    $("#stage").closest(".editor").after(p);
    updateVoiceCount();
  }
};
function updateVoiceCount() {
  const s = deck?.slides[index];
  if (!s || !$("#voice-count")) return;
  const n = (s.voiceScript || "").trim().split(/\s+/).filter(Boolean).length;
  $("#voice-count").textContent =
    n + " słów · ~" + (n / 140).toFixed(1) + " min";
}
document.addEventListener("input", (e) => {
  if (view !== "editor" || !deck) return;
  const s = deck.slides[index],
    fields = {
      "voice-script": "voiceScript",
      "participant-notes": "participantNotes",
      "activity-minutes": "activityMinutes",
      title: "title",
      notes: "notes",
      layout: "layout",
    };
  if (fields[e.target.id]) {
    s[fields[e.target.id]] =
      e.target.id === "activity-minutes"
        ? Math.max(0, Math.min(60, Number(e.target.value) || 0))
        : e.target.value;
    save();
    updateVoiceCount();
  }
  if (e.target.id === "points") {
    const p = e.target.value.split("\n").filter(Boolean);
    if (p.length <= 4 && p.every((x) => x.length <= 180)) {
      s.points = p;
      save();
    }
  }
  if (["title", "points", "layout"].includes(e.target.id) && $("#stage"))
    $("#stage").innerHTML = slide(theme(deck.style), s);
});
document.addEventListener("click", async (e) => {
  const icon = e.target.closest("[data-icon]");
  if (icon && deck) {
    deck.slides[index].icon = icon.dataset.icon;
    save();
    render();
    return;
  }
  if (e.target.id !== "training-package") return;
  e.target.disabled = true;
  try {
    const r = await fetch("/api/package", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deck),
    });
    if (!r.ok) throw Error((await r.json()).error);
    download(await r.blob(), "szkolenie.zip");
    toast("Pakiet szkoleniowy zapisany");
  } catch (err) {
    toast(err.message);
  } finally {
    e.target.disabled = false;
  }
});
render();

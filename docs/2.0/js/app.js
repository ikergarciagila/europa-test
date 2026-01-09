(function () {
  // -----------------------------
  // i18n texts
  // -----------------------------
  const LANGS = {
    es: window.I18N_ES,
    ca: window.I18N_CA,
  };

  function getSavedLang() {
    const v = localStorage.getItem("capitals_lang");
    return (v === "ca" || v === "es") ? v : "es";
  }

  let currentLang = getSavedLang();
  let T = LANGS[currentLang];

  // -----------------------------
  // Countries datasets (by lang) - dynamic loading
  // -----------------------------
  // Coloca tus ficheros aquí (carpeta i18n)
  const COUNTRIES_SCRIPTS = {
    es: "js/i18n/countries_es.js",
    ca: "js/i18n/countries_ca.js",
  };

  // Mantendremos en memoria el dataset activo:
  let countriesList = [];          // Array<{id,country,capital}>
  let countriesById = new Map();   // Map<string, {id,country,capital}>

  function loadCountriesLang(lang) {
    window.COUNTRIES_BY_LANG = window.COUNTRIES_BY_LANG || {};
    if (window.COUNTRIES_BY_LANG[lang]) {
      return Promise.resolve(window.COUNTRIES_BY_LANG[lang]);
    }

    return new Promise((resolve, reject) => {
      const src = COUNTRIES_SCRIPTS[lang];
      if (!src) return reject(new Error("No countries script for lang: " + lang));

      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve(window.COUNTRIES_BY_LANG[lang]);
      s.onerror = () => reject(new Error("Failed loading " + src));
      document.head.appendChild(s);
    });
  }

  function toIndexById(list) {
    const m = new Map();
    for (const item of list) m.set(item.id, item);
    return m;
  }

  async function ensureCountriesForCurrentLang() {
    const list = await loadCountriesLang(currentLang);
    countriesList = list || [];
    countriesById = toIndexById(countriesList);
  }

  // -----------------------------
  // helpers
  // -----------------------------
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function sample(arr, n) { return shuffle(arr).slice(0, n); }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  const el = (id) => document.getElementById(id);

  // -----------------------------
  // elements
  // -----------------------------
  const screenStart = el("screenStart");
  const screenGame  = el("screenGame");
  const screenEnd   = el("screenEnd");

  const title = el("title");
  const subtitle = el("subtitle");
  const labelNumQuestions = el("labelNumQuestions");
  const numQuestionsInput = el("numQuestions");
  const btnStart = el("btnStart");
  const startHint = el("startHint");

  const langEs = el("langEs");
  const langCa = el("langCa");

  const pillProgress = el("pillProgress");
  const pillScore = el("pillScore");
  const btnQuit = el("btnQuit");
  const questionText = el("questionText");
  const optionsGrid = el("optionsGrid");
  const feedback = el("feedback");

  const resultsTitle = el("resultsTitle");
  const finalSummary = el("finalSummary");
  const btnPlayAgain = el("btnPlayAgain");
  const btnBackHome = el("btnBackHome");
  const resultsBody = el("resultsBody");

  const thNum = el("thNum");
  const thCountry = el("thCountry");
  const thYourAnswer = el("thYourAnswer");
  const thCorrect = el("thCorrect");
  const thStatus = el("thStatus");

  // -----------------------------
  // game state (by IDs!)
  // -----------------------------
  let game = null;

  function showScreen(which) {
    screenStart.classList.add("hidden");
    screenGame.classList.add("hidden");
    screenEnd.classList.add("hidden");
    which.classList.remove("hidden");
  }

  function buildRoundOptionIds(correctId, allIds) {
    const distractors = sample(allIds.filter(id => id !== correctId), 3);
    return shuffle([correctId, ...distractors]);
  }

  function getCountryName(id) {
    // fallback: si algo falla, muestra el id
    return countriesById.get(id)?.country ?? id;
  }

  function getCapitalName(id) {
    return countriesById.get(id)?.capital ?? id;
  }

  // -----------------------------
  // Language change
  // -----------------------------
  async function setLang(lang) {
    if (!LANGS[lang]) return;

    currentLang = lang;
    T = LANGS[currentLang];
    localStorage.setItem("capitals_lang", currentLang);

    // Cargar countries del nuevo idioma
    await ensureCountriesForCurrentLang();

    renderStaticTexts();
    renderLangButtons();

    if (game) {
      if (!screenGame.classList.contains("hidden")) {
        // Re-render completo de la ronda actual (pero NO cambia opciones porque son ids guardados)
        renderCurrentRound(true);
        // Nota: feedback ya mostrado se mantiene (no lo borramos si está locked)
      }
      if (!screenEnd.classList.contains("hidden")) {
        renderEndScreen();
      }
    }
  }

  // -----------------------------
  // Game lifecycle
  // -----------------------------
  async function startGame() {
    await ensureCountriesForCurrentLang();

    if (countriesList.length < 4) {
      alert(T.alertNeedMoreCountries);
      return;
    }

    const requested = Number(numQuestionsInput.value || 10);
    const N = clamp(requested, 5, 50);
    numQuestionsInput.value = N;

    const allIds = countriesList.map(x => x.id);
    const roundCountryIds = sample(allIds, Math.min(N, allIds.length));

    game = {
      total: roundCountryIds.length,
      idx: 0,
      score: 0,
      allIds,
      roundCountryIds,                        // id del país preguntado por ronda
      roundOptionIds: Array(roundCountryIds.length).fill(null), // ids de opciones por ronda
      history: [], // { countryId, chosenId, isCorrect }
      locked: false,
    };

    showScreen(screenGame);
    renderCurrentRound(true);
  }

  function renderCurrentRound(force) {
    if (!game) return;

    // Si estamos bloqueados por haber respondido y no es forzado, no tocamos
    if (game.locked && !force) return;

    const idx = game.idx;
    const total = game.total;
    const correctId = game.roundCountryIds[idx];

    // pills + pregunta
    pillProgress.textContent = T.pillProgress(idx + 1, total);
    pillScore.textContent = T.pillScore(game.score);
    questionText.textContent = T.question(getCountryName(correctId));

    // Si estamos locked y force=true (por ejemplo cambio idioma tras responder),
    // NO queremos borrar el estado visual de ok/bad, así que:
    // - Si locked: solo actualizamos textos (pills + pregunta) y salimos.
    if (game.locked) return;

    // si no locked, podemos renderizar opciones desde cero
    feedback.textContent = "";
    feedback.className = "feedback";
    optionsGrid.innerHTML = "";

    let optionIds = game.roundOptionIds[idx];
    if (!optionIds) {
      optionIds = buildRoundOptionIds(correctId, game.allIds);
      game.roundOptionIds[idx] = optionIds;
    }

    optionIds.forEach((optionId) => {
      const btn = document.createElement("button");
      btn.className = "option";
      btn.type = "button";
      btn.textContent = getCapitalName(optionId);
      btn.addEventListener("click", () => pickAnswer(optionId));
      optionsGrid.appendChild(btn);
    });

    game.locked = false;
  }

  function pickAnswer(chosenId) {
    if (!game || game.locked) return;
    game.locked = true;

    const idx = game.idx;
    const correctId = game.roundCountryIds[idx];
    const isCorrect = chosenId === correctId;

    const optionIds = game.roundOptionIds[idx];
    const buttons = Array.from(optionsGrid.querySelectorAll("button.option"));

    buttons.forEach((b, i) => {
      b.disabled = true;
      const optionId = optionIds[i];

      if (optionId === correctId) b.classList.add("ok");
      if (!isCorrect && optionId === chosenId) b.classList.add("bad");
    });

    if (isCorrect) {
      game.score += 1;
      feedback.textContent = T.feedbackOk;
      feedback.classList.add("ok");
    } else {
      feedback.textContent = T.feedbackBad(getCapitalName(correctId));
      feedback.classList.add("bad");
    }

    game.history.push({ countryId: correctId, chosenId, isCorrect });

    setTimeout(() => {
      game.idx += 1;
      game.locked = false; // desbloqueamos al pasar
      if (game.idx >= game.total) endGame();
      else renderCurrentRound(true);
    }, 850);
  }

  function endGame() {
    showScreen(screenEnd);
    renderEndScreen();
  }

  function renderEndScreen() {
    if (!game) return;

    resultsTitle.textContent = T.resultsTitle;
    finalSummary.textContent = T.finalSummary(game.score, game.total);

    thNum.textContent = T.table.num;
    thCountry.textContent = T.table.country;
    thYourAnswer.textContent = T.table.yourAnswer;
    thCorrect.textContent = T.table.correct;
    thStatus.textContent = T.table.status;

    resultsBody.innerHTML = "";
    game.history.forEach((h, i) => {
      const tr = document.createElement("tr");

      const tdN = document.createElement("td");
      tdN.textContent = String(i + 1);

      const tdCountry = document.createElement("td");
      tdCountry.textContent = getCountryName(h.countryId);

      const tdChosen = document.createElement("td");
      tdChosen.textContent = getCapitalName(h.chosenId);

      const tdCorrect = document.createElement("td");
      tdCorrect.textContent = getCapitalName(h.countryId);

      const tdStatus = document.createElement("td");
      tdStatus.textContent = h.isCorrect ? T.table.ok : T.table.fail;
      tdStatus.className = h.isCorrect ? "tag-ok" : "tag-bad";

      tr.append(tdN, tdCountry, tdChosen, tdCorrect, tdStatus);
      resultsBody.appendChild(tr);
    });
  }

  function quitToHome() {
    game = null;
    showScreen(screenStart);
  }

  // -----------------------------
  // Static texts (UI)
  // -----------------------------
  function renderStaticTexts() {
    title.textContent = T.title;
    subtitle.textContent = T.subtitle;

    labelNumQuestions.textContent = T.labelNumQuestions;
    btnStart.textContent = T.btnStart;
    startHint.textContent = T.startHint;

    btnQuit.textContent = T.btnQuit;

    btnPlayAgain.textContent = T.btnPlayAgain;
    btnBackHome.textContent = T.btnBackHome;

    // opcional: título de pestaña
    document.title = T.title;
  }

  function renderLangButtons() {
    langEs.classList.toggle("active", currentLang === "es");
    langCa.classList.toggle("active", currentLang === "ca");
    document.documentElement.lang = currentLang;
  }

  // -----------------------------
  // Events
  // -----------------------------
  btnStart.addEventListener("click", startGame);
  btnQuit.addEventListener("click", quitToHome);
  btnPlayAgain.addEventListener("click", startGame);
  btnBackHome.addEventListener("click", quitToHome);

  langEs.addEventListener("click", () => setLang("es"));
  langCa.addEventListener("click", () => setLang("ca"));

  // -----------------------------
  // Init
  // -----------------------------
  (async function init() {
    renderStaticTexts();
    renderLangButtons();
    showScreen(screenStart);

    // pre-carga del dataset del idioma actual para que la primera partida sea instantánea
    try {
      await ensureCountriesForCurrentLang();
    } catch (e) {
      // Si falla, no rompemos la UI; el startGame avisará si no hay datos
      console.error(e);
    }
  })();
})();

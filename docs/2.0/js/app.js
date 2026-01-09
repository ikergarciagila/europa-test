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
  const COUNTRIES_SCRIPTS = {
    es: "js/i18n/countries_es.js",
    ca: "js/i18n/countries_ca.js",
  };

  let countriesList = [];
  let countriesById = new Map();

  function loadCountriesLang(lang) {
    window.COUNTRIES_BY_LANG = window.COUNTRIES_BY_LANG || {};
    if (window.COUNTRIES_BY_LANG[lang]) return Promise.resolve(window.COUNTRIES_BY_LANG[lang]);

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
  const screenList  = el("screenList");
  const screenGame  = el("screenGame");
  const screenEnd   = el("screenEnd");

  const title = el("title");
  const subtitle = el("subtitle");
  const labelNumQuestions = el("labelNumQuestions");
  const numQuestionsInput = el("numQuestions");
  const btnStart = el("btnStart");
  const btnViewList = el("btnViewList");
  const startHint = el("startHint");

  const langEs = el("langEs");
  const langCa = el("langCa");

  // list screen
  const listTitle = el("listTitle");
  const listSubtitle = el("listSubtitle");
  const btnBackFromList = el("btnBackFromList");
  const thListNum = el("thListNum");
  const thListCountry = el("thListCountry");
  const thListCapital = el("thListCapital");
  const listBody = el("listBody");

  // game screen
  const pillProgress = el("pillProgress");
  const pillScore = el("pillScore");
  const pillTimer = el("pillTimer");
  const btnQuit = el("btnQuit");
  const questionText = el("questionText");
  const optionsGrid = el("optionsGrid");
  const feedback = el("feedback");

  // end screen
  const resultsTitle = el("resultsTitle");
  const finalSummary = el("finalSummary");
  const btnPlayAgain = el("btnPlayAgain");
  const btnBackHome = el("btnBackHome");
  const resultsBody = el("resultsBody");

  const thNum = el("thNum");
  const thCountry = el("thCountry");
  const thCapital = el("thCapital");
  const thStatus = el("thStatus");

  // -----------------------------
  // game settings
  // -----------------------------
  const QUESTION_SECONDS_DEFAULT = 5;

  // timer runtime
  let timerInterval = null;
  let timeLeft = QUESTION_SECONDS_DEFAULT;

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function updateTimerPill() {
    pillTimer.textContent = T.pillTimer(timeLeft);
  }

  function startTimerForQuestion() {
    stopTimer();
    timeLeft = QUESTION_SECONDS_DEFAULT;
    updateTimerPill();

    timerInterval = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft <= 0) {
        timeLeft = 0;
        updateTimerPill();
        stopTimer();
        onTimeUp();
        return;
      }
      updateTimerPill();
    }, 1000);
  }

  // -----------------------------
  // game state (by IDs!)
  // -----------------------------
  let game = null;

  function showScreen(which) {
    screenStart.classList.add("hidden");
    screenList.classList.add("hidden");
    screenGame.classList.add("hidden");
    screenEnd.classList.add("hidden");
    which.classList.remove("hidden");
  }

  function buildRoundOptionIds(correctId, allIds) {
    const distractors = sample(allIds.filter(id => id !== correctId), 3);
    return shuffle([correctId, ...distractors]);
  }

  function getCountryName(id) {
    return countriesById.get(id)?.country ?? id;
  }

  function getCapitalName(id) {
    return countriesById.get(id)?.capital ?? id;
  }

  // -----------------------------
  // language change
  // -----------------------------
  async function setLang(lang) {
    if (!LANGS[lang]) return;

    currentLang = lang;
    T = LANGS[currentLang];
    localStorage.setItem("capitals_lang", currentLang);

    await ensureCountriesForCurrentLang();

    renderStaticTexts();
    renderLangButtons();

    if (game) {
      if (!screenGame.classList.contains("hidden")) {
        // re-render de la ronda actual: mantiene optionIds (no cambia opciones)
        renderCurrentRound(true);
      }
      if (!screenEnd.classList.contains("hidden")) {
        renderEndScreen();
      }
    }

    if (!screenList.classList.contains("hidden")) {
      renderListScreen();
    }
  }

  // -----------------------------
  // Start / list
  // -----------------------------
  async function openList() {
    await ensureCountriesForCurrentLang();
    renderListScreen();
    showScreen(screenList);
  }

  function renderListScreen() {
    listTitle.textContent = T.listTitle;
    listSubtitle.textContent = T.listSubtitle;
    btnBackFromList.textContent = T.btnBackFromList;

    thListNum.textContent = T.listTable.num;
    thListCountry.textContent = T.listTable.country;
    thListCapital.textContent = T.listTable.capital;

    listBody.innerHTML = "";
    // Orden alfabético por país en el idioma actual
    const sorted = countriesList.slice().sort((a, b) => a.country.localeCompare(b.country, currentLang));
    sorted.forEach((x, i) => {
      const tr = document.createElement("tr");
      const tdN = document.createElement("td"); tdN.textContent = String(i + 1);
      const tdC = document.createElement("td"); tdC.textContent = x.country;
      const tdCap = document.createElement("td"); tdCap.textContent = x.capital;
      tr.append(tdN, tdC, tdCap);
      listBody.appendChild(tr);
    });
  }

  function backToHome() {
    stopTimer();
    game = null;
    showScreen(screenStart);
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
      roundCountryIds,
      roundOptionIds: Array(roundCountryIds.length).fill(null),
      history: [], // { countryId, chosenId|null, isCorrect, timedOut }
      locked: false,
    };

    showScreen(screenGame);
    renderCurrentRound(true);
  }

  function renderCurrentRound(force) {
    if (!game) return;

    const idx = game.idx;
    const total = game.total;
    const correctId = game.roundCountryIds[idx];

    pillProgress.textContent = T.pillProgress(idx + 1, total);
    pillScore.textContent = T.pillScore(game.score);

    // Si está locked (acabamos de responder) y solo estamos cambiando idioma, NO tocamos UI de opciones
    questionText.textContent = T.question(getCountryName(correctId));
    if (game.locked && !force) return;

    // Si force y locked (cambio idioma tras responder), no borres feedback ni colores.
    // Solo actualiza textos y el pill del timer (aunque esté parado). Salimos.
    if (game.locked) {
      updateTimerPill();
      return;
    }

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

    // arrancar temporizador para esta pregunta
    startTimerForQuestion();
  }

  function disableOptionsAndMark(correctId, chosenId) {
    const optionIds = game.roundOptionIds[game.idx];
    const buttons = Array.from(optionsGrid.querySelectorAll("button.option"));

    buttons.forEach((b, i) => {
      b.disabled = true;
      const optionId = optionIds[i];

      if (optionId === correctId) b.classList.add("ok");
      if (chosenId && optionId === chosenId && chosenId !== correctId) b.classList.add("bad");
    });
  }

  function pickAnswer(chosenId) {
    if (!game || game.locked) return;
    game.locked = true;

    stopTimer();

    const idx = game.idx;
    const correctId = game.roundCountryIds[idx];
    const isCorrect = chosenId === correctId;

    disableOptionsAndMark(correctId, chosenId);

    if (isCorrect) {
      game.score += 1;
      feedback.textContent = T.feedbackOk;
      feedback.classList.add("ok");
    } else {
      feedback.textContent = T.feedbackBad(getCapitalName(correctId));
      feedback.classList.add("bad");
    }

    game.history.push({ countryId: correctId, chosenId, isCorrect, timedOut: false });

    setTimeout(() => nextRound(), 850);
  }

  function onTimeUp() {
    if (!game || game.locked) return;
    game.locked = true;

    const idx = game.idx;
    const correctId = game.roundCountryIds[idx];

    // no hay elección
    const chosenId = null;

    disableOptionsAndMark(correctId, chosenId);

    feedback.textContent = T.feedbackTimeUp(getCapitalName(correctId));
    feedback.classList.add("bad");

    game.history.push({ countryId: correctId, chosenId, isCorrect: false, timedOut: true });

    setTimeout(() => nextRound(), 850);
  }

  function nextRound() {
    if (!game) return;

    game.idx += 1;
    game.locked = false;

    if (game.idx >= game.total) endGame();
    else renderCurrentRound(true);
  }

  function endGame() {
    stopTimer();
    showScreen(screenEnd);
    renderEndScreen();
  }

  // -----------------------------
  // Results redesign (didactic)
  // Columns: #, País, Capital(correcta), Estado (+ pequeña elegida si fallo)
  // -----------------------------
  function renderEndScreen() {
    if (!game) return;

    resultsTitle.textContent = T.resultsTitle;
    finalSummary.textContent = T.finalSummary(game.score, game.total);

    thNum.textContent = T.resultsTable.num;
    thCountry.textContent = T.resultsTable.country;
    thCapital.textContent = T.resultsTable.capital;
    thStatus.textContent = T.resultsTable.status;

    resultsBody.innerHTML = "";

    game.history.forEach((h, i) => {
      const tr = document.createElement("tr");

      const tdN = document.createElement("td");
      tdN.textContent = String(i + 1);

      const tdCountry = document.createElement("td");
      tdCountry.textContent = getCountryName(h.countryId);

      const tdCapital = document.createElement("td");
      tdCapital.textContent = getCapitalName(h.countryId);

      const tdStatus = document.createElement("td");
      const ok = h.isCorrect;
      tdStatus.textContent = ok ? T.resultsTable.ok : T.resultsTable.fail;
      tdStatus.className = ok ? "tag-ok" : "tag-bad";

      if (!ok) {
        const chosenText = h.chosenId ? getCapitalName(h.chosenId) : T.resultsTable.none;
        const small = document.createElement("span");
        small.className = "small-muted";
        small.textContent = `${T.resultsTable.chosenLabel} ${chosenText}`;
        tdStatus.appendChild(small);
      }

      tr.append(tdN, tdCountry, tdCapital, tdStatus);
      resultsBody.appendChild(tr);
    });
  }

  // -----------------------------
  // Static texts (UI)
  // -----------------------------
  function renderStaticTexts() {
    title.textContent = T.title;
    subtitle.textContent = T.subtitle;

    labelNumQuestions.textContent = T.labelNumQuestions;
    btnStart.textContent = T.btnStart;
    btnViewList.textContent = T.btnViewList;
    startHint.textContent = T.startHint;

    btnQuit.textContent = T.btnQuit;

    btnPlayAgain.textContent = T.btnPlayAgain;
    btnBackHome.textContent = T.btnBackHome;

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
  btnViewList.addEventListener("click", openList);

  btnBackFromList.addEventListener("click", () => showScreen(screenStart));

  btnQuit.addEventListener("click", backToHome);
  btnPlayAgain.addEventListener("click", startGame);
  btnBackHome.addEventListener("click", backToHome);

  langEs.addEventListener("click", () => setLang("es"));
  langCa.addEventListener("click", () => setLang("ca"));

  // -----------------------------
  // Init
  // -----------------------------
  (async function init() {
    renderStaticTexts();
    renderLangButtons();
    showScreen(screenStart);

    try {
      await ensureCountriesForCurrentLang();
    } catch (e) {
      console.error(e);
    }
  })();
})();

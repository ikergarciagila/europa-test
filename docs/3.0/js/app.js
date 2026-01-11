(function () {
  // -----------------------------
  // Global config
  // -----------------------------
  const sleepTimeAfterAnswerOK = 1500;
  const sleepTimeAfterAnswerKO = 3000;

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

  // start screen: mode + config
  const modeTitle = el("modeTitle");
  const modeCountryToCapital = el("modeCountryToCapital");
  const modeCapitalToCountry = el("modeCapitalToCountry");
  const modeCountryToCapitalLabel = el("modeCountryToCapitalLabel");
  const modeCapitalToCountryLabel = el("modeCapitalToCountryLabel");

  const btnStart = el("btnStart");
  const btnViewList = el("btnViewList");
  const startHint = el("startHint");

  const btnToggleConfig = el("btnToggleConfig");
  const configToggleText = el("configToggleText");
  const configToggleArrow = el("configToggleArrow");
  const configPanel = el("configPanel");

  const labelNumQuestions = el("labelNumQuestions");
  const numQuestionsInput = el("numQuestions");
  const numQuestionsHelp = el("numQuestionsHelp");

  const labelTimeLimit = el("labelTimeLimit");
  const timeLimitSelect = el("timeLimit");
  const timeLimitHelp = el("timeLimitHelp");

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
  const timerWrap = el("timerWrap");
  const timerFill = el("timerFill");
  const timerText = el("timerText");

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
  // Game mode + time config
  // -----------------------------
  const GAME_MODE = {
    COUNTRY_TO_CAPITAL: "COUNTRY_TO_CAPITAL",
    CAPITAL_TO_COUNTRY: "CAPITAL_TO_COUNTRY",
  };

  function getSelectedMode() {
    return modeCapitalToCountry.checked ? GAME_MODE.CAPITAL_TO_COUNTRY : GAME_MODE.COUNTRY_TO_CAPITAL;
  }

  function getSelectedTimeSeconds() {
    const v = Number(timeLimitSelect.value);
    return Number.isFinite(v) ? v : 5;
  }

  // -----------------------------
  // Timer runtime (continuous)
  // If timeSeconds = 0 => no timer
  // -----------------------------
  let timerInterval = null;
  let timerTotalMs = 0;
  let timerEndTs = 0;
  let timeSecondsCurrent = 5; // configured for the current game

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function remainingMs() {
    return Math.max(0, timerEndTs - Date.now());
  }

  function renderTimer() {
    if (!timerWrap || !timerFill || !timerText) return;

    if (timeSecondsCurrent <= 0) {
      // sin tiempo: ocultamos
      timerWrap.classList.add("hidden");
      return;
    }

    timerWrap.classList.remove("hidden");

    const rem = remainingMs();
    const ratio = timerTotalMs > 0 ? rem / timerTotalMs : 0;
    const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));

    timerFill.style.width = pct + "%";
    const bar = timerFill.parentElement;
    if (bar) bar.setAttribute("aria-valuenow", String(pct));

    const secs = Math.ceil(rem / 1000);
    timerText.textContent = T.pillTimer(secs);
  }

  function startTimerForQuestion() {
    stopTimer();

    if (timeSecondsCurrent <= 0) {
      renderTimer();
      return;
    }

    timerTotalMs = timeSecondsCurrent * 1000;
    timerEndTs = Date.now() + timerTotalMs;

    renderTimer();

    timerInterval = setInterval(() => {
      const rem = remainingMs();
      renderTimer();
      if (rem <= 0) {
        stopTimer();
        onTimeUp();
      }
    }, 50);
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
    updateConfigConstraints();

    if (game) {
      if (!screenGame.classList.contains("hidden")) {
        // No renderCurrentRound => no reinicia timer
        renderGameTextsAndOptionsOnly();
        renderTimer(); // solo repinta texto del temporizador
      }
      if (!screenEnd.classList.contains("hidden")) {
        renderEndScreen();
      }
    }

    if (!screenList.classList.contains("hidden")) {
      renderListScreen();
    }
  }

  function renderGameTextsAndOptionsOnly() {
    if (!game) return;

    const idx = game.idx;
    const total = game.total;
    const correctId = game.roundCountryIds[idx];

    pillProgress.textContent = T.pillProgress(idx + 1, total);
    pillScore.textContent = T.pillScore(game.score);

    // enunciado depende del modo
    if (game.mode === GAME_MODE.COUNTRY_TO_CAPITAL) {
      questionText.textContent = T.questionCountryToCapital(getCountryName(correctId));
    } else {
      questionText.textContent = T.questionCapitalToCountry(getCapitalName(correctId));
    }

    // Actualiza texto botones (según modo)
    const optionIds = game.roundOptionIds[idx];
    if (optionIds && optionIds.length) {
      const buttons = Array.from(optionsGrid.querySelectorAll("button.option"));
      buttons.forEach((btn, i) => {
        const optId = optionIds[i];
        if (!optId) return;
        btn.textContent = (game.mode === GAME_MODE.COUNTRY_TO_CAPITAL)
          ? getCapitalName(optId)
          : getCountryName(optId);
      });
    }
  }

  // -----------------------------
  // Start screen config dropdown
  // -----------------------------
  function toggleConfigPanel() {
    const isHidden = configPanel.classList.contains("hidden");
    if (isHidden) {
      configPanel.classList.remove("hidden");
      configPanel.setAttribute("aria-hidden", "false");
      btnToggleConfig.setAttribute("aria-expanded", "true");
      configToggleArrow.textContent = "▲";
    } else {
      configPanel.classList.add("hidden");
      configPanel.setAttribute("aria-hidden", "true");
      btnToggleConfig.setAttribute("aria-expanded", "false");
      configToggleArrow.textContent = "▼";
    }
  }

  function updateConfigConstraints() {
    const max = Math.max(5, countriesList.length || 5);
    numQuestionsInput.min = "5";
    numQuestionsInput.max = String(max);
    if (Number(numQuestionsInput.value) > max) numQuestionsInput.value = String(max);
    if (Number(numQuestionsInput.value) < 5) numQuestionsInput.value = "5";

    if (typeof T.numQuestionsHelp === "function") {
      numQuestionsHelp.textContent = T.numQuestionsHelp(max);
    } else {
      numQuestionsHelp.textContent = "";
    }

    timeLimitHelp.textContent = T.timeLimitHelp || "";
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

    updateConfigConstraints();

    const max = countriesList.length;
    const requested = Number(numQuestionsInput.value || 10);
    const N = clamp(requested, 5, max);
    numQuestionsInput.value = String(N);

    const allIds = countriesList.map(x => x.id);
    const roundCountryIds = sample(allIds, Math.min(N, allIds.length));

    const selectedMode = getSelectedMode();
    timeSecondsCurrent = getSelectedTimeSeconds();

    game = {
      mode: selectedMode,
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

    // enunciado según modo
    if (game.mode === GAME_MODE.COUNTRY_TO_CAPITAL) {
      questionText.textContent = T.questionCountryToCapital(getCountryName(correctId));
    } else {
      questionText.textContent = T.questionCapitalToCountry(getCapitalName(correctId));
    }

    if (game.locked && !force) return;

    if (game.locked) {
      renderTimer();
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

      // botones según modo
      btn.textContent = (game.mode === GAME_MODE.COUNTRY_TO_CAPITAL)
        ? getCapitalName(optionId)
        : getCountryName(optionId);

      btn.addEventListener("click", () => pickAnswer(optionId));
      optionsGrid.appendChild(btn);
    });

    game.locked = false;

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

  // YOUR MODIFICATION INCLUDED (sleepTime OK/KO)
  function pickAnswer(chosenId) {
    if (!game || game.locked) return;
    game.locked = true;

    stopTimer();

    const correctId = game.roundCountryIds[game.idx];
    const isCorrect = chosenId === correctId;

    disableOptionsAndMark(correctId, chosenId);

    let sleepTime = sleepTimeAfterAnswerOK;

    if (isCorrect) {
      game.score += 1;
      feedback.textContent = T.feedbackOk;
      feedback.classList.add("ok");
    } else {
      // feedback depende del modo
      if (game.mode === GAME_MODE.COUNTRY_TO_CAPITAL) {
        feedback.textContent = T.feedbackBadWithCorrectCapital(getCapitalName(correctId));
      } else {
        feedback.textContent = T.feedbackBadWithCorrectCountry(getCountryName(correctId));
      }
      feedback.classList.add("bad");
      sleepTime = sleepTimeAfterAnswerKO;
    }

    game.history.push({ countryId: correctId, chosenId, isCorrect, timedOut: false });

    setTimeout(() => nextRound(), sleepTime);
  }

  function onTimeUp() {
    if (!game || game.locked) return;
    game.locked = true;

    const correctId = game.roundCountryIds[game.idx];
    const chosenId = null;

    disableOptionsAndMark(correctId, chosenId);

    // feedback depende del modo
    if (game.mode === GAME_MODE.COUNTRY_TO_CAPITAL) {
      feedback.textContent = T.feedbackTimeUpWithCorrectCapital(getCapitalName(correctId));
    } else {
      feedback.textContent = T.feedbackTimeUpWithCorrectCountry(getCountryName(correctId));
    }
    feedback.classList.add("bad");

    game.history.push({ countryId: correctId, chosenId, isCorrect: false, timedOut: true });

    setTimeout(() => nextRound(), sleepTimeAfterAnswerKO);
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
        const chosenText = h.chosenId
          ? (game.mode === GAME_MODE.COUNTRY_TO_CAPITAL ? getCapitalName(h.chosenId) : getCountryName(h.chosenId))
          : T.resultsTable.none;

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

    modeTitle.textContent = T.modeTitle;
    modeCountryToCapitalLabel.textContent = T.modeCountryToCapital;
    modeCapitalToCountryLabel.textContent = T.modeCapitalToCountry;

    btnStart.textContent = T.btnStart;
    btnViewList.textContent = T.btnViewList;
    startHint.textContent = T.startHint;

    configToggleText.textContent = T.btnToggleConfig;

    labelNumQuestions.textContent = T.labelNumQuestions;
    labelTimeLimit.textContent = T.labelTimeLimit;

    btnQuit.textContent = T.btnQuit;

    btnPlayAgain.textContent = T.btnPlayAgain;
    btnBackHome.textContent = T.btnBackHome;

    document.title = T.title;

    // ayuda config depende de max => se rellena en updateConfigConstraints()
    timeLimitHelp.textContent = T.timeLimitHelp || "";

    // texto timer según idioma (si existe timer activo)
    renderTimer();
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

  btnToggleConfig.addEventListener("click", toggleConfigPanel);

  // -----------------------------
  // Init
  // -----------------------------
  (async function init() {
    renderStaticTexts();
    renderLangButtons();
    showScreen(screenStart);

    try {
      await ensureCountriesForCurrentLang();
      updateConfigConstraints();
    } catch (e) {
      console.error(e);
    }
  })();
})();

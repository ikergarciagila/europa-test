(function () {
  // --- i18n ---
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

  function setLang(lang) {
    if (!LANGS[lang]) return;
    currentLang = lang;
    T = LANGS[currentLang];
    localStorage.setItem("capitals_lang", currentLang);
    renderStaticTexts();
    renderLangButtons();
    // si estamos jugando, re-render del estado actual (sin reiniciar)
    if (game) {
      renderCurrentRound(true);
      // si ya estamos en pantalla final:
      if (!screenEnd.classList.contains("hidden")) {
        renderEndScreen();
      }
    }
  }

  // --- helpers ---
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

  // --- elements ---
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

  // --- game state ---
  let game = null;

  function showScreen(which) {
    screenStart.classList.add("hidden");
    screenGame.classList.add("hidden");
    screenEnd.classList.add("hidden");
    which.classList.remove("hidden");
  }

  function buildRoundOptions(correctCapital, allCapitals) {
    const distractors = sample(allCapitals.filter(c => c !== correctCapital), 3);
    return shuffle([correctCapital, ...distractors]);
  }

  function startGame() {
    const COUNTRIES = window.COUNTRIES || [];
    if (COUNTRIES.length < 4) {
      alert(T.alertNeedMoreCountries);
      return;
    }

    const requested = Number(numQuestionsInput.value || 10);
    const N = clamp(requested, 5, 50);
    numQuestionsInput.value = N;

    const rounds = sample(COUNTRIES, Math.min(N, COUNTRIES.length));
    const allCapitals = COUNTRIES.map(x => x.capital);

    game = {
      total: rounds.length,
      idx: 0,
      score: 0,
      rounds,
      allCapitals,
      history: [], // {country, correct, chosen, isCorrect}
      locked: false
    };

    showScreen(screenGame);
    renderCurrentRound(true);
  }

  function renderCurrentRound(force) {
    if (!game) return;

    // si estamos en feedback (locked) y no forzamos, no tocamos botones
    if (game.locked && !force) return;

    feedback.textContent = "";
    feedback.className = "feedback";
    optionsGrid.innerHTML = "";

    const { idx, total, rounds, score, allCapitals } = game;
    const current = rounds[idx];

    pillProgress.textContent = T.pillProgress(idx + 1, total);
    pillScore.textContent = T.pillScore(score);
    questionText.textContent = T.question(current.country);

    const options = buildRoundOptions(current.capital, allCapitals);

    options.forEach(cap => {
      const btn = document.createElement("button");
      btn.className = "option";
      btn.type = "button";
      btn.textContent = cap;
      btn.addEventListener("click", () => pickAnswer(cap));
      optionsGrid.appendChild(btn);
    });

    game.locked = false;
  }

  function pickAnswer(chosen) {
    if (!game || game.locked) return;
    game.locked = true;

    const current = game.rounds[game.idx];
    const correct = current.capital;
    const isCorrect = chosen === correct;

    const buttons = Array.from(optionsGrid.querySelectorAll("button.option"));
    for (const b of buttons) {
      const cap = b.textContent;
      b.disabled = true;

      if (cap === correct) b.classList.add("ok");
      if (!isCorrect && cap === chosen) b.classList.add("bad");
    }

    if (isCorrect) {
      game.score += 1;
      feedback.textContent = T.feedbackOk;
      feedback.classList.add("ok");
    } else {
      feedback.textContent = T.feedbackBad(correct);
      feedback.classList.add("bad");
    }

    game.history.push({
      country: current.country,
      correct,
      chosen,
      isCorrect
    });

    setTimeout(() => {
      game.idx += 1;
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

    // headers tabla
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
      tdCountry.textContent = h.country;

      const tdChosen = document.createElement("td");
      tdChosen.textContent = h.chosen;

      const tdCorrect = document.createElement("td");
      tdCorrect.textContent = h.correct;

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

  // --- static texts (no dependen del progreso) ---
  function renderStaticTexts() {
    title.textContent = T.title;
    subtitle.textContent = T.subtitle;

    labelNumQuestions.textContent = T.labelNumQuestions;
    btnStart.textContent = T.btnStart;
    startHint.textContent = T.startHint;

    btnQuit.textContent = T.btnQuit;

    btnPlayAgain.textContent = T.btnPlayAgain;
    btnBackHome.textContent = T.btnBackHome;
  }

  function renderLangButtons() {
    langEs.classList.toggle("active", currentLang === "es");
    langCa.classList.toggle("active", currentLang === "ca");
    // para accesibilidad/semántica:
    document.documentElement.lang = currentLang;
  }

  // --- events ---
  btnStart.addEventListener("click", startGame);
  btnQuit.addEventListener("click", quitToHome);
  btnPlayAgain.addEventListener("click", startGame);
  btnBackHome.addEventListener("click", quitToHome);

  langEs.addEventListener("click", () => setLang("es"));
  langCa.addEventListener("click", () => setLang("ca"));

  // --- init ---
  renderStaticTexts();
  renderLangButtons();
  showScreen(screenStart);
})();

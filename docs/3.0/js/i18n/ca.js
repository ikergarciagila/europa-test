window.I18N_CA = {
  langCode: "ca",

  title: "Joc: Capitals d'Europa",
  subtitle: "Tria quantes preguntes vols i prem Començar.",

  labelNumQuestions: "Nombre de preguntes:",
  btnStart: "Començar",
  btnViewList: "Veure llistat",
  startHint: "Tria una modalitat i prem Començar. Pots ajustar les opcions a Configuració.",

  btnQuit: "Sortir",

  pillProgress: (current, total) => `Pregunta ${current}/${total}`,
  pillScore: (score) => `Encerts: ${score}`,
  pillTimer: (secs) => `Temps: ${secs}s`,

  question: (country) => `Quina és la capital de ${country}?`,

  feedbackOk: "✅ Correcte!",
  feedbackBad: (correct) => `❌ Incorrecte. La correcta és: ${correct}`,
  feedbackTimeUp: (correct) => `⏱️ Temps esgotat! La correcta és: ${correct}`,

  listTitle: "Llistat de països i capitals",
  listSubtitle: "Per repassar abans de jugar (o després).",
  btnBackFromList: "Tornar",
  listTable: { num: "#", country: "País", capital: "Capital" },

  resultsTitle: "Resultats",
  finalSummary: (score, total) => `Has encertat ${score} de ${total}.`,

  btnPlayAgain: "Tornar a jugar",
  btnBackHome: "Tornar a l'inici",

  resultsTable: {
    num: "#",
    country: "País",
    capital: "Capital (correcta)",
    status: "Estat",
    ok: "OK",
    fail: "ERROR",
    chosenLabel: "Triada:",
    none: "—"
  },

  alertNeedMoreCountries: "Necessites com a mínim 4 països/capitals a la llista.",

  modeTitle: "Modalitat",
  modeCountryToCapital: "Endevinar capital",
  modeCapitalToCountry: "Endevinar país",

  btnToggleConfig: "Configuració",

  labelTimeLimit: "Temps (segons):",
  timeLimitHelp: "0 = sense límit de temps",

  numQuestionsHelp: (max) => `Entre 5 i ${max}`,

  pillTimer: (secs) => `Temps: ${secs}s`,

  questionCountryToCapital: (country) => `Quina és la capital de ${country}?`,
  questionCapitalToCountry: (capital) => `De quin país és la capital ${capital}?`,

  feedbackBadWithCorrectCapital: (correctCapital) => `❌ Incorrecte. La correcta és: ${correctCapital}`,
  feedbackBadWithCorrectCountry: (correctCountry) => `❌ Incorrecte. La correcta és: ${correctCountry}`,

  feedbackTimeUpWithCorrectCapital: (correctCapital) => `⏱️ Temps esgotat! La correcta és: ${correctCapital}`,
  feedbackTimeUpWithCorrectCountry: (correctCountry) => `⏱️ Temps esgotat! La correcta és: ${correctCountry}`,

};


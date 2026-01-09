window.I18N_CA = {
  langCode: "ca",

  title: "Joc: Capitals d'Europa",
  subtitle: "Tria quantes preguntes vols i prem Començar.",

  labelNumQuestions: "Nombre de preguntes:",
  btnStart: "Començar",
  btnViewList: "Veure llistat",
  startHint: "(De moment, això és suficient com a “menú”. Més endavant hi afegirem modes de joc.)",

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
};


window.I18N_CA = {
  langCode: "ca",

  title: "Joc: Capitals d'Europa",
  subtitle: "Tria quantes preguntes vols i prem Començar.",

  labelNumQuestions: "Nombre de preguntes:",
  btnStart: "Començar",
  startHint: "(De moment, això és suficient com a “menú”. Més endavant hi afegirem modes de joc.)",

  btnQuit: "Sortir",

  pillProgress: (current, total) => `Pregunta ${current}/${total}`,
  pillScore: (score) => `Encerts: ${score}`,

  question: (country) => `Quina és la capital de ${country}?`,

  feedbackOk: "✅ Correcte!",
  feedbackBad: (correct) => `❌ Incorrecte. La correcta és: ${correct}`,

  resultsTitle: "Resultats",
  finalSummary: (score, total) => `Has encertat ${score} de ${total}.`,

  btnPlayAgain: "Tornar a jugar",
  btnBackHome: "Tornar a l'inici",

  table: {
    num: "#",
    country: "País",
    yourAnswer: "La teva resposta",
    correct: "Correcta",
    status: "Estat",
    ok: "OK",
    fail: "ERROR",
  },

  alertNeedMoreCountries: "Necessites com a mínim 4 països/capitals a la llista.",
};

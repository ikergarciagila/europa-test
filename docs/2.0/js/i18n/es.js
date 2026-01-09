window.I18N_ES = {
  langCode: "es",

  title: "Juego: Capitales de Europa",
  subtitle: "Elige cuántas preguntas quieres y pulsa Empezar.",

  labelNumQuestions: "Número de preguntas:",
  btnStart: "Empezar",
  btnViewList: "Ver listado",
  startHint: "(De momento, esto es suficiente como “menú”. Más adelante metemos modos de juego.)",

  btnQuit: "Salir",

  pillProgress: (current, total) => `Pregunta ${current}/${total}`,
  pillScore: (score) => `Aciertos: ${score}`,
  pillTimer: (secs) => `Tiempo: ${secs}s`,

  question: (country) => `¿Cuál es la capital de ${country}?`,

  feedbackOk: "✅ ¡Correcto!",
  feedbackBad: (correct) => `❌ Incorrecto. La correcta es: ${correct}`,
  feedbackTimeUp: (correct) => `⏱️ ¡Tiempo! La correcta es: ${correct}`,

  listTitle: "Listado de países y capitales",
  listSubtitle: "Para repasar antes de jugar (o después).",
  btnBackFromList: "Volver",
  listTable: { num: "#", country: "País", capital: "Capital" },

  resultsTitle: "Resultados",
  finalSummary: (score, total) => `Has acertado ${score} de ${total}.`,

  btnPlayAgain: "Jugar otra vez",
  btnBackHome: "Volver al inicio",

  resultsTable: {
    num: "#",
    country: "País",
    capital: "Capital (correcta)",
    status: "Estado",
    ok: "OK",
    fail: "FALLO",
    chosenLabel: "Elegida:",
    none: "—"
  },

  alertNeedMoreCountries: "Necesitas al menos 4 países/capitales en la lista.",
};

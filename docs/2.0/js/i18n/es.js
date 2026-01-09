window.I18N_ES = {
  langCode: "es",

  title: "Juego: Capitales de Europa",
  subtitle: "Elige cuántas preguntas quieres y pulsa Empezar.",

  labelNumQuestions: "Número de preguntas:",
  btnStart: "Empezar",
  startHint: "(De momento, esto es suficiente como “menú”. Más adelante metemos modos de juego.)",

  btnQuit: "Salir",

  pillProgress: (current, total) => `Pregunta ${current}/${total}`,
  pillScore: (score) => `Aciertos: ${score}`,

  question: (country) => `¿Cuál es la capital de ${country}?`,

  feedbackOk: "✅ ¡Correcto!",
  feedbackBad: (correct) => `❌ Incorrecto. La correcta es: ${correct}`,

  resultsTitle: "Resultados",
  finalSummary: (score, total) => `Has acertado ${score} de ${total}.`,

  btnPlayAgain: "Jugar otra vez",
  btnBackHome: "Volver al inicio",

  table: {
    num: "#",
    country: "País",
    yourAnswer: "Tu respuesta",
    correct: "Correcta",
    status: "Estado",
    ok: "OK",
    fail: "FALLO",
  },

  alertNeedMoreCountries: "Necesitas al menos 4 países/capitales en la lista.",
};

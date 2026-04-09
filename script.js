(() => {
  if (!window.__authOK) return;

  const dataSource =
    Array.isArray(window.quizData) ? window.quizData :
    (typeof quizData !== "undefined" && Array.isArray(quizData) ? quizData : null);

  if (!Array.isArray(dataSource)) {
    console.error("quizData not found");
    return;
  }

  const $ = (id) => document.getElementById(id);

  const menuScreen = $("menuScreen");
  const quizScreen = $("quizScreen");
  const resultScreen = $("resultScreen");

  const startInput = $("startInput");
  const endInput = $("endInput");
  const startBtn = $("startBtn");
  const wordText = $("wordText");
  const choicesBox = $("choices");
  const feedbackBox = $("feedback");
  const progressText = $("progressText");
  const scoreText = $("scoreText");
  const prevBtn = $("prevBtn");
  const nextBtn = $("nextBtn");
  const restartBtn = $("restartBtn");
  const retryRangeBtn = $("retryRangeBtn");
  const backMenuBtn = $("backMenuBtn");
  const restartFromResultBtn = $("restartFromResultBtn");
  const retryRangeFromResultBtn = $("retryRangeFromResultBtn");
  const backMenuFromResultBtn = $("backMenuFromResultBtn");
  const finalScore = $("finalScore");
  const speakBtn = $("speakBtn");

  let mode = "order";
  let currentList = [];
  let currentIndex = 0;
  let score = 0;
  let answers = {};
  let lastConditions = null;

  document.querySelectorAll(".modeBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".modeBtn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      mode = btn.dataset.mode;
    });
  });

  function showScreen(target) {
    [menuScreen, quizScreen, resultScreen].forEach((s) => s.classList.add("hidden"));
    target.classList.remove("hidden");
  }

  function normalizeRange() {
    let start = Number(startInput.value);
    let end = Number(endInput.value);

    if (Number.isNaN(start)) start = 1401;
    if (Number.isNaN(end)) end = 1552;

    start = Math.max(1401, Math.min(1552, start));
    end = Math.max(1401, Math.min(1552, end));

    if (start > end) [start, end] = [end, start];

    startInput.value = start;
    endInput.value = end;
    return { start, end };
  }

  function shuffleArray(arr) {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function buildList() {
    const { start, end } = normalizeRange();
    let list = dataSource.filter((item) => item.no >= start && item.no <= end);
    if (mode === "random") list = shuffleArray(list);

    currentList = list;
    currentIndex = 0;
    answers = {};
    score = 0;
    lastConditions = { start, end, mode };
  }

  function recalcScore() {
    score = Object.values(answers).filter((a) => a.correct).length;
  }

  function renderFeedback(item, answerState) {
    if (!answerState) {
      feedbackBox.className = "feedback hidden";
      feedbackBox.innerHTML = "";
      return;
    }
    feedbackBox.className = `feedback ${answerState.correct ? "ok" : "ng"}`;
    feedbackBox.innerHTML = `
      <div class="fbTitle">${answerState.correct ? "正解！" : "不正解"}</div>
      <div class="fbAnswer">正解：${item.meaning}</div>
      <div class="fbExample"><strong>例文：</strong>${item.sentence || ""}</div>
      <div class="fbTranslation"><strong>和訳：</strong>${item.translation || ""}</div>
    `;
  }

  function renderQuestion() {
    const item = currentList[currentIndex];
    if (!item) return;

    progressText.textContent = `${currentIndex + 1} / ${currentList.length}`;
    scoreText.textContent = `Score: ${score}`;
    wordText.textContent = item.word;

    choicesBox.innerHTML = "";
    const answerState = answers[item.no];

    item.choices.forEach((choice) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choiceBtn";
      btn.textContent = choice;

      if (answerState) {
        if (choice === item.meaning) btn.classList.add("correct");
        else if (choice === answerState.selected && choice !== item.meaning) btn.classList.add("wrong");
        else btn.classList.add("dim");
      } else {
        btn.addEventListener("click", () => handleAnswer(choice));
      }

      choicesBox.appendChild(btn);
    });

    renderFeedback(item, answerState);

    prevBtn.disabled = currentIndex === 0;
    nextBtn.textContent = currentIndex === currentList.length - 1 ? "結果へ" : "次へ";
  }

  function handleAnswer(choice) {
    const item = currentList[currentIndex];
    if (answers[item.no]) return;

    answers[item.no] = {
      selected: choice,
      correct: choice === item.meaning
    };
    recalcScore();
    renderQuestion();
  }

  function goNext() {
    if (!currentList.length) return;

    if (currentIndex < currentList.length - 1) {
      currentIndex += 1;
      renderQuestion();
    } else {
      recalcScore();
      finalScore.textContent = `${score} / ${currentList.length}`;
      showScreen(resultScreen);
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      currentIndex -= 1;
      renderQuestion();
    }
  }

  function restartSameConditions() {
    if (!lastConditions) return;
    mode = lastConditions.mode;
    document.querySelectorAll(".modeBtn").forEach((b) => {
      b.classList.toggle("active", b.dataset.mode === mode);
    });
    startInput.value = lastConditions.start;
    endInput.value = lastConditions.end;
    buildList();
    showScreen(quizScreen);
    renderQuestion();
  }

  function backToMenu() {
    showScreen(menuScreen);
  }

  startBtn.addEventListener("click", () => {
    buildList();
    if (!currentList.length) {
      alert("指定範囲の問題が見つかりません。");
      return;
    }
    showScreen(quizScreen);
    renderQuestion();
  });

  nextBtn.addEventListener("click", goNext);
  prevBtn.addEventListener("click", goPrev);
  restartBtn.addEventListener("click", restartSameConditions);
  retryRangeBtn.addEventListener("click", backToMenu);
  backMenuBtn.addEventListener("click", backToMenu);
  restartFromResultBtn.addEventListener("click", restartSameConditions);
  retryRangeFromResultBtn.addEventListener("click", backToMenu);
  backMenuFromResultBtn.addEventListener("click", backToMenu);

  if (speakBtn) {
    speakBtn.addEventListener("click", () => {
      const item = currentList[currentIndex];
      if (!item || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(item.word);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    });
  }

  showScreen(menuScreen);
})();

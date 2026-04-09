window.addEventListener('DOMContentLoaded',()=>{
  if(!window.__authOK)return;
  const data = window.quizData || [];
  const startBtn = document.getElementById('startBtn');
  const menu = document.getElementById('menuScreen');
  const quiz = document.getElementById('quizScreen');

  startBtn.addEventListener('click',()=>{
    if(!data.length)return;
    menu.classList.add('hidden');
    quiz.classList.remove('hidden');
  });
});

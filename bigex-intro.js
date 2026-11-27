(() => {
  const intro = document.getElementById('bigexIntro');
  if (!intro) return;
  const skip = intro.querySelector('[data-intro-skip]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const alreadySeen = sessionStorage.getItem('bigexIntroSeen') === '1';
  let dismissed = false;
  let timer;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    window.clearTimeout(timer);
    sessionStorage.setItem('bigexIntroSeen', '1');
    intro.classList.add('is-leaving');
    window.setTimeout(() => intro.remove(), 900);
  };
  skip.addEventListener('click', dismiss);
  if (alreadySeen || reducedMotion) {
    dismiss();
    return;
  }
  timer = window.setTimeout(dismiss, 4800);
})();

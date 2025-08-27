export function triggerFlashAndRise(callback: () => void): void {
  const flashOverlay = document.getElementById('flashOverlay');
  if (!flashOverlay) return;

  // Flash effect - twice
  flashOverlay.style.opacity = '1';
  setTimeout(() => {
    flashOverlay.style.opacity = '0';
    setTimeout(() => {
      flashOverlay.style.opacity = '1';
      setTimeout(() => {
        flashOverlay.style.opacity = '0';
        // Execute callback after flash completes
        callback();
      }, 120);
    }, 120);
  }, 120);
}

export function createConfetti(): void {
  const colors = ['#049FD9', '#63e6be', '#7aa2ff', '#ffd700', '#ff6b6b'];
  
  for (let i = 0; i < 50; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.position = 'fixed';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.top = Math.random() * 50 + 'vh';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.width = '10px';
      confetti.style.height = '10px';
      confetti.style.borderRadius = '50%';
      confetti.style.pointerEvents = 'none';
      confetti.style.zIndex = '1000';
      confetti.style.animation = 'confetti-fall 3s ease-out forwards';
      
      document.body.appendChild(confetti);
      
      setTimeout(() => {
        if (confetti.parentNode) {
          confetti.parentNode.removeChild(confetti);
        }
      }, 3000);
    }, i * 50);
  }
}

export function animateScoreCountUp(element: HTMLElement, finalScore: number, duration: number = 2000): void {
  const startScore = 0;
  const startTime = performance.now();
  
  function updateScore(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function (ease-out cubic)
    const easeOutCubic = 1 - Math.pow(1 - progress, 3);
    const currentScore = Math.round(startScore + (finalScore - startScore) * easeOutCubic);
    
    element.textContent = `${currentScore}/50`;
    
    if (progress < 1) {
      requestAnimationFrame(updateScore);
    }
  }
  
  requestAnimationFrame(updateScore);
}

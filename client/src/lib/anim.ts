import { audioManager } from './audio';

export function triggerFlashAndRise(callback: () => void): void {
  const flashOverlay = document.getElementById('flashOverlay');
  if (!flashOverlay) return;

  // Play buzz sound with the flash animation
  audioManager.playBuzzSound().catch(err => {
    console.log('Buzz sound playback prevented by browser:', err);
  });

  // Flash effect - twice at 70% opacity for 120ms each
  flashOverlay.style.opacity = '0.7';
  setTimeout(() => {
    flashOverlay.style.opacity = '0';
    setTimeout(() => {
      flashOverlay.style.opacity = '0.7';
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

export function animateRiseToRank(element: HTMLElement, targetPosition: number, duration: number): void {
  // Start from bottom of viewport
  const viewportHeight = window.innerHeight;
  const startPosition = viewportHeight + 100; // Start below viewport
  const targetY = element.getBoundingClientRect().top;
  const startTime = performance.now();
  
  element.style.willChange = 'transform';
  element.style.position = 'relative';
  
  function updatePosition(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Smoother easing for slow rise
    const easeInOutCustom = (t: number) => {
      // Slow start, gradual acceleration, slow finish
      return t < 0.5
        ? 2 * t * t
        : -1 + (4 - 2 * t) * t;
    };
    
    const easedProgress = easeInOutCustom(progress);
    const currentY = startPosition - (startPosition - targetY) * easedProgress;
    
    element.style.transform = `translateY(${currentY - targetY}px)`;
    element.style.opacity = Math.min(progress * 2, 1).toString();
    
    if (progress < 1) {
      requestAnimationFrame(updatePosition);
    } else {
      element.style.willChange = 'auto';
      element.style.transform = 'none';
      element.style.opacity = '1';
    }
  }
  
  requestAnimationFrame(updatePosition);
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
    
    const MAX_COMBINED_SCORE = 100;
    element.textContent = `${currentScore}/${MAX_COMBINED_SCORE}`;
    
    if (progress < 1) {
      requestAnimationFrame(updateScore);
    }
  }
  
  requestAnimationFrame(updateScore);
}

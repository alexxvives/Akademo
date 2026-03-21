import confetti from 'canvas-confetti';

export function fireConfetti() {
  const duration = 1500;
  const end = Date.now() + duration;
  const colors = ['#6366f1', '#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b'];
  const frame = () => {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

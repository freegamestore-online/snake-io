// Slither Arena — smooth 360° snake on a raw canvas 2D loop.
// Steer with the mouse / your finger; hold to boost (costs a little length);
// eat the glowing dots to grow; touch your own body and it's game over.
//
// Same startGame contract as before: App.tsx hands us the canvas + a score
// callback and gets a teardown back.

import { makeSnake, updateSnake, hitsSelf, drawSnake, SEG_RADIUS, type Snake } from "./snake";
import { fillFood, drawFood, type Food } from "./food";
import { attachInput } from "./input";

type Phase = "playing" | "over";

export function startGame(canvas: HTMLCanvasElement, onScore: (n: number) => void): () => void {
  const ctx = canvas.getContext("2d")!;
  const input = attachInput(canvas);

  // size the drawing buffer to the element (and follow resizes)
  const resize = () => {
    canvas.width = canvas.clientWidth || 800;
    canvas.height = canvas.clientHeight || 600;
  };
  resize();
  window.addEventListener("resize", resize);

  let snake: Snake = makeSnake(canvas.width / 2, canvas.height / 2);
  let foods: Food[] = [];
  let score = 0;
  let best = Number(localStorage.getItem("snakeio_best") || 0);
  let phase: Phase = "playing";
  let t = 0;
  let raf = 0;
  let last = performance.now();

  fillFood(foods, canvas.width, canvas.height);
  onScore(0);

  const restart = () => {
    snake = makeSnake(canvas.width / 2, canvas.height / 2);
    foods = [];
    fillFood(foods, canvas.width, canvas.height);
    score = 0;
    onScore(0);
    phase = "playing";
  };

  const onRestartClick = () => { if (phase === "over") restart(); };
  canvas.addEventListener("mousedown", onRestartClick);
  canvas.addEventListener("touchstart", onRestartClick);

  const frame = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    t += dt;
    const w = canvas.width;
    const h = canvas.height;

    if (phase === "playing") {
      // steer toward the pointer; hold = boost
      const head = snake.segs[0]!;
      if (input.state.active) {
        snake.targetAngle = Math.atan2(input.state.y - head.y, input.state.x - head.x);
      }
      snake.boosting = input.state.held;
      updateSnake(snake, dt);

      // soft walls: wrap around the screen (move ANYWHERE — no wall deaths)
      const h2 = snake.segs[0]!;
      if (h2.x < -SEG_RADIUS) h2.x = w + SEG_RADIUS;
      if (h2.x > w + SEG_RADIUS) h2.x = -SEG_RADIUS;
      if (h2.y < -SEG_RADIUS) h2.y = h + SEG_RADIUS;
      if (h2.y > h + SEG_RADIUS) h2.y = -SEG_RADIUS;

      // eat food
      for (let i = foods.length - 1; i >= 0; i--) {
        const f = foods[i]!;
        const dx = h2.x - f.x;
        const dy = h2.y - f.y;
        if (dx * dx + dy * dy < (SEG_RADIUS + f.r + 4) ** 2) {
          foods.splice(i, 1);
          snake.targetLen += 2;
          score += 1;
          onScore(score);
          if (score > best) {
            best = score;
            localStorage.setItem("snakeio_best", String(best));
          }
        }
      }
      fillFood(foods, w, h);

      // self-collision = game over
      if (hitsSelf(snake)) phase = "over";
    }

    // ── draw ──
    ctx.clearRect(0, 0, w, h);
    // subtle grid for the .io feel
    ctx.strokeStyle = "rgba(255,255,255,0.045)";
    ctx.lineWidth = 1;
    for (let gx = 0; gx < w; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
    for (let gy = 0; gy < h; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }

    drawFood(ctx, foods, t);
    drawSnake(ctx, snake);

    if (phase === "playing") {
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "12px Manrope, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("move: mouse / finger · hold to boost", w / 2, h - 12);
    } else {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, w, h);
      ctx.textAlign = "center";
      ctx.fillStyle = "#f87171";
      ctx.font = "bold 42px Fraunces, serif";
      ctx.fillText("Ouch! You bit yourself 🐍", w / 2, h / 2 - 46);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 26px Manrope, sans-serif";
      ctx.fillText(`Score: ${score}`, w / 2, h / 2);
      ctx.fillStyle = "#facc15";
      ctx.font = "18px Manrope, sans-serif";
      ctx.fillText(`Best: ${best}`, w / 2, h / 2 + 30);
      ctx.fillStyle = "#34d399";
      ctx.font = "bold 20px Manrope, sans-serif";
      ctx.fillText("tap / click to play again", w / 2, h / 2 + 72);
    }

    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    canvas.removeEventListener("mousedown", onRestartClick);
    canvas.removeEventListener("touchstart", onRestartClick);
    input.detach();
  };
}

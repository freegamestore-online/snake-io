// Glowing food dots. Eating one grows the snake and scores a point.

export interface Food {
  x: number;
  y: number;
  r: number;
  color: string;
  pulse: number; // animation phase
}

const COLORS = ["#f472b6", "#facc15", "#60a5fa", "#a78bfa", "#fb923c", "#4ade80"];
export const FOOD_COUNT = 26;

export function makeFood(w: number, h: number): Food {
  return {
    x: 30 + Math.random() * (w - 60),
    y: 30 + Math.random() * (h - 60),
    r: 5 + Math.random() * 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    pulse: Math.random() * Math.PI * 2,
  };
}

export function fillFood(foods: Food[], w: number, h: number): void {
  while (foods.length < FOOD_COUNT) foods.push(makeFood(w, h));
}

export function drawFood(ctx: CanvasRenderingContext2D, foods: Food[], t: number): void {
  for (const f of foods) {
    const r = f.r + Math.sin(t * 3 + f.pulse) * 1.2;
    ctx.beginPath();
    ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
    ctx.fillStyle = f.color;
    ctx.shadowColor = f.color;
    ctx.shadowBlur = 14;
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

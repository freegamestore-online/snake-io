// The snake: a chain of round segments following a smoothly-turning head.
// 360° movement — the head steers toward a target angle (set from input),
// always moving forward, smooth continuous style.

export interface Snake {
  /** segment positions, head first */
  segs: { x: number; y: number }[];
  /** current heading, radians */
  angle: number;
  /** desired heading (from input) */
  targetAngle: number;
  /** how many segments the snake should have (grows when eating) */
  targetLen: number;
  boosting: boolean;
}

export const SEG_SPACING = 9; // px between segment centers
export const SEG_RADIUS = 10;
export const BASE_SPEED = 150; // px/s
export const BOOST_SPEED = 260;
export const TURN_RATE = 4.2; // rad/s — how fast the head can turn
export const START_LEN = 12;

export function makeSnake(x: number, y: number): Snake {
  const segs = [];
  for (let i = 0; i < START_LEN; i++) segs.push({ x: x - i * SEG_SPACING, y });
  return { segs, angle: 0, targetAngle: 0, targetLen: START_LEN, boosting: false };
}

/** Advance the snake one frame. Returns distance moved (for scoring drains). */
export function updateSnake(s: Snake, dt: number): void {
  // turn head toward target angle by the shortest arc
  let diff = s.targetAngle - s.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const maxTurn = TURN_RATE * dt;
  s.angle += Math.max(-maxTurn, Math.min(maxTurn, diff));

  const speed = s.boosting && s.segs.length > 6 ? BOOST_SPEED : BASE_SPEED;
  const head = s.segs[0]!;
  const nx =head.x + Math.cos(s.angle) * speed * dt;
  const ny = head.y + Math.sin(s.angle) * speed * dt;

  // move head, then each segment follows the one before it at fixed spacing
  s.segs[0] = { x: nx, y: ny };
  for (let i = 1; i < s.segs.length; i++) {
    const prev = s.segs[i - 1]!;
    const cur = s.segs[i]!;
    const dx = cur.x - prev.x;
    const dy = cur.y - prev.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > SEG_SPACING) {
      const t = SEG_SPACING / d;
      s.segs[i] = { x: prev.x + dx * t, y: prev.y + dy * t };
    }
  }

  // grow toward target length (one segment per frame keeps it smooth)
  if (s.segs.length < s.targetLen) {
    const tail = s.segs[s.segs.length - 1]!;
    s.segs.push({ x: tail.x, y: tail.y });
  }
  // boosting burns length slowly (classic trade-off)
  if (s.boosting && s.segs.length > 8) {
    s.targetLen = Math.max(8, s.targetLen - dt * 1.5);
    if (s.segs.length > Math.ceil(s.targetLen)) s.segs.pop();
  }
}

/** Head touching own body (skip the neck — always overlapping) = death. */
export function hitsSelf(s: Snake): boolean {
  const head = s.segs[0]!;
  const r2 =(SEG_RADIUS * 1.3) ** 2;
  for (let i = 8; i < s.segs.length; i++) {
    const dx = head.x - s.segs[i]!.x;
    const dy = head.y - s.segs[i]!.y;
    if (dx * dx + dy * dy < r2) return true;
  }
  return false;
}

const BODY_COLORS = ["#10b981", "#34d399"]; // alternating emerald glow

export function drawSnake(ctx: CanvasRenderingContext2D, s: Snake): void {
  // body, tail first so the head draws on top
  for (let i = s.segs.length - 1; i >= 1; i--) {
    const seg = s.segs[i]!;
    ctx.beginPath();
    ctx.arc(seg.x, seg.y, SEG_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = BODY_COLORS[i % 2]!;
    ctx.shadowColor = "#10b981";
    ctx.shadowBlur = s.boosting ? 18 : 8;
    ctx.fill();
  }
  // head
  const head = s.segs[0]!;
  ctx.beginPath();
  ctx.arc(head.x, head.y, SEG_RADIUS + 2, 0, Math.PI * 2);
  ctx.fillStyle = "#059669";
  ctx.shadowColor = "#34d399";
  ctx.shadowBlur = 16;
  ctx.fill();
  ctx.shadowBlur = 0;
  // eyes looking in the travel direction
  const ex = Math.cos(s.angle), ey = Math.sin(s.angle);
  const px = -ey, py = ex; // perpendicular
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(head.x + ex * 5 + px * side * 5, head.y + ey * 5 + py * side * 5, 3.4, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(head.x + ex * 6.5 + px * side * 5, head.y + ey * 6.5 + py * side * 5, 1.7, 0, Math.PI * 2);
    ctx.fillStyle = "#111";
    ctx.fill();
  }
}

// Pointer input: the snake steers toward the pointer; press-and-hold boosts.
// Works with mouse (move + hold button) and touch (drag; the touch IS the hold).

export interface PointerState {
  x: number;
  y: number;
  held: boolean;
  active: boolean; // has the pointer produced any position yet
}

export function attachInput(canvas: HTMLCanvasElement): { state: PointerState; detach: () => void } {
  const state: PointerState = { x: 0, y: 0, held: false, active: false };

  const toLocal = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    state.x = ((clientX - rect.left) / rect.width) * canvas.width;
    state.y = ((clientY - rect.top) / rect.height) * canvas.height;
    state.active = true;
  };

  const onMouseMove = (e: MouseEvent) => toLocal(e.clientX, e.clientY);
  const onMouseDown = (e: MouseEvent) => { state.held = true; toLocal(e.clientX, e.clientY); };
  const onMouseUp = () => { state.held = false; };
  const onTouchStart = (e: TouchEvent) => { e.preventDefault(); state.held = true; toLocal(e.touches[0].clientX, e.touches[0].clientY); };
  const onTouchMove = (e: TouchEvent) => { e.preventDefault(); toLocal(e.touches[0].clientX, e.touches[0].clientY); };
  const onTouchEnd = () => { state.held = false; };

  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mouseup", onMouseUp);
  canvas.addEventListener("touchstart", onTouchStart, { passive: false });
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd);

  return {
    state,
    detach: () => {
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    },
  };
}

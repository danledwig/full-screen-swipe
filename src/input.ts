export interface InputState {
  active: boolean;
  pointerId: number;
  startX: number;
  dx: number;
  speed: number;
}

// Phone line positions (55% of half-width)
function calcPhoneLines(): { left: number; right: number; halfWidth: number } {
  const phoneWidth = Math.min(422, (window.innerHeight - 40) * 9 / 19);
  const halfWidth = phoneWidth * 0.5 * 0.55;
  const center = window.innerWidth / 2;
  return { left: center - halfWidth, right: center + halfWidth, halfWidth };
}

let phoneLines = calcPhoneLines();
window.addEventListener('resize', () => { phoneLines = calcPhoneLines(); }, { passive: true });

export function createInput(el: HTMLElement): InputState {
  const state: InputState = {
    active: false,
    pointerId: -1,
    startX: 0,
    dx: 0,
    speed: 0,
  };

  let prevDx = 0;
  let prevTime = 0;

  el.addEventListener('pointerdown', (e: PointerEvent) => {
    if (state.active) return;
    state.active = true;
    state.pointerId = e.pointerId;
    state.startX = e.clientX;
    state.dx = 0;
    state.speed = 0;
    prevDx = 0;
    prevTime = performance.now();
    el.setPointerCapture(e.pointerId);
  }, { passive: true });

  el.addEventListener('pointermove', (e: PointerEvent) => {
    if (!state.active || e.pointerId !== state.pointerId) return;
    state.dx = e.clientX - state.startX;

    const now = performance.now();
    const dt = now - prevTime;
    if (dt > 0) {
      const v = Math.abs(state.dx - prevDx) / dt;
      state.speed = state.speed * 0.5 + v * 0.5;
      prevDx = state.dx;
      prevTime = now;
    }
  }, { passive: true });

  const onUp = (e: PointerEvent) => {
    if (e.pointerId !== state.pointerId) return;
    state.active = false;
    prevDx = 0;
    prevTime = 0;
  };

  el.addEventListener('pointerup', onUp, { passive: true });
  el.addEventListener('pointercancel', onUp, { passive: true });
  el.addEventListener('lostpointercapture', (e: PointerEvent) => {
    if (e.pointerId === state.pointerId) state.active = false;
  }, { passive: true });

  return state;
}

export function getMaxDrag(): number { return phoneLines.halfWidth; }

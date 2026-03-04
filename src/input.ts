export interface InputState {
  active: boolean;
  pointerId: number;
  startX: number;
  dx: number;
}

// Phone line positions (80% of half-width, matching CSS)
function calcPhoneLines(): { left: number; right: number; halfWidth: number } {
  const phoneWidth = Math.min(422, (window.innerHeight - 40) * 9 / 19);
  const halfWidth = phoneWidth * 0.5 * 0.8;
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
  };

  let maxRight = 0;
  let maxLeft = 0;

  el.addEventListener('pointerdown', (e: PointerEvent) => {
    if (state.active) return;
    state.active = true;
    state.pointerId = e.pointerId;
    state.startX = e.clientX;
    state.dx = 0;
    // Per-direction limits based on distance to each phone line
    maxRight = phoneLines.right - e.clientX;
    maxLeft = e.clientX - phoneLines.left;
    el.setPointerCapture(e.pointerId);
  }, { passive: true });

  el.addEventListener('pointermove', (e: PointerEvent) => {
    if (!state.active || e.pointerId !== state.pointerId) return;
    const raw = e.clientX - state.startX;
    if (raw >= 0) {
      state.dx = raw <= maxRight
        ? raw
        : maxRight + (raw - maxRight) * 0.15;
    } else {
      const absRaw = -raw;
      state.dx = absRaw <= maxLeft
        ? raw
        : -(maxLeft + (absRaw - maxLeft) * 0.1);
    }
  }, { passive: true });

  const onUp = (e: PointerEvent) => {
    if (e.pointerId !== state.pointerId) return;
    state.active = false;
  };

  el.addEventListener('pointerup', onUp, { passive: true });
  el.addEventListener('pointercancel', onUp, { passive: true });
  el.addEventListener('lostpointercapture', (e: PointerEvent) => {
    if (e.pointerId === state.pointerId) state.active = false;
  }, { passive: true });

  return state;
}

export function getMaxDrag(): number { return phoneLines.halfWidth; }

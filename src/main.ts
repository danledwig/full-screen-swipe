import { createInput, getMaxDrag } from './input';
import { getCurrentScene, advanceScene, getNextScene, preloadImage } from './scenes';
import './style.css';

// ─── Constants ──────────────────────────────────────────────────────
const COMMIT_THRESHOLD = 0.5;
const PAN_RANGE = 0.06;
const BLUR_MAX = 15;
const CHOICE_SCALE_MIN = 0.85;
const CHOICE_APPEAR_MS = 200;

const ENTER_PAN = 12;
const CROSSFADE_DURATION = 600;

const COMMIT_BLUR = 32;
const COMMIT_PAN = 14;

const SNAPBACK_DURATION = 475;
const SNAPBACK_EASE = 'cubic-bezier(0.22, 1.8, 0.50, 1)';

// ─── State ──────────────────────────────────────────────────────────
const IDLE = 0, DRAGGING = 1, COMMITTING = 2, TRANSITIONING = 3;
let phase = TRANSITIONING;
let choiceShown = false;
let lastDir = 0;

// ─── DOM ────────────────────────────────────────────────────────────
const sceneImg = document.getElementById('scene-img')!;
const sceneNext = document.getElementById('scene-img-next')!;
const narrativeText = document.getElementById('narrative-text')!;
const choice = document.getElementById('choice')!;
const choiceText = document.getElementById('choice-text')!;
const choicePunct = document.getElementById('choice-punct')!;

// ─── Input ──────────────────────────────────────────────────────────
sceneImg.addEventListener('contextmenu', (e) => e.preventDefault());
const input = createInput(sceneImg);

// ─── Debug toggle ───────────────────────────────────────────────────
const bleedCheck = document.getElementById('bleed-check') as HTMLInputElement;
bleedCheck.addEventListener('change', () => {
  document.body.classList.toggle('bleed', bleedCheck.checked);
});

// ─── Helpers ────────────────────────────────────────────────────────
function clearTransitions(): void {
  sceneImg.style.transition = '';
  sceneNext.style.transition = '';
  choice.style.transition = '';
  choiceText.style.transition = '';
}

// ─── Scene management ───────────────────────────────────────────────
let currentScene = getCurrentScene();

function applyIdleState(): void {
  sceneImg.style.transform = 'translateX(0%)';
  sceneImg.style.filter = 'none';
  choice.style.opacity = '0';
  choiceText.style.transform = `scale(${CHOICE_SCALE_MIN})`;
}

// ─── Phase transitions ─────────────────────────────────────────────
function enterDrag(): void {
  phase = DRAGGING;
  choiceShown = false;
  lastDir = 0;
  choicePunct.textContent = '.';
  clearTransitions();
}

function enterSnapBack(): void {
  phase = IDLE;

  sceneImg.style.transition = `transform ${SNAPBACK_DURATION}ms ${SNAPBACK_EASE}, filter ${SNAPBACK_DURATION}ms ${SNAPBACK_EASE}`;
  choice.style.transition = 'opacity 200ms ease-out';

  applyIdleState();

  setTimeout(clearTransitions, SNAPBACK_DURATION + 50);
}

function enterCommit(dir: number): void {
  phase = COMMITTING;
  // Advance scene now so we can set up the next image
  currentScene = advanceScene();
  narrativeText.textContent = currentScene.narrative;

  // Current image: continue panning in swipe direction + blur
  sceneImg.style.transition = `transform ${CROSSFADE_DURATION}ms ease-out, filter ${CROSSFADE_DURATION}ms ease-out, opacity ${CROSSFADE_DURATION}ms ease-out`;
  sceneImg.style.transform = `translateX(${dir * COMMIT_PAN}%)`;
  sceneImg.style.filter = `blur(${COMMIT_BLUR}px)`;
  sceneImg.style.opacity = '0';

  // Next image: start offset from opposite side, blurred, fade in
  const startPanX = -dir * ENTER_PAN;
  sceneNext.style.transition = 'none';
  sceneNext.style.backgroundImage = `url(${currentScene.image})`;
  sceneNext.style.transform = `translateX(${startPanX}%)`;
  sceneNext.style.filter = `blur(${COMMIT_BLUR}px)`;
  sceneNext.style.opacity = '0';

  void sceneNext.offsetHeight;

  sceneNext.style.transition = `transform ${CROSSFADE_DURATION}ms ease-out, filter ${CROSSFADE_DURATION}ms ease-out, opacity ${CROSSFADE_DURATION}ms ease-out`;
  sceneNext.style.transform = 'translateX(0%)';
  sceneNext.style.filter = 'none';
  sceneNext.style.opacity = '1';

  // Fade out choice text
  choice.style.transition = `opacity ${CROSSFADE_DURATION}ms ease-out`;
  choice.style.opacity = '0';

  // Fade in narrative
  narrativeText.style.transition = 'none';
  narrativeText.style.opacity = '0';
  void narrativeText.offsetHeight;
  narrativeText.style.transition = `opacity ${CROSSFADE_DURATION}ms ease-out`;
  narrativeText.style.opacity = '1';

  preloadImage(getNextScene().image);

  setTimeout(() => {
    // Swap: copy next to main, hide next layer
    sceneImg.style.transition = 'none';
    sceneImg.style.backgroundImage = `url(${currentScene.image})`;
    sceneImg.style.transform = 'translateX(0%)';
    sceneImg.style.filter = 'none';
    sceneImg.style.opacity = '1';

    sceneNext.style.transition = 'none';
    sceneNext.style.opacity = '0';

    choiceText.style.transform = `scale(${CHOICE_SCALE_MIN})`;

    clearTransitions();
    phase = IDLE;
  }, CROSSFADE_DURATION + 50);
}

// ─── Frame loop ─────────────────────────────────────────────────────
function frame(): void {
  if (phase === IDLE && input.active) {
    enterDrag();
  }

  if (phase === DRAGGING) {
    const maxDrag = getMaxDrag();
    const ratio = maxDrag > 0 ? Math.abs(input.dx) / maxDrag : 0;
    const dir = input.dx >= 0 ? 1 : -1;

    if (input.active) {
      // Image: pan + blur (pure linear)
      const panX = dir * ratio * PAN_RANGE * 100;
      const blur = ratio * BLUR_MAX;
      sceneImg.style.transform = `translateX(${panX}%)`;
      sceneImg.style.filter = blur < 0.5 ? 'none' : `blur(${blur}px)`;

      // Choice text — only update DOM when direction or commit state changes
      if (dir !== lastDir) {
        lastDir = dir;
        const text = dir > 0 ? currentScene.rightChoice : currentScene.leftChoice;
        choiceText.textContent = text;
      }

      // Animate choice in once on first movement
      if (!choiceShown && ratio > 0.02) {
        choiceShown = true;
        choice.style.transition = `opacity ${CHOICE_APPEAR_MS}ms ease-out`;
        choiceText.style.transition = `transform ${CHOICE_APPEAR_MS}ms ease-out`;
        choice.style.opacity = '1';
        choiceText.style.transform = 'scale(1)';
      }
    } else {
      // Pointer released
      if (ratio >= COMMIT_THRESHOLD) {
        enterCommit(dir);
      } else {
        enterSnapBack();
      }
    }
  }

  requestAnimationFrame(frame);
}

// ─── Init ───────────────────────────────────────────────────────────
sceneImg.style.backgroundImage = `url(${currentScene.image})`;
narrativeText.textContent = currentScene.narrative;

// Entry animation: slide in from right, blurred → crisp
sceneImg.style.transform = `translateX(${ENTER_PAN}%)`;
sceneImg.style.filter = 'blur(18px)';
narrativeText.style.opacity = '0';

requestAnimationFrame(() => {
  sceneImg.style.transition = `transform ${CROSSFADE_DURATION}ms ease-out, filter ${CROSSFADE_DURATION}ms ease-out`;
  sceneImg.style.transform = 'translateX(0%)';
  sceneImg.style.filter = 'none';
  narrativeText.style.transition = `opacity ${CROSSFADE_DURATION}ms ease-out`;
  narrativeText.style.opacity = '1';

  preloadImage(getNextScene().image);

  setTimeout(() => {
    clearTransitions();
    phase = IDLE;
  }, CROSSFADE_DURATION + 50);
});

requestAnimationFrame(frame);

// Robust soundboard script with Safari/Chrome autoplay handling + logging
const NAMES = ["applause","boo","gasp","tada","victory","wrong"];
const sounds = {};
let audioCtx;

// Some browsers need an explicit resume of AudioContext on first click
function ensureCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    return audioCtx.resume().catch(()=>{});
  }
  return Promise.resolve();
}

// Preload HTMLAudioElements (simple & reliable)
NAMES.forEach(n => {
  const p = `./sounds/${n}.mp3`;
  const a = new Audio(p);
  a.preload = "auto";
  a.addEventListener("error", () => {
    console.error(`❌ Could not load: ${p} (check filename/case/path)`);
    a._missing = true;
  });
  sounds[n] = a;
});

// Tiny beep fallback so you still hear something if a file is missing
function beep() {
  try {
    ensureCtx().then(() => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain); gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      osc.type = "square";
      osc.frequency.value = 880;
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    });
  } catch {}
}

// Global click handler
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-sound]");
  if (!btn) return;

  const name = btn.getAttribute("data-sound");
  const a = sounds[name];
  if (!a) {
    console.error(`⚠️ Unknown sound '${name}'. Add the mp3 and include it in NAMES.`);
    return beep();
  }

  ensureCtx().then(() => {
    if (a._missing) return beep();
    a.currentTime = 0;
    a.play().catch(err => {
      console.error(`⚠️ Could not play ./sounds/${name}.mp3`, err);
      beep();
    });
  });
});

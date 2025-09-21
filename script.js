// === Soundboard loader with fallback & logging ===
const SOUND_NAMES = ["applause","boo","gasp","tada","victory","wrong"];

// Preload all sounds
const sounds = {};
SOUND_NAMES.forEach(name => {
  const path = `./sounds/${name}.mp3`;   // expects sounds/*.mp3 at repo root
  const a = new Audio(path);

  // If file can't load, mark missing (we'll beep instead so UI isn't silent)
  a.addEventListener("error", () => {
    console.error(`❌ Missing or unreachable: ${path}`);
    a._missing = true;
  });

  sounds[name] = a;
});

// Simple beep fallback so clicks still give feedback if a file is missing
function beepFallback() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = "square";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ac.currentTime);
    osc.start();
    osc.stop(ac.currentTime + 0.12);
  } catch (e) {
    console.warn("Fallback beep unavailable:", e);
  }
}

// Delegate clicks: any element with [data-sound="applause"] etc.
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-sound]");
  if (!btn) return;

  const name = btn.getAttribute("data-sound");
  const audio = sounds[name];

  if (!audio) {
    console.error(`⚠️ Unknown sound name: ${name}. Add it to SOUND_NAMES and provide ${name}.mp3`);
    beepFallback();
    return;
  }

  if (audio._missing) {
    // file not found or blocked
    beepFallback();
    return;
  }

  audio.currentTime = 0;
  audio.play().catch(err => {
    console.error(`⚠️ Could not play ./sounds/${name}.mp3`, err);
    beepFallback();
  });
});

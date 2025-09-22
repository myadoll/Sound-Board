// Soundboard using Web Audio API, Safari-safe
let AC;
function ctx() {
  if (!AC) {
    const C = window.AudioContext || window.webkitAudioContext;
    AC = new C();
  }
  return AC;
}

// Force Safari to unlock AudioContext on first click/tap
document.addEventListener("click", () => {
  if (AC && AC.state === "suspended") {
    AC.resume().then(() => {
      console.log("✅ AudioContext resumed for Safari");
    }).catch(err => {
      console.warn("⚠️ Could not resume AudioContext:", err);
    });
  }
}, { once: true });

// Helpers
function tone(freq, dur=0.2, type="sine", vol=0.5) {
  const ac = ctx();
  if (ac.state === "suspended") ac.resume();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = vol;
  osc.connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + dur);
}

function noise(dur=0.2, vol=0.4) {
  const ac = ctx();
  const bufferSize = Math.floor(ac.sampleRate * dur);
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i=0; i<bufferSize; i++) {
    data[i] = Math.random()*2 - 1;
  }
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const gain = ac.createGain();
  gain.gain.value = vol;
  src.connect(gain).connect(ac.destination);
  src.start();
  src.stop(ac.currentTime + dur);
}

// ====== Sound Effects ======
function sfx_applause() {
  for (let i=0; i<30; i++) {
    setTimeout(() => noise(0.05, 0.2), i*60 + Math.random()*100);
  }
}
function sfx_gasp() { noise(0.25, 0.6); }
function sfx_boo() { tone(160, 0.6, "square", 0.4); }
function sfx_tada() { [523, 659, 783].forEach((f,i)=>setTimeout(()=>tone(f,0.25,"triangle",0.6), i*180)); }
function sfx_victory() { [659,783,880,987,1174].forEach((f,i)=>setTimeout(()=>tone(f,0.3,"square",0.5), i*200)); }
function sfx_wrong() { tone(220, 0.4, "sawtooth", 0.5); setTimeout(()=>tone(210,0.4,"sawtooth",0.5),50); }

// Router
const handlers = {
  applause: sfx_applause,
  gasp: sfx_gasp,
  boo: sfx_boo,
  tada: sfx_tada,
  victory: sfx_victory,
  wrong: sfx_wrong
};

document.addEventListener("click", e => {
  const btn = e.target.closest("[data-sfx]");
  if (!btn) return;
  const fn = handlers[btn.dataset.sfx];
  if (fn) fn();
});

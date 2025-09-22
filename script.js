// Soundboard with no audio files — Web Audio API synthesis
let AC;
function ctx() {
  if (!AC) {
    const C = window.AudioContext || window.webkitAudioContext;
    AC = new C();
  }
  if (AC.state === "suspended") AC.resume();
  return AC;
}

// helpers
function env(attack=0.005, decay=0.2, sustain=0.0, release=0.05, gain=0.8) {
  const ac = ctx();
  const g = ac.createGain();
  g.gain.setValueAtTime(0, ac.currentTime);
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + attack);
  g.gain.exponentialRampToValueAtTime(Math.max(1e-4, sustain*gain), ac.currentTime + attack + decay);
  return { node: g, stop: (when=ac.currentTime+attack+decay+release) => {
    g.gain.setValueAtTime(g.gain.value, ac.currentTime + attack + decay);
    g.gain.exponentialRampToValueAtTime(1e-4, when);
  }};
}
function tone(freq, dur=0.2, type="sine", vol=0.5) {
  const ac = ctx();
  const osc = ac.createOscillator();
  const e = env(0.005, dur*0.7, 0.0, 0.06, vol);
  osc.type = type; osc.frequency.setValueAtTime(freq, ac.currentTime);
  osc.connect(e.node).connect(ac.destination);
  osc.start();
  e.stop(ac.currentTime + dur);
  osc.stop(ac.currentTime + dur + 0.08);
}
function noise(dur=0.2, type="white", vol=0.4, filterOpts=null) {
  const ac = ctx();
  const bufferSize = Math.floor(ac.sampleRate * dur);
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i=0;i<bufferSize;i++) {
    const r = Math.random()*2-1;
    data[i] = (type==="pink" ? (r + (data[i-1]||0))*0.5 : r);
  }
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const e = env(0.001, dur*0.8, 0, 0.05, vol);
  let node = src;
  if (filterOpts) {
    const f = ac.createBiquadFilter();
    f.type = filterOpts.type || "bandpass";
    f.frequency.value = filterOpts.freq || 1000;
    f.Q.value = filterOpts.Q || 0.8;
    node.connect(f);
    node = f;
  }
  node.connect(e.node).connect(ac.destination);
  src.start();
  e.stop(ac.currentTime + dur);
  src.stop(ac.currentTime + dur + 0.05);
}

// ====== SFX ======
function sfx_applause() {
  // Simulate claps: short noise bursts with random timing & panning
  const ac = ctx();
  const total = 40 + Math.floor(Math.random()*30);
  for (let i=0;i<total;i++) {
    const t = ac.currentTime + Math.random()*1.5; // spread over 1.5s
    const dur = 0.04 + Math.random()*0.05;
    const vol = 0.15 + Math.random()*0.25;
    const panner = (ac.createStereoPanner ? ac.createStereoPanner() : null);
    const bufferSize = Math.floor(ac.sampleRate * dur);
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let j=0;j<bufferSize;j++) data[j] = (Math.random()*2-1) * (1 - j/bufferSize); // snappy
    const src = ac.createBufferSource(); src.buffer = buffer;

    const g = ac.createGain(); g.gain.value = vol;
    if (panner) {
      panner.pan.setValueAtTime((Math.random()*2-1)*0.8, t);
      src.connect(g).connect(panner).connect(ac.destination);
    } else {
      src.connect(g).connect(ac.destination);
    }
    src.start(t);
  }
}

function sfx_gasp() {
  // Quick breath-in: highpass noise sweep
  const ac = ctx();
  const biq = ac.createBiquadFilter();
  biq.type = "highpass";
  biq.frequency.setValueAtTime(200, ac.currentTime);
  const e = env(0.01, 0.18, 0, 0.04, 0.6);
  const bufferSize = Math.floor(ac.sampleRate * 0.22);
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i=0;i<bufferSize;i++) data[i] = Math.random()*2-1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  src.connect(biq).connect(e.node).connect(ac.destination);
  biq.frequency.exponentialRampToValueAtTime(3000, ac.currentTime + 0.2);
  src.start();
  e.stop(ac.currentTime + 0.22);
  src.stop(ac.currentTime + 0.25);
}

function sfx_boo() {
  // Low “boo” tone with slight wobble
  const ac = ctx();
  const base = 160;
  const osc = ac.createOscillator();
  const lfo = ac.createOscillator();
  const lfoGain = ac.createGain();
  lfo.frequency.value = 4; lfoGain.gain.value = 12; // wobble
  lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
  const e = env(0.02, 0.6, 0, 0.1, 0.5);
  osc.type = "square"; osc.frequency.value = base;
  osc.connect(e.node).connect(ac.destination);
  lfo.start(); osc.start();
  e.stop(ac.currentTime + 0.7);
  osc.stop(ac.currentTime + 0.8); lfo.stop(ac.currentTime + 0.8);
}

function sfx_tada() {
  // Simple arpeggio: C–E–G with bell-ish timbre
  const notes = [523.25, 659.25, 783.99]; // C5 E5 G5
  notes.forEach((f,i)=> setTimeout(()=>tone(f, 0.22, "triangle", 0.6), i*140));
}

function sfx_victory() {
  // Tiny fanfare
  const seq = [
    [659.25, 0.18], // E5
    [783.99, 0.18], // G5
    [880.00, 0.25], // A5
    [987.77, 0.35], // B5
    [1174.66,0.42]  // D6
  ];
  let t = 0;
  seq.forEach(([f,d]) => {
    setTimeout(()=>tone(f, d, "square", 0.5), t*1000);
    t += d*0.9;
  });
}

function sfx_wrong() {
  // Classic game-show buzzer (two detuned saws)
  const ac = ctx();
  const o1 = ac.createOscillator(), o2 = ac.createOscillator();
  o1.type = "sawtooth"; o2.type = "sawtooth";
  o1.frequency.value = 220; o2.frequency.value = 220*1.01;
  const e = env(0.005, 0.45, 0, 0.06, 0.55);
  const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
  o1.connect(lp); o2.connect(lp); lp.connect(e.node).connect(ac.destination);
  o1.start(); o2.start();
  e.stop(ac.currentTime + 0.5);
  o1.stop(ac.currentTime + 0.55); o2.stop(ac.currentTime + 0.55);
}

// router
const handlers = {
  applause: sfx_applause,
  gasp: sfx_gasp,
  boo: sfx_boo,
  tada: sfx_tada,
  victory: sfx_victory,
  wrong: sfx_wrong
};

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-sfx]");
  if (!b) return;
  handlers[b.getAttribute("data-sfx")]?.();
});

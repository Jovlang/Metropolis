class Metronome {
  constructor(onBeat) {
    this.onBeat = onBeat;
    this.bpm = 120;
    this.beatsPerBar = 4;
    this.isPlaying = false;
    this.currentBeat = 0;
    this.nextBeatTime = 0;
    this.timerId = null;
    this.audioContext = null;
    this.lookaheadMs = 25;
    this.scheduleAheadSeconds = 0.1;
  }

  async start() {
    if (this.isPlaying) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error("Web Audio is not supported in this browser.");
    this.audioContext ||= new AudioContextClass();
    await this.audioContext.resume();
    this.isPlaying = true;
    this.currentBeat = 0;
    this.nextBeatTime = this.audioContext.currentTime + 0.06;
    this.scheduler();
  }

  stop() {
    this.isPlaying = false;
    window.clearTimeout(this.timerId);
    this.timerId = null;
  }

  scheduler() {
    if (!this.isPlaying) return;
    while (this.nextBeatTime < this.audioContext.currentTime + this.scheduleAheadSeconds) {
      const beat = this.currentBeat;
      this.scheduleClick(beat, this.nextBeatTime);
      this.onBeat(beat, this.nextBeatTime, this.audioContext);
      this.nextBeatTime += 60 / this.bpm;
      this.currentBeat = (this.currentBeat + 1) % this.beatsPerBar;
    }
    this.timerId = window.setTimeout(() => this.scheduler(), this.lookaheadMs);
  }

  scheduleClick(beat, time) {
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    oscillator.frequency.setValueAtTime(beat === 0 ? 1280 : 880, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(beat === 0 ? 0.5 : 0.3, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.055);
    oscillator.connect(gain).connect(this.audioContext.destination);
    oscillator.start(time);
    oscillator.stop(time + 0.06);
  }
}

const bpmInput = document.querySelector("#bpm");
const bpmOutput = document.querySelector("#bpmOutput");
const transport = document.querySelector("#transport");
const transportLabel = document.querySelector("#transportLabel");
const statusText = document.querySelector("#statusText");
const beatRow = document.querySelector("#beatRow");
const pulseTrack = document.querySelector("#pulseTrack");
const meterButtons = [...document.querySelectorAll(".meter-button")];
let visualTimers = [];

const metronome = new Metronome((beat, time, context) => {
  const delay = Math.max(0, (time - context.currentTime) * 1000);
  const timer = window.setTimeout(() => {
    showBeat(beat);
    visualTimers = visualTimers.filter((item) => item !== timer);
  }, delay);
  visualTimers.push(timer);
});

function setSliderFill() {
  const progress = ((Number(bpmInput.value) - 40) / 200) * 100;
  bpmInput.style.setProperty("--progress", `${progress}%`);
}

function renderBeats() {
  beatRow.replaceChildren();
  for (let index = 0; index < metronome.beatsPerBar; index += 1) {
    const dot = document.createElement("span");
    dot.className = `beat${index === 0 ? " downbeat" : ""}`;
    beatRow.append(dot);
  }
  beatRow.setAttribute("aria-label", `Beat 1 of ${metronome.beatsPerBar}`);
}

function showBeat(beat) {
  const dots = [...beatRow.children];
  dots.forEach((dot, index) => dot.classList.toggle("current", index === beat));
  beatRow.setAttribute("aria-label", `Beat ${beat + 1} of ${metronome.beatsPerBar}`);
  pulseTrack.classList.remove("hit");
  void pulseTrack.offsetWidth;
  pulseTrack.classList.add("hit");
  window.setTimeout(() => pulseTrack.classList.remove("hit"), 90);
}

function resetVisuals() {
  visualTimers.forEach(window.clearTimeout);
  visualTimers = [];
  [...beatRow.children].forEach((dot) => dot.classList.remove("current"));
  pulseTrack.classList.remove("hit");
}

async function toggleTransport() {
  if (metronome.isPlaying) {
    metronome.stop();
    resetVisuals();
    document.body.classList.remove("playing");
    transport.setAttribute("aria-pressed", "false");
    transportLabel.textContent = "Start";
    statusText.textContent = "Ready";
    return;
  }

  try {
    await metronome.start();
    document.body.classList.add("playing");
    transport.setAttribute("aria-pressed", "true");
    transportLabel.textContent = "Stop";
    statusText.textContent = "Playing";
  } catch (error) {
    statusText.textContent = error.message;
  }
}

bpmInput.addEventListener("input", () => {
  metronome.bpm = Number(bpmInput.value);
  bpmOutput.value = bpmInput.value;
  setSliderFill();
});

meterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    meterButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-checked", String(selected));
    });
    metronome.beatsPerBar = Number(button.dataset.beats);
    metronome.currentBeat = 0;
    resetVisuals();
    renderBeats();
  });
});

transport.addEventListener("click", toggleTransport);
document.addEventListener("keydown", (event) => {
  if (event.code === "Space" && event.target.tagName !== "INPUT" && event.target.tagName !== "BUTTON") {
    event.preventDefault();
    toggleTransport();
  }
});

renderBeats();
setSliderFill();

if (document.modelContext?.registerTool) {
  const webMcpLifecycle = new AbortController();
  document.modelContext.registerTool({
    name: "set_metronome",
    title: "Set metronome",
    description: "Set the metronome tempo, time signature, or playback state.",
    inputSchema: {
      type: "object",
      properties: {
        bpm: { type: "number", minimum: 40, maximum: 240 },
        timeSignature: { type: "string", enum: ["2/4", "3/4", "4/4", "6/8"] },
        playing: { type: "boolean" }
      },
      additionalProperties: false
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: async ({ bpm, timeSignature, playing }) => {
      if (bpm !== undefined && (!Number.isFinite(bpm) || bpm < 40 || bpm > 240)) throw new Error("BPM must be between 40 and 240.");
      if (timeSignature !== undefined && !["2/4", "3/4", "4/4", "6/8"].includes(timeSignature)) throw new Error("Unsupported time signature.");
      if (playing !== undefined && typeof playing !== "boolean") throw new Error("Playing must be true or false.");
      if (bpm !== undefined) {
        bpmInput.value = String(Math.round(bpm));
        bpmInput.dispatchEvent(new Event("input"));
      }
      if (timeSignature) document.querySelector(`[data-beats="${timeSignature.split("/")[0]}"]`)?.click();
      if (playing !== undefined && playing !== metronome.isPlaying) await toggleTransport();
      return { bpm: metronome.bpm, beatsPerBar: metronome.beatsPerBar, playing: metronome.isPlaying };
    }
  }, { signal: webMcpLifecycle.signal });
}

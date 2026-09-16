# Metropolis

A focused, dependency-free metronome for the browser.

Metropolis uses the Web Audio clock and a short look-ahead scheduler to keep audible beats steady even when ordinary JavaScript timers are delayed. The interface is responsive, keyboard accessible, and designed to keep the essential controls in one view.

## Current features

- Tempo control from 40 to 240 BPM
- 2/4, 3/4, 4/4, and 6/8 time signatures
- Eighth-note, triplet, and sixteenth-note subdivisions with quieter secondary clicks
- Accented downbeats
- Start and stop from the transport button or Space key
- Audio-synchronized beat indicators
- Responsive desktop and mobile layout
- Imperative WebMCP tool for setting tempo, meter, and playback state in supported browsers

## Run locally

Metropolis is a plain static site. It has no packages to install and no build step.

From the repository root, serve `dist/` with any local HTTP server:

```powershell
python -m http.server 4173 --directory dist
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173), then press **Start**. Browsers require the initial audio start to follow a user interaction.

## How timing works

The metronome does not use `setInterval()` as its musical clock. Instead:

1. A lightweight timer wakes the scheduler about every 25 milliseconds.
2. The scheduler places upcoming beats roughly 100 milliseconds ahead on `AudioContext.currentTime`.
3. Web Audio plays those scheduled clicks against its high-resolution audio clock.
4. Visual beat changes are queued against the same clock so the interface follows the sound.

This keeps normal main-thread delays from directly shifting each audible beat while still allowing live tempo changes.

## Project structure

```text
dist/
  index.html    Interface and metadata
  styles.css    Visual design and responsive layout
  app.js        Audio engine, state, controls, and WebMCP
.openai/
  hosting.json  Sites deployment configuration
AGENTS.md       Repository guidance for coding agents
```

The files in `dist/` are authored source files, not disposable generated output.

## Browser support

Metropolis requires the Web Audio API and modern JavaScript. It is intended for current versions of Chrome, Edge, Firefox, and Safari. Audio behavior can vary with the device, operating system, output hardware, and Bluetooth latency.

## Development

Check JavaScript syntax after changing the audio engine or controls:

```powershell
node --check dist/app.js
```

Before submitting a change, test playback, live BPM changes, every time signature, repeated start/stop cycles, keyboard operation, and a narrow mobile viewport. See [`AGENTS.md`](AGENTS.md) for the complete project conventions and validation checklist.

## Status

This is an early functional version. Likely next steps include volume control, selectable click sounds, tap tempo, presets, and offline installation.

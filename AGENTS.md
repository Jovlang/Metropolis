# AGENTS.md

## Project overview

Metropolis is a dependency-free, browser-based metronome. It is a static site whose authored production files live directly in `dist/`.

## Repository structure

- `dist/index.html` — semantic interface and document metadata
- `dist/styles.css` — responsive visual system and interaction states
- `dist/app.js` — Web Audio scheduler, UI state, and WebMCP integration
- `.openai/hosting.json` — Sites deployment metadata; preserve the existing `project_id`

Do not treat `dist/` as disposable build output. It is the source of truth.

## Running locally

No dependency installation or build step is required. Serve the `dist` directory over HTTP; do not test audio from a `file://` URL.

```powershell
python -m http.server 4173 --directory dist
```

Then open `http://127.0.0.1:4173/`.

## Implementation rules

- Keep the site dependency-free unless a requested feature clearly justifies introducing a toolchain.
- Keep metronome timing based on `AudioContext.currentTime`. JavaScript timers may wake the look-ahead scheduler, but must not determine the audible beat time.
- Preserve the short scheduling interval and future scheduling window unless measurements justify changing them.
- Never replace scheduled Web Audio events with immediate audio triggered by `setInterval()` or `setTimeout()`.
- Create or resume the `AudioContext` from a user-initiated action so browser autoplay policies are respected.
- Schedule visual state from the audio clock, and clear pending visual timers when playback stops or the meter changes.
- A meter change must reset the beat index and keep the visible beat count and accessible label in sync.
- The downbeat must remain distinguishable both audibly and visually.
- Keep the visible interface and the `set_metronome` WebMCP tool on the same state and action paths. Validate WebMCP input before mutating state.

## Interface and accessibility

- Preserve native semantic controls and keyboard operation.
- Keep `aria-pressed`, `aria-checked`, live status text, and beat labels synchronized with visible state.
- Space toggles playback only when focus is not inside an interactive control.
- Maintain visible focus styles, sufficient contrast, and touch targets near 44 px or larger.
- The BPM slider, time-signature controls, and transport must remain usable in the first viewport on common mobile and desktop sizes.
- Respect `prefers-reduced-motion` and avoid motion that is required to understand playback state.

## Validation

For changes to JavaScript, always run:

```powershell
node --check dist/app.js
```

Before finishing a UI or audio change, verify:

1. The page loads over local HTTP with no console errors.
2. Start and stop work by button and Space key.
3. BPM changes take effect while playing.
4. Every time-signature button updates the beat indicators and accented downbeat.
5. Repeated start/stop and meter changes do not leave stale visual timers.
6. The layout has no horizontal overflow at narrow widths.
7. WebMCP valid input updates the visible interface, while invalid input fails without corrupting state.

## Change discipline

- Make focused edits and preserve the established dark instrument-panel visual direction unless a redesign is requested.
- Do not commit credentials, tokens, generated archives, or local server artifacts.
- Do not change deployment access or publish a new deployment unless explicitly requested.

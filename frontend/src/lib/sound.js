let ctx = null

function getContext() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    ctx = new AudioCtx()
  }
  return ctx
}

export function unlockAudio() {
  const c = getContext()
  if (c && c.state === 'suspended') c.resume().catch(() => {})
}

/** Soft two-note "ding-dong". */
export function playChime(volume = 0.16) {
  const c = getContext()
  if (!c) return
  if (c.state === 'suspended') c.resume().catch(() => {})

  const now = c.currentTime
  ;[
    [880, 0],        // A5
    [1318.51, 0.13], // E6
  ].forEach(([freq, offset]) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, now + offset)
    gain.gain.exponentialRampToValueAtTime(volume, now + offset + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.45)
    osc.connect(gain).connect(c.destination)
    osc.start(now + offset)
    osc.stop(now + offset + 0.5)
  })
}
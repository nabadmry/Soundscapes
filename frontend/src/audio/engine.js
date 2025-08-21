// Minimal WebAudio engine with procedural generators (no audio files)
class AudioEngine {
  constructor() {
    this.ctx = null
    this.master = null
    this.layers = []
  }

  ensureCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.8
      this.master.connect(this.ctx.destination)
    }
  }

  setMasterVolume(v) {
    if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05)
  }

  stop() {
    for (const l of this.layers) {
      try { l.stop() } catch {}
    }
    this.layers = []
  }

  async play(recipe) {
    this.ensureCtx()
    this.setMasterVolume(recipe.masterVolume ?? 0.8)
    this.stop()
    for (const layer of recipe.layers || []) {
      const node = this._makeLayer(layer)
      if (node) {
        this.layers.push(node)
        node.start()
      }
    }
  }

  // ---------------- Generators ----------------

  _whiteNoise() {
    const bufferSize = 2 * this.ctx.sampleRate
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const src = this.ctx.createBufferSource()
    src.buffer = buffer
    src.loop = true
    return src
  }

  _gain(v = 0.5) {
    const g = this.ctx.createGain()
    g.gain.value = v
    return g
  }

  _filter(type='lowpass', freq=1000, q=0.7) {
    const biq = this.ctx.createBiquadFilter()
    biq.type = type
    biq.frequency.value = freq
    biq.Q.value = q
    return biq
  }

  _lfo({freq=0.1, depth=0.5, target}) {
    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const g = this._gain(depth)
    osc.connect(g)
    g.connect(target)
    osc.start()
    return osc
  }

  _makeLayer(layer) {
    const type = layer.type
    const gainVal = layer.gain ?? 0.5
    const g = this._gain(gainVal)
    g.connect(this.master)

    const commonStop = (srcs) => ({
      start(){ /*started in constructors*/ },
      stop(){ srcs.forEach(s=>{ try{s.stop()}catch{} }) }
    })

    if (type === 'rain') {
      const noise = this._whiteNoise()
      const bp = this._filter('bandpass', 1200, 0.8)
      const lp = this._filter('lowpass', 4000, 0.2)
      noise.connect(bp); bp.connect(lp); lp.connect(g)
      noise.start()
      return commonStop([noise])
    }

    if (type === 'thunder') {
      const noise = this._whiteNoise()
      const lp = this._filter('lowpass', 200, 0.5)
      const g2 = this._gain(0.0)
      // swell using periodic envelopes
      const swell = () => {
        const now = this.ctx.currentTime
        const a = g2.gain
        const delay = 2 + Math.random()*6
        a.cancelScheduledValues(now)
        a.setValueAtTime(0.0, now)
        a.linearRampToValueAtTime(0.7, now + 0.8 + delay)
        a.exponentialRampToValueAtTime(0.05, now + 3.2 + delay)
        setTimeout(swell, (3.5 + delay)*1000)
      }
      swell()
      noise.connect(lp); lp.connect(g2); g2.connect(g)
      noise.start()
      return commonStop([noise])
    }

    if (type === 'wind') {
      const noise = this._whiteNoise()
      const lp = this._filter('lowpass', 600, 0.2)
      const g2 = this._gain(0.5)
      const lfo = this._lfo({freq: 0.07 + Math.random()*0.05, depth: 0.25, target: g2.gain})
      noise.connect(lp); lp.connect(g2); g2.connect(g)
      noise.start()
      return commonStop([noise, lfo])
    }

    if (type === 'forest_floor') {
      const noise = this._whiteNoise()
      const hp = this._filter('highpass', 200, 0.7)
      const lp = this._filter('lowpass', 800, 0.7)
      noise.connect(hp); hp.connect(lp); lp.connect(g)
      noise.start()
      return commonStop([noise])
    }

    if (type === 'birds') {
      // Simple chirps using short sine sweeps
      const srcs = []
      const chirp = () => {
        const osc = this.ctx.createOscillator()
        const eg = this._gain(0.0)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(1200 + Math.random()*1200, this.ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(600 + Math.random()*600, this.ctx.currentTime + 0.2)
        eg.gain.setValueAtTime(0.0, this.ctx.currentTime)
        eg.gain.linearRampToValueAtTime(0.6, this.ctx.currentTime + 0.02)
        eg.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25)
        osc.connect(eg); eg.connect(g)
        osc.start()
        osc.stop(this.ctx.currentTime + 0.3)
        srcs.push(osc)
        setTimeout(chirp, 400 + Math.random()*1600)
      }
      chirp()
      // Dummy source to stop: create a silent noise that we can stop later
      const dummy = this._whiteNoise(); dummy.connect(this._gain(0.00001)); dummy.start()
      srcs.push(dummy)
      return commonStop(srcs)
    }

    if (type === 'river') {
      const noise = this._whiteNoise()
      const bp = this._filter('bandpass', 500, 1.0)
      const g2 = this._gain(0.6)
      noise.connect(bp); bp.connect(g2); g2.connect(g)
      noise.start()
      return commonStop([noise])
    }

    if (type === 'waves') {
      const noise = this._whiteNoise()
      const lp = this._filter('lowpass', 500, 0.7)
      const g2 = this._gain(0.0)
      const swell = () => {
        const now = this.ctx.currentTime
        g2.gain.cancelScheduledValues(now)
        g2.gain.setValueAtTime(0.05, now)
        g2.gain.linearRampToValueAtTime(0.8, now + 1.5)
        g2.gain.linearRampToValueAtTime(0.1, now + 3.0)
        setTimeout(swell, 2500 + Math.random()*1200)
      }
      swell()
      noise.connect(lp); lp.connect(g2); g2.connect(g)
      noise.start()
      return commonStop([noise])
    }

    if (type === 'fireplace') {
      const noise = this._whiteNoise()
      const hp = this._filter('highpass', 1500, 0.5)
      const g2 = this._gain(0.3)
      noise.connect(hp); hp.connect(g2); g2.connect(g)
      noise.start()
      return commonStop([noise])
    }

    if (type === 'cafe') {
      const noise = this._whiteNoise()
      const bp = this._filter('bandpass', 300, 0.7) // low murmur
      const g2 = this._gain(0.5)
      // slow loudness fluctuations to simulate conversation dynamics
      const lfo = this._lfo({freq: 0.05, depth: 0.3, target: g2.gain})
      noise.connect(bp); bp.connect(g2); g2.connect(g)
      noise.start()
      return commonStop([noise, lfo])
    }

    if (type === 'train') {
      const noise = this._whiteNoise()
      const bp = this._filter('bandpass', 120, 1.0)
      const g2 = this._gain(0.5)
      const lfo = this._lfo({freq: 0.8, depth: 0.25, target: g2.gain}) // rhythmic clatter feel
      noise.connect(bp); bp.connect(g2); g2.connect(g)
      noise.start()
      return commonStop([noise, lfo])
    }

    if (type === 'night_crickets') {
      // High frequency gentle pulses
      const srcs = []
      const tick = () => {
        const osc = this.ctx.createOscillator()
        const eg = this._gain(0.0)
        osc.type = 'triangle'
        osc.frequency.value = 4500
        eg.gain.setValueAtTime(0, this.ctx.currentTime)
        eg.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 0.015)
        eg.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15)
        osc.connect(eg); eg.connect(g)
        osc.start(); osc.stop(this.ctx.currentTime + 0.16)
        srcs.push(osc)
        setTimeout(tick, 120 + Math.random()*200)
      }
      tick()
      const dummy = this._whiteNoise(); dummy.connect(this._gain(0.00001)); dummy.start()
      srcs.push(dummy)
      return commonStop(srcs)
    }

    // Unknown layer type -> ignore
    return null
  }
}

export const audioEngine = new AudioEngine()

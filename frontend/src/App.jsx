import React, { useEffect, useMemo, useState } from 'react'
import { generateRecipe, fetchTags } from './api'
import { audioEngine } from './audio/engine'

const presets = [
  "rainy night",
  "forest birds at dawn",
  "ocean waves and wind",
  "cozy fireplace evening",
  "cafe ambiance with chatter",
  "train window at night"
]

export default function App() {
  const [query, setQuery] = useState('rainy night')
  const [tags, setTags] = useState([])
  const [recipe, setRecipe] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTags().then(setTags).catch(()=>{})
  }, [])

  const doGenerate = async () => {
    try {
      setError('')
      const r = await generateRecipe(query)
      setRecipe(r)
      await audioEngine.play(r)
      setPlaying(true)
    } catch (e) {
      console.error(e)
      setError('Could not reach backend. Is it running on port 8000?')
    }
  }

  const stop = () => {
    audioEngine.stop()
    setPlaying(false)
  }

  const setMaster = (e) => {
    const v = Number(e.target.value)
    audioEngine.setMasterVolume(v)
    setRecipe(r => ({...r, masterVolume: v}))
  }

  return (
    <div className="container">
      <div className="card">
        <h1>🎧 Soundscapes</h1>
        <small>Create relaxing ambient sound from a simple prompt.</small>

        <div style={{height: 10}} />

        <div className="row">
          <input
            className="input"
            placeholder="Type a vibe... e.g., rainy night in a forest"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button className="btn" onClick={doGenerate}>Generate</button>
          {playing
            ? <button className="btn secondary" onClick={stop}>Stop</button>
            : null}
        </div>

        <div style={{height: 10}} />

        <div className="grid">
          {presets.map(p => (
            <button key={p} className="btn" onClick={() => { setQuery(p); }}>
              {p}
            </button>
          ))}
        </div>

        <div style={{height: 16}} />

        {recipe && (
          <div className="card" style={{background:'#0c1433'}}>
            <div className="row" style={{justifyContent:'space-between'}}>
              <div className="row" style={{gap:8, alignItems:'center'}}>
                <span className="badge">Master</span>
                <input className="slider" type="range" min="0" max="1" step="0.01"
                  value={recipe.masterVolume ?? 0.8}
                  onChange={setMaster}
                />
              </div>
              <div className="badge">{(recipe.layers?.length||0)} layers</div>
            </div>
            <div style={{height: 10}} />
            <div className="grid">
              {(recipe.layers || []).map((l, i) => (
                <div key={i} className="layer">
                  <div className="row" style={{gap:8}}>
                    <span>•</span>
                    <strong>{l.type}</strong>
                  </div>
                  <span className="badge">gain {l.gain}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <footer>Available tags: {tags.join(', ')}</footer>
        )}
        {error && <div style={{color:'#ff9b9b', marginTop:10}}>{error}</div>}
      </div>
    </div>
  )
}

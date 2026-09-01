import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

type Palette = { name: string; colors: string[]; sky: string }
type ArtworkState = { seed: number; palette: string; density: number; drift: number; glow: number }
type SavedWorld = ArtworkState & { id: string }

const palettes: Record<string, Palette> = {
  dusk: { name: 'Dusk garden', colors: ['#ffbe8a', '#f47c95', '#b26cff', '#6c63ff'], sky: '#171529' },
  moss: { name: 'Moss & clay', colors: ['#f1d7a7', '#d89672', '#709775', '#3f5f5b'], sky: '#192624' },
  candy: { name: 'Electric candy', colors: ['#ff6bcb', '#ffd166', '#06d6a0', '#118ab2'], sky: '#171329' },
}
const initialState: ArtworkState = { seed: 38172, palette: 'dusk', density: 54, drift: 48, glow: 36 }

function readInitialState(): ArtworkState {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const palette = params.get('palette')
  return {
    seed: Number(params.get('seed')) || initialState.seed,
    palette: palette && palette in palettes ? palette : initialState.palette,
    density: clamp(Number(params.get('density')) || initialState.density),
    drift: clamp(Number(params.get('drift')) || initialState.drift),
    glow: clamp(Number(params.get('glow')) || initialState.glow),
  }
}

function clamp(value: number) { return Math.min(100, Math.max(0, value)) }

function seededRandom(seed: number) {
  let value = seed
  return () => { value = (value * 9301 + 49297) % 233280; return value / 233280 }
}
function randomSeed() { return Math.floor(Math.random() * 90000) + 10000 }

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [state, setState] = useState(readInitialState)
  const [isExporting, setIsExporting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [savedWorlds, setSavedWorlds] = useState<SavedWorld[]>(() => {
    try { return JSON.parse(localStorage.getItem('tiny-worlds-gallery') || '[]') as SavedWorld[] } catch { return [] }
  })

  const draw = useCallback((target: HTMLCanvasElement, renderState: ArtworkState, output?: { width: number; height: number }) => {
    const context = target.getContext('2d')
    if (!context) return
    const rect = target.getBoundingClientRect()
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    const width = output?.width || Math.max(1, Math.round((rect.width || 800) * pixelRatio))
    const height = output?.height || Math.max(1, Math.round((rect.height || 620) * pixelRatio))
    target.width = width; target.height = height
    const scale = width / 900
    const palette = palettes[renderState.palette]
    const random = seededRandom(renderState.seed)
    context.fillStyle = palette.sky; context.fillRect(0, 0, width, height)
    context.save(); context.scale(scale, scale); context.translate(450, 310)
    const count = Math.round(20 + renderState.density * 1.45)
    for (let i = 0; i < count; i += 1) {
      const angle = random() * Math.PI * 2
      const distance = 50 + random() * 285
      const x = Math.cos(angle) * distance + Math.sin(i * 0.7) * renderState.drift
      const y = Math.sin(angle) * distance * 0.62 + Math.cos(i * 0.43) * renderState.drift * 0.35
      const size = 8 + random() * (18 + renderState.drift * 0.42)
      const color = palette.colors[Math.floor(random() * palette.colors.length)]
      context.save(); context.translate(x, y); context.rotate(angle + random() * 0.8)
      context.globalAlpha = 0.35 + random() * 0.55
      context.shadowColor = color; context.shadowBlur = renderState.glow * 0.7
      context.fillStyle = color; context.beginPath(); context.moveTo(0, -size)
      context.bezierCurveTo(size * 1.2, -size * 0.25, size * 0.85, size, 0, size * 0.8)
      context.bezierCurveTo(-size * 0.85, size, -size * 1.2, -size * 0.25, 0, -size); context.fill(); context.restore()
    }
    context.globalAlpha = 0.9; context.shadowBlur = 0; context.strokeStyle = palette.colors[0]; context.lineWidth = 2
    for (let i = 0; i < 7; i += 1) { context.beginPath(); context.arc(0, 0, 70 + i * 35 + random() * 12, random() * 0.8, Math.PI * (1.1 + random() * 0.6)); context.stroke() }
    context.restore()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    draw(canvas, state); const handleResize = () => draw(canvas, state)
    window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize)
  }, [draw, state])

  useEffect(() => {
    const params = new URLSearchParams({ seed: String(state.seed), palette: state.palette, density: String(state.density), drift: String(state.drift), glow: String(state.glow) })
    window.history.replaceState(null, '', `${window.location.pathname}#${params}`)
  }, [state])

  const update = <K extends keyof ArtworkState>(key: K, value: ArtworkState[K]) => setState((current) => ({ ...current, [key]: value }))
  const exportPng = () => {
    const visible = canvasRef.current; if (!visible) return
    setIsExporting(true); const exportCanvas = document.createElement('canvas')
    draw(exportCanvas, state, { width: 1800, height: 1240 })
    const link = document.createElement('a'); link.download = `tiny-world-${state.seed}.png`; link.href = exportCanvas.toDataURL('image/png'); link.click()
    window.setTimeout(() => setIsExporting(false), 400)
  }
  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }
  const saveWorld = () => {
    setSavedWorlds((current) => {
      const next = [{ ...state, id: `${state.seed}-${Date.now()}` }, ...current.filter((world) => world.seed !== state.seed)].slice(0, 6)
      localStorage.setItem('tiny-worlds-gallery', JSON.stringify(next))
      return next
    })
  }

  return <main className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">✳</span><span>tiny worlds</span></div><span className="eyebrow">a generative garden</span></header>
    <section className="workspace">
      <div className="art-column"><div className="canvas-wrap"><canvas ref={canvasRef} aria-label="Your generated tiny world" /><div className="canvas-caption"><span>WORLD / {state.seed}</span><span>GENERATED IN BROWSER</span></div></div>{savedWorlds.length > 0 && <div className="gallery"><div className="gallery-heading"><span>Saved worlds</span><span>{savedWorlds.length} / 6</span></div><div className="gallery-row">{savedWorlds.map((world) => <button className={`gallery-card ${world.seed === state.seed ? 'active' : ''}`} key={world.id} onClick={() => setState(world)} aria-label={`Open world ${world.seed}`}><WorldThumbnail world={world} draw={draw} /><span>{world.seed}</span></button>)}</div></div>}</div>
      <aside className="controls">
        <div><p className="kicker">make a tiny world</p><h1>Something small,<br /><em>strangely alive.</em></h1><p className="intro">Shape a little universe from a handful of gentle rules. There are no wrong turns.</p></div>
        <div className="control-group"><div className="control-heading"><span>Palette</span><span className="control-value">{palettes[state.palette].name}</span></div><div className="palette-row">{Object.entries(palettes).map(([key, palette]) => <button key={key} className={`palette-button ${state.palette === key ? 'selected' : ''}`} aria-label={`Use ${palette.name}`} onClick={() => update('palette', key)}>{palette.colors.map((color) => <span key={color} style={{ backgroundColor: color }} />)}</button>)}</div></div>
        <Slider label="Density" value={state.density} onChange={(value) => update('density', value)} /><Slider label="Drift" value={state.drift} onChange={(value) => update('drift', value)} /><Slider label="Glow" value={state.glow} onChange={(value) => update('glow', value)} />
        <div className="actions"><button className="surprise-button" onClick={() => update('seed', randomSeed())}><span>✦</span> Surprise me</button><button className="export-button" onClick={exportPng}>{isExporting ? 'Preparing…' : 'Export PNG'} <span>↗</span></button></div>
        <div className="secondary-actions"><button className="share-button" onClick={copyLink}>{copied ? 'Link copied' : 'Copy world link'} <span>⌘</span></button><button className="save-button" onClick={saveWorld}>Save to gallery <span>＋</span></button></div>
        <p className="seed-note">Seed {state.seed} · same seed, same world</p>
      </aside>
    </section>
    <footer><span>tiny worlds / 001</span><span>made for wandering</span></footer>
  </main>
}

function WorldThumbnail({ world, draw }: { world: ArtworkState; draw: (canvas: HTMLCanvasElement, state: ArtworkState) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => { if (ref.current) draw(ref.current, world) }, [draw, world])
  return <canvas ref={ref} aria-hidden="true" />
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="slider"><span className="control-heading"><span>{label}</span><span className="control-value">{value}</span></span><input type="range" min="0" max="100" value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>
}

export default App

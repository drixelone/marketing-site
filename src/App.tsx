import { Component, lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react'
const RibbonScene = lazy(() => import('./RibbonScene'))

function useMedia(query: string) {
  const [matches, setMatches] = useState(() => matchMedia(query).matches)
  useEffect(() => {
    const media = matchMedia(query)
    const update = () => setMatches(media.matches)
    media.addEventListener('change', update)
    update()
    return () => media.removeEventListener('change', update)
  }, [query])
  return matches
}
class SceneBoundary extends Component<{children: ReactNode; onError: () => void}, {failed: boolean}> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onError() }
  render() { return this.state.failed ? null : this.props.children }
}
function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    if (!gl) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch { return false }
}
export default function App() {
  const reduced = useMedia('(prefers-reduced-motion: reduce)')
  const mobile = useMedia('(max-width: 600px)')
  const [visible, setVisible] = useState(!document.hidden)
  const [webgl] = useState(supportsWebGL)
  const [ready, setReady] = useState(false)
  const [lost, setLost] = useState(false)
  const onReady = useCallback(() => setReady(true), [])
  const onLost = useCallback(() => setLost(true), [])
  useEffect(() => {
    const update = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  return <div className="page">
    <header className="header">
      <div className="logo"><img src="/assets/side-by-side_light-no-bg.png" alt="DrixelOne" width="666" height="375" /></div>
      <p className="brand-line">Ideas. Products. People.</p>
    </header>
    <main>
      <div className="intro">
        <p className="eyebrow">A new chapter is taking shape</p>
        <h1>Coming soon<span>.</span></h1>
        <p className="supporting">Our new website is on its way.</p>
      </div>
      <div className="ribbon-stage" aria-hidden="true" data-motion={reduced ? 'reduced' : 'full'} data-visible={visible}>
        <img className={`ribbon-fallback ${ready && !lost ? 'is-hidden' : ''}`} src="/assets/ribbon-fallback.png" alt="" />
        {webgl && !lost && <SceneBoundary onError={onLost}><Suspense fallback={null}>
          <RibbonScene reduced={reduced} mobile={mobile} visible={visible} onReady={onReady} onLost={onLost} />
        </Suspense></SceneBoundary>}
      </div>
    </main>
    <footer><p>Built for a brighter tomorrow.</p><p>© {new Date().getFullYear()} DrixelOne</p></footer>
  </div>
}

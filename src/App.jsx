import { useEffect, useRef, useState } from 'react'
import Stage from './three/Stage'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Places from './components/Templates'
import { Why, Capabilities, Compare } from './components/Content'
import Modules from './components/Modules'
import Architecture from './components/Architecture'
import { Tech, Team, Results, Footer } from './components/Sections'
import { useActiveSection, gotoSection } from './components/hooks'
import { nav, meta } from './data'

const EMPTY_DRAFT = {
  dest: 'Manali',
  days: 4,
  travellers: 2,
  budget: 60000,
  interest: 'Mountains',
}

export default function App() {
  const active = useActiveSection()
  const activeModuleRef = useRef(-1)
  const [ready, setReady] = useState(false)

  /* shared planner state, driven by the template cards */
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [activeTpl, setActiveTpl] = useState(null)
  const [hoverTpl, setHoverTpl] = useState(null)

  /* loading a template commits it to the planner */
  const pickTemplate = (t, hoverOnly = false) => {
    if (hoverOnly) {
      setHoverTpl(t)
      return
    }
    setHoverTpl(null)
    setActiveTpl(t)
    setDraft({
      dest: t.place.split('·')[0].trim(),
      days: t.days,
      travellers: t.travellers,
      budget: t.budget,
      interest: t.interest,
    })
  }

  /* dismiss the boot splash once React has painted */
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      setTimeout(() => {
        document.getElementById('boot')?.classList.add('gone')
        setReady(true)
      }, 480)
    )
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <>
      <Stage activeModuleRef={activeModuleRef} />
      <Nav active={active} />

      <div className="rail">
        {nav.map((n, i) => (
          <button
            key={n.id}
            className={active === i ? 'on' : ''}
            data-l={n.label}
            onClick={() => gotoSection(i)}
            aria-label={n.label}
          />
        ))}
      </div>

      <main className={ready ? 'ready' : ''}>
        <Hero draft={draft} setDraft={setDraft} activeTemplate={hoverTpl ?? activeTpl} />
        <Places onPick={pickTemplate} activeId={(hoverTpl ?? activeTpl)?.id} />
        <Why />
        <Capabilities />
        <Compare />
        <Modules activeModuleRef={activeModuleRef} />
        <Architecture />
        <Tech />
        <Team />
        <Results />
      </main>

      <Footer brand={meta.name} />
    </>
  )
}

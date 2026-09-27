/* ============================================================
   Global, render-free scroll + pointer state.
   The 3D layer reads this inside useFrame, so scrolling never
   triggers a React re-render.
   ============================================================ */

export const SECTION_IDS = [
  'home',
  'places',
  'why',
  'features',
  'compare',
  'modules',
  'architecture',
  'tech',
  'team',
  'results',
]

export const SECTIONS = SECTION_IDS.length

/** Named section indices — scenes bind to these instead of magic numbers */
export const SI = {
  home: 0,
  places: 1,
  why: 2,
  features: 3,
  compare: 4,
  modules: 5,
  architecture: 6,
  tech: 7,
  team: 8,
  results: 9,
}

/* Section DOM top-offsets, refreshed on resize */
const tops = new Array(SECTIONS).fill(0)
const heights = new Array(SECTIONS).fill(1)

const state = {
  scrollY: 0,
  vh: 1,
  vw: 1,
  docH: 1,
  progress: 0, // 0 .. SECTIONS-1, float
  velocity: 0,
  px: 0, // pointer -1..1
  py: 0,
  active: 0,
  reduced: false,
}

const subs = new Set()

export const scrollState = state

export function subscribe(fn) {
  subs.add(fn)
  return () => subs.delete(fn)
}

/* ---- pointer ---- */
export function initPointer() {
  const onMove = (e) => {
    state.px = (e.clientX / state.vw) * 2 - 1
    state.py = -((e.clientY / state.vh) * 2 - 1)
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  return () => window.removeEventListener('pointermove', onMove)
}

/* ---- measure sections ---- */
export function measure() {
  state.vh = window.innerHeight
  state.vw = window.innerWidth
  state.docH = document.documentElement.scrollHeight - state.vh
  for (let i = 0; i < SECTIONS; i++) {
    const el = document.getElementById(SECTION_IDS[i])
    if (el) {
      tops[i] = el.offsetTop
      heights[i] = el.offsetHeight
    }
  }
  state.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/* ---- scroll position -> continuous section index ---- */
function computeProgress() {
  const y = state.scrollY + state.vh * 0.5 // focus line at viewport middle
  let p = 0
  for (let i = 0; i < SECTIONS; i++) {
    const mid = tops[i] + heights[i] * 0.5
    if (y >= mid) p = i
  }
  // interpolate inside the active segment for sub-section motion
  const i = Math.min(Math.floor(p), SECTIONS - 2)
  const cur = tops[i] + heights[i] * 0.5
  const nxt = tops[i + 1] + heights[i + 1] * 0.5
  const f = nxt > cur ? (y - cur) / (nxt - cur) : 0
  p = i + Math.max(0, Math.min(1, f))
  return p
}

let ticking = false
let lastY = 0

function tick() {
  ticking = false
  const y = window.scrollY || 0
  state.velocity = y - lastY
  lastY = y
  state.scrollY = y
  const p = computeProgress()
  state.progress = p
  state.active = Math.round(p)
  subs.forEach((f) => f(p, state.active))
}

function onScroll() {
  if (!ticking) {
    ticking = true
    requestAnimationFrame(tick)
  }
}

export function initScroll() {
  measure()
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', () => {
    measure()
    onScroll()
  })
  return () => window.removeEventListener('scroll', onScroll)
}

/* ---- presence helpers used by the 3D scenes ---- */
export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
export const smoothstep = (t) => t * t * (3 - 2 * t)

/** 1 at the section, fading to 0 `spread` units away */
export function presenceAt(progress, index, spread = 0.62) {
  return smoothstep(clamp01(1 - Math.abs(progress - index) / spread))
}

export function gotoSection(i) {
  const el = document.getElementById(SECTION_IDS[i])
  if (el) window.scrollTo({ top: el.offsetTop, behavior: 'smooth' })
}

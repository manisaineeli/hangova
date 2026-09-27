import { useEffect, useRef, useState } from 'react'
import { subscribe, gotoSection, SECTION_IDS, presenceAt } from '../lib/scroll'

/* ============================================================
   Shared UI hooks
   ============================================================ */

/** Subscribe to the low-frequency active-section index */
export function useActiveSection() {
  const [a, setA] = useState(0)
  useEffect(() => subscribe((_p, i) => setA(i)), [])
  return a
}

/** Reveal-on-scroll wrapper: adds `.in` once the element is in view */
export function Reveal({ children, delay = 0, as: Tag = 'div', className = '', style, ...rest }) {
  const ref = useRef()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.style.transitionDelay = `${delay}ms`
          el.classList.add('in')
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [delay])

  return (
    <Tag ref={ref} className={`rv ${className}`} style={style} {...rest}>
      {children}
    </Tag>
  )
}

/** Count up to a value when scrolled into view */
export function useCountUp(to, ms = 1400) {
  const [v, setV] = useState(0)
  const ref = useRef()
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        const t0 = performance.now()
        const tick = (t) => {
          const k = Math.min(1, (t - t0) / ms)
          const eased = 1 - Math.pow(1 - k, 3)
          setV(to * eased)
          if (k < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [to, ms])
  return [v, ref]
}

/** Track the sticky-nav offset of a section id */
export function useStuck(threshold = 24) {
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const on = () => setStuck(window.scrollY > threshold)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [threshold])
  return stuck
}

export { gotoSection, SECTION_IDS, presenceAt }

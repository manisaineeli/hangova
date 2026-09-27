import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

/**
 * Shared motion primitives.
 *
 * Everything here respects prefers-reduced-motion, so the app stays calm for
 * anyone who has asked their OS to reduce animation.
 */

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

/* ---------------- reveal on scroll ---------------- */

const EASE = [0.22, 1, 0.36, 1]

export function Reveal({ children, delay = 0, y = 26, x = 0, once = true, className = '', as = 'div', ...rest }) {
  const reduced = usePrefersReducedMotion()
  const MotionTag = motion[as] || motion.div

  if (reduced) {
    const Tag = as
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    )
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once, margin: '-60px' }}
      transition={{ duration: 0.65, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </MotionTag>
  )
}

/** Container that staggers its Reveal children. */
export function Stagger({ children, gap = 0.07, className = '', ...rest }) {
  const reduced = usePrefersReducedMotion()
  if (reduced) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    )
  }
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={{ show: { transition: { staggerChildren: gap } } }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = '', ...rest }) {
  const reduced = usePrefersReducedMotion()
  if (reduced) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    )
  }
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

/* ---------------- page transition ---------------- */

export function PageTransition({ children }) {
  const reduced = usePrefersReducedMotion()
  if (reduced) return <>{children}</>
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

/* ---------------- animated number ---------------- */

export function CountUp({ value = 0, prefix = '', suffix = '', duration = 0.9 }) {
  const reduced = usePrefersReducedMotion()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 })
  const text = useTransform(spring, (v) => `${prefix}${Math.round(v).toLocaleString('en-IN')}${suffix}`)

  useEffect(() => {
    if (inView && !reduced) mv.set(Number(value) || 0)
    if (inView && reduced) mv.set(Number(value) || 0)
  }, [inView, value, mv, reduced])

  return <motion.span ref={ref}>{reduced ? `${prefix}${Number(value || 0).toLocaleString('en-IN')}${suffix}` : text}</motion.span>
}

/* ---------------- tilt card ---------------- */

/** Card that leans toward the pointer, for a sense of physical depth. */
export function Tilt({ children, className = '', max = 8, ...rest }) {
  const reduced = usePrefersReducedMotion()
  const ref = useRef(null)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 180, damping: 18 })
  const sry = useSpring(ry, { stiffness: 180, damping: 18 })

  function onMove(e) {
    if (reduced || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    ry.set(px * max)
    rx.set(-py * max)
  }

  function onLeave() {
    rx.set(0)
    ry.set(0)
  }

  if (reduced) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

/* ---------------- animated bar ---------------- */

export function GrowBar({ value, max, className = '', delay = 0 }) {
  const reduced = usePrefersReducedMotion()
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className={`bar ${className}`}>
      <motion.i
        initial={{ width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true }}
        transition={{ duration: reduced ? 0 : 0.9, delay, ease: EASE }}
      />
    </div>
  )
}

/* ---------------- shimmer while loading ---------------- */

export function Shimmer({ children }) {
  return (
    <div className="shimmer">
      {children}
      <span className="shimmer-sweep" aria-hidden="true" />
    </div>
  )
}

/* ---------------- magnetic button ---------------- */

export function Magnetic({ children, className = '' }) {
  const reduced = usePrefersReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 260, damping: 18 })
  const sy = useSpring(y, { stiffness: 260, damping: 18 })

  if (reduced) {
    return (
      <div className={className}>{children}</div>
    )
  }

  return (
    <motion.div
      className={className}
      style={{ x: sx, y: sy }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        x.set((e.clientX - r.left - r.width / 2) * 0.16)
        y.set((e.clientY - r.top - r.height / 2) * 0.22)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Lightweight vector scenery for repeated small cards.
 *
 * The ambient backdrop and the hero use real WebGL, but a list of six
 * destination cards would mean six extra WebGL contexts, which browsers cap
 * (and integrated GPUs choke on). These scenes use the same biome palette and
 * silhouettes so the grid still looks like places, at almost no cost.
 */

function Sky({ from, to, id }) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill={`url(#${id})`} />
    </>
  )
}

function Palm({ x, y, s = 1, fill }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}>
      <path d="M0 0 C 2 -10 3 -18 2 -26 L5 -26 C 6 -18 5 -10 3 0 Z" />
      <path d="M3.5 -26 q -9 -5 -14 -1 q 7 0 13 3 z" />
      <path d="M3.5 -26 q 9 -5 14 -1 q -7 0 -13 3 z" />
      <path d="M3.5 -26 q -5 -8 -12 -7 q 7 2 11 8 z" />
      <path d="M3.5 -26 q 5 -8 12 -7 q -7 2 -11 8 z" />
    </g>
  )
}

function Conifer({ x, y, s = 1, fill }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}>
      <rect x="-1" y="-4" width="2" height="6" />
      <path d="M0 -30 L7 -12 H-7 Z" />
      <path d="M0 -20 L9 0 H-9 Z" />
    </g>
  )
}

const SCENES = {
  beach: (b) => (
    <>
      <circle cx="152" cy="30" r="11" fill={b.sun} opacity="0.9" />
      <path d="M0 78 h200 v42 H0 z" fill={b.accent} opacity="0.5" />
      <path d="M0 88 q 25 -7 50 0 t 50 0 t 50 0 t 50 0 v32 H0 z" fill={b.accent2} opacity="0.55" />
      <path d="M0 100 q 30 -6 60 0 t 70 0 t 70 0 v20 H0 z" fill={b.accent} opacity="0.75" />
      <Palm x={38} y={86} s={1.05} fill={b.ground} />
      <Palm x={168} y={92} s={0.8} fill={b.ground} opacity="0.85" />
    </>
  ),
  forest: (b) => (
    <>
      <path d="M40 0 L62 0 L74 120 L28 120 Z" fill={b.sun} opacity="0.07" />
      <path d="M96 0 L118 0 L132 120 L84 120 Z" fill={b.sun} opacity="0.06" />
      {[12, 38, 66, 96, 128, 158, 186].map((x, i) => (
        <Conifer key={x} x={x} y={120} s={0.8 + (i % 3) * 0.22} fill={i % 2 ? '#14532d' : b.accent} />
      ))}
      <rect y="108" width="200" height="12" fill={b.ground} />
    </>
  ),
  waterfall: (b) => (
    <>
      <path d="M0 0 h200 v54 q -40 8 -100 4 q -60 -4 -100 6 z" fill={b.fog} />
      <path d="M86 46 h30 v54 q -4 12 -15 12 t -15 -12 z" fill="#dff6ff" opacity="0.8" />
      <path d="M92 46 h8 v58 h-8 z" fill="#ffffff" opacity="0.55" />
      <ellipse cx="101" cy="108" rx="42" ry="9" fill={b.accent2} opacity="0.4" />
      <ellipse cx="101" cy="106" rx="24" ry="5" fill="#ffffff" opacity="0.35" />
      <path d="M0 96 q 24 -14 46 -2 L58 120 H0 z" fill={b.ground} />
      <path d="M200 92 q -26 -12 -48 0 L142 120 h58 z" fill={b.ground} />
    </>
  ),
  mountains: (b) => (
    <>
      <circle cx="40" cy="26" r="8" fill={b.sun} opacity="0.75" />
      <path d="M0 84 L44 30 L78 84 Z" fill="#2a3552" />
      <path d="M44 30 L56 48 L50 52 L40 44 L32 52 L26 48 Z" fill="#e8f0ff" opacity="0.85" />
      <path d="M60 84 L110 20 L164 84 Z" fill="#1b2540" />
      <path d="M110 20 L126 44 L118 48 L106 38 L96 46 L88 42 Z" fill="#e8f0ff" opacity="0.9" />
      <path d="M130 84 L176 40 L200 84 Z" fill="#2a3552" />
      <path d="M176 40 L186 55 L180 58 L172 51 L166 56 Z" fill="#e8f0ff" opacity="0.7" />
      <rect y="84" width="200" height="36" fill={b.fog} />
      <ellipse cx="70" cy="52" rx="20" ry="5" fill={b.sky[2]} opacity="0.2" />
      <ellipse cx="140" cy="38" rx="26" ry="6" fill={b.sky[2]} opacity="0.16" />
    </>
  ),
  desert: (b) => (
    <>
      <circle cx="52" cy="44" r="13" fill={b.sun} opacity="0.85" />
      <circle cx="52" cy="44" r="26" fill={b.accent2} opacity="0.13" />
      <path d="M0 86 q 40 -22 84 -6 q 46 16 116 -8 v48 H0 z" fill={b.fog} />
      <path d="M0 100 q 50 -18 100 -2 q 52 16 100 -6 v28 H0 z" fill={b.ground} />
      <path d="M0 112 q 60 -12 120 0 q 50 10 80 0 v8 H0 z" fill={b.accent} opacity="0.28" />
    </>
  ),
}

export default function BiomeArt({ biome, className = '', style = {} }) {
  const b = biome
  const draw = SCENES[b.id] || SCENES.mountains
  const id = `sky-${b.id}`

  return (
    <div className={className} style={style}>
      <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
        <Sky from={b.sky[0]} to={b.sky[1]} id={id} />
        {draw(b)}
      </svg>
    </div>
  )
}

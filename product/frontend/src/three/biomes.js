/**
 * Biome definitions for the immersive background and the destination scenes.
 *
 * Each biome carries the palette, fog, lighting and camera setup that make the
 * rest of the system feel like a place rather than a generic dark dashboard.
 * `signature` is the animated hero element of that biome.
 *
 * Palettes are deliberately brighter than a realistic night scene: these sit
 * behind translucent panels, so anything too dark simply disappears.
 */

export const BIOMES = {
  beach: {
    id: 'beach',
    label: 'Coast',
    signature: 'Ocean',
    interests: ['Beaches', 'Islands', 'Nightlife'],
    states: ['Goa', 'Andaman and Nicobar Islands'],
    sky: ['#0e3f6b', '#3f9fc4', '#bfe9f2'],
    fog: '#2a7fa0',
    ground: '#e8d4a8',
    accent: '#38d9c4',
    accent2: '#8fe3f5',
    deep: '#0a4a70',
    sun: '#ffe3b0',
    sunIntensity: 2.6,
    ambient: '#6fb6d8',
    ambientIntensity: 1.15,
    camY: 3.4,
    camZ: 13,
    waterLevel: -1.1,
  },

  forest: {
    id: 'forest',
    label: 'Forest',
    signature: 'Canopy',
    interests: ['Wildlife', 'Nature', 'Adventure'],
    states: ['Kerala', 'Karnataka'],
    sky: ['#08200f', '#134a2c', '#63a86a'],
    fog: '#1a5c3a',
    ground: '#1d3a26',
    accent: '#5ee08a',
    accent2: '#b6e36a',
    sun: '#e8ffb0',
    sunIntensity: 2.3,
    ambient: '#3d7a54',
    ambientIntensity: 1.05,
    camY: 2.6,
    camZ: 13,
  },

  waterfall: {
    id: 'waterfall',
    label: 'Waterfall',
    signature: 'Falls',
    interests: ['Mountains', 'Adventure', 'Nature'],
    states: ['Himachal Pradesh', 'Uttarakhand'],
    sky: ['#0b2130', '#1f5c72', '#a8dbe6'],
    fog: '#2a6a7c',
    ground: '#2c4a4a',
    accent: '#7fe3f5',
    accent2: '#9df5e4',
    sun: '#e2f7ff',
    sunIntensity: 2.4,
    ambient: '#4e93a6',
    ambientIntensity: 1.15,
    camY: 3.0,
    camZ: 14,
  },

  mountains: {
    id: 'mountains',
    label: 'Peaks',
    signature: 'Ridges',
    interests: ['Heritage', 'Pilgrimage', 'Mountains'],
    states: ['Rajasthan', 'Tamil Nadu'],
    sky: ['#101a38', '#3d5a86', '#c3d4ea'],
    fog: '#43598a',
    ground: '#243050',
    accent: '#c4b5fd',
    accent2: '#a5d8ff',
    sun: '#fff0d2',
    sunIntensity: 2.4,
    ambient: '#5f76a8',
    ambientIntensity: 1.1,
    camY: 3.4,
    camZ: 15,
  },

  desert: {
    id: 'desert',
    label: 'Dunes',
    signature: 'Dunes',
    interests: ['Heritage', 'Food', 'Culture'],
    states: ['Uttar Pradesh', 'Rajasthan'],
    sky: ['#2e1230', '#a04a4a', '#f2c089'],
    fog: '#8a4356',
    ground: '#5a3040',
    accent: '#ffab5e',
    accent2: '#ffd88a',
    sun: '#ffd9a0',
    sunIntensity: 2.6,
    ambient: '#8a5566',
    ambientIntensity: 1.0,
    camY: 2.8,
    camZ: 13,
  },
}

export const BIOME_ORDER = ['beach', 'forest', 'waterfall', 'mountains', 'desert']

/** Deterministic hash so a destination always lands on the same biome. */
function hash(str = '') {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/** Picks the biome that best matches a set of interests. */
export function biomeForInterests(interests = []) {
  const list = (interests || []).map((i) => String(i).toLowerCase())
  let best = BIOMES.forest
  let bestScore = -1

  for (const b of Object.values(BIOMES)) {
    let score = 0
    for (const i of list) {
      if (b.interests.some((t) => t.toLowerCase() === i)) score += 3
      else if (b.interests.some((t) => t.toLowerCase().includes(i) || i.includes(t.toLowerCase())))
        score += 1
    }
    if (score > bestScore) {
      bestScore = score
      best = b
    }
  }
  return bestScore > 0 ? best : BIOMES[hash(String(list.join(',')))] ?? BIOMES.mountains
}

/** Picks the biome for a destination by its state, then by interest tags. */
export function biomeForDestination(destination = {}, fallbackInterests = []) {
  const state = (destination.state || '').toLowerCase()
  for (const b of Object.values(BIOMES)) {
    if (b.states.some((s) => s.toLowerCase() === state)) return b
  }
  return biomeForInterests(destination.tags?.length ? destination.tags : fallbackInterests)
}

/** Default when the traveller has told us nothing yet. */
export const DEFAULT_BIOME = BIOMES.waterfall

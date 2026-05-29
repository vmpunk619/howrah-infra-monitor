/* ────────────────────────────────────────────────────────────
   Tourism & public-interest content for Howrah Sadar Subdivision.
   Visuals are CSS-gradient + emoji based (no external images),
   so the page stays fast and never shows broken photos. Swap in
   real photographs later by adding an `image` field per place.
   ──────────────────────────────────────────────────────────── */

export type PlaceCategory = 'Heritage' | 'Spiritual' | 'Nature' | 'River'

export interface Place {
  name: string
  bengali: string
  category: PlaceCategory
  emoji: string
  blurb: string
  highlight: string   // short headline fact shown on the card
  distance: string    // rough distance from Howrah Sadar
  gradient: string    // tailwind gradient classes for the "photo" panel
  hero?: boolean       // featured in the cinematic hero slideshow
}

export const PLACES: Place[] = [
  {
    name: 'Howrah Bridge',
    bengali: 'রবীন্দ্র সেতু',
    category: 'Heritage',
    emoji: '🌉',
    blurb: 'The iconic cantilever bridge over the Hooghly — a symbol of Bengal carrying over a hundred thousand vehicles across the river every single day.',
    highlight: 'Opened 1943 · Rabindra Setu',
    distance: 'City centre',
    gradient: 'from-amber-400 via-orange-500 to-rose-600',
    hero: true,
  },
  {
    name: 'Belur Math',
    bengali: 'বেলুড় মঠ',
    category: 'Spiritual',
    emoji: '🛕',
    blurb: 'The serene riverside headquarters of the Ramakrishna Mission, whose architecture fuses temple, church and mosque into one harmonious whole.',
    highlight: 'Founded 1897 by Swami Vivekananda',
    distance: '~8 km',
    gradient: 'from-orange-400 via-amber-500 to-yellow-600',
    hero: true,
  },
  {
    name: 'Indian Botanic Garden',
    bengali: 'শিবপুর বোটানিক্যাল গার্ডেন',
    category: 'Nature',
    emoji: '🌳',
    blurb: 'Sprawling 270-acre gardens at Shibpur, home to The Great Banyan — among the widest tree canopies on Earth, a forest grown from a single tree.',
    highlight: '250+ year-old Great Banyan',
    distance: '~5 km',
    gradient: 'from-emerald-400 via-green-500 to-teal-600',
    hero: true,
  },
  {
    name: 'Vidyasagar Setu',
    bengali: 'বিদ্যাসাগর সেতু',
    category: 'Heritage',
    emoji: '🌁',
    blurb: 'India’s longest cable-stayed bridge — a graceful sweep of steel cables linking Howrah to Kolkata, glowing beautifully after dusk.',
    highlight: 'Main span 457 m',
    distance: '~6 km',
    gradient: 'from-sky-400 via-blue-500 to-indigo-600',
    hero: true,
  },
  {
    name: 'Santragachi Jheel',
    bengali: 'সাঁতরাগাছি ঝিল',
    category: 'Nature',
    emoji: '🦆',
    blurb: 'A tranquil lake that draws thousands of migratory birds each winter — a quiet delight for birdwatchers and morning walkers alike.',
    highlight: 'Winter migratory birds',
    distance: '~7 km',
    gradient: 'from-cyan-400 via-teal-500 to-emerald-600',
  },
  {
    name: 'Garchumuk',
    bengali: 'গড়চুমুক',
    category: 'River',
    emoji: '🏞️',
    blurb: 'A favourite picnic spot where the Damodar meets the Hooghly, complete with a deer park, gardens and sweeping riverside views.',
    highlight: 'Deer park & river confluence',
    distance: '~50 km',
    gradient: 'from-teal-400 via-cyan-500 to-blue-600',
  },
  {
    name: 'Gadiara',
    bengali: 'গাদিয়াড়া',
    category: 'River',
    emoji: '⛵',
    blurb: 'Where three rivers meet — the Hooghly, Rupnarayan and Damodar — offering wide water vistas and the weathered ruins of Fort Mornington.',
    highlight: 'Three-river meeting point',
    distance: '~75 km',
    gradient: 'from-blue-400 via-sky-500 to-cyan-600',
    hero: true,
  },
  {
    name: 'Howrah Station',
    bengali: 'হাওড়া স্টেশন',
    category: 'Heritage',
    emoji: '🚉',
    blurb: 'One of India’s oldest and busiest railway terminals — a vast red-brick gateway that has welcomed travellers into Bengal since 1854.',
    highlight: 'Established 1854',
    distance: 'City centre',
    gradient: 'from-rose-400 via-red-500 to-orange-600',
  },
]

export const HERO_SLIDES: Place[] = PLACES.filter(p => p.hero)

/* Spotlighted in the large alternating feature section */
export const FEATURED_NAMES = ['Belur Math', 'Indian Botanic Garden']

export const CATEGORY_STYLE: Record<PlaceCategory, { chip: string; label: string }> = {
  Heritage:  { chip: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',     label: 'Heritage'  },
  Spiritual: { chip: 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300',  label: 'Spiritual' },
  Nature:    { chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300', label: 'Nature' },
  River:     { chip: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',              label: 'River'    },
}

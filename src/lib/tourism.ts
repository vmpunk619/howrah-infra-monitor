/* ────────────────────────────────────────────────────────────
   Tourism & public-interest content for Howrah Sadar Subdivision
   and nearby Kolkata.

   Each place has GPS coordinates (for live Google Maps directions)
   and an optional `image` path. Drop a photo at the given path under
   /public (e.g. public/tourism/howrah-bridge.jpg) and it will appear,
   gently animated (ken-burns). Until a photo exists, a soft muted
   gradient is shown instead — so nothing ever looks broken.
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
  gradient: string    // soft fallback gradient for the "photo" panel
  image?: string      // optional photo path under /public
  lat: number
  lng: number
  hero?: boolean       // featured in the cinematic hero slideshow
}

/** Google Maps directions/search link for a place (standard URL scheme). */
export function mapsUrl(p: Place): string {
  return `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`
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
    gradient: 'from-slate-600 via-amber-800/80 to-slate-800',
    image: '/tourism/howrah-bridge.jpg',
    lat: 22.5851, lng: 88.3468,
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
    gradient: 'from-amber-800/80 via-orange-900/80 to-stone-800',
    image: '/tourism/belur-math.jpg',
    lat: 22.6320, lng: 88.3556,
    hero: true,
  },
  {
    name: 'Indian Botanical Garden',
    bengali: 'শিবপুর বোটানিক্যাল গার্ডেন',
    category: 'Nature',
    emoji: '🌳',
    blurb: 'Sprawling 270-acre gardens at Shibpur, home to The Great Banyan — among the widest tree canopies on Earth, a forest grown from a single tree.',
    highlight: '250+ year-old Great Banyan',
    distance: '~5 km',
    gradient: 'from-emerald-800 via-teal-900 to-slate-800',
    image: '/tourism/botanical-garden.jpg',
    lat: 22.5558, lng: 88.2885,
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
    gradient: 'from-sky-800 via-blue-900 to-slate-800',
    image: '/tourism/vidyasagar-setu.jpg',
    lat: 22.5560, lng: 88.3300,
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
    gradient: 'from-teal-800 via-emerald-900 to-slate-800',
    image: '/tourism/santragachi-jheel.jpg',
    lat: 22.5905, lng: 88.2640,
  },
  {
    name: 'Garchumuk',
    bengali: 'গড়চুমুক',
    category: 'River',
    emoji: '🏞️',
    blurb: 'A favourite picnic spot where the Damodar meets the Hooghly, complete with a deer park, gardens and sweeping riverside views.',
    highlight: 'Deer park & river confluence',
    distance: '~50 km',
    gradient: 'from-cyan-800 via-teal-900 to-slate-800',
    image: '/tourism/garchumuk.jpg',
    lat: 22.4495, lng: 88.0905,
  },
  {
    name: 'Gadiara',
    bengali: 'গাদিয়াড়া',
    category: 'River',
    emoji: '⛵',
    blurb: 'Where three rivers meet — the Hooghly, Rupnarayan and Damodar — offering wide water vistas and the weathered ruins of Fort Mornington.',
    highlight: 'Three-river meeting point',
    distance: '~75 km',
    gradient: 'from-blue-800 via-cyan-900 to-slate-800',
    image: '/tourism/gadiara.jpg',
    lat: 22.2350, lng: 88.0850,
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
    gradient: 'from-rose-900/80 via-stone-700 to-slate-800',
    image: '/tourism/howrah-station.jpg',
    lat: 22.5839, lng: 88.3425,
  },
]

/* Just across the Hooghly — Kolkata’s headline attractions, an easy
   day-trip from Howrah Sadar via the bridges or river ferries. */
export const NEARBY_KOLKATA: Place[] = [
  {
    name: 'Victoria Memorial',
    bengali: 'ভিক্টোরিয়া মেমোরিয়াল',
    category: 'Heritage',
    emoji: '🏛️',
    blurb: 'A majestic white-marble monument set in lush gardens — Kolkata’s most photographed landmark and a museum of the city’s history.',
    highlight: 'Built 1906–1921',
    distance: '~5 km across the river',
    gradient: 'from-slate-500 via-slate-600 to-slate-800',
    image: '/tourism/victoria-memorial.jpg',
    lat: 22.5448, lng: 88.3426,
  },
  {
    name: 'Dakshineswar Kali Temple',
    bengali: 'দক্ষিণেশ্বর কালী মন্দির',
    category: 'Spiritual',
    emoji: '🛕',
    blurb: 'A revered riverside temple to Goddess Kali, closely tied to Sri Ramakrishna — just upstream and across from Belur Math.',
    highlight: 'Consecrated 1855',
    distance: '~12 km',
    gradient: 'from-amber-800/80 via-orange-900/80 to-stone-800',
    image: '/tourism/dakshineswar.jpg',
    lat: 22.6550, lng: 88.3576,
  },
  {
    name: 'Indian Museum',
    bengali: 'ভারতীয় জাদুঘর',
    category: 'Heritage',
    emoji: '🏺',
    blurb: 'The oldest and largest museum in India, founded in 1814 — galleries of antiquities, fossils, art and Egyptian mummies on Chowringhee.',
    highlight: 'Founded 1814',
    distance: '~5 km',
    gradient: 'from-amber-800/80 via-stone-700 to-slate-800',
    image: '/tourism/indian-museum.jpg',
    lat: 22.5577, lng: 88.3510,
  },
  {
    name: 'Princep Ghat',
    bengali: 'প্রিন্সেপ ঘাট',
    category: 'River',
    emoji: '⛵',
    blurb: 'A picturesque Palladian riverside promenade beneath the Vidyasagar Setu — boat rides, sunsets and evening lights on the Hooghly.',
    highlight: 'Built 1841',
    distance: '~5 km',
    gradient: 'from-sky-800 via-blue-900 to-slate-800',
    image: '/tourism/princep-ghat.jpg',
    lat: 22.5575, lng: 88.3300,
  },
  {
    name: 'Eden Gardens',
    bengali: 'ইডেন গার্ডেন্স',
    category: 'Heritage',
    emoji: '🏏',
    blurb: 'One of the world’s most famous cricket stadiums and the spiritual home of Indian cricket — electric on a match day.',
    highlight: 'Est. 1864',
    distance: '~5 km',
    gradient: 'from-emerald-800 via-green-900 to-slate-800',
    image: '/tourism/eden-gardens.jpg',
    lat: 22.5645, lng: 88.3433,
  },
  {
    name: 'Alipore Zoo',
    bengali: 'আলিপুর চিড়িয়াখানা',
    category: 'Nature',
    emoji: '🦁',
    blurb: 'India’s oldest zoological garden, opened in 1876 — a leafy family favourite home to tigers, big cats, reptiles and migratory birds.',
    highlight: 'Opened 1876',
    distance: '~7 km',
    gradient: 'from-teal-800 via-emerald-900 to-slate-800',
    image: '/tourism/alipore-zoo.jpg',
    lat: 22.5370, lng: 88.3320,
  },
]

export const HERO_SLIDES: Place[] = PLACES.filter(p => p.hero)

/* Spotlighted in the large alternating feature section */
export const FEATURED_NAMES = ['Belur Math', 'Indian Botanical Garden']

export const CATEGORY_STYLE: Record<PlaceCategory, { chip: string; label: string }> = {
  Heritage:  { chip: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',     label: 'Heritage'  },
  Spiritual: { chip: 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300',  label: 'Spiritual' },
  Nature:    { chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300', label: 'Nature' },
  River:     { chip: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',              label: 'River'    },
}

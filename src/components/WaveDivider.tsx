/**
 * Curved SVG section divider — creates a flowing transition between
 * sections of different background colours. Theme-aware via CSS class.
 *
 *   <WaveDivider to="white" />          // light: white,  dark: navy-950
 *   <WaveDivider to="slate-50" />       // light: slate,  dark: navy-900
 *   <WaveDivider to="saffron-mesh" />   // light: saffron, dark: navy
 */
interface Props {
  /**
   * The destination section's bg theme. Maps to a CSS class that
   * overrides fill colour per theme.
   */
  to: 'white' | 'slate-50' | 'navy' | 'saffron-mesh'
  flip?: boolean
  height?: number
  variant?: 'curve' | 'peaks' | 'layered'
}

const FILL_CLASS: Record<Props['to'], string> = {
  'white':         'wave-fill-white',
  'slate-50':      'wave-fill-slate',
  'navy':          'wave-fill-navy',
  'saffron-mesh':  'wave-fill-saffron',
}

export default function WaveDivider({
  to,
  flip = false,
  height = 70,
  variant = 'curve',
}: Props) {
  const transform = flip ? 'scale(1, -1) translate(0, -120)' : undefined
  const fillClass = FILL_CLASS[to]

  const paths = {
    curve: (
      <path
        d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,90 1440,60 L1440,120 L0,120 Z"
        className={fillClass}
      />
    ),
    peaks: (
      <>
        <path
          d="M0,80 L240,40 L480,90 L720,30 L960,80 L1200,40 L1440,80 L1440,120 L0,120 Z"
          className={fillClass}
          opacity="0.4"
        />
        <path
          d="M0,100 L240,60 L480,110 L720,50 L960,100 L1200,60 L1440,100 L1440,120 L0,120 Z"
          className={fillClass}
        />
      </>
    ),
    layered: (
      <>
        <path
          d="M0,80 C360,140 720,20 1080,80 C1260,110 1380,110 1440,80 L1440,120 L0,120 Z"
          className={fillClass}
          opacity="0.45"
        />
        <path
          d="M0,100 C360,150 720,50 1080,100 C1260,125 1380,125 1440,100 L1440,120 L0,120 Z"
          className={fillClass}
        />
      </>
    ),
  }

  return (
    <svg
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className="wave-divider"
      style={{ height: `${height}px` }}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g transform={transform}>{paths[variant]}</g>
    </svg>
  )
}

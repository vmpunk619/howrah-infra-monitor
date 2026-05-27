import { useEffect, useRef, useState } from 'react'

/**
 * Returns a ref + an `isVisible` flag that flips to `true` the moment
 * the element scrolls into view. Use to trigger fade/slide-in animations.
 *
 *   const { ref, isVisible } = useScrollReveal()
 *   <div ref={ref} className={isVisible ? 'animate-fade-up' : 'opacity-0'}>...</div>
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: { threshold?: number; rootMargin?: string; once?: boolean } = {}
) {
  const { threshold = 0.15, rootMargin = '0px 0px -10% 0px', once = true } = options
  const ref = useRef<T | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) obs.disconnect()
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin }
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [threshold, rootMargin, once])

  return { ref, isVisible }
}

/** Convenience wrapper that returns the className string directly. */
export function useReveal(opts?: Parameters<typeof useScrollReveal>[0]) {
  const { ref, isVisible } = useScrollReveal(opts)
  return {
    ref,
    cls: isVisible ? 'reveal-in' : 'reveal-out',
  }
}

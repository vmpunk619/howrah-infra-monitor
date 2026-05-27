import { Officer } from '../types'

/**
 * Returns the given officer id + every officer beneath them in the chain.
 * Used by the OfficerPortal to fetch all complaints assigned to me OR
 * any of my subordinates (so a DMDC sees complaints assigned to their OCs).
 */
export function selfAndDescendantIds(officerId: string, all: Officer[]): string[] {
  const out = new Set<string>([officerId])
  const queue: string[] = [officerId]
  while (queue.length) {
    const next = queue.shift()!
    for (const o of all) {
      if (o.parent_officer_id === next && !out.has(o.id)) {
        out.add(o.id)
        queue.push(o.id)
      }
    }
  }
  return [...out]
}

/**
 * Walks UP the chain from `officerId`, returning [self, parent, grandparent, …].
 * Used by the UI to show "Assigned to: SDDMO → DMDC Joydeep → SDO".
 */
export function ancestorChain(officerId: string, all: Officer[]): Officer[] {
  const byId = new Map(all.map(o => [o.id, o]))
  const chain: Officer[] = []
  let curId: string | null = officerId
  const seen = new Set<string>() // cycle guard
  while (curId && !seen.has(curId)) {
    seen.add(curId)
    const cur = byId.get(curId)
    if (!cur) break
    chain.push(cur)
    curId = cur.parent_officer_id
  }
  return chain
}

/** Direct children of an officer (one level down only). */
export function directReports(officerId: string, all: Officer[]): Officer[] {
  return all.filter(o => o.parent_officer_id === officerId)
}

/** Top-level officers (no parent — usually the SDO). */
export function rootOfficers(all: Officer[]): Officer[] {
  return all.filter(o => o.parent_officer_id === null)
}

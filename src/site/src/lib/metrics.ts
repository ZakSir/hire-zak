/**
 * Match numbers that have meaningful context:
 *   - Percentages (50%, 3.5%)
 *   - Multipliers / shorthand (2x, 10K, 5M, 1.2B)
 *   - Time units (200ms, 3s, 2hr, 5 hours, 30 min)
 *   - Counts with explicit units (80 users, 12 engineers, 500 requests)
 *   - Dollar amounts ($5M, $120K)
 *
 * Bare numbers like `80` with no context are intentionally NOT matched.
 */
const contextualNumber =
  /(?:\$\d[\d,.]*\s*[kKmMbB]?|\b\d[\d,.]*\s*(?:%|[xX]|[kKmMbB]|ms|s|sec|seconds?|min|minutes?|hrs?|hours?|days?|weeks?|months?|years?|users?|engineers?|devs?|requests?|calls?|queries?|files?|lines?|repos?|PRs?|tickets?|bugs?|tests?|builds?|deploys?|clusters?|nodes?|instances?|services?|endpoints?|records?|rows?|transactions?|events?|messages?|customers?|clients?|accounts?|teams?|projects?|apps?|pages?|views?|sessions?|clicks?|downloads?|uploads?|commits?|releases?|sprints?|iterations?|cycles?|pipelines?))\b/gi

export type Metric = {
  raw: string
  context: string
}

/**
 * Extract context around a metric - grab a few words to explain what it measures
 */
function extractContext(text: string, matchIndex: number, matchLength: number): string {
  // Look for context after the number (e.g., "40% reduction in cycle time")
  const after = text.slice(matchIndex + matchLength, matchIndex + matchLength + 50)
  const afterMatch = after.match(/^\s*(?:reduction|improvement|increase|decrease|faster|slower|uplift|growth|savings?|gain|drop|cut|boost)?(?:\s+(?:in|of|for|to|across|via|through|with))?\s*([a-z][a-z\s]{2,20})/i)
  if (afterMatch?.[1]) {
    return afterMatch[1].trim().replace(/\s+/g, ' ').slice(0, 24)
  }
  
  // Look for context before the number (e.g., "reduced cycle time by 40%")
  const before = text.slice(Math.max(0, matchIndex - 40), matchIndex)
  const beforeMatch = before.match(/([a-z][a-z\s]{2,20})\s*(?:by|to|of|up|down)?\s*$/i)
  if (beforeMatch?.[1]) {
    return beforeMatch[1].trim().replace(/\s+/g, ' ').slice(0, 24)
  }
  
  return 'impact'
}

export function extractMetrics(text: string): Metric[] {
  const matches = Array.from(text.matchAll(contextualNumber))
  const seen = new Set<string>()
  const results: Metric[] = []

  for (const match of matches) {
    const raw = match[0].trim()
    if (seen.has(raw)) continue
    seen.add(raw)
    
    const context = extractContext(text, match.index ?? 0, match[0].length)
    results.push({ raw, context })
    
    if (results.length >= 6) break
  }

  return results
}

export function highlightMetrics(text: string): { parts: Array<{ t: string; isMetric: boolean }> } {
  const matches = Array.from(text.matchAll(contextualNumber))
  if (!matches.length) return { parts: [{ t: text, isMetric: false }] }

  const parts: Array<{ t: string; isMetric: boolean }> = []
  let last = 0

  for (const match of matches) {
    if (match.index == null) continue
    const start = match.index
    const end = start + match[0].length

    if (start > last) parts.push({ t: text.slice(last, start), isMetric: false })
    parts.push({ t: text.slice(start, end), isMetric: true })
    last = end
  }

  if (last < text.length) parts.push({ t: text.slice(last), isMetric: false })
  return { parts }
}

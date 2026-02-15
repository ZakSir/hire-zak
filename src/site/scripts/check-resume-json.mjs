import fs from 'node:fs'
import path from 'node:path'

function main() {
  const root = process.cwd()
  const filePath = path.join(root, 'public', 'resume.json')

  let text
  try {
    text = fs.readFileSync(filePath, 'utf8')
  } catch (e) {
    console.error(`Could not read ${filePath}`)
    console.error(e instanceof Error ? e.message : String(e))
    process.exit(1)
  }

  try {
    JSON.parse(text)
    console.log(`OK: ${filePath} parses as valid JSON`)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error(`INVALID: ${filePath}`)
    console.error(message)

    const posMatch = message.match(/position\s+(\d+)/i)
    const pos = posMatch ? Number(posMatch[1]) : undefined

    if (typeof pos === 'number' && Number.isFinite(pos)) {
      const start = Math.max(0, pos - 180)
      const end = Math.min(text.length, pos + 180)
      const before = text.slice(start, pos)
      const after = text.slice(pos, end)
      const esc = (s) => s.replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t')
      console.error('---')
      console.error(`${esc(before)}^${esc(after)}`)
      console.error('---')
    }

    process.exit(1)
  }
}

main()

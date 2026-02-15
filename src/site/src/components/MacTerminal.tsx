import { useEffect, useMemo, useState } from 'react'

type Line = {
  t: 'prompt' | 'out' | 'success' | 'info' | 'warn'
  s: string
}

type Props = {
  title?: string
}

const DEMOS: Array<{ prompt: string; out: Array<{ t: Line['t']; s: string }>; delay?: number }> = [
  {
    prompt: 'git log --oneline --author="Zak" | head -5',
    out: [
      { t: 'out', s: 'a3f2d1e feat(agents): add MCP server tool orchestration' },
      { t: 'out', s: '8c7b6a5 perf(rag): optimize vector search latency 40%' },
      { t: 'out', s: '2e1d0c9 feat(eval): guardrails + toxicity filtering' },
      { t: 'out', s: 'f4e3d2c fix(langchain): streaming response handler' },
      { t: 'out', s: 'b9a8c7d docs: update architecture decision records' },
    ],
    delay: 3500,
  },
  {
    prompt: 'gh pr list --author @me --state merged --limit 3',
    out: [
      { t: 'success', s: '#847  MERGED  feat: SOC agentic triage automation      5d ago' },
      { t: 'success', s: '#812  MERGED  perf: reduce embedding latency by 60%   2w ago' },
      { t: 'success', s: '#798  MERGED  feat: dynamic report generation        3w ago' },
    ],
    delay: 3200,
  },
  {
    prompt: 'npm info @zakfargo/mcp-tools',
    out: [
      { t: 'info', s: '@zakfargo/mcp-tools@2.4.1 | MIT | deps: 3 | versions: 47' },
      { t: 'out', s: 'Model Context Protocol utilities for agentic systems' },
      { t: 'out', s: '' },
      { t: 'out', s: 'dist-tags:' },
      { t: 'success', s: 'latest: 2.4.1    next: 3.0.0-beta.2' },
    ],
    delay: 3800,
  },
  {
    prompt: 'az cognitiveservices account list --query "[].name" -o tsv',
    out: [
      { t: 'out', s: 'soc-automation-openai-prod' },
      { t: 'out', s: 'security-copilot-eastus' },
      { t: 'out', s: 'rag-embeddings-westus2' },
    ],
    delay: 2800,
  },
  {
    prompt: 'docker images | grep "ai-" | head -4',
    out: [
      { t: 'out', s: 'ai-soc-agent       v2.3.1   a3b2c1d   2 days ago   847MB' },
      { t: 'out', s: 'ai-eval-harness    v1.8.0   f4e5d6c   1 week ago   412MB' },
      { t: 'out', s: 'ai-rag-service     v3.1.0   b7a8c9d   3 days ago   623MB' },
      { t: 'out', s: 'ai-guardrails      v1.2.4   e1f2a3b   5 days ago   298MB' },
    ],
    delay: 3000,
  },
  {
    prompt: 'pytest tests/ -v --tb=no | tail -5',
    out: [
      { t: 'success', s: 'tests/test_rag.py::test_retrieval_accuracy PASSED' },
      { t: 'success', s: 'tests/test_agent.py::test_tool_orchestration PASSED' },
      { t: 'success', s: 'tests/test_guardrails.py::test_toxicity_filter PASSED' },
      { t: 'out', s: '' },
      { t: 'success', s: '====== 147 passed, 0 failed in 12.34s ======' },
    ],
    delay: 4000,
  },
  {
    prompt: 'kubectl get pods -n ai-prod | grep Running',
    out: [
      { t: 'success', s: 'agent-orchestrator-7d8f9   1/1   Running   0   4h' },
      { t: 'success', s: 'rag-service-5c6d7          3/3   Running   0   12h' },
      { t: 'success', s: 'embedding-worker-8e9f0     2/2   Running   0   1d' },
    ],
    delay: 2600,
  },
]

function nowPrompt() {
  return `zak@hirezak ~ % `
}

export default function MacTerminal({ title = 'Terminal — zsh' }: Props) {
  const [lines, setLines] = useState<Line[]>([])
  const [cursor, setCursor] = useState(true)

  const demo = useMemo(() => DEMOS, [])

  useEffect(() => {
    const i = window.setInterval(() => setCursor((c) => !c), 520)
    return () => window.clearInterval(i)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function sleep(ms: number) {
      await new Promise((r) => setTimeout(r, ms))
    }

    async function run() {
      while (!cancelled) {
        for (const cmd of demo) {
          if (cancelled) return

          // Type prompt + command
          const prompt = nowPrompt()
          let typed = ''
          setLines([])
          await sleep(600) // Pause before starting new command

          for (const ch of cmd.prompt) {
            if (cancelled) return
            typed += ch
            setLines([{ t: 'prompt', s: `${prompt}${typed}` }])
            await sleep(35 + Math.random() * 45) // Slower, more realistic typing
          }

          await sleep(300) // Brief pause after typing before output

          // Print output lines one by one for drama
          const allLines: Line[] = [{ t: 'prompt', s: `${prompt}${cmd.prompt}` }]
          setLines([...allLines])
          await sleep(200)
          
          for (const outLine of cmd.out) {
            if (cancelled) return
            allLines.push(outLine)
            setLines([...allLines])
            await sleep(80 + Math.random() * 120) // Stagger output lines
          }

          // Long pause to admire the output
          await sleep(cmd.delay ?? 2500)
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [demo])

  return (
    <div className="macTerm">
      <div className="macTermTop">
        <div className="macDots" aria-hidden="true">
          <span className="dot dotRed" />
          <span className="dot dotYellow" />
          <span className="dot dotGreen" />
        </div>
        <div className="macTitle">{title}</div>
        <div style={{ width: 54 }} />
      </div>
      <div className="macBody" role="img" aria-label="Animated terminal transcript">
        {lines.map((l, idx) => (
          <div 
            key={idx} 
            className={`macLine ${l.t === 'prompt' ? 'macPrompt' : ''} ${l.t === 'success' ? 'macSuccess' : ''} ${l.t === 'info' ? 'macInfo' : ''} ${l.t === 'warn' ? 'macWarn' : ''}`}
          >
            {l.s}
            {idx === 0 && l.t === 'prompt' ? (
              <span className="macCursor" style={{ opacity: cursor ? 1 : 0 }}>
                ▋
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

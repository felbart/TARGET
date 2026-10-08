import { useState } from 'react'
import { useLocalStorage, patch, uid } from '../hooks/useLocalStorage'
import { pillarsDefaults } from '../data/defaults'
import {
  Card, Field, Input, Textarea, Button, Badge, Checkbox, EmptyState,
  IconTarget, IconTrash, IconPlus, IconShield, IconSpark, IconLayers,
} from '../components/ui'

const RING_META = [
  { label: 'Centro', tag: 'Onde eu domino', ring: 'border-emerald-400/70 bg-emerald-500/25', text: 'text-emerald-200' },
  { label: 'Nível 1', tag: 'Adjacente', ring: 'border-emerald-500/40 bg-emerald-500/[0.10]', text: 'text-emerald-300/90' },
  { label: 'Nível 2', tag: 'Genérico', ring: 'border-cyan-500/25 bg-cyan-500/[0.05]', text: 'text-cyan-300/80' },
  { label: 'Nível 3', tag: 'Fora do foco', ring: 'border-zinc-700 bg-zinc-800/20', text: 'text-zinc-500' },
]

function Bullseye({ levels, active, onSelect }) {
  // Círculos concêntricos: o índice 3 é o maior (externo), 0 é o centro.
  const sizes = ['28%', '52%', '76%', '100%']
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px]">
      {[3, 2, 1, 0].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={`${RING_META[i].label}: ${levels[i]}`}
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border transition ${RING_META[i].ring} ${
            active === i ? 'ring-2 ring-emerald-300/60 ring-offset-2 ring-offset-zinc-950' : 'hover:brightness-125'
          }`}
          style={{ width: sizes[i], height: sizes[i] }}
        >
          {i > 0 && (
            <span
              className={`absolute left-1/2 top-[3.5%] -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-wider ${RING_META[i].text}`}
            >
              {RING_META[i].label}
            </span>
          )}
          {i === 0 && (
            <span className="flex h-full w-full items-center justify-center p-2 text-center font-mono text-[10px] font-semibold uppercase leading-tight text-emerald-100">
              Marca
              <br />
              + Site
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export default function Pillars() {
  const [state, setState] = useLocalStorage('pillars', pillarsDefaults)
  const set = patch(setState)
  const [activeRing, setActiveRing] = useState(0)
  const [newBelief, setNewBelief] = useState({ market: '', thesis: '' })
  const [newKeyword, setNewKeyword] = useState('')
  const [newSetup, setNewSetup] = useState('')

  const updateBelief = (id, field, val) =>
    set('beliefs', state.beliefs.map((b) => (b.id === id ? { ...b, [field]: val } : b)))

  const addBelief = () => {
    if (!newBelief.market.trim() && !newBelief.thesis.trim()) return
    set('beliefs', [...state.beliefs, { id: uid(), ...newBelief }])
    setNewBelief({ market: '', thesis: '' })
  }

  const addKeyword = () => {
    const k = newKeyword.trim()
    if (!k || state.keywords.includes(k)) return
    set('keywords', [...state.keywords, k])
    setNewKeyword('')
  }

  const addSetup = () => {
    if (!newSetup.trim()) return
    set('setup', [...state.setup, { id: uid(), label: newSetup.trim(), done: false }])
    setNewSetup('')
  }

  return (
    <div className="grid gap-6">
      {/* 1. Bullseye */}
      <Card
        title="Alvo do Nicho"
        icon={<IconTarget />}
        subtitle="Quanto mais perto do centro, mais o conteúdo converte. Clique num anel para editar."
      >
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,340px)_1fr]">
          <Bullseye levels={state.bullseye} active={activeRing} onSelect={setActiveRing} />
          <div className="grid gap-3">
            {state.bullseye.map((lvl, i) => (
              <div
                key={i}
                className={`rounded-xl border p-3 transition ${
                  activeRing === i ? 'border-emerald-500/40 bg-emerald-500/[0.04]' : 'border-zinc-800 bg-zinc-950/40'
                }`}
                onFocus={() => setActiveRing(i)}
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span className={`font-mono text-[11px] uppercase tracking-wider ${RING_META[i].text}`}>{RING_META[i].label}</span>
                  <Badge tone={i === 0 ? 'emerald' : i === 1 ? 'emerald' : i === 2 ? 'cyan' : 'zinc'}>{RING_META[i].tag}</Badge>
                </div>
                <Input
                  value={lvl}
                  onChange={(e) => set('bullseye', state.bullseye.map((l, j) => (j === i ? e.target.value : l)))}
                />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 2. Crenças contrárias */}
      <Card
        title="Cofre de Crenças Contrárias"
        icon={<IconShield />}
        subtitle="Teses polarizadas que separam você do consenso do mercado — combustível para ganchos."
      >
        <div className="grid gap-3">
          {state.beliefs.length === 0 && <EmptyState>Nenhuma tese cadastrada.</EmptyState>}
          {state.beliefs.map((b, idx) => (
            <div key={b.id} className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 md:grid-cols-[1fr_auto_1fr_auto] md:items-start">
              <Field label={`#${idx + 1} · O mercado diz`}>
                <Textarea value={b.market} onChange={(e) => updateBelief(b.id, 'market', e.target.value)} className="border-rose-500/20 text-zinc-400 line-through decoration-rose-500/40" />
              </Field>
              <div className="hidden pt-8 font-mono text-emerald-400 md:block">→</div>
              <Field label="Minha tese">
                <Textarea value={b.thesis} onChange={(e) => updateBelief(b.id, 'thesis', e.target.value)} className="border-emerald-500/25" />
              </Field>
              <div className="md:pt-6">
                <Button variant="danger" size="icon" aria-label="Remover tese" onClick={() => set('beliefs', state.beliefs.filter((x) => x.id !== b.id))}>
                  <IconTrash className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}

          <div className="grid gap-3 rounded-xl border border-dashed border-zinc-700 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <Field label="Nova crença do mercado">
              <Input value={newBelief.market} onChange={(e) => setNewBelief({ ...newBelief, market: e.target.value })} placeholder="“Designer precisa ser especialista em uma coisa só.”" />
            </Field>
            <Field label="Sua tese contrária">
              <Input value={newBelief.thesis} onChange={(e) => setNewBelief({ ...newBelief, thesis: e.target.value })} placeholder="“A interseção é o que torna a entrega um resultado.”" onKeyDown={(e) => e.key === 'Enter' && addBelief()} />
            </Field>
            <Button variant="primary" onClick={addBelief}><IconPlus className="h-4 w-4" />Adicionar</Button>
          </div>
        </div>
      </Card>

      {/* 3. Âncoras */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Âncoras de Marca" icon={<IconSpark />} subtitle="Palavras-chave repetidas até virarem sinônimo do seu nome.">
          <div className="flex flex-wrap gap-2">
            {state.keywords.map((k) => (
              <span key={k} className="group inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.08] py-1 pl-3 pr-1.5 font-mono text-sm text-emerald-200">
                {k}
                <button
                  type="button"
                  aria-label={`Remover ${k}`}
                  onClick={() => set('keywords', state.keywords.filter((x) => x !== k))}
                  className="rounded p-0.5 text-emerald-400/60 hover:bg-emerald-500/20 hover:text-emerald-200"
                >
                  <IconTrash className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Input value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} placeholder="Nova âncora…" onKeyDown={(e) => e.key === 'Enter' && addKeyword()} />
            <Button onClick={addKeyword}><IconPlus className="h-4 w-4" /></Button>
          </div>
        </Card>

        <Card
          title="Objetos de Reconhecimento"
          icon={<IconLayers />}
          subtitle="Setup visual fixo: o espectador reconhece o vídeo antes de ler o nome."
          actions={<Badge tone="emerald">{state.setup.filter((s) => s.done).length}/{state.setup.length} prontos</Badge>}
        >
          <div className="mb-4 overflow-hidden rounded-xl border border-zinc-800">
            <div className="flex items-center gap-1.5 border-b border-zinc-800 bg-zinc-900 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400/60" />
              <span className="h-2 w-2 rounded-full bg-amber-400/60" />
              <span className="h-2 w-2 rounded-full bg-emerald-400/60" />
              <span className="ml-2 font-mono text-[10px] text-zinc-500">antes-depois.frame</span>
            </div>
            <div className="grid h-24 grid-cols-2">
              <div className="flex flex-col items-center justify-center gap-1.5 border-r border-zinc-800 bg-zinc-950">
                <span className="flex h-8 w-8 items-center justify-center rounded bg-zinc-700 font-serif text-xs text-zinc-400">Aa</span>
                <span className="font-mono text-[10px] uppercase text-zinc-500">Antes</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1.5 bg-zinc-950">
                <span className="flex items-center gap-1">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-xs font-bold text-zinc-950">M</span>
                  <span className="h-8 w-2 rounded-sm bg-emerald-400/70" />
                  <span className="h-8 w-2 rounded-sm bg-cyan-400/70" />
                  <span className="h-8 w-2 rounded-sm bg-zinc-200/80" />
                </span>
                <span className="font-mono text-[10px] uppercase text-emerald-400">Depois</span>
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            {state.setup.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <Checkbox checked={s.done} onChange={(v) => set('setup', state.setup.map((x) => (x.id === s.id ? { ...x, done: v } : x)))}>
                    {s.label}
                  </Checkbox>
                </div>
                <Button variant="danger" size="icon" aria-label="Remover" onClick={() => set('setup', state.setup.filter((x) => x.id !== s.id))}>
                  <IconTrash className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Input value={newSetup} onChange={(e) => setNewSetup(e.target.value)} placeholder="Novo elemento visual…" onKeyDown={(e) => e.key === 'Enter' && addSetup()} />
            <Button onClick={addSetup}><IconPlus className="h-4 w-4" /></Button>
          </div>
        </Card>
      </div>

      {/* 4. White Space */}
      <Card
        title="Matriz de Espaço Vazio (White Space)"
        icon={<IconLayers />}
        subtitle="Onde o mercado está saturado vs. onde a sua entrega ocupa um espaço que ninguém ocupa."
      >
        <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="w-32 border-b border-zinc-800 pb-2 font-medium">Dimensão</th>
                <th className="border-b border-zinc-800 pb-2 pl-3 font-medium">Concorrentes Comuns</th>
                <th className="border-b border-zinc-800 pb-2 pl-3 font-medium text-emerald-400">Minha Entrega Diferenciada</th>
              </tr>
            </thead>
            <tbody>
              {state.matrix.map((row, i) => (
                <tr key={row.dim} className="align-top">
                  <td className="border-b border-zinc-800/60 py-3 pr-3 font-mono text-xs text-zinc-300">{row.dim}</td>
                  <td className="border-b border-zinc-800/60 py-3 pl-3">
                    <Textarea
                      value={row.common}
                      onChange={(e) => set('matrix', state.matrix.map((r, j) => (j === i ? { ...r, common: e.target.value } : r)))}
                      className="text-zinc-400"
                    />
                  </td>
                  <td className="border-b border-zinc-800/60 py-3 pl-3">
                    <Textarea
                      value={row.mine}
                      onChange={(e) => set('matrix', state.matrix.map((r, j) => (j === i ? { ...r, mine: e.target.value } : r)))}
                      className="border-emerald-500/25 bg-emerald-500/[0.03]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

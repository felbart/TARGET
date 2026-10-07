import { useState } from 'react'
import { useLocalStorage, uid } from '../hooks/useLocalStorage'
import { formulaOptions, formulasDefaults } from '../data/defaults'
import {
  Card, Field, Input, Select, Textarea, Button, Badge, Switch, EmptyState,
  IconFlask, IconShuffle, IconPlus, IconTrash, IconCode,
} from '../components/ui'

export const STATUS = {
  testing: { label: 'Em Teste', short: 'Em Teste', tone: 'amber' },
  validated: { label: 'Validada para Escala', short: 'Validadas', tone: 'emerald' },
  discarded: { label: 'Descartada', short: 'Descartadas', tone: 'rose' },
}

export const TESTS = [
  { key: 'performance', label: 'Performance', desc: 'Alcance / retenção acima da média' },
  { key: 'leads', label: 'Qualidade dos Leads', desc: 'Comentários e DMs de clientes potenciais' },
  { key: 'sustainability', label: 'Sustentabilidade', desc: 'Produção sem atrito, repetível toda semana' },
  { key: 'aesthetics', label: 'Estética de Alto Padrão', desc: 'Sensação premium, coerente com a marca' },
]

export const formulaLabel = (f) => `${f.topic} + ${f.format} + ${f.layout}`

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

function OptionGroup({ title, color, items, value, onPick, onAdd, onRemove }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    if (draft.trim()) onAdd(draft.trim())
    setDraft('')
  }
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
      <div className={`mb-3 font-mono text-[11px] uppercase tracking-wider ${color}`}>{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => {
          const active = it === value
          return (
            <span key={it} className="group relative">
              <button
                type="button"
                onClick={() => onPick(it)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${
                  active
                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-100'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                {it}
              </button>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(it)}
                  aria-label={`Remover ${it}`}
                  className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-zinc-700 text-[10px] text-zinc-200 hover:bg-rose-500 group-hover:flex"
                >
                  ×
                </button>
              )}
            </span>
          )
        })}
      </div>
      <div className="mt-3 flex gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Nova opção…" className="h-8 py-1 text-xs" onKeyDown={(e) => e.key === 'Enter' && add()} />
        <Button size="sm" onClick={add}><IconPlus className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  )
}

export default function Formulas() {
  const [options, setOptions] = useLocalStorage('formulaOptions', formulaOptions)
  const [formulas, setFormulas] = useLocalStorage('formulas', formulasDefaults)
  const [draft, setDraft] = useState({
    topic: options.topics[0],
    format: options.formats[0],
    layout: options.layouts[0],
  })
  const [filter, setFilter] = useState('all')

  const groups = [
    { key: 'topics', field: 'topic', title: 'Tópico', color: 'text-emerald-400' },
    { key: 'formats', field: 'format', title: 'Formato', color: 'text-cyan-400' },
    { key: 'layouts', field: 'layout', title: 'Layout Visual', color: 'text-zinc-300' },
  ]

  const shuffle = () =>
    setDraft({ topic: pick(options.topics), format: pick(options.formats), layout: pick(options.layouts) })

  const exists = formulas.some((f) => f.topic === draft.topic && f.format === draft.format && f.layout === draft.layout)

  const addFormula = () => {
    if (exists || !draft.topic || !draft.format || !draft.layout) return
    setFormulas([
      {
        id: uid(),
        ...draft,
        tests: { performance: false, leads: false, sustainability: false, aesthetics: false },
        notes: '',
        status: 'testing',
      },
      ...formulas,
    ])
  }

  const update = (id, changes) => setFormulas(formulas.map((f) => (f.id === id ? { ...f, ...changes } : f)))

  const counts = Object.fromEntries(Object.keys(STATUS).map((s) => [s, formulas.filter((f) => f.status === s).length]))
  const visible = filter === 'all' ? formulas : formulas.filter((f) => f.status === filter)

  return (
    <div className="grid gap-6">
      {/* 1. Gerador */}
      <Card
        title="Gerador de Fórmulas"
        icon={<IconCode />}
        subtitle="Fórmula = Tópico + Formato + Layout Visual. Combine, teste e escale só o que vencer."
        actions={<Button size="sm" onClick={shuffle}><IconShuffle className="h-3.5 w-3.5" />Aleatória</Button>}
      >
        <div className="grid gap-3 lg:grid-cols-3">
          {groups.map((g) => (
            <OptionGroup
              key={g.key}
              title={g.title}
              color={g.color}
              items={options[g.key]}
              value={draft[g.field]}
              onPick={(v) => setDraft({ ...draft, [g.field]: v })}
              onAdd={(v) => !options[g.key].includes(v) && setOptions({ ...options, [g.key]: [...options[g.key], v] })}
              onRemove={(v) => {
                const next = options[g.key].filter((x) => x !== v)
                setOptions({ ...options, [g.key]: next })
                if (draft[g.field] === v) setDraft({ ...draft, [g.field]: next[0] })
              }}
            />
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/[0.07] via-zinc-950 to-cyan-500/[0.06] p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
            <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-emerald-200">{draft.topic}</span>
            <span className="text-zinc-600">+</span>
            <span className="rounded-md bg-cyan-500/15 px-2 py-1 text-cyan-200">{draft.format}</span>
            <span className="text-zinc-600">+</span>
            <span className="rounded-md bg-zinc-800 px-2 py-1 text-zinc-200">{draft.layout}</span>
          </div>
          <Button variant="primary" onClick={addFormula} disabled={exists} className="shrink-0">
            <IconPlus className="h-4 w-4" />
            {exists ? 'Já está em teste' : 'Enviar para validação'}
          </Button>
        </div>
      </Card>

      {/* 2. Validação */}
      <Card
        title="Validação dos 4 Testes"
        icon={<IconFlask />}
        subtitle="Uma fórmula só escala quando passa nos 4. Fase 2 do sprint usa apenas as validadas."
        actions={
          <div className="flex flex-wrap gap-1 rounded-lg bg-zinc-950/60 p-1">
            {[['all', `Todas (${formulas.length})`], ...Object.entries(STATUS).map(([k, v]) => [k, `${v.short} (${counts[k]})`])].map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setFilter(k)}
                className={`rounded-md px-2.5 py-1 text-xs transition ${filter === k ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      >
        {visible.length === 0 ? (
          <EmptyState>Nenhuma fórmula aqui. Gere uma combinação acima.</EmptyState>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {visible.map((f) => {
              const passed = TESTS.filter((t) => f.tests[t.key]).length
              const allPass = passed === TESTS.length
              return (
                <article
                  key={f.id}
                  className={`rounded-xl border bg-zinc-950/40 p-4 transition ${
                    f.status === 'validated'
                      ? 'border-emerald-500/40'
                      : f.status === 'discarded'
                        ? 'border-zinc-800 opacity-60'
                        : 'border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Badge tone={STATUS[f.status].tone}>{STATUS[f.status].label}</Badge>
                      <h4 className="mt-2 text-sm font-medium leading-snug text-zinc-100">
                        <span className="text-emerald-300">{f.topic}</span>
                        <span className="text-zinc-600"> + </span>
                        <span className="text-cyan-300">{f.format}</span>
                        <span className="text-zinc-600"> + </span>
                        <span className="text-zinc-300">{f.layout}</span>
                      </h4>
                    </div>
                    <Button variant="danger" size="icon" aria-label="Excluir fórmula" onClick={() => setFormulas(formulas.filter((x) => x.id !== f.id))}>
                      <IconTrash className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="mt-3 grid gap-0.5 sm:grid-cols-2">
                    {TESTS.map((t) => (
                      <Switch
                        key={t.key}
                        checked={f.tests[t.key]}
                        onChange={(v) => update(f.id, { tests: { ...f.tests, [t.key]: v } })}
                        label={t.label}
                        description={t.desc}
                      />
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex flex-1 gap-1">
                      {TESTS.map((t) => (
                        <span key={t.key} className={`h-1.5 flex-1 rounded-full ${f.tests[t.key] ? 'bg-emerald-400' : 'bg-zinc-800'}`} />
                      ))}
                    </div>
                    <span className="font-mono text-xs text-zinc-400">{passed}/4</span>
                  </div>

                  {allPass && f.status === 'testing' && (
                    <button
                      type="button"
                      onClick={() => update(f.id, { status: 'validated' })}
                      className="mt-3 w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 transition hover:bg-emerald-500/20"
                    >
                      Passou nos 4 testes → marcar como “Validada para Escala”
                    </button>
                  )}

                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_200px]">
                    <Textarea value={f.notes} onChange={(e) => update(f.id, { notes: e.target.value })} placeholder="Notas: retenção, comentários relevantes, ajustes…" className="text-xs" />
                    <Field label="Status">
                      <Select
                        value={f.status}
                        onChange={(e) => update(f.id, { status: e.target.value })}
                        options={Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }))}
                      />
                    </Field>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

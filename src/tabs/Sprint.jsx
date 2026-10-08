import { useMemo, useState } from 'react'
import { useLocalStorage, patch, uid } from '../hooks/useLocalStorage'
import { sprintDefaults, formulasDefaults, offerDefaults } from '../data/defaults'
import { formulaLabel, STATUS } from './Formulas'
import {
  Card, Field, Input, Select, Button, Badge, Progress, Stat, EmptyState,
  IconCalendar, IconPlus, IconTrash, IconLink, IconBox,
} from '../components/ui'

// Fase 1: semanas 1–8 (dias 1–56 + folga até o dia 60). Meta: 3 + 5 + 6×7 = 50.
const WEEK_TARGETS = [3, 5, 7, 7, 7, 7, 7, 7]
const DAY_MS = 86400000

const parseDate = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const dayIndex = (start, date) => Math.floor((parseDate(date) - parseDate(start)) / DAY_MS) + 1
const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const fmtDate = (s) => parseDate(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
const addDays = (s, n) => {
  const d = parseDate(s)
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function Sprint() {
  const [state, setState] = useLocalStorage('sprint', sprintDefaults)
  const [formulas] = useLocalStorage('formulas', formulasDefaults)
  const [offer] = useLocalStorage('offer', offerDefaults)
  const set = patch(setState)

  const emptyForm = () => ({ date: todayStr(), title: '', formulaId: formulas[0]?.id ?? '', link: '', leads: 0 })
  const [form, setForm] = useState(emptyForm)

  const today = dayIndex(state.startDate, todayStr())
  const validated = formulas.filter((f) => f.status === 'validated')
  const formulaById = Object.fromEntries(formulas.map((f) => [f.id, f]))

  const stats = useMemo(() => {
    const perWeek = Array(13).fill(0)
    let phase1 = 0
    let phase2 = 0
    let leads = 0
    const leadsByFormula = {}
    state.posts.forEach((p) => {
      const d = dayIndex(state.startDate, p.date)
      if (d >= 1 && d <= 90) perWeek[Math.min(12, Math.floor((d - 1) / 7))]++
      if (d >= 1 && d <= 60) phase1++
      else if (d >= 61 && d <= 90) phase2++
      leads += Number(p.leads) || 0
      const key = p.formulaId || '_none'
      leadsByFormula[key] = leadsByFormula[key] || { posts: 0, leads: 0 }
      leadsByFormula[key].posts++
      leadsByFormula[key].leads += Number(p.leads) || 0
    })
    return { perWeek, phase1, phase2, leads, leadsByFormula }
  }, [state.posts, state.startDate])

  const total = state.posts.length
  const sorted = [...state.posts].sort((a, b) => b.date.localeCompare(a.date))

  const addPost = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    set('posts', [...state.posts, { id: uid(), ...form, title: form.title.trim(), leads: Number(form.leads) || 0 }])
    setForm({ ...emptyForm(), date: form.date, formulaId: form.formulaId })
  }

  const updatePost = (id, changes) => set('posts', state.posts.map((p) => (p.id === id ? { ...p, ...changes } : p)))

  const ranking = Object.entries(stats.leadsByFormula)
    .map(([id, v]) => ({ id, ...v, label: formulaById[id] ? formulaLabel(formulaById[id]) : 'Sem fórmula' }))
    .sort((a, b) => b.leads - a.leads)

  return (
    <div className="grid gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Dia do sprint" value={today < 1 ? '—' : today > 90 ? 'Fim' : `${today}/90`} hint={today < 1 ? `Começa em ${fmtDate(state.startDate)}` : today <= 60 ? 'Fase 1 · Volume & Testes' : today <= 90 ? 'Fase 2 · Escala & Conversão' : 'Sprint encerrado'} />
        <Stat label="Publicações" value={`${total}/${state.goal}`} hint={`${Math.round((total / state.goal) * 100) || 0}% da meta`} accent />
        <Stat label="Leads / DMs" value={stats.leads} hint={total ? `${(stats.leads / total).toFixed(1)} por post` : 'Sem posts ainda'} />
        <Stat label="Fórmulas validadas" value={`${validated.length}/3`} hint={validated.length >= 3 ? 'Pronto para a Fase 2' : 'Meta para a Fase 2'} />
      </div>

      {/* Progresso geral */}
      <Card>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-zinc-100">Progresso geral</div>
            <div className="text-xs text-zinc-500">{total} de {state.goal} vídeos publicados</div>
          </div>
          <span className="font-mono text-3xl font-semibold text-emerald-300">{Math.min(100, Math.round((total / state.goal) * 100)) || 0}%</span>
        </div>
        <Progress value={total} max={state.goal} className="h-3" />
        <div className="mt-2 flex justify-between font-mono text-[10px] text-zinc-600">
          <span>0</span><span>{Math.round(state.goal / 2)}</span><span>{state.goal}</span>
        </div>
      </Card>

      {/* Timeline */}
      <Card
        title="Linha do Tempo · 90 Dias"
        icon={<IconCalendar />}
        subtitle="Fase 1 constrói volume e dados. Fase 2 aperta o funil só com o que já provou que converte."
        actions={
          <div className="flex items-end gap-2">
            <Field label="Início">
              <Input type="date" value={state.startDate} onChange={(e) => e.target.value && set('startDate', e.target.value)} className="h-8 py-1 text-xs" />
            </Field>
            <Field label="Meta">
              <Input type="number" min="1" value={state.goal} onChange={(e) => set('goal', Math.max(1, Number(e.target.value) || 1))} className="h-8 w-20 py-1 text-xs" />
            </Field>
          </div>
        }
      >
        {/* Barra dos 90 dias */}
        <div className="relative mb-6">
          <div className="flex h-10 overflow-hidden rounded-xl border border-zinc-800 text-[11px] font-medium">
            <div className="flex items-center justify-center bg-emerald-500/15 text-emerald-200" style={{ width: `${(60 / 90) * 100}%` }}>
              Fase 1 · Dias 1–60
            </div>
            <div className="flex items-center justify-center border-l border-zinc-800 bg-cyan-500/15 text-cyan-200" style={{ width: `${(30 / 90) * 100}%` }}>
              Fase 2 · 61–90
            </div>
          </div>
          {today >= 1 && today <= 90 && (
            <div className="absolute -bottom-2 top-[-6px] w-0.5 bg-zinc-100 shadow-[0_0_8px_rgba(255,255,255,0.6)]" style={{ left: `${((today - 0.5) / 90) * 100}%` }}>
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-900">
                Hoje · D{today}
              </span>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Fase 1 semanas */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-100">Fase 1 — Volume & Testes</span>
              <Badge tone="emerald">{stats.phase1}/50 posts</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {WEEK_TARGETS.map((target, i) => {
                const done = stats.perWeek[i]
                const current = today >= i * 7 + 1 && today <= i * 7 + 7
                const hit = done >= target
                return (
                  <div
                    key={i}
                    className={`rounded-xl border p-3 transition ${
                      current ? 'border-emerald-500/50 bg-emerald-500/[0.06]' : hit ? 'border-emerald-500/20 bg-zinc-950/40' : 'border-zinc-800 bg-zinc-950/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-zinc-400">S{i + 1}</span>
                      {hit && <span className="text-xs text-emerald-400">✓</span>}
                    </div>
                    <div className="mt-1 font-mono text-lg font-semibold text-zinc-100">
                      {done}<span className="text-sm text-zinc-500">/{target}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-zinc-600">{addDays(state.startDate, i * 7)} – {addDays(state.startDate, i * 7 + 6)}</div>
                    <div className="mt-2 flex gap-0.5">
                      {Array.from({ length: target }).map((_, j) => (
                        <span key={j} className={`h-1 flex-1 rounded-full ${j < done ? 'bg-emerald-400' : 'bg-zinc-800'}`} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="mt-2 text-[11px] text-zinc-600">Semana 1: 3 · Semana 2: 5 · Semanas 3–8: 7/semana · Dias 57–60 são folga para recuperar atrasos.</p>
          </div>

          {/* Fase 2 */}
          <div className="flex flex-col rounded-xl border border-cyan-500/20 bg-cyan-500/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-100">Fase 2 — Escala & Conversão</span>
              <Badge tone="cyan">{stats.phase2} posts</Badge>
            </div>
            <p className="text-xs text-zinc-400">Apenas as 3 fórmulas validadas, todas direcionando para a Oferta Core.</p>
            <ol className="mt-3 grid gap-2">
              {[0, 1, 2].map((i) => {
                const f = validated[i]
                return (
                  <li key={i} className={`flex items-start gap-2 rounded-lg border p-2.5 text-xs ${f ? 'border-cyan-500/30 bg-zinc-950/60 text-zinc-200' : 'border-dashed border-zinc-800 text-zinc-600'}`}>
                    <span className="font-mono text-cyan-400">{i + 1}.</span>
                    {f ? formulaLabel(f) : 'Slot vazio — valide uma fórmula na aba Fórmulas'}
                  </li>
                )
              })}
            </ol>
            {validated.length > 3 && <p className="mt-2 text-[11px] text-amber-300/80">Você tem {validated.length} validadas — escolha as 3 melhores e descarte o resto.</p>}
            <div className="mt-auto flex items-center gap-2 border-t border-zinc-800 pt-3 text-xs text-zinc-400">
              <IconBox className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span className="truncate">→ {offer.name}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Rastreador */}
      <Card title="Rastreador de Publicações" icon={<IconLink />} subtitle="Registre cada post em 10 segundos. Os dados alimentam a validação das fórmulas.">
        <form onSubmit={addPost} className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 md:grid-cols-12 md:items-end">
          <Field label="Data" className="md:col-span-2">
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </Field>
          <Field label="Título / Tema" className="md:col-span-3">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Caso SLU: o protótipo que ninguém codou" required />
          </Field>
          <Field label="Fórmula" className="md:col-span-3">
            <Select
              value={form.formulaId}
              onChange={(e) => setForm({ ...form, formulaId: e.target.value })}
              options={[{ value: '', label: '— Sem fórmula —' }, ...formulas.map((f) => ({ value: f.id, label: `${formulaLabel(f)}${f.status === 'discarded' ? ' (descartada)' : ''}` }))]}
            />
          </Field>
          <Field label="Link" className="md:col-span-2">
            <Input type="url" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://…" />
          </Field>
          <Field label="Leads/DMs" className="md:col-span-1">
            <Input type="number" min="0" value={form.leads} onChange={(e) => setForm({ ...form, leads: e.target.value })} />
          </Field>
          <div className="md:col-span-1">
            <Button type="submit" variant="primary" className="w-full justify-center"><IconPlus className="h-4 w-4" /><span className="md:sr-only">Registrar</span></Button>
          </div>
        </form>

        <div className="mt-5 grid gap-6 xl:grid-cols-[1fr_300px]">
          {sorted.length === 0 ? (
            <EmptyState>Nenhuma publicação registrada. O primeiro vídeo é o mais difícil — registre-o aqui.</EmptyState>
          ) : (
            <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-[11px] uppercase tracking-wider text-zinc-500">
                    <th className="pb-2 font-medium">Data</th>
                    <th className="pb-2 font-medium">Título</th>
                    <th className="pb-2 font-medium">Fórmula</th>
                    <th className="pb-2 text-center font-medium">Leads</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((p) => {
                    const f = formulaById[p.formulaId]
                    const d = dayIndex(state.startDate, p.date)
                    return (
                      <tr key={p.id} className="border-b border-zinc-800/60 align-middle">
                        <td className="py-2.5 pr-3">
                          <div className="font-mono text-xs text-zinc-300">{fmtDate(p.date)}</div>
                          <div className="font-mono text-[10px] text-zinc-600">{d >= 1 && d <= 90 ? `D${d} · F${d <= 60 ? 1 : 2}` : 'fora do sprint'}</div>
                        </td>
                        <td className="max-w-[220px] py-2.5 pr-3">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-zinc-200" title={p.title}>{p.title}</span>
                            {p.link && (
                              <a href={p.link} target="_blank" rel="noreferrer" className="shrink-0 text-cyan-400 hover:text-cyan-300" aria-label="Abrir post">
                                <IconLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="max-w-[240px] py-2.5 pr-3">
                          {f ? (
                            <div className="flex items-center gap-1.5">
                              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${f.status === 'validated' ? 'bg-emerald-400' : f.status === 'discarded' ? 'bg-rose-400' : 'bg-amber-400'}`} title={STATUS[f.status].label} />
                              <span className="truncate text-xs text-zinc-400" title={formulaLabel(f)}>{formulaLabel(f)}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            <button type="button" className="h-6 w-6 rounded text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200" onClick={() => updatePost(p.id, { leads: Math.max(0, (Number(p.leads) || 0) - 1) })} aria-label="Menos um lead">−</button>
                            <span className="w-6 text-center font-mono text-sm text-emerald-300">{p.leads}</span>
                            <button type="button" className="h-6 w-6 rounded text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200" onClick={() => updatePost(p.id, { leads: (Number(p.leads) || 0) + 1 })} aria-label="Mais um lead">+</button>
                          </div>
                        </td>
                        <td className="py-2.5 text-right">
                          <Button variant="danger" size="icon" aria-label="Excluir" onClick={() => set('posts', state.posts.filter((x) => x.id !== p.id))}>
                            <IconTrash className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <div className="label">Leads por fórmula</div>
            {ranking.length === 0 ? (
              <p className="text-xs text-zinc-600">Sem dados ainda.</p>
            ) : (
              <ul className="grid gap-3">
                {ranking.map((r) => (
                  <li key={r.id} className="min-w-0">
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="truncate text-zinc-300" title={r.label}>{r.label}</span>
                      <span className="shrink-0 font-mono text-zinc-400">{r.leads} · {r.posts}p</span>
                    </div>
                    <Progress value={r.leads} max={Math.max(1, ranking[0].leads)} className="mt-1 h-1.5" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

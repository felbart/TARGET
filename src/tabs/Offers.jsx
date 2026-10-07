import { useState } from 'react'
import { useLocalStorage, patch, uid } from '../hooks/useLocalStorage'
import { offerDefaults } from '../data/defaults'
import {
  Card, Field, Input, Textarea, Select, Button, Badge, CopyButton, Stat, EmptyState,
  IconBox, IconTrash, IconPlus, IconLink, IconSpark,
} from '../components/ui'

const fmtMoney = (n, currency) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(n) || 0)
const fmtInt = (n) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(n)

const CTA_TEMPLATES = [
  (k) => `Comente ${k} para receber o template do Design Token.`,
  () => 'Link na bio para auditar o Design System do seu app.',
  (k) => `Comente ${k} que eu te mando o checklist de handoff Figma → Next.js.`,
  () => 'Quer esse setup no seu produto? Diagnóstico gratuito no link da bio.',
  (k) => `Digite ${k} e receba o repositório base com Tailwind + Radix configurados.`,
  () => 'Salva esse vídeo e manda pro dev do seu time.',
]

export default function Offers() {
  const [state, setState] = useLocalStorage('offer', offerDefaults)
  const set = patch(setState)
  const [newDel, setNewDel] = useState('')
  const [customCta, setCustomCta] = useState('')

  const updateDel = (id, field, val) =>
    set('deliverables', state.deliverables.map((d) => (d.id === id ? { ...d, [field]: val } : d)))

  const addDel = () => {
    if (!newDel.trim()) return
    set('deliverables', [...state.deliverables, { id: uid(), title: newDel.trim(), detail: '' }])
    setNewDel('')
  }

  const addCta = (text) => {
    if (!text.trim() || state.ctas.some((c) => c.text === text)) return
    set('ctas', [...state.ctas, { id: uid(), text: text.trim() }])
  }

  const keyword = (state.ctaKeyword || 'PALAVRA').toUpperCase()
  const { views, ctr, bookingRate, closeRate } = state.funnel
  const clicks = views * (ctr / 100)
  const calls = clicks * (bookingRate / 100)
  const clients = calls * (closeRate / 100)
  const ticket = state.pricingModel === 'fixed' ? state.price : state.weeklyPrice * state.sprintWeeks
  const revenue = Math.floor(clients) * ticket
  const setFunnel = (k, v) => set('funnel', { ...state.funnel, [k]: Math.max(0, Number(v) || 0) })

  const steps = [
    { label: 'Visualizações', value: views, pct: 100 },
    { label: 'Cliques no link', value: clicks, pct: views ? (clicks / views) * 100 : 0 },
    { label: 'Diagnósticos agendados', value: calls, pct: views ? (calls / views) * 100 : 0 },
    { label: 'Clientes fechados', value: clients, pct: views ? (clients / views) * 100 : 0 },
  ]

  return (
    <div className="grid gap-6">
      {/* 1. Oferta core */}
      <Card title="Construtor de Oferta Core" icon={<IconBox />} subtitle="Uma oferta, um resultado claro, um prazo. Tudo que o conteúdo empurra converge aqui.">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="grid content-start gap-4">
            <Field label="Nome da oferta">
              <Input value={state.name} onChange={(e) => set('name', e.target.value)} className="text-base font-medium" />
            </Field>
            <Field label="Promessa / resultado">
              <Textarea value={state.promise} onChange={(e) => set('promise', e.target.value)} />
            </Field>

            <div>
              <div className="label">Entregáveis</div>
              <ol className="grid gap-2">
                {state.deliverables.map((d, i) => (
                  <li key={d.id} className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
                    <span className="mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 font-mono text-xs text-emerald-300">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="grid flex-1 gap-1.5">
                      <Input value={d.title} onChange={(e) => updateDel(d.id, 'title', e.target.value)} className="font-medium" />
                      <Input value={d.detail} onChange={(e) => updateDel(d.id, 'detail', e.target.value)} placeholder="Detalhe (opcional)" className="text-xs text-zinc-400" />
                    </div>
                    <Button variant="danger" size="icon" aria-label="Remover" onClick={() => set('deliverables', state.deliverables.filter((x) => x.id !== d.id))}>
                      <IconTrash className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ol>
              <div className="mt-2 flex gap-2">
                <Input value={newDel} onChange={(e) => setNewDel(e.target.value)} placeholder="Novo entregável…" onKeyDown={(e) => e.key === 'Enter' && addDel()} />
                <Button onClick={addDel}><IconPlus className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>

          <div className="grid content-start gap-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
              <div className="label">Modelo de cobrança</div>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-zinc-900 p-1">
                {[
                  ['fixed', 'Fixo por projeto'],
                  ['weekly', 'Sprint semanal'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => set('pricingModel', id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                      state.pricingModel === id ? 'bg-zinc-700 text-zinc-50 shadow' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid gap-3">
                <Field label="Moeda">
                  <Select value={state.currency} onChange={(e) => set('currency', e.target.value)} options={['BRL', 'USD', 'EUR']} />
                </Field>
                {state.pricingModel === 'fixed' ? (
                  <Field label="Preço do projeto">
                    <Input type="number" min="0" step="500" value={state.price} onChange={(e) => set('price', Number(e.target.value))} />
                  </Field>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Valor / semana">
                      <Input type="number" min="0" step="250" value={state.weeklyPrice} onChange={(e) => set('weeklyPrice', Number(e.target.value))} />
                    </Field>
                    <Field label="Nº de semanas">
                      <Input type="number" min="1" value={state.sprintWeeks} onChange={(e) => set('sprintWeeks', Math.max(1, Number(e.target.value)))} />
                    </Field>
                  </div>
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-emerald-500/[0.07] to-zinc-950 p-5">
              <Badge tone="emerald">Oferta Core</Badge>
              <h4 className="mt-3 text-base font-semibold leading-snug text-zinc-50">{state.name || 'Sem nome'}</h4>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{state.promise}</p>
              <ul className="mt-4 grid gap-1.5">
                {state.deliverables.map((d) => (
                  <li key={d.id} className="flex gap-2 text-xs text-zinc-300">
                    <span className="text-emerald-400">✓</span>
                    {d.title}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-end justify-between border-t border-zinc-800 pt-4">
                <div>
                  <div className="font-mono text-2xl font-semibold text-zinc-50">{fmtMoney(ticket, state.currency)}</div>
                  <div className="text-[11px] text-zinc-500">
                    {state.pricingModel === 'fixed'
                      ? 'valor fixo por projeto'
                      : `${fmtMoney(state.weeklyPrice, state.currency)}/semana × ${state.sprintWeeks}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. CTAs */}
      <Card title="Lead Magnet & CTAs" icon={<IconLink />} subtitle="Feche cada vídeo com um próximo passo único que leva para a oferta.">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="grid content-start gap-4">
            <Field label="Palavra-chave do lead magnet" hint="Usada nos templates com [PALAVRA-CHAVE].">
              <Input
                value={state.ctaKeyword}
                onChange={(e) => set('ctaKeyword', e.target.value.toUpperCase().replace(/\s+/g, ''))}
                className="font-mono uppercase tracking-wider"
              />
            </Field>
            <div>
              <div className="label">Gerador rápido · clique para salvar</div>
              <div className="grid gap-2">
                {CTA_TEMPLATES.map((tpl, i) => {
                  const text = tpl(keyword)
                  const saved = state.ctas.some((c) => c.text === text)
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={saved}
                      onClick={() => addCta(text)}
                      className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-left text-sm text-zinc-300 transition hover:border-emerald-500/40 hover:text-zinc-100 disabled:cursor-default disabled:opacity-50 disabled:hover:border-zinc-800"
                    >
                      <span>{text}</span>
                      <span className="shrink-0 text-emerald-400">{saved ? '✓' : <IconPlus className="h-3.5 w-3.5" />}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <Input value={customCta} onChange={(e) => setCustomCta(e.target.value)} placeholder="CTA personalizado…" onKeyDown={(e) => { if (e.key === 'Enter') { addCta(customCta); setCustomCta('') } }} />
              <Button onClick={() => { addCta(customCta); setCustomCta('') }}><IconPlus className="h-4 w-4" /></Button>
            </div>
          </div>

          <div>
            <div className="label">Biblioteca de CTAs salvos ({state.ctas.length})</div>
            {state.ctas.length === 0 ? (
              <EmptyState>Nenhum CTA salvo.</EmptyState>
            ) : (
              <ul className="grid gap-2">
                {state.ctas.map((c) => (
                  <li key={c.id} className="group flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-2 pl-3">
                    <IconSpark className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                    <input
                      value={c.text}
                      onChange={(e) => set('ctas', state.ctas.map((x) => (x.id === c.id ? { ...x, text: e.target.value } : x)))}
                      className="min-w-0 flex-1 bg-transparent text-sm text-zinc-200 outline-none"
                    />
                    <CopyButton text={c.text} size="icon" variant="ghost" label="Copiar CTA" />
                    <Button variant="danger" size="icon" aria-label="Remover" onClick={() => set('ctas', state.ctas.filter((x) => x.id !== c.id))}>
                      <IconTrash className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>

      {/* 3. Calculadora */}
      <Card title="Calculadora de Conversão" icon={<IconSpark />} subtitle="Engenharia reversa do funil: quantas views você precisa para fechar contratos?">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <div className="grid content-start gap-4">
            <Field label="Meta de visualizações">
              <Input type="number" min="0" step="1000" value={views} onChange={(e) => setFunnel('views', e.target.value)} />
            </Field>
            {[
              ['ctr', 'CTR para o link (%)', 'Views → cliques'],
              ['bookingRate', 'Taxa de agendamento (%)', 'Cliques → diagnósticos'],
              ['closeRate', 'Taxa de fechamento (%)', 'Diagnósticos → clientes'],
            ].map(([k, label, hint]) => (
              <Field key={k} label={label} hint={hint}>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max={k === 'ctr' ? 10 : 100}
                    step={k === 'ctr' ? 0.1 : 1}
                    value={state.funnel[k]}
                    onChange={(e) => setFunnel(k, e.target.value)}
                    className="flex-1 accent-emerald-500"
                  />
                  <Input type="number" min="0" step="0.1" value={state.funnel[k]} onChange={(e) => setFunnel(k, e.target.value)} className="w-20 text-right font-mono" />
                </div>
              </Field>
            ))}
          </div>

          <div className="grid content-start gap-4">
            <div className="grid gap-2">
              {steps.map((s, i) => (
                <div key={s.label} className="relative">
                  <div
                    className="mx-auto rounded-lg border border-emerald-500/20 bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 px-4 py-3 transition-all"
                    style={{ width: `${100 - i * 14}%` }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-zinc-300">{s.label}</span>
                      <span className="font-mono text-sm font-semibold text-zinc-50">{fmtInt(s.value)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Clientes fechados" value={Math.floor(clients)} hint={`${fmtInt(clients)} projetado`} accent />
              <Stat label="Receita projetada" value={fmtMoney(revenue, state.currency)} hint={`ticket ${fmtMoney(ticket, state.currency)}`} />
            </div>
            {clients < 1 && (
              <p className="text-xs text-amber-300/80">
                Abaixo de 1 cliente. Para fechar 1, você precisa de ~{fmtInt(clients > 0 ? Math.ceil(views / clients) : 0)} views com essas taxas.
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

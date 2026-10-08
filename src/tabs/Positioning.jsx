import { useLocalStorage, patch, uid } from '../hooks/useLocalStorage'
import { positioningDefaults } from '../data/defaults'
import {
  Card, Field, Input, Textarea, Checkbox, Badge, Button, CopyButton, EmptyState,
  IconTarget, IconShield, IconAlert, IconCheck, IconTrash, IconSpark,
} from '../components/ui'

const MODES = [
  {
    id: 'mass',
    title: 'Mass Awareness',
    desc: 'Alcance amplo, temas genéricos, público frio. Bom para crescer números — ruim para fechar projetos de ticket alto.',
    stats: ['Alcance ↑↑', 'Conversão ↓', 'Viewer drift alto'],
  },
  {
    id: 'targeted',
    title: 'Targeted Category Authority',
    desc: 'Autoridade de nicho: menos views, mas cada view é de quem decide e contrata. O modo certo para vender identidade visual e sites.',
    stats: ['Alcance ~', 'Conversão ↑↑', 'Ticket alto'],
    recommended: true,
  },
]

export function buildStatement({ avatar, problem, solution }) {
  const a = avatar?.trim() || '[avatar]'
  const p = problem?.trim() || '[problema]'
  const s = solution?.trim() || '[solução]'
  const pLower = p.charAt(0).toLowerCase() + p.slice(1)
  return `Eu ajudo ${a.charAt(0).toLowerCase() + a.slice(1)} a ${pLower} por meio de ${s.charAt(0).toLowerCase() + s.slice(1)}.`
}

export default function Positioning() {
  const [state, setState] = useLocalStorage('positioning', positioningDefaults)
  const set = patch(setState)
  const statement = buildStatement(state)

  const gateTouched = state.gateTopic.trim().length > 0
  const gatePass = state.gateDecider && state.gateAuthority

  const logTopic = () => {
    if (!gateTouched) return
    set('gateLog', [
      { id: uid(), topic: state.gateTopic.trim(), pass: gatePass, at: new Date().toISOString() },
      ...state.gateLog,
    ].slice(0, 30))
    setState((prev) => ({ ...prev, gateTopic: '', gateDecider: false, gateAuthority: false }))
  }

  return (
    <div className="grid gap-6">
      {/* 1. Modo */}
      <Card
        title="Seletor de Modo"
        icon={<IconTarget />}
        subtitle="Kallaway Engine: escolha a estratégia antes de escolher a pauta."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {MODES.map((m) => {
            const active = state.mode === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => set('mode', m.id)}
                className={`relative rounded-xl border p-4 text-left transition ${
                  active
                    ? 'border-emerald-500/50 bg-emerald-500/[0.06] ring-1 ring-emerald-500/20'
                    : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-medium text-zinc-100">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                        active ? 'border-emerald-400 bg-emerald-500' : 'border-zinc-600'
                      }`}
                    >
                      {active && <span className="h-1.5 w-1.5 rounded-full bg-zinc-950" />}
                    </span>
                    {m.title}
                  </span>
                  {m.recommended && <Badge tone="emerald">Recomendado p/ marca + site</Badge>}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">{m.desc}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.stats.map((s) => (
                    <span key={s} className="rounded-md bg-zinc-800/70 px-2 py-0.5 font-mono text-[11px] text-zinc-400">
                      {s}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
        {state.mode === 'mass' && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.07] p-3 text-xs text-amber-200">
            <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
            Para serviços de identidade visual e sites, Mass Awareness tende a atrair outros designers e curiosos, que
            não contratam. Use apenas como experimento pontual.
          </div>
        )}
      </Card>

      {/* 2. Statement */}
      <Card
        title="Target Authority Statement"
        icon={<IconSpark />}
        subtitle="Avatar + Problema + Solução = a frase que filtra quem fica e quem sai."
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <div className="grid gap-4">
            <Field label="Avatar (quem)">
              <Input value={state.avatar} onChange={(e) => set('avatar', e.target.value)} placeholder="Profissionais liberais e empresas médias sem time de design" />
            </Field>
            <Field label="Problema (dor)">
              <Textarea value={state.problem} onChange={(e) => set('problem', e.target.value)} placeholder="Parecer o tamanho que já têm" />
            </Field>
            <Field label="Solução (mecanismo)">
              <Textarea value={state.solution} onChange={(e) => set('solution', e.target.value)} placeholder="Identidade visual e site como uma decisão só" />
            </Field>
          </div>

          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.08] via-zinc-950 to-cyan-500/[0.06] p-6">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
            <div>
              <span className="font-mono text-[11px] uppercase tracking-widest text-emerald-400/80">// authority.statement</span>
              <p className="mt-4 text-lg font-medium leading-relaxed text-zinc-50 sm:text-xl">“{statement}”</p>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                <Badge tone="emerald">Avatar</Badge>
                <Badge tone="cyan">Problema</Badge>
                <Badge tone="zinc">Solução</Badge>
              </div>
              <CopyButton text={statement} label="Copiar frase" variant="primary" />
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Gatekeeper */}
      <Card
        title="Viewer Drift Gatekeeper"
        icon={<IconShield />}
        subtitle="Antes de gravar: a pauta atrai quem contrata ou só quem curte?"
      >
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="grid content-start gap-3">
            <Field label="Tema pretendido">
              <Input
                value={state.gateTopic}
                onChange={(e) => set('gateTopic', e.target.value)}
                placeholder="Ex: O site que carrega, é bonito e não decide nada"
                onKeyDown={(e) => e.key === 'Enter' && logTopic()}
              />
            </Field>
            <Checkbox checked={state.gateDecider} onChange={(v) => set('gateDecider', v)}>
              Esse tema interessa diretamente a quem <strong className="text-zinc-100">contrata: donos de negócio e decisores</strong>?
            </Checkbox>
            <Checkbox checked={state.gateAuthority} onChange={(v) => set('gateAuthority', v)}>
              Ele mostra <strong className="text-zinc-100">raciocínio aplicado</strong> (critério, decisão, caso próprio) ou é só estética e dica genérica?
            </Checkbox>

            {gateTouched &&
              (gatePass ? (
                <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.08] p-3 text-sm text-emerald-200">
                  <IconCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <span><strong>Pauta aprovada.</strong> Alinhada ao avatar e com prova técnica — pode ir para produção.</span>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/[0.08] p-3 text-sm text-rose-200">
                  <IconAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <span><strong>Risco de Viewer Drift:</strong> descartar ou reformular.</span>
                </div>
              ))}

            <div>
              <Button variant="secondary" onClick={logTopic} disabled={!gateTouched}>
                Registrar no histórico
              </Button>
            </div>
          </div>

          <div>
            <div className="label">Histórico de pautas avaliadas</div>
            {state.gateLog.length === 0 ? (
              <EmptyState>Nenhuma pauta registrada ainda.</EmptyState>
            ) : (
              <ul className="grid max-h-80 gap-2 overflow-y-auto pr-1">
                {state.gateLog.map((g) => (
                  <li key={g.id} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${g.pass ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    <span className="min-w-0 flex-1 truncate text-sm text-zinc-300" title={g.topic}>{g.topic}</span>
                    <Badge tone={g.pass ? 'emerald' : 'rose'}>{g.pass ? 'Aprovada' : 'Drift'}</Badge>
                    <Button
                      variant="danger"
                      size="icon"
                      aria-label="Remover"
                      onClick={() => set('gateLog', state.gateLog.filter((x) => x.id !== g.id))}
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </Button>
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

import { useRef } from 'react'
import { useLocalStorage, exportAll, importAll, clearAll } from './hooks/useLocalStorage'
import Positioning from './tabs/Positioning'
import Pillars from './tabs/Pillars'
import Offers from './tabs/Offers'
import Formulas from './tabs/Formulas'
import Sprint from './tabs/Sprint'
import {
  Button, IconTarget, IconLayers, IconBox, IconFlask, IconCalendar, IconDownload, IconUpload, IconTrash,
} from './components/ui'

const TABS = [
  { id: 'positioning', label: 'Posicionamento', short: 'Posição', icon: IconTarget, title: 'Posicionamento & Filtro de Audiência', kicker: 'Kallaway Engine', Component: Positioning },
  { id: 'pillars', label: 'Pilares & White Space', short: 'Pilares', icon: IconLayers, title: 'Pilares da Marca & Espaço Vazio de Mercado', kicker: 'Brand Pillars', Component: Pillars },
  { id: 'offers', label: 'Ofertas', short: 'Ofertas', icon: IconBox, title: 'Arquiteto de Ofertas', kicker: 'Funil & Conversão', Component: Offers },
  { id: 'formulas', label: 'Fórmulas', short: 'Fórmulas', icon: IconFlask, title: 'Fórmulas de Conteúdo & Validação', kicker: 'Content Lab', Component: Formulas },
  { id: 'sprint', label: 'Sprint 90 Dias', short: 'Sprint', icon: IconCalendar, title: 'Sprint de 90 Dias & Rastreador', kicker: 'Execution', Component: Sprint },
]

export default function App() {
  const [tab, setTab] = useLocalStorage('activeTab', 'positioning')
  const fileRef = useRef(null)
  const current = TABS.find((t) => t.id === tab) ?? TABS[0]
  const { Component } = current

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(exportAll(), null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `brand-to-code-hq-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    file.text().then((txt) => {
      try {
        importAll(JSON.parse(txt))
        window.location.reload()
      } catch {
        alert('Arquivo inválido.')
      }
    })
    e.target.value = ''
  }

  const handleReset = () => {
    if (confirm('Apagar todo o progresso salvo e restaurar os valores padrão?')) {
      clearAll()
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 font-mono text-xs font-bold text-emerald-300">
              {'</>'}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold tracking-tight text-zinc-50">Brand-to-Code HQ</div>
              <div className="truncate text-[11px] text-zinc-500">Marca pessoal · Ofertas · Sprint 90 dias</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleExport} title="Exportar backup JSON">
              <IconDownload className="h-3.5 w-3.5" /><span className="hidden sm:inline">Exportar</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()} title="Importar backup JSON">
              <IconUpload className="h-3.5 w-3.5" /><span className="hidden sm:inline">Importar</span>
            </Button>
            <Button variant="danger" size="sm" onClick={handleReset} title="Resetar dados">
              <IconTrash className="h-3.5 w-3.5" />
            </Button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
          </div>
        </div>

        <nav className="mx-auto max-w-7xl px-2 sm:px-6" aria-label="Seções">
          <div className="-mb-px flex gap-1 overflow-x-auto">
            {TABS.map((t, i) => {
              const active = t.id === current.id
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`group flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm transition ${
                    active
                      ? 'border-emerald-400 text-zinc-50'
                      : 'border-transparent text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  <span className={`font-mono text-[10px] ${active ? 'text-emerald-400' : 'text-zinc-600'}`}>0{i + 1}</span>
                  <Icon className={`h-4 w-4 ${active ? 'text-emerald-400' : ''}`} />
                  <span className="hidden md:inline">{t.label}</span>
                  <span className="md:hidden">{t.short}</span>
                </button>
              )
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-400/80">{current.kicker}</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">{current.title}</h1>
        </div>
        <Component key={current.id} />
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-10 pt-4 text-center text-[11px] text-zinc-600 sm:px-6">
        Todos os dados ficam salvos apenas neste navegador (localStorage). Use “Exportar” para backup.
      </footer>
    </div>
  )
}

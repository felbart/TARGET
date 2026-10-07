// Valores iniciais de cada módulo. Tudo é editável na UI e persistido no localStorage.

export const positioningDefaults = {
  mode: 'targeted',
  avatar: 'Fundadores técnicos e times de produto',
  problem: 'Eliminar a perda de fidelidade entre Figma e produção',
  solution: 'Arquitetura de Design Systems e componentes em Next.js/Tailwind',
  gateTopic: '',
  gateDecider: false,
  gateAuthority: false,
  gateLog: [],
}

export const pillarsDefaults = {
  bullseye: [
    'Design Engineering & Integração Figma → Next.js / Tailwind',
    'UI/UX & Prototipagem Funcional para Startups e Produtos Digitais',
    'Web Design & Frontend Geral',
    'Design Gráfico tradicional',
  ],
  beliefs: [
    {
      id: 'b1',
      market: 'Designer não precisa saber nada de código.',
      thesis: 'Designer que domina a lógica de componentes cria produtos 10x mais viáveis e de valor superior.',
    },
    {
      id: 'b2',
      market: 'Design System é biblioteca de componentes no Figma.',
      thesis: 'Design System só existe quando é código vivo sincronizado com tokens.',
    },
  ],
  keywords: ['Brand-to-Code', 'Design Engineering', 'Tokens Vivos'],
  setup: [
    { id: 's1', label: 'Layout tela dividida: Figma ao lado do VS Code com hot reload', done: true },
    { id: 's2', label: 'Roupas neutras (sem estampas, paleta escura)', done: true },
    { id: 's3', label: 'Iluminação de contraste alto (key light lateral + fundo escuro)', done: false },
  ],
  matrix: [
    {
      dim: 'Tópico',
      common: 'Dicas soltas de Figma, plugins e atalhos',
      mine: 'Pipeline Figma → tokens → componentes em produção',
    },
    {
      dim: 'Profundidade',
      common: 'Superficial, focado em estética de Dribbble',
      mine: 'Arquitetura real: variantes, props, tokens semânticos, a11y',
    },
    {
      dim: 'Avatar',
      common: 'Designers iniciantes buscando o primeiro emprego',
      mine: 'Founders técnicos, PMs e tech leads que contratam',
    },
    {
      dim: 'Formato',
      common: 'Talking head genérico ou carrossel de inspiração',
      mine: 'Antes x Depois com código, live coding de 60s, breakdowns',
    },
    {
      dim: 'Visual',
      common: 'Tela do Figma estática, sem prova de execução',
      mine: 'Split screen Figma + browser com hot reload ao vivo',
    },
  ],
}

export const offerDefaults = {
  name: 'Brand-to-Code Sprint: Setup de Design System em 14 dias',
  promise: 'Do Figma à produção sem perda de fidelidade — tokens, componentes e documentação prontos para o time escalar.',
  deliverables: [
    { id: 'd1', title: 'Mapeamento de Tokens & Estilos no Figma', detail: 'Cores, tipografia, espaçamento e raios como variáveis semânticas.' },
    { id: 'd2', title: 'Repositório base com Tailwind CSS, Radix UI e Next.js configurados', detail: 'Tokens sincronizados no tailwind.config e primitives acessíveis.' },
    { id: 'd3', title: 'Documentação e guia de handoff com WCAG acessível', detail: 'Contraste, foco, navegação por teclado e regras de uso.' },
  ],
  pricingModel: 'fixed',
  price: 18000,
  weeklyPrice: 6500,
  sprintWeeks: 2,
  currency: 'BRL',
  ctaKeyword: 'TOKEN',
  ctas: [
    { id: 'c1', text: 'Comente TOKEN para receber o template do Design Token.' },
    { id: 'c2', text: 'Link na bio para auditar o Design System do seu app.' },
  ],
  funnel: { views: 100000, ctr: 1.5, bookingRate: 8, closeRate: 25 },
}

export const formulaOptions = {
  topics: ['Tokens no Tailwind', 'Animações com Motion', 'Acessibilidade na prática', 'Refatoração de tela'],
  formats: ['Antes x Depois', 'Live coding de 60s', 'Análise de erro comum em UI', 'Breakdown de UI famosa'],
  layouts: ['Split Screen (Figma + Browser)', 'Screencast com Facecam', 'Demonstração em primeira pessoa'],
}

export const formulasDefaults = [
  {
    id: 'f1',
    topic: 'Tokens no Tailwind',
    format: 'Antes x Depois',
    layout: 'Split Screen (Figma + Browser)',
    tests: { performance: false, leads: false, sustainability: false, aesthetics: false },
    notes: '',
    status: 'testing',
  },
]

export const sprintDefaults = {
  startDate: (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })(),
  goal: 50,
  posts: [],
}

// Valores iniciais de cada módulo. Tudo é editável na UI e persistido no localStorage.

export const positioningDefaults = {
  mode: 'targeted',
  avatar: 'Profissionais liberais e empresas médias sem time de design',
  problem: 'Parecer o tamanho que já têm, sem marca que morre no PDF nem site genérico que não decide nada',
  solution: 'Identidade visual e site entregues como uma decisão só, da marca até o código',
  gateTopic: '',
  gateDecider: false,
  gateAuthority: false,
  gateLog: [],
}

export const pillarsDefaults = {
  bullseye: [
    'Marca + Site como uma decisão só (da marca até o código)',
    'Critério antes de execução: decisão de design, IA com critério',
    'Carreira, processo e ferramentas para designers',
    'Design genérico: tendência, estética pela estética, peça avulsa',
  ],
  beliefs: [
    {
      id: 'b1',
      market: 'Design bom é design bonito.',
      thesis: 'Design vale pelo que decide, não pelo que entrega. Raciocínio, não só estética.',
    },
    {
      id: 'b2',
      market: 'Marca e site são dois projetos.',
      thesis: 'Identidade visual e site são uma decisão só. Marca que não chega no código morre no PDF.',
    },
    {
      id: 'b3',
      market: 'A IA vai acabar com o design.',
      thesis: 'A IA barateou a execução e encareceu o erro. Decisão sem critério se propaga, e quanto mais longe vai, mais cara fica a volta.',
    },
    {
      id: 'b4',
      market: 'Um site bonito, com seções bem feitas, resolve.',
      thesis: 'Site que não sabe pra quem fala nem sustenta a marca é template, por mais bonito que seja.',
    },
  ],
  keywords: ['Brand to Code', 'Design com raciocínio', 'Da marca ao código', 'Critério antes de execução'],
  setup: [
    { id: 's1', label: 'Você na frente, com ponto de vista (não cabeça falante recitando informação)', done: false },
    { id: 's2', label: 'Antes | Depois: a marca aplicada até o site funcionando', done: false },
    { id: 's3', label: 'Sem lifestyle nem vitrine de criativo: credibilidade, não vitrine', done: false },
    { id: 's4', label: 'Toda tese com um caso próprio por perto', done: false },
  ],
  matrix: [
    {
      dim: 'Tópico',
      common: 'Tendências, inspiração e dicas soltas de ferramenta',
      mine: 'Da marca ao código: identidade que só se prova quando vira site funcionando',
    },
    {
      dim: 'Profundidade',
      common: 'Estética pela estética; o "como fazer" sem o "por quê"',
      mine: 'Critério antes de execução: o que separa escolha justificável de escolha bonita',
    },
    {
      dim: 'Avatar',
      common: 'Designer falando para designers (curtem, mas não contratam)',
      mine: 'Profissionais liberais e empresas médias que cresceram por indicação; designers indicam',
    },
    {
      dim: 'Formato',
      common: 'Portfólio de vitrine e talking head recitando informação',
      mine: 'Cases contados como história (problema, leitura, decisões) e opinião com ponto de vista',
    },
    {
      dim: 'Visual',
      common: 'Lifestyle de criativo e mockups genéricos',
      mine: 'Antes | Depois com a marca aplicada até o site no ar; você na frente, sem performance',
    },
  ],
}

export const offerDefaults = {
  name: 'Marca + Site: identidade visual e site como uma decisão só',
  promise: 'Crio marcas que chegam até o código: marca, interface e site entregues como sistema, não como arquivos soltos que alguém ainda precisa transformar em algo funcional.',
  deliverables: [
    { id: 'd1', title: 'Diagnóstico', detail: 'Para quem a marca fala, o que precisa decidir e o que motivou o projeto.' },
    { id: 'd2', title: 'Território de marca', detail: 'Conceito, posicionamento e tom antes do primeiro traço.' },
    { id: 'd3', title: 'Identidade visual', detail: 'Logo, cores, tipografia e elementos, já pensados para o digital.' },
    { id: 'd4', title: 'Estrutura do site', detail: 'Páginas, conteúdo e o caminho até o contato.' },
    { id: 'd5', title: 'Interface', detail: 'Layout responsivo aplicando a identidade.' },
    { id: 'd6', title: 'Código e publicação', detail: 'Site no ar, com hospedagem configurada.' },
    { id: 'd7', title: 'Entrega com manual de uso', detail: 'Regras de marca e como manter o site.' },
  ],
  satellites: [
    { id: 'o1', title: 'Só marca', detail: 'Identidade visual com kit de aplicação digital, pronta para virar site depois.' },
    { id: 'o2', title: 'Só site', detail: 'Para quem já tem marca; inclui auditoria de coerência da marca existente.' },
    { id: 'o3', title: 'Resgate', detail: 'Redesign do site que existe e não decide nada.' },
  ],
  pricingModel: 'fixed',
  price: 8500,
  weeklyPrice: 2500,
  sprintWeeks: 3,
  currency: 'BRL',
  ctaKeyword: 'MÉTODO',
  ctas: [
    { id: 'c1', text: 'Comente MÉTODO e eu te mando como funciona o processo Marca + Site.' },
    { id: 'c2', text: 'O processo completo, da marca até o código, está no link da bio.' },
  ],
  funnel: { views: 30000, ctr: 1, bookingRate: 5, closeRate: 30 },
}

export const formulaOptions = {
  topics: ['Da marca ao código', 'Critério antes de execução', 'IA e o custo da decisão errada', 'Carreira e reinvenção', 'Bastidores (caso real)'],
  formats: ['Case como narrativa (problema → leitura → decisões)', 'Antes x Depois', 'Crítica com ponto de vista', 'Processo & ferramentas'],
  layouts: ['Você na frente, com ponto de vista', 'Tela dividida (Antes | Depois)', 'Carrossel', 'Screencast com facecam'],
}

export const formulasDefaults = [
  {
    id: 'f1',
    topic: 'Bastidores (caso real)',
    format: 'Case como narrativa (problema → leitura → decisões)',
    layout: 'Você na frente, com ponto de vista',
    tests: { performance: false, leads: false, sustainability: false, aesthetics: false },
    notes: 'Primeira peça: o caso SLU (o protótipo que ficou parado no Figma até ser codado com Keycloak).',
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

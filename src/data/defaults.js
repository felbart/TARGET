// Valores iniciais de cada módulo. Tudo é editável na UI e persistido no localStorage.

export const positioningDefaults = {
  mode: 'targeted',
  avatar: 'Donos de pequenos negócios e profissionais liberais',
  problem: 'Transmitir confiança e atrair mais clientes, em vez de parecer amador na internet',
  solution: 'Uma identidade visual estratégica e um site profissional pensado para gerar contatos',
  gateTopic: '',
  gateDecider: false,
  gateAuthority: false,
  gateLog: [],
}

export const pillarsDefaults = {
  bullseye: [
    'Identidade Visual + Site para negócios de serviço (marca que vende)',
    'Branding estratégico & Landing pages de conversão',
    'Design gráfico & Social media',
    'Peças avulsas e design genérico (flyer, cartão, banner)',
  ],
  beliefs: [
    {
      id: 'b1',
      market: 'Identidade visual é ter um logo bonito.',
      thesis: 'Logo é 10% da marca. Identidade é o sistema que faz o cliente reconhecer e confiar em você em todo ponto de contato.',
    },
    {
      id: 'b2',
      market: 'Site é só um cartão de visitas online.',
      thesis: 'Site que não gera contato é custo. Site bom é um vendedor 24h com objetivo claro e CTA.',
    },
    {
      id: 'b3',
      market: 'Qualquer um faz uma marca no Canva.',
      thesis: 'Canva entrega aparência. Estratégia entrega preço premium.',
    },
  ],
  keywords: ['Marca que Vende', 'Identidade Estratégica', 'Site que Converte'],
  setup: [
    { id: 's1', label: 'Tela dividida Antes | Depois da marca/site do cliente', done: true },
    { id: 's2', label: 'Roupas neutras (sem estampas, paleta escura)', done: true },
    { id: 's3', label: 'Iluminação de contraste alto (key light lateral + fundo escuro)', done: false },
  ],
  matrix: [
    {
      dim: 'Tópico',
      common: 'Logos bonitos e mockups soltos no portfólio',
      mine: 'Marca como ferramenta de vendas: identidade + site que gera contato',
    },
    {
      dim: 'Profundidade',
      common: 'Estética pela estética, sem estratégia',
      mine: 'Diagnóstico de posicionamento, público e concorrência antes do primeiro traço',
    },
    {
      dim: 'Avatar',
      common: 'Outros designers e estudantes (curtem, mas não contratam)',
      mine: 'Donos de negócio e profissionais liberais que precisam vender mais',
    },
    {
      dim: 'Formato',
      common: 'Portfólio estático e carrossel de inspiração',
      mine: 'Antes x Depois de marcas reais, análise de sites de negócios, processo em 60s',
    },
    {
      dim: 'Visual',
      common: 'Mockups genéricos de papelaria',
      mine: 'Marca aplicada no mundo real: fachada, Instagram, site no celular',
    },
  ],
}

export const offerDefaults = {
  name: 'Marca & Site em 21 dias: identidade visual + site profissional',
  promise: 'Do posicionamento ao site no ar: uma marca que transmite confiança e um site pensado para gerar contatos.',
  deliverables: [
    { id: 'd1', title: 'Diagnóstico de marca & posicionamento', detail: 'Público, concorrência, tom de voz e conceito visual.' },
    { id: 'd2', title: 'Identidade visual completa', detail: 'Logo e variações, paleta, tipografia, elementos gráficos e aplicações.' },
    { id: 'd3', title: 'Manual de marca + templates para redes sociais', detail: 'Regras de uso e modelos editáveis para o dia a dia.' },
    { id: 'd4', title: 'Site profissional responsivo', detail: 'Até 5 páginas, pensado para celular, SEO básico e botão de WhatsApp.' },
  ],
  pricingModel: 'fixed',
  price: 7500,
  weeklyPrice: 2500,
  sprintWeeks: 3,
  currency: 'BRL',
  ctaKeyword: 'MARCA',
  ctas: [
    { id: 'c1', text: 'Comente MARCA para receber o checklist de identidade visual.' },
    { id: 'c2', text: 'Link na bio para uma análise gratuita da marca e do site do seu negócio.' },
  ],
  funnel: { views: 100000, ctr: 1.5, bookingRate: 10, closeRate: 30 },
}

export const formulaOptions = {
  topics: ['Redesign de marca', 'Erros de site que espantam clientes', 'Psicologia das cores por segmento', 'Logo vs. identidade visual', 'Site de negócio local'],
  formats: ['Antes x Depois', 'Processo em 60s', 'Análise de marca/site real', 'Mito vs. Verdade'],
  layouts: ['Tela dividida (Antes | Depois)', 'Screencast com Facecam', 'Marca aplicada em mockup real'],
}

export const formulasDefaults = [
  {
    id: 'f1',
    topic: 'Redesign de marca',
    format: 'Antes x Depois',
    layout: 'Tela dividida (Antes | Depois)',
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

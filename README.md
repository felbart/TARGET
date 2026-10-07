# Brand-to-Code HQ

Painel SPA (React + Tailwind, dark mode) de **Gestão de Marca Pessoal e Ofertas** que une o framework de 90 dias do Kallaway à disciplina de Design Engineering (Figma → Next.js).

Todos os dados ficam no `localStorage` (prefixo `b2c-hq:`). Não há backend. O cabeçalho tem **Exportar / Importar** (backup em JSON) e **Resetar**.

## Abas

1. **Posicionamento**: seletor Mass Awareness vs. Targeted Category Authority, construtor do Target Authority Statement (com botão de copiar) e o Viewer Drift Gatekeeper, com histórico de pautas.
2. **Pilares & White Space**: alvo de nicho com 4 anéis editáveis, cofre de crenças contrárias, âncoras de marca, checklist do setup visual e matriz de espaço vazio com 5 dimensões.
3. **Ofertas**: oferta core (entregáveis e preço fixo ou sprint semanal), gerador e biblioteca de CTAs com palavra-chave e calculadora de funil (views → cliques → diagnósticos → clientes → receita).
4. **Fórmulas**: gerador Tópico + Formato + Layout (com opções editáveis e modo aleatório) e cards de validação dos 4 testes, com status Em Teste / Validada / Descartada.
5. **Sprint 90 Dias**: linha do tempo das fases 1 e 2 com o dia atual, metas semanais (3, 5 e depois 7 por semana até somar 50), as 3 fórmulas validadas ligadas à oferta core, o rastreador de publicações, a barra de progresso e o ranking de leads por fórmula.

## Rodar

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # gera dist/ (base relativa, pode ser servido em qualquer pasta estática)
```

## Estrutura

```
src/
  App.jsx                 # layout, navegação, backup
  hooks/useLocalStorage.js
  data/defaults.js        # conteúdo inicial editável
  components/ui.jsx       # Card, Button, Switch, Badge, ícones…
  tabs/                   # uma tela por aba
```

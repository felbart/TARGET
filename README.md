# Marca & Site HQ

Painel SPA (React + Tailwind, dark mode) de **Gestão de Marca Pessoal e Ofertas** para quem vende **identidade visual e sites** para negócios, organizado pelo framework de 90 dias do Kallaway.

Os dados editoriais ficam no `localStorage` (prefixo `ms-hq:`). Supabase Auth controla o acesso por Magic Link, com sessão separada dos documentos. O cabeçalho tem **Exportar / Importar** (backup em JSON), **Resetar** e **Sair**.

## Supabase Auth e persistência editorial local

As duas migrations com 10 tabelas híbridas e RLS foram aplicadas no projeto Target FB.
A RPC `record_evaluation` grava avaliação e mudança explícita do status da fórmula na mesma transação.
A persistência editorial continua usando apenas localStorage; não há migração ou sincronização automática.
Veja [Magic Link, configuração e testes reais de segurança](docs/auth-and-security.md).
O gate de sessão cobre restauração, renovação/expiração e logout; tokens ficam separados dos dados editoriais.
Veja [modelo, inventário, conexão e estratégia de migração](docs/supabase-preparation.md).
As variáveis públicas necessárias estão em [`.env.example`](.env.example).
Validação local: `npm test` (inclui PostgreSQL embarcado) e `npm run build`.

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

# TargetFB — arquitetura híbrida Supabase

Estado: baseline de 10 tabelas aplicado remotamente. Nenhuma importação ou sincronização editorial executada.
Os módulos editoriais continuam no localStorage. Login por Magic Link foi acrescentado em etapa separada;
veja [Auth e segurança](auth-and-security.md) para configuração e resultados atuais.

## Migrations substituídas

As versões anteriores de 22 tabelas NÃO foram aplicadas, por isso os dois arquivos existentes foram
reescritos como baseline, sem DROP de tabelas ou conversão de dados:

1. `20261015000100_strategy.sql`: user_settings, strategy, offers, formulas e trigger de updated_at.
2. `20261015000200_content_lab.sql`: content_topics, sprints, publications, evidence, evaluations,
   migration_imports, validação do envelope de critérios e RPC record_evaluation.

Esses arquivos não são uma atualização compatível de um banco com as versões antigas aplicadas.
Se algum ambiente tiver recebido os drafts antigos, pare: será necessário um plano específico de evolução.
Não use migration repair para declarar schemas diferentes como equivalentes.

## Inventário de localStorage e mapeamento futuro

Inventário obtido do código; não lemos o navegador nem `.env.local`.
Namespace ativo: `ms-hq:`. O prefixo antigo `b2c-hq:` não é lido nem migrado automaticamente.

| Chave | Dados atuais | Destino futuro |
| --- | --- | --- |
| activeTab | Aba selecionada | user_settings.active_tab |
| positioning | mode, avatar, problem, solution; gateTopic, gateDecider, gateAuthority; gateLog[{id,topic,pass,at}] | strategy; gate_draft JSONB; gateLog em content_topics após classificação do objetivo |
| pillars | bullseye[], beliefs[{id,market,thesis}], keywords[], setup[{id,label,done}], matrix[{dim,common,mine}] | strategy.pillars JSONB, mantendo campos, IDs e ordem |
| offer | name, promise, pricingModel, price, weeklyPrice, sprintWeeks, currency, ctaKeyword; deliverables[], ctas[], funnel | offers, com deliverables, ctas e funnel_assumptions JSONB |
| formulaOptions | topics[], formats[], layouts[] | user_settings.formula_options JSONB |
| formulas | id, topic, format, layout, notes, status; tests{performance,leads,sustainability,aesthetics} | formulas; testes em snapshot evaluations.criteria, notas/status legados em legacy_payload quando necessário |
| sprint | startDate, goal; posts[{id,date,title,formulaId,link,leads}] | sprints e publications |

Não persistidos hoje: filtro de tela, fórmula ainda não cadastrada e formulário de publicação.
Frase de posicionamento, indicadores, ranking e receita projetada são derivados; não criar cópias persistidas.
Evidências e avaliações históricas separadas não existem no legado e não serão inventadas.
Exportar/Importar/Resetar atuais continuam no mesmo namespace e com o mesmo comportamento.

## Modelo e responsabilidades

Todas as tabelas têm UUID, user_id, legacy_id opcional, created_at e updated_at.
As unicidades (id,user_id) sustentam as FKs compostas; (user_id,legacy_id) sustenta a identificação de origem.
legacy_id deve conter dataset + entidade + ID original de forma canônica, nunca somente um índice variável.

| Tabela | Colunas e JSONB relevantes |
| --- | --- |
| user_settings | Uma linha por usuário: active_tab; preferences e formula_options como objetos |
| strategy | Uma linha por usuário: mode, avatar, problem, solution; pillars e gate_draft como objetos |
| offers | Nome, promessa, preços, moeda, modelo, oferta core e arquivamento; deliverables/ctas como arrays; funnel_assumptions como objeto |
| formulas | topic, format, layout, notes, status, sort_order e archived_at |
| content_topics | topic, objective obrigatório, editorial_approach opcional, hypothesis, gate*, notes; strategy_id e suggested_formula_id opcionais |
| sprints | start_date, goal; offer_id opcional |
| publications | published_on, title, channel obrigatório, link, leads anulável, execution_snapshot objeto; formula_id, topic_id e sprint_id opcionais |
| evidence | publication_id obrigatório, criterion_key opcional, observation, metrics objeto, source_url e observed_at opcionais |
| evaluations | publication_id OU formula_id; criteria versionado; decision, rationale, learning, next_adjustment, evaluated_at, origin, legacy_payload e snapshots opcionais da transição de status |
| migration_imports | dataset_id, snapshot_sha256, source_snapshot, manifest, state e verified_at |

### Regras editoriais

- Objective aceita exclusivamente discovery, authority ou conversion, sem valor padrão arbitrário.
- Educational pode aparecer em editorial_approach; não é um quarto objetivo.
- suggested_formula_id é intenção da pauta; publications.formula_id é a execução efetiva. Podem diferir.
- Fórmulas são reutilizáveis em várias publicações. As opções do gerador não controlam seu histórico.
- formulas.status é o único estado atual: testing, validated ou discarded. Não há validação automática.
- Uma avaliação tem exatamente um alvo, por CHECK num_nonnulls(publication_id,formula_id)=1.
- Avaliar uma publicação não muda o status de sua fórmula, mesmo quando todos os critérios passam.
- Decision admite repeat, adjust ou stop; NULL significa decisão ainda não registrada, inclusive no legado.
- Cada avaliação permite justificativa, aprendizado e próximo ajuste, sem obrigar texto fictício.
- evaluated_at usa now() em novas avaliações manuais. NULL só é aceito para origin=legacy_import,
  quando a data original não existe. created_at é data de gravação, não a data histórica inferida.
- formula_status_before/after são snapshots de uma mudança explícita; não são outro estado corrente.
- Não se introduziu fluxo visual, integração, agendamento, status de produção ou automação editorial.

### JSONB e versionamento

Configurações e coleções pequenas são JSONB. Há CHECKs de tipo de objeto/array, sem presumir dados ausentes.
Pillars mantém o formato local; IDs internos e ordem dos arrays não são descartados.
Validação detalhada de configurações por módulo deverá ocorrer no futuro adaptador de dados.

Critérios usam envelope obrigatório com versão inteira positiva, items objeto não vazio e resultados
booleanos ou JSON null. As chaves são extensíveis; a restrição não fixa os quatro testes atuais:

```json
{
  "version": 1,
  "items": {
    "performance": { "passed": null, "rationale": "Ainda não avaliado" },
    "leads": { "passed": false },
    "sustainability": { "passed": true },
    "aesthetics": { "passed": true }
  }
}
```

`targetfb_valid_criteria` valida o envelope e os resultados. Rationale, quando presente, deve ser texto.
Uma avaliação guarda sua versão, sem reinterpretar resultados anteriores por regras novas.
No legado, false permanece false: o app antigo não distingue pendência de reprovação.
Versões futuras podem acrescentar critérios sem DDL, desde que mantenham o envelope; mudar seu contrato
requer evolução explícita da função de validação e dos consumidores.

### Canais e métricas

Channel é texto obrigatório não vazio, sem catálogo rígido. Novos canais não exigem tabela ou migration.
Para um post legado sem canal conhecido, o futuro importador deverá registrar explicitamente unknown
com essa ausência documentada, ou solicitar classificação. Nunca inferir canal apenas pela conveniência.

Métricas variáveis ficam em evidence.metrics, como snapshots manuais associados a uma publicação e seu canal.
Um exemplo de estrutura, sem valores presumidos: chave da métrica → objeto com value e unit.
Somente medições reais devem ser inseridas. Observed_at identifica a data conhecida da observação.
Objeto vazio representa ausência de métricas; não vira zero. Leads NULL também significa não medido;
um zero explicitamente existente no backup continua zero.
O banco exige metrics objeto e uma observação não vazia ou metrics não vazio. Os nomes e unidades não
são fixados pelo SQL, pois variam por canal. Sem coleta automática ou redes sociais.

As evidências são consultadas pelo escopo da avaliação: publicação alvo ou publicações da fórmula.
Não há associação N:N nem seleção auditável de um subconjunto exato de evidências nesta versão.
Um novo snapshot de resultados não reescreve observações anteriores automaticamente.

## Integridade, segurança e índices

- RLS ENABLE + FORCE nas dez tabelas, com políticas SELECT/INSERT/UPDATE/DELETE para authenticated.
- auth.uid() deve coincidir com user_id em USING e WITH CHECK conforme a operação.
- Sem privilégios de tabela para anon/public. Com sessão ausente, nenhuma linha é visível.
- FKs compostas (parent_id,user_id) impedem vínculos entre proprietários distintos em todos os caminhos.
- Exclusões de registros referenciados são NO ACTION. Fórmulas/ofertas podem ser arquivadas.
- Exclusão administrativa da conta auth.users mantém a remoção em cascade dos seus registros.
- Ofertas permitem apenas uma core não arquivada por usuário; strategy/settings são singletons.
- Datas editoriais são date; instantes são timestamptz. Meta positiva; leads não negativos quando presentes.
- Unicidade de importação é (user_id,dataset_id,snapshot_sha256): novo hash do mesmo dataset gera
  histórico, repetição exata conflita e outro usuário pode importar o mesmo dataset/hash.
- state=verified exige verified_at. O SQL não verifica sozinho a equivalência entre snapshot e registros.
- Índices por proprietário já existem via unicidade (user_id,legacy_id). FKs têm índices por proprietário;
  evidências/avaliações usam índices compostos por alvo e data, evitando duplicação de prefixos.
- Publicações têm índice por usuário/canal/data; avaliações por usuário/alvo/data, com filtros não nulos.
- Não há GIN genérico em todos os JSONB: acrescentar apenas quando uma consulta real justificar.
- Não se impôs unicidade textual da combinação de fórmulas: preservar duplicatas legadas para revisão,
  sem mesclá-las silenciosamente. O fluxo local mantém sua prevenção atual.

RLS é isolamento, não auditoria imutável. O proprietário ainda pode alterar/excluir suas linhas pelas
permissões SQL. Campos bloqueados no repositório JS não são restrições contra uma chamada direta à API.
Credenciais administrativas/secret/service_role podem contornar RLS e ficam fora do frontend.

## Transação de avaliação e status

`public.record_evaluation` é SECURITY INVOKER, search_path vazio, executável somente por authenticated.
Não recebe user_id; usa auth.uid() e políticas/tabelas do chamador.

1. Valida sessão e alvo exclusivo.
2. Rejeita status de fórmula em avaliação de publicação.
3. Bloqueia a fórmula com FOR UPDATE, quando esse é o alvo, serializando mudanças concorrentes.
4. Insere a avaliação com critérios e decisão, incluindo snapshots da mudança quando solicitada.
5. Atualiza formulas.status apenas se p_new_formula_status foi informado.
6. Qualquer falha desfaz a inserção e a atualização juntas.

Uma avaliação de fórmula sem pedido de mudança não altera o status atual. Decisão repeat também não
significa validated automaticamente. Não se exige quatro aprovações nem se corrige status legado nesta etapa.
O repositório usa uma única RPC, seguindo o mecanismo oficial de funções de banco do Supabase.

```js
await repository.recordEvaluation({
  formulaId,
  criteria,
  decision: 'adjust',
  rationale: 'Justificativa observada',
  learning: 'Aprendizado registrado',
  nextAdjustment: 'Próxima alteração planejada',
  newFormulaStatus: 'testing', // opcional, explícito
})
```

O repositório bloqueia insert/update genéricos de evaluations e update genérico de formulas.status,
encaminhando esses casos à RPC. Inserts diretos em SQL ficam disponíveis para futura importação controlada.
A transação é garantida para essa RPC; não há obrigação de usar a RPC imposta a todo acesso SQL direto.
Repetir a chamada após uma resposta de rede perdida pode criar outra avaliação: não implementar retries
cegos de escrita. Idempotência de importação é separada, no ledger; nenhum sincronizador foi criado.

## Camada de dados e persistência atual

```text
Componentes existentes → useLocalStorage → localRepository → ms-hq:
Futuro serviço assíncrono → createSupabaseRepository → getSupabaseClient → Supabase
```

- Os módulos locais não foram alterados nesta revisão e não importam o cliente remoto.
- Repositório remoto permite somente as dez tabelas e propaga erros da API.
- Listagens usam ordem editorial/data com desempate por id, paginação explícita e limite de 1000.
- recordEvaluation usa uma única chamada RPC; não faz duas escritas REST independentes.
- Configurar env não seleciona persistência editorial remota. Auth tem camada visual separada; não há migração ou sincronização.

## Conexão e aplicação futura

Use Node 22+. `.env.example` contém somente valores públicos. `.env.local` permanece intocado.
No projeto **Target FB**, confirme região São Paulo, obtenha Project URL em Connect e Publishable key
em Settings → API Keys. Edite apenas estas entradas no seu arquivo local e reinicie o Vite:

```dotenv
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE_PUBLICA
```

Nunca usar senha do banco, access token da CLI, sb_secret_* ou service_role em VITE_*.
O cliente lazy rejeita formatos diferentes de sb_publishable_. AuthGate implementa o login e habilita
callback PKCE, mantendo os repositórios editoriais locais. Em hospedagem, env é configuração do build
e exige novo build. Veja o documento de Auth antes de configurar URLs ou testar o login.

Os comandos seguintes são instruções, NÃO foram executados nesta tarefa:

```powershell
npx supabase init
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase migration list
npx supabase db push --dry-run
```

Init só quando config.toml ainda não existir, sem --force. Use o project ref, não o nome Target FB.
Confirme que não há schema/histórico dos drafts de 22 tabelas. Pare no dry-run e revise a lista:
20261015000100_strategy e 20261015000200_content_lab.
Depois de autorização para aplicar, o comando será `npx supabase db push`.
Não usar db reset --linked ou aplicar simultaneamente pelo SQL Editor e pela CLI.

Antes de conectar dados de produção ao frontend, validar Auth/PostgREST em Supabase local ou staging
com duas contas e acesso anônimo. Aplicar o schema não importa dados nem ativa persistência remota.

## Migração futura segura, sem implementação ou execução agora

1. Exportar backup JSON imutável pelo app, guardar os bytes originais e calcular SHA-256.
   JSONB guarda estrutura, não o arquivo byte a byte. Nunca apagar ou sobrescrever o navegador.
2. Definir usuário de destino e dataset_id estável; snapshots posteriores usam o mesmo dataset
   com novo hash. Um retry do mesmo hash deve retomar/verificar o lote existente, não duplicá-lo.
3. Validar offline tipos, IDs, datas, referências e campos desconhecidos. Guardar snapshot integral.
4. Preservar IDs em JSONB e atribuir UUIDs relacionais uma única vez no manifesto. Identidades
   canônicas incluem dataset, entidade e ID original. Itens sem ID mantêm ordem e caminho congelados.
5. Pautas legadas NÃO possuem objetivo: exigir classificação explícita discovery/authority/conversion
   antes de importá-las em content_topics. Não adotar objetivo padrão nem usar educational como objetivo.
6. Publicações legadas não possuem canal: classificar ou usar unknown explicitamente registrado.
   Não relacionar posts e pautas por títulos parecidos; vínculos inexistentes continuam opcionais.
7. Fórmulas preservam status/notas; snapshot legacy_import guarda os quatro false/true em criteria
   versionado, evaluated_at NULL quando desconhecido, e os campos originais relevantes em legacy_payload.
   Não converter false em reprovação, criar datas ou inventar decisões e evidências.
8. gateLog mantém pass e at; gate_decider/gate_authority históricos ficam NULL quando desconhecidos.
   O rascunho atual vai para strategy.gate_draft, separado das pautas históricas.
9. Inserir pais antes dos filhos: settings/strategy/offers/formulas; pautas/sprints; publicações;
   evidências/avaliações. Publicação sem fórmula legada permanece sem fórmula. Referência quebrada
   deve bloquear o lote e ser resolvida explicitamente, nunca virar associação fictícia.
10. Singletons existentes ou payload divergente para o mesmo legacy_id são conflitos para revisão.
    Não fazer upsert cego, deduplicar por texto ou regenerar IDs ao retomar.
11. Futuro importador deverá usar transação/RPC própria com trava por usuário/dataset e validação
    das identidades. record_evaluation é para avaliações manuais, não um importador de backup.
12. Conferir contagens, ordem, vínculos, leads, notas, status e critérios com o backup reconstruído.
    Marcar verified só após equivalência e registrar verified_at. Manter backup local para retorno.

Nada recupera as pautas já descartadas pelo limite local de 30 nem avaliações históricas inexistentes.

## Testes locais e limites

```powershell
npm test
npm run build
```

PGlite executa PostgreSQL efêmero, com auth.uid/roles simulados, sem credenciais, Docker, navegador ou rede.
Os testes verificam as dez tabelas, RLS em todas as operações, sessão ausente/anon, FKs por proprietário,
alvo exclusivo, objetivo, canal, JSONB, extensibilidade dos critérios, ausência versus zero, snapshots
legados, histórico/idempotência de importações, RPC e rollback após uma falha injetada no UPDATE.
Os testes do repositório verificam chamada única, validações e ordenação. O armazenamento local é
verificado nas sete chaves, sem mudança dos documentos ou referências.
Não substituem integração posterior com Auth e PostgREST reais nem teste de concorrência de rede.

## Referências oficiais

- [Database functions e SECURITY INVOKER](https://supabase.com/docs/guides/database/functions)
- [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [Migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [CLI e dry-run](https://supabase.com/docs/guides/local-development/cli-workflows)

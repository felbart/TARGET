# TargetFB — Magic Link e validação real de segurança

## Estado desta etapa (15/10/2026)

- As duas migrations de dez tabelas já estão aplicadas. Nenhuma tabela, função, policy ou migration
  foi alterada nesta etapa de Auth.
- Magic Link, restauração de sessão, verificação com Auth e logout local estão implementados.
- A configuração Auth remota foi aplicada e conferida por diff, limitada às propriedades declaradas
  em `supabase/auth-config/supabase/config.toml`. Não foi feito deploy na Netlify.
- A conta permanente autorizada é `felbart@gmail.com`. As duas contas temporárias usadas nos testes
  ainda precisam ser removidas pelo administrador ao encerrar a validação; cadastro fechado não as desativa.
- O endpoint público Auth confirmou cadastro bloqueado, e-mail habilitado e login anônimo desabilitado.
- Testes anônimos reais passaram: SELECT/INSERT/UPDATE/DELETE negados nas dez tabelas e RPC negada.
- Testes reais autenticados concluídos: CRUD próprio, isolamento cruzado nas duas direções, RPC de fórmula
  e publicação, rejeição de chamada inválida e limpeza dos registros descartáveis passaram.
- Revisão da interface: 24 testes locais passaram, incluindo monitor de expiração e preservação dos sete
  documentos editoriais. Configuração pública Auth e URLs foram reconferidas sem drift declarado.
- O fluxo completo de recebimento/clique do Magic Link depende de validação manual no navegador/e-mail.

## Responsabilidades e armazenamento

`src/auth/authService.js` acessa exclusivamente `client.auth`. `AuthGate` protege a montagem da aplicação;
o App apenas acrescenta o botão Sair. Não existe import de repositório editorial na camada Auth.
O SDK recebe `flowType: pkce`, `detectSessionInUrl: true`, persistência de sessão e refresh automático.
O SDK troca o código de callback pela sessão; não existe troca manual duplicada em React StrictMode.
O código/verificador PKCE pertence ao navegador que solicitou o link: abra o e-mail nesse navegador.
O callback `/auth/callback` é servido pelo rewrite SPA existente; o SDK processa a URL antes de limpá-la.

As chaves de sessão usam `targetfb-auth-v1`, separadas de `ms-hq:`. Exportar/resetar os documentos
editoriais não opera nessa chave. Logout usa `signOut({scope:'local'})`, não localStorage.clear().
Nenhuma chave editorial foi lida, migrada, renomeada ou apagada por esta implementação.
Restauração chama getSession e depois getUser para verificar a sessão no servidor; falha de rede ou
sessão inválida fecha a tela editorial. Logout invalida a sessão atual, preservando documentos locais.
`sessionMonitor.js` acompanha a expiração e revalida ao voltar a uma aba suspensa. O refresh automático
é feito pelo SDK; se não produzir uma sessão válida, o conteúdo interno é desmontado e aparece o login.
Renovações válidas preservam a montagem das telas. Uma restauração pendente não pode desfazer um logout,
e a limpeza do monitor impede atualizações após desmontagem/React StrictMode. Erros têm opção de tentar
verificar a sessão novamente. Códigos de callback e tokens nunca são exibidos em mensagens de erro.
Não há ativação do SupabaseRepository nem sincronização editorial.

AuthGate verifica autenticação para montar a interface; autorização de registros continua sendo
responsabilidade das políticas RLS no banco. O gate não substitui essas políticas. Os dados locais
continuam associados ao navegador, sem migração ou troca de namespace por usuário nesta etapa.

## Acesso pessoal sem cadastro público

A restrição principal está no servidor, não em uma comparação de e-mail no React:

1. `auth.enable_signup=false`: bloqueia criação pública de contas, inclusive chamada direta à API.
2. `auth.enable_anonymous_sign_ins=false`.
3. Somente o provedor de e-mail está habilitado; os provedores externos foram conferidos como inativos.
4. A única conta permanente provisionada é a autorizada. Não provisionar outras contas permanentes.
5. O frontend usa `signInWithOtp` com `shouldCreateUser:false` como proteção adicional, não como controle único.

Por padrão, signInWithOtp pode cadastrar automaticamente um e-mail ainda inexistente. Aqui isso é
desativado na chamada e bloqueado globalmente no servidor; uma chamada direta sem a opção do frontend
também não pode abrir cadastro enquanto a configuração global permanecer fechada.

**Atenção ao mapeamento da CLI:** `auth.email.enable_signup=true` mantém o provedor de e-mail ativo.
Desligá-lo fez o teste real detectar `external.email=false` e foi corrigido. O bloqueio de cadastro
é a flag global `auth.enable_signup=false`. O resultado final foi novamente verificado.

Esse modelo é acesso por provisionamento administrativo: criar outra conta no Dashboard torna essa
conta elegível para login. Por isso as duas contas de segurança devem ser temporárias e removidas
depois dos testes; não há allowlist apenas no frontend ou alteração das dez tabelas para contornar isso.
Não confiar em esconder a chave publishable: ela é pública, e as tabelas continuam protegidas por RLS.

## Painel Supabase — configurações necessárias

No projeto Target FB, Authentication → URL Configuration:

- **Site URL:** `https://targetfb.netlify.app`
- **Redirect URLs**, exatamente:
  - `https://targetfb.netlify.app/auth/callback`
  - `http://localhost:5173/auth/callback`
  - `http://127.0.0.1:5173/auth/callback`
  - `http://localhost:3000/auth/callback`

Não adicionar curingas amplos de previews Netlify. Se o Vite escolher outra porta, inicie na porta
esperada com `npm run dev -- --port 5173 --strictPort`, ou autorize explicitamente o callback novo.

Em Authentication → Sign In / Providers: Allow new users to sign up desativado; Anonymous sign-ins
desativado; Email ativo; confirmação de e-mail ativa. Os limites de envio e MFA existentes foram preservados.
Em Email Templates → Magic Link, manter o link de confirmação (`{{ .ConfirmationURL }}`), não apenas
um código numérico. A implementação solicita um Magic Link; não existe formulário para OTP numérico.
SMTP/entrega são do Supabase: o provedor padrão tem limites; se houver bloqueio de entrega, configurar
SMTP no painel sem colocar suas credenciais em VITE_* ou no repositório.

A configuração mínima versionada pode ser conferida separadamente, evitando empurrar os defaults
do config.toml completo para outros serviços:

```powershell
npx --yes supabase config diff --workdir supabase/auth-config --project-ref vygojpxmuzjmshotlxrl
```

Neste comando, propriedades `remote_only` com `declared:false` ficam fora do escopo do push.
Revisar apenas as propriedades declaradas antes de qualquer aplicação de configuração.

## Teste manual do Magic Link e sessão

1. Iniciar o Vite na porta 5173; configurar URL/chave pública via `.env.local` já existente.
   Para conferir seus dados anteriores, manter a mesma origem (protocolo, host e porta) onde foram salvos.
   Localhost, 127.0.0.1 e Netlify têm armazenamentos distintos; mudar a origem não transfere dados.
2. Entrar com a conta autorizada; verificar mensagem genérica, sem detalhes de cadastro ou tokens.
3. Abrir o link no mesmo navegador/origem; confirmar entrada e remoção do código da barra de endereço.
4. Recarregar para verificar restauração; fechar/reabrir a aba e verificar a sessão persistida.
5. Sair: a tela de login deve voltar e os dados `ms-hq:` permanecer iguais. Entrar novamente para conferir.
6. Um link expirado/reutilizado ou aberto em navegador sem verificador PKCE deve falhar de forma segura.
7. Repetir em produção somente após deploy manual autorizado. Esta tarefa não publicou a nova versão.

Esses passos ainda precisam de intervenção do titular do e-mail. Não enviar o link de acesso, código,
access_token ou refresh_token pelo chat, e não capturar callbacks com credenciais em logs/screenshots.

## Testes automatizados locais

```powershell
npm test
npm run build
```

Incluem testes de Magic Link sem signup, restauração validada, logout local, sanitização de erros,
limpeza da URL de callback, compatibilidade dos sete documentos locais, constraints, RLS e RPC no PGlite.
O teste local injeta uma falha no UPDATE da fórmula após a inserção da avaliação e confirma rollback.

## Testes reais Auth/PostgREST

Antes dos testes, valide somente o carregamento, sem rede:

```powershell
npm run check:security:env
```

As quatro credenciais são lidas por `scripts/security-env.mjs`, não pelo dotenv/Vite.
O formato é literal: `#`, `$`, vírgulas e aspas internas fazem parte do valor.
Comentários só podem ocupar linhas próprias. Aspas externas correspondentes são delimitadores
opcionais; não há expansão de variáveis ou escapes. Espaços das senhas são preservados.
O verificador imprime apenas presença e não vazio. O runner repete essa validação antes das operações.

```powershell
npm run test:security:remote -- --anonymous-only
npm run test:security:remote
```

O segundo comando executa a parte anônima e reporta BLOCKED se as credenciais não estiverem disponíveis.
Na execução autenticada concluída nesta sessão, os cinco grupos passaram e todos os registros de teste
reconhecidos foram removidos por ID. Os usuários temporários de Auth não são excluídos pelo runner.
O runner nunca usa service_role, JWT inventado, auth.uid simulado ou conexão SQL administrativa.
Usa a chave pública e sessões emitidas pelo Supabase Auth via signInWithPassword, para as contas
descartáveis. O login do produto continua exclusivamente por Magic Link; senha é só do harness Node.

### Intervenção necessária para os testes autenticados

1. Pelo Dashboard → Authentication → Users, provisionar administrativamente duas contas temporárias,
   confirmadas e sem MFA, com e-mails controlados que contenham `targetfb-security-`.
   Exemplo de aliases: `felbart+targetfb-security-a@gmail.com` e `felbart+targetfb-security-b@gmail.com`.
   Não habilitar cadastro público. Não usar a conta permanente para os testes.
2. Definir senhas temporárias distintas e fortes somente no painel.
3. Copiar `tests/remote-security.env.example` para `.env.security.local` na raiz e preencher localmente.
   Esse arquivo está ignorado pelo Git; não usar prefixo VITE_ nas credenciais de teste.
   URL/chave pública vêm do `.env.local` existente. Não compartilhar senhas pelo chat.
4. Confirmar as duas contas com dez tabelas vazias. O runner aborta se encontrar qualquer dado prévio.
5. Executar o comando completo. Depois, remover apenas as duas contas temporárias pelo Dashboard,
   após confirmar a limpeza dos registros. Preservar a conta permanente.

O runner verifica CRUD próprio, bloqueios cruzados nas duas direções, tentativa de forjar proprietário,
avaliação de publicação sem validar fórmula, transição explícita da fórmula, alvo exclusivo e rejeição
de uma chamada inválida sem alterações persistidas. Faz limpeza por IDs criados e marcador UUID da execução,
em ordem inversa de dependências. Não há DELETE amplo, reset ou limpeza de contas reais.

Falhas de rede podem impedir reconhecer uma resposta de escrita. O runner não faz retry cego; se houver
limpeza pendente, ele informa somente tabela/ID de teste. Revisar esses IDs/marcadores antes de limpar;
nunca resolver com reset ou excluir registros por título genérico.

**Limite do teste transacional real:** a rejeição de critérios inválidos confirma ausência de mudanças
na chamada rejeitada. O rollback especificamente após INSERT seguido de falha no UPDATE é testado localmente.
Não criar triggers de falha no banco de produção para simular esse caso. Uma verificação remota desse
cenário exigirá um ambiente de staging e intervenção separada.

## Referências oficiais

- [Magic Link e shouldCreateUser](https://supabase.com/docs/reference/javascript/auth-signinwithotp)
- [Configuração geral e bloqueio de cadastro](https://supabase.com/docs/guides/auth/general-configuration)
- [Fluxo PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow)

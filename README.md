# SKILLDER

Web app mobile-first para descobrir skills populares em uma timeline. O usuário pode abrir o perfil técnico de cada skill, dispensar ou curtir. Ao curtir, um match cria uma conversa com o repositório oficial, o comando de instalação e os cuidados de segurança.

## O que já funciona

- cadastro por e-mail e senha com verificação do e-mail;
- login por e-mail e senha, Google ou GitHub via Supabase Auth;
- feed bilíngue em português e inglês;
- cards com métricas, compatibilidade e instruções de instalação;
- filtros por crescimento, ecossistema, categoria, licença e atualização;
- like, dislike, match e conversa automática;
- match gamificado em tela cheia, com acesso direto à mensagem;
- catálogo alimentado pelo GitHub, com fallback local seguro;
- catálogo atualizado diariamente pelo cron da Vercel e atualizado em segundo plano no navegador;
- publicação comunitária com selo, autoria, categoria, capa opcional e mensagem obrigatória;
- aba Explorar com busca por usuário, skill ou repositório e carrosséis por tendência, likes e categoria;
- imagens com prioridade para capa do autor, imagem social do GitHub e fallback gerado pelo app;
- PWA instalável;
- persistência local no modo de demonstração;
- persistência com Supabase, políticas RLS e funções de banco preparadas para produção.

## Executar localmente

Requisitos: Node.js 22 e npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Abra `http://localhost:3000`.

Para revisar a interface sem configurar autenticação, habilite explicitamente o modo de demonstração apenas no ambiente local:

```env
ALLOW_DEMO_MODE=true
```

## Configurar o Supabase

1. Crie um projeto no Supabase.
2. Preencha `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e o Client ID público `NEXT_PUBLIC_GOOGLE_CLIENT_ID` em `.env.local`.
3. Aplique, em ordem, `supabase/migrations/202607130001_initial.sql`, `supabase/migrations/202607140001_community_submissions.sql` e `supabase/migrations/202607140002_explore.sql` pelo SQL Editor do Supabase ou pelo fluxo de migrations da Supabase CLI.
4. Em Auth, mantenha a confirmação de e-mail ativada e configure as URLs de redirecionamento `http://localhost:3000/auth/callback` e `https://skillderapp.vercel.app/auth/callback`.
5. Ative os provedores Google e GitHub no Supabase Auth. No Google Cloud, autorize `http://localhost:3000` e o domínio de produção como origens JavaScript. O callback do Supabase continua necessário para o GitHub.
6. Defina `SUPABASE_SERVICE_ROLE_KEY` somente no servidor.

O banco ativa Row Level Security em todas as tabelas e restringe dados pessoais ao próprio usuário.

As publicações comunitárias exigem um repositório público, original e ativo, com descrição, README e licença identificada. A API aceita no máximo cinco publicações por usuário a cada 24 horas e valida capas por tamanho, tipo e assinatura do arquivo.

## Atualizar o catálogo

`GITHUB_TOKEN` é opcional, mas aumenta o limite da API do GitHub. A rota `POST /api/cron/ingest` exige:

```http
Authorization: Bearer SEU_CRON_SECRET
```

Defina `CRON_SECRET` e `SUPABASE_SERVICE_ROLE_KEY` somente no ambiente do servidor. Nunca use o prefixo `NEXT_PUBLIC_` nessas chaves.

## Segurança das skills

O SKILLDER destaca origem, licença, documentação de instalação e permissões declaradas. Mesmo assim, o usuário deve revisar o código, os scripts de instalação, a telemetria e as permissões antes de executar qualquer comando de terceiros.

## Verificação

```bash
npm run lint
npm run test
npm run build
```

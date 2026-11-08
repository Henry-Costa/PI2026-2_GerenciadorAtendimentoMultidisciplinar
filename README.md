# Gerenciador de Atendimento Multidisciplinar

Projeto Integrador do Espaço Bianca Petenão para apoio ao gerenciamento de alunos, profissionais e atendimentos multidisciplinares.

## Estrutura atual

```text
frontend/                         Interface estática em HTML, CSS e JavaScript
  README.md                       Documentação específica da interface
backend/                          Estrutura inicial da API em TypeScript
  supabase/
    migrations/                   Esquema PostgreSQL versionado
    validation/                   Consultas somente de leitura para validação
  docs/modelagem-banco.md         Modelos conceitual, lógico e físico
```

## Status do projeto

- O frontend é demonstrativo e utiliza dados fictícios em memória.
- A estrutura inicial do backend está presente, mas ainda não possui dependências, variáveis de ambiente ou execução configuradas nesta branch.
- O banco PostgreSQL no Supabase possui uma migration inicial com 15 tabelas, RLS, políticas de acesso, auditoria e bucket privado para documentos.
- A integração entre frontend, API, autenticação e banco ainda não foi incluída nesta branch.

## Pré-requisitos

- Navegador atualizado para abrir o frontend.
- Projeto criado no [Supabase](https://supabase.com/) para aplicar e validar o banco.

Não há dependências Node.js configuradas nesta branch. Portanto, não é necessário executar `npm install` para usar o frontend ou aplicar a modelagem no Supabase.

## Como abrir o frontend

O frontend é estático. Abra a pasta `frontend` em um servidor HTTP local, como a extensão Live Server do VS Code, e acesse `index.html`.

Não existe processo de build, container Docker ou conexão com a API configurados nesta etapa.

Consulte [frontend/README.md](frontend/README.md) para detalhes sobre as telas e recursos demonstrativos.

## Como configurar o banco no Supabase

1. Crie ou acesse o projeto no Supabase.
2. Abra **SQL Editor** no painel do projeto.
3. Execute o conteúdo de [backend/supabase/migrations/20261105000000_initial_schema.sql](backend/supabase/migrations/20261105000000_initial_schema.sql).
4. Em seguida, execute [backend/supabase/validation/20261105_validate_initial_schema.sql](backend/supabase/validation/20261105_validate_initial_schema.sql).

O script de validação apenas consulta o banco: ele confirma tabelas, RLS, políticas, funções, permissões e o bucket privado. Nenhum dado é inserido, alterado ou excluído.

Para a explicação das entidades, relacionamentos e decisões de LGPD, consulte [backend/docs/modelagem-banco.md](backend/docs/modelagem-banco.md).

## Segurança

Chaves, arquivos `.env` e dados reais não devem ser enviados ao repositório. A migration usa RLS para restringir acesso a dados pessoais, financeiros e clínicos.

## Fluxo de colaboração

Desenvolva em branches de funcionalidade, abra PR para `dev` e faça revisão/teste antes de atualizar `main`.

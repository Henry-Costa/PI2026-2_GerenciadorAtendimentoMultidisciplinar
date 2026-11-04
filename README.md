# PI2026-2_GerenciadorAtendimentoMultidisciplinar

Frontend em desenvolvimento para o sistema de gerenciamento de atendimentos multidisciplinares do Espaço Bianca Petenão.

## Tecnologias

- HTML
- CSS
- JavaScript

O projeto usa HTML, CSS e JavaScript sem frameworks. Os ícones Bootstrap Icons são carregados por CDN (Content Delivery Network) e precisam de conexão com a internet.

## Etapa atual

Dashboard, atendimentos, agenda, equipe, comunicações e relatórios concluídos em modo demonstrativo. A tela de atendimentos permite consultar os registros, buscar por aluno, profissional ou área e filtrar por período, profissional, área e status. A Agenda oferece visão diária da semana demonstrativa, com seleção de data, horários ordenados e filtros. A Equipe lista profissionais e áreas derivadas dos atendimentos, com a agenda individual dos próximos sete dias. Comunicações prepara lembretes e confirmações para abertura manual no WhatsApp usando contatos fictícios, sem envio automático ou histórico. O Dashboard contém perfil, saudação conforme `currentProfile`, data local, quatro KPIs calculados e gráfico de atendimentos por área nos próximos sete dias. Relatórios permitem filtrar hoje ou próximos sete dias, comparar resultados por área e profissional e exportar CSV. Os dados são fictícios; não há autenticação ou banco conectado.

A agenda permite buscar aluno, profissional ou área sem distinção de acentos, combinar filtros de profissional, área e status, escolher entre hoje e os próximos sete dias e limpar todos os controles. A contagem de resultados acompanha a tabela; os KPIs mantêm o resumo dos próximos sete dias, independentemente dos filtros.

O botão **Acessar**, no canto superior direito, abre o painel para demonstração. O botão **Entrar** exige e-mail e senha preenchidos; o e-mail mostra avisos em português para campo vazio ou formato inválido. A autenticação ainda não está conectada. No desktop, o menu recolhido vira uma rail de ícones; no celular, inicia fechado com um ícone de casa e abre a navegação em coluna.

## Estrutura

- `index.html`: estrutura principal da página
- `painel.html`: painel com sidebar e navegação entre áreas
- `style.css`: estilos do projeto
- `script.js`: interações do projeto
- `navegacao.js`: dados dos links e símbolos do menu, além da navegação entre as seções

## Cronograma do frontend

### Estrutura Inicial do Projeto

**Duração:** 1 dia

- Organização de pastas
- Configuração dos arquivos HTML, CSS e JavaScript

**Status:** concluída

### Tela de Login

**Duração:** 2 dias

- Desenvolvimento da interface
- Validações e interações
- Responsividade

**Status:** concluída

### Navegação e Sidebar

**Duração:** 1 dia

- Menu lateral
- Estrutura de navegação entre páginas

**Status:** concluída

### Dashboard Administrativo

**Duração:** 3 dias

- Cards de indicadores
- Listagem de atendimentos
- Gráficos e métricas
- Layout do painel principal

**Status:** concluído em modo demonstrativo

- Incremento 1: perfil, boas-vindas, data e KPIs de demonstração.
- Incremento 2: agenda com dados fictícios e contagens calculadas (implementado).
- Incremento 3: busca e filtros da agenda (implementado).
- Incremento 4: consulta dos dados do atendimento em diálogo e preparação de mensagem de confirmação pelo WhatsApp (implementado). O telefone é informado no momento, não é salvo e a mensagem só é aberta no WhatsApp após ação explícita; o envio não é automático.

Cada entrega é validada e registrada em commit separado. O frontend continua demonstrativo, sem autenticação ou banco conectado.

### Perfil do Aluno

**Duração:** 2 dias

- Exibição de dados cadastrais
- Histórico de atendimentos
- Organização das informações

**Status:** concluído em modo demonstrativo. Os perfis usam dados fictícios em memória e não são persistidos.

### Cadastro de Alunos

**Duração:** 2 dias

- Formulários
- Máscaras de campos
- Upload de imagem
- Validações

**Status:** concluído em modo demonstrativo. Os cadastros ficam apenas em memória e não persistem após recarregar a página.

### Responsividade e Ajustes Visuais

**Duração:** 1 dia

- Adequação para diferentes resoluções
- Padronização da interface

**Status:** concluída e verificada em desktop e viewport móvel de 390 px.

### Testes e Refinamentos

**Duração:** 1 dia

- Correção de bugs
- Revisão da experiência do usuário
- Ajustes finais

**Status:** validação manual concluída nos fluxos de agenda, WhatsApp, perfil e cadastro; não há suíte automatizada no projeto.
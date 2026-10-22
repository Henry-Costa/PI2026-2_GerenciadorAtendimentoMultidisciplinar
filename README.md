# PI2026-2_GerenciadorAtendimentoMultidisciplinar

Frontend em desenvolvimento para o sistema de gerenciamento de atendimentos multidisciplinares do Espaço Bianca Petenão.

## Tecnologias

- HTML
- CSS
- JavaScript

O projeto usa HTML, CSS e JavaScript sem frameworks. Os ícones Bootstrap Icons são carregados por CDN (Content Delivery Network) e precisam de conexão com a internet.

## Etapa atual

Dashboard em desenvolvimento por incrementos. A versão atual contém perfil, saudação conforme `currentProfile`, data local e agenda dos próximos sete dias (hoje e os seis dias seguintes), ordenada por data e horário. Os quatro KPIs são calculados a partir dos registros fictícios em `demoAppointments`, sem valores fixos separados. Não há autenticação ou banco conectado. O atalho de relatórios aparece somente no Dashboard; a página de relatórios ainda não foi implementada.

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

**Status:** em andamento

- Incremento 1: perfil, boas-vindas, data e KPIs de demonstração.
- Incremento 2: agenda com dados fictícios e contagens calculadas (implementado).
- Incremento 3: busca e filtros da agenda.
- Incremento 4: consulta do aluno e mensagem de confirmação pelo WhatsApp.

Cada incremento será validado e commitado localmente antes do próximo. O envio ao GitHub fica para depois da revisão final.

### Perfil do Aluno

**Duração:** 2 dias

- Exibição de dados cadastrais
- Histórico de atendimentos
- Organização das informações

### Cadastro de Alunos

**Duração:** 2 dias

- Formulários
- Máscaras de campos
- Upload de imagem
- Validações

### Responsividade e Ajustes Visuais

**Duração:** 1 dia

- Adequação para diferentes resoluções
- Padronização da interface

### Testes e Refinamentos

**Duração:** 1 dia

- Correção de bugs
- Revisão da experiência do usuário
- Ajustes finais
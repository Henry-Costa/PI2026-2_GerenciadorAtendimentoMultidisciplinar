# Frontend do Espaço Bianca Petenão

Interface do PI ADS em HTML, CSS e JavaScript. Abra pelo Live Server do VS Code ou sirva a pasta `frontend` com um servidor HTTP local. Por exemplo, na raiz do projeto:

```sh
python -m http.server 5500 --bind 127.0.0.1 --directory frontend
```

Acesse http://127.0.0.1:5500. A interface usa módulos nativos do navegador e dispensa instalação ou build.

## Testar a interface

- **Admin** pode criar e editar funcionários, tipos de atendimento, pacientes e consultas. Também pode ver relatórios e exportar CSV.
- **Profissional** vê apenas a própria agenda e pode registrar check-in ou ausência conforme os horários da demonstração. Cancelamento e edição de consultas ficam com o admin.
- O seletor no painel troca o perfil na mesma página, preservando os dados de teste em memória para comparar os fluxos. Recarregar ou sair volta aos exemplos iniciais.
- Em **Configurações**, salve tema claro ou escuro, densidade das tabelas e, para o admin, a tela inicial. As preferências ficam no navegador.
- O **Dashboard** reúne os indicadores, o gráfico por área e a lista filtrável de atendimentos. **Comunicações** apresenta uma prévia dos lembretes e confirmações.
- No cadastro de paciente, escolha o tipo de atendimento para carregar os profissionais compatíveis. O preço do tipo sugere o valor do vínculo, que sugere o valor da consulta.
- Na Agenda, selecione um dia no calendário semanal ou use a lista por período. O admin cria consultas únicas ou semanais (2 a 52 ocorrências, incluindo a primeira).
- Uma sessão dupla ocupa dois períodos consecutivos do atendimento e sugere o dobro do valor do vínculo. O admin pode ajustar o valor por consulta. O término é calculado automaticamente.
- O mesmo profissional ou paciente pode começar outra consulta no instante em que a anterior termina. A agenda verifica todas as ocorrências antes de salvar uma série. Editar ou cancelar afeta somente a ocorrência selecionada.
- Para executar os testes das regras de agenda com Node.js 24, rode `node --test frontend/tests/agenda.test.mjs` na raiz do projeto.
- Na demonstração, check-in abre 30 minutos antes e encerra 24 horas após a sessão. Ausência abre após o fim do agendamento e segue o mesmo limite. Essas janelas foram adotadas para testar a interface.
- O destinatário do lembrete fica gravado no cadastro da sessão de teste. A interface não envia mensagens.

**Use dados fictícios.** A seleção de perfis simula a experiência de cada papel. Ela não é autenticação ou controle de acesso em produção. Esta versão não chama a API ou o Supabase. Login real, autorização e persistência dependem de contratos seguros no backend existente e estão fora do escopo da refatoração.

## Organização

- `index.html` e `painel.html` são os pontos de entrada.
- `style.css` preserva a base visual. `src/app.css` contém os estilos das telas novas.
- `src/app.js` organiza a navegação e a troca de perfis.
- `src/features/` separa agenda, pacientes, equipe, tipos de atendimento e relatórios.
- `src/data/demo.js` implementa os dados e as regras da demonstração, isolados das telas.
- `src/shared/` reúne validações e elementos reutilizáveis.

import {
  el,
  button,
  dialog,
  field,
  formSubmit,
  value,
  table,
  toolbar,
  money,
  status,
} from '../../shared/ui.js';
export async function mount(root, data) {
  let records = await data.listServices();
  const list = el('div');
  function render() {
    list.replaceChildren(
      records.length
        ? table(
            ['Atendimento', 'Valor padrão', 'Duração', 'Situação', 'Ações'],
            records.map((s) => [
              s.name,
              money(s.default_amount),
              s.default_duration_minutes + ' min',
              s.is_active ? 'Ativo' : 'Inativo',
              button('Editar', () => edit(s)),
            ]),
          )
        : status('Cadastre o primeiro tipo de atendimento para habilitar os profissionais.'),
    );
  }
  function edit(s = {}) {
    const form = el('form', { className: 'feature-form' }),
      d = dialog(s.id ? 'Editar atendimento' : 'Novo tipo de atendimento', form);
    field(form, 'name', 'Nome do atendimento', { value: s.name });
    field(form, 'default_amount', 'Valor padrão (R$)', {
      value: s.default_amount,
      type: 'number',
      min: 0,
      step: '0.01',
      max: '9999999999.99',
    });
    field(form, 'default_duration_minutes', 'Duração (minutos)', {
      value: s.default_duration_minutes || 60,
      type: 'number',
      min: 15,
      max: 480,
      step: 1,
    });
    field(form, 'is_active', 'Situação', {
      value: String(s.is_active ?? true),
      options: [
        { value: 'true', label: 'Ativo' },
        { value: 'false', label: 'Inativo' },
      ],
    });
    formSubmit(
      form,
      () =>
        data.saveService(s.id, {
          name: value(form, 'name'),
          default_amount: Number(value(form, 'default_amount')),
          default_duration_minutes: Number(value(form, 'default_duration_minutes')),
          is_active: value(form, 'is_active') === 'true',
        }),
      async () => {
        d.close();
        records = await data.listServices();
        render();
      },
    );
  }
  root.append(
    toolbar(
      'Tipos de atendimento',
      'Valores e durações sugeridos para novos vínculos e consultas.',
      button('Novo tipo', () => edit(), 'new-student-button'),
    ),
    list,
  );
  render();
}

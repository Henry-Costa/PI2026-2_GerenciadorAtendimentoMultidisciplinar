import {
  el,
  button,
  dialog,
  field,
  group,
  formSubmit,
  value,
  table,
  toolbar,
  one,
  searchBox,
  status,
} from '../../shared/ui.js';
import { normalizeSearch } from '../../shared/validation.js';
import { history } from '../agenda/summary.js';
export async function mount(root, data) {
  root.className = 'team-view';
  let records = await data.listProfessionals(),
    query = '';
  const list = el('div');
  function render() {
    const rows = records.filter((p) =>
      normalizeSearch(p.full_name + ' ' + p.specialty).includes(normalizeSearch(query)),
    );
    list.replaceChildren(
      rows.length
        ? table(
            ['Profissional', 'Especialidade', 'Papel', 'Situação', 'Ações'],
            rows.map((p) => [
              p.full_name,
              p.specialty,
              p.role === 'admin' ? 'Admin' : 'Usuário comum',
              p.is_active ? 'Ativo' : 'Inativo',
              el(
                'div',
                { className: 'row-actions' },
                button(
                  'Ver perfil',
                  () =>
                    dialog(
                      p.full_name,
                      el(
                        'section',
                        { className: 'team-profile-view' },
                        el('p', { className: 'team-profile-area' }, p.specialty),
                        el('p', {}, [p.email, p.phone].filter(Boolean).join(' · ')),
                        el('h3', {}, 'Atendimentos'),
                        history(data, 'professional_id', p.id),
                      ),
                    ),
                  'student-consult-button',
                ),
                button('Editar', () => edit(p.id)),
              ),
            ]),
          )
        : status('Nenhum profissional encontrado.'),
    );
  }
  async function edit(id) {
    const d = dialog(
      id ? 'Cadastro do profissional' : 'Novo profissional',
      status('Carregando cadastro…'),
    );
    try {
      const [p, services] = await Promise.all([
        id ? data.getProfessional(id) : Promise.resolve({}),
        data.listServices(),
      ]);
      if (!d.isConnected) return;
      const financial = one(p.financial),
        form = el('form', { className: 'feature-form' }),
        personal = group(form, 'Dados pessoais');
      field(personal, 'full_name', 'Nome completo', { value: p.full_name, minLength: 3 });
      field(personal, 'email', 'Email', { value: p.email, type: 'email' });
      field(personal, 'phone', 'Telefone', { value: p.phone, type: 'tel' });
      field(personal, 'cpf', 'CPF', { value: p.cpf, inputMode: 'numeric', maxLength: 14 });
      const professional = group(form, 'Dados profissionais');
      field(professional, 'specialty', 'Especialidade', { value: p.specialty });
      field(professional, 'role', 'Papel', {
        value: p.role || 'user',
        options: [
          { value: 'user', label: 'Usuário comum' },
          { value: 'admin', label: 'Admin' },
        ],
      });
      field(professional, 'is_active', 'Situação', {
        value: String(p.is_active ?? true),
        options: [
          { value: 'true', label: 'Ativo' },
          { value: 'false', label: 'Inativo' },
        ],
      });
      const checks = el(
        'fieldset',
        { className: 'service-checks full-width' },
        el('legend', {}, 'Tipos de atendimento *'),
      );
      for (const s of services)
        checks.append(
          el(
            'label',
            {},
            el('input', {
              type: 'checkbox',
              name: 'service_type_ids',
              value: s.id,
              checked: p.services?.some((v) => v.service_type_id === s.id) || false,
            }),
            s.name + (s.is_active ? '' : ' (inativo)'),
          ),
        );
      professional.append(checks);
      const bank = group(form, 'Remuneração e dados bancários');
      field(bank, 'hourly_rate', 'Valor hora (R$)', {
        value: financial.hourly_rate,
        type: 'number',
        min: 0,
        step: '0.01',
        max: '9999999999.99',
      });
      for (const [key, label] of [
        ['bank_name', 'Banco'],
        ['branch', 'Agência'],
        ['checking_account', 'Conta corrente'],
        ['pix_key', 'Chave PIX'],
      ])
        field(bank, key, label, { value: financial[key] });
      bank.append(
        el(
          'p',
          { className: 'field-note full-width' },
          'Dados disponíveis somente ao administrador.',
        ),
      );
      formSubmit(
        form,
        () => {
          const service_type_ids = [
            ...form.querySelectorAll('[name=service_type_ids]:checked'),
          ].map((c) => c.value);
          if (!service_type_ids.length)
            throw new Error('Selecione ao menos um tipo de atendimento.');
          return data.saveProfessional(id, {
            full_name: value(form, 'full_name'),
            email: value(form, 'email'),
            phone: value(form, 'phone'),
            cpf: value(form, 'cpf'),
            specialty: value(form, 'specialty'),
            role: value(form, 'role'),
            is_active: value(form, 'is_active') === 'true',
            service_type_ids,

            financial: {
              hourly_rate: Number(value(form, 'hourly_rate')),
              ...Object.fromEntries(
                ['bank_name', 'branch', 'checking_account', 'pix_key'].map((k) => [
                  k,
                  value(form, k),
                ]),
              ),
            },
          });
        },
        async () => {
          d.close();
          records = await data.listProfessionals();
          render();
        },
      );
      d.replaceChildren(
        el(
          'div',
          { className: 'student-dialog-heading' },
          el('h2', {}, id ? 'Cadastro do profissional' : 'Novo profissional'),
          button('Fechar', () => d.close()),
        ),
        form,
      );
    } catch (error) {
      d.replaceChildren(
        status(error.message, true),
        button('Fechar', () => d.close()),
      );
    }
  }
  root.append(
    toolbar(
      'Profissionais',
      'Profissionais responsáveis pelos atendimentos e seus papéis no sistema.',
      button('Novo profissional', () => edit(), 'new-student-button'),
    ),
    searchBox((v) => {
      query = v;
      render();
    }),
    list,
  );
  render();
}

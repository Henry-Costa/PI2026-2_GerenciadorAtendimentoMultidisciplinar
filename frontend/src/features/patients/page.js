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
  dateLabel,
  localDate,
  searchBox,
  status,
} from '../../shared/ui.js';
import { validCPF, normalizeSearch } from '../../shared/validation.js';
import { history } from '../agenda/summary.js';
export async function mount(root, data) {
  root.className = 'students-view';
  let records = await data.listPatients(),
    query = '';
  const list = el('div');
  const render = () => {
    const rows = records.filter((p) =>
      normalizeSearch(p.full_name).includes(normalizeSearch(query)),
    );
    list.replaceChildren(
      rows.length
        ? table(
            ['Paciente', 'Nascimento', 'Início dos atendimentos', 'Ações'],
            rows.map((p) => [
              p.full_name,
              dateLabel(p.birth_date),
              dateLabel(p.care_started_at),
              el(
                'div',
                { className: 'row-actions' },
                button('Ver perfil', () => showProfile(p), 'student-consult-button'),
                button('Editar', () => edit(p.id)),
              ),
            ]),
          )
        : status('Nenhum paciente encontrado.'),
    );
  };
  async function reload() {
    records = await data.listPatients();
    render();
  }
  function showProfile(patient) {
    const profile = el('section', { className: 'student-profile-view' });
    if (patient.photo)
      profile.append(
        el('img', { src: patient.photo, alt: '', className: 'student-profile-photo' }),
      );
    const fields = [
      ['Data de nascimento', dateLabel(patient.birth_date)],
      ['Responsável financeiro', patient.responsible?.full_name],
      ['Contato', patient.contact?.phone || patient.responsible?.phone],
    ];
    profile.append(
      el(
        'dl',
        { className: 'student-details' },
        fields.map(([label, content]) =>
          el('div', {}, el('dt', {}, label), el('dd', {}, content || '—')),
        ),
      ),
      el('h3', {}, 'Histórico de atendimentos'),
      history(data, 'student_id', patient.id),
    );
    dialog(patient.full_name, profile);
  }
  async function edit(id) {
    const loading = dialog(
      id ? 'Cadastro do paciente' : 'Novo paciente',
      status('Carregando cadastro…'),
    );
    try {
      const [patient, services, professionals] = await Promise.all([
        id ? data.getPatient(id) : Promise.resolve({}),
        data.listServices(),
        data.listProfessionals(),
      ]);
      if (!loading.isConnected) return;
      const p = patient,
        ids = one(p.identifiers),
        c = one(p.contact),
        a = one(p.address),
        r = one(p.responsible),
        assignments = p.assignments || [];
      const form = el('form', { className: 'feature-form' }),
        personal = group(form, 'Dados pessoais');
      const photo = field(personal, 'photo', 'Foto (opcional)', {
        type: 'file',
        required: false,
        accept: 'image/png,image/jpeg,image/webp',
      });
      field(personal, 'full_name', 'Nome completo', {
        value: p.full_name,
        minLength: 3,
        maxLength: 200,
      });
      field(personal, 'email', 'Email', {
        value: c.email,
        type: 'email',
        required: false,
        maxLength: 254,
      });
      field(personal, 'phone', 'Telefone', {
        value: c.phone,
        type: 'tel',
        required: false,
        placeholder: 'DDD e número',
      });
      field(personal, 'birth_date', 'Data de nascimento', {
        value: p.birth_date,
        type: 'date',
        max: localDate(),
      });
      field(personal, 'care_started_at', 'Início dos atendimentos', {
        value: p.care_started_at || localDate(),
        type: 'date',
      });
      const docs = group(form, 'Documentos');
      const cpf = field(docs, 'cpf', 'CPF', {
        value: ids.cpf,
        inputMode: 'numeric',
        maxLength: 14,
      });
      cpf.addEventListener('input', () => cpf.setCustomValidity(''));
      cpf.addEventListener('change', () =>
        cpf.setCustomValidity(validCPF(cpf.value) ? '' : 'CPF inválido.'),
      );
      field(docs, 'rg', 'RG', { value: ids.rg, maxLength: 30 });
      field(docs, 'cns', 'CNS', {
        value: ids.cns,
        required: false,
        inputMode: 'numeric',
        maxLength: 15,
      });
      const address = group(form, 'Endereço');
      for (const [name, label, required] of [
        ['postal_code', 'CEP', false],
        ['street', 'Rua', true],
        ['street_number', 'Número', true],
        ['complement', 'Complemento', false],
        ['neighborhood', 'Bairro', true],
        ['city', 'Cidade', true],
      ])
        field(address, name, label, { value: a[name], required });
      field(address, 'state', 'Estado', {
        value: a.state || '',
        options: [
          { value: '', label: 'Selecione' },
          ...[
            'AC',
            'AL',
            'AP',
            'AM',
            'BA',
            'CE',
            'DF',
            'ES',
            'GO',
            'MA',
            'MT',
            'MS',
            'MG',
            'PA',
            'PB',
            'PR',
            'PE',
            'PI',
            'RJ',
            'RN',
            'RS',
            'RO',
            'RR',
            'SC',
            'SP',
            'SE',
            'TO',
          ].map((v) => ({ value: v, label: v })),
        ],
      });
      const responsible = group(form, 'Responsável financeiro');
      for (const [name, label, type] of [
        ['full_name', 'Nome completo', 'text'],
        ['cpf', 'CPF', 'text'],
        ['phone', 'Telefone', 'tel'],
        ['email', 'Email', 'email'],
        ['marital_status', 'Estado civil', 'text'],
        ['place_of_birth', 'Naturalidade', 'text'],
        ['occupation', 'Ocupação', 'text'],
      ])
        field(responsible, 'responsible_' + name, label, { value: r[name], type });
      const care = group(form, 'Atendimento e profissional');
      const binding = field(care, 'assignment_id', 'Vínculo de atendimento', {
        required: false,
        value: assignments[0]?.id || '',
        options: [
          ...assignments.map((s) => ({
            value: s.id,
            label:
              (services.find((v) => v.id === s.service_type_id)?.name || 'Atendimento') +
              ' · ' +
              (professionals.find((v) => v.id === s.professional_id)?.full_name || 'Profissional') +
              (s.is_active ? '' : ' (inativo)'),
          })),
          { value: '', label: assignments.length ? 'Adicionar novo vínculo' : 'Primeiro vínculo' },
        ],
      });
      const service = field(care, 'service_type_id', 'Tipo de atendimento', {
        options: [
          { value: '', label: 'Selecione' },
          ...services.map((s) => ({
            value: s.id,
            label: s.name + (s.is_active ? '' : ' (inativo)'),
          })),
        ],
      });
      const professional = field(care, 'professional_id', 'Profissional responsável', {
        options: [{ value: '', label: 'Selecione um atendimento primeiro' }],
      });
      const amount = field(care, 'agreed_amount', 'Valor do atendimento (R$)', {
        type: 'number',
        min: 0,
        step: '0.01',
        max: '9999999999.99',
      });
      const recipient = field(care, 'reminder_recipient', 'Destinatário dos lembretes', {
        value: 'financial_responsible',
        options: [
          { value: 'financial_responsible', label: 'Responsável financeiro' },
          { value: 'student', label: 'Paciente' },
        ],
      });
      const active = field(care, 'assignment_active', 'Situação do vínculo', {
        value: 'true',
        options: [
          { value: 'true', label: 'Ativo' },
          { value: 'false', label: 'Inativo' },
        ],
      });
      function fillProfessionals(selected = '') {
        const compatible = professionals.filter(
          (pro) => pro.is_active && pro.services?.some((s) => s.service_type_id === service.value),
        );
        professional.replaceChildren(
          el(
            'option',
            { value: '' },
            compatible.length ? 'Selecione' : 'Nenhum profissional compatível',
          ),
          ...compatible.map((pro) =>
            el('option', { value: pro.id, selected: pro.id === selected }, pro.full_name),
          ),
        );
      }
      function fillBinding() {
        const s = assignments.find((s) => s.id === binding.value);
        service.value = s?.service_type_id || '';
        fillProfessionals(s?.professional_id);
        amount.value =
          s?.agreed_amount ?? services.find((v) => v.id === service.value)?.default_amount ?? '';
        recipient.value = s?.reminder_recipient || 'financial_responsible';
        active.value = String(s?.is_active ?? true);
      }
      binding.addEventListener('change', fillBinding);
      service.addEventListener('change', () => {
        fillProfessionals();
        amount.value = services.find((s) => s.id === service.value)?.default_amount ?? '';
      });
      fillBinding();
      care.append(
        el(
          'p',
          { className: 'field-note full-width' },
          'Os outros vínculos são preservados. Para trocar profissional ou tipo de um vínculo com histórico, adicione um novo vínculo. O valor aqui será sugerido em novas consultas.',
        ),
      );
      formSubmit(
        form,
        async () => {
          const file = photo.files[0];
          if (
            file &&
            (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
              file.size > 2 * 1024 * 1024)
          )
            throw new Error('Escolha uma foto PNG, JPEG ou WebP de até 2 MB.');
          let photoData = patient.photo;
          if (file) {
            photoData = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = () => reject(new Error('Não foi possível ler a foto.'));
              reader.readAsDataURL(file);
            });
          }
          data.savePatient(id, {
            photo: photoData,
            full_name: value(form, 'full_name'),
            birth_date: value(form, 'birth_date'),
            care_started_at: value(form, 'care_started_at'),
            identifiers: {
              cpf: value(form, 'cpf'),
              rg: value(form, 'rg'),
              cns: value(form, 'cns'),
            },
            contact: { email: value(form, 'email'), phone: value(form, 'phone') },
            address: Object.fromEntries(
              [
                'postal_code',
                'street',
                'street_number',
                'complement',
                'neighborhood',
                'city',
                'state',
              ].map((k) => [k, value(form, k)]),
            ),
            responsible: Object.fromEntries(
              [
                'full_name',
                'cpf',
                'phone',
                'email',
                'marital_status',
                'place_of_birth',
                'occupation',
              ].map((k) => [k, value(form, 'responsible_' + k)]),
            ),
            assignment: {
              id: binding.value || null,
              professional_id: professional.value,
              service_type_id: service.value,
              agreed_amount: Number(amount.value),
              reminder_recipient: recipient.value,
              is_active: active.value === 'true',
            },
          });
        },
        async () => {
          loading.close();
          await reload();
        },
      );
      loading.replaceChildren(
        el(
          'div',
          { className: 'student-dialog-heading' },
          el('h2', {}, id ? 'Cadastro do paciente' : 'Novo paciente'),
          button('Fechar', () => loading.close()),
        ),
        form,
      );
    } catch (error) {
      loading.replaceChildren(
        status(error.message, true),
        button('Fechar', () => loading.close()),
      );
    }
  }
  root.append(
    toolbar(
      'Alunos cadastrados',
      'Cadastros, contatos, responsáveis e vínculos de atendimento.',
      button('Novo paciente', () => edit(), 'new-student-button'),
    ),
    searchBox((v) => {
      query = v;
      render();
    }),
    list,
  );
  render();
}

import {
  addDays,
  button,
  dateLabel,
  dialog,
  el,
  field,
  inputDateTime,
  localDate,
  table,
  timeLabel,
} from '../../shared/ui.js';
import { normalizeSearch } from '../../shared/validation.js';

export const labels = {
  scheduled: 'Aguardando confirmação',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  pending: 'Pendente',
  present: 'Presente',
  absent: 'Ausente',
};

export function dateOf(row) {
  return inputDateTime(row.starts_at).slice(0, 10);
}

export function badge(state) {
  return el(
    'span',
    { className: 'agenda-status agenda-status-' + (state === 'scheduled' ? 'pending' : state) },
    labels[state],
  );
}

export function distribution(title, records, getName, period) {
  const values = new Map();
  for (const record of records) {
    const name = getName(record.assignment);
    values.set(name, (values.get(name) || 0) + 1);
  }
  const max = Math.max(1, ...values.values());
  const chart = el('div', { className: 'area-chart', role: 'list', 'aria-label': title });
  for (const [name, count] of [...values].sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))) {
    const bar = el('span', { className: 'area-chart-bar' });
    bar.style.width = (count / max) * 100 + '%';
    chart.append(
      el(
        'div',
        { className: 'area-chart-row', role: 'listitem' },
        el('span', { className: 'area-chart-label' }, name),
        el('span', { className: 'area-chart-track' }, bar),
        el('strong', { className: 'area-chart-value' }, count),
      ),
    );
  }
  return el(
    'section',
    { className: 'dashboard-chart' },
    el(
      'div',
      { className: 'dashboard-chart-heading' },
      el('h3', {}, title),
      period && el('span', {}, period),
    ),
    records.length
      ? chart
      : el('p', { className: 'agenda-period' }, 'Nenhum atendimento no período.'),
  );
}

export function timeRange(row) {
  return timeLabel(row.starts_at) + ' – ' + timeLabel(row.ends_at);
}

export function history(data, kind, id) {
  const records = data.listHistory(kind, id);
  if (!records.length)
    return el('p', { className: 'agenda-period' }, 'Nenhum atendimento registrado.');
  const isStudent = kind === 'student_id';
  return table(
    ['Data', 'Horário', isStudent ? 'Profissional' : 'Aluno', 'Área', 'Status'],
    records.map((row) => [
      dateLabel(row.starts_at),
      timeRange(row),
      (isStudent ? row.assignment.professional : row.assignment.student).full_name,
      row.assignment.service.name,
      badge(row.status),
    ]),
  );
}

export function details(row) {
  const { student, professional, service } = row.assignment;
  dialog(
    'Consulta do aluno',
    el(
      'dl',
      { className: 'student-details' },
      ...[
        ['Aluno', student.full_name],
        ['Data e horário', dateLabel(row.starts_at) + ' · ' + timeRange(row)],
        ['Profissional', professional.full_name],
        ['Área', service.name],
        ['Status', badge(row.status)],
        ['Presença', labels[row.attendance.status]],
        ['Sessão', row.session_units === 2 ? 'Dupla' : 'Simples'],
        ['Frequência', row.series_id ? 'Semanal' : 'Única'],
      ].map(([label, value]) => el('div', {}, el('dt', {}, label), el('dd', {}, value))),
    ),
  );
}

export function filterOptions(names, first = 'Todos') {
  return [
    { value: '', label: first },
    ...[...new Set(names)]
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((name) => ({ value: name, label: name })),
  ];
}

export function upcomingList(records) {
  const today = localDate();
  const form = el('form', {
    className: 'agenda-filters',
    'aria-label': 'Busca e filtros da agenda',
  });
  const query = field(form, 'search', 'Buscar aluno, profissional ou área', {
    required: false,
    type: 'search',
    placeholder: 'Nome ou área de atendimento',
  });
  query.parentElement.classList.add('agenda-search');
  const period = field(form, 'period', 'Período', {
    value: 7,
    required: false,
    options: [
      { value: 7, label: 'Próximos 7 dias' },
      { value: 1, label: 'Hoje' },
    ],
  });
  const staff = field(form, 'professional', 'Profissional', {
    required: false,
    options: filterOptions(records.map((r) => r.assignment.professional.full_name)),
  });
  const area = field(form, 'area', 'Área', {
    required: false,
    options: filterOptions(
      records.map((r) => r.assignment.service.name),
      'Todas',
    ),
  });
  const state = field(form, 'status', 'Status', {
    required: false,
    options: [
      { value: '', label: 'Todos' },
      ...['scheduled', 'confirmed', 'completed', 'cancelled'].map((value) => ({
        value,
        label: labels[value],
      })),
    ],
  });
  form.append(
    el(
      'button',
      { type: 'reset', className: 'agenda-reset', 'aria-label': 'Limpar busca e filtros' },
      '↺',
    ),
  );
  const range = el('p', { className: 'agenda-period' });
  const result = el('p', { className: 'agenda-results', role: 'status' });
  const list = el('div');
  function render() {
    const last = addDays(today, Number(period.value) - 1);
    const window = records.filter((r) => dateOf(r) <= last);
    const search = normalizeSearch(query.value);
    const rows = window.filter(
      ({ assignment: { student, professional, service }, status }) =>
        (!staff.value || staff.value === professional.full_name) &&
        (!area.value || area.value === service.name) &&
        (!state.value || state.value === status) &&
        normalizeSearch(
          [student.full_name, professional.full_name, service.name].join(' '),
        ).includes(search),
    );
    range.textContent = dateLabel(today) + ' a ' + dateLabel(last);
    result.textContent = rows.length + ' de ' + window.length + ' atendimentos no período';
    list.replaceChildren(
      rows.length
        ? table(
            ['Data', 'Horário', 'Aluno', 'Profissional', 'Área', 'Status', 'Ações'],
            rows.map((row) => [
              dateLabel(row.starts_at),
              timeRange(row),
              row.assignment.student.full_name,
              row.assignment.professional.full_name,
              row.assignment.service.name,
              badge(row.status),
              button('Consultar', () => details(row), 'student-consult-button'),
            ]),
          )
        : el(
            'p',
            { className: 'agenda-period' },
            'Nenhum atendimento corresponde à busca e aos filtros.',
          ),
    );
  }
  form.addEventListener('input', render);
  form.addEventListener('reset', () => queueMicrotask(render));
  form.addEventListener('submit', (event) => event.preventDefault());
  render();
  return el('div', {}, form, range, result, list);
}

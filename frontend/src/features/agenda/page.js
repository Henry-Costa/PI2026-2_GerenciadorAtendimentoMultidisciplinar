import {
  el,
  button,
  field,
  table,
  toolbar,
  one,
  localDate,
  addDays,
  dateLabel,
  timeLabel,
  status,
  searchBox,
} from '../../shared/ui.js';
import { normalizeSearch } from '../../shared/validation.js';
import { calendar, weekStart } from './calendar.js';
import { appointmentForm } from './form.js';

const labels = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  pending: 'Pendente',
  present: 'Presente',
  absent: 'Ausente',
};
export async function mount(root, data) {
  const admin = data.profile.role === 'admin',
    filters = el('form', { className: 'agenda-filters' }),
    list = el('div'),
    feedback = status('');
  let day = localDate(),
    mode = 'calendar';
  const from = field(filters, 'from', 'De', { type: 'date', value: localDate() }),
    to = field(filters, 'to', 'Até', { type: 'date', value: addDays(localDate(), 6) });
  const state = field(filters, 'status', 'Situação', {
    required: false,
    options: [
      { value: '', label: 'Todas' },
      ...['scheduled', 'confirmed', 'completed', 'cancelled'].map((v) => ({
        value: v,
        label: labels[v],
      })),
    ],
  });
  const submit = el('button', { type: 'submit', className: 'secondary-button' }, 'Atualizar');
  const modeBar = el('div', {
    className: 'agenda-views',
    role: 'group',
    'aria-label': 'Visualização da agenda',
  });
  const views = [
    ['calendar', 'Calendário'],
    ['list', 'Lista por período'],
  ];
  const modeButtons = views.map(([key, label]) =>
    button(label, () => {
      mode = key;
      load();
    }),
  );
  modeBar.append(...modeButtons);
  filters.append(submit);
  let records = [],
    search = '',
    loadRevision = 0;
  async function load() {
    const revision = ++loadRevision;
    modeButtons.forEach((b, index) =>
      b.setAttribute('aria-pressed', String(mode === views[index][0])),
    );
    for (const element of [from.parentElement, to.parentElement, submit])
      element.hidden = mode === 'calendar';
    submit.disabled = true;
    feedback.textContent = 'Carregando agenda…';
    try {
      const monday = weekStart(day);
      const range =
        mode === 'calendar'
          ? { from: monday, to: addDays(monday, 6) }
          : { from: from.value, to: to.value };
      const result = await data.listAppointments(range);
      if (revision !== loadRevision) return;
      records = result;
      feedback.textContent = '';
      render();
    } catch (error) {
      if (revision === loadRevision) {
        list.replaceChildren();
        feedback.textContent = error.message;
      }
    } finally {
      if (revision === loadRevision) {
        submit.disabled = false;
      }
    }
  }
  filters.addEventListener('submit', (event) => {
    event.preventDefault();
    load();
  });
  state.addEventListener('change', render);
  function edit(a) {
    appointmentForm(data, mode === 'calendar' ? day : from.value, a, (savedDay) => {
      day = savedDay;
      if (mode === 'list' && (day < from.value || day > to.value)) {
        from.value = day;
        to.value = addDays(day, 6);
      }
      return load();
    });
  }
  function rowActions(a) {
    const s = one(a.assignment),
      at = one(a.attendance),
      now = Date.now();
    const actions = el('div', { className: 'row-actions' });
    if (admin && ['pending', 'cancelled'].includes(at.status))
      actions.append(button('Editar consulta', () => edit(a)));
    if (['scheduled', 'confirmed'].includes(a.status)) {
      const pending = at.status === 'pending' || !at.status;
      const inWindow =
        now >= Date.parse(a.starts_at) - 1800000 && now <= Date.parse(a.ends_at) + 86400000;
      if (admin || (pending && inWindow && s.is_active)) {
        actions.append(
          button(at.status === 'present' ? 'Presente ✓' : 'Check-in', () => record(a, 'present')),
        );
        if (admin || now >= Date.parse(a.ends_at))
          actions.append(
            button(at.status === 'absent' ? 'Ausente ✓' : 'Registrar ausência', () =>
              record(a, 'absent'),
            ),
          );
      }
    }
    if (!actions.childElementCount) actions.append(el('span', {}, 'Somente consulta'));
    return actions;
  }
  function render() {
    const rows = records.filter(
      (a) =>
        (!state.value || a.status === state.value) &&
        normalizeSearch(
          one(a.assignment).student?.full_name +
            ' ' +
            one(a.assignment).professional?.full_name +
            ' ' +
            one(a.assignment).service?.name,
        ).includes(normalizeSearch(search)),
    );
    if (mode === 'calendar') {
      list.replaceChildren(
        calendar(
          day,
          rows,
          (selected) => {
            day = selected;
            load();
          },
          rowActions,
          labels,
        ),
      );
      return;
    }
    list.replaceChildren(
      rows.length
        ? table(
            [
              'Data / horário',
              'Paciente',
              ...(admin ? ['Profissional'] : []),
              'Atendimento',
              'Consulta',
              'Presença',
              'Ações',
            ],
            rows.map((a) => {
              const s = one(a.assignment),
                at = one(a.attendance);
              return [
                el(
                  'div',
                  {},
                  dateLabel(a.starts_at),
                  el('br'),
                  timeLabel(a.starts_at) + ' – ' + timeLabel(a.ends_at),
                ),
                s.student?.full_name || 'Paciente',
                ...(admin ? [s.professional?.full_name || 'Profissional'] : []),
                s.service?.name || 'Atendimento',
                labels[a.status] || a.status,
                labels[at.status] || 'Pendente',
                rowActions(a),
              ];
            }),
          )
        : status('Nenhum atendimento no período ou nos filtros selecionados.'),
    );
  }
  async function record(a, next) {
    if (
      !confirm(
        next === 'present'
          ? 'Confirmar presença neste atendimento?'
          : 'Confirmar que o paciente não compareceu?',
      )
    )
      return;
    const buttons = [...list.querySelectorAll('button')];
    buttons.forEach((b) => (b.disabled = true));
    try {
      await data.recordAttendance(a.id, next);
      await load();
    } catch (error) {
      feedback.textContent = error.message;
    } finally {
      buttons.forEach((b) => (b.disabled = false));
    }
  }
  root.append(
    toolbar(
      admin ? 'Agenda do espaço' : 'Minha agenda',
      admin
        ? 'Gerencie horários e acompanhe a presença dos pacientes.'
        : 'Check-in a partir de 30 minutos antes; ausência após o fim. Registros disponíveis até 24 horas após a sessão.',
      admin ? button('Novo agendamento', () => edit(), 'new-student-button') : null,
    ),
    modeBar,
    el(
      'div',
      { className: 'calendar-filters' },
      filters,
      searchBox((v) => {
        search = v;
        render();
      }),
    ),
    feedback,
    list,
  );
  await load();
}

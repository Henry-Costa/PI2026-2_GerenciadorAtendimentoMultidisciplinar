import {
  addDays,
  button,
  dateLabel,
  el,
  inputDateTime,
  localDate,
  timeLabel,
} from '../../shared/ui.js';

const dayName = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' });
const fullDay = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});
const noon = (day) => new Date(day + 'T12:00Z');

export function weekStart(day) {
  return addDays(day, -((noon(day).getUTCDay() + 6) % 7));
}

export function calendar(day, records, navigate, actions, labels) {
  const start = weekStart(day);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const byDay = new Map(days.map((key) => [key, []]));
  for (const record of records)
    byDay.get(inputDateTime(record.starts_at).slice(0, 10))?.push(record);
  const nav = el('div', { className: 'week-tools' });
  function arrow(label, symbol, step) {
    return el(
      'button',
      {
        type: 'button',
        className: 'secondary-button',
        'aria-label': label,
        onclick: () => navigate(addDays(day, step)),
      },
      symbol,
    );
  }
  const picker = el('input', {
    type: 'date',
    value: day,
    'aria-label': 'Ir para data',
    onchange: (event) => {
      if (event.target.value) navigate(event.target.value);
    },
  });
  nav.append(
    arrow('Semana anterior', '‹', -7),
    button('Hoje', () => navigate(localDate())),
    arrow('Próxima semana', '›', 7),
    picker,
  );
  const week = el('div', {
    className: 'agenda-day-strip',
    role: 'group',
    'aria-label': 'Dias da semana',
  });
  for (const key of days) {
    const total = byDay.get(key).length;
    week.append(
      el(
        'button',
        {
          type: 'button',
          className: 'week-day agenda-day-option' + (day === key ? ' is-selected' : ''),
          'aria-pressed': String(day === key),
          'aria-label': dateLabel(key) + ', ' + total + ' consultas',
          onclick: () => navigate(key),
        },
        el('span', { className: 'agenda-day-weekday' }, dayName.format(noon(key))),
        el('strong', {}, dateLabel(key).slice(0, 5)),
        el('span', { className: 'agenda-day-count' }, total),
      ),
    );
  }
  const events = byDay.get(day);
  const agenda = el(
    'section',
    { className: 'daily-agenda', 'aria-label': 'Consultas do dia' },
    el(
      'div',
      { className: 'day-heading' },
      el('h3', {}, fullDay.format(noon(day))),
      el('span', {}, events.length + (events.length === 1 ? ' consulta' : ' consultas')),
    ),
  );
  if (!events.length)
    agenda.append(
      el(
        'p',
        { className: 'calendar-empty' },
        'Nenhuma consulta neste dia com os filtros selecionados.',
      ),
    );
  for (const event of events) {
    const link = event.assignment;
    const duration = Math.round((Date.parse(event.ends_at) - Date.parse(event.starts_at)) / 60000);
    const tags = [
      link.service.name,
      link.professional?.full_name,
      event.session_units === 2 ? 'Sessão dupla' : null,
      event.series_id || event.recurring ? 'Semanal' : null,
    ].filter(Boolean);
    agenda.append(
      el(
        'article',
        { className: 'calendar-event', 'data-state': event.status },
        el(
          'div',
          { className: 'event-time' },
          el('strong', {}, timeLabel(event.starts_at)),
          el('span', {}, 'até ' + timeLabel(event.ends_at)),
        ),
        el(
          'div',
          { className: 'event-info' },
          el('h4', {}, link.student.full_name),
          el('p', {}, tags.join(' · ')),
          el(
            'small',
            {},
            duration +
              ' min · ' +
              labels[event.status] +
              (['present', 'absent'].includes(event.attendance?.status)
                ? ' · ' + labels[event.attendance.status]
                : ''),
          ),
        ),
        actions(event),
      ),
    );
  }
  return el(
    'div',
    { className: 'week-calendar' },
    el(
      'div',
      { className: 'week-heading' },
      el('p', { className: 'agenda-period' }, dateLabel(start) + ' a ' + dateLabel(days.at(-1))),
      nav,
    ),
    week,
    agenda,
  );
}

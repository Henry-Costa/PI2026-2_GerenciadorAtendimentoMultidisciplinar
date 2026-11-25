import { addDays, el, localDate } from '../../shared/ui.js';
import { dateOf, distribution, upcomingList } from '../agenda/summary.js';

export async function mount(root, data) {
  root.className = 'dashboard-view';
  const today = localDate();
  const records = await data.listAppointments({ from: today, to: addDays(today, 6) });
  const active = records.filter((row) => row.status !== 'cancelled');
  const counts = [
    ['Próximos 7 dias', active.length, 'metric-upcoming'],
    [
      'Aguardando confirmação',
      active.filter((row) => row.status === 'scheduled').length,
      'metric-pending',
    ],
    [
      'Confirmados nos próximos 7 dias',
      active.filter((row) => row.status === 'confirmed').length,
      'metric-confirmed',
    ],
    ['Atendimentos hoje', active.filter((row) => dateOf(row) === today).length, 'metric-today'],
  ];
  const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: 'UTC' }).format(
    new Date(today + 'T12:00Z'),
  );
  root.append(
    el('p', { className: 'dashboard-date' }, date),
    el('h2', {}, 'Olá, ' + data.profile.full_name.split(' ')[0] + '!'),
    el('p', {}, 'Veja o resumo dos atendimentos do espaço.'),
    el(
      'dl',
      { className: 'dashboard-metrics' },
      counts.map(([label, value, id]) =>
        el('div', {}, el('dt', {}, label), el('dd', { id }, value)),
      ),
    ),
    distribution('Atendimentos por área', active, (a) => a.service.name, 'Próximos 7 dias'),
    el('a', { href: '#relatorios', className: 'report-link' }, 'Relatórios completos'),
    el(
      'section',
      { className: 'dashboard-agenda' },
      el('h3', {}, 'Agenda de atendimentos'),
      upcomingList(records),
    ),
  );
}

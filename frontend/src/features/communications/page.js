import {
  addDays,
  button,
  dateLabel,
  dialog,
  el,
  field,
  localDate,
  table,
  timeLabel,
} from '../../shared/ui.js';
import { badge, dateOf } from '../agenda/summary.js';

export async function mount(root, data) {
  root.className = 'communications-view';
  const today = localDate();
  const records = (await data.listAppointments({ from: today, to: addDays(today, 6) })).filter(
    (row) => ['scheduled', 'confirmed'].includes(row.status),
  );
  const controls = el('div', { className: 'communication-controls' });
  const template = field(controls, 'template', 'Mensagem', {
    required: false,
    options: [
      { value: 'confirmation', label: 'Confirmação de atendimento' },
      { value: 'reminder', label: 'Lembrete de atendimento' },
    ],
  });
  const period = field(controls, 'period', 'Período', {
    value: 7,
    required: false,
    options: [
      { value: 7, label: 'Próximos 7 dias' },
      { value: 1, label: 'Hoje' },
    ],
  });
  const list = el('div');
  const recipient = (row) =>
    row.reminder_recipient === 'student' ? 'Aluno' : 'Responsável financeiro';
  function preview(row) {
    const { student, service, professional } = row.assignment;
    const message =
      template.value === 'reminder' ? 'Lembramos do atendimento' : 'Confirmamos o agendamento';
    dialog(
      'Prévia da mensagem',
      el(
        'div',
        {},
        el('p', {}, el('strong', {}, 'Destinatário'), ' · ' + recipient(row)),
        el(
          'p',
          {},
          'Olá! ' +
            message +
            ' de ' +
            student.full_name +
            ' para ' +
            dateLabel(row.starts_at) +
            ', às ' +
            timeLabel(row.starts_at) +
            ', com ' +
            professional.full_name +
            ' (' +
            service.name +
            ').',
        ),
      ),
    );
  }
  function render() {
    const through = addDays(today, Number(period.value) - 1);
    const rows = records.filter((row) => dateOf(row) <= through);
    list.replaceChildren(
      rows.length
        ? table(
            ['Data', 'Horário', 'Aluno', 'Destinatário', 'Status', 'Ações'],
            rows.map((row) => [
              dateLabel(row.starts_at),
              timeLabel(row.starts_at),
              row.assignment.student.full_name,
              recipient(row),
              badge(row.status),
              button('Ver mensagem', () => preview(row), 'student-consult-button'),
            ]),
          )
        : el('p', { className: 'agenda-period' }, 'Nenhum lembrete para preparar no período.'),
    );
  }
  period.addEventListener('change', render);
  root.append(
    el(
      'header',
      { className: 'communication-header' },
      el(
        'div',
        {},
        el('h2', {}, 'Painel de lembretes'),
        el('p', {}, 'Veja a prévia das mensagens de agendamento com os dados da demonstração.'),
      ),
      controls,
    ),
    list,
  );
  render();
}

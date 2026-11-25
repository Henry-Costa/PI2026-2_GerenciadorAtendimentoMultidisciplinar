import {
  el,
  button,
  field,
  table,
  toolbar,
  money,
  one,
  localDate,
  addDays,
  dateLabel,
  status,
} from '../../shared/ui.js';
import { csvCell } from '../../shared/validation.js';
import { distribution } from '../agenda/summary.js';
export async function mount(root, data) {
  root.className = 'reports-view feature-page';
  const form = el('form', { className: 'agenda-filters' }),
    from = field(form, 'from', 'De', { type: 'date', value: localDate() }),
    to = field(form, 'to', 'Até', { type: 'date', value: addDays(localDate(), 6) }),
    list = el('div'),
    charts = el('div', { className: 'report-distributions' }),
    metrics = el('dl', { className: 'dashboard-metrics' }),
    feedback = status('');
  form.append(el('button', { type: 'submit', className: 'secondary-button' }, 'Gerar relatório'));
  let records = [],
    exportButton = button('Exportar CSV', () => exportCSV());
  let loadedRange = {},
    revision = 0;
  exportButton.disabled = true;
  function exportCSV() {
    const rows = [
      ['Data', 'Profissional', 'Atendimento', 'Situação', 'Presença', 'Valor cobrado'],
      ...records.map((a) => [
        dateLabel(a.starts_at),
        one(a.assignment).professional?.full_name,
        one(a.assignment).service?.name,
        a.status,
        one(a.attendance).status,
        a.charged_amount,
      ]),
    ];
    const blob = new Blob(['\uFEFF' + rows.map((row) => row.map(csvCell).join(';')).join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob),
      a = el('a', {
        href: url,
        download: 'atendimentos-' + loadedRange.from + '-' + loadedRange.to + '.csv',
      });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function load() {
    const current = ++revision,
      range = { from: from.value, to: to.value };
    feedback.textContent = 'Carregando relatório…';
    exportButton.disabled = true;
    try {
      const result = await data.listReport(range);
      if (current !== revision) return;
      records = result;
      loadedRange = range;
      const total = records
        .filter((a) => a.status !== 'cancelled')
        .reduce((sum, a) => sum + Number(a.charged_amount), 0);
      metrics.replaceChildren(
        ...[
          ['Consultas no período', records.length],
          ['Aguardando confirmação', records.filter((a) => a.status === 'scheduled').length],
          ['Confirmados', records.filter((a) => a.status === 'confirmed').length],
          [
            'Alunos atendidos',
            new Set(
              records
                .filter((a) => a.attendance.status === 'present')
                .map((a) => a.assignment.student_id),
            ).size,
          ],
          ['Presenças', records.filter((a) => one(a.attendance).status === 'present').length],
          ['Ausências', records.filter((a) => one(a.attendance).status === 'absent').length],
          ['Valor previsto (sem canceladas)', money(total)],
        ].map(([label, v]) => el('div', {}, el('dt', {}, label), el('dd', {}, v))),
      );
      charts.replaceChildren(
        distribution('Atendimentos por área', records, (a) => a.service.name),
        distribution('Atendimentos por profissional', records, (a) => a.professional.full_name),
      );
      list.replaceChildren(
        records.length
          ? table(
              ['Data', 'Profissional', 'Atendimento', 'Consulta', 'Presença', 'Valor'],
              records.map((a) => [
                dateLabel(a.starts_at),
                one(a.assignment).professional?.full_name || '—',
                one(a.assignment).service?.name || '—',
                {
                  scheduled: 'Agendado',
                  confirmed: 'Confirmado',
                  completed: 'Concluído',
                  cancelled: 'Cancelado',
                }[a.status],
                {
                  pending: 'Pendente',
                  present: 'Presente',
                  absent: 'Ausente',
                  cancelled: 'Cancelado',
                }[one(a.attendance).status] || 'Pendente',
                money(a.charged_amount),
              ]),
            )
          : status('Nenhum atendimento no período.'),
      );
      feedback.textContent = 'Valores previstos não representam pagamentos recebidos.';
      exportButton.disabled = false;
    } catch (error) {
      if (current !== revision) return;
      records = [];
      list.replaceChildren();
      metrics.replaceChildren();
      charts.replaceChildren();
      feedback.textContent = error.message;
    }
  }
  form.addEventListener('input', () => {
    revision++;
    exportButton.disabled = true;
    feedback.textContent = 'Gere o relatório para atualizar o período selecionado.';
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    load();
  });
  root.append(
    toolbar(
      'Relatório de atendimentos',
      'Acompanhamento da agenda e valores previstos no período.',
      exportButton,
    ),
    form,
    feedback,
    metrics,
    charts,
    list,
  );
  await load();
}

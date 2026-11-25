import {
  addDays,
  dateLabel,
  dialog,
  el,
  field,
  formSubmit,
  group,
  inputDateTime,
  instant,
  status,
} from '../../shared/ui.js';
import { endOfSession, maxOccurrences, unitMinutes } from './scheduling.js';

export function appointmentForm(data, day, appointment, onSaved) {
  const form = el('form', { className: 'feature-form' });
  const d = dialog(appointment ? 'Editar consulta' : 'Novo agendamento', form);
  const links = data.listAssignments();
  if (appointment && !links.some((s) => s.id === appointment.assignment_id))
    links.push(appointment.assignment);
  if (!links.length) {
    form.append(status('Cadastre um paciente com vínculo ativo antes de agendar.'));
    return;
  }
  const binding = field(form, 'assignment_id', 'Paciente / atendimento / profissional', {
    value: appointment?.assignment_id,
    options: [
      { value: '', label: 'Selecione' },
      ...links.map((s) => ({
        value: s.id,
        label: [s.student.full_name, s.service.name, s.professional.full_name].join(' · '),
      })),
    ],
  });
  const timing = group(form, 'Horário da consulta');
  const start = field(timing, 'starts_at', 'Início (horário de Brasília)', {
    type: 'datetime-local',
    value: appointment ? inputDateTime(appointment.starts_at) : day + 'T09:00',
  });
  const units = field(timing, 'session_units', 'Sessão', {
    value: appointment?.session_units || 1,
    options: [
      { value: 1, label: 'Simples' },
      { value: 2, label: 'Dupla · dois períodos consecutivos' },
    ],
  });
  const end = field(timing, 'ends_at', 'Término previsto', {
    type: 'datetime-local',
    readOnly: true,
    required: false,
  });
  const amount = field(timing, 'charged_amount', 'Valor cobrado por consulta (R$)', {
    type: 'number',
    min: 0,
    step: '0.01',
    value: appointment?.charged_amount,
    max: '9999999999.99',
  });
  const summary = el('p', { className: 'schedule-summary full-width', 'aria-live': 'polite' });
  timing.append(summary);
  let repeat, count, seriesNote;
  if (!appointment) {
    const series = group(form, 'Repetição');
    repeat = field(series, 'repeat', 'Frequência', {
      options: [
        { value: 'once', label: 'Única' },
        { value: 'weekly', label: 'Semanal' },
      ],
    });
    count = field(series, 'occurrences', 'Número de consultas (inclui a primeira)', {
      type: 'number',
      value: 4,
      min: 2,
      max: maxOccurrences,
      step: 1,
    });
    seriesNote = el('p', { className: 'field-note full-width', 'aria-live': 'polite' });
    series.append(seriesNote);
    repeat.addEventListener('change', preview);
    count.addEventListener('input', preview);
  } else if (appointment.series_id) {
    form.append(
      el(
        'p',
        { className: 'field-note' },
        'A edição ou o cancelamento vale apenas para esta ocorrência da série semanal.',
      ),
    );
  }
  const details = group(form, 'Detalhes da consulta');
  const state = field(details, 'status', 'Situação da consulta', {
    value: appointment?.status || 'scheduled',
    options: [
      { value: 'scheduled', label: 'Agendado' },
      { value: 'confirmed', label: 'Confirmado' },
      ...(appointment ? [{ value: 'cancelled', label: 'Cancelado' }] : []),
    ],
  });
  const recipient = field(details, 'reminder_recipient', 'Destinatário do lembrete', {
    value: appointment?.reminder_recipient || 'financial_responsible',
    options: [
      { value: 'financial_responsible', label: 'Responsável financeiro' },
      { value: 'student', label: 'Paciente' },
    ],
  });
  const reason = field(details, 'cancellation_reason', 'Motivo do cancelamento', {
    value: appointment?.cancellation_reason,
    required: false,
    maxLength: 500,
  });
  function cancellation() {
    reason.required = state.value === 'cancelled';
    reason.parentElement.hidden = !reason.required;
  }
  function preview() {
    const link = links.find((s) => s.id === binding.value);
    const minutes = link ? unitMinutes(link, appointment) * Number(units.value) : 0;
    end.value =
      minutes && start.value ? inputDateTime(endOfSession(instant(start.value), minutes, 1)) : '';
    summary.textContent = minutes
      ? 'Tempo reservado por consulta: ' + minutes + ' minutos.'
      : 'Selecione o atendimento para calcular a duração.';
    if (repeat) {
      const weekly = repeat.value === 'weekly';
      count.disabled = !weekly;
      count.parentElement.hidden = !weekly;
      seriesNote.hidden = !weekly;
      seriesNote.textContent =
        weekly && start.value && count.validity.valid
          ? 'Última consulta em ' +
            dateLabel(addDays(start.value.slice(0, 10), (Number(count.value) - 1) * 7)) +
            ', no mesmo horário.'
          : '';
    }
  }
  function suggestAmount() {
    const link = links.find((s) => s.id === binding.value);
    amount.value = link ? (link.agreed_amount * Number(units.value)).toFixed(2) : '';
    return link;
  }
  binding.addEventListener('change', () => {
    const link = suggestAmount();
    if (link) recipient.value = link.reminder_recipient;
    preview();
  });
  units.addEventListener('change', () => {
    suggestAmount();
    preview();
  });
  start.addEventListener('input', preview);
  state.addEventListener('change', cancellation);
  cancellation();
  preview();
  formSubmit(
    form,
    () =>
      data.saveAppointment(appointment?.id, {
        assignment_id: binding.value,
        starts_at: instant(start.value),
        session_units: Number(units.value),
        occurrences: repeat?.value === 'weekly' ? Number(count.value) : 1,
        charged_amount: Number(amount.value),
        status: state.value,
        reminder_recipient: recipient.value,
        cancellation_reason: state.value === 'cancelled' ? reason.value.trim() : '',
      }),
    () => {
      d.close();
      return onSaved(start.value.slice(0, 10));
    },
  );
}

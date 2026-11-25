import { addDays, dateLabel, inputDateTime, instant, timeLabel } from '../../shared/ui.js';

export const maxOccurrences = 52;

export function unitMinutes(assignment, previous) {
  if (previous?.assignment_id === assignment.id && previous.unit_minutes)
    return previous.unit_minutes;
  return Number(assignment.service.default_duration_minutes);
}

export function endOfSession(start, minutes, units) {
  return new Date(Date.parse(start) + minutes * units * 60000).toISOString();
}

export function planAppointments(id, input, previous, assignments, appointments) {
  const byId = new Map(assignments.map((a) => [a.id, a]));
  const assignment = byId.get(input.assignment_id);
  if (!assignment || (!assignment.available && input.status !== 'cancelled'))
    throw new Error('Escolha um vínculo ativo.');
  if (previous && !['pending', 'cancelled'].includes(previous.attendance.status))
    throw new Error('Esta consulta tem registro de presença finalizado.');
  if (!['scheduled', 'confirmed', 'cancelled'].includes(input.status))
    throw new Error('Selecione a situação da consulta.');
  if (input.status === 'cancelled' && !input.cancellation_reason?.trim())
    throw new Error('Informe o motivo do cancelamento.');

  const units = input.session_units ?? 1;
  const minutes = unitMinutes(assignment, previous);
  if (![1, 2].includes(units) || !Number.isInteger(minutes) || minutes < 15 || minutes > 480)
    throw new Error('Confira a duração cadastrada e a modalidade da sessão.');
  if (!Number.isFinite(Date.parse(input.starts_at)))
    throw new Error('Informe o início da consulta.');
  const count = input.occurrences ?? 1;
  if (!Number.isInteger(count) || count < 1 || count > maxOccurrences || (id && count !== 1))
    throw new Error('Confira a quantidade de ocorrências da série.');
  const local = inputDateTime(input.starts_at);
  const seriesId = previous?.series_id ?? (count > 1 ? crypto.randomUUID() : null);
  const planned = [];
  for (let index = 0; index < count; index++) {
    const day = addDays(local.slice(0, 10), index * 7);
    const start = instant(day + local.slice(10));
    const end = endOfSession(start, minutes, units);
    if (input.status !== 'cancelled') {
      const conflict = appointments.find((other) => {
        if (other.id === id || other.status === 'cancelled') return false;
        const link = byId.get(other.assignment_id);
        return (
          (link.professional_id === assignment.professional_id ||
            link.student_id === assignment.student_id) &&
          Date.parse(start) < Date.parse(other.ends_at) &&
          Date.parse(end) > Date.parse(other.starts_at)
        );
      });
      if (conflict) {
        const who =
          byId.get(conflict.assignment_id).professional_id === assignment.professional_id
            ? assignment.professional.full_name
            : assignment.student.full_name;
        throw new Error(
          who +
            ' já tem consulta em ' +
            dateLabel(conflict.starts_at) +
            ', das ' +
            timeLabel(conflict.starts_at) +
            ' às ' +
            timeLabel(conflict.ends_at) +
            '.' +
            (count > 1 ? ' A série inteira continua sem agendar.' : ' Escolha outro horário.'),
        );
      }
    }
    planned.push({
      id: id || crypto.randomUUID(),
      assignment_id: assignment.id,
      starts_at: start,
      ends_at: end,
      session_units: units,
      unit_minutes: minutes,
      series_id: seriesId,
      charged_amount: input.charged_amount,
      reminder_recipient: input.reminder_recipient,
      status: input.status,
      cancellation_reason: input.cancellation_reason || '',
      attendance: { status: input.status === 'cancelled' ? 'cancelled' : 'pending' },
    });
  }
  return planned;
}

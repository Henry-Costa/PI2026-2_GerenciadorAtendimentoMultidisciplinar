import test from 'node:test';
import assert from 'node:assert/strict';
import { planAppointments } from '../src/features/agenda/scheduling.js';
import { demo } from '../src/data/demo.js';

const a = {
  id: '1',
  student_id: 'a',
  professional_id: 'p',
  available: true,
  service: { default_duration_minutes: 45 },
  professional: { full_name: 'Profissional A' },
  student: { full_name: 'Paciente A' },
};
const links = [
  a,
  { ...a, id: '2', student_id: 'b' },
  { ...a, id: '3', professional_id: 'q' },
  { ...a, id: '4', student_id: 'b', professional_id: 'q' },
];
const at = (time) => '2030-04-01T' + time + ':00-03:00';
const base = {
  assignment_id: '1',
  starts_at: at('09:00'),
  charged_amount: 100,
  status: 'scheduled',
};
const plan = (changes, rows = []) =>
  planAppointments(null, { ...base, ...changes }, null, links, rows);

test('45 minutos reservam o intervalo completo para paciente e profissional', () => {
  const rows = plan({});
  for (const assignment_id of ['2', '3']) {
    assert.throws(() => plan({ assignment_id, starts_at: at('09:44') }, rows), /já tem consulta/);
    assert.throws(() => plan({ assignment_id, starts_at: at('08:30') }, rows), /já tem consulta/);
    assert.equal(plan({ assignment_id, starts_at: at('09:45') }, rows).length, 1);
  }
  assert.equal(plan({ assignment_id: '4' }, rows).length, 1);
});
test('sessão dupla reserva 90 minutos e preserva a duração original após alteração no catálogo', () => {
  const [row] = plan({ session_units: 2, ends_at: at('09:10') });
  assert.equal(Date.parse(row.ends_at), Date.parse(at('10:30')));
  assert.throws(() => plan({ starts_at: at('10:29') }, [row]), /já tem consulta/);
  const [edited] = planAppointments(
    row.id,
    { ...base, session_units: 2 },
    row,
    [{ ...a, service: { default_duration_minutes: 60 } }],
    [row],
  );
  assert.equal(edited.ends_at, row.ends_at);
});
test('a série é atômica, e cancelar uma ocorrência libera apenas aquele horário', () => {
  const admin = demo('admin'),
    query = { from: '2030-04-01', to: '2030-04-30' };
  const input = { ...base, assignment_id: 'vinculo-b' };
  admin.saveAppointment(null, { ...input, starts_at: '2030-04-15T09:00:00-03:00' });
  assert.throws(() => admin.saveAppointment(null, { ...input, occurrences: 3 }), /15\/04\/2030/);
  assert.equal(admin.listAppointments(query).length, 1);
  const [blocker] = admin.listAppointments(query);
  admin.saveAppointment(blocker.id, {
    ...blocker,
    status: 'cancelled',
    cancellation_reason: 'Remarcada',
  });
  admin.saveAppointment(null, { ...input, occurrences: 3 });
  const series = admin.listAppointments(query).filter((r) => r.series_id);
  assert.equal(series.length, 3);
  assert.equal(new Set(series.map((r) => r.series_id)).size, 1);
  assert.deepEqual(
    series.map((r) => r.starts_at),
    [1, 8, 15].map((d) => '2030-04-' + String(d).padStart(2, '0') + 'T12:00:00.000Z'),
  );
  admin.saveAppointment(series[1].id, {
    ...series[1],
    status: 'cancelled',
    cancellation_reason: 'Desmarcada',
  });
  admin.saveAppointment(null, { ...input, starts_at: series[1].starts_at });
  assert.throws(() => admin.saveAppointment(null, input), /já tem consulta/);
  assert.equal(admin.listReport(query).filter((r) => r.status === 'scheduled').length, 3);
  assert.throws(() => demo('user').saveAppointment(null, input), /admin/);
});

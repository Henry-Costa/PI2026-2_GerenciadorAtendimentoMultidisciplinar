import { addDays, inputDateTime, instant, localDate } from '../shared/ui.js';
import { digits, normalizeSearch, validCNS, validCPF } from '../shared/validation.js';

import { planAppointments } from '../features/agenda/scheduling.js';

const services = [
  {
    id: 'psicopedagogia',
    name: 'Psicopedagogia',
    default_amount: 150,
    default_duration_minutes: 60,
    is_active: true,
  },
  {
    id: 'fonoaudiologia',
    name: 'Fonoaudiologia',
    default_amount: 130,
    default_duration_minutes: 45,
    is_active: true,
  },
];
const professionals = [
  {
    id: 'admin',
    full_name: 'Admin de demonstração',
    role: 'admin',
    is_active: true,
    specialty: 'Coordenação',
    services: [],
  },
  {
    id: 'profissional',
    full_name: 'Camila (exemplo)',
    role: 'user',
    is_active: true,
    specialty: 'Psicopedagogia',
    services: [{ service_type_id: services[0].id }],
  },
  {
    id: 'outro-profissional',
    full_name: 'Renato (exemplo)',
    role: 'user',
    is_active: true,
    specialty: 'Fonoaudiologia',
    services: [{ service_type_id: services[1].id }],
  },
];
const today = localDate();
const patients = [
  {
    id: 'paciente-a',
    full_name: 'Paciente exemplo A',
    birth_date: '2018-02-14',
    care_started_at: addDays(today, -40),
    assignments: [
      {
        id: 'vinculo-a',
        professional_id: professionals[1].id,
        service_type_id: services[0].id,
        agreed_amount: 150,
        reminder_recipient: 'financial_responsible',
        is_active: true,
      },
    ],
  },
  {
    id: 'paciente-b',
    full_name: 'Paciente exemplo B',
    birth_date: '2016-06-20',
    care_started_at: addDays(today, -40),
    assignments: [
      {
        id: 'vinculo-b',
        professional_id: professionals[2].id,
        service_type_id: services[1].id,
        agreed_amount: 130,
        reminder_recipient: 'financial_responsible',
        is_active: true,
      },
    ],
  },
];
const now = Math.floor(Date.now() / 60000) * 60000;
const sampleAppointment = (id, assignment_id, start, duration, charged_amount) => ({
  id,
  assignment_id,
  starts_at: new Date(start).toISOString(),
  ends_at: new Date(start + duration * 60000).toISOString(),
  unit_minutes: duration,
  session_units: 1,
  status: 'confirmed',
  charged_amount,
  reminder_recipient: 'financial_responsible',
  cancellation_reason: '',
  attendance: { status: 'pending' },
});
const demoStart = (minutes) => {
  const then = now + minutes * 60000;
  return inputDateTime(then).slice(0, 10) === today
    ? then
    : Date.parse(instant(today + (minutes < 0 ? 'T00:00' : 'T23:59')));
};
const appointments = [
  sampleAppointment('consulta-a', 'vinculo-a', demoStart(-5), 60, 150),
  sampleAppointment('consulta-b', 'vinculo-b', demoStart(60), 45, 130),
  sampleAppointment('consulta-passada', 'vinculo-a', now - 110 * 60000, 60, 150),
];

const copy = (value) => structuredClone(value);
const find = (list, id) => list.find((row) => row.id === id);
const get = (list, id) => {
  const row = find(list, id);
  if (!row) throw new Error('Registro não encontrado.');
  return row;
};
function save(list, id, record) {
  if (id) get(list, id);
  const next = { ...copy(record), id: id || crypto.randomUUID() };
  if (id)
    list.splice(
      list.findIndex((row) => row.id === id),
      1,
      next,
    );
  else list.push(next);
}
function requireAdmin(role) {
  if (role !== 'admin') throw new Error('Esta ação é reservada ao perfil admin da demonstração.');
}
function unique(list, id, read, value, error) {
  if (list.some((row) => row.id !== id && read(row) === value)) throw new Error(error);
}
function cpf(value, field = 'CPF') {
  if (!validCPF(value)) throw new Error(field + ' inválido.');
  return digits(value);
}
function phone(value, field) {
  const number = digits(value);
  if (value && !/^\d{10,15}$/.test(number)) throw new Error(field + ' inválido. Inclua o DDD.');
  return number;
}
function assignmentDetails() {
  return patients.flatMap((patient) =>
    patient.assignments.map((assignment) => {
      const professional = get(professionals, assignment.professional_id);
      const service = get(services, assignment.service_type_id);
      return {
        ...assignment,
        student_id: patient.id,
        student: { full_name: patient.full_name },
        professional: { full_name: professional.full_name },
        service,
        available: assignment.is_active && professional.is_active && service.is_active,
      };
    }),
  );
}
function filterAppointments(role, range) {
  const from = range ? Date.parse(instant(range.from + 'T00:00')) : -Infinity;
  const through = range ? Date.parse(instant(addDays(range.to, 1) + 'T00:00')) : Infinity;
  if (!(from < through)) throw new Error('Confira o período selecionado.');
  return appointments
    .map((row) => ({ ...row, assignment: get(assignmentDetails(), row.assignment_id) }))
    .filter(
      (row) =>
        (role === 'admin' || row.assignment.professional_id === 'profissional') &&
        Date.parse(row.starts_at) >= from &&
        Date.parse(row.starts_at) < through,
    )
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))
    .map((row) =>
      role === 'admin'
        ? row
        : {
            id: row.id,
            starts_at: row.starts_at,
            ends_at: row.ends_at,
            status: row.status,
            session_units: row.session_units,
            recurring: Boolean(row.series_id),
            attendance: row.attendance,
            assignment: {
              student: row.assignment.student,
              service: { name: row.assignment.service.name },
              is_active: row.assignment.is_active,
            },
          },
    );
}

export function demo(role) {
  const profile = professionals[role === 'admin' ? 0 : 1];
  const admin = () => requireAdmin(role);
  return {
    profile: { full_name: profile.full_name, role: profile.role },
    listPatients() {
      admin();
      return copy(patients);
    },
    getPatient(id) {
      admin();
      return copy(get(patients, id));
    },
    savePatient(id, input) {
      admin();
      const { assignment, ...patient } = copy(input);
      if (patient.full_name.length < 3) throw new Error('Informe o nome completo do paciente.');
      if (patient.care_started_at < patient.birth_date)
        throw new Error('O início dos atendimentos deve ser igual ou posterior ao nascimento.');
      patient.identifiers.cpf = cpf(patient.identifiers.cpf);
      unique(
        patients,
        id,
        (row) => row.identifiers?.cpf,
        patient.identifiers.cpf,
        'Este CPF já está cadastrado para outro paciente.',
      );
      if (patient.identifiers.cns && !validCNS(patient.identifiers.cns))
        throw new Error('CNS inválido.');
      patient.contact.phone = phone(patient.contact.phone, 'Telefone do paciente');
      patient.responsible.phone = phone(patient.responsible.phone, 'Telefone do responsável');
      patient.responsible.cpf = cpf(patient.responsible.cpf, 'CPF do responsável');
      if (patient.address.postal_code && digits(patient.address.postal_code).length !== 8)
        throw new Error('CEP inválido.');
      if (assignment.reminder_recipient === 'student' && !patient.contact.phone)
        throw new Error('Informe o telefone do paciente para selecioná-lo como destinatário.');
      const existing = id ? get(patients, id).assignments : [];
      const previous = assignment.id ? get(existing, assignment.id) : null;
      const professional = get(professionals, assignment.professional_id);
      const service = get(services, assignment.service_type_id);
      if (
        !professional.services.some((item) => item.service_type_id === service.id) ||
        (assignment.is_active && (!professional.is_active || !service.is_active))
      ) {
        throw new Error('Escolha um profissional e um tipo de atendimento compatíveis e ativos.');
      }
      if (
        previous &&
        appointments.some((row) => row.assignment_id === previous.id) &&
        (previous.professional_id !== professional.id || previous.service_type_id !== service.id)
      ) {
        throw new Error(
          'Este vínculo tem consultas. Crie um novo vínculo para trocar o profissional ou o atendimento.',
        );
      }
      const links = copy(existing);
      save(links, assignment.id, assignment);
      save(patients, id, { ...patient, assignments: links });
    },
    listProfessionals() {
      admin();
      return copy(professionals);
    },
    getProfessional(id) {
      admin();
      return copy(get(professionals, id));
    },
    saveProfessional(id, input) {
      admin();
      const { service_type_ids, ...professional } = copy(input);
      if (professional.full_name.length < 3)
        throw new Error('Informe o nome completo do profissional.');
      professional.email = professional.email.toLowerCase();
      professional.phone = phone(professional.phone, 'Telefone do profissional');
      professional.cpf = cpf(professional.cpf);
      unique(
        professionals,
        id,
        (row) => row.email,
        professional.email,
        'Email de profissional já cadastrado.',
      );
      unique(
        professionals,
        id,
        (row) => row.cpf,
        professional.cpf,
        'CPF de profissional já cadastrado.',
      );
      if (id === profile.id && (!professional.is_active || professional.role !== 'admin'))
        throw new Error('Mantenha ativo o perfil admin da demonstração.');
      if (id === 'profissional' && professional.role !== 'user')
        throw new Error('Mantenha o papel do profissional usado na demonstração.');
      if (
        assignmentDetails().some(
          (row) => row.professional_id === id && !service_type_ids.includes(row.service_type_id),
        )
      ) {
        throw new Error(
          'Este profissional ainda possui vínculos no tipo de atendimento que você tentou remover.',
        );
      }
      save(professionals, id, {
        ...professional,
        services: service_type_ids.map((service_type_id) => ({ service_type_id })),
      });
    },
    listServices() {
      admin();
      return copy(services);
    },
    saveService(id, input) {
      admin();
      if (!input.name) throw new Error('Informe o nome do atendimento.');
      unique(
        services,
        id,
        (row) => normalizeSearch(row.name),
        normalizeSearch(input.name),
        'Este atendimento já está cadastrado.',
      );
      save(services, id, input);
    },
    listAppointments(range) {
      return copy(filterAppointments(role, range));
    },
    listHistory(kind, id) {
      admin();
      return copy(filterAppointments(role).filter((row) => row.assignment[kind] === id));
    },
    listAssignments() {
      admin();
      return copy(assignmentDetails().filter((row) => row.available));
    },
    listReport(range) {
      admin();
      return copy(filterAppointments(role, range));
    },
    saveAppointment(id, input) {
      admin();
      const previous = id ? get(appointments, id) : null;
      const changes = planAppointments(id, input, previous, assignmentDetails(), appointments);
      if (previous) appointments.splice(appointments.indexOf(previous), 1, changes[0]);
      else appointments.push(...changes);
    },
    recordAttendance(id, status) {
      const row = get(appointments, id);
      const assignment = get(assignmentDetails(), row.assignment_id);
      if (
        !['present', 'absent'].includes(status) ||
        !['scheduled', 'confirmed'].includes(row.status)
      )
        throw new Error('Esta consulta não permite registrar presença.');
      if (role !== 'admin') {
        if (
          assignment.professional_id !== profile.id ||
          !assignment.is_active ||
          !profile.is_active
        )
          throw new Error('Esta consulta não está disponível no perfil selecionado.');
        const time = Date.now();
        if (row.attendance.status !== 'pending') throw new Error('A presença já foi registrada.');
        if (
          time < Date.parse(row.starts_at) - 30 * 60000 ||
          time > Date.parse(row.ends_at) + 24 * 3600000
        )
          throw new Error('O registro está fora do horário permitido.');
        if (status === 'absent' && time < Date.parse(row.ends_at))
          throw new Error('Registre ausência somente após o fim da consulta.');
      }
      row.attendance = { status, recorded_at: new Date().toISOString() };
    },
  };
}

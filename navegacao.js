const currentProfile = {
    name: "Bianca Petenão",
    role: "Administradora"
};

const dashboardToday = new Date();
dashboardToday.setHours(0, 0, 0, 0);

const demoAppointments = [
    { dayOffset: 0, time: "10:30", student: "Theo Ferreira", professional: "Camila Rocha", area: "Fonoaudiologia", status: "pending" },
    { dayOffset: 0, time: "09:00", student: "Alice Martins", professional: "Marina Costa", area: "Psicologia", status: "confirmed" },
    { dayOffset: 1, time: "14:00", student: "Lara Mendes", professional: "Marina Costa", area: "Psicologia", status: "confirmed" },
    { dayOffset: 2, time: "09:30", student: "Miguel Costa", professional: "Paula Nunes", area: "Terapia Ocupacional", status: "pending" },
    { dayOffset: 4, time: "15:00", student: "Sofia Ribeiro", professional: "Camila Rocha", area: "Fonoaudiologia", status: "confirmed" },
    { dayOffset: 6, time: "11:00", student: "Bento Oliveira", professional: "Paula Nunes", area: "Terapia Ocupacional", status: "pending" }
].map((appointment) => {
    const date = new Date(dashboardToday);
    date.setDate(date.getDate() + appointment.dayOffset);
    return { ...appointment, date };
});

const demoStudentProfiles = [
    { name: "Alice Martins", birthDate: "2017-03-14", guardian: "Renata Martins", contact: "(11) 90000-0001", area: "Psicologia", history: [{ dayOffset: -21, time: "09:00", professional: "Marina Costa", area: "Psicologia", status: "confirmed" }] },
    { name: "Theo Ferreira", birthDate: "2016-08-22", guardian: "Patrícia Ferreira", contact: "(11) 90000-0002", area: "Fonoaudiologia", history: [{ dayOffset: -14, time: "10:30", professional: "Camila Rocha", area: "Fonoaudiologia", status: "confirmed" }] },
    { name: "Lara Mendes", birthDate: "2018-01-09", guardian: "Eduardo Mendes", contact: "(11) 90000-0003", area: "Psicologia", history: [{ dayOffset: -28, time: "14:00", professional: "Marina Costa", area: "Psicologia", status: "confirmed" }] },
    { name: "Miguel Costa", birthDate: "2015-11-30", guardian: "Juliana Costa", contact: "(11) 90000-0004", area: "Terapia Ocupacional", history: [{ dayOffset: -35, time: "09:30", professional: "Paula Nunes", area: "Terapia Ocupacional", status: "confirmed" }] },
    { name: "Sofia Ribeiro", birthDate: "2017-06-05", guardian: "Marcelo Ribeiro", contact: "(11) 90000-0005", area: "Fonoaudiologia", history: [{ dayOffset: -42, time: "15:00", professional: "Camila Rocha", area: "Fonoaudiologia", status: "confirmed" }] },
    { name: "Bento Oliveira", birthDate: "2019-02-17", guardian: "Aline Oliveira", contact: "(11) 90000-0006", area: "Terapia Ocupacional", history: [{ dayOffset: -7, time: "11:00", professional: "Paula Nunes", area: "Terapia Ocupacional", status: "confirmed" }] }
].map((student) => ({
    ...student,
    history: student.history.map((appointment) => {
        const date = new Date(dashboardToday);
        date.setDate(date.getDate() + appointment.dayOffset);
        return { ...appointment, date };
    })
}));

function getUpcomingAppointments(appointments, today, days = 7) {
    const periodEnd = new Date(today);
    periodEnd.setDate(periodEnd.getDate() + days);
    return appointments
        .filter((appointment) => appointment.date >= today && appointment.date < periodEnd)
        .sort((first, second) => first.date - second.date || first.time.localeCompare(second.time));
}

function normalizeSearch(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

function filterAppointments(appointments, filters) {
    const search = normalizeSearch(filters.search);
    return appointments.filter((appointment) => {
        const text = normalizeSearch(`${appointment.student} ${appointment.professional} ${appointment.area}`);
        return text.includes(search)
            && (!filters.professional || appointment.professional === filters.professional)
            && (!filters.area || appointment.area === filters.area)
            && (!filters.status || appointment.status === filters.status);
    });
}

function renderCountChart(chart, appointments, property) {
    const counts = appointments.reduce((summary, appointment) => {
        summary[appointment[property]] = (summary[appointment[property]] || 0) + 1;
        return summary;
    }, {});
    const maximumCount = Math.max(1, ...Object.values(counts));
    chart.replaceChildren();
    Object.entries(counts).sort(([first], [second]) => first.localeCompare(second, "pt-BR")).forEach(([labelText, count]) => {
        const row = document.createElement("div");
        const label = document.createElement("span");
        const track = document.createElement("span");
        const bar = document.createElement("span");
        const value = document.createElement("strong");
        row.className = "area-chart-row";
        row.setAttribute("role", "listitem");
        label.className = "area-chart-label";
        label.textContent = labelText;
        track.className = "area-chart-track";
        bar.className = "area-chart-bar";
        bar.style.width = `${(count / maximumCount) * 100}%`;
        value.className = "area-chart-value";
        value.textContent = String(count);
        value.setAttribute("aria-label", `${count} atendimentos`);
        track.append(bar);
        row.append(label, track, value);
        chart.append(row);
    });
}

const quickLinksData = [
    { label: "Dashboard", href: "#dashboard", icon: "bi-house" },
    { label: "Alunos", href: "#alunos", icon: "bi-mortarboard" },
    { label: "Atendimentos", href: "#atendimentos", icon: "bi-clipboard-check" },
    { label: "Agenda", href: "#agenda", icon: "bi-calendar3" },
    { label: "Equipe", href: "#equipe", icon: "bi-people" },
    { label: "Relatórios", href: "#relatorios", icon: "bi-bar-chart" },
    { label: "Documentos", href: "#documentos", icon: "bi-folder" },
    { label: "Comunicações", href: "#comunicacoes", icon: "bi-chat-dots" },
    { label: "Configurações", href: "#configuracoes", icon: "bi-gear" }
];

const pages = {
    dashboard: {
        title: "Dashboard",
        heading: "Visão geral",
        description: "Acompanhe indicadores gerais, próximos atendimentos e um resumo das atividades do espaço."
    },
    alunos: {
        title: "Alunos",
        heading: "Alunos",
        description: "Consulte os alunos cadastrados, seus dados pessoais e o histórico de acompanhamento."
    },
    atendimentos: {
        title: "Atendimentos",
        heading: "Atendimentos",
        description: "Consulte os atendimentos, os profissionais envolvidos e o status de cada sessão."
    },
    agenda: {
        title: "Agenda",
        heading: "Agenda",
        description: "Visualize os atendimentos organizados por data, horário e profissional responsável."
    },
    equipe: {
        title: "Equipe",
        heading: "Equipe",
        description: "Consulte os profissionais do espaço, suas áreas de atuação e informações de contato."
    },
    relatorios: {
        title: "Relatórios",
        heading: "Relatórios",
        description: "Acompanhe indicadores e resultados dos atendimentos por período e área profissional."
    },
    documentos: {
        title: "Documentos",
        heading: "Documentos",
        description: "Acesse documentos relacionados aos alunos e aos atendimentos realizados."
    },
    comunicacoes: {
        title: "Comunicações",
        heading: "Comunicações",
        description: "Organize avisos e comunicações destinados aos responsáveis e à equipe."
    },
    configuracoes: {
        title: "Configurações",
        heading: "Configurações",
        description: "Gerencie preferências gerais e opções de acesso ao sistema."
    }
};

const navigationList = document.querySelector("#navigation-list");

quickLinksData.forEach(({ label, href, icon }) => {
    const listItem = document.createElement("li");
    const link = document.createElement("a");
    const iconElement = document.createElement("i");
    const labelElement = document.createElement("span");

    link.className = "navigation-link";
    link.href = href;
    link.title = label;

    iconElement.classList.add("navigation-icon", "bi", icon);
    iconElement.setAttribute("aria-hidden", "true");

    labelElement.className = "navigation-link-label";
    labelElement.textContent = label;

    link.append(iconElement, labelElement);
    listItem.append(link);
    navigationList.append(listItem);
});

const pageTitle = document.querySelector("#page-title");
const sectionTitle = document.querySelector("#section-title");
const sectionDescription = document.querySelector("#section-description");
const dashboardView = document.querySelector("#dashboard-view");
const appointmentsView = document.querySelector("#appointments-view");
const studentsView = document.querySelector("#students-view");
const reportsView = document.querySelector("#reports-view");
const studentsList = document.querySelector("#students-list");
const studentListView = document.querySelector("#student-list-view");
const studentProfileView = document.querySelector("#student-profile-view");
const studentProfilePhoto = document.querySelector("#student-profile-photo");
const studentRegistrationDialog = document.querySelector("#student-registration-dialog");
const studentRegistrationForm = document.querySelector("#student-registration-form");
const newStudentName = document.querySelector("#new-student-name");
const newStudentBirthDate = document.querySelector("#new-student-birth-date");
const newStudentGuardian = document.querySelector("#new-student-guardian");
const newStudentContact = document.querySelector("#new-student-contact");
const newStudentArea = document.querySelector("#new-student-area");
const newStudentPhoto = document.querySelector("#new-student-photo");
const studentPhotoPreview = document.querySelector("#student-photo-preview");
const reportPeriod = document.querySelector("#report-period");
const exportReportButton = document.querySelector("#export-report");
const pagePlaceholder = document.querySelector("#page-placeholder");
const agendaFilters = document.querySelector("#agenda-filters");
const appointmentsPageFilters = document.querySelector("#appointments-page-filters");
const appointmentsPageSearch = document.querySelector("#appointments-page-search");
const appointmentsPagePeriod = document.querySelector("#appointments-page-period");
const appointmentsPageProfessional = document.querySelector("#appointments-page-professional");
const appointmentsPageArea = document.querySelector("#appointments-page-area");
const appointmentsPageStatus = document.querySelector("#appointments-page-status");
const appointmentsPageList = document.querySelector("#appointments-page-list");
const appointmentSearch = document.querySelector("#appointment-search");
const filterPeriod = document.querySelector("#filter-period");
const filterProfessional = document.querySelector("#filter-professional");
const filterArea = document.querySelector("#filter-area");
const filterStatus = document.querySelector("#filter-status");
const studentDialog = document.querySelector("#student-dialog");
const whatsappForm = document.querySelector("#whatsapp-form");
const whatsappPhone = document.querySelector("#student-whatsapp");
const whatsappLink = document.querySelector("#whatsapp-link");
let selectedAppointment;
let selectedStudentPhotoUrl = "";
let currentReportAppointments = [];

function populateFilter(select, values) {
    [...new Set(values)].sort((first, second) => first.localeCompare(second, "pt-BR")).forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.append(option);
    });
}

function renderStudentList() {
    const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    studentsList.replaceChildren();
    demoStudentProfiles.forEach((student) => {
        const appointments = [
            ...student.history,
            ...demoAppointments.filter((appointment) => appointment.student === student.name)
        ];
        const row = document.createElement("tr");
        [student.name, student.guardian, student.area, String(appointments.length)].forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.append(cell);
        });
        const actionCell = document.createElement("td");
        const profileButton = document.createElement("button");
        profileButton.className = "student-consult-button";
        profileButton.type = "button";
        profileButton.textContent = "Ver perfil";
        profileButton.setAttribute("aria-label", `Ver perfil de ${student.name}`);
        profileButton.addEventListener("click", () => renderStudentProfile(student, dateFormatter));
        actionCell.append(profileButton);
        row.append(actionCell);
        studentsList.append(row);
    });
}

function renderStudentProfile(student, dateFormatter) {
    document.querySelector("#student-profile-title").textContent = student.name;
    studentProfilePhoto.src = student.photoUrl || "";
    studentProfilePhoto.hidden = !student.photoUrl;
    document.querySelector("#profile-birth-date").textContent = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${student.birthDate}T12:00:00Z`));
    document.querySelector("#profile-guardian").textContent = student.guardian;
    document.querySelector("#profile-contact").textContent = student.contact;
    document.querySelector("#profile-area").textContent = student.area;

    const appointments = [
        ...student.history,
        ...demoAppointments.filter((appointment) => appointment.student === student.name)
    ].sort((first, second) => second.date - first.date || second.time.localeCompare(first.time));
    const historyList = document.querySelector("#student-history-list");
    historyList.replaceChildren();
    appointments.forEach((appointment) => {
        const row = document.createElement("tr");
        const statusText = appointment.status === "pending" ? "Aguardando confirmação" : "Confirmado";
        [dateFormatter.format(appointment.date), appointment.time, appointment.professional, appointment.area, statusText].forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.append(cell);
        });
        historyList.append(row);
    });
    studentListView.hidden = true;
    studentProfileView.hidden = false;
}

populateFilter(filterProfessional, demoAppointments.map((appointment) => appointment.professional));
populateFilter(filterArea, demoAppointments.map((appointment) => appointment.area));
populateFilter(appointmentsPageProfessional, demoAppointments.map((appointment) => appointment.professional));
populateFilter(appointmentsPageArea, demoAppointments.map((appointment) => appointment.area));
renderStudentList();

document.querySelector("#new-student-button").addEventListener("click", () => {
    studentRegistrationForm.reset();
    const today = new Date();
    newStudentBirthDate.max = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    studentPhotoPreview.hidden = true;
    studentRegistrationDialog.showModal();
    newStudentName.focus();
});

newStudentName.addEventListener("input", () => newStudentName.setCustomValidity(""));
newStudentContact.addEventListener("input", () => {
    const digits = newStudentContact.value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) {
        newStudentContact.value = digits ? `(${digits}` : "";
    } else if (digits.length <= 6) {
        newStudentContact.value = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else {
        const subscriberLength = digits.length === 11 ? 5 : 4;
        newStudentContact.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 2 + subscriberLength)}-${digits.slice(2 + subscriberLength)}`;
    }
});

newStudentPhoto.addEventListener("change", () => {
    const file = newStudentPhoto.files[0];
    if (selectedStudentPhotoUrl) URL.revokeObjectURL(selectedStudentPhotoUrl);
    selectedStudentPhotoUrl = "";
    if (!file) {
        studentPhotoPreview.hidden = true;
        return;
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
        newStudentPhoto.setCustomValidity("Selecione uma imagem de até 2 MB.");
        newStudentPhoto.reportValidity();
        newStudentPhoto.value = "";
        studentPhotoPreview.hidden = true;
        return;
    }
    newStudentPhoto.setCustomValidity("");
    selectedStudentPhotoUrl = URL.createObjectURL(file);
    studentPhotoPreview.src = selectedStudentPhotoUrl;
    studentPhotoPreview.hidden = false;
});

newStudentPhoto.addEventListener("input", () => newStudentPhoto.setCustomValidity(""));
studentRegistrationDialog.addEventListener("close", () => {
    studentRegistrationForm.reset();
    studentPhotoPreview.hidden = true;
    studentPhotoPreview.removeAttribute("src");
    if (selectedStudentPhotoUrl) URL.revokeObjectURL(selectedStudentPhotoUrl);
    selectedStudentPhotoUrl = "";
});

studentRegistrationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const normalizedName = normalizeSearch(newStudentName.value);
    if (demoStudentProfiles.some((student) => normalizeSearch(student.name) === normalizedName)) {
        newStudentName.setCustomValidity("Já existe um aluno com esse nome na demonstração.");
        newStudentName.reportValidity();
        return;
    }
    newStudentName.setCustomValidity("");

    const photoUrl = selectedStudentPhotoUrl;
    demoStudentProfiles.unshift({
        name: newStudentName.value.trim(),
        birthDate: newStudentBirthDate.value,
        guardian: newStudentGuardian.value.trim(),
        contact: newStudentContact.value,
        area: newStudentArea.value,
        history: [],
        photoUrl
    });
    selectedStudentPhotoUrl = "";
    renderStudentList();
    studentProfileView.hidden = true;
    studentListView.hidden = false;
    studentRegistrationDialog.close();
});

document.querySelector("#student-list-back").addEventListener("click", () => {
    studentProfileView.hidden = true;
    studentListView.hidden = false;
});

document.querySelector("#profile-name").textContent = currentProfile.name;
document.querySelector("#profile-role").textContent = currentProfile.role;
document.querySelector(".profile-summary").setAttribute("aria-label", `Perfil atual: ${currentProfile.name}, ${currentProfile.role}`);
document.querySelector("#dashboard-greeting").textContent = `Olá, ${currentProfile.name}!`;
document.querySelector("#dashboard-date").textContent = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric"
}).format(dashboardToday);

function renderDashboard() {
    const appointments = getUpcomingAppointments(demoAppointments, dashboardToday);
    const summary = {
        upcoming: appointments.length,
        pending: appointments.filter((appointment) => appointment.status === "pending").length,
        confirmed: appointments.filter((appointment) => appointment.status === "confirmed").length,
        today: appointments.filter((appointment) => appointment.date.getTime() === dashboardToday.getTime()).length
    };
    Object.entries(summary).forEach(([metric, value]) => {
        document.querySelector(`#metric-${metric}`).textContent = value;
    });

    renderCountChart(document.querySelector("#area-chart"), appointments, "area");

    const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const days = Number(filterPeriod.value);
    const appointmentsInPeriod = getUpcomingAppointments(demoAppointments, dashboardToday, days);
    const visibleAppointments = filterAppointments(appointmentsInPeriod, {
        search: appointmentSearch.value,
        professional: filterProfessional.value,
        area: filterArea.value,
        status: filterStatus.value
    });
    const lastDay = new Date(dashboardToday);
    lastDay.setDate(lastDay.getDate() + days - 1);
    document.querySelector("#agenda-period").textContent = `${dateFormatter.format(dashboardToday)} a ${dateFormatter.format(lastDay)} (inclui hoje)`;
    document.querySelector("#agenda-results").textContent = `${visibleAppointments.length} de ${appointmentsInPeriod.length} atendimentos no período`;
    const list = document.querySelector("#appointments-list");
    list.replaceChildren();

    visibleAppointments.forEach((appointment) => {
        const row = document.createElement("tr");
        const values = [dateFormatter.format(appointment.date), appointment.time, appointment.student, appointment.professional, appointment.area];
        values.forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.append(cell);
        });
        const statusCell = document.createElement("td");
        const status = document.createElement("span");
        status.className = `agenda-status agenda-status-${appointment.status}`;
        status.textContent = appointment.status === "pending" ? "Aguardando confirmação" : "Confirmado";
        statusCell.append(status);
        row.append(statusCell);

        const actionCell = document.createElement("td");
        const consultButton = document.createElement("button");
        consultButton.className = "student-consult-button";
        consultButton.type = "button";
        consultButton.textContent = "Consultar";
        consultButton.setAttribute("aria-label", `Consultar atendimento de ${appointment.student}`);
        consultButton.addEventListener("click", () => openStudentDetails(appointment));
        actionCell.append(consultButton);
        row.append(actionCell);
        list.append(row);
    });
    document.querySelector(".agenda-table-scroll").hidden = visibleAppointments.length === 0;
    document.querySelector("#appointments-empty").hidden = visibleAppointments.length > 0;
}

function renderAppointmentsPage() {
    const days = Number(appointmentsPagePeriod.value);
    const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const appointmentsInPeriod = getUpcomingAppointments(demoAppointments, dashboardToday, days);
    const visibleAppointments = filterAppointments(appointmentsInPeriod, {
        search: appointmentsPageSearch.value,
        professional: appointmentsPageProfessional.value,
        area: appointmentsPageArea.value,
        status: appointmentsPageStatus.value
    });
    const lastDay = new Date(dashboardToday);
    lastDay.setDate(lastDay.getDate() + days - 1);
    document.querySelector("#appointments-page-period-label").textContent = `${dateFormatter.format(dashboardToday)} a ${dateFormatter.format(lastDay)} (inclui hoje)`;
    document.querySelector("#appointments-page-results").textContent = `${visibleAppointments.length} de ${appointmentsInPeriod.length} atendimentos no período`;
    appointmentsPageList.replaceChildren();

    visibleAppointments.forEach((appointment) => {
        const row = document.createElement("tr");
        [dateFormatter.format(appointment.date), appointment.time, appointment.student, appointment.professional, appointment.area].forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.append(cell);
        });
        const statusCell = document.createElement("td");
        const status = document.createElement("span");
        status.className = `agenda-status agenda-status-${appointment.status}`;
        status.textContent = appointment.status === "pending" ? "Aguardando confirmação" : "Confirmado";
        statusCell.append(status);
        row.append(statusCell);

        const actionCell = document.createElement("td");
        const consultButton = document.createElement("button");
        consultButton.className = "student-consult-button";
        consultButton.type = "button";
        consultButton.textContent = "Consultar";
        consultButton.setAttribute("aria-label", `Consultar atendimento de ${appointment.student}`);
        consultButton.addEventListener("click", () => openStudentDetails(appointment));
        actionCell.append(consultButton);
        row.append(actionCell);
        appointmentsPageList.append(row);
    });

    document.querySelector("#appointments-page-table-scroll").hidden = visibleAppointments.length === 0;
    document.querySelector("#appointments-page-empty").hidden = visibleAppointments.length > 0;
}

function renderReports() {
    const days = Number(reportPeriod.value);
    currentReportAppointments = getUpcomingAppointments(demoAppointments, dashboardToday, days);
    const summary = {
        total: currentReportAppointments.length,
        pending: currentReportAppointments.filter((appointment) => appointment.status === "pending").length,
        confirmed: currentReportAppointments.filter((appointment) => appointment.status === "confirmed").length,
        students: new Set(currentReportAppointments.map((appointment) => appointment.student)).size
    };
    Object.entries(summary).forEach(([metric, value]) => {
        document.querySelector(`#report-${metric}`).textContent = value;
    });

    const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const lastDay = new Date(dashboardToday);
    lastDay.setDate(lastDay.getDate() + days - 1);
    document.querySelector("#report-period-label").textContent = `${dateFormatter.format(dashboardToday)} a ${dateFormatter.format(lastDay)} (inclui hoje)`;
    renderCountChart(document.querySelector("#report-area-chart"), currentReportAppointments, "area");
    renderCountChart(document.querySelector("#report-professional-chart"), currentReportAppointments, "professional");

    const reportGroups = currentReportAppointments.reduce((groups, appointment) => {
        const key = `${appointment.professional}\u0000${appointment.area}`;
        if (!groups[key]) {
            groups[key] = { professional: appointment.professional, area: appointment.area, total: 0, pending: 0, confirmed: 0 };
        }
        groups[key].total += 1;
        groups[key][appointment.status] += 1;
        return groups;
    }, {});
    const reportDetails = document.querySelector("#report-details");
    reportDetails.replaceChildren();
    Object.values(reportGroups).sort((first, second) => first.professional.localeCompare(second.professional, "pt-BR") || first.area.localeCompare(second.area, "pt-BR")).forEach((group) => {
        const row = document.createElement("tr");
        [group.professional, group.area, group.total, group.pending, group.confirmed].forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.append(cell);
        });
        reportDetails.append(row);
    });
}

function exportReport() {
    const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const rows = [
        ["Data", "Horário", "Aluno", "Profissional", "Área", "Status"],
        ...currentReportAppointments.map((appointment) => [
            dateFormatter.format(appointment.date),
            appointment.time,
            appointment.student,
            appointment.professional,
            appointment.area,
            appointment.status === "pending" ? "Aguardando confirmação" : "Confirmado"
        ])
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(";")).join("\r\n")}`;
    const fileUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const downloadLink = document.createElement("a");
    downloadLink.href = fileUrl;
    downloadLink.download = `relatorio-atendimentos-${reportPeriod.value}-dias.csv`;
    document.body.append(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
}

function openStudentDetails(appointment) {
    selectedAppointment = appointment;
    const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" });
    document.querySelector("#student-detail-name").textContent = appointment.student;
    document.querySelector("#student-detail-datetime").textContent = `${dateFormatter.format(appointment.date)} às ${appointment.time}`;
    document.querySelector("#student-detail-professional").textContent = appointment.professional;
    document.querySelector("#student-detail-area").textContent = appointment.area;
    document.querySelector("#student-detail-status").textContent = appointment.status === "pending" ? "Aguardando confirmação" : "Confirmado";
    whatsappForm.hidden = appointment.status !== "pending";
    whatsappPhone.value = "";
    whatsappPhone.setCustomValidity("");
    whatsappLink.hidden = true;
    studentDialog.showModal();
}

whatsappPhone.addEventListener("input", () => whatsappPhone.setCustomValidity(""));
whatsappForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const phone = whatsappPhone.value.replace(/\D/g, "");
    if (phone.length < 10 || phone.length > 15) {
        whatsappPhone.setCustomValidity("Informe o código do país, o DDD e o número.");
        whatsappPhone.reportValidity();
        return;
    }

    const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(selectedAppointment.date);
    const message = `Olá! Podemos confirmar o atendimento de ${selectedAppointment.student} no dia ${date}, às ${selectedAppointment.time}, com ${selectedAppointment.professional} (${selectedAppointment.area})?`;
    const whatsappUrl = new URL(`https://wa.me/${phone}`);
    whatsappUrl.searchParams.set("text", message);
    whatsappLink.href = whatsappUrl.toString();
    whatsappLink.hidden = false;
});

renderDashboard();
renderAppointmentsPage();
renderReports();
reportPeriod.addEventListener("change", renderReports);
exportReportButton.addEventListener("click", exportReport);
appointmentsPageFilters.addEventListener("submit", (event) => event.preventDefault());
appointmentsPageSearch.addEventListener("input", renderAppointmentsPage);
[appointmentsPagePeriod, appointmentsPageProfessional, appointmentsPageArea, appointmentsPageStatus].forEach((select) => {
    select.addEventListener("change", renderAppointmentsPage);
});
appointmentsPageFilters.addEventListener("reset", () => {
    appointmentsPageSearch.value = "";
    appointmentsPagePeriod.value = "7";
    appointmentsPageProfessional.value = "";
    appointmentsPageArea.value = "";
    appointmentsPageStatus.value = "";
    renderAppointmentsPage();
});
agendaFilters.addEventListener("submit", (event) => event.preventDefault());
appointmentSearch.addEventListener("input", renderDashboard);
[filterPeriod, filterProfessional, filterArea, filterStatus].forEach((select) => {
    select.addEventListener("change", renderDashboard);
});
agendaFilters.addEventListener("reset", () => {
    appointmentSearch.value = "";
    filterPeriod.value = "7";
    filterProfessional.value = "";
    filterArea.value = "";
    filterStatus.value = "";
    renderDashboard();
});
const navigationLinks = document.querySelectorAll(".navigation-link");
const appShell = document.querySelector(".app-shell");
const sidebarToggle = document.querySelector("#sidebar-toggle");
const desktopToggleIcon = sidebarToggle.querySelector(".sidebar-toggle-desktop");

function setSidebarCollapsed(isCollapsed) {
    const label = isCollapsed ? "Abrir menu" : "Recolher menu";

    appShell.classList.toggle("sidebar-collapsed", isCollapsed);
    sidebarToggle.setAttribute("aria-expanded", String(!isCollapsed));
    sidebarToggle.setAttribute("aria-label", label);
    sidebarToggle.setAttribute("title", label);
    desktopToggleIcon.classList.toggle("bi-chevron-right", isCollapsed);
    desktopToggleIcon.classList.toggle("bi-chevron-left", !isCollapsed);
}

setSidebarCollapsed(window.matchMedia("(max-width: 650px)").matches);

sidebarToggle.addEventListener("click", () => {
    const isExpanded = sidebarToggle.getAttribute("aria-expanded") === "true";
    setSidebarCollapsed(isExpanded);
});

function renderPage() {
    const requestedPage = window.location.hash.slice(1);
    const pageKey = pages[requestedPage] ? requestedPage : "dashboard";
    const page = pages[pageKey];

    dashboardView.hidden = pageKey !== "dashboard";
    appointmentsView.hidden = pageKey !== "atendimentos";
    studentsView.hidden = pageKey !== "alunos";
    reportsView.hidden = pageKey !== "relatorios";
    pagePlaceholder.hidden = pageKey === "dashboard" || pageKey === "atendimentos" || pageKey === "alunos" || pageKey === "relatorios";
    pageTitle.textContent = page.title;
    sectionTitle.textContent = page.heading;
    sectionDescription.textContent = page.description;
    document.title = `${page.title} | Espaço Bianca Petenão`;

    navigationLinks.forEach((link) => {
        if (link.hash === `#${pageKey}`) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

window.addEventListener("hashchange", renderPage);
renderPage();
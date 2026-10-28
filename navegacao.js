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
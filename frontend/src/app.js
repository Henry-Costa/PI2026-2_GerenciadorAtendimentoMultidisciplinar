import { demo } from './data/demo.js';
import { addDays, button, el, localDate, status } from './shared/ui.js';
import { mount as agenda } from './features/agenda/page.js';
import { mount as patients } from './features/patients/page.js';
import { mount as professionals } from './features/professionals/page.js';
import { mount as services } from './features/services/page.js';
import { mount as reports } from './features/reports/page.js';
import { mount as dashboard } from './features/dashboard/page.js';
import { mount as settings, applyAppearance, startPage } from './features/settings/page.js';
import { mount as communications } from './features/communications/page.js';
import { upcomingList } from './features/agenda/summary.js';
const routes = {
  dashboard: { title: 'Dashboard', icon: '⌂', admin: true, mount: dashboard },
  alunos: { title: 'Alunos', icon: '♧', admin: true, mount: patients },
  atendimentos: {
    title: 'Atendimentos',
    icon: '☷',
    admin: true,
    async mount(root, data) {
      const today = localDate();
      root.className = 'appointments-view';
      root.append(
        el(
          'header',
          { className: 'appointments-page-header' },
          el('h2', {}, 'Atendimentos registrados'),
        ),
        upcomingList(await data.listAppointments({ from: today, to: addDays(today, 6) })),
      );
    },
  },
  agenda: { title: 'Agenda', icon: '▦', mount: agenda },
  equipe: { title: 'Equipe', icon: '♙', admin: true, mount: professionals },
  tipos: { title: 'Tipos de atendimento', icon: '◇', admin: true, mount: services },
  relatorios: { title: 'Relatórios', icon: '▤', admin: true, mount: reports },
  comunicacoes: { title: 'Comunicações', icon: '☏', admin: true, mount: communications },
  configuracoes: {
    title: 'Configurações',
    icon: '⚙',
    mount: (root, data) => settings(root, data, Object.entries(routes)),
  },
};
const routeKey = (key) => (key === 'pacientes' ? 'alunos' : key);
const root = document.querySelector('#page-content'),
  boot = document.querySelector('#boot-message');
try {
  applyAppearance();
  const chooser = document.querySelector('#demo-role');
  let data;
  const menu = document.querySelector('#navigation-list');
  function showProfile(role) {
    data = demo(role);
    const { profile } = data;
    chooser.value = profile.role;
    document.querySelector('#profile-name').textContent = profile.full_name;
    document.querySelector('#profile-role').textContent =
      profile.role === 'admin' ? 'Administrador' : 'Profissional';
    document.querySelector('.sidebar-brand').hash =
      profile.role === 'admin' ? 'dashboard' : 'agenda';
    menu.replaceChildren();
    for (const [key, page] of Object.entries(routes)) {
      if (page.admin && profile.role !== 'admin') continue;
      menu.append(
        el(
          'li',
          {},
          el(
            'a',
            { href: '#' + key, className: 'navigation-link', title: page.title },
            el('span', { className: 'navigation-icon', 'aria-hidden': 'true' }, page.icon),
            el('span', { className: 'navigation-link-label' }, page.title),
          ),
        ),
      );
    }
  }
  const initialRole = new URLSearchParams(location.search).get('perfil');
  showProfile(initialRole === 'admin' ? 'admin' : 'user');
  const shell = document.querySelector('#app-shell'),
    toggle = document.querySelector('#sidebar-toggle');
  function collapsed(value) {
    shell.classList.toggle('sidebar-collapsed', value);
    toggle.setAttribute('aria-expanded', String(!value));
    toggle.setAttribute('aria-label', value ? 'Abrir menu' : 'Recolher menu');
    toggle.textContent = value ? '›' : '‹';
  }
  collapsed(matchMedia('(max-width:700px)').matches);
  toggle.addEventListener('click', () => collapsed(!shell.classList.contains('sidebar-collapsed')));
  document.querySelector('#logout').addEventListener('click', () => location.replace('index.html'));
  let revision = 0;
  async function navigate() {
    const admin = data.profile.role === 'admin';
    const requested = routeKey(location.hash.slice(1) || (admin ? startPage() : 'agenda'));
    const current = ++revision,
      key =
        Object.hasOwn(routes, requested) && (admin || !routes[requested].admin)
          ? requested
          : admin
            ? 'dashboard'
            : 'agenda',
      page = routes[key];
    document.querySelectorAll('dialog').forEach((d) => d.close());
    if (location.hash && location.hash !== '#' + key) history.replaceState(null, '', '#' + key);
    document.querySelector('#page-title').textContent = page.title;
    document.querySelectorAll('.navigation-link').forEach((a) => {
      if (a.hash === '#' + key) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    root.replaceChildren(status('Carregando…'));
    root.setAttribute('aria-busy', 'true');
    const content = el('section', { className: 'feature-page' });
    try {
      await page.mount(content, data);
      if (current === revision) {
        root.replaceChildren(content);
        root.focus();
      }
    } catch (error) {
      if (current === revision)
        root.replaceChildren(status(error.message, true), button('Tentar novamente', navigate));
    } finally {
      if (current === revision) root.removeAttribute('aria-busy');
    }
  }
  shell.hidden = false;
  boot.hidden = true;
  chooser.addEventListener('change', () => {
    showProfile(chooser.value);
    const url = new URL(location.href);
    url.searchParams.set('perfil', chooser.value);
    history.replaceState(null, '', url);
    navigate();
  });
  window.addEventListener('hashchange', navigate);
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) location.reload();
  });
  await navigate();
} catch (error) {
  boot.textContent = error.message;
  boot.setAttribute('role', 'alert');
  boot.append(' ', el('a', { href: 'index.html' }, 'Voltar ao login'));
}

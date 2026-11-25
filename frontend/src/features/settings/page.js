import { button, el, field } from '../../shared/ui.js';

const storageKey = 'pi2026-2.preferences';
const defaults = { startPage: 'dashboard', density: 'comfortable', theme: 'light' };
let preferences = { ...defaults };
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  preferences = {
    startPage: typeof saved?.startPage === 'string' ? saved.startPage : defaults.startPage,
    density: saved?.density === 'compact' ? 'compact' : defaults.density,
    theme: saved?.theme === 'dark' ? 'dark' : defaults.theme,
  };
} catch {
  // A blocked storage area or invalid preference uses the defaults.
}

export function startPage() {
  return preferences.startPage;
}

export function applyAppearance() {
  document.body.classList.toggle('dark-theme', preferences.theme === 'dark');
  document.body.classList.toggle('compact-density', preferences.density === 'compact');
}

export function mount(root, data, pages) {
  root.className = 'settings-view';
  const admin = data.profile.role === 'admin';
  const form = el('form', { className: 'settings-form' });
  const options = admin
    ? pages.map(([value, page]) => ({ value, label: page.title }))
    : [{ value: 'agenda', label: 'Agenda' }];
  const start = field(form, 'startPage', 'Tela inicial', { options, required: false });
  start.id = 'settings-start-page';
  start.disabled = !admin;
  const density = el(
    'fieldset',
    { className: 'settings-density' },
    el('legend', {}, 'Densidade das tabelas'),
  );
  for (const [key, label] of [
    ['comfortable', 'Padrão'],
    ['compact', 'Compacta'],
  ]) {
    density.append(
      el('label', {}, el('input', { type: 'radio', name: 'settings-density', value: key }), label),
    );
  }
  const dark = el('input', { id: 'settings-dark-theme', type: 'checkbox' });
  const feedback = el('p', { className: 'settings-feedback', role: 'status' });
  function fill() {
    start.value =
      admin && options.some((o) => o.value === preferences.startPage)
        ? preferences.startPage
        : admin
          ? defaults.startPage
          : 'agenda';
    form.elements['settings-density'].value = preferences.density;
    dark.checked = preferences.theme === 'dark';
  }
  function save() {
    applyAppearance();
    try {
      localStorage.setItem(storageKey, JSON.stringify(preferences));
      feedback.textContent = 'Preferências salvas neste navegador.';
    } catch {
      feedback.textContent =
        'Preferências aplicadas nesta sessão. O navegador bloqueou o armazenamento.';
    }
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    preferences = {
      startPage: admin ? start.value : preferences.startPage,
      density: form.elements['settings-density'].value,
      theme: dark.checked ? 'dark' : 'light',
    };
    save();
  });
  form.append(
    density,
    el(
      'fieldset',
      { className: 'settings-density' },
      el('legend', {}, 'Tema'),
      el('label', {}, dark, 'Ativar tema escuro'),
    ),
    el(
      'div',
      { className: 'settings-actions' },
      el('button', { type: 'submit', className: 'new-student-button' }, 'Salvar preferências'),
      button(
        'Restaurar padrão',
        () => {
          preferences = {
            ...defaults,
            startPage: admin ? defaults.startPage : preferences.startPage,
          };
          fill();
          save();
        },
        'student-list-back',
      ),
    ),
  );
  root.append(
    el(
      'header',
      { className: 'settings-page-header' },
      el('h2', {}, 'Preferências desta instalação'),
      el('p', {}, 'Estas opções são salvas apenas neste navegador.'),
    ),
    form,
    feedback,
  );
  fill();
}

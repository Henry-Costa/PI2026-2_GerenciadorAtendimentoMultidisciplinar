export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'className') node.className = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key in node && !key.startsWith('aria')) node[key] = value;
    else node.setAttribute(key, String(value));
  }
  for (const child of children.flat())
    if (child !== null && child !== undefined)
      node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return node;
}
export const button = (text, action, className = 'secondary-button') =>
  el('button', { type: 'button', className, onclick: action }, text);
export function status(text, error = false) {
  return el(
    'p',
    { className: error ? 'feedback error' : 'feedback', role: error ? 'alert' : 'status' },
    text,
  );
}
export function toolbar(title, description, action) {
  return el(
    'header',
    { className: 'feature-heading' },
    el('div', {}, el('h2', {}, title), el('p', {}, description)),
    action,
  );
}
export function table(headers, rows) {
  const wrapper = el('div', {
    className: 'agenda-table-scroll',
    tabIndex: 0,
    role: 'region',
    'aria-label': headers.join(', '),
  });
  wrapper.append(
    el(
      'table',
      { className: 'agenda-table' },
      el('caption', {}, rows.length + ' registro(s)'),
      el(
        'thead',
        {},
        el(
          'tr',
          {},
          headers.map((h) => el('th', { scope: 'col' }, h)),
        ),
      ),
      el(
        'tbody',
        {},
        rows.map((row) =>
          el(
            'tr',
            {},
            row.map((cell) => el('td', {}, cell)),
          ),
        ),
      ),
    ),
  );
  return wrapper;
}
export const one = (value) => (Array.isArray(value) ? value[0] || {} : value || {});
export const money = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
export const dateLabel = (value) =>
  value
    ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(
        new Date(value.length === 10 ? value + 'T12:00:00Z' : value),
      )
    : '—';
export const timeLabel = (value) =>
  new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
export const localDate = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
export function addDays(day, n) {
  return new Date(Date.parse(day + 'T12:00Z') + n * 86400000).toISOString().slice(0, 10);
}
export function inputDateTime(value) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(new Date(value))
    .replace(' ', 'T');
}
export const instant = (value) => new Date(value + '-03:00').toISOString();
export function dialog(title, content) {
  const d = el('dialog', { className: 'student-dialog feature-dialog', 'aria-label': title });
  const close = button('Fechar', () => d.close());
  d.append(el('div', { className: 'student-dialog-heading' }, el('h2', {}, title), close), content);
  d.addEventListener('close', () => d.remove(), { once: true });
  document.body.append(d);
  d.showModal();
  return d;
}
export function field(
  form,
  name,
  label,
  { value = '', type = 'text', required = true, options, readOnly = false, ...attrs } = {},
) {
  const control = options
    ? el(
        'select',
        { name, required, ...attrs },
        options.map((o) =>
          el(
            'option',
            { value: String(o.value), selected: String(o.value) === String(value) },
            o.label,
          ),
        ),
      )
    : el('input', {
        name,
        type,
        required,
        value: value ?? '',
        readOnly,
        autoComplete: type === 'password' ? 'new-password' : 'off',
        ...attrs,
      });
  const wrapper = el('label', {}, label + (required ? ' *' : ''), control);
  form.append(wrapper);
  return control;
}
export function group(form, title) {
  const f = el('fieldset', { className: 'form-grid' }, el('legend', {}, title));
  form.append(f);
  return f;
}
export function value(form, name) {
  return form.elements.namedItem(name)?.value?.trim() || '';
}
export function formSubmit(form, save, onSuccess) {
  const feedback = status(''),
    submit = el('button', { type: 'submit', className: 'new-student-button' }, 'Salvar');
  form.append(el('p', { className: 'field-note' }, '* Campos obrigatórios.'), feedback, submit);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    submit.disabled = true;
    feedback.textContent = 'Salvando…';
    feedback.className = 'feedback';
    try {
      await save();
      feedback.textContent = 'Salvo com sucesso.';
      await onSuccess();
    } catch (error) {
      feedback.textContent = error.message;
      feedback.className = 'feedback error';
      feedback.setAttribute('role', 'alert');
    } finally {
      submit.disabled = false;
    }
  });
  return submit;
}
export function searchBox(onInput) {
  return el(
    'label',
    { className: 'search-field' },
    'Buscar',
    el('input', {
      type: 'search',
      placeholder: 'Digite para buscar',
      oninput: (event) => onInput(event.target.value),
    }),
  );
}

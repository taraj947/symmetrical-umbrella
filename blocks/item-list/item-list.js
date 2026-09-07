/**
 * Formats a raw field value for display, adding a currency prefix for price-like fields.
 * @param {string} key Field name from the source JSON
 * @param {*} value Field value
 */
function formatValue(key, value) {
  if (/price/i.test(key)) {
    const num = Number(value);
    if (!Number.isNaN(num)) return `$${num.toFixed(2)}`;
  }
  return value;
}

/**
 * Builds a single list item from a JSON record.
 * @param {Object} record One entry from the JSON data array
 */
function buildItem(record) {
  const entries = Object.entries(record).filter(([, value]) => value !== '' && value != null);
  const li = document.createElement('li');
  li.className = 'item-list-item';

  const [titleKey, titleValue] = entries[0] || [];
  if (titleKey) {
    const title = document.createElement('p');
    title.className = 'item-list-item-title';
    title.textContent = titleValue;
    li.append(title);
  }

  entries.slice(1).forEach(([key, value]) => {
    const field = document.createElement('p');
    field.className = `item-list-item-field item-list-item-${key.toLowerCase().replace(/\s+/g, '-')}`;
    field.textContent = formatValue(key, value);
    li.append(field);
  });

  return li;
}

const PAGE_SIZE = 20;

/**
 * Fetches one page of records from the JSON source.
 * @param {string} baseUrl Absolute URL to the JSON source
 * @param {number} offset Record offset to start from
 */
async function fetchPage(baseUrl, offset) {
  const url = new URL(baseUrl);
  url.searchParams.set('limit', PAGE_SIZE);
  url.searchParams.set('offset', offset);
  const resp = await fetch(url.href);
  if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
  const json = await resp.json();
  const items = Array.isArray(json) ? json : (json.data || []);
  const total = Array.isArray(json) ? items.length : (json.total ?? items.length);
  return { items, total };
}

export default async function decorate(block) {
  // authored either as a link or as a plain-text path to the JSON source
  const link = block.querySelector('a[href]');
  const path = link ? link.href : block.textContent.trim();
  block.textContent = '';
  if (!path) return;
  const url = new URL(path, window.location.href).href;

  const ul = document.createElement('ul');
  ul.className = 'item-list-items';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'button secondary item-list-prev';
  prevBtn.textContent = 'Previous';

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'button primary item-list-next';
  nextBtn.textContent = 'Next';

  const nav = document.createElement('div');
  nav.className = 'item-list-nav';
  nav.append(prevBtn, nextBtn);

  block.append(ul, nav);

  let offset = 0;

  async function renderPage() {
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    try {
      const { items, total } = await fetchPage(url, offset);
      ul.textContent = '';
      items.forEach((record) => ul.append(buildItem(record)));
      prevBtn.disabled = offset <= 0;
      nextBtn.disabled = offset + items.length >= total;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`item-list: failed to load JSON from ${url}`, error);
    }
  }

  prevBtn.addEventListener('click', () => {
    offset = Math.max(0, offset - PAGE_SIZE);
    renderPage();
  });

  nextBtn.addEventListener('click', () => {
    offset += PAGE_SIZE;
    renderPage();
  });

  await renderPage();
}

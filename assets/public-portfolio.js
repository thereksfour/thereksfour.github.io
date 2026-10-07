(() => {
  const data = window.PUBLIC_AUDIT_PORTFOLIO;
  const root = document.querySelector('#public-portfolio');
  if (!data || !root) return;
  const records = data.records.filter(record => record.role !== 'Competition contributor' ||
    (Number.isInteger(record.rank) && record.rank >= 1 && record.rank <= 5));
  const search = root.querySelector('#portfolio-search');
  const provider = root.querySelector('#portfolio-provider');
  const category = root.querySelector('#portfolio-category');
  const work = root.querySelector('#portfolio-work');
  const body = root.querySelector('#portfolio-rows');
  const status = root.querySelector('#portfolio-status');
  const previous = root.querySelector('#portfolio-prev');
  const next = root.querySelector('#portfolio-next');
  const pages = root.querySelector('#portfolio-pages');
  const size = 15;
  let page = 0;
  const group = role => ['Auditor', 'Solo auditor'].includes(role) ? 'Audits' : role === 'Judge' ? 'Judging' : 'Competitions';
  const textKey = value => String(value).normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '');
  const keys = new Map(records.map(record => [record.id, textKey([record.protocol, record.review, record.category, record.provider, ...record.features, ...record.ecosystems].join(' '))]));
  const options = (select, values) => values.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.append(option);
  });
  options(provider, [...new Set(records.map(record => record.provider))].sort());
  options(category, [...new Set(records.map(record => record.category))].filter(value => value !== 'Unspecified public scope').sort());
  root.querySelector('#portfolio-total').textContent = records.length;
  const heroTotal = document.querySelector('#hero-portfolio-total');
  if (heroTotal) heroTotal.textContent = records.length;
  root.querySelector('#portfolio-audits').textContent = records.filter(record => group(record.role) === 'Audits').length;
  root.querySelector('#portfolio-competitions').textContent = records.filter(record => group(record.role) === 'Competitions').length;
  root.querySelector('#portfolio-judging').textContent = records.filter(record => group(record.role) === 'Judging').length;

  const appendText = (parent, tag, value, className) => {
    const element = document.createElement(tag);
    element.textContent = value;
    if (className) element.className = className;
    parent.append(element);
    return element;
  };
  function render() {
    const tokens = textKey(search.value).split(/\s+/).filter(Boolean);
    const filtered = records.filter(record =>
      (!provider.value || record.provider === provider.value) &&
      (!category.value || record.category === category.value) &&
      (!work.value || group(record.role) === work.value) &&
      tokens.every(token => keys.get(record.id).includes(token))
    );
    const count = Math.max(1, Math.ceil(filtered.length / size));
    page = Math.min(page, count - 1);
    body.replaceChildren();
    filtered.slice(page * size, (page + 1) * size).forEach(record => {
      const row = document.createElement('tr');
      const protocolCell = document.createElement('td');
      protocolCell.dataset.label = 'Protocol / review';
      appendText(protocolCell, 'strong', record.protocol, 'portfolio-protocol');
      const reviewLabel = record.review.replace(/\s*\[[0-9a-f]{6,}\]/ig, '');
      if (reviewLabel !== record.protocol) appendText(protocolCell, 'span', reviewLabel, 'portfolio-review');
      appendText(protocolCell, 'span', record.role === 'Competition contributor' ? `Competition · #${record.rank}` : record.role, 'portfolio-role');
      row.append(protocolCell);
      const providerCell = document.createElement('td');
      providerCell.dataset.label = 'Provider';
      appendText(providerCell, 'span', record.provider);
      appendText(providerCell, 'span', record.date_label, 'portfolio-date');
      row.append(providerCell);
      const featureCell = document.createElement('td');
      featureCell.dataset.label = 'Features';
      const chips = appendText(featureCell, 'div', '', 'portfolio-features');
      record.features.forEach(feature => appendText(chips, 'span', feature, 'portfolio-chip'));
      if (!record.features.length) appendText(featureCell, 'span', 'Scope details not in the public summary', 'portfolio-muted');
      if (record.ecosystems.length) appendText(featureCell, 'span', record.ecosystems.join(' · '), 'portfolio-ecosystem');
      row.append(featureCell);
      const sourceCell = document.createElement('td');
      sourceCell.dataset.label = 'Source';
      const url = new URL(record.report_url);
      if (url.protocol === 'https:') {
        const link = appendText(sourceCell, 'a', ['Report', 'Report page'].includes(record.record_type) ? 'Report ↗' : 'Review page ↗', 'portfolio-source');
        link.href = url.href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', `${record.protocol}: ${record.review} — public source`);
      }
      if (record.rank_source_url) {
        const rankingUrl = new URL(record.rank_source_url);
        if (rankingUrl.protocol === 'https:') {
          const rankLink = appendText(sourceCell, 'a', 'Placement ↗', 'portfolio-source');
          rankLink.href = rankingUrl.href;
          rankLink.target = '_blank';
          rankLink.rel = 'noopener noreferrer';
          rankLink.setAttribute('aria-label', `${record.protocol} — placement #${record.rank}`);
        }
      }
      row.append(sourceCell);
      body.append(row);
    });
    const from = filtered.length ? page * size + 1 : 0;
    const to = Math.min((page + 1) * size, filtered.length);
    status.textContent = filtered.length ? `Showing ${from}–${to} of ${filtered.length} records` : 'No matching records. Try another protocol or feature.';
    pages.textContent = `Page ${page + 1} of ${count}`;
    previous.disabled = page === 0;
    next.disabled = page === count - 1;
  }
  [search, provider, category, work].forEach(control => control.addEventListener(control === search ? 'input' : 'change', () => { page = 0; render(); }));
  root.querySelector('#portfolio-reset').addEventListener('click', () => {
    search.value = provider.value = category.value = work.value = '';
    page = 0;
    render();
    search.focus();
  });
  previous.addEventListener('click', () => { page -= 1; render(); });
  next.addEventListener('click', () => { page += 1; render(); });
  render();
})();

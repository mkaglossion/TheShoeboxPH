(() => {
  const inputSelector = '[data-client-facet-input]';
  const productSelector = '#product-grid > [data-client-filter-product-type]';
  const allInputs = () => Array.from(document.querySelectorAll(inputSelector));

  const selectedValues = () => {
    const selected = new Map();
    allInputs().filter((input) => input.checked).forEach((input) => {
      const key = input.dataset.clientFacetKey;
      if (!selected.has(key)) selected.set(key, new Set());
      selected.get(key).add(input.value);
    });
    return selected;
  };

  const syncInputs = (source) => {
    allInputs().forEach((input) => {
      if (input !== source && input.dataset.clientFacetKey === source.dataset.clientFacetKey && input.value === source.value) {
        input.checked = source.checked;
      }
    });
  };

  const updateProductCount = (visibleCount, hasSelection) => {
    ['ProductCountDesktop', 'ProductCount'].forEach((id) => {
      const count = document.getElementById(id);
      if (!count) return;
      if (!count.dataset.clientFacetOriginal) count.dataset.clientFacetOriginal = count.textContent;
      count.textContent = hasSelection
        ? `${visibleCount} ${visibleCount === 1 ? 'product' : 'products'}`
        : count.dataset.clientFacetOriginal;
    });
  };

  const createChip = (key, value) => {
    const source = allInputs().find((input) => input.dataset.clientFacetKey === key && input.value === value);
    const label = source?.dataset.clientFacetLabel || value;
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'client-active-facet';
    chip.dataset.clientFacetRemoveKey = key;
    chip.dataset.clientFacetRemoveValue = value;
    chip.setAttribute('aria-label', `Remove ${label} filter`);

    const labelText = document.createElement('span');
    labelText.textContent = label;
    const close = document.createElement('span');
    close.setAttribute('aria-hidden', 'true');
    close.textContent = '\u00d7';
    chip.append(labelText, close);
    return chip;
  };

  const renderActiveFacets = (selected) => {
    document.querySelectorAll('[data-client-active-facets]').forEach((container) => {
      const list = container.querySelector('[data-client-active-list]');
      list.replaceChildren();
      selected.forEach((values, key) => values.forEach((value) => list.appendChild(createChip(key, value))));
      container.hidden = selected.size === 0;
    });
  };

  const openSelectedGroups = (selected) => {
    selected.forEach((_values, key) => {
      document.querySelectorAll(`[data-client-facet-group="${key}"]`).forEach((details) => { details.open = true; });
    });
  };

  const applyFilters = () => {
    const selected = selectedValues();
    const products = document.querySelectorAll(productSelector);
    let visibleCount = 0;

    products.forEach((product) => {
      const matches = Array.from(selected.entries()).every(([key, values]) => {
        const productValues = product.getAttribute(`data-client-filter-${key}`) || '';
        return Array.from(values).some((value) => productValues.includes(`|${value}|`));
      });
      product.classList.toggle('client-facet-hidden', !matches);
      if (matches) visibleCount += 1;
    });

    renderActiveFacets(selected);
    openSelectedGroups(selected);
    updateProductCount(visibleCount, selected.size > 0);
  };

  const clearClientFilters = () => {
    allInputs().forEach((input) => { input.checked = false; });
    applyFilters();
  };

  document.addEventListener('input', (event) => {
    if (!event.target.matches(inputSelector)) return;
    event.stopPropagation();
    syncInputs(event.target);
    applyFilters();
  }, true);

  document.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-client-facet-remove-key]');
    if (removeButton) {
      const { clientFacetRemoveKey: key, clientFacetRemoveValue: value } = removeButton.dataset;
      allInputs().forEach((input) => {
        if (input.dataset.clientFacetKey === key && input.value === value) input.checked = false;
      });
      applyFilters();
      return;
    }

    const clearButton = event.target.closest('[data-client-clear-all]');
    if (!clearButton) return;
    event.preventDefault();
    clearClientFilters();

    const hasNativeSelections = document.querySelector(
      '#FacetFiltersForm input[type="checkbox"][name]:checked, #FacetFiltersFormMobile input[type="checkbox"][name]:checked, #FacetFiltersForm price-range input[value], #FacetFiltersFormMobile price-range input[value]'
    );
    if (hasNativeSelections && clearButton.dataset.resultsUrl) window.location.assign(clearButton.dataset.resultsUrl);
  });

  const gridContainer = document.getElementById('ProductGridContainer');
  if (gridContainer) new MutationObserver(applyFilters).observe(gridContainer, { childList: true, subtree: true });
  applyFilters();
})();

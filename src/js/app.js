const App = (() => {
  async function init() {
    Theme.init();

    try {
      await DataStore.load();
    } catch {
      renderError();
      return;
    }

    renderFilters();
    Modal.init();
    Search.init(onSearchUpdate);
    applyUrlParams();
    renderRepos();
    renderGeneratedAt();
  }

  function renderGeneratedAt() {
    const genEl = document.getElementById("generated-at");
    if (genEl) {
      const date = DataStore.getGeneratedAt();
      genEl.textContent = date ? `Generated: ${toRFC3339Local(new Date(date))}` : "";
    }
  }

  function renderFilters() {
    const container = document.getElementById("filter-buttons");
    if (!container) return;

    const languages = DataStore.getLanguages().slice(0, 8);
    const owners = DataStore.getOwners();

    let html = "";

    if (owners.length > 1) {
      owners.forEach((owner) => {
        html += `<button class="filter-btn" data-filter-type="owner" data-filter-value="${Cards.escapeHtml(owner)}">${Cards.escapeHtml(owner)}</button>`;
      });
    }

    languages.forEach((lang) => {
      html += `<button class="filter-btn" data-filter-type="language" data-filter-value="${Cards.escapeHtml(lang)}">${Cards.escapeHtml(lang)}</button>`;
    });

    container.innerHTML = html;

    container.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const type = btn.dataset.filterType;
        const value = btn.dataset.filterValue;

        let active;
        if (type === "language") {
          active = Search.setLanguageFilter(value);
        } else if (type === "owner") {
          active = Search.setOwnerFilter(value);
        }

        container.querySelectorAll(`[data-filter-type="${type}"]`).forEach((b) => {
          b.classList.toggle("filter-btn--active", b.dataset.filterValue === active);
        });
      });
    });
  }

  function renderRepos() {
    const allRepos = DataStore.getRepos();
    const filtered = Search.filter(allRepos);
    Cards.renderGrid(filtered);
    Cards.updateResultCount(filtered.length, allRepos.length);
  }

  function applyUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const repo = params.get("repo");
    if (repo) {
      const input = document.getElementById("search-input");
      if (input) {
        input.value = repo;
        input.dispatchEvent(new Event("input"));
      }
    }
  }

  function onSearchUpdate() {
    renderRepos();
  }

  function renderError() {
    const grid = document.getElementById("repo-grid");
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state__icon">${Icons.code()}</div>
          <h3 class="empty-state__title">Unable to load repository data</h3>
          <p>Make sure to run the build script first:<br><code>make build</code></p>
        </div>
      `;
    }
  }

  return { init };
})();

// Auto-init only if page is ready (for pages that don't use modular components)
if (document.readyState !== 'loading') {
  // DOM is already loaded
  setTimeout(() => App.init(), 0);
} else {
  document.addEventListener("DOMContentLoaded", App.init);
}

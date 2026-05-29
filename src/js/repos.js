const ReposView = (() => {
  let _query = "";
  let _languageFilter = null;
  let _ownerFilter = null;

  function render() {
    return `
      <div class="container">
        <section class="hero">
          <h1 class="hero__title">Repositories</h1>
          <p class="hero__description">Browse, search, and filter across all repositories.</p>
        </section>

        <section class="controls">
          <div class="controls__search">
            <div class="search-input">
              <span class="search-input__icon">${Icons.search()}</span>
              <input
                id="search-input"
                class="search-input__field"
                type="search"
                placeholder="Search repositories, topics, languages..."
                aria-label="Search repositories"
              >
            </div>
          </div>
          <div id="filter-buttons" class="controls__filters"></div>
        </section>

        <p id="result-count" class="result-count"></p>
        <div id="repo-grid" class="repo-grid"></div>
      </div>
    `;
  }

  function init(params) {
    _query = "";
    _languageFilter = null;
    _ownerFilter = null;

    _initSearch();
    _renderFilters();
    _initModal();

    if (params && params.search) {
      const input = document.getElementById("search-input");
      if (input) {
        input.value = params.search;
        _query = params.search.toLowerCase();
      }
    }

    _renderRepos();
  }

  function destroy() {
    document.removeEventListener("keydown", _onEscape);
    _query = "";
    _languageFilter = null;
    _ownerFilter = null;
  }

  // --- Search ---

  function _initSearch() {
    const input = document.getElementById("search-input");
    if (input) {
      input.addEventListener("input", (e) => {
        _query = e.target.value.trim().toLowerCase();
        _renderRepos();
      });
    }
  }

  function _filterRepos(repos) {
    return repos.filter((repo) => {
      if (_query) {
        const searchable = [repo.name, repo.description, repo.owner, repo.language, ...(repo.topics || [])]
          .filter(Boolean).join(" ").toLowerCase();
        if (!searchable.includes(_query)) return false;
      }
      if (_languageFilter && repo.language !== _languageFilter) return false;
      if (_ownerFilter && repo.owner !== _ownerFilter) return false;
      return true;
    });
  }

  // --- Filters ---

  function _renderFilters() {
    const container = document.getElementById("filter-buttons");
    if (!container) return;

    const languages = DataStore.getLanguages().slice(0, 8);
    const owners = DataStore.getOwners();
    let html = "";

    if (owners.length > 1) {
      owners.forEach((owner) => {
        html += `<button class="filter-btn" data-filter-type="owner" data-filter-value="${Utils.escapeHtml(owner)}">${Utils.escapeHtml(owner)}</button>`;
      });
    }

    languages.forEach((lang) => {
      html += `<button class="filter-btn" data-filter-type="language" data-filter-value="${Utils.escapeHtml(lang)}">${Utils.escapeHtml(lang)}</button>`;
    });

    container.innerHTML = html;

    container.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const type = btn.dataset.filterType;
        const value = btn.dataset.filterValue;

        if (type === "language") {
          _languageFilter = _languageFilter === value ? null : value;
        } else if (type === "owner") {
          _ownerFilter = _ownerFilter === value ? null : value;
        }

        container.querySelectorAll(`[data-filter-type="${type}"]`).forEach((b) => {
          const isActive = (type === "language" ? _languageFilter : _ownerFilter) === b.dataset.filterValue;
          b.classList.toggle("filter-btn--active", isActive);
        });

        _renderRepos();
      });
    });
  }

  // --- Cards ---

  function _renderRepos() {
    const allRepos = DataStore.getRepos();
    const filtered = _filterRepos(allRepos);
    _renderGrid(filtered);
    _updateResultCount(filtered.length, allRepos.length);
  }

  function _renderGrid(repos) {
    const grid = document.getElementById("repo-grid");
    if (!grid) return;

    if (repos.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state__icon">${Icons.search()}</div>
          <h3 class="empty-state__title">No repositories found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();
    repos.forEach((repo) => fragment.appendChild(_renderCard(repo)));
    grid.innerHTML = "";
    grid.appendChild(fragment);
  }

  function _renderCard(repo) {
    const card = document.createElement("article");
    card.className = `repo-card${repo.is_pinned ? " repo-card--pinned" : ""}`;
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `View details for ${repo.name}`);

    const topicsHTML = (repo.topics || []).slice(0, 4)
      .map((t) => `<span class="tag">${Utils.escapeHtml(t)}</span>`).join("");
    const moreTopics = (repo.topics || []).length > 4
      ? `<span class="tag">+${repo.topics.length - 4}</span>` : "";

    card.innerHTML = `
      <div class="repo-card__header">
        <div>
          <div class="repo-card__owner">${Utils.escapeHtml(repo.owner)}</div>
          <h3 class="repo-card__name">${Utils.escapeHtml(repo.name)}</h3>
        </div>
        ${repo.is_pinned ? `<span class="repo-card__badge">${Icons.pin()} Pinned</span>` : ""}
      </div>
      <p class="repo-card__description">${Utils.escapeHtml(repo.description || "No description provided.")}</p>
      ${topicsHTML || moreTopics ? `<div class="repo-card__topics">${topicsHTML}${moreTopics}</div>` : ""}
      <div class="repo-card__footer">
        <div class="repo-card__stats">
          <span class="repo-card__stat" title="Stars">
            <span class="repo-card__stat-icon">${Icons.star()}</span>
            ${repo.stars || 0}
          </span>
          <span class="repo-card__stat" title="Forks">
            <span class="repo-card__stat-icon">${Icons.gitFork()}</span>
            ${repo.forks || 0}
          </span>
        </div>
        ${repo.language ? `
          <span class="repo-card__language">
            <span class="repo-card__language-dot" style="background-color: ${Utils.getLangColor(repo.language)}"></span>
            ${Utils.escapeHtml(repo.language)}
          </span>
        ` : ""}
      </div>
    `;

    card.addEventListener("click", () => _openModal(repo));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); _openModal(repo); }
    });

    return card;
  }

  function _updateResultCount(count, total) {
    const el = document.getElementById("result-count");
    if (!el) return;
    el.textContent = count === total ? `${total} repositories` : `${count} of ${total} repositories`;
  }

  // --- Modal ---

  function _initModal() {
    const backdrop = document.getElementById("modal-backdrop");
    if (!backdrop) return;

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) _closeModal();
    });

    document.addEventListener("keydown", _onEscape);
  }

  function _onEscape(e) {
    if (e.key === "Escape") {
      const backdrop = document.getElementById("modal-backdrop");
      if (backdrop && backdrop.classList.contains("modal-backdrop--active")) {
        _closeModal();
      }
    }
  }

  function _openModal(repo) {
    const backdrop = document.getElementById("modal-backdrop");
    if (!backdrop) return;

    const modal = backdrop.querySelector(".modal");
    modal.innerHTML = _renderModalContent(repo);

    const closeBtn = modal.querySelector(".modal__close");
    if (closeBtn) closeBtn.addEventListener("click", _closeModal);

    backdrop.classList.add("modal-backdrop--active");
    document.body.style.overflow = "hidden";

    const firstFocusable = modal.querySelector("button, a, [tabindex]");
    if (firstFocusable) firstFocusable.focus();
  }

  function _closeModal() {
    const backdrop = document.getElementById("modal-backdrop");
    if (!backdrop) return;
    backdrop.classList.remove("modal-backdrop--active");
    document.body.style.overflow = "";
  }

  function _renderModalContent(repo) {
    const links = _buildLinks(repo);
    const meta = _buildMeta(repo);
    const topicsHTML = (repo.topics || [])
      .map((t) => `<span class="tag">${Utils.escapeHtml(t)}</span>`).join("");

    return `
      <div class="modal__header">
        <div>
          <h2 class="modal__title">${Utils.escapeHtml(repo.name)}</h2>
          <p class="modal__subtitle">${Utils.escapeHtml(repo.owner)} / ${Utils.escapeHtml(repo.name)}</p>
        </div>
        <button class="modal__close" aria-label="Close modal">${Icons.close()}</button>
      </div>
      <div class="modal__body">
        ${repo.description ? `
          <div class="modal__section">
            <h3 class="modal__section-title">Description</h3>
            <p class="modal__description">${Utils.escapeHtml(repo.description)}</p>
          </div>
        ` : ""}
        ${links.length > 0 ? `
          <div class="modal__section">
            <h3 class="modal__section-title">Links</h3>
            <div class="modal__links">${links.join("")}</div>
          </div>
        ` : ""}
        <div class="modal__section">
          <h3 class="modal__section-title">Details</h3>
          <div class="modal__meta">${meta.join("")}</div>
        </div>
        ${topicsHTML ? `
          <div class="modal__section">
            <h3 class="modal__section-title">Topics</h3>
            <div class="modal__topics">${topicsHTML}</div>
          </div>
        ` : ""}
      </div>
    `;
  }

  function _buildLinks(repo) {
    const links = [];
    if (repo.url) {
      links.push(`<a href="${Utils.escapeHtml(repo.url)}" target="_blank" rel="noopener noreferrer" class="modal__link"><span class="modal__link-icon">${Icons.github()}</span>Repository</a>`);
    }
    if (repo.pages_url) {
      links.push(`<a href="${Utils.escapeHtml(repo.pages_url)}" target="_blank" rel="noopener noreferrer" class="modal__link"><span class="modal__link-icon">${Icons.globe()}</span>GitHub Pages</a>`);
    }
    if (repo.homepage && repo.homepage !== repo.pages_url) {
      links.push(`<a href="${Utils.escapeHtml(repo.homepage)}" target="_blank" rel="noopener noreferrer" class="modal__link"><span class="modal__link-icon">${Icons.externalLink()}</span>Website</a>`);
    }
    return links;
  }

  function _buildMeta(repo) {
    const items = [];
    const m = (label, value) => `<div class="modal__meta-item"><span class="modal__meta-label">${label}</span><span class="modal__meta-value">${value}</span></div>`;

    if (repo.language) {
      items.push(m("Language", `<span class="repo-card__language"><span class="repo-card__language-dot" style="background-color: ${Utils.getLangColor(repo.language)}"></span> ${Utils.escapeHtml(repo.language)}</span>`));
    }
    items.push(m("Stars", repo.stars || 0));
    items.push(m("Forks", repo.forks || 0));
    items.push(m("Open Issues", repo.open_issues || 0));
    if (repo.commit_count != null) items.push(m("Commits", Utils.formatNumber(repo.commit_count)));
    if (repo.license) items.push(m("License", Utils.escapeHtml(repo.license)));
    if (repo.created_at) items.push(m("Created", Utils.formatDate(repo.created_at)));
    if (repo.pushed_at) items.push(m("Last Push", Utils.formatDate(repo.pushed_at)));
    if (repo.default_branch) items.push(m("Branch", Utils.escapeHtml(repo.default_branch)));
    return items;
  }

  return { render, init, destroy };
})();

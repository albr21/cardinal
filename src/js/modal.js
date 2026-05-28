const Modal = (() => {
  let _backdrop = null;
  let _currentRepo = null;

  function init() {
    _backdrop = document.getElementById("modal-backdrop");
    if (!_backdrop) return;

    _backdrop.addEventListener("click", (e) => {
      if (e.target === _backdrop) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && _backdrop.classList.contains("modal-backdrop--active")) {
        close();
      }
    });
  }

  function open(repo) {
    if (!_backdrop) return;
    _currentRepo = repo;

    const modal = _backdrop.querySelector(".modal");
    modal.innerHTML = renderContent(repo);

    const closeBtn = modal.querySelector(".modal__close");
    if (closeBtn) closeBtn.addEventListener("click", close);

    _backdrop.classList.add("modal-backdrop--active");
    document.body.style.overflow = "hidden";

    const firstFocusable = modal.querySelector("button, a, [tabindex]");
    if (firstFocusable) firstFocusable.focus();
  }

  function close() {
    if (!_backdrop) return;
    _backdrop.classList.remove("modal-backdrop--active");
    document.body.style.overflow = "";
    _currentRepo = null;
  }

  function renderContent(repo) {
    const links = buildLinks(repo);
    const meta = buildMeta(repo);
    const topicsHTML = (repo.topics || [])
      .map((t) => `<span class="tag">${Cards.escapeHtml(t)}</span>`)
      .join("");

    return `
      <div class="modal__header">
        <div>
          <h2 class="modal__title">${Cards.escapeHtml(repo.name)}</h2>
          <p class="modal__subtitle">${Cards.escapeHtml(repo.owner)} / ${Cards.escapeHtml(repo.name)}</p>
        </div>
        <button class="modal__close" aria-label="Close modal">${Icons.close()}</button>
      </div>
      <div class="modal__body">
        ${repo.description ? `
          <div class="modal__section">
            <h3 class="modal__section-title">Description</h3>
            <p class="modal__description">${Cards.escapeHtml(repo.description)}</p>
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

  function buildLinks(repo) {
    const links = [];

    if (repo.url) {
      links.push(`
        <a href="${Cards.escapeHtml(repo.url)}" target="_blank" rel="noopener noreferrer" class="modal__link">
          <span class="modal__link-icon">${Icons.github()}</span>
          Repository
        </a>
      `);
    }

    if (repo.pages_url) {
      links.push(`
        <a href="${Cards.escapeHtml(repo.pages_url)}" target="_blank" rel="noopener noreferrer" class="modal__link">
          <span class="modal__link-icon">${Icons.globe()}</span>
          GitHub Pages
        </a>
      `);
    }

    if (repo.homepage && repo.homepage !== repo.pages_url) {
      links.push(`
        <a href="${Cards.escapeHtml(repo.homepage)}" target="_blank" rel="noopener noreferrer" class="modal__link">
          <span class="modal__link-icon">${Icons.externalLink()}</span>
          Website
        </a>
      `);
    }

    return links;
  }

  function buildMeta(repo) {
    const items = [];

    if (repo.language) {
      items.push(metaItem("Language", `<span class="repo-card__language"><span class="repo-card__language-dot" style="background-color: ${Cards.getLangColor(repo.language)}"></span> ${Cards.escapeHtml(repo.language)}</span>`));
    }

    items.push(metaItem("Stars", repo.stars || 0));
    items.push(metaItem("Forks", repo.forks || 0));
    items.push(metaItem("Open Issues", repo.open_issues || 0));

    if (repo.license) {
      items.push(metaItem("License", Cards.escapeHtml(repo.license)));
    }

    if (repo.created_at) {
      items.push(metaItem("Created", Cards.formatDate(repo.created_at)));
    }

    if (repo.pushed_at) {
      items.push(metaItem("Last Push", Cards.formatDate(repo.pushed_at)));
    }

    if (repo.default_branch) {
      items.push(metaItem("Branch", Cards.escapeHtml(repo.default_branch)));
    }

    return items;
  }

  function metaItem(label, value) {
    return `
      <div class="modal__meta-item">
        <span class="modal__meta-label">${label}</span>
        <span class="modal__meta-value">${value}</span>
      </div>
    `;
  }

  return { init, open, close };
})();

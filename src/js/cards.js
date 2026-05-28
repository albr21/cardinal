const Cards = (() => {
  const LANG_COLORS = {
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    Python: "#3572A5",
    Java: "#b07219",
    Go: "#00ADD8",
    Rust: "#dea584",
    "C++": "#f34b7d",
    C: "#555555",
    "C#": "#239120",
    Ruby: "#701516",
    PHP: "#4F5D95",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    Shell: "#89e051",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Dockerfile: "#384d54",
    Makefile: "#427819",
    Lua: "#000080",
    Dart: "#00B4AB",
    Vue: "#41b883",
    Svelte: "#ff3e00",
    Elixir: "#6e4a7e",
    Haskell: "#5e5086",
    Scala: "#c22d40",
  };

  function getLangColor(language) {
    return LANG_COLORS[language] || "#8b8b8b";
  }

  function formatDate(dateStr) {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  function renderCard(repo) {
    const card = document.createElement("article");
    card.className = `repo-card${repo.is_pinned ? " repo-card--pinned" : ""}`;
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `View details for ${repo.name}`);
    card.dataset.repoName = repo.full_name;

    const topicsHTML = (repo.topics || [])
      .slice(0, 4)
      .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
      .join("");

    const moreTopics = (repo.topics || []).length > 4 ? `<span class="tag">+${repo.topics.length - 4}</span>` : "";

    card.innerHTML = `
      <div class="repo-card__header">
        <div>
          <div class="repo-card__owner">${escapeHtml(repo.owner)}</div>
          <h3 class="repo-card__name">${escapeHtml(repo.name)}</h3>
        </div>
        ${repo.is_pinned ? `<span class="repo-card__badge">${Icons.pin()} Pinned</span>` : ""}
      </div>
      <p class="repo-card__description">${escapeHtml(repo.description || "No description provided.")}</p>
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
            <span class="repo-card__language-dot" style="background-color: ${getLangColor(repo.language)}"></span>
            ${escapeHtml(repo.language)}
          </span>
        ` : ""}
      </div>
    `;

    card.addEventListener("click", () => Modal.open(repo));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        Modal.open(repo);
      }
    });

    return card;
  }

  function renderGrid(repos) {
    const grid = document.getElementById("repo-grid");
    if (!grid) return;

    grid.innerHTML = "";

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
    repos.forEach((repo) => fragment.appendChild(renderCard(repo)));
    grid.appendChild(fragment);
  }

  function updateResultCount(count, total) {
    const el = document.getElementById("result-count");
    if (!el) return;
    if (count === total) {
      el.textContent = `${total} repositories`;
    } else {
      el.textContent = `${count} of ${total} repositories`;
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  return { renderGrid, updateResultCount, formatDate, getLangColor, escapeHtml };
})();

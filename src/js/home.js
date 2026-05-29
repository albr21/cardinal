const HomeView = (() => {
  function render() {
    return `
      <div class="container">
        <section class="hero">
          <div class="hero__avatar" id="hero-avatar"></div>
          <h1 id="hero-title" class="hero__title">Cardinal</h1>
          <p id="hero-description" class="hero__description"></p>
        </section>

        <section class="stats-overview">
          <div class="stats-overview__grid" id="quick-stats"></div>
        </section>

        <section class="home-section" id="pages-section" style="display:none;">
          <h2 class="home-section__title">Websites</h2>
          <div class="pages-grid" id="pages-grid"></div>
        </section>

        <section class="home-section">
          <h2 class="home-section__title">Top Languages</h2>
          <div class="language-bar" id="language-bar"></div>
          <div class="language-legend" id="language-legend"></div>
        </section>

        <section class="home-section">
          <h2 class="home-section__title">Recently Updated</h2>
          <div class="recent-repos" id="recent-repos"></div>
        </section>
      </div>
    `;
  }

  function init() {
    renderSiteInfo();
    renderQuickStats();
    renderLanguageBar();
    renderRecentRepos();
    renderGitHubPages();
  }

  function renderSiteInfo() {
    const site = DataStore.getSiteConfig();
    const titleEl = document.getElementById("hero-title");
    if (titleEl) titleEl.textContent = site.title || "Cardinal";

    const descEl = document.getElementById("hero-description");
    if (descEl) descEl.textContent = site.description || "";
  }

  function renderQuickStats() {
    const stats = DataStore.getStats();
    const repos = DataStore.getRepos();
    const totalCommits = repos.reduce((sum, r) => sum + (r.commit_count || 0), 0);
    const hasCommits = repos.some((r) => r.commit_count != null);
    const totalTopics = new Set(repos.flatMap((r) => r.topics || [])).size;

    const container = document.getElementById("quick-stats");
    if (!container) return;

    container.innerHTML = `
      <div class="stat-card">
        <div class="stat-card__icon">${Icons.book()}</div>
        <span class="stat-card__value">${stats.totalRepos}</span>
        <span class="stat-card__label">Repositories</span>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon">${Icons.star()}</div>
        <span class="stat-card__value">${Utils.formatNumber(stats.totalStars)}</span>
        <span class="stat-card__label">Total Stars</span>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon">${Icons.gitFork()}</div>
        <span class="stat-card__value">${Utils.formatNumber(stats.totalForks)}</span>
        <span class="stat-card__label">Total Forks</span>
      </div>
      ${hasCommits ? `
      <div class="stat-card">
        <div class="stat-card__icon">${Icons.gitCommit()}</div>
        <span class="stat-card__value">${Utils.formatNumber(totalCommits)}</span>
        <span class="stat-card__label">Total Commits</span>
      </div>
      ` : ""}
      <div class="stat-card">
        <div class="stat-card__icon">${Icons.code()}</div>
        <span class="stat-card__value">${stats.languages}</span>
        <span class="stat-card__label">Languages</span>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon">${Icons.globe()}</div>
        <span class="stat-card__value">${totalTopics}</span>
        <span class="stat-card__label">Topics</span>
      </div>
    `;
  }

  function renderLanguageBar() {
    const repos = DataStore.getRepos();
    const langCount = {};
    repos.forEach((r) => {
      if (r.language) langCount[r.language] = (langCount[r.language] || 0) + 1;
    });

    const sorted = Object.entries(langCount).sort((a, b) => b[1] - a[1]);
    const total = repos.length;

    const barEl = document.getElementById("language-bar");
    if (barEl) {
      barEl.innerHTML = sorted
        .map(([lang, count]) => {
          const pct = (count / total) * 100;
          const color = Utils.getLangColor(lang);
          return `<div class="language-bar__segment" style="flex:${count};background-color:${color}" title="${lang}: ${count} repos (${pct.toFixed(1)}%)"></div>`;
        })
        .join("");
    }

    const legendEl = document.getElementById("language-legend");
    if (legendEl) {
      legendEl.innerHTML = sorted
        .slice(0, 10)
        .map(([lang, count]) => {
          const color = Utils.getLangColor(lang);
          const pct = ((count / total) * 100).toFixed(1);
          return `<span class="language-legend__item"><span class="language-legend__dot" style="background-color:${color}"></span>${lang} (${pct}%)</span>`;
        })
        .join("");
    }
  }

  function renderRecentRepos() {
    const repos = DataStore.getRepos();
    const recent = [...repos]
      .sort((a, b) => (b.pushed_at || "").localeCompare(a.pushed_at || ""))
      .slice(0, 5);

    const container = document.getElementById("recent-repos");
    if (!container) return;

    container.innerHTML = recent
      .map((repo) => `
        <a href="#/repos?search=${encodeURIComponent(repo.name)}" class="recent-repo">
          <div class="recent-repo__info">
            <span class="recent-repo__name">${Utils.escapeHtml(repo.full_name)}</span>
            <span class="recent-repo__meta">${Utils.escapeHtml(repo.language || "—")} · ${repo.stars} stars</span>
          </div>
          <span class="recent-repo__date">${Utils.formatDate(repo.pushed_at)}</span>
        </a>
      `)
      .join("");
  }

  function renderGitHubPages() {
    const repos = DataStore.getRepos();
    const withPages = repos.filter((r) => r.pages_url || r.homepage);

    const section = document.getElementById("pages-section");
    const container = document.getElementById("pages-grid");
    if (!container || !section || withPages.length === 0) return;

    section.style.display = "";

    container.innerHTML = withPages
      .map((repo) => {
        const siteUrl = repo.pages_url || repo.homepage;
        const domain = new URL(siteUrl).hostname;
        const faviconUrl = `${siteUrl.replace(/\/$/, '')}/src/static/favicon.svg`;
        return `
          <a href="${Utils.escapeHtml(siteUrl)}" target="_blank" rel="noopener noreferrer" class="pages-card">
            <img class="pages-card__favicon" src="${faviconUrl}" alt="" width="24" height="24"
              onerror="this.onerror=null;this.src='src/static/favicon.svg'">
            <div class="pages-card__info">
              <span class="pages-card__name">${Utils.escapeHtml(repo.name)}</span>
              <span class="pages-card__url">${Utils.escapeHtml(domain)}</span>
            </div>
            <span class="pages-card__arrow">${Icons.externalLink()}</span>
          </a>
        `;
      })
      .join("");
  }

  return { render, init };
})();

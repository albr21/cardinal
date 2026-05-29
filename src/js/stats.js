const StatsView = (() => {
  const LINES_PER_KB = 25;

  function render() {
    return `
      <div class="container">
        <section class="hero">
          <h1 class="hero__title">Statistics</h1>
          <p class="hero__description">In-depth analytics across all repositories.</p>
        </section>

        <section class="stats-section">
          <h2 class="stats-section__title">Overview</h2>
          <div class="stats-cards" id="stats-overview-cards"></div>
        </section>

        <section class="stats-section">
          <h2 class="stats-section__title">Language Distribution</h2>
          <div class="stats-panel">
            <div class="language-chart" id="language-chart"></div>
            <div class="language-details" id="language-details"></div>
          </div>
        </section>

        <section class="stats-section">
          <h2 class="stats-section__title">Activity Timeline</h2>
          <div class="stats-panel">
            <div class="activity-grid" id="activity-grid"></div>
          </div>
        </section>

        <section class="stats-section">
          <h2 class="stats-section__title">Top Repositories by Stars</h2>
          <div class="stats-panel">
            <div class="top-repos-chart" id="top-repos-chart"></div>
          </div>
        </section>

        <section class="stats-section" id="commits-section" style="display:none;">
          <h2 class="stats-section__title">Top Repositories by Commits</h2>
          <div class="stats-panel">
            <div class="top-repos-chart" id="top-repos-commits-chart"></div>
          </div>
        </section>

        <section class="stats-section">
          <h2 class="stats-section__title">Code Size Estimates</h2>
          <div class="stats-panel">
            <div class="size-table" id="size-table"></div>
          </div>
        </section>

        <section class="stats-section">
          <h2 class="stats-section__title">Topics</h2>
          <div class="stats-panel">
            <div class="topics-cloud" id="topics-cloud"></div>
          </div>
        </section>

        <section class="stats-section">
          <h2 class="stats-section__title">By Owner / Organization</h2>
          <div class="stats-panel">
            <div class="owners-breakdown" id="owners-breakdown"></div>
          </div>
        </section>
      </div>
    `;
  }

  function init() {
    renderOverviewCards();
    renderLanguageChart();
    renderActivityTimeline();
    renderSizeTable();
    renderTopRepos();
    renderTopReposByCommits();
    renderTopicsCloud();
    renderOwnersBreakdown();
  }

  function renderOverviewCards() {
    const repos = DataStore.getRepos();
    const stats = DataStore.getStats();
    const totalSize = repos.reduce((sum, r) => sum + (r.size_kb || 0), 0);
    const estimatedLines = totalSize * LINES_PER_KB;
    const avgStars = repos.length > 0 ? Math.round(stats.totalStars / repos.length) : 0;
    const withPages = repos.filter((r) => r.pages_url || r.homepage).length;
    const owners = new Set(repos.map((r) => r.owner)).size;
    const totalCommits = repos.reduce((sum, r) => sum + (r.commit_count || 0), 0);
    const hasCommits = repos.some((r) => r.commit_count != null);

    const container = document.getElementById("stats-overview-cards");
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
        <span class="stat-card__value">~${Utils.formatNumber(estimatedLines)}</span>
        <span class="stat-card__label">Est. Lines of Code</span>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon">${Icons.archive()}</div>
        <span class="stat-card__value">${Utils.formatSize(totalSize)}</span>
        <span class="stat-card__label">Total Code Size</span>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon">${Icons.globe()}</div>
        <span class="stat-card__value">${withPages}</span>
        <span class="stat-card__label">Websites</span>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon">${Icons.github()}</div>
        <span class="stat-card__value">${owners}</span>
        <span class="stat-card__label">Owners / Orgs</span>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon">${Icons.star()}</div>
        <span class="stat-card__value">${avgStars}</span>
        <span class="stat-card__label">Avg Stars / Repo</span>
      </div>
    `;
  }

  function renderLanguageChart() {
    const repos = DataStore.getRepos();
    const langData = {};
    repos.forEach((r) => {
      if (r.language) {
        if (!langData[r.language]) langData[r.language] = { count: 0, stars: 0, size: 0 };
        langData[r.language].count++;
        langData[r.language].stars += r.stars || 0;
        langData[r.language].size += r.size_kb || 0;
      }
    });

    const sorted = Object.entries(langData).sort((a, b) => b[1].count - a[1].count);
    const total = repos.filter((r) => r.language).length;

    const chartEl = document.getElementById("language-chart");
    if (chartEl) {
      const barSegments = sorted.map(([lang, data]) => {
        const pct = (data.count / total) * 100;
        const color = Utils.getLangColor(lang);
        return `<div class="language-bar__segment" style="width:${pct}%;background-color:${color}" title="${lang}: ${data.count} repos"></div>`;
      }).join("");
      chartEl.innerHTML = `<div class="language-bar">${barSegments}</div>`;
    }

    const detailsEl = document.getElementById("language-details");
    if (detailsEl) {
      detailsEl.innerHTML = sorted.map(([lang, data]) => {
        const color = Utils.getLangColor(lang);
        const pct = ((data.count / total) * 100).toFixed(1);
        return `
          <div class="language-detail">
            <span class="language-detail__name">
              <span class="language-legend__dot" style="background-color:${color}"></span>
              ${Utils.escapeHtml(lang)}
            </span>
            <span class="language-detail__count">${data.count} repos (${pct}%)</span>
          </div>
        `;
      }).join("");
    }
  }

  function renderActivityTimeline() {
    const repos = DataStore.getRepos();
    const now = new Date();
    const currentYear = now.getFullYear();

    // Build yearly activity (last 6 years including current)
    const years = [];
    for (let i = 5; i >= 0; i--) {
      years.push({ label: String(currentYear - i), year: currentYear - i, count: 0 });
    }

    repos.forEach((r) => {
      if (!r.pushed_at) return;
      const y = new Date(r.pushed_at).getFullYear();
      const entry = years.find((e) => e.year === y);
      if (entry) entry.count++;
    });

    const maxCount = Math.max(...years.map((y) => y.count), 1);
    const container = document.getElementById("activity-grid");
    if (!container) return;

    container.innerHTML = `
      <div class="activity-chart">
        ${years.map((y) => {
          const heightPct = (y.count / maxCount) * 100;
          return `
            <div class="activity-chart__col">
              <div class="activity-chart__bar-wrap">
                <div class="activity-chart__bar" style="height:${heightPct}%" title="${y.count} repos updated in ${y.label}"></div>
              </div>
              <span class="activity-chart__count">${y.count}</span>
              <span class="activity-chart__label">${y.label}</span>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderSizeTable() {
    const repos = DataStore.getRepos();
    const sorted = [...repos].sort((a, b) => (b.size_kb || 0) - (a.size_kb || 0)).slice(0, 15);
    const maxSize = sorted[0]?.size_kb || 1;

    const container = document.getElementById("size-table");
    if (!container) return;

    const rows = sorted.map((repo) => {
      const pct = ((repo.size_kb || 0) / maxSize) * 100;
      const lines = (repo.size_kb || 0) * LINES_PER_KB;
      return `
        <tr>
          <td>${Utils.escapeHtml(repo.name)}</td>
          <td>${Utils.escapeHtml(repo.language || "\u2014")}</td>
          <td>${Utils.formatSize(repo.size_kb || 0)}</td>
          <td>~${Utils.formatNumber(lines)}</td>
          <td><span class="size-table__bar" style="width:${pct}%"></span></td>
        </tr>
      `;
    }).join("");

    container.innerHTML = `
      <table>
        <thead><tr><th>Repository</th><th>Language</th><th>Size</th><th>Est. Lines</th><th>Relative</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  function renderTopRepos() {
    const repos = DataStore.getRepos();
    const top = [...repos].sort((a, b) => (b.stars || 0) - (a.stars || 0)).slice(0, 10);
    const maxStars = top[0]?.stars || 1;

    const container = document.getElementById("top-repos-chart");
    if (!container) return;

    container.innerHTML = top.map((repo) => {
      const pct = ((repo.stars || 0) / maxStars) * 100;
      return `
        <div class="top-repo-bar">
          <span class="top-repo-bar__name" title="${Utils.escapeHtml(repo.full_name)}">${Utils.escapeHtml(repo.name)}</span>
          <div class="top-repo-bar__bar">
            <div class="top-repo-bar__fill" style="width:${pct}%"></div>
          </div>
          <span class="top-repo-bar__value">${repo.stars}</span>
        </div>
      `;
    }).join("");
  }

  function renderTopReposByCommits() {
    const repos = DataStore.getRepos();
    const withCommits = repos.filter((r) => r.commit_count != null && r.commit_count > 0);
    if (withCommits.length === 0) return;

    const section = document.getElementById("commits-section");
    if (section) section.style.display = "";

    const top = [...withCommits].sort((a, b) => b.commit_count - a.commit_count).slice(0, 10);
    const maxCommits = top[0]?.commit_count || 1;

    const container = document.getElementById("top-repos-commits-chart");
    if (!container) return;

    container.innerHTML = top.map((repo) => {
      const pct = (repo.commit_count / maxCommits) * 100;
      return `
        <div class="top-repo-bar">
          <span class="top-repo-bar__name" title="${Utils.escapeHtml(repo.full_name)}">${Utils.escapeHtml(repo.name)}</span>
          <div class="top-repo-bar__bar">
            <div class="top-repo-bar__fill" style="width:${pct}%"></div>
          </div>
          <span class="top-repo-bar__value">${Utils.formatNumber(repo.commit_count)}</span>
        </div>
      `;
    }).join("");
  }

  function renderTopicsCloud() {
    const repos = DataStore.getRepos();
    const topicCounts = {};
    repos.forEach((r) => {
      (r.topics || []).forEach((t) => { topicCounts[t] = (topicCounts[t] || 0) + 1; });
    });

    const sorted = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);
    const maxCount = sorted[0]?.[1] || 1;

    const container = document.getElementById("topics-cloud");
    if (!container) return;

    container.innerHTML = sorted.map(([topic, count]) => {
      const ratio = count / maxCount;
      let sizeClass = "";
      if (ratio > 0.6) sizeClass = "topics-cloud__tag--lg";
      else if (ratio > 0.3) sizeClass = "topics-cloud__tag--md";
      return `<span class="topics-cloud__tag ${sizeClass}" title="${count} repos">${Utils.escapeHtml(topic)}</span>`;
    }).join("");
  }

  function renderOwnersBreakdown() {
    const repos = DataStore.getRepos();
    const ownersMetadata = DataStore.getOwnersData();
    const ownerData = {};
    repos.forEach((r) => {
      if (!ownerData[r.owner]) ownerData[r.owner] = { repos: 0, stars: 0, forks: 0 };
      ownerData[r.owner].repos++;
      ownerData[r.owner].stars += r.stars || 0;
      ownerData[r.owner].forks += r.forks || 0;
    });

    const container = document.getElementById("owners-breakdown");
    if (!container) return;

    container.innerHTML = Object.entries(ownerData)
      .sort((a, b) => b[1].repos - a[1].repos)
      .map(([owner, data]) => {
        const meta = ownersMetadata[owner] || {};
        const avatarUrl = meta.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(owner)}`;
        const ownerType = meta.type || "User";
        return `
          <div class="owner-card">
            <div class="owner-card__header">
              <img class="owner-card__avatar" src="${Utils.escapeHtml(avatarUrl)}" alt="${Utils.escapeHtml(owner)}" loading="lazy">
              <div>
                <h3 class="owner-card__name">${Utils.escapeHtml(owner)}</h3>
                <span class="owner-card__type">${Utils.escapeHtml(ownerType)}</span>
              </div>
            </div>
            <div class="owner-card__stats">
              <div class="owner-card__stat">
                <div class="owner-card__stat-value">${data.repos}</div>
                <div class="owner-card__stat-label">Repos</div>
              </div>
              <div class="owner-card__stat">
                <div class="owner-card__stat-value">${Utils.formatNumber(data.stars)}</div>
                <div class="owner-card__stat-label">Stars</div>
              </div>
              <div class="owner-card__stat">
                <div class="owner-card__stat-value">${Utils.formatNumber(data.forks)}</div>
                <div class="owner-card__stat-label">Forks</div>
              </div>
            </div>
          </div>
        `;
      }).join("");
  }

  return { render, init };
})();

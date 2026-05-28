const Stats = (() => {
  const LANG_COLORS = {
    JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5",
    Java: "#b07219", Go: "#00ADD8", Rust: "#dea584", "C++": "#f34b7d",
    C: "#555555", "C#": "#239120", Ruby: "#701516", PHP: "#4F5D95",
    Swift: "#F05138", Kotlin: "#A97BFF", Shell: "#89e051", HTML: "#e34c26",
    CSS: "#563d7c", Dockerfile: "#384d54", Makefile: "#427819", Vue: "#41b883",
    HCL: "#844fba",
  };

  // Rough estimate: 1 KB ≈ 25 lines of code (industry approximation)
  const LINES_PER_KB = 25;

  async function init() {
    Theme.init();

    try {
      await DataStore.load();
    } catch {
      return;
    }

    renderOverviewCards();
    renderLanguageChart();
    renderActivityTimeline();
    renderSizeTable();
    renderTopRepos();
    renderTopicsCloud();
    renderOwnersBreakdown();
    renderGeneratedAt();
  }

  function renderOverviewCards() {
    const repos = DataStore.getRepos();
    const stats = DataStore.getStats();
    const totalSize = repos.reduce((sum, r) => sum + (r.size_kb || 0), 0);
    const estimatedLines = totalSize * LINES_PER_KB;
    const avgStars = repos.length > 0 ? Math.round(stats.totalStars / repos.length) : 0;
    const withPages = repos.filter((r) => r.pages_url).length;
    const owners = new Set(repos.map((r) => r.owner)).size;
    const totalIssues = repos.reduce((sum, r) => sum + (r.open_issues || 0), 0);

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
        <span class="stat-card__value">${formatNumber(stats.totalStars)}</span>
        <span class="stat-card__label">Total Stars</span>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon">${Icons.gitFork()}</div>
        <span class="stat-card__value">${formatNumber(stats.totalForks)}</span>
        <span class="stat-card__label">Total Forks</span>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon">${Icons.code()}</div>
        <span class="stat-card__value">~${formatNumber(estimatedLines)}</span>
        <span class="stat-card__label">Est. Lines of Code</span>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon">${Icons.archive()}</div>
        <span class="stat-card__value">${formatSize(totalSize)}</span>
        <span class="stat-card__label">Total Code Size</span>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon">${Icons.globe()}</div>
        <span class="stat-card__value">${withPages}</span>
        <span class="stat-card__label">GitHub Pages</span>
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
        const color = LANG_COLORS[lang] || "#8b8b8b";
        return `<div class="language-bar__segment" style="width:${pct}%;background-color:${color}" title="${lang}: ${data.count} repos"></div>`;
      }).join("");

      chartEl.innerHTML = `<div class="language-bar">${barSegments}</div>`;
    }

    const detailsEl = document.getElementById("language-details");
    if (detailsEl) {
      detailsEl.innerHTML = sorted.map(([lang, data]) => {
        const color = LANG_COLORS[lang] || "#8b8b8b";
        const pct = ((data.count / total) * 100).toFixed(1);
        return `
          <div class="language-detail">
            <span class="language-detail__name">
              <span class="language-legend__dot" style="background-color:${color}"></span>
              ${escapeHtml(lang)}
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
    const periods = [
      { label: "This week", days: 7 },
      { label: "This month", days: 30 },
      { label: "3 months", days: 90 },
      { label: "6 months", days: 180 },
      { label: "This year", days: 365 },
      { label: "Older", days: Infinity },
    ];

    const counts = periods.map((p) => {
      const count = repos.filter((r) => {
        if (!r.pushed_at) return p.days === Infinity;
        const diff = (now - new Date(r.pushed_at)) / (1000 * 60 * 60 * 24);
        if (p.days === Infinity) return diff > 365;
        return diff <= p.days;
      }).length;
      return { ...p, count };
    });

    for (let i = counts.length - 2; i >= 0; i--) {
      // counts[i] includes all repos pushed within N days, make it exclusive
    }
    // Actually recompute as exclusive ranges
    const exclusive = [];
    let prevDays = 0;
    for (const p of periods) {
      const count = repos.filter((r) => {
        if (!r.pushed_at) return p.days === Infinity;
        const diff = (now - new Date(r.pushed_at)) / (1000 * 60 * 60 * 24);
        if (p.days === Infinity) return diff > prevDays;
        return diff <= p.days && diff > prevDays;
      }).length;
      exclusive.push({ label: p.label, count });
      if (p.days !== Infinity) prevDays = p.days;
    }

    const maxCount = Math.max(...exclusive.map((e) => e.count), 1);

    const container = document.getElementById("activity-grid");
    if (!container) return;

    container.innerHTML = exclusive.map((item) => `
      <div class="activity-row">
        <span class="activity-row__label">${item.label}</span>
        <div class="activity-row__bar">
          <div class="activity-row__fill" style="width:${(item.count / maxCount) * 100}%"></div>
        </div>
        <span class="activity-row__value">${item.count}</span>
      </div>
    `).join("");
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
          <td>${escapeHtml(repo.name)}</td>
          <td>${escapeHtml(repo.language || "—")}</td>
          <td>${formatSize(repo.size_kb || 0)}</td>
          <td>~${formatNumber(lines)}</td>
          <td><span class="size-table__bar" style="width:${pct}%"></span></td>
        </tr>
      `;
    }).join("");

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Repository</th>
            <th>Language</th>
            <th>Size</th>
            <th>Est. Lines</th>
            <th>Relative</th>
          </tr>
        </thead>
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
          <span class="top-repo-bar__name" title="${escapeHtml(repo.full_name)}">${escapeHtml(repo.name)}</span>
          <div class="top-repo-bar__bar">
            <div class="top-repo-bar__fill" style="width:${pct}%"></div>
          </div>
          <span class="top-repo-bar__value">${repo.stars}</span>
        </div>
      `;
    }).join("");
  }

  function renderTopicsCloud() {
    const repos = DataStore.getRepos();
    const topicCounts = {};
    repos.forEach((r) => {
      (r.topics || []).forEach((t) => {
        topicCounts[t] = (topicCounts[t] || 0) + 1;
      });
    });

    const sorted = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);
    const maxCount = sorted[0]?.[1] || 1;

    const container = document.getElementById("topics-cloud");
    if (!container) return;

    container.innerHTML = sorted.map(([topic, count]) => {
      let sizeClass = "";
      const ratio = count / maxCount;
      if (ratio > 0.6) sizeClass = "topics-cloud__tag--lg";
      else if (ratio > 0.3) sizeClass = "topics-cloud__tag--md";
      return `<span class="topics-cloud__tag ${sizeClass}" title="${count} repos">${escapeHtml(topic)}</span>`;
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
              <img class="owner-card__avatar" src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(owner)}" loading="lazy">
              <div>
                <h3 class="owner-card__name">${escapeHtml(owner)}</h3>
                <span class="owner-card__type">${escapeHtml(ownerType)}</span>
              </div>
            </div>
            <div class="owner-card__stats">
              <div class="owner-card__stat">
                <div class="owner-card__stat-value">${data.repos}</div>
                <div class="owner-card__stat-label">Repos</div>
              </div>
              <div class="owner-card__stat">
                <div class="owner-card__stat-value">${formatNumber(data.stars)}</div>
                <div class="owner-card__stat-label">Stars</div>
              </div>
              <div class="owner-card__stat">
                <div class="owner-card__stat-value">${formatNumber(data.forks)}</div>
                <div class="owner-card__stat-label">Forks</div>
              </div>
            </div>
          </div>
        `;
      }).join("");
  }

  function renderGeneratedAt() {
    const el = document.getElementById("generated-at");
    if (!el) return;
    const date = DataStore.getGeneratedAt();
    el.textContent = date ? `Generated: ${toRFC3339Local(new Date(date))}` : "";
  }

  function formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "k";
    return n.toString();
  }

  function formatSize(kb) {
    if (kb >= 1024 * 1024) return (kb / (1024 * 1024)).toFixed(1) + " GB";
    if (kb >= 1024) return (kb / 1024).toFixed(1) + " MB";
    return kb + " KB";
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", Stats.init);

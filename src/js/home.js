const Home = (() => {
  const LANG_COLORS = {
    JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5",
    Java: "#b07219", Go: "#00ADD8", Rust: "#dea584", "C++": "#f34b7d",
    C: "#555555", "C#": "#239120", Ruby: "#701516", PHP: "#4F5D95",
    Swift: "#F05138", Kotlin: "#A97BFF", Shell: "#89e051", HTML: "#e34c26",
    CSS: "#563d7c", Dockerfile: "#384d54", Makefile: "#427819", Vue: "#41b883",
    HCL: "#844fba",
  };

  async function init() {
    Theme.init();

    try {
      await DataStore.load();
    } catch {
      return;
    }

    renderSiteInfo();
    renderQuickStats();
    renderLanguageBar();
    renderRecentRepos();
    renderGeneratedAt();
  }

  function renderSiteInfo() {
    const site = DataStore.getSiteConfig();
    const titleEl = document.getElementById("hero-title");
    if (titleEl) titleEl.textContent = site.title;

    const descEl = document.getElementById("hero-description");
    if (descEl) descEl.textContent = site.description || "";
  }

  function renderQuickStats() {
    const stats = DataStore.getStats();
    const repos = DataStore.getRepos();
    const totalSize = repos.reduce((sum, r) => sum + (r.size_kb || 0), 0);
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
        <span class="stat-card__value">${stats.languages}</span>
        <span class="stat-card__label">Languages</span>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon">${Icons.archive()}</div>
        <span class="stat-card__value">${formatSize(totalSize)}</span>
        <span class="stat-card__label">Total Code</span>
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
          const color = LANG_COLORS[lang] || "#8b8b8b";
          return `<div class="language-bar__segment" style="flex:${count};background-color:${color}" title="${lang}: ${count} repos (${pct.toFixed(1)}%)"></div>`;
        })
        .join("");
    }

    const legendEl = document.getElementById("language-legend");
    if (legendEl) {
      legendEl.innerHTML = sorted
        .slice(0, 10)
        .map(([lang, count]) => {
          const color = LANG_COLORS[lang] || "#8b8b8b";
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
        <a href="repos.html?repo=${encodeURIComponent(repo.name)}" class="recent-repo">
          <div class="recent-repo__info">
            <span class="recent-repo__name">${escapeHtml(repo.full_name)}</span>
            <span class="recent-repo__meta">${escapeHtml(repo.language || "—")} · ${repo.stars} stars</span>
          </div>
          <span class="recent-repo__date">${formatDate(repo.pushed_at)}</span>
        </a>
      `)
      .join("");
  }

  function renderGeneratedAt() {
    const el = document.getElementById("generated-at");
    if (!el) return;
    const date = DataStore.getGeneratedAt();
    el.textContent = date ? `Generated: ${toRFC3339Local(new Date(date))}` : "";
  }

  function formatNumber(n) {
    if (n >= 1000) return (n / 1000).toFixed(1) + "k";
    return n.toString();
  }

  function formatSize(kb) {
    if (kb >= 1024 * 1024) return (kb / (1024 * 1024)).toFixed(1) + " GB";
    if (kb >= 1024) return (kb / 1024).toFixed(1) + " MB";
    return kb + " KB";
  }

  function formatDate(dateStr) {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 1) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays}d ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", Home.init);

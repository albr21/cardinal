const Utils = (() => {
  const LANG_COLORS = {
    JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5",
    Java: "#b07219", Go: "#00ADD8", Rust: "#dea584", "C++": "#f34b7d",
    C: "#555555", "C#": "#239120", Ruby: "#701516", PHP: "#4F5D95",
    Swift: "#F05138", Kotlin: "#A97BFF", Shell: "#89e051", HTML: "#e34c26",
    CSS: "#563d7c", Dockerfile: "#384d54", Makefile: "#427819", Vue: "#41b883",
    HCL: "#844fba", Lua: "#000080", Dart: "#00B4AB", Svelte: "#ff3e00",
    Elixir: "#6e4a7e", Haskell: "#5e5086", Scala: "#c22d40",
  };

  function getLangColor(language) {
    return LANG_COLORS[language] || "#8b8b8b";
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
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

  function toRFC3339Local(date) {
    const pad = (n) => String(n).padStart(2, '0');
    const offsetMin = -date.getTimezoneOffset();
    const sign = offsetMin >= 0 ? '+' : '-';
    const absOffset = Math.abs(offsetMin);
    const offsetHours = pad(Math.floor(absOffset / 60));
    const offsetMinutes = pad(absOffset % 60);

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${offsetHours}:${offsetMinutes}`;
  }

  function renderGeneratedAt() {
    const el = document.getElementById("generated-at");
    if (!el) return;
    const date = DataStore.getGeneratedAt();
    el.textContent = date ? `Generated: ${toRFC3339Local(new Date(date))}` : "";
  }

  return {
    LANG_COLORS,
    getLangColor,
    escapeHtml,
    formatNumber,
    formatSize,
    formatDate,
    toRFC3339Local,
    renderGeneratedAt,
  };
})();
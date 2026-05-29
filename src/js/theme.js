const Theme = (() => {
  const STORAGE_KEY = "cardinal-theme";
  const DARK = "dark";
  const LIGHT = "light";

  function getPreferred() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === DARK || stored === LIGHT) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? DARK : LIGHT;
  }

  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    updateToggleIcon(theme);
  }

  function toggle() {
    const current = document.documentElement.getAttribute("data-theme");
    apply(current === DARK ? LIGHT : DARK);
  }

  function updateToggleIcon(theme) {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.innerHTML = theme === DARK ? Icons.sun() : Icons.moon();
    btn.setAttribute("aria-label", `Switch to ${theme === DARK ? "light" : "dark"} mode`);
  }

  function init() {
    apply(getPreferred());
    const btn = document.getElementById("theme-toggle");
    if (btn) btn.addEventListener("click", toggle);

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        apply(e.matches ? DARK : LIGHT);
      }
    });
  }

  return { init };
})();

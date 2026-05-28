const Search = (() => {
  let _query = "";
  let _languageFilter = null;
  let _ownerFilter = null;
  let _onUpdate = null;

  function init(onUpdate) {
    _onUpdate = onUpdate;
    const input = document.getElementById("search-input");
    if (input) {
      input.addEventListener("input", (e) => {
        _query = e.target.value.trim().toLowerCase();
        _notify();
      });
    }
  }

  function setLanguageFilter(lang) {
    _languageFilter = _languageFilter === lang ? null : lang;
    _notify();
    return _languageFilter;
  }

  function setOwnerFilter(owner) {
    _ownerFilter = _ownerFilter === owner ? null : owner;
    _notify();
    return _ownerFilter;
  }

  function getActiveFilters() {
    return {
      query: _query,
      language: _languageFilter,
      owner: _ownerFilter,
    };
  }

  function filter(repos) {
    return repos.filter((repo) => {
      // Text search
      if (_query) {
        const searchable = [
          repo.name,
          repo.description,
          repo.owner,
          repo.language,
          ...(repo.topics || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(_query)) return false;
      }

      // Language filter
      if (_languageFilter && repo.language !== _languageFilter) return false;

      // Owner filter
      if (_ownerFilter && repo.owner !== _ownerFilter) return false;

      return true;
    });
  }

  function _notify() {
    if (_onUpdate) _onUpdate();
  }

  function reset() {
    _query = "";
    _languageFilter = null;
    _ownerFilter = null;
    const input = document.getElementById("search-input");
    if (input) input.value = "";
    _notify();
  }

  return { init, filter, setLanguageFilter, setOwnerFilter, getActiveFilters, reset };
})();

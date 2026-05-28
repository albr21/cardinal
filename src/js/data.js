const DataStore = (() => {
  let _repos = [];
  let _site = {};
  let _owners = {};
  let _generatedAt = "";
  let _loaded = false;

  async function load(url = "data/repos.json") {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status}`);
      }
      const data = await response.json();
      _repos = data.repos || [];
      _site = data.site || {};
      _owners = data.owners || {};
      _generatedAt = data.generated_at || "";
      _loaded = true;
      return data;
    } catch (error) {
      console.error("DataStore: Failed to load repository data.", error);
      throw error;
    }
  }

  function getRepos() {
    return _repos;
  }

  function getSiteConfig() {
    return _site;
  }

  function getOwnersData() {
    return _owners;
  }

  function getGeneratedAt() {
    return _generatedAt;
  }

  function isLoaded() {
    return _loaded;
  }

  function getLanguages() {
    const langs = new Set();
    _repos.forEach((repo) => {
      if (repo.language) langs.add(repo.language);
    });
    return Array.from(langs).sort();
  }

  function getTopics() {
    const topics = new Map();
    _repos.forEach((repo) => {
      (repo.topics || []).forEach((topic) => {
        topics.set(topic, (topics.get(topic) || 0) + 1);
      });
    });
    return Array.from(topics.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic);
  }

  function getOwners() {
    const owners = new Set();
    _repos.forEach((repo) => {
      if (repo.owner) owners.add(repo.owner);
    });
    return Array.from(owners).sort();
  }

  function getStats() {
    return {
      totalRepos: _repos.length,
      totalStars: _repos.reduce((sum, r) => sum + (r.stars || 0), 0),
      totalForks: _repos.reduce((sum, r) => sum + (r.forks || 0), 0),
      languages: new Set(_repos.map((r) => r.language).filter(Boolean)).size,
    };
  }

  return {
    load,
    getRepos,
    getSiteConfig,
    getOwnersData,
    getGeneratedAt,
    isLoaded,
    getLanguages,
    getTopics,
    getOwners,
    getStats,
  };
})();

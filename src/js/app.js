const App = (() => {
  async function init() {
    Theme.init();

    try {
      await DataStore.load('src/data/repos.json');
    } catch {
      document.getElementById('app-main').innerHTML = `
        <div class="container">
          <div class="empty-state">
            <div class="empty-state__icon">${Icons.code()}</div>
            <h3 class="empty-state__title">Unable to load repository data</h3>
            <p>Make sure to run the build script first:<br><code>make build</code></p>
          </div>
        </div>
      `;
      return;
    }

    Utils.renderGeneratedAt();

    Router.register('home', HomeView);
    Router.register('repos', ReposView);
    Router.register('stats', StatsView);
    Router.start('app-main');
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);

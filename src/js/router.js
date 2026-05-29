const Router = (() => {
  let _routes = {};
  let _currentView = null;
  let _container = null;

  function register(name, view) {
    _routes[name] = view;
  }

  function start(containerId) {
    _container = document.getElementById(containerId);
    window.addEventListener('hashchange', () => _onRouteChange());
    _onRouteChange();
  }

  function _getRouteName() {
    const hash = window.location.hash.replace('#/', '') || 'home';
    return hash.split('?')[0] || 'home';
  }

  function _getParams() {
    const hash = window.location.hash;
    const qIndex = hash.indexOf('?');
    if (qIndex === -1) return {};
    return Object.fromEntries(new URLSearchParams(hash.slice(qIndex)));
  }

  function _onRouteChange() {
    const name = _getRouteName();
    const view = _routes[name];

    if (!view) {
      navigate('home');
      return;
    }

    if (_currentView && _currentView.destroy) {
      _currentView.destroy();
    }

    _currentView = view;
    _container.innerHTML = view.render();

    if (view.init) {
      view.init(_getParams());
    }

    _updateNav(name);
    _updateTitle(name);
    window.scrollTo(0, 0);
  }

  function _updateNav(name) {
    document.querySelectorAll('.nav__link[data-route]').forEach(link => {
      link.classList.toggle('nav__link--active', link.dataset.route === name);
    });
  }

  function _updateTitle(name) {
    const titles = { home: 'Home', repos: 'Repositories', stats: 'Statistics' };
    document.title = `${titles[name] || 'Home'} - Cardinal`;
  }

  function navigate(route) {
    window.location.hash = `/${route}`;
  }

  return { register, start, navigate };
})();

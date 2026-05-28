async function loadComponent(componentName, targetSelector) {
  try {
    const response = await fetch(`components/${componentName}.html`);
    if (!response.ok) throw new Error(`Failed to load ${componentName}`);
    const html = await response.text();
    const target = document.querySelector(targetSelector);
    if (target) {
      target.innerHTML = html;
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error loading component ${componentName}:`, error);
    return false;
  }
}

async function initializeComponents(currentPage = null) {
  try {
    await Promise.all([
      loadComponent('header', '[data-component="header"]'),
      loadComponent('footer', '[data-component="footer"]'),
      loadComponent('modal', '[data-component="modal"]')
    ]);

    // Set active nav link based on currentPage
    const navLinks = document.querySelectorAll('.nav__link[data-page]');
    navLinks.forEach(link => {
      link.classList.remove('nav__link--active');
      if (currentPage && link.dataset.page === currentPage) {
        link.classList.add('nav__link--active');
      }
    });

    if (typeof Theme !== 'undefined' && Theme.init) {
      Theme.init();
    }

    return true;
  } catch (error) {
    console.error('Error initializing components:', error);
    return false;
  }
}

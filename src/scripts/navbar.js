const navbar = document.querySelector('.navbar');
const hero = document.querySelector('#hero');
const menuToggle = document.querySelector('.navbar-menu-toggle');
const mobileMenu = document.querySelector('#navbar-mobile-menu');
const mobileLinks = document.querySelectorAll('.navbar-mobile-link');
const desktopBreakpoint = window.matchMedia('(min-width: 768px)');

if (navbar && hero) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      navbar.classList.toggle('scrolled', !entry.isIntersecting);
    },
    { threshold: 0.1 },
  );

  observer.observe(hero);
} else if (navbar) {
  navbar.classList.add('scrolled');
}

if (navbar && menuToggle && mobileMenu) {
  const setMenuState = (isOpen, restoreFocus = false) => {
    navbar.classList.toggle('menu-open', isOpen);
    document.body.classList.toggle('navbar-menu-open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));

    if (isOpen) {
      mobileLinks[0]?.focus({ preventScroll: true });
    } else if (restoreFocus) {
      menuToggle.focus({ preventScroll: true });
    }
  };

  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    setMenuState(!isOpen);
  });

  mobileLinks.forEach((link) => {
    link.addEventListener('click', () => setMenuState(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
      setMenuState(false, true);
    }
  });

  desktopBreakpoint.addEventListener('change', ({ matches }) => {
    if (matches) setMenuState(false);
  });
}

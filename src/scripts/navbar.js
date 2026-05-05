const navbar = document.querySelector('.navbar');
const hero = document.querySelector('#hero');

const observer = new IntersectionObserver(
  ([entry]) => {
    if (!entry.isIntersecting) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  },
  { threshold: 0.1 }
);

observer.observe(hero);

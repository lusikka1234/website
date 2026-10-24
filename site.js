const container = document.querySelector('.main-container');
const language = document.documentElement.lang;
const labels = JSON.parse(document.getElementById('translations').textContent)[language];
const localizedSeo = document.getElementById(`seo-${language}`);
if (localizedSeo) {
  document.head.querySelectorAll('[data-seo]').forEach((tag) => tag.remove());
  document.head.append(localizedSeo.content.cloneNode(true));
}
document.querySelector('.lang-select-cont').setAttribute('aria-label', labels.language);
document.querySelectorAll('[data-language-link]').forEach((link) => {
  const target = new URL(window.location.href);
  target.searchParams.set('lang', link.dataset.languageLink);
  link.href = target.href;
  const selected = link.dataset.languageLink === language;
  link.classList.toggle('selected', selected);
  if (selected) link.setAttribute('aria-current', 'true');
});
document.querySelectorAll('a[data-page-link]').forEach((link) => {
  const target = new URL(link.href);
  target.searchParams.set('lang', language);
  link.href = target.href;
});
const homeUrl = `${document.documentElement.dataset.home}?lang=${language}`;
const mobileBar = document.createElement('header');
mobileBar.className = 'mobile-bar';
mobileBar.innerHTML = `<a class="mobile-logo" href="${homeUrl}">LUSIKKA</a><button class="mobile-menu-button" type="button" aria-expanded="false" aria-controls="site-menu">${labels.menu}</button>`;
document.body.prepend(mobileBar);

const mobileMenuButton = mobileBar.querySelector('.mobile-menu-button');
container.querySelector('.menu').id = 'site-menu';
const closeMobileMenu = () => {
  document.body.classList.remove('mobile-menu-open');
  mobileMenuButton.setAttribute('aria-expanded', 'false');
};

mobileMenuButton.addEventListener('click', () => {
  const isOpen = document.body.classList.toggle('mobile-menu-open');
  mobileMenuButton.setAttribute('aria-expanded', String(isOpen));
});

document.addEventListener('click', (event) => {
  if (document.body.classList.contains('mobile-menu-open') && !container.querySelector('.left').contains(event.target) && !mobileBar.contains(event.target)) closeMobileMenu();
});

document.querySelectorAll('a[data-page-link], .collection-link, .back-collection, .mobile-logo').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey) return;
    const isMenuLink = link.matches('.menu > a');
    const isCollectionPage = Boolean(document.querySelector('.back-collection'));
    const isGalleryLink = link.matches('.collection-link, .back-collection');
    if (link.href === window.location.href || (isMenuLink && link.classList.contains('selected') && !isCollectionPage)) {
      event.preventDefault();
      closeMobileMenu();
      return;
    }
    event.preventDefault();
    if (isGalleryLink) {
      sessionStorage.setItem('lusikka-transition', 'gallery');
      container.classList.add('gallery-leaving');
      window.setTimeout(() => { window.location.href = link.href; }, 150);
      return;
    }
    if (isMenuLink && window.matchMedia('(max-width: 900px)').matches) {
      document.querySelectorAll('.menu > a').forEach((item) => item.classList.remove('selected'));
      link.classList.add('selected');
      sessionStorage.removeItem('lusikka-transition');
      closeMobileMenu();
      window.location.href = link.href;
      return;
    }
    sessionStorage.removeItem('lusikka-transition');
    if (isMenuLink) {
      document.querySelectorAll('.menu > a').forEach((item) => item.classList.remove('selected'));
      link.classList.add('selected');
    }
    closeMobileMenu();
    container.classList.add('leaving');
    window.setTimeout(() => { window.location.href = link.href; }, 600);
  });
});

window.addEventListener('pageshow', () => container.classList.remove('leaving'));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMobileMenu(); });

const viewer = document.getElementById('viewer');
if (viewer) {
  viewer.querySelector('.close-viewer').textContent = labels.close;
  viewer.querySelector('.close-viewer').setAttribute('aria-label', labels.close_viewer);
  const closeViewer = () => { viewer.hidden = true; document.body.style.overflow = ''; };
  document.querySelectorAll('.artwork button[data-title]').forEach((button) => button.addEventListener('click', () => {
    const image = button.querySelector('img');
    viewer.querySelector('img').src = image.src;
    viewer.querySelector('img').alt = image.alt;
    viewer.querySelector('h2').textContent = button.dataset.title;
    viewer.querySelector('p').textContent = button.dataset.details;
    viewer.hidden = false; document.body.style.overflow = 'hidden'; viewer.querySelector('.close-viewer').focus();
  }));
  viewer.querySelector('.close-viewer').addEventListener('click', closeViewer);
  viewer.addEventListener('click', (event) => { if (event.target === viewer) closeViewer(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeViewer(); });
}

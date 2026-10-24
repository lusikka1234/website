(() => {
  const supported = ['en', 'fi'];
  const requested = new URL(window.location.href).searchParams.get('lang');
  let saved;
  try { saved = localStorage.getItem('lusikka-language'); } catch (_) { /* Storage may be disabled. */ }
  const preferred = (navigator.languages || [navigator.language])
    .map((language) => language.toLowerCase().split('-')[0])
    .find((language) => supported.includes(language));
  const language = supported.includes(requested) ? requested : supported.includes(saved) ? saved : preferred || 'en';
  document.documentElement.lang = language;
  if (supported.includes(requested)) {
    try { localStorage.setItem('lusikka-language', language); } catch (_) { /* Storage may be disabled. */ }
  }
})();

// Kleurschema vóór het tekenen (zelfde sleutel als de site, zie src/lib/kleurschema.ts).
// Als extern script omdat de beheeromgeving geen inline scripts toelaat (Content-Security-Policy).
try {
  if (localStorage.getItem('pb72-kleurschema') === 'light') document.querySelector('meta[name="color-scheme"]').content = 'light';
} catch (e) {}

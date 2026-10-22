/* Utilidades compartidas entre el catálogo y el panel */

// Evita que textos escritos en el panel rompan la página
export function esc(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

export const formatoPrecio = n => "$" + Math.round(Number(n) || 0).toLocaleString("es-CO");

export const soloDigitos = texto => String(texto ?? "").replace(/\D/g, "");

export const linkWA = (numero, texto) =>
  `https://wa.me/${soloDigitos(numero)}?text=${encodeURIComponent(texto)}`;

// Dibujo dorado que se muestra mientras un producto no tenga foto
let contadorDibujos = 0;
export function dibujoManilla(variante = 0, ancho = 400, alto = 300) {
  const cx = ancho / 2, cy = alto / 2 + 6, rx = ancho * 0.33, ry = alto * 0.2;
  const id = "dm" + (contadorDibujos++);
  const n = [26, 30, 22, 28, 34, 26][variante % 6];
  let eslabones = "";
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = (cx + rx * Math.cos(a)).toFixed(1), y = (cy + ry * Math.sin(a)).toFixed(1);
    const rot = ((Math.atan2(ry * Math.cos(a), -rx * Math.sin(a)) * 180) / Math.PI).toFixed(1);
    const frente = Math.sin(a) > 0, op = frente ? 1 : 0.55;
    eslabones += variante % 3 === 1
      ? `<circle cx="${x}" cy="${y}" r="${frente ? 7 : 5.5}" fill="url(#${id})" opacity="${op}"/>`
      : `<ellipse cx="${x}" cy="${y}" rx="9" ry="5" fill="none" stroke="url(#${id})" stroke-width="2.6" opacity="${op}" transform="rotate(${rot} ${x} ${y})"/>`;
  }
  const dije = variante % 3 === 2
    ? `<rect x="${cx - 34}" y="${cy + ry - 10}" width="68" height="18" rx="3" fill="url(#${id})"/>`
    : variante % 3 === 0
      ? `<path d="M${cx} ${cy + ry + 24} l-14 -14 a8 8 0 0 1 14 -10 a8 8 0 0 1 14 10 z" fill="url(#${id})"/>`
      : "";
  return `<svg viewBox="0 0 ${ancho} ${alto}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3E3B0"/><stop offset=".45" stop-color="#C9A54C"/><stop offset="1" stop-color="#8A6A22"/></linearGradient>
      <radialGradient id="${id}b" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#2A241A"/><stop offset="1" stop-color="#0D0C0A"/></radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#${id}b)"/>
    <ellipse cx="${cx}" cy="${cy + ry + 30}" rx="${rx * 0.9}" ry="10" fill="#000" opacity=".45"/>
    ${eslabones}${dije}
  </svg>`;
}

// Número estable a partir de un texto (para variar el dibujo de ejemplo)
export function semilla(texto) {
  let h = 0;
  for (const c of String(texto)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

// Pone la foto si existe; si no carga, deja el dibujo de ejemplo
export function ponerImagen(contenedor, src, alt, variante, ancho, alto) {
  contenedor.insertAdjacentHTML("afterbegin", dibujoManilla(variante, ancho, alto));
  if (!src) return;
  const img = new Image();
  img.alt = alt;
  img.decoding = "async";
  img.onload = () => contenedor.appendChild(img);
  img.src = src;
}

// Aviso flotante
let temporizador;
export function aviso(mensaje, tipo = "") {
  let t = document.querySelector(".toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    document.body.appendChild(t);
  }
  t.textContent = mensaje;
  t.classList.toggle("error", tipo === "error");
  t.classList.add("visible");
  clearTimeout(temporizador);
  temporizador = setTimeout(() => t.classList.remove("visible"), 3200);
}

// Íconos SVG reutilizables (se usan con <svg><use href="#i-nombre"/></svg>)
export function insertarIconos() {
  document.body.insertAdjacentHTML("afterbegin", `
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <symbol id="i-wa" viewBox="0 0 24 24"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.24-8.24 8.24Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z"/></symbol>
  <symbol id="i-corona" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 10H5L3 8Z"/><circle cx="3" cy="7.5" r="1.1" fill="currentColor"/><circle cx="12" cy="4.3" r="1.1" fill="currentColor"/><circle cx="21" cy="7.5" r="1.1" fill="currentColor"/><path stroke="currentColor" stroke-width="1.4" d="M5.5 15.5h13"/></symbol>
  <symbol id="i-diamante" viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M4 12l5-7h14l5 7-12 15L4 12Z"/><path d="M4 12h24M9 5l4 7 3-7 3 7 4-7M13 12l3 15 3-15"/></g></symbol>
  <symbol id="i-escudo" viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M16 3l10 4v8c0 7-4.5 12-10 14-5.5-2-10-7-10-14V7l10-4Z"/><path d="M11 16l3.5 3.5L21 13"/></g></symbol>
  <symbol id="i-camion" viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M3 8h16v13H3zM19 12h5l4 5v4h-9"/><circle cx="8.5" cy="22.5" r="2.5"/><circle cx="23.5" cy="22.5" r="2.5"/></g></symbol>
  <symbol id="i-regla" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="2" y="8" width="20" height="8" rx="1.5"/><path d="M6 8v3M10 8v4M14 8v3M18 8v4"/></g></symbol>
  <symbol id="i-flecha" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 6l6 6-6 6"/></symbol>
  <symbol id="i-instagram" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></g></symbol>
  <symbol id="i-facebook" viewBox="0 0 24 24"><path fill="currentColor" d="M14 8.5V6.8c0-.8.5-1 1-1h2V2.2L14.3 2C11.4 2 10.5 4 10.5 6v2.5H8V12h2.5v10H14V12h2.8l.5-3.5H14Z"/></symbol>
  <symbol id="i-tiktok" viewBox="0 0 24 24"><path fill="currentColor" d="M16.6 2h-3.3v13.4a2.9 2.9 0 1 1-2.1-2.8V9.2a6.3 6.3 0 1 0 5.4 6.2V9a7.6 7.6 0 0 0 4.4 1.4V7.1a4.4 4.4 0 0 1-4.4-4.4V2Z"/></symbol>
  <symbol id="i-menu" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M3 6h18M3 12h18M3 18h18"/></symbol>
  <symbol id="i-editar" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4"/></symbol>
  <symbol id="i-borrar" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></symbol>
  <symbol id="i-mas" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 5v14M5 12h14"/></symbol>
  <symbol id="i-cerrar" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></symbol>
  <symbol id="i-compartir" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/></g></symbol>
  <symbol id="i-foto" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 8"/></g></symbol>
</defs></svg>`);
}

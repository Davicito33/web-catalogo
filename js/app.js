/* ================================================================
   CATÁLOGO PÚBLICO — muestra los productos y arma los botones de WhatsApp
   ================================================================ */
import { CATEGORIAS } from "./config.js";
import { obtenerAjustes, listarProductos } from "./datos.js";
import { esc, formatoPrecio, linkWA, ponerImagen, semilla, insertarIconos } from "./util.js";

insertarIconos();

const grilla = document.getElementById("grilla");
const filtrosEl = document.getElementById("filtros");
let productos = [];
let ajustes = {};
let filtroActual = "todos";

function aplicarAjustes() {
  document.querySelectorAll("[data-marca]").forEach(el => el.textContent = ajustes.marca);
  document.title = `${ajustes.marca} · Manillas de oro laminado 18k`;

  const enlaceGeneral = linkWA(ajustes.whatsapp, ajustes.mensaje_general);
  document.querySelectorAll("[data-wa-general]").forEach(a => {
    a.href = enlaceGeneral;
    a.target = "_blank";
    a.rel = "noopener";
  });

  const redes = [["instagram", ajustes.instagram], ["facebook", ajustes.facebook], ["tiktok", ajustes.tiktok]]
    .filter(([, url]) => url)
    .map(([red, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener" aria-label="${red}"><svg><use href="#i-${red}"/></svg></a>`)
    .join("");
  document.getElementById("redes").innerHTML = redes +
    `<a href="${esc(enlaceGeneral)}" target="_blank" rel="noopener" aria-label="WhatsApp"><svg><use href="#i-wa"/></svg></a>`;

  const hero = document.getElementById("heroImagen");
  hero.innerHTML = "";
  ponerImagen(hero, ajustes.imagen_portada, "Manilla de oro laminado 18k", 2, 400, 500);
}

function pintarFiltros() {
  // Solo muestra las categorías que tienen productos
  const usadas = new Set(productos.map(p => p.categoria));
  const lista = [{ id: "todos", nombre: "Todos" }, ...CATEGORIAS.filter(c => usadas.has(c.id))];
  filtrosEl.innerHTML = lista.map(c =>
    `<button class="filtro${c.id === filtroActual ? " activo" : ""}" data-cat="${c.id}">${esc(c.nombre)}</button>`
  ).join("");
  // Las mismas colecciones como accesos directos en el menú del celular
  document.getElementById("menuCats").innerHTML = lista.map(c =>
    `<a href="#catalogo" data-cat="${c.id}">${esc(c.nombre)}</a>`).join("");
}

function pintarProductos() {
  grilla.classList.remove("cargando");
  const lista = productos.filter(p => filtroActual === "todos" || p.categoria === filtroActual);
  if (!lista.length) {
    grilla.innerHTML = `<p class="estado">Pronto tendremos nuevos diseños en esta colección.</p>`;
    return;
  }
  grilla.innerHTML = "";
  lista.forEach((p, i) => {
    const agotado = (p.etiqueta || "").toLowerCase() === "agotado";
    const mensaje = agotado
      ? `Hola, ¿cuándo vuelve a estar disponible la ${p.nombre}?`
      : `Hola, me interesa la ${p.nombre} - ${formatoPrecio(p.precio)}`;
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta" + (agotado ? " es-agotado" : "");
    const enlace = esc(linkWA(ajustes.whatsapp, mensaje));
    const categoria = CATEGORIAS.find(c => c.id === p.categoria);
    tarjeta.dataset.indice = productos.indexOf(p);
    tarjeta.style.animationDelay = `${Math.min(i, 8) * 60}ms`;
    tarjeta.innerHTML = `
      <div class="tarjeta-img">
        ${p.etiqueta ? `<span class="etiqueta${agotado ? " agotado" : ""}">${esc(p.etiqueta)}</span>` : ""}
        <button class="tarjeta-ver" type="button" aria-label="Ver detalles de ${esc(p.nombre)}"><svg><use href="#i-mas"/></svg></button>
        <a class="tarjeta-rapido" href="${enlace}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">
          <svg><use href="#i-wa"/></svg>${agotado ? "Avísame" : "Pedir ahora"}
        </a>
      </div>
      <div class="tarjeta-info">
        ${categoria ? `<span class="tarjeta-cat">${esc(categoria.nombre)}</span>` : ""}
        <h3><button type="button" class="tarjeta-nombre">${esc(p.nombre)}</button></h3>
        ${p.descripcion ? `<p class="tarjeta-desc">${esc(p.descripcion)}</p>` : ""}
        ${p.medida ? `<span class="tarjeta-medida"><svg><use href="#i-regla"/></svg>${esc(p.medida)}</span>` : ""}
        <div class="precio">${formatoPrecio(p.precio)}</div>
        <a class="btn-wa${agotado ? " secundario" : ""}" href="${enlace}" target="_blank" rel="noopener">
          <svg><use href="#i-wa"/></svg>${agotado ? `Avísame<span class="solo-escritorio"> cuando llegue</span>` : `Comprar<span class="solo-escritorio"> por WhatsApp</span>`}
        </a>
      </div>`;
    ponerImagen(tarjeta.querySelector(".tarjeta-img"), p.imagen_url, p.nombre, semilla(p.id || p.nombre), 400, 500);
    grilla.appendChild(tarjeta);
  });
}

function elegirFiltro(cat) {
  filtroActual = cat;
  filtrosEl.querySelectorAll(".filtro").forEach(b => {
    b.classList.toggle("activo", b.dataset.cat === cat);
    if (b.dataset.cat === cat) b.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  });
  pintarProductos();
}

filtrosEl.addEventListener("click", e => {
  const btn = e.target.closest(".filtro");
  if (!btn) return;
  elegirFiltro(btn.dataset.cat);
  // En el celular, si la lista quedó más arriba, sube hasta el inicio de los productos
  const arriba = grilla.getBoundingClientRect().top;
  if (arriba < 0) window.scrollBy({ top: arriba - filtrosEl.offsetHeight - header.offsetHeight - 12, behavior: "smooth" });
});

/* ---------- Menú del celular ---------- */
const menuMovil = document.getElementById("menuMovil");
const menuBtn = document.getElementById("menuBtn");
function abrirMenu(abrir) {
  menuMovil.classList.toggle("abierto", abrir);
  menuMovil.setAttribute("aria-hidden", String(!abrir));
  menuBtn.setAttribute("aria-label", abrir ? "Cerrar menú" : "Abrir menú");
  menuBtn.querySelector("use").setAttribute("href", abrir ? "#i-cerrar" : "#i-menu");
  document.body.classList.toggle("sin-scroll", abrir);
}
menuBtn.addEventListener("click", () => abrirMenu(!menuMovil.classList.contains("abierto")));
menuMovil.addEventListener("click", e => {
  const enlace = e.target.closest("a");
  if (!enlace) return;
  if (enlace.dataset.cat) elegirFiltro(enlace.dataset.cat);
  abrirMenu(false);
});

/* ---------- Vista de detalle del producto ---------- */
const vista = document.getElementById("vistaRapida");
function abrirVista(p) {
  const agotado = (p.etiqueta || "").toLowerCase() === "agotado";
  const cat = CATEGORIAS.find(c => c.id === p.categoria);
  const img = document.getElementById("vrImg");
  img.innerHTML = p.etiqueta ? `<span class="etiqueta${agotado ? " agotado" : ""}">${esc(p.etiqueta)}</span>` : "";
  ponerImagen(img, p.imagen_url, p.nombre, semilla(p.id || p.nombre), 400, 500);
  document.getElementById("vrCat").textContent = cat ? cat.nombre : "";
  document.getElementById("vrNombre").textContent = p.nombre;
  document.getElementById("vrDesc").textContent = p.descripcion || "";
  const medida = document.getElementById("vrMedida");
  medida.innerHTML = p.medida ? `<svg><use href="#i-regla"/></svg>${esc(p.medida)}` : "";
  document.getElementById("vrPrecio").textContent = formatoPrecio(p.precio);
  const mensaje = agotado
    ? `Hola, ¿cuándo vuelve a estar disponible la ${p.nombre}?`
    : `Hola, me interesa la ${p.nombre} - ${formatoPrecio(p.precio)}`;
  document.getElementById("vrComprar").href = linkWA(ajustes.whatsapp, mensaje);
  document.getElementById("vrComprarTexto").textContent = agotado ? "Avísame cuando llegue" : "Comprar por WhatsApp";
  vista.hidden = false;
  requestAnimationFrame(() => vista.classList.add("abierta"));
  document.body.classList.add("sin-scroll");
  vista.querySelector(".vr-cerrar").focus({ preventScroll: true });
}
function cerrarVista() {
  if (vista.hidden) return;
  vista.classList.remove("abierta");
  document.body.classList.remove("sin-scroll");
  setTimeout(() => { vista.hidden = true; }, 300);
}
grilla.addEventListener("click", e => {
  if (e.target.closest(".tarjeta-rapido, .btn-wa")) return;
  if (!e.target.closest(".tarjeta-img, .tarjeta-nombre")) return;
  const p = productos[e.target.closest(".tarjeta").dataset.indice];
  if (p) abrirVista(p);
});
vista.addEventListener("click", e => { if (e.target.closest("[data-cerrar]")) cerrarVista(); });
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  cerrarVista();
  abrirMenu(false);
});
document.getElementById("anio").textContent = new Date().getFullYear();

// El encabezado se compacta al bajar
const header = document.getElementById("header");
const marcarHeader = () => header.classList.toggle("con-sombra", window.scrollY > 40);
window.addEventListener("scroll", marcarHeader, { passive: true });
marcarHeader();

// Las secciones aparecen suavemente al llegar a ellas
const observador = "IntersectionObserver" in window
  ? new IntersectionObserver(entradas => entradas.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("visible"); observador.unobserve(e.target); }
    }), { threshold: 0.15 })
  : null;
document.querySelectorAll(".beneficios, .titulo-seccion, .manifiesto .contenedor").forEach(el => {
  if (!observador) return;
  el.classList.add("revelar");
  observador.observe(el);
});

async function iniciar() {
  try {
    [ajustes, productos] = await Promise.all([obtenerAjustes(), listarProductos()]);
    aplicarAjustes();
    pintarFiltros();
    pintarProductos();
  } catch (error) {
    console.error(error);
    grilla.classList.remove("cargando");
    grilla.innerHTML = `<p class="estado">No pudimos cargar el catálogo en este momento. Intenta de nuevo en unos minutos.</p>`;
  }
}
iniciar();

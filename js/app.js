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
    tarjeta.style.animationDelay = `${Math.min(i, 8) * 60}ms`;
    tarjeta.innerHTML = `
      <div class="tarjeta-img">
        ${p.etiqueta ? `<span class="etiqueta${agotado ? " agotado" : ""}">${esc(p.etiqueta)}</span>` : ""}
        <a class="tarjeta-rapido" href="${enlace}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">
          <svg><use href="#i-wa"/></svg>${agotado ? "Avísame" : "Pedir ahora"}
        </a>
      </div>
      <div class="tarjeta-info">
        ${categoria ? `<span class="tarjeta-cat">${esc(categoria.nombre)}</span>` : ""}
        <h3>${esc(p.nombre)}</h3>
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

filtrosEl.addEventListener("click", e => {
  const btn = e.target.closest(".filtro");
  if (!btn) return;
  filtroActual = btn.dataset.cat;
  filtrosEl.querySelectorAll(".filtro").forEach(b => b.classList.toggle("activo", b === btn));
  pintarProductos();
});

const menuMovil = document.getElementById("menuMovil");
document.getElementById("menuBtn").addEventListener("click", () => menuMovil.classList.toggle("abierto"));
menuMovil.addEventListener("click", e => { if (e.target.tagName === "A") menuMovil.classList.remove("abierto"); });
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

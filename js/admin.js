/* ================================================================
   PANEL DE ADMINISTRACIÓN
   ================================================================ */
import { CATEGORIAS, ETIQUETAS } from "./config.js";
import {
  modoDemo, demoPermitido, alCerrarseLaSesion, reiniciarDemo, obtenerAjustes, guardarAjustes,
  listarProductos, guardarProducto, eliminarProducto,
  subirImagen, borrarImagen, obtenerSesion, iniciarSesion, cerrarSesion,
} from "./datos.js";
import { esc, formatoPrecio, soloDigitos, ponerImagen, semilla, aviso, insertarIconos } from "./util.js";

insertarIconos();

const $ = id => document.getElementById(id);
const nombreCategoria = id => CATEGORIAS.find(c => c.id === id)?.nombre || "Sin categoría";

let productos = [];
let ajustes = {};

/* ---------------- Sesión ---------------- */
async function arrancar() {
  try {
    ajustes = await obtenerAjustes();
    pintarMarca();
  } catch { /* si falla, se usa la marca por defecto */ }

  const sesion = await obtenerSesion().catch(() => null);
  if (sesion) entrarAlPanel(sesion);
  else mostrarLogin();
}

function mostrarLogin() {
  $("vistaPanel").classList.add("oculto");
  $("vistaLogin").classList.remove("oculto");
  if (modoDemo && !demoPermitido) {
    $("loginError").textContent = "El panel está cerrado: conecta Supabase para poder iniciar sesión desde internet.";
    $("formLogin").querySelectorAll("input, button").forEach(el => el.disabled = true);
  }
}

function pintarMarca() {
  document.querySelectorAll("[data-marca]").forEach(el => el.textContent = ajustes.marca);
}

$("formLogin").addEventListener("submit", async e => {
  e.preventDefault();
  const boton = e.submitter;
  boton.disabled = true;
  $("loginError").textContent = "";
  try {
    const sesion = await iniciarSesion($("correo").value.trim(), $("clave").value);
    $("vistaLogin").classList.add("oculto");
    entrarAlPanel(sesion);
  } catch (error) {
    $("loginError").textContent = error.message;
  } finally {
    boton.disabled = false;
  }
});

$("btnSalir").addEventListener("click", async () => {
  await cerrarSesion();
  if (modoDemo) { location.href = "index.html"; return; }
  location.reload();
});

async function entrarAlPanel(sesion) {
  alCerrarseLaSesion(() => location.reload());
  $("vistaPanel").classList.remove("oculto");
  $("usuario").textContent = sesion.usuario;
  $("avisoDemo").classList.toggle("oculto", !modoDemo);
  llenarSelects();
  llenarAjustes();
  await cargarProductos();
}

/* ---------------- Pestañas ---------------- */
document.querySelectorAll(".pestana").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll(".pestana").forEach(b => b.classList.toggle("activa", b === btn));
  $("pestanaProductos").classList.toggle("oculto", btn.dataset.pestana !== "productos");
  $("pestanaAjustes").classList.toggle("oculto", btn.dataset.pestana !== "ajustes");
}));

/* ---------------- Lista de productos ---------------- */
function llenarSelects() {
  $("filtroCategoria").innerHTML = `<option value="">Todas las categorías</option>` +
    CATEGORIAS.map(c => `<option value="${c.id}">${esc(c.nombre)}</option>`).join("");
  $("pCategoria").innerHTML = CATEGORIAS.map(c => `<option value="${c.id}">${esc(c.nombre)}</option>`).join("");
  $("pEtiqueta").innerHTML = ETIQUETAS.map(t => `<option value="${esc(t)}">${t ? esc(t) : "Sin etiqueta"}</option>`).join("");
}

async function cargarProductos() {
  try {
    productos = await listarProductos({ incluirOcultos: true });
    pintarLista();
  } catch (error) {
    $("lista").innerHTML = `<div class="vacio-admin">No se pudieron cargar los productos.<br><small>${esc(error.message)}</small></div>`;
  }
}

function pintarLista() {
  const texto = $("buscar").value.trim().toLowerCase();
  const categoria = $("filtroCategoria").value;
  const lista = productos.filter(p =>
    (!texto || p.nombre.toLowerCase().includes(texto)) && (!categoria || p.categoria === categoria));

  const visibles = productos.filter(p => p.visible !== false).length;
  $("resumen").textContent = `${productos.length} producto${productos.length === 1 ? "" : "s"} · ${visibles} visible${visibles === 1 ? "" : "s"} en el catálogo`;

  if (!productos.length) {
    $("lista").innerHTML = `<div class="vacio-admin">Aún no tienes productos.<br><button class="btn-dorado" data-accion="nuevo">Agregar el primero</button></div>`;
    return;
  }
  if (!lista.length) {
    $("lista").innerHTML = `<div class="vacio-admin">Ningún producto coincide con la búsqueda.</div>`;
    return;
  }

  $("lista").innerHTML = "";
  for (const p of lista) {
    const agotado = (p.etiqueta || "").toLowerCase() === "agotado";
    const fila = document.createElement("div");
    fila.className = "fila" + (p.visible === false ? " inactiva" : "");
    fila.dataset.id = p.id;
    fila.innerHTML = `
      <div class="miniatura"></div>
      <div class="fila-info">
        <div class="fila-nombre">${esc(p.nombre)}</div>
        <div class="fila-meta">
          <span>${esc(nombreCategoria(p.categoria))}</span>
          ${p.medida ? `<span>${esc(p.medida)}</span>` : ""}
          ${p.etiqueta ? `<span class="chip${agotado ? " agotado" : ""}">${esc(p.etiqueta)}</span>` : ""}
        </div>
      </div>
      <div class="fila-precio">${formatoPrecio(p.precio)}</div>
      <label class="interruptor" title="Mostrar u ocultar en el catálogo">
        <input type="checkbox" data-accion="visible" ${p.visible !== false ? "checked" : ""}> <span>Visible</span>
      </label>
      <div class="fila-acciones">
        <button class="icono-btn" data-accion="editar" aria-label="Editar ${esc(p.nombre)}"><svg><use href="#i-editar"/></svg></button>
        <button class="icono-btn peligro" data-accion="eliminar" aria-label="Eliminar ${esc(p.nombre)}"><svg><use href="#i-borrar"/></svg></button>
      </div>`;
    ponerImagen(fila.querySelector(".miniatura"), p.imagen_url, p.nombre, semilla(p.id || p.nombre));
    $("lista").appendChild(fila);
  }
}

$("buscar").addEventListener("input", pintarLista);
$("filtroCategoria").addEventListener("change", pintarLista);
$("btnNuevo").addEventListener("click", () => abrirFormulario());

$("lista").addEventListener("click", async e => {
  const accion = e.target.closest("[data-accion]")?.dataset.accion;
  if (!accion || accion === "visible") return;
  if (accion === "nuevo") return abrirFormulario();
  const p = productos.find(x => x.id === e.target.closest(".fila")?.dataset.id);
  if (!p) return;
  if (accion === "editar") abrirFormulario(p);
  if (accion === "eliminar") {
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await eliminarProducto(p);
      aviso("Producto eliminado");
      await cargarProductos();
    } catch (error) { aviso(error.message, "error"); }
  }
});

$("lista").addEventListener("change", async e => {
  if (e.target.dataset.accion !== "visible") return;
  const p = productos.find(x => x.id === e.target.closest(".fila")?.dataset.id);
  if (!p) return;
  const visible = e.target.checked;
  try {
    await guardarProducto({ id: p.id, visible });
    p.visible = visible;
    pintarLista();
    aviso(visible ? "Ahora se ve en el catálogo" : "Oculto del catálogo");
  } catch (error) {
    e.target.checked = !visible;
    aviso(error.message, "error");
  }
});

/* ---------------- Formulario de producto ---------------- */
const modal = $("modalProducto");
let editando = null;      // producto que se está editando (null = nuevo)
let fotoNueva = null;     // archivo elegido y aún no subido
let fotoQuitada = false;

function mostrarFoto(zona, src, variante) {
  zona.querySelectorAll("img, :scope > svg").forEach(n => n.remove());
  ponerImagen(zona, src, "Vista previa", variante);
}

function abrirFormulario(p = null) {
  editando = p;
  fotoNueva = null;
  fotoQuitada = false;
  $("tituloModal").textContent = p ? "Editar producto" : "Nuevo producto";
  $("pNombre").value = p?.nombre || "";
  $("pDescripcion").value = p?.descripcion || "";
  $("pPrecio").value = p ? Number(p.precio).toLocaleString("es-CO") : "";
  $("pMedida").value = p?.medida || "";
  $("pCategoria").value = p?.categoria || CATEGORIAS[0]?.id || "";
  $("pEtiqueta").value = p?.etiqueta || "";
  $("pOrden").value = p?.orden ?? (Math.max(0, ...productos.map(x => x.orden || 0)) + 1);
  $("pVisible").checked = p ? p.visible !== false : true;
  $("archivoFoto").value = "";
  mostrarFoto($("zonaFoto"), p?.imagen_url, semilla(p?.id || "nuevo"));
  modal.showModal();
  if (!p) $("pNombre").focus();
}

function cerrarFormulario() { modal.close(); }
$("btnCerrarModal").addEventListener("click", cerrarFormulario);
$("btnCancelar").addEventListener("click", cerrarFormulario);

// Precio: deja solo números y les pone puntos de miles mientras escribes
$("pPrecio").addEventListener("input", e => {
  const n = soloDigitos(e.target.value);
  e.target.value = n ? Number(n).toLocaleString("es-CO") : "";
});

function prepararZonaFoto(zona, input, alElegir) {
  input.addEventListener("change", () => input.files[0] && alElegir(input.files[0]));
  zona.addEventListener("dragover", e => { e.preventDefault(); zona.classList.add("arrastrando"); });
  zona.addEventListener("dragleave", () => zona.classList.remove("arrastrando"));
  zona.addEventListener("drop", e => {
    e.preventDefault();
    zona.classList.remove("arrastrando");
    const archivo = e.dataTransfer.files[0];
    if (archivo) alElegir(archivo);
  });
}

prepararZonaFoto($("zonaFoto"), $("archivoFoto"), archivo => {
  if (!archivo.type.startsWith("image/")) return aviso("Ese archivo no es una imagen.", "error");
  fotoNueva = archivo;
  fotoQuitada = false;
  mostrarFoto($("zonaFoto"), URL.createObjectURL(archivo), 0);
});

$("quitarFoto").addEventListener("click", () => {
  fotoNueva = null;
  fotoQuitada = true;
  $("archivoFoto").value = "";
  mostrarFoto($("zonaFoto"), "", semilla(editando?.id || "nuevo"));
});

$("formProducto").addEventListener("submit", async e => {
  e.preventDefault();
  const precio = Number(soloDigitos($("pPrecio").value));
  if (!precio) { aviso("Escribe el precio del producto.", "error"); $("pPrecio").focus(); return; }

  const boton = $("btnGuardarProducto");
  boton.disabled = true;
  boton.textContent = fotoNueva ? "Subiendo foto…" : "Guardando…";
  try {
    const fotoAnterior = editando?.imagen_url || "";
    let imagen_url = fotoAnterior;
    if (fotoNueva) imagen_url = await subirImagen(fotoNueva);
    else if (fotoQuitada) imagen_url = "";

    await guardarProducto({
      id: editando?.id,
      nombre: $("pNombre").value.trim(),
      descripcion: $("pDescripcion").value.trim(),
      precio,
      medida: $("pMedida").value.trim(),
      categoria: $("pCategoria").value,
      etiqueta: $("pEtiqueta").value,
      orden: Number($("pOrden").value) || 0,
      visible: $("pVisible").checked,
      imagen_url,
    });

    if (fotoAnterior && fotoAnterior !== imagen_url) borrarImagen(fotoAnterior).catch(() => {});
    cerrarFormulario();
    aviso(editando ? "Cambios guardados" : "Producto agregado al catálogo");
    await cargarProductos();
  } catch (error) {
    aviso(error.message, "error");
  } finally {
    boton.disabled = false;
    boton.textContent = "Guardar producto";
  }
});

/* ---------------- Ajustes ---------------- */
let portadaNueva = null;
let portadaQuitada = false;

function llenarAjustes() {
  const f = $("formAjustes");
  for (const campo of ["marca", "whatsapp", "mensaje_general", "instagram", "facebook", "tiktok"]) {
    f.elements[campo].value = ajustes[campo] || "";
  }
  portadaNueva = null;
  portadaQuitada = false;
  mostrarFoto($("zonaPortada"), ajustes.imagen_portada, 2);
}

prepararZonaFoto($("zonaPortada"), $("archivoPortada"), archivo => {
  if (!archivo.type.startsWith("image/")) return aviso("Ese archivo no es una imagen.", "error");
  portadaNueva = archivo;
  portadaQuitada = false;
  mostrarFoto($("zonaPortada"), URL.createObjectURL(archivo), 2);
});

$("quitarPortada").addEventListener("click", () => {
  portadaNueva = null;
  portadaQuitada = true;
  $("archivoPortada").value = "";
  mostrarFoto($("zonaPortada"), "", 2);
});

$("formAjustes").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target;
  const whatsapp = soloDigitos(f.elements.whatsapp.value);
  if (whatsapp.length < 10) { aviso("Revisa el número de WhatsApp (ej. 573001234567).", "error"); return; }

  const boton = $("btnGuardarAjustes");
  boton.disabled = true;
  boton.textContent = "Guardando…";
  try {
    const anterior = ajustes.imagen_portada || "";
    let imagen_portada = anterior;
    if (portadaNueva) imagen_portada = await subirImagen(portadaNueva, "portada");
    else if (portadaQuitada) imagen_portada = "";

    const nuevos = {
      marca: f.elements.marca.value.trim(),
      whatsapp,
      mensaje_general: f.elements.mensaje_general.value.trim(),
      instagram: f.elements.instagram.value.trim(),
      facebook: f.elements.facebook.value.trim(),
      tiktok: f.elements.tiktok.value.trim(),
      imagen_portada,
    };
    await guardarAjustes(nuevos);
    if (anterior && anterior !== imagen_portada) borrarImagen(anterior).catch(() => {});
    ajustes = { ...ajustes, ...nuevos };
    pintarMarca();
    llenarAjustes();
    aviso("Ajustes guardados");
  } catch (error) {
    aviso(error.message, "error");
  } finally {
    boton.disabled = false;
    boton.textContent = "Guardar ajustes";
  }
});

/* ---------------- Modo demo ---------------- */
$("btnReiniciarDemo").addEventListener("click", async () => {
  if (!confirm("¿Borrar tus cambios de prueba y volver a los productos de ejemplo?")) return;
  reiniciarDemo();
  ajustes = await obtenerAjustes();
  pintarMarca();
  llenarAjustes();
  await cargarProductos();
  aviso("Ejemplos restaurados");
});

arrancar();

/* ================================================================
   CAPA DE DATOS
   Todo lo que guarda o lee información pasa por aquí.
   - Sin Supabase configurado → MODO DEMO (guarda en este navegador)
   - Con Supabase configurado → base de datos real en la nube
   ================================================================ */
import { SUPABASE_URL, SUPABASE_ANON_KEY, AJUSTES_POR_DEFECTO } from "./config.js";
import { PRODUCTOS_DEMO } from "./demo.js";

export const modoDemo = !(SUPABASE_URL && SUPABASE_ANON_KEY);

// El modo demo solo abre el panel en tu computador (Live Server).
// En la página publicada, el panel queda bloqueado hasta conectar Supabase.
const HOST = location.hostname;
export const demoPermitido = modoDemo &&
  (location.protocol === "file:" || HOST === "localhost" || HOST === "127.0.0.1" || HOST === "[::1]");
const MSG_DEMO_BLOQUEADO = "El panel está cerrado: conecta Supabase para poder iniciar sesión desde internet.";
const MSG_NO_ADMIN = "Esta cuenta no tiene permiso de administrador.";

const BUCKET = "productos";
const CAMPOS_PRODUCTO = ["nombre", "descripcion", "precio", "medida", "categoria", "etiqueta", "imagen_url", "fotos", "visible", "orden"];
export const MAX_FOTOS_EXTRA = 5;
const CAMPOS_AJUSTES = Object.keys(AJUSTES_POR_DEFECTO);
const elegir = (obj, campos) => Object.fromEntries(campos.filter(c => c in obj).map(c => [c, obj[c]]));

/* ---------- Conexión a Supabase (solo se carga si está configurado) ---------- */
let clientePromesa = null;
function cliente() {
  if (!clientePromesa) {
    clientePromesa = import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm")
      .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
  }
  return clientePromesa;
}
function revisar({ data, error }) {
  if (error) throw new Error(traducirError(error.message));
  return data;
}
function traducirError(msg = "") {
  if (/Invalid login credentials/i.test(msg)) return "Correo o contraseña incorrectos.";
  if (/Email not confirmed/i.test(msg)) return "Debes confirmar tu correo antes de entrar.";
  if (/row-level security|permission denied/i.test(msg)) return "No tienes permiso para hacer esto. ¿Tu usuario está registrado como administrador?";
  if (/fotos/i.test(msg) && /column|schema cache/i.test(msg)) return "Falta activar la galería de fotos en Supabase: ejecuta el SQL de la columna \"fotos\" y vuelve a intentar.";
  if (/Failed to fetch|NetworkError/i.test(msg)) return "Sin conexión. Revisa tu internet e inténtalo de nuevo.";
  return msg || "Ocurrió un error inesperado.";
}

/* ---------- Almacenamiento del modo demo ---------- */
const K_PRODUCTOS = "catalogo_demo_productos";
const K_AJUSTES = "catalogo_demo_ajustes";
function leer(clave, porDefecto) {
  try { const v = localStorage.getItem(clave); return v ? JSON.parse(v) : porDefecto; }
  catch { return porDefecto; }
}
function escribir(clave, valor) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); }
  catch { throw new Error("El navegador no tiene espacio para guardar más fotos en modo demo. Conecta Supabase para guardar sin límite."); }
}
export function reiniciarDemo() {
  try { localStorage.removeItem(K_PRODUCTOS); localStorage.removeItem(K_AJUSTES); } catch { /* sin acceso */ }
}

/* ---------- Ajustes de la marca ---------- */
export async function obtenerAjustes() {
  if (modoDemo) return { ...AJUSTES_POR_DEFECTO, ...leer(K_AJUSTES, {}) };
  const s = await cliente();
  const data = revisar(await s.from("ajustes").select("*").eq("id", 1).maybeSingle());
  const limpio = Object.fromEntries(Object.entries(data || {}).filter(([, v]) => v !== null));
  return { ...AJUSTES_POR_DEFECTO, ...limpio };
}

export async function guardarAjustes(ajustes) {
  const datos = elegir(ajustes, CAMPOS_AJUSTES);
  if (modoDemo) { escribir(K_AJUSTES, datos); return; }
  const s = await cliente();
  revisar(await s.from("ajustes").upsert({ id: 1, ...datos }));
}

/* ---------- Productos ---------- */
const ordenar = lista => [...lista].sort((a, b) =>
  (a.orden ?? 0) - (b.orden ?? 0) || String(a.nombre).localeCompare(String(b.nombre)));

export async function listarProductos({ incluirOcultos = false } = {}) {
  if (modoDemo) {
    const lista = ordenar(leer(K_PRODUCTOS, PRODUCTOS_DEMO));
    return incluirOcultos ? lista : lista.filter(p => p.visible !== false);
  }
  const s = await cliente();
  let consulta = s.from("productos").select("*").order("orden", { ascending: true }).order("created_at", { ascending: false });
  if (!incluirOcultos) consulta = consulta.eq("visible", true);
  return revisar(await consulta);
}

export async function guardarProducto(producto) {
  const datos = elegir(producto, CAMPOS_PRODUCTO);
  if (modoDemo) {
    const lista = leer(K_PRODUCTOS, PRODUCTOS_DEMO);
    if (producto.id) {
      const i = lista.findIndex(p => p.id === producto.id);
      if (i >= 0) lista[i] = { ...lista[i], ...datos };
    } else {
      lista.push({ id: "p-" + Date.now().toString(36), ...datos });
    }
    escribir(K_PRODUCTOS, lista);
    return;
  }
  const s = await cliente();
  if (producto.id) revisar(await s.from("productos").update(datos).eq("id", producto.id));
  else revisar(await s.from("productos").insert(datos));
}

export async function eliminarProducto(producto) {
  if (modoDemo) {
    escribir(K_PRODUCTOS, leer(K_PRODUCTOS, PRODUCTOS_DEMO).filter(p => p.id !== producto.id));
    return;
  }
  const s = await cliente();
  revisar(await s.from("productos").delete().eq("id", producto.id));
  for (const url of [producto.imagen_url, ...(producto.fotos || [])]) await borrarImagen(url).catch(() => {});
}

/* ---------- Fotos ---------- */
// Reduce el tamaño de la foto antes de subirla (carga más rápido y ocupa menos)
export async function comprimirImagen(archivo, ladoMax = 1400, calidad = 0.82) {
  if (!archivo.type.startsWith("image/")) throw new Error("El archivo no es una imagen.");
  const url = URL.createObjectURL(archivo);
  try {
    const img = await new Promise((ok, falla) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => falla(new Error("No se pudo leer la foto. Prueba con JPG o PNG."));
      i.src = url;
    });
    const escala = Math.min(1, ladoMax / Math.max(img.naturalWidth, img.naturalHeight));
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(img.naturalWidth * escala);
    lienzo.height = Math.round(img.naturalHeight * escala);
    lienzo.getContext("2d").drawImage(img, 0, 0, lienzo.width, lienzo.height);
    const aBlob = tipo => new Promise(ok => lienzo.toBlob(ok, tipo, calidad));
    let blob = await aBlob("image/webp");
    if (!blob || blob.type !== "image/webp") blob = await aBlob("image/jpeg");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Sube la foto y devuelve la dirección (URL) donde quedó guardada
export async function subirImagen(archivo, carpeta = "productos") {
  if (modoDemo) {
    const blob = await comprimirImagen(archivo, 800, 0.72);
    return await new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(blob); });
  }
  const blob = await comprimirImagen(archivo);
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const ruta = `${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const s = await cliente();
  revisar(await s.storage.from(BUCKET).upload(ruta, blob, { contentType: blob.type, cacheControl: "31536000" }));
  return s.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
}

export async function borrarImagen(url) {
  if (modoDemo || !url) return;
  const marca = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marca);
  if (i < 0) return;
  const s = await cliente();
  await s.storage.from(BUCKET).remove([decodeURIComponent(url.slice(i + marca.length))]);
}

/* ---------- Sesión del administrador ---------- */
// Pregunta a la base de datos si el usuario conectado está en la tabla de administradores
async function esAdmin(s) {
  const { data, error } = await s.rpc("es_admin");
  return !error && data === true;
}

export async function obtenerSesion() {
  if (modoDemo) return demoPermitido ? { usuario: "Modo demo", demo: true } : null;
  const s = await cliente();
  // getUser() valida la sesión con el servidor (no se fía solo de lo guardado en el navegador)
  const { data, error } = await s.auth.getUser();
  if (error || !data.user) return null;
  if (!(await esAdmin(s))) { await s.auth.signOut(); return null; }
  return { usuario: data.user.email };
}

export async function iniciarSesion(correo, clave) {
  if (modoDemo) {
    if (!demoPermitido) throw new Error(MSG_DEMO_BLOQUEADO);
    return { usuario: "Modo demo", demo: true };
  }
  const s = await cliente();
  const data = revisar(await s.auth.signInWithPassword({ email: correo, password: clave }));
  if (!(await esAdmin(s))) {
    await s.auth.signOut();
    throw new Error(MSG_NO_ADMIN);
  }
  return { usuario: data.user.email };
}

// Si la sesión se cierra o vence mientras el panel está abierto, se avisa al panel
export async function alCerrarseLaSesion(accion) {
  if (modoDemo) return;
  const s = await cliente();
  s.auth.onAuthStateChange(evento => { if (evento === "SIGNED_OUT") accion(); });
}

export async function cerrarSesion() {
  if (modoDemo) return;
  const s = await cliente();
  await s.auth.signOut();
}

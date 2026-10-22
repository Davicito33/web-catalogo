/* ================================================================
   CONFIGURACIÓN
   ================================================================
   Mientras SUPABASE_URL y SUPABASE_ANON_KEY estén vacíos, la página
   funciona en MODO DEMO: los productos que crees en /admin.html se
   guardan solo en tu navegador (sirve para probar).

   Cuando crees tu proyecto en supabase.com, pega aquí los datos de
   Project Settings → API ("Project URL" y "anon public key").
   La clave "anon" es pública y es seguro ponerla aquí: la seguridad
   la dan las reglas del archivo supabase/esquema.sql.
   ================================================================ */
export const SUPABASE_URL = "";
export const SUPABASE_ANON_KEY = "";

// Categorías que aparecen en los filtros del catálogo y en el panel
export const CATEGORIAS = [
  { id: "mujer",   nombre: "Mujer" },
  { id: "hombre",  nombre: "Hombre" },
  { id: "tejidos", nombre: "Tejidos" },
  { id: "dijes",   nombre: "Con dijes" },
];

// Etiquetas que se pueden poner a un producto
export const ETIQUETAS = ["", "Nuevo", "Más vendida", "Agotado"];

// Valores iniciales de la marca (luego se cambian desde el panel → Ajustes)
export const AJUSTES_POR_DEFECTO = {
  marca: "MAJO JOYERÍA",
  whatsapp: "573000000000",
  mensaje_general: "Hola, quiero información sobre sus manillas de oro laminado 18k.",
  instagram: "",
  facebook: "",
  tiktok: "",
  imagen_portada: "",
};

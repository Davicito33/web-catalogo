# Catálogo web de manillas en oro laminado 18k

Catálogo con estilo negro y dorado donde los clientes ven cada manilla con su foto, precio y un botón para comprar por WhatsApp. El dueño administra todo desde un panel privado, sin tocar código.

- **`index.html`** → el catálogo que ven los clientes.
- **`admin.html`** → el panel para agregar, editar, ocultar o eliminar productos, subir fotos y cambiar la marca, el WhatsApp y las redes.

## Tecnologías

- HTML, CSS y JavaScript sin frameworks ni compilación: se publica tal cual en GitHub Pages.
- [Supabase](https://supabase.com) (plan gratuito) para la base de datos, las fotos y el inicio de sesión del administrador.

## Estructura

```
web-catalogo/
├── index.html            Catálogo público
├── admin.html            Panel de administración
├── css/
│   ├── base.css          Colores, tipografías y estilos compartidos
│   ├── catalogo.css      Diseño del catálogo
│   └── admin.css         Diseño del panel
├── js/
│   ├── config.js         ← Aquí se conecta Supabase y se definen las categorías
│   ├── datos.js          Guardar y leer productos, fotos y sesión
│   ├── app.js            Lógica del catálogo
│   ├── admin.js          Lógica del panel
│   ├── util.js           Funciones e íconos compartidos
│   └── demo.js           Productos de ejemplo
└── supabase/
    └── esquema.sql       Tablas y reglas de seguridad para Supabase
```

## Probarlo en tu computador

La página usa módulos de JavaScript, así que **no funciona abriendo el archivo con doble clic**. Ábrela con un servidor local:

1. En VS Code instala la extensión **Live Server**.
2. Clic derecho en `index.html` → **Open with Live Server**.
3. Para el panel, cambia la dirección a `.../admin.html`.

Mientras Supabase no esté conectado, todo funciona en **modo demo**: lo que hagas en el panel se guarda solo en tu navegador, ideal para probar.

## Conectar Supabase (para que los cambios se vean en todos lados)

1. Crea una cuenta en supabase.com y un proyecto nuevo (región: São Paulo, la más cercana a Colombia).
2. Ve a **SQL Editor → New query**, pega todo el contenido de `supabase/esquema.sql` y dale **Run**.
3. Ve a **Authentication → Users → Add user**, crea el usuario del administrador (correo y contraseña) y marca *Auto Confirm User*.
4. Vuelve al **SQL Editor** y ejecuta esta línea con ese correo:
   ```sql
   insert into public.administradores (user_id)
   select id from auth.users where email = 'tucorreo@gmail.com';
   ```
5. En **Authentication → Sign In / Providers**, desactiva *Allow new users to sign up* para que nadie más pueda registrarse.
6. En **Project Settings → API** copia la *Project URL* y la *anon public key* y pégalas en `js/config.js`.
7. Sube los cambios a GitHub. Listo: entra a `tu-pagina/admin.html` con tu correo y contraseña.

> La clave *anon* es pública y es seguro que esté en el código. Lo que protege la información son las reglas del archivo `esquema.sql`: solo los usuarios de la tabla `administradores` pueden modificar productos y fotos.

## Publicar en GitHub Pages

1. Sube los archivos al repositorio.
2. En GitHub: **Settings → Pages → Deploy from a branch → main → / (root) → Save**.
3. En un par de minutos la página queda en `https://davicito33.github.io/web-catalogo/`.

## Personalizar

- **Colores:** `css/base.css`, al inicio (`:root`).
- **Categorías y etiquetas:** `js/config.js`.
- **Marca, WhatsApp, redes y portada:** desde el panel → *Ajustes de la tienda*.

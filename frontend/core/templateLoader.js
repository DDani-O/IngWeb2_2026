/** Carga de las plantillas `.html` de las páginas, con caché en memoria. */
const templateCache = new Map();

function normalizeTemplatePath(templatePath) {
  return String(templatePath || "").trim();
}

/**
 * Devuelve el HTML de la plantilla. Se pide con `no-cache` para que el navegador valide
 * contra el servidor (los cambios se ven sin vaciar caché); en memoria se guarda por sesión.
 * @param {string} templatePath ruta relativa a la raíz del front
 * @returns {Promise<string>}
 */
export async function loadTemplate(templatePath) {
  const normalizedPath = normalizeTemplatePath(templatePath);

  if (!normalizedPath) {
    throw new Error("templatePath es obligatorio para cargar un componente HTML.");
  }

  if (templateCache.has(normalizedPath)) {
    return templateCache.get(normalizedPath);
  }

  const response = await fetch(normalizedPath, {
    headers: {
      "Cache-Control": "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar el componente ${normalizedPath}`);
  }

  const template = await response.text();
  templateCache.set(normalizedPath, template);
  return template;
}

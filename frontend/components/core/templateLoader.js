const templateCache = new Map();

function normalizeTemplatePath(templatePath) {
  return String(templatePath || "").trim();
}

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

export function renderTemplate(template, values = {}) {
  return String(template).replace(/{{\s*([\w.-]+)\s*}}/g, (_match, key) => {
    return key in values ? String(values[key]) : "";
  });
}

export function clearTemplateCache(templatePath) {
  if (!templatePath) {
    templateCache.clear();
    return;
  }

  templateCache.delete(normalizeTemplatePath(templatePath));
}

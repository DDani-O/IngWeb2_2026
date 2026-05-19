-- Seed: perfiles de gasto financiero
-- Estos perfiles son asignados SOLO por el asesor (nunca por el cliente directamente).
-- criterio_regla almacena metadata de display y reglas de clasificación.

insert into public.perfiles_de_gasto (nombre, descripcion, criterio_regla, activo)
values
  (
    'Ahorrador Disciplinado',
    'Maximiza el ahorro mensual, minimiza gastos discrecionales y mantiene control estricto sobre cada categoría.',
    '{
      "emoji": "🧛",
      "tagline": "Cada peso cuenta",
      "funLine": "Tu tarjeta te saluda con respeto cuando pasas cerca.",
      "characteristics": [
        "Ratio de ahorro > 30% del ingreso",
        "Gastos en entretenimiento < 5%",
        "Compras planificadas, casi sin impulsos",
        "Seguimiento semanal de gastos"
      ],
      "tips": [
        "Revisar el presupuesto mensual y ajustar por categoría",
        "Automatizar transferencias a ahorro al inicio del mes",
        "Registrar cada gasto, por pequeño que sea"
      ],
      "thresholds": {
        "savingsRatio": 0.30,
        "entertainmentRatio": 0.05,
        "impulsePurchases": "low"
      },
      "comparison": {
        "savingsRange": "> 30%",
        "controlLevel": "Muy alto",
        "flexibility": "Baja",
        "riskLevel": "Muy bajo",
        "funLevel": "Bajo"
      }
    }'::jsonb,
    true
  ),
  (
    'Equilibrista Financiero',
    'Balance saludable entre ahorro, gastos necesarios y cierto disfrute. Toma decisiones conscientes sin privarse completamente.',
    '{
      "emoji": "⚖️",
      "tagline": "Control con calidad de vida",
      "funLine": "Tu presupuesto tiene equilibrio zen y no usa capa.",
      "characteristics": [
        "Ratio de ahorro entre 15% y 30%",
        "Distribución equilibrada entre necesidades y ocio",
        "Compras impulsivas esporádicas pero controladas",
        "Revisión mensual de gastos"
      ],
      "tips": [
        "Mantener el presupuesto de entretenimiento entre 10% y 15%",
        "Crear un fondo de emergencia de 3 a 6 meses de gastos",
        "Priorizar gastos con mayor retorno en bienestar"
      ],
      "thresholds": {
        "savingsRatio": 0.20,
        "entertainmentRatio": 0.12,
        "impulsePurchases": "medium"
      },
      "comparison": {
        "savingsRange": "15% – 30%",
        "controlLevel": "Alto",
        "flexibility": "Media",
        "riskLevel": "Bajo",
        "funLevel": "Medio"
      }
    }'::jsonb,
    true
  ),
  (
    'Consumidor Activo',
    'Alto nivel de gasto en experiencias, tecnología y consumo. Ingresos elevados o crédito frecuente. Necesita estructura.',
    '{
      "emoji": "🛍️",
      "tagline": "Vivir el momento",
      "funLine": "Tu carrito online ya te guardo un lugar VIP.",
      "characteristics": [
        "Ratio de ahorro < 15%",
        "Gastos variables y difíciles de predecir",
        "Alta frecuencia de compras impulsivas",
        "Uso frecuente de tarjeta de crédito"
      ],
      "tips": [
        "Establecer un límite mensual fijo por categoría de consumo",
        "Analizar qué compras generaron más satisfacción real",
        "Construir gradualmente un colchón financiero mínimo"
      ],
      "thresholds": {
        "savingsRatio": 0.10,
        "entertainmentRatio": 0.25,
        "impulsePurchases": "high"
      },
      "comparison": {
        "savingsRange": "< 15%",
        "controlLevel": "Bajo",
        "flexibility": "Alta",
        "riskLevel": "Alto",
        "funLevel": "Alto"
      }
    }'::jsonb,
    true
  ),
  (
    'Perfil Familiar',
    'Gastos orientados al hogar, educación y bienestar del grupo familiar. Prioridad en estabilidad y largo plazo.',
    '{
      "emoji": "🏠",
      "tagline": "Familia primero",
      "funLine": "Tu lista del super parece guion de pelicula familiar.",
      "characteristics": [
        "Gastos en educación y salud representan > 20%",
        "Compras en supermercado planificadas y frecuentes",
        "Ahorro orientado a metas familiares (viaje, casa, educación)",
        "Bajo gasto en entretenimiento individual"
      ],
      "tips": [
        "Planificar compras del hogar con lista semanal",
        "Revisar seguros y coberturas de salud anualmente",
        "Crear fondo específico para educación o proyectos familiares"
      ],
      "thresholds": {
        "savingsRatio": 0.20,
        "educationHealthRatio": 0.20,
        "impulsePurchases": "low"
      },
      "comparison": {
        "savingsRange": "15% – 25%",
        "controlLevel": "Alto",
        "flexibility": "Media-baja",
        "riskLevel": "Bajo",
        "funLevel": "Medio"
      }
    }'::jsonb,
    true
  ),
  (
    'Tecnológico / Innovador',
    'Alto gasto en tecnología, suscripciones digitales y gadgets. Perfil joven o profesional tech-oriented.',
    '{
      "emoji": "💻",
      "tagline": "Siempre actualizado",
      "funLine": "Tu billetera piensa en gadgets antes que en cafe.",
      "characteristics": [
        "Gasto en tecnología y suscripciones > 15%",
        "Compras online frecuentes",
        "Bajo gasto en alimentación fuera de casa",
        "Ahorro variable, orientado a próxima compra tecnológica"
      ],
      "tips": [
        "Auditar suscripciones activas mensualmente y cancelar las no usadas",
        "Comparar precios antes de compras de tecnología",
        "Separar necesidad de novedad antes de cada compra"
      ],
      "thresholds": {
        "techRatio": 0.15,
        "subscriptionsMonthly": 5,
        "impulsePurchases": "medium"
      },
      "comparison": {
        "savingsRange": "10% – 20%",
        "controlLevel": "Medio",
        "flexibility": "Alta en tech",
        "riskLevel": "Medio",
        "funLevel": "Alto"
      }
    }'::jsonb,
    true
  ),
  (
    'Gastrónomo / Experiencial',
    'Prioriza experiencias: gastronomía, viajes, cultura y ocio. Gasto hedónico elevado pero consciente.',
    '{
      "emoji": "🍽️",
      "tagline": "Vivir bien es el objetivo",
      "funLine": "Tu presupuesto huele a restaurante nuevo cada semana.",
      "characteristics": [
        "Gasto en restaurantes y delivery > 20%",
        "Viajes o salidas culturales frecuentes",
        "Ahorro bajo salvo metas experienciales",
        "Compras impulsivas en contextos sociales"
      ],
      "tips": [
        "Establecer un presupuesto mensual fijo para gastronomía",
        "Planificar viajes con antelación para reducir costos",
        "Buscar experiencias de calidad con mejor relación precio-valor"
      ],
      "thresholds": {
        "gastronomyRatio": 0.20,
        "entertainmentRatio": 0.18,
        "impulsePurchases": "medium-high"
      },
      "comparison": {
        "savingsRange": "5% – 15%",
        "controlLevel": "Medio-bajo",
        "flexibility": "Muy alta",
        "riskLevel": "Medio",
        "funLevel": "Muy alto"
      }
    }'::jsonb,
    true
  ),
  (
    'En Desarrollo',
    'Perfil transitorio para clientes que están construyendo hábitos financieros. Ingresos bajos o irregulares, en proceso de estabilización.',
    '{
      "emoji": "🌱",
      "tagline": "Construyendo bases",
      "funLine": "Tu ahorro va en modo plantita: lento pero seguro.",
      "characteristics": [
        "Ingresos variables o en crecimiento",
        "Gastos esenciales representan > 70%",
        "Sin fondo de emergencia consolidado",
        "Aprendiendo a gestionar el presupuesto"
      ],
      "tips": [
        "Empezar con regla 50/30/20: necesidades, deseos, ahorro",
        "Registrar todos los ingresos y egresos durante 3 meses",
        "Establecer meta de ahorro pequeña y alcanzable"
      ],
      "thresholds": {
        "essentialsRatio": 0.70,
        "savingsRatio": 0.05,
        "impulsePurchases": "variable"
      },
      "comparison": {
        "savingsRange": "0% – 10%",
        "controlLevel": "En construcción",
        "flexibility": "Limitada",
        "riskLevel": "Variable",
        "funLevel": "Bajo"
      }
    }'::jsonb,
    true
  )
on conflict (nombre) do update set
  descripcion = excluded.descripcion,
  criterio_regla = excluded.criterio_regla,
  activo = excluded.activo;

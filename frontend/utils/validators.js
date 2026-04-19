/**
 * Valida que un campo tenga contenido util (no null, undefined o vacio).
 */
export function isRequired(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

/**
 * Verifica formato basico de email para formularios de autenticacion o perfil.
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).trim().toLowerCase());
}

/**
 * Evalua fortaleza minima de contrasena para flujos de registro y seguridad.
 */
export function isStrongPassword(password) {
  const value = String(password);
  const hasMinLength = value.length >= 8;
  const hasUpper = /[A-Z]/.test(value);
  const hasNumber = /\d/.test(value);
  return hasMinLength && hasUpper && hasNumber;
}

/**
 * Agrupa validaciones del login y devuelve un resultado uniforme con errores.
 * Tambien puede usarse en pruebas unitarias del formulario.
 */
export function validateLoginForm(formData) {
  const errors = [];

  if (!isValidEmail(formData.email)) {
    errors.push("Ingresa un email valido.");
  }

  if (!isRequired(formData.password)) {
    errors.push("La contrasena es obligatoria.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Ejecuta validaciones completas del registro segun rol y reglas de negocio.
 * Deja lista la salida para UI (mensajes) o validaciones backend simuladas.
 */
export function validateRegisterForm(formData) {
  const errors = [];

  if (!isRequired(formData.fullName)) {
    errors.push("El nombre completo es obligatorio.");
  }

  if (!isValidEmail(formData.email)) {
    errors.push("Ingresa un email valido.");
  }

  if (!isStrongPassword(formData.password)) {
    errors.push(
      "La contrasena debe tener al menos 8 caracteres, una mayuscula y un numero."
    );
  }

  if (formData.password !== formData.confirmPassword) {
    errors.push("Las contrasenas no coinciden.");
  }

  if (!formData.acceptTerms) {
    errors.push("Debes aceptar terminos y condiciones.");
  }

  if (formData.role === "asesor") {
    if (!isRequired(formData.licenseNumber)) {
      errors.push("El numero de cedula profesional es obligatorio para asesores.");
    }

    if (!isRequired(formData.specialty)) {
      errors.push("Selecciona una especialidad para el perfil asesor.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

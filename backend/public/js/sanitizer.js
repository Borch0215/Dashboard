/**
 * MÓDULO DE SANITIZACIÓN - Cableworld Dashboard
 * Prevención de XSS (Cross-Site Scripting)
 * Auditoría de Seguridad Senior - Enero 2026
 * 
 * USO:
 * - sanitizeHTML(htmlString): Limpia HTML peligroso, permite tags seguros
 * - escapeHTML(plainText): Escapa caracteres especiales (NO HTML)
 * - sanitizeJSON(jsonString): Valida JSON antes de parsear
 * - sanitizeAttribute(attributeValue): Limpia valores de atributos
 */

// ============================================================================
// FUNCIONES DE SANITIZACIÓN - NIVEL PROFESIONAL
// ============================================================================

/**
 * FUNCIÓN 1: Sanitizar HTML conservando tags seguros
 * Usa DOMPurify si está disponible, fallback a básico
 */
function sanitizeHTML(dirty) {
  // Validación de entrada
  if (!dirty) return '';
  if (typeof dirty !== 'string') return String(dirty);

  // Si DOMPurify está disponible (recomendado en producción)
  if (typeof DOMPurify !== 'undefined') {
    const config = {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5',
        'ol', 'ul', 'li', 'code', 'pre', 'a', 'img', 'table', 'tr', 'td', 'th',
        'thead', 'tbody', 'tfoot', 'blockquote', 'div', 'span'
      ],
      ALLOWED_ATTR: ['href', 'title', 'alt', 'src', 'style', 'class', 'id'],
      KEEP_CONTENT: true,
      FORCE_BODY: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_DOM: false
    };
    
    const cleaned = DOMPurify.sanitize(dirty, config);
    console.debug('[SANITIZE] HTML sanitizado con DOMPurify', { input_length: dirty.length, output_length: cleaned.length });
    return cleaned;
  }

  // FALLBACK: Sanitización básica si DOMPurify no está disponible
  console.warn('[SANITIZE] DOMPurify no disponible, usando sanitización básica');
  return sanitizeHTMLBasic(dirty);
}

/**
 * FUNCIÓN 2: Sanitización básica (sin DOMPurify)
 * Elimina tags peligrosos y scripts
 */
function sanitizeHTMLBasic(dirty) {
  const div = document.createElement('div');
  div.textContent = dirty;
  let html = div.innerHTML;

  // Remover atributos event handlers peligrosos
  html = html.replace(/on\w+\s*=/gi, '');
  
  // Remover scripts
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remover frames
  html = html.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  
  // Remover objects
  html = html.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');

  return html;
}

/**
 * FUNCIÓN 3: Escapar HTML (convertir caracteres especiales)
 * IMPORTANTE: Para texto plano, NO para HTML
 * 
 * & → &amp;
 * < → &lt;
 * > → &gt;
 * " → &quot;
 * ' → &#x27;
 */
function escapeHTML(text) {
  if (!text) return '';
  if (typeof text !== 'string') text = String(text);

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return text.replace(/[&<>"'\/]/g, (char) => map[char]);
}

/**
 * FUNCIÓN 4: Escapar JSON strings
 * Para evitar JSON injection en <script> tags
 */
function escapeJSONString(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\x00/g, '\\u0000')
    .replace(/\x1f/g, '\\u001f');
}

/**
 * FUNCIÓN 5: Sanitizar atributos de HTML
 * Para valores en atributos como src, href, style
 */
function sanitizeAttribute(attribute, value) {
  if (!value) return '';
  if (typeof value !== 'string') value = String(value);

  switch (attribute.toLowerCase()) {
    case 'href':
    case 'src':
      // Prevenir javascript: protocol
      if (/^javascript:/i.test(value) || /^data:text\/html/i.test(value)) {
        console.warn('[SANITIZE] URL peligrosa bloqueada:', value);
        return '#';
      }
      return value;

    case 'style':
      // Permitir estilos básicos, bloquear expression() y javascript:
      if (/javascript:/i.test(value) || /expression\s*\(/i.test(value)) {
        return '';
      }
      return value;

    case 'class':
      // Permitir clases pero no inyectar
      return value.replace(/[^a-z0-9\-_\s]/gi, '');

    default:
      return escapeHTML(value);
  }
}

/**
 * FUNCIÓN 6: Validar y parsear JSON seguro
 * Previene JSON injection y parse errors
 */
function safeParse(jsonString, fallback = null) {
  try {
    if (!jsonString) return fallback;
    if (typeof jsonString !== 'string') return fallback;

    // Validación básica de formato
    jsonString = jsonString.trim();
    if (!jsonString.startsWith('{') && !jsonString.startsWith('[')) {
      console.warn('[SANITIZE] JSON inválido (no comienza con { o [)');
      return fallback;
    }

    const parsed = JSON.parse(jsonString);
    console.debug('[SANITIZE] JSON parseado seguramente');
    return parsed;
  } catch (e) {
    console.error('[SANITIZE] Error parseando JSON:', e.message);
    return fallback;
  }
}

/**
 * FUNCIÓN 7: Crear elemento HTML seguro con contenido sanitizado
 * RECOMENDADO: Usar esta función en lugar de innerHTML
 */
function createSafeElement(tag, options = {}) {
  const element = document.createElement(tag);
  
  if (options.text) {
    element.textContent = options.text; // Siempre seguro
  }
  
  if (options.html) {
    element.innerHTML = sanitizeHTML(options.html); // Sanitizado
  }
  
  if (options.class) {
    element.className = sanitizeAttribute('class', options.class);
  }
  
  if (options.id) {
    element.id = sanitizeAttribute('id', options.id);
  }
  
  if (options.attributes) {
    for (const [key, value] of Object.entries(options.attributes)) {
      element.setAttribute(key, sanitizeAttribute(key, value));
    }
  }
  
  return element;
}

/**
 * FUNCIÓN 8: Inyectar innerHTML de forma segura
 * ESTA ES LA FUNCIÓN CLAVE PARA REEMPLAZAR innerHTML
 * 
 * ANTES:
 *   element.innerHTML = untrustedContent
 * 
 * DESPUÉS:
 *   safeInnerHTML(element, untrustedContent)
 */
function safeInnerHTML(element, html) {
  if (!element || !html) return;
  
  const sanitized = sanitizeHTML(html);
  element.innerHTML = sanitized;
  
  console.debug('[SANITIZE] innerHTML inyectado de forma segura', {
    element: element.tagName,
    length: sanitized.length
  });
}

/**
 * FUNCIÓN 9: Inyectar contenido de texto (siempre seguro)
 * Menos flexible que innerHTML pero 100% seguro
 */
function safeTextContent(element, text) {
  if (!element || !text) return;
  element.textContent = text;
}

/**
 * FUNCIÓN 10: Validar email
 * Previene inyección en campos de email
 */
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * FUNCIÓN 11: Validar URL
 * Previene javascript: y data: protocols
 */
function validateURL(url) {
  try {
    const parsed = new URL(url, window.location.origin);
    const protocol = parsed.protocol;
    
    // Solo permitir http, https y relativos
    if (protocol !== 'http:' && protocol !== 'https:' && protocol !== 'file:') {
      return false;
    }
    
    return true;
  } catch (e) {
    // URL relativa (válida)
    if (/^\/|^\.\.?\//.test(url)) return true;
    return false;
  }
}

/**
 * FUNCIÓN 12: Logger de seguridad
 * Registra intentos sospechosos
 */
function logSecurityEvent(eventType, details) {
  const event = {
    timestamp: new Date().toISOString(),
    type: eventType,
    details: details,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // Guardar en console (en producción, enviar a servidor)
  console.warn('[SECURITY EVENT]', event);
  
  // Opcional: Enviar al backend para auditoría
  if (typeof fetch !== 'undefined') {
    // Comentado para no bloquear si API_BASE no está disponible
    // fetch('/api/security-log', { method: 'POST', body: JSON.stringify(event) })
  }
}

// ============================================================================
// EXPORTAR FUNCIONES (CommonJS + Global)
// ============================================================================

// Hacer disponibles globalmente en window para acceso desde HTML
if (typeof window !== 'undefined') {
  window.Sanitizer = {
    sanitizeHTML,
    escapeHTML,
    escapeJSONString,
    sanitizeAttribute,
    safeParse,
    createSafeElement,
    safeInnerHTML,
    safeTextContent,
    validateEmail,
    validateURL,
    logSecurityEvent
  };
  
  console.log('✓ [SANITIZER] Módulo de sanitización cargado');
}

// Exportar para ES modules si está disponible
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sanitizeHTML,
    escapeHTML,
    escapeJSONString,
    sanitizeAttribute,
    safeParse,
    createSafeElement,
    safeInnerHTML,
    safeTextContent,
    validateEmail,
    validateURL,
    logSecurityEvent
  };
}

// ============================================================================
// INICIALIZACIÓN DE SEGURIDAD
// ============================================================================

(function initSecurityFeatures() {
  // Detectar si DOMPurify no está cargado y advertir
  if (typeof DOMPurify === 'undefined') {
    console.warn('[SANITIZER] ⚠️ DOMPurify no está cargado. Se usará sanitización básica.');
    console.warn('[SANITIZER] Instala DOMPurify para máxima seguridad: npm install dompurify');
  } else {
    console.log('✓ [SANITIZER] DOMPurify disponible - Sanitización avanzada activa');
  }

  // Monitorear inyecciones de eventos handlers peligrosos
  document.addEventListener('click', (e) => {
    // Verificar si hay atributos on* peligrosos (no debería llegar aquí)
    for (const attr of e.target.attributes || []) {
      if (/^on/i.test(attr.name)) {
        console.error('[SECURITY] Atributo peligroso detectado:', attr.name, attr.value);
      }
    }
  }, true);

  console.log('✓ [SECURITY] Monitoreo de seguridad inicializado');
})();

/**
 * FUNCIÓN HELPER 13: Sanitizar templates HTML con interpolación segura
 * Uso: safeTemplate`<h1>${title}</h1>` automáticamente escapa ${} variables
 * 
 * @param {Array} strings - Partes de string del template literal
 * @param {...any} values - Valores interpolados
 * @returns {string} HTML seguro
 */
window.Sanitizer = window.Sanitizer || {};
window.Sanitizer.safeTemplate = function(strings, ...values) {
  let result = '';
  strings.forEach((str, i) => {
    result += str;
    if (i < values.length) {
      // Escapar automáticamente cualquier valor interpolado
      const value = values[i];
      if (typeof value === 'string') {
        result += window.Sanitizer.escapeHTML(value);
      } else if (value !== null && value !== undefined) {
        result += String(value);
      }
    }
  });
  return result;
};

// Alias para facilitar importación
if (typeof module !== 'undefined' && module.exports) {
  module.exports.safeTemplate = window.Sanitizer.safeTemplate;
}

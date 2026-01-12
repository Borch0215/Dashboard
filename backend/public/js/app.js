// app.js - Lógica principal de la aplicación
// Usa módulos ES con API backend para persistencia de datos

import { api } from './apiClient.js';
import { config } from './config.js';

// SECCIÓN 2.5: Toast notification utility for API errors
function showToast(message, type = 'error', duration = 3000) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background-color: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#ffc107'};
    color: white;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 99999;
    font-size: 14px;
    max-width: 300px;
    word-wrap: break-word;
    animation: slideIn 0.3s ease-in-out;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Add animation style
  const style = document.createElement('style');
  if (!document.getElementById('toast-animation')) {
    style.id = 'toast-animation';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in-out';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// SECCIÓN 2.7: Session timeout warning modal
function showSessionTimeoutWarning(minutesRemaining) {
  // Check if modal already exists
  if (document.getElementById('session-timeout-modal')) return;
  
  const modal = document.createElement('div');
  modal.id = 'session-timeout-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99998;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    max-width: 400px;
    text-align: center;
  `;
  
  const title = document.createElement('h2');
  title.textContent = '⏰ Sesión por Expirar';
  title.style.cssText = 'color: #dc3545; margin: 0 0 15px 0;';
  content.appendChild(title);
  
  const message = document.createElement('p');
  message.textContent = `Tu sesión expirará en ${minutesRemaining} minuto${minutesRemaining > 1 ? 's' : ''}. ¿Deseas continuar trabajando?`;
  message.style.cssText = 'margin: 15px 0; color: #333; font-size: 14px;';
  content.appendChild(message);
  
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'display: flex; gap: 10px; margin-top: 20px;';
  
  const extendBtn = document.createElement('button');
  extendBtn.textContent = 'Continuar Sesión';
  extendBtn.style.cssText = `
    flex: 1;
    padding: 10px;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  `;
  extendBtn.addEventListener('click', async () => {
    try {
      await fetch(apiUrl('/session-check'), {
        credentials: 'include'
      });
      modal.remove();
    } catch (err) {
      showToast('Error extendiendo sesión', 'error');
    }
  });
  buttonContainer.appendChild(extendBtn);
  
  const logoutBtn = document.createElement('button');
  logoutBtn.textContent = 'Cerrar Sesión';
  logoutBtn.style.cssText = `
    flex: 1;
    padding: 10px;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  `;
  logoutBtn.addEventListener('click', async () => {
    try {
      await fetch(apiUrl('/session-logout'), {
        method: 'POST',
        credentials: 'include'
      });
      STATE.authUser = null;
      localStorage.removeItem('cw:authUser');
      window.location.href = '/';
    } catch (err) {
      showToast('Error al cerrar sesión', 'error');
    }
  });
  buttonContainer.appendChild(logoutBtn);
  
  content.appendChild(buttonContainer);
  modal.appendChild(content);
  document.body.appendChild(modal);
}

// Helper function to construct API URLs (ensures consistency)
function apiUrl(endpoint) {
  return `${config.BACKEND_URL}/api${endpoint}`;
}

// ============================================
// STATE INITIALIZATION - Simple localStorage based
// ============================================
const STATE = {
  manuals: [],
  current: null,
  progress: {},
  comments: {},
  history: [],
  lastSeenVersion: null,
  agentMode: false,
  darkMode: false,
  fontSize: 14,
  notifEnabled: true,
  agentName: 'Agente',
  manualOverrides: {},
  authUser: null,
  fibraDiagrams: [],
  api: api,
  firstTimeUser: true,
  showTips: true,
  tourActive: false,
  currentTourStep: 0,

  // Load from localStorage
  loadFromStorage() {
    const saved = localStorage.getItem('cw:state');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        Object.assign(this, data);
      } catch (e) {
        console.error('Error loading STATE from localStorage:', e);
      }
    }
    
    // Also check for specific firstTimeUser flag (for backwards compatibility)
    const firstTimeUserSaved = localStorage.getItem('cw:firstTimeUser');
    if (firstTimeUserSaved !== null) {
      try {
        this.firstTimeUser = JSON.parse(firstTimeUserSaved);
      } catch (e) {
        console.error('Error loading firstTimeUser:', e);
      }
    }
  },

  // Save to localStorage
  saveToStorage() {
    try {
      const data = {
        agentMode: this.agentMode,
        darkMode: this.darkMode,
        fontSize: this.fontSize,
        notifEnabled: this.notifEnabled,
        firstTimeUser: this.firstTimeUser,
        showTips: this.showTips,
        tourActive: this.tourActive,
        currentTourStep: this.currentTourStep
      };
      localStorage.setItem('cw:state', JSON.stringify(data));
    } catch (e) {
      console.error('Error saving STATE to localStorage:', e);
    }
  }
};

// Load state on init
STATE.loadFromStorage();

// ============================================
// UI THEME INITIALIZATION
// ============================================

// Apply saved theme preferences on load
if (STATE.darkMode) {
  document.body.classList.add('dark-mode');
}

if (STATE.fontSize && STATE.fontSize >= 12 && STATE.fontSize <= 20) {
  document.documentElement.style.fontSize = STATE.fontSize + 'px';
}

// Watch for dark mode changes
const originalDarkModeSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(STATE), 'darkMode')?.set;

// Update theme when darkMode changes
document.addEventListener('statechange:darkMode', (e) => {
  if (e.detail) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
});

// ===== UTILIDADES DE OPTIMIZACIÓN =====

/**
 * Debounce mejorado con cancel capability
 * @param {Function} func - Función a debounce
 * @param {number} delay - Delay en ms
 * @returns {Object} - Objeto con execute() y cancel()
 */
function debounce(func, delay) {
  let timeoutId = null;
  
  const debounced = function(...args) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, delay);
  };
  
  debounced.cancel = function() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  return debounced;
}

/**
 * Observador Intersection para lazy loading
 * Carga contenido cuando entra en viewport
 */
class LazyObserver {
  constructor(options = {}) {
    this.options = {
      root: options.root || null,
      rootMargin: options.rootMargin || '50px',
      threshold: options.threshold || 0.01
    };
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      this.options
    );
  }
  
  observe(element, callback) {
    if (!element) return;
    element.dataset.lazyCallback = Math.random().toString(36);
    this.callbackMap = this.callbackMap || {};
    this.callbackMap[element.dataset.lazyCallback] = callback;
    this.observer.observe(element);
  }
  
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const callback = this.callbackMap?.[entry.target.dataset.lazyCallback];
        if (callback) {
          callback(entry.target);
          this.observer.unobserve(entry.target);
          delete this.callbackMap[entry.target.dataset.lazyCallback];
        }
      }
    });
  }
  
  disconnect() {
    this.observer.disconnect();
  }
}

// Estado de paginación
const PAGINATION_STATE = {
  manuals: {
    currentOffset: 0,
    limit: 20,
    total: 0,
    hasMore: true,
    isLoading: false
  },
  diagrams: {
    currentOffset: 0,
    limit: 20,
    total: 0,
    hasMore: true,
    isLoading: false
  }
};

// ============================================
// FASE 16: KNOWLEDGE BASE MANAGER STATE
// ============================================

const KB_STATE = {
  folders: [],
  folderCache: new Map(), // Caché de carpetas por parent_id
  relatedManuals: new Map(), // Caché de manuales relacionados por manual_id
  obsoleteManuals: [],
  lastFolderUpdate: null,
  treeExpanded: new Set() // Set de IDs de carpetas expandidas
};

// Lazy observers
const lazyObservers = {
  manuals: new LazyObserver(),
  diagrams: new LazyObserver()
};

// ===== FUNCIONES DE LAZY LOADING =====

/**
 * Carga manuales con paginación
 * @param {number} offset - Offset para paginación
 * @param {string} searchQuery - Query de búsqueda (opcional)
 */
async function loadMoreManuals(offset = 0, searchQuery = '') {
  const state = PAGINATION_STATE.manuals;
  
  if (state.isLoading || !state.hasMore) return;
  
  state.isLoading = true;
  const loadBtn = document.getElementById('loadMoreManualsBtn');
  if (loadBtn) loadBtn.disabled = true;
  
  try {
    const params = {
      limit: state.limit,
      offset: offset,
      search: searchQuery
    };
    
    console.log('[LAZY] Cargando manuales:', params);
    
    const response = await api.getManuals(params);
    
    if (response && response.data) {
      // Primera carga: reemplazar todo
      if (offset === 0) {
        STATE.manuals = response.data;
      } else {
        // Cargas posteriores: agregar
        STATE.manuals = STATE.manuals.concat(response.data);
      }
      
      state.total = response.total;
      state.hasMore = response.hasMore;
      state.currentOffset = offset + state.limit;
      
      console.log('[LAZY] Manuales cargados:', {
        cargados: response.data.length,
        total: response.total,
        hasMore: state.hasMore
      });
      
      renderManualsList(STATE.manuals);
      
      // Mostrar/ocultar botón "Load More"
      if (state.hasMore) {
        if (!loadBtn) {
          const container = document.getElementById('manualsContent');
          const btn = document.createElement('button');
          btn.id = 'loadMoreManualsBtn';
          btn.className = 'btn btn-primary mt-3 mb-3 load-more-manuals-btn';
          btn.textContent = 'Cargar más manuales';
          btn.dataset.currentOffset = state.currentOffset;
          btn.dataset.searchQuery = searchQuery;
          btn.addEventListener('click', () => loadMoreManuals(state.currentOffset, searchQuery));
          container?.appendChild(btn);
        }
      } else if (loadBtn) {
        loadBtn.remove();
      }
    }
  } catch (err) {
    console.error('[LAZY] Error cargando manuales:', err);
    showAlert('Error cargando manuales', err.message);
  } finally {
    state.isLoading = false;
    if (loadBtn) loadBtn.disabled = false;
  }
}

/**
 * Carga diagramas con paginación
 * @param {number} offset - Offset para paginación
 * @param {string} category - Categoría a filtrar
 */
async function loadMoreDiagrams(offset = 0, category = '') {
  const state = PAGINATION_STATE.diagrams;
  
  if (state.isLoading || !state.hasMore) return;
  
  state.isLoading = true;
  const loadBtn = document.getElementById('loadMoreDiagramsBtn');
  if (loadBtn) loadBtn.disabled = true;
  
  try {
    const params = {
      limit: state.limit,
      offset: offset,
      category: category
    };
    
    console.log('[LAZY] Cargando diagramas:', params);
    
    const response = await api.getDiagrams(params);
    
    if (response && response.data) {
      // Primera carga: reemplazar todo
      if (offset === 0) {
        STATE.fibraDiagrams = response.data;
      } else {
        // Cargas posteriores: agregar
        STATE.fibraDiagrams = STATE.fibraDiagrams.concat(response.data);
      }
      
      state.total = response.total;
      state.hasMore = response.hasMore;
      state.currentOffset = offset + state.limit;
      
      console.log('[LAZY] Diagramas cargados:', {
        cargados: response.data.length,
        total: response.total,
        hasMore: state.hasMore
      });
      
      renderDiagramsList(STATE.fibraDiagrams);
      
      // Mostrar/ocultar botón "Load More"
      if (state.hasMore) {
        if (!loadBtn) {
          const container = document.getElementById('diagramsContent');
          const btn = document.createElement('button');
          btn.id = 'loadMoreDiagramsBtn';
          btn.className = 'btn btn-primary mt-3 mb-3 load-more-diagrams-btn';
          btn.textContent = 'Cargar más diagramas';
          btn.dataset.currentOffset = state.currentOffset;
          btn.dataset.category = category;
          btn.addEventListener('click', () => loadMoreDiagrams(state.currentOffset, category));
          container?.appendChild(btn);
        }
      } else if (loadBtn) {
        loadBtn.remove();
      }
    }
  } catch (err) {
    console.error('[LAZY] Error cargando diagramas:', err);
    showAlert('Error cargando diagramas', err.message);
  } finally {
    state.isLoading = false;
    if (loadBtn) loadBtn.disabled = false;
  }
}

/**
 * Reset de estado de paginación
 */
function resetPaginationState() {
  PAGINATION_STATE.manuals.currentOffset = 0;
  PAGINATION_STATE.manuals.hasMore = true;
  PAGINATION_STATE.manuals.isLoading = false;
  
  PAGINATION_STATE.diagrams.currentOffset = 0;
  PAGINATION_STATE.diagrams.hasMore = true;
  PAGINATION_STATE.diagrams.isLoading = false;
}

// ============================================
// SISTEMA PROFESIONAL DE PERMISOS BASADO EN ROLES
// ============================================

// ===== FUNCIONES DE VERIFICACIÓN DE PERMISOS =====

/**
 * Verifica si el usuario actual es administrador
 * @returns {boolean}
 */
function isAdmin() {
  return STATE.authUser?.role === 'admin';
}

/**
 * Obtiene el array de permisos del usuario actual
 * @returns {Array<string>}
 */
function getUserPermissions() {
  return STATE.authUser?.permissions || [];
}

/**
 * Verifica si el usuario tiene un permiso específico
 * @param {string} permission - El permiso a verificar
 * @returns {boolean}
 */
function hasPermission(permission) {
  if (!STATE.authUser) return false;
  if (isAdmin()) return true; // Los admins tienen todos los permisos
  if (!Array.isArray(STATE.authUser.permissions)) return false;
  return STATE.authUser.permissions.includes(permission);
}

/**
 * Verifica si el usuario tiene TODOS los permisos especificados (lógica AND)
 * @param {...string} permissions - Permisos a verificar
 * @returns {boolean}
 */
function hasAllPermissions(...permissions) {
  return permissions.every(p => hasPermission(p));
}

/**
 * Verifica si el usuario tiene AL MENOS UNO de los permisos especificados (lógica OR)
 * @param {...string} permissions - Permisos a verificar
 * @returns {boolean}
 */
function hasAnyPermission(...permissions) {
  return permissions.some(p => hasPermission(p));
}

/**
 * Verifica permisos y muestra alerta si no tiene permiso
 * @param {string|Array<string>} permissions - Permiso(s) requerido(s)
 * @param {string} actionName - Nombre de la acción para el mensaje de error
 * @param {boolean} useAnd - Si true usa AND, si false usa OR
 * @returns {boolean}
 */
async function checkPermissionWithAlert(permissions, actionName = 'esta acción', useAnd = true) {
  const permsArray = Array.isArray(permissions) ? permissions : [permissions];
  const hasAccess = useAnd ? hasAllPermissions(...permsArray) : hasAnyPermission(...permsArray);
  
  if (!hasAccess) {
    console.warn('[RBAC] Acceso denegado:', { user: STATE.authUser?.name, action: actionName, required: permsArray });
    await showAlert('❌ Acceso Denegado', `No tienes permisos para ${actionName}.`);
    return false;
  }
  
  return true;
}

/**
 * Verifica permisos y retorna el resultado sin alerta
 * @param {string|Array<string>} permissions - Permiso(s) requerido(s)
 * @param {boolean} useAnd - Si true usa AND, si false usa OR
 * @returns {boolean}
 */
function canPerformAction(permissions, useAnd = true) {
  const permsArray = Array.isArray(permissions) ? permissions : [permissions];
  return useAnd ? hasAllPermissions(...permsArray) : hasAnyPermission(...permsArray);
}

// ===== FUNCIONES DE ACCIÓN PROFESIONALES POR MÓDULO =====

// ----- MANUALES -----

function canViewManuals() {
  return hasPermission('view_manuals');
}

function canCreateManuals() {
  return hasPermission('create_manuals');
}

function canEditManuals(isOwnManual = false) {
  if (isOwnManual) {
    return hasPermission('edit_manuals') || hasPermission('edit_all_manuals');
  }
  return hasPermission('edit_all_manuals');
}

function canDeleteManuals(isOwnManual = false) {
  if (isOwnManual) {
    return hasPermission('delete_manuals') || hasPermission('delete_all_manuals');
  }
  return hasPermission('delete_all_manuals');
}

function canPublishManuals() {
  return hasPermission('publish_manuals');
}

function canArchiveManuals() {
  return hasPermission('archive_manuals');
}

function canExportManuals() {
  return hasPermission('export_manuals');
}

async function requireViewManualsAccess() {
  return checkPermissionWithAlert('view_manuals', 'ver manuales');
}

async function requireCreateManualsAccess() {
  return checkPermissionWithAlert('create_manuals', 'crear manuales');
}

async function requireEditManualsAccess(isOwnManual = false) {
  const perms = isOwnManual ? ['edit_manuals', 'edit_all_manuals'] : 'edit_all_manuals';
  return checkPermissionWithAlert(perms, 'editar este manual', !isOwnManual);
}

async function requireDeleteManualsAccess(isOwnManual = false) {
  const perms = isOwnManual ? ['delete_manuals', 'delete_all_manuals'] : 'delete_all_manuals';
  return checkPermissionWithAlert(perms, 'eliminar este manual', !isOwnManual);
}

// ----- DIAGRAMAS -----

function canViewDiagrams() {
  return hasPermission('view_diagrams');
}

function canCreateDiagrams() {
  return hasPermission('create_diagrams');
}

function canEditDiagrams(isOwnDiagram = false) {
  if (isOwnDiagram) {
    return hasPermission('edit_diagrams') || hasPermission('edit_all_diagrams');
  }
  return hasPermission('edit_all_diagrams');
}

function canDeleteDiagrams(isOwnDiagram = false) {
  if (isOwnDiagram) {
    return hasPermission('delete_diagrams') || hasPermission('delete_all_diagrams');
  }
  return hasPermission('delete_all_diagrams');
}

function canExportDiagrams() {
  return hasPermission('export_diagrams');
}

async function requireViewDiagramsAccess() {
  return checkPermissionWithAlert('view_diagrams', 'ver árboles de decisión');
}

async function requireCreateDiagramsAccess() {
  return checkPermissionWithAlert('create_diagrams', 'crear árboles de decisión');
}

async function requireEditDiagramsAccess(isOwnDiagram = false) {
  const perms = isOwnDiagram ? ['edit_diagrams', 'edit_all_diagrams'] : 'edit_all_diagrams';
  return checkPermissionWithAlert(perms, 'editar este árbol de decisión', !isOwnDiagram);
}

async function requireDeleteDiagramsAccess(isOwnDiagram = false) {
  const perms = isOwnDiagram ? ['delete_diagrams', 'delete_all_diagrams'] : 'delete_all_diagrams';
  return checkPermissionWithAlert(perms, 'eliminar este árbol de decisión', !isOwnDiagram);
}

// ----- USUARIOS -----

function canViewUsers() {
  return hasPermission('view_users');
}

function canCreateUsers() {
  return hasPermission('create_users');
}

function canEditUsers() {
  return hasPermission('edit_users');
}

function canDeleteUsers() {
  return hasPermission('delete_users');
}

function canResetPassword() {
  return hasPermission('reset_password');
}

function canToggleUserStatus() {
  return hasPermission('toggle_user_status');
}

function canManageAllUsers() {
  return hasAllPermissions('view_users', 'edit_users', 'create_users');
}

async function requireViewUsersAccess() {
  return checkPermissionWithAlert('view_users', 'ver usuarios');
}

async function requireCreateUsersAccess() {
  return checkPermissionWithAlert('create_users', 'crear usuarios');
}

async function requireEditUsersAccess() {
  return checkPermissionWithAlert('edit_users', 'editar usuarios');
}

async function requireDeleteUsersAccess() {
  return checkPermissionWithAlert('delete_users', 'eliminar usuarios');
}

async function requireResetPasswordAccess() {
  return checkPermissionWithAlert('reset_password', 'restablecer contraseñas');
}

// ----- ROLES -----

function canViewRoles() {
  return hasPermission('view_roles') || hasPermission('manage_roles');
}

function canCreateRoles() {
  return hasPermission('create_roles') || hasPermission('manage_roles');
}

function canEditRoles() {
  return hasPermission('edit_roles') || hasPermission('manage_roles');
}

function canDeleteRoles() {
  return hasPermission('delete_roles') || hasPermission('manage_roles');
}

function canManageRoles() {
  return hasPermission('manage_roles');
}

async function requireManageRolesAccess() {
  return checkPermissionWithAlert('manage_roles', 'gestionar roles');
}

// ----- AUDITORÍA -----

function canViewAudit() {
  return hasPermission('view_audit');
}

function canExportAudit() {
  return hasPermission('export_audit');
}

function canClearAudit() {
  return hasPermission('clear_audit');
}

function canManageAudit() {
  return hasAnyPermission('view_audit', 'export_audit', 'clear_audit');
}

async function requireViewAuditAccess() {
  return checkPermissionWithAlert('view_audit', 'ver auditoría');
}

async function requireExportAuditAccess() {
  return checkPermissionWithAlert('export_audit', 'exportar auditoría');
}

async function requireClearAuditAccess() {
  return checkPermissionWithAlert('clear_audit', 'limpiar auditoría');
}

// ----- ADMINISTRACIÓN =====

function canManageSpecialties() {
  return hasPermission('manage_specialties');
}

function canManageFolders() {
  return hasPermission('manage_folders');
}

function canManageSettings() {
  return hasPermission('manage_settings');
}

function canManageSystem() {
  return hasPermission('manage_system');
}

async function requireManageSpecialtiesAccess() {
  return checkPermissionWithAlert('manage_specialties', 'gestionar especialidades');
}

async function requireManageFoldersAccess() {
  return checkPermissionWithAlert('manage_folders', 'gestionar carpetas');
}

async function requireManageSettingsAccess() {
  return checkPermissionWithAlert('manage_settings', 'gestionar configuración');
}

// ----- CARPETAS (KNOWLEDGE BASE MANAGER) =====

function canViewFolders() {
  return hasPermission('view_folders');
}

function canCreateFolders() {
  return hasPermission('create_folders');
}

function canEditFolder(isOwnFolder = false) {
  if (isOwnFolder) {
    return hasPermission('edit_folders') || hasPermission('edit_all_folders');
  }
  return hasPermission('edit_all_folders');
}

function canDeleteFolder(isOwnFolder = false) {
  if (isOwnFolder) {
    return hasPermission('delete_folders') || hasPermission('delete_all_folders');
  }
  return hasPermission('delete_all_folders');
}

function canShareFolder(isOwnFolder = false) {
  if (isOwnFolder) {
    return hasPermission('share_folders') || hasPermission('manage_folders');
  }
  return hasPermission('manage_folders');
}

function canPublishFolder(isOwnFolder = false) {
  if (isOwnFolder) {
    return hasPermission('publish_folders') || hasPermission('manage_folders');
  }
  return hasPermission('manage_folders');
}

async function requireViewFoldersAccess() {
  return checkPermissionWithAlert('view_folders', 'ver carpetas');
}

async function requireCreateFoldersAccess() {
  return checkPermissionWithAlert('create_folders', 'crear carpetas');
}

async function requireEditFolderAccess(isOwnFolder = false) {
  const perms = isOwnFolder ? ['edit_folders', 'edit_all_folders'] : 'edit_all_folders';
  return checkPermissionWithAlert(perms, 'editar esta carpeta', !isOwnFolder);
}

async function requireDeleteFolderAccess(isOwnFolder = false) {
  const perms = isOwnFolder ? ['delete_folders', 'delete_all_folders'] : 'delete_all_folders';
  return checkPermissionWithAlert(perms, 'eliminar esta carpeta', !isOwnFolder);
}

async function requireShareFolderAccess(isOwnFolder = false) {
  const perms = isOwnFolder ? ['share_folders', 'manage_folders'] : 'manage_folders';
  return checkPermissionWithAlert(perms, 'compartir esta carpeta', !isOwnFolder);
}

async function requirePublishFolderAccess(isOwnFolder = false) {
  const perms = isOwnFolder ? ['publish_folders', 'manage_folders'] : 'manage_folders';
  return checkPermissionWithAlert(perms, 'publicar esta carpeta', !isOwnFolder);
}


const els = {
  searchInput: null,
  autocomplete: null,
  canvas: null,
  manualView: null,
  manualTitle: null,
  manualCategory: null,
  manualVersion: null,
  manualSteps: null,
  qrModal: null,
  qrImage: null,
  commentsList: null,
  commentInput: null,
  addComment: null,
  versionsList: null,
  faqsList: null,
  faqSearch: null,
  clearFaqSearch: null,
  exportAllDataBtn: null,
  // Settings elements
  themeDark: null,
  fontSizeUp: null,
  fontSizeDown: null,
  fontSizeReset: null,
  notifEnabled: null,
  agentInputName: null,
  clearDataBtn: null,
  historyList: null,
  manualCount: null,
  lastUpdate: null,
  dataUsage: null,
  agentNameDisplay: null,
  agentModeBtn: null,
  toggleAgentMode: null,
  // FASE 9: Tour elements
  tourOverlay: null,
  tourTooltip: null,
  tourHighlight: null,
  tourNextBtn: null,
  tourSkipBtn: null,
  tourProgressBar: null
};

// ===== FUNCIONES GLOBALES PARA ROLES =====
// Editar rol existente
async function editRole(roleId) {
  try {
    // Obtener datos del rol
    const response = await fetch(apiUrl('/roles'));
    if (!response.ok) {
      showAlert('Error', 'No se pudo cargar la información del rol');
      return;
    }
    
    const roles = await response.json();
    const role = roles.find(r => r.id === roleId);
    
    if (!role) {
      showAlert('Error', 'Rol no encontrado');
      return;
    }
    
    if (role.is_default) {
      showAlert('Información', 'No se pueden editar roles predeterminados');
      return;
    }
    
    // Obtener permisos disponibles desde el backend
    const permRes = await fetch(apiUrl('/permissions'));
    const permissionsObj = permRes.ok ? await permRes.json() : {};
    const permissions = Object.keys(permissionsObj);
    
    const currentPerms = typeof role.permissions === 'string' ? JSON.parse(role.permissions || '[]') : (role.permissions || []);
    
    // Crear modal propio con estilos
    const modalId = `modal-edit-role-${roleId}-${Date.now()}`;
    
    // Crear HTML de permisos
    let permHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(180px, 1fr));gap:8px;max-height:400px;overflow-y:auto;padding:12px;background:var(--cw-surface-dark);border-radius:6px;border:1px solid var(--cw-border-light)">';
    
    permissions.forEach(perm => {
      const isChecked = currentPerms.includes(perm);
      const displayName = permissionsObj[perm] || perm;
      permHTML += `
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:10px;background:${isChecked ? 'var(--cw-primary)' : 'var(--cw-surface)'};border:1px solid var(--cw-border-light);border-radius:4px;color:${isChecked ? '#fff' : 'var(--cw-text)'};transition:all 0.2s;font-size:12px">
          <input type="checkbox" class="edit-role-perm" value="${perm}" ${isChecked ? 'checked' : ''} style="cursor:pointer;width:16px;height:16px">
          <span>${displayName}</span>
        </label>
      `;
    });
    permHTML += '</div>';
    
    // Crear modal
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;overflow:auto;padding:20px';
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'background:var(--cw-surface);border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.3);max-width:700px;width:100%;max-height:90vh;overflow-y:auto;border:1px solid var(--cw-border)';
    
    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = 'background:var(--cw-primary);color:white;padding:20px;border-radius:12px 12px 0 0;display:flex;justify-content:space-between;align-items:center';
    // SANITIZACIÓN: Escapar datos del rol antes de inyectarlos
    titleDiv.innerHTML = `
      <h3 style="margin:0">✏️ Editar rol: ${window.Sanitizer ? window.Sanitizer.escapeHTML(role.name) : role.name}</h3>
      <button class="modalCloseBtn" style="background:rgba(255,255,255,0.2);border:none;color:white;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:20px;line-height:1">✕</button>
    `;
    
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = 'padding:20px';
    // SANITIZACIÓN: Sanitizar todos los datos del usuario antes de inyectar
    const sanitizer = window.Sanitizer || { escapeHTML: (s) => s };
    contentDiv.innerHTML = `
      <div style="margin-bottom:16px">
        <label style="display:block;font-size:13px;font-weight:600;margin-bottom:8px;color:var(--cw-text)">Nombre del rol:</label>
        <input id="editRoleName" type="text" value="${sanitizer.escapeHTML(role.name)}" style="width:100%;padding:10px;background:var(--cw-surface-dark);border:1px solid var(--cw-border-light);border-radius:6px;color:var(--cw-text);font-size:14px;box-sizing:border-box">
      </div>
      <div style="margin-bottom:16px">
        <label style="display:block;font-size:13px;font-weight:600;margin-bottom:8px;color:var(--cw-text)">Descripción:</label>
        <textarea id="editRoleDesc" style="width:100%;padding:10px;background:var(--cw-surface-dark);border:1px solid var(--cw-border-light);border-radius:6px;color:var(--cw-text);font-size:14px;min-height:80px;resize:vertical;box-sizing:border-box;font-family:inherit">${sanitizer.escapeHTML(role.description || '')}</textarea>
      </div>
      <div style="margin-bottom:16px">
        <label style="display:block;font-size:13px;font-weight:600;margin-bottom:10px;color:var(--cw-text)">Permisos:</label>
        ${permHTML}
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button id="cancelEditRole" class="secondary" style="padding:10px 20px;cursor:pointer;border-radius:6px">Cancelar</button>
        <button id="saveEditRole" class="primary" style="padding:10px 20px;cursor:pointer;border-radius:6px">Guardar cambios</button>
      </div>
    `;
    
    // Agregar interactividad a los checkboxes
    const checkboxes = contentDiv.querySelectorAll('.edit-role-perm');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const label = e.target.closest('label');
        if (label) {
          if (e.target.checked) {
            label.style.background = 'var(--cw-primary)';
            label.style.color = '#fff';
          } else {
            label.style.background = 'var(--cw-surface)';
            label.style.color = 'var(--cw-text)';
          }
        }
      });
    });
    
    modalContent.appendChild(titleDiv);
    modalContent.appendChild(contentDiv);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Event listeners
    modal.querySelector('.modalCloseBtn')?.addEventListener('click', () => modal.remove());
    
    document.getElementById('cancelEditRole')?.addEventListener('click', () => modal.remove());
    
    document.getElementById('saveEditRole')?.addEventListener('click', async () => {
      const newName = document.getElementById('editRoleName')?.value?.trim();
      if (!newName) {
        showAlert('Error', 'El nombre del rol es requerido');
        return;
      }
      
      const newPerms = Array.from(contentDiv.querySelectorAll('.edit-role-perm:checked')).map(cb => cb.value);
      if (newPerms.length === 0) {
        showAlert('Error', 'Selecciona al menos un permiso');
        return;
      }
      
      try {
        const saveRes = await fetch(apiUrl(`/roles/${roleId}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newName,
            description: document.getElementById('editRoleDesc')?.value || '',
            permissions: newPerms
          })
        });
        
        if (!saveRes.ok) {
          const err = await saveRes.json();
          showAlert('Error', err.error || 'No se pudo guardar');
          return;
        }
        
        showAlert('✓ Éxito', `Rol "${newName}" actualizado correctamente`);
        modal.remove();
        loadRoles();
      } catch (err) {
        showAlert('Error', err.message);
      }
    });
    
    // Cerrar al hacer click afuera
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
    
  } catch (err) {
    showAlert('Error', err.message);
    console.error('Error editando rol:', err);
  }
}

// Eliminar rol
async function deleteRole(roleId, roleName) {
  if (!confirm(`¿Eliminar el rol "${roleName}"?\n\nLos usuarios con este rol perderán acceso a las funcionalidades asociadas.`)) return;
  
  try {
    const response = await fetch(apiUrl(`/roles/${roleId}`), {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const data = await response.json();
      showAlert('Error', data.error || 'No se pudo eliminar el rol');
      return;
    }
    
    showAlert('✓ Éxito', `Rol "${roleName}" eliminado`);
    loadRoles();
  } catch (err) {
    showAlert('Error', err.message);
  }
}

async function init(){
  // wire elements - core
  els.searchInput = document.getElementById('search');
  els.autocomplete = document.getElementById('autocomplete');
  els.canvas = document.getElementById('canvas');
  els.manualView = document.getElementById('manualView');
  els.manualTitle = document.getElementById('manualTitle');
  els.manualCategory = document.getElementById('manualCategory');
  els.manualVersion = document.getElementById('manualVersion');
  els.manualSteps = document.getElementById('manualSteps');
  els.manualStepsNav = document.getElementById('manualStepsNav');
  els.qrModal = document.getElementById('qrModal');
  els.qrImage = document.getElementById('qrImage');
  els.commentsList = document.getElementById('commentsList');
  els.commentInput = document.getElementById('commentInput');
  els.addComment = document.getElementById('addComment');
  els.versionsList = document.getElementById('versionsList');
  els.faqsList = document.getElementById('faqsList');
  
  // Filter elements
  els.categoryFilter = document.getElementById('manualsCategoryFilter');
  els.roleFilter = document.getElementById('manualsRoleFilter');
  els.typeFilter = document.getElementById('manualsTypeFilter');
  els.orderFilter = document.getElementById('manualsOrderFilter');
  // els.roleFilter removed - not needed
  
  // FASE 4: Analytics elements
  els.topSearchesWidget = document.getElementById('topSearchesWidget');
  els.topCategoriesWidget = document.getElementById('topCategoriesWidget');
  els.topManualsWidget = document.getElementById('topManualsWidget');
  els.totalSearchesWidget = document.getElementById('totalSearchesWidget');
  els.totalViewsWidget = document.getElementById('totalViewsWidget');
  els.totalEventsWidget = document.getElementById('totalEventsWidget');
  els.clearAnalyticsBtn = document.getElementById('clearAnalyticsBtn');
  
  // wire elements - settings
  els.themeDark = document.getElementById('themeDark');
  els.notifEnabled = document.getElementById('notifEnabled');
  els.clearDataBtn = document.getElementById('clearDataBtn');
  els.historyList = document.getElementById('historyList');
  els.agentNameDisplay = document.getElementById('agentName');
  els.toggleAgentMode = document.getElementById('toggleAgentMode');
  // auth & users
  els.loginModal = document.getElementById('loginModal');
  els.loginUser = document.getElementById('loginUser');
  els.loginPass = document.getElementById('loginPass');
  els.loginSubmit = document.getElementById('loginSubmit');
  els.loginBtn = document.getElementById('loginBtn');
  els.logoutBtn = document.getElementById('logoutBtn');
  els.profileName = document.getElementById('profileName');
  els.usersList = document.getElementById('usersList');
  els.addUserBtn = document.getElementById('addUserBtn');
  els.newUserName = document.getElementById('newUserName');
  els.newUserRole = document.getElementById('newUserRole');
  els.newUserPass = document.getElementById('newUserPass');

  // restore persisted state
  STATE.agentMode = JSON.parse(localStorage.getItem('cw:agentMode') || 'false');
  STATE.darkMode = JSON.parse(localStorage.getItem('cw:darkMode') || 'false');
  STATE.fontSize = parseInt(localStorage.getItem('cw:fontSize') || '15');
  STATE.notifEnabled = JSON.parse(localStorage.getItem('cw:notifEnabled') || 'true');
  STATE.agentName = localStorage.getItem('cw:agentName') || 'Agente';

  // apply theme and font size from state
  applyTheme();
  applyFontSize();
  
  // update UI with persisted values
  if(els.themeDark) els.themeDark.checked = STATE.darkMode;
  if(els.notifEnabled) els.notifEnabled.checked = STATE.notifEnabled;
  if(els.agentNameDisplay) els.agentNameDisplay.textContent = STATE.agentName;
  
  document.getElementById('manualComments').classList.toggle('hidden', !STATE.agentMode);
  if(STATE.agentMode && els.toggleAgentMode) els.toggleAgentMode.classList.add('active');

  // SEGURIDAD: Restaurar sesión de localStorage/sessionStorage primero
  // Esto ocurre ANTES de cualquier validación de servidor
  console.log('[init] Restaurando sesión guardada...');
  
  let stored = sessionStorage.getItem('cw:authUser');
  if (stored) {
    try {
      STATE.authUser = JSON.parse(stored);
      console.log('[init] ✓ Sesión restaurada desde sessionStorage');
    } catch(e) {
      console.error('[init] Error parseando sessionStorage:', e);
      stored = null;
    }
  }
  
  // Si sessionStorage está vacío (Ctrl+F5), intentar localStorage
  if (!stored) {
    const storedLocal = localStorage.getItem('cw:authUser');
    if (storedLocal) {
      try {
        STATE.authUser = JSON.parse(storedLocal);
        // Re-guardar en sessionStorage para la sesión actual
        sessionStorage.setItem('cw:authUser', JSON.stringify(STATE.authUser));
        console.log('[init] ✓ Sesión restaurada desde localStorage (después de Ctrl+F5)');
      } catch(e) {
        console.error('[init] Error parseando localStorage:', e);
      }
    }
  }

  // initialize auth UI (users now managed only in backend)
  refreshAuthUI();

  // OPCIONAL: Validar con el servidor si hay conexión (no es crítico)
  if(STATE.authUser && STATE.authUser.id) {
    try {
      console.log('[init] Validando sesión del usuario con servidor...');
      const validateResponse = await fetch(apiUrl(`/validate-user/${STATE.authUser.id}`), {
        method: 'POST',
        credentials: 'include',
        timeout: 5000 // timeout de 5 segundos
      });
      
      if(!validateResponse.ok) {
        if (validateResponse.status === 401 || validateResponse.status === 403) {
          console.warn('[init] Sesión del servidor expirada (401/403), usando sesión local');
        } else {
          console.warn('[init] Error validando con servidor:', validateResponse.status);
        }
      } else {
        console.log('[init] ✓ Sesión del usuario validada con servidor');
        
        // Intentar actualizar permisos desde backend
        try {
          const rolesResponse = await fetch(apiUrl(`/users/${STATE.authUser.id}/roles`), {
            credentials: 'include'
          });
          if (rolesResponse.ok) {
            const roles = await rolesResponse.json();
            if (Array.isArray(roles) && roles.length > 0) {
              const newPerms = roles.flatMap(r => {
                if (!r.permissions) return [];
                const permsArray = typeof r.permissions === 'string' ? JSON.parse(r.permissions) : r.permissions;
                return Array.isArray(permsArray) ? permsArray : [];
              });
              STATE.authUser.permissions = newPerms;
              sessionStorage.setItem('cw:authUser', JSON.stringify(STATE.authUser));
              console.log('[init] ✓ Permisos actualizados desde servidor');
            }
          }
        } catch (err) {
          console.warn('[init] No se pudieron actualizar permisos:', err.message);
        }
        
        // Aplicar UI basada en permisos
        await applyPermissionBasedUI();
      }
    } catch (err) {
      console.warn('[init] Error de validación (probablemente desconexión):', err.message);
      console.log('[init] Continuando con sesión en caché');
    }
  }

  // Limpieza defensiva: eliminar cualquier overlay modal o error de carga visible
  try{
    document.querySelectorAll('.modal').forEach(m=>{ if(!m.classList.contains('hidden')) m.classList.add('hidden'); });
    const loadErr = document.getElementById('cwLoadError'); if(loadErr) loadErr.remove();
    // restore body scroll in case an earlier modal left it disabled
    document.body.style.overflow = '';
    // ensure page is at top to avoid residual scroll offsets
    try{ window.scrollTo(0,0); document.documentElement.scrollTop = 0; document.body.scrollTop = 0; }catch(e){}
    // ensure main container isn't pushed down by stray inline margins
    const mainEl = document.querySelector('.main'); if(mainEl) { mainEl.style.marginTop = '0'; }
    // clear any inline top/transform/position on high-level layout elements that could push content
    ['#app','.sidebar','.topbar','.main','.content'].forEach(sel=>{
      const el = document.querySelector(sel);
      if(el){ el.style.top = ''; el.style.transform = ''; el.style.position = ''; }
    });
  }catch(e){ console.warn('error limpiando overlays', e); }

  // Ahora sí decidir si mostrar UI o login
  if(!STATE.authUser){
    const sidebar = document.querySelector('.sidebar');
    const main = document.querySelector('.main');
    if(sidebar) sidebar.classList.add('hidden');
    if(main) main.classList.add('hidden');
    if(els.loginModal) showLoginModal();
  } else {
    const sidebar = document.querySelector('.sidebar');
    const main = document.querySelector('.main');
    if(sidebar) sidebar.classList.remove('hidden');
    if(main) main.classList.remove('hidden');
  }

  // load data
  try{
    console.log('[init] Iniciando carga de manuales desde API...');
    
    try {
      // Cargar manuales SOLO desde API (fuente de verdad)
      const response = await api.getManuals();
      const apiManuals = response.data || response.manuals || [];
      console.log('[init] ✓ Se recibieron', apiManuals.length, 'manuales desde la API');
      
      // Normalizar steps para asegurar estructura correcta
      STATE.manuals = apiManuals.map((manual) => {
        if (!manual.steps || !Array.isArray(manual.steps)) {
          const sourceArray = manual.content || [];
          if (typeof sourceArray === 'string') {
            try {
              manual.steps = JSON.parse(sourceArray);
            } catch (e) {
              manual.steps = [];
            }
          } else if (Array.isArray(sourceArray)) {
            manual.steps = sourceArray;
          } else {
            manual.steps = [];
          }
        }
        return manual;
      });
      
      console.log('[init] ✓ Manuales normalizados. Total:', STATE.manuals.length);
    } catch (apiErr) {
      console.error('[init] Error cargando manuales desde API:', apiErr);
      console.warn('[init] No hay conexión con la base de datos. Los manuales no estarán disponibles.');
      STATE.manuals = [];
    }
    
    // update system info
    if(els.manualCount) els.manualCount.textContent = STATE.manuals.length;
    if(els.lastUpdate) els.lastUpdate.textContent = new Date().toLocaleDateString('es-ES');
    
    renderManualsList(STATE.manuals);
    // FASE 4: Renderizar analytics dashboard después de cargar datos
    renderAnalyticsDashboard();
    // FASE 11: Inicializar sistema de analytics
    initializeAnalytics();
    // Use event delegation para crear botón manual para sobrevivir re-renders
    document.addEventListener('click', (ev) => {
      if (ev.target.closest('#createManualBtn')) {
        ev.preventDefault();
        openNewManualModal();
      }
    }, true);
    
    // Asegurar que crear manual y controles modal estén conectados (conexión robusta dentro de init)
    try{
      // console.debug('[init] Delegación de eventos configurada para #createManualBtn');
      // Wire export/import buttons in manuals panel
      const exportBtn = document.getElementById('exportManualsBtn');
      if(exportBtn) exportBtn.addEventListener('click', (ev) => { ev.preventDefault(); exportManuals(); });
      const importBtn = document.getElementById('importManualsBtn');
      if(importBtn) importBtn.addEventListener('click', (ev) => { ev.preventDefault(); importManuals(); });
      
      const adminCreateInit = document.getElementById('newManualBtn'); 
      if(adminCreateInit) {
        // console.debug('[init] Conectando eventos a #newManualBtn');
        adminCreateInit.addEventListener('click', (ev)=>{ ev.preventDefault(); openNewManualModal(); });
      }
      const addStepInit = document.getElementById('addNewStepBtn'); 
      if(addStepInit) addStepInit.addEventListener('click', (ev)=>{ ev.preventDefault(); createStepEditorRow(); });
      const saveInit = document.getElementById('saveNewManualBtn'); 
      if(saveInit) saveInit.addEventListener('click', (ev)=>{ ev.preventDefault(); saveNewManual(); });
      // botones genéricos de cierre de modal
      document.querySelectorAll('[data-close]').forEach(b=>{ if(!b._cwCloseWired){ b.addEventListener('click', (ev)=>{ ev.stopPropagation(); document.querySelectorAll('.modal').forEach(m=> m.classList.add('hidden')); }); b._cwCloseWired = true; } });
      
      // console.debug('[init] ✓ Conexión del modal completada');
    }catch(e){ console.warn('error al conectar modal en init', e); }
    // Basic search setup
    const searchWrap = document.querySelector('.search-wrap');
    if (els.searchInput) {
      els.searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (query.length === 0) {
          renderManualsList(STATE.manuals);
        } else {
          const filtered = (STATE.manuals || []).filter(m => 
            (m.title && m.title.toLowerCase().includes(query)) ||
            (m.description && m.description.toLowerCase().includes(query))
          );
          renderManualsList(filtered);
        }
      });
    }

    // Wire FASE 3: Advanced filters
    if (els.categoryFilter) {
      els.categoryFilter.addEventListener('change', () => applyAdvancedFilters());
    }
    if (els.roleFilter) {
      els.roleFilter.addEventListener('change', () => applyAdvancedFilters());
    }
    if (els.typeFilter) {
      els.typeFilter.addEventListener('change', () => applyAdvancedFilters());
    }
    if (els.orderFilter) {
      els.orderFilter.addEventListener('change', () => applyAdvancedFilters());
    }

    // autocomplete selection - soporta manuales y diagramas
    els.autocomplete.addEventListener('select-suggestion', (ev)=>{
      const type = ev.detail.type || 'manual';
      if(type === 'diagram') {
        const diagram = STATE.fibraDiagrams.find(d => d.id === ev.detail.id);
        if(diagram) openDiagramViewer(diagram);
      } else {
        openManual(ev.detail.id);
      }
      els.autocomplete.classList.add('hidden');
    });

    // permitir evento render-suggestions externo (desde filtros)
    els.autocomplete.addEventListener('render-suggestions', (ev)=>{
      const suggestions = ev.detail || [];
      els.autocomplete.innerHTML = '';
      if(!suggestions.length){ els.autocomplete.classList.add('hidden'); return; }
      els.autocomplete.classList.remove('hidden');
      suggestions.forEach(s=>{
        const btn = document.createElement('button'); btn.type='button';
        const icon = s.type === 'diagram' ? '🌳' : '📖';
        btn.innerHTML = `<strong>${icon} ${escapeHtml(s.title)}</strong> <span class="muted">— ${escapeHtml(s.category)}</span><div class="small">${escapeHtml(s.summary||'')}</div>`;
        btn.addEventListener('click', ()=>{
          if(s.type === 'diagram') {
            const diagram = STATE.fibraDiagrams.find(d => d.id === s.id);
            if(diagram) openDiagramViewer(diagram);
          } else {
            openManual(s.id);
          }
          els.autocomplete.classList.add('hidden');
        });
        els.autocomplete.appendChild(btn);
      });
    });

    // global UI actions
    document.querySelectorAll('[data-nav]').forEach(btn=>btn.addEventListener('click', navClick));
    document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click', ()=>openPanel(b.dataset.open)));

    // Agent mode toggle
    if(els.toggleAgentMode) {
      els.toggleAgentMode.addEventListener('click', ()=>{
        STATE.agentMode = !STATE.agentMode;
        localStorage.setItem('cw:agentMode', JSON.stringify(STATE.agentMode));
        document.getElementById('manualComments').classList.toggle('hidden', !STATE.agentMode);
        els.toggleAgentMode.classList.toggle('active', STATE.agentMode);
      });
    }

    // auth handlers
    if(els.loginBtn) els.loginBtn.addEventListener('click', ()=>{ showLoginModal(); });
    if(els.logoutBtn) els.logoutBtn.addEventListener('click', ()=>{ logout(); });
    
    // Login flow: Step 1 (username/email)
    const loginNextBtn = document.getElementById('loginNextBtn');
    if(loginNextBtn) loginNextBtn.addEventListener('click', loginStep1Next);
    if(els.loginUser) els.loginUser.addEventListener('keypress', (e) => { if(e.key === 'Enter') loginStep1Next(); });
    
    // Flujo de login: Paso 2 (contraseña o configuración)
    const loginBackBtn = document.getElementById('loginBackBtn');
    const goToSetupBtn = document.getElementById('goToSetupBtn');
    if(loginBackBtn) loginBackBtn.addEventListener('click', loginStep1Back);
    if(goToSetupBtn) goToSetupBtn.addEventListener('click', loginGoToSetup);
    if(els.loginSubmit) els.loginSubmit.addEventListener('click', async ()=>{ await login(); });
    if(els.loginPass) els.loginPass.addEventListener('keypress', (e) => { if(e.key === 'Enter') login(); });
    
    // cerrar modal de login -> usar helper para restaurar scroll también (solo si existe botón cerrar)
    if(els.loginModal){ 
      const cbtn = els.loginModal.querySelector('[data-close]'); 
      if(cbtn) cbtn.addEventListener('click', ()=>{ resetLoginModal(); hideLoginModal(); }); 
    }

    // escuchadores del modal de configuración de contraseña
    const setupPasswordInput = document.getElementById('setupPassword');
    const setupPasswordConfirm = document.getElementById('setupPasswordConfirm');
    const submitSetupBtn = document.getElementById('submitSetupBtn');
    const cancelSetupBtn = document.getElementById('cancelSetupBtn');
    const setupPasswordModal = document.getElementById('setupPasswordModal');
    
    if(setupPasswordInput) {
      setupPasswordInput.addEventListener('input', updatePasswordStrengthUI);
      setupPasswordInput.addEventListener('keypress', (e) => { if(e.key === 'Enter' && !submitSetupBtn.disabled) submitPasswordSetup(); });
    }
    if(setupPasswordConfirm) {
      setupPasswordConfirm.addEventListener('input', updatePasswordStrengthUI);
      setupPasswordConfirm.addEventListener('keypress', (e) => { if(e.key === 'Enter' && !submitSetupBtn.disabled) submitPasswordSetup(); });
    }
    if(submitSetupBtn) submitSetupBtn.addEventListener('click', async () => { await submitPasswordSetup(); });
    if(cancelSetupBtn) cancelSetupBtn.addEventListener('click', () => { hidePasswordSetupModal(); });
    if(setupPasswordModal) {
      const closeBtn = setupPasswordModal.querySelector('[data-close]');
      if(closeBtn) closeBtn.addEventListener('click', () => hidePasswordSetupModal());
    }

    // admin: agregar usuario (ahora manejado por función createNewUser)
    // código anterior removido - usuarios gestionados solo a través del backend

    // admin: editar manual (botón conectado después)
    const editBtn = document.getElementById('editManualBtn');
    if(editBtn) editBtn.addEventListener('click', ()=>{ openManualEditor(); });
    // manual editor elements
    els.manualEditorModal = document.getElementById('manualEditorModal');
    els.editTitle = document.getElementById('editTitle');
    els.editSummary = document.getElementById('editSummary');
    els.editStepsList = document.getElementById('editStepsList');
    els.addStepBtn = document.getElementById('addStepBtn');
    els.deleteManualBtn = document.getElementById('deleteManualBtn');
    els.editVersionsList = document.getElementById('editVersionsList');
    els.exportCurrentBtn = document.getElementById('exportCurrentBtn');
    els.saveManualBtn = document.getElementById('saveManualBtn');
    if(els.saveManualBtn) els.saveManualBtn.addEventListener('click', ()=>{ 
      // Check if this is a KB Manager manual (has dataset.manualId)
      const modal = document.getElementById('manualEditorModal');
      if (modal && modal.dataset.manualId) {
        saveKBManualEdit(modal.dataset.manualId);
      } else {
        saveManualEdits();
      }
    });
    if(els.addStepBtn) els.addStepBtn.addEventListener('click', ()=>{ addEditorStep(); });
    if(els.deleteManualBtn) els.deleteManualBtn.addEventListener('click', async ()=>{ 
      const modal = document.getElementById('manualEditorModal');
      if (modal && modal.dataset.manualId) {
        deleteKBManual(modal.dataset.manualId);
      } else if(await showConfirm('Eliminar manual', '¿Estás seguro? Esta acción es irreversible.')) {
        deleteManual(STATE.current && STATE.current.id);
      }
    });
    if(els.exportCurrentBtn) els.exportCurrentBtn.addEventListener('click', ()=>{ exportCurrentManual(); });
    // admin toolbar bindings
    const newManualBtn = document.getElementById('newManualBtn');
    if(newManualBtn) newManualBtn.addEventListener('click', ()=>openNewManualModal());
    
    // PDF import handler
    const processPdfBtn = document.getElementById('processPdfBtn');
    const pdfFileInput = document.getElementById('pdfFileInput');
    if(processPdfBtn && pdfFileInput) {
      processPdfBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        pdfFileInput.click();
      });
      pdfFileInput.addEventListener('change', async (ev) => {
        const file = ev.target.files[0];
        if(file && file.type === 'application/pdf') {
          processPdfFile(file);
        } else {
          await showAlert('Archivo Inválido', 'Por favor selecciona un archivo PDF válido');
        }
      });
    }
    
    // JSON import handler
    const importJsonBtn = document.getElementById('importJsonBtn');
    const jsonFileInput = document.getElementById('jsonFileInput');
    if(importJsonBtn && jsonFileInput) {
      importJsonBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        jsonFileInput.click();
      });
      jsonFileInput.addEventListener('change', async (ev) => {
        const file = ev.target.files[0];
        if(file && (file.type === 'application/json' || file.name.endsWith('.json'))) {
          processJsonFile(file);
        } else {
          await showAlert('Archivo Inválido', 'Por favor selecciona un archivo JSON válido');
        }
      });
    }
    
    // Manage categories button
    const manageCategoriesBtn = document.getElementById('manageCategoriesBtn');
    if(manageCategoriesBtn) manageCategoriesBtn.addEventListener('click', ()=>{ openManageCategoriesModal(); });

    // Fibra/Diagramas - Conectar botón de creación con delegación de eventos
    document.addEventListener('click', async (ev) => {
      if (ev.target.closest('#createDiagramBtn')) {
        ev.preventDefault();
        const isAdmin = STATE.authUser && STATE.authUser.role === 'admin';
        const perms = STATE.authUser?.permissions || [];
        const canCreateDiagrams = isAdmin || perms.includes('edit_diagrams');
        
        if (!canCreateDiagrams) {
          await showAlert('Acceso Denegado', 'No tienes permisos para crear árboles de decisión');
          return;
        }
        openNewDiagramModal();
      }
    }, true);

    // Load diagrams
    loadDiagrams();

    // Filtros de diagramas por categoría
    const filterCategory = document.getElementById('filterDiagramCategory');
    const filterSubcategory = document.getElementById('filterDiagramSubcategory');
    
    if (filterCategory) {
      filterCategory.addEventListener('change', () => {
        applyDiagramFilters();
      });
    }
    
    if (filterSubcategory) {
      filterSubcategory.addEventListener('change', () => {
        applyDiagramFilters();
      });
    }

    // Load users list if admin (after a small delay to ensure STATE is ready)
    if(STATE.authUser && STATE.authUser.role === 'admin') {
      setTimeout(() => {
        console.log('[init] Cargando lista de usuarios para admin:', STATE.authUser.username);
        refreshUsersList();
        loadRolesInUserForm();
      }, 100);
    }

    // ========== FASE 2: Inicializar accesibilidad ==========
    setupKeyboardShortcuts();
    improveAccessibility();

    // Settings handlers
    if(els.themeDark) {
      els.themeDark.addEventListener('change', (ev) => {
        STATE.darkMode = ev.target.checked;
        localStorage.setItem('cw:darkMode', JSON.stringify(STATE.darkMode));
        applyTheme();
      });
    }

    if(els.notifEnabled) {
      els.notifEnabled.addEventListener('change', (ev) => {
        STATE.notifEnabled = ev.target.checked;
        localStorage.setItem('cw:notifEnabled', JSON.stringify(STATE.notifEnabled));
      });
    }

    if(els.notifEnabled) {
      els.notifEnabled.addEventListener('change', (ev) => {
        STATE.notifEnabled = ev.target.checked;
        localStorage.setItem('cw:notifEnabled', JSON.stringify(STATE.notifEnabled));
      });
    }

    if(els.clearDataBtn) {
      els.clearDataBtn.addEventListener('click', async () => {
        if(await showConfirm('Borrar datos', '¿Estás seguro? Se eliminarán todos los datos locales (progreso, comentarios, historial).')) {
          localStorage.clear();
          STATE.progress = {};
          STATE.comments = {};
          STATE.history = [];
          renderHistory();
          // FASE 4: Limpiar analytics también
          renderAnalyticsDashboard();
          pushNotification({title: 'Datos borrados', text: 'Todos los datos locales han sido eliminados.'});
        }
      });
    }
    
    // FASE 4: Clear analytics button
    if(els.clearAnalyticsBtn) {
      els.clearAnalyticsBtn.addEventListener('click', async () => {
        if(await showConfirm('Limpiar histórico de analytics', '¿Estás seguro? Se eliminarán todos los datos de análisis (búsquedas, vistas, eventos).')) {
          const { clearAnalytics } = await import('./dataService.js');
          clearAnalytics();
          renderAnalyticsDashboard();
          pushNotification({title: 'Analytics limpiado', text: 'Todos los datos de análisis han sido eliminados.'});
        }
      });
    }

    // Search and History handlers
    const searchHistoryEnabled = document.getElementById('searchHistoryEnabled');
    if(searchHistoryEnabled) {
      searchHistoryEnabled.addEventListener('change', (ev) => {
        localStorage.setItem('cw:searchHistoryEnabled', JSON.stringify(ev.target.checked));
      });
    }

    const autoSuggest = document.getElementById('autoSuggest');
    if(autoSuggest) {
      autoSuggest.addEventListener('change', (ev) => {
        localStorage.setItem('cw:autoSuggest', JSON.stringify(ev.target.checked));
      });
    }

    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if(clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', async () => {
        if(await showConfirm('Borrar historial', '¿Borrar todo el historial de búsquedas y vistas?')) {
          STATE.history = [];
          localStorage.setItem('cw:history', JSON.stringify([]));
          renderHistory();
          pushNotification({title: 'Historial borrado', text: 'Tu historial de búsquedas y vistas ha sido eliminado.'});
        }
      });
    }

    // Change password handler
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if(changePasswordBtn) {
      changePasswordBtn.addEventListener('click', async () => {
        await changePassword();
      });
    }

    // FASE 9: Restart tour button
    const restartTourBtn = document.getElementById('restartTourBtn');
    if(restartTourBtn) {
      restartTourBtn.addEventListener('click', () => {
        const helpModal = document.getElementById('helpModal');
        if(helpModal) helpModal.classList.add('hidden');
        startTour(true);
      });
    }

    // Update data usage display periodically
    // updateDataUsage();
    // setInterval(updateDataUsage, 5000);

    // Initialize notifications display
    renderNotifications();

    document.getElementById('qrBtn').addEventListener('click', showQr);
    
    // FASE 8: Event listeners para export y compartición
    document.getElementById('exportManualBtn')?.addEventListener('click', () => {
      if (STATE.current) exportManualToPDF(STATE.current);
    });
    
    document.getElementById('shareManualBtn')?.addEventListener('click', () => {
      if (STATE.current) {
        // Abrir modal de compartir para manuales privados
        if (STATE.current.is_private) {
          openShareManualModal(STATE.current.id);
        } else {
          // Para manuales públicos, copiar enlace
          copyShareLink(STATE.current);
        }
      }
    });
    
    document.getElementById('emailManualBtn')?.addEventListener('click', () => {
      if (STATE.current) showEmailModal(STATE.current);
    });
    
    // También para el modal de edición
    document.addEventListener('click', (ev) => {
      if (ev.target.closest('#shareCurrentBtn')) {
        if (STATE.current) copyShareLink(STATE.current);
      }
      if (ev.target.closest('#emailCurrentBtn')) {
        if (STATE.current) showEmailModal(STATE.current);
      }
      // Manual sharing button
      if (ev.target.closest('#shareManualBtn')) {
        const manualId = document.getElementById('shareManualId').value;
        const email = document.getElementById('shareManualEmail').value;
        const permission = document.getElementById('shareManualPermission').value;
        if (manualId) shareManual(manualId, email, permission);
      }
    });
    
    document.getElementById('backToManualsBtn').addEventListener('click', () => {
      // Ocultar vista de manual y mostrar manualsListView
      document.getElementById('manualView').classList.add('hidden');
      document.getElementById('manualsListView').classList.remove('hidden');
      document.getElementById('welcome').classList.add('hidden');
    });
    document.getElementById('helpBtn').addEventListener('click', ()=>document.getElementById('helpModal').classList.remove('hidden'));
    document.getElementById('notificationsBtn').addEventListener('click', ()=>{
      document.getElementById('notificationsPanel').classList.remove('hidden');
      renderNotifications();
    });
    // vincular de forma segura el controlador de cierre para qrModal si existe un botón de cierre
    const _qrModal = document.getElementById('qrModal');
    if(_qrModal){ const _qrClose = _qrModal.querySelector('[data-close]'); if(_qrClose) _qrClose.addEventListener('click', ()=>_qrModal.classList.add('hidden')); }
    document.querySelectorAll('#notificationsPanel [data-close], #helpModal [data-close]').forEach(b=>b.addEventListener('click', ()=>b.closest('.modal').classList.add('hidden')));
    els.addComment.addEventListener('click', addComment);

    // Defensive: ensure modals are hidden on init (keep loginModal control separate)
    ['helpModal','notificationsPanel','qrModal','manualEditorModal'].forEach(id=>{
      const m = document.getElementById(id);
      if(m && !m.classList.contains('hidden')) m.classList.add('hidden');
    });

    // Close modals on ESC - ONLY close modals, never close the manual
    document.addEventListener('keydown', (ev)=>{
      if(ev.key === 'Escape'){
        // Check if ANY modal is open
        const allModals = document.querySelectorAll('.modal');
        let topmostModal = null;
        
        // Find the topmost visible modal (last in DOM = highest z-index)
        for (let i = allModals.length - 1; i >= 0; i--) {
          if (!allModals[i].classList.contains('hidden')) {
            topmostModal = allModals[i];
            break;
          }
        }
        
        // ONLY close if there's a visible modal
        // Never close the manual
        if (topmostModal) {
          ev.preventDefault();
          ev.stopPropagation();
          
          // Special case: don't close login modal with ESC if not authenticated
          if (topmostModal.id === 'loginModal' && !STATE.authUser) {
            return;
          }
          
          topmostModal.classList.add('hidden');
        }
      }
    }, true); // Use capture phase
    document.querySelectorAll('.modal').forEach(modal=>{
      modal.addEventListener('click', (ev)=>{
        if(ev.target === modal) {
          if(modal.id === 'loginModal'){
            if(STATE.authUser) hideLoginModal();
          } else modal.classList.add('hidden');
        }
      });
    });

    // renderizado inicial de faqs e historial
    // Load base faqs from data and merge with custom faqs from localStorage
    const baseFaqs = []; // FAQs can be created by users
    let customFaqs = JSON.parse(localStorage.getItem('cw:faqs')||'null');
    if(!customFaqs){
      // seed a few useful FAQs so the panel isn't empty on first run
      customFaqs = [
        { id: 'custom-1', q: '¿Cómo reinicio un router?', a: 'Desconecta el router de la corriente, espera 30 segundos y vuelve a conectar. Espera 2-3 minutos para que se estabilice la conexión.' , created: Date.now() },
        { id: 'custom-2', q: 'Cliente con internet lento', a: 'Comprueba primero la velocidad con una prueba (speedtest). Reinicia el router; si persiste, revisa interferencias Wi‑Fi y el estado del cableado.' , created: Date.now() },
        { id: 'custom-3', q: 'No hay señal de TV', a: 'Verifica que el decodificador esté encendido y conectado. Reinicia el equipo y comprueba las entradas HDMI/AV.' , created: Date.now() }
      ];
      localStorage.setItem('cw:faqs', JSON.stringify(customFaqs));
    }
    STATE.faqs = (baseFaqs || []).concat(customFaqs || []);
    renderFaqs(STATE.faqs || []);

    // Wire FAQ management UI
    els.createFaqBtn = document.getElementById('createFaqBtn');
    els.faqModal = document.getElementById('faqModal');
    els.faqQuestion = document.getElementById('faqQuestion');
    els.faqAnswer = document.getElementById('faqAnswer');
    els.saveFaqBtn = document.getElementById('saveFaqBtn');
    els.deleteFaqBtn = document.getElementById('deleteFaqBtn');
    els.faqSearch = document.getElementById('faqSearch');
    els.clearFaqSearch = document.getElementById('clearFaqSearch');
    els.exportAllDataBtn = document.getElementById('exportAllDataBtn');

    if(els.createFaqBtn) els.createFaqBtn.addEventListener('click', (ev)=>{ ev.preventDefault(); openFaqModal(); });
    if(els.saveFaqBtn) els.saveFaqBtn.addEventListener('click', (ev)=>{ ev.preventDefault(); saveFaq(); });
    if(els.deleteFaqBtn) els.deleteFaqBtn.addEventListener('click', async (ev)=>{ 
      ev.preventDefault(); 
      if(await showConfirm('Eliminar FAQ', '¿Eliminar esta FAQ?')) {
        deleteFaq(els.deleteFaqBtn.dataset.id);
      }
    });
    if(els.faqSearch) els.faqSearch.addEventListener('input', debounce((ev)=>{ filterFaqs(ev.target.value); }, 220));
    if(els.clearFaqSearch) els.clearFaqSearch.addEventListener('click', ()=>{ if(els.faqSearch) { els.faqSearch.value=''; filterFaqs(''); } });
    if(els.exportAllDataBtn) els.exportAllDataBtn.addEventListener('click', (ev)=>{ ev.preventDefault(); exportAllData(); });

    // User management (admin only)
    const addUserBtn = document.getElementById('addUserBtn');
    if(addUserBtn) addUserBtn.addEventListener('click', createNewUser);
    
    renderHistory();

    // Initialize custom selects
    initializeCustomSelects();

  }catch(err){
    console.error(err);
    showLoadError(err);
  }
}

// ========== CUSTOM SELECT COMPONENT ==========
function initializeCustomSelects() {
  // Target all select elements that need custom styling
  const selectsToCustomize = [
    'filterDiagramCategory',
    'filterDiagramSubcategory',
    'manualsCategoryFilter',
    'manualsRoleFilter',
    'manualsTypeFilter',
    'manualsOrderFilter',
    'categoryParent',
    'categorySubcategory',
    'newUserRole',
    'newCategorySelect',
    'newDiagramParentCategory',
    'newDiagramSubcategory'
  ];

  selectsToCustomize.forEach(selectId => {
    const selectEl = document.getElementById(selectId);
    if (selectEl) {
      convertSelectToCustom(selectEl);
    }
  });
}

// Helper function para reinicializar custom selects después de crear dinámicamente
function initializeCustomSelectsForElement(elementId) {
  const selectEl = document.getElementById(elementId);
  if (selectEl && !selectEl._customized) {
    convertSelectToCustom(selectEl);
  }
}

// Helper function para actualizar un custom select cuando sus opciones cambian
function updateCustomSelectOptions(selectEl) {
  if (!selectEl || !selectEl._customized) return;
  
  const wrapper = selectEl.parentNode;
  if (!wrapper || !wrapper.classList.contains('custom-select-wrapper')) return;
  
  const dropdown = wrapper.querySelector('.custom-select-dropdown');
  const customBtn = wrapper.querySelector('.custom-select');
  if (!dropdown || !customBtn) return;
  
  dropdown.innerHTML = '';
  
  // Reconstruct options from the original select
  Array.from(selectEl.options).forEach(option => {
    const optDiv = document.createElement('div');
    optDiv.className = 'custom-select-option';
    
    if (option.value === selectEl.value) {
      optDiv.classList.add('selected');
    }
    
    const emoji = option.dataset.emoji || '';
    optDiv.innerHTML = `<span class="custom-select-label">${emoji ? emoji + ' ' : ''}${escapeHtml(option.text)}</span>`;
    
    optDiv.addEventListener('click', (e) => {
      e.stopPropagation();
      
      selectEl.value = option.value;
      
      Array.from(dropdown.querySelectorAll('.custom-select-option')).forEach(opt => {
        opt.classList.remove('selected');
      });
      optDiv.classList.add('selected');
      
      const label = customBtn.querySelector('.custom-select-label');
      if (label) {
        label.textContent = (emoji ? emoji + ' ' : '') + option.text;
      }
      
      customBtn.classList.remove('active');
      dropdown.classList.remove('active');
      
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    dropdown.appendChild(optDiv);
  });
  
  // Update button text
  const selectedOption = selectEl.options[selectEl.selectedIndex];
  const emoji = selectedOption?.dataset.emoji || '';
  const label = customBtn.querySelector('.custom-select-label');
  if (label) {
    label.textContent = (emoji ? emoji + ' ' : '') + (selectedOption?.text || 'Seleccionar...');
  }
}

function convertSelectToCustom(selectEl) {
  if (selectEl._customized) return; // Already converted
  selectEl._customized = true;

  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'custom-select-wrapper';

  // Get current selected option
  const selectedOption = selectEl.options[selectEl.selectedIndex];
  const selectedText = selectedOption?.text || 'Seleccionar...';
  const selectedValue = selectEl.value;

  // Create custom select button
  const customSelect = document.createElement('div');
  customSelect.className = 'custom-select';
  customSelect.tabIndex = 0;
  customSelect.setAttribute('role', 'combobox');
  customSelect.setAttribute('aria-expanded', 'false');
  customSelect.innerHTML = `
    <span class="custom-select-label">${escapeHtml(selectedText)}</span>
    <span class="custom-select-arrow">▼</span>
  `;

  // Create dropdown container
  const dropdown = document.createElement('div');
  dropdown.className = 'custom-select-dropdown';

  // Add options to dropdown
  Array.from(selectEl.options).forEach(option => {
    const optionEl = document.createElement('div');
    optionEl.className = 'custom-select-option';
    if (option.value === selectedValue) {
      optionEl.classList.add('selected');
    }

    // Get emoji if available from data attribute
    const emoji = option.dataset.emoji || '';
    optionEl.innerHTML = `<span class="custom-select-label">${emoji ? emoji + ' ' : ''}${escapeHtml(option.text)}</span>`;

    optionEl.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Update original select
      selectEl.value = option.value;
      
      // Update custom select display
      Array.from(dropdown.querySelectorAll('.custom-select-option')).forEach(opt => {
        opt.classList.remove('selected');
      });
      optionEl.classList.add('selected');

      // Update button text
      const label = customSelect.querySelector('.custom-select-label');
      if (label) {
        label.textContent = (emoji ? emoji + ' ' : '') + option.text;
      }

      // Close dropdown
      customSelect.classList.remove('active');
      dropdown.classList.remove('active');

      // Trigger change event on original select
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    });

    dropdown.appendChild(optionEl);
  });

  // Toggle dropdown on click
  customSelect.addEventListener('click', (e) => {
    e.stopPropagation();
    const isActive = customSelect.classList.contains('active');
    
    // Close other dropdowns
    document.querySelectorAll('.custom-select.active').forEach(el => {
      if (el !== customSelect) {
        el.classList.remove('active');
        el.setAttribute('aria-expanded', 'false');
        el.nextElementSibling?.classList.remove('active');
      }
    });

    if (isActive) {
      customSelect.classList.remove('active');
      customSelect.setAttribute('aria-expanded', 'false');
      dropdown.classList.remove('active');
    } else {
      customSelect.classList.add('active');
      customSelect.setAttribute('aria-expanded', 'true');
      dropdown.classList.add('active');
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      customSelect.classList.remove('active');
      customSelect.setAttribute('aria-expanded', 'false');
      dropdown.classList.remove('active');
    }
  });

  // Keyboard navigation
  customSelect.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      customSelect.click();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!customSelect.classList.contains('active')) {
        customSelect.click();
      } else {
        const options = Array.from(dropdown.querySelectorAll('.custom-select-option'));
        const selectedIdx = options.findIndex(opt => opt.classList.contains('selected'));
        let newIdx = e.key === 'ArrowDown' ? selectedIdx + 1 : selectedIdx - 1;
        if (newIdx < 0) newIdx = 0;
        if (newIdx >= options.length) newIdx = options.length - 1;
        if (options[newIdx]) {
          options[newIdx].click();
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      customSelect.classList.remove('active');
      dropdown.classList.remove('active');
    }
  });

  // Append elements
  wrapper.appendChild(customSelect);
  wrapper.appendChild(dropdown);

  // Replace original select with wrapper
  selectEl.parentNode.insertBefore(wrapper, selectEl);
  selectEl.style.display = 'none';
  wrapper.appendChild(selectEl);
}

// Ayudantes de FAQ: abrir modal para FAQ nueva o existente
function openFaqModal(faq){
  if(faq && faq.id){
    // editing existing
    if(!(STATE.authUser && STATE.authUser.role === 'admin')){ 
      showAlert('Acceso Denegado', 'Solo administradores pueden editar FAQs.'); 
      return; 
    }
    if(els.faqQuestion) els.faqQuestion.value = faq.q || '';
    if(els.faqAnswer) els.faqAnswer.value = faq.a || '';
    if(els.deleteFaqBtn) { els.deleteFaqBtn.style.display = ''; els.deleteFaqBtn.dataset.id = faq.id; }
    if(els.faqModal) els.faqModal.classList.remove('hidden');
    els.faqModal._editingId = faq.id;
  } else {
    // creating new
    if(!(STATE.authUser && STATE.authUser.role === 'admin')){ 
      showAlert('Acceso Denegado', 'Solo administradores pueden crear FAQs.'); 
      return; 
    }
    if(els.faqQuestion) els.faqQuestion.value = '';
    if(els.faqAnswer) els.faqAnswer.value = '';
    if(els.deleteFaqBtn) { els.deleteFaqBtn.style.display = 'none'; delete els.deleteFaqBtn.dataset.id; }
    if(els.faqModal) els.faqModal.classList.remove('hidden');
    delete els.faqModal._editingId;
  }
}

function persistFaqs(){
  const customs = (STATE.faqs || []).filter(f=> String(f.id||'').startsWith('custom-') || String(f.id||'').startsWith('import-'));
  localStorage.setItem('cw:faqs', JSON.stringify(customs));
}

function saveFaq(){
  if(!(STATE.authUser && STATE.authUser.role === 'admin')){ 
    showAlert('Acceso Denegado', 'Solo administradores pueden guardar FAQs.'); 
    return; 
  }
  if(!els.faqQuestion || !els.faqAnswer) return;
  const q = els.faqQuestion.value.trim(); const a = els.faqAnswer.value.trim();
  if(!q || !a){ 
    showAlert('Campos Obligatorios', 'Pregunta y respuesta son obligatorias.'); 
    return; 
  }
  // editing?
  const editingId = els.faqModal && els.faqModal._editingId;
  if(editingId){
    const idx = (STATE.faqs||[]).findIndex(x=>x.id === editingId);
    if(idx !== -1){ STATE.faqs[idx].q = q; STATE.faqs[idx].a = a; }
    pushNotification({title:'FAQ actualizada', text: q});
  } else {
    const id = 'custom-' + Date.now();
    const newFaq = { id, q, a, created: Date.now() };
    STATE.faqs = STATE.faqs || [];
    STATE.faqs.unshift(newFaq);
    pushNotification({title:'FAQ creada', text: q});
  }
  persistFaqs();
  renderFaqs(STATE.faqs);
  if(els.faqModal) els.faqModal.classList.add('hidden');
}

function deleteFaq(id){
  if(!(STATE.authUser && STATE.authUser.role === 'admin')){ 
    showAlert('Acceso Denegado', 'Solo administradores pueden eliminar FAQs.'); 
    return; 
  }
  if(!id) return;
  STATE.faqs = (STATE.faqs||[]).filter(f=>f.id !== id);
  persistFaqs();
  renderFaqs(STATE.faqs);
  pushNotification({title:'FAQ eliminada', text: id});
}

function showLoadError(err){
  // eliminar cualquier overlay existente
  const existing = document.getElementById('cwLoadError');
  if(existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'cwLoadError';
  overlay.setAttribute('role','alert');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.background = 'rgba(8,15,30,0.5)';
  overlay.style.zIndex = '9999';
  overlay.innerHTML = `
    <div style="background:var(--cw-surface);padding:22px;border-radius:12px;max-width:720px;box-shadow:var(--shadow)">
      <h3>Error cargando contenido</h3>
      <p>Ha ocurrido un error al cargar los manuales: <strong>${escapeHtml(String(err.message||err))}</strong></p>
      <p>Comprueba la conexión o pulsa <strong>Reintentar</strong>. Si el problema persiste, contacta con el equipo técnico.</p>
      <div style="display:flex;gap:10px;margin-top:12px;justify-content:flex-end">
        <button id="cwRetry" style="padding:10px 14px;border-radius:8px">Reintentar</button>
        <button id="cwDismiss" style="padding:10px 14px;border-radius:8px;background:transparent;border:1px solid #e6eef8">Cerrar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('cwRetry').addEventListener('click', ()=>{ overlay.remove(); init(); });
  document.getElementById('cwDismiss').addEventListener('click', ()=>overlay.remove());
}

function navClick(ev){
  document.querySelectorAll('[data-nav]').forEach(b=>b.classList.remove('active'));
  ev.target.classList.add('active');
  openPanel(ev.target.dataset.nav);
}

function openPanel(name){
  // Verificar permisos antes de abrir el panel
  const perms = STATE.authUser?.permissions || [];
  
  // Logging detallado
  console.log(`[openPanel] Intentando abrir panel: ${name}`, {
    user: STATE.authUser?.name,
    role: STATE.authUser?.role,
    permissions: perms,
    isAdmin: STATE.authUser?.role === 'admin'
  });
  
  // Validar acceso por permisos (solo para no-admins)
  if (STATE.authUser?.role !== 'admin') {
    const permMap = {
      'manuals': 'view_manuals',
      'fibra': 'view_diagrams',
      'users': 'view_users',
      'roles': 'manage_roles',
      'audit': 'view_audit'
    };
    
    const requiredPerm = permMap[name];
    
    if (requiredPerm && !perms.includes(requiredPerm)) {
      console.warn(`[openPanel] ✗ Usuario ${STATE.authUser?.name} no tiene permiso ${requiredPerm} para acceder a ${name}`);
      showAlert('Acceso Denegado', `No tienes permisos para acceder a esta sección.`);
      return;
    }
  }
  
  // show/hide panels
  document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden'));
  if(name === 'dashboard') {
    document.getElementById('welcome').classList.remove('hidden');
    document.getElementById('adminToolbar')?.classList.add('hidden');
    // Actualizar dashboard cuando se navega a él
    renderAnalyticsDashboard();
  }
  else if(name === 'manuals') {
    document.getElementById('manualsListView').classList.remove('hidden');
    document.getElementById('adminToolbar')?.classList.add('hidden');
    // FASE 14: Lazy loading de manuales
    resetPaginationState();
    loadMoreManuals(0);
    // FASE 16: Inicializar árbol de carpetas
    initFolderView();
  }
  else if(name === 'faqs') {
    document.getElementById('faqsView').classList.remove('hidden');
    document.getElementById('adminToolbar')?.classList.add('hidden');
  }
  else if(name === 'fibra') {
    document.getElementById('fibraView').classList.remove('hidden');
    document.getElementById('adminToolbar')?.classList.add('hidden');
    // FASE 14: Lazy loading de diagramas
    resetPaginationState();
    loadMoreDiagrams(0);
  }
  else if(name === 'settings') {
    document.getElementById('settingsView').classList.remove('hidden');
    document.getElementById('adminToolbar')?.classList.add('hidden');
    // Refresh users list when opening settings if admin or has permission
    if(STATE.authUser && (STATE.authUser.role === 'admin' || perms.includes('view_users'))) {
      refreshUsersList();
      // FASE 16: Inicializar gestión de carpetas si es admin
      initFolderManagement();
    }
    // Load roles when opening settings
    if(STATE.authUser && (STATE.authUser.role === 'admin' || perms.includes('view_roles'))) {
      loadRoles();
    }
  }
  else if(name === 'history') {
    document.getElementById('historyView').classList.remove('hidden');
    document.getElementById('adminToolbar')?.classList.add('hidden');
    renderHistory();
  }
}

// Apply category and role filters to manuals list
// Debounced version of applyManualFilters for FASE 14
const debouncedApplyManualFilters = debounce(function() {
  let filtered = STATE.manuals;
  
  // Filter by category
  if (els.categoryFilter && els.categoryFilter.value) {
    filtered = filtered.filter(m => (m.category || 'Sin categoría') === els.categoryFilter.value);
  }
  
  // Filter by role
  if (els.roleFilter && els.roleFilter.value) {
    filtered = filtered.filter(m => m.role === els.roleFilter.value);
  }
  
  renderManualsList(filtered);
}, 500);

function applyManualFilters() {
  debouncedApplyManualFilters();
}

// Update available categories in the category filter
function updateCategoryOptions() {
  if (!els.categoryFilter) return;
  
  // Get current selected value
  const currentValue = els.categoryFilter.value;
  
  // Clear ALL options and rebuild from scratch
  els.categoryFilter.innerHTML = '<option value="">🏷️ Categoría</option>';
  
  // Add categories from current manuals
  const categories = new Set(STATE.manuals.map(m => m.category || 'Sin categoría'));
  const sortedCats = Array.from(categories).sort();
  sortedCats.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    els.categoryFilter.appendChild(opt);
  });
  
  // Restore previous selection if it still exists
  if (currentValue && Array.from(els.categoryFilter.options).some(o => o.value === currentValue)) {
    els.categoryFilter.value = currentValue;
  }
}

function updateAdvancedFilterOptions() {
  console.log('[updateAdvancedFilterOptions] Actualizando filtros avanzados');
  
  // Actualizar Categorías
  if (els.categoryFilter) {
    const currentCategory = els.categoryFilter.value;
    els.categoryFilter.innerHTML = '<option value="">📁 Categoría</option>';
    
    // Obtener solo categorías que tengan al menos un manual
    const categories = new Set(STATE.manuals.filter(m => m.category).map(m => m.category));
    const sortedCategories = Array.from(categories).sort();
    
    console.log('[updateAdvancedFilterOptions] Categorías encontradas:', sortedCategories);
    sortedCategories.forEach(category => {
      const opt = document.createElement('option');
      opt.value = category;
      opt.textContent = category;
      els.categoryFilter.appendChild(opt);
    });
    
    if (currentCategory && Array.from(els.categoryFilter.options).some(o => o.value === currentCategory)) {
      els.categoryFilter.value = currentCategory;
    }
  }
  
  // Actualizar Roles - solo con manuales que tengan rol
  if (els.roleFilter) {
    const currentRole = els.roleFilter.value;
    els.roleFilter.innerHTML = '<option value="">👤 Rol / Área</option>';
    
    // Obtener solo roles que tengan al menos un manual
    const roles = new Set(STATE.manuals.filter(m => m.role).map(m => m.role));
    const sortedRoles = Array.from(roles).sort();
    
    console.log('[updateAdvancedFilterOptions] Roles encontrados:', sortedRoles);
    sortedRoles.forEach(role => {
      const opt = document.createElement('option');
      opt.value = role;
      opt.textContent = role;
      els.roleFilter.appendChild(opt);
    });
    
    if (currentRole && Array.from(els.roleFilter.options).some(o => o.value === currentRole)) {
      els.roleFilter.value = currentRole;
    }
  }
  
  // Actualizar Tipos - solo con manuales que tengan tipo
  if (els.typeFilter) {
    const currentType = els.typeFilter.value;
    els.typeFilter.innerHTML = '<option value="">🏷️ Tipo</option>';
    
    // Obtener solo tipos que tengan al menos un manual
    const types = new Set(STATE.manuals.filter(m => m.type).map(m => m.type));
    const sortedTypes = Array.from(types).sort();
    
    console.log('[updateAdvancedFilterOptions] Tipos encontrados:', sortedTypes);
    sortedTypes.forEach(type => {
      const opt = document.createElement('option');
      opt.value = type;
      opt.textContent = type;
      els.typeFilter.appendChild(opt);
    });
    
    if (currentType && Array.from(els.typeFilter.options).some(o => o.value === currentType)) {
      els.typeFilter.value = currentType;
    }
  }
  
  console.log('[updateAdvancedFilterOptions] Filtros actualizados');
  
  // FASE 16: Actualizar también los selectores del modal
  updateModalMetadataSelects();
}

// Actualizar selectores del modal con nuevas opciones (FASE 16)
function updateModalMetadataSelects() {
  console.log('[updateModalMetadataSelects] Actualizando selectores del modal');
  
  // Actualizar selector de categorías en modal
  const catSelect = document.getElementById('newCategorySelect');
  if (catSelect && catSelect.options.length > 0) {
    const currentValue = catSelect.value;
    const cats = Array.from(new Set((STATE.manuals || []).map(m => m.category).filter(Boolean))).sort();
    
    // Solo actualizar si hay nuevas categorías
    const existingOptions = Array.from(catSelect.options).slice(1).map(o => o.value);
    if (cats.length !== existingOptions.length || !cats.every((c, i) => c === existingOptions[i])) {
      catSelect.innerHTML = '<option value="">-- Selecciona --</option>';
      cats.forEach(c => {
        const o = document.createElement('option');
        o.value = c;
        o.textContent = c;
        catSelect.appendChild(o);
      });
      updateCustomSelectOptions(catSelect);
    }
  }
  
  // Actualizar selector de roles en modal
  const roleSelect = document.getElementById('newRoleSelect');
  if (roleSelect && roleSelect.options.length > 0) {
    const currentValue = roleSelect.value;
    const roles = Array.from(new Set((STATE.manuals || []).map(m => m.role).filter(Boolean))).sort();
    
    // Solo actualizar si hay nuevos roles
    const existingOptions = Array.from(roleSelect.options).slice(1).map(o => o.value);
    if (roles.length !== existingOptions.length || !roles.every((r, i) => r === existingOptions[i])) {
      roleSelect.innerHTML = '<option value="">👤 Rol / Área</option>';
      roles.forEach(role => {
        const o = document.createElement('option');
        o.value = role;
        o.textContent = role;
        roleSelect.appendChild(o);
      });
      updateCustomSelectOptions(roleSelect);
    }
  }
  
  // Actualizar selector de tipos en modal
  const typeSelect = document.getElementById('newTypeSelect');
  if (typeSelect && typeSelect.options.length > 0) {
    const currentValue = typeSelect.value;
    const types = Array.from(new Set((STATE.manuals || []).map(m => m.type).filter(Boolean))).sort();
    
    // Solo actualizar si hay nuevos tipos
    const existingOptions = Array.from(typeSelect.options).slice(1).map(o => o.value);
    if (types.length !== existingOptions.length || !types.every((t, i) => t === existingOptions[i])) {
      typeSelect.innerHTML = '<option value="">🏷️ Tipo</option>';
      types.forEach(type => {
        const o = document.createElement('option');
        o.value = type;
        o.textContent = type;
        typeSelect.appendChild(o);
      });
      updateCustomSelectOptions(typeSelect);
    }
  }
}

// FASE 3: Aplicar filtros avanzados
function applyAdvancedFilters() {
  let filtered = STATE.manuals.slice();
  
  const category = els.categoryFilter?.value || null;
  const role = els.roleFilter?.value || null;
  const type = els.typeFilter?.value || null;
  
  // Filtro de categoría
  if (category) {
    filtered = filtered.filter(m => m.category === category);
  }
  
  // Filtro de rol
  if (role) {
    filtered = filtered.filter(m => (m.role || 'General') === role);
  }
  
  // Filtro de tipo
  if (type) {
    filtered = filtered.filter(m => (m.type || 'Procedimiento') === type);
  }
  
  // FASE 4: Rastrear aplicación de filtros
  if (category || role || type) {
    trackEvent('filter_applied', { category, role, type, resultsCount: filtered.length });
  }
  
  // Ordenamiento
  if (els.orderFilter && els.orderFilter.value) {
    const sortBy = els.orderFilter.value;
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'recent':
          return new Date(b.created || 0) - new Date(a.created || 0);
        case 'updated':
          return new Date(b.updated || 0) - new Date(a.updated || 0);
        case 'title-asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'title-desc':
          return (b.title || '').localeCompare(a.title || '');
        default:
          return 0;
      }
    });
  }
  
  renderManualsList(filtered);
}

function renderManualsList(manuals){
  // FASE 14: Soportar llamadas sin argumentos (usar STATE.manuals)
  if (!manuals || manuals.length === undefined) {
    manuals = STATE.manuals || [];
  }
  console.log('[renderManualsList] Renderizando', manuals.length, 'manuales');
  
  // Usar ManualsPro si está disponible
  if (typeof ManualsPro !== 'undefined' && ManualsPro.refreshManuals) {
    console.log('[renderManualsList] Llamando a ManualsPro.refreshManuals()');
    ManualsPro.refreshManuals(manuals);
  } else {
    console.warn('[renderManualsList] ManualsPro no disponible, usando fallback');
    // FALLBACK: Mantener el código anterior si ManualsPro no carga
    renderManualsListFallback(manuals);
  }
}

/**
 * Fallback a la versión antigua de renderManualsList
 */
function renderManualsListFallback(manuals){
  // FASE 3: Update all filter options
  updateCategoryOptions();
  updateAdvancedFilterOptions();
  
  // Update manual count
  if (els.manualCount) {
    els.manualCount.textContent = manuals.length + ' manual' + (manuals.length !== 1 ? 'es' : '');
  }
  
  const container = document.getElementById('manualsList');
  container.innerHTML = '';
  const isAdmin = STATE.authUser && STATE.authUser.role === 'admin';
  const perms = STATE.authUser?.permissions || [];
  const canEditManuals = isAdmin || perms.includes('edit_manuals');
  
  if (!manuals || manuals.length === 0) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--cw-text-muted)"><p style="font-size:15px">No hay manuales disponibles</p></div>';
    return;
  }

  // Group by category for cleaner organization
  const byCategory = {};
  manuals.forEach(manual => {
    const cat = manual.category || 'Sin categoría';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(manual);
  });

  // Sort categories alphabetically
  const categories = Object.keys(byCategory).sort();

  categories.forEach(category => {
    const categoryManualsCount = byCategory[category].length;
    
    // Category section
    const categorySection = document.createElement('div');
    categorySection.style.marginBottom = '32px';
    
    // Category header
    const categoryHeader = document.createElement('div');
    categoryHeader.style.cssText = `
      display: flex;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--cw-border);
    `;
    
    const categoryTitle = document.createElement('h3');
    categoryTitle.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--cw-text);
      letter-spacing: -0.3px;
    `;
    categoryTitle.textContent = category;
    categoryHeader.appendChild(categoryTitle);
    
    const categoryBadge = document.createElement('span');
    categoryBadge.style.cssText = `
      font-size: 13px;
      padding: 4px 10px;
      background: var(--cw-primary);
      color: white;
      border-radius: 12px;
      font-weight: 500;
    `;
    categoryBadge.textContent = categoryManualsCount;
    categoryHeader.appendChild(categoryBadge);
    
    categorySection.appendChild(categoryHeader);
    
    // Cards grid
    const cardsGrid = document.createElement('div');
    cardsGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    `;
    
    byCategory[category].forEach(manual => {
      const card = document.createElement('div');
      card.style.cssText = `
        background: var(--cw-surface);
        border: 1px solid var(--cw-border);
        border-radius: 12px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        gap: 12px;
        ${!isAdmin ? 'opacity: 0.95;' : ''}
      `;
      
      // Hover effect
      card.addEventListener('mouseenter', () => {
        card.style.borderColor = 'var(--cw-primary)';
        card.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
        card.style.transform = 'translateY(-2px)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.borderColor = 'var(--cw-border)';
        card.style.boxShadow = 'none';
        card.style.transform = 'translateY(0)';
      });
      
      // Title
      const title = document.createElement('h4');
      title.style.cssText = `
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--cw-text);
        line-height: 1.4;
        letter-spacing: -0.3px;
        display: flex;
        align-items: center;
        gap: 8px;
      `;
      title.innerHTML = `
        ${manual.title || 'Sin título'}
        ${manual.is_private ? '<span style="font-size:14px;color:#ef4444">🔒</span>' : ''}
      `;
      card.appendChild(title);
      
      // Summary
      if (manual.summary) {
        const summary = document.createElement('p');
        summary.style.cssText = `
          margin: 0;
          font-size: 13px;
          color: var(--cw-text-muted);
          line-height: 1.5;
          height: 36px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        `;
        summary.textContent = manual.summary;
        card.appendChild(summary);
      }
      
      // Meta information (Steps + Role)
      const metaRow = document.createElement('div');
      metaRow.style.cssText = `
        display: flex;
        gap: 12px;
        align-items: center;
        margin-top: 8px;
        padding-top: 12px;
        border-top: 1px solid var(--cw-border-light);
      `;
      
      // Steps count
      const stepsCount = (manual.steps && manual.steps.length) || (manual.content && manual.content.length) || 0;
      const stepsInfo = document.createElement('div');
      stepsInfo.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--cw-text-muted);
      `;
      stepsInfo.innerHTML = `
        <span style="font-weight: 500; color: var(--cw-text);">${stepsCount}</span>
        <span>${stepsCount === 1 ? 'paso' : 'pasos'}</span>
      `;
      metaRow.appendChild(stepsInfo);
      
      // Role badge
      if (manual.role) {
        const roleBadge = document.createElement('div');
        roleBadge.style.cssText = `
          display: inline-block;
          font-size: 11px;
          padding: 3px 8px;
          background: rgba(255, 128, 51, 0.1);
          color: var(--cw-primary);
          border-radius: 6px;
          font-weight: 500;
          text-transform: capitalize;
        `;
        const roleMap = { 'admin': 'Administrador', 'agent': 'Agente', 'viewer': 'Visualizador' };
        roleBadge.textContent = roleMap[manual.role] || manual.role;
        metaRow.appendChild(roleBadge);
      }
      
      // Spacer to push button to right
      const spacer = document.createElement('div');
      spacer.style.flex = '1';
      metaRow.appendChild(spacer);
      
      // Open button
      const openBtn = document.createElement('button');
      openBtn.style.cssText = `
        background: var(--cw-primary);
        color: white;
        border: none;
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      `;
      openBtn.textContent = canEditManuals ? 'Abrir →' : 'Ver detalle →';
      openBtn.addEventListener('mouseenter', () => {
        openBtn.style.background = 'var(--cw-primary-dark, #e85500)';
        openBtn.style.transform = 'scale(1.05)';
      });
      openBtn.addEventListener('mouseleave', () => {
        openBtn.style.background = 'var(--cw-primary)';
        openBtn.style.transform = 'scale(1)';
      });
      openBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        openManual(manual.id);
      });
      metaRow.appendChild(openBtn);
      
      card.appendChild(metaRow);
      
      // Click anywhere on card to open
      card.addEventListener('click', () => openManual(manual.id));
      
      cardsGrid.appendChild(card);
    });
    
    categorySection.appendChild(cardsGrid);
    container.appendChild(categorySection);
  });
  
  // ========== FASE 1: Mejorar cards con badges ==========
  enhanceManualCards();
}

function openManual(id){
  try{
    // Mostrar spinner de carga
    showLoadingSpinner('Cargando manual...');
    
    console.debug('openManual llamado', id);
    
    // Buscar manual en STATE.manuals (con search helper si es necesario)
    let manual = STATE.manuals && STATE.manuals.find ? STATE.manuals.find(m => m.id === id) : null;
    
    if(!manual){
      console.warn('Manual no encontrado:', id, 'en', STATE.manuals?.length || 0, 'manuales');
      pushNotification({title:'Manual no encontrado', text:`ID: ${id}`});
      hideLoadingSpinner();
      return;
    }
    // Normalize: convert 'content' field to 'steps' for frontend
    // Ensure steps is properly set and is an array
    if (!manual.steps || !Array.isArray(manual.steps)) {
      const sourceArray = manual.content || manual.steps || [];
      // If it's still not an array (might be string), try to parse
      if (typeof sourceArray === 'string') {
        try {
          manual.steps = JSON.parse(sourceArray);
        } catch (e) {
          console.warn('[openManual] Error analizando pasos/contenido:', e);
          manual.steps = [];
        }
      } else {
        manual.steps = sourceArray;
      }
    }
    // apply manual overrides (admin edits) if present
    const overr = STATE.manualOverrides && STATE.manualOverrides[manual.id];
    if(overr){ manual = Object.assign({}, manual, overr); }
    STATE.current = manual;
    
    // Add to history
    addToHistory(id);
    renderHistory(); // Update history view in real-time
    
    // FASE 4: Rastrear vista de manual
    recordManualView(manual.id, manual.title, manual.category);
    // FASE 11: Registrar vista en analytics
    recordManualViewAnalytics(manual.id);
    // FASE 4: Actualizar dashboard analytics en tiempo real
    renderAnalyticsDashboard();
    
    // hide other list views so manual becomes the focused view
    const ml = document.getElementById('manualsListView'); if(ml) ml.classList.add('hidden');
    document.getElementById('welcome').classList.add('hidden');
    document.getElementById('adminToolbar')?.classList.add('hidden'); // Hide floating toolbar when viewing manual (guarded)
    els.manualView.classList.remove('hidden');
    if (els.manualTitle) els.manualTitle.textContent = manual.title;
    if (els.manualCategory) els.manualCategory.textContent = manual.category;
    if (els.manualVersion) els.manualVersion.textContent = `v${manual.version}`;
    
    renderSteps(manual);
    renderComments(manual.id);
    renderVersions(manual);
    
    // FASE 3: Cargar manuales relacionados
    try {
      const relatedManuals = getRelatedResults(STATE.manuals, manual.id);
      renderRelatedManuals(relatedManuals);
    } catch (err) {
      console.warn('[openManual] Error cargando manuales relacionados:', err);
    }
    
    // Reinicializar tabs después de renderizar
    try {
      setupManualTabs();
    } catch (err) {
      console.warn('[openManual] Error en setupManualTabs:', err);
    }
    
    // Ocultar spinner
    hideLoadingSpinner();
    
    // bring manual view into focus and top of viewport for clarity
    try{
      els.manualView.setAttribute('tabindex','-1');
      // focus without causing page scroll; avoid automatic smooth scrolling which can push viewport
      try{ els.manualView.focus({preventScroll:true}); }catch(e){ els.manualView.focus(); }
    }catch(e){/* ignore */}
  }catch(e){
    hideLoadingSpinner();
    console.error('Error abriendo manual', e);
    pushNotification({title:'Error al abrir manual', text: String(e.message||e)});
  }
}

// Exponer openManual globalmente para que ManualsPro pueda acceder
window.openManual = openManual;

function renderSteps(manual){
  // Defensive check
  if (!manual) {
    console.error('[renderSteps] Manual es nulo o indefinido');
    return;
  }
  
  if (!els.manualSteps) {
    console.error('[renderSteps] elemento manualSteps no encontrado');
    return;
  }
  
  // Clear old
  els.manualSteps.innerHTML = '';
  if(els.manualStepsNav) els.manualStepsNav.innerHTML = '';

  // Normalize: handle both 'steps' and 'content' fields from backend
  let stepsArray = manual.steps || manual.content || [];
  
  // If stepsArray is a string (JSON), try to parse it
  if (typeof stepsArray === 'string') {
    try {
      stepsArray = JSON.parse(stepsArray);
      console.log('[renderSteps] Contenido analizado desde cadena');
    } catch (e) {
      console.warn('[renderSteps] Error analizando cadena de pasos/contenido:', e);
      stepsArray = [];
    }
  }
  
  // Ensure it's always an array
  if (!Array.isArray(stepsArray)) {
    console.warn('[renderSteps] stepsArray no es un array:', typeof stepsArray);
    stepsArray = [];
  }
  
  const total = stepsArray.length;
  
  // console.debug('[renderSteps] Renderizando', total, 'pasos para manual:', manual.id, 'Tipo de pasos:', typeof stepsArray);
  
  if (total === 0) {
    els.manualSteps.innerHTML = '<div style="padding:40px;text-align:center;color:var(--cw-text-muted)"><p style="font-size:14px">No hay pasos en este manual</p></div>';
    return;
  }

  stepsArray.forEach((s, idx) => {
    const stepDiv = document.createElement('div');
    stepDiv.id = `step-${idx}`;
    stepDiv.style.cssText = `
      background: var(--cw-surface);
      border: 1px solid var(--cw-border);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      transition: all 0.2s ease;
    `;
    
    // Step header with number and title
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid var(--cw-border-light);
    `;
    
    // Step number circle
    const numberBadge = document.createElement('div');
    numberBadge.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--cw-primary);
      color: white;
      font-weight: 700;
      font-size: 16px;
      flex-shrink: 0;
    `;
    numberBadge.textContent = idx + 1;
    header.appendChild(numberBadge);
    
    // Title
    const titleEl = document.createElement('h3');
    titleEl.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--cw-text);
      flex: 1;
    `;
    titleEl.textContent = s.title || `Paso ${idx + 1}`;
    header.appendChild(titleEl);
    
    // Complete button
    const isDone = STATE.progress[manual.id] && STATE.progress[manual.id].includes(idx);
    const completeBtn = document.createElement('button');
    completeBtn.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      ${isDone 
        ? 'background: #10b981; color: white;' 
        : 'background: var(--cw-border-light); color: var(--cw-text-muted);'}
    `;
    completeBtn.innerHTML = isDone 
      ? '✓ Completado' 
      : '○ Marcar como completado';
    completeBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      toggleStepProgress(manual.id, idx, completeBtn);
    });
    completeBtn.addEventListener('mouseenter', () => {
      // Check current state instead of using closure variable
      const isCurrentlyDone = STATE.progress[manual.id] && STATE.progress[manual.id].includes(idx);
      if (!isCurrentlyDone) {
        completeBtn.style.background = 'var(--cw-primary)';
        completeBtn.style.color = 'white';
      }
    });
    completeBtn.addEventListener('mouseleave', () => {
      // Check current state instead of using closure variable
      const isCurrentlyDone = STATE.progress[manual.id] && STATE.progress[manual.id].includes(idx);
      if (!isCurrentlyDone) {
        completeBtn.style.background = 'var(--cw-border-light)';
        completeBtn.style.color = 'var(--cw-text-muted)';
      }
    });
    header.appendChild(completeBtn);
    
    stepDiv.appendChild(header);
    
    // Content area
    const contentArea = document.createElement('div');
    contentArea.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;
    
    // Image if exists
    if (s.image) {
      const imgContainer = document.createElement('div');
      imgContainer.style.cssText = `
        border-radius: 12px;
        overflow: hidden;
        background: var(--cw-bg);
        border: 1px solid var(--cw-border);
      `;
      const img = document.createElement('img');
      img.src = s.image;
      img.alt = s.title || 'Imagen del paso';
      img.style.cssText = `
        width: 100%;
        max-height: 400px;
        object-fit: cover;
        display: block;
        cursor: pointer;
        transition: transform 0.2s, filter 0.2s;
      `;
      img.addEventListener('mouseover', () => {
        img.style.filter = 'brightness(0.9)';
        img.style.transform = 'scale(1.02)';
      });
      img.addEventListener('mouseout', () => {
        img.style.filter = 'brightness(1)';
        img.style.transform = 'scale(1)';
      });
      img.addEventListener('click', () => openImageZoom(s.image, s.title || 'Imagen del paso'));
      imgContainer.appendChild(img);
      contentArea.appendChild(imgContainer);
    }
    
    // FASE 8: Múltiples imágenes del PDF
    if (s.images && Array.isArray(s.images) && s.images.length > 0) {
      const imagesGrid = document.createElement('div');
      imagesGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
        margin-top: 12px;
      `;
      
      s.images.forEach((imgSrc, imgIdx) => {
        const imgContainer = document.createElement('div');
        imgContainer.style.cssText = `
          border-radius: 8px;
          overflow: hidden;
          background: var(--cw-bg);
          border: 1px solid var(--cw-border);
          cursor: pointer;
          transition: all 0.2s;
        `;
        
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = `${s.title || 'Paso'} - Imagen ${imgIdx + 1}`;
        img.style.cssText = `
          width: 100%;
          height: 180px;
          object-fit: cover;
          display: block;
          transition: transform 0.2s, filter 0.2s;
        `;
        
        imgContainer.addEventListener('mouseover', () => {
          img.style.filter = 'brightness(0.9)';
          img.style.transform = 'scale(1.03)';
        });
        imgContainer.addEventListener('mouseout', () => {
          img.style.filter = 'brightness(1)';
          img.style.transform = 'scale(1)';
        });
        imgContainer.addEventListener('click', () => openImageZoom(imgSrc, `${s.title || 'Paso'} - Imagen ${imgIdx + 1}`));
        
        imgContainer.appendChild(img);
        imagesGrid.appendChild(imgContainer);
      });
      
      contentArea.appendChild(imagesGrid);
    }
    
    // Step content (HTML)
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = `
      font-size: 15px;
      line-height: 1.6;
      color: var(--cw-text);
    `;
    contentDiv.innerHTML = s.content || '';
    // Sanitize content - remove potentially dangerous attributes
    contentDiv.querySelectorAll('[onclick], [onload], [onerror], script').forEach(el => {
      if (el.tagName === 'SCRIPT') el.remove();
      else el.removeAttribute('onclick');
    });
    contentArea.appendChild(contentDiv);
    
    // Edit button (for admins)
    if (STATE.authUser && STATE.authUser.role === 'admin') {
      const editBtn = document.createElement('button');
      editBtn.style.cssText = `
        align-self: flex-start;
        padding: 8px 16px;
        background: transparent;
        border: 1px solid var(--cw-primary);
        color: var(--cw-primary);
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-top: 8px;
      `;
      editBtn.textContent = '✏️ Editar paso';
      editBtn.addEventListener('mouseenter', () => {
        editBtn.background = 'var(--cw-primary)';
        editBtn.color = 'white';
        editBtn.style.background = 'var(--cw-primary)';
        editBtn.style.color = 'white';
      });
      editBtn.addEventListener('mouseleave', () => {
        editBtn.style.background = 'transparent';
        editBtn.style.color = 'var(--cw-primary)';
      });
      editBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        openEditStepModal(manual, idx, s);
      });
      contentArea.appendChild(editBtn);
    }
    
    stepDiv.appendChild(contentArea);
    els.manualSteps.appendChild(stepDiv);

    // Navigation button
    if (els.manualStepsNav) {
      const navBtn = document.createElement('button');
      navBtn.type = 'button';
      navBtn.dataset.idx = idx;
      navBtn.style.cssText = `
        width: 100%;
        padding: 12px;
        text-align: left;
        border: 1px solid var(--cw-border);
        border-radius: 8px;
        background: var(--cw-surface);
        color: var(--cw-text);
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s ease;
        margin-bottom: 8px;
      `;
      navBtn.innerHTML = `<strong>${idx + 1}.</strong> ${escapeHtml(s.title || `Paso ${idx + 1}`)}`;
      navBtn.addEventListener('mouseenter', () => {
        navBtn.style.background = 'var(--cw-primary)';
        navBtn.style.color = 'white';
        navBtn.style.borderColor = 'var(--cw-primary)';
      });
      navBtn.addEventListener('mouseleave', () => {
        navBtn.style.background = 'var(--cw-surface)';
        navBtn.style.color = 'var(--cw-text)';
        navBtn.style.borderColor = 'var(--cw-border)';
      });
      navBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        scrollToStep(idx, true);
        updateNavActive(idx);
        window.location.hash = `manual=${manual.id}&step=${idx}`;
      });
      els.manualStepsNav.appendChild(navBtn);
    }
  });

  // Helper: scroll to step
  function scrollToStep(idx, smooth) {
    try {
      const root = document.querySelector('.main') || window;
      const target = document.getElementById(`step-${idx}`);
      if (!target) return;
      const manualHeader = document.querySelector('#manualView .manual-header');
      const headerOffset = manualHeader ? manualHeader.getBoundingClientRect().height + 8 : 0;
      if (root === window) {
        const top = target.getBoundingClientRect().top + window.scrollY - headerOffset - 8;
        window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
      } else {
        const rootRect = root.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const offset = (targetRect.top - rootRect.top) + root.scrollTop - headerOffset - 8;
        root.scrollTo({ top: offset, behavior: smooth ? 'smooth' : 'auto' });
      }
    } catch (e) {
      console.warn('error desplazando a paso', e);
    }
  }

  // Show first step
  setTimeout(() => scrollToStep(0, false), 0);

  // Progress bar
  const progContainerSelector = '#manualView .manual-header';
  const mh = document.querySelector(progContainerSelector);
  if (mh) {
    let prog = mh.querySelector('.manual-progress');
    if (!prog) {
      prog = document.createElement('div');
      prog.className = 'manual-progress';
      const inner = document.createElement('i');
      prog.appendChild(inner);
      mh.appendChild(prog);
    }
    const completed = (STATE.progress[manual.id] && STATE.progress[manual.id].length) || 0;
    const pct = total ? Math.round((completed / total) * 100) : 0;
    const inner = prog.querySelector('i');
    if (inner) inner.style.width = pct + '%';
  }

  // Nav activation
  try {
    function updateNavActive(idx) {
      document.querySelectorAll('#manualStepsNav button').forEach(b => {
        b.classList.toggle('active', idx !== null && parseInt(b.dataset.idx, 10) === idx);
      });
      if (idx !== null) {
        history.replaceState(null, '', `#manual=${manual.id}&step=${idx}`);
      }
    }
    updateNavActive(0);
  } catch (e) {
    console.warn('error configurando activación nav', e);
  }
}

function toggleStepProgress(manualId, idx, btn){
  STATE.progress[manualId] = STATE.progress[manualId] || [];
  const arr = STATE.progress[manualId];
  const i = arr.indexOf(idx);
  const svgCheck = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const svgMark = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  
  if(i === -1) { 
    // Mark as completed
    arr.push(idx);
    if(btn) {
      btn.classList.add('done-true');
      btn.innerHTML = svgCheck + '<span>Completado</span>';
      // Update inline styles to show completed state
      btn.style.background = '#10b981';
      btn.style.color = 'white';
    }
  } else { 
    // Mark as incomplete
    arr.splice(i,1);
    if(btn) {
      btn.classList.remove('done-true');
      btn.innerHTML = svgMark + '<span>Marcar como completado</span>';
      // Update inline styles to show incomplete state
      btn.style.background = 'var(--cw-border-light)';
      btn.style.color = 'var(--cw-text-muted)';
    }
  }
  
  localStorage.setItem('cw:progress', JSON.stringify(STATE.progress));
  // FASE 4: Actualizar dashboard analytics cuando se marca un paso
  renderAnalyticsDashboard();
}

function showQr(){
  if(!STATE.current) return;
  const url = location.origin + location.pathname.replace(/\/[^/]*$/,'') + `html/index.html#manual=${STATE.current.id}`;
  // prefer client-side generation if library available
  if(window.QRCode && QRCode.toDataURL){
    QRCode.toDataURL(url, {width:240}).then(dataUrl=>{
      els.qrImage.src = dataUrl; els.qrModal.classList.remove('hidden');
    }).catch(()=>{ fallbackQr(url); });
  } else {
    fallbackQr(url);
  }
}

function fallbackQr(url){
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`;
  els.qrImage.src = qrUrl; els.qrModal.classList.remove('hidden');
}

function renderComments(manualId){
  if(!els.commentsList) {
    console.warn('[renderComments] elemento commentsList no encontrado');
    return;
  }
  
  const list = STATE.comments[manualId]||[];
  els.commentsList.innerHTML = '';
  if(!list.length) els.commentsList.textContent = 'Sin comentarios.';
  list.forEach((c, idx)=>{
    const d = document.createElement('div'); 
    d.className='comment';
    d.style.display = 'flex';
    d.style.justifyContent = 'space-between';
    d.style.alignItems = 'flex-start';
    d.style.gap = '12px';
    
    const text = document.createElement('div');
    text.textContent = `${c.by||'Agente'}: ${c.text}`;
    text.style.flex = '1';
    d.appendChild(text);
    
    // Agregar botón de eliminar solo para admins
    const user = STATE.authUser;
    if(user && user.role === 'admin'){
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'icon-btn';
      deleteBtn.title = 'Eliminar comentario';
      deleteBtn.innerHTML = '✕';
      deleteBtn.style.fontSize = '14px';
      deleteBtn.style.color = 'var(--cw-danger)';
      deleteBtn.style.padding = '4px 8px';
      deleteBtn.addEventListener('click', async (e)=>{
        e.stopPropagation();
        if(await showConfirm('Eliminar Comentario', '¿Eliminar este comentario?')){
          STATE.comments[manualId].splice(idx, 1);
          localStorage.setItem('cw:comments', JSON.stringify(STATE.comments));
          renderComments(manualId);
          
          // FASE 6: Notificar que se borró comentario
          pushNotificationToPanel({
            type: 'comment_deleted',
            icon: '🗑️',
            title: 'Comentario Eliminado',
            message: `Comentario en ${STATE.current?.title || 'manual'}`,
            toastDuration: 3000,
            relatedData: { manual: STATE.current }
          });
        }
      });
      d.appendChild(deleteBtn);
    }
    
    els.commentsList.appendChild(d);
  });
}

function addComment(){
  if(!STATE.current) return;
  // Only allow comments for agents (agentMode) or admins
  const user = STATE.authUser;
  if(!(STATE.agentMode || (user && user.role === 'admin'))){
    showAlert('Permisos Insuficientes', 'Activa el modo agente para poder comentar, o inicia sesión como administrador.');
    return;
  }
  const text = els.commentInput.value.trim(); if(!text) return;
  STATE.comments[STATE.current.id] = STATE.comments[STATE.current.id]||[];
  const by = (STATE.authUser && STATE.authUser.name) || STATE.agentName || 'Agente';
  STATE.comments[STATE.current.id].push({by, text,at:Date.now()});
  localStorage.setItem('cw:comments', JSON.stringify(STATE.comments));
  els.commentInput.value = '';
  renderComments(STATE.current.id);
  
  // FASE 6: Notificar que se añadió comentario
  pushNotificationToPanel({
    type: 'comment_added',
    icon: '💬',
    title: 'Comentario Añadido',
    message: `Comentario en ${STATE.current.title}`,
    toastDuration: 3000,
    relatedData: { manual: STATE.current }
  });
}

function renderVersions(manual){
  if(!els.versionsList) {
    console.warn('[renderVersions] elemento versionsList no encontrado');
    return;
  }
  if(!manual || !manual.id) {
    console.warn('[renderVersions] manual es nulo o indefinido');
    return;
  }
  
  // Usar versiones del manual actual
  const versions = manual.versions || [];
  
  if (versions.length === 0) {
    els.versionsList.innerHTML = '<p style="color: var(--cw-text-muted);">Sin historial de versiones</p>';
    return;
  }
  
  els.versionsList.innerHTML = '';
  const container = document.createElement('div');
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 12px;
  `;
  
  versions.forEach((v, idx) => {
    const item = document.createElement('div');
    item.style.cssText = `
      padding: 12px;
      border: 1px solid var(--cw-border);
      border-radius: var(--radius);
      background: var(--cw-surface-alt);
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;
      flex-wrap: wrap;
    `;
    
    const vNum = document.createElement('span');
    vNum.textContent = `v${v.version}`;
    vNum.style.cssText = `
      font-weight: 600;
      color: var(--cw-primary);
      background: rgba(255, 128, 51, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
    `;
    header.appendChild(vNum);
    
    const date = document.createElement('span');
    const dateObj = new Date(v.date);
    date.textContent = dateObj.toLocaleDateString('es-ES');
    date.style.cssText = `
      font-size: 12px;
      color: var(--cw-text-muted);
    `;
    header.appendChild(date);
    
    if (v.note) {
      const note = document.createElement('span');
      note.textContent = `(${v.note})`;
      note.style.cssText = `
        font-size: 12px;
        color: var(--cw-text-muted);
      `;
      header.appendChild(note);
    }
    
    item.appendChild(header);
    container.appendChild(item);
  });
  
  els.versionsList.appendChild(container);
}

// FASE 3: Renderizar manuales relacionados
function renderRelatedManuals(relatedManuals) {
  const section = document.getElementById('relatedManualsSection');
  const list = document.getElementById('relatedManualsList');
  
  if (!section || !list) {
    console.warn('[renderRelatedManuals] elementos no encontrados');
    return;
  }
  
  // Limpiar lista
  list.innerHTML = '';
  
  // Si no hay manuales relacionados, ocultar sección
  if (!relatedManuals || relatedManuals.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  // Mostrar sección
  section.style.display = 'block';
  
  // Renderizar cada manual relacionado
  relatedManuals.forEach(manual => {
    const card = document.createElement('div');
    card.className = 'manual-card';
    card.role = 'listitem';
    card.style.cursor = 'pointer';
    
    // FASE 1: Badges de Nuevo/Actualizado
    let badges = '';
    if (isNewManual(manual)) {
      badges += '<span class="badge badge-new" title="Manual creado hace menos de 7 días">Nuevo</span>';
    }
    if (isUpdatedManual(manual)) {
      badges += '<span class="badge badge-updated" title="Manual actualizado hace menos de 2 semanas">Actualizado</span>';
    }
    
    const content = `
      <div class="manual-card-header">
        <h3 class="manual-card-title">${escapeHtml(manual.title)}</h3>
        ${badges}
      </div>
      <p class="manual-card-category">${escapeHtml(manual.category)}</p>
      <p class="manual-card-description">${manual.description ? escapeHtml(manual.description.substring(0, 100)) + '...' : 'Sin descripción'}</p>
      <div class="manual-card-meta">
        <span class="meta-role">👤 ${escapeHtml(manual.role || 'General')}</span>
        <span class="meta-type">🏷️ ${escapeHtml(manual.type || 'Procedimiento')}</span>
      </div>
    `;
    
    card.innerHTML = content;
    
    // Event listeners para abrir manual
    card.addEventListener('click', () => {
      openManual(manual.id);
    });
    
    // Accesibilidad: Enter/Space para abrir
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openManual(manual.id);
      }
    });
    
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${manual.title} - ${manual.category}`);
    
    list.appendChild(card);
  });
  
  console.debug(`[renderRelatedManuals] Renderizados ${relatedManuals.length} manuales relacionados`);
}

function renderFaqs(faqs){
  const container = document.getElementById('faqsList'); if(!container) return; container.innerHTML = '';
  const list = (faqs||[]).slice();
  const isAdmin = STATE.authUser && STATE.authUser.role === 'admin';
  if(list.length === 0){
    container.innerHTML = '<div class="empty-state">No hay FAQs aún. Usa "Crear FAQ" para añadir preguntas frecuentes.</div>';
    return;
  }
  list.forEach((f, idx)=>{
    const item = document.createElement('div'); item.className = 'faq-item'; item.dataset.id = f.id || `faq-${idx}`;
    if(!isAdmin) item.style.opacity = '0.95';
    const q = document.createElement('h5'); q.textContent = f.q || 'Pregunta sin título';
    const a = document.createElement('div'); a.className = 'faq-answer muted'; a.style.display = 'none'; a.innerHTML = f.a || '';
    // toggle
    item.addEventListener('click', (ev)=>{ if(ev.target.tagName.toLowerCase() === 'button') return; a.style.display = a.style.display === 'none' ? 'block' : 'none'; });

    item.appendChild(q);
    // short preview
    if(f.a && String(f.a).length > 200){
      const preview = document.createElement('p'); preview.textContent = String(f.a).slice(0,200) + '...'; preview.style.color = 'var(--cw-text-muted)'; item.appendChild(preview);
    } else if(f.a){
      const preview = document.createElement('p'); preview.textContent = f.a; preview.style.color = 'var(--cw-text-muted)'; item.appendChild(preview);
    }

    // append answer
    item.appendChild(a);

    // admin controls - only render for admins
    if(isAdmin){
      const controls = document.createElement('div'); controls.style.display = 'flex'; controls.style.gap = '8px'; controls.style.marginTop = '8px';
      const editBtn = document.createElement('button'); editBtn.className = 'small-btn'; editBtn.textContent = 'Editar'; editBtn.type = 'button';
      editBtn.addEventListener('click', (ev)=>{ ev.stopPropagation(); openFaqModal(f); });
      const delBtn = document.createElement('button'); delBtn.className = 'secondary'; delBtn.textContent = 'Eliminar'; delBtn.type = 'button';
      delBtn.addEventListener('click', async (ev)=>{ ev.stopPropagation(); if(await showConfirm('Eliminar FAQ', '¿Eliminar esta FAQ?')) deleteFaq(f.id); });
      controls.appendChild(editBtn); controls.appendChild(delBtn);
      const ctrlWrap = document.createElement('div'); ctrlWrap.style.display='flex'; ctrlWrap.style.justifyContent='flex-end'; ctrlWrap.appendChild(controls);
      item.appendChild(ctrlWrap);
    }
    
    container.appendChild(item);
  });
}

// Escape regex special chars for safe search
function escapeRegExp(string){
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Highlight occurrences of query inside an element's text nodes (simple implementation)
function highlightText(el, query){
  if(!el || !query) return;
  const re = new RegExp('('+escapeRegExp(query)+')', 'ig');
  // Walk element children and replace text nodes
  function walk(node){
    if(node.nodeType === 3){ // text
      if(re.test(node.nodeValue)){
        const span = document.createElement('span');
        span.innerHTML = node.nodeValue.replace(re, '<mark class="cw-hl">$1</mark>');
        node.parentNode.replaceChild(span, node);
      }
    } else if(node.nodeType === 1 && node.childNodes && !['SCRIPT','STYLE','MARK'].includes(node.tagName)){
      Array.from(node.childNodes).forEach(walk);
    }
  }
  walk(el);
}

// Filter FAQs by query (renders filtered list and highlights matches)
function filterFaqs(query){
  query = (query||'').trim();
  if(!query){ renderFaqs(STATE.faqs || []); return; }
  const q = query.toLowerCase();
  const filtered = (STATE.faqs||[]).filter(f => {
    return (String(f.q||'')+ ' ' + String(f.a||'')).toLowerCase().indexOf(q) !== -1;
  });
  renderFaqs(filtered);
  // highlight matches in rendered DOM
  setTimeout(()=>{
    const container = document.getElementById('faqsList');
    if(!container) return;
    Array.from(container.querySelectorAll('.faq-item')).forEach(item=>{
      const qEl = item.querySelector('h5');
      const pEl = item.querySelector('p');
      const aEl = item.querySelector('.faq-answer');
      try{ highlightText(qEl, query); }catch(e){}
      try{ if(pEl) highlightText(pEl, query); }catch(e){}
      try{ if(aEl) highlightText(aEl, query); }catch(e){}
    });
  }, 30);
}

// Export all localStorage keys that start with 'cw:' as a JSON file
function exportAllData(){
  const out = {};
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(k && k.indexOf('cw:') === 0){
      try{ out[k] = JSON.parse(localStorage.getItem(k)); }catch(e){ out[k] = localStorage.getItem(k); }
    }
  }
  const data = JSON.stringify(out, null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `callcenter-data-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  pushNotification({title:'Exportación completa', text: 'Se ha descargado un respaldo de los datos locales.'});
}

/* Custom Alert and Confirm dialogs */
function showAlert(title, message = ''){
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-content" style="max-width:400px;animation:slideInUp 0.3s ease">
        <h4 style="margin-bottom:12px">${escapeHtml(title)}</h4>
        <p style="color:var(--cw-text-muted);margin-bottom:16px;white-space:pre-wrap">${escapeHtml(message)}</p>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="primary" style="padding:8px 16px">Aceptar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const btn = modal.querySelector('button');
    btn.addEventListener('click', () => {
      modal.remove();
      resolve();
    });
    modal.addEventListener('click', (e) => {
      if(e.target === modal) {
        modal.remove();
        resolve();
      }
    });
    btn.focus();
  });
}

function showConfirm(title, message = ''){
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-content" style="max-width:400px;animation:slideInUp 0.3s ease">
        <h4 style="margin-bottom:12px">${escapeHtml(title)}</h4>
        <p style="color:var(--cw-text-muted);margin-bottom:16px;white-space:pre-wrap">${escapeHtml(message)}</p>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="secondary cancel-btn" style="padding:8px 16px">Cancelar</button>
          <button class="primary confirm-btn" style="padding:8px 16px">Aceptar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const cancelBtn = modal.querySelector('.cancel-btn');
    const confirmBtn = modal.querySelector('.confirm-btn');
    
    const close = (result) => {
      modal.remove();
      resolve(result);
    };
    
    cancelBtn.addEventListener('click', () => close(false));
    confirmBtn.addEventListener('click', () => close(true));
    modal.addEventListener('click', (e) => {
      if(e.target === modal) close(false);
    });
    confirmBtn.focus();
  });
}

// Mostrar modal con contenido HTML (sin escapar)
function showModal(title, htmlContent) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-content" style="max-width:600px;animation:slideInUp 0.3s ease">
        <h4 style="margin-bottom:12px;color:var(--cw-text)">${escapeHtml(title)}</h4>
        <div style="max-height:70vh;overflow-y:auto">
          ${htmlContent}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Permitir cerrar con clic en el fondo
    modal.addEventListener('click', (e) => {
      if(e.target === modal) {
        modal.remove();
        resolve();
      }
    });
  });
}

/* Notifications (simple local in-app system) */
function pushNotification(n){
  const list = JSON.parse(localStorage.getItem('cw:notifs')||'[]');
  list.unshift({id:Date.now(),...n});
  localStorage.setItem('cw:notifs', JSON.stringify(list.slice(0,50)));
  renderNotifications();
}

function renderNotifications(){
  // FASE 6: Usar notificaciones del sistema
  const el = document.getElementById('notificationsList');
  const badge = document.getElementById('notifCount');
  
  if(!STATE.notifications || STATE.notifications.length === 0){ 
    el.innerHTML = '<div class="notif-empty" style="padding:20px;text-align:center;color:var(--cw-text-muted)">No hay notificaciones.</div>'; 
    badge.classList.add('hidden'); 
    return; 
  }
  
  badge.classList.remove('hidden'); 
  badge.textContent = STATE.unreadNotifications > 9 ? '9+' : String(STATE.unreadNotifications);
  el.innerHTML = '';
  
  STATE.notifications.forEach((n, index) => {
    const div = document.createElement('div'); 
    div.className = `notif panel ${n.read ? '' : 'unread'}`;
    div.style.cssText = `
      padding: 12px;
      border-left: 4px solid ${n.read ? 'var(--cw-border)' : 'var(--cw-primary)'};
      background: ${n.read ? 'var(--cw-surface-alt)' : 'rgba(255, 128, 51, 0.05)'};
      margin-bottom: 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: var(--transition);
    `;
    
    const typeIcons = {
      manual_updated: '📝',
      new_manual: '✨',
      diagram_updated: '🌳',
      password_changed: '🔒'
    };
    
    const timestamp = new Date(n.timestamp).toLocaleString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:start; gap:12px;">
        <div style="display:flex; gap:8px; align-items:start; flex:1;">
          <span style="font-size:18px; flex-shrink:0;">${typeIcons[n.type] || '📢'}</span>
          <div style="flex:1; min-width:0;">
            <strong style="color:var(--cw-text);">${escapeHtml(n.title)}</strong>
            <div style="color:var(--cw-text-muted);font-size:13px;margin-top:4px;line-height:1.3;">${escapeHtml(n.message || '')}</div>
            <div style="color:var(--cw-text-muted);font-size:11px;margin-top:6px;">${timestamp}</div>
          </div>
        </div>
        <button class="small-btn" style="flex-shrink:0;background:var(--cw-primary);color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:12px;transition:var(--transition);" data-notif-idx="${index}">
          ${n.read ? 'Leído' : 'Leer'}
        </button>
      </div>
    `;
    
    div.addEventListener('mouseenter', () => div.style.background = n.read ? 'var(--cw-surface)' : 'rgba(255, 128, 51, 0.1)');
    div.addEventListener('mouseleave', () => div.style.background = n.read ? 'var(--cw-surface-alt)' : 'rgba(255, 128, 51, 0.05)');
    
    // Agregar event listener al botón
    const btn = div.querySelector('button');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      markNotificationAsRead(index);
      renderNotifications();
    });
    
    el.appendChild(div);
  });
}

/**
 * FUNCIÓN MEJORADA DE SANITIZACIÓN - Escapar HTML
 * IMPORTANTE: Esta función solo escapa caracteres especiales
 * No es un reemplazo de sanitizer.js para casos complejos
 * 
 * Usa window.Sanitizer.escapeHTML() cuando esté disponible
 */
function escapeHtml(str){
  // Usar sanitizer.js si está disponible
  if (typeof window !== 'undefined' && window.Sanitizer && window.Sanitizer.escapeHTML) {
    return window.Sanitizer.escapeHTML(str);
  }
  
  // Fallback a sanitización básica
  if (!str) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  return String(str).replace(/[&<>"'\/]/g, (char) => map[char]);
}

// Open image zoom modal
function openImageZoom(imageSrc, imageAlt = 'Imagen') {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:10000;overflow:hidden;padding:20px';
  
  const container = document.createElement('div');
  container.style.cssText = 'position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:auto';
  
  const img = document.createElement('img');
  img.src = imageSrc;
  img.alt = imageAlt;
  img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;cursor:zoom-in;transition:transform 0.2s';
  
  let scale = 1;
  const minScale = 1;
  const maxScale = 4;
  
  // Zoom con scroll
  img.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    scale = Math.max(minScale, Math.min(maxScale, scale + delta));
    img.style.transform = `scale(${scale})`;
    img.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
  });
  
  // Pinch zoom (touchscreen)
  let lastDistance = 0;
  img.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      if (lastDistance > 0) {
        const delta = distance - lastDistance;
        scale = Math.max(minScale, Math.min(maxScale, scale + delta * 0.01));
        img.style.transform = `scale(${scale})`;
      }
      lastDistance = distance;
    }
  }, { passive: false });
  
  img.addEventListener('touchend', () => {
    lastDistance = 0;
  });
  
  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = 'position:absolute;top:20px;right:20px;background:rgba(255,255,255,0.2);border:none;color:white;padding:12px 16px;border-radius:8px;cursor:pointer;font-weight:700;font-size:24px;transition:all 0.2s;z-index:10001;backdrop-filter:blur(5px);border:1px solid rgba(255,255,255,0.3)';
  closeBtn.addEventListener('mouseover', () => closeBtn.style.background = 'rgba(255,255,255,0.3)');
  closeBtn.addEventListener('mouseout', () => closeBtn.style.background = 'rgba(255,255,255,0.2)');
  closeBtn.addEventListener('click', () => modal.remove());
  
  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  // Close with Escape key - prevent from bubbling to manual close handler
  // Use capture phase (true) so this executes BEFORE document listener
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      modal.remove();
    }
  }, true);
  
  container.appendChild(img);
  modal.appendChild(container);
  modal.appendChild(closeBtn);
  document.body.appendChild(modal);
}

// helper to group items by key
function groupBy(arr, key){
  const obj = {};
  arr.forEach(item => {
    const k = item[key] || 'Other';
    if(!obj[k]) obj[k] = [];
    obj[k].push(item);
  });
  return obj;
}

// when loading with #manual=id open automatically
function handleHashOpen(){
  // Robust parsing of hash params like: #manual=ID&step=2
  const raw = location.hash.replace(/^#/, '');
  if(!raw) return;
  const parts = raw.split('&').map(p=>p.split('='));
  const params = {};
  parts.forEach(([k,v])=>{ if(k) params[k] = v ? decodeURIComponent(v) : ''; });
  if(params.manual){ openManual(params.manual); }
}

// History management
function addToHistory(manualId){
  const manual = STATE.manuals && STATE.manuals.find ? STATE.manuals.find(m => m.id === manualId) : null;
  if(!manual) return;
  
  const now = Date.now();
  STATE.history = STATE.history.filter(h => h.id !== manualId);
  STATE.history.unshift({id: manualId, title: manual.title, timestamp: now});
  STATE.history = STATE.history.slice(0, 20); // Keep last 20
  localStorage.setItem('cw:history', JSON.stringify(STATE.history));
}

// Record manual view for tracking/analytics
function recordManualView(manualId, title, category) {
  try {
    // Simplemente registrar en el estado local - los analytics se manejan en recordManualViewAnalytics
    if (!STATE.manualViews) {
      STATE.manualViews = {};
    }
    STATE.manualViews[manualId] = {
      title,
      category,
      lastViewed: new Date().toISOString(),
      viewCount: (STATE.manualViews[manualId]?.viewCount || 0) + 1
    };
  } catch (err) {
    console.error('[recordManualView] Error:', err);
  }
}

// Add diagram to history
function addDiagramToHistory(diagramId){
  const diagram = STATE.fibraDiagrams.find(d => d.id === diagramId);
  if(!diagram) return;
  
  const now = Date.now();
  STATE.history = STATE.history.filter(h => h.id !== diagramId);
  STATE.history.unshift({id: diagramId, title: diagram.title, timestamp: now, type: 'diagram'});
  STATE.history = STATE.history.slice(0, 20); // Keep last 20
  localStorage.setItem('cw:history', JSON.stringify(STATE.history));
}

function renderHistory(){
  if(!els.historyList) return;
  
  if(!STATE.history || STATE.history.length === 0){
    els.historyList.innerHTML = '<div class="empty-state"><p>Sin historial. Los manuales y diagramas visitados aparecerán aquí.</p></div>';
    return;
  }
  
  // Filter history to only show items that still exist (manuals or diagrams)
  const validHistory = STATE.history.filter(h => {
    const isManual = STATE.manuals.some(m => m.id === h.id);
    const isDiagram = STATE.fibraDiagrams.some(d => d.id === h.id);
    return isManual || isDiagram;
  });
  
  // Sort by timestamp descending (most recent first)
  validHistory.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  
  els.historyList.innerHTML = '';
  
  if(validHistory.length === 0){
    els.historyList.innerHTML = '<div class="empty-state"><p>Sin historial. Los manuales y diagramas visitados aparecerán aquí.</p></div>';
    return;
  }
  
  validHistory.forEach(h => {
    const card = document.createElement('div');
    card.className = 'manual-card';
    card.style.cursor = 'pointer';
    
    // Determine if it's a diagram or manual and set icon accordingly
    const isDiagram = h.type === 'diagram';
    const icon = isDiagram ? '🌳' : '📖';
    
    // Get diagram details if it's a diagram
    let categoryBadge = '';
    if(isDiagram) {
      const diagram = STATE.fibraDiagrams.find(d => d.id === h.id);
      if(diagram) {
        const parent = diagram.parentCategory || 'GPON';
        const sub = diagram.subcategory || 'Internet';
        const parentEmoji = parent === 'GPON' ? '🌐' : '📡';
        const subEmoji = sub === 'Internet' ? '🌍' : '☎️';
        categoryBadge = `<div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">
          <span style="font-size:11px;padding:4px 8px;background:rgba(16, 185, 129, 0.1);border:1px solid rgba(16, 185, 129, 0.3);border-radius:12px;color:#10b981;font-weight:600">${parentEmoji} ${parent}</span>
          <span style="font-size:11px;padding:4px 8px;background:rgba(59, 130, 246, 0.1);border:1px solid rgba(59, 130, 246, 0.3);border-radius:12px;color:#2563eb;font-weight:600">${subEmoji} ${sub}</span>
        </div>`;
      }
    }
    
    card.innerHTML = `
      <div>
        <h5 class="manual-card-title">${icon} ${escapeHtml(h.title)}</h5>
        <p style="color: var(--cw-text-muted); font-size: 12px; margin: 0;">
          ${new Date(h.timestamp).toLocaleDateString('es-ES', {hour: '2-digit', minute: '2-digit'})}
        </p>
        ${categoryBadge}
      </div>
      <div class="manual-card-actions">
        <button class="card-open" aria-label="Abrir">→</button>
      </div>
    `;
    
    // Open the appropriate item
    card.addEventListener('click', () => {
      if(isDiagram) {
        const diagram = STATE.fibraDiagrams.find(d => d.id === h.id);
        if(diagram) openDiagramViewer(diagram);
      } else {
        openManual(h.id);
      }
    });
    
    els.historyList.appendChild(card);
  });
}

// FASE 4: Renderizar dashboard de analytics

// Theme management
function applyTheme(){
  if(STATE.darkMode){
    document.documentElement.style.setProperty('--cw-bg', '#0f1721');
    document.documentElement.style.setProperty('--cw-surface', '#1a2230');
    document.documentElement.style.setProperty('--cw-surface-alt', '#242d38');
    document.documentElement.style.setProperty('--cw-text', '#f0f4f8');
    document.documentElement.style.setProperty('--cw-text-muted', '#9ca3af');
    document.documentElement.style.setProperty('--cw-border', '#3a444f');
    document.documentElement.style.setProperty('--cw-border-light', 'rgba(255, 255, 255, 0.06)');
  } else {
    document.documentElement.style.setProperty('--cw-bg', '#f8f9fb');
    document.documentElement.style.setProperty('--cw-surface', '#ffffff');
    document.documentElement.style.setProperty('--cw-surface-alt', '#f5f7fa');
    document.documentElement.style.setProperty('--cw-text', '#0f1721');
    document.documentElement.style.setProperty('--cw-text-muted', '#6b7280');
    document.documentElement.style.setProperty('--cw-border', '#e5e7eb');
    document.documentElement.style.setProperty('--cw-border-light', 'rgba(15, 23, 42, 0.06)');
  }
}

function applyFontSize(){
  // Keep default font size - no changes needed
}

// Data usage calculation
function updateDataUsage(){
  if(!els.dataUsage) return;
  
  let totalSize = 0;
  for(let key in localStorage){
    if(key.startsWith('cw:')){
      totalSize += localStorage[key].length;
    }
  }
  
  const sizeKB = (totalSize / 1024).toFixed(2);
  els.dataUsage.textContent = sizeKB + ' KB';
}

// Hash a password using Web Crypto (SHA-256) and return hex string
// Hashing moved to backend (bcrypt)

// Show/hide login modal and manage body scroll
function showLoginModal(){
  if(!els.loginModal) return;
  els.loginModal.classList.remove('hidden');
  // ensure modal is visible at top and prevent background scroll
  try{ window.scrollTo(0,0); document.documentElement.scrollTop = 0; document.body.scrollTop = 0; }catch(e){}
  document.body.style.overflow = 'hidden';
  // hide sidebar and header top-actions while login is visible
  document.querySelectorAll('.top-actions').forEach(el => el.classList.add('hidden'));
}

function hideLoginModal(){
  if(!els.loginModal) return;
  els.loginModal.classList.add('hidden');
  document.body.style.overflow = '';
  // restore sidebar/header top-actions depending on auth
  document.querySelectorAll('.top-actions').forEach(el=>{
    if(STATE.authUser) el.classList.remove('hidden'); else el.classList.add('hidden');
  });
}

function showPasswordSetupModal(username){
  const modal = document.getElementById('setupPasswordModal');
  if(!modal) return;
  modal.classList.remove('hidden');
  
  // Pre-fill email (we'll fetch it)
  document.getElementById('setupEmail').value = username; // placeholder - will be email from server
  document.getElementById('setupPassword').value = '';
  document.getElementById('setupPasswordConfirm').value = '';
  document.getElementById('submitSetupBtn').disabled = true;
  
  // Fetch user info to get email
  fetch(apiUrl('/check-password-status'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  })
  .then(r => r.json())
  .then(data => {
    if(data.user && data.user.email) {
      document.getElementById('setupEmail').value = data.user.email;
    }
  })
  .catch(err => console.error('Error obteniendo usuario:', err));
  
  document.body.style.overflow = 'hidden';
}

function hidePasswordSetupModal(){
  const modal = document.getElementById('setupPasswordModal');
  if(!modal) return;
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

function validatePasswordStrength(password){
  const errors = [];
  if(password.length < 8) errors.push('min-length');
  if(!/[A-Z]/.test(password)) errors.push('uppercase');
  if(!/[a-z]/.test(password)) errors.push('lowercase');
  if(!/[0-9]/.test(password)) errors.push('number');
  if(!/[!@#$%^&*]/.test(password)) errors.push('special');
  
  return {
    valid: errors.length === 0,
    errors: errors,
    strength: (5 - errors.length) / 5 * 100
  };
}

function updatePasswordStrengthUI(){
  const password = document.getElementById('setupPassword').value;
  const confirm = document.getElementById('setupPasswordConfirm').value;
  
  const validation = validatePasswordStrength(password);
  
  // Update strength bar
  const fillEl = document.getElementById('passwordStrengthFill');
  if(fillEl) {
    fillEl.style.width = validation.strength + '%';
    if(validation.strength < 40) fillEl.style.background = '#ff4444';
    else if(validation.strength < 60) fillEl.style.background = '#ff9944';
    else if(validation.strength < 80) fillEl.style.background = '#ffcc44';
    else fillEl.style.background = '#44aa44';
  }
  
  // Update requirements checkmarks
  document.getElementById('req1').textContent = validation.errors.includes('min-length') ? '○' : '✓';
  document.getElementById('req2').textContent = validation.errors.includes('uppercase') ? '○' : '✓';
  document.getElementById('req3').textContent = validation.errors.includes('lowercase') ? '○' : '✓';
  document.getElementById('req4').textContent = validation.errors.includes('number') ? '○' : '✓';
  document.getElementById('req5').textContent = validation.errors.includes('special') ? '○' : '✓';
  
  // Update match indicator
  const matchStatus = document.getElementById('matchStatus');
  if(password && confirm) {
    if(password === confirm) {
      matchStatus.textContent = '✓ Las contraseñas coinciden';
      matchStatus.style.color = 'var(--cw-success, #44aa44)';
    } else {
      matchStatus.textContent = '○ Las contraseñas no coinciden';
      matchStatus.style.color = 'var(--cw-text-muted)';
    }
  } else {
    matchStatus.textContent = '○ Las contraseñas deben coincidir';
    matchStatus.style.color = 'var(--cw-text-muted)';
  }
  
  // Enable/disable submit button
  const submitBtn = document.getElementById('submitSetupBtn');
  if(submitBtn) {
    submitBtn.disabled = !(validation.valid && password && confirm && password === confirm);
  }
}

async function submitPasswordSetup(){
  const username = document.getElementById('setupEmail').value.trim();
  const password = document.getElementById('setupPassword').value;
  const confirmPassword = document.getElementById('setupPasswordConfirm').value;
  
  if(!username || !password || !confirmPassword) {
    showAlert('Campos Obligatorios', 'Por favor completa todos los campos');
    return;
  }
  
  if(password !== confirmPassword) {
    showAlert('Contraseñas No Coinciden', 'Las contraseñas no coinciden');
    return;
  }
  
  const validation = validatePasswordStrength(password);
  if(!validation.valid) {
    showAlert('Contraseña Débil', 'La contraseña no cumple con los requisitos de seguridad');
    return;
  }
  
  try {
    const response = await fetch(apiUrl('/setup-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, confirmPassword })
    });
    
    const data = await response.json();
    
    if(!response.ok) {
      showAlert('Error', '❌ ' + (data.error || 'Error al configurar contraseña'));
      return;
    }
    
    await showAlert('Éxito', '✓ Contraseña configurada exitosamente. Por favor inicia sesión.');
    hidePasswordSetupModal();
    resetLoginModal();
    showLoginModal();
  } catch (err) {
    console.error('Error de configuración de contraseña:', err);
    await showAlert('Error', '❌ ' + err.message);
  }
}

async function changePassword(){
  const currentPassword = document.getElementById('currentPasswordInput')?.value;
  const newPassword = document.getElementById('newPasswordInput')?.value;
  const confirmPassword = document.getElementById('confirmPasswordInput')?.value;
  
  if(!currentPassword || !newPassword || !confirmPassword) {
    showAlert('Campos Obligatorios', 'Por favor completa todos los campos');
    return;
  }
  
  if(newPassword !== confirmPassword) {
    showAlert('Error', 'Las contraseñas nuevas no coinciden');
    return;
  }
  
  // Validate password strength
  const validation = validatePasswordStrength(newPassword);
  if(!validation.valid) {
    showAlert('Contraseña Débil', 'La nueva contraseña no cumple con los requisitos de seguridad:\n- Mínimo 8 caracteres\n- Una mayúscula\n- Una minúscula\n- Un número\n- Un carácter especial (!@#$%^&*)');
    return;
  }
  
  if(!STATE.authUser || !STATE.authUser.id) {
    showAlert('Error', 'Debes iniciar sesión para cambiar tu contraseña');
    return;
  }
  
  try {
    const response = await fetch(apiUrl('/change-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId: STATE.authUser.id, 
        currentPassword, 
        newPassword, 
        confirmPassword 
      })
    });
    
    const data = await response.json();
    
    if(!response.ok) {
      showAlert('Error', data.error || 'Error al cambiar la contraseña');
      return;
    }
    
    // FASE 6.24: Notificar cambio de contraseña
    localStorage.setItem('cw:lastPasswordChange', new Date().toISOString());
    notifyPasswordChanged();
    
    // Clear inputs
    document.getElementById('currentPasswordInput').value = '';
    document.getElementById('newPasswordInput').value = '';
    document.getElementById('confirmPasswordInput').value = '';
  } catch (err) {
    console.error('Error al cambiar contraseña:', err);
    showAlert('Error', 'Error al cambiar la contraseña: ' + err.message);
  }
}

function removeUser(id){
  if(!(STATE.authUser && STATE.authUser.role === 'admin')){ alert('Permiso denegado'); return; }
  // Users are now managed only through backend
}

// Load manuales after user login - SOLO desde API
async function loadManualsAfterLogin() {
  console.log('[loadManualsAfterLogin] Cargando manuales desde API para usuario autenticado...');
  
  try {
    // Cargar manuales SOLO desde API
    const response = await api.getManuals();
    const apiManuals = response.data || response.manuals || [];
    console.log('[loadManualsAfterLogin] ✓ API retornó', apiManuals.length, 'manuales');
    
    // Normalizar steps
    STATE.manuals = apiManuals.map((manual) => {
      if (!manual.steps || !Array.isArray(manual.steps)) {
        const sourceArray = manual.content || [];
        if (typeof sourceArray === 'string') {
          try {
            manual.steps = JSON.parse(sourceArray);
          } catch (e) {
            manual.steps = [];
          }
        } else if (Array.isArray(sourceArray)) {
          manual.steps = sourceArray;
        } else {
          manual.steps = [];
        }
      }
      return manual;
    });
    
    // Renderizar en UI
    if(els.manualCount) els.manualCount.textContent = STATE.manuals.length;
    renderManualsList(STATE.manuals);
    
    console.log('[loadManualsAfterLogin] ✓ Manuales cargados y renderizados');
  } catch (err) {
    console.error('[loadManualsAfterLogin] Error cargando manuales:', err);
    STATE.manuals = [];
    showAlert('Error', '❌ No se pudieron cargar los manuales. Verifica la conexión.');
  }
}

async function login(){
  const u = els.loginUser.value.trim(); 
  const p = els.loginPass.value;
  
  if(!u || !p){ 
    await showAlert('Campos Obligatorios', 'Por favor introduce usuario/email y contraseña'); 
    return; 
  }
  
  try {
    // Get CSRF token first
    let csrfToken = '';
    try {
      const tokenResponse = await fetch(apiUrl('/csrf-token'), {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        csrfToken = tokenData.token;
      }
    } catch (e) {
      console.warn('CSRF token fetch failed:', e);
    }
    
    // Try session-based backend authentication
    const response = await fetch(apiUrl('/session-login'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({ username: u, password: p })
    });
    
    const data = await response.json();
    
    if(!response.ok) {
      await showAlert('Error de Autenticación', '❌ ' + (data.error || 'Credenciales inválidas'));
      return;
    }
    
    // Login successful - session cookie is automatically set by browser
    STATE.authUser = {
      id: data.user.id, 
      name: data.user.name || u, 
      role: data.user.role || 'agent',
      email: data.user.email,
      permissions: data.user.permissions || [],
      roleId: data.user.roleId,
      roleName: data.user.roleName
    };
    
    // Store user info in BOTH sessionStorage and localStorage
    // localStorage: persists across Ctrl+F5 and browser restart
    // sessionStorage: cleared on tab close (extra security)
    sessionStorage.setItem('cw:authUser', JSON.stringify(STATE.authUser));
    localStorage.setItem('cw:authUser', JSON.stringify(STATE.authUser));
    console.log('[loginStep2Next] ✓ Sesión guardada en ambos storages');
    
    // Reset login form and go back to step 1
    resetLoginModal();
    if(els.loginModal) hideLoginModal();
    
    // reveal application UI for authenticated users
    const sidebar = document.querySelector('.sidebar');
    const main = document.querySelector('.main');
    if(sidebar) sidebar.classList.remove('hidden');
    if(main) main.classList.remove('hidden');
    // show dashboard welcome screen by default after login
    openPanel('dashboard');
    refreshAuthUI();
    // PASO 9: Aplicar permission-based UI
    applyPermissionBasedUI();
    
    // Start permission polling to check for admin changes
    startPermissionPolling();
    
    pushNotification({title:'Sesión iniciada', text: `Hola ${data.user.name || u}`});
    
    // Cargar manuales después de que el usuario se loguea
    try {
      console.log('[login] Recargando manuales para usuario autenticado...');
      await loadManualsAfterLogin();
    } catch(err) {
      console.error('[login] Error cargando manuales:', err);
    }
    
    // Iniciar tour si es primer uso
    if (STATE.firstTimeUser) {
      setTimeout(() => {
        setupTourData();
        setupTourListeners();
        startTour(false);
      }, 800);
    }
  } catch (err) {
    console.error('Error de inicio de sesión:', err);
    await showAlert('Error de Conexión', '❌ ' + err.message);
  }
}

async function loginStep1Next(){
  const u = els.loginUser.value.trim();
  
  if(!u) {
    await showAlert('Campo Obligatorio', 'Por favor ingresa un usuario o correo');
    return;
  }
  
  try {
    // Check if user exists and their setup status
    const response = await fetch(apiUrl('/check-user-setup-status'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u })
    });
    
    const data = await response.json();
    
    if(!response.ok || !data.userFound) {
      await showAlert('No Encontrado', '❌ Usuario no encontrado');
      return;
    }
    
    // Store username for later use
    STATE.loginUsername = u;
    STATE.userNeedsPasswordSetup = data.needsPasswordSetup;
    
    // Show step 2
    const step1 = document.getElementById('loginStep1');
    const step2 = document.getElementById('loginStep2');
    const userDisplay = document.getElementById('loginUserDisplay');
    
    if(step1) step1.classList.add('hidden');
    if(step2) step2.classList.remove('hidden');
    
    // Display user info
    if(userDisplay) {
      userDisplay.textContent = `Accediendo como: ${data.user.name || data.user.username}`;
    }
    
    if(data.needsPasswordSetup) {
      // Show setup button
      const passwordWrapper = document.getElementById('passwordFieldWrapper');
      const setupWrapper = document.getElementById('setupButtonWrapper');
      if(passwordWrapper) passwordWrapper.classList.add('hidden');
      if(setupWrapper) setupWrapper.classList.remove('hidden');
      
      // Store user info for setup
      STATE.setupUser = data.user;
    } else {
      // Show password field
      const passwordWrapper = document.getElementById('passwordFieldWrapper');
      const setupWrapper = document.getElementById('setupButtonWrapper');
      if(passwordWrapper) passwordWrapper.classList.remove('hidden');
      if(setupWrapper) setupWrapper.classList.add('hidden');
      
      // Focus on password input
      setTimeout(() => {
        const passInput = document.getElementById('loginPass');
        if(passInput) passInput.focus();
      }, 100);
    }
  } catch (err) {
    console.error('Error en paso 1 del login:', err);
    await showAlert('Error', '❌ ' + err.message);
  }
}

function loginStep1Back(){
  const step1 = document.getElementById('loginStep1');
  const step2 = document.getElementById('loginStep2');
  
  if(step1) step1.classList.remove('hidden');
  if(step2) step2.classList.add('hidden');
  
  // Focus back on username
  setTimeout(() => {
    if(els.loginUser) els.loginUser.focus();
  }, 100);
}

function loginGoToSetup(){
  if(!STATE.setupUser) {
    alert('Error: usuario no encontrado');
    return;
  }
  
  // Close login modal and show password setup modal
  hideLoginModal();
  showPasswordSetupModal(STATE.setupUser.username);
}

function resetLoginModal(){
  els.loginUser.value = '';
  els.loginPass.value = '';
  
  const step1 = document.getElementById('loginStep1');
  const step2 = document.getElementById('loginStep2');
  
  if(step1) step1.classList.remove('hidden');
  if(step2) step2.classList.add('hidden');
  
  STATE.loginUsername = null;
  STATE.userNeedsPasswordSetup = false;
  STATE.setupUser = null;
}

async function logout(){
  try {
    // Send logout request to backend to destroy session
    const response = await fetch(apiUrl('/session-logout'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      console.error('Backend logout failed, clearing local state anyway');
    }
  } catch (err) {
    console.error('Error durante logout:', err);
  }
  
  STATE.authUser = null;
  localStorage.removeItem('cw:authUser');
  sessionStorage.removeItem('cw:authUser');
  
  // Stop permission polling
  stopPermissionPolling();
  
  // Stop manuals sync polling
  stopManualsSyncPolling();
  
  // hide application UI and show login modal again
  const sidebar = document.querySelector('.sidebar');
  const main = document.querySelector('.main');
  if(sidebar) sidebar.classList.add('hidden');
  if(main) main.classList.add('hidden');
  if(els.loginModal) showLoginModal();
  refreshAuthUI();
  pushNotification({title:'Sesión cerrada', text: 'Has cerrado sesión.'});
}

function refreshAuthUI(){
  const user = STATE.authUser;
  if(els.profileName) els.profileName.textContent = user ? `${user.name} (${user.role})` : '';
  
  // Update profile section
  const profileNameDisplay = document.getElementById('profileNameDisplay');
  const profileRoleDisplay = document.getElementById('profileRoleDisplay');
  const memberSinceDate = document.getElementById('memberSinceDate');
  
  if(user) {
    if(profileNameDisplay) profileNameDisplay.textContent = user.name || user.username || '—';
    if(profileRoleDisplay) {
      // Show role based on user.role
      let roleLabel = 'Usuario';
      if(user.role === 'admin') roleLabel = 'Administrador';
      profileRoleDisplay.textContent = roleLabel;
    }
    if(memberSinceDate) {
      // Show the creation date or today's date
      const createdDate = user.created_at ? new Date(user.created_at) : new Date();
      memberSinceDate.textContent = createdDate.toLocaleDateString('es-ES', {year: 'numeric', month: 'long', day: 'numeric'});
    }
    
    // Apply permission-based UI when user is authenticated
    applyPermissionBasedUI();
    
    // Start/stop activity polling based on admin status
    if(user.role === 'admin') {
      // Iniciar polling de actividad cuando se muestra el panel de admin
      startActivityPolling();
      // PASO 9: Iniciar auto-refresh de datos
      startDataRefresh();
    } else {
      // Detener polling cuando se oculta el panel de admin
      stopActivityPolling();
      // PASO 9: Detener auto-refresh
      stopDataRefresh();
    }
  }
  
  if(els.loginBtn) els.loginBtn.classList.toggle('hidden', !!user);
  if(els.logoutBtn) els.logoutBtn.classList.toggle('hidden', !user);
}

// PASO 9: Permission-based UI - Mostrar/ocultar secciones según permisos
async function applyPermissionBasedUI() {
  if (!STATE.authUser?.id) {
    console.log('[RBAC] No hay usuario logueado');
    return;
  }
  
  // Si es admin, mostrar todo
  if (STATE.authUser.role === 'admin') {
    console.log('[RBAC] Usuario es admin - mostrando toda la interfaz');
    showAllUI();
    return;
  }
  
  const perms = STATE.authUser.permissions || [];
  console.log('[RBAC] Permisos del usuario:', perms);
  console.log('[RBAC] Rol del usuario:', STATE.authUser.roleName);
  
  // Ocultar todo el menú por defecto
  hideAllNavItems();
  
  // ===== DASHBOARD - SIEMPRE VISIBLE =====
  console.log('[RBAC] ✓ Dashboard siempre visible');
  showNavItem('dashboard');
  
  // ===== MANUALES =====
  if (perms.includes('view_manuals')) {
    console.log('[RBAC] ✓ Mostrando acceso a Manuales');
    showNavItem('manuals');
    document.getElementById('manualView')?.classList.remove('hidden');
    document.getElementById('searchContainer')?.classList.remove('hidden');
  } else {
    console.log('[RBAC] ✗ Ocultando acceso a Manuales');
    hideNavItem('manuals');
    document.getElementById('manualView')?.classList.add('hidden');
    document.getElementById('searchContainer')?.classList.add('hidden');
  }
  
  // ===== DIAGRAMAS =====
  if (perms.includes('view_diagrams')) {
    console.log('[RBAC] ✓ Mostrando acceso a Diagramas');
    showNavItem('fibra');
    document.getElementById('diagramsSection')?.classList.remove('hidden');
    document.getElementById('fiberView')?.classList.remove('hidden');
  } else {
    console.log('[RBAC] ✗ Ocultando acceso a Diagramas');
    hideNavItem('fibra');
    document.getElementById('diagramsSection')?.classList.add('hidden');
    document.getElementById('fiberView')?.classList.add('hidden');
  }
  
  // ===== HISTORIAL - SIEMPRE VISIBLE =====
  console.log('[RBAC] ✓ Historial siempre visible');
  showNavItem('history');
  
  // ===== FAQS - SIEMPRE VISIBLE =====
  console.log('[RBAC] ✓ FAQs siempre visible');
  showNavItem('faqs');
  
  // ===== SECCIÓN ADMIN (Usuarios, Roles, Auditoría, Especialidades) =====
  const canViewUsers = perms.includes('view_users');
  const canEditUsers = perms.includes('edit_users');
  const canCreateUsers = perms.includes('create_users');
  const canManageRoles = perms.includes('manage_roles');
  const canViewAudit = perms.includes('view_audit');
  const canExportAudit = perms.includes('export_audit');
  const canManageSpecialties = perms.includes('manage_specialties');
  const canManageKB = perms.includes('manage_kb') || perms.includes('view_kb');
  
  const hasAdminAccess = canViewUsers || canEditUsers || canCreateUsers || canManageRoles || canViewAudit || canExportAudit || canManageSpecialties || canManageKB;
  
  if (hasAdminAccess) {
    console.log('[RBAC] ✓ Mostrando acceso a Panel Admin');
    showNavItem('settings');
  } else {
    console.log('[RBAC] ✗ Ocultando acceso a Panel Admin');
    hideNavItem('settings');
  }
  
  // ===== PRIMERO: OCULTAR TODOS LOS ELEMENTOS ADMIN =====
  document.querySelectorAll('[data-admin]').forEach(el => {
    el.classList.add('hidden');
    el.style.display = 'none';
  });
  
  // ===== CONTROL GRANULAR DE USUARIOS =====
  if (canViewUsers) {
    console.log('[RBAC] ✓ Mostrando lista de usuarios');
    // Mostrar la sección de gestión de usuarios
    document.querySelectorAll('section.settings-section[data-admin]').forEach(el => {
      if (el.querySelector('h4')?.textContent?.includes('Usuarios') || el.querySelector('h4')?.textContent?.includes('Usuario')) {
        el.classList.remove('hidden');
        el.style.removeProperty('display');
      }
    });
    // Cargar la lista de usuarios
    await refreshUsersList();
  } else {
    document.querySelectorAll('[data-section="usersList"]').forEach(el => el.style.display = 'none');
  }
  if (!canEditUsers) {
    document.querySelectorAll('[data-action="editUser"]').forEach(el => el.style.display = 'none');
  }
  if (!canCreateUsers) {
    document.querySelectorAll('[data-action="newUser"]').forEach(el => el.style.display = 'none');
    document.getElementById('addUserBtn')?.style.setProperty('display', 'none', 'important');
  }
  
  // ===== CONTROL GRANULAR DE ROLES =====
  if (canManageRoles) {
    console.log('[RBAC] ✓ Mostrando gestión de roles');
    // Mostrar la sección de roles (dentro de usuarios)
  } else {
    document.querySelectorAll('[data-section="rolesList"]').forEach(el => el.style.display = 'none');
    document.querySelectorAll('[data-action="manageRoles"]').forEach(el => el.style.display = 'none');
  }
  
  // ===== CONTROL GRANULAR DE AUDITORÍA =====
  if (canViewAudit) {
    console.log('[RBAC] ✓ Mostrando auditoría');
    // Auditoría está dentro de la sección de usuarios
  } else {
    document.querySelectorAll('[data-section="auditLog"]').forEach(el => el.style.display = 'none');
  }
  if (!canExportAudit) {
    document.querySelectorAll('[data-action="exportAudit"]').forEach(el => el.style.display = 'none');
  }
  
  // ===== CONTROL GRANULAR DE ESPECIALIDADES =====
  if (!canManageSpecialties) {
    document.querySelectorAll('[data-action="manageSpecialties"]').forEach(el => el.style.display = 'none');
  }
  
  // ===== CONTROL GRANULAR DE KNOWLEDGE BASE =====
  if (canManageKB) {
    console.log('[RBAC] ✓ Mostrando Knowledge Base Manager');
    // Mostrar la sección de KB
    document.querySelectorAll('section.settings-section[data-admin]').forEach(el => {
      if (el.querySelector('h4')?.textContent?.includes('Knowledge Base')) {
        el.classList.remove('hidden');
        el.style.removeProperty('display');
      }
    });
  } else {
    console.log('[RBAC] ✗ Ocultando Knowledge Base Manager');
  }
  
  // ===== BOTONES DE ACCIÓN EN MANUALES =====
  const canEditManuals = perms.includes('edit_manuals');
  const canCreateManuals = perms.includes('create_manuals');
  const canDeleteManuals = perms.includes('delete_manuals');
  
  if (!canEditManuals) {
    document.querySelectorAll('[data-action="editManual"]').forEach(el => el.style.display = 'none');
  }
  if (canCreateManuals) {
    // Mostrar el botón de crear manual si tiene permisos
    document.getElementById('createManualBtn')?.classList.remove('hidden');
    document.getElementById('createManualBtn')?.style.removeProperty('display');
  } else {
    document.querySelectorAll('[data-action="newManual"]').forEach(el => el.style.display = 'none');
    document.getElementById('createManualBtn')?.style.setProperty('display', 'none', 'important');
  }
  if (!canDeleteManuals) {
    document.querySelectorAll('[data-action="deleteManual"]').forEach(el => el.style.display = 'none');
  }
  
  // ===== BOTONES DE ACCIÓN EN DIAGRAMAS =====
  const canEditDiagrams = perms.includes('edit_diagrams');
  
  if (!canEditDiagrams) {
    document.querySelectorAll('[data-action="editDiagram"]').forEach(el => el.style.display = 'none');
    document.getElementById('createDiagramBtn')?.style.setProperty('display', 'none', 'important');
  }
  
  // ===== AJUSTES - SOLO SI TIENE ACCESO A FUNCIONALIDAD ADMIN =====
  if (hasAdminAccess) {
    console.log('[RBAC] ✓ Ajustes visible (acceso admin)');
    showNavItem('settings');
  } else {
    console.log('[RBAC] ✗ Ajustes oculto (sin permisos admin)');
    hideNavItem('settings');
  }
  
  // ===== AGREGAR VALIDACIÓN AL CAMBIAR DE PANEL =====
  addPermissionValidationToNavigation();
  
  console.log('[RBAC] ✓ Control de acceso basado en roles aplicado correctamente');
}

// Función para validar permisos al navegar
function addPermissionValidationToNavigation() {
  // Remover listeners anteriores para evitar duplicados
  document.querySelectorAll('[data-nav]').forEach(btn => {
    // Clonar y reemplazar para remover todos los event listeners
    const clone = btn.cloneNode(true);
    btn.parentNode.replaceChild(clone, btn);
  });
  
  // Agregar nuevos listeners que llamen a openPanel con validación
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const navItem = btn.getAttribute('data-nav');
      console.log(`[Navigation] Clic en ${navItem}`);
      openPanel(navItem);
    });
  });
}

// Funciones auxiliares para ocultar/mostrar elementos
function hideAllNavItems() {
  const navItems = ['dashboard', 'manuals', 'fibra', 'history', 'faqs', 'settings', 'audit', 'users', 'roles'];
  navItems.forEach(item => {
    const nav = document.querySelector(`[data-nav="${item}"]`);
    if (nav) {
      nav.closest('li')?.style.setProperty('display', 'none', 'important');
    }
  });
}

function showAllUI() {
  const navItems = ['dashboard', 'manuals', 'fibra', 'history', 'faqs', 'settings', 'audit', 'users', 'roles'];
  navItems.forEach(item => {
    const nav = document.querySelector(`[data-nav="${item}"]`);
    if (nav) {
      nav.closest('li')?.style.removeProperty('display');
    }
  });
  
  document.getElementById('manualView')?.classList.remove('hidden');
  document.getElementById('searchContainer')?.classList.remove('hidden');
  document.getElementById('diagramsSection')?.classList.remove('hidden');
  document.getElementById('fiberView')?.classList.remove('hidden');
  
  // Mostrar todas las secciones admin
  document.querySelectorAll('[data-admin]').forEach(el => {
    el.classList.remove('hidden');
    el.style.removeProperty('display');
  });
}

function showNavItem(itemName) {
  const nav = document.querySelector(`[data-nav="${itemName}"]`);
  if (nav) {
    nav.closest('li')?.style.removeProperty('display');
  }
}

function hideNavItem(itemName) {
  const nav = document.querySelector(`[data-nav="${itemName}"]`);
  if (nav) {
    nav.closest('li')?.style.setProperty('display', 'none', 'important');
  }
}

// Create new user (admin only) - Backend version
async function createNewUser(){
  const username = document.getElementById('newUserName')?.value?.trim();
  const email = document.getElementById('newUserEmail')?.value?.trim();
  const fullName = document.getElementById('newUserFullName')?.value?.trim();
  
  if(!username || !email || !fullName){
    showAlert('Campos Obligatorios', 'Por favor completa todos los campos (usuario, email, nombre)');
    return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showAlert('Email Inválido', 'Por favor ingresa un correo electrónico válido');
    return;
  }
  
  // Recopilar roles seleccionados
  const selectedRoles = Array.from(
    document.querySelectorAll('.user-role-checkbox:checked')
  ).map(cb => ({
    id: cb.getAttribute('data-role-id'),
    name: cb.getAttribute('data-role-name')
  }));
  
  if (selectedRoles.length === 0) {
    showAlert('Roles Obligatorios', 'Por favor selecciona al menos un rol para el usuario');
    return;
  }
  
  try {
    const response = await fetch(apiUrl('/users'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, name: fullName, roles: selectedRoles.map(r => r.id) })
    });
    
    const data = await response.json();
    if(!response.ok) throw new Error(data.error || 'Error creating user');
    
    // Build message based on email sent status
    const rolesDisplay = selectedRoles.map(r => r.name).join(', ');
    let message = `✓ Usuario "${username}" creado con rol(es): ${rolesDisplay}\n\n`;
    if(data.emailSent) {
      message += `📧 Email de bienvenida enviado a: ${email}\n\n`;
      message += `El usuario recibirá instrucciones para:\n`;
      message += `1. Acceder a la plataforma\n`;
      message += `2. Configurar su contraseña\n`;
      message += `3. Una descripción completa de cómo funciona Cableworld`;
    } else {
      message += `⚠️ No fue posible enviar el email (posible falta de configuración).\n\n`;
      message += `Usuario: ${username}\n`;
      message += `Email: ${email}\n\n`;
      message += `El usuario puede acceder directamente a la plataforma.`;
    }
    
    showAlert('✓ Éxito', message);
    document.getElementById('newUserName').value = '';
    document.getElementById('newUserEmail').value = '';
    document.getElementById('newUserFullName').value = '';
    document.querySelectorAll('.user-role-checkbox').forEach(cb => cb.checked = false);
    refreshUsersList();
  } catch (err) {
    showAlert('❌ Error', err.message);
    console.error('Error creando usuario:', err);
  }
}

async function refreshUsersList(limit = 20, offset = 0){
  try {
    console.log('[refreshUsersList] Obteniendo usuarios desde el backend...');
    const response = await fetch(apiUrl(`/users?limit=${limit}&offset=${offset}`));
    
    if(!response.ok) {
      console.error('[refreshUsersList] Error obteniendo usuarios:', response.status, response.statusText);
      return;
    }
    
    const responseData = await response.json();
    // Manejar ambos formatos de respuesta (paginada y simple)
    const users = responseData.data || responseData;
    const pagination = responseData.pagination;
    
    console.log('[refreshUsersList] Usuarios recibidos:', users.length, pagination ? `(${pagination.total} total)` : '');
    
    const usersList = document.getElementById('usersList');
    if(!usersList) {
      console.error('[refreshUsersList] Elemento #usersList no encontrado en el DOM');
      return;
    }
    
    if(users.length === 0) {
      usersList.innerHTML = '<p style="color:var(--cw-text-muted);font-size:13px">No hay usuarios registrados</p>';
      return;
    }
    
    let html = '<div style="display:flex;flex-direction:column;gap:8px">';
    users.forEach((user, index) => {
      const hasPassword = user.passwordSet === 1 || user.passwordSet === true;
      const emailDisplay = user.email ? escapeHtml(user.email) : '(sin email)';
      const passwordStatus = hasPassword ? '✓ Contraseña configurada' : '⚠ Pendiente de configurar';
      const passwordColor = hasPassword ? '#44aa44' : '#ff9944';
      
      // SANITIZACIÓN: Escapar nombre de usuario
      const safeName = escapeHtml(user.name || user.username);
      const safeUserName = escapeHtml(user.name || user.username);
      
      // Verificar si es la propia cuenta del usuario logueado
      const isOwnAccount = STATE.authUser && STATE.authUser.id === user.id;
      // Verificar si es admin y el usuario logueado no es admin (protección)
      const isAdminProtected = user.role === 'admin' && STATE.authUser.role !== 'admin';
      
      console.log('[refreshUsersList] Usuario:', user.username, 'esCuenta propia:', isOwnAccount, 'authId:', STATE.authUser?.id, 'userId:', user.id);
      
      // Botones de acción
      let actionButtons = '';
      if (!isOwnAccount && !isAdminProtected) {
        actionButtons = `
          <button class="secondary small-btn user-action-btn" data-action="specialties" data-user-id="${escapeHtml(user.id)}" title="Especialidades" style="font-size:11px;padding:6px 10px;border-radius:4px">📋 Especialidades</button>
          <button class="secondary small-btn user-action-btn" data-action="edit-roles" data-user-id="${escapeHtml(user.id)}" data-user-name="${safeUserName}" title="Editar permisos" style="font-size:11px;padding:6px 10px;border-radius:4px;background:var(--cw-primary);color:white;border-color:var(--cw-primary)">🔑 Permisos</button>
          <button class="secondary small-btn user-action-btn" data-action="reset-password" data-user-id="${escapeHtml(user.id)}" data-user-name="${safeUserName}" title="Resetear contraseña" style="font-size:11px;padding:6px 10px;border-radius:4px">🔐 Contraseña</button>
          <button class="secondary small-btn" id="deleteBtn-${index}" data-user-id="${escapeHtml(user.id)}" data-user-name="${safeUserName}" title="Eliminar usuario" style="font-size:11px;padding:6px 10px;border-radius:4px;background:rgba(255,99,99,0.1);color:#ff6b6b;border-color:#ff6b6b">✕ Eliminar</button>
        `;
      } else if (isOwnAccount) {
        actionButtons = `<span style="color:var(--cw-text-muted);font-size:11px;padding:6px 10px;background:var(--cw-surface);border-radius:4px">(Tu cuenta)</span>`;
      } else if (isAdminProtected) {
        actionButtons = `<span style="color:var(--cw-text-muted);font-size:11px;padding:6px 10px;background:var(--cw-surface);border-radius:4px;display:flex;align-items:center;gap:6px">🔒 Cuenta protegida</span>`;
      }
      
      html += `
        <div style="display:flex;flex-direction:column;gap:8px;padding:12px;background:var(--cw-surface-dark);border-radius:4px;font-size:13px;${isAdminProtected ? 'opacity:0.7;border-left:3px solid var(--cw-text-muted)' : ''}">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
            <div style="flex:1;min-width:0">
              <strong>${safeName}${isAdminProtected ? ' 👑' : ''}</strong>
            </div>
          </div>
          <div style="color:var(--cw-text-muted);font-size:11px">${emailDisplay} • ${escapeHtml(user.role)}</div>
          <div style="color:${passwordColor};font-size:11px">
            ${passwordStatus}
          </div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:8px;padding-top:8px;border-top:1px solid var(--cw-border-light)">
            ${actionButtons}
          </div>
        </div>
      `;
    });
    
    // Agregar controles de paginación si hay más resultados
    if (pagination && pagination.hasMore) {
      html += `
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--cw-border);text-align:center">
          <button id="loadMoreUsers" class="primary" style="padding:10px 20px;border-radius:4px">
            Cargar más usuarios (${offset + limit} de ${pagination.total})
          </button>
        </div>
      `;
    }
    
    html += '</div>';
    usersList.innerHTML = html;
    
    // Event listener para cargar más
    const loadMoreBtn = document.getElementById('loadMoreUsers');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        refreshUsersList(limit, offset + limit);
      });
    }
    
    // Agregar event listeners a los botones después de renderizar
    users.forEach((user, index) => {
      const isOwnAccount = STATE.authUser && STATE.authUser.id === user.id;
      if(!isOwnAccount) {
        const btn = document.getElementById(`deleteBtn-${index}`);
        if(btn) {
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            const userId = this.dataset.userId;
            const userName = this.dataset.userName;
            deleteUserFromBackend(userId, userName);
          });
        }
      }
    });
    
    // Event listeners para acciones de usuario
    document.querySelectorAll('.user-action-btn').forEach(btn => {
      btn.addEventListener('click', async function(e) {
        e.preventDefault();
        const action = this.dataset.action;
        const userId = this.dataset.userId;
        const userName = this.dataset.userName;
        
        if (action === 'specialties') {
          editUserSpecialties(userId);
        } else if (action === 'edit-roles') {
          editUserRoles(userId, userName);
        } else if (action === 'reset-password') {
          resetUserPassword(userId, userName);
        }
      });
    });
    
    console.log('[refreshUsersList] ✓ Lista de usuarios renderizada exitosamente');
  } catch (err) {
    console.error('[refreshUsersList] Error:', err);
  }
}

async function deleteUserFromBackend(userId, userName){
  console.log('[deleteUserFromBackend] Iniciando eliminación de usuario:', { userId, userName, requestedBy: STATE.authUser?.name });
  
  // Verificar permisos
  if(!canEditUsers()) {
    await showAlert('❌ Acceso Denegado', 'No tienes permisos para eliminar usuarios.');
    console.warn('[deleteUserFromBackend] Acceso denegado:', { user: STATE.authUser?.name, targetUser: userName });
    return;
  }
  
  // Proteger cuenta de Administrador
  // Obtener información del usuario a eliminar para verificar si es admin
  try {
    const userCheckRes = await fetch(apiUrl(`/users/${userId}`));
    if (userCheckRes.ok) {
      const userToDelete = await userCheckRes.json();
      if (userToDelete.role === 'admin' && STATE.authUser.role !== 'admin') {
        await showAlert('❌ Acceso Protegido', 'No puedes eliminar la cuenta de Administrador. Solo otro administrador puede hacer esto.');
        console.warn('[deleteUserFromBackend] Intento de eliminar admin bloqueado:', { user: STATE.authUser?.name, targetUser: userName });
        return;
      }
    }
  } catch (err) {
    console.warn('[deleteUserFromBackend] Error verificando rol del usuario:', err);
    // Continuar de todas formas
  }
  
  const confirmMessage = `Esta acción es irreversible. Todos los datos de este usuario se eliminarán permanentemente.`;
  
  // Primera confirmación
  const firstConfirm = await showConfirm('⚠️ Eliminar Usuario', `¿Deseas eliminar a "${userName}"?\n\n${confirmMessage}`);
  if(!firstConfirm) {
    console.log('[deleteUserFromBackend] Eliminación cancelada por el usuario (primera confirmación)');
    return;
  }
  
  // Segunda confirmación para mayor seguridad
  const secondConfirm = await showConfirm('⚠️ ÚLTIMA CONFIRMACIÓN', `¿Estás completamente seguro de que deseas eliminar a ${userName}?\n\nEsta acción NO se puede deshacer.`);
  if(!secondConfirm) {
    console.log('[deleteUserFromBackend] Eliminación cancelada por el usuario (segunda confirmación)');
    return;
  }
  
  try {
    console.log('[deleteUserFromBackend] Enviando solicitud de eliminación al servidor...');
    
    const response = await fetch(apiUrl(`/users/${userId}`), {
      method: 'DELETE'
    });
    
    if(!response.ok) {
      const data = await response.json();
      console.error('[deleteUserFromBackend] Error del servidor:', data);
      await showAlert('❌ Error al Eliminar', (data.error || 'No se pudo eliminar el usuario'));
      return;
    }
    
    console.log('[deleteUserFromBackend] ✓ Usuario eliminado exitosamente:', { userId, userName, deletedBy: STATE.authUser?.name });
    
    await showAlert('✅ Éxito', `Usuario "${userName}" ha sido eliminado correctamente`);
    refreshUsersList();
  } catch (err) {
    console.error('[deleteUserFromBackend] Error al eliminar:', err);
    await showAlert('❌ Error de Conexión', 'Error: ' + err.message);
  }
}

// ========== FASE 12: GESTIÓN DE USUARIOS (items 2-7) ==========

// Tabs para gestión de usuarios
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('user-tab-btn')) {
    const tabName = e.target.dataset.tab;
    
    // Remover activo de todos los tabs
    document.querySelectorAll('.user-tab-btn').forEach(btn => {
      btn.style.color = 'var(--cw-text-muted)';
      btn.style.borderBottomColor = 'transparent';
      btn.style.marginBottom = '-2px';
    });
    document.querySelectorAll('.user-tab-content').forEach(content => {
      content.classList.add('hidden');
    });
    
    // Agregar activo al tab seleccionado
    e.target.style.color = 'var(--cw-primary)';
    e.target.style.borderBottomColor = 'var(--cw-primary)';
    e.target.style.marginBottom = '-2px';
    document.getElementById(tabName + '-tab').classList.remove('hidden');
    
    // Cargar datos si es necesario
    if (tabName === 'users-roles') {
      loadRoles();
      loadPermissionsGrid();
    }
    if (tabName === 'users-audit') loadAuditLog();
    if (tabName === 'users-stats') loadUserStats();
  }
});

// Event listeners para filtros de auditoría
document.getElementById('auditFilterUser')?.addEventListener('change', loadAuditLog);
document.getElementById('auditFilterAction')?.addEventListener('change', loadAuditLog);
document.getElementById('refreshAuditBtn')?.addEventListener('click', loadAuditLog);
function translatePermission(perm) {
  const translations = {
    'view': 'Ver manuales',
    'create': 'Crear manuales',
    'edit': 'Editar manuales',
    'delete': 'Eliminar manuales',
    'admin': 'Administrar sistema',
    'read_manuals': 'Ver manuales',
    'edit_manuals': 'Editar manuales',
    'delete_manuals': 'Eliminar manuales',
    'manage_users': 'Gestionar usuarios'
  };
  return translations[perm] || perm;
}

// ===== FUNCIONES DE DIÁLOGOS Y ALERTAS =====

function showHelp() {
  const helpContent = `
    <h3>Atajos de Teclado</h3>
    <ul style="text-align:left;margin:12px 0">
      <li><strong>Ctrl/Cmd + K</strong> - Abrir búsqueda</li>
      <li><strong>Ctrl/Cmd + ?</strong> - Ver ayuda</li>
      <li><strong>Ctrl/Cmd + Alt + L</strong> - Cerrar sesión</li>
      <li><strong>→ / ←</strong> - Navegar en tour</li>
      <li><strong>Esc</strong> - Cerrar diálogos</li>
    </ul>
    <p style="font-size:12px;color:var(--cw-text-muted)">Para más información, consulta la documentación en línea.</p>
  `;
  showAlert('Ayuda y Atajos', helpContent);
}

// ===== GESTIÓN AVANZADA DE ROLES =====

// Diccionario de permisos con traducciones y emojis
const PERMISSION_LABELS = {
  // ===== MANUALES =====
  'view_manuals': { icon: '👁️', label: 'Ver manuales', category: 'Manuales' },
  'create_manuals': { icon: '➕', label: 'Crear manuales', category: 'Manuales' },
  'edit_manuals': { icon: '✏️', label: 'Editar propios', category: 'Manuales' },
  'edit_all_manuals': { icon: '✏️✏️', label: 'Editar cualquiera', category: 'Manuales' },
  'delete_manuals': { icon: '🗑️', label: 'Eliminar propios', category: 'Manuales' },
  'delete_all_manuals': { icon: '🗑️🗑️', label: 'Eliminar cualquiera', category: 'Manuales' },
  'publish_manuals': { icon: '📤', label: 'Publicar manuales', category: 'Manuales' },
  'archive_manuals': { icon: '📦', label: 'Archivar manuales', category: 'Manuales' },
  'export_manuals': { icon: '📥', label: 'Exportar manuales', category: 'Manuales' },
  
  // ===== CARPETAS =====
  'view_folders': { icon: '👁️', label: 'Ver carpetas', category: 'Carpetas' },
  'create_folders': { icon: '➕', label: 'Crear carpetas', category: 'Carpetas' },
  'edit_folders': { icon: '✏️', label: 'Editar propias', category: 'Carpetas' },
  'edit_all_folders': { icon: '✏️✏️', label: 'Editar cualquiera', category: 'Carpetas' },
  'delete_folders': { icon: '🗑️', label: 'Eliminar propias', category: 'Carpetas' },
  'delete_all_folders': { icon: '🗑️🗑️', label: 'Eliminar cualquiera', category: 'Carpetas' },
  'share_folders': { icon: '📤', label: 'Compartir carpetas', category: 'Carpetas' },
  'publish_folders': { icon: '🌐', label: 'Publicar carpetas', category: 'Carpetas' },
  
  // ===== DIAGRAMAS =====
  'view_diagrams': { icon: '👁️', label: 'Ver árboles', category: 'Diagramas' },
  'create_diagrams': { icon: '➕', label: 'Crear árboles', category: 'Diagramas' },
  'edit_diagrams': { icon: '✏️', label: 'Editar propios', category: 'Diagramas' },
  'edit_all_diagrams': { icon: '✏️✏️', label: 'Editar cualquiera', category: 'Diagramas' },
  'delete_diagrams': { icon: '🗑️', label: 'Eliminar propios', category: 'Diagramas' },
  'delete_all_diagrams': { icon: '🗑️🗑️', label: 'Eliminar cualquiera', category: 'Diagramas' },
  'export_diagrams': { icon: '📥', label: 'Exportar árboles', category: 'Diagramas' },
  
  // ===== USUARIOS =====
  'view_users': { icon: '👥', label: 'Ver usuarios', category: 'Usuarios' },
  'create_users': { icon: '➕', label: 'Crear usuarios', category: 'Usuarios' },
  'edit_users': { icon: '✏️', label: 'Editar usuarios', category: 'Usuarios' },
  'delete_users': { icon: '🗑️', label: 'Eliminar usuarios', category: 'Usuarios' },
  'reset_password': { icon: '🔑', label: 'Restablecer contraseñas', category: 'Usuarios' },
  'toggle_user_status': { icon: '🔄', label: 'Activar/Desactivar', category: 'Usuarios' },
  
  // ===== ROLES =====
  'manage_roles': { icon: '👑', label: 'Gestionar roles', category: 'Roles' },
  'view_roles': { icon: '👁️', label: 'Ver roles', category: 'Roles' },
  'create_roles': { icon: '➕', label: 'Crear roles', category: 'Roles' },
  'edit_roles': { icon: '✏️', label: 'Editar roles', category: 'Roles' },
  'delete_roles': { icon: '🗑️', label: 'Eliminar roles', category: 'Roles' },
  
  // ===== AUDITORÍA Y SEGURIDAD =====
  'view_audit': { icon: '📊', label: 'Ver auditoría', category: 'Auditoría' },
  'export_audit': { icon: '📥', label: 'Exportar auditoría', category: 'Auditoría' },
  'clear_audit': { icon: '🗑️', label: 'Limpiar auditoría', category: 'Auditoría' },
  
  // ===== ADMINISTRACIÓN =====
  'manage_specialties': { icon: '⭐', label: 'Gestionar especialidades', category: 'Administración' },
  'manage_folders': { icon: '📁', label: 'Gestionar carpetas', category: 'Administración' },
  'manage_settings': { icon: '⚙️', label: 'Gestionar configuración', category: 'Administración' },
  'manage_system': { icon: '🔒', label: 'Acceso total al sistema', category: 'Administración' }
};

// Cargar permisos disponibles del backend y renderizar checkboxes
async function loadPermissionsGrid() {
  try {
    const grid = document.getElementById('permissionsGrid');
    if (!grid) return;
    
    // Usar PERMISSION_LABELS definido en el frontend
    const permissions = Object.keys(PERMISSION_LABELS);
    
    // Agrupar permisos por categoría
    const grouped = {};
    permissions.forEach(perm => {
      const info = PERMISSION_LABELS[perm] || { icon: '📋', label: perm, category: 'Otros' };
      if (!grouped[info.category]) grouped[info.category] = [];
      grouped[info.category].push({ id: perm, ...info });
    });
    
    let html = '';
    Object.entries(grouped).forEach(([category, perms]) => {
      html += `<div style="grid-column:1/-1;padding:8px 0;border-bottom:1px solid var(--cw-border-light);margin-bottom:4px">
        <strong style="font-size:11px;color:var(--cw-primary);text-transform:uppercase;letter-spacing:0.5px">${category}</strong>
      </div>`;
      
      perms.forEach(perm => {
        html += `
          <label class="permission-label" style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:6px;border-radius:4px;transition:background 0.2s;user-select:none">
            <input type="checkbox" class="role-permission-checkbox" data-permission="${perm.id}" style="cursor:pointer;width:16px;height:16px">
            <span style="flex:1">
              <span>${perm.icon}</span> ${perm.label}
            </span>
          </label>
        `;
      });
    });
    
    html += `<style>
      .permission-label:hover {
        background: var(--cw-surface);
      }
    </style>`;
    
    grid.innerHTML = html;
  } catch (err) {
    console.error('Error cargando permisos:', err);
  }
}

// Cargar y mostrar lista de roles
async function loadRoles(limit = 20, offset = 0) {
  try {
    console.log('[loadRoles] Iniciando carga de roles...');
    const rolesList = document.getElementById('rolesList');
    console.log('[loadRoles] rolesList element:', rolesList ? 'FOUND' : 'NOT FOUND');
    
    if (!rolesList) {
      console.warn('[loadRoles] rolesList element not found, cannot load roles');
      return;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout (más agresivo)
    
    const url = apiUrl(`/roles?limit=${limit}&offset=${offset}`);
    console.log('[loadRoles] Fetching from:', url);
    
    const response = await fetch(url, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log('[loadRoles] Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.warn(`[loadRoles] Error ${response.status}:`, response.statusText);
      
      if (response.status === 403) {
        rolesList.innerHTML = '<p style="color:var(--cw-danger);text-align:center;padding:20px">❌ No tienes permisos para ver roles. Contacta al administrador.</p>';
      } else if (response.status === 401) {
        rolesList.innerHTML = '<p style="color:var(--cw-danger);text-align:center;padding:20px">❌ Necesitas estar logueado. Por favor recarga la página.</p>';
      } else {
        rolesList.innerHTML = `<p style="color:var(--cw-danger);text-align:center;padding:20px">❌ Error cargando roles: ${response.status}</p>`;
      }
      return;
    }
    
    const responseData = await response.json();
    console.log('[loadRoles] ✓ Response data:', responseData);
    console.log('[loadRoles] ✓ Roles cargados:', responseData.data?.length || 0);
    
    // Manejar ambos formatos de respuesta (paginada y simple)
    const roles = responseData.data || responseData;
    const pagination = responseData.pagination;
    
    // Actualizar select de crear usuario con los roles disponibles
    const roleSelect = document.getElementById('newUserRole');
    if (roleSelect) {
      roleSelect.innerHTML = '<option value="">Selecciona un rol...</option>';
      roles.forEach(role => {
        const option = document.createElement('option');
        option.value = role.id;
        option.textContent = role.name + (role.is_default ? ' (predeterminado)' : '');
        roleSelect.appendChild(option);
      });
    }
    
    if (!roles || roles.length === 0) {
      rolesList.innerHTML = '<p style="color:var(--cw-text-muted);text-align:center;padding:20px">No hay roles personalizados</p>';
      return;
    }
    
    let html = '<div style="display:flex;flex-direction:column;gap:12px">';
    roles.forEach(role => {
      const perms = typeof role.permissions === 'string' ? JSON.parse(role.permissions || '[]') : (role.permissions || []);
      const permLabels = perms.map(p => {
        const info = PERMISSION_LABELS[p];
        return info ? `${info.icon} ${info.label}` : p;
      });
      
      const badgeColor = role.is_default ? 'var(--cw-primary)' : 'var(--cw-success)';
      const badgeText = role.is_default ? 'Predeterminado' : 'Personalizado';
      
      // SANITIZACIÓN: Escapar nombre y descripción del rol
      const safeName = escapeHtml(role.name);
      const safeDesc = role.description ? escapeHtml(role.description) : '';
      const safeRoleId = escapeHtml(role.id);
      
      html += `
        <div style="padding:12px;background:var(--cw-surface-dark);border-radius:6px;border-left:4px solid ${badgeColor}">
          <div style="display:flex;justify-content:space-between;align-items:start;gap:12px">
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                <strong style="font-size:14px">${safeName}</strong>
                <span style="font-size:10px;background:${badgeColor};color:white;padding:2px 6px;border-radius:12px">${badgeText}</span>
              </div>
              ${safeDesc ? `<p style="color:var(--cw-text-muted);font-size:12px;margin:4px 0">${safeDesc}</p>` : ''}
              <div style="color:var(--cw-text-muted);font-size:11px;margin-top:6px">
                <strong>Permisos:</strong> ${permLabels.length > 0 ? permLabels.join(' • ') : 'Ninguno'}
              </div>
            </div>
            <div style="display:flex;gap:4px;flex-direction:column">
              ${!role.is_default ? `<button class="secondary small-btn edit-role-btn" data-role-id="${safeRoleId}" style="padding:6px 10px;font-size:11px" title="Editar rol">✏️</button>` : ''}
              ${!role.is_default ? `<button class="secondary small-btn delete-role-btn" data-role-id="${safeRoleId}" data-role-name="${safeName}" style="padding:6px 10px;font-size:11px;background:var(--cw-danger);color:white;border-color:var(--cw-danger)" title="Eliminar rol">🗑️</button>` : ''}
            </div>
          </div>
        </div>
      `;
    });
    
    // Agregar controles de paginación si hay más resultados
    if (pagination && pagination.hasMore) {
      html += `
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--cw-border);text-align:center">
          <button id="loadMoreRoles" class="primary" style="padding:10px 20px;border-radius:4px">
            Cargar más roles (${offset + limit} de ${pagination.total})
          </button>
        </div>
      `;
    }
    
    html += '</div>';
    rolesList.innerHTML = html;
    
    // Event listener para cargar más roles
    const loadMoreBtn = document.getElementById('loadMoreRoles');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        loadRoles(limit, offset + limit);
      });
    }
    
    // Agregar event listeners a botones
    document.querySelectorAll('.edit-role-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        editRole(this.dataset.roleId);
      });
    });
    
    document.querySelectorAll('.delete-role-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        deleteRole(this.dataset.roleId, this.dataset.roleName);
      });
    });
  } catch (err) {
    console.error('[loadRoles] Error cargando roles:', err);
    const rolesList = document.getElementById('rolesList');
    if (rolesList) {
      const errorMsg = err.name === 'AbortError' ? 'timeout' : err.message;
      rolesList.innerHTML = `<p style="color:var(--cw-danger);text-align:center;padding:20px">❌ Error: ${escapeHtml(errorMsg)}</p>`;
    }
  }
}

// Crear nuevo rol
async function createRole() {
  const name = document.getElementById('adminNewRoleName')?.value?.trim();
  if (!name) {
    showAlert('Error', 'Nombre del rol requerido');
    return;
  }
  
  const description = document.getElementById('newRoleDescription')?.value?.trim() || '';
  
  // Recopilar permisos seleccionados
  const permissions = Array.from(
    document.querySelectorAll('.role-permission-checkbox:checked')
  ).map(cb => cb.getAttribute('data-permission'));
  
  if (permissions.length === 0) {
    showAlert('Advertencia', 'Selecciona al menos un permiso');
    return;
  }
  
  try {
    const response = await fetch(apiUrl('/roles'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, permissions })
    });
    
    if (!response.ok) {
      const data = await response.json();
      showAlert('Error', data.error || 'Error al crear rol');
      return;
    }
    
    // Limpiar formulario
    document.getElementById('adminNewRoleName').value = '';
    document.getElementById('newRoleDescription').value = '';
    document.querySelectorAll('.role-permission-checkbox').forEach(cb => cb.checked = false);
    
    showAlert('✓ Éxito', `Rol "${name}" creado correctamente`);
    loadRoles();
  } catch (err) {
    showAlert('Error', err.message);
  }
}

// Event listeners para la gestión de roles
document.addEventListener('click', (e) => {
  if (e.target.id === 'addRoleBtn') createRole();
  if (e.target.id === 'clearRoleFormBtn') {
    document.getElementById('newRoleName').value = '';
    document.getElementById('newRoleDescription').value = '';
    document.querySelectorAll('.role-permission-checkbox').forEach(cb => cb.checked = false);
  }
});

// ===== CARGAR ROLES EN FORMULARIO DE CREAR USUARIO =====
async function loadRolesInUserForm() {
  try {
    console.log('[loadRolesInUserForm] Iniciando carga de roles...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout (más agresivo)
    
    const response = await fetch(apiUrl('/roles?limit=100'), {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`[loadRolesInUserForm] Error ${response.status}:`, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('[loadRolesInUserForm] ✓ Roles cargados:', data.data?.length || 0);
    
    // Manejar ambos formatos: array directo o {data: [...], pagination: {...}}
    const roles = Array.isArray(data) ? data : (data.data || []);
    const container = document.getElementById('newUserRolesContainer');
    
    if (!container) return;
    
    if (roles.length === 0) {
      container.innerHTML = '<p style="color:var(--cw-text-muted);grid-column:1/-1;text-align:center;margin:0">No hay roles disponibles</p>';
      return;
    }
    
    let html = '';
    roles.forEach(role => {
      html += `
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:8px;background:var(--cw-surface);border-radius:4px;border:1px solid var(--cw-border-light);transition:all 0.2s" class="role-label">
          <input type="checkbox" class="user-role-checkbox" data-role-id="${role.id}" data-role-name="${role.name}" style="cursor:pointer;width:16px;height:16px">
          <span style="font-size:12px;font-weight:500">${escapeHtml(role.name)}</span>
        </label>
      `;
    });
    
    container.innerHTML = html;
    
    // Add hover effect listeners for role labels
    setTimeout(() => {
      const roleLabels = container.querySelectorAll('.role-label');
      roleLabels.forEach(label => {
        label.addEventListener('mouseenter', () => {
          label.style.background = 'var(--cw-primary)';
          label.style.color = 'white';
        });
        label.addEventListener('mouseleave', () => {
          label.style.background = 'var(--cw-surface)';
          label.style.color = 'inherit';
        });
      });
    }, 50);
  } catch (err) {
    console.error('Error cargando roles:', err);
  }
}

// ===== PASO 8: EDITAR PERMISOS DE USUARIOS EXISTENTES =====
async function editUserRoles(userId, userName) {
  try {
    console.log('[editUserRoles] Abriendo modal de permisos para:', { userId, userName, requestedBy: STATE.authUser?.name });
    
    // Verificar permisos
    if(!canEditUsers()) {
      await showAlert('❌ Acceso Denegado', 'No tienes permisos para editar usuarios.');
      console.warn('[editUserRoles] Acceso denegado:', { user: STATE.authUser?.name, targetUser: userName });
      return;
    }
    
    // Proteger cuenta de Administrador - verificar si el usuario a editar es admin
    try {
      const userCheckRes = await fetch(apiUrl(`/users/${userId}`));
      if (userCheckRes.ok) {
        const userToEdit = await userCheckRes.json();
        if (userToEdit.role === 'admin' && STATE.authUser.role !== 'admin') {
          await showAlert('❌ Acceso Protegido', 'No puedes modificar la cuenta de Administrador. Solo otro administrador puede hacer esto.');
          console.warn('[editUserRoles] Intento de editar admin bloqueado:', { user: STATE.authUser?.name, targetUser: userName });
          return;
        }
      }
    } catch (err) {
      console.warn('[editUserRoles] Error verificando rol del usuario:', err);
      // Continuar de todas formas
    }
    
    // Obtener todos los roles disponibles
    const rolesRes = await fetch(apiUrl('/roles'));
    if (!rolesRes.ok) {
      await showAlert('❌ Error', 'No se pudieron cargar los roles disponibles');
      return;
    }
    
    const rolesData = await rolesRes.json();
    // Manejar ambos formatos: array directo o {data: [...], pagination: {...}}
    const allRoles = Array.isArray(rolesData) ? rolesData : (rolesData.data || []);
    console.log('[editUserRoles] Roles disponibles cargados:', allRoles.length);
    
    // Obtener roles actuales del usuario
    const userRolesRes = await fetch(apiUrl(`/users/${userId}/roles`));
    const currentRoles = userRolesRes.ok ? await userRolesRes.json() : [];
    const currentRoleId = currentRoles.length > 0 ? currentRoles[0].id : null;
    
    console.log('[editUserRoles] Rol actual:', { roleId: currentRoleId, roleName: currentRoles[0]?.name });
    
    // Crear modal con ID único
    const modalId = `modal-roles-${userId}-${Date.now()}`;
    
    // Crear HTML de roles con radio buttons
    let html = '<div style="display:flex;flex-direction:column;gap:8px">';
    allRoles.forEach(role => {
      const isChecked = currentRoleId === role.id;
      html += `
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px;background:${isChecked ? 'var(--cw-primary)' : 'var(--cw-surface-dark)'};border-radius:4px;color:${isChecked ? '#fff' : 'var(--cw-text)'};transition:all 0.2s">
          <input type="radio" name="userRole" class="roleRadio" value="${role.id}" ${isChecked ? 'checked' : ''} style="cursor:pointer"> 
          <span>${role.name}</span>
        </label>
      `;
    });
    html += '</div>';
    
    // Crear modal
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.setAttribute('data-modal-type', 'roles');
    modal.setAttribute('data-user-id', userId);
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;overflow:auto;padding:20px';
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'background:var(--cw-surface);border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.3);max-width:500px;width:100%;max-height:80vh;overflow-y:auto;border:1px solid var(--cw-border)';
    
    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = 'background:var(--cw-primary);color:white;padding:20px;border-radius:12px 12px 0 0;display:flex;justify-content:space-between;align-items:center';
    titleDiv.innerHTML = `
      <h3 style="margin:0">🔑 Permisos de ${escapeHtml(userName)}</h3>
      <button class="modalCloseBtn" style="background:rgba(255,255,255,0.2);border:none;color:white;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:20px;line-height:1">✕</button>
    `;
    
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = 'padding:20px';
    contentDiv.innerHTML = `
      <p style="color:var(--cw-text-muted);font-size:12px;margin-bottom:12px">Selecciona el rol asignado (solo se puede tener 1):</p>
      ${html}
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="primary modalSaveBtn" style="flex:1;padding:8px">💾 Guardar</button>
        <button class="secondary modalCancelBtn" style="flex:1;padding:8px">Cancelar</button>
      </div>
    `;
    
    modalContent.appendChild(titleDiv);
    modalContent.appendChild(contentDiv);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Event listeners
    modal.querySelector('.modalCloseBtn')?.addEventListener('click', () => modal.remove());
    modal.querySelector('.modalCancelBtn')?.addEventListener('click', () => modal.remove());
    
    // Listener para actualizar estilos cuando se cambia el radio button
    modal.querySelectorAll('input.roleRadio').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const label = e.target.closest('label');
        // Quitar estilo de todos los labels
        modal.querySelectorAll('label').forEach(l => {
          l.style.background = 'var(--cw-surface-dark)';
          l.style.color = 'var(--cw-text)';
        });
        // Aplicar estilo al label seleccionado
        if (label) {
          label.style.background = 'var(--cw-primary)';
          label.style.color = '#fff';
        }
      });
    });
    
    modal.querySelector('.modalSaveBtn')?.addEventListener('click', async () => {
      const selectedRadio = modal.querySelector('input.roleRadio:checked');
      
      if (!selectedRadio) {
        await showAlert('⚠️ Error', 'Debes seleccionar un rol');
        return;
      }
      
      const selectedRoleId = selectedRadio.value; // NO hacer parseInt, el ID es string (UUID)
      
      try {
        console.log('[editUserRoles] Guardando rol:', selectedRoleId, 'para usuario:', userId);
        
        const saveResponse = await fetch(apiUrl(`/users/${userId}/roles`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roles: [selectedRoleId], adminId: STATE.authUser?.id })
        });
        
        console.log('[editUserRoles] Respuesta del servidor:', saveResponse.status, saveResponse.statusText);
        
        if (saveResponse.ok) {
          const responseData = await saveResponse.json();
          console.log('[editUserRoles] Respuesta JSON:', responseData);
          showAlert('✓ Éxito', 'Permiso actualizado correctamente');
          modal.remove();
          setTimeout(() => refreshUsersList(), 300);
        } else {
          const errorData = await saveResponse.json();
          console.error('[editUserRoles] Error en respuesta:', errorData);
          showAlert('Error', errorData.error || 'No se pudieron guardar los permisos');
        }
      } catch (err) {
        console.error('[editUserRoles] Error guardando:', err);
        showAlert('Error', err.message);
      }
    });
    
    // Cerrar modal al hacer click afuera
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
    
  } catch (err) {
    console.error('[editUserRoles] Error:', err);
    showAlert('Error', 'No se pudieron cargar los permisos');
  }
}

// ===== 3. ASIGNACIÓN DE ESPECIALIDADES =====
async function editUserSpecialties(userId) {
  try {
    // Proteger cuenta de Administrador
    const userCheckRes = await fetch(apiUrl(`/users/${userId}`));
    if (userCheckRes.ok) {
      const userToEdit = await userCheckRes.json();
      if (userToEdit.role === 'admin' && STATE.authUser.role !== 'admin') {
        await showAlert('❌ Acceso Protegido', 'No puedes modificar las especialidades del Administrador. Solo otro administrador puede hacer esto.');
        console.warn('[editUserSpecialties] Intento de editar especialidades del admin bloqueado:', { user: STATE.authUser?.name, targetUser: userToEdit.username });
        return;
      }
    }
    
    // Especialidades disponibles
    const specialties = [
      'Fibra Óptica (GPON)',
      'Aire/Móvil',
      'Soporte Técnico',
      'Instalación',
      'Facturación',
      'Atención al Cliente'
    ];
    
    // Obtener especialidades actuales del usuario
    const response = await fetch(apiUrl(`/users/${userId}`));
    if (!response.ok) {
      throw new Error('No se pudo obtener el usuario');
    }
    
    const user = await response.json();
    let currentSpecialties = [];
    
    // Parsear especialidades (pueden ser JSON array o string)
    if (user.specialties) {
      try {
        // Intentar parsear como JSON
        currentSpecialties = typeof user.specialties === 'string' ? JSON.parse(user.specialties) : user.specialties;
      } catch (e) {
        // Si no es JSON, intentar split por comas
        currentSpecialties = typeof user.specialties === 'string' ? user.specialties.split(',').map(s => s.trim()) : [];
      }
    }
    
    console.log('[editUserSpecialties] Especialidades actuales:', currentSpecialties);
    
    // Crear modal con ID único
    const modalId = `modal-spec-${userId}-${Date.now()}`;
    
    // Crear HTML de especialidades
    let html = '<div style="display:flex;flex-direction:column;gap:8px">';
    specialties.forEach(spec => {
      const isChecked = currentSpecialties.includes(spec);
      html += `
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px;background:${isChecked ? 'var(--cw-primary)' : 'var(--cw-surface-dark)'};border-radius:4px;color:${isChecked ? '#fff' : 'var(--cw-text)'};transition:all 0.2s">
          <input type="checkbox" class="specialtyCheckbox" value="${spec}" ${isChecked ? 'checked' : ''} style="cursor:pointer"> 
          <span>${spec}</span>
        </label>
      `;
    });
    html += '</div>';
    
    // Crear modal
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.setAttribute('data-modal-type', 'specialties');
    modal.setAttribute('data-user-id', userId);
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;overflow:auto;padding:20px';
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'background:var(--cw-surface);border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.3);max-width:500px;width:100%;max-height:80vh;overflow-y:auto;border:1px solid var(--cw-border)';
    
    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = 'background:var(--cw-primary);color:white;padding:20px;border-radius:12px 12px 0 0;display:flex;justify-content:space-between;align-items:center';
    titleDiv.innerHTML = `
      <h3 style="margin:0">📋 Especialidades</h3>
      <button class="modalCloseBtn" style="background:rgba(255,255,255,0.2);border:none;color:white;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:20px;line-height:1">✕</button>
    `;
    
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = 'padding:20px';
    contentDiv.innerHTML = `
      <p style="color:var(--cw-text-muted);font-size:12px;margin-bottom:12px">Selecciona/deselecciona las especialidades asignadas:</p>
      ${html}
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="primary modalSaveBtn" style="flex:1;padding:8px">Guardar</button>
        <button class="secondary modalCancelBtn" style="flex:1;padding:8px">Cancelar</button>
      </div>
    `;
    
    modalContent.appendChild(titleDiv);
    modalContent.appendChild(contentDiv);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Event listeners
    modal.querySelector('.modalCloseBtn')?.addEventListener('click', () => modal.remove());
    modal.querySelector('.modalCancelBtn')?.addEventListener('click', () => modal.remove());
    
    // Listener para actualizar estilos cuando se hace click en checkbox
    modal.querySelectorAll('input.specialtyCheckbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const label = e.target.closest('label');
        if (label) {
          if (e.target.checked) {
            label.style.background = 'var(--cw-primary)';
            label.style.color = '#fff';
          } else {
            label.style.background = 'var(--cw-surface-dark)';
            label.style.color = 'var(--cw-text)';
          }
        }
      });
    });
    
    modal.querySelector('.modalSaveBtn')?.addEventListener('click', async () => {
      const selected = Array.from(modal.querySelectorAll('input.specialtyCheckbox:checked')).map(cb => cb.value);
      
      try {
        const saveResponse = await fetch(apiUrl(`/users/${userId}/specialties`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ specialties: selected })
        });
        
        if (saveResponse.ok) {
          showAlert('✓ Éxito', 'Especialidades actualizadas correctamente');
          modal.remove();
          setTimeout(() => refreshUsersList(), 300);
        } else {
          showAlert('Error', 'No se pudieron guardar las especialidades');
        }
      } catch (err) {
        showAlert('Error', err.message);
        console.error('[editUserSpecialties] Error guardando:', err);
      }
    });
    
    // Cerrar modal al hacer click afuera
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
    
  } catch (err) {
    showAlert('Error', 'No se pudieron cargar las especialidades');
    console.error('[editUserSpecialties] Error:', err);
  }
}

// ===== 4. REGISTRO DE ACTIVIDAD (AUDITORIA) =====
// Traducir acciones de auditoría
function translateAction(action) {
  const translations = {
    'login': 'Inicio de sesión',
    'login_failed': 'Fallo de inicio',
    'login_failed_inactive': 'Login fallido (inactivo)',
    'logout': 'Cierre de sesión',
    'password_reset': 'Reset de contraseña',
    'password_changed': 'Contraseña cambiada',
    'specialties_updated': 'Especialidades actualizadas',
    'specialties_assigned': 'Especialidades asignadas',
    'deactivated': 'Desactivado',
    'deactivate': 'Desactivado',
    'reactivated': 'Reactivado',
    'activate': 'Reactivado',
    'create_user': 'Usuario creado',
    'delete_user': 'Usuario eliminado',
    'role_created': 'Rol creado',
    'role_deleted': 'Rol eliminado'
  };
  return translations[action] || action;
}

async function loadAuditLog() {
  try {
    // Cargar todos los usuarios para el filtro
    const usersResponse = await fetch(apiUrl('/users'));
    const usersData = usersResponse.ok ? await usersResponse.json() : {};
    const allUsers = Array.isArray(usersData) ? usersData : (usersData.data || []);
    
    const userSelect = document.getElementById('auditFilterUser');
    if (userSelect) {
      const currentValue = userSelect.value;
      userSelect.innerHTML = '<option value="">👥 Todos los usuarios</option>';
      allUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.name || user.username} (${user.email})`;
        userSelect.appendChild(option);
      });
      userSelect.value = currentValue;
    }

    // Cargar logs
    const response = await fetch(apiUrl('/audit-log?limit=100'));
    if (!response.ok) return;
    
    let logs = await response.json();
    const auditList = document.getElementById('auditLogList');
    
    // Aplicar filtros
    const filterUserId = document.getElementById('auditFilterUser')?.value || '';
    const filterAction = document.getElementById('auditFilterAction')?.value || '';
    
    if (filterUserId) {
      logs = logs.filter(log => log.user_id === filterUserId);
    }
    if (filterAction) {
      logs = logs.filter(log => log.action === filterAction);
    }
    
    if (logs.length === 0) {
      auditList.innerHTML = `
        <div style="text-align:center;padding:40px;color:var(--cw-text-muted)">
          <div style="font-size:48px;margin-bottom:12px">📭</div>
          <div style="font-size:14px">No hay registro de actividad</div>
        </div>
      `;
      return;
    }
    
    // Crear tabla profesional
    let html = `
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead style="background:var(--cw-surface-dark);border-bottom:2px solid var(--cw-border-light)">
            <tr>
              <th style="padding:12px;text-align:left;color:var(--cw-text-muted);font-weight:600;width:30%">Acción</th>
              <th style="padding:12px;text-align:left;color:var(--cw-text-muted);font-weight:600;width:20%">Usuario</th>
              <th style="padding:12px;text-align:left;color:var(--cw-text-muted);font-weight:600;width:30%">Descripción</th>
              <th style="padding:12px;text-align:left;color:var(--cw-text-muted);font-weight:600;width:20%">Fecha/Hora</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    logs.forEach(log => {
      const date = new Date(log.createdAt);
      const dateStr = date.toLocaleDateString('es-ES');
      const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const translatedAction = translateAction(log.action);
      const user = allUsers.find(u => u.id === log.user_id);
      const userName = user?.name || user?.username || 'Desconocido';
      const bgColor = logs.indexOf(log) % 2 === 0 ? 'transparent' : 'var(--cw-surface-dark)';
      
      // Icono según acción
      let icon = '📝';
      if (log.action.includes('login')) icon = '🔓';
      if (log.action.includes('password')) icon = '🔐';
      if (log.action.includes('delete')) icon = '🗑️';
      if (log.action.includes('deactivat')) icon = '🚫';
      if (log.action.includes('reactivat')) icon = '✅';
      
      html += `
        <tr style="border-bottom:1px solid var(--cw-border-light);background:${bgColor};transition:background 0.2s;cursor:pointer" class="audit-log-row" data-original-bg="${bgColor}">
          <td style="padding:12px">
            <span style="display:inline-block;padding:4px 8px;background:var(--cw-primary);color:white;border-radius:4px;font-weight:600">
              ${icon} ${translatedAction}
            </span>
          </td>
          <td style="padding:12px;color:var(--cw-text)">${userName}</td>
          <td style="padding:12px;color:var(--cw-text-muted);font-size:12px">${log.description || '-'}</td>
          <td style="padding:12px;color:var(--cw-text-muted);white-space:nowrap">${dateStr} <span style="color:var(--cw-primary);font-weight:600">${timeStr}</span></td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
    `;
    
    auditList.innerHTML = html;
    
    // Add hover effect listeners for audit log rows
    setTimeout(() => {
      const auditRows = auditList.querySelectorAll('.audit-log-row');
      auditRows.forEach(row => {
        row.addEventListener('mouseenter', () => {
          row.style.background = 'var(--cw-surface-dark)';
        });
        row.addEventListener('mouseleave', () => {
          row.style.background = row.dataset.originalBg;
        });
      });
    }, 50);
  } catch (err) {
    console.error('Error cargando audit log:', err);
  }
}

// ===== 5. RESETEAR CONTRASEÑA DESDE ADMIN =====
async function resetUserPassword(userId, username) {
  try {
    // Proteger cuenta de Administrador
    const userCheckRes = await fetch(apiUrl(`/users/${userId}`));
    if (userCheckRes.ok) {
      const userToEdit = await userCheckRes.json();
      if (userToEdit.role === 'admin' && STATE.authUser.role !== 'admin') {
        await showAlert('❌ Acceso Protegido', 'No puedes cambiar la contraseña del Administrador. Solo otro administrador puede hacer esto.');
        console.warn('[resetUserPassword] Intento de cambiar contraseña del admin bloqueado:', { user: STATE.authUser?.name, targetUser: username });
        return;
      }
    }
    
    if (!confirm(`¿Resetear contraseña de "${username}"?\n\nSe enviará una contraseña temporal al email del usuario.`)) return;
    
    const response = await fetch(apiUrl(`/users/${userId}/reset-password`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId: STATE.authUser?.id })
    });
    
    if (!response.ok) {
      const data = await response.json();
      showAlert('Error', data.error || 'Error al resetear contraseña');
      return;
    }
    
    const data = await response.json();
    const tempPass = data.tempPassword || '(revisar email)';
    showAlert('✓ Éxito', `Contraseña reseteada.\n\nContraseña temporal: ${tempPass}\n\nEl usuario recibirá un email de confirmación.`);
    refreshUsersList();
  } catch (err) {
    showAlert('Error', err.message);
  }
}

// ===== SEGUIMIENTO DE ACTIVIDAD EN TIEMPO REAL =====

// Variable global para almacenar el intervalo de polling
let activityPollingInterval = null;

// PASO 9: Auto-refresh de listas (cada 5 segundos)
let dataRefreshInterval = null;

function startDataRefresh() {
  if (dataRefreshInterval) return;
  
  console.log('[PASO 9] Iniciando auto-refresh de datos cada 5 segundos');
  
  dataRefreshInterval = setInterval(() => {
    // Refrescar roles en formulario de crear usuario si la pestaña está abierta
    if (!document.getElementById('users-roles-tab')?.classList.contains('hidden')) {
      loadRolesInUserForm();
    }
  }, 5000);
}

function stopDataRefresh() {
  if (dataRefreshInterval) {
    clearInterval(dataRefreshInterval);
    dataRefreshInterval = null;
  }
}
async function checkIfUserDeactivated() {
  if (!STATE.authUser?.id) return;
  
  try {
    const response = await fetch(apiUrl('/users'));
    if (!response.ok) return;
    
    const data = await response.json();
    const users = Array.isArray(data) ? data : [];
    if (users.length === 0) return;
    
    const currentUser = users.find(u => u.id === STATE.authUser.id);
    
    if (!currentUser || currentUser.active === 0 || currentUser.active === false) {
      console.warn('[PASO 9] Usuario desactivado. Desconectando...');
      showAlert('⚠️ Sesión cerrada', 'Tu cuenta ha sido desactivada. Serás desconectado.');
      setTimeout(() => {
        logout();
      }, 2000);
    }
  } catch (err) {
    console.error('[checkIfUserDeactivated] Error:', err);
  }
}

// Iniciar polling de actividad (cada 5 segundos para real-time)
function startActivityPolling() {
  if (activityPollingInterval) return; // Evitar múltiples polling
  
  console.log('[Activity Polling] Iniciando polling cada 5 segundos (PASO 9: Real-time)');
  
  // Actualizar inmediatamente
  checkIfUserDeactivated();
  
  // Luego cada 5 segundos para real-time
  activityPollingInterval = setInterval(() => {
    checkIfUserDeactivated();
  }, 5000);
}

// Detener polling de actividad
function stopActivityPolling() {
  if (activityPollingInterval) {
    clearInterval(activityPollingInterval);
    activityPollingInterval = null;
    console.log('[Activity Polling] Polling detenido');
  }
}

// Reportar actividad del usuario actual
async function reportUserActivity() {
  if (!STATE.authUser?.id) return;
  
  try {
    await fetch(apiUrl(`/users/${STATE.authUser.id}/activity`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    // Silenciosamente ignorar errores en reporting de actividad
  }
}

// ===== 6. DESACTIVAR USUARIOS (SOFT DELETE) =====

// ===== 7. ESTADÍSTICAS DE USO POR USUARIO =====
async function loadUserStats() {
  try {
    const response = await fetch(apiUrl('/users'));
    if (!response.ok) return;
    
    const data = await response.json();
    const users = Array.isArray(data) ? data : (data.data || []);
    const select = document.getElementById('statsUserSelect');
    const panel = document.getElementById('userStatsPanel');
    
    select.innerHTML = '<option value="">👤 Selecciona un usuario...</option>';
    users.forEach(user => {
      const opt = document.createElement('option');
      opt.value = user.id;
      opt.textContent = `${user.name || user.username}`;
      select.appendChild(opt);
    });
    
    // Panel inicial vacío
    panel.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(250px, 1fr));gap:16px;padding:24px;text-align:center;color:var(--cw-text-muted)">
        <div style="grid-column:1/-1;font-size:48px;margin-bottom:12px">📊</div>
        <div style="grid-column:1/-1">Selecciona un usuario para ver sus estadísticas</div>
      </div>
    `;
    
    select.addEventListener('change', async () => {
      if (!select.value) {
        panel.innerHTML = `
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(250px, 1fr));gap:16px;padding:24px;text-align:center;color:var(--cw-text-muted)">
            <div style="grid-column:1/-1;font-size:48px;margin-bottom:12px">📊</div>
            <div style="grid-column:1/-1">Selecciona un usuario para ver sus estadísticas</div>
          </div>
        `;
        return;
      }
      
      panel.innerHTML = '<div style="text-align:center;padding:40px"><div style="font-size:20px">⏳ Cargando...</div></div>';
      
      try {
        const user = users.find(u => u.id === select.value);
        const statsResponse = await fetch(apiUrl(`/users/${select.value}/statistics`));
        if (!statsResponse.ok) {
          panel.innerHTML = '<div style="color:red;padding:20px">Error al cargar estadísticas</div>';
          return;
        }
        
        const statsData = await statsResponse.json();
        const stats = statsData.statistics;
        const userData = statsData.user;
        
        // Determinar color de estado
        const statusColor = stats.accountStatus === 'active' ? '#22c55e' : '#ef4444';
        const statusText = stats.accountStatus === 'active' ? '✅ Activo' : '❌ Inactivo';
        
        let html = `
          <div style="padding:24px">
            <!-- Encabezado del usuario -->
            <div style="background:linear-gradient(135deg, var(--cw-primary), var(--cw-primary-dark));padding:20px;border-radius:8px;margin-bottom:24px;color:white">
              <div style="font-size:24px;font-weight:700;margin-bottom:4px">${userData.username}</div>
              <div style="font-size:13px;opacity:0.9;margin-bottom:12px">${userData.email}</div>
              <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
                <span style="display:inline-block;padding:6px 12px;background:rgba(255,255,255,0.2);border-radius:4px;font-size:12px;font-weight:600">${statusText}</span>
                <span style="display:inline-block;padding:6px 12px;background:rgba(255,255,255,0.2);border-radius:4px;font-size:12px">👤 ${stats.accountAge}</span>
              </div>
            </div>
            
            <!-- Grid de estadísticas -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;margin-bottom:24px">
              <!-- Tarjeta: Estado de cuenta -->
              <div style="background:var(--cw-surface-dark);border-radius:8px;padding:20px;border-left:4px solid ${statusColor}">
                <div style="font-size:12px;color:var(--cw-text-muted);font-weight:600;margin-bottom:8px">📋 Estado</div>
                <div style="font-size:20px;font-weight:700;color:${statusColor}">${statusText}</div>
                <div style="font-size:11px;color:var(--cw-text-muted);margin-top:8px">
                  Creada hace: ${stats.accountAge}
                </div>
              </div>
              
              <!-- Tarjeta: Acciones registradas -->
              <div style="background:var(--cw-surface-dark);border-radius:8px;padding:20px;border-left:4px solid #3b82f6">
                <div style="font-size:12px;color:var(--cw-text-muted);font-weight:600;margin-bottom:8px">📊 Actividades</div>
                <div style="font-size:20px;font-weight:700;color:#3b82f6">${stats.totalActions}</div>
                <div style="font-size:11px;color:var(--cw-text-muted);margin-top:8px">
                  Acciones en el sistema
                </div>
              </div>
              
              <!-- Tarjeta: Último acceso -->
              <div style="background:var(--cw-surface-dark);border-radius:8px;padding:20px;border-left:4px solid #a855f7">
                <div style="font-size:12px;color:var(--cw-text-muted);font-weight:600;margin-bottom:8px">🕐 Último acceso</div>
                <div style="font-size:13px;font-weight:600;color:#a855f7;margin-top:8px">
                  ${stats.lastAction ? new Date(stats.lastAction).toLocaleString('es-ES') : '👤 Nunca'}
                </div>
              </div>
              
              <!-- Tarjeta: Especialidades -->
              <div style="background:var(--cw-surface-dark);border-radius:8px;padding:20px;border-left:4px solid #f59e0b;grid-column:1/-1">
                <div style="font-size:12px;color:var(--cw-text-muted);font-weight:600;margin-bottom:12px">🎯 Especialidades</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                  ${stats.specialties.length > 0 
                    ? stats.specialties.map(s => `
                        <span style="display:inline-block;padding:6px 12px;background:var(--cw-primary);color:white;border-radius:4px;font-size:12px;font-weight:600">
                          ${s}
                        </span>
                      `).join('')
                    : '<span style="color:var(--cw-text-muted);font-size:12px">Ninguna asignada</span>'
                  }
                </div>
              </div>
            </div>
            
            <!-- Sección de auditoría del usuario -->
            <div style="background:var(--cw-surface-dark);border-radius:8px;padding:20px;margin-top:24px">
              <div style="font-size:14px;font-weight:700;color:var(--cw-text);margin-bottom:16px">📜 Histórico de actividad</div>
              <div id="userAuditLog" style="max-height:300px;overflow-y:auto"></div>
            </div>
          </div>
        `;
        
        panel.innerHTML = html;
        
        // Cargar auditoría del usuario específico
        loadUserAuditLog(select.value);
      } catch (err) {
        console.error('Error cargando estadísticas:', err);
        panel.innerHTML = '<div style="color:red;padding:20px">Error: ' + err.message + '</div>';
      }
    });
  } catch (err) {
    console.error('Error cargando usuarios para stats:', err);
  }
}

// Cargar auditoría específica de un usuario
async function loadUserAuditLog(userId) {
  try {
    const response = await fetch(apiUrl(`/users/${userId}/audit-log?limit=20`));
    if (!response.ok) return;
    
    const logs = await response.json();
    const logContainer = document.getElementById('userAuditLog');
    
    if (logs.length === 0) {
      logContainer.innerHTML = '<div style="color:var(--cw-text-muted);text-align:center;padding:20px">Sin registros</div>';
      return;
    }
    
    let html = '<div style="display:flex;flex-direction:column;gap:8px">';
    logs.forEach(log => {
      const date = new Date(log.createdAt);
      const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const dateStr = date.toLocaleDateString('es-ES');
      const translatedAction = translateAction(log.action);
      
      // Icono según acción
      let icon = '📝';
      if (log.action.includes('login')) icon = '🔓';
      if (log.action.includes('password')) icon = '🔐';
      if (log.action.includes('delete')) icon = '🗑️';
      if (log.action.includes('deactivat')) icon = '🚫';
      if (log.action.includes('reactivat')) icon = '✅';
      
      html += `
        <div style="padding:10px;background:rgba(0,0,0,0.1);border-radius:4px;border-left:3px solid var(--cw-primary);font-size:12px">
          <div style="font-weight:600;color:var(--cw-primary)">${icon} ${translatedAction}</div>
          <div style="color:var(--cw-text-muted);margin-top:2px;font-size:11px">${log.description || '-'}</div>
          <div style="color:var(--cw-text-muted);margin-top:4px;font-size:10px">${dateStr} ${timeStr}</div>
        </div>
      `;
    });
    html += '</div>';
    
    logContainer.innerHTML = html;
  } catch (err) {
    console.error('Error cargando audit log del usuario:', err);
  }
}

// Removed: updateUserListWithNewButtons() - functionality is already in refreshUsersList()

// Change user role

// Admin: open manual editor modal and populate fields
function openManualEditor(){
  if(!STATE.current) { alert('Abre un manual antes de editar.'); return; }
  
  // Verificar permisos con lógica granular
  const isOwnManual = STATE.current.created_by === STATE.authUser?.id || STATE.current.created_by === STATE.authUser?.username;
  const canEdit = canEditManuals(isOwnManual);
  const canDelete = canDeleteManuals(isOwnManual);
  
  if (!canEdit) { 
    alert('No tienes permisos para editar este manual.'); 
    return; 
  }
  
  if(!els.manualEditorModal) return;
  const m = STATE.current;
  els.editTitle.value = m.title || '';
  els.editSummary.value = m.summary || '';
  // populate step editor UI
  renderEditorSteps(m.steps || []);
  renderEditorVersions(m.id);
  
  // Mostrar/ocultar botón de eliminar basado en permisos
  if (els.deleteManualBtn) {
    els.deleteManualBtn.style.display = canDelete ? 'block' : 'none';
  }
  
  els.manualEditorModal.classList.remove('hidden');
}

// Save manual edits (store in STATE.manualOverrides and persist)
function saveManualEdits(){
  if(!STATE.current) return; if(!els.editTitle) return;
  if(!(STATE.authUser && STATE.authUser.role === 'admin')){ alert('Solo administradores pueden guardar cambios.'); return; }
  const id = STATE.current.id;
  const title = els.editTitle.value.trim();
  const summary = els.editSummary.value.trim();
  const isPrivate = document.getElementById('editManualPrivate').checked;
  // collect steps from structured editor
  let steps;
  try{ steps = collectStepsFromEditor(); }catch(e){ alert('Error: pasos inválidos. Revisa cada paso.'); return; }
  // push previous snapshot to versions
  try{ pushManualVersion(id, {title: STATE.current.title, summary: STATE.current.summary, steps: STATE.current.steps || []}); }catch(e){}
  const override = { title, summary, steps, is_private: isPrivate };
  STATE.manualOverrides = STATE.manualOverrides || {};
  STATE.manualOverrides[id] = override;
  localStorage.setItem('cw:manualOverrides', JSON.stringify(STATE.manualOverrides));
  
  // also update in-memory manuals list so UI reflects changes immediately
  const idx = STATE.manuals.findIndex(x=>x.id === id);
  if(idx !== -1){
    STATE.manuals[idx] = Object.assign({}, STATE.manuals[idx], override);
  }
  
  // refresh current view
  STATE.current = Object.assign({}, STATE.current, override);
  els.manualEditorModal.classList.add('hidden');
  els.manualTitle.textContent = STATE.current.title;
  renderSteps(STATE.current);
  renderVersions(STATE.current);
  
  // Save ONLY to backend - BD es la fuente de verdad
  try {
    fetch(apiUrl(`/manuals/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        summary,
        steps,
        is_private: isPrivate,
        versions: STATE.current.versions || [],
        category: STATE.current.category,
        role: STATE.current.role,
        type: STATE.current.type,
        tags: STATE.current.tags || []
      })
    }).then(r => {
      if (r.ok) console.log('✓ Manual guardado en servidor');
      else console.error('❌ Error al guardar en servidor:', r.status);
    }).catch(err => console.error('❌ Error de conexión al guardar:', err));
  } catch (err) {
    console.error('❌ Error saving to backend:', err);
  }
  
  // FASE 6: Notificar a otros usuarios que el manual fue actualizado
  notifyManualUpdated(STATE.current);
  pushNotification({title:'Manual actualizado', text: `${title}`});
}

async function deleteManual(id){
  // Verificar permisos
  if(!canDeleteManuals()) {
    await showAlert('❌ Acceso Denegado', 'No tienes permisos para eliminar manuales.');
    console.warn('[deleteManual] Acceso denegado:', { user: STATE.authUser?.name, manualId: id });
    return;
  }
  
  // Obtener título del manual antes de borrarlo (para notificación)
  const manualToDelete = STATE.manuals.find(m => m.id === id);
  const manualTitle = manualToDelete ? manualToDelete.title : id;
  
  // Confirmar eliminación
  const confirmed = await showConfirm(
    '⚠️ Confirmar Eliminación',
    `¿Estás seguro de que deseas eliminar el manual "${manualTitle}"? Esta acción no se puede deshacer.`
  );
  
  if (!confirmed) {
    console.log('[deleteManual] Eliminación cancelada por el usuario');
    return;
  }
  
  console.log('[deleteManual] Eliminando manual:', { id, title: manualTitle, user: STATE.authUser?.name });
  
  try {
    // Eliminar de la base de datos
    await api.deleteManual(id);
    
    // Actualizar estado y UI
    STATE.manuals = STATE.manuals.filter(m => m.id !== id);
    
    // Eliminar del historial
    STATE.history = STATE.history.filter(h => h.id !== id);
    localStorage.setItem('cw:history', JSON.stringify(STATE.history));
    
    // Cerrar modal del editor si está abierto
    if (els.manualEditorModal) {
      els.manualEditorModal.classList.add('hidden');
    }
    
    // Si el manual eliminado era el actualmente abierto, cerrarlo
    if (STATE.current && STATE.current.id === id) {
      STATE.current = null;
      if (els.manualView) els.manualView.classList.add('hidden');
      const ml = document.getElementById('manualsListView'); 
      if (ml) ml.classList.remove('hidden');
    }
    
    renderManualsList(STATE.manuals);
    renderHistory();
    
    // Actualizar filtros para eliminar roles/tipos/categorías sin manuales
    updateAdvancedFilterOptions();
    
    console.log('[deleteManual] ✓ Manual eliminado exitosamente:', { id, title: manualTitle });
    pushNotificationToPanel({
      type: 'manual_deleted',
      icon: '🗑️',
      title: 'Manual Eliminado',
      message: manualTitle,
      toastDuration: 4000
    });
  } catch (err) {
    console.error('Error eliminando manual:', err);
    alert('Error eliminando manual: ' + err.message);
  }
}

// ============================================
// MANUAL SHARING FUNCTIONS (TASK 6)
// ============================================

/**
 * Open the share manual modal and load current shares
 */
async function openShareManualModal(manualId) {
  const modal = document.getElementById('shareManualModal');
  const manual = STATE.manuals.find(m => m.id === manualId);
  
  if (!modal || !manual) {
    console.error('Modal or manual not found');
    return;
  }
  
  console.log('[openShareManualModal] Opening for manual:', { manualId, title: manual.title });
  
  // Store the manual ID in the modal
  document.getElementById('shareManualId').value = manualId;
  
  // Clear inputs
  document.getElementById('shareManualEmail').value = '';
  document.getElementById('shareManualPermission').value = 'viewer';
  
  // Load existing shares
  await loadManualShares(manualId);
  
  // Show modal
  modal.classList.remove('hidden');
}

/**
 * Load and display current manual shares
 */
async function loadManualShares(manualId) {
  console.log('[loadManualShares] Loading shares for manual:', manualId);
  
  const sharesList = document.getElementById('manualSharesList');
  if (!sharesList) return;
  
  sharesList.innerHTML = '<div style="padding:20px;text-align:center;color:var(--cw-text-muted);font-size:12px">Cargando usuarios...</div>';
  
  try {
    // Fetch manual shares from API
    const response = await fetch(apiUrl(`/api/manuals/${manualId}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const shares = data.shares || [];
    
    console.log('[loadManualShares] Loaded shares:', shares);
    
    if (shares.length === 0) {
      sharesList.innerHTML = '<div style="padding:20px;text-align:center;color:var(--cw-text-muted);font-size:12px">Este manual aún no ha sido compartido</div>';
      return;
    }
    
    // Render shares list
    sharesList.innerHTML = '';
    shares.forEach(share => {
      const shareItem = document.createElement('div');
      shareItem.style.cssText = 'display:flex;align-items:center;gap:12px;padding:12px;border-bottom:1px solid var(--cw-border)';
      
      // User info
      const userInfo = document.createElement('div');
      userInfo.style.flex = '1';
      userInfo.style.minWidth = '0';
      userInfo.innerHTML = `
        <div style="font-size:12px;font-weight:600;color:var(--cw-text)">${share.user_email || 'Usuario'}</div>
        <div style="font-size:11px;color:var(--cw-text-muted)">Nivel: <strong>${share.permission_level || 'viewer'}</strong></div>
      `;
      shareItem.appendChild(userInfo);
      
      // Revoke button
      const revokeBtn = document.createElement('button');
      revokeBtn.style.cssText = 'padding:6px 12px;background:#ef4444;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600';
      revokeBtn.textContent = 'Revocar';
      revokeBtn.addEventListener('click', () => revokeManualShare(manualId, share.id));
      shareItem.appendChild(revokeBtn);
      
      sharesList.appendChild(shareItem);
    });
  } catch (err) {
    console.error('[loadManualShares] Error:', err);
    sharesList.innerHTML = '<div style="padding:20px;text-align:center;color:#ef4444;font-size:12px">Error al cargar compartidos</div>';
  }
}

/**
 * Share a manual with a user
 */
async function shareManual(manualId, email, permissionLevel) {
  if (!email || !permissionLevel) {
    await showAlert('⚠️ Campos Requeridos', 'Por favor completa email y nivel de permiso');
    return;
  }
  
  console.log('[shareManual] Sharing manual:', { manualId, email, permissionLevel });
  
  try {
    const response = await fetch(apiUrl(`/api/manuals/${manualId}/share`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        permission_level: permissionLevel
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log('[shareManual] ✓ Manual compartido exitosamente:', result);
    
    // Clear input
    document.getElementById('shareManualEmail').value = '';
    document.getElementById('shareManualPermission').value = 'viewer';
    
    // Reload shares list
    await loadManualShares(manualId);
    
    // Show success message
    await showAlert('✓ Compartido', `Manual compartido con ${email}`);
    
  } catch (err) {
    console.error('[shareManual] Error:', err);
    await showAlert('❌ Error', err.message || 'Error al compartir manual');
  }
}

/**
 * Revoke a manual share
 */
async function revokeManualShare(manualId, shareId) {
  if (!shareId) return;
  
  const confirmed = await showConfirm(
    '⚠️ Confirmar Revocación',
    '¿Estás seguro de que deseas revocar el acceso a este usuario?'
  );
  
  if (!confirmed) return;
  
  console.log('[revokeManualShare] Revoking share:', { manualId, shareId });
  
  try {
    const response = await fetch(apiUrl(`/api/manuals/${manualId}/share/${shareId}`), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    console.log('[revokeManualShare] ✓ Acceso revocado exitosamente');
    
    // Reload shares list
    await loadManualShares(manualId);
    
    // Show success message
    await showAlert('✓ Revocado', 'Acceso revocado correctamente');
    
  } catch (err) {
    console.error('[revokeManualShare] Error:', err);
    await showAlert('❌ Error', 'Error al revocar acceso');
  }
}

// Editor helpers
function renderEditorSteps(steps){
  if(!els.editStepsList) return;
  els.editStepsList.innerHTML = '';
  (steps||[]).forEach((s, idx)=>{
    const row = document.createElement('div'); row.style.display='flex'; row.style.gap='8px'; row.style.alignItems='flex-start';
    const title = document.createElement('input'); title.className='input-field'; title.placeholder = 'Título del paso'; title.value = s.title || '';
    title.style.flex = '0 0 220px';
    const content = document.createElement('textarea'); content.className='input-field'; content.style.flex = '1'; content.style.minHeight='70px'; content.value = s.content || '';
    const del = document.createElement('button'); del.className='secondary'; del.textContent='Eliminar'; del.style.flex='0 0 auto';
    del.addEventListener('click', ()=>{ row.remove(); });
    row.appendChild(title); row.appendChild(content); row.appendChild(del);
    // attach dataset index for ordering if needed
    els.editStepsList.appendChild(row);
  });
}

function addEditorStep(){
  const s = {title:'Paso nuevo', content:''};
  const prev = Array.from(els.editStepsList.children).length;
  renderEditorSteps([...(getEditorStepsArray()), s]);
}

function getEditorStepsArray(){
  if(!els.editStepsList) return [];
  return Array.from(els.editStepsList.children).map(row=>{
    const inputs = row.querySelectorAll('input, textarea');
    return { title: (inputs[0] && inputs[0].value) || '', content: (inputs[1] && inputs[1].value) || '' };
  });
}

function collectStepsFromEditor(){
  return getEditorStepsArray();
}

// Versioning helpers
function pushManualVersion(manualId, snapshot){
  try{
    const versions = JSON.parse(localStorage.getItem('cw:manualVersions')||'{}');
    versions[manualId] = versions[manualId] || [];
    versions[manualId].unshift({at: Date.now(), snapshot});
    // keep max 20
    versions[manualId] = versions[manualId].slice(0,20);
    localStorage.setItem('cw:manualVersions', JSON.stringify(versions));
    renderEditorVersions(manualId);
  }catch(e){ console.error('pushManualVersion err', e); }
}

function renderEditorVersions(manualId){
  if(!els.editVersionsList) return;
  const versions = JSON.parse(localStorage.getItem('cw:manualVersions')||'{}')[manualId] || [];
  els.editVersionsList.innerHTML = '';
  if(!versions.length){ els.editVersionsList.textContent = 'Sin versiones anteriores.'; return; }
  versions.forEach((v, idx)=>{
    const div = document.createElement('div'); div.className='panel'; div.style.display='flex'; div.style.justifyContent='space-between'; div.style.alignItems='center';
    const meta = document.createElement('div'); meta.innerHTML = `<strong>${new Date(v.at).toLocaleString()}</strong><div class="small muted">${(v.snapshot.title||'')}</div>`;
    const controls = document.createElement('div'); controls.style.display='flex'; controls.style.gap='6px';
    const revert = document.createElement('button'); revert.className='small-btn'; revert.textContent='Revertir';
    revert.addEventListener('click', async ()=>{ if(await showConfirm('Revertir versión', '¿Revertir a esta versión del manual?')) revertToVersion(manualId, idx); });
    const exp = document.createElement('button'); exp.className='secondary'; exp.textContent='Exportar';
    exp.addEventListener('click', ()=>{ const blob = new Blob([JSON.stringify(v.snapshot,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`${manualId}-version-${v.at}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); });
    controls.appendChild(revert); controls.appendChild(exp);
    div.appendChild(meta); div.appendChild(controls);
    els.editVersionsList.appendChild(div);
  });
}

function revertToVersion(manualId, index){
  const versions = JSON.parse(localStorage.getItem('cw:manualVersions')||'{}')[manualId] || [];
  const v = versions[index]; if(!v) return alert('Versión no encontrada');
  // apply snapshot to overrides and to STATE.manuals
  STATE.manualOverrides = STATE.manualOverrides || {};
  STATE.manualOverrides[manualId] = { title: v.snapshot.title, summary: v.snapshot.summary, steps: v.snapshot.steps };
  localStorage.setItem('cw:manualOverrides', JSON.stringify(STATE.manualOverrides));
  // update manuals array
  const idx = STATE.manuals.findIndex(m=>m.id === manualId);
  if(idx !== -1){ STATE.manuals[idx] = Object.assign({}, STATE.manuals[idx], STATE.manualOverrides[manualId]); }
  STATE.current = Object.assign({}, STATE.current, STATE.manualOverrides[manualId]);
  renderManualsList(STATE.manuals);
  renderSteps(STATE.current);
  renderEditorSteps(STATE.current.steps || []);
  renderEditorVersions(manualId);
  pushNotification({title:'Manual revertido', text:`Revertido a versión guardada ${new Date(v.at).toLocaleString()}`});
}

function exportCurrentManual(){
  if(!STATE.current) return;
  // FASE 8: Exportar a PDF mejorado en lugar de JSON
  exportManualToPDF(STATE.current);
}

// Edit step modal for admins
function openEditStepModal(manual, stepIdx, step) {
  // Normalize: ensure manual has 'steps' field
  if (!manual.steps && manual.content) {
    manual.steps = manual.content;
  }
  
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.zIndex = '1000';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:700px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
        <h3 style="margin:0;font-size:20px">Editar Paso ${stepIdx + 1}</h3>
        <button class="close" aria-label="Cerrar" style="position:absolute;top:12px;right:12px;background:transparent;border:none;font-size:20px;cursor:pointer">✕</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div>
          <label style="display:block;margin-bottom:8px;font-weight:600;font-size:13px;color:var(--cw-text-muted)">Título del paso</label>
          <input type="text" id="editStepTitle" class="input-field" style="width:100%;padding:10px" />
        </div>
        <div>
          <label style="display:block;margin-bottom:8px;font-weight:600;font-size:13px;color:var(--cw-text-muted)">Contenido (HTML permitido)</label>
          <textarea id="editStepContent" class="input-field" style="width:100%;min-height:150px;padding:10px;font-family:monospace;font-size:12px"></textarea>
        </div>
        <div>
          <label style="display:block;margin-bottom:8px;font-weight:600;font-size:13px;color:var(--cw-text-muted)">Imagen</label>
          <div style="display:flex;gap:16px;align-items:flex-start">
            <div style="flex:1">
              <input type="file" id="editStepImage" accept="image/*" class="input-field" style="width:100%;padding:8px" />
            </div>
            <div id="editStepImagePreview" style="display:flex;flex-direction:column;align-items:center;gap:8px;min-width:140px">
              <img id="editStepImageImg" style="max-width:140px;max-height:120px;border-radius:8px;border:1px solid var(--cw-border);display:none;object-fit:cover" />
              <button type="button" id="editStepImageClear" class="secondary" style="display:none;font-size:11px;padding:6px 10px">Quitar</button>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;padding-top:16px;border-top:1px solid var(--cw-border)">
          <button type="button" id="editStepCancel" class="secondary">Cancelar</button>
          <button type="button" id="editStepSave" class="primary">Guardar cambios</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // CRITICAL: Prevent modal from closing on overlay click by blocking the click event
  modal.addEventListener('click', (e) => {
    // If clicking on the overlay (the modal div itself, not modal-content)
    if (e.target === modal) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return false;
    }
  }, true); // Use capture phase to intercept before other handlers
  
  // Wire elements
  const titleInput = document.getElementById('editStepTitle');
  const contentInput = document.getElementById('editStepContent');
  const imageInput = document.getElementById('editStepImage');
  const imageImg = document.getElementById('editStepImageImg');
  const imageClearBtn = document.getElementById('editStepImageClear');
  const saveBtn = document.getElementById('editStepSave');
  const cancelBtn = document.getElementById('editStepCancel');
  const closeBtn = modal.querySelector('.close');
  
  // Populate fields
  titleInput.value = step.title || '';
  contentInput.value = step.content || '';
  let currentImage = step.image || null;
  
  if (currentImage) {
    imageImg.src = currentImage;
    imageImg.style.display = 'block';
    imageClearBtn.style.display = 'block';
  }
  
  // Image upload handler
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      currentImage = reader.result;
      imageImg.src = currentImage;
      imageImg.style.display = 'block';
      imageClearBtn.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });
  
  // Clear image
  imageClearBtn.addEventListener('click', () => {
    currentImage = null;
    imageImg.style.display = 'none';
    imageClearBtn.style.display = 'none';
    imageInput.value = '';
  });
  
  // Save
  saveBtn.addEventListener('click', async () => {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!title) {
      alert('El título es obligatorio');
      return;
    }
    
    if (!content) {
      alert('El contenido es obligatorio');
      return;
    }
    
    // Update step
    manual.steps[stepIdx] = {
      ...manual.steps[stepIdx],
      title,
      content,
      image: currentImage
    };
    
    // Save to backend
    try {
      await api.updateManual(manual.id, manual);
      
      // Update STATE.current and STATE.manuals to reflect changes
      STATE.current = manual;
      const idx = STATE.manuals.findIndex(m => m.id === manual.id);
      if (idx !== -1) {
        STATE.manuals[idx] = manual;
      }
      
      // FASE 6: Notificar actualización de manual
      notifyManualUpdated(manual);
      pushNotification({title: 'Paso actualizado', text: 'Los cambios se han guardado'});
      modal.remove();
      renderSteps(manual);
    } catch (err) {
      alert('Error guardando cambios: ' + err.message);
    }
  });
  
  // Cancel/Close
  const closeModal = () => modal.remove();
  cancelBtn.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

// Admin: create new manual (clean, consolidated implementation)
function openNewManualModal(){
  try {
    console.debug('[openNewManualModal] Iniciando...');
    
    // Comprobar permisos (pero permitir en desarrollo si no hay usuario)
    const isAdmin = STATE.authUser && STATE.authUser.role === 'admin';
    const perms = STATE.authUser?.permissions || [];
    const hasUser = STATE.authUser && STATE.authUser.id;
    const canCreateManuals = !hasUser || isAdmin || perms.includes('create_manuals');
    
    if(!canCreateManuals){ 
      console.warn('[openNewManualModal] Acceso denegado');
      alert('No tienes permisos para crear manuales.'); 
      return; 
    }
    
    // Obtener y validar modal
    const modal = document.getElementById('newManualModal'); 
    if(!modal) { 
      console.error('[openNewManualModal] Modal NO ENCONTRADO: #newManualModal');
      return; 
    }
    
    // Resetear campos básicos
    const title = document.getElementById('newTitle'); 
    const catSelect = document.getElementById('newCategorySelect'); 
    const catName = document.getElementById('newCategoryName');
    const roleSelect = document.getElementById('newRoleSelect');
    const roleName = document.getElementById('newRoleName');
    const typeSelect = document.getElementById('newTypeSelect');
    const typeName = document.getElementById('newTypeName');
    const ver = document.getElementById('newVersion'); 
    const summ = document.getElementById('newSummary');
    
    if(title) title.value = '';
    if(catName) catName.value = '';
    if(roleName) roleName.value = '';
    if(typeName) typeName.value = '';
    if(ver) ver.value = '1.0.0';
    if(summ) summ.value = '';
    
    // Poblar categorías (con fallback)
    try {
      if(catSelect){ 
        catSelect.innerHTML = '<option value="">-- Selecciona --</option>'; 
        const cats = Array.from(new Set((STATE.manuals||[]).map(m=>m.category).filter(Boolean))); 
        cats.forEach(c=>{ 
          const o = document.createElement('option'); 
          o.value = c; 
          o.textContent = c; 
          catSelect.appendChild(o); 
        });
        updateCustomSelectOptions(catSelect);
      }
    } catch (err) {
      console.warn('[openNewManualModal] Error populando categorías:', err);
    }
    
    // Poblar roles (con fallback)
    try {
      if (roleSelect) {
        roleSelect.innerHTML = '<option value="">👤 Rol / Área</option>';
        const roles = Array.from(new Set((STATE.manuals || []).map(m => m.role).filter(Boolean)));
        roles.forEach(role => {
          const o = document.createElement('option');
          o.value = role;
          o.textContent = role;
          roleSelect.appendChild(o);
        });
        updateCustomSelectOptions(roleSelect);
      }
    } catch (err) {
      console.warn('[openNewManualModal] Error populando roles:', err);
    }
    
    // Poblar tipos (con fallback)
    try {
      if (typeSelect) {
        typeSelect.innerHTML = '<option value="">🏷️ Tipo</option>';
        const types = Array.from(new Set((STATE.manuals || []).map(m => m.type).filter(Boolean)));
        types.forEach(type => {
          const o = document.createElement('option');
          o.value = type;
          o.textContent = type;
          typeSelect.appendChild(o);
        });
        updateCustomSelectOptions(typeSelect);
      }
    } catch (err) {
      console.warn('[openNewManualModal] Error populando tipos:', err);
    }
    
    // Cargar carpetas (FASE 16)
    try {
      const folderSelect = document.getElementById('newManualFolderSelect');
      if (folderSelect) {
        populateManualFolderSelect();
      }
    } catch (err) {
      console.warn('[openNewManualModal] Error populando carpetas:', err);
    }
    
    // Preparar editor de pasos
    try {
      const editor = document.getElementById('newStepsEditor'); 
      if(editor){ 
        editor.innerHTML = ''; 
        editor.style.display = 'flex'; 
        editor.style.flexDirection = 'column'; 
      }
      createStepEditorRow();
    } catch (err) {
      console.warn('[openNewManualModal] Error preparando editor:', err);
    }
    
    // Reinicializar selectores
    if (catSelect) { catSelect.disabled = false; catSelect.style.opacity = '1'; }
    if (roleSelect) { roleSelect.disabled = false; roleSelect.style.opacity = '1'; }
    if (typeSelect) { typeSelect.disabled = false; typeSelect.style.opacity = '1'; }
    
    // Setup metadata toggle
    try {
      setupManualMetadataToggle();
    } catch (err) {
      console.warn('[openNewManualModal] Error en setupManualMetadataToggle:', err);
    }
    
    // Mostrar modal
    modal.classList.remove('hidden');
    console.log('[openNewManualModal] ✓ Modal abierto correctamente');
  } catch (err) {
    console.error('[openNewManualModal] Error fatal:', err);
    alert('Error abriendo el creador de manuales. Revisa la consola.');
  }
}

/**
 * Configura el comportamiento de toggle entre selectores e inputs
 * para categoría, rol y tipo
 */
function setupManualMetadataToggle() {
  console.log('[setupManualMetadataToggle] Iniciando setup de metadata toggle');
  
  // Categoría
  const catName = document.getElementById('newCategoryName');
  const catSelect = document.getElementById('newCategorySelect');
  console.log('[setupManualMetadataToggle] Categoría:', { catName: !!catName, catSelect: !!catSelect });
  
  if (catName && catSelect) {
    catName.removeEventListener('input', catName._toggleHandler);
    catSelect.removeEventListener('change', catSelect._toggleHandler);
    
    const toggleCat = () => {
      catSelect.disabled = catName.value.trim() !== '';
      catSelect.style.opacity = catSelect.disabled ? '0.5' : '1';
    };
    catName._toggleHandler = toggleCat;
    catSelect._toggleHandler = () => {
      if (catSelect.value) catName.value = '';
      toggleCat();
    };
    catName.addEventListener('input', catName._toggleHandler);
    catSelect.addEventListener('change', catSelect._toggleHandler);
  }
  
  // Rol
  const roleName = document.getElementById('newRoleName');
  const roleSelect = document.getElementById('newRoleSelect');
  console.log('[setupManualMetadataToggle] Rol:', { roleName: !!roleName, roleSelect: !!roleSelect });
  
  if (roleName && roleSelect) {
    roleName.removeEventListener('input', roleName._toggleHandler);
    roleSelect.removeEventListener('change', roleSelect._toggleHandler);
    
    const toggleRole = () => {
      const shouldDisable = roleName.value.trim() !== '';
      roleSelect.disabled = shouldDisable;
      roleSelect.style.opacity = roleSelect.disabled ? '0.5' : '1';
      console.log('[setupManualMetadataToggle] Rol toggleado:', { value: roleName.value, shouldDisable, disabled: roleSelect.disabled });
    };
    roleName._toggleHandler = toggleRole;
    roleSelect._toggleHandler = () => {
      if (roleSelect.value) roleName.value = '';
      toggleRole();
    };
    roleName.addEventListener('input', roleName._toggleHandler);
    roleSelect.addEventListener('change', roleSelect._toggleHandler);
    console.log('[setupManualMetadataToggle] Listeners agregados para Rol');
  }
  
  // Tipo
  const typeName = document.getElementById('newTypeName');
  const typeSelect = document.getElementById('newTypeSelect');
  console.log('[setupManualMetadataToggle] Tipo:', { typeName: !!typeName, typeSelect: !!typeSelect });
  
  if (typeName && typeSelect) {
    typeName.removeEventListener('input', typeName._toggleHandler);
    typeSelect.removeEventListener('change', typeSelect._toggleHandler);
    
    const toggleType = () => {
      typeSelect.disabled = typeName.value.trim() !== '';
      typeSelect.style.opacity = typeSelect.disabled ? '0.5' : '1';
    };
    typeName._toggleHandler = toggleType;
    typeSelect._toggleHandler = () => {
      if (typeSelect.value) typeName.value = '';
      toggleType();
    };
    typeName.addEventListener('input', typeName._toggleHandler);
    typeSelect.addEventListener('change', typeSelect._toggleHandler);
  }
  
  console.log('[setupManualMetadataToggle] Setup completado');
}

function openManageCategoriesModal(){
  // Check if admin
  if(!(STATE.authUser && STATE.authUser.role === 'admin')){ 
    alert('Solo administradores pueden gestionar categorías.'); 
    return; 
  }
  
  // Get all unique categories from manuals
  const categories = new Set();
  STATE.manuals.forEach(m => {
    if(m.category) categories.add(m.category);
  });
  
  const catArray = Array.from(categories).sort();
  
  // Create modal dynamically
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.setAttribute('data-manage-categories', 'true');
  modal.role = 'dialog';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 800px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--cw-border); padding-bottom: 12px; margin-bottom: 16px;">
        <h4 style="margin: 0; color: var(--cw-text);">Gestionar categorías</h4>
        <button class="close" style="background: none; border: none; cursor: pointer; color: var(--cw-text-muted); font-size: 20px; padding: 0; width: auto; height: auto;">×</button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 12px; max-height: 550px; overflow-y: auto;">
        <div style="padding: 12px; background: rgba(255,193,7,0.1); border-radius: 6px; font-size: 13px; color: var(--cw-text-muted);">
          📝 Arrastra manuales entre categorías para reasignarlos. Las categorías se crean automáticamente al asignarlas a un manual.
        </div>
        <div id="categoriesContainer" style="display: flex; flex-direction: column; gap: 16px;"></div>
      </div>
      <div style="border-top: 1px solid var(--cw-border); padding-top: 16px; margin-top: 16px;">
        <button class="primary close-modal-btn" style="width: 100%; padding: 10px; border-radius: 6px; cursor: pointer;">Cerrar</button>
      </div>
    </div>
  `;
  
  // Populate categories with drag and drop
  const catContainer = modal.querySelector('#categoriesContainer');
  if(catArray.length === 0) {
    catContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--cw-text-muted);">No hay categorías aún</div>';
  } else {
    catArray.forEach(cat => {
      const manualsInCat = STATE.manuals.filter(m => m.category === cat);
      const count = manualsInCat.length;
      
      // Category section
      const catSection = document.createElement('div');
      catSection.style.cssText = `
        padding: 12px;
        background: var(--cw-surface);
        border: 2px solid var(--cw-border);
        border-radius: 8px;
        transition: all 0.2s ease;
      `;
      
      catSection.innerHTML = `
        <div style="font-weight: 600; color: var(--cw-text); margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
          <span>${escapeHtml(cat)}</span>
          <span style="font-size: 12px; color: var(--cw-text-muted); background: rgba(255,128,51,0.1); padding: 2px 8px; border-radius: 4px;">${count} manual${count !== 1 ? 'es' : ''}</span>
        </div>
        <div class="category-manuals" style="display: flex; flex-direction: column; gap: 6px; min-height: 40px; padding: 6px; border: 1px dashed var(--cw-border); border-radius: 6px; background: rgba(255,255,255,0.5);"></div>
      `;
      
      const manualsDiv = catSection.querySelector('.category-manuals');
      
      // Add manual items with drag functionality
      manualsInCat.forEach(manual => {
        const manualItem = document.createElement('div');
        manualItem.draggable = true;
        manualItem.dataset.manualId = manual.id;
        manualItem.dataset.manualTitle = manual.title;
        manualItem.dataset.currentCategory = cat;
        manualItem.style.cssText = `
          padding: 8px 10px;
          background: linear-gradient(135deg, var(--cw-primary-light), var(--cw-primary));
          color: white;
          border-radius: 4px;
          cursor: move;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
          user-select: none;
        `;
        manualItem.textContent = manual.title;
        
        // Drag events
        manualItem.addEventListener('dragstart', (e) => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('manualId', manual.id);
          e.dataTransfer.setData('currentCategory', cat);
          manualItem.style.opacity = '0.6';
        });
        
        manualItem.addEventListener('dragend', (e) => {
          manualItem.style.opacity = '1';
        });
        
        manualsDiv.appendChild(manualItem);
      });
      
      // Drop events for category
      manualsDiv.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        manualsDiv.style.backgroundColor = 'rgba(255,128,51,0.15)';
        manualsDiv.style.borderColor = 'var(--cw-primary)';
      });
      
      manualsDiv.addEventListener('dragleave', (e) => {
        if (e.target === manualsDiv) {
          manualsDiv.style.backgroundColor = 'rgba(255,255,255,0.5)';
          manualsDiv.style.borderColor = 'var(--cw-border)';
        }
      });
      
      manualsDiv.addEventListener('drop', (e) => {
        e.preventDefault();
        const manualId = e.dataTransfer.getData('manualId');
        const oldCategory = e.dataTransfer.getData('currentCategory');
        
        if (oldCategory !== cat && manualId) {
          // Find and update the manual
          const manual = STATE.manuals.find(m => m.id === manualId);
          if (manual) {
            const oldCat = manual.category;
            manual.category = cat;
            
            // Save to backend
            fetch(apiUrl(`/manuals/${manualId}`), {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: manual.title,
                category: cat,
                role: manual.role,
                type: manual.type,
                summary: manual.summary,
                version: manual.version,
                tags: manual.tags,
                steps: manual.steps,
                versions: manual.versions
              })
            }).then(r => {
              if (!r.ok) throw new Error(`HTTP ${r.status}`);
              return r.json();
            })
            .then(data => {
              // Backend devuelve el manual actualizado o un objeto vacío
              if (data && (data.id || data.title)) {
                // Actualizar STATE.manuals con los datos del servidor
                const idx = STATE.manuals.findIndex(m => m.id === manualId);
                if (idx !== -1) {
                  STATE.manuals[idx] = {
                    ...STATE.manuals[idx],
                    category: cat
                  };
                }
                // Cerrar solo el modal de gestión de categorías (modal dinámico)
                document.querySelectorAll('.modal[data-manage-categories]').forEach(m => m.remove());
                // Re-renderizar la lista de manuales para reflejar el cambio
                renderManualsList(STATE.manuals);
                // Esperar un poco antes de recargar el modal de gestión
                setTimeout(() => {
                  openManageCategoriesModal();
                }, 300);
              } else {
                alert('Error: No se pudo actualizar la categoría');
                manual.category = oldCat;
              }
            })
            .catch(err => {
              console.error('Error al actualizar:', err);
              alert('Error: ' + err.message);
              manual.category = oldCat;
            });
          }
        }
        
        manualsDiv.style.backgroundColor = 'rgba(255,255,255,0.5)';
        manualsDiv.style.borderColor = 'var(--cw-border)';
      });
      
      catContainer.appendChild(catSection);
    });
  }
  
  // Close button handler
  const closeBtn = modal.querySelector('.close');
  closeBtn.addEventListener('click', (e) => { e.stopPropagation(); modal.remove(); });
  
  // CRITICAL: Prevent modal from closing on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return false;
    }
  }, true); // Use capture phase
  
  document.body.appendChild(modal);
  modal.classList.remove('hidden');
}

function createStepEditorRow(step){
  const editor = document.getElementById('newStepsEditor'); if(!editor) return;
  const row = document.createElement('div'); row.className = 'step-editor-row panel'; row.style.display = 'flex'; row.style.flexDirection = 'column'; row.style.gap = '12px'; row.style.padding = '16px'; row.style.borderLeft = '4px solid var(--cw-primary)';
  
  // Title row
  const titleRow = document.createElement('div'); titleRow.style.display = 'flex'; titleRow.style.gap = '8px';
  const tInput = document.createElement('input'); tInput.className = 'input-field'; tInput.placeholder = 'Título del paso'; tInput.dataset.stepTitle = 'true'; tInput.style.flex = '1'; tInput.value = step && step.title || '';
  const removeBtn = document.createElement('button'); removeBtn.type = 'button'; removeBtn.className = 'secondary'; removeBtn.textContent = 'Eliminar paso'; removeBtn.style.whiteSpace = 'nowrap'; removeBtn.addEventListener('click', ()=> row.remove());
  titleRow.appendChild(tInput); titleRow.appendChild(removeBtn);
  
  // Content
  const content = document.createElement('textarea'); content.className = 'input-field'; content.dataset.stepContent = 'true'; content.style.minHeight = '90px'; content.value = step && step.content || '';
  
  // Image upload with better design
  const imageContainer = document.createElement('div'); imageContainer.style.display = 'flex'; imageContainer.style.gap = '12px'; imageContainer.style.alignItems = 'flex-start';
  
  const uploadSection = document.createElement('div'); uploadSection.style.flex = '1'; uploadSection.style.display = 'flex'; uploadSection.style.flexDirection = 'column'; uploadSection.style.gap = '8px';
  const imageLabel = document.createElement('label'); imageLabel.style.fontSize = '12px'; imageLabel.style.fontWeight = '600'; imageLabel.style.color = 'var(--cw-text-muted)'; imageLabel.textContent = 'Imagen (opcional)';
  
  const fileInput = document.createElement('input'); fileInput.type = 'file'; fileInput.accept = 'image/*'; fileInput.dataset.stepImage = 'true'; fileInput.style.padding = '8px 12px'; fileInput.style.border = '2px dashed var(--cw-border)'; fileInput.style.borderRadius = '8px'; fileInput.style.cursor = 'pointer'; fileInput.style.transition = 'all 0.2s';
  fileInput.addEventListener('focus', ()=>{ fileInput.style.borderColor = 'var(--cw-primary)'; fileInput.style.backgroundColor = 'rgba(255,128,51,0.04)'; });
  fileInput.addEventListener('blur', ()=>{ fileInput.style.borderColor = 'var(--cw-border)'; fileInput.style.backgroundColor = 'transparent'; });
  uploadSection.appendChild(imageLabel);
  uploadSection.appendChild(fileInput);
  
  const preview = document.createElement('div'); preview.style.display = 'flex'; preview.style.flexDirection = 'column'; preview.style.alignItems = 'center'; preview.style.gap = '8px'; preview.style.minWidth = '120px';
  const img = document.createElement('img'); img.style.maxWidth = '140px'; img.style.maxHeight = '120px'; img.style.borderRadius = '10px'; img.style.border = '2px solid var(--cw-border)'; img.style.display = step && step.image ? 'block' : 'none'; img.style.objectFit = 'cover'; if(step && step.image) img.src = step.image;
  const clearBtn = document.createElement('button'); clearBtn.type = 'button'; clearBtn.className = 'secondary'; clearBtn.style.fontSize = '11px'; clearBtn.style.padding = '6px 10px'; clearBtn.textContent = 'Quitar'; clearBtn.style.display = step && step.image ? 'block' : 'none'; clearBtn.addEventListener('click', ()=>{ img.style.display = 'none'; clearBtn.style.display = 'none'; fileInput.value = ''; fileInput.dataset.dataurl = ''; });
  preview.appendChild(img); preview.appendChild(clearBtn);
  
  fileInput.addEventListener('change', (e)=>{ const f = e.target.files && e.target.files[0]; if(!f) return; const r = new FileReader(); r.onload = ()=>{ img.src = r.result; img.style.display = 'block'; clearBtn.style.display = 'block'; fileInput.dataset.dataurl = r.result; }; r.readAsDataURL(f); });
  if(step && step.image) fileInput.dataset.dataurl = step.image;
  
  imageContainer.appendChild(uploadSection); imageContainer.appendChild(preview);
  
  row.appendChild(titleRow); row.appendChild(content); row.appendChild(imageContainer);
  editor.appendChild(row);
}

function collectStepsFromNewEditor(){
  const editor = document.getElementById('newStepsEditor'); if(!editor) return [];
  const out = [];
  Array.from(editor.querySelectorAll('.step-editor-row')).forEach(row=>{
    const title = (row.querySelector('[data-step-title]')||{}).value || '';
    const content = (row.querySelector('[data-step-content]')||{}).value || '';
    const fileIn = row.querySelector('[data-step-image]');
    const image = fileIn && fileIn.dataset && fileIn.dataset.dataurl ? fileIn.dataset.dataurl : null;
    
    // FASE 8: Capturar imágenes del PDF desde dataset
    let images = [];
    if (row.dataset.stepImages) {
      try {
        images = JSON.parse(row.dataset.stepImages);
      } catch (e) {
        console.warn('Error decodificando imágenes:', e);
      }
    }
    
    // Agregar imagen individual si existe (para compatibilidad)
    if (image && !images.includes(image)) {
      images.unshift(image);
    }
    
    out.push({ title, content, image, images });
  });
  return out;
}

async function saveNewManual(){
  console.log('[saveNewManual] Iniciando guardado de nuevo manual...');
  
  // Verificar permisos
  if(!canCreateManuals()) {
    await showAlert('❌ Acceso Denegado', 'No tienes permisos para crear manuales.');
    console.warn('[saveNewManual] Acceso denegado por permisos:', { user: STATE.authUser?.name });
    return;
  }
  
  const titleEl = document.getElementById('newTitle'); 
  const catSel = document.getElementById('newCategorySelect'); 
  const catName = document.getElementById('newCategoryName');
  const ver = document.getElementById('newVersion'); 
  const summ = document.getElementById('newSummary');
  const privCheckbox = document.getElementById('newManualPrivate');
  
  const title = titleEl ? titleEl.value.trim() : '';
  const category = (catName && catName.value.trim()) || (catSel && catSel.value) || 'General';
  const version = ver ? ver.value.trim() || '1.0.0' : '1.0.0';
  const summary = summ ? summ.value.trim() : '';
  const isPrivate = privCheckbox ? privCheckbox.checked : false;
  
  console.log('[saveNewManual] Validando campos:', { title, category, version, summary, isPrivate });
  
  if(!title) { 
    await showAlert('⚠️ Campo Requerido', 'El título del manual es obligatorio');
    titleEl?.focus();
    return; 
  }
  
  const steps = collectStepsFromNewEditor();
  console.log('[saveNewManual] Pasos recolectados:', steps.length);

  // FASE 16: Obtener carpeta seleccionada
  const folderSelect = document.getElementById('newManualFolderSelect');
  const folderId = folderSelect?.value || null;
  
  console.log('[saveNewManual] Carpeta seleccionada:', { folderId, type: typeof folderId });
  
  const id = 'custom-' + Date.now();
  const manual = { 
    id, 
    title, 
    category, 
    version, 
    summary, 
    steps,
    folder_id: folderId,
    is_private: isPrivate,
    userId: STATE.authUser?.id, // Agregar userId para validación de permisos
    versions: [{version, note:'Creado', date: new Date().toISOString()}] 
  };
  
  console.log('[saveNewManual] Nuevo manual preparado:', manual);
  
  try {
    // Guardar SOLO en backend API (la base de datos es la fuente de verdad)
    // NO guardar en localStorage
    const result = await api.createManual(manual);
    console.log('[saveNewManual] ✓ Manual guardado en API:', result);
    
    // Recargar lista de manuales desde la API para obtener el ID asignado por la BD
    const response = await api.getManuals();
    const apiManuals = response.data || response.manuals || [];
    
    // Actualizar STATE con manuales frescos de la API
    STATE.manuals = apiManuals.map((m) => {
      if (!m.steps || !Array.isArray(m.steps)) {
        const sourceArray = m.content || [];
        if (typeof sourceArray === 'string') {
          try {
            m.steps = JSON.parse(sourceArray);
          } catch (e) {
            m.steps = [];
          }
        } else if (Array.isArray(sourceArray)) {
          m.steps = sourceArray;
        } else {
          m.steps = [];
        }
      }
      return m;
    });
    
    console.log('[saveNewManual] ✓ Manuales sincronizados desde API. Total:', STATE.manuals.length);
    
    // Cerrar modal
    const modal = document.getElementById('newManualModal');
    if (modal) modal.classList.add('hidden');
    
    // Refrescar ManualsPro en lugar de reinicializar completamente
    if (typeof ManualsPro !== 'undefined' && ManualsPro.refreshManuals) {
      console.log('[saveNewManual] Llamando a ManualsPro.refreshManuals() con', STATE.manuals.length, 'manuales');
      ManualsPro.refreshManuals(STATE.manuals);
      console.log('[saveNewManual] ✓ ManualsPro refrescado');
    } else {
      console.warn('[saveNewManual] ManualsPro no disponible, usando fallback');
      // Fallback a renderizar si ManualsPro no está disponible
      renderManualsList(STATE.manuals);
    }
    
    // Actualizar filtros con nuevas categorías, roles y tipos
    updateAdvancedFilterOptions();
    
    // Notificar nuevo manual
    notifyNewManual(manual);
    
    console.log('[saveNewManual] ✓ Manual creado exitosamente:', { id, title, creator: STATE.authUser?.name });
    pushNotification({title:'✅ Manual Creado', text: `"${title}" ha sido creado exitosamente`});
  } catch (err) {
    console.error('[saveNewManual] Error guardando en API:', err);
    await showAlert('❌ Error', 'No se pudo guardar el manual. Verifica tu conexión con el servidor.');
  }
}

function exportManuals(){
  if(!(STATE.authUser && STATE.authUser.role === 'admin')){ alert('Solo administradores pueden exportar manuales.'); return; }
  
  if(STATE.manuals.length === 0) {
    alert('No hay manuales para exportar');
    return;
  }
  
  if(STATE.manuals.length === 1) {
    // Auto-export if only one manual
    const manual = STATE.manuals[0];
    const data = JSON.stringify(manual, null, 2);
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${manual.id}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    pushNotification({title: 'Manual exportado', text: manual.title});
    return;
  }
  
  // Multiple manuals: show selection modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.zIndex = '1000';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:500px">
      <button class="close" aria-label="Cerrar" style="position:absolute;top:12px;right:12px">✕</button>
      <h4 style="margin:0 0 16px">Selecciona un manual para exportar</h4>
      <div style="display:flex;flex-direction:column;gap:8px;max-height:400px;overflow-y:auto">
        ${STATE.manuals.map((m, idx) => `
          <button type="button" data-idx="${idx}" style="text-align:left;padding:12px;border:1px solid var(--cw-border);border-radius:8px;background:transparent;cursor:pointer;transition:all 0.2s;font-size:14px">
            <strong>${escapeHtml(m.title)}</strong>
            <div style="font-size:12px;color:var(--cw-text-muted);margin-top:4px">${escapeHtml(m.category)} • v${m.version}</div>
          </button>
        `).join('')}
      </div>
    </div>
  `;
  
  // Add hover effects
  const buttons = modal.querySelectorAll('button[data-idx]');
  buttons.forEach(btn => {
    btn.addEventListener('mouseenter', ()=>{ btn.style.background = 'var(--cw-surface-alt)'; btn.style.borderColor = 'var(--cw-primary)'; });
    btn.addEventListener('mouseleave', ()=>{ btn.style.background = 'transparent'; btn.style.borderColor = 'var(--cw-border)'; });
    btn.addEventListener('click', (e)=>{
      const idx = parseInt(btn.dataset.idx);
      const manual = STATE.manuals[idx];
      const data = JSON.stringify(manual, null, 2);
      const blob = new Blob([data], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${manual.id}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      modal.remove();
      pushNotification({title: 'Manual exportado', text: manual.title});
    });
  });
  
  // Close button
  const closeBtn = modal.querySelector('.close');
  closeBtn.addEventListener('click', (e) => { e.stopPropagation(); modal.remove(); });
  
  // CRITICAL: Prevent modal from closing on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return false;
    }
  }, true); // Use capture phase
  
  document.body.appendChild(modal);
}

function importManuals(){
  if(!(STATE.authUser && STATE.authUser.role === 'admin')){ alert('Solo administradores pueden importar manuales.'); return; }
  // Use file picker to import
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json,application/json';
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result);
        const arr = Array.isArray(data) ? data : (data.manuals ? data.manuals : [data]);
        if(!Array.isArray(arr) || arr.length === 0) {
          alert('Archivo JSON inválido o vacío');
          return;
        }
        // Import all manuals to database
        const newManuals = [];
        for (const m of arr) {
          if(!m.id) m.id = 'import-'+Date.now()+'-'+Math.floor(Math.random()*1000);
          if(!STATE.manuals.find(x => x.id === m.id)) {
            try {
              await api.createManual(m);
              STATE.manuals.push(m);
              newManuals.push(m);
            } catch (err) {
      console.error('Error al importar manual:', err);
            }
          }
        }
        renderManualsList(STATE.manuals);
        pushNotification({title:'Importación completada', text: `${newManuals.length} manual(es) importado(s)`});
      } catch(err) {
        alert('Error al importar: ' + err.message);
      }
    };
    reader.readAsText(file);
  });
  fileInput.click();
}

// Process PDF file and extract steps
function processPdfFile(file) {
  const statusDiv = document.getElementById('pdfStatus');
  if(!statusDiv) return;
  
  statusDiv.style.display = 'block';
  statusDiv.textContent = '⏳ Analizando PDF...';
  statusDiv.style.color = 'var(--cw-text-muted)';
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      // Use PDF.js to extract text and images
      const pdf = await pdfjsLib.getDocument({data: e.target.result}).promise;
      const pageData = [];
      
      statusDiv.textContent = `⏳ Extrayendo contenido de ${pdf.numPages} páginas...`;
      
      // Extract text and images from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        
        // Extract images from page
        const images = [];
        const operatorList = await page.getOperatorList();
        
        try {
          // Try to render page and capture as image
          const scale = 2;
          const viewport = page.getViewport({scale: scale});
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext('2d');
          
          const renderTask = page.render({
            canvasContext: context,
            viewport: viewport
          });
          
          await renderTask.promise;
          const imageData = canvas.toDataURL('image/jpeg', 0.8);
          images.push(imageData);
        } catch (imgErr) {
          console.warn(`No se pudo capturar imagen de página ${i}:`, imgErr);
        }
        
        pageData.push({
          pageNum: i,
          text: pageText.trim(),
          images: images
        });
      }
      
      // Detectar pasos automáticamente
      const steps = detectStepsFromPdf(pageData, file.name);
      
      statusDiv.textContent = `✓ PDF procesado: ${steps.length} pasos detectados con ${steps.reduce((a,s) => a + s.images.length, 0)} imágenes`;
      statusDiv.style.color = 'var(--cw-success)';
      
      // Auto-fill the manual form
      const titleInput = document.getElementById('newTitle');
      const editorDiv = document.getElementById('newStepsEditor');
      
      if(titleInput && !titleInput.value) {
        titleInput.value = file.name.replace('.pdf', '').substring(0, 100);
      }
      
      if(editorDiv) {
        editorDiv.innerHTML = '';
        steps.forEach((step, idx) => {
          const row = document.createElement('div');
          row.className = 'step-editor-row panel';
          row.style.cssText = 'display:flex;flex-direction:column;gap:12px;padding:16px;border-left:4px solid var(--cw-primary);background:var(--cw-surface-alt)';
          
          // Guardar imágenes en un atributo data para recuperarlas luego
          row.dataset.stepImages = JSON.stringify(step.images || []);
          
          let imagesHtml = '';
          if (step.images && step.images.length > 0) {
            imagesHtml = `
              <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(120px, 1fr));gap:8px;margin-top:8px;border-top:1px solid var(--cw-border);padding-top:8px">
                <div style="grid-column:1/-1;font-size:12px;font-weight:600;color:var(--cw-text-muted)">📸 ${step.images.length} imagen(es):</div>
                ${step.images.map((img, i) => `
                  <div style="position:relative;border-radius:6px;overflow:hidden;border:1px solid var(--cw-border);aspect-ratio:1">
                    <img src="${img}" style="width:100%;height:100%;object-fit:cover;cursor:pointer" title="Imagen ${i+1}" class="pdf-step-image">
                    <span style="position:absolute;top:2px;right:4px;background:rgba(0,0,0,0.7);color:white;font-size:10px;padding:2px 4px;border-radius:3px;font-weight:600">${i+1}</span>
                  </div>
                `).join('')}
              </div>
            `;
          }
          
          row.innerHTML = `
            <div style="display:flex;gap:8px;align-items:flex-start">
              <input class="input-field" style="flex:1" placeholder="Título del paso" value="${escapeHtml(step.title)}" data-step-title="true">
              <button type="button" class="secondary" style="white-space:nowrap;padding:6px 12px;font-size:12px;flex-shrink:0">✕ Eliminar</button>
            </div>
            <textarea class="input-field" style="min-height:90px;font-family:monospace;font-size:12px" placeholder="Descripción del paso" data-step-content="true">${escapeHtml(step.content)}</textarea>
            ${imagesHtml}
          `;
          
          row.querySelector('button').addEventListener('click', () => row.remove());
          editorDiv.appendChild(row);
          
          // Add event listeners for PDF step images
          const pdfImages = row.querySelectorAll('.pdf-step-image');
          pdfImages.forEach(img => {
            img.addEventListener('click', () => {
              const parentDiv = img.parentElement;
              const currentMaxHeight = parentDiv.style.maxHeight;
              parentDiv.style.maxHeight = currentMaxHeight === '100px' ? 'none' : '100px';
            });
          });
        });
      }
      
      setTimeout(() => { statusDiv.style.display = 'none'; }, 4000);
    } catch (err) {
      console.error('Error procesando PDF:', err);
      statusDiv.textContent = `❌ Error: ${err.message}`;
      statusDiv.style.color = 'var(--cw-danger)';
    }
  };
  reader.readAsArrayBuffer(file);
}

// FASE 8: Detectar pasos automáticamente del PDF
function detectStepsFromPdf(pageData, fileName) {
  const steps = [];
  
  // Si tiene pocas páginas, crear un paso por página
  if (pageData.length <= 5) {
    pageData.forEach((page, idx) => {
      if (page.text.trim().length > 20) {
        steps.push({
          title: `Paso ${idx + 1}`,
          content: page.text.trim().substring(0, 1000),
          images: page.images || []
        });
      }
    });
    return steps;
  }
  
  // Para PDFs largos, buscar patrones comunes de títulos/encabezados
  let currentStep = null;
  const stepTitles = new Set();
  
  pageData.forEach((page, idx) => {
    const text = page.text.trim();
    const lines = text.split('\n').filter(l => l.trim());
    
    lines.forEach(line => {
      // Detectar líneas que parecen títulos
      const isTitle = 
        /^[A-Z]{2,}/.test(line) || // Empieza con letras mayúsculas
        /^paso\s+\d+/i.test(line) || // "Paso 1"
        /^step\s+\d+/i.test(line) || // "Step 1"
        /^\d+\.\s+[A-Z]/.test(line) || // "1. Título"
        /^[•\-\*]\s+[A-Z]/.test(line) || // "• Título"
        (line.length < 80 && line.split(' ').length < 10 && /[A-Z]/.test(line));
      
      if (isTitle && line.length > 3 && !stepTitles.has(line)) {
        // Guardar paso anterior si existe
        if (currentStep && currentStep.content.trim().length > 20) {
          steps.push(currentStep);
        }
        
        // Crear nuevo paso
        stepTitles.add(line);
        currentStep = {
          title: line.substring(0, 100),
          content: '',
          images: page.images || [],
          startPage: idx
        };
      } else if (currentStep) {
        currentStep.content += (currentStep.content ? '\n' : '') + line;
        if (!currentStep.images || currentStep.images.length === 0) {
          currentStep.images = page.images || [];
        }
      }
    });
  });
  
  // Guardar último paso
  if (currentStep && currentStep.content.trim().length > 20) {
    steps.push(currentStep);
  }
  
  // Si no se detectaron pasos, dividir por páginas
  if (steps.length === 0) {
    pageData.forEach((page, idx) => {
      if (page.text.trim().length > 20) {
        steps.push({
          title: `Paso ${idx + 1}`,
          content: page.text.trim().substring(0, 1000),
          images: page.images || []
        });
      }
    });
  }
  
  // Limpiar pasos
  return steps.map(step => ({
    title: step.title || 'Sin título',
    content: step.content.substring(0, 2000),
    images: step.images || []
  })).filter(s => s.content.trim().length > 10);
}

// Process JSON file for import
function processJsonFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      // Support both single manual and array of manuals
      const manual = Array.isArray(data) ? data[0] : data;
      
      if (!manual || !manual.title) {
        alert('Formato JSON inválido. Debe contener al menos un manual con "title"');
        return;
      }
      
      // Auto-fill the form
      const titleInput = document.getElementById('newTitle');
      const summaryInput = document.getElementById('newSummary');
      const versionInput = document.getElementById('newVersion');
      const editorDiv = document.getElementById('newStepsEditor');
      
      if(titleInput) titleInput.value = manual.title || '';
      if(summaryInput) summaryInput.value = manual.summary || '';
      if(versionInput) versionInput.value = manual.version || '1.0.0';
      
      if(editorDiv && manual.steps && Array.isArray(manual.steps)) {
        editorDiv.innerHTML = '';
        manual.steps.forEach(step => {
          const row = document.createElement('div');
          row.className = 'step-editor-row panel';
          row.style.cssText = 'display:flex;flex-direction:column;gap:12px;padding:16px;border-left:4px solid var(--cw-primary)';
          
          row.innerHTML = `
            <div style="display:flex;gap:8px">
              <input class="input-field" style="flex:1" placeholder="Título del paso" value="${escapeHtml(step.title || '')}" data-step-title="true">
              <button type="button" class="secondary" style="white-space:nowrap;padding:6px 12px;font-size:12px">Eliminar</button>
            </div>
            <textarea class="input-field" style="min-height:90px;font-family:monospace;font-size:12px" placeholder="Contenido del paso" data-step-content="true">${escapeHtml(step.content || '')}</textarea>
          `;
          
          row.querySelector('button').addEventListener('click', () => row.remove());
          editorDiv.appendChild(row);
        });
        
        const statusDiv = document.getElementById('pdfStatus');
        if(statusDiv) {
          statusDiv.style.display = 'block';
          statusDiv.textContent = `✓ JSON importado: ${manual.steps.length} pasos cargados`;
          statusDiv.style.color = 'var(--cw-success)';
          setTimeout(() => { statusDiv.style.display = 'none'; }, 3000);
        }
      }
    } catch (err) {
      console.error('Error al importar JSON:', err);
      alert(`Error: ${err.message}`);
    }
  };
  reader.readAsText(file);
}

// ==================== CATEGORÍAS JERÁRQUICAS HELPER ====================
function updateSubcategoryOptions(parentCategory) {
  // Esta función mantiene consistencia si en el futuro queremos cambiar subcategorías dinámicamente
  // Por ahora, las subcategorías son siempre igual (Internet/Telefonía) para ambos padres
  // Podrías modificar aquí para cambiar subcategorías basado en la categoría padre
  console.log('📁 Categoría seleccionada:', parentCategory);
}

// Filtrar diagramas por categoría
function applyDiagramFilters() {
  const filterCategory = document.getElementById('filterDiagramCategory')?.value || '';
  const filterSubcategory = document.getElementById('filterDiagramSubcategory')?.value || '';
  const diagrams = STATE.fibraDiagrams || [];
  
  let filtered = diagrams;
  
  if (filterCategory) {
    filtered = filtered.filter(d => (d.parentCategory || 'GPON') === filterCategory);
  }
  
  if (filterSubcategory) {
    filtered = filtered.filter(d => (d.subcategory || 'Internet') === filterSubcategory);
  }
  
  console.log(`🔍 Filtrado: ${filtered.length} de ${diagrams.length} diagramas`);
  renderDiagramsList(filtered);
}

// ==================== FIBRA/DIAGRAMS FUNCTIONS ====================

async function loadDiagrams() {
  console.log('🟢 [LOAD] loadDiagrams() LLAMADA');
  try {
    // Check if we have local data (from recent creation/save)
    const hasLocalData = localStorage.getItem('hasLocalData') === 'true';
    const localDiagrams = JSON.parse(localStorage.getItem('cw:fibraDiagrams') || '[]');
    
    // Load from backend (PRIMARY STORAGE for all users)
    try {
      const response = await fetch(apiUrl('/diagrams'));
      if (response.ok) {
        const responseData = await response.json();
        // Backend devuelve {data: [], diagrams: [], pagination: {}}
        const diagrams = responseData.data || responseData.diagrams || responseData || [];
        console.log('🟢 [LOAD] Backend devolvió:', diagrams.length, 'diagramas');
        
        // Merge with local data if exists
        if (hasLocalData && localDiagrams.length > 0) {
          console.log('🟢 [LOAD] Merging', localDiagrams.length, 'local diagramas con backend data');
          // Add local diagramas that don't exist in backend
          localDiagrams.forEach(local => {
            if (!diagrams.find(d => d.id === local.id)) {
              diagrams.push(local);
            }
          });
          localStorage.removeItem('hasLocalData'); // Clear flag after sync
        }
        
        STATE.fibraDiagrams = diagrams;
        renderDiagramsList(diagrams || []);
        console.log(`✓ Diagramas cargados desde backend (${diagrams.length} items)`);
        return;
      }
    } catch (err) {
      console.warn('⚠️ Error intentando cargar del backend: ' + err.message);
    }
    
    // Fallback: load from localStorage if backend is unavailable
    console.log('🟢 [LOAD] Backend no disponible, usando localStorage como fallback');
    console.log('🟢 [LOAD] localStorage contiene:', localDiagrams.length, 'diagramas');
    STATE.fibraDiagrams = localDiagrams;
    renderDiagramsList(localDiagrams);
    console.log(`✓ Diagramas cargados desde localStorage (${localDiagrams.length} items)`);
    
  } catch (err) {
    console.error('Error al cargar diagramas:', err);
    renderDiagramsList([]);
  }
}

function renderDiagramsList(diagrams) {
  // FASE 14: Soportar llamadas sin argumentos (usar STATE.fibraDiagrams)
  if (!diagrams || diagrams.length === undefined) {
    diagrams = STATE.fibraDiagrams || [];
  }
  console.log('🟣 [RENDER] renderDiagramsList() LLAMADA');
  console.log('🟣 [RENDER] Recibió', diagrams?.length, 'diagramas');
  console.log('🟣 [RENDER] Contenido:', diagrams);
  const container = document.getElementById('diagramsList');
  const countEl = document.getElementById('diagramsCount');
  const gponInternetEl = document.getElementById('gponInternetCount');
  const gponTelEl = document.getElementById('gponTelCount');
  const aireInternetEl = document.getElementById('aireInternetCount');
  const aireTelEl = document.getElementById('aireTelCount');
  const isAdmin = STATE.authUser && STATE.authUser.role === 'admin';
  const perms = STATE.authUser?.permissions || [];
  const canEditDiagrams = isAdmin || perms.includes('edit_diagrams');
  
  if (!container) {
    console.error('🟣 [RENDER] ERROR: No hay container #diagramsList');
    return;
  }
  console.log('🟣 [RENDER] Container encontrado, isAdmin:', isAdmin);
  
  if (countEl) countEl.textContent = diagrams.length;
  
  // Calculate counts by category
  let gponInternet = 0, gponTel = 0, aireInternet = 0, aireTel = 0;
  diagrams.forEach(d => {
    const parent = d.parentCategory || 'GPON';
    const sub = d.subcategory || 'Internet';
    if (parent === 'GPON' && sub === 'Internet') gponInternet++;
    else if (parent === 'GPON' && sub === 'Telefonía') gponTel++;
    else if (parent === 'Aire' && sub === 'Internet') aireInternet++;
    else if (parent === 'Aire' && sub === 'Telefonía') aireTel++;
  });
  
  // Update counters
  if (gponInternetEl) gponInternetEl.textContent = gponInternet;
  if (gponTelEl) gponTelEl.textContent = gponTel;
  if (aireInternetEl) aireInternetEl.textContent = aireInternet;
  if (aireTelEl) aireTelEl.textContent = aireTel;
  
  container.innerHTML = '';
  
  if (!diagrams || diagrams.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;padding:60px 40px;text-align:center;color:var(--cw-text-muted)"><div style="font-size:48px;margin-bottom:16px">🌳</div><p style="font-size:15px;line-height:1.6">No hay árboles de decisión aún.<br><strong style="color:var(--cw-text)">Crea uno para comenzar</strong></p></div>';
    return;
  }
  
  // Apply saved order from localStorage
  const savedOrder = JSON.parse(localStorage.getItem('cw:diagramsOrder') || '[]');
  if (savedOrder.length > 0) {
    // Sort diagrams according to saved order
    diagrams.sort((a, b) => {
      const aIndex = savedOrder.indexOf(a.id);
      const bIndex = savedOrder.indexOf(b.id);
      // If a diagram is not in saved order, put it at the end
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
    console.log('🟣 [RENDER] Aplicado orden personalizado desde localStorage');
  }
  
  diagrams.forEach(diagram => {
    console.log('🟣 [RENDER] Renderizando diagrama:', diagram.id, diagram.title);
    console.log('🟣 [RENDER] rootNode existe?', !!diagram.rootNode);
    console.log('🟣 [RENDER] Contenido del diagrama:', diagram);
    const card = document.createElement('div');
    card.className = 'diagram-card';
    card.draggable = isAdmin; // Solo admins pueden arrastrar
    card.dataset.diagramId = diagram.id;
    card.style.cssText = `
      background:linear-gradient(135deg, var(--cw-surface) 0%, var(--cw-bg) 100%);
      border:2px solid var(--cw-border);
      border-radius:16px;
      padding:28px;
      cursor:pointer;
      transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display:flex;
      flex-direction:column;
      gap:18px;
      position:relative;
      overflow:hidden;
      box-shadow:0 2px 8px rgba(0,0,0,0.05);
      ${isAdmin ? '' : 'opacity: 0.95;'}
    `;
    
    // Agregar pseudo-elemento de gradiente on hover
    card.addEventListener('mouseenter', () => {
      card.style.borderColor = 'var(--cw-primary)';
      card.style.boxShadow = '0 10px 28px rgba(255, 128, 51, 0.2)';
      card.style.transform = 'translateY(-4px)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.borderColor = 'var(--cw-border)';
      card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
      card.style.transform = 'translateY(0)';
    });
    
    // Count nodes recursively for hierarchical structure
    const countNodes = (node) => {
      if (!node) return 0;
      let count = 1;
      if (node.options && Array.isArray(node.options)) {
        node.options.forEach(opt => {
          if (opt.node) count += countNodes(opt.node);
        });
      }
      return count;
    };
    
    // Count solutions recursively
    const countSolutions = (node) => {
      if (!node) return 0;
      let count = node.type === 'solution' ? 1 : 0;
      if (node.options && Array.isArray(node.options)) {
        node.options.forEach(opt => {
          if (opt.node) count += countSolutions(opt.node);
        });
      }
      return count;
    };
    
    const nodeCount = diagram.rootNode ? countNodes(diagram.rootNode) : 0;
    const solutionCount = diagram.rootNode ? countSolutions(diagram.rootNode) : 0;
    
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px">
        <div style="flex:1">
          <h3 style="margin:0 0 14px 0;font-size:20px;font-weight:800;color:var(--cw-text);line-height:1.3;letter-spacing:-0.5px">🌳 ${escapeHtml(diagram.title)}</h3>
          
          <!-- Categorías Badge -->
          <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
            <span style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1));border:1px solid rgba(16, 185, 129, 0.3);border-radius:20px;font-size:11px;font-weight:700;color:#10b981;white-space:nowrap;letter-spacing:0.5px">
              ${diagram.parentCategory === 'GPON' ? '🌐' : '📡'} ${diagram.parentCategory || 'GPON'}
            </span>
            <span style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1));border:1px solid rgba(59, 130, 246, 0.3);border-radius:20px;font-size:11px;font-weight:700;color:#2563eb;white-space:nowrap;letter-spacing:0.5px">
              ${diagram.subcategory === 'Internet' ? '🌍' : '☎️'} ${diagram.subcategory || 'Internet'}
            </span>
          </div>
          
          <div style="display:flex;gap:20px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--cw-text-muted);font-weight:600">
              <span style="font-size:16px">📊</span>
              <span>${nodeCount} <span style="color:var(--cw-text)">nodos</span></span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--cw-text-muted);font-weight:600">
              <span style="font-size:16px">✅</span>
              <span>${solutionCount} <span style="color:var(--cw-text)">soluciones</span></span>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="diagram-view-btn" data-id="${diagram.id}" style="background:linear-gradient(135deg, #10b981, #059669);color:white;border:none;border-radius:10px;width:44px;height:44px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;transition:all 0.3s;font-weight:700;box-shadow:0 2px 8px rgba(16, 185, 129, 0.3)" title="Ver este árbol">👁️</button>
          ${canEditDiagrams ? `
            <button class="diagram-edit-btn" data-id="${diagram.id}" style="background:linear-gradient(135deg, var(--cw-primary), var(--cw-secondary));color:white;border:none;border-radius:10px;width:44px;height:44px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;transition:all 0.3s;font-weight:700;box-shadow:0 2px 8px rgba(255, 128, 51, 0.3)" title="Editar este árbol">✏️</button>
            <button class="diagram-delete-btn" data-id="${diagram.id}" style="background:linear-gradient(135deg, #ef4444, #dc2626);color:white;border:none;border-radius:10px;width:44px;height:44px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;transition:all 0.3s;font-weight:700;box-shadow:0 2px 8px rgba(239, 68, 68, 0.3)" title="Eliminar este árbol">🗑️</button>
          ` : ''}
        </div>
      </div>
      <p style="margin:0;font-size:13px;color:var(--cw-text-muted);line-height:1.6;padding-top:12px;border-top:1px solid var(--cw-border);font-weight:600">📌 ${isAdmin ? '👁️ Ver • ✏️ Editar • Arrastra para reorganizar' : '👁️ Haz clic para ver detalle'}</p>
    `;
    
    // Click handler para abrir
    card.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        openDiagramViewer(diagram);
      }
    });
    
    // View button (para todos)
    card.querySelector('.diagram-view-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      showDiagramViewer(diagram);
    });
    
    // Edit button (para usuarios con permiso edit_diagrams)
    if (canEditDiagrams) {
      card.querySelector('.diagram-edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openDiagramEditor(diagram);
      });
      
      // Delete button (para usuarios con permiso edit_diagrams)
      card.querySelector('.diagram-delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteDiagram(diagram.id);
      });
    }
    
    container.appendChild(card);
  });
  
  // Setup drag/drop reordering (solo para admins)
  if (isAdmin) {
    let draggedCardId = null;
    let draggedElement = null;
    
    // Setup draggable on all cards
    const cards = container.querySelectorAll('.diagram-card');
    cards.forEach((card, idx) => {
      card.draggable = true;
      
      card.addEventListener('dragstart', (e) => {
        draggedElement = card;
        draggedCardId = card.dataset.diagramId;
        card.classList.add('dragging');
        card.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedCardId);
        setTimeout(() => {
          card.style.visibility = 'hidden';
        }, 0);
      });
      
      card.addEventListener('dragend', (e) => {
        card.classList.remove('dragging');
        card.style.opacity = '1';
        card.style.visibility = 'visible';
        document.querySelectorAll('.diagram-card').forEach(c => {
          c.classList.remove('drag-over');
          c.style.borderTop = '';
        });
        draggedElement = null;
        draggedCardId = null;
        
        // Save new order to localStorage
        const newOrder = Array.from(container.querySelectorAll('.diagram-card')).map(c => c.dataset.diagramId);
        localStorage.setItem('cw:diagramsOrder', JSON.stringify(newOrder));
        console.log('✓ Orden de diagramas guardado:', newOrder);
      });
      
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (card !== draggedElement) {
          card.classList.add('drag-over');
        }
      });
      
      card.addEventListener('dragleave', (e) => {
        card.classList.remove('drag-over');
      });
      
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedElement && draggedElement !== card) {
          // Get positions
          const allCards = Array.from(container.querySelectorAll('.diagram-card'));
          const draggedIndex = allCards.indexOf(draggedElement);
          const targetIndex = allCards.indexOf(card);
          
          // Swap positions
          if (draggedIndex < targetIndex) {
            card.parentNode.insertBefore(draggedElement, card.nextSibling);
          } else {
            card.parentNode.insertBefore(draggedElement, card);
          }
        }
        card.classList.remove('drag-over');
      });
    });
  }
  
  console.log('🟣 [RENDER] renderDiagramsList COMPLETADO');
}

// Create new diagram wizard modal
function openNewDiagramModal() {
  try {
    // Check permissions
    const isAdmin = STATE.authUser && STATE.authUser.role === 'admin';
    const perms = STATE.authUser?.permissions || [];
    const canCreateDiagrams = isAdmin || perms.includes('edit_diagrams');
    
    if (!canCreateDiagrams) {
      alert('⛔ No tienes permisos para crear árboles de decisión');
      return;
    }
    
    // Create wizard modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;z-index:10000;backdrop-filter:blur(5px);overflow-y:auto;padding:20px';
    
    modal.innerHTML = `
      <div class="modal-content" style="max-width:700px;width:100%;background:var(--cw-surface);border-radius:20px;box-shadow:0 25px 80px rgba(0,0,0,0.4);overflow:hidden;display:flex;flex-direction:column;max-height:90vh;border:1px solid var(--cw-border)">
        <!-- Header -->
        <div style="background:linear-gradient(135deg, #10b981 0%, #059669 100%);color:white;padding:32px;border-bottom:1px solid rgba(16, 185, 129, 0.3)">
          <h2 style="margin:0 0 8px 0;font-size:26px;font-weight:800">✨ Crear Nuevo Árbol</h2>
          <div style="font-size:14px;opacity:0.9">Paso a paso - Es muy fácil</div>
        </div>
        
        <!-- Content -->
        <div style="flex:1;overflow-y:auto;padding:32px;display:flex;flex-direction:column;gap:24px">
          <!-- Step 1: Title -->
          <div style="display:flex;flex-direction:column;gap:12px">
            <label style="font-size:14px;font-weight:700;color:var(--cw-text);display:flex;align-items:center;gap:8px"><span style="background:linear-gradient(135deg, #10b981, #059669);color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800">1</span> ¿Cuál es el nombre del árbol?</label>
            <input type="text" id="newDiagramTitle" maxlength="100" placeholder="Ej: Solución de problemas con internet" style="padding:14px 16px;border:2px solid var(--cw-border);border-radius:10px;background:var(--cw-surface);color:var(--cw-text);font-family:var(--font-stack);font-size:15px;transition:all 0.3s" class="diagram-input">
            <div style="font-size:12px;color:var(--cw-text-muted)">💡 Usa un nombre descriptivo que explique el propósito del árbol (máx. 100 caracteres)</div>
          </div>
          
          <!-- Step 1.5: Category Selection (Hierarchical) -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div style="display:flex;flex-direction:column;gap:12px">
              <label style="font-size:14px;font-weight:700;color:var(--cw-text);display:flex;align-items:center;gap:8px"><span style="background:linear-gradient(135deg, #10b981, #059669);color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800">1.5</span> Tipo de Red</label>
              <select id="newDiagramParentCategory" style="padding:14px 16px;border:2px solid var(--cw-border);border-radius:10px;background:var(--cw-surface);color:var(--cw-text);font-family:var(--font-stack);font-size:15px;cursor:pointer;transition:all 0.3s;font-weight:600">
                <option value="GPON">🌐 GPON</option>
                <option value="Aire">📡 Aire</option>
              </select>
              <div style="font-size:12px;color:var(--cw-text-muted)">🌐 Selecciona la infraestructura de red</div>
            </div>
            
            <div style="display:flex;flex-direction:column;gap:12px">
              <label style="font-size:14px;font-weight:700;color:var(--cw-text);display:flex;align-items:center;gap:8px"><span style="background:linear-gradient(135deg, #10b981, #059669);color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800">1.6</span> Servicio</label>
              <select id="newDiagramSubcategory" style="padding:14px 16px;border:2px solid var(--cw-border);border-radius:10px;background:var(--cw-surface);color:var(--cw-text);font-family:var(--font-stack);font-size:15px;cursor:pointer;transition:all 0.3s;font-weight:600">
                <option value="Internet">🌍 Internet</option>
                <option value="Telefonía">☎️ Telefonía</option>
              </select>
              <div style="font-size:12px;color:var(--cw-text-muted)">☎️ Elige el tipo de servicio</div>
            </div>
          </div>
          
          <!-- Step 2: Initial Question -->
          <div style="display:flex;flex-direction:column;gap:12px">
            <label style="font-size:14px;font-weight:700;color:var(--cw-text);display:flex;align-items:center;gap:8px"><span style="background:linear-gradient(135deg, #10b981, #059669);color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800">2</span> ¿Cuál es la pregunta inicial?</label>
            <textarea id="newDiagramRootQuestion" maxlength="500" placeholder="Ej: ¿El router está encendido?" style="padding:14px 16px;border:2px solid var(--cw-border);border-radius:10px;background:var(--cw-surface);color:var(--cw-text);font-family:var(--font-stack);font-size:15px;min-height:80px;resize:vertical;transition:all 0.3s" class="diagram-input"></textarea>
            <div style="font-size:12px;color:var(--cw-text-muted)">❓ Esta será la primera pregunta que verán los usuarios (máx. 500 caracteres)</div>
          </div>
          
          <!-- Info Box -->
          <div style="background:linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1));border-left:4px solid #10b981;padding:16px;border-radius:10px">
            <div style="font-weight:700;color:var(--cw-text);margin-bottom:6px">📌 Después de crear...</div>
            <div style="font-size:13px;color:var(--cw-text-muted);line-height:1.6">Podrás agregar más preguntas, soluciones y conectarlas. La interfaz de edición es visual e intuitiva.</div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background:var(--cw-bg);border-top:2px solid var(--cw-border);padding:20px 32px;display:flex;gap:12px;justify-content:flex-end;flex-wrap:wrap">
          <button class="cancel diagram-cancel" style="padding:12px 24px;cursor:pointer;border:2px solid var(--cw-border);background:var(--cw-surface);border-radius:10px;font-weight:600;font-family:var(--font-stack);transition:all 0.3s;color:var(--cw-text)">Cancelar</button>
          <button id="createDiagramWizardBtn" class="create-diagram-btn" style="padding:12px 28px;cursor:pointer;background:linear-gradient(135deg, #10b981, #059669);color:white;border:none;border-radius:10px;font-weight:700;font-family:var(--font-stack);transition:all 0.3s;box-shadow:0 4px 12px rgba(16, 185, 129, 0.3)">Crear 🎉</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Initialize custom selects for this modal
    setTimeout(() => {
      initializeCustomSelectsForElement('newDiagramParentCategory');
      initializeCustomSelectsForElement('newDiagramSubcategory');
      
      // Add event listener for category select change
      const parentCategorySelect = modal.querySelector('#newDiagramParentCategory');
      if (parentCategorySelect) {
        parentCategorySelect.addEventListener('change', (e) => {
          updateSubcategoryOptions(e.target.value);
        });
      }
      
      // Add hover effect listeners for diagram inputs
      const diagramInputs = modal.querySelectorAll('.diagram-input');
      diagramInputs.forEach(input => {
        input.addEventListener('focus', () => {
          input.style.borderColor = '#10b981';
        });
        input.addEventListener('blur', () => {
          input.style.borderColor = 'var(--cw-border)';
        });
      });
      
      // Add hover effects for buttons
      const cancelBtn = modal.querySelector('.diagram-cancel');
      if (cancelBtn) {
        cancelBtn.addEventListener('mouseenter', () => {
          cancelBtn.style.background = 'var(--cw-bg)';
        });
        cancelBtn.addEventListener('mouseleave', () => {
          cancelBtn.style.background = 'var(--cw-surface)';
        });
      }
      
      const createBtn = modal.querySelector('.create-diagram-btn');
      if (createBtn) {
        createBtn.addEventListener('mouseenter', () => {
          createBtn.style.transform = 'translateY(-2px)';
          createBtn.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
        });
        createBtn.addEventListener('mouseleave', () => {
          createBtn.style.transform = 'translateY(0)';
          createBtn.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
        });
      }
    }, 50);
    
    // Cancel button
    modal.querySelector('.cancel').addEventListener('click', () => modal.remove());
    
    // Create button with validation
    modal.querySelector('#createDiagramWizardBtn').addEventListener('click', async () => {
      try {
        const title = modal.querySelector('#newDiagramTitle')?.value.trim();
        const rootQuestion = modal.querySelector('#newDiagramRootQuestion')?.value.trim();
        const parentCategory = modal.querySelector('#newDiagramParentCategory')?.value || 'GPON';
        const subcategory = modal.querySelector('#newDiagramSubcategory')?.value || 'Internet';
        
        // Validations
        if (!title || title.length === 0) {
          alert('⚠️ Por favor ingresa un nombre para el árbol');
          modal.querySelector('#newDiagramTitle')?.focus();
          return;
        }
        
        if (title.length > 100) {
          alert('⚠️ El nombre es demasiado largo (máximo 100 caracteres)');
          return;
        }
        
        if (!rootQuestion || rootQuestion.length === 0) {
          alert('⚠️ Por favor ingresa la pregunta inicial');
          modal.querySelector('#newDiagramRootQuestion')?.focus();
          return;
        }
        
        if (rootQuestion.length > 500) {
          alert('⚠️ La pregunta es demasiado larga (máximo 500 caracteres)');
          return;
        }
        
        // Generate IDs
        const diagramId = 'diagram-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const rootNodeId = 'node-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        // Create diagram with hierarchical structure
        const newDiagram = {
          id: diagramId,
          title: title,
          parentCategory: parentCategory,
          subcategory: subcategory,
          rootNode: {
            id: rootNodeId,
            type: 'question',
            content: rootQuestion,
            options: []
          },
          createdAt: new Date().toISOString()
        };
        
        // Save to backend FIRST
        let savedToBackend = false;
        try {
          const response = await fetch(apiUrl('/diagrams'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newDiagram)
          });
          
          if (response.ok) {
            savedToBackend = true;
            const savedData = await response.json();
            newDiagram.id = savedData.id || newDiagram.id;
            console.log('✓ Diagrama creado en backend con ID:', newDiagram.id);
          } else {
            console.error(`❌ Backend retornó ${response.status}`);
            const errorText = await response.text();
            console.error('Error:', errorText);
          }
        } catch (err) {
          console.error('❌ No se pudo conectar al backend:', err.message);
          console.error('Stack:', err.stack);
        }
        
        // ALWAYS save to localStorage as backup
        const diagrams = STATE.fibraDiagrams || [];
        diagrams.push(newDiagram);
        STATE.fibraDiagrams = diagrams;
        localStorage.setItem('cw:fibraDiagrams', JSON.stringify(diagrams));
        localStorage.setItem('hasLocalData', 'true'); // Flag to use localStorage on reload
        console.log('✓ Diagrama guardado en localStorage (backup)');
        
        modal.remove();
        // Open editor directly with new diagram (no need to reload)
        setTimeout(() => openDiagramEditor(newDiagram), 300);
      } catch (err) {
        console.error('Error al crear diagrama:', err);
        alert('❌ Error: ' + (err.message || 'No se pudo crear el árbol'));
      }
    });
    
    // Focus first input
    setTimeout(() => {
      const input = document.getElementById('newDiagramTitle');
      if (input) input.focus();
    }, 100);
  } catch (err) {
    console.error('Error en abrirNuevoDiagramaModal:', err);
    alert('❌ Error: ' + err.message);
  }
}

function openDiagramViewer(diagram) {
  // All users can view, admins can edit separately
  showDiagramViewer(diagram);
}
function showDiagramViewer(diagram) {
  // Add to history
  addDiagramToHistory(diagram.id);
  renderHistory(); // Update history view in real-time
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;z-index:10000;backdrop-filter:blur(5px);overflow-y:auto;padding:20px';
  
  // Count nodes in hierarchical structure
  let nodeCount = 0;
  const countNodes = (node) => {
    if (!node) return;
    nodeCount++;
    if (node.options && node.options.length > 0) {
      node.options.forEach(opt => {
        if (opt.node) countNodes(opt.node);
      });
    }
  };
  countNodes(diagram.rootNode);
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width:750px;width:100%;background:var(--cw-surface);border-radius:20px;box-shadow:0 25px 80px rgba(0,0,0,0.4);overflow:hidden;display:flex;flex-direction:column;max-height:90vh;border:1px solid var(--cw-border)">
      <div style="background:linear-gradient(135deg, var(--cw-primary) 0%, var(--cw-secondary) 100%);color:white;padding:32px;display:flex;justify-content:space-between;align-items:flex-start;gap:20px;border-bottom:1px solid rgba(255, 128, 51, 0.3)">
        <div style="flex:1">
          <h2 style="margin:0 0 8px 0;font-size:26px;font-weight:800">🌳 ${escapeHtml(diagram.title)}</h2>
          <div style="font-size:13px;opacity:0.9;display:flex;gap:16px;flex-wrap:wrap">
            <span>📊 ${nodeCount} nodos</span>
            <span>✓ Árbol de decisiones</span>
          </div>
        </div>
        <button class="close" style="position:absolute;top:40px;right:40px;background:rgba(255,255,255,0.2);border:none;cursor:pointer;font-size:24px;padding:0;border-radius:10px;transition:all 0.2s;color:white;font-weight:bold;flex-shrink:0;display:flex;align-items:center;justify-content:center;width:44px;height:44px;line-height:1">×</button>
      </div>
      
      <!-- Toolbar de acciones FASE 10 -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:0;padding:16px 32px;background:var(--cw-surface-alt);border-bottom:1px solid var(--cw-border);justify-content:flex-start">
        <button id="diagramShareBtn" title="Compartir árbol" style="padding:10px 16px;background:#10b981;color:white;border:none;border-radius:8px;font-size:13px;cursor:pointer;font-weight:600;transition:all 0.2s;font-family:var(--font-stack);display:flex;align-items:center;gap:6px">🔗 Compartir</button>
        <button id="diagramPresentationBtn" title="Modo presentación" style="padding:10px 16px;background:#8b5cf6;color:white;border:none;border-radius:8px;font-size:13px;cursor:pointer;font-weight:600;transition:all 0.2s;font-family:var(--font-stack);display:flex;align-items:center;gap:6px">🎬 Presentar</button>
      </div>
      
      <div id="diagramViewerContent" style="flex:1;overflow-y:auto;padding:32px;display:flex;flex-direction:column;gap:24px;background:var(--cw-bg)">
        <div id="diagramViewer" style="display:flex;flex-direction:column;gap:20px"></div>
      </div>
    </div>
  `;
  
  const closeBtn = modal.querySelector('.close');
  closeBtn.addEventListener('click', () => modal.remove());
  closeBtn.addEventListener('mouseenter', () => closeBtn.style.background = 'rgba(255,255,255,0.3)');
  closeBtn.addEventListener('mouseleave', () => closeBtn.style.background = 'rgba(255,255,255,0.2)');
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  document.body.appendChild(modal);
  
  // Track navigation history for back button
  const viewerState = { history: [] };
  
  // Start rendering the tree - usa null porque usamos estructura jerárquica con rootNode
  renderDiagramNode(diagram, null, modal.querySelector('#diagramViewer'), viewerState, diagram, diagram.rootNode);
  
  // Wire FASE 10 action buttons
  const shareBtn = modal.querySelector('#diagramShareBtn');
  const presentationBtn = modal.querySelector('#diagramPresentationBtn');
  
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const shareLink = generateDiagramShareLink(diagram.id);
      const qrUrl = generateDiagramQR(diagram.id);
      
      if (!shareLink) {
        await showAlert('Error', 'No se pudo generar el enlace compartible');
        return;
      }
      
      const shareModal = document.createElement('div');
      shareModal.className = 'modal';
      shareModal.style.zIndex = '16000';
      shareModal.innerHTML = `
        <div class="modal-content" style="max-width:500px">
          <button class="close" data-close style="position:absolute;top:20px;right:20px">✕</button>
          <h4 style="margin-bottom:20px">🔗 Compartir Árbol</h4>
          <div style="display:flex;flex-direction:column;gap:16px">
            <div style="background:var(--cw-surface-alt);padding:16px;border-radius:10px;border:1px dashed var(--cw-border)">
              <div style="font-size:12px;color:var(--cw-text-muted);margin-bottom:8px">Enlace compartible:</div>
              <div style="display:flex;gap:8px">
                <input type="text" value="${shareLink}" readonly style="flex:1;padding:10px;border:1px solid var(--cw-border);border-radius:6px;background:var(--cw-surface);color:var(--cw-text);font-family:monospace;font-size:12px" class="share-link-input" />
                <button class="copy-share-link-btn" style="padding:10px 16px;background:var(--cw-primary);color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600">Copiar</button>
              </div>
            </div>
            ${qrUrl ? `<div style="text-align:center;background:var(--cw-surface-alt);padding:20px;border-radius:10px">
              <div style="font-size:12px;color:var(--cw-text-muted);margin-bottom:12px">Código QR:</div>
              <img src="${qrUrl}" style="max-width:200px;border-radius:8px" />
            </div>` : ''}
            <div style="font-size:12px;color:var(--cw-text-muted);background:rgba(255,193,7,0.1);padding:12px;border-radius:8px">
              ℹ️ El enlace es válido por 30 días
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(shareModal);
      shareModal.querySelector('[data-close]')?.addEventListener('click', () => shareModal.remove());
      
      // Add copy button listener
      const copyBtn = shareModal.querySelector('.copy-share-link-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
          const input = shareModal.querySelector('.share-link-input');
          try {
            await navigator.clipboard.writeText(input.value);
            copyBtn.textContent = '✓ Copiado';
            setTimeout(() => {
              copyBtn.textContent = 'Copiar';
            }, 2000);
          } catch (err) {
            console.error('Error copying to clipboard:', err);
          }
        });
      }
    });
  }
  

  
  if (presentationBtn) {
    presentationBtn.addEventListener('click', () => {
      modal.remove();
      startDiagramPresentation(diagram.id);
    });
  }
}

// Parámetro directNode para renderizar nodos jerárquicos
function renderDiagramNode(diagram, nodeId, container, viewerState, fullDiagram, directNode) {
  const node = directNode || (diagram.nodes && diagram.nodes[nodeId]) || (diagram.rootNode && !nodeId ? diagram.rootNode : null);
  
  if (!node) return;
  
  const nodeEl = document.createElement('div');
  const isQuestion = node.type === 'question';
  const isRoot = !viewerState.history || viewerState.history.length === 0;
  
  nodeEl.style.cssText = `
    background:${isQuestion ? 'linear-gradient(135deg, var(--cw-primary) 0%, var(--cw-secondary) 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'};
    color:white;
    padding:28px 32px;
    border-radius:16px;
    animation:slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow:0 8px 24px ${isQuestion ? 'rgba(255, 128, 51, 0.3)' : 'rgba(16, 185, 129, 0.3)'};
    border:1px solid ${isQuestion ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)'};
  `;
  
  const optionsCount = node.options ? node.options.length : 0;
  
  nodeEl.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:24px">
      <div style="display:flex;align-items:flex-start;gap:20px">
        <div style="font-size:48px;flex-shrink:0;line-height:1">${isQuestion ? '❓' : '✓'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:20px;font-weight:800;line-height:1.4;margin-bottom:${node.image ? '16px' : node.options ? '24px' : '0'};letter-spacing:-0.5px">${escapeHtml(node.content)}</div>
          ${node.image ? `<img src="${node.image}" style="max-width:300px;max-height:200px;border-radius:12px;border:2px solid rgba(255,255,255,0.3);object-fit:cover;margin-bottom:16px" />` : ''}
          ${node.options ? `
            <div style="display:grid;gap:12px;grid-template-columns:repeat(auto-fit, minmax(160px, 1fr))">
              ${node.options.map((opt, idx) => `
                <button class="diagram-option-btn" data-option-idx="${idx}" style="background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.3);color:white;${opt.image ? 'padding:0' : 'padding:16px 20px'};border-radius:12px;cursor:pointer;transition:all 0.3s;text-align:center;font-weight:700;font-size:${opt.image ? '14px' : '15px'};font-family:var(--font-stack);backdrop-filter:blur(10px);position:relative;overflow:hidden;display:flex;flex-direction:column;gap:0;align-items:stretch;justify-content:flex-end;${opt.image ? 'min-height:160px' : ''}">
                  ${opt.image ? `<img src="${opt.image}" style="width:100%;height:120px;object-fit:cover;border-radius:10px 10px 0 0;border:1px solid rgba(255,255,255,0.2);border-bottom:none" />` : ''}
                  <span style="position:relative;z-index:1;${opt.image ? 'padding:12px 14px;background:rgba(0,0,0,0.3);border-radius:0 0 10px 10px;line-height:1.3' : ''};width:100%;word-wrap:break-word">${escapeHtml(opt.label)}</span>
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
  
  // Add back button if not root
  if (!isRoot && viewerState && viewerState.history && viewerState.history.length > 0) {
    const backBtn = document.createElement('button');
    backBtn.style.cssText = 'position:absolute;top:12px;right:12px;background:rgba(255,255,255,0.2);border:none;color:white;padding:8px 16px;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;transition:all 0.2s;font-family:var(--font-stack)';
    backBtn.innerHTML = '← Volver';
    backBtn.addEventListener('mouseenter', () => backBtn.style.background = 'rgba(255,255,255,0.3)');
    backBtn.addEventListener('mouseleave', () => backBtn.style.background = 'rgba(255,255,255,0.2)');
    backBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      viewerState.history.pop();
      container.innerHTML = '';
      const prevNode = viewerState.history[viewerState.history.length - 1];
      renderDiagramNode(diagram, null, container, viewerState, fullDiagram, prevNode);
    });
    nodeEl.style.position = 'relative';
    nodeEl.appendChild(backBtn);
  }
  
  container.appendChild(nodeEl);
  
  // Add zoom to node image
  const nodeImage = nodeEl.querySelector('img[src*="data:image"]');
  if (nodeImage && node.image) {
    nodeImage.style.cursor = 'pointer';
    nodeImage.style.transition = 'transform 0.2s, filter 0.2s';
    nodeImage.addEventListener('mouseover', () => {
      nodeImage.style.filter = 'brightness(0.85)';
      nodeImage.style.transform = 'scale(1.03)';
    });
    nodeImage.addEventListener('mouseout', () => {
      nodeImage.style.filter = 'brightness(1)';
      nodeImage.style.transform = 'scale(1)';
    });
    nodeImage.addEventListener('click', () => openImageZoom(node.image, node.content));
  }
  
  // Add zoom to option images
  nodeEl.querySelectorAll('.diagram-option-btn img').forEach((img, idx) => {
    if (node.options && node.options[idx] && node.options[idx].image) {
      img.style.cursor = 'pointer';
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        openImageZoom(node.options[idx].image, node.options[idx].label);
      });
    }
  });
  
  // Wire button handlers
  nodeEl.querySelectorAll('.diagram-option-btn').forEach(btn => {
    btn.addEventListener('mouseover', () => {
      btn.style.background = 'rgba(255,255,255,0.25)';
      btn.style.borderColor = 'rgba(255,255,255,0.5)';
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    });
    btn.addEventListener('mouseout', () => {
      btn.style.background = 'rgba(255,255,255,0.15)';
      btn.style.borderColor = 'rgba(255,255,255,0.3)';
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = 'none';
    });
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.optionIdx);
      const nextOption = node.options[idx];
      
      if (!nextOption || !nextOption.node) {
        // console.error('Opción sin nodo destino');
        return;
      }
      
      if (viewerState && viewerState.history) viewerState.history.push(node);
      // Clear and render next
      container.innerHTML = '';
      renderDiagramNode(diagram, null, container, viewerState, fullDiagram, nextOption.node);
    });
  });
}


function openDiagramEditor(diagram) {
  try {
    // Add to history
    addDiagramToHistory(diagram.id);
    renderHistory(); // Update history view in real-time
    
    // Validar diagrama
    if (!diagram) {
      // console.error('Diagrama no definido');
      alert('❌ Error: Diagrama no definido');
      return;
    }
    
    // Asegurar estructura jerárquica
    if (!diagram.rootNode) {
      console.warn('rootNode no encontrado, inicializando...');
      diagram.rootNode = {
        id: 'node-root-' + Date.now(),
        type: 'question',
        content: '¿Cuál es el problema?',
        options: []
      };
    }
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.setAttribute('data-diagram-editor', 'true');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;z-index:10000;overflow-y:auto;backdrop-filter:blur(5px);padding:20px';
  
  // Count nodes in hierarchical structure
  let nodeCount = 0;
  const countNodes = (node) => {
    if (!node) return;
    nodeCount++;
    if (node.options && node.options.length > 0) {
      node.options.forEach(opt => {
        if (opt.node) countNodes(opt.node);
      });
    }
  };
  countNodes(diagram.rootNode);
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width:1000px;width:100%;background:var(--cw-surface);border-radius:20px;box-shadow:0 25px 80px rgba(0,0,0,0.4);overflow:hidden;display:flex;flex-direction:column;max-height:90vh;border:1px solid var(--cw-border)">
      <!-- Header -->
      <div style="background:linear-gradient(135deg, var(--cw-primary) 0%, var(--cw-secondary) 100%);color:white;padding:32px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255, 128, 51, 0.3)">
        <div style="flex:1">
          <h2 style="margin:0 0 8px 0;font-size:26px;font-weight:800">✏️ ${escapeHtml(diagram.title)}</h2>
          <div style="font-size:13px;opacity:0.9">Editar árbol de decisiones • ${nodeCount} nodos</div>
        </div>
        <button class="close" style="position:absolute;top:40px;right:40px;background:rgba(255,255,255,0.2);border:none;cursor:pointer;font-size:24px;padding:0;border-radius:10px;transition:all 0.2s;color:white;font-weight:bold;flex-shrink:0;display:flex;align-items:center;justify-content:center;width:44px;height:44px;line-height:1">×</button>
      </div>
      
      <!-- Two-column layout: Editor | Preview -->
      <div style="flex:1;overflow:hidden;display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:2px solid var(--cw-border)">
        <!-- Left: Editor Panel -->
        <div style="overflow-y:auto;padding:28px;display:flex;flex-direction:column;gap:20px;border-right:2px solid var(--cw-border);background:var(--cw-bg)">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
            <div style="font-size:24px">📝</div>
            <div>
              <div style="font-weight:700;color:var(--cw-text);font-size:16px">Editar Nodos</div>
              <div style="font-size:12px;color:var(--cw-text-muted)">Haz cambios en tiempo real</div>
            </div>
          </div>
          <div id="nodesEditorContainer" style="display:flex;flex-direction:column;gap:16px"></div>
          <button id="addNodeBtn" class="add-node-btn" style="background:linear-gradient(135deg, #10b981, #059669);color:white;border:none;padding:14px 20px;border-radius:12px;cursor:pointer;font-weight:700;font-size:14px;font-family:var(--font-stack);transition:all 0.3s;display:flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(16, 185, 129, 0.3);margin-top:8px">
            <span style="font-size:18px">➕</span>
            <span>Agregar nodo</span>
          </button>
        </div>
        
        <!-- Right: Live Preview -->
        <div style="overflow-y:auto;padding:28px;display:flex;flex-direction:column;gap:16px;background:var(--cw-surface)">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
            <div style="font-size:24px">👁️</div>
            <div>
              <div style="font-weight:700;color:var(--cw-text);font-size:16px">Vista Previa</div>
              <div style="font-size:12px;color:var(--cw-text-muted)">Cómo se verá para los usuarios</div>
            </div>
          </div>
          <div id="editorPreviewContainer" style="display:flex;flex-direction:column;gap:16px;flex:1"></div>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background:var(--cw-bg);border-top:2px solid var(--cw-border);padding:20px 32px;display:flex;gap:12px;justify-content:flex-end;flex-wrap:wrap">
        <button class="cancel-btn editor-cancel" style="padding:12px 24px;cursor:pointer;border:2px solid var(--cw-border);background:var(--cw-surface);border-radius:10px;font-weight:600;font-family:var(--font-stack);transition:all 0.2s;color:var(--cw-text)">Cancelar</button>
        <button id="saveDiagramBtn" class="save-diagram-btn" style="padding:12px 28px;cursor:pointer;background:linear-gradient(135deg, var(--cw-primary), var(--cw-secondary));color:white;border:none;border-radius:10px;font-weight:700;font-family:var(--font-stack);transition:all 0.3s;box-shadow:0 4px 12px rgba(255, 128, 51, 0.3);display:flex;align-items:center;gap:8px"><span>💾</span> Guardar</button>
      </div>
    </div>
  `;
  
  const closeBtn = modal.querySelector('.close');
  closeBtn.addEventListener('click', () => modal.remove());
  closeBtn.addEventListener('mouseenter', () => closeBtn.style.background = 'rgba(255,255,255,0.3)');
  closeBtn.addEventListener('mouseleave', () => closeBtn.style.background = 'rgba(255,255,255,0.2)');
  
  const cancelBtn = modal.querySelector('.cancel-btn');
  cancelBtn.addEventListener('click', () => modal.remove());
  
  document.body.appendChild(modal);
  
  // Render nodes editor
  const nodesContainer = modal.querySelector('#nodesEditorContainer');
  const previewContainer = modal.querySelector('#editorPreviewContainer');
  const editorState = { diagram: JSON.parse(JSON.stringify(diagram)) };
  
  // Helper to render preview
  const updatePreview = () => {
    previewContainer.innerHTML = '';
    if (editorState.diagram.rootNode) {
      const headerDiv = document.createElement('div');
      headerDiv.style.cssText = 'font-weight:700;font-size:13px;color:var(--cw-text);margin-bottom:12px;padding:12px;background:var(--cw-bg);border-radius:8px;border-left:4px solid var(--cw-primary)';
      headerDiv.innerHTML = '👁️ <strong>Vista previa en tiempo real:</strong>';
      previewContainer.appendChild(headerDiv);
      
      const previewWrapper = document.createElement('div');
      previewWrapper.style.cssText = 'display:flex;flex-direction:column;gap:16px';
      previewContainer.appendChild(previewWrapper);
      
      renderDiagramNode(editorState.diagram, null, previewWrapper, { history: [] }, editorState.diagram, editorState.diagram.rootNode);
    } else {
      const emptyDiv = document.createElement('div');
      emptyDiv.style.cssText = 'text-align:center;color:var(--cw-text-muted);padding:40px 20px';
      emptyDiv.innerHTML = '<div style="font-size:40px;margin-bottom:12px">🌳</div><div>El árbol debe tener un nodo raíz</div>';
      previewContainer.appendChild(emptyDiv);
    }
  };
  
  // Renderizar el nodo raíz
  if (editorState.diagram.rootNode) {
    renderNodeEditorCard(editorState.diagram.rootNode, editorState, nodesContainer, modal, updatePreview);
  } else {
    console.warn('Sin nodo raíz para renderizar');
    nodesContainer.innerHTML = '<p style="color:var(--cw-text-muted);text-align:center;padding:20px">Error: No hay nodo raíz en el árbol</p>';
  }
  
  // Initial preview
  updatePreview();
  
  // The "Add node" button is no longer needed - nodes are created inline within options
  const addNodeBtn = modal.querySelector('#addNodeBtn');
  if (addNodeBtn) {
    addNodeBtn.style.display = 'none';
  }
  
  // Add event listeners for button hover effects
  const editorCancelBtn = modal.querySelector('.editor-cancel');
  if (editorCancelBtn) {
    editorCancelBtn.addEventListener('mouseenter', () => {
      editorCancelBtn.style.background = 'var(--cw-bg)';
    });
    editorCancelBtn.addEventListener('mouseleave', () => {
      editorCancelBtn.style.background = 'var(--cw-surface)';
    });
    editorCancelBtn.addEventListener('click', () => modal.remove());
  }
  
  const saveBtn = modal.querySelector('.save-diagram-btn');
  if (saveBtn) {
    saveBtn.addEventListener('mouseenter', () => {
      saveBtn.style.transform = 'translateY(-2px)';
      saveBtn.style.boxShadow = '0 6px 16px rgba(255, 128, 51, 0.4)';
    });
    saveBtn.addEventListener('mouseleave', () => {
      saveBtn.style.transform = 'translateY(0)';
      saveBtn.style.boxShadow = '0 4px 12px rgba(255, 128, 51, 0.3)';
    });
  }
  
  // Save button
  modal.querySelector('#saveDiagramBtn').addEventListener('click', async () => {
    console.log('🔴 [GUARDAR BOTÓN] Save button clickeado');
    await saveDiagramChanges(editorState.diagram, modal);
    console.log('🔴 [GUARDAR BOTÓN] saveDiagramChanges() completada');
  });
  } catch (err) {
    console.error('Error en openDiagramEditor:', err);
    alert('❌ Error: ' + err.message);
  }
}

function renderNodeEditorCard(node, editorState, container, parentModal, onUpdate) {
  const nodeCard = document.createElement('div');
  nodeCard.dataset.nodeId = node.id;
  nodeCard.style.cssText = `
    background:${node.type === 'question' ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(20, 184, 166, 0.08))' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(5, 150, 105, 0.08)'};
    border:2px solid ${node.type === 'question' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(16, 185, 129, 0.3)'};
    border-radius:14px;
    padding:20px;
    display:flex;
    flex-direction:column;
    gap:16px;
    transition:all 0.3s;
    position:relative;
  `;
  
  const isRoot = node.id === editorState.diagram.rootNodeId;
  const nodeTypeEmoji = node.type === 'question' ? '❓' : '✓';
  
  // Simple header with node type indicator
  const header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:center;gap:12px;justify-content:space-between;border-bottom:1px solid rgba(0,0,0,0.1);padding-bottom:12px';
  header.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;flex:1">
      <div style="font-size:28px">${nodeTypeEmoji}</div>
      <div style="display:flex;flex-direction:column;gap:4px;min-width:0;flex:1">
        <div style="font-weight:700;color:var(--cw-text);font-size:14px">${node.type === 'question' ? '❓ Pregunta' : '✓ Solución'}</div>
        <div style="font-size:10px;color:var(--cw-text-muted);font-family:monospace;opacity:0.6;overflow:hidden;text-overflow:ellipsis">ID: ${node.id}</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;flex-shrink:0">
      ${isRoot ? '<div style="background:#f59e0b;color:#78350f;padding:6px 12px;border-radius:6px;font-weight:700;font-size:11px;white-space:nowrap">🌳 Raíz</div>' : ''}
      <button class="delete-node-btn" data-node-id="${node.id}" style="background:#ef4444;color:white;border:none;border-radius:8px;padding:8px 12px;cursor:pointer;font-weight:700;font-size:12px;transition:all 0.3s;white-space:nowrap">🗑️ Borrar</button>
    </div>
  `;
  nodeCard.appendChild(header);
  
  // Content textarea
  const contentLabel = document.createElement('div');
  contentLabel.style.cssText = 'font-weight:700;font-size:13px;color:var(--cw-text)';
  contentLabel.textContent = 'Texto:';
  nodeCard.appendChild(contentLabel);
  
  const contentArea = document.createElement('textarea');
  contentArea.value = node.content;
  contentArea.style.cssText = 'width:100%;min-height:80px;padding:12px 14px;border:2px solid var(--cw-border);border-radius:10px;background:var(--cw-surface);color:var(--cw-text);font-family:var(--font-stack);resize:vertical;transition:all 0.3s;font-size:14px';
  contentArea.addEventListener('change', (e) => {
    node.content = e.target.value;
    if (onUpdate) onUpdate();
  });
  contentArea.addEventListener('focus', () => contentArea.style.borderColor = node.type === 'question' ? 'var(--cw-secondary)' : '#059669');
  contentArea.addEventListener('blur', () => contentArea.style.borderColor = 'var(--cw-border)');
  nodeCard.appendChild(contentArea);
  
  // Image section
  const imageLabel = document.createElement('div');
  imageLabel.style.cssText = 'font-weight:700;font-size:13px;color:var(--cw-text);margin-top:8px';
  imageLabel.textContent = '🖼️ Imagen (opcional):';
  nodeCard.appendChild(imageLabel);
  
  const imageContainer = document.createElement('div');
  imageContainer.style.cssText = 'display:flex;flex-direction:column;gap:12px;align-items:flex-start;position:relative';
  
  const imageInput = document.createElement('input');
  imageInput.type = 'file';
  imageInput.accept = 'image/*';
  imageInput.style.cssText = 'width:100%;padding:10px 12px;border:2px solid var(--cw-border);border-radius:8px;background:var(--cw-surface);color:var(--cw-text);font-family:var(--font-stack);font-size:13px;cursor:pointer';
  
  const imagePreview = document.createElement('div');
  imagePreview.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;width:140px;position:relative';
  
  const img = document.createElement('img');
  img.style.cssText = 'max-width:140px;max-height:120px;border-radius:8px;border:1px solid var(--cw-border);object-fit:cover;display:none';
  
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.textContent = '✕ Quitar';
  clearBtn.style.cssText = 'background:#ef4444;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:700;font-size:11px;padding:5px 8px;display:none;transition:all 0.2s;width:100%;white-space:nowrap';
  clearBtn.addEventListener('mouseover', () => clearBtn.style.background = '#dc2626');
  clearBtn.addEventListener('mouseout', () => clearBtn.style.background = '#ef4444');
  
  if (node.image) {
    img.src = node.image;
    img.style.display = 'block';
    clearBtn.style.display = 'block';
  }
  
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      node.image = reader.result;
      img.src = node.image;
      img.style.display = 'block';
      clearBtn.style.display = 'block';
      if (onUpdate) onUpdate();
    };
    reader.readAsDataURL(file);
  });
  
  clearBtn.addEventListener('click', () => {
    node.image = null;
    img.style.display = 'none';
    clearBtn.style.display = 'none';
    imageInput.value = '';
    if (onUpdate) onUpdate();
  });
  
  imagePreview.appendChild(img);
  imagePreview.appendChild(clearBtn);
  imageContainer.appendChild(imageInput);
  imageContainer.appendChild(imagePreview);
  nodeCard.appendChild(imageContainer);
  
  // Options section (only for questions)
  if (node.type === 'question') {
    const optionsLabel = document.createElement('div');
    optionsLabel.style.cssText = 'font-weight:700;font-size:13px;color:var(--cw-text);margin-top:8px;display:flex;align-items:center;gap:8px';
    optionsLabel.innerHTML = '↓ <span>Respuestas posibles</span>';
    nodeCard.appendChild(optionsLabel);
    
    const optionsList = document.createElement('div');
    optionsList.style.cssText = 'display:flex;flex-direction:column;gap:12px';
    nodeCard.appendChild(optionsList);
    
    if (node.options && node.options.length > 0) {
      node.options.forEach((opt, idx) => {
        const optDiv = createOptionElement(opt, idx, node, editorState, onUpdate, optionsList);
        optionsList.appendChild(optDiv);
      });
    }
    
    const addBtn = document.createElement('button');
    addBtn.style.cssText = 'padding:12px 14px;background:linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(20, 184, 166, 0.15));border:2px dashed var(--cw-secondary);color:var(--cw-secondary);border-radius:8px;cursor:pointer;font-weight:700;font-size:13px;transition:all 0.3s;font-family:var(--font-stack);margin-top:8px;display:flex;align-items:center;justify-content:center;gap:6px';
    addBtn.innerHTML = '+ Nueva respuesta';
    addBtn.addEventListener('mouseover', () => addBtn.style.background = 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(20, 184, 166, 0.25))');
    addBtn.addEventListener('mouseout', () => addBtn.style.background = 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(20, 184, 166, 0.15))');
    addBtn.addEventListener('click', () => {
      if (!node.options) node.options = [];
      node.options.push({ label: 'Nueva respuesta', nodeId: '' });
      const newOpt = createOptionElement(node.options[node.options.length - 1], node.options.length - 1, node, editorState, onUpdate, optionsList);
      optionsList.appendChild(newOpt);
      if (onUpdate) onUpdate();
    });
    nodeCard.appendChild(addBtn);
  }
  
  // Delete handler
  const deleteBtn = nodeCard.querySelector('.delete-node-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (Object.keys(editorState.diagram.nodes).length <= 1) {
        alert('⚠️ No puedes eliminar el único nodo del árbol');
        return;
      }
      delete editorState.diagram.nodes[node.id];
      nodeCard.remove();
      if (onUpdate) onUpdate();
    });
    
    // Add hover effect listeners
    deleteBtn.addEventListener('mouseenter', () => {
      deleteBtn.style.background = '#dc2626';
    });
    deleteBtn.addEventListener('mouseleave', () => {
      deleteBtn.style.background = '#ef4444';
    });
  }
  
  container.appendChild(nodeCard);
}

function createOptionElement(opt, idx, parentNode, editorState, onUpdate, optionsList) {
  const optDiv = document.createElement('div');
  optDiv.style.cssText = `
    display:flex;
    flex-direction:column;
    gap:12px;
    background:var(--cw-surface);
    padding:14px 16px;
    border:1.5px solid var(--cw-primary);
    border-radius:10px;
    transition:all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow:0 2px 6px rgba(255, 128, 51, 0.1)
  `;
  
  // Compact header con label y remove button
  const headerDiv = document.createElement('div');
  headerDiv.style.cssText = `
    display:flex;
    gap:10px;
    align-items:center;
    justify-content:space-between;
  `;
  
  const labelInput = document.createElement('input');
  labelInput.type = 'text';
  labelInput.value = opt.label;
  labelInput.placeholder = 'Ej: Sí, No...';
  labelInput.style.cssText = `
    flex:1;
    padding:10px 12px;
    border:1px solid var(--cw-border);
    border-radius:6px;
    background:var(--cw-surface-alt);
    color:var(--cw-text);
    font-family:var(--font-stack);
    font-size:13px;
    font-weight:600;
    transition:all 0.2s;
  `;
  labelInput.addEventListener('change', (e) => {
    opt.label = e.target.value;
    if (onUpdate) onUpdate();
  });
  labelInput.addEventListener('focus', () => {
    labelInput.style.borderColor = 'var(--cw-primary)';
    labelInput.style.background = 'var(--cw-surface)';
  });
  labelInput.addEventListener('blur', () => {
    labelInput.style.borderColor = 'var(--cw-border)';
    labelInput.style.background = 'var(--cw-surface-alt)';
  });
  
  const removeBtn = document.createElement('button');
  removeBtn.innerHTML = '✕';
  removeBtn.style.cssText = `
    background:#ef4444;
    color:white;
    border:none;
    border-radius:4px;
    padding:6px 8px;
    cursor:pointer;
    font-weight:700;
    transition:all 0.2s;
    flex-shrink:0;
    font-size:13px;
  `;
  removeBtn.addEventListener('mouseover', () => removeBtn.style.background = '#dc2626');
  removeBtn.addEventListener('mouseout', () => removeBtn.style.background = '#ef4444');
  removeBtn.addEventListener('click', () => {
    parentNode.options.splice(idx, 1);
    optDiv.remove();
    if (onUpdate) onUpdate();
  });
  
  headerDiv.appendChild(labelInput);
  headerDiv.appendChild(removeBtn);
  optDiv.appendChild(headerDiv);
  
  // Content container - compacto, solo preview si existe nodo
  const contentDiv = document.createElement('div');
  contentDiv.style.cssText = `
    display:flex;
    flex-direction:column;
    gap:10px;
    padding:12px;
    background:linear-gradient(135deg, rgba(255, 128, 51, 0.05), rgba(255, 160, 80, 0.05));
    border:1px solid rgba(255, 128, 51, 0.2);
    border-radius:8px;
  `;
  optDiv.appendChild(contentDiv);
  
  // Render node content compactly
  const renderNodeContent = () => {
    contentDiv.innerHTML = '';
    
    if (!opt.node) {
      // Sin nodo - mostrar botones para crear uno
      const buttonsWrapper = document.createElement('div');
      buttonsWrapper.style.cssText = `
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:8px;
      `;
      
      const btnQuestion = document.createElement('button');
      btnQuestion.innerHTML = '❓ Pregunta';
      btnQuestion.style.cssText = `
        padding:8px 10px;
        background:rgba(6, 182, 212, 0.1);
        border:1px solid var(--cw-secondary);
        color:var(--cw-secondary);
        border-radius:6px;
        cursor:pointer;
        font-weight:600;
        font-size:12px;
        font-family:var(--font-stack);
        transition:all 0.2s;
      `;
      btnQuestion.addEventListener('click', () => {
        opt.node = {
          id: 'node-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          type: 'question',
          content: 'Nueva pregunta',
          options: []
        };
        renderNodeContent();
        if (onUpdate) onUpdate();
      });
      btnQuestion.addEventListener('mouseover', () => {
        btnQuestion.style.background = 'rgba(6, 182, 212, 0.2)';
      });
      btnQuestion.addEventListener('mouseout', () => {
        btnQuestion.style.background = 'rgba(6, 182, 212, 0.1)';
      });
      buttonsWrapper.appendChild(btnQuestion);
      
      const btnSolution = document.createElement('button');
      btnSolution.innerHTML = '✓ Solución';
      btnSolution.style.cssText = `
        padding:8px 10px;
        background:rgba(16, 185, 129, 0.1);
        border:1px solid #10b981;
        color:#10b981;
        border-radius:6px;
        cursor:pointer;
        font-weight:600;
        font-size:12px;
        font-family:var(--font-stack);
        transition:all 0.2s;
      `;
      btnSolution.addEventListener('click', () => {
        opt.node = {
          id: 'node-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          type: 'solution',
          content: 'Nueva solución',
          options: []
        };
        renderNodeContent();
        if (onUpdate) onUpdate();
      });
      btnSolution.addEventListener('mouseover', () => {
        btnSolution.style.background = 'rgba(16, 185, 129, 0.2)';
      });
      btnSolution.addEventListener('mouseout', () => {
        btnSolution.style.background = 'rgba(16, 185, 129, 0.1)';
      });
      buttonsWrapper.appendChild(btnSolution);
      
      contentDiv.appendChild(buttonsWrapper);
    } else {
      // Con nodo - mostrar preview compacto y botón editar
      const node = opt.node;
      
      // Preview card
      const preview = document.createElement('div');
      preview.style.cssText = `
        padding:10px 12px;
        background:${node.type === 'question' ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(20, 184, 166, 0.1))' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1)'};
        border:1px solid ${node.type === 'question' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(16, 185, 129, 0.3)'};
        border-radius:6px;
        cursor:pointer;
        transition:all 0.2s;
      `;
      
      const previewText = document.createElement('div');
      previewText.style.cssText = `
        display:flex;
        align-items:center;
        gap:8px;
        font-size:12px;
        color:var(--cw-text);
        font-weight:500;
      `;
      previewText.innerHTML = `
        <span>${node.type === 'question' ? '❓' : '✓'}</span>
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${node.content.substring(0, 40)}${node.content.length > 40 ? '...' : ''}</span>
      `;
      
      preview.appendChild(previewText);
      
      preview.addEventListener('click', () => openNodeEditor(node));
      preview.addEventListener('mouseover', () => {
        preview.style.background = node.type === 'question' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(16, 185, 129, 0.15)';
      });
      preview.addEventListener('mouseout', () => {
        preview.style.background = node.type === 'question' ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(20, 184, 166, 0.1))' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))';
      });
      
      contentDiv.appendChild(preview);
      
      // Action buttons
      const actionBtns = document.createElement('div');
      actionBtns.style.cssText = `
        display:flex;
        gap:6px;
      `;
      
      const editBtn = document.createElement('button');
      editBtn.innerHTML = '✎ Editar';
      editBtn.style.cssText = `
        flex:1;
        padding:6px 8px;
        background:var(--cw-primary);
        color:white;
        border:none;
        border-radius:4px;
        cursor:pointer;
        font-weight:600;
        font-size:11px;
        font-family:var(--font-stack);
        transition:all 0.2s;
      `;
      editBtn.addEventListener('click', () => openNodeEditor(node, editorState, onUpdate));
      editBtn.addEventListener('mouseover', () => editBtn.style.opacity = '0.85');
      editBtn.addEventListener('mouseout', () => editBtn.style.opacity = '1');
      actionBtns.appendChild(editBtn);
      
      const deleteNodeBtn = document.createElement('button');
      deleteNodeBtn.innerHTML = '🗑️';
      deleteNodeBtn.style.cssText = `
        padding:6px 8px;
        background:#ef4444;
        color:white;
        border:none;
        border-radius:4px;
        cursor:pointer;
        font-size:11px;
        transition:all 0.2s;
      `;
      deleteNodeBtn.addEventListener('click', () => {
        opt.node = null;
        renderNodeContent();
        if (onUpdate) onUpdate();
      });
      deleteNodeBtn.addEventListener('mouseover', () => deleteNodeBtn.style.background = '#dc2626');
      deleteNodeBtn.addEventListener('mouseout', () => deleteNodeBtn.style.background = '#ef4444');
      actionBtns.appendChild(deleteNodeBtn);
      
      contentDiv.appendChild(actionBtns);
    }
  };
  
  // Function to open modal editor for node
  const openNodeEditor = (node, editorState, onUpdate) => {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position:fixed;
      top:0;left:0;right:0;bottom:0;
      background:rgba(0,0,0,0.5);
      display:flex;
      align-items:center;
      justify-content:center;
      z-index:10001;
      padding:20px;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background:var(--cw-surface);
      border-radius:12px;
      padding:24px;
      max-width:500px;
      width:100%;
      max-height:80vh;
      overflow-y:auto;
      box-shadow:0 20px 48px rgba(0,0,0,0.15);
    `;
    
    // Header
    const modalHeader = document.createElement('div');
    modalHeader.style.cssText = `
      display:flex;
      justify-content:space-between;
      align-items:center;
      margin-bottom:20px;
      padding-bottom:12px;
      border-bottom:2px solid var(--cw-border);
    `;
    
    const titleEl = document.createElement('div');
    titleEl.style.cssText = `
      display:flex;
      align-items:center;
      gap:8px;
      font-weight:700;
      font-size:16px;
      color:var(--cw-text);
    `;
    titleEl.innerHTML = `<span>${node.type === 'question' ? '❓' : '✓'}</span><span>${node.type === 'question' ? 'Editar Pregunta' : 'Editar Solución'}</span>`;
    modalHeader.appendChild(titleEl);
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      background:transparent;
      border:none;
      font-size:24px;
      cursor:pointer;
      color:var(--cw-text-muted);
      transition:all 0.2s;
    `;
    closeBtn.addEventListener('click', () => modal.remove());
    modalHeader.appendChild(closeBtn);
    
    modalContent.appendChild(modalHeader);
    
    // Content textarea
    const textarea = document.createElement('textarea');
    textarea.value = node.content;
    textarea.style.cssText = `
      width:100%;
      min-height:100px;
      padding:12px;
      border:1.5px solid var(--cw-border);
      border-radius:8px;
      background:var(--cw-surface-alt);
      color:var(--cw-text);
      font-family:var(--font-stack);
      font-size:13px;
      resize:vertical;
      margin-bottom:16px;
      box-sizing:border-box;
    `;
    textarea.addEventListener('change', (e) => {
      node.content = e.target.value;
      if (onUpdate) onUpdate();
    });
    modalContent.appendChild(textarea);
    
    // Sección de imagen del nodo
    const imageLabel = document.createElement('div');
    imageLabel.style.cssText = 'font-weight:700;font-size:13px;color:var(--cw-text);margin-top:12px;margin-bottom:8px';
    imageLabel.textContent = '🖼️ Imagen (opcional):';
    modalContent.appendChild(imageLabel);
    
    const imageContainer = document.createElement('div');
    imageContainer.style.cssText = 'display:flex;flex-direction:column;gap:12px;align-items:flex-start;position:relative;margin-bottom:16px';
    
    const imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.accept = 'image/*';
    imageInput.style.cssText = 'width:100%;padding:10px 12px;border:2px solid var(--cw-border);border-radius:8px;background:var(--cw-surface);color:var(--cw-text);font-family:var(--font-stack);font-size:13px;cursor:pointer';
    
    const imagePreview = document.createElement('div');
    imagePreview.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;width:140px;position:relative';
    
    const img = document.createElement('img');
    img.style.cssText = 'max-width:140px;max-height:120px;border-radius:8px;border:1px solid var(--cw-border);object-fit:cover;display:none';
    
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.textContent = '✕ Quitar';
    clearBtn.style.cssText = 'background:#ef4444;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:700;font-size:11px;padding:5px 8px;display:none;transition:all 0.2s;width:100%;white-space:nowrap';
    clearBtn.addEventListener('mouseover', () => clearBtn.style.background = '#dc2626');
    clearBtn.addEventListener('mouseout', () => clearBtn.style.background = '#ef4444');
    
    if (node.image) {
      img.src = node.image;
      img.style.display = 'block';
      clearBtn.style.display = 'block';
    }
    
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        node.image = reader.result;
        img.src = node.image;
        img.style.display = 'block';
        clearBtn.style.display = 'block';
        if (onUpdate) onUpdate();
      };
      reader.readAsDataURL(file);
    });
    
    clearBtn.addEventListener('click', () => {
      node.image = null;
      img.style.display = 'none';
      clearBtn.style.display = 'none';
      imageInput.value = '';
      if (onUpdate) onUpdate();
    });
    
    imagePreview.appendChild(img);
    imagePreview.appendChild(clearBtn);
    imageContainer.appendChild(imageInput);
    imageContainer.appendChild(imagePreview);
    modalContent.appendChild(imageContainer);
    
    // Respuestas (solo para preguntas)
    if (node.type === 'question') {
      const respuestasLabel = document.createElement('div');
      respuestasLabel.style.cssText = `
        font-weight:700;
        font-size:13px;
        color:var(--cw-text);
        margin-bottom:12px;
        display:flex;
        align-items:center;
        gap:6px;
      `;
      respuestasLabel.innerHTML = '↓ Respuestas de esta pregunta';
      modalContent.appendChild(respuestasLabel);
      
      const respuestasList = document.createElement('div');
      respuestasList.style.cssText = `
        display:flex;
        flex-direction:column;
        gap:10px;
        margin-bottom:16px;
      `;
      
      if (node.options && node.options.length > 0) {
        node.options.forEach((o, i) => {
          const optEl = createOptionElement(o, i, node, editorState, onUpdate, respuestasList);
          respuestasList.appendChild(optEl);
        });
      }
      
      modalContent.appendChild(respuestasList);
      
      const addRespuestaBtn = document.createElement('button');
      addRespuestaBtn.style.cssText = `
        width:100%;
        padding:10px;
        background:rgba(6, 182, 212, 0.1);
        border:1.5px dashed var(--cw-secondary);
        color:var(--cw-secondary);
        border-radius:8px;
        cursor:pointer;
        font-weight:600;
        font-size:12px;
        font-family:var(--font-stack);
        margin-bottom:16px;
        transition:all 0.2s;
      `;
      addRespuestaBtn.innerHTML = '+ Agregar respuesta';
      addRespuestaBtn.addEventListener('click', () => {
        if (!node.options) node.options = [];
        node.options.push({ label: 'Nueva respuesta', node: null });
        const newOptEl = createOptionElement(node.options[node.options.length - 1], node.options.length - 1, node, editorState, onUpdate, respuestasList);
        respuestasList.appendChild(newOptEl);
        if (onUpdate) onUpdate();
      });
      addRespuestaBtn.addEventListener('mouseover', () => {
        addRespuestaBtn.style.background = 'rgba(6, 182, 212, 0.2)';
      });
      addRespuestaBtn.addEventListener('mouseout', () => {
        addRespuestaBtn.style.background = 'rgba(6, 182, 212, 0.1)';
      });
      modalContent.appendChild(addRespuestaBtn);
    }
    
    // Footer buttons
    const footerBtns = document.createElement('div');
    footerBtns.style.cssText = `
      display:flex;
      gap:8px;
      padding-top:12px;
      border-top:1px solid var(--cw-border);
    `;
    
    const closeModalBtn = document.createElement('button');
    closeModalBtn.innerHTML = 'Cerrar';
    closeModalBtn.style.cssText = `
      flex:1;
      padding:10px;
      background:var(--cw-surface-alt);
      border:1px solid var(--cw-border);
      color:var(--cw-text);
      border-radius:6px;
      cursor:pointer;
      font-weight:600;
      font-size:12px;
      font-family:var(--font-stack);
      transition:all 0.2s;
    `;
    closeModalBtn.addEventListener('click', () => {
      modal.remove();
      renderNodeContent();
      if (onUpdate) onUpdate();  // Actualizar preview del editor principal
    });
    footerBtns.appendChild(closeModalBtn);
    
    modalContent.appendChild(footerBtns);
    
    modal.appendChild(modalContent);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
    
    document.body.appendChild(modal);
    
    // Add Escape listener to close this modal only (not parent modal)
    // We use window event listener with focus trick
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        // Check if this is the topmost modal
        const allModals = document.querySelectorAll('[data-modal-editor="option"]');
        if (allModals.length > 0) {
          const topmost = allModals[allModals.length - 1];
          if (topmost === modal) {
            e.stopPropagation();
            e.preventDefault();
            modal.remove();
            renderNodeContent();
            if (onUpdate) onUpdate();
          }
        }
      }
    };
    // Mark this as an option editor modal with a higher z-index
    modal.setAttribute('data-modal-editor', 'option');
    window.addEventListener('keydown', handleEscape, true);
    
    // Cleanup listener when modal is removed
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (!document.body.contains(modal)) {
          window.removeEventListener('keydown', handleEscape, true);
          observer.disconnect();
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };
  
  renderNodeContent();
  return optDiv;
}

function renderPreview(diagram, container) {
  container.innerHTML = '';
  const visited = new Set();
  let nodeCount = 0;
  
  const header = document.createElement('div');
  header.style.cssText = 'background:linear-gradient(135deg, rgba(255, 128, 51, 0.1), rgba(255, 160, 80, 0.1));border-left:4px solid var(--cw-primary);padding:16px;border-radius:8px;margin-bottom:24px';
  header.innerHTML = `<div style="font-weight:700;color:var(--cw-text);margin-bottom:6px">🎯 Estructura del árbol</div><div style="font-size:13px;color:var(--cw-text-muted)">Vista general de todas las preguntas y soluciones</div>`;
  container.appendChild(header);
  
  function renderNode(nodeId, depth = 0) {
    if (visited.has(nodeId) || depth > 10) return;
    visited.add(nodeId);
    nodeCount++;
    
    const node = diagram.nodes[nodeId];
    if (!node) return;
    
    const nodeEl = document.createElement('div');
    const isQuestion = node.type === 'question';
    const isRoot = nodeId === diagram.rootNodeId;
    
    nodeEl.style.cssText = `
      background:${isQuestion ? 'linear-gradient(135deg, var(--cw-primary) 0%, var(--cw-secondary) 100%)' : 'linear-gradient(135deg, var(--cw-success), #059669 100%)'};
      color:white;
      padding:20px 24px;
      border-radius:12px;
      margin:12px 0;
      margin-left:${depth * 24}px;
      box-shadow:0 4px 12px ${isQuestion ? 'rgba(6, 182, 212, 0.3)' : 'rgba(16, 185, 129, 0.3)'};
      border:1px solid ${isQuestion ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.08)'};
      position:relative;
      overflow:hidden;
    `;
    
    if (isRoot) {
      nodeEl.style.borderLeft = '4px solid rgba(255,255,255,0.5)';
      nodeEl.style.paddingLeft = '20px';
    }
    
    nodeEl.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:12px;font-weight:700;margin-bottom:${node.options ? '16px' : '0'};font-size:15px">
        <span style="font-size:20px;flex-shrink:0">${isQuestion ? '❓' : '✅'}</span>
        <span>${escapeHtml(node.content)}</span>
      </div>
      ${node.options && node.options.length > 0 ? `
        <div style="font-size:13px;opacity:0.95;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.2)">
          ${node.options.map(opt => `<div style="margin:6px 0;display:flex;align-items:center;gap:8px"><span>→</span><span>${escapeHtml(opt.label)}</span></div>`).join('')}
        </div>
      ` : ''}
    `;
    
    container.appendChild(nodeEl);
    
    if (node.options) {
      node.options.forEach(opt => {
        renderNode(opt.nodeId, depth + 1);
      });
    }
  }
  
  renderNode(diagram.rootNodeId);
}

async function saveDiagramChanges(diagram, modal) {
  console.log('🟠 [SAVE] saveDiagramChanges() LLAMADA');
  console.log('🟠 [SAVE] Diagrama ID:', diagram?.id);
  console.log('🟠 [SAVE] Diagrama Title:', diagram?.title);
  console.log('🟠 [SAVE] Diagrama rootNode:', diagram?.rootNode);
  try {
    // Validate diagram before saving
    if (!diagram || !diagram.id) {
      throw new Error('Diagrama inválido');
    }
    
    if (!diagram.title || diagram.title.trim().length === 0) {
      throw new Error('El nombre del árbol no puede estar vacío');
    }
    
    if (!diagram.rootNode) {
      throw new Error('El árbol debe tener un nodo raíz');
    }
    
    // Validate root node
    if (!diagram.rootNode.content || diagram.rootNode.content.trim().length === 0) {
      throw new Error('El nodo raíz no puede estar vacío');
    }
    
    // Recursive validation function for nodes
    const validateNode = (node, path = 'Raíz') => {
      if (!node.content || node.content.trim().length === 0) {
        throw new Error(`${path}: el contenido no puede estar vacío`);
      }
      
      // Validate options for questions
      if (node.type === 'question' && node.options) {
        for (let i = 0; i < node.options.length; i++) {
          const opt = node.options[i];
          if (!opt.label || opt.label.trim().length === 0) {
            throw new Error(`${path}: Opción ${i + 1} sin texto`);
          }
          if (opt.node) {
            validateNode(opt.node, `${path} → ${opt.label}`);
          }
        }
      }
    };
    
    validateNode(diagram.rootNode);
    
    // Save to backend (PRIMARY STORAGE)
    console.log('🟠 [SAVE] Diagrama a guardar COMPLETO:', JSON.stringify(diagram));
    
    let response = await fetch(apiUrl(`/diagrams/${diagram.id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(diagram)
    });
    
    // If 404, try POST (create)
    if (response.status === 404) {
      console.log('Diagrama no existe en backend, creando...');
      response = await fetch(apiUrl('/diagrams'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(diagram)
      });
      if (!response.ok) {
        throw new Error(`Error al crear: ${response.status}`);
      }
      console.log('✓ Diagrama creado en backend');
    } else if (!response.ok) {
      throw new Error(`Error al guardar: ${response.status}`);
    } else {
      console.log('✓ Diagrama guardado en backend');
    }
    
    // Update STATE with latest from backend
    const updated = await response.json();
    const diagrams = STATE.fibraDiagrams || [];
    const idx = diagrams.findIndex(d => d.id === updated.id);
    if (idx >= 0) {
      diagrams[idx] = updated;
    } else {
      diagrams.push(updated);
    }
    STATE.fibraDiagrams = diagrams;
    
    // Close modal and reload
    console.log('🟠 [SAVE] Modal:', modal);
    if (modal) {
      console.log('🟠 [SAVE] REMOVIENDO MODAL');
      modal.remove();
      console.log('🟠 [SAVE] MODAL REMOVIDO DEL DOM');
    }
    console.log('🟠 [SAVE] Renderizando lista desde STATE.fibraDiagrams (sin cargar backend)');
    // NO llamar a loadDiagrams() porque el backend tiene estructura diferente
    // Solo renderizar lo que ya está en STATE.fibraDiagrams (que acabamos de guardar en localStorage)
    renderDiagramsList(STATE.fibraDiagrams || []);
    
    // FASE 6: Notificar actualización de diagrama
    notifyDiagramUpdated(updated);
    
    console.log('✓ Árbol guardado correctamente');
    
  } catch (err) {
    console.error('Error de validación:', err);
    alert('⚠️ ' + err.message);
  }
}


async function deleteDiagram(diagramId) {
  try {
    console.log('[deleteDiagram] Iniciando eliminación de diagrama:', { diagramId, user: STATE.authUser?.name });
    
    // Verificar permisos
    if (!canEditDiagrams()) {
      await showAlert('❌ Acceso Denegado', 'No tienes permisos para eliminar árboles de decisión.');
      console.warn('[deleteDiagram] Acceso denegado:', { user: STATE.authUser?.name, diagramId });
      return;
    }
    
    // Obtener título del diagrama antes de borrarlo (para notificación)
    const diagramToDelete = (STATE.fibraDiagrams || []).find(d => d.id === diagramId);
    const diagramTitle = diagramToDelete ? diagramToDelete.title : diagramId;
    
    // Confirmar eliminación
    const confirmed = await showConfirm(
      '⚠️ Confirmar Eliminación de Árbol',
      `¿Estás seguro de que deseas eliminar el árbol de decisiones "${diagramTitle}"? Esta acción no se puede deshacer.`
    );
    
    if (!confirmed) {
      console.log('[deleteDiagram] Eliminación cancelada por el usuario');
      return;
    }
    
    console.log('[deleteDiagram] Eliminando diagrama del backend:', { id: diagramId, title: diagramTitle });
    
    // Eliminar del backend
    const deleteResponse = await fetch(apiUrl(`/diagrams/${diagramId}`), {
      method: 'DELETE'
    });
    
    if (!deleteResponse.ok) {
      throw new Error('Error al eliminar el diagrama del servidor');
    }
    
    // Actualizar estado
    STATE.fibraDiagrams = (STATE.fibraDiagrams || []).filter(d => d.id !== diagramId);
    localStorage.setItem('cw:fibraDiagrams', JSON.stringify(STATE.fibraDiagrams));
    
    console.log('[deleteDiagram] ✓ Diagrama eliminado exitosamente:', { id: diagramId, title: diagramTitle });
    
    // Actualizar UI
    renderDiagramsList(STATE.fibraDiagrams);
    
    // Notificar eliminación
    pushNotification({
      title: '✅ Árbol Eliminado',
      text: `"${diagramTitle}" ha sido eliminado`
    });
    
  } catch (err) {
    console.error('[deleteDiagram] Error al eliminar:', err);
    await showAlert('❌ Error', 'No se pudo eliminar el árbol: ' + err.message);
  }
}

// ==================== FASE 1: MEJORAS DE UX/UI ====================


// 1. INDICADORES DE CARGA (Spinners)
function showLoadingSpinner(message = 'Cargando...') {
  const spinner = document.getElementById('loadingSpinner');
  if (!spinner) return;
  
  const textEl = document.getElementById('loadingText');
  if (textEl) textEl.textContent = message;
  
  spinner.classList.remove('hidden');
  spinner.setAttribute('aria-busy', 'true');
}

function hideLoadingSpinner() {
  const spinner = document.getElementById('loadingSpinner');
  if (!spinner) return;
  
  spinner.classList.add('hidden');
  spinner.setAttribute('aria-busy', 'false');
}

// 2. TABS EN VISTA DE MANUAL
function setupManualTabs() {
  try {
    const tabButtons = document.querySelectorAll('.manual-tab-btn');
    const tabPanes = document.querySelectorAll('.manual-tab-pane');
    
    if (tabButtons.length === 0 || tabPanes.length === 0) {
      console.debug('[setupManualTabs] No tabs encontrados, saltando...');
      return;
    }
    
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tabName = btn.dataset.tab;
        
        // Remover clase active de todos
        tabButtons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        tabPanes.forEach(p => p.classList.remove('active'));
        
        // Agregar clase active al seleccionado
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const pane = document.getElementById(`${tabName}-pane`);
        if (pane) pane.classList.add('active');
        
        // Guardar tab activo en STATE
        if (!STATE.uiState) STATE.uiState = {};
        STATE.uiState.activeManualTab = tabName;
        localStorage.setItem('cw:uiState', JSON.stringify(STATE.uiState));
      });
    });
    
    // Restaurar tab que estaba activo
    if (!STATE.uiState) STATE.uiState = JSON.parse(localStorage.getItem('cw:uiState') || '{}');
    const lastTab = STATE.uiState.activeManualTab || 'steps';
    const tabBtn = document.querySelector(`[data-tab="${lastTab}"]`);
    if (tabBtn) tabBtn.click();
  } catch (err) {
    console.error('[setupManualTabs] Error:', err);
  }
}

// 3. CARDS INTERACTIVAS MEJORADAS
function enhanceManualCards() {
  try {
    const cards = document.querySelectorAll('#manualsList .manual-card');
    if (cards.length === 0) return;
    
    cards.forEach(card => {
      const manual = card.dataset.id ? STATE.manuals.find(m => m.id === card.dataset.id) : null;
      if (!manual) return;
      
      // Agregar badge de "Nuevo"
      if (isNewManual(manual)) {
        const badge = document.createElement('span');
        badge.className = 'card-badge badge-new';
        badge.textContent = '✨ Nuevo';
        card.appendChild(badge);
      }
      
      // Agregar badge de "Actualizado"
      if (isUpdatedManual(manual)) {
        const badge = document.createElement('span');
        badge.className = 'card-badge badge-updated';
        badge.textContent = '🔄 Actualizado';
        card.appendChild(badge);
      }
    });
  } catch (err) {
    console.error('[enhanceManualCards] Error:', err);
  }
}

function isNewManual(manual) {
  if (!manual.created_at) return false;
  const createdDate = new Date(manual.created_at);
  const daysAgo = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
  return daysAgo < 7; // Menos de 7 días
}

function isUpdatedManual(manual) {
  if (!manual.updated_at || !manual.created_at) return false;
  const updatedDate = new Date(manual.updated_at);
  const createdDate = new Date(manual.created_at);
  const daysAgoUpdated = (new Date() - updatedDate) / (1000 * 60 * 60 * 24);
  const isSameDay = updatedDate.toDateString() === createdDate.toDateString();
  return daysAgoUpdated < 7 && !isSameDay; // Actualizado en últimos 7 días y después de creación
}

// Expose functions for debugging
window.CW_UI = {
  showLoadingSpinner,
  hideLoadingSpinner,
  setupManualTabs,
  enhanceManualCards,
  setButtonLoading
};

// ==================== FASE 3: ANIMACIONES Y TRANSICIONES ====================

// FASE 3.12: Indicador de carga en botones
function setButtonLoading(btn, isLoading) {
  if (!btn) return;
  
  if (isLoading) {
    btn.classList.add('btn-loading');
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
  } else {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
    btn.setAttribute('aria-busy', 'false');
  }
}

// FASE 3.10: Aplicar transición fadeInOut a paneles
function transitionPanel(element) {
  if (!element) return;
  element.classList.remove('panel-content');
  // Trigger reflow
  void element.offsetWidth;
  element.classList.add('panel-content');
}

// FASE 3.11: Agregar animación stagger a tarjetas
function applyCardStaggerAnimation(container) {
  if (!container) return;
  const cards = container.querySelectorAll('.manual-card');
  cards.forEach(card => {
    card.classList.add('card-stagger');
  });
}

// ==================== FASE 2: ACCESIBILIDAD ====================

// Atajos de teclado accesibles
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Alt/Option + / : Abrir búsqueda
    if ((e.altKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      const search = document.getElementById('search');
      if (search) {
        search.focus();
        if (search.select) search.select();
      }
      return;
    }
    
    // Esc : Cerrar modal/volver a manuales
    if (e.key === 'Escape') {
      const manualView = document.getElementById('manualView');
      if (manualView && !manualView.classList.contains('hidden')) {
        const backBtn = document.getElementById('backToManualsBtn');
        if (backBtn) backBtn.click();
      }
      return;
    }
    
    // Alt + ArrowLeft : Historial (atrás)
    if (e.altKey && e.key === 'ArrowLeft') {
      e.preventDefault();
      const historyNav = document.querySelector('[data-nav="history"]');
      if (historyNav) historyNav.click();
      return;
    }
    
    // Alt + M : Manuales
    if ((e.altKey || e.metaKey) && e.key === 'm') {
      e.preventDefault();
      const manualsNav = document.querySelector('[data-nav="manuals"]');
      if (manualsNav) manualsNav.click();
      return;
    }
  });
}

// Mejorar aria-labels en elementos dinámicos
function improveAccessibility() {
  // Agregar aria-label a botones sin texto
  const iconButtons = document.querySelectorAll('.icon-btn:not([aria-label])');
  iconButtons.forEach(btn => {
    const title = btn.getAttribute('title');
    if (title) {
      btn.setAttribute('aria-label', title);
    }
  });
  
  // Agregar role=listitem a tarjetas de manual
  const manualCards = document.querySelectorAll('.manual-card');
  manualCards.forEach(card => {
    if (!card.getAttribute('role')) {
      card.setAttribute('role', 'article');
      card.setAttribute('tabindex', '0');
    }
    
    // Permitir Enter/Space para abrir manual (accesibilidad)
    if (!card._a11yHandled) {
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
      card._a11yHandled = true;
    }
  });
  
  // Mejorar aria-labels en inputs
  const inputs = document.querySelectorAll('input:not([aria-label])');
  inputs.forEach(input => {
    const placeholder = input.getAttribute('placeholder');
    const id = input.getAttribute('id');
    const label = document.querySelector(`label[for="${id}"]`);
    
    if (!input.getAttribute('aria-label')) {
      if (label) {
        input.setAttribute('aria-label', label.textContent);
      } else if (placeholder) {
        input.setAttribute('aria-label', placeholder);
      }
    }
  });
  
  // Mejorar aria-labels en tabs
  const tabButtons = document.querySelectorAll('.manual-tab-btn');
  tabButtons.forEach(btn => {
    const tab = btn.getAttribute('data-tab');
    if (tab) {
      btn.setAttribute('aria-controls', `${tab}-pane`);
    }
  });
  
  // Actualizar aria-current en navegación
  const navButtons = document.querySelectorAll('[data-nav]');
  navButtons.forEach(btn => {
    const nav = btn.getAttribute('data-nav');
    // Remover aria-current de todos
    btn.removeAttribute('aria-current');
  });
  
  // Marcar el activo
  const activeNav = document.querySelector('[data-nav].active');
  if (activeNav) {
    activeNav.setAttribute('aria-current', 'page');
  }
}

// Expose small helpers for debugging if needed
window.auth = {login, logout, removeUser};

// init on DOM ready
window.addEventListener('DOMContentLoaded', ()=>{ 
  init().then(async ()=>{
    // Ensure all panels are hidden initially
    document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
    
    // Always start on dashboard (clear hash on page load)
    // Users will navigate to manuals via buttons/nav, not hash
    console.debug('[DOMContentLoaded] Iniciando en dashboard, limpiando hash');
    window.history.replaceState(null, '', window.location.pathname);
    
    const welcome = document.getElementById('welcome');
    if(welcome) {
      welcome.classList.remove('hidden');
      console.debug('[DOMContentLoaded] ✓ Dashboard visible');
    }
    
    // Hide toolbar (if present)
    document.getElementById('adminToolbar')?.classList.add('hidden');
    
    // final defensive reset: ensure we're at top after all init work
    try{ window.scrollTo(0,0); document.documentElement.scrollTop = 0; document.body.scrollTop = 0; }catch(e){}
    // focus search input without scrolling
    try{ if(els.searchInput) els.searchInput.focus({preventScroll:true}); }catch(e){ if(els.searchInput) els.searchInput.focus(); }
    // keyboard shortcut: '/' focuses main search (unless in an input)
    try{
      window.addEventListener('keydown', (ev)=>{
        if(ev.key === '/' && !ev.metaKey && !ev.ctrlKey && !ev.altKey){
          const active = document.activeElement;
          if(active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
          ev.preventDefault();
          const s = document.getElementById('search'); if(s){ try{ s.focus({preventScroll:true}); }catch(e){ s.focus(); } }
        }
      });
    }catch(e){/* ignore */}
    
    // FASE 5: Inicializar monitoreo de conexión
    setupConnectionMonitoring();
    
    // FASE 6: Cargar notificaciones guardadas
    loadNotificationsFromStorage();
    
    // FASE 6: Verificar edad de contraseña
    if (STATE.authUser) {
      checkPasswordAge();
    }
    
    // FASE 9: Inicializar tour
    setupTourData();
    setupTourListeners();
    
    // FASE 9: Mostrar tour si es primer uso
    if (STATE.firstTimeUser && STATE.authUser) {
      setTimeout(() => {
        startTour(false);
      }, 500);
    }
    
    // NUEVA: Iniciar polling para sincronizar manuales automáticamente
    startManualsSyncPolling();
  });
});
// ==================== FASE 3: ANIMACIONES Y TRANSICIONES ====================

// Monitorear cambios de conexión
function setupConnectionMonitoring() {
  window.addEventListener('online', () => {
    STATE.isOnline = true;
    console.log('[FASE5] ✓ Conexión restaurada');
    syncPendingChanges();
  });
  
  window.addEventListener('offline', () => {
    STATE.isOnline = false;
    console.log('[FASE5] ✗ Sin conexión');
  });
}

// Expose debug commands for console
window.CW_DEBUG = {
  getState: () => STATE,
  getOfflineList: () => getOfflineManualsList(),
  getPendingList: () => getPendingQueue(),
  testQueueComment: () => alert('Use devtools to queue a comment'),
  testSyncNow: syncPendingChanges,
  testClearOfflineData: () => { clearPendingQueue(); getOfflineManualsList().forEach(m => deleteOfflineManual(m.id)); }
};

// Actualizar indicador visual de conexión
// Descargar manual para lectura offline
function downloadManualOffline(manual) {
  if(!manual) return false;
  const success = downloadManualForOffline(manual);
  if(success) {
    STATE.offlineManuals = getOfflineManualsList();
    showNotification('✓ Manual descargado para offline');
    console.log('[FASE5] Manual descargado:', manual.title);
    return true;
  } else {
    showNotification('✗ Error al descargar manual');
    return false;
  }
}

// Acceder a manual offline
function openOfflineManual(manualId) {
  const offlineManual = getOfflineManual(manualId);
  if(!offlineManual) {
    showNotification('✗ Manual no disponible offline');
    return false;
  }
  
  // Mostrar manual desde datos offline
  STATE.current = offlineManual;
  renderManualOffline(offlineManual);
  
  console.log('[FASE5] Abriendo manual offline:', offlineManual.title);
  return true;
}

// Renderizar manual en modo offline (igual que online pero con indicador)
function renderManualOffline(manual) {
  if(!manual) return;
  
  // Reutilizar la función de renderizado normal
  openManual(manual.id);
  
  // Agregar indicador visual de modo offline
  const indicator = document.createElement('div');
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #fbbf24;
    color: #78350f;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  indicator.innerHTML = '📴 Modo Offline - Los cambios no se sincronizarán hasta conectarse';
  document.body.appendChild(indicator);
  
  setTimeout(() => indicator.remove(), 5000);
}

// Eliminar manual de offline
function removeOfflineManual(manualId) {
  const success = deleteOfflineManual(manualId);
  if(success) {
    STATE.offlineManuals = getOfflineManualsList();
    showNotification('✓ Manual eliminado de offline');
    console.log('[FASE5] Manual eliminado de offline:', manualId);
    return true;
  }
  return false;
}

// Obtener lista de manuales descargados
function getDownloadedManualsUI() {
  const list = getOfflineManualsList();
  if(!list || list.length === 0) {
    return '<p style="color: var(--cw-text-muted); text-align: center; padding: 20px;">No hay manuales descargados para offline</p>';
  }
  
  return list.map(m => `
    <div style="padding: 12px; background: var(--cw-surface); border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-left: 3px solid var(--cw-primary);">
      <div>
        <div style="font-weight: 600; color: var(--cw-text)">${m.title}</div>
        <div style="font-size: 12px; color: var(--cw-text-muted)">Descargado: ${new Date(m.downloadedAt).toLocaleDateString('es-ES')}</div>
      </div>
      <button class="small-btn remove-offline-btn" data-manual-id="${m.id}" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Eliminar</button>
    </div>
  `).join('');
}

// Cola de cambios pendientes
function queueChange(action, data) {
  if(!STATE.isOnline) {
    const queued = addToPendingQueue({
      type: action,
      data,
      timestamp: new Date().toISOString()
    });
    
    if(queued) {
      STATE.pendingQueue = getPendingQueue();
      console.log('[FASE5] Cambio en cola:', action, data);
    }
  }
}

// Sincronizar cambios pendientes
async function syncPendingChanges() {
  const queue = getPendingQueue();
  if(queue.length === 0) {
    console.log('[FASE5] No hay cambios pendientes para sincronizar');
    return;
  }
  
  console.log(`[FASE5] Sincronizando ${queue.length} cambios pendientes...`);
  showNotification(`Sincronizando ${queue.length} cambio(s)...`);
  
  let synced = 0;
  for(const change of queue) {
    try {
      switch(change.type) {
        case 'comment':
          await api.addComment(change.data.manualId, change.data.comment);
          synced++;
          break;
        case 'progress':
          await api.updateProgress(change.data.manualId, change.data.progress);
          synced++;
          break;
        case 'manual_update':
          await api.updateManual(change.data.id, change.data);
          synced++;
          break;
        default:
          console.warn('[FASE5] Tipo de cambio desconocido:', change.type);
      }
    } catch(e) {
      console.warn('[FASE5] Error sincronizando:', e);
    }
  }
  
  clearPendingQueue();
  STATE.pendingQueue = [];
  showNotification(`✓ ${synced}/${queue.length} cambios sincronizados`);
  console.log('[FASE5] Sincronización completada:', synced, 'cambios');
}

// Mostrar notificación temporal
function showNotification(message) {
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--cw-primary);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    animation: slideInUp 0.3s ease;
  `;
  notif.textContent = message;
  document.body.appendChild(notif);
  
  setTimeout(() => {
    notif.style.animation = 'slideOutDown 0.3s ease';
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

// expose small helpers for debugging if needed
window.CW = {STATE};

// ==================== FASE 6: SISTEMA DE NOTIFICACIONES ====================

// Estado de notificaciones
STATE.notifications = [];
STATE.unreadNotifications = 0;

// Guardar notificaciones en localStorage
function saveNotificationsToStorage() {
  try {
    localStorage.setItem('cw:notifications', JSON.stringify(STATE.notifications));
    localStorage.setItem('cw:unreadNotifications', String(STATE.unreadNotifications));
  } catch (e) {
    console.warn('[FASE6] Error guardando notificaciones:', e);
  }
}

// Cargar notificaciones desde localStorage
function loadNotificationsFromStorage() {
  try {
    const stored = localStorage.getItem('cw:notifications');
    const unread = localStorage.getItem('cw:unreadNotifications');
    
    if (stored) {
      STATE.notifications = JSON.parse(stored);
    }
    if (unread) {
      STATE.unreadNotifications = parseInt(unread) || 0;
    }
    
    updateNotificationBadge();
  } catch (e) {
    console.warn('[FASE6] Error cargando notificaciones:', e);
    STATE.notifications = [];
    STATE.unreadNotifications = 0;
  }
}

// Verificar si las notificaciones están habilitadas
function areNotificationsEnabled() {
  const checkbox = document.getElementById('notifEnabled');
  if (!checkbox) return true; // Por defecto habilitadas si no existe checkbox
  return checkbox.checked;
}

// FASE 6: Función genérica para agregar notificaciones
function pushNotificationToPanel(options) {
  if (!areNotificationsEnabled()) return; // No notificar si está deshabilitado
  
  const {
    type = 'info',
    title,
    message,
    icon = 'ℹ️',
    toastDuration = 5000,
    action = null,
    relatedData = {} // Para guardar manual, diagram, comment, etc
  } = options;
  
  const notification = {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: type,
    title: title,
    message: message,
    icon: icon,
    timestamp: new Date().toISOString(),
    read: false,
    ...relatedData
  };
  
  STATE.notifications.unshift(notification);
  STATE.unreadNotifications++;
  updateNotificationBadge();
  saveNotificationsToStorage();
  
  showToastNotification({
    icon: icon,
    title: title,
    message: message,
    action: action,
    duration: toastDuration
  });
  
  console.log(`[FASE6] Notificación añadida: ${type}`, notification.id);
}

// FASE 6.21: Notificación de Manual Actualizado
function notifyManualUpdated(manual) {
  if (!areNotificationsEnabled()) return; // No notificar si está deshabilitado
  const notification = {
    id: `manual-update-${manual.id}-${Date.now()}`,
    type: 'manual_updated',
    title: `Manual Actualizado: ${manual.title}`,
    message: 'El manual ha sido actualizado. ¿Deseas recargar?',
    manual: manual,
    timestamp: new Date().toISOString(),
    read: false
  };
  
  STATE.notifications.unshift(notification);
  STATE.unreadNotifications++;
  updateNotificationBadge();
  saveNotificationsToStorage();
  
  showToastNotification({
    icon: '📝',
    title: 'Manual Actualizado',
    message: manual.title,
    action: {
      label: 'Recargar',
      callback: () => openManual(manual.id)
    },
    duration: 5000
  });
  
  console.log('[FASE6] Notificación: Manual actualizado', manual.id);
}

// FASE 6.22: Notificación de Nuevo Manual
function notifyNewManual(manual) {
  if (!areNotificationsEnabled()) return; // No notificar si está deshabilitado
  // Verificar si el rol del usuario puede verlo
  const userRole = STATE.authUser?.role || 'agent';
  const manualRoles = manual.role ? [manual.role] : ['General'];
  
  if (!manualRoles.includes(userRole) && userRole !== 'admin') {
    return; // No notificar si el rol no tiene acceso
  }
  
  const notification = {
    id: `manual-new-${manual.id}-${Date.now()}`,
    type: 'new_manual',
    title: `Nuevo Manual: ${manual.title}`,
    message: `${manual.category || 'Sin categoría'} - ${manual.summary || ''}`,
    manual: manual,
    timestamp: new Date().toISOString(),
    read: false
  };
  
  STATE.notifications.unshift(notification);
  STATE.unreadNotifications++;
  updateNotificationBadge();
  saveNotificationsToStorage();
  
  // Agregar badge al botón de Manuales
  const manualsBtn = document.querySelector('[data-nav="manuals"]');
  if (manualsBtn && !manualsBtn.querySelector('.notification-badge')) {
    const badge = document.createElement('span');
    badge.className = 'notification-badge';
    badge.textContent = '●';
    badge.style.cssText = `
      position: absolute;
      top: -2px;
      right: -2px;
      width: 8px;
      height: 8px;
      background: var(--cw-danger);
      border-radius: 50%;
      font-size: 16px;
    `;
    manualsBtn.style.position = 'relative';
    manualsBtn.appendChild(badge);
  }
  
  showToastNotification({
    icon: '✨',
    title: 'Nuevo Manual',
    message: manual.title,
    action: {
      label: 'Ver',
      callback: () => openManual(manual.id)
    },
    duration: 6000
  });
  
  console.log('[FASE6] Notificación: Nuevo manual', manual.id);
}

// FASE 6.23: Notificación de Cambios en Árbol (Decision Tree)
function notifyDiagramUpdated(diagram) {
  if (!areNotificationsEnabled()) return; // No notificar si está deshabilitado
  const notification = {
    id: `diagram-update-${diagram.id}-${Date.now()}`,
    type: 'diagram_updated',
    title: `Árbol Actualizado: ${diagram.title}`,
    message: 'El árbol de decisión ha sido actualizado.',
    diagram: diagram,
    timestamp: new Date().toISOString(),
    read: false
  };
  
  STATE.notifications.unshift(notification);
  STATE.unreadNotifications++;
  updateNotificationBadge();
  saveNotificationsToStorage();
  
  showToastNotification({
    icon: '🌳',
    title: 'Árbol Actualizado',
    message: diagram.title,
    action: {
      label: 'Ver',
      callback: () => openDiagramViewer(diagram)
    },
    duration: 5000
  });
  
  console.log('[FASE6] Notificación: Árbol actualizado', diagram.id);
}

// FASE 6.24: Alertas de Cambios de Contraseña
function notifyPasswordChanged() {
  if (!areNotificationsEnabled()) return; // No notificar si está deshabilitado
  const notification = {
    id: `password-change-${Date.now()}`,
    type: 'password_changed',
    title: 'Contraseña Cambiada',
    message: `Tu contraseña fue cambiada el ${new Date().toLocaleString('es-ES')}`,
    timestamp: new Date().toISOString(),
    read: false
  };
  
  STATE.notifications.unshift(notification);
  STATE.unreadNotifications++;
  updateNotificationBadge();
  saveNotificationsToStorage();
  
  showToastNotification({
    icon: '🔒',
    title: 'Contraseña Cambiada',
    message: 'Tu contraseña ha sido actualizada correctamente',
    type: 'success',
    duration: 4000
  });
  
  console.log('[FASE6] Notificación: Contraseña cambiada');
}

// Sugerir cambio de contraseña si es muy antigua
function checkPasswordAge() {
  const lastPasswordChange = localStorage.getItem('cw:lastPasswordChange');
  if (!lastPasswordChange) return;
  
  const lastChange = new Date(lastPasswordChange);
  const daysSinceChange = (new Date() - lastChange) / (1000 * 60 * 60 * 24);
  
  if (daysSinceChange > 90) { // 3 meses
    showToastNotification({
      icon: '⚠️',
      title: 'Cambio de Contraseña Recomendado',
      message: `Tu contraseña tiene ${Math.floor(daysSinceChange)} días sin cambiar`,
      type: 'warning',
      action: {
        label: 'Cambiar',
        callback: () => {
          const nav = document.querySelector('[data-nav="settings"]');
          if (nav) nav.click();
        }
      },
      duration: 8000
    });
  }
}

// Toast notification mejorado
function showToastNotification(options = {}) {
  const {
    icon = '📢',
    title = 'Notificación',
    message = '',
    type = 'info', // 'info', 'success', 'warning', 'error'
    action = null,
    duration = 4000
  } = options;
  
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  
  const typeColors = {
    info: 'var(--cw-accent)',
    success: 'var(--cw-success)',
    warning: 'var(--cw-warning)',
    error: 'var(--cw-danger)'
  };
  
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: white;
    border-left: 4px solid ${typeColors[type]};
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    z-index: 10001;
    max-width: 400px;
    animation: slideInUp 0.3s ease;
    display: flex;
    gap: 16px;
    align-items: flex-start;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = 'flex: 1; min-width: 0;';
  
  const header = document.createElement('div');
  header.style.cssText = 'display: flex; gap: 8px; align-items: center; margin-bottom: 4px;';
  
  const iconEl = document.createElement('span');
  iconEl.style.cssText = 'font-size: 20px; flex-shrink: 0;';
  iconEl.textContent = icon;
  
  const titleEl = document.createElement('strong');
  titleEl.style.cssText = 'color: var(--cw-text); font-weight: 600;';
  titleEl.textContent = title;
  
  header.appendChild(iconEl);
  header.appendChild(titleEl);
  
  const messageEl = document.createElement('p');
  messageEl.style.cssText = `
    margin: 0;
    color: var(--cw-text-muted);
    font-size: 14px;
    line-height: 1.4;
  `;
  messageEl.textContent = message;
  
  content.appendChild(header);
  content.appendChild(messageEl);
  
  // Botón de acción opcional
  if (action) {
    const actionBtn = document.createElement('button');
    actionBtn.style.cssText = `
      background: ${typeColors[type]};
      color: white;
      border: none;
      padding: 8px 14px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
      white-space: nowrap;
      flex-shrink: 0;
    `;
    actionBtn.textContent = action.label;
    actionBtn.classList.add('toast-action-btn');
    actionBtn.addEventListener('mouseenter', () => actionBtn.style.opacity = '0.8');
    actionBtn.addEventListener('mouseleave', () => actionBtn.style.opacity = '1');
    actionBtn.addEventListener('click', (e) => {
      e.preventDefault();
      action.callback();
      removeToast();
    });
    content.appendChild(actionBtn);
  }
  
  // Botón de cerrar
  const closeBtn = document.createElement('button');
  closeBtn.style.cssText = `
    background: transparent;
    border: none;
    color: var(--cw-text-muted);
    cursor: pointer;
    font-size: 20px;
    padding: 0;
    flex-shrink: 0;
  `;
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', removeToast);
  
  toast.appendChild(content);
  toast.appendChild(closeBtn);
  document.body.appendChild(toast);
  
  function removeToast() {
    toast.style.animation = 'slideOutDown 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }
  
  if (duration > 0) {
    setTimeout(removeToast, duration);
  }
}

// Actualizar badge de notificaciones
function updateNotificationBadge() {
  const badge = document.getElementById('notifCount');
  if (badge) {
    if (STATE.unreadNotifications > 0) {
      badge.textContent = STATE.unreadNotifications > 9 ? '9+' : STATE.unreadNotifications;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
}

// Marcar notificación individual como leída
function markNotificationAsRead(index) {
  if (index >= 0 && index < STATE.notifications.length) {
    if (!STATE.notifications[index].read) {
      STATE.notifications[index].read = true;
      STATE.unreadNotifications = Math.max(0, STATE.unreadNotifications - 1);
      updateNotificationBadge();
      saveNotificationsToStorage();
    }
  }
}

// ==================== FASE 8: EXPORT Y COMPARTICIÓN ====================

// FASE 8.28: Exportar Manual a PDF mejorado
function exportManualToPDF(manual) {
  if (!manual) return;
  
  // Verificar que jsPDF esté disponible
  if (typeof jsPDF === 'undefined') {
    console.error('❌ jsPDF is not defined. Available window properties:');
    console.error('- window.jsPDF:', typeof window.jsPDF);
    console.error('- window.jspdf:', typeof window.jspdf);
    
    showToastNotification({
      icon: '❌',
      title: 'Error',
      message: 'La librería jsPDF no se cargó correctamente. Recarga la página.',
      type: 'error',
      duration: 5000
    });
    return;
  }
  
  try {
    const doc = new jsPDF();
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    
    // Header con logo
    doc.setFillColor(255, 107, 53);
    doc.rect(0, 0, width, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('Cableworld', 14, 25);
    
    // Metadata
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, width - 60, 15);
    doc.text(`Manual ID: ${manual.id}`, width - 60, 22);
    
    // Título del manual
  yPosition += 30;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(escapeHtml(manual.title), 14, yPosition);
  
  // Metadata del manual
  yPosition += 15;
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Categoría: ${escapeHtml(manual.category || 'Sin categoría')}`, 14, yPosition);
  yPosition += 7;
  doc.text(`Versión: ${escapeHtml(manual.version || '1.0.0')}`, 14, yPosition);
  yPosition += 7;
  doc.text(`Resumen: ${escapeHtml(manual.summary || 'Sin resumen')}`, 14, yPosition, {maxWidth: width - 28});
  yPosition += 10;
  
  // Índice
  yPosition += 5;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Índice de contenidos', 14, yPosition);
  yPosition += 8;
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(60, 120, 200);
  const steps = manual.steps || [];
  steps.forEach((step, idx) => {
    const stepTitle = step.title || `Paso ${idx + 1}`;
    doc.text(`${idx + 1}. ${escapeHtml(stepTitle.substring(0, 50))}`, 20, yPosition);
    yPosition += 6;
    if (yPosition > height - 20) {
      doc.addPage();
      yPosition = 20;
    }
  });
  
  // Contenido de pasos
  yPosition += 5;
  doc.addPage();
  yPosition = 20;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Contenido detallado', 14, yPosition);
  yPosition += 12;
  
  steps.forEach((step, idx) => {
    // Verificar espacio disponible
    if (yPosition > height - 40) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Número y título del paso
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(40, 100, 200);
    doc.text(`Paso ${idx + 1}: ${escapeHtml(step.title || 'Sin título')}`, 14, yPosition);
    yPosition += 8;
    
    // Contenido del paso (limpiado de HTML)
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    
    const content = step.content || step.text || '';
    const cleanContent = content.replace(/<[^>]*>/g, ''); // Remover HTML tags
    const splitContent = doc.splitTextToSize(cleanContent, width - 28);
    splitContent.forEach(line => {
      if (yPosition > height - 20) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 14, yPosition);
      yPosition += 5;
    });
    yPosition += 5;
  });
  
  // Footer en todas las páginas
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${pageCount}`, width / 2, height - 10, {align: 'center'});
  }
  
  // Descargar
  doc.save(`${escapeHtml(manual.title)}.pdf`);
  
  // Toast de confirmación
  showToastNotification({
    icon: '📄',
    title: 'PDF Descargado',
    message: `${manual.title} se ha exportado correctamente`,
    type: 'success',
    duration: 3000
  });
  } catch (err) {
    console.error('Error generating PDF:', err);
    showToastNotification({
      icon: '❌',
      title: 'Error',
      message: 'Error al generar el PDF: ' + err.message,
      type: 'error',
      duration: 3000
    });
  }
}

// FASE 8.31: Generar link shareable
function generateShareLink(manual, stepIndex = 0) {
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
  const params = new URLSearchParams({
    manual: manual.id,
    title: manual.title,
    step: stepIndex,
    timestamp: Date.now()
  });
  
  const shareUrl = `${baseUrl}?${params.toString()}`;
  return shareUrl;
}

// FASE 8.31: Copiar link al portapapeles
function copyShareLink(manual) {
  const shareUrl = generateShareLink(manual);
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToastNotification({
        icon: '✅',
        title: 'Link Copiado',
        message: 'Enlace compartible copiado al portapapeles',
        type: 'success',
        duration: 3000
      });
    }).catch(() => {
      fallbackCopyToClipboard(shareUrl);
    });
  } else {
    fallbackCopyToClipboard(shareUrl);
  }
}

// Fallback para copiar al portapapeles
function fallbackCopyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  
  try {
    document.execCommand('copy');
    showToastNotification({
      icon: '✅',
      title: 'Link Copiado',
      message: 'Enlace compartible copiado',
      type: 'success',
      duration: 3000
    });
  } catch (err) {
    showToastNotification({
      icon: '❌',
      title: 'Error',
      message: 'No se pudo copiar el link',
      type: 'error',
      duration: 3000
    });
  }
  
  document.body.removeChild(textarea);
}

// FASE 8.30: Enviar manual por email
function showEmailModal(manual) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.zIndex = '1001';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:400px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <h3 style="margin:0;font-size:18px">📧 Enviar por Email</h3>
        <button class="close" aria-label="Cerrar" style="position:absolute;top:12px;right:12px;background:transparent;border:none;font-size:20px;cursor:pointer">✕</button>
      </div>
      <form id="emailForm" style="display:flex;flex-direction:column;gap:12px">
        <div>
          <label style="display:block;margin-bottom:6px;font-weight:600;font-size:13px;color:var(--cw-text-muted)">Correo del destinatario</label>
          <input type="email" id="emailTo" class="input-field" required placeholder="usuario@ejemplo.com" style="width:100%;padding:10px"/>
        </div>
        <div>
          <label style="display:block;margin-bottom:6px;font-weight:600;font-size:13px;color:var(--cw-text-muted)">Mensaje (opcional)</label>
          <textarea id="emailMessage" class="input-field" placeholder="Añade un mensaje..." style="width:100%;min-height:80px;padding:10px;resize:vertical"></textarea>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;padding-top:12px;border-top:1px solid var(--cw-border)">
          <button type="button" class="secondary" id="emailCancel">Cancelar</button>
          <button type="submit" class="primary" id="emailSend">Enviar</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const form = modal.querySelector('#emailForm');
  const closeBtn = modal.querySelector('.close');
  const cancelBtn = modal.querySelector('#emailCancel');
  const sendBtn = modal.querySelector('#emailSend');
  
  const removeModal = () => modal.remove();
  
  closeBtn.addEventListener('click', removeModal);
  cancelBtn.addEventListener('click', removeModal);
  
  // Prevent Escape from closing the manual when inside this modal
  // Use capture phase (true) so this executes BEFORE document listener
  modal.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      ev.preventDefault();
      ev.stopPropagation();
      removeModal();
    }
  }, true);
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = modal.querySelector('#emailTo').value;
    const message = modal.querySelector('#emailMessage').value;
    
    if (!email) return;
    
    setButtonLoading(sendBtn, true);
    
    try {
      const response = await fetch(apiUrl('/send-manual-email'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${STATE.authToken || ''}`
        },
        body: JSON.stringify({
          manualId: manual.id,
          manualTitle: manual.title,
          recipientEmail: email,
          message: message,
          senderName: STATE.authUser?.name || 'Agente Cableworld'
        })
      });
      
      if (response.ok) {
        showToastNotification({
          icon: '✅',
          title: 'Email Enviado',
          message: `Manual enviado a ${email}`,
          type: 'success',
          duration: 3000
        });
        removeModal();
      } else {
        throw new Error('Error al enviar');
      }
    } catch (err) {
      showToastNotification({
        icon: '❌',
        title: 'Error',
        message: 'No se pudo enviar el email',
        type: 'error',
        duration: 3000
      });
    } finally {
      setButtonLoading(sendBtn, false);
    }
  });
}

// Marcar todas las notificaciones como leídas
function markNotificationsAsRead() {
  STATE.notifications.forEach(notif => {
    notif.read = true;
  });
  STATE.unreadNotifications = 0;
  updateNotificationBadge();
  saveNotificationsToStorage();
}

// Limpiar versiones antiguas de cache al cargar
if('caches' in window) {
  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
      caches.delete(cacheName);
    });
  });
}

// ==================== FASE 9: GUIDED TOUR ====================

// Estructura del tour - VERSIÓN MEJORADA AL 200%
function setupTourData() {
  STATE.tourData = [
    {
      target: '.welcome-header',
      title: '👋 ¡Bienvenido!',
      description: 'Sistema para resolver problemas técnicos. 12 funciones principales. Presiona Siguiente.',
      position: 'bottom',
      closeModals: false,
      openAction: () => {
        // Mostrar welcome panel y ocultar otros
        document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
        const welcome = document.getElementById('welcome');
        if (welcome) welcome.classList.remove('hidden');
      }
    },
    {
      target: '.search-wrap input',
      title: '🔍 Búsqueda',
      description: 'Busca cualquier manual, solución, código. Ctrl+K para búsqueda rápida desde cualquier pantalla.',
      position: 'bottom-left',
      closeModals: false,
      openAction: null
    },
    {
      target: '[data-nav="manuals"]',
      title: '📚 Manuales',
      description: 'Toda documentación técnica: procedimientos, soluciones, imágenes, diagramas. Organizado por categorías.',
      position: 'bottom',
      closeModals: true,
      openAction: () => {
        closeTourMenus();
        setTimeout(() => document.querySelector('[data-nav="manuals"]')?.click(), 200);
      }
    },
    {
      target: '#manualsList',
      title: '📖 Lista de Manuales',
      description: 'Selecciona cualquier manual para ver su contenido completo.',
      position: 'top',
      closeModals: false,
      openAction: () => {
        setTimeout(() => {
          const manualsList = document.querySelector('#manualsList');
          if (manualsList) {
            manualsList.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    },
    {
      target: '[data-nav="fibra"]',
      title: '🌳 Árboles de Decisión',
      description: 'Herramienta interactiva para resolver problemas. Selecciona síntomas y obtén soluciones.',
      position: 'bottom',
      closeModals: true,
      openAction: () => {
        closeTourMenus();
        setTimeout(() => document.querySelector('[data-nav="fibra"]')?.click(), 200);
      }
    },
    {
      target: '.canvas',
      title: '🎯 Diagrama Interactivo',
      description: 'Haz clic en los cuadros para navegar. Arrastra para ver más. Cada decisión te acerca a la solución.',
      position: 'top',
      closeModals: false,
      openAction: () => {
        scrollToElement(document.querySelector('#diagramsList'), 250);
      }
    },
    {
      target: '#notificationsBtn',
      title: '🔔 Notificaciones',
      description: 'Alertas en tiempo real sobre manuales, actualizaciones, cambios y eventos. Filtra por tipo y prioridad.',
      position: 'bottom',
      closeModals: true,
      openAction: () => {
        closeTourMenus();
        setTimeout(() => document.querySelector('#notificationsBtn')?.click(), 100);
      }
    },
    {
      target: '#notificationsPanel',
      title: '📬 Panel de Notificaciones',
      description: 'Visualiza, filtra, marca como leída y archiva. Las críticas se destacan en rojo.',
      position: 'top',
      closeModals: false,
      openAction: null
    },
    {
      target: '#toggleAgentMode',
      title: '🤖 Modo Agente',
      description: 'Cambia entre vista de usuario y modo agente con permisos avanzados.',
      position: 'bottom',
      closeModals: true,
      openAction: null
    },
    {
      target: '#helpBtn',
      title: '❓ Centro de Ayuda',
      description: 'FAQs, atajos de teclado, guías rápidas y tutoriales. Puedes reiniciar este tour aquí.',
      position: 'bottom-left',
      closeModals: true,
      openAction: () => {
        closeTourMenus();
        setTimeout(() => document.querySelector('#helpBtn')?.click(), 100);
      }
    },
    {
      target: '[data-nav="settings"]',
      title: '⚙️ Configuración',
      description: 'Personalización: temas, idioma, usuarios (si eres admin), auditoría y seguridad.',
      position: 'bottom',
      closeModals: true,
      openAction: () => {
        closeTourMenus();
        setTimeout(() => document.querySelector('[data-nav="settings"]')?.click(), 100);
      }
    },
    {
      target: '#logoutBtn',
      title: '👤 Perfil y Sesión',
      description: 'Tu información, contraseña, historial de login y cierre de sesión.',
      position: 'bottom',
      closeModals: true,
      openAction: null
    },
    {
      target: '.sidebar',
      title: '✨ ¡Tour Completado!',
      description: '¡Felicidades! Ya conoces Cableworld. Usa Ctrl+K para búsqueda rápida. ¡A trabajar!',
      position: 'center',
      closeModals: true,
      openAction: () => {
        closeTourMenus();
      }
    }
  ];
}

// Obtener el panel actualmente abierto
function getCurrentOpenPanel() {
  const openPanel = document.querySelector('.panel:not(.hidden)');
  return openPanel?.id || null;
}

// Scroll suave a un elemento
function scrollToElement(element, offset = 100) {
  if (!element) return;
  
  const elementTop = element.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({
    top: elementTop,
    behavior: 'smooth'
  });
}

// Función auxiliar para cerrar todos los menus/modales del tour
function closeTourMenus() {
  // Cerrar todos los modales
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.add('hidden');
  });
  
  // Ocultar todos los panels
  document.querySelectorAll('.panel').forEach(panel => {
    panel.classList.add('hidden');
  });
  
  // Mostrar main
  document.querySelector('.main')?.classList.remove('hidden');
}

// Iniciar tour - MEJORADO
// Mensajes motivacionales para el tour
const TOUR_MOTIVATIONAL_MESSAGES = [
  '💡 ¡Comencemos!',
  '🚀 Progreso increíble',
  '⚡ Casi a la mitad',
  '🎯 Vamos muy bien',
  '🌟 Casi experto',
  '🔥 ¡Falta poco!',
  '✨ Casi terminamos',
  '🎉 ¡Excelente trabajo!'
];

function startTour(fromSettings = false) {
  if (!STATE.tourData || STATE.tourData.length === 0) {
    setupTourData();
  }
  
  STATE.tourActive = true;
  STATE.currentTourStep = 0;
  
  // Cerrar todos menos welcome
  closeTourMenus();
  
  // Mostrar welcome si está reiniciando desde settings
  if (fromSettings) {
    const welcomePanel = document.getElementById('welcome');
    if (welcomePanel) {
      welcomePanel.classList.remove('hidden');
    }
  }
  
  showTourStep(0);
  
  if (fromSettings) {
    pushNotificationToPanel({
      type: 'info',
      title: '👋 Tour Reiniciado',
      message: 'Tour reiniciado. Haz clic en Siguiente para continuar',
      icon: '👋'
    });
  }
}

// Mostrar paso del tour - VERSIÓN MEJORADA
function showTourStep(stepIndex) {
  if (stepIndex < 0 || stepIndex >= STATE.tourData.length) {
    endTour();
    return;
  }
  
  STATE.currentTourStep = stepIndex;
  const step = STATE.tourData[stepIndex];
  
  // Cerrar menus/modales si es necesario
  if (step.closeModals) {
    closeTourMenus();
  }
  
  // Ejecutar acción personalizada si existe
  if (step.openAction) {
    try {
      step.openAction();
      setTimeout(() => continueTourDisplay(stepIndex, step), 120);
    } catch (e) {
      console.warn('Tour action error:', e);
      continueTourDisplay(stepIndex, step);
    }
  } else {
    continueTourDisplay(stepIndex, step);
  }
}

// Helper para mostrar el tour después de acciones
function continueTourDisplay(stepIndex, step) {
  // Esperar a que el DOM esté listo
  requestAnimationFrame(() => {
    let target = document.querySelector(step.target);
    
    // Si no encuentra el elemento, pasar al siguiente
    if (!target) {
      console.warn(`Tour target not found: ${step.target}, advancing...`);
      nextTourStep();
      return;
    }
    
    // Obtener elementos del tour
    const overlay = document.getElementById('tourOverlay');
    if (!overlay) return;
    
    const highlight = overlay.querySelector('.tour-highlight');
    const tooltip = overlay.querySelector('.tour-tooltip');
    
    if (!highlight || !tooltip) return;
    
    // Actualizar texto del tour
    document.getElementById('tourTitle').textContent = step.title;
    document.getElementById('tourDescription').textContent = step.description;
    
    // Actualizar contador con mensaje motivacional
    const stepNumber = stepIndex + 1;
    const totalSteps = STATE.tourData.length;
    const motivationalIndex = Math.floor((stepIndex / totalSteps) * TOUR_MOTIVATIONAL_MESSAGES.length);
    const motivationalMsg = TOUR_MOTIVATIONAL_MESSAGES[Math.min(motivationalIndex, TOUR_MOTIVATIONAL_MESSAGES.length - 1)];
    
    document.getElementById('tourStepNumber').textContent = stepNumber;
    document.getElementById('tourTotalSteps').textContent = totalSteps;
    
    // Agregar mensaje motivacional al contador
    const stepCounter = document.querySelector('.tour-step-counter');
    if (stepCounter) {
      stepCounter.title = motivationalMsg;
    }
    
    // Actualizar progreso y ARIA
    const progress = (stepNumber / totalSteps) * 100;
    const progressBar = document.getElementById('tourProgressBar');
    progressBar.style.width = progress + '%';
    
    // Actualizar atributos ARIA
    const progressContainer = document.querySelector('[role="progressbar"]');
    if (progressContainer) {
      progressContainer.setAttribute('aria-valuenow', stepNumber);
      progressContainer.setAttribute('aria-valuemax', totalSteps);
      progressContainer.setAttribute('aria-label', `Progreso del tour: paso ${stepNumber} de ${totalSteps}`);
    }
    
    // Actualizar atributo aria-hidden del overlay
    if (overlay && !overlay.classList.contains('hidden')) {
      overlay.setAttribute('aria-hidden', 'false');
    }
    
    // Actualizar botones
    document.getElementById('tourNextBtn').textContent = 
      stepIndex === STATE.tourData.length - 1 ? 'Finalizar ✓' : 'Siguiente →';
    
    // Ocultar botón Skip en el último paso
    const tourSkipBtn = document.getElementById('tourSkipBtn');
    if (tourSkipBtn) {
      if (stepIndex === STATE.tourData.length - 1) {
        tourSkipBtn.style.display = 'none';
      } else {
        tourSkipBtn.style.display = '';
      }
    }
    
    // Posicionar highlight y tooltip
    highlightElement(target, highlight, tooltip, step.position);
    
    // Mostrar overlay con pequeño delay
    overlay.classList.remove('hidden');
    
    // Trigger animación de entrada
    tooltip.style.animation = 'none';
    setTimeout(() => {
      tooltip.style.animation = 'tourSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }, 10);
  });
}

// Resaltar elemento - VERSIÓN MEJORADA
function highlightElement(element, highlight, tooltip, position = 'bottom') {
  const rect = element.getBoundingClientRect();
  const padding = 12;
  
  // Scroll suave si el elemento no está visible
  if (rect.top < 0 || rect.bottom > window.innerHeight) {
    scrollToElement(element, 150);
    setTimeout(() => highlightElement(element, highlight, tooltip, position), 600);
    return;
  }
  
  // Posicionar highlight
  highlight.style.left = (rect.left - padding) + 'px';
  highlight.style.top = (rect.top - padding) + 'px';
  highlight.style.width = (rect.width + padding * 2) + 'px';
  highlight.style.height = (rect.height + padding * 2) + 'px';
  
  // Calcular posición del tooltip - MEJORADO
  const tooltipWidth = 450;
  const tooltipHeight = 280;
  let tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
  let tooltipTop = rect.top - tooltipHeight - 30;
  
  // Márgenes de seguridad
  const margin = 20;
  
  // Ajustar horizontalmente
  if (tooltipLeft < margin) {
    tooltipLeft = margin;
  } else if (tooltipLeft + tooltipWidth > window.innerWidth - margin) {
    tooltipLeft = window.innerWidth - tooltipWidth - margin;
  }
  
  // Ajustar verticalmente con mejor lógica
  if (tooltipTop < margin) {
    // Si no cabe arriba, intentar debajo
    tooltipTop = rect.bottom + 30;
    
    // Si tampoco cabe debajo, centrar verticalmente
    if (tooltipTop + tooltipHeight > window.innerHeight - margin) {
      tooltipTop = window.innerHeight / 2 - tooltipHeight / 2;
    }
  }
  
  // Asegurar que no salga por abajo
  if (tooltipTop + tooltipHeight > window.innerHeight - margin) {
    tooltipTop = window.innerHeight - tooltipHeight - margin;
  }
  
  tooltip.style.left = tooltipLeft + 'px';
  tooltip.style.top = tooltipTop + 'px';
  
  // Actualizar gradiente del overlay
  const overlay = document.getElementById('tourOverlay');
  overlay.style.setProperty('--tour-x', (rect.left + rect.width / 2) + 'px');
  overlay.style.setProperty('--tour-y', (rect.top + rect.height / 2) + 'px');
}

// Siguiente paso - MEJORADO
function nextTourStep() {
  if (STATE.currentTourStep === STATE.tourData.length - 1) {
    endTour();
  } else {
    showTourStep(STATE.currentTourStep + 1);
  }
}

// Saltar tour - MEJORADO
function skipTour() {
  closeTourMenus();
  endTour();
  pushNotificationToPanel({
    type: 'info',
    title: '👋 Tour Omitido',
    message: 'Puedes reiniciar el tour en Configuración > Ayuda',
    icon: '👋'
  });
}

// Finalizar tour - MEJORADO CON DASHBOARD
function endTour() {
  STATE.tourActive = false;
  STATE.firstTimeUser = false;
  
  // Guardar AMBOS storages para asegurar persistencia
  localStorage.setItem('cw:firstTimeUser', JSON.stringify(false));
  STATE.saveToStorage();  // Guardar en 'cw:state' también
  
  const overlay = document.getElementById('tourOverlay');
  if (overlay) {
    // Pequeña animación de desvanecimiento elegante
    overlay.style.opacity = '1';
    overlay.style.transition = 'opacity 0.5s ease-out';
    overlay.style.opacity = '0';
    
    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.style.opacity = '1';
      overlay.style.transition = 'opacity 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }, 500);
  }
  
  // Crear confeti festivo (solo 15 partículas para no ser invasivo)
  createTourConfetti(15);
  
  // Cerrar todos los menus y abrir el dashboard
  closeTourMenus();
  
  // Asegurar que se abre el dashboard/welcome
  setTimeout(() => {
    // Ocultar todos los panels
    document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
    
    // Mostrar welcome panel (dashboard)
    const welcomePanel = document.getElementById('welcome');
    if (welcomePanel) {
      welcomePanel.classList.remove('hidden');
    }
    
    // Mostrar main
    document.querySelector('.main')?.classList.remove('hidden');
  }, 100);
  
  // Notificación festiva
  pushNotificationToPanel({
    type: 'success',
    title: '🎉 ¡Tour Completado Exitosamente!',
    message: '¡Felicidades! Ahora eres un experto en Cableworld. Puedes reiniciar el tour en Configuración → Ayuda cuando lo desees.',
    icon: '🎉'
  });
}

// Función para crear confeti cuando termina el tour
function createTourConfetti(count = 20) {
  const colors = ['#ff8033', '#ffb366', '#ff6b35', '#cc6600', '#e67e22'];
  
  for (let i = 0; i < count; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'tour-confetti';
    confetti.style.left = Math.random() * window.innerWidth + 'px';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = (Math.random() * 0.3) + 's';
    confetti.style.opacity = '0.7';
    
    document.body.appendChild(confetti);
    
    // Eliminar después de que termine la animación
    setTimeout(() => confetti.remove(), 3300);
  }
}

// Configurar event listeners del tour - MEJORADO
function setupTourListeners() {
  const tourNextBtn = document.getElementById('tourNextBtn');
  const tourSkipBtn = document.getElementById('tourSkipBtn');
  const tourOverlay = document.getElementById('tourOverlay');
  const tourHighlight = tourOverlay?.querySelector('.tour-highlight');
  
  if (tourNextBtn) {
    tourNextBtn.removeEventListener('click', nextTourStep);
    tourNextBtn.addEventListener('click', nextTourStep);
  }
  
  if (tourSkipBtn) {
    tourSkipBtn.removeEventListener('click', skipTour);
    tourSkipBtn.addEventListener('click', skipTour);
  }
  
  // Click en el highlight para avanzar
  if (tourHighlight) {
    tourHighlight.removeEventListener('click', nextTourStep);
    tourHighlight.addEventListener('click', nextTourStep);
  }
  
  // Navegación por teclado
  document.removeEventListener('keydown', handleTourKeyboard);
  document.addEventListener('keydown', handleTourKeyboard);
  
  // Focus en el botón next para mejor accesibilidad
  if (tourNextBtn && STATE.tourActive) {
    setTimeout(() => tourNextBtn.focus(), 100);
  }
}

// Manejador de teclado para el tour - NUEVO
function handleTourKeyboard(e) {
  if (!STATE.tourActive) return;
  
  const tourNextBtn = document.getElementById('tourNextBtn');
  const tourSkipBtn = document.getElementById('tourSkipBtn');
  
  switch(e.key) {
    case 'ArrowRight':
    case 'Enter':
      e.preventDefault();
      nextTourStep();
      break;
    case 'Escape':
      e.preventDefault();
      skipTour();
      break;
    case 'Tab':
      // Permitir navegación Tab normal
      return;
  }
}

// Paso anterior del tour - NUEVO
// previousTourStep() function removed - no backward navigation in tour

// ========== FASE 10: MEJORAS ÁRBOLES DE DECISIÓN ==========

// 35. FILTRADO Y CATEGORIZACIÓN GPON/AIRE
function getTreesByCategory(parentCategory, subcategory) {
  if (!STATE.fibraDiagrams) return [];
  
  return STATE.fibraDiagrams.filter(d => {
    const dParent = d.parentCategory || 'GPON';
    const dSub = d.subcategory || 'Internet';
    
    if (parentCategory && dParent !== parentCategory) return false;
    if (subcategory && dSub !== subcategory) return false;
    return true;
  });
}

function getCategoryStats() {
  const stats = {
    'GPON-Internet': 0,
    'GPON-Telefonía': 0,
    'Aire-Internet': 0,
    'Aire-Telefonía': 0
  };
  
  STATE.fibraDiagrams?.forEach(d => {
    const parent = d.parentCategory || 'GPON';
    const sub = d.subcategory || 'Internet';
    const key = `${parent}-${sub}`;
    if (stats.hasOwnProperty(key)) stats[key]++;
  });
  
  return stats;
}

// 36. EDITOR DE DIAGRAMAS MEJORADO
function createDiagramNode(parentNode, title, type = 'question', imageUrl = null) {
  return {
    id: 'node-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    type: type,
    content: title,
    imageUrl: imageUrl,          // URL externo
    imageBase64: null,           // Base64 codificado
    mediaData: null,             // Data URL
    options: [],
    image: null,                 // Legacy support
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function updateDiagramNode(diagramId, nodeId, updates) {
  const diagram = STATE.fibraDiagrams?.find(d => d.id === diagramId);
  if (!diagram) return false;
  
  const findNode = (node) => {
    if (node.id === nodeId) return node;
    if (node.options) {
      for (let opt of node.options) {
        const found = findNode(opt.node);
        if (found) return found;
      }
    }
    return null;
  };
  
  const node = findNode(diagram.rootNode);
  if (!node) return false;
  
  Object.assign(node, updates, { updatedAt: new Date().toISOString() });
  return true;
}









// 38. DUPLICAR/CLONAR ÁRBOLES
async function cloneDiagram(diagramId) {
  try {
    const original = STATE.fibraDiagrams?.find(d => d.id === diagramId);
    if (!original) throw new Error('Diagrama original no encontrado');
    
    if (!(STATE.authUser && STATE.authUser.role === 'admin')) {
      throw new Error('Solo administradores pueden clonar árboles');
    }
    
    const newName = await new Promise((resolve) => {
      const defaultName = `${original.title} (Copia)`;
      const userInput = prompt('Nombre para la copia:', defaultName);
      resolve(userInput);
    });
    
    if (!newName) return null;
    
    const cloned = {
      id: 'diagram-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      title: newName,
      parentCategory: original.parentCategory || 'GPON',
      subcategory: original.subcategory || 'Internet',
      rootNode: JSON.parse(JSON.stringify(original.rootNode)),
      clonedFrom: diagramId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Guardar en backend
    const response = await fetch(apiUrl('/diagrams'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cloned)
    });
    
    if (!response.ok) throw new Error('Error al guardar en backend');
    
    STATE.fibraDiagrams.push(cloned);
    localStorage.setItem('cw:fibraDiagrams', JSON.stringify(STATE.fibraDiagrams));
    
    renderDiagramsList(STATE.fibraDiagrams);
    
    pushNotification({
      title: '✅ Árbol Clonado',
      text: `"${original.title}" duplicado como "${newName}"`
    });
    
    return cloned;
  } catch (e) {
    console.error('[cloneDiagram]', e);
    await showAlert('Error al Clonar', e.message);
    return null;
  }
}

// 39. BÚSQUEDA DENTRO DE ÁRBOLES
function searchInDiagram(treeNode, query, results = []) {
  if (!query) return results;
  
  const lowerQuery = query.toLowerCase();
  
  // Buscar en contenido del nodo
  if (treeNode.content.toLowerCase().includes(lowerQuery)) {
    results.push({
      nodeId: treeNode.id,
      type: treeNode.type,
      content: treeNode.content,
      match: true
    });
  }
  
  // Buscar recursivamente en opciones
  if (treeNode.options && Array.isArray(treeNode.options)) {
    treeNode.options.forEach(opt => {
      if (opt.label?.toLowerCase().includes(lowerQuery)) {
        results.push({
          nodeId: treeNode.id,
          optionLabel: opt.label,
          type: 'option',
          match: true
        });
      }
      if (opt.node) {
        searchInDiagram(opt.node, query, results);
      }
    });
  }
  
  return results;
}

// 40. HISTORIAL DE CAMBIOS
async function getDiagramHistory(diagramId) {
  try {
    const response = await fetch(apiUrl(`/diagrams/${diagramId}/history`));
    if (!response.ok) return [];
    return await response.json();
  } catch (e) {
    console.error('[getDiagramHistory]', e);
    return [];
  }
}

async function recordDiagramChange(diagramId, changeType, details = {}) {
  try {
    await fetch(apiUrl(`/diagrams/${diagramId}/history`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        changeType,
        userId: STATE.authUser?.id,
        details,
        timestamp: new Date().toISOString()
      })
    });
  } catch (e) {
    console.error('[recordDiagramChange]', e);
  }
}

// 41. COMPARTICIÓN Y COLABORACIÓN
function generateDiagramShareLink(diagramId) {
  try {
    const diagram = STATE.fibraDiagrams?.find(d => d.id === diagramId);
    if (!diagram) throw new Error('Diagrama no encontrado');
    
    const shareKey = 'share-' + diagramId + '-' + Math.random().toString(36).substr(2, 8);
    const shareLink = `${window.location.origin}?shared=${shareKey}`;
    
    localStorage.setItem(`cw:share:${shareKey}`, JSON.stringify({
      diagramId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }));
    
    return shareLink;
  } catch (e) {
    console.error('[generateDiagramShareLink]', e);
    return null;
  }
}

function generateDiagramQR(diagramId) {
  try {
    const diagram = STATE.fibraDiagrams?.find(d => d.id === diagramId);
    if (!diagram) return null;
    
    const shareLink = generateDiagramShareLink(diagramId);
    if (!shareLink) return null;
    
    // Usar API de QR (puedes reemplazar con otra librería)
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareLink)}`;
  } catch (e) {
    console.error('[generateDiagramQR]', e);
    return null;
  }
}

// 42. MODO PRESENTACIÓN
async function startDiagramPresentation(diagramId) {
  try {
    const diagram = STATE.fibraDiagrams?.find(d => d.id === diagramId);
    if (!diagram) throw new Error('Diagrama no encontrado');
    
    const presentationModal = document.createElement('div');
    presentationModal.className = 'modal';
    presentationModal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#1a1a2e;display:flex;align-items:center;justify-content:center;z-index:15000;overflow:auto';
    
    presentationModal.innerHTML = `
      <div style="max-width:90%;max-height:90vh;background:#fff;border-radius:20px;padding:40px;display:flex;flex-direction:column;gap:24px;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid var(--cw-border);padding-bottom:20px">
          <h2 style="margin:0;color:var(--cw-text);font-size:28px">${escapeHtml(diagram.title)}</h2>
          <button class="modal-close-btn" style="background:none;border:none;font-size:28px;cursor:pointer;color:var(--cw-text-muted)">✕</button>
        </div>
        
        <div id="presentationContent" style="flex:1;display:flex;flex-direction:column;gap:20px;min-height:300px"></div>
        
        <div style="display:flex;gap:16px;justify-content:space-between;align-items:center;border-top:2px solid var(--cw-border);padding-top:20px">
          <div style="color:var(--cw-text-muted);font-weight:600">
            <span id="presentationProgress">Nivel 1/5</span>
          </div>
          <div style="display:flex;gap:12px">
            <button id="presentationBackBtn" style="padding:12px 20px;background:var(--cw-bg);border:2px solid var(--cw-border);border-radius:10px;cursor:pointer;font-weight:600;color:var(--cw-text)">← Atrás</button>
            <button id="presentationExitBtn" style="padding:12px 20px;background:#ef4444;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:600">✕ Salir (Esc)</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(presentationModal);
    
    STATE.presentationMode = {
      active: true,
      diagramId,
      currentNodeId: diagram.rootNode.id,
      nodePath: [diagram.rootNode.id],
      modal: presentationModal
    };
    
    renderPresentationNode(diagram.rootNode);
    
    // Event listeners para botones de presentación
    const backBtn = presentationModal.querySelector('#presentationBackBtn');
    const exitBtn = presentationModal.querySelector('#presentationExitBtn');
    
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (STATE.presentationMode.nodePath.length > 1) {
          STATE.presentationMode.nodePath.pop();
          const currentNode = findNodeInTree(diagram.rootNode, STATE.presentationMode.nodePath[STATE.presentationMode.nodePath.length - 1]);
          if (currentNode) {
            renderPresentationNode(currentNode);
          }
        }
      });
    }
    
    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        STATE.presentationMode.active = false;
        presentationModal.remove();
        document.removeEventListener('keydown', handlePresentationKeyboard);
      });
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', handlePresentationKeyboard);
    
    return presentationModal;
  } catch (e) {
    console.error('[startDiagramPresentation]', e);
    showAlert('Error', e.message);
    return null;
  }
}

function renderPresentationNode(node) {
  try {
    if (!STATE.presentationMode?.active) return;
    
    const content = document.getElementById('presentationContent');
    const backBtn = document.getElementById('presentationBackBtn');
    const modal = STATE.presentationMode.modal;
    
    if (!content) return;
    
    content.innerHTML = '';
    
    // Crear contenedor principal flexible
    const mainContainer = document.createElement('div');
    mainContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
    `
    
    // SECCIÓN DE MEDIA/IMAGEN (si existe)
    const hasImage = node.image || node.imageUrl || node.mediaData || node.imageBase64;
    if (hasImage) {
      const mediaWrapper = document.createElement('div');
      mediaWrapper.style.cssText = `
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 140px;
        border: 3px solid #ff8033;
        cursor: zoom-in;
        transition: all 0.3s ease;
      `
      
      // Contenedor para la imagen
      const mediaContainer = document.createElement('div');
      mediaContainer.style.cssText = `
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 12px;
        position: relative;
      `
      
      const img = document.createElement('img');
      img.style.cssText = `
        max-width: 100%;
        max-height: 140px;
        object-fit: contain;
        display: block;
        border-radius: 8px;
        transition: transform 0.3s ease;
      `
      
      let imageLoaded = false;
      let imageSrc = null;
      
      // Resolver la fuente de imagen (prioridad: node.image primero)
      if (node.image) {
        imageSrc = node.image;
      } else if (node.imageUrl) {
        imageSrc = node.imageUrl;
      } else if (node.imageBase64) {
        imageSrc = node.imageBase64;
      } else if (node.mediaData) {
        imageSrc = node.mediaData;
      }
      
      if (imageSrc) {
        img.src = imageSrc;
        
        // Evento cuando la imagen carga exitosamente
        img.onload = () => {
          imageLoaded = true;
          img.style.opacity = '1';
          img.style.filter = 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))';
          
          // Hover effect
          mediaWrapper.addEventListener('mouseover', () => {
            if (imageLoaded) {
              img.style.transform = 'scale(1.02)';
              mediaWrapper.style.boxShadow = '0 20px 50px rgba(0,0,0,0.25)';
            }
          });
          
          mediaWrapper.addEventListener('mouseout', () => {
            img.style.transform = 'scale(1)';
            mediaWrapper.style.boxShadow = '0 15px 40px rgba(0,0,0,0.2)';
          });
          
          // Click para abrir modal de zoom
          mediaWrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            openImageZoomModal(imageSrc);
          });
        };
        
        img.onerror = () => {
          imageLoaded = false;
          mediaContainer.innerHTML = `
            <div style="padding:40px;text-align:center;color:#f59e0b;font-size:14px;display:flex;flex-direction:column;align-items:center;gap:12px">
              <div style="font-size:48px">🖼️</div>
              <div style="font-weight:600">Imagen no disponible</div>
              <div style="font-size:12px;color:#999;max-width:300px">
                ${imageSrc.substring(0, 80)}...
              </div>
            </div>
          `;
        };
        
        img.style.opacity = '0.7';
        mediaContainer.appendChild(img);
      }
      
      // Badge de "Haz clic para ampliar"
      if (imageSrc) {
        const zoomBadge = document.createElement('div');
        zoomBadge.style.cssText = `
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(255, 128, 51, 0.95);
          color: white;
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          z-index: 10;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        zoomBadge.innerHTML = '🔍 Click para zoom';
        mediaWrapper.appendChild(zoomBadge);
      }
      
      mediaWrapper.appendChild(mediaContainer);
      mainContainer.appendChild(mediaWrapper);
    }
    
    // SECCIÓN DE CONTENIDO (Pregunta/Texto)
    const nodeBox = document.createElement('div');
    nodeBox.style.cssText = `
      padding: 20px;
      background: linear-gradient(135deg, #ff8033 0%, #ff6b1a 100%);
      color: white;
      border-radius: 12px;
      text-align: center;
      font-size: ${node.image || node.imageUrl || node.mediaData || node.imageBase64 ? '18px' : '22px'};
      font-weight: 800;
      min-height: ${node.image || node.imageUrl || node.mediaData || node.imageBase64 ? '70px' : '100px'};
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 20px rgba(255, 128, 51, 0.25);
      line-height: 1.3;
    `
    nodeBox.innerHTML = `${escapeHtml(node.content || '')}`;
    mainContainer.appendChild(nodeBox);
    
    // SECCIÓN DE OPCIONES (si es pregunta)
    if (node.options && node.options.length > 0) {
      const optionsLabel = document.createElement('div');
      optionsLabel.style.cssText = `
        margin: 6px 0 4px 0;
        font-size: 11px;
        font-weight: 600;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      `;
      optionsLabel.textContent = '📋 Respuestas:';
      mainContainer.appendChild(optionsLabel);
      
      const optionsGrid = document.createElement('div');
      optionsGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: 10px;
        margin-top: 4px;
      `;
      
      node.options.forEach((opt, idx) => {
        const optBtn = document.createElement('button');
        optBtn.style.cssText = `
          padding: 10px 8px;
          background: linear-gradient(135deg, #0084ff, #0066cc);
          color: white;
          border: 2px solid #0066cc;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 102, 204, 0.15);
          font-family: inherit;
          word-wrap: break-word;
          overflow-wrap: break-word;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          line-height: 1.1;
        `;
        optBtn.textContent = escapeHtml(opt.label || `Opción ${idx + 1}`);
        
        optBtn.addEventListener('mouseover', () => {
          optBtn.style.transform = 'translateY(-4px)';
          optBtn.style.boxShadow = '0 8px 24px rgba(0, 102, 204, 0.4)';
        });
        
        optBtn.addEventListener('mouseout', () => {
          optBtn.style.transform = 'translateY(0)';
          optBtn.style.boxShadow = '0 4px 12px rgba(0, 102, 204, 0.2)';
        });
        
        optBtn.addEventListener('click', () => {
          if (opt.node) {
            STATE.presentationMode.nodePath.push(opt.node.id);
            renderPresentationNode(opt.node);
            updatePresentationUI();
          }
        });
        optionsGrid.appendChild(optBtn);
      });
      
      mainContainer.appendChild(optionsGrid);
    } else {
      // Nodo terminal - Mejora visual
      const endBox = document.createElement('div');
      endBox.style.cssText = `
        margin-top: 4px;
        padding: 16px;
        background: linear-gradient(135deg, #dcfce7, #f0fdf4);
        border: 2px solid #10b981;
        border-radius: 8px;
        text-align: center;
        font-size: 13px;
        font-weight: 700;
        color: #10b981;
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
      `;
      endBox.innerHTML = '✓ Final del camino alcanzado';
      mainContainer.appendChild(endBox);
    }
    
    content.appendChild(mainContainer);
    updatePresentationUI();
  } catch (e) {
    console.error('[renderPresentationNode]', e);
  }
}

function updatePresentationUI() {
  const progress = document.getElementById('presentationProgress');
  const backBtn = document.getElementById('presentationBackBtn');
  
  if (progress) {
    const depth = STATE.presentationMode?.nodePath?.length || 1;
    progress.textContent = `Nivel ${depth}`;
  }
  
  if (backBtn) {
    backBtn.style.display = STATE.presentationMode?.nodePath?.length > 1 ? 'block' : 'none';
  }
}

function handlePresentationKeyboard(e) {
  if (!STATE.presentationMode?.active) return;
  
  if (e.key === 'Escape') {
    closePresentationMode();
  } else if (e.key === 'Backspace' || e.key === 'ArrowLeft') {
    presentationGoBack();
  }
}

function presentationGoBack() {
  if (!STATE.presentationMode?.active || STATE.presentationMode.nodePath.length <= 1) return;
  
  STATE.presentationMode.nodePath.pop();
  
  // Encuentra el nodo actual
  const diagram = STATE.fibraDiagrams?.find(d => d.id === STATE.presentationMode.diagramId);
  if (!diagram) return;
  
  let currentNode = diagram.rootNode;
  for (let i = 1; i < STATE.presentationMode.nodePath.length; i++) {
    const targetId = STATE.presentationMode.nodePath[i];
    const findNode = (node) => {
      if (node.id === targetId) return node;
      if (node.options) {
        for (let opt of node.options) {
          const found = findNode(opt.node);
          if (found) return found;
        }
      }
      return null;
    };
    currentNode = findNode(currentNode);
  }
  
  renderPresentationNode(currentNode);
}

// Modal profesional para zoom de imágenes
function openImageZoomModal(imageSrc) {
  // Crear modal de fondo oscuro
  const zoomModal = document.createElement('div');
  zoomModal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20000;
    padding: 20px;
    overflow: auto;
  `;
  
  // Contenedor de la imagen con zoom
  const imageContainer = document.createElement('div');
  imageContainer.style.cssText = `
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: 95vw;
    max-height: 95vh;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 20px;
    border: 3px solid #ff8033;
    padding: 20px;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
    overflow: auto;
  `;
  
  const img = document.createElement('img');
  img.src = imageSrc;
  img.style.cssText = `
    max-width: 90vw;
    max-height: 85vh;
    object-fit: contain;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    cursor: zoom-in;
    user-select: none;
  `;
  
  let currentZoom = 1;
  const minZoom = 0.5;
  const maxZoom = 5;
  
  // Funcionalidad de zoom con rueda
  img.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom * delta));
    
    if (newZoom !== currentZoom) {
      currentZoom = newZoom;
      img.style.transform = `scale(${currentZoom})`;
      img.style.cursor = currentZoom > 1 ? 'grab' : 'zoom-in';
    }
  });
  
  // Doble click para resetear zoom
  img.addEventListener('dblclick', () => {
    currentZoom = 1;
    img.style.transform = 'scale(1)';
    img.style.cursor = 'zoom-in';
  });
  
  // Teclado para zoom
  const handleKeyZoom = (e) => {
    if (!zoomModal.parentElement) return;
    
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      const newZoom = Math.min(maxZoom, currentZoom * 1.2);
      currentZoom = newZoom;
      img.style.transform = `scale(${currentZoom})`;
    } else if (e.key === '-') {
      e.preventDefault();
      const newZoom = Math.max(minZoom, currentZoom * 0.8);
      currentZoom = newZoom;
      img.style.transform = `scale(${currentZoom})`;
    } else if (e.key === '0') {
      e.preventDefault();
      currentZoom = 1;
      img.style.transform = 'scale(1)';
    } else if (e.key === 'Escape') {
      e.preventDefault();
      zoomModal.remove();
      document.removeEventListener('keydown', handleKeyZoom);
    }
  };
  
  document.addEventListener('keydown', handleKeyZoom);
  
  imageContainer.appendChild(img);
  
  // Botón de cerrar en esquina superior derecha
  const closeBtn = document.createElement('button');
  closeBtn.style.cssText = `
    position: absolute;
    top: 15px;
    right: 15px;
    background: rgba(255, 128, 51, 0.95);
    border: none;
    color: white;
    font-size: 32px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    font-weight: bold;
    z-index: 10;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `;
  closeBtn.innerHTML = '×';
  closeBtn.addEventListener('mouseover', () => {
    closeBtn.style.background = 'rgba(255, 128, 51, 1)';
    closeBtn.style.transform = 'scale(1.1)';
  });
  closeBtn.addEventListener('mouseout', () => {
    closeBtn.style.background = 'rgba(255, 128, 51, 0.95)';
    closeBtn.style.transform = 'scale(1)';
  });
  closeBtn.addEventListener('click', () => {
    zoomModal.remove();
    document.removeEventListener('keydown', handleKeyZoom);
  });
  
  imageContainer.appendChild(closeBtn);
  
  // Panel de controles inferior
  const controlsPanel = document.createElement('div');
  controlsPanel.style.cssText = `
    position: absolute;
    bottom: 15px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.85);
    border: 2px solid #ff8033;
    border-radius: 50px;
    padding: 12px 20px;
    display: flex;
    gap: 20px;
    align-items: center;
    z-index: 10;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  `;
  
  // Botón zoom in
  const zoomInBtn = document.createElement('button');
  zoomInBtn.innerHTML = '🔍 +';
  zoomInBtn.style.cssText = `
    background: #ff8033;
    color: white;
    border: none;
    padding: 8px 14px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 13px;
    transition: all 0.2s;
  `;
  zoomInBtn.addEventListener('click', () => {
    const newZoom = Math.min(maxZoom, currentZoom * 1.2);
    currentZoom = newZoom;
    img.style.transform = `scale(${currentZoom})`;
  });
  
  // Botón zoom out
  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.innerHTML = '🔍 -';
  zoomOutBtn.style.cssText = `
    background: #ff8033;
    color: white;
    border: none;
    padding: 8px 14px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 13px;
    transition: all 0.2s;
  `;
  zoomOutBtn.addEventListener('click', () => {
    const newZoom = Math.max(minZoom, currentZoom * 0.8);
    currentZoom = newZoom;
    img.style.transform = `scale(${currentZoom})`;
  });
  
  // Botón reset
  const resetBtn = document.createElement('button');
  resetBtn.innerHTML = '⟲ Reset';
  resetBtn.style.cssText = `
    background: #0066cc;
    color: white;
    border: none;
    padding: 8px 14px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 13px;
    transition: all 0.2s;
  `;
  resetBtn.addEventListener('click', () => {
    currentZoom = 1;
    img.style.transform = 'scale(1)';
  });
  
  // Indicador de zoom
  const zoomIndicator = document.createElement('div');
  zoomIndicator.style.cssText = `
    color: white;
    font-weight: 600;
    font-size: 13px;
    min-width: 60px;
    text-align: center;
  `;
  zoomIndicator.textContent = '100%';
  
  // Actualizar indicador cuando cambia el zoom
  const updateZoomIndicator = () => {
    zoomIndicator.textContent = Math.round(currentZoom * 100) + '%';
  };
  
  img.addEventListener('wheel', updateZoomIndicator);
  zoomInBtn.addEventListener('click', updateZoomIndicator);
  zoomOutBtn.addEventListener('click', updateZoomIndicator);
  resetBtn.addEventListener('click', updateZoomIndicator);
  
  controlsPanel.appendChild(zoomOutBtn);
  controlsPanel.appendChild(zoomIndicator);
  controlsPanel.appendChild(zoomInBtn);
  controlsPanel.appendChild(resetBtn);
  
  imageContainer.appendChild(controlsPanel);
  
  // Instrucciones de teclado
  const instructions = document.createElement('div');
  instructions.style.cssText = `
    position: absolute;
    top: 15px;
    left: 15px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 12px;
    background: rgba(0, 0, 0, 0.6);
    padding: 10px 15px;
    border-radius: 8px;
    border: 1px solid rgba(255, 128, 51, 0.5);
    line-height: 1.6;
    max-width: 220px;
  `;
  instructions.innerHTML = `
    <div style="font-weight:600;margin-bottom:6px">⌨️ Controles:</div>
    <div>🖱️ Rueda: Zoom</div>
    <div>+/- Teclas: Zoom</div>
    <div>0: Reset</div>
    <div>Doble click: Reset</div>
    <div>ESC: Cerrar</div>
  `;
  
  imageContainer.appendChild(instructions);
  
  // Cerrar con click en fondo oscuro
  zoomModal.addEventListener('click', (e) => {
    if (e.target === zoomModal) {
      zoomModal.remove();
      document.removeEventListener('keydown', handleKeyZoom);
    }
  });
  
  zoomModal.appendChild(imageContainer);
  document.body.appendChild(zoomModal);
}

function closePresentationMode() {
  if (STATE.presentationMode?.modal) {
    STATE.presentationMode.modal.remove();
  }
  STATE.presentationMode = null;
  document.removeEventListener('keydown', handlePresentationKeyboard);
}

function findNodeInTree(root, nodeId) {
  if (!root) return null;
  if (root.id === nodeId) return root;
  
  if (root.options && Array.isArray(root.options)) {
    for (let opt of root.options) {
      const found = findNodeInTree(opt.node, nodeId);
      if (found) return found;
    }
  }
  return null;
}

// ==================== FASE 11: ANALYTICS Y GRÁFICOS ====================

// Inicializar sistema de análisis
function initializeAnalytics() {
  // Crear estructura de analytics en STATE si no existe
  if (!STATE.analytics) {
    STATE.analytics = {
      searches: [],        // Array de {query, timestamp, count}
      views: [],          // Array de {manualId, timestamp}
      dailyActivity: {},  // {date: count}
      searchTerms: {}     // {term: count}
    };
  }
  
  // Cargar analytics del localStorage
  const savedAnalytics = localStorage.getItem('cw:analytics');
  if (savedAnalytics) {
    try {
      STATE.analytics = JSON.parse(savedAnalytics);
    } catch (e) {
      console.warn('Error cargando analytics:', e);
    }
  }
  
  // Garantizar que existen todas las propiedades necesarias
  if (!STATE.analytics.dailyActivity) STATE.analytics.dailyActivity = {};
  if (!STATE.analytics.searchTerms) STATE.analytics.searchTerms = {};
  if (!STATE.analytics.searches) STATE.analytics.searches = [];
  if (!STATE.analytics.views) STATE.analytics.views = [];
  
  // Renderizar los widgets y gráficos
  renderAnalyticsDashboard();
}

// Registrar una búsqueda
function recordSearchAnalytics(query) {
  if (!query || query.trim().length === 0) return;
  
  const term = query.toLowerCase().trim();
  const today = new Date().toISOString().split('T')[0];
  
  // Registrar en searchTerms
  if (!STATE.analytics.searchTerms[term]) {
    STATE.analytics.searchTerms[term] = 0;
  }
  STATE.analytics.searchTerms[term]++;
  
  // Registrar en actividad diaria
  if (!STATE.analytics.dailyActivity[today]) {
    STATE.analytics.dailyActivity[today] = 0;
  }
  STATE.analytics.dailyActivity[today]++;
  
  // Registrar búsqueda
  STATE.analytics.searches.push({
    query: term,
    timestamp: new Date().toISOString()
  });
  
  // Guardar
  saveAnalytics();
}

// Registrar vista de manual
function recordManualViewAnalytics(manualId) {
  if (!manualId) return;
  
  const today = new Date().toISOString().split('T')[0];
  
  // Registrar vista
  STATE.analytics.views.push({
    manualId,
    timestamp: new Date().toISOString()
  });
  
  // Registrar en actividad diaria
  if (!STATE.analytics.dailyActivity[today]) {
    STATE.analytics.dailyActivity[today] = 0;
  }
  STATE.analytics.dailyActivity[today]++;
  
  // Guardar
  saveAnalytics();
}

// Guardar analytics en localStorage
function saveAnalytics() {
  // Limitar historial a 100 últimos eventos
  if (STATE.analytics.searches.length > 100) {
    STATE.analytics.searches = STATE.analytics.searches.slice(-100);
  }
  if (STATE.analytics.views.length > 100) {
    STATE.analytics.views = STATE.analytics.views.slice(-100);
  }
  
  localStorage.setItem('cw:analytics', JSON.stringify(STATE.analytics));
  renderAnalyticsDashboard();
}

// Gráfico de actividad semanal (últimos 7 días)
function updateWeeklyActivityChart() {
  const canvas = document.getElementById('weeklyActivityChart');
  if (!canvas) return;
  
  // Obtener datos de los últimos 7 días
  const today = new Date();
  const data = [];
  const labels = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    labels.push(date.toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' }));
    data.push(STATE.analytics.dailyActivity[dateStr] || 0);
  }
  
  // Destruir gráfico anterior si existe
  if (window.weeklyChart) window.weeklyChart.destroy();
  
  // Crear gráfico
  const ctx = canvas.getContext('2d');
  window.weeklyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Búsquedas',
          data: data,
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: '#0284c7',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: { 
            color: '#6b7280',
            font: { size: 12, weight: 600 },
            padding: 12
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#9ca3af', font: { size: 12 } },
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        x: {
          ticks: { color: '#9ca3af', font: { size: 12 } },
          grid: { display: false }
        }
      }
    }
  });
}

// Gráfico de actividad mensual (últimos 30 días)
function updateMonthlyActivityChart() {
  const canvas = document.getElementById('monthlyActivityChart');
  if (!canvas) return;
  
  // Obtener datos de los últimos 30 días agrupados por semana
  const today = new Date();
  const data = [];
  const labels = [];
  
  for (let week = 4; week >= 0; week--) {
    let weekTotal = 0;
    for (let day = 6; day >= 0; day--) {
      const date = new Date(today);
      date.setDate(date.getDate() - (week * 7 + day));
      const dateStr = date.toISOString().split('T')[0];
      weekTotal += STATE.analytics.dailyActivity[dateStr] || 0;
    }
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (week * 7 + 6));
    labels.push(`Sem ${5 - week}`);
    data.push(weekTotal);
  }
  labels.reverse();
  data.reverse();
  
  // Destruir gráfico anterior si existe
  if (window.monthlyChart) window.monthlyChart.destroy();
  
  // Crear gráfico de barras
  const ctx = canvas.getContext('2d');
  window.monthlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Total de búsquedas',
          data: data,
          backgroundColor: [
            'rgba(6, 182, 212, 0.8)',
            'rgba(6, 182, 212, 0.8)',
            'rgba(6, 182, 212, 0.8)',
            'rgba(6, 182, 212, 0.8)',
            'rgba(6, 182, 212, 0.8)'
          ],
          borderColor: '#0891b2',
          borderWidth: 2,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: { 
            color: '#6b7280',
            font: { size: 12, weight: 600 },
            padding: 12
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#9ca3af', font: { size: 12 } },
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        x: {
          ticks: { color: '#9ca3af', font: { size: 12 } },
          grid: { display: false }
        }
      }
    }
  });
}

// Widget: Top 5 búsquedas
function updateTopSearchesWidget() {
  const widget = document.getElementById('topSearchesWidget');
  if (!widget) return;
  
  const sorted = Object.entries(STATE.analytics.searchTerms)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (sorted.length === 0) {
    widget.innerHTML = '<p style="color:var(--cw-text-muted);margin:0">Aún sin datos de búsqueda</p>';
    return;
  }
  
  let html = '';
  sorted.forEach(([term, count], idx) => {
    const color = ['#0284c7', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6'][idx];
    html += `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:rgba(0,0,0,0.02);border-radius:6px;border-left:3px solid ${color}">
        <span style="font-weight:500">${idx + 1}. ${term}</span>
        <span style="background:${color};color:white;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">${count}</span>
      </div>
    `;
  });
  
  widget.innerHTML = html;
}

// Widget: Categorías populares
function updateTopCategoriesWidget() {
  const widget = document.getElementById('topCategoriesWidget');
  if (!widget) return;
  
  // Contar vistas por categoría
  const categoryViews = {};
  STATE.analytics.views.forEach(view => {
    const manual = STATE.manuals && STATE.manuals.find ? STATE.manuals.find(m => m.id === view.manualId) : null;
    if (manual && manual.category) {
      categoryViews[manual.category] = (categoryViews[manual.category] || 0) + 1;
    }
  });
  
  const sorted = Object.entries(categoryViews)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (sorted.length === 0) {
    widget.innerHTML = '<p style="color:var(--cw-text-muted);margin:0">Aún sin datos de vista</p>';
    return;
  }
  
  let html = '';
  sorted.forEach(([cat, count], idx) => {
    const color = ['#0284c7', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6'][idx];
    html += `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:rgba(0,0,0,0.02);border-radius:6px;border-left:3px solid ${color}">
        <span style="font-weight:500">${idx + 1}. ${cat}</span>
        <span style="background:${color};color:white;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">${count}</span>
      </div>
    `;
  });
  
  widget.innerHTML = html;
}

// Widget: Manuales más vistos
function updateTopManualsWidget() {
  const widget = document.getElementById('topManualsWidget');
  if (!widget) return;
  
  // Contar vistas por manual
  const manualViews = {};
  STATE.analytics.views.forEach(view => {
    manualViews[view.manualId] = (manualViews[view.manualId] || 0) + 1;
  });
  
  const sorted = Object.entries(manualViews)
    .map(([id, count]) => ({ id, count, manual: STATE.manuals && STATE.manuals.find ? STATE.manuals.find(m => m.id === id) : null }))
    .filter(x => x.manual)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  if (sorted.length === 0) {
    widget.innerHTML = '<p style="color:var(--cw-text-muted);margin:0">Aún sin datos de vista</p>';
    return;
  }
  
  let html = '';
  sorted.forEach(({ manual, count }, idx) => {
    const color = ['#0284c7', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6'][idx];
    html += `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:rgba(0,0,0,0.02);border-radius:6px;border-left:3px solid ${color}">
        <span style="font-weight:500;max-width:70%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${idx + 1}. ${manual.title}</span>
        <span style="background:${color};color:white;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">${count}</span>
      </div>
    `;
  });
  
  widget.innerHTML = html;
}

// Actualizar métricas clave
function updateMetricsWidgets() {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0];
  
  // Búsquedas hoy vs ayer
  const todaySearches = STATE.analytics.dailyActivity[today] || 0;
  const yesterdaySearches = STATE.analytics.dailyActivity[yesterday] || 0;
  const searchChange = yesterdaySearches === 0 ? 0 : Math.round(((todaySearches - yesterdaySearches) / yesterdaySearches) * 100);
  
  document.getElementById('todaySearchesWidget').textContent = todaySearches;
  const searchTrendEl = document.getElementById('searchTrendToday');
  if (searchTrendEl) {
    if (searchChange > 0) {
      searchTrendEl.textContent = `↑ +${searchChange}% vs ayer`;
      searchTrendEl.style.color = '#16a34a';
    } else if (searchChange < 0) {
      searchTrendEl.textContent = `↓ ${searchChange}% vs ayer`;
      searchTrendEl.style.color = '#ef4444';
    } else {
      searchTrendEl.textContent = '→ Sin cambios';
      searchTrendEl.style.color = '#6b7280';
    }
  }
  
  // Vistas hoy
  const viewsToday = STATE.analytics.views.filter(v => 
    v.timestamp.split('T')[0] === today
  ).length;
  document.getElementById('todayViewsWidget').textContent = viewsToday;
  
  const viewTrendEl = document.getElementById('viewTrendToday');
  if (viewTrendEl) {
    const viewsYesterday = STATE.analytics.views.filter(v => 
      v.timestamp.split('T')[0] === yesterday
    ).length;
    const viewChange = viewsYesterday === 0 ? 0 : Math.round(((viewsToday - viewsYesterday) / viewsYesterday) * 100);
    
    if (viewChange > 0) {
      viewTrendEl.textContent = `↑ +${viewChange}% vs ayer`;
      viewTrendEl.style.color = '#16a34a';
    } else if (viewChange < 0) {
      viewTrendEl.textContent = `↓ ${viewChange}% vs ayer`;
      viewTrendEl.style.color = '#ef4444';
    } else {
      viewTrendEl.textContent = '→ Sin cambios';
      viewTrendEl.style.color = '#6b7280';
    }
  }
  
  // Promedio diario (últimos 7 días)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(new Date().setDate(new Date().getDate() - i));
    const dateStr = date.toISOString().split('T')[0];
    last7Days.push(STATE.analytics.dailyActivity[dateStr] || 0);
  }
  const avgDaily = Math.round(last7Days.reduce((a, b) => a + b) / 7);
  document.getElementById('avgDailyWidget').textContent = avgDaily;
}

// Limpiar histórico de analytics
document.addEventListener('click', (e) => {
  if (e.target.id === 'clearAnalyticsBtn') {
    if (confirm('¿Estás seguro de que quieres limpiar todo el histórico de análisis? Esta acción no se puede deshacer.')) {
      STATE.analytics = {
        searches: [],
        views: [],
        dailyActivity: {},
        searchTerms: {}
      };
      localStorage.removeItem('cw:analytics');
      renderAnalyticsDashboard();
      showAlert('✓ Histórico limpiado', 'Los datos de análisis han sido eliminados');
    }
  }
  
  // Tip del Día - siguiente
  if (e.target.id === 'nextTipBtn') {
    loadRandomTip();
  }
});

// ======== REPORTAR ACTIVIDAD DEL USUARIO ========
// Reportar actividad cada vez que el usuario hace click o usa teclado
let lastActivityReport = 0;
const ACTIVITY_REPORT_INTERVAL = 5000; // Reportar máximo cada 5 segundos

document.addEventListener('click', () => {
  const now = Date.now();
  if (now - lastActivityReport > ACTIVITY_REPORT_INTERVAL) {
    reportUserActivity();
    lastActivityReport = now;
  }
}, true); // Usar captura para detectar clicks en cualquier elemento

document.addEventListener('keydown', () => {
  const now = Date.now();
  if (now - lastActivityReport > ACTIVITY_REPORT_INTERVAL) {
    reportUserActivity();
    lastActivityReport = now;
  }
}, true);

// ======== TIP DEL DÍA ========
const TIPS_ARRAY = [
  "💬 Usa búsqueda por palabras clave para encontrar rápidamente lo que necesitas",
  "📱 La mayoría de problemas se resuelven en los primeros 3 manuales de la búsqueda",
  "⭐ Los manuales más consultados contienen soluciones a los problemas más comunes",
  "🔍 Prueba búsquedas más específicas si no encuentras lo que buscas a la primera",
  "📚 Lee los títulos de los manuales cuidadosamente antes de abrirlos",
  "⏱️ Los pasos paso a paso son más fáciles de seguir que las guías largas",
  "🎯 Utiliza las categorías para navegar por temas relacionados",
  "💡 Si un manual no te ayuda, el siguiente podría tener la solución",
  "📖 Los manuales técnicos suelen estar organizados por nivel de dificultad",
  "🚀 Las preguntas frecuentes contienen las respuestas más rápidas",
  "✅ Verifica que el manual sea compatible con tu versión o modelo",
  "🔧 Los troubleshooting suelen resolver el 80% de los problemas",
  "⚡ Guarda los manuales útiles para acceso rápido",
  "🎓 Aprende de los manuales más básicos antes de pasar a los avanzados",
  "🌟 Combina múltiples manuales para una comprensión completa del tema"
];

function loadRandomTip() {
  const today = new Date().toISOString().split('T')[0];
  let currentTipIndex = parseInt(localStorage.getItem('cw:tipIndex') || '0');
  let lastTipDate = localStorage.getItem('cw:lastTipDate');
  
  // Si es un nuevo día o es la primera vez, cargar un tip aleatorio
  if (lastTipDate !== today) {
    currentTipIndex = Math.floor(Math.random() * TIPS_ARRAY.length);
    localStorage.setItem('cw:lastTipDate', today);
  } else {
    // Si es el mismo día, rotar al siguiente tip
    currentTipIndex = (currentTipIndex + 1) % TIPS_ARRAY.length;
  }
  
  localStorage.setItem('cw:tipIndex', currentTipIndex);
  
  const tipContent = document.getElementById('tipOfDayContent');
  const tipDate = document.getElementById('tipOfDayDate');
  
  if (tipContent) {
    tipContent.textContent = TIPS_ARRAY[currentTipIndex];
    const todayDate = new Date().toLocaleDateString('es-ES', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    tipDate.textContent = `${todayDate} • Tip ${currentTipIndex + 1}/${TIPS_ARRAY.length}`;
  }
}

// ======== KPIs DE SOPORTE ========
function updateSupportKPIs() {
  if (!STATE.analytics) return;
  
  // 1. TIEMPO PROMEDIO DE RESOLUCIÓN (tiempo promedio por búsqueda)
  let totalTime = 0;
  let searchCount = STATE.analytics.searches.length;
  
  if (searchCount > 0) {
    const searches = STATE.analytics.searches;
    for (let i = 0; i < searches.length - 1; i++) {
      const current = new Date(searches[i].timestamp);
      const next = new Date(searches[i + 1].timestamp);
      const diff = Math.abs(next - current) / 1000; // en segundos
      totalTime += diff;
    }
  }
  
  const avgResolutionTime = searchCount > 0 ? Math.round(totalTime / searchCount) : 0;
  const avgTimeEl = document.getElementById('avgResolutionTimeWidget');
  if (avgTimeEl) {
    if (avgResolutionTime > 60) {
      avgTimeEl.textContent = `${Math.round(avgResolutionTime / 60)} min`;
    } else {
      avgTimeEl.textContent = `${avgResolutionTime} seg`;
    }
  }
  
  // 2. EFICIENCIA DE BÚSQUEDA (búsquedas que tuvieron vista de manual)
  const uniqueSearchTerms = Object.keys(STATE.analytics.searchTerms).length;
  const viewsCount = STATE.analytics.views.length;
  const searchEfficiency = uniqueSearchTerms > 0 ? Math.round((viewsCount / (uniqueSearchTerms * 2)) * 100) : 0;
  
  const efficiencyEl = document.getElementById('searchEfficiencyWidget');
  if (efficiencyEl) {
    efficiencyEl.textContent = `${Math.min(100, searchEfficiency)}%`;
  }
  
  // 3. SATISFACCIÓN ESTIMADA (basada en patrones de búsqueda exitosa)
  // Si hay más vistas que búsquedas únicas, asumimos que los usuarios encontraron soluciones
  let satisfactionScore = 50; // Base del 50%
  
  if (uniqueSearchTerms > 0) {
    const viewsPerSearch = viewsCount / uniqueSearchTerms;
    if (viewsPerSearch >= 2) {
      satisfactionScore = 90; // Alta satisfacción
    } else if (viewsPerSearch >= 1) {
      satisfactionScore = 75; // Buena satisfacción
    } else if (viewsPerSearch >= 0.5) {
      satisfactionScore = 60; // Satisfacción moderada
    } else {
      satisfactionScore = 50; // Baja satisfacción
    }
  }
  
  const satisfactionEl = document.getElementById('estimatedSatisfactionWidget');
  if (satisfactionEl) {
    satisfactionEl.textContent = `${satisfactionScore}%`;
  }
}

// Actualizar KPIs cuando se actualiza el dashboard
function renderAnalyticsDashboard() {
  if (!STATE.analytics) return;
  
  // Actualizar gráficos
  updateWeeklyActivityChart();
  updateMonthlyActivityChart();
  
  // Actualizar widgets
  updateTopSearchesWidget();
  updateTopCategoriesWidget();
  updateTopManualsWidget();
  updateMetricsWidgets();
  
  // Actualizar KPIs de soporte
  updateSupportKPIs();
  
  // Cargar tip del día
  loadRandomTip();
}

// ============================================
// PERMISSION POLLING - Verificar cambios de permisos
// ============================================

let permissionPollingInterval = null;

function startPermissionPolling() {
  if (permissionPollingInterval) return;
  if (!STATE.authUser || STATE.authUser.role === 'admin') return;
  
  console.log('[RBAC] Iniciando polling de permisos...');
  
  permissionPollingInterval = setInterval(async () => {
    if (!STATE.authUser?.id) return;
    
    try {
      const res = await fetch(apiUrl(`/users/${STATE.authUser.id}/roles`));
      if (!res.ok) {
        console.warn('[RBAC] Error fetching roles:', res.status);
        return;
      }
      
      const roles = await res.json();
      if (!Array.isArray(roles) || roles.length === 0) return;
      
      // Parse permissions from roles
      const newPerms = roles.flatMap(r => {
        if (!r.permissions) return [];
        const permsArray = typeof r.permissions === 'string' ? JSON.parse(r.permissions) : r.permissions;
        return Array.isArray(permsArray) ? permsArray : [];
      });
      
      const oldPerms = STATE.authUser.permissions || [];
      
      // Sort for accurate comparison
      const oldPermsStr = JSON.stringify(oldPerms.sort());
      const newPermsStr = JSON.stringify(newPerms.sort());
      
      // Check if permissions changed
      if (oldPermsStr !== newPermsStr) {
        console.log('[RBAC] ✓ Cambio de permisos detectado');
        console.log('[RBAC] Permisos anteriores:', oldPerms);
        console.log('[RBAC] Nuevos permisos:', newPerms);
        
        // Update STATE and localStorage
        STATE.authUser.permissions = newPerms;
        localStorage.setItem('cw:authUser', JSON.stringify(STATE.authUser));
        
        // Reapply UI based on new permissions
        applyPermissionBasedUI();
        
        // Show notification
        showAlert('✅ Permisos Actualizados', 'Tus permisos han sido modificados. La interfaz se ha actualizado automáticamente.');
      }
    } catch (err) {
      console.error('[RBAC] Error en polling de permisos:', err);
    }
  }, 60000); // Check every 60 seconds
}

function stopPermissionPolling() {
  if (permissionPollingInterval) {
    console.log('[RBAC] Deteniendo polling de permisos');
    clearInterval(permissionPollingInterval);
    permissionPollingInterval = null;
  }
}

// ============== SINCRONIZACIÓN AUTOMÁTICA DE MANUALES ==============

let manualsSyncInterval = null;
let lastManualsSyncHash = null;

function startManualsSyncPolling() {
  // Solo iniciar si el usuario está autenticado
  if (!STATE.authUser || !STATE.authUser.id) {
    console.log('[MANUALS-SYNC] Polling no iniciado - usuario no autenticado');
    return;
  }
  
  console.log('[MANUALS-SYNC] Iniciando polling de sincronización de manuales...');
  
  // Sincronizar inmediatamente
  syncManualsFromServer();
  
  // Luego cada 15 segundos
  manualsSyncInterval = setInterval(() => {
    syncManualsFromServer();
  }, 15000); // Check every 15 seconds for new manuals
}

function stopManualsSyncPolling() {
  if (manualsSyncInterval) {
    console.log('[MANUALS-SYNC] Deteniendo polling de sincronización');
    clearInterval(manualsSyncInterval);
    manualsSyncInterval = null;
  }
}

async function syncManualsFromServer() {
  try {
    // Cargar manuales de la API
    const response = await api.getManuals();
    const apiManuals = response.data || response.manuals || [];
    
    // Crear un hash de los manuales actuales para detectar cambios
    const newHash = JSON.stringify(apiManuals.map(m => ({ id: m.id, title: m.title, version: m.version })));
    
    // Si el hash es igual, no hay cambios
    if (newHash === lastManualsSyncHash) {
      return; // Sin cambios, no hacer nada
    }
    
    // Hash es diferente, hay cambios
    lastManualsSyncHash = newHash;
    
    // Normalizar steps
    const normalizedManuals = apiManuals.map((manual) => {
      if (!manual.steps || !Array.isArray(manual.steps)) {
        const sourceArray = manual.content || [];
        if (typeof sourceArray === 'string') {
          try {
            manual.steps = JSON.parse(sourceArray);
          } catch (e) {
            manual.steps = [];
          }
        } else if (Array.isArray(sourceArray)) {
          manual.steps = sourceArray;
        } else {
          manual.steps = [];
        }
      }
      return manual;
    });
    
    // Actualizar STATE
    const oldCount = STATE.manuals.length;
    STATE.manuals = normalizedManuals;
    
    // Si la cantidad cambió, actualizar UI
    if (normalizedManuals.length !== oldCount) {
      console.log('[MANUALS-SYNC] ✓ Cambio detectado: ahora hay', normalizedManuals.length, 'manuales (antes:', oldCount, ')');
      
      // Actualizar contador
      if(els.manualCount) els.manualCount.textContent = STATE.manuals.length;
      
      // Renderizar lista de manuales
      renderManualsList(STATE.manuals);
      
      // Notificar al usuario si se agregaron manuales
      if (normalizedManuals.length > oldCount) {
        const added = normalizedManuals.length - oldCount;
        pushNotificationToPanel({
          type: 'success',
          title: '📚 Nuevos Manuales Disponibles',
          message: `Se ${added === 1 ? 'ha agregado 1 manual' : 'han agregado ' + added + ' manuales'} a la base de datos.`,
          icon: '📚',
          duration: 5000
        });
      }
    }
  } catch (err) {
    console.error('[MANUALS-SYNC] Error sincronizando manuales:', err);
    // No mostrar alerta de error, solo log
  }
}

// ============================================
// FASE 16: KNOWLEDGE BASE MANAGER FUNCTIONS
// ============================================

/**
 * Inicializa la vista del árbol de carpetas
 * @async
 */
// ============================================
// KNOWLEDGE BASE MANAGER - REWRITE PROFESIONAL
// ============================================

/**
 * Sistema de gestión de Base de Conocimiento
 * Interfaz tipo Windows File Explorer
 */
const KBManager = {
  state: {
    folders: [],
    manuals: [],
    expanded: new Set(),
    selected: null,
  },

  /**
   * Inicializa el Knowledge Base Manager
   * @async
   */
  async init() {
    console.log('[KBM] Inicializando Knowledge Base Manager');
    
    try {
      // Cargar datos
      await Promise.all([
        this.loadFolders(),
        this.loadManuals()
      ]);
      
      // Expandir todas las carpetas recursivamente por defecto
      this.expandAllFolders(this.state.folders);
      
      // Renderizar árbol
      this.render();
      
      // Restaurar selección anterior
      this.restoreSelection();
      
      console.log('[KBM] Inicialización completada');
    } catch (error) {
      console.error('[KBM] Error durante inicialización:', error);
      showAlert('Error', 'No se pudo cargar la Base de Conocimiento');
    }
  },

  /**
   * Carga las carpetas desde el servidor
   * @async
   */
  async loadFolders() {
    try {
      // Usar el endpoint /api/folders/tree que retorna la estructura anidada
      const response = await fetch(apiUrl('/folders/tree'), {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to fetch folders');
      const result = await response.json();
      this.state.folders = result.data || [];
      console.log('[KBM] Carpetas cargadas (anidadas):', this.state.folders.length);
    } catch (error) {
      console.error('[KBM] Error cargando carpetas:', error);
      throw error;
    }
  },

  /**
   * Carga los manuales desde el servidor
   * @async
   */
  async loadManuals() {
    try {
      const result = await api.getManuals();
      this.state.manuals = result.data || [];
      console.log('[KBM] Manuales cargados:', this.state.manuals.length);
    } catch (error) {
      console.error('[KBM] Error cargando manuales:', error);
      throw error;
    }
  },

  /**
   * Obtiene manuales de una carpeta específica
   * @param {string} folderId - ID de la carpeta
   * @returns {Array} Manuales de la carpeta
   */
  getManualsInFolder(folderId) {
    return this.state.manuals.filter(m => m.folder_id === folderId);
  },

  /**
   * Obtiene subcarpetas de una carpeta
   * @param {string} parentId - ID de la carpeta padre
   * @returns {Array} Subcarpetas
   */
  getSubfolders(parentId) {
    // Este método ya no es necesario con la estructura anidada
    // pero se mantiene para compatibilidad
    return this.state.folders.filter(f => f.parent_id === parentId);
  },

  /**
   * Obtiene las subcarpetas de una carpeta en la estructura anidada
   * @param {object} folder - Objeto carpeta
   * @returns {array} Array de subcarpetas
   */
  getNestedSubfolders(folder) {
    return folder.children || [];
  },

  /**
   * Expande recursivamente todas las carpetas
   * @param {array} folders - Array de carpetas
   */
  expandAllFolders(folders) {
    if (!Array.isArray(folders)) return;
    
    folders.forEach(folder => {
      this.state.expanded.add(folder.id);
      if (folder.children && folder.children.length > 0) {
        this.expandAllFolders(folder.children);
      }
    });
  },

  /**
   * Verifica si una carpeta tiene contenido (subcarpetas o manuales)
   * @param {object} folder - Objeto carpeta
   * @returns {boolean}
   */
  hasChildren(folder) {
    const hasSubfolders = this.getSubfolders(folder.id).length > 0;
    const hasManuals = this.getManualsInFolder(folder.id).length > 0;
    return hasSubfolders || hasManuals;
  },

  /**
   * Construye el HTML del árbol recursivamente (para estructura anidada)
   * @param {array} folders - Array de carpetas raíz
   * @param {number} level - Nivel de profundidad
   * @returns {string} HTML generado
   */
  buildTree(folders = null, level = 0) {
    // Si no se pasan carpetas, usar las raíz
    if (folders === null) {
      folders = this.state.folders;
    }

    if (!Array.isArray(folders) || folders.length === 0) return '';

    let html = '';
    
    folders.forEach(folder => {
      const isExpanded = this.state.expanded.has(folder.id);
      const manuals = this.getManualsInFolder(folder.id);
      const subfolders = this.getNestedSubfolders(folder);
      const hasChildren = (subfolders.length > 0) || (manuals.length > 0);

      const indent = level * 24; // Indentación en píxeles

      // Renderizar carpeta
      html += `
        <div class="kbm-folder" data-folder-id="${folder.id}">
          <div class="kbm-folder-row" style="padding-left: ${indent}px;">
            <!-- Botón expandir/contraer -->
            <button class="kbm-expand-btn" data-folder-id="${folder.id}" style="visibility: ${hasChildren ? 'visible' : 'hidden'};">
              ${isExpanded ? '▼' : '▶'}
            </button>

            <!-- Icono y nombre -->
            <span class="kbm-folder-icon">${folder.icon || '📁'}</span>
            <span class="kbm-folder-name">${escapeHtml(folder.name)}</span>

            <!-- Contador (solo si tiene manuales directos) -->
            ${manuals.length > 0 ? `<span class="kbm-count">${manuals.length}</span>` : ''}
          </div>

          <!-- Contenido expandible -->
          <div class="kbm-folder-contents" style="display: ${isExpanded ? 'block' : 'none'};">
            <!-- Manuales directos de esta carpeta -->
            ${manuals.map(manual => this.buildManualItem(manual, indent + 24)).join('')}

            <!-- Subcarpetas (llamada recursiva) -->
            ${subfolders.length > 0 ? this.buildTree(subfolders, level + 1) : ''}
          </div>
        </div>
      `;
    });

    return html;
  },

  /**
   * Construye el HTML de un manual
   * @param {object} manual - Objeto manual
   * @param {number} indent - Indentación en píxeles
   * @returns {string} HTML del manual
   */
  buildManualItem(manual, indent) {
    return `
      <div class="kbm-manual" data-manual-id="${manual.id}" style="padding-left: ${indent}px;">
        <span class="kbm-manual-icon">📄</span>
        <span class="kbm-manual-name">${escapeHtml(manual.title)}</span>
      </div>
    `;
  },

  /**
   * Renderiza todo el árbol en el DOM
   */
  render() {
    const container = document.getElementById('folderTreeView');
    if (!container) {
      console.warn('[KBM] Contenedor folderTreeView no encontrado');
      return;
    }

    // Generar HTML
    const html = `
      <div class="kbm-tree">
        ${this.buildTree()}
      </div>
    `;

    container.innerHTML = html;

    // Agregar event listeners
    this.attachEventListeners();
    
    console.log('[KBM] Árbol renderizado');
  },

  /**
   * Adjunta event listeners a elementos del árbol
   */
  attachEventListeners() {
    // Botones de expandir/contraer
    document.querySelectorAll('.kbm-expand-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const folderId = btn.getAttribute('data-folder-id');
        this.toggleFolder(folderId);
      });
    });

    // Carpetas (seleccionar)
    document.querySelectorAll('.kbm-folder-row').forEach(row => {
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        const folderId = row.closest('.kbm-folder').getAttribute('data-folder-id');
        this.selectFolder(folderId);
      });

      // Hover effects
      row.addEventListener('mouseenter', () => {
        row.classList.add('kbm-folder-row-hover');
      });
      row.addEventListener('mouseleave', () => {
        row.classList.remove('kbm-folder-row-hover');
      });
    });

    // Manuales (abrir)
    document.querySelectorAll('.kbm-manual').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const manualId = item.getAttribute('data-manual-id');
        this.selectManual(manualId);
      });

      // Hover effects
      item.addEventListener('mouseenter', () => {
        item.classList.add('kbm-manual-hover');
      });
      item.addEventListener('mouseleave', () => {
        item.classList.remove('kbm-manual-hover');
      });
    });

    // Botones "Ver Manual" en las tarjetas
    const contentDiv = document.getElementById('folderContent');
    if (contentDiv) {
      contentDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('kbm-view-manual')) {
          const card = e.target.closest('.kbm-manual-card');
          if (card) {
            const manualId = card.getAttribute('data-manual-id');
            this.selectManual(manualId);
          }
        }
      });
    }
  },

  /**
   * Expande o contrae una carpeta
   * @param {string} folderId - ID de la carpeta
   */
  toggleFolder(folderId) {
    if (this.state.expanded.has(folderId)) {
      this.state.expanded.delete(folderId);
    } else {
      this.state.expanded.add(folderId);
    }

    // Guardar estado
    localStorage.setItem('kbm:expanded', JSON.stringify(Array.from(this.state.expanded)));

    // Re-renderizar
    this.render();
  },

  /**
   * Selecciona una carpeta y muestra sus contenidos
   * @param {string} folderId - ID de la carpeta
   */
  selectFolder(folderId) {
    const folder = this.state.folders.find(f => f.id === folderId);
    if (!folder) return;

    this.state.selected = { type: 'folder', id: folderId };
    localStorage.setItem('kbm:selected', JSON.stringify(this.state.selected));

    // Solo mostrar si estamos en la vista de Manuales
    const contentDiv = document.getElementById('folderContent');
    if (contentDiv) {
      this.displayFolderContents(folder);
    }
    
    this.highlightSelected();
  },

  /**
   * Selecciona un manual y lo abre
   * @param {string} manualId - ID del manual
   */
  selectManual(manualId) {
    const manual = this.state.manuals.find(m => m.id === manualId);
    if (!manual) return;

    this.state.selected = { type: 'manual', id: manualId };
    localStorage.setItem('kbm:selected', JSON.stringify(this.state.selected));

    console.log('[KBM] Abriendo manual:', manual.title);
    openManual(manualId);
  },

  /**
   * Muestra el contenido de una carpeta en el panel derecho
   * @param {object} folder - Objeto carpeta
   */
  displayFolderContents(folder) {
    const contentDiv = document.getElementById('folderContent');
    if (!contentDiv) return;

    const manuals = this.getManualsInFolder(folder.id);

    // Si no hay manuales
    if (manuals.length === 0) {
      contentDiv.innerHTML = `
        <div class="kbm-empty-state">
          <div class="kbm-empty-icon">📭</div>
          <div class="kbm-empty-title">${escapeHtml(folder.name)}</div>
          <div class="kbm-empty-text">No hay manuales en esta carpeta</div>
        </div>
      `;
      return;
    }

    // Mostrar manuales
    let html = `
      <div class="kbm-content-header">
        <h3 class="kbm-content-title">${escapeHtml(folder.name)}</h3>
        <p class="kbm-content-subtitle">${manuals.length} manual${manuals.length !== 1 ? 'es' : ''}</p>
      </div>
      <div class="kbm-manuals-grid">
    `;

    manuals.forEach(manual => {
      html += `
        <div class="kbm-manual-card" data-manual-id="${manual.id}">
          <div class="kbm-manual-card-header">
            <span class="kbm-manual-card-icon">📄</span>
            <span class="kbm-manual-card-title">${escapeHtml(manual.title)}</span>
          </div>
          <div class="kbm-manual-card-body">
            <p class="kbm-manual-card-category">${escapeHtml(manual.category || 'General')}</p>
            <div class="kbm-manual-card-tags">
              ${manual.role ? `<span class="kbm-tag">👤 ${escapeHtml(manual.role)}</span>` : ''}
              ${manual.type ? `<span class="kbm-tag">🏷️ ${escapeHtml(manual.type)}</span>` : ''}
            </div>
          </div>
          <div class="kbm-manual-card-footer">
            <button class="kbm-btn-small kbm-btn-primary kbm-view-manual">Ver Manual</button>
          </div>
        </div>
      `;
    });

    html += '</div>';
    contentDiv.innerHTML = html;
  },

  /**
   * Resalta el elemento seleccionado en el árbol
   */
  highlightSelected() {
    document.querySelectorAll('.kbm-folder-row').forEach(row => {
      row.classList.remove('kbm-folder-row-selected');
    });

    if (this.state.selected && this.state.selected.type === 'folder') {
      const selectedRow = document.querySelector(`.kbm-folder[data-folder-id="${this.state.selected.id}"] .kbm-folder-row`);
      if (selectedRow) {
        selectedRow.classList.add('kbm-folder-row-selected');
      }
    }
  },

  /**
   * Restaura la selección anterior desde localStorage
   */
  restoreSelection() {
    const saved = localStorage.getItem('kbm:selected');
    if (!saved) return;

    try {
      const selection = JSON.parse(saved);
      if (selection.type === 'folder') {
        const folder = this.state.folders.find(f => f.id === selection.id);
        if (folder) {
          this.selectFolder(selection.id);
        }
      }
    } catch (err) {
      console.warn('[KBM] Error restaurando selección:', err);
    }
  }
};

// Hacer KBManager global para acceso desde atributos onclick
window.KBManager = KBManager;

/**
 * Inicializa el Knowledge Base Manager cuando se carga la página
 */
async function initKnowledgeBaseManager() {
  await KBManager.init();
}

/**
 * Funciones compatibles con el código existente
 */
async function initFolderView() {
  console.log('[initFolderView] Inicializando vista de carpetas/manuales...');
  
  // Usar ManualsPro si está disponible
  if (typeof ManualsPro !== 'undefined') {
    console.log('[initFolderView] Inicializando ManualsPro...');
    try {
      await ManualsPro.init();
      console.log('[initFolderView] ✓ ManualsPro inicializado correctamente');
      
      // Sincronizar carpetas desde ManualsPro a KB_MANAGER_STATE
      if (ManualsPro.state && ManualsPro.state.allFolders) {
        KB_MANAGER_STATE.folders = ManualsPro.state.allFolders;
        console.log('[initFolderView] ✓ Carpetas sincronizadas a KB_MANAGER_STATE:', KB_MANAGER_STATE.folders.length);
      }
      
      // Cargar selectors de carpetas DESPUÉS de sincronizar
      await new Promise(resolve => setTimeout(resolve, 100));
      populateManualFolderSelect();
      populateKBEditFolderSelect();
      
    } catch (err) {
      console.error('[initFolderView] Error inicializando ManualsPro:', err);
    }
  } else {
    console.warn('[initFolderView] ManualsPro no disponible, intentando KBManager...');
    // Fallback al sistema anterior si ManualsPro no está disponible
    if (typeof KBManager !== 'undefined') {
      await KBManager.init();
    }
  }
}

function selectManual(manualId) {
  KBManager.selectManual(manualId);
}

function showFolderManuals(folderId, folderName) {
  const folder = KBManager.state.folders.find(f => f.id === folderId);
  if (folder) {
    KBManager.selectFolder(folderId);
  }
}

function toggleFolderExpand(folderId) {
  KBManager.toggleFolder(folderId);
}

/**
 * Busca manuales relacionados por tags
 * @async
 * @param {String} manualId - ID del manual
 * @returns {Array} Array de manuales relacionados
 */
async function findRelatedManuals(manualId) {
  // Usar caché si existe
  if (KB_STATE.relatedManuals.has(manualId)) {
    return KB_STATE.relatedManuals.get(manualId);
  }
  
  try {
    const result = await api.getRelatedManuals(manualId);
    const related = result.data || [];
    
    KB_STATE.relatedManuals.set(manualId, related);
    
    console.log('[KB] Manuales relacionados encontrados:', related.length);
    return related;
  } catch (err) {
    console.error('[KB] Error buscando manuales relacionados:', err);
    return [];
  }
}

/**
 * Carga y muestra manuales obsoletos
 * @async
 */
async function loadObsoleteManuals() {
  console.log('[KB] Cargando manuales obsoletos...');
  
  try {
    const result = await api.getObsoleteManuals();
    KB_STATE.obsoleteManuals = result.data || [];
    
    console.log('[KB] Manuales obsoletos encontrados:', KB_STATE.obsoleteManuals.length);
    
    // Actualizar widget en dashboard
    updateObsoleteWidget();
  } catch (err) {
    console.error('[KB] Error cargando manuales obsoletos:', err);
  }
}

/**
 * Actualiza el widget de manuales obsoletos en el dashboard
 */
function updateObsoleteWidget() {
  const widget = document.getElementById('obsoleteManualWidget');
  if (!widget) return;
  
  if (KB_STATE.obsoleteManuals.length === 0) {
    widget.innerHTML = '<p style="color: var(--cw-text-muted)">✓ No hay manuales obsoletos</p>';
    return;
  }
  
  let html = `
    <div class="obsolete-alert">
      <h4>⚠️ ${KB_STATE.obsoleteManuals.length} manuales sin actualizar (6+ meses)</h4>
      <ul class="obsolete-list">
  `;
  
  KB_STATE.obsoleteManuals.slice(0, 5).forEach(manual => {
    html += `
      <li>
        <strong>${escapeHtml(manual.title)}</strong>
        <span style="font-size: 12px; color: var(--cw-text-muted)">
          ${manual.daysWithoutUpdate} días sin actualizar
        </span>
      </li>
    `;
  });
  
  html += `</ul></div>`;
  
  widget.innerHTML = html;
}

/**
 * Muestra manuales relacionados en un modal o sidebar
 * @async
 * @param {String} manualId - ID del manual actual
 */
async function showRelatedManuals(manualId) {
  const related = await findRelatedManuals(manualId);
  
  if (related.length === 0) {
    console.log('[KB] No hay manuales relacionados');
    return;
  }
  
  const container = document.getElementById('relatedManualsContainer');
  if (!container) return;
  
  let html = '<div class="related-section"><h4>📚 Manuales Relacionados</h4><ul>';
  
  related.forEach(manual => {
    html += `
      <li class="related-item">
        <a href="#" class="related-manual-link" data-manual-id="${manual.id}">
          ${escapeHtml(manual.title)}
        </a>
        <span class="relevance-badge" style="opacity: ${Math.min(manual.relevance, 1)}">
          ${Math.round(manual.relevance * 100)}% relevante
        </span>
      </li>
    `;
  });
  
  html += '</ul></div>';
  container.innerHTML = html;
  
  // Add event listeners for related manual links
  setTimeout(() => {
    const relatedLinks = container.querySelectorAll('.related-manual-link');
    relatedLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openManual(link.dataset.manualId);
      });
    });
  }, 50);
}

/**
 * Marca un manual como revisado (limpia flag obsoleto)
 * @async
 * @param {String} manualId - ID del manual
 */
async function markManualAsReviewed(manualId) {
  try {
    await api.updateManual(manualId, {
      is_obsolete: 0,
      marked_reviewed: new Date().toISOString()
    });
    
    console.log('[KB] Manual marcado como revisado');
    
    // Recargar lista de obsoletos
    await loadObsoleteManuals();
    
    showAlert('✓ Manual Actualizado', 'El manual ha sido marcado como revisado');
  } catch (err) {
    console.error('[KB] Error marcando como revisado:', err);
    showAlert('Error', 'No se pudo marcar el manual como revisado');
  }
}

/**
 * Restaura estado expandido de carpetas desde localStorage
 */
function restoreFolderTreeState() {
  try {
    const saved = localStorage.getItem('cw:folderTree:expanded');
    if (saved) {
      KB_STATE.treeExpanded = new Set(JSON.parse(saved));
      console.log('[KB] Estado del árbol restaurado:', KB_STATE.treeExpanded.size, 'carpetas expandidas');
    }
  } catch (err) {
    console.error('[KB] Error restaurando estado del árbol:', err);
  }
}
/**
 * Inicializa el panel de gestión de carpetas (admin only)
 */
async function initFolderManagement() {
  console.log('[KB] Inicializando panel de gestión de carpetas');
  
  // Event listeners
  document.getElementById('createFolderBtn')?.addEventListener('click', createNewFolder);
  document.getElementById('deleteFolderBtn')?.addEventListener('click', deleteSelectedFolder);
  
  // Cargar carpetas
  await loadFolderManagementTree();
  
  // Cargar opciones de carpeta padre
  await loadFolderParentOptions();
}

/**
 * Carga el árbol de carpetas en el panel de admin
 */
async function loadFolderManagementTree() {
  const container = document.getElementById('folderManagementTree');
  if (!container) return;
  
  try {
    const result = await api.getFolders(null);
    const folders = result.data || [];
    
    if (folders.length === 0) {
      container.innerHTML = '<p style="color:var(--cw-text-muted);text-align:center;padding:20px 0">No hay carpetas. Crea una nueva.</p>';
      return;
    }
    
    let html = buildFolderManagementTree(folders);
    container.innerHTML = html;
    
    // Add event listeners for admin folder items
    setTimeout(() => {
      const folderItems = container.querySelectorAll('.kb-admin-folder-item');
      folderItems.forEach(item => {
        item.addEventListener('click', () => {
          if (typeof selectFolderInAdmin === 'function') {
            selectFolderInAdmin(item.dataset.folderId, item.dataset.folderName);
          }
        });
      });
    }, 50);
  } catch (err) {
    console.error('[KB] Error cargando árbol de gestión:', err);
    container.innerHTML = '<p style="color:var(--cw-danger)">Error al cargar carpetas</p>';
  }
}

/**
 * Construye el árbol de carpetas para el panel de admin
 */
function buildFolderManagementTree(folders, parentId = null, level = 0) {
  const foldersByParent = folders.filter(f => f.parent_id === parentId);
  
  if (foldersByParent.length === 0) return '';
  
  let html = '';
  
  foldersByParent.forEach(folder => {
    const hasChildren = folders.some(f => f.parent_id === folder.id);
    const subfolders = buildFolderManagementTree(folders, folder.id, level + 1);
    const indent = level * 16;
    
    html += `
      <div style="margin-left:${indent}px;padding:4px 0;border-left:${level > 0 ? '1px solid var(--cw-border-light)' : 'none'};padding-left:${level > 0 ? '8px' : '0'}">
        <div style="display:flex;align-items:center;gap:6px;padding:6px 4px;cursor:pointer;border-radius:4px;transition:background 0.2s;hover:background:var(--cw-surface-dark)" class="kb-admin-folder-item" data-folder-id="${folder.id}" data-folder-name="${escapeHtml(folder.name)}">
          <span style="font-size:16px">${folder.icon || '📁'}</span>
          <span style="flex:1;font-weight:500;font-size:13px">${escapeHtml(folder.name)}</span>
          <span style="font-size:11px;color:var(--cw-text-muted);background:var(--cw-surface-dark);padding:2px 6px;border-radius:3px">
            📄 ${folder.manualCount || 0}
          </span>
        </div>
        ${subfolders}
      </div>
    `;
  });
  
  return html;
}

/**
 * Selecciona una carpeta en el panel de admin
 */
function selectFolderInAdmin(folderId, folderName) {
  // Mostrar botón de eliminar
  document.getElementById('deleteFolderBtn').style.display = 'block';
  
  // Guardar ID seleccionado
  document.getElementById('folderNameInput').dataset.selectedFolderId = folderId;
  
  console.log('[KB] Carpeta seleccionada:', folderId);
}

/**
 * Carga las opciones de carpeta padre
 */
async function loadFolderParentOptions() {
  const select = document.getElementById('folderParentSelect');
  if (!select) return;
  
  try {
    const result = await api.getFolders(null);
    const folders = result.data || [];
    
    // Limpiar opciones (mantener la primera)
    select.innerHTML = '<option value="">Raíz (sin padre)</option>';
    
    // Agregar carpetas
    folders.forEach(folder => {
      const option = document.createElement('option');
      option.value = folder.id;
      option.textContent = `${folder.icon} ${folder.name}`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('[KB] Error cargando carpetas padre:', err);
  }
}

/**
 * Crea una nueva carpeta
 */
async function createNewFolder() {
  const name = document.getElementById('folderNameInput')?.value;
  const description = document.getElementById('folderDescInput')?.value;
  const icon = document.getElementById('folderIconInput')?.value || '📁';
  const color = document.getElementById('folderColorInput')?.value || '#3498db';
  const parentId = document.getElementById('folderParentSelect')?.value || null;
  
  if (!name || name.trim().length === 0) {
    showAlert('Error', 'El nombre de la carpeta es requerido');
    return;
  }
  
  try {
    console.log('[KB] Creando carpeta:', name);
    
    const result = await api.createFolder({
      userId: STATE.authUser?.id,
      name: name.trim(),
      description: description?.trim() || '',
      parent_id: parentId || null,
      icon,
      color
    });
    
    if (result && result.id) {
      console.log('[KB] Carpeta creada:', result.id);
      showAlert('✓ Éxito', `Carpeta "${name}" creada`);
      
      // Limpiar formulario
      document.getElementById('folderNameInput').value = '';
      document.getElementById('folderDescInput').value = '';
      document.getElementById('folderIconInput').value = '📁';
      document.getElementById('folderColorInput').value = '#3498db';
      document.getElementById('folderParentSelect').value = '';
      document.getElementById('deleteFolderBtn').style.display = 'none';
      document.getElementById('folderNameInput').dataset.selectedFolderId = '';
      
      // Recargar árbol
      await loadFolderManagementTree();
      await loadFolderParentOptions();
      
      // Recargar vista de manuales
      await initFolderView();
    } else {
      showAlert('Error', 'No se pudo crear la carpeta');
    }
  } catch (err) {
    console.error('[KB] Error creando carpeta:', err);
    showAlert('Error', err.message);
  }
}
/**
 * Carga las opciones de carpeta para el selector del modal de manual
 * Construye un árbol con indentación
 */
async function loadFolderOptionsForManual(selectElement) {
  try {
    const result = await api.getFolders(null);
    const folders = result.data || [];
    
    // Limpiar opciones manteniendo la primera
    selectElement.innerHTML = '<option value="">📁 Sin carpeta (raíz)</option>';
    
    // Función recursiva para agregar carpetas con indentación
    function addFoldersToSelect(foldersArray, parentId = null, level = 0) {
      const foldersByParent = foldersArray.filter(f => f.parent_id === parentId);
      foldersByParent.forEach(folder => {
        const indent = '─'.repeat(level * 2);
        const option = document.createElement('option');
        option.value = folder.id;
        option.textContent = `${indent} ${folder.icon || '📁'} ${folder.name}`;
        selectElement.appendChild(option);
        
        // Agregar subcarpetas recursivamente
        addFoldersToSelect(foldersArray, folder.id, level + 1);
      });
    }
    
    addFoldersToSelect(folders);
  } catch (err) {
    console.error('[KB] Error cargando opciones de carpetas:', err);
  }
}

// ============================================================
// PROFESSIONAL KB MANAGER FOR ADMIN SETTINGS (FASE 16 PREMIUM)
// ============================================================

let KB_MANAGER_STATE = {
  selectedFolderId: null,
  folders: [],
  folderStats: {},
  expandedFolders: new Set(),
  isDirty: false
};

// Initialize KB Manager in Settings
async function initKBManager() {
  // Use new professional KB Manager redesign
  if (window.KBManagerPro) {
    await KBManagerPro.init();
    console.log('[APP] ✓ KB Manager Pro initialized');
  } else {
    console.warn('[APP] KBManagerPro not available, using legacy system');
    setupKBSearch();
    
    if (window.KBM) {
      await KBM.loadFolderTree();
      await KBM.loadTeams();
      await KBM.loadSharedFolders();
    } else {
      await loadKBFolderTree();
    }
  }
  
  // SIEMPRE ejecutar estas funciones - son necesarias para los tabs y botones
  setupKBTabNavigation();      // ✓ MOVE OUTSIDE if/else - tabs need this!
  setupKBEventListeners();     // Event listeners for buttons
  await loadKBStatistics();    // Load KB stats
  setupKBDragDrop();           // Drag-drop functionality
}

function setupKBTabNavigation() {
  const tabBtns = document.querySelectorAll('.kb-tab-btn');
  const tabContents = document.querySelectorAll('.kb-tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const tabName = btn.dataset.tab;
      const tabId = tabName + '-tab';
      
      // Update buttons
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update content - hide all, show selected
      tabContents.forEach(content => {
        content.classList.add('hidden');
        content.style.display = 'none';
      });
      
      const selectedTab = document.getElementById(tabId);
      if (selectedTab) {
        selectedTab.classList.remove('hidden');
        selectedTab.style.display = 'block';
      }

      // Load tab-specific data
      if (tabName === 'kb-stats') {
        await loadKBStatistics();
      } else if (tabName === 'kb-editor') {
        // Cargar carpetas para el selector de editar
        await ensureKBFoldersLoaded();
        populateKBEditFolderSelect();
      } else if (tabName === 'kb-templates') {
        // Templates tab is ready to go, just needs initialization
      } else if (tabName === 'kb-permissions') {
        const folderId = KB_MANAGER_STATE.selectedFolderId;
        if (folderId) {
          await loadKBPermissions(folderId);
        } else {
          const panel = document.getElementById('kbPermissionsPanel');
          if (panel) panel.innerHTML = '<p style="color:var(--cw-text-muted);text-align:center;padding:40px 20px;margin:0;font-size:13px">👉 Selecciona una carpeta en el Explorador para gestionar permisos</p>';
        }
      } else if (tabName === 'kb-teams') {
        await loadKBTeams();
      } else if (tabName === 'kb-shared') {
        await loadSharedWithMe();
      }
    });
  });
}

function setupKBEventListeners() {
  // Main action buttons
  document.getElementById('kbNewFolderBtn')?.addEventListener('click', () => {
    document.querySelector('[data-tab="kb-editor"]').click();
  });

  document.getElementById('kbRefreshBtn')?.addEventListener('click', async () => {
    await loadKBFolderTree();
    await loadKBStatistics();
    showAlert('Base de conocimiento actualizada', 'success');
  });

  // Tab 1: Tree actions (moved to Tab 2)


  // Tab 2: Create folder
  document.getElementById('kbCreateFolderBtn')?.addEventListener('click', createNewKBFolder);
  document.getElementById('kbClearFolderFormBtn')?.addEventListener('click', clearKBFolderForm);

  // Tab 2: Edit folder modal buttons
  document.getElementById('saveEditFolderBtn')?.addEventListener('click', saveEditFolder);
  document.getElementById('deleteEditFolderBtn')?.addEventListener('click', deleteEditFolder);

  // Emoji Picker
  setupKBEmojiPicker();

  // Tab 3: Create team
  document.getElementById('kbCreateTeamBtn')?.addEventListener('click', createNewKBTeam);

  // Expand/collapse all
  document.getElementById('expandAllFoldersBtn')?.addEventListener('click', expandAllFolders);
  document.getElementById('collapseAllFoldersBtn')?.addEventListener('click', collapseAllFolders);

  // Templates
  document.querySelectorAll('[data-template]').forEach(card => {
    card.querySelector('button').addEventListener('click', () => applyFolderTemplate(card.dataset.template));
  });

  // Tab 5: Permissions - Manejado en setupKBTabNavigation(), no necesita listener aquí
}

function setupKBEmojiPicker() {
  const pickerBtn = document.getElementById('kbEmojiPickerBtn');
  const container = document.getElementById('kbEmojiPickerContainer');
  const grid = document.getElementById('kbEmojiGrid');
  const input = document.getElementById('kbFolderIcon');
  
  if (!pickerBtn || !container || !grid) return;
  
  // Common emojis for folders
  const emojis = [
    '📁', '📂', '📦', '📋', '📌', '📑', '📊', '📈',
    '💼', '📱', '🖥️', '⚙️', '🔧', '🔒', '🔐', '🌐',
    '👥', '👤', '💻', '📚', '🎓', '🎯', '📞', '✅',
    '⚡', '🚀', '💡', '🎨', '🎭', '🎪', '🎬', '🎮',
    '🏢', '🏛️', '🏭', '🏗️', '🏘️', '🏚️', '🏠', '🏡',
    '📡', '📶', '📳', '📴', '🔔', '🔕', '📢', '📣',
    '⭐', '✨', '💫', '🌟', '⚠️', '❌', '✔️', '☑️'
  ];
  
  pickerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    container.style.display = container.style.display === 'none' ? 'grid' : 'none';
    
    // Populate grid if empty
    if (grid.children.length === 0) {
      emojis.forEach(emoji => {
        const btn = document.createElement('button');
        btn.textContent = emoji;
        btn.style.cssText = 'padding:8px;font-size:24px;border:1px solid var(--cw-border);background:var(--cw-bg);border-radius:6px;cursor:pointer;transition:all 0.2s';
        btn.onmouseover = () => btn.style.background = 'var(--cw-primary)';
        btn.onmouseout = () => btn.style.background = 'var(--cw-bg)';
        btn.addEventListener('click', (e2) => {
          e2.preventDefault();
          input.value = emoji;
          container.style.display = 'none';
        });
        grid.appendChild(btn);
      });
    }
  });
  
  // Close picker when clicking outside
  document.addEventListener('click', (e) => {
    if (!pickerBtn.contains(e.target) && !container.contains(e.target)) {
      container.style.display = 'none';
    }
  });
}

async function loadKBFolderTree() {
  const container = document.getElementById('kbFolderTree');
  container.innerHTML = '<div class="kb-loading">Cargando estructura...</div>';

  try {
    const response = await fetch(apiUrl('/folders/tree'));
    const data = await response.json();
    KB_MANAGER_STATE.folders = data.data || [];
    
    const html = buildKBTreeHTML(KB_MANAGER_STATE.folders);
    container.innerHTML = html || '<p style="color:var(--cw-text-muted);text-align:center;padding:20px">No hay carpetas. Crea una para comenzar.</p>';

    attachKBTreeListeners();
    updateKBBreadcrumb(); // Update breadcrumb on tree load
    populateKBFolderParents(); // Update folder parent selector
  } catch (err) {
    console.error('Error loading KB tree:', err);
    container.innerHTML = '<p style="color:var(--cw-danger)">Error al cargar carpetas</p>';
  }
}

function buildKBTreeHTML(folders, level = 0) {
  if (!folders || folders.length === 0) return '';

  let html = level === 0 ? '' : '<div class="kb-folder-children">';

  folders.forEach(folder => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = KB_MANAGER_STATE.expandedFolders.has(folder.id);
    const isSelected = KB_MANAGER_STATE.selectedFolderId === folder.id;
    const manualCount = folder.manual_count || 0;
    const manualLabel = manualCount === 1 ? 'manual' : 'manuales';

    html += `
      <div class="kb-folder-item ${isSelected ? 'selected' : ''}" data-folder-id="${folder.id}" draggable="true">
        ${hasChildren ? `
          <div class="kb-folder-toggle ${isExpanded ? 'expanded' : ''}" data-folder-id="${folder.id}">▶</div>
        ` : '<div style="width:20px"></div>'}
        <span class="kb-folder-icon" style="font-size:18px">${folder.icon || '📁'}</span>
        <span class="kb-folder-name" data-folder-id="${folder.id}">${escapeHtml(folder.name)}</span>
        <span class="kb-folder-count" title="${folder.description || ''}">${manualCount} ${manualLabel}</span>
      </div>
    `;

    if (hasChildren && isExpanded) {
      html += buildKBTreeHTML(folder.children, level + 1);
    } else if (hasChildren) {
      html += '<div class="kb-folder-children hidden" data-folder-id="' + folder.id + '"></div>';
    }
  });

  if (level > 0) html += '</div>';
  return html;
}

function attachKBTreeListeners() {
  // Folder selection
  document.querySelectorAll('.kb-folder-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('kb-folder-toggle')) {
        selectKBFolder(item.dataset.folderId);
      }
    });
  });

  // Toggle expansion
  document.querySelectorAll('.kb-folder-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleKBFolderExpand(toggle.dataset.folderId);
    });
  });

  // Context menu folder names (right-click)
  document.querySelectorAll('.kb-folder-name').forEach(name => {
    name.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const folderId = name.dataset.folderId;
      if (typeof showKBFolderContextMenu === 'function') {
        showKBFolderContextMenu(e, folderId);
      }
    });
  });

  // Edit panel buttons
  document.querySelectorAll('.kb-save-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const folderId = btn.dataset.folderId;
      if (typeof saveKBFolderEdit === 'function') {
        saveKBFolderEdit(folderId);
      }
    });
  });

  document.querySelectorAll('.kb-cancel-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (typeof clearKBEditPanel === 'function') {
        clearKBEditPanel();
      }
    });
  });

  document.querySelectorAll('.kb-delete-folder-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const folderId = btn.dataset.folderId;
      if (typeof deleteKBFolderWithConfirm === 'function') {
        deleteKBFolderWithConfirm(folderId);
      }
    });
  });

  document.querySelectorAll('.kb-share-folder-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const folderId = btn.dataset.folderId;
      if (typeof openShareFolderModal === 'function') {
        openShareFolderModal(folderId);
      }
    });
  });
}

function selectKBFolder(folderId) {
  KB_MANAGER_STATE.selectedFolderId = folderId;

  // Update UI
  document.querySelectorAll('.kb-folder-item').forEach(item => {
    item.classList.toggle('selected', item.dataset.folderId === folderId);
  });

  // Update quick info
  updateKBQuickInfo(folderId);
  updateKBFolderManuals(folderId);

  // Enable action buttons - REMOVED
  // Folder selected - update edit panel on Tab 2
  updateKBEditPanel(folderId);
}

function toggleKBFolderExpand(folderId) {
  if (KB_MANAGER_STATE.expandedFolders.has(folderId)) {
    KB_MANAGER_STATE.expandedFolders.delete(folderId);
  } else {
    KB_MANAGER_STATE.expandedFolders.add(folderId);
  }
  loadKBFolderTree();
}

function expandAllFolders() {
  document.querySelectorAll('.kb-folder-item').forEach(item => {
    KB_MANAGER_STATE.expandedFolders.add(item.dataset.folderId);
  });
  loadKBFolderTree();
}

function collapseAllFolders() {
  KB_MANAGER_STATE.expandedFolders.clear();
  loadKBFolderTree();
}

async function updateKBQuickInfo(folderId) {
  const container = document.getElementById('kbQuickInfo');
  
  try {
    const response = await apiCall(`/api/folders/${folderId}/statistics`);
    const stats = await response.json();

    const folder = findFolderInTree(KB_MANAGER_STATE.folders, folderId);
    if (!folder) return;

    container.innerHTML = `
      <div class="kb-info-row">
        <span class="kb-info-label">Carpeta</span>
        <span class="kb-info-value" style="display:flex;align-items:center;gap:8px">
          <span style="font-size:18px">${folder.icon}</span>
          ${escapeHtml(folder.name)}
        </span>
      </div>
      <div class="kb-info-row">
        <span class="kb-info-label">Manuales</span>
        <span class="kb-info-value">${stats.manualCount}</span>
      </div>
      <div class="kb-info-row">
        <span class="kb-info-label">Tamaño</span>
        <span class="kb-info-value">${stats.totalSize} KB</span>
      </div>
      <div class="kb-info-row">
        <span class="kb-info-label">Revisados</span>
        <span class="kb-info-value">${stats.reviewedPercentage}% (${stats.reviewedCount}/${stats.manualCount})</span>
      </div>
      <div class="kb-info-row">
        <span class="kb-info-label">Descripción</span>
        <span class="kb-info-value">${folder.description || 'Sin descripción'}</span>
      </div>
    `;
  } catch (err) {
    console.error('Error updating quick info:', err);
  }
}

async function updateKBFolderManuals(folderId) {
  const container = document.getElementById('kbFolderManualsPreview');

  try {
    const response = await apiCall(`/api/manuals?folder_id=${folderId}`);
    const data = await response.json();
    const manuals = data.data || [];

    if (manuals.length === 0) {
      container.innerHTML = '<p style="color:var(--cw-text-muted);text-align:center;padding:20px;margin:0">Sin manuales en esta carpeta</p>';
      return;
    }

    let html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--cw-border);">';
    html += `<span style="font-weight:bold;font-size:12px;color:var(--cw-text-muted)">${manuals.length} manuales</span>`;
    html += '<button class="secondary select-multiple-kb-manuals-btn" style="padding:4px 8px;font-size:12px">Seleccionar múltiples</button>';
    html += '</div>';

    html += manuals.slice(0, 10).map(manual => `
      <div class="kb-manual-item" data-manual-id="${manual.id}" style="display:flex;align-items:center;gap:8px;padding:8px;border:1px solid var(--cw-border);border-radius:4px;margin-bottom:4px;background:var(--cw-bg);transition:all 0.2s;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">
          <span class="kb-manual-icon">📄</span>
          <span class="kb-manual-title kb-manual-open-btn" data-manual-id="${manual.id}" title="${escapeHtml(manual.title)}" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer">${escapeHtml(manual.title)}</span>
        </div>
        <div style="display:flex;gap:4px;align-items:center">
          <span class="kb-manual-favorite-btn" data-manual-id="${manual.id}" title="Favorito" style="cursor:pointer;font-size:16px">
            ${manual.is_favorite ? '⭐' : '☆'}
          </span>
          <button class="mini-btn kb-manual-edit-btn" data-manual-id="${manual.id}" style="padding:4px 6px;font-size:11px;cursor:pointer" title="Editar">✏️</button>
          <button class="mini-btn kb-manual-delete-btn" data-manual-id="${manual.id}" style="padding:4px 6px;font-size:11px;cursor:pointer;color:var(--cw-danger)" title="Eliminar">🗑️</button>
        </div>
      </div>
    `).join('');

    if (manuals.length > 10) {
      html += `<p style="color:var(--cw-text-muted);font-size:11px;text-align:center;padding:8px;margin:8px 0 0 0;border-top:1px solid var(--cw-border)">+${manuals.length - 10} más</p>`;
    }

    container.innerHTML = html;
    
    // Add event listeners for KB manual items
    setTimeout(() => {
      // Hover effects for manual items
      const manualItems = container.querySelectorAll('.kb-manual-item');
      manualItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
          item.style.background = 'var(--cw-bg-secondary)';
        });
        item.addEventListener('mouseleave', () => {
          item.style.background = 'var(--cw-bg)';
        });
      });
      
      // Open manual
      const openBtns = container.querySelectorAll('.kb-manual-open-btn');
      openBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          editKBManual(btn.dataset.manualId);
        });
      });
      
      // Toggle favorite
      const favBtns = container.querySelectorAll('.kb-manual-favorite-btn');
      favBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleManualFavorite(btn.dataset.manualId);
        });
      });
      
      // Edit manual
      const editBtns = container.querySelectorAll('.kb-manual-edit-btn');
      editBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          editKBManual(btn.dataset.manualId);
        });
      });
      
      // Delete manual
      const deleteBtns = container.querySelectorAll('.kb-manual-delete-btn');
      deleteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteKBManual(btn.dataset.manualId);
        });
      });
      
      // Select multiple manuals button
      const selectMultipleBtn = container.querySelector('.select-multiple-kb-manuals-btn');
      if (selectMultipleBtn) {
        selectMultipleBtn.addEventListener('click', () => {
          selectMultipleKBManuals();
        });
      }
    }, 50);
    
    setupKBDragDrop();
  } catch (err) {
    console.error('Error loading folder manuals:', err);
    container.innerHTML = '<p style="color:var(--cw-danger);padding:20px">Error cargando manuales</p>';
  }
}

async function createNewKBFolder() {
  const name = document.getElementById('kbFolderName').value.trim();
  const description = document.getElementById('kbFolderDesc').value.trim();
  const icon = document.getElementById('kbFolderIcon').value.trim() || '📁';
  const parentId = document.getElementById('kbFolderParent').value || null;
  const accessLevel = document.getElementById('kbFolderAccess').value;
  const folderType = document.getElementById('kbFolderType').value;
  const teamId = accessLevel === 'team' ? document.getElementById('kbFolderTeam').value : null;

  if (!name) {
    showAlert('El nombre de la carpeta es obligatorio', 'error');
    return;
  }

  if (accessLevel === 'team' && !teamId) {
    showAlert('Por favor selecciona un equipo', 'error');
    return;
  }

  try {
    const response = await fetch(apiUrl('/folders'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: getCurrentUserId(),
        name, description, icon, parent_id: parentId,
        accessLevel, folderType, teamId
      })
    });

    if (!response.ok) throw new Error('Error creating folder');

    showAlert(`Carpeta "${name}" creada exitosamente`, 'success');
    clearKBFolderForm();
    
    // Actualizar en tiempo real
    await loadKBFolderTree();
    await loadKBStatistics();
    
    // Actualizar ManualsPro para que muestre las nuevas carpetas
    if (window.ManualsPro) {
      try {
        await ManualsPro.loadFolders();
        ManualsPro.renderUI();  // Re-render with new folders
        // Sincronizar a KB_MANAGER_STATE
        if (ManualsPro.state && ManualsPro.state.allFolders) {
          KB_MANAGER_STATE.folders = ManualsPro.state.allFolders;
        }
      } catch (err) {
        console.warn('[KB] Could not reload folders in ManualsPro:', err);
      }
    }
    
    // Actualizar selector de carpeta en modal de manuales
    populateManualFolderSelect();
    
    // Actualizar selector de carpeta para editar
    populateKBEditFolderSelect();
  } catch (err) {
    console.error('Error:', err);
    showAlert('Error creando carpeta', 'error');
  }
}

async function handleKBFolderAccessChange(event) {
  const container = document.getElementById('kbTeamSelectorContainer');
  if (!container) return;
  
  if (event.target.value === 'team') {
    container.style.display = 'block';
    // Load teams for the selector
    await loadTeamsForSelector('kbFolderTeam');
  } else {
    container.style.display = 'none';
  }
}

async function createNewKBTeam() {
  const name = document.getElementById('kbNewTeamName').value.trim();
  const description = document.getElementById('kbNewTeamDesc').value.trim();

  if (!name) {
    showAlert('El nombre del equipo es obligatorio', 'error');
    return;
  }

  try {
    const response = await fetch(apiUrl('/teams'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name,
        description
      })
    });

    if (response.status === 401) {
      showAlert('No está autenticado para crear equipos', 'error');
      return;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error creating team');
    }

    showAlert(`Equipo "${name}" creado exitosamente`, 'success');
    document.getElementById('kbNewTeamName').value = '';
    document.getElementById('kbNewTeamDesc').value = '';
    
    // Reload teams if KBManagerPro is available
    if (window.KBManagerPro && typeof KBManagerPro.loadTeams === 'function') {
      try {
        await KBManagerPro.loadTeams();
      } catch (err) {
        console.warn('[KB] Could not reload teams from KBManagerPro:', err);
      }
    }
  } catch (err) {
    console.error('[KB] Error creating team:', err);
    showAlert('Error creando equipo: ' + err.message, 'error');
  }
}

function clearKBFolderForm() {
  document.getElementById('kbFolderName').value = '';
  document.getElementById('kbFolderDesc').value = '';
  document.getElementById('kbFolderIcon').value = '📁';
  document.getElementById('kbFolderParent').value = '';
  document.getElementById('kbFolderAccess').value = 'private';
  document.getElementById('kbFolderType').value = 'standard';
  populateKBFolderParents();
}

function populateKBFolderParents() {
  const select = document.getElementById('kbFolderParent');
  if (!select) return;

  // Keep the first option (Raíz)
  const rootOption = select.querySelector('option[value=""]');
  select.innerHTML = '';
  if (rootOption) {
    select.appendChild(rootOption);
  }

  // Add all folders from the tree
  function addFoldersToSelect(folders, level = 0) {
    for (const folder of (folders || [])) {
      const option = document.createElement('option');
      option.value = folder.id;
      const indent = '&nbsp;&nbsp;'.repeat(level);
      option.textContent = `${'  '.repeat(level)}${folder.icon || '📁'} ${folder.name}`;
      select.appendChild(option);

      // Add children recursively
      if (folder.children && folder.children.length > 0) {
        addFoldersToSelect(folder.children, level + 1);
      }
    }
  }

  addFoldersToSelect(KB_MANAGER_STATE.folders || []);

  // Select the currently selected folder by default
  if (KB_MANAGER_STATE.selectedFolderId) {
    select.value = KB_MANAGER_STATE.selectedFolderId;
  }
}

function populateManualFolderSelect() {
  const container = document.getElementById('manualFolderTreeContainer');
  const input = document.getElementById('newManualFolderSelect');
  const displayName = document.getElementById('selectedFolderName');
  
  if (!container || !input) return;

  // Sincronizar carpetas desde ManualsPro si es necesario
  if (!KB_MANAGER_STATE.folders || KB_MANAGER_STATE.folders.length === 0) {
    if (window.ManualsPro && ManualsPro.state && ManualsPro.state.allFolders) {
      KB_MANAGER_STATE.folders = ManualsPro.state.allFolders;
      console.log('[populateManualFolderSelect] Sincronizadas carpetas desde ManualsPro:', KB_MANAGER_STATE.folders.length);
    }
  }

  // Función para renderizar el árbol
  function renderFolderTree(folders, level = 0) {
    let html = '';
    
    for (const folder of (folders || [])) {
      const hasChildren = folder.children && folder.children.length > 0;
      const folderId = `folder-${folder.id}`;
      const indent = level * 16;
      
      html += `
        <div style="user-select: none;">
          <div 
            data-folder-id="${folder.id}"
            style="
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 8px 12px;
              margin: 2px 0;
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.2s;
              margin-left: ${indent}px;
              background: transparent;
            "
            onmouseover="this.style.background='var(--cw-bg-hover)'"
            onmouseout="this.style.background='transparent'"
            onclick="selectManualFolder('${folder.id}', '${folder.name.replace(/'/g, "\\'")}')"
          >
            ${hasChildren ? `
              <button 
                onclick="event.stopPropagation(); toggleFolderNode('${folderId}')"
                style="
                  background: none;
                  border: none;
                  padding: 0;
                  cursor: pointer;
                  font-size: 12px;
                  color: var(--cw-text-muted);
                  width: 20px;
                  text-align: center;
                "
              >
                <span id="${folderId}-icon">▶</span>
              </button>
            ` : '<span style="width: 20px;"></span>'}
            <span style="font-size: 14px; flex-shrink: 0;">${folder.icon || '📁'}</span>
            <span style="flex: 1; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${folder.name}
            </span>
          </div>
          ${hasChildren ? `
            <div id="${folderId}" style="display: none;">
              ${renderFolderTree(folder.children, level + 1)}
            </div>
          ` : ''}
        </div>
      `;
    }
    
    return html;
  }

  // Agregar opción "Sin carpeta"
  let html = `
    <div 
      data-folder-id=""
      style="
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        margin: 2px 0;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        background: transparent;
      "
      onmouseover="this.style.background='var(--cw-bg-hover)'"
      onmouseout="this.style.background='transparent'"
      onclick="selectManualFolder('', 'Sin carpeta')"
    >
      <span style="font-size: 14px;">🚫</span>
      <span style="flex: 1; font-size: 12px; font-weight: 500;">Sin carpeta (disponible en todas)</span>
    </div>
  `;

  // Agregar carpetas desde KB_MANAGER_STATE
  if (KB_MANAGER_STATE.folders && KB_MANAGER_STATE.folders.length > 0) {
    html += renderFolderTree(KB_MANAGER_STATE.folders);
  } else {
    html += '<div style="padding:12px;text-align:center;color:var(--cw-text-muted);font-size:11px">No hay carpetas. Crea una en KB Manager</div>';
  }

  container.innerHTML = html;
}

function selectManualFolder(folderId, folderName) {
  const input = document.getElementById('newManualFolderSelect');
  const displayName = document.getElementById('selectedFolderName');
  
  if (input) input.value = folderId;
  if (displayName) displayName.textContent = folderName || 'Sin carpeta';
  
  console.log('[selectManualFolder] Seleccionada carpeta:', {id: folderId, name: folderName});
}

function toggleFolderNode(nodeId) {
  const node = document.getElementById(nodeId);
  const icon = document.getElementById(nodeId + '-icon');
  
  if (node && icon) {
    const isHidden = node.style.display === 'none';
    node.style.display = isHidden ? 'block' : 'none';
    icon.textContent = isHidden ? '▼' : '▶';
  }
}

// ============================================
// Edit KB Folder Functions
// ============================================
async function ensureKBFoldersLoaded() {
  // Si ya están cargadas, retorna inmediatamente
  if (KB_MANAGER_STATE.folders && KB_MANAGER_STATE.folders.length > 0) {
    console.log('[ensureKBFoldersLoaded] Carpetas ya cargadas:', KB_MANAGER_STATE.folders.length);
    return;
  }
  
  console.log('[ensureKBFoldersLoaded] Cargando carpetas...');
  
  // Intentar cargar desde ManualsPro
  if (typeof ManualsPro !== 'undefined') {
    try {
      await ManualsPro.loadFolders();
      if (ManualsPro.state && ManualsPro.state.allFolders) {
        KB_MANAGER_STATE.folders = ManualsPro.state.allFolders;
        console.log('[ensureKBFoldersLoaded] ✓ Carpetas cargadas desde ManualsPro:', KB_MANAGER_STATE.folders.length);
        return;
      }
    } catch (err) {
      console.error('[ensureKBFoldersLoaded] Error cargando desde ManualsPro:', err);
    }
  }
  
  // Fallback: cargar desde API directamente
  try {
    const response = await fetch(apiUrl('/folders/tree'));
    if (response.ok) {
      const data = await response.json();
      KB_MANAGER_STATE.folders = data.data || data.folders || [];
      console.log('[ensureKBFoldersLoaded] ✓ Carpetas cargadas desde API:', KB_MANAGER_STATE.folders.length);
    }
  } catch (err) {
    console.error('[ensureKBFoldersLoaded] Error cargando desde API:', err);
  }
}

function populateKBEditFolderSelect() {
  const container = document.getElementById('kbEditFolderTreeContainer');
  if (!container) {
    console.warn('[populateKBEditFolderSelect] Container no encontrado');
    return;
  }
  
  console.log('[populateKBEditFolderSelect] Iniciando carga de carpetas...');
  
  // Sincronizar carpetas desde ManualsPro si es necesario
  if (!KB_MANAGER_STATE.folders || KB_MANAGER_STATE.folders.length === 0) {
    if (window.ManualsPro && ManualsPro.state && ManualsPro.state.allFolders) {
      KB_MANAGER_STATE.folders = ManualsPro.state.allFolders;
      console.log('[populateKBEditFolderSelect] Sincronizadas carpetas desde ManualsPro:', KB_MANAGER_STATE.folders.length);
    }
  }
  
  console.log('[populateKBEditFolderSelect] KB_MANAGER_STATE.folders:', KB_MANAGER_STATE.folders);
  
  function renderEditFolderTree(folders, level = 0) {
    let html = '';
    folders.forEach(folder => {
      const nodeId = `kbEditFolderNode-${folder.id}`;
      const childrenNodeId = `kbEditFolderChildren-${folder.id}`;
      
      const hasChildren = folder.children && folder.children.length > 0;
      const toggleIcon = hasChildren ? `<span id="${nodeId}-icon" style="cursor:pointer;width:16px;display:inline-block" onclick="event.stopPropagation(); toggleKBEditFolderNode('${nodeId}')">▶</span>` : '<span style="width:16px;display:inline-block"></span>';
      
      html += `
        <div style="margin-left:${level * 16}px;user-select:none">
          <div style="display:flex;align-items:center;gap:6px;padding:8px 6px;border-radius:6px;cursor:pointer;transition:all 0.15s;background:var(--cw-bg);margin-bottom:4px" 
               onmouseover="this.style.background='var(--cw-bg-hover)'" 
               onmouseout="this.style.background='var(--cw-bg)'"
               onclick="selectKBEditFolder('${folder.id}', '${folder.name}', event)">
            ${toggleIcon}
            <span style="font-size:13px">📁</span>
            <span style="font-size:12px;font-weight:500;flex:1;color:var(--cw-text)">${folder.name}</span>
          </div>
          ${hasChildren ? `<div id="${childrenNodeId}" style="display:block">${renderEditFolderTree(folder.children, level + 1)}</div>` : ''}
        </div>
      `;
    });
    return html;
  }

  let html = `
    <div style="padding:8px 6px;display:flex;align-items:center;gap:6px;border-radius:6px;cursor:pointer;transition:all 0.15s;background:var(--cw-bg);margin-bottom:4px"
         onmouseover="this.style.background='var(--cw-bg-hover)'"
         onmouseout="this.style.background='var(--cw-bg)'"
         onclick="selectKBEditFolder('', 'Sin carpeta', event)">
      <span style="font-size:14px">🚫</span>
      <span style="flex:1;font-size:12px;font-weight:500">Sin carpeta</span>
    </div>
  `;

  if (KB_MANAGER_STATE.folders && KB_MANAGER_STATE.folders.length > 0) {
    console.log('[populateKBEditFolderSelect] Renderizando', KB_MANAGER_STATE.folders.length, 'carpetas');
    html += renderEditFolderTree(KB_MANAGER_STATE.folders);
  } else {
    console.warn('[populateKBEditFolderSelect] No hay carpetas para mostrar');
    html += '<div style="padding:12px;text-align:center;color:var(--cw-text-muted);font-size:11px">No hay carpetas. Crea una en KB Manager</div>';
  }

  container.innerHTML = html;
  console.log('[populateKBEditFolderSelect] ✓ Selector cargado');
}

function selectKBEditFolder(folderId, folderName, event) {
  event.stopPropagation();
  const input = document.getElementById('kbEditFolderSelect');
  const displayName = document.getElementById('kbEditSelectedFolderName');
  
  if (input) input.value = folderId;
  if (displayName) displayName.textContent = folderName || 'Sin carpeta';
}

function toggleKBEditFolderNode(nodeId) {
  const node = document.getElementById(nodeId);
  const icon = document.getElementById(nodeId + '-icon');
  
  if (node && icon) {
    const isHidden = node.style.display === 'none';
    node.style.display = isHidden ? 'block' : 'none';
    icon.textContent = isHidden ? '▼' : '▶';
  }
}

function openEditFolderPanel() {
  const folderId = document.getElementById('kbEditFolderSelect')?.value;
  
  if (!folderId) {
    alert('Por favor selecciona una carpeta para editar');
    return;
  }

  const folder = findFolderById(folderId);
  if (!folder) {
    alert('Carpeta no encontrada');
    return;
  }

  // Open edit folder modal/form
  openEditFolderForm(folder);
}

function findFolderById(id) {
  function search(folders) {
    for (let folder of folders) {
      if (folder.id == id) return folder;
      if (folder.children) {
        const found = search(folder.children);
        if (found) return found;
      }
    }
    return null;
  }
  return search(KB_MANAGER_STATE.folders || []);
}

function openEditFolderForm(folder) {
  if (!folder) {
    showAlert('Carpeta no encontrada', 'error');
    return;
  }

  // Llenar el formulario con los datos de la carpeta
  document.getElementById('editFolderId').value = folder.id;
  document.getElementById('editFolderName').value = folder.name || '';
  document.getElementById('editFolderDesc').value = folder.description || '';
  document.getElementById('editFolderIcon').value = folder.icon || '📁';
  document.getElementById('editFolderType').value = folder.folderType || 'regular';
  document.getElementById('editFolderAccess').value = folder.accessLevel || 'private';
  
  // Cargar los permisos compartidos
  loadFolderShares(folder.id);
  
  // Mostrar el modal
  const modal = document.getElementById('editFolderModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
}

async function saveEditFolder() {
  const folderId = document.getElementById('editFolderId').value;
  const name = document.getElementById('editFolderName').value.trim();
  const description = document.getElementById('editFolderDesc').value.trim();
  const icon = document.getElementById('editFolderIcon').value.trim() || '📁';
  const folderType = document.getElementById('editFolderType').value;
  const accessLevel = document.getElementById('editFolderAccess').value;
  const teamId = accessLevel === 'team' ? document.getElementById('editFolderTeam')?.value : null;
  
  if (!name) {
    showAlert('El nombre de la carpeta es obligatorio', 'error');
    return;
  }

  if (accessLevel === 'team' && !teamId) {
    showAlert('Por favor selecciona un equipo', 'error');
    return;
  }

  try {
    const response = await fetch(apiUrl(`/folders/${folderId}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, description, icon, folderType, accessLevel, teamId
      })
    });

    if (!response.ok) throw new Error('Error updating folder');

    showAlert(`Carpeta "${name}" actualizada exitosamente`, 'success');
    
    // Cerrar modal
    const modal = document.getElementById('editFolderModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
    
    // Actualizar en tiempo real
    await loadKBFolderTree();
    await loadKBStatistics();
    
    // Actualizar ManualsPro
    if (window.ManualsPro) {
      try {
        await ManualsPro.loadFolders();
        ManualsPro.renderUI();
        if (ManualsPro.state && ManualsPro.state.allFolders) {
          KB_MANAGER_STATE.folders = ManualsPro.state.allFolders;
        }
      } catch (err) {
        console.warn('[KB] Could not reload folders in ManualsPro:', err);
      }
    }
    
    // Refrescar selectores
    populateManualFolderSelect();
    populateKBEditFolderSelect();
  } catch (err) {
    console.error('Error:', err);
    showAlert('Error actualizando carpeta', 'error');
  }
}

async function deleteEditFolder() {
  const folderId = document.getElementById('editFolderId').value;
  const folderName = document.getElementById('editFolderName').value;
  
  if (!confirm(`¿Estás seguro de que quieres eliminar la carpeta "${folderName}"? Esta acción no se puede deshacer.`)) {
    return;
  }

  try {
    const response = await fetch(apiUrl(`/folders/${folderId}`), {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Error deleting folder');

    showAlert(`Carpeta "${folderName}" eliminada exitosamente`, 'success');
    
    // LIMPIAR SELECCIÓN
    const editSelect = document.getElementById('kbEditFolderSelect');
    const editPanel = document.getElementById('kbEditPanel');
    if (editSelect) editSelect.value = '';
    if (editPanel) editPanel.innerHTML = '<p style="color:var(--cw-text-muted);text-align:center;padding:40px 20px;margin:0;font-size:13px">👉 Selecciona una carpeta para editar</p>';
    
    // Cerrar modal
    const modal = document.getElementById('editFolderModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
    
    // Actualizar en tiempo real
    await loadKBFolderTree();
    await loadKBStatistics();
    
    // Actualizar ManualsPro
    if (window.ManualsPro) {
      try {
        await ManualsPro.loadFolders();
        ManualsPro.renderUI();
        if (ManualsPro.state && ManualsPro.state.allFolders) {
          KB_MANAGER_STATE.folders = ManualsPro.state.allFolders;
        }
      } catch (err) {
        console.warn('[KB] Could not reload folders in ManualsPro:', err);
      }
    }
    
    // Refrescar selectores
    populateManualFolderSelect();
    populateKBEditFolderSelect();
  } catch (err) {
    console.error('Error:', err);
    showAlert('Error eliminando carpeta', 'error');
  }
}

async function toggleFolderFavorite() {
  const folderId = KB_MANAGER_STATE.selectedFolderId;
  if (!folderId) return;

  try {
    const folder = findFolderInTree(KB_MANAGER_STATE.folders, folderId);
    const newState = !folder.is_favorite;

    const response = await apiCall(`/api/folders/${folderId}/favorite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFavorite: newState })
    });

    if (!response.ok) throw new Error('Error toggling favorite');

    showAlert(newState ? 'Agregado a favoritos' : 'Removido de favoritos', 'success');
    await loadKBFolderTree();
  } catch (err) {
    console.error('Error:', err);
    showAlert('Error actualizando favorito', 'error');
  }
}

function updateKBEditPanel(folderId) {
  const panel = document.getElementById('kbEditPanel');
  
  if (!folderId) {
    panel.innerHTML = '<p style="color:var(--cw-text-muted);text-align:center;padding:40px 20px;margin:0;font-size:13px">👉 Selecciona una carpeta para editar</p>';
    return;
  }

  const folder = findFolderInTree(KB_MANAGER_STATE.folders, folderId);
  if (!folder) {
    panel.innerHTML = '<p style="color:var(--cw-danger);text-align:center;padding:20px">Error: Carpeta no encontrada</p>';
    return;
  }

  panel.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div>
        <label style="display:block;font-size:11px;font-weight:700;color:var(--cw-primary);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">Nombre *</label>
        <input type="text" id="editFolderName" value="${escapeHtml(folder.name)}" class="input-field" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--cw-border);background:var(--cw-input-bg);font-size:13px">
      </div>

      <div>
        <label style="display:block;font-size:11px;font-weight:700;color:var(--cw-primary);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">Descripción</label>
        <textarea id="editFolderDesc" class="input-field" style="width:100%;height:80px;padding:10px;border-radius:8px;border:1px solid var(--cw-border);background:var(--cw-input-bg);font-family:inherit;resize:vertical;font-size:13px">${escapeHtml(folder.description || '')}</textarea>
      </div>

      <div>
        <label style="display:block;font-size:11px;font-weight:700;color:var(--cw-primary);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">Icono</label>
        <input type="text" id="editFolderIcon" value="${folder.icon || '📁'}" maxlength="2" class="input-field" style="text-align:center;font-size:24px;height:44px;padding:8px;border-radius:8px;border:1px solid var(--cw-border);background:var(--cw-input-bg);width:80px">
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div>
          <label style="display:block;font-size:11px;font-weight:700;color:var(--cw-primary);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">Acceso</label>
          <select id="editFolderAccess" class="input-field" style="padding:10px;width:100%;border-radius:8px;border:1px solid var(--cw-border);background:var(--cw-input-bg);font-size:13px;cursor:pointer">
            <option value="public" ${folder.access_level === 'public' ? 'selected' : ''}>🌐 Público</option>
            <option value="private" ${folder.access_level === 'private' ? 'selected' : ''}>🔒 Privado</option>
            <option value="team" ${folder.access_level === 'team' ? 'selected' : ''}>👥 Equipo</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:11px;font-weight:700;color:var(--cw-primary);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">Tipo</label>
          <select id="editFolderType" class="input-field" style="padding:10px;width:100%;border-radius:8px;border:1px solid var(--cw-border);background:var(--cw-input-bg);font-size:13px;cursor:pointer">
            <option value="standard" ${folder.folder_type === 'standard' ? 'selected' : ''}>📋 Estándar</option>
            <option value="template" ${folder.folder_type === 'template' ? 'selected' : ''}>📌 Plantilla</option>
            <option value="archive" ${folder.folder_type === 'archive' ? 'selected' : ''}>📦 Archivo</option>
          </select>
        </div>
      </div>

      <div id="teamSelectorContainer" style="display:${folder.access_level === 'team' ? 'block' : 'none'}">
        <label style="display:block;font-size:11px;font-weight:700;color:var(--cw-primary);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;margin-top:10px">Equipo Asignado</label>
        <select id="editFolderTeam" class="input-field" style="padding:10px;width:100%;border-radius:8px;border:1px solid var(--cw-border);background:var(--cw-input-bg);font-size:13px;cursor:pointer">
          <option value="">-- Selecciona un equipo --</option>
        </select>
      </div>

      <div style="display:flex;gap:8px;margin-top:16px;padding-top:12px;border-top:1px solid var(--cw-border)">
        <button class="primary kb-save-edit-btn" data-folder-id="${folderId}" style="flex:1;padding:12px;font-weight:600;border-radius:8px;cursor:pointer;font-size:13px">💾 Guardar Cambios</button>
        <button class="secondary kb-share-folder-btn" data-folder-id="${folderId}" style="flex:0.8;padding:12px;font-weight:600;border-radius:8px;cursor:pointer;font-size:13px">🔐 Compartir</button>
        <button class="secondary kb-cancel-edit-btn" style="flex:0.8;padding:12px;font-weight:600;border-radius:8px;cursor:pointer;font-size:13px">❌ Cancelar</button>
        <button class="danger-btn kb-delete-folder-btn" data-folder-id="${folderId}" style="flex:0.5;padding:12px;font-weight:600;border-radius:8px;cursor:pointer;font-size:13px;background:rgba(231,76,60,0.1);color:var(--cw-danger);border:1px solid var(--cw-danger)" title="Eliminar carpeta">🗑️</button>
      </div>

      <div style="padding:12px;background:rgba(41,128,185,0.05);border-radius:8px;border-left:3px solid var(--cw-primary);font-size:12px;color:var(--cw-text-muted)">
        <strong>ℹ️ Tip:</strong> Los cambios se guardarán automáticamente. Los manuales dentro de esta carpeta no se eliminarán.
      </div>
    </div>
  `;

  // Agregar el listener para el cambio de acceso DESPUÉS de renderizar
  setTimeout(() => {
    const accessSelect = document.getElementById('editFolderAccess');
    if (accessSelect) {
      // Remover listener anterior si existe
      accessSelect.removeEventListener('change', handleAccessLevelChange);
      // Agregar nuevo listener
      accessSelect.addEventListener('change', handleAccessLevelChange);
    }
    
    // Cargar equipos si está en modo "team"
    if (folder.access_level === 'team') {
      loadTeamsForSelector('editFolderTeam');
      // Si la carpeta tiene un team_id, seleccionarlo
      if (folder.team_id) {
        const teamSelect = document.getElementById('editFolderTeam');
        if (teamSelect) {
          teamSelect.value = folder.team_id;
        }
      }
    }
  }, 50);
}

// Función separada para manejar el cambio de acceso
async function handleAccessLevelChange(e) {
  const container = document.getElementById('teamSelectorContainer');
  if (!container) return;
  
  if (e.target.value === 'team') {
    container.style.display = 'block';
    // Load teams
    await loadTeamsForSelector('editFolderTeam');
  } else {
    container.style.display = 'none';
  }
}

function clearKBEditPanel() {
  const panel = document.getElementById('kbEditPanel');
  panel.innerHTML = '<p style="color:var(--cw-text-muted);text-align:center;padding:40px 20px;margin:0;font-size:13px">👉 Selecciona una carpeta para editar</p>';
  KB_MANAGER_STATE.selectedFolderId = null;
}

async function deleteKBFolderWithConfirm(folderId) {
  if (!confirm('⚠️ ¿Eliminar esta carpeta y todos sus manuales? Esta acción no se puede deshacer.')) {
    return;
  }

  try {
    const response = await apiCall(`/api/folders/${folderId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error('Error deleting folder');

    showAlert('Carpeta eliminada exitosamente', 'success');
    clearKBEditPanel();
    await loadKBFolderTree();
  } catch (err) {
    console.error('Error:', err);
    showAlert('Error eliminando carpeta', 'error');
  }
}

async function saveKBFolderEdit(folderId) {
  const name = document.getElementById('editFolderName').value.trim();
  const description = document.getElementById('editFolderDesc').value.trim();
  const icon = document.getElementById('editFolderIcon').value.trim();
  const accessLevel = document.getElementById('editFolderAccess').value;
  const folderType = document.getElementById('editFolderType').value;

  if (!name) {
    showAlert('El nombre de la carpeta es obligatorio', 'error');
    return;
  }

  try {
    const accessLevel = document.getElementById('editFolderAccess').value;
    const teamId = accessLevel === 'team' ? document.getElementById('editFolderTeam').value : null;

    const response = await apiCall(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name, 
        description, 
        icon: icon || '📁', 
        color: color || '#3498db',
        accessLevel,
        folderType,
        teamId
      })
    });

    if (!response.ok) throw new Error('Error updating folder');

    showAlert('✅ Carpeta actualizada exitosamente', 'success');
    await loadKBFolderTree();
    updateKBEditPanel(folderId);
  } catch (err) {
    console.error('Error:', err);
    showAlert('❌ Error actualizando carpeta', 'error');
  }
}

// ===== COMPARTIR CARPETA - SISTEMA DE PERMISOS GRANULARES =====

async function openShareFolderModal(folderId) {
  // Verificar permisos
  const folder = findFolderInTree(KB_MANAGER_STATE.folders, folderId);
  const isOwnFolder = folder && (folder.created_by === STATE.authUser?.id || folder.created_by === STATE.authUser?.username);
  
  if (!canShareFolder(isOwnFolder)) {
    showAlert('❌ No tienes permisos', 'No puedes compartir esta carpeta');
    return;
  }

  // Crear modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.zIndex = '2000';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px; max-height: 90vh; display: flex; flex-direction: column;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--cw-border); padding: 24px;">
        <h3 style="margin: 0; color: var(--cw-text);">🔐 Compartir Carpeta</h3>
        <button class="close" aria-label="Cerrar" style="background: transparent; border: none; font-size: 20px; cursor: pointer; color: var(--cw-text-muted);">✕</button>
      </div>
      
      <div style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 24px;">
        <!-- Nivel de Acceso -->
        <div style="border: 1px solid var(--cw-border); border-radius: 12px; padding: 16px;">
          <label style="display: block; font-weight: 700; color: var(--cw-text); margin-bottom: 12px; font-size: 14px;">🔐 Nivel de Acceso Público</label>
          <select id="folderAccessLevel" style="width: 100%; padding: 10px; border: 1px solid var(--cw-border); border-radius: 6px; background: var(--cw-bg); color: var(--cw-text); cursor: pointer; font-size: 13px;">
            <option value="private">🔒 Privada - Solo tú la puedes ver</option>
            <option value="team">👥 Equipo - Tu equipo puede verla</option>
            <option value="public">🌐 Pública - Todos pueden verla</option>
          </select>
          <small style="display: block; color: var(--cw-text-muted); margin-top: 8px; font-size: 12px;">
            📝 <strong>Privada</strong>: Solo el propietario. <strong>Equipo</strong>: Miembros de tu equipo. <strong>Pública</strong>: Todos los usuarios.
          </small>
        </div>

        <!-- Compartir con Usuarios Específicos -->
        <div style="border: 1px solid var(--cw-border); border-radius: 12px; padding: 16px;">
          <label style="display: block; font-weight: 700; color: var(--cw-text); margin-bottom: 12px; font-size: 14px;">👤 Compartir con Usuarios</label>
          
          <!-- Agregar Usuario -->
          <div style="display: flex; gap: 8px; margin-bottom: 16px;">
            <select id="userSelectShare" style="flex: 1; padding: 10px; border: 1px solid var(--cw-border); border-radius: 6px; background: var(--cw-bg); color: var(--cw-text); cursor: pointer; font-size: 13px;">
              <option value="">Selecciona un usuario...</option>
            </select>
            <select id="permissionSelectShare" style="flex: 0.8; padding: 10px; border: 1px solid var(--cw-border); border-radius: 6px; background: var(--cw-bg); color: var(--cw-text); cursor: pointer; font-size: 13px;">
              <option value="view">👁️ Ver</option>
              <option value="edit">✏️ Editar</option>
            </select>
            <button id="addUserShareBtn" style="padding: 10px 16px; background: var(--cw-primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;">Agregar</button>
          </div>

          <!-- Lista de Usuarios Compartidos -->
          <div id="sharedUsersList" style="display: flex; flex-direction: column; gap: 8px;">
            <p style="color: var(--cw-text-muted); font-size: 13px; margin: 0;">Cargando usuarios compartidos...</p>
          </div>
        </div>
      </div>

      <!-- Acciones -->
      <div style="border-top: 1px solid var(--cw-border); padding: 16px 24px; display: flex; gap: 8px; justify-content: flex-end;">
        <button id="closeFolderShareBtn" class="secondary" style="padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">Cerrar</button>
        <button id="saveFolderShareBtn" class="primary" style="padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">💾 Guardar Cambios</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Event listeners
  modal.querySelector('.close').addEventListener('click', () => modal.remove());
  document.getElementById('closeFolderShareBtn').addEventListener('click', () => modal.remove());
  
  document.getElementById('saveFolderShareBtn').addEventListener('click', async () => {
    const accessLevel = document.getElementById('folderAccessLevel').value;
    await updateFolderAccess(folderId, accessLevel);
    modal.remove();
  });

  document.getElementById('addUserShareBtn').addEventListener('click', async () => {
    const userId = document.getElementById('userSelectShare').value;
    const permission = document.getElementById('permissionSelectShare').value;
    if (userId) {
      await addFolderShare(folderId, userId, permission);
      loadSharedFolderUsers(folderId);
    }
  });

  // Cargar usuarios disponibles y compartidos
  try {
    const response = await fetch(apiUrl('/users'));
    const users = await response.json();
    const userSelect = document.getElementById('userSelectShare');
    users.data?.forEach(user => {
      if (user.id !== STATE.authUser?.id) {
        const opt = document.createElement('option');
        opt.value = user.id;
        opt.textContent = `${user.name || user.username}`;
        userSelect.appendChild(opt);
      }
    });
  } catch (err) {
    console.error('Error cargando usuarios:', err);
  }

  // Cargar usuarios compartidos
  loadSharedFolderUsers(folderId);
}

async function loadSharedFolderUsers(folderId) {
  try {
    const response = await fetch(apiUrl(`/folders/${folderId}/shared-users`));
    const result = await response.json();
    const sharedUsers = result.data || [];
    
    const list = document.getElementById('sharedUsersList');
    if (!list) return;

    if (sharedUsers.length === 0) {
      list.innerHTML = '<p style="color: var(--cw-text-muted); font-size: 13px; margin: 0;">No hay usuarios compartidos todavía</p>';
      return;
    }

    list.innerHTML = sharedUsers.map(share => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--cw-surface); border-radius: 6px; border: 1px solid var(--cw-border);">
        <div>
          <span style="font-weight: 600; color: var(--cw-text); font-size: 13px;">${escapeHtml(share.user_name || share.user_id)}</span>
          <span style="margin-left: 8px; padding: 2px 8px; background: var(--cw-primary); color: white; border-radius: 4px; font-size: 11px; font-weight: 600;">${share.permission_level === 'editor' ? '✏️ Editar' : '👁️ Ver'}</span>
        </div>
        <button class="remove-share-btn" data-share-id="${share.id}" style="padding: 4px 8px; background: transparent; color: var(--cw-danger); border: 1px solid var(--cw-danger); border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">Remover</button>
      </div>
    `).join('');

    // Agregar eventos para remover
    document.querySelectorAll('.remove-share-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const shareId = btn.dataset.shareId;
        await removeFolderShare(folderId, shareId);
        loadSharedFolderUsers(folderId);
      });
    });
  } catch (err) {
    console.error('Error cargando usuarios compartidos:', err);
  }
}

async function updateFolderAccess(folderId, accessLevel) {
  try {
    const response = await fetch(apiUrl(`/folders/${folderId}/permissions`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_level: accessLevel })
    });

    if (response.ok) {
      showAlert('✅ Éxito', `Carpeta ahora es ${accessLevel === 'public' ? '🌐 Pública' : accessLevel === 'team' ? '👥 de Equipo' : '🔒 Privada'}`);
      await loadKBFolderTree();
    }
  } catch (err) {
    showAlert('❌ Error', 'No se pudo actualizar el nivel de acceso');
    console.error('Error:', err);
  }
}

async function addFolderShare(folderId, userId, permission) {
  try {
    const response = await fetch(apiUrl(`/folders/${folderId}/share`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, permission_level: permission === 'edit' ? 'editor' : 'viewer' })
    });

    if (response.ok) {
      showAlert('✅ Éxito', 'Carpeta compartida correctamente');
    }
  } catch (err) {
    showAlert('❌ Error', 'No se pudo compartir la carpeta');
    console.error('Error:', err);
  }
}

async function removeFolderShare(folderId, shareId) {
  try {
    const response = await fetch(apiUrl(`/folders/${folderId}/share/${shareId}`), {
      method: 'DELETE'
    });

    if (response.ok) {
      showAlert('✅ Acceso removido', 'El usuario ya no tiene acceso');
    }
  } catch (err) {
    showAlert('❌ Error', 'No se pudo remover el acceso');
    console.error('Error:', err);
  }
}

async function applyFolderTemplate(template) {
  const templates = {
    default: [
      { name: 'General', icon: '📌', desc: 'Contenido general y documentación' },
      { name: 'Procedimientos', icon: '📋', desc: 'Procedimientos paso a paso' },
      { name: 'Troubleshooting', icon: '🔧', desc: 'Solución de problemas' }
    ],
    it: [
      { name: 'Hardware', icon: '🖥️', desc: 'Componentes y equipos' },
      { name: 'Software', icon: '💾', desc: 'Sistemas y aplicaciones' },
      { name: 'Redes', icon: '🌐', desc: 'Configuración de red' }
    ],
    internet: [
      { name: 'GPON', icon: '📡', desc: 'Internet de fibra óptica' },
      { name: 'Conectividad', icon: '🔌', desc: 'Conexión y acceso' },
      { name: 'Configuración', icon: '⚙️', desc: 'Parámetros y ajustes' }
    ],
    tv: [
      { name: 'Video', icon: '📺', desc: 'Transmisión de video' },
      { name: 'Canales', icon: '📻', desc: 'Canales y programación' },
      { name: 'Streaming', icon: '▶️', desc: 'Servicios de streaming' }
    ],
    phone: [
      { name: 'VoIP', icon: '☎️', desc: 'Telefonía sobre IP' },
      { name: 'Configuración', icon: '⚙️', desc: 'Configuración de telefonía' },
      { name: 'Troubleshooting', icon: '🔧', desc: 'Resolución de problemas' }
    ],
    support: [
      { name: 'FAQs', icon: '❓', desc: 'Preguntas frecuentes' },
      { name: 'Troubleshooting', icon: '🔧', desc: 'Solución de problemas' },
      { name: 'Tickets', icon: '🎫', desc: 'Gestión de tickets' }
    ]
  };

  const templateName = template.charAt(0).toUpperCase() + template.slice(1);
  const folderStructure = templates[template] || templates.default;

  // Show confirmation dialog - SAFE VERSION
  const confirmDialog = document.createElement('div');
  confirmDialog.id = `kb-template-dialog-${Date.now()}`; // Unique ID for safe removal
  confirmDialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 10002;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const dialogId = confirmDialog.id;
  confirmDialog.innerHTML = `
    <div style="background:var(--cw-surface);border-radius:12px;padding:24px;width:90%;max-width:500px;box-shadow:0 8px 24px rgba(0,0,0,0.2)">
      <h4 style="margin:0 0 16px 0;font-size:16px;font-weight:700">📋 Aplicar Plantilla: ${templateName}</h4>
      <p style="margin:0 0 16px 0;color:var(--cw-text-muted);font-size:13px">Se crearán las siguientes carpetas:</p>
      <div style="background:var(--cw-input-bg);border-radius:8px;padding:12px;margin-bottom:16px">
        ${folderStructure.map(f => `<div style="padding:6px;font-size:12px;border-bottom:1px solid var(--cw-border)"><strong>${f.icon} ${f.name}</strong><br><small style="color:var(--cw-text-muted)">${f.desc}</small></div>`).join('')}
      </div>
      <div style="display:flex;gap:8px">
        <button class="primary template-apply-btn" data-template="${template}" data-dialog-id="${dialogId}" style="flex:1;padding:12px;border-radius:8px;cursor:pointer;font-weight:600">✅ Aplicar Plantilla</button>
        <button class="secondary template-cancel-btn" data-dialog-id="${dialogId}" style="flex:1;padding:12px;border-radius:8px;cursor:pointer;font-weight:600">❌ Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(confirmDialog);
  
  // Add event listeners for template dialog buttons
  setTimeout(() => {
    const applyBtn = confirmDialog.querySelector('.template-apply-btn');
    const cancelBtn = confirmDialog.querySelector('.template-cancel-btn');
    
    if (applyBtn) {
      applyBtn.addEventListener('click', async () => {
        await confirmTemplateApplication(applyBtn.dataset.template);
        const dlg = document.getElementById(applyBtn.dataset.dialogId);
        if (dlg) dlg.remove();
      });
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        const dlg = document.getElementById(cancelBtn.dataset.dialogId);
        if (dlg) dlg.remove();
      });
    }
  }, 50);
}

async function confirmTemplateApplication(template) {
  const templates = {
    default: [
      { name: 'General', icon: '📌', desc: 'Contenido general y documentación' },
      { name: 'Procedimientos', icon: '📋', desc: 'Procedimientos paso a paso' },
      { name: 'Troubleshooting', icon: '🔧', desc: 'Solución de problemas' }
    ],
    it: [
      { name: 'Hardware', icon: '🖥️', desc: 'Componentes y equipos' },
      { name: 'Software', icon: '💾', desc: 'Sistemas y aplicaciones' },
      { name: 'Redes', icon: '🌐', desc: 'Configuración de red' }
    ],
    internet: [
      { name: 'GPON', icon: '📡', desc: 'Internet de fibra óptica' },
      { name: 'Conectividad', icon: '🔌', desc: 'Conexión y acceso' },
      { name: 'Configuración', icon: '⚙️', desc: 'Parámetros y ajustes' }
    ],
    tv: [
      { name: 'Video', icon: '📺', desc: 'Transmisión de video' },
      { name: 'Canales', icon: '📻', desc: 'Canales y programación' },
      { name: 'Streaming', icon: '▶️', desc: 'Servicios de streaming' }
    ],
    phone: [
      { name: 'VoIP', icon: '☎️', desc: 'Telefonía sobre IP' },
      { name: 'Configuración', icon: '⚙️', desc: 'Configuración de telefonía' },
      { name: 'Troubleshooting', icon: '🔧', desc: 'Resolución de problemas' }
    ],
    support: [
      { name: 'FAQs', icon: '❓', desc: 'Preguntas frecuentes' },
      { name: 'Troubleshooting', icon: '🔧', desc: 'Solución de problemas' },
      { name: 'Tickets', icon: '🎫', desc: 'Gestión de tickets' }
    ]
  };

  const templateName = template.charAt(0).toUpperCase() + template.slice(1);
  const folderStructure = templates[template] || templates.default;
  let createdCount = 0;
  let errorCount = 0;

  for (const folder of folderStructure) {
    try {
      await apiCall('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getCurrentUserId(),
          name: folder.name,
          description: folder.desc,
          icon: folder.icon,
          color: '#3498db',
          folderType: 'standard',
          accessLevel: 'public'
        })
      });
      createdCount++;
    } catch (err) {
      console.error(`Error creating template folder ${folder.name}:`, err);
      errorCount++;
    }
  }

  if (errorCount === 0) {
    showAlert(`✅ Plantilla "${templateName}" aplicada exitosamente. Se crearon ${createdCount} carpetas.`, 'success');
  } else {
    showAlert(`⚠️ Se crearon ${createdCount} carpetas. ${errorCount} tuvieron error.`, 'warning');
  }
  
  await loadKBFolderTree();
}

// ============================================
// BÚSQUEDA AVANZADA
// ============================================
async function setupKBSearch() {
  const searchInput = document.getElementById('kbSearchInput');
  if (!searchInput) return;

  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
      document.getElementById('kbSearchResults').innerHTML = '';
      return;
    }

    searchTimeout = setTimeout(() => performKBSearch(query), 300);
  });
}

async function performKBSearch(query) {
  const resultsContainer = document.getElementById('kbSearchResults');
  resultsContainer.innerHTML = '<div class="kb-loading">Buscando...</div>';

  try {
    const response = await apiCall(`/api/folders/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    const results = data.data || [];

    if (results.length === 0) {
      resultsContainer.innerHTML = '<p style="color:var(--cw-text-muted);padding:12px">No hay resultados</p>';
      return;
    }

    let html = '<div class="kb-search-results">';
    results.forEach(item => {
      if (item.type === 'folder') {
        html += `
          <div class="kb-search-result kb-folder-result" data-folder-id="${item.id}">
            <span class="kb-result-icon">${item.icon || '📁'}</span>
            <div class="kb-result-content">
              <div class="kb-result-title">${escapeHtml(item.name)}</div>
              <div class="kb-result-desc">${item.description || ''}</div>
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="kb-search-result kb-manual-result" data-manual-id="${item.id}">
            <span class="kb-result-icon">📄</span>
            <div class="kb-result-content">
              <div class="kb-result-title">${escapeHtml(item.title)}</div>
              <div class="kb-result-desc">En: ${escapeHtml(item.folderName || 'Sin carpeta')}</div>
            </div>
          </div>
        `;
      }
    });
    html += '</div>';
    resultsContainer.innerHTML = html;
    
    // Add event listeners for search results
    setTimeout(() => {
      const folderResults = resultsContainer.querySelectorAll('.kb-folder-result');
      folderResults.forEach(result => {
        result.addEventListener('click', () => {
          selectKBFolder(result.dataset.folderId);
        });
      });
      
      const manualResults = resultsContainer.querySelectorAll('.kb-manual-result');
      manualResults.forEach(result => {
        result.addEventListener('click', () => {
          selectManual(result.dataset.manualId);
        });
      });
    }, 50);
  } catch (err) {
    console.error('Error in KB search:', err);
    resultsContainer.innerHTML = '<p style="color:var(--cw-danger);padding:12px">Error en búsqueda</p>';
  }
}

// ============================================
// BREADCRUMB NAVIGATION
// ============================================
function updateKBBreadcrumb() {
  const breadcrumb = document.getElementById('kbBreadcrumb');
  if (!breadcrumb) return;

  const folderId = KB_MANAGER_STATE.selectedFolderId;
  if (!folderId) {
    breadcrumb.innerHTML = '<span class="kb-breadcrumb-item">Inicio</span>';
    return;
  }

  const folder = findFolderInTree(KB_MANAGER_STATE.folders, folderId);
  const path = getBreadcrumbPath(folder);

  let html = '<span class="kb-breadcrumb-item kb-breadcrumb-home" style="cursor:pointer">Inicio</span>';
  path.forEach((f, i) => {
    html += ` / <span class="kb-breadcrumb-item kb-breadcrumb-folder" data-folder-id="${f.id}" style="cursor:pointer">${escapeHtml(f.name)}</span>`;
  });

  breadcrumb.innerHTML = html;
  
  // Add event listeners for breadcrumb items
  setTimeout(() => {
    const homeBtn = breadcrumb.querySelector('.kb-breadcrumb-home');
    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        selectKBFolder(null);
      });
    }
    
    const folderBtns = breadcrumb.querySelectorAll('.kb-breadcrumb-folder');
    folderBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        selectKBFolder(btn.dataset.folderId);
      });
    });
  }, 50);
}

function getBreadcrumbPath(folder, path = []) {
  if (!folder) return path;
  path.unshift(folder);
  
  if (folder.parent_id) {
    const parent = findFolderInTree(KB_MANAGER_STATE.folders, folder.parent_id);
    return getBreadcrumbPath(parent, path);
  }
  return path;
}

// ============================================
// DRAG & DROP FOR MANUALS
// ============================================
function setupKBDragDrop() {
  const manualItems = document.querySelectorAll('.kb-manual-item');
  const folderTree = document.getElementById('kbFolderTree');

  manualItems.forEach(item => {
    item.draggable = true;
    item.addEventListener('dragstart', handleKBDragStart);
    item.addEventListener('dragend', handleKBDragEnd);
  });

  // Make folder items droppable
  folderTree?.addEventListener('dragover', handleKBDragOver);
  folderTree?.addEventListener('drop', handleKBDrop);
  folderTree?.addEventListener('dragleave', handleKBDragLeave);
}

function handleKBDragStart(e) {
  const manualId = e.currentTarget.dataset.manualId;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('manualId', manualId);
  e.currentTarget.classList.add('dragging');
}

function handleKBDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
}

function handleKBDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}

function handleKBDragLeave(e) {
  if (e.currentTarget === e.target) {
    e.currentTarget.classList.remove('drag-over');
  }
}

async function handleKBDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');

  const manualId = e.dataTransfer.getData('manualId');
  const targetFolderId = KB_MANAGER_STATE.selectedFolderId;

  if (!targetFolderId) {
    showAlert('Selecciona una carpeta destino', 'error');
    return;
  }

  try {
    const response = await apiCall(`/api/manuals/${manualId}/move-to-folder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder_id: targetFolderId })
    });

    if (!response.ok) throw new Error('Error moving manual');

    showAlert('Manual movido exitosamente', 'success');
    await updateKBFolderManuals(targetFolderId);
  } catch (err) {
    console.error('Error:', err);
    showAlert('Error moviendo manual', 'error');
  }
}

// ============================================
// INLINE EDITING
// ============================================
async function enableKBInlineEdit(element, folderId, fieldType) {
  const folder = findFolderInTree(KB_MANAGER_STATE.folders, folderId);
  if (!folder) return;

  const currentValue = fieldType === 'name' ? folder.name : folder.description;
  const isTextarea = fieldType === 'description';

  const input = document.createElement(isTextarea ? 'textarea' : 'input');
  input.type = 'text';
  input.className = 'input-field';
  input.value = currentValue;
  input.style.width = '100%';
  input.style.margin = '0';

  const saveBtn = document.createElement('button');
  saveBtn.textContent = '✓';
  saveBtn.className = 'primary kb-inline-save-btn';
  saveBtn.style.padding = '4px 8px';
  saveBtn.dataset.folderId = folderId;
  saveBtn.dataset.fieldType = fieldType;

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '✕';
  cancelBtn.className = 'secondary kb-inline-cancel-btn';
  cancelBtn.style.padding = '4px 8px';
  cancelBtn.style.marginLeft = '4px';

  // Add event listeners
  saveBtn.addEventListener('click', () => {
    saveKBInlineEdit(folderId, fieldType, input.value);
  });
  
  cancelBtn.addEventListener('click', () => {
    element.replaceWith(element.cloneNode(true));
    attachKBTreeListeners();
  });

  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.gap = '4px';
  wrapper.appendChild(input);
  wrapper.appendChild(saveBtn);
  wrapper.appendChild(cancelBtn);

  element.replaceWith(wrapper);
  input.focus();
}

async function saveKBInlineEdit(folderId, fieldType, value) {
  try {
    const updateData = {};
    updateData[fieldType] = value;

    const response = await apiCall(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) throw new Error('Error saving');

    showAlert('Cambio guardado', 'success');
    await loadKBFolderTree();
    selectKBFolder(folderId);
  } catch (err) {
    console.error('Error:', err);
    showAlert('Error guardando cambio', 'error');
  }
}

// ============================================
// PERMISSIONS & SHARING
// ============================================
async function loadKBPermissions(folderId) {
  const container = document.getElementById('kbPermissionsPanel');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:20px"><span style="animation:spin 1s linear infinite;display:inline-block">⏳</span> Cargando permisos...</div>';

  try {
    const response = await apiCall(`/api/folders/${folderId}/permissions`);
    const data = await response.json();
    const permissions = data.data || {};

    const folder = findFolderInTree(KB_MANAGER_STATE.folders, folderId);
    if (!folder) {
      container.innerHTML = '<p style="color:var(--cw-danger);text-align:center;padding:20px">Error: Carpeta no encontrada</p>';
      return;
    }

    let html = `
      <div style="display:flex;flex-direction:column;gap:16px">
        <!-- Current Folder Info -->
        <div style="padding:12px;background:rgba(52,152,219,0.05);border-radius:8px;border-left:3px solid var(--cw-primary)">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px">${folder.icon} ${escapeHtml(folder.name)}</div>
          <small style="color:var(--cw-text-muted);font-size:11px">${escapeHtml(folder.description || 'Sin descripción')}</small>
        </div>

        <!-- Access Level Selection -->
        <div>
          <label style="display:block;font-size:11px;font-weight:700;color:var(--cw-primary);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">🔐 Nivel de Acceso</label>
          <div style="display:flex;flex-direction:column;gap:8px">
            <label class="kb-access-label" data-access="public" style="display:flex;align-items:center;padding:10px;border:1px solid var(--cw-border);border-radius:8px;cursor:pointer;transition:all 0.2s;background:${permissions.access_level === 'public' ? 'rgba(52,152,219,0.05)' : 'transparent'}">
              <input type="radio" name="access" value="public" class="kb-access-radio" ${permissions.access_level === 'public' ? 'checked' : ''} data-folder-id="${folderId}" data-access-level="public" style="margin-right:8px;cursor:pointer">
              <div>
                <div style="font-weight:600;font-size:12px">🌐 Público</div>
                <small style="color:var(--cw-text-muted);font-size:11px">Todos los usuarios pueden ver y descargar</small>
              </div>
            </label>
            <label class="kb-access-label" data-access="team" style="display:flex;align-items:center;padding:10px;border:1px solid var(--cw-border);border-radius:8px;cursor:pointer;transition:all 0.2s;background:${permissions.access_level === 'team' ? 'rgba(46,204,113,0.05)' : 'transparent'}">
              <input type="radio" name="access" value="team" class="kb-access-radio" ${permissions.access_level === 'team' ? 'checked' : ''} data-folder-id="${folderId}" data-access-level="team" style="margin-right:8px;cursor:pointer">
              <div>
                <div style="font-weight:600;font-size:12px">👥 Equipo</div>
                <small style="color:var(--cw-text-muted);font-size:11px">Solo usuarios del equipo</small>
              </div>
            </label>
            <label class="kb-access-label" data-access="private" style="display:flex;align-items:center;padding:10px;border:1px solid var(--cw-border);border-radius:8px;cursor:pointer;transition:all 0.2s;background:${permissions.access_level === 'private' ? 'rgba(231,76,60,0.05)' : 'transparent'}">
              <input type="radio" name="access" value="private" class="kb-access-radio" ${permissions.access_level === 'private' ? 'checked' : ''} data-folder-id="${folderId}" data-access-level="private" style="margin-right:8px;cursor:pointer">
              <div>
                <div style="font-weight:600;font-size:12px">🔒 Privado</div>
                <small style="color:var(--cw-text-muted);font-size:11px">Solo el propietario</small>
              </div>
            </label>
          </div>
        </div>

        <!-- Team Selector - appears when access_level is 'team' -->
        <div id="kbPermissionsTeamSelector" style="display:${permissions.access_level === 'team' ? 'block' : 'none'};padding:12px;background:rgba(46,204,113,0.05);border-radius:8px;border-left:3px solid #2ecc71">
          <label style="display:block;font-size:11px;font-weight:700;color:var(--cw-primary);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">👥 Equipo Asignado</label>
          <select id="kbPermissionsTeamSelect" class="input-field" style="padding:10px;width:100%;border-radius:8px;border:1px solid var(--cw-border);background:var(--cw-input-bg);font-size:13px;cursor:pointer">
            <option value="">-- Selecciona un equipo --</option>
          </select>
          <small style="display:block;color:var(--cw-text-muted);margin-top:8px;font-size:11px">Solo los miembros del equipo seleccionado podrán acceder a esta carpeta.</small>
        </div>

        <!-- Share with Users -->
        <div style="padding-top:12px;border-top:1px solid var(--cw-border)">
          <label style="display:block;font-size:11px;font-weight:700;color:var(--cw-primary);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">👥 Compartir con Usuarios</label>
          <div style="display:flex;gap:8px;margin-bottom:10px">
            <input type="email" id="shareEmail" placeholder="correo@example.com" class="input-field" style="flex:1;padding:10px;border-radius:8px;border:1px solid var(--cw-border);background:var(--cw-input-bg);font-size:13px">
            <select id="shareRole" class="input-field" style="padding:10px;border-radius:8px;border:1px solid var(--cw-border);background:var(--cw-input-bg);font-size:13px;cursor:pointer">
              <option value="viewer">👁️ Ver - Solo lectura</option>
              <option value="editor">✏️ Editar - Modificar contenido</option>
              <option value="admin">⚙️ Admin - Control total</option>
            </select>
            <button class="primary kb-share-folder-btn" data-folder-id="${folderId}" style="padding:10px 14px;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px">Compartir</button>
          </div>
          <p style="font-size:11px;color:var(--cw-text-muted);margin:0">Ingresa el correo del usuario para compartir esta carpeta</p>
        </div>

        <!-- Shared Users List -->
        <div id="kbSharedUsersList" style="padding-top:12px;border-top:1px solid var(--cw-border)">
          <!-- Will be populated by loadKBSharedUsers() -->
        </div>
      </div>
    `;

    container.innerHTML = html;
    loadKBSharedUsers(folderId);
    
    // Add event listeners
    setTimeout(() => {
      // Listener para cambios de nivel de acceso
      const accessRadios = container.querySelectorAll('.kb-access-radio');
      accessRadios.forEach(radio => {
        radio.addEventListener('change', async (e) => {
          const teamSelector = container.querySelector('#kbPermissionsTeamSelector');
          const newAccessLevel = e.target.value;
          
          if (newAccessLevel === 'team') {
            if (teamSelector) teamSelector.style.display = 'block';
            await loadTeamsForSelector('kbPermissionsTeamSelect');
          } else {
            if (teamSelector) teamSelector.style.display = 'none';
          }
          
          // Guardar el cambio
          await updateKBFolderAccessLevel(folderId, newAccessLevel);
        });
      });
      
      // Cargar equipos si ya está en modo "team"
      if (permissions.access_level === 'team') {
        loadTeamsForSelector('kbPermissionsTeamSelect');
      }
      
      // Listener para el botón de compartir
      const shareBtn = container.querySelector('.kb-share-folder-btn');
      if (shareBtn) {
        shareBtn.addEventListener('click', () => {
          shareKBFolder(shareBtn.dataset.folderId);
        });
      }
    }, 50);
  } catch (err) {
    console.error('Error loading permissions:', err);
    container.innerHTML = '<p style="color:var(--cw-danger);text-align:center;padding:20px">❌ Error cargando permisos</p>';
  }
}

// Nueva función para actualizar el nivel de acceso y el equipo
async function updateKBFolderAccessLevel(folderId, accessLevel) {
  try {
    let body = { accessLevel };
    
    // Si es equipo, obtener el team_id seleccionado
    if (accessLevel === 'team') {
      const teamSelect = document.getElementById('kbPermissionsTeamSelect');
      if (teamSelect && teamSelect.value) {
        body.teamId = teamSelect.value;
      }
    }
    
    const response = await fetch(apiUrl(`/api/folders/${folderId}`), {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error('Error updating access');

    showAlert('✅ Nivel de acceso actualizado', 'success');
    await loadKBFolderTree();
  } catch (err) {
    console.error('Error:', err);
    showAlert('❌ Error actualizando acceso', 'error');
  }
}

async function loadKBSharedUsers(folderId) {
  const container = document.getElementById('kbSharedUsersList');
  if (!container) return;

  try {
    const response = await apiCall(`/api/folders/${folderId}/shared-users`);
    const data = await response.json();
    const users = data.data || [];

    if (users.length === 0) {
      container.innerHTML = '<p style="font-size:12px;color:var(--cw-text-muted);text-align:center;padding:10px;margin:0;grid-column:1/-1">Sin usuarios compartidos</p>';
      return;
    }

    // PROFESIONAL: UI mejorada con opciones de acceso y detalles
    let html = `
      <div>
        <h6 style="margin:0 0 12px 0;font-size:12px;font-weight:700;color:var(--cw-primary);text-transform:uppercase;letter-spacing:0.5px">👥 Usuarios con Acceso</h6>
        <div style="display:flex;flex-direction:column;gap:8px">
    `;

    users.forEach(user => {
      const accessLevel = user.access_level || 'viewer';
      const accessLabel = getAccessLevelLabel(accessLevel);
      const dateCreated = new Date(user.created_at).toLocaleDateString('es-ES');
      
      html += `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:var(--cw-surface-dark);border-radius:6px;border-left:3px solid var(--cw-primary);font-size:12px;gap:12px">
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;margin-bottom:2px">${escapeHtml(user.email)}</div>
            <div style="font-size:11px;color:var(--cw-text-muted)">
              ${user.name ? `${escapeHtml(user.name)} • ` : ''}Compartido ${dateCreated}
            </div>
          </div>
          <div style="display:flex;gap:6px;align-items:center">
            <select class="kb-access-level-select input-field" data-folder-id="${folderId}" data-user-id="${user.user_id}" style="padding:6px;border-radius:4px;border:1px solid var(--cw-border);background:var(--cw-input-bg);font-size:11px;cursor:pointer">
              <option value="viewer" ${accessLevel === 'viewer' ? 'selected' : ''}>👁️ Ver</option>
              <option value="editor" ${accessLevel === 'editor' ? 'selected' : ''}>✏️ Editar</option>
              <option value="admin" ${accessLevel === 'admin' ? 'selected' : ''}>⚙️ Admin</option>
            </select>
            <button class="mini-btn kb-revoke-access-btn" data-folder-id="${folderId}" data-user-id="${user.user_id}" style="padding:6px 8px;font-size:11px;cursor:pointer;color:var(--cw-danger);background:rgba(231,76,60,0.1);border:1px solid var(--cw-danger)" title="Revocar acceso">✕</button>
          </div>
        </div>
      `;
    });

    html += '</div></div>';
    
    container.innerHTML = html;
    
    // Add event listeners
    setTimeout(() => {
      // Revocar acceso
      const revokeButtons = container.querySelectorAll('.kb-revoke-access-btn');
      revokeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          revokeKBFolderAccess(btn.dataset.folderId, btn.dataset.userId);
        });
      });
      
      // Cambiar nivel de acceso
      const accessSelects = container.querySelectorAll('.kb-access-level-select');
      accessSelects.forEach(select => {
        select.addEventListener('change', (e) => {
          updateKBUserAccessLevel(e.target.dataset.folderId, e.target.dataset.userId, e.target.value);
        });
      });
    }, 50);
    
  } catch (err) {
    console.error('Error loading shared users:', err);
    container.innerHTML = '<p style="font-size:12px;color:var(--cw-danger);text-align:center;padding:10px">❌ Error cargando usuarios</p>';
  }
}

// PROFESIONAL: Nueva función para actualizar nivel de acceso de usuario compartido
async function updateKBUserAccessLevel(folderId, userId, newAccessLevel) {
  try {
    const response = await apiCall(`/api/folders/${folderId}/access`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: parseInt(userId), access_level: newAccessLevel })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error updating access');
    }

    showAlert(`✅ Nivel de acceso actualizado a ${getAccessLevelLabel(newAccessLevel)}`, 'success');
  } catch (err) {
    console.error('Error updating access level:', err);
    showAlert(`❌ Error: ${err.message}`, 'error');
    // Recargar para revertir el cambio
    const folderId = KB_MANAGER_STATE.selectedFolderId;
    if (folderId) await loadKBSharedUsers(folderId);
  }
}

async function updateKBAccess(folderId, accessLevel) {
  try {
    const response = await apiCall(`/api/folders/${folderId}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_level: accessLevel })
    });

    if (!response.ok) throw new Error('Error updating access');

    showAlert('✅ Nivel de acceso actualizado', 'success');
  } catch (err) {
    console.error('Error:', err);
    showAlert('❌ Error actualizando acceso', 'error');
  }
}

async function shareKBFolder(folderId) {
  const email = document.getElementById('shareEmail').value.trim();
  const accessLevel = document.getElementById('shareRole').value; // Cambiar a access_level

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    showAlert('❌ Ingresa un correo válido (ej: usuario@example.com)', 'error');
    return;
  }

  try {
    const response = await apiCall(`/api/folders/${folderId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, access_level: accessLevel })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Error compartiendo');
    }

    showAlert(`✅ Carpeta compartida con ${email} (Acceso: ${getAccessLevelLabel(accessLevel)})`, 'success');
    document.getElementById('shareEmail').value = '';
    await loadKBSharedUsers(folderId);
  } catch (err) {
    console.error('Error:', err);
    showAlert(`❌ Error compartiendo: ${err.message}`, 'error');
  }
}

// Helper function para mostrar etiqueta de nivel de acceso
function getAccessLevelLabel(level) {
  const labels = {
    viewer: '👁️ Ver',
    editor: '✏️ Editar',
    admin: '⚙️ Admin'
  };
  return labels[level] || level;
}

async function revokeKBFolderAccess(folderId, userId) {
  if (!confirm('¿Revocar acceso a este usuario?')) {
    return;
  }

  try {
    const response = await apiCall(`/api/folders/${folderId}/revoke-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });

    if (!response.ok) throw new Error('Error revoking access');

    showAlert('✅ Acceso revocado exitosamente', 'success');
    await loadKBSharedUsers(folderId);
  } catch (err) {
    console.error('Error:', err);
    showAlert('❌ Error revocando acceso', 'error');
  }
}

// ============================================
// BULK OPERATIONS
// ============================================
async function selectMultipleKBManuals() {
  const manuals = document.querySelectorAll('.kb-manual-item');
  const container = document.getElementById('kbFolderManualsPreview');

  if (!container.dataset.bulkMode) {
    container.dataset.bulkMode = 'true';
    manuals.forEach(manual => {
      manual.style.cursor = 'pointer';
      manual.addEventListener('click', toggleKBManualSelection);
    });
    showAlert('Modo selección activado', 'info');
  } else {
    container.dataset.bulkMode = '';
    manuals.forEach(manual => {
      manual.classList.remove('selected');
      manual.style.cursor = 'default';
      manual.removeEventListener('click', toggleKBManualSelection);
    });
    showAlert('Modo selección desactivado', 'info');
  }
}

function toggleKBManualSelection(e) {
  e.currentTarget.classList.toggle('selected');
}

async function moveSelectedKBManuals() {
  const selectedManuals = Array.from(document.querySelectorAll('.kb-manual-item.selected'))
    .map(el => el.dataset.manualId);
  const targetFolderId = KB_MANAGER_STATE.selectedFolderId;

  if (selectedManuals.length === 0) {
    showAlert('Selecciona al menos un manual', 'error');
    return;
  }

  if (!targetFolderId) {
    showAlert('Selecciona una carpeta destino', 'error');
    return;
  }

  try {
    const response = await apiCall(`/api/folders/${targetFolderId}/move-manuals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manual_ids: selectedManuals })
    });

    if (!response.ok) throw new Error('Error moving manuals');

    showAlert(`${selectedManuals.length} manual(es) movido(s)`, 'success');
    await updateKBFolderManuals(targetFolderId);
  } catch (err) {
    console.error('Error:', err);
    showAlert('Error moviendo manuales', 'error');
  }
}

// ============================================
// DELETE FOLDER WITH CONFIRMATION
// ============================================
async function deleteSelectedFolder() {
  const folderId = KB_MANAGER_STATE.selectedFolderId;
  if (!folderId) return;

  const folder = findFolderInTree(KB_MANAGER_STATE.folders, folderId);
  if (!folder) return;

  // Show confirmation dialog
  if (!confirm(`¿Eliminar carpeta "${folder.name}"? Esto no se puede deshacer.`)) {
    return;
  }

  try {
    const response = await apiCall(`/api/folders/${folderId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error('Error deleting folder');

    showAlert('Carpeta eliminada', 'success');
    KB_MANAGER_STATE.selectedFolderId = null;
    await loadKBFolderTree();
    await loadKBStatistics();
  } catch (err) {
    console.error('Error:', err);
    showAlert('Error eliminando carpeta', 'error');
  }
}

async function loadTeamsForSelector(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  try {
    const response = await fetch(apiUrl('/api/teams?limit=100'), {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      console.error('[loadTeamsForSelector] Error response:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const teams = data.data || [];

    // Clear existing options except the first one
    select.innerHTML = '<option value="">-- Selecciona un equipo --</option>';
    
    teams.forEach(team => {
      const option = document.createElement('option');
      option.value = team.id;
      option.textContent = `${team.icon || '👥'} ${team.name}`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('[loadTeamsForSelector] Error loading teams:', err);
    select.innerHTML = '<option value="">Error cargando equipos</option>';
  }
}

function findFolderInTree(folders, id) {
  for (const folder of (folders || [])) {
    if (folder.id === id) return folder;
    const found = findFolderInTree(folder.children, id);
    if (found) return found;
  }
  return null;
}

// ============================================
// CONTEXT MENU FOR FOLDERS
// ============================================
function showKBFolderContextMenu(event, folderId) {
  event.preventDefault();
  event.stopPropagation();

  // Remove previous context menu
  const existingMenu = document.getElementById('kbContextMenu');
  if (existingMenu) existingMenu.remove();

  const folder = findFolderInTree(KB_MANAGER_STATE.folders, folderId);
  if (!folder) return;

  const menu = document.createElement('div');
  menu.id = 'kbContextMenu';
  menu.style.cssText = `
    position: fixed;
    top: ${event.clientY}px;
    left: ${event.clientX}px;
    background: var(--cw-bg);
    border: 1px solid var(--cw-border);
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    min-width: 180px;
  `;

  const options = [
    { label: 'Editar', icon: '✏️', action: 'editSelectedFolder()' },
    { label: 'Duplicar', icon: '📋', action: 'duplicateSelectedFolder()' },
    { label: 'Favorito', icon: folder.is_favorite ? '⭐' : '☆', action: 'toggleFolderFavorite()' },
    { label: 'Permisos', icon: '🔒', action: 'loadKBPermissions("' + folderId + '")' },
    { label: 'Eliminar', icon: '🗑️', action: 'deleteSelectedFolder()', color: 'var(--cw-danger)' }
  ];

  menu.innerHTML = options.map((opt, i) => `
    <div class="kb-context-menu-item" data-action="${opt.action}" style="padding:8px 12px;cursor:pointer;display:flex;align-items:center;gap:8px;border-bottom:${i < options.length - 1 ? '1px solid var(--cw-border)' : 'none'};transition:background 0.2s;color:${opt.color || 'inherit'}">
      <span>${opt.icon}</span>
      <span>${opt.label}</span>
    </div>
  `).join('');

  document.body.appendChild(menu);
  
  // Add event listeners for context menu items
  setTimeout(() => {
    const menuItems = menu.querySelectorAll('.kb-context-menu-item');
    menuItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        item.style.background = 'var(--cw-bg-secondary)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
      });
      item.addEventListener('click', () => {
        eval(item.dataset.action);
        menu.remove();
      });
    });
  }, 50);

  // Close menu on click elsewhere
  document.addEventListener('click', () => {
    menu.remove();
  }, { once: true });
}

// ============================================
// EDIT & DELETE MANUAL FUNCTIONS
// ============================================
async function editKBManual(manualId) {
  try {
    const response = await apiCall(`/api/manuals/${manualId}`);
    const manual = await response.json();

    // Populate the manual editor modal
    document.getElementById('editTitle').value = manual.title || '';
    document.getElementById('editSummary').value = manual.summary || '';
    document.getElementById('editManualPrivate').checked = manual.is_private || false;
    
    // Parse steps/content - can be array or JSON string
    let steps = [];
    if (Array.isArray(manual.content)) {
      steps = manual.content;
    } else if (typeof manual.content === 'string') {
      try {
        steps = JSON.parse(manual.content);
        if (!Array.isArray(steps)) steps = [];
      } catch (e) {
        steps = [];
      }
    }
    if (Array.isArray(manual.steps)) {
      steps = manual.steps;
    }
    
    // Render steps using the existing function
    renderEditorSteps(steps);
    
    // Store manual ID for saving
    document.getElementById('manualEditorModal').dataset.manualId = manualId;
    document.getElementById('manualEditorModal').dataset.folderId = manual.folder_id || '';
    
    // Show modal
    document.getElementById('manualEditorModal').classList.remove('hidden');
    document.getElementById('manualEditorModal').style.display = 'flex';
  } catch (err) {
    console.error('Error:', err);
    showAlert('❌ Error cargando manual', 'error');
  }
}

async function saveKBManualEdit(manualId) {
  try {
    const title = document.getElementById('editTitle').value.trim();
    const summary = document.getElementById('editSummary').value.trim();
    let steps = [];
    
    // Collect steps from editor
    const stepsContainer = document.getElementById('editStepsList');
    if (stepsContainer) {
      const stepRows = stepsContainer.querySelectorAll('div');
      stepRows.forEach(row => {
        const inputs = row.querySelectorAll('input, textarea');
        if (inputs.length >= 2) {
          steps.push({
            title: inputs[0].value || '',
            content: inputs[1].value || ''
          });
        }
      });
    }

    if (!title) {
      showAlert('El título del manual es obligatorio', 'error');
      return;
    }

    const response = await apiCall(`/api/manuals/${manualId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title, 
        summary, 
        steps: steps
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error updating manual');
    }

    showAlert('✅ Manual actualizado exitosamente', 'success');
    
    // Close modal
    const modal = document.getElementById('manualEditorModal');
    modal.classList.add('hidden');
    modal.style.display = 'none';
    
    // Refresh folder manuals
    const folderId = modal.dataset.folderId;
    if (folderId) {
      await updateKBFolderManuals(folderId);
    }
  } catch (err) {
    console.error('Error:', err);
    showAlert('❌ Error guardando manual: ' + err.message, 'error');
  }
}

async function deleteKBManual(manualId) {
  if (!confirm('¿Eliminar este manual? Esta acción no se puede deshacer.')) {
    return;
  }

  try {
    const response = await apiCall(`/api/manuals/${manualId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error('Error deleting manual');

    showAlert('Manual eliminado exitosamente', 'success');
    const folderId = KB_MANAGER_STATE.selectedFolderId;
    if (folderId) {
      await updateKBFolderManuals(folderId);
    }
  } catch (err) {
    console.error('Error:', err);
    showAlert('Error eliminando manual', 'error');
  }
}



// ============================================
// TOGGLE MANUAL FAVORITE
// ============================================
async function toggleManualFavorite(manualId) {
  try {
    const response = await apiCall(`/api/manuals/${manualId}/favorite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFavorite: true })
    });

    if (!response.ok) throw new Error('Error toggling favorite');

    // Refresh the manuals list if needed
    const folderId = KB_MANAGER_STATE.selectedFolderId;
    if (folderId) {
      await updateKBFolderManuals(folderId);
    }
  } catch (err) {
    console.error('Error:', err);
    showAlert('Error actualizando favorito', 'error');
  }
}

// ============================================
// ENHANCED STATISTICS LOADING
// ============================================
async function loadKBStatistics() {
  try {
    const response = await apiCall('/api/folders/tree');
    const data = await response.json();
    const folders = data.data || [];

    // Count totals recursively
    let totalFoldersCount = 0;
    let totalManualsCount = 0;
    let totalSize = 0;
    let totalReviewed = 0;

    function countRecursive(folderArray) {
      for (const folder of (folderArray || [])) {
        totalFoldersCount++;
        totalManualsCount += folder.manual_count || 0;
        totalSize += folder.total_size_kb || 0;
        if (folder.marked_reviewed) totalReviewed++;
        if (folder.children) countRecursive(folder.children);
      }
    }

    countRecursive(folders);

    // Calculate percentages
    const reviewedPercentage = totalManualsCount > 0 ? Math.round((totalReviewed / totalManualsCount) * 100) : 0;

    // Update stat cards using IDs instead of class selector
    const statFolders = document.getElementById('kbStatTotalFolders');
    const statManuals = document.getElementById('kbStatTotalManuals');
    const statSize = document.getElementById('kbStatTotalSize');
    const statReviewed = document.getElementById('kbStatReviewedPercent');

    if (statFolders) statFolders.textContent = totalFoldersCount;
    if (statManuals) statManuals.textContent = totalManualsCount;
    if (statSize) statSize.textContent = (totalSize / 1024).toFixed(2) + ' MB';
    if (statReviewed) statReviewed.textContent = reviewedPercentage + '%';

    // Top folders ranking
    const topFoldersContainer = document.getElementById('kbTopFolders');
    if (topFoldersContainer) {
      const allFolders = [];
      function flattenFolders(folderArray) {
        for (const folder of (folderArray || [])) {
          allFolders.push(folder);
          if (folder.children) flattenFolders(folder.children);
        }
      }
      flattenFolders(folders);

      const topFolders = allFolders
        .filter(f => f.manual_count > 0)
        .sort((a, b) => (b.manual_count || 0) - (a.manual_count || 0))
        .slice(0, 5);

      let html = '<div style="display:flex;flex-direction:column;gap:10px">';
      
      if (topFolders.length === 0) {
        html += '<p style="color:var(--cw-text-muted);text-align:center;padding:20px;margin:0;font-size:12px">Sin manuales aún</p>';
      } else {
        topFolders.forEach((folder, i) => {
          const progressPercent = (folder.manual_count / (topFolders[0]?.manual_count || 1)) * 100;
          html += `
            <div style="padding:10px;background:var(--cw-input-bg);border-radius:8px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <span style="font-weight:600;font-size:12px">
                  <span style="color:var(--cw-primary);margin-right:6px">#${i + 1}</span>
                  ${folder.icon || '📁'} ${escapeHtml(folder.name)}
                </span>
                <span style="font-weight:700;color:var(--cw-primary);font-size:12px">${folder.manual_count || 0}</span>
              </div>
              <div style="width:100%;height:6px;background:var(--cw-border);border-radius:3px;overflow:hidden">
                <div style="height:100%;background:linear-gradient(90deg, var(--cw-primary), var(--cw-accent));width:${progressPercent}%;transition:width 0.3s"></div>
              </div>
            </div>
          `;
        });
      }

      html += '</div>';
      topFoldersContainer.innerHTML = html;
    }

    // Update review percentage progress
    const reviewProgress = document.querySelector('[id="kbStatReviewedPercent"]');
    if (reviewProgress && reviewProgress.parentElement) {
      reviewProgress.parentElement.parentElement.innerHTML = `
        <div style="font-weight:700;font-size:28px;color:rgb(155,89,182);margin-bottom:8px">${reviewedPercentage}%</div>
        <div style="width:100%;height:8px;background:var(--cw-border);border-radius:4px;overflow:hidden">
          <div style="height:100%;background:linear-gradient(90deg, rgb(155,89,182), rgb(155,89,182));width:${reviewedPercentage}%;transition:width 0.3s"></div>
        </div>
      `;
    }
  } catch (err) {
    console.error('Error loading KB statistics:', err);
    const containers = [
      document.getElementById('kbStatTotalFolders'),
      document.getElementById('kbStatTotalManuals'),
      document.getElementById('kbStatTotalSize'),
      document.getElementById('kbStatReviewedPercent'),
      document.getElementById('kbTopFolders')
    ];
    containers.forEach(c => {
      if (c) c.innerHTML = '<p style="color:var(--cw-danger);text-align:center;padding:20px;margin:0;font-size:12px">Error cargando datos</p>';
    });
  }
}

function getCurrentUserId() {
  return JSON.parse(localStorage.getItem('cw_user') || '{}').id || 'system';
}

// ============================================
// API BASE URL
// ============================================
const API_BASE_URL = config.BACKEND_URL;

function apiCall(endpoint, options = {}) {
  return fetch(`${API_BASE_URL}${endpoint}`, options);
}

// Initialize when admin settings are loaded
document.addEventListener('DOMContentLoaded', async () => {
  // SECCIÓN 16: Initialize KB Manager on page load
  console.log('[APP] DOMContentLoaded - Initializing KB Manager...');
  try {
    await initKBManager();
    console.log('[APP] ✓ KB Manager initialized');
  } catch (err) {
    console.error('[APP] Error initializing KB Manager:', err);
  }

  // SECCIÓN 2.6: Global ESC key handler to close all modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Find all open modals and close them
      const openModals = document.querySelectorAll('[role="dialog"], .modal, [data-modal]');
      if (openModals.length > 0) {
        // Remove the most recently added modal (last one)
        const lastModal = openModals[openModals.length - 1];
        lastModal.remove?.();
      }
    }
  });

  // SECCIÓN 2.7: Session timeout monitor (check every 30 seconds)
  // Warn user at 25 minutes, auto-logout at 30 minutes
  let sessionWarningShown = false;
  setInterval(async () => {
    // Only check session if user appears to be authenticated
    if (!STATE.authUser) {
      return;
    }
    
    try {
      const response = await fetch(apiUrl('/session-info'), {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        // Session expired or user not authenticated
        if (STATE.authUser) {
          showToast('Tu sesión ha expirado. Por favor inicia sesión de nuevo.', 'error', 5000);
          STATE.authUser = null;
          localStorage.removeItem('cw:authUser');
          window.location.href = '/';
        }
        return;
      }
      
      const sessionData = await response.json();
      if (!sessionData.authenticated && STATE.authUser) {
        // Session ended
        showToast('Tu sesión ha expirado. Por favor inicia sesión de nuevo.', 'error', 5000);
        STATE.authUser = null;
        localStorage.removeItem('cw:authUser');
        window.location.href = '/';
        return;
      }
      
      // Check if should warn user (at 5 minutes remaining)
      const minutesRemaining = sessionData.remainingMinutes || 0;
      if (minutesRemaining <= 5 && minutesRemaining > 0 && !sessionWarningShown) {
        sessionWarningShown = true;
        showSessionTimeoutWarning(minutesRemaining);
      } else if (minutesRemaining > 5) {
        sessionWarningShown = false;
      }
    } catch (err) {
      console.warn('Session check failed:', err);
    }
  }, 30000); // Check every 30 seconds

  // KB Manager initialization moved to top of DOMContentLoaded
  // No longer using MutationObserver to avoid duplicate loading
});

// ============================================
// EXPORTAR FUNCIONES AL SCOPE GLOBAL
// ============================================
// Necesarias para onclick en HTML dinámico
window.selectKBFolder = selectKBFolder;
window.loadKBFolderTree = loadKBFolderTree;
window.createNewKBFolder = createNewKBFolder;
window.createNewKBTeam = createNewKBTeam;
window.updateKBEditPanel = updateKBEditPanel;
window.clearKBEditPanel = clearKBEditPanel;
window.saveKBFolderEdit = saveKBFolderEdit;
window.deleteKBFolderWithConfirm = deleteKBFolderWithConfirm;
window.deleteSelectedFolder = deleteSelectedFolder;
// ===== CARGAR EQUIPOS =====
async function loadKBTeams() {
  try {
    const container = document.getElementById('kbTeamsList');
    if (!container) return;
    
    container.innerHTML = '<p style="color:var(--cw-text-muted);text-align:center;padding:40px 10px;font-size:12px">Cargando equipos...</p>';
    
    const response = await fetch(apiUrl('/teams'));
    const result = await response.json();
    const teams = result.data || [];
    
    if (teams.length === 0) {
      container.innerHTML = '<p style="color:var(--cw-text-muted);text-align:center;padding:40px 10px;font-size:12px">No hay equipos. Crea uno nuevo para empezar.</p>';
      return;
    }
    
    container.innerHTML = teams.map(team => `
      <div class="kb-team-card" data-team-id="${team.id}" style="padding:12px;background:var(--cw-surface);border:1px solid var(--cw-border);border-radius:8px;cursor:pointer;transition:all 0.2s;display:flex;justify-content:space-between;align-items:center">
        <div style="flex:1">
          <div style="font-weight:600;color:var(--cw-text);font-size:13px">${escapeHtml(team.name)}</div>
          <div style="color:var(--cw-text-muted);font-size:11px;margin-top:4px">${escapeHtml(team.description || 'Sin descripción')}</div>
        </div>
        <div style="margin-left:12px">👥</div>
      </div>
    `).join('');
    
    // Agregar event listeners
    document.querySelectorAll('.kb-team-card').forEach(card => {
      card.addEventListener('click', async () => {
        const teamId = card.dataset.teamId;
        const team = teams.find(t => t.id === teamId);
        showKBTeamDetails(team);
      });
    });
  } catch (err) {
    console.error('Error loading teams:', err);
    const container = document.getElementById('kbTeamsList');
    if (container) {
      container.innerHTML = '<p style="color:var(--cw-danger);text-align:center;padding:40px 10px;font-size:12px">❌ Error cargando equipos</p>';
    }
  }
}

async function showKBTeamDetails(team) {
  const panel = document.getElementById('kbTeamDetailsPanel');
  if (!panel) return;
  
  panel.style.display = 'block';
  document.getElementById('kbTeamDetailTitle').textContent = team.name;
  
  // Store team ID on the invite button for later use
  const inviteBtn = document.getElementById('kbInviteToTeamBtn');
  if (inviteBtn) {
    inviteBtn.dataset.teamId = team.id;
  }
  
  // Load team members
  const membersList = document.getElementById('kbTeamMembersList');
  if (membersList) {
    membersList.innerHTML = '<p style="color:var(--cw-text-muted);font-size:11px">Cargando miembros...</p>';
    
    try {
      const response = await fetch(apiUrl(`/teams/${team.id}/members`));
      const result = await response.json();
      const members = result.data || [];
      
      if (members.length === 0) {
        membersList.innerHTML = '<p style="color:var(--cw-text-muted);font-size:11px">No hay miembros en este equipo.</p>';
        return;
      }
      
      membersList.innerHTML = members.map(member => `
        <div style="padding:10px;background:var(--cw-surface);border:1px solid var(--cw-border);border-radius:6px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:600;color:var(--cw-text);font-size:12px">${escapeHtml(member.user_name)}</div>
            <div style="color:var(--cw-text-muted);font-size:10px;margin-top:2px">📧 ${escapeHtml(member.user_email)}</div>
            <div style="color:var(--cw-text-muted);font-size:10px;margin-top:2px">Rol: ${escapeHtml(member.role)}</div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error('Error loading team members:', err);
      membersList.innerHTML = '<p style="color:var(--cw-danger);font-size:11px">❌ Error cargando miembros</p>';
    }
  }
}

// ===== CARGAR CARPETAS COMPARTIDAS CONMIGO =====
async function loadSharedWithMe() {
  try {
    const container = document.getElementById('kbSharedFoldersList');
    if (!container) return;
    
    container.innerHTML = '<p style="color:var(--cw-text-muted);text-align:center;padding:40px 10px;font-size:12px">Cargando carpetas compartidas...</p>';
    
    const response = await fetch(apiUrl('/folders/shared-with-me'));
    const result = await response.json();
    const sharedFolders = result.data || [];
    
    if (sharedFolders.length === 0) {
      container.innerHTML = '<p style="color:var(--cw-text-muted);text-align:center;padding:40px 10px;font-size:12px">No hay carpetas compartidas contigo.</p>';
      return;
    }
    
    container.innerHTML = sharedFolders.map(share => `
      <div class="kb-shared-folder-card" data-folder-id="${share.folder_id}" style="padding:12px;background:var(--cw-surface);border:1px solid var(--cw-border);border-radius:8px;cursor:pointer;transition:all 0.2s">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="font-size:24px">${share.folder_icon || '📁'}</div>
          <div style="flex:1">
            <div style="font-weight:600;color:var(--cw-text);font-size:13px">${escapeHtml(share.folder_name)}</div>
            <div style="color:var(--cw-text-muted);font-size:11px;margin-top:2px">Compartido por ${escapeHtml(share.shared_by_name)}</div>
            <div style="color:var(--cw-text-muted);font-size:10px;margin-top:4px">
              ${share.permission_level === 'editor' ? '✏️ Puedes editar' : '👁️ Solo lectura'}
            </div>
          </div>
        </div>
      </div>
    `).join('');
    
    // Agregar event listeners
    document.querySelectorAll('.kb-shared-folder-card').forEach(card => {
      card.addEventListener('click', () => {
        const folderId = card.dataset.folderId;
        // TODO: Navegar a la carpeta compartida
      });
    });
  } catch (err) {
    console.error('Error loading shared folders:', err);
    const container = document.getElementById('kbSharedFoldersList');
    if (container) {
      container.innerHTML = '<p style="color:var(--cw-danger);text-align:center;padding:40px 10px;font-size:12px">❌ Error cargando carpetas compartidas</p>';
    }
  }
}

// ===== AGREGAR MIEMBROS AL EQUIPO =====
async function inviteTeamMember() {
  const emailInput = document.getElementById('kbInviteEmail');
  const btn = document.getElementById('kbInviteToTeamBtn');
  
  if (!emailInput || !btn) {
    console.error('[inviteTeamMember] Missing HTML elements');
    return;
  }
  
  const email = emailInput.value.trim();
  const currentTeamId = btn.dataset.teamId;
  
  // Validaciones
  if (!email) {
    showAlert('Error', 'Ingresa un correo electrónico');
    return;
  }
  
  if (!currentTeamId) {
    showAlert('Error', 'No hay equipo seleccionado');
    return;
  }
  
  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showAlert('Error', 'Correo electrónico no válido');
    return;
  }
  
  // Deshabilitar botón durante la petición
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '📧 Enviando...';
  
  try {
    console.log('[inviteTeamMember] Inviting:', email, 'to team:', currentTeamId);
    
    const response = await fetch(apiUrl(`/teams/${currentTeamId}/members`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        role: 'member' // Rol por defecto
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = errorData.error || `Error ${response.status}`;
      
      if (response.status === 404) {
        showAlert('Error', 'El usuario no existe en el sistema');
      } else if (response.status === 409) {
        showAlert('Error', 'Este usuario ya es miembro del equipo');
      } else {
        showAlert('Error', errorMsg);
      }
      return;
    }
    
    const result = await response.json();
    console.log('[inviteTeamMember] ✓ Success:', result);
    
    // Mostrar éxito
    showAlert('✓ Éxito', `Invitación enviada a ${email}. El usuario recibirá un email con los detalles.`);
    
    // Limpiar input
    emailInput.value = '';
    
    // Recargar lista de miembros
    const teamDetailsPanel = document.getElementById('kbTeamDetailsPanel');
    if (teamDetailsPanel && teamDetailsPanel.style.display !== 'none') {
      // Obtener datos del equipo actual
      const teamTitle = document.getElementById('kbTeamDetailTitle');
      if (teamTitle) {
        // Recargar miembros sin cerrar el panel
        const membersList = document.getElementById('kbTeamMembersList');
        if (membersList) {
          membersList.innerHTML = '<p style="color:var(--cw-text-muted);font-size:11px">Cargando miembros...</p>';
          
          try {
            const membersResponse = await fetch(apiUrl(`/teams/${currentTeamId}/members`));
            const membersData = await membersResponse.json();
            const members = membersData.data || [];
            
            if (members.length === 0) {
              membersList.innerHTML = '<p style="color:var(--cw-text-muted);font-size:11px">No hay miembros en este equipo.</p>';
            } else {
              membersList.innerHTML = members.map(member => `
                <div style="padding:10px;background:var(--cw-surface);border:1px solid var(--cw-border);border-radius:6px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
                  <div>
                    <div style="font-weight:600;color:var(--cw-text);font-size:12px">${escapeHtml(member.user_name)}</div>
                    <div style="color:var(--cw-text-muted);font-size:10px;margin-top:2px">📧 ${escapeHtml(member.user_email)}</div>
                    <div style="color:var(--cw-text-muted);font-size:10px;margin-top:2px">Rol: ${escapeHtml(member.role)}</div>
                  </div>
                </div>
              `).join('');
            }
          } catch (err) {
            console.error('[inviteTeamMember] Error reloading members:', err);
          }
        }
      }
    }
    
  } catch (err) {
    console.error('[inviteTeamMember] Error:', err);
    showAlert('Error', `No se pudo enviar la invitación: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// Initialize KB team event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Close team details panel
  document.getElementById('kbCloseTeamDetails')?.addEventListener('click', () => {
    document.getElementById('kbTeamDetailsPanel').style.display = 'none';
  });
  
  // Invite team member button
  document.getElementById('kbInviteToTeamBtn')?.addEventListener('click', inviteTeamMember);
  
  // Allow pressing Enter in the email input field
  document.getElementById('kbInviteEmail')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      inviteTeamMember();
    }
  });
});

window.toggleFolderFavorite = toggleFolderFavorite;
window.applyFolderTemplate = applyFolderTemplate;
window.confirmTemplateApplication = confirmTemplateApplication;
window.expandAllFolders = expandAllFolders;
window.collapseAllFolders = collapseAllFolders;
window.updateKBFolderManuals = updateKBFolderManuals;
window.loadKBStatistics = loadKBStatistics;
window.loadKBTeams = loadKBTeams;
window.loadSharedWithMe = loadSharedWithMe;

// Funciones para editar carpetas
window.openEditFolderPanel = openEditFolderPanel;
window.selectKBEditFolder = selectKBEditFolder;
window.toggleKBEditFolderNode = toggleKBEditFolderNode;
window.populateKBEditFolderSelect = populateKBEditFolderSelect;
window.findFolderById = findFolderById;
window.openEditFolderForm = openEditFolderForm;
window.saveEditFolder = saveEditFolder;
window.deleteEditFolder = deleteEditFolder;
window.ensureKBFoldersLoaded = ensureKBFoldersLoaded;

// Funciones para manuales
window.selectManualFolder = selectManualFolder;
window.toggleFolderNode = toggleFolderNode;
window.populateManualFolderSelect = populateManualFolderSelect;
window.toggleKBFolderExpand = toggleKBFolderExpand;
window.performKBSearch = performKBSearch;
window.showKBFolderContextMenu = showKBFolderContextMenu;
window.loadKBPermissions = loadKBPermissions;
window.loadKBSharedUsers = loadKBSharedUsers;
window.updateKBAccess = updateKBAccess;
window.shareKBFolder = shareKBFolder;
window.revokeKBFolderAccess = revokeKBFolderAccess;
window.selectMultipleKBManuals = selectMultipleKBManuals;
window.moveSelectedKBManuals = moveSelectedKBManuals;
window.enableKBInlineEdit = enableKBInlineEdit;
window.saveKBInlineEdit = saveKBInlineEdit;
window.clearKBFolderForm = clearKBFolderForm;
window.populateKBFolderParents = populateKBFolderParents;
window.populateManualFolderSelect = populateManualFolderSelect;
window.showFolderManuals = showFolderManuals;
window.editKBManual = editKBManual;
window.saveKBManualEdit = saveKBManualEdit;
window.deleteKBManual = deleteKBManual;
window.toggleManualFavorite = toggleManualFavorite;
window.shareFolderWithUser = shareFolderWithUser;
window.loadFolderShares = loadFolderShares;
window.revokeShare = revokeShare;
window.updateShareLevel = updateShareLevel;

// =====================================================
// PROFESIONAL PERMISSIONS SYSTEM - FRONTEND
// =====================================================

/**
 * Carga la lista de usuarios con acceso compartido a una carpeta
 */
async function loadFolderShares(folderId) {
  const container = document.getElementById('folderSharesList');
  if (!container) return;
  
  try {
    const response = await fetch(`/api/folders/${folderId}/access`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      container.innerHTML = '<div style="padding:12px;color:#dc3545;font-size:12px">Error cargando permisos</div>';
      return;
    }
    
    const data = await response.json();
    const shares = data.shares || [];
    
    if (shares.length === 0) {
      container.innerHTML = '<div style="padding:12px;text-align:center;color:var(--cw-text-muted);font-size:12px">Sin comparticiones activas</div>';
      return;
    }
    
    let html = '';
    shares.forEach(share => {
      const sharedWith = share.user_name ? `👤 ${share.user_name}` : `👥 ${share.team_name}`;
      const levelLabel = {
        'viewer': '👁️ Lectura',
        'editor': '✏️ Edición',
        'admin': '⚙️ Admin'
      }[share.access_level] || share.access_level;
      
      html += `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px;border-bottom:1px solid var(--cw-border);font-size:11px">
          <div>
            <div style="font-weight:600;color:var(--cw-text)">${sharedWith}</div>
            <div style="color:var(--cw-text-muted);font-size:10px">${share.email || share.team_name}</div>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <select onchange="updateShareLevel('${share.share_id}', this.value)" style="padding:4px;font-size:10px;border:1px solid var(--cw-border);border-radius:4px;background:var(--cw-input-bg)">
              <option value="viewer" ${share.access_level === 'viewer' ? 'selected' : ''}>Lectura</option>
              <option value="editor" ${share.access_level === 'editor' ? 'selected' : ''}>Edición</option>
              <option value="admin" ${share.access_level === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
            <button onclick="revokeShare('${share.share_id}')" style="padding:4px 8px;background:#ef4444;color:white;border:none;border-radius:4px;cursor:pointer;font-size:10px;font-weight:600">Revocar</button>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
  } catch (err) {
    console.error('[Permissions] Error loading shares:', err);
    container.innerHTML = '<div style="padding:12px;color:#dc3545;font-size:12px">Error cargando permisos</div>';
  }
}

/**
 * Comparte una carpeta con un usuario específico
 */
async function shareFolderWithUser() {
  const folderId = document.getElementById('editFolderId')?.value;
  const email = document.getElementById('shareUserEmail')?.value?.trim();
  const level = document.getElementById('shareUserLevel')?.value || 'viewer';
  
  if (!folderId || !email) {
    showToast('Por favor ingresa un correo válido', 'warning');
    return;
  }
  
  if (!email.includes('@')) {
    showToast('Por favor ingresa un correo válido', 'warning');
    return;
  }
  
  try {
    const response = await fetch(`/api/folders/${folderId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, access_level: level })
    });
    
    if (!response.ok) {
      const error = await response.json();
      showToast(error.error || 'Error compartiendo carpeta', 'error');
      return;
    }
    
    showToast('✓ Carpeta compartida exitosamente', 'success');
    document.getElementById('shareUserEmail').value = '';
    
    // Recargar la lista de comparticiones
    loadFolderShares(folderId);
  } catch (err) {
    console.error('[Permissions] Error sharing folder:', err);
    showToast('Error compartiendo carpeta', 'error');
  }
}

/**
 * Revoca el acceso compartido de un usuario
 */
async function revokeShare(shareId) {
  const folderId = document.getElementById('editFolderId')?.value;
  
  if (!folderId || !shareId) return;
  
  if (!confirm('¿Estás seguro de que deseas revocar este acceso?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/folders/${folderId}/share/${shareId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      showToast('Error revocando acceso', 'error');
      return;
    }
    
    showToast('✓ Acceso revocado', 'success');
    loadFolderShares(folderId);
  } catch (err) {
    console.error('[Permissions] Error revoking access:', err);
    showToast('Error revocando acceso', 'error');
  }
}

/**
 * Actualiza el nivel de acceso de un share
 */
async function updateShareLevel(shareId, newLevel) {
  const folderId = document.getElementById('editFolderId')?.value;
  
  if (!folderId || !shareId) return;
  
  try {
    const response = await fetch(`/api/folders/${folderId}/share/${shareId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_level: newLevel })
    });
    
    if (!response.ok) {
      showToast('Error actualizando permiso', 'error');
      loadFolderShares(folderId); // Recargar para revertir
      return;
    }
    
    showToast('✓ Permiso actualizado', 'success');
  } catch (err) {
    console.error('[Permissions] Error updating access level:', err);
    showToast('Error actualizando permiso', 'error');
  }
}
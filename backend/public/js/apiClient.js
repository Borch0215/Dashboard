// Cliente API - Reemplaza localStorage con llamadas al backend
// Todas las operaciones de datos van a través de este módulo

// Import configuration
import { config } from './config.js';

const API_BASE = config.API_BASE;

// SECCIÓN 2.5: Toast notification for API errors
export function showToast(message, type = 'error', duration = 3000) {
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
  
  // Add animation style if not exists
  if (!document.getElementById('toast-animation')) {
    const style = document.createElement('style');
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

// ID de usuario actual (simulado - en producción vendría de autenticación)
let currentUserId = localStorage.getItem('userId') || 'user-default';

// SEGURIDAD: Cache CSRF token for requests
let cachedCsrfToken = null;

// SEGURIDAD: Helper to get CSRF token
async function getCsrfToken() {
  if (cachedCsrfToken) return cachedCsrfToken;
  
  try {
    const response = await fetch(`${API_BASE}/csrf-token`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.ok) {
      const data = await response.json();
      cachedCsrfToken = data.token;
      return cachedCsrfToken;
    }
  } catch (err) {
    console.warn('Failed to fetch CSRF token:', err);
  }
  return '';
}

// SEGURIDAD: Helper to make authenticated requests
async function fetchWithAuth(url, options = {}) {
  const headers = options.headers || {};
  
  // Always include credentials for session-based auth
  const fetchOptions = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  // Add CSRF token for write operations
  if (['POST', 'PUT', 'DELETE'].includes(options.method?.toUpperCase())) {
    const csrfToken = await getCsrfToken();
    if (csrfToken) {
      fetchOptions.headers['X-CSRF-Token'] = csrfToken;
    }
  }
  
  return fetch(url, fetchOptions);
}

export const api = {
  // ==================== MANUALES ====================
  
  async getManuals(params = {}) {
    try {
      // Construir URL con query parameters para FASE 14
      const queryString = new URLSearchParams();
      if (params.limit) queryString.append('limit', params.limit);
      if (params.offset !== undefined) queryString.append('offset', params.offset);
      if (params.search) queryString.append('search', params.search);
      
      const url = queryString.toString() 
        ? `${API_BASE}/manuals?${queryString.toString()}`
        : `${API_BASE}/manuals`;
      
      const response = await fetchWithAuth(url);
      if (!response.ok) throw new Error(`Failed to fetch manuals: ${response.status}`);
      const data = await response.json();
      
      // Normalizar respuesta: API devuelve {data: [...], total: n, ...}
      // Devolver en formato consistente
      return {
        data: data.data || data.value || data.manuals || (Array.isArray(data) ? data : []),
        value: data.data || data.value || data.manuals || (Array.isArray(data) ? data : []),
        total: data.total || (Array.isArray(data) ? data.length : 0),
        limit: data.limit || params.limit || 20,
        offset: data.offset || params.offset || 0,
        hasMore: data.hasMore !== undefined ? data.hasMore : true
      };
    } catch (err) {
      console.error('Error obteniendo manuales:', err);
      // SECCIÓN 2.5: Show error toast instead of silent failure
      showToast(`Error al obtener manuales: ${err.message}`, 'error');
      return { value: [], data: [], total: 0, hasMore: false };
    }
  },

  async getManual(id) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/manuals/${id}`);
      if (!response.ok) throw new Error(`Failed to fetch manual: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error obteniendo manual:', err);
      return null;
    }
  },

  async createManual(manual) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/manuals`, {
        method: 'POST',
        body: JSON.stringify(manual)
      });
      if (!response.ok) throw new Error(`Failed to create manual: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error creando manual:', err);
      return null;
    }
  },

  async updateManual(id, manual) {
    try {
      // Normalizar: convertir campo 'steps' a 'content' para el backend
      const dataToSend = {...manual};
      if (dataToSend.steps && !dataToSend.content) {
        dataToSend.content = dataToSend.steps;
        delete dataToSend.steps;
      }
      const response = await fetchWithAuth(`${API_BASE}/manuals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dataToSend)
      });
      if (!response.ok) throw new Error(`Failed to update manual: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error actualizando manual:', err);
      return null;
    }
  },

  async deleteManual(id) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/manuals/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`Failed to delete manual: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error eliminando manual:', err);
      return null;
    }
  },

  // ==================== DIAGRAMAS (FIBRA) ====================

  async getDiagrams(params = {}) {
    try {
      // Construir URL con query parameters para FASE 14
      const queryString = new URLSearchParams();
      if (params.limit) queryString.append('limit', params.limit);
      if (params.offset !== undefined) queryString.append('offset', params.offset);
      if (params.category) queryString.append('category', params.category);
      
      const url = queryString.toString()
        ? `${API_BASE}/diagrams?${queryString.toString()}`
        : `${API_BASE}/diagrams`;
      
      const response = await fetchWithAuth(url);
      if (!response.ok) throw new Error(`Failed to fetch diagrams: ${response.status}`);
      const data = await response.json();
      
      // Normalizar respuesta: API devuelve {data: [...], total: n, ...}
      return {
        data: data.data || (Array.isArray(data) ? data : []),
        value: data.data || (Array.isArray(data) ? data : []),
        total: data.total || (Array.isArray(data) ? data.length : 0),
        limit: data.limit || params.limit || 20,
        offset: data.offset || params.offset || 0,
        hasMore: data.hasMore !== undefined ? data.hasMore : true
      };
    } catch (err) {
      console.error('Error obteniendo diagramas:', err);
      return { data: [], value: [], total: 0, hasMore: false };
    }
  },

  async createDiagram(diagram) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/diagrams`, {
        method: 'POST',
        body: JSON.stringify(diagram)
      });
      if (!response.ok) throw new Error(`Failed to create diagram: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error creando diagrama:', err);
      return null;
    }
  },

  async updateDiagram(id, diagram) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/diagrams/${id}`, {
        method: 'PUT',
        body: JSON.stringify(diagram)
      });
      if (!response.ok) throw new Error(`Failed to update diagram: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error actualizando diagrama:', err);
      return null;
    }
  },

  async deleteDiagram(id) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/diagrams/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`Failed to delete diagram: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error eliminando diagrama:', err);
      return null;
    }
  },

  // ==================== TREE PERSISTENCE (3.5) ====================

  async getDiagramNodes(diagramId) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/diagrams/${diagramId}/nodes`);
      if (!response.ok) throw new Error(`Failed to fetch nodes: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error obteniendo nodos del diagrama:', err);
      return { nodes: [], edges: [] };
    }
  },

  async createDiagramNode(diagramId, nodeData) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/diagrams/${diagramId}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodeData)
      });
      if (!response.ok) throw new Error(`Failed to create node: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error creando nodo:', err);
      return null;
    }
  },

  async updateDiagramNode(diagramId, nodeId, nodeData) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/diagrams/${diagramId}/nodes/${nodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodeData)
      });
      if (!response.ok) throw new Error(`Failed to update node: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error actualizando nodo:', err);
      return null;
    }
  },

  async deleteDiagramNode(diagramId, nodeId) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/diagrams/${diagramId}/nodes/${nodeId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`Failed to delete node: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error eliminando nodo:', err);
      return null;
    }
  },

  async createDiagramEdge(diagramId, edgeData) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/diagrams/${diagramId}/edges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edgeData)
      });
      if (!response.ok) throw new Error(`Failed to create edge: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error creando conexión:', err);
      return null;
    }
  },

  async updateDiagramEdge(diagramId, edgeId, edgeData) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/diagrams/${diagramId}/edges/${edgeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edgeData)
      });
      if (!response.ok) throw new Error(`Failed to update edge: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error actualizando conexión:', err);
      return null;
    }
  },

  async deleteDiagramEdge(diagramId, edgeId) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/diagrams/${diagramId}/edges/${edgeId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`Failed to delete edge: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error eliminando conexión:', err);
      return null;
    }
  },

  async validateDiagramStructure(diagramId) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/diagrams/${diagramId}/validate`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error(`Failed to validate diagram: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error validando estructura del diagrama:', err);
      return { valid: false, errors: ['Validation error'] };
    }
  },

  // ==================== PROGRESO ====================

  async getProgress(userId = currentUserId) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/progress/${userId}`);
      if (!response.ok) throw new Error(`Failed to fetch progress: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error obteniendo progreso:', err);
      return [];
    }
  },

  async updateProgress(manualId, stepIndex, completed) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/progress`, {
        method: 'POST',
        body: JSON.stringify({
          userId: currentUserId,
          manualId,
          stepIndex,
          completed
        })
      });
      if (!response.ok) throw new Error(`Failed to update progress: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error actualizando progreso:', err);
      return null;
    }
  },

  // ==================== COMMENTS ====================

  async getComments(manualId) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/comments/${manualId}`);
      if (!response.ok) throw new Error(`Failed to fetch comments: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error obteniendo comentarios:', err);
      return [];
    }
  },

  async addComment(manualId, text) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          userId: currentUserId,
          manualId,
          text
        })
      });
      if (!response.ok) throw new Error(`Failed to add comment: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error añadiendo comentario:', err);
      return null;
    }
  },

  async deleteComment(commentId) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/comments/${commentId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`Failed to delete comment: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error eliminando comentario:', err);
      return null;
    }
  },

  // ==================== HISTORIAL ====================

  async getHistory(userId = currentUserId) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/history/${userId}`);
      if (!response.ok) throw new Error(`Failed to fetch history: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error obteniendo historial:', err);
      return [];
    }
  },

  async addHistoryEntry(manualId = null, diagramId = null, action = 'view') {
    try {
      const response = await fetchWithAuth(`${API_BASE}/history`, {
        method: 'POST',
        body: JSON.stringify({
          userId: currentUserId,
          manualId,
          diagramId,
          action
        })
      });
      if (!response.ok) throw new Error(`Failed to add history entry: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error añadiendo entrada al historial:', err);
      return null;
    }
  },

  // ==================== USUARIOS ====================

  async getUsers() {
    try {
      const response = await fetchWithAuth(`${API_BASE}/users`);
      if (!response.ok) throw new Error(`Failed to fetch users: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error obteniendo usuarios:', err);
      return [];
    }
  },

  async createUser(username, password, role = 'agent', name = '') {
    try {
      const response = await fetchWithAuth(`${API_BASE}/users`, {
        method: 'POST',
        body: JSON.stringify({ username, password, role, name })
      });
      if (!response.ok) throw new Error(`Failed to create user: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error creando usuario:', err);
      return null;
    }
  },

  async login(username, password) {
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!response.ok) throw new Error(`Failed to login: ${response.status}`);
      const data = await response.json();
      if (data.user) {
        currentUserId = data.user.id;
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('authToken', data.token);
      }
      return data;
    } catch (err) {
      console.error('Error iniciando sesión:', err);
      return null;
    }
  },

  async deleteUser(userId) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/users/${userId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`Failed to delete user: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error eliminando usuario:', err);
      return null;
    }
  },

  // ==================== SALUD ====================

  async healthCheck() {
    try {
      const response = await fetchWithAuth(`${API_BASE}/health`);
      if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error verificación de salud:', err);
      return null;
    }
  },

  // ==================== UTILIDAD ====================

  setCurrentUserId(userId) {
    currentUserId = userId;
    localStorage.setItem('userId', userId);
  },

  getCurrentUserId() {
    return currentUserId;
  },

  // ==================== FOLDERS (FASE 16) ====================

  async getFolders(parentId = null) {
    try {
      const query = parentId !== undefined ? `?parent_id=${parentId}` : '?parent_id=null';
      const response = await fetch(`${API_BASE}/folders${query}`);
      if (!response.ok) throw new Error(`Failed to fetch folders: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error obteniendo carpetas:', err);
      return { data: [], total: 0 };
    }
  },

  async createFolder(folderData) {
    try {
      const response = await fetch(`${API_BASE}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderData)
      });
      if (!response.ok) throw new Error(`Failed to create folder: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error creando carpeta:', err);
      return null;
    }
  },

  async updateFolder(id, folderData) {
    try {
      const response = await fetch(`${API_BASE}/folders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderData)
      });
      if (!response.ok) throw new Error(`Failed to update folder: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error actualizando carpeta:', err);
      return null;
    }
  },

  async deleteFolder(id) {
    try {
      const response = await fetch(`${API_BASE}/folders/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`Failed to delete folder: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error eliminando carpeta:', err);
      return null;
    }
  },

  async getRelatedManuals(manualId) {
    try {
      const response = await fetch(`${API_BASE}/manuals/related/${manualId}`);
      if (!response.ok) throw new Error(`Failed to fetch related manuals: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error obteniendo manuales relacionados:', err);
      return { data: [], total: 0 };
    }
  },

  async getObsoleteManuals() {
    try {
      const response = await fetch(`${API_BASE}/manuals/obsolete`);
      if (!response.ok) throw new Error(`Failed to fetch obsolete manuals: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error obteniendo manuales obsoletos:', err);
      return { data: [], total: 0 };
    }
  }
};

export default api;

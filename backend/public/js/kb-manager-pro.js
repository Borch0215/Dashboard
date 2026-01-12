/**
 * KB Manager Professional Redesign
 * Modern, intuitive interface for Knowledge Base management
 */

const KBManagerPro = {
  state: {
    allFolders: [],
    allManuals: [],
    currentFolderId: null,
    expandedFolders: new Set(),
    navigationHistory: []
  },

  async init() {
    console.log('[KBPro] Initializing professional KB Manager...');
    try {
      await this.loadFolders();
      await this.loadManuals();
      this.renderUI();
      this.attachEventListeners();
      console.log('[KBPro] ✓ Initialization complete');
    } catch (err) {
      console.error('[KBPro] Error during initialization:', err);
    }
  },

  async loadFolders() {
    try {
      const response = await fetch('/api/folders/tree', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      this.state.allFolders = this.flattenTree(data.data || []);
      console.log('[KBPro] Loaded folders:', this.state.allFolders.length);
    } catch (err) {
      console.error('[KBPro] Error loading folders:', err);
      this.state.allFolders = [];
    }
  },

  async loadManuals() {
    try {
      const response = await fetch('/api/manuals?limit=1000', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      this.state.allManuals = data.data || [];
      console.log('[KBPro] Loaded manuals:', this.state.allManuals.length);
    } catch (err) {
      console.error('[KBPro] Error loading manuals:', err);
      this.state.allManuals = [];
    }
  },

  flattenTree(folders, flat = []) {
    (folders || []).forEach(folder => {
      flat.push(folder);
      if (folder.children) {
        this.flattenTree(folder.children, flat);
      }
    });
    return flat;
  },

  renderUI() {
    // Render folder tree in sidebar
    this.renderFolderTree();
    
    // If a folder is selected, render its contents
    if (this.state.currentFolderId) {
      this.renderFolderDetails();
    } else {
      this.renderEmptyState();
    }
  },

  renderFolderTree() {
    const container = document.getElementById('kbFolderTree');
    if (!container) return;

    // Get root folders
    const rootFolders = this.state.allFolders.filter(f => !f.parent_id);

    let html = '';
    rootFolders.forEach(folder => {
      html += this.renderFolderItem(folder);
    });

    container.innerHTML = html || '<p style="color:var(--cw-text-muted);text-align:center;padding:20px">📁 Sin carpetas</p>';
    this.attachTreeListeners();
  },

  renderFolderItem(folder, level = 0) {
    const hasChildren = this.state.allFolders.some(f => f.parent_id === folder.id);
    const isExpanded = this.state.expandedFolders.has(folder.id);
    const isSelected = folder.id === this.state.currentFolderId;
    const manualCount = this.state.allManuals.filter(m => m.folder_id === folder.id).length;

    let html = `
      <div class="kb-folder-item ${isSelected ? 'selected' : ''}" data-folder-id="${folder.id}" style="margin-left:${level * 16}px">
        ${hasChildren ? `
          <div class="kb-folder-toggle ${isExpanded ? 'expanded' : ''}" data-folder-id="${folder.id}">▶</div>
        ` : `<div class="kb-folder-toggle" style="visibility:hidden">▶</div>`}
        <span class="kb-folder-icon">${folder.icon || '📁'}</span>
        <span class="kb-folder-name">${this.escapeHtml(folder.name)}</span>
        ${manualCount > 0 ? `<span class="kb-folder-count">${manualCount}</span>` : ''}
      </div>
    `;

    if (hasChildren && isExpanded) {
      const children = this.state.allFolders.filter(f => f.parent_id === folder.id);
      children.forEach(child => {
        html += this.renderFolderItem(child, level + 1);
      });
    }

    return html;
  },

  attachTreeListeners() {
    // Folder selection
    document.querySelectorAll('.kb-folder-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('kb-folder-toggle')) {
          e.stopPropagation();
          const folderId = e.target.dataset.folderId;
          if (this.state.expandedFolders.has(folderId)) {
            this.state.expandedFolders.delete(folderId);
          } else {
            this.state.expandedFolders.add(folderId);
          }
          this.renderFolderTree();
        } else {
          const folderId = item.dataset.folderId;
          this.selectFolder(folderId);
        }
      });
    });
  },

  selectFolder(folderId) {
    this.state.currentFolderId = folderId;
    this.renderUI();
  },

  renderFolderDetails() {
    const folder = this.state.allFolders.find(f => f.id === this.state.currentFolderId);
    if (!folder) {
      this.renderEmptyState();
      return;
    }

    // Update breadcrumb
    this.renderBreadcrumb(folder);

    // Update details panel
    this.renderDetailsPanel(folder);

    // Update manuals grid
    this.renderManualsGrid(folder);
  },

  renderBreadcrumb(folder) {
    const container = document.getElementById('kbBreadcrumb');
    if (!container) return;

    const path = this.getBreadcrumbPath(folder);
    let html = '<span class="kb-breadcrumb-item" data-folder-id="">📁 Raíz</span>';
    
    path.forEach((f, idx) => {
      if (f.id) {
        html += '<span class="kb-breadcrumb-sep">/</span>';
        html += `<span class="kb-breadcrumb-item" data-folder-id="${f.id}">${this.escapeHtml(f.name)}</span>`;
      }
    });

    container.innerHTML = html;

    // Add breadcrumb listeners
    container.querySelectorAll('.kb-breadcrumb-item').forEach(item => {
      item.addEventListener('click', () => {
        const folderId = item.dataset.folderId;
        if (folderId) {
          this.selectFolder(folderId);
        } else {
          this.state.currentFolderId = null;
          this.renderUI();
        }
      });
    });
  },

  getBreadcrumbPath(folder, path = []) {
    path.unshift(folder);
    if (folder.parent_id) {
      const parent = this.state.allFolders.find(f => f.id === folder.parent_id);
      if (parent) {
        this.getBreadcrumbPath(parent, path);
      }
    }
    return path;
  },

  renderDetailsPanel(folder) {
    const container = document.getElementById('kbQuickInfo');
    if (!container) return;

    const manualCount = this.state.allManuals.filter(m => m.folder_id === folder.id).length;
    const subfolderCount = this.state.allFolders.filter(f => f.parent_id === folder.id).length;

    let html = `
      <div class="kb-detail-row">
        <span class="kb-detail-label">📁 Nombre</span>
        <span class="kb-detail-value">${this.escapeHtml(folder.name)}</span>
      </div>
      <div class="kb-detail-row">
        <span class="kb-detail-label">📄 Manuales</span>
        <span class="kb-detail-value"><strong>${manualCount}</strong> manual${manualCount !== 1 ? 'es' : ''}</span>
      </div>
      <div class="kb-detail-row">
        <span class="kb-detail-label">📂 Subcarpetas</span>
        <span class="kb-detail-value"><strong>${subfolderCount}</strong> carpeta${subfolderCount !== 1 ? 's' : ''}</span>
      </div>
    `;

    if (folder.description) {
      html += `
        <div class="kb-detail-row">
          <span class="kb-detail-label">ℹ️ Desc.</span>
          <span class="kb-detail-value">${this.escapeHtml(folder.description)}</span>
        </div>
      `;
    }

    container.innerHTML = html;
  },

  renderManualsGrid(folder) {
    const container = document.getElementById('kbFolderManualsPreview');
    if (!container) return;

    const manuals = this.state.allManuals.filter(m => m.folder_id === folder.id);

    if (manuals.length === 0) {
      container.innerHTML = `
        <div class="kb-empty-state">
          <div class="kb-empty-state-icon">📭</div>
          <div class="kb-empty-state-title">Sin manuales</div>
          <div class="kb-empty-state-text">Esta carpeta no contiene manuales</div>
        </div>
      `;
      return;
    }

    let html = '<div class="kb-manuals-grid">';
    manuals.forEach(manual => {
      html += `
        <div class="kb-manual-card" data-manual-id="${manual.id}">
          <div class="kb-manual-card-icon">📄</div>
          <div class="kb-manual-card-title">${this.escapeHtml(manual.title || manual.name)}</div>
          <div class="kb-manual-card-meta">${manual.category || 'General'}</div>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;

    // Add manual click listeners
    container.querySelectorAll('.kb-manual-card').forEach(card => {
      card.addEventListener('click', () => {
        const manualId = card.dataset.manualId;
        if (window.openManual) {
          window.openManual(manualId);
        }
      });
    });
  },

  renderEmptyState() {
    const container = document.getElementById('kbQuickInfo');
    if (container) {
      container.innerHTML = `
        <div class="kb-empty-state">
          <div class="kb-empty-state-icon">👉</div>
          <div class="kb-empty-state-title">Selecciona una carpeta</div>
          <div class="kb-empty-state-text">Elige una carpeta del lado izquierdo para ver sus detalles y manuales</div>
        </div>
      `;
    }

    const manualsContainer = document.getElementById('kbFolderManualsPreview');
    if (manualsContainer) {
      manualsContainer.innerHTML = `
        <div class="kb-empty-state">
          <div class="kb-empty-state-icon">👉</div>
          <div class="kb-empty-state-title">Selecciona una carpeta</div>
          <div class="kb-empty-state-text">Los manuales aparecerán aquí</div>
        </div>
      `;
    }
  },

  attachEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('kbSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.performSearch(e.target.value);
      });
    }

    // Expand/collapse all
    const expandAllBtn = document.getElementById('expandAllFoldersBtn');
    const collapseAllBtn = document.getElementById('collapseAllFoldersBtn');

    if (expandAllBtn) {
      expandAllBtn.addEventListener('click', () => {
        this.state.allFolders.forEach(f => this.state.expandedFolders.add(f.id));
        this.renderFolderTree();
      });
    }

    if (collapseAllBtn) {
      collapseAllBtn.addEventListener('click', () => {
        this.state.expandedFolders.clear();
        this.renderFolderTree();
      });
    }
  },

  performSearch(query) {
    const container = document.getElementById('kbSearchResults');
    if (!container) return;

    if (!query || query.length < 2) {
      container.innerHTML = '';
      return;
    }

    const q = query.toLowerCase();
    const folders = this.state.allFolders.filter(f => f.name.toLowerCase().includes(q));
    const manuals = this.state.allManuals.filter(m => (m.title || m.name).toLowerCase().includes(q));

    if (folders.length === 0 && manuals.length === 0) {
      container.innerHTML = '<p style="color:var(--cw-text-muted);font-size:11px;padding:8px">Sin resultados</p>';
      return;
    }

    let html = '';
    
    if (folders.length > 0) {
      html += '<div style="margin-bottom:8px">';
      folders.slice(0, 5).forEach(folder => {
        html += `
          <div style="padding:6px;cursor:pointer;border-radius:4px;font-size:11px;border-left:2px solid var(--cw-primary);padding-left:8px" data-search-folder="${folder.id}">
            📁 ${this.escapeHtml(folder.name)}
          </div>
        `;
      });
      html += '</div>';
    }

    if (manuals.length > 0) {
      manuals.slice(0, 5).forEach(manual => {
        html += `
          <div style="padding:6px;cursor:pointer;border-radius:4px;font-size:11px;border-left:2px solid var(--cw-accent);padding-left:8px" data-search-manual="${manual.id}">
            📄 ${this.escapeHtml(manual.title || manual.name)}
          </div>
        `;
      });
    }

    container.innerHTML = html;

    // Add search result listeners
    container.querySelectorAll('[data-search-folder]').forEach(item => {
      item.addEventListener('click', () => {
        this.selectFolder(item.dataset.searchFolder);
      });
    });

    container.querySelectorAll('[data-search-manual]').forEach(item => {
      item.addEventListener('click', () => {
        if (window.openManual) {
          window.openManual(item.dataset.searchManual);
        }
      });
    });
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Export for global use
window.KBManagerPro = KBManagerPro;

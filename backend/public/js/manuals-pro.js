/**
 * MANUALES PRO - Professional Manual Management Module
 * =====================================================
 * Módulo profesional para visualización, búsqueda y gestión de manuales
 * con interfaz moderna, intuitiva y responsive
 */

const ManualsPro = {
  /**
   * Estado de la aplicación de manuales
   */
  state: {
    allManuals: [],
    allFolders: [],
    filteredManuals: [],
    currentView: 'grid', // 'grid' o 'list'
    currentCategory: '',
    currentRole: '',
    currentType: '',
    currentFolderId: null, // Carpeta seleccionada
    searchQuery: '',
    favorites: JSON.parse(localStorage.getItem('manuals:favorites')) || [],
    sortBy: 'recent', // 'recent', 'updated', 'title-asc', 'title-desc'
    expandedFolders: new Set() // Para el árbol de carpetas
  },

  /**
   * Inicializa el módulo
   */
  async init() {
    console.log('[ManualsPro] Inicializando...');
    
    try {
      // Cargar manuales y carpetas
      await this.loadManuals();
      console.log('[ManualsPro] Manuales y carpetas cargados');
      
      // Renderizar UI
      console.log('[ManualsPro] Renderizando UI con', this.state.allFolders.length, 'carpetas');
      this.renderUI();
      
      // Adjuntar listeners
      this.attachEventListeners();
      
      console.log('[ManualsPro] ✓ Inicializado correctamente');
    } catch (err) {
      console.error('[ManualsPro] Error fatal en init:', err);
    }
  },

  /**
   * Carga los manuales desde STATE.manuals
   */
  async loadManuals() {
    try {
      // Esperar a que STATE esté disponible
      if (typeof STATE !== 'undefined' && STATE.manuals) {
        this.state.allManuals = STATE.manuals;
        this.state.filteredManuals = [...this.state.allManuals];
        console.log('[ManualsPro] Cargados', this.state.allManuals.length, 'manuales');
      }
      
      // Cargar carpetas
      await this.loadFolders();
    } catch (err) {
      console.error('[ManualsPro] Error cargando manuales:', err);
    }
  },

  /**
   * Carga las carpetas desde la API
   */
  async loadFolders() {
    try {
      console.log('[ManualsPro.loadFolders] Iniciando carga de carpetas...');
      const response = await fetch('/api/folders/tree');
      console.log('[ManualsPro.loadFolders] Respuesta recibida:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[ManualsPro.loadFolders] Datos JSON:', data);
      
      this.state.allFolders = data.data || data.folders || [];
      console.log('[ManualsPro] Cargadas', this.state.allFolders.length, 'carpetas');
      
      if (this.state.allFolders.length === 0) {
        console.warn('[ManualsPro] ⚠️ No hay carpetas en la respuesta del API');
      }
    } catch (err) {
      console.error('[ManualsPro] Error al cargar carpetas:', err);
      this.state.allFolders = [];
    }
  },

  /**
   * Renderiza la interfaz completa
   */
  renderUI() {
    const container = document.getElementById('manualsListView');
    if (!container) {
      console.error('[ManualsPro] ❌ No se encontró #manualsListView');
      return;
    }
    
    // Asegurar que el elemento sea visible
    container.classList.remove('hidden');
    console.log('[ManualsPro.renderUI] Renderizando con', this.state.allFolders.length, 'carpetas y', this.state.allManuals.length, 'manuales');

    // Aplicar filtros
    this.applyFilters();

    // Renderizar HTML con layout de dos columnas
    container.innerHTML = `
      <div style="display: flex; height: 100%; gap: 0;">
        <!-- SIDEBAR CON CARPETAS -->
        <div id="manualsFolderSidebar" style="width: 280px; border-right: 1px solid var(--cw-border); overflow-y: auto; display: flex; flex-direction: column; flex-shrink: 0;">
          ${this.getFolderSidebarHTML()}
        </div>
        <!-- CONTENIDO PRINCIPAL -->
        <div style="flex: 1; overflow-y: auto; display: flex; flex-direction: column;">
          ${this.getMainContentHTML()}
        </div>
      </div>
    `;

    // Renderizar tarjetas/filas
    this.renderManualsView();
    
    // Adjuntar listeners
    this.attachFolderListeners();
  },

  /**
   * HTML del sidebar de carpetas
   */
  getFolderSidebarHTML() {
    return `
      <div style="padding: 16px; border-bottom: 1px solid var(--cw-border); flex-shrink: 0;">
        <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; color: var(--cw-text); text-transform: uppercase; letter-spacing: 0.5px;">
          📁 Carpetas
        </h3>
        <button id="manualsShowAllFolders" class="manuals-btn" style="width: 100%; text-align: left; background: ${this.state.currentFolderId === null ? 'var(--cw-primary)' : 'transparent'}; color: ${this.state.currentFolderId === null ? 'white' : 'var(--cw-text)'};">
          📂 Todas las carpetas (${this.state.allManuals.length})
        </button>
      </div>
      <div id="manualsFolderTree" style="flex: 1; overflow-y: auto; padding: 8px 0;">
        ${this.getFolderTreeHTML()}
      </div>
    `;
  },

  /**
   * HTML del árbol de carpetas
   */
  getFolderTreeHTML() {
    if (!this.state.allFolders || this.state.allFolders.length === 0) {
      return `
        <div style="padding: 16px; text-align: center; color: var(--cw-text-muted); font-size: 12px;">
          <p style="margin: 0;">Sin carpetas</p>
        </div>
      `;
    }

    // Construir árbol
    return this.state.allFolders
      .filter(f => !f.parent_id) // Solo carpetas raíz
      .map(folder => this.getFolderItemHTML(folder, 0))
      .join('');
  },

  /**
   * HTML de un item de carpeta en el árbol
   */
  getFolderItemHTML(folder, level) {
    const hasChildren = this.state.allFolders.some(f => f.parent_id === folder.id);
    const isExpanded = this.state.expandedFolders.has(folder.id);
    const isSelected = this.state.currentFolderId === folder.id;
    const manualsCount = this.state.allManuals.filter(m => m.folder_id === folder.id).length;

    const indent = level * 16;
    const html = `
      <div style="user-select: none;">
        <div 
          class="manuals-folder-item" 
          data-folder-id="${folder.id}" 
          style="
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 8px;
            margin: 0 4px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            background: ${isSelected ? 'var(--cw-primary)' : 'transparent'};
            color: ${isSelected ? 'white' : 'var(--cw-text)'};
            margin-left: ${indent}px;
          "
          data-action="select-folder"
          data-folder-id="${folder.id}"
        >
          ${hasChildren ? `
            <button 
              class="manuals-folder-toggle"
              data-folder-id="${folder.id}"
              style="
                background: none;
                border: none;
                padding: 0;
                cursor: pointer;
                font-size: 12px;
                color: inherit;
                width: 20px;
                text-align: center;
              "
              data-action="toggle-folder"
              data-folder-id="${folder.id}"
            >
              ${isExpanded ? '▼' : '▶'}
            </button>
          ` : '<span style="width: 20px;"></span>'}
          <span style="font-size: 14px;">📁</span>
          <span style="flex: 1; font-size: 12px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${this.escapeHtml(folder.name)}
          </span>
          <span style="font-size: 11px; opacity: 0.7; font-weight: 600;">
            ${manualsCount}
          </span>
        </div>
        ${hasChildren && isExpanded ? `
          <div id="folder-children-${folder.id}">
            ${this.state.allFolders
              .filter(f => f.parent_id === folder.id)
              .map(child => this.getFolderItemHTML(child, level + 1))
              .join('')}
          </div>
        ` : ''}
      </div>
    `;

    return html;
  },

  /**
   * HTML del contenido principal
   */
  getMainContentHTML() {
    return `
      <div class="manuals-container" style="height: 100%; overflow-y: auto;">
        <!-- HEADER -->
        <div class="manuals-header">
          <div class="manuals-title-section">
            <h2>📚 Base de Conocimiento</h2>
            <span class="icon">—</span>
            <span style="font-size: 14px; color: var(--cw-text-muted);">
              ${this.state.filteredManuals.length} manual${this.state.filteredManuals.length !== 1 ? 'es' : ''}
            </span>
            <button id="manualsCreateBtn" class="manuals-btn primary" style="margin-left: auto; display: flex; align-items: center; gap: 6px;">
              <span>➕</span> Nuevo Manual
            </button>
          </div>

          <!-- ESTADÍSTICAS -->
          <div class="manuals-stats">
            <div class="manuals-stat-card">
              <div class="manuals-stat-icon">📚</div>
              <div class="manuals-stat-content">
                <div class="manuals-stat-label">Total Manuales</div>
                <div class="manuals-stat-value">${this.state.allManuals.length}</div>
              </div>
            </div>
            <div class="manuals-stat-card">
              <div class="manuals-stat-icon">🏷️</div>
              <div class="manuals-stat-content">
                <div class="manuals-stat-label">Categorías</div>
                <div class="manuals-stat-value">${this.getUniqueCategoriesCount()}</div>
              </div>
            </div>
            <div class="manuals-stat-card">
              <div class="manuals-stat-icon">👥</div>
              <div class="manuals-stat-content">
                <div class="manuals-stat-label">Roles/Áreas</div>
                <div class="manuals-stat-value">${this.getUniqueRolesCount()}</div>
              </div>
            </div>
            <div class="manuals-stat-card">
              <div class="manuals-stat-icon">⭐</div>
              <div class="manuals-stat-content">
                <div class="manuals-stat-label">Favoritos</div>
                <div class="manuals-stat-value">${this.state.favorites.length}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- TOOLBAR CON CONTROLES -->
        <div class="manuals-toolbar">
          <div class="manuals-toolbar-group" style="flex: 1; min-width: 250px;">
            <div class="manuals-search-box">
              <span style="color: var(--cw-text-muted); font-size: 14px;">🔍</span>
              <input type="text" id="manualsSearchInput" placeholder="Buscar manuales..." value="${this.state.searchQuery}">
              ${this.state.searchQuery ? '<button id="manualsSearchClear" class="manuals-btn" style="padding: 4px 8px; border: none; background: transparent; color: var(--cw-text-muted);">✕</button>' : ''}
            </div>
          </div>

          <div class="manuals-toolbar-separator"></div>

          <div class="manuals-toolbar-group">
            <label style="font-size: 12px; font-weight: 600; color: var(--cw-text-muted);">Filtros:</label>
            <select id="manualsFilterCategory" class="manuals-filter-select" title="Filtrar por categoría">
              <option value="">📂 Categoría</option>
              ${this.getCategoryOptions()}
            </select>
            <select id="manualsFilterRole" class="manuals-filter-select" title="Filtrar por rol">
              <option value="">👤 Rol/Área</option>
              ${this.getRoleOptions()}
            </select>
            <select id="manualsFilterType" class="manuals-filter-select" title="Filtrar por tipo">
              <option value="">🏷️ Tipo</option>
              ${this.getTypeOptions()}
            </select>
          </div>

          <div class="manuals-toolbar-separator"></div>

          <div class="manuals-toolbar-group">
            <label style="font-size: 12px; font-weight: 600; color: var(--cw-text-muted);">Ordenar:</label>
            <select id="manualsOrderBy" class="manuals-filter-select" title="Ordenar por">
              <option value="recent">🕐 Recientes</option>
              <option value="updated">📝 Actualizados</option>
              <option value="title-asc">A → Z</option>
              <option value="title-desc">Z → A</option>
            </select>
          </div>

          <div class="manuals-toolbar-separator"></div>

          <div class="manuals-toolbar-group">
            <div class="manuals-view-toggle">
              <button id="manualsViewGrid" class="manuals-view-btn active" title="Vista de cuadrícula">
                ▦▦ Grid
              </button>
              <button id="manualsViewList" class="manuals-view-btn" title="Vista de lista">
                ☰ Lista
              </button>
            </div>
          </div>
        </div>

        <!-- CONTENIDO PRINCIPAL -->
        <div id="manualsContent">
          ${this.state.filteredManuals.length === 0 ? this.getEmptyStateHTML() : ''}
        </div>
      </div>
    `;
  },

  /**
   * Renderiza la vista actual (grid o list)
   */
  renderManualsView() {
    const container = document.getElementById('manualsContent');
    if (!container) {
      console.warn('[ManualsPro] No encontrado #manualsContent');
      return;
    }

    if (this.state.filteredManuals.length === 0) {
      container.innerHTML = this.getEmptyStateHTML();
      return;
    }

    if (this.state.currentView === 'grid') {
      container.innerHTML = this.getGridViewHTML();
    } else {
      container.innerHTML = this.getListViewHTML();
    }

    // Adjuntar listeners de tarjetas
    this.attachCardListeners();
  },

  /**
   * HTML de vista en grid
   */
  getGridViewHTML() {
    return `
      <div class="manuals-grid">
        ${this.state.filteredManuals.map(manual => this.getCardHTML(manual)).join('')}
      </div>
    `;
  },

  /**
   * HTML de vista en lista
   */
  getListViewHTML() {
    return `
      <div class="manuals-list">
        ${this.state.filteredManuals.map(manual => this.getListItemHTML(manual)).join('')}
      </div>
    `;
  },

  /**
   * HTML de una tarjeta de manual
   */
  getCardHTML(manual) {
    const isFavorited = this.state.favorites.includes(manual.id);
    const stepsCount = Array.isArray(manual.steps) ? manual.steps.length : 0;

    return `
      <div class="manuals-card" data-manual-id="${manual.id}" title="Haz clic para ver detalles">
        <div class="manuals-card-header">
          <div class="manuals-card-icon">📄</div>
          <div class="manuals-card-header-content">
            <h3 class="manuals-card-title">${this.escapeHtml(manual.title || 'Sin título')}</h3>
            <p class="manuals-card-category">${this.escapeHtml(manual.category || 'General')}</p>
          </div>
        </div>

        <div class="manuals-card-body">
          ${manual.summary ? `<p class="manuals-card-summary">${this.escapeHtml(manual.summary)}</p>` : ''}

          <div class="manuals-card-meta">
            ${stepsCount > 0 ? `
              <div class="manuals-card-meta-item">
                <span>📋 Pasos: <strong>${stepsCount}</strong></span>
              </div>
            ` : ''}
            ${manual.role ? `
              <div class="manuals-card-meta-item">
                <span>👤 Rol: <strong>${this.escapeHtml(manual.role)}</strong></span>
              </div>
            ` : ''}
            ${manual.version ? `
              <div class="manuals-card-meta-item">
                <span>v${this.escapeHtml(manual.version)}</span>
              </div>
            ` : ''}
          </div>

          <div class="manuals-card-badges">
            ${manual.category ? `<span class="manuals-card-badge category">${this.escapeHtml(manual.category)}</span>` : ''}
            ${manual.type ? `<span class="manuals-card-badge type">${this.escapeHtml(manual.type)}</span>` : ''}
            ${isFavorited ? `<span class="manuals-card-badge" style="background: rgba(243, 156, 18, 0.1); border-color: rgba(243, 156, 18, 0.3); color: #f39c12;">⭐ Favorito</span>` : ''}
          </div>
        </div>

        <div class="manuals-card-footer">
          <button class="manuals-card-button primary" data-action="view-manual" data-manual-id="${manual.id}">
            👁️ Ver detalles
          </button>
          <button class="manuals-card-button favorite-btn" data-manual-id="${manual.id}" title="${isFavorited ? 'Quitar de favoritos' : 'Añadir a favoritos'}">
            ${isFavorited ? '⭐' : '☆'}
          </button>
        </div>
      </div>
    `;
  },

  /**
   * HTML de un item de lista
   */
  getListItemHTML(manual) {
    const isFavorited = this.state.favorites.includes(manual.id);
    const stepsCount = Array.isArray(manual.steps) ? manual.steps.length : 0;
    
    // Obtener usuario actual y verificar permisos
    const user = typeof STATE !== 'undefined' ? STATE.authUser : null;
    const isOwnManual = user && (manual.created_by === user.id || manual.created_by === user.username);
    const canEdit = typeof canEditManuals === 'function' ? canEditManuals(isOwnManual) : false;
    const canDelete = typeof canDeleteManuals === 'function' ? canDeleteManuals(isOwnManual) : false;

    return `
      <div class="manuals-list-item" data-manual-id="${manual.id}">
        <div style="display: flex; gap: 16px; flex: 1; align-items: center; min-width: 0;">
          <div class="manuals-list-item-icon">📄</div>
          <div class="manuals-list-item-content">
            <h4 class="manuals-list-item-title">${this.escapeHtml(manual.title || 'Sin título')}</h4>
            <p class="manuals-list-item-meta">
              ${this.escapeHtml(manual.category || 'General')}
              ${manual.role ? ` • 👤 ${this.escapeHtml(manual.role)}` : ''}
              ${stepsCount > 0 ? ` • 📋 ${stepsCount} paso${stepsCount !== 1 ? 's' : ''}` : ''}
              ${manual.version ? ` • v${this.escapeHtml(manual.version)}` : ''}
            </p>
          </div>
        </div>
        <div class="manuals-list-item-actions">
          <button class="manuals-list-item-action" data-action="view-manual" data-manual-id="${manual.id}">
            Ver
          </button>
          ${canEdit ? `<button class="manuals-list-item-action" data-action="edit-manual" data-manual-id="${manual.id}" title="Editar manual">✏️</button>` : ''}
          <button class="manuals-list-item-action favorite-btn" data-manual-id="${manual.id}" title="${isFavorited ? 'Quitar de favoritos' : 'Añadir a favoritos'}">
            ${isFavorited ? '⭐ Fav' : '☆'}
          </button>
          ${canDelete ? `<button class="manuals-list-item-action" data-action="delete-manual" data-manual-id="${manual.id}" title="Eliminar manual" style="color: #ef4444;">🗑️</button>` : ''}
        </div>
      </div>
    `;
  },

  /**
   * HTML de estado vacío
   */
  getEmptyStateHTML() {
    return `
      <div class="manuals-empty">
        <div class="manuals-empty-icon">📭</div>
        <h3 class="manuals-empty-title">Sin resultados</h3>
        <p class="manuals-empty-description">
          ${this.state.searchQuery 
            ? `No se encontraron manuales con "${this.escapeHtml(this.state.searchQuery)}"` 
            : 'No hay manuales disponibles con los filtros seleccionados'}
        </p>
        ${this.state.searchQuery || this.state.currentCategory || this.state.currentRole || this.state.currentType
          ? `<button class="manuals-btn primary" style="margin-top: 16px;" data-action="clear-filters">🔄 Limpiar filtros</button>`
          : ''}
      </div>
    `;
  },

  /**
   * Aplica filtros al listado
   */
  applyFilters() {
    this.state.filteredManuals = this.state.allManuals.filter(manual => {
      // Filtro por carpeta
      if (this.state.currentFolderId !== null && manual.folder_id !== this.state.currentFolderId) {
        return false;
      }

      // Filtro de búsqueda
      if (this.state.searchQuery) {
        const query = this.state.searchQuery.toLowerCase();
        const matchesSearch = 
          (manual.title && manual.title.toLowerCase().includes(query)) ||
          (manual.summary && manual.summary.toLowerCase().includes(query)) ||
          (manual.category && manual.category.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Filtro de categoría
      if (this.state.currentCategory && manual.category !== this.state.currentCategory) {
        return false;
      }

      // Filtro de rol
      if (this.state.currentRole && manual.role !== this.state.currentRole) {
        return false;
      }

      // Filtro de tipo
      if (this.state.currentType && manual.type !== this.state.currentType) {
        return false;
      }

      return true;
    });

    // Aplicar ordenamiento
    this.applySorting();
  },

  /**
   * Aplica ordenamiento
   */
  applySorting() {
    const sorted = [...this.state.filteredManuals];

    switch (this.state.sortBy) {
      case 'recent':
        // Por ID descendente (más recientes primero)
        sorted.sort((a, b) => (b.id || 0) - (a.id || 0));
        break;
      case 'updated':
        // Por fecha de actualización (simulado con ID)
        sorted.sort((a, b) => (b.updated_at || b.id || 0) - (a.updated_at || a.id || 0));
        break;
      case 'title-asc':
        sorted.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'es'));
        break;
      case 'title-desc':
        sorted.sort((a, b) => (b.title || '').localeCompare(a.title || '', 'es'));
        break;
    }

    this.state.filteredManuals = sorted;
  },

  /**
   * Adjunta listeners de eventos
   */
  attachEventListeners() {
    // Botón crear manual
    const createBtn = document.getElementById('manualsCreateBtn');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        this.openCreateManualModal();
      });
    }

    // Búsqueda
    const searchInput = document.getElementById('manualsSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.state.searchQuery = e.target.value;
        this.renderUI();
      });
    }

    const searchClear = document.getElementById('manualsSearchClear');
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        this.state.searchQuery = '';
        this.renderUI();
      });
    }

    // Filtros
    const filterCategory = document.getElementById('manualsFilterCategory');
    if (filterCategory) {
      filterCategory.addEventListener('change', (e) => {
        this.state.currentCategory = e.target.value;
        this.renderUI();
      });
    }

    const filterRole = document.getElementById('manualsFilterRole');
    if (filterRole) {
      filterRole.addEventListener('change', (e) => {
        this.state.currentRole = e.target.value;
        this.renderUI();
      });
    }

    const filterType = document.getElementById('manualsFilterType');
    if (filterType) {
      filterType.addEventListener('change', (e) => {
        this.state.currentType = e.target.value;
        this.renderUI();
      });
    }

    // Ordenamiento
    const orderBy = document.getElementById('manualsOrderBy');
    if (orderBy) {
      orderBy.addEventListener('change', (e) => {
        this.state.sortBy = e.target.value;
        this.renderUI();
      });
    }

    // Vista (Grid/Lista)
    const viewGrid = document.getElementById('manualsViewGrid');
    if (viewGrid) {
      viewGrid.addEventListener('click', () => {
        this.state.currentView = 'grid';
        this.updateViewToggle();
        this.renderManualsView();
      });
    }

    const viewList = document.getElementById('manualsViewList');
    if (viewList) {
      viewList.addEventListener('click', () => {
        this.state.currentView = 'list';
        this.updateViewToggle();
        this.renderManualsView();
      });
    }
  },

  /**
   * Adjunta listeners a las tarjetas
   */
  attachCardListeners() {
    // Botones de acción (Ver detalles, Limpiar filtros, etc.)
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        
        if (action === 'view-manual') {
          const manualId = btn.dataset.manualId;
          this.openManualDetail(manualId);
        } else if (action === 'edit-manual') {
          e.preventDefault();
          const manualId = btn.dataset.manualId;
          if (typeof openManual === 'function') {
            openManual(manualId);
          }
        } else if (action === 'delete-manual') {
          e.preventDefault();
          const manualId = btn.dataset.manualId;
          if (typeof deleteManual === 'function') {
            deleteManual(manualId);
          }
        } else if (action === 'clear-filters') {
          this.clearFilters();
        } else if (action === 'select-folder') {
          const folderId = btn.dataset.folderId;
          this.selectFolder(folderId);
        } else if (action === 'toggle-folder') {
          e.stopPropagation();
          const folderId = btn.dataset.folderId;
          this.toggleFolder(folderId);
        }
      });
    });

    // Favoritos
    document.querySelectorAll('.favorite-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const manualId = btn.dataset.manualId;
        this.toggleFavorite(manualId);
      });
    });

    // Click en tarjeta (en grid)
    if (this.state.currentView === 'grid') {
      document.querySelectorAll('.manuals-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (!e.target.closest('.manuals-card-footer')) {
            const manualId = card.dataset.manualId;
            this.openManualDetail(manualId);
          }
        });
      });
    }

    // Click en item de lista
    if (this.state.currentView === 'list') {
      document.querySelectorAll('.manuals-list-item').forEach(item => {
        item.addEventListener('click', (e) => {
          if (!e.target.closest('.manuals-list-item-actions')) {
            const manualId = item.dataset.manualId;
            this.openManualDetail(manualId);
          }
        });
      });
    }
  },

  /**
   * Actualiza el toggle de vista
   */
  updateViewToggle() {
    document.getElementById('manualsViewGrid')?.classList.toggle('active', this.state.currentView === 'grid');
    document.getElementById('manualsViewList')?.classList.toggle('active', this.state.currentView === 'list');
  },

  /**
   * Abre el modal de crear manual
   */
  openCreateManualModal() {
    const modal = document.getElementById('newManualModal');
    if (!modal) {
      console.error('[ManualsPro] Modal #newManualModal no encontrado');
      return;
    }

    // Mostrar modal (remover clase hidden)
    modal.classList.remove('hidden');

    // Limpiar campos
    const title = document.getElementById('newTitle');
    if (title) title.value = '';
    
    const summary = document.getElementById('newSummary');
    if (summary) summary.value = '';

    // Cargar opciones si la función existe
    try {
      if (typeof openNewManualModal === 'function') {
        openNewManualModal();
      }
    } catch (err) {
      console.warn('[ManualsPro] Error cargando opciones:', err);
    }

    console.log('[ManualsPro] Modal de crear manual abierto');
  },

  /**
   * Abre el detalle de un manual
   */
  openManualDetail(manualId) {
    if (typeof openManual === 'function') {
      openManual(manualId);
    } else {
      console.warn('[ManualsPro] openManual no disponible');
    }
  },

  /**
   * Toggle de favorito
   */
  toggleFavorite(manualId) {
    const idx = this.state.favorites.indexOf(manualId);
    if (idx > -1) {
      this.state.favorites.splice(idx, 1);
    } else {
      this.state.favorites.push(manualId);
    }
    localStorage.setItem('manuals:favorites', JSON.stringify(this.state.favorites));
    this.renderUI();
  },

  /**
   * Selecciona una carpeta
   */
  selectFolder(folderId) {
    this.state.currentFolderId = folderId === 'all' ? null : folderId;
    this.renderUI();
    console.log('[ManualsPro] Carpeta seleccionada:', folderId);
  },

  /**
   * Expande o contrae una carpeta
   */
  toggleFolder(folderId) {
    if (this.state.expandedFolders.has(folderId)) {
      this.state.expandedFolders.delete(folderId);
    } else {
      this.state.expandedFolders.add(folderId);
    }
    this.renderUI();
  },

  /**
   * Adjunta listeners de carpetas
   */
  attachFolderListeners() {
    const showAllBtn = document.getElementById('manualsShowAllFolders');
    if (showAllBtn) {
      showAllBtn.addEventListener('click', () => {
        this.selectFolder('all');
      });
    }
  },

  /**
   * Limpia todos los filtros
   */
  clearFilters() {
    this.state.searchQuery = '';
    this.state.currentCategory = '';
    this.state.currentRole = '';
    this.state.currentType = '';
    this.state.sortBy = 'recent';
    this.renderUI();
  },

  /**
   * Obtiene opciones de categoría
   */
  getCategoryOptions() {
    const categories = [...new Set(this.state.allManuals
      .map(m => m.category)
      .filter(Boolean))];
    return categories
      .map(cat => `<option value="${this.escapeHtml(cat)}">${this.escapeHtml(cat)}</option>`)
      .join('');
  },

  /**
   * Obtiene opciones de rol
   */
  getRoleOptions() {
    const roles = [...new Set(this.state.allManuals
      .map(m => m.role)
      .filter(Boolean))];
    return roles
      .map(role => `<option value="${this.escapeHtml(role)}">${this.escapeHtml(role)}</option>`)
      .join('');
  },

  /**
   * Obtiene opciones de tipo
   */
  getTypeOptions() {
    const types = [...new Set(this.state.allManuals
      .map(m => m.type)
      .filter(Boolean))];
    return types
      .map(type => `<option value="${this.escapeHtml(type)}">${this.escapeHtml(type)}</option>`)
      .join('');
  },

  /**
   * Cuenta categorías únicas
   */
  getUniqueCategoriesCount() {
    return new Set(this.state.allManuals.map(m => m.category).filter(Boolean)).size;
  },

  /**
   * Cuenta roles únicos
   */
  getUniqueRolesCount() {
    return new Set(this.state.allManuals.map(m => m.role).filter(Boolean)).size;
  },

  /**
   * Escapa HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Refresca los manuales sin reinicializar (para cuando se crea un nuevo manual)
   */
  refreshManuals(manuals) {
    console.log('[ManualsPro.refreshManuals] Refrescando manuales...');
    console.log('[ManualsPro.refreshManuals] Manuales actuales:', this.state.allManuals.length);
    
    // Actualizar desde parámetro o desde STATE.manuals
    if (manuals && Array.isArray(manuals)) {
      this.state.allManuals = manuals;
      console.log('[ManualsPro.refreshManuals] Cargados', this.state.allManuals.length, 'manuales desde parámetro');
    } else if (typeof STATE !== 'undefined' && STATE.manuals) {
      this.state.allManuals = STATE.manuals;
      console.log('[ManualsPro.refreshManuals] Cargados', this.state.allManuals.length, 'manuales desde STATE');
    } else {
      console.warn('[ManualsPro.refreshManuals] No hay manuales disponibles');
    }
    
    // Reaplicar filtros y renderizar
    console.log('[ManualsPro.refreshManuals] Aplicando filtros...');
    this.applyFilters();
    console.log('[ManualsPro.refreshManuals] Filtrados a:', this.state.filteredManuals.length, 'manuales');
    
    console.log('[ManualsPro.refreshManuals] Renderizando vista...');
    this.renderManualsView();
    
    console.log('[ManualsPro.refreshManuals] Adjuntando listeners...');
    this.attachEventListeners();
    
    console.log('[ManualsPro.refreshManuals] ✓ Refrescado correctamente');
  }
};

// Hacer disponible globalmente
window.ManualsPro = ManualsPro;

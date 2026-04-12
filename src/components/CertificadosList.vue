<template>
  <div class="directorio">
    <!-- Search Bar -->
    <div class="search-panel">
      <div class="search-row">
        <div class="search-field" :class="{ active: searchType === 'folio' }">
          <label for="search-folio">
            <span class="mdi mdi-pound"></span> Folio
          </label>
          <input
            id="search-folio"
            type="text"
            v-model="filters.folio"
            placeholder="ej. 001-2025"
            @keyup.enter="buscar"
            @focus="searchType = 'folio'"
          />
        </div>
        <div class="search-field" :class="{ active: searchType === 'cliente' }">
          <label for="search-cliente">
            <span class="mdi mdi-account"></span> Cliente
          </label>
          <input
            id="search-cliente"
            type="text"
            v-model="filters.cliente"
            placeholder="Nombre del cliente"
            @keyup.enter="buscar"
            @focus="searchType = 'cliente'"
          />
        </div>
        <div class="search-field" :class="{ active: searchType === 'localidad' }">
          <label for="search-localidad">
            <span class="mdi mdi-map-marker"></span> Localidad
          </label>
          <input
            id="search-localidad"
            type="text"
            v-model="filters.localidad"
            placeholder="Ciudad / municipio"
            @keyup.enter="buscar"
            @focus="searchType = 'localidad'"
          />
        </div>
        <div class="search-field" :class="{ active: searchType === 'areas' }">
          <label for="search-areas">
            <span class="mdi mdi-map-outline"></span> Áreas
          </label>
          <input
            id="search-areas"
            type="text"
            v-model="filters.areas"
            placeholder="Bodega, oficina..."
            @keyup.enter="buscar"
            @focus="searchType = 'areas'"
          />
        </div>
        <button class="btn-buscar" @click="buscar" :disabled="loading">
          <span class="mdi mdi-magnify"></span>
          Buscar
        </button>
        <button class="btn-limpiar" @click="limpiar" title="Limpiar filtros">
          <span class="mdi mdi-close"></span>
        </button>
      </div>
    </div>

    <!-- Actions header -->
    <div class="table-header">
      <div class="table-header-left">
        <span class="results-count" v-if="!loading">
          {{ totalRecords }} resultado{{ totalRecords !== 1 ? 's' : '' }}
        </span>
        <div class="page-size-selector">
          <label for="page-size">Mostrar:</label>
          <select id="page-size" v-model="pageSize" @change="onPageSizeChange">
            <option v-for="opt in pageSizeOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>
      </div>
      <button class="btn-nuevo" @click="$emit('nuevo')">
        <span class="mdi mdi-plus"></span> Nuevo certificado
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando certificados...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="certificados.length === 0" class="empty-state">
      <span class="mdi mdi-file-search-outline empty-icon"></span>
      <p>No se encontraron certificados</p>
      <small>Intenta con otros filtros de búsqueda</small>
    </div>

    <!-- Table -->
    <div v-else class="table-wrapper">
      <table class="certs-table">
        <thead>
          <tr>
            <th>Folio</th>
            <th>Cliente</th>
            <th>Localidad</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cert in certificados" :key="cert.folio" class="cert-row">
            <td class="folio-cell">
              <span class="folio-badge">{{ cert.folio }}</span>
            </td>
            <td>{{ cert.cliente || '—' }}</td>
            <td>{{ cert.localidad || '—' }}</td>
            <td class="fecha-cell">{{ cert.fecha || '—' }}</td>
            <td class="actions-cell">
              <button class="action-btn btn-edit" @click="$emit('editar', cert)" title="Editar">
                <span class="mdi mdi-pencil"></span>
              </button>
              <button class="action-btn btn-duplicate" @click="$emit('duplicar', cert)" title="Crear a partir de este">
                <span class="mdi mdi-content-copy"></span>
              </button>
              <button class="action-btn btn-delete" @click="confirmarEliminar(cert)" title="Eliminar">
                <span class="mdi mdi-delete"></span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination pagination--bottom" v-if="certificados.length > 0">
      <button class="page-btn" @click="cambiarPagina(1)" :disabled="currentPage === 1" title="Primera página">
        <span class="mdi mdi-chevron-double-left"></span>
      </button>
      <button class="page-btn" @click="cambiarPagina(currentPage - 1)" :disabled="currentPage === 1">
        <span class="mdi mdi-chevron-left"></span>
      </button>

      <div class="page-numbers">
        <button
          v-for="page in visiblePages"
          :key="page"
          class="page-num"
          :class="{ active: page === currentPage }"
          @click="cambiarPagina(page)"
        >{{ page }}</button>
      </div>

      <button class="page-btn" @click="cambiarPagina(currentPage + 1)" :disabled="currentPage >= totalPages || totalPages <= 1">
        <span class="mdi mdi-chevron-right"></span>
      </button>
      <button class="page-btn" @click="cambiarPagina(totalPages)" :disabled="currentPage >= totalPages || totalPages <= 1" title="Última página">
        <span class="mdi mdi-chevron-double-right"></span>
      </button>
      <span class="page-info">Página {{ currentPage }} de {{ totalPages || 1 }}</span>
    </div>

    <!-- Confirm Delete Dialog -->
    <div v-if="certAEliminar" class="overlay-confirm" @click.self="certAEliminar = null">
      <div class="confirm-dialog">
        <span class="mdi mdi-alert-circle-outline confirm-icon"></span>
        <h3>¿Eliminar certificado?</h3>
        <p>Se eliminará el certificado <strong>{{ certAEliminar.folio }}</strong> de <em>{{ certAEliminar.cliente }}</em>. Esta acción no se puede deshacer.</p>
        <div class="confirm-actions">
          <button class="btn-cancel" @click="certAEliminar = null">Cancelar</button>
          <button class="btn-confirm-delete" @click="eliminar" :disabled="eliminando">
            <span :class="eliminando ? 'mdi mdi-loading mdi-spin' : 'mdi mdi-delete'"></span>
            {{ eliminando ? 'Eliminando...' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import axios from 'axios';

interface CertificadoItem {
  hash: string;
  folio: string;
  cliente?: string;
  domicilio?: string;
  localidad?: string;
  fecha?: string;
  tratamiento?: string;
  areas?: string;
  timestamp?: number;
  bitly?: string;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];
const DEFAULT_LIMIT = 10;

export default {
  name: 'CertificadosList',
  emits: ['editar', 'duplicar', 'nuevo'],
  data() {
    return {
      certificados: [] as CertificadoItem[],
      loading: false,
      eliminando: false,
      certAEliminar: null as CertificadoItem | null,
      currentPage: 1,
      pageSize: DEFAULT_LIMIT,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
      totalRecords: 0,
      searchType: 'folio',
      filters: {
        folio: '',
        cliente: '',
        localidad: '',
        areas: '',
      },
    };
  },
  computed: {
    totalPages(): number {
      return Math.ceil(this.totalRecords / this.pageSize);
    },
    visiblePages(): number[] {
      const pages: number[] = [];
      const start = Math.max(1, this.currentPage - 2);
      const end = Math.min(this.totalPages, this.currentPage + 2);
      for (let i = start; i <= end; i++) pages.push(i);
      return pages;
    },
  },
  mounted() {
    this.cargar();
  },
  methods: {
    async cargar() {
      this.loading = true;
      try {
        const params: Record<string, any> = { page: this.currentPage, limit: this.pageSize };
        if (this.filters.cliente.trim()) params.cliente = this.filters.cliente.trim();
        if (this.filters.localidad.trim()) params.localidad = this.filters.localidad.trim();
        if (this.filters.areas.trim()) params.areas = this.filters.areas.trim();
        // folio uses its own endpoint
        if (this.filters.folio.trim()) {
          await this.buscarPorFolio();
          return;
        }
        const response = await axios.get(`${apiBaseUrl}/api/certificados`, {
          params,
          headers: { 'Content-Type': 'application/json' },
        });
        const data = response.data;
        this.certificados = data.data ?? data;
        this.totalRecords = data.total ?? this.certificados.length;
      } catch (e) {
        console.error(e);
        this.certificados = [];
        this.totalRecords = 0;
      } finally {
        this.loading = false;
      }
    },
    async buscarPorFolio() {
      try {
        const response = await axios.get(
          `${apiBaseUrl}/api/certificados/folio/${encodeURIComponent(this.filters.folio.trim())}`,
          { headers: { 'Content-Type': 'application/json' } }
        );
        const item = response.data;
        this.certificados = item ? [item] : [];
        this.totalRecords = this.certificados.length;
      } catch (e: any) {
        if (e?.response?.status === 404) {
          this.certificados = [];
          this.totalRecords = 0;
        } else {
          console.error(e);
        }
      } finally {
        this.loading = false;
      }
    },
    buscar() {
      this.currentPage = 1;
      this.cargar();
    },
    onPageSizeChange() {
      this.currentPage = 1;
      this.cargar();
    },
    limpiar() {
      this.filters = { folio: '', cliente: '', localidad: '', areas: '' };
      this.currentPage = 1;
      this.cargar();
    },
    cambiarPagina(page: number) {
      if (page < 1 || page > this.totalPages) return;
      this.currentPage = page;
      this.cargar();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    confirmarEliminar(cert: CertificadoItem) {
      this.certAEliminar = cert;
    },
    async eliminar() {
      if (!this.certAEliminar) return;
      this.eliminando = true;
      try {
        await axios.delete(
          `${apiBaseUrl}/api/certificados/${encodeURIComponent(this.certAEliminar.folio)}`,
          { headers: { 'Content-Type': 'application/json' } }
        );
        this.certAEliminar = null;
        await this.cargar();
      } catch (e) {
        console.error(e);
        alert('Error al eliminar el certificado. Intenta de nuevo.');
      } finally {
        this.eliminando = false;
      }
    },
    // Public method to refresh the list (called from parent)
    refresh() {
      this.cargar();
    },
  },
};
</script>

<style scoped>
.directorio {
  width: 100%;
}

/* Search Panel */
.search-panel {
  background: #f5f5f5;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
  border: 1px solid #ddd;
}

.search-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.search-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
  min-width: 140px;
}

.search-field label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #777;
  display: flex;
  align-items: center;
  gap: 4px;
  user-select: none;
}

.search-field.active label {
  color: #1a8f00;
}

.search-field input {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1.5px solid #ccc;
  font-size: 0.92rem;
  background: #fff;
  color: #1a1a1a;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
  box-sizing: border-box;
}

.search-field input::placeholder { color: #aaa; }

.search-field input:focus,
.search-field.active input:focus {
  outline: none;
  border-color: #27b100;
  box-shadow: 0 0 0 3px rgba(39, 177, 0, 0.15);
}

.btn-buscar {
  padding: 9px 20px;
  background: #27b100;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s, transform 0.1s;
  white-space: nowrap;
}

.btn-buscar:hover:not(:disabled) {
  background: #1e9400;
  transform: translateY(-1px);
}

.btn-buscar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-limpiar {
  padding: 9px 12px;
  background: transparent;
  color: #888;
  border: 1.5px solid #ccc;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-limpiar:hover {
  background: #fee;
  border-color: #f44;
  color: #f44;
}

/* Table header */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.table-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.results-count {
  font-size: 0.85rem;
  color: var(--text-muted, #888);
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-muted, #666);
}

.page-size-selector label {
  font-weight: 500;
  white-space: nowrap;
  min-width: unset;
  padding: 0;
}

.page-size-selector select {
  padding: 4px 8px;
  border-radius: 6px;
  border: 1.5px solid var(--border, #d0d0d0);
  font-size: 0.85rem;
  cursor: pointer;
  background: white;
  color: inherit;
  transition: border-color 0.2s;
  width: auto;
}

.page-size-selector select:focus {
  outline: none;
  border-color: var(--accent, #27b100);
}

.btn-nuevo {
  padding: 8px 18px;
  background: transparent;
  color: var(--accent, #27b100);
  border: 2px solid var(--accent, #27b100);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-nuevo:hover {
  background: var(--accent, #27b100);
  color: white;
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  color: var(--text-muted, #888);
  gap: 12px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e0e0e0;
  border-top-color: var(--accent, #27b100);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  color: var(--text-muted, #aaa);
  gap: 8px;
}

.empty-icon {
  font-size: 3rem;
}

/* Table */
.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid var(--border, #e0e0e0);
}

.certs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
}

.certs-table thead {
  background: var(--surface, #f4f4f4);
}

.certs-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 700;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted, #666);
  border-bottom: 2px solid var(--border, #e0e0e0);
}

.cert-row {
  border-bottom: 1px solid var(--border, #ebebeb);
  transition: background 0.15s;
}

.cert-row:last-child {
  border-bottom: none;
}

.cert-row:hover {
  background: rgba(39, 177, 0, 0.04);
}

.certs-table td {
  padding: 12px 16px;
  vertical-align: middle;
}

.folio-cell {
  white-space: nowrap;
}

.folio-badge {
  background: rgba(39, 177, 0, 0.1);
  color: var(--accent, #1a8000);
  border-radius: 6px;
  padding: 3px 10px;
  font-weight: 700;
  font-size: 0.85rem;
  font-family: monospace;
  letter-spacing: 0.05em;
}

.fecha-cell {
  white-space: nowrap;
  font-size: 0.85rem;
  color: var(--text-muted, #666);
}

.actions-cell {
  white-space: nowrap;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.15s;
  margin-right: 4px;
  background: transparent;
}

.btn-edit {
  color: #2196f3;
}
.btn-edit:hover {
  background: rgba(33, 150, 243, 0.12);
}

.btn-duplicate {
  color: #9c27b0;
}
.btn-duplicate:hover {
  background: rgba(156, 39, 176, 0.12);
}

.btn-delete {
  color: #f44336;
}
.btn-delete:hover {
  background: rgba(244, 67, 54, 0.12);
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  margin-top: 24px;
  flex-wrap: wrap;
}

.pagination--bottom {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border, #e8e8e8);
}

.page-btn,
.page-num {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1.5px solid #c8c8c8;
  background: #ffffff;
  color: #333;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.page-btn:hover:not(:disabled),
.page-num:hover {
  border-color: var(--accent, #27b100);
  color: var(--accent, #27b100);
}

.page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.page-num.active {
  background: var(--accent, #27b100);
  color: white;
  border-color: var(--accent, #27b100);
  font-weight: 700;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-info {
  font-size: 0.82rem;
  color: var(--text-muted, #888);
  margin-left: 6px;
}

/* Confirm dialog */
.overlay-confirm {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
  backdrop-filter: blur(3px);
}

.confirm-dialog {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 420px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.confirm-icon {
  font-size: 3rem;
  color: #f44336;
}

.confirm-dialog h3 {
  margin: 12px 0 8px;
  font-size: 1.2rem;
}

.confirm-dialog p {
  color: #555;
  font-size: 0.92rem;
  margin-bottom: 24px;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-cancel {
  padding: 10px 24px;
  border-radius: 8px;
  border: 1.5px solid #ccc;
  background: white;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-cancel:hover {
  border-color: #999;
  background: #f5f5f5;
}

.btn-confirm-delete {
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  background: #f44336;
  color: white;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-confirm-delete:hover:not(:disabled) {
  background: #d32f2f;
}

.btn-confirm-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .search-panel {
    background: #252525;
    border-color: #383838;
  }
  .search-field label {
    color: #888;
  }
  .search-field.active label {
    color: #6dda40;
  }
  /* Todos los estados del input en oscuro con background explícito */
  .search-field input,
  .search-field input:hover,
  .search-field input:focus,
  .search-field.active input,
  .search-field.active input:focus {
    background: #1a1a1a;
    border-color: #444;
    color: #e0e0e0;
  }
  .search-field input::placeholder {
    color: #555;
  }
  /* Solo en focus/active se agrega el borde verde */
  .search-field input:focus,
  .search-field.active input:focus {
    border-color: #6dda40;
    box-shadow: 0 0 0 3px rgba(109, 218, 64, 0.12);
  }
  .btn-limpiar {
    border-color: #444;
    color: #888;
  }
  .certs-table thead {
    background: #242424;
  }
  .certs-table th {
    color: #aaa;
    border-color: #3a3a3a;
  }
  .cert-row {
    border-color: #2a2a2a;
  }
  .cert-row:hover {
    background: rgba(39, 177, 0, 0.06);
  }
  .certs-table td {
    color: #e0e0e0;
  }
  .folio-badge {
    background: rgba(39, 177, 0, 0.15);
    color: #6dda40;
  }
  .table-wrapper {
    border-color: #3a3a3a;
  }
  .page-btn, .page-num {
    background: #1a1a1a;
    border-color: #3a3a3a;
    color: #e0e0e0;
  }
  .confirm-dialog {
    background: #1e1e1e;
    color: #e0e0e0;
  }
  .confirm-dialog p {
    color: #aaa;
  }
  .btn-cancel {
    background: #2a2a2a;
    border-color: #444;
    color: #e0e0e0;
  }
  .btn-limpiar {
    border-color: #3a3a3a;
    color: #888;
  }
  .page-size-selector select {
    background: #1a1a1a;
    border-color: #3a3a3a;
    color: #e0e0e0;
  }
  .pagination--bottom {
    border-top-color: #333;
  }
  .btn-nuevo {
    color: #6dda40;
    border-color: #6dda40;
  }
  .btn-nuevo:hover {
    background: #6dda40;
    color: #000;
  }
  .results-count {
    color: #888;
  }
}

@media (max-width: 767px) {
  .search-row {
    flex-direction: column;
    gap: 10px;
  }
  .search-field {
    min-width: 100%;
    flex: none;
  }
  .btn-buscar, .btn-limpiar {
    width: 100%;
    justify-content: center;
  }
  .certs-table th:nth-child(4),
  .certs-table td:nth-child(4) {
    display: none;
  }
}
</style>

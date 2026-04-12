<template>
  <div class="overlay-modal" @click.self="$emit('close')">
    <div class="modal-card">
      <!-- Header -->
      <div class="modal-header">
        <div class="modal-title">
          <span class="mdi" :class="modeIcon"></span>
          <h2>{{ modeTitle }}</h2>
        </div>
        <button class="btn-close" @click="$emit('close')">
          <span class="mdi mdi-close"></span>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-field">
            <label for="m-folio">Folio <span class="required">*</span></label>
            <input
              id="m-folio"
              type="text"
              v-model="form.folio"
              placeholder="ej. 001-2025"
              :disabled="mode === 'edit'"
              :class="{ 'field-disabled': mode === 'edit' }"
            />
          </div>
          <div class="form-field">
            <label for="m-fecha">Fecha</label>
            <div class="date-range">
              <input type="date" id="m-fecha-inicio" v-model="fechaInicioDate" />
              <span class="date-sep">AL</span>
              <input type="date" id="m-fecha-fin" v-model="fechaFinDate" />
            </div>
          </div>
          <div class="form-field full-width">
            <label for="m-cliente">Cliente</label>
            <input id="m-cliente" type="text" v-model="form.cliente" placeholder="Nombre del cliente" />
          </div>
          <div class="form-field full-width">
            <label for="m-domicilio">Domicilio</label>
            <input id="m-domicilio" type="text" v-model="form.domicilio" placeholder="Calle, número, colonia..." />
          </div>
          <div class="form-field">
            <label for="m-localidad">Localidad</label>
            <input id="m-localidad" type="text" v-model="form.localidad" placeholder="Ciudad / municipio" />
          </div>
          <div class="form-field full-width">
            <label for="m-tratamiento">Tratamiento</label>
            <textarea
              id="m-tratamiento"
              v-model="form.tratamiento"
              rows="3"
              placeholder="Descripción del tratamiento aplicado"
            ></textarea>
          </div>
          <div class="form-field full-width">
            <label for="m-areas">Áreas</label>
            <textarea
              id="m-areas"
              v-model="form.areas"
              rows="2"
              placeholder="Áreas tratadas"
            ></textarea>
          </div>
        </div>

        <!-- Error -->
        <div v-if="errorMsg" class="error-banner">
          <span class="mdi mdi-alert-circle"></span>
          {{ errorMsg }}
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn-secondary" @click="$emit('close')">Cancelar</button>
        <button class="btn-primary" @click="guardar" :disabled="saving">
          <span :class="saving ? 'mdi mdi-loading mdi-spin' : 'mdi mdi-content-save'"></span>
          {{ saving ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import axios from 'axios';

interface CertificadoForm {
  hash: string;
  folio: string;
  cliente: string;
  domicilio: string;
  localidad: string;
  fecha: string;
  tratamiento: string;
  areas: string;
  timestamp?: number;
  bitly?: string;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export default {
  name: 'CertificadoModal',
  emits: ['close', 'saved'],
  props: {
    // 'create' | 'edit' | 'duplicate'
    mode: {
      type: String,
      default: 'create',
    },
    // Initial data (for edit/duplicate)
    initialData: {
      type: Object as () => Partial<CertificadoForm>,
      default: () => ({}),
    },
  },
  data() {
    return {
      form: {
        hash: '',
        folio: '',
        cliente: '',
        domicilio: '',
        localidad: '',
        fecha: '',
        tratamiento: '',
        areas: '',
        bitly: '',
      } as CertificadoForm,
      fechaInicioDate: '',
      fechaFinDate: '',
      saving: false,
      errorMsg: '',
    };
  },
  computed: {
    modeTitle(): string {
      if (this.mode === 'edit') return 'Editar certificado';
      if (this.mode === 'duplicate') return 'Crear a partir de este';
      return 'Nuevo certificado';
    },
    modeIcon(): string {
      if (this.mode === 'edit') return 'mdi-pencil';
      if (this.mode === 'duplicate') return 'mdi-content-copy';
      return 'mdi-plus-circle';
    },
  },
  mounted() {
    if (this.initialData) {
      this.form = {
        hash: this.initialData.hash ?? '',
        folio: this.mode === 'duplicate' ? '' : (this.initialData.folio ?? ''),
        cliente: this.initialData.cliente ?? '',
        domicilio: this.initialData.domicilio ?? '',
        localidad: this.initialData.localidad ?? '',
        fecha: this.initialData.fecha ?? '',
        tratamiento: this.initialData.tratamiento ?? '',
        areas: this.initialData.areas ?? '',
        bitly: this.initialData.bitly ?? '',
      };
      this.parseFecha(this.form.fecha);
    }
  },
  methods: {
    parseFecha(fechaStr: string) {
      if (fechaStr && fechaStr.includes(' AL ')) {
        const parts = fechaStr.split(' AL ');
        this.fechaInicioDate = this.toYYYYMMDD(parts[0].trim());
        this.fechaFinDate = this.toYYYYMMDD(parts[1].trim());
      }
    },
    toYYYYMMDD(s: string) {
      if (!s) return '';
      const p = s.split('-');
      if (p.length === 3) return `${p[2]}-${p[1]}-${p[0]}`;
      return s;
    },
    toDDMMYYYY(s: string) {
      if (!s) return '';
      const p = s.split('-');
      if (p.length === 3) return `${p[2]}-${p[1]}-${p[0]}`;
      return s;
    },
    buildFechaStr(): string {
      if (this.fechaInicioDate && this.fechaFinDate) {
        return `${this.toDDMMYYYY(this.fechaInicioDate)} AL ${this.toDDMMYYYY(this.fechaFinDate)}`;
      } else if (this.fechaInicioDate) {
        return this.toDDMMYYYY(this.fechaInicioDate);
      }
      return this.form.fecha;
    },
    validate(): boolean {
      if (!this.form.folio.trim()) {
        this.errorMsg = 'El folio es requerido.';
        return false;
      }
      this.errorMsg = '';
      return true;
    },
    async guardar() {
      if (!this.validate()) return;
      this.saving = true;
      this.errorMsg = '';

      this.form.fecha = this.buildFechaStr();

      try {
        if (this.mode === 'edit') {
          // PUT - replace all fields
          const payload = {
            hash: this.form.hash,
            cliente: this.form.cliente,
            domicilio: this.form.domicilio,
            localidad: this.form.localidad,
            fecha: this.form.fecha,
            tratamiento: this.form.tratamiento,
            areas: this.form.areas,
            bitly: this.form.bitly,
          };
          await axios.put(
            `${apiBaseUrl}/api/certificados/${encodeURIComponent(this.form.folio)}`,
            payload,
            { headers: { 'Content-Type': 'application/json' } }
          );
        } else {
          // POST - create new (create or duplicate)
          const payload = [{
            hash: this.form.hash || this.generateHash(this.form.folio),
            folio: this.form.folio,
            cliente: this.form.cliente,
            domicilio: this.form.domicilio,
            localidad: this.form.localidad,
            fecha: this.form.fecha,
            tratamiento: this.form.tratamiento,
            areas: this.form.areas,
            timestamp: Date.now(),
            bitly: this.form.bitly,
          }];
          await axios.post(
            `${apiBaseUrl}/api/certificados`,
            payload,
            { headers: { 'Content-Type': 'application/json' } }
          );
        }
        this.$emit('saved');
      } catch (e: any) {
        const status = e?.response?.status;
        if (status === 400) {
          this.errorMsg = 'Datos inválidos. Verifica los campos e intenta nuevamente.';
        } else if (status === 404) {
          this.errorMsg = 'Certificado no encontrado.';
        } else {
          this.errorMsg = 'Error al guardar. Intenta de nuevo.';
        }
        console.error(e);
      } finally {
        this.saving = false;
      }
    },
    generateHash(folio: string): string {
      // Simple hash for new records without going through full generation flow
      const str = folio + Date.now();
      let h = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        h = (h << 5) - h + char;
        h = h & h;
      }
      return Math.abs(h).toString(16).padStart(8, '0') + Date.now().toString(16);
    },
  },
};
</script>

<style scoped>
.overlay-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 600;
  backdrop-filter: blur(4px);
  padding: 16px;
}

.modal-card {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.25s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px 20px;
  border-bottom: 1px solid #eee;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-title .mdi {
  font-size: 1.4rem;
  color: var(--accent, #27b100);
}

.modal-title h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
}

.btn-close {
  width: 36px;
  height: 36px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  transition: all 0.15s;
  color: #555;
}

.btn-close:hover {
  background: #ffe0e0;
  color: #f44336;
}

.modal-body {
  padding: 24px 28px;
  overflow-y: auto;
  flex: 1;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field.full-width {
  grid-column: 1 / -1;
}

.form-field label {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #666;
}

.required {
  color: #f44336;
}

.form-field input,
.form-field textarea {
  padding: 10px 14px;
  border: 1.5px solid #d0d0d0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
  background: white;
  color: #222;
}

.form-field input:focus,
.form-field textarea:focus {
  outline: none;
  border-color: var(--accent, #27b100);
  box-shadow: 0 0 0 3px rgba(39, 177, 0, 0.1);
}

.field-disabled {
  background: #f5f5f5 !important;
  color: #888 !important;
  cursor: not-allowed;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 6px;
}

.date-range input {
  flex: 1;
  padding: 10px 10px;
}

.date-sep {
  font-size: 0.75rem;
  font-weight: 700;
  color: #888;
  white-space: nowrap;
}

.error-banner {
  margin-top: 16px;
  padding: 12px 16px;
  background: #fff3f3;
  border: 1px solid #fcc;
  border-radius: 8px;
  color: #d32f2f;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.modal-footer {
  padding: 16px 28px 24px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-secondary {
  padding: 10px 24px;
  border-radius: 8px;
  border: 1.5px solid #ccc;
  background: white;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.btn-secondary:hover {
  border-color: #999;
  background: #f5f5f5;
}

.btn-primary {
  padding: 10px 28px;
  border-radius: 8px;
  border: none;
  background: var(--accent, #27b100);
  color: white;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #1e9400;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .modal-card {
    background: #1e1e1e;
    color: #e0e0e0;
  }
  .modal-header, .modal-footer {
    border-color: #333;
  }
  .form-field input,
  .form-field textarea {
    background: #2a2a2a;
    border-color: #444;
    color: #e0e0e0;
  }
  .form-field label {
    color: #aaa;
  }
  .btn-close {
    background: #2a2a2a;
    color: #aaa;
  }
  .btn-close:hover {
    background: #3a1a1a;
    color: #f44;
  }
  .field-disabled {
    background: #252525 !important;
    color: #666 !important;
  }
  .btn-secondary {
    background: #2a2a2a;
    border-color: #444;
    color: #e0e0e0;
  }
  .btn-secondary:hover {
    background: #333;
    border-color: #666;
  }
  .error-banner {
    background: #2a1010;
    border-color: #5a2020;
    color: #f88;
  }
}

@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .date-range {
    flex-wrap: wrap;
  }
  .date-range input {
    flex: 1 1 120px;
  }
  .modal-footer {
    flex-direction: column-reverse;
  }
  .btn-primary, .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}
</style>

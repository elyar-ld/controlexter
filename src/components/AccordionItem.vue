<template>
    <li class="accordion__item">
      <div 
        class="accordion__trigger"
        :class="{'accordion__trigger_active': visible}"
        @click="open">
  
        <h4>{{folio}}</h4>
        <slot name="accordion-trigger"></slot>
      </div>
  
      <transition 
        name="accordion"
        @enter="start"
        @after-enter="end"
        @before-leave="start"
        @after-leave="end">
  
        <div class="accordion__content"
          v-show="visible">
          <ul>
            <div class="named-field">
              <label :for="'nuevo-folio-'+folio">Nuevo folio: </label> <input type="text" :id="'nuevo-folio-' + folio" :value="folio" @input="(event) => $emit('update:folio', event.target.value)" >
            </div>
            <div class="named-field">
              <label for="cliente">Cliente: </label> <input type="text" :id="'cliente-'+ folio" :value="cliente" @input="(event) => $emit('update:cliente', event.target.value)">
            </div>
            <div class="named-field">
              <label for="domicilio">Domicilio: </label> <input type="text" :id="'domicilio-' + folio" :value="domicilio" @input="(event) => $emit('update:domicilio', event.target.value)">
            </div>
            <div class="named-field">
              <label for="localidad">Localidad: </label> <input type="text" :id="'localidad' + folio" :value="localidad" @input="(event) => $emit('update:localidad', event.target.value)">
            </div>
            <div class="named-field">
              <label for="fecha">Fecha: </label>
              <div style="display: inline-flex; gap: 5px; align-items: center;">
                <input type="date" :id="'fecha-inicio-' + folio" v-model="fechaInicioDate">
                <span>AL</span>
                <input type="date" :id="'fecha-fin-' + folio" v-model="fechaFinDate">
              </div>
            </div>
            <div class="named-field">
              <label for="tipo_tratamiento">Tipo de tratamiento:</label>
              <select name="tipo_tratamiento" :id="'tipo_tratamiento-' + folio" v-model="innerTipoTratamiento" @change="(event) => $emit('change:tipoTratamiento', innerTipoTratamiento)">
                <option value="fumigacion">Fumigación</option>
                <option value="desinfeccion">Desinfección</option>
              </select>
            </div>
            <div class="named-field">
              <label for="productos">Productos: </label>
              <select name="productos" :id="'productos-' + folio" multiple="multiple" v-model="innerProductosSelected" @change="(event) => $emit('change:productosSelected', innerProductosSelected)">
                <option v-for="(value, key, index) in lista_productos[innerTipoTratamiento]" :value="key">{{value['producto']}}</option>
              </select>
            </div>
            <div class="named-field">
              <label for="dosis">Dosis: </label> <input type="text" :id="'dosis-' + folio" placeholder="Separadas por comas" inputmode="numeric" :value="dosis" @input="(event) => $emit('update:dosis', event.target.value)"><span>ml/L</span>
            </div>
            <div class="named-field">
              <label for="areas">Áreas: </label><textarea name="areas" :id="'areas-' + folio" cols="30" rows="2" :value="areas" @input="(event) => $emit('update:areas', event.target.value)"></textarea>
            </div>
            
            
            
            
                        
            
          </ul>
        </div>
      </transition>
    </li>
  </template>
  
  
  <script>
  import { lista_productos } from '../constants/productos';

  export default { //v-model="productosSelected"
    props: {
      indice: {
        type: Number,
        required: true
      },
      folio: {
        type: String,
        default: "",
      },
      cliente: {
        type: String,
        default: "",
      },
      domicilio: {
        type: String,
        default: "",
      },
      localidad: {
        type: String,
        default: "",
      },
      fecha: {
        type: String,
        default: "",
      },
      tipoTratamiento: {
        type: String,
        default: "fumigacion",
      },
      productos: {
        type: Array,
        default: [],
      },
      productosSelected: {
        type: Array,
        default: [],
      },
      dosis: {
        type: String,
        default: "",
      },
      areas: {
        type: String,
        default: "",
      },
    },
    inject: ["Accordion"],
    data() {
      return {
        index: null,
        innerTipoTratamiento: this.tipoTratamiento,
        innerProductosSelected: this.productosSelected,
        fechaInicioDate: "",
        fechaFinDate: "",
        lista_productos
      };
    },
    mounted() {
      this.parseFechaProp(this.fecha);
    },
    computed: {
      visible() {
        return this.index == this.Accordion.active;
      }
    },
    methods: {
      open() {
        if (this.visible) {
          this.Accordion.active = null;
        } else {
          this.Accordion.active = this.index;
        }
      },
      start(el) {
        el.style.height = el.scrollHeight + "px";
      },
      end(el) {
        el.style.height = "";
      },
      parseFechaProp(fechaStr) {
        if (fechaStr && fechaStr.includes(" AL ")) {
          const partes = fechaStr.split(" AL ");
          if (partes.length === 2) {
            this.fechaInicioDate = this.toYYYYMMDD(partes[0].trim());
            this.fechaFinDate = this.toYYYYMMDD(partes[1].trim());
          }
        }
      },
      toYYYYMMDD(dateStr) {
        if(!dateStr) return "";
        const p = dateStr.split('-');
        if (p.length === 3) {
          return `${p[2]}-${p[1]}-${p[0]}`;
        }
        return dateStr;
      },
      toDDMMYYYY(dateStr) {
        if(!dateStr) return "";
        const p = dateStr.split('-');
        if (p.length === 3) {
          return `${p[2]}-${p[1]}-${p[0]}`;
        }
        return dateStr;
      },
      updateFechaStr() {
        if (this.fechaInicioDate && this.fechaFinDate) {
          const newFecha = `${this.toDDMMYYYY(this.fechaInicioDate)} AL ${this.toDDMMYYYY(this.fechaFinDate)}`;
          this.$emit('update:fecha', newFecha);
        }
      }
    },
    created() {
      this.index = this.Accordion.count++;
    },
    watch: {
      tipoTratamiento: function(newVal){this.innerTipoTratamiento = newVal},
      productosSelected: function(newVal){
        this.innerProductosSelected = newVal;
        console.log(this.innerProductosSelected, this.tipoTratamiento);
        this.$emit('productosSeleccionadosChanged', this.innerProductosSelected.map(x => this.lista_productos[this.tipoTratamiento][x]));
      },
      fecha: function(newVal) {
        this.parseFechaProp(newVal);
      },
      fechaInicioDate: function() {
        this.updateFechaStr();
      },
      fechaFinDate: function() {
        this.updateFechaStr();
      }
    }
  };
  </script>
  
  <style lang="css" scoped>

  .accordion__item {
    cursor: pointer;
    padding: 10px;
    padding-bottom: 1px;
    margin-bottom: 9px;
    border-bottom: 1px solid #ebebeb;
    position: relative;
  }
  
  .accordion__trigger {
    display: flex;
    justify-content: space-between;
  }
  
  .accordion-enter-active,
  .accordion-leave-active {
    will-change: height, opacity;
    transition: height 0.3s ease, opacity 0.3s ease;
    overflow: hidden;
  }
  
  .accordion-enter,
  .accordion-leave-to {
    height: 0 !important;
    opacity: 0;
  }
  
  @media (prefers-color-scheme: dark) {
    h4{color:white}
  }
  </style>
  

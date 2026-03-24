<template>
  <li class="camposcomunes__item">
    <div class="camposcomunes__trigger" :class="{ 'camposcomunes__trigger_active': visible }" @click="open">

      <h4>Campos Comunes</h4>
    </div>

    <transition name="camposcomunes" @enter="start" @after-enter="end" @before-leave="start" @after-leave="end">

      <div class="camposcomunes__content" v-show="visible">
        <ul>
          <div class="named-field">
            <label for="cliente"><input type="checkbox" id="cliente-checkbox" value="cliente"
              v-model="camposSeleccionados">Cliente: </label> <input type="text" id="cliente"
            v-model="valoresCampos.cliente">
          </div>
          <div class="named-field">
            <label for="domicilio"><input type="checkbox" id="domicilio-checkbox" value="domicilio"
              v-model="camposSeleccionados">Domicilio: </label> <input type="text" id="domicilio"
              v-model="valoresCampos.domicilio">
          </div>
          <div class="named-field">
            <label for="localidad"><input type="checkbox" id="localidad-checkbox" value="localidad"
              v-model="camposSeleccionados">Localidad: </label> <input type="text" id="localidad"
            v-model="valoresCampos.localidad">
          </div>
          <div class="named-field">
            <label for="fecha"><input type="checkbox" id="fecha-checkbox" value="fecha" v-model="camposSeleccionados">Fecha:
            </label> <input type="text" id="fecha" v-model="valoresCampos.fecha">
          </div>
          <div class="named-field">
            <label for="tipo_tratamiento"><input type="checkbox" id="productos-checkbox" value="productos"
              v-model="camposSeleccionados">Tipo de tratamiento:</label>
            <select name="tipo_tratamiento" id="tipo_tratamiento" v-model="valoresCampos.tipoTratamiento">
              <option value="fumigacion">Fumigación</option>
              <option value="desinfeccion">Desinfección</option>
            </select>
          </div>
          <div class="named-field">
            <label for="productos">Productos: </label>
            <select name="productos" id="productos" multiple="multiple" v-model="valoresCampos.productosSelected">
              <option v-for="(value, key, index) in lista_productos[valoresCampos.tipoTratamiento]" :value="key">
                {{ value['producto'] }}</option>
            </select>
            
          </div>
          <div class="named-field">
            <label for="dosis">Dosis: </label> <input type="text" id="dosis" placeholder="Separadas por comas"
            inputmode="numeric" v-model="valoresCampos.dosis"><span>ml/L</span>
          </div>
          <div class="named-field">
            <label for="areas"><input type="checkbox" id="areas-checkbox" value="areas" v-model="camposSeleccionados">Áreas:
            </label><textarea name="areas" id="areas" cols="30" rows="2" v-model="valoresCampos.areas"></textarea>
          </div>
                    
        </ul>
      </div>
    </transition>
  </li>
</template>


<script>
import { lista_productos } from '../constants/productos';

export default {
  props: {
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
    tipo_tratamiento: {
      type: String,
      default: "fumigacion",
    },
    productos: {
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
      camposSeleccionados: [],
      valoresCampos: {
        cliente: "",
        domicilio: "",
        localidad: "",
        fecha: "",
        areas: "",
        productos: [],
        productosSelected: [],
        tipoTratamiento: "",
        dosis: "",
      },
      lista_productos
    };
  },
  computed: {
    visible() {
      return this.index == this.Accordion.active;
    }
  },
  mounted() {
    this.valoresCampos.tipoTratamiento = (' ' + this.tipo_tratamiento).slice(1);
    this.valoresCampos.fecha = this.getDates();
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
    getDates() {
      let rangoFechas = "";
      let d = new Date();
      let dia = d.getDate();
      let mes = d.getMonth() + 1;
      let anio = d.getFullYear();
      rangoFechas += `${dia < 10 ? "0" + dia : dia}-${mes < 10 ? "0" + mes : mes}-${anio}`;

      d.setMonth(d.getMonth() + 1);

      dia = d.getDate();
      mes = d.getMonth() + 1;
      anio = d.getFullYear();
      rangoFechas += ` AL ${dia < 10 ? "0" + dia : dia}-${mes < 10 ? "0" + mes : mes}-${anio}`;

      console.log(rangoFechas);
      return rangoFechas;
    }
  },
  created() {
    this.index = this.Accordion.count++;
  },
  watch: {
    camposSeleccionados: function () {
      this.valoresCampos.productos = this.valoresCampos.productosSelected.map(x => this.lista_productos[this.valoresCampos.tipoTratamiento][x]);
      this.$emit('camposSeleccionadosChanged', { campos: this.camposSeleccionados, valores: this.valoresCampos });
    }
  }
};
</script>

<style lang="css" scoped>
.camposcomunes__item {
  cursor: pointer;
  margin-bottom: 25px;
  position: relative;
}

.camposcomunes__content {
  background: #f1f1f1;
  padding-top: 20px;
  padding-bottom: 10px;
}

.camposcomunes__trigger {
  display: flex;
  justify-content: space-between;
  background: #44a04726;
  border-radius: 10px;
  padding-left: 10px;
}

.camposcomunes-enter-active,
.camposcomunes-leave-active {
  will-change: height, opacity;
  transition: height 0.3s ease, opacity 0.3s ease;
  overflow: hidden;
}

.camposcomunes-enter,
.camposcomunes-leave-to {
  height: 0 !important;
  opacity: 0;
}

@media (prefers-color-scheme: dark) {
  h4 {
    color: white
  }

  .camposcomunes__content {
    background-color: #3b3b3b;
  }

  .camposcomunes__trigger {
    background-color: #144d16;
  }
}
</style>

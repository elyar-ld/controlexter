<script lang="ts">
import { ref, onMounted } from 'vue';
import Accordion from "./components/Accordion.vue";
import AccordionItem from "./components/AccordionItem.vue";
import CamposComunes from "./components/CamposComunes.vue";
import CertificadosList from "./components/CertificadosList.vue";
import CertificadoModal from "./components/CertificadoModal.vue";
import axios from 'axios';
import md5 from 'md5'

import { qrCodeF } from "./models/qrcodestyling_model";
// @ts-ignore
import { createReport } from 'https://unpkg.com/docx-templates/lib/browser.js';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const baseURL = ref('');

onMounted(() => {
  baseURL.value = import.meta.env.BASE_URL;
});

interface Certificado {
  areas: string;
  cliente: string;
  domicilio: string;
  dosis: string;
  fecha: string;
  folio: string;
  localidad: string;
  productos: Array<{ producto: string, registro: string }>;
  productosSelected: Array<string>;
  tipoTratamiento: string;
  tratamiento: string;
};

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

export default {
  name: "App",
  components: {
    Accordion,
    AccordionItem,
    CamposComunes,
    CertificadosList,
    CertificadoModal,
  },
  mounted(){
    this.obtieneUltimoFolio();
    console.log("%c%s", "background: linear-gradient(0deg, #026000 0%, #27b100 100%);margin: 10px;padding: 10px;color: white;text-align: center;", `Control Exter v. ${this.appVersion}`)
    window.addEventListener("beforeunload", this.handleBeforeUnload);
    
    // PWA Back button trap
    history.pushState(null, '', location.href);
    window.addEventListener("popstate", this.handlePopState);
  },
  beforeUnmount() {
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
    window.removeEventListener("popstate", this.handlePopState);
  },
  data() {
    return {
      appVersion: '1.1.0',
      // Navigation
      activeTab: 'generador' as 'generador' | 'directorio',
      // Generator section
      res: '',
      folioInicial: "" as string,
      listaCerts: "",
      dataCerts: [] as Array<Certificado>,
      dataCamposComunes: {
        cliente: "",
        domicilio: "",
        localidad: "",
        fecha: "",
        areas: "",
      },
      color: "red",
      isGeneratingCerts: false,
      loading: false,
      // CRUD modal
      modalMode: 'create' as 'create' | 'edit' | 'duplicate',
      modalData: {} as Partial<CertificadoItem>,
      showModal: false,
    }
  },
  methods: {
    // ─── GENERADOR ──────────────────────────────────────────────
    async creaDocumento(datos: any) {
      const template = await fetch(baseURL.value + 'plantilla_certificado.docx?v=2603202602').then(res => res.arrayBuffer());
      let data = await this.generateQR(datos.short_url).then((value) => value);
      console.log(data);
      data = data.split(';base64,')[1];

      const report = await createReport({
        template,
        data: datos,
        additionalJsContext: {
          qr: (url: string) => {
            console.log(url);
            return { width: 3, height: 3, data, extension: '.png' };
          },
        }
      });

      this.saveDataToFile(
        report,
        `CERTIFICADO ${datos.folio} ${datos.cliente.slice(0, 50)}.docx`,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
    },
    saveDataToFile(data: BlobPart, fileName: string, mimeType: string) {
      const blob = new Blob([data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      this.downloadURL(url, fileName);
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    },
    downloadURL(data: string, fileName: string) {
      let a = document.createElement('a');
      a.href = data;
      a.download = fileName;
      document.body.appendChild(a);
      a.setAttribute('style', 'display: none');
      a.click();
      a.remove();
    },
    obtieneFolio(index: number): string {
      let numero: number = parseInt(this.folioInicial.split('-')[0]);
      let anio: number = parseInt(this.folioInicial.split('-')[1]);
      this.dataCerts[index].folio = `${String(numero + index).padStart(3, '0')}-${anio}`;
      return `${String(numero + index).padStart(3, '0')}-${anio}`;
    },
    obtieneInfoCerts() {
      if (this.listaCerts === "") return;
      let getUrl = apiBaseUrl + '/api/certificados/getdata';
      let encodedData = JSON.stringify(this.prepararBusqueda(this.listaCerts));
      encodedData = encodeURIComponent(encodedData.replaceAll('\\"',''));
      const urlWithParams = getUrl + "?data=" + encodedData;
      console.log(urlWithParams);
      axios.get(urlWithParams, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
          'Content-Type': 'application/json',
        },
      }).then(response => {
        console.log(response.data);
        this.dataCerts = response.data;
        for (let cert of this.dataCerts) {
          cert['tipoTratamiento'] = "fumigacion" as string;
          cert.productos = [];
          cert.productosSelected = [];
          cert['dosis'] = "" as string;
        }
      }).catch(e => {
        console.log(e);
      })
    },
    prepararBusqueda(listaCerts: string) {
      listaCerts = listaCerts.replaceAll(" ", "");
      let commaSep = listaCerts.split(",");
      let resultado: string[] = [];
      for (let range of commaSep) {
        if (range.lastIndexOf("&") !== -1) {
          let inicio: number = parseInt(range.split("&")[0].split("-")[0]);
          let fin: number = parseInt(range.split("&")[1].split("-")[0]);
          let anio: string = range.split("&")[1].split("-")[1];
          for (inicio; inicio <= fin; inicio++) {
            resultado.push(`"${String(inicio).padStart(3, '0') + "-" + anio}"`);
          }
          continue;
        }
        resultado.push(`"${range}"`);
      }
      return resultado;
    },
    actualizaCamposComunes(campos: { campos: Array<keyof Certificado>; valores: any }) {
      if(campos.campos.includes('productos' )){
        campos.campos = campos.campos.concat(['tipoTratamiento','dosis','productosSelected']);
      }
      console.log(campos);
      for (let certificado of this.dataCerts) {
        for (let campo of campos.campos) {
          if (campo.toString() === 'productosSelected') {
            certificado.productosSelected = campos.valores['productosSelected'];
          }
          certificado[campo] = campos.valores[campo];
        }
      }
    },
    async generaCertificados() {
      this.isGeneratingCerts = true;
      this.loading = true;

      let textoTratamientos: { fumigacion: string, desinfeccion: string } = {
        fumigacion: "TRATAMIENTO CORRECTIVO Y PREVENTIVO PARA PLAGAS RASTRERAS Y VOLADORAS. SE APLICÓ: " as string,
        desinfeccion: "TRATAMIENTO CORRECTIVO Y PREVENTIVO DE DESINFECCIÓN PARA BACTERIAS, VIRUS, ALGAS Y HONGOS. SE APLICÓ: " as string
      };

      let certificadosARegistrar: Array<any> = [];
      for (let cert of this.dataCerts) {
        console.log(cert.dosis);
        let texto: string = textoTratamientos[cert.tipoTratamiento as keyof Object].toString();
        let dosises: Array<string> = [];

        if (cert.dosis.trim() === "")
          dosises = Array(cert.productos.length).fill('');
        else
          dosises = cert.dosis.split(",").map(x => `, ${x}ml/L`);

        for (let i in cert.productos) {
          console.log(cert.productos);
          texto += `${cert.productos[i].producto}, ${cert.productos[i].registro}${dosises[i]}. `;
        }

        let timestamp = Date.now();
        let hash: string = md5(cert.folio + timestamp);
        
        const headers = {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
          'Access-Control-Allow-Credentials': true
        };
        const dataString = { "url": `https://validador.extercontrol.com/?hash=${hash}` };

        let postUrl = apiBaseUrl + '/api/certificados/shorturl';
        await axios.post(postUrl, dataString, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
            'Content-Type': 'application/json',
          },
        }).then(response => {
          console.log(response.data);
          certificadosARegistrar.push({
            hash: hash,
            folio: cert.folio,
            cliente: cert.cliente,
            domicilio: cert.domicilio,
            localidad: cert.localidad,
            fecha: cert.fecha,
            tratamiento: texto.toUpperCase(),
            areas: cert.areas,
            timestamp: timestamp,
            bitly: response.data.data.tiny_url
          });
          console.log(response.data.data.tiny_url)
        }).catch(e => {
          console.log(e);
        })
      }
      console.log(JSON.stringify(certificadosARegistrar));

      let postUrl = apiBaseUrl + '/api/certificados';
      axios.post(postUrl, certificadosARegistrar, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
          'Content-Type': 'application/json',
        },
      }).then(response => {
        for (let cert of certificadosARegistrar) {
          this.creaDocumento({ hash_verificacion: cert.hash, folio: cert.folio, cliente: cert.cliente, domicilio: cert.domicilio, localidad: cert.localidad, fecha: cert.fecha, tratamiento: cert.tratamiento, areas: cert.areas, short_url: cert.bitly });
        }
        console.log(response.data);
      }).catch(e => {
        console.log(e);
      })

      this.isGeneratingCerts = false;
      this.loading = false;
    },
    async generateQR(url: string) {
      const qrCode = qrCodeF(url);
      const reader = new FileReader();
      const blobQr = await qrCode.getRawData().then((value) => value);
      return new Promise<string>((resolve, reject) => {
        reader.onerror = () => {
          reader.abort();
          reject(new DOMException("Problem parsing input file."));
        };
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(blobQr as Blob);
      });
    },
    obtieneUltimoFolio() {
      let getUrl = apiBaseUrl + '/api/certificados/last/record';
      axios.get(getUrl, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
          'Content-Type': 'application/json',
        },
      }).then(response => {
        console.log(response.data);
        const folioInicialArr = response.data["last_folio"].split("-");
        this.folioInicial = `${String(parseInt(folioInicialArr[0])+1).padStart(3, '0')}-${folioInicialArr[1]}`;
        this.color = "green";
      }).catch(e => {
        console.log(e);
      })
    },
    handleBeforeUnload(event: BeforeUnloadEvent) {
      if (this.hayCambiosSinGuardar) {
        event.preventDefault();
        event.returnValue = '';
      }
    },
    handlePopState(event: PopStateEvent) {
      if (this.hayCambiosSinGuardar) {
        const confirmar = confirm("Tienes cambios sin guardar. ¿Estás seguro de que deseas salir y perderlos?");
        if (!confirmar) {
          history.pushState(null, '', location.href);
        } else {
          history.back();
        }
      } else {
        history.back();
      }
    },

    // ─── CRUD MODAL ──────────────────────────────────────────────
    abrirModalNuevo() {
      this.modalMode = 'create';
      this.modalData = {};
      this.showModal = true;
    },
    abrirModalEditar(cert: CertificadoItem) {
      this.modalMode = 'edit';
      this.modalData = { ...cert };
      this.showModal = true;
    },
    abrirModalDuplicar(cert: CertificadoItem) {
      this.modalMode = 'duplicate';
      this.modalData = { ...cert };
      this.showModal = true;
    },
    cerrarModal() {
      this.showModal = false;
      this.modalData = {};
    },
    onModalSaved() {
      this.showModal = false;
      this.modalData = {};
      // Refresh the list
      const list = this.$refs.certsList as any;
      if (list) list.refresh();
    },
  },
  computed: {
    spanStyle() {
      return {
        color: this.color,
      };
    },
    hayCambiosSinGuardar(): boolean {
      if (this.activeTab === 'directorio') return false;
      if (this.listaCerts && this.listaCerts.trim() !== '') return true;
      if (this.dataCerts && this.dataCerts.length > 0) return true;
      if (this.dataCamposComunes.cliente.trim() !== '' || 
          this.dataCamposComunes.domicilio.trim() !== '' || 
          this.dataCamposComunes.localidad.trim() !== '' || 
          this.dataCamposComunes.fecha.trim() !== '' || 
          this.dataCamposComunes.areas.trim() !== '') {
        return true;
      }
      return false;
    }
  },
};
</script>

<template>
  <header>
    <img src="./assets/controlExter_logo.svg" alt="Control Exter Logo" id="logo">
    <div class="header-titles">
      <h1>Control Exter <span :style="spanStyle">⬤</span></h1>
      <span class="app-version">v. {{ appVersion }}</span>
    </div>
  </header>

  <!-- Tab Navigation -->
  <nav class="tab-nav" role="tablist">
    <button
      id="tab-generador"
      role="tab"
      class="tab-btn"
      :class="{ 'tab-active': activeTab === 'generador' }"
      @click="activeTab = 'generador'"
      :aria-selected="activeTab === 'generador'"
    >
      <span class="mdi mdi-file-sign"></span>
      Generador
    </button>
    <button
      id="tab-directorio"
      role="tab"
      class="tab-btn"
      :class="{ 'tab-active': activeTab === 'directorio' }"
      @click="activeTab = 'directorio'"
      :aria-selected="activeTab === 'directorio'"
    >
      <span class="mdi mdi-archive-search"></span>
      Directorio
    </button>
  </nav>

  <!-- ── GENERADOR TAB ── -->
  <div v-show="activeTab === 'generador'" class="tab-content" role="tabpanel" aria-labelledby="tab-generador">
    <fieldset id="buscador-fields">
      <div class="named-field">
        <label for="buscador">Generar a partir de:</label>
        <input type="text" placeholder="Usa / como rango y , como separador" id="buscador" name="buscador" v-model="listaCerts">
      </div>
      <div class="named-field">
        <label for="folio_inicial">Folio inicial: </label>
        <input type="text" placeholder="nnn-AAAA" id="folio_inicial" name="folio_inicial" v-model="folioInicial">
      </div>
      <button type="submit" @click="obtieneInfoCerts"><span class="mdi mdi-magnify"></span> Buscar</button>
    </fieldset>

    <div>
      <Accordion>
        <CamposComunes @camposSeleccionadosChanged="actualizaCamposComunes" :cliente="dataCamposComunes.cliente"
          :domicilio="dataCamposComunes.domicilio" :localidad="dataCamposComunes.localidad"
          :fecha="dataCamposComunes.fecha" :areas="dataCamposComunes.areas">
        </CamposComunes>
      </Accordion>
    </div>

    <div>
      <Accordion>
        <AccordionItem v-for="(certificado, index) in dataCerts" 
          :folio="obtieneFolio(index)" @update:folio="certificado.folio = $event" 
          :cliente="certificado.cliente" @update:cliente="certificado.cliente = $event" 
          :domicilio="certificado.domicilio" @update:domicilio="certificado.domicilio = $event" 
          :localidad="certificado.localidad" @update:localidad="certificado.localidad = $event" 
          :fecha="certificado.fecha" @update:fecha="certificado.fecha = $event" 
          :tipoTratamiento="certificado.tipoTratamiento" @change:tipoTratamiento="certificado.tipoTratamiento = $event" 
          :productos="certificado.productos" @update:productos="certificado.productos = $event" 
          :productosSelected="certificado.productosSelected" @change:productosSelected="certificado.productosSelected = $event" 
          :dosis="certificado.dosis" @update:dosis="certificado.dosis = $event" 
          :areas="certificado.areas" @update:areas="certificado.areas = $event"
          @productosSeleccionadosChanged="certificado.productos = $event"
          :indice="index">
        </AccordionItem>
      </Accordion>
    </div>

    <button id="boton-generar" @click="generaCertificados" type="submit" v-bind:disabled="isGeneratingCerts">
      <span class="mdi mdi-file-sign"></span> Generar
    </button>
  </div>

  <!-- ── DIRECTORIO TAB ── -->
  <div v-show="activeTab === 'directorio'" class="tab-content" role="tabpanel" aria-labelledby="tab-directorio">
    <CertificadosList
      ref="certsList"
      @editar="abrirModalEditar"
      @duplicar="abrirModalDuplicar"
      @nuevo="abrirModalNuevo"
    />
  </div>

  <!-- Loading popup (Generador) -->
  <div v-if="loading" class="loading-popup">
    <div class="loading-content">
      <img src="./assets/bee.gif" alt="Loading">
      <p>Generando...</p>
    </div>
  </div>

  <!-- CRUD Modal -->
  <CertificadoModal
    v-if="showModal"
    :mode="modalMode"
    :initial-data="modalData"
    @close="cerrarModal"
    @saved="onModalSaved"
  />
</template>

<style>
@import "style.css";

header{
  padding: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}

.header-titles {
  text-align: right;
}

.app-version {
  font-size: 0.8rem;
  color: #888;
  opacity: 0.7;
}

h1 {
  font-size: 1.6rem;
  margin: 0 0 2px;
  line-height: 1.2;
}

#logo { margin: 0; width: 200px; }

/* Tab Navigation */
.tab-nav {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 28px;
}

.tab-btn {
  padding: 10px 22px;
  border: none;
  background: transparent;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  color: #888;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  border-radius: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  transition: color 0.2s, border-color 0.2s;
}

.tab-btn:hover {
  color: #27b100;
  border-color: transparent;
}

.tab-btn.tab-active {
  color: #27b100;
  border-bottom-color: #27b100;
}

.tab-content {
  min-height: 200px;
}

/* ── Generador styles ── */
label {
  padding-right: 5px;
}

.named-field{
  display: flex;
  align-items: baseline;
}

.named-field label{
  min-width: 190px;
}

.Accordion {
  background-color: #eee;
  color: #444;
  cursor: pointer;
  padding: 18px;
  width: 100%;
  border: none;
  text-align: left;
  outline: none;
  font-size: 15px;
  transition: 0.4s;
}

.Accordion:hover {
  background-color: #ccc;
}

.panel {
  padding: 0 18px;
  display: none;
  background-color: white;
  overflow: hidden;
}

.loading-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.loading-content {
  text-align: center;
  color: #005512;
  font-weight: 800;
}

#boton-generar {
  margin-top: 10px;
}

input[type="text"], select, select[multiple], textarea{
  width: 400px;
}

@media (max-width:767px) {
  #logo {
    width: 55%;
  }

  h1 {
    font-size: 1.15rem;
  }

  #buscador, #folio_inicial{
    width: 100%;
  }

  #boton-generar {
    width: 100%;
  }

  button span {
    padding: 0 5px;
  }

  input[type="text"], select, select[multiple], textarea {
    width: 300px;
  }

  label {
    margin-bottom: 0;
  }

  .named-field{
    display: block;
    align-items: baseline;
  }

  header{ display: block; }

  .tab-btn {
    padding: 8px 14px;
    font-size: 0.85rem;
  }
}

@media (prefers-color-scheme: dark) {
  body {
    background-color: #181818;
    color: white;
  }
  h1 { color: white; }
  .tab-nav {
    border-color: #333;
  }
  .tab-btn {
    color: #777;
  }
  .tab-btn.tab-active {
    color: #6dda40;
    border-bottom-color: #6dda40;
  }
  .tab-btn:hover:not(.tab-active) {
    color: #6dda40;
  }
}
</style>

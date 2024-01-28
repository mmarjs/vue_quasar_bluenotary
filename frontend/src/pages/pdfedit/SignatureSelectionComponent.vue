<template>
  <!-- modal preview of document -->
  <q-dialog ref="dialog" v-model="showSignatureDialogue">
    <q-card style="min-width: 80%">
      <q-card-section>
        <div class="text-h6">Create Signature</div>
      </q-card-section>

      <q-card-section class="q-pt-none" style="padding: 0px;">
        <div class="q-pa-md">
          <div class="q-gutter-y-md">
            <q-card>
              <q-tabs
                v-model="tab"
                dense
                class="text-grey"
                active-color="primary"
                indicator-color="primary"
                align="justify"
                narrow-indicator
              >
                <q-tab :ripple="false" name="choose" label="Choose" />
                <q-tab :ripple="false" name="draw" label="Draw" />
                <q-tab :ripple="false" name="type" label="Type" />
                <q-tab :ripple="false" name="upload" label="Upload" />
              </q-tabs>

              <q-separator />

              <q-tab-panels v-model="tab" animated>
                <q-tab-panel name="draw" style="">
                  <div class="signature-parent" style="padding: 12px; border: 1px dotted #bfbcbb">
                    <VueSignaturePad ref="signaturePad" height="250px" />
                    <q-separator />
                    <div style="width: 100%; text-align: center; color: #bfbcbb">
                      <div style="display: inline-block; padding-top: 4px">
                        Draw Signature
                      </div>
                      <q-btn flat color="primary" label="Clear" style="float: right" @click="clearSignature" />
                      <q-btn flat color="primary" label="Undo" style="float: right" @click="undoSignature" />
                    </div>
                  </div>
                </q-tab-panel>

                <q-tab-panel name="type" style="">
                  <div style="margin-left: 20%; margin-right: 20%; margin-bottom: 15px; width: 60%">
                    <q-input v-model="typedSignatureInputModel" outlined label="Signature Name" />
                  </div>
                  <div class="row">
                    <div v-for="fontName,index in typedSignatureFonts" :key="'font' + fontName.name" class="col-6">
                      <div style="margin-left: 1%; margin-right: 1%" :class="(typedSignatureSelected.name === fontName.name) ? 'signaureSelectedClass':''" @click="typedSignatureClicked(fontName)">
                        <canvas :id="'textCanvas' + index" height="100" style="border:1px solid #d3d3d3; margin: 4%" />
                      </div>
                    </div>
                  </div>
                </q-tab-panel>

                <q-tab-panel name="choose">
                  <div v-if="chooseSignatures.length" class="q-pa-md">
                    <div class="row">
                      <div v-for="chooseSignature in chooseSignatures" :key="chooseSignature._id" class="col-6">
                        <div class="innerTopSignatureCard" style="margin: 6px" :class="(selectedSignature._id === chooseSignature._id) ? 'signaureSelectedClass':''">
                          <div class="innerSignatureCard" style="margin: 6px; border: 1px solid #d5ded7; border-radius: 10px; text-align: center" @click="signatureClicked(chooseSignature)">
                            <img :src="chooseSignature.signaturedata" alt="Signature" style="padding: 12px;" />
                            Added On: {{ moment(chooseSignature.createdAt).format("MMMM Do YYYY, h:mm:ss a") }}
                            <div style="cursor: pointer; color: red; font-weight: bold; text-decoration: underline;" @click="deleteSignature(chooseSignature)">Delete Signature</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-h6">
                    You need to draw a signature before it appears here
                  </div>
                </q-tab-panel>
                <q-tab-panel name="upload">
                  <div class="q-pa-md">
                    <div class="text-h6">Upload Signaure Image File</div>
                    <div class="row">
                      <div
                        class="file-drop-zone q-pt-md"
                        @drop.prevent
                        @dragover.prevent
                        @dragenter.prevent
                        @dragleave.prevent
                      >
                        <div class="file-decorate">
                          <div id="article" class="">
                            <p class="q-mt-sm">Drop file or upload here.</p>
                            <div v-if="uploadedSignatureLoading">
                              <q-spinner
                                color="primary"
                                size="3em" />
                              <p class="no-margin q-pt-md text-faded">
                                Uploading document, please wait...
                              </p>
                            </div>
                            <div v-if="!uploadedSignatureLoading">
                              <q-btn
                                class="browse-btn"
                                label="Upload Signature Image"
                                color="primary"
                                @click="$refs.signatureFileInput.$el.click()"
                              />
                              <q-file
                                v-show="false"
                                ref="signatureFileInput"
                                v-model="uploadedSignature"
                                standout
                                color="primary"
                                label="Add a document"
                                accept=".jpg, .jpeg, .png"
                              />
                            </div>
                            <div class="flex flex-center row q-pa-sm">
                              <small>Only .png, .jpg, .jpeg accepted.</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="row">
                      <img
                        v-if="uploadedSignatureImage && uploadedSignatureLoaded"
                        class="preview"
                        :src="uploadedSignatureImage"
                        alt="Uploaded Signaure Image"
                      />
                    </div>
                  </div>
                </q-tab-panel>
              </q-tab-panels>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          color="white"
          text-color="black"
          label="Cancel"
          @click="closeSignature()"
        />
        <q-btn
          v-close-popup
          label="Continue"
          color="primary"
          @click="submitSignature()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>

import Vue from "vue";
import VueSignaturePad from "vue-signature-pad";
import { $axios } from "boot/axios";
import moment from "moment";
import _ from "lodash";
import VueEventBus from "../../plugins/eventbus.js";

Vue.use(VueSignaturePad);

export default {
  name: "SignatureSelectionComponent",
  components: {
  },
  props: {
    signatureSelectionDone: {
      type: Function,
      default: () => {}
    },
    signatureRemovedDone: {
      type: Function,
      default: () => {}
    },
    placeholderSignatureClosed: {
      type: Function,
      default: () => {}
    },
    firstTimeRender: {
      type: Boolean,
      default: false
    },
    elementId: {
      type: String,
      default: ""
    },
    imageData: {
      type: String,
      default: ""
    },
    openSignatureModel: {
      type: Boolean,
      default: false
    },
    openedfrom: {
      type: String,
      default: ""
    }
  },

  data() {
    return {
      showSignatureDialogue: false,
      tab: "choose",
      chooseSignatures: [],
      selectedSignature: {},
      uploadedSignature: false,
      uploadedSignatureLoading: false,
      uploadedSignatureLoaded: false,
      uploadedSignatureImage: false,
      moment,
      typedSignatureInputModel: "",
      typedSignatureFonts: [
        {
          name: "Brush Script MT",
          imageData: "",
          fontIndex: 0
        },
        {
          name: "Parkavenue",
          imageData: "",
          fontIndex: 1
        }
      ],
      typedSignatureSelected: {}
    };
  },

  computed: {
  },

  watch: {
    tab: {
      handler(value) {
        console.log(value);
        if (value === "choose") {
          this.fetchSignatures();
        } else if (value === "type") {
          const fontIndex = 0;
          _.map(this.typedSignatureFonts, () => {
            const canvas = document.getElementById(`textCanvas${String(fontIndex)}`);
            if (canvas) {
              canvas.width = canvas.parentElement.clientWidth * 0.9;
            }
          });
          this.updateTypedSignatureImage();
        }
      }
    },
    openSignatureModel: {
      handler(value) {
        if (value) {
          this.showSignatureDialogue = true;
        }
      }
    },
    async uploadedSignature (val) {
      this.uploadedSignatureLoading = true;
      if (val) await this.saveUploadedSignature(val);
      this.uploadedSignatureLoading = false;
    },
    showSignatureDialogue (val) {
      if (!val && this.openedfrom === "settings") {
        this.signatureRemovedDone();
      }
      if (!val) {
        this.placeholderSignatureClosed();
      }
    },
    typedSignatureInputModel() {
      this.updateTypedSignatureImage();
    }
  },

  mounted() {
    if (this.firstTimeRender) {
      this.showSignatureDialogue = true;
    }
    this.fetchSignatures();
  },
  created() {
  },

  methods: {
    updateTypedSignatureImage() {
      let fontIndex = 0;
      this.typedSignatureFonts = _.map(this.typedSignatureFonts, (tempFont) => {
        const canvas = document.getElementById(`textCanvas${String(fontIndex)}`);
        if (!canvas) {
          return tempFont;
        }
        const ctx = canvas.getContext("2d");
        canvas.width = canvas.parentElement.parentElement.clientWidth * 0.9;
        ctx.beginPath();
        ctx.font = `50px ${tempFont.name}`;
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.fillText(this.typedSignatureInputModel, canvas.width / 2, (canvas.height / 2) + 10);
        fontIndex += 1;
        return tempFont;
      });
    },
    fetchSignatures() {
      const url = "signatures/getSignatures";
      $axios.get(url)
      .then((res) => {
        if (res.data && res.data.signatures) {
          this.chooseSignatures = res.data.signatures;
        }
      })
      .catch((error) => {
        console.log(error);
      });
    },
    signatureClicked(signaturedoc) {
      console.log(signaturedoc);
      this.selectedSignature = signaturedoc;
    },
    typedSignatureClicked(fontName) {
      if (!this.typedSignatureInputModel.length) {
        return;
      }
      const canvas = document.getElementById(`textCanvas${String(fontName.fontIndex)}`);
      const canvasWidth = canvas.width;
      let finalCanvasWidthRatio = 0.5;
      if (this.typedSignatureInputModel.length > 10) {
        if (this.typedSignatureInputModel.length < 15) {
          finalCanvasWidthRatio = 0.6;
        } else if (this.typedSignatureInputModel.length < 20) {
          finalCanvasWidthRatio = 0.7;
        } else {
          finalCanvasWidthRatio = 1;
        }
      }
      console.log(finalCanvasWidthRatio);
      const newCanvas = document.createElement("canvas");
      newCanvas.width = finalCanvasWidthRatio * canvasWidth;
      newCanvas.height = 100;
      newCanvas.getContext("2d").drawImage(canvas, ((1 - finalCanvasWidthRatio) / 2) * canvasWidth, 0, finalCanvasWidthRatio * canvasWidth, 100, 0, 0, finalCanvasWidthRatio * canvasWidth, 100);
      const dataUrl = newCanvas.toDataURL();
      // if (!_.includes(dataUrl, "base64")) {
      //   dataUrl = newCanvas.toDataURL().split(";base64,")[1];
      // }
      console.log("dataUrl", dataUrl);
      fontName.imageData = dataUrl;
      this.typedSignatureSelected = fontName;
    },
    clearSignature() {
      this.$refs.signaturePad.clearSignature();
    },
    undoSignature() {
      this.$refs.signaturePad.undoSignature();
    },
    closeSignature() {
      this.$refs.dialog.hide();
      if (!this.imageData) {
        VueEventBus.$emit("REMOVE_ELEMENT", this.elementId);
      }
    },
    submitSignature() {
      let finalSingatureImage = false;
      if (this.tab === "draw") {
        const signatureData = this.$refs.signaturePad.saveSignature();
        if (signatureData.isEmpty) {
          this.$q.notify({
            message: "Please draw or choose your signature.",
            color: "black"
          });
          return;
        }
        console.log(signatureData);
        finalSingatureImage = signatureData.data;
        const url = "signatures/saveSignature";
        $axios.post(url, {
          signaturedata: signatureData.data
        })
        .then((res) => {
          console.log(res.data);
        })
        .catch((error) => {
          console.log(error);
        });
      } else if (this.tab === "type") {
        // console.log(this.typedSignatureSelected);
        // const signatureData = this.$refs.signaturePad.saveSignature();
        if (!this.typedSignatureSelected.imageData) {
          this.$q.notify({
            message: "Please type and choose your Signature.",
            color: "black"
          });
          return;
        }
        console.log(this.typedSignatureSelected.imageData);
        // finalSingatureImage = `data:image/png;base64,${this.typedSignatureSelected.imageData}`;
        finalSingatureImage = this.typedSignatureSelected.imageData;
        const url = "signatures/saveSignature";
        $axios.post(url, {
          signaturedata: finalSingatureImage
        })
        .then((res) => {
          console.log(res.data);
        })
        .catch((error) => {
          console.log(error);
        });
      } else {
        if (_.isEmpty(this.selectedSignature)) {
          this.$q.notify({
            message: "Please draw or choose your signature.",
            color: "black"
          });
          return;
        }
        finalSingatureImage = this.selectedSignature.signaturedata;
      }
      this.signatureSelectionDone(finalSingatureImage);
      this.$refs.dialog.hide();
      this.openSignatureModel = false;
    },
    async saveUploadedSignature(data) {
      try {
        this.uploadedSignatureLoaded = false;
        const url = "file/saveSignatureImageFile";
        const formData = new FormData();
        formData.append("file", data);
        const response = await $axios.post(url, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        this.uploadedSignatureLoaded = true;
        this.uploadedSignatureImage = response.data.file;
        this.selectedSignature = response.data.signatureDoc;
        // await loadDetail();
      } catch (error) {
        console.log("error", error);
      }
    },
    async deleteSignature(signatureDoc) {
      this.$q.dialog({
        title: "Confirm",
        message: "Are you sure you want to delete this Signature?",
        cancel: true,
        persistent: true
      }).onOk(async () => {
        const url = "signatures/deleteSignature";
        const postData = {
          signatureId: signatureDoc._id
        };
        $axios.post(url, postData)
        .then(() => {
          this.chooseSignatures = _.filter(this.chooseSignatures, (localSignatureDoc) => localSignatureDoc._id !== signatureDoc._id);
          this.$q.notify({
            message: "Signature Deleted Successfully.",
            color: "black"
          });
        })
        .catch((error) => {
          console.log(error);
        });
      });
    }
  }
};

</script>

<style type="text/css">
  .innerSignatureCard:hover {
    background: #e4f0e6;
  }
  .signaureSelectedClass {
    border: 1px solid #a5ada6;
    border-radius: 10px;
  }
</style>

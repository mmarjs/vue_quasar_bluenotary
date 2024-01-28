<template>
  <q-page class="q-pa-md flex-center session-container">
    <div class="row">
      <div class="col-12 col-md-12">
        <session-header :session-id="sessionid" />
      </div>
      <div class="col-12 col-md-12 q-pa-lg workflow-container">
        <div
          v-if="!calledFromBusinessPage"
          class="
            flex
            justify-between
            q-pt-md q-pb-md
            workflow-icons
            q-gutter-md
            text-center
          "
        >
          <div class="col flex column flex-center mobile-hide">
            <img src="~assets/document-upload.svg" class="session-guide-icon" />
            <p class="q-pa-md">1. Upload Document</p>
            <q-icon name="check_circle" />
          </div>
          <div class="col column flex flex-center black-border-bottom">
            <img src="~assets/id-card.svg" class="session-guide-icon" />
            <p class="q-pa-md">2. Identity Check</p>
            <!-- <q-icon name="check_circle" /> -->
          </div>
          <div class="col column flex flex-center mobile-hide">
            <img src="~assets/credit-card.svg" class="session-guide-icon" />
            <p class="q-pa-md">3. Payment Info</p>
          </div>
          <div class="col column flex flex-center mobile-hide">
            <img src="~assets/videocall.svg" class="session-guide-icon" />
            <p class="q-pa-md">4. Meet Notary</p>
          </div>
        </div>
        <div class="row">
          <div class="col-12 col-md-8 flex q-mt-lg">
            <div class="flex column">
              <h5>Verify Your Identity</h5>
              <p class="q-mb-md">
                We need some personal information in order to verify your
                identity.
              </p>
              <div class="">
                <div class="q-pt-lg">
                  <h5 class="">Photo ID</h5>
                  <p class="q-mb-md">
                    Please upload a <strong>clear</strong> image of the <i>front and back side</i> of your <strong>State ID, Real ID, or Driver's License</strong>.<br />
                    <small>Accepted file formats are .jpg, .png (Max 4MB), minimum image resolution should be 800px x 600px. The session <strong>WILL FAIL</strong> if you upload a <strong>blurry</strong> image. </small>
                  </p>
                  <div class="row">
                    <div class="col-12 col-sm-6 q-pr-xs ffrid">
                      <q-img :src="frontPhoto !== '' ? frontPhoto : 'https://bluenotary.us/assets/img/sample-id-front.png'" spinner-color="primary" />
                      <div class="row">
                        <template v-if="uploadingF">
                          <q-spinner
                            color="primary"
                            size="3em" />
                          <span class="no-margin q-pt-md">Uploading...</span>
                        </template>
                        <q-btn v-else
                               class="col"
                               color="green"
                               label="Upload Front ID"
                               style="height: 3.4rem"
                               @click="$refs.frontIdInput.$el.click()"
                        />
                        <q-file
                          v-show="false"
                          ref="frontIdInput"
                          v-model="uploadFrontId"
                          standout
                          label="Upload Front ID"
                          accept=".jpg, .png"
                        />
                      </div>
                    </div>
                    <div class="col-12 col-sm-6 q-pl-xs bbrid">
                      <q-img id="backPhotoIdDiv" :src="backPhoto !== '' ? backPhoto : 'https://bluenotary.us/assets/img/sample-id-back.png'" spinner-color="primary" />
                      <div class="row">
                        <template v-if="uploadingB">
                          <q-spinner
                            color="primary"
                            size="3em" />
                          <span class="no-margin q-pt-md">Uploading...</span>
                        </template>
                        <q-btn v-else
                               class="col"
                               label="Upload Back ID"
                               color="green"
                               style="height: 3.4rem"
                               @click="$refs.backIdInput.$el.click()"
                        />
                        <q-file
                          v-show="false"
                          ref="backIdInput"
                          v-model="uploadBackId"
                          standout
                          label="Upload Back ID"
                          accept=".jpg, .png"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-4 flex mobile-hide">
            <q-card
              class="my-card"
              flat
              bordered
              style="background: none; border: none"
            >
              <q-card-section>
                <div class="text-overline text-orange-9">
                  Identity Verification
                </div>
                <div class="text-h5 q-mt-sm q-mb-md">
                  Secure ID Verify Process
                </div>
                <div class="text-caption">
                  State laws require strict identity verification to service
                  online notarizations. We use sophisticated and secure tech to make this
                  process as smooth as possible. Your personal information is
                  never stored or recorded. We will ask you <strong>5 personal questions</strong> and require a <strong>photo ID</strong>.
                  <p>You will have <strong>2 minutes to complete</strong> the KBA questions.</p>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
      <!-- next btn -->
      <q-btn
        class="next-btn q-mt-md q-mb-xl"
        label="Next"
        color="primary"
        @click="nextButtonClick()"
      />
    </div>
    <q-dialog v-model="failed" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">Failed</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          Your Photo ID verification failed. Unfortunately, we cannot continue your session.
          <div class="columns is-multiline" style="margin-top: 20px">
            <div class="column is-5">Document Verification Result</div>
            <div class="column is-7" style="font-weight: bold">{{ evsResult.documentValidationResult }}</div>
            <div class="column is-5">Document Expiration Result</div>
            <div class="column is-7" style="font-weight: bold">{{ evsResult.documentExpirationResult }}</div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="OKAY" color="primary" @click="failSession()" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showBackPhotoIdErrorModal">
      <q-card>
        <q-card-section>
          <div class="text-h6">We found an issue with your image</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          Back ID image is likely too blurry or too dark. Please take a clearer image of your ID and reupload image.
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="OKAY" color="primary" @click="closePhotoIdErrorModal()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref } from "@vue/composition-api";
import { $axios } from "boot/axios";
import states from "@/data/states.json";
import __ from "lodash";
// import axios from "axios";
// import {
//  RGBLuminanceSource, BinaryBitmap, HybridBinarizer, MultiFormatReader
// } from "@zxing/library";
// import { BrowserPDF417Reader } from "@zxing/browser";
import SessionHeader from "../../components/SessionHeader.vue";

// console.log(BrowserPDF417Reader);

export default {
  name: "Photoid",
  components: { SessionHeader },
  props: {
    calledFromBusinessPage: {
      type: Boolean,
      default: false
    },
    calledFromBusinessPageSessionId: {
      type: String,
      default: ""
    },
    kbaModalChangeSection: {
      type: Function,
      default: () => {}
    }
  },
  data() {
    return {
      states,
      sessionid: "",
      evsResult: {},
      backPhotoIdDecodeStatus: "pending",
      showBackPhotoIdErrorModal: false
    };
  },
  watch: {
    async uploadFrontId (val) {
      if (val) {
        const img = new Image();
        this.uploadingF = true;
        img.src = window.URL.createObjectURL(val);
        img.onload = async () => {
          if (img.naturalWidth < 800 || img.naturalHeight < 600) {
            window.URL.revokeObjectURL(img.src);
            this.$q.notify({
              color: "secondary",
              position: "bottom-right",
              message: "Minimum dimention of front photo id is 800x600px.",
            });
          } else {
            window.URL.revokeObjectURL(img.src);
            if (val.size > 4000000) {
              const reader = new FileReader();
              reader.onload = async(e) => {
                const imgCanvas = document.createElement("img");
                imgCanvas.onload = async() => {
                  // Create canvas
                  const canvas = document.createElement("canvas");
                  const ctx = canvas.getContext("2d");
                  canvas.width = 800;
                  canvas.height = 600;
                  ctx.drawImage(imgCanvas, 0, 0, 800, 600);
                  // Create dataURL
                  const dataurl = canvas.toDataURL(val.type);
                  // this.frontPhoto = dataurl;
                  // Get blob from data url and convert it to file object
                  const blob = this.dataURItoBlob(dataurl);
                  const newFile = new File([blob], val.name, { type: val.type, lastModified: val.lastModified });
                  await this.fileUpload(newFile, "front", (this.$route.params && this.$route.params.id) || this.sessionid);
                  const res = await this.loadPersonalData((this.$route.params && this.$route.params.id) || this.sessionid);
                  this.frontPhoto = (res && res.frontPhotoIdUrl) ? res.frontPhotoIdUrl : "";
                  this.backPhoto = (res && res.backPhotoIdUrl) ? res.backPhotoIdUrl : "";
                };
                imgCanvas.src = e.target.result;
              };
              reader.readAsDataURL(val);
            } else {
              console.log(img.src);
              await this.fileUpload(val, "front", (this.$route.params && this.$route.params.id) || this.sessionid);
              const res = await this.loadPersonalData((this.$route.params && this.$route.params.id) || this.sessionid);
              this.frontPhoto = (res && res.frontPhotoIdUrl) ? res.frontPhotoIdUrl : "";
              this.backPhoto = (res && res.backPhotoIdUrl) ? res.backPhotoIdUrl : "";
            }
          }
          this.uploadingF = false;
        };
      }
    },

    async uploadBackId (val) {
      if (val) {
        this.uploadingB = true;
        const img = new Image();
        img.src = window.URL.createObjectURL(val);
        img.onload = async () => {
          if (img.naturalWidth < 800 || img.naturalHeight < 600) {
            window.URL.revokeObjectURL(img.src);
            this.$q.notify({
              color: "secondary",
              position: "bottom-right",
              message: "Minimum dimention of back photo id is 800x600px.",
            });
          } else {
            window.URL.revokeObjectURL(img.src);
            if (val.size > 4000000) {
              const reader = new FileReader();
              reader.onload = async(e) => {
                const imgCanvas = document.createElement("img");
                imgCanvas.onload = async() => {
                  // Create canvas
                  const canvas = document.createElement("canvas");
                  const ctx = canvas.getContext("2d");
                  canvas.width = 800;
                  canvas.height = 600;
                  ctx.drawImage(imgCanvas, 0, 0, 800, 600);
                  // Create dataURL
                  const dataurl = canvas.toDataURL(val.type);
                  // this.frontPhoto = dataurl;
                  // Get blob from data url and convert it to file object
                  const blob = this.dataURItoBlob(dataurl);
                  const newFile = new File([blob], val.name, { type: val.type, lastModified: val.lastModified });
                  const fileresponse = await this.fileUpload(newFile, "back", (this.$route.params && this.$route.params.id) || this.sessionid);
                  const res = await this.loadPersonalData((this.$route.params && this.$route.params.id) || this.sessionid);
                  this.frontPhoto = (res && res.frontPhotoIdUrl) ? res.frontPhotoIdUrl : "";
                  this.backPhoto = (res && res.backPhotoIdUrl) ? res.backPhotoIdUrl : "";
                  console.log("fileresponse", fileresponse);
                  if (fileresponse && fileresponse.message && __.includes(fileresponse.message, "Failed")) {
                    this.backPhotoIdDecodeStatus = "failed";
                    this.showBackPhotoIdErrorModal = true;
                  } else {
                    this.backPhotoIdDecodeStatus = "success";
                  }
                };
                imgCanvas.src = e.target.result;
              };
              reader.readAsDataURL(val);
            } else {
              const fileresponse = await this.fileUpload(val, "back", (this.$route.params && this.$route.params.id) || this.sessionid);
              const res = await this.loadPersonalData((this.$route.params && this.$route.params.id) || this.sessionid);
              this.frontPhoto = (res && res.frontPhotoIdUrl) ? res.frontPhotoIdUrl : "";
              this.backPhoto = (res && res.backPhotoIdUrl) ? res.backPhotoIdUrl : "";
              console.log("fileresponse", fileresponse);
              if (fileresponse && fileresponse.message && __.includes(fileresponse.message, "Failed")) {
                this.backPhotoIdDecodeStatus = "failed";
                this.showBackPhotoIdErrorModal = true;
              } else {
                this.backPhotoIdDecodeStatus = "success";
              }
            }
          }
          this.uploadingB = false;
        };
      }
    },

  },
  async mounted () {
    this.sessionid = (this.$route.params && this.$route.params.id) || false;
    if (this.calledFromBusinessPageSessionId) {
      this.sessionid = this.calledFromBusinessPageSessionId;
    }
    this.currentSession = this.$q.localStorage.getItem("sessionData");
    if (!this.currentSession && !this.calledFromBusinessPage) {
      if (this.$user.testingacc && this.$user.testingacc === true) {
        this.$router.replace(`/business/personal_info/${this.sessionid}/?demo=true`).catch(() => {});
      } else {
        this.$router.replace(`/business/personal_info/${this.sessionid}`).catch(() => {});
      }
    }

    const res = await this.loadPersonalData(this.sessionid);
    if (res) {
      this.frontPhoto = (res && res.frontPhotoIdUrl) ? res.frontPhotoIdUrl : "";
      this.backPhoto = (res && res.backPhotoIdUrl) ? res.backPhotoIdUrl : "";
      console.log("loadPersonalData ", res);
    }
  },
  setup () {
    const loading = ref(false);
    const uploaded = ref(false);
    const uploadingF = ref(false);
    const uploadingB = ref(false);
    const failed = ref(false);
    const currentSession = ref(null);
    const uploadFrontId = ref(null);
    const uploadBackId = ref(null);
    const frontPhoto = ref(null);
    const backPhoto = ref(null);
    const fileUpload = async (data, photoIdType, sessionId) => {
      try {
        const url = "file/customerFrontBackIdUpload";
        const formData = new FormData();
        formData.append("file", data);
        formData.append("documentType", photoIdType);
        formData.append("sessionId", sessionId);
        const response = await $axios.post(url, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response.data;
      } catch (error) {
        return error;
      }
    };
    const sendEvsIntegrationConsumerFill = async(sessionId, demo) => {
      try {
        let url = `session/getCustomerDetailsAfterChecking/${sessionId}`;
        if (demo && demo === true) {
          url += "/?demo=true";
        }
        const response = await $axios.get(url, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        return response.data;
      } catch (error) {
        return error;
      }
    };
    const loadPersonalData = async (sessionId) => {
      try {
        const url = "session/load/personalData";
        console.log("sessionId", sessionId);
        const response = await $axios.post(url, { sessionId }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        return response.data;
      } catch (error) {
        return error;
      }
    };
    const dataURItoBlob = (dataURI) => {
      // convert base64 to raw binary data held in a string
      const byteString = atob(dataURI.split(",")[1]);

      // separate out the mime component
      const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

      // write the bytes of the string to an ArrayBuffer
      const arrayBuffer = new ArrayBuffer(byteString.length);

      // create a view into the buffer
      const viewBuffer = new Uint8Array(arrayBuffer);

      // set the bytes of the buffer to the correct values
      for (let i = 0; i < byteString.length; i += 1) {
          viewBuffer[i] = byteString.charCodeAt(i);
      }

      // write the ArrayBuffer to a blob
      const blob = new Blob([arrayBuffer], { type: mimeString });
      return blob;
    };
    return {
      loading,
      uploaded,
      uploadingF,
      uploadingB,
      failed,
      sendEvsIntegrationConsumerFill,
      loadPersonalData,
      currentSession,
      fileUpload,
      uploadFrontId,
      uploadBackId,
      frontPhoto,
      backPhoto,
      dataURItoBlob,
    };
  },
  methods: {
    closePhotoIdErrorModal() {
      this.showBackPhotoIdErrorModal = false;
    },
    failSession () {
      this.$router.replace("/business/");
    },
    async nextButtonClick () {
      console.log("Next button clicked");
      this.savePersonalDetails();
    },
    async savePersonalDetails () {
      console.log("in save personal details");
      if (!this.frontPhoto) {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please upload the front of your photo ID.",
        });
      }

      if (!this.backPhoto) {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please upload the back of your photo ID.",
        });
      }
      let demoFlag = (this.$route.query.demo && this.$route.query.demo === "true") || false;
      if (this.calledFromBusinessPage && this.$user.testingacc) {
        demoFlag = true;
      }
      const evsRes = await this.sendEvsIntegrationConsumerFill(this.sessionid, demoFlag);
      this.evsResult = evsRes;
      console.log(evsRes);
      if (evsRes.workflowOutcome !== null && evsRes.workflowOutcome === "Pass") {
        // redirect to payment page
        this.$q.notify({
          color: "primary",
          position: "bottom-right",
          message: "Your photo ID is verified successfully.",
        });
        let stageValue = "payment_info_stage";
        if (this.calledFromBusinessPage) {
          stageValue = "meet_notary";
        }
        let extraParams = "";
        if (this.calledFromBusinessPage) {
          extraParams += "&additionalSigner=true";
        }
        const url = `session/setSessionStageOrStatus/${this.sessionid}/?type=stage&value=${stageValue}${extraParams}`;
        await $axios.get(url, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (this.calledFromBusinessPage) {
          this.kbaModalChangeSection("meet_notary");
        } else if (this.$route.query.demo && this.$route.query.demo === "true") {
          this.$router.replace(`/business/payment_info/${this.sessionid}/?demo=true`).catch(() => {});
        } else if (this.$user.testingacc && this.$user.testingacc === true) {
          this.$router.replace(`/business/payment_info/${this.sessionid}/?demo=true`).catch(() => {});
        } else {
          this.$router.replace(`/business/payment_info/${this.sessionid}`).catch(() => {});
        }
      } else if (this.calledFromBusinessPage) {
        this.kbaModalChangeSection("failed", "Your Photo ID verification failed. Unfortunately, we cannot continue your session.");
      } else {
        const url = `session/setSessionStageOrStatus/${this.sessionid}/?type=stage&value=photoid_check_stage_fail`;
        await $axios.get(url, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        this.failed = true;
      }

      return "";
    },
  },
};

// import {
//  BarcodeFormat, DecodeHintType
// } from "@zxing/library";

// console.log(BarcodeFormat);

// $axios.get("https://bluenotarybucket.s3.us-east-2.amazonaws.com/1649582404008IMG_0467.jpg", (resp) => {
//   console.log(resp);
//   // resp.setEncoding("base64");
//   // let fileData = "";
//   // resp.on("data", (data) => {
//   //   fileData += data;
//   //   console.log("downloading");
//   // });
//   // resp.on("end", async () => {
//   //   const luminanceSource = new RGBLuminanceSource(new Uint8ClampedArray(Buffer.from(fileData, "base64")), 3024, 4032);
//   //   const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
//   //   reader.decode(binaryBitmap, hints);
//   // });
// });

    // const hints = new Map();
    // // const formats = [BarcodeFormat.PDF_417, BarcodeFormat.QR_CODE, BarcodeFormat.CODE_39];
    // const formats = [
    //   BarcodeFormat.CODE_128,
    //   BarcodeFormat.PDF_417,
    //   BarcodeFormat.QR_CODE,
    //   BarcodeFormat.CODE_93,
    //   BarcodeFormat.CODE_39,
    //   BarcodeFormat.CODABAR,
    //   BarcodeFormat.UPC_A,
    //   BarcodeFormat.UPC_E,
    //   BarcodeFormat.CODABAR,
    //   BarcodeFormat.CODABAR,
    //   BarcodeFormat.CODABAR,
    //   BarcodeFormat.CODABAR,
    //   BarcodeFormat.CODABAR,
    //   BarcodeFormat.CODABAR,
    // ];

    // hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);

    // const reader = new MultiFormatReader();
    // console.log(reader);
    // // console.log(formats);
    // console.log(hints);
    // // const arrayBuffer = await fetch(`https://cors-fix.web.app/v1?url=${imageData}`).then((res) => res.arrayBuffer());
    // // const arrayBuffer = await fetch("https://bluenotarybucket.s3.us-east-2.amazonaws.com/1649582404008IMG_0467.jpg").then((res) => res.arrayBuffer());
    // const arrayBuffer = await fetch("https://bluenotarybucket.s3.us-east-2.amazonaws.com/_back-state-id-small.jpg").then((res) => res.arrayBuffer());
    // // const arrayBuffer = await fetch("https://bluenotarybucket.s3.us-east-2.amazonaws.com/_back-state-id-small.jpg?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEEYaCmFwLXNvdXRoLTEiSDBGAiEA72iQGA%2BVVmIqaG%2FeM%2FRgooAlQah90T0rONYXNfnly8QCIQC%2FQQfSPO3WPyzI87aFN5bPH4DON5jCsYPqmHEIgxhO4Sr7AggvEAAaDDkzMjA3OTY1NzY2NSIMIhI5Bys%2Bgv1mry8kKtgCQaYIiJkPtxUH6jUuMiNZruplXjIB8swWiaI5dRgjHr8ZzdF7w9Xl4modjreuob9KBAByCu5EPCObsXKFy9PaQ1HSdl6cjgRerWMRp0CuUwCzc6RU15fZX56t1I1IMblVq%2F8r4E34S55qTOl5hvmbL5o%2BMQudmo8ACo%2ByPB3iPMFNfZ0tHgeujHoSH9skn8p%2Bf8NLbbe30EBzrBCxHKw6a34SO2EbniohwPp9uOqUVxzHzzUqIY0Sjet0%2BTWGvg4uW0cm2OgSt%2BVJT9w193FQJA4yOsgF%2B5JoTm9mgVrwXoyykxJdE5TNPTufoQAf%2Buo%2F3efMwBfOXWiECBlRfSg08BRXMo%2F8pvo8HURfIhLD4ecGDB4k4h5RFbrd9WNELs10capdlttmyh9XZu9%2BTdc9KfKD47RXleoStXncsX7fhFGh7D8VQ0UZzRGQmbsLJIxNL0PW8ffNMsUwytyjlAY6sgJSerXxc0b8qFf8g2OfUhVTcVdf12deTdR1GmGsfEpRuJW11hPNZSdm3Wg6bDEShDeIYDixzWIy2Ch5CFEk0Ii3ZZtKOm8%2FMdiAHv2XY3p%2F37f1lguYpJr9klL4uLrU3EdUtpLGuebx2FEquG9fezVOiDqaH01%2FFy5awrdFkjOUYyjyMVTxRhyp5fbeaoi5i7xajjYWb8HDuY9CGtnE9JRbdWyRD9gnUQbGV4xqmCrr%2F9ockazL9Sw640U9f3VE17bhwAaqHSp4Ph7qekn%2Bv5m6c0eUD74L4YBsaYdJWkCQ%2BSV0j2iIdqz3VcUg%2BNLxUmZ3KyIWSHPmn6jtiAKTYOTii4BMu7zZ5YBIIad%2BJ98nQQ1q7DtInQtqOtTSjYkxi4%2BjuAgCH4%2BH2tFdw4Z94w%2BKvJk%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20220521T135546Z&X-Amz-SignedHeaders=host&X-Amz-Expires=300&X-Amz-Credential=ASIA5SBCG4LASJEORGBI%2F20220521%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Signature=db8abfc707292cd3587cb76b7efa07f845c13c4c2794b9458eff61549f87cd7b").then((res) => res.arrayBuffer());
    // console.log(arrayBuffer);
    // const luminanceSource = new RGBLuminanceSource(arrayBuffer);
    // // const luminanceSource = new RGBLuminanceSource(new Uint8ClampedArray(arrayBuffer), 3024, 4032);
    // const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
    // console.log(binaryBitmap);
    // reader.decode(binaryBitmap, hints);
    // console.log(reader);
    // console.log(hints);
    // const fileurl = "https://bluenotarybucket.s3.us-east-2.amazonaws.com/_back-state-id-small.jpg";
    // const fileurl = "https://bluenotarybuckey2.s3.us-east-2.amazonaws.com/_back-state-id-small.jpg";
    // const fileurl = "https://bluenotarybucket.s3.us-east-2.amazonaws.com/1653009984695image.jpeg";
    // // const fileurl = "https://cors-fix.web.app/v1?url=https://bluenotarybuckey2.s3.us-east-2.amazonaws.com/1651922185695blur-back.png";

    // const fileurl = "https://cors-fix.web.app/v1?url=https://bluenotarybuckey2.s3.us-east-2.amazonaws.com/1653000285271License%20back.pdf.jpg";
    // const resp = await $axios.get(`https://cors-fix.web.app/v1?url=https://zxing.org/w/decode?u=${fileurl}`);
    // if (resp && resp.data && __.includes(resp.data, "Decode Succeeded")) {
    //   console.log("yes");
    // } else {
    //   console.log("no");
    // }
    // console.log(resp);

    // const myImage = new Image();
    // myImage.crossOrigin = "Anonymous";
    // myImage.src = "http://bluenotarybucket.s3.us-east-2.amazonaws.com/1649582404008IMG_0467.jpg";
    // // myImage.src = val;
    // myImage.onload = () => {
    //   const barcodeDetector = new window.BarcodeDetector({
    //   formats: [
    //       "aztec",
    //       "code_128",
    //       "code_39",
    //       "code_93",
    //       "codabar",
    //       "data_matrix",
    //       "ean_13",
    //       "ean_8",
    //       "itf",
    //       "pdf417",
    //       "qr_code",
    //       "upc_a",
    //       "upc_e"
    //     ]
    //   });
    //   console.log(myImage);
    //   barcodeDetector.detect(myImage)
    //     .then((barcodes) => {
    //       console.log(barcodes);
    //       barcodes.forEach((barcode) => console.log(barcode.rawData));
    //     })
    //     .catch((err) => {
    //       console.log(err);
    //     });
    // };

    // if (photoIdType === "back") {
    //   const chekingUrl = "https://cors-fix.web.app/v1?url=https://zxing.org/w/decode";
    //   const headers = {
    //     Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    //     // "Accept-Encoding": "gzip, deflate, br",
    //     // Host: "zxing.org",
    //     // Origin: "https://zxing.org",
    //     // Referer: "https://zxing.org/w/decode.jspx",
    //     "Content-Type": "multipart/form-data",
    //     // "Sec-Fetch-Dest": "document",
    //     // "Sec-Fetch-Mode": "navigate",
    //     // "Sec-Fetch-Site": "same-origin",
    //     // "Sec-Fetch-User": "?1",
    //     "Upgrade-Insecure-Requests": "1",
    //     // "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:100.0) Gecko/20100101 Firefox/100.0"
    //   };
    //   const tempFormData = new FormData();
    //   tempFormData.append("f", data);
    //   const response = await axios.post(chekingUrl, tempFormData, {
    //     headers,
    //   });
    //   console.log(response);
    // }

    // in watchers
    // async backPhoto (val) {
    //   console.log(val);
    //   if (val) {
    //     try {
    //       // const reader = new BrowserPDF417Reader();
    //       // const source = "https://bluenotarybuckey2.s3.us-east-2.amazonaws.com/_back-state-id-small.jpg";
    //       // const resultImage = await reader.decodeFromImageUrl(source);
    //       // setInterval(async () => {
    //       //   console.log(document.querySelector("#frontPhotoIdDiv"));
    //       //   const resultImage = await reader.decodeFromImageElement(document.querySelector("#frontPhotoIdDiv").cloneNode(true));
    //       //   console.log(resultImage);
    //       // }, 5000);
    //       // const reader = new MultiFormatReader();
    //       // const url = "https://bluenotarybuckey2.s3.us-east-2.amazonaws.com/_back-state-id-small.jpg";
    //       // const arrayBuffer = await fetch(`https://cors-fix.web.app/v1?url=${url}`).then((res) => {
    //       //   console.log(res.body);
    //       //   return res.arrayBuffer();
    //       // });
    //       // console.log(arrayBuffer);
    //       // const luminanceSource = new RGBLuminanceSource(1500, 1200, arrayBuffer);
    //       // const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
    //       // const hints = new Map();
    //       // reader.decode(binaryBitmap, hints);
    //       // console.log(reader);
    //       // $axios.get("https://bluenotarybucket.s3.us-east-2.amazonaws.com/1649582404008IMG_0467.jpg", (resp) => {
    //       //   console.log(resp);
    //       //   // resp.setEncoding("base64");
    //       //   let fileData = "";
    //       //   resp.on("data", (data) => {
    //       //     fileData += data;
    //       //     console.log("downloading");
    //       //   });
    //       //   resp.on("end", async () => {
    //       //     console.log(fileData);
    //       //     // const luminanceSource = new RGBLuminanceSource(new Uint8ClampedArray(Buffer.from(fileData, "base64")), 3024, 4032);
    //       //     // const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
    //       //     // reader.decode(binaryBitmap, hints);
    //       //   });
    //       // });
    //       // console.log(val);
    //       // val = "https://bluenotarybuckey2.s3.us-east-2.amazonaws.com/1653219489297Screenshot%202022-03-17%20at%202.24.10%20PM.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA5SBCG4LASZSHAL6N%2F20220522%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20220522T113809Z&X-Amz-Expires=518400&X-Amz-Signature=fd003c717f36385c1ba167cfff1c445accdc4b40d3c169ed1f28a284950f8b13&X-Amz-SignedHeaders=host";
    //       // // const fileurl = `https://cors-fix.web.app/v1?url=${val}`;
    //       // // const fileurl = "https://cors-fix.web.app/v1?url=https://bluenotarybuckey2.s3.us-east-2.amazonaws.com/1650594395497image.jpg";
    //       // const resp = await $axios.get(`https://cors-fix.web.app/v1?url=https://zxing.org/w/decode?u=${encodeURIComponent(val)}`);
    //       // if (resp && resp.data && __.includes(resp.data, "Decode Succeeded")) {
    //       //   console.log("yes");
    //       //   this.backPhotoIdDecodeStatus = "success";
    //       // } else {
    //       //   console.log("no");
    //       //   this.backPhotoIdDecodeStatus = "failed";
    //       //   this.showBackPhotoIdErrorModal = true;
    //       // }
    //       // console.log(resp);
    //     } catch (error) {
    //       console.log(error);
    //       console.log("no");
    //       this.backPhotoIdDecodeStatus = "failed";
    //       this.showBackPhotoIdErrorModal = true;
    //     }
    //   } else {
    //     console.log("no val");
    //   }
    // }

</script>

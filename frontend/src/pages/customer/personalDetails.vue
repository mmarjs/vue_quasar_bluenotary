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
                <div class="q-gutter-sm q-pb-lg row">
                  <q-input
                    v-model="firstName"
                    class="col"
                    outlined
                    hint="First Name"
                    :dense="dense"
                  />
                  <q-input
                    v-model="middelName"
                    class="col"
                    outlined
                    hint="Middle Name"
                    :dense="dense"
                  />
                </div>
                <div class="q-gutter-sm q-pb-lg row">
                  <q-input
                    v-model="lastName"
                    class="col"
                    outlined
                    hint="Last Name"
                    :dense="dense"
                  />
                  <q-input
                    v-model="date"
                    outlined
                    placeholder="year/mth/day"
                    hint="Date of Birth"
                    mask="date"
                    :rules="['date']"
                    class="col"
                  >
                    <template v-slot:append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy
                          ref="qDateProxy"
                          cover
                          transition-show="scale"
                          transition-hide="scale"
                        >
                          <q-date v-model="date">
                            <div class="row items-center justify-end">
                              <q-btn
                                v-close-popup
                                label="Close"
                                color="primary"
                                flat
                              />
                            </div>
                          </q-date>
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </div>
                <div class="q-gutter-sm q-pb-lg row">
                  <q-input readonly standout class="col-4 col-md-2" label="X X X" />
                  <q-input readonly standout class="col-3 col-md-1" label="X X" />
                  <q-input
                    v-model="userSsn"
                    pattern="[0-9]{4}"
                    maxlength="4"
                    onkeypress="return event.charCode >= 48 && event.charCode <= 57"
                    type="text"
                    :rules="[ val => val.length >= 4 || 'SSN number should be 4 digits.', val => val.length <= 4 || 'SSN number should not be more than 4 digits.' ]"
                    class="col-3 col-md-2"
                    outlined
                    hint="Last 4 of SSN"
                    placeholder="_ _ _ _"
                    :dense="dense"
                  />
                  <div class="offset-md-1 q-mt-lg flex flex-center">
                    <div>
                      <small><u>Why do we need this?</u></small>
                      <q-tooltip :offset="[0, 10]">
                        <span style="font-size: 1rem">
                          We're required by state law to verify your identity
                          using your partial SSN.
                        </span>
                      </q-tooltip>
                    </div>
                  </div>
                </div>
                <div class="q-pt-lg">
                  <h5 class="">Residential Address</h5>
                  <p class="q-mb-md">
                    If you changed your residential address less than 30 days
                    ago, please enter your previous address.
                  </p>
                  <div class="row q-gutter-sm">
                    <q-input
                      v-model="addressLine1"
                      class="col-12 col-md-9"
                      outlined
                      hint="Address Line 1"
                      :dense="dense"
                    />
                    <q-input
                      v-model="addressLine2"
                      class="col-md-4 col-12"
                      outlined
                      hint="Address Line 2"
                      :dense="dense"
                    />
                    <q-select
                      v-model="userState"
                      :options="states"
                      class="col-md-3 col-4"
                      outlined
                      hint="State"
                      :dense="dense"
                    />
                    <q-input
                      v-model="userZipCode"
                      class="col-md-2 col-6"
                      outlined
                      hint="Zip Code"
                      :dense="dense"
                    />
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
                  <p>
                    State laws require strict identity verification to service
                    online notarizations. We use sophisticated and secure tech to make this
                    process as smooth as possible. Your personal information is
                    never stored or recorded. We will ask you <strong>5 personal questions</strong> and require a <strong>photo ID</strong>.
                  </p>
                  <p>You will have <strong>2 minutes to complete</strong> the KBA questions.</p>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
      <div class="col-12 q-my-xl">
        <p><q-icon name="access_time" /> You will have <strong>2 minutes to complete</strong> the 5 challenge questions in the next step.</p>
      </div>
      <!-- next btn -->
      <q-btn
        class="next-btn q-mt-md q-mb-xl"
        label="Next"
        color="primary"
        @click="nextButtonClick()"
      />
    </div>
  </q-page>
</template>

<script>
import { ref } from "@vue/composition-api";
import { $axios } from "boot/axios";
import states from "@/data/states.json";
import SessionHeader from "../../components/SessionHeader.vue";

export default {
  name: "PersonalDetails",
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
    };
  },
  watch: {
    async uploadFrontId (val) {
      if (val) {
        const img = new Image();
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
                  await this.fileUpload(newFile, "front", this.$q.localStorage.getItem("sessionData"));
                  const res = await this.loadPersonalData(this.$q.localStorage.getItem("sessionData"));
                  this.frontPhoto = (res && res.frontPhotoIdUrl) ? res.frontPhotoIdUrl : "";
                  this.backPhoto = (res && res.backPhotoIdUrl) ? res.backPhotoIdUrl : "";
                };
                imgCanvas.src = e.target.result;
              };
              reader.readAsDataURL(val);
            } else {
              await this.fileUpload(val, "front", this.$q.localStorage.getItem("sessionData"));
              const res = await this.loadPersonalData(this.$q.localStorage.getItem("sessionData"));
              this.frontPhoto = (res && res.frontPhotoIdUrl) ? res.frontPhotoIdUrl : "";
              this.backPhoto = (res && res.backPhotoIdUrl) ? res.backPhotoIdUrl : "";
            }
          }
        };
      }
    },

    async uploadBackId (val) {
      if (val) {
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
                  await this.fileUpload(newFile, "back", this.$q.localStorage.getItem("sessionData"));
                  const res = await this.loadPersonalData(this.$q.localStorage.getItem("sessionData"));
                  this.frontPhoto = (res && res.frontPhotoIdUrl) ? res.frontPhotoIdUrl : "";
                  this.backPhoto = (res && res.backPhotoIdUrl) ? res.backPhotoIdUrl : "";
                };
                imgCanvas.src = e.target.result;
              };
              reader.readAsDataURL(val);
            } else {
              await this.fileUpload(val, "back", this.$q.localStorage.getItem("sessionData"));
              const res = await this.loadPersonalData(this.$q.localStorage.getItem("sessionData"));
              this.frontPhoto = (res && res.frontPhotoIdUrl) ? res.frontPhotoIdUrl : "";
              this.backPhoto = (res && res.backPhotoIdUrl) ? res.backPhotoIdUrl : "";
            }
          }
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
    if (!this.calledFromBusinessPage) {
      if (!this.currentSession) {
        if (this.$user.testingacc && this.$user.testingacc === true) {
          this.$router.replace(`/business/personal_info/${this.sessionid}/?demo=true`).catch(() => {});
        } else {
          this.$router.replace(`/business/personal_info/${this.sessionid}`).catch(() => {});
        }
      } else if (this.$route.query.demo && this.$route.query.demo === "true") {
        this.$router.replace(`/business/personal_info/${this.sessionid}/?demo=true`).catch(() => {});
      } else if (this.$user.testingacc && this.$user.testingacc === true) {
        this.$router.replace(`/business/personal_info/${this.sessionid}/?demo=true`).catch(() => {});
      } else {
        this.$router.replace(`/business/personal_info/${this.sessionid}`).catch(() => {});
      }
    }
    const res = await this.loadPersonalData(this.sessionid, this.calledFromBusinessPage);
    if (res && res.firstName) {
      this.firstName = res.firstName;
      this.middelName = res.middelName;
      this.lastName = res.lastName;
      this.userSsn = res.userSsn;
      this.userZipCode = res.userZipCode;
      this.userState = res.userState;
      this.addressLine1 = res.addressLine1;
      this.addressLine2 = res.addressLine2;
      this.date = res.birthdate;
    }
    if ((this.$route.query.demo && this.$route.query.demo === "true") || this.calledFromBusinessPage) {
      console.log("this.$route.query.demo1 ", this.$route.query.demo);
      this.addressLine1 = "13584 ST RD 62";
      this.userZipCode = "47537";
      this.firstName = "Michael";
      this.middelName = "William";
      this.lastName = "Lindquist";
      this.userSsn = "2222";
      this.userState = "California";
      this.addressLine2 = "Lincoln Park";
      this.date = "1980/04/19";
    }
    console.log("loadPersonalData ", res);
  },
  setup () {
    const loading = ref(false);
    const expanded = ref(false);
    const firstName = ref("");
    const middelName = ref("");
    const lastName = ref("");
    const userSsn = ref("");
    const userZipCode = ref("");
    const userState = ref("");
    const dense = ref(false);
    const addressLine1 = ref("");
    const addressLine2 = ref("");
    const currentSession = ref(null);
    const date = ref("");
    const savePersonalData = async (seesion, data, calledFromBusinessPage) => {
      try {
        const url = "session/personalData";
        const messageToSend = {
          data,
          sessionId: seesion
        };
        if (calledFromBusinessPage) {
          messageToSend.additionalSigner = calledFromBusinessPage;
        }
        const response = await $axios.post(url, messageToSend, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        return response.data;
      } catch (error) {
        return error;
      }
    };
    const loadPersonalData = async (sessionId, calledFromBusinessPage) => {
      try {
        const url = "session/load/personalData";
        const messageToSend = {
          sessionId
        };
        if (calledFromBusinessPage) {
          messageToSend.additionalSigner = calledFromBusinessPage;
        }
        const response = await $axios.post(url, messageToSend, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        return response.data;
      } catch (error) {
        return error;
      }
    };
    return {
      loading,
      expanded,
      firstName,
      middelName,
      lastName,
      userSsn,
      userZipCode,
      userState,
      dense,
      addressLine1,
      addressLine2,
      savePersonalData,
      loadPersonalData,
      currentSession,
      date,
    };
  },
  methods: {
    async nextButtonClick () {
      this.savePersonalDetails();
    },
    async savePersonalDetails () {
      console.log("in save personal details");
      if (!this.firstName) {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please enter your first name.",
        });
      }
      if (!this.lastName) {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please enter your last name.",
        });
      }
      if (!this.userState) {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please select your state.",
        });
      }
      if (!this.addressLine1) {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please enter your address.",
        });
      }
      if (!this.userSsn) {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please enter your Last 4 digits of your SSN.",
        });
      }

      if (this.userSsn && this.userSsn.length !== 4) {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "SSN Number should be 4 digits.",
        });
      }
      if (!this.userZipCode) {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please enter your zip code.",
        });
      }
      if (!this.date) {
        return this.$q.notify({
          color: "secondary",
          position: "bottom-right",
          message: "Please select your birth date.",
        });
      }
      this.currentSession = this.$q.localStorage.getItem("sessionData");
      if (!this.currentSession && !this.calledFromBusinessPage) {
        this.$router.replace(`/business/personal_info/${this.sessionid}`).catch(() => {});
      }
      const data = {
        firstName: this.firstName,
        middelName: this.middelName,
        lastName: this.lastName,
        userSsn: this.userSsn,
        userZipCode: this.userZipCode,
        userState: this.userState,
        addressLine1: this.addressLine1,
        addressLine2: this.addressLine2,
        birthdate: this.date

      };
      const res = await this.savePersonalData(this.sessionid, data, this.calledFromBusinessPage);
      console.log("res ", res);
      // return "";
      // kbaModalChangeSection

      if (res && !this.calledFromBusinessPage) {
        const url = `session/setSessionStageOrStatus/${this.sessionid}/?type=stage&value=kba_check_stage`;
        await $axios.get(url, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (this.$route.query.demo && this.$route.query.demo === "true") {
          this.$router.replace(`/business/kba/${this.sessionid}/?demo=true`).catch(() => {});
        } else if (this.$user.testingacc && this.$user.testingacc === true) {
          this.$router.replace(`/business/kba/${this.sessionid}/?demo=true`).catch(() => {});
        } else {
          this.$router.replace(`/business/kba/${this.sessionid}`).catch(() => {});
        }
        // const sessionSaveUrl = `session/saveSessionData/${this.sessionid}`;
        // const dataToSave = {
        //   // sessionOpenCallForTaking: true
        // };
        // await $axios.post(sessionSaveUrl, {
        //   data: dataToSave
        // });
      }
      if (this.calledFromBusinessPage) {
        this.kbaModalChangeSection("kba");
      }
      return "";
    },
  },
};
</script>

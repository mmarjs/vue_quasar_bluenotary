<template>
  <q-page class="q-pa-md flex-center session-container">
    <div class="row">
      <div class="col-12 col-md-12">
        <session-header v-if="sessionid" :session-id="sessionid" />
      </div>
      <div class="col-12 col-md-12 q-pa-lg workflow-container">
        <div
          class="
            flex
            justify-between
            q-pt-md q-pb-md
            workflow-icons
            q-gutter-md
            text-center
          "
        >
          <div class="col flex column flex-center black-border-bottom">
            <img src="~assets/document-upload.svg" class="session-guide-icon" />
            <p class="q-pa-md">1. Upload Document</p>
          </div>
          <div class="col column flex flex-center mobile-hide">
            <img src="~assets/id-card.svg" class="session-guide-icon" />
            <p class="q-pa-md">2. Identity Check</p>
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
        <div class="col-12 col-md-8 flex q-mt-lg hidden">
          <div class="flex column">
            <h6 class="no-margin">Notarize Timing</h6>
            <div class="row doc-list-preview">
              <div class="q-pt-sm">
                <!-- <q-radio v-model="notorizationTiming" val="notarize_now" label="Notarize Now" /> -->
                <q-radio v-model="notorizationTiming" val="notarize_later" label="Notarize Later" />
              </div>
            </div>
          </div>
        </div>
        <div v-if="notorizationTiming === 'notarize_later'" class="col-12 col-md-8 flex">
          <div class="flex column fcmn">
            <!-- <h6 class="no-margin">Choose desired date & time for notarization</h6> -->
            <div class="row doc-list-preview rdlpreview">
              <div class="q-py-md">
                <h3 class="">
                  Notarization Meeting Date & Time
                </h3>
                <div class="flex">
                  <div class="tzone-cust">
                    <q-input
                      v-model="meetingdate"
                      dense
                      filled
                      class="q-py-sm"
                      type="text"
                      label="Meeting Date & Time"
                      :disable="meetingDateTimeDisabled"
                      @click="notarizationDateTimeInputFieldClicked"
                    >
                      <template v-slot:prepend>
                        <q-icon name="event" />
                      </template>
                    </q-input>
                  </div>
                  <div class="q-pl-sm tzone-cust">
                    <q-select
                      v-model="meetingTimeZone"
                      filled
                      class="q-py-sm"
                      dense
                      style="min-width:200px"
                      label="Timezone"
                      :options="selectedTimezone"
                      input-debounce="0"
                      :options-dense="true"
                      :disable="meetingDateTimeDisabled"
                      :error="!tmzSelected"
                      :error-message="`Please select timezone.`"
                      @filter="timezoneFilterFn"
                      @input="timezoneSelectUpdated()"
                    >
                      <template v-slot:prepend>
                        <q-icon name="language" />
                      </template>
                    </q-select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-8 flex">
          <div class="full-width">
            <strong><q-checkbox v-model="multiSignerFlag" label="Add Multiple Signers" /></strong>
          </div>
          <div class="q-mx-md">
            <small><a href="https://bluenotary.freshdesk.com/support/solutions/articles/72000551411-how-does-multi-signer-session-work-" target="_blank"><u>How does multi-signer session work?</u></a></small>
          </div>
        </div>
        <div class="col-12">
          <div v-if="multiSignerFlag" class="flex column no-margin">
            <div v-for="signerItem in multiSignerList" :key="signerItem.id" class="row" style="margin-top: 8px;">
              <div class="col-md-3 col-xs-10">
                <q-input v-model="signerItem.email" filled label="Secondary Signer Email" type="email" />
              </div>
              <div class="col-2">
                <q-btn flat round color="primary" outline icon="highlight_off" style="font-size: 17px" @click="removeSignerEmail(signerItem.id)" />
              </div>
            </div>
            <q-btn color="primary" outline label="Add More" class="q-mt-md" @click="addMoreSignerButton" />
          </div>
        </div>
        <div class="col-12 col-md-8 flex q-mt-lg">
          <div class="flex column">
            <h6 class="no-margin"><strong>Documents to Notarize</strong></h6>
            <p v-if="!(sessionData.document && sessionData.document.length)" class="text-faded">Uploaded documents will display here</p>
            <div class="row doc-list-preview">
              <ul class="">
                <li
                  v-for="(item, key) of sessionData.document"
                  :key="key"
                  class="q-mt-md q-mb-md"
                >
                  <div class="flex justify-between">
                    <span class="q-pa-sm q-px-xl doc-title">{{ item.name }}</span>
                    <div>
                      <q-btn icon="visibility" @click="previewDoc(item)" />
                      <q-btn icon="delete" @click="deleteDoc(sessionData.session._id, item._id)" />
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div
            v-if="showDocumentUploadPicker"
            class="file-drop-zone q-mt-md"
            @drop.prevent="addFile"
            @dragover.prevent
            @dragenter.prevent
            @dragleave.prevent
          >
            <div class="file-decorate">
              <div id="article" class="q-pa-xl">
                <div v-if="uploading">
                  <q-spinner
                    color="primary"
                    size="3em" />
                  <p class="no-margin q-pt-md text-faded">
                    Uploading document, please wait...
                  </p>
                </div>
                <div v-if="!uploading">
                  <q-btn
                    class="browse-btn q-pa-md"
                    label="Upload document"
                    color="primary"
                    @click="$refs.fileinputArticle.$el.click()"
                  />
                  <p class="no-margin q-pt-md text-faded">
                    Drop the full document as PDF file or browse on your device
                  </p>
                  <q-file
                    v-show="false"
                    ref="fileinputArticle"
                    v-model="pickedArticleFile"
                    standout
                    color="primary"
                    label="Add a document"
                    accept=".pdf"
                  />
                </div>
              </div>
            </div>
          </div>
          <div v-if="docSelected === false">
            <p class="red-error">Please upload document.</p>
          </div>
        </div>
        <q-btn
          class="next-btn q-mt-md q-mb-xl"
          label="Next"
          color="primary"
          @click="goesNext()"
        />
        <!-- :disabled="(sessionData.length === 0 || !sessionData.document.length)" -->
      </div>
    </div>
    <!-- modal preview of document -->
    <q-dialog v-model="uploaded">
      <q-card style="min-width: 80%">
        <q-card-section>
          <div class="text-h6">Document Preview</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="row input-block">
            <div class="col-12">
              <div
                class="form-img-block"
                style="border: none; padding: 0px; width: 100%"
              >
                <div
                  class="col-12 flex vcenter"
                  style="
                    display: block;
                    width: 100%;
                    height: 60vh;
                    overflow: auto;
                    background: white;
                  "
                >
                  <template v-if="!rendered">
                    <div class="renderer">
                      <q-spinner
                        color="primary"
                        size="3em" />
                    </div>
                  </template>
                  <div id="pdfvuer">
                    <VuePdfEmbed ref="pdfRef" :source="pdfSource" @rendered="handleDocumentRender" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            v-close-popup
            label="Continue"
            color="primary"
            @click="closeDialog()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="deleteConfirm" persistent>
      <q-card class="q-pa-sm">
        <q-card-section class="column">
          <q-avatar icon="delete_forever" color="primary" text-color="white" />
          <span class="q-ml-sm"> Are you sure? </span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-if="!loading" v-close-popup flat label="Cancel" color="primary" />
          <q-btn
            flat
            label="Remove"
            color="primary"
            :loading="loading"
            @click="deleteSessionItem()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- <q-dialog v-model="browserIncompatibilityError" persistent>
      <q-card class="q-pa-sm">
        <q-card-section class="column">
          <span class="q-ml-sm">To ensure optimal performance for sessions, we require use of <a href="https://www.google.com/chrome/">Chrome browser</a>.</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat label="I understand" color="primary" />
        </q-card-actions>
      </q-card>
    </q-dialog> -->

    <q-dialog v-model="openDateTimePickerModal">
      <q-card style="max-width: none">
        <q-card-section>
          <div class="text-h6">Select Desired Notarization Date and Time</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="q-py-md row justify-between">
            <q-date
              v-model="meetingdate"
              :options="optionsFn"
              mask="YYYY-MM-DD hh:mm A"
              color="primary"
            />
            <div class="mtdate">
              <q-time
                v-model="meetingdate"
                mask="YYYY-MM-DD hh:mm A"
                color="primary"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat label="OK" color="primary" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref } from "@vue/composition-api";
import VuePdfEmbed from "vue-pdf-embed/dist/vue2-pdf-embed";
import { $axios } from "boot/axios";
import { v4 as uuidV4 } from "uuid";
import { date } from "quasar";
import moment from "moment";
import __ from "lodash";
import SessionHeader from "../../components/SessionHeader.vue";

export default {
  name: "PrepareDoc",
  components: { VuePdfEmbed, SessionHeader },
  data() {
    return {
      uploading: false,
      sessionid: "",
      // browserIncompatibilityError: false,
      notorizationTiming: "notarize_later",
      meetingdate: "",
      openDateTimePickerModal: false,
      window,
      timezoneValues: [],
      selectedTimezone: [],
      meetingTimeZone: "",
      meetingDateTimeDisabled: false,
      multiSignerFlag: false,
      multiSignerList: [
        {
          id: "input0",
          email: ""
        }
      ]
    };
  },
  computed: {
    showDocumentUploadPicker () {
      const uploadPickerShow = true;
      // if (this.$user.memberType !== "pro" && this.sessionData.document && this.sessionData.document.length) {
      //   uploadPickerShow = false;
      // }
      return uploadPickerShow;
    }
  },
  watch: {
    async pickedArticleFile (val) {
      this.uploading = true;
      if (val) {
        console.log("article", val);
        await this.uploadZip(val);
      }
      this.uploading = false;
      this.docSelected = true;
    },
    sessionData: {
      handler(value) {
        if (value && value.session && value.session._id) {
          this.sessionid = value.session._id;
        }
      },
      deep: true
    }
  },
  async mounted () {
    this.docSelected = true;
    // this.browserIncompatibilityError = !(/chrome/i.test(navigator.userAgent));
    this.sessionid = (this.$route.params && this.$route.params.id) || false;
    if (this.sessionid) {
      this.currentSession = this.sessionid;
      this.$q.localStorage.set("sessionData", this.currentSession);
    } else {
      this.currentSession = "new";
      this.$q.localStorage.set("sessionData", this.currentSession);
    }

    const res = await this.loadSessionData(this.currentSession, this.$user._id);
    this.sessionData = res;
    console.log(this.sessionData);
    if (this.sessionData && this.sessionData.session && this.sessionData.session.multiSignerList && this.sessionData.session.multiSignerList.length) {
      this.multiSignerFlag = true;
      this.multiSignerList = this.sessionData.session.multiSignerList;
    }

    if (this.currentSession === "new") {
      this.currentSession = res.session._id;
      this.$q.localStorage.set("sessionData", res.session._id);
    }
    if (this.$route.query.demo && this.$route.query.demo === "true") {
      this.$router.replace(`/business/prepare_doc/${this.currentSession}/?demo=true`).catch(() => {});
    } else if (this.$user.testingacc && this.$user.testingacc === true) {
      this.$router.replace(`/business/prepare_doc/${this.currentSession}/?demo=true`).catch(() => {});
    } else {
      this.$router.replace(`/business/prepare_doc/${this.currentSession}`).catch(() => {});
    }
    this.timezoneValues = window.allTimeZones;
    const allowedTimezones = ["(GMT-10:00) Hawaii", "(GMT-08:00) Pacific", "(GMT-07:00) Mountain", "(GMT-06:00) Central", "(GMT-05:00) Eastern"];
    this.selectedTimezone = this.timezoneValues.filter((timezone) => allowedTimezones.indexOf(timezone.label) >= 0);
    let timezone = String(((new Date().getTimezoneOffset()) / 60) * -1);
    if (this.sessionData && this.sessionData.session && this.sessionData.session.meetingTimeZone) {
      timezone = this.sessionData.session.meetingTimeZone;
    }
    __.map(this.selectedTimezone, (tempValue) => {
      if (tempValue.value === timezone) {
        this.meetingTimeZone = tempValue;
      }
    });
    if (this.sessionData && this.sessionData.session && this.sessionData.session.meetingdate) {
      this.meetingdate = this.sessionData.session.meetingdate;
      if (this.sessionData.session.notaryUserId) {
        this.meetingDateTimeDisabled = true;
      }
    } else {
      this.meetingdate = moment().format("YYYY-MM-DD h:mm A");
    }
  },
  setup (_, context) {
    const {
      root: { $q }
    } = context;
    // setup () {
    const docSelected = ref(true);
    const tmzSelected = ref(true);
    const loading = ref(false);
    const pickedArticleFile = ref(null);
    const articleLoaded = ref(false);
    const uploaded = ref(false);
    const rendered = ref(false);
    const pdfSource = ref("");
    const page = ref(null);
    const sessionConfirm = ref(false);
    const currentSession = ref(null);
    const sessionData = ref([]);
    const deleteConfirm = ref(false);
    const deleteItem = ref(null);
    const documentDeleteItem = ref(null);
    const uploadZip = async (data) => {
      try {
        const url = "file/uploadFiles";
        const formData1 = new FormData();
        formData1.append("id", currentSession.value);
        formData1.append("file", data);
        const response = await $axios.post(url, formData1, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        const oldDocumentValues = (sessionData.value && sessionData.value.document) || [];
        if (response.data && response.data.document) {
          oldDocumentValues.push(response.data.document[0]);
        }
        sessionData.value = response.data;
        sessionData.value.document = oldDocumentValues;
        uploaded.value = true;
        rendered.value = false;
        pdfSource.value = response.data.url;
        return response.data;
      } catch (error) {
        return error;
      }
    };
    const loadSessionData = async (sessionId, userId) => {
      try {
        const url = "session/loads";
        const response = await $axios.post(url, { sessionId, userId }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        return response.data;
      } catch (error) {
        return error;
      }
    };
    const addFile = async (e) => {
      const droppedFiles = e.dataTransfer.files;
      if (!droppedFiles) return;
      try {
        if (!droppedFiles[0].name.endsWith(".pdf")) {
          return;
        }
        await uploadZip(droppedFiles[0]);
      } catch (error) {
        console.log("error", error);
      }
    };
    const closeDialog = async () => {
      rendered.value = false;
    };
    const continueSession = async () => {
      // load current session data from the Database.

    };
    const startNewSession = async () => {
      currentSession.value = uuidV4();
      $q.localStorage.set("sessionData", currentSession.value);
    };

    const previewDoc = async (item) => {
      console.log(item);
      uploaded.value = true;
      rendered.value = false;
      pdfSource.value = item.url;
    };
    const handleDocumentRender = async () => {
      rendered.value = true;
    };
    const deleteDoc = async (sessionId, documentId) => {
      console.log(sessionId);
      deleteConfirm.value = true;
      deleteItem.value = sessionId;
      documentDeleteItem.value = documentId;
    };
    const deleteSessionItem = async () => {
      loading.value = true;
      console.log("deleteItem ", deleteItem.value);
      try {
        const url = "session/documentDelete";
        const response = await $axios.post(url, { sessionId: deleteItem.value, documentId: documentDeleteItem.value }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log("loadSessionData", response.data);
        let oldDocumentValues = (sessionData.value && sessionData.value.document) || [];
        oldDocumentValues = __.filter(oldDocumentValues, (documentItem) => documentItem._id !== documentDeleteItem.value);
        sessionData.value = response.data;
        sessionData.value.document = oldDocumentValues;
      } catch (error) {
        console.log(error);
      }
      deleteConfirm.value = false;
      loading.value = false;
      pickedArticleFile.value = null;
    };
    return {
      loading,
      pickedArticleFile,
      articleLoaded,
      addFile,
      uploaded,
      rendered,
      uploadZip,
      pdfSource,
      page,
      closeDialog,
      sessionConfirm,
      continueSession,
      startNewSession,
      currentSession,
      sessionData,
      previewDoc,
      deleteDoc,
      deleteConfirm,
      deleteItem,
      deleteSessionItem,
      loadSessionData,
      handleDocumentRender,
      docSelected,
      tmzSelected,
    };
  },
  methods: {
    timezoneSelectUpdated() {
      this.tmzSelected = true;
    },
    goesNext() {
      this.docSelected = true;
      this.tmzSelected = true;
      if (!(this.meetingTimeZone.value)) {
        this.tmzSelected = false;
        return;
      }
      if (this.sessionData.length === 0 || this.sessionData.document.length === 0) {
        this.docSelected = false;
        return;
      }
      if (this.notorizationTiming === "notarize_later" && !this.meetingdate) {
        this.$q.notify({
          color: "red",
          position: "bottom-right",
          message: "Please select Meeting Date for Notarize Later Option",
        });
        return;
      }
      const url = `session/saveSessionData/${this.sessionid}`;
      const dataToSave = {
        notorizationTiming: this.notorizationTiming
      };
      if (this.meetingdate) {
        dataToSave.meetingdate = this.meetingdate;
      }
      if (this.meetingTimeZone) {
        const currentTimeZoneOffset = parseFloat(String((new Date()).getTimezoneOffset() / 60)) * -1;
        const currentMeetingTimeZone = parseFloat(this.meetingTimeZone.value);
        console.log(currentTimeZoneOffset, currentMeetingTimeZone);
        const finalOffset = (currentMeetingTimeZone - currentTimeZoneOffset) * 60;
        console.log(finalOffset);
        const meetingDateTimeObj = moment(this.meetingdate, "YYYY-MM-DD hh:mm A").utcOffset(finalOffset, true);
        console.log(this.meetingdate, this.meetingTimeZone.value, meetingDateTimeObj, moment().add(currentTimeZoneOffset * 60, "minutes") - meetingDateTimeObj);
        if (!(this.sessionData && this.sessionData.session && this.sessionData.session.notaryUserId)) {
          if (moment().add(currentTimeZoneOffset * 60, "minutes") - meetingDateTimeObj > -3600000) {
            this.$q.notify({
                type: "negative",
                message: "Please select valid date and time"
              });
            return;
          }
        }
        dataToSave.meetingTimeZone = this.meetingTimeZone.value;
        dataToSave.currentTimeZone = String((new Date()).getTimezoneOffset() / -60);
      }
      if (this.multiSignerFlag) {
        dataToSave.multiSignerList = this.multiSignerList;
      }
      $axios.post(url, {
        data: dataToSave
      });
      if (this.$user.testingacc && this.$user.testingacc === true) {
        this.$router.replace(`/business/personal_info/${this.sessionid}/?demo=true`).catch(() => {});
      } else {
        this.$router.replace(`/business/personal_info/${this.sessionid}`).catch(() => {});
      }
    },
    optionsFn (selectedDate) {
      return selectedDate >= date.formatDate(Date.now(), "YYYY/MM/DD");
    },
    notarizationDateTimeInputFieldClicked() {
      this.openDateTimePickerModal = true;
    },
    timezoneFilterFn (val, update) {
      if (val === "") {
        update(() => {
          this.timezoneValues = window.allTimeZones;
        });
        return;
      }

      update(() => {
        const needle = val.toLowerCase();
        this.timezoneValues = window.allTimeZones.filter((v) => v.label.toLowerCase().indexOf(needle) > -1);
      });
    },
    addMoreSignerButton() {
      this.multiSignerList.push({
        id: `input${String(this.multiSignerList.length)}`,
        email: ""
      });
    },
    removeSignerEmail(signerId) {
      this.multiSignerList = __.filter(this.multiSignerList, (signerDoc) => signerDoc.id !== signerId);
    }
  }
};
</script>

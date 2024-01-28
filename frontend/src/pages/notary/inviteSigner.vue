<template>
  <q-layout>
    <q-page-container class="q-pa-xl">
      <q-page class="container">
        <div class="row flex">
          <div class="col col-sm-8 col-md-6 offset-md-1">
            <h1>
              Invite A Signer
            </h1>
            <p class="q-my-md">We'll create a new session for you and send an invitation to the signer via email about how to get started with the process along with a date & time for the virtual meeting. <strong>The invitee will be assigned to you automatically.</strong></p>
            <q-card class="q-pa-sm">
              <q-card-section>
                <q-form class="">
                  <h3 class="q-pb-sm">
                    Signer Details
                  </h3>
                  <q-input
                    v-model="$v.model.signerName.$model"
                    dense
                    filled
                    type="text"
                    label="Signer Name"
                    :error-message="errorMessage($v.model.signerName, 'Name')"
                    :error="!!errorMessage($v.model.signerName)"
                  >
                    <template v-slot:prepend>
                      <q-icon name="account_box" />
                    </template>
                  </q-input>
                  <q-input
                    v-model="$v.model.signerEmail.$model"
                    dense
                    filled
                    type="email"
                    label="Signer Email"
                    :error-message="errorMessage($v.model.signerEmail, 'Email')"
                    :error="!!errorMessage($v.model.signerEmail)"
                  >
                    <template v-slot:prepend>
                      <q-icon name="email" />
                    </template>
                  </q-input>
                  <div>
                    <div class="full-width">
                      <q-checkbox v-model="multiSignerFlag" label="Add Multiple Signers to this Session" :disable="!enableAdditionalSigners" />
                      <q-icon v-if="!enableAdditionalSigners" name="info" class="q-ml-sm" style="cursor: pointer;" @click="showUpgradePopup">
                        <q-tooltip>
                          Feature for Pro Accounts. Click for more info
                        </q-tooltip>
                      </q-icon>
                    </div>
                    <div class="q-mx-md">
                      <small><a href="https://bluenotary.freshdesk.com/en/support/solutions/articles/72000551402-how-does-multi-signer-session-work-" target="_blank"><u>How does multi-signer session work?</u></a></small>
                    </div>
                  </div>
                  <div class="col-12">
                    <div v-if="multiSignerFlag" class="flex column no-margin">
                      <div v-for="signerItem in multiSignerList" :key="signerItem.id" class="row" style="margin-top: 8px;">
                        <div class="col-6">
                          <q-input v-model="signerItem.email" dense filled label="Secondary Signer Email" type="email" />
                        </div>
                        <div class="col-2">
                          <q-btn flat outline color="primary" icon="clear" style="font-size: 17px" @click="removeSignerEmail(signerItem.id)" />
                        </div>
                      </div>
                      <q-btn icon="add" outline class="q-mt-sm" round @click="addMoreSignerButton" />
                    </div>
                  </div>
                  <div class="q-py-md">
                    <h3>
                      Session Type
                    </h3>
                    <div class="">
                      <div class="col" style="margin-top: 8px">
                        <q-select
                          v-model="sessionType"
                          filled
                          dense
                          :options="allSessionTypes"
                          label="Select Session Type"
                          icon="assignment"
                          input-debounce="0"
                          :options-dense="true"
                        >
                          <template v-slot:prepend>
                            <q-icon name="assignment" />
                          </template>
                        </q-select>
                      </div>
                    </div>
                  </div>
                  <div class="q-py-md">
                    <h3>
                      Meeting Date & Time
                    </h3>
                    <div class="">
                      <div class="col">
                        <q-input
                          v-model="model.meetingdate"
                          dense
                          filled
                          class="q-py-sm"
                          type="text"
                          label="Meeting Date & Time"
                          @click="notarizationDateTimeInputFieldClicked"
                        >
                          <template v-slot:prepend>
                            <q-icon name="event" />
                          </template>
                        </q-input>
                      </div>
                      <div class="col">
                        <q-select
                          v-model="meetingTimeZone"
                          filled
                          dense
                          :options="selectedTimezone"
                          label="Select Timezone"
                          use-input
                          icon="watch_later"
                          input-debounce="0"
                          :options-dense="true"
                          @filter="timezoneFilterFn"
                        >
                          <template v-slot:prepend>
                            <q-icon name="watch_later" />
                          </template>
                        </q-select>
                      </div>
                    </div>
                  </div>
                  <!-- <div v-if="$user.memberType !== 'pro'">
                    <h3 class="q-pb-sm upgradebrn" style="display:inline-block;">To use pre-tagged document templates </h3>
                    <q-btn
                        class="browse-btn"
                        label="upgrade to pro"
                        color="blue"
                        @click="showUpgradePopup"
                      />
                  </div> -->
                  <div v-if="$user.memberType !== 'pro'" class="ptdt">
                    <upgrade-account-popup-component :open-acc-pro-model="openUpgradePopup" />
                    <h3 class="q-pt-md q-pb-sm">
                      Select Pre-Tagged Document Template
                    </h3>
                    <q-select
                      dense
                      filled
                      clearable
                      label="Document Template"
                      style="margin-bottom:15px;"
                      @click="showUpgradePopup"
                    >
                      <template v-slot:prepend>
                        <q-icon name="description" />
                      </template>
                    </q-select>
                    <div v-if="!selectedTemplate" class="horizontalLine" style="padding-top: 15px"><span>OR</span></div>
                  </div>
                  <div v-if="$user.memberType === 'pro'" class="q-py-lg" style="padding-bottom: 0px">
                    <h3 class="q-pb-sm">
                      Select Pre-Tagged Document Template
                    </h3>
                    <q-select
                      v-model="selectedTemplate"
                      dense
                      filled
                      clearable
                      :options="templates"
                      label="Document Template"
                      style="margin-bottom:15px;"
                    />
                    <div v-if="!selectedTemplate" class="horizontalLine" style="padding-top: 15px"><span>OR</span></div>
                  </div>
                  <div v-if="!selectedTemplate" class="q-py-lg">
                    <h3 class="">
                      Upload Document
                    </h3>
                    <div class="q-py-md">
                      <small>Upload the PDF document (Max 25MB) here if you have already received it from the client. Otherwise, leave this blank.</small>
                    </div>
                    <div class="q-py-md">
                      <q-btn
                        class="browse-btn q-pa-sm full-width"
                        label="Upload client documents"
                        outline
                        @click="$refs.fileinputDocument.$el.click()"
                      />
                      <div v-if="$refs.fileinputDocument !== undefined && $refs.fileinputDocument.selectedString" class="q-pa-lg">
                        <div v-for="localDocument in notaryDocuments" :key="localDocument.name">
                          <q-icon name="check_circle" color="green" style="font-size:2rem;padding:10px;" />
                          <u>{{ localDocument.name }}</u>
                          <q-btn flat icon="clear" @click.stop.prevent="removeDocument(localDocument)" />
                        </div>
                      </div>
                      <q-file
                        v-show="false"
                        ref="fileinputDocument"
                        v-model="notaryDocument"
                        standout
                        max-file-size="25000000"
                        color="primary"
                        label="Add a document"
                        accept=".pdf"
                        @rejected="onRejected"
                      />
                    </div>
                  </div>
                  <q-btn
                    size="md"
                    color="blue"
                    class="text-white"
                    type="button"
                    label="Send Invite"
                    :loading="isSubmitting"
                    :disable="isSubmitting"
                    @click="sendInviteToSigner"
                  />
                </q-form>
              </q-card-section>
            </q-card>
          </div>
          <div class="col col-md-4 q-pl-xl q-pt-xl mbhide">
            <h3 class="text-center q-pb-sm">Sample Preview of Email</h3>
            <img src="https://bluenotary.us/assets/img/invite-iphone-preview.png" />
          </div>
        </div>
      </q-page>
    </q-page-container>
    <q-dialog v-model="openDateTimePickerModal">
      <q-card style="min-width: 650px">
        <q-card-section>
          <div class="text-h6">Select Notarization Date and Time</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="q-py-md row justify-between">
            <q-date
              v-model="model.meetingdate"
              :options="optionsFn"
              mask="YYYY-MM-DD hh:mm A"
              color="primary"
            />
            <div style="margin-left:12px">
              <q-time
                v-model="model.meetingdate"
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
  </q-layout>
</template>

<script>
import { required, email } from "vuelidate/lib/validators";
import VuelidateHelperMixin from "@/mixins/VuelidateHelperMixin";
import { reactive } from "@vue/composition-api";
import { $axios } from "boot/axios";
import { date } from "quasar";
import moment from "moment";
import __ from "lodash";
import $ from "jquery";
import UpgradeAccountPopupComponent from "./upgradeAccount.vue";

export const emailFormatter = (value) => {
  if (!value) return value;
  return value.toLowerCase();
};

export default {
  name: "InviteSigner",
  components: { UpgradeAccountPopupComponent },
  mixins: [VuelidateHelperMixin],
  data() {
    return {
      openUpgradePopup: false,
      notaryDocument: [],
      notaryDocuments: [],
      openDateTimePickerModal: false,
      window,
      timezoneValues: [],
      selectedTimezone: [],
      meetingTimeZone: "",
      templates: [],
      selectedTemplate: null,
      multiSignerFlag: false,
      multiSignerList: [
        {
          id: "input0",
          email: ""
        }
      ],
      enableAdditionalSigners: false,
      sessionType: {
        value: "gnw",
        label: "GNW"
      },
      allSessionTypes: [
        {
          value: "gnw",
          label: "GNW"
        },
        {
          value: "loan_signing",
          label: "Loan Signing"
        },
      ]
    };
  },

  watch: {
    notaryDocument: {
      handler(value) {
        if (value) {
          if (this.$user.memberType === "pro") {
            this.notaryDocuments.push(value);
          } else {
            this.notaryDocuments = [value];
          }
        }
      }
    },
    sessionType: {
      handler(value) {
        if (value && value.value === "loan_signing" && this.$user.memberType === "free") {
          this.sessionType = this.allSessionTypes[0];
          this.showUpgradePopup();
        }
      }
    }
  },
  async mounted() {
    if (this.$user.memberType === "pro") {
      await this.loadTemplates();
      this.enableAdditionalSigners = true;
    }
    this.timezoneValues = window.allTimeZones;
    const allowedTimezones = ["(GMT-10:00) Hawaii", "(GMT-08:00) Pacific", "(GMT-07:00) Mountain", "(GMT-06:00) Central", "(GMT-05:00) Eastern"];
    this.selectedTimezone = this.timezoneValues.filter((timezone) => allowedTimezones.indexOf(timezone.label) >= 0);
    console.log(this.selectedTimezone);
    const timezone = String(((new Date().getTimezoneOffset()) / 60) * -1);
    __.map(this.selectedTimezone, (tempValue) => {
      if (tempValue.value === timezone) {
        this.meetingTimeZone = tempValue;
      }
    });
    $(document).on("click", ".ptdt", () => {
      this.showUpgradePopup();
    });
  },
  setup() {
    const model = reactive({
      signerName: "",
      signerEmail: "",
      meetingdate: "",
      notaryDocument: "",
    });
    return {
      model,
      isSubmitting: false,
      optionsFn (selectedDate) {
        return selectedDate >= date.formatDate(Date.now(), "YYYY/MM/DD");
      },
    };
  },
  validations: {
    model: {
      signerName: {
        required,
      },
      signerEmail: {
        required,
        email: (val) => email(emailFormatter(val)),
      },
      meetingdate: {
      },
    },
  },
  methods: {
    notarizationDateTimeInputFieldClicked() {
      this.openDateTimePickerModal = true;
    },
    showUpgradePopup() {
      this.openUpgradePopup = false;
      setTimeout(() => {
        this.openUpgradePopup = true;
      }, 200);
    },
    async loadTemplates() {
      const url = "notary/templateOptions";
      const dataToSend = {
        notary_user_id: this.$user._id,
      };
      const response = await $axios.post(url, dataToSend, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      const templateDatas = response.data;
      this.templates = __.map(templateDatas, (tempDoc) => {
        tempDoc.label = tempDoc.name;
        tempDoc.value = tempDoc._id;
        return tempDoc;
      });
    },
    async sendInviteToSigner() {
      this.isSubmitting = true;
      this.$v.model.$touch();
      if (!this.$v.model.$invalid) {
        try {
          if ((this.meetingTimeZone.value === "" || this.meetingTimeZone.value === undefined) || (this.model.meetingdate === "")) {
            this.isSubmitting = false;
            this.$q.notify({
                type: "negative",
                message: "Please select meeting date & time and timezone"
              });
            return;
          }
          if (this.model.meetingdate && (this.meetingTimeZone.value === "" || this.meetingTimeZone.value === undefined)) {
            this.isSubmitting = false;
            this.$q.notify({
                type: "negative",
                message: "Please select Meeting timezone"
              });
            return;
          }
          if (this.model.meetingdate && (this.meetingTimeZone.value !== "" || this.meetingTimeZone.value !== undefined)) {
            const currentTimeZoneOffset = parseFloat(String((new Date()).getTimezoneOffset() / 60)) * -1;
            const currentMeetingTimeZone = parseFloat(this.meetingTimeZone.value);
            const finalOffset = (currentMeetingTimeZone - currentTimeZoneOffset) * 60;
            const meetingDateTimeObj = moment(this.model.meetingdate, "YYYY-MM-DD hh:mm A").utcOffset(finalOffset, true);
            // console.log(this.model.meetingdate, this.meetingTimeZone.value, moment() - meetingDateTimeObj);
            console.log(this.model.meetingdate, this.meetingTimeZone.value, meetingDateTimeObj, moment().add(currentTimeZoneOffset * 60, "minutes") - meetingDateTimeObj);
            if (moment().add(currentTimeZoneOffset * 60, "minutes") - meetingDateTimeObj > -3600000) {
              this.isSubmitting = false;
              this.$q.notify({
                  type: "negative",
                  message: "Please select valid date and time"
                });
              return;
            }
          }
          const url = "/file/invite-signer";
          const templateId = this.selectedTemplate ? this.selectedTemplate.value : null;
          const formData = new FormData();
          formData.append("notary_user_id", this.$user._id);
          formData.append("name", this.model.signerName);
          formData.append("email", this.model.signerEmail);
          formData.append("meetingdate", this.model.meetingdate);
          formData.append("meetingTimeZone", this.meetingTimeZone.value);
          formData.append("currentTimeZone", String((new Date()).getTimezoneOffset() / -60));
          formData.append("sessionType", this.sessionType.value);
          if (this.multiSignerFlag) {
            formData.append("multiSignerList", JSON.stringify(this.multiSignerList));
          }
          if (templateId) {
            formData.append("template", templateId);
          }

          if (this.notaryDocuments) {
            __.map(this.notaryDocuments, (tempDocument) => {
              formData.append("file", tempDocument);
            });
          }
          console.log(formData);
          const response = await $axios.post(url, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          console.log(response);
          this.$q.notify({
            color: "primary",
            position: "bottom-right",
            message: "We have sent an invitation to signer.",
          });
          this.$router.replace("/notary/my-sessions/");
        } catch (error) {
          console.log(error);
        }
      }
      this.isSubmitting = false;
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
    onRejected () {
      this.$q.notify({
        type: "negative",
        message: "Selected document size is exceeding the maximum file size of 25MB."
      });
    },
    calculateTime(offset) {
        // create Date object for current location
        const d = new Date();
        // convert to msec
        // subtract local time zone offset
        // get UTC time in msec
        const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        // create new Date object for different city
        // using supplied offset
        const nd = new Date(utc + (3600000 * offset));
        // return time as a string
        return nd.toLocaleString();
    },
    addMoreSignerButton() {
      this.multiSignerList.push({
        id: `input${String(this.multiSignerList.length)}`,
        email: ""
      });
    },
    removeSignerEmail(signerId) {
      this.multiSignerList = __.filter(this.multiSignerList, (signerDoc) => signerDoc.id !== signerId);
    },
    removeDocument(tempDocument) {
      this.notaryDocuments = __.filter(this.notaryDocuments, (uploadedDocument) => uploadedDocument.name !== tempDocument.name);
    }
  },
};
</script>

<style>
.horizontalLine {
   width: 100%;
   text-align: center;
   border-bottom: 1px solid #000;
   line-height: 0.1em;
   margin: 10px 0 20px;
}

.horizontalLine span {
    background:#fff;
    padding:0 10px;
    font-weight: bold;
}
</style>

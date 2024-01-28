<template>
  <q-layout>
    <q-page-container class="container">
      <q-page class="q-pa-lg">
        <div class="flex justify-between q-py-md items-center">
          <h1 class="q-mb-sm">Documents</h1>
          <router-link to="/business/prepare_doc">
            <q-btn
              color="primary"
              :disable="cannotStartNewSession"
              label="Start New Notarization"
            />
          </router-link>
        </div>
        <template v-if="loading">
          <div class="renderer">
            <img src="/icons/Loading.gif" alt="loading-gif" style="max-width: 100px;" />
          </div>
        </template>
        <div class="row flex flex-center">
          <q-card v-if="!loading && !sessionData.length" class="welcome-card" flat bordered>
            <q-card-section horizontal>
              <q-card-section class="q-pa-lg">
                <div class="text-overline text-orange-9">Let's get started</div>
                <div class="text-h5 q-mt-sm q-mb-xs">Welcome to BlueNotary!</div>
                <p>The faster, smarter, more secure way to notarization your documents.</p>
                <div class="q-pt-lg">
                  <ul>
                    <li><q-icon name="check_circle" /> Your completed notarizations will list here</li>
                  </ul>
                </div>
              </q-card-section>

              <q-card-section class="col-5 flex flex-center">
                <q-img
                  class="rounded-borders"
                  src="~assets/notary-public-sm.jpg"
                />
              </q-card-section>
            </q-card-section>
          </q-card>
        </div>
        <template v-if="sessionData && sessionData.length">
          <div class="row mbroww" style="font-size:.6rem;">
            <div class="text-left q-pb-sm dcol-aerr"> &nbsp;</div>
            <div class="text-left dcol-fname">Filename</div>
            <div class="text-left dcol-sttus">Status</div>
            <div class="text-left dcol-mtime">Meeting Time</div>
          </div>
          <div class="q-table__card sessions-info">
            <div v-for="(item, key) of sessionData" :key="key">
              <div>
                <q-list class="rounded-borders">
                  <q-expansion-item
                    expand-icon-toggle
                    switch-toggle-side
                    class="tbnner"
                  >
                    <template v-slot:header>
                      <div class="text-left dcol-fname">
                        {{ (item.files) ? splittingFileName(item.files && item.files[0] && item.files[0].name): "No file uploaded" }}
                      </div>
                      <div class="text-left dcol-sttus mbhide">
                        <q-badge :color="getStatusColor(item.status)">
                          {{ item.status }}
                        </q-badge>
                      </div>
                      <div class="text-left dcol-mtime ">
                        <q-icon label="" name="today" />
                        <q-tooltip anchor="bottom left" :delay="1500">
                          Scheduled meeting with signer.
                        </q-tooltip>
                        {{ (typeof(item.meetingdate) === 'undefined' || item.meetingdate === "N/A" || item.meetingdate === "") ? "Meeting not scheduled" : formatDateForMeetingtime(item.meetingdate, item) }}
                      </div>
                      <div class="text-left dcol-sttus vmob">
                        <q-badge :color="getStatusColor(item.status)">
                          {{ item.status }}
                        </q-badge>
                      </div>
                      <div v-if="!item.currentUserAdditionalSigner && item.session.sessionActive" class="text-right dcol-btnd">
                        <q-btn class="" color="green" text-color="white" label="Go to Session" @click="gotoSessionClicked(item)" />
                      </div>
                      <div v-else-if="item.currentUserAdditionalSigner" class="text-right dcol-btnd">
                        <q-btn v-if="item.session.sessionActive && item.currentUserAdditionalSignerStage === 'meet_notary'" class="" color="green" text-color="white" label="Go to Session" @click="gotoSessionClicked(item)" />
                        <q-btn v-else-if="item.currentUserAdditionalSignerStage !== 'meet_notary'" class="" color="orange" text-color="white" label="Enter KBA Details" @click="gotoSessionClicked(item)" />
                      </div>
                      <q-btn v-else
                             class="btn-secondary dcol-btnd"
                             :disable="(item.status === 'complete' ||
                               item.status === 'expired') ||
                               (item.currentStage === 'identity_check_stage_fail' ||
                                 item.currentStage === 'kba_check_stage_fail' ||
                                 item.currentStage === 'photoid_check_stage_fail')"
                             flat
                             @click="continueSession(item)">
                        Continue
                      </q-btn>
                    </template>
                    <q-card class="session-info-card">
                      <q-card-section>
                        <q-list separator>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Session ID</q-item-label>
                              <q-item-label>{{ item.current_session_id.substr(item.current_session_id.length - 5).toUpperCase() }}</q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Notarization Act Type</q-item-label>
                              <q-item-label class="text-capitalize">{{ item.session.notorizationType }}</q-item-label>
                              <q-item-label v-if="item.notary" class="text-capitalize">{{ 'Notary: '+item.notary.name }}</q-item-label>
                              <q-item-label v-if="item.notary" class="text-capitalize">{{ 'Commission Number: '+item.notary.commissionNumber }}</q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item v-if="item.additionalSignerIdentyDocs && item.additionalSignerIdentyDocs.length">
                            <q-item-section>
                              <q-item-label overline>Additional Signers</q-item-label>
                              <q-item-label v-for="additionalSigner in item.additionalSignerIdentyDocs" :key="additionalSigner._id" class="text-capitalize">
                                {{ additionalSigner.email }} - Status:
                                <span style="font-weight: bold">
                                  <template v-if="additionalSigner.additionalSignerNextStage === 'photoid_check_stage'">
                                    KBA Successful. Photo ID Check Not Completed
                                  </template>
                                  <template v-else-if="additionalSigner.additionalSignerNextStage === 'meet_notary'">
                                    KBA and Photo ID Check Successful
                                  </template>
                                  <template v-else>
                                    KBA and Photo ID Check Not Completed
                                  </template>
                                </span>
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Original Document</q-item-label>
                              <q-item-label>
                                <template v-if="item.files && item.files.length">
                                  <a v-for="tempFinalDocument in item.files" :key="tempFinalDocument._id" :href="tempFinalDocument.url" target="_blank" class="blue">
                                    {{ tempFinalDocument.name }}
                                    <br />
                                  </a>
                                </template>
                                <template v-else>No file uploaded</template>
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Final Document</q-item-label>
                              <q-item-label>
                                <template v-if="item.finalDocument">
                                  <a v-for="tempFinalDocument in item.finalDocument" :key="tempFinalDocument._id" :href="tempFinalDocument.url" target="_blank" class="blue">
                                    {{ tempFinalDocument.name }}
                                    <br />
                                  </a>
                                </template>
                                <template v-else>Notarization not completed yet</template>
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Notarization Start Time</q-item-label>
                              <q-item-label>{{ formatDate(item.sessionStartedTime, item.session) }}</q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Notarization End Time</q-item-label>
                              <q-item-label>{{ (item.status === "complete") ? formatDate(item.session.updatedAt, item.session) : 'Notarization not completed yet' }}</q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Type of Credentials Provided</q-item-label>
                              <q-item-label>KBA+ID</q-item-label>
                            </q-item-section>
                          </q-item>

                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Fee Charged</q-item-label>
                              <q-item-label>
                                <template v-if="item.session.costOfNotarization && item.status === 'complete'">
                                  <div v-for="tempCost,index in item.session.costOfNotarization" :key="index">
                                    <div :key="'tempCostname' + index" class="q-pb-md">
                                      <span class="text-teal">{{ tempCost.name }}</span>
                                      <br />
                                      {{ tempCost.currency }}{{ tempCost.price }}
                                    </div>
                                  </div>
                                  <div class="q-pb-md">
                                    <span class="text-teal">Total</span>
                                    <br />{{ item.session.finalCostOfNotarization }}
                                  </div>
                                </template>
                                <template v-else>Notarization not completed yet</template>
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Video Recording</q-item-label>
                              <q-item-label>
                                <a v-if="item.videoData" :href="item.videoData.url" target="_blank" class="blue">
                                  {{ item.videoData.name }}
                                </a>
                                <template v-if="item.session.videoSavingProcessingStage">
                                  <div v-if="item.session.videoSavingProcessingStage !== 'completed'">
                                    Status: {{ item.session.videoSavingProcessingStage }}
                                  </div>
                                  <div v-if="item.session.videoSavingProcessingError">
                                    Error Message: {{ item.session.videoSavingProcessingError }}
                                  </div>
                                </template>
                                <template v-else>
                                  <div>N/A</div>
                                </template>
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                        </q-list>
                      </q-card-section>
                    </q-card>
                  </q-expansion-item>
                  <q-separator />
                </q-list>
              </div>
            </div>
          </div>
        </template>
      </q-page>
    </q-page-container>
    <q-dialog v-model="confirmationSessionDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Session Complete</div>
        </q-card-section>

        <q-card-section class="q-pt-none text-center">
          <template v-if="confirmationSessionDoc && confirmationSessionDoc.finalDocument && confirmationSessionDoc.finalDocument.length">
            <a v-for="tempFinalDocument in confirmationSessionDoc.finalDocument" :key="tempFinalDocument._id" :href="tempFinalDocument.url" target="_blank" class="blue">
              <q-icon name="task" class="text-center q-pa-md" style="font-size: 3rem;display: block;margin:0 auto;" />
              Download Signed File
            </a>
          </template>
          <template v-else>
            Session Signed Final Document not quite ready. Please refresh the page or check My Documents page.
          </template>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Close" color="primary" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="paymentDoneDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">Payment Pending For Session <template v-if="confirmationSessionDoc && confirmationSessionDoc.shotId">{{ confirmationSessionDoc.shotId }}</template></div>
        </q-card-section>

        <q-card-section class="q-pt-none text-center">
          <div>
            Previously attempted payment Failed. Please enter a valid payment card.
          </div>
          <div v-if="confirmationSessionDoc && confirmationSessionDoc.session && confirmationSessionDoc.session.failMessage">
            Failure Message : {{ confirmationSessionDoc.session.failMessage }}
          </div>
          <div v-if="confirmationSessionDoc && confirmationSessionDoc.notaries && confirmationSessionDoc.notaries.stripeBrand" style="text-align: left; padding: 12px 0px">
            Previous Card
            <div class="row">
              <div id="payment-form">
                <p class="">
                  Card:<b> {{ confirmationSessionDoc.notaries.stripeBrand }}</b>
                </p>
                <p class="">
                  Exp:<b>
                    {{ confirmationSessionDoc.notaries.exp_month }}/{{
                      confirmationSessionDoc.notaries.exp_year
                    }}</b
                  >
                </p>
                <p class="">
                  Last 4: <b>{{ confirmationSessionDoc.notaries.last4 }}</b>
                </p>
              </div>
            </div>
          </div>
          <div v-if="confirmationSessionDoc && confirmationSessionDoc.session && confirmationSessionDoc.session.finalCostOfNotarization" style="text-align: left; padding: 10px 0px">
            Final Notarization Cost : {{ confirmationSessionDoc.session.finalCostOfNotarization }}
          </div>
          <div id="payment-form">
            <div
              v-if="submissionError"
              class="q-mt-md q-mb-md text-negative"
            >
              <div id="card-errors" role="alert">
                {{ submissionError }}
              </div>
            </div>

            <q-field
              label="Card Number"
              stack-label
              class="q-mb-md"
              :error-message="errors['cardNumber']"
              :error="!isCardNumberValid"
            >
              <template v-slot:control>
                <div class="self-center full-width no-outline">
                  <div id="cardNumber" ref="cardNumber" />
                </div>
              </template>
            </q-field>

            <div class="row q-col-gutter-lg">
              <div class="col-6">
                <q-field
                  label="Card Expiry"
                  stack-label
                  class="q-mb-md"
                  :error-message="errors['cardExpiry']"
                  :error="!isCardExpiryValid"
                >
                  <template v-slot:control>
                    <div class="self-center full-width no-outline">
                      <div id="cardExpiry" ref="cardExpiry" />
                    </div>
                  </template>
                </q-field>
              </div>
              <div class="col-6">
                <q-field
                  label="Card CVC"
                  stack-label
                  class="q-mb-md"
                  :error-message="errors['cardCvc']"
                  :error="!isCardCvcValid"
                >
                  <template v-slot:control>
                    <div class="self-center full-width no-outline">
                      <div id="cardCvc" ref="cardCvc" />
                    </div>
                  </template>
                </q-field>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :loading="paymentModalSubmitLoading" label="Submit Card for Payment" color="primary" @click="paymentModalSubmit" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- modal for KBA -->
    <q-dialog v-model="showKBAModal" persistent>
      <q-card style="min-width: 90%; min-height: 80%">
        <q-card-section>
          <h5>
            Perform KBA for Session
            <q-btn v-close-popup round label="x" style="float: right" />
          </h5>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="columns is-multiline" style="margin-top: 6px">
            <template v-if="showKBAModalSection === 'initial'">
              <div
                class="col-12 flex q-mt-lg q-mb-xl"
                style="width: 100%"
              >
                <div class="flex flex-center column">
                  <div class="">
                    <p class="q-pa-lg">
                      As additional signer in this session, you will have to perform KBA and pass photo ID check before you are admitted to the session. Please proceed to start KBA+ID by clicking button below. <br/><a href="https://bluenotary.freshdesk.com/support/solutions/articles/72000555236-what-is-kba-">What is KBA?</a>
                    </p>
                    <div class="q-pa-md text-center">
                      <q-btn class="btn btn-primary q-pa-md" @click="startKBA">Start KBA Process</q-btn>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <template v-if="showKBAModalSection === 'failed'">
              <div
                class="col-12 flex q-mt-lg q-mb-xl"
                style="width: 100%"
              >
                <div class="flex flex-center column">
                  <div class="text-center">
                    <h5 class="q-pa-md">
                      The KBA did not succeed this time.
                    </h5>
                    <br />
                    <h5>
                      <b>KBA Failure Reason </b>: {{ kbaModalFailureReason }}
                    </h5>
                    <div class="q-pa-md text-center">
                      <q-btn class="btn q-pa-md" color="red" @click="closeKBASession">Close</q-btn>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-4 flex" />
            </template>
            <template v-if="showKBAModalSection === 'personal_details'">
              <personal-details :called-from-business-page="true" :called-from-business-page-session-id="showKBAModalSessionId" :kba-modal-change-section="kbaModalChangeSection" />
            </template>
            <template v-else-if="showKBAModalSection === 'kba'">
              <k-b-a :called-from-business-page="true" :called-from-business-page-session-id="showKBAModalSessionId" :kba-modal-change-section="kbaModalChangeSection" />
            </template>
            <template v-else-if="showKBAModalSection === 'photoid'">
              <photoid :called-from-business-page="true" :called-from-business-page-session-id="showKBAModalSessionId" :kba-modal-change-section="kbaModalChangeSection" />
            </template>
            <template v-else-if="showKBAModalSection === 'meet_notary'">
              <meet-notary :called-from-business-page="true" :called-from-business-page-session-id="showKBAModalSessionId" :kba-modal-change-section="kbaModalChangeSection" />
            </template>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script>
import { ref } from "@vue/composition-api";
import { $axios } from "boot/axios";
import { v4 as uuidV4 } from "uuid";
import __ from "lodash";
import { loadStripe } from "@stripe/stripe-js/pure";
import VueEventBus from "../plugins/eventbus.js";
import PersonalDetails from "./customer/personalDetails.vue";
import KBA from "./customer/kba.vue";
import Photoid from "./customer/photoid.vue";
import MeetNotary from "./customer/meetNotary.vue";

const moment = require("moment");

export default {
  name: "Sessions",
  components: {
    PersonalDetails,
    KBA,
    Photoid,
    MeetNotary
  },
  data() {
    return {
      confirmationSessionId: "",
      confirmationSessionDialog: false,
      confirmationSessionDoc: {},
      paymentFailure: false,
      paymentDoneDialog: false,
      stripe: false,
      submissionError: null,
      card: {
        cardNumber: "",
        cardExpiry: "",
        cardCvc: ""
      },
      errors: {
        cardNumber: "",
        cardExpiry: "",
        cardCvc: ""
      },
      paymentModalSubmitLoading: false,
      cannotStartNewSession: false,
      showKBAModal: false,
      showKBAModalSessionId: "",
      showKBAModalSection: "initial",
      kbaModalFailureReason: ""
    };
  },
  computed: {
    isCardNumberValid () {
      return this.isValid("cardNumber");
    },
    isCardExpiryValid () {
      return this.isValid("cardExpiry");
    },
    isCardCvcValid () {
      return this.isValid("cardCvc");
    }
  },
  watch: {},
  async mounted() {
    this.loading = true;
    await this.loadSessionData(this.$user);
    console.log(this.sessionData);
    if (this.$route.query.confirmationSession) {
      this.confirmationSessionId = this.$route.query.confirmationSession;
      this.confirmationSessionDialog = true;
      __.map(this.sessionData, (tempSessionData) => {
        if (tempSessionData && tempSessionData.session && tempSessionData.session._id === this.confirmationSessionId) {
          this.confirmationSessionDoc = tempSessionData;
        }
      });
    }
    if (this.$route.query.paymentDone === "failure") {
      this.confirmationSessionDialog = false;
      this.paymentFailure = true;
      this.paymentDoneDialog = true;
    }
    if (this.$route.query.kba === "true" && this.$route.query.sessionid) {
      this.showKBAModalSessionId = this.$route.query.sessionid;
      const url = "session/load/personalData";
      const messageToSend = {
        sessionId: this.showKBAModalSessionId,
        additionalSigner: true
      };
      const response = await $axios.post(url, messageToSend, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      if (response && response.data) {
        this.localSetKBAModalSection(response.data.additionalSignerNextStage);
      }
      this.showKBAModal = true;
    }
    VueEventBus.$on("SOCKET_UPDATES", (socketData) => {
      console.log("socketData", JSON.parse(JSON.stringify(socketData)));
      if (typeof socketData.event !== "undefined") {
        if (socketData.event === "sessionActivityChanged") {
          const sessionidChanged = socketData.sessionid;
          __.map(this.sessionData, (localSessionDoc) => {
            if (String(localSessionDoc.session._id) === sessionidChanged) {
              this.loadSessionData([sessionidChanged]);
            }
          });
        }
      }
    });
    VueEventBus.$on("SOCKET_RECONNECTED", () => {
      this.socketRequest("join_user");
    });
    this.socketRequest("join_user");
    this.loading = false;
    if (!this.stripe) {
      if (this.$user.testingacc) {
        const pubkey = process.env.STRIPE_PUBLIC_KEY_TEST;
        this.stripe = await loadStripe(pubkey);
      } else {
        const pubkey = process.env.STRIPE_PUBLIC_KEY;
        this.stripe = await loadStripe(pubkey);
      }
      const cardElements = ["cardNumber", "cardExpiry", "cardCvc"];
      this.elements = this.stripe.elements();
      const style = {
        base: {
          fontFamily: "\"Roboto\", \"-apple-system\", \"Helvetica Neue\", Helvetica, Arial, sans-serif",
          "::placeholder": {
            color: "#CFD7E0",
          },
        },
      };
      cardElements.forEach((element) => {
        this.card[element] = this.elements.create(element, { style });
        this.card[element].mount(`#${element}`);
        this.card[element].addEventListener("change", (e) => this.updated(e));
      });
    }
  },
  beforeDestroy() {
    this.socketRequest("leave_user");
    VueEventBus.$off("SOCKET_UPDATES");
    VueEventBus.$off("SOCKET_RECONNECTED");
  },
  setup(_, context) {
    const {
      root: { $router, $q, $user },
    } = context;
    const loading = ref(false);
    const sessionData = ref([]);
    const deleteSessionItem = async (item) => {
      try {
        const url = "session/delete";
        const response = await $axios.post(
          url,
          { sessionId: item },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log("loadSessionData", response.data);
        const newSessionData = await this.loadSessionData();
        console.log("newSessionData = ", newSessionData);
        sessionData.value = newSessionData;
      } catch (error) {
        console.log(error);
      }
    };
    const continueSession = async (item) => {
      console.log(item);
      $q.localStorage.set("sessionData", item.current_session_id);
      let url = `/business/prepare_doc/${item.current_session_id}`;
      switch (item.currentStage) {
        case "intial_stage":
          url;
          break;
        case "identity_check_stage":
          url = `/business/personal_info/${item.current_session_id}`;
          break;
        case "kba_check_stage":
          url = `/business/kba/${item.current_session_id}`;
          break;
        case "photoid_check_stage":
          url = `/business/photoid/${item.current_session_id}`;
          break;
        case "payment_info_stage":
          url = `/business/payment_info/${item.current_session_id}`;
          break;
        case "meet_notary_stage":
          url = `/business/meet_notary/${item.current_session_id}`;
          break;
        case "identity_check_stage_fail":
        case "kba_check_stage_fail":
        case "photoid_check_stage_fail":
          url = "/business/";
          break;
        default:
          url;
          break;
      }
      $router.replace(url);
    };
    const deleteSession = async (item) => {
      await deleteSessionItem(item.sessionId);
      // const newSessionData = await loadSessionData();
      // console.log("newSessionData = ", newSessionData);
      // this.sessionData = newSessionData;
    };
    const startNewSession = async () => {
      $q.localStorage.set("sessionData", uuidV4());
      $router.replace("/business/prepare_doc");
    };
    const socketRequest = async (eventName) => {
      const dataToSend = {
        user: $user._id
      };
      if (window.currentSocket) {
        window.currentSocket.emit(eventName, dataToSend, (res) => {
          console.log("res", res);
        });
      }
    };
    return {
      loading,
      sessionData,
      continueSession,
      deleteSession,
      deleteSessionItem,
      startNewSession,
      socketRequest
    };
  },
  methods: {
    splittingFileName(fileName) {
      if (!fileName) {
        return "";
      }
      if (fileName.length < 20) {
        return fileName;
      }
      fileName = fileName.split(/[.]+/);
      return ` ${fileName[0].slice(0, 10)}...${fileName[0].substr(fileName[0].length - 10)}.${fileName[fileName.length - 1]}`;
    },
    async paymentModalSubmit() {
      console.log("clicked");
      this.paymentModalSubmitLoading = true;
      const { token, error } = await this.stripe.createToken(this.card.cardNumber);
      console.log({ error });
      if (error) {
        this.paymentModalSubmitLoading = false;
        this.$q.notify({
          color: "red",
          position: "bottom-right",
          message: error.message,
        });
        return;
      }
      console.log({ token });
      try {
        const url = "session/repaymentForSession";
        const response = await $axios.post(url, { data: token, sessionId: this.confirmationSessionId }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log(response);
        this.$q.notify({
          color: "primary",
          position: "bottom",
          message: "Payment Done Successfully.",
        });
        this.paymentModalSubmitLoading = false;
        this.paymentDoneDialog = false;
        this.$router.replace("/business");
      } catch (error2) {
        this.paymentModalSubmitLoading = false;
        console.log(error2);
      }
    },
    updated (e) {
      const { elementType } = e;
      const { error } = e;
      if (error) {
        this.errors[elementType] = e.error.message;
        return null;
      }
      if (this.errors[elementType]) {
        this.errors[elementType] = "";
      }
      return null;
    },
    isValid (elementType) {
      return this.errors[elementType] === "";
    },
    errorMessage (elementType) {
      return this.isValid(elementType) ? this.errors[elementType] : false;
    },
    async nextButtonClick() {
      return "";
    },
    getStatusColor(status) {
      let statusColor = "primary";
      switch (status) {
        case "unsigned":
          statusColor = "primary";
          break;
        case "complete":
          statusColor = "teal";
          break;
        case "expired":
          statusColor = "gray";
          break;
        case "ready to sign":
          statusColor = "green";
          break;
        case "ready to pick up":
          statusColor = "orange";
          break;
        default:
          statusColor;
      }
      return statusColor;
    },
    getTimeZone(timezone) {
      let actualTimezone = "Central";
      switch (timezone) {
        case "5.5":
          actualTimezone = "GMT+05:30";
          break;
        case "-10":
          actualTimezone = "Hawaii";
          break;
        case "-8":
          actualTimezone = "Pacific";
          break;
        case "-7":
          actualTimezone = "Mountain";
          break;
        case "-6":
          actualTimezone = "Central";
          break;
        case "-5":
          actualTimezone = "Eastern Time";
          break;
        case "-4":
          actualTimezone = "Atlantic";
          break;
        default:
          actualTimezone;
      }
      return actualTimezone;
    },
    formatDate(rawDate, sessiondoc) {
      if (!rawDate) {
        return "Notarization not completed yet";
      }
      if (sessiondoc && sessiondoc.meetingTimeZone) {
        const timezoneString = this.getTimeZone(sessiondoc.meetingTimeZone);
        return `${moment(rawDate, "YYYY-MM-DD HH:mm A").add(parseFloat(sessiondoc.meetingTimeZone) * 60, "minutes")
          .format("MMMM, Do YYYY")} at ${moment(rawDate, "YYYY-MM-DD HH:mm A")
          .format("hh:mmA")} ${timezoneString}`;
      }
        return `${moment(rawDate, "YYYY-MM-DD HH:mm A")
          .utcOffset("-06:00")
          .format("MMMM, Do YYYY")} at ${moment(rawDate, "YYYY-MM-DD HH:mm A")
          .utcOffset("-06:00")
          .format("hh:mmA")} CST`;
    },
    formatDateForMeetingtime(rawDate, sessiondoc) {
      let actualTimezone = "Central";
      if (sessiondoc && sessiondoc.meetingTimeZone) {
        actualTimezone = this.getTimeZone(sessiondoc.meetingTimeZone);
      }
      return `${moment(rawDate, "YYYY-MM-DD HH:mm A")
          .format("MMMM, Do YYYY")} at ${moment(rawDate, "YYYY-MM-DD HH:mm A")
          .format("hh:mmA")} ${actualTimezone}`;
    },
    socketRequest(eventName) {
      const dataToSend = {
        user: this.$user._id
      };
      if (window.currentSocket) {
        window.currentSocket.emit(eventName, dataToSend, (res) => {
          console.log("res", res);
        });
      }
    },
    async loadSessionData(user) {
      const url = "session/load/sessiondata";
      const response = await $axios.post(
        url,
        { user },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      this.sessionData = response.data;
      console.log("this.sessionData", this.sessionData);
      __.map(this.sessionData, (sessionDoc) => {
        if (sessionDoc.session && sessionDoc.session.paid === false) {
          console.log(sessionDoc);
          this.confirmationSessionId = sessionDoc.session._id;
          this.confirmationSessionDoc = sessionDoc;
          this.confirmationSessionDialog = false;
          this.paymentFailure = true;
          this.paymentDoneDialog = true;
          this.cannotStartNewSession = true;
        }
      });
    },
    kbaModalChangeSection(sectionName, failureReason) {
      this.showKBAModalSection = sectionName;
      if (sectionName === "failed") {
        this.kbaModalFailureReason = failureReason;
      }
    },
    startKBA() {
      this.showKBAModalSection = "personal_details";
    },
    closeKBASession() {
      this.showKBAModal = false;
    },
    localSetKBAModalSection(tempSection) {
      if (tempSection === "photoid_check_stage") {
        this.showKBAModalSection = "photoid";
      } else if (tempSection === "meet_notary") {
        this.showKBAModalSection = "meet_notary";
      }
    },
    gotoSessionClicked(sessionParentItem) {
      if (!sessionParentItem.currentUserAdditionalSigner) {
        this.$router.replace(`/pdf_edit/sessions/${sessionParentItem.session._id}`).catch(() => {});
      } else {
        this.showKBAModalSection = "initial";
        if (sessionParentItem.additionalSignerIdentyDocs) {
          __.map(sessionParentItem.additionalSignerIdentyDocs, (identityDoc) => {
            if (identityDoc.additionalSignerNextStage && identityDoc.userId === this.$user._id) {
              this.localSetKBAModalSection(identityDoc.additionalSignerNextStage);
            }
          });
        }
        this.showKBAModalSessionId = String(sessionParentItem.session._id);
        this.showKBAModal = true;
      }
    }
  },
};
</script>
<style lang="sass" scoped>
</style>

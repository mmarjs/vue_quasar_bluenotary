<template>
  <q-layout>
    <q-page-container class="container">
      <template v-if="$onBoarding === true && $user.approve === 'inactive'">
        <div class="bn-note bn-note--warning">
          <p class="q-mb-md">
            We have everything required. Please give a bit of time to review your application.
          </p>
        </div>
      </template>
      <q-page class="q-pa-lg">
        <div class="flex justify-between q-py-md items-center">
          <h1 class="">
            Journal
          </h1>
          <router-link v-if="$user.approve !== 'inactive'" to="/notary/invite">
            <q-btn class="" color="primary" label="Invite Signer" />
          </router-link>
        </div>
        <template v-if="loading">
          <div class="renderer">
            <img src="/icons/Loading.gif" alt="loading-gif" style="max-width: 100px;" />
          </div>
        </template>
        <template v-if="sessionData && sessionData.length">
          <div class="row q-px-md" style="font-size:.6rem;">
            <div class="text-left q-pb-sm cols-aer"> &nbsp;</div>
            <div class="text-left cols-ss">Session</div>
            <div class="text-left cols-st">Status</div>
            <div class="text-left cols-psign">Primary Signer</div>
            <div class="text-left cols-mdt">Meeting Time</div>
          </div>
          <div class="q-table__card sessions-info">
            <div v-for="(session, key) of sessionData" :key="key">
              <div>
                <q-list class="rounded-borders myses">
                  <q-expansion-item
                    expand-icon-toggle
                    switch-toggle-side
                  >
                    <template v-slot:header>
                      <!-- <q-avatar icon="bluetooth" color="primary" text-color="white" /> -->
                      <div class="text-left cols-ss">
                        <span class="q-mt-sm q-mb-xs">{{ session.session._id.substr(session.session._id.length - 5).toUpperCase() }}</span>
                        <span class="clbblue" @click="copyInviteLink(session.inviteLink)">
                          Invite Link
                          <q-icon name="content_copy" color="primary" size="10px" @click="copyInviteLink(session.inviteLink)" />
                          <q-tooltip>
                            Click to copy the invite link
                          </q-tooltip>
                        </span>
                      </div>
                      <div class="text-left cols-st">
                        <q-badge :color="getStatusColor(session.session.status)">
                          {{ (session.session.status === "unsigned") ? "incomplete" : session.session.status }}
                        </q-badge>
                      </div>
                      <div class="text-left cols-psign">
                        <span class="q-mt-sm q-mb-xs">{{ session.signer }} </span>
                        <span class="clbblue hidtab" @click="copyText(session.signerEmail)">
                          {{ session.signerEmail }}
                          <q-icon name="content_copy" color="primary" size="10px" @click="copyText(session.signerEmail)" />
                          <q-tooltip :delay="200">
                            Click to copy the email
                          </q-tooltip>
                        </span>
                        <span class="clbblue vbtab">
                          Copy Email
                          <q-icon name="content_copy" color="primary" size="10px" @click="copyText(session.signerEmail)" />
                          <q-tooltip :delay="200">
                            Click to copy the email
                          </q-tooltip>
                        </span>
                      </div>
                      <div class="text-left cols-mdt">
                        <q-icon label="" name="today" />
                        {{ (typeof(session.session.meetingdate) === 'undefined' || session.session.meetingdate === "N/A" || session.session.meetingdate === "") ? "Meeting not scheduled" : formatDateForMeetingtime(session.session.meetingdate, session.session) }}
                        <q-tooltip :delay="1500">
                          Scheduled meeting with signer.
                        </q-tooltip>
                      </div>
                      <div v-if="session.session.sessionActive" class="text-right cols-gtses">
                        <router-link :to="'/pdf_edit/sessions/' + session.session._id">
                          <q-btn class="" color="green" text-color="white" label="Go to Session">
                            <q-tooltip>
                              Customer has joined the Session
                            </q-tooltip>
                          </q-btn>
                        </router-link>
                      </div>
                      <div v-else-if="session.session.status === 'ready to sign'" class="text-right cols-gtses">
                        <div style="font-size: 10px; line-height: 13px">Customer hasn’t joined yet</div>
                        <router-link :to="'/pdf_edit/sessions/' + session.session._id">
                          <q-btn class="" color="orange" text-color="white" label="Go to  Session">
                            <q-tooltip>
                              Customer hasn’t joined yet
                            </q-tooltip>
                          </q-btn>
                        </router-link>
                      </div>
                      <!-- <div v-else class="text-right" style="width:15%">
                        &nbsp;
                      </div> -->
                    </template>
                    <q-card class="session-info-card">
                      <q-card-section>
                        <q-list>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Session ID</q-item-label>
                              <q-item-label>{{ session.session._id.substr(session.session._id.length - 5).toUpperCase() }}</q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Notarization Act Type</q-item-label>
                              <q-item-label class="text-capitalize">{{ session.session.notorizationType }}</q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Final Document</q-item-label>
                              <q-item-label>
                                <a v-for="tempFinalDocument in session.finalDocument" :key="tempFinalDocument._id" :href="tempFinalDocument.url" target="_blank" class="blue">
                                  {{ tempFinalDocument.name }}
                                  <br />
                                </a>
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Original Document</q-item-label>
                              <q-item-label>
                                <a v-for="tempFinalDocument in session.documents" :key="tempFinalDocument._id" :href="tempFinalDocument.url" target="_blank" class="blue">
                                  {{ tempFinalDocument.name }}
                                  <br />
                                </a>
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Signer Name and Address</q-item-label>
                              <q-item-label>
                                <template v-if="session.identityData !== null && (typeof(session.identityData.firstName) !== 'undefined')">
                                  {{ `${session.identityData.firstName} ${session.identityData.lastName}` }}<br />
                                  {{ session.identityData.addressLine1 }}<br />
                                  {{ session.identityData.userState }} {{ session.identityData .userZipCode }}
                                </template>
                                <template v-else>N/A</template>
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item v-if="session.additionalSignerIdentyDocs && session.additionalSignerIdentyDocs.length">
                            <q-item-section>
                              <q-item-label overline>Additional Signers</q-item-label>
                              <q-item-label v-for="additionalSigner in session.additionalSignerIdentyDocs" :key="additionalSigner._id" class="text-capitalize">
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
                              <q-item-label overline>Notarization Start Time</q-item-label>
                              <q-item-label>{{ formatDate(session.sessionStartedTime, session.session) }}</q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Notarization End Time</q-item-label>
                              <q-item-label>{{ (session.session.status === "complete") ? formatDate(session.session.updatedAt, session.session) : 'Notarization not completed yet' }}</q-item-label>
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
                              <q-item-label overline>A record of the identity proofing and credential analysis</q-item-label>
                              <q-item-label>
                                {{ (session.identityData !== null &&
                                  (session.identityData.consumerPlusAPIResponseDoc && session.identityData.consumerPlusAPIResponseDoc !== null) &&
                                  session.identityData.consumerPlusAPIResponseDoc.PlatformResponse.Response !== ""
                                )
                                  ? session.identityData.consumerPlusAPIResponseDoc.PlatformResponse.Response.WorkflowOutcome.text
                                  : 'N/A' }}
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Fee Charged</q-item-label>
                              <q-item-label>
                                <template v-if="session.session.costOfNotarization && session.session.status === 'complete'">
                                  <div v-for="tempCost,index in session.session.costOfNotarization" :key="index">
                                    <div :key="'tempCostname' + index" class="q-pb-md">
                                      <span class="text-teal">{{ tempCost.name }}</span>
                                      <br />
                                      {{ tempCost.currency }}{{ tempCost.price }}
                                    </div>
                                  </div>
                                  <div class="q-pb-md">
                                    <span class="text-teal">Total</span>
                                    <br />{{ session.session.finalCostOfNotarization }}
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
                                <a v-if="session.videoData" :href="session.videoData.url" target="_blank" class="blue">
                                  {{ session.videoData.name }}
                                </a>
                                <template v-if="session.session.videoSavingProcessingStage">
                                  <div v-if="session.session.videoSavingProcessingStage !== 'completed'">
                                    Status: {{ session.session.videoSavingProcessingStage }}
                                  </div>
                                  <div v-if="session.session.videoSavingProcessingError">
                                    Error Message: {{ session.session.videoSavingProcessingError }}
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
        <div v-if="!loading && !sessionData.length" class="row flex flex-center q-pa-lg">
          <q-card class="my-card" flat bordered>
            <q-card-section horizontal>
              <q-card-section class="q-pa-lg">
                <div class="text-overline text-orange-9">Let's get started</div>
                <div class="text-h5 q-mt-sm q-mb-xs">Welcome to the BlueNotary platform!</div>
                <div class="">
                  <ul class="welcome-list">
                    <li>Your live ready/waiting sessions will list here.</li>
                    <li>You can start a new session by inviting a signer.</li>
                    <li> Get an idea of the process by checking out our training videos.</li>
                    <li>Do a dry run with a friend (or yourself) using our simulator.</li>
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

            <q-separator />

            <q-card-actions class="q-pa-md q-gutter-md">
              <router-link v-if="$user.approve !== 'inactive'" to="/notary/invite">
                <q-btn icon="schedule_send" class="btn btn-primary q-mr-md " flat bordered label="Invite Signer" />
              </router-link>
              <q-btn v-else :disabled="true" class="btn btn-primary" flat bordered label="Invite Signer" />
              <a style="color:#4a4a4a" target="_blank" href="https://www.youtube.com/channel/UCStuBiQGI-jZOs_vNE5Onng">
                <q-btn flat icon="video_library" label="Training Videos" />
              </a>
              <a style="color:#4a4a4a" target="_blank" href="https://bluenotary.freshdesk.com/support/solutions/articles/72000539626-script-for-live-notarization-calls">
                <q-btn icon="text_snippet" flat label="Live Call Scripts" />
              </a>

              <q-btn icon="model_training" class="" flat label="Session Simulator" />
            </q-card-actions>
          </q-card>
        </div>
      </q-page>
    </q-page-container>
    <q-dialog v-model="confirmationSessionDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Session Complete</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <template v-if="paymentFailure">
            Payment from customer's end has failed for some reason. We will follow up with customer to ensure payment is successful. Final session document will be available once payment is done.
          </template>
          <template v-else>
            <template v-if="confitmationSessionDoc && confitmationSessionDoc.finalDocument && confitmationSessionDoc.finalDocument.length">
              <a v-for="tempFinalDocument in confitmationSessionDoc.finalDocument" :key="tempFinalDocument._id" :href="tempFinalDocument.url" target="_blank" class="blue">
                <q-icon name="task" class="text-center q-pa-md" style="font-size: 3rem;display: block;margin:0 auto;" />
                {{ tempFinalDocument.name }}
              </a>
            </template>
            <template v-else>
              Session Final Document Not Ready. Please refresh the page and check
            </template>
          </template>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Close" color="primary" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script>
import { $axios } from "boot/axios";
import _ from "lodash";
import { copyToClipboard } from "quasar";
import VueEventBus from "../../plugins/eventbus.js";

const moment = require("moment");

export default {
  name: "MySession",
  data() {
    return {
      loading: false,
      sessionData: [],
      confirmationSessionId: "",
      confirmationSessionDialog: false,
      confitmationSessionDoc: {},
      paymentFailure: false
    };
  },
  async mounted () {
    this.loading = true;
    await this.loadSessionData(false);
    if (this.$route.query.confirmationSession) {
      this.confirmationSessionId = this.$route.query.confirmationSession;
      this.confirmationSessionDialog = true;
      _.map(this.sessionData, (tempSessionData) => {
        if (tempSessionData && tempSessionData.session && tempSessionData.session._id === this.confirmationSessionId) {
          this.confitmationSessionDoc = tempSessionData;
        }
      });
    }
    if (this.$route.query.paymentDone === "failure") {
      this.paymentFailure = true;
    }
    VueEventBus.$on("SOCKET_UPDATES", (socketData) => {
      console.log("socketData", JSON.parse(JSON.stringify(socketData)));
      if (typeof socketData.event !== "undefined") {
        if (socketData.event === "sessionActivityChanged") {
          const sessionidChanged = socketData.sessionid;
          _.map(this.sessionData, (localSessionDoc) => {
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
  },
  beforeDestroy() {
    this.socketRequest("leave_user");
    VueEventBus.$off("SOCKET_UPDATES");
    VueEventBus.$off("SOCKET_RECONNECTED");
  },
  methods: {
    async loadSessionData(sessionIds) {
      const url = "notary/sessions";
      const dataToSend = {
        notary_user_id: this.$user._id,
        journal: true
      };
      if (sessionIds && sessionIds.length) {
        dataToSend.session_ids = sessionIds;
      }
      const response = await $axios.post(url, dataToSend, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      this.sessionData = response.data.sessionData;
    },
    getStatusColor(status) {
      let statusColor = "primary";
      switch (status) {
        case "unsigned":
          statusColor = "blue";
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
        return "Notarization Start Time";
      }
      // return `${moment(rawDate, "YYYY-MM-DD HH:mm A").utcOffset("-06:00").format("MMMM, Do YYYY")} at ${moment(rawDate, "YYYY-MM-DD HH:mm A").utcOffset("-06:00").format("hh:mmA")} CST`;
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
    copyText(textToCopy) {
      copyToClipboard(textToCopy).then(() => {
          this.$q.notify({
            type: "positive",
            position: "bottom-right",
            message: "Email copied to clipboard!",
          });
        }).catch(() => {
        // fail
        });
    },

    copyInviteLink(inviteLink) {
      copyToClipboard(inviteLink).then(() => {
          this.$q.notify({
            type: "positive",
            position: "bottom-right",
            message: "Invite link copied to clipboard!",
          });
        }).catch(() => {
        // fail
        });
    }
  }
};
</script>

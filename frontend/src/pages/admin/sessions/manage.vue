<template>
  <q-layout>
    <q-page-container class="container">
      <q-page class="q-py-lg">
        <div class="flex justify-between q-py-md items-center">
          <h1 class="">
            Manage Sessions
          </h1>
        </div>
        <template v-if="loading">
          <div class="renderer">
            <img src="/icons/Loading.gif" alt="loading-gif" style="max-width: 100px;" />
          </div>
        </template>
        <template v-if="sessionData && sessionData.length">
          <div class="row" style="font-size:.6rem;">
            <div class="text-left q-pb-sm" style="width:6%"> &nbsp;</div>
            <div class="text-left" style="width:8%">Session</div>
            <div class="text-left" style="width:10%">Status</div>
            <div class="text-left" style="width:15%">Primary Signer</div>
            <div class="text-left" style="width:15%">Notary User Name</div>
            <div class="text-left" style="width:20%">Notary User Email</div>
            <div class="text-left" style="width:20%">Meeting Time</div>
          </div>
          <div class="q-table__card sessions-info">
            <div v-for="(session, key) of sessionData" :key="key">
              <div>
                <q-list class="rounded-borders">
                  <q-expansion-item
                    expand-icon-toggle
                    switch-toggle-side
                  >
                    <template v-slot:header>
                      <div class="text-left" style="width:10%">
                        {{ session.session._id.substr(session.session._id.length - 5).toUpperCase() }}
                        <q-icon name="content_copy" color="primary" size="15px" @click="copyInviteLink(session.inviteLink)" />
                        <q-tooltip :delay="200">
                          Click to copy the invite link
                        </q-tooltip>
                      </div>
                      <div class="text-left" style="width:12%">
                        <q-badge :color="getStatusColor(session.session.status)">
                          {{ session.session.status }}
                        </q-badge>
                      </div>
                      <div class="text-left" style="width:18%">
                        {{ session.signer }} <q-icon name="content_copy" color="primary" size="15px" @click="copyText(session.signerEmail)" />
                        <q-tooltip :delay="200">
                          Click to copy the email
                        </q-tooltip>
                      </div>
                      <div class="text-left" style="width:14%">
                        {{ session.notaryUserName }}
                      </div>
                      <div class="text-left" style="width:25%">
                        {{ session.notaryUserEmail }}
                      </div>
                      <div class="text-left" style="width:30%">
                        <q-icon label="" name="today" />
                        {{ (typeof(session.session.meetingdate) === 'undefined' || session.session.meetingdate === "N/A" || session.session.meetingdate === "") ? "Meeting not scheduled" : formatDate(session.session.meetingdate, session.session) }}
                      </div>
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
                                <template v-if="session.finalDocument">
                                  <a v-for="tempFinalDocument in session.finalDocument" :key="tempFinalDocument._id" :href="tempFinalDocument.url" target="_blank" class="blue">
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
                              <q-item-label overline>Original Document</q-item-label>
                              <q-item-label>
                                <template v-if="session.document">
                                  <a v-for="tempFinalDocument in session.document" :key="tempFinalDocument._id" :href="tempFinalDocument.url" target="_blank" class="blue">
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
                              <q-item-label>{{ formatDate(session.sessionStartedTime) }}</q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Notarization End Time</q-item-label>
                              <q-item-label>{{ (session.session.status === "complete") ? formatDate(session.session.updatedAt) : 'Notarization not completed yet' }}</q-item-label>
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
          <div v-if="paginate" class="q-pa-lg flex flex-center">
            <q-pagination
              v-model="current"
              :max="paginate.totalPages"
              :max-pages="6"
              direction-links
              boundary-links
              @click="loadSessionData(current)"
            />
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
            <template v-if="confitmationSessionDoc && confitmationSessionDoc.finalDocument && confitmationSessionDoc.finalDocument.url">
              <a :href="confitmationSessionDoc.finalDocument.url" target="_blank" class="blue">
                <q-icon name="task" class="text-center q-pa-md" style="font-size: 3rem;display: block;margin:0 auto;" />
                {{ confitmationSessionDoc.finalDocument.name }}
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
import { copyToClipboard } from "quasar";

const moment = require("moment");

export default {
  name: "ManageSession",
  data() {
    return {
      loading: false,
      sessionData: [],
      paginate: [],
      confirmationSessionId: "",
      confirmationSessionDialog: false,
      confitmationSessionDoc: {},
      paymentFailure: false,
      current: 1
    };
  },
  async mounted () {
    this.loading = true;
    await this.loadSessionData(this.current);
    this.loading = false;
  },
  methods: {
    async loadSessionData(current) {
      const baseUrl = "admins/fetchSessions/";
      const url = baseUrl + current;
      const response = await $axios.post(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      this.sessionData = response.data.sessionData;
      this.paginate = response.data.paginate;
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
    formatDate(rawDate, sessiondoc) {
      if (!rawDate) {
        return "Notarization not completed yet";
      }
      // return `${moment(rawDate, "YYYY-MM-DD HH:mm A").utcOffset("-06:00").format("MMMM, Do YYYY")} at ${moment(rawDate, "YYYY-MM-DD HH:mm A").utcOffset("-06:00").format("hh:mmA")} CST`;
      if (sessiondoc && sessiondoc.meetingTimeZone) {
        console.log("inside");
        return `${moment(rawDate, "YYYY-MM-DD HH:mm A").add(parseFloat(sessiondoc.meetingTimeZone) * 60, "minutes")
          .utcOffset("-06:00")
          .format("MMMM, Do YYYY")} at ${moment(rawDate, "YYYY-MM-DD HH:mm A")
          .utcOffset("-06:00")
          .format("hh:mmA")} CST`;
      }
        return `${moment(rawDate, "YYYY-MM-DD HH:mm A")
          .utcOffset("-06:00")
          .format("MMMM, Do YYYY")} at ${moment(rawDate, "YYYY-MM-DD HH:mm A")
          .utcOffset("-06:00")
          .format("hh:mmA")} CST`;
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

<template>
  <q-layout>
    <q-page-container class="container">
      <template v-if="onboardingLocal === false">
        <div class="bn-note bn-note--warning">
          <p class="q-mb-md">
            {{ $user.name }}, thank you for choosing to work with Blue Notary.<br />
            We just need the following items to verify and approve your account.<br />
          </p>
          <ul>
            <li><q-icon :name="$user.state ? 'check' : 'assignment_late'" :color="$user.state ? 'green' : 'gray'" /> State</li>
            <li><q-icon :name="$user.commissionNumber ? 'check' : 'assignment_late'" :color="$user.commissionNumber ? 'green' : 'gray'" /> Notary Commission Number</li>
            <li><q-icon :name="commissionExpiration ? 'check' : 'assignment_late'" :color="commissionExpiration ? 'green' : 'gray'" /> Commission Expire on Date</li>
            <li><q-icon :name="notaryCopyOfCommissionLetterName ? 'check' : 'assignment_late'" :color="notaryCopyOfCommissionLetterName ? 'green' : 'gray'" /> RON Approval Document <small>(Go to Certificates/Files tab)</small></li>
            <li><q-icon :name="!stripeErrorsFound ? 'check' : 'assignment_late'" :color="!stripeErrorsFound ? 'green' : 'gray'" /> Add payout details <small>(Go to Billing/Payouts tab)</small></li>
          </ul>
          <p class="q-mt-md">See the video: <a href="https://bluenotary.freshdesk.com/a/solutions/articles/72000551350" target="_blank">Getting Approved on BlueNotary</a></p>
        </div>
      </template>
      <template v-if="onboardingLocal === true && $user.approve === 'inactive'">
        <div class="bn-note bn-note--warning">
          <p class="q-mb-md">
            We are now reviewing your application. We'll notify you by email when we have finished the review process.
          </p>
        </div>
      </template>
      <q-page class="q-pa-lg">
        <template v-if="currentActiveSessions.length">
          <div class="flex justify-between q-py-md items-center">
            <h1 class="">
              Ready Sessions
            </h1>
          </div>
          <div class="q-table__card sessions-info">
            <div v-for="(session, key) of currentActiveSessions" :key="'currentActive' + key">
              <div>
                <q-list class="rounded-borders nnot-dash">
                  <q-expansion-item
                    expand-icon-toggle
                    switch-toggle-side
                  >
                    <template v-slot:header>
                      <!-- <q-avatar icon="bluetooth" color="primary" text-color="white" /> -->
                      <div class="text-left dscol-ses">
                        {{ session.session._id.substr(session.session._id.length - 5).toUpperCase() }}
                      </div>
                      <div class="text-left dscol-st">
                        <q-badge :color="getStatusColor(session.session.status)">
                          {{ session.session.status }}
                        </q-badge>
                      </div>
                      <div class="text-left dscol-sign">
                        {{ session.signer }}
                      </div>
                      <div class="text-left dscol-mtd">
                        <q-icon label="" name="today" />
                        <q-tooltip anchor="bottom left" :delay="1500">
                          Scheduled meeting with signer.
                        </q-tooltip>
                        {{ (typeof(session.session.meetingdate) === 'undefined' || session.session.meetingdate === "N/A" || session.session.meetingdate === "") ? "Meeting not scheduled" : formatDateForMeetingtime(session.session.meetingdate, session.session) }}
                      </div>
                      <div class="text-right dscol-bbt">
                        <router-link v-if="session.joinedAsWitness" :to="'/pdf_edit/sessions/' + session.session._id + '?witness=true'">
                          <q-btn class="" color="green" text-color="white" label="Rejoin as witness" />
                        </router-link>
                        <router-link v-else-if="session.session.sessionActive" :to="'/pdf_edit/sessions/' + session.session._id">
                          <q-btn class="" color="green" text-color="white" label="Go to Session" />
                        </router-link>
                        <div v-else :to="'/pdf_edit/sessions/' + session.session._id">
                          <div style="font-size: 10px; line-height: 13px">Customer hasn’t joined yet</div>
                          <router-link :to="'/pdf_edit/sessions/' + session.session._id">
                            <q-btn class="" color="orange" text-color="white" label="Go to  Session">
                              <q-tooltip>
                                Customer hasn’t joined yet
                              </q-tooltip>
                            </q-btn>
                          </router-link>
                        </div>
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
                                <a :href="session.finalDocument.url" target="_blank" class="blue">
                                  {{ session.finalDocument.name }}
                                </a>
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item>
                            <q-item-section>
                              <q-item-label overline>Signer Name and Address</q-item-label>
                              <q-item-label>
                                <template v-if="session.identityData !== null && (typeof(session.identityData.firstName) !== 'undefined')">
                                  <strong>{{ `${session.identityData.firstName} ${session.identityData.lastName}` }}</strong><br />
                                  {{ session.identityData.addressLine1 }}<br />
                                  {{ session.identityData.addressLine2 }}<br />
                                  {{ session.identityData.userState }} {{ session.identityData .userZipCode }}
                                </template>
                                <template v-else>N/A</template>
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                          <q-item v-if="session.additionalSignerIdentyDocs">
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
                                <template v-if="session.session.costOfNotarization">
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
        <template v-if="openCalls.length && $user.memberType === 'pro'">
          <div class="flex justify-between q-py-md items-center">
            <h1 class="">
              Open Calls
            </h1>
          </div>

          <div class="q-table__card sessions-info">
            <div v-for="(session, key) of openCalls" :key="'currentActive' + key">
              <div>
                <q-list class="rounded-borders nnot-dash">
                  <q-expansion-item
                    expand-icon-toggle
                    switch-toggle-side
                  >
                    <template v-slot:header>
                      <!-- <q-avatar icon="bluetooth" color="primary" text-color="white" /> -->
                      <div class="text-left  dscol-ses">
                        {{ session.session._id.substr(session.session._id.length - 5).toUpperCase() }}
                      </div>

                      <div class="text-left dscol-st">
                        <q-badge :color="getStatusColor(session.session.status)">
                          {{ session.session.status }}
                        </q-badge>
                      </div>

                      <div class="text-left dscol-sign">
                        {{ session.signer }}
                      </div>

                      <div class="text-left dscol-mtd">
                        <q-icon label="" name="today" />
                        <q-tooltip anchor="bottom left" :delay="1500">
                          Scheduled meeting with signer.
                        </q-tooltip>
                        {{ (typeof(session.session.meetingdate) === 'undefined' || session.session.meetingdate === "N/A" || session.session.meetingdate === "") ? "Meeting not scheduled" : formatDateForMeetingtime(session.session.meetingdate, session.session) }}
                      </div>

                      <div class="text-right dscol-bbt">
                        <div v-if="session.session.sessionOpenCallForTaking" @click="sessionCallTakeClicked(session.session._id)">
                          <q-btn class="" color="green" text-color="white" label="Pick Up Session" />
                        </div>
                        <div v-else-if="session.session.sessionOpenCallForWitness" @click="sessionCallWitnessClicked(session.session._id)">
                          <q-btn class="" color="green" text-color="white" label="Join as Witness" />
                        </div>
                        <router-link v-else :to="'/pdf_edit/sessions/' + session.session._id">
                          <q-btn class="" color="green" text-color="white" label="Answer the call" />
                        </router-link>
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

                          <q-item v-if="session.finalDocument">
                            <q-item-section>
                              <q-item-label overline>Final Document</q-item-label>
                              <q-item-label>
                                <a :href="session.finalDocument.url" target="_blank" class="blue">
                                  {{ session.finalDocument.name }}
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
                                  <strong>{{ `${session.identityData.firstName} ${session.identityData.lastName}` }}</strong><br />
                                  {{ session.identityData.addressLine1 }}<br />
                                  {{ session.identityData.addressLine2 }}<br />
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
                                <template v-if="session.session.costOfNotarization">
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
        <div class="row flex flex-center q-mt-lg">
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
                <div class="q-pt-lg">
                  <router-link v-if="$user.approve !== 'inactive'" to="/notary/invite">
                    <q-btn icon="schedule_send" class="btn btn-primary q-mr-md " flat bordered label="Invite Signer" />
                  </router-link>
                  <q-btn v-else :disabled="true" icon="schedule_send" class="btn btn-primary q-mr-md " flat bordered label="Invite Signer" />
                </div>
              </q-card-section>

              <q-card-section class="col-5 flex flex-center">
                <q-img
                  class="rounded-borders"
                  src="~assets/notary-tools.jpg"
                />
              </q-card-section>
            </q-card-section>
            <q-separator />

            <q-card-actions class="q-pa-md q-gutter-md">
              <a class="btn" target="_blank" href="https://www.facebook.com/groups/remoteonlinenotarizationbluenotary">
                <q-btn flat icon="supervisor_account" label="FB Support Group" />
              </a>
              <a class="btn" target="_blank" href="https://www.youtube.com/channel/UCStuBiQGI-jZOs_vNE5Onng">
                <q-btn flat icon="video_library" label="Training Videos" />
              </a>
              <a class="btn" target="_blank" href="https://bluenotary.freshdesk.com/support/solutions/articles/72000539626-script-for-live-notarization-calls">
                <q-btn icon="text_snippet" flat label="Live Call Scripts" />
              </a>
              <q-btn icon="model_training" class="btn blue" flat label="Session Simulator" @click="$router.replace('/pdf_edit/sessions/simulator')" />
            </q-card-actions>
          </q-card>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { $axios } from "boot/axios";
import _ from "lodash";
import VueEventBus from "../../plugins/eventbus.js";

const moment = require("moment");

export default {
  name: "Dashboard",
  data() {
    return {
      loading: false,
      onboardingLocal: null,
      sessionData: [],
      currentActiveSessions: [],
      openCalls: [],
      openForTaking: [],
      openForWitness: [],
      stripeErrorsFound: false,
      commissionExpiration: false,
      notaryCopyOfCommissionLetterName: false,
      stripeAccountName: false,
    };
  },
  async mounted () {
    this.loading = true;
    this.onboardingLocal = await this.onboard();
    await this.$store.dispatch("auth/fetchUser");
    this.details = await this.loadDetail();
    if (this.details) {
      if (this.details.commissionExpiresOn > 0) {
        this.commissionExpiration = true;
      }
      if (this.details.notaryCopyOfCommissionLetterName && this.details.notaryCopyOfCommissionLetterName !== null) {
        this.notaryCopyOfCommissionLetterName = true;
      }
      if (this.details.stripeAccountName && this.details.stripeAccountName !== null) {
        this.stripeAccountName = true;
      }
      if (!this.details.stripeFullAccountDetails) {
        this.stripeErrorsFound = true;
      }
      if (this.details.stripeFullAccountDetails && this.details.stripeFullAccountDetails.requirements && this.details.stripeFullAccountDetails.requirements.errors && this.details.stripeFullAccountDetails.requirements.errors.length) {
        this.stripeErrorsFound = true;
      }
      if (this.details.stripeFullAccountDetails && this.details.stripeFullAccountDetails.capabilities && this.details.stripeFullAccountDetails.capabilities.transfers !== "active") {
        this.stripeErrorsFound = true;
      }
    }
    await this.loadSessionData(false);
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
    async loadDetail(sessionId) {
      try {
        const url = "notary/loads";
        const response = await $axios.post(url, { sessionId }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        return response.data;
      } catch (error) {
        return error;
      }
    },
    async onboard() {
      try {
        const url = "/users/me?stripe=true";
        const response = await $axios.get(url, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        return (response.data && response.data.onBoarding) ? response.data.onBoarding : false;
      } catch (error) {
        return error;
      }
    },
    async loadSessionData(sessionIds) {
      const url = "notary/sessions";
      const dataToSend = {
        notary_user_id: this.$user._id
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
      this.currentActiveSessions = [];
      this.openCalls = [];
      _.map(this.sessionData, (sessionDoc) => {
        if (sessionDoc.session.sessionActive) {
           // active call - if current notary id = session notary ID
           console.log("sessionDoc.joinedAsWitness", sessionDoc);
          if (this.$user._id === sessionDoc.session.notaryUserId || sessionDoc.joinedAsWitness) {
            this.currentActiveSessions.push(sessionDoc);
          } else {
            // else open call
            this.openCalls.push(sessionDoc);
          }
        } else if (sessionDoc.session.status === "ready to sign") {
          if (this.$user._id === sessionDoc.session.notaryUserId) {
            this.currentActiveSessions.push(sessionDoc);
          }
        }
        console.log("sessionDoc.session.sessionOpenCallForTaking", sessionDoc.session.sessionOpenCallForTaking);
        if (sessionDoc.session.sessionOpenCallForTaking) {
          this.openForTaking.push(sessionDoc);
          this.openCalls.push(sessionDoc);
        }
        if (sessionDoc.session.sessionOpenCallForWitness && !sessionDoc.joinedAsWitness) {
          console.log(sessionDoc.session);
          if (sessionDoc.session.notaryUserId !== this.$user._id) {
            this.openForWitness.push(sessionDoc);
            this.openCalls.push(sessionDoc);
          }
        }
      });
      console.log(this.currentActiveSessions);
      this.openCalls = _.uniqBy(this.openCalls, "session._id");
    },
    getStatusColor(status) {
      let statusColor = "primary";
      console.log(status);
      switch (status) {
        case "unsigned":
          statusColor = "primary";
          break;
        case "complete":
          statusColor = "teal";
          break;
        case "expired":
          statusColor = "red";
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
    formatDate(rawDate) {
      if (!rawDate) {
        return "Notarization not completed yet";
      }
      return `${moment(rawDate, "YYYY-MM-DD HH:mm A").utcOffset("-06:00").format("MMMM, Do YYYY")} at ${moment(rawDate, "YYYY-MM-DD HH:mm A").utcOffset("-06:00").format("hh:mmA")} CST`;
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
    async sessionCallTakeClicked(sessionId) {
      const url = `session/pickUpSession/${sessionId}`;
      const dataToSave = {
        sessionOpenCallForTaking: true
      };
      try {
        await $axios.post(url, {
          data: dataToSave
        });
        this.$q.notify({
          color: "primary",
          position: "bottom",
          message: "You have successfully picked up the session.",
        });
        const dataToSend = {
          sessionid: sessionId
        };
        if (window.currentSocket) {
          window.currentSocket.emit("serverSessionActivityChanged", dataToSend, (res) => {
            console.log("res", res);
          });
        }
      } catch (error) {
        if (error.data && error.data.error) {
          this.$q.notify({
            color: "red",
            position: "bottom",
            message: error.data.error
          });
        }
      }
    },
    async sessionCallWitnessClicked(sessionId) {
      this.$q.notify({
          color: "primary",
          position: "bottom",
          message: "Redirecting to the live session and joining as witness.",
      });
      this.$router.replace(`/pdf_edit/sessions/${sessionId}?witness=true`);
    }
  }
};
</script>

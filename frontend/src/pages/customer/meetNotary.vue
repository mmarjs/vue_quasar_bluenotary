<template>
  <div>
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
              <img
                src="~assets/document-upload.svg"
                class="session-guide-icon"
              />
              <p class="q-pa-md">1. Upload Document</p>
              <q-icon name="check_circle" />
            </div>
            <div class="col column flex flex-center mobile-hide">
              <img src="~assets/id-card.svg" class="session-guide-icon" />
              <p class="q-pa-md">2. Identity Check</p>
              <q-icon name="check_circle" />
            </div>
            <div class="col column flex flex-center mobile-hide">
              <img src="~assets/credit-card.svg" class="session-guide-icon" />
              <p class="q-pa-md">3. Payment Info</p>
              <q-icon name="check_circle" />
            </div>
            <div class="col column flex flex-center black-border-bottom">
              <img src="~assets/videocall.svg" class="session-guide-icon" />
              <p class="q-pa-md">4. Meet Notary</p>
            </div>
          </div>
          <div class="row">
            <div
              class="col-12 flex q-mt-lg q-mb-xl"
            >
              <div class="flex flex-center column">
                <div class="text-center">
                  <h5 v-if="showVideoMeetingLink" class="q-pa-md">
                    <template v-if="calledFromBusinessPage">
                      Your KBA and ID check is successful. You can now join the session, to complete notarization
                    </template>
                    <template v-else>
                      We will now connect you with the notary in a video meeting
                      to finish the notarization process.
                    </template>
                  </h5>
                  <h5 v-else>
                    <template v-if="calledFromBusinessPage">
                      Your KBA and ID check is is successful. Go to <strong>My Documents</strong> page to check scheduled meeting time.
                    </template>
                    <template v-else>
                      Waiting for a notary to pick your session. You will be able to see the meeting link in your dashboard once a notary has picked the session.
                    </template>
                    <div v-if="!calledFromBusinessPage" class="q-pa-md text-center">
                      <q-btn class="btn btn-primary q-pa-md" @click="goBackToDashboard">Back to Dashboard</q-btn>
                    </div>
                  </h5>
                </div>
                <div class="q-pa-md text-center">
                  <q-btn v-if="showVideoMeetingLink" class="btn btn-primary q-pa-md" @click="startSignatureSession">Start the video meeting</q-btn>
                  <vue-identify-network
                    @network-type="handleNetworkIdentified"
                    @network-speed="handleNetworkSpeed"
                  >
                    <!-- <template #unknown>
                      <div class="text-center">
                        <i class="material-icons size-2 text-red text-center">warning</i>
                        <p class="q-my-md text-red">We cannot detect your internet connection speed at the moment. <br />Please move to a location with strong connection to ensure successful video call.</p>
                      </div>
                    </template> -->
                    <template #slow>
                      <i class="material-icons size-2 text-red text-center">warning</i>
                      <p class="q-my-md text-red">Your internet connection is not strong enough for a video call. <br />Please move to a location with a stronger connection.</p>
                    </template>
                  </vue-identify-network>
                </div>
              </div>
            </div>
            <div class="col-4 flex" />
          </div>
        </div>
      </div>
      <q-dialog v-model="checkAudioVideo" persistent>
        <q-card>
          <q-card-section class="row items-center">
            <div class="q-pb-sm row">
              <div class="col-12">
                <h2>Check your audio/video quality.</h2>
                <p class="q-pb-sm green q-py-md"><q-icon label="" name="wifi" /> Your internet connection is strong enough for the video call.</p>
                <video id="video" src="" style="color: black; width: 100%; min-height: 260px;" />
                <audio id="audio" src="" />
              </div>
            </div>
            <p v-if="audioVideoError.length > 0" class="text-red">
              {{ audioVideoError }}
            </p>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn v-close-popup flat label="Close" color="text-gray" @click="closePopup()" />
            <q-btn v-if="video" outline round color="primary" icon="videocam" @click="toggleVideo()" />
            <q-btn v-else outline round color="primary" icon="videocam_off" @click="toggleVideo()" />
            <q-btn v-if="audio" outline round color="primary" icon="mic" @click="toggleAudio()" />
            <q-btn v-else outline round color="primary" icon="mic_off" @click="toggleAudio()" />
            <q-btn flat label="Continue" color="primary" @click="goesNextAfterAudioVideoCheck()" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-page>
  </div>
</template>

<script>
import { ref } from "@vue/composition-api";
import { VueIdentifyNetwork } from "vue-identify-network";
import { $axios } from "boot/axios";
import SessionHeader from "../../components/SessionHeader.vue";

export default {
  name: "MeetNotary",
  components: { SessionHeader, VueIdentifyNetwork },
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
      sessionid: "",
      sessionDataDoc: {},
      showDirectlyJoinSessionButtonForAdditionalSigner: false,
    };
  },
  computed: {
    showVideoMeetingLink() {
      let showLink = true;
      if (this.sessionDataDoc && this.sessionDataDoc.sessionOpenCallForTaking && !this.sessionDataDoc.notaryUserId) {
        showLink = false;
      }
      if (this.calledFromBusinessPage && !(this.sessionDataDoc && this.sessionDataDoc.sessionActive)) {
        showLink = false;
      }
      return showLink;
    }
  },
  watch: {

  },
  created () {
  },
  async mounted () {
    this.sessionid = (this.$route.params && this.$route.params.id) || false;
    if (this.calledFromBusinessPageSessionId) {
      this.sessionid = this.calledFromBusinessPageSessionId;
    }
    this.currentSession = this.$q.localStorage.getItem("sessionData");
    if (!this.currentSession && !this.calledFromBusinessPage) {
      this.$router.replace(`/business/personal_info/${this.sessionid}`);
    }
    const url = "session/loads";
    const response = await $axios.post(url, { sessionId: this.sessionid, userId: this.$user._id }, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    this.sessionDataDoc = response.data && response.data.session;
    console.log(this.sessionDataDoc);
  },
  setup () {
    const audioVideoError = ref("");
    const audioCheck = ref(false);
    const videoCheck = ref(false);
    const audio = ref(false);
    const video = ref(false);
    const checkAudioVideo = ref(false);

    const loading = ref(false);
    const currentSession = ref(null);

    const apiKey = ref("4waez78zShGleGVhW2nIYQ");
    const leaveUrl = ref("http://localhost:8080");
    const meetingNumber = ref("82315777577");
    const passWord = ref("9fFZi6");
    const role = ref(1);
    const userEmail = ref("");
    const userName = ref("wewe");
    const registrantToken = ref("");

    const handleNetworkIdentified = (type) => {
      console.log("connection type: ", type);
    };
    const handleNetworkSpeed = (speed) => {
      console.log("downlink: ", speed);
    };

    return {
      audioVideoError,
      audioCheck,
      videoCheck,
      audio,
      video,
      checkAudioVideo,
      handleNetworkIdentified,
      handleNetworkSpeed,
      loading,
      currentSession,
      apiKey,
      leaveUrl,
      meetingNumber,
      passWord,
      role,
      userEmail,
      userName,
      registrantToken
    };
  },
  methods: {
    startSignatureSession() {
      if (this.audioCheck && this.videoCheck) {
        this.$router.replace(`/pdf_edit/sessions/${this.sessionid}`);
      } else {
        this.checkAudioVideo = true;
        // this.getAudioVideoStream();
      }
    },
    goBackToDashboard() {
      this.$router.replace("/business");
    },
    startMeeting () {
      document.getElementById("zmmtg-root").style.display = "block";
    },
    goesNextAfterAudioVideoCheck() {
      if (!this.video) {
        this.audioVideoError = "Camera permission is required to go ahead, please enable the camera access and try again.";
      } else if (!this.audio) {
        this.audioVideoError = "Mic permission is required to go ahead, please enable the mic access and try again.";
      } else {
        this.closePopup();
        this.$router.replace(`/pdf_edit/sessions/${this.sessionid}`);
      }
    },
    getAudioVideoStream() {
      // video
      navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((stream) => {
          document.getElementById("video").srcObject = stream;
          document.getElementById("video").autoplay = true;
          this.video = true;
          this.videoCheck = true;
      }).catch((err) => {
          this.audioVideoError = err;
          console.log(`u got an error: ${err}`);
      });

      // Audio
      navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then((stream) => {
          document.getElementById("audio").srcObject = stream;
          document.getElementById("audio").autoplay = true;
          this.audio = true;
          this.audioCheck = true;
      }).catch((err) => {
          this.audioVideoError = err;
          console.log(`u got an error: ${err}`);
      });
    },
    toggleAudio() {
      if (!this.audio) {
        // Audio
        navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then((stream) => {
            document.getElementById("audio").srcObject = stream;
            document.getElementById("audio").autoplay = true;
            this.audio = true;
            this.audioCheck = true;
        }).catch((err) => {
            this.audioVideoError = err;
            console.log(`u got an error: ${err}`);
        });
      } else {
        const audioElem = document.getElementById("audio");
        const aStream = audioElem.srcObject;
        const aTracks = aStream.getTracks();

        aTracks.forEach((track) => {
          track.stop();
        });
        audioElem.srcObject = null;
        this.audio = false;
      }
    },
    toggleVideo() {
      if (!this.video) {
        // video
        navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((stream) => {
            document.getElementById("video").srcObject = stream;
            document.getElementById("video").autoplay = true;
            this.video = true;
            this.videoCheck = true;
        }).catch((err) => {
            this.audioVideoError = err;
            console.log(`u got an error: ${err}`);
        });
      } else {
        const videoElem = document.getElementById("video");
        const vStream = videoElem.srcObject;
        const vTracks = vStream.getTracks();

        vTracks.forEach((track) => {
          track.stop();
        });
        videoElem.srcObject = null;
        this.video = false;
      }
    },
    closePopup() {
      if (this.video) {
        this.toggleVideo();
      }
      if (this.audio) {
        this.toggleAudio();
      }
    },
    stopAudioVideo() {
      const videoElem = document.getElementById("video");
      const audioElem = document.getElementById("audio");

      if (this.video) {
        const vStream = videoElem.srcObject;
        const vTracks = vStream.getTracks();

        vTracks.forEach((track) => {
          track.stop();
        });
        videoElem.srcObject = null;
        this.video = false;
      }

      if (this.audio) {
        const aStream = audioElem.srcObject;
        const aTracks = aStream.getTracks();

        aTracks.forEach((track) => {
          track.stop();
        });
        audioElem.srcObject = null;
        this.audio = false;
      }
    },
  }
};
</script>

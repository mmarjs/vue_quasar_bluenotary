<template>
  <q-page class="q-pa-md flex-center session-container">
    <div class="row">
      <div class="col-12 col-md-12">
        <session-header :session-id="sessionid" />
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
          <div class="col flex column flex-center mobile-hide">
            <img src="~assets/document-upload.svg" class="session-guide-icon" />
            <p class="q-pa-md">1. Upload Document</p>
            <q-icon name="check_circle" />
          </div>
          <div class="col column flex flex-center mobile-hide">
            <img src="~assets/id-card.svg" class="session-guide-icon" />
            <p class="q-pa-md">2. Identity Check</p>
            <q-icon name="check_circle" />
          </div>
          <div class="col column flex flex-center black-border-bottom">
            <img src="~assets/credit-card.svg" class="session-guide-icon" />
            <p class="q-pa-md">3. Payment Info</p>
          </div>
          <div class="col column flex flex-center mobile-hide">
            <img src="~assets/videocall.svg" class="session-guide-icon" />
            <p class="q-pa-md">4. Meet Notary</p>
          </div>
        </div>
        <div class="row">
          <div class="col-12 col-md-6 q-mt-lg q-pr-lg">
            <div v-show="!isPaymentAdded" class="">
              <h1 class="q-pb-sm">Add a Payment Card</h1>
              <p class="q-mb-md">
                Your credit card will be pre-authorized now. After the
                notarization session is completed, your credit card
                will be charged.
              </p>
              <div class="">
                <div class="q-gutter-md row">
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
                      <div class="col">
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
                      <div class="col">
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
                </div>
              </div>
            </div>
            <div v-show="isPaymentAdded" class="flex column q-gutter-md">
              <h5 class="q-my-md">Your credit card is pre-authorized.</h5>
              <p class="q-my-md">
                Once the
                notarization session is completed and reviewed, your credit card
                will be charged.
              </p>
              <div class="q-my-md">
                <div class="row">
                  <div id="payment-form">
                    <p class="">
                      Card:<b> {{ paymentInfo.stripeBrand }}</b>
                    </p>
                    <p class="">
                      Exp:<b>
                        {{ paymentInfo.exp_month }}/{{
                          paymentInfo.exp_year
                        }}</b
                      >
                    </p>
                    <p class="">
                      Last 4: <b>{{ paymentInfo.last4 }}</b>
                    </p>
                    <q-btn class="q-mt-md" @click="updateCard"> Update Your Card </q-btn>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-6">
            <q-card
              class="my-card q-pa-lg"
              flat
            >
              <q-card-section class="text-center">
                <span class="material-icons" style="font-size:3rem">
                  style
                </span>
                <h5 class=" q-my-md">Payment Pre-authorization</h5>
                <div class="flex flex-center ">
                  <p class="col">We charge nothing now. Only after you confirm completion of the notarization will you be billed for the transaction.</p>
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
        :loading="loading"
        @click="submitForm()"
      />
    </div>
  </q-page>
</template>

<script>
import { ref } from "@vue/composition-api";
import { $axios } from "boot/axios";
import { loadStripe } from "@stripe/stripe-js/pure";
import SessionHeader from "../../components/SessionHeader.vue";

export default {
  name: "PaymentInfo",
  components: { SessionHeader },
  data() {
    return {
      sessionid: "",
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
  async mounted () {
    this.sessionid = (this.$route.params && this.$route.params.id) || false;
    this.currentSession = this.$q.localStorage.getItem("sessionData");
    if (!this.currentSession) {
      this.$router.replace(`/business/personal_info/${this.sessionid}`);
    }
    const res = await this.loadPersonalData(this.sessionid);
    if (res && res.stripeCustomerID) {
      console.log("loadPersonalData ", res);
      this.paymentInfo = res;
      this.isPaymentAdded = true;
    }

    const style = {
      base: {
        fontFamily: "\"Roboto\", \"-apple-system\", \"Helvetica Neue\", Helvetica, Arial, sans-serif",
        "::placeholder": {
          color: "#CFD7E0",
        },
      },
    };
    if (!this.stripe) {
      if (this.$user.testingacc) {
        const pubkey = process.env.STRIPE_PUBLIC_KEY_TEST;
        this.stripe = await loadStripe(pubkey);
      } else {
        const pubkey = process.env.STRIPE_PUBLIC_KEY;
        this.stripe = await loadStripe(pubkey);
      }
    }
    if (!this.elements) {
      const cardElements = ["cardNumber", "cardExpiry", "cardCvc"];
      this.elements = this.stripe.elements();
      cardElements.forEach((element) => {
        this.card[element] = this.elements.create(element, { style });
        this.card[element].mount(`#${element}`);
        this.card[element].addEventListener("change", (e) => this.updated(e));
      });
    }
  },
  setup () {
    const loading = ref(false);
    const isPaymentAdded = ref(false);

    const stripe = ref(null);
    const elements = ref(null);
    const paymentInfo = ref({});
    const card = ref({
      cardNumber: null,
      cardExpiry: null,
      cardCvc: null,
    });
    const errors = ref({
      cardNumber: "",
      cardExpiry: "",
      cardCvc: ""
    });
    const submissionError = ref(null);
    const currentSession = ref(null);
    const createCustomer = async (seesion, data) => {
      try {
        const url = "session/createCustomer";
        const response = await $axios.post(url, { data, sessionId: seesion }, {
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
    const updateCard = async () => {
      isPaymentAdded.value = false;
    };
    return {
      loading,
      currentSession,
      submissionError,
      stripe,
      elements,
      card,
      errors,
      createCustomer,
      loadPersonalData,
      isPaymentAdded,
      paymentInfo,
      updateCard
    };
  },
  methods: {
    async nextButtonClick () {
      return "";
    },
    async submitForm () {
      // e.preventDefault();
      try {
        if (this.isPaymentAdded) {
          const url = `session/saveSessionData/${this.sessionid}`;
          const dataToSave = {
            sessionOpenCallForTaking: true
          };
          await $axios.post(url, {
            data: dataToSave
          });
          this.$router.replace(`/business/meet_notary/${this.sessionid}`);
          return;
        }

        this.loading = true;
        this.submissionError = null;
        const { token, error } = await this.stripe.createToken(this.card.cardNumber);
        console.log({ error });
        if (error) {
          this.$q.notify({
            color: "secondary",
            position: "bottom-right",
            message: error.message,
          });
          return;
        }
        console.log({ token });
        const res = await this.createCustomer(this.sessionid, token);
        if (!(res && res.stack && res.message)) {
          this.paymentInfo = res;
          // this.isPaymentAdded = true;
          this.$q.notify({
            color: "primary",
            position: "bottom",
            message: "Your card information has been saved successfully.",
          });
          const url = `session/saveSessionData/${this.sessionid}`;
          const dataToSave = {
            sessionOpenCallForTaking: true
          };
          await $axios.post(url, {
            data: dataToSave
          });
          this.$router.replace(`/business/meet_notary/${this.sessionid}`);
        }
      } catch (error) {
        console.log({ error });
        this.$emit("failed", error);
      } finally {
        this.loading = false;
      }
    },
    resetForm () {
      // for (const [elementType] of Object.entries(this.card)) {
      //   this.card[elementType].clear();
      // }
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
    }
  },
};
</script>
<style scoped lang="scss">
.StripeElement--invalid {
  border-color: transparent;
}
#payment-form {
  width: 500px;
}
</style>

<template>
  <div>
    <q-btn
      class="full-width"
      v-if="$user.memberType == 'free'"
      label="Upgrade to Pro"
      color="green"
      :loading="loading"
      @click="upgradeToPro()"
    />
    <q-dialog v-model="card">
      <q-card class="my-card">
        <q-card-section>
          <div class="text-h6">Upgrade Pro Hybrid</div>
        </q-card-section>
        <q-card-section />
        <q-card-actions align="right">
          <q-btn
            v-close-popup
            flat
            class="q-ml-sm"
            color="green"
            label="Upgrade"
            @click="upgradeToPro()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { loadStripe } from "@stripe/stripe-js/pure";
import { ref } from "@vue/composition-api";

export default {
  name: "UpgradeToProComponent",
  data() {
    return {
      loading: false,
      card: ref(false),
    };
  },

  mounted() {
    this.browserIncompatibilityError = !/chrome/i.test(navigator.userAgent);
  },
  methods: {
    async loadMessage() {
      const { data } = await this.axios.get("/messages/count");
      this.count = data?.count ?? 0;
      this.attachmentCount =
        (await this.axios.get("/attachments/count").data?.count) ?? 0;
    },
    async upgradeToPro() {
      console.log("NotaryHeader", this.stripe);
      this.loading = true;
      if (process.env.STRIPE_PUBLIC_KEY_TEST) {
        if (!this.stripe) {
          if (this.$user.testingacc) {
            const pubkey = process.env.STRIPE_PUBLIC_KEY_TEST;
            this.stripe = await loadStripe(pubkey);
          } else {
            const pubkey = process.env.STRIPE_PUBLIC_KEY;
            this.stripe = await loadStripe(pubkey);
          }
        }
      }
      this.loading = false;
      try {
        const { data } = await this.axios.post("/notary/checkout-session");
        return this.stripe.redirectToCheckout({ sessionId: data.id });
      } catch (error) {
        return error;
      }
    },
  },
};
</script>

<template>
  <q-dialog ref="dialog" v-model="showUpgradeDialogue">
    <q-card class="q-ma-lg">
      <q-card-section class="row items-center q-pb-none">
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div class="q-pa-md">
          <div class="q-gutter-y-md">
            <div class="row q-pb-lg" style="border-bottom: 1px solid gray">
              <div class="col-2 offset-1">
                <img src="~assets/wax-stamp.png" style="width:auto" />
              </div>
              <div class="q-pt-sm col-5 offset-1">
                <h1><strong>Pro Hybrid Plan</strong></h1>
                <h2 class="q-py-sm">$27 / month </h2>
                <p><small>Cancel anytime.</small></p>
              </div>
            </div>
            <div class="card-body row q-px-md">
              <ul class="list-group list-group-flush col">
                <li class="list-group-item">
                  <span class="material-icons" style="font-size:4rem">
                    history_edu
                  </span>
                  <strong> Unlimited Loan Signings</strong>
                  <ul class="list-group">
                    <li class="list-group-item" style="margin:0">
                      <span class="material-icons">
                        task_alt
                      </span>
                      BlueNotary service fee of <em>$25 per signing package</em>
                    </li>
                    <li class="list-group-item" style="margin:0">
                      <span class="material-icons">
                        task_alt
                      </span>
                      Unlimited seals, no fee
                    </li>
                  </ul>
                </li>
                <li class="list-group-item" style="">
                  <span class="material-icons" style="font-size:4rem">
                    ring_volume
                  </span>
                  <strong> &nbsp; BlueNotary incoming Requests</strong>
                  <ul class="list-group">
                    <li class="list-group-item" style="margin:0">
                      You can pick up open-call requests from <strong>BlueNotary-sourced clients</strong> and/or BYOC (Bring your own clients)
                    </li>
                  </ul>
                </li>
                <li class="list-group-item">
                  <span class="material-icons" style="font-size:4rem">
                    price_check
                  </span>
                  &nbsp; Add your own <strong>custom fees</strong> for any session
                </li>
                <li class="list-group-item">
                  <span class="material-icons" style="font-size:4rem">
                    contact_mail
                  </span>
                  &nbsp; Send <strong>branded invite emails</strong>
                </li>
                <li class="list-group-item">
                  <span class="material-icons" style="font-size:4rem">
                    library_add
                  </span>
                  Add <strong>multiple participants/documents</strong>
                </li>
                <li class="list-group-item">
                  <span class="material-icons" style="font-size:4rem">
                    library_books
                  </span>
                  <strong> Templates library</strong> for pre-tagging documents
                </li>
                <li class="list-group-item">
                  <span class="material-icons" style="font-size:4rem">
                    approval
                  </span>
                  <strong> Free</strong> e-seal & digital certificate ($86+ value)
                </li>
              </ul>
            </div>
          </div>
          <div class="col-12 q-pt-sm">
            <UpgradeToProComponent />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import VueEventBus from "../../plugins/eventbus.js";
import UpgradeToProComponent from "../../components/UpgradeToProComponent.vue";

export default {
  name: "UpgradeAccountPopupComponent",
  components: { UpgradeToProComponent },
  props: {
    elementId: {
      type: String,
      default: ""
    },
    openAccProModel: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      showUpgradeDialogue: false,
    };
  },

  computed: {
  },

  watch: {
    openAccProModel: {
      handler(value) {
        if (value) {
          this.showUpgradeDialogue = true;
        }
      }
    }
  },

  mounted() {
    // this.showUpgradeDialogue = true;
  },
  created() {
  },

  methods: {
    closeDialogue() {
      this.$refs.dialog.hide();
      if (!this.imageData) {
        VueEventBus.$emit("REMOVE_ELEMENT", this.elementId);
      }
    }
  }
};

</script>

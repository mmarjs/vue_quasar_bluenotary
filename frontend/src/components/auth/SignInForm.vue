<template>
  <q-card
    class="q-pa-lg"
  >
    <q-card-section class="">
      <h1>
        <strong>
          Blue Notary
        </strong> Account Login
      </h1>
    </q-card-section>
    <q-card-section class="q-pb-none">
      <div v-if="this.$resendVerifyEmail" class="bn-note bn-note--warning">
        <p>We have sent you the email for verification,<br /><a href="/resend-verify-email">Resend verification email</a> if you have not received it yet, <br />or verification code is expired.</p>
      </div>
      <q-form class="q-gutter-sm" @submit="signIn">
        <q-input
          v-model="$v.model.email.$model"
          dense
          filled
          type="email"
          label="Email"
          :error-message="errorMessage($v.model.email, 'Email')"
          :error="!!errorMessage($v.model.email)"
        >
          <template v-slot:prepend>
            <q-icon name="email" />
          </template>
        </q-input>
        <q-input
          v-model="$v.model.password.$model"
          dense
          filled
          type="password"
          label="Password"
          :error-message="errorMessage($v.model.password, 'Password')"
          :error="!!errorMessage($v.model.password)"
          @keydown.enter.prevent="signIn"
        >
          <template v-slot:prepend>
            <q-icon name="lock" />
          </template>
        </q-input>
      </q-form>
    </q-card-section>
    <q-card-actions>
      <q-btn
        rounded
        size="md"
        color="blue"
        class="full-width text-white"
        type="submit"
        label="Login"
        :loading="isSubmitting"
        :disable="isSubmitting"
        @click="signIn"
      />
    </q-card-actions>
    <div class="flex q-pa-xs flex-center font-sm q-mt-md">
      <a href="business/register" class="">
        <small>Register</small>
      </a>
      <!-- &nbsp;|&nbsp;
      <a href="/notary/register" class="">
        <small>Notary</small>
      </a> -->
      &nbsp;|&nbsp;
      <a href="/forgot-password">
        <small>Forgot password?</small>
      </a>
    </div>
  </q-card>
</template>
<script>
import {
  required, minLength, email,
} from "vuelidate/lib/validators";
import VuelidateHelperMixin from "@/mixins/VuelidateHelperMixin";
import { reactive, toRefs } from "@vue/composition-api";

export const emailFormatter = (value) => {
  if (!value) return value;
  return value.toLowerCase();
};

export default {
  mixins: [VuelidateHelperMixin],
  props: {
    userType: {
      type: String,
      default: null,
    },
  },
  data () {
    return {
      autoSubmitForm: false
    };
  },
  setup (props, context) {
    const {
      root: { $route }
    } = context;
    console.log($route.query);
    const { userType } = toRefs(props);
    const model = reactive({
      email: "",
      password: "",
      userType,
    });
    return {
      model,
      isSubmitting: false,
      resendVerifyEmail: false,
    };
  },
  validations: {
    model: {
      email: {
        required,
        email: (val) => email(emailFormatter(val)),
      },
      password: { required, minLength: minLength(6) },
    },
  },
  mounted() {
    console.log(this.$route.query);
    console.log(this.$route.query.autosubmit === "true");
    if (this.$route.query && this.$route.query.autosubmit === "true") {
      this.autoSubmitForm = true;
    }
    if (this.autoSubmitForm) {
      this.signIn();
    }
  },
  methods: {
    async signIn () {
      this.isSubmitting = true;
      this.$v.model.$touch();
      if (!this.$v.model.$invalid || this.autoSubmitForm) {
        try {
          const queryRoute = this.$route.query;
          if (this.autoSubmitForm) {
            if (queryRoute.email) {
              const modelEmail = queryRoute.email.replace(" ", "+");
              this.model.email = modelEmail;
            }
            if (queryRoute.password) {
              this.model.password = queryRoute.password;
            }
            if (queryRoute.temporary) {
              this.model.temporary = queryRoute.temporary;
            }
            if (queryRoute.impersonate) {
              this.model.impersonate = queryRoute.impersonate;
            }
            if (queryRoute.loginViaEmail) {
              this.model.loginViaEmail = queryRoute.loginViaEmail;
            }
            if (queryRoute.type) {
              this.model.userType = queryRoute.type;
            }
            console.log(this.$route.query);
            console.log(this.model);
          }
          await this.$auth.login({
            data: this.model,
          }).then(() => {
            if (localStorage.getItem("resendVerifyEmail")) {
              this.setEmailStatus(true);
            }
          }, () => {
            if (localStorage.getItem("resendVerifyEmail")) {
              this.setEmailStatus(true);
            }
          });
          const emailid = this.model.email;
          window.fpr("referral", { email: emailid });
          await this.$store.dispatch("auth/fetchUser");
          if (queryRoute.type === "witness" && queryRoute.sessionid) {
            this.$router.replace(`/pdf_edit/sessions/${queryRoute.sessionid}?witness=true`);
          } else if (queryRoute.routetype === "prepareDoc" && queryRoute.sessionid) {
            this.$router.replace(`/business/prepare_doc/${queryRoute.sessionid}`);
          } else if (queryRoute.routetype === "pdfEdit" && queryRoute.sessionid) {
            this.$router.replace(`/pdf_edit/sessions/${queryRoute.sessionid}`);
          } else if (queryRoute.routetype === "businessKBA" && queryRoute.sessionid) {
            this.$router.replace(`/business?kba=true&sessionid=${queryRoute.sessionid}`);
          } else {
            this.$router.replace("/auth");
          }
        } catch (error) {
        }
      }
      this.isSubmitting = false;
    },
  },

};
</script>

<template>
  <q-card
    square
    class="q-pa-md q-ma-none no-shadow"
    style="width: 420px; margin: 0 auto"
  >
    <q-card-section class="">
      <h1>
        <strong>
          BlueNotary
        </strong> Account Signup
      </h1>
    </q-card-section>
    <q-card-section>
      <q-form class="q-gutter-xs">
        <!-- <q-input
          v-model="$v.model.name.$model"
          dense
          square
          filled
          label="Name"
          :error-message="errorMessage($v.model.name, 'Name')"
          :error="!!errorMessage($v.model.name)"
        >
          <template v-slot:prepend>
            <q-icon name="account_box" />
          </template>
        </q-input> -->
        <q-input
          v-model="$v.model.first_name.$model"
          dense
          square
          filled
          label="First Name"
          :error-message="errorMessage($v.model.first_name, 'First Name')"
          :error="!!errorMessage($v.model.first_name)"
        >
          <template v-slot:prepend>
            <q-icon name="account_box" />
          </template>
        </q-input>
        <q-input
          v-model="$v.model.last_name.$model"
          dense
          square
          filled
          label="Last Name"
          :error-message="errorMessage($v.model.last_name, 'Last Name')"
          :error="!!errorMessage($v.model.last_name)"
        >
          <template v-slot:prepend>
            <q-icon name="account_box" />
          </template>
        </q-input>
        <q-input
          v-model="$v.model.email.$model"
          dense
          square
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
          square
          filled
          type="password"
          label="Password"
          :error-message="errorMessage($v.model.password, 'Password')"
          :error="!!errorMessage($v.model.password)"
        >
          <template v-slot:prepend>
            <q-icon name="lock" />
          </template>
        </q-input>
        <q-input
          v-model="$v.model.confirmPassword.$model"
          dense
          square
          filled
          type="password"
          label="Repeat Password"
          :error-message="
            errorMessage($v.model.confirmPassword, 'Repeat Password')
          "
          :error="!!errorMessage($v.model.confirmPassword)"
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
        :disable="isSubmitting"
        label="Sign up"
        :loading="isSubmitting"
        @click="signUp"
      />
    </q-card-actions>
    <q-card-section>
      <p class="text-caption text-grey">
        By signing up you are agreeing to the Blue Notary <a href="bluenotary.us/terms" target="_blank">Terms of Service
        </a>. Find information on our privacy practices in our <a href="bluenotary.us/privacy" target="_blank">Privacy Policy
        </a>.
      </p>
    </q-card-section>
    <div class="flex flex-center q-gutter-md" style="text-decoration:underline;">
      <small><a href="/resend-verify-email">Didn't receive confirmation email?</a></small>
      <!-- <a href="/sign-in">
        <small>Login</small>
      </a> -->
      <a href="/notary/register">
        <small>Notary Signup</small>
      </a>
    </div>
  </q-card>
</template>
<script>
import {
  required, minLength, email, sameAs,
} from "vuelidate/lib/validators";
import VuelidateHelperMixin from "@/mixins/VuelidateHelperMixin";

export const emailFormatter = (value) => {
  if (!value) return value;
  return value.toLowerCase();
};

export default {
  mixins: [VuelidateHelperMixin],

  data () {
    return {
      model: {
        name: "",
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "customer"
      },
      isSubmitting: false,
      submitStatus: null,
    };
  },
  validations: {
    model: {
      // name: {
      //   required,
      // },
      first_name: {
        required,
      },
      last_name: {
        required,
      },
      email: {
        required,
        email: (val) => email(emailFormatter(val)),
      },
      password: { required, minLength: minLength(6) },
      confirmPassword: { required, sameAsPassword: sameAs("password") },
    },
  },
  methods: {
    async signUp () {
      this.model.name = `${this.model.first_name} ${this.model.last_name}`;

      console.log("VueJs SignUpForm 178", this.model);
      this.isSubmitting = true;
      this.$v.model.$touch();
      if (!this.$v.model.$invalid) {
        try {
          await this.$auth.register({
            data: this.model,
          });
        } catch (error) {
          //
        }
      }
      this.isSubmitting = false;
    },
  },
};
</script>

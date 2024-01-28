<template>
  <q-card class="q-pa-md q-ma-none">
    <q-card-section class="">
      <h6 class="no-margin">
        <h1>
          BlueNotary - Notary Sign Up
        </h1>
      </h6>
    </q-card-section>
    <q-card-section>
      <q-form class="q-gutter-xs">
        <!-- <q-input
          v-model="$v.model.name.$model"
          dense
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
          v-model="$v.model.commissionNumber.$model"
          dense
          filled
          type="text"
          label="Notary Commission Number"
          :error-message="
            errorMessage($v.model.commissionNumber, 'Commission Number')
          "
          :error="!!errorMessage($v.model.commissionNumber)"
        >
          <template v-slot:prepend>
            <q-icon name="pin" />
          </template>
        </q-input>
        <q-input
          v-model="$v.model.commissionExpiresOn.$model"
          dense
          filled
          type="text"
          label="Commission Expiration Date (yyyy/mm/dd)"
          :error-message="
            errorMessage($v.model.commissionExpiresOn, 'Commission Expires On')
          "
          :error="!!errorMessage($v.model.commissionExpiresOn)"
          mask="date"
          :rules="['date']"
          @focus="$refs.qDateProxy.show()"
        >
          <template v-slot:prepend>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy
                ref="qDateProxy"
                cover
                transition-show="scale"
                transition-hide="scale"
              >
                <q-date
                  v-model="$v.model.commissionExpiresOn.$model"
                  @input="$refs.qDateProxy.hide()"
                >
                  <div class="row items-center justify-end">
                    <q-btn
                      ref="closeBtn"
                      v-close-popup
                      label="Close"
                      color="primary"
                      flat
                    />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
        <q-select
          v-model="$v.model.state.$model"
          dense
          filled
          :options="states"
          label="State"
          :error-message="
            errorMessage($v.model.state, 'State')
          "
          :error="!!errorMessage($v.model.state)"
        >
          <template v-slot:prepend>
            <q-icon name="map" />
          </template>
        </q-select>
        <q-input
          v-model="$v.model.password.$model"
          dense
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
        By signing up you are agreeing to the Blue Notary <a href="https://bluenotary.us/terms" target="_blank">Terms of Service.
        </a> Find
        information on our privacy practices in our <a href="https://bluenotary.us/privacy" target="_blank">Privacy Policy
        </a>.
      </p>
    </q-card-section>
    <div class="flex q-pa-xs flex-center font-sm" style="text-decoration:underline;">
      <small><a href="/resend-verify-email" class="q-px-md">Didn't receive confirmation email?</a></small>
      <a href="/sign-in">
        <small>Login</small>
      </a>
    </div>
  </q-card>
</template>
<script>
import {
  required, minLength, email, sameAs,
} from "vuelidate/lib/validators";
import VuelidateHelperMixin from "@/mixins/VuelidateHelperMixin";
import states from "@/data/states.json";
import moment from "moment";

export const emailFormatter = (value) => {
  if (!value) return value;
  return value.toLowerCase();
};

export default {
  mixins: [VuelidateHelperMixin],

  data () {
    return {
      states,
      model: {
        name: "",
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        confirmPassword: "",
        commissionNumber: "",
        commissionExpiresOn: "",
        role: "notary",
        state: "",
      },
      isSubmitting: false,
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
      commissionNumber: { required },
      commissionExpiresOn: { required },
      state: { required }
    },
  },
  methods: {
    async signUp () {
      this.model.name = `${this.model.first_name} ${this.model.last_name}`;
      this.isSubmitting = true;
      this.$v.model.$touch();
      if (!this.$v.model.$invalid) {
        try {
          await this.$auth.register({
            data: {
              first_name: this.model.first_name,
              last_name: this.model.last_name,
              name: this.model.name,
              email: this.model.email,
              password: this.model.password,
              confirmPassword: this.model.confirmPassword,
              commissionNumber: this.model.commissionNumber,
              commissionExpiresOn: moment(this.model.commissionExpiresOn, "YYYY/MM/DD", true).unix(),
              role: this.model.role,
              state: this.model.state,
            },
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

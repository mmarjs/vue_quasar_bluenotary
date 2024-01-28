<template>
  <q-page
    class=""
    style="
      background: url('https://bluenotary.us/assets/img/leaves.png');
      background-size: 100%;
    "
  >
    <div class="row q-pa-lg rounded">
      <div class="set-mauto cust-set">
        <div class="col-12 q-pb-lg">
          <h1>Account Settings</h1>
        </div>
        <q-card>
          <div class="q-pa-lg row">
            <div class="col-12">
              <div class="row q-py-md">
                <div class="col-md-4 col-12 q-pr-sm sett-field">
                  <q-input
                    v-model="firstName"
                    outlined
                    hint="First Name"
                    :dense="dense"
                  />
                </div>
                <div class="col-md-4 col-12 q-pr-sm sett-field">
                  <q-input
                    v-model="lastName"
                    outlined
                    hint="Last Name"
                    :dense="dense"
                  />
                </div>
                <div class="col-md-4 col-12 q-pr-sm sett-field">
                  <q-input
                    v-model="email"
                    outlined
                    hint="Email"
                    :dense="dense"
                    readonly
                  />
                </div>
              </div>
              <div v-if="isAccountDetailUpdated()" class="row">
                <div class="col-12">
                  <q-btn
                    class="next-btn btn q-pa-sm q-mt-md"
                    label="Update"
                    color="green"
                    :loading="loading"
                    @click="nextButtonClick()"
                  />
                </div>
              </div>
              <hr />
              <div style="width:100%">
                <q-expansion-item class="ctm-togl shadow-1" label="Change Password">
                  <q-form ref="passform" class="q-pa-md">
                    <div class="row q-py-md">
                      <div class="col-md-4 col-4 q-pr-sm">
                        <q-input
                          v-model="$v.model.oldpassword.$model"
                          outlined
                          type="password"
                          hint="Old Password"
                          :dense="dense"
                          :error-message="errorMessage($v.model.oldpassword, 'Old Password')"
                          :error="!!errorMessage($v.model.oldpassword)"
                        />
                      </div>
                      <div class="col-md-4 col-4 q-pr-sm">
                        <q-input
                          v-model="$v.model.password.$model"
                          outlined
                          type="password"
                          hint="New Password"
                          :dense="dense"
                          :error-message="errorMessage($v.model.password, 'New Password')"
                          :error="!!errorMessage($v.model.password)"
                        />
                      </div>
                      <div class="col-md-4 col-4 q-pr-sm">
                        <q-input
                          v-model="$v.model.confirmPassword.$model"
                          outlined
                          type="password"
                          hint="Repeat New Password"
                          :dense="dense"
                          :error-message="errorMessage($v.model.confirmPassword, 'Repeat Password')"
                          :error="!!errorMessage($v.model.confirmPassword)"
                        />
                      </div>
                    </div>
                  </q-form>
                  <div class="row q-pa-md">
                    <div class="col-12">
                      <q-btn
                        class="next-btn btn q-pa-sm q-mt-md"
                        label="Update"
                        color="green"
                        :loading="loading"
                        @click="updatePassword()"
                      />
                    </div>
                  </div>
                </q-expansion-item>
              </div>
            </div>
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
import {
  required, minLength, sameAs,
} from "vuelidate/lib/validators";
import VuelidateHelperMixin from "@/mixins/VuelidateHelperMixin";
import { ref } from "@vue/composition-api";
import { $axios } from "boot/axios";

export default {
    name: "CustomerAccountSettings",
    mixins: [VuelidateHelperMixin],
    data () {
      return {
        accountDataLoaded: false,
        model: {
          oldpassword: "",
          password: "",
          confirmPassword: ""
        },
      };
    },
      validations: {
      model: {
        oldpassword: { required },
        password: { required, minLength: minLength(6) },
        confirmPassword: { required, sameAsPassword: sameAs("password") }
      }
    },
    setup () {
      const firstName = ref("");
      const lastName = ref("");
      const email = ref("");
      const dense = ref(false);
      const loading = ref(false);
      const saveDetail = async (data) => {
        try {
          const url = "auth/user-update";
          const response = await $axios.post(url, data, {
            headers: {
              "Content-Type": "application/json",
            },
          });
          return response.data;
        } catch (error) {
          return error;
        }
      };
      return {
        firstName,
        lastName,
        email,
        dense,
        loading,
        saveDetail
      };
    },
    async mounted () {
      this.accountDataLoaded = true;
      this.email = this.$user.email;
      this.firstName = (this.$user.first_name) ? this.$user.first_name : this.$user.name.split(" ")[0];
      this.lastName = (this.$user.last_name) ? this.$user.last_name : this.$user.name.split(" ")[1];
      this.oldData = {
          first_name: this.firstName,
          last_name: this.lastName,
          name: `${this.firstName} ${this.lastName}`,
          email: this.email,
      };
    },
    methods: {
      isAccountDetailUpdated () {
        if (this.accountDataLoaded === false) {
          return false;
        }
        if (this.accountDataLoaded === false || this.firstName !== this.oldData.first_name || this.lastName !== this.oldData.last_name) {
          return true;
        }
        return false;
      },
      async nextButtonClick () {
        if (!this.firstName) {
          return this.$q.notify({
            color: "secondary",
            position: "bottom-right",
            message: "Please enter first name.",
          });
        }
        if (!this.lastName) {
          return this.$q.notify({
            color: "secondary",
            position: "bottom-right",
            message: "Please enter last name.",
          });
        }
        if (!this.email) {
          return this.$q.notify({
            color: "secondary",
            position: "bottom-right",
            message: "Please enter email.",
          });
        }

        const data = {
          first_name: this.firstName,
          last_name: this.lastName,
          name: `${this.firstName} ${this.lastName}`,
          email: this.email,
        };
        this.loading = true;
        await this.saveDetail(data);
        await this.$store.dispatch("auth/fetchUser");
        this.loading = false;
        return true;
      },
      async updatePassword () {
        this.$v.model.$touch();
        if (!this.$v.model.$invalid) {
          try {
            this.loading = true;
            console.log(this.model);
            await this.axios.post("auth/update-password", this.$v.model.$model);
            this.loading = false;
            this.model = {
              oldpassword: "",
              password: "",
              confirmPassword: ""
            };
            this.$v.model.$reset();
          } catch (error) {
            this.loading = false;
          }
        }
      },
    }
};
</script>

<style></style>

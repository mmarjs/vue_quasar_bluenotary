<template>
  <q-page
    class="window-height window-width row justify-center"
    style="
      background: url('https://bluenotary.us/assets/img/red-flower.jpg');
      background-size: cover;
    "
  >
    <div class="flex column">
      <div class="flex-center flex q-pa-md">
        <a href="https://bluenotary.us">
          <img
            src="https://bluenotary.us/assets/img/logo-a4-b.png"
            style="width: 70px"
          />
        </a>
      </div>
      <div class="flex flex-center">
        <template v-if="!isSubmitting">
          <sign-in-form />
          <google-login />
        </template>
        <q-circular-progress
          v-else
          indeterminate
          size="50px"
          color="lime"
          class="q-ma-md"
        />
      </div>
    </div>
  </q-page>
</template>

<script>
// import GoogleLogin from "@/components/auth/GoogleLogin";
import { ref, watch } from "@vue/composition-api";
import SignInForm from "components/auth/SignInForm";

export default {
  components: {
    // GoogleLogin,
    SignInForm
  },
  setup (_, context) {
    const {
      root: { $constants, $route, $router }
    } = context;
    let userTypeDefault = {};
    if ($route.query.type) {
      userTypeDefault = $constants.UserTypeOptions.find(
        ({ value }) => value === $route.query.type
      );
    }
    const userType = ref(userTypeDefault);
    watch(userType, ({ value }) => {
      $router.replace(`/sign-in?type=${value}`);
    });
    if (!userType.value?.value) [userType.value] = $constants.UserTypeOptions;
    return {
      userType
    };
  },
  data () {
    return {
      isSubmitting: false
    };
  },
  async mounted () {
    this.isSubmitting = true;
    try {
      if (this.$route.query.token) {
        await this.$auth.login({
          data: { code: this.$route.query.token }
        });
        // await this.$store.dispatch("auth/fetchUser");
      }
    } catch (error) {
      //
    }
    this.isSubmitting = false;
  }
};
</script>

<style></style>

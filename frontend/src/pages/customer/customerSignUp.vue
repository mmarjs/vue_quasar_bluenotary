<template>
  <q-page
    class="window-height window-width row justify-center items-center"
    style="
      background: url('https://bluenotary.us/assets/img/red-flower.jpg');
      background-size: 100%;
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
      <sign-up-form />
    </div>
  </q-page>
</template>

<script>
import SignUpForm from "components/auth/SignUpForm";

export default {
  components: {
    SignUpForm,
  },
};
</script>

<style></style>

<template>
  <q-page
    class="window-height window-width justify-center items-center"
    style="
      background: url('https://bluenotary.us/assets/img/red-flower.jpg');
      background-size: 100%;
    "
  >
    <div class="flex column col">
      <div class="flex-center flex q-pa-md">
        <a href="https://bluenotary.us">
          <img
            src="https://bluenotary.us/assets/img/logo-a4-b.png"
            style="width: 70px"
          />
        </a>
      </div>
      <div class="flex flex-center" style="max-width:450px;margin:0 auto">
        <SignUpForm />
      </div>
    </div>
  </q-page>
</template>

<script>
import SignUpForm from "components/auth/notarySignUpForm";

export default {
  components: {
    SignUpForm,
  },
};
</script>

<style></style>

<template>
  <q-header elevated class="bg-white text-grey-8 q-py-xs q-px-md" height-hint="58">
    <!-- <div v-if="browserIncompatibilityError" style="width: 100%; text-align: center; background: #f595af; color: white; margin-left: -16px; margin-top: -4px; width: 100vw">
      Please use <a href="https://www.google.com/chrome/"><u>Chrome browser</u></a> for notarization sessions.
    </div> -->
    <q-toolbar>
      <img style="width:35px;" src="https://bluenotary.us/assets/img/logo-a4-b.png" />
      <q-space />
      <div class="q-gutter-sm row items-center no-wrap q-pr-lg customer-nav mbhide">
        <router-link to="/business/" class="q-px-md">
          My Documents
        </router-link>
      </div>
      <div class="q-gutter-sm row items-center no-wrap">
        <q-btn dense flat no-wrap>
          <span class="q-pa-sm">{{ $user.name }}</span>
          <q-icon name="arrow_drop_down" size="16px" />
          <q-menu auto-close>
            <q-list dense style="min-width: 200px">
              <q-item class="vmob">
                <router-link to="/business/">
                <q-item-section>
                  My Documents
                </q-item-section>
                </router-link>
              </q-item>

              <q-item clickable>
                <router-link to="/business/account-settings">
                <q-item-section>
                  Account Settings
                </q-item-section>
                </router-link>
              </q-item>
              <q-separator />
              <q-item clickable class="GL__menu-link" @click="signOut">
                <q-item-section>
                  Sign out
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </q-toolbar>
  </q-header>
</template>
<script>
export default {
  data() {
    return {
      count: 0,
      attachmentCount: 0,
      polling: null,
      // browserIncompatibilityError: false
    };
  },
  mounted() {
    // this.browserIncompatibilityError = !(/chrome/i.test(navigator.userAgent));
  },
  methods: {
    async loadMessage() {
      const { data } = await this.axios.get("/messages/count");
      this.count = data?.count ?? 0;
      this.attachmentCount =
        (await this.axios.get("/attachments/count").data?.count) ?? 0;
    },
    clearPolling() {
      clearInterval(this.polling);
      this.polling = null;
    }
  }
};
</script>

<template>
  <q-layout view="hHh lpR fFf" class="bg-grey-1">
    <NotaryHeader />
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import NotaryHeader from "@/components/layout/NotaryHeader";
import UserType from "@/constants/user-types";

export default {
  components: {
    NotaryHeader,
  },
  data () {
    return {
      leftDrawerOpen: false,
    };
  },
  computed: {
    dashboards () {
      console.log("Notary Layout ", this.$user?.role);

      switch (this.$user?.role) {
        case UserType.Notary:
          return this.$router.replace("/notary");
        case UserType.Admin:
          return [
            { icon: "dashboard", text: "Task List", link: "/admin/dashboard" },
          ];
        case UserType.Customer:
          return this.$router.replace("/business");

        default:
          return [];
      }
    },

    adminItems () {
      switch (this.$user?.role) {
        case UserType.Admin:
          return [
            { icon: "people", text: "Users", link: "/admin/users" },
          ];
        default:
          return [];
      }
    },
    userItems () {
      switch (this.$user?.type) {
        case UserType.Customer:
          return [
            { icon: "logout", text: "Sign Out", action: this.signOut },
          ];
        default:
          return [
            { icon: "password", text: "Change Password", link: "/auth/change-password" },
            { icon: "logout", text: "Sign Out", action: this.signOut },
          ];
      }
    },
  },
};
</script>

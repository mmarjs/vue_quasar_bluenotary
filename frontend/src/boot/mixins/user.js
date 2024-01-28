// import something here

// "async" is optional;
// more info on params: https://quasar.dev/quasar-cli/boot-files
import { mapGetters } from "vuex";

export default async ({ Vue }) => {
  Vue.mixin({
    computed: {
      ...mapGetters("auth", {
        $user: "user",
        $userType: "type",
        $authenticated: "authenticated",
        $resendVerifyEmail: "resendVerifyEmail",
        $onBoarding: "onBoarding",
        $role: "role",
      }),
      isNotary () {
        return this.$userType === "notary";
      },
      isAdmin () {
        return this.$userType === "admin";
      },
      isCustomer () {
        return this.$userType === "customer";
      },

    },
    methods: {
      signOut () {
        //   this.$q.dialog({
        //     title: "Confirm",
        //     message: "Are you sure you want to sign out?",
        //     cancel: true,
        //     persistent: true,
        //   }).onOk(() => {
        this.$auth.logout();
        localStorage.removeItem("resendVerifyEmail");
        this.setEmailStatus(false);
        this.$store.commit("auth/setUser", {});
        this.$store.commit("auth/setOnBoarding", false);
        this.$store.commit("auth/role", "guest");
        localStorage.removeItem("userRole");
        localStorage.removeItem("bnUser");
        // });
      },
      setEmailStatus (status) {
        this.$store.commit("auth/setVerifyEmailStatus", status);
      },
    },
  });
};

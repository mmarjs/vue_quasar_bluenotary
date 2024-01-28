const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    meta: {
      auth: false
    },
    children: [
      {
        path: "/",
        name: "landing",
        meta: { permissions: ["guest", "admin", "notary", "customer"] },
        component: () => import("pages/sign-in.vue")
      },
      {
        path: "sign-in",
        name: "sign-in",
        meta: { permissions: ["guest"] },
        component: () => import("pages/sign-in.vue")
      },
      {
        path: "sign-up",
        name: "sign-up",
        meta: { permissions: ["guest"] },
        component: () => import("pages/sign-up.vue")
      },
      {
        path: "verified",
        name: "verified",
        meta: { permissions: ["guest"] },
        component: () => import("pages/verified.vue")
      },
      {
        path: "notary/register",
        name: "notary_register",
        meta: { permissions: ["guest"] },
        component: () => import("@/pages/notary/notarySignUp.vue")
      }, {
        path: "business/register",
        name: "register",
        meta: { permissions: ["guest"] },
        component: () => import("@/pages/customer/customerSignUp.vue")
      },
      {
        path: "forgot-password",
        name: "forgot",
        meta: { permissions: ["guest"] },
        component: () => import("@/pages/forgot-password.vue")
      },
      {
        path: "resend-verify-email",
        name: "resend-verify-email",
        meta: { permissions: ["guest"] },
        component: () => import("@/pages/resend-verify-email.vue")
      },
      {
        path: "reset-password/:id",
        name: "reset",
        meta: { permissions: ["guest"] },
        component: () => import("@/pages/reset-password.vue")
      },
    ]
  }, {
    path: "/sign/",
    component: () => import("layouts/AuthLayout.vue"),
    meta: {
      auth: true
    },
    children: [
      {
        path: "dashboard",
        name: "sign_dashboard",
        meta: { permissions: "guest" },
        component: () => import("pages/dash/dashboard.vue")
      },
    ],
  },
  {
    path: "/auth/",
    component: () => import("layouts/AuthLayout.vue"),
    meta: {
      auth: true
    },
    children: [
      {
        path: "dashboard",
        name: "dashboard",
        meta: { permissions: ["admin", "notary", "customer", "guest", "witness"] },
        component: () => import("pages/dashboard.vue")
      },
      {
        path: "change-password",
        meta: { permissions: ["admin", "notary", "customer"] },
        component: () => import("pages/auth/change-password.vue")
      },
      {
        path: "account",
        meta: { permissions: ["admin", "notary", "customer"] },
        component: () => import("pages/auth/account.vue")
      }
    ]
  },
  {
    path: "/notary/",
    component: () => import("layouts/NotaryLayout.vue"),
    meta: {
      auth: true
    },
    children: [
      {
        path: "/",
        name: "notary_dashboard",
        meta: { permissions: ["notary"] },
        component: () => import("@/pages/notary/dashboard.vue")
      },
      {
        path: "invite",
        name: "invite",
        meta: { permissions: ["notary"], checkIfApproved: true },
        component: () => import("@/pages/notary/inviteSigner.vue")
      },
      {
        path: "upgrade/success",
        name: "upgrade/success",
        meta: { permissions: ["notary"] },
        component: () => import("@/pages/notary/upgradeSuccess.vue")
      },
      {
        path: "my-sessions",
        name: "my_sessions",
        meta: { permissions: ["notary"], checkIfApproved: true },
        component: () => import("@/pages/notary/mySessions.vue")
      },
      {
        path: "dashboard",
        name: "notaryDashboard",
        meta: { permissions: ["notary"] },
        component: () => import("@/pages/notary/dashboard.vue")
      },
      {
        path: "account-settings",
        name: "account_settings",
        meta: { permissions: ["notary"] },
        component: () => import("@/pages/notary/account/settings.vue")
      },
      {
        path: "account",
        meta: { permissions: ["notary"] },
        component: () => import("pages/auth/account.vue")
      },
      {
        path: "prepare_doc",
        name: "notary_prepare_doc",
        meta: { permissions: ["notary"] },
        component: () => import("@/pages/notary/prepareDoc.vue")
      },
      {
        path: "payment_info",
        name: "notary_payment_info",
        meta: { permissions: ["notary"] },
        component: () => import("@/pages/notary/paymentInfo.vue")
      },
      {
        path: "meet_notary",
        name: "notary_meet_notary",
        meta: { permissions: ["notary"] },
        component: () => import("@/pages/notary/meetNotary.vue")
      },
      {
        path: "templates",
        name: "notary_document_templates",
        meta: { permissions: ["notary"] },
        component: () => import("@/pages/notary/documentTemplate.vue")
      },
      {
        path: "templates/upload",
        name: "template_upload",
        meta: { permissions: ["notary"] },
        component: () => import("@/pages/notary/templateUpload.vue")
      }
    ]
  },
  {
    path: "/admin/",
    component: () => import("layouts/AdminLayout.vue"),
    meta: {
      auth: true
    },
    children: [
      {
        path: "/",
        name: "manage_customers",
        meta: { permissions: ["admin"] },
        component: () => import("@/pages/admin/customers/manage.vue")
      },
      {
        path: "/notaries",
        name: "manage_notaries",
        meta: { permissions: ["admin"] },
        component: () => import("@/pages/admin/notary/manage.vue")
      },
      {
        path: "/customers",
        name: "manage_customers",
        meta: { permissions: ["admin"] },
        component: () => import("@/pages/admin/customers/manage.vue")
      },
      {
        path: "/users-sessions",
        name: "manage_sessions",
        meta: { permissions: ["admin"] },
        component: () => import("@/pages/admin/sessions/manage.vue")
      }
    ]
  },
  {
    path: "/witness/",
    component: () => import("layouts/CustomerLayout.vue"),
    meta: {
      auth: true
    },
    children: [
      {
        path: "/",
        name: "witness_landing",
        meta: { permissions: ["witness"] },
        component: () => import("@/pages/dashboard.vue")
      }
    ]
  },
  {
    path: "/business/",
    component: () => import("layouts/CustomerLayout.vue"),
    meta: {
      auth: true
    },
    children: [
      {
        path: "/",
        name: "sessions_list",
        meta: { permissions: ["customer"] },
        component: () => import("@/pages/dashboard.vue")
      }, {
        path: "sessions",
        name: "business_sessions",
        meta: { permissions: ["customer"] },
        component: () => import("@/pages/dashboard.vue")
      },
      {
        path: "dashboard",
        name: "dashboard_sessions",
        meta: { permissions: ["customer"] },
        component: () => import("pages/dashboard.vue")
      },
      {
        path: "payment_info/:id",
        name: "payment_info",
        meta: { permissions: ["customer"] },
        component: () => import("@/pages/customer/paymentInfo.vue")
      },
      {
        path: "account",
        meta: { permissions: ["customer"] },
        component: () => import("pages/auth/account.vue")
      },
      {
        path: "account-settings",
        meta: { permissions: ["customer"] },
        component: () => import("@/pages/customer/settings.vue")
      },
      {
        path: "prepare_doc/:id?",
        name: "prepare_doc",
        meta: { permissions: ["customer"], checkInvalidSession: true },
        component: () => import("@/pages/customer/prepareDoc.vue")
      },
      {
        path: "personal_info/:id",
        name: "personal_info",
        meta: { permissions: ["customer"], checkInvalidSession: true },
        component: () => import("@/pages/customer/personalDetails.vue")
      },
      {
        path: "kba/:id",
        name: "kba",
        meta: { permissions: ["customer"], checkInvalidSession: true },
        component: () => import("@/pages/customer/kba.vue"),
      },
      {
        path: "photoid/:id",
        name: "photoid",
        meta: { permissions: ["customer"], checkInvalidSession: true },
        component: () => import("@/pages/customer/photoid.vue")
      },
      {
        path: "meet_notary/:id",
        name: "meet_notary",
        meta: { permissions: ["customer"], checkInvalidSession: true },
        component: () => import("@/pages/customer/meetNotary.vue")
      }
    ]
  },
  {
    path: "/pdf_edit/",
    component: () => import("layouts/MainLayout.vue"),
    meta: {
      auth: true
    },
    children: [
      {
        path: "sessions",
        name: "sessions",
        meta: { permissions: ["notary", "customer", "witness"] },
        component: () => import("@/pages/pdfedit/PdfEditingComponent.vue")
      },
      {
        path: "sessions/:id",
        name: "sessionsId",
        meta: { permissions: ["notary", "customer", "witness"] },
        component: () => import("@/pages/pdfedit/PdfEditingComponent.vue")
      }
    ]
  },
  {
    path: "*",
    component: () => import("pages/error404.vue")
  }
];

export default routes;

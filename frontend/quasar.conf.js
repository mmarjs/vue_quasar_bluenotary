const path = require("path");

module.exports = function (/* ctx */) {
  return {
    supportTS: false,
    preFetch: true,
    boot: [
      "axios",
      "vuelidate",
      "vue-auth",
      "prepare-store",
      "mixins/user",
      "composition-api",
      "sanitize-html",
      "constants",
      "moment",
      "filters",
      "vue-awesome-swiper",
      "local-components"
    ],
    css: ["app.scss"],
    extras: [
      // 'ionicons-v4',
      // 'mdi-v5',
      "fontawesome-v5",
      // 'eva-icons',
      // 'themify',
      // 'line-awesome',
      // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!
      "roboto-font", // optional, you are not bound to it
      "material-icons" // optional, you are not bound to it
    ],
    build: {
      vueRouterMode: "history", // available values: 'hash', 'history'
      // transpile: false,
      // transpileDependencies: [],
      // rtl: false, // https://quasar.dev/options/rtl-support
      // preloadChunks: true,
      // showProgress: false,
      gzip: true,
      // analyze: true,
      // extractCSS: false,
      extendWebpack (cfg) {
        cfg.module.rules.push({
          enforce: "pre",
          test: /\.(js|vue)$/,
          loader: "eslint-loader",
          exclude: /node_modules/
        });
        cfg.resolve.alias = {
          ...cfg.resolve.alias, // This adds the existing alias
          "@": path.resolve(__dirname, "./src")
        };
      }
    },
    devServer: {
      https: false,
      port: 8080,
      open: false // opens browser window automatically
    },

    framework: {
      iconSet: "material-icons", // Quasar icon set
      lang: "en-us", // Quasar language pack
      config: {},
      importStrategy: "auto",
      // components: [],
      // directives: [],
      plugins: ["Notify", "Dialog", "LocalStorage"]
    },

    // animations: 'all', // --- includes all animations
    animations: [],
    ssr: {
      pwa: false
    },
    pwa: {
      workboxPluginMode: "GenerateSW", // 'GenerateSW' or 'InjectManifest'
      workboxOptions: {}, // only for GenerateSW
      manifest: {
        name: "bluenotary",
        short_name: "bluenotary",
        description: "bluenotary",
        display: "standalone",
        orientation: "portrait",
        background_color: "#ffffff",
        theme_color: "#027be3",
        icons: [
          {
            src: "icons/icon-128x128.png",
            sizes: "128x128",
            type: "image/png"
          },
          {
            src: "icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "icons/icon-256x256.png",
            sizes: "256x256",
            type: "image/png"
          },
          {
            src: "icons/icon-384x384.png",
            sizes: "384x384",
            type: "image/png"
          },
          {
            src: "icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    },

    cordova: {},

    capacitor: {
      hideSplashscreen: true
    },
    electron: {
      bundler: "packager", // 'packager' or 'builder'

      packager: {
        // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options
        // OS X / Mac App Store
        // appBundleId: '',
        // appCategoryType: '',
        // osxSign: '',
        // protocol: 'myapp://path',
        // Windows only
        // win32metadata: { ... }
      },

      builder: {
        appId: "bluenotary"
      },
      nodeIntegration: true,

      extendWebpack (/* cfg */) { }
    }
  };
};

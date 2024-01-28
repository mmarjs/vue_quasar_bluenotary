<template>
  <div class="flex flex-center row q-ma-lg">
    <div class="col-md-3">
      <q-card v-for="(item, key) of sessionData" :key="key" class="my-card">
        <q-card-section>
          <div class="text-h6">Session {{ item.shotId }}</div>
          <div class="text-subtitle2 text-red">Incomplete</div>
        </q-card-section>
        <q-card-section>
          <ul>
            <li v-for="(item1, key1) of item.files" :key="key1">
              {{ item1.filename }} was uploaded
            </li>
          </ul>
        </q-card-section>
        <q-card-section>
          <div v-if="item.paymentData" style="margin-left: 30px">
            Payment Installed
          </div>
          <div v-else style="margin-left: 30px">Payment not installed</div>
        </q-card-section>
        <q-card-section>
          <div v-if="item.videoData" style="margin-left: 30px">
            Video is Done
          </div>
          <div v-else style="margin-left: 30px">Video is not Done</div>
        </q-card-section>
        <q-separator dark />
        <q-card-actions>
          <q-btn flat @click="continueSession(item)"> Continue </q-btn>
          <q-btn flat @click="deleteSession(item)"> Delete </q-btn>
        </q-card-actions>
      </q-card>
    </div>
  </div>
</template>

<script>
import { ref } from "@vue/composition-api";
import { $axios } from "boot/axios";

export default {
  name: "Sessions",
  watch: {

  },
  async mounted () {
    const sessionData = await this.loadSessionData();
    this.sessionData = sessionData;
  },
  setup (_, context) {
    const {
      root: { $router, $q }
    } = context;
    const loading = ref(false);
    const sessionData = ref([]);
    const loadSessionData = async () => {
      try {
        const url = "session/load/sessiondata";
        const response = await $axios.post(url, {}, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        return response.data;
      } catch (error) {
        return error;
      }
    };
    const deleteSessionItem = async (item) => {
      try {
        const url = "session/delete";
        const response = await $axios.post(url, { sessionId: item }, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log("loadSessionData", response.data);
        sessionData.value = response.data;
      } catch (error) {
        console.log(error);
      }
    };
    const continueSession = async (item) => {
      $q.localStorage.set("sessionData", item.sessionId);
      $router.replace("/business/prepare_doc");
    };
    const deleteSession = async (item) => {
      await deleteSessionItem(item.sessionId);
      this.sessionData = await this.loadSessionData();
    };
    return {
      loading, loadSessionData, sessionData, continueSession, deleteSession, deleteSessionItem
    };
  },
  methods: {
    async nextButtonClick () {
      return "";
    }
  }
};
</script>

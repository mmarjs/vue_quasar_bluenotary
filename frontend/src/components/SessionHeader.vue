<template>
  <h1 class="q-my-sm">
    Notarization Session {{ sessionId.substr(sessionId.length - 5).toUpperCase() }}
  </h1>
</template>
<script>
export default {
    props: {
        sessionId: {
            type: String,
            default() {
                return "";
            },
        },
    },
};
</script>

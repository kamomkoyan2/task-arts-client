<script setup>
import { RouterLink, RouterView } from "vue-router";
import { ref } from "vue";

const isAlive = ref({
  isRouterAlive: true,
});

function reload() {
  this.isRouterAlive = false;
  this.$nextTick(() => (this.isRouterAlive = true));
}
</script>

<template>
  <div class="flex flex-col min-h-screen justify-center">
    <router-view v-if="isAlive.isRouterAlive"></router-view>
  </div>
</template>

<style lang="scss"></style>

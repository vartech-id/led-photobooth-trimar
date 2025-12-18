<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

const status = ref("checking");
const assetPath = ref("");
const assetUrl = ref("");
const errorMessage = ref("");

const isLaunching = ref(false);
const launchMessage = ref("");
const launchError = ref("");

let pollHandle = null;
const UPDATE_INTERVAL = 5000;

const clearPolling = () => {
  if (pollHandle) {
    clearInterval(pollHandle);
    pollHandle = null;
  }
};

const fetchLatestState = async () => {
  try {
    const response = await fetch(`${apiBaseUrl}/session/status`, {
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        payload?.detail || `Status request failed with ${response.status}`;
      throw new Error(message);
    }

    const state = payload?.state ?? {};
    status.value = state?.status ?? "idle";
    assetPath.value = state?.asset_path ?? "";

    const rawAssetUrl = state?.asset_url ?? "";
    if (rawAssetUrl) {
      try {
        assetUrl.value = new URL(rawAssetUrl, apiBaseUrl).href;
      } catch (error) {
        assetUrl.value = rawAssetUrl;
      }
    } else {
      assetUrl.value = "";
    }

    errorMessage.value = "";
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Unable to load session status.";
  }
};

const startPolling = () => {
  if (!pollHandle) {
    pollHandle = setInterval(fetchLatestState, UPDATE_INTERVAL);
  }
};

const handleHome = () => {
  router.push({ name: "WelcomeScreen" });
};

const handleLaunch = async () => {
  if (isLaunching.value) return;
  launchError.value = "";
  launchMessage.value = "";

  const body = {
    asset_path: assetPath.value || null,
  };

  if (!body.asset_path) {
    launchError.value = "Photo is not ready to send.";
    return;
  }

  isLaunching.value = true;
  try {
    const response = await fetch(`${apiBaseUrl}/api/photos/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        payload?.detail || `Failed to send photo (${response.status})`;
      throw new Error(message);
    }

    const slot = payload?.assignedSlot ?? payload?.slot;
    const version = payload?.version;
    const slotCopy = slot ? `slot ${slot}` : "LED display";
    const versionCopy = version ? ` (v${version})` : "";
    launchMessage.value = `Photo sent to ${slotCopy}${versionCopy}.`;
  } catch (error) {
    launchError.value =
      error instanceof Error ? error.message : "Failed to send photo.";
  } finally {
    isLaunching.value = false;
  }
};

const handleFinish = async () => {
  await handleLaunch();
  if (!launchError.value) {
    handleHome();
  }
};

onMounted(() => {
  fetchLatestState();
  startPolling();
});

onBeforeUnmount(() => {
  clearPolling();
});
</script>

<template>
  <main class="preview-wrapper">
    <section class="image-result-wrapper">
      <!-- <p>Status sesi: {{ status }}</p>
      <p v-if="errorMessage">Error: {{ errorMessage }}</p>
      <p v-if="assetPath">File: {{ assetPath }}</p> -->
      <img v-if="assetUrl" :src="assetUrl" alt="Preview foto" />
    </section>

    <section class="launch-button-wrapper">
      <button type="button" :disabled="isLaunching" @click="handleFinish">
        {{ isLaunching ? "Mengirim..." : "Luncurkan Foto ke LED" }}
      </button>
      <p v-if="launchMessage">{{ launchMessage }}</p>
      <p v-if="launchError">Error: {{ launchError }}</p>
    </section>
  </main>
</template>
<style scoped>
.preview-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgb(255, 0, 0);
}

.image-result-wrapper {
  background-color: aqua;
  display: flex;
  justify-content: center;
}

img {
  width: 60%;
}

.launch-button-wrapper{
  padding-top: 3em;
}

button{
  align-self: center;
  width: 100%;
  height: 130px;
  padding: 0.75rem 2.5rem;
  border-radius: 999px;
  border: none;
  font-size: 60px;
  cursor: pointer;
  background: #13235e;
  color: #fff;
  transition: transform 120ms ease;
}
</style>

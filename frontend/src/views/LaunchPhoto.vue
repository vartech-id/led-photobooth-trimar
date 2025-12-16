<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

const status = ref("checking");
const assetPath = ref("");
const assetUrl = ref("");
const shareUrl = ref("");
const completedAt = ref("");
const errorMessage = ref("");

// Timer for periodic updates
let updateTimer = null;
const UPDATE_INTERVAL = 5000; // 5 seconds

const hasAsset = computed(() => Boolean(assetUrl.value || assetPath.value));

const assetHint = computed(() => (!assetUrl.value ? assetPath.value : ""));

// Clear any existing timer
const clearUpdateTimer = () => {
  if (updateTimer) {
    clearTimeout(updateTimer);
    updateTimer = null;
  }
};

const fetchLatestState = async () => {
  try {
    const response = await fetch(`${apiBaseUrl}/session/status`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Status request failed with ${response.status}`);
    }

    const payload = await response.json();
    const state = payload?.state ?? {};
    status.value = state?.status ?? "idle";
    assetPath.value = state?.asset_path ?? "";
    shareUrl.value = state?.share_url ?? "";

    const rawAssetUrl = state?.asset_url ?? "";
    if (rawAssetUrl) {
      try {
        assetUrl.value = new URL(rawAssetUrl, apiBaseUrl).href;
      } catch (error) {
        console.error("Failed to resolve asset URL", error);
        assetUrl.value = rawAssetUrl;
      }
    } else {
      assetUrl.value = "";
    }
    completedAt.value = state?.completed_at ?? "";
    errorMessage.value = "";

    if (status.value === "completed") {
      // Stop polling when completed
      clearUpdateTimer();
      return;
    }

    if (status.value === "in_progress") {
      router.replace({ name: "photo-session" });
    } else {
      router.replace({ name: "home" });
    }
  } catch (error) {
    console.error(error);
    errorMessage.value = "Unable to load the photo session result.";

    // Stop polling on error
    clearUpdateTimer();
  }
};

// Schedule next update
const scheduleNextUpdate = () => {
  clearUpdateTimer();
  updateTimer = setTimeout(() => {
    fetchLatestState();
  }, UPDATE_INTERVAL);
};

const handleHome = () => {
  router.push({ name: "WelcomeScreen" });
};

const handleLaunch = () => {};

const handleFinish = () => {
  handleLaunch();
  handleHome();
};

onMounted(() => {
  fetchLatestState();
  // Start periodic updates
  scheduleNextUpdate();
});

onBeforeUnmount(() => {
  // Clean up timer when component is destroyed
  clearUpdateTimer();
});
</script>

<template>
  <main class="result-screen">
    <section class="preview-card">
      <div class="image-frame" :class="{ empty: !assetUrl }">
        <img
          v-if="assetUrl"
          :src="assetUrl"
          alt="Latest photo booth capture"
          class="result-image"
        />
        <div v-else class="placeholder">
          <h1 v-if="hasAsset">Photo ready!</h1>
          <h1 v-else>Awaiting final image...</h1>
          <p v-if="assetHint">Saved at: {{ assetHint }}</p>
          <p v-else>
            Once DSLRBooth exports the photo we will show a preview here.
          </p>
        </div>
      </div>
    </section>

    <section class="actions">
      <button class="launch-btn" @click="handleFinish">
        Luncurkan Foto ke LED
      </button>
    </section>
  </main>
</template>

<style scoped>
.result-screen {
  width: 100vw;
  height: 100vh;
  padding: clamp(2rem, 4vw, 3rem);
  /* background: radial-gradient(circle at center, rgba(0, 180, 255, 0.18), rgba(0, 0, 0, 0.92)); */
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(2rem, 5vw, 3rem);
  text-align: center;
  transform: translate(0px, -30px);
}

.preview-card {
  max-width: 960px;
  width: 100%;
  border-radius: 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-frame {
  width: min(100%, 900px);
  aspect-ratio: 3 / 4;
  border-radius: 28px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.timestamp {
  margin: 0;
  font-size: clamp(1rem, 2vw, 1.4rem);
  opacity: 0.7;
}

.actions {
  display: flex;
  gap: 40px;
  transform: translate(0px, 90px);
}

.launch-btn {
  border-radius: 60px;
  font-size: 50px;
  width: 549px;
  height: 130px;
  border: none;
  background: #e60000;
  color: #fff;
}
</style>

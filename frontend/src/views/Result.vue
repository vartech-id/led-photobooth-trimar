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
const isRestarting = ref(false);
const isQrModalOpen = ref(false);

// Timer for periodic updates
let updateTimer = null;
const UPDATE_INTERVAL = 5000; // 5 seconds

const hasAsset = computed(() => Boolean(assetUrl.value || assetPath.value));
const hasShareLink = computed(() => Boolean(shareUrl.value));

const assetHint = computed(() => (!assetUrl.value ? assetPath.value : ""));
const qrImageSrc = computed(() =>
  shareUrl.value
    ? `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(
        shareUrl.value
      )}`
    : ""
);

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

const retakeSession = async () => {
  if (isRestarting.value) return;
  isRestarting.value = true;
  errorMessage.value = "";
  try {
    const resetResponse = await fetch(`${apiBaseUrl}/session/reset`, {
      method: "POST",
    });
    if (!resetResponse.ok) {
      throw new Error("Failed to reset the session.");
    }

    const startResponse = await fetch(`${apiBaseUrl}/session/start`, {
      method: "POST",
    });
    if (!startResponse.ok) {
      const payload = await startResponse.json().catch(() => ({}));
      throw new Error(payload?.message || "Failed to start a new session.");
    }
    shareUrl.value = "";
    isQrModalOpen.value = false;
    router.replace({ name: "WaitingPhoto" });
  } catch (error) {
    console.error(error);
    errorMessage.value =
      error instanceof Error && error.message
        ? error.message
        : "Unable to restart the photo booth.";
  } finally {
    isRestarting.value = false;
  }
};

const openQrModal = () => {
  if (!hasShareLink.value) return;
  isQrModalOpen.value = true;
};

const closeQrModal = () => {
  isQrModalOpen.value = false;
};

const handleNext = () => {
  router.push({ name: "LaunchPhoto" });
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
      <!-- <p v-if="completedAt" class="timestamp">Captured at {{ completedAt }}</p> -->
      <p class="cetak-caption">Foto berhasil diambil</p>
    </section>

    <section class="actions">
      <button
        type="button"
        class="retake-btn putih-semua"
        :disabled="isRestarting"
        @click="retakeSession"
      >
        <span v-if="isRestarting">Starting...</span>
        <span v-else>Ulangi</span>
      </button>
      <button
        v-if="hasShareLink"
        type="button"
        class="downloads-btn merah-semua"
        @click="openQrModal"
      >
        Download Foto
      </button>
    </section>

    <teleport to="body">
      <div
        v-if="isQrModalOpen"
        class="qr-modal-backdrop"
        role="presentation"
        @click="closeQrModal"
      >
        <div class="qr-modal" role="dialog" aria-modal="true" @click.stop>
          <div class="modal-title-action">
            <h2>
              Download via
              <br />
              QR code
            </h2>
            <button class="qr-close" @click="closeQrModal">x</button>
          </div>
          <div class="qr-wrapper">
            <div class="border-box-qr">
              <img
                v-if="qrImageSrc"
                :src="qrImageSrc"
                alt="Share via QR code"
                class="qr-image"
              />
              <p v-else class="qr-placeholder">Share link not ready yet.</p>
            </div>
          </div>
          <!-- <p v-if="shareUrl" class="share-link">{{ shareUrl }}</p> -->
          <button type="button" class="next merah-semua" @click="handleNext">
            Next
          </button>
        </div>
      </div>
    </teleport>

    <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>
  </main>
</template>

<style scoped>

.result-screen {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background-image: url(../assets/bg-2.png);
}

.preview-card {
  max-width: 960px;
  width: 100%;
  border-radius: 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 8em;
}

.image-frame {
  width: min(100%, 600px);
  aspect-ratio: 1 / 2;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-frame.empty {
  border-style: dashed;
}

.result-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.placeholder {
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  color: rgba(255, 255, 255, 0.85);
}

.placeholder h1 {
  font-size: clamp(2.4rem, 5vw, 3.4rem);
  margin: 0;
}

.placeholder p {
  font-size: clamp(1.1rem, 2.5vw, 1.6rem);
  margin: 0;
  opacity: 0.85;
}

.timestamp {
  margin: 0;
  font-size: clamp(1rem, 2vw, 1.4rem);
  opacity: 0.7;
}

.cetak-caption {
  font-family: "Poppins", sans-serif;
  font-weight: 600;
  font-style: normal;
  font-size: 4.5em;
  line-height: 100%;
  letter-spacing: 0%;
  text-align: center;
  position: relative;
  color: #ffffff;
  padding-top: 0.5em;
}

.actions {
  display: flex;
  gap: 40px;
  padding-top: 3em;
}

.retake-btn {
  border-radius: 60px;
  font-size: 60px;
  width: 334px;
  height: 130px;
  background: #ffff;
  color: #13235e;
  border: 5px solid #13235e;
}

.downloads-btn {
  border-radius: 60px;
  font-size: 60px;
  width: 549px;
  height: 130px;
  border: none;
  background: #13235e;
  color: #fff;
  border: 2px solid white;
  transition: transform 1ms ease
}

.downloads-btn:active{
  transform: translateY(10px);
}

.home-btn {
  border-radius: 60px;
  font-size: 60px;
  width: 334px;
  height: 130px;
  background: none;
  border: none;
  color: black;
  position: relative;
  top: 90px;
}

.qr-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65); /*shadow */
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  z-index: 50;
}

.qr-modal {
  background: #ffffff;
  border-radius: 32px;
  padding: 100px 100px 100px;
  width: min(800px, 90vw);
  text-align: center;
  color: #fff;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.qr-modal h2 {
  font-size: 5em;
  font-weight: 700;
  font-family: "Poppins", sans-serif;
  font-style: normal;
  color: #13235e;
}

.qr-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  padding-bottom: 2em;
}

.border-box-qr {
  border: 2px solid #000000;
  padding: 20px;
}

.qr-image {
  width: 378px;
  height: 378px;
  display: block;
  border-radius: 16px;
  background: #fff;
  position: relative;
  padding: 30px;
}

.qr-placeholder {
  margin: 0;
  font-size: 1.2rem;
}

.share-link {
  margin: 0;
  font-size: clamp(1rem, 2.2vw, 1.3rem);
  word-break: break-all;
  opacity: 0.85;
  color: black;
}

.next {
  align-self: center;
  width: 115%;
  height: 130px;
  padding: 0.75rem 2.5rem;
  border-radius: 999px;
  font-size: 60px;
  cursor: pointer;
  background: #13235e;
  color: #fff;
  animation: pulse 1.4s ease-in-out infinite;
  transition: transform 1ms ease;
}

@keyframes pulse{
  0%, 100% { transform: scale(1);    filter: brightness(1); }
  50%      { transform: scale(1.06); filter: brightness(1.08); }
}

.next:active{
  animation: none;
  transform: scale(0.95);
  filter: brightness(0.92);
  transform: translateY(20px);
}

.error-banner {
  margin: 0;
  font-size: clamp(1.1rem, 2.4vw, 1.6rem);
  color: #ff97a8;
}

.qr-close {
  position: relative;
  left: 330px;
  bottom: 250px;
  background: #13235e;
  font-size: 30px;
  width: 40px;
  height: 40px;
  color: white;
  border: 1px solid #13235e;
  border-radius: 9999px;
  line-height: 1;
  padding-bottom: 0.2em;
}
</style>

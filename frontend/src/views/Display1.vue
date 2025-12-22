<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";

const slotNumber = 1;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const photoUrl = ref("");
const version = ref(0);
const status = ref("loading"); // loading | waiting | ready | error
const errorMessage = ref("");
const isFallback = ref(false);

const POLL_INTERVAL_MS = 2000;
let pollHandle = null;

const resolveUrl = (path, ver) => {
  if (!path) return "";
  try {
    const url = new URL(path, apiBaseUrl);
    if (ver) {
      url.searchParams.set("v", String(ver));
    }
    return url.href;
  } catch (error) {
    return ver ? `${path}?v=${ver}` : path;
  }
};

const preloadImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = (err) => reject(err);
    img.src = url;
  });

const tryStaticFallback = async () => {
  if (photoUrl.value) return;
  const exts = [".jpg", ".jpeg", ".png", ".webp"];
  const prefixes = ["/static/photos", "/photos"];
  for (const prefix of prefixes) {
    for (const ext of exts) {
      const candidate = resolveUrl(
        `${prefix}/Display${slotNumber}/foto-${slotNumber}${ext}`
      );
      const loaded = await preloadImage(candidate)
        .then(() => true)
        .catch(() => false);
      if (loaded) {
        photoUrl.value = candidate;
        version.value = 0;
        isFallback.value = true;
        status.value = "waiting";
        return;
      }
    }
  }
};

const fetchSlotState = async () => {
  try {
    const response = await fetch(`${apiBaseUrl}/api/slot/${slotNumber}`, {
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        payload?.detail || `Slot request failed with ${response.status}`;
      throw new Error(message);
    }

    const state = payload?.state ?? payload ?? {};
    const incomingVersion = Number(state?.version ?? 0);
    const baseUrl = state?.photoUrl || state?.photo_url || "";

    if (!baseUrl) {
      status.value = "waiting";
      await tryStaticFallback();
      return;
    }

    if (incomingVersion === version.value && photoUrl.value) {
      status.value = "ready";
      return;
    }

    const nextUrl = resolveUrl(baseUrl, incomingVersion);
    const loaded = await preloadImage(nextUrl)
      .then(() => true)
      .catch(() => false);
    if (!loaded) {
      errorMessage.value = "Photo not ready to display.";
      status.value = photoUrl.value ? "ready" : "waiting";
      return;
    }

    photoUrl.value = nextUrl;
    version.value = incomingVersion;
    isFallback.value = false;
    status.value = "ready";
    errorMessage.value = "";
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Slot fetch failed.";
    status.value = "error";
  }
};

const startPolling = () => {
  if (!pollHandle) {
    pollHandle = setInterval(fetchSlotState, POLL_INTERVAL_MS);
  }
};

const stopPolling = () => {
  if (pollHandle) {
    clearInterval(pollHandle);
    pollHandle = null;
  }
};

onMounted(() => {
  tryStaticFallback();
  fetchSlotState();
  startPolling();
});

onBeforeUnmount(() => {
  stopPolling();
});
</script>

<template>
  <main>
    <div class="display-frame">
      <h1 class="led-number">Display {{ slotNumber }}</h1>
      <p v-if="status === 'loading'">Loading slot...</p>
      <p v-else-if="status === 'error'">{{ errorMessage }}</p>
      <p class="fallback" v-if="status === 'waiting' && isFallback">
        Waiting for photo, this is fallback.
      </p>
      <p v-else-if="!photoUrl">Waiting for photo...</p>
      <img
        class="led-image"
        v-if="photoUrl"
        :src="photoUrl"
        :alt="`Slot ${slotNumber} photo`"
      />
      <p class="version">Version: {{ version }}</p>
    </div>
  </main>
</template>
<style>
.display-frame {
  position: fixed;
  inset: 0;
  margin: auto;
  aspect-ratio: 1 / 2;
  /* ini bikin frame selalu muat di monitor apa pun */
  width: min(100vw, calc(100vh / 2));
  height: auto;
}

.led-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover; /* rasio sama -> harusnya tidak kepotong */
  object-position: center;
}

.led-number {
  position: absolute;
  color: white;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  font-size: 10em;
}

.version, .fallback {
  position: absolute;
  color: white;
}


</style>

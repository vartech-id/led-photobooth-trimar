<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const isModalOpen = ref(false);
const modalError = ref("");
const isStartingSession = ref(false);

const openModal = () => {
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const confirmStart = async () => {
  if (isStartingSession.value) return;
  modalError.value = "";
  isStartingSession.value = true;
  try {
    const response = await fetch(`${apiBaseUrl}/session/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const fallbackMessage =
        "Failed to start the photo session. Please try again.";
      throw new Error(payload?.message || fallbackMessage);
    }

    isModalOpen.value = false;
    router.push({ name: "photo-session" });
  } catch (error) {
    console.error(error);
    modalError.value =
      error instanceof Error && error.message
        ? error.message
        : "Unexpected error starting session.";
  } finally {
    isStartingSession.value = false;
  }
};

const handleNext = () => router.push({ name: "WaitingPhoto" });
</script>
<template>
  <button @click="openModal">open modal</button>
  <div v-if="isModalOpen" class="overlay" @click.self="closeModal">
    <div class="modal">
      <h2>Mulai Foto</h2>
      <div class="actions">
        <button @click="closeModal">Batal</button>
        <button @click="confirmStart">Ya</button>
      </div>
    </div>
  </div>
</template>
<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 9999;
}
.modal {
  width: min(520px, 100%);
  background: white;
  border-radius: 12px;
  padding: 16px;
}
</style>

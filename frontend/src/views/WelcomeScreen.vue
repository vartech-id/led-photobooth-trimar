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

const onConfirmYes = async () => {
  await confirmStart();
  handleNext();
};
</script>
<template>
  <div class="page one">
    <button class="start-button" @click="openModal">Start Button</button>
    <div v-if="isModalOpen" class="overlay">
      <div class="modal">
        <h2>Mulai Foto</h2>
        <div class="modal-actions">
          <button class="modal-btn putih" @click="closeModal">Batal</button>
          <button class="modal-btn biru" @click="onConfirmYes">Ya</button>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>

.page{
  height: 100vh;
  background-color: aqua;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.start-button {
  font-size: 100px;
}

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
  background: #FFFFFF;
  border-radius: 32px;
  padding: clamp(2rem, 5vw, 3rem);
  text-align: center;
  color: #000000;
  min-width: min(50rem, 90vw);
  min-height: min(40rem, 90vw);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center
}

.modal h2 {
  font-size: 84px;
  margin: 0 0 6rem;
  font-weight: 700;
  font-family: "Poppins", sans-serif;
  font-style: normal;
  color:#13235E;
}

.modal-actions {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.modal-btn {
  min-width: 20rem;
  padding: 1rem 2.5rem;
  font-size: 60px;
  /* font-weight: 600; */
  /* border: none; */
  border-radius: 999px;
  cursor: pointer;
  transition: transform 150ms ease, box-shadow 150ms ease;
}

.putih{
  background-color: white;
  border: solid 3px #13235E;
  color: #13235E;
}

.biru{
  background-color: #13235E;
  border: solid 3px #13235E;
  color: #ffffff;
}


</style>

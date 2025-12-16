saya ingin membuat konsep 3-slot rotating buffer” (ring buffer) yang muternya: slot 1 → 2 → 3 → balik ke 1 lagi. dimana hasil foto akan akan ditampilkan di 3 led dengan urutan 
3 led yang nanti akan menampilkan foto pertama di led 1,2,3. jadi akan ada foto 1 tampil di led 1 dan foto berikutnya tampil di 2 dan berikutnya akan tampil di led 3, jika led 1 dan 2 dan 3 sudah terpenuhi nanti foto ke 4 akan mengganti foto 1 dan foto ke 5 akan mengganti foto ke 2 dan foto 6 akan mengganti foto ke 3 di tampilan lednya. jadi akan berlanjut terus seperti itu.

3 device masing-masing akses URL tetap
`/Display1`, `/Display2`, `/Display3`. Slotnya fixed: Display1=slot1, Display2=slot2, Display3=slot3.

---

## Logic flow (ring buffer 3 slot)

### State yang disimpan di backend

* `counter` (angka urutan foto masuk)
* `slot_state[1..3]` berisi:

  * `photoUrl`
  * `photoId`
  * `version` (naik tiap update) atau `updatedAt`

### Flow saat foto baru masuk

1. Foto baru masuk ke backend (upload / hasil capture / watcher folder).
2. Backend tentukan slot tujuan:

   * `slot = (counter % 3) + 1`
3. Backend replace slot itu:

   * `slot_state[slot] = foto_baru`
   * `slot_state[slot].version++`
4. `counter++`
5. (Opsional) broadcast event “slot updated” (kalau pakai websocket).
   Kalau tidak, device akan tahu lewat polling.

**Contoh urutan:**

* foto1 → slot1 → tampil di `/Display1`
* foto2 → slot2 → tampil di `/Display2`
* foto3 → slot3 → tampil di `/Display3`
* foto4 → slot1 (replace foto1) → `/Display1` update
* dst…

### Flow di device (Display Page)

Tiap device:

1. Load halaman `/Display1` (atau 2/3)
2. JS di page melakukan polling:

   * `/api/slot/1` tiap 1 detik (Display1)
3. Kalau `version` berubah → ganti gambar (fade/transition optional)

---

## Arsitektur (URL tetap per device)

### Komponen

1. **Device A (LED 1)**

   * Browser kiosk buka: `http://server/Display1`
2. **Device B (LED 2)**

   * buka: `http://server/Display2`
3. **Device C (LED 3)**

   * buka: `http://server/Display3`
4. **Backend Server**

   * Serve halaman Display1/2/3
   * API state slot
   * Endpoint menerima foto baru
   * Simpan state + mapping slot
5. **Storage foto**

   * local folder static (`/static/photos/...`) atau object storage
   * yang penting device bisa load URL-nya

---

## Flow arsitektur (diagram teks)

### 1) Device akses Display

```
[LED Device 1] ---> GET /Display1  ---> [Backend serve HTML+JS]
[LED Device 2] ---> GET /Display2  ---> [Backend serve HTML+JS]
[LED Device 3] ---> GET /Display3  ---> [Backend serve HTML+JS]
```

### 2) Polling state per slot (tiap device)

```
[Display1 JS] ---> GET /api/slot/1 ---> [Backend returns {photoUrl, version}]
[Display2 JS] ---> GET /api/slot/2 ---> [Backend returns {photoUrl, version}]
[Display3 JS] ---> GET /api/slot/3 ---> [Backend returns {photoUrl, version}]
```

### 3) Foto baru masuk dan mengganti slot

```
[Photo Producer] ---> POST /api/photos/new (photo)
                  -> Backend save file -> make photoUrl
                  -> slot = (counter % 3)+1
                  -> slot_state[slot] = photoUrl; version++
                  -> counter++
```

Device akan update otomatis pada polling berikutnya.

---

## Endpoint minimal yang kamu butuh

### Halaman display (static route)

* `GET /Display1`
* `GET /Display2`
* `GET /Display3`

### API state slot (dibaca device)

* `GET /api/slot/1`
* `GET /api/slot/2`
* `GET /api/slot/3`

Response contoh:

```json
{
  "slot": 1,
  "photoUrl": "/static/photos/20251216_001.jpg",
  "version": 17
}
```

### API foto baru (dari photobooth / uploader)

* `POST /api/photos/new`

  * body: file upload / atau url hasil capture

Response contoh:

```json
{
  "assignedSlot": 2,
  "photoUrl": "/static/photos/20251216_002.jpg"
}
```

---
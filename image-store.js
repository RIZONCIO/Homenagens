/* =========================================================
   ImageStore — compressao + WebP + IndexedDB para fotos
   ========================================================= */
(function () {
  const DB_NAME = "homenagem_images_v1";
  const DB_VERSION = 1;
  const STORE_NAME = "images";
  const MAX_SIZE = 1200;
  const WEBP_QUALITY = 0.75;
  const objectUrls = new Map();

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function withStore(mode, callback) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      const result = callback(store);
      tx.oncomplete = () => {
        db.close();
        resolve(result);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  function requestToPromise(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function makeId() {
    if (crypto?.randomUUID) return crypto.randomUUID();
    return `img_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function getTargetSize(width, height) {
    const scale = Math.min(1, MAX_SIZE / Math.max(width, height));
    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale)),
    };
  }

  async function fileToImage(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao converter imagem para WebP."))),
        "image/webp",
        WEBP_QUALITY,
      );
    });
  }

  async function compressToWebP(file) {
    const img = await fileToImage(file);
    const size = getTargetSize(img.naturalWidth || img.width, img.naturalHeight || img.height);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d", { alpha: true });
    ctx.drawImage(img, 0, 0, size.width, size.height);
    const blob = await canvasToBlob(canvas);
    return {
      blob,
      width: size.width,
      height: size.height,
      originalName: file.name,
      originalType: file.type,
      originalSize: file.size,
      size: blob.size,
      type: "image/webp",
    };
  }

  async function saveBlob(blob, meta = {}) {
    const id = meta.id || makeId();
    const record = {
      ...meta,
      id,
      blob,
      type: blob.type || "image/webp",
      size: blob.size,
      updatedAt: Date.now(),
    };
    await withStore("readwrite", (store) => store.put(record));
    return record;
  }

  async function processFile(file) {
    const compressed = await compressToWebP(file);
    const record = await saveBlob(compressed.blob, compressed);
    return {
      imageId: record.id,
      src: "",
      width: record.width,
      height: record.height,
      size: record.size,
      type: record.type,
      originalSize: compressed.originalSize,
    };
  }

  async function getRecord(id) {
    if (!id) return null;
    return withStore("readonly", (store) => requestToPromise(store.get(id)));
  }

  async function getObjectUrl(id) {
    if (!id) return "";
    if (objectUrls.has(id)) return objectUrls.get(id);
    const record = await getRecord(id);
    if (!record?.blob) return "";
    const url = URL.createObjectURL(record.blob);
    objectUrls.set(id, url);
    return url;
  }

  async function deleteImage(id) {
    if (!id) return;
    const url = objectUrls.get(id);
    if (url) URL.revokeObjectURL(url);
    objectUrls.delete(id);
    await withStore("readwrite", (store) => store.delete(id));
  }

  async function clear() {
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
    objectUrls.clear();
    await withStore("readwrite", (store) => store.clear());
  }

  async function hydrateElement(el, imageId, cssTarget) {
    const url = await getObjectUrl(imageId);
    if (!url) return "";
    if (el) el.src = url;
    if (cssTarget) cssTarget.style.setProperty("--img", `url('${url}')`);
    if (cssTarget) cssTarget.style.backgroundImage = `url('${url}')`;
    return url;
  }

  function cleanSlideForStorage(slide) {
    const out = { ...slide };
    delete out.previewUrl;
    delete out.objectUrl;
    if (out.src?.startsWith("blob:")) out.src = "";
    return out;
  }

  window.ImageStore = {
    MAX_SIZE,
    WEBP_QUALITY,
    processFile,
    saveBlob,
    getRecord,
    getObjectUrl,
    deleteImage,
    clear,
    hydrateElement,
    cleanSlideForStorage,
  };
})();

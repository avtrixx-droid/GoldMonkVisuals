const ADMIN_SESSION_KEY = "goldmonkvisuals_admin_session";

const adminState = {
  content: null,
  media: null,
  projectRootHandle: null,
  uploads: {
    aboutPortrait: null
  }
};

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  return response.json();
}

function setStatus(message, tone = "neutral") {
  const status = document.querySelector("[data-admin-status]");

  if (!status) {
    return;
  }

  status.textContent = message;
  status.dataset.tone = tone;
}

function getByPath(target, path) {
  return path.split(".").reduce((value, segment) => value?.[segment], target);
}

function setByPath(target, path, nextValue) {
  const segments = path.split(".");
  const lastSegment = segments.pop();
  const parent = segments.reduce((value, segment) => {
    if (!value[segment]) {
      value[segment] = {};
    }
    return value[segment];
  }, target);

  parent[lastSegment] = nextValue;
}

function slugifyFileName(fileName) {
  const safeName = fileName.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-");
  return safeName.replace(/-+/g, "-");
}

function createMediaItem(src, alt, directory, file = null) {
  return {
    src,
    alt,
    directory,
    file,
    previewSrc: file ? URL.createObjectURL(file) : src
  };
}

function ensureAuthenticated() {
  const login = document.querySelector("[data-admin-login]");
  const app = document.querySelector("[data-admin-app]");
  const authenticated = sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";

  if (login) {
    login.hidden = authenticated;
    login.style.display = authenticated ? "none" : "";
  }

  if (app) {
    app.hidden = !authenticated;
    app.style.display = authenticated ? "" : "none";
  }
}

function bindLogin() {
  const form = document.querySelector("[data-admin-auth-form]");
  const message = document.querySelector("[data-admin-auth-message]");

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const id = String(formData.get("adminId") || "");
    const password = String(formData.get("password") || "");

    if (id === window.ADMIN_AUTH?.id && password === window.ADMIN_AUTH?.password) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      message.textContent = "";
      ensureAuthenticated();
      void loadAdminData();
      return;
    }

    message.textContent = "Incorrect admin ID or password.";
  });

  document.querySelector("[data-logout-admin]")?.addEventListener("click", () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    ensureAuthenticated();
  });
}

function renderFields() {
  document.querySelectorAll("[data-field]").forEach((input) => {
    input.value = getByPath(adminState.content, input.dataset.field) || "";
  });

  document.querySelectorAll("[data-field-textarea]").forEach((input) => {
    const values = getByPath(adminState.content, input.dataset.fieldTextarea);
    input.value = Array.isArray(values) ? values.join("\n\n") : "";
  });
}

function renderMediaList(kind) {
  const target = document.querySelector(`[data-media-list="${kind}"]`);
  const items = adminState.media?.[kind] || [];

  if (!target) {
    return;
  }

  target.innerHTML = items.map((item, index) => `
    <article class="admin-media-item">
      <img src="${item.previewSrc}" alt="${item.alt || "Media preview"}">
      <div class="admin-media-copy">
        <label class="form-field">
          <span>Image Alt Text</span>
          <input type="text" data-media-alt="${kind}:${index}" value="${item.alt || ""}">
        </label>
        <p class="admin-subtle admin-media-path">${item.file ? `New file: ${item.file.name}` : item.src}</p>
        <div class="admin-inline-actions">
          <button class="button button-soft" type="button" data-move-up="${kind}:${index}">Move Up</button>
          <button class="button button-soft" type="button" data-move-down="${kind}:${index}">Move Down</button>
          <button class="button button-soft" type="button" data-remove-media="${kind}:${index}">Remove</button>
        </div>
      </div>
    </article>
  `).join("");
}

function renderAllMedia() {
  renderMediaList("slider");
  renderMediaList("footer");
}

function bindFieldUpdates() {
  document.addEventListener("input", (event) => {
    const target = event.target;

    if (target.matches("[data-field]")) {
      setByPath(adminState.content, target.dataset.field, target.value);
      return;
    }

    if (target.matches("[data-field-textarea]")) {
      const paragraphs = target.value
        .split(/\n{2,}/)
        .map((value) => value.trim())
        .filter(Boolean);
      setByPath(adminState.content, target.dataset.fieldTextarea, paragraphs);
      return;
    }

    if (target.matches("[data-media-alt]")) {
      const [kind, rawIndex] = target.dataset.mediaAlt.split(":");
      const index = Number(rawIndex);
      adminState.media[kind][index].alt = target.value;
    }
  });
}

function moveMediaItem(kind, index, direction) {
  const items = adminState.media[kind];
  const nextIndex = index + direction;

  if (!items || nextIndex < 0 || nextIndex >= items.length) {
    return;
  }

  [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
  renderMediaList(kind);
}

function bindMediaActions() {
  document.addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove-media]");
    if (remove) {
      const [kind, rawIndex] = remove.dataset.removeMedia.split(":");
      adminState.media[kind].splice(Number(rawIndex), 1);
      renderMediaList(kind);
      return;
    }

    const moveUp = event.target.closest("[data-move-up]");
    if (moveUp) {
      const [kind, rawIndex] = moveUp.dataset.moveUp.split(":");
      moveMediaItem(kind, Number(rawIndex), -1);
      return;
    }

    const moveDown = event.target.closest("[data-move-down]");
    if (moveDown) {
      const [kind, rawIndex] = moveDown.dataset.moveDown.split(":");
      moveMediaItem(kind, Number(rawIndex), 1);
    }
  });

  document.querySelectorAll("[data-upload-list]").forEach((input) => {
    input.addEventListener("change", (event) => {
      const kind = event.target.dataset.uploadList;
      const directory = kind === "slider" ? "images/home-slider" : "images/footer-gallery";
      const files = Array.from(event.target.files || []);

      files.forEach((file) => {
        adminState.media[kind].push(createMediaItem("", file.name, directory, file));
      });

      event.target.value = "";
      renderMediaList(kind);
    });
  });

  document.querySelector("[data-upload-single='aboutPortrait']")?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    adminState.uploads.aboutPortrait = file;
    setStatus(`Portrait image queued: ${file.name}`, "neutral");
  });
}

async function connectProjectFolder() {
  if (!window.showDirectoryPicker) {
    setStatus("This browser does not support direct local file saving. Use Chrome or Edge on desktop.", "error");
    return;
  }

  adminState.projectRootHandle = await window.showDirectoryPicker();
  setStatus("Project folder connected. You can now save JSON and image changes locally.", "success");
}

async function getHandleFromPath(rootHandle, path, create = false) {
  const segments = path.split("/").filter(Boolean);
  const fileName = segments.pop();
  let currentHandle = rootHandle;

  for (const segment of segments) {
    currentHandle = await currentHandle.getDirectoryHandle(segment, { create });
  }

  return currentHandle.getFileHandle(fileName, { create });
}

async function writeJsonFile(path, value) {
  const fileHandle = await getHandleFromPath(adminState.projectRootHandle, path, true);
  const writable = await fileHandle.createWritable();
  await writable.write(`${JSON.stringify(value, null, 2)}\n`);
  await writable.close();
}

async function writeBinaryFile(path, file) {
  const fileHandle = await getHandleFromPath(adminState.projectRootHandle, path, true);
  const writable = await fileHandle.createWritable();
  await writable.write(await file.arrayBuffer());
  await writable.close();
}

async function persistMediaList(kind) {
  const directory = kind === "slider" ? "images/home-slider" : "images/footer-gallery";

  for (const item of adminState.media[kind]) {
    if (!item.file) {
      continue;
    }

    const fileName = `${Date.now()}-${slugifyFileName(item.file.name)}`;
    const relativePath = `${directory}/${fileName}`;
    await writeBinaryFile(relativePath, item.file);
    item.src = relativePath;
    item.previewSrc = relativePath;
    item.file = null;
  }
}

async function persistAboutPortrait() {
  if (!adminState.uploads.aboutPortrait) {
    return;
  }

  const file = adminState.uploads.aboutPortrait;
  const fileName = `about-${Date.now()}-${slugifyFileName(file.name)}`;
  const relativePath = `images/${fileName}`;
  await writeBinaryFile(relativePath, file);
  adminState.content.about.portraitSrc = relativePath;
  adminState.uploads.aboutPortrait = null;
}

function exportJsonDownload(fileName, value) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: "application/json" });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

async function saveAdminChanges() {
  if (!adminState.content || !adminState.media) {
    return;
  }

  if (!adminState.projectRootHandle) {
    exportJsonDownload("site-content.json", adminState.content);
    exportJsonDownload("home-media.json", {
      slider: adminState.media.slider.map(({ src, alt }) => ({ src, alt })),
      footer: adminState.media.footer.map(({ src, alt }) => ({ src, alt }))
    });
    setStatus("Project folder not connected, so JSON files were downloaded instead. Connect the folder for full local save support.", "warning");
    return;
  }

  try {
    await persistMediaList("slider");
    await persistMediaList("footer");
    await persistAboutPortrait();

    await writeJsonFile("data/site-content.json", adminState.content);
    await writeJsonFile("data/home-media.json", {
      slider: adminState.media.slider.map(({ src, alt }) => ({ src, alt })),
      footer: adminState.media.footer.map(({ src, alt }) => ({ src, alt }))
    });

    setStatus("Homepage content and media references saved locally. Refresh the public site to verify the updates.", "success");
    renderFields();
    renderAllMedia();
  } catch (error) {
    console.error(error);
    setStatus("Saving failed. Make sure you connected the correct project folder and granted write access.", "error");
  }
}

async function loadAdminData() {
  try {
    const [content, media] = await Promise.all([
      fetchJson("data/site-content.json"),
      fetchJson("data/home-media.json")
    ]);

    adminState.content = content;
    adminState.media = {
      slider: (media.slider || []).map((item) => createMediaItem(item.src, item.alt, "images/home-slider")),
      footer: (media.footer || []).map((item) => createMediaItem(item.src, item.alt, "images/footer-gallery"))
    };

    renderFields();
    renderAllMedia();
    setStatus("Homepage content loaded. Connect the project folder to save changes directly.", "neutral");
  } catch (error) {
    console.error(error);
    setStatus("Failed to load the current homepage content files.", "error");
  }
}

function bindAdminActions() {
  document.querySelector("[data-connect-folder]")?.addEventListener("click", () => {
    void connectProjectFolder();
  });

  document.querySelector("[data-save-admin]")?.addEventListener("click", () => {
    void saveAdminChanges();
  });
}

async function initAdmin() {
  ensureAuthenticated();
  bindLogin();
  bindFieldUpdates();
  bindMediaActions();
  bindAdminActions();

  if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "true") {
    await loadAdminData();
  }
}

void initAdmin();

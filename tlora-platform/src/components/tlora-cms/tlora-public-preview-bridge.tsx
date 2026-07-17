type PreviewSection = {
  sectionKey: string;
  isEnabled: boolean;
  draftContent: Record<string, unknown>;
};

type PreviewMessage = {
  type: "tlora:cms-preview";
  sections: PreviewSection[];
};

function isPreviewMessage(value: unknown): value is PreviewMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<PreviewMessage>;
  return message.type === "tlora:cms-preview" && Array.isArray(message.sections);
}

function setText(sectionKey: string, field: string, value: unknown) {
  document.querySelectorAll<HTMLElement>(`[data-cms-section="${sectionKey}"][data-cms-field="${field}"]`)
    .forEach((element) => {
      if (document.activeElement === element) return;
      element.textContent = typeof value === "string" ? value : "";
    });
}

function setLink(sectionKey: string, field: string, value: unknown) {
  if (typeof value !== "string") return;
  document.querySelectorAll<HTMLAnchorElement>(`a[data-cms-section="${sectionKey}"][data-cms-field="${field}"]`)
    .forEach((element) => {
      element.href = value || "#";
    });
}

function setImage(sectionKey: string, field: string, value: unknown) {
  if (typeof value !== "string" || !value) return;
  document.querySelectorAll<HTMLImageElement>(`img[data-cms-section="${sectionKey}"][data-cms-field="${field}"]`)
    .forEach((element) => {
      element.srcset = value;
      element.src = value;
      element.dataset.cmsImageUrl = value;
    });
}

function setImagePosition(sectionKey: string, value: unknown) {
  if (typeof value !== "string" || !value) return;
  document.querySelectorAll<HTMLImageElement>(`img[data-cms-section="${sectionKey}"][data-cms-field="image"]`)
    .forEach((element) => {
      element.style.objectPosition = value;
      element.dataset.cmsImagePosition = value;
    });
}

function setHeroSlides(slides: unknown, fallbackImage: unknown, imagePosition: unknown) {
  window.dispatchEvent(new CustomEvent("tlora:cms-hero-slides", {
    detail: {
      slides: Array.isArray(slides) ? slides : [],
      fallbackImage: typeof fallbackImage === "string" ? fallbackImage : "",
      imagePosition: typeof imagePosition === "string" ? imagePosition : "62% 50%",
    },
  }));
}

function parseImagePosition(value: string | undefined) {
  const match = value?.match(/(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);
  return match ? { x: Number(match[1]), y: Number(match[2]) } : { x: 50, y: 50 };
}

function clampPosition(value: number) {
  return Math.min(100, Math.max(0, value));
}

function requestImage(sectionKey: string, field: string, currentUrl: string) {
  window.parent.postMessage({
    type: "tlora:cms-preview-image-select",
    sectionKey,
    field,
    currentUrl,
  }, window.location.origin);
}

function lockPreviewInteractions() {
  document.querySelectorAll<HTMLDetailsElement>("details").forEach((details) => {
    details.open = true;
  });
  if (document.body.dataset.cmsInteractionsLocked === "true") return;
  document.body.dataset.cmsInteractionsLocked = "true";
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("a[data-cms-preview-navigation]")) return;
    if (target?.closest("a,button,summary,[role='button'],input,select,textarea")) event.preventDefault();
  }, true);
  document.addEventListener("submit", (event) => event.preventDefault(), true);
  document.addEventListener("keydown", (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("a[data-cms-preview-navigation]")) return;
    if (event.key === "Enter" && target?.closest("a,button,summary,[role='button'],input,select,textarea")) event.preventDefault();
  }, true);
}

function sendChange(sectionKey: string, field: string, value: string) {
  window.parent.postMessage({
    type: "tlora:cms-preview-change",
    sectionKey,
    field,
    value,
  }, window.location.origin);
}

function sendPageContent() {
  const title = document.querySelector<HTMLElement>("h1")?.innerText.trim() || "";
  const description = document.querySelector<HTMLElement>('[data-cms-field$="description"]')?.innerText.trim() || "";
  const image = document.querySelector<HTMLImageElement>('[data-cms-section-root] img, main img');
  window.parent.postMessage({
    type: "tlora:cms-preview-page-content",
    pathname: window.location.pathname,
    title,
    description,
    imageUrl: image?.dataset.cmsImageUrl || image?.currentSrc || image?.src || "",
  }, window.location.origin);
}

function makeEditable(element: HTMLElement) {
  if (element.dataset.cmsEditorBound === "true") return;
  element.dataset.cmsEditorBound = "true";
  const sectionKey = element.dataset.cmsSection;
  const field = element.dataset.cmsField;
  if (!sectionKey || !field) return;

  if (element instanceof HTMLImageElement) {
    const pickerField = sectionKey === "hero" && field === "image" ? "__hero_slide_add" : field;
    const openPicker = () => {
      requestImage(sectionKey, pickerField, element.dataset.cmsImageUrl || element.currentSrc || element.src);
    };
    const parent = element.parentElement;
    if (parent && !parent.querySelector(`[data-cms-image-badge="${field}"]`)) {
      const badge = document.createElement("span");
      badge.dataset.cmsImageBadge = field;
      badge.textContent = pickerField === "__hero_slide_add" ? "Thêm ảnh banner" : "Thay ảnh";
      badge.setAttribute("role", "button");
      badge.style.cssText = "position:absolute;right:12px;top:12px;z-index:30;border-radius:6px;background:#d8b766;color:#07080a;padding:8px 12px;font:700 12px/1 sans-serif;cursor:pointer;box-shadow:0 8px 24px #0008";
      badge.addEventListener("click", openPicker);
      parent.appendChild(badge);
    }

    if (sectionKey === "hero" && field === "image") {
      element.title = "Kéo ảnh để căn chỉnh vị trí";
      element.style.cursor = "move";
      element.style.touchAction = "none";
      element.draggable = false;

      element.addEventListener("pointerdown", (event) => {
        if (event.button !== 0 || !element.naturalWidth || !element.naturalHeight) return;
        event.preventDefault();
        element.setPointerCapture(event.pointerId);
        element.style.cursor = "grabbing";
        const start = { x: event.clientX, y: event.clientY };
        const initial = parseImagePosition(element.dataset.cmsImagePosition || element.style.objectPosition);
        const scale = Math.max(element.clientWidth / element.naturalWidth, element.clientHeight / element.naturalHeight);
        const overflowX = Math.max(0, element.naturalWidth * scale - element.clientWidth);
        const overflowY = Math.max(0, element.naturalHeight * scale - element.clientHeight);
        let position = initial;

        const move = (moveEvent: PointerEvent) => {
          const x = overflowX > 0 ? initial.x - ((moveEvent.clientX - start.x) / overflowX) * 100 : initial.x;
          const y = overflowY > 0 ? initial.y - ((moveEvent.clientY - start.y) / overflowY) * 100 : initial.y;
          position = { x: clampPosition(x), y: clampPosition(y) };
          const value = `${position.x.toFixed(1)}% ${position.y.toFixed(1)}%`;
          element.style.objectPosition = value;
          element.dataset.cmsImagePosition = value;
        };

        const finish = () => {
          element.style.cursor = "move";
          element.removeEventListener("pointermove", move);
          element.removeEventListener("pointerup", finish);
          element.removeEventListener("pointercancel", finish);
          sendChange(sectionKey, "imagePosition", `${position.x.toFixed(1)}% ${position.y.toFixed(1)}%`);
        };

        element.addEventListener("pointermove", move);
        element.addEventListener("pointerup", finish);
        element.addEventListener("pointercancel", finish);
      });
    } else {
      element.title = "Nhấp để thay ảnh";
      element.style.cursor = "pointer";
      element.addEventListener("click", openPicker);
    }
    return;
  }

  if (element instanceof HTMLAnchorElement && field === "ctaHref") {
    element.title = "Liên kết bị khóa trong Live Preview";
    return;
  }

  element.contentEditable = "true";
  element.spellcheck = true;
  element.title = "Nhấp để sửa trực tiếp";
  element.style.cursor = "text";
  element.addEventListener("focus", () => {
    element.style.outline = "2px solid #d8b766";
    element.style.outlineOffset = "4px";
  });
  element.addEventListener("blur", () => {
    element.style.outline = "";
    element.style.outlineOffset = "";
  });
  element.addEventListener("input", () => {
    sendChange(sectionKey, field, element.innerText);
    requestAnimationFrame(sendPageContent);
  });
}

function applySection(section: PreviewSection) {
  document.querySelectorAll<HTMLElement>(`[data-cms-section-root="${section.sectionKey}"]`)
    .forEach((element) => {
      element.hidden = !section.isEnabled;
    });

  Object.entries(section.draftContent).forEach(([field, value]) => {
    if (field === "text" && value && typeof value === "object") {
      Object.entries(value as Record<string, unknown>).forEach(([key, textValue]) => {
        setText(section.sectionKey, `text.${key}`, textValue);
      });
      return;
    }
    if (field === "images" && value && typeof value === "object") {
      Object.entries(value as Record<string, unknown>).forEach(([key, imageValue]) => {
        setImage(section.sectionKey, `images.${key}`, imageValue);
      });
      return;
    }
    if (field === "ctaHref" || field === "image" || typeof value === "object") return;
    setText(section.sectionKey, field, value);
  });

  setLink(section.sectionKey, "ctaHref", section.draftContent.ctaHref);
  if (section.sectionKey === "hero") setHeroSlides(section.draftContent.slides, section.draftContent.image, section.draftContent.imagePosition);
  else setImage(section.sectionKey, "image", section.draftContent.image);
  setImagePosition(section.sectionKey, section.draftContent.imagePosition);

  document.querySelectorAll<HTMLElement>(`[data-cms-section="${section.sectionKey}"][data-cms-field]`)
    .forEach(makeEditable);
  if (section.sectionKey === "hero") requestAnimationFrame(() => {
    document.querySelectorAll<HTMLElement>('[data-cms-section="hero"][data-cms-field]').forEach(makeEditable);
  });
}

export function startTloraPublicPreviewBridge() {
  function handleMessage(event: MessageEvent<unknown>) {
    if (event.origin !== window.location.origin || !isPreviewMessage(event.data)) return;
    lockPreviewInteractions();
    event.data.sections.forEach(applySection);
    requestAnimationFrame(sendPageContent);
  }

  window.addEventListener("message", handleMessage);
  window.parent.postMessage({ type: "tlora:cms-preview-ready" }, window.location.origin);
  return () => window.removeEventListener("message", handleMessage);
}

export function notifyTloraPublicPreviewPathname(pathname: string) {
  window.parent.postMessage({
    type: "tlora:cms-preview-ready",
    pathname,
  }, window.location.origin);
  requestAnimationFrame(sendPageContent);
}

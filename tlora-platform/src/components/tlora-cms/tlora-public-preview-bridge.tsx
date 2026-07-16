"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

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

function makeEditable(element: HTMLElement) {
  if (element.dataset.cmsEditorBound === "true") return;
  element.dataset.cmsEditorBound = "true";
  const sectionKey = element.dataset.cmsSection;
  const field = element.dataset.cmsField;
  if (!sectionKey || !field) return;

  if (element instanceof HTMLImageElement) {
    element.title = "Nhấp để thay ảnh";
    element.style.cursor = "pointer";
    const openPicker = () => {
      requestImage(sectionKey, field, element.dataset.cmsImageUrl || element.currentSrc || element.src);
    };
    element.addEventListener("click", openPicker);
    const parent = element.parentElement;
    if (parent && !parent.querySelector(`[data-cms-image-badge="${field}"]`)) {
      const badge = document.createElement("span");
      badge.dataset.cmsImageBadge = field;
      badge.textContent = "Thay ảnh";
      badge.setAttribute("role", "button");
      badge.style.cssText = "position:absolute;right:12px;top:12px;z-index:30;border-radius:6px;background:#d8b766;color:#07080a;padding:8px 12px;font:700 12px/1 sans-serif;cursor:pointer;box-shadow:0 8px 24px #0008";
      badge.addEventListener("click", openPicker);
      parent.appendChild(badge);
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
  setImage(section.sectionKey, "image", section.draftContent.image);

  document.querySelectorAll<HTMLElement>(`[data-cms-section="${section.sectionKey}"][data-cms-field]`)
    .forEach(makeEditable);
}

export function TloraPublicPreviewBridge() {
  const pathname = usePathname();

  useEffect(() => {
    function handleMessage(event: MessageEvent<unknown>) {
      if (event.origin !== window.location.origin || !isPreviewMessage(event.data)) return;
      lockPreviewInteractions();
      event.data.sections.forEach(applySection);
    }

    window.addEventListener("message", handleMessage);
    window.parent.postMessage({ type: "tlora:cms-preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    window.parent.postMessage({
      type: "tlora:cms-preview-ready",
      pathname,
    }, window.location.origin);
  }, [pathname]);

  return null;
}

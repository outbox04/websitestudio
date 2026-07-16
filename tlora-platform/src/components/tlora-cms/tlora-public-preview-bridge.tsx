"use client";

import { useEffect } from "react";

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

function setImage(sectionKey: string, value: unknown) {
  if (typeof value !== "string" || !value) return;
  document.querySelectorAll<HTMLImageElement>(`img[data-cms-section="${sectionKey}"][data-cms-field="image"]`)
    .forEach((element) => {
      element.srcset = value;
      element.src = value;
    });
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
    element.title = "Nhấp đúp để đổi URL ảnh";
    element.addEventListener("dblclick", () => {
      const value = window.prompt("URL ảnh mới", element.currentSrc || element.src);
      if (value !== null) sendChange(sectionKey, field, value.trim());
    });
    return;
  }

  if (element instanceof HTMLAnchorElement && field === "ctaHref") {
    element.addEventListener("click", (event) => event.preventDefault());
    element.addEventListener("dblclick", () => {
      const value = window.prompt("Liên kết CTA", element.getAttribute("href") || "#");
      if (value !== null) sendChange(sectionKey, field, value.trim());
    });
    return;
  }

  element.contentEditable = "true";
  element.spellcheck = true;
  element.title = "Nhấp để sửa trực tiếp";
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
    if (field === "ctaHref" || field === "image") return;
    setText(section.sectionKey, field, value);
  });

  setLink(section.sectionKey, "ctaHref", section.draftContent.ctaHref);
  setImage(section.sectionKey, section.draftContent.image);

  document.querySelectorAll<HTMLElement>(`[data-cms-section="${section.sectionKey}"][data-cms-field]`)
    .forEach(makeEditable);
}

export function TloraPublicPreviewBridge() {
  useEffect(() => {
    function handleMessage(event: MessageEvent<unknown>) {
      if (event.origin !== window.location.origin || !isPreviewMessage(event.data)) return;
      event.data.sections.forEach(applySection);
    }

    window.addEventListener("message", handleMessage);
    window.parent.postMessage({ type: "tlora:cms-preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-navigation");
const scrollProgress = document.querySelector(".scroll-progress");

document.querySelector("#current-year").textContent = new Date().getFullYear();

function setMenuOpen(isOpen) {
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
  navigation.classList.toggle("is-open", isOpen);
}

menuButton.addEventListener("click", () => {
  setMenuOpen(menuButton.getAttribute("aria-expanded") === "false");
});

navigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenuOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
    setMenuOpen(false);
    menuButton.focus();
  }
});

menuButton.closest(".site-header").classList.add("menu-ready");

for (const preview of document.querySelectorAll("[data-project-preview]")) {
  const controls = preview.querySelector(".preview-controls");
  const buttons = controls.querySelectorAll("button");
  const desktop = preview.querySelector(".preview-desktop");
  const mobile = preview.querySelector(".preview-mobile");

  controls.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    const showMobile = button.dataset.device === "mobile";
    preview.dataset.device = button.dataset.device;
    desktop.hidden = showMobile;
    mobile.hidden = !showMobile;
    for (const option of buttons) {
      option.setAttribute("aria-pressed", String(option === button));
    }
  });

  controls.hidden = false;
}

const contact = document.querySelector("#contact");
const serviceStatus = contact.querySelector(".contact-service");
const telegramLink = contact.querySelector(".telegram-button");
const telegramUrl = new URL(telegramLink.href);
const draft = contact.querySelector("#message-draft");
const draftEditor = contact.querySelector(".draft-editor");
const copyStatus = contact.querySelector(".copy-status");
const copyButton = contact.querySelector(".copy-draft");
const drafts = new Map();
let selectedService = "";

function updateTelegramLink() {
  telegramUrl.searchParams.set("text", draft.value);
  telegramLink.href = telegramUrl.href;
  copyStatus.textContent = "";
  copyButton.disabled = !draft.value.trim();
}

draft.addEventListener("input", updateTelegramLink);
updateTelegramLink();
draftEditor.hidden = false;

document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href="#contact"]');
  if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

  drafts.set(selectedService, draft.value);
  selectedService = link.dataset.service || "";
  const template = selectedService
    ? `Здравствуйте! Меня интересует услуга «${selectedService}». Хочу обсудить проект.`
    : draft.defaultValue;
  draft.value = drafts.get(selectedService) ?? template;
  serviceStatus.textContent = selectedService ? `Выбранная услуга — ${selectedService}` : "";
  serviceStatus.hidden = !selectedService;
  updateTelegramLink();
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(draft.value);
    copyStatus.textContent = "Текст скопирован";
  } catch {
    draft.focus();
    draft.select();
    copyStatus.textContent = "Текст выделен. Выберите «Копировать».";
  }
});

const light = document.querySelector(".backdrop-light");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let lightFrame = null;
let lightX = 0;
let lightY = 0;
function moveLight(event) {
  if (reducedMotion.matches) return;
  lightX = event.clientX;
  lightY = event.clientY;
  if (lightFrame !== null) return;
  lightFrame = requestAnimationFrame(() => {
    light.style.transform = `translate3d(${lightX}px, ${lightY}px, 0)`;
    light.classList.add("is-active");
    lightFrame = null;
  });
}
function hideLight() {
  cancelAnimationFrame(lightFrame);
  lightFrame = null;
  light.classList.remove("is-active");
}
window.addEventListener("pointermove", moveLight, { passive: true });
window.addEventListener("pointerdown", moveLight, { passive: true });
window.addEventListener("pointerup", (event) => {
  if (event.pointerType !== "mouse") hideLight();
});
window.addEventListener("pointercancel", hideLight);
document.documentElement.addEventListener("pointerleave", hideLight);
reducedMotion.addEventListener("change", hideLight);

let progressFrame = null;
function updateProgress() {
  if (progressFrame !== null) return;
  progressFrame = requestAnimationFrame(() => {
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress.style.transform = `scaleX(${distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0})`;
    progressFrame = null;
  });
}
window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);
window.addEventListener("pageshow", updateProgress);

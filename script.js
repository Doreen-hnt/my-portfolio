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
const telegramUrl = telegramLink.href;

document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href="#contact"]');
  if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

  const service = link.dataset.service;
  const url = new URL(telegramUrl);
  if (service) url.searchParams.set("text", `Здравствуйте! Хочу обсудить проект. Услуга — ${service}.`);

  telegramLink.href = url.href;
  serviceStatus.textContent = service ? `Выбранная услуга — ${service}` : "";
  serviceStatus.hidden = !service;
});

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

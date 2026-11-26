document.documentElement.classList.add("js-enabled");

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-navigation");
const navigationLinks = navigation.querySelectorAll("a");
const year = document.querySelector("#current-year");

year.textContent = new Date().getFullYear();

function setMenuOpen(isOpen) {
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
  navigation.classList.toggle("is-open", isOpen);
}

menuButton.addEventListener("click", () => {
  setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true");
});

navigationLinks.forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
    setMenuOpen(false);
    menuButton.focus();
  }
});

menuButton.closest(".site-header").classList.add("menu-ready");

const revealElements = document.querySelectorAll(".reveal");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const heroCopy = document.querySelector(".hero-copy");
const heroArt = document.querySelector(".hero-art");
const scrollProgress = document.querySelector(".scroll-progress");
// Keep the accessibility skip link on the browser's native navigation.
const smoothScrollLinks = document.querySelectorAll('a[href^="#"]:not(.skip-link)');

let smoothScrollFrame = null;
let originalScrollBehavior = "";

function cancelSmoothScroll() {
  if (smoothScrollFrame === null) return;

  window.cancelAnimationFrame(smoothScrollFrame);
  smoothScrollFrame = null;
  document.documentElement.style.scrollBehavior = originalScrollBehavior;
}

smoothScrollLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.hash);
    if (
      !target ||
      reduceMotion.matches ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return;

    const scrollPadding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
    const targetY = Math.max(0, Math.min(
      target.getBoundingClientRect().top + window.scrollY - scrollPadding,
      maxScrollY
    ));

    if (Math.abs(window.scrollY - targetY) < 1) return;

    event.preventDefault();
    cancelSmoothScroll();

    const startingScrollY = window.scrollY;
    const distance = targetY - startingScrollY;
    const duration = 1500;
    let startTime;

    originalScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";

    function animateScroll(timestamp) {
      if (startTime === undefined) startTime = timestamp;

      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = progress < 0.5
        ? 4 * progress ** 3
        : 1 - ((-2 * progress + 2) ** 3) / 2;

      window.scrollTo(0, startingScrollY + distance * easedProgress);

      if (progress < 1) {
        smoothScrollFrame = window.requestAnimationFrame(animateScroll);
      } else {
        smoothScrollFrame = null;
        document.documentElement.style.scrollBehavior = originalScrollBehavior;
        if (window.location.hash !== link.hash) window.location.hash = link.hash;
      }
    }

    smoothScrollFrame = window.requestAnimationFrame(animateScroll);
  });
});

window.addEventListener("wheel", cancelSmoothScroll, { passive: true });
window.addEventListener("touchstart", cancelSmoothScroll, { passive: true });
window.addEventListener("keydown", cancelSmoothScroll);

window.requestAnimationFrame(() => heroCopy.classList.add("is-entered"));

let scrollFrameRequested = false;
let previousScrollY = window.scrollY;
let scrollDirection = 1;

function updateScrollEffects() {
  const currentScrollY = window.scrollY;
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? currentScrollY / scrollableHeight : 0;
  scrollProgress.style.transform = `scaleX(${progress})`;

  if (!reduceMotion.matches) {
    const heroOffset = document.querySelector(".hero").getBoundingClientRect().top;
    const parallaxOffset = Math.max(-28, Math.min(28, -heroOffset * 0.035));
    heroArt.style.setProperty("--parallax-y", `${parallaxOffset}px`);
  }

  scrollFrameRequested = false;
}

function requestScrollUpdate() {
  const currentScrollY = window.scrollY;
  if (currentScrollY !== previousScrollY) {
    scrollDirection = currentScrollY > previousScrollY ? 1 : -1;
    previousScrollY = currentScrollY;
  }

  if (!scrollFrameRequested) {
    window.requestAnimationFrame(updateScrollEffects);
    scrollFrameRequested = true;
  }
}

window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate);
updateScrollEffects();

if ("IntersectionObserver" in window && !reduceMotion.matches) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const offset = entry.isIntersecting
        ? scrollDirection > 0 ? "18px" : "-18px"
        : scrollDirection > 0 ? "-18px" : "18px";
      entry.target.style.setProperty("--reveal-offset", offset);
      entry.target.classList.toggle("is-visible", entry.isIntersecting);
    });
  }, { threshold: 0.12 });

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

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

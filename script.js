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

const revealElements = document.querySelectorAll(".reveal");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const heroCopy = document.querySelector(".hero-copy");
const heroArt = document.querySelector(".hero-art");
const scrollProgress = document.querySelector(".scroll-progress");
const backTopLink = document.querySelector(".back-top");

let backTopFrame = null;
let originalScrollBehavior = "";

function cancelBackToTop() {
  if (backTopFrame === null) return;

  window.cancelAnimationFrame(backTopFrame);
  backTopFrame = null;
  document.documentElement.style.scrollBehavior = originalScrollBehavior;
}

backTopLink.addEventListener("click", (event) => {
  if (
    reduceMotion.matches ||
    window.scrollY === 0 ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) return;

  event.preventDefault();
  cancelBackToTop();

  const startingScrollY = window.scrollY;
  const duration = 1500;
  let startTime;

  originalScrollBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = "auto";

  function animateBackToTop(timestamp) {
    if (startTime === undefined) startTime = timestamp;

    const progress = Math.min((timestamp - startTime) / duration, 1);
    const easedProgress = progress < 0.5
      ? 4 * progress ** 3
      : 1 - ((-2 * progress + 2) ** 3) / 2;

    window.scrollTo(0, startingScrollY * (1 - easedProgress));

    if (progress < 1) {
      backTopFrame = window.requestAnimationFrame(animateBackToTop);
    } else {
      backTopFrame = null;
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
    }
  }

  backTopFrame = window.requestAnimationFrame(animateBackToTop);
});

window.addEventListener("wheel", cancelBackToTop, { passive: true });
window.addEventListener("touchstart", cancelBackToTop, { passive: true });
window.addEventListener("keydown", cancelBackToTop);

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

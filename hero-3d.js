const hero = document.querySelector(".hero");
const stage = document.querySelector(".hero-stage");
const motionAllowed = matchMedia("(prefers-reduced-motion: no-preference)");

let initializing = false;
let stopScene;

function syncScene() {
  if (!motionAllowed.matches) {
    stopScene?.();
    stopScene = undefined;
    return;
  }
  if (initializing || stopScene) return;

  initializing = true;
  import("./assets/vendor/three.module.min.js")
    .then((three) => {
      if (motionAllowed.matches) stopScene = mountScene(three);
    })
    .catch(() => {
      // The poster remains visible if WebGL or the module is unavailable.
    })
    .finally(() => { initializing = false; });
}

function mountScene(three) {
  const {
    AmbientLight, BoxGeometry, DirectionalLight, ExtrudeGeometry, Group, Mesh,
    MeshStandardMaterial, Path, PerspectiveCamera, Scene, Shape, WebGLRenderer,
  } = three;

  const renderer = new WebGLRenderer({ alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 1, .1, 40);
  camera.position.set(0, 0, 9.6);

  const key = new DirectionalLight(0xf2ffd5, 3.2);
  key.position.set(-2, 5, 6);
  const rim = new DirectionalLight(0xc6ff38, 4.2);
  rim.position.set(4, 1, -2);
  const fill = new DirectionalLight(0xb2bfc6, 1.4);
  fill.position.set(-4, -2, 1);
  scene.add(key, rim, fill, new AmbientLight(0xe1e7cc, 1.05));

  const outline = new Shape();
  outline.moveTo(-1.48, -1.52);
  outline.lineTo(-.25, -1.52);
  outline.bezierCurveTo(.83, -1.52, 1.47, -.87, 1.47, 0);
  outline.bezierCurveTo(1.47, .87, .83, 1.52, -.25, 1.52);
  outline.lineTo(-1.48, 1.52);
  outline.closePath();

  const counter = new Path();
  counter.moveTo(-.72, -.8);
  counter.lineTo(-.27, -.8);
  counter.bezierCurveTo(.35, -.8, .7, -.48, .7, 0);
  counter.bezierCurveTo(.7, .48, .35, .8, -.27, .8);
  counter.lineTo(-.72, .8);
  counter.closePath();
  outline.holes.push(counter);

  const letterGeometry = new ExtrudeGeometry(outline, {
    depth: .66, bevelEnabled: true, bevelThickness: .12, bevelSize: .11,
    bevelSegments: 5, curveSegments: 26,
  });
  letterGeometry.translate(-.37, .04, -.32);

  const face = new MeshStandardMaterial({ color: 0x3a413a, roughness: .53, metalness: .31 });
  const edge = new MeshStandardMaterial({ color: 0x788759, roughness: .4, metalness: .29 });
  const acid = new MeshStandardMaterial({ color: 0xc6ff00, emissive: 0x86b500, emissiveIntensity: .36, roughness: .42 });
  const dotGeometry = new BoxGeometry(.57, .57, .57);

  const mark = new Group();
  const letter = new Mesh(letterGeometry, [face, edge]);
  const dot = new Mesh(dotGeometry, acid);
  dot.position.set(1.72, -1.18, .03);
  mark.add(letter, dot);
  scene.add(mark);

  let visible = true;
  let contextLost = false;
  let frame = null;
  let pointerX = 0;
  let pointerY = 0;
  let pointerInside = false;
  let scrollOffset = 0;
  const initialX = -.15;
  const initialY = -.48;
  mark.rotation.set(initialX, initialY, -.085);

  let elapsed = 0;
  let lastTime = null;

  function render(time) {
    frame = null;
    if (!visible || document.hidden || contextLost) {
      lastTime = null;
      return;
    }
    if (lastTime !== null) elapsed += Math.min(time - lastTime, 80);
    lastTime = time;
    const phase = elapsed * Math.PI * 2 / 8500;
    const targetX = initialX + .57 * Math.sin(phase) - pointerY * .15;
    const targetY = initialY + .16 * Math.sin(phase * 2) + pointerX * .24;
    const rotation = mark.rotation;
    rotation.x += (targetX - rotation.x) * .13;
    rotation.y += (targetY - rotation.y) * .13;
    mark.position.y += (scrollOffset - mark.position.y) * .13;
    key.position.x = -2 + pointerX * 3;
    renderer.render(scene, camera);

    requestDraw();
  }

  function requestDraw() {
    if (frame === null && visible && !contextLost && !document.hidden) frame = requestAnimationFrame(render);
  }

  function resize() {
    const size = stage.clientWidth;
    if (!size) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, size < 480 ? 1 : 1.5));
    renderer.setSize(size, size, false);
    requestDraw();
  }

  function onPointer(event) {
    if (event.pointerType !== "mouse") return;
    const bounds = hero.getBoundingClientRect();
    pointerInside = true;
    pointerX = 2 * (event.clientX - bounds.left) / bounds.width - 1;
    pointerY = 2 * (event.clientY - bounds.top) / bounds.height - 1;
    requestDraw();
  }

  function resetPointer() {
    if (!pointerInside) return;
    pointerInside = false;
    pointerX = 0;
    pointerY = 0;
    requestDraw();
  }

  function onScroll() {
    scrollOffset = -Math.min(.45, Math.max(0, -hero.getBoundingClientRect().top) * .001);
    requestDraw();
  }

  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) onScroll();
  });
  const sizeObserver = new ResizeObserver(resize);
  function onContextLost(event) {
    event.preventDefault();
    contextLost = true;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    stage.classList.remove("is-live");
  }
  function onContextRestored() {
    contextLost = false;
    lastTime = null;
    requestDraw();
    stage.classList.add("is-live");
  }

  stage.append(renderer.domElement);
  resize();
  renderer.render(scene, camera);
  stage.classList.add("is-live");
  sizeObserver.observe(stage);
  visibility.observe(stage);
  hero.addEventListener("pointermove", onPointer, { passive: true });
  hero.addEventListener("pointerleave", resetPointer);
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", requestDraw);
  renderer.domElement.addEventListener("webglcontextlost", onContextLost);
  renderer.domElement.addEventListener("webglcontextrestored", onContextRestored);

  return () => {
    resetPointer();
    if (frame !== null) cancelAnimationFrame(frame);
    sizeObserver.disconnect();
    visibility.disconnect();
    hero.removeEventListener("pointermove", onPointer);
    hero.removeEventListener("pointerleave", resetPointer);
    window.removeEventListener("scroll", onScroll);
    document.removeEventListener("visibilitychange", requestDraw);
    letterGeometry.dispose();
    dotGeometry.dispose();
    face.dispose();
    edge.dispose();
    acid.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    stage.classList.remove("is-live");
  };
}

motionAllowed.addEventListener("change", syncScene);
if ("IntersectionObserver" in window && "ResizeObserver" in window) {
  if (document.readyState === "complete") syncScene();
  else window.addEventListener("load", syncScene, { once: true });
}

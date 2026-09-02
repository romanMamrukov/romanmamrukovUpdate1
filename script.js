document.getElementById("current-year").textContent = new Date().getFullYear();

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", () => {
    document.activeElement?.blur();
  });
});


const portraitWrap = document.querySelector(".portrait-wrap");
const portrait = document.querySelector(".portrait");

if (portraitWrap && portrait && window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  portraitWrap.addEventListener("pointermove", (event) => {
    const box = portraitWrap.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    portrait.style.setProperty("--photo-rx", `${(x - 0.5) * 10}deg`);
    portrait.style.setProperty("--photo-ry", `${(0.5 - y) * 8}deg`);
    portrait.style.setProperty("--light-x", `${x * 100}%`);
    portrait.style.setProperty("--light-y", `${y * 100}%`);
  });

  portraitWrap.addEventListener("pointerleave", () => {
    portrait.style.removeProperty("--photo-rx");
    portrait.style.removeProperty("--photo-ry");
    portrait.style.removeProperty("--light-x");
    portrait.style.removeProperty("--light-y");
  });
}

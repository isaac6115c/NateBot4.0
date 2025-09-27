(function () {
  function onReady(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  onReady(() => {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    const list = navbar.querySelector("ul");
    if (!list) return;

    // Find or create the toggle button
    let toggle = navbar.querySelector(".nav-toggle");
    if (!toggle) {
      toggle = document.createElement("button");
      toggle.className = "nav-toggle";
      toggle.setAttribute("aria-label", "Toggle menu");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "☰";
      navbar.insertBefore(toggle, list);
    }

    const mq = window.matchMedia("(max-width: 768px)");

    function applyLayout() {
      if (mq.matches) {
        // Mobile: start collapsed
        list.classList.remove("show");
        list.setAttribute("data-mobile", "true");
        toggle.style.display = "block";
        toggle.textContent = "☰";
        toggle.setAttribute("aria-expanded", "false");
      } else {
        // Desktop: always visible, no toggle
        list.classList.remove("show");
        list.removeAttribute("data-mobile");
        toggle.style.display = "none";
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "☰";
      }
    }

    applyLayout();
    // Modern browsers
    if (mq.addEventListener) mq.addEventListener("change", applyLayout);
    // Fallback
    else mq.addListener(applyLayout);

    toggle.addEventListener("click", () => {
      if (!list.hasAttribute("data-mobile")) return; // ignore on desktop
      const open = list.classList.toggle("show");
      toggle.textContent = open ? "✖" : "☰";
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // Auto-collapse after selecting a link (mobile)
    list.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => {
        if (!list.hasAttribute("data-mobile")) return;
        list.classList.remove("show");
        toggle.textContent = "☰";
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  });
})();

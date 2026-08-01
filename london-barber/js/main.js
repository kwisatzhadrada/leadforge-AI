/* London Barber — progressive enhancement (nav, reveal-on-scroll, parallax, lightbox) */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Sticky nav shadow/blur on scroll ---- */
  var nav = document.getElementById("siteNav");
  function onScroll() {
    if (window.scrollY > 24) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Mobile menu toggle ---- */
  var navToggle = document.getElementById("navToggle");
  var mobileMenu = document.getElementById("mobileMenu");

  function closeMenu() {
    navToggle.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    mobileMenu.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  navToggle.addEventListener("click", function () {
    var open = navToggle.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    mobileMenu.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  });

  mobileMenu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });

  /* ---- Scroll-reveal via IntersectionObserver ---- */
  var revealTargets = document.querySelectorAll(
    ".hero-content, .about-grid > *, .section-head, .service-card, .why-card, " +
    ".experience-list, .experience-media, .gallery-item, .testimonial-card, " +
    ".location-info, .map-frame"
  );

  revealTargets.forEach(function (el, i) {
    el.setAttribute("data-reveal", "");
    el.style.setProperty("--i", i % 8);
  });

  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---- Hero parallax (subtle, mouse + scroll) ---- */
  var heroBg = document.getElementById("heroBg");
  if (heroBg && !reduceMotion) {
    var heroImg = heroBg.querySelector("img");

    document.addEventListener(
      "scroll",
      function () {
        var y = Math.min(window.scrollY, 600);
        heroImg.style.transform = "scale(1.08) translateY(" + y * 0.12 + "px)";
      },
      { passive: true }
    );

    var hero = document.querySelector(".hero");
    hero.addEventListener("mousemove", function (e) {
      var rect = hero.getBoundingClientRect();
      var relX = (e.clientX - rect.left) / rect.width - 0.5;
      var relY = (e.clientY - rect.top) / rect.height - 0.5;
      heroBg.style.transform = "translate(" + relX * -14 + "px," + relY * -10 + "px)";
    });
    hero.addEventListener("mouseleave", function () {
      heroBg.style.transform = "translate(0,0)";
    });
  }

  /* ---- Gallery lightbox ---- */
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxClose = document.getElementById("lightboxClose");

  document.querySelectorAll(".gallery-item").forEach(function (item) {
    item.addEventListener("click", function () {
      var full = item.getAttribute("data-full");
      var alt = item.querySelector("img").getAttribute("alt");
      lightboxImg.setAttribute("src", full);
      lightboxImg.setAttribute("alt", alt);
      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";
    });
  });

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeLightbox(); closeMenu(); }
  });

  /* ---- Footer year ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

/* ================================================================
   MOTOMATION — animation engine
   GSAP + ScrollTrigger + Lenis smooth scroll
   ================================================================ */

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ----------------------------------------------------------------
   Smooth scroll (Lenis) — skipped for reduced motion
---------------------------------------------------------------- */
let lenis = null;
if (!prefersReducedMotion) {
  lenis = new Lenis({ duration: 1.1 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// Anchor links scroll smoothly through Lenis
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    if (lenis) {
      lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    } else {
      target.scrollIntoView();
    }
  });
});

/* ----------------------------------------------------------------
   Intro: preloader → hero reveal
---------------------------------------------------------------- */
const heroLines = document.querySelectorAll(".hero__line-inner");

if (!prefersReducedMotion) {
  gsap.set(heroLines, { yPercent: 110 });
  gsap.set([".hero__label", ".hero__bottom", ".hero__shape"], { autoAlpha: 0 });

  const intro = gsap.timeline();

  intro
    .to(".preloader__word span", {
      y: "0%",
      yPercent: -110,
      startAt: { yPercent: 0, y: "110%" },
      duration: 0.7,
      stagger: 0.045,
      ease: "power3.out",
    })
    .to(".preloader__word span", {
      y: "-110%",
      duration: 0.5,
      stagger: 0.03,
      ease: "power2.in",
      delay: 0.35,
    })
    .to("#preloader", {
      yPercent: -100,
      duration: 0.7,
      ease: "power4.inOut",
    }, "-=0.15")
    .set("#preloader", { display: "none" })
    // Hero reveal
    .to(heroLines, {
      yPercent: 0,
      duration: 1.1,
      stagger: 0.12,
      ease: "power4.out",
    }, "-=0.35")
    .to(".hero__label", { autoAlpha: 1, duration: 0.6 }, "-=0.7")
    .to(".hero__bottom", { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.5")
    .to(".hero__shape", {
      autoAlpha: 1,
      scale: 1,
      startAt: { scale: 0.4 },
      duration: 0.8,
      stagger: 0.1,
      ease: "back.out(2)",
    }, "-=0.5");
} else {
  document.getElementById("preloader").style.display = "none";
}

/* ----------------------------------------------------------------
   Scroll reveals
---------------------------------------------------------------- */
if (!prefersReducedMotion) {
  gsap.utils.toArray(".reveal").forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });
  });

  // Hero shapes drift on scroll (parallax)
  gsap.to(".hero__shape--ring", {
    yPercent: 140, rotation: 90, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 },
  });
  gsap.to(".hero__shape--dot", {
    yPercent: -220, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 },
  });

  // Studio text: words light up as you scroll
  const studioText = document.getElementById("studio-text");
  if (studioText) {
    studioText.innerHTML = studioText.textContent
      .trim()
      .split(/\s+/)
      .map((w) => `<span class="word">${w}</span>`)
      .join(" ");
    gsap.to("#studio-text .word", {
      opacity: 1,
      stagger: 0.06,
      ease: "none",
      scrollTrigger: {
        trigger: studioText,
        start: "top 75%",
        end: "bottom 45%",
        scrub: true,
      },
    });
  }

  // Contact title lines slide up
  gsap.from(".contact__line-inner", {
    yPercent: 110,
    duration: 1,
    stagger: 0.12,
    ease: "power4.out",
    scrollTrigger: { trigger: ".contact", start: "top 70%" },
  });
}

/* ----------------------------------------------------------------
   Custom cursor
---------------------------------------------------------------- */
const cursor = document.querySelector(".cursor");
if (cursor && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  const dotX = gsap.quickTo(".cursor__dot", "x", { duration: 0.12, ease: "power2.out" });
  const dotY = gsap.quickTo(".cursor__dot", "y", { duration: 0.12, ease: "power2.out" });
  const ringX = gsap.quickTo(".cursor__ring", "x", { duration: 0.45, ease: "power2.out" });
  const ringY = gsap.quickTo(".cursor__ring", "y", { duration: 0.45, ease: "power2.out" });

  window.addEventListener("mousemove", (e) => {
    dotX(e.clientX); dotY(e.clientY);
    ringX(e.clientX); ringY(e.clientY);
  });

  document.querySelectorAll("[data-hover]").forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("cursor--active"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("cursor--active"));
  });
}

/* ----------------------------------------------------------------
   Project video: silent autoplay preview when visible
---------------------------------------------------------------- */
const previewVideo = document.querySelector(".project__video");
if (previewVideo) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          previewVideo.play().catch(() => {});
        } else {
          previewVideo.pause();
        }
      });
    },
    { threshold: 0.35 }
  );
  observer.observe(previewVideo);
}

/* ----------------------------------------------------------------
   Lightbox: click project → full video with sound
---------------------------------------------------------------- */
const lightbox = document.getElementById("lightbox");
const lightboxVideo = document.getElementById("lightbox-video");

function openLightbox(src) {
  lightboxVideo.src = src;
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  if (lenis) lenis.stop();
  lightboxVideo.play().catch(() => {});
}

function closeLightbox() {
  lightboxVideo.pause();
  lightboxVideo.removeAttribute("src");
  lightboxVideo.load();
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  if (lenis) lenis.start();
}

document.querySelectorAll("[data-lightbox]").forEach((el) => {
  el.addEventListener("click", () => openLightbox(el.dataset.lightbox));
});
document.querySelectorAll("[data-lightbox-close]").forEach((el) => {
  el.addEventListener("click", closeLightbox);
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && lightbox.classList.contains("is-open")) closeLightbox();
});

/* ----------------------------------------------------------------
   Email button: copy to clipboard
---------------------------------------------------------------- */
const emailBtn = document.getElementById("email-btn");
if (emailBtn) {
  emailBtn.addEventListener("click", async () => {
    const email = emailBtn.querySelector(".contact__email-text").textContent.trim();
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      window.location.href = `mailto:${email}`;
      return;
    }
    emailBtn.classList.add("is-copied");
    setTimeout(() => emailBtn.classList.remove("is-copied"), 1600);
  });
}

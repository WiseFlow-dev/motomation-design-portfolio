/* ================================================================
   MOTOMATION — animation engine
   GSAP + ScrollTrigger + Lenis smooth scroll
   ================================================================ */

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isDesktopPointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ----------------------------------------------------------------
   Smooth scroll (Lenis) — desktop only; phones scroll natively
---------------------------------------------------------------- */
let lenis = null;
if (!prefersReducedMotion && isDesktopPointer) {
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
      target.scrollIntoView({ behavior: "smooth" });
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

  // Take over letter positioning in one unit (percent of letter height).
  // The CSS translateY(110%) only prevents a flash before this line runs.
  const letters = document.querySelectorAll(".preloader__word span");
  gsap.set(letters, { y: 0, yPercent: 110 });

  // Wait for fonts (max 1.5s) so the word doesn't swap typefaces mid-animation
  const fontsReady = Promise.race([
    document.fonts.ready,
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]);

  const intro = gsap.timeline({ paused: true });
  fontsReady.then(() => intro.play());

  intro
    // letters rise in a tight wave...
    .to(letters, {
      yPercent: 0,
      duration: 0.55,
      stagger: 0.035,
      ease: "power3.out",
    })
    // ...the full word holds long enough to be read...
    .to(letters, {
      yPercent: -110,
      duration: 0.45,
      stagger: 0.02,
      ease: "power2.in",
      delay: 0.6,
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

  // Hero shapes drift on scroll (parallax) — desktop only, hidden on phones
  if (isDesktopPointer) {
    gsap.to(".hero__shape--ring", {
      yPercent: 140, rotation: 90, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 },
    });
    gsap.to(".hero__shape--dot", {
      yPercent: -220, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 },
    });
  }

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

  // Hero drifts away with depth as you scroll past it
  gsap.to(".hero__title", {
    yPercent: -14,
    autoAlpha: 0.25,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom 35%", scrub: true },
  });

  // Scroll drags the orange ticker sideways
  gsap.fromTo(".marquee",
    { xPercent: 1.5 },
    {
      xPercent: -3.5,
      ease: "none",
      scrollTrigger: { trigger: ".marquee", start: "top bottom", end: "bottom top", scrub: true },
    }
  );

  // The phone video cards float slower than the page (parallax) — one per card
  gsap.utils.toArray(".project").forEach((proj) => {
    gsap.fromTo(proj.querySelector(".project__media"),
      { y: 50 },
      {
        y: -50,
        ease: "none",
        scrollTrigger: { trigger: proj, start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  });

  // Titles lean with scroll speed, then spring back (desktop only)
  if (isDesktopPointer) {
    const skewClamp = gsap.utils.clamp(-3.5, 3.5);
    const skewProxy = { skew: 0 };
    const skewSetter = gsap.quickSetter(".skewable", "skewY", "deg");

    ScrollTrigger.create({
      onUpdate(self) {
        const skew = skewClamp(self.getVelocity() / -400);
        if (Math.abs(skew) > Math.abs(skewProxy.skew)) {
          skewProxy.skew = skew;
          gsap.to(skewProxy, {
            skew: 0,
            duration: 0.7,
            ease: "power3.out",
            overwrite: true,
            onUpdate: () => skewSetter(skewProxy.skew),
          });
        }
      },
    });
  }
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
const previewObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.play().catch(() => {});
      } else {
        entry.target.pause();
      }
    });
  },
  { threshold: 0.35 }
);
document.querySelectorAll(".project__video").forEach((v) => previewObserver.observe(v));

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
   Contact dialog: open, close, send via Netlify Forms
---------------------------------------------------------------- */
const contactModal = document.getElementById("contact-modal");
const contactForm = document.getElementById("contact-form");
const formSuccess = document.getElementById("form-success");
const formError = document.getElementById("form-error");
const openContactBtns = document.querySelectorAll("[data-open-contact]");

function openContactModal() {
  contactModal.classList.add("is-open");
  contactModal.setAttribute("aria-hidden", "false");
  if (lenis) lenis.stop();
  if (!prefersReducedMotion) {
    gsap.fromTo(".contact-modal__panel",
      { y: 46, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }
    );
    gsap.fromTo(".contact-form__field, .contact-form__send",
      { y: 18, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.05, delay: 0.1, ease: "power2.out" }
    );
  }
  setTimeout(() => document.getElementById("cf-name").focus(), 450);
}

function closeContactModal() {
  contactModal.classList.remove("is-open");
  contactModal.setAttribute("aria-hidden", "true");
  if (lenis) lenis.start();
}

openContactBtns.forEach((btn) => btn.addEventListener("click", openContactModal));
document.querySelectorAll("[data-modal-close]").forEach((el) => {
  el.addEventListener("click", closeContactModal);
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && contactModal.classList.contains("is-open")) closeContactModal();
});

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const sendBtn = contactForm.querySelector(".contact-form__send");
    sendBtn.disabled = true;
    sendBtn.textContent = "Sending…";
    formError.hidden = true;

    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(new FormData(contactForm)).toString(),
      });
      if (!res.ok) throw new Error("send failed");
      contactForm.hidden = true;
      formSuccess.hidden = false;
      if (!prefersReducedMotion) {
        gsap.from(".contact-form__success-big", {
          scale: 0.4, autoAlpha: 0, duration: 0.6, ease: "back.out(2)",
        });
      }
    } catch {
      formError.hidden = false;
      sendBtn.disabled = false;
      sendBtn.textContent = "Send it →";
    }
  });
}


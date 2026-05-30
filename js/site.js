function setupNav() {
  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.querySelector(".site-nav");

  if (navToggle && siteNav) {
    const closeMenu = () => {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    };

    const updateMenuPosition = () => {
      if (window.innerWidth > 760) {
        siteNav.style.removeProperty("--mobile-menu-top");
        return;
      }

      const navToggleRect = navToggle.getBoundingClientRect();
      siteNav.style.setProperty("--mobile-menu-top", `${navToggleRect.bottom + 12}px`);
    };

    navToggle.addEventListener("click", () => {
      updateMenuPosition();
      const open = siteNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });

    siteNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        closeMenu();
      });
    });

    window.addEventListener("resize", () => {
      updateMenuPosition();

      if (window.innerWidth > 760) {
        closeMenu();
      }
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });
  }
}

function setupReveal() {
  const revealItems = document.querySelectorAll(".section, .detail-card, .copy-card, .image-card, .slide-card, .footer-panel");
  const portfolioSections = document.querySelectorAll(".portfolio-hero-section, .portfolio-grid-section");

  if (portfolioSections.length > 0) {
    portfolioSections.forEach((section) => {
      section.classList.add("fade-in", "is-visible");
    });
  }

  if (window.innerWidth <= 760) {
    revealItems.forEach((item) => {
      item.classList.add("fade-in", "is-visible");
    });
    return;
  }

  const observer = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18 })
    : null;

  revealItems.forEach((item) => {
    if (item.classList.contains("portfolio-hero-section") || item.classList.contains("portfolio-grid-section")) {
      return;
    }

    item.classList.add("fade-in");

    if (observer) {
      observer.observe(item);
    } else {
      item.classList.add("is-visible");
    }
  });
}

function renderSlider(items) {
  const sliderTrack = document.querySelector("[data-slider-track]");

  if (!sliderTrack) {
    return;
  }

  sliderTrack.innerHTML = items.map((item) => `
    <button class="slide-card slider-lightbox-item" type="button" data-src="${item.src}" data-alt="${item.alt}">
      <img src="${item.src}" alt="${item.alt}" width="1600" height="1100" sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw" loading="lazy" decoding="async">
    </button>
  `).join("");

  const firstSlideImage = sliderTrack.querySelector("img");

  if (firstSlideImage) {
    firstSlideImage.loading = "eager";
    firstSlideImage.decoding = "sync";
  }
}

function renderFooterGallery(items) {
  const footerGallery = document.querySelector("[data-footer-gallery]");

  if (!footerGallery) {
    return;
  }

  footerGallery.innerHTML = items.map((item) => `
    <img src="${item.src}" alt="${item.alt}" width="900" height="900" loading="lazy">
  `).join("");
}

function applyPortfolioCardGradient(card, image) {
  if (!card || !image || !image.naturalWidth || !image.naturalHeight) {
    return;
  }

  const isLandscape = image.naturalWidth > (image.naturalHeight * 1.08);

  if (!isLandscape) {
    card.classList.remove("is-landscape");
    card.classList.add("is-portrait");
    card.style.removeProperty("--portfolio-card-image");
    return;
  }

  card.classList.remove("is-portrait");
  card.classList.add("is-landscape");
  card.style.setProperty("--portfolio-card-image", `url("${image.currentSrc || image.src}")`);
}

function decoratePortfolioCards(scope) {
  const cards = Array.from(scope.querySelectorAll(".portfolio-grid-item"));

  cards.forEach((card) => {
    if (card.dataset.decorated === "true") {
      return;
    }

    const image = card.querySelector("img");

    if (!image) {
      return;
    }

    card.dataset.decorated = "true";

    const updateCard = () => {
      applyPortfolioCardGradient(card, image);
    };

    if (image.complete) {
      updateCard();
    } else {
      image.addEventListener("load", updateCard, { once: true });
    }
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const CANONICAL_SPORTS = [
  { name: "Cricket", slug: "cricket", icon: "🏏" },
  { name: "Football", slug: "football", icon: "⚽" },
  { name: "Kushti", slug: "kushti", icon: "🤼" },
];

function normalizePortfolioSports(portfolioMedia) {
  const dataSports = [];

  if (Array.isArray(portfolioMedia?.sports) && portfolioMedia.sports.length > 0) {
    portfolioMedia.sports.forEach((sport) => {
      const sections = Array.isArray(sport.sections)
        ? sport.sections.filter((section) => Array.isArray(section.images) && section.images.length > 0)
        : [];

      if (sections.length === 0) {
        return;
      }

      const name = sport.name || "Portfolio";
      dataSports.push({
        name,
        slug: sport.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        sections,
      });
    });
  } else if (Array.isArray(portfolioMedia?.sections) && portfolioMedia.sections.length > 0) {
    const sections = portfolioMedia.sections.filter(
      (section) => Array.isArray(section.images) && section.images.length > 0
    );

    if (sections.length > 0) {
      dataSports.push({ name: "Cricket", slug: "cricket", sections });
    }
  }

  const bySlug = new Map(dataSports.map((sport) => [sport.slug, sport]));

  const navChips = CANONICAL_SPORTS.map((canonical) => {
    const dataSport = bySlug.get(canonical.slug);
    return {
      ...canonical,
      sections: dataSport ? dataSport.sections : [],
      hasData: Boolean(dataSport && dataSport.sections.length > 0),
    };
  });

  // Any extra sports from data that aren't in the canonical list (forward-compat)
  dataSports.forEach((sport) => {
    if (!CANONICAL_SPORTS.some((c) => c.slug === sport.slug)) {
      navChips.push({ ...sport, icon: "", hasData: true });
    }
  });

  return navChips;
}

function renderPortfolioMedia() {
  const heroImage = document.querySelector("[data-portfolio-hero-image]");
  const portfolioSectionsTarget = document.querySelector("[data-portfolio-sections]");
  const sportNavTarget = document.querySelector("[data-portfolio-sport-nav]");
  const portfolioMedia = window.PORTFOLIO_MEDIA;

  if (!portfolioMedia) {
    return;
  }

  if (heroImage && portfolioMedia.hero?.src) {
    heroImage.src = portfolioMedia.hero.src;
    heroImage.alt = portfolioMedia.hero.alt || heroImage.alt;
  }

  if (!portfolioSectionsTarget) {
    return;
  }

  const navSports = normalizePortfolioSports(portfolioMedia);
  const sports = navSports.filter((sport) => sport.hasData);

  if (sportNavTarget) {
    sportNavTarget.innerHTML = navSports
      .map((sport) => {
        const total = sport.sections.reduce((sum, s) => sum + s.images.length, 0);
        const icon = sport.icon ? `<span class="sport-nav-chip__icon" aria-hidden="true">${sport.icon}</span>` : "";
        const label = `<span class="sport-nav-chip__label">${escapeHtml(sport.name)}</span>`;

        if (!sport.hasData) {
          return `
            <span class="sport-nav-chip is-coming-soon" aria-disabled="true" title="${escapeHtml(sport.name)} coverage coming soon">
              ${icon}${label}
              <span class="sport-nav-chip__count">Coming Soon</span>
            </span>
          `;
        }

        return `
          <a class="sport-nav-chip" href="#sport-${escapeHtml(sport.slug)}" data-sport-target="${escapeHtml(sport.slug)}">
            ${icon}${label}
            <span class="sport-nav-chip__count">${total} shots</span>
          </a>
        `;
      })
      .join("");
  }

  if (sports.length === 0) {
    return;
  }

  const batchSize = 25;

  const createPortfolioCard = (item, sectionTitle) => {
    // Use a smaller width for grid thumbnails (faster loading); keep full-res URL on
    // data-src so the lightbox still opens the high-quality version.
    const thumbSrc = item.src.replace(/,w_\d+\//, ",w_800/");
    return `
    <button class="gallery-item portfolio-grid-item" type="button" data-src="${escapeHtml(item.src)}" data-alt="${escapeHtml(item.alt)}">
      <span aria-hidden="true"></span>
      <img src="${escapeHtml(thumbSrc)}" alt="${escapeHtml(item.alt)}" width="800" height="533" sizes="(max-width: 540px) 100vw, (max-width: 900px) 50vw, 33vw" loading="lazy" decoding="async" crossorigin="anonymous">
      <span class="portfolio-grid-item__caption"><span>${escapeHtml(sectionTitle)}</span></span>
    </button>
  `;
  };

  const sectionRefs = [];

  const renderedHtml = sports
    .map((sport) => {
      const sportSlug = escapeHtml(sport.slug);
      const sportName = escapeHtml(sport.name);
      const totalShots = sport.sections.reduce((sum, s) => sum + s.images.length, 0);

      const sectionsHtml = sport.sections
        .map((section) => {
          const sectionIndex = sectionRefs.length;
          sectionRefs.push({ section, sportSlug: sport.slug });
          const sectionSlug = escapeHtml(section.slug);
          const sectionTitle = escapeHtml(section.title);

          return `
            <section class="portfolio-gallery-block" id="${sectionSlug}">
              <div class="section-heading portfolio-section-heading">
                <div>
                  <p class="eyebrow">${sportName} · Collection</p>
                  <h2>${sectionTitle}</h2>
                </div>
                <span class="portfolio-section-count">${section.images.length} shots</span>
              </div>
              <div class="portfolio-grid" data-gallery="${sectionSlug}" data-section-index="${sectionIndex}" data-rendered="0"></div>
              <div class="portfolio-pagination" data-pagination="${sectionIndex}" hidden>
                <button class="button button-soft portfolio-load-more" type="button" data-load-more="${sectionIndex}">Load more from ${sectionTitle}</button>
              </div>
            </section>
          `;
        })
        .join("");

      return `
        <section class="portfolio-sport-group" id="sport-${sportSlug}" data-sport-group="${sportSlug}">
          <header class="portfolio-sport-header">
            <p class="eyebrow">Sport</p>
            <h2 class="portfolio-sport-title">${sportName}</h2>
            <p class="portfolio-sport-meta">${sport.sections.length} tournament${sport.sections.length === 1 ? "" : "s"} · ${totalShots} shots</p>
          </header>
          ${sectionsHtml}
        </section>
      `;
    })
    .join("");

  portfolioSectionsTarget.innerHTML = renderedHtml;

  const renderSectionBatch = (sectionIndex) => {
    const ref = sectionRefs[sectionIndex];

    if (!ref) {
      return;
    }

    const { section } = ref;
    const grid = portfolioSectionsTarget.querySelector(`[data-section-index="${sectionIndex}"]`);
    const pagination = portfolioSectionsTarget.querySelector(`[data-pagination="${sectionIndex}"]`);

    if (!grid || !pagination) {
      return;
    }

    const rendered = Number(grid.dataset.rendered || 0);
    const nextRendered = Math.min(rendered + batchSize, section.images.length);

    if (nextRendered <= rendered) {
      return;
    }

    grid.insertAdjacentHTML(
      "beforeend",
      section.images
        .slice(rendered, nextRendered)
        .map((item) => createPortfolioCard(item, section.title))
        .join("")
    );
    grid.dataset.rendered = String(nextRendered);
    decoratePortfolioCards(grid);

    if (nextRendered >= section.images.length) {
      pagination.hidden = true;
    } else {
      pagination.hidden = false;
    }
  };

  sectionRefs.forEach((_, index) => {
    renderSectionBatch(index);
  });

  portfolioSectionsTarget.querySelectorAll("[data-load-more]").forEach((button) => {
    button.addEventListener("click", () => {
      renderSectionBatch(Number(button.dataset.loadMore));
    });
  });

  if (sportNavTarget) {
    const chips = Array.from(sportNavTarget.querySelectorAll(".sport-nav-chip:not(.is-coming-soon)"));
    if (chips.length > 0) {
      chips[0].classList.add("is-active");
    }

    const groups = Array.from(portfolioSectionsTarget.querySelectorAll("[data-sport-group]"));

    if ("IntersectionObserver" in window && groups.length > 0) {
      const setActiveChip = (slug) => {
        chips.forEach((chip) => {
          chip.classList.toggle("is-active", chip.dataset.sportTarget === slug);
        });
      };

      const groupObserver = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

          if (visible) {
            setActiveChip(visible.target.dataset.sportGroup);
          }
        },
        { rootMargin: "-30% 0px -55% 0px", threshold: [0.1, 0.4] }
      );

      groups.forEach((group) => groupObserver.observe(group));
    }
  }
}

function setupSlider() {
  const sliderTrack = document.querySelector(".slider-track");
  const slideCards = Array.from(document.querySelectorAll(".slide-card"));
  const dotsContainer = document.querySelector("[data-slider-dots]");
  const sliderEl = document.querySelector(".image-slider");

  if (!sliderTrack || slideCards.length <= 1) {
    return;
  }

  let sliderIndex = 0;
  let intervalId = null;

  const visibleSlides = () => {
    if (window.innerWidth <= 760) return 1;
    if (window.innerWidth <= 1100) return 2;
    return 3;
  };

  const maxIndex = () => Math.max(slideCards.length - visibleSlides(), 0);

  // Build dots
  if (dotsContainer) {
    slideCards.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "slider-dot" + (i === 0 ? " is-active" : "");
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.addEventListener("click", () => {
        sliderIndex = Math.min(i, maxIndex());
        updateSlider();
      });
      dotsContainer.appendChild(dot);
    });
  }

  const updateDots = () => {
    if (!dotsContainer) return;
    Array.from(dotsContainer.children).forEach((dot, i) => {
      dot.classList.toggle("is-active", i === sliderIndex);
    });
  };

  const updateSlider = () => {
    const max = maxIndex();
    if (sliderIndex > max) sliderIndex = 0;
    const slideWidth = slideCards[0].getBoundingClientRect().width;
    const gap = parseFloat(window.getComputedStyle(sliderTrack).gap) || 0;
    sliderTrack.style.transform = `translateX(-${sliderIndex * (slideWidth + gap)}px)`;
    updateDots();
  };

  const advance = () => {
    sliderIndex = sliderIndex >= maxIndex() ? 0 : sliderIndex + 1;
    updateSlider();
  };

  const startInterval = () => {
    intervalId = window.setInterval(advance, 3200);
  };

  const stopInterval = () => {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  };

  // Pause on hover
  sliderEl?.addEventListener("mouseenter", stopInterval);
  sliderEl?.addEventListener("mouseleave", startInterval);

  // Swipe on mobile
  let touchStartX = 0;
  sliderEl?.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].clientX;
    stopInterval();
  }, { passive: true });

  sliderEl?.addEventListener("touchend", (e) => {
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 40) {
      sliderIndex = delta < 0
        ? Math.min(sliderIndex + 1, maxIndex())
        : Math.max(sliderIndex - 1, 0);
      updateSlider();
    }
    startInterval();
  }, { passive: true });

  window.addEventListener("resize", updateSlider);
  updateSlider();
  startInterval();
}

function setupInquireModal() {
  const modal = document.getElementById("inquire-modal");

  if (!modal) {
    return;
  }

  const card = modal.querySelector(".inquire-modal__card");
  const closeButton = modal.querySelector(".inquire-modal__close");
  const triggers = document.querySelectorAll("[data-open-inquire]");
  let lastFocusedTrigger = null;

  const openModal = (trigger) => {
    lastFocusedTrigger = trigger || document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    // Reset form state so re-opens after a successful submission show a fresh form.
    const contactForm = modal.querySelector(".contact-form");
    const formSuccess = modal.querySelector("#form-success");
    if (contactForm) {
      contactForm.hidden = false;
      contactForm.reset();
      const submitBtn = contactForm.querySelector(".submit-button");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Inquiry";
      }
    }
    if (formSuccess) {
      formSuccess.hidden = true;
    }

    const firstField = card?.querySelector("input:not([type=hidden]), textarea");
    window.setTimeout(() => firstField?.focus(), 60);
  };

  const closeModal = () => {
    if (!modal.classList.contains("is-open")) {
      return;
    }
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === "function") {
      lastFocusedTrigger.focus({ preventScroll: true });
    }
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openModal(trigger);
    });
  });

  closeButton?.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  });

  // Auto-close modal 2.5 s after a successful inquiry submission.
  window.addEventListener("inquiry-sent", () => {
    window.setTimeout(closeModal, 2500);
  });
}

function setupContactForm() {
  const form = document.querySelector(".contact-form");
  const successEl = document.getElementById("form-success");

  if (!form || !successEl) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector(".submit-button");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
    }

    try {
      const response = await fetch(window.location.pathname || "/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(new FormData(form)).toString(),
      });

      if (response.ok) {
        form.hidden = true;
        successEl.hidden = false;
        window.dispatchEvent(new CustomEvent("inquiry-sent"));
      } else {
        form.submit();
      }
    } catch {
      form.submit();
    }
  });
}

function setupLightbox() {
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightbox-image");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const closeButton = document.querySelector(".lightbox-close");
  const prevButton = document.querySelector(".lightbox-prev");
  const nextButton = document.querySelector(".lightbox-next");
  let activeIndex = 0;
  let activeItems = [];
  let touchStartX = 0;

  if (!lightbox || !lightboxImage || !lightboxCaption) {
    return;
  }

  const getLightboxItems = () => Array.from(document.querySelectorAll(".gallery-item, .slider-lightbox-item"));

  function updateLightbox(index) {
    const item = activeItems[index];

    if (!item) {
      return;
    }

    lightboxImage.src = item.dataset.src;
    lightboxImage.alt = item.dataset.alt || "";
    lightboxCaption.textContent = item.dataset.alt || "";
    activeIndex = index;
  }

  function openLightbox(index) {
    activeItems = getLightboxItems();
    updateLightbox(index);
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
  }

  function stepLightbox(direction) {
    if (activeItems.length === 0) {
      return;
    }

    const nextIndex = (activeIndex + direction + activeItems.length) % activeItems.length;
    updateLightbox(nextIndex);
  }

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest(".gallery-item, .slider-lightbox-item");

    if (!trigger) {
      return;
    }

    const items = getLightboxItems();
    const index = items.indexOf(trigger);

    if (index >= 0) {
      openLightbox(index);
    }
  });

  closeButton?.addEventListener("click", closeLightbox);
  prevButton?.addEventListener("click", () => stepLightbox(-1));
  nextButton?.addEventListener("click", () => stepLightbox(1));

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  lightbox.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });

  lightbox.addEventListener("touchend", (event) => {
    const deltaX = event.changedTouches[0].clientX - touchStartX;

    if (Math.abs(deltaX) > 40) {
      stepLightbox(deltaX > 0 ? -1 : 1);
    }
  }, { passive: true });

  window.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) {
      return;
    }

    if (event.key === "Escape") {
      closeLightbox();
    }

    if (event.key === "ArrowLeft") {
      stepLightbox(-1);
    }

    if (event.key === "ArrowRight") {
      stepLightbox(1);
    }
  });
}

async function renderHomeMedia() {
  const sliderTarget = document.querySelector("[data-slider-track]");
  const footerTarget = document.querySelector("[data-footer-gallery]");

  if (sliderTarget) {
    const sliderItems = Array.isArray(window.HOME_SLIDER_IMAGES) ? window.HOME_SLIDER_IMAGES : [];
    renderSlider(sliderItems);
  }

  if (footerTarget) {
    const footerItems = Array.isArray(window.FOOTER_GALLERY_IMAGES) ? window.FOOTER_GALLERY_IMAGES : [];
    renderFooterGallery(footerItems);
  }
}

async function init() {
  await renderHomeMedia();
  renderPortfolioMedia();
  setupNav();
  setupReveal();
  setupSlider();
  setupLightbox();
  setupInquireModal();
  setupContactForm();
}

init();

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

function renderPortfolioMedia() {
  const heroImage = document.querySelector("[data-portfolio-hero-image]");
  const portfolioSectionsTarget = document.querySelector("[data-portfolio-sections]");
  const portfolioMedia = window.PORTFOLIO_MEDIA;

  if (!portfolioMedia) {
    return;
  }

  if (heroImage && portfolioMedia.hero?.src) {
    heroImage.src = portfolioMedia.hero.src;
    heroImage.alt = portfolioMedia.hero.alt || heroImage.alt;
  }

  if (!portfolioSectionsTarget || !Array.isArray(portfolioMedia.sections) || portfolioMedia.sections.length === 0) {
    return;
  }

  const sections = portfolioMedia.sections
    .filter((section) => Array.isArray(section.images) && section.images.length > 0);

  const batchSize = 10;
  const createPortfolioCard = (item) => `
    <button class="gallery-item portfolio-grid-item" type="button" data-src="${item.src}" data-alt="${item.alt}">
      <span aria-hidden="true"></span>
      <img src="${item.src}" alt="${item.alt}" width="1600" height="1100" sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw" loading="lazy" decoding="async" crossorigin="anonymous">
    </button>
  `;

  const renderedSections = sections
    .map((section, index) => `
      <section class="portfolio-gallery-block" id="${section.slug}">
        <div class="section-heading portfolio-section-heading">
          <div>
            <p class="eyebrow">Portfolio Collection</p>
            <h2>${section.title}</h2>
          </div>
        </div>
        <div class="portfolio-grid" data-gallery="${section.slug}" data-section-index="${index}" data-rendered="0">
        </div>
        <div class="portfolio-pagination" data-pagination="${index}" hidden>
          <button class="button button-soft portfolio-load-more" type="button" data-load-more="${index}">Load More</button>
        </div>
      </section>
    `)
    .join("");

  portfolioSectionsTarget.innerHTML = renderedSections;

  const renderSectionBatch = (sectionIndex) => {
    const section = sections[sectionIndex];
    const grid = portfolioSectionsTarget.querySelector(`[data-section-index="${sectionIndex}"]`);
    const pagination = portfolioSectionsTarget.querySelector(`[data-pagination="${sectionIndex}"]`);

    if (!section || !grid || !pagination) {
      return;
    }

    const rendered = Number(grid.dataset.rendered || 0);
    const nextRendered = Math.min(rendered + batchSize, section.images.length);

    if (nextRendered <= rendered) {
      return;
    }

    grid.insertAdjacentHTML(
      "beforeend",
      section.images.slice(rendered, nextRendered).map(createPortfolioCard).join("")
    );
    grid.dataset.rendered = String(nextRendered);
    decoratePortfolioCards(grid);

    if (nextRendered === 0 || nextRendered >= section.images.length) {
      pagination.hidden = true;
    } else {
      pagination.hidden = false;
    }
  };

  sections.forEach((_, index) => {
    renderSectionBatch(index);
  });

  const loadMoreButtons = Array.from(portfolioSectionsTarget.querySelectorAll("[data-load-more]"));

  loadMoreButtons.forEach((button) => {
    button.addEventListener("click", () => {
      renderSectionBatch(Number(button.dataset.loadMore));
    });
  });

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
  setupContactForm();
}

init();

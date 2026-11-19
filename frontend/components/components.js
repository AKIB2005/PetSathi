/**
 * PetSathi Reusable Header and Footer Component Loader
 * Dynamically resolves relative paths and injects the shared header & footer.
 */
(function () {
  if (window.__PETSATHI_COMPONENTS_LOADED__) return;

  function getRootPrefix() {
    const headerEl = document.getElementById("header");
    if (headerEl && headerEl.getAttribute("data-root") !== null) {
      return headerEl.getAttribute("data-root");
    }

    const path = (window.location.pathname || "").replace(/\\/g, "/");
    const marker = "frontend/pages/";
    const idx = path.indexOf(marker);
    if (idx !== -1) {
      const sub = path.substring(idx + marker.length);
      const segments = sub.split("/").filter(Boolean);
      const depth = 2 + (segments.length - 1);
      return "../".repeat(depth);
    }

    const scripts = document.querySelectorAll("script[src]");
    for (const s of scripts) {
      const src = s.getAttribute("src") || "";
      if (src.includes("components.js") || src.includes("main.js")) {
        const parts = src.split("/js/")[0].split("/components/")[0];
        if (parts === "frontend" || parts === "./frontend") {
          return "";
        }
        const count = (parts.match(/\.\.\//g) || []).length;
        if (count > 0) {
          return "../".repeat(count + 1);
        }
      }
    }

    return "";
  }

  function adjustRelativeLinks(html, rootPrefix) {
    if (!rootPrefix) return html;
    return html.replace(/\bhref="([^"]+)"/g, (match, href) => {
      if (
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return match;
      }
      return 'href="' + rootPrefix + href + '"';
    });
  }

  const RAW_HEADER_HTML = `<header class="site-header">
    <a class="brand" href="index.html" aria-label="PetSathi home"><svg class="brand-mark" aria-hidden="true"
        viewBox="0 0 40 40" role="img" focusable="false">
        <circle cx="12" cy="12" r="4" fill="currentColor" />
        <circle cx="21" cy="8" r="4" fill="currentColor" />
        <circle cx="30" cy="12" r="4" fill="currentColor" />
        <path d="M20 17c-6 0-11 5-11 11 0 4 3 6 6 6 2 0 3-2 5-2s3 2 5 2c4 0 6-2 6-6 0-6-5-11-11-11Z"
          fill="currentColor" />
      </svg><span>Pet<span>Sathi</span></span></a>
    <button class="menu-toggle" aria-label="Toggle navigation" aria-expanded="false">
      <i class="fa-solid fa-bars" aria-hidden="true"></i>
    </button>
    <nav class="main-nav" aria-label="Main navigation">
      <a href="index.html">Home</a>
      <div class="nav-item">
        <a href="frontend/pages/pets/index.html">Explore Pets
          <span class="nav-arrow" aria-hidden="true">&#x25BE;</span></a>
        <div class="dropdown dropdown-explore">
          <a href="frontend/pages/pets/dogs/index.html">Dogs</a><a href="frontend/pages/pets/cats/index.html">Cats</a><a
            href="frontend/pages/pets/birds/index.html">Birds</a><a
            href="frontend/pages/pets/rabbits/index.html">Rabbits</a><a
            href="frontend/pages/pets/other/fish.html">Aquarium Fish</a><a
            href="frontend/pages/pets/other/reptiles.html">Reptiles</a>
        </div>
      </div>
      <div class="nav-item">
        <a href="frontend/pages/services/index.html">Services
          <span class="nav-arrow" aria-hidden="true">&#x25BE;</span></a>
        <div class="dropdown dropdown-services">
          <a href="frontend/pages/services/dog-walking.html">Dog Walking</a><a
            href="frontend/pages/services/cat-care.html">Cat Care</a><a href="frontend/pages/services/pet-care.html">Pet
            Care</a>
        </div>
      </div>
      <div class="nav-item">
        <a href="frontend/pages/walker/index.html">Find a Walker
          <span class="nav-arrow" aria-hidden="true">&#x25BE;</span></a>
        <div class="dropdown dropdown-walker">
          <a href="frontend/pages/walker/dogs.html">Search Walkers</a><a href="frontend/pages/walker/cats.html">Walker
            Profiles</a><a href="frontend/pages/walker/index.html#bookings">My Bookings</a>
        </div>
      </div>
      <a href="frontend/pages/about.html">About Us</a><a href="frontend/pages/auth/login.html">Log in</a><a
        class="button button-small" href="frontend/pages/auth/register.html">Get Started</a>
    </nav>
  </header>`;

  const RAW_FOOTER_HTML = `<footer class="footer">
  <!-- Left Decor: Hills + Dog + Cat + Heart -->
  <div class="footer-decor-left" aria-hidden="true">
    <svg viewBox="0 0 250 110" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; display: block;">
      <path d="M0 110 L0 72 Q70 66 145 80 T250 110 L250 110 Z" fill="#144b2d" />
      <path d="M0 110 L0 84 Q80 76 160 88 T250 110 L250 110 Z" fill="#1b613a" />
      <!-- Dog and Cat sitting directly on baseline Y=110 -->
      <g transform="translate(6, 18)" fill="#eef6f0">
        <!-- Dog -->
        <path d="M 44 34 L 50 34 L 52 36 L 53 36 L 54 37 L 56 37 L 57 36 L 60 36 L 60 41 L 59 42 L 59 43 L 58 44 L 56 44 L 55 45 L 53 45 L 51 47 L 51 48 L 50 49 L 50 53 L 51 54 L 51 57 L 52 58 L 52 65 L 51 66 L 51 68 L 50 69 L 50 70 L 49 71 L 49 74 L 48 75 L 48 80 L 49 81 L 49 85 L 50 86 L 51 86 L 52 87 L 52 88 L 51 88 L 50 89 L 47 89 L 46 88 L 43 88 L 42 89 L 27 89 L 26 88 L 25 88 L 23 86 L 17 86 L 14 83 L 13 83 L 13 82 L 12 81 L 12 75 L 13 74 L 13 73 L 14 72 L 14 71 L 15 70 L 15 65 L 16 66 L 16 72 L 15 73 L 15 75 L 14 76 L 14 78 L 15 79 L 15 80 L 18 83 L 21 83 L 22 82 L 22 81 L 21 80 L 21 78 L 22 77 L 22 74 L 23 73 L 23 72 L 24 71 L 24 70 L 26 68 L 26 67 L 34 59 L 34 58 L 36 56 L 36 55 L 37 54 L 37 53 L 38 52 L 38 51 L 37 50 L 36 50 L 35 49 L 34 49 L 34 48 L 33 47 L 34 46 L 34 45 L 36 43 L 36 42 L 37 41 L 37 40 L 39 38 L 39 37 L 40 36 L 41 36 L 42 35 L 43 35 Z" />
        <!-- Cat -->
        <path d="M 61 65 L 73 65 L 74 66 L 74 67 L 73 68 L 73 69 L 72 70 L 72 72 L 77 77 L 77 78 L 78 79 L 78 87 L 79 88 L 81 88 L 83 90 L 83 91 L 84 92 L 85 92 L 58 92 L 58 88 L 59 87 L 59 86 L 58 85 L 58 80 L 59 79 L 59 77 L 60 76 L 60 75 L 63 72 L 63 71 L 61 69 L 61 66 Z" />
      </g>
      <!-- Heart outline -->
      <path d="M89 72 C85.5 68 82.5 64.5 82.5 61.5 C82.5 59 84.5 57.5 87 57.5 C88.5 57.5 89.5 58.5 90 59.5 C90.5 58.5 91.5 57.5 93 57.5 C95.5 57.5 97.5 59 97.5 61.5 C97.5 64.5 93.5 68 89 72 Z" fill="none" stroke="#eef6f0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </div>

  <!-- Right Decor: Hills + Climbing Paws -->
  <div class="footer-decor-right" aria-hidden="true">
    <svg viewBox="0 0 240 110" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; display: block;">
      <path d="M0 110 Q70 98 140 76 T240 46 L240 110 Z" fill="#144b2d" />
      <path d="M0 110 Q80 102 150 86 T240 64 L240 110 Z" fill="#1b613a" />
      <!-- Climbing Paw 1 -->
      <g fill="#eef6f0" transform="translate(132, 68) scale(0.68) rotate(-14)">
        <ellipse cx="16" cy="18" rx="8.5" ry="7" />
        <circle cx="8" cy="8" r="3" />
        <circle cx="14" cy="5" r="3.2" />
        <circle cx="20" cy="6" r="3.2" />
        <circle cx="25" cy="10" r="2.8" />
      </g>
      <!-- Climbing Paw 2 -->
      <g fill="#eef6f0" transform="translate(182, 38) scale(0.76) rotate(14)">
        <ellipse cx="16" cy="18" rx="8.5" ry="7" />
        <circle cx="8" cy="8" r="3" />
        <circle cx="14" cy="5" r="3.2" />
        <circle cx="20" cy="6" r="3.2" />
        <circle cx="25" cy="10" r="2.8" />
      </g>
    </svg>
  </div>

  <div class="footer-container section-wrap">
    <div class="footer-grid">
      <!-- Col 1: Brand & Social -->
      <div class="footer-col">
        <a class="brand footer-brand" href="index.html" aria-label="PetSathi home">
          <i class="fa-solid fa-paw footer-brand-paw" aria-hidden="true"></i>
          <span class="footer-brand-name">PetSathi</span>
        </a>
        <div class="footer-brand-accent"></div>
        <p class="footer-desc">
          Your pet's trusted companion. Making pet care easier, one paw at a time.
        </p>
        <div class="footer-social-row">
          <a href="https://www.youtube.com/@Riya-Kharade" target="_blank" rel="noopener noreferrer" aria-label="YouTube" class="footer-social-btn">
            <i class="fa-brands fa-youtube" aria-hidden="true"></i>
          </a>
          <a href="https://www.instagram.com/riiyyyaaaa16?cplk=MWdleXI5azdhYXlsdA%3D%3D" target="_blank" rel="noopener noreferrer" aria-label="Instagram" class="footer-social-btn">
            <i class="fa-brands fa-instagram" aria-hidden="true"></i>
          </a>
          <a href="https://www.linkedin.com/in/riyakharade/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" class="footer-social-btn">
            <i class="fa-brands fa-linkedin-in" aria-hidden="true"></i>
          </a>
          <a href="https://github.com/Riya-Kharade" target="_blank" rel="noopener noreferrer" aria-label="GitHub" class="footer-social-btn">
            <i class="fa-brands fa-github" aria-hidden="true"></i>
          </a>
        </div>
      </div>

      <!-- Col 2: Explore -->
      <div class="footer-col">
        <h3 class="footer-heading">
          <i class="fa-solid fa-table-cells-large" aria-hidden="true"></i>
          <span>Explore</span>
        </h3>
        <ul class="footer-links">
          <li>
            <a href="index.html">
              <i class="fa-solid fa-house" aria-hidden="true"></i>
              <span>Home</span>
            </a>
          </li>
          <li>
            <a href="frontend/pages/pets/index.html">
              <i class="fa-solid fa-paw" aria-hidden="true"></i>
              <span>Explore Pets</span>
            </a>
          </li>
          <li>
            <a href="frontend/pages/services/index.html">
              <i class="fa-solid fa-heart" aria-hidden="true"></i>
              <span>Services</span>
            </a>
          </li>
          <li>
            <a href="frontend/pages/walker/index.html">
              <i class="fa-solid fa-person-walking" aria-hidden="true"></i>
              <span>Find a Walker</span>
            </a>
          </li>
        </ul>
      </div>

      <!-- Col 3: Information -->
      <div class="footer-col">
        <h3 class="footer-heading">
          <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
          <span>Information</span>
        </h3>
        <ul class="footer-links">
          <li>
            <a href="frontend/pages/about.html">
              <i class="fa-solid fa-user-group" aria-hidden="true"></i>
              <span>About Us</span>
            </a>
          </li>
          <li>
            <a href="frontend/pages/contact.html">
              <i class="fa-solid fa-envelope" aria-hidden="true"></i>
              <span>Contact Us</span>
            </a>
          </li>
          <li>
            <a href="frontend/pages/faq.html">
              <i class="fa-solid fa-circle-question" aria-hidden="true"></i>
              <span>FAQ / Help Center</span>
            </a>
          </li>
          <li>
            <a href="#privacy">
              <i class="fa-solid fa-shield-halved" aria-hidden="true"></i>
              <span>Privacy Policy</span>
            </a>
          </li>
          <li>
            <a href="#terms">
              <i class="fa-solid fa-file-contract" aria-hidden="true"></i>
              <span>Terms & Conditions</span>
            </a>
          </li>
          <li>
            <a href="frontend/pages/sitemap.html">
              <i class="fa-solid fa-sitemap" aria-hidden="true"></i>
              <span>Sitemap</span>
            </a>
          </li>
        </ul>
      </div>

      <!-- Col 4: Connect With Us -->
      <div class="footer-col">
        <h3 class="footer-heading">
          <i class="fa-solid fa-link" aria-hidden="true"></i>
          <span>Connect With Us</span>
        </h3>
        <ul class="footer-links">
          <li>
            <a href="https://github.com/Riya-Kharade" target="_blank" rel="noopener noreferrer">
              <i class="fa-brands fa-github" aria-hidden="true"></i>
              <span>GitHub</span>
            </a>
          </li>
          <li>
            <a href="https://www.linkedin.com/in/riyakharade/" target="_blank" rel="noopener noreferrer">
              <i class="fa-brands fa-linkedin" aria-hidden="true"></i>
              <span>LinkedIn</span>
            </a>
          </li>
          <li>
            <a href="https://petsathi-nsoc.netlify.app/" target="_blank" rel="noopener noreferrer">
              <i class="fa-solid fa-globe" aria-hidden="true"></i>
              <span>Live Website</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Bottom Bar -->
  <div class="footer-bottom">
    <div class="footer-bottom-wrap section-wrap">
      <span>&copy; <span id="year">2026</span> PetSathi. All rights reserved.</span>
      <div class="footer-bottom-center">
        <i class="fa-solid fa-paw footer-bottom-paw" aria-hidden="true"></i>
        <span class="footer-bottom-sep">|</span>
        <span>Made with <i class="fa-solid fa-heart footer-bottom-heart" aria-hidden="true"></i> for pets.</span>
        <span class="footer-bottom-sep">|</span>
        <i class="fa-solid fa-paw footer-bottom-paw" aria-hidden="true"></i>
      </div>
      <span class="footer-marathi">&#x0924;&#x0941;&#x092E;&#x091A;&#x094D;&#x092F;&#x093E; Pet &#x091A;&#x093E; &#x0935;&#x093F;&#x0936;&#x094D;&#x0935;&#x093E;&#x0938;&#x0942; &#x0938;&#x093E;&#x0925;&#x0940;!</span>
    </div>
  </div>
</footer>
`;

  async function loadHtml(url, fallbackRaw) {
    try {
      if (window.location.protocol === "file:") {
        return fallbackRaw;
      }
      const res = await fetch(url);
      if (res.ok) {
        return await res.text();
      }
    } catch (e) {
      // CORS or offline fallback
    }
    return fallbackRaw;
  }

  function initHeaderInteractions() {
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".main-nav");

    if (toggle && nav && !toggle.__petsathi_bound) {
      toggle.__petsathi_bound = true;

      toggle.addEventListener("click", () => {
        const open = nav.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
        toggle.innerHTML = open
          ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>'
          : '<i class="fa-solid fa-bars" aria-hidden="true"></i>';

        if (!open) {
          nav.querySelectorAll(".nav-item.is-open").forEach((item) => {
            item.classList.remove("is-open");
            const parentLink = item.querySelector(":scope > a");
            if (parentLink) {
              parentLink.setAttribute("aria-expanded", "false");
            }
          });
        }
      });

      const navItemsWithDropdown = nav.querySelectorAll(".nav-item");
      navItemsWithDropdown.forEach((item) => {
        const parentLink = item.querySelector(":scope > a");
        const dropdown = item.querySelector(".dropdown");

        if (parentLink && dropdown && !parentLink.__petsathi_bound) {
          parentLink.__petsathi_bound = true;
          parentLink.setAttribute("aria-haspopup", "true");
          parentLink.setAttribute("aria-expanded", "false");

          parentLink.addEventListener("click", (e) => {
            if (window.innerWidth <= 850) {
              e.preventDefault();
              const isOpen = item.classList.toggle("is-open");
              parentLink.setAttribute("aria-expanded", String(isOpen));

              navItemsWithDropdown.forEach((otherItem) => {
                if (otherItem !== item && otherItem.classList.contains("is-open")) {
                  otherItem.classList.remove("is-open");
                  const otherLink = otherItem.querySelector(":scope > a");
                  if (otherLink) {
                    otherLink.setAttribute("aria-expanded", "false");
                  }
                }
              });
            }
          });
        }
      });

      nav.querySelectorAll("a").forEach((link) => {
        if (
          link.closest(".nav-item") &&
          link.parentElement.classList.contains("nav-item") &&
          link.nextElementSibling?.classList.contains("dropdown")
        ) {
          return;
        }

        link.addEventListener("click", () => {
          if (window.innerWidth <= 850) {
            nav.classList.remove("open");
            toggle.setAttribute("aria-expanded", "false");
            toggle.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';

            nav.querySelectorAll(".nav-item.is-open").forEach((item) => {
              item.classList.remove("is-open");
              const parentLink = item.querySelector(":scope > a");
              if (parentLink) {
                parentLink.setAttribute("aria-expanded", "false");
              }
            });
          }
        });
      });

      window.addEventListener("resize", () => {
        if (window.innerWidth > 850) {
          nav.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
          toggle.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
          nav.querySelectorAll(".nav-item.is-open").forEach((item) => {
            item.classList.remove("is-open");
            const parentLink = item.querySelector(":scope > a");
            if (parentLink) {
              parentLink.setAttribute("aria-expanded", "false");
            }
          });
        }
      });
    }

    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  }

  async function loadComponents() {
    window.__PETSATHI_COMPONENTS_LOADED__ = true;
    const rootPrefix = getRootPrefix();

    const headerPlaceholder =
      document.getElementById("header") ||
      document.getElementById("site-header") ||
      document.getElementById("header-placeholder");

    const footerPlaceholder =
      document.getElementById("footer") ||
      document.getElementById("site-footer") ||
      document.getElementById("footer-placeholder");

    const promises = [];

    if (headerPlaceholder) {
      const headerUrl = rootPrefix + "frontend/components/header.html";
      promises.push(
        loadHtml(headerUrl, RAW_HEADER_HTML).then((html) => {
          headerPlaceholder.innerHTML = adjustRelativeLinks(html, rootPrefix);
          initHeaderInteractions();
        })
      );
    } else {
      initHeaderInteractions();
    }

    if (footerPlaceholder) {
      const footerUrl = rootPrefix + "frontend/components/footer.html";
      promises.push(
        loadHtml(footerUrl, RAW_FOOTER_HTML).then((html) => {
          footerPlaceholder.innerHTML = adjustRelativeLinks(html, rootPrefix);
          const year = document.getElementById("year");
          if (year) year.textContent = new Date().getFullYear();
        })
      );
    }

    await Promise.all(promises);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadComponents);
  } else {
    loadComponents();
  }

  window.loadPetSathiComponents = loadComponents;
})();

/**
 * PetSathi Main Application & Global Layout Script
 * Handles reusable header & footer component rendering, mobile navigation drawer,
 * sub-accordions, and dynamic year.
 */

(function () {
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
      if (src.includes("main.js") || src.includes("components.js")) {
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
    <div class="section-wrap footer-grid">
      <div>
        <a class="brand" href="index.html" aria-label="PetSathi home"><svg class="brand-mark" aria-hidden="true"
            viewBox="0 0 40 40" role="img" focusable="false">
            <circle cx="12" cy="12" r="4" fill="currentColor" />
            <circle cx="21" cy="8" r="4" fill="currentColor" />
            <circle cx="30" cy="12" r="4" fill="currentColor" />
            <path d="M20 17c-6 0-11 5-11 11 0 4 3 6 6 6 2 0 3-2 5-2s3 2 5 2c4 0 6-2 6-6 0-6-5-11-11-11Z"
              fill="currentColor" />
          </svg><span>Pet<span>Sathi</span></span></a>
        <p>
          Your pet's trusted companion. Making pet care easier, one paw at a
          time.
        </p>
      </div>
      <div>
        <b>Explore</b><a href="index.html#home">Home</a><a href="frontend/pages/pets/index.html">Explore Pets</a><a
          href="frontend/pages/services/index.html">Services</a><a href="frontend/pages/walker/index.html">Find a
          Walker</a>
      </div>
      <div>
        <b>Information</b><a href="frontend/pages/about.html">About Us</a><a href="frontend/pages/contact.html">Contact
          Us</a><a href="frontend/pages/faq.html">FAQ / Help Center</a><a
          href="frontend/pages/community-guidelines.html">Community Guidelines</a><a href="#privacy">Privacy Policy</a><a
          href="#terms">Terms &amp; Conditions</a><a href="frontend/pages/cookie-policy.html">Cookie Policy</a><a href="frontend/pages/disclaimer.html">Disclaimer</a>      </div>
      <div>
        <b>Connect With Us</b><a href="https://github.com/Riya-Kharade/PetSathi" target="_blank"
          rel="noopener noreferrer">GitHub</a><a href="https://www.linkedin.com/in/riyakharade/" target="_blank"
          rel="noopener noreferrer">LinkedIn</a><a href="https://petsathi-nsoc.netlify.app/" target="_blank"
          rel="noopener noreferrer">Live Website</a>
      </div>
    </div>
    <div class="section-wrap footer-bottom">
      <span>&copy; 2026 PetSathi. All rights reserved.</span><span>Made with &hearts; for
        pets.</span><span>&#x0924;&#x0941;&#x092E;&#x091A;&#x094D;&#x092F;&#x093E; Pet
        &#x091A;&#x093E;
        &#x0935;&#x093F;&#x0936;&#x094D;&#x0935;&#x093E;&#x0938;&#x0942;
        &#x0938;&#x093E;&#x0925;&#x0940;!</span>
    </div>
  </footer>`;

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

  function initNav() {
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".main-nav");

    if (toggle && nav && !toggle.__petsathi_bound) {
      toggle.__petsathi_bound = true;

      // 1. Mobile menu toggle button
      toggle.addEventListener("click", () => {
        const open = nav.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
        toggle.innerHTML = open
          ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>'
          : '<i class="fa-solid fa-bars" aria-hidden="true"></i>';

        // Reset any open sub-accordions when closing the drawer
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

      // 2. Mobile accordion toggle for dropdown parents
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

      // 3. Close drawer ONLY on leaf navigation link clicks
      nav.querySelectorAll("a").forEach((link) => {
        if (
          link.closest(".nav-item") &&
          link.parentElement.classList.contains(".nav-item") &&
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

      // 4. Handle resize from mobile to desktop
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
    if (window.__PETSATHI_COMPONENTS_LOADED__) {
      initNav();
      return;
    }
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
          initNav();
        })
      );
    } else {
      initNav();
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

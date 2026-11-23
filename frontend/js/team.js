/**
 * PetSathi - Dynamic Team & Contributors Leaderboard
 * frontend/js/team.js
 * 
 * Fetches dynamic contributor data and project admin profile directly from the GitHub REST API.
 * Supports URL validation, robust pagination, rate-limit awareness, caching, podium awards,
 * and responsive rendering.
 */

(function () {
  "use strict";

  // Configuration & Defaults
  const DEFAULT_REPO_URL = "https://github.com/Riya-Kharade/PetSathi";
  const DEFAULT_OWNER = "Riya-Kharade";
  const DEFAULT_REPO = "PetSathi";
  const PER_PAGE = 100;

  // In-memory caches to avoid repeated API requests
  const contributorCache = new Map(); // key: "owner/repo?page=X" -> { data, headers }
  const adminCache = new Map();       // key: "username" -> user data

  // Global state for current view
  let currentOwner = DEFAULT_OWNER;
  let currentRepo = DEFAULT_REPO;
  let allContributors = [];
  let currentPage = 1;
  let hasNextPage = false;
  let isLoading = false;

  // DOM Elements
  let repoForm;
  let repoUrlInput;
  let clearRepoBtn;
  let loadContributorsBtn;
  let apiStatusBox;
  let adminCardContainer;
  let adminLoading;
  let adminError;
  let leaderboardLoading;
  let leaderboardEmpty;
  let podiumWrapper;
  let podiumGrid;
  let remainingWrapper;
  let remainingHeader;
  let contributorsGrid;
  let paginationContainer;
  let loadMoreBtn;
  let paginationInfo;
  let totalContribsCountEl;
  let totalContribsPeopleEl;
  let includeAdminToggle;
  let quickChipBtn;

  /**
   * Helper: Escape HTML to avoid XSS vulnerabilities when inserting user-generated strings
   */
  function escapeHtml(str) {
    if (typeof str !== "string") return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Helper: Parse GitHub Link header to detect pagination URLs
   */
  function parseLinkHeader(header) {
    if (!header) return {};
    const links = {};
    const parts = header.split(",");
    parts.forEach((part) => {
      const section = part.split(";");
      if (section.length !== 2) return;
      const urlMatch = section[0].match(/<(.*)>/);
      const relMatch = section[1].match(/rel="(.*)"/);
      if (urlMatch && relMatch) {
        links[relMatch[1].trim()] = urlMatch[1].trim();
      }
    });
    return links;
  }

  /**
   * Parse and validate GitHub repository input string
   * Accepts:
   *  - https://github.com/owner/repo
   *  - http://github.com/owner/repo
   *  - github.com/owner/repo
   *  - owner/repo
   *  - with trailing slash or .git suffix
   */
  function parseRepoUrl(input) {
    if (!input || typeof input !== "string") {
      return { isValid: false, error: "Please enter a repository URL or owner/repo path." };
    }

    const trimmed = input.trim();
    if (!trimmed) {
      return { isValid: false, error: "Repository URL cannot be empty." };
    }

    // Check for disallowed non-GitHub domains
    if (/^(https?:\/\/)?(www\.)?(gitlab\.com|bitbucket\.org|gitee\.com|sourceforge\.net)/i.test(trimmed)) {
      return { isValid: false, error: "Only GitHub repositories are supported. Please enter a valid github.com URL." };
    }

    // Match standard GitHub URLs or shorthand owner/repo
    // 1. Full URL: https://github.com/owner/repo[.git][/]
    const fullUrlRegex = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+?)(?:\.git|\/)?(?:[?#].*)?$/;
    const fullMatch = trimmed.match(fullUrlRegex);
    if (fullMatch) {
      const owner = fullMatch[1];
      const repo = fullMatch[2].replace(/\.git$/i, "");
      if (owner && repo && owner !== "search" && owner !== "explore" && owner !== "settings") {
        return { isValid: true, owner, repo };
      }
    }

    // 2. Shorthand: owner/repo
    const shorthandRegex = /^([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+?)(?:\.git|\/)?$/;
    const shortMatch = trimmed.match(shorthandRegex);
    if (shortMatch) {
      const owner = shortMatch[1];
      const repo = shortMatch[2].replace(/\.git$/i, "");
      if (owner && repo && !owner.includes(":") && !owner.includes(".")) {
        return { isValid: true, owner, repo };
      }
    }

    return {
      isValid: false,
      error: "Invalid repository format. Please enter a valid URL like: https://github.com/Riya-Kharade/PetSathi or owner/repository"
    };
  }

  /**
   * Display status or error alert messages
   */
  function showAlert(message, type = "error") {
    if (!apiStatusBox) return;
    apiStatusBox.className = `api-alert api-alert-${type} is-visible`;
    
    let iconClass = "fa-solid fa-circle-exclamation";
    if (type === "warning") iconClass = "fa-solid fa-triangle-exclamation";
    if (type === "info") iconClass = "fa-solid fa-circle-info";

    apiStatusBox.innerHTML = `
      <i class="${iconClass}" aria-hidden="true"></i>
      <div>${message}</div>
    `;
    apiStatusBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideAlert() {
    if (!apiStatusBox) return;
    apiStatusBox.className = "api-alert";
    apiStatusBox.innerHTML = "";
  }

  /**
   * Fetch GitHub public user details for the Project Admin
   */
  async function fetchAdminDetails(username) {
    if (!username) return;

    if (adminCache.has(username)) {
      renderAdminProfile(adminCache.get(username));
      return;
    }

    try {
      if (adminLoading) adminLoading.style.display = "block";
      if (adminError) adminError.style.display = "none";

      const url = `https://api.github.com/users/${encodeURIComponent(username)}`;
      const response = await fetch(url, {
        headers: { Accept: "application/vnd.github.v3+json" }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Admin profile for @${username} was not found on GitHub.`);
        }
        if (response.status === 403) {
          const resetHeader = response.headers.get("x-ratelimit-reset");
          const resetTime = resetHeader ? new Date(resetHeader * 1000).toLocaleTimeString() : "";
          throw new Error(`GitHub rate limit reached while loading admin profile. Resets at ${resetTime}.`);
        }
        throw new Error(`Failed to load admin profile (HTTP ${response.status}).`);
      }

      const userData = await response.json();
      adminCache.set(username, userData);
      renderAdminProfile(userData);
    } catch (err) {
      console.warn("Could not fetch admin details:", err);
      renderAdminFallback(username, err.message);
    } finally {
      if (adminLoading) adminLoading.style.display = "none";
    }
  }

  /**
   * Render the Project Admin profile card
   */
  function renderAdminProfile(user) {
    if (!adminCardContainer) return;

    const name = user.name || user.login;
    const login = user.login;
    const avatar = user.avatar_url || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80`;
    const htmlUrl = user.html_url || `https://github.com/${login}`;
    const bio = user.bio ? escapeHtml(user.bio) : "PetSathi Project Admin and community maintainer passionate about animal wellness and open source.";
    const location = user.location ? escapeHtml(user.location) : "Global Open Source Community";
    const publicRepos = typeof user.public_repos === "number" ? user.public_repos : null;
    const followers = typeof user.followers === "number" ? user.followers : null;

    adminCardContainer.innerHTML = `
      <article class="admin-profile-card">
        <span class="admin-ribbon">
          <i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Project Admin
        </span>
        <div class="admin-card-inner">
          <div class="admin-avatar-wrap">
            <img 
              src="${escapeHtml(avatar)}" 
              alt="${escapeHtml(name)}'s GitHub profile picture" 
              class="admin-avatar" 
              loading="lazy"
              onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=286849&color=ffffff&size=120';"
            />
            <span class="admin-badge-indicator" title="Project Admin Verified" aria-hidden="true">
              <i class="fa-solid fa-check"></i>
            </span>
          </div>
          <div class="admin-info">
            <h3 class="admin-name">${escapeHtml(name)}</h3>
            <span class="admin-username">@${escapeHtml(login)}</span>
            <p class="admin-bio">${bio}</p>
            <div class="admin-meta">
              <span class="admin-meta-item">
                <i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${location}
              </span>
              ${publicRepos !== null ? `
                <span class="admin-meta-item">
                  <i class="fa-solid fa-code-branch" aria-hidden="true"></i> ${publicRepos} Public Repos
                </span>
              ` : ""}
              ${followers !== null ? `
                <span class="admin-meta-item">
                  <i class="fa-solid fa-users" aria-hidden="true"></i> ${followers} Followers
                </span>
              ` : ""}
            </div>
            <div class="admin-actions">
              <a 
                href="${escapeHtml(htmlUrl)}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="admin-profile-btn"
                aria-label="View ${escapeHtml(login)} on GitHub (opens in a new tab)"
              >
                <i class="fa-brands fa-github" aria-hidden="true"></i> View GitHub Profile
                <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
              </a>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Fallback for Admin profile in case of offline / rate-limit / errors
   */
  function renderAdminFallback(username, errorMessage) {
    if (!adminCardContainer) return;
    adminCardContainer.innerHTML = `
      <article class="admin-profile-card">
        <span class="admin-ribbon">
          <i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Project Admin
        </span>
        <div class="admin-card-inner">
          <div class="admin-avatar-wrap">
            <img 
              src="https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=286849&color=ffffff&size=120" 
              alt="${escapeHtml(username)}'s profile placeholder" 
              class="admin-avatar"
            />
          </div>
          <div class="admin-info">
            <h3 class="admin-name">${escapeHtml(username)}</h3>
            <span class="admin-username">@${escapeHtml(username)}</span>
            <p class="admin-bio">PetSathi Project Admin and open-source maintainer.</p>
            <p style="font-size: 0.82rem; color: #a82323; margin: 4px 0 14px;">
              <i class="fa-solid fa-circle-info"></i> ${escapeHtml(errorMessage || "Live profile details temporarily unavailable.")}
            </p>
            <div class="admin-actions">
              <a 
                href="https://github.com/${encodeURIComponent(username)}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="admin-profile-btn"
              >
                <i class="fa-brands fa-github" aria-hidden="true"></i> Open GitHub Profile
              </a>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Fetch contributors from GitHub REST API
   */
  async function fetchContributors(owner, repo, page = 1, append = false) {
    const cacheKey = `${owner}/${repo}?page=${page}&per_page=${PER_PAGE}`;

    if (!append) {
      allContributors = [];
      currentPage = 1;
      hasNextPage = false;
      hideAlert();
      setLoadingState(true);
      resetLeaderboardViews();
    } else {
      setLoadMoreLoading(true);
    }

    try {
      let pageData;
      let linkHeader;

      if (contributorCache.has(cacheKey)) {
        const cached = contributorCache.get(cacheKey);
        pageData = cached.data;
        linkHeader = cached.linkHeader;
      } else {
        const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contributors?per_page=${PER_PAGE}&page=${page}`;
        const response = await fetch(apiUrl, {
          headers: { Accept: "application/vnd.github.v3+json" }
        });

        // Check rate-limit headers
        const remaining = response.headers.get("x-ratelimit-remaining");
        const resetHeader = response.headers.get("x-ratelimit-reset");

        if (response.status === 403 && remaining === "0") {
          const resetTime = resetHeader ? new Date(resetHeader * 1000).toLocaleTimeString() : "soon";
          throw new Error(`GitHub API rate limit exceeded. Unauthenticated requests are limited to 60/hour. Rate limit resets at ${resetTime}.`);
        }

        if (response.status === 404) {
          throw new Error(`Repository "${owner}/${repo}" was not found or is private. Please verify the URL.`);
        }

        if (!response.ok) {
          throw new Error(`GitHub API returned error ${response.status}: ${response.statusText}`);
        }

        // Response 204 No Content or empty
        if (response.status === 204) {
          pageData = [];
        } else {
          pageData = await response.json();
        }

        linkHeader = response.headers.get("link");

        // Cache the response
        contributorCache.set(cacheKey, { data: pageData, linkHeader });
      }

      if (!Array.isArray(pageData)) {
        throw new Error("Unexpected API response format received from GitHub.");
      }

      // Check if repository has 0 contributors
      if (page === 1 && pageData.length === 0) {
        showEmptyLeaderboard(`No contributors found for repository "${owner}/${repo}".`);
        return;
      }

      // Merge and deduplicate by login or id
      const existingIds = new Set(allContributors.map((c) => c.login));
      for (const item of pageData) {
        if (!existingIds.has(item.login)) {
          allContributors.push({
            id: item.id,
            login: item.login,
            avatar_url: item.avatar_url,
            html_url: item.html_url,
            contributions: item.contributions || 0,
            type: item.type || "User"
          });
          existingIds.add(item.login);
        }
      }

      // Sort contributors strictly in descending order of contribution count
      allContributors.sort((a, b) => b.contributions - a.contributions);

      // Check pagination links
      const links = parseLinkHeader(linkHeader);
      hasNextPage = Boolean(links.next);
      currentPage = page;

      // Render updated contributors list
      renderLeaderboard();

    } catch (err) {
      console.error("Contributor fetch error:", err);
      showAlert(err.message, "error");
      if (allContributors.length === 0) {
        showEmptyLeaderboard(err.message);
      }
    } finally {
      setLoadingState(false);
      setLoadMoreLoading(false);
    }
  }

  /**
   * Reset all leaderboard sub-views before fresh load
   */
  function resetLeaderboardViews() {
    if (podiumWrapper) podiumWrapper.style.display = "none";
    if (podiumGrid) podiumGrid.innerHTML = "";
    if (remainingWrapper) remainingWrapper.style.display = "none";
    if (contributorsGrid) contributorsGrid.innerHTML = "";
    if (leaderboardEmpty) leaderboardEmpty.className = "leaderboard-empty";
    if (paginationContainer) paginationContainer.style.display = "none";
  }

  /**
   * Set general loading UI state
   */
  function setLoadingState(loading) {
    isLoading = loading;
    if (leaderboardLoading) {
      leaderboardLoading.className = loading ? "leaderboard-loading is-active" : "leaderboard-loading";
    }
    if (loadContributorsBtn) {
      loadContributorsBtn.disabled = loading;
      const textSpan = loadContributorsBtn.querySelector(".btn-text");
      if (textSpan) {
        textSpan.textContent = loading ? "Loading..." : "Load Contributors";
      }
      const icon = loadContributorsBtn.querySelector(".btn-icon");
      if (icon) {
        icon.className = loading ? "fa-solid fa-spinner fa-spin btn-icon" : "fa-solid fa-arrow-right btn-icon";
      }
    }
  }

  /**
   * Set "Load More" button loading UI state
   */
  function setLoadMoreLoading(loading) {
    if (!loadMoreBtn) return;
    loadMoreBtn.disabled = loading;
    loadMoreBtn.innerHTML = loading
      ? '<i class="fa-solid fa-spinner fa-spin"></i> Loading Next Page...'
      : '<i class="fa-solid fa-arrows-rotate"></i> Load More Contributors';
  }

  /**
   * Display empty state
   */
  function showEmptyLeaderboard(message) {
    resetLeaderboardViews();
    if (leaderboardEmpty) {
      leaderboardEmpty.className = "leaderboard-empty is-active";
      const descEl = leaderboardEmpty.querySelector(".empty-desc");
      if (descEl) {
        descEl.textContent = message || "No contributors found for this repository.";
      }
    }
    updateMetaStats(0, 0);
  }

  /**
   * Update header metadata counter
   */
  function updateMetaStats(totalContributors, totalContributions) {
    if (totalContribsPeopleEl) {
      totalContribsPeopleEl.textContent = totalContributors.toLocaleString();
    }
    if (totalContribsCountEl) {
      totalContribsCountEl.textContent = totalContributions.toLocaleString();
    }
  }

  /**
   * Render the complete leaderboard
   */
  function renderLeaderboard() {
    if (!allContributors || allContributors.length === 0) {
      showEmptyLeaderboard("No contributors found for this repository.");
      return;
    }

    // Determine if admin is excluded from the leaderboard rankings
    // (Requirement: "The admin must remain separate from the contributor leaderboard")
    const includeAdmin = includeAdminToggle ? includeAdminToggle.checked : false;
    let displayList = allContributors;

    if (!includeAdmin && currentOwner) {
      const ownerLower = currentOwner.toLowerCase();
      displayList = allContributors.filter((c) => c.login.toLowerCase() !== ownerLower);
    }

    if (displayList.length === 0) {
      showEmptyLeaderboard(`All contributors for this repository are currently highlighted as Project Admin. Check "Include Project Admin in rankings" to view.`);
      return;
    }

    // Compute total metrics
    const totalCount = displayList.reduce((acc, c) => acc + (c.contributions || 0), 0);
    updateMetaStats(displayList.length, totalCount);

    // Split into Podium (Top 3) and Remaining (Rank 4+)
    const topThree = displayList.slice(0, 3);
    const remaining = displayList.slice(3);

    renderPodium(topThree);
    renderRemaining(remaining, topThree.length);
    renderPagination(displayList.length);
  }

  /**
   * Render Top 3 Podium
   */
  function renderPodium(topContributors) {
    if (!podiumWrapper || !podiumGrid) return;

    if (topContributors.length === 0) {
      podiumWrapper.style.display = "none";
      return;
    }

    podiumWrapper.style.display = "block";
    podiumGrid.innerHTML = "";

    // Podium Layout Logic:
    // If 3 contributors: Rank 2 (Silver, left), Rank 1 (Gold, center), Rank 3 (Bronze, right)
    // If 2 contributors: Rank 1 (Gold), Rank 2 (Silver)
    // If 1 contributor: Rank 1 (Gold)
    let orderedPodium = [];

    if (topContributors.length >= 3) {
      orderedPodium = [
        { ...topContributors[1], rank: 2, tier: "silver", icon: "fa-solid fa-medal", title: "Silver" },
        { ...topContributors[0], rank: 1, tier: "gold", icon: "fa-solid fa-crown", title: "Gold" },
        { ...topContributors[2], rank: 3, tier: "bronze", icon: "fa-solid fa-award", title: "Bronze" }
      ];
    } else if (topContributors.length === 2) {
      orderedPodium = [
        { ...topContributors[0], rank: 1, tier: "gold", icon: "fa-solid fa-crown", title: "Gold" },
        { ...topContributors[1], rank: 2, tier: "silver", icon: "fa-solid fa-medal", title: "Silver" }
      ];
    } else if (topContributors.length === 1) {
      orderedPodium = [
        { ...topContributors[0], rank: 1, tier: "gold", icon: "fa-solid fa-crown", title: "Gold" }
      ];
    }

    orderedPodium.forEach((contributor) => {
      const card = document.createElement("article");
      card.className = `podium-card rank-${contributor.tier}`;
      card.setAttribute("aria-label", `Rank ${contributor.rank} (${contributor.title}): ${contributor.login}`);

      const avatarUrl = contributor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(contributor.login)}&background=286849&color=ffffff&size=100`;

      card.innerHTML = `
        <div class="podium-badge-icon" aria-hidden="true">
          <i class="${contributor.icon}"></i>
        </div>
        <div class="podium-avatar-wrapper">
          <img 
            src="${escapeHtml(avatarUrl)}" 
            alt="${escapeHtml(contributor.login)}'s GitHub profile picture" 
            class="podium-avatar" 
            loading="lazy"
            onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(contributor.login)}&background=286849&color=ffffff&size=100';"
          />
          <span class="podium-rank-tag" title="Rank ${contributor.rank}">#${contributor.rank}</span>
        </div>
        <h4 class="podium-username">
          <a href="${escapeHtml(contributor.html_url)}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(contributor.login)}
          </a>
        </h4>
        <div class="podium-contributions">
          <i class="fa-solid fa-code-commit" aria-hidden="true"></i>
          <span><strong>${contributor.contributions.toLocaleString()}</strong> ${contributor.contributions === 1 ? "contribution" : "contributions"}</span>
        </div>
        <a 
          href="${escapeHtml(contributor.html_url)}" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="podium-profile-link"
          aria-label="View ${escapeHtml(contributor.login)}'s GitHub profile (opens in a new tab)"
        >
          <i class="fa-brands fa-github" aria-hidden="true"></i> Profile
        </a>
        <div class="podium-pedestal" aria-hidden="true">
          <span>Rank #${contributor.rank}</span>
        </div>
      `;

      podiumGrid.appendChild(card);
    });
  }

  /**
   * Render Remaining Contributors (Rank 4 onward)
   */
  function renderRemaining(remainingContributors, offset = 3) {
    if (!remainingWrapper || !contributorsGrid) return;

    if (!remainingContributors || remainingContributors.length === 0) {
      remainingWrapper.style.display = "none";
      contributorsGrid.innerHTML = "";
      return;
    }

    remainingWrapper.style.display = "block";
    contributorsGrid.innerHTML = "";

    const countBadge = remainingWrapper.querySelector(".remaining-count-badge");
    if (countBadge) {
      countBadge.textContent = `${remainingContributors.length} Contributors`;
    }

    remainingContributors.forEach((contributor, idx) => {
      const rank = offset + idx + 1;
      const card = document.createElement("article");
      card.className = "contributor-card";
      card.setAttribute("aria-label", `Rank #${rank}: ${contributor.login}`);

      const avatarUrl = contributor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(contributor.login)}&background=286849&color=ffffff&size=60`;

      card.innerHTML = `
        <span class="contributor-rank-badge" title="Rank #${rank}">#${rank}</span>
        <img 
          src="${escapeHtml(avatarUrl)}" 
          alt="${escapeHtml(contributor.login)}'s GitHub profile picture" 
          class="contributor-avatar" 
          loading="lazy"
          onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(contributor.login)}&background=286849&color=ffffff&size=60';"
        />
        <div class="contributor-details">
          <h4 class="contributor-name">
            <a href="${escapeHtml(contributor.html_url)}" target="_blank" rel="noopener noreferrer">
              ${escapeHtml(contributor.login)}
            </a>
          </h4>
          <span class="contributor-commits">
            <i class="fa-solid fa-code-commit" aria-hidden="true"></i>
            ${contributor.contributions.toLocaleString()} ${contributor.contributions === 1 ? "contribution" : "contributions"}
          </span>
        </div>
        <a 
          href="${escapeHtml(contributor.html_url)}" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="contributor-link-btn" 
          title="View ${escapeHtml(contributor.login)} on GitHub"
          aria-label="View ${escapeHtml(contributor.login)} on GitHub (opens in a new tab)"
        >
          <i class="fa-brands fa-github" aria-hidden="true"></i>
        </a>
      `;

      contributorsGrid.appendChild(card);
    });
  }

  /**
   * Render pagination controls
   */
  function renderPagination(totalLoaded) {
    if (!paginationContainer || !loadMoreBtn || !paginationInfo) return;

    if (hasNextPage) {
      paginationContainer.style.display = "block";
      loadMoreBtn.style.display = "inline-flex";
      paginationInfo.textContent = `Showing top ${totalLoaded} contributors. More contributors are available from GitHub.`;
    } else {
      if (totalLoaded > 10) {
        paginationContainer.style.display = "block";
        loadMoreBtn.style.display = "none";
        paginationInfo.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--team-green);"></i> All ${totalLoaded} contributors loaded for this repository.`;
      } else {
        paginationContainer.style.display = "none";
      }
    }
  }

  /**
   * Main submit handler for loading a repository
   */
  async function handleRepoSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    if (isLoading) return;

    const inputVal = repoUrlInput ? repoUrlInput.value : "";
    const parsed = parseRepoUrl(inputVal);

    if (!parsed.isValid) {
      showAlert(parsed.error, "error");
      if (repoUrlInput) {
        repoUrlInput.classList.add("is-invalid");
        repoUrlInput.focus();
      }
      return;
    }

    if (repoUrlInput) {
      repoUrlInput.classList.remove("is-invalid");
    }

    currentOwner = parsed.owner;
    currentRepo = parsed.repo;

    // Fetch Admin Profile and Contributors concurrently
    await Promise.all([
      fetchAdminDetails(currentOwner),
      fetchContributors(currentOwner, currentRepo, 1, false)
    ]);
  }

  /**
   * Initialize DOM references and event listeners
   */
  function init() {
    repoForm = document.getElementById("repoForm");
    repoUrlInput = document.getElementById("repoUrlInput");
    clearRepoBtn = document.getElementById("clearRepoBtn");
    loadContributorsBtn = document.getElementById("loadContributorsBtn");
    apiStatusBox = document.getElementById("apiStatusBox");
    adminCardContainer = document.getElementById("adminCardContainer");
    adminLoading = document.getElementById("adminLoading");
    adminError = document.getElementById("adminError");
    leaderboardLoading = document.getElementById("leaderboardLoading");
    leaderboardEmpty = document.getElementById("leaderboardEmpty");
    podiumWrapper = document.getElementById("podiumWrapper");
    podiumGrid = document.getElementById("podiumGrid");
    remainingWrapper = document.getElementById("remainingWrapper");
    remainingHeader = document.getElementById("remainingHeader");
    contributorsGrid = document.getElementById("contributorsGrid");
    paginationContainer = document.getElementById("paginationContainer");
    loadMoreBtn = document.getElementById("loadMoreBtn");
    paginationInfo = document.getElementById("paginationInfo");
    totalContribsCountEl = document.getElementById("totalContribsCount");
    totalContribsPeopleEl = document.getElementById("totalContribsPeople");
    includeAdminToggle = document.getElementById("includeAdminToggle");
    quickChipBtn = document.querySelector(".repo-chip[data-url]");

    // Form submission
    if (repoForm) {
      repoForm.addEventListener("submit", handleRepoSubmit);
    }

    // Clear button
    if (clearRepoBtn && repoUrlInput) {
      clearRepoBtn.addEventListener("click", () => {
        repoUrlInput.value = "";
        repoUrlInput.focus();
        repoUrlInput.classList.remove("is-invalid");
        hideAlert();
      });
    }

    // Input reset error on type
    if (repoUrlInput) {
      repoUrlInput.addEventListener("input", () => {
        repoUrlInput.classList.remove("is-invalid");
        hideAlert();
      });
    }

    // Quick chip button
    if (quickChipBtn && repoUrlInput) {
      quickChipBtn.addEventListener("click", () => {
        const targetUrl = quickChipBtn.getAttribute("data-url") || DEFAULT_REPO_URL;
        repoUrlInput.value = targetUrl;
        repoUrlInput.classList.remove("is-invalid");
        hideAlert();
        handleRepoSubmit();
      });
    }

    // Toggle: include/exclude admin from leaderboard
    if (includeAdminToggle) {
      includeAdminToggle.addEventListener("change", () => {
        renderLeaderboard();
      });
    }

    // Load More button (pagination)
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", () => {
        if (!isLoading && hasNextPage) {
          fetchContributors(currentOwner, currentRepo, currentPage + 1, true);
        }
      });
    }

    // Initial load with default PetSathi repository
    handleRepoSubmit();
  }

  // Bind to DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();

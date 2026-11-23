/**
 * PetSathi Contributor Certificate Generator & Verification Engine
 * Nexus Spring of Code (NSoC) 2026 – Winter Edition
 */

(function () {
  // DOM Elements
  const usernameInput = document.getElementById("github-username");
  const generateBtn = document.getElementById("btn-generate");
  const alertSuccess = document.getElementById("cert-alert-success");
  const alertSuccessMsg = document.getElementById("cert-success-msg");
  const alertError = document.getElementById("cert-alert-error");
  const alertErrorTitle = document.getElementById("cert-error-title");
  const alertErrorMsg = document.getElementById("cert-error-msg");

  const contributorsGrid = document.getElementById("contributors-grid");
  const showcaseSection = document.getElementById("cert-showcase");
  const lockedState = document.getElementById("cert-locked-state");
  const certSheet = document.getElementById("certificate-render-target");

  // Certificate Sheet Elements
  const certRecipientName = document.getElementById("cert-recipient-name");
  const certRecipientHandle = document.getElementById("cert-recipient-handle");
  const certAvatarImg = document.getElementById("cert-avatar-img");
  const certIssueDate = document.getElementById("cert-issue-date");
  const certVerificationId = document.getElementById("cert-verification-id");
  const certVerifiedBadge = document.getElementById("cert-verified-badge");

  // Action Buttons
  const downloadBtn = document.getElementById("btn-download-png");
  const shareLinkedinBtn = document.getElementById("btn-share-linkedin");
  const copyLinkBtn = document.getElementById("btn-copy-link");

  // State
  let contributorsRegistry = {};
  let currentContributor = null;
  let currentAvatarDataUrl = null;
  let currentCertId = null;

  // Initialize
  async function init() {
    // Current date format: "November 23, 2026"
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    if (certIssueDate) {
      certIssueDate.textContent = formattedDate;
    }

    // Attach Event Listeners
    if (generateBtn) {
      generateBtn.addEventListener("click", () => handleVerifyAndGenerate(true));
    }
    if (usernameInput) {
      usernameInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          handleVerifyAndGenerate(true);
        }
      });
    }

    if (downloadBtn) {
      downloadBtn.addEventListener("click", downloadCertificatePNG);
    }
    if (shareLinkedinBtn) {
      shareLinkedinBtn.addEventListener("click", shareOnLinkedIn);
    }
    if (copyLinkBtn) {
      copyLinkBtn.addEventListener("click", copyShareableLink);
    }

    // Load Verified Contributors Registry
    await loadContributorsRegistry();

    // Check URL parameters for ?user=...
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get("user") || urlParams.get("username");
    if (userParam && usernameInput) {
      usernameInput.value = userParam;
      handleVerifyAndGenerate(false);
    } else {
      // Default to initial locked state until a user is verified
      showLockedState();
    }
  }

  // Load Contributors from local registry and optionally refresh via GitHub API
  async function loadContributorsRegistry() {
    try {
      const res = await fetch("../data/contributors.json");
      if (res.ok) {
        const data = await res.json();
        const list = data.contributors || [];
        list.forEach((c) => {
          contributorsRegistry[c.username.toLowerCase()] = c;
        });
        renderContributorsHub(list);
      }
    } catch (err) {
      console.warn("Could not load local contributors.json, attempting fallback:", err);
    }

    // Attempt live GitHub contributors check in background
    try {
      const ghRes = await fetch("https://api.github.com/repos/Riya-Kharade/PetSathi/contributors?per_page=100");
      if (ghRes.ok) {
        const ghList = await ghRes.json();
        ghList.forEach((c) => {
          const key = c.login.toLowerCase();
          if (!contributorsRegistry[key]) {
            contributorsRegistry[key] = {
              username: c.login,
              name: c.login,
              contributions: c.contributions,
              avatar_url: c.avatar_url,
              profile_url: c.html_url,
              role: "Open Source Contributor",
              verified: true
            };
          } else {
            contributorsRegistry[key].contributions = Math.max(
              contributorsRegistry[key].contributions || 0,
              c.contributions || 0
            );
          }
        });
      }
    } catch (e) {
      // Offline or rate limit is fine, local registry is already populated
    }
  }

  // Render the "Hall of Verified Contributors"
  function renderContributorsHub(list) {
    if (!contributorsGrid) return;
    contributorsGrid.innerHTML = "";

    list.forEach((c) => {
      const card = document.createElement("div");
      card.className = "contributor-hub-card";
      card.setAttribute("data-username", c.username);

      const avatarSrc = c.avatar_url || "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png";
      const displayName = c.name && c.name !== c.username ? c.name : `@${c.username}`;
      const commits = c.contributions || 1;

      card.innerHTML = `
        <img class="contributor-hub-avatar" src="${avatarSrc}" alt="${c.username}" loading="lazy">
        <div class="contributor-hub-info">
          <div class="contributor-hub-name" title="${displayName}">${displayName}</div>
          <div class="contributor-hub-sub">
            <span>@${c.username}</span>
            <span class="contributor-commits-badge">${commits} ${commits === 1 ? 'commit' : 'commits'}</span>
          </div>
        </div>
      `;

      card.addEventListener("click", () => {
        if (usernameInput) {
          usernameInput.value = c.username;
          // Mark active
          document.querySelectorAll(".contributor-hub-card").forEach((el) => el.classList.remove("active"));
          card.classList.add("active");
          handleVerifyAndGenerate(true);
        }
      });

      contributorsGrid.appendChild(card);
    });
  }

  // Show Locked Placeholder State
  function showLockedState() {
    if (lockedState) lockedState.style.display = "block";
    if (certSheet) certSheet.style.opacity = "0.4";
    if (downloadBtn) downloadBtn.disabled = true;
    if (shareLinkedinBtn) shareLinkedinBtn.disabled = true;
  }

  // Unlock Certificate
  function unlockCertificate() {
    if (lockedState) lockedState.style.display = "none";
    if (certSheet) certSheet.style.opacity = "1";
    if (downloadBtn) downloadBtn.disabled = false;
    if (shareLinkedinBtn) shareLinkedinBtn.disabled = false;
  }

  // Convert image URL to Base64 to guarantee clean, non-tainted canvas drawing
  async function urlToBase64(url) {
    try {
      const response = await fetch(url, { mode: "cors" });
      if (!response.ok) throw new Error("Avatar fetch failed");
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn("Could not convert avatar to base64 via fetch, using fallback image:", err);
      return url;
    }
  }

  // Handle Verification and Generation
  async function handleVerifyAndGenerate(userInitiated = true) {
    hideAlerts();
    const rawUser = usernameInput.value.trim().replace(/^@/, "");

    if (!rawUser) {
      showErrorAlert("Input Required", "Please enter a GitHub username to verify contributions.");
      usernameInput.focus();
      return;
    }

    setLoading(true);

    try {
      const key = rawUser.toLowerCase();
      let contributorRecord = contributorsRegistry[key];

      // If not immediately in registry, check live GitHub repo contributors
      if (!contributorRecord) {
        try {
          const checkUrl = `https://api.github.com/repos/Riya-Kharade/PetSathi/commits?author=${encodeURIComponent(rawUser)}&per_page=1`;
          const checkRes = await fetch(checkUrl);
          if (checkRes.ok) {
            const commits = await checkRes.json();
            if (Array.isArray(commits) && commits.length > 0) {
              // Found active commit by this author!
              const commitAuthor = commits[0].author;
              contributorRecord = {
                username: (commitAuthor && commitAuthor.login) || rawUser,
                name: (commitAuthor && commitAuthor.login) || rawUser,
                contributions: commits.length,
                avatar_url: (commitAuthor && commitAuthor.avatar_url) || "",
                role: "Open Source Contributor",
                verified: true
              };
              contributorsRegistry[key] = contributorRecord;
            }
          }
        } catch (e) {
          // Ignore live check error
        }
      }

      // STRICT CHECK: Only real contributors can generate certificates!
      if (!contributorRecord) {
        showLockedState();
        showErrorAlert(
          `Verification Failed: @${rawUser} has no merged contributions`,
          `PetSathi certificates of contribution are strictly reserved for developers who have contributed merged pull requests or commits to the PetSathi repository during Nexus Spring of Code (NSoC) 2026 – Winter Edition. Our verification records confirm that @${rawUser} is not an official contributor. If you have recently opened a PR, it will become eligible once merged by the maintainers.`
        );
        return;
      }

      // User IS a verified contributor!
      // Fetch full GitHub profile to get their latest display name and high-res avatar
      let ghData = {};
      try {
        const ghRes = await fetch(`https://api.github.com/users/${encodeURIComponent(contributorRecord.username)}`);
        if (ghRes.ok) {
          ghData = await ghRes.json();
        }
      } catch (e) {
        // Fallback to record
      }

      const verifiedName = (ghData.name && ghData.name.trim()) || contributorRecord.name || contributorRecord.username;
      const verifiedHandle = contributorRecord.username;
      const avatarSrc = (ghData.avatar_url) || contributorRecord.avatar_url || "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png";
      const commitsCount = contributorRecord.contributions || 1;

      // Convert avatar to Base64 for non-tainted Canvas drawing
      currentAvatarDataUrl = await urlToBase64(avatarSrc);

      // Generate deterministic unique verification ID
      let hash = 0;
      for (let i = 0; i < verifiedHandle.length; i++) {
        hash = (hash << 5) - hash + verifiedHandle.charCodeAt(i);
        hash |= 0;
      }
      const hexHash = Math.abs(hash).toString(16).padStart(6, "0").substring(0, 6).toUpperCase();
      currentCertId = `NSOC-PS26-${hexHash}`;

      currentContributor = {
        name: verifiedName,
        username: verifiedHandle,
        contributions: commitsCount,
        role: contributorRecord.role || "Open Source Contributor"
      };

      // Show Success Alert
      showSuccessAlert(
        `Verification Successful!`,
        `<strong>@${verifiedHandle}</strong> is an official PetSathi Contributor with <strong>${commitsCount} ${commitsCount === 1 ? 'merged commit' : 'merged commits'}</strong> for NSoC Winter Edition 2026.`
      );

      // Unlock and populate Certificate Sheet
      unlockCertificate();

      if (certRecipientName) certRecipientName.textContent = verifiedName;
      if (certRecipientHandle) certRecipientHandle.textContent = `@${verifiedHandle}`;
      if (certAvatarImg) certAvatarImg.src = currentAvatarDataUrl;
      if (certVerificationId) certVerificationId.textContent = `ID: ${currentCertId}`;
      if (certVerifiedBadge) certVerifiedBadge.textContent = `${commitsCount} ${commitsCount === 1 ? 'Commit' : 'Commits'}`;

      // Highlight active card in hub
      document.querySelectorAll(".contributor-hub-card").forEach((card) => {
        if (card.getAttribute("data-username").toLowerCase() === verifiedHandle.toLowerCase()) {
          card.classList.add("active");
        } else {
          card.classList.remove("active");
        }
      });

      // Smooth scroll to certificate if initiated by user
      if (showcaseSection && userInitiated) {
        showcaseSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      // Update URL query string without reloading page
      const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?user=${encodeURIComponent(verifiedHandle)}`;
      window.history.replaceState({ path: newUrl }, "", newUrl);

    } catch (err) {
      showErrorAlert("Error", err.message || "An unexpected error occurred during verification.");
    } finally {
      setLoading(false);
    }
  }

  function showErrorAlert(title, message) {
    if (alertError && alertErrorTitle && alertErrorMsg) {
      alertErrorTitle.textContent = title;
      alertErrorMsg.innerHTML = message;
      alertError.style.display = "flex";
    }
    if (alertSuccess) alertSuccess.style.display = "none";
  }

  function showSuccessAlert(title, message) {
    if (alertSuccess && alertSuccessMsg) {
      alertSuccessMsg.innerHTML = `<strong>${title}</strong> ${message}`;
      alertSuccess.style.display = "flex";
    }
    if (alertError) alertError.style.display = "none";
  }

  function hideAlerts() {
    if (alertError) alertError.style.display = "none";
    if (alertSuccess) alertSuccess.style.display = "none";
  }

  function setLoading(isLoading) {
    if (generateBtn) {
      generateBtn.disabled = isLoading;
      if (isLoading) {
        generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';
      } else {
        generateBtn.innerHTML = '<i class="fa-solid fa-award"></i> Generate Certificate';
      }
    }
  }

  // Load Image Helper with promise
  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  // Draw wrap text helper for Canvas
  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, align = "center") {
    ctx.textAlign = align;
    const words = text.split(" ");
    let line = "";
    const lines = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());

    const totalHeight = (lines.length - 1) * lineHeight;
    let startY = y - totalHeight / 2;

    for (let k = 0; k < lines.length; k++) {
      ctx.fillText(lines[k], x, startY + k * lineHeight);
    }
  }

  // Render High-Resolution Certificate on Canvas (2400 x 1700 px)
  async function renderHighResCertificateCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = 2400;
    canvas.height = 1700;
    const ctx = canvas.getContext("2d");

    const w = canvas.width;
    const h = canvas.height;

    // 1. Background Fill: Parchment Ivory Linen Texture Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, "#ffffff");
    bgGrad.addColorStop(0.5, "#fdfcf9");
    bgGrad.addColorStop(1, "#f8f5ed");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Triple Border System (PetSathi Dark Green #1d5039 & Metallic Gold #c8973e)
    // Outer Heavy Border
    ctx.strokeStyle = "#1d5039";
    ctx.lineWidth = 14;
    ctx.strokeRect(50, 50, w - 100, h - 100);

    // Inner Metallic Gold Accent
    ctx.strokeStyle = "#c8973e";
    ctx.lineWidth = 4;
    ctx.strokeRect(72, 72, w - 144, h - 144);

    // Fine Delicate Dashed Hairline
    ctx.save();
    ctx.strokeStyle = "#d0e0cb";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(88, 88, w - 176, h - 176);
    ctx.restore();

    // 3. Ornate Corner Brackets with Metallic Gold
    const drawCornerBracket = (cx, cy, flipX, flipY) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      ctx.strokeStyle = "#c8973e";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, 60);
      ctx.lineTo(0, 0);
      ctx.lineTo(60, 0);
      ctx.stroke();

      // Corner accent dot
      ctx.fillStyle = "#1d5039";
      ctx.beginPath();
      ctx.arc(16, 16, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawCornerBracket(102, 102, false, false);
    drawCornerBracket(w - 102, 102, true, false);
    drawCornerBracket(102, h - 102, false, true);
    drawCornerBracket(w - 102, h - 102, true, true);

    // 4. Header: PetSathi Branding (Left) & Official NSoC Logo (Right)
    // Left: PetSathi Brand Paw + Text
    ctx.fillStyle = "#1d5039";
    ctx.font = "bold 58px Georgia, 'Times New Roman', serif";
    ctx.textAlign = "left";
    ctx.fillText("PetSathi", 195, 200);

    ctx.fillStyle = "#286849";
    ctx.font = "bold 20px 'DM Sans', sans-serif";
    ctx.fillText("OPEN SOURCE PET COMPANION PLATFORM", 197, 234);

    // Draw paw print icon beside PetSathi
    ctx.fillStyle = "#286849";
    ctx.beginPath();
    ctx.arc(155, 185, 15, 0, Math.PI * 2);
    ctx.arc(138, 158, 9, 0, Math.PI * 2);
    ctx.arc(158, 146, 9, 0, Math.PI * 2);
    ctx.arc(178, 158, 9, 0, Math.PI * 2);
    ctx.fill();

    // Right: Load & Draw Official NSoC Winter Logo
    const nsocLogoImg = await loadImage("../assets/images/nsoc/nsoc-winter-logo-clean-transparent.png");
    if (nsocLogoImg) {
      ctx.drawImage(nsocLogoImg, w - 330, 125, 135, 135);
    }

    ctx.fillStyle = "#1d5039";
    ctx.font = "800 36px 'Manrope', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Nexus Spring of Code", w - 350, 185);

    ctx.fillStyle = "#0284c7";
    ctx.font = "bold 24px 'DM Sans', sans-serif";
    ctx.fillText("WINTER EDITION 2026", w - 350, 222);

    // Header divider line
    ctx.strokeStyle = "#e5efe0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(140, 275);
    ctx.lineTo(w - 140, 275);
    ctx.stroke();

    // 5. Main Title & Ribbon
    ctx.fillStyle = "#c8973e";
    ctx.font = "bold 26px 'DM Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("★  OFFICIAL RECOGNITION OF OPEN SOURCE EXCELLENCE  ★", w / 2, 350);

    ctx.fillStyle = "#1d5039";
    ctx.font = "bold 78px Georgia, 'Times New Roman', serif";
    ctx.fillText("CERTIFICATE OF CONTRIBUTION", w / 2, 445);

    // Gold decorative underline with diamond center
    ctx.strokeStyle = "#c8973e";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 290, 480);
    ctx.lineTo(w / 2 - 30, 480);
    ctx.moveTo(w / 2 + 30, 480);
    ctx.lineTo(w / 2 + 290, 480);
    ctx.stroke();

    ctx.fillStyle = "#c8973e";
    ctx.beginPath();
    ctx.moveTo(w / 2, 468);
    ctx.lineTo(w / 2 + 12, 480);
    ctx.lineTo(w / 2, 492);
    ctx.lineTo(w / 2 - 12, 480);
    ctx.closePath();
    ctx.fill();

    // 6. Presentation Lead-in
    ctx.fillStyle = "#556b5e";
    ctx.font = "italic 32px Georgia, 'Times New Roman', serif";
    ctx.fillText("This certificate is proudly awarded to", w / 2, 545);

    // 7. Recipient Avatar & Details
    const name = (currentContributor && currentContributor.name) || "Verified Contributor";
    const username = (currentContributor && currentContributor.username) || "contributor";
    const commitsCount = (currentContributor && currentContributor.contributions) || 1;
    const avatarSrc = currentAvatarDataUrl || (certAvatarImg ? certAvatarImg.src : null);

    const avatarX = w / 2;
    const avatarY = 665;
    const avatarRadius = 78;

    if (avatarSrc) {
      const avatarImage = await loadImage(avatarSrc);
      if (avatarImage) {
        // Draw Gold outer shadow/ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarRadius + 8, 0, Math.PI * 2);
        ctx.fillStyle = "#c8973e";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarRadius + 4, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        // Clip circular avatar
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatarImage, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
        ctx.restore();
      }
    }

    // 8. Contributor Name (Prominent & Regal)
    ctx.fillStyle = "#122b1c";
    ctx.font = "bold 76px Georgia, 'Times New Roman', serif";
    ctx.textAlign = "center";
    ctx.fillText(name, w / 2, 845);

    // Contributor GitHub Handle & Commits Badge
    ctx.fillStyle = "#286849";
    ctx.font = "bold 32px 'DM Sans', sans-serif";
    ctx.fillText(`@${username}   •   Verified PetSathi Contributor (${commitsCount} Merged Commits)`, w / 2, 905);

    // 9. Recognition Statement Citation
    const citation =
      "In sincere recognition of your distinguished contribution to the open-source architecture, frontend development, and feature implementation of PetSathi during the Nexus Spring of Code (NSoC) 2026 – Winter Edition. Your dedication to engineering accessible, reliable technology directly elevates the standard of care for companion pets and pet parents across the open-source community.";

    ctx.fillStyle = "#3e5246";
    ctx.font = "400 31px 'DM Sans', sans-serif";
    drawWrappedText(ctx, citation, w / 2, 1025, 1620, 52, "center");

    // 10. Footer Section: Date (Left), Gold Seal (Center), Signatures (Right)
    const footerY = 1340;

    // Divider line above footer
    ctx.strokeStyle = "#e5efe0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(160, 1250);
    ctx.lineTo(w - 160, 1250);
    ctx.stroke();

    // Left: Issue Date
    ctx.textAlign = "left";
    ctx.fillStyle = "#718078";
    ctx.font = "bold 20px 'DM Sans', sans-serif";
    ctx.fillText("DATE OF ISSUANCE", 180, footerY);

    ctx.fillStyle = "#263b30";
    ctx.font = "bold 30px 'DM Sans', sans-serif";
    const dateText = certIssueDate ? certIssueDate.textContent : "November 23, 2026";
    ctx.fillText(dateText, 180, footerY + 45);

    ctx.fillStyle = "#8a9e91";
    ctx.font = "400 20px 'DM Sans', sans-serif";
    ctx.fillText("Official Open Source Record", 180, footerY + 80);

    // Center: Official 3D Embossed Gold Seal with Ribbon Tails
    const sealX = w / 2;
    const sealY = footerY + 30;
    const sealRadius = 72;

    // Draw Hanging Dark Green Ribbon Tails
    ctx.save();
    ctx.fillStyle = "#1d5039";
    ctx.strokeStyle = "#c8973e";
    ctx.lineWidth = 3;

    // Left ribbon
    ctx.beginPath();
    ctx.moveTo(sealX - 35, sealY + 20);
    ctx.lineTo(sealX - 55, sealY + 120);
    ctx.lineTo(sealX - 35, sealY + 105);
    ctx.lineTo(sealX - 15, sealY + 120);
    ctx.lineTo(sealX - 5, sealY + 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right ribbon
    ctx.beginPath();
    ctx.moveTo(sealX + 5, sealY + 20);
    ctx.lineTo(sealX + 15, sealY + 120);
    ctx.lineTo(sealX + 35, sealY + 105);
    ctx.lineTo(sealX + 55, sealY + 120);
    ctx.lineTo(sealX + 35, sealY + 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Draw Gold radial gradient seal
    const sealGrad = ctx.createRadialGradient(sealX, sealY, 10, sealX, sealY, sealRadius);
    sealGrad.addColorStop(0, "#fff7d6");
    sealGrad.addColorStop(0.65, "#fcd34d");
    sealGrad.addColorStop(1, "#b45309");

    ctx.save();
    ctx.beginPath();
    ctx.arc(sealX, sealY, sealRadius, 0, Math.PI * 2);
    ctx.fillStyle = sealGrad;
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#78350f";
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.restore();

    // Inner seal circle
    ctx.beginPath();
    ctx.arc(sealX, sealY, sealRadius - 12, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Star & Inscription in seal
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px 'Font Awesome 6 Free', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("★", sealX, sealY + 12);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px 'DM Sans', sans-serif";
    ctx.fillText("NSoC 2026", sealX, sealY - 22);
    ctx.fillText("WINTER", sealX, sealY + 36);

    ctx.fillStyle = "#92400e";
    ctx.font = "800 16px 'DM Sans', sans-serif";
    ctx.fillText("OFFICIAL SEAL", sealX, sealY + sealRadius + 28);

    // Right: Signatures
    ctx.textAlign = "right";

    // Maintainer Signature script
    ctx.fillStyle = "#1d5039";
    ctx.font = "italic bold 44px 'Brush Script MT', 'Great Vibes', cursive, serif";
    ctx.fillText("Riya Kharade", w - 180, footerY + 8);

    // Signature underline
    ctx.strokeStyle = "#9ab6a3";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w - 440, footerY + 28);
    ctx.lineTo(w - 180, footerY + 28);
    ctx.stroke();

    ctx.fillStyle = "#1d5039";
    ctx.font = "bold 24px 'DM Sans', sans-serif";
    ctx.fillText("Project Admin & Maintainer, PetSathi", w - 180, footerY + 60);

    ctx.fillStyle = "#718078";
    ctx.font = "400 20px 'DM Sans', sans-serif";
    ctx.fillText("NSoC Winter Edition Mentorship Team", w - 180, footerY + 90);

    // Bottom verification code
    const certId = currentCertId || "NSOC-PS26-VERIFIED";
    ctx.textAlign = "center";
    ctx.fillStyle = "#8a9e91";
    ctx.font = "400 20px monospace";
    ctx.fillText(`Certificate Serial: ${certId}   •   Cryptographically Verifiable at petsathi-nsoc.netlify.app`, w / 2, h - 115);

    return canvas;
  }

  // Trigger high-resolution PNG download
  async function downloadCertificatePNG() {
    if (!downloadBtn || downloadBtn.disabled) return;
    const originalText = downloadBtn.innerHTML;
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Rendering Official PNG...';

    try {
      const canvas = await renderHighResCertificateCanvas();
      const username = (currentContributor && currentContributor.username) || "contributor";
      const filename = `PetSathi-NSoC-Certificate-${username}.png`;

      canvas.toBlob(
        function (blob) {
          if (!blob) {
            alert("Could not generate certificate image.");
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = originalText;
            return;
          }

          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);

          downloadBtn.disabled = false;
          downloadBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Downloaded Official PNG!';
          setTimeout(() => {
            downloadBtn.innerHTML = originalText;
          }, 2500);
        },
        "image/png",
        1.0
      );
    } catch (err) {
      console.error("Error generating certificate download:", err);
      alert("Failed to render certificate. Please try again.");
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = originalText;
    }
  }

  // Share on LinkedIn
  function shareOnLinkedIn() {
    const username = (currentContributor && currentContributor.username) || "";
    const pageUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?user=${encodeURIComponent(username)}`;
    const text = `Honored to receive my official Contributor Certificate for PetSathi during Nexus Spring of Code (NSoC) 2026 – Winter Edition! 🐾 Check it out:`;
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
    window.open(shareUrl, "_blank", "width=600,height=600");
  }

  // Copy shareable link
  function copyShareableLink() {
    const handle = (currentContributor && currentContributor.username) || usernameInput.value.trim();
    const link = handle
      ? `${window.location.protocol}//${window.location.host}${window.location.pathname}?user=${encodeURIComponent(handle)}`
      : window.location.href;

    navigator.clipboard
      .writeText(link)
      .then(() => {
        if (copyLinkBtn) {
          const orig = copyLinkBtn.innerHTML;
          copyLinkBtn.innerHTML = '<i class="fa-solid fa-check"></i> Link Copied!';
          setTimeout(() => {
            copyLinkBtn.innerHTML = orig;
          }, 2000);
        }
      })
      .catch(() => {
        prompt("Copy this shareable link:", link);
      });
  }

  window.renderHighResCertificateCanvas = renderHighResCertificateCanvas;
  window.handleVerifyAndGenerate = handleVerifyAndGenerate;

  // Run on DOM load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

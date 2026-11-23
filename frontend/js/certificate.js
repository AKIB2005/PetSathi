/**
 * PetSathi Contributor Certificate Generator Script
 * Nexus Spring of Code (NSoC) 2026 – Winter Edition
 */

(function () {
  // Elements
  const usernameInput = document.getElementById("github-username");
  const generateBtn = document.getElementById("btn-generate");
  const errorAlert = document.getElementById("cert-error-alert");
  const errorMsg = document.getElementById("cert-error-msg");
  const previewCard = document.getElementById("contributor-preview");
  const showcaseSection = document.getElementById("cert-showcase");

  // Certificate Display Elements
  const certRecipientName = document.getElementById("cert-recipient-name");
  const certRecipientHandle = document.getElementById("cert-recipient-handle");
  const certAvatarImg = document.getElementById("cert-avatar-img");
  const certIssueDate = document.getElementById("cert-issue-date");
  const certVerificationId = document.getElementById("cert-verification-id");

  // Contributor Preview Details
  const previewAvatar = document.getElementById("preview-avatar");
  const previewName = document.getElementById("preview-name");
  const previewHandle = document.getElementById("preview-handle");

  // Action Buttons
  const downloadBtn = document.getElementById("btn-download-png");
  const shareLinkedinBtn = document.getElementById("btn-share-linkedin");
  const copyLinkBtn = document.getElementById("btn-copy-link");

  // State
  let currentContributor = null;
  let currentAvatarDataUrl = null;
  let currentCertId = null;

  // Initialize
  function init() {
    // Current date format: "November 23, 2026"
    const now = new Date();
    const options = { year: "numeric", month: "long", day: "numeric" };
    const formattedDate = now.toLocaleDateString("en-US", options);
    if (certIssueDate) {
      certIssueDate.textContent = formattedDate;
    }

    // Attach Event Listeners
    if (generateBtn) {
      generateBtn.addEventListener("click", () => handleGenerate(true));
    }
    if (usernameInput) {
      usernameInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          handleGenerate(true);
        }
      });
    }

    // Quick Sample Pills
    const samplePills = document.querySelectorAll(".cert-sample-pill");
    samplePills.forEach((pill) => {
      pill.addEventListener("click", function () {
        const user = this.getAttribute("data-user");
        if (user && usernameInput) {
          usernameInput.value = user;
          handleGenerate(true);
        }
      });
    });

    if (downloadBtn) {
      downloadBtn.addEventListener("click", downloadCertificatePNG);
    }

    if (shareLinkedinBtn) {
      shareLinkedinBtn.addEventListener("click", shareOnLinkedIn);
    }

    if (copyLinkBtn) {
      copyLinkBtn.addEventListener("click", copyShareableLink);
    }

    // Check URL parameters for ?user=...
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get("user") || urlParams.get("username");
    if (userParam && usernameInput) {
      usernameInput.value = userParam;
      handleGenerate(false);
    } else {
      // Load default sample preview so the certificate isn't empty on arrival
      generateDemoCertificate("PetSathi Contributor", "contributor");
    }
  }

  // Generate Demo / Default preview
  function generateDemoCertificate(displayName, username) {
    const demoId = "NSOC-PS26-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    currentCertId = demoId;
    if (certRecipientName) certRecipientName.textContent = displayName;
    if (certRecipientHandle) certRecipientHandle.textContent = "@" + username;
    if (certVerificationId) certVerificationId.textContent = "ID: " + demoId;
  }

  // Show error
  function showError(msg) {
    if (errorAlert && errorMsg) {
      errorMsg.textContent = msg;
      errorAlert.className = "cert-alert error";
      errorAlert.style.display = "flex";
    }
  }

  // Hide error
  function hideError() {
    if (errorAlert) {
      errorAlert.style.display = "none";
    }
  }

  // Set loading state
  function setLoading(isLoading) {
    if (generateBtn) {
      generateBtn.disabled = isLoading;
      if (isLoading) {
        generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Fetching Profile...';
      } else {
        generateBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate Certificate';
      }
    }
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

  // Fetch GitHub User Profile
  async function handleGenerate(userInitiated = true) {
    hideError();
    const rawUser = usernameInput.value.trim().replace(/^@/, "");

    if (!rawUser) {
      showError("Please enter your GitHub username.");
      usernameInput.focus();
      return;
    }

    setLoading(true);

    try {
      const apiUrl = `https://api.github.com/users/${encodeURIComponent(rawUser)}`;
      const res = await fetch(apiUrl);

      if (res.status === 404) {
        throw new Error(`GitHub username "${rawUser}" was not found. Please verify spelling.`);
      }

      if (res.status === 403) {
        const rateLimitRemaining = res.headers.get("x-ratelimit-remaining");
        if (rateLimitRemaining === "0") {
          throw new Error("GitHub API rate limit exceeded. Please wait a short while and try again.");
        }
      }

      if (!res.ok) {
        throw new Error(`GitHub API request failed with status: ${res.status}`);
      }

      const userData = await res.json();
      currentContributor = userData;

      // Extract details
      const name = userData.name && userData.name.trim() ? userData.name.trim() : userData.login;
      const handle = userData.login;
      const avatarUrl = userData.avatar_url;

      // Convert avatar to Base64 for clean canvas drawing
      currentAvatarDataUrl = await urlToBase64(avatarUrl);

      // Generate verification ID: deterministic hash from username
      let hash = 0;
      for (let i = 0; i < handle.length; i++) {
        hash = (hash << 5) - hash + handle.charCodeAt(i);
        hash |= 0;
      }
      const hexHash = Math.abs(hash).toString(16).padStart(6, "0").substring(0, 6).toUpperCase();
      currentCertId = `NSOC-PS26-${hexHash}`;

      // Update Contributor Preview Card
      if (previewCard) {
        previewAvatar.src = currentAvatarDataUrl;
        previewName.textContent = name;
        previewHandle.textContent = `@${handle}`;
        previewCard.classList.add("visible");
      }

      // Update Certificate Sheet
      if (certRecipientName) certRecipientName.textContent = name;
      if (certRecipientHandle) certRecipientHandle.textContent = `@${handle}`;
      if (certAvatarImg) certAvatarImg.src = currentAvatarDataUrl;
      if (certVerificationId) certVerificationId.textContent = `ID: ${currentCertId}`;

      // Smooth scroll to certificate preview
      if (showcaseSection && userInitiated) {
        showcaseSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      // Update URL query string without reloading page
      const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?user=${encodeURIComponent(handle)}`;
      window.history.replaceState({ path: newUrl }, "", newUrl);

    } catch (err) {
      showError(err.message || "An unexpected error occurred while fetching your GitHub profile.");
    } finally {
      setLoading(false);
    }
  }

  // Helper to load an Image object with promise
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null); // Resolve null on error so certificate still draws
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

    // Center vertical offset
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

    // 1. Background Fill: Subtle warm parchment gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, "#ffffff");
    bgGrad.addColorStop(0.5, "#fdfcf9");
    bgGrad.addColorStop(1, "#f9f6ef");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Outer Ornate Border (Green #286849 & Gold #c8973e)
    ctx.strokeStyle = "#286849";
    ctx.lineWidth = 14;
    ctx.strokeRect(50, 50, w - 100, h - 100);

    // Inner thin border
    ctx.strokeStyle = "#c8973e";
    ctx.lineWidth = 4;
    ctx.strokeRect(74, 74, w - 148, h - 148);

    // Delicate inner border line
    ctx.strokeStyle = "#dcebc9";
    ctx.lineWidth = 2;
    ctx.strokeRect(88, 88, w - 176, h - 176);

    // 3. Corner Ornamental Brackets
    const drawCornerBracket = (cx, cy, flipX, flipY) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      ctx.strokeStyle = "#c8973e";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 50);
      ctx.lineTo(0, 0);
      ctx.lineTo(50, 0);
      ctx.stroke();

      // Corner accent dot
      ctx.fillStyle = "#286849";
      ctx.beginPath();
      ctx.arc(14, 14, 5, 0, Math.PI * 2);
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
    ctx.font = "bold 56px Georgia, 'Times New Roman', serif";
    ctx.textAlign = "left";
    ctx.fillText("PetSathi", 180, 200);

    ctx.fillStyle = "#286849";
    ctx.font = "600 24px 'DM Sans', sans-serif";
    ctx.fillText("OPEN SOURCE PET COMPANION PLATFORM", 182, 235);

    // Draw paw print icon beside PetSathi
    ctx.fillStyle = "#286849";
    ctx.beginPath();
    ctx.arc(145, 185, 14, 0, Math.PI * 2);
    ctx.arc(130, 160, 8, 0, Math.PI * 2);
    ctx.arc(148, 150, 8, 0, Math.PI * 2);
    ctx.arc(166, 160, 8, 0, Math.PI * 2);
    ctx.fill();

    // Right: Load & Draw Official NSoC Winter Logo
    const nsocLogoImg = await loadImage("../assets/images/nsoc/nsoc-winter-logo-clean-transparent.png");
    if (nsocLogoImg) {
      ctx.drawImage(nsocLogoImg, w - 320, 130, 130, 130);
    }

    ctx.fillStyle = "#1d5039";
    ctx.font = "800 36px 'Manrope', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Nexus Spring of Code", w - 340, 185);

    ctx.fillStyle = "#0284c7";
    ctx.font = "bold 24px 'DM Sans', sans-serif";
    ctx.fillText("WINTER EDITION 2026", w - 340, 222);

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
    ctx.letterSpacing = "4px";
    ctx.fillText("★  OFFICIAL RECOGNITION OF OPEN SOURCE EXCELLENCE  ★", w / 2, 350);

    ctx.fillStyle = "#1d5039";
    ctx.font = "bold 78px Georgia, 'Times New Roman', serif";
    ctx.fillText("CERTIFICATE OF CONTRIBUTION", w / 2, 445);

    // Gold decorative underline with diamond center
    ctx.strokeStyle = "#c8973e";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 280, 480);
    ctx.lineTo(w / 2 - 30, 480);
    ctx.moveTo(w / 2 + 30, 480);
    ctx.lineTo(w / 2 + 280, 480);
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
    const name = (currentContributor && (currentContributor.name || currentContributor.login)) || "PetSathi Contributor";
    const username = (currentContributor && currentContributor.login) || "contributor";
    const avatarSrc = currentAvatarDataUrl || (certAvatarImg ? certAvatarImg.src : null);

    const avatarX = w / 2;
    const avatarY = 670;
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

    // 8. Contributor Name (Prominent & Elegant)
    ctx.fillStyle = "#183827";
    ctx.font = "bold 74px Georgia, 'Times New Roman', serif";
    ctx.textAlign = "center";
    ctx.fillText(name, w / 2, 850);

    // Contributor GitHub Handle
    ctx.fillStyle = "#286849";
    ctx.font = "600 32px 'DM Sans', sans-serif";
    ctx.fillText(`@${username} • GitHub Contributor`, w / 2, 910);

    // 9. Recognition Statement Citation
    const citation =
      "In sincere appreciation of your dedicated contributions to PetSathi during the Nexus Spring of Code (NSoC) Winter Edition 2026. Your valuable open-source participation, code craftsmanship, and collaborative spirit have directly helped empower pet parents and companions across the community.";

    ctx.fillStyle = "#3e5246";
    ctx.font = "400 31px 'DM Sans', sans-serif";
    drawWrappedText(ctx, citation, w / 2, 1030, 1600, 52, "center");

    // 10. Footer Section: Date (Left), Gold Seal (Center), Signatures (Right)
    const footerY = 1350;

    // Divider line above footer
    ctx.strokeStyle = "#e5efe0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(160, 1260);
    ctx.lineTo(w - 160, 1260);
    ctx.stroke();

    // Left: Issue Date
    ctx.textAlign = "left";
    ctx.fillStyle = "#718078";
    ctx.font = "bold 20px 'DM Sans', sans-serif";
    ctx.fillText("DATE OF ISSUANCE", 180, footerY);

    ctx.fillStyle = "#263b30";
    ctx.font = "600 30px 'DM Sans', sans-serif";
    const dateText = certIssueDate ? certIssueDate.textContent : "November 23, 2026";
    ctx.fillText(dateText, 180, footerY + 45);

    ctx.fillStyle = "#8a9e91";
    ctx.font = "400 20px 'DM Sans', sans-serif";
    ctx.fillText("Nexus Spring of Code 2026", 180, footerY + 80);

    // Center: Official Embossed Gold Seal
    const sealX = w / 2;
    const sealY = footerY + 30;
    const sealRadius = 80;

    // Draw Gold radial gradient seal
    const sealGrad = ctx.createRadialGradient(sealX, sealY, 10, sealX, sealY, sealRadius);
    sealGrad.addColorStop(0, "#fef3c7");
    sealGrad.addColorStop(0.7, "#f59e0b");
    sealGrad.addColorStop(1, "#b45309");

    ctx.save();
    ctx.beginPath();
    ctx.arc(sealX, sealY, sealRadius, 0, Math.PI * 2);
    ctx.fillStyle = sealGrad;
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#92400e";
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.restore();

    // Inner seal circle
    ctx.beginPath();
    ctx.arc(sealX, sealY, sealRadius - 14, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Star icon / emblem in seal
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px 'Font Awesome 6 Free', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("★", sealX, sealY + 10);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px 'DM Sans', sans-serif";
    ctx.fillText("NSoC 2026", sealX, sealY - 24);
    ctx.fillText("WINTER", sealX, sealY + 36);

    ctx.fillStyle = "#92400e";
    ctx.font = "800 15px 'DM Sans', sans-serif";
    ctx.fillText("OFFICIAL SEAL", sealX, sealY + sealRadius + 24);

    // Right: Signatures
    ctx.textAlign = "right";

    // Maintainer Signature script
    ctx.fillStyle = "#1d5039";
    ctx.font = "italic bold 44px 'Brush Script MT', 'Great Vibes', cursive, serif";
    ctx.fillText("PetSathi Core Team", w - 180, footerY + 10);

    // Signature underline
    ctx.strokeStyle = "#9ab6a3";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w - 440, footerY + 28);
    ctx.lineTo(w - 180, footerY + 28);
    ctx.stroke();

    ctx.fillStyle = "#1d5039";
    ctx.font = "bold 24px 'DM Sans', sans-serif";
    ctx.fillText("Project Maintainers & Mentors", w - 180, footerY + 60);

    ctx.fillStyle = "#718078";
    ctx.font = "400 20px 'DM Sans', sans-serif";
    ctx.fillText("PetSathi • NSoC Winter Edition 2026", w - 180, footerY + 90);

    // Bottom verification code
    const certId = currentCertId || "NSOC-PS26-CONTRIB";
    ctx.textAlign = "center";
    ctx.fillStyle = "#8a9e91";
    ctx.font = "400 20px monospace";
    ctx.fillText(`Verification ID: ${certId}   •   Verify authenticity at petsathi-nsoc.netlify.app`, w / 2, h - 115);

    return canvas;
  }

  // Trigger high-resolution PNG download
  async function downloadCertificatePNG() {
    if (!downloadBtn) return;
    const originalText = downloadBtn.innerHTML;
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Rendering PNG...';

    try {
      const canvas = await renderHighResCertificateCanvas();
      const username = (currentContributor && currentContributor.login) || "contributor";
      const filename = `PetSathi-NSoC-Certificate-${username}.png`;

      // Convert canvas to blob and download
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
          downloadBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Downloaded!';
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
    const username = (currentContributor && currentContributor.login) || "";
    const pageUrl = window.location.href;
    const text = `I'm thrilled to have contributed to PetSathi during Nexus Spring of Code (NSoC) 2026 – Winter Edition! 🐾 Check out my official contributor certificate:`;
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
    window.open(shareUrl, "_blank", "width=600,height=600");
  }

  // Copy shareable link
  function copyShareableLink() {
    const handle = (currentContributor && currentContributor.login) || usernameInput.value.trim();
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
  window.handleGenerateCertificate = handleGenerate;

  // Run on DOM load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

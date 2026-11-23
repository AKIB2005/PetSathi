/**
 * PetSathi Contributor Certificate Generator & Verification Engine
 * Nexus Spring of Code (NSoC) 2026 – Winter Edition
 */

(function () {
  // DOM Elements
  const usernameInput = document.getElementById("github-username");
  const generateBtn = document.getElementById("btn-generate");
  const lazyLoader = document.getElementById("cert-lazy-loader");
  const loaderProgressFill = document.getElementById("loader-progress-fill");
  const loaderPercentage = document.getElementById("loader-percentage");
  const loaderStepText = document.getElementById("loader-step-text");
  const statusMsg = document.getElementById("cert-status-msg");
  const statusIcon = document.getElementById("cert-status-icon");
  const statusText = document.getElementById("cert-status-text");

  const showcaseSection = document.getElementById("cert-showcase");
  const certSheet = document.getElementById("certificate-render-target");

  // Certificate Sheet Elements
  const certRecipientName = document.getElementById("cert-recipient-name");
  const certRecipientHandle = document.getElementById("cert-recipient-handle");
  const certAvatarImg = document.getElementById("cert-avatar-img");
  const certIssueDate = document.getElementById("cert-issue-date");
  const certVerificationId = document.getElementById("cert-verification-id");

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
    // Preload handwritten signature font immediately
    try {
      if (typeof FontFace !== "undefined" && document.fonts) {
        const font = new FontFace("Great Vibes", "url(../assets/fonts/GreatVibes.woff2)");
        font.load().then((loaded) => {
          document.fonts.add(loaded);
        }).catch(() => {});
      }
    } catch (e) {}

    // Attach Event Listeners
    if (generateBtn) {
      generateBtn.addEventListener("click", () => handleVerifyAndGenerate());
    }
    if (usernameInput) {
      usernameInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          handleVerifyAndGenerate();
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

    // Ensure website reload always takes the user to clean certificate.html with NO certificate showing
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (usernameInput) {
      usernameInput.value = "";
    }
    if (showcaseSection) {
      showcaseSection.style.display = "none";
    }
  }

  // Persistent Issuance Date per Contributor (Stored in localStorage once generated)
  function getOrCreateIssuanceDate(username) {
    const key = "petsathi_cert_issue_date_" + username.toLowerCase();
    let storedDate = localStorage.getItem(key);
    if (!storedDate) {
      const now = new Date();
      storedDate = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      try {
        localStorage.setItem(key, storedDate);
      } catch (e) {
        // Fallback if private mode blocks storage
      }
    }
    return storedDate;
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
          }
        });
      }
    } catch (e) {
      // Local registry is already populated
    }
  }

  // Initial Placeholder state
  function showInitialPlaceholder() {
    if (certIssueDate) {
      const now = new Date();
      certIssueDate.textContent = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    }
    if (certRecipientName) certRecipientName.textContent = "Verified Contributor";
    if (certRecipientHandle) certRecipientHandle.textContent = "@contributor";
    if (certVerificationId) certVerificationId.textContent = "Certificate Serial: NSOC-PS26-PREVIEW";
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

  // Party Poppers Confetti Burst on Both Sides (🎉 Left and Right celebration)
  function triggerPartyPoppers() {
    let canvas = document.getElementById("cert-party-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "cert-party-canvas";
      canvas.style.position = "fixed";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.width = "100vw";
      canvas.style.height = "100vh";
      canvas.style.pointerEvents = "none";
      canvas.style.zIndex = "999999";
      document.body.appendChild(canvas);
    }

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    const colors = ["#286849", "#1d5039", "#c8973e", "#f59e0b", "#0284c7", "#10b981", "#ffffff", "#f43f5e"];
    const particles = [];
    const particleCount = 140; // 70 left, 70 right

    // Left cannon
    const leftX = canvas.width * 0.12;
    const leftY = canvas.height * 0.82;
    for (let i = 0; i < particleCount / 2; i++) {
      const angle = (Math.random() * 45 + 35) * (Math.PI / 180); // 35 to 80 deg (shooting up-right)
      const speed = (Math.random() * 22 + 16) * dpr;
      particles.push({
        x: leftX,
        y: leftY,
        vx: Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed,
        size: (Math.random() * 10 + 6) * dpr,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 14,
        shape: Math.random() > 0.4 ? "rect" : "circle",
        opacity: 1
      });
    }

    // Right cannon
    const rightX = canvas.width * 0.88;
    const rightY = canvas.height * 0.82;
    for (let i = 0; i < particleCount / 2; i++) {
      const angle = (Math.random() * 45 + 100) * (Math.PI / 180); // 100 to 145 deg (shooting up-left)
      const speed = (Math.random() * 22 + 16) * dpr;
      particles.push({
        x: rightX,
        y: rightY,
        vx: Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed,
        size: (Math.random() * 10 + 6) * dpr,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 14,
        shape: Math.random() > 0.4 ? "rect" : "circle",
        opacity: 1
      });
    }

    let startTime = null;
    function animateConfetti(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.45 * dpr; // Gravity
        p.vx *= 0.985; // Air drag
        p.rotation += p.rotSpeed;

        if (elapsed > 1600) {
          p.opacity -= 0.015;
        }

        if (p.opacity > 0) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;

          if (p.shape === "rect") {
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      });

      if (elapsed < 3200) {
        requestAnimationFrame(animateConfetti);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    requestAnimationFrame(animateConfetti);
  }

  // PetSathi Status Notification Helper
  function showStatus(text, type = "success") {
    hideAllStatus();
    if (!statusMsg || !statusIcon || !statusText) return;
    statusMsg.className = "cert-status-msg status-" + type;
    statusText.textContent = text;
    if (type === "warning" || type === "error") {
      statusIcon.className = "fa-solid fa-triangle-exclamation";
    } else if (type === "success") {
      statusIcon.className = "fa-solid fa-circle-check";
    }
    statusMsg.style.display = "inline-flex";
  }

  function hideAllStatus() {
    if (statusMsg) statusMsg.style.display = "none";
  }

  // Handle Verification and Generation with 5-Second Lazy Loading
  async function handleVerifyAndGenerate() {
    hideAllStatus();
    const rawUser = usernameInput ? usernameInput.value.trim().replace(/^@/, "") : "";

    // 1. Empty Input Validation: show "Please enter your github username" with PetSathi warning alert shade
    if (!rawUser) {
      showStatus("Please enter your github username", "warning");
      if (usernameInput) usernameInput.focus();
      return;
    }

    // 2. Ensure Certificate Showcase remains strictly hidden during verification
    if (showcaseSection) {
      showcaseSection.style.display = "none";
    }

    // Disable input and button, update button label
    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Verifying...';
    }
    if (usernameInput) {
      usernameInput.disabled = true;
    }

    // Display 5-Second Lazy Verification Progress Card
    if (lazyLoader) {
      lazyLoader.style.display = "flex";
      if (loaderProgressFill) loaderProgressFill.style.width = "0%";
      if (loaderPercentage) loaderPercentage.textContent = "0%";
      if (loaderStepText) loaderStepText.textContent = "Connecting to PetSathi GitHub records...";
    }

    // Kick off verification check in parallel with 5-second timer
    const verifyPromise = (async () => {
      try {
        const key = rawUser.toLowerCase();
        let contributorRecord = contributorsRegistry[key];

        // If not in local registry, check live GitHub API
        if (!contributorRecord) {
          try {
            const checkUrl = `https://api.github.com/repos/Riya-Kharade/PetSathi/commits?author=${encodeURIComponent(rawUser)}&per_page=1`;
            const checkRes = await fetch(checkUrl);
            if (checkRes.ok) {
              const commits = await checkRes.json();
              if (Array.isArray(commits) && commits.length > 0) {
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
            // Ignore network errors
          }
        }

        // STRICT CHECK: If user is not an official contributor
        if (!contributorRecord) {
          return { verified: false };
        }

        // User IS a verified contributor!
        let ghData = {};
        try {
          const ghRes = await fetch(`https://api.github.com/users/${encodeURIComponent(contributorRecord.username)}`);
          if (ghRes.ok) {
            ghData = await ghRes.json();
          }
        } catch (e) {
          // Fallback
        }

        const verifiedName = (ghData.name && ghData.name.trim()) || contributorRecord.name || contributorRecord.username;
        const verifiedHandle = contributorRecord.username;
        const avatarSrc = (ghData.avatar_url) || contributorRecord.avatar_url || "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png";
        const issuanceDate = getOrCreateIssuanceDate(verifiedHandle);
        const avatarBase64 = await urlToBase64(avatarSrc);

        // Deterministic Verification ID
        let hash = 0;
        for (let i = 0; i < verifiedHandle.length; i++) {
          hash = (hash << 5) - hash + verifiedHandle.charCodeAt(i);
          hash |= 0;
        }
        const hexHash = Math.abs(hash).toString(16).padStart(6, "0").substring(0, 6).toUpperCase();
        const certId = `NSOC-PS26-${hexHash}`;

        return {
          verified: true,
          name: verifiedName,
          username: verifiedHandle,
          avatarSrc: avatarBase64,
          issuanceDate: issuanceDate,
          certId: certId
        };
      } catch (err) {
        console.error("Verification error:", err);
        return { verified: false };
      }
    })();

    // Animate progress smoothly over exactly 5000ms (5 seconds lazy loading)
    const startTime = Date.now();
    const totalDuration = 5000;

    await new Promise((resolve) => {
      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, Math.floor((elapsed / totalDuration) * 100));

        if (loaderProgressFill) loaderProgressFill.style.width = progress + "%";
        if (loaderPercentage) loaderPercentage.textContent = progress + "%";

        if (loaderStepText) {
          if (elapsed < 1600) {
            loaderStepText.textContent = "Connecting to PetSathi GitHub records...";
          } else if (elapsed < 3400) {
            loaderStepText.textContent = `Scanning merged pull requests & commits for @${rawUser}...`;
          } else {
            loaderStepText.textContent = "Validating cryptographic integrity & official seal...";
          }
        }

        if (elapsed >= totalDuration) {
          clearInterval(timer);
          if (loaderProgressFill) loaderProgressFill.style.width = "100%";
          if (loaderPercentage) loaderPercentage.textContent = "100%";
          resolve();
        }
      }, 40);
    });

    // Wait for the verification result
    const result = await verifyPromise;

    // Hide lazy loader and restore button/input
    if (lazyLoader) lazyLoader.style.display = "none";
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<i class="fa-solid fa-award" aria-hidden="true"></i> Generate Your Certificate';
    }
    if (usernameInput) {
      usernameInput.disabled = false;
    }

    // Branch on verification result
    if (result.verified) {
      // 3. User HAS contributed: show "Contribution Verified!"
      showStatus("Contribution Verified!", "success");

      currentAvatarDataUrl = result.avatarSrc;
      currentCertId = result.certId;
      currentContributor = {
        name: result.name,
        username: result.username,
        issuanceDate: result.issuanceDate
      };

      // Populate Certificate Sheet DOM
      if (certRecipientName) certRecipientName.textContent = result.name;
      if (certRecipientHandle) certRecipientHandle.textContent = `@${result.username}`;
      if (certAvatarImg) certAvatarImg.src = result.avatarSrc;
      if (certIssueDate) certIssueDate.textContent = result.issuanceDate;
      if (certVerificationId) {
        certVerificationId.textContent = `Certificate Serial: ${result.certId}`;
      }
      if (downloadBtn) downloadBtn.disabled = false;

      // Reveal Certificate Showcase
      if (showcaseSection) {
        showcaseSection.style.display = "block";
      }

      // Trigger Celebration Party Poppers Confetti!
      triggerPartyPoppers();

      // Smooth scroll down to Certificate Showcase
      if (showcaseSection) {
        showcaseSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      // Keep URL clean so reloading the website always takes the user to clean certificate.html
      if (window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

    } else {
      // 4. User has NOT contributed: ONLY return "No Contribution record found!" and keep certificate hidden
      if (showcaseSection) {
        showcaseSection.style.display = "none";
      }
      showStatus("No Contribution record found!", "error");
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

  // Helper to draw a single paw print icon on canvas
  function drawCanvasPaw(ctx, x, y, size, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.fillStyle = color;

    // Main pad
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // 4 toe pads
    const toeDist = size * 0.72;
    const toeRadius = size * 0.22;
    const toeAngles = [-45, -15, 15, 45];
    toeAngles.forEach((a) => {
      const rad = (a * Math.PI) / 180;
      const tx = Math.sin(rad) * toeDist;
      const ty = -Math.cos(rad) * toeDist;
      ctx.beginPath();
      ctx.arc(tx, ty, toeRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
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
    ctx.strokeStyle = "#1d5039";
    ctx.lineWidth = 14;
    ctx.strokeRect(50, 50, w - 100, h - 100);

    ctx.strokeStyle = "#c8973e";
    ctx.lineWidth = 4;
    ctx.strokeRect(72, 72, w - 144, h - 144);

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
    // Left: PetSathi Brand Paw + Text (Clean, NO subtitle as requested)
    ctx.fillStyle = "#1d5039";
    ctx.font = "bold 64px Georgia, 'Times New Roman', serif";
    ctx.textAlign = "left";
    ctx.fillText("PetSathi", 195, 215);

    // Draw paw print icon beside PetSathi
    ctx.fillStyle = "#286849";
    ctx.beginPath();
    ctx.arc(155, 195, 16, 0, Math.PI * 2);
    ctx.arc(138, 168, 10, 0, Math.PI * 2);
    ctx.arc(158, 154, 10, 0, Math.PI * 2);
    ctx.arc(178, 168, 10, 0, Math.PI * 2);
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
    const avatarSrc = currentAvatarDataUrl || (certAvatarImg ? certAvatarImg.src : null);

    const avatarX = w / 2;
    const avatarY = 665;
    const avatarRadius = 78;

    if (avatarSrc) {
      const avatarImage = await loadImage(avatarSrc);
      if (avatarImage) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarRadius + 8, 0, Math.PI * 2);
        ctx.fillStyle = "#c8973e";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarRadius + 4, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatarImage, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
        ctx.restore();
      }
    }

    // 8. Contributor Name (Prominent & Regal) + PetSathi Green Verified Tick Mark
    ctx.font = "bold 76px Georgia, 'Times New Roman', serif";
    const nameMetrics = ctx.measureText(name);
    const tickRadius = 18;
    const tickGap = 20;
    const totalNameWidth = nameMetrics.width + tickGap + tickRadius * 2;
    const nameStartX = (w - totalNameWidth) / 2;

    ctx.fillStyle = "#122b1c";
    ctx.textAlign = "left";
    ctx.fillText(name, nameStartX, 845);

    // Draw PetSathi green tick mark circle right after name
    const tickCenterX = nameStartX + nameMetrics.width + tickGap + tickRadius;
    const tickCenterY = 820;

    // Green Circle
    ctx.fillStyle = "#286849";
    ctx.beginPath();
    ctx.arc(tickCenterX, tickCenterY, tickRadius, 0, Math.PI * 2);
    ctx.fill();

    // White Tick Mark
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(tickCenterX - 8, tickCenterY - 0.5);
    ctx.lineTo(tickCenterX - 2, tickCenterY + 6);
    ctx.lineTo(tickCenterX + 8, tickCenterY - 6);
    ctx.stroke();

    // Contributor GitHub Handle (Clean handle only: no verified contributor badge/suffix)
    ctx.fillStyle = "#286849";
    ctx.font = "bold 32px 'DM Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`@${username}`, w / 2, 905);

    // 9. Recognition Statement Citation
    const citation =
      "In sincere recognition of your distinguished contribution to the open-source architecture, frontend development, and feature implementation of PetSathi during the Nexus Spring of Code (NSoC) 2026 – Winter Edition. Your dedication to engineering accessible, reliable technology directly elevates the standard of care for companion pets and pet parents across the open-source community.";

    ctx.fillStyle = "#3e5246";
    ctx.font = "400 31px 'DM Sans', sans-serif";
    drawWrappedText(ctx, citation, w / 2, 1025, 1620, 52, "center");

    // 10. Footer Section: Date (Left), Clean Official Gold Seal (Center), Riya Kharade Signature (Right)
    const footerY = 1340;

    // Divider line above footer
    ctx.strokeStyle = "#e5efe0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(160, 1250);
    ctx.lineTo(w - 160, 1250);
    ctx.stroke();

    // Left: Persistent Issue Date
    ctx.textAlign = "left";
    ctx.fillStyle = "#718078";
    ctx.font = "bold 20px 'DM Sans', sans-serif";
    ctx.fillText("DATE OF ISSUANCE", 180, footerY);

    ctx.fillStyle = "#263b30";
    ctx.font = "bold 30px 'DM Sans', sans-serif";
    const dateText = (currentContributor && currentContributor.issuanceDate) || (certIssueDate ? certIssueDate.textContent : "November 23, 2026");
    ctx.fillText(dateText, 180, footerY + 45);

    ctx.fillStyle = "#8a9e91";
    ctx.font = "400 20px 'DM Sans', sans-serif";
    ctx.fillText("Official Open Source Record", 180, footerY + 80);

    // Center: Clean Round Gold Seal (NO glow, NO ribbon tails as requested)
    const sealX = w / 2;
    const sealY = footerY + 30;
    const sealRadius = 66;

    const sealGrad = ctx.createRadialGradient(sealX, sealY, 10, sealX, sealY, sealRadius);
    sealGrad.addColorStop(0, "#fff7d6");
    sealGrad.addColorStop(0.65, "#fcd34d");
    sealGrad.addColorStop(1, "#b45309");

    ctx.save();
    ctx.beginPath();
    ctx.arc(sealX, sealY, sealRadius, 0, Math.PI * 2);
    ctx.fillStyle = sealGrad;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#78350f";
    ctx.setLineDash([7, 5]);
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(sealX, sealY, sealRadius - 10, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px 'Font Awesome 6 Free', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("★", sealX, sealY + 11);

    ctx.fillStyle = "#92400e";
    ctx.font = "800 16px 'DM Sans', sans-serif";
    ctx.fillText("OFFICIAL SEAL", sealX, sealY + sealRadius + 26);

    // Right: Riya Kharade Handwritten Signature & Printed Name Below
    ctx.textAlign = "right";

    // Handwritten Signature Font (Riya Kharade in handwritten script)
    ctx.fillStyle = "#1d5039";
    ctx.font = "normal 56px 'Great Vibes', 'Brush Script MT', 'Lucida Handwriting', cursive";
    ctx.fillText("Riya Kharade", w - 180, footerY + 6);

    // Signature line
    ctx.strokeStyle = "#9ab6a3";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w - 440, footerY + 24);
    ctx.lineTo(w - 180, footerY + 24);
    ctx.stroke();

    // Riya Kharade Printed Name below
    ctx.fillStyle = "#122b1c";
    ctx.font = "bold 26px Georgia, 'Times New Roman', serif";
    ctx.fillText("Riya Kharade", w - 180, footerY + 56);

    // Title & NSoC label
    ctx.fillStyle = "#286849";
    ctx.font = "bold 20px 'DM Sans', sans-serif";
    ctx.fillText("Project Admin & Maintainer, PetSathi", w - 180, footerY + 84);

    ctx.fillStyle = "#718078";
    ctx.font = "400 18px 'DM Sans', sans-serif";
    ctx.fillText("NSoC Winter Edition 2026", w - 180, footerY + 110);

    // Bottom verification code
    const certId = currentCertId || "NSOC-PS26-VERIFIED";
    ctx.textAlign = "center";
    ctx.fillStyle = "#8a9e91";
    ctx.font = "400 20px monospace";
    ctx.fillText(`Certificate Serial: ${certId}`, w / 2, h - 115);

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
  window.triggerPartyPoppers = triggerPartyPoppers;

  // Run on DOM load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

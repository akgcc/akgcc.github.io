const gachaNameByPoolId = {};
const CREDENTIALS = {};
const AUTH_API = "https://yostarcors.ndcdev.workers.dev/";
// const AUTH_API = "http://localhost:8787/";
const serverString_Yostar =
  serverString == SERVERS.CN ? SERVERS.EN : serverString;
fetch(`${DATA_BASE[serverString_Yostar]}/gamedata/excel/gacha_table.json`)
  .then((res) => fixedJson(res))
  .then((js) => {
    gachaDetail = js;
    (gachaDetail?.gachaPoolClient || []).forEach((p) => {
      // skip generic standard banner names starting with "Rare Operators" (case-insensitive)
      if (/^rare operators/i.test(p.gachaPoolName)) return;

      gachaNameByPoolId[p.gachaPoolId] = p.gachaPoolName;
    });

    return get_char_table(false, serverString_Yostar, false);
  })
  .then((js) => {
    operatorData = js;

    function saveToLocal(userId, fetchData) {
      // Load existing storage
      let storage = JSON.parse(localStorage.getItem("gachaData") || "{}");
      if (!storage[serverString_Yostar]) storage[serverString_Yostar] = {};

      const newRows = fetchData.data?.rows || [];
      newRows.forEach((r) => {
        r.star = parseInt(r.star, 10); // convert "6星" -> 6
      });
      // Initialize user data if missing
      if (!storage[serverString_Yostar][userId]) {
        if (fetchData.message === "ok") {
          storage[serverString_Yostar][userId] = {
            data: {
              rows: newRows,
              count: newRows.length,
            },
            timestamp: Date.now(),
          };
          localStorage.setItem("gachaData", JSON.stringify(storage));
        }
        return; // fetch failed or no data, do nothing
      }

      // Only merge if fetch succeeded
      if (fetchData.message !== "ok") return;

      const existing = storage[serverString_Yostar][userId];
      const existingRows = existing.data?.rows || [];

      // Boundary-based overlap detection
      let overlapIndex = 0;
      const maxCheck = Math.min(existingRows.length, newRows.length);
      function cmpRows(oldRow, newRow) {
        return (
          oldRow.charId === newRow.charId &&
          oldRow.poolId === newRow.poolId &&
          oldRow.at === newRow.at
        );
      }

      // Find largest k where:
      // existingRows[0..k-1] === newRows[newLen-k .. newLen-1]
      for (let k = maxCheck; k > 0; k--) {
        let ok = true;

        for (let i = 0; i < k; i++) {
          if (!cmpRows(existingRows[i], newRows[newRows.length - k + i])) {
            ok = false;
            break;
          }
        }

        if (ok) {
          overlapIndex = k;
          break;
        }
      }

      // Take the non-overlapping rows from the **front of newRows** (newest → oldest)
      const rowsToPrepend = newRows.slice(0, newRows.length - overlapIndex);

      // Merge: prepend new rows, keep newest→oldest order
      const mergedRows = [...rowsToPrepend, ...existingRows];

      // Save back to localStorage
      storage[serverString_Yostar][userId] = {
        data: {
          rows: mergedRows,
          count: mergedRows.length,
        },
        timestamp: Date.now(),
      };

      localStorage.setItem("gachaData", JSON.stringify(storage));
    }

    function showStatusCard(message, type = "error") {
      const container = document.getElementById("gachaCards");
      if (!container) return;

      container.innerHTML = "";

      const card = document.createElement("div");
      card.className = `gacha-card status ${type}`;

      const body = document.createElement("div");
      body.className = "card-body";
      body.textContent = message;

      card.appendChild(body);
      container.appendChild(card);
    }

    function addGachaCard({
      headerText,
      lifetimePulls,
      currentPity,
      overall6StarRate,
      overall5StarRate,
      sixStars,
      type, // <- new
    }) {
      const container = document.getElementById("gachaCards");
      if (!container) return;

      const card = document.createElement("div");
      card.className = `gacha-card ${type || ""}`; // <-- add type as a class

      // Header
      const header = document.createElement("div");
      header.className = "card-header";
      header.textContent = headerText || "Gacha";
      card.appendChild(header);

      // Rows container
      const rowsContainer = document.createElement("div");
      rowsContainer.className = "card-rows";

      // Row data without colors
      const rowsData = [
        { text: `Total Pulls: <span>${lifetimePulls}</span>` },
        { text: `Current Pity: <span>${currentPity}</span>` },
        {
          text: `<div>Overall <span data-rarity="5">6★</span> Rate:</div> <span>${overall6StarRate}</span>`,
        },
        {
          text: `<div>Overall <span data-rarity="4">5★</span> Rate:</div> <span>${overall5StarRate}</span>`,
        },
      ];

      rowsData.forEach(({ text }) => {
        const row = document.createElement("div");
        row.className = "row"; // just the class, no inline bg
        row.innerHTML = text;
        rowsContainer.appendChild(row);
      });

      card.appendChild(rowsContainer);
      if (Array.isArray(sixStars) && sixStars.length) {
        const sixStarRow = document.createElement("div");
        sixStarRow.className = "sixstar-row";

        sixStars.forEach((s) => {
          const item = document.createElement("div");
          item.className = "sixstar-item";

          // calculate color: green = low, red = high
          const pity = s.pity;
          const color =
            pity <= 40
              ? `rgb(${Math.round((pity / 40) * 255)},255,0)` // green→yellow
              : `rgb(255,${Math.round(255 - ((pity - 40) / 40) * 255)},0)`; // yellow→red

          // bake color into the span inline
          item.innerHTML = `${s.charName} <span class="sixstar-pity" style="color:${color}">${pity}</span>`;

          sixStarRow.appendChild(item);
        });

        card.appendChild(sixStarRow);
      }

      container.appendChild(card);
    }
    function fixTenPullOrder(rows) {
      const fixed = [];
      let i = 0;

      while (i < rows.length) {
        let j = i + 1;

        // find consecutive rows with same timestamp
        while (j < rows.length && rows[j].at === rows[i].at) {
          j++;
        }

        const chunk = rows.slice(i, j);

        // reverse only if it's a multi-pull (10-pull shows up as same timestamp)
        if (chunk.length === 10) {
          chunk.reverse();
        }

        fixed.push(...chunk);
        i = j;
      }

      return fixed;
    }

    function calculateAndDisplayCards(userId) {
      const storage = JSON.parse(localStorage.getItem("gachaData") || "{}");
      const rawRows = storage[serverString_Yostar]?.[userId]?.data?.rows || [];
      if (!rawRows.length) return;

      const userData =
        pullOrderMode === "ingame" ? fixTenPullOrder(rawRows) : rawRows;

      const groups = {
        standard: [],
        kernel: [],
        limited: [],
      };

      // Assign rows to groups based on actual poolId patterns
      userData.forEach((row) => {
        const pid = row.poolId;
        if (!pid) return;

        if (
          pid.startsWith("SINGLE_") ||
          pid.startsWith("DOUBLE_") ||
          pid.startsWith("NORM_")
        ) {
          groups.standard.push(row);
        } else if (
          pid.startsWith("CLASSIC_") ||
          pid.startsWith("FESCLASSIC_")
        ) {
          groups.kernel.push(row);
        } else if (pid.startsWith("LIMITED_") || pid.startsWith("LINKAGE_")) {
          groups.limited.push(row);
        }
      });

      const limitedByPool = {};
      groups.limited.forEach((r) => {
        if (!limitedByPool[r.poolId]) limitedByPool[r.poolId] = [];
        limitedByPool[r.poolId].push(r);
      });

      const standardByPool = {};
      groups.standard.forEach((r) => {
        if (!standardByPool[r.poolId]) standardByPool[r.poolId] = [];
        standardByPool[r.poolId].push(r);
      });

      // Helper to calculate stats (same as before)
      function getStats(rows) {
        if (!rows.length)
          return {
            lifetimePulls: 0,
            currentPity: 0,
            overall6StarRate: "0%",
            overall5StarRate: "0%",
            sixStars: [],
          };
        const orderedRows = [...rows].reverse(); // oldest → newest

        const totalPulls = orderedRows.length;
        let sixStars = [];
        let pullsSinceLastSix = 0;

        orderedRows.forEach((r) => {
          pullsSinceLastSix++;
          if (r.star === 6) {
            sixStars.push({
              charId: r.charId,
              charName: operatorData[r.charId]?.name || r.charId,
              pity: pullsSinceLastSix,
            });
            pullsSinceLastSix = 0;
          }
        });

        return {
          lifetimePulls: totalPulls,
          currentPity: pullsSinceLastSix,
          overall6StarRate:
            ((sixStars.length / totalPulls) * 100).toFixed(2) + "%",
          overall5StarRate:
            (
              (orderedRows.filter((r) => r.star === 5).length / totalPulls) *
              100
            ).toFixed(2) + "%",
          sixStars,
        };
      }

      // Clear old cards
      const container = document.getElementById("gachaCards");
      container.innerHTML = "";
      // Overall card (all pulls, no pity meaning)
      const overallStats = getStats(userData);
      addGachaCard({
        headerText: "Overall",
        type: "overview",
        lifetimePulls: overallStats.lifetimePulls,
        currentPity: "-", // override if needed
        overall6StarRate: overallStats.overall6StarRate,
        overall5StarRate: overallStats.overall5StarRate,
      });
      // Limited banners
      Object.entries(limitedByPool).forEach(([poolId, rows]) => {
        const bannerName = gachaNameByPoolId[poolId] || poolId;
        addGachaCard({
          headerText: bannerName,
          type: "limited",
          ...getStats(rows),
        });
      });

      // Standard: Overall grouped card
      if (groups.standard.length) {
        addGachaCard({
          headerText: "Standard (Combined)",
          type: "overview",
          ...getStats(groups.standard),
        });
      }

      // Standard: Individual banner cards
      Object.entries(standardByPool).forEach(([poolId, rows]) => {
        const bannerName = gachaNameByPoolId[poolId] || poolId;
        const stats = getStats(rows); // keeps sixStars, overall6StarRate, etc.

        // Only override pity for display
        addGachaCard({
          headerText: bannerName,
          type: "standard",
          ...stats,
          currentPity: "-", // hide pity
        });
      });

      // Kernel
      if (groups.kernel.length) {
        addGachaCard({
          headerText: "Kernel Headhunting",
          type: "kernel",
          ...getStats(groups.kernel),
        });
      }
    }

    const exportJsonBtn = document.getElementById("exportJsonBtn");
    const exportCsvBtn = document.getElementById("exportCsvBtn");

    function getActiveUserRows() {
      const userId = CREDENTIALS?.uid;
      if (!userId) return null;

      const storage = JSON.parse(localStorage.getItem("gachaData") || "{}");
      return storage[serverString_Yostar]?.[userId]?.data?.rows || null;
    }
    function formatLocalDateTime(ts = Date.now()) {
      const d = new Date(ts);

      const pad = (n) => String(n).padStart(2, "0");

      return (
        d.getFullYear() +
        "-" +
        pad(d.getMonth() + 1) +
        "-" +
        pad(d.getDate()) +
        " " +
        pad(d.getHours()) +
        ":" +
        pad(d.getMinutes()) +
        ":" +
        pad(d.getSeconds())
      );
    }

    function downloadFile(filename, content, mime) {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    exportJsonBtn.onclick = () => {
      const rows = getActiveUserRows();
      if (!rows) return alert("No data to export");

      const exportedRows = rows.map((r) => ({
        ...r,
        charName: operatorData[r.charId]?.name || r.charName || "",
        poolName: gachaNameByPoolId[r.poolId] || r.poolName || "",
        star: r.star,
      }));

      const payload = {
        server: serverString_Yostar,
        userId: CREDENTIALS?.uid,
        exportedAt: Date.now(),
        exportedAtStr: formatLocalDateTime(),
        rows: exportedRows,
      };

      downloadFile(
        `gacha_${serverString_Yostar}_${CREDENTIALS?.uid}.json`,
        JSON.stringify(payload, null, 2),
        "application/json",
      );
    };

    exportCsvBtn.onclick = () => {
      const rows = getActiveUserRows();
      if (!rows || !rows.length) return alert("No data to export");

      const headers = [
        "charId",
        "charName",
        "star",
        "color",
        "poolId",
        "poolName",
        "typeName",
        "at",
        "atStr",
      ];

      const csvEscape = (v) => {
        if (v == null) return "";
        const s = String(v);
        return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };

      const lines = [];
      lines.push(headers.join(","));

      rows.forEach((r) => {
        lines.push(
          [
            r.charId,
            operatorData[r.charId]?.name || r.charName || "",
            r.star,
            r.color,
            r.poolId,
            gachaNameByPoolId[r.poolId] || r.poolName || "",
            r.typeName,
            r.at,
            r.atStr,
          ]
            .map(csvEscape)
            .join(","),
        );
      });

      const csv = lines.join("\r\n") + "\r\n";

      downloadFile(
        `gacha_${serverString_Yostar}_${CREDENTIALS?.uid}.csv`,
        csv,
        "text/csv;charset=utf-8",
      );
    };
    let pullOrderMode = "ingame";

    document.querySelectorAll(".pullOrderBox .button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.order;
        if (mode === pullOrderMode) return;

        pullOrderMode = mode;

        document
          .querySelectorAll(".pullOrderBox .button")
          .forEach((b) => b.classList.toggle("checked", b === btn));

        const uid = CREDENTIALS?.uid;
        if (uid) {
          calculateAndDisplayCards(uid);
        }
      });
    });
    const clearDataBtn = document.getElementById("resetUserDataBtn");

    clearDataBtn.onclick = () => {
      const userId = CREDENTIALS?.uid;

      if (!userId) {
        alert("Login first.");
        return;
      }

      if (
        !confirm(
          `This will delete all gacha data older than 90 days for:\n\n` +
            `UID: ${userId}\n` +
            `Server: ${serverString_Yostar}\n\n` +
            `This cannot be undone.`,
        )
      ) {
        return;
      }

      const storage = JSON.parse(localStorage.getItem("gachaData") || "{}");

      if (storage[serverString_Yostar]?.[userId]) {
        delete storage[serverString_Yostar][userId];

        // clean empty server bucket
        if (!Object.keys(storage[serverString_Yostar]).length) {
          delete storage[serverString_Yostar];
        }

        localStorage.setItem("gachaData", JSON.stringify(storage));
      }

      // Re-run the exact same flow as URL autofill
      showStatusCard(
        "Data deleted, refresh the page to fetch fresh data.",
        "info",
      );
    };
    // YOSTAR LOGIN SECTION //

    // Elements
    const emailInput = document.getElementById("emailInput");
    const codeInput = document.getElementById("codeInput");
    const sendCodeBtn = document.getElementById("sendCodeBtn");
    const loginBtn = document.getElementById("loginBtn");
    const loginMessage = document.getElementById("loginMessage");

    // Load top-level login data
    const allCookies = JSON.parse(
      localStorage.getItem("yostarCookies") || "{}",
    );

    let yostarCookies = allCookies[serverString_Yostar] || {};
    let currentUid = yostarCookies.uid;
    CREDENTIALS.uid = currentUid;
    console.log(
      "in storage",
      localStorage.getItem("yostarCookies"),
      yostarCookies,
      currentUid,
    );
    // If logged in, auto-fetch
    if (yostarCookies.YSSID && yostarCookies["YSSID.sig"] && currentUid) {
      fetchPullsForUid(currentUid, yostarCookies);
    }
    // Send email code
    sendCodeBtn.onclick = async () => {
      const email = emailInput.value.trim();
      if (!email) return (loginMessage.textContent = "Enter your email.");
      loginMessage.textContent = "Sending code...";
      try {
        const res = await fetch(AUTH_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, server: serverString_Yostar }),
        });
        const data = await res.json();
        if (data.status === "CODE_SENT") {
          loginMessage.textContent = "Code sent! Check your email.";
        } else {
          loginMessage.textContent = "Failed to send code.";
        }
      } catch (e) {
        loginMessage.textContent = "Error sending code.";
        console.error(e);
      }
    };

    // Submit code + login
    loginBtn.onclick = async () => {
      const email = emailInput.value.trim();
      const code = codeInput.value.trim();

      if (!email || !code)
        return (loginMessage.textContent = "Enter email and code.");
      loginMessage.textContent = "Logging in...";
      try {
        const res = await fetch(AUTH_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code, server: serverString_Yostar }),
        });
        const result = await res.json();

        if (!result.cookies || !result.data?.data?.uid) {
          loginMessage.textContent = "Login failed.";
          return;
        }

        const uid = result.data.data.uid;
        CREDENTIALS.uid = uid;
        // Store top-level cookies and uid
        yostarCookies.YSSID = result.cookies.YSSID;
        yostarCookies["YSSID.sig"] = result.cookies["YSSID.sig"];
        yostarCookies.uid = uid;

        allCookies[serverString_Yostar] = yostarCookies;

        localStorage.setItem("yostarCookies", JSON.stringify(allCookies));

        loginMessage.textContent = `Logged in! UID: ${uid}`;
        fetchPullsForUid(uid, yostarCookies);
      } catch (e) {
        loginMessage.textContent = "Login error.";
        console.error(e);
      }
    };

    // Fetch gacha pulls using stored cookies and uid
    async function fetchPullsForUid(uid, cookies) {
      loginMessage.textContent = `Fetching gacha data for UID ${uid}...`;
      try {
        const res = await fetch(AUTH_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            YSSID: cookies.YSSID,
            YSSID_sig: cookies["YSSID.sig"],
            server: serverString_Yostar,
          }),
        });

        const data = await res.json();

        // Check if token expired
        const rows = data.pulls?.data?.rows || [];
        if (!rows.length) {
          loginMessage.textContent = "No gacha data found for this user.";
          showStatusCard("No gacha data found.", "info");
          return;
        }

        if (data?.pulls?.message !== "ok" || data.pulls?.code === 401) {
          // Token expired, clear stored cookies
          delete allCookies[serverString_Yostar];
          localStorage.setItem("yostarCookies", JSON.stringify(allCookies));

          loginMessage.textContent = "Session expired. Please login again.";
          showStatusCard("No gacha data found.", "info");
          return;
        }

        // Save rows under serverString_Yostar -> uid
        saveToLocal(uid, data.pulls);
        calculateAndDisplayCards(uid);
        loginMessage.textContent = "Data loaded!";
      } catch (e) {
        loginMessage.textContent = "Failed to fetch gacha data.";
        console.error(e);
      }
    }
  });

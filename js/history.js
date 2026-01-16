const idInput = document.getElementById("idInput");
let debounceTimeout;
const gachaNameByPoolId = {};
fetch(`${DATA_BASE[serverString]}/gamedata/excel/gacha_table.json`)
  .then((res) => fixedJson(res))
  .then((js) => {
    gachaDetail = js;
    (gachaDetail?.gachaPoolClient || []).forEach((p) => {
      // skip generic standard banner names starting with "Rare Operators" (case-insensitive)
      if (/^rare operators/i.test(p.gachaPoolName)) return;

      gachaNameByPoolId[p.gachaPoolId] = p.gachaPoolName;
    });

    return get_char_table(false, serverString, false);
  })
  .then((js) => {
    operatorData = js;
    idInput.addEventListener("input", () => {
      idInput.value = idInput.value.replace(/\D/g, "");
      const value = idInput.value;

      clearTimeout(debounceTimeout);

      if (value.length == 8) {
        // Update the URL if we have a valid UID
        const url = new URL(window.location);
        url.searchParams.set("uid", value);
        window.history.replaceState({}, "", url);
        debounceTimeout = setTimeout(() => {
          showStatusCard(`Fetching pull history for user: ${value}`, "loading");
          //https://account.yo-star.com/api/game/gachas?key=ark&index=1&size=9999&uid=${value}
          fetch(
            `https://yostarcors.ndcdev.workers.dev/?uid=${value}&server=${serverString}`,
          )
            .then((res) => res.json())
            .then((data) => {
              if (data.message !== "ok") {
                showStatusCard("Failed to fetch gacha data.", "error");
                return;
              }

              const rows = data.data?.rows || [];

              if (!rows.length) {
                showStatusCard(
                  `No gacha data found for user: ${value}\nMake sure you have selected the correct server.`,
                  "info",
                );
                return;
              }

              saveToLocal(value, data);
              calculateAndDisplayCards(value);
            })
            .catch((err) => console.error("Fetch error:", err));
        }, 200);
      }
    });

    // Auto-fill UID from URL after the listener exists
    (function loadUidFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const uid = params.get("uid");

      if (uid && /^\d{8}$/.test(uid)) {
        // only accept 8-digit UID
        idInput.value = uid;

        // trigger the listener after setting the value
        idInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    })();

    function normalizeExistingStars() {
      const storage = JSON.parse(localStorage.getItem("gachaData") || "{}");

      if (!storage[serverString]) return;

      const users = Object.keys(storage[serverString]);
      users.forEach((userId) => {
        const userData = storage[serverString][userId]?.data?.rows || [];
        userData.forEach((r) => {
          r.star = parseInt(r.star, 10); // convert "6星" -> 6
        });
        // update count in case something changed
        storage[serverString][userId].data.count = userData.length;
      });

      localStorage.setItem("gachaData", JSON.stringify(storage));
    }
    normalizeExistingStars();

    function saveToLocal(userId, fetchData) {
      // Load existing storage
      let storage = JSON.parse(localStorage.getItem("gachaData") || "{}");
      if (!storage[serverString]) storage[serverString] = {};

      const newRows = fetchData.data?.rows || [];
      newRows.forEach((r) => {
        r.star = parseInt(r.star, 10); // convert "6星" -> 6
      });
      // Initialize user data if missing
      if (!storage[serverString][userId]) {
        if (fetchData.message === "ok") {
          storage[serverString][userId] = {
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

      const existing = storage[serverString][userId];
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
      storage[serverString][userId] = {
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
      const rawRows = storage[serverString]?.[userId]?.data?.rows || [];
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
      const userId = idInput.value;
      if (!userId || userId.length !== 8) return null;

      const storage = JSON.parse(localStorage.getItem("gachaData") || "{}");
      return storage[serverString]?.[userId]?.data?.rows || null;
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
        server: serverString,
        userId: idInput.value,
        exportedAt: Date.now(),
        exportedAtStr: formatLocalDateTime(),
        rows: exportedRows,
      };

      downloadFile(
        `gacha_${serverString}_${idInput.value}.json`,
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
        `gacha_${serverString}_${idInput.value}.csv`,
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

        const uid = idInput.value;
        if (uid && uid.length === 8) {
          calculateAndDisplayCards(uid);
        }
      });
    });
    const clearDataBtn = document.getElementById("resetUserDataBtn");

    clearDataBtn.onclick = () => {
      const userId = idInput.value;

      if (!userId || userId.length !== 8) {
        alert("Enter a valid 8-digit User ID first.");
        return;
      }

      if (
        !confirm(
          `This will delete all gacha data older than 90 days for:\n\n` +
            `UID: ${userId}\n` +
            `Server: ${serverString}\n\n` +
            `This cannot be undone.`,
        )
      ) {
        return;
      }

      const storage = JSON.parse(localStorage.getItem("gachaData") || "{}");

      if (storage[serverString]?.[userId]) {
        delete storage[serverString][userId];

        // clean empty server bucket
        if (!Object.keys(storage[serverString]).length) {
          delete storage[serverString];
        }

        localStorage.setItem("gachaData", JSON.stringify(storage));
      }

      // Re-run the exact same flow as URL autofill
      idInput.dispatchEvent(new Event("input", { bubbles: true }));
    };
  });

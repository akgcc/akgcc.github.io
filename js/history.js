const idInput = document.getElementById("idInput");
let debounceTimeout;
const gachaNameByPoolId = {};
fetch(`${DATA_BASE[serverString]}/gamedata/excel/gacha_table.json`)
  .then((res) => fixedJson(res))
  .then((js) => {
    gachaDetail = js;
    (gachaDetail?.gachaPoolClient || []).forEach((p) => {
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
        debounceTimeout = setTimeout(() => {
          //https://account.yo-star.com/api/game/gachas?key=ark&index=1&size=9999&uid=${value}
          fetch(`https://yostarcors.ndcdev.workers.dev/?uid=${value}`)
            .then((res) => res.json())
            .then((data) => {
              saveToLocal(value, data);
              calculateAndDisplayCards(value);
            })
            .catch((err) => console.error("Fetch error:", err));
        }, 200);
      }
    });
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

      // Compare newest→oldest: storage[0] = newest, newRows[0] = newest
      for (let i = 0; i < maxCheck; i++) {
        const existingRow = existingRows[i]; // newest first
        const newRow = newRows[newRows.length - maxCheck + i]; // oldest of new batch

        if (
          existingRow.charId === newRow.charId &&
          existingRow.poolId === newRow.poolId &&
          existingRow.star === newRow.star
        ) {
          overlapIndex++;
        } else {
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

    function addGachaCard({
      headerText,
      lifetimePulls,
      currentPity,
      overall6StarRate,
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

      // Row data with optional distinct colors
      const rowsData = [
        {
          text: `Total Pulls: <span>${lifetimePulls}</span>`,
          bg: "#3a3a3a",
        },
        { text: `Current Pity: <span>${currentPity}</span>`, bg: "#444444" },
        {
          text: `Overall 6★ Rate: <span>${overall6StarRate}</span>`,
          bg: "#3f3f3f",
        },
      ];

      rowsData.forEach(({ text, bg }) => {
        const row = document.createElement("div");
        row.className = "row";
        row.style.backgroundColor = bg;
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

    function calculateAndDisplayCards(userId) {
      const storage = JSON.parse(localStorage.getItem("gachaData") || "{}");
      const userData = storage[serverString]?.[userId]?.data?.rows || [];
      if (!userData.length) return;

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
          // pid.startsWith("FESCLASSIC_") ||
          pid.startsWith("CLASSIC_")
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

      // Helper to calculate stats
      function getStats(rows) {
        if (!rows.length)
          return {
            lifetimePulls: 0,
            currentPity: 0,
            overall6StarRate: "0%",
            sixStars: [],
          };

        // Reverse once: oldest → newest
        const orderedRows = [...rows].reverse();

        const totalPulls = orderedRows.length;
        let sixStars = [];
        let pullsSinceLastSix = 0;

        orderedRows.forEach((r) => {
          pullsSinceLastSix++; // include this pull

          if (r.star === 6) {
            sixStars.push({
              charId: r.charId,
              charName: operatorData[r.charId]?.name || r.charId,
              pity: pullsSinceLastSix, // includes the 6★ itself
            });
            pullsSinceLastSix = 0; // reset for next pull
          }
        });

        const currentPity = pullsSinceLastSix; // pulls since last 6★

        const overall6StarRate =
          ((sixStars.length / totalPulls) * 100).toFixed(2) + "%";

        return {
          lifetimePulls: totalPulls,
          currentPity,
          overall6StarRate,
          sixStars, // oldest first, newest last
        };
      }

      // Clear old cards
      const container = document.getElementById("gachaCards");
      container.innerHTML = "";
      // Standard
      if (groups.standard.length) {
        // DO NOT sort by .at — order is already correct from fetch
        addGachaCard({
          headerText: "Standard Headhunting",
          type: "standard",
          ...getStats(groups.standard),
        });
      }

      // Limited banners
      Object.entries(limitedByPool).forEach(([poolId, rows]) => {
        // DO NOT sort by .at
        const bannerName = gachaNameByPoolId[poolId] || poolId;
        addGachaCard({
          headerText: bannerName,
          type: "limited",
          ...getStats(rows),
        });
      });

      // Kernel
      if (groups.kernel.length) {
        // DO NOT sort by .at
        addGachaCard({
          headerText: "Kernel Headhunting",
          type: "kernel",
          ...getStats(groups.kernel),
        });
      }

      // Overall card (all pulls, no pity meaning)
      addGachaCard({
        headerText: "Overall",
        type: "standard",
        lifetimePulls: userData.length,
        currentPity: "-", // meaningless
        overall6StarRate:
          (
            (userData.filter((r) => r.star === 6).length / userData.length) *
            100
          ).toFixed(2) + "%",
      });
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
  });

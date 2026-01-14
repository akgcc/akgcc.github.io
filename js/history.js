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
          fetch(
            `https://proxy.corsfix.com/?https://account.yo-star.com/api/game/gachas?key=ark&index=1&size=9999&uid=${value}`,
          )
            .then((res) => res.json())
            .then((data) => {
              saveToLocal(value, data);
              calculateAndDisplayCards(value);
            })
            .catch((err) => console.error("Fetch error:", err));
        }, 200);
      }
    });
    function saveToLocal(userId, fetchData) {
      // Load existing storage
      let storage = JSON.parse(localStorage.getItem("gachaData") || "{}");
      if (!storage[serverString]) storage[serverString] = {};

      const newRows = fetchData.data?.rows || [];

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

          if (r.star === "6星") {
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
            (userData.filter((r) => r.star === "6星").length /
              userData.length) *
            100
          ).toFixed(2) + "%",
      });
    }
  });

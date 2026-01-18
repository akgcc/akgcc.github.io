const DATA_SOURCE =
  "https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/";
const DATA_SOURCE_YOSTAR =
  "https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData_YoStar/main/";
const USE_ALTERNATE_DATA_SOURCE = true; // use ArknightsAssets instead of ArknightsGameData
// const DATA_SOURCE =
//   "https://raw.githubusercontent.com/Aceship/AN-EN-Tags/master/json/gamedata/";
// const CC_DATA_SOURCE =
//   "https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/";
// const DATA_SOURCE_LOCAL =
//   "https://raw.githubusercontent.com/akgcc/arkdata/main/";
const DATA_SOURCE_LOCAL = "https://cdn.jsdelivr.net/gh/akgcc/arkdata@main/";
const ASSET_SOURCE = {
  // LOCAL: "https://raw.githubusercontent.com/akgcc/arkdata/main/assets/",
  LOCAL: `${DATA_SOURCE_LOCAL}assets/`,
  // ACESHIP: "https://raw.githubusercontent.com/Aceship/Arknight-Images/main/",
  ACESHIP: "https://cdn.jsdelivr.net/gh/Aceship/Arknight-Images@main/",
  ARKWAIFU: "https://arkwaifu.cc/api/v1/arts/REPLACEME/variants/origin/content",
};

// do not modify SERVERS even if you change data source as this is used locally as well.
const SERVERS = {
  EN: "en_US",
  JP: "ja_JP",
  KR: "ko_KR",
  CN: "zh_CN",
};
// data URI gen:
function uri_sound(soundpath, source = ASSET_SOURCE.LOCAL) {
  switch (source) {
    case ASSET_SOURCE.LOCAL:
      return `${ASSET_SOURCE.LOCAL}torappu/dynamicassets/audio/${soundpath}.mp3`.toLowerCase();
    case ASSET_SOURCE.ACESHIP:
      return `https://raw.githubusercontent.com/Aceship/Arknight-voices/main/${soundpath.replace(
        /^sound_beta_2\//,
        "",
      )}.wav`.toLowerCase();
  }
}
function uri_avatar(charId, source = ASSET_SOURCE.LOCAL) {
  let skinSuffix = "";
  if (charId.includes("_amiya")) skinSuffix = "_2";
  switch (source) {
    case ASSET_SOURCE.LOCAL:
      return `${ASSET_SOURCE.LOCAL}torappu/dynamicassets/arts/charavatars/${charId}${skinSuffix}.png`.toLowerCase();
    case ASSET_SOURCE.ACESHIP:
      return `${ASSET_SOURCE.ACESHIP}avatars/${charId}${skinSuffix}.png`;
  }
}
function uri_background(imageName, source = ASSET_SOURCE.LOCAL) {
  switch (source) {
    case ASSET_SOURCE.LOCAL:
      return `${ASSET_SOURCE.LOCAL}torappu/dynamicassets/avg/backgrounds/${imageName}.png`.toLowerCase();
    case ASSET_SOURCE.ACESHIP:
      return `${ASSET_SOURCE.ACESHIP}avg/backgrounds/${imageName}.png`;
    case ASSET_SOURCE.ARKWAIFU:
      return ASSET_SOURCE.ARKWAIFU.replace(/REPLACEME/, imageName);
  }
}
function uri_video(vidPath, source = ASSET_SOURCE.LOCAL) {
  switch (source) {
    default:
      return `${ASSET_SOURCE.LOCAL}raw/${vidPath}`.toLowerCase();
  }
}
function uri_thumb(imageName, source = ASSET_SOURCE.LOCAL) {
  switch (source) {
    default:
      return `${DATA_SOURCE_LOCAL}thumbs/${imageName}.webp`.toLowerCase();
  }
}
function uri_roguelike_item(imageName, source = ASSET_SOURCE.LOCAL) {
  if (/_copper_/.test(imageName)) {
    imageName = imageName
      .replace("_change", "")
      .replace("_buff", "")
      .replace(/_[a-zA-Z]$/, "");
  }
  switch (source) {
    case ASSET_SOURCE.LOCAL:
      return `${ASSET_SOURCE.LOCAL}torappu/dynamicassets/arts/ui/rogueliketopic/itempic/${imageName}.png`.toLowerCase();
    case ASSET_SOURCE.ACESHIP:
      return `${ASSET_SOURCE.ACESHIP}ui/roguelike/item/${imageName}.png`;
  }
}
function uri_rogue_1_capsule(imageName, source = ASSET_SOURCE.LOCAL) {
  switch (source) {
    case ASSET_SOURCE.LOCAL:
      return `${ASSET_SOURCE.LOCAL}torappu/dynamicassets/ui/rogueliketopic/topics/rogue_1/capsule/${imageName}.png`.toLowerCase();
  }
}
function uri_uniequip(imageName, source = ASSET_SOURCE.LOCAL) {
  switch (source) {
    case ASSET_SOURCE.LOCAL:
      return `${ASSET_SOURCE.LOCAL}torappu/dynamicassets/arts/ui/uniequipimg/${imageName}.png`.toLowerCase();
    case ASSET_SOURCE.ACESHIP:
      return `${ASSET_SOURCE.ACESHIP}equip/icon/${imageName}.png`;
  }
}
function uri_item_image(imageName, source = ASSET_SOURCE.LOCAL) {
  switch (source) {
    case ASSET_SOURCE.LOCAL:
      return `${ASSET_SOURCE.LOCAL}torappu/dynamicassets/avg/items/${imageName}.png`.toLowerCase();
    case ASSET_SOURCE.ACESHIP:
      return `${ASSET_SOURCE.ACESHIP}avg/items/${imageName}.png`;
  }
}
function uri_item(imageName, source = ASSET_SOURCE.LOCAL) {
  switch (source) {
    case ASSET_SOURCE.LOCAL:
      return `${ASSET_SOURCE.LOCAL}torappu/dynamicassets/arts/items/icons/${imageName}.png`.toLowerCase();
    case ASSET_SOURCE.ACESHIP:
      return `${ASSET_SOURCE.ACESHIP}items/${imageName}.png`;
  }
}
function uri_skill(skillId, source = ASSET_SOURCE.LOCAL) {
  switch (source) {
    case ASSET_SOURCE.LOCAL:
      return `${ASSET_SOURCE.LOCAL}torappu/dynamicassets/arts/skills/skill_icon_${skillId}.png`.toLowerCase();
    case ASSET_SOURCE.ACESHIP:
      return `${ASSET_SOURCE.ACESHIP}skills/skill_icon_${skillId}.png`;
  }
}
function uri_image(imageName, source = ASSET_SOURCE.LOCAL) {
  switch (source) {
    case ASSET_SOURCE.LOCAL:
      return `${ASSET_SOURCE.LOCAL}torappu/dynamicassets/avg/images/${imageName}.png`.toLowerCase();
    case ASSET_SOURCE.ACESHIP:
      return `${ASSET_SOURCE.ACESHIP}avg/images/${imageName}.png`;
    case ASSET_SOURCE.ARKWAIFU:
      return ASSET_SOURCE.ARKWAIFU.replace(/REPLACEME/, imageName);
  }
}
function uri_character(imageName, source = ASSET_SOURCE.LOCAL) {
  switch (source) {
    case ASSET_SOURCE.LOCAL:
      return `${ASSET_SOURCE.LOCAL}avg/characters/${imageName}.png`.toLowerCase();
    case ASSET_SOURCE.ACESHIP:
      return `${ASSET_SOURCE.ACESHIP}avg/characters/${imageName}.png`;
    case ASSET_SOURCE.ARKWAIFU:
      return ASSET_SOURCE.ARKWAIFU.replace(/REPLACEME/, imageName);
  }
}
const DATA_BASE = {};
DATA_BASE[SERVERS.EN] = DATA_SOURCE_YOSTAR + SERVERS.EN;
DATA_BASE[SERVERS.JP] = DATA_SOURCE_YOSTAR + SERVERS.JP;
DATA_BASE[SERVERS.KR] = DATA_SOURCE_YOSTAR + SERVERS.KR;
DATA_BASE[SERVERS.CN] = DATA_SOURCE + SERVERS.CN;
if (USE_ALTERNATE_DATA_SOURCE) {
  DATA_BASE[SERVERS.EN] =
    "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/en";
  DATA_BASE[SERVERS.JP] =
    "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/jp";
  DATA_BASE[SERVERS.KR] =
    "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/kr";
  DATA_BASE[SERVERS.CN] =
    "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/cn";
}
const serverString = localStorage.getItem("server") || "en_US";
const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
if (scrollbarWidth > 0) {
  document.documentElement.style.setProperty(
    "--scrollbarWidth",
    scrollbarWidth + "px",
  );
} else document.documentElement.style.setProperty("--scrollbarWidth", "0px");

const CLASS_MAPPING = {
  WARRIOR: "Guard",
  SUPPORT: "Supporter",
  CASTER: "Caster",
  SNIPER: "Sniper",
  TANK: "Defender",
  PIONEER: "Vanguard",
  SPECIAL: "Specialist",
  MEDIC: "Medic",
};
const RARITY_MAP = {
  TIER_1: 0,
  TIER_2: 1,
  TIER_3: 2,
  TIER_4: 3,
  TIER_5: 4,
  TIER_6: 5,
};
const SHORT_NAMES = {};
//   "Skadi the Corrupting Heart": "Skadiva",
//   "Ch'en the Holungday": "Ch'oom",
//   "Nearl the Radiant Knight": "NTR",
// };
const LINKAGE_LIMITEDS = [
  // R6 1
  "char_456_ash",
  "char_457_blitz",
  "char_458_rfrost",
  // MH
  "char_1029_yato2",
  "char_1030_noirc2",
  // R6 2
  "char_4125_rdoc",
  "char_4123_ela",
  "char_4124_iana",
  // DM
  "char_4144_chilc",
  "char_4142_laios",
  "char_4141_marcil",
];
const GAMEPRESS_NAME_MAP = {
  "Rosa (Poca)": "Rosa",
  Pozëmka: "Позёмка",
  "Reed the Flame Shadow": "Reed The Flame Shadow",
  "Fang the Fire-Sharpened": "Fang the Fire-sharpened",
  "Eyjafjalla the Hvit Aska": "Eyjafjalla the Hvít Aska",
};
const charIdMap = {};
// maps some en names to their appellations
const CN_ID_MAP = {
  Zima: "Зима",
  "Mr. Nothing": "Mr.Nothing",
  Rosa: "Роса",
  Istina: "Истина",
};
const CCMAP = {
  "#b": {
    tag: "-ccbclear",
    title: "Operation Beta (CCβ)",
  },
  "#all": {
    tag: "-cc-all",
    title: "Combined Data (All CCs)",
  },
};
function intersection(a, b) {
  return new Set([...a].filter((x) => b.has(x)));
}
const rootMeanSquare = (xs) =>
  Math.sqrt(xs.reduce((a, x) => a + x * x, 0) / xs.length);
const geometricMean = (xs) => xs.reduce((a, x) => a * x, 1) ** (1 / xs.length);
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function updateJSON(dest, src, existingOnly = false) {
  for (let key in src) {
    if (typeof dest[key] == "object" && typeof src[key] == "object")
      dest[key] = updateJSON(dest[key], src[key], existingOnly);
    else if (!existingOnly || key in dest) dest[key] = src[key];
  }
  return dest;
}

//add tooltip element for use in below functions
let tt = document.createElement("div");
tt.id = "chartjs-tooltip";
tt.classList.add("hidden");
document.addEventListener("DOMContentLoaded", () =>
  document.body.appendChild(tt),
);
async function get_cc_list(server = "en_US") {
  let raw = await fetch(
    `${DATA_BASE[server]}/gamedata/excel/crisis_table.json`,
  );
  let data = await fixedJson(raw);
  data.seasonInfo.forEach((cc) => {
    let cc_num = /rune_season_(\d+)_1/.exec(cc.seasonId)[1];
    CCMAP["#" + cc_num] = {
      tag: "-cc" + cc_num + "clear",
      title: cc.name + " (CC#" + cc_num + ")",
      start: cc.startTs,
      end: cc.endTs,
    };
  });
  CCMAP["#all"].start = CCMAP["#12"].start;
  CCMAP["#all"].end = CCMAP["#12"].end;
  server == SERVERS.CN
    ? (CCMAP["#b"].start = 1574139600)
    : (CCMAP["#b"].start = 1591934400);
}
async function get_char_table(
  keep_non_playable = false,
  server = "en_US",
  extra_data = false,
) {
  // gets a modified character table:
  // non-playable characters removed
  // add charId key for each character
  // patch characters added and renamed (only guardmiya for now)
  // also builds charIdMap for use elsewhere
  // converts internal profession names to in-game ones
  // if "extra_data" is true, adds "isLimited", "onlineTime", "cnOnlineTime" at the cost of 1 extra github fetch
  let raw = await fetch(
    `${DATA_BASE[server]}/gamedata/excel/character_table.json`,
  );
  let json = await fixedJson(raw);
  raw = await fetch(
    `${DATA_BASE[server]}/gamedata/excel/char_patch_table.json`,
  );
  let patch = await fixedJson(raw);
  updateJSON(json, patch.patchChars);
  if (extra_data) {
    let extra_raw = await fetch(
      "https://raw.githubusercontent.com/akgcc/akgcc-extra-data/main/json/operator_release_dates.json",
    );
    let extra_chardata = await extra_raw.json();
    for (const [charId, data] of Object.entries(extra_chardata)) {
      if (json[charId]) {
        json[charId].isLimited = data.isLimited ?? false;
        if (data.onlineTime != null) json[charId].onlineTime = data.onlineTime;
        if (data.cnOnlineTime != null)
          json[charId].cnOnlineTime = data.cnOnlineTime;
      }
    }
  }

  Object.keys(json).forEach((op) => {
    json[op].profession =
      CLASS_MAPPING[json[op].profession] || json[op].profession;
    // rename amiya forms to prevent conflict
    if (op.includes("_amiya"))
      json[op].name = `${json[op].name} (${json[op].profession})`;
  });
  for (var key in json) {
    if (!keep_non_playable && !json[key].displayNumber) delete json[key];
    else {
      charIdMap[json[key].name] = key;
      if (json[key].appellation) charIdMap[json[key].appellation] = key;
      json[key].charId = key;
      // remap "rarity" field (AK 2.0)
      json[key].rarity = RARITY_MAP[json[key].rarity] ?? json[key].rarity;
    }
  }
  for (const [k, v] of Object.entries(CN_ID_MAP)) {
    if (!(k in charIdMap)) charIdMap[k] = charIdMap[v];
  }
  // add skadiva short name
  for (const [k, v] of Object.entries(SHORT_NAMES)) {
    charIdMap[v] = charIdMap[k];
  }
  return json;
}

async function fixedJson(res) {
  // if .json() fails, try to remove trailing comma then parse with JSON.parse
  return res
    .clone()
    .json()
    .catch((e) =>
      res.text().then((txt) => JSON.parse(txt.replace(/,(\W+}\W*$)/, "$1"))),
    );
}

function thumbnail_tooltip(chart_canvas, even_rows_only = false) {
  // Works only with this specific custom tooltip CSS.
  return function f(context) {
    let tooltip = context.tooltip;
    const tooltipStylePadding = 3;
    const fullTTWidth =
      tooltip.width +
      tooltip.height -
      Chart.defaults.plugins.tooltip.padding * 2;
    var tooltipEl = document.getElementById("chartjs-tooltip");
    if (tooltip.opacity == 0) {
      tooltipEl.classList.add("hidden");
      return;
    }
    tooltipEl.className = ""; // clear all classes
    let beforeRect = tooltipEl.getBoundingClientRect();
    tooltipEl.style.cssText = "";
    tooltipEl.classList.add("x" + tooltip.xAlign, "y" + tooltip.yAlign);
    var innerHtml = "";
    let title = tooltip.title[0] || tooltip.body[0].lines[0].split(":")[0]; // for pie chart legend
    innerHtml =
      `<img src="${uri_avatar(charIdMap[title])}"> <div> <span><b>` +
      title +
      "</b></span>";
    for (const [i, b] of tooltip.body.entries()) {
      if (!even_rows_only || !(i % 2))
        innerHtml +=
          '<span><i class="fas fa-square-full" style="color: ' +
          tooltip.labelColors[i].backgroundColor +
          "; font-size:" +
          (parseInt(tooltip.bodyFontSize) - 2) +
          '"></i>' +
          b.lines[0] +
          "</span>";
    }
    innerHtml += "</div>";
    tooltipEl.innerHTML = innerHtml;
    let tt_left = chart_canvas.offsetLeft + tooltip.caretX;
    let xmod = 0;
    switch (tooltip.xAlign) {
      case "left":
        break;
      case "center":
        tt_left += -fullTTWidth / 2 - tooltipStylePadding;
        break;
      case "right":
        xmod = -tooltip.height;
        tt_left += -fullTTWidth - tooltipStylePadding * 2;
        break;
    }
    switch (tooltip.yAlign) {
      case "center":
        switch (tooltip.xAlign) {
          case "right":
            tt_left -= 5 + 1;
            break;
          case "left":
            tt_left += 5 + 1;
            break;
        }
        break;
      default:
        switch (tooltip.xAlign) {
          case "right":
            tt_left += 7;
            break;
          case "left":
            tt_left -= 7;
            break;
        }
        break;
    }
    tooltipEl.style.left = tt_left + "px";
    tooltipEl.style.top = chart_canvas.offsetTop + tooltip.y + "px";
    tooltipEl.style.height = tooltip.height + "px";
    tooltipEl.style.font = Chart.helpers.toFont(
      tooltip.options.bodyFont,
    ).string;

    // animate movement with FLIP technique
    let newRect = tooltipEl.getBoundingClientRect();
    let xform =
      "translateY(" +
      (beforeRect.top - newRect.top) +
      "px) translateX(" +
      (beforeRect.left - newRect.left) +
      "px)";
    tooltipEl.style.transition = "opacity .25s ease, transform 0s";
    tooltipEl.style.transform = xform;
    window.requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        tooltipEl.style.removeProperty("transform");
        tooltipEl.style.removeProperty("transition");
      });
    });
  };
}

var percentColors; // define this according to your data.

var getColorForPercentage = function (pct) {
  for (var i = 1; i < percentColors.length - 1; i++) {
    if (pct < percentColors[i].pct) {
      break;
    }
  }
  var lower = percentColors[i - 1];
  var upper = percentColors[i];
  var range = upper.pct - lower.pct;
  var rangePct = (pct - lower.pct) / range;
  var pctLower = 1 - rangePct;
  var pctUpper = rangePct;
  var color = {
    r: Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
    g: Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
    b: Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper),
    a: (lower.color.a * pctLower + upper.color.a * pctUpper).toFixed(2),
  };
  return "rgba(" + [color.r, color.g, color.b, color.a].join(",") + ")";
};

// Modify chartjs pointElement to draw a circular image instead.
if (typeof Chart !== "undefined") {
  const drawPoint_round = (ctx, options, x, y) => {
    let type, xOffset, yOffset, size, cornerRadius;
    const style = options.pointStyle;
    const rotation = options.rotation;
    const radius = options.radius;
    let rad = (rotation || 0) * Chart.helpers.RAD_PER_DEG;

    if (style && typeof style === "object") {
      type = style.toString();
      if (
        type === "[object HTMLImageElement]" ||
        type === "[object HTMLCanvasElement]"
      ) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rad);

        // below block is modified code.
        let sliceSize = Math.max(
          (1 / 4) * 2,
          (1 / options.pointStyle.conflictCount) * 2,
        );
        sliceSize = (1 / options.pointStyle.conflictCount) * 2;
        let sliceStart = sliceSize * options.pointStyle.conflict;
        ctx.beginPath();
        ctx.arc(
          0,
          0,
          Math.min(style.height / 2, style.width / 2),
          Math.PI / 2 + Math.PI * sliceStart,
          Math.PI / 2 + Math.PI * sliceStart + Math.PI * sliceSize,
          false,
        );
        if (options.pointStyle.conflictCount > 1) ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.stroke();
        ctx.clip();
        // ctx.globalAlpha = 0.8;
        ctx.drawImage(
          style,
          -style.width / 2,
          -style.height / 2,
          style.width,
          style.height,
        );
        ///////////////////////////////

        ctx.restore();
        return;
      }
    }

    return Chart.helpers.drawPoint(ctx, options, x, y);
  };
  const pe_draw_orig = Chart.PointElement.prototype.draw;
  Chart.PointElement.prototype.draw = function (ctx, area) {
    const options = this.options;

    if (
      this.skip ||
      options.radius < 0.1 ||
      !Chart.helpers._isPointInArea(this, area, this.size(options) / 2)
    ) {
      return;
    }

    ctx.strokeStyle = options.borderColor;
    ctx.lineWidth = options.borderWidth;
    ctx.fillStyle = options.backgroundColor;

    drawPoint_round(ctx, options, this.x, this.y); // only this line was modified
  };

  Chart.defaults.scales.logarithmic.ticks.callback = function (
    tick,
    index,
    ticks,
  ) {
    return tick.toLocaleString();
  };

  Chart.register({
    id: "imgsplit",
    beforeDatasetDraw: function (chart, args, options) {
      if (chart.config.options.split_images) {
        let conflicts = {};
        for (let i = 0; i < chart.data.datasets[0].data.length; i++) {
          let pt = chart.data.datasets[0].data[i];
          conflicts[pt.x] || (conflicts[pt.x] = {});
          chart.data.datasets[0].pointStyle[i].conflict = 0;
          if (pt.y in conflicts[pt.x]) {
            conflicts[pt.x][pt.y] += 1;
            chart.data.datasets[0].pointStyle[i].conflict =
              conflicts[pt.x][pt.y];
          } else {
            conflicts[pt.x][pt.y] = 0;
          }
        }
        for (let i = 0; i < chart.data.datasets[0].data.length; i++) {
          let pt = chart.data.datasets[0].data[i];
          chart.data.datasets[0].pointStyle[i].conflictCount =
            conflicts[pt.x][pt.y] + 1;
        }
      }
    },
  });
}

function beforeDatasetDraw(chart, args) {
  if (chart.animating || chart.$deferred.loaded) {
    const { index: dataIndex, meta } = args;
    const points = meta.data.map((el) => ({ x: el._model.x, y: el._model.y }));
    const { length: dsLength } = chart.data.datasets;
    const adjustedMap = []; // keeps track of adjustments to prevent double offsets

    for (let datasetIndex = 0; datasetIndex < dsLength; datasetIndex += 1) {
      if (dataIndex !== datasetIndex) {
        const datasetMeta = chart.getDatasetMeta(datasetIndex);
        datasetMeta.data.forEach((el) => {
          const overlap = points.find(
            (point) => point.x === el._model.x && point.y === el._model.y,
          );
          if (overlap) {
            const adjusted = adjustedMap.find(
              (item) =>
                item.datasetIndex === datasetIndex &&
                item.dataIndex === dataIndex,
            );
            if (!adjusted && datasetIndex % 2) {
              el._model.x += 7;
            } else {
              el._model.x -= 7;
            }
            adjustedMap.push({ datasetIndex, dataIndex });
          }
        });
      }
    }
  }
}

// https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
function getCssStyle(element, prop) {
  return window.getComputedStyle(element, null).getPropertyValue(prop);
}

function getCanvasFontSize(el = document.body) {
  const fontWeight = getCssStyle(el, "font-weight") || "normal";
  const fontSize = getCssStyle(el, "font-size") || "12px";
  const fontFamily = getCssStyle(el, "font-family") || "Ariel";

  return fontWeight + " " + fontSize + " " + fontFamily;
}

function getTextWidth(text, font) {
  // re-use canvas object for better performance
  const canvas =
    getTextWidth.canvas ||
    (getTextWidth.canvas = document.createElement("canvas"));
  const context = canvas.getContext("2d");
  context.font = font;
  const metrics = context.measureText(text);
  return metrics.width;
}

function divideString(text) {
  let tokens = text.split(" ");
  if (tokens.length < 2) return [text, ""];
  let diff = text.length;
  let i = 1;
  for (; i < tokens.length; i++) {
    let newdiff = Math.abs(
      tokens.slice(0, i).join(" ").length - tokens.slice(i).join(" ").length,
    );
    if (newdiff > diff) break;
    diff = newdiff;
  }
  return [tokens.slice(0, i - 1).join(" "), tokens.slice(i - 1).join(" ")];
}

function CreateOpCheckbox(
  operator,
  data1map = null,
  data2map = null,
  colorScaleMax = null,
  clickfunc = null,
  destDiv = document.getElementById("checkboxes"),
  order = null,
  skills = [],
  dispSkillId = null,
) {
  let operatorName = operator.name;
  var checkboxDiv = document.createElement("div");
  checkboxDiv.classList.add("operatorCheckbox", "show");
  checkboxDiv.dataset.class = operator.profession;
  checkboxDiv.dataset.rarity = operator.rarity;
  if (order) checkboxDiv.style.order = order;
  if (data1map) {
    let count = data1map[operatorName] || 0;
    let useDiv = document.createElement("div");
    useDiv.classList.add("data1");
    useDiv.innerHTML = count;
    checkboxDiv.appendChild(useDiv);
    checkboxDiv.style.cssText =
      "background: " + getColorForPercentage(count / colorScaleMax) + ";";
  }
  if (data2map) {
    let riskDiv = document.createElement("div");
    riskDiv.classList.add("data2");
    riskDiv.innerHTML = data2map[operatorName] || 0;
    checkboxDiv.appendChild(riskDiv);
  }

  let im = document.createElement("img");
  im.setAttribute("loading", "lazy");
  im.src = uri_avatar(operator.charId);
  checkboxDiv.appendChild(im);

  let name = document.createElement("div");
  name.classList.add("name");
  let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  let txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
  txt.innerHTML = operatorName;
  txt.setAttribute("x", "50%");
  txt.setAttribute("y", "50%");
  txt.setAttribute("dominant-baseline", "central");
  txt.setAttribute("text-anchor", "middle");
  txt.setAttribute("lengthAdjust", "spacingAndGlyphs");
  svg.appendChild(txt);
  name.appendChild(svg);

  checkboxDiv.appendChild(name);

  let skilldiv = document.createElement("div");
  skilldiv.classList.add("opskills");
  skilldiv.onclick = (e) => e.stopPropagation();
  skills.forEach((sid, idx) => {
    let i = document.createElement("img");
    i.src = uri_skill(sid);
    i.setAttribute("loading", "lazy");
    i.classList.add("opskillCheckbox");
    skilldiv.appendChild(i);
    // if also clickfunc, need to call it while passing skill LIST.
    i.onclick = (e) => {
      e.stopPropagation();
      i.classList.toggle("_selected");
      if (i.classList.contains("_selected"))
        checkboxDiv.dataset.selsk =
          parseInt(checkboxDiv.dataset.selsk || 0) | (1 << idx);
      else
        checkboxDiv.dataset.selsk =
          parseInt(checkboxDiv.dataset.selsk) ^ (1 << idx);
      if (clickfunc) {
        clickfunc(
          operator,
          checkboxDiv.classList.contains("_selected"),
          parseInt(checkboxDiv.dataset.selsk),
        );
      }
    };
  });
  if (skills.length > 1) checkboxDiv.appendChild(skilldiv);

  if (dispSkillId) {
    let skimg = document.createElement("img");
    skimg.classList.add("skimg");
    skimg.setAttribute("loading", "lazy");
    skimg.src = uri_skill(dispSkillId);
    checkboxDiv.appendChild(skimg);
  }

  destDiv.appendChild(checkboxDiv);

  if (clickfunc) {
    checkboxDiv.onclick = (e) => {
      checkboxDiv.classList.toggle("_selected");
      clickfunc(
        operator,
        checkboxDiv.classList.contains("_selected"),
        parseInt(checkboxDiv.dataset.selsk) || 0,
      );
    };
  }

  // must do this after appending to body as we need computed styles.
  let nameWidth = getTextWidth(operatorName, getCanvasFontSize(name));
  let plateWidth = parseInt(getComputedStyle(checkboxDiv).width);
  if (nameWidth > plateWidth * 1.2 && operatorName.split(" ").length > 1) {
    // multiple words, split onto multiple lines.
    let [first, second] = divideString(operatorName);
    txt.setAttribute("y", "35%");
    txt.setAttribute("x", "0");
    txt.setAttribute("transform", "scale(1,.75)");
    txt.innerHTML = "";
    // need to check width of each line and set textLength
    let firstLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "tspan",
    );
    firstLine.setAttribute("dy", "0");
    firstLine.setAttribute("x", "50%");
    if (getTextWidth(first, getCanvasFontSize(name)) > plateWidth * 0.95)
      firstLine.setAttribute("textLength", plateWidth * 0.95);
    firstLine.innerHTML = first;
    let secondLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "tspan",
    );
    secondLine.setAttribute("dy", "1em");
    secondLine.setAttribute("x", "50%");
    if (getTextWidth(second, getCanvasFontSize(name)) > plateWidth * 0.95)
      secondLine.setAttribute("textLength", plateWidth * 0.95);
    secondLine.innerHTML = second;
    txt.appendChild(firstLine);
    txt.appendChild(secondLine);
  } else if (nameWidth > plateWidth * 0.95)
    txt.setAttribute("textLength", plateWidth * 0.95);

  return checkboxDiv;
}
function htmlDecode(input) {
  var doc = new DOMParser().parseFromString(input, "text/html");
  return doc.documentElement.textContent;
}
function selectColor(number, saturation = 15, lightness = 60) {
  const hue = number * 137.508; // use golden angle approximation
  return `hsl(${hue},${saturation}%,${lightness}%)`;
}
function countWords(str, server = serverString) {
  if (server == SERVERS.EN)
    return str.trim().split(/\s+/).filter(Boolean).length;
  return str.trim().length;
}
function getViewportTop(el) {
  let top = 0;
  let node = el;
  while (node) {
    top += getOffsets(node).offsetTop || 0;
    node = node.offsetParent;
  }
  return top - window.scrollY;
}
const offsetCache = new Map();
function getOffsets(el) {
  if (offsetCache.has(el)) {
    return offsetCache.get(el);
  }
  const offsets = {
    offsetTop: el.offsetTop,
    offsetHeight: el.offsetHeight,
    offsetWidth: el.offsetWidth,
    offsetLeft: el.offsetLeft,
  };
  offsetCache.set(el, offsets);
  return offsets;
}
function clearOffsetCache() {
  offsetCache.clear();
}
window.onload = () => {
  const title = document.getElementById("pageTitle");
  if (title) title.href = location.origin + location.pathname;

  const serverSelect = document.getElementById("serverSelect");
  if (serverSelect) {
    const dd_content = serverSelect.querySelector(".dropdown-content");
    const dd_btn = serverSelect.querySelector(".dropbtn");
    Object.keys(SERVERS).forEach((k) => {
      let opt = document.createElement("div");
      opt.dataset.value = SERVERS[k];
      opt.innerHTML = k;
      opt.onclick = () => {
        localStorage.setItem("server", SERVERS[k]);
        sessionStorage.setItem("userChange", true);
        location.reload();
      };
      dd_content.appendChild(opt);
      if ((localStorage.getItem("server") || "en_US") == SERVERS[k])
        dd_btn.firstChild.nodeValue = k;
    });
    // click handlers for mobile
    dd_btn.onclick = () => {
      dd_content.classList.toggle("show");
      dd_btn.classList.toggle("checked");
    };
    window.addEventListener("click", (e) => {
      if (e.target != dd_btn) {
        dd_content.classList.remove("show");
        dd_btn.classList.remove("checked");
      }
    });
  }
};

if (!window.location.hash) window.location.hash = "#4";
document.getElementById("clearsLink").href = "./cc.html" + window.location.hash;
window.onhashchange = () => window.location.reload();
var operatorData, CCTAG;
const tierMap = { 6: "S", 5: "A", 4: "B", 3: "C!", 2: "D", 1: "F" };
get_cc_list()
  .then(() => {
    CCTAG = CCMAP[window.location.hash].tag;
    document.getElementById("pageTitle").innerHTML =
      CCMAP[window.location.hash].title;
    if (window.location.hash == "#all")
      document.getElementById("clearsLink").style.display = "none";
    Object.keys(CCMAP).forEach((k) => {
      if (k != "#all") {
        let btn = document.createElement("div");
        btn.classList.add("button");
        if (k == window.location.hash) btn.classList.add("checked");
        btn.innerHTML = k;
        btn.onclick = () => {
          window.location.hash = btn.innerHTML;
        };
        document.getElementById("ccselector").appendChild(btn);
      }
    });
    return get_char_table();
  })
  .then((js) => {
    operatorData = js;
    return fetch("./json/data" + CCTAG + ".json");
  })
  .then((res) => fixedJson(res))
  .then((js) => {
    clearData = js;
    var tldiv = document.getElementById("tierList");
    Object.values(tierMap)
      .reverse()
      .forEach((t) => {
        let tdiv = document.createElement("div");
        tdiv.classList.add("tierRow");
        tldiv.appendChild(tdiv);
        let tlabel = document.createElement("div");
        tlabel.classList.add("tierLabel");
        tlabel.setAttribute("data-tier", t);
        tdiv.appendChild(tlabel);
        let tname = document.createElement("span");
        tname.innerHTML = t;
        tlabel.appendChild(tname);
        let contents = document.createElement("div");
        contents.classList.add("tierMembers");
        tdiv.appendChild(contents);
        contents.id = t;
      });
    var ops = {},
      max_score = 0,
      min_score = 9999999;
    Object.values(clearData).forEach((c) => {
      if (c.risk >= 18) {
        c.squad.forEach((charid) => {
          ops[charid.name] = ops[charid.name] || { max: 0, score: 0 };
          ops[charid.name].max = Math.max(ops[charid.name].max, c.risk);
          ops[charid.name].score += risk_weight(c.risk);
        });
      }
    });
    Object.keys(ops).forEach((k) => {
      ops[k].score =
        ops[k].score / (Object.keys(clearData).length / 35) +
        risk_weight(ops[k].max) * 1.1;
      ops[k].charid = k;
      if (ops[k].score > max_score) max_score = ops[k].score;
      if (ops[k].score < min_score) min_score = ops[k].score;
    });
    let bins = linspace(min_score, max_score, 7);
    Object.values(ops)
      .sort((a, b) => b.score - a.score)
      .forEach((op) => {
        for (let i = bins.length - 2; i >= 0; i--) {
          if (bins[i] <= op.score) {
            CreateOpCheckbox(
              operatorData[op.charid],
              null,
              null,
              null,
              null,
              document.getElementById(tierMap[i + 1])
            );
            break;
          }
        }
      });
  });

function risk_weight(risk) {
  return Math.pow(risk - 17, 1.8);
}
function linspace(min, max, bins) {
  res = [];
  for (let i = min; i <= max; i += (max - min) / (bins - 1)) res.push(i);
  if (res.length < bins) res.push(max); // to avoid rounding removing the last bounds.
  return res;
}

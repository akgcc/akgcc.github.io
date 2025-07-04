var story_table,
  operatorData,
  challengeList,
  divMap = {},
  episode_list = {},
  skill_table,
  activity_table;
const maxTeamSize = 12;
const hopeMap = {
  0: 0,
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 6,
};
var filters = {
  Squad: {
    Size: {
      disp: "Max Size",
      max: maxTeamSize,
    },
    Challenges: {
      disp: "Challenges",
      max: 0,
    },
    draftSize: {
      disp: "Pack Size (Draft)",
      max: 3,
      maxvalmin: 1,
      maxvalmax: 10,
    },
    pointDraft: {
      enabled: true,
      disp: "Point Draft",
      max: 30,
      maxvalmax: maxTeamSize * 6,
    },
    randomizeSkills: {
      disp: "Randomize Skills",
      enabled: 1,
    },
  },
  Rarity: {
    0: {
      disp: 1,
      enabled: true,
      min: 0,
      max: maxTeamSize,
    },
    1: {
      disp: 2,
      enabled: true,
      min: 0,
      max: maxTeamSize,
    },
    2: {
      disp: 3,
      enabled: true,
      min: 0,
      max: maxTeamSize,
    },
    3: {
      disp: 4,
      enabled: true,
      min: 0,
      max: maxTeamSize,
    },
    4: {
      disp: 5,
      enabled: true,
      min: 0,
      max: maxTeamSize,
    },
    5: {
      disp: 6,
      enabled: true,
      min: 0,
      max: maxTeamSize,
    },
  },
  Class: {
    Supporter: {
      disp: "Supporter",
      enabled: true,
      min: 0,
      max: maxTeamSize,
    },
    Caster: {
      disp: "Caster",
      enabled: true,
      min: 0,
      max: maxTeamSize,
    },
    Sniper: {
      disp: "Sniper",
      enabled: true,
      min: 0,
      max: maxTeamSize,
    },
    Defender: {
      disp: "Defender",
      enabled: true,
      min: 0,
      max: maxTeamSize,
    },
    Vanguard: {
      disp: "Vanguard",
      enabled: true,
      min: 0,
      max: maxTeamSize,
    },
    Specialist: {
      disp: "Specialist",
      enabled: true,
      min: 0,
      max: maxTeamSize,
    },
    Guard: {
      disp: "Guard",
      enabled: true,
      min: 0,
      max: maxTeamSize,
    },
    Medic: {
      disp: "Medic",
      enabled: true,
      min: 0,
      max: maxTeamSize,
    },
  },
};

// fetch('https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/'+serverString+'/gamedata/excel/zone_table.json')
fetch(`${DATA_BASE[serverString]}/gamedata/excel/skill_table.json`)
  .then((res) => fixedJson(res))
  .then((json) => {
    skill_table = json;
    return fetch("/json/challenges.json");
  })
  .then((res) => fixedJson(res))
  .then((js) => {
    challengeList = js;
    return get_char_table(false, serverString);
  })
  .then((js) => {
    operatorData = js;
    return fetch(
      `${DATA_BASE[serverString]}/gamedata/excel/story_review_table.json`,
    );
  })
  .then((res) => fixedJson(res))
  .then((js) => {
    story_table = js;
    return fetch(
      `${DATA_BASE[serverString]}/gamedata/excel/activity_table.json`,
    );
  })
  .then((res) => fixedJson(res))
  .then((js) => {
    activity_table = js;
    return fetch(`${DATA_BASE[serverString]}/gamedata/excel/stage_table.json`);
  })
  .then((res) => fixedJson(res))
  .then((js) => {
    stageData = js;

    // create list of available stages (episode_list)
    let availableStages = Object.values(stageData.stages).filter(
      (x) =>
        (x.stageType == "MAIN" || x.stageType == "SUB") &&
        x.apCost &&
        x.dailyStageDifficulty &&
        x.difficulty == "NORMAL" &&
        x.levelId,
    );
    let main_ids = new Set();
    availableStages.map((x) => main_ids.add(x.zoneId));

    const now = Math.floor(Date.now() / 1000);
    var stage_types = {};
    // console.log(story_table);
    // console.log(activity_table.basicInfo);
    for (const [key, value] of Object.entries(story_table)) {
      // if (
      //   value.replicateActionId ||
      //   activity_table.basicInfo[key]?.type === "DEFAULT" ||
      //   (activity_table.basicInfo[key]?.displayOnHome &&
      //     !(value.entryType === "MINI_ACTIVITY")) ||
      //   activity_table.basicInfo[key]?.displayType == "SIDESTORY" ||
      //   activity_table.basicInfo[key]?.displayType == "BRANCHLINE" ||
      //   (activity_table.basicInfo[key]?.endTime > Date.now() / 1000 &&
      //     activity_table.basicInfo[key]?.startTime < Date.now() / 1000)
      // )
      if (
        ((activity_table.basicInfo[key]?.displayOnHome &&
          !(value.entryType === "MINI_ACTIVITY")) ||
          activity_table.basicInfo[key]?.displayType == "SIDESTORY") &&
        !(value?.replicateActionId === "") // checking replicateActionId doesn't work on CN, need a new solution
      ) {
        let code = value.infoUnlockDatas.slice(-1)[0].storyCode.split("-")[0];
        if (!code)
          code = (
            stageData.stages[value.infoUnlockDatas[0].storyGroup + "_01"] || {
              code: "",
            }
          ).code.split("-")[0];
        let episode_name = code ? value.name + " (" + code + ")" : value.name;
        let reqs = value.infoUnlockDatas.find((x) => x.requiredStages);
        if (!reqs.requiredStages[0].stageId.startsWith(value.id)) {
          // stage id doesnt match actual level ids, using the level id inferred from requiredStages instead:
          episode_list[episode_name] =
            reqs.requiredStages[0].stageId.split("_")[0];
        } else {
          episode_list[episode_name] = value.id;
        }
        stage_types[episode_name] =
          activity_table.basicInfo[key]?.displayType || value.entryType;
      }
    }
    main_ids.forEach((x) => {
      let m = /^main_(\d+)/gi.exec(x);
      if (m) {
        let episode_name = "Episode " + m[1].padStart(2, "0");
        episode_list[episode_name] =
          "(?:main|sub|hard)_" + m[1].padStart(2, "0") + "-";
        stage_types[episode_name] = "MAIN";
      }
    });

    filters.Stage = filters.Stage || {};
    filters.Stage.On ??= {
      disp: "Randomize Stage",
      enabled: true,
      opt: true,
      color: "grey",
      tooltip: "Uncheck to hide stage randomizer",
    };
    filters.Stage.Hard ??= {
      disp: "Challenge Mode Only",
      enabled: false,
      opt: true,
      color: "red",
      tooltip: "Only stages which have a Challenge Mode",
    };
    filters.Stage.StoryHard ??= {
      disp: "Red/H Stages Only (Story)",
      enabled: false,
      opt: true,
      color: "red",
      tooltip: "Stages with red nameplate, includes H stages",
    };
    filters.Stage.StoryBoss ??= {
      disp: "Boss Stages Only (Story)",
      enabled: false,
      opt: true,
      color: "red",
      tooltip: "Stages with a boss icon",
    };
    Object.keys(episode_list).forEach((x) => {
      filters.Stage[x] = filters.Stage[x] || { disp: x, enabled: true };
    });
    // load local filter data.
    let f = localStorage.getItem("randomizerFilters");
    if (f) updateJSON(filters, JSON.parse(f), true);

    Object.values(operatorData).forEach((op) => (op.selected = true));
    function saveOpList() {
      let exclusions = Object.values(operatorData)
        .filter((x) => !x.selected)
        .map((x) => x.charId);
      localStorage.setItem(
        "excludedOps",
        JSON.stringify(exclusions.concat(cn_exclusions)),
      );
    }
    function toggleOp(op, state) {
      operatorData[op.charId].selected = state;
      saveOpList();
    }
    Object.keys(operatorData).forEach((x) => {
      divMap[x] = CreateOpCheckbox(operatorData[x], null, null, null, toggleOp);
      divMap[x].classList.add("_selected");
    });

    let exclusions = localStorage.getItem("excludedOps");
    let cn_exclusions = [];
    if (exclusions)
      Array.from(JSON.parse(exclusions)).forEach((x) => {
        if (x in divMap) {
          divMap[x].classList.toggle("_selected");
          operatorData[x].selected = false;
        } else {
          cn_exclusions.push(x);
        }
      });

    Object.values(operatorData)
      .sort((a, b) => {
        if (a.rarity > b.rarity) return -1;
        if (a.rarity < b.rarity) return 1;
        return a.name > b.name ? 1 : -1;
      })
      .forEach((x, i) => (divMap[x.charId].style.order = i));

    function Randomize() {
      let outputDiv = document.getElementById("results");
      outputDiv.classList.remove("hidden");

      function rerollStage() {
        let parentDiv = document.getElementById("stageRoll");
        let titleDiv = document.getElementById("stageButton");
        if (!(filters.Stage.On?.enabled ?? true)) {
          // stage randomizer turned off, hide element
          parentDiv.classList.add("hidden");
          titleDiv.classList.add("hidden");
          return;
        } else {
          parentDiv.classList.remove("hidden");
          titleDiv.classList.remove("hidden");
        }
        // pick a stage: (depends on stages_re)
        // get non-filtered episodes only:
        let div = document.createElement("div");
        let span = document.createElement("span");

        let localEpisodeList = JSON.parse(JSON.stringify(episode_list));
        for (var key in localEpisodeList) {
          if (!filters.Stage[key].enabled) delete localEpisodeList[key];
        }
        let stages_re = new RegExp(
          "^(" + Object.values(localEpisodeList).join("|") + ")",
          "gi",
        );
        let availableStages = Object.values(stageData.stages).filter(
          (x) =>
            x.stageId.match(stages_re) &&
            ["MAIN", "SUB", "ACTIVITY"].includes(x.stageType) &&
            x.apCost &&
            x.difficulty == "NORMAL" &&
            x.levelId &&
            (!filters.Stage.Hard?.enabled || x.hardStagedId) &&
            (!filters.Stage.StoryHard?.enabled ||
              x.hilightMark ||
              x.appearanceStyle.toUpperCase() === "HIGH_DIFFICULTY") &&
            (!filters.Stage.StoryBoss?.enabled || x.bossMark),
        );
        let chosen_stage = shuffleArray(availableStages)[0];
        // chosen_stage= availableStages.filter(x=> x.code == "SV-EX-5")[0]
        if (chosen_stage) {
          let stageurl = `${
            DATA_BASE[serverString]
          }/gamedata/levels/${chosen_stage.levelId.toLowerCase()}.json`;
          fetch(stageurl)
            .then((res) => fixedJson(res))
            .then((js) => {
              div.prepend(tableFromStageData(js));
              if (parentDiv.firstChild)
                parentDiv.replaceChild(div, parentDiv.firstChild);
              else parentDiv.appendChild(div);
            });
        }
        span.innerHTML = (chosen_stage || { code: "???" }).code;
        div.appendChild(span);
      }
      function draftSquad() {
        // local vars for this draft
        let draftedOps = [];
        let availableOperators = Object.values(operatorData).filter(
          (x) => x.selected && !draftedOps.includes(x.charId),
        );
        let localFilters = JSON.parse(JSON.stringify(filters));
        let hope = -1;
        if (filters.Squad.pointDraft.enabled)
          hope = filters.Squad.pointDraft.max;

        destDiv = document.getElementById("output");
        destDiv.classList.add("draft");
        destDiv.innerHTML = "";
        let header = document.createElement("span");
        header.innerHTML = "Choose one ";
        if (filters.Squad.pointDraft.enabled)
          header.innerHTML += "(Hope: " + hope + ") ";
        header.innerHTML +=
          "[" + draftedOps.length + "/" + localFilters.Squad.Size.max + "]";
        header.style.order = -999;
        let selection = document.createElement("div");
        selection.classList.add("opDraft");
        selection.style.order = -998;
        let teamheader = document.createElement("span");
        teamheader.innerHTML = "Your draft:";
        teamheader.style.order = 0;
        teamheader.classList.add("hidden");
        let team = document.createElement("div");
        team.classList.add("opDraft");
        team.id = "draftedOps";
        team.style.order = 1;

        destDiv.prepend(selection);
        destDiv.prepend(header);
        destDiv.append(teamheader);
        destDiv.append(team);

        function chooseOp(op, _) {
          teamheader.classList.remove("hidden");
          CreateOpCheckbox(
            op,
            null,
            null,
            null,
            null,
            team,
            -op.rarity,
            [],
            filters.Squad.randomizeSkills.enabled ? op.randomizedSkill : null,
          );
          draftedOps.push(op.charId);
          hope -= hopeMap[op.rarity];

          localFilters.Rarity[parseInt(op.rarity)].min -= 1;
          localFilters.Rarity[parseInt(op.rarity)].max -= 1;
          localFilters.Class[op.profession].max -= 1;
          localFilters.Class[op.profession].min -= 1;

          if (draftedOps.length >= localFilters.Squad.Size.max)
            return finalizeDraft();
          selection.innerHTML = "";
          draftRound();
        }

        function finalizeDraft() {
          // replace with team.
          destDiv.innerHTML = team.innerHTML;
          destDiv.classList.remove("draft");
        }
        function draftRound() {
          function assignWeights(oplist, currentSelection = []) {
            let existingClasses = currentSelection.map(
              (o) => operatorData[o].profession,
            );
            let existingRarities = currentSelection.map(
              (o) => operatorData[o].rarity,
            );
            Object.keys(oplist).forEach((chrid) => {
              let op = operatorData[chrid];
              let weight = 10;
              // add weight if needed for min requirement
              if (localFilters.Rarity[parseInt(op.rarity)].min > 0)
                weight += 100;
              if (localFilters.Class[op.profession].min > 0) weight += 100;
              // reduce 6* weight
              if (op.rarity >= 5) weight /= 2;
              // reduce 5* weight
              if (op.rarity >= 5) weight *= 2 / 3;
              // reduce 1-2* weights
              if (op.rarity < 2) weight /= 2;
              // reduce weights based on existing ops in this pack:
              // sharply reduce for same class
              if (existingClasses.includes(op.profession)) weight /= 4;
              // if same rarity, reduce based on rarity (higher rarity = more reduction)
              if (existingRarities.includes(op.rarity)) {
                switch (op.rarity) {
                  case 5:
                    weight /= 4;
                    break;
                  case 4:
                    weight /= 3;
                    break;
                  default:
                    // weight *= 4/5
                    break;
                }
              }
              oplist[op.charId] = weight;
            });
            return oplist;
          }
          function getOpList() {
            // filter by rarity:
            let thisDraft = availableOperators.filter(
              (x) =>
                localFilters.Rarity[parseInt(x.rarity)].enabled &&
                localFilters.Rarity[parseInt(x.rarity)].max > 0,
            );
            // filter by class:
            thisDraft = thisDraft.filter(
              (x) =>
                localFilters.Class[x.profession].enabled &&
                localFilters.Class[x.profession].max > 0,
            );
            // filter by hope remaining: // is this too powerful?
            if (filters.Squad.pointDraft.enabled)
              thisDraft = thisDraft.filter((x) => hopeMap[x.rarity] <= hope);
            if (thisDraft.length == 0) return {};
            let oplist = {};
            thisDraft.forEach((op) => {
              oplist[op.charId] = 0;
            });
            return oplist;
          }
          function addToSelection(chrid) {
            let op = operatorData[chrid];
            delete oplist[chrid];
            currentSelection.push(op.charId);
            availableOperators = availableOperators.filter(
              (x) => x.charId != op.charId,
            );
            let skid = null;
            if (filters.Squad.randomizeSkills.enabled && op.skills.length) {
              skid =
                op.skills[Math.floor(Math.random() * op.skills.length)].skillId;
              skid = skill_table[skid]?.iconId || skid;
              op.randomizedSkill = skid;
            }
            let cb = CreateOpCheckbox(
              op,
              null,
              null,
              null,
              chooseOp,
              selection,
              -op.rarity,
              [],
              skid,
            );
            if (filters.Squad.pointDraft.enabled) {
              let hopeamt = document.createElement("div");
              hopeamt.classList.add("data1");
              hopeamt.innerHTML = hopeMap[op.rarity];
              cb.appendChild(hopeamt);
            }
          }
          let oplist = assignWeights(getOpList());
          let currentSelection = [];
          let remaining = localFilters.Squad.draftSize.max;
          while (remaining) {
            if (!Object.keys(oplist).length) {
              // set available then rebuild oplist
              availableOperators = Object.values(operatorData).filter(
                (x) =>
                  x.selected &&
                  !draftedOps.includes(x.charId) &&
                  !currentSelection.includes(x.charId),
              );
              oplist = assignWeights(getOpList(), currentSelection);
              if (!Object.keys(oplist).length) break;
            }
            // get weighted random op
            oplist = assignWeights(oplist, currentSelection);
            let weightSum = Object.values(oplist).reduce((a, b) => a + b, 0);
            let rng = Math.random() * weightSum;
            let tot = 0;
            let chrid = Object.keys(oplist).at(-1);
            Object.keys(oplist).some((k) => {
              tot += oplist[k];
              if (rng < tot) {
                chrid = k;
                return true;
              }
            });
            addToSelection(chrid);
            remaining--;
          }
          if (filters.Squad.pointDraft.enabled) {
            let freeops = currentSelection.filter(
              (x) => hopeMap[operatorData[x].rarity] <= 0,
            );
            if (freeops.length == 0) {
              // add one free op if none in selection.
              let zerocost = Object.values(operatorData).filter(
                (x) =>
                  x.selected &&
                  !draftedOps.includes(x.charId) &&
                  !currentSelection.includes(x.charId) &&
                  hopeMap[x.rarity] <= 0,
              );
              if (zerocost.length)
                addToSelection(
                  zerocost[Math.floor(Math.random() * zerocost.length)].charId,
                );
            }
          }
          header.innerHTML = "Choose one ";
          if (filters.Squad.pointDraft.enabled)
            header.innerHTML += "(Hope: " + hope + ") ";
          header.innerHTML +=
            "[" + draftedOps.length + "/" + localFilters.Squad.Size.max + "]";
          if (!currentSelection.length)
            // no ops left for further drafts, so finalize.
            finalizeDraft();
        }
        draftRound();
      }
      function rerollSquad() {
        destDiv = document.getElementById("output");
        destDiv.classList.remove("draft");
        destDiv.innerHTML = "";
        // pick a squad
        let availableOperators = Object.values(operatorData).filter(
          (x) => x.selected,
        );
        let localFilters = JSON.parse(JSON.stringify(filters));
        let real_size_cap = Math.min(
          filters.Squad.Size.max,
          Object.values(localFilters.Rarity).reduce(
            (p, c) => p + (c.enabled ? Math.max(c.max, 0) : 0),
            0,
          ),
          Object.values(localFilters.Class).reduce(
            (p, c) => p + (c.enabled ? Math.max(c.max, 0) : 0),
            0,
          ),
        );
        for (let i = 0; i < real_size_cap; i++) {
          // filter by rarity:
          availableOperators = availableOperators.filter(
            (x) =>
              localFilters.Rarity[parseInt(x.rarity)].enabled &&
              localFilters.Rarity[parseInt(x.rarity)].max > 0,
          );
          // filter by class:
          availableOperators = availableOperators.filter(
            (x) =>
              localFilters.Class[x.profession].enabled &&
              localFilters.Class[x.profession].max > 0,
          );
          let ops_needed = Object.values(localFilters.Rarity)
            .concat(Object.values(localFilters.Class))
            .reduce((p, c) => p + Math.max(c.min, 0), 0);
          let chances_left = real_size_cap - i - 1;
          let randomOne = shuffleArray(availableOperators)
            .sort((a, b) => {
              let score_a =
                (localFilters.Rarity[parseInt(a.rarity)].min > 0) +
                (localFilters.Class[a.profession].min > 0);
              let score_b =
                (localFilters.Rarity[parseInt(b.rarity)].min > 0) +
                (localFilters.Class[b.profession].min > 0);
              return ops_needed > chances_left
                ? score_a - score_b
                : !!score_a - !!score_b;
            })
            .pop();
          if (!randomOne) break;
          let skid = null;
          if (
            filters.Squad.randomizeSkills.enabled &&
            randomOne.skills.length
          ) {
            skid =
              randomOne.skills[
                Math.floor(Math.random() * randomOne.skills.length)
              ].skillId;
            skid = skill_table[skid]?.iconId || skid;
          }
          CreateOpCheckbox(
            randomOne,
            null,
            null,
            null,
            null,
            destDiv,
            -randomOne.rarity,
            [],
            skid,
          );
          // reduce min and max
          localFilters.Rarity[parseInt(randomOne.rarity)].min -= 1;
          localFilters.Rarity[parseInt(randomOne.rarity)].max -= 1;
          localFilters.Class[randomOne.profession].max -= 1;
          localFilters.Class[randomOne.profession].min -= 1;
        }
      }
      function rerollChallenge() {
        let res = document.getElementById("challengeRoll");
        res.innerHTML =
          shuffleArray(challengeList)
            .slice(0, filters.Squad.Challenges.max)
            .join("<br/>") || "None";
        if (res.innerHTML == "None") {
          res.classList.add("hidden");
          document.getElementById("challengeTitle").classList.add("hidden");
        } else {
          res.classList.remove("hidden");
          document.getElementById("challengeTitle").classList.remove("hidden");
        }
      }
      document.getElementById("rerollStageBtn").onclick = rerollStage;
      rerollStage();
      document.getElementById("rerollSquadBtn").onclick = rerollSquad;
      rerollSquad();
      document.getElementById("rerollChallengeBtn").onclick = rerollChallenge;
      rerollChallenge();

      document.getElementById("draftBtn").onclick = draftSquad;
    }

    document.getElementById("goBtn").onclick = Randomize;

    function updateLocalFilters() {
      localStorage.setItem("randomizerFilters", JSON.stringify(filters));
    }

    // populate filters
    // use settings from filters var, which is previously loaded from localStorage
    for (const [key, value] of Object.entries(filters)) {
      let section = document.createElement("table");
      section.classList.add("filterSection");
      let title = document.createElement("tr");
      title.classList.add("hr-row");
      let th = document.createElement("th");
      th.innerHTML = key;
      th.setAttribute("colspan", 2);
      title.appendChild(th);
      section.appendChild(title);
      // if needed (all are checkboxes), add select add/none btn at top:
      if (
        Object.values(value).every(
          (v) => v.enabled !== undefined && v.min == undefined,
        )
      ) {
        let row = document.createElement("tr");
        let td = document.createElement("td");
        let lbl = document.createElement("label");
        let btn_all = document.createElement("div");
        let btn_none = document.createElement("div");
        let btn_main = document.createElement("div");
        td.classList.add("flex");
        lbl.innerHTML = "Select:";
        btn_all.classList.add("button");
        btn_all.innerHTML = "All";
        btn_all.onclick = () => {
          section
            .querySelectorAll('td:not([type="opt"]) input[type="checkbox"]')
            .forEach((cb) => {
              if (!cb.checked) cb.click();
            });
        };
        btn_main.classList.add("button");
        btn_main.innerHTML = "Main";
        btn_main.onclick = () => {
          section
            .querySelectorAll(
              'td[type="main"]:not([type="opt"]) input[type="checkbox"]',
            )
            .forEach((cb) => {
              if (!cb.checked) cb.click();
            });
        };
        btn_none.classList.add("button");
        btn_none.innerHTML = "Invert";
        btn_none.onclick = () => {
          section
            .querySelectorAll('td:not([type="opt"]) input[type="checkbox"]')
            .forEach((cb) => cb.click());
        };
        row.appendChild(td);
        td.appendChild(lbl);
        td.appendChild(btn_all);
        td.appendChild(btn_none);
        td.appendChild(btn_main);
        section.appendChild(row);
        section.appendChild(document.createElement("br"));
      }
      for (const [subkey, subvalue] of Object.entries(value)) {
        let row = document.createElement("tr");
        let left = document.createElement("td");
        let right = document.createElement("td");
        let label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = subvalue.enabled;
        checkbox.onchange = () => {
          subvalue.enabled = checkbox.checked;
          updateLocalFilters();
        };
        label.innerHTML = subvalue.disp;
        if (subvalue.tooltip) {
          label.setAttribute("title", subvalue.tooltip);
          checkbox.setAttribute("title", subvalue.tooltip);
        }
        label.onclick = () => {
          checkbox.checked = !checkbox.checked;
          checkbox.onchange();
        };

        if (stage_types[subkey]) left.setAttribute("type", stage_types[subkey]);
        if (subvalue.enabled !== undefined) left.appendChild(checkbox);
        left.appendChild(label);
        row.appendChild(left);
        section.appendChild(row);
        if (subvalue.opt) {
          label.style.color = subvalue.color;
          left.setAttribute("type", "opt");
        }

        if (subvalue.max === undefined) continue;
        label.innerHTML += ":";

        let min = document.createElement("input");
        min.onchange = () => {
          subvalue.min = min.value;
          updateLocalFilters();
        };
        min.type = "number";
        min.min = subvalue.minvalmin || 0;
        min.max = subvalue.minvalmax || maxTeamSize;
        min.value = subvalue.minvaldefault || subvalue.min;
        if (subvalue.min !== undefined) right.appendChild(min);
        let dash = document.createElement("span");
        dash.innerHTML = "-";
        if (subvalue.min !== undefined) right.appendChild(dash);
        let max = document.createElement("input");
        max.onchange = () => {
          subvalue.max = max.value;
          updateLocalFilters();
        };
        max.type = "number";
        max.min = subvalue.maxvalmin || 0;
        max.max = subvalue.maxvalmax || maxTeamSize;
        max.value = subvalue.maxvaldefault || subvalue.max;

        right.appendChild(max);
        row.appendChild(right);
      }
      document.getElementById("options").appendChild(section);
    }

    document.getElementById("filterResetBtn").onclick = () => {
      localStorage.removeItem("randomizerFilters");
      location.reload();
    };

    document.getElementById("selectAllBtn").onclick = () => {
      Object.keys(divMap).forEach((x) => {
        if (divMap[x].classList.contains("show")) {
          divMap[x].classList.add("_selected");
          operatorData[x].selected = true;
        }
      });
      saveOpList();
    };
    document.getElementById("selectNoneBtn").onclick = () => {
      Object.keys(divMap).forEach((x) => {
        if (divMap[x].classList.contains("show")) {
          divMap[x].classList.remove("_selected");
          operatorData[x].selected = false;
        }
      });
      saveOpList();
    };

    function filterByClass() {
      let shownClasses = [];
      Array.from(document.getElementsByClassName("class-selector")).forEach(
        (x) => {
          if (x.classList.contains("_selected"))
            shownClasses.push(x.dataset.class);
        },
      );
      Object.values(divMap).forEach((x) => {
        if (shownClasses.length == 0 || shownClasses.includes(x.dataset.class))
          x.classList.add("show");
        else x.classList.remove("show");
      });
    }
    // enable class filters:
    Array.from(document.getElementsByClassName("class-selector")).forEach(
      (x) => {
        x.onclick = () => {
          x.classList.toggle("_selected");
          filterByClass();
        };
      },
    );
  });

var randomizerToggles = { filterBtn: true, rosterBtn: true };
let f = localStorage.getItem("randomizerToggles");
if (f) updateJSON(randomizerToggles, JSON.parse(f));

document.getElementById("rosterBtn").onclick = () => {
  document.getElementById("rosterBtn").classList.toggle("checked");
  let roster = document.getElementById("roster");
  roster.classList.toggle("hidden");
  randomizerToggles.rosterBtn = !roster.classList.contains("hidden");
  localStorage.setItem("randomizerToggles", JSON.stringify(randomizerToggles));
};
document.getElementById("filterBtn").onclick = () => {
  document.getElementById("filterBtn").classList.toggle("checked");
  let filter = document.getElementById("filterWrapper");
  filter.classList.toggle("hidden");
  randomizerToggles.filterBtn = !filter.classList.contains("hidden");
  localStorage.setItem("randomizerToggles", JSON.stringify(randomizerToggles));
};
for (var key in randomizerToggles) {
  if (randomizerToggles[key]) document.getElementById(key).click();
}

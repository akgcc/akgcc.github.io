var operatorData,
    charCodeMap = {},
    currentCategory,
    storyReview,
    storyTypes = {
        record: [],
        main: [],
        side: [],
        mini: [],
        module: [],
        rogue: [],
    },
    storyTypeNames = {
        record: "Operator Record",
        main: "Main Story",
        side: "Side Story",
        mini: "Vignette",
        module: "Operator Module",
        rogue: "Integrated Strategies",
    },
    soundMap,
    lastBackgroundImage,
    storyReviewMeta,
    allScenes = [],
    topNavHeight = 0,
    titleBottomPos = 0,
    realMidpoint,
    allMusic = [],
    allSoundButtons = [],
    autoPlayPoint = 0,
    soundQueue = [],
    longSoundQueue = [],
    enableSoundAutoplay = false,
    moduleStory,
    rogueStory,
    storyTable,
    storyNameDiv;
soundQueue.max_size = 5;
longSoundQueue.max_size = 2;
const shortAudioMaxLen = 3.5;
const charPathFixes = {
    char_2006_weiywfmzuki: "char_2006_fmzuki",
    // avg_NPC_017_3: "avg_npc_017_3",
    // avg_1012_skadiSP_1: "avg_1012_skadisp_1",
};
const CharslotFocusMap = {
    l: 1,
    left: 1,
    m: 2,
    middle: 2,
    r: 3,
    right: 3,
    all: 99,
    none: -1,
};
const CharslotNameMap = {
    l: "", // these 2 *should* be able to be set to 1, but leaving it like this for safety
    left: "",
    m: 2,
    middle: 2,
    r: 3,
    right: 3,
};
const dirMap = {
    0: "to bottom",
    4: "to top",
    6: "to right",
    2: "to left",
    1: "45deg",
    3: "315deg",
    5: "225deg",
    7: "135deg",
};
const DecisionNotDoctor = {
    "mini&act13d0&3": "avg_4133_logos_1#1$1",
    "side&act19side&0": "avg_128_plosis_1#1$1",
    "side&act9d0&8": "avg_npc_026#1$1", //scout
}; // stories where the "reader" isn't doctor when making choices
const customStoryNames = {
    "main_15_level_main_15-15_end_variation01": {
        name: "15-17 After",
        style: { color: "grey" },
    },
    "main_15_level_main_15-15_end_variation02": {
        name: "15-17 After",
        style: { color: "lightblue" },
    },
};
const storyDiv = document.getElementById("storyDisp");
var CURRENT_STORY;
get_char_table(false, serverString)
    .then((js) => {
        operatorData = js;
        for (var key in operatorData) {
            charCodeMap[key.split("_")[2]] = key;
        }
        return fetch(
            `${DATA_BASE[serverString]}/gamedata/story/story_variables.json`,
        );
    })
    .then((res) => fixedJson(res))
    .then((js) => {
        soundMap = js;
        soundMap["$ill_amiya_normal"] = "char_002_amiya_1";
        return fetch(
            `${DATA_BASE[serverString]}/gamedata/excel/uniequip_table.json`,
        );
    })
    .then((res) => fixedJson(res))
    .then((js) => {
        moduleStory = js;
        return fetch(
            `${DATA_BASE[serverString]}/gamedata/excel/story_table.json`,
        );
    })
    .then((res) => fixedJson(res))
    .then((js) => {
        storyTable = js;
        return fetch(
            `${DATA_BASE[serverString]}/gamedata/excel/story_review_meta_table.json`,
        );
    })
    .then((res) => fixedJson(res))
    .then((js) => {
        storyReviewMeta = js;
        return fetch(
            `${DATA_BASE[serverString]}/gamedata/excel/roguelike_topic_table.json`,
        );
    })
    .then((res) => fixedJson(res))
    .then((js) => {
        rogueStory = js;
        return fetch(
            `${DATA_BASE[serverString]}/gamedata/excel/story_review_table.json`,
        );
    })
    .then((res) => fixedJson(res))
    .then((js) => {
        storyReview = js;
        Object.values(storyReview).forEach((x) => {
            // add special unlockable stories (like in NL)
            if (x.id in storyReviewMeta?.actArchiveData?.components) {
                Object.values(
                    storyReviewMeta?.actArchiveData?.components[x.id]?.avg
                        ?.avgs || {},
                )
                    .sort((a, b) => (a?.avgSortId || 0) - (b?.avgSortId || 0))
                    .map((x) => x?.avgId)
                    .forEach((avgid) => {
                        x.infoUnlockDatas.push({
                            storyGroup: x.id,
                            storyInfo:
                                storyReviewMeta?.actArchiveResData?.avgs[avgid]
                                    ?.breifPath,
                            storyTxt:
                                storyReviewMeta?.actArchiveResData?.avgs[avgid]
                                    ?.contentPath,
                            storyCode:
                                storyReviewMeta?.actArchiveResData?.avgs[avgid]
                                    ?.desc,
                            storyName:
                                storyReviewMeta?.actArchiveResData?.avgs[avgid]
                                    ?.desc,
                            avgTag: "",
                        });
                    });
            }
            // append intro video to storyunlockdatas
            const INTRO_NAME = "PV";
            const INTRO_CODE = "Introduction";
            if (x.id.startsWith("main_")) {
                // check if entry exists first, then add
                let storytxt = x.infoUnlockDatas[0].storyTxt.replace(
                    /[^\/]+$/,
                    `${x.id}_zone_enter`,
                );
                if (storyTable[storytxt]) {
                    x.infoUnlockDatas.unshift({
                        storyGroup: x.id,
                        storyInfo: x.infoUnlockDatas[0].storyInfo.replace(
                            /[^\/]+$/,
                            `${x.id}_zone_enter`,
                        ),
                        storyTxt: storytxt,
                        storyCode: INTRO_CODE,
                        storyName: INTRO_NAME,
                        avgTag: "",
                    });
                }
            }
            // Intro story for non-main stories:
            // commented out for now because the video files are unavailable.
            else {
                let storytxt = x.infoUnlockDatas[0].storyTxt.replace(
                    /[^\/]+$/,
                    `level_${x.id}_entry`,
                );
                if (storyTable[storytxt]) {
                    x.infoUnlockDatas.unshift({
                        storyGroup: x.id,
                        storyInfo: x.infoUnlockDatas[0].storyInfo.replace(
                            /[^\/]+$/,
                            `level_${x.id}_entry`,
                        ),
                        storyTxt: storytxt,
                        storyCode: INTRO_CODE,
                        storyName: INTRO_NAME,
                        avgTag: "",
                    });
                }
            }
            if (x.id.startsWith("main_")) storyTypes.main.push(x.id);
            else if (x.id.startsWith("story_")) storyTypes.record.push(x.id);
            else if (x.entryType.startsWith("MINI_"))
                storyTypes.mini.push(x.id);
            else storyTypes.side.push(x.id);
        });
        storyTypes.module = []
            .concat(
                ...Object.values(moduleStory.charEquip).map((x) => x.slice(1)),
            )
            .filter((x) => operatorData[moduleStory.equipDict[x].charId]);
        storyTypes.module.forEach(
            (x) =>
                (storyReview[x] = {
                    infoUnlockDatas: [
                        {
                            storyName: moduleStory.equipDict[x].uniEquipName,
                            storyTxt: x,
                        },
                    ],
                }),
        );
        // this is available in roguelike_table, but were never translated (because they weren't used)
        storyTypes.rogue.push("rogue_0");
        storyReview["rogue_0"] = {
            name: "Ceobe's Fungimist",
            infoUnlockDatas: [
                {
                    storyName: "迷尘幻梦",
                    storyTxt: "activities/act12d6/level_act12d6_ending_1",
                },
                {
                    storyName: "茫然行者",
                    storyTxt: "activities/act12d6/level_act12d6_ending_2",
                },
                {
                    storyName: "归于荒野",
                    storyTxt: "activities/act12d6/level_act12d6_ending_3",
                },
            ],
        };
        // for each roguelike:
        for (const [rogue_key, rogue_topic] of Object.entries(
            rogueStory.topics,
        )) {
            storyTypes.rogue.push(rogue_key);
            storyReview[rogue_key] = {
                name: rogue_topic.name,
                infoUnlockDatas: [],
            };
            is_num = /_(\d)/.exec(rogue_key)[1];
            is_name = `IS${parseInt(is_num) + 1}`;

            const endbook =
                rogueStory.details[rogue_key].archiveComp.endbook.endbook;
            if (!Object.keys(endbook).length) {
                // ro1 has no endbook, parse endings from "endings" instead:
                for (const [k, v] of Object.entries(
                    rogueStory.details[rogue_key].endings,
                )) {
                    ending_num = /_([^_]+)$/.exec(k)[1];
                    storyReview[rogue_key].infoUnlockDatas.push({
                        storyName: v.name,
                        storyTxt: `obt/roguelike/ro${is_num}/level_rogue${is_num}_ending_${ending_num}`,
                    });
                }
            } else {
                // for each endbook:
                for (const [k, v] of Object.entries(endbook)) {
                    // base story:
                    storyReview[rogue_key].infoUnlockDatas.push({
                        storyName: v.title,
                        storyTxt: v.avgId.toLowerCase(),
                    });
                    // for each part...
                    for (const [k2, v2] of Object.entries(
                        v.clientEndbookItemDatas,
                    )) {
                        storyReview[rogue_key].infoUnlockDatas.push({
                            storyName: `${v.title} - ${v2.endbookName}`,
                            storyTxt: v2.textId.toLowerCase(),
                            storyBackground: v.cgId,
                        });
                    }
                }
            }
            Object.keys(rogueStory.details[rogue_key].monthSquad).forEach(
                (k, month_num) => {
                    let v = rogueStory.details[rogue_key].monthSquad[k];
                    let month_key = `${rogue_key}_${k}`;
                    storyTypes.rogue.push(month_key);
                    let chars = v.teamChars;
                    if (chars && typeof chars?.[0] === "object")
                        chars = chars.map((x) => {
                            return { name: x.teamCharId };
                        });
                    storyReview[month_key] = {
                        name: `M${month_num + 1} - ${v.teamName}`,
                        infoUnlockDatas: [],
                        chars: chars,
                    };
                    if (
                        rogueStory.details[rogue_key].archiveComp.chat.chat[
                            v.chatId
                        ].clientChatItemData
                    ) {
                        for (const [k2, v2] of Object.entries(
                            rogueStory.details[rogue_key].archiveComp.chat.chat[
                                v.chatId
                            ].clientChatItemData,
                        )) {
                            storyReview[month_key].infoUnlockDatas.push({
                                storyName: `Floor ${v2.chatFloor}`,
                                storyTxt: `${v2.chatStoryId.toLowerCase()}`,
                                storyBackground: `pic_${rogue_key}_1`,
                            });
                        }
                    } else {
                        for (const [k2, v2] of Object.entries(
                            rogueStory.details[rogue_key].archiveComp.chat.chat[
                                v.chatId
                            ].chatItemList,
                        )) {
                            storyReview[month_key].infoUnlockDatas.push({
                                storyName: `Floor ${v2.floor}`,
                                storyTxt: `${v2.chatStoryId.toLowerCase()}`,
                                storyBackground: `pic_${rogue_key}_1`,
                            });
                        }
                    }
                },
            );
        }

        storyTypes.record.sort((a, b) => {
            let na = (
                operatorData[charCodeMap[a.split("story_")[1].split("_")[0]]]
                    .name ||
                operatorData[charCodeMap[a.split("story_")[1].split("_")[0]]]
                    .appellation +
                    " " +
                    a.split("_").slice(-1)
            ).toLowerCase();
            let nb = (
                operatorData[charCodeMap[b.split("story_")[1].split("_")[0]]]
                    .name ||
                operatorData[charCodeMap[b.split("story_")[1].split("_")[0]]]
                    .appellation +
                    " " +
                    b.split("_").slice(-1)
            ).toLowerCase();
            if (na < nb) return -1;
            if (nb < na) return 1;
            return 0;
        });
        storyTypes.module.sort((a, b) => {
            let na = (
                operatorData[charCodeMap[a.split("_").slice(-1)[0]]].name ||
                operatorData[charCodeMap[a.split("_").slice(-1)[0]]]
                    .appellation +
                    " " +
                    parseInt(/uniequip_(\d+)/i.exec(a)[1])
            ).toLowerCase();
            let nb = (
                operatorData[charCodeMap[b.split("_").slice(-1)[0]]].name ||
                operatorData[charCodeMap[b.split("_").slice(-1)[0]]]
                    .appellation +
                    " " +
                    parseInt(/uniequip_(\d+)/i.exec(b)[1])
            ).toLowerCase();
            if (na < nb) return -1;
            if (nb < na) return 1;
            return 0;
        });
        Object.keys(storyTypes).forEach((t) => {
            let opt = document.createElement("option");
            opt.value = t;
            opt.innerHTML = storyTypeNames[t];
            document.getElementById("catSelect").appendChild(opt);
        });
        function buildThirdSelector(uppercat, cat, trigger = true) {
            document.getElementById("thirdCatSelect").innerHTML = "";
            let stories = storyReview[cat].infoUnlockDatas;
            stories.sort((a, b) => a.storySort - b.storySort);
            // sort if needed:
            // switch (uppercat) {
            //     case "side":
            //     case "mini":
            //     case "main":
            //         // if main sort by story code:
            //         stories.sort((a, b) => {
            //             let code_a =
            //                 /\d+-\d+(_.)?/.exec(a.storyDependence) &&
            //                 /\d+-\d+(_.)?/.exec(a.storyDependence)[0];
            //             let code_b =
            //                 /\d+-\d+(_.)?/.exec(b.storyDependence) &&
            //                 /\d+-\d+(_.)?/.exec(b.storyDependence)[0];
            //             if (
            //                 /_spst_/.exec(b.storyId) ||
            //                 /_spst_/.exec(a.storyId)
            //             ) {
            //                 if (code_b >= code_a) {
            //                     return -1;
            //                 }
            //                 return 1;
            //             }
            //             return 0;
            //         });
            //         break;
            // }
            stories.forEach((d, i) => {
                let name = d.storyName;

                switch (uppercat) {
                    case "main":
                    case "mini":
                    case "side":
                        if (d.storyCode) {
                            let pos = d.avgTag.split(" ")[0];
                            name = d.storyCode;
                            if (
                                [
                                    "Before Operation",
                                    "戦闘前",
                                    "작전 전",
                                    "行动前",
                                ].some((x) => d.avgTag.includes(x))
                            )
                                name += " Before";
                            else if (
                                [
                                    "After Operation",
                                    "戦闘後",
                                    "작전 후",
                                    "行动后",
                                ].some((x) => d.avgTag.includes(x))
                            )
                                name += " After";
                        }
                        break;
                    case "record":
                        if (stories.length > 1) name += " [" + (i + 1) + "]";
                        break;
                }
                let opt = document.createElement("option");
                if (d.storyId in customStoryNames) {
                    name = customStoryNames[d.storyId].name;
                    Object.assign(opt.style, customStoryNames[d.storyId].style);
                }
                opt.value = i;
                opt.innerHTML = name;
                document.getElementById("thirdCatSelect").appendChild(opt);
            });
            document.getElementById("thirdCatSelect").onchange = () => {
                // change hash, this will trigger the listener to load the story.
                window.location.hash = [
                    uppercat,
                    cat,
                    document.getElementById("thirdCatSelect").value,
                ].join("&");
            };
            if (trigger) document.getElementById("thirdCatSelect").onchange();
        }
        function buildSecondSelector(cat, trigger = true) {
            document.getElementById("subCatSelect").innerHTML = "";
            let namefunc = (k) => k;
            switch (cat) {
                case "main":
                    namefunc = (k) =>
                        "Chapter " + k.split("_")[1].padStart(2, "0");
                    break;
                case "record":
                    namefunc = (n) => {
                        let name =
                            operatorData[
                                charCodeMap[n.split("story_")[1].split("_")[0]]
                            ].name ||
                            operatorData[
                                charCodeMap[n.split("story_")[1].split("_")[0]]
                            ].appellation;
                        let storynum = parseInt(/set_(\d+)/i.exec(n)[1]);
                        if (storynum > 1 || n.slice(0, -1) + "2" in storyReview)
                            name += " [" + n.split("_").slice(-1) + "]";
                        return name;
                    };
                    break;
                case "module":
                    namefunc = (n) => {
                        let name =
                            operatorData[charCodeMap[n.split("_").slice(-1)[0]]]
                                .name ||
                            operatorData[charCodeMap[n.split("_").slice(-1)[0]]]
                                .appellation;
                        let modulenum = parseInt(/uniequip_(\d+)/i.exec(n)[1]);
                        name += " [" + (modulenum - 1) + "]";
                        return name;
                    };
                    break;
                case "mini":
                case "side":
                case "rogue":
                default:
                    namefunc = (k) => storyReview[k].name;
                    break;
            }
            storyTypes[cat].forEach((k) => {
                let opt = document.createElement("option");
                opt.value = k;

                opt.innerHTML = namefunc(k);
                document.getElementById("subCatSelect").appendChild(opt);
            });

            document.getElementById("subCatSelect").onchange = () => {
                buildThirdSelector(
                    cat,
                    document.getElementById("subCatSelect").value,
                );
            };
            if (trigger) document.getElementById("subCatSelect").onchange();
        }
        document.getElementById("catSelect").onchange = () => {
            buildSecondSelector(document.getElementById("catSelect").value);
        };

        // nav buttons
        Array.from(document.getElementsByClassName("story_next")).forEach(
            (e) => {
                e.onclick = () => {
                    let currentCategory =
                        document.getElementById("thirdCatSelect");
                    if (currentCategory.options.length == 1)
                        currentCategory =
                            document.getElementById("subCatSelect");
                    currentCategory.options[
                        ++currentCategory.selectedIndex %
                            currentCategory.options.length
                    ].selected = true;
                    currentCategory.onchange();
                    topFunction();
                };
            },
        );
        Array.from(document.getElementsByClassName("story_prev")).forEach(
            (e) => {
                e.onclick = () => {
                    let currentCategory =
                        document.getElementById("thirdCatSelect");
                    if (currentCategory.options.length == 1)
                        currentCategory =
                            document.getElementById("subCatSelect");
                    currentCategory.options[
                        (--currentCategory.selectedIndex +
                            currentCategory.options.length) %
                            currentCategory.options.length
                    ].selected = true;
                    currentCategory.onchange();
                    topFunction();
                };
            },
        );
        function loadFromHash() {
            [uppercat, cat, idx] = window.location.hash.slice(1).split("&");

            Array.from(document.getElementById("catSelect").options).forEach(
                (o) => {
                    if (o.value == uppercat) o.selected = true;
                },
            );
            buildSecondSelector(uppercat, false);

            // change server & reload page if CN exclusive
            if (!(cat in storyReview)) {
                if (!sessionStorage.getItem("userChange")) {
                    localStorage.setItem("server", "zh_CN");
                    location.reload();
                } else {
                    cat =
                        document.getElementById("subCatSelect").options[0]
                            .value;
                }
            }

            Array.from(document.getElementById("subCatSelect").options).forEach(
                (o) => {
                    if (o.value == cat) o.selected = true;
                },
            );
            buildThirdSelector(uppercat, cat, false);
            Array.from(
                document.getElementById("thirdCatSelect").options,
            ).forEach((o) => {
                if (o.value == idx) o.selected = true;
            });
            let data =
                storyReview[cat].infoUnlockDatas[
                    document.getElementById("thirdCatSelect").value
                ];
            genStory(data, storyReview[cat].chars).then(() => {
                scrollFunction();
                sessionStorage.setItem("userChange", false);
            });
            CURRENT_STORY = [uppercat, cat, idx].join("&");
        }
        window.onhashchange = loadFromHash;
        if (window.location.hash) {
            loadFromHash();
        } else {
            // select current event story; if story begins >12hrs from now, don't select it.
            let latest_story = Object.keys(storyReview)
                .filter(
                    (k) =>
                        storyReview[k].entryType != "NONE" &&
                        (storyReview[k].remakeStartTime > 0
                            ? storyReview[k].remakeStartTime
                            : storyReview[k].startTime > 0
                            ? storyReview[k].startTime
                            : storyReview[k].startShowTime) <
                            Date.now() / 1000 - 60 * 60 * 12,
                )
                .sort(
                    (a, b) =>
                        (storyReview[a].remakeStartTime > 0
                            ? storyReview[a].remakeStartTime
                            : storyReview[a].startTime > 0
                            ? storyReview[a].startTime
                            : storyReview[a].startShowTime) -
                        (storyReview[b].remakeStartTime > 0
                            ? storyReview[b].remakeStartTime
                            : storyReview[b].startTime > 0
                            ? storyReview[b].startTime
                            : storyReview[b].startShowTime),
                )
                .slice(-1)[0];
            let newHash = "#";
            for (const [k, v] of Object.entries(storyTypes)) {
                if (v.includes(latest_story)) {
                    newHash += k;
                    break;
                }
            }
            newHash += "&" + latest_story + "&0";
            history.replaceState(null, "", newHash);
            loadFromHash();
        }
    });
function escapeInvalidTags(text) {
    // chatGPT function
    // List of allowed tags
    const allowedTags = ["b", "i", "u"];

    // Create a regex to match allowed tags
    const allowedRegex = new RegExp(
        `&lt;(/?(?:${allowedTags.join("|")})\\b[^&]*?)&gt;`,
        "gi",
    );

    // Escape all angle brackets
    let escapedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Restore allowed tags by unescaping them
    escapedText = escapedText.replace(allowedRegex, "<$1>");

    return escapedText;
}
async function genStory(data, avatars = []) {
    let storyName = data.storyName;
    let key = data.storyTxt;
    soundQueue.length = 0;
    longSoundQueue.length = 0;
    allScenes.length = 0;
    allMusic.length = 0;
    allSoundButtons.length = 0;
    lastBackgroundImage = [];
    predicateQueue = [];
    activeReferences = [];
    referenceQueue = [];
    lastPredicate = { 1: [], 2: [], 3: [] }; // prevents catastrophic failure in an edge case
    wordCount = 0;
    imgCount = 0;
    let freshScene = false;
    const bgAnimations = [];
    let activeCurtains = {};
    let activeCurtainsCSS = null;
    let floatingCGImages = {};
    async function getModuleStory(key) {
        return {
            //bg_corridor is a good alternate
            text: () =>
                `[background(image="bg_room_2")]\n[ShowItem(image="${
                    moduleStory.equipDict[key].uniEquipIcon
                }",is_module=1)]\n${escapeInvalidTags(
                    moduleStory.equipDict[key].uniEquipDesc
                        .replace(/\n/g, "\\n")
                        .replace("[", "&#91;"),
                )}`,
            ok: true,
        };
    }

    return await (key.startsWith("uniequip")
        ? getModuleStory(key)
        : fetch(`${DATA_BASE[serverString]}/gamedata/story/${key}.txt`)
    )
        .then((r) => {
            if (!r.ok) {
                // story txt is missing (potentially old story that was deleted)
                return fetch(
                    `../gamedata/${serverString}/story/${key}.txt`,
                ).then((t) => (t.ok ? t.text() : r.text()));
            }
            return r.text();
        })
        .then((txt) => {
            if (data.storyBackground) {
                // use special bg, currently used for IS endbooks
                txt = `[roguebackground(image="${data.storyBackground}")]\n${txt}`;
            }
            const lines = txt.matchAll(/^(\[[^\]]+])?(.*)?$/gim);
            key.startsWith("uniequip")
                ? storyDiv.classList.add("module")
                : storyDiv.classList.remove("module");
            storyDiv.innerHTML = "";
            storyNameDiv = document.createElement("div");
            storyNameDiv.classList.add("storyName");
            (avatars || []).forEach((char) => {
                let img = document.createElement("img");
                img.src = uri_avatar(encodeURIComponent(char.name));
                img.classList.add("storyAvatar");
                storyNameDiv.appendChild(img);
            });
            let titletxt = document.createElement("span");
            titletxt.innerHTML = storyName;
            storyNameDiv.appendChild(titletxt);
            let readTime = document.createElement("span");
            readTime.classList.add("readtime");
            storyNameDiv.appendChild(readTime);
            const docName = document.createElement("span");
            docName.classList.add("docName");

            const drPrefix = document.createElement("span");
            drPrefix.textContent = "Dr. ";
            docName.appendChild(drPrefix);

            const editableName = document.createElement("span");
            editableName.classList.add("editableName");
            editableName.contentEditable = "true";
            editableName.textContent =
                localStorage.getItem("docName") || "{@nickname}";
            docName.appendChild(editableName);

            storyNameDiv.appendChild(docName);

            const maxLength = 24;
            editableName.addEventListener("beforeinput", (e) => {
                const text = editableName.textContent;
                const selection = window.getSelection();
                if (e.inputType.startsWith("delete")) return;
                if (selection.toString().length > 0) return;
                if (text.length >= maxLength) {
                    e.preventDefault();
                }
            });
            editableName.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                }
            });
            editableName.addEventListener("input", () => {
                localStorage.setItem("docName", editableName.textContent);
            });

            document.getElementById("storyTitle").innerHTML =
                titletxt.innerHTML;
            storyDiv.appendChild(storyNameDiv);
            let scene,
                speaker = 0,
                chars = {},
                speakerList = new Set(),
                preSceneAudios = [],
                lastBlockerColor = "rgba(0,0,0,0)",
                hangingBlocker,
                multiLineData = {};
            function addBlocker(start_color, end_color, prepend = false) {
                const blocker = document.createElement("div");
                blocker.classList.add("dialog");
                blocker.classList.add("blocker");
                // blocker.style.height = Math.max(1, Math.min(2, parseFloat(args.fadetime))) + "em";
                function colorStringToObject(color) {
                    // if already an obj convert values to numbers then return.
                    if (typeof color === "object") {
                        const colorkeys = ["r", "g", "b", "a"];
                        const nocolor = !colorkeys.some((k) => k in color);
                        ["r", "g", "b", "a"].forEach((k) => {
                            if (k in color) color[k] = Number(color[k]);
                            if (nocolor) color[k] = 0;
                        });
                        if (nocolor) color.a = 1;
                        return color;
                    }
                    const [r, g, b, a] = color
                        .match(/\d+(\.\d+)?/g)
                        .map(Number);
                    return { r, g, b, a: a ?? 1 };
                    return color;
                }
                function colorObjectToString(color) {
                    if (
                        "a" in color &&
                        "r" in color &&
                        "g" in color &&
                        "b" in color
                    ) {
                        const hasDot = [color.r, color.g, color.b].some((v) =>
                            String(v).includes("."),
                        );
                        const allUnderOne = [color.r, color.g, color.b].every(
                            (v) => parseFloat(v) <= 1,
                        );
                        const normalize = hasDot && allUnderOne ? 255 : 1;
                        return `rgba(${color.r * normalize},${
                            color.g * normalize
                        },${color.b * normalize},${
                            parseFloat(color.a) * blockerOpacity
                        })`;
                    }
                    if ("a" in color)
                        return `rgba(0,0,0,${
                            parseFloat(color.a) * blockerOpacity
                        })`;
                    return "rgba(0,0,0,0)";
                }
                const blockerOpacity = 1;
                if (allScenes.length == 0) {
                    start_color = { r: 38, g: 38, b: 38, a: 1 }; // doesn't need to be set exactly, a:1 is all that's needed
                    blocker.style.setProperty(
                        "--start-color",
                        "var(--main-background-color)",
                    );
                }
                start_color_obj = colorStringToObject(start_color);
                if (allScenes.length != 0) {
                    blocker.style.setProperty(
                        "--start-color",
                        colorObjectToString(start_color_obj),
                    );
                }
                end_color_obj = colorStringToObject(end_color);
                function colorEqual(c1, c2) {
                    return (
                        (c1.r ?? 0) == (c2.r ?? 0) &&
                        (c1.g ?? 0) == (c2.g ?? 0) &&
                        (c1.b ?? 0) == (c2.b ?? 0) &&
                        (c1.a ?? 0) == (c2.a ?? 0)
                    );
                }
                if (
                    (start_color_obj.a == 0 && end_color_obj.a == 0) ||
                    colorEqual(start_color_obj, end_color_obj)
                )
                    blocker.classList.add("nochange"); // set height to 0 if blocker changes nothing

                end_color = colorObjectToString(end_color_obj);
                blocker.style.setProperty("--end-color", end_color);
                if (!prepend) lastBlockerColor = end_color;
                if (start_color_obj.a > end_color_obj.a) {
                    // indicates a fadeout
                    blocker.classList.add("fadeout");
                } else {
                    // if alpha is equal mark as fadein, this will help color scenebreak correctly.
                    blocker.classList.add("fadein");
                }

                if (scene) {
                    // if scene isn't init we can still track lastBlockerColor
                    if (prepend) scene.prepend(blocker);
                    else scene.appendChild(blocker);
                }
                return blocker;
            }
            function addSceneBreak(requireBreak) {
                // add filler div if needed

                let scene_start_color = "rgba(0,0,0,0)";
                let end_color = "rgba(0,0,0,1)";

                let scenebreak = document.createElement("div");
                scenebreak.classList.add("scenebreak");
                storyDiv.appendChild(scenebreak);
                let lastBlocker = null;

                Array.from(scene.children).some((el) => {
                    if (el.classList.contains("dialog")) {
                        scene_start_color =
                            el.style.backgroundColor ||
                            el.style.getPropertyValue("--start-color") ||
                            "rgba(0,0,0,0)";
                        return true;
                    }
                });
                let sceneEndsWithFade = true;
                Array.from(scene.children)
                    .reverse()
                    .some((el) => {
                        if (
                            el.classList.contains("blocker") &&
                            !el.classList.contains("nochange")
                        ) {
                            lastBlocker = lastBlocker || el;
                            if (el.classList.contains("fadein")) {
                                //color scenebreak based on last blocker
                                end_color =
                                    el.style.getPropertyValue("--end-color");
                                let spacer = document.createElement("div");
                                spacer.classList.add("blocker");
                                spacer.classList.add("spacer-blocker");
                                spacer.style.backgroundColor =
                                    el.style.getPropertyValue("--start-color");
                                if (sceneEndsWithFade)
                                    spacer.classList.add("fullHeight");
                                el.before(spacer);
                                // if last element is soundplayer, don't need a scene break.
                                if (
                                    !requireBreak &&
                                    scene.querySelector(
                                        ".soundPlayer:last-child",
                                    )
                                )
                                    scenebreak.remove();
                                return true;
                            }
                            if (el.classList.contains("fadeout")) return true;
                        } else if (el.classList.contains("dialog")) {
                            // non-blocker after the blocker, don't expand spacer fully
                            sceneEndsWithFade = false;
                        }
                    });
                if (
                    parseFloat(
                        /(?:[\.\d]+,){3}([\.\d]+)/.exec(lastBlockerColor)[1],
                    ) &&
                    (!lastBlocker || lastBlocker.classList.contains("fadein"))
                ) {
                    // apply opaque blocker color to rest of scene.
                    scene.style.setProperty(
                        "--fill-blocker",
                        lastBlockerColor.split(" ")[0],
                    );
                    // --fill-blocker should be used as the scenebreak color if no lastblock is found
                    scene.classList.add("blockerPadded");
                }
                let firstDialog = scene.children?.[1];
                if (
                    !firstDialog?.classList.contains("blocker") ||
                    firstDialog?.classList.contains("fadein")
                ) {
                    const alpha =
                        scene_start_color
                            .match(/\d+(\.\d+)?/g)
                            .map(Number)?.[3] ?? 1;
                    // set alpha to 1 for start color to match the solid scenebreak
                    blocker = addBlocker(
                        alpha > 0
                            ? scene_start_color.replace(
                                  /rgba\(([^,]+,[^,]+,[^,]+),[^)]+\)/,
                                  "rgb($1)",
                              )
                            : "rgb(0,0,0)",
                        scene_start_color,
                        true,
                    );
                    blocker.classList.add("special"); // only used for debug
                    // if this is the topmost fade, fade from the story header color instead
                    if (allScenes.length == 1) {
                        blocker.style.setProperty(
                            "--start-color",
                            "var(--main-background-color)",
                        );
                        blocker.classList.remove("nochange");
                        blocker.classList.add("fadeout"); // looks nicer at top of storyDisp
                    }
                }
                scenebreak.style.setProperty(
                    "--end-color",
                    end_color.replace(
                        /rgba\(([^,]+,[^,]+,[^,]+),[^)]+\)/,
                        "rgb($1)",
                    ),
                ); // remove alpha component as scenebreak is solid.
                scenebreak.style.setProperty("--start-color", "rgba(0,0,0,0)"); // fade out from #0000 otherwise opacity will overlap
                scenebreak.style.background = `linear-gradient(${end_color},${end_color}), linear-gradient(rgb(0,0,0),rgb(0,0,0))`;
            }
            function addCurrentScene(requireBreak = false) {
                // do not add the scene if it has no children, is not an image, and is not full of blockers only.
                if (!scene) return;
                if (!scene.classList.contains("image")) {
                    if (scene.childElementCount == 1) return; // every scene has a scene-background
                    if (
                        // this might be an issue if theres a non-image scene with only cgitems
                        Array.from(scene.childNodes).every((n) =>
                            ["blocker", "scene-background"].some((c) =>
                                n.classList.contains(c),
                            ),
                        )
                    )
                        return;
                }
                // remove stray cgs because they like to put them immediately before [Image] in the script.
                if (
                    scene?.last_cmd?.cmd == "cgitem" &&
                    scene?.last_cmd?.args?.image
                ) {
                    // cgitem may not exist if it had ato=0 or something and was ignored.
                    scene.bg.cgImages[scene.last_cmd.args.image]?.remove();
                    delete scene.bg.cgImages[scene.last_cmd.args.image];
                }
                // remove stray blocker (add it to the next scene later)
                hangingBlocker = scene.querySelector(
                    ".blocker.fadeout:last-child",
                );
                if (hangingBlocker) hangingBlocker.remove();
                storyDiv.appendChild(scene);
                addSceneBreak(requireBreak);
                return scene;
            }
            function getWorkingScene() {
                if (!scene) {
                    scene = createScene([uri_background("bg_black")], {}, "");
                }
                return scene;
            }
            function addCurtain(fillfrom, fillto, direction) {
                // this some potential cases:
                // 1. curtains that don't start at 0
                // 2. segmented curtains, with gaps of transparency
                // 3. probably more I didn't think of
                const fade = 8; //pixels
                const dir = dirMap[direction];
                if (!dir) return;
                let f = fillfrom * 100;
                let t = fillto * 100;
                const c = activeCurtains[direction] || [0, 0];
                // if expanding (from < to), extend to max range
                if (f <= t) {
                    c[0] = Math.min(c[0], f);
                    c[1] = Math.max(c[1], t);
                } else {
                    // if shrinking (from > to), contract to that range
                    c[1] = t;
                }
                activeCurtains[direction] = c;
                if (c[1] <= c[0]) {
                    delete activeCurtains[direction];
                }
                activeCurtainsCSS = Object.entries(activeCurtains)
                    .map(
                        ([d, [a, b]]) =>
                            `linear-gradient(${dirMap[d]},black ${a}%,black ${b}%,transparent calc(${b}% + ${fade}px),transparent 100%)`,
                    )
                    .join(",");
            }

            function applyActiveCurtains() {
                if (activeCurtainsCSS && scene) {
                    scene.bg.style.setProperty("--curtains", activeCurtainsCSS);
                }
            }
            function resetCurtains() {
                activeCurtainsCSS = null;
                activeCurtains = {};
            }
            const easingMap = {
                // no idea if these are accurate they're from chatGPT lmao
                linear: "cubic-bezier(0.0, 0.0, 1.0, 1.0)",
                inquad: "cubic-bezier(0.55, 0.085, 0.68, 0.53)",
                outquad: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                inoutquad: "cubic-bezier(0.455, 0.03, 0.515, 0.955)",
                incubic: "cubic-bezier(0.55, 0.055, 0.675, 0.19)",
                outcubic: "cubic-bezier(0.215, 0.61, 0.355, 1.0)",
                inoutcubic: "cubic-bezier(0.645, 0.045, 0.355, 1.0)",
                inquart: "cubic-bezier(0.895, 0.03, 0.685, 0.22)",
                outquart: "cubic-bezier(0.165, 0.84, 0.44, 1.0)",
                inoutquart: "cubic-bezier(0.77, 0.0, 0.175, 1.0)",
                inquint: "cubic-bezier(0.755, 0.05, 0.855, 0.06)",
                outquint: "cubic-bezier(0.23, 1.0, 0.32, 1.0)",
                inoutquint: "cubic-bezier(0.86, 0.0, 0.07, 1.0)",
                inbounce: "cubic-bezier(0.8, 0, 1, 1)",
                outbounce: "cubic-bezier(0, 0, 0.2, 1)",
                inoutbounce: "cubic-bezier(0.8, 0, 0.2, 1)",
            };
            function applyTween(bg, options) {
                let xscalefrom = options.xscale ?? options.xscalefrom;
                let xfrom = options.xto ?? options.x ?? options.xfrom;
                let yfrom = options.yto ?? options.y ?? options.yfrom;

                // animate if duration is given.
                if (options.duration != null) {
                    const first = {};
                    const second = {};

                    if (options.xscaleto != null) {
                        first["--xscalefrom"] = Number(
                            options.xscalefrom ?? bg.xscalefrom ?? 1,
                        );
                        second["--xscalefrom"] = Number(options.xscaleto);
                    }

                    if (options.xto != null) {
                        first["--xfrom"] = Number(
                            options.xfrom ?? bg.xfrom ?? 0,
                        );
                        second["--xfrom"] = Number(options.xto);
                    }

                    if (options.yto != null) {
                        first["--yfrom"] = Number(
                            options.yfrom ?? bg.yfrom ?? 0,
                        );
                        second["--yfrom"] = Number(options.yto);
                    }
                    xscalefrom = second?.["--xscalefrom"] ?? xscalefrom;
                    xfrom = second?.["--xfrom"] ?? xfrom;
                    yfrom = second?.["--yfrom"] ?? yfrom;
                    // some are duration .01 or similar; skip the animation and set values immediately.
                    if (first && second && options.duration > 0.1) {
                        const anim = bg.animate([first, second], {
                            duration: 1000 * options.duration,
                            iterations: 1,
                            fill: "forwards",
                            easing: options.ease
                                ? easingMap[options.ease.toLowerCase()] ??
                                  "ease-in-out"
                                : "linear",
                        });
                        anim.pause();
                        bgAnimations.push(anim);
                        bg.parentElement.addEventListener(
                            "pointerenter",
                            (e) => {
                                bgAnimations.forEach((a) => a.pause());
                                anim.play();
                            },
                        );
                        bg.parentElement.addEventListener(
                            "pointerleave",
                            (e) => e.pointerType === "mouse" && anim.pause(),
                        );
                    }
                }
                if (xscalefrom != null) {
                    bg.style.setProperty("--xscalefrom", `${xscalefrom}`);
                    bg.xscalefrom = xscalefrom;
                }
                if (xfrom != null) {
                    bg.style.setProperty("--xfrom", `${xfrom}`);
                    bg.xfrom = xfrom;
                }
                if (yfrom != null) {
                    bg.style.setProperty("--yfrom", `${yfrom}`);
                    bg.yfrom = yfrom;
                }
            }
            function cloneScene(oldScene) {
                // used to add effects to a scene, not a perfect clone as stuff like .last_cmd is not preserved.
                // copy over everything from the old scene as the clone is not technically a new scene (according to the script)
                const [_imgurls, _options, _cmd] = oldScene.args;
                for (const key of ["xfrom", "yfrom", "xscalefrom"]) {
                    if (oldScene.bg[key] !== undefined)
                        _options[key] = oldScene.bg[key];
                }
                return createScene(_imgurls, _options, _cmd, true);
            }
            function appendCGItem(bg, key, cg) {
                if (key in bg.cgImages) {
                    // delete old one to prevent duplicates
                    bg.cgImages[key].remove();
                }
                bg.cgImages[key] = bg.appendChild(cg);
            }
            function createScene(imgurls, options, cmd, cloned = false) {
                freshScene = true;
                const isMultipart = imgurls.length !== 1;
                chars = {};
                speaker = 0;
                const newScene = document.createElement("div");
                newScene.classList.add("scene");
                newScene.args = Array.from(arguments);
                const bg = document.createElement("div");
                bg.classList.add("scene-background");
                bg.classList.add("top");
                const bgscale = document.createElement("div");
                bgscale.classList.add("bg-scale-wrap");
                bg.appendChild(bgscale);
                const bgimg = document.createElement("img");
                bgimg.classList.add("bgimg");
                bgscale.appendChild(bgimg);
                newScene.appendChild(bg);
                newScene.bg = bg;
                bg.cgImages = {};
                for (const key in floatingCGImages) {
                    appendCGItem(bg, key, floatingCGImages[key].cloneNode());
                }
                // mark as image to prevent pruning even if the scene is empty
                if (
                    !cloned &&
                    (options?.image || options?.imagegroup || options?.cggroup)
                )
                    newScene.classList.add("image");
                if (hangingBlocker) {
                    newScene.appendChild(hangingBlocker);
                    hangingBlocker = null;
                }
                if (preSceneAudios.length) {
                    for (a of preSceneAudios) newScene.appendChild(a);
                    preSceneAudios.length = 0;
                }
                newScene.backgroundPromise = prepareBackground(
                    imgurls,
                    options,
                );
                newScene.backgroundPromise.then(
                    ({ url: _img_url, naturalWidth, naturalHeight }) => {
                        alignBackground(newScene);
                        let dl_btn = document.createElement("i");
                        dl_btn.classList.add("fas");
                        dl_btn.classList.add("fa-external-link-alt");
                        dl_btn.classList.add("dlBtn");
                        var tempHideAll = null;
                        dl_btn.addEventListener("pointerenter", () => {
                            tempHideAll = setTimeout(
                                () => storyDiv.classList.add("bg_only"),
                                250,
                            );
                        });
                        dl_btn.addEventListener("pointerleave", () => {
                            clearTimeout(tempHideAll);
                            storyDiv.classList.remove("bg_only");
                        });
                        dl_btn.addEventListener("click", () => {
                            clearTimeout(tempHideAll);
                            window.open(_img_url, "_blank");
                        });
                        newScene.appendChild(dl_btn);
                        newScene.style.setProperty(
                            "--background-image-url",
                            `url("${_img_url}")`,
                        );
                    },
                );
                allScenes.push(newScene);
                return newScene;

                async function prepareBackground(imgUrls, options) {
                    let finalUrl;
                    const gameViewport = { width: 1280, height: 720 };
                    let naturalWidth = gameViewport.width;
                    let naturalHeight = gameViewport.height;
                    let dimsPromise = null;
                    let urlPromise = null;
                    let tileWidth = gameViewport.width;
                    let tileHeight = gameViewport.height;
                    if (!isMultipart) {
                        // single image: use it directly
                        finalUrl = imgUrls[0];
                        dimsPromise = new Promise((resolve) => {
                            bgimg.src = finalUrl;
                            bgimg.onload = () =>
                                resolve({
                                    width: bgimg.naturalWidth,
                                    height: bgimg.naturalHeight,
                                });
                        });
                    } else {
                        // multiple images: stitch on canvas
                        const w_split = options.solidwidth
                            .split("/")
                            .map((x) => Number(x.replace(",", "")));
                        const h_split = options.solidheight
                            .split("/")
                            .map((x) => Number(x.replace(",", "")));
                        const isGrid = w_split.length == h_split.length;
                        const cols = isGrid
                            ? Math.ceil(Math.sqrt(imgUrls.length))
                            : w_split.length;
                        const rows = isGrid ? cols : h_split.length;

                        tileWidth = options.solidwidth ? w_split[0] : tileWidth; // images[0].naturalWidth; can't use these as we no longer await image loading
                        tileHeight = options.solidheight
                            ? h_split[0]
                            : tileHeight;
                        naturalWidth = tileWidth * cols;
                        naturalHeight = tileHeight * rows;
                        const canvas = document.createElement("canvas");
                        canvas.width = naturalWidth;
                        canvas.height = naturalHeight;
                        const ctx = canvas.getContext("2d");
                        urlPromise = Promise.all(
                            imgUrls.map(
                                (url) =>
                                    new Promise((resolve) => {
                                        const img = new Image();
                                        img.crossOrigin = "anonymous";
                                        img.src = url;
                                        img.onload = () => resolve(img);
                                    }),
                            ),
                        )
                            .then((images) => {
                                for (let row = 0; row < rows; row++) {
                                    for (let col = 0; col < cols; col++) {
                                        const x = col * tileWidth;
                                        const y = row * tileHeight;
                                        ctx.drawImage(
                                            images[row * cols + col],
                                            x,
                                            y,
                                            tileWidth,
                                            tileHeight,
                                        );
                                    }
                                }
                            })
                            .then(
                                () =>
                                    new Promise((resolve) =>
                                        canvas.toBlob((blob) =>
                                            resolve(URL.createObjectURL(blob)),
                                        ),
                                    ),
                            );
                    }

                    if (isMultipart) {
                        bgimg.style.width = `${
                            (naturalWidth / gameViewport.width) * 100
                        }%`;
                    }

                    // full process is something like this:
                    // 0. multiply all following translates by the scale factor aka browser viewport width : 1280 (ingame viewport is 1280x720)
                    // 1. translate image so the top left subimage (if composite) is centered on the viewport, then translate by x/y
                    // 2. scale around the center of the IMAGE, not the viewport. (requires subtracting step 1 translate to transform-origin)
                    // 3. if background/coverall, scale so the image covers the ingame viewport (1280x720)
                    // currently I only focused on width so if there is an image with height>width this will likely break.

                    // half dims used to set transform-origin.
                    bg.style.setProperty(
                        "--halfWidth",
                        `${
                            isMultipart
                                ? naturalWidth / 2
                                : gameViewport.width / 2
                        }`,
                    );
                    bg.style.setProperty(
                        "--halfHeight",
                        `${
                            isMultipart
                                ? naturalHeight / 2
                                : gameViewport.height / 2
                        }`,
                    );
                    bg.style.setProperty(
                        "--totalScale",
                        `var(--fit-scale, 1) * var(--xscalefrom, 1)`,
                    );
                    // for single images these are just 1280 / 720 and cancel to 0.
                    bg.style.setProperty("--tileWidth", `${tileWidth}`);
                    bg.style.setProperty("--tileHeight", `${tileHeight}`);
                    applyTween(bg, options); // set CSS vars.
                    bg.style.setProperty(
                        "--xmod",
                        `((1280 - var(--tileWidth)) / 2 + var(--xfrom, 0))`,
                    );
                    bg.style.setProperty(
                        "--ymod",
                        `((720 - var(--tileHeight)) / 2 - var(--yfrom, 0))`,
                    );
                    // scaling to the browser's viewport, separate from game's scaling.

                    const coverall =
                        ["coverall", "showall"].includes(options.screenadapt) ||
                        (cmd == "background" && !options.xscalefrom); // force non-scaled backgrounds to coverall
                    const dims = await (dimsPromise ??
                        Promise.resolve({
                            width: naturalWidth,
                            height: naturalHeight,
                        }));
                    if (!isMultipart && !coverall)
                        bg.style.setProperty(
                            "--fit-scale",
                            `${Math.max(
                                1920 / dims.width,
                                1080 / dims.height, // this is probably wrong as it uses 1920x1080 instead of 1280x720, but it looks right.
                            )}`,
                        );
                    if (urlPromise) {
                        finalUrl = await urlPromise;
                        bgimg.src = finalUrl;
                    }
                    return {
                        naturalWidth: dims.width,
                        naturalHeight: dims.height,
                        url: finalUrl,
                    };
                }
            }
            function makeDecisionDialog(args) {
                let choices = args.options.split(";");
                let vals = args.values.split(";");

                vals = vals.slice(0, choices.length); // fixes some broken script files.
                let doctorSpeaking = !(CURRENT_STORY in DecisionNotDoctor);
                let dialog = makeDialog(
                    doctorSpeaking
                        ? {
                              name: `Dr. ${
                                  localStorage.getItem("docName") ||
                                  "{@nickname}"
                              }`,
                          }
                        : { name: "speaker" },
                    choices[0],
                    doctorSpeaking
                        ? { name: { name: "avg_npc_048" } }
                        : { name: { name: DecisionNotDoctor[CURRENT_STORY] } },
                    1,
                );
                // create predicate after making dialog or the dialog will be hidden.
                const predicate = {};
                vals.forEach((v) => (predicate[v] = []));
                predicateQueue.push(predicate);
                if (!doctorSpeaking)
                    dialog.querySelector(".avatar").classList.add("mystery");
                let txt = dialog.querySelector(".text");
                txt.innerHTML = "";
                txt.classList.add("doctor");
                choices.forEach((c, i) => {
                    let opt = document.createElement("div");
                    opt.classList.add("decision");
                    if (i == 0) opt.classList.add("selected");
                    opt.dataset.predicate = vals[i];
                    opt.innerHTML = c;
                    txt.append(opt);
                    opt.onclick = () => {
                        Array.from(txt.querySelectorAll(".decision")).forEach(
                            (el) => {
                                el.classList.remove("selected");
                            },
                        );
                        opt.classList.add("selected");
                        let thispredicate = opt.dataset.predicate;
                        Object.keys(predicate)
                            .sort((a, b) =>
                                a == thispredicate
                                    ? 1
                                    : b == thispredicate
                                    ? -1
                                    : 0,
                            )
                            .forEach((p) => {
                                predicate[p].forEach((el) => {
                                    p == thispredicate
                                        ? el.classList.remove("hidden")
                                        : el.classList.add("hidden");
                                });
                            });
                        scrollFunction(true); // changing decision can change scene sizes so clear cache
                    };
                });
                return dialog;
            }
            function makeDialog(
                args,
                dialogLine,
                chars,
                currentSpeaker,
                colorIndex = 0,
                type = null,
            ) {
                freshScene = false;
                applyActiveCurtains();
                let wrap = document.createElement("div");
                wrap.classList.add("dialog");
                wrap.classList.add("forceShow");
                if (type) wrap.classList.add(type);
                wrap.style.backgroundColor = lastBlockerColor.split(" ")[0];
                let left = document.createElement("div");
                left.classList.add("dialog-left");
                let right = document.createElement("div");
                right.classList.add("dialog-right");
                let nameplate = document.createElement("div");
                nameplate.classList.add("dialog-name");
                let txt = document.createElement("div");
                txt.classList.add("text");
                txt.dataset.name = "";
                txt.style.setProperty("--name-color", "#777");
                let blocktxt = document.createElement("div");
                blocktxt.innerHTML = dialogLine
                    .replace(/^(?:\\r\\n|\\r|\\n)+/, "")
                    .replace(/^(?:\\r\\n|\\r|\\n)+$/, "")
                    .replace(/\\r\\n|\\r|\\n/g, "<br />")
                    .replace(
                        /\{@nickname\}/gi,
                        localStorage.getItem("docName") || "{@nickname}",
                    );
                wordCount += countWords(blocktxt.innerHTML);
                txt.appendChild(blocktxt);
                wrap.appendChild(left);
                txt.prepend(nameplate);
                wrap.appendChild(txt);
                wrap.appendChild(right);
                if (args && args.name) {
                    txt.dataset.name = args.name;
                    nameplate.innerHTML = args.name;
                    txt.style.setProperty(
                        "--name-color",
                        selectColor(colorIndex),
                    );
                    let all_speaking = currentSpeaker == 99;
                    Object.keys(chars)
                        .sort()
                        .forEach((key, i) => {
                            if (chars[key].name != "char_empty") {
                                let isActive =
                                    all_speaking ||
                                    (currentSpeaker == 1 && key == "name") ||
                                    key == "name" + currentSpeaker;
                                let avatar = avatarImg(
                                    chars[key],
                                    key === "avg",
                                );
                                if (isActive) {
                                    avatar.classList.add("active");
                                    txt.classList.add("active");
                                }
                                if (all_speaking) {
                                    if (left.childElementCount == 0)
                                        left.appendChild(avatar);
                                    else right.appendChild(avatar);
                                } else {
                                    if (isActive) left.appendChild(avatar);
                                    else right.appendChild(avatar);
                                }
                            }
                        });
                }
                // balance out avatars if too many inactive.
                if (
                    left.childElementCount == 0 &&
                    right.childElementCount > 1
                ) {
                    left.appendChild(right.firstChild);
                }
                // handle active predicates
                if (predicateQueue.length) {
                    let predicate = predicateQueue.slice(-1)[0];
                    activeReferences.forEach((r) => {
                        if (r in predicate)
                            //sanity check
                            predicate[r].push(wrap);
                    });
                    if (!activeReferences.includes(Object.keys(predicate)[0]))
                        wrap.classList.add("hidden");
                }

                return wrap;
            }
            function endMultiLine() {
                let spkr = multiLineData.args.name.toLowerCase();
                speakerList.add(spkr);
                let dlg = makeDialog(
                    multiLineData.args,
                    multiLineData.dialog,
                    multiLineData.chars,
                    multiLineData.speaker,
                    Array.from(speakerList).indexOf(spkr),
                );
                getWorkingScene().appendChild(dlg);
                multiLineData = {};
            }
            function closeDanglingDirectives() {
                // call this in places where a dialog/scene/whatever *should* be finished but may not be marked as so in the script
                if (Object.keys(multiLineData).length !== 0) endMultiLine();
            }
            for (const line of lines) {
                [_, _cmd, _args] = line[1]
                    ? /\[\s*?(?:([^=\(\]]+)(?=[\(\]])\(?)?([^\]]*?)\)?\s*?\]/.exec(
                          line[1],
                      )
                    : [null, null, null];
                // really gross but I need these to be const
                const cmd = _cmd?.toLowerCase();
                const args = _args
                    ? Object.fromEntries(
                          Array.from(
                              _args.matchAll(
                                  /("?[^=", ]+"?)\s*=\s*"?((?<=")[^"]*|[^,]*)/gim,
                              ),
                          ).map((l) => [l[1].toLowerCase(), l[2]]),
                      )
                    : null;
                if (
                    line[1] &&
                    args &&
                    "name" in args &&
                    line[2] &&
                    line[2].trim() &&
                    !cmd
                ) {
                    closeDanglingDirectives();
                    // group 1&2 indicates dialog with speaker.
                    speakerList.add(args.name.toLowerCase());
                    let dlg = makeDialog(
                        args,
                        line[2],
                        chars,
                        speaker,
                        Array.from(speakerList).indexOf(
                            args.name.toLowerCase(),
                        ),
                    );
                    getWorkingScene().appendChild(dlg);
                } else if (line[1] && cmd) {
                    // group 1 alone indicates stage direction
                    // check for dangling multilines (and potentially other dialog features) at the end of the file or otherwise:
                    // this list is surely missing some directives...
                    if (
                        (!args && ["dialog", "charslot"].includes(cmd)) ||
                        [
                            "image",
                            "background",
                            "largebg",
                            "sticker",
                            "blocker",
                            "predicate",
                            "video",
                        ].includes(cmd)
                    )
                        closeDanglingDirectives();
                    switch (cmd) {
                        case "cgitem":
                            // very basic implementation, these are meant to be animated.
                            // ato and afrom are ignored atm
                            if (!args || !args.image || !args.layer) break;
                            if (Number(args?.ato) === 0) break; // ignore "ending" cgs, hopefully they are correctly remove with [hidecgitem]
                            scene = getWorkingScene();
                            let cg = document.createElement("img");
                            cg.classList.add("cgitem");
                            cg.src = uri_item_image(args.image);
                            let x = 0;
                            let y = 0;
                            if (args.pfrom)
                                [x, y] = args.pfrom.split(",").map(Number);
                            cg.style.left = "50%";
                            cg.style.bottom = 0;
                            cg.style.zIndex = Number(args.layer);
                            cg.style.transform = `translate(-50%, 0) \
                            translate(calc(${x} * var(--story-scale)), calc(${y} * var(--story-scale))) \
                            scale(calc(var(--story-scale-unitless) * ${
                                Number(args?.sfrom) ? Number(args.sfrom) : 1
                            }))`;
                            cg.style.transformOrigin = "center bottom";
                            floatingCGImages[args.image] = cg;
                            appendCGItem(scene.bg, args.image, cg);
                            break;
                        case "hidecgitem":
                            if (args.image) {
                                delete floatingCGImages[args.image];
                            } else {
                                floatingCGImages = {};
                            }
                            break;
                        case "showitem":
                            imgCount += 1;
                            let wrap = document.createElement("div");
                            wrap.classList.add("dialog");
                            let btn_wrap = document.createElement("div");
                            btn_wrap.classList.add("itemBtn");
                            let imgbtn = document.createElement("i");
                            imgbtn.classList.add("fas");
                            imgbtn.classList.add("fa-image");
                            btn_wrap.appendChild(imgbtn);
                            const itemsrc = args.is_module
                                ? uri_uniequip(args.image)
                                : uri_item_image(args.image);
                            let label = document.createElement("span");
                            label.classList.add("fileName");
                            label.innerHTML = `${
                                itemsrc.split("/").pop().split(".")[0]
                            }`;
                            btn_wrap.appendChild(label);
                            wrap.appendChild(btn_wrap);
                            btn_wrap.onclick = () => {
                                enlargeAvatar([itemsrc], true);
                            };
                            getWorkingScene().appendChild(wrap);
                            break;
                        case "moduleimage":
                        case "background":
                        case "largebg":
                        case "verticalbg":
                        case "gridbg":
                            if (
                                ["gridbg", "verticalbg", "largebg"].includes(
                                    cmd,
                                ) &&
                                (!args || (!args.imagegroup && !args.cggroup))
                            )
                                break;
                        case "roguebackground":
                        case "image":
                            if (
                                ["image", "background"].includes(cmd) &&
                                (!args || !args.image)
                            )
                                break;
                            // insert new div when background changes and set to current scene
                            let wasDisplayingImage = false;
                            if (scene) {
                                wasDisplayingImage =
                                    scene.classList.contains("image");
                                addCurrentScene();
                            }
                            let imgurls = [uri_background("bg_black")];
                            switch (cmd) {
                                case "image":
                                    if (!args || !args.image) {
                                        if (
                                            wasDisplayingImage &&
                                            lastBackgroundImage.length
                                        ) {
                                            // remove image, revert to prev background
                                            imgurls = lastBackgroundImage;
                                        }
                                        break;
                                    }
                                    imgurls = [uri_image(args.image)];
                                    break;
                                case "background":
                                    imgurls = [uri_background(args.image)];
                                    lastBackgroundImage = imgurls;
                                    break;
                                case "largebg":
                                case "gridbg":
                                case "verticalbg":
                                    imgurls = args.imagegroup
                                        ? args.imagegroup
                                              .split("/")
                                              .map((x) => uri_background(x))
                                        : // args.cggroup instead:
                                          args.cggroup
                                              .split("/")
                                              .map((x) => uri_image(x));
                                    lastBackgroundImage = imgurls;
                                    break;
                                case "moduleimage":
                                    imgurls = [uri_uniequip(args.image)];
                                    break;
                                case "roguebackground":
                                    imgurls = [uri_image(args.image)];
                                    break;
                            }
                            scene = createScene(imgurls, args, cmd);
                            break;
                        case "character":
                            if (args) {
                                speaker = parseInt(args.focus) || 1; // set to 1 if focus key doesnt exist.
                                chars = {};
                                let current = null;
                                Object.keys(args).forEach((k) => {
                                    if (k.startsWith("name")) {
                                        chars[k] = { name: args[k] };
                                        current = k;
                                    }
                                    if (current) {
                                        chars[current][k] = args[k];
                                    }
                                });
                            } else {
                                chars = {};
                                speaker = 0;
                            }
                            break;
                        case "charslot": // new format (replaces "character")
                            if (args) {
                                speaker =
                                    CharslotFocusMap[args.focus] ||
                                    CharslotNameMap[args.slot]; // ( this may not be correct for this new format, maybe setting to 1 is still correct )
                                if (args.name) {
                                    // delete other instances of this name in chars to prevent duplicated chars
                                    const basename = (name) =>
                                        name.split("#")[0].split("$")[0];
                                    let _name = basename(args.name);
                                    for (let _key in chars) {
                                        if (
                                            basename(chars[_key]?.name) == _name
                                        )
                                            delete chars[_key];
                                    }
                                    chars[`name${CharslotNameMap[args.slot]}`] =
                                        args;
                                }
                            } else {
                                chars = {};
                                speaker = 0;
                            }
                            break;
                        case "multiline": // text appears in multiple parts (as the reader taps)
                            if (args && args?.name !== undefined && line[2]) {
                                multiLineData.dialog =
                                    (multiLineData?.dialog || "") + line[2];
                                multiLineData.args = multiLineData?.args || {
                                    ...args,
                                };
                                multiLineData.chars = multiLineData?.chars || {
                                    ...chars,
                                };
                                multiLineData.speaker =
                                    multiLineData?.speaker || speaker;
                                if (args.end) {
                                    endMultiLine();
                                }
                            }
                            break;
                        case "animtext":
                            if (line[2]) {
                                let html = line[2]
                                    .replace(
                                        /<p\s*=\s*(\d+)\s*>/g,
                                        '<p data-lvl="$1">',
                                    )
                                    .replace(/<\/p\s*=\s*\d+\s*>/g, "</p>");
                                let dlg = makeDialog(
                                    null,
                                    html,
                                    {},
                                    0,
                                    0,
                                    "animtext",
                                );
                                getWorkingScene().appendChild(dlg);
                            }
                            break;
                        case "title":
                        case "div":
                            // [Title] and [Div] used exclusively in IS2 monthlies (for now, hopefully that won't change.)
                            if (line?.[2]) {
                                let dlg = makeDialog(
                                    null,
                                    line[2],
                                    {},
                                    0,
                                    0,
                                    "subtitle",
                                );
                                getWorkingScene().appendChild(dlg);
                            }
                        case "sticker":
                        case "subtitle":
                            // chars = {};
                            // speaker = 0;
                            if (args && args.text) {
                                let dlg = makeDialog(
                                    null,
                                    args.text,
                                    {},
                                    0,
                                    0,
                                    "subtitle",
                                );
                                getWorkingScene().appendChild(dlg);
                            }
                            break;
                        case "dialog":
                            // chars = {};
                            // speaker = 0;
                            // predicateQueue.pop();
                            // referenceQueue.pop();
                            // activeReferences = referenceQueue.at(-1) ?? [];

                            // this is specific to IS#2 monthly records:
                            if (args && args.head) {
                                speaker = 99; // need to set to 99 instead of 1 to bypass isActive check in makeDialog
                                chars = {
                                    avg: { name: args.head },
                                };
                                speakerList.add(chars.avg.name.toLowerCase());
                                let dlg = makeDialog(
                                    {
                                        name:
                                            operatorData[chars.avg.name].name ||
                                            operatorData[chars.avg.name]
                                                .appellation,
                                    },
                                    line[2],
                                    chars,
                                    speaker,
                                    Array.from(speakerList).indexOf(
                                        chars.avg.name.toLowerCase(),
                                    ),
                                );
                                getWorkingScene().appendChild(dlg);
                            }
                            break;
                        case "decision":
                            getWorkingScene().appendChild(
                                makeDecisionDialog(args),
                            );
                            // activeReferences = []; // should be no need for this
                            break;
                        case "predicate":
                            if (!args) {
                                predicateQueue.pop();
                                referenceQueue.pop();
                                activeReferences = referenceQueue.at(-1) ?? [];
                            } else {
                                activeReferences = args.references.split(";");
                                if (
                                    referenceQueue.length ==
                                    predicateQueue.length
                                )
                                    referenceQueue.pop();
                                referenceQueue.push(activeReferences);
                                if (!predicateQueue.length) {
                                    // if there is an error in the script, predicate (below) will be undefined.
                                    // in this case we assign these predicates to the previous decision
                                    predicateQueue.push(lastPredicate);
                                }
                                // let predicate = predicateQueue.slice(-1)[0];
                                // if (
                                //     activeReferences.length >=
                                //     Object.keys(predicate).length
                                // ) {
                                // contains all predicates, indicating end of decision tree.
                                // do NOT pop predicateQueue here as this will break nested decisions, instead assume that [Dialog] or [Decision] marks the end of any decision tree
                                // lastPredicate = predicateQueue.pop();
                                // activeReferences.length = 0;
                                // }
                            }
                            break;
                        case "playmusic":
                        case "playsound":
                            const audio = document.createElement("audio");
                            let audioWrapper;
                            audio.setAttribute("controls", "");
                            if (cmd == "playmusic") {
                                audio.setAttribute("loop", "");
                                audio.classList.add("music");
                                allMusic.push(audio);
                            } else {
                                audio.classList.add("sound");
                            }
                            audio.dataset.defvol =
                                Math.min(args.volume, 1) || 0.8;

                            let sound = document.createElement("source");
                            let soundkey = /\$?(.+)/i.exec(args.key)[1];
                            let soundpath = soundMap[soundkey] || soundkey;
                            sound.src = uri_sound(soundpath);
                            sound.setAttribute("type", "audio/mp3");
                            audio.appendChild(sound);

                            sound = document.createElement("source");
                            sound.src = uri_sound(
                                soundpath,
                                ASSET_SOURCE.ACESHIP,
                            );
                            sound.setAttribute("type", "audio/wav");
                            audio.appendChild(sound);

                            if (cmd == "playsound") {
                                let btn_wrap = document.createElement("div");
                                btn_wrap.classList.add("soundBtn");
                                let btn = document.createElement("i");
                                btn.classList.add("fas");
                                btn.classList.add("fa-volume-up");
                                let label = document.createElement("span");
                                label.classList.add("fileName");
                                label.innerHTML = `${soundpath
                                    .split("/")
                                    .pop()}`;
                                audioWrapper = document.createElement("div");
                                audioWrapper.style.backgroundColor =
                                    lastBlockerColor.split(" ")[0];
                                function playFunc() {
                                    audio.volume =
                                        (volSlider.value / 100) *
                                        audio.dataset.defvol;
                                    // if (audio.volume == 0) audio.volume = 0.5;
                                    if (audio.readyState == 0) {
                                        audio.nextSibling.classList.add(
                                            "stalled",
                                        );
                                        audio.oncanplaythrough = () =>
                                            audio.nextSibling.classList.remove(
                                                "stalled",
                                            );
                                        audio.oncanplay = () =>
                                            audio.nextSibling.classList.remove(
                                                "stalled",
                                            );
                                    }
                                }
                                audio.addEventListener("play", playFunc);
                                audio.onplaying = () =>
                                    audio.nextSibling.classList.add("playing");
                                audio.onended = () =>
                                    audio.nextSibling.classList.remove(
                                        "playing",
                                    );
                                audio.onpause = () =>
                                    audio.nextSibling.classList.remove(
                                        "playing",
                                    );
                                btn_wrap.addEventListener("click", () => {
                                    if (audio.paused) {
                                        audio.play();
                                    } else {
                                        audio.pause();
                                        audio.currentTime = 0;
                                    }
                                    // remove from soundqueues
                                    for (const q of [
                                        soundQueue,
                                        longSoundQueue,
                                    ]) {
                                        var i = q.length;
                                        while (i--) {
                                            if (q[i] == audio) {
                                                q.splice(i, 1);
                                            }
                                        }
                                    }
                                });
                                audioWrapper.appendChild(audio);
                                btn_wrap.appendChild(btn);
                                btn_wrap.appendChild(label);
                                audioWrapper.appendChild(btn_wrap);
                                audioWrapper.classList.add("dialog");
                                audioWrapper.classList.add("soundPlayer");
                                audioWrapper.audio = audio;
                                audioWrapper.btn = btn;
                                allSoundButtons.push(audioWrapper);
                            }
                            if (scene) {
                                scene.appendChild(audioWrapper || audio);
                            } else {
                                preSceneAudios.push(audioWrapper || audio);
                            }
                            break;
                        case "blocker":
                            // responsible for fade effects/fade to black for certain lines
                            if (args && "fadetime" in args)
                                addBlocker(lastBlockerColor, args);
                            break;
                        case "video":
                            let embed = document.createElement("video");
                            embed.src = uri_video(args.res);
                            embed.controls = true;
                            embed.preload = "none";

                            // Replace file extension with '_poster.jpg'
                            embed.poster = embed.src.replace(
                                /\.[^/.]+$/,
                                "_poster.jpg",
                            );

                            let s = getWorkingScene();
                            s.appendChild(embed);
                            s.classList.add("video");
                            break;

                        case "imagetween":
                        case "backgroundtween":
                        case "largebgtween":
                            if (freshScene) applyTween(scene.bg, args);
                            else if (scene) {
                                addCurrentScene();
                                scene = cloneScene(scene);
                                applyTween(scene.bg, args);
                            }
                            break;
                        case "curtain":
                            if (
                                args?.fillto != null &&
                                args?.fillfrom != null &&
                                args?.direction != null
                            ) {
                                if (
                                    activeCurtainsCSS &&
                                    scene &&
                                    !(scene?.last_cmd?.cmd == "curtain")
                                ) {
                                    addCurrentScene();
                                    scene = cloneScene(scene);
                                    scene.last_cmd = { cmd, args }; // set last_cmd so it can chain for multiple curtains.
                                }
                                addCurtain(
                                    Number(args.fillfrom),
                                    Number(args.fillto),
                                    Number(args.direction),
                                );
                            } else resetCurtains(); // [curtain] clears all active curtains.
                            break;
                        case "header":
                        case "delay":
                        case "characteraction":
                        case "charactercutin":
                        case "camerashake":
                        case "cameraeffect":
                        // grayscale
                        case "fadetime":
                        case "soundvolume":
                        case "musicvolume":
                        case "stopmusic":
                        case "stopsound":
                        case "skiptothis":
                        case "gotopage":
                        case "hideitem":
                        case "startbattle":
                        case "tutorial":
                        case "theater":
                        // new after QB:
                        case "effect":
                        case "bgeffect":
                        case "stickerclear":
                        case "skipnode":
                        case "animtextclean":
                        case "interlude":
                        // vfx
                        case "focusout":
                        case "focusin":
                        case "warp":
                        case "timersticker":
                        //on-screen timer (runs in real time)
                        case "timerclear":
                        case "imagerotate":
                            // this can be handled and even animated in applyTween
                            // but it's almost always a fade out in game and ends up looking jank in the reader
                            break;
                        default:
                            console.log("line not parsed:", line);
                            break;
                    }
                } else if (line[2] && !line[2].trim().startsWith("//")) {
                    closeDanglingDirectives();

                    // group 2 alone indicates speakerless text (narrator)
                    let dlg = makeDialog(null, line[2], {}, 0);
                    dlg.classList.add("narration");
                    getWorkingScene().appendChild(dlg);
                }
                if (scene && cmd) {
                    // prevent preemptive curtains from being applied to the "previous" scene
                    // these directives indicate an "active" scene (stuff is happening)
                    // makeDialog also applies curtains and covers most cases.
                    // maybe should include all tween/rotate directives too...
                    if (
                        [
                            "blocker",
                            "delay",
                            "image",
                            "showitem",
                            "playsound",
                            "playmusic",
                            "focusout",
                            "focusin",
                            "timersticker",
                            "camerashake",
                            "cameraeffect",
                        ].includes(cmd)
                    ) {
                        applyActiveCurtains();
                    }
                    scene.last_cmd = { cmd, args };
                }
            }
            addCurrentScene(true);
            Promise.all(allScenes.map((scene) => scene.backgroundPromise)).then(
                () => {
                    clearOffsetCache();
                    realMidpoint = adjustedMidpoint();
                    autoPlayPoint = autoPlayMidPoint();
                    allScenes.forEach((s) => {
                        alignBackground(s);
                    });
                },
            );
            let readTimeMinutes = Math.round(
                wordCount / 400 + (imgCount * 12) / 60,
            );
            if (serverString == SERVERS.EN)
                readTimeMinutes = Math.round(
                    wordCount / 250 + (imgCount * 12) / 60,
                );
            if (readTimeMinutes)
                readTime.innerHTML = `${readTimeMinutes} min read`;
            else readTime.innerHTML = `<1 min read`;
        });
}
function playWhenReady(audio) {
    if (audio.classList.contains("music")) {
        audio.onplaying = () => {
            musicState.paused = false;
            document.getElementById("playPauseBtn").innerHTML =
                '<i class="fas fa-pause"></i>';
        };
    }
    function playOrSilentlyFailIfNoInteraction() {
        audio.play().catch((err) => {
            if (err.name != "NotAllowedError") throw err;
        });
    }
    if (audio.readyState > 3) {
        // already ready to play
        playOrSilentlyFailIfNoInteraction();
    } else {
        audio.oncanplaythrough = playOrSilentlyFailIfNoInteraction;
        audio.oncanplay = playOrSilentlyFailIfNoInteraction;
    }
}

function completeCharPath(path) {
    let hasHash = /#(\d+)(\$\d+)?$/.test(path);
    let hasDollar = /\$(\d+)$/.exec(path); // [1] is the num
    if (!hasDollar) {
        if (!hasHash) {
            path += "#1$1";
        } else {
            path += "$1";
        }
    } else if (!hasHash) {
        path = path.replace(/\$\d+$/, "#1$" + hasDollar[1]);
    }
    return path;
}
function avatarImg(data, isAvatar = false) {
    // return image element with many, many fallbacks.
    path = data.name;
    path = path.trim(); //.toLowerCase();
    let varkey = /\$?(.+)/i.exec(path)[1];
    if (varkey in soundMap) {
        path = soundMap[varkey];
    }
    let [id, iface, ibody] = /^(.*?)(?:#(\d+))?(?:\$(\d+))?$/
        .exec(path)
        .splice(1);
    face = (iface || "1").replace(/^0+/, "");
    body = (ibody || "1").replace(/^0+/, "");
    const full_name = `${id}#${face}$${body}`;
    let src_array = [
        full_name, // ID, Face, and Body
        `${id}#${face}`, // ID and Face
        `${id}$${body}`, // ID and Body
        // `${id}_${face}`, // ID and Face (with underscore)
        `${id}`, // Only ID
    ];

    // set first element to given path
    src_array = src_array.filter((item) => item !== path);
    src_array.unshift(path);

    src_array = src_array.map((item) =>
        uri_character(encodeURIComponent(item), ASSET_SOURCE.ACESHIP),
    );
    src_array.splice(
        1,
        0,
        uri_character(encodeURIComponent(full_name), ASSET_SOURCE.ARKWAIFU),
    );
    src_array.unshift(uri_character(encodeURIComponent(full_name))); // put internal path second
    src_array.unshift(
        `${DATA_SOURCE_LOCAL}thumbs/${encodeURIComponent(
            full_name,
        ).toLowerCase()}.webp`,
    ); // put thumb path first

    if (isAvatar) {
        // only used in is#2 stories
        src_array = [
            uri_avatar(encodeURIComponent(path)),
            uri_character(encodeURIComponent(`${path}#1$1`)),
            uri_character(encodeURIComponent(`${path}_1#1$1`)),
            uri_character(
                encodeURIComponent(`${path.replace(/^char_/, "avg_")}#1$1`),
            ),
            uri_character(
                encodeURIComponent(`${path.replace(/^char_/, "avg_")}_1#1$1`),
            ),
        ];
    }
    const img = document.createElement("img");
    var i = 1;
    img.onerror = function () {
        if (i < src_array.length) {
            this.src = src_array[i];
            this.parentElement.classList.remove("initial");
            i++;
        } else {
            this.onerror = null;
            this.src = uri_avatar("avg_npc_012");
            this.parentElement.classList.remove("npc");
            this.parentElement.classList.add("unknown");
            console.log("ALL ERROR (serve mystery npc)", src_array);
        }
    };
    img.setAttribute("loading", "lazy");
    let coords = {
        x: -205,
        y: 0,
        s: 0.5,
        a: 0,
    };
    img.style.left = coords.x;
    img.style.top = coords.y;
    img.style.transform = `scale(${coords.s})`;
    img.src = src_array[0];

    // add effects:
    if (data.ato) img.style.opacity = data.ato;
    const bstart = data.bstart ?? data.blackstart ?? data.blackstart2 ?? 0;
    const bend = data.bend ?? data.blackend ?? data.blackend2 ?? 0;
    if (bend > 0) img.style.filter = "brightness(0)";
    let wrap = document.createElement("div");
    wrap.classList.add("avatar");
    wrap.classList.add("npc");
    wrap.classList.add("initial");
    wrap.appendChild(img);
    wrap.onclick = (e) => {
        // e.stopPropagation();
        if (!wrap.classList.contains("unknown")) {
            if (wrap.classList.contains("initial")) {
                enlargeAvatar(src_array.slice(1), false, bstart, bend);
            } else {
                enlargeAvatar([img.src], false, bstart, bend);
            }
        }
    };
    return wrap;
}

const avatarModal = document.getElementById("avatarModal");
window.addEventListener("click", (e) => {
    if (e.target == avatarModal) avatarModal.classList.remove("show");
});
function enlargeAvatar(src_array, cover = false, bstart = 0, bend = 0) {
    avatarModal.classList.remove("unknown");
    avatarModal.classList.add("show");
    let content = avatarModal.querySelector(".modal-content");
    content.innerHTML = "";
    const im = document.createElement("img");
    im.src = src_array[0];
    let i = 1;
    im.onerror = function () {
        if (i < src_array.length) {
            this.src = src_array[i];
            i++;
        } else {
            this.onerror = null;
            im.classList.contains("item")
                ? (this.src = uri_item("MTL_SL_G2"))
                : (this.src = uri_character(
                      encodeURIComponent("avg_npc_012#1$1"),
                  ));
            this.parentElement.classList.add("unknown");
        }
    };
    if (cover) im.classList.add("item");
    if (bend > 0) {
        const black = im.cloneNode();
        black.classList.add("black");
        content.appendChild(black);
        content.style.setProperty("--bstart", bstart);
        content.style.setProperty("--bend", bend);
    }
    content.appendChild(im);
    let dl_btn = document.createElement("i");
    dl_btn.classList.add("fas");
    dl_btn.classList.add("fa-external-link-alt");
    dl_btn.classList.add("dlBtn");
    content.appendChild(dl_btn);
    dl_btn.addEventListener("click", function () {
        window.open(im.src);
    });
}

//Get the button:
mybutton = document.getElementById("topBtn");
mybutton.onclick = topFunction;
titlediv = document.getElementById("storyTitle");
topNav = document.querySelector("#topNav");

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = scrollFunction;
window.onresize = () => scrollFunction(true);
function adjustedMidpoint() {
    topNavHeight = getOffsets(topNav).offsetHeight;
    return window.innerHeight / 2 + topNavHeight / 2;
}
function autoPlayMidPoint() {
    // when sounds are scrolled past this point, begin autoplay, for now just use 1/2 down the page.
    return realMidpoint;
    // topNavHeight =
    //     topNavHeight || document.querySelector("#topNav").offsetHeight;
    // return window.innerHeight * 0.3 + topNavHeight / 2;
}
function alignBackground(s) {
    const realimheight = getOffsets(s.bg).offsetHeight;
    // skip getViewportTop as scene.offsetTop is equivalent
    const sceneTop = getOffsets(s).offsetTop - window.scrollY;
    const sceneBottom = sceneTop + getOffsets(s).offsetHeight;
    s.classList.remove("top", "bottom", "fixed");
    if (sceneTop > realMidpoint - realimheight / 2) {
        s.classList.add("top");
    } else if (sceneBottom < realimheight / 2 + realMidpoint) {
        s.classList.add("bottom");
    } else {
        s.classList.add("fixed");
    }
}
document.getElementById("playPauseBtn").onclick = () => playPauseMusic(true);
const musicState = { paused: true };
function playPauseMusic(toggle = false) {
    let targetMusic = allMusic[0];
    allMusic.forEach((a) => {
        if (getViewportTop(a) < autoPlayPoint) {
            targetMusic = a;
        }
    });
    if (targetMusic) {
        targetMusic.volume =
            (volSlider.value / 100) * targetMusic.dataset.defvol;
        if (toggle) {
            if (musicState.paused) playWhenReady(targetMusic);
            else {
                allMusic.forEach((a) => a.pause());
                musicState.paused = true;
                document.getElementById("playPauseBtn").innerHTML =
                    '<i class="fas fa-play"></i>';
            }
        } else if (targetMusic.paused && !musicState.paused) {
            allMusic.forEach((a) => a.pause());
            playWhenReady(targetMusic);
        }
    }
}
function autoPlaySounds() {
    allSoundButtons.every((container) => {
        let soundTop = getViewportTop(container);
        if (
            soundTop < autoPlayPoint ||
            document.body.scrollTop >
                getOffsets(document.body).offsetHeight -
                    window.innerHeight -
                    topNavHeight
        ) {
            // if scrolled past midpoint OR reached end of story (to make sure the final few sounds get played.)
            if (container.audio.alreadyQueued) return true;
            if (!container.audio.paused) return true;
            if (soundTop < 0) return true;
            const q =
                container.audio.duration > shortAudioMaxLen
                    ? longSoundQueue
                    : soundQueue;
            if (q.length >= q.max_size) return true;
            container.audio.alreadyQueued = true;
            q.push(container.audio);
            // if user manually pauses a sound, the next in queue will not be played until the user scrolls (this method is called again)
            container.audio.addEventListener(
                "ended",
                () => {
                    q.shift();
                    while (q.length && q[0].paused) {
                        q[0].play().catch((err) => {
                            q.shift();
                        });
                    }
                },
                {
                    once: true,
                },
            );
            return true;
        }
        return false;
    });
    for (const q of [soundQueue, longSoundQueue]) {
        // cancel sounds if user scrolled away from their scene.
        let disp_top = document.body.scrollTop + topNavHeight; // top of the screen (below topnav)
        let disp_bot = document.body.scrollTop + window.innerHeight;
        var i = q.length;
        while (i--) {
            let scene = q[i].parentElement.parentElement;
            let scene_top = getOffsets(scene).offsetTop;
            let scene_bot = scene_top + getOffsets(scene).offsetHeight;
            if (
                scene_top > disp_bot + realMidpoint ||
                scene_bot < disp_top - realMidpoint
            ) {
                q[i].pause();
                q[i].currentTime = 0;
                q.splice(i, 1);
            }
        }
        // start playing next sound in queue
        while (q.length && q[0].paused) {
            q[0].play().catch((err) => {
                q.shift();
            });
        }
    }
}
var scheduledAnimationFrame;
function _throttled_scroll_func() {
    realMidpoint = adjustedMidpoint();
    autoPlayPoint = autoPlayMidPoint();
    if (
        document.body.scrollTop > topNavHeight ||
        document.documentElement.scrollTop > topNavHeight
    ) {
        mybutton.style.display = "block";
    } else {
        mybutton.style.display = "none";
    }
    titleBottomPos =
        titleBottomPos ||
        (storyNameDiv
            ? getOffsets(storyNameDiv).offsetHeight +
              getOffsets(storyNameDiv).offsetTop
            : 0);
    if (
        document.body.scrollTop > titleBottomPos - topNavHeight ||
        document.documentElement.scrollTop > titleBottomPos - topNavHeight
    ) {
        titlediv.classList.remove("hidden");
        topNav.classList.add("showStoryTitle");
    } else {
        titlediv.classList.add("hidden");
        topNav.classList.remove("showStoryTitle");
    }
    allScenes.forEach((s) => {
        alignBackground(s);
    });
    if (document.body.scrollTop > 0 && enableSoundAutoplay) autoPlaySounds();
    playPauseMusic();
    scheduledAnimationFrame = false;
}
function scrollFunction(bustCache = false) {
    if (scheduledAnimationFrame) return;
    scheduledAnimationFrame = true;
    requestAnimationFrame(() => {
        if (bustCache) clearOffsetCache();
        return _throttled_scroll_func();
    });
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

const volSlider = document.getElementById("volSlider");
volSlider.oninput = () => {
    allMusic.forEach((a) => {
        a.volume = (volSlider.value / 100) * a.dataset.defvol;
    });
    playPauseMusic();
};

const toggleVisBtn = document.getElementById("visButton");
var tempHideAll = null;
toggleVisBtn.addEventListener("pointerenter", () => {
    tempHideAll = setTimeout(() => storyDiv.classList.add("bg_only"), 250);
});

toggleVisBtn.addEventListener("pointerleave", () => {
    clearTimeout(tempHideAll);
    storyDiv.classList.remove("bg_only");
});

toggleVisBtn.addEventListener("click", () => {
    clearTimeout(tempHideAll);
    storyDiv.classList.remove("bg_only");
});
var dialogVisibilityState = 0;
toggleVisBtn.onclick = () => {
    dialogVisibilityState = (dialogVisibilityState + 1) % 3;
    let icon = toggleVisBtn.querySelector("i");
    icon.classList.remove("fa-eye-slash");
    icon.classList.remove("fa-eye");
    icon.classList.remove("fa-low-vision");
    document
        .getElementById("storyDisp")
        .setAttribute("display-mode", dialogVisibilityState);
    switch (dialogVisibilityState) {
        case 0:
            // show all
            icon.classList.add("fa-eye");
            break;
        case 1:
            // hide sfx only
            icon.classList.add("fa-eye-slash");
            break;
        case 2:
            // hide dialogs and sfx
            icon.classList.add("fa-low-vision");
            break;
    }
    scrollFunction(true); // changing to mode 1 will change scene sizes so clear cache
};
const toggleSfxBtn = document.getElementById("sfxButton");
toggleSfxBtn.onclick = () => {
    enableSoundAutoplay ^= 1;
    let icon = toggleSfxBtn.querySelector("i");
    icon.classList.toggle("fa-volume-up");
    icon.classList.toggle("fa-volume-mute");
};
const isFirefox = typeof InstallTrigger !== "undefined";
function updateStoryWidth() {
    const topNavHeight = getOffsets(topNav).offsetHeight;
    const vw = window.innerWidth,
        vh = window.innerHeight;
    const vmin = Math.min(vw, vh);

    const storyWidth = Math.min(
        ((vmin - topNavHeight) * 16) / 9,
        vw - scrollbarWidth,
        1920,
    );
    const storyBgWidth = Math.min(storyWidth, ((vh - topNavHeight) * 16) / 9);

    const root = document.documentElement;
    root.style.setProperty("--story-width", storyWidth + "px");
    root.style.setProperty("--story-bg-width", storyBgWidth + "px");
    root.style.setProperty("--story-scale-unitless", storyBgWidth / 1280);
}
if (isFirefox) {
    // firefox strict calc() rules make all this necessary.
    updateStoryWidth();
    window.addEventListener("resize", () => setTimeout(updateStoryWidth, 50));
    window.addEventListener("orientationchange", updateStoryWidth);
}

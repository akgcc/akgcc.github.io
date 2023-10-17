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
    rogueStory;
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
    none: 0,
};
const CharslotNameMap = {
    l: "",
    left: "",
    m: 2,
    middle: 2,
    r: 3,
    right: 3,
};

get_char_table(false, serverString)
    .then((js) => {
        operatorData = js;
        for (var key in operatorData) {
            charCodeMap[key.split("_")[2]] = key;
        }
        return fetch(
            "https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/" +
                serverString +
                "/gamedata/story/story_variables.json",
        );
    })
    .then((res) => fixedJson(res))
    .then((js) => {
        soundMap = js;
        soundMap["$ill_amiya_normal"] = "char_002_amiya_1";
        return fetch(
            "https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/" +
                serverString +
                "/gamedata/excel/uniequip_table.json",
        );
    })
    .then((res) => fixedJson(res))
    .then((js) => {
        moduleStory = js;
        return fetch(
            "https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/" +
                serverString +
                "/gamedata/excel/story_review_meta_table.json",
        );
    })
    .then((res) => fixedJson(res))
    .then((js) => {
        storyReviewMeta = js;
        return fetch(
            "https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/" +
                serverString +
                "/gamedata/excel/roguelike_topic_table.json",
        );
    })
    .then((res) => fixedJson(res))
    .then((js) => {
        rogueStory = js;
        return fetch(
            "https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/" +
                serverString +
                "/gamedata/excel/story_review_table.json",
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

            if (x.id.startsWith("main_")) storyTypes.main.push(x.id);
            else if (x.id.startsWith("story_")) storyTypes.record.push(x.id);
            else if (x.entryType.startsWith("MINI_"))
                storyTypes.mini.push(x.id);
            else storyTypes.side.push(x.id);
        });

        storyTypes.module = [].concat(
            ...Object.values(moduleStory.charEquip).map((x) => x.slice(1)),
        );
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
            // for each ending cutscene:
            for (const [k, v] of Object.entries(
                rogueStory.details[rogue_key].endings,
            )) {
                ending_num = /_(\d)/.exec(k)[1];
                storyReview[rogue_key].infoUnlockDatas.push({
                    storyName: v.name,
                    storyTxt: `obt/roguelike/ro${is_num}/level_rogue${is_num}_ending_${ending_num}`,
                });
            }
            // for each endbook:
            for (const [k, v] of Object.entries(
                rogueStory.details[rogue_key].archiveComp.endbook.endbook,
            )) {
                // for each part
                for (const [k2, v2] of Object.entries(
                    v.clientEndbookItemDatas,
                )) {
                    // insert story in the correct position (assume each story has 3 parts or this fails.)
                    storyReview[rogue_key].infoUnlockDatas.splice(
                        1 + (v.sortId - 1) * 4,
                        0,
                        {
                            storyName: `${v.title} - ${v2.endbookName}`,
                            storyTxt: v2.textId.toLowerCase(),
                            storyBackground: v.cgId,
                        },
                    );
                }
            }

            // for each monthly squad:
            for (const [k, v] of Object.entries(
                rogueStory.details[rogue_key].monthSquad,
            )) {
                let month_num = /_(\d)$/.exec(k)[1];
                let month_key = `${rogue_key}_${k}`;
                storyTypes.rogue.push(month_key);
                storyReview[month_key] = {
                    name: `M${month_num} - ${v.teamName}`,
                    infoUnlockDatas: [],
                };
            }
            for (const [k, v] of Object.entries(
                rogueStory.details[rogue_key].archiveComp.chat.chat,
            )) {
                let month_num = /_(\d)$/.exec(k)[1];
                let month_key = `${rogue_key}_month_team_${month_num}`;
                // for each floor
                for (const [k2, v2] of Object.entries(v.clientChatItemData)) {
                    if (storyReview[month_key] === undefined) {
                        // delete not yet added stories
                        delete storyReview[month_key];
                        break;
                    }
                    storyReview[month_key].infoUnlockDatas.push({
                        storyName: `Floor ${v2.chatFloor}`,
                        storyTxt: `${v2.chatStoryId.toLowerCase()}`,
                        storyBackground: `pic_${rogue_key}_1`,
                    });
                }
            }
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
                opt.value = i;
                opt.innerHTML = name;
                document.getElementById("thirdCatSelect").appendChild(opt);
            });
            document.getElementById("thirdCatSelect").onchange = () => {
                // change hash, this will trigger the listener to load the story.
                window.location.hash =
                    uppercat +
                    "&" +
                    cat +
                    "&" +
                    document.getElementById("thirdCatSelect").value;
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
            genStory(data).then(() => {
                scrollFunction();
                sessionStorage.setItem("userChange", false);
            });
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

async function genStory(data) {
    let storyName = data.storyName;
    let key = data.storyTxt;
    soundQueue.length = 0;
    longSoundQueue.length = 0;
    allScenes.length = 0;
    allMusic.length = 0;
    allSoundButtons.length = 0;
    lastBackgroundImage = undefined;
    predicateQueue = [];
    activeReferences = [];
    referenceQueue = [];
    lastPredicate = { 1: [], 2: [], 3: [] }; // prevents catastrophic failure in an edge case
    async function getModuleStory(key) {
        return {
            //bg_corridor is a good alternate
            text: () =>
                `[background(image="bg_room_2")]\n[ShowItem(image="${
                    moduleStory.equipDict[key].uniEquipIcon
                }",is_module=1)]\n${moduleStory.equipDict[
                    key
                ].uniEquipDesc.replace(/\n/g, "\\n")}`,
        };
    }

    return await (key.startsWith("uniequip")
        ? getModuleStory(key)
        : fetch(
              "https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/" +
                  serverString +
                  "/gamedata/story/" +
                  key +
                  ".txt",
          )
    )
        .then((r) => r.text())
        .then((txt) => {
            if (data.storyBackground) {
                // use special bg, currently used for is endbooks
                txt = `[roguebackground(image="${data.storyBackground}")]\n${txt}`;
            }
            const lines = txt.matchAll(/^(\[[^\]]+])?(.*)?$/gim);
            let storyDiv = document.getElementById("storyDisp");
            key.startsWith("uniequip")
                ? storyDiv.classList.add("module")
                : storyDiv.classList.remove("module");
            storyDiv.innerHTML = "";
            let title = document.createElement("div");
            title.classList.add("storyName");
            title.innerHTML = storyName;
            document.getElementById("storyTitle").innerHTML = storyName;
            storyDiv.appendChild(title);
            let scene,
                speaker = 0,
                chars = {},
                speakerList = new Set(),
                preSceneAudios = [],
                lastBlockerColor = "rgba(0,0,0,0)",
                hangingBlocker,
                multiLineDialog = "";
            function addSceneBreak(requireBreak) {
                let scenebreak = document.createElement("div");
                scenebreak.classList.add("scenebreak");
                storyDiv.appendChild(scenebreak);
                lastBlocker = null;

                Array.from(scene.children)
                    .reverse()
                    .some((el) => {
                        if (el.classList.contains("blocker")) {
                            lastBlocker = lastBlocker || el;
                            if (el.classList.contains("fadein")) {
                                //color scenebreak based on last blocker
                                scenebreak.style.background = `linear-gradient(${el.style.getPropertyValue(
                                    "--end-color",
                                )},${el.style.getPropertyValue(
                                    "--end-color",
                                )}), linear-gradient(#000,#000)`;
                                let spacer = document.createElement("div");
                                spacer.classList.add("blocker");
                                spacer.style.flex = 99999;
                                spacer.style.backgroundColor =
                                    el.style.getPropertyValue("--start-color");
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
                    scene.classList.add("blockerPadded");
                }
            }
            function addCurrentScene(requireBreak = false) {
                // do not add the scene if it has no children, is not an image, and is not full of blockers only.
                if (!scene) return;
                if (!scene.classList.contains("image")) {
                    if (!scene.childElementCount) return;
                    if (
                        Array.from(scene.childNodes).every((n) =>
                            n.classList.contains("blocker"),
                        )
                    )
                        return;
                }
                // remove stray blocker (add it to the next scene later)
                hangingBlocker = scene.querySelector(
                    ".blocker.fadeout:last-child",
                );
                if (hangingBlocker) hangingBlocker.remove();
                storyDiv.appendChild(scene);
                addSceneBreak(requireBreak);
            }
            function getWorkingScene(imageScene = false) {
                if (!scene) {
                    scene = createScene(
                        IMG_SOURCE + "avg/backgrounds/bg_black.png",
                        ALT_IMG_SOURCE.replace(/REPLACEME/, "bg_black"),
                        imageScene,
                    );
                }
                return scene;
            }
            function createScene(imgurl, altimgurl, isImage) {
                chars = {};
                speaker = 0;
                // imgurl may be an array for largebg, note that only the first 2 images will be used.
                const scene = document.createElement("div");
                scene.classList.add("scene");
                if (isImage) scene.classList.add("image");
                if (hangingBlocker) {
                    scene.appendChild(hangingBlocker);
                    hangingBlocker = null;
                }
                if (preSceneAudios.length) {
                    for (a of preSceneAudios) scene.appendChild(a);
                    preSceneAudios.length = 0;
                }
                scene.setAttribute("data-bgheight", 0);
                scene.setAttribute("data-bgwidth", 0);
                if (!Array.isArray(imgurl)) {
                    let imgLoader = new Image();
                    imgLoader.onload = (e) => {
                        setSceneSize(e),
                            scene.style.setProperty(
                                "--background-image-url",
                                'url("' + e.currentTarget.src + '")',
                            );
                    };
                    imgLoader.src = imgurl;

                    imgLoader.onerror = () => {
                        // try the altimgurl now
                        imgLoader = new Image();
                        imgLoader.onload = (e) => {
                            setSceneSize(e),
                                scene.style.setProperty(
                                    "--background-image-url",
                                    'url("' + e.currentTarget.src + '")',
                                );
                        };
                        imgLoader.onerror = (e) => {
                            // last ditch effort, treat this as multipart
                            let left =
                                imgurl.split(".").slice(0, -1).join(".") +
                                "_1." +
                                imgurl.split(".").slice(-1);
                            let right =
                                imgurl.split(".").slice(0, -1).join(".") +
                                "_2." +
                                imgurl.split(".").slice(-1);
                            multipartImage(left, right);
                        };
                        imgLoader.src = altimgurl;
                    };
                } else {
                    multipartImage(imgurl[0], imgurl[1]).catch(() => {
                        multipartImage(altimgurl[0], altimgurl[1]);
                    });
                }
                allScenes.push(scene);
                imgLoader = null;
                return scene;

                function setSceneSize(e) {
                    const img = e.currentTarget;
                    let h = img.height;
                    let w =
                        parseInt(scene.getAttribute("data-bgwidth")) +
                        img.width;
                    scene.setAttribute("data-bgheight", h);
                    scene.setAttribute("data-bgwidth", w);
                    if (scene.classList.contains("multipart"))
                        scene.style.minHeight =
                            "calc(1.5 * var(--story-width) / " +
                            w +
                            " * " +
                            h +
                            ")";
                    else
                        scene.style.minHeight =
                            "calc(var(--story-width) / " + w + " * " + h + ")";
                    alignBackground(scene);
                    // img.remove();
                }
                function multipartImage(left, right) {
                    return new Promise((resolve, reject) => {
                        scene.classList.add("multipart");

                        let dimleft = new Image();
                        let dimright = new Image();

                        dimleft.onload = setSceneSize;
                        dimright.onload = (e) => {
                            setSceneSize(e),
                                scene.style.setProperty(
                                    "--background-image-url",
                                    'url("' + left + '"), url("' + right + '")',
                                );
                        };
                        dimleft.onerror = () => {
                            // Image failed to load
                            reject(new Error("Failed to load image."));
                        };
                        dimright.onerror = () => {
                            // Image failed to load
                            reject(new Error("Failed to load image."));
                        };

                        dimleft.src = left;
                        dimright.src = right;
                    });
                }
            }
            function makeDecisionDialog(args) {
                let choices = args.options.split(";");
                let vals = args.values.split(";");

                vals = vals.slice(0, choices.length); // fixes some broken script files.
                // keys.forEach((key, i) => result[key] = values[i]);
                let dialog = makeDialog(
                    { name: "Dr {@nickname}" },
                    choices[0],
                    { name: "avg_npc_048" },
                    1,
                );
                // create predicate after making dialog or the dialog will be hidden.
                const predicate = {};
                vals.forEach((v) => (predicate[v] = []));
                predicateQueue.push(predicate);
                let txt = dialog.querySelector(".text");
                txt.innerHTML = "";
                txt.classList.add("doctor");
                choices.forEach((c, i) => {
                    let opt = document.createElement("div");
                    opt.classList.add("decision");
                    if (i == 0) opt.classList.add("selected");
                    opt.setAttribute("data-predicate", vals[i]);
                    opt.innerHTML = c;
                    txt.append(opt);
                    opt.onclick = () => {
                        Array.from(txt.querySelectorAll(".decision")).forEach(
                            (el) => {
                                el.classList.remove("selected");
                            },
                        );
                        opt.classList.add("selected");
                        let thispredicate = opt.getAttribute("data-predicate");
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
                        scrollFunction();
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
                txt.setAttribute("data-name", "");
                txt.style.setProperty("--name-color", "#777");
                let blocktxt = document.createElement("div");
                blocktxt.innerHTML = dialogLine.replace(
                    /\\r\\n|\\r|\\n/g,
                    "<br />",
                );
                txt.appendChild(blocktxt);
                wrap.appendChild(left);
                txt.prepend(nameplate);
                wrap.appendChild(txt);
                wrap.appendChild(right);
                if (args && args.name) {
                    txt.setAttribute("data-name", args.name);
                    nameplate.innerHTML = args.name;
                    txt.style.setProperty(
                        "--name-color",
                        selectColor(colorIndex),
                    );
                    Object.keys(chars)
                        .sort()
                        .forEach((key, i) => {
                            if (chars[key] != "char_empty") {
                                let isActive =
                                    currentSpeaker == 99 ||
                                    (currentSpeaker == 1 && key == "name") ||
                                    key == "name" + currentSpeaker;
                                let avatar = avatarImg(chars[key]);
                                if (isActive) avatar.classList.add("active");
                                if (isActive) left.appendChild(avatar);
                                else right.appendChild(avatar);
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
            for (const line of lines) {
                // console.log(line, predicateQueue, referenceQueue);
                // console.log(line[0], activeReferences, referenceQueue);
                // console.log(predicateQueue.length, "==", referenceQueue.length);
                if (line[1]) {
                    [_, cmd, args] =
                        /\[\s*?(?:([^=\(\]]+)(?=[\(\]])\(?)?([^\]]*?)\)?\s*?\]/.exec(
                            line[1],
                        );
                    if (args) {
                        let tmp = {};
                        Array.from(
                            args.matchAll(
                                /("?[^=", ]+"?)\s*=\s*"?((?<=")[^"]*|[^,]*)/gim,
                            ),
                        ).forEach((l) => {
                            tmp[l[1].toLowerCase()] = l[2];
                        });
                        args = tmp;
                    }
                }
                if (
                    line[1] &&
                    args &&
                    "name" in args &&
                    line[2] &&
                    line[2].trim() &&
                    !cmd
                ) {
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
                    switch (cmd.toLowerCase()) {
                        case "showitem":
                            let wrap = document.createElement("div");
                            wrap.classList.add("dialog");
                            let imgbtn = document.createElement("i");
                            imgbtn.classList.add("fas");
                            imgbtn.classList.add("fa-image");
                            imgbtn.classList.add("itemBtn");
                            wrap.appendChild(imgbtn);
                            const itemsrc = args.is_module
                                ? `${IMG_SOURCE}equip/icon/${args.image}.png`
                                : IMG_SOURCE +
                                  "avg/items/" +
                                  args.image +
                                  ".png";
                            imgbtn.onclick = () => {
                                enlargeAvatar(itemsrc, true);
                            };
                            getWorkingScene().appendChild(wrap);
                            break;
                        case "moduleimage":
                        case "background":
                        case "roguebackground":
                            if (
                                cmd.toLowerCase() == "background" &&
                                (!args || !args.image)
                            )
                                break;
                        case "largebg":
                            if (
                                cmd.toLowerCase() == "largebg" &&
                                (!args || !args.imagegroup)
                            )
                                break;
                        case "image":
                            if (
                                cmd.toLowerCase() == "image" &&
                                (!args || !args.image) &&
                                (!scene || !scene.classList.contains("image"))
                            )
                                break;
                            // insert new div when background changes and set to current scene
                            let wasDisplayingImage = false;
                            if (scene) {
                                wasDisplayingImage =
                                    scene.classList.contains("image");
                                addCurrentScene();
                            }
                            let imgurl =
                                IMG_SOURCE + "avg/backgrounds/bg_black.png";
                            let altimgurl = ALT_IMG_SOURCE.replace(
                                /REPLACEME/,
                                "bg_black",
                            );
                            switch (cmd.toLowerCase()) {
                                case "image":
                                    if (!args || !args.image) {
                                        if (
                                            wasDisplayingImage &&
                                            lastBackgroundImage
                                        ) {
                                            // remove image, revert to prev background
                                            imgurl = lastBackgroundImage;
                                        }
                                        break;
                                    }
                                    imgurl =
                                        IMG_SOURCE +
                                        "avg/images/" +
                                        args.image +
                                        ".png";
                                    altimgurl = ALT_IMG_SOURCE.replace(
                                        /REPLACEME/,
                                        args.image,
                                    );
                                    break;
                                case "background":
                                    imgurl =
                                        IMG_SOURCE +
                                        "avg/backgrounds/" +
                                        args.image +
                                        ".png";
                                    altimgurl = ALT_IMG_SOURCE.replace(
                                        /REPLACEME/,
                                        args.image,
                                    );
                                    lastBackgroundImage = imgurl;
                                    break;
                                case "largebg":
                                    imgurl = args.imagegroup
                                        .split("/")
                                        .slice(0, 2)
                                        .map(
                                            (x) =>
                                                IMG_SOURCE +
                                                "avg/backgrounds/" +
                                                x +
                                                ".png",
                                        );
                                    altimgurl = args.imagegroup
                                        .split("/")
                                        .slice(0, 2)
                                        .map((x) =>
                                            ALT_IMG_SOURCE.replace(
                                                /REPLACEME/,
                                                x,
                                            ),
                                        );
                                    lastBackgroundImage = imgurl;
                                    break;
                                case "moduleimage":
                                    imgurl = `${IMG_SOURCE}equip/icon/${args.image}.png`;
                                    break;
                                case "roguebackground":
                                    imgurl = `${IMG_SOURCE}avg/images/${args.image}.png`;
                                    altimgurl = ALT_IMG_SOURCE.replace(
                                        /REPLACEME/,
                                        args.image,
                                    );
                                    break;
                            }

                            scene = createScene(
                                imgurl,
                                altimgurl,
                                cmd.toLowerCase() == "image" &&
                                    args &&
                                    args.image,
                            );
                            break;
                        case "charslot": // new format (replaces "character")
                            if (args) {
                                if (args.focus)
                                    speaker = CharslotFocusMap[args.focus] || 0; // ( this may not be correct for this new format, maybe setting to 1 is still correct )
                                if (args.name)
                                    chars[`name${CharslotNameMap[args.slot]}`] =
                                        args.name;
                            } else {
                                chars = {};
                                speaker = 0;
                            }
                            break;
                        case "multiline": // new direction that I'm not sure how to handle just yet until I see it in game.
                            if (args?.name)
                                speakerList.add(args.name.toLowerCase());
                            // sanity check:
                            if (args && line[2]) {
                                multiLineDialog += `${line[2]}\\n`;
                                if (args.end) {
                                    let dlg = makeDialog(
                                        args,
                                        multiLineDialog,
                                        chars,
                                        speaker,
                                        Array.from(speakerList).indexOf(
                                            args.name.toLowerCase(),
                                        ),
                                    );
                                    getWorkingScene().appendChild(dlg);
                                    multiLineDialog = "";
                                }
                            }
                            break;
                        case "character":
                            if (args) {
                                speaker = parseInt(args.focus) || 1; // set to 1 if focus key doesnt exist.
                                chars = args;
                                Object.keys(chars).forEach((k) => {
                                    if (!k.startsWith("name")) delete chars[k];
                                });
                            } else {
                                chars = {};
                                speaker = 0;
                            }
                            break;
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
                                speaker = parseInt(args.focus) || 1; // set to 1 if focus key doesnt exist.
                                chars = {
                                    name: args.head,
                                };
                                speakerList.add(chars.name.toLowerCase());
                                let dlg = makeDialog(
                                    {
                                        name:
                                            operatorData[chars.name].name ||
                                            operatorData[chars.name]
                                                .appellation,
                                    },
                                    line[2],
                                    chars,
                                    speaker,
                                    Array.from(speakerList).indexOf(
                                        chars.name.toLowerCase(),
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
                            if (cmd.toLowerCase() == "playmusic") {
                                audio.setAttribute("loop", "");
                                audio.classList.add("music");
                                allMusic.push(audio);
                            } else {
                                audio.classList.add("sound");
                            }
                            audio.setAttribute(
                                "data-defvol",
                                Math.min(args.volume, 1) || 0.8,
                            );

                            let sound = document.createElement("source");
                            let soundkey = /\$?(.+)/i.exec(args.key)[1];
                            let soundpath = soundMap[soundkey] || soundkey;
                            sound.src = (
                                "./sounds/assets/torappu/dynamicassets/audio/" +
                                soundpath +
                                ".mp3"
                            ).toLowerCase();
                            sound.setAttribute("type", "audio/mp3");
                            audio.appendChild(sound);
                            sound = document.createElement("source");
                            sound.src = (
                                "https://aceship.github.io/AN-EN-Tags/etc/" +
                                soundpath.split("/").slice(1).join("/") +
                                ".wav"
                            ).toLowerCase();
                            sound.setAttribute("type", "audio/wav");
                            audio.appendChild(sound);
                            if (cmd.toLowerCase() == "playsound") {
                                let btn = document.createElement("i");
                                btn.classList.add("fas");
                                btn.classList.add("fa-volume-up");
                                btn.classList.add("soundBtn");
                                audioWrapper = document.createElement("div");
                                audioWrapper.style.backgroundColor =
                                    lastBlockerColor.split(" ")[0];
                                function playFunc() {
                                    audio.volume =
                                        (volSlider.value / 100) *
                                        audio.getAttribute("data-defvol");
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
                                btn.addEventListener("click", () => {
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
                                audioWrapper.appendChild(btn);
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
                            if (scene && args && "fadetime" in args) {
                                let blocker = document.createElement("div");
                                blocker.classList.add("dialog");
                                blocker.classList.add("blocker");
                                blocker.style.height =
                                    Math.max(
                                        1,
                                        Math.min(
                                            4,
                                            parseFloat(args.fadetime) * 2,
                                        ),
                                    ) + "em";
                                let color = "rgba(0,0,0,1)";
                                const blockerOpacity = 1;

                                if (
                                    "a" in args &&
                                    "r" in args &&
                                    "g" in args &&
                                    "b" in args
                                ) {
                                    color = `rgba(${args.r},${args.g},${
                                        args.b
                                    },${parseFloat(args.a) * blockerOpacity})`;
                                } else if ("a" in args) {
                                    color = `rgba(0,0,0,${
                                        parseFloat(args.a) * blockerOpacity
                                    })`;
                                }
                                blocker.style.setProperty(
                                    "--start-color",
                                    lastBlockerColor,
                                );
                                blocker.style.setProperty("--end-color", color);
                                if ("a" in args && parseFloat(args.a)) {
                                    blocker.classList.add("fadein"); // fade to opaque
                                } else {
                                    blocker.classList.add("fadeout"); // fade to transparent
                                }
                                lastBlockerColor = color;
                                scene.appendChild(blocker);
                            }
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
                        case "imagetween":
                        case "backgroundtween":
                        case "skiptothis":
                        case "gotopage":
                        case "hideitem":
                        case "startbattle":
                        case "tutorial":
                        case "theater":
                        // new after QB:
                        case "effect":
                        case "bgeffect":
                        case "curtain":
                        case "stickerclear":
                            break;
                        default:
                            // console.log("line not parsed:", line);
                            break;
                    }
                } else if (line[2] && !line[2].trim().startsWith("//")) {
                    // group 2 alone indicates speakerless text (narrator)
                    let dlg = makeDialog(null, line[2], {}, 0);
                    dlg.classList.add("narration");
                    getWorkingScene().appendChild(dlg);
                }
            }
            addCurrentScene(true);
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
function avatarImg(path) {
    // return image element with many, many fallbacks.
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

    src_array = src_array.map(
        (item) =>
            IMG_SOURCE + "avg/characters/" + encodeURIComponent(item) + ".png",
    );
    src_array.splice(
        1,
        0,
        ALT_IMG_SOURCE.replace(/REPLACEME/, encodeURIComponent(full_name)),
    );
    src_array.unshift(`./thumbs/${encodeURIComponent(full_name)}.webp`); // put thumb path first
    const img = document.createElement("img");
    var i = 1;
    img.onerror = function () {
        if (i < src_array.length) {
            this.src = src_array[i];
            this.parentElement.classList.remove("initial");
            i++;
        } else {
            this.onerror = null;
            this.src = `${IMG_SOURCE}avatars/avg_npc_012.png`;
            // this.src = ALT_IMG_SOURCE.replace(/REPLACEME/, "avg_npc_012");
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
    let wrap = document.createElement("div");
    wrap.classList.add("avatar");
    wrap.classList.add("npc");
    wrap.classList.add("initial");
    wrap.appendChild(img);
    wrap.onclick = (e) => {
        // e.stopPropagation();
        if (!wrap.classList.contains("unknown")) {
            if (wrap.classList.contains("initial")) {
                enlargeAvatar(src_array.slice(1));
            } else {
                enlargeAvatar([img.src]);
            }
        }
    };
    return wrap;
}

const avatarModal = document.getElementById("avatarModal");
window.addEventListener("click", (e) => {
    if (e.target == avatarModal) avatarModal.classList.remove("show");
});
function enlargeAvatar(src_array, cover = false) {
    avatarModal.classList.add("show");
    let content = avatarModal.querySelector(".modal-content");
    content.innerHTML = "";
    let im = document.createElement("img");
    im.src = src_array[0];
    let i = 1;
    im.onerror = function () {
        if (i < src_array.length) {
            this.src = src_array[i];
            i++;
        } else {
            this.onerror = null;
            this.src = `${IMG_SOURCE}avatars/avg_npc_012.png`;
        }
    };
    if (cover) im.classList.add("item");
    content.appendChild(im);
}

//Get the button:
mybutton = document.getElementById("topBtn");
mybutton.onclick = topFunction;
titlediv = document.getElementById("storyTitle");
topNav = document.querySelector("#topNav");

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = scrollFunction;
window.onresize = scrollFunction;
function adjustedMidpoint() {
    topNavHeight = topNavHeight || topNav.offsetHeight;
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
    let pos = s.getBoundingClientRect();
    let imheight = s.getAttribute("data-bgheight");
    let imwidth = s.getAttribute("data-bgwidth");
    if (s.classList.contains("multipart"))
        // adjust for zoom in
        imheight = ((1.5 * pos.width) / imwidth) * imheight;
    else imheight = (pos.width / imwidth) * imheight;
    if (s.classList.contains("multipart")) {
        s.style.backgroundPosition =
            "calc(var(--story-width) * -.25) " +
            Math.min(
                pos.height - imheight,
                Math.max(0, realMidpoint - pos.top - imheight / 2),
            ) +
            ", calc(var(--story-width) / 2) " +
            Math.min(
                pos.height - imheight,
                Math.max(0, realMidpoint - pos.top - imheight / 2),
            );
    } else {
        s.style.backgroundPosition =
            "center " +
            Math.min(
                pos.height - imheight,
                Math.max(0, realMidpoint - pos.top - imheight / 2),
            );
    }
}
document.getElementById("playPauseBtn").onclick = () => playPauseMusic(true);
const musicState = { paused: true };
function playPauseMusic(toggle = false) {
    let targetMusic = allMusic[0];
    allMusic.forEach((a) => {
        let rect = a.getBoundingClientRect();
        if (rect.top < autoPlayPoint) {
            targetMusic = a;
        }
    });
    if (targetMusic) {
        targetMusic.volume =
            (volSlider.value / 100) * targetMusic.getAttribute("data-defvol");
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
        let soundTop = container.getBoundingClientRect().top;
        if (
            soundTop < autoPlayPoint ||
            document.body.scrollTop >
                document.body.offsetHeight - window.innerHeight - topNavHeight
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
            let scene_top = scene.offsetTop;
            let scene_bot = scene_top + scene.offsetHeight;
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
function scrollFunction() {
    autoPlayPoint = autoPlayMidPoint();
    realMidpoint = adjustedMidpoint();
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
        document.querySelector(".storyName").offsetHeight +
            document.querySelector(".storyName").offsetTop;
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
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

const volSlider = document.getElementById("volSlider");
volSlider.oninput = () => {
    allMusic.forEach((a) => {
        a.volume = (volSlider.value / 100) * a.getAttribute("data-defvol");
    });
    playPauseMusic();
};

const toggleVisBtn = document.getElementById("visButton");
var tempHideAll = null;
toggleVisBtn.onmouseover = () => {
    tempHideAll = setTimeout(
        () => document.getElementById("storyDisp").classList.add("bg_only"),
        250,
    );
};
toggleVisBtn.onmouseout = () => {
    clearTimeout(tempHideAll);
    document.getElementById("storyDisp").classList.remove("bg_only");
};
toggleVisBtn.addEventListener("click", () => {
    clearTimeout(tempHideAll);
    document.getElementById("storyDisp").classList.remove("bg_only");
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
    scrollFunction();
};
const toggleSfxBtn = document.getElementById("sfxButton");
toggleSfxBtn.onclick = () => {
    enableSoundAutoplay ^= 1;
    let icon = toggleSfxBtn.querySelector("i");
    icon.classList.toggle("fa-volume-up");
    icon.classList.toggle("fa-volume-mute");
};

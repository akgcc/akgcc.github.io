var operatorData,
    charCodeMap = {},
    currentCategory,
    storyReview,
    storyTypes = { record: [], main: [], side: [], mini: [] },
    storyTypeNames = {
        record: "Operator Record",
        main: "Main Story",
        side: "Side Story",
        mini: "Vignette",
    },
    soundMap,
    avatarCoords,
    lastBackgroundImage;
const charPathFixes = {
    char_2006_weiywfmzuki_1: "char_2006_fmzuki_1",
    avg_NPC_017_3: "avg_npc_017_3",
};
const forcedBaseNames = []; //["avg_npc_208"];

get_char_table(false, serverString)
    .then((js) => {
        operatorData = js;
        for (var key in operatorData) {
            charCodeMap[key.split("_")[2]] = key;
        }
        return fetch(
            "https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/" +
                serverString +
                "/gamedata/story/story_variables.json"
        );
    })
    .then((res) => res.json())
    .then((js) => {
        soundMap = js;
        return fetch("./json/avatar_coords.json");
    })
    .then((res) => res.json())
    .then((js) => {
        avatarCoords = js;
        return fetch(
            "https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/" +
                serverString +
                "/gamedata/excel/story_review_table.json"
        );
    })
    .then((res) => res.json())
    .then((js) => {
        storyReview = js;
        Object.values(storyReview).forEach((x) => {
            if (x.id.startsWith("main_")) storyTypes.main.push(x.id);
            else if (x.id.startsWith("story_")) storyTypes.record.push(x.id);
            else if (x.entryType.startsWith("MINI_"))
                storyTypes.mini.push(x.id);
            else storyTypes.side.push(x.id);
        });

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

        Object.keys(storyTypes).forEach((t) => {
            let opt = document.createElement("option");
            opt.value = t;
            opt.innerHTML = storyTypeNames[t];
            document.getElementById("catSelect").appendChild(opt);
        });
        function buildThirdSelector(uppercat, cat, trigger = true) {
            document.getElementById("thirdCatSelect").innerHTML = "";
            let stories = storyReview[cat].infoUnlockDatas;

            // sort if needed:
            switch (uppercat) {
                case "side":
                case "mini":
                case "main":
                    // if main sort by story code:
                    stories.sort((a, b) => {
                        let code_a =
                            /\d+-\d+(_.)?/.exec(a.storyDependence) &&
                            /\d+-\d+(_.)?/.exec(a.storyDependence)[0];
                        let code_b =
                            /\d+-\d+(_.)?/.exec(b.storyDependence) &&
                            /\d+-\d+(_.)?/.exec(b.storyDependence)[0];
                        if (
                            /_spst_/.exec(b.storyId) ||
                            /_spst_/.exec(a.storyId)
                        ) {
                            if (code_b >= code_a) {
                                return -1;
                            }
                            return 1;
                        }
                        return 0;
                    });
                    break;
            }
            stories.forEach((d, i) => {
                let name = d.storyName;

                switch (uppercat) {
                    case "main":
                    case "mini":
                    case "side":
                        if (d.storyCode) {
                            let pos = d.avgTag.split(" ")[0];
                            name = d.storyCode;
                            if (["Before", "After"].includes(pos))
                                name += " " + pos;
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
                case "mini":
                case "side":
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
                    document.getElementById("subCatSelect").value
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
                    currentCategory.options[
                        ++currentCategory.selectedIndex %
                            currentCategory.options.length
                    ].selected = true;
                    currentCategory.onchange();
                    topFunction();
                };
            }
        );
        Array.from(document.getElementsByClassName("story_prev")).forEach(
            (e) => {
                e.onclick = () => {
                    let currentCategory =
                        document.getElementById("thirdCatSelect");
                    currentCategory.options[
                        (--currentCategory.selectedIndex +
                            currentCategory.options.length) %
                            currentCategory.options.length
                    ].selected = true;
                    currentCategory.onchange();
                    topFunction();
                };
            }
        );
        function loadFromHash() {
            [uppercat, cat, idx] = window.location.hash.slice(1).split("&");

            Array.from(document.getElementById("catSelect").options).forEach(
                (o) => {
                    if (o.value == uppercat) o.selected = true;
                }
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
                }
            );
            buildThirdSelector(uppercat, cat, false);
            Array.from(
                document.getElementById("thirdCatSelect").options
            ).forEach((o) => {
                if (o.value == idx) o.selected = true;
            });
            let data =
                storyReview[cat].infoUnlockDatas[
                    document.getElementById("thirdCatSelect").value
                ];
            genStory(data.storyName, data.storyTxt).then(() => {
                scrollFunction();
                sessionStorage.setItem("userChange", false);
                reapplyToggles();
            });
        }
        window.onhashchange = loadFromHash;
        if (window.location.hash) {
            loadFromHash();
        } else {
            let latest_story = Object.keys(storyReview)
                .filter((k) => storyReview[k].entryType != "NONE")
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
                            : storyReview[b].startShowTime)
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
            history.replaceState(undefined, undefined, newHash);
            loadFromHash();
        }
    });

async function genStory(storyName, key) {
    return await fetch(
        "https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/" +
            serverString +
            "/gamedata/story/" +
            key +
            ".txt"
    )
        .then((r) => r.text())
        .then((txt) => {
            const lines = txt.matchAll(/^(\[[^\]]+])?(.*)?$/gim);
            let storyDiv = document.getElementById("storyDisp");
            storyDiv.innerHTML = "";
            let title = document.createElement("div");
            title.classList.add("storyName");
            title.innerHTML = storyName;
            document.getElementById("storyTitle").innerHTML = storyName;
            storyDiv.appendChild(title);
            let scene,
                speaker,
                chars = {},
                speakerList = new Set(),
                predicate = {},
                activeReferences = [],
                defaultPredicate = "1",
                firstAudio,
                lastBlockerColor = "rgba(0,0,0,0)",
                hangingBlocker;
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
                                    "--end-color"
                                )},${el.style.getPropertyValue(
                                    "--end-color"
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
                                        ".soundPlayer:last-child"
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
                        /(?:[\.\d]+,){3}([\.\d]+)/.exec(lastBlockerColor)[1]
                    ) &&
                    (!lastBlocker || lastBlocker.classList.contains("fadein"))
                ) {
                    // apply opaque blocker color to rest of scene.
                    scene.style.setProperty(
                        "--fill-blocker",
                        lastBlockerColor.split(" ")[0]
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
                            n.classList.contains("blocker")
                        )
                    )
                        return;
                }
                // remove stray blocker (add it to the next scene later)
                hangingBlocker = scene.querySelector(
                    ".blocker.fadeout:last-child"
                );
                if (hangingBlocker) hangingBlocker.remove();
                storyDiv.appendChild(scene);
                addSceneBreak(requireBreak);
            }
            function getWorkingScene(imageScene = false) {
                if (!scene) {
                    scene = createScene(
                        "https://aceship.github.io/AN-EN-Tags/img/avg/backgrounds/bg_black.png",
                        imageScene
                    );
                }
                return scene;
            }
            function createScene(imgurl, isImage) {
                chars = {};
                speaker = 0;
                // imgurl may be an array for largebg, note that only the first 2 images will be used.
                scene = document.createElement("div");
                scene.classList.add("scene");
                if (isImage) scene.classList.add("image");
                if (hangingBlocker) {
                    scene.appendChild(hangingBlocker);
                    hangingBlocker = null;
                }
                if (firstAudio) {
                    scene.appendChild(firstAudio);
                    firstAudio = null;
                }

                let setDims = function () {
                    let h = this.im.height;
                    let w =
                        parseInt(this.div.getAttribute("data-bgwidth")) +
                        this.im.width;
                    this.div.setAttribute("data-bgheight", h);
                    this.div.setAttribute("data-bgwidth", w);
                    if (this.div.classList.contains("multipart"))
                        this.div.style.minHeight =
                            "calc(1.5 * var(--story-width) / " +
                            w +
                            " * " +
                            h +
                            ")";
                    else
                        this.div.style.minHeight =
                            "calc(var(--story-width) / " + w + " * " + h + ")";
                    alignBackground(this.div);
                    this.im.remove();
                };
                function multipart(left, right) {
                    this.div.classList.add("multipart");
                    this.div.style.setProperty(
                        "--background-image-url",
                        'url("' + left + '"), url("' + right + '")'
                    );
                    let dimleft = new Image();
                    let dimright = new Image();
                    dimleft.src = left;
                    dimright.src = right;
                    dimleft.onload = setDims.bind({
                        div: this.div,
                        im: dimleft,
                    });
                    dimright.onload = setDims.bind({
                        div: this.div,
                        im: dimright,
                    });
                }
                scene.style.setProperty(
                    "--background-image-url",
                    'url("' + imgurl + '")'
                );
                scene.setAttribute("data-bgheight", 0);
                scene.setAttribute("data-bgwidth", 0);
                if (Array.isArray(imgurl)) {
                    multipart.bind({ div: scene })(imgurl[0], imgurl[1]);
                } else {
                    let getdim = new Image();
                    getdim.onload = setDims.bind({
                        div: scene,
                        im: getdim,
                    });

                    // may be a multi-part image, try using first 2 parts to form a bg.
                    getdim.onerror = function () {
                        let left =
                            getdim.src.split(".").slice(0, -1).join(".") +
                            "_1." +
                            getdim.src.split(".").slice(-1);
                        let right =
                            getdim.src.split(".").slice(0, -1).join(".") +
                            "_2." +
                            getdim.src.split(".").slice(-1);
                        return multipart(left, right).bind({ div: this.div })();
                    }.bind({ div: scene });
                    getdim.src = imgurl;
                }
                return scene;
            }
            function makeDecisionDialog(args, predicate) {
                let choices = args.options.split(";");
                let vals = args.values.split(";");
                // keys.forEach((key, i) => result[key] = values[i]);
                let dialog = makeDialog(
                    { name: "Dr {@nickname}" },
                    choices[0],
                    { name: "avg_npc_048" },
                    1
                );
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
                            }
                        );
                        opt.classList.add("selected");
                        let thispredicate = opt.getAttribute("data-predicate");
                        Object.keys(predicate).forEach((p) => {
                            predicate[p].forEach((el) => {
                                el.classList.add("hidden");
                            });
                        });
                        predicate[thispredicate].forEach((el) => {
                            el.classList.remove("hidden");
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
                colorIndex = 0
            ) {
                let wrap = document.createElement("div");
                wrap.classList.add("dialog");
                wrap.classList.add("forceShow");
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
                txt.innerHTML = dialogLine;
                wrap.appendChild(left);
                txt.prepend(nameplate);
                wrap.appendChild(txt);
                wrap.appendChild(right);
                if (args && args.name) {
                    txt.setAttribute("data-name", args.name);
                    nameplate.innerHTML = args.name;
                    txt.style.setProperty(
                        "--name-color",
                        selectColor(colorIndex)
                    );
                    Object.keys(chars).forEach((key, i) => {
                        if (chars[key] != "char_empty") {
                            let isActive =
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

                return wrap;
            }
            for (const line of lines) {
                if (line[1]) {
                    [_, cmd, args] = /\[([^\(\]]+)(?:\((.+)\))?\]/.exec(
                        line[1]
                    );
                    // stage
                    if (cmd.startsWith("name=")) {
                        args = cmd;
                    }
                    if (args) {
                        let tmp = {};
                        Array.from(
                            args.matchAll(
                                /("?[^=", ]+"?)="?((?<=")[^"]*|[^,]*)/gim
                            )
                        ).forEach((l) => {
                            tmp[l[1]] = l[2];
                        });
                        args = tmp;
                    }
                }
                if (
                    line[1] &&
                    line[1].startsWith("[name=") &&
                    line[2] &&
                    line[2].trim()
                ) {
                    // group 1&2 indicates dialog with speaker.
                    speakerList.add(args.name.toLowerCase());
                    let dlg = makeDialog(
                        args,
                        line[2],
                        chars,
                        speaker,
                        Array.from(speakerList).indexOf(args.name.toLowerCase())
                    );
                    activeReferences.forEach((r) => {
                        if (r in predicate) predicate[r].push(dlg);
                    });
                    getWorkingScene().appendChild(dlg);
                    if (
                        activeReferences.length &&
                        !activeReferences.includes(defaultPredicate)
                    )
                        dlg.classList.add("hidden");
                } else if (line[1]) {
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
                            const itemsrc =
                                "https://aceship.github.io/AN-EN-Tags/img/avg/items/" +
                                args.image +
                                ".png";
                            imgbtn.onclick = () => {
                                enlargeAvatar(itemsrc, true);
                            };
                            getWorkingScene().appendChild(wrap);
                            break;

                        case "background":
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
                                "https://aceship.github.io/AN-EN-Tags/img/avg/backgrounds/bg_black.png";

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
                                        "https://aceship.github.io/AN-EN-Tags/img/avg/images/" +
                                        args.image +
                                        ".png";
                                    break;
                                case "background":
                                    imgurl =
                                        "https://aceship.github.io/AN-EN-Tags/img/avg/backgrounds/" +
                                        args.image +
                                        ".png";
                                    lastBackgroundImage = imgurl;
                                    break;
                                case "largebg":
                                    imgurl = args.imagegroup
                                        .split("/")
                                        .slice(0, 2)
                                        .map(
                                            (x) =>
                                                "https://aceship.github.io/AN-EN-Tags/img/avg/backgrounds/" +
                                                x +
                                                ".png"
                                        );
                                    lastBackgroundImage = imgurl;
                                    break;
                            }

                            scene = createScene(
                                imgurl,
                                cmd.toLowerCase() == "image" &&
                                    args &&
                                    args.image
                            );
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
                            chars = {};
                            speaker = 0;
                            if (args && args.text) {
                                let dlg = makeDialog(null, args.text, {}, 0);
                                activeReferences.forEach((r) => {
                                    if (r in predicate) predicate[r].push(dlg);
                                });
                                getWorkingScene().appendChild(dlg);
                            }
                            break;
                        case "dialog":
                            // chars = {};
                            // speaker = 0;
                            break;
                        case "decision":
                            predicate = {};
                            defaultPredicate = args.values.split(";")[0];
                            getWorkingScene().appendChild(
                                makeDecisionDialog(args, predicate)
                            );
                            break;
                        case "predicate":
                            // predicate maps the VALUE to a list of dom objects
                            if (!args) {
                                predicate = {};
                                activeReferences = [];
                            } else {
                                activeReferences = args.references.split(";");
                                activeReferences.forEach((r) => {
                                    predicate[r] = predicate[r] || [];
                                });
                            }
                            break;
                        case "playmusic":
                        case "playsound":
                            let audio = document.createElement("audio");
                            audio.setAttribute("controls", "");
                            if (cmd.toLowerCase() == "playmusic") {
                                audio.setAttribute("loop", "");
                                audio.classList.add("music");
                            } else {
                                audio.classList.add("sound");
                            }
                            audio.setAttribute(
                                "data-defvol",
                                args.volume || 0.8
                            );

                            let sound = document.createElement("source");
                            let soundkey = /\$?(.+)/i.exec(args.key)[1];
                            let soundpath = soundMap[soundkey] || soundkey;
                            sound.src = (
                                "./sounds/assets/torappu/dynamicassets/audio/" +
                                soundpath +
                                ".wav"
                            ).toLowerCase();
                            sound.setAttribute("type", "audio/wav");
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
                                let wrap = document.createElement("div");
                                wrap.style.backgroundColor =
                                    lastBlockerColor.split(" ")[0];
                                function playSound() {
                                    if (!this.audio.paused) return;
                                    this.audio.volume =
                                        (volSlider.value / 100) *
                                        this.audio.getAttribute("data-defvol");
                                    if (this.audio.volume == 0)
                                        this.audio.volume = 0.5;
                                    playWhenReady(this.audio);
                                }
                                btn.onclick = playSound.bind({
                                    audio: audio,
                                    btn: btn,
                                });
                                wrap.appendChild(audio);
                                wrap.appendChild(btn);
                                wrap.classList.add("dialog");
                                wrap.classList.add("soundPlayer");
                                audio = wrap;
                            }
                            if (scene) scene.appendChild(audio);
                            else firstAudio = audio;
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
                                            parseFloat(args.fadetime) * 2
                                        )
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
                                    lastBlockerColor
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
                            break;
                        default:
                            // console.log("line not parsed:", line);
                            break;
                    }
                } else if (line[2]) {
                    // group 2 alone indicates speakerless text (narrator)

                    let dlg = makeDialog(null, line[2], {}, 0);
                    dlg.classList.add("narration");
                    activeReferences.forEach((r) => {
                        if (r in predicate) predicate[r].push(dlg);
                    });
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
    if (audio.classList.contains("sound")) {
        if (audio.readyState == 0) {
            audio.nextSibling.classList.add("stalled");
            audio.oncanplaythrough = () =>
                audio.nextSibling.classList.remove("stalled");
            audio.oncanplay = () =>
                audio.nextSibling.classList.remove("stalled");
        }
        audio.onplaying = () => audio.nextSibling.classList.add("playing");
        audio.onended = () => audio.nextSibling.classList.remove("playing");
    }
    if (audio.readyState > 3)
        // already ready to play
        audio.play();
    else {
        audio.oncanplaythrough = audio.play;
        audio.oncanplay = audio.play;
    }
}

function avatarImg(path) {
    // return image element with many, many fallbacks.
    let varkey = /\$?(.+)/i.exec(path)[1];
    if (varkey in soundMap) {
        path = soundMap[varkey];
    }
    let base_name = /^(.+?_\d(?=(_|#)|$)|.+?(?=(_|#)\d{1,2}$|$)|.+)/.exec(
        path
    )[1];
    let alt_name, na_name;
    let mods = path.substring(base_name.length);
    let alt_mods;
    // base_name = base_name.toLowerCase();
    // mods = mods.toLowerCase();
    // emergency repairs:
    if (base_name in charPathFixes) base_name = charPathFixes[base_name];
    if (!mods) mods = "_1"; // this will create some extra failed requests.
    if (mods.includes("#")) {
        alt_mods = mods.replace("#", "_");
    } else {
        alt_mods = mods.replace("_", "#");
    }
    if (/(_\d)$/.test(base_name)) {
        alt_name = base_name.replace(/(_\d)$/, "");
        na_name = base_name.replace(/(_\d)$/, "_na");
    } else {
        alt_name = base_name + "_1";
        na_name = base_name + "_na";
    }
    var src_array = [];
    // trying all base_name permutations first results in less misses, but also could serve the wrong image.
    if (forcedBaseNames.includes(base_name)) {
        src_array.push(base_name);
    }
    if (path == base_name) src_array.push(base_name);
    if (path == alt_name) src_array.push(alt_name);
    src_array.push(base_name + mods);
    src_array.push(alt_name + mods);
    src_array.push(base_name + alt_mods);
    src_array.push(alt_name + alt_mods);
    if (path != base_name) src_array.push(base_name);
    if (path != alt_name) src_array.push(alt_name);
    src_array.push(na_name + mods);
    src_array.push(na_name + alt_mods);
    src_array.push(na_name);
    src_array.push(base_name + "#2"); // special case for missing mayer #1 image.

    const img = document.createElement("img");
    var i = 1;
    img.onerror = function () {
        if (i < src_array.length) {
            this.src =
                "https://aceship.github.io/AN-EN-Tags/img/avg/characters/" +
                encodeURIComponent(src_array[i]) +
                ".png";
            i++;
        } else {
            this.onerror = null;
            this.src =
                "https://aceship.github.io/AN-EN-Tags/img/avatars/avg_npc_012.png";
            this.parentElement.classList.remove("npc");
            this.parentElement.classList.add("unknown");
            console.log("ALL ERROR (serve mystery npc)", src_array);
        }
    };
    img.setAttribute("loading", "lazy");
    if (avatarCoords[base_name]) {
        img.style.left = avatarCoords[base_name].x;
        img.style.top = avatarCoords[base_name].y;
        let scale = avatarCoords[base_name].s || 0.5;
        img.style.transform = `scale(${scale})`;
    }
    img.src =
        "https://aceship.github.io/AN-EN-Tags/img/avg/characters/" +
        encodeURIComponent(src_array[0]) +
        ".png";
    let wrap = document.createElement("div");
    wrap.classList.add("avatar");
    wrap.classList.add("npc");
    wrap.appendChild(img);
    wrap.onclick = (e) => {
        e.stopPropagation();
        enlargeAvatar(img.src);
    };
    return wrap;
}

const avatarModal = document.getElementById("avatarModal");
window.onclick = (e) => {
    if (e.target == avatarModal) avatarModal.style.display = "none";
};
function enlargeAvatar(src, cover = false) {
    avatarModal.style.display = "block";
    let content = avatarModal.querySelector(".modal-content");
    content.innerHTML = "";
    let im = document.createElement("img");
    im.src = src;
    if (cover) im.classList.add("item");
    content.appendChild(im);
}

//Get the button:
mybutton = document.getElementById("topBtn");
mybutton.onclick = topFunction;
titlediv = document.getElementById("storyTitle");

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = scrollFunction;
window.onresize = scrollFunction;
function adjustedMidpoint() {
    let topNavHeight =
        5 +
        5 +
        2.5 * parseFloat(getComputedStyle(document.documentElement).fontSize); // padding + height
    return window.innerHeight / 2 + topNavHeight / 2;
}
function alignBackground(s) {
    let pos = s.getBoundingClientRect();

    let midp = adjustedMidpoint();
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
                Math.max(0, midp - pos.top - imheight / 2)
            ) +
            ", calc(var(--story-width) / 2) " +
            Math.min(
                pos.height - imheight,
                Math.max(0, midp - pos.top - imheight / 2)
            );
    } else {
        s.style.backgroundPosition =
            "center " +
            Math.min(
                pos.height - imheight,
                Math.max(0, midp - pos.top - imheight / 2)
            );
    }
}
document.getElementById("playPauseBtn").onclick = () => playPauseMusic(true);
const musicState = { paused: false };
function playPauseMusic(toggle = false) {
    let midp = adjustedMidpoint();
    const allMusic = Array.from(
        document.getElementById("storyDisp").querySelectorAll(".music")
    );
    let targetMusic = allMusic[0];
    allMusic.forEach((a) => {
        let rect = a.getBoundingClientRect();
        if (rect.top < midp) {
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
function scrollFunction() {
    if (
        document.body.scrollTop > 20 ||
        document.documentElement.scrollTop > 20
    ) {
        mybutton.style.display = "block";
    } else {
        mybutton.style.display = "none";
    }
    if (
        document.body.scrollTop > 120 ||
        document.documentElement.scrollTop > 120
    ) {
        titlediv.classList.remove("hidden");
    } else {
        titlediv.classList.add("hidden");
    }
    Array.from(
        document.getElementById("storyDisp").querySelectorAll(".scene")
    ).forEach((s) => {
        alignBackground(s);
    });
    playPauseMusic();
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

const volSlider = document.getElementById("volSlider");
volSlider.oninput = () => {
    Array.from(
        document.getElementById("storyDisp").querySelectorAll(".music")
    ).forEach((a) => {
        a.volume = (volSlider.value / 100) * a.getAttribute("data-defvol");
    });
    playPauseMusic();
};

const toggleVisBtn = document.getElementById("visButton");
toggleVisBtn.onclick = () => {
    Array.from(document.querySelectorAll(".scene")).forEach((d) => {
        d.classList.toggle("invisible");
    });
    let icon = toggleVisBtn.querySelector("i");
    icon.classList.toggle("fa-eye-slash");
    icon.classList.toggle("fa-eye");
};
const toggleSfxBtn = document.getElementById("sfxButton");
toggleSfxBtn.onclick = () => {
    Array.from(document.querySelectorAll(".dialog.soundPlayer")).forEach(
        (d) => {
            d.classList.toggle("invisible");
        }
    );
    scrollFunction();
    let icon = toggleSfxBtn.querySelector("i");
    icon.classList.toggle("fa-volume-up");
    icon.classList.toggle("fa-volume-mute");
};

function reapplyToggles() {
    let icon = toggleSfxBtn.querySelector("i");
    if (icon.classList.contains("fa-volume-up")) {
        icon.classList.remove("fa-volume-up");
        icon.classList.add("fa-volume-mute");
        toggleSfxBtn.click();
    }
    icon = toggleVisBtn.querySelector("i");
    if (icon.classList.contains("fa-eye")) {
        icon.classList.add("fa-eye-slash");
        icon.classList.remove("fa-eye");
        toggleVisBtn.click();
    }
}

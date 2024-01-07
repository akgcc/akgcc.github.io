let recruitDetail;
let RECRUIT_POOL = {};
let TAGS = {};
let TAG_MAP = {};
let TAG_NAME_MAP = {};
let TAG_CATEGORIES = {
	Rarity: [28, 17, 14, 11],
	Position: [9, 10],
	// Class: [1, 4, 8, 6, 2, 3, 5, 7], // aceship order
	Class: [8, 1, 3, 2, 6, 4, 5, 7], // in-game order
	Affix: [15, 16, 19, 21, 23, 20, 22, 24, 26, 12, 13, 27, 25, 18],
};
const OP_NAME_SUBSTITUTIONS = {
	"justice knight": "'justice knight'",
};
let TAG_STACK = [];
let highlightedTag;
let noobMode = localStorage.getItem("noobMode") === "true";
let showRobots = ["true", null].includes(localStorage.getItem("showRobots"));
let selectedTags = new Set();
let currentAutocomplete;
const opTagList = document.createElement("div");
let selectedOp;
const params = new URLSearchParams(window.location.search);
params.get("tags") &&
	params
		.get("tags")
		.split(",")
		.forEach((tag) => selectedTags.add(tag));
fetch(`${DATA_BASE[serverString]}/gamedata/excel/gacha_table.json`)
	.then((res) => fixedJson(res))
	.then((js) => {
		recruitDetail = js?.recruitDetail || "";
		TAGS = js?.gachaTags;
		return get_char_table(false, serverString);
	})
	.then((json) => {
		if (!getRecruitList(json)) {
			// there was an error parsing recruit list, display an error instead of functioning
			TAGS = [];
			RECRUIT_POOL = {};
			let tr = document.createElement("tr");
			let td = document.createElement("td");
			tr.appendChild(td);
			td.colSpan = 2;
			td.style.textAlign = "center";
			td.innerHTML = "Error fetching recruitment data";
			tagTable.appendChild(tr);
			return;
		}
		TAGS.forEach((tag) => {
			TAG_MAP[tag.tagId] = tag;
			TAG_NAME_MAP[tag.tagName] = tag;
		});

		Object.keys(TAG_CATEGORIES).forEach((category) => {
			let tr = document.createElement("tr");
			let label = document.createElement("td");
			label.innerHTML = category;
			let btns = document.createElement("td");
			if (["Affix"].includes(category))
				TAG_CATEGORIES[category].sort((a, b) =>
					TAG_MAP[a].tagName.localeCompare(TAG_MAP[b].tagName),
				);
			TAG_CATEGORIES[category].forEach((tagid) => {
				TAG_MAP[tagid].tagCat = category;
				let btn = document.createElement("div");
				btn.classList.add("button");
				btn.dataset.tagId = tagid;
				btn.innerHTML = TAG_MAP[tagid].tagName;
				if (selectedTags.has(TAG_MAP[tagid].tagName)) {
					selectedTags.add(String(TAG_MAP[tagid].tagGroup));
					TAG_STACK.push(tagid);
					btn.classList.add("checked");
				}
				btn.dataset.tagGroup = TAG_MAP[tagid].tagGroup;
				btn.onclick = (e) => {
					selectTag(e.currentTarget);
				};
				btns.appendChild(btn);
			});

			tr.appendChild(label);
			tr.appendChild(btns);
			tagTable.appendChild(tr);
		});
		function selectTag(el) {
			if (el.classList.contains("checked")) {
				selectedTags.delete(el.dataset.tagGroup);
				const index = TAG_STACK.indexOf(el.dataset.tagId);
				if (index > -1) {
					TAG_STACK.splice(index, 1);
				}
			} else if (selectedTags.size < 10) {
				selectedTags.add(el.dataset.tagGroup);
				TAG_STACK.push(el.dataset.tagId);
			} else {
				// set is full don't do anything.
				return;
			}
			tagTable.dataset.tooMany = selectedTags.size > 5;
			el.classList.toggle("checked");
			calculateResults();
		}
		selectedTags.forEach((tag) => {
			if (TAG_MAP[tag] === undefined) selectedTags.delete(tag);
		});
		tagTable.dataset.tooMany = selectedTags.size > 5;
		calculateResults();

		TAG_NAMES = Object.values(TAG_MAP)
			.filter((v) => v.tagCat !== undefined)
			.map((v) => v.tagName);
		// Add event listener for input event
		tagInput.addEventListener("input", function (e) {
			const inputValue = this.value.toLowerCase();
			let filteredOptions = [];
			if (inputValue.length)
				filteredOptions = TAG_NAMES.filter(
					(option) =>
						option.toLowerCase().startsWith(inputValue) &&
						!selectedTags.has(String(TAG_NAME_MAP[option].tagId)),
				);
			showAutocompleteOptions(filteredOptions);
		});
		tagInput.addEventListener("keydown", function (event) {
			if (event.key === "Enter") {
				if (currentAutocomplete) {
					// TAG_MAP[currentAutocomplete];
					if (highlightedTag)
						highlightedTag.classList.remove("highlight");
					selectTag(
						document.querySelector(
							`#tagList .button[data-tag-id="${currentAutocomplete}"]`,
						),
					);
					TAG_STACK.push(currentAutocomplete);
					// this.value += currentAutocomplete.slice(this.value.length);
					this.value = "";
					event.preventDefault();
				}
			} else if (
				event.key === "Backspace" &&
				!this.value &&
				TAG_STACK.length
			) {
				selectTag(
					document.querySelector(
						`#tagList .button[data-tag-id="${TAG_STACK.pop()}"]`,
					),
				);
			} else if (event.key == "Escape") {
				this.value = "";
				resetAll();
			}
		});
		tagInput.addEventListener("focusout", function (event) {
			tagTable.dataset.typing = false;
		});
		tagInput.addEventListener("focusin", function (event) {
			tagTable.dataset.typing = true;
		});

		// Function to show the autocomplete options
		function showAutocompleteOptions(options) {
			if (highlightedTag) highlightedTag.classList.remove("highlight");
			currentAutocomplete = null;
			if (options.length < 1) return;
			options.sort((a, b) => a.length - b.length);
			currentAutocomplete = TAG_NAME_MAP[options[0]].tagId;
			highlightedTag = document.querySelector(
				`#tagList .button[data-tag-id="${currentAutocomplete}"]`,
			);
			highlightedTag.classList.add("highlight");
		}
	});
const tagInput = document.getElementById("tagInput");
const tagTable = document.querySelector("#tagList tbody");
const resultsTable = document.querySelector("#recruitResults tbody");
function calculateResults() {
	// use selectedTags to determine which ops are available then populate the results table.
	// naive approach with a ton of nested loops, but should be fast because recruit pool is small
	params.set(
		"tags",
		Array.from(selectedTags)
			.map((i) => TAG_MAP[i].tagName)
			.join(","),
	);
	if (selectedTags.size === 0) params.delete("tags");
	window.history.replaceState(
		null,
		"",
		window.location.pathname + "?" + decodeURIComponent(params.toString()),
	);
	resultsTable.innerHTML = "";
	let groups = [];
	getCombinations(selectedTags).forEach((combo) => {
		if (combo.length === 0) return;
		let tags = combo.map((i) => TAG_MAP[i]);
		let matches = [];
		let hasTopOp = combo.includes("11");
		Object.values(RECRUIT_POOL)
			.filter((op) => hasTopOp || op.rarity < 5)
			.forEach((op) => {
				if (
					tags.every((tag) => {
						switch (tag.tagCat) {
							case "Position":
								// return op.position == tag.tagName.toUpperCase();
								switch (tag.tagId) {
									case 9:
										return op.position === "MELEE";
									case 10:
										return op.position === "RANGED";
								}
							case "Rarity":
								switch (tag.tagId) {
									case 17:
										return op.rarity === 1;
									case 14:
										return op.rarity === 4;
									case 11:
										return op.rarity === 5;
									case 28:
										return op.rarity === 0;
								}
							case "Class":
								// return op.profession === tag.tagName.toUpperCase();
								switch (tag.tagId) {
									case 1:
										return op.profession === "Guard";
									case 2:
										return op.profession === "Sniper";
									case 3:
										return op.profession === "Defender";
									case 4:
										return op.profession === "Medic";
									case 5:
										return op.profession === "Supporter";
									case 6:
										return op.profession === "Caster";
									case 7:
										return op.profession === "Specialist";
									case 8:
										return op.profession === "Vanguard";
								}
							case "Affix": // case "Affix"
								switch (tag.tagId) {
									//aceship puts robot in the affix list, but I WONT
									// case 28:
									// 	return op.rarity === 0;
									default:
										return op.tagList.includes(tag.tagName);
								}
						}
					})
				) {
					matches.push(op);
				}
			});

		let newGroup = {
			tags: tags,
			matches: matches,
			lowest9hrRarity: matches.reduce(
				(minr, op) =>
					op.rarity < 2 ? minr : Math.min(minr, op.rarity),
				99,
			),
			highestRarity: matches.reduce(
				(maxr, op) => Math.max(maxr, op.rarity),
				0,
			),
			nineHourOpCount: matches.reduce(
				(count, op) => (op.rarity > 1 ? count + 1 : count),
				0,
			),
		};
		// handle special cases involving "Starter" and "Robot" tag
		// use 3.5 rarity for robots, placing them above 4* but below 5* (this also shows them even when show 2/3* is unchecked)
		if (newGroup.lowest9hrRarity == 99) {
			lowestRarity = newGroup.matches.reduce(
				(minr, op) => Math.min(minr, op.rarity),
				99,
			);
			newGroup.lowest9hrRarity =
				lowestRarity == 0 && showRobots ? 3.5 : lowestRarity;
			newGroup.nineHourOpCount = newGroup.matches.length;
		}
		newGroup.matches.sort((a, b) => {
			// Sort by rarity (ascending order), with non 740 at the end
			if (a.rarity !== b.rarity) {
				// put robots at the front if show 1* is checked
				if (showRobots && newGroup.lowest9hrRarity === 3) {
					if (a.rarity === 0) return -1;
					if (b.rarity === 0) return 1;
				}
				if (a.rarity < 2) {
					return b.rarity < 2 ? b.rarity - a.rarity : 1;
				} else if (b.rarity < 2) {
					return -1;
				} else {
					return a.rarity - b.rarity;
				}
			}
			// If rarity is the same, sort by name (alphabetical order)
			return a.name.localeCompare(b.name);
		});
		groups.push(newGroup);
	});
	let fullResultSize = groups.length;
	if (!noobMode) {
		groups = groups.filter((g) => g.lowest9hrRarity > 2);
	} else if (!showRobots)
		groups = groups.filter((g) => g.lowest9hrRarity > 0);
	groups.sort((a, b) => {
		if (b.lowest9hrRarity !== a.lowest9hrRarity)
			return b.lowest9hrRarity - a.lowest9hrRarity;
		if (b.highestRarity !== a.highestRarity)
			return b.highestRarity - a.highestRarity;
		return a.nineHourOpCount - b.nineHourOpCount;
	});
	groups.forEach((group) => {
		if (group.matches.length === 0) return;
		let tr = document.createElement("tr");
		let label = document.createElement("td");
		group.tags.forEach((tag) => {
			let el = document.createElement("div");
			el.innerHTML = tag.tagName;
			el.classList.add("tag");
			label.appendChild(el);
		});
		let ops = document.createElement("td");
		group.matches.forEach((op) => {
			let el = CreateOpCheckbox(op, null, null, null, null, ops);
			el.dataset.recruitOnly = op.recruitOnly;
			el.onclick = (e) => {
				if (selectedOp) selectedOp.classList.toggle("checked");
				if (e.currentTarget.isEqualNode(selectedOp)) {
					opTagList.parentElement.removeChild(opTagList);
					selectedOp = null;
					return;
				}
				selectedOp = e.currentTarget;
				selectedOp.classList.toggle("checked");
				opTagList.innerHTML = "";
				let tags = [];
				switch (op.rarity) {
					case 0:
						tags.push(TAG_MAP[28].tagName);
						break;
					case 1:
						tags.push(TAG_MAP[17].tagName);
						break;
					case 4:
						tags.push(TAG_MAP[14].tagName);
						break;
					case 5:
						tags.push(TAG_MAP[11].tagName);
						break;
				}
				switch (op.position) {
					case "MELEE":
						tags.push(TAG_MAP[9].tagName);
						break;
					case "RANGED":
						tags.push(TAG_MAP[10].tagName);
						break;
				}
				tags = [...new Set(tags.concat(op.tagList))];
				tags.forEach((tag) => {
					let el = document.createElement("div");
					el.innerHTML = tag;
					el.classList.add("tag");
					opTagList.appendChild(el);
				});
				e.currentTarget.parentElement.appendChild(opTagList);
			};
		});
		tr.appendChild(label);
		tr.appendChild(ops);
		resultsTable.appendChild(tr);
	});
	if (!noobMode || !showRobots) {
		let omitted = fullResultSize - groups.length;
		if (omitted > 0) {
			let tr = document.createElement("tr");
			let td = document.createElement("td");
			tr.appendChild(td);
			td.colSpan = 2;
			td.style.textAlign = "center";
			td.innerHTML = `(${omitted} ${
				omitted === 1 ? "row" : "rows"
			} omitted)`;
			resultsTable.appendChild(tr);
		}
	}
}

function getCombinations(set) {
	//written by chatGPT
	const elements = Array.from(set);
	const combinations = [[]];

	for (let i = 0; i < elements.length; i++) {
		const currentSubsetLength = combinations.length;

		for (let j = 0; j < currentSubsetLength; j++) {
			const subset = [...combinations[j], elements[i]];
			combinations.push(subset);
		}
	}

	return combinations;
}
const robotToggle = document.getElementById("showRobots");
if (showRobots) robotToggle.classList.add("checked");
robotToggle.onclick = (e) => {
	showRobots = !showRobots;
	e.currentTarget.classList.toggle("checked");
	localStorage.setItem("showRobots", showRobots);
	calculateResults();
};
const noobToggle = document.getElementById("noobMode");
if (noobMode) noobToggle.classList.add("checked");
noobToggle.onclick = (e) => {
	noobMode = !noobMode;
	e.currentTarget.classList.toggle("checked");
	localStorage.setItem("noobMode", noobMode);
	calculateResults();
};
function resetAll() {
	selectedTags.clear();
	TAG_STACK = [];
	document
		.querySelectorAll("#tagList .button")
		.forEach((el) => el.classList.remove("checked", "highlight"));
	calculateResults();
}
document.getElementById("reset").onclick = () => {
	resetAll();
};
function getRecruitList(char_table) {
	let name_map = {};
	let recruit_names = new Set();
	let all_ops = new Set(
		Object.values(char_table).map((x) => x.name.toLowerCase()),
	);
	Object.values(char_table).forEach(
		(v) => (name_map[v.name.toLowerCase()] = v),
	);
	if (
		![
			...recruitDetail.matchAll(
				/(?<!>\s)<@rc\.eml>([^,，]*?)<\/>|(?:\/\s*|\n\s*|\\n\s*)((?!-)[^\r\/>★]+?(?<!-))(?=\/|$)/gim,
			),
		].every((m) => {
			let opname = m[1] ?? m[2];
			opname = opname.trim().toLowerCase();
			opname = OP_NAME_SUBSTITUTIONS[opname] || opname;
			if (Object.keys(name_map).includes(opname)) {
				let op = name_map[opname];
				op.recruitOnly = !!m[1];
				RECRUIT_POOL[op.charId] = op;
				recruit_names.add(opname);
				return true;
			} else {
				//sanity check: we expect EVERY match to be a valid op
				return false;
			}
		})
	) {
		return false;
	}
	// now do a sanity check:
	// match every string in recruitDetail for valid operator names
	// check if the resulting set is a subset of recruit_names
	let op_matches = new Set();
	all_word_matches = new Set([...recruitDetail.matchAll(/[^\s\\><]+/gim)]);
	all_word_matches.forEach((m) => {
		let name = m[0].toLowerCase();
		if (all_ops.has(name)) {
			op_matches.add(name);
		}
	});
	if (!isSuperset(recruit_names, op_matches)) return false;
	return true;
}
function isSuperset(set, subset) {
	for (const elem of subset) {
		if (!set.has(elem)) {
			return false;
		}
	}
	return true;
}

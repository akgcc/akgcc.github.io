let recruitDetail;
let RECRUIT_POOL = {};
let TAGS = {};
let TAG_MAP = {};
let TAG_CATEGORIES = {
	Qualification: [17, 14, 11],
	Position: [9, 10],
	Class: [1, 4, 8, 6, 2, 3, 5, 7],
	Affix: [15, 16, 19, 21, 23, 20, 22, 24, 26, 12, 13, 27, 25, 18, 28],
};
let noobMode = localStorage.getItem("noobMode") === "true";
let selectedTags = new Set();
const params = new URLSearchParams(window.location.search);
params.get("tags") &&
	params
		.get("tags")
		.split(",")
		.forEach((tag) => selectedTags.add(tag));
fetch(
	"https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/" +
		serverString +
		"/gamedata/excel/gacha_table.json"
)
	.then((res) => fixedJson(res))
	.then((js) => {
		recruitDetail = js?.recruitDetail || "";
		TAGS = js?.gachaTags;
		return get_char_table(false, serverString);
	})
	.then((json) => {
		let name_map = {};
		Object.values(json).forEach((v) => (name_map[v.name] = v));

		[
			...recruitDetail.matchAll(
				/<@rc\.eml>(.*?)<\/>|(?:\/\s*|\\n)([^\/]+?)(?=\s\/|$|\\)/gim
			),
		].forEach((m) => {
			let opname = m[1] ?? m[2];
			opname = opname.trim();
			if (Object.keys(name_map).includes(opname)) {
				let op = name_map[opname];
				op.recruitOnly = !!m[1];
				RECRUIT_POOL[op.charId] = op;
			}
		});

		TAGS.forEach((tag) => {
			TAG_MAP[tag.tagId] = tag;
		});
		const table = document.querySelector("#tagList tbody");
		Object.keys(TAG_CATEGORIES).forEach((category) => {
			let tr = document.createElement("tr");
			let label = document.createElement("td");
			label.innerHTML = category;
			let btns = document.createElement("td");
			TAG_CATEGORIES[category].forEach((tagid) => {
				TAG_MAP[tagid].tagCat = category;
				let btn = document.createElement("div");
				btn.classList.add("button");
				btn.innerHTML = TAG_MAP[tagid].tagName;
				if (selectedTags.has(TAG_MAP[tagid].tagName)) {
					selectedTags.add(String(TAG_MAP[tagid].tagGroup));
					btn.classList.add("checked");
				}
				btn.dataset.tagGroup = TAG_MAP[tagid].tagGroup;
				btn.onclick = (e) => {
					if (btn.classList.contains("checked")) {
						selectedTags.delete(e.currentTarget.dataset.tagGroup);
					} else if (selectedTags.size < 7) {
						selectedTags.add(e.currentTarget.dataset.tagGroup);
					} else {
						// set is full don't do anything.
						return;
					}

					e.currentTarget.classList.toggle("checked");
					calculateResults();
				};
				btns.appendChild(btn);
			});

			tr.appendChild(label);
			tr.appendChild(btns);
			table.appendChild(tr);
		});
		selectedTags.forEach((tag) => {
			if (TAG_MAP[tag] === undefined) selectedTags.delete(tag);
		});

		calculateResults();
	});
const resultsTable = document.querySelector("#recruitResults tbody");
function calculateResults() {
	// use selectedTags to determine which ops are available then populate the results table.
	// naive approach with a ton of nested loops, but should be fast because recruit pool is small
	params.set(
		"tags",
		Array.from(selectedTags)
			.map((i) => TAG_MAP[i].tagName)
			.join(",")
	);
	if (selectedTags.size === 0) params.delete("tags");
	window.history.replaceState(
		null,
		"",
		window.location.pathname + "?" + decodeURIComponent(params.toString())
	);
	resultsTable.innerHTML = "";
	let groups = [];
	getCombinations(selectedTags).forEach((combo) => {
		if (combo.length === 0) return;
		tags = combo.map((i) => TAG_MAP[i]);
		matches = [];
		Object.values(RECRUIT_POOL)
			.filter((op) => op.rarity !== 5 || selectedTags.has("11"))
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
							case "Qualification":
								switch (tag.tagId) {
									case 17:
										return op.rarity === 1;
									case 14:
										return op.rarity === 4;
									case 11:
										return op.rarity === 5;
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
									//aceship puts robot in the affix list:
									case 28:
										return op.rarity === 0;
									default:
										return op.tagList.includes(tag.tagName);
								}
						}
					})
				) {
					matches.push(op);
				}
			});
		matches.sort((a, b) => {
			// Sort by rarity (descending order)
			if (b.rarity !== a.rarity) {
				return b.rarity - a.rarity;
			}
			// If rarity is the same, sort by name (alphabetical order)
			return a.name.localeCompare(b.name);
		});
		groups.push({
			tags: tags,
			matches: matches,
			lowestNonBotRarity: matches.reduce(
				(minr, op) =>
					op.rarity == 0 ? minr : Math.min(minr, op.rarity),
				6
			),
		});
	});
	if (!noobMode) {
		groups = groups.filter((g) => g.lowestNonBotRarity > 2);
	}
	groups.sort((a, b) => {
		if (b.lowestNonBotRarity !== a.lowestNonBotRarity)
			return b.lowestNonBotRarity - a.lowestNonBotRarity;
		return b.matches.length - a.matches.length;
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
		});
		tr.appendChild(label);
		tr.appendChild(ops);
		resultsTable.appendChild(tr);
	});
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

const noobToggle = document.getElementById("noobMode");
if (noobMode) noobToggle.classList.add("checked");
noobToggle.onclick = (e) => {
	noobMode = !noobMode;
	e.currentTarget.classList.toggle("checked");
	localStorage.setItem("noobMode", noobMode);
	calculateResults();
};

document.getElementById("reset").onclick = () => {
	selectedTags.clear();
	document
		.querySelectorAll("#tagList .button")
		.forEach((el) => el.classList.remove("checked"));
	calculateResults();
};

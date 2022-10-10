const ISLIST = ["#1", "#2", "#3"];
const itemList = document.getElementById("itemList");
const rarityMap = {
	NORMAL: "n",
	RARE: "r",
	SUPER_RARE: "sr",
};
if (!window.location.hash || !ISLIST.includes(window.location.hash))
	window.location.hash = ISLIST.slice(-1)[0];
ISLIST.reverse().forEach((is) => {
	const a = document.createElement("a");
	a.classList.add("rightButton");
	a.classList.add("button");
	a.classList.add("isb");
	if (is == window.location.hash) a.classList.add("checked");
	a.innerHTML = is;
	document.getElementById("topNav").querySelector(".nav-right").prepend(a);
	a.addEventListener("click", () => {
		loadItems(is.substring(1));
		document
			.querySelectorAll("#topNav .nav-right > .isb")
			.forEach((e) => e.classList.remove("checked"));
		a.classList.add("checked");
		window.location.hash = a.innerHTML;
	});
});
loadItems(window.location.hash.substring(1));
function loadItems(is) {
	itemList.innerHTML = "";
	let source;
	switch (parseInt(is)) {
		case 1:
			source = fetch("./json/" + serverString + "/roguelike_table.json");
			break;
		case 3:
			// CN exclusive
			source = fetch(
				"https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/" +
					"zh_CN" +
					"/gamedata/excel/roguelike_topic_table.json"
			);
			break;
		default:
			source = fetch(
				"https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/" +
					serverString +
					"/gamedata/excel/roguelike_topic_table.json"
			);
			break;
	}
	source
		.then((res) => fixedJson(res))
		.then((js) => {
			let table;
			switch (parseInt(is)) {
				case 1:
					table = js.itemTable.items;
					break;
				case 2:
					table = js.details.rogue_1.items;
					break;
				default:
					table = js.details.rogue_2.items;
					break;
			}
			for (const [key, value] of Object.entries(table)) {
				if (value.description && value.description.trim())
					addItem(value);
			}
		});
}
function addItem(data) {
	let item = document.createElement("div");
	item.classList.add("rl_item");
	let item_rarity = rarityMap[data.rarity] || "n";
	item.setAttribute("rarity", item_rarity);
	["bg", "top", "bot", "btn"].forEach((n) => {
		item.style.setProperty(
			`--${n}-url`,
			`url(/../images/rl_${item_rarity}_${n}.png)`
		);
	});
	let title = document.createElement("div");
	title.classList.add("rl_title");
	let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	let txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
	txt.innerHTML = data.name;
	txt.setAttribute("x", "50%");
	txt.setAttribute("y", "50%");
	txt.setAttribute("dominant-baseline", "central");
	txt.setAttribute("text-anchor", "middle");
	txt.setAttribute("lengthAdjust", "spacingAndGlyphs");
	svg.appendChild(txt);
	title.appendChild(svg);
	let img_wrapper = document.createElement("div");
	img_wrapper.classList.add("rl_img_wrap");
	let img = document.createElement("img");
	img.classList.add("rl_img");
	img.setAttribute("loading", "lazy");
	const src_array = [];
	if (data.iconId.match(/capsule/)) {
		src_array.push(`./images/${data.iconId}.png`);
		item.classList.add("capsule");
		item.style.setProperty(`--bg-url`, `url(../images/${data.iconId}.png)`);
	} else src_array.push(`${IMG_SOURCE}ui/roguelike/item/${data.iconId}.png`);
	src_array.push(`${ROGUELIKE_LOCAL_IMAGE_SOURCE}${data.iconId}.png`);
	img.src = src_array[0];
	var i = 1;
	img.onerror = function () {
		if (i < src_array.length) {
			this.src = src_array[i++];
		} else {
			this.src = `${IMG_SOURCE}items/MTL_SL_G2.png`;
			this.parentElement.classList.add("unknown");
			this.onerror = null;
		}
	};
	img_wrapper.appendChild(img);
	let inner = document.createElement("div");
	inner.classList.add("rl_inner");
	let desc = document.createElement("div");
	desc.classList.add("rl_desc");
	desc.innerHTML = data.description;
	let unlock = document.createElement("div");
	unlock.classList.add("rl_unlock");
	unlock.innerHTML = data.unlockCondDesc;
	let effect = document.createElement("div");
	effect.classList.add("rl_effect");
	effect.innerHTML = data.usage;
	let spacer = document.createElement("div");
	spacer.classList.add("rl_inner_spacer");
	let bot_border = document.createElement("div");
	bot_border.classList.add("rl_bottom_trim");
	inner.appendChild(title);
	inner.appendChild(img_wrapper);
	inner.appendChild(desc);
	if (data.unlockCondDesc) {
		inner.appendChild(unlock);
	}
	inner.appendChild(spacer);
	item.appendChild(inner);
	item.appendChild(effect);
	item.appendChild(bot_border);
	itemList.appendChild(item);

	let totalTextLen =
		data.description.length +
		(data.unlockCondDesc ? data.unlockCondDesc.length : 0) +
		data.usage.length;
	if (totalTextLen > 500) item.classList.add("smallText");

	// squish title text
	let nameWidth = getTextWidth(data.name, getCanvasFontSize(title));
	let itemWidth = parseInt(getComputedStyle(item).width);
	if (nameWidth > itemWidth * 0.95)
		txt.setAttribute("textLength", itemWidth * 0.95);
	return item;
}

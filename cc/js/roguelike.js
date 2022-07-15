fetch(
	"https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/" +
		serverString +
		"/gamedata/excel/roguelike_topic_table.json"
)
	.then((res) => fixedJson(res))
	.then((js) => {
		for (const [key, value] of Object.entries(js.details.rogue_1.items)) {
			if (value.description && value.description.trim()) addItem(value);
		}
	});
const itemList = document.getElementById("itemList");
const rarityMap = {
	NORMAL: "n",
	RARE: "r",
	SUPER_RARE: "sr",
};
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
	if (data.iconId.match(/capsule/)) {
		img.src = `./images/${data.iconId}.png`;
		item.classList.add("capsule");
		item.style.setProperty(`--bg-url`, `url(../images/${data.iconId}.png)`);
	} else
		img.src = `https://aceship.github.io/AN-EN-Tags/img/ui/roguelike/item/${data.iconId}.png`;
	img.onerror = function () {
		this.src =
			"https://aceship.github.io/AN-EN-Tags/img/items/MTL_SL_G2.png";
		this.classList.add("unknown");
	};
	img_wrapper.appendChild(img);
	let inner = document.createElement("div");
	inner.classList.add("rl_inner");
	let desc = document.createElement("div");
	desc.classList.add("rl_desc");
	desc.innerHTML = data.description;
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
	inner.appendChild(spacer);
	item.appendChild(inner);
	item.appendChild(effect);
	item.appendChild(bot_border);
	itemList.appendChild(item);

	// squish title text
	let nameWidth = getTextWidth(data.name, getCanvasFontSize(title));
	let itemWidth = parseInt(getComputedStyle(item).width);
	if (nameWidth > itemWidth * 0.95)
		txt.setAttribute("textLength", itemWidth * 0.95);
	return item;
}

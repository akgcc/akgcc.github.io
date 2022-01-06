const serverString = localStorage.getItem("server") || "en_US";

fetch(
	serverString == "zh_CN"
		? "https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/" +
				serverString +
				"/gamedata/excel/roguelike_topic_table.json"
		: "https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/" +
				serverString +
				"/gamedata/excel/roguelike_table.json"
)
	.then((res) => res.json())
	.then((js) => {
		if (serverString == "zh_CN") {
			for (const [key, value] of Object.entries(
				js.details.rogue_1.items
			)) {
				if (value.description && value.description.trim())
					addItem(value);
			}
		} else
			for (const [key, value] of Object.entries(js.itemTable.items)) {
				if (value.description && value.description.trim())
					addItem(value);
			}
	});
const itemList = document.getElementById("itemList");
function addItem(data) {
	let item = document.createElement("div");
	item.classList.add("rl_item");
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
	img.src = `https://aceship.github.io/AN-EN-Tags/img/ui/roguelike/item/${data.iconId}.png`;
	img.onerror = function () {
		this.src =
			"https://aceship.github.io/AN-EN-Tags/img/items/MTL_SL_G2.png";
		this.classList.add("unknown");
	};
	img_wrapper.appendChild(img);
	let desc = document.createElement("div");
	desc.classList.add("rl_desc");
	desc.innerHTML = data.description;
	let effect = document.createElement("div");
	effect.classList.add("rl_effect");
	effect.innerHTML = data.usage;
	item.appendChild(title);
	item.appendChild(img_wrapper);
	item.appendChild(desc);
	item.appendChild(effect);
	itemList.appendChild(item);

	// squish title text
	let nameWidth = getTextWidth(data.name, getCanvasFontSize(title));
	let itemWidth = parseInt(getComputedStyle(item).width);
	if (nameWidth > itemWidth * 0.95) txt.setAttribute("textLength", "95%");
	return item;
}

const SERVERS = {
	EN: "en_US",
	JP: "ja_JP",
	KR: "ko_KR",
	CN: "zh_CN",
};
const serverSelect = document.getElementById("serverSelect");
Object.keys(SERVERS).forEach((k) => {
	let opt = document.createElement("option");
	opt.value = SERVERS[k];
	opt.innerHTML = k;
	serverSelect.appendChild(opt);
});
serverSelect.onchange = () => {
	localStorage.setItem("server", serverSelect.value);
	sessionStorage.setItem("userChange", true);
	location.reload();
};

Array.from(serverSelect.options).forEach((opt, i) => {
	if (opt.value == serverString) opt.selected = true;
	else opt.selected = false;
});

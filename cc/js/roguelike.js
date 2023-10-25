const itemList = document.getElementById("itemList");
const BANNED_TYPES = ["TOTEM", "TOTEM_EFFECT", "FEATURE", "VISION"];
const rarityMap = {
	NORMAL: "n",
	RARE: "r",
	SUPER_RARE: "sr",
};
const buttonMap = {};
let ISLIST = ["#1"];
fetch(`${DATA_BASE[SERVERS.CN]}/gamedata/excel/zone_table.json`)
	.then((res) => fixedJson(res))
	.then((zonedata) => {
		Object.values(zonedata.zones)
			.filter((x) => x.type == "ROGUELIKE")
			.forEach((element, index) => {
				ISLIST.push(`#${index + 2}`);
			});
		return ISLIST;
	})
	.then((ISLIST) => {
		ISLIST.reverse().forEach((is) => {
			const a = document.createElement("a");
			buttonMap[is.substring(1)] = a;
			a.classList.add("rightButton");
			a.classList.add("button");
			a.classList.add("isb");
			if (is == window.location.hash) a.classList.add("checked");
			a.innerHTML = is;
			document
				.getElementById("topNav")
				.querySelector(".nav-right")
				.prepend(a);
			a.addEventListener("click", () => {
				window.location.hash = is; // will trigger loadItems()
			});
		});
		if (!window.location.hash || !ISLIST.includes(window.location.hash)) {
			history.replaceState(null, "", ISLIST[0]);
		}
		window.onhashchange = () =>
			loadItems(window.location.hash.substring(1));
		loadItems(window.location.hash.substring(1));
	});

async function fetchItemTable(is) {
	let resp, js;
	switch (parseInt(is)) {
		case 1:
			resp = await fetch(
				"./json/" + serverString + "/roguelike_table.json",
			);
			js = await fixedJson(resp);
			table = js.itemTable.items;
			break;
		default:
			resp = await fetch(
				`${DATA_BASE[serverString]}/gamedata/excel/roguelike_topic_table.json`,
			);
			js = await fixedJson(resp);
			table = js.details?.[`rogue_${is - 1}`]?.items;
			break;
	}
	if (!table) {
		// fallback to CN data
		resp = await fetch(
			`${
				DATA_BASE[SERVERS.CN]
			}/gamedata/excel/roguelike_topic_table.json`,
		);
		js = await fixedJson(resp);
		table = js.details[`rogue_${is - 1}`].items;
	}
	return table;
}
function loadItems(is) {
	itemList.innerHTML = "";
	fetchItemTable(is).then((table) => {
		const variants_table = {};
		const IS_VARIANT = /_[abcd]$/;
		Object.values(table)
			.filter((r) => r.id.match(IS_VARIANT))
			.forEach((v) => {
				base = v.id.replace(IS_VARIANT, "");
				variants_table[base] = variants_table[base] || [];
				variants_table[base].push(v);
			});
		const filtered_keys = Object.keys(table).filter(
			(key) =>
				!BANNED_TYPES.includes(table[key].type) &&
				table[key].description &&
				table[key].description.trim() &&
				!key.match(IS_VARIANT),
		);
		const filtered_table = filtered_keys.reduce((acc, key) => {
			acc[key] = table[key];
			return acc;
		}, {});
		for (const [key, value] of Object.entries(filtered_table)) {
			addItem(value, variants_table[key]);
		}
		document
			.querySelectorAll("#topNav .nav-right > .isb")
			.forEach((e) => e.classList.remove("checked"));
		buttonMap[is].classList.add("checked");
	});
}
function addItem(data, variants = undefined) {
	let item = document.createElement("div");
	item.classList.add("rl_item");
	let item_rarity = rarityMap[data.rarity] || "n";
	item.setAttribute("rarity", item_rarity);
	["bg", "top", "bot", "btn"].forEach((n) => {
		item.style.setProperty(
			`--${n}-url`,
			`url(/../images/rl_${item_rarity}_${n}.png)`,
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
	let mtl = document.createElement("div");
	mtl.classList.add("mtl_title");
	let centered = document.createElement("p");
	centered.innerHTML = data.name;
	mtl.appendChild(centered);
	title.appendChild(mtl);
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
	const effect = document.createElement("div");
	effect.classList.add("rl_effect");
	effect.innerHTML = data.usage;
	let spacer = document.createElement("div");
	spacer.classList.add("rl_inner_spacer");
	let bot_border = document.createElement("div");
	bot_border.classList.add("rl_bottom_trim");

	if (variants) {
		let btn_container = document.createElement("div");
		btn_container.classList.add("variant_selectors");
		inner.appendChild(btn_container);
		variants.forEach((v) => {
			let btn = document.createElement("div");
			btn.classList.add("variantBtn");
			btn.innerHTML = v.name[v.name.length - 1];
			btn_container.appendChild(btn);
			btn.addEventListener("click", (e) => {
				let wasChecked = btn.classList.contains("checked");
				if (wasChecked) {
					//revert to normal data
					effect.innerHTML = data.usage;
				} else {
					btn.parentElement
						.querySelectorAll(".variantBtn")
						.forEach((e) => e.classList.remove("checked"));
					// show data for this one
					effect.innerHTML = v.usage;
				}

				btn.classList.toggle("checked");
			});
		});
	}

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

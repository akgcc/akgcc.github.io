const CCMAP = {
	'#4': {
		tag: '-cc4clear',
		title: 'Operation Lead Seal (CC#4)'
	},
	'#3': {
		tag: '-cc3clear',
		title: 'Operation Cinder (CC#3)'
	},
	'#2': {
		tag: '-cc2clear',
		title: 'Operation Blade (CC#2)'
	},
	'#b': {
		tag: '-ccb',
		title: 'Operation Beta (CCβ)'
	}
}
const CC_START_DATES = {
	'#b': 1592002800, //2020 june 12 16:00 UTC-7
	'#0': 1599750000, //2020 sept 10 8:00 UTC-7
	'#1': 1605114000, //2020 nov 11 10:00 UTC-7
	'#2': 1612458000, //2021 feb 4 10:00 UTC-7
	'#3': 1622221200, //2021 may 28 10:00 UTC-7
	'#4': 1626195600, //2021 july 13 10:00 UTC-7
	// server reset and therefore week 2 is at 0400 UTC-7
}
// start + 7 days, mod 1 day, add 11 hrs
// week2 = (ccstart + 604800) - (ccstart % (60*60*24)) + 39600

const lightbox = GLightbox({
	selector: '.glightbox',
	touchNavigation: true,
	loop: true,
	closeOnOutsideClick: true
});
if (!window.location.hash)
	window.location.hash = '#4'
CCTAG = CCMAP[window.location.hash].tag
document.getElementById('pageTitle').innerHTML = CCMAP[window.location.hash].title
document.getElementById('usageLink').href = './cc-usage.html' + window.location.hash
CCSTART = CC_START_DATES[window.location.hash]
var charIdMap = {}
var cardOperatorMap = {}
var filterStatus = {}
var totalChecked = 0
var cardData
var headersMap = {}
var headerCount = {}
var filterSortType = true
var invertFilter = false
var lightboxElements
fetch('https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/en_US/gamedata/excel/character_table.json')
// fetch('./character_table.json')
	.then(res => res.json())
	.then(js => {
		operatorData = js;
		return fetch('./data' + CCTAG + '.json')
	})
	.then(res => res.json())
	.then(js => {
		cardData = js
		s = Array.from(new Set(Object.values(js).map(x => x.risk))).sort((a, b) => (b - a))
		let container = document.getElementById('cards')
		s.forEach(risk => {
			let div = document.createElement('div')
			div.classList.add('riskHeader')
			let span = document.createElement('span')
			span.innerHTML = 'RISK ' + risk
			let hl = document.createElement('hr')
			div.appendChild(span)
			div.appendChild(hl)
			container.appendChild(div)
			headersMap[risk] = div
			headerCount[risk] = 0
		})
		let all_ops = new Set()
		cc_week_2 = (CCSTART + 604800) - (CCSTART % (60 * 60 * 24)) + 39600
		cc_day_1 = (CCSTART + 172800) - (CCSTART % (60 * 60 * 24)) + 39600
		Object.keys(js).forEach(k => {
			filterStatus[k] = 0
			let div = document.createElement('div')
			let a = document.createElement('a')
			a.classList.add('glightbox')
			a.setAttribute('data-gallery', 'gallery1')
			a.href = './cropped' + CCTAG + '/' + k
			let img = document.createElement('img')
			img.src = './thumbs' + CCTAG + '/' + k
			a.appendChild(img)
			div.appendChild(a)
			div.id = k
			div.classList.add('cardContainer')
			cardDate = parseInt(k.split('.')[0])
			if (cardDate) {
				cardDate /= 1000
				console.log(cardDate + ',' + cc_week_2)
				if (cardDate > cc_week_2)
					div.classList.add('week2')
				if (cardDate < cc_day_1)
					div.classList.add('day1')
			}
			headersMap[js[k].risk].appendChild(div)
			headerCount[js[k].risk] += 1
			js[k]['squad'].forEach(op => {
				all_ops.add(op)
				if (!(op in cardOperatorMap))
					cardOperatorMap[op] = []
				cardOperatorMap[op].push(k)
			})
		})
		Object.keys(headersMap).forEach(k => {
			headersMap[k].setAttribute('cardCount', headerCount[k])
		})

		console.log(headerCount)
		// create filter
		for (var key in operatorData) {
			if (!all_ops.has(key))
				delete operatorData[key]
		}
		// all operators, we opt instead for only those that appear in at least 1 clear
		// for (var key in operatorData) {
		// if (!operatorData[key].displayNumber)
		// delete operatorData[key]
		// }
		for (var key in operatorData) {
			charIdMap[operatorData[key].name] = key;
		}
		console.log(cardOperatorMap)
		let filtercontainer = document.getElementById('filters')
		divMap = {}
		Object.keys(operatorData).forEach(x => {
			divMap[operatorData[x].name] = CreateOpCheckbox(x);
		})
		Object.values(operatorData).sort((a, b) => a.name > b.name ? 1 : -1).forEach((x, i) => divMap[x.name].style.order = i);


		//click listeners
		document.getElementById('filterToggle').onclick = () => {
			filtercontainer.classList.toggle('hidden')
			document.getElementById('checkboxes').classList.toggle('hidden')
			document.getElementById('filterToggle').innerHTML = filtercontainer.classList.contains('hidden') ? "Show Filters" : "Hide Filters"
		}
		document.getElementById('filterSort').onclick = () => {
			filterSortType = !filterSortType
			if (filterSortType)
				Object.values(operatorData).sort((a, b) => a.name > b.name ? 1 : -1).forEach((x, i) => divMap[x.name].style.order = i);
			else
				Object.values(operatorData).sort((a, b) =>
					a.rarity == b.rarity ? (a.name > b.name ? 1 : -1) : (a.rarity < b.rarity ? 1 : -1)).forEach((x, i) => divMap[x.name].style.order = i);
		}
		document.getElementById('filterInvert').onclick = (e) => {
			thisButton=e.target;
			invertFilter = !invertFilter
			thisButton.innerHTML = invertFilter ? "Excludes" : "Includes"
			applyAllFilters()
		}

		document.getElementById('filterReset').onclick = resetFilters
		lightbox.reload()
		lightboxElements = lightbox.elements
	})

function resetFilters() {
	totalChecked = 0
	Object.keys(headersMap).forEach(k => {
		headerCount[k] = parseInt(headersMap[k].getAttribute('cardCount'))
	})
	Object.keys(filterStatus).forEach(k => filterStatus[k] = 0)
	Object.keys(cardData).forEach(k => {
		document.getElementById(k).classList.remove('hidden')
	})
	Array.from(document.getElementsByClassName('operatorCheckbox')).forEach(x => x.classList.remove('_selected'))
	Array.from(document.getElementsByClassName('riskHeader')).forEach(x => x.classList.remove('hidden'))
	updateLightbox()
}

function updateLightbox() {
	if (totalChecked == 0)
		lightbox.elements = lightboxElements
	else
		lightbox.elements = lightboxElements.filter(x => (filterStatus[x.href.split('/').slice(-1)[0]] != 0) ^ invertFilter)
}

function showCard(key, show = true) {
	let prev = document.getElementById(key).classList.contains('hidden')
	if (show) {
		document.getElementById(key).classList.remove('hidden')
		document.getElementById(key).children[0].classList.add('glightbox')
		if (prev)
			headerCount[cardData[key].risk] += 1
	} else {
		document.getElementById(key).classList.add('hidden')
		document.getElementById(key).children[0].classList.remove('glightbox')
		if (!prev)
			headerCount[cardData[key].risk] -= 1
	}
	updateLightbox()
	if (0 == headerCount[cardData[key].risk])
		headersMap[cardData[key].risk].classList.add('hidden')
	else
		headersMap[cardData[key].risk].classList.remove('hidden')
}
function applyAllFilters() {
	if (totalChecked != 0)
	Object.keys(divMap).forEach(k => {
		// applyFilters(charIdMap[k],!divMap[k].classList.contains('hidden'))
		opname = charIdMap[k]
			if (opname in cardOperatorMap) {
		cardOperatorMap[opname].forEach(j => {
			updateFilterStatus(j, 0)
		})
	}
	})
}
function updateFilterStatus(key, delta) {
	// update filtering count for a card, if 0 will hide
	filterStatus[key] += delta
	if (0 == filterStatus[key]) {
		showCard(key, false ^ invertFilter)
	} else {
		showCard(key, true ^ invertFilter)
	}
}

function applyFilters(opname, checked) {
	let prev = totalChecked
	totalChecked += checked ? 1 : -1
	console.log(totalChecked)
	if (prev == 0 && totalChecked)
		showAllCards(false ^ invertFilter)

	if (opname in cardOperatorMap) {
		cardOperatorMap[opname].forEach(k => {
			updateFilterStatus(k, checked ? 1 : -1)

		})
	}

	if (0 == totalChecked)
		showAllCards(true)// special case, always show all when 0 checked //^ invertFilter)

}

function showAllCards(show = true) {
	Object.keys(cardData).forEach(k => {
		showCard(k, show)
	})
}

function CreateOpCheckbox(operator) {
	let operatorName = operatorData[operator].name;

	var checkboxDiv = document.createElement("div");
	checkboxDiv.classList.add('operatorCheckbox');
	// checkboxDiv.setAttribute('data-class', operator.profession);
	checkboxDiv.classList.add('show');
	checkboxDiv.onclick = () => {
		checkboxDiv.classList.toggle('_selected')
		applyFilters(operator, checkboxDiv.classList.contains('_selected'))
	}
	if (charIdMap[operatorName]) {
		let im = document.createElement('img');
		im.src = 'https://aceship.github.io/AN-EN-Tags/img/avatars/' + charIdMap[operatorName] + '.png';
		checkboxDiv.appendChild(im);
	}
	let name = document.createElement('div');
	name.classList.add('name');
	name.innerHTML = operatorName;
	checkboxDiv.appendChild(name);
	document.getElementById("checkboxes").appendChild(checkboxDiv);
	return checkboxDiv;
}


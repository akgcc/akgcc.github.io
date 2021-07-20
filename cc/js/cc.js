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
	'#0': {
		tag: '-cc0clear',
		title: 'Operation Barrenland (CC#0)'
	},
	'#b': {
		tag: '-ccb',
		title: 'Operation Beta (CCβ)'
	}
}

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
var charIdMap = {}
var cardOperatorMap = {}
var filterStatus = {}
var totalChecked = 0
var cardData
var headersMap = {}
var headerCount = {}
var filterSortType = true
var invertFilter = false
var includesAll = true
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
		// filter out duplicates, keep max 1 per group (day1,week1,week2)
		dupe_groups = {}
		Object.keys(cardData).forEach(x=>{
			if (cardData[x].duplicate_of) {
				dupe_groups[cardData[x].duplicate_of] = dupe_groups[cardData[x].duplicate_of] || {}
				dupe_groups[cardData[x].duplicate_of][cardData[x].group] = (dupe_groups[cardData[x].duplicate_of][cardData[x].group] || []).concat([x])
			}
		})
		Object.keys(dupe_groups).forEach(x=>{
			dupe_groups[x][cardData[x].group] = (dupe_groups[x][cardData[x].group] || []).concat([x])
		})
		Object.values(dupe_groups).forEach(x=>{
			Object.values(x).forEach(y=>{
				y.sort((a,b)=>parseInt(b.split('.')[0])-parseInt(a.split('.')[0])).slice(1).forEach(z=>{
					delete cardData[z]
				})
			})
		})
		s = Array.from(new Set(Object.values(cardData).map(x => x.risk))).sort((a, b) => (b - a))
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
		Object.keys(cardData).forEach(k => {
			filterStatus[k] = 0
			let div = document.createElement('div')
			let a = document.createElement('a')
			let is_dupe = cardData[k].duplicate_of !== undefined
			if (is_dupe)
				div.setAttribute('data-dupe',cardData[k].duplicate_of)
			a.classList.add('glightbox')
			a.setAttribute('data-gallery', 'gallery1')
			a.href = './cropped' + CCTAG + '/' + (is_dupe ? 'duplicates/' : '') + k
			let img = document.createElement('img')
			img.src = './thumbs' + CCTAG + '/' + k
			a.appendChild(img)
			div.appendChild(a)
			div.id = k
			div.setAttribute('data-group',cardData[k].group)
			div.classList.add('cardContainer')
			headersMap[cardData[k].risk].appendChild(div)
			headerCount[cardData[k].risk] += 1
			cardData[k]['squad'].forEach(op => {
				all_ops.add(op)
				if (!(op in cardOperatorMap))
					cardOperatorMap[op] = []
				cardOperatorMap[op].push(k)
			})
		})
		Object.keys(headersMap).forEach(k => {
			headersMap[k].setAttribute('cardCount', headerCount[k])
		})

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
			if (invertFilter) {
				invertFilter = !invertFilter
			}
			else if (includesAll) {
				includesAll = !includesAll
			}
			else {
				invertFilter = !invertFilter
				includesAll = !includesAll
			}
			thisButton.innerHTML = invertFilter ? "Excludes" : includesAll ? "Includes (All)" : "Includes (Any)"
			applyAllFilters()
			updateLightbox()
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
	// you can directly assign to lightbox.elements and its a bit quicker, we avoid it as it might break something unknown
	if (totalChecked == 0)
		lightbox.setElements(lightboxElements)
	else
		lightbox.setElements(lightboxElements.filter(x => _filterShouldShow(x.href.split('/').slice(-1)[0])))
}

function _filterShouldShow(key) {
	if (totalChecked==0)
		return true
	if (filterStatus[key]==0)
		return false ^ invertFilter
	if (!invertFilter && includesAll)
		return filterStatus[key]==totalChecked
	return true ^ invertFilter
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
	// update filtering count for a card, then show/hide as necessary
	filterStatus[key] += delta
	showCard(key, _filterShouldShow(key))
}

function applyFilters(opname, checked) {
	let prev = totalChecked
	totalChecked += checked ? 1 : -1
	if (prev == 0 && totalChecked)
		showAllCards(false ^ invertFilter)

	if (opname in cardOperatorMap) {
		cardOperatorMap[opname].forEach(k => {
			updateFilterStatus(k, checked ? 1 : -1)
		})
	}
	if (!invertFilter && totalChecked)
		applyAllFilters()
	
	if (0 == totalChecked)
		showAllCards(true)// special case, always show all when 0 checked //^ invertFilter)
	updateLightbox()
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


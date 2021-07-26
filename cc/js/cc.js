const lightbox = GLightbox({
	selector: '.glightbox',
	touchNavigation: true,
	loop: true,
	closeOnOutsideClick: true
});
if (!window.location.hash)
	window.location.hash = '#4'


document.getElementById('usageLink').href = './cc-usage.html' + window.location.hash
var charIdMap = {}
var cardOperatorMap = {}
var filterStatus = {}
var totalChecked = 0
var cardData
var headersMap = {}
var headerCount = {}
var riskMap = {}
var filterSortType = true
var invertFilter = false
var includesAll = true
var weekFilter = 7
var maxOpCount = 13
var maxAvgRarity = 6
var lightboxElements
var CCTAG
fetch('./cctitles.json')
.then(res => res.json())
.then(json => {
CCMAP = json; 
CCTAG = CCMAP[window.location.hash].tag
document.getElementById('pageTitle').innerHTML = CCMAP[window.location.hash].title
return fetch('https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/en_US/gamedata/excel/character_table.json')})
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
		Object.keys(cardData).forEach(x => {
			if (cardData[x].duplicate_of) {
				dupe_groups[cardData[x].duplicate_of] = dupe_groups[cardData[x].duplicate_of] || {}
				dupe_groups[cardData[x].duplicate_of][cardData[x].group] = (dupe_groups[cardData[x].duplicate_of][cardData[x].group] || []).concat([x])
			}
		})
		Object.keys(dupe_groups).forEach(x => {
			dupe_groups[x][cardData[x].group] = (dupe_groups[x][cardData[x].group] || []).concat([x])
		})
		Object.values(dupe_groups).forEach(x => {
			Object.values(x).forEach(y => {
				y.sort((a, b) => parseInt(b.split('.')[0]) - parseInt(a.split('.')[0])).slice(1).forEach(z => {
					delete cardData[z]
				})
			})
		})
		s = Array.from(new Set(Object.values(cardData).map(x => x.risk))).sort((a, b) => (b - a))
		let container = document.getElementById('cards')
		s.forEach(risk => {
			let wrap = document.createElement('div')
			wrap.classList.add('riskWrapper')
			let div = document.createElement('div')
			div.classList.add('riskContainer')
			let div2 = document.createElement('div')
			div2.classList.add('riskHeader')
			let span = document.createElement('span')
			span.innerHTML = 'RISK ' + risk
			let hl = document.createElement('hr')
			div2.appendChild(span)
			div2.appendChild(hl)
			wrap.appendChild(div2)
			wrap.appendChild(div)
			container.appendChild(wrap)
			headersMap[risk] = div
			riskMap[risk] = wrap
			headerCount[risk] = 0
		})
		let all_ops = new Set()
		Object.keys(cardData).forEach(k => {
			filterStatus[k] = 0
			let div = document.createElement('div')
			let a = document.createElement('a')
			let is_dupe = cardData[k].duplicate_of !== undefined
			if (is_dupe)
				div.setAttribute('data-dupe', cardData[k].duplicate_of)
			a.classList.add('glightbox')
			a.setAttribute('data-gallery', 'gallery1')
			a.href = './cropped' + CCTAG + '/' + (is_dupe ? 'duplicates/' : '') + k
			let img = document.createElement('img')
			img.src = './thumbs' + CCTAG + '/' + k
			a.appendChild(img)
			div.appendChild(a)
			div.id = k
			div.setAttribute('data-group', cardData[k].group)
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
		Object.keys(riskMap).forEach(k => {
			riskMap[k].setAttribute('cardCount', headerCount[k])
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
		var filtercontainer = document.getElementById('filters')
		divMap = {}
		Object.keys(operatorData).forEach(x => {
			divMap[operatorData[x].name] = CreateOpCheckbox(x);
		})
		Object.values(operatorData).sort((a, b) => a.name > b.name ? 1 : -1).forEach((x, i) => divMap[x.name].style.order = i);

		//click listeners
		Array.from(document.getElementsByClassName('weekFilter')).forEach(x => {
			x.onclick = (e) => {
				weekFilter ^= 2 ** (e.currentTarget.getAttribute('data-group'))
				x.classList.toggle('disabled')
				applyAllFilters()
				updateLightbox()
			}
		})
		// let stylesheet = document.createElement('style')
		// document.head.appendChild(stylesheet)
		// new ResizeObserver(()=>{
		// stylesheet.sheet.insertRule("@media (hover: hover) { body #filters.hidden {"+"top: calc(-"+(filtercontainer.offsetHeight-10)+"px + var(--topNav-height) + 10px);"+"}}", 0);
		// }).observe(filtercontainer)
		var filtertoggle = document.getElementById('filterToggle')
		function adjustBasedOnScroll () {
			if ((window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop) > filtercontainer.offsetHeight) {
				filtercontainer.classList.add('canSlide')
				filtertoggle.classList.remove('hidden')
			}
			else {
				filtercontainer.classList.remove('canSlide')
				filtertoggle.classList.add('hidden')
			}
			
		}
		window.onscroll = adjustBasedOnScroll

		let rarityDisp = document.getElementById('rarityDisp')
		document.getElementById('raritySlider').oninput = function() {
			rarityDisp.innerHTML = this.value;
			maxAvgRarity = this.value;
			applyAllFilters()
			updateLightbox()
		}
		let opcountDisp = document.getElementById('opcountDisp')
		document.getElementById('opcountSlider').oninput = function() {
			opcountDisp.innerHTML = this.value;
			maxOpCount = this.value;
			applyAllFilters()
			updateLightbox()
		}
		filtertoggle.onclick = (e) => {
			icon = e.currentTarget.querySelector("i")
			if (icon.classList.contains('fa-caret-up')) {
				filtercontainer.classList.remove('canSlide')
				var canSlideOnLeave = (e) => {
					adjustBasedOnScroll()
					filtertoggle.removeEventListener('mouseleave', canSlideOnLeave)
				}
				filtertoggle.addEventListener('mouseleave', canSlideOnLeave)
			}
			icon.classList.toggle('fa-caret-up')
			icon.classList.toggle('fa-caret-down')
			filtertoggle.classList.toggle('forceShow')
			filtercontainer.classList.toggle('hidden')
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
			thisButton = e.currentTarget;
			if (invertFilter) {
				invertFilter = !invertFilter
			} else if (includesAll) {
				includesAll = !includesAll
			} else {
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
	weekFilter = 7
	Object.keys(riskMap).forEach(k => {
		headerCount[k] = parseInt(riskMap[k].getAttribute('cardCount'))
		riskMap[k].classList.remove('hidden')
	})
	Object.keys(filterStatus).forEach(k => filterStatus[k] = 0)
	Object.keys(cardData).forEach(k => {
		document.getElementById(k).classList.remove('hidden')
	})
	Array.from(document.getElementsByClassName('operatorCheckbox')).forEach(x => x.classList.remove('_selected'))
	Array.from(document.getElementsByClassName('riskContainer')).forEach(x => x.classList.remove('hidden'))
	Array.from(document.getElementsByClassName('weekFilter')).forEach(x => x.classList.remove('disabled'))
	document.getElementById('opcountSlider').value = 13
	document.getElementById('opcountDisp').innerHTML = 13
	maxOpCount = 13;
	document.getElementById('raritySlider').value = 6
	document.getElementById('rarityDisp').innerHTML = 6
	maxAvgRarity = 6
	updateLightbox()
}

function updateLightbox() {
	// you can directly assign to lightbox.elements and its a bit quicker, we avoid it as it might break something unknown
	lightbox.setElements(lightboxElements.filter(x => _filterShouldShow(x.href.split('/').slice(-1)[0])))
}

function _filterShouldShow(key) {
	let shouldShow = 2 ** document.getElementById(key).getAttribute('data-group') & weekFilter
	shouldShow = shouldShow && (cardData[key].opcount <= maxOpCount)
	shouldShow = shouldShow && (cardData[key].avgRarity <= maxAvgRarity)
	if (totalChecked == 0)
		return shouldShow && true
	if (filterStatus[key] == 0)
		return shouldShow && (false ^ invertFilter)
	if (!invertFilter && includesAll)
		return shouldShow && (filterStatus[key] == totalChecked)
	return shouldShow && (true ^ invertFilter)
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
		riskMap[cardData[key].risk].classList.add('hidden')
	else
		riskMap[cardData[key].risk].classList.remove('hidden')
}

function applyAllFilters() {
	Object.keys(filterStatus).forEach(key => {
		showCard(key, _filterShouldShow(key))
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
	if (totalChecked == checked) //went from 0 to 1
		applyAllFilters()

	if (opname in cardOperatorMap) {
		cardOperatorMap[opname].forEach(k => {
			updateFilterStatus(k, checked ? 1 : -1)
		})
	}
	if (!invertFilter && totalChecked)
		applyAllFilters()

	if (0 == totalChecked)
		applyAllFilters()
	updateLightbox()
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

let customSlideHTML = `<div class="gslide">
    <div class="gslide-inner-content">
        <div class="ginner-container">
            <div class="gslide-media">
            </div>
            <div class="gslide-description">
                <div class="gdesc-inner">
                    <h4 class="gslide-title"></h4>
                    <div class="gslide-desc"></div>
                </div>
            </div>
        </div>
    </div>
</div>`;
const lightbox = GLightbox({
	selector: '.glightbox',
	touchNavigation: true,
	loop: true,
	closeOnOutsideClick: true,
	moreLength: 0,
	zoomable: false,
	slideHTML: customSlideHTML
});
if (!window.location.hash)
	window.location.hash = '#4'
document.getElementById('usageLink').href = './cc-usage.html' + window.location.hash
window.onhashchange = () => window.location.reload()

const ccSettings = {sortBy:'date', view:'thumbs', opSort:'name'}
let f = localStorage.getItem('ccSettings')
if (f) 
	updateJSON(ccSettings, JSON.parse(f))
function changeSetting(key, value) {
	ccSettings[key] = value
	localStorage.setItem('ccSettings', JSON.stringify(ccSettings))
}

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
var lightboxElementsOriginal
var lightboxDateOrder = {}
var lightboxOriginalIndexMapping
var lightboxSoulOrder = {}
var dupeChain = {}
var CCTAG
fetch('./cctitles.json')
.then(res => res.json())
.then(json => {
CCMAP = json; 
CCTAG = CCMAP[window.location.hash].tag
document.getElementById('pageTitle').innerHTML = CCMAP[window.location.hash].title
return get_char_table()})
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
			let hl = document.createElement('hr')
			div2.appendChild(hl)
			wrap.appendChild(div2)
			wrap.appendChild(div)
			container.appendChild(wrap)
			headersMap[risk] = div
			riskMap[risk] = wrap
			headerCount[risk] = 0
		})
		let all_ops = new Set()
		// let date_index = 0;
		Object.keys(cardData).sort().forEach(k => {
			filterStatus[k] = 0
			let div = document.createElement('div')
			let a = document.createElement('a')
			let is_dupe = cardData[k].duplicate_of !== undefined
			if (is_dupe)
				div.setAttribute('data-dupe', cardData[k].duplicate_of)
			if (k in dupe_groups && Object.keys(dupe_groups[k]).length > 1)
				div.setAttribute('data-dupe', '')
			div.setAttribute('data-soul', cardData[k].soul.toFixed(2))
			a.classList.add('glightbox')
			a.setAttribute('data-gallery', 'gallery1')
			// a.href = './cropped' + (cardData[k].tag || CCTAG) + '/' + (is_dupe ? 'duplicates/' : '') + k
			// no longer use duplicates dir
			a.href = './cropped' + (cardData[k].tag || CCTAG) + '/' + k
			let img = document.createElement('img')
			img.src = './thumbs' + (cardData[k].tag || CCTAG) + '/' + k
			a.appendChild(img)
			div.appendChild(a)
			div.id = k
			div.setAttribute('data-group', cardData[k].group)
			div.classList.add('cardContainer')
			div.setAttribute('data-dateorder', headersMap[cardData[k].risk].childElementCount)
			// lightboxDateOrder[a.href] = date_index++
			// div.style.order = headersMap[cardData[k].risk].childElementCount
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
			riskMap[k].firstChild.setAttribute('title', headerCount[k] + (headerCount[k]==1 ? " clear" : " clears"))
			riskMap[k].firstChild.setAttribute('data-count', headerCount[k])
			riskMap[k].firstChild.setAttribute('data-risk', k)
			
		})
		document.getElementById('clearCount').innerHTML = "Clears: " + Object.values(headerCount).reduce((a,b) => a+b, 0)
		//create initial soul order:
		let soul_index = 0;
		Object.keys(riskMap).slice().reverse().forEach(k => {
			Array.from(riskMap[k].querySelectorAll('.cardContainer')).sort((a, b) => b.dataset.soul - a.dataset.soul).forEach((clear, i) => {
				lightboxSoulOrder[clear.querySelector('a').href] = soul_index++
			})
		})
		//create initial date order:
		let date_index = 0;
		Object.keys(riskMap).slice().reverse().forEach(k => {
			Array.from(riskMap[k].querySelectorAll('.cardContainer')).forEach((clear, i) => {
				lightboxDateOrder[clear.querySelector('a').href] = date_index++
			})
		})
		const orderBtn = document.getElementById('sortOrder')
		orderBtn.onclick = (e) => {
			switch (orderBtn.innerHTML) {
				case 'Order by: Date':
					Object.keys(riskMap).forEach(k => {
						Array.from(riskMap[k].querySelectorAll('.cardContainer')).sort((a, b) => b.dataset.soul - a.dataset.soul).forEach((clear, i) => {
							// clear.style.order = i
							if (clear.parentElement.classList.contains('clearView'))
								clear.parentElement.parentElement.append(clear.parentElement)
							else
								clear.parentElement.append(clear)
						})
					})
					orderBtn.innerHTML = 'Order by: Soul'
					changeSetting('sortBy','soul')
					document.body.classList.toggle('soul-mode')
					lightboxElementsOriginal.sort((a,b) => lightboxSoulOrder[a.href] - lightboxSoulOrder[b.href])

				break;
				case 'Order by: Soul':
					Object.keys(riskMap).forEach(k => {
						Array.from(riskMap[k].querySelectorAll('.cardContainer')).sort((a, b) => a.dataset.dateorder - b.dataset.dateorder).forEach((clear, i) => {
							// clear.style.order = i
							if (clear.parentElement.classList.contains('clearView'))
								clear.parentElement.parentElement.append(clear.parentElement)
							else
								clear.parentElement.append(clear)
						})
					})
					orderBtn.innerHTML = 'Order by: Date'
					changeSetting('sortBy','date')
					document.body.classList.toggle('soul-mode')
					lightboxElementsOriginal.sort((a,b) => lightboxDateOrder[a.href] - lightboxDateOrder[b.href])
				break;
			}
			// reload must be followed by update to assign new data to lightbox.elements
			reloadLightbox()
			updateLightbox()
		}
		
		const viewBtn = document.getElementById('viewType')
		viewBtn.onclick = (e) => {
			switch (viewBtn.innerHTML) {
				case 'View: Thumbs':
					viewBtn.innerHTML = 'View: Icons'
					changeSetting('view','icons')
					document.body.classList.add('icon-mode')
					convertToIcons()
					break;
				case 'View: Icons':
					viewBtn.innerHTML = 'View: Thumbs'
					changeSetting('view','thumbs')
					document.body.classList.remove('icon-mode')
					revertToThumbs()
					break;
			}
		}
		
		function convertToIcons() {
			Array.from(document.querySelectorAll('.cardContainer')).forEach(c => {
				let line = c.querySelector('.clearView')
				if (!line) {
					line = document.createElement('div')
					line.classList.add('clearView')
					cardData[c.id].squad.sort((a,b) => {
						if (a == cardData[c.id].support)
							return -1
						if (b == cardData[c.id].support)
							return 1
						if (operatorData[a].rarity > operatorData[b].rarity)
							return -1
						if (operatorData[a].rarity < operatorData[b].rarity)
							return 1
						if (operatorData[a].name > operatorData[b].name)
							return 1
						return -1
					}).forEach(op => {
						let wrap = document.createElement('div')
						wrap.classList.add('opImgWrapper')
						let img = document.createElement('img')
						img.classList.add('opImg')
						if (op==cardData[c.id].support)
							img.classList.add('supportOp')
						img.src = 'https://aceship.github.io/AN-EN-Tags/img/avatars/' + op + '.png';
						img.setAttribute('title', operatorData[op].name)
						wrap.setAttribute('data-rarity', operatorData[op].rarity)
						wrap.appendChild(img)
						line.appendChild(wrap)
					})
				}
				if (c.classList.contains('hidden'))
					line.classList.add('hidden')
				else
					line.classList.remove('hidden')
				c.parentElement.replaceChild(line,c)
				line.prepend(c)
			})
		}
		function revertToThumbs() {
			Array.from(document.querySelectorAll('.clearView')).forEach(c => {
				let container = c.firstChild
				c.parentElement.replaceChild(container, c)
				container.appendChild(c)
			})
		}

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
			operatorData[key].charId = key;
		}
		var filtercontainer = document.getElementById('filters')
		divMap = {}
		Object.keys(operatorData).forEach(x => {
			divMap[operatorData[x].name] = CreateOpCheckbox(operatorData[x], null, null,null, clickfunc = (op,state) => applyFilters(op, state));
		})
		Object.values(operatorData).sort((a, b) => a.name > b.name ? 1 : -1).forEach((x, i) => divMap[x.name].style.order = i);

		//click listeners
		Array.from(document.getElementsByClassName('weekFilter')).forEach(x => {
			x.onclick = (e) => {
				weekFilter ^= 2 ** (e.currentTarget.getAttribute('data-group'))
				x.classList.toggle('toggled')
				applyAllFilters()
				updateLightbox()
			}
		})
		// let stylesheet = document.createElement('style')
		// document.head.appendChild(stylesheet)
		// new ResizeObserver(()=>{
		// stylesheet.sheet.insertRule("@media (hover: hover) { body #filters.hidden {"+"top: calc(-"+(filtercontainer.offsetHeight-10)+"px + var(--topNav-height) + 10px);"+"}}", 0);
		// }).observe(filtercontainer)
		function activatefiltercontainer(e) {
			if (e.type=='mousedown')
				filtercontainer.classList.add('active')
			else
				filtercontainer.classList.remove('active')
		}
		filtercontainer.addEventListener('mousedown', activatefiltercontainer)
		filtercontainer.addEventListener('mouseup', activatefiltercontainer)
		filtercontainer.addEventListener('mouseleave', activatefiltercontainer)

		var filtertoggle = document.getElementById('filterToggle')
		function adjustBasedOnScroll () {
			if ((window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop) > filtercontainer.offsetHeight) {
				filtercontainer.classList.add('canSlide')
				filtertoggle.classList.remove('hidden')
			}
			else if ((window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop) > 0 && filtercontainer.classList.contains('active')) {
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
			rarityDisp.innerHTML = parseFloat(this.value).toFixed(1);
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
			changeSetting('opSort',filterSortType ? 'name':'rarity')
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
		
		document.getElementById('clearCount').onclick = ()=> {
			document.body.classList.toggle('clear-mode');
			document.getElementById('clearCount').classList.toggle('checked');
			}
		
		lightbox.reload()
		lightboxElementsOriginal = lightbox.elements
		reloadLightbox()
		
		lightbox.on('slide_before_load', (data) => {
			const { slideIndex, slideNode, slideConfig, player, trigger } = data;
			let [soul, group, dupe] = slideConfig.content.split(',')
			slideNode.setAttribute('data-group', group);
			slideNode.querySelector('.gslide-media').setAttribute('data-soul', soul);
			if (dupe) {
				slideNode.setAttribute('data-dupe', dupe)
				slideConfig.description='More from this doctor:'
				slideConfig.description+='<div class="dupe-thumbs">'
				while (dupe && dupe != slideConfig.filename) {
					slideConfig.description+='<img src="./thumbs'+(cardData[dupe].tag || CCTAG)+'/'+dupe+'" data-group="'+cardData[dupe].group+'" data-dupe="'+dupe+'"/>'
					dupe = dupeChain[dupe]
				}
				slideConfig.description+='</div>'
			}
		});

		lightbox.on('slide_after_load', (data) => {
			const { slideIndex, slideNode, slideConfig, player, trigger } = data;
			let dupeDiv = slideNode.querySelector('.gdesc-inner')
			slideNode.querySelectorAll('.dupe-thumbs > img').forEach( dupeDiv => {
				let dupe = dupeDiv.getAttribute('data-dupe')
				dupeDiv.onclick = () => {
					// check slide at expected index, if its a match just scroll to it.
					// if not a match you need to traverse backwards until you find either the slide or an earlier slide.
					// if you found an earlier slide, insert the slide right after it.
					// this is the original index of the slide, before any filters are applied.
					let max_idx = parseInt(lightboxOriginalIndexMapping[dupe])
					for (let i = Math.min(max_idx, lightbox.elements.length-1); i >= 0; i--) {
						if (lightbox.elements[i].filename == dupe) {
							lightbox.goToSlide(i)
							return
						}
						if (parseInt(lightbox.elements[i].original_idx) < max_idx) {
							lightbox.insertSlide(lightboxElementsOriginal[lightboxOriginalIndexMapping[dupe]],i+1)
							lightbox.goToSlide(i+1)
							return
						}
					}
					lightbox.insertSlide(lightboxElementsOriginal[lightboxOriginalIndexMapping[dupe]],0)
					lightbox.goToSlide(0)
					return
				}
			})

		});
		updateLightbox()
		
		if (ccSettings.sortBy == 'soul')
			orderBtn.click()
		if (ccSettings.view == 'icons')
			viewBtn.click()
		if (ccSettings.opSort == 'rarity')
			document.getElementById('filterSort').click()
	})
function reloadLightbox() {
	lightboxOriginalIndexMapping = {}
	for (let e in Object.keys(lightboxElementsOriginal))
		lightboxOriginalIndexMapping[decodeURI(lightboxElementsOriginal[e].href.split('/').slice(-1)[0])] = e
	Object.entries(lightboxOriginalIndexMapping).forEach(([k,v]) => {
		lightboxElementsOriginal[v].filename = k
		lightboxElementsOriginal[v].original_idx = v
		lightboxElementsOriginal[v].content = ''+cardData[k].soul.toFixed(2)
		lightboxElementsOriginal[v].content += ','+cardData[k].group
		has_dupe = cardData[k].duplicate_of || ((k in dupe_groups) ? k : undefined)
		if (has_dupe) {
			next_dupe = (dupe_groups[has_dupe][(cardData[k].group+1)%3] || dupe_groups[has_dupe][(cardData[k].group+2)%3] || dupe_groups[has_dupe][(cardData[k].group+3)%3])[0]
			if (next_dupe != k) {
				// don't set next dupe to self.
				lightboxElementsOriginal[v].content += ','+next_dupe
				dupeChain[k] = next_dupe
			}
		}
	})
}
function resetFilters() {
	totalChecked = 0
	weekFilter = 7
	Object.keys(riskMap).forEach(k => {
		headerCount[k] = parseInt(riskMap[k].getAttribute('cardCount'))
		riskMap[k].classList.remove('hidden')
	})
	Object.keys(filterStatus).forEach(k => filterStatus[k] = 0)
	Object.keys(cardData).forEach(k => {
		let e = document.getElementById(k)
		e.classList.remove('hidden')
		if (e.parentElement.classList.contains('clearView'))
			e.parentElement.classList.remove('hidden')
	})
	Array.from(document.getElementsByClassName('operatorCheckbox')).forEach(x => x.classList.remove('_selected'))
	Array.from(document.getElementsByClassName('riskContainer')).forEach(x => x.classList.remove('hidden'))
	Array.from(document.getElementsByClassName('weekFilter')).forEach(x => x.classList.remove('toggled'))
	document.getElementById('opcountSlider').value = 13
	document.getElementById('opcountDisp').innerHTML = 13
	maxOpCount = 13;
	document.getElementById('raritySlider').value = 6
	document.getElementById('rarityDisp').innerHTML = "6.0"
	maxAvgRarity = 6
	document.getElementById('clearCount').innerHTML = "Clears: " + Object.values(headerCount).reduce((a,b) => a+b, 0)
	updateLightbox()
}

function updateLightbox() {
	// you can directly assign to lightbox.elements and its a bit quicker, we avoid it as it might break something unknown (for one thing, the .index property won't be correct ** actually .index is never correct after resorting, so don't rely on it.)
	lightbox.setElements(lightboxElementsOriginal.filter(x => _filterShouldShow(decodeURI(x.href.split('/').slice(-1)[0]))))
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
	let node = document.getElementById(key)
	let prev = node.classList.contains('hidden')
	if (show) {
		if (node.parentElement.classList.contains('clearView'))
			node.parentElement.classList.remove('hidden')
		node.classList.remove('hidden')
		node.children[0].classList.add('glightbox')
		if (prev)
			headerCount[cardData[key].risk] += 1
	} else {
		if (node.parentElement.classList.contains('clearView'))
			node.parentElement.classList.add('hidden')
		node.classList.add('hidden')
		node.children[0].classList.remove('glightbox')
		if (!prev)
			headerCount[cardData[key].risk] -= 1
	}
	if (0 == headerCount[cardData[key].risk])
		riskMap[cardData[key].risk].classList.add('hidden')
	else
		riskMap[cardData[key].risk].classList.remove('hidden')
	riskMap[cardData[key].risk].firstChild.setAttribute('data-count',headerCount[cardData[key].risk])
}

function applyAllFilters() {
	Object.keys(filterStatus).forEach(key => {
		showCard(key, _filterShouldShow(key))
	})
	document.getElementById('clearCount').innerHTML = "Clears: " + Object.values(headerCount).reduce((a,b) => a+b, 0)
}

function updateFilterStatus(key, delta) {
	// update filtering count for a card, then show/hide as necessary
	filterStatus[key] += delta
	showCard(key, _filterShouldShow(key))
}

function applyFilters(operator, checked) {
	let charid = operator.charId
	let prev = totalChecked
	totalChecked += checked ? 1 : -1
	if (totalChecked == checked) //went from 0 to 1
		applyAllFilters()

	if (charid in cardOperatorMap) {
		cardOperatorMap[charid].forEach(k => {
			updateFilterStatus(k, checked ? 1 : -1)
		})
	}
	if (!invertFilter && totalChecked)
		applyAllFilters()

	if (0 == totalChecked)
		applyAllFilters()
	updateLightbox()
}

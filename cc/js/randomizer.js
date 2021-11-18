var story_table,operatorData,challengeList,divMap = {},episode_list = {}
const maxTeamSize = 12
var filters = {
	Squad: {
		Size: {
			disp: 'Max Size',
			max: maxTeamSize,
		},
		Challenges: {
			disp: 'Challenges',
			max: 1,
		},
		draftSize:{
			disp: "Pack Size (Draft)",
			max: 3,
			maxvalmin: 1,
			maxvalmax: 10,
		}
	},
	Rarity: {
		0: {
			disp: 1,
			enabled: true,
			min: 0,
			max: maxTeamSize,
		},
		1: {
			disp: 2,
			enabled: true,
			min: 0,
			max: maxTeamSize,
		},
		2: {
			disp: 3,
			enabled: true,
			min: 0,
			max: maxTeamSize,
		},
		3: {
			disp: 4,
			enabled: true,
			min: 0,
			max: maxTeamSize,
		},
		4: {
			disp: 5,
			enabled: true,
			min: 0,
			max: maxTeamSize,
		},
		5: {
			disp: 6,
			enabled: true,
			min: 0,
			max: maxTeamSize,
		},
	},
	Class: {
		Supporter: {
			disp: 'Supporter',
			enabled: true,
			min: 0,
			max: maxTeamSize,
		},
		Caster: {
			disp: 'Caster',
			enabled: true,
			min: 0,
			max: maxTeamSize,
		},
		Sniper: {
			disp: 'Sniper',
			enabled: true,
			min: 0,
			max: maxTeamSize,
		},
		Defender: {
			disp: 'Defender',
			enabled: true,
			min: 0,
			max: maxTeamSize,
		},
		Vanguard: {
			disp: 'Vanguard',
			enabled: true,
			min: 0,
			max: maxTeamSize,
		},
		Specialist: {
			disp: 'Specialist',
			enabled: true,
			min: 0,
			max: maxTeamSize,
		},
		Guard: {
			disp: 'Guard',
			enabled: true,
			min: 0,
			max: maxTeamSize,
		},
		Medic: {
			disp: 'Medic',
			enabled: true,
			min: 0,
			max: maxTeamSize,
		},
	}
}
function updateJSON(dest, src) {
	for (let key in dest) {
	  if(src.hasOwnProperty(key)){
		if (typeof dest[key] == 'object')
			dest[key] = updateJSON(dest[key], src[key])
		else
			dest[key] = src[key];
	  }
	}
	return dest
}
// fetch('https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/en_US/gamedata/excel/zone_table.json')
fetch('./json/challenges.json')
.then(res => res.json())
.then(js => {
	challengeList = js
return get_char_table()
})
.then(js => {
	operatorData = js
return fetch('https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/en_US/gamedata/excel/story_review_table.json')
})
.then(res => res.json())
.then(js => {
	story_table = js
return fetch('https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/en_US/gamedata/excel/stage_table.json')
})
.then(res => res.json())
.then(js => {
	stageData = js;
	
	// load local filter data.
	let f = localStorage.getItem('randomizerFilters')
	if (f)
		updateJSON(filters, JSON.parse(f))


// create list of available stages (episode_list)
let availableStages = Object.values(stageData.stages).filter(x=>(x.stageType=='MAIN' || x.stageType=='SUB') && x.apCost && x.dailyStageDifficulty && x.difficulty == 'NORMAL' && x.levelId);
let main_ids = new Set()
availableStages.map(x => main_ids.add(x.zoneId))

const now = Math.floor(Date.now()/1000)

for (const [key, value] of Object.entries(story_table)) {
	if (value.remakeStartTime > 0 || value.startTime >= 1633003200)
		episode_list[value.name + ' (' +value.infoUnlockDatas.slice(-1)[0].storyCode.split('-')[0] +')'] = value.id
}

main_ids.forEach(x=> {
let m = /^main_(\d+)/ig.exec(x)
if (m) {
	episode_list['Episode '+m[1].padStart(2,'0')] = '(?:main|sub)_'+m[1].padStart(2,'0')+'-'
}
}
)

filters.Stage = filters.Stage || {}
Object.keys(episode_list).forEach(x=> {
	filters.Stage[x] = filters.Stage[x] || {disp: x, enabled: true}
})





// remove all non-obtainable "operators"
for (var key in operatorData) {
	operatorData[key].charId = key
	operatorData[key].selected = true
	if (!operatorData[key].displayNumber)
		delete operatorData[key]
	}
function saveOpList() {
	let exclusions = Object.values(operatorData).filter(x=> !x.selected).map(x => x.charId)
	localStorage.setItem('excludedOps', JSON.stringify(exclusions))
}
function toggleOp(op, state) {
	operatorData[op.charId].selected = state
	saveOpList()
}
Object.keys(operatorData).forEach(x => {
			divMap[x] = CreateOpCheckbox(operatorData[x], null, null, null, toggleOp );
			divMap[x].classList.add('_selected')
		})

let exclusions = localStorage.getItem('excludedOps')

if (exclusions)
	Array.from(JSON.parse(exclusions)).forEach(x => {
		divMap[x].classList.toggle('_selected')
		operatorData[x].selected = false
	})

Object.values(operatorData).sort((a, b) => {
	if (a.rarity > b.rarity) return -1;
	if (a.rarity < b.rarity) return 1;
	return a.name > b.name ? 1 : -1
}).forEach((x, i) => divMap[x.charId].style.order = i);


function Randomize() {
	let outputDiv = document.getElementById('results')
	outputDiv.classList.remove('hidden')
	
	function rerollStage(){
		let parentDiv = document.getElementById('stageRoll')
		// pick a stage: (depends on stages_re)
		// get non-filtered episodes only:
		let div = document.createElement('div')
		let span = document.createElement('span')
		
		let localEpisodeList = JSON.parse(JSON.stringify(episode_list))
		for (var key in localEpisodeList) {
			if (!filters.Stage[key].enabled)
				delete localEpisodeList[key]
		}
		let stages_re = new RegExp('^('+Object.values(localEpisodeList).join("|")+')', 'gi');
		let availableStages = Object.values(stageData.stages).filter(x=> x.stageId.match(stages_re) && ['MAIN','SUB','ACTIVITY'].includes(x.stageType) && x.apCost && x.difficulty == 'NORMAL' && x.levelId);
		let chosen_stage = shuffleArray(availableStages)[0]
		// chosen_stage= availableStages.filter(x=> x.code == "SV-EX-5")[0]
		if (chosen_stage) {
			let stageurl =  'https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/en_US/gamedata/levels/'+chosen_stage.levelId.toLowerCase()+'.json'
			fetch(stageurl)
			.then(res => res.json())
			.then(js => {
				div.prepend(tableFromStageData(js))
				if (parentDiv.firstChild)
					parentDiv.replaceChild(div, parentDiv.firstChild)
				else
					parentDiv.appendChild(div)
			})
			
		}
		span.innerHTML = (chosen_stage || {code: '???'}).code
		div.appendChild(span)
	}
	function draftSquad() {
		// local vars for this draft
		let draftedOps = []
		let availableOperators = Object.values(operatorData).filter(x=> x.selected && !draftedOps.includes(x.charId))
		let localFilters = JSON.parse(JSON.stringify(filters))
		
		destDiv = document.getElementById('output')
		destDiv.classList.add('draft')
		destDiv.innerHTML = ''
		let header = document.createElement('span')
		header.innerHTML = 'Choose one ('+(localFilters.Squad.Size.max - draftedOps.length)+' remaining):'
		header.style.order = -999
		let selection = document.createElement('div')
		selection.classList.add('opDraft')
		selection.style.order = -998
		let teamheader = document.createElement('span')
		teamheader.innerHTML = 'Your draft:'
		teamheader.style.order = 0
		teamheader.classList.add('hidden')
		let team = document.createElement('div')
		team.classList.add('opDraft')
		team.id = 'draftedOps'
		team.style.order = 1
		
		destDiv.prepend(selection)
		destDiv.prepend(header)
		destDiv.append(teamheader)
		destDiv.append(team)
		
		
		function chooseOp(op, _) {
			teamheader.classList.remove('hidden')
			CreateOpCheckbox(op, null, null, null, null, team).style.order = -op.rarity
			draftedOps.push(op.charId)
			
			localFilters.Rarity[parseInt(op.rarity)].min -= 1
			localFilters.Rarity[parseInt(op.rarity)].max -= 1
			localFilters.Class[op.profession].max -= 1
			localFilters.Class[op.profession].min -= 1
		
			if (draftedOps.length >= localFilters.Squad.Size.max)
				return finalizeDraft()
			selection.innerHTML = ''
			draftRound()
		}
		
		function finalizeDraft() {
			// replace with team.
			destDiv.innerHTML = team.innerHTML
			destDiv.classList.remove('draft')
		}
		function draftRound() {
			function getOpList(){
				// filter by rarity:
				let thisDraft = availableOperators.filter( x => localFilters.Rarity[parseInt(x.rarity)].enabled && localFilters.Rarity[parseInt(x.rarity)].max > 0)
				// filter by class:
				thisDraft = thisDraft.filter( x => localFilters.Class[x.profession].enabled && localFilters.Class[x.profession].max > 0)
				
				let oplist = shuffleArray(thisDraft).sort((a,b) => {
					if(localFilters.Rarity[parseInt(a.rarity)].min > 0) return 1;
					if(localFilters.Class[a.profession].min > 0) return 1;
					if(localFilters.Rarity[parseInt(b.rarity)].min > 0) return -1;
					if(localFilters.Class[b.profession].min > 0) return -1;
					return 0;
				})
				return oplist
			}
			let oplist = getOpList()
			let currentSelection = []
			let remaining = localFilters.Squad.draftSize.max
			while (remaining) {
				if (!oplist.length) {
					// set available then rebuild oplist
					availableOperators = Object.values(operatorData).filter(x=> x.selected && !draftedOps.includes(x.charId) && !currentSelection.includes(x.charId))
					oplist = getOpList()
					if (!oplist.length)
						break
				}
				let op = oplist.pop()
				currentSelection.push(op.charId)
				availableOperators = availableOperators.filter(x => x!=op)
				CreateOpCheckbox(op, null, null, null, chooseOp, selection).style.order = -op.rarity
				remaining--
			}
			header.innerHTML = 'Choose one ('+(localFilters.Squad.Size.max - draftedOps.length)+' remaining):'
			if (!availableOperators.length && !currentSelection.length)
				// no ops left for further drafts, so finalize.
				finalizeDraft()
		}
		draftRound()		
	}
	function rerollSquad() {
		destDiv = document.getElementById('output')
		destDiv.classList.remove('draft')
		destDiv.innerHTML = ''
		// pick a squad
		let availableOperators = Object.values(operatorData).filter(x=> x.selected)
		let localFilters = JSON.parse(JSON.stringify(filters))
		
		for (let i = 0; i<filters.Squad.Size.max; i++) {
		// filter by rarity:
		availableOperators = availableOperators.filter( x => localFilters.Rarity[parseInt(x.rarity)].enabled && localFilters.Rarity[parseInt(x.rarity)].max > 0)
		// filter by class:
		availableOperators = availableOperators.filter( x => localFilters.Class[x.profession].enabled && localFilters.Class[x.profession].max > 0)
		
		let randomOne = shuffleArray(availableOperators).sort((a,b) => {
			if(localFilters.Rarity[parseInt(a.rarity)].min > 0) return 1;
			if(localFilters.Class[a.profession].min > 0) return 1;
			if(localFilters.Rarity[parseInt(b.rarity)].min > 0) return -1;
			if(localFilters.Class[b.profession].min > 0) return -1;
			return 0;
		}).pop()
		if (!randomOne)
			break
		CreateOpCheckbox(randomOne, null, null, null, null, destDiv).style.order = -randomOne.rarity
		// reduce min and max
		localFilters.Rarity[parseInt(randomOne.rarity)].min -= 1
		localFilters.Rarity[parseInt(randomOne.rarity)].max -= 1
		localFilters.Class[randomOne.profession].max -= 1
		localFilters.Class[randomOne.profession].min -= 1
		}
	}
	function rerollChallenge() {
		let res = document.getElementById('challengeRoll')
		res.innerHTML = shuffleArray(challengeList).slice(0,filters.Squad.Challenges.max).join('<br/>') || 'None'
		if (res.innerHTML == 'None') {
			res.classList.add('hidden')
			document.getElementById('challengeTitle').classList.add('hidden')
		} else {
			res.classList.remove('hidden')
			document.getElementById('challengeTitle').classList.remove('hidden')
		}
	}
	document.getElementById('rerollStageBtn').onclick = rerollStage
	rerollStage()
	document.getElementById('rerollSquadBtn').onclick = rerollSquad
	rerollSquad()
	document.getElementById('rerollChallengeBtn').onclick = rerollChallenge
	rerollChallenge()
	
	document.getElementById('draftBtn').onclick = draftSquad
}

document.getElementById('goBtn').onclick = Randomize

function updateLocalFilters() {
	localStorage.setItem('randomizerFilters', JSON.stringify(filters))
}

// populate filters
// use settings from filters var, which is previously loaded from localStorage
for (const [key, value] of Object.entries(filters)) {
	let section = document.createElement('table')
	section.classList.add('filterSection')
	let title = document.createElement('tr')
	title.classList.add('hr-row')
	let th = document.createElement('th')
	th.innerHTML = key
	th.setAttribute('colspan',2)
	title.appendChild(th)
	section.appendChild(title)
	for (const [subkey, subvalue] of Object.entries(value)) {
		let row = document.createElement('tr')
		let left = document.createElement('td')
		let right = document.createElement('td')
		let label = document.createElement('label')
		let checkbox = document.createElement('input')
		checkbox.type = 'checkbox'
		checkbox.checked = subvalue.enabled
		checkbox.onchange = () => {subvalue.enabled = checkbox.checked; updateLocalFilters()}
		label.innerHTML = subvalue.disp
		if (subvalue.enabled !== undefined)
		left.appendChild(checkbox)
		left.appendChild(label)
		row.appendChild(left)
		section.appendChild(row)
		
		if (!subvalue.max)
			continue
		label.innerHTML += ":"
		
		
		let min = document.createElement('input')
		min.onchange = () => {subvalue.min = min.value; updateLocalFilters()}
		min.type = 'number'
		min.min = subvalue.minvalmin || 0
		min.max = subvalue.minvalmax || maxTeamSize
		min.value = subvalue.minvaldefault || subvalue.min
		if (subvalue.min !== undefined)
		right.appendChild(min)
		let dash = document.createElement('span')
		dash.innerHTML = '-'
		if (subvalue.min !== undefined)
		right.appendChild(dash)
		let max = document.createElement('input')
		max.onchange = () => {subvalue.max = max.value; updateLocalFilters()}
		max.type = 'number'
		max.min = subvalue.maxvalmin || 0
		max.max = subvalue.maxvalmax || maxTeamSize
		max.value = subvalue.maxvaldefault || subvalue.max
		
		right.appendChild(max)
		row.appendChild(right)
	}
	document.getElementById('options').appendChild(section)
}

document.getElementById('filterResetBtn').onclick = () => {
	localStorage.removeItem('randomizerFilters')
	location.reload()
}

document.getElementById('selectAllBtn').onclick = () => {
	Object.keys(divMap).forEach( x => {
		if (divMap[x].classList.contains('show')) {
			divMap[x].classList.add('_selected')
			operatorData[x].selected = true
		}
	})
	saveOpList()
}
document.getElementById('selectNoneBtn').onclick = () => {
	Object.keys(divMap).forEach( x => {
		if (divMap[x].classList.contains('show')) {
			divMap[x].classList.remove('_selected')
			operatorData[x].selected = false
		}
	})
	saveOpList()
}

function filterByClass() {
	let shownClasses = []
	Array.from(document.getElementsByClassName('class-selector')).forEach(x => {if (x.classList.contains('_selected')) shownClasses.push(x.getAttribute('data-class'))})
	Object.values(divMap).forEach(x => {
		if (shownClasses.length == 0 || shownClasses.includes(x.getAttribute('data-class')))
			x.classList.add('show')
		else
			x.classList.remove('show')
	})
}
// enable class filters:
Array.from(document.getElementsByClassName('class-selector')).forEach(x=> {
x.onclick = () => {x.classList.toggle('_selected'); filterByClass()}
})

})

var randomizerToggles = {filterBtn:true, rosterBtn:true}
let f = localStorage.getItem('randomizerToggles')
if (f) 
	updateJSON(randomizerToggles, JSON.parse(f))

document.getElementById('rosterBtn').onclick = () => {
	document.getElementById('rosterBtn').classList.toggle('checked')
	let roster = document.getElementById('roster')
	roster.classList.toggle('hidden')
	randomizerToggles.rosterBtn = !roster.classList.contains('hidden')
	localStorage.setItem('randomizerToggles', JSON.stringify(randomizerToggles))
}
document.getElementById('filterBtn').onclick = () => {
	document.getElementById('filterBtn').classList.toggle('checked')
	let filter = document.getElementById('filterWrapper')
	filter.classList.toggle('hidden')
	randomizerToggles.filterBtn = !filter.classList.contains('hidden')
	localStorage.setItem('randomizerToggles', JSON.stringify(randomizerToggles))
}
for (var key in randomizerToggles) {
	if (randomizerToggles[key])
		document.getElementById(key).click()
}

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
if (!window.location.hash)
	window.location.hash = '#4'
CCTAG = CCMAP[window.location.hash].tag
document.getElementById('pageTitle').innerHTML = CCMAP[window.location.hash].title
document.getElementById('clearsLink').href = './cc.html' + window.location.hash

var charIdMap = {},
	operatorData, useCount = {},
	maxRisk = {},
	useCountMap = {},
	maxRiskMap = {},
	divMap = {};
fetch('https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/en_US/gamedata/excel/character_table.json')
	.then(res => res.json())
	.then(js => {
		operatorData = js;
		for (var key in operatorData) {
			if (!operatorData[key].displayNumber)
				delete operatorData[key]
		}
		for (var key in operatorData) {
			charIdMap[operatorData[key].name] = key;
		}
		return fetch('./data' + CCTAG + '.json')
	})
	.then(res => res.json())
	.then(js => {
		usedata = js;
		Object.values(usedata).forEach(x => {
			x['squad'].forEach(y => {
				useCount[y] = (useCount[y] || 0) + 1
				maxRisk[y] = Math.max(maxRisk[y] || 0, x.risk)
			})
		})
		Object.keys(operatorData).forEach(x => {
			useCountMap[operatorData[x].name] = useCount[x] || 0
			maxRiskMap[operatorData[x].name] = maxRisk[x] || 0
		})

		Object.keys(operatorData).forEach(x => {
			divMap[operatorData[x].name] = CreateOpCheckbox(operatorData[x]);
		})
		Object.values(operatorData).sort((a, b) => a.name > b.name ? 1 : -1).forEach((x, i) => divMap[x.name].style.order = i);
		document.getElementById('s_name').onclick = () =>
			Object.values(operatorData).sort((a, b) => a.name > b.name ? 1 : -1)
			.forEach((x, i) => divMap[x.name].style.order = i);
		document.getElementById('s_rarity').onclick = () =>
			Object.values(operatorData).sort((a, b) =>
				a.rarity == b.rarity ? (a.name > b.name ? 1 : -1) : (a.rarity < b.rarity ? 1 : -1))
			.forEach((x, i) => divMap[x.name].style.order = i);
		document.getElementById('s_uses').onclick = () =>
			Object.values(operatorData).sort((a, b) =>
				useCountMap[a.name] == useCountMap[b.name] ? (a.name > b.name ? 1 : -1) : (useCountMap[a.name] < useCountMap[b.name] ? 1 : -1))
			.forEach((x, i) => divMap[x.name].style.order = i);
		document.getElementById('s_maxrisk').onclick = () =>
			Object.values(operatorData).sort((a, b) =>
				maxRiskMap[a.name] == maxRiskMap[b.name] ? (a.name > b.name ? 1 : -1) : (maxRiskMap[a.name] < maxRiskMap[b.name] ? 1 : -1))
			.forEach((x, i) => divMap[x.name].style.order = i);
	})


function CreateOpCheckbox(operator) {
	let operatorName = operator.name;

	var checkboxDiv = document.createElement("div");
	checkboxDiv.classList.add('operatorCheckbox');
	checkboxDiv.setAttribute('data-class', operator.profession);
	checkboxDiv.classList.add('show');
	let count = useCountMap[operatorName] || 0;
	checkboxDiv.setAttribute('data-skins', count);
	let useDiv = document.createElement("div");
	useDiv.classList.add('data1');
	useDiv.innerHTML = count
	checkboxDiv.appendChild(useDiv);
	let riskDiv = document.createElement("div");
	riskDiv.classList.add('data2');
	riskDiv.innerHTML = maxRiskMap[operatorName] || 0
	checkboxDiv.appendChild(riskDiv);

	if (count == 0 || count == '?') {} else if (count <= 10)
		checkboxDiv.style.cssText = 'background: rgba(237,248,177,.3);'
	else if (count <= 50)
		checkboxDiv.style.cssText = 'background: rgba(127,205,187,.6);'
	else
		checkboxDiv.style.cssText = 'background: rgba(44,127,184,.6);'


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


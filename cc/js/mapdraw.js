// creates a table element that represents an arknights stage map.
// each "tile" (td) will have a data-tile attribute to use for styling
function tableFromStageData(stageData) {
	let mapData = stageData.mapData
	let table = document.createElement('table')
	table.classList.add('stageMap')
	for (let h=0; h<mapData.map.length; h++) {
		let tr = document.createElement('tr')
		for (let w=0; w<mapData.map[0].length; w++) {
			let td = document.createElement('td')
			td.setAttribute('data-tile',mapData.tiles[mapData.map[h][w]].tileKey)
			td.setAttribute('data-height',mapData.tiles[mapData.map[h][w]].heightType)
			tr.appendChild(td)
		}
		table.appendChild(tr)
	}
	return table	
}

// creates a table element that represents an arknights stage map.
// each "tile" (td) will have a data-tile attribute to use for styling
function tableFromStageData(stageData) {
  let mapData = stageData.mapData;
  let table = document.createElement("table");
  table.classList.add("stageMap");
  for (let h = 0; h < mapData.map.length; h++) {
    let tr = document.createElement("tr");
    for (let w = 0; w < mapData.map[0].length; w++) {
      let td = document.createElement("td");
      td.dataset.tile = mapData.tiles[mapData.map[h][w]].tileKey;
      td.dataset.height = mapData.tiles[mapData.map[h][w]].heightType;
      // data-deploy is one of:
      // 0: can't deploy
      // 1: ground units only
      // 2: air units only
      // 3: both (for special maps like CE)
      td.dataset.deploy = mapData.tiles[mapData.map[h][w]].buildableType;
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  return table;
}

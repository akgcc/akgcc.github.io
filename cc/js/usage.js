const mean = (array) => array.reduce((a, b) => a + b) / array.length;
var UPPER_BOUNDS = 50, LOWER_BOUNDS = 10;
if (!window.location.hash) window.location.hash = '#4'
document.getElementById('clearsLink').href = './cc.html' + window.location.hash
window.onhashchange = () => window.location.reload()
var charIdMap = {},
    operatorData, useCount = {},
    maxRisk = {},
    useCountMap = {},
    maxRiskMap = {},
    divMap = {},
	classMap = {},
	classList = {},
    CCTAG;
fetch('./cctitles.json').then(res => res.json()).then(json => {
    CCMAP = json;
    CCTAG = CCMAP[window.location.hash].tag
    document.getElementById('pageTitle').innerHTML = CCMAP[window.location.hash].title
	if (window.location.hash == '#all')
		document.getElementById('clearsLink').style.display='none'
    return fetch('https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/en_US/gamedata/excel/character_table.json')
}).then(res => res.json()).then(js => {
    operatorData = js;
    for (var key in operatorData) {
        if (!operatorData[key].displayNumber) delete operatorData[key]
    }
    for (var key in operatorData) {
        charIdMap[operatorData[key].name] = key;
    }
    return fetch('./data' + CCTAG + '.json')
}).then(res => res.json()).then(js => {
    usedata = js;
	
	
    Object.values(usedata).forEach(x => {
        x['squad'].forEach(y => {
            if (x.risk >= 18) {
				maxRisk[y] = Math.max(maxRisk[y] || 0, x.risk)
            }
        })
    })
	// union all clears from the same doctor, so their ops are only counted once towards use count.
	Object.keys(usedata).forEach(k => {
		if (usedata[k].duplicate_of) {
			usedata[usedata[k].duplicate_of].squad = [...new Set(usedata[usedata[k].duplicate_of].squad.concat(usedata[k].squad))]
			delete usedata[k]
		}
	})
	
	Object.values(usedata).forEach(x => {
        x['squad'].forEach(y => {
            if (x.risk >= 18) {
				useCount[y] = (useCount[y] || 0) + 1
            }
        })
    })
	// null usedata as we mangled it badly.
	usedata = null
	
    Object.keys(operatorData).forEach(x => {
        useCountMap[operatorData[x].name] = useCount[x] || 0
		classMap[operatorData[x].name] = operatorData[x].profession || ""
		classList[operatorData[x].profession] = null
        maxRiskMap[operatorData[x].name] = maxRisk[x] || 0
    })
	// document.getElementById('barChartContainer').style.height = Object.keys(operatorData).length*parseFloat(getComputedStyle(document.body).fontSize) * 3/4;
	document.getElementById('barChartContainer').style.height = Object.values(useCountMap).filter(x=>x>0).length*parseFloat(getComputedStyle(document.body).fontSize) * 4/5;
	
	LOWER_BOUNDS = mean(Object.values(useCountMap).filter(x=>x!=0))
	UPPER_BOUNDS = LOWER_BOUNDS + getStandardDeviation(Object.values(useCountMap).filter(x=>x!=0))
	
    Object.keys(operatorData).forEach(x => {
        divMap[operatorData[x].name] = CreateOpCheckbox(operatorData[x]);
    })
    var sortedData = []
	function buildSortedData(opdata) {
		sortedData = []
		opdata.forEach((x, i) => {
			divMap[x.name].style.order = i
			if (useCountMap[x.name] > 0)
				sortedData.push([x, useCountMap[x.name], maxRiskMap[x.name], charIdMap[x.name]])
		})
	}
    buildSortedData(Object.values(operatorData).sort((a, b) => useCountMap[a.name] == useCountMap[b.name] ? (a.name > b.name ? 1 : -1) : (useCountMap[a.name] < useCountMap[b.name] ? 1 : -1)))
    labels = sortedData.map(x => x[0].name)
    values = sortedData.map(x => x[1])
    values2 = sortedData.map(x => x[2])

    barGraph = new Chart(document.getElementById("opChart"), {
        type: "horizontalBar",
        data: {
            labels: labels,
            datasets: [{
                label: 'Uses',
                data: values,
                backgroundColor: "#cccccc",
                yAxisID: 'y-axis-1',
                xAxisID: 'x-axis-1'
            }, {
                label: 'Highest',
                data: values2,
                backgroundColor: "#454545",
                yAxisID: 'y-axis-2',
                xAxisID: 'x-axis-2'
            }]
        },
        options: {
            interaction: {
                mode: 'index',
                intersect: false,
            },
            tooltips: {
				xPadding: 6 + 50/2, // default is 6, add imgWidth/2 (25px)
                enabled: false,
                position: 'nearest',
                custom: thumbnail_tooltip(document.getElementById('opChart')),
                // xAlign: 'left'
            },
            maintainAspectRatio: false,
            responsive: true,
            legend: {
                display: false
            },
            scales: {
                yAxes: [{
                    id: 'y-axis-1',
                    type: 'category',
                    categoryPercentage: .7,
                    barPercentage: 1,
                    offset: true,
                    stacked: true,
                    ticks: {
                        fontColor: "#dddddd",
                        beginAtZero: true
                    }
                }, {
                    id: 'y-axis-2',
                    type: 'category',
                    display: false,
                    stacked: true,
                    categoryPercentage: .9,
                    barPercentage: 1,
                    offset: true,
                    gridLines: {
                        display: false,
                        offsetGridLines: true
                    },
                    ticks: {
                        beginAtZero: true
                    }
                }],
                xAxes: [{
                    id: 'x-axis-1',
                    type: 'linear',
                    ticks: {
                        fontColor: "#dddddd",
                    }
                }, {
                    id: 'x-axis-2',
                    type: 'linear',
                    display: false,
                    gridLines: {
                        display: false,
                        offsetGridLines: true
                    },
                    ticks: {
                        fontColor: "#dddddd",
                        min: 17,
                    },
                }],
            }
        }
    });
		Chart.scaleService.updateScaleDefaults('logarithmic', {
	  ticks: {
		callback: function(tick, index, ticks) {
		  return tick.toLocaleString()
		}
	  }
	});
	let imgSize = window.innerWidth/30;
	let scatterData = sortedData.map(d => {return {x: d[1], y: d[2]}})
	let scatterImages = sortedData.map(x => {i = new Image(imgSize,imgSize); i.src='https://aceship.github.io/AN-EN-Tags/img/avatars/'+x[3]+'.png'; i.opname = x[0].name; return i})
  
	window.onresize = () => {
		imgSize = window.innerWidth/30;
		scatterImages.forEach(i=> {i.width = imgSize;i.height=imgSize});
		scatterPlot.update();
	}

	scatterPlot = new Chart(document.getElementById("scatterChart"), {
		type: 'bubble',
		data: {
			labels: labels,
			datasets: [{
				  label: 'Data',
				  radius: imgSize/2,
				  pointStyle: scatterImages,
				data: scatterData
			}]
		},
		options: {
			onResize: (chrt) => {
				chrt.options.layout.padding.top = imgSize/2
				chrt.options.layout.padding.right = imgSize/2
				chrt.chart.data.datasets.forEach(x => x.radius = imgSize/2)
			},
			maintainAspectRatio: true,
			responsive: true,
			layout: {
            padding: {
                top: imgSize/2,
				right: imgSize/2,
            }
        },
		scales: {
			xAxes: [{
				type: "logarithmic",
				afterFit: (scale) => {
					
					scale.options.ticks.minor.padding = imgSize/2;
					scale.options.ticks.major.padding = imgSize/2;
					scale.options.ticks.padding = imgSize/2;
				},
				scaleLabel: {
					display: true,
					labelString: "Uses",
					fontColor:"#dddddd"
				},
				ticks: {
					fontColor: "#dddddd",
					padding:imgSize/2,
					min:1,
				}
			}],
			yAxes: [{
				afterFit: (scale) => {
					scale.options.ticks.minor.padding = imgSize/2;
					scale.options.ticks.major.padding = imgSize/2;
					scale.options.ticks.padding = imgSize/2;
				},
				scaleLabel: {
					display: true,
					labelString: "Highest Risk",
					fontColor:"#dddddd"
				},
				ticks: {
					// min: 18,
					fontColor: "#dddddd",
					padding:imgSize/2,
				},
			}],
		},
		legend: {
			display: false
		},
		  tooltips: {
			  displayColors: false,
			 callbacks: {
				label: function(tooltipItem, data) {
				   var label = data.labels[tooltipItem.index];
				   return label + ' (' + tooltipItem.xLabel +  ')';
				}
			 }
		  }
		}
	});
 
    function redrawCharts(sortName) {
		
		labels = sortedData.map(x => x[0].name)
		
		////// BAR GRAPH ///////
        barGraph.data.labels = labels
        barGraph.data.datasets[0].data = sortedData.map(x => x[1])
        barGraph.data.datasets[1].data = sortedData.map(x => x[2])
        barGraph.update();
		
		
		////// SCATTER PLOT ///////
		scatterPlot.options.scales.yAxes[0].scaleLabel.labelString = sortName
		// reset some axes options to defaults
		// scatterPlot.options.scales.yAxes[0].ticks.min = undefined
		// scatterPlot.options.scales.yAxes[0].type = 'linear'
		scatterPlot.options.scales.yAxes[0].ticks.callback = (value, index, values) => value
		switch(sortName) {
			case 'Rarity':
				scatterData = sortedData.map(d => {return {x: d[1], y: d[0].rarity}})
				scatterPlot.options.scales.yAxes[0].ticks.stepSize = 1
				scatterPlot.options.scales.yAxes[0].ticks.callback = (value, index, values) => '★'.repeat(value+1)
			break
			case 'Class':
				scatterData = sortedData.map(d => {return {x: d[1], y: Object.keys(classList).indexOf(classMap[d[0].name])}})
				scatterPlot.options.scales.yAxes[0].ticks.callback = (value, index, values) => Object.keys(classList)[value]
			break
			case 'NOT!Uses':
				scatterData = sortedData.map(d => {return {x: d[1], y: d[1]}})
				scatterPlot.options.scales.yAxes[0].type = 'logarithmic'
				// scatterPlot.options.scales.yAxes[0].ticks.min = 1
				// scatterPlot.options.scales.yAxes[0].ticks.callback = (value, index, values) => Object.keys(classList)[value]
			break
			default:// == 'Highest Risk'
				scatterData = sortedData.map(d => {return {x: d[1], y: d[2]}})
				// scatterPlot.options.scales.yAxes[0].ticks.min = 18
				scatterPlot.options.scales.yAxes[0].scaleLabel.labelString = 'Highest Risk'
			break
			
		}
		// filter 0 results
		// scatterData = scatterData.filter(d=> d.x>0)
		// sort images by sortedData
		scatterImages.sort((a,b) => labels.indexOf(a.opname) - labels.indexOf(b.opname))

		
		scatterPlot.data.labels = labels
		scatterPlot.data.datasets[0].data = scatterData
		scatterPlot.data.datasets[0].pointStyle = scatterImages
		
		scatterPlot.update()
    }

    function clickFunc(e, sorter) {
        Array.from(document.getElementById('sort').querySelectorAll('.checked')).forEach(x => x.classList.remove('checked'))
		buildSortedData(Object.values(operatorData).sort(sorter))
        redrawCharts(e.currentTarget.innerText)
        e.currentTarget.classList.toggle('checked')
    }
    document.getElementById('s_name').onclick = (e) => clickFunc(e, (a, b) => a.name > b.name ? 1 : -1)
    document.getElementById('s_rarity').onclick = (e) => clickFunc(e, (a, b) => a.rarity == b.rarity ? (useCountMap[a.name] < useCountMap[b.name] ? 1 : -1) : (a.rarity < b.rarity ? 1 : -1))
    document.getElementById('s_uses').onclick = (e) => clickFunc(e, (a, b) => useCountMap[a.name] == useCountMap[b.name] ? (a.name > b.name ? 1 : -1) : (useCountMap[a.name] < useCountMap[b.name] ? 1 : -1))
    document.getElementById('s_maxrisk').onclick = (e) => clickFunc(e, (a, b) => maxRiskMap[a.name] == maxRiskMap[b.name] ? (useCountMap[a.name] < useCountMap[b.name] ? 1 : -1) : (maxRiskMap[a.name] < maxRiskMap[b.name] ? 1 : -1))
	document.getElementById('s_class').onclick = (e) => clickFunc(e, (a, b) => classMap[a.name] == classMap[b.name] ? (useCountMap[a.name] < useCountMap[b.name] ? 1 : -1) : (classMap[a.name] < classMap[b.name] ? 1 : -1))
	var viewType = 1;
    document.getElementById('viewType').onclick = () => {
		viewType = (viewType+1)%3
		Array.from(document.getElementById('chartDiv').querySelectorAll('.chartOption')).forEach(n=>n.classList.add('hidden'))
			Array.from(document.getElementById('sort').querySelectorAll('.button')).forEach(e=>e.classList.remove('disabled'))
		switch (viewType) {
			case 0: // scatter
				document.getElementById('scatterChart').classList.remove('hidden')
				document.getElementById('viewType').innerHTML = 'View: Scatter'
				// Array.from(document.getElementById('sort').querySelectorAll('.button:not(#viewType)')).forEach(e=>e.classList.add('disabled'))
			break;
			case 1: // bar chart
				document.getElementById('barChartContainer').classList.remove('hidden')
				document.getElementById('viewType').innerHTML = 'View: Chart'
			break;
			case 2: // grid
				document.getElementById('checkboxes').classList.remove('hidden')
				document.getElementById('viewType').innerHTML = 'View: Grid'
			break;
		}
    }
	
	document.getElementById('infoButton').onclick = () => {
		document.getElementById('info').classList.toggle('hidden')
	}
	
})

	
function getStandardDeviation (array) {
  const n = array.length
  const mean = array.reduce((a, b) => a + b) / n
  return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
}
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
    if (count == 0 || count == '?') {} else if (count <= LOWER_BOUNDS) checkboxDiv.style.cssText = 'background: rgba(237,248,177,.3);'
    else if (count <= UPPER_BOUNDS) checkboxDiv.style.cssText = 'background: rgba(127,205,187,.6);'
    else checkboxDiv.style.cssText = 'background: rgba(44,127,184,.6);'
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
if (!window.location.hash) window.location.hash = '#1'
window.onhashchange = () => window.location.reload()
var charIdMap = {},
    PTAG = window.location.hash.substr(1);
fetch('https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/en_US/gamedata/excel/character_table.json')
.then(res => res.json()).then(js => {
    let operatorData = js;
    for (var key in operatorData) {
        if (!operatorData[key].displayNumber) delete operatorData[key]
    }
    for (var key in operatorData) {
        charIdMap[operatorData[key].name] = key;
    }
    return fetch('./poll_results_' + PTAG + '.json')
}).then(res => res.json()).then(js => {
	let polldata = js
	let sortMetrics = Object.keys(Object.values(polldata)[0])
	let axesMetrics = ['Power','Utility']
	
	let btns = document.getElementById('sort')
	Array.from(['x-Axis:','y-Axis:']).forEach((axes,i) => {
		let label = document.createElement('label')
		label.innerHTML = axes
		btns.appendChild(label)
		sortMetrics.forEach((n,j) => {
			let btn = document.createElement('div')
			btn.classList = 'sorter button'
			if (axesMetrics[i]==n)
				btn.classList.add('checked')
			btn.setAttribute('data-name',n)
			btn.setAttribute('data-axes',i)
			btn.innerHTML = n
			
			btn.onclick = (e) => {
				// change axesMetrics
				let axis = e.currentTarget.getAttribute('data-axes')
				axesMetrics[axis] = e.currentTarget.innerText
				Array.from(document.getElementById('sort').querySelectorAll('.checked[data-axes="'+axis+'"]')).forEach(x => x.classList.remove('checked'))
				redrawCharts()
				e.currentTarget.classList.toggle('checked')
			}
			
			btns.appendChild(btn)
		})
	})
	
	let labels = Object.keys(polldata)

	let imgSize = window.innerWidth/30;
	let scatterData = Object.values(polldata).map(d => {return {x: d[axesMetrics[0]], y: d[axesMetrics[1]]}})
	let scatterImages = labels.map(x => {i = new Image(imgSize,imgSize); i.src='https://aceship.github.io/AN-EN-Tags/img/avatars/'+charIdMap[x]+'.png'; return i})

	window.onresize = () => {
		imgSize = window.innerWidth/30;
		scatterImages.forEach(i=> {i.width = imgSize;i.height=imgSize});
		scatterPlot.update();
	}
  
	let scatterPlot = new Chart(document.getElementById("scatterChart"), {
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
				afterFit: (scale) => {
					scale.options.ticks.minor.padding = imgSize/2;
					scale.options.ticks.major.padding = imgSize/2;
					scale.options.ticks.padding = imgSize/2;
				},
				scaleLabel: {
					display: true,
					labelString: axesMetrics[0],
					fontColor:"#dddddd"
				},
				ticks: {
					fontColor: "#dddddd",
					padding:imgSize/2,
					// min:1,
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
					labelString: axesMetrics[1],
					fontColor:"#dddddd"
				},
				ticks: {
					fontColor: "#dddddd",
					padding:imgSize/2,
					// min:1,
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
				   return label + ' (' + tooltipItem.xLabel.toFixed(2) + ', ' + tooltipItem.yLabel.toFixed(2) + ')';
				}
			 }
		  }
		}
	});

    function redrawCharts() {
		scatterPlot.options.scales.xAxes[0].scaleLabel.labelString = axesMetrics[0]
		scatterPlot.options.scales.yAxes[0].scaleLabel.labelString = axesMetrics[1]
		scatterData = Object.values(polldata).map(d => {return {x: d[axesMetrics[0]], y: d[axesMetrics[1]]}})
		scatterPlot.data.datasets[0].data = scatterData
		scatterPlot.update()
    }

})


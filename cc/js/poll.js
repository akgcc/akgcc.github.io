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
		operatorData[key].charId = key;
    }
    return fetch('./poll_results_' + PTAG + '.json')
}).then(res => res.json()).then(js => {
	let scatter_data = js['scatter']['data']
	let bar_data = js['bar']['data']
	let bar_total = js['bar']['total']
	let barMetrics = Object.keys(Object.values(bar_data)[0])
	barMetrics.push('E2 Among Owners')
	let barDefaultSort = 'Ownership'
	Object.keys(bar_data).forEach(k => {
		bar_data[k]['name'] = k
		bar_data[k]['E2 Among Owners'] = bar_data[k]['E2']/bar_data[k]['Ownership']
	})
	let sortMetrics = Object.keys(Object.values(scatter_data)[0])
	
	let axesMetrics = ['Power','Utility']
	

	
	btns = document.createElement('div')
	btns.id ='scatterSort'
	btns.classList.add('sortdiv')
	document.getElementById('sort').appendChild(btns)
	Array.from(['x-Axis:','y-Axis:']).forEach((axes,i) => {
		label = document.createElement('label')
		label.innerHTML = axes
		btns.appendChild(label)
		sortMetrics.forEach((n,j) => {
			btn = document.createElement('div')
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
	
	btns = document.createElement('div')
	btns.id = 'barSort'
	btns.classList.add('sortdiv')
	document.getElementById('sort').appendChild(btns)
	label = document.createElement('label')
	label.innerHTML = 'Sort By:'
	btns.appendChild(label)
	barMetrics.forEach((n,j) => {
		btn = document.createElement('div')
		btn.classList = 'sorter button'
		if (n==barDefaultSort)
			btn.classList.add('checked')
		btn.setAttribute('data-name',n)
		// btn.setAttribute('data-axes',i)
		btn.innerHTML = n
		
		btn.onclick = (e) => {
			// change axesMetrics
			// let axis = e.currentTarget.getAttribute('data-axes')
			// axesMetrics[axis] = e.currentTarget.innerText
			Array.from(document.getElementById('sort').querySelectorAll('#barSort .checked')).forEach(x => x.classList.remove('checked'))
			sorted_bar_data = Object.values(bar_data).sort((a,b) => b[barMetrics[j]] - a[barMetrics[j]])
			redrawCharts()
			e.currentTarget.classList.toggle('checked')
			
		}
		btns.appendChild(btn)
	})
	



	function swapCharts(e) {
		if (!e.currentTarget.classList.contains('checked')) {
			Array.from(document.querySelectorAll('.sortdiv')).forEach(e=>e.classList.toggle('hidden'))
			Array.from(document.querySelectorAll('#chartPicker .button')).forEach(e=>e.classList.toggle('checked'))
			document.getElementById('barChartContainer').classList.toggle('hidden')
			document.getElementById('scatterChart').classList.toggle('hidden')
		}
	}
	btns = document.getElementById('chartPicker')
	label = document.createElement('label')
	label.innerHTML = 'Chart:'
	btns.appendChild(label)
	// Add scatter plot
	btn = document.createElement('div')
	btn.classList = 'sorter button checked'
	btn.innerHTML = 'Rating'
	btns.appendChild(btn)
	btn.onclick = swapCharts
	
	// Add bar graph
	btn = document.createElement('div')
	btn.classList = 'sorter button'
	btn.innerHTML = 'Ownership'
	btns.appendChild(btn)
	btn.onclick = swapCharts
	document.getElementById('barChartContainer').classList.toggle('hidden')
	document.getElementById('barSort').classList.toggle('hidden')

	Chart.defaults.color = '#dddddd'

	let labels = Object.keys(scatter_data)

	let imgSize = window.innerWidth/30;
	let scatterData = Object.values(scatter_data).map(d => {return {x: d[axesMetrics[0]], y: d[axesMetrics[1]], r: imgSize/2}})
	let scatterImages = labels.map(x => {i = new Image(imgSize,imgSize); i.src='https://aceship.github.io/AN-EN-Tags/img/avatars/'+charIdMap[x]+'.png'; return i})

	window.onresize = () => {
		imgSize = window.innerWidth/30;
		scatterImages.forEach(i=> {i.width = imgSize;i.height=imgSize});
		scatterPlot.update();
	}
	
	document.getElementById('barChartContainer').style.height = labels.length*parseFloat(getComputedStyle(document.body).fontSize) * 4/5 * 2;
	
	let sorted_bar_data = Object.values(bar_data).sort((a,b) => b[barDefaultSort] - a[barDefaultSort])
	
	let barGraph = new Chart(document.getElementById("opChart"), {
        type: "bar",
        data: {
            labels: sorted_bar_data.map(x => x.name),
            datasets: [{
                label: barMetrics[0],
				categoryPercentage: .8,
                barPercentage: 1,
                data: sorted_bar_data.map(x=> 100*x[barMetrics[0]]),
                backgroundColor: "#845994",
            }, {
                label: barMetrics[1],
				categoryPercentage: .8,
                barPercentage: 1,
                data: sorted_bar_data.map(x=> 100*x[barMetrics[1]]),
                backgroundColor: "#948d52",
            }]
        },
        options: {
			indexAxis: 'y',
            interaction: {
                mode: 'index',
            },
            maintainAspectRatio: false,
            responsive: true,
			plugins: {
				tooltip: {
					padding: {
						x: 6 + (63.2-6)/2, // default is 6, add (tooltipHeight - 6)/2
						y: 6,
					},
				 callbacks: {
					label: function(context, data) {
					   if (context.dataset.label.includes('E2'))
						   return context.dataset.label + ': ' + context.raw.toFixed(1) + '% (' + (context.raw/context.chart.data.datasets[context.datasetIndex^1].data[context.dataIndex]*100).toFixed(1) + '%)';
					   return context.dataset.label + ': ' + context.raw.toFixed(1) + '%'
					}
				 },
					enabled: false,
					// position: 'nearest',
					external: thumbnail_tooltip(document.getElementById('opChart')),
					// xAlign: 'left'
				}
			}
        }
    });
	let scatterPlot = new Chart(document.getElementById("scatterChart"), {
		type: 'bubble',
		data: {
			labels: labels,
			datasets: [{
				  label: 'Data',
				  pointStyle: scatterImages,
				data: scatterData
			}]
		},
		options: {
			onResize: (chart) => {
				chart.options.layout.padding.top = imgSize/2
				chart.options.layout.padding.right = imgSize/2
				chart.data.datasets.forEach(d => d.data.forEach(x => x.r = imgSize/2))
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
			x: {
				afterFit: (scale) => {
					scale.options.ticks.minor.padding = imgSize/2;
					scale.options.ticks.major.padding = imgSize/2;
					scale.options.ticks.padding = imgSize/2;
				},
				title: {
					display: true,
					text: axesMetrics[0],
				},
				ticks: {
					padding:imgSize/2,
				}
			},
			y: {
				afterFit: (scale) => {
					scale.options.ticks.minor.padding = imgSize/2;
					scale.options.ticks.major.padding = imgSize/2;
					scale.options.ticks.padding = imgSize/2;
				},
				title: {
					display: true,
					text: axesMetrics[1],
				},
				ticks: {
					padding:imgSize/2,
				},
			},
		},
		  
		  plugins: {
			  tooltip: {
			  displayColors: false,
			 callbacks: {
				label: function(context, data) {
					return context.chart.data.labels[context.dataIndex] + ' (' + context.raw.x.toFixed(2) + ', ' + context.raw.y.toFixed(2) + ')'
				}
			 }
		  },
			  legend: {
				  display: false
			  }
		  }
		}
	});

    function redrawCharts() {
		scatterPlot.options.scales.x.title.text = axesMetrics[0]
		scatterPlot.options.scales.y.title.text = axesMetrics[1]
		scatterData = Object.values(scatter_data).map(d => {return {x: d[axesMetrics[0]], y: d[axesMetrics[1]], r: imgSize/2}})
		scatterPlot.data.datasets[0].data = scatterData
		scatterPlot.update()
		
		barGraph.data.labels = sorted_bar_data.map(x => x.name)
		for (i=0; i< barGraph.data.datasets.length; i++)
			barGraph.data.datasets[i].data = sorted_bar_data.map(x=> 100*x[barMetrics[i]])
        barGraph.update();
    }

})


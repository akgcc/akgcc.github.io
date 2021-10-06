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
	let scatter_data = js['scatter']['data']
	let bar_data = js['bar']['data']
	let bar_total = js['bar']['total']
	let barMetrics = Object.keys(Object.values(bar_data)[0])
	barMetrics.push('E2% of Owners')
	let barDefaultSort = 'Ownership'
	Object.keys(bar_data).forEach(k => {
		bar_data[k]['name'] = k
		bar_data[k]['E2% of Owners'] = bar_data[k]['E2%']/bar_data[k]['Ownership']
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



	let labels = Object.keys(scatter_data)

	let imgSize = window.innerWidth/30;
	let scatterData = Object.values(scatter_data).map(d => {return {x: d[axesMetrics[0]], y: d[axesMetrics[1]]}})
	let scatterImages = labels.map(x => {i = new Image(imgSize,imgSize); i.src='https://aceship.github.io/AN-EN-Tags/img/avatars/'+charIdMap[x]+'.png'; return i})

	window.onresize = () => {
		imgSize = window.innerWidth/30;
		scatterImages.forEach(i=> {i.width = imgSize;i.height=imgSize});
		scatterPlot.update();
	}
	
	document.getElementById('barChartContainer').style.height = labels.length*parseFloat(getComputedStyle(document.body).fontSize) * 4/5 * 2;
	
	let sorted_bar_data = Object.values(bar_data).sort((a,b) => b[barDefaultSort] - a[barDefaultSort])
	// let sorted_bar_data = Object.values(bar_data).sort((a,b) => b['E2%']/b['Ownership'] - a['E2%']/a['Ownership'])
	// let sorted_bar_data = Object.values(bar_data).sort((a,b) => parseInt(charIdMap[b.name].split('_')[1]) - parseInt(charIdMap[a.name].split('_')[1]))
	
	let barGraph = new Chart(document.getElementById("opChart"), {
        type: "horizontalBar",
        data: {
            labels: sorted_bar_data.map(x => x.name),
            datasets: [{
                label: barMetrics[0],
                data: sorted_bar_data.map(x=> 100*x[barMetrics[0]]),
                backgroundColor: "#845994",
                yAxisID: 'y-axis-1',
                xAxisID: 'x-axis-1'
            }, {
                label: barMetrics[1],
                data: sorted_bar_data.map(x=> 100*x[barMetrics[1]]),
                backgroundColor: "#948d52",
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
                enabled: true,
                position: 'nearest',
                // custom: ttfunc,
                xAlign: 'left'
            },
            maintainAspectRatio: false,
            responsive: true,
            legend: {
                display: true,
				labels: {
					fontColor: "#dddddd",
				}
            },
            scales: {
                yAxes: [{
                    id: 'y-axis-1',
                    type: 'category',
                    categoryPercentage: .8,
                    barPercentage: 1,
                    offset: true,
                    // stacked: true,
                    ticks: {
                        fontColor: "#dddddd",
                        beginAtZero: true
                    }
                }, {
                    id: 'y-axis-2',
                    type: 'category',
                    display: false,
                    // stacked: true,
                    categoryPercentage: .8,
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
						stepSize: 5,
						beginAtZero: true,
						max: 100,
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
						stepSize: 5,
						beginAtZero: true,
						max: 100,
                    },
                }],
            },
			tooltips: {
			 callbacks: {
				label: function(tooltipItem, data) {
				   if (barMetrics[tooltipItem.datasetIndex].includes('E2'))
						return barMetrics[tooltipItem.datasetIndex] + ' (' + tooltipItem.xLabel.toFixed(1) +  '%) [' + (tooltipItem.xLabel/data.datasets[tooltipItem.datasetIndex^1].data[tooltipItem.index]*100).toFixed(1) + '%]';
				   return barMetrics[tooltipItem.datasetIndex] + ' (' + tooltipItem.xLabel.toFixed(1) +  '%)';
				}
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
		scatterData = Object.values(scatter_data).map(d => {return {x: d[axesMetrics[0]], y: d[axesMetrics[1]]}})
		scatterPlot.data.datasets[0].data = scatterData
		scatterPlot.update()
		
		barGraph.data.labels = sorted_bar_data.map(x => x.name)
		for (i=0; i< barGraph.data.datasets.length; i++)
			barGraph.data.datasets[i].data = sorted_bar_data.map(x=> 100*x[barMetrics[i]])
        barGraph.update();
    }

})


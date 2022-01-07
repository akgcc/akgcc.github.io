const serverString = localStorage.getItem("server") || "en_US";
var operatorData;
const GAMEPRESS_NAME_MAP = { "Rosa (Poca)": "Rosa" };
const SHORTENED_NAME_MAP = { "Skadi the Corrupting Heart": "Skadiva" };
get_char_table()
	.then((js) => {
		operatorData = js;
		console.log(operatorData);
		return fetch("./json/banner_history.json");
	})
	.then((res) => res.json())
	.then((js) => {
		const SERV_START = Date.parse("2020-01-16");
		const SERV_DATA = js.NA;

		for (const [op, data] of Object.entries(SERV_DATA)) {
			let name = htmlDecode(op);
			data.op = SHORTENED_NAME_MAP[name] || name;
			data.op = GAMEPRESS_NAME_MAP[data.op] || data.op;
			data.charId = charIdMap[data.op];
			data.first = Math.min(...data.banner.map(Date.parse));

			data.shop = data.shop.map(Date.parse).sort();
			// data.diff = 0;
			// if (data.shop.length) {
			// 	data.diff = Math.min(...data.shop.map(Date.parse)) - data.first;
			// }
			if (operatorData[data.charId].rarity != 5) delete SERV_DATA[op];
		}
		var datasets = [
			{
				data: Object.values(SERV_DATA),
				xValueType: "dateTime",
				backgroundColor: "#0002",
				parsing: {
					xAxisKey: "first",
					yAxisKey: "op",
				},
				stack: "1",
			},
		];
		let idx = 0;
		let cont = true;
		while (cont) {
			cont = false;
			for (const [op, data] of Object.entries(SERV_DATA)) {
				if (data.shop.length > idx) {
					cont = true;
					data[idx.toString()] =
						data.shop[idx] - (data.shop[idx - 1] || data.first);
				} else data[idx.toString()] = 0;
			}
			if (cont) {
				datasets.push({
					data: Object.values(SERV_DATA),
					xValueType: "dateTime",
					backgroundColor: !idx ? "#f002" : selectColor(idx, 80),
					parsing: {
						xAxisKey: idx.toString(),
						yAxisKey: "op",
					},
					stack: "1",
				});
			}
			idx++;
		}
		console.log(SERV_DATA);
		document.getElementById("barChartContainer").style.height =
			((Object.keys(SERV_DATA).length *
				parseFloat(getComputedStyle(document.body).fontSize) *
				4) /
				5) *
			2;
		console.log(datasets);
		let barGraph = new Chart(document.getElementById("opChart"), {
			type: "bar",
			data: {
				labels: Object.values(SERV_DATA)

					.sort((a, b) => {
						console.log(a.charId, b.charId);
						if (
							operatorData[a.charId].rarity ==
							operatorData[b.charId].rarity
						) {
							if (a.op > b.op) return 1;
							return -1;
						}
						if (
							operatorData[a.charId].rarity >
							operatorData[b.charId].rarity
						)
							return -1;
						return 1;
					})
					.map((x) => x.op),
				datasets: datasets,
				// [
				// 	{
				// 		// label: "hello",
				// 		// categoryPercentage: 0.8,
				// 		// barPercentage: 1,
				// 		data: Object.values(SERV_DATA),
				// 		xValueType: "dateTime",
				// 		backgroundColor: "#845994",
				// 		parsing: {
				// 			xAxisKey: "first",
				// 			yAxisKey: "op",
				// 		},
				// 		stack: "1",
				// 	},
				// 	{
				// 		data: Object.values(SERV_DATA),
				// 		xValueType: "dateTime",
				// 		backgroundColor: "#ffa",
				// 		parsing: {
				// 			xAxisKey: "diff",
				// 			yAxisKey: "op",
				// 		},
				// 		stack: "1",
				// 	},
				// 	// {
				// 	// 	label: barMetrics[1],
				// 	// 	categoryPercentage: 0.8,
				// 	// 	barPercentage: 1,
				// 	// 	data: sorted_bar_data.map(
				// 	// 		(x) => 100 * x[barMetrics[1]]
				// 	// 	),
				// 	// backgroundColor: "#948d52",
				// 	// },
				// ],
			},
			// plugins: [ChartDataLabels],
			options: {
				layout: {
					padding: 40,
				},
				indexAxis: "y",
				interaction: {
					// mode: "index",
				},

				plugins: {
					legend: {
						display: false,
					},
					tooltip: {
						enabled: false,
					},
				},
				maintainAspectRatio: false,
				responsive: true,

				scales: {
					x: {
						type: "time",
						time: {
							unit: "month",
							// minUnit: "month",
						},
						min: SERV_START,
						max: Date.now(),
						// scaleLabel: {
						// 	display: true,
						// 	labelString: "Timestamp",
						// },
					},
				},
				// plugins: {
				// 	datalabels: {
				// 		color: "#000",
				// 		formatter: (v, ctx) => v.toFixed(2) + "%",
				// 	},
				// 	tooltip: {
				// 		callbacks: {
				// 			label: function (context) {
				// 				if (context.dataset.label.includes("E2"))
				// 					return (
				// 						context.dataset.label +
				// 						": " +
				// 						context.raw.toFixed(1) +
				// 						"% (" +
				// 						(
				// 							(context.raw /
				// 								context.chart.data.datasets[
				// 									context.datasetIndex ^ 1
				// 								].data[context.dataIndex]) *
				// 							100
				// 						).toFixed(1) +
				// 						"%)"
				// 					);
				// 				return (
				// 					context.dataset.label +
				// 					": " +
				// 					context.raw.toFixed(1) +
				// 					"%"
				// 				);
				// 			},
				// 		},
				// 		enabled: false,
				// 		// position: 'nearest',
				// 		external: thumbnail_tooltip(
				// 			document.getElementById("opChart")
				// 		),
				// 		// xAlign: 'left'
				// 	},
				// },
			},
		});
	});
// const SERVERS = {
// 	EN: "en_US",
// 	JP: "ja_JP",
// 	KR: "ko_KR",
// 	CN: "zh_CN",
// };
// const serverSelect = document.getElementById("serverSelect");
// Object.keys(SERVERS).forEach((k) => {
// 	let opt = document.createElement("option");
// 	opt.value = SERVERS[k];
// 	opt.innerHTML = k;
// 	serverSelect.appendChild(opt);
// });
// serverSelect.onchange = () => {
// 	localStorage.setItem("server", serverSelect.value);
// 	sessionStorage.setItem("userChange", true);
// 	location.reload();
// };

// Array.from(serverSelect.options).forEach((opt, i) => {
// 	if (opt.value == serverString) opt.selected = true;
// 	else opt.selected = false;
// });

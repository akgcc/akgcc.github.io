const serverString = localStorage.getItem("server") || "en_US";
var operatorData;
const GAMEPRESS_NAME_MAP = { "Rosa (Poca)": "Rosa" };
const SHORTENED_NAME_MAP = { "Skadi the Corrupting Heart": "Skadiva" };
function createDiagonalPattern(fillcolor) {
	//https://stackoverflow.com/questions/28569667/fill-chart-js-bar-chart-with-diagonal-stripes-or-other-patterns
	// create a 10x10 px canvas for the pattern's base shape
	let shape = document.createElement("canvas");
	shape.width = 10;
	shape.height = 10;
	// get the context for drawing
	let c = shape.getContext("2d");
	c.beginPath();
	c.rect(0, 0, 10, 10);
	c.fillStyle = fillcolor;
	c.fill();
	c.strokeStyle = "#0008";
	c.beginPath();
	c.moveTo(2, 0);
	c.lineTo(10, 8);
	c.stroke();

	c.beginPath();
	c.moveTo(0, 3);
	c.lineTo(7, 10);
	c.stroke();

	c.beginPath();
	c.moveTo(7, 0);
	c.lineTo(10, 3);
	c.stroke();

	c.beginPath();
	c.moveTo(0, 8);
	c.lineTo(2, 10);
	c.stroke();
	// create the pattern from the shape
	return c.createPattern(shape, "repeat");
}
get_char_table()
	.then((js) => {
		operatorData = js;
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
			const img = new Image();
			// img.src = `https://aceship.github.io/AN-EN-Tags/img/avatars/${
			// 	chart.data.datasets[args.index].data[i].charId
			// }.png`;
			img.src = `https://aceship.github.io/AN-EN-Tags/img/avatars/${data.charId}.png`;
			data.img = img;
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
				backgroundColor: "#0000",
				parsing: {
					xAxisKey: "first",
					yAxisKey: "op",
				},
				stack: "1",
				categoryPercentage: 1.0,
				barPercentage: 0.6,
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
					// data[`${idx}_sum`] =
					// 	(idx == 0 ? data["first"] : data[(idx - 1).toString()]) + data.shop;
				} else data[idx.toString()] = 0;
			}
			if (cont) {
				datasets.push({
					data: Object.values(SERV_DATA),
					xValueType: "dateTime",
					backgroundColor: [
						...Array(Object.values(SERV_DATA).length).keys(),
					].map((x) =>
						!idx
							? createDiagonalPattern(selectColor(x, 40, 40))
							: selectColor(x, 80)
					),
					// !idx
					// 	? createDiagonalPattern(selectColor(idx, 50))
					// 	: selectColor(idx, 100),
					parsing: {
						xAxisKey: idx.toString(),
						yAxisKey: "op",
					},
					stack: "1",
					categoryPercentage: 1.0,
					barPercentage: 0.6,
				});
			}
			idx++;
		}
		Chart.defaults.color = "#dddddd";
		Chart.defaults.font.size = 16;
		const testp = {
			id: "testp",
			afterDatasetDraw(chart, args, options) {
				// console.log(chart, args, options);
				// chart.data.datasets[args.index];
				// console.log(args.index);
				// console.log(args.index, args.meta._dataset.parsing.xAxisKey);
				// console.log(
				// 	chart.data.datasets[args.index].data[0][
				// 		args.meta._dataset.parsing.xAxisKey
				// 	]
				// );
				const {
					ctx,
					chartArea: { top, bottom, left, right, width, height },
					scales: { x, y },
				} = chart;
				for (
					let i = 0;
					i < chart.data.datasets[args.index].data.length;
					i++
				) {
					//assumue all bars are the same size
					const imgsize = args.meta.data[0].height * 1.8;
					// position is actually the sum of the entire stack

					ctx.save();
					ctx.strokeStyle = "#999";
					// if NaN this is the "first" index
					shop_idx = parseInt(args.meta._dataset.parsing.xAxisKey);
					let first_apperance = isNaN(shop_idx);
					// if this op appears in the shop later, don't draw the first appearance bubble.
					if (
						first_apperance &&
						chart.data.datasets[args.index].data[i].shop.length
					)
						continue;
					let x_pos = x.getPixelForValue(
						chart.data.datasets[args.index].data[i].shop[
							parseInt(args.meta._dataset.parsing.xAxisKey)
						]
					);
					if (first_apperance)
						x_pos = x.getPixelForValue(
							chart.data.datasets[args.index].data[i][
								args.meta._dataset.parsing.xAxisKey
							]
						);
					let y_pos = y.getPixelForValue(
						chart.data.datasets[args.index].data[i][
							args.meta._dataset.parsing.yAxisKey
						]
					);
					if (!x_pos || !y_pos) {
						// console.log(x_pos, y_pos);
						ctx.restore();
						continue;
					}
					ctx.translate(x_pos, y_pos);
					ctx.beginPath();
					ctx.arc(
						0,
						0,
						Math.min(imgsize / 2, imgsize / 2),
						0,
						Math.PI * 2,
						false
					);
					ctx.closePath();
					if (!first_apperance) ctx.stroke();
					ctx.clip();
					ctx.drawImage(
						chart.data.datasets[args.index].data[i].img,
						-imgsize / 2,
						-imgsize / 2,
						imgsize,
						imgsize
					);
					if (first_apperance) {
						ctx.fillStyle = "#0008";
						ctx.fill();
					}
					ctx.restore();
				}
			},
		};
		document.getElementById("barChartContainer").style.height =
			((Object.keys(SERV_DATA).length *
				parseFloat(getComputedStyle(document.body).fontSize) *
				5) /
				5) *
			2;
		let barGraph = new Chart(document.getElementById("opChart"), {
			type: "bar",
			data: {
				labels: Object.values(SERV_DATA)

					.sort((a, b) => {
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
			plugins: [testp],
			options: {
				layout: {
					padding: {
						// right: 40,
					},
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
						},
						min: SERV_START,
						max: Date.now(),
						grid: {
							// display: false,
							color: "#777",
							// borderColor: "#aaa",
						},
					},
					x1: {
						position: "top",
						type: "time",
						time: {
							unit: "month",
						},
						min: SERV_START,
						max: Date.now(),
					},
					y: {
						ticks: {
							padding: 20,
						},
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

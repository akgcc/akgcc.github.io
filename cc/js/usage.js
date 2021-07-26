var labels = ['Red Vans', 'Blue Vans', 'Green Vans', 'Gray Vans'];
var images = ['https://i.stack.imgur.com/2RAv2.png', 'https://i.stack.imgur.com/Tq5DA.png', 'https://i.stack.imgur.com/3KRtW.png', 'https://i.stack.imgur.com/iLyVi.png'];
var values = [48, 56, 33, 44];
if (!window.location.hash) window.location.hash = '#4'
document.getElementById('clearsLink').href = './cc.html' + window.location.hash
var charIdMap = {},
    operatorData, useCount = {},
    maxRisk = {},
    useCountMap = {},
    maxRiskMap = {},
    divMap = {},
    CCTAG;
fetch('./cctitles.json').then(res => res.json()).then(json => {
    CCMAP = json;
    CCTAG = CCMAP[window.location.hash].tag
    document.getElementById('pageTitle').innerHTML = CCMAP[window.location.hash].title
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
                if (!x.duplicate_of) {
                    useCount[y] = (useCount[y] || 0) + 1
                }
                maxRisk[y] = Math.max(maxRisk[y] || 0, x.risk)
            }
        })
    })
    Object.keys(operatorData).forEach(x => {
        useCountMap[operatorData[x].name] = useCount[x] || 0
        maxRiskMap[operatorData[x].name] = maxRisk[x] || 0
    })
    Object.keys(operatorData).forEach(x => {
        divMap[operatorData[x].name] = CreateOpCheckbox(operatorData[x]);
    })
    var sortedData = {}
    Object.values(operatorData).sort((a, b) => useCountMap[a.name] == useCountMap[b.name] ? (a.name > b.name ? 1 : -1) : (useCountMap[a.name] < useCountMap[b.name] ? 1 : -1)).forEach((x, i) => {
        divMap[x.name].style.order = i
        sortedData[i] = [x.name, useCountMap[x.name], maxRiskMap[x.name]]
    })
    labels = Object.values(sortedData).map(x => x[0])
    values = Object.values(sortedData).map(x => x[1])
    values2 = Object.values(sortedData).map(x => x[2])

    function ttfunc(tooltip) {
        var tooltipEl = document.getElementById('chartjs-tooltip')
        if (!tooltip.title) {
            tooltipEl.classList.add('hidden')
            return
        }
        tooltipEl.classList.remove('hidden')
        // tooltipEl.classList.remove('above');
        // tooltipEl.classList.remove('below');
        // tooltipEl.classList.add(tooltip.yAlign);
        var innerHtml = '<img src="https://aceship.github.io/AN-EN-Tags/img/avatars/' + charIdMap[tooltip.title[0]] + '.png"> <div> <span><b>' + tooltip.title[0] + '</b></span>';
        for (const [i, b] of tooltip.body.entries()) {
            innerHtml += '<span><i class="fas fa-square-full" style="color: ' + tooltip.labelColors[i].backgroundColor + '; font-size:' + (parseInt(tooltip.bodyFontSize) - 2) + '"></i>' + b.lines[0] + '</span>'
        }
        innerHtml += '</div>'

        tooltipEl.innerHTML = innerHtml
        tooltipEl.style.opacity = 1,
            tooltipEl.style.left = document.getElementById('opChart').offsetLeft + barGraph.chartArea.left + tooltip.x + 'px',
            tooltipEl.style.top = document.getElementById('opChart').offsetTop + barGraph.chartArea.top + tooltip.y + 'px',
            tooltipEl.style.fontFamily = tooltip._bodyFontFamily,
            tooltipEl.style.fontSize = tooltip.bodyFontSize,
            tooltipEl.style.fontStyle = tooltip._bodyFontStyle
    }

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
                enabled: false,
                position: 'nearest',
                custom: ttfunc
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

    function redrawChart() {
        barGraph.data.labels = Object.values(sortedData).map(x => x[0])
        barGraph.data.datasets[0].data = Object.values(sortedData).map(x => x[1])
        barGraph.data.datasets[1].data = Object.values(sortedData).map(x => x[2])
        barGraph.update();
    }

    function clickFunc(e, sorter) {
        Array.from(document.getElementById('sort').querySelectorAll('.checked')).forEach(x => x.classList.remove('checked'))
        Object.values(operatorData).sort(sorter).forEach((x, i) => {
            divMap[x.name].style.order = i
            sortedData[i] = [x.name, useCountMap[x.name], maxRiskMap[x.name]]
        })
        redrawChart()
        e.currentTarget.classList.toggle('checked')
    }
    document.getElementById('s_name').onclick = (e) => clickFunc(e, (a, b) => a.name > b.name ? 1 : -1)
    document.getElementById('s_rarity').onclick = (e) => clickFunc(e, (a, b) => a.rarity == b.rarity ? (a.name > b.name ? 1 : -1) : (a.rarity < b.rarity ? 1 : -1))
    document.getElementById('s_uses').onclick = (e) => clickFunc(e, (a, b) => useCountMap[a.name] == useCountMap[b.name] ? (a.name > b.name ? 1 : -1) : (useCountMap[a.name] < useCountMap[b.name] ? 1 : -1))
    document.getElementById('s_maxrisk').onclick = (e) => clickFunc(e, (a, b) => maxRiskMap[a.name] == maxRiskMap[b.name] ? (a.name > b.name ? 1 : -1) : (maxRiskMap[a.name] < maxRiskMap[b.name] ? 1 : -1))
    document.getElementById('viewType').onclick = () => {
        document.getElementById('checkboxes').classList.toggle('hidden')
        document.getElementById('chartDiv').classList.toggle('hidden')
        document.getElementById('viewType').innerHTML = document.getElementById('checkboxes').classList.contains('hidden') ? 'View: Chart' : 'View: Grid'
    }
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
    if (count == 0 || count == '?') {} else if (count <= 10) checkboxDiv.style.cssText = 'background: rgba(237,248,177,.3);'
    else if (count <= 50) checkboxDiv.style.cssText = 'background: rgba(127,205,187,.6);'
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
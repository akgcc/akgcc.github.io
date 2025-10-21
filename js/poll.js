const POLLS = ["#1", "#2", "#3", "#4"];
if (!window.location.hash) window.location.hash = POLLS.slice(-1);
window.onhashchange = () => window.location.reload();
var PTAG = window.location.hash.substr(1);
const MASTERY_POLLS = ["#3"];
const POLL_INCLUDES_MASTERIES = MASTERY_POLLS.includes(window.location.hash);
const OWNERSHIP_E2_NAME = "E2";
const OVERALL_E2_NAME = "E2 (Overall)";
POLLS.forEach((poll) => {
  let a = document.createElement("a");
  a.classList.add("rightButton", "button");
  a.href = "/poll" + poll;
  if (poll == window.location.hash) a.classList.add("checked");
  a.innerHTML = poll;
  document
    .getElementById("topNav")
    .insertBefore(a, document.getElementById("homeButton"));
});
get_char_table()
  .then((js) => {
    let operatorData = js;
    return fetch("/json/poll_results_" + PTAG + ".json");
  })
  .then((res) => fixedJson(res))
  .then((js) => {
    let scatter_data = js["scatter"]["data"];
    let bar_data = js?.["bar"]?.["data"];
    let bar_total, barMetrics, barDefaultSort;
    if (bar_data) {
      bar_total = js["bar"]["total"];
      barMetrics = Object.keys(Object.values(bar_data)[0]);
      barDefaultSort = "Ownership";
      // barMetrics.push(barMetrics.splice(1, 1)[0]); // move E2 to end of list
      barMetrics.splice(1, 1); // move E2 to end of list
      barMetrics.push(OVERALL_E2_NAME);
      barMetrics.splice(1, 0, OWNERSHIP_E2_NAME);
      Object.keys(bar_data).forEach((k) => {
        bar_data[k]["name"] = k;
        bar_data[k][OVERALL_E2_NAME] = bar_data[k]["E2"];
        bar_data[k][OWNERSHIP_E2_NAME] =
          bar_data[k][OVERALL_E2_NAME] / bar_data[k]["Ownership"];
      });
    } else bar_total = js["scatter"]["total"];
    let sortMetrics = Object.keys(Object.values(scatter_data)[0]);
    let axesMetrics = js["scatter"]["default_axes"];

    btns = document.createElement("div");
    btns.id = "scatterSort";
    btns.classList.add("sortdiv");
    document.getElementById("sort").appendChild(btns);
    Array.from(["x-Axis:", "y-Axis:"]).forEach((axes, i) => {
      label = document.createElement("label");
      label.innerHTML = axes;
      btns.appendChild(label);
      axesMetrics.forEach((n, j) => {
        btn = document.createElement("div");
        btn.classList = "sorter button";
        if (axesMetrics[i] == n) btn.classList.add("checked");
        btn.dataset.name = n;
        btn.dataset.axes = i;
        btn.innerHTML = n;

        btn.onclick = (e) => {
          // change axesMetrics
          let axis = e.currentTarget.dataset.axes;
          axesMetrics[axis] = e.currentTarget.innerText;
          Array.from(
            document
              .getElementById("sort")
              .querySelectorAll('.checked[data-axes="' + axis + '"]'),
          ).forEach((x) => x.classList.remove("checked"));
          redrawCharts();
          e.currentTarget.classList.toggle("checked");
        };
        btns.appendChild(btn);
      });
    });

    btns = document.createElement("div");
    btns.id = "barSort";
    btns.classList.add("sortdiv");
    document.getElementById("sort").appendChild(btns);
    label = document.createElement("label");
    label.innerHTML = "Sort By:";
    btns.appendChild(label);
    if (bar_data)
      barMetrics.forEach((n, j) => {
        btn = document.createElement("div");
        btn.classList = "sorter button";
        if (n == barDefaultSort) btn.classList.add("checked");
        btn.dataset.name = n;
        // btn.setAttribute('data-axes',i)
        btn.innerHTML = n;

        btn.onclick = (e) => {
          // change axesMetrics
          // let axis = e.currentTarget.getAttribute('data-axes')
          // axesMetrics[axis] = e.currentTarget.innerText
          Array.from(
            document
              .getElementById("sort")
              .querySelectorAll("#barSort .checked"),
          ).forEach((x) => x.classList.remove("checked"));
          sorted_bar_data = Object.values(bar_data).sort(
            (a, b) => b[barMetrics[j]] - a[barMetrics[j]],
          );
          redrawCharts();
          e.currentTarget.classList.toggle("checked");
        };
        btns.appendChild(btn);
      });

    function swapCharts(e) {
      if (!e.currentTarget.classList.contains("checked")) {
        Array.from(document.querySelectorAll(".sortdiv")).forEach((e) =>
          e.classList.toggle("hidden"),
        );
        Array.from(document.querySelectorAll("#chartPicker .button")).forEach(
          (e) => e.classList.toggle("checked"),
        );
        document.getElementById("barChartContainer").classList.toggle("hidden");
        document.getElementById("scatterChart").classList.toggle("hidden");
      }
    }
    btns = document.getElementById("chartPicker");
    label = document.createElement("label");
    label.innerHTML = "Chart:";
    btns.appendChild(label);
    // Add scatter plot
    btn = document.createElement("div");
    btn.classList = "sorter button checked";
    btn.innerHTML = "Rating";
    btns.appendChild(btn);
    btn.onclick = swapCharts;

    // Add bar graph
    btn = document.createElement("div");
    btn.classList = "sorter button";
    btn.innerHTML = "Ownership";
    if (bar_data) btns.appendChild(btn);
    btn.onclick = swapCharts;
    document.getElementById("barChartContainer").classList.toggle("hidden");
    document.getElementById("barSort").classList.toggle("hidden");

    // Show sample size
    let spacer = document.createElement("div");
    spacer.style.flexGrow = "1";
    btns.appendChild(spacer);
    let samples = document.createElement("div");
    samples.style =
      "text-align:right;position:absolute;right:0;padding:8px;margin:0;";
    samples.innerHTML = `<a style="color: #FFF;" href="${js.url}">${js.date}</a><br/>Sample Size: ${bar_total}`;
    btns.appendChild(samples);

    Chart.defaults.color = "#dddddd";

    let labels = Object.keys(scatter_data);

    let imgSize = window.innerWidth / 30;
    let scatterData = Object.values(scatter_data).map((d) => {
      return { x: d[axesMetrics[0]], y: d[axesMetrics[1]], r: imgSize / 2 };
    });
    charIdMap["Ulpianus"] = "char_4145_ulpia";
    charIdMap["Narantuya"] = "char_4138_narant";
    charIdMap["Marcille"] = "char_4141_marcil";
    charIdMap["Vulpisfoglia"] = "char_4026_vulpis";
    charIdMap["Crownslayer"] = "char_1502_crosly";
    charIdMap["Nymph"] = "char_4146_nymph";
    charIdMap["Lappland the Decadenza"] = "char_1038_whitw2";
    charIdMap["Vina Victoria"] = "char_1019_siege2";
    charIdMap["Pepe"] = "char_4058_pepe";
    let scatterImages = labels.map((x) => {
      i = new Image(imgSize, imgSize);
      i.src = uri_avatar(charIdMap[x]);
      return i;
    });
    window.onresize = () => {
      imgSize = window.innerWidth / 30;
      scatterImages.forEach((i) => {
        i.width = imgSize;
        i.height = imgSize;
      });
      scatterPlot.update();
    };

    document.getElementById("barChartContainer").style.height =
      ((labels.length *
        parseFloat(getComputedStyle(document.body).fontSize) *
        4) /
        5) *
      2;
    let barGraph;
    if (bar_data) {
      let sorted_bar_data = Object.values(bar_data).sort(
        (a, b) => b[barDefaultSort] - a[barDefaultSort],
      );
      // different options for mastery chart:
      _datasets = POLL_INCLUDES_MASTERIES
        ? [
            {
              label: barMetrics[0],
              categoryPercentage: 0.8,
              barPercentage: 1,
              data: sorted_bar_data.map((x) => 100 * x[barMetrics[0]]),
              backgroundColor: "#ffb629",
              stack: "1",
            },
            {
              label: "filler",
              categoryPercentage: 0.8,
              barPercentage: 1,
              data: sorted_bar_data.map((x) => 100 - 100 * x[barMetrics[0]]),
              backgroundColor: "#0000",
              stack: "1",
            },
            {
              label: barMetrics[1],
              categoryPercentage: 0.8,
              barPercentage: 1,
              data: sorted_bar_data.map((x) => 100 * x[barMetrics[1]]),
              backgroundColor: "#63c384",
              stack: "1",
            },
            {
              label: "filler",
              categoryPercentage: 0.8,
              barPercentage: 1,
              data: sorted_bar_data.map((x) => 100 - 100 * x[barMetrics[1]]),
              backgroundColor: "#0000",
              stack: "1",
            },
            {
              label: barMetrics[2],
              categoryPercentage: 0.8,
              barPercentage: 1,
              data: sorted_bar_data.map((x) => 100 * x[barMetrics[2]]),
              backgroundColor: "#ff545a",
              stack: "1",
            },
            {
              label: "filler",
              categoryPercentage: 0.8,
              barPercentage: 1,
              data: sorted_bar_data.map((x) => 100 - 100 * x[barMetrics[2]]),
              backgroundColor: "#0000",
              stack: "1",
            },
            {
              label: barMetrics[3],
              categoryPercentage: 0.8,
              barPercentage: 1,
              data: sorted_bar_data.map((x) => 100 * x[barMetrics[3]]),
              backgroundColor: "#ff545a",
              stack: "1",
            },
            {
              label: "filler",
              categoryPercentage: 0.8,
              barPercentage: 1,
              data: sorted_bar_data.map((x) => 100 - 100 * x[barMetrics[3]]),
              backgroundColor: "#0000",
              stack: "1",
            },
            {
              label: barMetrics[4],
              categoryPercentage: 0.8,
              barPercentage: 1,
              data: sorted_bar_data.map((x) => 100 * x[barMetrics[4]]),
              backgroundColor: "#ff545a",
              stack: "1",
            },
            {
              label: "filler",
              categoryPercentage: 0.8,
              barPercentage: 1,
              data: sorted_bar_data.map((x) => 100 - 100 * x[barMetrics[4]]),
              backgroundColor: "#0000",
              stack: "1",
              hidden: true,
            },
            {
              label: barMetrics[5],
              categoryPercentage: 0.8,
              barPercentage: 1,
              data: sorted_bar_data.map((x) => 100 * x[barMetrics[5]]),
              backgroundColor: "#ff545a",
              stack: "1",
              hidden: true,
            },
          ]
        : [
            {
              label: barMetrics[0],
              categoryPercentage: 0.8,
              barPercentage: 1,
              data: sorted_bar_data.map((x) => 100 * x[barMetrics[0]]),
              backgroundColor: "#845994",
            },
            {
              label: barMetrics[1],
              categoryPercentage: 0.8,
              barPercentage: 1,
              data: sorted_bar_data.map((x) => 100 * x[barMetrics[1]]),
              backgroundColor: "green",
              hidden: true,
            },
            {
              label: barMetrics[2],
              categoryPercentage: 0.8,
              barPercentage: 1,
              data: sorted_bar_data.map((x) => 100 * x[barMetrics[2]]),
              backgroundColor: "#948d52",
            },
          ];
      function outsideBar(context) {
        return (
          context.dataset.data[context.dataIndex] * context.chart.canvas.width <
          123000 * 0.17
        );
        return context.dataset.data[context.dataIndex] < 30;
      }
      barGraph = new Chart(document.getElementById("opChart"), {
        type: "bar",
        data: {
          labels: sorted_bar_data.map((x) => x.name),
          datasets: _datasets,
        },
        plugins: POLL_INCLUDES_MASTERIES ? [ChartDataLabels] : [],
        options: {
          layout: { padding: 8 },
          scales: {
            x: {
              display: !POLL_INCLUDES_MASTERIES,
            },
            y: {
              grid: {
                color: POLL_INCLUDES_MASTERIES
                  ? "#ddd4"
                  : Chart.defaults.borderColor,
              },
            },
          },
          indexAxis: "y",
          interaction: {
            mode: "index",
          },
          maintainAspectRatio: false,
          responsive: true,
          plugins: {
            datalabels: {
              formatter: (v, ctx) => v.toFixed(2) + "%",
              display: function (context) {
                return !(context.datasetIndex % 2); // display labels with an even index
              },

              color: (ctx) => (outsideBar(ctx) ? "#dddddd" : "#000"),
              anchor: (ctx) => (outsideBar(ctx) ? "end" : "center"),
              // clamp: true,
              align: (ctx) => (outsideBar(ctx) ? "right" : "center"),
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  if (context.dataset.label == "filler") return;
                  if (
                    [OWNERSHIP_E2_NAME, OVERALL_E2_NAME].includes(
                      context.dataset.label,
                    )
                  )
                    return (
                      OWNERSHIP_E2_NAME +
                      ": " +
                      context.chart.data.datasets[
                        barMetrics.indexOf(OWNERSHIP_E2_NAME) *
                          (POLL_INCLUDES_MASTERIES ? 2 : 1)
                      ].data[context.dataIndex].toFixed(1) +
                      "% (" +
                      context.chart.data.datasets[
                        barMetrics.indexOf(OVERALL_E2_NAME) *
                          (POLL_INCLUDES_MASTERIES ? 2 : 1)
                      ].data[context.dataIndex].toFixed(1) +
                      "%)"
                    );
                  return (
                    context.dataset.label + ": " + context.raw.toFixed(1) + "%"
                  );
                },
              },
              enabled: false,
              // position: 'nearest',
              external: thumbnail_tooltip(
                document.getElementById("opChart"),
                POLL_INCLUDES_MASTERIES,
              ),
              // xAlign: 'left'
            },
            legend: {
              display: false, //!POLL_INCLUDES_MASTERIES,
            },
          },
        },
      });
    }
    let scatterPlot = new Chart(document.getElementById("scatterChart"), {
      type: "bubble",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Data",
            pointStyle: scatterImages,
            data: scatterData,
          },
        ],
      },
      options: {
        split_images: true,
        borderColor: "#999",
        onResize: (chart) => {
          chart.options.layout.padding.top = imgSize / 2;
          chart.options.layout.padding.right = imgSize / 2;
          chart.data.datasets.forEach((d) =>
            d.data.forEach((x) => (x.r = imgSize / 2)),
          );
        },
        maintainAspectRatio: true,
        responsive: true,
        layout: {
          padding: {
            top: imgSize / 2,
            right: imgSize / 2,
          },
        },
        scales: {
          x: {
            afterFit: (scale) => {
              scale.options.ticks.minor.padding = imgSize / 2;
              scale.options.ticks.major.padding = imgSize / 2;
              scale.options.ticks.padding = imgSize / 2;
            },
            title: {
              display: true,
              text: axesMetrics[0],
            },
            ticks: {
              padding: imgSize / 2,
            },
          },
          y: {
            afterFit: (scale) => {
              scale.options.ticks.minor.padding = imgSize / 2;
              scale.options.ticks.major.padding = imgSize / 2;
              scale.options.ticks.padding = imgSize / 2;
            },
            title: {
              display: true,
              text: axesMetrics[1],
            },
            ticks: {
              padding: imgSize / 2,
            },
          },
        },

        plugins: {
          tooltip: {
            displayColors: false,
            callbacks: {
              label: function (context) {
                return (
                  context.chart.data.labels[context.dataIndex] +
                  " (" +
                  context.raw.x.toFixed(2) +
                  ", " +
                  context.raw.y.toFixed(2) +
                  ")"
                );
              },
            },
          },
          legend: {
            display: false,
          },
        },
      },
    });

    function redrawCharts() {
      scatterPlot.options.scales.x.title.text = axesMetrics[0];
      scatterPlot.options.scales.y.title.text = axesMetrics[1];
      scatterData = Object.values(scatter_data).map((d) => {
        return { x: d[axesMetrics[0]], y: d[axesMetrics[1]], r: imgSize / 2 };
      });
      scatterPlot.data.datasets[0].data = scatterData;
      scatterPlot.update();
      if (bar_data) {
        barGraph.data.labels = sorted_bar_data.map((x) => x.name);

        if (POLL_INCLUDES_MASTERIES)
          for (i = 0; i < barGraph.data.datasets.length; i++) {
            if (i % 2)
              barGraph.data.datasets[i].data = sorted_bar_data.map(
                (x) => 100 - 100 * x[barMetrics[Math.floor(i / 2)]],
              );
            else
              barGraph.data.datasets[i].data = sorted_bar_data.map(
                (x) => 100 * x[barMetrics[Math.floor(i / 2)]],
              );
          }
        else
          for (i = 0; i < barGraph.data.datasets.length; i++)
            barGraph.data.datasets[i].data = sorted_bar_data.map(
              (x) => 100 * x[barMetrics[i]],
            );
        barGraph.update();
      }
    }
  });

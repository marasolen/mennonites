let history;
const tooltipPadding = 15;

const setupVisualization = () => {
    const containerWidth = document.getElementById("visualization").clientWidth;
    const containerHeight = document.getElementById("visualization").clientHeight;

    const margin = {
        top: 0.04 * containerHeight,
        right: 0.2 * containerWidth,
        bottom: 0 * containerHeight,
        left: 0 * containerWidth
    };

    const width = containerWidth - (margin.right + margin.left);
    const height = containerHeight - (margin.top + margin.bottom);

    const barWidth = 1 / 12;
    const timeWidth = height * 0.2;
    const distanceHeight = height * 0.2;

    const mainWidth = width - timeWidth;
    const mainHeight = height - distanceHeight

    const svg = d3.select("#visualization");
    const timeChartArea = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    const mainChartArea = svg.append('g')
        .attr('transform', `translate(${margin.left + timeWidth},${margin.top})`);
    const distanceChartArea = svg.append('g')
        .attr('transform', `translate(${margin.left + timeWidth},${margin.top + mainHeight})`);

    const mainXScale = d3.scaleBand()
        .domain(history.map(d => d.place))
        .range([0, mainWidth]);
    const mainYScale = d3.scaleLinear()
        .domain(history.map(d => d.place))
        .range([0, mainHeight]);

    const distanceXScale = d3.scaleLinear()
        .domain([0, d3.sum(history, d => d.distance)])
        .range([0, mainWidth]);
    const timeYScale = d3.scaleLinear()
        .domain([d3.min(history, d => d.start), d3.max(history, d => d.end)])
        .range([0, mainHeight]);

    const colourScheme = {};
    history.forEach((d, i) => colourScheme[d.place] = d3.schemeSet1[i])

    // Main leavings visualization
    // TODO

    // Time passed line
    timeChartArea.selectAll(".time-marker")
        .data(history)
        .join("rect")
        .attr("class", "time-marker")
        .attr("x", (0.5 - barWidth / 2) * timeWidth)
        .attr("y", d => timeYScale(d.start))
        .attr("width", barWidth * timeWidth)
        .attr("height", d => timeYScale(d.end) - timeYScale(d.start))
        .attr("fill", d => colourScheme[d.place]);

    timeChartArea.selectAll(".time-text")
        .data([history[0].start, ...history.map(d => d.end)])
        .join("text")
        .attr("class", "time-text")
        .attr("x", (_, i) => (0.5 + (i % 2 === 0 ? -1.5 : 1.5) * barWidth) * timeWidth)
        .attr("y", d => timeYScale(d))
        .attr("text-anchor", (_, i) => i % 2 === 0 ? "end" : "start")
        .attr("dominant-baseline", "middle")
        .attr("text-multiplier", 0.6)
        .text(d => d);

    // Distance travelled line
    distanceChartArea.selectAll(".distance-marker")
        .data(history)
        .join("rect")
        .attr("class", "distance-marker")
        .attr("x", d => distanceXScale(d.cumulativeDistance) - distanceXScale(d.distance))
        .attr("y", (0.5 - barWidth / 2) * distanceHeight)
        .attr("width", d => distanceXScale(d.distance))
        .attr("height", barWidth * distanceHeight)
        .attr("fill", d => colourScheme[d.place]);

    distanceChartArea.selectAll(".distance-text")
        .data([null])
        .join("text")
        .attr("class", "distance-text")
        .attr("x", mainWidth / 2)
        .attr("y", (0.5 + 2 * barWidth) * distanceHeight)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "text-top")
        .attr("text-multiplier", 0.6)
        .text("distance travelled to new place");
};

const renderVisualization = () => {
    setupVisualization();
};

const resizeAndRender = () => {
    d3.selectAll("svg > *").remove();

    d3.selectAll("#visualization")
        .attr("height", "80vh")
        .attr("width", "100%");

    renderVisualization();

    d3.selectAll("text")
        .attr("font-size", function() { return d3.select(this).attr("text-multiplier") * 0.03 * document.getElementById("visualization").clientHeight });
};

window.onresize = resizeAndRender;

Promise.all([d3.json('data/history.json')]).then(([_history]) => {
    history = _history;
    let cumulativeDistance = 0;
    history.forEach(d => {
        cumulativeDistance += d.distance;
        d.cumulativeDistance = cumulativeDistance;
    });

    resizeAndRender();
});
let history;
const tooltipPadding = 15;

const setupVisualization = () => {
    const containerWidth = document.getElementById("visualization").clientWidth;
    const containerHeight = document.getElementById("visualization").clientHeight;

    const margin = {
        top: 0.04 * containerHeight,
        right: 0.1 * containerWidth,
        bottom: 0 * containerHeight,
        left: 0.1 * containerWidth
    };

    const width = containerWidth - (margin.right + margin.left);
    const height = containerHeight - (margin.top + margin.bottom);

    const barWidth = 1 / 6;
    const distanceHeight = height * 0.2;

    const mainWidth = width;
    const mainHeight = height - distanceHeight

    const svg = d3.select("#visualization");
    const mainChartArea = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    const distanceChartArea = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top + mainHeight})`);

    const mainXScale = d3.scaleBand()
        .domain(history.map(d => d.place))
        .range([0, mainWidth]);
    const mainYScale = d3.scaleBand()
        .domain(history.map(d => d.place))
        .range([0, mainHeight]);

    const distanceXScale = d3.scaleLinear()
        .domain([0, d3.sum(history, d => d.distance)])
        .range([0, mainWidth]);
    const timeYScale = d3.scaleLinear()
        .domain([0, d3.max(history, d => d.end) - d3.min(history, d => d.start)])
        .range([0, 2 * mainHeight / 3]);

    let cumulativeY = 0;
    history.forEach(d => {
        d.startY = cumulativeY;
        cumulativeY += timeYScale(d.end - d.start);
        d.endY = cumulativeY;
        cumulativeY += (mainHeight / 3) / 8;
    });

    const colourScheme = {};
    history.forEach((d, i) => colourScheme[d.place] = d3.schemeSet2[i % 8]);

    // Main leavings visualization
    const leavingLines = [];
    let lastPlace = "";
    history.forEach((d, i) => {
        const path = d3.path();
        path.moveTo(mainXScale(d.place) + mainXScale.bandwidth() / 2, d.startY);
        path.lineTo(mainXScale(d.place) + mainXScale.bandwidth() / 2, d.endY);
        path.closePath();

        leavingLines.push({
            colour: colourScheme[d.place],
            width: 8,
            d: path
        })

        if (i > 0) {
            const middle = (lastPlace.endY + d.startY) / 2;
            const connector = d3.path();
            connector.moveTo(mainXScale(lastPlace.place) + mainXScale.bandwidth() / 2, lastPlace.endY);
            connector.quadraticCurveTo(mainXScale(lastPlace.place) + mainXScale.bandwidth() / 2, middle, mainXScale(d.place), middle);
            connector.quadraticCurveTo(mainXScale(d.place) + mainXScale.bandwidth() / 2, middle, mainXScale(d.place) + mainXScale.bandwidth() / 2, d.startY);

            leavingLines.push({
                colour: "black",
                width: 0.5,
                d: connector,
                type: d.reason === "personal" ? ("3") : (d.reason === "religion" ? ("11") : "none")
            });
        }

        lastPlace = d;
    });

    mainChartArea.selectAll(".leaving-line")
        .data(leavingLines)
        .join("path")
        .attr("class", "leaving-line")
        .attr("stroke", d => d.colour)
        .attr("stroke-width", d => d.width * 0.01 * mainHeight)
        .attr("stroke-dasharray", d => d.colour === "black" ? d.type : "none")
        .attr("fill", "none")
        .attr("d", d => d.d);

    mainChartArea.selectAll(".leaving-text")
        .data(history)
        .join("text")
        .attr("class", "leaving-text")
        .attr("text-multiplier", 0.4)
        .attr("transform", (d, i) => `translate(${mainXScale(d.place) + mainXScale.bandwidth() / 2}, ${i < history.length / 2 ? d.endY + (mainHeight / 3) / 16 : d.startY - (mainHeight / 3) / 16})rotate(90)`)
        .attr("dominant-baseline", "middle")
        .attr("text-anchor", (_, i) => i < history.length / 2 ? "start" : "end")
        .text(d => d.place);

    mainChartArea.selectAll(".leaving-year")
        .data(history)
        .join("text")
        .attr("class", "leaving-year")
        .attr("text-multiplier", 0.4)
        .attr("transform", (d, i) => `translate(${mainXScale(d.place) + mainXScale.bandwidth() / 2 + 6 * 0.01 * mainHeight}, ${d.startY + mainHeight / 100})`)
        .attr("dominant-baseline", "middle")
        .attr("text-anchor", "start")
        .text(d => d.start + (d.uncertain ? " (ish)" : ""));

    const legend = [
        { type: "none", description: "Better Opportunities" },
        { type: ("11"), description: "Religious Persecution" },
        { type: ("3"), description: "Personal Reasons" },
    ];

    mainChartArea.selectAll(".legend-line")
        .data(legend)
        .join("path")
        .attr("class", "legend-line")
        .attr("stroke", "black")
        .attr("stroke-width", 0.5 * 0.01 * height)
        .attr("stroke-dasharray", d => d.type)
        .attr("fill", "none")
        .attr("d", (_, i) => {
            const path = d3.path();
            path.moveTo(mainWidth, (i + 6) * mainHeight / 30);
            path.lineTo(17 * mainWidth / 20, (i + 6) * mainHeight / 30);
            return path;
        });

    mainChartArea.selectAll(".legend-text")
        .data(legend)
        .join("text")
        .attr("class", "legend-text")
        .attr("text-multiplier", 0.5)
        .attr("transform", (_, i) => `translate(${16 * mainWidth / 20}, ${(i + 6) * mainHeight / 30})`)
        .attr("dominant-baseline", "middle")
        .attr("text-anchor", "end")
        .text(d => d.description);

    mainChartArea.selectAll(".title")
        .data([null])
        .join("text")
        .attr("class", "title")
        .attr("text-multiplier", 1.5)
        .attr("transform", `translate(${mainWidth}, ${mainHeight / 30})`)
        .attr("dominant-baseline", "middle")
        .attr("text-anchor", "end")
        .text("Leavings");

    mainChartArea.selectAll(".subtitle")
        .data([null])
        .join("text")
        .attr("class", "subtitle")
        .attr("text-multiplier", 1)
        .attr("transform", `translate(${mainWidth}, ${2.5 * mainHeight / 30})`)
        .attr("dominant-baseline", "middle")
        .attr("text-anchor", "end")
        .text("When, Where, and How Far");

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
//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

     //variables for data join -- now pseudo global
     var attrArray = ["avgPrem2022", "nonRenewRate", 
        "nonPayRate", "claimSeverity", "claimFrequency", "lossRatio"];

    var expressed = attrArray[0]; //initial attribute

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){

    //map frame dimensions
    var width = window.innerWidth * 0.5,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on Iowa
    var projection = d3.geoAlbers()
        .center([8.25, 41.5])
        .rotate([102, 0, 0])
        .parallels([29.5, 45.5])
        .scale(10000)
        .translate([width / 2, height / 2]);

    //create path generator  
    var path = d3.geoPath()
        .projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.csv("data/desMoinesPremiums.csv")); // load the attribute data
    promises.push(d3.json("data/desMoinesZIPs.topojson")); // load the Iowa zip code data                                         
    Promise.all(promises).then(callback);

    function callback(data) {
        var csvData = data[0],
            zips = data[1];
            console.log(zips);
            console.log(csvData);
    
        //convert topojson to geojson
        var iowaZips = topojson.feature(zips, zips.objects.desMoinesZIPs).features;
        
        //join csv data to geojson enumeration units
        iowaZips = joinData(iowaZips, csvData);

        //create the color scale
        var colorScale = makeColorScale(csvData);

        // add enumeration units to the map
        setEnumerationUnits(iowaZips, map, path, colorScale); 

        //add coordinated visualization to the map
        setChart(csvData, colorScale);

        //create dropdown menu for attribute selection
        createDropdown(csvData);

    }
};

 //function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043"
    ];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build two-value array of minimum and maximum expressed attribute values
    var minmax = [
        d3.min(data, function(d) { return parseFloat(d[expressed]); }),
        d3.max(data, function(d) { return parseFloat(d[expressed]); })
    ];
    //assign two-value array as scale domain
    colorScale.domain(minmax);

    console.log(colorScale.quantiles());

    return colorScale;

};

//function to join csv data to geojson enumeration units
function joinData(iowaZips, csvData){
    //...DATA JOIN LOOPS FROM EXAMPLE 1.1
            //loop through csv to assign each set of csv attribute values to geojson region
        for (var i=0; i<csvData.length; i++){
            var csvZip = csvData[i]; //the current region
            var csvKey = csvZip.GEOID20; //the CSV primary key

            //loop through geojson regions to find correct region
            for (var a=0; a<iowaZips.length; a++){

                var geojsonProps = iowaZips[a].properties; //the current region geojson properties
                var geojsonKey = geojsonProps.GEOID20; //the geojson primary key

                //where primary keys match, transfer csv data to geojson properties object
                if (geojsonKey == csvKey){

                    //assign all attributes and values
                    attrArray.forEach(function(attr){
                        var val = parseFloat(csvZip[attr]); //get csv attribute value
                        geojsonProps[attr] = val; //assign attribute and value to geojson properties
                    });
                };
            };
        };

    return iowaZips;
};

//function to set enumeration units on the map and shade them
function setEnumerationUnits(iowaZips, map, path, colorScale){
    // add the Iowa zip codes to the map
    var zipCodes = map.selectAll(".zips")
    .data(iowaZips).enter()
    .append("path")
    .attr("class", function(d){
        return "zipCodes " + d.properties.GEOID20;
    })
    .attr("d", path)
    .style("fill", function(d){
        return colorScale(d.properties[expressed]);
    })
    .on("mouseover", function(event, d){
        highlight(d.properties);
    })
    .on("mouseout", function(event, d){
        dehighlight(d.properties);
    })
    .on("mousemove", moveLabel);

    // add style descriptor to each path
    var desc = zipCodes.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');
};

//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 35,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, 2500]);

    //set bars for each ZIP Code
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.GEOID20;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return colorScale(d[expressed]);
        })
        .on("mouseover", function(event, d){
            highlight(d);
        })
        .on("mouseout", function(event, d){
            dehighlight(d.properties);
        })
        .on("mousemove", moveLabel);

    //add style descriptor to each rect
    var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Cost of Homeowners Insurance in Des Moines, IA (2022)");

    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
};

//function to create a dropdown menu for attribute selection
function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};

//dropdown change event handler
function changeAttribute(attribute, csvData) {
    // Change the expressed attribute based on dropdown selection
    expressed = attribute;
    console.log("New attribute: " + expressed);

    // Recreate the color scale based on the new attribute values
    var colorScale = makeColorScale(csvData);


    // Change colors of ZIP codes
    var zipCodes = d3.selectAll(".zipCodes").style("fill", function (d) {
        var value = d.properties[expressed];
        return value ? colorScale(value) : "#ccc";
    });

    // 1. Update the chart title with the new attribute
    d3.select(".chartTitle")
        .text(expressed + " in Des Moines, IA (2022)");

    // 2. Create a new y-scale for the bar chart based on the new attribute's value range.
    var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, d3.max(csvData, function(d) { 
            return parseFloat(d[expressed]); 
        })]);

    // 3. Update the y-axis with the new scale and add a smooth transition.
    var yAxis = d3.axisLeft().scale(yScale);
    d3.select(".axis")
        .transition()
        .duration(500)
        .call(yAxis);

    // 4. Updated code: recalc x positions based on the new sorted order.
    var chartWidth = window.innerWidth * 0.425,
        leftPadding = 35,
        rightPadding = 2,
        chartInnerWidth = chartWidth - leftPadding - rightPadding;

    // Now select and update all bars
    d3.selectAll(".bar")
        .sort(function(a, b) {
            return b[expressed] - a[expressed];
        })
        .transition()
        .duration(500)
        .attr("x", function(d, i) {
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d) {
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d) {
            return yScale(parseFloat(d[expressed])) + 5;
        })
        .style("fill", function(d) {
            return colorScale(d[expressed]);
        });
}

//function to highlight enumeration units and bars
function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.GEOID20)
        .style("stroke", "blue")
        .style("stroke-width", "2");
    
    // add the label
    setLabel(props);
};

//function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.GEOID20)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };

    //remove info label
    d3.select(".infolabel")
        .remove();
};

//function to create dynamic label
function setLabel(props){
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.GEOID20 + "_label")
        .html(labelAttribute);

    var zipCode = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.name);
};

//function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = event.clientX + 10,
        y1 = event.clientY - 75,
        x2 = event.clientX - labelWidth - 10,
        y2 = event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};

})(); //last line of main.js
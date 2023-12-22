// JS by Kevin Crowe, 2023
// Unit 3 -- D3


(function(){

//pseudo-global variables
  var attrArray = ["med_rent", "moe", "cty_med_rent", "pct_med_rent", "month_filings", 
  "month_rate", "pct_white", "pct_black", "pct_latinx"]; //list of attributes
    var expressed = attrArray[5]; //initial attribute


//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){

    //map frame dimensions
    var width = window.innerWidth * 0.5,
    height = 460;

    //create a new svg container for the map
    var map = d3.select("body")
    .append("svg")
    .attr("class", "map")
    .attr("width", width)
    .attr("height", height);

    //Create an Albers equal area conic projection over Milwaukee County 
    var projection =  d3.geoAlbers()
    .scale(75000)
    .rotate([87.9,0])
            .center( [0, 43.0] )//longitude
            .translate( [width/2,height/2] );

            var path = d3.geoPath()
            .projection(projection);


    //use Promise.all to parallelize asynchronous data loading
            var promises = [];    
    promises.push(d3.csv("data/mke_evict.csv")); //load attributes from csv    
    promises.push(d3.json("data/mke_tracts.topojson")); //load the tracts      
    promises.push(d3.json("data/metro_counties.topojson")); //load the background data -- counties in the metro area 
    Promise.all(promises).then(callback);

    function callback(data) {
        var evictData = data[0],
        mkeTracts = data[1],
        mkeCounties = data[2];

        //create the features variable
        var countyBounds = topojson.feature(mkeCounties, mkeCounties.objects.metro_counties),
        countyTracts = topojson.feature(mkeTracts, mkeTracts.objects.mke_tracts).features;    

        //add the metro counties to the map
        var counties = map.append("path")
        .datum(countyBounds)
        .attr("class", "counties")
        .attr("d", path);

        // joinData function goes here...
        countyTracts = joinData(countyTracts, evictData);

        //create the color scale
        var colorScale = makeColorScale(evictData);

        //add enumeration units
        setEnumerationUnits(countyTracts, map, path, colorScale);

        //add the chart function
        setChart(evictData, colorScale);
    };
}; //end of setMap()


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

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign two-value array as scale domain
    colorScale.domain(domainArray);

    return colorScale;
};



function joinData(countyTracts, evictData){

       //loop through the csv to assign each set of csv attribute values to geojson region
    for (var i=0; i<evictData.length; i++){

            var csvTract = evictData[i]; //the current Census Tract
            var csvKey = csvTract.geoid; //geoid is a unique identifier for each tract

            //loop through the geojson to find correct tract
            for (var a=0; a<countyTracts.length; a++){

                var geojsonProps = countyTracts[a].properties; //the current region geojson properties

                var geojsonKey = geojsonProps.geoid; //the geojson key to join with the CSV data

                //where primary keys match, transfer the CSV data to geojson properties object
                if(geojsonKey == csvKey){

                    //assign all attributes and values
                    attrArray.forEach(function(attr){
                        var val = parseFloat(csvTract[attr]); //get the csv attribute value
                        geojsonProps[attr] = val; //assign attribute and value to geojson properties
                    });
                    
                    //console.log(geojsonProps);
                };


            };

        };

        return(countyTracts);

    };

//Function to set the enumeration units of the county tracts
    function setEnumerationUnits(countyTracts, map, path, colorScale){
        //add MKE tracts to the map
        var tracts = map.selectAll(".tracts")
        .data(countyTracts)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "tract: " + d.properties.tract_name;
        })
        .attr("d", path)
        .style("fill", function(d){
            return colorScale(d.properties[expressed]);
        });

    };

//function to create coordinated bar chart
function setChart(evictData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")"

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

    //create a scale to size bars proportionally to frame
    var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, 100]);

    //set bars for each tract
    var bars = chart.selectAll(".bars")
        .data(evictData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed] - a[expressed]
        })
        .attr("class", function(d){
            return "bars " + d.geoid;
        })
        .attr("width", chartInnerWidth / evictData.length - 1)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / evictData.length) + leftPadding;
        })
        .attr("height", function(d){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return colorScale(d[expressed]);
        });

    // add chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Eviction Filing Rate by Census Tract" );

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



})(); //last line of main.js
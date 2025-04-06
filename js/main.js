//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

     //variables for data join -- now pseudo global
     var attrArray = ["avgPrem2018", "avgPrem2022", "premChange", "premPctChange", "nonRenewRate", 
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
        .center([8.5, 42.3])
        .rotate([102, 0, 0])
        .parallels([29.5, 45.5])
        .scale(5000)
        .translate([width / 2, height / 2]);

    //create path generator  
    var path = d3.geoPath()
        .projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.csv("data/iowaPremiums.csv")); // load the attribute data
    promises.push(d3.json("data/IowaZips.topojson")); // load the Iowa zip code data                                         
    Promise.all(promises).then(callback);

    function callback(data) {
        var csvData = data[0],
            zips = data[1];
            console.log(zips);
            console.log(csvData);
    
        //convert topojson to geojson
        var iowaZips = topojson.feature(zips, zips.objects.iowa_ZIPs).features;
        
        //join csv data to geojson enumeration units
        iowaZips = joinData(iowaZips, csvData);

        //create the color scale
        var colorScale = makeColorScale(csvData);

        // add enumeration units to the map
        setEnumerationUnits(iowaZips, map, path, colorScale); 

        //add coordinated visualization to the map
        setChart(csvData, colorScale);

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
    });
};

//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 460;

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");
};

})(); //last line of main.js
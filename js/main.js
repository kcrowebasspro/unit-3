//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){

    //map frame dimensions
    var width = 960,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on Iowa
    var projection = d3.geoAlbers()
        .center([8, 42.3])
        .rotate([101, 0, 0])
        .parallels([29.5, 45.5])
        .scale(6500)
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
       
        // add the Iowa zip codes to the map
        var zipCodes = map.selectAll(".zips")
            .data(iowaZips).enter()
            .append("path")
            .attr("class", function(d){
                return "zipCodes " + d.properties.GEOID20;
            })
            .attr("d", path);

    }
};
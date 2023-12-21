// JS by Kevin Crowe, 2023
// Unit 3 -- D3

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){

    //map frame dimensions
    var width = 960,
        height = 740;

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

            console.log(evictData);

        //create the features variable
        var countyBounds = topojson.feature(mkeCounties, mkeCounties.objects.metro_counties),
        countyTracts = topojson.feature(mkeTracts, mkeTracts.objects.mke_tracts).features;    

        //variables for data join
        var attrArray = ["med_rent", "moe", "cty_med_rent", "pct_med_rent", "month_filings", "month_rate", "pct_white", "pct_black", "pct_latinx"];

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
                    console.log(geojsonProps);

                };

            };


        };

        /*
        //create a graticule generator
        var graticule = d3.geoGraticule()
            .step([0.25, 0.25]); 

        //create graticule background
        var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule

        //draw the graticule lines
        var gratLines = map.selectAll(".gratLines") //select all the lines that we'll create
            .data(graticule.lines()) //bind the graticule lines to each element to be created
            .enter() // element for each datum
            .append("path") //append each element to the svg
            .attr("class", "gratLines") //assign a class for styling
            .attr("d", path); //project the lines
        */

        //add the metro counties to the map
        var counties = map.append("path")
            .datum(countyBounds)
            .attr("class", "counties")
            .attr("d", path);

        //add MKE tracts to the map
        var tracts = map.selectAll(".tracts")
            .data(countyTracts)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "tract: " + d.properties.tract_name;
            })
            .attr("d", path);



    }
};
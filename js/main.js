// JS by Kevin Crowe, 2023
// Unit 3 -- D3

//execute script when window is loaded
window.onload = function(){

    var container = d3.select("body") //get the <body> element from the DOM
    	.append("svg") //put a new svg in the body
    	.attr("width", 900) //assign the width
        .attr("height", 500) //assign the height
        .attr("class", "container") //always assign a class (as the block name) for styling and future selection
        .style("background-color", "rgba(0,0,0,0.2)"); //only put a semicolon at the end of the block!
        

    var innerRect = container.append("rect") //innerRect block
    	.datum(400) //single value is the datum
    	.attr("width", function(d){ //rectangle width
    		return d * 2;

    	})
    	.attr("height", function(d){ //rectangle height
    		return d;
    	})
    	.attr("class", "innerRect") //class name
    	.attr("x", 50) //position from left on the x axis
    	.attr("y", 50) //position from the top on the y axis
    	.style("fill", "#FFFFFF"); //fill color
        
        //below Example 1.9
    var dataArray = [10, 20, 30, 40, 50];

    var cityPop = [
        { 
            city: 'Madison',
            population: 233209
        },
        {
            city: 'Milwaukee',
            population: 594833
        },
        {
            city: 'Green Bay',
            population: 104057
        },
        {
            city: 'Superior',
            population: 27244
        }
    ];


    var circles = container.selectAll(".circles") //but wait--there are no circles yet!
        .data(cityPop) //here we feed in an array
        .enter() //one of the great mysteries of the universe
        .append("circle") //add a circle for each datum
        .attr("class", "circles") //apply a class name to all circles
        .attr("id", function(d){
        	return d.city;
        })
        .attr("r", function(d){ //circle radius
            //calculate it based on the city population
            var area = d.population * 0.01;
            return Math.sqrt(area/Math.PI);
        })
        .attr("cx", function(d, i){ //x coordinate
            return 90 + (i * 180);
        })
        .attr("cy", function(d){ //y coordinate
        	//subtract value from 450 to "grow" circles up from the bottom instead of down from the top
            return 450 - (d.population * 0.0005);
        });

};
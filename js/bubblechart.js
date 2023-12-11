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

    //creating a linear scale
    var x = d3.scaleLinear() //create the scale
        .range([90, 750]) //output min and max
        .domain([0, 3]); //input min and max

    console.log(x);

    //find the minimum value of the array
    var minPop = d3.min(cityPop, function(d){
        return d.population;
    });

    //find the maximum value of the array
    var maxPop = d3.max(cityPop, function(d){
        return d.population;
    });

    //scale for circles center y coordinate
    var y = d3.scaleLinear()
        .range([450, 50])
        .domain([
            0,
            700000
        ]);

    //color scale generator 
    var color = d3.scaleLinear()
        .range([
            "#FDBE85",
            "#D94701"
        ])
        .domain([
            minPop, 
            maxPop
        ]);


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
            return x(i); //use the scale generator with index to place each circle horizontally
        })
        .attr("cy", function(d){ //y coordinate
        	//subtract value from 450 to "grow" circles up from the bottom instead of down from the top
            return y(d.population);
        })
        .style("fill", function(d, i){ //add fill baed on the color scale generator
        	return color(d.population);
        })
        .style("stroke", "#000");//

    //create the y axis generator
    var yAxis = d3.axisLeft(y);

    //create axis g element and add axis
    var axis = container.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(50, 0)")
        .call(yAxis);

    //create a title for the plot
    var title = container.append("text")
        .attr("class", "title")
        .attr("text-anchor", "middle")
        .attr("x", 450)
        .attr("y", 30)
        .text("City Populations");

    //Create labels for the bubbles
    var labels = container.selectAll(".labels")
    	.data(cityPop)
    	.enter()
    	.append("text")
    	.attr("class", labels)
    	.attr("text-anchor", "left")
    	.attr("x", function(d,i){
    		//horizontal position to the right of each circle
    		return x(i) + Math.sqrt(d.population * 0.01/Math.PI) + 5;
    	})
    	.attr("y", function(d){
    		//vertical position centered on each circle
    		return y(d.population);
    	});

    //first line of label
   	var nameLine = labels.append("tspan")
   		.attr("class", "nameLine")
   		.attr("x", function(d,i){
   			//horizontal position to the right of each circle
   			return x(i) + Math.sqrt(d.population * 0.01/Math.PI) + 5;
   		})
   		.text(function(d){
   			return d.city;
   		});

	//create format generator
    var format = d3.format(",");

   	//Second line of label
   	var popLine = labels.append("tspan")
   		.attr("class", "popLine")
   		.attr("x", function(d,i){
   			//horizontal position to the right of each circle
   			return x(i) + Math.sqrt(d.population * 0.01/Math.PI) + 5;
   		})
   	.attr("dy", "15") //vertical offset for the second line of the label
   	.text(function(d){
   		return "Pop. " + format(d.population);
   	});


};
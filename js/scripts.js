var width = 300, height= 280, margin={left:10, right:10, top: 5, bottom: 5}
var projection = d3.geoMercator();
var bjp_strong = [75], congress_strong = [138, 132, 130, 139]
var anti_incumbency = [15, 37, 38, 97, 109, 122, 145]
var in_2017_anti = [67,91, 90, 15, 32, 140, 122]
var path = d3.geoPath()
.projection(projection)
.pointRadius(2);

d3.queue()
.defer(d3.csv, "data/all_data.csv")
.defer(d3.json, "data/gujarat_geo_all.json")
.await(ready);

function ready(error, data, geo){

// drawSubUnits(geo);

var start_year = 1976
var end_year = 2008

var byYear = d3.nest()
    .key(function(d){
        return d.Year
    })
    .entries(_.filter(data,function(d){
        return (d.Year>=start_year) && (+d.Position==1)
    }))
var buckets = [1,5,10,20,50]
var buckets_bracket = [
{
    start: 0,
    end:1,
    value: 0.1
},
{
    start: 1,
    end:5,
    value: 0.3
},
{
    start: 5,
    end:10,
    value: 0.5
},
{
    start: 10,
    end:20,
    value: 0.7
},
{
    start: 20,
    end:50,
    value: 0.9
},
{
    start: 50,
    end:100,
    value: 1
}
]
var years = d3.select('#map-choropleth .viz')
                .selectAll('.year')
                .data(byYear)
                .enter()
                .append('div')
                .attr('class','year')

var year_text = years.append('p')
                    .attr('class','year-name')
                    .text(function(d){
                        return d.key
                    })

var g = years.append('svg')
    .attr('height',height)
    .attr('width',width)
    .append('g')
    .attr('class',function(d){
        return 'y-'+d.key
    })

var boundary = centerZoom(geo,'gujarat_2008');
// geo.objects.places.type != null ? drawPlaces(geo) : null;
drawOuterBoundary(boundary);
function drawSubUnits(unit){
    
    if (unit.key<=end_year){
        layer='gujarat_2002'
    } else {
        layer='gujarat_2008'
    }

    d3.select('.y-'+unit.key)
        .selectAll(".subunit")
        .data(topojson.feature(geo, geo.objects[layer]).features)
        .enter().append("path")
        .attr("class", function(d){ return "subunit" })
        .attr("d", path)
        .attr('fill', function(d){
            return getColor(d.properties.ac_no, unit.key)
        })
        .style('opacity',function(d){
            var e = _.findWhere(data, {'Constituency_No':d.properties.ac_no.toString(),'Year':unit.key})
            if (e){
                var diff = (e.Margin_Percentage)
                return diff*2.5/100
              }
        });
} // end drawSubunits();


d3.selectAll('.year').each(function(d){
    drawSubUnits(d)
})

function getColor(ac, year){
    var colors = {
        'BJP':'orange',
        'INC':'steelblue',
        'INC(I)':'steelblue'
    }
    if (ac==0){
        return 'none'
    }else {
        var obj = _.findWhere(data, {'Constituency_No':ac.toString(),'Year':year.toString()})
        
        if ((obj.Party=='BJP' || obj.Party=='INC'|| obj.Party=='INC(I)') ){
            return colors[obj.Party]
        } else{
            return '#ccc'
        }
    }
}


// This function "centers" and "zooms" a map by setting its projection's scale and translate according to its outer boundary
// It also returns the boundary itself in case you want to draw it to the map
  function centerZoom(data, selected){

    var o = topojson.mesh(data, data.objects[selected], function(a, b) { return a === b; });

    projection
        .scale(1)
        .translate([0, 0]);

    var b = path.bounds(o),
        s = 1 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
        t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

    projection
        .scale(s)
        .translate(t);

    return o;
  }

  function drawOuterBoundary(boundary){
    g.append("path")
        .datum(boundary)
        .attr("d", path)
        .attr("class", "subunit-boundary");
  }

}


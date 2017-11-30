 var w=window,
dw=document,
ew=dw.documentElement,
gw=dw.getElementsByTagName('body')[0]

var window_width = w.innerWidth||ew.clientWidth||gw.clientWidth

var width = (window_width<600)?window_width*0.95:600, height= width*0.85, margin={left:10, right:10, top: 5, bottom: 5}
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
var colors = ['#f2f0f7','#dadaeb','#bcbddc','#9e9ac8','#756bb1','#54278f']

var years = d3.select('#map-choropleth .viz')
                .selectAll('.year')
                .data(_.where(byYear,{'key':'1980'}))
                .enter()
                .append('div')
                .attr('class','year')

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
            if (d.properties.ac_no!=0){
                var obj = _.filter(data, function(e){
                    return (+e['Constituency_No'] == +d.properties.ac_no) && (+e['Year'] == +unit.key) && e.Position=='1'
                })

                return getColor(obj[0].Margin_Percentage)
            } else {
                return '#fff'
            }
        })

} // end drawSubunits();


d3.selectAll('.year').each(function(d){
    drawSubUnits(d)
})

function getColor(value){

    if (value<=1){
        return colors[0]
    } else if (value<=10){
        return colors[1]
    } else if (value<=20){
        return colors[2]
    } else if (value<=30){
        return colors[3]
    } else if (value<=40){
        return colors[4]
    } else if (value<=100){
        return colors[5]
    } else {
       return colors[0]
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


d3.select('.year-button.end-year')
    .on('click',function(d){

    })

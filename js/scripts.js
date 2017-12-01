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
var buckets = [0,'1',10, 20, 30, 40, '100%']

var path = d3.geoPath()
        .projection(projection)
        .pointRadius(2);

d3.queue()
.defer(d3.csv, "data/all_data.csv")
.defer(d3.json, "data/gujarat_geo_all.json")
.await(ready);

var start_year = 1976
var end_year = 2008
console.log(end_year)
function ready(error, data, geo){

        var party_colors = {
                    'BJP':'orange',
                    'INC':'steelblue',
                    'INC(I)':'steelblue'
                }

        var party_name = {
                    'BJP':'BJP',
                    'INC':'Congress',
                    'INC(I)':'Congress (Indira)',
                    'IND':'Independent',
                    'JD':'Janata Dal',
                    'JNP':'Janata Party'
                }



        var byYear = d3.nest()
            .key(function(d){
                return d.Year
            })
            .entries(_.filter(data,function(d){
                return (d.Year>=start_year) && (+d.Position==1)
            }))

        var colors = ['#f2f0f7','#dadaeb','#bcbddc','#9e9ac8','#756bb1','#54278f']

        var years = d3.select('#map-choropleth .viz')
                        .style('height',height+'px')
                        .style('width',width+'px')
                        .selectAll('.year')
                        .data(_.filter(byYear,function(d){
                            return d.key == '2012' || d.key == '1980'
                        }))
                        .enter()
                        .append('div')
                        .attr('class',function(d){
                            return 'map-svg year ysvg-'+d.key
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

        d3.select('.legend')
            .append('p')
            .text('Winning margin percentage')

        d3.select('.legend')
            .append('div')
            .attr('class','legend-box-container')
            .selectAll('.legend-boxes')
            .data(colors)
            .enter()
            .append('div')
            .attr('class','legend-boxes')
            .style('background-color',function(d){
                return d
            })

        d3.select('.legend')
            .append('div')
            .attr('class','legend-label-container')
            .selectAll('.legend-labels')
            .data(buckets)
            .enter()
            .append('p')
            .attr('class','legend-labels')
            .text(function(d){
                return d
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

        d3.select('.ysvg-2012')
            .style('opacity',0)

        d3.select('.viz h2')
            .style('display','none')
        setTimeout(function() {
          //your code to be executed after 1 second
          switchTo2012()
        }, 1500);

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

          // histogram code 
          var hist_data = _.chain(data).filter(function(d){
                return (+d.Year > start_year) && +d.Position==1 && d.Margin_Percentage!="NA"
            }).sortBy('Margin_Percentage').sortBy('Party').sortBy('Year').value()

          var years_list = _.chain(hist_data).pluck('Year').uniq().value()
          var mobile_years_list = ['1985','1995','2012']  
          var mainwidth = (window_width<600)?window_width:400,
              years_list = (window_width<600)?mobile_years_list:years_list

         //SVG setup
            const hist_margin = {top: 0, right: 25, bottom: 15, left: 25},
                  hist_width =  mainwidth - hist_margin.left - hist_margin.right
                  hist_height = (mainwidth>400?150:145) - hist_margin.top - hist_margin.bottom;

        //x scales
            const x = d3.scaleLinear()
                .rangeRound([0,hist_width])
                .domain([0,100]);
            const nbins = ((mainwidth>=300)?50:35);

        //set up svg
        var years_hist =  d3.select("#histogram")
                        .selectAll('.hist-year')
                        .data(years_list)
                        .enter()
                        .append('div')
                        .attr('class',function(d){
                            return 'hist-year '+ 'hist-'+d
                        })

        years_hist.append('p')
            .text(function(d){
                return d
            })

        const svg_hist = years_hist.append("svg")
                .attr("width", hist_width + hist_margin.left + hist_margin.right)
                .attr("height", hist_height + hist_margin.top + hist_margin.bottom)
                .append("g")
                .attr("transform",
                        `translate(${hist_margin.left}, ${hist_margin.top})`);

            svg_hist.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(0," + (hist_height+2) + ")")
                .call(d3.axisBottom(x).ticks(5).tickSize(-hist_height));

            svg_hist.append("g")
                .attr("class", "median")
                .append('line')
                .attr('x1',function(){
                        var yr = (d3.select(this.parentNode).datum())
                        var select = _.chain(hist_data).filter(function(d){return d['Year']==yr && +d['Margin_Percentage']}).sortBy('Margin_Percentage').value()
                        var median = d3.median(select,function(d){
                            return d.Margin_Percentage
                        })
                        return x(median)
                    })
                 .attr('x2',function(){
                        var yr = (d3.select(this.parentNode).datum())
                        var select = _.chain(hist_data).filter(function(d){return d['Year']==yr && +d['Margin_Percentage']}).sortBy('Margin_Percentage').value()
                        var median = d3.median(select,function(d){
                            return d.Margin_Percentage
                        })
                        return x(median)
                    })
                  .attr('y1',0)
                  .attr('y2',hist_height+2)
                  .style('stroke','#3BC78A')

            //histogram binning
            const histogram = d3.histogram()
              .domain(x.domain())
              .thresholds(x.ticks(nbins))
              .value(function(d) { 
                    if (d.Margin_Percentage!='NA'){
                        return d.Margin_Percentage
                    } else{
                        return 0
                    }
                } 
            )
            
            //binning hist_data and filtering out empty bins
            const bins = histogram(hist_data).filter(d => d.length>0)
            //g container for each bin
            
            let binContainer = svg_hist.selectAll(".gBin")
              .data(
                    function(){
                        var yr = (d3.select(this.parentNode).datum())
                        var select = _.where(hist_data,{'Year':yr})
                        return histogram(select).filter(d => d.length>0)
                    }
                    
                );

            binContainer.exit().remove()

            let binContainerEnter = binContainer.enter()
                .append("g")
                .attr("class", "gBin")
                .attr("transform", d => `translate(${x(d.x0)}, ${hist_height})`)

            //need to populate the bin containers with data the first time
            binContainerEnter.selectAll("rect")
                .data(d => d.map((p, i) => {
                  return {
                              idx: i,
                              name: p.Constituency_Name,
                              value: +p.Margin_Percentage,
                              no: +p.Constituency_No,
                              radius: 1.1,
                              party: p.Party,
                              person: p.Candidate,
                              year: p.Year,
                              dist: slugify(p.District_Name)
                        }
                }))
              .enter()
              .append("rect")
                .attr("class", function(d){
                    return 'cno-'+d.no+' cname-'+slugify(d.name)
                })
                .attr("x", 0) //g element already at correct x pos
                .attr("y", function(d) {
                    return - d.idx * 4.5 * d.radius - d.radius; })
                .style('fill',function(obj){
                    if (obj.party=='BJP' || obj.party=='INC'|| obj.party=='INC(I)'){
                            return party_colors[obj.party]
                    } else {
                        return '#bbb'
                    }
                })
                .attr("width", (window_width<500)?4:6)
                .attr("height", (window_width<500)?4:3.5)
                .on('mouseover',function(d){
                    tipOn(d)
                })
                .on('mouseout',function(d){
                    tipOff(d)
                })
            




            // initalize the tip
            var tip = d3.select("body").append("div")
                .attr("class", "tip");
            tip.append("div")
                .attr("class", "close-tip");
            tip.append("div")
                .attr("class", "title");

            function tipOff(){
                d3.selectAll("rect").classed("selected", false);

                d3.select(".tip")
                    .style("opacity", 0)
                    .style("left", "-1000px")
                    .style("top", "-1000px");               
            }

            function tipOn(d){
                    var rect_class = ".hist-year.hist-"+d.year+" rect.cno-" + d.no;
                    if (+d.year!=2012){
                        d3.selectAll( "rect.cno-" + d.no).classed("selected", true);
                        d3.selectAll( ".hist-year.hist-2012 rect.cno-" + d.no).classed("selected", false);
                    } else {
                        d3.selectAll( ".hist-year.hist-2012 rect.cno-" + d.no).classed("selected", true);
                    }
                    tip.select(".title")
                        .html(function(){
                            if (+d.value){
                                return (d.party!='IND')?(toTitleCase(d.person)+' of <span>'+(party_name[d.party]?party_name[d.party]:d.party)+'</span> won <span>'+toTitleCase(d.name)+'</span> with a margin of <span>'+d.value+'% votes.</span>'):('Independent candidate '+toTitleCase(d.person)+' won <span>'+toTitleCase(d.name)+'</span> with a margin of <span>'+d.value+'% votes.</span>')
                            }
                    });

                    tip.select(".close-tip")
                        .html("<i class='fa fa-times' aria-hidden='true'></i>");

                    // position
                    var media_pos = d3.select(rect_class).node().getBoundingClientRect();
                    var tip_pos = d3.select(".tip").node().getBoundingClientRect();
                    var tip_offset = 5;
                    var window_offset = window.pageYOffset;
                    var window_padding = 40;

                    var left = (media_pos.left - tip_pos.width / 2);
                    left = left < 0 ? media_pos.left :
                        left + tip_pos.width > window_width ? media_pos.left - tip_pos.width :
                        left;

                    var top = window_offset + media_pos.top - tip_pos.height - tip_offset;
                    top = top < window_offset + window_padding ? window_offset + media_pos.top + media_pos.height + tip_offset :
                        top;
                    
                    d3.select(".tip")
                        .style("opacity", .98)
                        .style("left", left + "px")
                        .style("top", top + "px");
                }

        } // ready ends

        var yr = document.getElementById('c-year').offsetWidth;
        var yr_box = document.getElementById('year-box').offsetWidth;

        d3.select('.year-button.end-year')
            .on('click',function(d){
                switchTo2012()
            })

        d3.select('.year-button.start-year')
            .on('click',function(d){
                switchTo1980() 
        })

        function toTitleCase(str){
            return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
        }

        function slugify(text){
          return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
        }

        function switchTo1980(){
            d3.select('.ysvg-2012')
                    .transition()
                    .style('opacity',0)
                    .duration(2000)

                d3.select('.ysvg-1980')
                    .transition()
                    .style('opacity',1)
                    .duration(2000)
                if (window_width<600){
                    d3.select('.year-button.current-year')
                    .style('left','0px')
                    .text('1980')
                } else {
                    d3.select('.year-button.current-year')
                        .transition()
                        .style('left',0+'px')
                        .duration(2000)
                        .on("start", function repeat() {
                          d3.active(this)
                              .tween("text", function() {
                                var that = d3.select(this),
                                    i = d3.interpolateNumber(+that.text(), 1980);
                                return function(t) { that.text(Math.round(i(t))); };
                              })
                            .transition()
                              .delay(1500)
                              .on("start", repeat);
                          })
                }
        } // switch to 1980 ends

        function switchTo2012(){
                var i = d3.interpolateNumber(1980, 2012);

                d3.select('.ysvg-2012')
                    .transition()
                    .style('opacity',1)
                    .duration(2000)

                d3.select('.ysvg-1980')
                    .transition()
                    .style('opacity',0)
                    .duration(2000)
                if (window_width<600){
                    d3.select('.year-button.current-year')
                    .style('left',(yr_box-yr)+'px')
                    .text('2012')
                } else {
                    d3.select('.year-button.current-year')
                    .transition()
                    .style('left',(yr_box-yr)+'px')
                    .on("start", function repeat() {
                      d3.active(this)
                          .tween("text", function() {
                            var that = d3.select(this),
                                i = d3.interpolateNumber(+that.text(), 2012);
                            return function(t) { that.text(Math.round(i(t))); };
                          })
                        .transition()
                          .delay(1500)
                          .on("start", repeat);
                    })
                    .duration(2000)
                }
        } // switch to 2012 ends
var w=window,
dw=document,
ew=dw.documentElement,
gw=dw.getElementsByTagName('body')[0]

var window_width = w.innerWidth||ew.clientWidth||gw.clientWidth

var width = (window_width<600)?window_width*0.95:600, height= width*0.85, margin={left:10, right:10, top: 5, bottom: 5}
var desktop_width = 300, desktop_height= 280

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
                    'INC(I)':'steelblue',
                    "State":'#3a3a3a'
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

        if (window_width<600){
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
        } else {
            var years = d3.select('#map-choropleth .viz')
                                .selectAll('.year')
                                .data(byYear)
                                .enter()
                                .append('div')
                                .attr('class',function(d){
                                    return 'desktop-year ysvg-'+d.key
                                })

                years.append('p')
                        .attr('class','year-label')
                        .text(function(d){
                            return d.key
                        })
        }

        var effective_height = window_width<600?height:desktop_height
        var effective_width = window_width<600?width:desktop_width


        var g = years.append('svg')
            .attr('height',effective_height)
            .attr('width',effective_width)
            .append('g')
            .attr('class',function(d){
                return 'y-'+d.key
            })

        var boundary = centerZoom(geo,'gujarat_2008');
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
                .attr("class", function(d){ return "subunit g-ac-"+ d.properties.ac_no})
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
                .on('mouseover',function(d){
                    var obj = _.filter(data, function(e){
                            return (+e['Constituency_No'] == +d.properties.ac_no) && (+e['Year'] == +unit.key) && e.Position=='1'
                        })[0]
                    if (d.properties.ac_no!=0){
                        mapTipOn(d.properties.ac_no,+unit.key,obj)
                    }
                })
                .on('mouseout',function(d){
                    mapTipOff()
                })

        } // end drawSubunits();


        d3.selectAll('.year').each(function(d){
            drawSubUnits(d)
        })

        d3.selectAll('.desktop-year').each(function(d){
            drawSubUnits(d)
        })

        d3.select('.legend')
            .append('p')
            .text('Margin of victory (in %)')

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

        
        d3.select('.viz h2')
            .style('display','none')
        
        if (window_width<600){
            d3.select('.ysvg-2012')
            .style('opacity',0)

                setTimeout(function() {
                  //your code to be executed after 1 second
                  switchTo2012()
                }, 1500);
            }

        // This function "centers" and "zooms" a map by setting its projection's scale and translate according to its outer boundary
        // It also returns the boundary itself in case you want to draw it to the map
          function centerZoom(data, selected){
            var o = topojson.mesh(data, data.objects[selected], function(a, b) { return a === b; });

            projection
                .scale(1)
                .translate([0, 0]);

            var b = path.bounds(o),
                s = 1 / Math.max((b[1][0] - b[0][0]) / effective_width, (b[1][1] - b[0][1]) / effective_height),
                t = [(effective_width - s * (b[1][0] + b[0][0])) / 2, (effective_height - s * (b[1][1] + b[0][1])) / 2];

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
            const hist_margin = {top: 0, right: 30, bottom: 40, left: 15},
                  hist_width =  mainwidth - hist_margin.left - hist_margin.right
                  hist_height = ((window_width<600)?200:170) - hist_margin.top - hist_margin.bottom;

        //x scales
            const x = d3.scaleLinear()
                .rangeRound([0,hist_width])
                .domain([0,100]);
            const nbins = ((window_width>600)?50:32);

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
                    .attr('class','year-label')
                    .text(function(d){
                        return d
                    })

        const svg_hist = years_hist.append("svg")
                .attr("width", hist_width + hist_margin.left + hist_margin.right)
                .attr("height", hist_height + hist_margin.top + hist_margin.bottom)
                .append("g")
                .attr("transform",
                        `translate(${hist_margin.left}, ${hist_margin.top})`);

            svg_hist
                .append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(0," + (hist_height+2) + ")")
                .call(d3.axisBottom(x).ticks(5).tickSize(-hist_height).tickFormat(function(d){
                    var yr = (d3.select(this.parentNode.parentNode).datum())
                    if (+yr==+years_list[0]){
                        if (d==100){
                            return d+'% votes'
                        } else {
                            return d+"%"
                        }
                    }   else {
                            return d+"%"
                    }
                }));

            svg_hist
                .filter(function (d, i) { return i === 0;})
                .append("g")
                .attr("class", "axis-label")
                .attr("transform", "translate(0," + (hist_height+30) + ")")
                .append('text')
                .text('Margin of victory →')



            var median = svg_hist.append("g")
                .attr("class", "median")

            median.append('line')
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
                  .style('stroke','#3a3a3a')

            median.filter(function (d, i) { return i === 0;})
                .append('text')
                .attr('transform',function(){

                        var yr = (d3.select(this.parentNode).datum())
                        var select = _.chain(hist_data).filter(function(d){return d['Year']==yr && +d['Margin_Percentage']}).sortBy('Margin_Percentage').value()
                        var median = d3.median(select,function(d){
                            return d.Margin_Percentage
                        })
                        return 'translate('+(x(median)+6)+','+35+')'
                    })
                .text(function(d,i){
                    var yr = (d3.select(this.parentNode).datum())
                        var select = _.chain(hist_data).filter(function(d){return d['Year']==yr && +d['Margin_Percentage']}).sortBy('Margin_Percentage').value()
                        var median = d3.median(select,function(d){
                            return d.Margin_Percentage
                        })
                        if (i==0){
                            return 'Median'
                        }
                })
                .style('font-weight','bold')

            median.append('text')
                .attr('transform',function(d,i){

                        var yr = (d3.select(this.parentNode).datum())
                        var select = _.chain(hist_data).filter(function(d){return d['Year']==yr && +d['Margin_Percentage']}).sortBy('Margin_Percentage').value()
                        var median = d3.median(select,function(d){
                            return d.Margin_Percentage
                        })
                        if (i==0){
                            return 'translate('+(x(median)+6)+','+50+')'
                        } else {
                            return 'translate('+(x(median)+6)+','+35+')'
                        }
                        
                    })
                .text(function(d,i){
                    
                    var yr = (d3.select(this.parentNode).datum())
                        var select = _.chain(hist_data).filter(function(d){return d['Year']==yr && +d['Margin_Percentage']}).sortBy('Margin_Percentage').value()
                        var median = d3.median(select,function(d){
                            return d.Margin_Percentage
                        })
                        
                            return roundNum(median,2)
                        
                })

                        svg_hist
                .filter(function (d, i) { return i === 0;})
                .append("g")
                .attr("class", "axis-label-detail")
                .append('text')
                .text('')
                .style('text-anchor','end')
                .attr("transform", "translate("+(hist_width+margin.left+margin.right)+"," + 12 + ")")
                .tspans( function(d){return d3.wordwrap("Less competitive →", 12)}) //wrap after 8 char

            svg_hist
                .filter(function (d, i) { return i === 0;})
                .append("g")
                .attr("class", "axis-label-detail")
                .append('text')
                .text('')
                .style('text-anchor','start')
                .attr("transform", "translate("+(0)+"," + 12 + ")")
                .tspans( function(d){return d3.wordwrap("← More competitive", 12)}) //wrap after 8 char


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

            function mapTipOff(){
                d3.selectAll("path").classed("selected", false);
                d3.select(".tip")
                    .style("opacity", 0)
                    .style("left", "-1000px")
                    .style("top", "-1000px");
            }

            function mapTipOn(ac, year,d){
                    var rect_class = ".ysvg-"+year+" .g-ac-" + ac;
                    if (+year!=2012){
                        d3.selectAll( ".g-ac-" + ac).classed("selected", true).moveToFront();
                        d3.select( ".ysvg-2012 .g-ac-" + ac).classed("selected", false);
                    } else {
                        d3.selectAll( ".ysvg-2012 .g-ac-" + ac).classed("selected", true).moveToFront();
                    }
                    tip.select(".title")
                        .html(function(){
                            if (+d.Margin_Percentage){
                                return (d.Party!='IND')?(toTitleCase(d.Candidate)+' of <span>'+(party_name[d.Party]?party_name[d.Party]:d.Party)+'</span> won <span>'+toTitleCase(d.Constituency_Name)+'</span> with a margin of <span>'+d.Margin_Percentage+'% votes.</span>'):('Independent candidate '+toTitleCase(d.Candidate)+' won <span>'+toTitleCase(d.Constituency_Name)+'</span> with a margin of <span>'+d.Margin_Percentage+'% votes.</span>')
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
                } // tipOn ends


                // line chart
                var line_width = window_width<800?window_width:800, line_height = 400, line_margin = 30
                var line_data = [{"year":1990,"median":10.14,"party":"INC"},
                                {"year":1995,"median":9.55,"party":"INC"},
                                {"year":1998,"median":13.11,"party":"INC"},
                                {"year":2002,"median":8.43,"party":"INC"},
                                {"year":2007,"median":8.64,"party":"INC"},
                                {"year":2012,"median":6.6,"party":"INC"},
                                {"year":1990,"median":13.99,"party":"BJP"},
                                {"year":1995,"median":15.05,"party":"BJP"},
                                {"year":1998,"median":13.96,"party":"BJP"},
                                {"year":2002,"median":13.79,"party":"BJP"},
                                {"year":2007,"median":11.555,"party":"BJP"},
                                {"year":2012,"median":13.33,"party":"BJP"},
                                {"year":1990,"median":13.72,"party":"State"},
                                {"year":1995,"median":12.96,"party":"State"},
                                {"year":1998,"median":13.64,"party":"State"},
                                {"year":2002,"median":12.11,"party":"State"},
                                {"year":2007,"median":11.1,"party":"State"},
                                {"year":2012,"median":10.72,"party":"State"}]

                var line_func = d3.line()
                                .x(function(d) { return xScale_line(+d.year) })
                                .y(function(d) { return yScale_line(+d.median) })

                var xScale_line = d3.scaleLinear()
                    .domain([1990,2012])
                    .range([0, (line_width-line_margin-line_margin)]);

                var yScale_line = d3.scaleLinear()
                .domain([d3.max(line_data,function(d){
                                        return +d.median
                                    }),0])
                .range([0,line_height-line_margin-line_margin])

                var axisX_line = d3.axisBottom(xScale_line)
                                    .tickFormat(function(d,i){
                                            return d
                                    })
                                    .ticks(5)

                var axisY_line = d3.axisLeft(yScale_line)
                        .ticks(4)
                        .tickFormat(function(d,i){
                            if (d!=0){
                                return d+'%'
                            }
                        })
                        .tickSize(-(line_width-line_margin-line_margin), 0, 0)

                line_groups = d3.nest()
                    .key(function(d) { return d.party; })
                    .entries(line_data);

                var median_chart = d3.select('#line-chart')
                        .append('svg')
                        .attr('height',line_height)
                        .attr('width',line_width)
                        .append('g')
                        .attr('class','chart')
                        .attr("transform", "translate("+line_margin+","+line_margin+")")
                        
                    median_chart.append("g")
                        .attr("class", "axis--y axis")
                        .call(axisY_line);

                    median_chart
                        .append("g")
                        .attr('class','axis--x axis')
                        .call(axisX_line)
                        .attr("transform", "translate(0,"+(yScale_line(0))+")");

                    median_chart.append('g')
                        .attr('class','line-group')
                        .selectAll('.median-line')
                        .data(line_groups)
                        .enter()
                        .append('g')
                        .attr('class','median-line')
                        .attr('id',function(d,i){return 'line-'+slugify(d.key)} )
                    
                    d3.selectAll('.median-line')
                        .append("path")
                          .datum(function(d){return d.values})
                          .attr("fill", 'none')
                          .attr("stroke-linejoin", "round")
                          .attr("stroke-linecap", "round")
                          .attr("stroke-width", 2.5)
                          .style('stroke',function(d){
                            return party_colors[d[0].party]
                          })
                          .attr("d", line_func);

                    d3.selectAll('.median-line')
                        .append("text")
                        .attr('class','text-back')
                          .text(function(d){
                            return d.key
                          })
                          .style('stroke',function(d){
                            return party_colors[d.key]
                          })
                          .style('stroke-width','6')
                          .style('fill',function(d){
                            return party_colors[d.key]
                          })
                          .style('text-anchor','end')
                          .attr('transform',function(d){
                            return 'translate('+(xScale_line(2005))+','+yScale_line((d.values[3].median+d.values[4].median)/2)+')'
                      });

                    d3.selectAll('.median-line')
                        .append("text")
                        .attr('class','text-front')
                          .text(function(d){
                            return d.key
                          })
                          .style('fill','#fff')
                          .style('text-anchor','end')
                          .attr('transform',function(d){
                            return 'translate('+(xScale_line(2005)-2)+','+(yScale_line((d.values[3].median+d.values[4].median)/2)+1)+')'
                      });

                    var annotations = median_chart.append('g')
                        .attr('class','annotation')

                    annotate(line_data[0])
                    annotate(line_data[5])
                    annotate(line_data[6])
                    annotate(line_data[11])
                    annotate(line_data[12],'bottom')
                    annotate(line_data[17])
                    annotate(line_data[7])
                    annotate(line_data[2],'bottom')


                    function annotate(d,side){
                        annotations.append('text')
                                    .text(roundNum(d.median,1)+'%')
                                    .attr('transform','translate('+(xScale_line(d.year))+','+(side?(yScale_line(d.median)+17):(yScale_line(d.median)-8))+')')
                                    .style('fill',party_colors[d.party])
                                    .style('text-anchor','middle');
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

        function roundNum(num, decimals) {
            return parseFloat(Math.round(num * 100) / 100).toFixed(decimals);
        }

        function switchTo1980(){
            d3.select('.map-svg.ysvg-2012')
                    .transition()
                    .style('opacity',0)
                    .duration(2000)

                d3.select('.map-svg.ysvg-1980')
                    .transition()
                    .style('opacity',1)
                    .duration(2000)

                    d3.select('.year-button.current-year')
                    .style('left','0px')
                    .text('1980')
                
        } // switch to 1980 ends

        function switchTo2012(){
            d3.select('.map-svg.ysvg-2012')
                    .transition()
                    .style('opacity',1)
                    .duration(2000)

                d3.select('.map-svg.ysvg-1980')
                    .transition()
                    .style('opacity',0)
                    .duration(2000)
                
                    d3.select('.year-button.current-year')
                    .style('left',(yr_box-yr)+'px')
                    .text('2012')
                
        } // switch to 2012 ends

        // d3 webpack functions

      d3.selection.prototype.tspans = function(lines, lh) {
          return this.selectAll('tspan')
              .data(lines)
              .enter()
              .append('tspan')
              .text(function(d) { return d; })
              .attr('x', 0)
              .attr('dy', function(d,i) { return i ? lh || 10 : 0; });
      };

      d3.selection.prototype.moveToFront = function() {  
      return this.each(function(){
        this.parentNode.appendChild(this);
      });
        };
        d3.selection.prototype.moveToBack = function() {  
            return this.each(function() { 
                var firstChild = this.parentNode.firstChild; 
                if (firstChild) { 
                    this.parentNode.insertBefore(this, firstChild); 
                } 
            });
        };

      d3.wordwrap = function(line, maxCharactersPerLine) {
          var w = line.split(' '),
              lines = [],
              words = [],
              maxChars = maxCharactersPerLine || 40,
              l = 0;
          w.forEach(function(d) {
              if (l+d.length > maxChars) {
                  lines.push(words.join(' '));
                  words.length = 0;
                  l = 0;
              }
              l += d.length;
              words.push(d);
          });
          if (words.length) {
              lines.push(words.join(' '));
          }
          return lines;
      };

let doctype = '<?xml version="1.0" standalone="no"?>' + '<' + '!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

// Generates a URL-friendly "slug" from a provided string.
// For example: "This Is Great!!!" transforms into "this-is-great"
// https://gist.github.com/bentruyman/1211400
function generateSafeFilename(value) {
    return value.toLowerCase().replace(/[^a-z0-9-]/g, '')
        .replace(/\s+/g, '_').slice(0, 40);
}

function captureImage() {
    let  selector = d3.select("#data-visualization-" + mainModel.selected.chart().id + " svg");
    // serialize our SVG XML to a string.
    let source = (new XMLSerializer()).serializeToString(selector.node());
    // create a file blob of our SVG.
    let blob = new Blob([doctype + source], {type: 'image/svg+xml'});
    let url = window.URL.createObjectURL(blob);
    // Put the svg into an image tag so that the Canvas element can read it in.
    let svg_object = selector;
    let img = d3.select('#capture-dialog .modal-body img')
        .attr('width', svg_object.attr('width'))
        .attr('height', svg_object.attr('height'))
        .node();

    $('#capture-dialog .modal-body').height(100 + parseInt(svg_object.attr('height')));
    $('#capture-dialog .modal-content').width(30 + parseInt(svg_object.attr('width')));
    $("#download-image")
        .attr("href", url)
        .attr("download", generateSafeFilename(mainModel.settings.title()) + ".png");
    img.onload = function () {
        // Now that the image has loaded, put the image into a canvas element.
        let canvas = document.createElement('canvas');
        canvas.width = svg_object.attr('width');
        canvas.height = svg_object.attr('height');
        let ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        let canvasUrl = "";
        try {
            canvasUrl = canvas.toDataURL("image/png");
        } catch (e) {
            canvasUrl = url;
        }
        img.onload = null;
        img.setAttribute('src', canvasUrl);
        $("#download-image")
            .attr("href", canvasUrl)
            .attr("download", generateSafeFilename(mainModel.settings.title()) + ".png");

        /*
        var img2 = d3.select('#capture-dialog .modal-body img')
            .attr('width', svg_object.attr('width'))
            .attr('height', svg_object.attr('height'))
            .node();
        // this is now the base64 encoded version of our PNG! you could optionally
        // redirect the user to download the PNG by sending them to the url with
        // ``.
        img2.src = canvasUrl;
        */
    };
    // start loading the image.
    img.src = url;
}

function stringContains(aString, it) {
    return aString.indexOf(it) !== -1;
}

function compare(a, b) {
    if (a.name < b.name)
        return -1;
    else if (a.name > b.name)
        return 1;
    else
        return 0;
}

function getRandomSubarray(arr, size) {
    var shuffled = arr.slice(0), i = arr.length, temp, index;
    while (i--) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(0, size);
}

function makeVisualizer() {
    var CHARTS = ko.observableArray([
        {'name': 'Line Plot', 'id': 'line', 'parameters': 1, 'first': 'Y-values'},
        {'name': 'Histogram', 'id': 'hist', 'parameters': 1, 'first': 'Values'},
        {'name': 'Scatter Plot', 'id': 'scatter', 'parameters': 2, 'first': 'X-values', 'second': 'Y-values'},
        {
            'name': 'Bar Chart',
            'id': 'bar',
            'parameters': 3,
            'first': 'Values',
            'second': 'Category',
            'third': 'Aggregation'
        },
        //{'name': 'XY Plot', 'id': 'xy', 'parameters': 2, 'first': 'X-values', 'second': 'Y-values'},
    ]);
    var COLOR_SCHEMES = [
        {'name': 'Blue', 'stroke': 'blue', 'fill': 'lightblue'},
        {'name': 'Green', 'stroke': 'green', 'fill': 'lightgreen'},
        {'name': 'Red', 'stroke': 'red', 'fill': 'pink'},
        {'name': 'Black', 'stroke': 'black', 'fill': 'black'},
        {'name': 'Grey', 'stroke': 'darkgray', 'fill': 'lightgray'},
        {'name': 'Yellow', 'stroke': 'goldenrod', 'fill': 'LightGoldenRodYellow '},
        {'name': 'Purple', 'stroke': 'purple', 'fill': 'plum '},
        {'name': 'Alpha Blue', 'stroke': 'rgba(0, 0, 255, .1)', 'fill': 'rgba(0, 0, 255, .1)'},
        {'name': 'Alpha Red', 'stroke': 'rgba(255, 0, 0, .1)', 'fill': 'rgba(255, 0, 0, .1)'},
        {'name': 'Alpha Green', 'stroke': 'rgba(0, 255, 0, .1)', 'fill': 'rgba(0, 255, 0, .1)'}
    ];

    mainModel = {
        'aggregators': ko.observableArray([
            {'name': 'Average', 'id': 'average'},
            {'name': 'Average w/o Zero', 'id': 'average w/o zero'},
            {'name': 'Count', 'id': 'count'},
            {'name': 'Sum', 'id': 'sum'}
        ]),
        'schemes': COLOR_SCHEMES,
        'settings': {
            'title': ko.observable('Add your title here'),
            'sampling': ko.observable(400),
            'color': ko.observable(COLOR_SCHEMES[0]),
            'bins': ko.observable(20)
        },
        'charts': CHARTS,
        'selected': {
            'dataset': ko.observable('weather'),
            'first': ko.observable({'data': []}),
            'second': ko.observable('humidity'),
            'category': ko.observable({'comment': '', 'name': ''}),
            'third': ko.observable('humidity'),
            'filter': ko.observable('none'),
            'filter_value': ko.observable(''),
            'chart': ko.observable(CHARTS()[0]),
            'row_explanation': ko.observable(''),
            'bar_dataset': ko.observable({'data': []})
        },
        "error": ko.observable(false),
        'bars': ko.observableArray([
            {'name': DATASET_NAME, 'data': VISUALIZER_DATA_BARS}
        ]),
        'structures': ko.observableArray([
            {'name': DATASET_NAME, 'row': DATASET_ROW, 'data': VISUALIZER_DATA}
        ])
    };
    mainModel.selected.row_explanation = ko.computed(function () {
        var self = this;
        let explanation = ["Each"];
        if (!self.selected) {
            return "No explanation";
        }
        switch (self.selected.chart().id) {
            case 'line': case 'scatter':
                explanation.push('point');
                break;
            case 'hist':
                explanation.push('unit on the y-axis');
        }
        explanation.push("represents");
        if (DATASET_ROW_EXPLANATION !== "$MISSING_FIELD") {
            explanation.push(DATASET_ROW_EXPLANATION);
        } else {
            explanation.push(DATASET_NAME);
        }
        if (self.selected.filter() !== "none") {
            explanation.push(", where");
            explanation.push("<code>"+self.selected.filter()+"</code>");
            explanation.push("is equal to");
            explanation.push("<code>"+self.selected.filter_value()+"</code>");
        }
        if (self.selected.chart().id === 'line') {
            explanation.push(", ordered by");
            let orderings = VISUALIZER_DATA_BARS
                .map(i=>i.pretty)
                .filter(i=>i !== self.selected.filter())
                .map(i=>"<code>"+i+"</code>")
                .join(" and ");
            explanation.push(orderings);
            explanation.push("on the X-axis.");
        } else {
            explanation.push(".");
        }
        return explanation.join(" ");
    }, mainModel);
    mainModel.selected.bar_dataset = ko.computed(function () {
        var self = this;
        if (this.bars().length > 0) {
            return this.bars().filter(function (elem) {
                return elem.name === self.selected.dataset().name;
            })[0];
        } else {
            return null;
        }
    }, mainModel);
    mainModel.sorted_indexes = function () {
        return mainModel.selected.filter_index_data().indexes.concat().sort();
    };
    mainModel.selected.filter_index_data = ko.computed(function () {
        var self = this;
        var target = self.selected.filter();
        if (target === "none") {
            return null;
        }
        var dataset = self.selected.bar_dataset().data;
        if (dataset.length > 0) {
            return dataset.filter(function (elem) {
                return elem.name === target;
            })[0];
        } else {
            return null;
        }
    }, mainModel);

    function filter_index_values() {
        var self = mainModel;
        var target = self.selected.filter();
        if (target === "none") {
            return null;
        }
        var dataset = self.selected.dataset().data;
        if (dataset.length > 0) {
            return dataset.filter(function (elem) {
                return elem.name === target;
            })[0];
        } else {
            return null;
        }
    }

    /*
    mainModel.structures().forEach(function(e, i) {
        e.data.sort(function(l, r) { return l.pretty > r.pretty ? 1 : -1 });
    });*/

    mainModel.only_numbers = function (dataset) {
        return dataset.filter(function (element) {
            return element.type === 'number';
        });
    };

    mainModel.only_indexes = function (dataset) {
        return dataset.filter(function (element) {
            return element.index;
        });
    };

// Here's a custom Knockout binding that makes elements shown/hidden via jQuery's fadeIn()/fadeOut() methods
// Could be stored in a separate utility library
    ko.bindingHandlers.fadeVisible = {
        init: function (element, valueAccessor) {
            // Initially set the element to be instantly visible/hidden depending on the value
            var value = valueAccessor();
            $(element).toggle(ko.unwrap(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
        },
        update: function (element, valueAccessor) {
            // Whenever the value subsequently changes, slowly fade the element in or out
            var value = valueAccessor();
            ko.unwrap(value) ? $(element).fadeIn() : $(element).fadeOut();
        }
    };

    $('#capture-button').click(function () {
        captureImage();
        $("#capture-dialog").modal('show');
    });

    $(".hide-on-load").hide();

    ko.applyBindings(mainModel);

    mainModel.settings.sampling(Math.min(300, mainModel.structures()[0].data[0].data.length));

    function changeCategory() {
        $('#select-bar-keys').empty().multiSelect('refresh');
        // Check the first one to get the length
        var bar_data = mainModel.selected.category();//bar_dataset().data[0];
        var indexes = bar_data.indexes.concat().sort();
        for (var i = 0, length = indexes.length; i < length; i = i + 1) {
            if (!stringContains(indexes[i], "'")) {
                $('#select-bar-keys').multiSelect('addOption', {
                    value: indexes[i],
                    text: indexes[i],
                });
            }
        }
        $('#select-bar-keys').multiSelect('select', bar_data.best_indexes);
        changeDataset();
    }

    $('#select-bar-keys').multiSelect({
        //selectableHeader: "<input type='text' class='search-input' autocomplete='off' placeholder='filter'>",
        //selectionHeader: "<input type='text' class='search-input' autocomplete='off' placeholder='filter'>",
        selectableHeader: "<div class='custom-header'>Available</div>" +
            "<input type='text' class='search-input' autocomplete='off' placeholder='Search'>",
        selectionHeader: "<div class='custom-header'>Selected</div>" +
            "<input type='text' class='search-input' autocomplete='off' placeholder='Search'>",
        afterInit: function (ms) {
            var that = this,
                $selectableSearch = that.$selectableUl.prev(),
                $selectionSearch = that.$selectionUl.prev(),
                selectableSearchString = '#' + that.$container.attr('id') + ' .ms-elem-selectable:not(.ms-selected)',
                selectionSearchString = '#' + that.$container.attr('id') + ' .ms-elem-selection.ms-selected';

            that.qs1 = $selectableSearch.quicksearch(selectableSearchString)
                .on('keydown', function (e) {
                    if (e.which === 40) {
                        that.$selectableUl.focus();
                        return false;
                    }
                });
            that.qs2 = $selectionSearch.quicksearch(selectionSearchString)
                .on('keydown', function (e) {
                    if (e.which === 40) {
                        that.$selectionUl.focus();
                        return false;
                    }
                });
        },
        afterSelect: function () {
            this.qs1.cache();
            this.qs2.cache();
        },
        afterDeselect: function () {
            this.qs1.cache();
            this.qs2.cache();
        }
    });

    $('#select-bar-keys').on("change", function () {
        changeDataset();
    });


    var margin = {top: 60, right: 20, bottom: 100, left: 100},
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    var formatDate = d3.time.format("%d-%b-%y");

    var x = d3.scale.linear()
        .range([0, width]);
    var xOrdinal = d3.scale.ordinal()
        .rangeBands([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");
    var xAxisOrdinal = d3.svg.axis()
        .scale(xOrdinal)
        .tickFormat(function (d) {
            return d.index
        })
        .orient("bottom");

    var line = d3.svg.line()
        .x(function (d) {
            return x(d.x);
        })
        .y(function (d) {
            return y(d.y);
        })
        .interpolate("linear");

    var xMap = function (d) {
        return x(d.x)
    };
    var yMap = function (d) {
        return y(d.y)
    };

    mainModel.charts().forEach(function (e, i) {
        var svg = d3.select("#data-visualization-" + e.id).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);
        e.canvas = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        if (e.id === 'xy' || e.id === 'line') {
            e.canvas.append('path')
                .attr("class", "line")
                .style('stroke', mainModel.settings.color().stroke);
        }
        e.canvas.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(e.id === 'bar' ? xAxisOrdinal : xAxis);
        e.canvas.append("g")
            .attr("class", "y axis")
            .call(yAxis);
        e.canvas.append("text")      // text label for the x axis
            .attr("transform", "translate(" + (width / 2) + " ," + (height + margin.bottom - 5) + ")")
            .attr("class", "x-axis-label")
            .style("font-size", "14px")
            .style("text-anchor", "middle")
            .text(mainModel.selected.first().pretty);
        e.canvas.append("text")
            .attr("transform", "rotate(-90)")
            .attr("class", "y-axis-label")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .style("font-size", "14px")
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text(mainModel.selected.second().pretty);
        e.canvas.append("text")
            .attr("x", (width / 2))
            .attr("y", 0 - (margin.top / 2))
            .attr("class", "title-text")
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("text-decoration", "underline")
            .text(mainModel.settings.title());
        e.canvas.append("text")
            .attr("class", "aggregator-text")
            .style("text-anchor", "left")
            .attr("transform", "translate(" + (0 - margin.left) + " ," + (height + margin.bottom - 5) + ")")
            .style("font-size", "10px")
            .text(mainModel.selected.third().name);
        svg.insert('defs', ":first-child")
            .append('style')
            .attr("type", "text/css")
            .text(/*"<![CDATA[\n"+*/
                "svg { background-color: white; }\n" +
                "text { font: 14px sans-serif}\n" +
                ".tick text { font-size: 14px; }\n" +
                ".axis path,.axis line { fill: none; stroke: black; shape-rendering: crispEdges;}\n" +
                ".line { fill: none; stroke-width: 1px;}\n" +
                ".circle { r: 3; shape-rendering: crispEdges; }\n" +
                ".bar { shape-rendering: crispEdges;}\n"
                /*"]]>"*/)
    });

// TODO: implement http://www.thesoftwaresimpleton.com/blog/2016/01/16/d3-axis/


    function changeDataset() {
        mainModel.error(false);
        var chart = mainModel.selected.chart();

        var canvas = chart.canvas;

        getRandomSubarray = function (l, leng) {
            return l.filter(function (element, index) {
                return index % Math.round(l.length / leng) === 0;
            });
        };

        var filter_index = mainModel.selected.filter();
        var filter_value = null;
        if (filter_index !== "none") {
            filter_value = mainModel.selected.filter_value();
        } else {
            filter_index = null;
        }

        var left = mainModel.selected.first().data;
        var actualData, xs, ys;
        if (chart.id === 'bar') {
            var indexes = $('#select-bar-keys').val();
            if (mainModel.selected.bar_dataset().data.length === 0) {
                return;
            }
            // TODO: fix this to be the chosen index
            var indexed_data = mainModel.selected.category().data;
            var key = mainModel.selected.first().name;
            var indexifier = mainModel.selected.category();
            var aggregator = mainModel.selected.third().id;
            actualData = [];
            for (var i = 0, length = indexes.length; i < length; i = i + 1) {
                var index = indexes[i];
                actualData.push({
                    'index': index,
                    'value': indexed_data[key][index][aggregator]
                });
            }
        } else if (chart.id === 'scatter') {
            var same_names = mainModel.selected.first().name === mainModel.selected.second().name;
            var right = same_names ? left : mainModel.selected.second().data;
            if (filter_index != null && filter_value != null) {
                let indices = filter_index_values().data;
                ys = [];
                xs = [];
                for (let i = 0, length = indices.length; i < length; i = i + 1) {
                    if (filter_value == indices[i]) {
                        xs.push(left[i]);
                        ys.push(right[i]);
                    }
                }
            } else {
                xs = getRandomSubarray(left, mainModel.settings.sampling());
                ys = same_names ? xs : getRandomSubarray(right, mainModel.settings.sampling());
            }
            actualData = d3.zip(xs, ys).map(function (element) {
                return {'x': element[0], 'y': element[1]}
            });
        } else {
            if (filter_index != null && filter_value != null) {
                let indices = filter_index_values().data;
                ys = [];
                var key_value;
                for (let i = 0, length = indices.length; i < length; i = i + 1) {
                    key_value = indices[i];
                    if (typeof key_value === 'string') {
                        key_value = key_value.replace(',', '');
                        filter_value = filter_value.replace(',', '');
                    }
                    // acbart: Yes, we actually do want == instead ===
                    //         This simplifies the filtering, since they might be different types
                    if (filter_value == key_value) {
                        ys.push(left[i]);
                    }
                }
            } else {
                ys = left;
            }
            actualData = ys.map(function (element, index) {
                return {'x': index, 'y': element}
            });
        }

        if (actualData.length === 0) {
            mainModel.error("Given this filter, there is no data available.");
        }

        if (chart.id === 'hist') {
            let xMin = d3.min(ys), xMax = d3.max(ys);
            if (xMin === xMax && mainModel.error() === false) {
                mainModel.error("Given this filter, there was no variation in the data - histogram will be empty!");
            }
            x.domain([xMin, xMax]);
            var bins = parseInt(mainModel.settings.bins()) + 1;
            if (isNaN(bins)) {
                bins = 10;
            }
            tempScale = d3.scale.linear().domain([0, bins]).range(d3.extent(ys));
            tickArray = d3.range(bins).map(tempScale).map(function (e) {
                return e;
            });
            //var histMapper = d3.layout.histogram().bins(x.ticks(tickArray))(ys);
            var histMapper = d3.layout.histogram().bins(tickArray)(ys);
            y.domain([0, d3.max(histMapper, function (d) {
                return d.y;
            })]);
        } else if (chart.id === 'bar') {
            xOrdinal.domain(actualData.map(function (d) {
                return d.index;
            }));
            y.domain([0, d3.max(actualData, function (d) {
                return Math.abs(d.value);
            })]);
        } else {
            let xBounds = d3.extent(actualData, function (d) {
                return d.x;
            });
            let yBounds = d3.extent(actualData, function (d) {
                return d.y;
            })
            if (yBounds[0] === yBounds[1] && mainModel.error() === false) {
                mainModel.error("Given this filter, there was no variation in the data - visualization will be empty!");
            }
            x.domain(xBounds);
            y.domain(yBounds);
        }

        // bind data

        // add new elements
        var appending;
        if (chart.id === 'xy' || chart.id === 'line') {
            appending = canvas.selectAll('.line')
            //.style('fill', mainModel.settings.color().fill)
                .style('stroke', mainModel.settings.color().stroke)
                .data(actualData);
            appending.exit()
                .transition()
                .attr("stroke-width", 0)
                .remove();

            appending.transition()
                .duration(500)
                .attr("d", line(actualData));
        } else if (chart.id === 'scatter') {
            appending = canvas.selectAll('circle')
                .style('fill', mainModel.settings.color().stroke)
                //.style('outline', '1px solid '+mainModel.settings.color().stroke)
                .data(actualData);
            appending.exit()
                .transition()
                .attr("r", 0)
                .remove();
            appending.enter().append('circle')
                .attr("class", "circle")
                .style('fill', mainModel.settings.color().stroke)
                .attr("cx", xMap)
                .attr("cy", yMap)
                .attr('r', 4);
            appending.transition()
                .duration(500)
                .attr("cx", xMap)
                .attr("cy", yMap);
        } else if (chart.id === 'bar') {
            bars = canvas.selectAll('.bar')
                .style('fill', mainModel.settings.color().fill)
                .style('stroke', mainModel.settings.color().stroke)
                //.style('outline', '1px solid '+mainModel.settings.color().stroke)
                .data(actualData);
            bars.exit()
                .transition()
                .duration(500)
                .attr("y", y(0))
                .attr('height', height - y(0))
                .style('fill-opacity', 1e-6)
                .remove();

            bars.enter().append("rect")
                .attr("class", "bar")
                .style('fill', mainModel.settings.color().fill)
                .style('stroke', mainModel.settings.color().stroke)
                //.style('outline', '1px solid '+mainModel.settings.color().stroke)
                .attr("y", y(0))
                .attr("height", height - y(0));

            bars.transition()
                .duration(500)
                .attr("x", function (d) {
                    return xOrdinal(d.index);
                })
                .attr("width", xOrdinal.rangeBand())
                .attr("y", function (d) {
                    return y(d.value);
                })
                .attr("height", function (d) {
                    return height - y(d.value);
                });
            bars.append("text")
                .attr("x", xOrdinal.rangeBand() / 2)
                .attr("y", function (d) {
                    return y(d.value) + 3;
                })
                .attr("dy", ".75em")
                .text(function (d) {
                    return d.value;
                });

        } else if (chart.id === 'hist') {
            bars = canvas.selectAll('.bar')
                .style('fill', mainModel.settings.color().fill)
                .style('stroke', mainModel.settings.color().stroke)
                //.style('outline', '1px solid '+mainModel.settings.color().stroke)
                .data(histMapper);
            bars.exit()
                .transition()
                .duration(500)
                .attr("y", y(0))
                .attr('height', height - y(0))
                //.style('fill-opacity', 1e-6)
                .remove();

            bars.enter().append("rect")
                .attr("class", "bar")
                .attr("y", y(0))
                .style('fill', mainModel.settings.color().fill)
                .style('stroke', mainModel.settings.color().stroke)
                //.style('outline', '1px solid '+mainModel.settings.color().stroke)
                .attr("height", height - y(0));

            bars.transition()
                .duration(500)
                .attr("x", function (d) {
                    return x(d.x);
                })
                .attr("width", width / (histMapper.length))
                .attr("y", function (d) {
                    return y(d.y);
                })
                .attr("height", function (d) {
                    return height - y(d.y);
                });
        }


        var x_axis_label = mainModel.selected.chart().id === 'bar' ?
            mainModel.selected.category().pretty :
            mainModel.selected.chart().id === 'line' ?
                //(mainModel.selected.dataset().order) :
                (mainModel.selected.dataset().order ? mainModel.selected.dataset().order :
                    (mainModel.selected.bar_dataset().data.filter(function (cur) {
                        return cur.name !== mainModel.selected.filter()
                    }).reduce(function (pre, cur) {
                        return pre + " / " + cur.pretty
                    }, "").substring(3))) :
                mainModel.selected.first().pretty;
        var y_axis_label = mainModel.selected.chart().id === 'hist' ?
            'Number of ' + mainModel.selected.dataset().row + "s" :
            mainModel.selected.chart().id === 'line' || mainModel.selected.chart().id === 'bar' ?
                mainModel.selected.first().pretty :
                mainModel.selected.second().pretty;

        // Update the axis
        var xAxis = d3.svg.axis().scale(x).orient("bottom");
        var xAxisOrdinal = d3.svg.axis()
            .scale(xOrdinal)
            //.tickFormat(function(d) { return d.index })
            .orient("bottom");
        var yAxis = d3.svg.axis().scale(y).orient("left");

        // Get the indexes; remove any filtered ones
        // Use them in tandem to get the x-axis values
        if (chart.id === 'line') {
            let indexes = mainModel.only_indexes(mainModel.selected.dataset().data);
            var all_ticks = [];
            for (let i = 0; i < indexes[0].data.length; i = i + 1) {
                var a_tick = [];
                var keep = true;
                for (var j = 0; j < indexes.length; j = j + 1) {
                    var an_index = indexes[j],
                        value = an_index.data[i];
                    if (typeof value === 'string') {
                        key_value = value.replace(',', '');
                    } else {
                        key_value = value;
                    }
                    if (an_index.name !== filter_index) {
                        a_tick.push(value);
                    } else if (key_value != filter_value) {
                        keep = false;
                    }
                }
                if (keep) {
                    all_ticks.push("" + a_tick.join(", "));
                }
            }
            xAxis.tickFormat(function (value, index) {
                return all_ticks[value];
            });
            xAxisOrdinal.tickFormat(d3.format("d"));
        } else if (stringContains(x_axis_label.toLowerCase(), "year")) {
            xAxis.tickFormat(d3.format("d"));
            xAxisOrdinal.tickFormat(d3.format("d"));
        }
        if (stringContains(y_axis_label.toLowerCase(), "year")) {
            yAxis.tickFormat(d3.format("d"));
        }

        canvas.selectAll("g.y.axis").call(yAxis);

        var r = canvas.selectAll("g.x.axis")
            .call(chart.id === 'bar' ? xAxisOrdinal : xAxis);
        if (chart.id === 'bar' || chart.id === 'line') {
            r.selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.3em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-15)");
        }
        if (chart.id === 'bar') {
            d3.selectAll("text.aggregator-text")
                .text("Aggregation: " + mainModel.selected.third().name);
        } else {
            if (mainModel.selected.filter_value() !== undefined) {
                d3.selectAll("text.aggregator-text")
                    .text(mainModel.selected.filter_value());
            } else {
                d3.selectAll("text.aggregator-text")
                    .text("");
            }
        }


        canvas.selectAll("text.x-axis-label")
            .text(x_axis_label);
        canvas.selectAll("text.y-axis-label")
            .text(y_axis_label);
    }


// generate initial legend
    if (mainModel.selected.bar_dataset().data.length > 0) {
        changeCategory();
    }
//changeDataset();
    mainModel.selected.first.subscribe(changeDataset);
    mainModel.selected.second.subscribe(changeDataset);
    mainModel.selected.category.subscribe(changeCategory);
    mainModel.selected.third.subscribe(changeDataset);
    mainModel.selected.chart.subscribe(changeDataset);
    mainModel.selected.filter.subscribe(changeDataset);
    mainModel.selected.filter_value.subscribe(changeDataset);

    mainModel.selected.chart.subscribe(function (chart_type) {
        mainModel.settings.title("Add your title here")
    });

    mainModel.settings.bins.subscribe(changeDataset);
    mainModel.settings.sampling.subscribe(changeDataset);
    mainModel.settings.color.subscribe(changeDataset);
    mainModel.settings.title.subscribe(function () {
        d3.selectAll("text.title-text")
            .text(mainModel.settings.title());
    });
    forceUpdate = changeDataset;

}
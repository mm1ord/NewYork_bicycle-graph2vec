let cluster = getcluster("../data/step4.csv");
let clusterdata=getclusterdata("2021-09-01");


let minflow = 50;
let maxflow = 1000;

let max;

let color_index = 1;

let win = {
    "title": "",
    "message": ""
};

let opts = {
    width: 300,
    height: 200
};

let map_right;
GetMap();

function changedate(e) {
    date = e;
    clusterdata = getclusterdata(date);
    GetMap();
}

function changeminflow(e) {
    minflow = e;
    GetMap();
}

function getcluster(path) {
    let result;
    // @ts-ignore
    $.ajax({
        url: path,
        type: "GET",
        dataType: "json",
        async: false,
        success: function (data) {
            result = data;
        }
    });
    return result;
}

function getclusterdata(date) {
    let path = "../data/step63/" + date.replace("/", "-") + ".csv";
    let result;
    // @ts-ignore
    $.ajax({
        url: path,
        type: "GET",
        dataType: "json",
        async: false,
        success: function (data) {
            result = data;
        }
    });
    return result;
}

function GetMap() {
    CreatMap();
    addMapControl(map_right);
    draw();
    ColorScale(map_right);
}

function CreatMap() {
    // @ts-ignore
    map_right = new BMapGL.Map('container');
    // @ts-ignore
    map_right.centerAndZoom(new BMapGL.Point(-73.94597222222222222, 40.76035277777777778), 12);
    map_right.enableScrollWheelZoom(true);
    map_right.setMapStyleV2({
        styleId: 'e85c332d16734890af1d14a7a233beb0'
    });
}

function addMapControl(myMap) {
    // @ts-ignore
    let scaleControl = new BMapGL.ScaleControl({
        // @ts-ignore
        anchor: BMAP_ANCHOR_BOTTOM_LEFT
    });
    // @ts-ignore
    scaleControl.setUnit(BMAP_UNIT_IMPERIAL);
    // @ts-ignore
    myMap.addControl(scaleControl);
    // @ts-ignore
    let navControl = new BMapGL.NavigationControl({
        // @ts-ignore
        anchor: BMAP_ANCHOR_TOP_LEFT,
        type: 0
    });
    myMap.addControl(navControl);
}

function ColorScale(myMap) {
    let cr = new BMapGL.CopyrightControl({
        anchor: BMAP_ANCHOR_BOTTOM_RIGHT,
        offset: new BMapGL.Size(20, 20)
    }); //设置版权控件位置
    myMap.addControl(cr); //添加版权控件
    let bs = myMap.getBounds(); //返回地图可视区域
    cr.addCopyright({
        id: 1,
        content: '<div style="height:100px;width:50px;text-align: right;"><div style="height:100%;width:60%;position: relative;float: left;font-size:10px;"><div style="margin-top: 0;width: 100%;">' + maxflow + '</div><div style="position:absolute;bottom:0;width: 100%;">'+minflow+'</div></div><div style="height:100%;width:40%;background:-webkit-linear-gradient(bottom,#aed606,#fef804,#ff7b00,#db253e,#5b1875);flex: content;float: left;"></div></div>',
        bounds: bs
    });
}

function makepoint(lng, lat) {
    let myIcon = new BMapGL.Icon("../red.png", new BMapGL.Size(5, 5));
    let point = new BMapGL.Point(lng, lat);
    let marker = new BMapGL.Marker(point, {
        icon: myIcon
    });
    map_right.addOverlay(marker);
}

function draw() {
    let i;
    maxflow = Math.max.apply(Math, clusterdata.map(function (e) {
        return e.num; // 需要比较的值
    }));
    for (i = 0; i < clusterdata.length; ++i) {
        let ex = clusterdata[i];
        let from = {
            "longitude": cluster[ex.from].clongitude,
            "latitude": cluster[ex.from].clatitude
        }
        let to = {
            "longitude": cluster[ex.to].clongitude,
            "latitude": cluster[ex.to].clatitude
        }
        let fromsite = new BMapGL.Point(from.longitude, from.latitude);//起点
        let tosite = new BMapGL.Point(to.longitude, to.latitude);//终点
        let num = ex.num;
        if (num >= minflow) {//大于最小流量
            let weight = ((num - minflow) / (maxflow - minflow)).toFixed(2); //求权重
            if (ex.from != ex.to) {//起点和终点不同，化弧线
                let opt = { //弧线配置
                    strokeOpacity: 1,
                    strokeColor: getColor(weight, num), //根据权重取颜色
                    strokeWeight: getStrokeWeight(weight), //根据权重取弧线粗细大小
                };
                let curveline = new BMapLib.CurveLine([fromsite, tosite], opt);//构建弧线对象
                map_right.addOverlay(curveline); //增加弧线到地图上
                let temp_data = ex;//信息窗口显示需要的数据
                curveline.addEventListener("click", function (e) {//增加弧线点击事件
                    addCurvelineMarker(e.latLng, temp_data, map_right);
                });
                addArrow(curveline, opt, map_right);//绘制箭头
            } else {
                let point = new BMapGL.Point(from.longitude, from.latitude);//画点
                let circle = new BMapGL.Circle(point, getStrokeWeight(weight) * 20, {//画圆
                    strokeWeight: 0,
                    fillColor: getColor(weight, num),
                    fillOpacity: 1
                });
                map_right.addOverlay(circle);//添加到地图
                let temp_data = ex;
                addClickHandler(temp_data, circle, point);//添加事件
            }
        }
    }
    for (i = 0; i < 200; ++i) {
        let ex = cluster[i.toString()];
        makepoint(ex.clongitude, ex.clatitude);
    }
}

function addClickHandler(data, marker, point) {
    // @ts-ignore
    marker.addEventListener("click", function (e) {
        let title_message = "From: " + data.from + " --> To: " + data.to + "&nbsp;&nbsp;num: " + data.num;
        let message = "";
        for (let i = 0; i < data.trip.length; i++) {
            message += "from: " + data.trip[i].from + "&nbsp;to: " + data.trip[i].to + "&nbsp;&nbsp;num: " + data.trip[i].num + "<br>";
        }
        let newopts = opts;
        newopts.title = title_message;
        // @ts-ignore
        let infoWindow = new BMapGL.InfoWindow(message, newopts);
        map_right.openInfoWindow(infoWindow, point);
    });
}

function addCurvelineMarker(click_point, data, map_flow) {
    //重新创建经纬度坐标对象，防止覆盖
    // @ts-ignore
    let points = new BMapGL.Point(click_point.lng, click_point.lat);
    // @ts-ignore
    let title_message = "From: " + data.from + " --> To: " + data.to + "&nbsp;&nbsp;num: " + data.num;
    let message = "";
    for (let i = 0; i < data.trip.length; i++) {
        message += "from: " + data.trip[i].from + "&nbsp;to: " + data.trip[i].to + "&nbsp;&nbsp;num: " + data.trip[i].num + "<br>";
    }
    let newopts = opts;
    newopts.title = title_message;
    // @ts-ignore
    let infoWindow = new BMapGL.InfoWindow(message, newopts);
    map_flow.openInfoWindow(infoWindow, points);
}

function getColor(weight, num) { //求颜色插值
    if (color_index === 1) {
        if (weight <= 0.2) {
            // @ts-ignore
            const compute = d3.interpolateRgb('#6ab92c', '#aed606');
            return compute(weight * 5);
        } else if (weight <= 0.4) {
            // @ts-ignore
            const compute = d3.interpolateRgb('#aed606', '#fef804');
            return compute((weight - 0.2) * 5);
        } else if (weight <= 0.6) {
            // @ts-ignore
            const compute = d3.interpolateRgb('#fef804', '#ff7b00');
            return compute((weight - 0.4) * 5);
        } else if (weight <= 0.8) {
            // @ts-ignore
            const compute = d3.interpolateRgb('#ff7b00', '#db253e');
            return compute((weight - 0.6) * 5);
        } else {
            // @ts-ignore
            const compute = d3.interpolateRgb('#db253e', '#5b1875');
            return compute((weight - 0.8) * 5);
        }
    } else {
        if (num <= 19) {
            return '#aed606';
        } else if (num <= 31) {
            return '#fef804';
        } else if (num <= 42) {
            return '#ff7b00';
        } else if (num <= 54) {
            return '#db253e';
        } else {
            return '#5b1875';
        }
    }
}

function getSize(weight) { //求颜色插值
    if (weight < 0.33) return "BMapGL_POINT_SIZE_NORMAL";
    else if (weight < 0.67) return "BMapGL_POINT_SIZE_BIG";
    else return "BMapGL_POINT_SIZE_BIGGER";
}


function getStrokeWeight(weight) { //求粗细大小
    const Max = 6; //固定最大值为 10
    // return 1+Math.round(weight*Max);
    return 1 + weight * Max;
}

function getCircleStrokeWeight(weight) { //求粗细大小
    const Max = 10;
    return 1 + Math.round(weight * Max);
}

function getStrokeOpacity(weight) { //求透明度
    const Max = 1; //固定最大值为 1
    return weight * Max;
}

function addArrow(lines, line_style, myMap) {
    let angleValue = Math.PI / 7;
    let linePoint = lines.getPath();
    let arrowCount = linePoint.length;
    let delta_x = myMap.pointToPixel(linePoint[(arrowCount - 1).toString()])["x"] - myMap.pointToPixel(linePoint["0"])["x"];
    let delta_y = myMap.pointToPixel(linePoint[(arrowCount - 1).toString()])["y"] - myMap.pointToPixel(linePoint["0"])["y"];
    let length = Math.sqrt(delta_x * delta_x + delta_y * delta_y) / 8;
    let middle = arrowCount / 2;
    let pixelStart = myMap.pointToPixel(linePoint[Math.floor(middle - 2)]);
    let pixelEnd = myMap.pointToPixel(linePoint[Math.ceil(middle)]);
    let angle = angleValue;
    let r = length;
    let delta = 0;
    let param = 0;
    let pixelTemX, pixelTemY;
    let pixelX, pixelY, pixelX1, pixelY1;
    pixelTemX = pixelStart.x;
    pixelTemY = pixelStart.y;
    if (Math.abs(delta_y) < 0.1) {
        pixelY = pixelTemY - r * Math.tan(angle);
        pixelY1 = pixelTemY + r * Math.tan(angle);
        pixelX = pixelX1 = pixelTemX;
    } else if (Math.abs(delta_x) < 0.1) {
        pixelX = pixelTemX - r * Math.tan(angle);
        pixelX1 = pixelTemX + r * Math.tan(angle);
        pixelY = pixelY1 = pixelTemY;
    } else {
        delta = delta_y / delta_x;
        param = Math.sqrt(delta * delta + 1);
        if (delta_x < 0) {
            pixelTemX = pixelEnd.x + r / param;
            pixelTemY = pixelEnd.y + delta * r / param;
        } else {
            pixelTemX = pixelEnd.x - r / param;
            pixelTemY = pixelEnd.y - delta * r / param;
        }
        pixelX = pixelTemX + Math.tan(angle) * r * delta / param;
        pixelY = pixelTemY - Math.tan(angle) * r / param;
        pixelX1 = pixelTemX - Math.tan(angle) * r * delta / param;
        pixelY1 = pixelTemY + Math.tan(angle) * r / param;
    }
    // @ts-ignore
    let pointArrow = myMap.pixelToPoint(new BMapGL.Pixel(pixelX, pixelY));
    // @ts-ignore
    let pointArrow1 = myMap.pixelToPoint(new BMapGL.Pixel(pixelX1, pixelY1));
    // @ts-ignore
    let Arrow = new BMapGL.Polyline([pointArrow, linePoint[Math.floor(middle)], pointArrow1], line_style);
    myMap.addOverlay(Arrow);
}
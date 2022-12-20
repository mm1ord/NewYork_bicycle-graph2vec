var sitedata = getdata("../data/step2.csv");//加载数据
var map = new BMapGL.Map('container');//创建地图
map.centerAndZoom(new BMapGL.Point(-73.94597222222222222, 40.76035277777777778), 12);//地图中心设置
map.enableScrollWheelZoom(true);//地图属性设置
var myIcon = new BMapGL.Icon("../picture/red.png", new BMapGL.Size(10, 10));//图表ICON设置（调用图片）
var opts = { //信息窗口设置
    width: 300, 
    height: 0 
};
for (var i = 0; i < sitedata.length; i++) {//站点数据绘制点
    var point = new BMapGL.Point(sitedata[i][2], sitedata[i][3])
    var marker = new BMapGL.Marker(point, {
        icon: myIcon
    });
    map.addOverlay(marker);//添加到地图
    var content = "站点名称:" + sitedata[i][0] + ",站点Id:" + sitedata[i][1] + ",经纬度:" + sitedata[i][2] + "&nbsp;&nbsp;&nbsp;" + sitedata[i][3]
    addClickHandler(content, marker, point);//点击打开信息窗口事件
}

function addClickHandler(content, marker, point) {
    marker.addEventListener("click", function (e) {//点击事件函数
        var contents = content.split(",");//信息窗口内容
        opts.title = contents[0] + "&nbsp;&nbsp;&nbsp;";//信息窗口标题
        var message = contents[1] + "<br>" + contents[2];
        var infoWindow = new BMapGL.InfoWindow(message, opts); //定义信息窗口
        map.openInfoWindow(infoWindow, point);//打开窗口 
    });
}

function datachange(data) {//数据处理
    var result=[];
    var kdata = data.split("\r\n");
    for(var i=1;i<kdata.length;++i){
        result[i-1]=kdata[i].split(",");
        result[i-1][2]=eval(result[i-1][2]);
        result[i-1][3]=eval(result[i-1][3]);
        result[i-1][4]=eval(result[i-1][4]);
    }
    // console.log(result);
    return result;
}

function getdata(path) {//数据加载
    // @ts-ignore
    var result;
    // @ts-ignore
    var data = $.ajax({
        url: path,
        type: "GET",
        dataType: "csv",
        async: false,
    })
    // console.log(data);
    return datachange(data.responseText);
}
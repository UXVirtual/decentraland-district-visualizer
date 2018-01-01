var yx = L.latLng;

var xy = function(x, y) {
    if (L.Util.isArray(x)) {    // When doing xy([x, y]);
        return yx(x[1], x[0]);
    }
    return yx(y, x);  // When doing xy(x, y);
};

$( document ).ready(function() {
    var map = L.map('map', {
        minZoom: -5,
        crs: L.CRS.Simple
    });

    map.setView( xy(50,50),5); //set to center position and default zoom



    /*var southWest = map.unproject([0, 3600], map.getMaxZoom());
    var northEast = map.unproject([3600, 0], map.getMaxZoom());
    map.setMaxBounds(new L.LatLngBounds(southWest, northEast));*/

    var bounds = [[0,0], [100,100]]; //scale of map in game units
    var image = L.imageOverlay('assets/img/map-proposal-100-percent-scale.png', bounds).addTo(map);

    //var pyramid = xy(50, 50);

   // L.marker(pyramid).addTo(map).bindPopup('Pyramid Nightclub');

    /*var map = L.map('map',{
        center: [43.035,101.02],
        zoom: 3,
        fullscreenControl: true,
        crs: L.CRS.Simple
    });

    L.tileLayer('http://mavvo.altervista.org/dofus/mapTiles/{z}/{x}/{y}.png', {
        minZoom: 2,
        maxZoom: 6,
        continuousWorld: false,
        noWrap: true,
        tms: true
    }).addTo(map);

    //Bounds
    var southWest = map.unproject([0, -7654], map.getMaxZoom());
    var northEast = map.unproject([+9431, 0], map.getMaxZoom());
    map.setMaxBounds(new L.LatLngBounds(southWest, northEast));*/
});
window.apiKey = "WGvRagTfl0dzKfXcMbxhr1HEEwvWl0HZN76PRiJAhzk";
var platform = new H.service.Platform({
  apikey: window.apiKey
});

var defaultLayers = platform.createDefaultLayers();
var map = new H.Map(document.getElementById('map'),
  defaultLayers.vector.normal.map,{
  center: {lat:50, lng:5},
  zoom: 4,
  pixelRatio: window.devicePixelRatio || 1
});
window.addEventListener('resize', () => map.getViewPort().resize());
var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
var ui = H.ui.UI.createDefault(map, defaultLayers);

function moveMapToPlace(position){
  map.setCenter(position);
  map.setZoom(14);
}

const drawMultiline = (locations,intersect) => {
var linestring = new H.geo.LineString();
locations.forEach(function(point) {
linestring.pushPoint(intersect);
  linestring.pushPoint(point);
});
var polyline = new H.map.Polyline(linestring, { style: { lineWidth: 10 }});
map.addObject(polyline);
}

const drawPin = (position, color) => {
const latitude = round(position.lat,5);
const longitude = round(position.lng,5);

var svg = `<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="FILL_COLOR" opacity=".8"/>
    <circle cx="50" cy="50" r="4" fill="black"/>
    </svg>`,
    size = {w: 30, h: 30},
    // we need to specify the correct hit area as the default one for custom icon is rectangular shape
    hitArea = new H.map.HitArea(H.map.HitArea.ShapeType.CIRCLE, [size.w/2, size.h/2, size.w/2]),
    icon = new H.map.Icon(
      svg.replace('FILL_COLOR', color),
      {
        size,
        anchor: {x: size.w/2, y: size.h/2},
        hitArea
      }
    ),
    iconHover = new H.map.Icon(
      svg.replace('FILL_COLOR', 'rgb(30, 200, 200'),
      {
        size,
        anchor: {x: size.w/2, y: size.h/2},
        hitArea
      }
    ),
    marker = new H.map.Marker(position, {
      icon: icon,
      volatility: true
    });

marker.addEventListener('pointerenter', function(e) {
  marker.setIcon(iconHover);
});

marker.addEventListener('pointerleave', function(e) {
  marker.setIcon(icon);
});

map.addObject(marker);
}

const round = (num, decimalPlaces = 0) => {
    var p = Math.pow(10, decimalPlaces);
    return Math.round(num * p) / p;
}

const setView = (markers,percentageMargin) =>
{
    var bottomLeftLat = null, bottomLeftLng = null;
    var topRightLat = null, topRightLng = null;
    if(markers[0] != null)
    {   //Initialise
        bottomLeftLat = markers[0].lat;
        topRightLat = bottomLeftLat;
        bottomLeftLng = markers[0].lng;
        topRightLng = bottomLeftLng;
    }
    for(i=1; markers[i] != null; i++)
    {
        if(markers[i].lat < bottomLeftLat)
            bottomLeftLat = markers[i].lat;
        if(markers[i].lat > topRightLat)
            topRightLat = markers[i].lat;
        if(markers[i].lng < bottomLeftLng)
            bottomLeftLng = markers[i].lng;
        if(markers[i].lng > topRightLng)
            topRightLng = markers[i].lng;
    }
    var LatDifference = topRightLat - bottomLeftLat;
    var LngDifference = topRightLng - bottomLeftLng;

    topRightLat += LatDifference*percentageMargin/200;
    bottomLeftLat -= LatDifference*percentageMargin/200;
    topRightLng += LngDifference*percentageMargin/200;
    bottomLeftLng -= LngDifference*percentageMargin/200;

    var bottomLeftMarker = new H.map.Marker({lat:bottomLeftLat, lng:bottomLeftLng});
    var topRightMarker = new H.map.Marker({lat:topRightLat, lng:topRightLng});
    var viewPortGroup = new H.map.Group();
    viewPortGroup.addObjects([bottomLeftMarker, topRightMarker]);
    map.getViewModel().setLookAtData({
        bounds: viewPortGroup.getBoundingBox() });
}

const pythag = (a,b) => Math.sqrt(a * a + b * b)
const rad2deg = rad => rad * 180 / Math.PI
const deg2rad = deg => deg * Math.PI / 180
const atan2 = (y,x) => rad2deg(Math.atan2(y,x))
const cos = x => Math.cos(deg2rad(x))
const sin = x => Math.sin(deg2rad(x))

// Point
const Point = (x,y) => ({
  x,
  y,
  add: ({x: x2, y: y2}) =>
    Point(x + x2, y + y2),
  sub: ({x: x2, y: y2}) =>
    Point(x - x2, y - y2),
  bind: f =>
    f(x,y),
  inspect: () =>
    `Point(${x}, ${y})`
})

Point.origin = Point(0,0)
Point.fromVector = ({a,m}) => Point(m * cos(a), m * sin(a))

// Vector
const Vector = (a,m) => ({
  a,
  m,
  scale: x =>
    Vector(a, m*x),
  add: v =>
    Vector.fromPoint(Point.fromVector(Vector(a,m)).add(Point.fromVector(v))),
  inspect: () =>
    `Vector(${a}, ${m})`
})

Vector.zero = Vector(0,0)
Vector.unitFromPoint = ({x,y}) => Vector(atan2(y,x), 1)
Vector.fromPoint = ({x,y}) => Vector(atan2(y,x), pythag(x,y))

// calc unweighted midpoint
const calcMidpoint = points => {
  let count = points.length;
  let midpoint = points.reduce((acc, [point, _]) => acc.add(point), Point.origin)
  return midpoint.bind((x,y) => Point(x/count, y/count))
}

// calc weighted point
const calcWeightedMidpoint = points => {
  let midpoint = calcMidpoint(points)
  let totalWeight = points.reduce((acc, [_, weight]) => acc + weight, 0)
  let vectorSum = points.reduce((acc, [point, weight]) =>
    acc.add(Vector.fromPoint(point.sub(midpoint)).scale(weight/totalWeight)), Vector.zero)
    const resultPoint = Point.fromVector(vectorSum).add(midpoint);
  return {lat: resultPoint.x, lng:resultPoint.y};
}

const showOnMap = (data) =>{
moveMapToPlace(data.items[0].position);
}

var coordinates = [];
var points = [];
const pushCoordinate=(data, index)=>{
  coordinates.push(data.items[0].position);
  const weight = parseInt(document.getElementById("weight").value);
  points.push([Point(data.items[0].position.lat,data.items[0].position.lng),weight,data.items[0].title]);
  document.getElementById('places').innerHTML = "";
  points.forEach(showPlace);
  document.getElementById("weight").value="";
  document.getElementById("place").value="";
 }

 const addNew = () => {
  findPlace();
 }

 const showPlace = ([point,weight,title])=>{
 var place = document.createElement('div');
  place.textContent= "Lived in "+title +" for " +weight +" years";
  document.getElementById('places').appendChild(place);
 }

const findPlace = (index) => {
const place = document.getElementById("place").value;
const apiUrl = 'https://geocode.search.hereapi.com/v1/geocode?q='+ place +'&apiKey=WGvRagTfl0dzKfXcMbxhr1HEEwvWl0HZN76PRiJAhzk';

// Make a GET request
fetch(apiUrl)
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    drawPin(data.items[0].position, "green");
    showOnMap(data);
    pushCoordinate(data, index);
  })
  .catch(error => console.error('Error:', error));
}

const draw = () => {
    const intersectPoint = calcWeightedMidpoint(points);
    drawMultiline(coordinates,intersectPoint);
    drawPin(intersectPoint, "red");
    setView(coordinates,5)
      document.getElementById("weight").value="";
      document.getElementById("place").value="";
      document.getElementById('places').innerHTML = "";
      coordinates=[];
      points=[];

}
window.apiKey = "yb5fqYCdrXaZnUsGkv11Dxr5GGV6OYxGbXs_ZYbveDk";
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

const calcMidpoint = points => {
  let count = points.length;
  let midpoint = points.reduce((acc, [point, _]) => acc.add(point), Point.origin)
  return midpoint.bind((x,y) => Point(x/count, y/count))
}

const calcWeightedMidpoint = points => {
  let midpoint = calcMidpoint(points)
  let totalWeight = points.reduce((acc, [_, weight]) => acc + weight, 0)
  let vectorSum = points.reduce((acc, [point, weight]) =>
  acc.add(Vector.fromPoint(point.sub(midpoint)).scale(weight/totalWeight)), Vector.zero)
  const resultPoint = Point.fromVector(vectorSum).add(midpoint);
  return {lat: resultPoint.x, lng:resultPoint.y};
}

var points = [];
const pushCoordinate=(position, title)=>{
  const weight = parseInt(document.getElementById("weight").value);
  points.push([Point(position.lat,position.lng),weight,title]);
  points.forEach(createTag);
  document.getElementById("weight").value="";
  document.getElementById("place").value="";
}

const addNew = (next) => {
  const placeId = document.getElementById("placeId").value;
  if(placeId){
    lookup(placeId, next);
  }
}

const lookup = (id, next) => {
  if(id.length>0){
    const apiUrl = 'https://autocomplete.search.hereapi.com/v1/lookup?id='+ id +'&apiKey='+window.apiKey +'&lang=en';
    fetch(apiUrl)
      .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
      .then(data => {
      drawPin(data.position, "green");
      moveMapToPlace(data.position);
      pushCoordinate(data.position, data.title);
      if (typeof next === 'function') {
        next();
      }
    })
      .catch(error => console.error('Error:', error));
  }
}

const drawWithAdd = () =>{
  addNew(draw);
}

const draw = () => {
  var coordinates=[];
  map.removeObjects(map.getObjects());
  points.forEach(p=>{
    coordinates.push({lat:p[0].x,lng:p[0].y});
  });
  if(coordinates.length>1){
    coordinates.forEach(c=>{
      drawPin(c, "green");
    });
    const intersectPoint = calcWeightedMidpoint(points);
    drawMultiline(coordinates,intersectPoint);
    drawPin(intersectPoint, "red");
    setView(coordinates,5)
    document.getElementById("weight").value="";
    document.getElementById("place").value="";
  }
}

const autocomplete = (inp,inpId) => {
  var currentFocus;
  inp.addEventListener("input", function(e) {
    var a, b, val = this.value;
    if(val.length > 2){
      closeAllLists();
      if (!val) { return false;}
      currentFocus = -1;
      a = document.createElement("DIV");
      a.setAttribute("id", this.id + "autocomplete-list");
      a.setAttribute("class", "autocomplete-items");
      this.parentNode.appendChild(a);
      const apiUrl = 'https://autocomplete.search.hereapi.com/v1/autocomplete?limit=3&q='+ val +'&apiKey='+window.apiKey;
      fetch(apiUrl)
        .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
        .then(data => {
        drawAutocompleteList(data,val, inp, a, b, inpId);
      })
        .catch(error => console.error('Error:', error));
    }
  });

  const drawAutocompleteList = (arr, val, inp, a, b, inpId) =>{
    var i;
    for (i = 0; i < arr.items.length; i++) {
      b = document.createElement("DIV");
      b.innerHTML = arr.items[i].title;
      b.innerHTML += "<input type='hidden' value='" + arr.items[i].title + "'/>";
      b.innerHTML += "<input type='hidden' value='" + arr.items[i].id + "'/>";
      b.addEventListener("click", function(e) {
        inp.value = this.getElementsByTagName("input")[0].value;
        inpId.value=this.getElementsByTagName("input")[1].value;
        closeAllLists();
      });
      a.appendChild(b);
    }
  }
  inp.addEventListener("keydown", function(e) {
    var x = document.getElementById(this.id + "autocomplete-list");
    if (x) x = x.getElementsByTagName("div");
    if (e.keyCode == 40) {
      currentFocus++;
      addActive(x);
    } else if (e.keyCode == 38) {
      currentFocus--;
      addActive(x);
    } else if (e.keyCode == 13) {
      e.preventDefault();
      if (currentFocus > -1) {
        if (x) x[currentFocus].click();
      }
    }
  });

  const addActive = (x) => {
    if (!x) return false;
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    x[currentFocus].classList.add("autocomplete-active");
  }
  const removeActive = (x) => {
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  const closeAllLists = (elmnt) => {
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }

  document.addEventListener("click", function (e) {
    closeAllLists(e.target);
  });
}

const ul = document.querySelector("ul");

const createTag = () => {
  const ul = document.querySelector("ul")
  ul.querySelectorAll("li").forEach(li => li.remove());
  points.slice().reverse().forEach(tag =>{
    const cityName = tag[2].split(",")[0];
    const liTag = `<li>${cityName} -> ${tag[1]}<i class="uit uit-multiply" onclick="remove(this, '${tag[2]}')"></i></li>`;
    ul.insertAdjacentHTML("afterbegin", liTag);
  });
}

const remove = (element, name) => {
  var newPoints = [];
  points.forEach(p=>{
    if(name!==p[2]) newPoints.push(p);
  });
  points = newPoints;
  element.parentElement.remove();
}

const removeAll = (e) => {
  ul.querySelectorAll("li").forEach(li => li.remove());
  map.removeObjects(map.getObjects());
  points=[];
}

const checkEnterWeight = (e, nextId) => {
  if(e.key == "Enter"){
    if(document.getElementById("weight").value){
      drawWithAdd();
      document.getElementById("place").focus();
    }
    else{
      alert("You must add an integer number of years to proceed")
    }
  }
}
const checkEnterPlace = (e) => {
  if(e.key == "Enter"){
    document.getElementById("weight").focus();
  }
}

const initPage=()=>{
  document.getElementById("place").addEventListener("keyup", checkEnterPlace);
  document.getElementById("weight").addEventListener("keyup", checkEnterWeight);
  autocomplete(document.getElementById("place"),document.getElementById("placeId"));
}

initPage();


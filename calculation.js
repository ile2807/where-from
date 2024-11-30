// math
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


// data
const data = [
  [Point(50,50), 100],
  [Point(200,50), 10],
  [Point(200,200), 30],
  [Point(150,150), 40],
  [Point(50,200), 80],
]

// calc unweighted midpoint
const calcMidpoint = points => {
  let count = points.length;
  let midpoint = points.reduce((acc, [point, _]) => acc.add(point), Point.origin)
  return midpoint.bind((x,y) => Point(x/count, y/count))
}

const drawPoints = points => {
  var canvas = document.getElementById("myCanvas")
    if (canvas.getContext) {
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(points[0][0].x, points[0][0].y)
        for(item = 1; item < points.length; item++){
        	ctx.lineTo( points[item][0].x , points[item][0].y )
        }
      ctx.closePath()
      ctx.stroke()
    }
}

const drawResultPoint = point => {
  var canvas = document.getElementById("myCanvas")
    if (canvas.getContext) {
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = '#f00';
      ctx.beginPath();
        ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI, true);
        ctx.fill();
    }
}

// calc weighted point
const calcWeightedMidpoint = points => {
  drawPoints(points)
  let midpoint = calcMidpoint(points)
  let totalWeight = points.reduce((acc, [_, weight]) => acc + weight, 0)
  let vectorSum = points.reduce((acc, [point, weight]) =>
    acc.add(Vector.fromPoint(point.sub(midpoint)).scale(weight/totalWeight)), Vector.zero)
    const resultPoint = Point.fromVector(vectorSum).add(midpoint);
  drawResultPoint(resultPoint)
  return resultPoint
}

function execute(){
  console.log(calcWeightedMidpoint(data))
}
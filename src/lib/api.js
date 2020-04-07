export function getAngleAtXy(x, y) {
  return Math.atan2(y, x)
}

export function createNodeAtXy({ x, y, center, ...props }) {
  const p = {
    x,
    y
  }
  const angle = getAngleAtXy(p.x, p.y)
  var degrees = (180 * angle) / Math.PI
  console.log({
    angle,
    px: p.x,
    py: p.y,
    pct: (360 + Math.round(degrees)) % 360
  })
  return createNodeAtAngle({ angle, center, ...props })
}

export function createNodeAtAngle({ angle, r, center, dist, ...props }) {
  const centroid = Math.floor(angle * (Math.PI * 2)) / (Math.PI * 2)

  const cx =
    center.x +
    (Math.cos(centroid) * ((Math.random() * 0.75 + 1) * dist + r / 2) - r / 2) +
    Math.random()

  const cy =
    center.y +
    (Math.sin(centroid) * ((Math.random() * 0.75 + 1) * dist + r / 2) - r / 2) +
    Math.random()

  return createNode({
    cx: cx,
    cy: cy,
    ox: cx,
    oy: cy,
    centroid: centroid.toFixed(2),
    angle,
    r
  })
}

export function createNode({ cx, cy, centroid, r, parent, ...props }) {
  return {
    cx,
    cy,
    ox: cx,
    oy: cy,
    centroid,
    r,
    or: r,
    parent,
    hoverScale: 1,
    ...props
  }
}

export function distance(x1, y1, x2, y2) {
  const dx = x1 - x2
  const dy = y1 - y2
  return Math.sqrt(dy * dy + dx * dx)
}

export function createRootNode(center, radius) {
  return createNode({
    cx: center.x,
    cy: center.y,
    fx: center.x,
    fy: center.y,
    centroid: 0,
    r: radius,
    id: 0,
    fixed: true,
    root: true
  })
}

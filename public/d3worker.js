/* eslint-disable */
importScripts("https://d3js.org/d3.v5.min.js")

var simulation = d3
  .forceSimulation()
  //.force('charge', d3.forceManyBody().strength(2))
  .force(
    "x",
    d3.forceX(function(d, i) {
      return d.cx
    })
  )
  .force(
    "y",
    d3.forceY(function(d, i) {
      return d.cy
    })
  )
  .force(
    "collide",
    d3
      .forceCollide()
      .radius(function(d) {
        return d.r
      })
      //.iterations(4)
      //.strength(0.07)
  )
  .stop()

onmessage = function(e) {
  var nodes = e.data.nodes

  simulation.nodes(nodes)
  simulation.alpha(1)

  // partition
  var nodesPerPartition = 250
  var partitionsCount = Math.round(nodes.length/nodesPerPartition)
  //TODO...

  for (
    var i = 0,
      n = Math.ceil(
        Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())
      );
    i < n;
    ++i
  ) {
    simulation.tick()
  }

  postMessage({ nodes: simulation.nodes(), type: "setMany" })
}

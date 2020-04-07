import React, { useRef, useCallback, useEffect, useMemo, Suspense } from "react"
import { Canvas } from "react-three-fiber"
import { Color, Uncharted2ToneMapping } from "three"
import useDimensions from "react-use-dimensions"
import { useSimulation } from "../lib"
import { createNodeAtXy, createRootNode } from "../lib/api"
import ThreeRenderer from "./ThreeRenderer"
import { scaleLog, scalePow, scaleTime, scaleSqrt } from "d3"
import Effects from "./Effects"
import { Text } from "./Text"

function createNode(x, y, r, center, dist) {
  return createNodeAtXy({ x, y, r, center, dist })
}

function max(arr, key) {
  return Math.max(...arr.map(d => d[key]))
}

function min(arr, key) {
  return Math.min(...arr.map(d => d[key]))
}

async function delay(t) {
  await new Promise(resolve => setTimeout(() => resolve(), t))
}

function DataViz(data) {
  // flatten data structure
  const flatten = Object.keys(data).reduce((a, b) => {
    return [
      ...a,
      ...data[b].map(d => ({ ...d, country: b, date: new Date(d.date) }))
    ]
  }, [])

  console.log({ flatten })

  const makeViz = (
    data,
    {
      country = "Italy",
      groupBy = false,
      maxRadius = 128,
      metric = "confirmed",
      relative = true
    } = {}
  ) => {
    const filtered = data.slice(0, 150) //.filter(d => d.country === country)
    const extents = getExtents(relative ? filtered : flatten)

    const radiusScale = scaleSqrt()
      .domain([extents[metric].min, extents[metric].max])
      .range([5, 128])

    const timeScale = scaleTime()
      .domain([extents.date.min, extents.date.max])
      .range([50, window.innerWidth - 50])

    return filtered.map((d, i) => {
      const cx = Math.random() * window.innerWidth
      const cy = (Math.random() * window.innerHeight) / 2
      const r = radiusScale(d[metric])
      return {
        ...d,
        r,
        ox: cx,
        oy: cy,
        oR: r,
        hoverScale: 1 + Math.pow(1 - r / 128, 5),
        cx,
        cy
      }
    })
  }

  const getExtents = data => {
    return {
      confirmed: { max: max(data, "confirmed"), min: min(data, "confirmed") },
      deaths: { max: max(data, "deaths"), min: min(data, "deaths") },
      recovered: { max: max(data, "recovered"), min: min(data, "recovered") },
      date: { max: max(data, "date"), min: min(data, "date") }
    }
  }

  return {
    all: flatten,
    makeViz
  }
}

export default function Simulation() {
  const [nodes, addNode, updateSimulation, setNodes] = useSimulation()
  const [domRef, { width, height }] = useDimensions()

  const center = { x: width / 2, y: height / 2 }
  const rootRadius = Math.min(width * 0.35, 240)

  const prevRootRadius = useRef()

  const data = useRef()

  useEffect(() => {
    async function req() {
      const res = await fetch("/timeseries.json")
      const json = await res.json()
      data.current = new DataViz(json)

      const nodes = data.current
        .makeViz(data.current.all)
        .sort((a, b) => a.r - b.r)

      updateSimulation(nodes)
    }
    req()
  }, [updateSimulation, setNodes])

  useMemo(() => {
    prevRootRadius.current = rootRadius
  }, [rootRadius])

  // click
  const onNodeClick = useCallback(
    node => {
      const country = node.country
      const filtered = nodes.filter(d => d.country === country)
      const angle = Math.atan2(node.y, node.x)

      const translateRoot = {
        x: Math.cos(angle) * 100,
        y: Math.sin(angle) * 100
      }

      const related = nodes.map((d, i) => {
        const isSelected = d.index === node.index
        const isSiblingOfSelected = filtered.indexOf(d) > -1
        const isRoot = d.root === true

        const updated = {
          ...d,
          cx: isSiblingOfSelected ? width / 2 : d.ox,
          cy: isSiblingOfSelected ? height / 2 : d.oy
          //   cy: d.cy + 50 * dist
        }

        // distance of node from center
        const dx = 0.5 - updated.cx / width
        const dy = 0.5 - updated.cy / height
        const dist = Math.sqrt(dy * dy + dx * dx)
        const scaledRadius = (1 - dist) * (d.oR || d.r)

        //const neighbours = data.filter(n => n.centroid === d.centroid)
        const newAngle = Math.atan2(translateRoot.y, translateRoot.x)

        updated.r = scaledRadius //(1.0 - dist) * 2.25 * d.r,

        if (isSelected) {
          updated.cx = width / 2
          updated.cy = height / 2
          updated.fx = updated.cx
          updated.fy = updated.cy
          updated.fixed = true
          updated.oR = updated.r
          updated.r = 128
          updated.root = true
        }

        if (isRoot) {
          updated.root = false
          updated.r = updated.oR
          delete updated.fx
          delete updated.fy
          updated.fixed = false
        }

        return updated
      })

      console.log({ related })
      updateSimulation(related)
    },
    [nodes, updateSimulation, width, height]
  )

  console.log({ nodes })

  // resize
  const onResize = useCallback(() => {
    const scaled = nodes.map(node => {
      const nodeDraft = {
        ...node,
        r: (node.r / node.rootRadius) * rootRadius,
        cx: center.x + Math.cos(node.centroid) * 1.5 * rootRadius,
        cy: center.y + Math.sin(node.centroid) * 1.5 * rootRadius,
        rootRadius
      }

      if (node.index === 0) {
        nodeDraft.fx = width / 2
        nodeDraft.fy = height / 2
      }
      return nodeDraft
    })
    updateSimulation(scaled)
  }, [nodes, rootRadius, updateSimulation, center, height, width])

  useEffect(() => {
    window.addEventListener("resize", onResize)

    return () => {
      window.removeEventListener("resize", onResize)
    }
  }, [onResize])

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      }}
      ref={domRef}
      //onClick={onCanvasClick}
    >
      <Canvas
        orthographic
        gl={{ antialias: false, alpha: false }}
        //camera={{ fov: 100, position: [0, 0, 600] }}
        onCreated={({ gl }) => {
          gl.toneMapping = Uncharted2ToneMapping
          gl.setClearColor(new Color("black"))
        }}
      >
        <ThreeRenderer
          nodes={nodes}
          maxNodes={5000}
          onClickNode={onNodeClick}
        />
        {/* <Effects /> */}
      </Canvas>
    </div>
  )
}

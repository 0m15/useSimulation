import React, { useRef, useCallback, useEffect, useMemo } from "react"
import { Canvas } from "react-three-fiber"
import { Color, Uncharted2ToneMapping } from "three"
import useDimensions from "react-use-dimensions"
import { useSimulation } from "../lib"
import { createNodeAtXy, createRootNode, distance } from "../lib/api"
import ThreeRenderer from "./ThreeRenderer"

function createNode(x, y, r, center, dist) {
  return createNodeAtXy({ x, y, r, center, dist })
}

export default function Simulation() {
  const [nodes, add, updateSimulation] = useSimulation()
  const [domRef, { width, height }] = useDimensions()

  const measures = {
    x: width / 2,
    y: height / 2,
    radius: width < height ? width * 0.25 : height * 0.25
  }

  const rootRadius = measures.radius
  const depth = useRef(1)

  // click
  const onCanvasClick = useCallback(
    evt => {
      const p = {
        x: evt.clientX - measures.x,
        y: evt.clientY - measures.y
      }

      let node

      // root node
      if (!nodes.length) {
        node = createRootNode(measures, rootRadius)
      } else {
        node = createNode(
          p.x,
          p.y,
          Math.max(5, Math.random() * (0.25 + 0.125) * rootRadius),
          measures,
          rootRadius
        )
      }

      add(node)
    },
    [add, nodes, measures, rootRadius]
  )

  // click node
  const onClickNode = useCallback(
    nodeClicked => {
      const siblings = nodes.filter(d => d.centroid === nodeClicked.centroid)

      //   if (nodeClicked.id !== 0) {
      //     depth.current+=1
      //   } else if(node)

      const related = nodes.map((_, i) => {
        const node = Object.assign(_, {}, {})
        const isSelected = node.index === nodeClicked.index
        const isSiblingOfSelected = siblings.indexOf(node) > -1
        const isRoot = node.root === true

        // distance of nodeClicked from selected nodeClicked
        const dist = distance(
          nodeClicked.x / width,
          nodeClicked.y / height,
          node.x / width,
          node.y / height
        )
        const scaledRadius = Math.pow(1 + 0.15 - dist, 5) * node.or
        const scaledRootRadius = rootRadius * 0.5 //(1 - dist) * rootRadius

        const rootTranslation = {
          x:
            measures.x -
            Math.cos(nodeClicked.centroid) *
              (1.5 * rootRadius + scaledRootRadius),
          y:
            measures.y -
            Math.sin(nodeClicked.centroid) *
              (1.5 * rootRadius + scaledRootRadius)
        }

        // root
        if (isRoot) {
          console.log({ root: node })

          delete node.fx
          delete node.fy

          return {
            ...node,
            root: false,
            fixed: false,
            centroid: Math.atan2(rootTranslation.y, rootTranslation.x),
            angle: Math.atan2(rootTranslation.y, rootTranslation.x),
            cx: rootTranslation.x,
            cy: rootTranslation.y,
            r: scaledRootRadius
          }
        }

        // selected
        if (isSelected) {
          return {
            ...node,
            root: true,
            fixed: true,
            fx: measures.x,
            fy: measures.y,
            r: rootRadius
          }
        }

        // siblings
        if (isSiblingOfSelected) {
          console.log({ cid: node.centroid })

          const a = Math.atan2(node.y - node.cy, node.x - node.cx)

          return {
            ...node,
            r: scaledRadius,
            cx: width / 2 + Math.cos(a) * rootRadius,
            cy: height / 2 + Math.cos(a) * rootRadius
          }
        }

        // root siblings
        return {
          ...node,
          r: scaledRadius,
          cx: rootTranslation.x + Math.cos(node.angle) * scaledRootRadius,
          cy: rootTranslation.y + Math.sin(node.angle) * scaledRootRadius
        }
      })

      console.log({ related })
      updateSimulation(related)
    },
    [nodes, updateSimulation, width, height]
  )

  // resize
  const onResize = useCallback(() => {
    const scaled = nodes.map(node => {
      const nodeDraft = {
        ...node,
        r: (node.r / node.rootRadius) * rootRadius,
        cx: measures.x + Math.cos(node.centroid) * 1.5 * rootRadius,
        cy: measures.y + Math.sin(node.centroid) * 1.5 * rootRadius,
        rootRadius,
        hoverScale: 1
      }

      if (node.index === 0) {
        nodeDraft.fx = width / 2
        nodeDraft.fy = height / 2
      }

      return nodeDraft
    })
    updateSimulation(scaled)
  }, [nodes, rootRadius, updateSimulation, measures, height, width])

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
      onClick={onCanvasClick}
    >
      <Canvas
        orthographic
        //gl={{ alpha: false }}
        camera={{ fov: 100, position: [0, 0, 150] }}
        onCreated={({ gl }) => {
          gl.toneMapping = Uncharted2ToneMapping
          gl.setClearColor(new Color("black"))
        }}
      >
        <ThreeRenderer
          nodes={nodes}
          maxNodes={1000}
          onClickNode={onClickNode}
        />
        {/* <Effects /> */}
      </Canvas>
    </div>
  )
}

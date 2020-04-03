import React, { useCallback, useEffect, useRef, useMemo, useState } from "react"
import { useCanvas, useFrame } from "react-three-fiber"
import * as THREE from "three"
import { CircleBufferGeometry } from "three"
import gsap from "gsap"

const dummy = new THREE.Object3D()

export default function ThreeRenderer({ nodes, onClickCanvas, simulation }) {
  useEffect(() => {
    document.addEventListener("click", onClickCanvas)
    return () => {
      document.removeEventListener("click", onClickCanvas)
    }
  }, [onClickCanvas])

  // Load async model
  const geometry = useMemo(() => {
    return new CircleBufferGeometry(32, 128)
  }, [])

  // When we're here it's loaded, now compute vertex normals
  useMemo(() => {
    geometry.computeVertexNormals()
    geometry.scale(0.5, 0.5, 0.5)
  }, [geometry])
  // Compute per-frame instance positions
  const ref = useRef()
  useFrame(state => {
    // ref.current.rotation.x = Math.sin(time / 4)
    // ref.current.rotation.y = Math.sin(time / 2)
    let x = 0
    let y = 0

    const nodes = simulation.nodes()

    for (let i = 0; i < 1000; i++) {
      if (nodes[i] !== undefined) {
        const d = Object.assign({}, nodes[i], {})

        x = (d.x+d.vx) - window.innerWidth / 2
        y = (d.y+d.vy) - window.innerHeight / 2

        // gsap.to(d, {
        //     x,
        //     y,
        //     duration: 0.25,
        //     onUpdate: () => {
        //         
        //     },
        // })
        dummy.position.set(x, y, 0)
        dummy.scale.set((d.r / 32) * 2, (d.r / 32) * 2, (d.r / 32) * 2)
        dummy.updateMatrix()
      }
      ref.current.setMatrixAt(i++, dummy.matrix)
    }
    ref.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[geometry, null, 1000]}>
      <meshNormalMaterial attach="material" />
    </instancedMesh>
  )
}

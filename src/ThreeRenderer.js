import React, { useCallback, useEffect, useRef, useMemo, useState } from "react"
import { useCanvas, useFrame } from "react-three-fiber"
import * as THREE from "three"
import { CircleBufferGeometry } from "three"
import lerp from "lerp"

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

  // compute vertex normals
  useMemo(() => {
    geometry.computeVertexNormals()
    geometry.scale(0.5, 0.5, 0.5)
  }, [geometry])

  const animations = useRef({})

  useEffect(() => {}, [nodes])

  // Compute per-frame instance positions
  const ref = useRef()

  useFrame((state, delta) => {
    let x = 0
    let y = 0

    for (let i = 0; i < 1000; i++) {
      if (nodes[i] !== undefined) {
        const d = Object.assign({}, nodes[i], {})

        x = d.x - window.innerWidth / 2
        y = d.y - window.innerHeight / 2


        if (!animations.current[d.id]) {
          animations.current[d.id] = {
            x: d.cx-window.innerWidth/2,
            y: d.cy-window.innerHeight/2,
            scale: 0.5
          }
        }

        const anim = animations.current[d.id]
        anim.x = lerp(anim.x, x, delta*2)
        anim.y = lerp(anim.y, y, delta*2)
        anim.scale = lerp(anim.scale, 1, delta*2)

        // if (anim.next.x < x) anim.next.x = lerp(anim.prev.x, x, t)
        // if (anim.next.y < y) anim.next.y = lerp(anim.prev.y, y, t)

        // gsap.to(d, {
        //     x,
        //     y,
        //     duration: 0.25,
        //     onUpdate: () => {
        //
        //     },
        // })

        dummy.position.set(anim.x, -anim.y, 0)
        dummy.scale.set(d.r/32*anim.scale*2, d.r/32*anim.scale*2, d.r/32*anim.scale*2)
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

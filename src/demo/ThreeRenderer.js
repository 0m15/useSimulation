import React, {
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
  Suspense
} from "react"
import { useFrame } from "react-three-fiber"
import * as THREE from "three"
import { CircleBufferGeometry } from "three"
import lerp from "lerp"
import image from "./gradient.jpg"
import { Text } from "./Text"

const Shader = {
  uniforms: {
    texture: {},
    textureDivision: { value: new THREE.Vector2(4, 4) },
    time: { value: 0 }
  },
  vertexShader: `
    precision highp float;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform float time;
    uniform vec2 textureDivision;

    attribute vec3 position;
    attribute vec4 translate;
    attribute vec2 uv;
    attribute vec2 instanceUv;

    varying vec2 vUv;
    varying float vScale;

    void main() {
        float scale = translate.w;
        vec4 mvPosition = modelViewMatrix * vec4( translate.xyz, 1.0 );
        vScale = scale;
        mvPosition.xyz += position*scale;

        vec2 slices = vec2(1.0) / textureDivision;
        vUv = slices * instanceUv + slices * uv;

        gl_Position = projectionMatrix * mvPosition;

    }
  `,
  fragmentShader: `
    precision highp float;
    uniform sampler2D texture;
    varying vec2 vUv;
    varying float vScale;
    void main() {
      vec4 sample = texture2D(texture, vUv);
      float grey = 0.21 * sample.r + 0.71 * sample.g + 0.07 * sample.b;

      gl_FragColor = vec4(grey*2.5, grey*2.5, grey*2.5, 1.0);
      //gl_FragColor = vec4(1.0, 0.0,0.0, 1.0);
    }
  `,
  depthTest: true,
  depthWrite: true
}

export default function ThreeRenderer({
  nodes,
  onClickCanvas,
  onClickNode,
  maxNodes = 1000
}) {
  // Interaction
  const [selectedNode, setSelectedNode] = useState(undefined)
  const previous = useRef()
  const active = useRef({})

  useEffect(() => {
    previous.current = selectedNode
  }, [selectedNode])

  // Canvas click handler
  useEffect(() => {
    const onclick = evt => {
      if (active.current.index !== undefined) {
        const node = nodes.find(d => d.index === active.current.index)
        onClickNode(node)
        active.current = {}
        return
      }
      // onClickCanvas(evt)
    }
    const onmousemove = evt => {
      const { clientX, clientY } = evt
      let x = clientX
      let y = clientY
      let dx = 0
      let dy = 0
      let node
      for (let i = 0; i < nodes.length; i++) {
        node = nodes[i]
        dx = node.x - x
        dy = node.y - y
        const dist = Math.sqrt(dy * dy + dx * dx)

        if (dist < node.r) {
          active.current = node
        } else {
          if (node.index === active.current.index) {
            active.current = {}
          }
        }
      }
    }

    document.addEventListener("click", onclick)
    document.addEventListener("mousemove", onmousemove)
    return () => {
      document.removeEventListener("click", onclick)
      document.removeEventListener("mousemove", onmousemove)
    }
  }, [onClickCanvas, selectedNode, nodes, onClickNode])

  // Instantiate objects
  const geometry = useMemo(() => {
    return new CircleBufferGeometry(128, 128)
  }, [])

  const texture = useMemo(() => {
    return new THREE.TextureLoader().load(image)
  }, [])

  const [translateArray, uvArray] = useMemo(() => {
    return [new Float32Array(maxNodes * 4), new Float32Array(maxNodes * 2)]
  }, [])

  // Instantiate geometry attributes
  useMemo(() => {
    for (let i = 0, i4 = 0, l = maxNodes; i < l; i++, i4 += 4) {
      if (nodes[i] && nodes[i].x) {
        translateArray[i4 + 0] = nodes[i].x - window.innerWidth / 2
        translateArray[i4 + 1] = nodes[i].y - window.innerHeight / 2
        translateArray[i4 + 2] = 0
        translateArray[i4 + 3] = 0.5
      }
    }

    for (let i = 0, i4 = 0, l = maxNodes; i < l; i++, i4 += 2) {
      if (nodes[i] && nodes[i].x) {
        uvArray[i4 + 0] = i % 4
        uvArray[i4 + 1] = i % 4
      }
    }

    geometry.setAttribute(
      "translate",
      new THREE.InstancedBufferAttribute(translateArray, 4)
    )
    geometry.setAttribute(
      "instanceUv",
      new THREE.InstancedBufferAttribute(uvArray, 2)
    )
  }, [geometry, nodes, translateArray, uvArray, maxNodes])

  const animations = useRef({})
  const ref = useRef()

  const frame = useRef(0)

  // Compute per-frame instance positions
  useFrame((state, delta) => {
    frame.current = Math.round(
      lerp(frame.current, nodes.length + 2, delta * 10)
    )

    for (var i = 0, i4 = 0, l = maxNodes; i < l; i++, i4 += 4) {
      const node = nodes[i]

      if (!node || isNaN(node.x)) {
        return
      }

      // interpolate position & scale
      const x = node.x - window.innerWidth / 2
      const y = node.y - window.innerHeight / 2

      if (!animations.current[node.index]) {
        animations.current[node.index] = {
          x: node.cx - window.innerWidth / 2,
          y: node.cy - window.innerHeight / 2,
          scale: 0
        }
      }

      const anim = animations.current[node.index]
      anim.x = lerp(anim.x, x, delta * 5)
      anim.y = lerp(anim.y, y, delta * 5)

      anim.scale = lerp(
        anim.scale,
        node.index === active.current.index
          ? node.hoverScale * (node.r / 128)
          : node.index < frame.current
          ? node.r / 128
          : 0,
        node.index === active.current.index ? delta * 15 : delta * 5
      )

      // update geometry attributes
      translateArray[i4 + 0] = anim.x
      translateArray[i4 + 1] = -anim.y
      translateArray[i4 + 3] = anim.scale
      //}

      geometry.setAttribute(
        "translate",
        new THREE.InstancedBufferAttribute(translateArray, 4)
      )
    }

    for (let i = 0, i2 = 0, l = maxNodes; i < l; i++, i2 += 2) {
      if (nodes[i] && nodes[i].x) {
        const node = nodes[i]
        uvArray[i2 + 0] = node.index === active.current.index ? 0.5 : i % 4
        uvArray[i2 + 1] = node.index === active.current.index ? 0.5 : i % 4
      }
    }

    geometry.setAttribute(
      "instanceUv",
      new THREE.InstancedBufferAttribute(uvArray, 2)
    )

    ref.current.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <instancedMesh
        ref={ref}
        args={[geometry, null, maxNodes]}
        // onPointerMove={e => {
        //   setSelectedNode(e.instanceId)
        // }}
        // onPointerOut={e => setSelectedNode(undefined)}
      >
        {/* <meshBasicMaterial attach="material" /> */}
        <rawShaderMaterial
          attach="material"
          args={[Shader]}
          uniforms-texture-value={texture}
          uniforms-textureDivision-value={[4, 4]}
        />
      </instancedMesh>
      <Suspense fallback={<></>}>
        <Text>Prova</Text>
      </Suspense>
    </>
  )
}

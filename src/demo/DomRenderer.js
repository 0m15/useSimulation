import React, { useEffect, useRef, useCallback } from "react"
import gsap from "gsap"
import { TransitionGroup, Transition } from "react-transition-group"

const ROOT_RADIUS = 160

export default function DomRenderer({
  nodes,
  simulation,
  onClickCanvas,
  onClickNode
}) {
  const refs = useRef({})

  const onRef = useCallback(props => {
    refs.current[props.index] = props
  }, [])

  // update
  useEffect(() => {
    requestAnimationFrame(() => {
      nodes.forEach((node, index) => {
        const ref = refs.current[index]
        if (!ref || !ref.el) return

        gsap.to(ref.el, {
          duration: 0.5,
          x: node.x - node.r,
          y: node.y - node.r,
          width: node.r*2,
          height: node.r*2
        })
      })
    })
  }, [nodes])

  return (
    <>
      <div
        onClick={onClickCanvas}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          width: "100%",
          height: "100%"
        }}
      >
        <TransitionGroup>
          {nodes.map((d, index) => {
            return (
              <Transition
                onClick={onClickNode(d)}
                key={d.id}
                onEnter={domNode => {
                  gsap.set(domNode, { opacity: 0, scale: 0.5, x: d.x, y: d.y })
                  gsap.to(domNode, {
                    scale: 1,
                    opacity: 1,
                    duration: 0.5,
                    width: d.r * 2,
                    height: d.r * 2
                  })
                }}
                onExit={domNode => {
                  gsap.to(domNode, {
                    scale: 0.5,
                    opacity: 0,
                    duration: 0.5
                  })
                }}
                timeout={500}
              >
                <div
                  ref={el => onRef({ d, el, index })}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: 0,
                    height: 0,
                    // width: d.r * 2,
                    // height: d.r * 2,
                    background: d.r < 12 ? "#ddd" : "blue",
                    border: d.r < 12 ? "1px solid #ccc" : "1px solid white",
                    borderRadius: "50%",
                    overflow: "hidden",
                    zIndex: 1,
                    willChange:'transform',
                    //transform: `translate3d(${d.x}px, ${d.y}px, 0)`
                    // transform: props.state.interpolate( // from 0 to 1
                    //   o => `translate3d(${o * d.x}px, ${o * d.y}px, 0)`
                    // ),
                    // opacity: props.opacity
                  }}
                >
                  {d.r > 12 && (
                    <img src={`https://i.pravatar.cc/${Math.floor(d.r) * 2}`} />
                  )}
                </div>
              </Transition>
            )
          })}
        </TransitionGroup>
      </div>
    </>
  )
}

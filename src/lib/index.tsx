import React, {
  useReducer,
  useMemo,
  useCallback,
  createContext,
  useContext as useContextImpl,
  ReactNode
} from "react"
import { Simulation } from "./types"

const initialState: object = { nodes: [] }
const SimulationContext = createContext({})

function reducer(state: any, action: Simulation.ActionType) {
  switch (action.type) {
    case "add":
      if (!action.data.id) action.data.id = state.nodes.length
      return { ...state, nodes: [...state.nodes, action.data] }
    case "addMany":
      return { ...state, nodes: [...state.nodes, ...action.data] }
    case "remove":
      return {
        ...state,
        nodes: state.nodes.filter(
          (d: Simulation.Node) => d.id !== action.data.id
        )
      }
    case "setMany":
      return {
        ...state,
        nodes: action.data
      }
    default:
      throw new Error()
  }
}

export function useSimulation({ workerUrl = "/d3worker.js" } = {}) {
  // state
  const [state, dispatch] = useReducer(reducer, initialState)

  // worker
  const worker = useMemo(() => {
    const worker = new Worker(workerUrl)
    worker.onmessage = onWorkerMessage

    function onWorkerMessage(event: object | any) {
      dispatch({ type: event.data.type, data: event.data.nodes })
    }

    return worker
  }, [dispatch, workerUrl])

  // api
  const updateSimulation = useCallback(
    nodes => {
      worker.postMessage({ nodes })
    },
    [worker]
  )

  const addNode = useCallback(
    node => {
      worker.postMessage({ nodes: [...state.nodes, node] })
    },
    [worker, state]
  )

  const setNodes = useCallback(nodes => {
    dispatch({ type: "setMany", data: nodes })
  }, [])

  return [state.nodes, addNode, updateSimulation, setNodes]
}

export function useContext() {
  return useContextImpl(SimulationContext)
}

export function SimulationContainer({ children }: { children: ReactNode }) {
  const [nodes, addNode, updateSimulation, setNodes] = useSimulation()

  return (
    <SimulationContext.Provider
      value={[nodes, addNode, updateSimulation, setNodes]}
    >
      {children}
    </SimulationContext.Provider>
  )
}

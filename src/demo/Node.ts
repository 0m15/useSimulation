

export type NodeProps = {
    id: number | string
    x?: number
    y?: number
    r: number
}

interface NodeInst extends NodeProps {
    cx?: number
    cy?: number
    fx?: number
    fy?: number
}

export class Node {
    constructor(props: NodeProps) {
        if (props.id) this.id = props.id
        if (props.x) this.x = props.x
        if (props.y) this.y = props.y
        if (props.r) this.r = props.r
        return this
    }

    static create(props: any): NodeInst {
        return new Node(props)
    }

    get x(): number {
        return this.x
    }

    set x(x: number) {
        this.x = x
    }

    get y(): number {
        return this.y
    }

    set y(y: number) {
        this.y = y
    }

    get id(): NodeProps["id"] {
        return this.id
    }

    set id(id: NodeProps["id"]) {
        this.id = id
    }

    get r(): NodeProps["r"] {
        return this.r
    }

    set r(r: NodeProps["r"]) {
        this.r = r
    }
}

export class Nodes {

}
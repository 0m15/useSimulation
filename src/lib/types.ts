export declare namespace Simulation {

    type id = number | string

    export namespace Point {
        type x = number
        type y = number
    }

    export interface Node {
        id?: Simulation.id
        x?: Point.x
        y?: Point.y
        cx?: number
        cy?: number
        fx?: number
        fy?: number
        r?: number
    }

    interface ActionType {
        type: string
        data: Array<Node> | any
    }

}
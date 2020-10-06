// example declaration file - remove these and add your own custom typings

// memory extension samples
interface CreepMemory {
    role: string;
    room: string;
    working: boolean;
}

interface Memory {
    uuid: number;
    log: any;
}

interface RoomMemory {
    planner: PlannerMemory;
}

interface TileMemory {
    x: number;
    y: number;
    XGrid: number;
    YGrid: number;
    originDistanceSqrt: number;

    adjecentOpen: number;
    open: boolean;

    type: string;
    walkable: boolean;

    cost: number;
}

interface PlannerMemory {
    map: TileMemory[][];
    buildings: Array<TileMemory>;
    center: TileMemory;
    sources: SourceMemory[];
    minerals: SourceMemory[];
}

interface SourceMemory {
    id: string;
}

interface Dictionary<T> {
    [index: string]: T;
}
// `global` extension samples
declare namespace NodeJS {
    interface Global {
        log: any;
    }
}

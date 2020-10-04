import { throws } from "assert";
import { RoomPlanner } from "RoomBuilder/RoomPlanner";

export class PlannerTile implements TileMemory {
    x: number;
    y: number;
    XGrid: number;
    YGrid: number;
    originDistanceSqrt: number;

    adjecentOpen: number = 8;
    open: boolean = true;

    planner: RoomPlanner;

    type: string = "none";
    walkable: boolean = true;

    cost: number = Number.MAX_VALUE;

    constructor(planner: RoomPlanner, XGrid: number, YGrid: number) {
        this.planner = planner;
        this.XGrid = XGrid;
        this.YGrid = YGrid;
        if (XGrid == 0 || XGrid == 49) {
            this.adjecentOpen -= 3;
        }
        if (YGrid == 0 || YGrid == 49) {
            this.adjecentOpen -= 3;
        }

        if (planner.center) {
            this.x = XGrid - planner.center.XGrid;
            this.y = YGrid - planner.center.YGrid;
            this.originDistanceSqrt = this.GetDistanceSqrt(planner.center);
        } else {
            this.x = this.y = this.originDistanceSqrt = 0;
            planner.center = this;
        }
    }

    public GetDistanceSqrt(toTile: PlannerTile) {
        return (this.x - toTile.x) ** 2 + (this.y - toTile.y) ** 2;
    }

    public CheckDistanceOriginLessThen(distance: number) {
        return this.originDistanceSqrt < distance * distance;
    }

    public UpdateNeighboursCost() {
        if (this == this.planner.center) {
            console.log("???");

            this.SetCost(0);
        }
    }

    private SetCost(cost: number) {
        this.cost = cost;
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                if (x == 0 && y == 0) continue;
                let gx = this.XGrid + x;
                let gy = this.YGrid + y;
                if (gx < 0 || gy < 0 || gx > 49 || gy > 49) continue;

                let tile = this.planner.map[gx][gy];
                let ncost = Math.abs(x) * 10 + Math.abs(y) * 10;
                if (ncost > 10) ncost = 14;
                ncost = this.cost + ncost;

                if (ncost < tile.cost) {
                    if (tile.walkable) {
                        tile.SetCost(ncost);
                    } else {
                        tile.cost = ncost;
                    }
                }
            }
        }
    }

    public RemoveNearby() {
        this.adjecentOpen--;
        if (this.adjecentOpen <= this.planner.minOpen) {
            this.open = false;
        }
    }

    public IsOpen(): boolean {
        return this.open;
    }

    public ToMemory(): TileMemory {
        return {
            x: this.x,
            y: this.y,
            XGrid: this.XGrid,
            YGrid: this.YGrid,
            originDistanceSqrt: this.originDistanceSqrt,

            adjecentOpen: this.adjecentOpen,
            open: this.open,

            type: this.type,
            walkable: this.walkable,

            cost: this.cost
        };
    }

    public SetType(type: string) {
        if (this.walkable) {
            this.walkable = false;
            this.open = false;
            this.type = type;

            for (let x = -1; x <= 1; x++) {
                for (let y = -1; y <= 1; y++) {
                    if (x < 0 || y < 0 || x > 49 || y > 49) continue;
                    if (x == 0 && y == 0) continue;
                    this.planner.map[this.XGrid + x][this.YGrid + y].RemoveNearby();
                }
            }
        } else if (this.type != type) {
            this.type = type;
        }
    }
}

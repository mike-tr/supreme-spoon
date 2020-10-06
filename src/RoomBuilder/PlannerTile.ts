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

    private cycleId: number = -1;
    private static cycle: number = 0;
    private static changed: Array<PlannerTile> = [];

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

    public UpdateNeighbours() {
        if (this == this.planner.center) {
            PlannerTile.cycle++;
            this.SetCost(0);
        }
    }

    public TryMarkAsBuilding(type: string): boolean {
        if (this.walkable && this.open) {
            let old = {
                type: this.type,
                open: this.open,
                walkable: this.walkable
            };

            this.type = type;
            // calculate new map values.
            // see if any old building is "broken" now.
            // if not good.
            // if someone broke, revert!

            PlannerTile.changed = [];
            this.UpdateAdjecent(false, false);
            //this.planner.center.UpdateNeighbours();

            var revert = false;
            for (const name in this.planner.buildings) {
                var tile = this.planner.buildings[name];
                if (tile.cost > this.planner.maxucost || tile.adjecentOpen < this.planner.minOpen) {
                    revert = true;
                    break;
                }
            }

            if (!revert) {
                for (const name in this.planner.edges) {
                    var tile = this.planner.edges[name];
                    if (tile.cost > this.planner.maxucost || tile.adjecentOpen < this.planner.minOpen) {
                        revert = true;
                        break;
                    }
                }
            }

            if (revert) {
                this.type = old.type;

                this.UpdateAdjecent(old.walkable, old.open);
                //this.planner.center.UpdateNeighbours();
                return false;
            } else {
                this.planner.buildings.push(this);
                this.planner.UpdateOpen();
            }
            return true;
        } else {
            this.type = type;
            return true;
        }
    }

    private SetCost(cost: number) {
        this.cycleId = PlannerTile.cycle;
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

                if (tile.cycleId != PlannerTile.cycle || ncost < tile.cost) {
                    if (tile.walkable) {
                        tile.SetCost(ncost);
                    } else {
                        tile.cost = ncost;
                    }
                }
            }
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

    public SetTypeToAndUpdate(type: string) {
        if (this.walkable) {
            this.UpdateAdjecent(false, false);
        } else if (this.type != type) {
            this.type = type;
        }
    }

    public UpdateAdjecent(walkable: boolean, open: boolean = false) {
        if (this.open != open) {
            this.walkable = walkable;
            this.open = open;

            for (let x = -1; x <= 1; x++) {
                for (let y = -1; y <= 1; y++) {
                    if (x == 0 && y == 0) continue;
                    let gx = this.XGrid + x;
                    let gy = this.YGrid + y;
                    if (gx < 0 || gy < 0 || gx > 49 || gy > 49) continue;
                    let tile = this.planner.map[gx][gy];

                    tile.adjecentOpen += open ? 1 : -1;
                    tile.open = tile.adjecentOpen >= this.planner.minOpen;
                }
            }
        }
    }
}

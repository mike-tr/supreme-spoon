import { RoomPlanner } from "RoomBuilder/RoomPlanner";

interface roomGroup {
    viable: boolean,
    memebers: Array<PlannerTile>
    groupId: number,
    groupSize: number,
}

export class PlannerTile implements TileMemory {
    x: number;
    y: number;
    XGrid: number;
    YGrid: number;
    originDistanceSqrt: number;

    adjecentOpen: number = 8;
    adjecenetWalls: number = 0;
    groupMemebers: Array<PlannerTile> = [this];
    groupSize: number = 1;
    groupId: number = 0;
    open: boolean = true;
    building: boolean = false;

    planner: RoomPlanner;

    type: string = "none";
    walkable: boolean = true;

    cost: number = Number.MAX_VALUE;

    private cycleId: number = -1;
    private static cycle: number = 0;
    private static changed: Array<PlannerTile> = [];

    getCopy(): PlannerTile {
        let copy = new PlannerTile(this.planner, this.XGrid, this.YGrid);
        copy.open = this.open;
        copy.adjecentOpen = this.adjecentOpen;
        copy.adjecenetWalls = this.adjecenetWalls;
        copy.type = this.type;
        return copy;
    }

    constructor(planner: RoomPlanner, XGrid: number, YGrid: number) {
        this.planner = planner;
        this.XGrid = XGrid;
        this.YGrid = YGrid;

        this.groupId = XGrid * 50 + YGrid;
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
            this.SetCostForAll(0);
        }
    }

    public Proximity(x: number, y: number): number {
        return (this.x - x) ** 2 + (this.y - y) ** 2;
    }

    private iscore: number = 0;
    private worstT?: PlannerTile;
    private worstS: number = -1;
    public TryMarkAsBuilding(type: string): boolean {
        if (this.walkable && this.open) {
            var center = this.planner.center;
            let c = this.CalculateCost(center);
            var revert = c < 0 || c > this.planner.maxucost;

            let group = this.CheckIfCanBeGrouped();
            if (!group || !group.viable) {
                return false;
            }
            if (revert) {
                return false;
            }


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

            var cb = this.planner.maxucost * 1.5;


            for (const name in this.planner.buildings) {
                var tile = this.planner.buildings[name];
                if (tile.adjecentOpen < this.planner.minOpen) {
                    revert = true;
                    break;
                }

                // let cost = tile.CalculateCost(center);
                // if (cost < 0 || cost > tile.iscore + 8) {
                //     revert = true;
                //     break;
                // }

                let cost = tile.CalculateCost(this);
                if (cost < 0 || cost > cb) {
                    revert = true;
                    break;
                }

            }



            if (!revert) {
                for (const name in this.planner.edges) {
                    if (revert) {
                        break;
                    }

                    var tile = this.planner.edges[name];
                    if (tile.adjecentOpen < this.planner.minOpen) {
                        revert = true;
                        break;
                    }

                    let cost = tile.CalculateCost(center);
                    if (cost < 0 || cost > tile.cost + 34) {
                        revert = true;
                        break;
                    }

                    cost = this.CalculateCost(tile);
                    if (cost < 0 || cost > cb) {
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
                this.iscore = this.CalculateCost(center);
                this.building = true;
                this.planner.buildings.push(this);
                this.planner.UpdateOpen(this);

                PlannerTile.ApplyGroup(group);
            }
            return true;
        } else {
            this.type = type;
            return true;
        }
    }

    private pivot?: PlannerTile = undefined;
    private AStarCost: number = 0;
    private AStarFCost: number = 0;
    public CalculateCost(from: PlannerTile): number {
        if (from == this) {
            return -1;
        }

        var openSet: Array<PlannerTile> = [];
        var closedSet: Array<PlannerTile> = [];

        let data = {
            fromw: from.walkable,
            thisw: this.walkable
        }
        this.walkable = true;
        from.walkable = true;

        this.pivot = from.pivot = undefined;
        openSet.push(from);
        from.AStarFCost = 0;


        while (openSet.length > 0) {
            var current = openSet.shift();
            if (current != null) {
                closedSet.push(current);

                if (current == this) {
                    this.walkable = data.thisw;
                    from.walkable = data.fromw;
                    // var ct = current.pivot;
                    // var k = 0;
                    // while(ct != null && ct != from && k < 2500){
                    //     ct = ct?.pivot;
                    //     k++;
                    // }
                    return this.AStarCost;
                }

                for (const tile of current.GetNeighbours()) {
                    if (closedSet.includes(tile) || !tile.walkable) {
                        continue;
                    }
                    var fcost = tile.GetCostTo(current) + current.AStarFCost;
                    var cost = fcost + tile.GetCostTo(this);
                    if (openSet.includes(tile)) {
                        if (cost < tile.AStarCost) {
                            tile.pivot = current;
                            tile.AStarCost = cost;
                            tile.AStarFCost = fcost;
                        }
                    } else {
                        tile.AStarFCost = fcost;
                        tile.pivot = current;
                        tile.AStarCost = cost;
                        openSet.push(tile);
                    }
                }
                openSet.sort((a, b) => (a.AStarCost > b.AStarCost ? 1 : -1));
            }
        }
        return -1;
    }

    public ToString(): string {
        return this.XGrid + " " + this.YGrid + " :: " + this.x + " " + this.y;
    }

    public GetCostTo(to: PlannerTile): number {
        var dx = Math.abs(to.x - this.x);
        var dy = Math.abs(to.y - this.y);

        if (dx > dy) {
            return dx * 10 + dy * 4;
        } else {
            return dy * 10 + dx * 4;
        }
    }

    private SetCostForAll(cost: number) {
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
                        tile.SetCostForAll(ncost);
                    } else {
                        tile.cost = ncost;
                    }
                }
            }
        }
    }

    private Neighbours: Array<PlannerTile> = [];
    private GetNeighbours(): Array<PlannerTile> {
        if (this.Neighbours.length > 0) {
            return this.Neighbours;
        }
        var arr: PlannerTile[] = [];
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                if (x == 0 && y == 0) continue;

                let gx = this.XGrid + x;
                let gy = this.YGrid + y;
                if (gx < 0 || gy < 0 || gx > 49 || gy > 49) continue;

                arr.push(this.planner.map[gx][gy]);
            }
        }
        this.Neighbours = arr;
        return this.Neighbours;
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

    public SetAsWall() {
        this.type = "wall";
        this.walkable = false;
        this.open = false;
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                if (x == 0 && y == 0) continue;
                let gx = this.XGrid + x;
                let gy = this.YGrid + y;
                if (gx < 0 || gy < 0 || gx > 49 || gy > 49) continue;
                let tile = this.planner.map[gx][gy];

                tile.adjecentOpen += 1;
                tile.adjecenetWalls += 1;
                tile.open = tile.adjecentOpen >= this.planner.minOpen;
            }
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

    public CheckIfCanBeGrouped(): roomGroup | undefined {
        if (this.building) {
            return undefined;
        }
        let arr: PlannerTile[] = [];
        arr.push(this);


        let group: roomGroup = {
            viable: true,
            groupSize: 1,
            groupId: this.groupId,
            memebers: [],
        }

        group.memebers.push(this);
        for (let i = -1; i <= 1; i++) {
            if (i == 0)
                continue;
            let gx = this.XGrid + i;
            if (gx >= 0 && gx < 50) {
                let insert = true;
                let ntile = this.planner.map[gx][this.YGrid];
                if (ntile.building) {
                    for (const tile of arr) {
                        if (ntile.groupId == tile.groupId) {
                            insert = false;
                            break;
                        }
                    }

                    if (insert) {
                        group.groupSize += ntile.groupSize;
                        group.memebers = group.memebers.concat(ntile.groupMemebers);
                        arr.push(ntile);
                    }
                }
            }

            let gy = this.YGrid + i;
            if (gy >= 0 && gy < 50) {
                let insert = true;
                let ntile = this.planner.map[this.XGrid][gy];
                if (ntile.building) {
                    for (const tile of arr) {
                        if (ntile.groupId == tile.groupId) {
                            insert = false;
                            break;
                        }
                    }

                    if (insert) {
                        group.groupSize += ntile.groupSize;
                        group.memebers = group.memebers.concat(ntile.groupMemebers);
                        arr.push(ntile);
                    }
                }
            }
        }

        let sx = this.x, mx = this.x;
        let sy = this.y, my = this.y;
        group.memebers.forEach(tile => {
            if (tile.x > mx) {
                mx = tile.x;
            } else if (tile.x < sx) {
                sx = tile.x;
            }

            if (tile.y > my) {
                my = tile.y;
            } else if (tile.y < sy) {
                sy = tile.y;
            }
        });

        // let k = (my - sy) ** 2 + (mx - sx) ** 2;

        // if (k > 13) {
        //     group.viable = false;
        // }

        let j = Math.abs(my - sy - mx + sx);
        if (j > 2) {
            group.viable = false;
        }

        if (group.groupSize > this.planner.maxGroupSize) {
            group.viable = false;
        }
        return group;
    }

    public static ApplyGroup(group: roomGroup) {
        group.memebers.forEach(tile => {
            tile.groupSize = group.groupSize;
            tile.groupId = group.groupId;
            tile.groupMemebers = group.memebers;
        });
    }
}

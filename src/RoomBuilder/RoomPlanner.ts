import { time } from "console";
import { forEach } from "lodash";
import { join } from "path";
import { PlannerTile } from "RoomBuilder/PlannerTile";

export class RoomPlanner {
    public room: Room;
    public map: PlannerTile[][];
    public center: PlannerTile;

    public ez: PlannerTile;
    public ez2: PlannerTile;

    public range: number;

    public open: Array<PlannerTile> = new Array();
    public edges: Array<PlannerTile> = new Array();
    public buildings: Array<PlannerTile> = new Array();
    public initialz: Array<PlannerTile> = new Array();

    public minOpen: number = 2;
    public maxCost: number = 130;
    public maxucost: number = 22;
    public maxGroupSize: number = 11;

    memory: PlannerMemory;
    constructor(room: Room, xCenter: number, yCenter: number) {
        this.range = 15;
        this.room = room;
        this.map = [];
        this.center = new PlannerTile(this, xCenter, yCenter);
        this.maxucost += this.maxCost;

        this.ez = this.ez2 = this.center;
        if (room.memory.planner == null || Game.time % 5 == 0) {
            this.room.memory.planner = {} as PlannerMemory;

            this.memory = this.room.memory.planner;
            this.memory.minerals = [];
            this.memory.sources = [];
            this.memory.buildings = [];
            console.log("generating!");
            this.GenerateRoom();
        } else {
            this.memory = this.room.memory.planner;
        }

        this.DrawStuff();
    }

    public ColorByCost(cost: number): string {
        cost = cost % 50;
        if (cost < 14) {
            return "#ffffff";
        } else if (cost < 20) {
            return "#ff66aa";
        } else if (cost < 24) {
            return "#ccaa66";
        } else if (cost < 28) {
            return "#44ff33";
        } else if (cost < 30) {
            return "#aadd66";
        } else if (cost < 34) {
            return "#9955ff";
        } else if (cost < 38) {
            return "#7799dd";
        } else if (cost < 40) {
            return "#4c5f6d";
        } else {
            return "#afaf66";
        }
    }

    public DrawStuff() {
        // for (let XGrid = 0; XGrid < 50; XGrid++) {
        //     for (let YGrid = 0; YGrid < 50; YGrid++) {
        //         var tile = this.memory.map[XGrid][YGrid];
        //         if (tile.cost > 200) continue;
        //         if (tile.walkable) {
        //             this.room.visual.circle(XGrid, YGrid, {
        //                 fill: "transparent",
        //                 radius: 0.55,
        //                 stroke: this.ColorByCost(tile.cost)
        //             });
        //         } else {
        //             this.room.visual.circle(XGrid, YGrid, {
        //                 fill: "transparent",
        //                 radius: 0.55,
        //                 stroke: "red"
        //             });
        //         }
        //     }
        // }

        this.memory.buildings.forEach(tile => {
            this.room.visual.circle(tile.XGrid, tile.YGrid, {
                fill: "transparent",
                radius: 0.45,
                stroke: "blue"
            });
        });

        this.memory.edges.forEach(tile => {
            this.room.visual.circle(tile.XGrid, tile.YGrid, {
                fill: "transparent",
                radius: 0.35,
                stroke: "red"
            });
        });

        // this.memory.buildings.forEach(tile => {
        //     this.room.visual.circle(tile.XGrid, tile.YGrid, {
        //         fill: "transparent",
        //         radius: 0.33,
        //         stroke: "white"
        //     });
        // });
    }

    public GenerateRoom() {
        let terrain = this.room.getTerrain();
        for (let XGrid = 0; XGrid < 50; XGrid++) {
            this.map[XGrid] = [];
            for (let YGrid = 0; YGrid < 50; YGrid++) {
                var tile = new PlannerTile(this, XGrid, YGrid);
                this.map[XGrid][YGrid] = tile;
            }
        }
        this.map[this.center.XGrid][this.center.YGrid] = this.center;
        // for (let i = -2; i <= 2; i++) {

        //     let gx = this.center.XGrid + i;
        //     if (gx >= 0 && gx < 50) {
        //         this.map[gx][this.center.YGrid].open = false;
        //     }
        // }

        //this.ez.SetAsWall();
        //this.ez2.SetAsWall();

        for (let XGrid = 0; XGrid < 50; XGrid++) {
            for (let YGrid = 0; YGrid < 50; YGrid++) {
                var tile = this.map[XGrid][YGrid];
                if (tile == this.center) continue;
                var tilev = terrain.get(XGrid, YGrid);

                if (tilev == 1) {
                    tile.SetAsWall();
                    //tile.SetTypeToAndUpdate("WALL");
                }
            }
        }
        this.center.SetTypeToAndUpdate(STRUCTURE_SPAWN);
        this.center.building = true;

        this.GetRoomInitials();

        this.center.UpdateNeighbours();

        let shifto: PlannerTile[] = []

        let ho: PlannerTile[] = [];

        for (let XGrid = 0; XGrid < 50; XGrid++) {
            for (let YGrid = 0; YGrid < 50; YGrid++) {
                var tile = this.map[XGrid][YGrid];
                if (tile.adjecenetWalls > 1) {
                    continue;
                }
                if (tile.open && tile.cost < this.maxCost * 0.9) {
                    // if (tile.cost < 28) {
                    //     let c = tile.getCopy();
                    //     shifto.push(tile);
                    //     ho.push(c);
                    //     continue;
                    // } else if (tile.cost < 50) {
                    //     ho.push(tile.getCopy());
                    // }
                    this.open.push(tile);
                } else if (tile.open && tile.cost > 0.9 * this.maxCost && tile.cost < this.maxCost) {
                    this.edges.push(tile);
                }
            }
        }

        this.edges.sort((a, b) => (a.originDistanceSqrt > b.originDistanceSqrt ? -1 : 1));
        this.edges = this.edges.slice(0, Math.floor(this.maxCost * 0.08));

        this.open.sort((a, b) => (a.cost > b.cost ? -1 : 1));
        this.maxucost = this.maxCost * 2.1;

        //let k = this.open;
        //this.maxGroupSize = 7;

        for (let index = 0; index < 300; index++) {
            let tile = this.open.shift();
            if (tile == null) {
                break;
            }

            while (tile) {
                if (tile.TryMarkAsBuilding("Test")) {
                    break;
                }
                tile = this.open.shift();
            }
        }

        // ho.forEach(tile => {
        //     this.map[tile.XGrid][tile.YGrid] = tile;
        // })

        let v = this.buildings;
        //this.buildings = [];
        this.open = shifto;
        this.maxGroupSize = 5;
        for (let index = 0; index < 300; index++) {
            let tile = this.open.pop();
            if (tile == null) {
                break;
            }

            while (tile) {
                if (tile.TryMarkAsBuilding("Test")) {
                    break;
                }
                tile = this.open.pop();
            }
        }

        this.SaveToMemory();
    }

    xc: number = 0;
    yc: number = 0;
    n: number = 0;

    j: number = 1;
    public UpdateCenterOfMass(tile: PlannerTile) {

    }

    public UpdateOpen(tile: PlannerTile) {
        // const index = this.open.indexOf(tile, 0);
        // if (index > -1) {
        //     this.open.splice(index, 1);
        // }

        this.xc += tile.x * (3 - this.j);
        this.yc += tile.y * this.j;
        this.n += this.j;
        this.j = this.j % 2 + 1;

        let x = this.xc / this.n;
        let y = this.yc / this.n;
        this.open.sort((a, b) => (a.cost > b.cost ? -1 : 1));
        //this.open.sort((a, b) => (a.Proximity(x, y) < b.Proximity(x, y) ? -1 : 1));
    }

    GetRoomInitials() {
        const sources = this.room.find(FIND_SOURCES);
        sources.forEach(source => {
            const sdata: SourceMemory = {
                id: source.id
            };
            let tile = this.map[source.pos.x][source.pos.y];
            tile.SetAsWall();
            tile.type = "soruce";
            this.memory.sources.push(sdata);
        });

        const mineral = this.room.find(FIND_MINERALS);
        mineral.forEach(source => {
            const sdata: SourceMemory = {
                id: source.id
            };
            let tile = this.map[source.pos.x][source.pos.y];
            tile.SetAsWall();
            tile.type = "mineral";
            this.memory.minerals.push(sdata);
        });

        var controller = this.room.controller;
        if (controller) {
            let tile = this.map[controller.pos.x][controller.pos.y];
            tile.SetAsWall();
            tile.type = STRUCTURE_CONTROLLER;
        }
    }

    public SaveToMemory() {
        var mmap: TileMemory[][];
        mmap = [];
        for (let XGrid = 0; XGrid < 50; XGrid++) {
            mmap[XGrid] = [];
            for (let YGrid = 0; YGrid < 50; YGrid++) {
                mmap[XGrid][YGrid] = this.map[XGrid][YGrid].ToMemory();
            }
        }

        var sbuildings: Array<TileMemory> = [];
        this.buildings.forEach(tile => {
            sbuildings.push(tile.ToMemory());
        });

        var sedges: Array<TileMemory> = [];
        this.edges.forEach(tile => {
            sedges.push(tile.ToMemory());
        });

        this.memory.map = mmap;
        this.memory.center = this.center.ToMemory();
        this.memory.buildings = sbuildings;
        this.memory.edges = sedges;
    }
}

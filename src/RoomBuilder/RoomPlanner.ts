import { time } from "console";
import { forEach } from "lodash";
import { PlannerTile } from "RoomBuilder/PlannerTile";

export class RoomPlanner {
    public room: Room;
    public map: PlannerTile[][];
    public center: PlannerTile;
    public range: number;

    public open: Array<PlannerTile> = new Array();
    public edges: Array<PlannerTile> = new Array();
    public buildings: Array<PlannerTile> = new Array();

    public minOpen: number = 4;
    public maxCost: number = 150;
    public maxucost: number = 24;

    memory: PlannerMemory;
    constructor(room: Room, xCenter: number, yCenter: number) {
        this.range = 15;
        this.room = room;
        this.map = [];
        this.center = new PlannerTile(this, xCenter, yCenter);
        this.maxucost += this.maxCost * 1.1 + 20;
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

        for (let XGrid = 0; XGrid < 50; XGrid++) {
            for (let YGrid = 0; YGrid < 50; YGrid++) {
                var tile = this.map[XGrid][YGrid];
                if (tile == this.center) continue;
                var tilev = terrain.get(XGrid, YGrid);

                if (tilev == 1) {
                    tile.SetTypeToAndUpdate("WALL");
                }
            }
        }
        this.center.SetTypeToAndUpdate(STRUCTURE_SPAWN);

        this.GetRoomInitials();

        this.center.UpdateNeighbours();

        for (let XGrid = 0; XGrid < 50; XGrid++) {
            for (let YGrid = 0; YGrid < 50; YGrid++) {
                var tile = this.map[XGrid][YGrid];
                if (tile.open && tile.cost < this.maxCost) {
                    this.open.push(tile);
                } else if (tile.open && tile.cost < this.maxCost + 20) {
                    this.edges.push(tile);
                }
            }
        }

        this.open.sort((a, b) => (a.cost > b.cost ? -1 : 1));
        console.log(this.open[0].cost);

        for (let index = 0; index < 500; index++) {
            let tile = this.open.shift();

            while (tile) {
                if (tile.TryMarkAsBuilding("Test")) {
                    break;
                }
                tile = this.open.shift();
            }
        }

        this.SaveToMemory();
    }

    public UpdateOpen() {
        var temp: Array<PlannerTile> = [];
        for (const key in this.open) {
            var tile = this.open[key];
            if (tile.open) {
                temp.push(tile);
            }
        }
        this.open = temp;
        this.open.sort((a, b) => (a.cost > b.cost ? -1 : 1));
    }

    GetRoomInitials() {
        const sources = this.room.find(FIND_SOURCES);
        sources.forEach(source => {
            const sdata: SourceMemory = {
                id: source.id
            };
            let tile = this.map[source.pos.x][source.pos.y];
            tile.SetTypeToAndUpdate("Source");
            this.memory.sources.push(sdata);
        });

        const mineral = this.room.find(FIND_MINERALS);
        mineral.forEach(source => {
            const sdata: SourceMemory = {
                id: source.id
            };
            let tile = this.map[source.pos.x][source.pos.y];
            tile.SetTypeToAndUpdate("Mineral");
            this.memory.minerals.push(sdata);
        });

        var controller = this.room.controller;
        if (controller) {
            let tile = this.map[controller.pos.x][controller.pos.y];
            tile.SetTypeToAndUpdate("Controller");
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

        this.memory.map = mmap;
        this.memory.center = this.center.ToMemory();
        this.memory.buildings = sbuildings;
    }
}

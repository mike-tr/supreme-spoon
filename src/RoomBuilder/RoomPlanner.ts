import { time } from "console";
import { PlannerTile } from "RoomBuilder/PlannerTile";

export class RoomPlanner {
    public room: Room;
    public map: PlannerTile[][];
    public center: PlannerTile;
    public range: number;

    public open: Array<PlannerTile> = new Array();

    public minOpen: number = 3;
    public maxCost: number = 500;

    memory: PlannerMemory;
    constructor(room: Room, xCenter: number, yCenter: number) {
        this.range = 15;
        this.room = room;
        this.map = [];
        this.center = new PlannerTile(this, xCenter, yCenter);
        if (room.memory.planner == null || Game.time % 5 == 0) {
            this.room.memory.planner = {} as PlannerMemory;

            this.memory = this.room.memory.planner;
            this.memory.minerals = [];
            this.memory.sources = [];
            console.log("generating!");
            this.GenerateRoom();
        } else {
            this.memory = this.room.memory.planner;
        }
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

        this.center.SetType(STRUCTURE_SPAWN);
        for (let x = -this.range; x < this.range; x++) {
            for (let y = -this.range; y < this.range; y++) {
                if (x == 0 && y == 0) continue;
                let XGrid = this.center.x + x;
                let YGrid = this.center.y + y;

                if (XGrid < 0 || YGrid < 0 || YGrid > 49 || XGrid > 49) continue;
                var tile = this.map[XGrid][YGrid];
                var tilev = terrain.get(XGrid, YGrid);

                if (tilev == 1) {
                    tile.SetType("WALL");
                }
            }
        }

        this.GetRoomInitials();

        this.center.UpdateNeighboursCost();

        for (let x = -this.range; x < this.range; x++) {
            for (let y = -this.range; y < this.range; y++) {
                if (x == 0 && y == 0) continue;
                let XGrid = this.center.x + x;
                let YGrid = this.center.y + y;

                if (XGrid < 0 || YGrid < 0 || YGrid > 49 || XGrid > 49) continue;
                var tile = this.map[XGrid][YGrid];
                if (tile.open && tile.cost < this.maxCost) {
                    this.open.push(tile);
                }
            }
        }

        this.SaveToMemory();
    }

    GetRoomInitials() {
        const sources = this.room.find(FIND_SOURCES);
        sources.forEach(source => {
            const sdata: SourceMemory = {
                id: source.id
            };
            let tile = this.map[source.pos.x][source.pos.y];
            tile.SetType("Source");
            this.memory.sources.push(sdata);
        });

        const mineral = this.room.find(FIND_MINERALS);
        mineral.forEach(source => {
            const sdata: SourceMemory = {
                id: source.id
            };
            let tile = this.map[source.pos.x][source.pos.y];
            tile.SetType("Mineral");
            this.memory.minerals.push(sdata);
        });

        var controller = this.room.controller;
        if (controller) {
            let tile = this.map[controller.pos.x][controller.pos.y];
            tile.SetType("Controller");
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
        this.room.memory.planner.map = mmap;
        this.room.memory.planner.center = this.center.ToMemory();
    }
}

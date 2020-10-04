import { ErrorMapper } from "utils/ErrorMapper";
import { RoomPlanner } from "RoomBuilder/RoomPlanner";
import { forEach } from "lodash";

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
    console.log(`Current game tick is ${Game.time}`);

    var nspawn = Object.keys(Game.spawns)[0];
    var spawn = Game.spawns[nspawn];

    for (const spawn in Game.spawns) {
        console.log(spawn);
    }

    var p = new RoomPlanner(spawn.room, spawn.pos.x, spawn.pos.y);
    console.log("initialzied room");
    // Automatically delete memory of missing creeps
    for (const name in Memory.creeps) {
        if (!(name in Game.creeps)) {
            delete Memory.creeps[name];
        }
    }
});

import { RoomPlanner } from "RoomBuilder/RoomPlanner";
import { PlannerTile } from "./PlannerTile";

export class LabPlacer  {
    planner : RoomPlanner;
    constructor(planner: RoomPlanner) {
        this.planner = planner;

        let open = Object.assign([], this.planner.open);
        let bestArr : PlannerTile[] = [];



    }
}

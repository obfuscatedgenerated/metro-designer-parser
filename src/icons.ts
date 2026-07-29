import {StationIcon} from "./schema";

type IconName = StationIcon | "arrow_left" | "arrow_right";

const ICONS: Record<IconName, string> = {
    "": "",
    "airport": "",
    "bus": "",
    "tram": "",
    "train": "",
    "ferry": "",
    "cablecar": "",
    "spaceport": "",
    "poi": "",
    "arrow_left": "<",
    "arrow_right": ">",
};

export default ICONS;

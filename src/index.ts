import { program } from "commander";

import fs from "fs";

import {MetroMapSchema} from "./schema";

program
    .name("metro-designer-parser")
    .description("Parser and toolkit for Tennessine's Metro Designer")
    .argument("<path | json>", "Metro Designer JSON to parse, as a file path or raw JSON string")
    .argument("[action]", "Action to perform on the JSON", "validate");

program.parse();

const options = program.opts();

// determine if the argument is a file path or raw JSON string by first trying to read it as a file, and if that fails, treat it as raw JSON
const json_arg = program.args[0];
if (!json_arg) {
    console.error("Error: No JSON argument provided.");
    process.exit(1);
}

let json_txt: string;
try {
    json_txt = fs.readFileSync(json_arg, "utf-8");
} catch (err) {
    // if the error is not ENOENT, rethrow it
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
    }

    // otherwise, treat the argument as raw JSON
    json_txt = json_arg;
}

let json_data: unknown;
try {
    json_data = JSON.parse(json_txt);
} catch (err) {
    console.error("Error: Failed to parse JSON:", err);
    process.exit(1);
}

// always attempt to parse the json, then see if any actions are requested
const result = MetroMapSchema.safeParse(json_data);

if (!result.success) {
    console.error("Error: Invalid Metro Designer JSON:", result.error);
    process.exit(1);
}

const metro_map = result.data;

const action = program.args[1] ?? "validate";

switch (action) {
    case "validate":
        console.log("Valid!");
        break;
}

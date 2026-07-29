import { program } from "commander";

import fs from "fs";

import {Connection, MetroMapSchema} from "./schema";
import {connections_to_chain, get_line_stations, HydratedConnectionPair} from "./lines";
import {generate_nameplate} from "./nameplates";
import * as console from "node:console";

program
    .name("metro-designer-parser")
    .description("Parser and toolkit for Tennessine's Metro Designer")
    .argument("<path | json>", "Metro Designer JSON to parse, as a file path or raw JSON string")
    .argument("[action]", "Action to perform on the JSON", "validate")
    .argument("[options...]", "Additional options for the action")
    .addHelpText("after", `
Actions:
  validate    Validate the JSON (default)
  lines       Output the details of lines given (or all lines if no line is specified)
  nameplates  Generate nameplate images for each station on lines given (or all lines if no line is specified)
  `);

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
    case "lines": {
        let line_names = program.args.slice(2);
        if (line_names.length === 0) {
            line_names = metro_map.lines.map((l) => l.name);
        }

        const lines = new Set(line_names.map((name) => {
            const line = metro_map.lines.find((l) => l.name === name);
            if (!line) {
                console.error(`Error: Line "${name}" not found.`);
                process.exit(1);
            }
            return line;
        }));

        for (const line of lines) {
            const {stations, connections} = get_line_stations(metro_map, line.name);
            console.log(`Line: ${line.name}`);
            console.log(`  Stations: ${stations.map((s) => s.name).join(", ")}`);
            console.log(`  Connections: ${connections.map(([s0, s1]) => `${s0!.name} <-> ${s1!.name}`).join(", ")}`);
        }
    }
        break;
    case "nameplates": {
        let line_names = program.args.slice(2);
        if (line_names.length === 0) {
            line_names = metro_map.lines.map((l) => l.name);
        }

        const lines = new Set(line_names.map((name) => {
            const line = metro_map.lines.find((l) => l.name === name);
            if (!line) {
                console.error(`Error: Line "${name}" not found.`);
                process.exit(1);
            }
            return line;
        }));

        // TODO: allow passing output directory via flag
        const output_dir = "./nameplates";
        if (!fs.existsSync(output_dir)) {
            fs.mkdirSync(output_dir, { recursive: true });
        }

        for (const line of lines) {
            const {stations, connections} = get_line_stations(metro_map, line.name);
            console.log(`Generating nameplates for line: ${line.name}`);

            const line_dir = `${output_dir}/${line.name}`;
            if (!fs.existsSync(line_dir)) {
                fs.mkdirSync(line_dir, { recursive: true });
            }

            for (const station of stations) {
                const filtered_connections = connections.filter(([s0, s1]) => s0!.id === station.id || s1!.id === station.id);
                const chain = connections_to_chain(filtered_connections as HydratedConnectionPair[]);
                const station_index = chain.findIndex((s) => s.id === station.id);
                const previous_station = station_index > 0 ? chain[station_index - 1] : undefined;
                const next_station = station_index < chain.length - 1 ? chain[station_index + 1] : undefined;

                // TODO: allow passing props via flags
                const buffer = generate_nameplate(station, line, {
                    next_station,
                    previous_station,
                });

                const output_path = `${line_dir}/${station.name}.png`;
                fs.writeFileSync(output_path, buffer);
                console.log(`  Generated nameplate for station: ${station.name} -> ${output_path}`);
            }
        }
    }
}

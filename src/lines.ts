import {MetroMap, Station} from "./schema";

export type HydratedConnectionPair = [Station, Station];

export const get_line_stations = (metro_map: MetroMap, line_name: string) => {
    const line = metro_map.lines.find((l) => l.name === line_name);
    if (!line) {
        throw new Error(`Line "${line_name}" not found`);
    }

    const connections = metro_map.connections.filter((c) => c.line === line.id);
    const station_pairs = connections.map((c) => {
        const station_0 = metro_map.stations.find((s) => s.id === c.connects[0]);
        const station_1 = metro_map.stations.find((s) => s.id === c.connects[1]);
        if (!station_0 || !station_1) {
            throw new Error(`Connection references non-existent station(s)`);
        }
        return [station_0, station_1];
    });

    // collect ids in order of appearance along the line, starting from the first station in the first connection
    const station_ids: number[] = [];
    const visited_station_ids = new Set<number>();

    const add_station_id = (station_id: number) => {
        if (!visited_station_ids.has(station_id)) {
            station_ids.push(station_id);
            visited_station_ids.add(station_id);
        }
    };

    // start with the first connection's first station
    if (station_pairs.length > 0) {
        add_station_id(station_pairs[0]![0]!.id);
    }

    for (const [station_0, station_1] of station_pairs) {
        add_station_id(station_0!.id);
        add_station_id(station_1!.id);
    }

    const stations = station_ids.map((id) => {
        const station = metro_map.stations.find((s) => s.id === id);
        if (!station) {
            throw new Error(`Station with id ${id} not found`);
        }
        return station;
    });

    return {
        stations,
        connections: station_pairs as HydratedConnectionPair[],
    }
}

// joins a list of connection pairs into a single ordered list of stations, starting from the first station (has no right neighbor) and ending with the last station (has no left neighbor)
export const connections_to_chain = (connections: HydratedConnectionPair[]): Station[] => {
    if (connections.length === 0) {
        return [];
    }

    // build a map of station id to its neighbors
    const neighbor_map = new Map<number, Set<number>>();
    for (const [s0, s1] of connections) {
        if (!neighbor_map.has(s0.id)) {
            neighbor_map.set(s0.id, new Set());
        }
        if (!neighbor_map.has(s1.id)) {
            neighbor_map.set(s1.id, new Set());
        }
        neighbor_map.get(s0.id)!.add(s1.id);
        neighbor_map.get(s1.id)!.add(s0.id);
    }

    // find the starting station (has only one neighbor)
    let start_station_id: number | null = null;
    for (const [station_id, neighbors] of neighbor_map.entries()) {
        if (neighbors.size === 1) {
            start_station_id = station_id;
            break;
        }
    }

    if (start_station_id === null) {
        throw new Error("No starting station found (all stations have two neighbors)");
    }

    // traverse the chain
    const chain: Station[] = [];
    const visited_station_ids = new Set<number>();
    let current_station_id: number | null = start_station_id;

    while (current_station_id !== null) {
        const station = connections.flatMap(([s0, s1]) => [s0, s1]).find((s) => s.id === current_station_id);
        if (!station) {
            throw new Error(`Station with id ${current_station_id} not found`);
        }
        chain.push(station);
        visited_station_ids.add(current_station_id);

        // find the next station (the neighbor that hasn't been visited yet)
        const neighbors = neighbor_map.get(current_station_id);
        if (!neighbors) {
            break;
        }
        const next_station_id = Array.from(neighbors).find((neighbor_id) => !visited_station_ids.has(neighbor_id)) || null;
        current_station_id = next_station_id;
    }

    return chain;
}

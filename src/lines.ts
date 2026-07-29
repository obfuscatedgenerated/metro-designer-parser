import {MetroMap} from "./schema";

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

    return station_ids.map((id) => {
        const station = metro_map.stations.find((s) => s.id === id);
        if (!station) {
            throw new Error(`Station with id ${id} not found`);
        }
        return station;
    });
}

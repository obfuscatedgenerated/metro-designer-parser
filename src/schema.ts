import { z } from "zod";

export const HSLColorSchema = z.custom<`hsl(${string})`>(
    (value) => typeof value === "string" && value.trimStart().startsWith("hsl("),
    { message: "expected an hsl() colour string" },
);
export type HslColor = z.infer<typeof HSLColorSchema>;

export const CoordinateSchema = z.tuple([z.number(), z.number()]);
export type Coordinate = z.infer<typeof CoordinateSchema>;

export const NullableCoordinateSchema = z.tuple([
    z.number().nullable(),
    z.number().nullable(),
]);
export type NullableCoordinate = z.infer<typeof NullableCoordinateSchema>;

export const is_complete_coordinate = (
    point: NullableCoordinate,
): point is Coordinate => {
    return point[0] !== null && point[1] !== null;
}

const is_not_null = <Value>(value: Value | null): value is Value => {
    return value !== null;
}

export const LineStyle = {
    Standard: "st",
    Dashed: "ds",
    Punched: "pn",
    DoubleStruck: "db",
    TripleStruck: "tp",
} as const;

export const LineStyleSchema = z.enum(LineStyle).default(LineStyle.Standard);
export type LineStyle = z.infer<typeof LineStyleSchema>;

const STATION_ICONS = [
    "",
    "airport",
    "bus",
    "tram",
    "train",
    "ferry",
    "cablecar",
    "spaceport",
    "poi",
] as const;

export const StationIconSchema = z.enum(STATION_ICONS).default("");
export type StationIcon = z.infer<typeof StationIconSchema>;

const STATION_STYLES = [
    "standard",
    "interchange",
    "continuation",
    "closed",
] as const;

export const StationStyleSchema = z.enum(STATION_STYLES);
export type StationStyle = z.infer<typeof StationStyleSchema>;

export const ResolvedStationStyleSchema = z.enum([...STATION_STYLES, "auto"]);
export type ResolvedStationStyle = z.infer<typeof ResolvedStationStyleSchema>;


export const MetroKeySchema = z.object({
    visible: z.boolean(),
    position: z.number(),
});
export type MetroKey = z.infer<typeof MetroKeySchema>;

export const MetroMetaSchema = z.object({
    name: z.string(),
    textColor: HSLColorSchema,
    key: MetroKeySchema,
    id: z.string().optional(), // undefined if map not yet saved
});
export type MetroMeta = z.infer<typeof MetroMetaSchema>;

export const LineRawSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    color: HSLColorSchema,
    style: LineStyleSchema,
});
export type LineRaw = z.infer<typeof LineRawSchema>;

export const LineSchema = LineRawSchema;
export type Line<LineID extends number = number> = z.infer<typeof LineSchema> & { id: LineID };

export type NewLine = Omit<Line, "id">;


export const ConnectionRawSchema = z.object({
    line: z.number().int(), // references line id
    connects: z.tuple([z.number().int(), z.number().int()]), // [from station id, to station id]
    path: z.array(CoordinateSchema),
});
export type ConnectionRaw = z.infer<typeof ConnectionRawSchema>;

export const ConnectionSchema = ConnectionRawSchema;
export type Connection<LineID extends number = number> = Omit<ConnectionRaw, "line"> & { line: LineID };

export const StationRawSchema = z.object({
    id: z.number().int(),
    x: z.number(),
    y: z.number(),
    name: z.string(), // url encoded
    icon: StationIconSchema,
    style: StationStyleSchema.optional(),
});
export type StationRaw = z.infer<typeof StationRawSchema>;

export const StationSchema = StationRawSchema.transform((raw) => ({
    id: raw.id,
    coordinate: [raw.x, raw.y] as Coordinate,
    name: decodeURIComponent(raw.name),
    icon: raw.icon,
    style: raw.style ?? ("auto" as const),
}));
export type Station = z.infer<typeof StationSchema>;

export type NewStation = Omit<Station, "id">;


export const RiverScenerySchema = z.object({
    type: z.literal("river"),
    color: HSLColorSchema,
    path: z.array(NullableCoordinateSchema),
});
export type RiverSceneryRaw = z.infer<typeof RiverScenerySchema>;

export const ZoneScenerySchema = z.object({
    type: z.literal("zone"),
    color: HSLColorSchema,
    name: z.string().max(3),
    squares: z.array(CoordinateSchema), // cells the zone covers
    labels: z.array(CoordinateSchema), // cells that also render the name
});
export type ZoneScenery = z.infer<typeof ZoneScenerySchema>;

export const SceneryRawSchema = z.discriminatedUnion("type", [
    RiverScenerySchema,
    ZoneScenerySchema,
]);
export type SceneryRaw = z.infer<typeof SceneryRawSchema>;

export const ScenerySchema = SceneryRawSchema.transform((scenery) =>
    scenery.type === "river"
        ? { ...scenery, path: scenery.path.filter(is_complete_coordinate) }
        : scenery,
);
export type Scenery = z.infer<typeof ScenerySchema>;
export type RiverScenery = Extract<Scenery, { type: "river" }>;

export const MetroMapRawSchema = z.object({
    metro: MetroMetaSchema,
    lines: z.array(LineRawSchema),
    connections: z.array(ConnectionRawSchema),
    stations: z.array(StationRawSchema),
    scenery: z.array(SceneryRawSchema),
});
export type MetroMapRaw = z.infer<typeof MetroMapRawSchema>;

export const MetroMapSchema = z
    .object({
        metro: MetroMetaSchema,
        lines: z.array(LineSchema),
        connections: z.array(ConnectionSchema),
        stations: z.array(StationSchema),
        scenery: z.array(ScenerySchema.nullable()),
    })
    .transform((map) => ({
        ...map,
        scenery: map.scenery.filter(is_not_null),
    }));
export type MetroMap<LineID extends number = number> = z.infer<typeof MetroMapSchema> & {
    lines: Line<LineID>[];
    connections: Connection<LineID>[];
};

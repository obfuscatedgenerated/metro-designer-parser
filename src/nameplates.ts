import {Line, Station} from "./schema";
import {get_canvas} from "./canvas";
import ICONS from "./icons";

interface NameplateOptions {
    show_line_color: boolean;
    show_line_name: boolean;
    show_icon: boolean;
    next_direction: "left" | "right";
    next_station?: Station;
    previous_station?: Station;
    neighbour_station_names_use_line_color?: boolean;
    bold_next_station_name?: boolean;
    bold_previous_station_name?: boolean;
    width: number;
    height: number;
    bg_color: string;
    fg_color: string;
    font_override_regular?: string;
    font_override_bold?: string;
}

const default_nameplate_options: NameplateOptions = {
    show_line_color: true,
    show_line_name: true,
    show_icon: true,
    next_direction: "left",
    neighbour_station_names_use_line_color: false,
    bold_next_station_name: false,
    bold_previous_station_name: false,
    width: 800,
    height: 200,
    bg_color: "#FFFFFF",
    fg_color: "#001180"
};

export const generate_nameplate = (station: Station, line: Line, options: Partial<NameplateOptions> = default_nameplate_options) => {
    const opts = {...default_nameplate_options, ...options};

    const canvas = get_canvas(opts.width, opts.height);
    const ctx = canvas.getContext("2d");

    // fill bg
    ctx.fillStyle = opts.bg_color;
    ctx.fillRect(0, 0, opts.width, opts.height);

    // TODO: ability to override these ratios
    const font_sizes = {
        small: opts.width / 35,
        medium: opts.width / 24,
        large: opts.width / 11
    };

    // write station name
    ctx.fillStyle = opts.fg_color;
    ctx.font = opts.font_override_bold ?? `bold ${font_sizes.large}px label-icons, NameplateBold`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const text_x = opts.width / 2;
    const text_y = opts.height / 2;

    // include icon if requested
    let nameplate_text = station.name;
    if (opts.show_icon && station.icon) {
        nameplate_text = `${station.name} ${ICONS[station.icon]}`;
    }

    ctx.fillText(nameplate_text, text_x, text_y);

    // add line color bar if requested
    if (opts.show_line_color) {
        const bar_height = 10;
        ctx.fillStyle = line.color;
        ctx.fillRect(0, opts.height - bar_height, opts.width, bar_height);
    }

    // add line name if requested
    if (opts.show_line_name) {
        ctx.font = opts.font_override_regular ?? `${font_sizes.medium}px label-icons, NameplateRegular`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(line.name, 10, 10);
    }

    // add next and previous stations along bottom with arrows if given, ensuring the next direction is respected
    if (opts.next_station || opts.previous_station) {
        const regular_neighbour_font = opts.font_override_regular ?? `${font_sizes.small}px label-icons, NameplateRegular`;
        const bold_neighbour_font = opts.font_override_bold ?? `bold ${font_sizes.small}px label-icons, NameplateBold`;

        ctx.textBaseline = "bottom";

        if (opts.neighbour_station_names_use_line_color) {
            ctx.fillStyle = line.color;
        } else {
            ctx.fillStyle = opts.fg_color;
        }

        const left_station = opts.next_direction === "left" ? opts.next_station : opts.previous_station;
        const right_station = opts.next_direction === "left" ? opts.previous_station : opts.next_station;

        if (left_station) {
            ctx.textAlign = "left";

            if (opts.next_direction === "left" && opts.bold_next_station_name || opts.next_direction === "right" && opts.bold_previous_station_name) {
                ctx.font = bold_neighbour_font;
            } else {
                ctx.font = regular_neighbour_font;
            }

            ctx.fillText(`${ICONS.arrow_left} ${left_station.name}`, 10, opts.height - 12);
        }

        if (right_station) {
            ctx.textAlign = "right";

            if (opts.next_direction === "right" && opts.bold_next_station_name || opts.next_direction === "left" && opts.bold_previous_station_name) {
                ctx.font = bold_neighbour_font;
            } else {
                ctx.font = regular_neighbour_font;
            }

            ctx.fillText(`${right_station.name} ${ICONS.arrow_right}`, opts.width - 10, opts.height - 12)
        }
    }

    return canvas.toBuffer("image/png");
}

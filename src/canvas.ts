import { existsSync } from "fs";
import { join } from "path";
import { GlobalFonts, createCanvas } from "@napi-rs/canvas";

const module_dir = __dirname;

// aliases, so that we can change the underlying font file without changing the code that uses it
export const NAMEPLATE_REGULAR = "NameplateRegular";
export const NAMEPLATE_BOLD = "NameplateBold";
export const LABEL_ICONS = "label-icons";

const ASSET_DIRECTORY = join(module_dir, "..", "assets");

interface BundledFont {
    readonly alias: string;
    readonly filename: string;
}

const BUNDLED_FONTS: readonly BundledFont[] = [
    { alias: NAMEPLATE_REGULAR, filename: "PT_Sans/PTSans-Regular.ttf" },
    { alias: NAMEPLATE_BOLD, filename: "PT_Sans/PTSans-Bold.ttf" },
    { alias: LABEL_ICONS, filename: "tennessine/label-icons.ttf" },
];

let already_registered = false;

const register_bundled_fonts = () => {
    if (already_registered) return;

    for (const { alias, filename } of BUNDLED_FONTS) {
        const fontPath = join(ASSET_DIRECTORY, filename);

        if (!existsSync(fontPath)) {
            throw new Error(`Bundled font missing at ${fontPath}.`);
        }

        if (!GlobalFonts.registerFromPath(fontPath, alias)) {
            throw new Error(`Skia rejected the font file at ${fontPath}.`);
        }
    }

    already_registered = true;
}

export const get_canvas = (width: number, height: number) => {
    register_bundled_fonts();
    return createCanvas(width, height);
}

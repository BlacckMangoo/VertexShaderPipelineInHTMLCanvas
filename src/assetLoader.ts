import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";
import jpeg from "jpeg-js";
import type { Mesh, Point } from "./primitiveData";

const ROOT = process.cwd();
const MODELS_DIR = path.join(ROOT, "dist/assets/models");
const OUTPUT_FILE = path.join(ROOT, "src/loadedObj.ts");

function parseOBJ(name: string, text: string): Mesh {
    const vertices: Point[] = [];
    const triangleIndicesData: [number, number, number][] = [];

    for (const line of text.split("\n")) {
        const t = line.trim();
        if (!t) continue;

        const p = t.split(/\s+/);

        if (p[0] === "v") {
            vertices.push({ x: +p[1], y: +p[2], z: +p[3] });
        }

        if (p[0] === "f") {
            triangleIndicesData.push([
                Number(p[1].split("/")[0]) - 1,
                Number(p[2].split("/")[0]) - 1,
                Number(p[3].split("/")[0]) - 1
            ]);
        }
    }

    return { name, vertices, triangleIndicesData };
}

function exportName(file: string): string {
    const base = path.basename(file, ".obj").replace(/[^a-zA-Z0-9_]/g, "_");
    return /^\d/.test(base) ? `_${base}` : base;
}

function stringifyTS(obj : any): string {
    return JSON.stringify(obj, null, 2)
        .replace(/"([^"]+)":/g, "$1:");
}

function generateObj(meshes: any[]): string {
    return [
        `import type { Mesh } from "./primitiveData";`,
        "",
        ...meshes.map(m =>
`export const ${m.exportName}: Mesh = ${stringifyTS(m.mesh)};`
        ),
        "",
        `export const allLoadedObjs: Mesh[] = [${meshes.map(m => m.exportName).join(", ")}];`,
        ""
    ].join("\n\n");
}
const meshes = fs.readdirSync(MODELS_DIR)
    .filter(f => f.endsWith(".obj"))
    .sort()
    .map(file => ({
        exportName: exportName(file),
        mesh: parseOBJ(file, fs.readFileSync(path.join(MODELS_DIR, file), "utf-8"))
    }));

fs.writeFileSync(OUTPUT_FILE, generateObj(meshes));


// Textures 

const TEXTURES_DIR = path.join(ROOT, "dist/assets/textures");
const OUTPUT_TEXTURES_FILE = path.join(ROOT, "src/loadedTextures.ts");

// we take an HTML Image - > convert into a 1D array of RGBA values - > export as a TS file
// we are using UInt8clamped array , automatically clamps values to [0,255] perfect for RGBA data 
function imageToRGBATexture(fileName : string , targetWidth = 512, targetHeight = 512) {
    const filePath = path.join(TEXTURES_DIR, fileName);
    const fileData = fs.readFileSync(filePath);
    const extension = path.extname(fileName).toLowerCase();

    let imageData: Uint8ClampedArray;

    if (extension === ".png") {
        const decodedPng = PNG.sync.read(fileData);
        imageData = new Uint8ClampedArray(decodedPng.data);
        imageData = downscaleTexture(imageData, decodedPng.width, decodedPng.height, targetWidth, targetHeight);
    } else if (extension === ".jpg" || extension === ".jpeg") {
        const decodedJpeg = jpeg.decode(fileData, { useTArray: true });
        imageData = new Uint8ClampedArray(decodedJpeg.data);
        imageData = downscaleTexture(imageData, decodedJpeg.width, decodedJpeg.height, targetWidth, targetHeight);
    } else {
        throw new Error(`Unsupported texture format: ${fileName}`);
    }


    return {
        width: targetWidth,
        height: targetHeight,
        data: Array.from(imageData)
    };

}

function downscaleTexture (texture : Uint8ClampedArray, originalWidth: number, originalHeight: number, targetWidth: number, targetHeight: number): Uint8ClampedArray {
    const downscaledData = new Uint8ClampedArray(targetWidth * targetHeight * 4);
    const xRatio = originalWidth / targetWidth;
    const yRatio = originalHeight / targetHeight;

    for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
            // Nearest-neighbor downscaling 
            // basically we are mapping each pixel in the downscaled texture to a corresponding pixel in the original texture based on the ratio of their dimensions.
            const srcX = Math.floor(x * xRatio);
            const srcY = Math.floor(y * yRatio);
            const srcIndex = (srcY * originalWidth + srcX) * 4;
            const dstIndex = (y * targetWidth + x) * 4;

            downscaledData[dstIndex] = texture[srcIndex];       // R
            downscaledData[dstIndex + 1] = texture[srcIndex + 1]; // G
            downscaledData[dstIndex + 2] = texture[srcIndex + 2]; // B
            downscaledData[dstIndex + 3] = texture[srcIndex + 3]; // A

        }
    }

    return downscaledData;
}

function generateTextureTS(textures: any[]): string {
    return [
        `export const textures = {`,
        ...textures.map(t => `  ${t.exportName}: ${stringifyTS(t.texture)},`),
        `};`
    ].join("\n");
}

const textures = fs.readdirSync(TEXTURES_DIR)
    .filter(f => f.endsWith(".png") || f.endsWith(".jpg"))
    .sort()
    .map(file => ({
        exportName: exportName(file),

        texture: imageToRGBATexture(file)   
    }));

fs.writeFileSync(OUTPUT_TEXTURES_FILE, generateTextureTS(textures));
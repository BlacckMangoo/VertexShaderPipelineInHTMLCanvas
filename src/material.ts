import type { Texture } from "./texture.js";
import { textures } from "./loadedTextures.js";

export interface MaterialColor {
    r: number;
    g: number;
    b: number;
    a: number;
}

const checkersTexture: Texture = textures.checkers_png;
const roughTexture: Texture = textures.rough_jpg;


export interface Material {
    name : string;
    texture : Texture; 
    color : MaterialColor;
}


export const defaultMaterial: Material = {
    name: "default",
    texture : roughTexture,
    color: { r: 255, g: 255, b: 255, a: 255 }
};

export const roughMaterial: Material = {
    name: "rough",
    texture : roughTexture,
    color: { r: 255, g: 255, b: 255, a: 255 }
};

export const transparentMaterial: Material = {
    name: "transparent",
    texture : checkersTexture,
    color: { r: 255, g: 255, b: 255, a: 128 }
};
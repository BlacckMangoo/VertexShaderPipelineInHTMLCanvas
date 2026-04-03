export interface Texture {
    width: number;
    height: number;
    data: number[];
}

export type TextureMap = Record<string, Texture>;

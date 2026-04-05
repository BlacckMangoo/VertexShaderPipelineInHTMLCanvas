import { Material } from "./material";
import { Vec3 } from "./math";
import { defaultMaterial, roughMaterial, transparentMaterial } from "./material.js";


interface Point {
   pos : Vec3 ;
    u : number;
    v : number;
    wInv?: number;
}

interface Mesh {
    name    : string;
    vertices: Point[];
    triangleIndicesData: Array<[number, number, number]>;
    material: Material ;
}


const cubeVertexData : Point[] = [
    // front face (z = 0.5)
    {pos: { x: -0.5, y: -0.5, z: 0.5 }, u: 0, v: 1 },
    { pos: { x: 0.5, y: -0.5, z: 0.5 }, u: 1, v: 1 },
    { pos: { x: 0.5, y: 0.5, z: 0.5 }, u: 1, v: 0 },
    { pos: { x: -0.5, y: 0.5, z: 0.5 }, u: 0, v: 0 },
    // back face (z = -0.5)
    { pos: { x: -0.5, y: -0.5, z: -0.5 }, u: 0, v: 1 },
    { pos: { x: 0.5, y: -0.5, z: -0.5 }, u: 1, v: 1 },
    { pos: { x: 0.5, y: 0.5, z: -0.5 }, u: 1, v: 0 },
    { pos: { x: -0.5, y: 0.5, z: -0.5 }, u: 0, v: 0 },

    //side faces
    { pos: { x: -0.5, y: -0.5, z: 0.5 }, u: 0, v: 1 },
    { pos: { x: -0.5, y: 0.5, z: 0.5 }, u: 0, v: 0 },
    { pos: { x: -0.5, y: 0.5, z: -0.5 }, u: 1, v: 0 },
    { pos: { x: -0.5, y: -0.5, z: -0.5 }, u: 1, v: 1 },

    { pos: { x: 0.5, y: -0.5, z: 0.5 }, u: 0, v: 1 },
    { pos: { x: 0.5, y: 0.5, z: 0.5 }, u: 0, v: 0 },
    { pos: { x: 0.5, y: 0.5, z: -0.5 }, u: 1, v: 0 },
    { pos: { x: 0.5, y: -0.5, z: -0.5 }, u: 1, v: 1 },

    // top face
    { pos: { x: -0.5, y: 0.5, z: 0.5 }, u: 0, v: 0 },
    { pos: { x: 0.5, y: 0.5, z: 0.5 }, u: 1, v: 0 },
    { pos: { x: 0.5, y: 0.5, z: -0.5 }, u: 1, v: 1 },
    { pos: { x: -0.5, y: 0.5, z: -0.5 }, u: 0, v: 1 },
    // bottom face
    { pos: { x: -0.5, y: -0.5, z: 0.5 }, u: 0, v: 0 },
    { pos: { x: 0.5, y: -0.5, z: 0.5 }, u: 1, v: 0 },
    { pos: { x: 0.5, y: -0.5, z: -0.5 }, u: 1, v: 1 },
    { pos: { x: -0.5, y: -0.5, z: -0.5 }, u: 0, v: 1 },

];

       


const TriangleVertexData: Point[] = [
   // [pos] , [u, v]
    {pos: { x: 0, y: 0.5, z: 0 }, u: 0.5, v: 0 },
    { pos: { x: -0.5, y: -0.5, z: 0 }, u: 0, v: 1 },
    { pos: { x: 0.5, y: -0.5, z: 0 }, u: 1, v: 1 },
];

const quadVertexData: Point[] = [
    { pos: { x: -0.5, y: 0.5, z: 0 }, u: 0, v: 0 },
    { pos: { x: -0.5, y: -0.5, z: 0 }, u: 0, v: 1 },
    { pos: { x: 0.5, y: -0.5, z: 0 }, u: 1, v: 1 },
    { pos: { x: 0.5, y: 0.5, z: 0 }, u: 1, v: 0 }
];

const quadMesh : Mesh = {
    name : "quad",
    vertices: quadVertexData,
    triangleIndicesData: [
        [0, 1, 2],
        [0, 2, 3]
    ],
    material: transparentMaterial
};

const cubeMESH: Mesh = {
    name : "cube",
    vertices: cubeVertexData,
    triangleIndicesData: [
        [0, 1, 2],
        [0, 2, 3],
        [4, 6, 5],
        [4, 7, 6],
        [8, 9, 10],
        [8, 10, 11],
        [12, 14, 13],
        [12, 15, 14],
        [16, 17, 18],
        [16, 18, 19],
        [20, 22, 21],
        [20, 23, 22]
    ],
    material: roughMaterial

};

const triangleMESH: Mesh = {
    name : "triangle",
    vertices: TriangleVertexData,
    triangleIndicesData: [
        [0, 1, 2]
    ],
    material: defaultMaterial

};


export { cubeMESH, triangleMESH, quadMesh, Mesh, Point };
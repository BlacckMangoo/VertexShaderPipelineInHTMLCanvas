import { defaultMaterial, roughMaterial, transparentMaterial } from "./material.js";
const cubeVertexData = [
    // front face (z = 0.5)
    { pos: { x: -0.5, y: -0.5, z: 0.5 }, u: 0, v: 1 },
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
const TriangleVertexData = [
    // [pos] , [u, v]
    { pos: { x: 0, y: 0.5, z: 0 }, u: 0.5, v: 0 },
    { pos: { x: -0.5, y: -0.5, z: 0 }, u: 0, v: 1 },
    { pos: { x: 0.5, y: -0.5, z: 0 }, u: 1, v: 1 },
];
const quadVertexData = [
    { pos: { x: -0.5, y: 0.5, z: 0 }, u: 0, v: 0 },
    { pos: { x: -0.5, y: -0.5, z: 0 }, u: 0, v: 1 },
    { pos: { x: 0.5, y: -0.5, z: 0 }, u: 1, v: 1 },
    { pos: { x: 0.5, y: 0.5, z: 0 }, u: 1, v: 0 }
];
const quadMesh = {
    name: "quad",
    vertices: quadVertexData,
    triangleIndicesData: [
        [0, 1, 2],
        [0, 2, 3]
    ],
    material: transparentMaterial
};
const cubeMESH = {
    name: "cube",
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
const triangleMESH = {
    name: "triangle",
    vertices: TriangleVertexData,
    triangleIndicesData: [
        [0, 1, 2]
    ],
    material: defaultMaterial
};
export { cubeMESH, triangleMESH, quadMesh };

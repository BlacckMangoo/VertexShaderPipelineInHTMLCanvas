import { allLoadedObjs } from "./loadedObj.js";
import { cubeMESH, quadMesh, triangleMESH } from "./primitiveData.js";
import type { Mesh } from "./primitiveData.js";

export const primitiveMeshes: Mesh[] = [cubeMESH, quadMesh, triangleMESH];

export const allMeshes: Mesh[] = [...primitiveMeshes, ...allLoadedObjs];

export const meshRegistery: Record<string, Mesh> = {};

allMeshes.forEach((mesh) => {
    if (meshRegistery[mesh.name]) {
        throw new Error(`Duplicate mesh name '${mesh.name}' in mesh registry.`);
    }
    meshRegistery[mesh.name] = mesh;
});

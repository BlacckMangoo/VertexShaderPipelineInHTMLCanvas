export type MeshTransformState = {
    position: {
        x: number;
        y: number;
        z: number;
    };
    rotationAxis: {
        x: number;
        y: number;
        z: number;
    };
    scale: {
        x: number;
        y: number;
        z: number;
    };
    rotationAngle: number;
    parentTranformState: MeshTransformState | null;
};

export const rootTransformState: MeshTransformState = {
    position: { x: 0, y: 0, z: 0 },
    rotationAxis: { x: 0, y: 1, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    rotationAngle: 0,
    parentTranformState: null,
};

export function createTransform(): MeshTransformState {
    return {
        position: { x: 0, y: 0, z: 0 },
        rotationAxis: { x: 0, y: 1, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        rotationAngle: 0,
        parentTranformState: rootTransformState,
    };
}

export const mesheTransforms: Record<string, MeshTransformState> = {};

export function ensureMeshStates(meshNames: string[]): void {
    meshNames.forEach((meshName) => {
        if (!mesheTransforms[meshName]) {
            mesheTransforms[meshName] = createTransform();
        }
    });
}

export function syncMeshStates(meshNames: string[]): void {
    const active = new Set(meshNames);

    Object.keys(mesheTransforms).forEach((meshName) => {
        if (!active.has(meshName)) {
            delete mesheTransforms[meshName];
        }
    });

    ensureMeshStates(meshNames);
}

export function setMeshTransformState(meshName: string, newState: MeshTransformState): void {
    mesheTransforms[meshName] = newState;
}

export function getMeshTransformState(meshName: string): MeshTransformState {
    if (!mesheTransforms[meshName]) {
        mesheTransforms[meshName] = createTransform();
    }
    return mesheTransforms[meshName];
}

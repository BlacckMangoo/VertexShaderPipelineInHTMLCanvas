
// UI shouldnt know about the renderer 
//renderer shouldnt know about the UI

// we maintain a global state object that the UI can modify and the renderer can read from.
// THE UI Writes new state to the global state object, and the renderer reads from it every frame to render the scene accordingly.
//Globals 

//cam

const defaultCameraState = {
    position: {
        x: 0,
        y: 0,
        z: 5,
    },
    fov : 60,
    near : 0.1,
    far : 100,
};

export const cameraState = {
    position: { ...defaultCameraState.position },
    fov: defaultCameraState.fov,
    near: defaultCameraState.near,
    far: defaultCameraState.far,
};

export function setCameraState(newState: Partial<typeof cameraState>) {
    Object.assign(cameraState, newState);
}

export function getCameraState() {
    return cameraState;
}

export function resetCameraState() {
    cameraState.position = { ...defaultCameraState.position };
    cameraState.fov = defaultCameraState.fov;
    cameraState.near = defaultCameraState.near;
    cameraState.far = defaultCameraState.far;
}

//UI state 

export const uiState = {
    selectedMesh: null as string | null,
};

export function setUIState(newState: Partial<typeof uiState>) {
    Object.assign(uiState, newState);
}

export function getUIState() {
    return uiState;
}

function createDefaultTransform(): MeshTransformState {
    return {
        position: { x: 0, y: 0, z: 0 },
        rotationAxis: { x: 0, y: 1, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        rotationAngle: 0
    }
}



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
};

export const mesheTransforms : Record<string, MeshTransformState> = {}; 

export function ensureMeshStates(meshNames: string[]) {
    meshNames.forEach((meshName) => {
        if (!mesheTransforms[meshName]) {
            mesheTransforms[meshName] = createDefaultTransform();
        }
    });
}

export function syncMeshStates(meshNames: string[]) {
    const active = new Set(meshNames);

    Object.keys(mesheTransforms).forEach((meshName) => {
        if (!active.has(meshName)) {
            delete mesheTransforms[meshName];
        }
    });

    ensureMeshStates(meshNames);
}

export function setMeshTransformState(meshName: string, newState: Partial<MeshTransformState>) {
    if (!mesheTransforms[meshName]) {
        mesheTransforms[meshName] = createDefaultTransform();
    }
    Object.assign(mesheTransforms[meshName], newState);
}

export function getMeshTransformState(meshName: string): MeshTransformState {
    if (!mesheTransforms[meshName]) {
        mesheTransforms[meshName] = createDefaultTransform();
    }
    return mesheTransforms[meshName];
}


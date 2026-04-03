// UI shouldnt know about the renderer 
//renderer shouldnt know about the UI
// we maintain a global state object that the UI can modify and the renderer can read from.
// THE UI Writes new state to the global state object, and the renderer reads from it every frame to render the scene accordingly.
//Globals 
//cam
export const cameraState = {
    position: { x: 0, y: 0, z: 5 },
    lookAt: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
    far: 100,
    near: 0.1,
    fov: 60,
    ar: 1
};
export function setCameraState(newState) {
    Object.assign(cameraState, newState);
}
export function getCameraState() {
    return cameraState;
}
export function resetCameraState() {
    setCameraState({
        position: { x: 0, y: 0, z: 5 },
        lookAt: { x: 0, y: 0, z: 0 },
        up: { x: 0, y: 1, z: 0 },
        far: 100,
        near: 0.1,
        fov: 60,
        ar: 1
    });
}
//UI state 
export const uiState = {
    selectedMesh: null,
};
export function setUIState(newState) {
    Object.assign(uiState, newState);
}
export function getUIState() {
    return uiState;
}
function createDefaultTransform() {
    return {
        position: { x: 0, y: 0, z: 0 },
        rotationAxis: { x: 0, y: 1, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        rotationAngle: 0
    };
}
export const mesheTransforms = {};
export function ensureMeshStates(meshNames) {
    meshNames.forEach((meshName) => {
        if (!mesheTransforms[meshName]) {
            mesheTransforms[meshName] = createDefaultTransform();
        }
    });
}
export function syncMeshStates(meshNames) {
    const active = new Set(meshNames);
    Object.keys(mesheTransforms).forEach((meshName) => {
        if (!active.has(meshName)) {
            delete mesheTransforms[meshName];
        }
    });
    ensureMeshStates(meshNames);
}
export function setMeshTransformState(meshName, newState) {
    if (!mesheTransforms[meshName]) {
        mesheTransforms[meshName] = createDefaultTransform();
    }
    Object.assign(mesheTransforms[meshName], newState);
}
export function getMeshTransformState(meshName) {
    if (!mesheTransforms[meshName]) {
        mesheTransforms[meshName] = createDefaultTransform();
    }
    return mesheTransforms[meshName];
}

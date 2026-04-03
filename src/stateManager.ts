
import type { Camera } from "./math.js";
import { getCameraState as getCameraFromModule, setCameraState as setCameraInModule } from "./camera.js";
import type { MeshTransformState } from "./transform.js";
import { getMeshTransformState as getMeshTransformFromModule, setMeshTransformState as setMeshTransformInModule } from "./transform.js";

export const uiState = {
    selectedMesh: null as string | null,
};

export function setUIState(selectedMesh: string | null): void {
    uiState.selectedMesh = selectedMesh;
}

export function getUIState(): typeof uiState {
    return uiState;
}

export function setCameraState(newState: Camera): void {
    setCameraInModule(newState);
}

export function getCameraState(): Camera {
    return getCameraFromModule();
}

export function setMeshTransformState(meshName: string, newState: MeshTransformState): void {
    setMeshTransformInModule(meshName, newState);
}

export function getMeshTransformState(meshName: string): MeshTransformState {
    return getMeshTransformFromModule(meshName);
}


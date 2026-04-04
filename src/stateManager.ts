
import type { Camera, Vec3 } from "./math.js";
import { getCameraState as getCameraFromModule, setCameraState as setCameraInModule } from "./camera.js";
import type { MeshTransformState } from "./transform.js";
import { getMeshTransformState as getMeshTransformFromModule, setMeshTransformState as setMeshTransformInModule } from "./transform.js";

export const uiState = {
    selectedMesh: null as string | null,
};

export interface LightingState {
    lightDirection: Vec3;
    ambientStrength: number;
}

export interface RenderState {
    drawWireframe: boolean;
}

const lightingState: LightingState = {
    lightDirection: { x: 0.4, y: 0.8, z: 0.6 },
    ambientStrength: 0.15,
};

const renderState: RenderState = {
    drawWireframe: true,
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

export function setLightingState(newState: LightingState): void {
    lightingState.lightDirection = { ...newState.lightDirection };
    lightingState.ambientStrength = newState.ambientStrength;
}

export function getLightingState(): LightingState {
    return lightingState;
}

export function setRenderState(newState: RenderState): void {
    renderState.drawWireframe = newState.drawWireframe;
}

export function getRenderState(): RenderState {
    return renderState;
}


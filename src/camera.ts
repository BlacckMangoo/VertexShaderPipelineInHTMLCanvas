import type { Camera, Vec3 } from "./math.js";

export function createCam(ar: number = 1): Camera {
    return {
        position: { x: 0, y: 0, z: 5 },
        lookAt: { x: 0, y: 0, z: 0 },
        up: { x: 0, y: 1, z: 0 },
        far: 100,
        near: 0.1,
        fov: 60,
        ar,
    };
}

export const cameraState: Camera = createCam();

export function setCameraState(newState: Camera): void {
    cameraState.position = newState.position;
    cameraState.lookAt = newState.lookAt;
    cameraState.up = newState.up;
    cameraState.far = newState.far;
    cameraState.near = newState.near;
    cameraState.fov = newState.fov;
    cameraState.ar = newState.ar;
}

export function getCameraState(): Camera {
    return cameraState;
}

export function updateCameraLookAt(position: Vec3): Vec3 {
    const cameraForward: Vec3 = { x: 0, y: 0, z: -1 };
    return {
        x: position.x + cameraForward.x,
        y: position.y + cameraForward.y,
        z: position.z + cameraForward.z,
    };
}


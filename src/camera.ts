import {  Vec3 } from "./math.js";
import { getCameraState } from "./stateManager";


export interface Camera {
    position: Vec3;
    lookAt: Vec3;
    up: Vec3;
    far : number;
    near : number;
    fov : number;
    ar : number 
}

export function updateCameraLookAt(position: Vec3): Vec3 {
    const cameraForward: Vec3 = { x: 0, y: 0, z: -1 };
    return {
        x: position.x + cameraForward.x,
        y: position.y + cameraForward.y,
        z: position.z + cameraForward.z,

    };
}
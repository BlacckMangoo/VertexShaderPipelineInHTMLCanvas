export function updateCameraLookAt(position) {
    const cameraForward = { x: 0, y: 0, z: -1 };
    return {
        x: position.x + cameraForward.x,
        y: position.y + cameraForward.y,
        z: position.z + cameraForward.z,
    };
}

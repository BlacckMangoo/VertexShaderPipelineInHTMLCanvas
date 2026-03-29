"use strict";
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const aspectRatio = canvas.width / canvas.height;
const cellSize = 5;
function dotProduct(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}
function normalise(v) {
    const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    return {
        x: v.x / length,
        y: v.y / length,
        z: v.z / length,
    };
}
function crossProduct(a, b) {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x,
    };
}
function TransposeMatrix3(matrix) {
    return {
        r1: { x: matrix.r1.x, y: matrix.r2.x, z: matrix.r3.x },
        r2: { x: matrix.r1.y, y: matrix.r2.y, z: matrix.r3.y },
        r3: { x: matrix.r1.z, y: matrix.r2.z, z: matrix.r3.z },
    };
}
function GranShmidtProcess(v) {
    // we take a Vector , normalise and generate a new basis such that that vector is the first vector of the basis and the other two are orthogonal to it and each other
    const r1 = normalise(v);
    const arbitraryVector = { x: 0, y: 1, z: 0 };
    // make sure the arbitrary vector is not parallel to r1
    if (Math.abs(dotProduct(r1, arbitraryVector)) > 0.99) {
        arbitraryVector.x = 1; // change to a different vector if they are parallel
        arbitraryVector.y = 0;
    }
    // remove the component of the arbitrary vector that is in the direction of r1
    const projectionLength = dotProduct(arbitraryVector, r1);
    const projection = {
        x: projectionLength * r1.x,
        y: projectionLength * r1.y,
        z: projectionLength * r1.z,
    };
    const r2 = {
        x: arbitraryVector.x - projection.x,
        y: arbitraryVector.y - projection.y,
        z: arbitraryVector.z - projection.z,
    };
    const r2Normalised = normalise(r2);
    const r3 = crossProduct(r1, r2Normalised);
    const transposedResult = TransposeMatrix3({ r1, r2: r2Normalised, r3 });
    return transposedResult;
    //FINAL MATRIX IN THE FORM 
    //{ [ e1.x e2.x e3.x ]}
    //{ [ e1.y e2.y e3.y ]}
    //{ [ e1.z e2.z e3.z ]} 
    // where e1 is the normalised input vector and e2 and e3 are the orthogonal vectors generated from the process
}
const identityMatrix4 = {
    r1: { x: 1, y: 0, z: 0, w: 0 },
    r2: { x: 0, y: 1, z: 0, w: 0 },
    r3: { x: 0, y: 0, z: 1, w: 0 },
    r4: { x: 0, y: 0, z: 0, w: 1 },
};
const identityMatrix3 = {
    r1: { x: 1, y: 0, z: 0 },
    r2: { x: 0, y: 1, z: 0 },
    r3: { x: 0, y: 0, z: 1 },
};
function LogMatrix4(matrix) {
    console.log(`${matrix.r1.x} ${matrix.r1.y} ${matrix.r1.z} ${matrix.r1.w}\n` +
        `${matrix.r2.x} ${matrix.r2.y} ${matrix.r2.z} ${matrix.r2.w}\n` +
        `${matrix.r3.x} ${matrix.r3.y} ${matrix.r3.z} ${matrix.r3.w}\n` +
        `${matrix.r4.x} ${matrix.r4.y} ${matrix.r4.z} ${matrix.r4.w}\n`);
}
function LogMatrix3(matrix) {
    console.log(`${matrix.r1.x} ${matrix.r1.y} ${matrix.r1.z}\n` +
        `${matrix.r2.x} ${matrix.r2.y} ${matrix.r2.z}\n` +
        `${matrix.r3.x} ${matrix.r3.y} ${matrix.r3.z}\n`);
}
function LogVec3(vec) {
    console.log(`${vec.x} ${vec.y} ${vec.z}`);
}
function multiplyMatrix4(a, b) {
    const r1 = {
        x: a.r1.x * b.r1.x + a.r1.y * b.r2.x + a.r1.z * b.r3.x + a.r1.w * b.r4.x,
        y: a.r1.x * b.r1.y + a.r1.y * b.r2.y + a.r1.z * b.r3.y + a.r1.w * b.r4.y,
        z: a.r1.x * b.r1.z + a.r1.y * b.r2.z + a.r1.z * b.r3.z + a.r1.w * b.r4.z,
        w: a.r1.x * b.r1.w + a.r1.y * b.r2.w + a.r1.z * b.r3.w + a.r1.w * b.r4.w
    };
    const r2 = {
        x: a.r2.x * b.r1.x + a.r2.y * b.r2.x + a.r2.z * b.r3.x + a.r2.w * b.r4.x,
        y: a.r2.x * b.r1.y + a.r2.y * b.r2.y + a.r2.z * b.r3.y + a.r2.w * b.r4.y,
        z: a.r2.x * b.r1.z + a.r2.y * b.r2.z + a.r2.z * b.r3.z + a.r2.w * b.r4.z,
        w: a.r2.x * b.r1.w + a.r2.y * b.r2.w + a.r2.z * b.r3.w + a.r2.w * b.r4.w
    };
    const r3 = {
        x: a.r3.x * b.r1.x + a.r3.y * b.r2.x + a.r3.z * b.r3.x + a.r3.w * b.r4.x,
        y: a.r3.x * b.r1.y + a.r3.y * b.r2.y + a.r3.z * b.r3.y + a.r3.w * b.r4.y,
        z: a.r3.x * b.r1.z + a.r3.y * b.r2.z + a.r3.z * b.r3.z + a.r3.w * b.r4.z,
        w: a.r3.x * b.r1.w + a.r3.y * b.r2.w + a.r3.z * b.r3.w + a.r3.w * b.r4.w
    };
    const r4 = {
        x: a.r4.x * b.r1.x + a.r4.y * b.r2.x + a.r4.z * b.r3.x + a.r4.w * b.r4.x,
        y: a.r4.x * b.r1.y + a.r4.y * b.r2.y + a.r4.z * b.r3.y + a.r4.w * b.r4.y,
        z: a.r4.x * b.r1.z + a.r4.y * b.r2.z + a.r4.z * b.r3.z + a.r4.w * b.r4.z,
        w: a.r4.x * b.r1.w + a.r4.y * b.r2.w + a.r4.z * b.r3.w + a.r4.w * b.r4.w
    };
    return { r1, r2, r3, r4 };
}
function multiplyMatrix3(a, b) {
    const r1 = {
        x: a.r1.x * b.r1.x + a.r1.y * b.r2.x + a.r1.z * b.r3.x,
        y: a.r1.x * b.r1.y + a.r1.y * b.r2.y + a.r1.z * b.r3.y,
        z: a.r1.x * b.r1.z + a.r1.y * b.r2.z + a.r1.z * b.r3.z
    };
    const r2 = {
        x: a.r2.x * b.r1.x + a.r2.y * b.r2.x + a.r2.z * b.r3.x,
        y: a.r2.x * b.r1.y + a.r2.y * b.r2.y + a.r2.z * b.r3.y,
        z: a.r2.x * b.r1.z + a.r2.y * b.r2.z + a.r2.z * b.r3.z
    };
    const r3 = {
        x: a.r3.x * b.r1.x + a.r3.y * b.r2.x + a.r3.z * b.r3.x,
        y: a.r3.x * b.r1.y + a.r3.y * b.r2.y + a.r3.z * b.r3.y,
        z: a.r3.x * b.r1.z + a.r3.y * b.r2.z + a.r3.z * b.r3.z
    };
    return { r1, r2, r3 };
}
function multiplyMatrix3Vec3(matrix, vec) {
    return {
        x: matrix.r1.x * vec.x + matrix.r1.y * vec.y + matrix.r1.z * vec.z,
        y: matrix.r2.x * vec.x + matrix.r2.y * vec.y + matrix.r2.z * vec.z,
        z: matrix.r3.x * vec.x + matrix.r3.y * vec.y + matrix.r3.z * vec.z
    };
}
function InverseMatrix3(matrix) {
    // we can find the inverse of a 3x3 matrix by finding the determinant and the adjugate matrix
    const det = matrix.r1.x * (matrix.r2.y * matrix.r3.z - matrix.r2.z * matrix.r3.y) - matrix.r1.y * (matrix.r2.x * matrix.r3.z - matrix.r2.z * matrix.r3.x) +
        matrix.r1.z * (matrix.r2.x * matrix.r3.y - matrix.r2.y * matrix.r3.x);
    const adjugate = {
        r1: {
            x: matrix.r2.y * matrix.r3.z - matrix.r2.z * matrix.r3.y,
            y: matrix.r1.z * matrix.r3.y - matrix.r1.y * matrix.r3.z,
            z: matrix.r1.y * matrix.r2.z - matrix.r1.z * matrix.r2.y
        },
        r2: {
            x: matrix.r2.z * matrix.r3.x - matrix.r2.x * matrix.r3.z,
            y: matrix.r1.x * matrix.r3.z - matrix.r1.z * matrix.r3.x,
            z: matrix.r1.z * matrix.r2.x - matrix.r1.x * matrix.r2.z
        },
        r3: {
            x: matrix.r2.x * matrix.r3.y - matrix.r2.y * matrix.r3.x,
            y: matrix.r1.y * matrix.r3.x - matrix.r1.x * matrix.r3.y,
            z: matrix.r1.x * matrix.r2.y - matrix.r1.y * matrix.r2.x
        }
    };
    return {
        r1: {
            x: adjugate.r1.x / det,
            y: adjugate.r1.y / det,
            z: adjugate.r1.z / det
        },
        r2: {
            x: adjugate.r2.x / det,
            y: adjugate.r2.y / det,
            z: adjugate.r2.z / det
        },
        r3: {
            x: adjugate.r3.x / det,
            y: adjugate.r3.y / det,
            z: adjugate.r3.z / det
        }
    };
}
function convertPointFromNdcToScreenSpace(point) {
    const ndcX = point.x;
    const ndcy = point.y;
    return {
        x: ((ndcX + 1) / 2) * canvas.width,
        y: ((-ndcy + 1) / 2) * canvas.height,
        z: point.z,
    };
}
const RotateAroundXMatrix = (angle) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        r1: { x: 1, y: 0, z: 0 },
        r2: { x: 0, y: cos, z: -sin },
        r3: { x: 0, y: sin, z: cos }
    };
};
const RotateAroundYMatrix = (angle) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        r1: { x: cos, y: 0, z: sin },
        r2: { x: 0, y: 1, z: 0 },
        r3: { x: -sin, y: 0, z: cos }
    };
};
const RotateAroundZMatrix = (angle) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        r1: { x: cos, y: -sin, z: 0 },
        r2: { x: sin, y: cos, z: 0 },
        r3: { x: 0, y: 0, z: 1 }
    };
};
// instead of making a 4x4 matrix we will do translation step and change of basis step separately for conceptual understading 
function CameraBasis(cam) {
    // this is again just a change of basis operation 
    // first we need the orthonormal basis for the camera's coordinate system
    // they are simply the forward ,right and up vectors of the camera
    const forward = normalise({
        x: cam.lookAt.x - cam.position.x,
        y: cam.lookAt.y - cam.position.y,
        z: cam.lookAt.z - cam.position.z
    });
    const right = normalise(crossProduct(forward, cam.up));
    const up = crossProduct(right, forward);
    return {
        r1: right,
        r2: up,
        r3: { x: -forward.x, y: -forward.y, z: -forward.z }
        // we negate the forward vector because we want to transform points from world space to camera space and in camera space the camera is looking down the negative z axis
    };
}
function perspectiveProjection(point, cam) {
    const fov = cam.fov * (Math.PI / 180); // convert to radians
    const f = 1 / Math.tan(fov / 2);
    const ar = cam.ar;
    const near = cam.near;
    const far = cam.far;
    const projectionMatrix = {
        r1: { x: f / ar, y: 0, z: 0, w: 0 },
        r2: { x: 0, y: f, z: 0, w: 0 },
        r3: { x: 0, y: 0, z: (far + near) / (near - far), w: (2 * far * near) / (near - far) },
        r4: { x: 0, y: 0, z: -1, w: 0 }
    };
    const pointVec4 = { x: point.x, y: point.y, z: point.z, w: 1 };
    // multiply the projection matrix by the point vector to get the projected point in homogeneous coordinates
    const projectedVec4 = {
        x: projectionMatrix.r1.x * pointVec4.x + projectionMatrix.r1.y * pointVec4.y + projectionMatrix.r1.z * pointVec4.z + projectionMatrix.r1.w * pointVec4.w,
        y: projectionMatrix.r2.x * pointVec4.x + projectionMatrix.r2.y * pointVec4.y + projectionMatrix.r2.z * pointVec4.z + projectionMatrix.r2.w * pointVec4.w,
        z: projectionMatrix.r3.x * pointVec4.x + projectionMatrix.r3.y * pointVec4.y + projectionMatrix.r3.z * pointVec4.z + projectionMatrix.r3.w * pointVec4.w,
        w: projectionMatrix.r4.x * pointVec4.x + projectionMatrix.r4.y * pointVec4.y + projectionMatrix.r4.z * pointVec4.z + projectionMatrix.r4.w * pointVec4.w
    };
    // now we need to convert from homogeneous coordinates to 3d coordinates by dividing by w
    return {
        x: projectedVec4.x / projectedVec4.w,
        y: projectedVec4.y / projectedVec4.w,
        z: projectedVec4.z / projectedVec4.w
    };
}
const points = [
    // front face (z = 0.5)
    { x: -0.5, y: -0.5, z: 0.5 },
    { x: 0.5, y: -0.5, z: 0.5 },
    { x: 0.5, y: 0.5, z: 0.5 },
    { x: -0.5, y: 0.5, z: 0.5 },
    // back face (z = -0.5)
    { x: -0.5, y: -0.5, z: -0.5 },
    { x: 0.5, y: -0.5, z: -0.5 },
    { x: 0.5, y: 0.5, z: -0.5 },
    { x: -0.5, y: 0.5, z: -0.5 },
];
const cubeEdges = [
    // front face
    [0, 1], [1, 2], [2, 3], [3, 0],
    // back face
    [4, 5], [5, 6], [6, 7], [7, 4],
    // connecting edges
    [0, 4], [1, 5], [2, 6], [3, 7],
];
function drawPoint(p) {
    const point = convertPointFromNdcToScreenSpace(p);
    if (ctx) {
        ctx.fillStyle = "black";
        ctx.fillRect(point.x, point.y, cellSize, cellSize);
    }
}
function drawLine(p1, p2) {
    const point1 = convertPointFromNdcToScreenSpace(p1);
    const point2 = convertPointFromNdcToScreenSpace(p2);
    if (ctx) {
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(point1.x, point1.y);
        ctx.lineTo(point2.x, point2.y);
        ctx.stroke();
    }
}
function RotateAroundArbitraryAxisMatrix(input, axis, angle) {
    // normalise the axis of rotation
    const normalisedAxis = normalise(axis);
    // first find new basis with the arbitrary axis as the x axis of the new basis
    const basis = GranShmidtProcess(normalisedAxis);
    const inverseBasis = InverseMatrix3(basis);
    const newVecInNewBasis = multiplyMatrix3Vec3(inverseBasis, input);
    // now applying the Transformation 
    // Rotating around an arbitrary axis is the same as rotating around the X axis in the new basis
    const rotatedVecInNewBasis = multiplyMatrix3Vec3(RotateAroundXMatrix(angle), newVecInNewBasis);
    // now we need to convert back to the original basis
    const rotatedVecInOriginalBasis = multiplyMatrix3Vec3(basis, rotatedVecInNewBasis);
    return rotatedVecInOriginalBasis;
}
function TranslateVec3(vec, translation) {
    return {
        x: vec.x + translation.x,
        y: vec.y + translation.y,
        z: vec.z + translation.z,
    };
}
function ScaleVec3(vec, scale) {
    return {
        x: vec.x * scale.x,
        y: vec.y * scale.y,
        z: vec.z * scale.z,
    };
}
const controls = {
    camX: 0,
    camY: 0,
    camZ: 5,
    fov: 45,
    near: 0.1,
    far: 1000,
    rotDeg: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    translateX: 0,
    translateY: 0,
    translateZ: 0,
};
function createControlsPanel() {
    const panel = document.getElementById("controls");
    if (!panel) {
        throw new Error("Controls container with id 'controls' was not found.");
    }
    panel.style.position = "fixed";
    panel.style.top = "12px";
    panel.style.left = "12px";
    panel.style.width = "320px";
    panel.style.maxHeight = "calc(100vh - 24px)";
    panel.style.overflowY = "auto";
    panel.style.padding = "12px";
    panel.style.borderRadius = "8px";
    panel.style.backgroundColor = "rgba(255, 255, 255, 0.92)";
    panel.style.border = "1px solid #999";
    panel.style.fontFamily = "sans-serif";
    panel.style.zIndex = "10";
    const title = document.createElement("h3");
    title.textContent = "Scene Controls";
    title.style.margin = "0 0 10px 0";
    panel.appendChild(title);
    return panel;
}
function addSectionHeader(parent, text) {
    const header = document.createElement("div");
    header.textContent = text;
    header.style.margin = "10px 0 6px 0";
    header.style.fontWeight = "700";
    parent.appendChild(header);
}
function addSlider(parent, config) {
    const wrapper = document.createElement("div");
    wrapper.style.marginBottom = "8px";
    const label = document.createElement("label");
    label.style.display = "flex";
    label.style.justifyContent = "space-between";
    label.style.marginBottom = "2px";
    const caption = document.createElement("span");
    caption.textContent = config.label;
    const value = document.createElement("span");
    value.textContent = controls[config.key].toFixed(2);
    label.appendChild(caption);
    label.appendChild(value);
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(config.min);
    input.max = String(config.max);
    input.step = String(config.step);
    input.value = String(controls[config.key]);
    input.style.width = "100%";
    input.addEventListener("input", () => {
        controls[config.key] = Number(input.value);
        value.textContent = controls[config.key].toFixed(2);
    });
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    parent.appendChild(wrapper);
}
function addSliders(parent, configs) {
    configs.forEach((config) => addSlider(parent, config));
}
const controlsPanel = createControlsPanel();
addSliders(controlsPanel, [
    { key: "camX", label: "Cam X", min: -10, max: 10, step: 0.1 },
    { key: "camY", label: "Cam Y", min: -10, max: 10, step: 0.1 },
    { key: "camZ", label: "Cam Z", min: -20, max: 20, step: 0.1 },
    { key: "fov", label: "FOV", min: 20, max: 120, step: 1 },
    { key: "near", label: "Near", min: 0.05, max: 10, step: 0.05 },
    { key: "far", label: "Far", min: 5, max: 2000, step: 5 },
]);
addSliders(controlsPanel, [
    { key: "rotDeg", label: "Rotation (deg)", min: 0, max: 360, step: 1 },
]);
addSliders(controlsPanel, [
    { key: "scaleX", label: "Scale X", min: 0.1, max: 3, step: 0.05 },
    { key: "scaleY", label: "Scale Y", min: 0.1, max: 3, step: 0.05 },
    { key: "scaleZ", label: "Scale Z", min: 0.1, max: 3, step: 0.05 },
]);
addSliders(controlsPanel, [
    { key: "translateX", label: "Translate X", min: -5, max: 5, step: 0.1 },
    { key: "translateY", label: "Translate Y", min: -5, max: 5, step: 0.1 },
    { key: "translateZ", label: "Translate Z", min: -5, max: 5, step: 0.1 },
]);
const cam = {
    position: { x: controls.camX, y: controls.camY, z: controls.camZ },
    lookAt: { x: controls.camX, y: controls.camY, z: controls.camZ - 1 },
    up: { x: 0, y: 1, z: 0 },
    far: controls.far,
    near: controls.near,
    fov: controls.fov,
    ar: aspectRatio
};
const cameraForward = { x: 0, y: 0, z: -1 };
//translate points to right 
const timestart = performance.now();
setInterval(() => {
    if (ctx) {
        cam.position = { x: controls.camX, y: controls.camY, z: controls.camZ };
        cam.lookAt = {
            x: cam.position.x + cameraForward.x,
            y: cam.position.y + cameraForward.y,
            z: cam.position.z + cameraForward.z,
        };
        cam.fov = controls.fov;
        cam.near = controls.near;
        cam.far = Math.max(controls.far, controls.near + 0.1);
        const cameraBasis = CameraBasis(cam);
        // we First Scale the Points in Thier Local Space 
        const scaledPoints = points.map(point => ScaleVec3(point, {
            x: controls.scaleX,
            y: controls.scaleY,
            z: controls.scaleZ,
        }));
        //then we rotate the points around an arbitrary axis (in this case the vector (1, 1, 1)) that goes through the origin of the world space
        const rotatedPoints = scaledPoints.map(point => RotateAroundArbitraryAxisMatrix(point, { x: 1, y: 1, z: 1 }, controls.rotDeg * Math.PI / 180));
        // then we translate the points to the right in world space
        const translatedPoints = rotatedPoints.map(point => TranslateVec3(point, {
            x: controls.translateX,
            y: controls.translateY,
            z: controls.translateZ,
        }));
        // SCALE -> ROTATE -> TRANSLATE pipeline converts points from their local space to the world space 
        // now we need to transform the points from world space to camera space ( again change of basis )
        // first we move all the points so that the camera is the origin of the world space 
        const pointsShiftedSoCameraIsOrigin = translatedPoints.map(point => TranslateVec3(point, { x: -cam.position.x, y: -cam.position.y, z: -cam.position.z }));
        // then we change the basis from the world space basis to the camera space basis
        const pointsInCameraSpace = pointsShiftedSoCameraIsOrigin.map(point => multiplyMatrix3Vec3(cameraBasis, point));
        // now we can observe that moving the camera in the z direction doesnt do anything , ie the points that are far away from the camera are not getting smaller with distance 
        // now as the final step , we need project the points in camera onto a 2d Screen ( in our example the screen is placed at z = 0 ) , camera is looking down the negative z axis and the projection plane is between the camera and the origin of the world space
        // we can think of this project as if shooting a way from the position of the camera to the point in camera space and finding where it intersects the plane z = 0 ( the screen )
        const projectedPoints = pointsInCameraSpace.map(point => perspectiveProjection(point, cam));
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cubeEdges.forEach(([startIndex, endIndex]) => {
            drawLine(projectedPoints[startIndex], projectedPoints[endIndex]);
        });
        projectedPoints.forEach(point => {
            drawPoint(point);
        });
    }
}, 10);

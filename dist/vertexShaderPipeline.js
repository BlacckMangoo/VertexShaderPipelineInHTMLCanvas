import { defaultCameraState, initialiseUi } from "./ui.js";
import { cameraState, meshes, syncMeshStates } from "./stateManager.js";
import { CameraBasis, multiplyMatrix3Vec3, perspectiveProjection, RotateAroundArbitraryAxisMatrix, ScaleVec3, TranslateVec3 } from "./math.js";
import { cubeMESH } from "./primitiveData.js";
import { textures } from "./loadedTextures.js";
const RESOLUTION_FACTOR = 0.9;
const canvas = document.getElementById("canvas");
export const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth * RESOLUTION_FACTOR;
canvas.height = window.innerHeight * RESOLUTION_FACTOR;
canvas.style.width = `${window.innerWidth}px`;
canvas.style.height = `${window.innerHeight}px`;
canvas.style.imageRendering = "pixelated";
const frameBuffer = new Uint8ClampedArray(canvas.width * canvas.height * 4); // 4 for RGBA
const depthBuffer = new Float32Array(canvas.width * canvas.height); // for depth testing
const aspectRatio = canvas.width / canvas.height;
const scene = {
    cam: defaultCameraState,
    meshes: [cubeMESH],
};
const logoTexture = textures.WasLogo_png;
const checkersTexture = textures.checkers_png;
function convertPointFromNdcToScreenSpace(point) {
    const ndcX = point.x;
    const ndcy = point.y;
    return {
        x: ((ndcX + 1) / 2) * canvas.width,
        y: ((-ndcy + 1) / 2) * canvas.height,
        z: point.z,
    };
}
function DrawFrameBuffer() {
    if (ctx) {
        const imageData = new ImageData(frameBuffer, canvas.width, canvas.height);
        ctx.putImageData(imageData, 0, 0);
    }
}
function clearFrameBuffer(col) {
    for (let i = 0; i < frameBuffer.length; i += 4) {
        frameBuffer[i] = col.r;
        frameBuffer[i + 1] = col.g;
        frameBuffer[i + 2] = col.b;
        frameBuffer[i + 3] = col.a;
    }
}
function clearDepthBuffer() {
    for (let i = 0; i < depthBuffer.length; i++) {
        depthBuffer[i] = Infinity; // set all depths to infinity (far away)
        // remember smaller z means that object is closer to the camera should be drawn in front of objects with larger z values
    }
}
// Writes to the frame buffer
function setPixel(x, y, col) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return;
    }
    const px = Math.floor(x);
    const py = Math.floor(y);
    if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) {
        return;
    }
    const index = (py * canvas.width + px) * 4;
    frameBuffer[index] = col.r;
    frameBuffer[index + 1] = col.g;
    frameBuffer[index + 2] = col.b;
    frameBuffer[index + 3] = col.a;
}
// function drawPoint(p: Point) {
//     const point = convertPointFromNdcToScreenSpace(p);
//     setPixel(point.x, point.y, { r: 255, g: 255, b: 255, a: 255 });
// }
function drawLine(p1, p2, col, depthBias = 0.0001) {
    const point1 = convertPointFromNdcToScreenSpace(p1);
    const point2 = convertPointFromNdcToScreenSpace(p2);
    let x0 = Math.round(point1.x);
    let y0 = Math.round(point1.y);
    const x1 = Math.round(point2.x);
    const y1 = Math.round(point2.y);
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let error = dx - dy;
    const totalSteps = Math.max(dx, dy);
    let step = 0;
    while (true) {
        if (x0 >= 0 && x0 < canvas.width && y0 >= 0 && y0 < canvas.height) {
            const t = totalSteps === 0 ? 0 : step / totalSteps;
            const z = point1.z + (point2.z - point1.z) * t;
            const index = y0 * canvas.width + x0;
            // Edge is drawn only if it is on/closer than filled depth at this pixel.
            if (z <= depthBuffer[index] + depthBias) {
                setPixel(x0, y0, col);
            }
        }
        if (x0 === x1 && y0 === y1) {
            break;
        }
        // if the line is very steep we want to give it a higher bias so that it is more likely to be drawn on top of the filled triangle edges ( which are drawn with a smaller bias ) and
        //  thus avoid gaps between the edges and the filled triangle
        const e2 = error * 2;
        if (e2 > -dy) {
            error -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            error += dx;
            y0 += sy;
        }
        step += 1;
    }
}
const getRenderCamera = () => {
    const lookAt = updateCameraLookAt(cameraState.position);
    return {
        position: { ...cameraState.position },
        lookAt,
        up: { x: 0, y: 1, z: 0 },
        near: cameraState.near,
        far: cameraState.far,
        fov: cameraState.fov,
        ar: aspectRatio,
    };
};
function updateCameraLookAt(position) {
    const cameraForward = { x: 0, y: 0, z: -1 };
    return {
        x: position.x + cameraForward.x,
        y: position.y + cameraForward.y,
        z: position.z + cameraForward.z,
    };
}
function meshHasValidUv(mesh) {
    return Array.isArray(mesh.uvData) && mesh.uvData.length === mesh.vertices.length;
}
function DrawMesh(mesh, transform, cam) {
    // we First Scale the Points in Thier Local Space 
    const scaledPoints = mesh.vertices.map(point => ScaleVec3(point, transform.scale));
    //then we rotate the points around an arbitrary axis (in this case the vector (1, 1, 1)) that goes through the origin of the world space
    const rotatedPoints = scaledPoints.map(point => RotateAroundArbitraryAxisMatrix(point, transform.rotationAxis, transform.rotationAngle));
    const translatedPoints = rotatedPoints.map(point => TranslateVec3(point, transform.position));
    // SCALE -> ROTATE -> TRANSLATE pipeline converts points from their local space to the world space 
    // now we need to transform the points from world space to camera space ( again change of basis )
    // first we move all the points so that the camera is the origin of the world space 
    const pointsShiftedSoCameraIsOrigin = translatedPoints.map(point => TranslateVec3(point, { x: -cam.position.x, y: -cam.position.y, z: -cam.position.z }));
    // then we change the basis from the world space basis to the camera space basis
    const cameraBasis = CameraBasis(cam);
    const pointsInCameraSpace = pointsShiftedSoCameraIsOrigin.map(point => multiplyMatrix3Vec3(cameraBasis, point));
    // now we can observe that moving the camera in the z direction doesnt do anything , ie the points that are far away from the camera are not getting smaller with distance 
    // now as the final step , we need project the points in camera onto a 2d Screen ( in our example the screen is placed at z = 0 ) , camera is looking down the negative z axis and the projection plane is between the camera and the origin of the world space
    // we can think of this project as if shooting a way from the position of the camera to the point in camera space and finding where it intersects the plane z = 0 ( the screen )
    const projectedPoints = pointsInCameraSpace.map(point => perspectiveProjection(point, cam));
    const useTexture = meshHasValidUv(mesh);
    mesh.triangleIndicesData.forEach(([a, b, c]) => {
        const p1 = convertPointFromNdcToScreenSpace(projectedPoints[a]);
        const p2 = convertPointFromNdcToScreenSpace(projectedPoints[b]);
        const p3 = convertPointFromNdcToScreenSpace(projectedPoints[c]);
        const col = { r: 0, g: 0, b: 0, a: 255 };
        // if mesh contains u,v data then set p.u and v 
        if (useTexture && mesh.uvData) {
            p1.u = mesh.uvData[a][0];
            p1.v = mesh.uvData[a][1];
            p2.u = mesh.uvData[b][0];
            p2.v = mesh.uvData[b][1];
            p3.u = mesh.uvData[c][0];
            p3.v = mesh.uvData[c][1];
        }
        RasteriseTriangle(p1, p2, p3, col, useTexture ? checkersTexture : undefined);
    });
    mesh.triangleIndicesData.forEach(([a, b, c]) => {
        const edgeColor = { r: 255, g: 255, b: 255, a: 255 };
        drawLine(projectedPoints[a], projectedPoints[b], edgeColor);
        drawLine(projectedPoints[b], projectedPoints[c], edgeColor);
        drawLine(projectedPoints[c], projectedPoints[a], edgeColor);
    });
    // projectedPoints.forEach(point => {
    //     drawPoint(point);
    // });
}
function drawMeshFromState(mesh, cam) {
    DrawMesh(mesh, meshes[mesh.name], cam);
}
function edgeFunction(a, b, c) {
    const vectorAB = { x: b.x - a.x, y: b.y - a.y };
    const vectorAC = { x: c.x - a.x, y: c.y - a.y };
    const cross = vectorAB.x * vectorAC.y - vectorAB.y * vectorAC.x;
    return cross;
    // > 0 means that c is on the left side of the directed edge from a to b
    // < 0 means that c is on the right side of the directed edge from a to b
    // = 0 means that a, b and c are collinear
}
function RasteriseTriangle(p1, p2, p3, col, texture) {
    // Implement triangle rasterisation using barycentric coordinates
    //step 1 : compute the bounding box of the triangle 
    const minX = Math.floor(Math.min(p1.x, p2.x, p3.x));
    const maxX = Math.ceil(Math.max(p1.x, p2.x, p3.x));
    const minY = Math.floor(Math.min(p1.y, p2.y, p3.y));
    const maxY = Math.ceil(Math.max(p1.y, p2.y, p3.y));
    // clamp the bounding box to the screen dimensions
    const clampedMinX = Math.max(0, minX);
    const clampedMaxX = Math.min(canvas.width - 1, maxX);
    const clampedMinY = Math.max(0, minY);
    const clampedMaxY = Math.min(canvas.height - 1, maxY);
    //step 2 : loop through each pixel in the bounding box and check if it is inside the triangle using barycentric coordinates
    // also use Z values of the points to do depth testing and update the depth buffer accordingly
    const hasTriangleUv = Number.isFinite(p1.u) && Number.isFinite(p1.v) &&
        Number.isFinite(p2.u) && Number.isFinite(p2.v) &&
        Number.isFinite(p3.u) && Number.isFinite(p3.v);
    const areaABC = edgeFunction(p1, p2, p3);
    if (areaABC === 0) {
        return;
    }
    const useTexture = Boolean(texture) && hasTriangleUv;
    const activeTexture = useTexture && texture ? texture : checkersTexture;
    for (let x = clampedMinX; x <= clampedMaxX; x++) {
        for (let y = clampedMinY; y <= clampedMaxY; y++) {
            const point = { x, y, z: 0 };
            //cross product of AB And AC gives area of triangle ABC ( with sign ) and 
            // also tells us the winding of the triangle  clockwise or counterclockwise )
            const areaPBC = edgeFunction(point, p2, p3);
            const areaAPC = edgeFunction(p1, point, p3);
            const areaABP = edgeFunction(p1, p2, point);
            // barycentric interpolation to find the z value at this point
            const w1 = areaPBC / areaABC;
            const w2 = areaAPC / areaABC;
            const w3 = areaABP / areaABC;
            const z = w1 * p1.z + w2 * p2.z + w3 * p3.z;
            // check if point is inside the triangle 
            // if the point is on same side of all edges then its inside the triangle 
            //ie if edge func is positive for all edges or netive for all edges 
            const isInsideTriangle = (areaABC >= 0 && areaPBC >= 0 && areaAPC >= 0 && areaABP >= 0) ||
                (areaABC < 0 && areaPBC <= 0 && areaAPC <= 0 && areaABP <= 0);
            // barycentric interpolation to find the u and v values at this point
            if (hasTriangleUv) {
                const u = w1 * p1.u + w2 * p2.u + w3 * p3.u;
                const v = w1 * p1.v + w2 * p2.v + w3 * p3.v;
                const clampedU = Math.min(1, Math.max(0, u));
                const clampedV = Math.min(1, Math.max(0, v));
                const texData = activeTexture.data;
                const texWidth = activeTexture.width;
                const texHeight = activeTexture.height;
                const texX = Math.floor(clampedU * (texWidth - 1));
                const texY = Math.floor(clampedV * (texHeight - 1));
                const texIndex = (texY * texWidth + texX) * 4;
                col.r = texData[texIndex];
                col.g = texData[texIndex + 1];
                col.b = texData[texIndex + 2];
                col.a = texData[texIndex + 3];
            }
            if (isInsideTriangle) {
                const index = y * canvas.width + x;
                if (z < depthBuffer[index]) {
                    depthBuffer[index] = z;
                    setPixel(x, y, col);
                }
            }
        }
    }
}
function renderScene(scene, ctx) {
    const renderCam = getRenderCamera();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    clearFrameBuffer({ r: 55, g: 55, b: 55, a: 225 });
    clearDepthBuffer();
    scene.meshes.forEach((mesh) => drawMeshFromState(mesh, renderCam));
}
initialiseUi();
syncMeshStates(scene.meshes.map((mesh) => mesh.name));
setInterval(() => {
    if (ctx) {
        renderScene(scene, ctx);
        DrawFrameBuffer();
    }
}, 10);

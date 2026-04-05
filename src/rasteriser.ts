import { initialiseUi } from "./ui.js";
import { getCameraState, getLightingState, getRenderState } from "./stateManager.js";
import { meshTransforms, syncMeshStates } from "./transform.js";
import type { MeshTransformState } from "./transform.js";
import { createCam, updateCameraLookAt } from "./camera.js";
import { CameraBasis, crossProduct, dotProduct, multiplyMatrix3Vec3, normalise, perspectiveProjectionBeforePerspectiveDevide, RotateAroundArbitraryAxisMatrix, ScaleVec3, TranslateVec3 } from "./math.js";
import { Point,Mesh, quadMesh } from "./primitiveData.js";
import type { Texture } from "./texture.js";
import type { Camera, ClipSpacePoint } from "./math.js";
import { createScene } from "./scene.js";
import type { Scene } from "./scene.js";
import { teapotuv } from "./loadedObj.js";

const RESOLUTION_FACTOR = 0.9 ; 

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
export const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth * RESOLUTION_FACTOR;
canvas.height = window.innerHeight * RESOLUTION_FACTOR;

canvas.style.width = `${window.innerWidth}px`;
canvas.style.height = `${window.innerHeight}px`;
canvas.style.imageRendering = "pixelated"; 

const frameBuffer = new Uint8ClampedArray(canvas.width * canvas.height * 4); // 4 for RGBA
const depthBuffer = new Float32Array(canvas.width * canvas.height); // for depth testing

const stencilBuffer = new Uint8Array(canvas.width * canvas.height); // for stencil testing 
// 1 in stencil means draw that pixel and 0 means dont draw 
const aspectRatio = canvas.width / canvas.height;

export interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}

let writeToDepth = true;
let testDepth = true;
let blendAlpha = false;

export function depthWriteOn(): void {
    writeToDepth = true;
}

export function depthWriteOff(): void {
    writeToDepth = false;
}

export function depthTestOn(): void {
    testDepth = true;
}

export function depthTestOff(): void {
    testDepth = false;
}

export function alphaBlendingOn(): void {
    blendAlpha = true;
}

export function alphaBlendingOff(): void {
    blendAlpha = false;
}

const scene = createScene(createCam(aspectRatio));


function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

function sampleTextureNearest(texture: Texture, x: number, y: number): Color {
    const clampedX = Math.max(0, Math.min(texture.width - 1, x));
    const clampedY = Math.max(0, Math.min(texture.height - 1, y));
    const index = (clampedY * texture.width + clampedX) * 4;

    return {
        r: texture.data[index],
        g: texture.data[index + 1],
        b: texture.data[index + 2],
        a: texture.data[index + 3],
    };
}

function sampleTextureNearestByUv(texture: Texture, u: number, v: number): Color {
    const wrappedU = u - Math.floor(u);
    const wrappedV = v - Math.floor(v);

    const texX = Math.round(wrappedU * (texture.width - 1));
    const texY = Math.round(wrappedV * (texture.height - 1));

    return sampleTextureNearest(texture, texX, texY);
}

function sampleTextureBilinear(texture: Texture, u: number, v: number): Color {
    const wrappedU = u - Math.floor(u);
    const wrappedV = v - Math.floor(v);

    const texX = wrappedU * (texture.width - 1);
    const texY = wrappedV * (texture.height - 1);

    const x0 = Math.floor(texX);
    const y0 = Math.floor(texY);
    const x1 = Math.min(texture.width - 1, x0 + 1);
    const y1 = Math.min(texture.height - 1, y0 + 1);

    const tx = texX - x0;
    const ty = texY - y0;

    const c00 = sampleTextureNearest(texture, x0, y0);
    const c10 = sampleTextureNearest(texture, x1, y0);
    const c01 = sampleTextureNearest(texture, x0, y1);
    const c11 = sampleTextureNearest(texture, x1, y1);

    const topR = lerp(c00.r, c10.r, tx);
    const topG = lerp(c00.g, c10.g, tx);
    const topB = lerp(c00.b, c10.b, tx);
    const topA = lerp(c00.a, c10.a, tx);

    const bottomR = lerp(c01.r, c11.r, tx);
    const bottomG = lerp(c01.g, c11.g, tx);
    const bottomB = lerp(c01.b, c11.b, tx);
    const bottomA = lerp(c01.a, c11.a, tx);

    return {
        r: Math.round(lerp(topR, bottomR, ty)),
        g: Math.round(lerp(topG, bottomG, ty)),
        b: Math.round(lerp(topB, bottomB, ty)),
        a: Math.round(lerp(topA, bottomA, ty)),
    };
}

function convertPointFromNdcToScreenSpace(point: Point): Point {
    
    const ndcX = point.pos.x;
    const ndcy = point.pos.y;
    return {
       pos : {
        x: (ndcX + 1) * 0.5 * canvas.width,
        y: (1 - (ndcy + 1) * 0.5) * canvas.height, // flip y-axis for screen space
        z: point.pos.z,
       },
       u : point.u,
       v : point.v
    };
}

function FillStencilBuffer()
{
    // sample fill which masks bottom half of screen 
    for(let  i = 0 ; i < canvas.width ; i++)
      for(let j = 0 ; j < canvas.height ; j++)
    {
        const index = j * canvas.width + i;
        if(j > canvas.height / 2)
        {
            stencilBuffer[index] = 1;
        }
        else
        {
            stencilBuffer[index] = 0;
        }
    }
}

// if stencil buffer is cleared to 0 , then entire image will be drawn 
function ClearStencilBuffer()
{
    for(let  i = 0 ; i < canvas.width ; i++)
    {
        for(let j = 0 ; j < canvas.height ; j++)
        {
            const index = j * canvas.width + i;
            stencilBuffer[index] = 0;
        }
    }
}



function DrawFrameBuffer() {
    if (ctx) {
        const imageData = new ImageData(frameBuffer, canvas.width, canvas.height);
        ctx.putImageData(imageData, 0, 0);
    }
}

function clearFrameBuffer(col: Color): void {
    for (let i = 0; i < frameBuffer.length; i += 4) {
        frameBuffer[i] = col.r;
        frameBuffer[i + 1] = col.g;
        frameBuffer[i + 2] = col.b;
        frameBuffer[i + 3] = col.a;
    }
}

function clearDepthBuffer(): void {
    for (let i = 0; i < depthBuffer.length; i++) {
        depthBuffer[i] = Infinity; // set all depths to infinity (far away)
        // remember smaller z means that object is closer to the camera should be drawn in front of objects with larger z values
    }
}

function clampToByte(value: number): number {
    return Math.max(0, Math.min(255, Math.round(value)));
}

export function alphaBlend(srcColor: Color, dstColor: Color): Color {
    const srcA = srcColor.a / 255;
    const dstA = dstColor.a / 255;
    const outA = srcA + dstA * (1 - srcA);

    if (outA <= 0) {
        return { r: 0, g: 0, b: 0, a: 0 };
    }

    const outR = ((srcColor.r * srcA) + (dstColor.r * dstA * (1 - srcA))) / outA;
    const outG = ((srcColor.g * srcA) + (dstColor.g * dstA * (1 - srcA))) / outA;
    const outB = ((srcColor.b * srcA) + (dstColor.b * dstA * (1 - srcA))) / outA;

    return {
        r: clampToByte(outR),
        g: clampToByte(outG),
        b: clampToByte(outB),
        a: clampToByte(outA * 255),
    };
}

function setPixel(x: number, y: number, col: Color): void {

    if( stencilBuffer[y * canvas.width + x] === 1) // if stencil buffer at this pixel is 1 then we draw this pixel
    {
        return;
    }

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return;
    }

    const px = Math.floor(x);
    const py = Math.floor(y);

    if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) {
        return;
    }

    const index = (py * canvas.width + px) * 4;

    if (blendAlpha) {
        const dstColor: Color = {
            r: frameBuffer[index],
            g: frameBuffer[index + 1],
            b: frameBuffer[index + 2],
            a: frameBuffer[index + 3],
        };

        const outColor = alphaBlend(col, dstColor);
        frameBuffer[index] = outColor.r;
        frameBuffer[index + 1] = outColor.g;
        frameBuffer[index + 2] = outColor.b;
        frameBuffer[index + 3] = outColor.a;
        return;
    }

    frameBuffer[index] = col.r;
    frameBuffer[index + 1] = col.g;
    frameBuffer[index + 2] = col.b;
    frameBuffer[index + 3] = col.a;

}

function drawLine(p1: Point, p2: Point, col: Color, depthBias: number = 0.0001): void {

    const point1 = convertPointFromNdcToScreenSpace(p1);
    const point2 = convertPointFromNdcToScreenSpace(p2);

    let x0 = Math.round(point1.pos.x);
    let y0 = Math.round(point1.pos.y);
    const x1 = Math.round(point2.pos.x);
    const y1 = Math.round(point2.pos.y);

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
            const z = point1.pos.z + (point2.pos.z - point1.pos.z) * t;
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

const getRenderCamera = (): Camera => {
    const camState = getCameraState();
    const lookAt = updateCameraLookAt(camState.position);
    return {
        position: { ...camState.position },
        lookAt,
        up: { x: 0, y: 1, z: 0 },
        near: camState.near,
        far: camState.far,
        fov: camState.fov,
        ar: aspectRatio,
    };
};


// cliping helpers 
// 1. Clipping before perspective devide -> we represent plane as ax + by + cz + d = 0 , 
// lets say we have a triangle with v1,v2,v3 
// there can be 4 cases : one inside , two inside ,all inside , all outside

// so first we need a function which takes a ClipSpacePoint and tells us if its inside view frustum 
// we could check all planes but rn we will only clip against the near plane 

// case 3 and 4 are trivial 
// in case 1 and 2 we need to find interpolation factor t 
// the intersection point = v1 + t * (v2 - v1)
// the same t can be interpolate u and v values to find the uv coordinates of the intersection point for texture mapping

function findInterpolatingFactorForNearPlane(p1: ClipSpacePoint, p2: ClipSpacePoint): number {
    // near plane is represented as z = -w in clip space
    const t = (p1.pos.z + p1.pos.w) / ((p1.pos.z + p1.pos.w) - (p2.pos.z + p2.pos.w));
    return t;
}

function findInterpolatingFactorForFarPlane(p1: ClipSpacePoint, p2: ClipSpacePoint): number {
    // far plane is represented as z = w in clip space
    const t = (p1.pos.z - p1.pos.w) / ((p1.pos.z - p1.pos.w) - (p2.pos.z - p2.pos.w));
    return t;
}; 


function isinsideNearPlane(point: ClipSpacePoint): boolean {
    return point.pos.z >= -point.pos.w; // near plane is represented as z = -w in clip space
    //  and we want to keep the points that are in front of the near plane ( ie z >= -w )
}

function isinsideFarPlane(point: ClipSpacePoint): boolean {
    return point.pos.z <= point.pos.w; // far plane is represented as z = w in clip space
    // and we want to keep the points that are behind the far plane ( ie z <= w )
};


function interpolateClipSpacePoint(p1: ClipSpacePoint, p2: ClipSpacePoint, t: number): ClipSpacePoint {
    const interpolatedW = p1.pos.w + t * (p2.pos.w - p1.pos.w);
    return {
        pos: {
            x: p1.pos.x + t * (p2.pos.x - p1.pos.x),
            y: p1.pos.y + t * (p2.pos.y - p1.pos.y),
            z: p1.pos.z + t * (p2.pos.z - p1.pos.z),
            w: interpolatedW,
        },
        u: p1.u + t * (p2.u - p1.u),
        v: p1.v + t * (p2.v - p1.v),
        wInv: 1 / interpolatedW,
    };
}

function clipTriangleAgainstNearPlane(p1: ClipSpacePoint, p2: ClipSpacePoint, p3: ClipSpacePoint): ClipSpacePoint[][] {
    const p1Inside = isinsideNearPlane(p1);
    const p2Inside = isinsideNearPlane(p2);
    const p3Inside = isinsideNearPlane(p3);
    const insideCount = [p1Inside, p2Inside, p3Inside].filter(Boolean).length;

    if (insideCount === 0) {
        return [];
    }

    if (insideCount === 3) {
        return [[p1, p2, p3]];
    }

    if (insideCount === 1) {
        let insidePoint: ClipSpacePoint;
        let outsidePoint1: ClipSpacePoint;
        let outsidePoint2: ClipSpacePoint;

        if (p1Inside) {
            insidePoint = p1;
            outsidePoint1 = p2;
            outsidePoint2 = p3;
        } else if (p2Inside) {
            insidePoint = p2;
            outsidePoint1 = p1;
            outsidePoint2 = p3;
        } else {
            insidePoint = p3;
            outsidePoint1 = p1;
            outsidePoint2 = p2;
        }

        const t1 = findInterpolatingFactorForNearPlane(insidePoint, outsidePoint1);
        const t2 = findInterpolatingFactorForNearPlane(insidePoint, outsidePoint2);
        const newPoint1 = interpolateClipSpacePoint(insidePoint, outsidePoint1, t1);
        const newPoint2 = interpolateClipSpacePoint(insidePoint, outsidePoint2, t2);

        return [[insidePoint, newPoint1, newPoint2]];
    }

    let outsidePoint: ClipSpacePoint;
    let insidePoint1: ClipSpacePoint;
    let insidePoint2: ClipSpacePoint;

    if (!p1Inside) {
        outsidePoint = p1;
        insidePoint1 = p2;
        insidePoint2 = p3;
    } else if (!p2Inside) {
        outsidePoint = p2;
        insidePoint1 = p1;
        insidePoint2 = p3;
    } else {
        outsidePoint = p3;
        insidePoint1 = p1;
        insidePoint2 = p2;
    }

    const t1 = findInterpolatingFactorForNearPlane(insidePoint1, outsidePoint);
    const t2 = findInterpolatingFactorForNearPlane(insidePoint2, outsidePoint);
    const newPoint1 = interpolateClipSpacePoint(insidePoint1, outsidePoint, t1);
    const newPoint2 = interpolateClipSpacePoint(insidePoint2, outsidePoint, t2);

    return [
        [insidePoint1, insidePoint2, newPoint1],
        [newPoint1, insidePoint2, newPoint2],
    ];
}

function clipTriangleAgainstFarPlane(p1: ClipSpacePoint, p2: ClipSpacePoint, p3: ClipSpacePoint): ClipSpacePoint[][] {
    const p1Inside = isinsideFarPlane(p1);
    const p2Inside = isinsideFarPlane(p2);
    const p3Inside = isinsideFarPlane(p3);
    const insideCount = [p1Inside, p2Inside, p3Inside].filter(Boolean).length;

    if (insideCount === 0) {
        return [];
    }

    if (insideCount === 3) {
        return [[p1, p2, p3]];
    }

    if (insideCount === 1) {
        let insidePoint: ClipSpacePoint;
        let outsidePoint1: ClipSpacePoint;
        let outsidePoint2: ClipSpacePoint;

        if (p1Inside) {
            insidePoint = p1;
            outsidePoint1 = p2;
            outsidePoint2 = p3;
        } else if (p2Inside) {
            insidePoint = p2;
            outsidePoint1 = p1;
            outsidePoint2 = p3;
        } else {
            insidePoint = p3;
            outsidePoint1 = p1;
            outsidePoint2 = p2;
        }

        const t1 = findInterpolatingFactorForFarPlane(insidePoint, outsidePoint1);
        const t2 = findInterpolatingFactorForFarPlane(insidePoint, outsidePoint2);
        const newPoint1 = interpolateClipSpacePoint(insidePoint, outsidePoint1, t1);
        const newPoint2 = interpolateClipSpacePoint(insidePoint, outsidePoint2, t2);

        return [[insidePoint, newPoint1, newPoint2]];
    }

    let outsidePoint: ClipSpacePoint;
    let insidePoint1: ClipSpacePoint;
    let insidePoint2: ClipSpacePoint;

    if (!p1Inside) {
        outsidePoint = p1;
        insidePoint1 = p2;
        insidePoint2 = p3;
    } else if (!p2Inside) {
        outsidePoint = p2;
        insidePoint1 = p1;
        insidePoint2 = p3;
    } else {
        outsidePoint = p3;
        insidePoint1 = p1;
        insidePoint2 = p2;
    }

    const t1 = findInterpolatingFactorForFarPlane(insidePoint1, outsidePoint);
    const t2 = findInterpolatingFactorForFarPlane(insidePoint2, outsidePoint);
    const newPoint1 = interpolateClipSpacePoint(insidePoint1, outsidePoint, t1);
    const newPoint2 = interpolateClipSpacePoint(insidePoint2, outsidePoint, t2);

    return [
        [insidePoint1, insidePoint2, newPoint1],
        [newPoint1, insidePoint2, newPoint2],
    ];
}

function DrawMesh(mesh: Mesh, transform: MeshTransformState, cam: Camera ) {


  // kind of like the vertex shader

    // we First Scale the Points in Their Local Space 

    const scaledPoints = mesh.vertices.map(point => ScaleVec3(point.pos, transform.scale));
    //then we rotate the points around an arbitrary axis (in this case the vector (1, 1, 1)) that goes through the origin of the world space

    const rotatedPoints = scaledPoints.map(point => RotateAroundArbitraryAxisMatrix(point,
    transform.rotationAxis,
    transform.rotationAngle));
    
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


    //O N E      T R I A N G  L E 
    //[x,y,z,w],[x,y,z,w][x,y,z,w] 

    const projectedPointsBeforDevide : ClipSpacePoint[] = pointsInCameraSpace.map((point, index) =>
        perspectiveProjectionBeforePerspectiveDevide({
            pos: point,
            u: mesh.vertices[index].u,
            v: mesh.vertices[index].v,
        }, cam),
    );

    


    const lightingState = getLightingState();
    const lightDir = normalise(lightingState.lightDirection);
    const ambient = Math.min(1, Math.max(0, lightingState.ambientStrength));

    mesh.triangleIndicesData.forEach(([a, b, c]) => {
    const camP1 = pointsInCameraSpace[a];
    const camP2 = pointsInCameraSpace[b];
    const camP3 = pointsInCameraSpace[c];

    // Back-face culling 
    const edge1 = {
        x: camP2.x - camP1.x,
        y: camP2.y - camP1.y,
        z: camP2.z - camP1.z,
    };
    const edge2 = {
        x: camP3.x - camP1.x,
        y: camP3.y - camP1.y,
        z: camP3.z - camP1.z,
    };
    const normal = crossProduct(edge1, edge2);
    if (dotProduct(normal, camP1) >= 0) {
        return;
    }

    // kind of like the fragment shader 

    const faceNormal = normalise({ x: normal.x, y: normal.y, z: normal.z });
    const diffuse = Math.max(0, dotProduct(faceNormal, lightDir));
    const lighting = ambient + (1 - ambient) * diffuse;
    const shade = Math.round(lighting * 255);
  

    let col: Color = { r: shade, g: shade, b: shade, a: 255 };

    col = {
        r: Math.round(col.r * mesh.material.color.r / 255),
        g: Math.round(col.g * mesh.material.color.g / 255),
        b: Math.round(col.b * mesh.material.color.b / 255),
        a: Math.round(col.a * mesh.material.color.a / 255),
    };

    const nearClippedTriangles = clipTriangleAgainstNearPlane(
        projectedPointsBeforDevide[a],
        projectedPointsBeforDevide[b],
        projectedPointsBeforDevide[c],
    );

    const clippedTriangles = nearClippedTriangles.flatMap(([np1, np2, np3]) =>
        clipTriangleAgainstFarPlane(np1, np2, np3),
    );

    clippedTriangles.forEach(([cp1, cp2, cp3]) => {
        const projectedP1: Point = {
            pos: {
                x: cp1.pos.x / cp1.pos.w,
                y: cp1.pos.y / cp1.pos.w,
                z: cp1.pos.z / cp1.pos.w,
            },
            u: cp1.u,
            v: cp1.v,
            wInv: cp1.wInv,
        };
        const projectedP2: Point = {
            pos: {
                x: cp2.pos.x / cp2.pos.w,
                y: cp2.pos.y / cp2.pos.w,
                z: cp2.pos.z / cp2.pos.w,
            },
            u: cp2.u,
            v: cp2.v,
            wInv: cp2.wInv,
        };
        const projectedP3: Point = {
            pos: {
                x: cp3.pos.x / cp3.pos.w,
                y: cp3.pos.y / cp3.pos.w,
                z: cp3.pos.z / cp3.pos.w,
            },
            u: cp3.u,
            v: cp3.v,
            wInv: cp3.wInv,
        };

        const p1 = convertPointFromNdcToScreenSpace(projectedP1);
        const p2 = convertPointFromNdcToScreenSpace(projectedP2);
        const p3 = convertPointFromNdcToScreenSpace(projectedP3);

        RasteriseTriangle(p1, p2, p3, col, lighting, mesh.material.texture);
    });
});

   
}



function edgeFunction(a: Point, b: Point, c: Point): number {
    const vectorAB = { x: b.pos.x - a.pos.x, y: b.pos.y - a.pos.y };
    const vectorAC = { x: c.pos.x - a.pos.x, y: c.pos.y - a.pos.y };
    const cross = vectorAB.x * vectorAC.y - vectorAB.y * vectorAC.x;
    return cross;

    // > 0 means that c is on the left side of the directed edge from a to b
    // < 0 means that c is on the right side of the directed edge from a to b
    // = 0 means that a, b and c are collinear
}

function RasteriseTriangle(p1: Point, p2: Point, p3: Point, col: Color, shadeMultiplier: number = 1,texture : Texture ) {

    // Implement triangle rasterisation using barycentric coordinates

    //step 1 : compute the bounding box of the triangle 

    const minX = Math.floor(Math.min(p1.pos.x, p2.pos.x, p3.pos.x));
    const maxX = Math.ceil(Math.max(p1.pos.x, p2.pos.x, p3.pos.x));
    const minY = Math.floor(Math.min(p1.pos.y, p2.pos.y, p3.pos.y));
    const maxY = Math.ceil(Math.max(p1.pos.y, p2.pos.y, p3.pos.y)); 

    // clamp the bounding box to the screen dimensions
    const clampedMinX = Math.max(0, minX);
    const clampedMaxX = Math.min(canvas.width - 1, maxX);
    const clampedMinY = Math.max(0, minY);
    const clampedMaxY = Math.min(canvas.height - 1, maxY);


    //step 2 : loop through each pixel in the bounding box and check if it is inside the triangle using barycentric coordinates

    // also use Z values of the points to do depth testing and update the depth buffer accordingly

    const areaABC = edgeFunction(p1, p2, p3);
    if (areaABC === 0) {
        return;
    }

    const textureFilter = getRenderState().textureFilter;

    for(let x = clampedMinX; x <= clampedMaxX; x++) {
        for(let y = clampedMinY; y <= clampedMaxY; y++) {
            const point: Point = { pos: { x, y, z: 0 }, u: 0, v: 0 } ;
            //cross product of AB And AC gives area of triangle ABC ( with sign ) and 
            // also tells us the winding of the triangle  clockwise or counterclockwise )
            const areaPBC = edgeFunction(point, p2, p3);
            const areaAPC = edgeFunction(p3, p1, point);
            const areaABP = edgeFunction(p1, p2, point);

            // barycentric interpolation to find the z value at this point

            const w1 = areaPBC / areaABC;
            const w2 = areaAPC / areaABC;
            const w3 = areaABP / areaABC;
            const z = w1 * p1.pos.z + w2 * p2.pos.z + w3 * p3.pos.z;

            // check if point is inside the triangle 
            // if the point is on same side of all edges then its inside the triangle 

        
            //ie if edge func is positive for all edges or netive for all edges 
            const isInsideTriangle = (areaABC >= 0 && areaPBC >= 0 && areaAPC >= 0 && areaABP >= 0) ||
                (areaABC < 0 && areaPBC <= 0 && areaAPC <= 0 && areaABP <= 0);

            // barycentric interpolation to find the u and v values at this point
           

            if (isInsideTriangle) {
                const index = y * canvas.width + x;

                if (z < depthBuffer[index] || !testDepth) {
                    const wInv1 = p1.wInv ?? 1;
                    const wInv2 = p2.wInv ?? 1;
                    const wInv3 = p3.wInv ?? 1;

                    const interpolatedInvW = (w1 * wInv1) + (w2 * wInv2) + (w3 * wInv3);
                    if (interpolatedInvW <= 0) {
                        continue;
                    }

                    const uOverW = (w1 * p1.u * wInv1) + (w2 * p2.u * wInv2) + (w3 * p3.u * wInv3);
                    const vOverW = (w1 * p1.v * wInv1) + (w2 * p2.v * wInv2) + (w3 * p3.v * wInv3);
                    const interpolatedU = uOverW / interpolatedInvW;
                    const interpolatedV = vOverW / interpolatedInvW;

                    const sampled = textureFilter === "nearest"
                        ? sampleTextureNearestByUv(texture, interpolatedU, interpolatedV)
                        : sampleTextureBilinear(texture, interpolatedU, interpolatedV);
                    const lit = Math.max(0, Math.min(1, shadeMultiplier));

                    if(writeToDepth)
                    {
                    depthBuffer[index] = z;
                    }

                         setPixel(x, y, {
                        r: Math.round(sampled.r * lit * (col.r / 255)),
                        g: Math.round(sampled.g * lit * (col.g / 255)),
                        b: Math.round(sampled.b * lit * (col.b / 255)),
                        a: Math.round(sampled.a * (col.a / 255)),
                    });
                    
                  
                }
            }
        }
    
    }
}


scene.addMesh(teapotuv);
scene.addMesh(quadMesh);

function renderScene(scene: Scene, ctx: CanvasRenderingContext2D) {
    const renderCam = getRenderCamera();
    scene.setCamera(renderCam);
    clearFrameBuffer({ r: 55, g: 55, b: 55, a: 225 });
    clearDepthBuffer();
    ClearStencilBuffer();

    const opaqueMeshes = scene.meshes.filter((mesh) => mesh.material.color.a >= 255);
    const transparentMeshes = scene.meshes.filter((mesh) => mesh.material.color.a < 255);

    depthTestOn();
    depthWriteOn();
    alphaBlendingOff();
    opaqueMeshes.forEach((mesh) => DrawMesh(mesh, meshTransforms[mesh.name], scene.cam));

    depthTestOn();
    depthWriteOff();
    alphaBlendingOn();
    transparentMeshes.forEach((mesh) => DrawMesh(mesh, meshTransforms[mesh.name], scene.cam));
}

initialiseUi();

syncMeshStates(scene.meshes.map((mesh) => mesh.name));

let fpsFrameCount = 0;
let fpsLastSampleTime = performance.now();

setInterval(() => {
    if (ctx) {
        renderScene(scene, ctx);
      
        DrawFrameBuffer();

        fpsFrameCount += 1;
        const now = performance.now();
        const elapsedMs = now - fpsLastSampleTime;

        if (elapsedMs >= 1000) {
            const fps = (fpsFrameCount * 1000) / elapsedMs;
            console.log(`FPS: ${fps.toFixed(1)}`);
            fpsFrameCount = 0;
            fpsLastSampleTime = now;
        }
 }
},4);

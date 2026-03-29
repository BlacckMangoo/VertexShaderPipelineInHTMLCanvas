export interface Point {
    x: number;
    y: number;
    z: number;
}

export interface Vec3 {
    x: number;
    y: number;
    z: number;
}

export interface Vec4 {
    x: number;
    y: number;
    z: number;
    w: number;
}

export interface Matrix3 {
    r1: Vec3;
    r2: Vec3;
    r3: Vec3;
}

export interface Matrix4 {
    r1: Vec4;
    r2: Vec4;
    r3: Vec4;
    r4: Vec4;
}

export interface Camera {
    position: Vec3;
    lookAt: Vec3;
    up: Vec3;
    far: number;
    near: number;
    fov: number;
    ar: number;
}

export function dotProduct(a: Vec3, b: Vec3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function normalise(v: Vec3): Vec3 {
    const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    return {
        x: v.x / length,
        y: v.y / length,
        z: v.z / length,
    };
}

export function crossProduct(a: Vec3, b: Vec3): Vec3 {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x,
    };
}

export function TransposeMatrix3(matrix: Matrix3): Matrix3 {
    return {
        r1: { x: matrix.r1.x, y: matrix.r2.x, z: matrix.r3.x },
        r2: { x: matrix.r1.y, y: matrix.r2.y, z: matrix.r3.y },
        r3: { x: matrix.r1.z, y: matrix.r2.z, z: matrix.r3.z },
    };
}

export function GranShmidtProcess(v: Vec3): Matrix3 {
    const r1 = normalise(v);
    const arbitraryVector = { x: 0, y: 1, z: 0 };
    if (Math.abs(dotProduct(r1, arbitraryVector)) > 0.99) {
        arbitraryVector.x = 1;
        arbitraryVector.y = 0;
    }
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
    return TransposeMatrix3({ r1, r2: r2Normalised, r3 });
}

export function multiplyMatrix3Vec3(matrix: Matrix3, vec: Vec3): Vec3 {
    return {
        x: matrix.r1.x * vec.x + matrix.r1.y * vec.y + matrix.r1.z * vec.z,
        y: matrix.r2.x * vec.x + matrix.r2.y * vec.y + matrix.r2.z * vec.z,
        z: matrix.r3.x * vec.x + matrix.r3.y * vec.y + matrix.r3.z * vec.z,
    };
}

export function InverseMatrix3(matrix: Matrix3): Matrix3 {
    const det = matrix.r1.x * (matrix.r2.y * matrix.r3.z - matrix.r2.z * matrix.r3.y) -
        matrix.r1.y * (matrix.r2.x * matrix.r3.z - matrix.r2.z * matrix.r3.x) +
        matrix.r1.z * (matrix.r2.x * matrix.r3.y - matrix.r2.y * matrix.r3.x);
    const adjugate = {
        r1: {
            x: matrix.r2.y * matrix.r3.z - matrix.r2.z * matrix.r3.y,
            y: matrix.r1.z * matrix.r3.y - matrix.r1.y * matrix.r3.z,
            z: matrix.r1.y * matrix.r2.z - matrix.r1.z * matrix.r2.y,
        },
        r2: {
            x: matrix.r2.z * matrix.r3.x - matrix.r2.x * matrix.r3.z,
            y: matrix.r1.x * matrix.r3.z - matrix.r1.z * matrix.r3.x,
            z: matrix.r1.z * matrix.r2.x - matrix.r1.x * matrix.r2.z,
        },
        r3: {
            x: matrix.r2.x * matrix.r3.y - matrix.r2.y * matrix.r3.x,
            y: matrix.r1.y * matrix.r3.x - matrix.r1.x * matrix.r3.y,
            z: matrix.r1.x * matrix.r2.y - matrix.r1.y * matrix.r2.x,
        },
    };
    return {
        r1: { x: adjugate.r1.x / det, y: adjugate.r1.y / det, z: adjugate.r1.z / det },
        r2: { x: adjugate.r2.x / det, y: adjugate.r2.y / det, z: adjugate.r2.z / det },
        r3: { x: adjugate.r3.x / det, y: adjugate.r3.y / det, z: adjugate.r3.z / det },
    };
}

export const RotateAroundXMatrix = (angle: number): Matrix3 => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        r1: { x: 1, y: 0, z: 0 },
        r2: { x: 0, y: cos, z: -sin },
        r3: { x: 0, y: sin, z: cos },
    };
};

export function CameraBasis(cam: Camera): Matrix3 {
    const forward = normalise({
        x: cam.lookAt.x - cam.position.x,
        y: cam.lookAt.y - cam.position.y,
        z: cam.lookAt.z - cam.position.z,
    });
    const right = normalise(crossProduct(forward, cam.up));
    const up = crossProduct(right, forward);

    return {
        r1: right,
        r2: up,
        r3: { x: -forward.x, y: -forward.y, z: -forward.z },
    };
}

export function perspectiveProjection(point: Point, cam: Camera): Point {
    const fov = cam.fov * (Math.PI / 180);
    const f = 1 / Math.tan(fov / 2);
    const ar = cam.ar;
    const near = cam.near;
    const far = cam.far;

    const projectionMatrix: Matrix4 = {
        r1: { x: f / ar, y: 0, z: 0, w: 0 },
        r2: { x: 0, y: f, z: 0, w: 0 },
        r3: { x: 0, y: 0, z: (far + near) / (near - far), w: (2 * far * near) / (near - far) },
        r4: { x: 0, y: 0, z: -1, w: 0 },
    };

    const pointVec4: Vec4 = { x: point.x, y: point.y, z: point.z, w: 1 };
    const projectedVec4 = {
        x: projectionMatrix.r1.x * pointVec4.x + projectionMatrix.r1.y * pointVec4.y + projectionMatrix.r1.z * pointVec4.z + projectionMatrix.r1.w * pointVec4.w,
        y: projectionMatrix.r2.x * pointVec4.x + projectionMatrix.r2.y * pointVec4.y + projectionMatrix.r2.z * pointVec4.z + projectionMatrix.r2.w * pointVec4.w,
        z: projectionMatrix.r3.x * pointVec4.x + projectionMatrix.r3.y * pointVec4.y + projectionMatrix.r3.z * pointVec4.z + projectionMatrix.r3.w * pointVec4.w,
        w: projectionMatrix.r4.x * pointVec4.x + projectionMatrix.r4.y * pointVec4.y + projectionMatrix.r4.z * pointVec4.z + projectionMatrix.r4.w * pointVec4.w,
    };

    return {
        x: projectedVec4.x / projectedVec4.w,
        y: projectedVec4.y / projectedVec4.w,
        z: projectedVec4.z / projectedVec4.w,
    };
}

export function RotateAroundArbitraryAxisMatrix(input: Vec3, axis: Vec3, angle: number): Vec3 {
    const normalisedAxis = normalise(axis);
    const basis = GranShmidtProcess(normalisedAxis);
    const inverseBasis = InverseMatrix3(basis);
    const newVecInNewBasis = multiplyMatrix3Vec3(inverseBasis, input);
    const rotatedVecInNewBasis = multiplyMatrix3Vec3(RotateAroundXMatrix(angle), newVecInNewBasis);
    return multiplyMatrix3Vec3(basis, rotatedVecInNewBasis);
}

export function TranslateVec3(vec: Vec3, translation: Vec3): Vec3 {
    return {
        x: vec.x + translation.x,
        y: vec.y + translation.y,
        z: vec.z + translation.z,
    };
}

export function ScaleVec3(vec: Vec3, scale: Vec3): Vec3 {
    return {
        x: vec.x * scale.x,
        y: vec.y * scale.y,
        z: vec.z * scale.z,
    };
}

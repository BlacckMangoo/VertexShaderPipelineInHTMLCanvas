import type { Camera } from "./math.js";
import { allMeshes, meshRegistery } from "./meshRegistry.js";
import type { Mesh } from "./primitiveData.js";

export interface Scene {
	cam: Camera;
	meshes: Mesh[];
	addMesh: (name: string) => Mesh;
	setCamera: (camera: Camera) => void;
}

export function createScene(camera: Camera): Scene {
	const scene: Scene = {
		cam: camera,
		meshes: [],
		addMesh: (name: string): Mesh => {
			const mesh = meshRegistery[name];
			if (!mesh) {
				const knownNames = allMeshes.map((m) => m.name).join(", ");
				throw new Error(`Unknown mesh '${name}'. Known meshes: ${knownNames}`);
			}
			scene.meshes.push(mesh);
			return mesh;
		},
		setCamera: (nextCamera: Camera): void => {
			scene.cam = nextCamera;
		},
	};

	return scene;
}

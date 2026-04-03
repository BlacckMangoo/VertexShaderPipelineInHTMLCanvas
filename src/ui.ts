
import { ensureMeshStates, getCameraState, getMeshTransformState, getUIState, meshes, setCameraState, setMeshTransformState, setUIState } from "./stateManager.js";


export const defaultCameraState = {
    position: { x: 0, y: 0, z: 7 },
    lookAt: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
    far: 1000,
    near: 0.1,
    fov: 60,
    ar: 1
};

const getRoot = (): HTMLDivElement => {
    let root = document.getElementById("ui-root") as HTMLDivElement | null;
    if (root) {
        return root;
    }
    root = document.createElement("div");
    root.id = "ui-root";
    document.body.appendChild(root);
    return root;
};

interface PanelSection {
    element: HTMLDivElement;
    addElement: <TElement extends HTMLElement>(element: TElement) => TElement;
    addSlider: (label: string, min: number, max: number, step: number, initialValue: number, onChange: (value: number) => void) => HTMLDivElement;
}

function createPanelSection(title: string): PanelSection {
    const root = getRoot();
    const panel = document.createElement("div");
    panel.className = "ui-panel";

    const heading = document.createElement("h3");
    heading.textContent = title;
    panel.appendChild(heading);

    root.appendChild(panel);

    const addElement = <TElement extends HTMLElement>(element: TElement): TElement => {
        panel.appendChild(element);
        return element;
    };

    return {
        element: panel,
        addElement,
        addSlider: (label, min, max, step, initialValue, onChange) => {
            const slider = document.createElement("div");
            slider.className = "ui-slider";

            const labelElement = document.createElement("label");
            labelElement.textContent = label;

            const input = document.createElement("input");
            input.type = "range";
            input.min = String(min);
            input.max = String(max);
            input.step = String(step);
            input.value = String(initialValue);

            const controlRow = document.createElement("div");
            controlRow.className = "ui-control-row";

            const readout = document.createElement("span");
            readout.textContent = String(initialValue);
            readout.className = "ui-readout";

            const playButton = document.createElement("button");
            playButton.type = "button";
            playButton.textContent = "Play";
            playButton.className = "ui-play-button";

            let oscillationFrameId: number | null = null;
            let lastTimestamp = 0;
            let direction = 1;
            const valueSpeedPerSecond = (max - min) / 4;

            const stopOscillation = (): void => {
                if (oscillationFrameId === null) {
                    return;
                }
                cancelAnimationFrame(oscillationFrameId);
                oscillationFrameId = null;
                lastTimestamp = 0;
                playButton.textContent = "Play";
            };

            const startOscillation = (): void => {
                if (oscillationFrameId !== null) {
                    return;
                }

                playButton.textContent = "Pause";

                const tick = (timestamp: number): void => {
                    if (!slider.isConnected) {
                        stopOscillation();
                        return;
                    }

                    if (lastTimestamp === 0) {
                        lastTimestamp = timestamp;
                    }

                    const deltaSeconds = (timestamp - lastTimestamp) / 1000;
                    lastTimestamp = timestamp;

                    let nextValue = Number(input.value) + direction * valueSpeedPerSecond * deltaSeconds;
                    if (nextValue >= max) {
                        nextValue = max;
                        direction = -1;
                    } else if (nextValue <= min) {
                        nextValue = min;
                        direction = 1;
                    }

                    input.value = String(nextValue);
                    readout.textContent = nextValue.toFixed(2);
                    onChange(nextValue);

                    oscillationFrameId = requestAnimationFrame(tick);
                };

                oscillationFrameId = requestAnimationFrame(tick);
            };

            input.addEventListener("input", () => {
                stopOscillation();
                const value = Number(input.value);
                readout.textContent = String(value);
                onChange(value);
            });

            playButton.addEventListener("click", () => {
                if (oscillationFrameId === null) {
                    startOscillation();
                    return;
                }
                stopOscillation();
            });

            controlRow.append(input, readout, playButton);
            slider.append(labelElement, controlRow);
            return addElement(slider);
        },
    };
}

const clearPanelBody = (panelElement: HTMLDivElement): void => {
    while (panelElement.children.length > 1) {
        panelElement.removeChild(panelElement.lastChild as ChildNode);
    }
};

function createMeshSelectionLabel(meshName: string, isSelected: boolean, onSelect: () => void): HTMLButtonElement {
    const item = document.createElement("button");
    item.textContent = meshName;
    item.type = "button";
    item.className = isSelected ? "ui-mesh-button is-selected" : "ui-mesh-button";
    item.addEventListener("click", onSelect);
    return item;
}

function initialiseUi(): void {
    let meshNames: string[] = [];

    const meshPanel = createPanelSection("Meshes");
    const cameraPanel = createPanelSection("Camera");
    const transformPanel = createPanelSection("Selected Mesh Transform");

    const renderTransformPanel = (): void => {
        clearPanelBody(transformPanel.element);
        const selectedMesh = getUIState().selectedMesh;

        if (!selectedMesh) {
            const empty = document.createElement("div");
            empty.textContent = "No mesh selected";
            transformPanel.addElement(empty);
            return;
        }

        const state = getMeshTransformState(selectedMesh);

        transformPanel.addSlider("Pos X", -10, 10, 0.1, state.position.x, (value) => {
            const active = getUIState().selectedMesh;
            if (!active) return;
            const current = getMeshTransformState(active);
            setMeshTransformState(active, { position: { ...current.position, x: value } });
        });
        transformPanel.addSlider("Pos Y", -10, 10, 0.1, state.position.y, (value) => {
            const active = getUIState().selectedMesh;
            if (!active) return;
            const current = getMeshTransformState(active);
            setMeshTransformState(active, { position: { ...current.position, y: value } });
        });
        transformPanel.addSlider("Pos Z", -10, 10, 0.1, state.position.z, (value) => {
            const active = getUIState().selectedMesh;
            if (!active) return;
            const current = getMeshTransformState(active);
            setMeshTransformState(active, { position: { ...current.position, z: value } });
        });

        transformPanel.addSlider("Rot Axis X", -1, 1, 0.01, state.rotationAxis.x, (value) => {
            const active = getUIState().selectedMesh;
            if (!active) return;
            const current = getMeshTransformState(active);
            setMeshTransformState(active, { rotationAxis: { ...current.rotationAxis, x: value } });
        });
        transformPanel.addSlider("Rot Axis Y", -1, 1, 0.01, state.rotationAxis.y, (value) => {
            const active = getUIState().selectedMesh;
            if (!active) return;
            const current = getMeshTransformState(active);
            setMeshTransformState(active, { rotationAxis: { ...current.rotationAxis, y: value } });
        });
        transformPanel.addSlider("Rot Axis Z", -1, 1, 0.01, state.rotationAxis.z, (value) => {
            const active = getUIState().selectedMesh;
            if (!active) return;
            const current = getMeshTransformState(active);
            setMeshTransformState(active, { rotationAxis: { ...current.rotationAxis, z: value } });
        });

        transformPanel.addSlider("Scale X", 0.1, 5, 0.01, state.scale.x, (value) => {
            const active = getUIState().selectedMesh;
            if (!active) return;
            const current = getMeshTransformState(active);
            setMeshTransformState(active, { scale: { ...current.scale, x: value } });
        });
        transformPanel.addSlider("Scale Y", 0.1, 5, 0.01, state.scale.y, (value) => {
            const active = getUIState().selectedMesh;
            if (!active) return;
            const current = getMeshTransformState(active);
            setMeshTransformState(active, { scale: { ...current.scale, y: value } });
        });
        transformPanel.addSlider("Scale Z", 0.1, 5, 0.01, state.scale.z, (value) => {
            const active = getUIState().selectedMesh;
            if (!active) return;
            const current = getMeshTransformState(active);
            setMeshTransformState(active, { scale: { ...current.scale, z: value } });
        });

        transformPanel.addSlider("Rot Angle", -3.14, 3.14, 0.01, state.rotationAngle, (value) => {
            const active = getUIState().selectedMesh;
            if (!active) return;
            setMeshTransformState(active, { rotationAngle: value });
        });
    };

    const renderMeshPanel = (): void => {
        clearPanelBody(meshPanel.element);
        const selectedMesh = getUIState().selectedMesh;

        if (meshNames.length === 0) {
            const empty = document.createElement("div");
            empty.textContent = "No meshes available";
            meshPanel.addElement(empty);
            return;
        }

        meshNames.forEach((meshName) => {
            const item = createMeshSelectionLabel(meshName, selectedMesh === meshName, () => {
                setUIState({ selectedMesh: meshName });
                renderMeshPanel();
                renderTransformPanel();
            });
            meshPanel.addElement(item);
        });
    };

    cameraPanel.addSlider("Cam X", -20, 20, 0.1, getCameraState().position.x, (value) => {
        const cam = getCameraState();
        setCameraState({ position: { ...cam.position, x: value } });
    });
    cameraPanel.addSlider("Cam Y", -20, 20, 0.1, getCameraState().position.y, (value) => {
        const cam = getCameraState();
        setCameraState({ position: { ...cam.position, y: value } });
    });
    cameraPanel.addSlider("Cam Z", 5, 10, 0.1, getCameraState().position.z, (value) => {
        const cam = getCameraState();
        setCameraState({ position: { ...cam.position, z: value } });
    });
    cameraPanel.addSlider("FOV", 20, 120, 1, getCameraState().fov, (value) => {
        setCameraState({ fov: value });
    });
    cameraPanel.addSlider("Near", 0.05, 10, 0.05, getCameraState().near, (value) => {
        setCameraState({ near: value });
    });
    cameraPanel.addSlider("Far", 1, 2000, 1, getCameraState().far, (value) => {
        setCameraState({ far: value });
    });

    const syncMeshNamesFromGlobal = (): void => {
        const nextMeshNames = Object.keys(meshes);
        ensureMeshStates(nextMeshNames);

        const changed =
            nextMeshNames.length !== meshNames.length ||
            nextMeshNames.some((name, index) => name !== meshNames[index]);

        if (!changed) {
            return;
        }

        meshNames = nextMeshNames;
        const selectedMesh = getUIState().selectedMesh;
        if (meshNames.length === 0) {
            setUIState({ selectedMesh: null });
        } else if (!selectedMesh || !meshNames.includes(selectedMesh)) {
            setUIState({ selectedMesh: meshNames[0] });
        }

        renderMeshPanel();
        renderTransformPanel();
    };

    syncMeshNamesFromGlobal();
    setInterval(syncMeshNamesFromGlobal, 250);
}

export { createPanelSection, initialiseUi };
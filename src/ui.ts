
import { getCameraState, getLightingState, getMeshTransformState, getRenderState, getUIState, setCameraState, setLightingState, setMeshTransformState, setRenderState, setUIState } from "./stateManager.js";
import { ensureMeshStates, meshTransforms } from "./transform.js";

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
    addToggle: (label: string, initialValue: boolean, onChange: (value: boolean) => void) => HTMLDivElement;
    addSelect: (label: string, options: Array<{ value: string; label: string }>, initialValue: string, onChange: (value: string) => void) => HTMLDivElement;
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
        addToggle: (label, initialValue, onChange) => {
            const row = document.createElement("div");
            row.className = "ui-toggle-row";

            const labelElement = document.createElement("label");
            labelElement.className = "ui-toggle-label";
            labelElement.textContent = label;

            const input = document.createElement("input");
            input.type = "checkbox";
            input.className = "ui-toggle-input";
            input.checked = initialValue;

            input.addEventListener("change", () => {
                onChange(input.checked);
            });

            row.append(labelElement, input);
            return addElement(row);
        },
        addSelect: (label, options, initialValue, onChange) => {
            const row = document.createElement("div");
            row.className = "ui-toggle-row";

            const labelElement = document.createElement("label");
            labelElement.className = "ui-toggle-label";
            labelElement.textContent = label;

            const select = document.createElement("select");
            select.className = "ui-select";

            options.forEach((option) => {
                const optionElement = document.createElement("option");
                optionElement.value = option.value;
                optionElement.textContent = option.label;
                select.appendChild(optionElement);
            });

            select.value = initialValue;
            select.addEventListener("change", () => onChange(select.value));

            row.append(labelElement, select);
            return addElement(row);
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
    const lightingPanel = createPanelSection("Lighting");
    const renderPanel = createPanelSection("Render");
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
            current.position.x = value;
            setMeshTransformState(active, current);
        });
        transformPanel.addSlider("Pos Y", -10, 10, 0.1, state.position.y, (value) => {
            const active = getUIState().selectedMesh;
            if (!active) return;
            const current = getMeshTransformState(active);
            current.position.y = value;
            setMeshTransformState(active, current);
        });
        transformPanel.addSlider("Pos Z", -10, 10, 0.1, state.position.z, (value) => {
            const active = getUIState().selectedMesh;
            if (!active) return;
            const current = getMeshTransformState(active);
            current.position.z = value;
            setMeshTransformState(active, current);
        });

        transformPanel.addSlider("Rot Axis X", -1, 1, 0.01, state.rotationAxis.x, (value) => {
            const active = getUIState().selectedMesh;
            if (!active) return;
            const current = getMeshTransformState(active);
            current.rotationAxis.x = value;
            setMeshTransformState(active, current);
        });
        transformPanel.addSlider("Rot Axis Y", -1, 1, 0.01, state.rotationAxis.y, (value) => {
            const active = getUIState().selectedMesh;
            if (!active) return;
            const current = getMeshTransformState(active);
            current.rotationAxis.y = value;
            setMeshTransformState(active, current);
        });
        transformPanel.addSlider("Rot Axis Z", -1, 1, 0.01, state.rotationAxis.z, (value) => {
            const active = getUIState().selectedMesh;
            if (!active) return;
            const current = getMeshTransformState(active);
            current.rotationAxis.z = value;
            setMeshTransformState(active, current);
        });

        transformPanel.addSlider("Scale X", 0.01,5, 0.01, state.scale.x, (value) => {
            const active = getUIState().selectedMesh;
            if (!active) return;
            const current = getMeshTransformState(active);
            current.scale.x = value;
            setMeshTransformState(active, current);
        });
        transformPanel.addSlider("Scale Y", 0.01,5, 0.01, state.scale.y, (value) => {
            const active = getUIState().selectedMesh;
            if (!active) return;
            const current = getMeshTransformState(active);
            current.scale.y = value;
            setMeshTransformState(active, current);
        });
        transformPanel.addSlider("Scale Z",  0.01,5, 0.01, state.scale.z, (value) => {
            const active = getUIState().selectedMesh;
            if (!active) return;
            const current = getMeshTransformState(active);
            current.scale.z = value;
            setMeshTransformState(active, current);
        });

        transformPanel.addSlider("Rot Angle", -3.14, 3.14, 0.01, state.rotationAngle, (value) => {
            const active = getUIState().selectedMesh;
            if (!active) return;
            const current = getMeshTransformState(active);
            current.rotationAngle = value;
            setMeshTransformState(active, current);
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
                setUIState(meshName);
                renderMeshPanel();
                renderTransformPanel();
            });
            meshPanel.addElement(item);
        });
    };

    cameraPanel.addSlider("Cam X", -20, 20, 0.1, getCameraState().position.x, (value) => {
        const cam = getCameraState();
        cam.position.x = value;
        setCameraState(cam);
    });
    cameraPanel.addSlider("Cam Y", -20, 20, 0.1, getCameraState().position.y, (value) => {
        const cam = getCameraState();
        cam.position.y = value;
        setCameraState(cam);
    });
    cameraPanel.addSlider("Cam Z", 5, 30, 0.1, getCameraState().position.z, (value) => {
        const cam = getCameraState();
        cam.position.z = value;
        setCameraState(cam);
    });
    cameraPanel.addSlider("FOV", 20, 120, 1, getCameraState().fov, (value) => {
        const cam = getCameraState();
        cam.fov = value;
        setCameraState(cam);
    });
    cameraPanel.addSlider("Near", 0.05, 10, 0.05, getCameraState().near, (value) => {
        const cam = getCameraState();
        cam.near = value;
        setCameraState(cam);
    });
    cameraPanel.addSlider("Far", 1, 100, 0.5, getCameraState().far, (value) => {
        const cam = getCameraState();
        cam.far = value;
        setCameraState(cam);
    });

    lightingPanel.addSlider("Light Dir X", -1, 1, 0.01, getLightingState().lightDirection.x, (value) => {
        const lighting = getLightingState();
        lighting.lightDirection.x = value;
        setLightingState(lighting);
    });
    lightingPanel.addSlider("Light Dir Y", -1, 1, 0.01, getLightingState().lightDirection.y, (value) => {
        const lighting = getLightingState();
        lighting.lightDirection.y = value;
        setLightingState(lighting);
    });
    lightingPanel.addSlider("Light Dir Z", -1, 1, 0.01, getLightingState().lightDirection.z, (value) => {
        const lighting = getLightingState();
        lighting.lightDirection.z = value;
        setLightingState(lighting);
    });
    lightingPanel.addSlider("Ambient", 0, 1, 0.01, getLightingState().ambientStrength, (value) => {
        const lighting = getLightingState();
        lighting.ambientStrength = value;
        setLightingState(lighting);
    });

    renderPanel.addToggle("Draw Wireframe", getRenderState().drawWireframe, (value) => {
        const renderState = getRenderState();
        renderState.drawWireframe = value;
        setRenderState(renderState);
    });

    renderPanel.addSelect(
        "Texture Filter",
        [
            { value: "nearest", label: "Nearest Neighbour" },
            { value: "bilinear", label: "Bilinear" },
        ],
        getRenderState().textureFilter,
        (value) => {
            const renderState = getRenderState();
            renderState.textureFilter = value as "nearest" | "bilinear";
            setRenderState(renderState);
        },
    );

    const syncMeshNamesFromGlobal = (): void => {
        const nextMeshNames = Object.keys(meshTransforms);
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
            setUIState(null);
        } else if (!selectedMesh || !meshNames.includes(selectedMesh)) {
            setUIState(meshNames[0]);
        }

        renderMeshPanel();
        renderTransformPanel();
    };

    syncMeshNamesFromGlobal();
    setInterval(syncMeshNamesFromGlobal, 250);
}

export { createPanelSection, initialiseUi };
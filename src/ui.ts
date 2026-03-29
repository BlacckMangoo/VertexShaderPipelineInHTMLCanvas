interface SliderConfig {
    key: keyof SceneControls;
    label: string;
    min: number;
    max: number;
    step: number;
}

interface SceneControls {
    camX: number;
    camY: number;
    camZ: number;
    fov: number;
    near: number;
    far: number;
    rotDeg: number;
    rotAxisX: number;
    rotAxisY: number;
    rotAxisZ: number;
    scaleX: number;
    scaleY: number;
    scaleZ: number;
    translateX: number;
    translateY: number;
    translateZ: number;
}

const controls: SceneControls = {
    camX: 0,
    camY: 0,
    camZ: 5,
    fov: 45,
    near: 0.1,
    far: 1000,
    rotDeg: 0,
    rotAxisX: 0,
    rotAxisY: 1,
    rotAxisZ: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    translateX: 0,
    translateY: 0,
    translateZ: 0,
};

function createControlsPanel(): HTMLElement {
    const panel = document.getElementById("controls") as HTMLDivElement | null;
    if (!panel) {
        throw new Error("Controls container with id 'controls' was not found.");
    }

    panel.style.position = "fixed";
    panel.style.top = "12px";
    panel.style.left = "12px";
    panel.style.width = "320px";


    const title = document.createElement("h3");
    title.textContent = "Scene Controls";
    title.style.margin = "0 0 10px 0";
    panel.appendChild(title);
    return panel;
}



function addSlider(parent: HTMLElement, config: SliderConfig): void {
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

function addSliders(parent: HTMLElement, configs: SliderConfig[]): void {
    configs.forEach((config) => addSlider(parent, config));
}


export {
    controls,
    createControlsPanel,
    addSlider,
    addSliders
};
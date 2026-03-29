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
export { controls, createControlsPanel, addSectionHeader, addSlider, addSliders };

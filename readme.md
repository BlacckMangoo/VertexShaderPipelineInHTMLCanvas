written for education purposes with mathematical explicitness and geometrical reasoning in mind instead of saving a few multiplicatios and decides here and there , with my reasoning documented through comments 

implemented all the math from scratch and is written in easy to read manner as if you would write in a mathematical derivation. 

Pipeline

SRT transform (Scale → Rotate → Translate) — local to world space
View transform — world to camera space via change of basis
Perspective projection — camera to NDC
NDC to screen space

Rendering

Framebuffer + depth buffer (CPU)
Barycentric triangle rasterisation
Depth testing per fragment
Edge drawing with depth bias (wireframe over fill)


Scene

Multiple meshes (cube, triangle, quad)
Per-mesh transform state (position, rotation axis/angle, scale)
Camera state (position, FOV, near, far)
Interactive UI — sliders for all transform + camera params, mesh selector

# Screenshots

![Screenshot 1](media/ss1.png)
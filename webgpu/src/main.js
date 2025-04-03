
// import the `Points` class

import Points from 'points';
import RenderPass from 'renderpass';
import { fnusin } from 'animation';

// reference the canvas in the constructor
const points = new Points('gl-canvas');

// create your render pass with three shaders as follow
const renderPasses = [
    new RenderPass(/*wgsl*/`
                @vertex
                fn main(
                    @location(0) position: vec4<f32>,
                    @location(1) color: vec4<f32>,
                    @location(2) uv: vec2<f32>,
                    @builtin(vertex_index) vertexIndex: u32
                ) -> Fragment {

                    return defaultVertexBody(position, color, uv);
                }`,
                /*wgsl*/`
                ${fnusin}
                @fragment
                fn main(
                    @location(0) color: vec4<f32>,
                    @location(1) uv: vec2<f32>,
                    @location(2) ratio: vec2<f32>,  // relation between params.screen.x and params.screen.y
                    @location(3) uvr: vec2<f32>,    // uv with aspect ratio corrected
                    @location(4) mouse: vec2<f32>,
                    @builtin(position) position: vec4<f32>
                ) -> @location(0) vec4<f32> {

                    let cellSize = 20. + 10. * fnusin(1.);
                    let a = sin(uvr.x  * cellSize) * sin(uvr.y * cellSize);
                    let b = sin(uvr.x * uvr.y * 10. * 9.1 * .25 );
                    let c = fnusin(uvr.x * uvr.y * 10.);
                    let d = distance(a,b);
                    let f = d * uvr.x * uvr.y;
                    let finalColor:vec4<f32> = vec4(a*d,f*c*a,f, 1.);

                    return finalColor;
                }
                `,
                /*wgsl*/`

                @compute @workgroup_size(8,8,1)
                fn main(
                    @builtin(global_invocation_id) GlobalId: vec3<u32>,
                    @builtin(workgroup_id) WorkGroupID: vec3<u32>,
                    @builtin(local_invocation_id) LocalInvocationID: vec3<u32>
                ) {
                    let time = params.time;
                }
                `,
    )
];

// call the POINTS init method and then the update method
await points.init(renderPasses);
update();

// call `points.update()` methods to render a new frame
function update() {
    points.update();
    requestAnimationFrame(update);
}

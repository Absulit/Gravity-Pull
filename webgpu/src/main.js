
// import the `Points` class

import Points from 'points';
import RenderPass from 'renderpass';
import frag0 from './renderpasses/renderpass0/frag.js';
import vert from './renderpasses/renderpass0/vert.js';

// reference the canvas in the constructor
/**
 * @type {Points}
 */
const points = new Points('canvas');

points.setSampler('imageSampler', null);
points.setTexture2d('feedbackTexture', true);

// create your render pass with three shaders as follow
const renderPasses = [
    new RenderPass(vert, frag0, null),
];

// call the POINTS init method and then the update method
await points.init(renderPasses);
update();

// call `points.update()` methods to render a new frame
function update() {
    points.update();
    requestAnimationFrame(update);
}

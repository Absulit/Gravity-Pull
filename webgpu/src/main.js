
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


let volume = 1;
let loop = true;
// const audio = points.setAudio('audio', './../80s-pulse-synthwave-dude-212407.mp3', volume, loop, false);
const audio = points.setAudio('audio', './../synthwave-80s-robot-swarm-218092.mp3', volume, loop, false);
// const audio = points.setAudio('audio', './../mezhdunami-fading-echoes-129291.mp3', volume, loop, false);

// points.addEventListener('click_event', data => {
//     audio.play();
// }, 4);
audio.play();
points.setStorage('result', 'array<f32, 10>', 4);


// create your render pass with three shaders as follow
const renderPasses = [
    new RenderPass(vert, frag0, null),
];

// call the POINTS init method and then the update method
await points.init(renderPasses);

// points.fitWindow = true;

update();

// call `points.update()` methods to render a new frame
function update() {
    points.update();
    requestAnimationFrame(update);
}

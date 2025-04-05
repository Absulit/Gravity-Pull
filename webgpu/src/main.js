
// import the `Points` class

import Points from 'points';
import RenderPass from 'renderpass';
import frag0 from './renderpasses/renderpass0/frag.js';
import vert from './renderpasses/renderpass0/vert.js';

import * as dat from 'datgui';




// reference the canvas in the constructor
/**
 * @type {Points}
 */
const points = new Points('canvas');
const gui = new dat.GUI({ name: 'Points GUI' });
const folder = gui.addFolder('options');

const options = {
    sliderA: 0.619,
    sliderB: 0.861,
    sliderC: 0.508,
}

points.setUniform('sliderA', options.sliderA);
points.setUniform('sliderB', options.sliderB);
points.setUniform('sliderC', options.sliderC);


folder.add(options, 'sliderA', -1, 1, .0001).name('sliderA');
folder.add(options, 'sliderB', -1, 1, .0001).name('sliderB');
folder.add(options, 'sliderC', -1, 1, .0001).name('sliderC');
folder.open();



points.setSampler('imageSampler', null);
points.setTexture2d('feedbackTexture', true);


let volume = 1;
let loop = true;
// const audio = points.setAudio('audio', './../80s-pulse-synthwave-dude-212407.mp3', volume, loop, false);
// const audio = points.setAudio('audio', './../synthwave-80s-robot-swarm-218092.mp3', volume, loop, false);
const audio = points.setAudio('audio', './../mezhdunami-fading-echoes-129291.mp3', volume, loop, false);

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
    points.setUniform('sliderA', options.sliderA);
    points.setUniform('sliderB', options.sliderB);
    points.setUniform('sliderC', options.sliderC);

    points.update();
    requestAnimationFrame(update);
}

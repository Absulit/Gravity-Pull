
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

let audio = null;

let volume = 1;
let loop = true;
function playSong() {
    audio && audio.pause() && (audio = null)
    audio = points.setAudio('audio', this.src, audio.volume, loop, false);
    audio.play();
}

function loadSong() {
    // Dynamically create a hidden file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/mp3, audio/flac, audio/ogg';

    // Listen for the file selection
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const audioUrl = URL.createObjectURL(file);

            audio && audio.pause() && (audio = null)
            audio = points.setAudio('audio', audioUrl, 1, false, false);
            audio.play();

            console.log('Now playing:', file.name);
        }
    });

    // Trigger the file input click programmatically
    fileInput.click();
}

const songs = [
    {
        name: 'Pulse 🎵',
        src: './../80s-pulse-synthwave-dude-212407.mp3',
        valume: 1,
        fn: playSong
    },
    {
        name: 'Robot Swarm 🎵',
        src: './../synthwave-80s-robot-swarm-218092.mp3',
        valume: 1,
        fn: playSong
    },
    {
        name: 'Fading Echoes 🎵',
        src: './../mezhdunami-fading-echoes-129291.mp3',
        valume: 1,
        fn: playSong
    },
    {
        name: 'Load a song',
        fn: loadSong
    }
]
songs.forEach(song => {
    song.controller = gui.add(song, 'fn').name(song.name);
})



Object.keys(options).forEach(key => {
    points.setUniform(key, options[key]);
    folder.add(options, key, -1, 1, .0001).name(key);
})




folder.open();



points.setSampler('imageSampler', null);
points.setTexture2d('feedbackTexture', true);



audio = points.setAudio('audio', './../80s-pulse-synthwave-dude-212407.mp3', volume, loop, false);
// const audio = points.setAudio('audio', './../synthwave-80s-robot-swarm-218092.mp3', volume, loop, false);
// const audio = points.setAudio('audio', './../mezhdunami-fading-echoes-129291.mp3', volume, loop, false);

// points.addEventListener('click_event', data => {
//     audio.play();
// }, 4);
// audio.play();
points.setStorage('result', 'array<f32, 10>', 4);


// create your render pass with three shaders as follow
const renderPasses = [
    new RenderPass(vert, frag0, null),
];

// call the POINTS init method and then the update method
await points.init(renderPasses);

points.fitWindow = true;

update();

// call `points.update()` methods to render a new frame
function update() {

    Object.keys(options).forEach(key => points.setUniform(key, options[key]));

    points.update();
    requestAnimationFrame(update);
}

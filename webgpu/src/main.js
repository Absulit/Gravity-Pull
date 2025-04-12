import Points from 'points';
import RenderPass from 'renderpass';
import frag0 from './renderpasses/renderpass0/frag.js';
import vert from './renderpasses/renderpass0/vert.js';
import * as dat from 'datgui';
import { Dexie } from 'https://unpkg.com/dexie/dist/modern/dexie.mjs';

/**
 * @type {Points}
 */
const points = new Points('canvas');
const gui = new dat.GUI({ name: 'Points GUI' });
const folderOptions = gui.addFolder('options');
const folderSongs = gui.addFolder('songs');
const folderColors = gui.addFolder('colors');

const options = {
    sliderA: 0.619,
    sliderB: 0.861,
    sliderC: 0.508,
}

function strToCodes(str) {
    return Array.from(str).map(char => char.charCodeAt(0))
}

const colors = [
    {
        name: 'default',

    },
]


let audio = null;
let volume = 1;
let loop = false;
function playSong() {
    audio && audio.pause() && (audio = null)
    audio = points.setAudio('audio', this.src, audio.volume, loop, false);
    points.setStorageMap('chars', strToCodes(this.name));
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.play();
}



function onTimeUpdate(){
    const progress = (audio.currentTime / audio.duration);
    points.setUniform('progress', progress);
}

function loadSong() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/mp3, audio/flac, audio/ogg';

    fileInput.addEventListener('change', async e => {
        const file = e.target.files[0];
        if (file) {
            const audioUrl = URL.createObjectURL(file);

            audio && audio.pause() && (audio = null);
            audio = points.setAudio('audio', audioUrl, 1, false, false);
            points.setStorageMap('chars', strToCodes(file.name));
            audio.play();

            await db.songs.add({ file });

            console.log('Now playing:', file.name);

            const song = {
                name: file.name,
                src: audioUrl,
                volume: 1,
                fn: playSong
            }
            folderSongs.add(song, 'fn').name(song.name);
        }
    });

    fileInput.click();

}

const songs = [
    {
        name: 'Load a song 📀',
        fn: loadSong
    },
    {
        name: 'Pause ⏸️',
        fn: _ => audio?.pause()
    },
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
    }
]

songs.forEach(song => {
    song.controller = folderSongs.add(song, 'fn').name(song.name);
})

//------------------------------------
const db = new Dexie('bhdb');
db.version(1).stores({
    songs: '++id, file'
});

const songsList = await db.songs
    .toArray();

console.log(songsList);
songsList.forEach(item => {
    const { file } = item;
    const audioUrl = URL.createObjectURL(file);
    const song = {
        name: file.name,
        src: audioUrl,
        volume: 1,
        fn: playSong
    }
    song.controller = folderSongs.add(song, 'fn').name(file.name);
})
//------------------------------------

Object.keys(options).forEach(key => {
    points.setUniform(key, options[key]);
    folderOptions.add(options, key, -1, 1, .0001).name(key);
})

folderOptions.open();
folderSongs.open();

points.setSampler('imageSampler', null);
points.setTexture2d('feedbackTexture', true);

audio = points.setAudio('audio', './../80s-pulse-synthwave-dude-212407.mp3', volume, loop, false);

points.setUniform('rand', 0);
points.setUniform('progress', 0);
await points.setTextureImage('font', './src/img/inconsolata_regular_8x22.png');
points.setStorageMap('chars', [15, 14, 8, 13, 19, 18], 'array<f32>')// TODO: setStorageMap doesn't work with u32 wrong sized

const renderPasses = [
    new RenderPass(vert, frag0, null),
];

await points.init(renderPasses);

points.fitWindow = true;

setInterval(_ => {
    console.log('---- 10s');
    points.setUniform('rand', Math.random());
}, 10000)


update();

// call `points.update()` methods to render a new frame
function update() {
    Object.keys(options).forEach(key => points.setUniform(key, options[key]));
    points.update();
    requestAnimationFrame(update);
}




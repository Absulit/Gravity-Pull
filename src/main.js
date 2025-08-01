import Points from 'points';
import RenderPass from 'renderpass';
import frag0 from './renderpasses/renderpass0/frag.js';
import vert from './renderpasses/renderpass0/vert.js';
import * as dat from 'datgui';
import { Dexie } from 'https://unpkg.com/dexie/dist/modern/dexie.mjs';
import { countImageColors, readTags } from './utils.js';

/**
 * @type {Points}
 */
const points = new Points('canvas');
const gui = new dat.GUI({ name: 'Points GUI' });
const folderOptions = gui.addFolder('options');
const folderControls = gui.addFolder('controls');
const folderSongs = gui.addFolder('songs');
const size = { x: 8, y: 22 }, offset = -32, atlasPath = 'src/img/inconsolata_regular_8x22.png';

let audio = null;
let loop = false;
let pauseClickTimeout = null;
let currentSong = null;

const options = {
    volume: 0.500,
    sliderA: 0.619,
    sliderB: 0.861,
    sliderC: 0.508,
}

const selectedScheme = {
    'Color Scheme': 0, // Default value
};
points.setUniform('colorScheme', 0);
const colorSchemes = {
    Default: 0,
    Matrix: 1,
    Artwork: 2,
    Negative: 3,
    Rainbow: 4,
    Cycle: 5
}
folderOptions.add(selectedScheme, 'Color Scheme', colorSchemes).onChange(v => {
    points.setUniform('colorScheme', v)
    saveOption('scheme', v);
});

function clickSong() {
    playSong(this);
}

function assingMediaSession(song) {
    if ('mediaSession' in navigator) {
        console.log(song);

        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.title || song.name,
            artist: song.artist,
            album: song.album,
        });

        if (song.artworkImageUrl) {
            navigator.mediaSession.metadata.artwork = [
                { src: song.artworkImageUrl, sizes: '1024x1024', type: 'image/jpeg' }
            ]
        }
    }
}

async function playSong(song) {
    const { file } = song;
    currentSong = song;
    saveOption('currentSongId', currentSong.id);
    points.setUniform('showMessage', 0);
    const name = song?.name || file.name;
    const title = name;

    const audioUrl = URL.createObjectURL(song.file);
    audio && audio.pause() && (audio = null);
    audio = points.setAudio('audio', audioUrl, options.volume, false, false);

    await points.setTextureString('songName', title, atlasPath, size, offset);

    let artworkLoaded = 0;
    song?.artworkColors && points.setStorageMap('artworkColors', song?.artworkColors.flat());
    song?.artworkColors && (artworkLoaded = 1);
    points.setUniform('artworkLoaded', artworkLoaded);
    audio.id = song?.id;

    assingMediaSession(song);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', loadNextSong);
    audio.play();
}

function onTimeUpdate() {
    const progress = audio.currentTime / audio.duration;
    points.setUniform('progress', progress);
}

function loadSong() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/mp3, audio/flac, audio/ogg, audio/m4v';

    fileInput.addEventListener('change', async e => {
        audio?.pause();
        const file = e.target.files[0];
        const song = loadFile(file);
        playSong(song);
    });

    fileInput.click();
}

function loadFile(file) {
    const src = URL.createObjectURL(file);
    const song = {
        id: songs.length,
        file,
        name: file.name,
        src,
        fn: clickSong
    }
    songs.push(song);

    readTags(song).then(onCompleteTags).catch(onErrorTags);

    return song;
}

function loadFolder() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.webkitdirectory = 'true';
    fileInput.directory = 'true';

    fileInput.addEventListener('change', e => {
        const files = Array.from(e.target.files);
        const filteredFiles = files.filter(file => file.type.startsWith('audio/')).sort();
        console.log('Filtered Files:', filteredFiles);
        filteredFiles.forEach(f => loadFile(f));
    });
    fileInput.click();
}

async function onCompleteTags(result) {
    const { tag, song } = result;
    const { file } = song;
    const { title, album, artist, picture } = tag.tags;
    const albumExists = album ? ` - ${album}` : '';
    const name = `${title}${albumExists}`
    let artworkImageUrl = null;
    let artworkColors = null;

    if (picture) {
        const base64String = picture.data.reduce((data, byte) => data + String.fromCharCode(byte), '');
        artworkImageUrl = `data:${picture.format};base64,${btoa(base64String)}`;
        artworkColors = await countImageColors(artworkImageUrl);
        song.artworkImageUrl = artworkImageUrl;
        song.artworkColors = artworkColors;
        points.setStorageMap('artworkColors', artworkColors.flat());
        points.setUniform('artworkLoaded', 1);

    } else {
        console.log('No album art found.');
    }

    song.name = name || file.name;
    song.title = title;
    song.album = album;
    song.artist = artist;

    assingMediaSession(song); // this is a duplicate call only on file load


    if (!song.default) {
        await db.songs.add({
            file,
            artworkImageUrl,
            artworkColors,
            title,
            album,
            artist,
            name: song.name,
        });
    }

    folderSongs.add(song, 'fn').name(song.name);

    await points.setTextureString('songName', title, atlasPath, size, offset);
}

async function onErrorTags(response) {
    const { error, song } = response;
    const { name, file } = song;

    if (!song.default) {
        await db.songs.add({
            file,
            name: name || file.name
        });
    }


    folderSongs.add(song, 'fn').name(song.name);
}

const controls = [
    {
        name: 'Load a song 📀',
        fn: loadSong
    },
    {
        name: 'Load a folder 📂',
        fn: loadFolder
    },
    {
        name: 'Play/Pause ⏯️',
        fn: _ => audio?.paused ? audio?.play() : audio?.pause()
    },
    {
        name: 'Delete playlist 🗑️',
        fn: deletePlaylist
    },
];

function deletePlaylist() {
    if (confirm('Delete all elements from the playlist?')) {
        db.songs.clear();
        location.reload();
    }
}

controls.forEach(control => {
    folderControls.add(control, 'fn').name(control.name);
});
folderControls.open();

const songs = [
    {
        default: true,
        name: 'Pulse 🎵',
        title: 'Pulse',
        artist: 'nickpanek620',
        src: './music/80s-pulse-synthwave-dude-212407.mp3',
        fn: clickSong
    },
    {
        default: true,
        name: 'Robot Swarm 🎵',
        title: 'Robot Swarm',
        artist: 'nickpanek620',
        src: './music/synthwave-80s-robot-swarm-218092.mp3',
        fn: clickSong
    },
    {
        default: true,
        name: 'Fading Echoes 🎵',
        title: 'Fading Echoes',
        artist: 'Mezhdunami',
        src: './music/mezhdunami-fading-echoes-129291.mp3',
        fn: clickSong
    }
]

songs.forEach(async (song, index) => {
    const response = await fetch(song.src);
    const blob = await response.blob();
    const file = new File([blob], song.name, { type: blob.type });
    song.file = file;
    song.id = index;
    // readTags(song).then(onCompleteTags).catch(onErrorTags);
    folderSongs.add(song, 'fn').name(song.name);
})

//------------------------------------
async function saveOption(key, value) {
    await db.options.put({ key, value });
}

async function getOption(key) {
    const option = await db.options.get(key);
    return option ? option.value : null;
}



const db = new Dexie('bhdb');
db.version(1).stores({
    songs: '++id, file',
    options: 'key'
});
const volume = await getOption('volume');
if (volume) {
    options.volume = volume;
}

const scheme = await getOption('scheme');
console.log(scheme);

const currentSongId = await getOption('currentSongId')
console.log(currentSongId);


if (scheme) {
    selectedScheme['Color Scheme'] = scheme;
    points.setUniform('colorScheme', scheme)
    folderOptions.updateDisplay();
}

const songsFromDB = await db.songs
    .toArray();

songsFromDB.forEach(item => {
    const { file } = item;
    const audioUrl = URL.createObjectURL(file);
    const song = {
        id: songs.length,
        file,
        artworkColors: item.artworkColors,
        artworkImageUrl: item.artworkImageUrl,
        name: item.name,
        title: item.title,
        artist: item.artist,
        src: audioUrl,
        fn: clickSong
    }
    song.controller = folderSongs.add(song, 'fn').name(item.name);
    songs.push(song);
})


//------------------------------------

let volumeSlider = null;
Object.keys(options).forEach(key => {
    points.setUniform(key, options[key]);
    if (key == 'volume') {
        volumeSlider = folderOptions.add(options, key, 0, 1, .0001).name(key);
    } else {
        // folderOptions.add(options, key, -1, 1, .0001).name(key)
    }
})

volumeSlider.onChange(value => {
    audio.volume = value;
    saveOption('volume', value);
});

folderOptions.open();
folderSongs.open();

points.setSampler('imageSampler', null);
points.setSampler('textImageSampler', {
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
    magFilter: 'nearest',
    minFilter: 'nearest',
    mipmapFilter: 'nearest',
    //maxAnisotropy: 10,
});
points.setTexture2d('feedbackTexture', true);

audio = points.setAudio('audio', '', options.volume, loop, false); // TODO returl null if empty or null is passed

points.setUniform('showMessage', 1);
points.setUniform('rand', 0);
points.setUniform('progress', 0);
points.setUniform('artworkLoaded', 0);
// points.setStorageMap('chars', strToCodes('Gravity Pull'), 'array<f32>')// TODO: setStorageMap doesn't work with u32 wrong sized
points.setStorageMap('artworkColors', Array(16).fill(1), 'array<vec4f>');
points.setStorage('variables', 'Variables');


await points.setTextureString('messageString', 'Select a song to Play', atlasPath, size, offset);
await points.setTextureString('songName', 'Gravity Pull', atlasPath, size, offset);

const renderPasses = [
    new RenderPass(vert, frag0, null),
];

if (await points.init(renderPasses)) {
    points.fitWindow = true;
    update();
} else {
    const el = document.getElementById('nowebgpu');
    el.classList.toggle('show');
}

points.canvas.addEventListener('click', _ => {
    if (pauseClickTimeout) {
        return;
    }
    pauseClickTimeout = setTimeout(_ => {
        // if the app starts first time it has no audio,
        // second time it has the current song saved,
        // no src means no song
        // if currentSongId then a value was saved and can be loaded
        const src = audio.getAttribute('src');
        if (!src && currentSongId) {
            currentSong = songs[currentSongId];
            playSong(currentSong)
        } else {
            audio?.paused ? audio?.play() : audio?.pause();
        }
        pauseClickTimeout = null;
    }, 300);
});

points.canvas.addEventListener('dblclick', _ => {
    clearTimeout(pauseClickTimeout);
    pauseClickTimeout = null;
    points.fullscreen = !points.fullscreen;
});

setInterval(_ => {
    console.log('---- 10s');
    points.setUniform('rand', Math.random());
}, 10000)

update();

// call `points.update()` methods to render a new frame
function update() {
    Object.keys(options).forEach(key => points.setUniform(key, options[key]));
    // points.setUniform('somecolor', colors.color2.map(i => i / 255))
    points.update();
    requestAnimationFrame(update);
}

/******************************/
let isMouseMoving = false;
let mouseStopTimeout;

const guiElement = document.querySelector('.dg.main');
let isMouseOnDatGui = false;

function onMouseStopTimeout() {
    clearTimeout(mouseStopTimeout);
    mouseStopTimeout = null;
    isMouseMoving = false;
    gui.close()
    document.body.style.cursor = 'none';
}

guiElement.addEventListener('mouseenter', () => {
    isMouseOnDatGui = true;
    clearTimeout(mouseStopTimeout);
    mouseStopTimeout = null;
});

guiElement.addEventListener('mouseleave', () => {
    isMouseOnDatGui = false;
    if (!mouseStopTimeout) {
        mouseStopTimeout = setTimeout(onMouseStopTimeout, 1000);
    }
});

document.addEventListener('mousemove', e => {
    if (!isMouseMoving) {
        isMouseMoving = true;
        gui.open()
        document.body.style.cursor = 'auto';
    }

    clearTimeout(mouseStopTimeout);
    mouseStopTimeout = null;

    if (isMouseOnDatGui) {
        return;
    }

    mouseStopTimeout = setTimeout(onMouseStopTimeout, 1000);
});



/******************************/
async function loadSongFromURL() {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const src = params.get('m');
    console.log(src);

    if (src) {
        const response = await fetch(src);
        const blob = await response.blob();
        const name = src.split('/').slice(-1);
        const file = new File([blob], name, { type: blob.type });

        const song = {
            id: songs.length,
            file,
            name: file.name,
            src,
            fn: clickSong
        }
        songs.push(song);

        readTags(song).then(onCompleteTags).catch(onErrorTags);
        playSong(song);
    }

    params.delete('m');
    url.search = params.toString();
    window.history.replaceState(null, '', url.toString());
}

loadSongFromURL()

// ----------------------------------

function loadNextSong() {
    const id = +currentSong.id;
    const nextSong = songs[id + 1] || songs[0];
    playSong(nextSong);
}

if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', _ => audio?.play());
    navigator.mediaSession.setActionHandler('pause', _ => audio?.pause());

    navigator.mediaSession.setActionHandler('stop', () => {
        audio.pause()
        audio.currentTime = 0; // Reset playback()
        assingMediaSession(currentSong);
        navigator.mediaSession.setActionHandler('play', _ => audio?.play());
    });

    navigator.mediaSession.setActionHandler('previoustrack', _ => {
        const id = +currentSong.id;
        const nextSong = songs[id - 1] || songs[songs.length - 1];
        playSong(nextSong);
    });

    navigator.mediaSession.setActionHandler('nexttrack', loadNextSong);
}

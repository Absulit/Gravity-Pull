export function playAudio(name, path, volume = .5, loop = false, autoplay = true) {
    const audio = new Audio(path);
    audio.volume = volume;
    audio.autoplay = autoplay;
    audio.loop = loop;

    const audioContext = new AudioContext();
    let resume = _ => { audioContext.resume() }
    if (audioContext.state === 'suspended') {
        document.body.addEventListener('touchend', resume, false);
        document.body.addEventListener('click', resume, false);
    }
    const source = audioContext.createMediaElementSource(audio);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    const bufferLength = analyser.fftSize;
    const data = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(data);

    const sound = {
        name: name,
        path: path,
        audio: audio,
        analyser: analyser,
        data: data
    }
    return sound;
}
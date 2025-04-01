export function setAudio(name, path, volume, loop, autoplay) {
    const audio = new Audio(path);
    audio.volume = volume;
    audio.autoplay = autoplay;
    audio.loop = loop;

    // this.#audio.play();
    // audio
    const audioContext = new AudioContext();
    let resume = _ => { audioContext.resume() }
    if (audioContext.state === 'suspended') {
        document.body.addEventListener('touchend', resume, false);
        document.body.addEventListener('click', resume, false);
    }
    const source = audioContext.createMediaElementSource(audio);
    // // audioContext.createMediaStreamSource()
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    const bufferLength = analyser.fftSize;//analyser.frequencyBinCount;
    // const bufferLength = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLength);
    // analyser.getByteTimeDomainData(data);
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
export function strToCodes(str) {
    return Array.from(str).map(char => char.charCodeAt(0))
}

export function readTags(song) {
    return new Promise((resolve, reject) => {
        jsmediatags.read(song.file, {
            onSuccess: tag => resolve({ tag, song }),
            onError: error => reject({ error, song })
        });
    });
}

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

export async function countImageColors(src) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    return new Promise((resolve, reject) => {
        // Load the image into the canvas
        const img = new Image();
        img.src = src; // Replace with your image URL
        img.onload = _ => {
            const side = 16;
            canvas.width = side;
            canvas.height = side;
            ctx.drawImage(img, 0, 0, side, side);



            // Get pixel data
            // console.log(canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, side, side);
            const data = imageData.data;

            const dataURL = canvas.toDataURL('image/png');
            console.log(dataURL);


            // Count unique colors
            const colorCounts = {};
            for (let i = 0; i < data.length; i += 4) {
                const r = (data[i] / 255).toFixed(3);
                const g = (data[i + 1] / 255).toFixed(3);
                const b = (data[i + 2] / 255).toFixed(3);
                const a = (data[i + 3] / 255).toFixed(3); // Alpha channel

                const color = `${r},${g},${b},${a}`;
                colorCounts[color] = (colorCounts[color] || 0) + 1;
            }

            // console.log('Unique Colors:', Object.keys(colorCounts).length);
            // console.log('Color Counts:', colorCounts);

            let sortedColors = Object.entries(colorCounts).sort(([, valueA], [, valueB]) => valueB - valueA).slice(0, 10);
            // console.log('sortedColors:', sortedColors);
            sortedColors = sortedColors.map(colorItem => colorItem[0].split(','));
            resolve(sortedColors)
        };

    });
}

/**
 *
 * @param {Image} atlas Image atlas to parse
 * @param {CanvasRenderingContext2D} ctx Canvas context
 * @param {Number} index index in the atlas, so 0 is the first char
 * @param {Object} size cell dimensions
 * @param {Number} finalIndex final positional index in the canvas
 */
export function sprite(atlas, ctx, index, size, finalIndex) {
    const { width } = atlas;
    const numColumns = width / size.x

    const x = index % numColumns;
    const y = Math.floor(index / numColumns);

    ctx.drawImage(
        atlas,
        x * size.x,
        y * size.y,
        size.x,
        size.y,

        size.x * finalIndex,
        0,

        size.x,
        size.y);
}

export function strToImage(str, atlasImg, size){
    const chars = strToCodes(str);
    const canvas = document.createElement('canvas');
    canvas.width = chars.length * size.x;
    canvas.height = size.y;
    const ctx = canvas.getContext('2d');

    chars.forEach((c, i) => sprite(atlasImg, ctx, c - 32, size, i));
    return canvas.toDataURL('image/png');
}

export async function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = err => reject(err);
    });
}

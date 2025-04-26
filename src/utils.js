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

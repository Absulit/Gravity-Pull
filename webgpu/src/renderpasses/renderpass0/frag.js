import { fnusin } from 'animation';
import { texturePosition } from 'image';
import { rotateVector } from 'math';
import { snoise } from 'noise2d';
import { sdfCircle, sdfLine2, sdfSegment } from 'sdf';

const frag = /*wgsl*/`

${fnusin}
${sdfSegment}
${sdfLine2}
${texturePosition}
${snoise}
${sdfCircle}
${rotateVector}

@fragment
fn main(
    @location(0) color: vec4f,
    @location(1) uv: vec2f,
    @location(2) ratio: vec2f,  // relation between params.screen.x and params.screen.y
    @location(3) uvr: vec2f,    // uv with aspect ratio corrected
    @location(4) mouse: vec2f,
    @builtin(position) position: vec4f
) -> @location(0) vec4f {

    // params.audioLength 1024
    let audioX = audio.data[ u32(uvr.x * 800)] / 256;

    let n = snoise(uvr * 2 + params.time * .01);
    let s = sdfCircle(.5 * ratio, .1, .5, uvr);
    let t = sdfCircle(.5 * ratio, .1, .00001, -uvr);

    // let feedbackColor = texturePosition(feedbackTexture, imageSampler, vec2(), uvr  * vec2f(1, s), true);

    let uvrRotate = rotateVector(uvr, params.time * .001 * audioX);
    let feedbackColor = texturePosition(feedbackTexture, imageSampler, vec2(), uvrRotate  / vec2f(1, 1.01), true);




    // let segmentNum = 4;
    // let subSegmentLength = i32(params.audioLength) / segmentNum;

    // for (var index = 0; index < segmentNum ; index++) {
    //     var audioAverage = 0.;
    //     for (var index2 = 0; index2 < subSegmentLength; index2++) {
    //         let audioIndex = index2 * index;

    //         let audioValue = audio.data[audioIndex] / 256;
    //         audioAverage += audioValue;
    //     }
    //     result[index] = audioAverage / f32(subSegmentLength);
    // }











    let height = 0.;
    // let uvrRotateLine = rotateVector(uvr, params.time * .01);
    let l = sdfLine2(vec2(0, height + audioX) * ratio, vec2(1, height + audioX) * ratio, .005, uvr);

    let finalColor = vec4f(l,l*audioX,0,1) + feedbackColor * .98;
    // let finalColor = vec4f(1,s,0,1);

    return finalColor;
}
`;

export default frag;

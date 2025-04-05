import { fnusin } from 'animation';
import { texturePosition } from 'image';
import { PI, rotateVector, TAU } from 'math';
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
${TAU}
${PI}

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
    let audio0 = audio.data[ u32(.5 * 800)] / 256;

    let n = snoise(uvr * 2 + params.time * .01);
    let s = sdfCircle(.5 * ratio, .5 * audio0, .1, uvr);
    let t = sdfCircle(.5 * ratio, .1, .00001, -uvr);

    // let feedbackColor = texturePosition(feedbackTexture, imageSampler, vec2(), uvr  * vec2f(1, s), true);

    let center = vec2(.5) * ratio;
    let uvrRotate = rotateVector(uvr - center, PI * .001) + center; // option 1
    // let uvrRotate = rotateVector(uvr - center, s) + center; // option 2

    // let feedbackColor = texturePosition(feedbackTexture, imageSampler, vec2(), uvrRotate / vec2f(1.01 * s, 1.01 / s) , true);
    let feedbackColor = texturePosition(feedbackTexture, imageSampler, vec2(), uvrRotate / vec2f(1, 1.01), true);



    let height = 0.;
    // let uvrRotateLine = rotateVector(uvr, params.time * .01);
    let l = sdfLine2(vec2(0, height + audioX) * ratio, vec2(1, height + audioX) * ratio, .005, uvr);

    let finalColor = vec4f(l,l*audioX, l*uvrRotate.x, 1) + feedbackColor * .98;
    // let finalColor = vec4f(1,s,0,1);

    return finalColor;
}
`;

export default frag;

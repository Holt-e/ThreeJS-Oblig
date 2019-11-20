import { ShaderMaterial, Color, ShaderLib, UniformsLib, UniformsUtils } from '../lib/three.module.js';

import ShaderCustomiser from './ShaderCustomiser.js';

export default class Paperplanes extends ShaderMaterial {
    /**
     * Contructor for TextureSplattingMaterial.
     *
     * @param color
     * @param emissive
     * @param specular
     * @param shininess
     * @param {Array<Texture>} textures
     * @param {Array<Texture>} splatMaps For blending between the textures. One less than textures.
     * @param map
     */
    constructor({
                    color = 0xffffff,
                    emissive = 0x000000,
                    specular = 0x111111,
                    shininess = 30,
                    textures = null,
                    splatMaps = null,
                    map = null
                }) {

        const uniforms = UniformsUtils.merge([
            // pass in the defaults from uniforms lib.
            UniformsLib.common,
            UniformsLib.specularmap,
            UniformsLib.envmap,
            UniformsLib.aomap,
            UniformsLib.lightmap,
            UniformsLib.emissivemap,
            UniformsLib.bumpmap,
            UniformsLib.normalmap,
            UniformsLib.displacementmap,
            UniformsLib.gradientmap,
            UniformsLib.fog,
            UniformsLib.lights,
            {
                diffuse: { value: new Color(color) },
                emissive: { value: new Color(emissive) },
                specular: { value: new Color(specular) },
                shininess: { value: shininess }
            }
        ]);

        /** START Custom shader code: */

        const paperplane_vertex = `
        precision highp float;
		uniform float sineTime;
		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;
		attribute vec3 position;
		attribute vec3 offset;
		attribute vec4 color;
		attribute vec4 orientationStart;
		attribute vec4 orientationEnd;
		varying vec3 vPosition;
		varying vec4 vColor;
		
		void main(){
			vPosition = offset * max( abs( sineTime * 2.0 + 1.0 ), 0.5 ) + position;
			vec4 orientation = normalize( mix( orientationStart, orientationEnd, sineTime ) );
			vec3 vcV = cross( orientation.xyz, vPosition );
			vPosition = vcV * ( 2.0 * orientation.w ) + ( cross( orientation.xyz, vcV ) * 2.0 + vPosition );
			vColor = color;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );
		} `;

        const paperplane_fragment = `
        precision highp float;
        uniform float time;
        varying vec3 vPosition;
        varying vec4 vColor;
        void main() {
        vec4 color = vec4( vColor );
        color.r += sin( vPosition.x * 10.0 + time ) * 0.5;tgl_FragColor = color;
        }
                `;

        /** END*/

            // generate customised shaders. i. e. replace or append code to an existing shader program.

        const vertexShader = ShaderCustomiser.customise(ShaderLib.phong.vertexShader, {
                uv_pars_vertex: paperplane_vertex,
            });

        const fragmentShader = ShaderCustomiser.customise(ShaderLib.phong.fragmentShader, {
            uv_pars_fragment: paperplane_fragment,
        });

        super({
            vertexShader,
            fragmentShader,
            uniforms,
            fog: true, // enable fog for this material
            lights: true // enable lights for this material
        });
    }
}

import { ShaderMaterial, Color, ShaderLib, UniformsLib, UniformsUtils } from '../lib/three.module.js';

import ShaderCustomiser from './ShaderCustomiser.js';

export default class SelectiveDrawSun extends ShaderMaterial {
    /**
     * Contructor for TextureSplattingMaterial.
     *
     * @param {Array<Texture>} textures
     * @param {Array<Texture>} splatMaps For blending between the textures. One less than textures.
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

        const defines = {};

        if (map !== null) {
            uniforms.map = {
                type: "t",
                value: map
            };

            defines.USE_MAP = '';
        }

        if (textures !== null && splatMaps !== null) {

            uniforms.textures = {
                type: "tv",
                value: textures
            };

            uniforms.splatMaps = {
                type: "tv",
                value: splatMaps
            }

            uniforms.textureUvTransforms = {
                type: "Matrix3fv",
                value: textures.map((texture) => {

                    texture.matrix.setUvTransform(
                        texture.offset.x,
                        texture.offset.y,
                        texture.repeat.x,
                        texture.repeat.y,
                        texture.rotation,
                        texture.center.x,
                        texture.center.y
                    );

                    return texture.matrix;
                })
            }

            defines.USE_SPLATMAP = '';

        }

        // antallet teksturer som skal legges på terrenget.
        const length = (textures !== null) ? textures.length : 0;


        /** START Custom shader code: */

        const selectiveDraw_vertex = `
        attribute float visible;
        varying float vVisible;
        attribute vec3 vertColor;
        varying vec3 vColor;
        
        void main() {
            vColor = vertColor;
            vVisible = visible;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;

        const selectiveDraw_fragment = `
        varying float vVisible;
        varying vec3 vColor;
        
        void main() {
            if ( vVisible > 0.0 ) {
            gl_FragColor = vec4( vColor, 1.0 );
            } else {
            discard;
            }
        }
                `;

        /** END*/

            // generate customised shaders. i. e. replace or append code to an existing shader program.

        const vertexShader = ShaderCustomiser.customise(ShaderLib.phong.vertexShader, {
                uv_pars_vertex: selectiveDraw_vertex,
            });

        const fragmentShader = ShaderCustomiser.customise(ShaderLib.phong.fragmentShader, {
            uv_pars_fragment: selectiveDraw_fragment ,


        });

        super({
            vertexShader,
            fragmentShader,
            uniforms,
            defines,
            fog: true, // enable fog for this material
            lights: true // enable lights for this material
        });
    }
}
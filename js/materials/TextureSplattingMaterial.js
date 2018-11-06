
import { Material, Color, ShaderLib, UniformsLib, UniformsUtils } from '../lib/three.module.js';

console.log(ShaderLib.phong);

function getShaders({ length }) {

    let vertexShader = `#define PHONG
    varying vec3 vViewPosition;

    #ifndef FLAT_SHADED
        varying vec3 vNormal;
    #endif

    // custom
    #ifdef USE_SPLATMAP
        uniform mat3 textureUvTransforms[${length}]; // repeat vector for each texture.
        varying vec2 textureUVs[${length}]; // pass to fragment shader.
    #endif

    #include <common>
    
    #if defined( USE_SPLATMAP ) || defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )

        varying vec2 vUv;
        uniform mat3 uvTransform;

    #endif

    #include <uv2_pars_vertex>
    #include <displacementmap_pars_vertex>
    #include <envmap_pars_vertex>
    #include <color_pars_vertex>
    #include <fog_pars_vertex>
    #include <morphtarget_pars_vertex>
    #include <skinning_pars_vertex>
    #include <shadowmap_pars_vertex>
    #include <logdepthbuf_pars_vertex>
    #include <clipping_planes_pars_vertex>

    void main() {

        // custom
        #ifdef USE_SPLATMAP
            for (int i = 0; i < ${length}; i++) {
                textureUVs[i] = (textureUvTransforms[i] * vec3(uv, 1)).xy;
            }
        #endif

        #if defined( USE_SPLATMAP ) || defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )

            vUv = ( uvTransform * vec3( uv, 1 ) ).xy;

        #endif

        #include <uv2_vertex>
        #include <color_vertex>

        #include <beginnormal_vertex>
        #include <morphnormal_vertex>
        #include <skinbase_vertex>
        #include <skinnormal_vertex>
        #include <defaultnormal_vertex>

        #ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED

            vNormal = normalize( transformedNormal );

        #endif

        #include <begin_vertex>
        #include <morphtarget_vertex>
        #include <skinning_vertex>
        #include <displacementmap_vertex>
        #include <project_vertex>
        #include <logdepthbuf_vertex>
        #include <clipping_planes_vertex>

        vViewPosition = - mvPosition.xyz;

        #include <worldpos_vertex>
        #include <envmap_vertex>
        #include <shadowmap_vertex>
        #include <fog_vertex>

    }`;

    let fragmentShader = `#define PHONG

    uniform vec3 diffuse;
    uniform vec3 emissive;
    uniform vec3 specular;
    uniform float shininess;
    uniform float opacity;

    #include <common>
    #include <packing>
    #include <dithering_pars_fragment>
    #include <color_pars_fragment>
    
    // added splatmap as condition to declare vUv
    #if defined( USE_SPLATMAP ) || defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )

        varying vec2 vUv;

    #endif

    #include <uv2_pars_fragment>
    #include <map_pars_fragment>
    #include <alphamap_pars_fragment>
    #include <aomap_pars_fragment>
    #include <lightmap_pars_fragment>
    #include <emissivemap_pars_fragment>
    #include <envmap_pars_fragment>
    #include <gradientmap_pars_fragment>
    #include <fog_pars_fragment>
    #include <bsdfs>
    #include <lights_pars>
    #include <lights_phong_pars_fragment>
    #include <shadowmap_pars_fragment>
    #include <bumpmap_pars_fragment>
    #include <normalmap_pars_fragment>
    #include <specularmap_pars_fragment>
    #include <logdepthbuf_pars_fragment>
    #include <clipping_planes_pars_fragment>

    #ifdef USE_SPLATMAP
        uniform sampler2D textures[${length}];
        uniform sampler2D splatMaps[${length - 1}]; // one less splatmap than textures.

        varying vec2 textureUVs[${length}]; // computed in vertexshader
    #endif

    void main() {

        #include <clipping_planes_fragment>

        vec4 diffuseColor = vec4( diffuse, opacity );
        ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
        vec3 totalEmissiveRadiance = emissive;

        #ifdef USE_SPLATMAP

            float splatSum = 0.0;

            for (int i = 0; i < ${length - 1}; i++) {
                splatSum += texture2D(splatMaps[i], vUv).r;
            }

            vec4 accumulated = texture2D(textures[0], textureUVs[0]).rgba * (1.0 - splatSum);

            for (int i = 1; i < ${length}; i++) {
                vec4 texel = texture2D(textures[i], textureUVs[0]);
                vec4 splatTexel = texture2D(splatMaps[i - 1], vUv);

                accumulated = mix(accumulated, texel, splatTexel.r);
            }

            //accumulated = mapTexelToLinear(accumulated);
            diffuseColor *= accumulated;
        #endif

        #include <logdepthbuf_fragment>
        #include <map_fragment>
        #include <color_fragment>
        #include <alphamap_fragment>
        #include <alphatest_fragment>
        #include <specularmap_fragment>
        #include <normal_fragment>
        #include <emissivemap_fragment>

        // accumulation
        #include <lights_phong_fragment>
        #include <lights_template>

        // modulation
        #include <aomap_fragment>

        vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

        #include <envmap_fragment>

        gl_FragColor = vec4( outgoingLight, diffuseColor.a );

        #include <tonemapping_fragment>
        #include <encodings_fragment>
        #include <fog_fragment>
        #include <premultiplied_alpha_fragment>
        #include <dithering_fragment>

    }`;

    return {
        vertexShader,
        fragmentShader
    };
}

export default class TextureSplattingMaterial extends Material {
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

        const { vertexShader, fragmentShader } = getShaders({
            length: (textures !== null) ? textures.length : 0
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
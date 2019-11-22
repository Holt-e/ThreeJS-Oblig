"use strict";


import {
    ShaderMaterial
} from "../lib/three.module.js";

/**
 * Shader som får et Materiale som "pulserer" med rød som sterkest farge
 */
export default class SunMaterial extends ShaderMaterial {

    /**
     * Constructor
     * @param time uniform verdi som brukes for animering
     * @param map tekstur for solen
     */
    constructor({
                    time= 0.1,
                    map = null,

                }
    ){

        const vertexShader =
            `#version 300 es
        
                precision mediump float;
                
                uniform float time;
                
                out vec2 vUv;
                
                void main()
                {
                   vUv = uv;
                   gl_Position = projectionMatrix * modelViewMatrix  * vec4(position, 1.0);
                }
            `;

        const fragmentShader =
            `#version 300 es
                
                precision mediump float;
                
                uniform sampler2D tex;
                uniform float time;
                in vec2 vUv;
                out vec4 fColor;
                
                vec3 farge;
                
                void main()
                {
                    vec4 textureColor = texture(tex, vUv);
                   
                    farge.r = clamp(  abs(sin(time*0.3)) , 0.2 , 1.0);
                    farge.g = clamp(  abs(sin(time*0.3)) , 0.0 , 0.6);
                    farge.b = clamp(  abs(sin(time*0.3)) , 0.0 , 0.6);
                    
                    fColor = vec4(textureColor.xyz * farge, 1.0);                    
                }
            `;

        super({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                tex : {
                    value: map
                },
                time: {
                    value: time
                },
            },
        });
    }
}
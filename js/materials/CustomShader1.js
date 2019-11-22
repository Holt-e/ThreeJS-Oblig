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
     */
    constructor({
                    time= 1.0,
                }
    ){

        const vertexShader2 =
            `#version 300 es
        
        varying vec2 vUv;
        void main()
        {
            vUv = uv;
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            gl_Position = projectionMatrix * mvPosition;
        }
            `;

        const fragmentShader2 =
            `#version 300 es
                
                       uniform float time;
        varying vec2 vUv;
        void main( void ) {
            vec2 position = - 1.0 + 2.0 * vUv;
            float red = abs( sin( position.x * position.y + time / 5.0 ) );
            float green = abs( sin( position.x * position.y + time / 4.0 ) );
            float blue = abs( sin( position.x * position.y + time / 3.0 ) );
            gl_FragColor = vec4( red, green, blue, 1.0 );
        }
            `;

        super({
            vertexShader: vertexShader2,
            fragmentShader: fragmentShader2,
            uniforms: {
                time: {
                    value: time
                },
            },
        });
    }
}
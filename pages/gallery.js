import { Suspense, useRef,useEffect,useMemo,useState } from 'react'
import * as THREE from "three";
import { Canvas, useThree, useFrame,useLoader,extend } from '@react-three/fiber'
import {shaderMaterial, Loader,useScroll,ScrollControls, Scroll, Preload, Image as ImageImpl, OrbitControls,useTexture,MapControls,Html } from '@react-three/drei'
import Box from '../components/Image'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { CustomPass } from '../components/CustomPass.js';
// import Loader from '../components/Loader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import glsl from "babel-plugin-glsl/macro"; // <--- Module to import
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import { DotScreenShader } from 'three/examples/jsm/shaders/DotScreenShader.js';
import {ResizeObserver} from '@juggle/resize-observer'

// Inside your app
import { useControls } from 'leva'
import gsap from "gsap";


const settings = {
  progress: 1,
  scale: 3,
  effectTime: 0.01,
  sliderEffectScale: 25
};
function distort(){
  gsap.to(settings, {progress:0,duration:2})
}
function unDistort(){
  gsap.to(settings, {progress:1,duration:2})
}

unDistort()

function MyEffects() {
  const { gl, scene, camera, size } = useThree()
  const { Progress,Scale,Time } = useControls({
    Progress: {
      value: settings.progress,
      min: 0,
      max: 1,
      step: .1,
    },
    Scale: {
      value: settings.scale,
      min: 0,
      max: 10,
      step: .1,
    },
    Time: {
      value: settings.effectTime,
      min: 0,
      max: 0.5,
      step: .01,
    },
  })

 
  
  const [base, final] = useMemo(() => {
    const renderScene = new RenderPass(scene, camera);
    // const offscreenTarget = new THREE.WebGLRenderTarget(size.width, size.height);
    const comp = new EffectComposer(gl);
    comp.addPass( renderScene );
    const effect1 = new ShaderPass(DotScreenShader)

    const finalComposer = new EffectComposer(gl);

    const effect = new ShaderPass(CustomPass)
    const fragment = `
    uniform vec2 center;
		uniform float angle;
		uniform float scale;
		uniform vec2 tSize;
        uniform float time;
        uniform float progress;
      

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		float pattern() {

			float s = sin( angle ), c = cos( angle );

			vec2 tex = vUv * tSize - center;
			vec2 point = vec2( c * tex.x - s * tex.y, s * tex.x + c * tex.y ) * scale;

			return ( sin( point.x ) * sin( point.y ) ) * 4.0;

		}

		void main() {
            vec2 newUV = vUv;





            vec2 p = 2.*vUv - vec2(1.);



            p += 0.1*cos(scale * 3.*p.yx + time + vec2(1.2,3.4));
            p += 0.1*cos(scale * 3.7*p.yx + 1.4* time + vec2(2.2,3.4));
             p += 0.1*cos(scale * 5.*p.yx + 2.6* time + vec2(4.2,3.4));
             p += 0.1*cos(scale * 7.*p.yx + 3.6* time + vec2(10.2,3.4));
             //p += 0.2*sin(scale / 1.*p.yx + 3.6* time + vec2(10.2,3.4));




            newUV = vUv + p*vec2(0.,1.);

            newUV.x = mix(vUv.x, length(p), progress);
            newUV.y = mix(vUv.y, 0., progress);


			vec4 color = texture2D( tDiffuse, newUV );
            gl_FragColor = color;

           // gl_FragColor = vec4(length(p),newUV,1.);

		}
    `

    const vertex = `
    varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}
    `
    const finalPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {

          'tDiffuse': { value: null },
          'tSize': { value: new THREE.Vector2( 256, 256 ) },
          'center': { value: new THREE.Vector2( 0.5, 0.5 ) },
          'angle': { value: 20.57 },
          'time' : {value: 0},
              'progress' : {value: Progress},
              'scale' : {value: settings.scale}
      
        },
        vertexShader:vertex,
        fragmentShader:fragment
      })
      
    )
    comp.addPass(finalPass)

    return [comp, finalComposer];
  }, []);


  useEffect(() => {
    base.setSize(size.width, size.height);
    final.setSize(size.width, size.height);
  }, [base, final, size])

  const { toggle, sliderTransition } = useControls({ 
    toggle: true,
    sliderTransition:false,
    sliderEffectScale: {
      value: settings.sliderEffectScale,
      min:0,
      max:100,
      step:5
    },
    
  })
  useEffect(()=>{
    if(toggle === true){
      gsap.to(base.passes[1].uniforms.progress, {value:1,duration:2})
    }else{
      gsap.to(base.passes[1].uniforms.progress, {value:0,duration:2})
    }
  },[toggle])
  
  const data = useScroll();
  console.log(data)

  useEffect(()=>{
    

  }, [data.delta])
  return useFrame((delta) => {
    base.passes[1].uniforms.scale.value = Scale    
     if(sliderTransition === true && toggle === false){
       base.passes[1].uniforms.progress.value = THREE.MathUtils.damp(base.passes[1].uniforms.progress.value, data.delta*sliderEffectScale.value, 4, .10)

     }
    // base.passes[1].uniforms.progress.value = Progress
    gl.autoClear = false
    gl.clear()
    base.passes[1].uniforms.time.value += Time
     base.render();
     //final.render();
  },1);
}


export default function GalleryPage() {
 
  return (
    <>
    <Canvas gl={{ antialias: true }} resize={{polyfill:ResizeObserver}}>
        <color attach="background" args={['#ffffff']} />
        <Suspense fallback={null}>

        <ambientLight intensity={1} /> 
        {/* <fog /> */}
        <pointLight position={[40, 40, 40]} /> 

          <ScrollControls visible infinite horizontal damping={4} pages={4} distance={1}>
              <Scroll>
              <Pages />


          <MyEffects />
              </Scroll>

          </ScrollControls>

          <Preload  all/>
          </Suspense>

      </Canvas>
      <Loader />

    </>
  )
}




function Image(props) {
  const { toggle, sliderTransition, grayscale } = useControls({ toggle: true,sliderTransition: false, grayscale:true })

  const ref = useRef();
  const img = useRef()
  const group = useRef();
  const data = useScroll();
  useFrame((state, delta) => {
    if(toggle){
      group.current.position.y = THREE.MathUtils.damp(group.current.position.y, -2, 4, delta);
      group.current.rotation.z = THREE.MathUtils.damp(group.current.rotation.z, -0.1, 4, delta);
    }else{
      group.current.rotation.z = THREE.MathUtils.damp(group.current.rotation.z, 0, 1, delta);
      group.current.position.y = THREE.MathUtils.damp(group.current.position.y, -0.1, 4, delta);
      
    }
    // group.current.position.z = THREE.MathUtils.damp(group.current.position.z, Math.max(0, data.delta * 50), 4, delta)
    grayscale===true?
    ref.current.material.grayscale = THREE.MathUtils.damp(ref.current.material.grayscale, Math.max(0, 1 - data.delta * 1000), 4, delta)
    : ref.current.material.grayscale = 0
  });
  return (
    <group ref={group}>
      <ImageImpl ref={ref} {...props} />
    </group>
  );
}

function Page({ m = 0.4, urls, ...props }) {
  const img = useRef()

  const { width } = useThree((state) => state.viewport);
  const w = width < 10 ? 1.5 / 3 : 1 / 3;
  useFrame((state, delta) => {
    if(img.current){
       //img.current.rotation.z += .1
       //img.current.position.y = Math.sin(delta * 10) -1 

    }
});
  return (
    <group {...props}ref={img}>
      <Image  position={[-width * w, 0, -1]} scale={[width * w - m * 2, 5, 1]} url={urls[0]} />
      <Image position={[0, 0, 0]} scale={[width * w - m * 2, 5, 1]} url={urls[1]} />
      <Image position={[width * w, 0, 1]} scale={[width * w - m * 2, 5, 1]} url={urls[2]} />
    </group>

  );
}

function Pages() {
  const { width } = useThree((state) => state.viewport);
  const z = 0
  const y = 0
  return (
    <>
      <Page position={[-width * 1, y, z]} urls={["./img1/1.jpg", "./img1/2.jpg", "./img1/3.jpg"]} />
      <Page position={[width * 0, y, z]} urls={["./img1/4.jpg", "./img1/5.jpg", "./img1/6.jpg"]} />
      <Page position={[width * 1, y, z]} urls={["./img1/7.jpg", "./img1/8.jpg", "./img1/9.jpg"]} />
      <Page position={[width * 2, y, z]} urls={["./img1/1.jpg", "./img1/2.jpg", "./img1/3.jpg"]} />
      <Page position={[width * 3, y, z]} urls={["./img1/4.jpg", "./img1/5.jpg", "./img1/6.jpg"]} />
     
      <Page position={[width * 4, y, z]} urls={["./img1/7.jpg", "./img1/8.jpg", "./img1/9.jpg"]} />
      {/* <Page position={[width * 5, y, z]} urls={["./img/7.jpg", "./img/8.jpg", "./img/7.jpg"]} />
      <Page position={[width * 6, y, z]} urls={["./img/8.jpg", "./img/8.jpg", "./img/7.jpg"]} />
      <Page position={[width * 7, y, z]} urls={["./img/9.jpg", "./img/8.jpg", "./img/7.jpg"]} />
      <Page position={[width * 8, y, z]} urls={["./img/1.jpg", "./img/8.jpg", "./img/7.jpg"]} /> */}

    </>
  );
}


// p += 0.1*cos(scale * 3.*p.yx + time + vec2(1.2,3.4));
// //p += 0.1*cos(scale * 3.7*p.yx + 1.4* time + vec2(2.2,3.4));
// // p += 0.1*cos(scale * 5.*p.yx + 2.6* time + vec2(4.2,3.4));
//  //p += 0.1*cos(scale * 7.*p.yx + 3.6* time + vec2(10.2,3.4));
//  //p += 0.2*sin(scale / 1.*p.yx + 3.6* time + vec2(10.2,3.4));


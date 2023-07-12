// Importing necessary modules from 'three', 'react', and other libraries.
// Three.js is a cross-browser JavaScript library used to create and display animated 3D computer graphics in a web browser.
// react is a JavaScript library for building user interfaces.
// The IFCLoader is used to load IFC files, which are used in the building industry to share data across different software applications.
import {
    AmbientLight,
    AxesHelper,
    DirectionalLight,
    GridHelper,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { IFCLoader } from 'web-ifc-three/IFCLoader';
import { useEffect, useRef } from 'react';

// The main React component that will render the IFC scene
// The function takes three props: 'url' of the IFC model, 'expand' to indicate if the model should be expanded, and 'isAndroid' to check if the device is Android
function IfcScene({ url, expand, isAndroid }) {

    // useRef() is a built-in React Hook that allows you to create references to HTML DOM elements.
    // Here it is being used to create references to the Scene, IFCLoader, and WebGLRenderer objects.
    // These references will be used throughout the component.
    const scene = useRef(new Scene());
    const ifcLoader = useRef(new IFCLoader());
    const renderer = useRef(null);

    // Define the size and aspect ratio of the scene
    const size = {
        width: window.innerWidth,
        height: window.innerHeight,
    };
    const aspect = size.width / size.height;

    // Create a new PerspectiveCamera, which is used to simulate the way the human eye sees.
    // The first argument is the field of view, the second is the aspect ratio, and the third and fourth are the near and far clipping planes.
    const camera = new PerspectiveCamera(75, aspect);
    camera.position.z = 0;
    camera.position.y = 2;
    camera.position.x = 2;

    // Define the canvas, light settings, grid, axes, and controls
    const canvasRef = useRef();
    const lightColor = 0xffffff;
    // AmbientLight is a type of light that globally illuminates all objects in the scene equally.
    // The first argument is the color of the light, and the second is the intensity.
    const ambientLight = new AmbientLight(lightColor, 0.8);
    // DirectionalLight is a type of light that acts as a distant light source that emits light in a specific direction.
    const directionalLight = new DirectionalLight(lightColor, 1);
    directionalLight.position.set(0, 10, 0);
    directionalLight.target.position.set(15, 0, 0);
    const grid = new GridHelper(50, 30);
    const axes = new AxesHelper();
    const controls = useRef(null);

    // Function to release memory used by the IFCLoader
    const releaseMemory = async () => {
        await ifcLoader.current?.ifcManager?.dispose();
        ifcLoader.current = new IFCLoader();
    };

    // Function to render the model from the given URL
    const renderModel = async (url) => {
        await releaseMemory();

        // Set up the scene and add lights
        scene.current = new Scene();
        scene.current.add(ambientLight);
        scene.current.add(directionalLight);
        scene.current.add(directionalLight.target);

        // Set up the WebGL renderer
        renderer.current = new WebGLRenderer({
            canvas: canvasRef.current,
            alpha: true,
        });

        // Set the size of the renderer depending on the device type
        if (isAndroid) {
            renderer.current.setSize(600, 200);
        } else {
            renderer.current.setSize(size.width / 3, size.height / 2);
        }

        // Set the device pixel ratio for the renderer
        renderer.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Add grids and axes to the scene
        scene.current.add(grid);
        axes.material.depthTest = false;
        axes.renderOrder = 1;
        scene.current.add(axes);

        // Set up the OrbitControls for navigating the scene
        controls.current = new OrbitControls(camera, canvasRef.current);
        controls.current.enableDamping = true;
        controls.current.target.set(0, 1, 0);

        // Set the animation loop to update the controls and render the scene
        renderer.current.setAnimationLoop(() => {
            controls.current?.update();
            renderer.current?.render(scene.current, camera);
        });

        // Load the IFC model and add it to the scene
        ifcLoader.current?.ifcManager.setWasmPath('../../');
        ifcLoader.current?.load(url, (ifcModel) => scene.current.add(ifcModel));
    };

    // Use the 'useEffect' hook to render the model whenever the URL changes
    // 'useEffect' is a built-in React Hook that allows you to perform side effects in function components.
    useEffect(() => {
        renderModel(url);
    }, [url]);

    // Return the canvas element to be rendered by React
    return (
        <canvas
            className={'model-canvas ' + (expand ? 'expanded' : '')}
            ref={canvasRef}
        ></canvas>
    );
}

// Export the component for use in other modules
export default IfcScene;

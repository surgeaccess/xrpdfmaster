import { useState, useEffect } from 'react';
import IfcScene from '../ifc-scene/scene';
import previewImg from '../../assets/icons/usdz-preview.png';

function ModelCore({ model }) {
    const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });

    useEffect(() => {
        const intervalId = setInterval(() => {
            setRotation(prev => {
                const { x, y, z } = prev;
                return {
                    x: (x + 45) % 360,
                    y: (y + 45) % 360,
                    z: (z + 45) % 360
                };
            });
        }, 2000);

        return () => clearInterval(intervalId);
    }, []);

    const UsdzScene = () => {
        const a = document.createElement('a');
        if (a.relList.supports('ar')) {
            // AR is available.
            return (
                <a href={model?.url} rel="ar" className="ifc-model-ctn">
                    <img
                        alt="preview for usdz viewer"
                        src={previewImg}
                        className="ifc-model-preview"
                    />
                </a>
            );
        } else {
            return <div>device not supported</div>;
        }
    };

    return (
        <>
            {model?.type === 'glb' ? (
                <model-viewer
                    style={{ width: '100%', height: '100%' }}
                    camera-controls
                    alt="GLB model viewer"
                    src={model?.url}
                    camera-orbit={`${rotation.x}deg ${rotation.y}deg ${rotation.z}%`}
                ></model-viewer>
            ) : null}
            {model?.type === 'ifc' ? <IfcScene url={model?.url} /> : null}
            {model?.type === 'usdz' ? UsdzScene() : null}
        </>
    );
}

export default ModelCore;

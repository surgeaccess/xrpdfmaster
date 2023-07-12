import { useState, useEffect } from 'react';
import { FaArrowLeft, FaArrowRight, FaExpand } from 'react-icons/fa';
import ModelCore from './ModelCore';

//* Component controls viewing 3d Models
function ModelViewer({ SD_pdfPropts, modelArr, isAndroid }) {
    const { state, action } = SD_pdfPropts;
    const [model, setModel] = useState(null);
    const [modelInd, setModelInd] = useState(null);

    useEffect(() => {
        // force update highlight array
        updateModelInd(0);
    }, [modelArr, state?.pages?.curr]);

    const setActiveLink = (link) => {
        action({
            type: 'chng-active-link',
            data: link,
        });
    };

    const updateModel = (modelInd) => {
        if (modelArr && modelInd >= 0 && modelInd < modelArr.length) {
            setModel(modelArr[modelInd]);
            return;
        }
        setModel(null);
    };

    const updateModelInd = (newInd) => {
        if (newInd < 0 || (modelArr.length && newInd >= modelArr.length)) {
            return;
        }
        setModelInd(newInd);
        updateModel(newInd);
    };

    if (!modelArr || modelArr?.length < 1) return 'No model found';

    return (
        <>
            <div className="menu-hdr">
                <FaArrowLeft
                    className="menu-hdr-icon"
                    onClick={() => updateModelInd(modelInd - 1)}
                />
                <div className="menu-hdr-label">{model?.id}</div>
                <FaArrowRight
                    className="menu-hdr-icon"
                    onClick={() => updateModelInd(modelInd + 1)}
                />
            </div>
            {model ? (
                <div
                    className={
                        'model-viewer-ctn' + (isAndroid ? ' android' : '')
                    }
                >
                    {!isAndroid ? (
                        <FaExpand
                            className="model-exp"
                            onClick={() => setActiveLink(model)}
                        />
                    ) : null}
                    <ModelCore model={model} />
                </div>
            ) : null}
        </>
    );
}

export default ModelViewer;

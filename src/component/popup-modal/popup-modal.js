import './popup-modal.scss';
import { useState } from 'react';
import Draggable from 'react-draggable';
import IfcScene from '../ifc-scene/scene';

//* Popup modal component
function PopupModal({ SD_pdfPropts }) {
    const [vidDim, setVidDim] = useState(null);
    const { state, action } = { ...SD_pdfPropts };

    /**
     * function mainly controls deselecting the activated link viewed inside a model
     * upon clicking close button
     * @param {*} link
     */
    const setActiveLink = (link) => {
        action({
            type: 'chng-active-link',
            data: link,
        });
    };

    /**
     * set dimensions of a video element based on video link metadata
     * @param {*} evt
     */
    const setVideoDimensions = (evt) => {
        const recvDim = {
            width: evt.nativeEvent.srcElement.videoWidth,
            height: evt.nativeEvent.srcElement.videoHeight,
        };
        setVidDim(recvDim);
    };

    switch (state?.links?.activeLink?.type) {
        case 'video': {
            return (
                <Draggable>
                    <div className="modal-ctn">
                        <div className="modal-action-bar">
                            <button
                                className="close-icon"
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                    setActiveLink(null);
                                }}
                                onTouchEnd={() => {
                                    setActiveLink(null);
                                }}
                            >
                                close
                            </button>
                        </div>
                        <video
                            onLoadedMetadata={(event) =>
                                setVideoDimensions(event)
                            }
                            width={vidDim?.width}
                            height={vidDim?.height}
                            controls
                            className="link-popup"
                        >
                            <source
                                src={state?.links?.activeLink?.url}
                                type="video/mp4"
                            />
                        </video>
                    </div>
                </Draggable>
            );
        }
        case 'image': {
            return (
                <Draggable>
                    <div className="modal-ctn">
                        <div className="modal-action-bar">
                            <button
                                className="close-icon"
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                    setActiveLink(null);
                                }}
                                onTouchEnd={() => {
                                    setActiveLink(null);
                                }}
                            >
                                close
                            </button>
                        </div>
                        <img
                            src={state?.links?.activeLink?.url}
                            alt="pdf link result"
                            className="link-popup"
                        />
                    </div>
                </Draggable>
            );
        }
        case 'web': {
            return (
                <Draggable>
                    <div
                        className="modal-ctn"
                        style={{ width: '50%', height: '50%' }}
                    >
                        <div className="modal-action-bar">
                            <button
                                className="close-icon"
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                    setActiveLink(null);
                                }}
                                onTouchEnd={() => {
                                    setActiveLink(null);
                                }}
                            >
                                close
                            </button>
                        </div>
                        <iframe
                            src={state?.links?.activeLink?.url}
                            title={state?.links?.activeLink?.key}
                            className="link-popup"
                        />
                    </div>
                </Draggable>
            );
        }
        case 'ifc': {
            return (
                <div className="modal-ctn">
                    <div className="modal-action-bar">
                        <button
                            className="close-icon"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                setActiveLink(null);
                            }}
                            onTouchEnd={() => {
                                setActiveLink(null);
                            }}
                        >
                            close
                        </button>
                    </div>
                    <IfcScene
                        url={state?.links?.activeLink?.url}
                        expand={true}
                    />
                </div>
            );
        }
        case 'glb': {
            return (
                <div className="modal-ctn">
                    <div className="modal-action-bar">
                        <button
                            className="close-icon"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                setActiveLink(null);
                            }}
                            onTouchEnd={() => {
                                setActiveLink(null);
                            }}
                        >
                            close
                        </button>
                    </div>
                    <model-viewer
                        style={{ width: '100%', height: '700%' }}
                        camera-controls
                        alt="GLB model viewer"
                        src={state?.links?.activeLink?.url}
                    ></model-viewer>
                </div>
            );
        }
        default:
            return null;
    }
}
export default PopupModal;

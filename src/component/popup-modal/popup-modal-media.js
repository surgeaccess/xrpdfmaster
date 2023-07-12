import './popup-modal.scss';
import { useState } from 'react';

function PopupModalMedia({ setPopup, media }) {
    const [vidDim, setVidDim] = useState(null);
    if (media.type === 'img') {
        return (
            <div className="modal-ctn annot">
                <div className="modal-action-bar">
                    <button
                        className="close-icon"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                            setPopup(false);
                        }}
                        onTouchEnd={() => {
                            setPopup(false);
                        }}
                    >
                        close
                    </button>
                </div>
                <img
                    src={media.src}
                    className="link-popup"
                    alt="enlarged custom upload"
                />
            </div>
        );
    }

    const setVideoDimensions = (evt) => {
        const recvDim = {
            width: evt.nativeEvent.srcElement.videoWidth,
            height: evt.nativeEvent.srcElement.videoHeight,
        };
        setVidDim(recvDim);
    };
    if (media.type === 'video') {
        return (
            <div className="modal-ctn annot">
                <div className="modal-action-bar">
                    <button
                        className="close-icon"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                            setPopup(false);
                        }}
                        onTouchEnd={() => {
                            setPopup(false);
                        }}
                    >
                        close
                    </button>
                </div>
                <video
                    onLoadedMetadata={(event) => setVideoDimensions(event)}
                    width={vidDim?.width}
                    height={vidDim?.height}
                    controls
                    className="link-popup"
                    alt="enlarged custom upload"
                >
                    <source src={media?.src} type="video/mp4" />
                </video>
            </div>
        );
    }

    return null;
}

export default PopupModalMedia;

import { useEffect, useState, useRef } from 'react';
import '../../App.scss';
import { usePdfContext } from '../PdfContext';
import { ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../firebase';
import {
    annotLabels,
    getNextId,
    pdfAnnotElements,
    pdfFileEle,
} from '../../services/helper-function.service';
import { FaLink } from 'react-icons/fa';

// component controls adding annotations on pdf
function AnnotAdder({
    SD_annot,
    SD_tip,
    changeAnnotStatus,
    menuSetter,
    label,
    annotEle,
}) {
    const [procMode, setProcMode] = useState(false);
    const [procAnnots, setProcAnnots] = useState([]);
    const [procStepCount, setProcStepCount] = useState(1);
    const [subStep, setSubStep] = useState(false);
    const [annotAdded, setAnnotAdded] = useState(false);
    const [content, setContent] = useState(null);
    const [position, setPosition] = useState(null);
    const [subject, setSubject] = useState('');
    const [tag, setTag] = useState('');
    const [model, setModel] = useState('');

    const [icon, setIcon] = useState('');
    const [img, setImg] = useState('');
    const [prevImage, setPrevImage] = useState('');
    const [video, setVideo] = useState('');
    const [prevVideo, setPrevVideo] = useState('');
    const pdfObj = usePdfContext();
    const loaderObj = pdfObj.loaderObj;
    const [assetNumber, setAssetNumber] = useState('');
    const [assetDescription, setAssetDescription] = useState('');
    const [assetClassification, setAssetClassification] = useState('');
    const [assetLocation, setAssetLocation] = useState('');
    const [assetDepartment, setAssetDepartment] = useState('');
    const [comment, setComment] = useState('');

    /**
     * prepares file for upload
     * @param {*} ev
     */
    const uploadMedia = (ev) => {
        ev.preventDefault();
        const media = ev.target.files[0];
        const isImg = media?.type?.includes('image');
        const isVideo = media?.type?.includes('video');
        if (isImg) {
            setImg(media);
            setPrevImage(URL.createObjectURL(media));
        }
        if (isVideo) {
            setVideo(media);
            setPrevVideo(URL.createObjectURL(media));
        }
    };

    const onCancel = () => {
        menuSetter(null);
        // close and reset tip state
        changeAnnotStatus(null);
    };

    /**
     * Add annotation to annotation object
     */
    const addProcAnnot = () => {
        let rawAnnot = {
            img: img,
            video: video,
            key: pdfObj?.state?.fullPath,
            tag: tag,
            subject: subject,
            icon: icon,
            model: model,
            assetNumber: assetNumber,
            assetDescription: assetDescription,
            assetClassification: assetClassification,
            assetLocation: assetLocation,
            assetDepartment: assetDepartment,
            comment: comment,
        };
        setProcAnnots([...procAnnots, { ...rawAnnot }]);
        setAnnotAdded(true);
    };

    /**
     * initializes an empty annotation object
     */
    const setupProcAnnot = () => {
        setAnnotAdded(false);
        setImg(null);
        setModel('');
        setVideo(null);
        setSubject('Step ' + procStepCount);
        
        setProcStepCount(procStepCount + 1);
        setSubStep(true); // used to control form state
    };

    /**
     * Once a user presses confirm to complete annotation, upload annotation to firebase
     * @param mode | mode can have values annotLabels.tribal OR annotLabels.proc
     */
    const onConfirm = async (mode) => {
        let commentObj = {};
        if (mode == annotLabels.tribal) {
            let videoPath = null;
            let imgPath = null;
            if (img) {
                loaderObj.setter(true);
                loaderObj.contSetter('uploading annotation media...');
                const storageRef = ref(storage, 'annot-img/' + img?.name);
                const snapshot = await uploadBytes(storageRef, img);
                imgPath = snapshot?.metadata?.fullPath;
            }
            if (video) {
                loaderObj.setter(true);
                loaderObj.contSetter('uploading annotation media...');
                const storageRef = ref(storage, 'annot-video/' + video?.name);
                const snapshot = await uploadBytes(storageRef, video);
                videoPath = snapshot?.metadata?.fullPath;
            }
            loaderObj.setter(false);
            loaderObj.contSetter('');
            commentObj = {
                key: pdfObj?.state?.fullPath,
                tag: tag,
                subject: subject,
                comment: comment,
                icon: icon,
                img: imgPath,
                video: videoPath,
                model: model,
                assetNumber: assetNumber,
                assetDescription: assetDescription,
                assetClassification: assetClassification,
                assetLocation: assetLocation,
                assetDepartment: assetDepartment,
            };
        } else if (mode === annotLabels.proc) {
            //! proc annots have sub-steps, this is why and how we handle it differently
            let fmtProcAnnot = [];
            for (let i = 0; i < procAnnots.length; i++) {
                const annot = procAnnots[i];
                let videoPath = null;
                let imgPath = null;
                if (annot?.img) {
                    loaderObj.setter(true);
                    loaderObj.contSetter('uploading annotation media...');
                    const storageRef = ref(
                        storage,
                        'annot-img/' + annot?.img?.name
                    );
                    const snapshot = await uploadBytes(storageRef, annot?.img);
                    imgPath = snapshot?.metadata?.fullPath;
                }
                if (annot?.video) {
                    loaderObj.setter(true);
                    loaderObj.contSetter('uploading annotation media...');
                    const storageRef = ref(
                        storage,
                        'annot-video/' + annot?.video?.name
                    );
                    const snapshot = await uploadBytes(
                        storageRef,
                        annot?.video
                    );
                    videoPath = snapshot?.metadata?.fullPath;
                }
                loaderObj.setter(false);
                loaderObj.contSetter('');
                const annotObj = {
                    key: annot?.key,
                    tag: annot?.tag,
                    subject: annot?.subject,
                    comment: annot?.comment,
                    icon: annot?.icon,
                    model: annot?.model,
                    img: imgPath,
                    video: videoPath,
                    assetNumber: annot?.assetNumber,
                    assetDescription: annot?.assetDescription,
                    assetClassification: annot?.assetClassification,
                    assetLocation: annot?.assetLocation,
                    assetDepartment: annot?.assetDepartment,
                                        
                };
                fmtProcAnnot.push(annotObj);
            }
            commentObj = [...fmtProcAnnot];
        }
        SD_annot?.action({
            type: 'add',
            label: label,
            data: { content, position, comment: commentObj },
            cache: true,
        });
        menuSetter(null);
        // once annotation added and completed close and reset tip state
        changeAnnotStatus(null);
    };

    useEffect(() => {
        if (annotLabels.proc === label) {
            // procedure mode
            const ind = pdfAnnotElements.length - 1;
            setIcon(pdfAnnotElements[ind]?.key);
            setProcMode(true);
        }
    }, []);

    useEffect(() => {
        setContent(SD_tip?.state?.props?.content);
        setPosition(SD_tip?.state?.props?.position);
    }, [SD_tip?.state]);

    return (
        <div className="add-menu-ctn">
            <div className="menu-hdr">
                <div
                    className="menu-hdr-label"
                    style={{ justifyContent: 'center' }}
                >
                    Add Object Data
                </div>
            </div>
            <div className="annot-form">
                <input
                    placeholder="Asset Number"
                    autoFocus
                    value={assetNumber}
                    type="text"
                    onChange={(event) => setAssetNumber(event.target.value)}
                />
                <input
                    placeholder="Asset Description"
                    autoFocus
                    value={assetDescription}
                    type="text"
                    onChange={(event) => setAssetDescription(event.target.value)}
                />
                <input
                    placeholder="Asset Classification"
                    autoFocus
                    value={assetClassification}
                    type="text"
                    onChange={(event) => setAssetClassification(event.target.value)}
                />
                                <input
                    placeholder="Asset Location"
                    autoFocus
                    value={assetLocation}
                    type="text"
                    onChange={(event) => setAssetLocation(event.target.value)}
                />
                                <input
                    placeholder="Asset Department"
                    autoFocus
                    value={assetDepartment}
                    type="text"
                    onChange={(event) => setAssetDepartment(event.target.value)}
                />

<textarea
                    placeholder="Asset Procedure"
                    autoFocus
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                />

                <div className="annot-model">
                    
                    <input
                        placeholder="Oracle Unifier DeepLink"
                        autoFocus
                        value={model}
                        onChange={(event) => setModel(event.target.value)}
                    />
                                        <input
                        placeholder="Asset 3D Model Link"
                        autoFocus
                        value={model}
                        onChange={(event) => setModel(event.target.value)}
                    />
                </div>
                <div className="annot-icons">
                    <div className="annot-btn">
                        {pdfAnnotElements?.map((btn) => {
                            if (
                                btn?.type === 'icon' &&
                                annotEle === btn?.type
                            ) {
                                return (
                                    <button
                                        name="annot info"
                                        key={btn?.key}
                                        className={
                                            'icon ' +
                                            (btn?.key === icon ? 'clicked' : '')
                                        }
                                        onClick={() => setIcon(btn?.key)}
                                    >
                                        {btn?.ele}
                                    </button>
                                );
                            }
                            if (
                                btn?.type === 'number' &&
                                annotEle === btn?.type
                            ) {
                                return (
                                    <button
                                        name="annot info"
                                        key={btn?.key}
                                        className={
                                            'number ' +
                                            (btn?.key === icon ? 'clicked' : '')
                                        }
                                        onClick={() => setIcon(btn?.key)}
                                    >
                                        {btn?.ele}
                                    </button>
                                );
                            }
                        })}
                    </div>
                    <div className="annot-file-picker">
                        <label key={pdfFileEle?.key}>
                            <input
                                type="file"
                                name="fnIcons"
                                style={{ display: 'none' }}
                                onChange={(event) => uploadMedia(event)}
                            />
                            {pdfFileEle?.ele}
                        </label>
                    </div>
                </div>
                {img ? (
                    <img
                        src={prevImage}
                        style={{ maxWidth: '100px', marginLeft: '0.5rem' }}
                        alt="locally uploaded"
                    />
                ) : null}
                {video ? (
                    <video
                        alt="locally uploaded"
                        width="200px"
                        height="100px"
                        controls
                        src={prevVideo}
                    />
                ) : null}
                <div>
                    <button
                        className={
                            'annot-submit-btn ' +
                            (annotAdded || !content || !position
                                ? 'disabled'
                                : '')
                        }
                        onClick={() => addProcAnnot()}
                    >
                        Add Data
                    </button>
                    <button
                        className={
                            'annot-submit-btn ' +
                            (procAnnots.length == 0 ||
                            procAnnots.length < procStepCount
                                ? 'disabled'
                                : '')
                        }
                        onClick={() => setupProcAnnot()}
                    >
                        Add Step
                    </button>
                </div>
                <div className="annot-adder-toggles">
                    {procMode ? (
                        <button
                            id="proc-submit"
                            className={
                                'annot-submit-btn ' +
                                (procAnnots.length < 1 ? 'disabled' : '')
                            }
                            type="submit"
                            onClick={() => onConfirm(annotLabels.proc)}
                        >
                            Submit
                        </button>
                    ) : (
                        <button
                            id="annot-submit"
                            className={
                                'annot-submit-btn ' +
                                (!content || !position ? 'disabled' : '')
                            }
                            type="submit"
                            onClick={() => onConfirm(annotLabels.tribal)}
                        >
                            Submit to DB
                        </button>
                    )}
                    <button
                        className="annot-submit-btn"
                        onClick={() => onCancel()}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AnnotAdder;

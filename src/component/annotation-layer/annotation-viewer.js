import { useEffect, useState } from 'react';
import { FaArrowLeft, FaArrowRight, FaAtom, FaCamera, FaClipboardList, FaDatabase, FaGlasses, FaPhone, FaUser, FaVideo, } from 'react-icons/fa';
import '../../App.scss';
import { usePdfContext } from '../PdfContext';
import { storage } from '../../firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import PopupModalMedia from '../popup-modal/popup-modal-media';
import ModelCore from '../model-viewer/ModelCore';
import { useConfig } from '../../useConfig';
import {
    pdfAnnotElements,
    annotLabels,
    getLinkType,
} from '../../services/helper-function.service';

//* Component to view annotations
function AnnotViewer({ SD_annot, SD_pdfPropts, label }) {
    const { state, action } = { ...SD_pdfPropts };
    const procMode = label == annotLabels?.proc ? true : false;
    const [annotOnPage, setAnnotOnPage] = useState(null);
    const [annotation, setAnnotation] = useState(null);
    const [annotInd, setAnnotInd] = useState(0);
    const [subAnnotation, setSubAnnotation] = useState(null);
    const [subAnnotInd, setSubAnnotInd] = useState(null);
    const pdfObj = usePdfContext();
    const isAndroid = pdfObj.isAndroid;
    const [imageUrl, setImageUrl] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [popup, setPopup] = useState(false);
    const [popupMedia, setPopupMedia] = useState(null);
    const [model, setModel] = useState({ url: '', type: '' });
    const [annotationNumber, setAnnotationNumber] = useState('');
    const [annotationClassification, setAnnotationClassification] = useState('');
    const [annotationDescription, setAnnotationDescription] = useState('');
    const [assetProcedure, setComment] = useState('');
    const config = useConfig();



    /**
     * function sets a link on page to enable coloring a selected annotation to give the impression of
     * annotation being highlighted/active
     * @param {*} annotation
     */
    const updateHash = (annotation) => {
        document.location.hash = `kID-${annotation.id}`;
        action({
            type: 'chng-active-annot',
            data: annotation,
        });
    };

    const getSelectedHighlight = (annotation) => {
        const selectedOpt = pdfAnnotElements.find(
            (ele) => ele.key === annotation?.icon
        );
        return selectedOpt?.ele;
    };

    useEffect(() => {
        const selectedAnnotId = state?.mode?.selectedAnnotId;
        let annotArr = [];
        const annotState = SD_annot?.state;
        let presetInd = 0;
        for (let i = 0; i < annotState?.length; i++) {
            if (
                procMode &&
                annotState[i]?.position?.pageNumber ===
                SD_pdfPropts?.state?.pages?.curr &&
                pdfObj?.state?.fullPath === annotState[i]?.comment[0]?.key
            ) {
                if (selectedAnnotId && selectedAnnotId == annotState[i]?.id) {
                    presetInd = i;
                }
                annotArr.push({
                    ...annotState[i],
                    assetClassification: annotState[i]?.comment[0]?.assetClassification,
                    assetDescription: annotState[i]?.comment?.assetDescription,
                    assetNumber: annotState[i]?.comment?.assetNumber,
                    assetLocation: annotState[i]?.comment?.assetLocation,
                    assetDepartment: annotState[i]?.comment?.assetDepartment,
                    assetProcedure: annotState[i]?.comment?.assetProcedure,

                });
            } else if (
                !procMode &&
                annotState[i]?.position?.pageNumber ===
                SD_pdfPropts?.state?.pages?.curr &&
                pdfObj?.state?.fullPath === annotState[i]?.comment?.key
            ) {
                if (selectedAnnotId && selectedAnnotId == annotState[i]?.id) {
                    presetInd = i;
                }
                annotArr.push({
                    ...annotState[i],
                    assetClassification: annotState[i]?.comment?.assetClassification,
                    assetNumber: annotState[i]?.comment?.assetDescription,
                    assetNumber: annotState[i]?.comment?.assetNumber,
                    assetLocation: annotState[i]?.comment?.assetLocation,
                    assetDepartment: annotState[i]?.comment?.assetDepartment,
                    assetProcedure: annotState[i]?.comment?.assetProcedure,
                });
            }
        }
        // force update annotation array
        if (annotInd === presetInd) updateAnnot(annotArr, presetInd);
        if (subAnnotInd == 0) updateSubAnnot(annotArr[presetInd], 0);

        setAnnotOnPage(annotArr);
        setAnnotInd(presetInd);
        setSubAnnotInd(0);
    }, [state?.pages?.curr, state?.mode?.selectedAnnotId]);

    /**
     * get downloadable viewable link from an image/video element in a pdf annotation
     * @param {*} fbUrl
     * @param {*} urlSetter
     */
    const downloadMediaUrl = async (fbUrl, urlSetter) => {
        const storageRef = ref(storage, fbUrl);
        const url = await getDownloadURL(storageRef);
        urlSetter(url);
    };

    /**
     * populates media and model elements of a downloaded annotation
     * @param {*} annotArr
     * @param {*} ind
     * @returns
     */
    const updateAnnot = (annotArr, ind) => {
        if (annotArr && ind >= 0 && ind < annotArr.length) {
            setAnnotation(annotArr[ind]);
            if (procMode) return;
            if (annotArr[ind]?.comment?.video)
                downloadMediaUrl(annotArr[ind]?.comment?.video, setVideoUrl);
            if (annotArr[ind]?.comment?.img)
                downloadMediaUrl(annotArr[ind]?.comment?.img, setImageUrl);
            const newModel = {
                type: getLinkType(annotArr[ind]?.comment?.model),
                url: annotArr[ind]?.comment?.model,
            };
            setModel(newModel);
            return annotArr[ind];
        }
    };


    // Add this code to the AnnotationViewer component to pull workflow link
    const openWorkflow = () => {
        // Retrieve the wfurl from the annotation data
        const wfurl = annotation?.comment?.wfurl;

        console.log("annotation:", annotation); // Add this line to log the annotation data
        console.log("wfurl:", wfurl); // Add this line to log the retrieved wfurl

        if (wfurl) {
            window.open(wfurl, '_blank');
        } else {
            alert('No workflow URL provided.');
        }
    };


    const updateAnnotInd = (newInd) => {
        if (newInd < 0 || newInd >= annotOnPage.length) {
            return;
        }
        setAnnotInd(newInd);
    };

    useEffect(() => {
        updateAnnot(annotOnPage, annotInd);
        if (procMode) {
            if (subAnnotInd === 0) updateSubAnnot(annotOnPage[annotInd], 0);
            setSubAnnotInd(0);
        }
    }, [annotInd]);

    const updateSubAnnotInd = (newInd) => {
        if (newInd < 0 || newInd >= annotation?.comment.length) {
            return;
        }
        setSubAnnotInd(newInd);
    };

    const updateSubAnnot = (annot = annotation, ind = subAnnotInd) => {
        if (annot && ind >= 0 && ind < annot?.comment.length) {
            setSubAnnotation(annot?.comment[ind]);
            const subAnnot = annot?.comment[ind];
            if (subAnnot?.video) downloadMediaUrl(subAnnot?.video, setVideoUrl);
            if (subAnnot?.img) downloadMediaUrl(subAnnot?.img, setImageUrl);
            const newModel = {
                type: getLinkType(subAnnot?.model),
                url: subAnnot?.model,
            };
            setModel(newModel);
        }
    };


    useEffect(() => {
        updateSubAnnot();
    }, [subAnnotInd]);

    return (
        <>
            <div className="menu-hdr">
                <button
                    className="menu-hdr-icon"
                    onClick={() => updateAnnotInd(annotInd - 1)}
                >
                    <FaArrowLeft />
                    {isAndroid ? 'previous' : ''}
                </button>
                <div className="menu-hdr-label">Show Asset Object Data</div>
                <button
                    className="menu-hdr-icon"
                    onClick={() => updateAnnotInd(annotInd + 1)}
                >
                    {isAndroid ? 'next' : ''}
                    <FaArrowRight />
                </button>
            </div>
            {procMode && annotation?.comment.length > 1 ? (
                <div className="menu-sub-hdr">
                    <button
                        className="menu-hdr-icon"
                        onClick={() => updateSubAnnotInd(subAnnotInd - 1)}
                    >
                        <FaArrowLeft />
                        {isAndroid ? 'previous step' : ''}
                    </button>
                    <div className="menu-hdr-label">Sub Step</div>
                    <button
                        className="menu-hdr-icon"
                        onClick={() => updateSubAnnotInd(subAnnotInd + 1)}
                    >
                        {isAndroid ? 'next step' : ''}
                        <FaArrowRight />
                    </button>
                </div>
            ) : null}
            <div className={'annot-list' + (isAndroid ? ' android' : '')}>
                {annotation?.position?.pageNumber === state?.pages?.curr ? (
                    procMode ? (
                        <>
                            <div
                                className="ele-hlt"
                                onClick={() => {
                                    updateHash(annotation);
                                }}
                            >
                                <div className="hlt-comp">
                                    Asset Number: {subAnnotation?.assetNumber}
                                </div>
                                <div className="hlt-comment">
                                    Procedure: {subAnnotation?.comment}
                                </div>  

                                <div style={{ display: "inline-block" }}>
                                <button
                                        className="workflow-btn"
                                        onClick={() => window.open(config.serviceLinks.LOTO, '_blank')}
                                    >
                                        <FaCamera size="1.5em"/>
                                    </button>
                                    <button
                                        className="workflow-btn"
                                        onClick={() => window.open(config.serviceLinks.LOTO, '_blank')}
                                    >
                                        <FaVideo size="1.5em"/>
                                    </button>
                                    <button
                                        className="workflow-btn"
                                        onClick={() => window.open(config.serviceLinks.INSP, '_blank')}
                                    >
                                        <FaGlasses size="1.5em"/>
                                    </button>
                                    <button
                                        className="workflow-btn"
                                        onClick={() => window.open(config.serviceLinks.CALL, '_blank')}
                                    >
                                        <FaPhone size="1.5em"/>
                                    </button>
                                    <button
                                        className="workflow-btn"
                                        onClick={() => window.open(config.serviceLinks.LIST, '_blank')}
                                    >
                                        <FaClipboardList size="1.5em"/>
                                    </button>
                                    <button
                                        className="workflow-btn"
                                        onClick={() => window.open(config.serviceLinks.UNIF, '_blank')}
                                    >
                                        <FaDatabase size="1.5em"/>
                                    </button>
                                    
                                </div>
                                                               
                            </div>
                            <div className="ele-hlt">
                                <div className="hlt-icon">
                                    {label === annotLabels?.tribal
                                        ? 'Category'
                                        : 'Step No.'}{' '}
                                    {subAnnotInd === 0 ? (
                                        getSelectedHighlight(subAnnotation)
                                    ) : (
                                        <div className="sub-annot-num">
                                            {subAnnotInd}
                                        </div>
                                    )}
                                </div>
                                <div
                                    className="hlt-media"
                                    onClick={() => {
                                        if (!isAndroid) {
                                            setPopup(true);
                                            setPopupMedia({
                                                type: 'img',
                                                src: imageUrl,
                                            });
                                        }
                                    }}
                                >
                                    <div className="hlt-comp">Photo Record</div>
                                    {subAnnotation?.img ? (
                                        <img
                                            src={imageUrl}
                                            alt={'custom upload'}
                                            className="hlt_col"
                                        />
                                    ) : null}
                                </div>
                                <div
                                    className="hlt-media"
                                    onClick={() => {
                                        if (!isAndroid) {
                                            setPopup(true);
                                            setPopupMedia({
                                                type: 'video',
                                                src: videoUrl,
                                            });
                                        }
                                    }}
                                >
                                    <div className="hlt-comp">Video Record</div>
                                    {subAnnotation?.video ? (
                                        videoUrl ? (
                                            <video
                                                className="hlt_col"
                                                alt="enlarged custom upload"
                                                controls
                                            >
                                                <source
                                                    src={videoUrl}
                                                    type="video/mp4"
                                                />
                                            </video>
                                        ) : (
                                            <div className="loader"></div>
                                        )
                                    ) : null}
                                </div>
                            </div>


                        </>
                    ) : (
                        <>
                            <div
                                className="ele-hlt"
                                onClick={() => {
                                    updateHash(annotation);
                                }}
                            >
                                <div className="hlt-comp">
                                    Asset Number: {annotation?.comment?.assetNumber}
                                </div>
                                <div className="hlt-comp">
                                    Asset Description: {annotation?.comment?.assetDescription}
                                </div>
                                <div className="hlt-comp">
                                    Asset Classification: {annotation?.comment?.assetClassification}
                                </div>
                                <div className="hlt-comp">
                                    Asset Location: {annotation?.comment?.assetLocation}
                                </div>
                                <div className="hlt-comp">
                                    Asset Department: {annotation?.comment?.assetDepartment}
                                </div>

                                <div style={{ display: "inline-block" }}>
                                <button
                                        className="workflow-btn"
                                        onClick={() => window.open(config.serviceLinks.LOTO, '_blank')}
                                    >
                                        <FaCamera size="1.5em"/>
                                    </button>
                                    <button
                                        className="workflow-btn"
                                        onClick={() => window.open(config.serviceLinks.LOTO, '_blank')}
                                    >
                                        <FaVideo size="1.5em"/>
                                    </button>
                                    <button
                                        className="workflow-btn"
                                        onClick={() => window.open(config.serviceLinks.INSP, '_blank')}
                                    >
                                        <FaGlasses size="1.5em"/>
                                    </button>
                                    <button
                                        className="workflow-btn"
                                        onClick={() => window.open(config.serviceLinks.CALL, '_blank')}
                                    >
                                        <FaPhone size="1.5em"/>
                                    </button>
                                    <button
                                        className="workflow-btn"
                                        onClick={() => window.open(config.serviceLinks.LIST, '_blank')}
                                    >
                                        <FaClipboardList size="1.5em"/>
                                    </button>
                                    <button
                                        className="workflow-btn"
                                        onClick={() => window.open(config.serviceLinks.UNIF, '_blank')}
                                    >
                                        <FaDatabase size="1.5em"/>
                                    </button>
                                    <div className="hlt-model">


                                    </div>
                                    
                                </div>
                                                               
                                                        </div>
                            <div className="ele-hlt">
                                <div className="hlt-icon">
                                    {label === annotLabels?.tribal
                                        ? 'Category'
                                        : 'Step No.'}{' '}
                                    {getSelectedHighlight(annotation?.comment)}
                                </div>
                                <div
                                    className="hlt-media"
                                    onClick={() => {
                                        if (
                                            !isAndroid &&
                                            annotation?.comment?.img
                                        ) {
                                            setPopup(true);
                                            setPopupMedia({
                                                type: 'img',
                                                src: imageUrl,
                                            });
                                        }
                                    }}
                                >
                                    <div className="hlt-comp">Photo Record</div>
                                    {annotation?.comment?.img ? (
                                        <img
                                            src={imageUrl}
                                            alt={'custom upload'}
                                            className="hlt_col"
                                        />
                                    ) : null}
                                </div>
                                <div
                                    className="hlt-media"
                                    onClick={() => {
                                        if (
                                            !isAndroid &&
                                            annotation?.comment?.video
                                        ) {
                                            setPopup(true);
                                            setPopupMedia({
                                                type: 'video',
                                                src: videoUrl,
                                            });
                                        }
                                    }}
                                >
                                    <div className="hlt-comp">Video Record</div>
                                    {annotation?.comment?.video ? (
                                        videoUrl ? (
                                            <video
                                                className="hlt_col"
                                                alt="enlarged custom upload"
                                                controls
                                            >
                                                <source
                                                    src={videoUrl}
                                                    type="video/mp4"
                                                />
                                            </video>
                                        ) : (
                                            <div className="loader"></div>
                                        )
                                    ) : null}
                                </div>
                            </div>
                            {model?.url ? (
                                <div style={{ width: '15rem' }}>
                                    <ModelCore model={model} />
                                </div>
                            ) : null}
                        </>
                    )
                ) : null}
            </div>
            {popup ? (
                <PopupModalMedia setPopup={setPopup} media={popupMedia} />
            ) : null}
        </>
    );
}

export default AnnotViewer;
import './App.scss';
import { FaMap, FaUser, FaFilePdf, FaPhoneAlt, FaClipboardList, FaCog, FaCogs, FaInfoCircle, FaUpload, FaFileExport, FaDatabase, FaInbox, FaPlusSquare, FaPlus, FaPlusCircle, FaBackspace, FaBackward, FaForward } from 'react-icons/fa';
import { useEffect, useState, useReducer, useRef } from 'react';
import { MdMenu, MdClose } from 'react-icons/md';
import {

    FaMinus,

} from 'react-icons/fa';
import PopupModal from './component/popup-modal/popup-modal';
import ToggleLinkList from './component/toggle-link-list/toggle-link-list';
import ThemeSelector from './component/theme-selector/theme-selector';
import ModelViewer from './component/model-viewer/ModelViewer';
// Annotation layer things
import AnnotationLayer from './component/annotation-layer/annotation-layer';
import AnnotViewer from './component/annotation-layer/annotation-viewer';
import { getNextId, getLinkType } from './services/helper-function.service';
import {
    videoFormats,
    imageFormats,
    annotLabels,
} from './services/helper-function.service';
import Filebar from './component/filebar/Filebar';
import PdfContext from './component/PdfContext';
import AnnotAdder from './component/annotation-layer/annotation-adder';
import Loader from './component/utils/Loader';
import brandingLogo from './assets/icons/prod-logo.png';

import { ref, set, child, get } from 'firebase/database';
import { database } from './firebase';
var convert = require('xml-js');

function App() {
    const [loadedPdf, setLoadedPdf] = useState(null);
    const [pdfObj, setPdfObj] = useState(null);
    const [loader, setLoader] = useState(false);
    const [loaderCont, setLoaderCont] = useState('');
    const [isAndroid, setIsAndroid] = useState(false);
    const containerRef = useRef(null);
    const sidebarRef = useRef(null);
    const [exporting, setExporting] = useState(false);
    const [allAnnotJson, setAllAnnotJson] = useState({});
    // @mark state needs to be collected at one point
    const [toolsPanelState, setToolsPanelState] = useState(true);
    const [sidepanelState, setSidepanelState] = useState(false);
    const [menuPanelState, setMenuPanelState] = useState(false);
    const [addPanelState, setAddPanelState] = useState(false);
    const [addDataState, setAddDataState] = useState(null);
    const [toggledMenuState, setToggledMenuState] = useState(null);
    const [modelArr, setModelArr] = useState([]);
    const [mode, setMode] = useState('light');
    const DEFAULT_SCALE_DELTA = 1.1;
    const MIN_SCALE = 0.25;
    const MAX_SCALE = 10.0;

    /**
     * Function parses the link name from the link object based on link type
     * @param {*} el pdf link element
     * @param {*} linkType the type of link
     * @returns
     */
    const getNameFromEl = (el, linkType) => {
        if (el?.contents?.length) {
            return el?.contents;
        }
        const urlElm = el?.url?.split('.');
        // If we have a vide or mp4 we need to extract the file name of the media
        if (linkType === 'video' || linkType === 'image') {
            const FileNameWithSlash = urlElm[urlElm?.length - 2];
            const FileNameNoSlash = FileNameWithSlash.split('/');
            return FileNameNoSlash[FileNameNoSlash.length - 1];
        }
        // if we have a website we can extract the website name
        const siteName = urlElm[0];
        const nameNoSlash = siteName.split('/');
        return nameNoSlash[nameNoSlash.length - 1];
    };

    /**
     * extracting number of links on all pages
     * @param {*} state
     * @returns
     */
    const extractLinkNumsList = async (state) => {
        let countArr = [];
        let countSum = 0;
        for (let i = 1; i <= state.core.pdfDocument?.numPages; i++) {
            const pdfPage = await state.core.pdfDocument.getPage(i);
            const annotData = await pdfPage.getAnnotations();
            for (let l = 0; l < annotData.length; l++) {
                countSum += annotData[l]?.url ? 1 : 0;
            }
            countArr.push(countSum);
        }
        return countArr;
    };

    /**
     * extract links from current page
     * @param {*} state
     * @returns
     */
    const extractLinks = async (state) => {
        const countArr = state.links.linkCountArr;
        const prevPageInd = state.pages.curr - 2;
        let linkCount = prevPageInd < 0 ? 0 : countArr[prevPageInd];
        const pdfPage = await state.core.pdfDocument?.getPage(state.pages.curr);
        const annotData = await pdfPage?.getAnnotations();
        let linkArr = [];
        let modelList = [];
        for (let i = 0; i < annotData?.length; i++) {
            const el = annotData[i];
            const linkType = getLinkType(el?.url);
            switch (getLinkType(el?.url)) {
                case 'ifc':
                    {
                        modelList.push({
                            id: el?.id,
                            url: el?.url,
                            type: 'ifc',
                        });
                    }
                    break;
                case 'usdz':
                    {
                        modelList.push({
                            id: el?.id,
                            url: el?.url,
                            type: 'usdz',
                        });
                    }
                    break;
                case 'glb':
                    {
                        modelList.push({
                            id: el?.id,
                            url: el?.url,
                            type: 'glb',
                        });
                    }
                    break;
                case 'video':
                case 'image':
                case 'web':
                    {
                        linkCount++;
                        linkArr.push({
                            index: linkCount,
                            key: el?.id,
                            url: el?.url,
                            type: linkType,
                            name: getNameFromEl(el, linkType),
                            iframe: null,
                        });
                    }
                    break;
                default:
                    break;
            }
        }
        setModelArr(modelList);
        return linkArr;
    };

    /**
     * Main state controller for pdf props
     * Controls:
     * 1. changing page
     * 2. changing zoom
     * 3. changing active annotation (on clicking)
     * 4. changing annotation mode (annotation mode/view mode)
     * 5. toggle annotation show/hide (different to annot mode)
     * 6. select annotation id (for highlighting/coloring highlight on page)
     * @param {*} state
     * @param {*} action
     * @returns
     */
    const proptsReducer = (state, action) => {
        let stateCopy = copyBaseState(state);
        let newState = {};
        switch (action.type) {
            case 'vw-chng-page':
                newState = changePage(stateCopy, action?.data?.counter);
                return { ...newState };
            case 'chng-zoom':
                newState = pageZoom(stateCopy, action?.subType);
                return { ...newState };
            case 'chng-active-link':
                stateCopy.links.activeLink = action.data;
                return { ...stateCopy };
            case 'chng-active-annot':
                stateCopy.core.activeAnnot = action.data;
                return { ...stateCopy };
            case 'chng-annot':
                stateCopy.mode.annot = action.data;
                return { ...stateCopy };
            case 'annot-toggle':
                stateCopy.mode.showAnnot = { ...action.data };
                return { ...stateCopy };
            case 'select-annot-id':
                stateCopy.mode.selectedAnnotId = action.data;
                setMenuPanelState(true);
                return { ...stateCopy };
            default:
                return { ...action.state };
        }
    };

    /**
     * change current pdf page
     * @param {*} state
     * @param {*} pageInc
     * @returns
     */
    const changePage = (state, pageInc) => {
        let newPg = state.pages.curr;
        if (newPg > 1 && pageInc === -1) {
            newPg += pageInc;
        }
        if (newPg < state.pages.total && pageInc === 1) {
            newPg = newPg + pageInc;
        }
        state.core.pdfViewer.currentPageNumber = newPg;
        state.pages.curr = newPg;
        return state;
    };


    /** add page up page down */





    /**
     * change zoom level
     * @param {*} state
     * @param {*} type
     * @returns
     */
    const pageZoom = (state, type) => {
        if (type === 'zoom-in') {
            let newScale = state.core.pdfViewer.currentScale;
            newScale = (newScale * DEFAULT_SCALE_DELTA).toFixed(2);
            newScale = Math.ceil(newScale * 10) / 10;
            newScale = Math.min(MAX_SCALE, newScale);
            state.core.pdfViewer.currentScaleValue = newScale;
            return state;
        }
        if (type === 'zoom-out') {
            let newScale = state.core.pdfViewer.currentScale;
            newScale = (newScale / DEFAULT_SCALE_DELTA).toFixed(2);
            newScale = Math.floor(newScale * 10) / 10;
            newScale = Math.max(MIN_SCALE, newScale);
            state.core.pdfViewer.currentScaleValue = newScale;
            return state;
        }
    };

    /**
     * Background: there are usually issues with deep copying structs as a reference
     * this is a relatively straight forward way to copy the pdf state
     * especially as it has a lot of nesting
     * @param {*} state
     * @returns
     */
    const copyBaseState = (state) => {
        let res = {
            mode: {
                annot: false,
                showAnnot: { status: false, type: null },
            },
            core: {
                //required for all the operations we need to change view related things
                pdfViewer: null,
                pdfDocument: null,
                activeAnnot: null,
            },
            links: {
                pageLinks: [],
                activeLink: [],
                linkCountArr: [],
            },
            pages: {
                curr: 1,
                total: 1,
            },
        };
        // core & mode
        res.mode.annot = state.mode.annot;
        res.mode.showAnnot = state.mode.showAnnot;
        res.core.pdfViewer = state.core.pdfViewer;
        res.core.pdfDocument = state.core.pdfDocument;
        res.core.activeAnnot = state.core.activeAnnot;
        // links
        res.links.pageLinks = state.links.pageLinks;
        res.links.activeLink = state.links.activeLink;
        res.links.linkCountArr = state.links.linkCountArr;
        // pages
        res.pages.curr = state.pages.curr;
        res.pages.total = state.pages.total;

        return res;
    };

    /**
     * function to format the pdf state upon loading a pdf document
     * @param {*} action
     * @returns
     */
    const proptsDispatcherMW = async (action) => {
        let mwState = copyBaseState(pdfPropts);
        let res;
        switch (action.type) {
            case 'init':
                mwState.core = { ...action.data };
                mwState.pages.total = mwState.core.pdfDocument?.numPages;
                mwState.pages.curr = 1;
                res = await extractLinkNumsList(mwState);
                mwState.links.linkCountArr = res;
                res = await extractLinks(mwState);
                mwState.links.pageLinks = res;
                return proptsDispatchr({ ...action, state: mwState });
            case 'tb-chng-page':
                // change page number
                mwState.pages.curr = action.data.page;
                res = await extractLinks(mwState);
                mwState.links.pageLinks = res;
                return proptsDispatchr({ ...action, state: mwState });
            default:
                return proptsDispatchr(action);
        }
    };

    const [pdfPropts, proptsDispatchr] = useReducer(proptsReducer, {
        mode: {
            annot: false, // controls creating annotation
            showAnnot: { status: false, type: null }, // controls displaying annotation
            selectedAnnotId: null,
        },
        core: {
            //required for all the operations we need to change view related things
            pdfViewer: null,
            pdfDocument: null,
            activeAnnot: null,
        },
        links: {
            pageLinks: [],
            activeLink: [],
            linkCountArr: [],
        },
        pages: {
            curr: 1,
            total: 1,
        },
    });

    const rhlt_pdfProvider = {
        state: pdfPropts,
        action: proptsDispatcherMW,
    };

    /**
     * Upload user's annotation data on firebase
     * @param {*} data
     * @param {*} label
     * @returns
     */
    const uploadAnnotationData = (data, label) => {
        if (!pdfObj) return;
        const encodeAnnot = JSON.stringify(data).toString('b64');
        const annotName = pdfObj?.fullPath.replace('.', '_') + `_${label}`;
        set(ref(database, annotName), {
            annot: encodeAnnot,
        });
    };

    /**
     * Operates on the annotation store (user annotation) to:
     * 1. Add new annotation data to data store and upload
     * 2. Update existing data
     * 3. Reset data
     * @param {*} state
     * @param {*} action
     * @returns res The new, post op highlights
     */
    const annotReducer = (state, action) => {
        let res;
        switch (action.type) {
            case 'add':
                res = [{ ...action.data, id: getNextId() }, ...state];
                uploadAnnotationData(res, action.label);
                break;
            case 'update':
                res = state.map((h) => {
                    const {
                        id,
                        position: originalPosition,
                        content: originalContent,
                        ...rest
                    } = h;
                    return id === action.data.id
                        ? {
                            id,
                            position: {
                                ...originalPosition,
                                ...action.data.position,
                            },
                            content: {
                                ...originalContent,
                                ...action.data.content,
                            },
                            ...rest,
                        }
                        : h;
                });
                uploadAnnotationData(res);
                break;
            case 'setData':
                res = action.data;
                break;
            default:
                break;
        }
        return res;
    };

    // annotation vars
    const [highlights, hltDispatchr] = useReducer(annotReducer, []);
    const [procedure, procDispatchr] = useReducer(annotReducer, []);

    /**
     * This allows us to customize the annotation tip (the marker that pops up when a user highlights something)
     * @param {*} state
     * @param {*} action
     * @returns
     */
    const tipReducer = (state, action) => {
        let res = { ...state };
        switch (action.type) {
            case 'init':
                res.showTip = action?.data?.showTip;
                res.props = { ...action?.data?.props };
                break;
            case 'toggle-tip':
                res.showTip = action?.data;
                break;
            case 'set-props': {
                res.props = { ...action?.data };
                break;
            }
            default:
                break;
        }
        return res;
    };

    const [tipPropts, tipDispatcher] = useReducer(tipReducer, {
        showTip: false,
        props: {
            onOpen: null,
            onConfirm: null,
            customButtons: null,
        },
    });

    /**
     * Formatting annotation data once downloaded
     * @param {*} data
     * @returns
     */
    const parseFetchedAnnotData = (data) => {
        const parsedData = JSON.parse(data?.annot);
        // filterValidAnnots
        // shallow verify if the fields are correct
        let filteredData = [];
        let i = 0;
        for (; i < parsedData.length; i++) {
            const ele = parsedData[i];
            const keys = Object.keys(ele);
            let countArr = [0, 0, 0, 0];
            for (let k = 0; k < keys.length; k++) {
                const key = keys[k];
                switch (key) {
                    case 'content':
                        countArr[0]++;
                        break;
                    case 'position':
                        countArr[1]++;
                        break;
                    case 'comment':
                        countArr[2]++;
                        break;
                    case 'id':
                        countArr[3]++;
                        break;
                    default:
                        break;
                }
            }
            let valCount = 0;
            let k = 0;
            while (countArr[k++] === 1) {
                valCount++;
            }
            if (valCount === 4) {
                filteredData.push(ele);
            }
        }
        return filteredData;
    };

    /**
     * fetch data from firebase
     * @param {*} label
     * @returns
     */
    const fetchAnnotsFromRemote = async (label) => {
        let res = [];
        const dbRef = ref(database);
        const annotName = pdfObj?.fullPath.replace('.', '_') + `_${label}`;
        const snapshot = await get(child(dbRef, annotName));
        if (snapshot.exists()) {
            res = parseFetchedAnnotData(snapshot.val());
        } else {
            console.log('No data available');
        }
        return res;
    };

    /**
     * Load highlights from remote storage
     */
    const getHighlightsFromRemote = async (dispatchr, label) => {
        const data = await fetchAnnotsFromRemote(label);
        dispatchr({
            type: 'setData',
            data: data,
            cache: false,
        });
    };

    /**
     * Ui controller to change annotation form component show/hide on screen
     * @param {*} val
     */
    const changeAddAnnotForm = (val) => {
        setAddDataState(val);
        setAddPanelState(false);
        if (val === 0 || val === 1) {
            proptsDispatchr({
                type: 'chng-annot',
                data: true,
            });
        }
        if (pdfPropts?.mode?.annot) {
            proptsDispatchr({
                type: 'chng-annot',
                data: false,
            });
            tipDispatcher({
                type: 'init',
                data: {
                    showTip: false,
                    props: null,
                },
            });
        }
    };

    /**
     * * The menu option values are mapped as follows:
     * ! 0: show Site Information
     * ! 1: show Procedure Data
     * ! 2: show data links
     * ! 3: show 3d models
     * @param {int} val the menu option selected
     * @returns
     */
    const changeMenuModal = (val) => {
        setAddPanelState(false);
        setToggledMenuState(val);
        if (val === 0) {
            proptsDispatcherMW({
                type: 'annot-toggle',
                data: { status: true, type: annotLabels.tribal },
            });
            return;
        }
        if (val === 1) {
            proptsDispatcherMW({
                type: 'annot-toggle',
                data: { status: true, type: annotLabels.proc },
            });
            return;
        }
        if (pdfPropts?.mode?.showAnnot?.status) {
            proptsDispatcherMW({
                type: 'annot-toggle',
                data: { status: false, type: null },
            });
        }
    };

    /**
     * controls opening a selected annotation type
     * @returns
     */
    const getActivatedAnnotation = () => {
        const obj = pdfPropts?.mode?.showAnnot;
        if (!obj?.status) return [];
        if (obj?.type === annotLabels.tribal) {
            return highlights;
        }
        if (obj?.type === annotLabels.proc) {
            return procedure;
        }
    };

    /**
     * get file names from the uploaded pdf files
     * @param {*} fname
     * @returns
     */
    const getFileLabel = (fname) => {
        const max = fname.length;
        const fileLabel = fname.slice(0, max - 4);
        return fileLabel;
    };

    /**
     * Export annotation file data to pc
     * @param {*} data
     */
    const downloadAnnotFile = async (data) => {
        let element = document.createElement('a');
        let bb = new Blob([data], { type: 'text/plain' });
        element.setAttribute('href', window.URL.createObjectURL(bb));
        element.setAttribute('download', 'annot-export.xml');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const convertToXML = async (jsonData) => {
        console.log(jsonData);
        const annotXml = convert.js2xml(
            { root: jsonData },
            {
                compact: true,
                spaces: 2,
            }
        );
        await downloadAnnotFile(annotXml);
    };

    const exportAnnotAsXML = async () => {
        if (allAnnotJson.length) {
            await convertToXML(allAnnotJson);
            return;
        }
        setExporting(true);
        setLoader(true);
        setLoaderCont('loading annotation data');
        const dbRef = ref(database);
        const snapshot = await get(dbRef);
        const tempState = snapshot.val();
        let parsedState = {};
        // for all files parse json
        for (const key of Object.keys(tempState)) {
            let parsedKey = key.replaceAll(' ', '_');
            const procMode = key.includes('procedure');
            parsedState[parsedKey] = { annot: [] };
            const tempAnnot = JSON.parse(tempState[key].annot);
            for (let i = 0; i < tempAnnot.length; i++) {
                const annot = tempAnnot[i];
                delete annot['content'];
                parsedState[parsedKey]?.annot?.push(annot);
            }
        }
        setAllAnnotJson(parsedState);
        setLoaderCont('converting to xml...');
        await convertToXML(parsedState);
        setLoader(false);
        setLoaderCont('');
        setExporting(false);
    };

    useEffect(() => {
        const ua = navigator.userAgent.toLowerCase();
        const isAndroid = ua.indexOf('android') > -1;
        // checks if mobile site needs to be shown
        if (isAndroid) {
            // Redirect to Android-site?
            setIsAndroid(true);
        }
        // TODO(talha): Remove this afterwards
        // ! Debug only
        // setIsAndroid(true);
    }, []);

    useEffect(() => {
        getHighlightsFromRemote(hltDispatchr, annotLabels.tribal);
        getHighlightsFromRemote(procDispatchr, annotLabels.proc);
    }, [loadedPdf]);

    return (
        <div className="pdf-ctn">
            <div id="hdr" className={'header' + (isAndroid ? ' android' : '')}>
                <div className="hdr-top">
                    <img
                        className="branding-img"
                        src={brandingLogo}
                        alt="branding logo"
                    />
                    {!isAndroid ? (
                        <button
                            onClick={() => {
                                if (!exporting) {
                                    exportAnnotAsXML();
                                }
                            }}
                        >
                        </button>
                    ) : null}
                </div><div className="rot-90"></div>
                <div className="hdr-bot">
                    <PdfContext.Provider
                        value={{
                            state: pdfObj,
                            setter: setPdfObj,
                            loaderObj: {
                                setter: setLoader,
                                contSetter: setLoaderCont,
                            },
                            isAndroid: isAndroid,
                        }}
                    >
                        <Filebar
                            loadedPdf={loadedPdf}
                            setLoadedPdf={setLoadedPdf}
                            stateObj={{
                                state: sidepanelState,
                                setter: setSidepanelState,
                            }}
                        />
                    </PdfContext.Provider>
                </div>
            </div>

            <img
                src={brandingLogo}
                alt="branding logo"
                className="branding-logo"
            />
            {loadedPdf ? (
                <>
                    <div className="center-col">
                        <div className="ctn-style" ref={containerRef}>
                            <PdfContext.Provider value={rhlt_pdfProvider}>
                                <AnnotationLayer
                                    loadedPdf={loadedPdf}
                                    annotState={getActivatedAnnotation()}
                                    SD_pdfPropts={{
                                        state: pdfPropts,
                                        action: proptsDispatcherMW,
                                    }}
                                    SD_tip={{
                                        state: tipPropts,
                                        action: tipDispatcher,
                                    }}
                                />
                            </PdfContext.Provider>
                        </div>
                    </div>
                    {pdfObj ? (
                        <div className="filename-ctn">
                            <div className="filename-bar">
                                {getFileLabel(pdfObj.name)}
                            </div>
                        </div>
                    ) : null}
                    {toolsPanelState ? (
                        <div
                            className={
                                'tools-panel' + (isAndroid ? ' android' : '')
                            }
                        >
                            <ul>
                                <li>
                                    <button onClick={() => proptsDispatcherMW({ type: 'chng-zoom', subType: 'zoom-out' })}>
                                    <FaMinus />
                                    </button>

                                </li>
                                <li>
                                    <button className="toolbar-btn" onClick={() => proptsDispatcherMW({ type: 'chng-zoom', subType: 'zoom-in' })}>
                                    <FaPlus />
                                    </button>

                                </li>

                                <li>
                                    <ThemeSelector
                                        mode={mode}
                                        setMode={setMode}
                                        containerRef={containerRef}
                                        sidebarRef={sidebarRef}
                                    />
                                    <span className="tooltip">
                                        {mode === 'dark' ? 'light' : 'dark'}{' '}
                                        mode
                                    </span>
                                </li>
                                <li>
                                    <button className="toolbar-btn" onClick={() => proptsDispatcherMW({ type: 'vw-chng-page', data: { counter: -1 } })}>
                                    <FaBackward />
                                    </button>

                                </li>
                                <li className="tool-pages">
                                    {pdfPropts?.pages.curr} of{' '}
                                    {pdfPropts?.pages.total}
                                </li>
                                <li>
                                    <button className="toolbar-btn" onClick={() => proptsDispatcherMW({ type: 'vw-chng-page', data: { counter: 1 } })}>
                                    <FaForward />
                                    </button>

                                </li>
                            </ul>
                        </div>
                    ) : null}
                    <div
                        className="tools-panel-toggle"
                        onClick={() => setToolsPanelState(!toolsPanelState)}
                    >
<button
    className="rotate-button"
    style={{ transform: toolsPanelState ? 'rotate(-90deg)' : 'rotate(0deg)' }}
>
    <FaCog/>
</button>
                    </div>

                    <div className="menu-bar-right">

                        <button onClick={() => window.open("http://pro-visionxr-maximo.netlify.app", "_blank")} ><FaDatabase /></button>

                        <ul className="menu-bar-section">
                            {!isAndroid ? (
                                <li>


                                    <button className="menu-section" onClick={() => {
                                        setMenuPanelState(false);
                                        changeAddAnnotForm(false);
                                        setAddPanelState(!addPanelState);
                                    }}>
                                        <FaPlusCircle />
                                    </button>
                                </li>
                            ) : null}
                            <li>
                                <button className="menu-section" onClick={() => {
                                    setAddPanelState(false);
                                    changeAddAnnotForm(null);
                                    setMenuPanelState(!menuPanelState);
                                }}>
                                    <FaInfoCircle />   
                                </button>

                            </li>
                        </ul>


                    </div>
                    {addPanelState ? (
                        <div className="add-options-ctn">
                            <ul className="add-options">
                                <li>
                                    <button
                                        onClick={() => changeAddAnnotForm(0)}
                                    >
                                        Asset Information
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => changeAddAnnotForm(1)}
                                    >
                                        Asset Procedures
                                    </button>
                                </li>
                            </ul>
                        </div>
                    ) : null}
                    <PdfContext.Provider
                        value={{
                            state: pdfObj,
                            setter: setPdfObj,
                            loaderObj: {
                                setter: setLoader,
                                contSetter: setLoaderCont,
                            },
                        }}
                    >
                        {addDataState === 0 ? (
                            <AnnotAdder
                                SD_annot={{
                                    state: highlights,
                                    action: hltDispatchr,
                                }}
                                SD_tip={{
                                    state: tipPropts,
                                    action: tipDispatcher,
                                }}
                                changeAnnotStatus={changeAddAnnotForm}
                                menuSetter={setAddDataState}
                                label={annotLabels.tribal}
                                annotEle="icon"
                            />
                        ) : null}
                        {addDataState === 1 ? (
                            <AnnotAdder
                                SD_annot={{
                                    state: procedure,
                                    action: procDispatchr,
                                }}
                                SD_tip={{
                                    state: tipPropts,
                                    action: tipDispatcher,
                                }}
                                changeAnnotStatus={changeAddAnnotForm}
                                menuSetter={setAddDataState}
                                label={annotLabels.proc}
                                annotEle="number"
                            />
                        ) : null}
                    </PdfContext.Provider>
                    {menuPanelState ? (
                        isAndroid ? (
                            <div className="layout-ctn">
                                <button
                                    className="close-btn"
                                    onClick={() => {
                                        setMenuPanelState(false);
                                        changeMenuModal(null);
                                    }}
                                >
                                    close
                                </button>
                                {toggledMenuState != null ? (
                                    <button
                                        className="back-btn"
                                        onClick={() => {
                                            changeMenuModal(null);
                                        }}
                                    >
                                        back
                                    </button>
                                ) : null}
                                <button
                                    className="min-btn"
                                    onClick={() => setMenuPanelState(false)}
                                >
                                    minimize
                                </button>
                                <ul className={'view-panel-ctn android'}>
                                    <PdfContext.Provider
                                        value={{
                                            state: pdfObj,
                                            setter: setPdfObj,
                                            loaderObj: {
                                                setter: setLoader,
                                                contSetter: setLoaderCont,
                                            },
                                            isAndroid: isAndroid,
                                        }}
                                    >
                                        {toggledMenuState == null ||
                                            toggledMenuState === 0 ? (
                                            <li>
                                                <div className="menu-section">
                                                    {toggledMenuState == null ? (
                                                        <>
                                                            <MdMenu
                                                                className="section-hdr-icon"
                                                                onClick={() => changeMenuModal(0)}
                                                            />
                                                            <button className="section-hdr-label" onClick={() => changeMenuModal(0)}>
                                                                Asset Information
                                                            </button>
                                                        </>
                                                    ) : null}
                                                </div>
                                                {toggledMenuState === 0 ? (
                                                    <AnnotViewer
                                                        SD_annot={{
                                                            state: highlights,
                                                            action: hltDispatchr,
                                                        }}
                                                        SD_pdfPropts={{
                                                            state: pdfPropts,
                                                            action: proptsDispatcherMW,
                                                        }}
                                                        label={
                                                            annotLabels.tribal
                                                        }
                                                    />
                                                ) : null}
                                            </li>
                                        ) : null}
                                        {toggledMenuState == null ||
                                            toggledMenuState === 1 ? (
                                            <li>
                                                <div className="menu-section">
                                                    {toggledMenuState == null ? (
                                                        <>
                                                            <MdMenu
                                                                className="section-hdr-icon"
                                                                onClick={() => changeMenuModal(1)}
                                                            />
                                                            <button className="section-hdr-label" onClick={() => changeMenuModal(1)}>
                                                                Asset Procedures
                                                            </button>
                                                        </>
                                                    ) : null}
                                                </div>
                                                {toggledMenuState === 1 ? (
                                                    <AnnotViewer
                                                        SD_annot={{
                                                            state: procedure,
                                                            action: procDispatchr,
                                                        }}
                                                        SD_pdfPropts={{
                                                            state: pdfPropts,
                                                            action: proptsDispatcherMW,
                                                        }}
                                                        label={annotLabels.proc}
                                                    />
                                                ) : null}
                                            </li>
                                        ) : null}
                                    </PdfContext.Provider>
                                    {toggledMenuState == null ||
                                        toggledMenuState === 2 ? (
                                        <li>
                                            <div className="menu-section">
                                                {toggledMenuState == null ? (
                                                    <>
                                                        <MdMenu
                                                            className="section-hdr-icon"
                                                            onClick={() => changeMenuModal(2)}
                                                        />
                                                        <button className="section-hdr-label" onClick={() => changeMenuModal(2)}>
                                                            OEM Information
                                                        </button>
                                                    </>
                                                ) : null}
                                            </div>
                                            {toggledMenuState === 2 ? (
                                                <ToggleLinkList
                                                    SD_pdfPropts={{
                                                        state: pdfPropts,
                                                        action: proptsDispatcherMW,
                                                    }}
                                                />
                                            ) : null}
                                        </li>
                                    ) : null}
                                    {toggledMenuState == null ||
                                        toggledMenuState === 3 ? (
                                        <li>
                                            <PdfContext.Provider
                                                value={modelArr}
                                            >
                                                <div className="menu-section">
                                                    {toggledMenuState == null ? (
                                                        <>
                                                            <MdMenu
                                                                className="section-hdr-icon"
                                                                onClick={() => changeMenuModal(3)}
                                                            />
                                                            <button className="section-hdr-label" onClick={() => changeMenuModal(3)}>
                                                                OEM 3D Assets
                                                            </button>
                                                        </>
                                                    ) : null}
                                                </div>
                                                {toggledMenuState === 3 ? (
                                                    <ModelViewer
                                                        SD_pdfPropts={{
                                                            state: pdfPropts,
                                                            action: proptsDispatcherMW,
                                                        }}
                                                        modelArr={modelArr}
                                                        isAndroid={isAndroid}
                                                    />
                                                ) : null}
                                            </PdfContext.Provider>
                                        </li>
                                    ) : null}
                                </ul>
                            </div>
                        ) : (
                            <ul className={'view-panel-ctn'}>
                                <PdfContext.Provider
                                    value={{
                                        state: pdfObj,
                                        setter: setPdfObj,
                                        loaderObj: {
                                            setter: setLoader,
                                            contSetter: setLoaderCont,
                                        },
                                        isAndroid: isAndroid,
                                    }}
                                >
                                    <li>
                                        <div className="menu-section">
                                            {toggledMenuState === 0 ? (
                                                <MdClose
                                                    className="section-hdr-icon"
                                                    onClick={() =>
                                                        changeMenuModal(null)
                                                    }
                                                />
                                            ) : (
                                                <MdMenu
                                                    className="section-hdr-icon"
                                                    onClick={() =>
                                                        changeMenuModal(0)
                                                    }
                                                />
                                            )}
                                            <div className="section-hdr-label">
                                                OEM Asset Information
                                            </div>
                                            <FaMinus
                                                className="minimise-icon"
                                                onClick={() =>
                                                    setMenuPanelState(false)
                                                }
                                            />
                                        </div>
                                        {toggledMenuState === 0 ? (
                                            <AnnotViewer
                                                SD_annot={{
                                                    state: highlights,
                                                    action: hltDispatchr,
                                                }}
                                                SD_pdfPropts={{
                                                    state: pdfPropts,
                                                    action: proptsDispatcherMW,
                                                }}
                                                label={annotLabels.tribal}
                                            />
                                        ) : null}
                                    </li>
                                    <li>
                                        <div className="menu-section">
                                            {toggledMenuState === 1 ? (
                                                <MdClose
                                                    className="section-hdr-icon"
                                                    onClick={() =>
                                                        changeMenuModal(null)
                                                    }
                                                />
                                            ) : (
                                                <MdMenu
                                                    className="section-hdr-icon"
                                                    onClick={() =>
                                                        changeMenuModal(1)
                                                    }
                                                />
                                            )}
                                            <div className="section-hdr-label">
                                                OEM Asset Procedures
                                            </div>
                                        </div>
                                        {toggledMenuState === 1 ? (
                                            <AnnotViewer
                                                SD_annot={{
                                                    state: procedure,
                                                    action: procDispatchr,
                                                }}
                                                SD_pdfPropts={{
                                                    state: pdfPropts,
                                                    action: proptsDispatcherMW,
                                                }}
                                                label={annotLabels.proc}
                                            />
                                        ) : null}
                                    </li>
                                </PdfContext.Provider>
                                <li>
                                    <div className="menu-section">
                                        {toggledMenuState === 2 ? (
                                            <MdClose
                                                className="section-hdr-icon"
                                                onClick={() =>
                                                    changeMenuModal(null)
                                                }
                                            />
                                        ) : (
                                            <MdMenu
                                                className="section-hdr-icon"
                                                onClick={() =>
                                                    changeMenuModal(2)
                                                }
                                            />
                                        )}
                                        <div className="section-hdr-label">
                                            OEM Asset Support
                                        </div>
                                    </div>
                                    {toggledMenuState === 2 ? (
                                        <ToggleLinkList
                                            SD_pdfPropts={{
                                                state: pdfPropts,
                                                action: proptsDispatcherMW,
                                            }}
                                        />
                                    ) : null}
                                </li>
                                <li>
                                    <PdfContext.Provider value={modelArr}>
                                        <div className="menu-section">
                                            {toggledMenuState === 3 ? (
                                                <MdClose
                                                    className="section-hdr-icon"
                                                    onClick={() =>
                                                        changeMenuModal(null)
                                                    }
                                                />
                                            ) : (
                                                <MdMenu
                                                    className="section-hdr-icon"
                                                    onClick={() =>
                                                        changeMenuModal(3)
                                                    }
                                                />
                                            )}
                                            <div className="section-hdr-label">
                                                OEM 3D Asset Model
                                            </div>
                                        </div>
                                        {toggledMenuState === 3 ? (
                                            <ModelViewer
                                                SD_pdfPropts={{
                                                    state: pdfPropts,
                                                    action: proptsDispatcherMW,
                                                }}
                                                modelArr={modelArr}
                                            />
                                        ) : null}
                                    </PdfContext.Provider>
                                </li>
                            </ul>
                        )
                    ) : null}
                </>
            ) : null}
            <Loader state={loader} content={loaderCont} />
            <PopupModal
                SD_pdfPropts={{
                    state: pdfPropts,
                    action: proptsDispatcherMW,
                }}
            />
        </div>
    );
}

export default App;

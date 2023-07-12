import {
    FaDatabase,
    FaCrosshairs,
    FaCamera,
    FaCrosshairsSimple,
    FaClipboardCheck,
} from 'react-icons/fa';
const annotLabels = { tribal: 'tribal', proc: 'procedure' };
const getNextId = () => String(Math.random()).slice(2);
/**
 * extract the link type from url
 * Can be 3 types:
 * web, video, image
 * @param {string} url The link Url
 */
const getLinkType = (url) => {
    if (!url) return null;
    const urlElm = url?.split('.');
    const linkEnd = urlElm[urlElm?.length - 1];
    if (linkEnd.includes('ifc')) {
        return 'ifc';
    }
    if (linkEnd.includes('usdz')) {
        return 'usdz';
    }
    if (linkEnd.includes('glb')) {
        return 'glb';
    }
    const isVideo = videoFormats.find((format) => format === linkEnd);
    if (isVideo) return 'video';
    const isImage = imageFormats.find((format) => format === linkEnd);
    if (isImage) return 'image';
    return 'web';
};

const videoFormats = [
    'm4v',
    'mpg',
    'mp2',
    'mpeg',
    'mpe',
    'mpv',
    'mp4',
    'm4p',
    'm4v',
    'amv',
    'gif',
    'gifv',
    'ogg',
    'ogv',
    'flv',
    'mkv',
    'webm',
];

const imageFormats = [
    'png',
    'txt',
    'ansi',
    'text',
    'jpg',
    'jpe',
    'jpeg',
    'img',
    'svg',
    'svgz',
];
const pdfAnnotElements = [
    {
        key: 'i1',
        type: 'icon',
        ele: (
            <FaCrosshairs
                className="custom-annot-btn fade fa-sharp fa-light"
                style={{ color: '#f94c4c' }}
            />
        ),
    },
    {
        key: 'i2',
        type: 'icon',
        ele: (
            <FaCrosshairs
                className="custom-annot-btn fade fa-sharp fa-light"
                style={{ color: '#f0b000' }}
            />
        ),
    },
    {
        key: 'i3',
        type: 'icon',
        ele: (
            <FaCrosshairs
                className="custom-annot-btn fade fa-sharp fa-light"
                style={{ color: '#4cdd0e' }}
            />
        ),
    },
    {
        key: 'proc-label',
        type: 'number',
        ele: (
            <FaCrosshairs
                className="custom-annot-btn fade fa-sharp fa-light"
                style={{ color: '#f94c4c' }}
            />
        ),
    },
];

const pdfFileEle = {
    key: 'f1',
    type: 'file',
    ele: <FaCamera className="custom-upload-btn" />,
};

export {
    getNextId,
    videoFormats,
    imageFormats,
    pdfAnnotElements,
    pdfFileEle,
    annotLabels,
    getLinkType,
};

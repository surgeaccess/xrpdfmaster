import { FaFilePdf } from 'react-icons/fa';
import { useState } from 'react';
import { getDownloadURL } from 'firebase/storage';
import { usePdfContext } from '../PdfContext';

function FileSelector({ fileList, setLoadedPdf, closeWind }) {
    const [currentPdf, setCurrentPdf] = useState(null);
    const pdfObj = usePdfContext();
    const loaderObj = pdfObj.loaderObj;
    const isAndroid = pdfObj.isAndroid;

    const downloadFile = async (file) => {
        if (currentPdf === file) return;
        setCurrentPdf(file);
        loaderObj.setter(true);
        loaderObj.contSetter('loading pdf file...');
        pdfObj.setter(file);
        getDownloadURL(file).then((url) => {
            setLoadedPdf(url);
        });
        document.addEventListener('pagesinit', () => {
            loaderObj.setter(false);
            loaderObj.contSetter('');
        });
    };

    return (
        <>
            <div className={'selector-ctn' + (isAndroid ? ' android' : '')}>
                <div className="file-viewer">
                    <div className="close-btn">
                        <button className="btn" onClick={() => closeWind(null)}>
                            Close
                        </button>
                    </div>
                    {fileList.map((file) => {
                        return (
                            <div
                                key={file?.fullPath}
                                className="file-obj"
                                onClick={() => downloadFile(file)}
                            >
                                <FaFilePdf className="file-icon" />
                                <div className="file-name">
                                    {file?.name?.length > 15
                                        ? file?.name.substring(0, 15) + '...'
                                        : file?.name}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

export default FileSelector;

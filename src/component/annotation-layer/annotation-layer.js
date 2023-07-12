import {
    Highlight,
    Popup,
    AreaHighlight,
    PdfHighlighter,
    PdfLoader,
} from '../../custom-libs/react-pdf-highlighter/src/index';
import AnnotContext from '../AnnotContext';
import { useState, useEffect, useRef } from 'react';
import './annotation-layer.scss';
const resetHash = () => {
    document.location.hash = '';
};

//* The entry component for react-pdf-highlighter. Using slightly modified started code
//* from react-pdf-highlighter
function AnnotationLayer({ loadedPdf, annotState, SD_pdfPropts, SD_tip }) {
    const [hash, setHash] = useState(null);
    const scrollViewerTo = useRef;

    const HighlightPopup = (highlight) => {
        const { comment } = highlight;
        return comment && comment.assetNumber ? (
            <div className="Highlight__popup">{comment.assetNumber}</div>
        ) : null;
    };
    

    const parseIdFromHash = () => document.location.hash.slice(`#kID-`.length);

    const scrollToHighlightFromHash = () => {
        const newHash = parseIdFromHash();
        let highlight = null;
        if (newHash !== hash) {
            setHash(newHash);
            highlight = getHighlightById(newHash);
        }
        if (highlight) {
            scrollViewerTo.current(highlight);
            SD_pdfPropts.action({
                type: 'chng-active-annot',
                data: highlight,
            });
        }
    };
    const getHighlightById = (id) => {
        return annotState?.find((highlight) => highlight.id === id);
    };
    useEffect(() => {
        window.addEventListener('hashchange', scrollToHighlightFromHash, false);
        return () =>
            window.removeEventListener('hashchange', scrollToHighlightFromHash);
    }, [annotState]);

    return (
        <PdfLoader url={loadedPdf}>
            {(pdfDoc) => (
                <PdfHighlighter
                    pdfDocument={pdfDoc}
                    enableAreaSelection={() => SD_pdfPropts?.state?.mode?.annot}
                    onScrollChange={resetHash}
                    scrollRef={(scrollTo) => {
                        scrollViewerTo.current = scrollTo;
                        scrollToHighlightFromHash();
                    }}
                    onSelectionFinished={(
                        position,
                        content,
                        hideTipAndSelection,
                        transformSelection
                    ) =>
                        SD_tip?.action({
                            type: 'init',
                            data: {
                                showTip: true,
                                props: {
                                    position: position,
                                    content: content,
                                    hideTipAndSelection: hideTipAndSelection,
                                    transformSelection: transformSelection,
                                },
                            },
                        })
                    }
                    highlightTransform={(
                        highlight,
                        index,
                        setTip,
                        hideTip,
                        viewportToScaled,
                        screenshot,
                        isScrolledTo
                    ) => {
                        const isTextHighlight = !Boolean(
                            highlight.content && highlight.content.image
                        );
                        const component = isTextHighlight ? (
                            <Highlight
                                isScrolledTo={isScrolledTo}
                                position={highlight.position}
                                comment={highlight.comment}
                            />
                        ) : (
                            <AnnotContext.Provider value={SD_pdfPropts}>
                                <AreaHighlight
                                    isScrolledTo={isScrolledTo}
                                    highlight={highlight}
                                    onChange={() => {}}
                                />
                            </AnnotContext.Provider>
                        );

                        return (
                            <Popup
                                popupContent={<HighlightPopup {...highlight} />}
                                onMouseOver={(popupContent) => {
                                    setTip(
                                        highlight,
                                        (highlight) => popupContent
                                    );
                                }}
                                onMouseOut={hideTip}
                                key={index}
                                children={component}
                            />
                        );
                    }}
                    highlights={annotState}
                />
            )}
        </PdfLoader>
    );
}

export default AnnotationLayer;

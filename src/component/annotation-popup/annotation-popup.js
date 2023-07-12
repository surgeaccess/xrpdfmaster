import './annotation-popup.scss';
import '../../App.scss';
import { useEffect, useState } from 'react';
import Draggable from 'react-draggable';

function AnnotationPopup({ SD_pdfPropts }) {
    const { state, action } = { ...SD_pdfPropts };
    const [toggle, setToggle] = useState(false);

    const closeModal = () => {
        action({
            type: 'chng-active-annot',
            data: null,
        });
    };

    useEffect(() => {
        setToggle(state?.core?.activeAnnot);
    }, [state?.core?.activeAnnot]);

    if (toggle) {
        return (
            <Draggable>
                <div className="modal-ctn">
                    <div className="modal-action-bar">
                        <button
                            className="close-icon"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                closeModal();
                            }}
                        >
                            close
                        </button>
                        <button
                            className="close-icon"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                closeModal();
                            }}
                        >
                            Enlarge
                        </button>                        
                    </div>
                    <div className="content-section">
                        <div className="panel">
                            {state?.core?.activeAnnot?.comment?.img ? (
                                <img
                                    src={state?.core?.activeAnnot?.comment?.img}
                                    alt={'custom media upload'}
                                    className="hlt-upload"
                                />
                            ) : null}
                        </div>
                        <div className="panel">
                            <strong>
                                {state?.core?.activeAnnot?.comment?.tag}
                            </strong>
                            <br />
                            <strong>
                                {state?.core?.activeAnnot?.comment?.text}
                            </strong>
                            <div className="hlt_col">
                                {state?.core?.activeAnnot?.content?.text ? (
                                    <blockquote style={{ marginTop: '0.5rem' }}>
                                        {`${state?.core?.activeAnnot?.content?.text
                                            ?.slice(0, 90)
                                            .trim()}…`}
                                    </blockquote>
                                ) : null}
                                {state?.core?.activeAnnot?.content?.image ? (
                                    <div
                                        className="highlight__image"
                                        style={{ marginTop: '0.5rem' }}
                                    >
                                        <img
                                            src={
                                                state?.core?.activeAnnot
                                                    ?.content?.image
                                            }
                                            alt={'Screenshot or V'}
                                        />
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </Draggable>
        );
    }
    return null;
}
export default AnnotationPopup;

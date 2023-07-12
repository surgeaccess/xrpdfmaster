import '../../App.scss';
import { MdLanguage, MdImage, MdVideoLibrary } from 'react-icons/md';

//* Component controls the type of images pdf shows in an iframe
function ToggleLinkList({ SD_pdfPropts }) {
    const { state, action } = SD_pdfPropts;
    const toggleModal = (link) => {
        const activeLink =
            state.links.activeLink?.id !== link?.key ? link : null;
        action({
            init: false,
            type: 'chng-active-link',
            data: activeLink,
        });
    };

    const getIconFromType = (type) => {
        if (type === 'image') {
            return <MdImage />;
        }
        if (type === 'video') {
            return <MdVideoLibrary />;
        }
        if (type === 'web') {
            return <MdLanguage />;
        }
    };

    if (state?.links?.pageLinks?.length == 0) return 'no links found';

    return (
        <>
            <div className="menu-ele-body">
                {state?.links?.pageLinks?.map((link) => {
                    return (
                        <button
                            key={link?.id}
                            className={
                                'link-ctn ' +
                                (link.key === state?.links?.activeLink?.id
                                    ? 'link-selected'
                                    : '')
                            }
                            onClick={() => toggleModal(link)}
                        >
                            <div className="link-num">{link.index}</div>
                            <div className="link-txt">{link.name}</div>
                            <div className="link-icon">
                                {getIconFromType(link.type)}
                            </div>
                        </button>
                    );
                })}
            </div>
        </>
    );
}

export default ToggleLinkList;

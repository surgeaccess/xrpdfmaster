import { MdToggleOff, MdToggleOn } from 'react-icons/md';
import '../../App.scss';

function ThemeSelector({ mode, setMode, containerRef, sidebarRef }) {
    /**
     * switch between dark and light mode
     */
    const changeMode = () => {
        if (mode === 'nightvision') {
            setMode('light');
            containerRef.current.style.filter =
                'invert(0%) contrast(100%) brightness(100%) hue-rotate(0deg)';
            if (sidebarRef?.current)
                sidebarRef.current.style.filter =
                    'invert(0%) contrast(100%) brightness(100%) hue-rotate(0deg)';
        } else {
            setMode('nightvision');
            containerRef.current.style.filter =
                'invert(100%) hue-rotate(120deg) contrast(90%)';
            if (sidebarRef?.current)
                sidebarRef.current.style.filter =
                    'invert(100%) hue-rotate(120deg) contrast(90%)';
        }
    };
    return (
        <>
            {mode === 'nightvision' ? (
                <MdToggleOff
                    className="toolbar-icon wide"
                    onClick={() => changeMode()}
                />
            ) : (
                <MdToggleOn
                    className="toolbar-icon wide"
                    onClick={() => changeMode()}
                />
            )}
        </>
        
    );
}

export default ThemeSelector;

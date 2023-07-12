import { useState } from 'react';
import { FaMap, FaUser, FaFilePdf, FaPhoneAlt, FaClipboardList, FaBarcode, FaFileArchive, FaRegFile, FaFile, FaPhone, FaCloud } from 'react-icons/fa';
import '../../App.scss';
import { ref, listAll } from 'firebase/storage';
import { storage } from '../../firebase';
import FileSelector from './FileSelector';
import { useConfig } from '../../useConfig';

function Filebar({ loadedPdf, setLoadedPdf }) {
    const storageRef = ref(storage);
    const [menuOpt, setMenuOpt] = useState(null);
    const [fileList, setFileList] = useState([]);
    const config = useConfig();

    const closeWind = () => {
        setMenuOpt(null);
    };

    const listFiles = async (val) => {
        if (val === menuOpt) {
            setMenuOpt(null);
            return;
        }
        const res = await listAll(storageRef);
        setFileList(res.items);
        setMenuOpt(val);
    };

    const openIframe = (val) => {
        if (val === menuOpt) {
            setMenuOpt(null);
            return;
        }
        setMenuOpt(val);
    };

    function openOneDrive() {
        window.open('https://onedrive.live.com/about/en-gb/signin/', '_blank');
    };

    function handleLoadPdf() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf';
        input.onchange = (event) => {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                setLoadedPdf(event.target.result);
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }



    return (
        <>
            <>

                <ul>

                    <li>
                        <button className="menu-section" onClick={() => listFiles(2)}>
                            <FaFilePdf />
                        </button>
                    </li>
                    <li>
                        <button onClick={handleLoadPdf}>
                            <FaBarcode />
                        </button>
                    </li>
                    <li>
                        <button className="menu-section" onClick={() => window.open(config.serviceLinks.NALIB, '_blank')}>
                            <FaRegFile />
                        </button>
                    </li>
                    <li>
                        <button className="menu-section" onClick={() => window.open(config.serviceLinks.ONED, '_blank')}>
                            <FaCloud />
                        </button>
                    </li>
                    <li>
                        <button className="menu-section" onClick={() => window.open(config.serviceLinks.CALL, '_blank')}>
                        <FaPhone />   
                        </button>
                    </li>
                    <li>
                    <button className="menu-section">
                        <FaUser />   
                        </button>
                    </li>
                </ul>
            </>
            {menuOpt === 2 ? (
                <FileSelector
                    fileList={fileList}
                    setLoadedPdf={setLoadedPdf}
                    closeWind={closeWind}
                />
            ) : null}
        </>
    );
}
export default Filebar;

//* loader ui object
function Loader({ state, content }) {
    return (
        <>
            {state ? (
                <div className="loader-ctn">
                    <div className="loader"></div>
                    {content}
                </div>
            ) : null}
        </>
    );
}

export default Loader;

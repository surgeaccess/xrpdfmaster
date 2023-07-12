import React from 'react';

const AnnotContext = React.createContext(null);

export function useAnnotContext() {
    return React.useContext(AnnotContext);
}

export default AnnotContext;

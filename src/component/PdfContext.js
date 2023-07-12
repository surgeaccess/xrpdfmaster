import React from 'react';

const PdfContext = React.createContext();

export function usePdfContext() {
  return React.useContext(PdfContext);
}

export default PdfContext;

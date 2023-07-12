import React from 'react';

function Modal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <table>
          <thead>
            <tr>
              <th>Column 1</th>
              <th>Column 2</th>
              <th>Column 3</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1A</td>
              <td>1B</td>
              <td>1C</td>
            </tr>
            <tr>
              <td>2A</td>
              <td>2B</td>
              <td>2C</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Modal;

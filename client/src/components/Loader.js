import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import '../../src/pages/Teacher_Form/teacher_form.css'

const Loader = ({ show }) => {
  return (
    <Modal show={true} centered>
      <Modal.Body className="text-center">
        <Spinner animation="border" variant="warning" style={{width: 150, height: 150,}} />
        <p className="mt-3 thai-font" style={{fontSize: 30, fontWeight: 'bold'}}>กำลังโหลด...</p>
      </Modal.Body>
    </Modal>
  );
};

export default Loader;

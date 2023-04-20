import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
import {  Button, Table, Navbar, Container } from "react-bootstrap";
import "./student_dashboard.css";
import Swal from "sweetalert2";
import Modal from "react-modal";


const customModalStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    maxWidth: "90%",
    maxHeight: "90%",
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    zIndex: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
};

const Student_Dashboard = ({ s_id }) => {
  const [studentForm, setStudentForm] = useState([]);
  const [activityPictures, setActivityPictures] = useState([]);

  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const ciphertext = decodeURIComponent(params.get("q"));
  const bytes = CryptoJS.AES.decrypt(ciphertext, "secret key 123");
  const plaintext = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  const [user_id] = useState(plaintext.user_id);
  const [fullname] = useState(plaintext.fullname);
  const [fac_name] = useState(plaintext.fac_name);
  const [maj_name] = useState(plaintext.maj_name);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
  }, []);

  useEffect(() => {
    // Make a GET request to retrieve the data from the server
    fetch(`http://localhost:3333/student_form?student_id=${user_id}`)
      .then((response) => response.json())
      .then((data) => setStudentForm(data))
      .catch((error) => console.error(error));
  }, []);

  async function deleteStudentForm(s_id) {
    try {
      const result = await Swal.fire({
        title: 'ต้องการลบกิจกรรมนี้?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'ใช่',
        cancelButtonText: 'ไม่',
        customClass: {
          title: 'thai-font'
        },
      });
  
      if (result.isConfirmed) {
        // Make a DELETE request to delete the selected student form and the corresponding activity pictures
        await fetch(`http://localhost:3333/student_form/${s_id}`, { method: "DELETE" });
    
        // Remove the deleted student form from the local state
        setStudentForm(
          studentForm.filter((studentForm) => studentForm.s_id !== s_id)
        );
  
        // Show success message
        await Swal.fire(
          'สำเร็จ',
          'ข้อมูลกิจกรรมนี้ถูกลบแล้ว',
          'success'
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  

  async function handleClickPicture(s_id) {
    if (!s_id) {
      console.error("Invalid s_id parameter");
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:3333/activity_pictures/${s_id}`);
  
      if (!response.ok) {
        throw new Error(`Failed to fetch activity pictures: ${response.status}`);
      }
  
      const data = await response.json();
  
      if (data.length > 0) {
        const pictureArray = data.map((pictureData) => `data:image/png;base64,${pictureData}`);
  
        // Open a pop-up window with the images
        const popup = window.open("", "", "width=800,height=600,scrollbars=1");
        const picturesHtml = pictureArray
          .map((picture) => `<img src="${picture}" alt="activity picture" style="max-width: 100%; height: auto;">`)
          .join("");
  
        popup.document.write(picturesHtml);
      } else {
        setActivityPictures([]);
      }
    } catch (error) {
      console.error(error);
      setActivityPictures([]);
    }
  }
  

  const logoutButton = () => {
    Swal.fire({
      title: "คุณต้องการออกจากระบบ ?",
      showDenyButton: true,
      confirmButtonText: "ใช่",
      confirmButtonColor: "green",
      denyButtonText: "ไม่",
      customClass: {
        actions: "my-actions",
        cancelButton: "order-1 right-gap",
        confirmButton: "order-2",
        denyButton: "order-3",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    });
  };

  return (
    <div>
      <div className="navbar-parent-container">
        <Navbar
          expand="lg"
          variant="light"
          style={{ backgroundColor: "#EFC001", height: "60px", width: "100vw" }}
          fluid="true"
          className="navbar"
        >
          <Container className="navbar_container" fluid>
            <Navbar.Brand>
              <img
                alt=""
                src="https://upload.wikimedia.org/wikipedia/th/c/c4/%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%A7%E0%B8%B4%E0%B8%97%E0%B8%A2%E0%B8%B2%E0%B8%A5%E0%B8%B1%E0%B8%A2%E0%B8%A7%E0%B8%87%E0%B8%A9%E0%B9%8C%E0%B8%8A%E0%B8%A7%E0%B8%A5%E0%B8%B4%E0%B8%95%E0%B8%81%E0%B8%B8%E0%B8%A5.png"
                style={{ width: 40, height: 40 }}
                className="d-inline-block align-top"
              />{" "}
              <span style={{ fontWeight: "bold", color: "black" }}>
                VU Volunteer
              </span>
            </Navbar.Brand>

            <Navbar.Text
              onClick={logoutButton}
              style={{
                color: "black",
                textDecorationLine: "underline",
                cursor: "pointer",
              }}
              className="logout-button thai-font"
            >
              ออกจากระบบ
            </Navbar.Text>
          </Container>
        </Navbar>
      </div>

      <h1 style={{ textAlign: "center", marginTop: 10, fontSize: 40, fontWeight: "bold" }} className="thai-font"  >ระบบบันทึกจิตอาสา</h1>
      <p className="nameText thai-font " >
        รหัสนักศึกษา:{" "}
        <span style={{ color: "green", fontWeight: "bold" }}>{user_id}</span>
      </p>
      <p className="nameText thai-font">
        ชื่อ-นามสกุล:{" "}
        <span style={{ color: "green", fontWeight: "bold" }}>{fullname}</span>
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Button
          onClick={() =>
            navigate(`/student_form?q=${encodeURIComponent(ciphertext)}`)
          }
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "10px",
            marginBottom: 20,
            border: "none",
            alignSelf: "center",
            textAlign: "center",
            fontSize: 22,
          }}
          className="thai-font"
        >
          เพิ่มข้อมูลกิจกรรม
        </Button>
      </div>
      <Table striped bordered hover className="table-responsive">
        <thead className="thai-font" style={{fontSize: 20, }} >
          <tr>
            <th>#</th>
            <th>ชื่อกิจกรรม</th>
            <th>ประเภทกิจกรรม</th>
            <th>ภาคเรียน</th>
            <th>วันที่เข้าร่วมกิจกรรม</th>
            <th>รูปภาพ</th>
            <th>จำนวนชั่วโมง</th>
            <th></th>
          </tr>
        </thead>
        <tbody className="thai-font" style={{fontSize: 22, justifyContent: "center", alignItems: "center",}} >
          {studentForm.map((studentForm, index) => (
            <tr key={studentForm.id}>
              <td>{index + 1}</td>
              <td>{studentForm.activity_name}</td>
              <td>{studentForm.activity_type}</td>
              <td>{studentForm.activity_year}</td>
              <td>
                {new Date(studentForm.activity_date).toLocaleDateString(
                  "th-TH",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }
                )}
              </td>{" "}
              <td>
                <p
                  style={{
                    textDecorationLine: "underline",
                    cursor: "pointer",
                    color: "green",
                  }}
                  onClick={() => {
                    handleClickPicture(studentForm.s_id);
                  }}
                >
                  {studentForm.picture_count} รูป
                </p>
              </td>
              <td>{studentForm.activity_hours}</td>
              <td>
                <Button
                  variant="danger"
                  onClick={() => deleteStudentForm(studentForm.s_id)}
                >
                  ลบ
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="image-container">
        {activityPictures.map((pictureData, index) => (
          <img key={index} src={pictureData} alt="" />
        ))}
      </div>
    </div>
  );
};

export default Student_Dashboard;

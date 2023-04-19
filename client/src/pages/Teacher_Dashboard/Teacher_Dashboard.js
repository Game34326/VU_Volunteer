import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
import {
  Button,
  Table,
  Navbar,
  Container,
  Modal,
  ListGroup,
  Image,
  Card,
  Row,
} from "react-bootstrap";
import "./teacher_dashboard.css";
import Swal from "sweetalert2";
import { Search, ArrowBack } from "@mui/icons-material";
import { TextField, InputAdornment, IconButton } from "@mui/material";

const Teacher_Dashboard = ({s_id}) => {
  const [teacherForm, setTeacherForm] = useState([]);
  const [studentForm, setStudentForm] = useState([]);
  const [modalType, setModalType] = useState(null);
  const [activityPictures, setActivityPictures] = useState([]);


  const [showModal, setShowModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");

  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const ciphertext = decodeURIComponent(params.get("q"));
  const bytes = CryptoJS.AES.decrypt(ciphertext, "secret key 123");
  const plaintext = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  const [user_id] = useState(plaintext.user_id);
  const [fullname] = useState(plaintext.fullname);
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
    fetch(`http://localhost:3333/teacher_form?teacher_id=${user_id}`)
      .then((response) => response.json())
      .then((data) => {
        setTeacherForm(data);
      })
      .catch((error) => console.error(error));
  }, []);

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

  // const handleShowModal = async (activity) => {
  //   setSelectedActivity(activity);
  //   setModalType("activity");
  //   setShowModal(true);
  //   try {
  //     const response = await fetch(
  //       `http://localhost:3333/student_form_display?t_id=${activity.t_id}`
  //     );
  //     const data = await response.json();
  //     setStudentForm(data);
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  // const handleViewStudentInfo = (student) => {
  //   setSelectedStudent(student);
  //   setModalType("student");
  // };


  // useEffect(() => {
  //   async function fetchActivityPictures() {
  //     if (!s_id) {
  //       console.error("Invalid s_id parameter");
  //       return;
  //     }

  //     try {
  //       const response = await fetch(
  //         `http://localhost:3333/activity_pictures/${s_id}`
  //       );

  //       if (!response.ok) {
  //         throw new Error(
  //           `Failed to fetch activity pictures: ${response.status}`
  //         );
  //       }

  //       const data = await response.json();

  //       if (data.length > 0) {
  //         const pictureArray = data.map(
  //           (pictureData) => `data:image/png;base64,${pictureData}`
  //         );
  //         setActivityPictures(pictureArray);
  //       } else {
  //         setActivityPictures([]);
  //       }
  //     } catch (error) {
  //       console.error(error);
  //       setActivityPictures([]);
  //     }
  //   }

  //   fetchActivityPictures();
  // }, [s_id]);

  const handleShowModal = async (activity) => {
    setSelectedActivity(activity);
    setModalType("activity");
    setShowModal(true);
    try {
      const response = await fetch(
        `http://localhost:3333/student_form_display?t_id=${activity.t_id}`
      );
      const data = await response.json();
      setStudentForm(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleViewStudentInfo = async (student) => {
    setSelectedStudent(student);
    setModalType("student");
  
    try {
      const response = await fetch(
        `http://localhost:3333/activity_pictures/${student.s_id}`
      );
  
      if (!response.ok) {
        throw new Error(
          `Failed to fetch activity pictures: ${response.status}`
        );
      }
  
      const data = await response.json();
  
      if (data.length > 0) {
        const pictureArray = data.map(
          (pictureData) => `data:image/png;base64,${pictureData}`
        );
        setActivityPictures(pictureArray);
      } else {
        setActivityPictures([]);
      }
    } catch (error) {
      console.error(error);
      setActivityPictures([]);
    }
    console.log(activityPictures)
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

      <h1
        style={{
          textAlign: "center",
          marginTop: 10,
          fontSize: 40,
          fontWeight: "bold",
        }}
        className="thai-font"
      >
        ระบบบันทึกจิตอาสา
      </h1>
      <p className="nameText thai-font">
        รหัสบุคลากร:{" "}
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
            navigate(`/teacher_form?q=${encodeURIComponent(ciphertext)}`)
          }
          className="form_btn thai-font"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "10px",
            marginBottom: 20,
            border: "none",
            alignSelf: "center",
            textAlign: "center",
            fontSize: 20,
          }}
        >
          เพิ่มข้อมูลกิจกรรมที่จัดขึ้น
        </Button>
      </div>

      <Table striped bordered hover className="table-responsive">
        <thead className="thai-font" style={{ fontSize: 20 }}>
          <tr>
            <th>#</th>
            <th>ชื่อกิจกรรม</th>
            <th>ภาคเรียน</th>
            <th>วันที่จัดกิจกรรม</th>
            <th>วันที่สิ้นสุดกิจกรรม</th>
            <th>สถานที่จัดกิจกรรม</th>
            <th>จำนวนผู้เข้าร่วม</th>
            <th>{""}</th>
            <th>{""}</th>
          </tr>
        </thead>
        <tbody
          className="thai-font"
          style={{
            fontSize: 22,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {teacherForm.map((teacherForm, index) => (
            <tr key={teacherForm.id}>
              <td>{index + 1}</td>
              <td>{teacherForm.activity_name}</td>
              <td>{teacherForm.activity_year}</td>
              <td>
                {new Date(teacherForm.activity_date).toLocaleDateString(
                  "th-TH",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }
                )}
              </td>{" "}
              <td>
                {new Date(teacherForm.last_date).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </td>{" "}
              <td>{teacherForm.activity_place}</td>
              <td>{teacherForm.participant_count}</td>
              <td>
                <Button
                  variant="success"
                  onClick={() => handleShowModal(teacherForm)}
                  style={{ padding: 1, fontSize: 20 }}
                >
                  ตรวจสอบ
                </Button>
              </td>
              <td>
                <Button
                  variant="warning"
                  onClick={() => alert(teacherForm)}
                  style={{ padding: 1, paddingInline: 10, fontSize: 20 }}
                >
                  แก้ไข
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {selectedActivity && (
        <Modal
          show={modalType === "activity"}
          onHide={() => {
            setModalType(null);
            setSelectedActivity(null);
          }}
          className="thai-font"
          style={{ fontSize: 22 }}
          size="xl"
        >
          <Modal.Header closeButton style={{ borderBottom: "none" }} />
          <Modal.Title
            style={{ fontWeight: "bold", marginTop: 10, marginLeft: 10 }}
          >
            รายชื่อผู้เข้าร่วมกิจกรรม: {selectedActivity?.activity_name}
          </Modal.Title>
          <hr />
          <Modal.Body>
            <div
              style={{
                justifyContent: "center",
                alignItems: "center",
                display: "flex",
              }}
            >
              <TextField
                id="outlined-basic"
                label="รหัส/ชื่อนักศึกษา"
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton>
                        <Search />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                InputLabelProps={{
                  className: "thai-font",
                }}
              />
            </div>
            <table
              style={{ width: "100%", tableLayout: "fixed", marginTop: 15 }}
            >
              <thead>
                <tr>
                  <th>รหัสนักศึกษา</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {studentForm
                  .filter(
                    (student) =>
                      student.student_id.includes(searchQuery) ||
                      student.student_name.includes(searchQuery)
                  )
                  .map((student) => (
                    <tr key={student.student_id}>
                      <td>{student.student_id}</td>
                      <td>{student.student_name}</td>
                      <td>
                        {student.is_checked ? "ตรวจสอบแล้ว" : "ยังไม่ตรวจสอบ"}
                      </td>
                      <td>
                        <Button
                          variant="success"
                          style={{
                            fontSize: 20,
                            padding: 1,
                            paddingInline: 10,
                          }}
                          onClick={() => handleViewStudentInfo(student)}
                        >
                          ดูข้อมูลกิจกรรม
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Modal.Body>
        </Modal>
      )}

      {selectedStudent && (
        <Modal
          show={modalType === "student"}
          className="thai-font"
          style={{ fontSize: 22 }}
          size="xl"
        >
          <Modal.Header style={{ borderBottom: "none" }}>
            <IconButton onClick={() => setModalType("activity")}>
              <ArrowBack />
            </IconButton>
          </Modal.Header>
          <Modal.Title
            style={{ fontWeight: "bold", marginTop: 10, marginLeft: 10 }}
          >
            ข้อมูลนักศึกษา
          </Modal.Title>
          <Modal.Body>
            <div
              style={{
                flexDirection: "row",
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
              }}
            >
              <Image
                src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png"
                rounded
                style={{ width: 200, backgroundColor: "#D4E1E3" }}
              />

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  marginLeft: 20,
                }}
              >
                <p>
                  {" "}
                  <strong>รหัสนักศึกษา:</strong> {selectedStudent.student_id}
                </p>
                <p>
                  {" "}
                  <strong>ชื่อนักศึกษา:</strong> {selectedStudent.student_name}
                </p>
              </div>
            </div>
          </Modal.Body>
          <hr />

          <Modal.Title
            style={{ fontWeight: "bold", marginTop: 10, marginLeft: 10 }}
          >
            ข้อมูลการเข้าร่วมกิจกรรม
          </Modal.Title>
          <Modal.Body>
            <div >
              <p>
                <strong>ชื่อกิจกรรม: </strong>
                {selectedStudent.activity_name}
              </p>
              <p>
                <strong>ภาคเรียน:</strong> {selectedStudent.activity_year}
              </p>
              <p>
                <strong>วันที่จัดกิจกรรม:</strong>{" "}
                {new Date(selectedStudent.activity_date).toLocaleDateString(
                  "th-TH",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }
                )}
              </p>
              <p>
                <strong>วันที่สิ้นสุดกิจกรรม:</strong>{" "}
                {new Date(selectedStudent.last_date).toLocaleDateString(
                  "th-TH",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }
                )}
              </p>
              <p>
                <strong>
                  รายละเอียดลักษณะกิจกรรมตำแหน่งหน้าที่ที่ได้รับหมอบหมาย:
                </strong>{" "}
                {selectedStudent.activity_position}
              </p>
              <p>
                <strong>จำนวนชั่วโมงที่ทำกิจกรรม:</strong>{" "}
                {selectedStudent.activity_hours} ชั่วโมง
              </p>
              <strong>รูปภาพกิจกรรมกิจกรรม</strong>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: 20 }}>
              {activityPictures.map((picture, index) => (
                <img key={index} src={picture} alt="activity picture"  style={{width: 200, height: 200, borderRadius: 10}} />
              ))}
              </div>
            </div>
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
};

export default Teacher_Dashboard;

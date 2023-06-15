import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Form,
  Button,
  Navbar,
  Container,
  Card,
  ListGroup,
  Row,
  Modal,
  Image,
  Col,
  Table,
} from "react-bootstrap";
import Swal from "sweetalert2";
import { Search, Print } from "@mui/icons-material";
import { TextField, InputAdornment, IconButton } from "@mui/material";
import "./activity_online.css";
import Loader from "../../components/Loader";

const Activity_Online = () => {
  const [studentForm, setStudentForm] = useState([]);
  const [countInside, setCountInside] = useState({});
  const [modalType, setModalType] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentImage, setStudentImage] = useState("");
  const [selectedStudentTotalHours, setSelectedStudentTotalHours] =
    useState(null);
  const [displayImage, setDisplayImage] = useState(null);
  const [showCheckEditModal, setShowCheckEditModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [facultyList, setFacultyList] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [activityYearExcel, setActivityYearExcel] = useState(null);

  const [searchQuery, setSearchQuery] = useState({
    activityYear: "",
    student_id: "",
    student_name: "",
    fac_name: "",
    maj_name: "",
  });

  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const ciphertext = queryParams.get("q");
  const hostName = '192.168.0.119:3333'

  useEffect(() => {
    fetch(`http://${hostName}/activity_counts`)
      .then((response) => response.json())
      .then((data) => {
        setCountInside(data);
        console.log(data);
      });
  }, []);

  useEffect(() => {
    fetch(
      `http://appz.vu.ac.th:8989/VuAPIVer1/select_faculty_major.php?factype=1`
    )
      .then((response) => response.json())
      .then((data) => {
        setFacultyList(data);
      })
      .catch((error) => console.error(error));
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery({
      ...searchQuery,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearchSubmit = () => {
    // Construct the query parameters based on the selected values
    let queryParams = "";
    if (searchQuery.activityYear) {
      queryParams += `activity_year=${searchQuery.activityYear}&`;
    }
    if (searchQuery.student_name) {
      queryParams += `student_name=${searchQuery.student_name}&`;
    }
    if (searchQuery.student_id) {
      queryParams += `student_id=${searchQuery.student_id}&`;
    }
    if (searchQuery.fac_name) {
      queryParams += `fac_name=${searchQuery.fac_name}&`;
    }
    if (!isActive) {
      queryParams += `waitCheck=true&`;
    } else {
      queryParams += `alreadyCheck=true&`;
    }

    // Remove trailing '&' character if any
    if (queryParams.endsWith("&")) {
      queryParams = queryParams.slice(0, -1);
    }

    // Construct the URL with the query parameters
    const url = `http://${hostName}/student_online_check_activity/?${queryParams}`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        // Process the search results
        if (data.length === 0) {
          setStudentForm(0); // Set teacherForm to 0 to indicate no data available
        } else {
          setStudentForm(data);
        }
        console.log(data);
      })
      .catch((error) => console.error(error));

    console.log(searchQuery);
  };

  const goBackToFirstPage = () => {
    if (ciphertext) {
      const encodedCiphertext = encodeURIComponent(ciphertext);
      navigate(`/approver_dashboard?q=${encodedCiphertext}`);
    } else {
      // Handle the case when the ciphertext is null or not available
      console.error("Invalid ciphertext");
    }
  };

  function toggleSidebar() {
    const sidebar = document.querySelector(".sidebar");
    const icon = document.querySelector(".navbar-toggler-icon");

    sidebar.classList.toggle("active");
    icon.classList.toggle("open");
  }

  const handleViewStudentInfo = async (student) => {
    setModalType("student");

    try {
      // Fetch student image
      const imageResponse = await fetch(
        `http://appz.vu.ac.th:8989/VuAPIVer1/select_student_image.php?stuid=${student.student_id}`
      );
      if (!imageResponse.ok) {
        throw new Error(
          `Failed to fetch student image: ${imageResponse.status}`
        );
      }
      const { Per_Picture } = await imageResponse.json();
      const dataUri = `data:image/png;base64,${Per_Picture}`;
      setSelectedStudent(student);
      setStudentImage(dataUri);

      // Fetch total activity hours
      const totalHoursResponse = await fetch(
        `http://${hostName}/student_total_hours?student_id=${student.student_id}`
      );
      if (!totalHoursResponse.ok) {
        throw new Error(
          `Failed to fetch total activity hours: ${totalHoursResponse.status}`
        );
      }
      const totalHoursData = await totalHoursResponse.json();
      const totalPassHours = totalHoursData.total_pass_hours; // Access the total_pass_hours value
      setSelectedStudentTotalHours(totalPassHours);
    } catch (error) {
      console.error(error);
      setStudentImage(null);
      setSelectedStudentTotalHours(null);
    }
  };

  const handleCloseImage = () => {
    setDisplayImage(null);
  };

  async function handleButtonClick(status, s_id) {
    if (status === "ผ่าน") {
      const result = await Swal.fire({
        title: "ยืนยัน",
        text: "อนุมัติกิจกรรมนี้ผ่านใช่หรือไม่",
        icon: "warning",
        customClass: {
          title: "thai-font",
          header: "thai-font",
          popup: "thai-font text-sweet",
        },

        showCancelButton: true,
        confirmButtonColor: "green",
        cancelButtonColor: "gray",
        confirmButtonText: "ใช่",
        cancelButtonText: "ปิด",
      });
      if (result.isConfirmed) {
        const updatedActivity = {
          ...selectedStudent,
          check_activity: status,
        };

        fetch( `http://${hostName}/check-activity-inside`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ s_id, status }),
        }).then((response) => {
          if (response.ok) {
            setRefresh(!refresh);
            setSelectedStudent(updatedActivity);
            setStudentForm((prevState) =>
              prevState.map((activity) =>
                activity.s_id === selectedStudent.s_id
                  ? updatedActivity
                  : activity
              )
            );

            Swal.fire({
              icon: "success",
              title: "อนุมัติกิจกรรมสำเร็จ",
              showConfirmButton: false,
              timer: 1500,
              customClass: {
                title: "thai-font",
              },
            });
            setSelectedStudent(null);
          } else {
            console.error("Error submitting form");
            Swal.fire({
              icon: "error",
              text: "ระบบไม่สามารถอนุมัติได้",
            });
          }
        });
      }
    } else if (status === "แก้ไข") {
      setShowCheckEditModal(true);
    } else if (status === "ไม่ผ่าน") {
      setShowFailModal(true);
    }
  }

  function handleCheckEdit() {
    const updatedActivity = {
      ...selectedStudent,
      check_activity: editValue,
    };

    fetch( `http://${hostName}/check-activity-inside`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        s_id: selectedStudent.s_id,
        check_activity: editValue,
        status: "แก้ไข",
      }),
    }).then((response) => {
      setRefresh(!refresh);
      setSelectedStudent(updatedActivity);
      setStudentForm((prevState) =>
        prevState.map((activity) =>
          activity.s_id === selectedStudent.s_id ? updatedActivity : activity
        )
      );

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "บันทึกเหตุผลแก้ไขสำเร็จ",
          showConfirmButton: false,
          timer: 1500,
          customClass: {
            title: "thai-font",
          },
        });
        setSelectedStudent(updatedActivity);
        setShowCheckEditModal(false);
        setEditValue("");
      } else {
        console.error("Error submitting form");
        Swal.fire({
          icon: "error",
          text: "ระบบไม่สามารถบันทึกเหตุผลที่แก้ไขได้",
        });
      }
    });
  }

  function handleCheckFail() {
    const updatedActivity = {
      ...selectedStudent,
      check_fail: editValue,
    };

    fetch( `http://${hostName}/check-activity-inside`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        s_id: selectedStudent.s_id,
        check_fail: editValue,
        status: "ไม่ผ่าน",
      }),
    }).then((response) => {
      setRefresh(!refresh);
      setSelectedStudent(updatedActivity);
      setStudentForm((prevState) =>
        prevState.map((activity) =>
          activity.s_id === selectedStudent.s_id ? updatedActivity : activity
        )
      );

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "บันทึกเหตุผลที่ไม่ผ่านสำเร็จ",
          showConfirmButton: false,
          timer: 1500,
          customClass: {
            title: "thai-font",
          },
        });
        setSelectedStudent(updatedActivity);
        setShowFailModal(false);
        setEditValue("");
      } else {
        console.error("Error submitting form");
        Swal.fire({
          icon: "error",
          text: "ระบบไม่สามารถบันทึกเหตุผลที่ไม่ผ่านได้",
        });
      }
    });
  }

  const handleShowExport = () => {
    setShowExportModal(true);
  };

  const handleActiveClick = () => {
    setIsActive(!isActive);
  };

  const handleExportOnlineToExcel = async () => {
    if (!activityYearExcel) {
      console.error("Error submitting form");
      Swal.fire({
        icon: "error",
        text: "กรุณาเลือกปีการศึกษาที่ต้องการพิมพ์รายงาน",
      });
    } else {
      try {
        const response = await fetch(
          `http://${hostName}/export-online-to-excel?activityYearExcel=${activityYearExcel}`
        );
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "กิจกรรมอบรมออนไลน์.xlsx";
          a.style.display = "none";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } else {
          throw new Error("Export failed");
        }
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          text: "เกิดข้อผิดพลาดในการส่งคำร้องขอพิมพ์รายงาน",
        });
      }
    }
  };

  function handleClickPDF(selectedStudent) {
    // Convert the data to a Uint8Array
    const pdfData = new Uint8Array(selectedStudent.activity_document.data);

    // Convert the data to a Blob
    const pdfBlob = new Blob([pdfData], { type: "application/pdf" });

    // Create a URL for the Blob
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Open the PDF file in a new tab
    window.open(pdfUrl, "_blank");
  }

  return (
    <>
      <div>
        <div className="navbar-parent-container">
          <Navbar
            expand="lg"
            variant="light"
            style={{
              backgroundColor: "#EFC001",
              height: "60px",
              width: "100vw",
            }}
            fluid="true"
            className="navbar"
          >
            <Container className="navbar_container" fluid>
              <Navbar.Brand>
                <button
                  className="navbar-toggler"
                  type="button"
                  onClick={toggleSidebar}
                >
                  <span className="navbar-toggler-icon"></span>
                </button>
                <img
                  alt=""
                  src="https://upload.wikimedia.org/wikipedia/th/c/c4/%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%A7%E0%B8%B4%E0%B8%97%E0%B8%A2%E0%B8%B2%E0%B8%A5%E0%B8%B1%E0%B8%A2%E0%B8%A7%E0%B8%87%E0%B8%A9%E0%B9%8C%E0%B8%8A%E0%B8%A7%E0%B8%A5%E0%B8%B4%E0%B8%95%E0%B8%81%E0%B8%B8%E0%B8%A5.png"
                  style={{ width: 40, height: 40 }}
                  className="d-inline-block align-top"
                />{" "}
                <span
                  className="thai-font"
                  style={{ fontWeight: "bold", color: "black" }}
                >
                  VU Volunteer Checker
                </span>
              </Navbar.Brand>
            </Container>
          </Navbar>
        </div>
        <div className="container">
          <div className="row">
            <div className="col-md-4">
              <div className="sidebar">
                {" "}
                <p
                  className="thai-font"
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    borderBottom: "1px solid black",
                  }}
                >
                  กิจกรรมอบรมออนไลน์จิตสาธารณะ กยศ.
                </p>
                <ul
                  className="list-unstyled thai-font"
                  style={{ fontSize: 22 }}
                >
                  <li
                    className={
                      location.pathname === "/activity_online" ? "active" : ""
                    }
                  >
                    <Link
                      to={`/activity_online?q=${encodeURIComponent(
                        ciphertext
                      )}`}
                    >
                      ตรวจสอบกิจกรรมนักศึกษา{" "}
                      {countInside.onlineNumber !== 0 && (
                        <span style={{ color: "red", fontWeight: "bold" }}>
                          ({countInside.onlineNumber})
                        </span>
                      )}
                    </Link>
                  </li>
                  <li
                    style={{ cursor: "pointer" }}
                    onClick={() => goBackToFirstPage(ciphertext)}
                  >
                    <Link to={() => goBackToFirstPage(ciphertext)}>
                      หน้าแรก
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <h1
          style={{
            textAlign: "center",
            marginTop: 80,
            fontSize: 35,
            fontWeight: "bold",
            marginLeft: "20%",
            marginRight: "20px",
          }}
          className="thai-font"
        >
          ตรวจสอบพิจารณากิจกรรมนักศึกษา
        </h1>
        <div className="content thai-font table-check-inside">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "650px",
                padding: "20px",
                border: "1px solid #ccc",
                borderRadius: 25,
                marginTop: 20,
              }}
            >
              <Form>
                <Row className="mb-3">
                  <Col xs={12} sm={6} md={4}>
                    <Form.Label>ปีการศึกษา/ภาคเรียน</Form.Label>
                    <Form.Control
                      as="select"
                      name="activityYear"
                      placeholder="Activity Year"
                      value={searchQuery.activityYear}
                      onChange={handleSearchChange}
                    >
                      <option value="">ทั้งหมด</option>
                      <option value="2566/1">2566/1 </option>
                      <option value="2566/2">2566/2</option>
                      <option value="2565/1">2565/1</option>
                      <option value="2565/2">2565/2</option>
                      <option value="2565/summer">2565/summer</option>
                    </Form.Control>
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <Form.Group controlId="fac_name">
                      <Form.Label>คณะวิชา</Form.Label>
                      <Form.Control
                        as="select"
                        name="fac_name" // Update the name attribute to a unique value
                        value={searchQuery.fac_name}
                        onChange={handleSearchChange}
                      >
                        <option value="">-- เลือก --</option>
                        {facultyList.map((faculty) => (
                          <option
                            value={faculty.Fac_NameTH}
                            key={faculty.Fac_ID}
                          >
                            {faculty.Fac_NameTH}
                          </option>
                        ))}
                      </Form.Control>
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <Form.Label>รหัสนักศึกษา</Form.Label>
                    <Form.Control
                      type="text"
                      name="student_id"
                      value={searchQuery.student_id}
                      onChange={handleSearchChange}
                    />
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <Form.Label>ชื่อ-นามสกุล</Form.Label>
                    <Form.Control
                      type="text"
                      name="student_name"
                      value={searchQuery.student_name}
                      onChange={handleSearchChange}
                    />
                  </Col>
                </Row>
              </Form>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Button
                  style={{
                    padding: "5px 10px",
                    borderRadius: "5px",
                    border: isActive ? "1px solid orange" : "none", // Add border for non-active button
                    backgroundColor: isActive ? "white" : "orange",
                    color: isActive ? "black" : "white",
                    width: 150,
                    fontSize: 20,
                  }}
                  className="btn btn-warning"
                  onClick={handleActiveClick}
                >
                  รอการตรวจสอบ
                </Button>

                <Button
                  className="btn btn-success"
                  style={{
                    padding: "5px 10px",
                    borderRadius: "5px",
                    marginRight: "10px",
                    border: !isActive ? "1px solid green" : "none", // Add border for non-active button
                    backgroundColor: isActive ? "green" : "white",
                    color: isActive ? "white" : "black",
                    width: 150,
                    fontSize: 20,
                  }}
                  onClick={handleActiveClick}
                >
                  ตรวจสอบแล้ว
                </Button>
              </div>
              <Row className="mb-3 justify-content-end mt-3">
                <Col xs={12} sm={6} md={4}>
                  <Button
                    onClick={() => handleSearchSubmit()}
                    variant="primary"
                    style={{ fontSize: 22 }}
                  >
                    <Search /> ค้นหา
                  </Button>
                </Col>
              </Row>
            </div>
          </div>
        </div>
        <div
          className="table-check-inside"
          style={{ display: "flex", justifyContent: "center", marginTop: 20 }}
        ></div>
        <div className="table-header table-check-inside thai-font">
        <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginRight: 10,
              marginTop: 20,
            }}
          >
            <Button
              className="btn btn-success"
              style={{ fontSize: 18 }}
              onClick={() => handleShowExport()}
            >
              <Print /> พิมพ์รายงาน
            </Button>
          </div>

          {studentForm === 0 ? (
            <p
              style={{
                color: "red",
                display: "flex",
                justifyContent: "center",
                marginTop: 20,
              }}
            >
              ***ไม่มีข้อมูลกิจกรรม***
            </p>
          ) : (
            <Table
              striped
              bordered
              hover
              style={{ maxWidth: "100%", marginTop: 40 }}
              className="mx-auto"
            >
              <thead>
                <tr>
                  <th>#</th>
                  <th>หัวข้อการเข้าอบรม</th>
                  <th>ปีการศึกษา</th>
                  <th
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      flex: 1,
                    }}
                    // onClick={() => handleSort("student_id")}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      รหัสนักศึกษา&nbsp;
                      <div style={{ marginLeft: 3, fontSize: 18 }}>
                        {/* {sortDirection["student_id"] === "asc" ? "↑" : "↓"} */}
                      </div>
                    </div>
                  </th>
                  <th style={{ flex: 1, justifyContent: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                      // onClick={() => handleSort("student_name")}
                    >
                      ชื่อ-นามสกุล&nbsp;
                      <div style={{ marginLeft: 3, fontSize: 18 }}>
                        {/* {sortDirection["student_name"] === "asc" ? "↑" : "↓"} */}
                      </div>
                    </div>
                  </th>
                  <th>คณะ</th>
                  <th>สาขา</th>
                  <th
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      flex: 1,
                    }}
                    // onClick={() => handleSort("check_inside")}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      สถานะ&nbsp;
                      <div style={{ marginLeft: 3, fontSize: 18 }}>
                        {/* {sortDirection["check_inside"] === "asc" ? "↑" : "↓"} */}
                      </div>
                    </div>
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {studentForm.map((student, index) => (
                  <tr key={student.student_id}>
                    <td>{index + 1}</td>
                    <td>{student.activity_name}</td>
                    <td>{student.activity_year}</td>
                    <td>{student.student_id}</td>
                    <td>{student.student_name}</td>
                    <td>{student.fac_name}</td>
                    <td>{student.maj_name}</td>
                    <td>
                      {student.check_fail !== null ? (
                        <span style={{ color: "red", fontWeight: "bold" }}>
                          ไม่ผ่าน
                        </span>
                      ) : student.check_activity === "ผ่าน" ? (
                        <span style={{ color: "green", fontWeight: "bold" }}>
                          ผ่าน
                        </span>
                      ) : student.check_activity === null ? (
                        <span style={{ color: "black", fontWeight: "bold" }}>
                          รอการพิจารณา
                        </span>
                      ) : (
                        <span style={{ color: "orange", fontWeight: "bold" }}>
                          รอการแก้ไข
                        </span>
                      )}
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
                        <Search style={{ fontSize: 16 }} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
        {showExportModal && (
          <Modal
            show={showExportModal}
            onHide={() => {
              setShowExportModal(false);
              setActivityYearExcel(null);
            }}
            className="thai-font"
          >
            <Modal.Title
              style={{ fontWeight: "bold", fontSize: 30, marginLeft: 10 }}
            >
              พิมพ์รายงานกิจกรรมอบรมออนไลน์
            </Modal.Title>
            <hr />
            <Modal.Body>
              <Form>
                <Form.Label>ปีการศึกษา/ภาคเรียน</Form.Label>
                <Form.Control
                  as="select"
                  name="activity_year"
                  placeholder="Activity Year"
                  value={activityYearExcel}
                  onChange={(e) => setActivityYearExcel(e.target.value)}
                >
                  <option value="">--เลือก--</option>
                  <option value="2566/1">2566/1 </option>
                  <option value="2566/2">2566/2</option>
                  <option value="2565/1">2565/1</option>
                  <option value="2565/2">2565/2</option>
                  <option value="2565/summer">2565/summer</option>
                </Form.Control>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button
                className="btn btn-success"
                onClick={() => handleExportOnlineToExcel()}
              >
                พิมพ์รายงาน
              </Button>
              <Button
                className="btn btn-secondary"
                onClick={() => {
                  setShowExportModal(false);
                  setActivityYearExcel(null);
                }}
              >
                ปิด
              </Button>
            </Modal.Footer>
          </Modal>
        )}
        {selectedStudent && (
          <Modal
            show={modalType === "student"}
            className="thai-font"
            style={{ fontSize: 22 }}
            size="lg"
            onHide={() => setModalType(null)}
          >
            <Modal.Header closeButton />
            <Modal.Body>
              <div
                style={{
                  flexDirection: "row",
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                }}
              >
                {studentImage && studentImage ? (
                  <Image
                    id="student-image"
                    src={studentImage}
                    rounded
                    style={{ width: 200, backgroundColor: "#D4E1E3" }}
                  />
                ) : (
                  <Image
                    src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png"
                    rounded
                    style={{ width: 200, backgroundColor: "#D4E1E3" }}
                  />
                )}

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
                    <strong>ชื่อนักศึกษา:</strong>{" "}
                    {selectedStudent.student_name}
                  </p>
                  <p>
                    {" "}
                    <strong>คณะ:</strong> {selectedStudent.fac_name}
                  </p>
                  <p>
                    {" "}
                    <strong>สาขา:</strong> {selectedStudent.maj_name}
                  </p>
                  {selectedStudentTotalHours !== null && (
                    <p>
                      <strong>
                        จำนวนชั่วโมงจิตอาสาที่ผ่านการอนุมัติทั้งหมด:
                      </strong>{" "}
                      {selectedStudentTotalHours} {""} ชั่วโมง
                    </p>
                  )}
                </div>
              </div>
            </Modal.Body>
            <hr />

            <Modal.Body>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                }}
              >
                <Modal.Title
                  style={{
                    fontWeight: "bold",
                    marginBottom: 10,
                    color: "#19A703",
                  }}
                >
                  ข้อมูลการเข้าร่วมกิจกรรมของนักศึกษา
                </Modal.Title>
                <p>
                  <strong>หัวข้อการเข้าอบรม:</strong> {selectedStudent.activity_name}
                </p>
                <p>
                  <strong>ปีการศึกษา/ภาคเรียน:</strong>{" "}
                  {selectedStudent.activity_year}
                </p>
                <p>
                  <strong>วันที่เข้าร่วมกิจกรรม:</strong>{" "}
                  {new Date(selectedStudent.activity_date).toLocaleDateString(
                    "th-TH",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
                <p>
                  <strong>ช่วงเวลาที่ทำกิจกรรมนี้:</strong>{" "}
                  {selectedStudent.start_time} น. - {selectedStudent.end_time}{" "}
                  น. จำนวน {selectedStudent.activity_hours} ชั่วโมง
                </p>
                <p>
                  <strong>เอกสารยืนยันการทำกิจกรรม:</strong>{" "}
                  <span
                    style={{ color: "green", fontWeight: "bold", textDecorationLine: 'underline', cursor: 'pointer' }}
                    onClick={() => {
                      handleClickPDF(selectedStudent);
                    }}
                  >
                    ดูเอกสาร
                  </span>
                </p>
              </div>

              <p style={{ marginTop: 20 }}>
                <strong
                  style={{
                    color: "red",
                    display:
                      !selectedStudent?.check_activity ||
                      selectedStudent?.check_activity === "ผ่าน"
                        ? "none"
                        : "inline",
                  }}
                >
                  เหตุผลที่ต้องแก้ไข:
                </strong>{" "}
                {selectedStudent?.check_activity === "ผ่าน"
                  ? null
                  : selectedStudent?.check_activity}
              </p>

              <p style={{ marginTop: 20 }}>
                <strong
                  style={{
                    color: "red",
                    display:
                      (!selectedStudent?.check_activity ||
                        selectedStudent?.check_fail == null) &&
                      !selectedStudent?.check_fail
                        ? "none"
                        : "inline",
                  }}
                >
                  เหตุผลที่ไม่ผ่าน:
                </strong>{" "}
                {selectedStudent?.check_activity === "ผ่าน"
                  ? null
                  : selectedStudent?.check_fail}
              </p>
            </Modal.Body>
            <Modal show={displayImage !== null} onHide={handleCloseImage}>
              <Modal.Body>
                <img
                  src={displayImage}
                  alt="selected activity picture"
                  style={{ width: "100%" }}
                />
              </Modal.Body>
            </Modal>

            <Modal.Footer
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div>
                <Button
                  variant="success"
                  style={{ fontSize: 20, marginRight: 20, width: 80 }}
                  onClick={() =>
                    handleButtonClick("ผ่าน", selectedStudent.s_id)
                  }
                >
                  ผ่าน
                </Button>
                <Button
                  variant="warning"
                  style={{ fontSize: 20, marginRight: 20, width: 80 }}
                  onClick={() =>
                    handleButtonClick("แก้ไข", selectedStudent.s_id)
                  }
                >
                  แก้ไข
                </Button>
                <Button
                  variant="danger"
                  style={{ fontSize: 20, marginRight: 20, width: 80 }}
                  onClick={() =>
                    handleButtonClick("ไม่ผ่าน", selectedStudent.s_id)
                  }
                >
                  ไม่ผ่าน
                </Button>
                <Button
                  variant="secondary"
                  style={{ fontSize: 20, marginRight: 20, width: 80 }}
                  onClick={() => {
                    setModalType(null);
                  }}
                >
                  ปิด
                </Button>
              </div>
            </Modal.Footer>
          </Modal>
        )}
        {showCheckEditModal && (
          <Modal
            show={showCheckEditModal}
            onHide={() => {
              setShowCheckEditModal(false);
              setEditValue("");
            }}
            centered
            className="thai-font modal-dialog-centered"
            size="sm"
          >
            <Modal.Header closeButton>
              <Modal.Title style={{ fontWeight: "bold" }}>
                เหตุผลที่ต้องแก้ไข
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="ระบุเหตุผลที่ต้องแก้ไข"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditValue("");
                  setShowCheckEditModal(false);
                }}
                style={{ fontSize: 20 }}
              >
                ยกเลิก
              </Button>
              <Button
                variant="warning"
                onClick={() => handleCheckEdit()}
                style={{ fontSize: 20 }}
              >
                บันทึก
              </Button>
            </Modal.Footer>
          </Modal>
        )}
        {showFailModal && (
          <Modal
            show={showFailModal}
            onHide={() => {
              setShowFailModal(false);
              setEditValue("");
            }}
            centered
            className="thai-font modal-dialog-centered"
            size="sm"
          >
            <Modal.Header closeButton>
              <Modal.Title style={{ fontWeight: "bold" }}>
                เหตุผลที่ไม่ผ่าน
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="ระบุเหตุผลไม่ผ่าน"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditValue("");
                  setShowFailModal(false);
                }}
                style={{ fontSize: 20 }}
              >
                ยกเลิก
              </Button>
              <Button
                variant="danger"
                onClick={() => handleCheckFail()}
                style={{ fontSize: 20 }}
              >
                บันทึก
              </Button>
            </Modal.Footer>
          </Modal>
        )}
        {loading && (
          <div>
            <Loader className="thai-font" />
          </div>
        )}{" "}
      </div>
    </>
  );
};

export default Activity_Online;

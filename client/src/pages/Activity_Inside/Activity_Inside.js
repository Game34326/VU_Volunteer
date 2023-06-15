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
  Col,
  InputGroup,
} from "react-bootstrap";
import Swal from "sweetalert2";
import { Menu, HighlightOffRounded } from "@mui/icons-material";
import { Search, ArrowBack } from "@mui/icons-material";
import "./activity_inside.css";
import SwiperCore, { Pagination, Navigation } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/swiper-bundle.css";
import "swiper/css/navigation";
SwiperCore.use([Pagination, Navigation]);

const Activity_Inside = () => {
  const [activityYear, setActivityYear] = useState("");
  const [countInside, setCountInside] = useState({});
  const [teacherForm, setTeacherForm] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [activityPictures, setActivityPictures] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [institution, setInstitution] = useState([]);
  const [searchQuery, setSearchQuery] = useState({
    activityYear: "",
    department: "",
  });
  const [isActive, setIsActive] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const ciphertext = queryParams.get("q");
  const hostName = '192.168.0.119:3333'

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
  }, []);

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

  useEffect(() => {
    fetch(
      `http://appz.vu.ac.th:8989/VuAPIVer1/select_faculty_major.php?factype=0`
    )
      .then((response) => response.json())
      .then((data) => {
        setInstitution(data);
      })
      .catch((error) => console.error(error));
  }, []);

  const goBackToFirstPage = () => {
    if (ciphertext) {
      const encodedCiphertext = encodeURIComponent(ciphertext);
      navigate(`/approver_dashboard?q=${encodedCiphertext}`);
    } else {
      // Handle the case when the ciphertext is null or not available
      console.error("Invalid ciphertext");
    }
  };

  async function handleButtonClick(status, t_id) {
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
          ...selectedActivity,
          check_activity: status,
        };

        fetch( `http://${hostName}/update-teacher-form`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ t_id, status }),
        }).then((response) => {
          if (response.ok) {
            setSelectedActivity(updatedActivity);
            setTeacherForm((prevState) =>
              prevState.map((activity) =>
                activity.t_id === selectedActivity.t_id
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
            setSelectedActivity(null);
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
      setShowEditModal(true);
    }
  }

  function handleEditSubmit() {
    const updatedActivity = {
      ...selectedActivity,
      check_activity: editValue,
    };

    fetch( `http://${hostName}/update-teacher-form`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        t_id: selectedActivity.t_id,
        check_activity: editValue,
        status: "แก้ไข",
      }),
    }).then((response) => {
      setSelectedActivity(updatedActivity);
      setTeacherForm((prevState) =>
        prevState.map((activity) =>
          activity.t_id === selectedActivity.t_id ? updatedActivity : activity
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
        setSelectedActivity(updatedActivity);
        setShowEditModal(false);
        setEditValue("");
      } else {
        console.error("Error submitting form");
        Swal.fire({
          icon: "error",
          text: "ระบบไม่สามารถบันทึกเหตุผลแก้ไขได้",
        });
      }
    });
  }

  const handleShowModal = (activity) => {
    setSelectedActivity(activity);
  };

  function toggleSidebar() {
    const sidebar = document.querySelector(".sidebar");
    const icon = document.querySelector(".navbar-toggler-icon");

    sidebar.classList.toggle("active");
    icon.classList.toggle("open");
  }

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;

    // Check if the value is a JSON string and parse it if so
    try {
      parsedValue = JSON.parse(value);
    } catch (error) {
      // Handle parsing error if necessary
    }

    setSearchQuery({
      ...searchQuery,
      [name]: parsedValue,
    });
  };

  const handleActiveClick = () => {
    setIsActive(!isActive);
  };

  const handleSearchSubmit = () => {
    // Construct the query parameters based on the selected values
    let queryParams = "";
    if (searchQuery.activityYear) {
      queryParams += `activity_year=${searchQuery.activityYear}&`;
    }
    if (searchQuery.department) {
      queryParams += `department=${searchQuery.department}&`;
    }
    if (searchQuery.institution) {
      queryParams += `institution=${searchQuery.institution}&`;
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
    const url = `http://${hostName}/teacher_form_check/?${queryParams}`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        // Process the search results
        if (data.length === 0) {
          setTeacherForm(0); // Set teacherForm to 0 to indicate no data available
        } else {
          setTeacherForm(data);
        }
        console.log(data);
      })
      .catch((error) => console.error(error));

    console.log(searchQuery);
  };

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
                  กิจกรรมจัดขึ้นโดยคณะ ศูนย์ สำนักของมหาวิทยาลัย
                </p>
                <ul
                  className="list-unstyled thai-font"
                  style={{ fontSize: 22 }}
                >
                  <li
                    className={
                      location.pathname === "/activity_inside" ? "active" : ""
                    }
                  >
                    <Link
                      to={`/activity_inside?q=${encodeURIComponent(
                        ciphertext
                      )}`}
                    >
                      อนุมัติกิจกรรม{" "}
                      {countInside.teacherFormNumber !== 0 && (
                        <span style={{ color: "red", fontWeight: "bold" }}>
                          ({countInside.teacherFormNumber})
                        </span>
                      )}
                    </Link>
                  </li>
                  <li
                    className={
                      location.pathname === "/check_activity_inside"
                        ? "active"
                        : ""
                    }
                  >
                    <Link
                      to={`/check_activity_inside?q=${encodeURIComponent(
                        ciphertext
                      )}`}
                    >
                      ตรวจสอบกิจกรรมนักศึกษา{" "}
                      {countInside.insideNumber !== 0 && (
                        <span style={{ color: "red", fontWeight: "bold" }}>
                          ({countInside.insideNumber})
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
          }}
          className="thai-font approve-container"
        >
          อนุมัติกิจกรรม
        </h1>

        <div className="content thai-font approve-container">
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
                    <Form.Group controlId="department">
                      <Form.Label>คณะวิชา</Form.Label>
                      <Form.Control
                        as="select"
                        name="department" // Update the name attribute to a unique value
                        value={searchQuery.department}
                        onChange={handleSearchChange}
                      >
                        <option value="">-- เลือก --</option>
                        {facultyList.map((faculty) => (
                          <option value={faculty.Fac_ID} key={faculty.Fac_ID}>
                            {faculty.Fac_NameTH}
                          </option>
                        ))}
                      </Form.Control>
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <Form.Group controlId="institution">
                      <Form.Label>ศูนย์/สำนัก</Form.Label>
                      <Form.Control
                        as="select"
                        name="institution" // Update the name attribute to a unique value
                        onChange={handleSearchChange}
                        value={searchQuery.institution}
                      >
                        <option value="">-- เลือก --</option>
                        {institution.map((inst) => (
                          <option value={inst.Fac_ID} key={inst.Fac_ID}>
                            {inst.Fac_NameTH}
                          </option>
                        ))}
                      </Form.Control>
                    </Form.Group>
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
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginTop: 30,
            }}
          >
            {teacherForm === 0 ? (
              <p style={{ color: "red" }}>***ไม่มีข้อมูลกิจกรรม***</p>
            ) : (
              <ListGroup>
                <Row
                  className="justify-content-center"
                  style={{ height: "auto" }}
                >
                  {teacherForm.map((activity, index) => (
                    <Card
                      key={activity.t_id}
                      className="activity-card thai-font"
                      style={{ fontSize: 20, height: "auto" }}
                    >
                      <Swiper
                        navigation={true}
                        pagination={{ clickable: true }}
                        paginationStyle={{ marginBottom: 20 }}
                      >
                        {activity.picture_data.map((picture, index) => (
                          <SwiperSlide key={index}>
                            {picture ? (
                              <Card.Img
                                variant="top"
                                src={`data:image/png;base64,${picture}`}
                                className="card-img-top"
                                style={{ height: 300 }}
                              />
                            ) : (
                              <Card.Img
                                variant="top"
                                src="https://upload.wikimedia.org/wikipedia/th/c/c4/%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%A7%E0%B8%B4%E0%B8%97%E0%B8%A2%E0%B8%B2%E0%B8%A5%E0%B8%B1%E0%B8%A2%E0%B8%A7%E0%B8%87%E0%B8%A9%E0%B9%8C%E0%B8%8A%E0%B8%A7%E0%B8%A5%E0%B8%B4%E0%B8%95%E0%B8%81%E0%B8%B8%E0%B8%A5.png"
                                className="card-img-top"
                                style={{ height: 300 }}
                              />
                            )}
                          </SwiperSlide>
                        ))}
                      </Swiper>

                      <Card.Header
                        style={{
                          fontWeight: "bold",
                          backgroundColor: "#E7E7E7",
                        }}
                      >
                        {activity.activity_name}
                      </Card.Header>
                      <ListGroup.Item>
                        <strong>ภาคเรียน:</strong> {activity.activity_year}
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <strong>วันที่จัดกิจกรรม:</strong>{" "}
                        {new Date(activity.activity_date).toLocaleDateString(
                          "th-TH",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <strong>วันที่สิ้นสุดกิจกรรม:</strong>{" "}
                        {new Date(activity.last_date).toLocaleDateString(
                          "th-TH",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <strong>ผู้ดูแลกิจกรรม:</strong> {activity.teacher_name}
                      </ListGroup.Item>

                      <ListGroup.Item>
                        <strong>กิจกรรมจัดขึ้นโดย:</strong>{" "}
                        {activity.department &&
                          JSON.parse(activity.department).dep_name}
                      </ListGroup.Item>

                      <ListGroup.Item className="text-center">
                        {activity && (
                          <button
                            className={`btn ${
                              activity.check_activity === "ผ่าน"
                                ? "btn-success"
                                : activity.check_activity
                                ? "btn-warning"
                                : "btn-primary"
                            }`}
                            onClick={() => handleShowModal(activity)}
                            style={{
                              fontSize: 20,
                              color: "white",
                            }}
                          >
                            {activity.check_activity
                              ? activity.check_activity === "ผ่าน"
                                ? "ผ่าน"
                                : "แก้ไข"
                              : "ดูข้อมูลกิจกรรม"}
                          </button>
                        )}
                      </ListGroup.Item>
                    </Card>
                  ))}
                </Row>
              </ListGroup>
            )}
          </div>

          <Modal
            show={selectedActivity !== null}
            onHide={() => {
              setSelectedActivity(null);
            }}
            className="thai-font"
            style={{ fontSize: 20, zIndex: 10000 }}
          >
            <div style={{ position: "relative" }}>
              <button
                className="btn btn-light"
                style={{ position: "absolute", top: 0, right: 0, fontSize: 20 }}
                onClick={() => {
                  setSelectedActivity(null);
                }}
              >
                <HighlightOffRounded style={{ color: "red" }} />
              </button>

              <Swiper
                navigation={true}
                pagination={{ clickable: true }}
                paginationStyle={{ marginBottom: 20 }}
              >
                {selectedActivity?.picture_data.map((picture, index) => (
                  <SwiperSlide key={index}>
                    {picture ? (
                      <img
                        variant="top"
                        src={`data:image/png;base64,${picture}`}
                        className="img-fluid"
                        style={{ width: 500, height: 600 }}
                      />
                    ) : (
                      <img
                        src="https://upload.wikimedia.org/wikipedia/th/c/c4/%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%A7%E0%B8%B4%E0%B8%97%E0%B8%A2%E0%B8%B2%E0%B8%A5%E0%B8%B1%E0%B8%A2%E0%B8%A7%E0%B8%87%E0%B8%A9%E0%B9%8C%E0%B8%8A%E0%B8%A7%E0%B8%A5%E0%B8%B4%E0%B8%95%E0%B8%81%E0%B8%B8%E0%B8%A5.png"
                        variant="top"
                        className="img-fluid"
                        style={{ width: 500 }}
                      />
                    )}
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            <Modal.Title
              style={{ fontWeight: "bold", marginTop: 10, marginLeft: 10 }}
            >
              {selectedActivity?.activity_name}
            </Modal.Title>
            <hr />
            <Modal.Body>
              <p>
                <strong>ภาคเรียน:</strong> {selectedActivity?.activity_year}
              </p>
              <p>
                <strong>วันที่จัดกิจกรรม:</strong>{" "}
                {new Date(selectedActivity?.activity_date).toLocaleDateString(
                  "th-TH",
                  { year: "numeric", month: "short", day: "numeric" }
                )}
              </p>
              <p>
                <strong>วันที่สิ้นสุดกิจกรรม:</strong>{" "}
                {new Date(selectedActivity?.last_date).toLocaleDateString(
                  "th-TH",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }
                )}
              </p>
              <p>
                <strong>สถานที่จัดกิจกรรม:</strong>{" "}
                {selectedActivity?.activity_place}
              </p>
              <p>
                <strong>ผู้ดูแลกิจกรรม:</strong>{" "}
                {selectedActivity?.teacher_name}
              </p>
              <p>
                <strong>กิจกรรมจัดขึ้นโดย:</strong>{" "}
                {selectedActivity?.department &&
                  JSON.parse(selectedActivity?.department).dep_name}
              </p>
              <p>
                <strong>สร้างกิจกรรมเมื่อวันที่:</strong>{" "}
                {new Date(selectedActivity?.create_time).toLocaleString(
                  "th-TH",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                    second: "numeric",
                    timeZone: "UTC",
                  }
                )}
              </p>
              <strong
                style={{
                  color: "red",
                  display:
                    selectedActivity?.check_activity === "ผ่าน" ||
                    !selectedActivity?.check_activity
                      ? "none"
                      : "inline",
                }}
              >
                เหตุผลที่ต้องแก้ไข:
              </strong>{" "}
              {selectedActivity?.check_activity === "ผ่าน"
                ? null
                : selectedActivity?.check_activity}
            </Modal.Body>
            <Modal.Footer
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div>
                <Button
                  onClick={() =>
                    handleButtonClick("ผ่าน", selectedActivity.t_id)
                  }
                  variant="success"
                  style={{ fontSize: 20, marginRight: 20 }}
                >
                  ผ่าน
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleButtonClick("แก้ไข", selectedActivity.t_id);
                  }}
                  variant="warning"
                  style={{ fontSize: 20, marginRight: 20 }}
                >
                  แก้ไข
                </Button>
                <Button
                  onClick={() => {
                    setSelectedActivity(null);
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: 20, marginRight: 20 }}
                >
                  ปิด
                </Button>

                {showEditModal && (
                  <Modal
                    show={showEditModal}
                    onHide={() => {
                      setShowEditModal(false);
                      setEditValue("");
                    }}
                    centered
                    className="thai-font modal-dialog-centered"
                    size="lg"
                    style={{ zIndex: 999999 }}
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
                        placeholder="ระบุเหตุผลที่ต้องการแก้ไข"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                      />
                    </Modal.Body>
                    <Modal.Footer>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setEditValue("");
                          setShowEditModal(false);
                        }}
                        style={{ fontSize: 20 }}
                      >
                        ยกเลิก
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => handleEditSubmit()}
                        style={{ fontSize: 20 }}
                      >
                        บันทึก
                      </Button>
                    </Modal.Footer>
                  </Modal>
                )}
              </div>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </>
  );
};

export default Activity_Inside;

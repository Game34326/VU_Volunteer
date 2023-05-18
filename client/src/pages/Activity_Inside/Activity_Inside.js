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
  InputGroup,
} from "react-bootstrap";
import Swal from "sweetalert2";
import { Menu, HighlightOffRounded } from "@mui/icons-material";
import "./activity_inside.css";
import SwiperCore, { Pagination, Navigation } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/swiper-bundle.css";
import "swiper/css/navigation";
SwiperCore.use([Pagination, Navigation]);

const Activity_Inside = () => {
  const [activityYear, setActivityYear] = useState("");
  const [teacherForm, setTeacherForm] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [activityPictures, setActivityPictures] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Make a GET request to retrieve the data from the server
    fetch(
      `http://localhost:3333/teacher_form_check?activity_year=${activityYear}`
    )
      .then((response) => response.json())
      .then((data) => {
        setTeacherForm(data);
        console.log(data);
      })
      .catch((error) => console.error(error));
  }, [activityYear]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
  }, []);

  const goback = () => {
    navigate(-1);
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

        fetch("http://localhost:3333/update-teacher-form", {
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

    fetch("http://localhost:3333/update-teacher-form", {
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

        <div className="sidebar">
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
          <ul className="list-unstyled thai-font" style={{ fontSize: 22 }}>
            <li
              className={
                location.pathname === "/activity_inside" ? "active" : ""
              }
            >
              <Link to="/activity_inside">อนุมัติกิจกรรม</Link>
            </li>
            <li
              className={
                location.pathname === "/check_activity_inside" ? "active" : ""
              }
            >
              <Link to="/check_activity_inside">ตรวจสอบกิจกรรมนักศึกษา</Link>
            </li>
            <li
              style={{ cursor: "pointer" }}
              onClick={() => goback()}
            >
              <Link to={() => goback()}>หน้าแรก</Link>
            </li>
          </ul>
        </div>

        <div className="content">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Form className="form_container thai-font">
              <Form.Group controlId="activityYear" className="form-group">
                <Form.Label>ปีการศึกษา/ภาคเรียน</Form.Label>
                <Form.Control
                  as="select"
                  onChange={(e) => setActivityYear(e.target.value)}
                >
                  <option value="">-- เลือก --</option>
                  <option value="2566/1">2566/1 </option>
                  <option value="2566/2">2566/2</option>
                  <option value="2565/1">2565/1</option>
                  <option value="2565/2">2565/2</option>
                  <option value="2565/summer">2565/summer</option>
                </Form.Control>
              </Form.Group>
            </Form>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginTop: 30,
            }}
          >
            {teacherForm.length > 0 && (
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
                        style={{ width: 500 }}
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

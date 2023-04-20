import React, { useState, useEffect } from "react";
import { CalendarMonth, HighlightOffRounded } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
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
import "./student_form.css";
import Swal from "sweetalert2";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import th from "date-fns/locale/th";
import format from "date-fns/format";
registerLocale("th", th);

const Student_Form = () => {
  const [activityName, setActivityName] = useState("");
  const [activityYear, setActivityYear] = useState("");
  const [activityType, setActivityType] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [formattedDate, setFormattedDate] = useState("");
  const [activityTarget, setActivityTarget] = useState([]);
  const [otherTarget, setOtherTarget] = useState("");
  const [showOtherTarget, setShowOtherTarget] = useState(false);
  const [activityPosition, setActivityPosition] = useState("");
  const [activityPictures, setActivityPictures] = useState([]);
  const [activityDocument, setActivityDocument] = useState("");
  const [activityHours, setActivityHours] = useState("");
  const [teacherForm, setTeacherForm] = useState([]);
  const [studentForm, setStudentForm] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const [errors, setErrors] = useState({});

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

  const handleFormSubmit = () => {
    const errors = validateForm();
    setErrors(errors);
    if (Object.keys(errors).length === 0) {
      const formData = new FormData();
      const formattedDate = format(activityDate, "yyyy-MM-dd");
      formData.append("activity_name", activityName);
      formData.append("activity_year", activityYear);
      formData.append("activity_date", formattedDate);
      formData.append("activity_hours", activityHours);
      formData.append("activity_type", activityType);
      formData.append("activity_target", [...activityTarget, otherTarget]);
      formData.append("activity_position", activityPosition);
      formData.append("activity_document", activityDocument);
      formData.append("student_id", user_id);
      formData.append("student_name", fullname);
      formData.append("fac_name", fac_name);
      formData.append("maj_name", maj_name);


      // Append each file to the formData
      activityPictures.forEach((file) => {
        formData.append("activity_pictures", file);
      });

      fetch("http://localhost:3333/student_form", {
        method: "POST",
        body: formData,
      })
        .then((response) => {
          if (response.ok) {
            console.log("Form submitted successfully!");
            Swal.fire({
              icon: "success",
              title: "เพิ่มข้อมูลสำเร็จ",
              showConfirmButton: false,
              timer: 1500,
              customClass: {
                title: "thai-font",
              },
            });
            navigate(-1);
          } else {
            console.error("Error submitting form");
            Swal.fire({
              icon: "error",
              text: "กรุณากรอกข้อมูลให้ถูกต้อง",
            });
          }
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      console.error("Error submitting form");
      Swal.fire({
        icon: "error",
        text: "กรุณากรอกข้อมูลให้ถูกต้อง",
      });
    }
  };

  const activityTypeCheck = "กิจกรรมจิตอาสาเข้าร่วมด้วยตนเอง";
  const matchingForms = studentForm.filter(
    (item) =>
      item.activity_type === activityTypeCheck &&
      item.activity_year === activityYear
  );
  const totalHours = matchingForms.reduce(
    (sum, item) => sum + item.activity_hours,
    0
  );

  let activityTypeText = activityTypeCheck;
  let activityTypeColor = "black";

  if (totalHours >= 6) {
    activityTypeText = (
      <span style={{ color: "red" }}>{activityTypeCheck}</span>
    );
    activityTypeColor = "red";
  }

  const handleFormSubmitModal = () => {
    const errors = validateFormModal();
    setErrors(errors);
    if (Object.keys(errors).length === 0) {
      const formData = new FormData();
      // const formattedDate = format(activityDate, "yyyy-MM-dd");
      formData.append("activity_name", selectedActivity.activity_name);
      formData.append("activity_date", selectedActivity.activity_date);
      formData.append("last_date", selectedActivity.last_date);
      formData.append("t_id", selectedActivity.t_id);
      formData.append("activity_year", activityYear);
      formData.append("activity_hours", activityHours);
      formData.append("activity_type", activityType);
      formData.append("activity_position", activityPosition);
      formData.append("student_id", user_id);
      formData.append("student_name", fullname);
      formData.append("fac_name", fac_name);
      formData.append("maj_name", maj_name);
      // Append each file to the formData
      activityPictures.forEach((file) => {
        formData.append("activity_pictures", file);
      });

      fetch("http://localhost:3333/student_form_inside", {
        method: "POST",
        body: formData,
      })
        .then((response) => {
          if (response.ok) {
            console.log("Form submitted successfully!");
            Swal.fire({
              icon: "success",
              title: "เพิ่มข้อมูลสำเร็จ",
              showConfirmButton: false,
              timer: 1500,
              customClass: {
                title: "thai-font",
              },
            });
            setSelectedActivity(null);
            setActivityPosition("");
            setActivityHours("");
            setActivityPictures([]);
          } else {
            console.error("Error submitting form");
            Swal.fire({
              icon: "error",
              text: "กรุณากรอกข้อมูลให้ถูกต้อง",
            });
          }
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      console.error("Error submitting form");
      Swal.fire({
        icon: "error",
        text: "กรุณากรอกข้อมูลให้ถูกต้อง",
      });
    }
  };

  useEffect(() => {
    fetch(`http://localhost:3333/student_form?student_id=${user_id}`)
      .then((response) => response.json())
      .then((data) => {
        setStudentForm(data);
      })
      .catch((error) => console.error(error));
  }, []);

  const handleShowModal = (activity) => {
    setSelectedActivity(activity);
    setShowModal(true);
  };

  const validateForm = () => {
    let errors = {};
    if (!activityYear) {
      errors.activityYear = "กรุณาเลือกปีการศึกษา/ภาคเรียน";
    }
    if (!activityType) {
      errors.activityType = "กรุณาเลือกประเภทกิจกรรม";
    }
    if (!activityName) {
      errors.activityName = "กรุณากรอกชื่อกิจกรรม";
    }
    if (!activityDate) {
      errors.activityDate = "กรุณาเลือกวันที่จัดกิจกรรม";
    }
    if (activityTarget.length === 0 && !showOtherTarget) {
      errors.activityTarget = "กรุณาเลือกกลุ่มเป้าหมายกิจกรรม";
    } else if (showOtherTarget && !otherTarget) {
      errors.activityTarget = "โปรดระบุกลุ่มเป้าหมายของกิจกรรม";
    }
    if (!activityPosition) {
      errors.activityPosition = "กรุณากรอกรายละเอียดของกิจกรรม";
    }
    if (!activityHours) {
      errors.activityHours = "กรุณากรอกจำนวนชั่วโมงที่ทำกิจกรรม";
    }
    if (!activityPictures || activityPictures.length < 2) {
      errors.activityPictures = "กรุณาเพิ่มรูปภาพกิจกรรม 2 รูปภาพ";
    }
    if (!activityDocument || activityDocument.length === 0) {
      errors.activityDocument = "กรุณาเพิ่มเอกสารการยืนยัน";
    }

    return errors;
  };

  const validateFormModal = () => {
    let errors = {};
    if (!activityPosition) {
      errors.activityPosition = "กรุณากรอกรายละเอียดของกิจกรรม";
    }
    if (!activityHours) {
      errors.activityHours = "กรุณากรอกจำนวนชั่วโมงที่ทำกิจกรรม";
    }
    if (!activityPictures || activityPictures.length < 2) {
      errors.activityPictures = "กรุณาเพิ่มรูปภาพกิจกรรม 2 รูปภาพ";
    }
    return errors;
  };

  useEffect(() => {
    // Make a GET request to retrieve the data from the server
    fetch(
      `http://localhost:3333/teacher_form_display?activity_year=${activityYear}`
    )
      .then((response) => response.json())
      .then((data) => {
        setTeacherForm(data);
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

  const handleDateChange = (e) => {
    setActivityDate(e);
    const date = new Date(e);
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    };
    const formattedDate = date.toLocaleDateString("th-TH", options);
    setFormattedDate(formattedDate);
  };

  const handleDeletePicture = (event, index) => {
    event.preventDefault();
    const newImages = [...activityPictures];
    newImages.splice(index, 1);
    setActivityPictures(newImages);
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
          </Container>
        </Navbar>
      </div>{" "}
      <h1
        style={{
          textAlign: "center",
          marginTop: 10,
          fontSize: 40,
          fontWeight: "bold",
        }}
        className="thai-font"
      >
        เพิ่มข้อมูลกิจกรรม
      </h1>
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
              value={activityYear}
              onChange={(e) => setActivityYear(e.target.value)}
            >
              <option value="">-- เลือก --</option>
              <option value="2566/1">2566/1 </option>
              <option value="2566/2">2566/2</option>
              <option value="2565/1">2565/1</option>
              <option value="2565/2">2565/2</option>
              <option value="2565/summer">2565/summer</option>
            </Form.Control>
            {errors.activityYear && (
              <div className="text-danger">{errors.activityYear}</div>
            )}
          </Form.Group>

          <Form.Group controlId="activityType" className="form-group">
            <Form.Label>เลือกประเภทกิจกรรม</Form.Label>
            <Form.Control
              as="select"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
            >
              <option value="">-- เลือก --</option>
              <option value="กิจกรรมโดยคณะวิชา ศูนย์ สำนัก">
                กิจกรรมโดยคณะวิชา ศูนย์ สำนัก
              </option>
              <option
                value={activityTypeCheck}
                style={{ color: activityTypeColor }}
              >
                {activityTypeText}
              </option>
              <option value="กิจกรรมการบริจาคโลหิต">
                กิจกรรมการบริจาคโลหิต
              </option>
              <option value="กิจกรรมอบรมออนไลน์จิตสาธารณะ กยศ.">
                กิจกรรมอบรมออนไลน์จิตสาธารณะ กยศ.
              </option>
            </Form.Control>
            {errors.activityType && (
              <div className="text-danger">{errors.activityType}</div>
            )}
          </Form.Group>

          {activityType === "กิจกรรมจิตอาสาเข้าร่วมด้วยตนเอง" && (
            <>
              {totalHours >= 6 ? (
                <div style={{ color: "red" }} className="form-group">
                  คุณได้ทำ{activityTypeCheck} เต็ม 6 ชั่วโมงในภาคเรียนนี้แล้ว
                  ไม่สามารถเพิ่มข้อมูลได้
                </div>
              ) : (
                <Form>
                  <Form.Group controlId="activityTarget" className="form-group">
                    <Form.Label>ชื่อกิจกรรม</Form.Label>
                    <Form.Control
                      type="text"
                      value={activityName}
                      onChange={(e) => setActivityName(e.target.value)}
                    />
                    {errors.activityName && (
                      <div className="text-danger">{errors.activityName}</div>
                    )}
                  </Form.Group>

                  <Form.Group controlId="activityDate" className="form-group">
                    <Form.Label>
                      วันที่จัดกิจกรรม:{" "}
                      <span style={{ color: "green", fontWeight: "bold" }}>
                        {formattedDate}
                      </span>
                    </Form.Label>
                    <label className="date-picker">
                      <DatePicker
                        selected={activityDate}
                        onChange={handleDateChange}
                        dateFormat="dd/MM/yyyy"
                        locale="th"
                        className="form-control"
                      />
                      <CalendarMonth className="calendar-icon" />
                    </label>

                    {errors.activityDate && (
                      <div className="text-danger">{errors.activityDate}</div>
                    )}
                  </Form.Group>

                  <Form.Group controlId="activityTarget" className="form-group">
                    <Form.Label>กลุ่มเป้าหมายของกิจกรรม</Form.Label>
                    {[
                      "กลุ่มนักเรียน/นักศึกษา",
                      "ผู้สูงวัย",
                      "ชุมชน",
                      "วัด",
                      "สาธารณประโยชน์",
                      "สถานที่ราชการ",
                      "มหาวิทยาลัย",
                    ].map((target) => (
                      <div key={target}>
                        <Form.Check
                          type="checkbox"
                          label={target}
                          checked={activityTarget.includes(target)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setActivityTarget([...activityTarget, target]);
                            } else {
                              setActivityTarget(
                                activityTarget.filter((t) => t !== target)
                              );
                            }
                          }}
                        />
                      </div>
                    ))}
                    <div>
                      <Form.Check
                        type="checkbox"
                        label="อื่นๆ... (โปรดระบุ)"
                        checked={showOtherTarget}
                        onChange={(e) => {
                          setShowOtherTarget(e.target.checked);
                        }}
                      />
                      {showOtherTarget && (
                        <div>
                          <Form.Control
                            type="text"
                            value={otherTarget}
                            onChange={(e) => setOtherTarget(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                    {errors.activityTarget && (
                      <div className="text-danger">{errors.activityTarget}</div>
                    )}
                  </Form.Group>

                  <Form.Group
                    controlId="activityPosition"
                    className="form-group"
                  >
                    <Form.Label>
                      กรอกรายละเอียดลักษณะกิจกรรมตำแหน่งหน้าที่ที่ได้รับหมอบหมาย
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={activityPosition}
                      onChange={(e) => setActivityPosition(e.target.value)}
                    />
                    {errors.activityPosition && (
                      <div className="text-danger">
                        {errors.activityPosition}
                      </div>
                    )}
                  </Form.Group>

                  <Form.Group controlId="activity_hours" className="form-group">
                    <Form.Label>จำนวนชั่วโมงที่ทำกิจกรรม</Form.Label>
                    <Form.Control
                      as="select"
                      value={activityHours}
                      onChange={(e) => setActivityHours(e.target.value)}
                    >
                      <option value="">-- เลือก --</option>
                      <option value="1">1 ชั่วโมง </option>
                      <option value="2">2 ชั่วโมง</option>
                      <option value="3">3 ชั่วโมง</option>
                      <option value="4">4 ชั่วโมง</option>
                      <option value="5">5 ชั่วโมง</option>
                      <option value="6">6 ชั่วโมง</option>
                    </Form.Control>
                    {errors.activityHours && (
                      <div className="text-danger">{errors.activityHours}</div>
                    )}
                  </Form.Group>

                  <Form.Group
                    controlId="activityPicture"
                    className="form-group"
                  >
                    <Form.Label>รูปภาพกิจกรรมจำนวน 2 ภาพ</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      multiple
                      name="activity_pictures" // add this line
                      onChange={(e) =>
                        setActivityPictures([
                          ...activityPictures,
                          ...e.target.files,
                        ])
                      }
                    />
                    <div>
                      {activityPictures.map((file, index) => (
                        <div
                          key={index}
                          style={{
                            position: "relative",
                            display: "inline-block",
                          }}
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            style={{
                              width: 120,
                              height: 120,
                              marginTop: 10,
                              padding: 10,
                            }}
                          />
                          <button
                            onClick={(event) =>
                              handleDeletePicture(event, index)
                            }
                            style={{
                              position: "absolute",
                              marginTop: 10,
                              top: 0,
                              right: 0,
                              padding: "1px 3px",
                              borderRadius: "50%",
                              background: "red",
                              color: "white",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            X
                          </button>
                        </div>
                      ))}
                    </div>
                    {errors.activityPictures && (
                      <div className="text-danger">
                        {errors.activityPictures}
                      </div>
                    )}
                  </Form.Group>

                  <Form.Group
                    controlId="activityDocument"
                    className="form-group"
                  >
                    <Form.Label>เอกสารยืนยันการทำกิจกรรม (.pdf)</Form.Label>
                    <Form.Control
                      type="file"
                      accept="application/pdf"
                      name="activity_document"
                      onChange={(e) => setActivityDocument(e.target.files[0])}
                    />
                    {errors.activityDocument && (
                      <div className="text-danger">
                        {errors.activityDocument}
                      </div>
                    )}
                  </Form.Group>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Button
                      onClick={() => handleFormSubmit()}
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
                      เพิ่มข้อมูลกิจกรรม
                    </Button>
                  </div>
                </Form>
              )}
            </>
          )}
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
        {" "}
        {activityType === "กิจกรรมโดยคณะวิชา ศูนย์ สำนัก" && (
          <>
            {teacherForm.length > 0 && (
              <ListGroup>
                <Row className="justify-content-center">
                  {teacherForm.map((activity, index) => (
                    <Card
                      key={activity.t_id}
                      className="activity-card thai-font"
                      style={{ fontSize: 20, height: 550 }}
                    >
                      <Card.Img
                        variant="top"
                        src={
                          activity.activity_picture
                            ? `data:image/png;base64,${activity.activity_picture}`
                            : "https://upload.wikimedia.org/wikipedia/th/c/c4/%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%A7%E0%B8%B4%E0%B8%97%E0%B8%A2%E0%B8%B2%E0%B8%A5%E0%B8%B1%E0%B8%A2%E0%B8%A7%E0%B8%87%E0%B8%A9%E0%B9%8C%E0%B8%8A%E0%B8%A7%E0%B8%A5%E0%B8%B4%E0%B8%95%E0%B8%81%E0%B8%B8%E0%B8%A5.png"
                        }
                        className="card-img-top"
                      />

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
                        <strong>สถานที่จัดกิจกรรม:</strong>{" "}
                        {activity.activity_place}
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <strong>ผู้ดูแลกิจกรรม:</strong> {activity.teacher_name}
                      </ListGroup.Item>
                      <ListGroup.Item className="text-center">
                        <button
                          className="btn btn-warning"
                          onClick={() => handleShowModal(activity)}
                          style={{
                            fontSize: 20,
                            color: "black",
                            fontWeight: "bold",
                          }}
                        >
                          เข้าร่วมกิจกรรม
                        </button>
                      </ListGroup.Item>
                    </Card>
                  ))}
                </Row>
              </ListGroup>
            )}
          </>
        )}
        <Modal
          show={selectedActivity !== null}
          onHide={() => {
            setSelectedActivity(null);
            setActivityPosition("");
            setActivityHours("");
            setActivityPictures([]);
          }}
          className="thai-font"
        >
          <div style={{ position: "relative" }}>
            <button
              className="btn btn-light"
              style={{ position: "absolute", top: 0, right: 0, fontSize: 20 }}
              onClick={() => {
                setSelectedActivity(null);
                setActivityPosition("");
                setActivityHours("");
                setActivityPictures([]);
              }}
            >
              <HighlightOffRounded style={{ color: "red" }} />
            </button>
            <img
              src={
                selectedActivity?.activity_picture
                  ? `data:image/png;base64,${selectedActivity?.activity_picture}`
                  : "https://upload.wikimedia.org/wikipedia/th/c/c4/%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%A7%E0%B8%B4%E0%B8%97%E0%B8%A2%E0%B8%B2%E0%B8%A5%E0%B8%B1%E0%B8%A2%E0%B8%A7%E0%B8%87%E0%B8%A9%E0%B9%8C%E0%B8%8A%E0%B8%A7%E0%B8%A5%E0%B8%B4%E0%B8%95%E0%B8%81%E0%B8%B8%E0%B8%A5.png"
              }
              className="img-fluid"
              alt="Activity"
            />
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
                { year: "numeric", month: "short", day: "numeric" }
              )}
            </p>
            <p>
              <strong>สถานที่จัดกิจกรรม:</strong>{" "}
              {selectedActivity?.activity_place}
            </p>
            <p>
              <strong>ผู้ดูแลกิจกรรม:</strong> {selectedActivity?.teacher_name}
            </p>
            <Form>
              <Form.Group controlId="activityPosition" className="form-group">
                <Form.Label>
                  กรอกรายละเอียดลักษณะกิจกรรมตำแหน่งหน้าที่ที่ได้รับหมอบหมาย
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={activityPosition}
                  onChange={(e) => setActivityPosition(e.target.value)}
                />
                {errors.activityPosition && (
                  <div className="text-danger">{errors.activityPosition}</div>
                )}
              </Form.Group>

              <Form.Group controlId="activityHours" className="form-group">
                <Form.Label>จำนวนชั่วโมงที่ทำกิจกรรม</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="number"
                    placeholder="กรอกจำนวนชั่วโมง"
                    step="1"
                    min="0"
                    value={activityHours}
                    onChange={(e) => setActivityHours(e.target.value)}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </InputGroup>
                {errors.activityHours && (
                  <div className="text-danger">{errors.activityHours}</div>
                )}
              </Form.Group>

              <Form.Group controlId="activityPicture" className="form-group">
                <Form.Label>รูปภาพกิจกรรมกิจกรรม</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  multiple
                  name="activity_pictures" // add this line
                  onChange={(e) =>
                    setActivityPictures([
                      ...activityPictures,
                      ...e.target.files,
                    ])
                  }
                />
                <div>
                  {activityPictures &&
                    activityPictures.map((file, index) => (
                      <div
                        key={index}
                        style={{
                          position: "relative",
                          display: "inline-block",
                        }}
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          style={{
                            width: 120,
                            height: 120,
                            marginTop: 10,
                            padding: 10,
                          }}
                        />
                        <button
                          onClick={(event) => handleDeletePicture(event, index)}
                          style={{
                            position: "absolute",
                            marginTop: 10,
                            top: 0,
                            right: 0,
                            padding: "1px 3px",
                            borderRadius: "50%",
                            background: "red",
                            color: "white",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          X
                        </button>
                      </div>
                    ))}
                </div>
                {errors.activityPictures && (
                  <div className="text-danger">{errors.activityPictures}</div>
                )}
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="success"
              style={{ fontSize: 18 }}
              onClick={() => handleFormSubmitModal()}
            >
              เพิ่มข้อมูลกิจกรรม
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedActivity(null);
                setActivityPosition("");
                setActivityHours("");
                setActivityPictures([]);
              }}
              style={{ fontSize: 18 }}
            >
              ปิด
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default Student_Form;

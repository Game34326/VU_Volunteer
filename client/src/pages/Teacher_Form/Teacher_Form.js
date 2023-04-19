import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { Form, Button, Navbar, Container } from "react-bootstrap";
import "./teacher_form.css";
import Swal from "sweetalert2";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import th from "date-fns/locale/th";
import format from "date-fns/format";
registerLocale("th", th);

const Teacher_Form = () => {
  const [activityYear, setActivityYear] = useState("");
  const [activityName, setActivityName] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [lastDate, setLastDate] = useState("");
  const [activityPlace, setActivityPlace] = useState("");
  const [activityPicture, setActivityPicture] = useState(null);
  const [formattedDate, setFormattedDate] = useState("");
  const [formattedLastDate, setFormattedLastDate] = useState("");

  const [errors, setErrors] = useState({});

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

  const handleDeletePicture = (index) => {
    setActivityPicture(null);
  };

  const validateForm = () => {
    let errors = {};
    if (!activityYear) {
      errors.activityYear = "กรุณาเลือกปีการศึกษา/ภาคเรียน";
    }
    if (!activityName) {
      errors.activityName = "กรุณากรอกชื่อกิจกรรม";
    }
    if (!activityDate) {
      errors.activityDate = "กรุณาเลือกวันที่จัดกิจกรรม";
    }
    if (!lastDate) {
      errors.lastDate = "กรุณาเลือกวันที่สิ้นสุดกิจกรรม";
    }
    if (!activityPlace) {
      errors.activityPlace = "กรุณากรอกสถานที่ที่จัดกิจกรรม";
    }
    return errors;
  };

  const handleFormSubmit = () => {
    const errors = validateForm();
    setErrors(errors);
    if (Object.keys(errors).length === 0) {
      const formData = new FormData();
      const formattedDate = format(activityDate, "yyyy-MM-dd");
      const formattedLastDate = format(lastDate, "yyyy-MM-dd");
      formData.append("activity_name", activityName);
      formData.append("activity_year", activityYear);
      formData.append("activity_date", formattedDate);
      formData.append("last_date", formattedLastDate);
      formData.append("teacher_id", user_id);
      formData.append("teacher_name", fullname);
      formData.append("activity_picture", activityPicture);
      formData.append("activity_place", activityPlace);


      fetch("http://localhost:3333/teacher_form", {
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

  const handleLastDateChange = (e) => {
    setLastDate(e);
    const date = new Date(e);
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    };
    const formattedLastDate = date.toLocaleDateString("th-TH", options);
    setFormattedLastDate(formattedLastDate);
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
      <h2
        style={{
          textAlign: "center",
          marginTop: 10,
          fontSize: 40,
          fontWeight: "bold",
        }}
        className="thai-font"
      >
        เพิ่มข้อมูลกิจกรรมที่จัดขึ้นโดยคณะวิชา ศูนย์ สำนักของมหาวิทยาลัย
      </h2>
      {/* <p className="nameText thai-font" style={{ fontSize: 25 }}>
        รหัสบุคลากร:{" "}
        <span style={{ color: "green", fontWeight: "bold" }}>{user_id}</span>
      </p>
      <p className="nameText thai-font" style={{ fontSize: 25 }}>
        ชื่อ-นามสกุล:{" "}
        <span style={{ color: "green", fontWeight: "bold" }}>{fullname}</span>
      </p> */}
      <div className="form-wrapper">
        <Form className="form_container thai-font">
          <Form.Group controlId="activityName" className="form-group">
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

          <Form.Group controlId="activity" className="form-group">
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
              <CalendarMonthIcon className="calendar-icon" />
            </label>
            {errors.activityDate && (
              <div className="text-danger">{errors.activityDate}</div>
            )}
          </Form.Group>

          <Form.Group controlId="activityLastDate" className="form-group">
            <Form.Label>
              วันสิ้นสุดกิจกรรม:{" "}
              <span style={{ color: "green", fontWeight: "bold" }}>
                {formattedLastDate}
              </span>
            </Form.Label>
            <label className="date-picker">
              <DatePicker
                selected={lastDate}
                onChange={handleLastDateChange}
                dateFormat="dd/MM/yyyy"
                locale="th"
                className="form-control"
              />
              <CalendarMonthIcon className="calendar-icon" />
            </label>
            {errors.lastDate && (
              <div className="text-danger">{errors.lastDate}</div>
            )}
          </Form.Group>

          <Form.Group controlId="activityPlace" className="form-group">
            <Form.Label>สถานที่จัดกิจกรรม</Form.Label>
            <Form.Control
              type="text"
              value={activityPlace}
              onChange={(e) => setActivityPlace(e.target.value)}
            />
            {errors.activityPlace && (
              <div className="text-danger">{errors.activityPlace}</div>
            )}
          </Form.Group>

          <Form.Group controlId="activityPicture" className="form-group">
            <Form.Label>รูปภาพกิจกรรม</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              name="activity_picture"
              onChange={(e) => setActivityPicture(e.target.files[0])}
            />

            <div>
              {activityPicture && (
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img
                    src={URL.createObjectURL(activityPicture)}
                    alt={activityPicture.name}
                    style={{
                      width: 120,
                      height: 120,
                      marginTop: 10,
                      padding: 10,
                    }}
                  />
                  <button
                    onClick={() => handleDeletePicture()}
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
              )}
            </div>
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
      </div>
    </div>
  );
};

export default Teacher_Form;

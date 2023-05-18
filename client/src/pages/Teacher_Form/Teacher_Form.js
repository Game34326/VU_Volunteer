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
import Loader from "../../components/Loader";
registerLocale("th", th);

const Teacher_Form = () => {
  const [activityYear, setActivityYear] = useState("");
  const [activityName, setActivityName] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [lastDate, setLastDate] = useState("");
  const [activityPlace, setActivityPlace] = useState("");
  const [activityPictures, setActivityPictures] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [activityStyle, setActivityStyle] = useState("");
  const [formattedDate, setFormattedDate] = useState("");
  const [formattedLastDate, setFormattedLastDate] = useState("");
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({});

  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const ciphertext = decodeURIComponent(params.get("q"));
  const bytes = CryptoJS.AES.decrypt(ciphertext, "secret key 123");
  const plaintext = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  const [user_id] = useState(plaintext.user_id);
  const [fullname] = useState(plaintext.fullname);
  const [department] = useState(plaintext.department);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
  }, []);

  const handleDeletePicture = (event, index) => {
    event.preventDefault();
    const newImages = [...activityPictures];
    newImages.splice(index, 1);
    setActivityPictures(newImages);
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
    if (!selectedDepartment) {
      errors.selectedDepartment = "กรุณาเลือกคณะ ศูนย์  สำนัก";
    }
    if (!activityStyle) {
      errors.activityStyle = "กรุณากรอกลักษณะกิจกรรม";
    }
    return errors;
  };

  const handleFormSubmit = () => {
    const errors = validateForm();
    setErrors(errors);
    if (Object.keys(errors).length === 0) {
      setLoading(true);
      const formData = new FormData();
      const formattedDate = format(activityDate, "yyyy-MM-dd");
      const formattedLastDate = format(lastDate, "yyyy-MM-dd");
      formData.append("activity_name", activityName);
      formData.append("activity_year", activityYear);
      formData.append("activity_date", formattedDate);
      formData.append("last_date", formattedLastDate);
      formData.append("teacher_id", user_id);
      formData.append("teacher_name", fullname);
      formData.append("activity_place", activityPlace);
      formData.append("activity_style", activityStyle);


      activityPictures.forEach((file) => {
        formData.append("activity_pictures", file);
      });

      const [depId, depName] = selectedDepartment.split(",");
      const departmentData = { dep_id: depId, dep_name: depName };
      const departmentJSON = JSON.stringify(departmentData);
      formData.append("department", departmentJSON);

      fetch("http://localhost:3333/teacher_form", {
        method: "POST",
        body: formData,
      })
        .then((response) => {
          if (response.ok) {
            setLoading(false);
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
            setLoading(false);
            console.error("Error submitting form");
            Swal.fire({
              icon: "error",
              text: "กรุณากรอกข้อมูลให้ถูกต้อง",
            });
          }
        })
        .catch((error) => {
          setLoading(false);
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
              <span
                className="thai-font"
                style={{ fontWeight: "bold", color: "black" }}
              >
                VU Volunteer Teacher
              </span>
            </Navbar.Brand>
          </Container>
        </Navbar>
      </div>{" "}
      <h2
        style={{
          textAlign: "center",
          marginTop: 80,
          fontSize: 30,
          fontWeight: "bold",
        }}
        className="thai-font"
      >
        เพิ่มข้อมูลกิจกรรมที่จัดขึ้นโดยคณะวิชา ศูนย์ สำนักของมหาวิทยาลัย
      </h2>
      <div className="form-wrapper">
        <Form className="form_container thai-font">
          <Form.Group controlId="activityName" className="form-group">
            <Form.Label>
              ชื่อกิจกรรม <span style={{ color: "red" }}>*</span>{" "}
            </Form.Label>
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
            <Form.Label>
              ปีการศึกษา/ภาคเรียน <span style={{ color: "red" }}>*</span>
            </Form.Label>
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

          <Form.Group controlId="department" className="form-group">
            <Form.Label>
              กิจกรรมจัดขึ้นโดย <span style={{ color: "red" }}>*</span>
            </Form.Label>
            <Form.Control
              as="select"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="">-- เลือก --</option>
              {department.map((dep) => (
                <option
                  value={`${dep.Fac_ID},${dep.Fac_NameTH}`}
                  key={dep.Fac_ID}
                >
                  {dep.Fac_NameTH}
                </option>
              ))}
            </Form.Control>
            {errors.selectedDepartment && (
              <div className="text-danger">{errors.selectedDepartment}</div>
            )}
          </Form.Group>

          <Form.Group controlId="activityDate" className="form-group">
            <Form.Label>
              วันที่จัดกิจกรรม: <span style={{ color: "red" }}>*</span>{" "}
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
              วันสิ้นสุดกิจกรรม: <span style={{ color: "red" }}>*</span>{" "}
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
            <Form.Label>
              สถานที่จัดกิจกรรม <span style={{ color: "red" }}>*</span>
            </Form.Label>
            <Form.Control
              type="text"
              value={activityPlace}
              onChange={(e) => setActivityPlace(e.target.value)}
            />
            {errors.activityPlace && (
              <div className="text-danger">{errors.activityPlace}</div>
            )}
          </Form.Group>

          <Form.Group controlId="activityStyle" className="form-group">
            <Form.Label>
              ลักษณะกิจกรรม <span style={{ color: "red" }}>*</span>
            </Form.Label>
            <Form.Control
              type="text"
              value={activityStyle}
              onChange={(e) => setActivityStyle(e.target.value)}
            />
            {errors.activityStyle && (
              <div className="text-danger">{errors.activityStyle}</div>
            )}
          </Form.Group>


          <Form.Group controlId="activityPicture" className="form-group">
            <Form.Label>รูปภาพกิจกรรม</Form.Label>
            <p style={{fontSize: 18, color: 'gray'}} >หมายเหตุ: ภาพบรรยากาศของกิจกรรม</p>
            <Form.Control
              type="file"
              accept="image/*"
              multiple
              name="activity_pictures" // add this line
              onChange={(e) =>
                setActivityPictures([...activityPictures, ...e.target.files])
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
      {loading && (
        <div>
          <Loader className="thai-font" />
        </div>
      )}
    </div>
  );
};

export default Teacher_Form;

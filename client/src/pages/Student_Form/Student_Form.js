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
import SwiperCore, { Pagination, Navigation } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/swiper-bundle.css";
import "swiper/css/navigation";
import Swal from "sweetalert2";
import TimePicker from "rc-time-picker";
import "rc-time-picker/assets/index.css";
import moment from "moment";
import "moment/locale/th";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import th from "date-fns/locale/th";
import { format } from "date-fns";
import Loader from "../../components/Loader";
registerLocale("th", th);
SwiperCore.use([Pagination, Navigation]);
moment.locale("th");

const Student_Form = () => {
  const [activityName, setActivityName] = useState("");
  const [activityYear, setActivityYear] = useState("");
  const [activityType, setActivityType] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [formattedDate, setFormattedDate] = useState("");
  const [activityTarget, setActivityTarget] = useState([]);
  const [activityPosition, setActivityPosition] = useState("");
  const [activityPictures, setActivityPictures] = useState([]);
  const [activityDocument, setActivityDocument] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [activityHours, setActivityHours] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]);
  const [teacherForm, setTeacherForm] = useState([]);
  const [studentForm, setStudentForm] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [checkInside, setCheckInside] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activityTimes, setActivityTimes] = useState([]);

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
      setLoading(true);
      const formData = new FormData();
      const formattedDate = format(activityDate, "yyyy-MM-dd");
      const formattedStartTime = moment(startTime).format("HH:mm");
      const formattedEndTime = moment(endTime).format("HH:mm");
      formData.append("activity_name", activityName);
      formData.append("activity_year", activityYear);
      formData.append("activity_date", formattedDate);
      formData.append("activity_hours", activityHours);
      formData.append("activity_type", activityType);
      formData.append("activity_target", [...activityTarget]);
      formData.append("activity_position", activityPosition);
      formData.append("activity_document", activityDocument);
      formData.append("student_id", user_id);
      formData.append("student_name", fullname);
      formData.append("fac_name", fac_name);
      formData.append("maj_name", maj_name);
      formData.append("start_time", formattedStartTime);
      formData.append("end_time", formattedEndTime);

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
          console.error(error);
        });
    } else {
      setLoading(false);
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
      setLoading(true);
      const formData = new FormData();
      // const formattedDate = format(activityDate, "yyyy-MM-dd");
      formData.append("activity_name", selectedActivity.activity_name);
      formData.append("activity_date", selectedActivity.activity_date);
      formData.append("last_date", selectedActivity.last_date);
      formData.append("t_id", selectedActivity.t_id);
      formData.append("activity_year", activityYear);
      formData.append("activity_hours", totalHoursAll);
      formData.append("activity_type", activityType);
      formData.append("activity_position", activityPosition);
      formData.append("student_id", user_id);
      formData.append("student_name", fullname);
      formData.append("fac_name", fac_name);
      formData.append("maj_name", maj_name);

      const timePeriodJSON = JSON.stringify(data);
      formData.append("activity_time_period", timePeriodJSON);

      // Append each file the formData
      activityPictures.forEach((file) => {
        formData.append("activity_pictures", file);
      });

      fetch("http://localhost:3333/student_form_inside", {
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
            setSelectedActivity(null);
            setActivityPosition("");
            setActivityHours("");
            setActivityPictures([]);
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
          console.error(error);
        });
    } else {
      setLoading(false);
      console.error("Error submitting form");
      Swal.fire({
        icon: "error",
        text: "กรุณากรอกข้อมูลให้ถูกต้อง",
      });
    }
  };

  const handleFormBlood = () => {
    const errors = validateBlood();
    setErrors(errors);
    if (Object.keys(errors).length === 0) {
      setLoading(true);
      const formData = new FormData();
      formData.append("activity_year", activityYear);
      formData.append("activity_type", activityType);
      formData.append("student_id", user_id);
      formData.append("student_name", fullname);
      formData.append("fac_name", fac_name);
      formData.append("maj_name", maj_name);
      formData.append("activity_hours", 6);

      // Append each file the formData
      activityPictures.forEach((file) => {
        formData.append("activity_pictures", file);
      });

      fetch("http://localhost:3333/student_form_blood", {
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
          console.error(error);
        });
    } else {
      setLoading(false);
      console.error("Error submitting form");
      Swal.fire({
        icon: "error",
        text: "กรุณากรอกข้อมูลให้ถูกต้อง",
      });
    }
  };

  const handleFormOnline = () => {
    const errors = validateFormOnline();
    setErrors(errors);
    if (Object.keys(errors).length === 0) {
      setLoading(true);
      const formData = new FormData();
      const formattedDate = format(activityDate, "yyyy-MM-dd");
      const formattedStartTime = moment(startTime).format("HH:mm");
      const formattedEndTime = moment(endTime).format("HH:mm");
      formData.append("activity_name", activityName);
      formData.append("activity_year", activityYear);
      formData.append("activity_date", formattedDate);
      formData.append("activity_hours", activityHours);
      formData.append("activity_type", activityType);
      formData.append("activity_document", activityDocument);
      formData.append("student_id", user_id);
      formData.append("student_name", fullname);
      formData.append("fac_name", fac_name);
      formData.append("maj_name", maj_name);
      formData.append("start_time", formattedStartTime);
      formData.append("end_time", formattedEndTime);

      fetch("http://localhost:3333/student_form_online", {
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
          console.error(error);
        });
    } else {
      setLoading(false);
      console.error("Error submitting form");
      Swal.fire({
        icon: "error",
        text: "กรุณากรอกข้อมูลให้ถูกต้อง",
      });
    }
  };

  useEffect(() => {
    fetch(`http://localhost:3333/student_form_hours?student_id=${user_id}`)
      .then((response) => response.json())
      .then((data) => {
        setStudentForm(data);
      })
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    fetch(`http://localhost:3333/student_form_check?student_id=${user_id}`)
      .then((response) => response.json())
      .then((data) => {
        setCheckInside(data);
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
    if (activityTarget.length === 0) {
      errors.activityTarget = "กรุณาเลือกกลุ่มเป้าหมายของกิจกรรม";
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

  const validateFormOnline = () => {
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
    if (!activityHours) {
      errors.activityHours = "กรุณากรอกจำนวนชั่วโมงที่ทำกิจกรรม";
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
    if (!activityPictures || activityPictures.length < 2) {
      errors.activityPictures = "กรุณาเพิ่มรูปภาพกิจกรรม 2 รูปภาพ";
    }
    if(!totalHoursAll){
      errors.totalHoursAll = "กรุณากรอกจำนวนชั่วโมง";
    }
    return errors;
  };

  const validateBlood = () => {
    let errors = {};
    if (!activityPictures || activityPictures.length < 3) {
      errors.activityPictures = "กรุณาเพิ่มรูปภาพกิจกรรม 3 รูปภาพ";
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

  function isBlocked(activity) {
    return checkInside.findIndex((obj) => obj.t_id === activity.t_id) === -1;
  }

  const handleTimeChange = (time, type) => {
    if (type === "start") {
      setStartTime(time);
    } else {
      setEndTime(time);
    }

    if (startTime && endTime) {
      const diff = moment(endTime).diff(moment(startTime), "hours");
      if (diff > 6) {
        setActivityHours(6);
      } else {
        setActivityHours(diff);
      }
    } else {
      setActivityHours(null);
    }
  };

  const handleDateTimeChange = (time, field, index) => {
    const newActivityTimes = [...activityTimes];
    newActivityTimes[index] = {
      ...newActivityTimes[index],
      [field]: time.format("HH:mm"),
    };
    setActivityTimes(newActivityTimes);
  };

  function calculateHours(start, end) {
    const diff = moment(end, "HH:mm:ss").diff(moment(start, "HH:mm:ss"));
    const duration = moment.duration(diff);
    const hours = duration.asHours();
  
    // Limit hours to 6 per day
    if (hours > 6) {
      return 6;
    }
  
    return Math.floor(hours); // round down to nearest integer
  }
  

  useEffect(() => {
    if (startTime && endTime) {
      const diff = moment(endTime).diff(moment(startTime), "hours");
      if (diff > 6) {
        setActivityHours(6);
      } else {
        setActivityHours(diff);
      }
    } else {
      setActivityHours(null);
    }
  }, [startTime, endTime]);

  const data = (() => {
    const startDate = moment(selectedActivity?.activity_date);
    const endDate = moment(selectedActivity?.last_date);
    const diffDays = endDate.diff(startDate, "days") + 1;
    const dates = [];
    for (let i = 0; i < diffDays; i++) {
      const date = moment(startDate).add(i, "days").add(543, "years").format("D MMMM YYYY");
      const times = activityTimes[i] || { start_time: null, end_time: null };
      const hours = calculateHours(times.start_time, times.end_time);
      const isChecked = times.start_time !== null;
      if (isChecked) {
        dates.push({
          activityDate: {
            date: date,
            startTime: times.start_time,
            endTime: times.end_time,
            hoursPerDay: hours,
          },
        });
      }
      console.log(date)
    }
    return dates;
  })();

  const totalHoursAll = data.reduce((acc, curr) => {
    return acc + curr.activityDate.hoursPerDay;
  }, 0);

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
                VU Volunteer Student
              </span>
            </Navbar.Brand>
          </Container>
        </Navbar>
      </div>{" "}
      <h1
        style={{
          textAlign: "center",
          marginTop: 80,
          fontSize: 35,
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
            <Form.Label>
              ปีการศึกษา/ภาคเรียน <span style={{ color: "red" }}>*</span>{" "}
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

          <Form.Group controlId="activityType" className="form-group">
            <Form.Label>
              ประเภทกิจกรรม <span style={{ color: "red" }}>*</span>{" "}
            </Form.Label>
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
                  คุณได้ทำ{activityTypeCheck}ครบ 6 ชั่วโมงในภาคเรียนนี้แล้ว
                  ไม่สามารถเพิ่มข้อมูลได้
                </div>
              ) : (
                <Form>
                  <Form.Group controlId="activityTarget" className="form-group">
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
                      <CalendarMonth className="calendar-icon" />
                    </label>

                    {errors.activityDate && (
                      <div className="text-danger">{errors.activityDate}</div>
                    )}
                  </Form.Group>
                  <Form.Group controlId="activityTarget" className="form-group">
                    <Form.Label>
                      กลุ่มเป้าหมายของกิจกรรม{" "}
                      <span style={{ color: "red" }}>*</span>
                    </Form.Label>
                    {[
                      "กลุ่มนักเรียน/นักศึกษา",
                      "ผู้สูงวัย",
                      "ชุมชน",
                      "สาธารณประโยชน์",
                      "สถานที่ราชการ",
                    ].map((target) => (
                      <div key={target}>
                        <Form.Check
                          style={{ fontSize: 22 }}
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
                    {errors.activityTarget && (
                      <div className="text-danger">{errors.activityTarget}</div>
                    )}
                  </Form.Group>
                  <Form.Group
                    controlId="activityPosition"
                    className="form-group"
                  >
                    <Form.Label>
                      ตำแหน่งหน้าที่ที่ได้รับมอบหมายและปฏิบัติ{" "}
                      <span style={{ color: "red" }}>*</span>
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
                  <div className="form-group" style={{ fontWeight: "bold" }}>
                    จำนวนชั่วโมงที่ทำกิจกรรม:{" "}
                    {activityHours && (
                      <span style={{ color: "green" }}>
                        {activityHours > 6 ? 6 : activityHours} ชั่วโมง
                      </span>
                    )}{" "}
                  </div>
                  <p
                    style={{
                      color: "gray",
                      fontSize: 18,
                      fontWeight: "normal",
                      marginLeft: 10,
                    }}
                  >
                    หมายเหตุ:
                    จำนวนชั่วโมงในกิจกรรมจิตอาสาที่เข้าร่วมด้วยตนเองจะต้องไม่เกิน
                    6 ชั่วโมงต่อภาคการศึกษา
                  </p>{" "}
                  <Form.Group
                    style={{ marginLeft: 25, fontSize: 22 }}
                    controlId="activity_hours"
                    className="form-group"
                  >
                    เวลาเริ่มทำกิจกรรม <span style={{ color: "red" }}>*</span>
                    <TimePicker
                      showSecond={false}
                      defaultValue={null}
                      minuteStep={5}
                      onChange={(time) => handleTimeChange(time, "start")}
                      style={{ fontFamily: "sans-serif" }}
                    />
                  </Form.Group>
                  <Form.Group
                    style={{ marginLeft: 25, fontSize: 22 }}
                    controlId="activity_hours"
                    className="form-group"
                  >
                    เวลาสิ้นสุดกิจกรรม <span style={{ color: "red" }}>*</span>
                    <TimePicker
                      showSecond={false}
                      defaultValue={null}
                      minuteStep={5}
                      onChange={(time) => handleTimeChange(time, "end")}
                      style={{ fontFamily: "sans-serif" }}
                    />
                  </Form.Group>
                  {errors.activityHours && (
                    <div className="text-danger form-group">
                      {errors.activityHours}
                    </div>
                  )}
                  <Form.Group
                    controlId="activityPicture"
                    className="form-group"
                  >
                    <div style={{ pointerEvents: "none" }}>
                      <Form.Label>
                        รูปภาพกิจกรรมจำนวน 2 ภาพ{" "}
                        <span style={{ color: "red" }}>*</span>{" "}
                        <p
                          style={{
                            color: "gray",
                            fontSize: 18,
                            fontWeight: "normal",
                          }}
                        >
                          หมายเหตุ:
                          รูปภาพกิจกรรมจะต้องเห็นใบหน้าของนักศึกษาขณะทำกิจกรรมอย่างชัดเจน
                        </p>{" "}
                      </Form.Label>
                    </div>

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
                    <div style={{ pointerEvents: "none" }}>
                      <Form.Label>
                        เอกสารยืนยันการทำกิจกรรม (.pdf){" "}
                        <span style={{ color: "red" }}>*</span>
                      </Form.Label>
                    </div>

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
          <div className="thai-font">
            {activityType === "กิจกรรมการบริจาคโลหิต" && (
              <Form>
                <Form.Group controlId="activityPicture" className="form-group">
                  <div style={{ pointerEvents: "none" }}>
                    <Form.Label>
                      รูปภาพกิจกรรมจำนวน 3 ภาพ{" "}
                      <span style={{ color: "red" }}>*</span>{" "}
                      <p
                        style={{
                          color: "gray",
                          fontSize: 18,
                          fontWeight: "normal",
                        }}
                      >
                        หมายเหตุ:
                        รูปภาพกิจกรรมจะต้องเห็นใบหน้าของนักศึกษาขณะทำกิจกรรมอย่างชัดเจน
                        และภาพถ่ายของบัตรบริจาคโลหิต (หน้า-หลัง)
                      </p>{" "}
                    </Form.Label>
                  </div>

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

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Button
                    onClick={() => handleFormBlood()}
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

            <div className="thai-font">
              {activityType === "กิจกรรมอบรมออนไลน์จิตสาธารณะ กยศ." && (
                <Form>
                  <Form.Group controlId="activityTarget" className="form-group">
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
                      <CalendarMonth className="calendar-icon" />
                    </label>

                    {errors.activityDate && (
                      <div className="text-danger">{errors.activityDate}</div>
                    )}
                  </Form.Group>
                  <div className="form-group" style={{ fontWeight: "bold" }}>
                    จำนวนชั่วโมงที่ทำกิจกรรม:{" "}
                    {activityHours && (
                      <span style={{ color: "green" }}>
                        {activityHours > 6 ? 6 : activityHours} ชั่วโมง
                      </span>
                    )}{" "}
                  </div>
                  <p
                    style={{
                      color: "gray",
                      fontSize: 18,
                      fontWeight: "normal",
                      marginLeft: 10,
                    }}
                  >
                    หมายเหตุ: จำนวนชั่วโมงในกิจกรรมอบรมออนไลน์จิตสาธารณะ กยศ.
                    จะต้องไม่เกิน 6 ชั่วโมงต่อภาคการศึกษา
                  </p>{" "}
                  <Form.Group
                    style={{ marginLeft: 25, fontSize: 20 }}
                    controlId="activity_hours"
                    className="form-group"
                  >
                    เวลาเริ่มทำกิจกรรม <span style={{ color: "red" }}>*</span>
                    <TimePicker
                      showSecond={false}
                      defaultValue={null}
                      onChange={(time) => handleTimeChange(time, "start")}
                      style={{ fontFamily: "sans-serif" }}
                    />
                  </Form.Group>
                  <Form.Group
                    style={{ marginLeft: 25, fontSize: 20 }}
                    controlId="activity_hours"
                    className="form-group"
                  >
                    เวลาสิ้นสุดกิจกรรม <span style={{ color: "red" }}>*</span>
                    <TimePicker
                      showSecond={false}
                      defaultValue={null}
                      onChange={(time) => handleTimeChange(time, "end")}
                      style={{ fontFamily: "sans-serif" }}
                    />
                  </Form.Group>
                  {errors.activityHours && (
                    <div className="text-danger form-group">
                      {errors.activityHours}
                    </div>
                  )}
                  <Form.Group
                    controlId="activityDocument"
                    className="form-group"
                  >
                    <div style={{ pointerEvents: "none" }}>
                      <Form.Label>
                        ใบเกียรติบัตรการเข้าร่วมอบรมออนไลน์ (.pdf){" "}
                        <span style={{ color: "red" }}>*</span>
                      </Form.Label>
                    </div>

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
                      onClick={() => handleFormOnline()}
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
            </div>
          </div>
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
            {teacherForm.length > 0 ? (
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
                        {activity?.department &&
                          JSON.parse(activity?.department).dep_name}
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
                          disabled={isBlocked(activity)}
                        >
                          {isBlocked(activity)
                            ? "เข้าร่วมกิจกรรมแล้ว"
                            : "เข้าร่วมกิจกรรม"}
                        </button>
                      </ListGroup.Item>
                    </Card>
                  ))}
                </Row>
              </ListGroup>
            ) : (
              <div style={{ color: "red" }} className="form-group thai-font">
                ยังไม่มีข้อมูลกิจกรรมที่จัดขึ้นโดยคณะวิชา ศูนย์ สำนัก
                ในปีการศึกษานี้
              </div>
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
            setSelectedDates([]);
          }}
          className="thai-font"
          style={{ fontSize: 20 }}
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
                { year: "numeric", month: "long", day: "numeric" }
              )}
            </p>
            <p>
              <strong>วันที่สิ้นสุดกิจกรรม:</strong>{" "}
              {new Date(selectedActivity?.last_date).toLocaleDateString(
                "th-TH",
                { year: "numeric", month: "long", day: "numeric" }
              )}
            </p>

            <p>
              <strong>สถานที่จัดกิจกรรม:</strong>{" "}
              {selectedActivity?.activity_place}
            </p>
            <p>
              <strong>ลักษณะกิจกรรม:</strong> {selectedActivity?.activity_style}
            </p>
            <p>
              <strong>ผู้ดูแลกิจกรรม:</strong> {selectedActivity?.teacher_name}
            </p>
            <p>
              <strong>กิจกรรมจัดขึ้นโดย:</strong>{" "}
              {selectedActivity?.department &&
                JSON.parse(selectedActivity?.department).dep_name}{" "}
            </p>
            <hr />

            <Form>
              <Form.Group controlId="activityPosition" className="form-group">
                <Form.Label>
                  กรอกตำแหน่งหน้าที่ที่ได้รับมอบหมายและปฏิบัติ
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

              <Form.Group
                controlId="activitySelectedDate"
                className="form-group"
              >
                <p>
                  <strong>วันที่ปฏิบัติกิจกรรม:</strong>{" "}
                  {(() => {
                    const startDate = moment(selectedActivity?.activity_date);
                    const endDate = moment(selectedActivity?.last_date);
                    const diffDays = endDate.diff(startDate, "days") + 1;
                    const dates = [];
                    for (let i = 0; i < diffDays; i++) {
                      const date =
                        moment(startDate).add(i, "days").format("D MMMM") +
                        (moment(startDate).add(i, "days").year() + 543);
                      dates.push(date);
                    }
                    return dates.map((date, index) => {
                      const isChecked = selectedDates.includes(date);
                      const times = activityTimes[index] || {
                        start_time: null,
                        end_time: null,
                      };
                      const hours = calculateHours(
                        times.start_time,
                        times.end_time
                      );

                      return (
                        <div key={index}>
                          <input
                            style={{ marginLeft: 10, cursor: "pointer" }}
                            type="checkbox"
                            id={`date-${index}`}
                            name={`date-${index}`}
                            value={date}
                            checked={isChecked}
                            onChange={(event) => {
                              const isChecked = event.target.checked;
                              if (isChecked) {
                                setSelectedDates([...selectedDates, date]);
                                setActivityTimes([
                                  ...activityTimes,
                                  { start_time: null, end_time: null },
                                ]);
                              } else {
                                setSelectedDates(
                                  selectedDates.filter((d) => d !== date)
                                );
                                setActivityTimes(
                                  activityTimes.filter((t, i) => i !== index)
                                );
                              }
                            }}
                          />
                          <label
                            style={{ marginLeft: 10 }}
                            htmlFor={`date-${index}`}
                          >
                            {date}
                            {": "}
                            {times && times.start_time && times.end_time && (
                              <span style={{ color: "green" }}>
                                จำนวนชั่วโมง: {hours}
                              </span>
                            )}
                          </label>
                          {isChecked && (
                            <div style={{ marginLeft: 25 }}>
                              <div>
                                เวลาเริ่มทำกิจกรรม{" "}
                                <span style={{ color: "red" }}>*</span>
                              </div>
                              <TimePicker
                                showSecond={false}
                                minuteStep={10}
                                defaultValue={times.start_time}
                                onChange={(time) =>
                                  handleDateTimeChange(
                                    time,
                                    "start_time",
                                    index
                                  )
                                }
                                style={{ fontFamily: "sans-serif" }}
                              />
                              <div>
                                เวลาสิ้นสุดกิจกรรม{" "}
                                <span style={{ color: "red" }}>*</span>
                              </div>
                              <TimePicker
                                showSecond={false}
                                minuteStep={10}
                                defaultValue={times.end_time}
                                onChange={(time) =>
                                  handleDateTimeChange(time, "end_time", index)
                                }
                                style={{ fontFamily: "sans-serif" }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </p>
                {errors.totalHoursAll && (
                  <div className="text-danger">{errors.totalHoursAll}</div>
                )}
              </Form.Group>

              <Form.Group controlId="activityHours" className="form-group">
                <Form.Label>จำนวนชั่วโมงทั้งหมดที่ทำกิจกรรมนี้</Form.Label>
                <InputGroup>
                  <Form.Control
                  disabled
                    type="number"
                    placeholder="กรอกจำนวนชั่วโมง"
                    step="1"
                    min="0"
                    value={totalHoursAll}
                  />
                </InputGroup>
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
                setSelectedDates([]);
              }}
              style={{ fontSize: 18 }}
            >
              ปิด
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
      {loading && <Loader className="thai-font" />}
    </div>
  );
};

export default Student_Form;

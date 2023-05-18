import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
import {
  Button,
  Table,
  Navbar,
  Container,
  Modal,
  Form,
  Image,
  Card,
  Row,
} from "react-bootstrap";
import SwiperCore, { Pagination, Navigation } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/swiper-bundle.css";
import "swiper/css/navigation";
import "./teacher_dashboard.css";
import Swal from "sweetalert2";
import { Search, ArrowBack } from "@mui/icons-material";
import { TextField, InputAdornment, IconButton } from "@mui/material";
import { CalendarMonth, HighlightOffRounded } from "@mui/icons-material";
import DatePicker, { registerLocale } from "react-datepicker";
import { tstrcmp } from "thai-alphabet-sort";
import "react-datepicker/dist/react-datepicker.css";
import th from "date-fns/locale/th";
import format from "date-fns/format";
import Loader from "../../components/Loader";
registerLocale("th", th);
SwiperCore.use([Pagination, Navigation]);

const Teacher_Dashboard = ({ s_id }) => {
  const [teacherForm, setTeacherForm] = useState([]);
  const [studentForm, setStudentForm] = useState([]);
  const [editForm, setEditForm] = useState([]);
  const [modalType, setModalType] = useState(null);
  const [activityPictures, setActivityPictures] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentImage, setStudentImage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [activityYear, setActivityYear] = useState("");
  const [activityName, setActivityName] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [lastDate, setLastDate] = useState("");
  const [activityPlace, setActivityPlace] = useState("");
  const [activityStyle, setActivityStyle] = useState("");
  const [activityPicture, setActivityPicture] = useState(null);
  const [selectedImage, setSelectedImage] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [formattedDate, setFormattedDate] = useState("");
  const [formattedLastDate, setFormattedLastDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedStudentTotalHours, setSelectedStudentTotalHours] =
    useState(null);
  const [displayImage, setDisplayImage] = useState(null);

  const [errors, setErrors] = useState({});
  const [refresh, setRefresh] = useState(false);
  const [sortedStudentForm, setSortedStudentForm] = useState([]);
  const [sortKey, setSortKey] = useState("");
  const [isAscending, setIsAscending] = useState(true);
  const [sorted, setSorted] = useState(false);
  const [sortDirection, setSortDirection] = useState({
    student_id: "asc",
    student_name: "asc",
    check_inside: "asc",
  });
  const [isSorting, setIsSorting] = useState(false);

  const [showCheckEditModal, setShowCheckEditModal] = useState(false);
  const [editValue, setEditValue] = useState("");

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

  useEffect(() => {
    // Make a GET request to retrieve the data from the server
    fetch(`http://localhost:3333/teacher_form?teacher_id=${user_id}`)
      .then((response) => response.json())
      .then((data) => {
        setTeacherForm(data);
      })
      .catch((error) => console.error(error));
  }, [refresh]);

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
    return errors;
  };

  const handleFormUpdate = (edit) => {
    setLoading(true);
    const formData = new FormData();
    const formattedDate = activityDate
      ? format(activityDate, "yyyy-MM-dd")
      : null;
    const formattedLastDate = lastDate ? format(lastDate, "yyyy-MM-dd") : null;
    formData.append(
      "activity_name",
      edit ? activityName || edit?.activity_name : activityName
    );
    formData.append(
      "activity_year",
      edit ? activityYear || edit?.activity_year : activityYear
    );
    formData.append(
      "activity_date",
      edit ? formattedDate || edit?.activity_date : formattedDate
    );
    formData.append(
      "last_date",
      edit ? formattedLastDate || edit?.last_date : formattedLastDate
    );
    formData.append(
      "activity_place",
      edit ? activityPlace || edit?.activity_place : activityPlace
    );
    formData.append(
      "activity_style",
      edit ? activityStyle || edit?.activity_style : activityStyle
    );

    if (selectedImage && selectedImage.length > 0) {
      selectedImage.forEach((file) => {
        formData.append("activity_pictures", file);
      });
    } else if (!selectedImage && edit && edit.activity_picture) {
      formData.append("activity_pictures", edit.activity_picture);
    }

    const [depId, depName] = selectedDepartment.split(",");
    const departmentData = {
      dep_id: depId || JSON.parse(edit.department).dep_id,
      dep_name: depName || JSON.parse(edit.department).dep_name,
    };
    const departmentJSON = JSON.stringify(departmentData);
    formData.append("department", departmentJSON);

    fetch(`http://localhost:3333/teacher_form_edit?t_id=${edit?.t_id}`, {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (response.ok) {
          setLoading(false);
          handleHideModal();
          setRefresh(!refresh);
          response.json().then((data) => {
            setTeacherForm((prevTeacherForm) => [...prevTeacherForm, data]);
          });
          console.log("Form submitted successfully!");
          Swal.fire({
            icon: "success",
            title: "แก้ไขข้อมูลสำเร็จ",
            showConfirmButton: false,
            timer: 1500,
            customClass: {
              title: "thai-font",
            },
          });
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
  };

  const updateConfirm = (edit) => {
    Swal.fire({
      title: "ยืนยันการแก้ไข",
      text: "การแก้ไขจะถูกส่งไปยังผู้อนุมัติ",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่",
      cancelButtonText: "ไม่",
      customClass: {
        className: "thai-font",
        title: "thai-font",
        popup: "thai-font",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        // User clicked the "Yes" button
        handleFormUpdate(edit);
      } else {
        // User clicked the "No" button
        // Do nothing or handle the cancel action
      }
    });
  };

  const handleDateChange = (e) => {
    setActivityDate(e);
    const date = new Date(e);
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    const formattedDate = date.toLocaleDateString("th-TH", options);
    setFormattedDate(formattedDate);
  };

  const handleLastDateChange = (e) => {
    setLastDate(e);
    const date = new Date(e);
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    const formattedLastDate = date.toLocaleDateString("th-TH", options);
    setFormattedLastDate(formattedLastDate);
  };

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

  const handleShowModal = async (activity) => {
    setSelectedActivity(activity);
    setModalType("activity");
    setShowModal(true);
    try {
      const response = await fetch(
        `http://localhost:3333/student_form_display?t_id=${activity.t_id}`
      );
      const data = await response.json();
      const sortedData = [...data].sort((a, b) =>
        tstrcmp(a.student_name, b.student_name)
      );
      setSortedStudentForm(sortedData);
      setStudentForm(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleViewStudentInfo = async (student) => {
    setModalType("student");

    try {
      const [imageResponse, activityResponse, totalHoursResponse] =
        await Promise.all([
          fetch(
            `http://appz.vu.ac.th:8989/VuAPIVer1/select_student_image.php?stuid=${student.student_id}`
          ),
          fetch(`http://localhost:3333/activity_pictures/${student.s_id}`),
          fetch(
            `http://localhost:3333/student_total_hours?student_id=${student.student_id}`
          ),
        ]);

      if (!imageResponse.ok) {
        throw new Error(
          `Failed to fetch student image: ${imageResponse.status}`
        );
      }

      const { Per_Picture } = await imageResponse.json();
      const dataUri = `data:image/png;base64,${Per_Picture}`;

      setSelectedStudent(student);
      console.log(selectedStudent);
      setStudentImage(dataUri);

      if (!activityResponse.ok) {
        throw new Error(
          `Failed to fetch activity pictures: ${activityResponse.status}`
        );
      }

      const activityData = await activityResponse.json();

      if (activityData.length > 0) {
        const pictureArray = activityData.map(
          (pictureData) => `data:image/png;base64,${pictureData}`
        );
        setActivityPictures(pictureArray);
      } else {
        setActivityPictures([]);
      }

      if (!totalHoursResponse.ok) {
        throw new Error(
          `Failed to fetch total activity hours: ${totalHoursResponse.status}`
        );
      }

      const json = await totalHoursResponse.json();
      const total_hours = Number(json[0].total_hours);
      setSelectedStudentTotalHours(total_hours);
    } catch (error) {
      console.error(error);
      setStudentImage(null);
      setActivityPictures([]);
      setSelectedStudentTotalHours(null);
    }
  };

  const handleShowEditModal = async (teacherForm) => {
    try {
      const [editResponse, pictureResponse] = await Promise.all([
        fetch(
          `http://localhost:3333/teacher_form_edit?t_id=${teacherForm.t_id}`
        ),
        fetch(`http://localhost:3333/teacher_pictures/${teacherForm.t_id}`),
      ]);

      const editData = await editResponse.json();
      const pictureData = await pictureResponse.json();

      setEditForm(editData);
      setShowEditModal(true);

      if (pictureData.length > 0) {
        const pictureArray = pictureData
          .map((pictureData) => {
            if (pictureData) {
              return `data:image/png;base64,${pictureData}`;
            } else {
              return null;
            }
          })
          .filter((picture) => picture !== null);
        setActivityPictures(pictureArray);
      } else {
        setActivityPictures([]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleHideModal = () => {
    setShowEditModal(null);
    setSelectedImage("");
    setActivityPicture(null);
    setSelectedImage([]);
    setActivityName("");
    setActivityYear("");
    setActivityDate("");
    setLastDate("");
    setFormattedDate("");
    setFormattedLastDate("");
  };

  const handleSort = (key) => {
    if (isSorting) {
      return;
    }
    setIsSorting(true);
    const sortedForm = [...studentForm];
    let newSortDirection = sortDirection[key] === "asc" ? "desc" : "asc";
    sortedForm.sort((a, b) => {
      if (key === "student_id") {
        return a.student_id.localeCompare(b.student_id);
      } else if (key === "student_name") {
        return a.student_name.localeCompare(b.student_name);
      } else if (key === "check_inside") {
        const statusOrder = ["รอการตรวจสอบ", "ผ่าน", "รอการแก้ไข"];
        const aStatus = a.check_inside;
        const bStatus = b.check_inside;
        if (aStatus === null && bStatus === null) {
          return 0;
        } else if (aStatus === null) {
          return -1;
        } else if (bStatus === null) {
          return 1;
        } else if (aStatus === "รอการแก้ไข" && bStatus !== "รอการแก้ไข") {
          return -1;
        } else if (aStatus !== "รอการแก้ไข" && bStatus === "รอการแก้ไข") {
          return 1;
        } else {
          const aStatusIndex = statusOrder.indexOf(aStatus);
          const bStatusIndex = statusOrder.indexOf(bStatus);
          if (aStatusIndex < bStatusIndex) {
            return -1;
          } else if (aStatusIndex > bStatusIndex) {
            return 1;
          } else {
            return 0;
          }
        }
      } else {
        return 0;
      }
    });
    setSortKey(key);
    setIsAscending(newSortDirection === "asc");
    setSortedStudentForm(
      newSortDirection === "asc" ? sortedForm : sortedForm.reverse()
    );
    setSorted(true);
    setSortDirection({ ...sortDirection, [key]: newSortDirection });
    setIsSorting(false);
  };

  const handleImageClick = (picture) => {
    setDisplayImage(picture);
  };

  const handleCloseImage = () => {
    setDisplayImage(null);
  };

  async function handleButtonClick(status, student_id) {
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
          check_inside: status,
        };

        fetch("http://localhost:3333/check-student-inside", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_id, status }),
        }).then((response) => {
          if (response.ok) {
            setSelectedStudent(updatedActivity);
            setStudentForm((prevState) =>
              prevState.map((activity) =>
                activity.student_id === selectedStudent.student_id
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
    }
  }

  function handleCheckEdit() {
    const updatedActivity = {
      ...selectedStudent,
      check_inside: editValue,
    };

    fetch("http://localhost:3333/check-student-inside", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: selectedStudent.student_id,
        check_inside: editValue,
        status: "แก้ไข",
      }),
    }).then((response) => {
      setSelectedStudent(updatedActivity);
      setStudentForm((prevState) =>
        prevState.map((activity) =>
          activity.student_id === selectedStudent.student_id
            ? updatedActivity
            : activity
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
          text: "ระบบไม่สามารถบันทึกเหตุผลแก้ไขได้",
        });
      }
    });
  }

  const handleDeletePicture = (event, index) => {
    event.preventDefault();
    const newImages = [...selectedImage];
    newImages.splice(index, 1);
    setSelectedImage(newImages);
  };

  return (
    <>
      <div>
        <div className="navbar-parent-container">
          <Navbar
            expand="lg"
            variant="light"
            fluid="true"
            className="navbar nav-text"
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
        <h1 className="thai-font header-text" style={{ fontSize: 30 }}>
          ระบบเพิ่มข้อมูลกิจกรรมจิตอาสาที่จัดขึ้นโดยคณะวิชา ศูนย์
          สำนักของมหาวิทยาลัย
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
        <div className="table-header">
          <Table striped bordered hover style={{ maxWidth: "100%" }}>
            <thead className="thai-font" style={{ fontSize: 20 }}>
              <tr>
                <th>#</th>
                <th>ชื่อกิจกรรม</th>
                <th>ภาคเรียน</th>
                <th>วันที่จัดกิจกรรม</th>
                <th>วันที่สิ้นสุดกิจกรรม</th>
                <th>สถานที่จัดกิจกรรม</th>
                <th>จำนวนผู้เข้าร่วม</th>
                <th>รอการตรวจสอบ</th>
                <th>ตรวจสอบผ่าน</th>
                <th>รอการแก้ไข</th>
                <th>สถานะ</th>
                <th>{""}</th>
                <th>{""}</th>
              </tr>
            </thead>
            <tbody
              className="thai-font"
              style={{
                justifyContent: "center",
                alignItems: "center",
                fontSize: 20,
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
                    {new Date(teacherForm.last_date).toLocaleDateString(
                      "th-TH",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </td>{" "}
                  <td>{teacherForm.activity_place}</td>
                  <td>{teacherForm.participant_count} คน</td>
                  <td style={{ color: "blue" }}>
                    {teacherForm.pending_count} คน
                  </td>
                  <td style={{ color: "green" }}>
                    {" "}
                    {teacherForm.passed_count} คน
                  </td>
                  <td style={{ color: "orange" }}>
                    {" "}
                    {teacherForm.revised_count} คน
                  </td>
                  <td>
                    {teacherForm.check_activity === null ? (
                      <span style={{ color: "black" }}>รอการอนุมัติ</span>
                    ) : teacherForm.check_activity === "ผ่าน" ? (
                      <span style={{ color: "green" }}>ผ่าน</span>
                    ) : (
                      <span style={{ color: "orange" }}>แก้ไข</span>
                    )}
                  </td>
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
                      onClick={() => handleShowEditModal(teacherForm)}
                      style={{ padding: 1, paddingInline: 10, fontSize: 20 }}
                    >
                      แก้ไข
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        {selectedActivity && (
          <Modal
            show={modalType === "activity"}
            onHide={() => {
              setModalType(null);
              setSelectedActivity(null);
            }}
            className="thai-font"
            style={{ fontSize: 22, zIndex: 10000 }}
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
                  size="small"
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
                    <th
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        flex: 1,
                      }}
                      onClick={() => handleSort("student_id")}
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
                          {sortDirection["student_id"] === "asc" ? "↑" : "↓"}
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
                        onClick={() => handleSort("student_name")}
                      >
                        ชื่อ-นามสกุล&nbsp;
                        <div style={{ marginLeft: 3, fontSize: 18 }}>
                          {sortDirection["student_name"] === "asc" ? "↑" : "↓"}
                        </div>
                      </div>
                    </th>
                    <th>คณะ</th>
                    <th
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        flex: 1,
                      }}
                      onClick={() => handleSort("check_inside")}
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
                          {sortDirection["check_inside"] === "asc" ? "↑" : "↓"}
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStudentForm
                    .filter(
                      (student) =>
                        student.student_id.includes(searchQuery) ||
                        student.student_name.includes(searchQuery)
                    )
                    .map((student) => (
                      <tr key={student.student_id}>
                        <td>{student.student_id}</td>
                        <td>{student.student_name}</td>
                        <td>{student.fac_name}</td>
                        <td>
                          {student.check_inside === null ? (
                            <span style={{ color: "black" }}>รอการตรวจสอบ</span>
                          ) : student.check_inside === "ผ่าน" ? (
                            <span style={{ color: "green" }}>ผ่าน</span>
                          ) : (
                            <span style={{ color: "orange" }}>รอการแก้ไข</span>
                          )}{" "}
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
            size="lg"
          >
            <Modal.Header style={{ borderBottom: "none" }}>
              <IconButton
                onClick={() => {
                  setModalType("activity");
                }}
              >
                <ArrowBack />
              </IconButton>
            </Modal.Header>
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
                      <strong>จำนวนชั่วโมงกิจกรรมทั้งหมด:</strong>{" "}
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
                  flexDirection: "row",
                  justifyContent: "flex-start",
                }}
              >
                <div>
                  <Modal.Title style={{ fontWeight: "bold", marginBottom: 10, color: '#F57D05' }}>
                    ข้อมูลกิจกรรม
                  </Modal.Title>
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
                        month: "long",
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
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    marginLeft: 20,
                    borderLeft: "1px solid #ccc",
                    paddingLeft: 20,
                  }}
                >
                  <Modal.Title
                    style={{
                      fontWeight: "bold",
                      marginBottom: 10,
                      color: '#19A703',
                    }}
                  >
                    ข้อมูลการเข้าร่วมกิจกรรมของนักศึกษา
                  </Modal.Title>
                  <p>
                    <strong>ตำแหน่งหน้าที่ที่ได้รับมอบหมายและปฏิบัติ:</strong>{" "}
                    {selectedStudent.activity_position}
                  </p>
                  <p>
                    <strong>จำนวนชั่วโมงทั้งหมดที่ทำกิจกรรมนี้:</strong>{" "}
                    {selectedStudent.activity_hours} ชั่วโมง
                  </p>
                  <p>
                    <strong>วันที่ปฏิบัติกิจกรรม:</strong>
                    {selectedStudent.activity_time_period &&
                      JSON.parse(selectedStudent.activity_time_period).map(
                        (item, index) => (
                          <p key={index} style={{ marginLeft: 20 }}>
                            {" "}
                            {item.activityDate.date} เวลาที่ทำกิจกรรม:{" "}
                            {item.activityDate.startTime} น. -{" "}
                            {item.activityDate.endTime} น. จำนวนชั่วโมง:{" "}
                            {item.activityDate.hoursPerDay}
                          </p>
                        )
                      )}
                  </p>
                </div>
              </div>

              <strong>รูปภาพกิจกรรมกิจกรรม</strong>
              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  flexWrap: "wrap",
                  marginTop: 20,
                }}
              >
                {activityPictures.map((picture, index) => (
                  <img
                    key={index}
                    src={picture}
                    alt="activity picture"
                    style={{
                      width: 200,
                      height: 200,
                      borderRadius: 10,
                      cursor: "pointer",
                    }}
                    onClick={() => handleImageClick(picture)}
                  />
                ))}
              </div>
              <p style={{ marginTop: 20 }}>
                <strong
                  style={{
                    color: "red",
                    display:
                      !selectedStudent?.check_inside ||
                      selectedStudent?.check_inside === "ผ่าน"
                        ? "none"
                        : "inline",
                  }}
                >
                  เหตุผลที่ต้องแก้ไข:
                </strong>{" "}
                {selectedStudent?.check_inside === "ผ่าน"
                  ? null
                  : selectedStudent?.check_inside}
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
                    handleButtonClick("ผ่าน", selectedStudent.student_id)
                  }
                >
                  ผ่าน
                </Button>
                <Button
                  variant="warning"
                  style={{ fontSize: 20, marginRight: 20, width: 80 }}
                  onClick={() =>
                    handleButtonClick("แก้ไข", selectedStudent.student_id)
                  }
                >
                  แก้ไข
                </Button>
                <Button
                  variant="secondary"
                  style={{ fontSize: 20, marginRight: 20, width: 80 }}
                  onClick={() => {
                    setModalType("activity");
                  }}
                >
                  ย้อนกลับ
                </Button>
              </div>
            </Modal.Footer>
          </Modal>
        )}
        {editForm &&
          editForm.map((edit) => (
            <Modal
              show={showEditModal}
              onHide={() => handleHideModal()}
              className="thai-font"
              style={{ fontSize: 20, zIndex: 10000 }}
            >
              <div style={{ position: "relative" }}>
                <div>
                  {activityPictures.length > 0 ? (
                    <Swiper
                      navigation={true}
                      pagination={{ clickable: true }}
                      paginationStyle={{ marginBottom: 20 }}
                    >
                      {activityPictures.map((pictureData, index) => (
                        <SwiperSlide key={index}>
                          <img
                            src={pictureData}
                            className="img-fluid"
                            alt={`Activity ${index}`}
                            style={{
                              width: 500,
                              display: "block",
                              margin: "auto",
                            }}
                          />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  ) : (
                    <img
                      src="https://upload.wikimedia.org/wikipedia/th/c/c4/%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%A7%E0%B8%B4%E0%B8%97%E0%B8%A2%E0%B8%B2%E0%B8%A5%E0%B8%B1%E0%B8%A2%E0%B8%A7%E0%B8%87%E0%B8%A9%E0%B9%8C%E0%B8%8A%E0%B8%A7%E0%B8%A5%E0%B8%B4%E0%B8%95%E0%B8%81%E0%B8%B8%E0%B8%A5.png"
                      className="img-fluid"
                      alt={`Default Image`}
                      style={{
                        width: 500,
                        display: "block",
                        margin: "auto",
                      }}
                    />
                  )}
                </div>

                <label
                  className="btn btn-secondary"
                  style={{ fontSize: 20, display: "block", margin: "auto" }}
                >
                  เลือกรูปภาพ
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    multiple
                    name="activity_pictures"
                    onChange={(e) => {
                      setSelectedImage([...selectedImage, ...e.target.files]);
                    }}
                  />
                </label>
                <div>
                  {selectedImage &&
                    selectedImage.map((file, index) => (
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
              </div>

              <Modal.Title
                style={{ fontWeight: "bold", marginTop: 10, marginLeft: 10 }}
              ></Modal.Title>
              <hr />
              <Modal.Body>
                <Form.Group controlId="activityName">
                  <Form.Label>ชื่อกิจกรรม:</Form.Label>
                  <Form.Control
                    type="text"
                    defaultValue={edit?.activity_name}
                    onChange={(e) => setActivityName(e.target.value)}
                  />
                </Form.Group>
                <Form.Group controlId="activityYear">
                  <Form.Label>ปีการศึกษา/ภาคเรียน:</Form.Label>
                  <Form.Control
                    as="select"
                    defaultValue={edit?.activity_year}
                    onChange={(e) => setActivityYear(e.target.value)}
                  >
                    <option value="2566/1">2566/1</option>
                    <option value="2566/2">2566/2</option>
                    <option value="2565/1">2565/1</option>
                    <option value="2565/2">2565/2</option>
                    <option value="2565/summer">2565/summer</option>
                  </Form.Control>
                </Form.Group>
                <Form.Group controlId="activityDate">
                  <Form.Label>
                    วันที่จัดกิจกรรม:{" "}
                    <span style={{ color: "green", fontWeight: "normal" }}>
                      {formattedDate ||
                        new Date(edit?.activity_date).toLocaleDateString(
                          "th-TH",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                    </span>
                  </Form.Label>
                  <label className="date-picker">
                    <DatePicker
                      selected={
                        activityDate
                          ? new Date(activityDate)
                          : new Date(edit?.activity_date)
                      }
                      onChange={handleDateChange}
                      dateFormat="dd/MM/yyyy"
                      locale="th"
                      className="form-control"
                    />
                    <CalendarMonth className="calendar-icon" />
                  </label>
                </Form.Group>
                <Form.Group controlId="activityLastDate">
                  <Form.Label>
                    วันที่สิ้นสุดกิจกรรม:{" "}
                    <span style={{ color: "green", fontWeight: "normal" }}>
                      {formattedLastDate ||
                        new Date(edit?.last_date).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                    </span>
                  </Form.Label>
                  <label className="date-picker">
                    <DatePicker
                      selected={
                        lastDate
                          ? new Date(lastDate)
                          : new Date(edit?.last_date)
                      }
                      onChange={handleLastDateChange}
                      dateFormat="dd/MM/yyyy"
                      locale="th"
                      className="form-control"
                    />
                    <CalendarMonth className="calendar-icon" />
                  </label>
                </Form.Group>
                <Form.Group
                  controlId="activityPlace"
                  style={{ marginBottom: 10 }}
                >
                  <Form.Label>สถานที่จัดกิจกรรม:</Form.Label>
                  <Form.Control
                    type="text"
                    defaultValue={edit?.activity_place}
                    onChange={(e) => setActivityPlace(e.target.value)}
                  />
                </Form.Group>
                <Form.Group
                  controlId="activityPlace"
                  style={{ marginBottom: 10 }}
                >
                  <Form.Label>ลักษณะกิจกรรม:</Form.Label>
                  <Form.Control
                    type="text"
                    defaultValue={edit?.activity_style}
                    onChange={(e) => setActivityStyle(e.target.value)}
                  />
                </Form.Group>
                <Form.Group controlId="department" style={{ marginBottom: 15 }}>
                  <Form.Label>กิจกรรมจัดขึ้นโดย</Form.Label>
                  <Form.Control
                    as="select"
                    defaultValue={
                      edit?.department &&
                      JSON.parse(edit.department).dep_id +
                        "," +
                        JSON.parse(edit.department).dep_name
                    }
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    {department.map((dep) => (
                      <option
                        key={dep.Fac_ID}
                        value={`${dep.Fac_ID}, ${dep.Fac_NameTH}`}
                      >
                        {dep.Fac_NameTH}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
                <strong
                  style={{
                    color: "red",
                    display:
                      !edit?.check_activity || edit?.check_activity === "ผ่าน"
                        ? "none"
                        : "inline",
                  }}
                >
                  เหตุผลที่ต้องแก้ไข:
                </strong>{" "}
                {edit?.check_activity === "ผ่าน" ? null : edit?.check_activity}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="success"
                  style={{ fontSize: 18 }}
                  onClick={() => {
                    updateConfirm(edit);
                  }}
                >
                  บันทึก
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    handleHideModal();
                  }}
                  style={{ fontSize: 18 }}
                >
                  ปิด
                </Button>
              </Modal.Footer>
            </Modal>
          ))}
        {showCheckEditModal && (
          <Modal
            show={showCheckEditModal}
            onHide={() => {
              setShowCheckEditModal(false);
              setEditValue("");
            }}
            centered
            className="thai-font modal-dialog-centered"
            size="lg"
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
                variant="primary"
                onClick={() => handleCheckEdit()}
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

export default Teacher_Dashboard;

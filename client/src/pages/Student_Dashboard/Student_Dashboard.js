import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
import {
  Button,
  Table,
  Navbar,
  Container,
  Image,
  Modal,
  Form,
  InputGroup,
} from "react-bootstrap";
import "./student_dashboard.css";
import Loader from "../../components/Loader";
import { CalendarMonth, Delete, Add } from "@mui/icons-material";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import th from "date-fns/locale/th";
import TimePicker from "rc-time-picker";
import "rc-time-picker/assets/index.css";
import moment from "moment";
import format from "date-fns/format";
import Swal from "sweetalert2";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
registerLocale("th", th);
pdfMake.vfs = pdfFonts.pdfMake.vfs;
moment.locale("th");

pdfMake.fonts = {
  THSarabunNew: {
    normal: "THSarabunNew.ttf",
    bold: "THSarabunNew-Bold.ttf",
    italics: "THSarabunNew-Italic.ttf",
    bolditalics: "THSarabunNew-BoldItalic.ttf",
  },
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  },
};

const Student_Dashboard = () => {
  const [studentForm, setStudentForm] = useState([]);
  const [activityPictures, setActivityPictures] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [activityName, setActivityName] = useState("");
  const [activityHours, setActivityHours] = useState("");
  const [activityPlace, setActivityPlace] = useState("");
  const [activityTarget, setActivityTarget] = useState([]);
  const [activityPosition, setActivityPosition] = useState("");
  const [formattedDate, setFormattedDate] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [activityType, setActivityType] = useState(
    "กิจกรรมโดยคณะวิชา ศูนย์ สำนัก"
  );
  const [studentImage, setStudentImage] = useState("");
  const [editBloodForm, setEditBloodForm] = useState(false);
  const [showEditBloodModal, setShowEditBloodModal] = useState(false);
  const [editOnlineForm, setEditOnlineForm] = useState(false);
  const [showEditOnlineModal, setShowEditOnlineModal] = useState(false);
  const [editOutsideForm, setEditOutsideForm] = useState(false);
  const [showEditOutsideModal, setShowEditOutsideModal] = useState(false);
  const [editInsideForm, setEditInsideForm] = useState(false);
  const [showEditInsideModal, setShowEditInsideModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [activityYear, setActivityYear] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]);
  const [activityTimes, setActivityTimes] = useState([]);

  const [activityDocument, setActivityDocument] = useState("");
  const [refresh, setRefresh] = useState(false);
  const [hoursData, setHoursData] = useState({
    total_pass_hours: 0,
    total_pending_hours: 0,
    total_edit_hours: 0,
    total_fail_hours: 0,
    year_pass_hours: 0,
    year_pending_hours: 0,
    year_edit_hours: 0,
    year_fail_hours: 0,
  });
  const checkboxOptions = [
    { label: "กลุ่มนักเรียน/นักศึกษา", value: "กลุ่มนักเรียน/นักศึกษา" },
    { label: "ผู้สูงวัย", value: "ผู้สูงวัย" },
    { label: "ชุมชน", value: "ชุมชน" },
    { label: "สาธารณประโยชน์", value: "สาธารณประโยชน์" },
    { label: "สถานที่ราชการ", value: "สถานที่ราชการ" },
    { label: "บุคคลทุพพลภาพ", value: "บุคคลทุพพลภาพ" },
  ];

  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const ciphertext = decodeURIComponent(params.get("q"));
  const bytes = CryptoJS.AES.decrypt(ciphertext, "secret key 123");
  const plaintext = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  const [user_id] = useState(plaintext.user_id);
  const [fullname] = useState(plaintext.fullname);
  const [fac_name] = useState(plaintext.fac_name);
  const [maj_name] = useState(plaintext.maj_name);
  const [job_name] = useState(plaintext.job_name);
  const navigate = useNavigate();
  const location = useLocation();
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    era: "short",
    eraYear: "numeric",
  };
  const currentDate = new Date().toLocaleDateString("th-TH", options);
  const hostName = '192.168.0.119:3333'
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `http://${hostName}/student_form?student_id=${user_id}&activity_type=${activityType}`
        );
        const data = await response.json();
        setStudentForm(data);

        const imageResponse = await fetch(
          `http://appz.vu.ac.th:8989/VuAPIVer1/select_student_image.php?stuid=${user_id}`
        );
        const imageData = await imageResponse.json();
        setStudentImage(imageData);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [activityType, refresh]);

  const fetchTotalHours = async () => {
    try {
      const totalResponse = await fetch(
        `http://${hostName}/student_total_hours?student_id=${user_id}`
      );
      const totalData = await totalResponse.json();
      setHoursData(totalData);
      console.log(totalData);
      setShowHoursModal(true);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (activityYear) {
      const fetchYearHours = async () => {
        try {
          const yearResponse = await fetch(
            `http://${hostName}/student_total_hours?student_id=${user_id}&activity_year=${activityYear}`
          );
          const yearData = await yearResponse.json();
          setHoursData((prevData) => ({ ...prevData, ...yearData }));
        } catch (error) {
          console.error(error);
        }
      };

      fetchYearHours();
    }
  }, [activityYear]);

  function toggleSidebar() {
    const sidebar = document.querySelector(".sidebar");
    const icon = document.querySelector(".navbar-toggler-icon");
    sidebar.classList.toggle("active");
    icon.classList.toggle("open");
    setSidebarOpen(!sidebarOpen);

    // Close the sidebar when clicking outside
    if (sidebar.classList.contains("active")) {
      document.body.addEventListener("click", handleOutsideClick);
    } else {
      document.body.removeEventListener("click", handleOutsideClick);
    }
  }

  function handleOutsideClick(event) {
    const sidebar = document.querySelector(".sidebar");
    const icon = document.querySelector(".navbar-toggler-icon");
    if (!sidebar.contains(event.target) && !icon.contains(event.target)) {
      toggleSidebar();
    }
  }

  async function deleteStudentForm(s_id) {
    try {
      const result = await Swal.fire({
        title: "ต้องการลบกิจกรรมนี้?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "ใช่",
        cancelButtonText: "ไม่",
        customClass: {
          title: "thai-font",
        },
      });

      if (result.isConfirmed) {
        // Make a DELETE request to delete the selected student form and the corresponding activity pictures
        await fetch(`http://${hostName}/student_form/${s_id}`, {
          method: "DELETE",
        });

        // Remove the deleted student form from the local state
        setStudentForm(
          studentForm.filter((studentForm) => studentForm.s_id !== s_id)
        );

        // Show success message
        await Swal.fire("สำเร็จ", "ข้อมูลกิจกรรมนี้ถูกลบแล้ว", "success");
      }
    } catch (error) {
      console.error(error);
    }
  }

  const handleShowEditModalBlood = async (studentForm) => {
    try {
      const [editResponse, pictureResponse] = await Promise.all([
        fetch(
          `http://${hostName}/student_blood_edit?s_id=${studentForm.s_id}`
        ),
        fetch(
          `http://${hostName}/activity_pictures/${studentForm.s_id}`
        ),
      ]);

      const editData = await editResponse.json();
      const pictureData = await pictureResponse.json();

      setEditBloodForm(editData);
      console.log(editData);
      setShowEditBloodModal(true);

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

  const handleBloodFormUpdate = (edit) => {
    setLoading(true);
    const formData = new FormData();
    const formattedDate = activityDate
      ? format(activityDate, "yyyy-MM-dd")
      : null;
    formData.append(
      "activity_year",
      edit ? activityYear || edit?.activity_year : activityYear
    );
    formData.append(
      "activity_date",
      edit ? formattedDate || edit?.activity_date : formattedDate
    );
    formData.append(
      "activity_place",
      edit ? activityPlace || edit?.activity_place : activityPlace
    );
    formData.append(
      "activity_position",
      edit ? activityPosition || edit?.activity_position : activityPosition
    );

    if (selectedImages && selectedImages.length > 0) {
      selectedImages.forEach((file) => {
        formData.append("activity_pictures", file);
      });
    } else if (!selectedImages && edit && edit.activity_pictures) {
      formData.append("activity_pictures", edit.activity_pictures);
    }

    fetch(`http://${hostName}/student_blood_edit?s_id=${edit?.s_id}`, {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (response.ok) {
          setLoading(false);
          handleHideModal();
          setRefresh(!refresh);
          response.json().then((data) => {
            setStudentForm((prevStudentForm) => [...prevStudentForm, data]);
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

  const updateBloodConfirm = (edit) => {
    Swal.fire({
      title: "ยืนยันการแก้ไข",
      text: "ข้อมูลการแก้ไขจะถูกส่งไปยังผู้อนุมัติ",
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
        handleBloodFormUpdate(edit);
      } else {
      }
    });
  };

  const handleShowEditModalOnline = async (studentForm) => {
    try {
      const [editResponse] = await Promise.all([
        fetch(
          `http://${hostName}/student_blood_edit?s_id=${studentForm.s_id}`
        ),
      ]);

      const editData = await editResponse.json();

      setEditOnlineForm(editData);
      setShowEditOnlineModal(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleOnlineFormUpdate = (edit) => {
    setLoading(true);
    const formData = new FormData();
    const formattedDate = activityDate
      ? format(activityDate, "yyyy-MM-dd")
      : null;
    const formattedStartTime = startTime
      ? moment(new Date(startTime)).format("HH:mm")
      : null;
    const formattedEndTime = endTime
      ? moment(new Date(endTime)).format("HH:mm")
      : null;
    formData.append(
      "activity_year",
      edit ? activityYear || edit?.activity_year : activityYear
    );
    formData.append(
      "activity_date",
      edit ? formattedDate || edit?.activity_date : formattedDate
    );
    formData.append(
      "activity_name",
      edit ? activityName || edit?.activity_name : activityName
    );
    formData.append(
      "activity_hours",
      edit ? activityHours || edit?.activity_hours : activityHours
    );
    formData.append(
      "start_time",
      edit ? formattedStartTime || edit?.start_time : formattedStartTime
    );
    formData.append(
      "end_time",
      edit ? formattedEndTime || edit?.end_time : formattedEndTime
    );
    formData.append("student_id", user_id);

    if (activityDocument) {
      formData.append("activity_document", activityDocument);
    } else if (edit && edit.activity_document) {
      const existingDocument = new Blob([edit.activity_document]);
      formData.append("activity_document", existingDocument);
    }

    fetch(`http://${hostName}/student_online_edit?s_id=${edit?.s_id}`, {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (response.ok) {
          setLoading(false);
          handleHideModal();
          setRefresh(!refresh);
          response.json().then((data) => {
            setStudentForm((prevStudentForm) => [...prevStudentForm, data]);
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
        } else if (response.status === 400) {
          response.json().then((data) => {
            setLoading(false);
            console.error("Error submitting form:", data.error);
            Swal.fire({
              icon: "warning",
              html: `
                <span style="color: black;">
                ชั่วโมงกิจกรรมอบรมออนไลน์จิตสาธารณะ กยศ. จะต้องไม่เกิน 6 ชั่วโมงต่อภาคเรียน
                </span>
                <br>
                <span style="color: green;">
                  จำนวนชั่วโมงปัจจุบัน ${data.totalHours} ชั่วโมง
                </span>
              `,
              showConfirmButton: true,
              customClass: {
                htmlContainer: "thai-font",
              },
            });
          });
        } else {
          setLoading(false);
          console.error("Error submitting form");
          Swal.fire({
            icon: "error",
            text: "เกิดข้อผิดพลาดในการส่งฟอร์ม",
          });
        }
      })
      .catch((error) => {
        setLoading(false);
        console.error(error);
      });
  };

  const updateOnlineConfirm = (edit) => {
    Swal.fire({
      title: "ยืนยันการแก้ไข",
      text: "ข้อมูลการแก้ไขจะถูกส่งไปยังผู้อนุมัติ",
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
        handleOnlineFormUpdate(edit);
      } else {
      }
    });
  };

  const handleShowEditModalOutside = async (studentForm) => {
    try {
      const [editResponse, pictureResponse] = await Promise.all([
        fetch(
          `http://${hostName}/student_blood_edit?s_id=${studentForm.s_id}`
        ),
        fetch(
          `http://${hostName}/activity_pictures/${studentForm.s_id}`
        ),
      ]);

      const editData = await editResponse.json();
      const pictureData = await pictureResponse.json();

      setEditOutsideForm(editData);
      setShowEditOutsideModal(true);
      const activityTargetArray = studentForm.activity_target.split(",");
      setActivityTarget(activityTargetArray);

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

  const handleOutsideFormUpdate = (edit) => {
    setLoading(true);
    const formData = new FormData();
    const formattedDate = activityDate
      ? format(activityDate, "yyyy-MM-dd")
      : null;
    const formattedStartTime = startTime
      ? moment(new Date(startTime)).format("HH:mm")
      : null;
    const formattedEndTime = endTime
      ? moment(new Date(endTime)).format("HH:mm")
      : null;
    formData.append(
      "activity_year",
      edit ? activityYear || edit?.activity_year : activityYear
    );
    formData.append(
      "activity_date",
      edit ? formattedDate || edit?.activity_date : formattedDate
    );
    formData.append(
      "activity_name",
      edit ? activityName || edit?.activity_name : activityName
    );
    formData.append(
      "activity_position",
      edit ? activityPosition || edit?.activity_position : activityPosition
    );
    formData.append(
      "activity_place",
      edit ? activityPlace || edit?.activity_place : activityPlace
    );
    formData.append(
      "activity_hours",
      edit ? activityHours || edit?.activity_hours : activityHours
    );
    formData.append(
      "activity_target",
      edit ? [...activityTarget] || edit?.activity_target : [...activityTarget]
    );
    formData.append(
      "start_time",
      edit ? formattedStartTime || edit?.start_time : formattedStartTime
    );
    formData.append(
      "end_time",
      edit ? formattedEndTime || edit?.end_time : formattedEndTime
    );

    formData.append("student_id", user_id);
    console.log([...activityTarget]);

    if (selectedImages && selectedImages.length > 0) {
      selectedImages.forEach((file) => {
        formData.append("activity_pictures", file);
      });
    } else if (!selectedImages && edit && edit.activity_pictures) {
      formData.append("activity_pictures", edit.activity_pictures);
    }

    if (activityDocument) {
      formData.append("activity_document", activityDocument);
    } else if (edit && edit.activity_document) {
      const existingDocument = new Blob([edit.activity_document]);
      formData.append("activity_document", existingDocument);
    }

    fetch(`http://${hostName}/student_outside_edit?s_id=${edit?.s_id}`, {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (response.ok) {
          setLoading(false);
          handleHideModal();
          setRefresh(!refresh);
          response.json().then((data) => {
            setStudentForm((prevStudentForm) => [...prevStudentForm, data]);
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
        } else if (response.status === 400) {
          response.json().then((data) => {
            setLoading(false);
            console.error("Error submitting form:", data.error);
            Swal.fire({
              icon: "warning",
              html: `
                <span style="color: black;">
                ชั่วโมงกิจกรรมจิตอาสาเข้าร่วมด้วยตนเอง จะต้องไม่เกิน 6 ชั่วโมงต่อภาคเรียน
                </span>
                <br>
                <span style="color: green;">
                  จำนวนชั่วโมงปัจจุบัน ${data.totalHours} ชั่วโมง
                </span>
              `,
              showConfirmButton: true,
              customClass: {
                htmlContainer: "thai-font",
              },
            });
          });
        } else {
          setLoading(false);
          console.error("Error submitting form");
          Swal.fire({
            icon: "error",
            text: "เกิดข้อผิดพลาดในการส่งฟอร์ม",
          });
        }
      })
      .catch((error) => {
        setLoading(false);
        console.error(error);
      });
  };

  const updateOutsideConfirm = (edit) => {
    Swal.fire({
      title: "ยืนยันการแก้ไข",
      text: "ข้อมูลการแก้ไขจะถูกส่งไปยังผู้อนุมัติ",
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
        handleOutsideFormUpdate(edit);
      } else {
      }
    });
  };

  const handleShowEditModalInside = async (studentForm) => {
    try {
      const [editResponse, pictureResponse] = await Promise.all([
        fetch(
          `http://${hostName}/student_blood_edit?s_id=${studentForm.s_id}`
        ),
        fetch(
          `http://${hostName}/activity_pictures/${studentForm.s_id}`
        ),
      ]);

      const editData = await editResponse.json();
      const pictureData = await pictureResponse.json();

      setEditInsideForm(editData);
      setShowEditInsideModal(true);

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

  const handleTimeChange = (time, type, edit) => {
    if (type === "start") {
      setStartTime(time);

      if (edit?.end_time) {
        const diff = moment(edit.end_time, "HH:mm").diff(
          moment(time, "HH:mm"),
          "hours"
        );
        setActivityHours(diff > 6 ? 6 : diff);
      } else {
        setActivityHours(null);
      }
    } else {
      setEndTime(time);

      if (edit?.start_time) {
        const diff = moment(time, "HH:mm").diff(
          moment(edit.start_time, "HH:mm"),
          "hours"
        );
        setActivityHours(diff > 6 ? 6 : diff);
      } else {
        setActivityHours(null);
      }
    }
  };
  

  async function handleClickPicture(s_id) {
    if (!s_id) {
      console.error("Invalid s_id parameter");
      return;
    }

    try {
      const response = await fetch(
        `http://${hostName}/activity_pictures/${s_id}`
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

        // Open a pop-up window with the images
        const popup = window.open("", "", "width=800,height=600,scrollbars=1");
        const picturesHtml = pictureArray
          .map(
            (picture) =>
              `<img src="${picture}" alt="activity picture" style="max-width: 100%; height: auto;">`
          )
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

  const generateCertificate = () => {
    const docDefinition = {
      pageSize: "A4",
      pageOrientation: "landscape",
      // background: function (currentPage, pageSize) {
      //   return {
      //     image: "snow",
      //     width: pageSize.width / 2,
      //     alignment: "center",
      //     opacity: 0.3,
      //   };
      // },
      
      content: [
        {
          image: "snow",
          width: 80,
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        {
          text: "มหาวิทยาลัยวงษ์ชวลิตกุล",
          style: "header",
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        {
          text: "มอบเกียรติบัตรฉบับนี้ไว้ให้เพื่อแสดงว่า",
          style: "subheader",
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        {
          text: `นาย${fullname}`,
          style: "name",
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        {
          text: `เป็นนักศึกษาระดับปริญญาตรี หลักสูตร${job_name}`,
          style: "detail1",
          alignment: "center",
          margin: [0, 0, 0, 5],
        },
        {
          text: `ได้เข้าร่วมกิจกรรมเพื่อประโยชน์ต่อสังคมและสาธารณะ(จิตอาสา) ระหว่างศึกษาจำนวน ${hoursData.total_pass_hours} ชั่วโมง`,
          style: "detail2",
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        {
          text: `ขอให้จงมีแต่ความสุข ความเจริญยิ่งๆ ขึ้นไป`,
          style: "wish",
          alignment: "center",
          margin: [0, 0, 0, 5],
        },
        {
          text: `ให้ใว้ ณ วันที่ ${currentDate}`,
          style: "date",
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        {
          columns: [
            {
              stack: [
                {
                  text: "------------",
                  margin: [0, 0, 0, 10],
                  style: "sign",
                  alignment: "center",
                },
                {
                  text: "ดร.อรรถพงษ์  โภชน์เกาะ",
                  margin: [0, 0, 0, 10],
                  style: "sign",
                  alignment: "center",
                },
                {
                  text: "รองอธิการบดีฝ่ายพัฒนานักศึกษาและชุมชนสัมพันธ์",
                  style: "sign",
                  alignment: "center",
                },
              ],
              alignment: "left",
              margin: [10, 50, 30, 0],
              style: "sign",
            },
            {
              stack: [
                {
                  text: "------------",
                  margin: [0, 0, 0, 10],
                  style: "sign",
                  alignment: "center",
                },
                {
                  text: "อ.วิสิฐศักดิ์  รักพร",
                  margin: [0, 0, 0, 10],
                  style: "sign",
                  alignment: "center",
                },
                {
                  text: "ผู้อำนวยการสำนักพัฒนานักศึกษา",
                  style: "sign",
                  alignment: "center",
                },
              ],
              alignment: "right",
              margin: [0, 50, 50, 0],
            },
          ],
        },
      ],
      styles: {
        header: {
          font: "THSarabunNew",
          fontSize: 36,
          bold: true,
          alignment: "center",
          color: "orange",
          margin: [0, 0, 0, 20],
          decorationColor: "yellow",
        },

        subheader: {
          font: "THSarabunNew",
          fontSize: 20,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        name: {
          font: "THSarabunNew",
          fontSize: 22,
          margin: [0, 0, 0, 10],
        },
        detail1: {
          font: "THSarabunNew",
          fontSize: 20,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        detail2: {
          font: "THSarabunNew",
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        wish: {
          font: "THSarabunNew",
          fontSize: 20,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        date: {
          font: "THSarabunNew",
          fontSize: 20,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        sign: {
          font: "THSarabunNew",
          fontSize: 18,
          margin: [0, 0, 0, 10],
        },
      },
      images: {
        snow: "https://upload.wikimedia.org/wikipedia/th/c/c4/%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%A7%E0%B8%B4%E0%B8%97%E0%B8%A2%E0%B8%B2%E0%B8%A5%E0%B8%B1%E0%B8%A2%E0%B8%A7%E0%B8%87%E0%B8%A9%E0%B9%8C%E0%B8%8A%E0%B8%A7%E0%B8%A5%E0%B8%B4%E0%B8%95%E0%B8%81%E0%B8%B8%E0%B8%A5.png",
      },
    };

    pdfMake.createPdf(docDefinition).open(); // Open the PDF preview
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

  async function handleClickPDF(studentForm) {
    try {
      // Fetch the PDF data
      const response = await fetch(
        `http://${hostName}/student_form_pdf?s_id=${studentForm.s_id}`
      );
      const bufferData = await response.json();

      // Convert the buffer data to a Uint8Array
      const pdfData = new Uint8Array(bufferData[0].activity_document.data);

      // Create a Blob from the PDF data
      const pdfBlob = new Blob([pdfData], { type: "application/pdf" });

      // Create a URL for the Blob
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Open the PDF file in a new tab
      window.open(pdfUrl, "_blank");
    } catch (error) {
      console.error(error);
    }
  }

  const handleDeletePicture = (index) => {
    const updatedPictures = [...selectedImages];
    updatedPictures.splice(index, 1);
    setSelectedImages(updatedPictures);
  };

  const fileInputRef = useRef(null);

  // Function to handle selected image file
  const handleFileSelect = (event) => {
    const files = event.target.files;
    setSelectedImages([...selectedImages, ...files]);
  };

  const handleHideModal = () => {
    setShowEditBloodModal(null);
    setShowEditOnlineModal(null);
    setShowEditOutsideModal(null);
    setShowEditInsideModal(null);
    setActivityPictures([]);
    setSelectedImages([]);
    setActivityYear("");
    setActivityDate("");
    setFormattedDate("");
    setActivityPlace("");
    setActivityPosition("");
    setActivityTarget([]);
    setStartTime(null);
    setEndTime(null);
    setActivityHours("");
    setActivityDocument("");
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

  const data = ((edit) => {
    const startDate = moment(edit?.activity_date);
    const endDate = moment(edit?.last_date);
    const diffDays = endDate.diff(startDate, "days") + 1;
    const dates = [];
    for (let i = 0; i < diffDays; i++) {
      const date = moment(startDate)
        .add(i, "days")
        .add(543, "years")
        .format("D MMMM YYYY");
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
    }
    return dates;
  })();

  const handleDateTimeChange = (time, field, index) => {
    const newActivityTimes = [...activityTimes];
    newActivityTimes[index] = {
      ...newActivityTimes[index],
      [field]: time.format("HH:mm"),
    };
    setActivityTimes(newActivityTimes);
  };

  const totalHoursAll = data.reduce((acc, curr) => {
    return acc + curr.activityDate.hoursPerDay;
  }, 0);

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
                <Navbar.Toggle
                  aria-controls="sidebar"
                  onClick={toggleSidebar}
                />
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
              <Navbar.Text
                onClick={logoutButton}
                style={{
                  color: "black",
                  textDecorationLine: "underline",
                  cursor: "pointer",
                }}
                className="logout-button thai-font d-none d-lg-block"
              >
                ออกจากระบบ
              </Navbar.Text>
            </Container>
          </Navbar>
        </div>
        <div className="container">
          <div className="row">
            <div className="col-md-4">
              <div className="sidebar">
                <p
                  className="thai-font"
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    borderBottom: "1px solid black",
                    marginBottom: 20,
                    paddingBottom: 10,
                  }}
                >
                  ประเภทกิจกรรม
                </p>
                <ul
                  className="list-unstyled thai-font"
                  style={{ fontSize: 22 }}
                >
                  <li>
                    <button
                      className={`btn btn-outline ${
                        activityType === "กิจกรรมโดยคณะวิชา ศูนย์ สำนัก"
                          ? "active"
                          : ""
                      }`}
                      onClick={() => {
                        setActivityType("กิจกรรมโดยคณะวิชา ศูนย์ สำนัก");
                      }}
                    >
                      กิจกรรมโดยคณะวิชา ศูนย์ สำนัก
                    </button>
                  </li>
                  <li>
                    <button
                      className={`btn btn-outline ${
                        activityType === "กิจกรรมการบริจาคโลหิต" ? "active" : ""
                      }`}
                      onClick={() => {
                        setActivityType("กิจกรรมการบริจาคโลหิต");
                      }}
                    >
                      กิจกรรมการบริจาคโลหิต
                    </button>
                  </li>
                  <li>
                    <button
                      className={`btn btn-outline ${
                        activityType === "กิจกรรมอบรมออนไลน์จิตสาธารณะ กยศ."
                          ? "active"
                          : ""
                      }`}
                      onClick={() => {
                        setActivityType("กิจกรรมอบรมออนไลน์จิตสาธารณะ กยศ.");
                      }}
                    >
                      กิจกรรมอบรมออนไลน์จิตสาธารณะ กยศ.
                    </button>
                  </li>
                  <li>
                    <button
                      className={`btn btn-outline ${
                        activityType === "กิจกรรมจิตอาสาเข้าร่วมด้วยตนเอง"
                          ? "active"
                          : ""
                      }`}
                      onClick={() => {
                        setActivityType("กิจกรรมจิตอาสาเข้าร่วมด้วยตนเอง");
                      }}
                    >
                      กิจกรรมจิตอาสาเข้าร่วมด้วยตนเอง
                    </button>
                  </li>

                  <li className="logout-btn d-md-none">
                    <button
                      onClick={logoutButton}
                      style={{
                        color: "red",
                        textDecorationLine: "underline",
                        cursor: "pointer",
                      }}
                      className="logout-button thai-font"
                    >
                      ออกจากระบบ
                    </button>
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
          className="thai-font"
        >
          ระบบบันทึกกิจกรรมจิตอาสาของนักศึกษา
        </h1>
        <div
          style={{
            flexDirection: "row",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {" "}
          {studentImage ? (
            <Image
              id="student-image"
              src={`data:image/png;base64,${studentImage.Per_Picture}`}
              rounded
              style={{ width: 150, backgroundColor: "#D4E1E3" }}
            />
          ) : (
            <Image
              src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png"
              rounded
              style={{ width: 150, backgroundColor: "#D4E1E3" }}
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
            <p className="thai-font student-detail-text">
              รหัสนักศึกษา:{" "}
              <span style={{ color: "green", fontWeight: "bold" }}>
                {user_id}
              </span>
            </p>
            <p className="thai-font student-detail-text">
              ชื่อ-นามสกุล:{" "}
              <span style={{ color: "green", fontWeight: "bold" }}>
                {fullname}
              </span>
            </p>

            <Button
              onClick={() => fetchTotalHours()}
              className="btn btn-success thai-font student-detail-text"
              style={{ width: 200, padding: 1 }}
            >
              ดูข้อมูลชั่วโมงจิตอาสา
            </Button>
          </div>
        </div>
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
              marginTop: 30,
            }}
            className="thai-font"
          >
            เพิ่มข้อมูลกิจกรรม
          </Button>
        </div>
        {activityType === "กิจกรรมโดยคณะวิชา ศูนย์ สำนัก" && (
          <div className="table-header table-student">
            <Table
              striped
              bordered
              hover
              style={{ maxWidth: "100%" }}
              className="mx-auto"
            >
              <thead className="thai-font" style={{ fontSize: 20 }}>
                <tr>
                  <th>#</th>
                  <th>ชื่อกิจกรรม</th>
                  <th>ภาคเรียน</th>
                  <th>วันที่เข้าร่วมกิจกรรม</th>
                  <th>ภาระหน้าที่</th>
                  <th>รูปภาพ</th>
                  <th>จำนวนชั่วโมง</th>
                  <th>สถานะ</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody
                className="thai-font"
                style={{
                  fontSize: 20,
                  justifyContent: "center",
                  alignItems: "center",
                  lineHeight: 1,
                }}
              >
                {studentForm.map((studentForm, index) => (
                  <tr key={studentForm.id}>
                    <td>{index + 1}</td>
                    <td>{studentForm.activity_name}</td>
                    <td>{studentForm.activity_year}</td>
                    <td>
                      {studentForm.activity_time_period &&
                        JSON.parse(studentForm.activity_time_period).map(
                          (item, index) => (
                            <p key={index}>
                              {item.activityDate.date},{" "}
                              {item.activityDate.startTime} น. -{" "}
                              {item.activityDate.endTime} น.
                            </p>
                          )
                        )}
                    </td>
                    <td> {studentForm.activity_position} </td>
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
                      {studentForm.check_fail !== null ? (
                        <span style={{ color: "red", fontWeight: "bold" }}>
                          ไม่ผ่าน
                        </span>
                      ) : studentForm.check_activity === "ผ่าน" ? (
                        <span style={{ color: "green", fontWeight: "bold" }}>
                          ผ่าน
                        </span>
                      ) : studentForm.check_activity === null ? (
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
                        variant="warning"
                        onClick={() => handleShowEditModalInside(studentForm)}
                        style={{ padding: 1, paddingInline: 10, fontSize: 20 }}
                      >
                        แก้ไข
                      </Button>
                    </td>
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
          </div>
        )}
        {activityType === "กิจกรรมจิตอาสาเข้าร่วมด้วยตนเอง" && (
          <div className="table-header table-student">
            <Table striped bordered hover style={{ maxWidth: "100%" }}>
              <thead className="thai-font" style={{ fontSize: 20 }}>
                <tr>
                  <th>#</th>
                  <th>ชื่อกิจกรรม</th>
                  <th>ภาคเรียน</th>
                  <th>วันที่เข้าร่วมกิจกรรม</th>
                  <th>รูปภาพ</th>
                  <th>ระยะเวลาที่ทำกิจกรรม</th>
                  <th>จำนวนชั่วโมง</th>
                  <th>สถานะ</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody
                className="thai-font"
                style={{
                  fontSize: 20,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {studentForm.map((studentForm, index) => (
                  <tr key={studentForm.id}>
                    <td>{index + 1}</td>
                    <td>{studentForm.activity_name}</td>
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
                    <td>
                      {" "}
                      {studentForm.start_time} น - {studentForm.end_time} น{" "}
                    </td>
                    <td>{studentForm.activity_hours}</td>
                    <td>
                      {studentForm.check_fail !== null ? (
                        <span style={{ color: "red", fontWeight: "bold" }}>
                          ไม่ผ่าน
                        </span>
                      ) : studentForm.check_activity === "ผ่าน" ? (
                        <span style={{ color: "green", fontWeight: "bold" }}>
                          ผ่าน
                        </span>
                      ) : studentForm.check_activity === null ? (
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
                        variant="warning"
                        onClick={() => handleShowEditModalOutside(studentForm)}
                      >
                        แก้ไข
                      </Button>
                    </td>
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
          </div>
        )}
        {activityType === "กิจกรรมอบรมออนไลน์จิตสาธารณะ กยศ." && (
          <div className="table-header table-student">
            <Table striped bordered hover style={{ maxWidth: "100%" }}>
              <thead className="thai-font" style={{ fontSize: 20 }}>
                <tr>
                  <th>#</th>
                  <th>หัวข้อการเข้าอบรม</th>
                  <th>ภาคเรียน</th>
                  <th>วันที่เข้าร่วมกิจกรรม</th>
                  <th>เอกสารยืนยัน</th>
                  <th>ระยะเวลาที่ทำกิจกรรม</th>
                  <th>จำนวนชั่วโมง</th>
                  <th>สถานะ</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody
                className="thai-font"
                style={{
                  fontSize: 20,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {studentForm.map((studentForm, index) => (
                  <tr key={studentForm.id}>
                    <td>{index + 1}</td>
                    <td>{studentForm.activity_name}</td>
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
                          handleClickPDF(studentForm);
                        }}
                      >
                        ดูเอกสาร
                      </p>
                    </td>
                    <td>
                      {" "}
                      {studentForm.start_time} น - {studentForm.end_time} น{" "}
                    </td>
                    <td>{studentForm.activity_hours}</td>
                    <td>
                      {studentForm.check_fail !== null ? (
                        <span style={{ color: "red", fontWeight: "bold" }}>
                          ไม่ผ่าน
                        </span>
                      ) : studentForm.check_activity === "ผ่าน" ? (
                        <span style={{ color: "green", fontWeight: "bold" }}>
                          ผ่าน
                        </span>
                      ) : studentForm.check_activity === null ? (
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
                        variant="warning"
                        onClick={() => handleShowEditModalOnline(studentForm)}
                      >
                        แก้ไข
                      </Button>
                    </td>
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
          </div>
        )}
        {activityType === "กิจกรรมการบริจาคโลหิต" && (
          <div
            className="table-header table-student"
            style={{ padding: "0 10px" }}
          >
            <Table
              striped
              bordered
              hover
              style={{ maxWidth: "100%", margin: 0 }}
            >
              <thead className="thai-font" style={{ fontSize: 20 }}>
                <tr>
                  <th>#</th>
                  <th>ภาคเรียน</th>
                  <th>วันที่บริจาคโลหิต</th>
                  <th>สถานที่บริจาคโลหิต</th>
                  <th>จัดขึ้นโดยหน่วยงาน</th>
                  <th>รูปภาพกิจกรรม</th>
                  <th>จำนวนชั่วโมง</th>
                  <th>สถานะ</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody
                className="thai-font"
                style={{
                  fontSize: 20,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {studentForm.map((studentForm, index) => (
                  <tr key={studentForm.id}>
                    <td>{index + 1}</td>
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
                    <td>{studentForm.activity_place}</td>
                    <td>{studentForm.activity_position}</td>
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
                      {studentForm.check_fail !== null ? (
                        <span style={{ color: "red", fontWeight: "bold" }}>
                          ไม่ผ่าน
                        </span>
                      ) : studentForm.check_activity === "ผ่าน" ? (
                        <span style={{ color: "green", fontWeight: "bold" }}>
                          ผ่าน
                        </span>
                      ) : studentForm.check_activity === null ? (
                        <span style={{ color: "black", fontWeight: "bold" }}>
                          รอการพิจารณา
                        </span>
                      ) : (
                        <span style={{ color: "orange", fontWeight: "bold" }}>
                          รอการแก้ไข
                        </span>
                      )}
                    </td>{" "}
                    <td>
                      <Button
                        variant="warning"
                        onClick={() => handleShowEditModalBlood(studentForm)}
                      >
                        แก้ไข
                      </Button>
                    </td>
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
          </div>
        )}
        <Modal
          show={showHoursModal}
          onHide={() => {
            setShowHoursModal(false);
            setActivityYear("");
          }}
          className="thai-font"
        >
          <Modal.Header closeButton></Modal.Header>
          <Modal.Body>
            <h4 style={{ fontWeight: "bold" }}>ชั่วโมงจิตอาสาตลอดการศึกษา</h4>
            <p className="thai-font hours-detail-text">
              จำนวนชั่วโมงจิตอาสาที่ผ่านการอนุมัติทั้งหมด:{" "}
              <span style={{ color: "green", fontWeight: "bold" }}>
                {hoursData.total_pass_hours} {""} ชั่วโมง
              </span>
            </p>
            <p className="thai-font hours-detail-text">
              จำนวนชั่วโมงจิตอาสาที่รอการอนุมัติทั้งหมด:{" "}
              <span style={{ color: "black", fontWeight: "bold" }}>
                {hoursData.total_pending_hours}
                {""} ชั่วโมง
              </span>
            </p>
            <p className="thai-font hours-detail-text">
              จำนวนชั่วโมงจิตอาสาที่รอการแก้ไขทั้งหมด:{" "}
              <span style={{ color: "orange", fontWeight: "bold" }}>
                {hoursData.total_edit_hours} {""} ชั่วโมง
              </span>
            </p>
            <p className="thai-font hours-detail-text">
              จำนวนชั่วโมงจิตอาสาที่ไม่ผ่านการอนุมัติทั้งหมด:{" "}
              <span style={{ color: "red", fontWeight: "bold" }}>
                {hoursData.total_fail_hours}
                {""} ชั่วโมง
              </span>
            </p>
            <hr />
            <Form>
              <h4 style={{ fontWeight: "bold" }}>
                ชั่วโมงจิตอาสาต่อภาคการศึกษา
              </h4>
              <Form.Group controlId="activityYear" className="form-group">
                <Form.Label style={{ fontSize: 22 }}>
                  ปีการศึกษา/ภาคเรียน
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
              </Form.Group>
            </Form>
            {activityYear && (
              <div>
                <p className="thai-font hours-detail-text">
                  จำนวนชั่วโมงจิตอาสาที่ผ่านการอนุมัติ:{" "}
                  <span style={{ color: "green", fontWeight: "bold" }}>
                    {hoursData.year_pass_hours} {""} ชั่วโมง
                  </span>
                </p>
                <p className="thai-font hours-detail-text">
                  จำนวนชั่วโมงจิตอาสาที่รอการอนุมัติ:{" "}
                  <span style={{ color: "black", fontWeight: "bold" }}>
                    {hoursData.year_pending_hours}
                    {""} ชั่วโมง
                  </span>
                </p>
                <p className="thai-font hours-detail-text">
                  จำนวนชั่วโมงจิตอาสาที่รอการแก้ไข:{" "}
                  <span style={{ color: "orange", fontWeight: "bold" }}>
                    {hoursData.year_edit_hours} {""} ชั่วโมง
                  </span>
                </p>
                <p className="thai-font hours-detail-text">
                  จำนวนชั่วโมงจิตอาสาที่ไม่ผ่านการอนุมัติ:{" "}
                  <span style={{ color: "red", fontWeight: "bold" }}>
                    {hoursData.year_fail_hours}
                    {""} ชั่วโมง
                  </span>
                </p>
              </div>
            )}
          </Modal.Body>{" "}
          <Modal.Footer>
            {hoursData.total_pass_hours >= 5 && (
              <Button
                onClick={() => generateCertificate()}
                variant="success"
                className="thai-font"
                style={{ padding: 0, fontSize: 20 }}
              >
                พิมพ์ใบเกียรติบัตร
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => {
                setShowHoursModal(false);
                setActivityYear("");
              }}
            >
              ปิด
            </Button>
          </Modal.Footer>
        </Modal>
        {editBloodForm &&
          studentForm &&
          editBloodForm.map((edit) => (
            <Modal show={showEditBloodModal} className="thai-font">
              <Modal.Title
                style={{
                  fontSize: 30,
                  fontWeight: "bold",
                  color: "orange",
                  textAlign: "center",
                }}
              >
                แก้ไขข้อมูลกิจกรรม
              </Modal.Title>
              <Modal.Body>
                <Form>
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
                      วันที่บริจาคโลหิต:{" "}
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
                  <Form.Group controlId="activityPlace">
                    <Form.Label>สถานที่บริจาคโลหิต:</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={edit?.activity_place}
                      onChange={(e) => setActivityPlace(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group controlId="activityPosition">
                    <Form.Label>จัดขึ้นโดยหน่วยงาน:</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={edit?.activity_position}
                      onChange={(e) => setActivityPosition(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Label>รูปภาพกิจกรรมกิจกรรม</Form.Label>
                  <div
                    style={{
                      display: "flex",
                      gap: "20px",
                      flexWrap: "wrap",
                      marginTop: 20,
                    }}
                  >
                    {[...activityPictures].map((picture, index) => (
                      <div key={index} style={{ position: "relative" }}>
                        <img
                          src={
                            typeof picture === "string"
                              ? picture
                              : URL.createObjectURL(picture)
                          }
                          alt="activity picture"
                          style={{
                            width: 200,
                            height: 200,
                            borderRadius: 10,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <Form.Label>เลือกรูปภาพใหม่</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      multiple
                      name="activity_pictures" // add this line
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "20px",
                      flexWrap: "wrap",
                      marginTop: 20,
                    }}
                  >
                    {[...selectedImages].map((picture, index) => (
                      <div key={index} style={{ position: "relative" }}>
                        <img
                          src={
                            typeof picture === "string"
                              ? picture
                              : URL.createObjectURL(picture)
                          }
                          alt="activity picture"
                          style={{
                            width: 200,
                            height: 200,
                            borderRadius: 10,
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            background: "rgba(255, 255, 255, 0.8)",
                            borderRadius: "50%",
                            padding: 5,
                            cursor: "pointer",
                          }}
                          onClick={() => handleDeletePicture(index)}
                        >
                          <Delete />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p style={{ marginTop: 20, fontSize: 22 }}>
                    <strong
                      style={{
                        color: "red",
                        display:
                          !edit?.check_activity ||
                          edit?.check_activity === "ผ่าน"
                            ? "none"
                            : "inline",
                      }}
                    >
                      เหตุผลที่ต้องแก้ไข:
                    </strong>{" "}
                    {edit?.check_activity === "ผ่าน"
                      ? null
                      : edit?.check_activity}
                  </p>

                  <p style={{ marginTop: 20, fontSize: 22 }}>
                    <strong
                      style={{
                        color: "red",
                        display:
                          (!edit?.check_activity || edit?.check_fail == null) &&
                          !edit?.check_fail
                            ? "none"
                            : "inline",
                      }}
                    >
                      เหตุผลที่ไม่ผ่าน:
                    </strong>{" "}
                    {edit?.check_activity === "ผ่าน" ? null : edit?.check_fail}
                  </p>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  className="btn btn-success"
                  onClick={() => updateBloodConfirm(edit)}
                >
                  บันทึก
                </Button>
                <Button
                  className="btn btn-secondary"
                  onClick={() => handleHideModal()}
                >
                  ปิด
                </Button>
              </Modal.Footer>
            </Modal>
          ))}
        {editOnlineForm &&
          editOnlineForm.map((edit) => (
            <Modal show={showEditOnlineModal} className="thai-font">
              <Modal.Title
                style={{
                  fontSize: 30,
                  fontWeight: "bold",
                  color: "orange",
                  textAlign: "center",
                }}
              >
                แก้ไขข้อมูลกิจกรรม
              </Modal.Title>
              <Modal.Body>
                <Form>
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
                  <Form.Group controlId="activityPlace">
                    <Form.Label>หัวข้อการเข้าอบรม:</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={edit?.activity_name}
                      onChange={(e) => setActivityName(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group controlId="activityDate">
                    <Form.Label>
                      วันที่เข้าร่วมการอบรม:{" "}
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
                  <div className="form-group" style={{ fontWeight: "bold" }}>
                    <Form.Label>
                      จำนวนชั่วโมงที่เข้าอบรม:{" "}
                      {edit?.activity_hours && (
                        <span style={{ color: "green" }}>
                          {edit?.activity_hours > 6 ? 6 : edit?.activity_hours}{" "}
                          ชั่วโมง{" "}
                        </span>
                      )}
                      {activityHours != null && (
                        <span style={{ color: "blue" }}>
                          {activityHours > 6 ? 6 : activityHours} ชั่วโมง
                          (เวลาใหม่)
                        </span>
                      )}
                    </Form.Label>
                  </div>
                  <Form.Group
                    style={{ marginLeft: 25, fontSize: 20 }}
                    controlId="activity_hours"
                    className="form-group"
                  >
                    เวลาเริ่มทำกิจกรรม <span style={{ color: "red" }}>*</span>
                    <TimePicker
                      showSecond={false}
                      defaultValue={moment(edit?.start_time, "HH:mm") || null}
                      onChange={(time) => handleTimeChange(time, "start", edit)}
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
                      defaultValue={moment(edit?.end_time, "HH:mm") || null}
                      onChange={(time) => handleTimeChange(time, "end", edit)}
                      style={{ fontFamily: "sans-serif" }}
                    />
                  </Form.Group>
                  <Form.Label>เอกสารยืนยัน: </Form.Label>
                  <Button
                    style={{
                      cursor: "pointer",
                      marginLeft: 10,
                    }}
                    onClick={() => handleClickPDF(edit)}
                    className="btn btn-secondary"
                  >
                    ดูเอกสาร
                  </Button>
                  <Form.Group
                    controlId="activityDocument"
                    className="form-group"
                  >
                    <div style={{ pointerEvents: "none" }}>
                      <Form.Label>เลือกเอกสารใหม่ (.pdf) </Form.Label>
                    </div>

                    <Form.Control
                      type="file"
                      accept="application/pdf"
                      name="activity_document"
                      onChange={(e) => setActivityDocument(e.target.files[0])}
                    />
                  </Form.Group>{" "}
                  <p style={{ marginTop: 20, fontSize: 22 }}>
                    <strong
                      style={{
                        color: "red",
                        display:
                          !edit?.check_activity ||
                          edit?.check_activity === "ผ่าน"
                            ? "none"
                            : "inline",
                      }}
                    >
                      เหตุผลที่ต้องแก้ไข:
                    </strong>{" "}
                    {edit?.check_activity === "ผ่าน"
                      ? null
                      : edit?.check_activity}
                  </p>
                  <p style={{ marginTop: 20, fontSize: 22 }}>
                    <strong
                      style={{
                        color: "red",
                        display:
                          (!edit?.check_activity || edit?.check_fail == null) &&
                          !edit?.check_fail
                            ? "none"
                            : "inline",
                      }}
                    >
                      เหตุผลที่ไม่ผ่าน:
                    </strong>{" "}
                    {edit?.check_activity === "ผ่าน" ? null : edit?.check_fail}
                  </p>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  className="btn btn-success"
                  onClick={() => updateOnlineConfirm(edit)}
                >
                  บันทึก
                </Button>
                <Button
                  className="btn btn-secondary"
                  onClick={() => handleHideModal()}
                >
                  ปิด
                </Button>
              </Modal.Footer>
            </Modal>
          ))}
        {editOutsideForm &&
          editOutsideForm.map((edit) => (
            <Modal
              show={showEditOutsideModal}
              className="thai-font"
              dialogClassName="modal-scroll"
            >
              <Modal.Title
                style={{
                  fontSize: 30,
                  fontWeight: "bold",
                  color: "orange",
                  textAlign: "center",
                }}
              >
                แก้ไขข้อมูลกิจกรรม
              </Modal.Title>
              <Modal.Body className="modal-body-scroll">
                <Form>
                  <Form.Group controlId="activityPlace">
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
                      วันที่เข้าร่วมกิจกรรม:{" "}
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
                  <Form.Group controlId="activityPlace">
                    <Form.Label>สถานที่จัดกิจกรรม:</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={edit?.activity_place}
                      onChange={(e) => setActivityPlace(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group controlId="activityPlace">
                    <Form.Label>
                      ตำแหน่งหน้าที่ที่ได้รับมอบหมายและปฏิบัติ :
                    </Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={edit?.activity_position}
                      onChange={(e) => setActivityPosition(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group controlId="activityTarget" className="form-group">
                    <Form.Label>
                      กลุ่มเป้าหมายของกิจกรรม{" "}
                      <span style={{ color: "red" }}>*</span>
                    </Form.Label>
                    {checkboxOptions.map((option) => (
                      <div key={option.value}>
                        <Form.Check
                          style={{ fontSize: 22 }}
                          type="checkbox"
                          label={option.label}
                          checked={activityTarget.includes(option.value)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;

                            setActivityTarget((prevActivityTarget) => {
                              if (isChecked) {
                                return [...prevActivityTarget, option.value];
                              } else {
                                return prevActivityTarget.filter(
                                  (target) => target !== option.value
                                );
                              }
                            });
                          }}
                        />
                      </div>
                    ))}
                  </Form.Group>
                  <div className="form-group" style={{ fontWeight: "bold" }}>
                    <Form.Label>
                      จำนวนชั่วโมงที่ทำกิจกรรม:{" "}
                      {edit?.activity_hours && (
                        <span style={{ color: "green" }}>
                          {edit?.activity_hours > 6 ? 6 : edit?.activity_hours}{" "}
                          ชั่วโมง{" "}
                        </span>
                      )}
                      {activityHours != null && (
                        <span style={{ color: "blue" }}>
                          {activityHours > 6 ? 6 : activityHours} ชั่วโมง
                          (เวลาใหม่)
                        </span>
                      )}
                    </Form.Label>
                  </div>
                  <Form.Group
                    style={{ marginLeft: 25, fontSize: 20 }}
                    controlId="activity_hours"
                    className="form-group"
                  >
                    เวลาเริ่มทำกิจกรรม <span style={{ color: "red" }}>*</span>
                    <TimePicker
                      showSecond={false}
                      defaultValue={moment(edit?.start_time, "HH:mm") || null}
                      onChange={(time) => handleTimeChange(time, "start", edit)}
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
                      defaultValue={moment(edit?.end_time, "HH:mm") || null}
                      onChange={(time) => handleTimeChange(time, "end", edit)}
                      style={{ fontFamily: "sans-serif" }}
                    />
                  </Form.Group>
                  <Form.Label>รูปภาพกิจกรรมกิจกรรม</Form.Label>
                  <div
                    style={{
                      display: "flex",
                      gap: "20px",
                      flexWrap: "wrap",
                      marginTop: 20,
                    }}
                  >
                    {[...activityPictures].map((picture, index) => (
                      <div key={index} style={{ position: "relative" }}>
                        <img
                          src={
                            typeof picture === "string"
                              ? picture
                              : URL.createObjectURL(picture)
                          }
                          alt="activity picture"
                          style={{
                            width: 200,
                            height: 200,
                            borderRadius: 10,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 15 }}>
                    <Form.Label>เอกสารยืนยัน: </Form.Label>
                    <Button
                      style={{
                        cursor: "pointer",
                        marginLeft: 10,
                      }}
                      onClick={() => handleClickPDF(edit)}
                      className="btn btn-secondary"
                    >
                      ดูเอกสาร
                    </Button>
                  </div>
                  <Form.Group controlId="activityDocument">
                    <div style={{ pointerEvents: "none" }}>
                      <Form.Label>เลือกเอกสารใหม่ (.pdf) </Form.Label>
                    </div>

                    <Form.Control
                      type="file"
                      accept="application/pdf"
                      name="activity_document"
                      onChange={(e) => setActivityDocument(e.target.files[0])}
                    />
                  </Form.Group>{" "}
                  <div>
                    <Form.Label>เลือกรูปภาพใหม่</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      multiple
                      name="activity_pictures" // add this line
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "20px",
                      flexWrap: "wrap",
                      marginTop: 20,
                    }}
                  >
                    {[...selectedImages].map((picture, index) => (
                      <div key={index} style={{ position: "relative" }}>
                        <img
                          src={
                            typeof picture === "string"
                              ? picture
                              : URL.createObjectURL(picture)
                          }
                          alt="activity picture"
                          style={{
                            width: 200,
                            height: 200,
                            borderRadius: 10,
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            background: "rgba(255, 255, 255, 0.8)",
                            borderRadius: "50%",
                            padding: 5,
                            cursor: "pointer",
                          }}
                          onClick={() => handleDeletePicture(index)}
                        >
                          <Delete />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p style={{ marginTop: 20, fontSize: 22 }}>
                    <strong
                      style={{
                        color: "red",
                        display:
                          !edit?.check_activity ||
                          edit?.check_activity === "ผ่าน"
                            ? "none"
                            : "inline",
                      }}
                    >
                      เหตุผลที่ต้องแก้ไข:
                    </strong>{" "}
                    {edit?.check_activity === "ผ่าน"
                      ? null
                      : edit?.check_activity}
                  </p>
                  <p style={{ marginTop: 20, fontSize: 22 }}>
                    <strong
                      style={{
                        color: "red",
                        display:
                          (!edit?.check_activity || edit?.check_fail == null) &&
                          !edit?.check_fail
                            ? "none"
                            : "inline",
                      }}
                    >
                      เหตุผลที่ไม่ผ่าน:
                    </strong>{" "}
                    {edit?.check_activity === "ผ่าน" ? null : edit?.check_fail}
                  </p>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  className="btn btn-success btn-save"
                  onClick={() => updateOutsideConfirm(edit)}
                >
                  บันทึก
                </Button>
                <Button
                  className="btn btn-secondary"
                  onClick={() => handleHideModal()}
                >
                  ปิด
                </Button>
              </Modal.Footer>
            </Modal>
          ))}
        {editInsideForm &&
          studentForm &&
          editInsideForm.map((edit) => (
            <Modal show={showEditInsideModal} className="thai-font">
              <Modal.Title
                style={{
                  fontSize: 30,
                  fontWeight: "bold",
                  color: "orange",
                  textAlign: "center",
                }}
              >
                แก้ไขข้อมูลกิจกรรม
              </Modal.Title>
              <Modal.Body>
                <Form>
                  <Form.Group controlId="activityPosition">
                    <Form.Label>
                      ภาระหน้าที่ที่ได้รับมอบหมาย:{" "}
                      <span style={{ color: "red" }}>*</span>{" "}
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      defaultValue={edit?.activity_position}
                      onChange={(e) => setActivityPosition(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group
                    controlId="activitySelectedDate"
                    className="form-group"
                    style={{ fontSize: 20 }}
                  >
                    <p>
                      <strong>
                        วันที่ปฏิบัติกิจกรรม:{" "}
                        <span style={{ color: "red" }}>*</span>{" "}
                      </strong>{" "}
                      {(() => {
                        const startDate = moment(edit?.activity_date);
                        const endDate = moment(edit?.last_date);
                        const diffDays = endDate.diff(startDate, "days") + 1;
                        const dates = [];
                        for (let i = 0; i < diffDays; i++) {
                          const date =
                            moment(startDate).add(i, "days").format("D MMMM ") +
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

                          // Check if the current date is in the edit data
                          const editData = JSON.parse(
                            edit?.activity_time_period || "[]"
                          );
                          const isEditData = editData.some(
                            (data) => data.activityDate?.date === date
                          );

                          const activityData = editData.find(
                            (data) => data.activityDate?.date === date
                          );

                          const editStartTime =
                            activityData?.activityDate?.startTime;
                          const editEndTime =
                            activityData?.activityDate?.endTime;

                          return (
                            <div key={index}>
                            <input
                              style={{ marginLeft: 10, cursor: "pointer" }}
                              type="checkbox"
                              id={`date-${index}`}
                              name={`date-${index}`}
                              value={date}
                              checked={isChecked || isEditData}
                              onChange={(event) => {
                                const isChecked = event.target.checked;
                                if (isChecked) {
                                  setSelectedDates([...selectedDates, date]);
                                  setActivityTimes([
                                    ...activityTimes,
                                    { start_time: null, end_time: null },
                                  ]);
                                } else {
                                  setSelectedDates(selectedDates.filter((d) => d !== date));
                                  setActivityTimes(activityTimes.filter((t, i) => i !== index));
                                }
                              }}
                            />
                            <label style={{ marginLeft: 10, marginTop: 10 }} htmlFor={`date-${index}`}>
                              {date}
                              {": "}
                              {activityData && (
                                <span style={{ color: "green" }}>
                                  จำนวนชั่วโมง: {activityData.activityDate?.hoursPerDay}
                                </span>
                              )}
                          
                              {times && times.start_time && times.end_time && (
                                <span style={{ color: "blue" }}>
                                  จำนวนชั่วโมง: {calculateHours(times.start_time, times.end_time)} (เวลาใหม่)
                                </span>
                              )}
                            </label>
                          
                              {(isChecked || isEditData) && (
                                <div
                                  style={{
                                    marginLeft: 25,
                                    display: "flex",
                                    flexDirection: "row",
                                  }}
                                >
                                  <div>เวลาเริ่ม </div>
                                  <TimePicker
                                    showSecond={false}
                                    minuteStep={10}
                                    defaultValue={
                                      editStartTime
                                        ? moment(editStartTime, "HH:mm")
                                        : null
                                    }
                                    onChange={(time) =>
                                      handleDateTimeChange(
                                        time,
                                        "start_time",
                                        index,
                                      )
                                    }
                                    style={{
                                      fontFamily: "sans-serif",
                                      width: 100,
                                    }}
                                  />
                                  <div style={{ marginLeft: 20 }}>
                                    เวลาสิ้นสุด{" "}
                                  </div>
                                  <TimePicker
                                    showSecond={false}
                                    minuteStep={10}
                                    defaultValue={
                                      editEndTime
                                        ? moment(editEndTime, "HH:mm")
                                        : null
                                    }
                                    onChange={(time) =>
                                      handleDateTimeChange(time, "end_time", index)
                                    }
                                    style={{
                                      fontFamily: "sans-serif",
                                      width: 100,
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </p>
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
                        value={edit?.activity_hours}
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Label>รูปภาพกิจกรรมกิจกรรม</Form.Label>
                  <div
                    style={{
                      display: "flex",
                      gap: "20px",
                      flexWrap: "wrap",
                      marginTop: 20,
                    }}
                  >
                    {[...activityPictures].map((picture, index) => (
                      <div key={index} style={{ position: "relative" }}>
                        <img
                          src={
                            typeof picture === "string"
                              ? picture
                              : URL.createObjectURL(picture)
                          }
                          alt="activity picture"
                          style={{
                            width: 200,
                            height: 200,
                            borderRadius: 10,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <Form.Label>เลือกรูปภาพใหม่</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      multiple
                      name="activity_pictures" // add this line
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "20px",
                      flexWrap: "wrap",
                      marginTop: 20,
                    }}
                  >
                    {[...selectedImages].map((picture, index) => (
                      <div key={index} style={{ position: "relative" }}>
                        <img
                          src={
                            typeof picture === "string"
                              ? picture
                              : URL.createObjectURL(picture)
                          }
                          alt="activity picture"
                          style={{
                            width: 200,
                            height: 200,
                            borderRadius: 10,
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            background: "rgba(255, 255, 255, 0.8)",
                            borderRadius: "50%",
                            padding: 5,
                            cursor: "pointer",
                          }}
                          onClick={() => handleDeletePicture(index)}
                        >
                          <Delete />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p style={{ marginTop: 20, fontSize: 22 }}>
                    <strong
                      style={{
                        color: "red",
                        display:
                          !edit?.check_activity ||
                          edit?.check_activity === "ผ่าน"
                            ? "none"
                            : "inline",
                      }}
                    >
                      เหตุผลที่ต้องแก้ไข:
                    </strong>{" "}
                    {edit?.check_activity === "ผ่าน"
                      ? null
                      : edit?.check_activity}
                  </p>

                  <p style={{ marginTop: 20, fontSize: 22 }}>
                    <strong
                      style={{
                        color: "red",
                        display:
                          (!edit?.check_activity || edit?.check_fail == null) &&
                          !edit?.check_fail
                            ? "none"
                            : "inline",
                      }}
                    >
                      เหตุผลที่ไม่ผ่าน:
                    </strong>{" "}
                    {edit?.check_activity === "ผ่าน" ? null : edit?.check_fail}
                  </p>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  className="btn btn-success"
                  onClick={() => updateBloodConfirm(edit)}
                >
                  บันทึก
                </Button>
                <Button
                  className="btn btn-secondary"
                  onClick={() => handleHideModal()}
                >
                  ปิด
                </Button>
              </Modal.Footer>
            </Modal>
          ))}
        {loading && (
          <div>
            <Loader className="thai-font" />
          </div>
        )}{" "}
      </div>
    </>
  );
};

export default Student_Dashboard;

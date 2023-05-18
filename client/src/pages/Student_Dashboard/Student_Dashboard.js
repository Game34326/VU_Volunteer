import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import CryptoJS from "crypto-js";
import { Button, Table, Navbar, Container, Image } from "react-bootstrap";
import "./student_dashboard.css";
import Swal from "sweetalert2";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

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
  const [activityType, setActivityType] = useState(
    "กิจกรรมโดยคณะวิชา ศูนย์ สำนัก"
  );
  const [studentImage, setStudentImage] = useState("");
  const [selectedStudentTotalHours, setSelectedStudentTotalHours] =
    useState(null);

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
  const location = useLocation();
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    era: "short",
    eraYear: "numeric",
  };
  const currentDate = new Date().toLocaleDateString("th-TH", options);

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
          `http://localhost:3333/student_form?student_id=${user_id}&activity_type=${activityType}`
        );
        const data = await response.json();
        setStudentForm(data);
        console.log(data);

        const imageResponse = await fetch(
          `http://appz.vu.ac.th:8989/VuAPIVer1/select_student_image.php?stuid=${user_id}`
        );
        const imageData = await imageResponse.json();
        setStudentImage(imageData);

        const totalHours = await fetch(
          `http://localhost:3333/student_total_hours?student_id=${user_id}`
        );
        const json = await totalHours.json();
        const total_hours = Number(json[0].total_hours);
        setSelectedStudentTotalHours(total_hours);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [activityType]);

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
        await fetch(`http://localhost:3333/student_form/${s_id}`, {
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

  async function handleClickPicture(s_id) {
    if (!s_id) {
      console.error("Invalid s_id parameter");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3333/activity_pictures/${s_id}`
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
          text: `เป็นนักศึกษาระดับปริญญาตรี ${fac_name} สาขา${maj_name}`,
          style: "detail1",
          alignment: "center",
          margin: [0, 0, 0, 5],
        },
        {
          text: `ได้เข้าร่วมกิจกรรมเพื่อประโยชน์ต่อสังคมและสาธารณะ(จิตอาสา) ระหว่างศึกษาจำนวน ${selectedStudentTotalHours} ชั่วโมง`,
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
                  text: "ดร.ณัฐวัฒม์  วงษ์ชวลิตกุล",
                  margin: [0, 0, 0, 10],
                  style: "sign",
                  alignment: "center",
                },
                {
                  text: "อธิการบดี",
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

    pdfMake.createPdf(docDefinition).download("เกียรติบัตรจิตอาสา.pdf");
  };

  function toggleSidebar() {
    const sidebar = document.querySelector(".sidebar");
    const icon = document.querySelector(".navbar-toggler-icon");

    sidebar.classList.toggle("active");
    icon.classList.toggle("open");
  }

  function handleClickPDF(studentForm) {
    // Convert the data to a Uint8Array
    const pdfData = new Uint8Array(studentForm.activity_document.data);
  
    // Convert the data to a Blob
    const pdfBlob = new Blob([pdfData], { type: 'application/pdf' });
  
    // Create a URL for the Blob
    const pdfUrl = URL.createObjectURL(pdfBlob);
  
    // Open the PDF file in a new tab
    window.open(pdfUrl, '_blank');
  }
  
  
  

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
              className="logout-button thai-font"
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
              <ul className="list-unstyled thai-font" style={{ fontSize: 22 }}>
                <li>
                  <button
                    className={`btn btn-outline ${
                      activityType === "กิจกรรมโดยคณะวิชา ศูนย์ สำนัก"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setActivityType("กิจกรรมโดยคณะวิชา ศูนย์ สำนัก")
                    }
                  >
                    กิจกรรมโดยคณะวชา ศูนย์ สำนัก
                  </button>
                </li>
                <li>
                  <button
                    className={`btn btn-outline ${
                      activityType === "กิจกรรมการบริจาคโลหิต" ? "active" : ""
                    }`}
                    onClick={() => setActivityType("กิจกรรมการบริจาคโลหิต")}
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
                    onClick={() =>
                      setActivityType("กิจกรรมอบรมออนไลน์จิตสาธารณะ กยศ.")
                    }
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
                    onClick={() =>
                      setActivityType("กิจกรรมจิตอาสาเข้าร่วมด้วยตนเอง")
                    }
                  >
                    กิจกรรมจิตอาสาเข้าร่วมด้วยตนเอง
                  </button>
                </li>

                <li className="logout-btn">
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
          <p className="thai-font ">
            รหัสนักศึกษา:{" "}
            <span style={{ color: "green", fontWeight: "bold" }}>
              {user_id}
            </span>
          </p>
          <p className="thai-font">
            ชื่อ-นามสกุล:{" "}
            <span style={{ color: "green", fontWeight: "bold" }}>
              {fullname}
            </span>
          </p>
          {selectedStudentTotalHours !== null && (
            <p className="thai-font">
              จำนวนชั่วโมงกิจกรรมทั้งหมด:{" "}
              <span style={{ color: "green", fontWeight: "bold" }}>
                {selectedStudentTotalHours} {""} ชั่วโมง
              </span>
            </p>
          )}
          {selectedStudentTotalHours >= 10 && (
            <Button
              onClick={() => generateCertificate()}
              variant="success"
              className="thai-font"
              style={{ padding: 0, fontSize: 20 }}
            >
              พิมพ์ใบเกียรติบัตร
            </Button>
          )}
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
        <div className="table-header">
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
                <th> ตำแหน่งหน้าที่</th>
                <th>รูปภาพ</th>
                <th>จำนวนชั่วโมง</th>
                <th>สถานะ</th>
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
                      {studentForm.picture_count}
                    </p>
                  </td>
                  <td>{studentForm.activity_hours}</td>
                  <td>รอพิจารณา</td>
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
        <div className="table-header">
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
                  <td>รอพิจารณา</td>
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
        <div className="table-header">
          <Table striped bordered hover style={{ maxWidth: "100%" }}>
            <thead className="thai-font" style={{ fontSize: 20 }}>
              <tr>
                <th>#</th>
                <th>ชื่อกิจกรรม</th>
                <th>ภาคเรียน</th>
                <th>วันที่เข้าร่วมกิจกรรม</th>
                <th>เอกสารยืนยัน</th>
                <th>ระยะเวลาที่ทำกิจกรรม</th>
                <th>จำนวนชั่วโมง</th>
                <th>สถานะ</th>
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
                  <td>รอพิจารณา</td>
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
        <div className="table-header">
          <Table striped bordered hover style={{ maxWidth: "100%" }}>
            <thead className="thai-font" style={{ fontSize: 20 }}>
              <tr>
                <th>#</th>
                <th>ภาคเรียน</th>
                <th>รูปภาพกิจกรรมกิจกรรม</th>
                <th>จำนวนชั่วโมง</th>
                <th>สถานะ</th>
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
                  <td>รอพิจารณา</td>
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

      <div className="image-container">
        {activityPictures.map((pictureData, index) => (
          <img key={index} src={pictureData} alt="" />
        ))}
      </div>
    </div>
  );
};

export default Student_Dashboard;

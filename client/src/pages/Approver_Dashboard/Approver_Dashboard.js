import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
import { Button, Table, Navbar, Container, Modal, Form } from "react-bootstrap";
import "./approver_dashboard.css";
import Swal from "sweetalert2";
import { Box, Typography } from "@mui/material";
import { School, Person, Bloodtype, Wifi, Print } from "@mui/icons-material";

const Approver_Dashboard = () => {
  const [countInside, setCountInside] = useState("");
  const [countOutside, setCountOutside] = useState("");
  const [countBlood, setCountBlood] = useState("");
  const [countOnline, setCountOnline] = useState("");
  const [user_id, setUser_id] = useState("");
  const [fullname, setFullname] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [activityYearExcel, setActivityYearExcel] = useState(null);
  const [activityTypeExcel, setActivityTypeExcel] = useState(null);

  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const ciphertext = params.get("q");
  const navigate = useNavigate();
  const hostName = "192.168.0.119:3333";

  useEffect(() => {
    if (ciphertext) {
      try {
        const decryptedBytes = CryptoJS.AES.decrypt(
          ciphertext,
          "secret key 123"
        );
        const decryptedPlaintext = decryptedBytes.toString(CryptoJS.enc.Utf8);
        const plaintext = JSON.parse(decryptedPlaintext);
        // Update the state variables
        setUser_id(plaintext.user_id);
        setFullname(plaintext.fullname);
      } catch (error) {
        console.error("Error decrypting and parsing ciphertext:", error);
      }
    }
  }, [ciphertext]);

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

  useEffect(() => {
    const fetchActivityCounts = async () => {
      try {
        const response = await fetch(`http://${hostName}/activity_counts`);
        const data = await response.json();
        setCountInside(data.totalInside);
        setCountOutside(data.outsideNumber);
        setCountBlood(data.bloodNumber);
        setCountOnline(data.onlineNumber);
      } catch (error) {
        console.error(error);
      }
    };

    fetchActivityCounts();
  }, [countInside, countOnline, countBlood, countOutside]);

  const handleShowExport = () => {
    setShowExportModal(true);
  };

  const handleExportTerm = async () => {
    if (!activityYearExcel) {
      console.error("Error submitting form");
      Swal.fire({
        icon: "error",
        text: "กรุณาเลือกปีการศึกษาที่ต้องการพิมพ์รายงาน",
      });
    } else {
      try {
        const response = await fetch(
          `http://${hostName}/export-term-to-excel?activityYearExcel=${activityYearExcel}`
        );
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "ภาพรวมจิตอาสาประจำเทอม.xlsx";
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

  const handleExportYear = async () => {
    if (!activityYearExcel) {
      console.error("Error submitting form");
      Swal.fire({
        icon: "error",
        text: "กรุณาเลือกปีการศึกษาที่ต้องการพิมพ์รายงาน",
      });
    } else {
      try {
        const response = await fetch(
          `http://${hostName}/export-year-to-excel?activityYearExcel=${activityYearExcel}`
        );
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "ภาพรวมจิตอาสาประจำปี.xlsx";
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
                VU Volunteer Checker
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

      <h1
        style={{
          textAlign: "center",
          marginTop: 80,
          fontSize: 35,
          fontWeight: "bold",
        }}
        className="thai-font"
      >
        ระบบบันทึกจิตอาสา สำหรับผู้พิจารณา
      </h1>
      <p className="nameText thai-font" style={{ fontSize: 25 }}>
        รหัสบุคลากร:{" "}
        <span style={{ color: "green", fontWeight: "bold" }}>{user_id}</span>
      </p>
      <p className="nameText thai-font" style={{ fontSize: 25 }}>
        ชื่อ-นามสกุล:{" "}
        <span style={{ color: "green", fontWeight: "bold" }}>{fullname}</span>
      </p>
      <div className="button-container" style={{ textAlign: "center" }}>
        <Button
          className="btn btn-success thai-font"
          style={{ fontSize: 18 }}
          onClick={() => handleShowExport()}
        >
          <Print /> พิมพ์รายงานภาพรวม
        </Button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 50,
          marginBottom: 50,
        }}
        className="thai-font box-responsive"
      >
        <Box
          sx={{
            position: "relative",
            width: 200,
            height: 200,
            borderRadius: 10,
            cursor: "pointer",
            backgroundColor: "primary.dark",
            "&:hover": {
              backgroundColor: "primary.main",
              opacity: [0.9, 0.8, 0.7],
            },
            marginRight: 40,
            textAlign: "center",
          }}
          onClick={() =>
            navigate("/activity_inside?q=" + encodeURIComponent(ciphertext))
          }
        >
          {countInside !== 0 && (
            <Typography
              variant="h6"
              sx={{
                position: "absolute",
                top: 10,
                right: 10,
                color: countInside ? "white" : "black",
                backgroundColor: countInside ? "red" : "transparent",
                borderRadius: 5,
                padding: "2px 6px",
                zIndex: 1,
              }}
            >
              {countInside}
            </Typography>
          )}
          <School sx={{ fontSize: 80, color: "white", marginTop: 2 }} />
          <Typography
            variant="h5"
            sx={{
              color: "white",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "50%",
              fontFamily: "TH Sarabun, sans-serif",
              fontSize: 22,
            }}
            className="thai-font"
          >
            กิจกรรมที่จัดขึ้นโดย คณะวิชา ศูนย์ สำนักของมหาวิทยาลัย{" "}
          </Typography>
        </Box>

        <Box
          sx={{
            position: "relative",
            width: 200,
            height: 200,
            borderRadius: 10,
            cursor: "pointer",
            backgroundColor: "success.dark",
            "&:hover": {
              backgroundColor: "success.main",
              opacity: [0.9, 0.8, 0.7],
            },
            textAlign: "center",
          }}
          onClick={() =>
            navigate("/activity_outside?q=" + encodeURIComponent(ciphertext))
          }
        >
          {countOutside !== 0 && (
            <Typography
              variant="h6"
              sx={{
                position: "absolute",
                top: 10,
                right: 10,
                color: countOutside ? "white" : "black",
                backgroundColor: countOutside ? "red" : "transparent",
                borderRadius: 5,
                padding: "2px 6px",
                zIndex: 1,
              }}
            >
              {countOutside}
            </Typography>
          )}
          <Person sx={{ fontSize: 80, color: "white", marginTop: 2 }} />
          <Typography
            variant="h5"
            sx={{
              color: "white",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "50%",
              fontFamily: "TH Sarabun, sans-serif",
              fontSize: 22,
            }}
            className="thai-font"
          >
            กิจกรรมจิตอาสาที่เข้าร่วมด้วยตนเอง
          </Typography>
        </Box>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 30,
        }}
        className="thai-font box-responsive"
      >
        <Box
          sx={{
            position: "relative",
            width: 200,
            height: 200,
            borderRadius: 10,
            cursor: "pointer",
            backgroundColor: "secondary.dark",
            "&:hover": {
              backgroundColor: "secondary.main",
              opacity: [0.9, 0.8, 0.7],
            },
            marginRight: 40,
            textAlign: "center",
          }}
          onClick={() =>
            navigate("/activity_blood?q=" + encodeURIComponent(ciphertext))
          }
        >
          {countBlood !== 0 && (
            <Typography
              variant="h6"
              sx={{
                position: "absolute",
                top: 10,
                right: 10,
                color: countBlood ? "white" : "black",
                backgroundColor: countBlood ? "red" : "transparent",
                borderRadius: 5,
                padding: "2px 6px",
                zIndex: 1,
              }}
            >
              {countBlood}
            </Typography>
          )}
          <Bloodtype sx={{ fontSize: 80, color: "white", marginTop: 2 }} />
          <Typography
            variant="h5"
            sx={{
              color: "white",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "50%",
              fontFamily: "TH Sarabun, sans-serif",
              fontSize: 22,
            }}
            className="thai-font"
          >
            กิจกรรมการบริจาคโลหิต{" "}
          </Typography>
        </Box>

        <Box
          sx={{
            position: "relative",
            width: 200,
            height: 200,
            borderRadius: 10,
            cursor: "pointer",
            backgroundColor: "#DCAB05",
            "&:hover": {
              backgroundColor: "#E4D003",
              opacity: [0.9, 0.8, 0.7],
            },
            textAlign: "center",
          }}
          onClick={() =>
            navigate("/activity_online?q=" + encodeURIComponent(ciphertext))
          }
        >
          {countOnline !== 0 && (
            <Typography
              variant="h6"
              sx={{
                position: "absolute",
                top: 10,
                right: 10,
                color: countOnline ? "white" : "black",
                backgroundColor: countOnline ? "red" : "transparent",
                borderRadius: 5,
                padding: "2px 6px",
                zIndex: 1,
              }}
            >
              {countOnline}
            </Typography>
          )}
          <Wifi sx={{ fontSize: 80, color: "white", marginTop: 2 }} />
          <Typography
            variant="h5"
            sx={{
              color: "white",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "50%",
              fontFamily: "TH Sarabun, sans-serif",
              fontSize: 22,
            }}
            className="thai-font"
          >
            กิจกรรมอบรมออนไลน์จิตสาธารณะ กยศ.
          </Typography>
        </Box>
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
              พิมพ์รายงานภาพรวมกิจกรรมจิตอาสา
            </Modal.Title>
            <hr />
            <Modal.Body>
              <Form>
                <Form.Label>เลือกประเภทรายงาน</Form.Label>
                <Form.Control
                  as="select"
                  name="activity_type_excel"
                  placeholder="Activity Type Excel"
                  value={activityTypeExcel}
                  onChange={(e) => setActivityTypeExcel(e.target.value)}
                >
                  <option value="">--เลือก--</option>
                  <option value="รวมผลจิตอาสาประจำเทอม">
                    รวมผลจิตอาสาประจำเทอม{" "}
                  </option>
                  <option value="รวมผลจิตอาสาประจำปี">
                    รวมผลจิตอาสาประจำปี
                  </option>
                </Form.Control>

                {activityTypeExcel === "รวมผลจิตอาสาประจำเทอม" && (
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
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <Button
                        className="btn btn-success"
                        style={{ marginTop: 20 }}
                        onClick={() => handleExportTerm()}
                      >
                        พิมพ์รายงาน
                      </Button>
                    </div>
                  </Form>
                )}

                {activityTypeExcel === "รวมผลจิตอาสาประจำปี" && (
                  <Form>
                    <Form.Label>ปีการศึกษา</Form.Label>
                    <Form.Control
                      as="select"
                      name="activity_year"
                      placeholder="Activity Year"
                      value={activityYearExcel}
                      onChange={(e) => setActivityYearExcel(e.target.value)}
                    >
                      <option value="">--เลือก--</option>
                      <option value="2566">2566</option>
                      <option value="2565">2565</option>
                    </Form.Control>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <Button
                        className="btn btn-success"
                        style={{ marginTop: 20 }}
                        onClick={() => handleExportYear()}
                      >
                        พิมพ์รายงาน
                      </Button>
                    </div>
                  </Form>
                )}
              </Form>
            </Modal.Body>
            <Modal.Footer>
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
      </div>
    </div>
  );
};

export default Approver_Dashboard;

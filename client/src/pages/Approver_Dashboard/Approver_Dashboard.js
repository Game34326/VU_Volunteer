import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
import { Button, Table, Navbar, Container } from "react-bootstrap";
import "./approver_dashboard.css";
import Swal from "sweetalert2";
import { Box, Typography } from "@mui/material";
import { School, Person, Bloodtype, Wifi } from "@mui/icons-material";

const Approver_Dashboard = () => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const ciphertext = decodeURIComponent(params.get("q"));
  const bytes = CryptoJS.AES.decrypt(ciphertext, "secret key 123");
  const plaintext = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  const [user_id] = useState(plaintext.user_id);
  const [fullname] = useState(plaintext.fullname);
  const navigate = useNavigate();

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
          onClick={() => navigate("/activity_inside")}
        >
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
          onClick={() => navigate("/approver_check")}
        >
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
          onClick={() => navigate("/approver_activity")}
        >
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
          onClick={() => navigate("/approver_check")}
        >
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
      </div>
    </div>
  );
};

export default Approver_Dashboard;

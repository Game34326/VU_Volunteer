import React, { useState } from "react";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import { Button, TextField } from "@mui/material";
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
} from "mdb-react-ui-kit";
import "./login.css";
import CryptoJS from "crypto-js";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginStatus, setLoginStatus] = useState("");

  const navigation = useNavigate();

  const handleLogin = (event) => {
    event.preventDefault(); //protect redirect
    console.warn(username, password);

    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
      username: username,
      password: password,
    });

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
      // header("Access-Control-Allow-Headers: Content-Type");
    };

    fetch(
      "http://appz.vu.ac.th:8989/VuAPIVer1/select_login.php",
      requestOptions
    )
      .then((response) => response.json())
      .then((result) => {
        console.log(result);
        if (result.status === "ok" && result.user_type === 1) {
          Swal.fire({
            icon: "success",
            title: "เข้าสู่ระบบสำเร็จ",
            showConfirmButton: false,
            timer: 1500,
            customClass: {
              title: "thai-font",
            },
          });
          localStorage.setItem("token", result.pass);
          const ciphertext = CryptoJS.AES.encrypt(
            JSON.stringify({
              fullname: result.fullname,
              user_id: result.user_id,
            }),
            "secret key 123"
          ).toString();
          const url = `/student_dashboard?q=${encodeURIComponent(ciphertext)}`;
          navigation(url);
        } else if (result.status === "ok" && result.user_type === 2) {
          Swal.fire({
            icon: "success",
            title: "เข้าสู่ระบบสำเร็จ",
            showConfirmButton: false,
            timer: 1500,
            customClass: {
              title: "thai-font",
            },
          });
          localStorage.setItem("token", result.pass);
          const ciphertext = CryptoJS.AES.encrypt(
            JSON.stringify({
              fullname: result.fullname,
              user_id: result.user_id,
            }),
            "secret key 123"
          ).toString();
          const url = `/teacher_dashboard?q=${encodeURIComponent(ciphertext)}`;
          navigation(url);
        } else {
          Swal.fire({
            icon: "error",
            text: "Username หรือ Password ไม่ถูกต้อง",
          });
          setLoginStatus(result.message);
        }
      })
      .catch((error) => console.log("error", error));
  };

  return (
    <div className="login-page">
      <MDBContainer fluid>
        <MDBRow className="d-flex justify-content-center align-items-center h-100">
          <MDBCol col="12">
            <MDBCard
              className="bg-white my-5 mx-auto"
              style={{ borderRadius: "1rem", maxWidth: "500px" }}
            >
              <MDBCardBody className="p-5 w-100 d-flex flex-column">
                <div className="text-center d-flex justify-content-center align-items-center">
                  <img
                    className="img-fluid shadow-2-strong"
                    src="https://upload.wikimedia.org/wikipedia/th/c/c4/%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%A7%E0%B8%B4%E0%B8%97%E0%B8%A2%E0%B8%B2%E0%B8%A5%E0%B8%B1%E0%B8%A2%E0%B8%A7%E0%B8%87%E0%B8%A9%E0%B9%8C%E0%B8%8A%E0%B8%A7%E0%B8%A5%E0%B8%B4%E0%B8%95%E0%B8%81%E0%B8%B8%E0%B8%A5.png"
                    alt="VU Logo"
                  />
                </div>
                <h2 className="fw-bold mb-2 text-center thai-font" style={{fontSize: 40}} >
                  ระบบบันทึกจิตอาสา
                </h2>
                <h3 className=" mb-2 text-center thai-font text-color" style={{fontSize: 36, fontWeight: "bold"}} >
                  VU Volunteer
                </h3>
                <div className="inputCon">
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="username"
                    label="ชื่อผู้ใช้"
                    name="username"
                    autoFocus
                    className="textField"
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="รหัสผ่าน"
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    className="textField"
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <Button
                    variant="contained"
                    startIcon={<LockOpenRoundedIcon />}
                    className="loginBtn thai-font"
                    style={{ marginTop: 20, fontFamily: "'TH Sarabun', sans-serif", fontSize: 24, alignItems: "center", justifyContent: "center" }}
                    onClick={handleLogin}
                  >
                    เข้าสู่ระบบ
                  </Button>
                  {loginStatus && (
                    <div style={{ marginTop: 20, color: "red" }}>
                      {loginStatus}
                    </div>
                  )}
                </div>

                <hr className="my-4" />
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </div>
  );
}

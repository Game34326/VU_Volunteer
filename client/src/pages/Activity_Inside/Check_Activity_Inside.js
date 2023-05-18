import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
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
import Swal from "sweetalert2";
import { Menu, HighlightOffRounded } from "@mui/icons-material";
import "./activity_inside.css";

const Check_Activity_Inside = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const goback = () => {
    navigate(-1);
  };

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
            </Container>
          </Navbar>
        </div>

        <div className="sidebar">
          <p
            className="thai-font"
            style={{
              fontSize: 24,
              fontWeight: "bold",
              borderBottom: "1px solid black",
            }}
          >
            กิจกรรมจัดขึ้นโดยคณะ ศูนย์ สำนักของมหาวิทยาลัย
          </p>
          <ul className="list-unstyled thai-font" style={{ fontSize: 22 }}>
            <li
              className={
                location.pathname === "/activity_inside" ? "active" : ""
              }
            >
              <Link to="/activity_inside">อนุมัติกิจกรรม</Link>
            </li>
            <li
              className={
                location.pathname === "/check_activity_inside" ? "active" : ""
              }
            >
              <Link to="/check_activity_inside">ตรวจสอบกิจกรรมนักศึกษา</Link>
            </li>
            <li style={{ cursor: "pointer" }}>
              <Link onClick={() => goback()}>หน้าแรก</Link>
            </li>
          </ul>
        </div>

        <div className="content">
          <h1
            style={{
              textAlign: "center",
              marginTop: 10,
              fontSize: 40,
              fontWeight: "bold",
            }}
            className="thai-font"
          >
            อนุมัติกิจกรรม
          </h1>
        </div>
      </div>
    </>
  );
};

export default Check_Activity_Inside;

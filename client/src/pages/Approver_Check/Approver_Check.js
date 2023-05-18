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
import { Box, Typography } from "@mui/material";
import "./approver_check.css";
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

const Approver_Check = () => {
  const [activityYear, setActivityYear] = useState("");
  const [activityType, setActivityType] = useState("");
  const [studentForm, setStudentForm] = useState([]);

  useEffect(() => {
    // Make a GET request to retrieve the data from the server
    fetch(`http://localhost:3333/display_student_activity?activity_type=${activityType}&activity_year=${activityYear}`)
      .then((response) => response.json())
      .then((data) => {
        setStudentForm(data);
        console.log(data)
      })
      .catch((error) => console.error(error));
  }, [activityType, activityYear]);

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
                <span style={{ fontWeight: "bold", color: "black" }}>
                  VU Volunteer
                </span>
              </Navbar.Brand>
            </Container>
          </Navbar>
        </div>
        <h1
          style={{
            textAlign: "center",
            marginTop: 10,
            fontSize: 40,
            fontWeight: "bold",
          }}
          className="thai-font"
        >
          พิจารณากิจกรรมนักศึกษา
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
            </Form.Group>

            <Form.Group controlId="activityType" className="form-group">
              <Form.Label>เลือกประเภทกิจกรรม</Form.Label>
              <Form.Control
                as="select"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
              >
                <option value="">-- เลือก --</option>
                <option value="กิจกรรมโดยคณะวิชา ศูนย์ สำนัก">
                  กิจกรรมโดยคณะวิชา ศูนย์ สำนัก
                </option>
                <option value="กิจกรรมจิตอาสาเข้าร่วมด้วยตนเอง">
                  กิจกรรมจิตอาสาเข้าร่วมด้วยตนเอง{" "}
                </option>
                <option value="กิจกรรมการบริจาคโลหิต">
                  กิจกรรมการบริจาคโลหิต
                </option>
                <option value="กิจกรรมอบรมออนไลน์จิตสาธารณะ กยศ.">
                  กิจกรรมอบรมออนไลน์จิตสาธารณะ กยศ.
                </option>
              </Form.Control>
            </Form.Group>
          </Form>   
        </div>
        {/* <Table striped bordered hover responsive className="table-responsive">
          <thead className="thai-font">
            <tr>
              <th>#</th>
              <th>รหัสนักศึกษา</th>
              <th>ชื่อนักศึกษา</th>
              <th>ชื่อกิจกรรม</th>
              <th>ภาคเรียน</th>
              <th>วันที่จัดกิจกรรม</th>
              <th>{""}</th>
            </tr>
          </thead>
          <tbody
            className="thai-font"
            style={{
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {studentForm.map((student, index) => (
              <tr key={student.id}>
                <td>{index + 1}</td>
                <td> {student.student_id} </td>
                <td>{student.student_name}</td>
                <td>{student.activity_name}</td>
                <td>{student.activity_year}</td>
                <td>
                  {new Date(student.activity_date).toLocaleDateString(
                    "th-TH",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }
                  )}
                </td>{" "}
                <td>
                  <Button
                    variant="success"
                    // onClick={() => handleShowModal(teacherForm)}
                    style={{ padding: 1, fontSize: 20 }}
                  >
                    ตรวจสอบ
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>   */}
      </div>
    </>
  );
};

export default Approver_Check;

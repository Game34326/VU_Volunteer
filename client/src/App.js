import React from 'react'
import Login from './pages/Login/Login';
import Student_Dashboard from './pages/Student_Dashboard/Student_Dashboard';
import Student_Form from './pages/Student_Form/Student_Form';
import Teacher_Dashboard from './pages/Teacher_Dashboard/Teacher_Dashboard';
import Teacher_Form from './pages/Teacher_Form/Teacher_Form';
import Approver_Dashboard from './pages/Approver_Dashboard/Approver_Dashboard';
import './App.css'
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Activity_Inside from './pages/Activity_Inside/Activity_Inside';
import Check_Activity_Inside from './pages/Activity_Inside/Check_Activity_Inside';


const App = () => {
  return (
    <Router>
      <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/student_dashboard" element={<Student_Dashboard />} />
      <Route path="/student_form" element={<Student_Form />} />
      <Route path="/teacher_dashboard" element={<Teacher_Dashboard />} />
      <Route path="/teacher_form" element={<Teacher_Form />} />
      <Route path="/approver_dashboard" element={<Approver_Dashboard />} />
      <Route path="/activity_inside" element={<Activity_Inside />} />
      <Route path="/check_activity_inside" element={<Check_Activity_Inside />} />
      </Routes>
    </Router>
  )
}

export default App
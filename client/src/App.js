import React from 'react'
import Login from './pages/Login/Login';
import Student_Dashboard from './pages/Student_Dashboard/Student_Dashboard';
import Student_Form from './pages/Student_Form/Student_Form';
import Teacher_Dashboard from './pages/Teacher_Dashboard/Teacher_Dashboard';
import Teacher_Form from './pages/Teacher_Form/Teacher_Form';
import './App.css'
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";


const App = () => {
  return (
    <Router>
      <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/student_dashboard" element={<Student_Dashboard />} />
      <Route path="/student_form" element={<Student_Form />} />
      <Route path="/teacher_dashboard" element={<Teacher_Dashboard />} />
      <Route path="/teacher_form" element={<Teacher_Form />} />
      </Routes>
    </Router>
  )
}

export default App
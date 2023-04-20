var sql = require("mssql");
var express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
var multer = require("multer");
var fs = require("fs");

const app = express();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image and pdf files are allowed"));
    }
  },
});

app.use(cors());
app.use(bodyParser.json());
app.use(function (req, res, next) {
  next();
});
app.use(express.urlencoded({ extended: true }));

app.listen(3333, () => {
  console.log("Start server at port 3333");
});

var config = {
  user: "sa",
  password: "343263",
  server: "LAPTOP-OVDCHV44",
  database: "vu_volunteer",
  options: {
    encrypt: false,
    enableArithAbort: true,
  },
};

const pool = new sql.ConnectionPool(config);

pool.connect((err) => {
  if (err) {
    console.error(err);
  } else {
    console.log("Connected to SQL Server database");
  }
});

app.post(
  "/teacher_form",
  upload.single("activity_picture"),
  async (req, res) => {
    try {
      const {
        activity_name,
        activity_year,
        activity_date,
        teacher_id,
        teacher_name,
        last_date,
        activity_place,
      } = req.body;
      let pictureContent = null;
      if (req.file) {
        const picture = req.file;
        pictureContent = fs.readFileSync(picture.path);
        fs.unlinkSync(picture.path);
      }

      const pool = await sql.connect(config);

      await pool
        .request()
        .input("activity_name", sql.VarChar, activity_name)
        .input("activity_year", sql.VarChar, activity_year)
        .input("activity_date", sql.VarChar, activity_date)
        .input("teacher_id", sql.VarChar, teacher_id)
        .input("teacher_name", sql.VarChar, teacher_name)
        .input("last_date", sql.VarChar, last_date)
        .input("activity_place", sql.VarChar, activity_place)
        .input("activity_picture", sql.VarBinary, pictureContent)
        .query(
          "INSERT INTO teacher_form (activity_name, activity_year, activity_date, teacher_id, teacher_name, last_date, activity_place, activity_picture) VALUES (@activity_name, @activity_year, @activity_date, @teacher_id, @teacher_name, @last_date, @activity_place, @activity_picture)"
        );

      res.status(200).send("Form submitted successfully!");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error submitting form");
    }
  }
);

app.get("/teacher_form", async (req, res) => {
  try {
    // Open a database connection from the connection pool
    const connection = await pool.connect();

    // Get the teacher_id from the query string
    const teacherId = req.query.teacher_id;

    // Select all data from the teacher_form table where teacher_id matches
    const result = await connection.query(
      `SELECT t_id, activity_name, activity_year, activity_date, teacher_id, teacher_name, last_date, activity_place FROM teacher_form WHERE teacher_id = ${teacherId}`
    );

    // Loop through each row in the result and query for the participant count
    const teacherForm = [];
    for (const row of result.recordset) {
      const participantResult = await connection.query(
        `SELECT COUNT(*) as participant_count FROM student_form WHERE t_id = '${row.t_id}'`
      );
      const participantCount = participantResult.recordset[0].participant_count;

      // Add the participant count to the current row
      row.participant_count = participantCount;

      // Add the current row to the teacherForm array
      teacherForm.push(row);
    }

    // Close the database connection
    await connection.close();

    // Send the data back to the client as a response
    res.status(200).json(teacherForm);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving data");
  }
});

app.get("/teacher_form_display", async (req, res) => {
  try {
    // Open a database connection from the connection pool
    const connection = await pool.connect();

    const activityYear = req.query.activity_year;

    // Select all data from the teacher_form table where activity_year matches
    const result = await connection.query(
      `SELECT * FROM teacher_form WHERE activity_year = '${activityYear}'`
    );

    // Convert the binary image data to base64-encoded strings
    const data = result.recordset.map((row) => ({
      ...row,
      activity_picture: row.activity_picture
        ? Buffer.from(row.activity_picture).toString("base64")
        : null,
    }));

    // Close the database connection
    await connection.close();

    // Send the data back to the client as a response
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving data");
  }
});

app.post(
  "/student_form",
  upload.fields([
    { name: "activity_pictures", maxCount: 10 },
    { name: "activity_document", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        activity_name,
        activity_year,
        activity_date,
        activity_hours,
        activity_type,
        activity_target,
        activity_position,
        student_id,
        student_name,
        fac_name,
        maj_name
      } = req.body;
      const pictures = req.files["activity_pictures"];
      const pdfFile = req.files["activity_document"][0];
      const pdfContent = fs.readFileSync(pdfFile.path);

      const pool = await sql.connect(config);

      const result = await pool
        .request()
        .input("activity_name", sql.VarChar, activity_name)
        .input("activity_year", sql.VarChar, activity_year)
        .input("activity_date", sql.VarChar, activity_date)
        .input("activity_hours", sql.VarChar, activity_hours)
        .input("activity_type", sql.VarChar, activity_type)
        .input("activity_target", sql.VarChar, activity_target)
        .input("activity_position", sql.VarChar, activity_position)
        .input("student_id", sql.VarChar, student_id)
        .input("student_name", sql.VarChar, student_name)
        .input("fac_name", sql.VarChar, fac_name)
        .input("maj_name", sql.VarChar, maj_name)
        .input("activity_document", sql.VarBinary, pdfContent)
        .query(
          "INSERT INTO student_form (activity_name, activity_year, activity_date, activity_hours, activity_type, activity_target, activity_position, student_id, student_name, activity_document, fac_name, maj_name) OUTPUT INSERTED.s_id VALUES (@activity_name, @activity_year, @activity_date, @activity_hours, @activity_type, @activity_target, @activity_position, @student_id, @student_name, @activity_document, @fac_name, @maj_name)"
        );

      const s_id = result.recordset[0].s_id;

      for (let i = 0; i < pictures.length; i++) {
        const picture = pictures[i];
        const content = fs.readFileSync(picture.path);

        await pool
          .request()
          .input("activity_pictures", sql.VarBinary, content)
          .input("s_id", sql.Int, s_id)
          .query(
            "INSERT INTO activity_pictures (picture_data, s_id) VALUES (@activity_pictures, @s_id)"
          );

        fs.unlinkSync(picture.path);
      }

      fs.unlinkSync(pdfFile.path);

      res.status(200).send("Form submitted successfully!");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error submitting form");
    }
  }
);

app.post(
  "/student_form_inside",
  upload.fields([{ name: "activity_pictures", maxCount: 10 }]),
  async (req, res) => {
    try {
      const {
        activity_name,
        activity_year,
        activity_date,
        last_date,
        activity_hours,
        activity_type,
        activity_target,
        activity_position,
        student_id,
        student_name,
        t_id,
        fac_name,
        maj_name,
      } = req.body;
      const pictures = req.files["activity_pictures"];

      const pool = await sql.connect(config);

      const result = await pool
        .request()
        .input("activity_name", sql.VarChar, activity_name)
        .input("activity_year", sql.VarChar, activity_year)
        .input("activity_date", sql.VarChar, activity_date)
        .input("last_date", sql.VarChar, last_date)
        .input("activity_hours", sql.VarChar, activity_hours)
        .input("activity_type", sql.VarChar, activity_type)
        .input("activity_target", sql.VarChar, activity_target)
        .input("activity_position", sql.VarChar, activity_position)
        .input("student_id", sql.VarChar, student_id)
        .input("student_name", sql.VarChar, student_name)
        .input("t_id", sql.VarChar, t_id)
        .input("fac_name", sql.VarChar, fac_name)
        .input("maj_name", sql.VarChar, maj_name)
        .query(
          "INSERT INTO student_form (activity_name, activity_year, activity_date, activity_hours, activity_type, activity_target, activity_position, student_id, student_name, t_id, last_date, fac_name, maj_name) OUTPUT INSERTED.s_id VALUES (@activity_name, @activity_year, @activity_date, @activity_hours, @activity_type, @activity_target, @activity_position, @student_id, @student_name, @t_id, @last_date, @fac_name, @maj_name)"
        );

      const s_id = result.recordset[0].s_id;

      for (let i = 0; i < pictures.length; i++) {
        const picture = pictures[i];
        const content = fs.readFileSync(picture.path);

        await pool
          .request()
          .input("activity_pictures", sql.VarBinary, content)
          .input("s_id", sql.Int, s_id)
          .query(
            "INSERT INTO activity_pictures (picture_data, s_id) VALUES (@activity_pictures, @s_id)"
          );

        fs.unlinkSync(picture.path);
      }
      res.status(200).send("Form submitted successfully!");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error submitting form");
    }
  }
);

app.get("/student_form", async (req, res) => {
  try {
    // Open a database connection from the connection pool
    const connection = await pool.connect();

    // Get the student_id from the query string
    const studentId = req.query.student_id;

    // Select all data from the student_form table where student_id matches
    const result = await connection.query(
      `SELECT student_form.*, COUNT(activity_pictures.picture_id) as picture_count 
      FROM student_form
      LEFT JOIN activity_pictures ON student_form.s_id = activity_pictures.s_id
      WHERE student_form.student_id = ${studentId}
      GROUP BY student_form.s_id, student_form.activity_name, student_form.activity_year, student_form.activity_date,
      student_form.activity_hours, student_form.activity_type, student_form.activity_target, student_form.activity_position,
      student_form.student_id, student_form.student_name, student_form.activity_document, student_form.t_id, student_form.last_date,
      student_form.fac_name, student_form.maj_name, student_form.check_activity, student_form.check_inside
      `
    );

    // Close the database connection
    await connection.close();

    // Send the data back to the client as a response
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving data");
  }
});

app.get("/student_form_hours", async (req, res) => {
  try {
    // Open a database connection from the connection pool
    const connection = await pool.connect();

    // Get the student_id from the query string
    const studentId = req.query.student_id;
    const activityYear = req.query.activity_year;

    // Select all data from the student_form table where student_id matches
    const result = await connection.query(
      `SELECT activity_hours, activity_year FROM student_form WHERE student_id = ${studentId} AND activity_year = '${activityYear}'`
    );

    // Close the database connection
    await connection.close();

    // Send the data back to the client as a response
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving data");
  }
});

app.get("/student_form_display", async (req, res) => {
  try {
    // Open a database connection from the connection pool
    const connection = await pool.connect();

    const t_id = req.query.t_id;

    // Get the student_id from the query string

    // Select all data from the student_form table where student_id matches
    const result = await connection.query(
      `SELECT s_id, student_name, student_id, activity_name, activity_year, activity_hours, t_id, activity_date, activity_position, last_date, fac_name, maj_name FROM student_form WHERE t_id = ${t_id} `
    );

    // Close the database connection
    await connection.close();

    // Send the data back to the client as a response
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving data");
  }
});

app.get("/activity_pictures/:s_id", async (req, res) => {
  const s_id = parseInt(req.params.s_id);

  try {
    // Validate that s_id is a number
    if (isNaN(s_id)) {
      res.status(400).send("Invalid s_id parameter");
      return;
    }

    // create a SQL Server connection pool
    const pool = await sql.connect(config);

    // select the latest image data for the given s_id from the database
    const result = await pool.request().input("s_id", sql.Int, s_id).query(`
        SELECT picture_data
        FROM activity_pictures
        WHERE s_id = @s_id
        ORDER BY picture_id DESC
      `);

    // check that the query returned a result
    if (result.recordset.length > 0) {
      const images = result.recordset.map((record) => {
        return record.picture_data
          ? record.picture_data.toString("base64")
          : null;
      });
      res.send(images);
    } else {
      res.status(404).send("Images not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving image data");
  }
});

app.delete("/student_form/:s_id", async (req, res) => {
  try {
    // Open a database connection from the connection pool
    const connection = await pool.connect();

    // Get the student form id from the URL parameters
    const studentFormId = req.params.s_id;

    // Start a transaction
    const transaction = new sql.Transaction(connection);
    await transaction.begin();

    try {
      // Delete the corresponding activity pictures
      await transaction.request().query(`
        DELETE FROM activity_pictures
        WHERE s_id = ${studentFormId}
      `);

      // Delete the student form
      await transaction.request().query(`
        DELETE FROM student_form
        WHERE s_id = ${studentFormId}
      `);

      // Commit the transaction
      await transaction.commit();

      // Close the database connection
      await connection.close();

      res.status(204).send();
    } catch (error) {
      // Rollback the transaction if an error occurred
      await transaction.rollback();

      throw error;
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting data");
  }
});

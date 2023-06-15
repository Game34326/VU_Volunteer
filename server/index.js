var sql = require("mssql");
var express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
var multer = require("multer");
var fs = require("fs");
const sharp = require("sharp");
const ExcelJS = require("exceljs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");
const axios = require('axios')


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
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/octet-stream"
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

// app.use(express.static(path.join(__dirname, 'build')));

// // Serve the React app
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'build', 'index.html'));
// })

// Start the server
const port = process.env.PORT || 3333;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

var config = {
  user: "sa",
  password: "343263",
  server: "LAPTOP-OVDCHV44",
  database: "vu_volunteer",
  options: {
    encrypt: false, // Disable SSL encryption
    enableArithAbort: true,
  },
  pool: {
    max: 10, // set the maximum number of connections to 10
  },
};

const pool = new sql.ConnectionPool(config);
pool.on("error", (err) => {
  console.error("SQL Server error", err);
});
const poolConnect = pool.connect();
poolConnect
  .then(() => {
    console.log("Connected to SQL Server database");
  })
  .catch((err) => {
    console.error("Error connecting to SQL Server database", err);
  });

app.post(
  "/teacher_form",
  upload.fields([{ name: "activity_pictures", maxCount: 10 }]),
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
        department,
      } = req.body;
      const pictures = req.files["activity_pictures"];

      const pool = await sql.connect(config);

      const result = await pool
        .request()
        .input("activity_name", sql.VarChar, activity_name)
        .input("activity_year", sql.VarChar, activity_year)
        .input("activity_date", sql.VarChar, activity_date)
        .input("teacher_id", sql.VarChar, teacher_id)
        .input("teacher_name", sql.VarChar, teacher_name)
        .input("last_date", sql.VarChar, last_date)
        .input("activity_place", sql.VarChar, activity_place)
        .input("department", sql.VarChar, department)
        .query(
          "INSERT INTO teacher_form (activity_name, activity_year, activity_date, teacher_id, teacher_name, last_date, activity_place, department, create_time) OUTPUT INSERTED.t_id VALUES (@activity_name, @activity_year, @activity_date, @teacher_id, @teacher_name, @last_date, @activity_place, @department, GETDATE())"
        );

      const t_id = result.recordset[0].t_id;

      if (pictures && pictures.length > 0) {
        for (let i = 0; i < pictures.length; i++) {
          const picture = pictures[i];
          const content = fs.readFileSync(picture.path);

          // Resize the image to a maximum width of 500 pixels
          const resizedImage = await sharp(content)
            .resize({ width: 500 })
            .toBuffer();

          await pool
            .request()
            .input("activity_pictures", sql.VarBinary, resizedImage)
            .input("t_id", sql.Int, t_id)
            .query(
              "INSERT INTO teacher_pictures (picture_data, t_id) VALUES (@activity_pictures, @t_id)"
            );

          fs.unlinkSync(picture.path);
        }
      } else {
        // No pictures uploaded, insert NULL value for picture_data column
        await pool
          .request()
          .input("t_id", sql.Int, t_id)
          .query("INSERT INTO teacher_pictures (t_id) VALUES (@t_id)");
      }

      res.status(200).send("Form submitted successfully!");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error submitting form");
    }
  }
);

app.post("/update-teacher-form", async (req, res) => {
  const { t_id, status, check_activity } = req.body;
  try {
    // Create a SQL Server connection pool
    const pool = await sql.connect(config);

    // Update the check_activity or edit_reason column in the teacher_form table
    if (status === "ผ่าน") {
      await pool
        .request()
        .input("t_id", sql.Int, t_id)
        .input("check_activity", sql.VarChar, status).query(`
          UPDATE teacher_form
          SET check_activity = @check_activity, approve_time = GETDATE()
          WHERE t_id = @t_id
        `);
    } else if (status === "แก้ไข") {
      await pool
        .request()
        .input("t_id", sql.Int, t_id)
        .input("check_activity", sql.NVarChar, check_activity || null).query(`
          UPDATE teacher_form
          SET check_activity = @check_activity, approve_time = GETDATE()
          WHERE t_id = @t_id
        `);
    }
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.post(
  "/teacher_form_edit",
  upload.array("activity_pictures", 10),
  async (req, res) => {
    try {
      const {
        activity_name,
        activity_year,
        activity_date,
        last_date,
        activity_place,
        department,
        t_id,
      } = req.body;

      const pool = await sql.connect(config);

      let query =
        "UPDATE teacher_form SET department=@department, activity_name=@activity_name, activity_year=@activity_year, activity_date=@activity_date, last_date=@last_date, activity_place=@activity_place";
      query += ", check_activity=NULL WHERE t_id=@t_id";

      await pool
        .request()
        .input("activity_name", sql.VarChar, activity_name)
        .input("activity_year", sql.VarChar, activity_year)
        .input("activity_date", sql.VarChar, activity_date)
        .input("last_date", sql.VarChar, last_date)
        .input("activity_place", sql.VarChar, activity_place)
        .input("department", sql.VarChar, department)
        .input("t_id", sql.Int, req.query.t_id)
        .query(query);

      // Get the existing pictures for the form
      const existingPicturesQuery =
        "SELECT * FROM teacher_pictures WHERE t_id = @t_id";
      const existingPictures = await pool
        .request()
        .input("t_id", sql.Int, req.query.t_id)
        .query(existingPicturesQuery);

      // Insert image data into teacher_pictures table
      const files = req.files;
      if (files.length > 0) {
        // Delete the existing pictures
        const deletePictureQuery =
          "DELETE FROM teacher_pictures WHERE picture_id = @picture_id";
        for (const picture of existingPictures.recordset) {
          await pool
            .request()
            .input("picture_id", sql.Int, picture.picture_id)
            .query(deletePictureQuery);
        }

        for (let i = 0; i < files.length; i++) {
          const pictureContent = fs.readFileSync(files[i].path);
          const resizedImage = await sharp(pictureContent)
            .resize({ width: 500 })
            .toBuffer();

          const insertQuery =
            "INSERT INTO teacher_pictures (t_id, picture_data) VALUES (@t_id, @picture_data)";
          await pool
            .request()
            .input("t_id", sql.Int, req.query.t_id)
            .input("picture_data", sql.VarBinary, resizedImage)
            .query(insertQuery);
          fs.unlinkSync(files[i].path);
        }
      }

      res.status(200).send("Form updated successfully!");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error updating form");
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
      `SELECT t_id, activity_name, activity_year, activity_date, teacher_id, teacher_name, last_date, activity_place, check_activity, department FROM teacher_form WHERE teacher_id = ${teacherId}`
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

      // Count the number of passed, pending, and revised forms
      const checkResult = await connection.query(
        `SELECT COUNT(CASE WHEN check_inside = 'ผ่าน' THEN 1 END) as passed_count,
            COUNT(CASE WHEN check_inside IS NULL THEN 1 END) as pending_count,
            COUNT(CASE WHEN check_inside != 'ผ่าน' AND check_inside IS NOT NULL THEN 1 END) as revised_count            FROM student_form
     WHERE t_id = '${row.t_id}'`
      );
      const checkCounts = checkResult.recordset[0];

      // Add the check counts to the current row
      row.passed_count = checkCounts.passed_count;
      row.pending_count = checkCounts.pending_count;
      row.revised_count = checkCounts.revised_count;

      // Add the current row to the teacherForm array
      teacherForm.push(row);
    }

    // Close the database connection

    // Send the data back to the client as a response
    res.status(200).json(teacherForm);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving data");
  }
});

app.get("/teacher_form_display", async (req, res) => {
  let connection;
  try {
    // Open a database connection from the connection pool
    connection = await pool.connect();

    const activityYear = req.query.activity_year;

    // Select all data from the teacher_form table where activity_year matches and check_activity is equal to "ผ่าน"
    const result = await connection.query(
      `SELECT * FROM teacher_form WHERE activity_year = '${activityYear}' AND check_activity = 'ผ่าน'`
    );

    // Convert the binary image data to base64-encoded strings
    const data = await Promise.all(
      result.recordset.map(async (row) => {
        let activityPicture = null;
        if (row.activity_picture) {
          const resizedImageBuffer = row.activity_picture
            ? await sharp(row.activity_picture)
                .resize(350) // Resize the image to a width of 500 pixels (adjust as needed)
                .toBuffer()
            : null;

          activityPicture = resizedImageBuffer
            ? resizedImageBuffer.toString("base64")
            : null;
        }

        // Select the picture_data from the teacher_pictures table using the t_id as a foreign key
        const pictureResult = await connection.query(
          `SELECT picture_data FROM teacher_pictures WHERE t_id = '${row.t_id}'`
        );

        // Create an array of base64-encoded picture_data strings
        const pictureData = pictureResult.recordset.map((pictureRow) => {
          if (pictureRow.picture_data) {
            const buffer = Buffer.from(pictureRow.picture_data);
            return buffer.toString("base64");
          } else {
            return null;
          }
        });

        return {
          ...row,
          activity_picture: activityPicture,
          picture_data: pictureData,
        };
      })
    );

    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  } finally {
    // Release the connection back to the pool
    if (connection) {
      connection.release();
    }
  }
});

app.get("/teacher_form_edit", async (req, res) => {
  try {
    // Open a database connection from the connection pool
    const connection = await pool.connect();

    const t_id = req.query.t_id;

    // Select all data from the teacher_form table where activity_year matches and check_activity is equal to "ผ่าน"
    const result = await connection.query(
      `SELECT * FROM teacher_form WHERE t_id = ${t_id}`
    );

    // Convert the binary image data to base64-encoded strings
    const data = await Promise.all(
      result.recordset.map(async (row) => {
        let activityPicture = null;
        if (row.activity_picture) {
          const resizedImageBuffer = await sharp(row.activity_picture)
            .resize(350) // Resize the image to a width of 500 pixels (adjust as needed)
            .toBuffer();
          activityPicture = resizedImageBuffer.toString("base64");
        }

        return {
          ...row,
          activity_picture: activityPicture,
        };
      })
    );

    // Close the database connection
    await connection.close();

    // Send the data back to the client as a response
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving data");
  }
});

app.get("/activity_counts", async (req, res) => {
  try {
    // Open a database connection from the connection pool
    const connection = await pool.connect();

    // Execute queries asynchronously using Promise.all()
    const [
      insideNumberResult,
      outsideNumberResult,
      bloodNumberResult,
      onlineNumberResult,
      teacherFormResult,
    ] = await Promise.all([
      connection.query(`
        SELECT COUNT(*) AS null_check_activity_count
        FROM student_form
        WHERE check_activity IS NULL
          AND check_inside = 'ผ่าน'
          AND activity_type = 'กิจกรรมโดยคณะวิชา ศูนย์ สำนัก'
          AND check_fail IS NULL
      `),
      connection.query(`
        SELECT COUNT(*) AS null_check_activity_count
        FROM student_form
        WHERE check_activity IS NULL
          AND activity_type = 'กิจกรรมจิตอาสาเข้าร่วมด้วยตนเอง'
          AND check_fail IS NULL
      `),
      connection.query(`
        SELECT COUNT(*) AS null_check_activity_count
        FROM student_form
        WHERE check_activity IS NULL
          AND activity_type = 'กิจกรรมการบริจาคโลหิต'
          AND check_fail IS NULL
      `),
      connection.query(`
        SELECT COUNT(*) AS null_check_activity_count
        FROM student_form
        WHERE check_activity IS NULL
          AND activity_type = 'กิจกรรมอบรมออนไลน์จิตสาธารณะ กยศ.'
          AND check_fail IS NULL
      `),
      connection.query(`
        SELECT COUNT(*) AS null_check_activity_count
        FROM teacher_form
        WHERE check_activity IS NULL
      `),
    ]);

    // Extract the counts from the results
    const insideNumber =
      insideNumberResult.recordset[0].null_check_activity_count;
    const outsideNumber =
      outsideNumberResult.recordset[0].null_check_activity_count;
    const bloodNumber =
      bloodNumberResult.recordset[0].null_check_activity_count;
    const onlineNumber =
      onlineNumberResult.recordset[0].null_check_activity_count;
    const teacherFormNumber =
      teacherFormResult.recordset[0].null_check_activity_count;

    const totalInside = insideNumber + teacherFormNumber;
    // Create a response object with the counts
    const response = {
      totalInside,
      outsideNumber,
      bloodNumber,
      onlineNumber,
      insideNumber,
      teacherFormNumber,
    };

    // Close the database connection
    await connection.close();

    // Send the data back to the client as a response
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving data");
  }
});

app.get("/teacher_form_check", async (req, res) => {
  try {
    // Open a database connection from the connection pool
    const connection = await pool.connect();

    const activityYear = req.query.activity_year;
    const department = req.query.department;
    const institution = req.query.institution;

    const waitCheck = req.query.waitCheck;
    const alreadyCheck = req.query.alreadyCheck;

    // Construct the SQL query based on the selected values
    let query = `SELECT * FROM teacher_form WHERE 1=1`; // Start with a basic query to select all rows

    if (activityYear) {
      query += ` AND activity_year = '${activityYear}'`;
    }

    if (department && institution) {
      query += ` AND (department LIKE '%"dep_id":"${department}"%' OR department LIKE '%"dep_id":"${institution}"%')`;
    } else if (department) {
      query += ` AND department LIKE '%"dep_id":"${department}"%'`;
    } else if (institution) {
      query += ` AND department LIKE '%"dep_id":"${institution}"%'`;
    }
    if (waitCheck) {
      query += ` AND check_activity IS NULL`;
    }

    if (alreadyCheck) {
      query += ` AND check_activity IS NOT NULL`;
    }

    // Execute the constructed query
    const result = await connection.query(query);

    const data = await Promise.all(
      result.recordset.map(async (row) => {
        let activityPicture = null;
        if (row.activity_picture) {
          // Make sure to import and install the 'sharp' library before using it
          const resizedImageBuffer = row.activity_picture
            ? await sharp(row.activity_picture)
                .resize(350) // Resize the image to a width of 350 pixels (adjust as needed)
                .toBuffer()
            : null;

          activityPicture = resizedImageBuffer
            ? resizedImageBuffer.toString("base64")
            : null;
        }

        // Select the picture_data from the teacher_pictures table using the t_id as a foreign key
        const pictureResult = await connection.query(
          `SELECT picture_data FROM teacher_pictures WHERE t_id = '${row.t_id}'`
        );

        // Create an array of base64-encoded picture_data strings
        const pictureData = pictureResult.recordset.map((pictureRow) => {
          if (pictureRow.picture_data) {
            const buffer = Buffer.from(pictureRow.picture_data);
            return buffer.toString("base64");
          } else {
            return null;
          }
        });

        return {
          ...row,
          activity_picture: activityPicture,
          picture_data: pictureData,
        };
      })
    );

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.get("/student_inside_check_activity", async (req, res) => {
  try {
    // Open a database connection from the connection pool
    const connection = await pool.connect();

    const activityYear = req.query.activity_year;
    const studentName = req.query.student_name;
    const studentId = req.query.student_id;
    const facultyName = req.query.fac_name;

    const waitCheck = req.query.waitCheck;
    const alreadyCheck = req.query.alreadyCheck;

    // Construct the SQL query based on the selected values
    let query = `
      SELECT sf.*, tf.teacher_name, tf.department, tf.activity_place
      FROM student_form sf
      INNER JOIN teacher_form tf ON sf.t_id = tf.t_id
      WHERE 1=1 AND sf.activity_type='กิจกรรมโดยคณะวิชา ศูนย์ สำนัก' AND sf.check_inside = 'ผ่าน'
    `; // Start with a basic query to select all rows

    if (activityYear) {
      query += ` AND sf.activity_year = '${activityYear}'`;
    }

    if (studentName) {
      query += ` AND sf.student_name LIKE '%${studentName}%'`;
    }

    if (studentId) {
      query += ` AND sf.student_id LIKE '%${studentId}%'`;
    }

    if (facultyName) {
      query += ` AND sf.fac_name LIKE '%${facultyName}%'`;
    }

    if (waitCheck) {
      query += ` AND sf.check_activity IS NULL AND sf.check_fail IS NULL `;
    }

    if (alreadyCheck) {
      query += ` AND (sf.check_activity IS NOT NULL OR sf.check_fail IS NOT NULL)`;
    }

    // Execute the constructed query
    const result = await connection.query(query);

    const data = await Promise.all(
      result.recordset.map(async (row) => {
        let activityPicture = null;
        if (row.activity_picture) {
          // Make sure to import and install the 'sharp' library before using it
          const resizedImageBuffer = row.activity_picture
            ? await sharp(row.activity_picture)
                .resize(350) // Resize the image to a width of 350 pixels (adjust as needed)
                .toBuffer()
            : null;

          activityPicture = resizedImageBuffer
            ? resizedImageBuffer.toString("base64")
            : null;
        }

        // Select the picture_data from the activity_pictures table using the s_id as a foreign key
        const pictureResult = await connection.query(
          `SELECT picture_data FROM activity_pictures WHERE s_id = '${row.s_id}'`
        );

        // Create an array of base64-encoded picture_data strings
        const pictureData = pictureResult.recordset.map((pictureRow) => {
          if (pictureRow.picture_data) {
            const buffer = Buffer.from(pictureRow.picture_data);
            return buffer.toString("base64");
          } else {
            return null;
          }
        });

        return {
          ...row,
          activity_picture: activityPicture,
          picture_data: pictureData,
        };
      })
    );

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.get("/student_blood_check_activity", async (req, res) => {
  try {
    // Open a database connection from the connection pool
    const connection = await pool.connect();

    const activityYear = req.query.activity_year;
    const studentName = req.query.student_name;
    const studentId = req.query.student_id;
    const facultyName = req.query.fac_name;

    const waitCheck = req.query.waitCheck;
    const alreadyCheck = req.query.alreadyCheck;

    // Construct the SQL query based on the selected values
    let query = `
      SELECT * FROM student_form
      WHERE 1=1 AND activity_type='กิจกรรมการบริจาคโลหิต'
    `; // Start with a basic query to select all rows

    if (activityYear) {
      query += ` AND activity_year = '${activityYear}'`;
    }

    if (studentName) {
      query += ` AND student_name LIKE '%${studentName}%'`;
    }

    if (studentId) {
      query += ` AND student_id LIKE '%${studentId}%'`;
    }

    if (facultyName) {
      query += ` AND fac_name LIKE '%${facultyName}%'`;
    }

    if (waitCheck) {
      query += ` AND (check_activity IS NULL AND check_fail IS NULL) `;
    }

    if (alreadyCheck) {
      query += ` AND (check_activity IS NOT NULL OR check_fail IS NOT NULL)`;
    }

    // Execute the constructed query
    const result = await connection.query(query);

    const data = await Promise.all(
      result.recordset.map(async (row) => {
        let activityPicture = null;
        if (row.activity_picture) {
          // Make sure to import and install the 'sharp' library before using it
          const resizedImageBuffer = row.activity_picture
            ? await sharp(row.activity_picture)
                .resize(350) // Resize the image to a width of 350 pixels (adjust as needed)
                .toBuffer()
            : null;

          activityPicture = resizedImageBuffer
            ? resizedImageBuffer.toString("base64")
            : null;
        }

        // Select the picture_data from the activity_pictures table using the s_id as a foreign key
        const pictureResult = await connection.query(
          `SELECT picture_data FROM activity_pictures WHERE s_id = '${row.s_id}'`
        );

        // Create an array of base64-encoded picture_data strings
        const pictureData = pictureResult.recordset.map((pictureRow) => {
          if (pictureRow.picture_data) {
            const buffer = Buffer.from(pictureRow.picture_data);
            return buffer.toString("base64");
          } else {
            return null;
          }
        });

        return {
          ...row,
          activity_picture: activityPicture,
          picture_data: pictureData,
        };
      })
    );

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.get("/student_outside_check_activity", async (req, res) => {
  try {
    // Open a database connection from the connection pool
    const connection = await pool.connect();

    const activityYear = req.query.activity_year;
    const studentName = req.query.student_name;
    const studentId = req.query.student_id;
    const facultyName = req.query.fac_name;

    const waitCheck = req.query.waitCheck;
    const alreadyCheck = req.query.alreadyCheck;

    // Construct the SQL query based on the selected values
    let query = `
      SELECT * FROM student_form
      WHERE 1=1 AND activity_type='กิจกรรมจิตอาสาเข้าร่วมด้วยตนเอง'
    `; // Start with a basic query to select all rows

    if (activityYear) {
      query += ` AND activity_year = '${activityYear}'`;
    }

    if (studentName) {
      query += ` AND student_name LIKE '%${studentName}%'`;
    }

    if (studentId) {
      query += ` AND student_id LIKE '%${studentId}%'`;
    }

    if (facultyName) {
      query += ` AND fac_name LIKE '%${facultyName}%'`;
    }

    if (waitCheck) {
      query += ` AND (check_activity IS NULL AND check_fail IS NULL) `;
    }

    if (alreadyCheck) {
      query += ` AND (check_activity IS NOT NULL OR check_fail IS NOT NULL)`;
    }

    // Execute the constructed query
    const result = await connection.query(query);

    const data = await Promise.all(
      result.recordset.map(async (row) => {
        let activityPicture = null;
        if (row.activity_picture) {
          // Make sure to import and install the 'sharp' library before using it
          const resizedImageBuffer = row.activity_picture
            ? await sharp(row.activity_picture)
                .resize(350) // Resize the image to a width of 350 pixels (adjust as needed)
                .toBuffer()
            : null;

          activityPicture = resizedImageBuffer
            ? resizedImageBuffer.toString("base64")
            : null;
        }

        // Select the picture_data from the activity_pictures table using the s_id as a foreign key
        const pictureResult = await connection.query(
          `SELECT picture_data FROM activity_pictures WHERE s_id = '${row.s_id}'`
        );

        // Create an array of base64-encoded picture_data strings
        const pictureData = pictureResult.recordset.map((pictureRow) => {
          if (pictureRow.picture_data) {
            const buffer = Buffer.from(pictureRow.picture_data);
            return buffer.toString("base64");
          } else {
            return null;
          }
        });

        return {
          ...row,
          activity_picture: activityPicture,
          picture_data: pictureData,
        };
      })
    );

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.get("/student_online_check_activity", async (req, res) => {
  try {
    // Open a database connection from the connection pool
    const connection = await pool.connect();

    const activityYear = req.query.activity_year;
    const studentName = req.query.student_name;
    const studentId = req.query.student_id;
    const facultyName = req.query.fac_name;

    const waitCheck = req.query.waitCheck;
    const alreadyCheck = req.query.alreadyCheck;

    // Construct the SQL query based on the selected values
    let query = `
      SELECT * FROM student_form
      WHERE 1=1 AND activity_type='กิจกรรมอบรมออนไลน์จิตสาธารณะ กยศ.'
    `; // Start with a basic query to select all rows

    if (activityYear) {
      query += ` AND activity_year = '${activityYear}'`;
    }

    if (studentName) {
      query += ` AND student_name LIKE '%${studentName}%'`;
    }

    if (studentId) {
      query += ` AND student_id LIKE '%${studentId}%'`;
    }

    if (facultyName) {
      query += ` AND fac_name LIKE '%${facultyName}%'`;
    }

    if (waitCheck) {
      query += ` AND (check_activity IS NULL AND check_fail IS NULL) `;
    }

    if (alreadyCheck) {
      query += ` AND (check_activity IS NOT NULL OR check_fail IS NOT NULL)`;
    }

    // Execute the constructed query
    const result = await connection.query(query);

    const data = await Promise.all(
      result.recordset.map(async (row) => {
        return { ...row };
      })
    );
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.get("/teacher_pictures/:t_id", async (req, res) => {
  const t_id = parseInt(req.params.t_id);

  try {
    // Validate that t_id is a number
    if (isNaN(t_id)) {
      res.status(400).send("Invalid t_id parameter");
      return;
    }

    // create a SQL Server connection pool
    const pool = await sql.connect(config);

    // select the latest image data for the given s_id from the database
    const result = await pool.request().input("t_id", sql.Int, t_id).query(`
        SELECT picture_data
        FROM teacher_pictures
        WHERE t_id = @t_id
        ORDER BY picture_id DESC
      `);

    // check that the query returned a result
    if (result.recordset.length > 0) {
      const images = result.recordset.map(async (record) => {
        if (record.picture_data) {
          const compressedImage = await sharp(record.picture_data)
            .resize(450) // set the maximum width to 500 pixels
            .jpeg({ quality: 80 }) // compress the image to 50% quality
            .toBuffer();
          return compressedImage.toString("base64");
        } else {
          return null;
        }
      });
      res.send(await Promise.all(images));
    } else {
      res.status(404).send("Images not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving image data");
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
        activity_place,
        student_id,
        student_name,
        fac_name,
        maj_name,
        start_time,
        end_time,
      } = req.body;

      const pool = await sql.connect(config);

      // Check if activity_hours exceeds 6 hours per activity_year
      if (activity_hours !== null) {
        const existingActivities = await pool
          .request()
          .input("activity_year", sql.VarChar, activity_year)
          .query(
            `SELECT ISNULL(SUM(activity_hours), 0) AS total_hours FROM student_form WHERE activity_year = @activity_year AND activity_type='กิจกรรมจิตอาสาเข้าร่วมด้วยตนเอง' AND student_id = ${student_id}`
          );

        const totalHours = parseInt(
          existingActivities.recordset[0].total_hours,
          10
        );
        const newHours = parseInt(activity_hours, 10);

        if (totalHours + newHours > 6) {
          const errorMessage = `ชั่วโมงกิจกรรมจิตอาสาเข้าร่วมด้วยตนเองจะต้องไม่เกิน 6 ชั่วโมงต่อภาคเรียน จำนวนชั่วโมงปัจจุบัน ${totalHours} ชั่วโมง`;
          return res.status(400).json({ error: errorMessage, totalHours });
        }
      }

      const pictures = req.files["activity_pictures"];
      const pdfFile = req.files["activity_document"][0];
      const pdfContent = fs.readFileSync(pdfFile.path);

      const result = await pool
        .request()
        .input("activity_name", sql.VarChar, activity_name)
        .input("activity_year", sql.VarChar, activity_year)
        .input("activity_date", sql.VarChar, activity_date)
        .input("activity_hours", sql.VarChar, activity_hours)
        .input("activity_type", sql.VarChar, activity_type)
        .input("activity_target", sql.VarChar, activity_target)
        .input("activity_position", sql.VarChar, activity_position)
        .input("activity_place", sql.VarChar, activity_place)
        .input("student_id", sql.VarChar, student_id)
        .input("student_name", sql.VarChar, student_name)
        .input("fac_name", sql.VarChar, fac_name)
        .input("maj_name", sql.VarChar, maj_name)
        .input("start_time", sql.VarChar, start_time)
        .input("end_time", sql.VarChar, end_time)
        .input("activity_document", sql.VarBinary, pdfContent)
        .query(
          "INSERT INTO student_form (activity_name, activity_year, activity_date, activity_hours, activity_type, activity_target, activity_position, student_id, student_name, activity_document, fac_name, maj_name, start_time, end_time, activity_place) OUTPUT INSERTED.s_id VALUES (@activity_name, @activity_year, @activity_date, @activity_hours, @activity_type, @activity_target, @activity_position, @student_id, @student_name, @activity_document, @fac_name, @maj_name, @start_time, @end_time, @activity_place)"
        );

      const s_id = result.recordset[0].s_id;

      for (let i = 0; i < pictures.length; i++) {
        const picture = pictures[i];
        const content = fs.readFileSync(picture.path);
        const resizedImage = await sharp(content)
          .resize({ width: 500 })
          .toBuffer();

        await pool
          .request()
          .input("activity_pictures", sql.VarBinary, resizedImage)
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
        activity_time_period,
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
        .input("activity_time_period", sql.VarChar, activity_time_period)
        .query(
          "INSERT INTO student_form (activity_name, activity_year, activity_date, activity_hours, activity_type, activity_target, activity_position, student_id, student_name, t_id, last_date, fac_name, maj_name, activity_time_period) OUTPUT INSERTED.s_id VALUES (@activity_name, @activity_year, @activity_date, @activity_hours, @activity_type, @activity_target, @activity_position, @student_id, @student_name, @t_id, @last_date, @fac_name, @maj_name, @activity_time_period)"
        );

      const s_id = result.recordset[0].s_id;

      for (let i = 0; i < pictures.length; i++) {
        const picture = pictures[i];
        const content = fs.readFileSync(picture.path);

        // Resize the image to a maximum width of 500 pixels
        const resizedImage = await sharp(content)
          .resize({ width: 500 })
          .toBuffer();

        await pool
          .request()
          .input("activity_pictures", sql.VarBinary, resizedImage)
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

app.post(
  "/student_form_blood",
  upload.fields([{ name: "activity_pictures", maxCount: 10 }]),
  async (req, res) => {
    try {
      const {
        activity_year,
        activity_type,
        student_id,
        student_name,
        fac_name,
        maj_name,
        activity_hours,
        activity_date,
        activity_place,
        activity_position,
      } = req.body;
      const pictures = req.files["activity_pictures"];

      const pool = await sql.connect(config);

      const result = await pool
        .request()
        .input("activity_year", sql.VarChar, activity_year)
        .input("activity_type", sql.VarChar, activity_type)
        .input("student_id", sql.VarChar, student_id)
        .input("student_name", sql.VarChar, student_name)
        .input("fac_name", sql.VarChar, fac_name)
        .input("maj_name", sql.VarChar, maj_name)
        .input("activity_hours", sql.Int, activity_hours)
        .input("activity_date", sql.VarChar, activity_date)
        .input("activity_place", sql.VarChar, activity_place)
        .input("activity_position", sql.VarChar, activity_position)

        .query(
          "INSERT INTO student_form (activity_year, activity_hours, activity_type, student_id, student_name, fac_name, maj_name, activity_date, activity_place, activity_position) OUTPUT INSERTED.s_id VALUES (@activity_year, @activity_hours, @activity_type, @student_id, @student_name, @fac_name, @maj_name, @activity_date, @activity_place, @activity_position)"
        );

      const s_id = result.recordset[0].s_id;

      for (let i = 0; i < pictures.length; i++) {
        const picture = pictures[i];
        const content = fs.readFileSync(picture.path);
        const resizedImage = await sharp(content)
          .resize({ width: 500 })
          .toBuffer();

        await pool
          .request()
          .input("activity_pictures", sql.VarBinary, resizedImage)
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

app.post(
  "/student_form_online",
  upload.fields([{ name: "activity_document", maxCount: 1 }]),
  async (req, res) => {
    try {
      const {
        activity_name,
        activity_year,
        activity_date,
        activity_hours,
        activity_type,
        student_id,
        student_name,
        fac_name,
        maj_name,
        start_time,
        end_time,
      } = req.body;
      const pdfFile = req.files["activity_document"][0];
      const pdfContent = fs.readFileSync(pdfFile.path);

      const pool = await sql.connect(config);

      // Check if activity_hours exceeds 6 hours per activity_year
      if (activity_hours !== null) {
        const existingActivities = await pool
          .request()
          .input("activity_year", sql.VarChar, activity_year)
          .query(
            `SELECT ISNULL(SUM(activity_hours), 0) AS total_hours FROM student_form WHERE activity_year = @activity_year AND activity_type='กิจกรรมอบรมออนไลน์จิตสาธารณะ กยศ.' AND student_id = ${student_id}`
          );

        const totalHours = parseInt(
          existingActivities.recordset[0].total_hours,
          10
        );
        const newHours = parseInt(activity_hours, 10);

        if (totalHours + newHours > 6) {
          const errorMessage = `ชั่วโมงกิจกรรมอบรมออนไลน์จิตสาธารณะ กยศ. จะต้องไม่เกิน 6 ชั่วโมงต่อภาคเรียน จำนวนชั่วโมงปัจจุบัน ${totalHours} ชั่วโมง`;
          return res.status(400).json({ error: errorMessage, totalHours });
        }
      }

      await pool
        .request()
        .input("activity_name", sql.VarChar, activity_name)
        .input("activity_year", sql.VarChar, activity_year)
        .input("activity_date", sql.VarChar, activity_date)
        .input("activity_hours", sql.VarChar, activity_hours)
        .input("activity_type", sql.VarChar, activity_type)
        .input("student_id", sql.VarChar, student_id)
        .input("student_name", sql.VarChar, student_name)
        .input("fac_name", sql.VarChar, fac_name)
        .input("maj_name", sql.VarChar, maj_name)
        .input("start_time", sql.VarChar, start_time)
        .input("end_time", sql.VarChar, end_time)
        .input("activity_document", sql.VarBinary, pdfContent)
        .query(
          "INSERT INTO student_form (activity_name, activity_year, activity_date, activity_hours, activity_type, student_id, student_name, activity_document, fac_name, maj_name, start_time, end_time) OUTPUT INSERTED.s_id VALUES (@activity_name, @activity_year, @activity_date, @activity_hours, @activity_type, @student_id, @student_name, @activity_document, @fac_name, @maj_name, @start_time, @end_time)"
        );

      fs.unlinkSync(pdfFile.path);

      res.status(200).send("Form submitted successfully!");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error submitting form");
    }
  }
);

app.get("/student_blood_edit", async (req, res) => {
  try {
    // Open a database connection from the connection pool
    const connection = await pool.connect();

    const s_id = req.query.s_id;

    // Select all data from the teacher_form table where activity_year matches and check_activity is equal to "ผ่าน"
    const result = await connection.query(
      `SELECT * FROM student_form WHERE s_id = ${s_id}`
    );

    // Convert the binary image data to base64-encoded strings
    const data = await Promise.all(
      result.recordset.map(async (row) => {
        let activityPicture = null;
        if (row.activity_picture) {
          const resizedImageBuffer = await sharp(row.activity_picture)
            .resize(350) // Resize the image to a width of 500 pixels (adjust as needed)
            .toBuffer();
          activityPicture = resizedImageBuffer.toString("base64");
        }

        return {
          ...row,
          activity_picture: activityPicture,
        };
      })
    );

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
  "/student_blood_edit",
  upload.array("activity_pictures", 10),
  async (req, res) => {
    try {
      const {
        activity_name,
        activity_year,
        activity_date,
        activity_place,
        activity_position,
        s_id,
      } = req.body;

      const pool = await sql.connect(config);

      let query =
        "UPDATE student_form SET activity_year=@activity_year, activity_date=@activity_date, activity_place=@activity_place, activity_position=@activity_position";
      query += ", check_activity=NULL WHERE s_id=@s_id";

      await pool
        .request()
        .input("activity_name", sql.VarChar, activity_name)
        .input("activity_year", sql.VarChar, activity_year)
        .input("activity_date", sql.VarChar, activity_date)
        .input("activity_place", sql.VarChar, activity_place)
        .input("activity_position", sql.VarChar, activity_position)
        .input("s_id", sql.Int, req.query.s_id)
        .query(query);

      // Get the existing pictures for the form
      const existingPicturesQuery =
        "SELECT * FROM activity_pictures WHERE s_id = @s_id";
      const existingPictures = await pool
        .request()
        .input("s_id", sql.Int, req.query.s_id)
        .query(existingPicturesQuery);

      // Insert image data into teacher_pictures table
      const files = req.files;
      if (files.length > 0) {
        // Delete the existing pictures
        const deletePictureQuery =
          "DELETE FROM activity_pictures WHERE picture_id = @picture_id";
        for (const picture of existingPictures.recordset) {
          await pool
            .request()
            .input("picture_id", sql.Int, picture.picture_id)
            .query(deletePictureQuery);
        }

        for (let i = 0; i < files.length; i++) {
          const pictureContent = fs.readFileSync(files[i].path);
          const resizedImage = await sharp(pictureContent)
            .resize({ width: 500 })
            .toBuffer();

          const insertQuery =
            "INSERT INTO activity_pictures (s_id, picture_data) VALUES (@s_id, @picture_data)";
          await pool
            .request()
            .input("s_id", sql.Int, req.query.s_id)
            .input("picture_data", sql.VarBinary, resizedImage)
            .query(insertQuery);
          fs.unlinkSync(files[i].path);
        }
      }

      res.status(200).send("Form updated successfully!");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error updating form");
    }
  }
);

app.post(
  "/student_online_edit",
  upload.fields([{ name: "activity_document", maxCount: 1 }]),
  async (req, res) => {
    try {
      const {
        activity_name,
        activity_year,
        activity_date,
        activity_hours,
        student_id,
        start_time,
        end_time,
        s_id,
      } = req.body;

      const pdfFile =
        req.files && req.files["activity_document"]
          ? req.files["activity_document"][0]
          : null;

      let pdfContent = null;
      if (pdfFile) {
        if (pdfFile.mimetype === "application/pdf") {
          try {
            const pdfBuffer = fs.readFileSync(pdfFile.path);
            await PDFDocument.load(pdfBuffer); // Attempt to load the PDF to validate it
            pdfContent = pdfBuffer;
          } catch (error) {
            console.error("Invalid PDF file:", error);
            // Handle the case when the uploaded file is not a valid PDF
          }
        } else {
          // Handle the case when the uploaded file is not a PDF
        }
      }

      const pool = await sql.connect(config);

      if (activity_hours !== null) {
        const existingActivities = await pool
          .request()
          .input("activity_year", sql.VarChar, activity_year)
          .input("s_id", sql.Int, req.query.s_id)
          .query(
            `SELECT SUM(activity_hours) - ISNULL((SELECT activity_hours from student_form WHERE s_id=@s_id), 0) AS total_hours FROM student_form WHERE activity_year = @activity_year AND activity_type='กิจกรรมอบรมออนไลน์จิตสาธารณะ กยศ.' AND student_id = '${student_id}'`
          );

          const totalHours = parseInt(
            existingActivities.recordset[0].total_hours || 0,
            10
          );

        const newHours = parseInt(activity_hours, 10);

        if (newHours + totalHours <= 6) {
          const remainingHours = 6 - totalHours;
          const updatedHours = Math.min(newHours, remainingHours);

          await pool
            .request()
            .input("activity_year", sql.VarChar, activity_year)
            .input("activity_hours", sql.Int, updatedHours)
            .input("s_id", sql.Int, req.query.s_id)
            .query(
              `UPDATE student_form SET activity_hours = activity_hours + @activity_hours WHERE activity_year = @activity_year AND activity_type='กิจกรรมอบรมออนไลน์จิตสาธารณะ กยศ.' AND s_id = @s_id`
            );
        } else {
          const errorMessage = `ชั่วโมงกิจกรรมอบรมออนไลน์จิตสาธารณะ กยศ. จะต้องไม่เกิน 6 ชั่วโมงต่อภาคเรียน จำนวนชั่วโมงปัจจุบัน ${totalHours} ชั่วโมง`;

          // Return an error response if totalHours is greater than 6
          return res.status(400).json({ error: errorMessage, totalHours });
        }
      }

      let query =
        "UPDATE student_form SET activity_year=@activity_year, activity_date=@activity_date, activity_name=@activity_name, activity_hours=@activity_hours, start_time=@start_time, end_time=@end_time";
      query += ", check_activity=NULL WHERE s_id=@s_id";

      // Check if activity_hours exceeds 6 hours per activity_year
      await pool
        .request()
        .input("activity_name", sql.VarChar, activity_name)
        .input("activity_year", sql.VarChar, activity_year)
        .input("activity_date", sql.VarChar, activity_date)
        .input("activity_hours", sql.Int, activity_hours)
        .input("start_time", sql.VarChar, start_time)
        .input("end_time", sql.VarChar, end_time)
        .input("s_id", sql.Int, req.query.s_id)
        .query(query);

      if (pdfContent) {
        const updateQuery =
          "UPDATE student_form SET activity_document=@activity_document WHERE s_id=@s_id";

        await pool
          .request()
          .input("activity_document", sql.VarBinary, pdfContent)
          .input("s_id", sql.Int, req.query.s_id)
          .query(updateQuery);

        fs.unlinkSync(pdfFile.path);
      }

      res.status(200).send("Form updated successfully!");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error updating form");
    }
  }
);

app.post(
  "/student_outside_edit",
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
        activity_target,
        activity_position,
        activity_place,
        student_id,
        start_time,
        end_time,
        s_id,
      } = req.body;

      const pdfFile =
        req.files && req.files["activity_document"]
          ? req.files["activity_document"][0]
          : null;

      let pdfContent = null;
      if (pdfFile) {
        if (pdfFile.mimetype === "application/pdf") {
          try {
            const pdfBuffer = fs.readFileSync(pdfFile.path);
            await PDFDocument.load(pdfBuffer); // Attempt to load the PDF to validate it
            pdfContent = pdfBuffer;
          } catch (error) {
            console.error("Invalid PDF file:", error);
            // Handle the case when the uploaded file is not a valid PDF
          }
        } else {
          // Handle the case when the uploaded file is not a PDF
        }
      }

      const pool = await sql.connect(config);

      if (activity_hours !== null) {
        const existingActivities = await pool
          .request()
          .input("activity_year", sql.VarChar, activity_year)
          .input("s_id", sql.Int, req.query.s_id)
          .query(
            `SELECT SUM(activity_hours) - ISNULL((SELECT activity_hours from student_form WHERE s_id=@s_id), 0) AS total_hours FROM student_form WHERE activity_year = @activity_year AND activity_type='กิจกรรมจิตอาสาเข้าร่วมด้วยตนเอง' AND student_id = '${student_id}'`
          );

          const totalHours = parseInt(
            existingActivities.recordset[0].total_hours || 0,
            10
          );

        const newHours = parseInt(activity_hours, 10);

        if (newHours + totalHours <= 6) {
          const remainingHours = 6 - totalHours;
          const updatedHours = Math.min(newHours, remainingHours);

          await pool
            .request()
            .input("activity_year", sql.VarChar, activity_year)
            .input("activity_hours", sql.Int, updatedHours)
            .input("s_id", sql.Int, req.query.s_id)
            .query(
              `UPDATE student_form SET activity_hours = activity_hours + @activity_hours WHERE activity_year = @activity_year AND activity_type='กิจกรรมจิตอาสาเข้าร่วมด้วยตนเอง' AND s_id = @s_id`
            );
        } else {
          const errorMessage = `ชั่วโมงกิจกรรมจิตอาสาเข้าร่วมด้วยตนเอง จะต้องไม่เกิน 6 ชั่วโมงต่อภาคเรียน จำนวนชั่วโมงปัจจุบัน ${totalHours} ชั่วโมง`;

          // Return an error response if totalHours is greater than 6
          return res.status(400).json({ error: errorMessage, totalHours });
        }
      }

      let query =
        "UPDATE student_form SET activity_name=@activity_name, activity_position=@activity_position, activity_place=@activity_place, activity_year=@activity_year, activity_date=@activity_date, activity_hours=@activity_hours, activity_target=@activity_target, start_time=@start_time, end_time=@end_time";
      query += ", check_activity=NULL WHERE s_id=@s_id";

      // Check if activity_hours exceeds 6 hours per activity_year
      await pool
        .request()
        .input("activity_name", sql.VarChar, activity_name)
        .input("activity_position", sql.VarChar, activity_position)
        .input("activity_place", sql.VarChar, activity_place)
        .input("activity_year", sql.VarChar, activity_year)
        .input("activity_target", sql.VarChar, activity_target)
        .input("activity_date", sql.VarChar, activity_date)
        .input("activity_hours", sql.Int, activity_hours)
        .input("start_time", sql.VarChar, start_time)
        .input("end_time", sql.VarChar, end_time)
        .input("s_id", sql.Int, req.query.s_id)
        .query(query);

      const existingPicturesQuery =
        "SELECT * FROM activity_pictures WHERE s_id = @s_id";

      // Insert image data into teacher_pictures table
      const picturesFiles = req.files && req.files["activity_pictures"];
      if (picturesFiles && picturesFiles.length > 0) {
        // Delete the existing pictures
        const deletePictureQuery =
          "DELETE FROM activity_pictures WHERE picture_id = @picture_id";
        const existingPictures = await pool
          .request()
          .input("s_id", sql.Int, req.query.s_id)
          .query(existingPicturesQuery);

        for (const picture of existingPictures.recordset) {
          await pool
            .request()
            .input("picture_id", sql.Int, picture.picture_id)
            .query(deletePictureQuery);
        }

        for (let i = 0; i < picturesFiles.length; i++) {
          const pictureContent = fs.readFileSync(picturesFiles[i].path);
          const resizedImage = await sharp(pictureContent)
            .resize({ width: 500 })
            .toBuffer();

          const insertQuery =
            "INSERT INTO activity_pictures (s_id, picture_data) VALUES (@s_id, @picture_data)";
          await pool
            .request()
            .input("s_id", sql.Int, req.query.s_id)
            .input("picture_data", sql.VarBinary, resizedImage)
            .query(insertQuery);
          fs.unlinkSync(picturesFiles[i].path);
        }
      }

      if (pdfContent) {
        const updateQuery =
          "UPDATE student_form SET activity_document=@activity_document WHERE s_id=@s_id";

        await pool
          .request()
          .input("activity_document", sql.VarBinary, pdfContent)
          .input("s_id", sql.Int, req.query.s_id)
          .query(updateQuery);

        fs.unlinkSync(pdfFile.path);
      }

      res.status(200).send("Form updated successfully!");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error updating form");
    }
  }
);

app.post("/check-student-inside", async (req, res) => {
  const { s_id, status, check_inside } = req.body;
  try {
    // Create a SQL Server connection pool
    const pool = await sql.connect(config);

    // Update the check_activity or edit_reason column in the teacher_form table
    if (status === "ผ่าน") {
      await pool
        .request()
        .input("s_id", sql.Int, s_id)
        .input("check_inside", sql.VarChar, status).query(`
          UPDATE student_form
          SET check_inside = @check_inside
          WHERE s_id = @s_id
        `);
    } else if (status === "แก้ไข") {
      await pool
        .request()
        .input("s_id", sql.Int, s_id)
        .input("check_inside", sql.NVarChar, check_inside || null).query(`
          UPDATE student_form
          SET check_inside = @check_inside
          WHERE s_id = @s_id
        `);
    }
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.get("/student_form", async (req, res) => {
  try {
    // Open a database connection from the connection pool
    const connection = await pool.connect();

    // Get the student_id from the query string
    const studentId = req.query.student_id;
    const activityType = req.query.activity_type;

    // Select all data from the student_form table where student_id matches
    const result = await connection.query(`
    SELECT sf.s_id, sf.student_id, sf.student_name, sf.activity_type, sf.activity_name, sf.activity_year, sf.activity_date,
       sf.activity_hours, sf.activity_target, sf.activity_position, sf.t_id, sf.last_date, sf.fac_name,
       sf.maj_name, sf.check_activity, sf.check_inside, sf.approver_name, sf.start_time, sf.end_time,
       sf.activity_time_period, sf.activity_place, sf.check_fail, ap.picture_count
FROM student_form sf
LEFT JOIN (
    SELECT s_id, COUNT(picture_id) AS picture_count
    FROM activity_pictures
    GROUP BY s_id
) ap ON sf.s_id = ap.s_id
WHERE sf.student_id = ${studentId} AND sf.activity_type = '${activityType}'
 
    `);

    await connection.close();

    // Send the data back to the client as a response
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving data");
  }
});

app.get("/student_form_pdf", async (req, res) => {
  try {
    // Open a database connection from the connection pool
    const connection = await pool.connect();

    // Get the student_id from the query string
    const s_id = req.query.s_id;

    // Select all data from the student_form table where student_id matches
    const result = await connection.query(`
    SELECT activity_document FROM student_form WHERE s_id=${s_id}
    `);

    await connection.close();

    // Send the data back to the client as a response
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving data");
  }
});

app.get("/student_form_check", async (req, res) => {
  try {
    // Open a database connection from the connection pool
    const connection = await pool.connect();

    // Get the student_id from the query string
    const studentId = req.query.student_id;

    // Select all data from the student_form table where student_id matches
    const result = await connection.query(
      `SELECT t_id FROM teacher_form
      WHERE t_id NOT IN (
        SELECT DISTINCT t_id FROM student_form WHERE student_id = '${studentId}' AND t_id IS NOT NULL
      );`
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

app.get("/student_6_hours", async (req, res) => {
  try {
    // Open a database connection from the connection pool
    const connection = await pool.connect();

    // Get the student_id and activity_year from the query string
    const studentId = req.query.student_id;
    const activityYear = req.query.activity_year;

    // Select data from the student_form table where student_id matches and activity_type is either 'กิจกรรมจิตอาสาเข้าร่วมด้วยตนเอง' or 'กิจกรรมอบรมออนไลน์จิตสาธารณะ กยศ.'
    const resultOutside = await connection.query(
      `SELECT activity_hours, activity_year FROM student_form WHERE student_id = ${studentId} AND activity_year = '${activityYear}' AND activity_type = 'กิจกรรมจิตอาสาเข้าร่วมด้วยตนเอง'`
    );

    const resultOnline = await connection.query(
      `SELECT activity_hours, activity_year FROM student_form WHERE student_id = ${studentId} AND activity_year = '${activityYear}' AND activity_type = 'กิจกรรมอบรมออนไลน์จิตสาธารณะ กยศ.'`
    );

    // Close the database connection
    await connection.close();

    // Combine the results of both queries
    const data = {
      hoursOutside: resultOutside.recordset,
      hoursOnline: resultOnline.recordset,
    };

    // Send the data back to the client as a response
    res.status(200).json(data);
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
      `SELECT s_id, student_name, student_id, activity_name, activity_year, activity_hours, t_id, activity_date, activity_position, last_date, fac_name, maj_name, check_inside, activity_time_period FROM student_form WHERE t_id = ${t_id} `
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

app.get("/student_total_hours", async (req, res) => {
  try {
    // Open a database connection from the connection pool
    const connection = await pool.connect();

    const student_id = req.query.student_id;
    const activityYear = req.query.activity_year;

    // Select the sum of activity_hours where check_activity is 'ผ่าน'
    const passResult = await connection.query(`
      SELECT COALESCE(SUM(activity_hours), 0) AS total_pass_hours FROM student_form WHERE student_id = '${student_id}' AND check_activity = 'ผ่าน'
    `);

    // Select the sum of activity_hours where check_activity is not 'ผ่าน'
    const pendingResult = await connection.query(`
      SELECT COALESCE(SUM(activity_hours), 0) AS total_pending_hours FROM student_form WHERE student_id = '${student_id}' AND check_activity IS NULL AND check_fail IS NULL
    `);

    const editResult = await connection.query(`
      SELECT COALESCE(SUM(activity_hours), 0) AS total_edit_hours FROM student_form WHERE student_id = '${student_id}' AND check_activity IS NOT NULL AND check_activity <> 'ผ่าน'
    `);

    const failResult = await connection.query(`
      SELECT COALESCE(SUM(activity_hours), 0) AS total_fail_hours FROM student_form WHERE student_id = '${student_id}' AND check_activity IS NULL AND check_fail IS NOT NULL
    `);

    let yearPassHours = 0;
    let yearPendingHours = 0;
    let yearEditHours = 0;
    let yearFailHours = 0;

    if (activityYear) {
      const passYearResult = await connection.query(`
        SELECT COALESCE(SUM(activity_hours), 0) AS year_pass_hours FROM student_form WHERE student_id = '${student_id}' AND check_activity = 'ผ่าน' AND activity_year = '${activityYear}'
      `);

      const pendingYearResult = await connection.query(`
        SELECT COALESCE(SUM(activity_hours), 0) AS year_pending_hours FROM student_form WHERE student_id = '${student_id}' AND check_activity IS NULL AND check_fail IS NULL AND activity_year = '${activityYear}'
      `);

      const editYearResult = await connection.query(`
        SELECT COALESCE(SUM(activity_hours), 0) AS year_edit_hours FROM student_form WHERE student_id = '${student_id}' AND check_activity IS NOT NULL AND check_activity <> 'ผ่าน' AND activity_year = '${activityYear}'
      `);

      const failYearResult = await connection.query(`
        SELECT COALESCE(SUM(activity_hours), 0) AS year_fail_hours FROM student_form WHERE student_id = '${student_id}' AND check_activity IS NULL AND check_fail IS NOT NULL AND activity_year = '${activityYear}'
      `);

      yearPassHours = passYearResult.recordset[0].year_pass_hours;
      yearPendingHours = pendingYearResult.recordset[0].year_pending_hours;
      yearEditHours = editYearResult.recordset[0].year_edit_hours;
      yearFailHours = failYearResult.recordset[0].year_fail_hours;
    }

    // Extract the total hours from the query results
    const totalPassHours = passResult.recordset[0].total_pass_hours;
    const totalPendingHours = pendingResult.recordset[0].total_pending_hours;
    const totalEditHours = editResult.recordset[0].total_edit_hours;
    const totalFailHours = failResult.recordset[0].total_fail_hours;

    // Create a response object with the total hours
    const response = {
      total_pass_hours: totalPassHours,
      total_pending_hours: totalPendingHours,
      total_edit_hours: totalEditHours,
      total_fail_hours: totalFailHours,
    };

    if (!activityYear) {
      // If no activityYear is provided, include the year-specific totals as 0
      response.year_pass_hours = 0;
      response.year_pending_hours = 0;
      response.year_edit_hours = 0;
      response.year_fail_hours = 0;
    } else {
      const yearResponse = {
        year_pass_hours: yearPassHours,
        year_pending_hours: yearPendingHours,
        year_edit_hours: yearEditHours,
        year_fail_hours: yearFailHours,
      };

      // Merge the year-specific totals into the response object
      Object.assign(response, yearResponse);
    }

    await connection.close();

    // Send the response back to the client
    res.status(200).json(response);
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
      const images = result.recordset.map(async (record) => {
        if (record.picture_data) {
          const compressedImage = await sharp(record.picture_data)
            .resize(500) // set the maximum width to 500 pixels
            .jpeg({ quality: 80 }) // compress the image to 50% quality
            .toBuffer();
          return compressedImage.toString("base64");
        } else {
          return null;
        }
      });
      res.send(await Promise.all(images));
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

app.get("/display_student_activity", async (req, res) => {
  try {
    // Open a database connection from the connection pool
    const connection = await pool.connect();

    // Get the student_id from the query string
    const activityType = req.query.activity_type;
    const activityYear = req.query.activity_year;

    // Select all data from the student_form table where student_id matches
    const result = await connection.query(
      `SELECT * FROM student_form WHERE activity_type='${activityType}' AND activity_year='${activityYear}'`
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

app.get("/student_inside_check", async (req, res) => {
  try {
    // Open a database connection from the connection pool
    const connection = await pool.connect();

    // Get the activity_type and activity_year from the query string
    const activityType = req.query.activity_type;
    const activityYear = req.query.activity_year;

    // Select data from the student_form table and join with the teacher_form table
    const result = await connection.query(`
      SELECT sf.*, tf.teacher_name, tf.department, tf.activity_place
      FROM student_form sf
      JOIN teacher_form tf ON sf.t_id = tf.t_id
      WHERE sf.activity_type = 'กิจกรรมโดยคณะวิชา ศูนย์ สำนัก'
        AND sf.check_inside = 'ผ่าน'
    `);

    // Close the database connection
    await connection.close();

    // Send the data back to the client as a response
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving data");
  }
});

app.post("/check-activity-inside", async (req, res) => {
  const { s_id, status, check_activity, check_fail } = req.body;
  try {
    // Create a SQL Server connection pool
    const pool = await sql.connect(config);

    // Update the check_activity or edit_reason column in the teacher_form table
    if (status === "ผ่าน") {
      await pool
        .request()
        .input("s_id", sql.Int, s_id)
        .input("check_activity", sql.VarChar, status).query(`
          UPDATE student_form
          SET check_activity = @check_activity
          WHERE s_id = @s_id
        `);
    } else if (status === "แก้ไข") {
      await pool
        .request()
        .input("s_id", sql.Int, s_id)
        .input("check_activity", sql.NVarChar, check_activity || null).query(`
          UPDATE student_form
          SET check_activity = @check_activity
          WHERE s_id = @s_id
        `);
    } else if (status === "ไม่ผ่าน") {
      await pool
        .request()
        .input("s_id", sql.Int, s_id)
        .input("check_fail", sql.NVarChar, check_fail || null).query(`
          UPDATE student_form
          SET check_fail = @check_fail
          WHERE s_id = @s_id
        `);
    }
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.get("/export-online-to-excel", async (req, res) => {
  try {
    await sql.connect(config);

    const activityYearExcel = req.query.activityYearExcel;
    const response = await axios.get(`http://appz.vu.ac.th:8989/VuAPIVer1/vu_volunteer/select_personal_data_id.php`);
    const data = response.data;

    const perSystemIDs = data.map(item => item.Per_SystemID);

    console.log(perSystemIDs);

    // Query the database to retrieve data
    const result = await sql.query(`
    SELECT
    *,
    CASE
      WHEN check_activity = 'ผ่าน' THEN activity_hours
      ELSE NULL
    END AS pass_hours,
    CASE
      WHEN check_activity IS NULL  AND check_fail IS NULL THEN activity_hours
      ELSE NULL
    END AS pending_hours,
    CASE
      WHEN check_activity IS NOT NULL AND check_activity != 'ผ่าน' THEN activity_hours
      ELSE NULL
    END AS edit_hours,
    CASE
      WHEN check_activity IS NULL AND check_fail IS NOT NULL THEN activity_hours
      ELSE NULL
    END AS fail_hours
  FROM student_form
  WHERE activity_type = 'กิจกรรมอบรมออนไลน์จิตสาธารณะ กยศ.' AND activity_year = '${activityYearExcel}'
    `);

    // Check if any data is returned from the query
    if (result.recordset.length === 0) {
      return res.status(404).send("No data found");
    }

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet 1");

    // Merge cells for the header
    worksheet.mergeCells("A1:J1");
    worksheet.mergeCells("A2:J2");
    worksheet.mergeCells("G3:J3");
    worksheet.mergeCells("A3:A4");
    worksheet.mergeCells("B3:B4");
    worksheet.mergeCells("C3:C4");
    worksheet.mergeCells("D3:D4");
    worksheet.mergeCells("E3:E4");
    worksheet.mergeCells("F3:F4");
    worksheet.mergeCells("G3:G4");


    // Set the header text in Thai language
    const headerTextLine1 =
      "รายชื่อนักศึกษาเข้าร่วมกิจกรรมอบรมออนไลน์จิตสาธารณะ";
    const headerTextLine2 = `ประจำภาคเรียนที่ ${activityYearExcel}`;

    // Set the header values and formatting for each line
    const headerCellLine1 = worksheet.getCell("A1");
    headerCellLine1.value = headerTextLine1;
    headerCellLine1.font = { bold: true };
    headerCellLine1.alignment = { vertical: "middle", horizontal: "center" };

    const headerCellLine2 = worksheet.getCell("A2");
    headerCellLine2.value = headerTextLine2;
    headerCellLine2.font = { bold: true };
    headerCellLine2.alignment = { vertical: "middle", horizontal: "center" };

    // Set the header row with column names in Thai text
    const headerValues = [
      "ลำดับ",
      "รหัสนักศึกษา",
      "เลขที่บัตรประจำตัวประชาชน",
      "ชื่อ - สกุล",
      "คณะวิชา",
      "หลักสูตร/สาขาวิชา",
      "หัวข้อการเข้าอบรม",
      "จำนวนชั่วโมงจิตอาสา",
    ];

    headerValues.forEach((header, index) => {
      const cell = worksheet.getCell(`${String.fromCharCode(65 + index)}3`);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "ECDC9D" }, // Orange background color
      };
    });

    const orangeFill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "ECDC9D" }, // Orange color code
    };

    worksheet.getCell("H4").value = "รอพิจารณา";
    worksheet.getCell("I4").value = "ไม่ผ่าน";
    worksheet.getCell("J4").value = "แก้ไข";
    worksheet.getCell("K4").value = "ผ่าน";
    worksheet.getRow(4).font = { bold: true };
    worksheet.getCell("H4").fill = orangeFill;
    worksheet.getCell("I4").fill = orangeFill;
    worksheet.getCell("J4").fill = orangeFill;
    worksheet.getCell("K4").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "95C23B" }, // Green background color
    };

    // Add data rows to the worksheet with sequence numbers
    result.recordset.forEach((row, index) => {
      const rowIndex = index + 5; // Start from row 4
      worksheet.getCell(`A${rowIndex}`).value = index + 1; // Sequence number
      worksheet.getCell(`B${rowIndex}`).value = row.student_id;
      worksheet.getCell(`C${rowIndex}`).value = row.student_name;
      worksheet.getCell(`D${rowIndex}`).value = row.student_name;
      worksheet.getCell(`E${rowIndex}`).value = row.fac_name;
      worksheet.getCell(`F${rowIndex}`).value = row.maj_name;
      worksheet.getCell(`G${rowIndex}`).value = row.activity_name;
      worksheet.getCell(`H${rowIndex}`).value = row.pending_hours;
      worksheet.getCell(`I${rowIndex}`).value = row.fail_hours;
      worksheet.getCell(`J${rowIndex}`).value = row.edit_hours;
      worksheet.getCell(`K${rowIndex}`).value = row.pass_hours;
    });

    // Set column widths
    worksheet.getColumn("A").width = 10;
    worksheet.getColumn("B").width = 20;
    worksheet.getColumn("C").width = 20;
    worksheet.getColumn("D").width = 20;
    worksheet.getColumn("E").width = 20;
    worksheet.getColumn("F").width = 20;
    worksheet.getColumn("G").width = 20;
    worksheet.getColumn("H").width = 20;
    worksheet.getColumn("I").width = 20;
    worksheet.getColumn("J").width = 20;
    worksheet.getColumn("K").width = 20;


    // Generate the Excel file in memory
    const buffer = await workbook.xlsx.writeBuffer();

    // Set response headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(
        "กิจกรรมอบรมออนไลน์.xlsx"
      )}`
    );

    // Send the Excel file as the response
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error exporting data to Excel");
  } finally {
    // Close the database connection
    sql.close();
  }
});

app.get("/export-blood-to-excel", async (req, res) => {
  try {
    await sql.connect(config);

    const activityYearExcel = req.query.activityYearExcel;

    // Query the database to retrieve data
    const result = await sql.query(`
    SELECT
    *,
    CASE
      WHEN check_activity = 'ผ่าน' THEN activity_hours
      ELSE NULL
    END AS pass_hours,
    CASE
      WHEN check_activity IS NULL  AND check_fail IS NULL THEN activity_hours
      ELSE NULL
    END AS pending_hours,
    CASE
      WHEN check_activity IS NOT NULL AND check_activity != 'ผ่าน' THEN activity_hours
      ELSE NULL
    END AS edit_hours,
    CASE
      WHEN check_activity IS NULL AND check_fail IS NOT NULL THEN activity_hours
      ELSE NULL
    END AS fail_hours
  FROM student_form
  WHERE activity_type = 'กิจกรรมการบริจาคโลหิต' AND activity_year = '${activityYearExcel}'
    `);

    // Check if any data is returned from the query
    if (result.recordset.length === 0) {
      return res.status(404).send("No data found");
    }

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet 1");

    // Merge cells for the header
    worksheet.mergeCells("A1:J1");
    worksheet.mergeCells("A2:J2");
    worksheet.mergeCells("G3:J3");
    worksheet.mergeCells("A3:A4");
    worksheet.mergeCells("B3:B4");
    worksheet.mergeCells("C3:C4");
    worksheet.mergeCells("D3:D4");
    worksheet.mergeCells("E3:E4");
    worksheet.mergeCells("F3:F4");

    // Set the header text in Thai language
    const headerTextLine1 = "รายชื่อนักศึกษาเข้าร่วมกิจกรรมการบริจาคโลหิต";
    const headerTextLine2 = `ประจำภาคเรียนที่ ${activityYearExcel}`;

    // Set the header values and formatting for each line
    const headerCellLine1 = worksheet.getCell("A1");
    headerCellLine1.value = headerTextLine1;
    headerCellLine1.font = { bold: true };
    headerCellLine1.alignment = { vertical: "middle", horizontal: "center" };

    const headerCellLine2 = worksheet.getCell("A2");
    headerCellLine2.value = headerTextLine2;
    headerCellLine2.font = { bold: true };
    headerCellLine2.alignment = { vertical: "middle", horizontal: "center" };

    // Set the header row with column names in Thai text
    const headerValues = [
      "ลำดับ",
      "รหัสนักศึกษา",
      "ชื่อ - สกุล",
      "คณะวิชา",
      "หลักสูตร/สาขาวิชา",
      "จัดขึ้นโดยหน่วยงาน",
      "จำนวนชั่วโมงจิตอาสา",
    ];

    headerValues.forEach((header, index) => {
      const cell = worksheet.getCell(`${String.fromCharCode(65 + index)}3`);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "ECDC9D" }, // Orange background color
      };
    });

    const orangeFill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "ECDC9D" }, // Orange color code
    };

    worksheet.getCell("G4").value = "รอพิจารณา";
    worksheet.getCell("H4").value = "ไม่ผ่าน";
    worksheet.getCell("I4").value = "แก้ไข";
    worksheet.getCell("J4").value = "ผ่าน";
    worksheet.getRow(4).font = { bold: true };
    worksheet.getCell("G4").fill = orangeFill;
    worksheet.getCell("H4").fill = orangeFill;
    worksheet.getCell("I4").fill = orangeFill;
    worksheet.getCell("J4").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "95C23B" }, // Green background color
    };

    // Add data rows to the worksheet with sequence numbers
    result.recordset.forEach((row, index) => {
      const rowIndex = index + 5; // Start from row 4
      worksheet.getCell(`A${rowIndex}`).value = index + 1; // Sequence number
      worksheet.getCell(`B${rowIndex}`).value = row.student_id;
      worksheet.getCell(`C${rowIndex}`).value = row.student_name;
      worksheet.getCell(`D${rowIndex}`).value = row.fac_name;
      worksheet.getCell(`E${rowIndex}`).value = row.maj_name;
      worksheet.getCell(`F${rowIndex}`).value = row.activity_position;
      worksheet.getCell(`G${rowIndex}`).value = row.pending_hours;
      worksheet.getCell(`H${rowIndex}`).value = row.fail_hours;
      worksheet.getCell(`I${rowIndex}`).value = row.edit_hours;
      worksheet.getCell(`J${rowIndex}`).value = row.pass_hours;
    });

    // Set column widths
    worksheet.getColumn("A").width = 10;
    worksheet.getColumn("B").width = 20;
    worksheet.getColumn("C").width = 20;
    worksheet.getColumn("D").width = 20;
    worksheet.getColumn("E").width = 20;
    worksheet.getColumn("F").width = 20;
    worksheet.getColumn("G").width = 20;
    worksheet.getColumn("H").width = 20;
    worksheet.getColumn("I").width = 20;
    worksheet.getColumn("J").width = 20;

    // Generate the Excel file in memory
    const buffer = await workbook.xlsx.writeBuffer();

    // Set response headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(
        "กิจกรรมบริจาคโลหิต.xlsx"
      )}`
    );

    // Send the Excel file as the response
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error exporting data to Excel");
  } finally {
    // Close the database connection
    sql.close();
  }
});

app.get("/export-outside-to-excel", async (req, res) => {
  try {
    await sql.connect(config);

    const activityYearExcel = req.query.activityYearExcel;

    // Query the database to retrieve data
    const result = await sql.query(`
    SELECT
    *,
    CASE
      WHEN check_activity = 'ผ่าน' THEN activity_hours
      ELSE NULL
    END AS pass_hours,
    CASE
      WHEN check_activity IS NULL  AND check_fail IS NULL THEN activity_hours
      ELSE NULL
    END AS pending_hours,
    CASE
      WHEN check_activity IS NOT NULL AND check_activity != 'ผ่าน' THEN activity_hours
      ELSE NULL
    END AS edit_hours,
    CASE
      WHEN check_activity IS NULL AND check_fail IS NOT NULL THEN activity_hours
      ELSE NULL
    END AS fail_hours
  FROM student_form
  WHERE activity_type = 'กิจกรรมจิตอาสาเข้าร่วมด้วยตนเอง' AND activity_year = '${activityYearExcel}'
    `);

    // Check if any data is returned from the query
    if (result.recordset.length === 0) {
      return res.status(404).send("No data found");
    }

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet 1");

    // Merge cells for the header
    worksheet.mergeCells("A1:J1");
    worksheet.mergeCells("A2:J2");
    worksheet.mergeCells("H3:K3");
    worksheet.mergeCells("A3:A4");
    worksheet.mergeCells("B3:B4");
    worksheet.mergeCells("C3:C4");
    worksheet.mergeCells("D3:D4");
    worksheet.mergeCells("E3:E4");
    worksheet.mergeCells("F3:F4");
    worksheet.mergeCells("G3:G4");

    // Set the header text in Thai language
    const headerTextLine1 =
      "รายชื่อนักศึกษาเข้าร่วมกิจกรรมจิตอาสาเข้าร่วมด้วยตนเอง";
    const headerTextLine2 = `ประจำภาคเรียนที่ ${activityYearExcel}`;

    // Set the header values and formatting for each line
    const headerCellLine1 = worksheet.getCell("A1");
    headerCellLine1.value = headerTextLine1;
    headerCellLine1.font = { bold: true };
    headerCellLine1.alignment = { vertical: "middle", horizontal: "center" };

    const headerCellLine2 = worksheet.getCell("A2");
    headerCellLine2.value = headerTextLine2;
    headerCellLine2.font = { bold: true };
    headerCellLine2.alignment = { vertical: "middle", horizontal: "center" };

    // Set the header row with column names in Thai text
    const headerValues = [
      "ลำดับ",
      "รหัสนักศึกษา",
      "ชื่อ - สกุล",
      "คณะวิชา",
      "หลักสูตร/สาขาวิชา",
      "ชื่อโครงการ/กิจกรรม",
      "สถานที่จัดกิจกรรม",
      "จำนวนชั่วโมงจิตอาสา",
    ];

    headerValues.forEach((header, index) => {
      const cell = worksheet.getCell(`${String.fromCharCode(65 + index)}3`);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "ECDC9D" }, // Orange background color
      };
    });

    const orangeFill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "ECDC9D" }, // Orange color code
    };

    worksheet.getCell("H4").value = "รอพิจารณา";
    worksheet.getCell("I4").value = "ไม่ผ่าน";
    worksheet.getCell("J4").value = "แก้ไข";
    worksheet.getCell("K4").value = "ผ่าน";
    worksheet.getRow(4).font = { bold: true };
    worksheet.getCell("H4").fill = orangeFill;
    worksheet.getCell("I4").fill = orangeFill;
    worksheet.getCell("J4").fill = orangeFill;
    worksheet.getCell("K4").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "95C23B" }, // Green background color
    };

    // Add data rows to the worksheet with sequence numbers
    result.recordset.forEach((row, index) => {
      const rowIndex = index + 5; // Start from row 4
      worksheet.getCell(`A${rowIndex}`).value = index + 1; // Sequence number
      worksheet.getCell(`B${rowIndex}`).value = row.student_id;
      worksheet.getCell(`C${rowIndex}`).value = row.student_name;
      worksheet.getCell(`D${rowIndex}`).value = row.fac_name;
      worksheet.getCell(`E${rowIndex}`).value = row.maj_name;
      worksheet.getCell(`F${rowIndex}`).value = row.activity_name;
      worksheet.getCell(`G${rowIndex}`).value = row.activity_place;
      worksheet.getCell(`H${rowIndex}`).value = row.pending_hours;
      worksheet.getCell(`I${rowIndex}`).value = row.fail_hours;
      worksheet.getCell(`J${rowIndex}`).value = row.edit_hours;
      worksheet.getCell(`K${rowIndex}`).value = row.pass_hours;
    });

    // Set column widths
    worksheet.getColumn("A").width = 10;
    worksheet.getColumn("B").width = 20;
    worksheet.getColumn("C").width = 20;
    worksheet.getColumn("D").width = 20;
    worksheet.getColumn("E").width = 20;
    worksheet.getColumn("F").width = 20;
    worksheet.getColumn("G").width = 20;
    worksheet.getColumn("H").width = 20;
    worksheet.getColumn("I").width = 20;
    worksheet.getColumn("J").width = 20;
    worksheet.getColumn("K").width = 20;

    // Generate the Excel file in memory
    const buffer = await workbook.xlsx.writeBuffer();

    // Set response headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(
        "กิจกรรมเข้าร่วมด้วยตนเอง.xlsx"
      )}`
    );

    // Send the Excel file as the response
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error exporting data to Excel");
  } finally {
    // Close the database connection
    sql.close();
  }
});

app.get("/export-inside-to-excel", async (req, res) => {
  try {
    await sql.connect(config);

    const activityYearExcel = req.query.activityYearExcel;

    // Query the database to retrieve data
    const result = await sql.query(`
    SELECT
  *,
  CASE
    WHEN sf.check_activity = 'ผ่าน' THEN sf.activity_hours
    ELSE NULL
  END AS pass_hours,
  CASE
    WHEN sf.check_activity IS NULL AND sf.check_fail IS NULL THEN sf.activity_hours
    ELSE NULL
  END AS pending_hours,
  CASE
    WHEN sf.check_activity IS NOT NULL AND sf.check_activity != 'ผ่าน' THEN sf.activity_hours
    ELSE NULL
  END AS edit_hours,
  CASE
    WHEN sf.check_activity IS NULL AND sf.check_fail IS NOT NULL THEN sf.activity_hours
    ELSE NULL
  END AS fail_hours
FROM student_form sf
JOIN teacher_form tf ON sf.t_id = tf.t_id
WHERE sf.activity_type = 'กิจกรรมโดยคณะวิชา ศูนย์ สำนัก' AND sf.activity_year = '${activityYearExcel}' AND sf.check_inside = 'ผ่าน'
    `);

    // Check if any data is returned from the query
    if (result.recordset.length === 0) {
      return res.status(404).send("No data found");
    }

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet 1");

    // Merge cells for the header
    worksheet.mergeCells("A1:J1");
    worksheet.mergeCells("A2:J2");
    worksheet.mergeCells("H3:K3");
    worksheet.mergeCells("A3:A4");
    worksheet.mergeCells("B3:B4");
    worksheet.mergeCells("C3:C4");
    worksheet.mergeCells("D3:D4");
    worksheet.mergeCells("E3:E4");
    worksheet.mergeCells("F3:F4");
    worksheet.mergeCells("G3:G4");

    // Set the header text in Thai language
    const headerTextLine1 =
      "รายชื่อนักศึกษาเข้าร่วมกิจกรรมโดยคณะวิชา ศูนย์ สำนัก";
    const headerTextLine2 = `ประจำภาคเรียนที่ ${activityYearExcel}`;

    // Set the header values and formatting for each line
    const headerCellLine1 = worksheet.getCell("A1");
    headerCellLine1.value = headerTextLine1;
    headerCellLine1.font = { bold: true };
    headerCellLine1.alignment = { vertical: "middle", horizontal: "center" };

    const headerCellLine2 = worksheet.getCell("A2");
    headerCellLine2.value = headerTextLine2;
    headerCellLine2.font = { bold: true };
    headerCellLine2.alignment = { vertical: "middle", horizontal: "center" };

    // Set the header row with column names in Thai text
    const headerValues = [
      "ลำดับ",
      "รหัสนักศึกษา",
      "ชื่อ - สกุล",
      "คณะวิชา",
      "หลักสูตร/สาขาวิชา",
      "ชื่อโครงการ/กิจกรรม",
      "จัดขึ้นโดยหน่วยงาน",
      "จำนวนชั่วโมงจิตอาสา",
    ];

    headerValues.forEach((header, index) => {
      const cell = worksheet.getCell(`${String.fromCharCode(65 + index)}3`);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "ECDC9D" }, // Orange background color
      };
    });

    const orangeFill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "ECDC9D" }, // Orange color code
    };

    worksheet.getCell("H4").value = "รอพิจารณา";
    worksheet.getCell("I4").value = "ไม่ผ่าน";
    worksheet.getCell("J4").value = "แก้ไข";
    worksheet.getCell("K4").value = "ผ่าน";
    worksheet.getRow(4).font = { bold: true };
    worksheet.getCell("H4").fill = orangeFill;
    worksheet.getCell("I4").fill = orangeFill;
    worksheet.getCell("J4").fill = orangeFill;
    worksheet.getCell("K4").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "95C23B" }, // Green background color
    };

    // Add data rows to the worksheet with sequence numbers
    result.recordset.forEach((row, index) => {
      const rowIndex = index + 5; // Start from row 4
      worksheet.getCell(`A${rowIndex}`).value = index + 1; // Sequence number
      worksheet.getCell(`B${rowIndex}`).value = row.student_id;
      worksheet.getCell(`C${rowIndex}`).value = row.student_name;
      worksheet.getCell(`D${rowIndex}`).value = row.fac_name;
      worksheet.getCell(`E${rowIndex}`).value = row.maj_name;
      worksheet.getCell(`F${rowIndex}`).value = row.activity_name[0];
      worksheet.getCell(`G${rowIndex}`).value = JSON.parse(
        row.department
      ).dep_name;
      worksheet.getCell(`H${rowIndex}`).value = row.pending_hours;
      worksheet.getCell(`I${rowIndex}`).value = row.fail_hours;
      worksheet.getCell(`J${rowIndex}`).value = row.edit_hours;
      worksheet.getCell(`K${rowIndex}`).value = row.pass_hours;
    });

    // Set column widths
    worksheet.getColumn("A").width = 10;
    worksheet.getColumn("B").width = 20;
    worksheet.getColumn("C").width = 20;
    worksheet.getColumn("D").width = 20;
    worksheet.getColumn("E").width = 20;
    worksheet.getColumn("F").width = 20;
    worksheet.getColumn("G").width = 20;
    worksheet.getColumn("H").width = 20;
    worksheet.getColumn("I").width = 20;
    worksheet.getColumn("J").width = 20;
    worksheet.getColumn("K").width = 20;

    // Generate the Excel file in memory
    const buffer = await workbook.xlsx.writeBuffer();

    // Set response headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(
        "กิจกรรมคณะ_ศูนย์_สำนัก.xlsx"
      )}`
    );

    // Send the Excel file as the response
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error exporting data to Excel");
  } finally {
    // Close the database connection
    sql.close();
  }
});

app.get("/test_id", async (req, res) => {
  try {
    // Open a database connection from the connection pool
    const connection = await pool.connect();

    // Get the student_id from the query string

    // Select all data from the student_form table where student_id matches
    const result = await connection.query(
      `SELECT student_id from student_form `
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

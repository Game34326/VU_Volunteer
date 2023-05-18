var sql = require("mssql");
var express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
var multer = require("multer");
var fs = require("fs");
const sharp = require("sharp");

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
    encrypt: true,
    trustServerCertificate: true,
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
        activity_style,
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
        .input("activity_style", sql.VarChar, activity_style)
        .query(
          "INSERT INTO teacher_form (activity_name, activity_year, activity_date, teacher_id, teacher_name, last_date, activity_place, department, create_time, activity_style) OUTPUT INSERTED.t_id VALUES (@activity_name, @activity_year, @activity_date, @teacher_id, @teacher_name, @last_date, @activity_place, @department, GETDATE(), @activity_style)"
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
        activity_style,
        t_id,
      } = req.body;

      const pool = await sql.connect(config);

      let query =
        "UPDATE teacher_form SET department=@department, activity_name=@activity_name, activity_year=@activity_year, activity_date=@activity_date, last_date=@last_date, activity_place=@activity_place, activity_style=@activity_style";
      query += ", check_activity=NULL WHERE t_id=@t_id";

      await pool
        .request()
        .input("activity_name", sql.VarChar, activity_name)
        .input("activity_year", sql.VarChar, activity_year)
        .input("activity_date", sql.VarChar, activity_date)
        .input("last_date", sql.VarChar, last_date)
        .input("activity_place", sql.VarChar, activity_place)
        .input("department", sql.VarChar, department)
        .input("activity_style", sql.VarChar, activity_style)
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
    await connection.close();

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

app.get("/teacher_form_check", async (req, res) => {
  try {
    // Open a database connection from the connection pool
    const connection = await pool.connect();

    const activityYear = req.query.activity_year;

    // Select all data from the teacher_form table where activity_year matches and check_activity is equal to "ผ่าน"
    const result = await connection.query(
      `SELECT * FROM teacher_form WHERE activity_year = '${activityYear}'`
    );

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
        student_id,
        student_name,
        fac_name,
        maj_name,
        start_time,
        end_time,
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
        .input("start_time", sql.VarChar, start_time)
        .input("end_time", sql.VarChar, end_time)
        .input("activity_document", sql.VarBinary, pdfContent)
        .query(
          "INSERT INTO student_form (activity_name, activity_year, activity_date, activity_hours, activity_type, activity_target, activity_position, student_id, student_name, activity_document, fac_name, maj_name, start_time, end_time) OUTPUT INSERTED.s_id VALUES (@activity_name, @activity_year, @activity_date, @activity_hours, @activity_type, @activity_target, @activity_position, @student_id, @student_name, @activity_document, @fac_name, @maj_name, @start_time, @end_time)"
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
        activity_hours, // added activity_hours parameter
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
        .input("activity_hours", sql.Int, activity_hours) // added input parameter
        .query(
          "INSERT INTO student_form (activity_year, activity_hours, activity_type, student_id, student_name, fac_name, maj_name) OUTPUT INSERTED.s_id VALUES (@activity_year, @activity_hours, @activity_type, @student_id, @student_name, @fac_name, @maj_name)"
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

app.post("/check-student-inside", async (req, res) => {
  const { student_id, status, check_inside } = req.body;
  try {
    // Create a SQL Server connection pool
    const pool = await sql.connect(config);

    // Update the check_activity or edit_reason column in the teacher_form table
    if (status === "ผ่าน") {
      await pool
        .request()
        .input("student_id", sql.Int, student_id)
        .input("check_inside", sql.VarChar, status).query(`
          UPDATE student_form
          SET check_inside = @check_inside
          WHERE student_id = @student_id
        `);
    } else if (status === "แก้ไข") {
      await pool
        .request()
        .input("student_id", sql.Int, student_id)
        .input("check_inside", sql.NVarChar, check_inside || null).query(`
          UPDATE student_form
          SET check_inside = @check_inside
          WHERE student_id = @student_id
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
    const result = await connection.query(
      `SELECT student_form.*, COUNT(activity_pictures.picture_id) as picture_count 
      FROM student_form
      LEFT JOIN activity_pictures ON student_form.s_id = activity_pictures.s_id
      WHERE student_form.student_id = ${studentId} AND student_form.activity_type = '${activityType}'
      GROUP BY student_form.s_id, student_form.activity_name, student_form.activity_year, student_form.activity_date,
      student_form.activity_hours, student_form.activity_type, student_form.activity_target, student_form.activity_position,
      student_form.student_id, student_form.student_name, student_form.activity_document, student_form.t_id, student_form.last_date,
      student_form.fac_name, student_form.maj_name, student_form.check_activity, student_form.check_inside, student_form.approver_name, student_form.start_time, student_form.end_time, student_form.activity_time_period
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

    // Get the student_id from the query string

    // Select all data from the student_form table where student_id matches
    const result = await connection.query(
      `SELECT SUM(activity_hours) AS total_hours FROM student_form WHERE student_id = '${student_id}'`
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



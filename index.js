const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
var Airtable = require("airtable");

const app = express();
const port = 3001;
app.use(bodyParser.json());
app.use(cors());
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

const airtableHeaders = {
	Authorization: `Bearer ${AIRTABLE_API_KEY}`,
	"Content-Type": "application/json",
};

Airtable.configure({
	endpointUrl: "https://api.airtable.com",
	apiKey:
		"patzmIofTQtbYNncV.a1bfc9dda10d746195197f6ab15eec9fc93a6f2944b49aea7955c533133cd782",
});
var base = Airtable.base("applHr9mdT6ZMFwZP");

async function checkCredentials(email, password) {
	try {
		const records = await base("Users")
			.select({
				filterByFormula: `AND({Email} = '${email}', {Password} = '${password}')`,
			})
			.firstPage();

		if (records.length > 0) {
			return records[0];
		} else {
			return null;
		}
	} catch (error) {
		console.error("Error checking credentials:", error.message);
		throw error;
	}
}

app.post("/authenticate", async (req, res) => {
	const { email, password } = req.body;
	try {
		const userRecord = await checkCredentials(email, password);

		if (userRecord) {
			res.status(200).json({ message: "Authentication successful" });
		} else {
			res.status(401).json({ message: "Invalid credentials" });
		}
	} catch (error) {
		console.error("An error occurred during authentication:", error.message);
		res.status(500).json({ message: "Internal server error" });
	}
});

async function submitFormData(studentName, hoursSpent, progressDescription) {
	try {
		const record = await base("StudentProgress").create(
			[
				{
					fields: {
						Name: studentName,
						Hours: parseInt(hoursSpent),
						Progress: progressDescription,
					},
				},
			],
			{ typecast: true }
		);

		return record;
	} catch (error) {
		console.error("Error submitting form data:", error.message);
		throw error;
	}
}

app.post("/submit", async (req, res) => {
	const { studentName, hoursSpent, progressDescription } = req.body;

	try {
		const submissionResult = await submitFormData(
			studentName,
			hoursSpent,
			progressDescription
		);

		res.status(200).json({
			message: "Form submission successful",
			submissionResult,
		});
	} catch (error) {
		console.error("An error occurred during form submission:", error.message);
		res.status(500).json({ message: "Internal server error" });
	}
});

app.listen(port, () => {
	console.log(`Server is running at http://localhost:${port}`);
});

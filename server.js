const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

const DATA_FILE = path.join(__dirname, "data.json");

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Helper functions to read/write data
const loadData = () => {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ persons: [], reviews: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
};

const saveData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// ---------------------- PERSON ROUTES ----------------------

// 🔹 GET all persons
app.get("/api/persons", (req, res) => {
  debugger;
  const data = loadData();
  res.json(data.persons || []);
});

// 🔹 GET person by ID
app.get("/api/persons/:id", (req, res) => {
  const data = loadData();
  const person = data.persons.find((p) => p.id === req.params.id);
  if (person) {
    res.json(person);
  } else {
    res.status(404).json({ message: "Person not found" });
  }
});

// 🔹 POST - Create person
app.post("/api/persons", (req, res) => {
  const { id, name, greeting, theme, customMessage, review } = req.body;
  const newPerson = {
    id,
    name,
    greeting,
    theme,
    customMessage: customMessage || "",
    review: review || "",
    gallery: [],
    videos: [],
    voice: null
  };

  const data = loadData();
  data.persons.push(newPerson);
  saveData(data);
  res.json(newPerson);
});
// 🔹 delete -  person

app.delete('/api/persons/:id', (req, res) => {
  const id = req.params.id;
  const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));

  const index = data.persons.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Person not found" });
  }

  data.persons.splice(index, 1); // Remove the person
  fs.writeFileSync('data.json', JSON.stringify(data, null, 2));

  res.json({ success: true });
});

// 🔹 POST - Add/Update custom message
app.post("/api/persons/:id/custom-message", (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  const data = loadData();
  const person = data.persons.find((p) => p.id === id);

  if (person) {
    person.customMessage = message;
    saveData(data);
    res.json({ success: true });
  } else {
    res.status(404).json({ message: "Person not found" });
  }
});

// 🔹 DELETE - Clear custom message
app.delete("/api/persons/:id/custom-message", (req, res) => {
  const { id } = req.params;
  const data = loadData();
  const person = data.persons.find((p) => p.id === id);

  if (person) {
    person.customMessage = "";
    saveData(data);
    res.json({ success: true });
  } else {
    res.status(404).json({ message: "Person not found" });
  }
});

// 🔹 POST - Upload image
app.post("/api/persons/:id/gallery", (req, res) => {
  const { id } = req.params;
  const { imageUrl, text } = req.body;
  const data = loadData();
  const person = data.persons.find((p) => p.id === id);

  if (person) {
    person.gallery.push({ imageUrl, text });
    saveData(data);
    res.json(person);
  } else {
    res.status(404).json({ message: "Person not found" });
  }
});

// 🔹 POST - Upload video
app.post("/api/persons/:id/videos", (req, res) => {
  const { id } = req.params;
  const { videoUrl, name } = req.body;
  const data = loadData();
  const person = data.persons.find((p) => p.id === id);

  if (person) {
    person.videos.push({ videoUrl, name });
    saveData(data);
    res.json(person);
  } else {
    res.status(404).json({ message: "Person not found" });
  }
});

// 🔹 POST - Upload voice
app.post("/api/persons/:id/voice", (req, res) => {
  const { id } = req.params;
  const { voice } = req.body;
  const data = loadData();
  const person = data.persons.find((p) => p.id === id);

  if (person) {
    person.voice = voice;
    saveData(data);
    res.json({ success: true });
  } else {
    res.status(404).json({ message: "Person not found" });
  }
});

// ---------------------- REVIEW ROUTES ----------------------

// 🔹 POST - Submit a new review
app.post("/api/reviews", (req, res) => {
  const { username, message } = req.body;

  if (!username || !message) {
    return res.status(400).json({ error: "Username and message are required." });
  }

  const data = loadData();
  const newReview = { username, message };
  data.reviews.push(newReview);
  saveData(data);

  res.json({ success: true, review: newReview });
});
// 🔹 PUT - Edit review by index
app.put("/api/reviews/:index", (req, res) => {
  const { index } = req.params;
  const { username, message } = req.body;
  const data = loadData();

  if (!data.reviews || !data.reviews[index]) {
    return res.status(404).json({ message: "Review not found." });
  }

  data.reviews[index] = { username, message };
  saveData(data);
  res.json({ success: true, message: "Review updated successfully." });
});

// 🔹 DELETE - Delete review by index
app.delete("/api/reviews/:index", (req, res) => {
  const { index } = req.params;
  const data = loadData();

  if (!data.reviews || !data.reviews[index]) {
    return res.status(404).json({ message: "Review not found." });
  }

  const deleted = data.reviews.splice(index, 1);
  saveData(data);
  res.json({ success: true, message: "Review deleted successfully.", deleted });
});

// 🔹 GET all reviews (optional fallback)
app.get("/api/reviews", (req, res) => {
  const data = loadData();
  res.json(data.reviews || []);
});

// 🔹 GET reviews by username
app.get("/api/reviews/:username", (req, res) => {
  const data = loadData();
  const userReviews = data.reviews?.filter(
    (review) => review.username.toLowerCase() === req.params.username.toLowerCase()
  );

  if (userReviews && userReviews.length > 0) {
    res.json(userReviews);
  } else {
    res.status(404).json({ message: "No reviews found for this username" });
  }
});

// 🔹 Root health check
app.get("/", (req, res) => {
  res.send("🎉 Backend server is running!");
});

// ---------------------- START SERVER ----------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});


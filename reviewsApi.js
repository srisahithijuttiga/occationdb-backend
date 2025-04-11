const express = require('express');
const fs = require('fs');
const router = express.Router();
const dataFilePath = './data.json';

// Read data from data.json
const readData = () => {
  if (!fs.existsSync(dataFilePath)) return { reviews: [] };
  const rawData = fs.readFileSync(dataFilePath);
  return JSON.parse(rawData);
};

// Write data to data.json
const writeData = (data) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
};

// POST /api/reviews - Submit a new review
router.post('/', async (req, res) => {
  const { username, message } = req.body;

  if (!username || !message) {
    return res.status(400).json({ error: 'Username and message are required.' });
  }

  const data = readData();
  if (!data.reviews) data.reviews = [];

  const newReview = {
    username,
    message,
    timestamp: new Date().toISOString(),
    id: `${username}-${Date.now()}` // Ensure unique ID
  };

  data.reviews.push(newReview);
  writeData(data);

  res.status(201).json({ success: true, message: 'Review submitted successfully!', review: newReview });
});

// GET /api/reviews - Fetch all reviews
router.get('/', (req, res) => {
  const data = readData();
  res.status(200).json(data.reviews || []);
});

// GET /api/reviews/:username - Fetch all reviews by username
router.get('/:username', (req, res) => {
  try {
    const { username } = req.params;
    const data = readData();

    if (!data.reviews || data.reviews.length === 0) {
      return res.status(404).json({ error: 'No reviews available.' });
    }

    const userReviews = data.reviews.filter((review) => review.username === username);

    if (userReviews.length > 0) {
      res.status(200).json(userReviews);
    } else {
      res.status(404).json({ error: 'No reviews found for this username.' });
    }
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/reviews/:username/:reviewId - Delete a specific review by reviewId
debugger
router.delete('/:username/:reviewId', (req, res) => {
  try {
    const { username, reviewId } = req.params;
    console.log(`Received DELETE request for Review ID: ${reviewId}, Username: ${username}`);

    const data = readData();

    const filteredReviews = data.reviews?.filter((review) => !(review.username === username && review.id === reviewId));
    if (filteredReviews.length === data.reviews.length) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    data.reviews = filteredReviews;
    writeData(data);

    res.status(200).json({ success: true, message: 'Review deleted successfully!' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/reviews/:username/:reviewId - Edit a specific review
router.put('/:username/:reviewId', (req, res) => {
  try {
    const { username, reviewId } = req.params;
    const { message } = req.body;
    console.log(`Received PUT request for Review ID: ${reviewId}, Username: ${username}, Message: ${message}`);

    const data = readData();

    const reviewIndex = data.reviews.findIndex((review) => review.username === username && review.id === reviewId);

    if (reviewIndex === -1) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    data.reviews[reviewIndex].message = message;
    data.reviews[reviewIndex].timestamp = new Date().toISOString();
    writeData(data);

    res.status(200).json({ success: true, message: 'Review updated successfully!' });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = { router, readData };
const express = require('express');
const path = require('path');
const sensor = require('./src/sensor');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON and serve static files
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to read sensor data
/*
body example:
{
  "filepath": "20250415150255.tsv",
  "colsToDrop": ["DeviceName", "Version()", "Battery level(%)"],
  "config": {
    "groupMethod": "seconds_passed",
  }
}
*/
app.post('/api/sensor-data', async (req, res) => {
  const filepath = './public/data/'+req.body.filepath;
  const colsToDrop = req.body.colsToDrop || [];
  const config = req.body.config || {};

  try {
    const data = await sensor.readData(filepath, colsToDrop, config);
    res.json(data);
  } catch (error) {
    console.error('Error reading sensor data:', error);
    res.status(500).send('Error processing sensor data');
  }

});

app.get('/', (req, res) => {
  res.send('Welcome to the Express server!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

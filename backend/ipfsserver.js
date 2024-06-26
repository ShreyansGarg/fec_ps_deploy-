///to use this install dependencies by running npm install express multer axios cors form-data
// run the server by running node src/backend/ipfsserver.js
// This is the backend server that will handle the file uploads and pinning to IPFS using Pinata
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const FormData = require('form-data');

const app = express();
const port = process.env.PORT || 4000; // I used the port 4000

// Set up CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Set the allowed origin
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Set the allowed HTTP methods
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Set the allowed headers

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).send();
  }

  next();
});

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const PINATA_API_KEY = '17adeeb0f822a5b73cb2';
const PINATA_SECRET_API_KEY = '8d20a9ed8eb2e829d5e9146dc9082e3b2f8f990d10fe71bdc1a8ebf0fc634c77';

const pinata = axios.create({
  baseURL: 'https://api.pinata.cloud/',
  headers: {
    pinata_api_key: PINATA_API_KEY,
    pinata_secret_api_key: PINATA_SECRET_API_KEY,
  },
});

const uploadFileToIPFS = async (file) => {
  const formData = new FormData();
  formData.append('file', file.buffer, { filename: file.originalname });

  const metadata = JSON.stringify({
    name: file.originalname,
  });
  formData.append('pinataMetadata', metadata);

  const options = JSON.stringify({
    cidVersion: 0,
  });
  formData.append('pinataOptions', options);

  try {
    const response = await pinata.post('pinning/pinFileToIPFS', formData, {
      headers: {
        ...formData.getHeaders()
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    throw error;
  }
};

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const result = await uploadFileToIPFS(req.file);
    res.json({
      success: true,
      ipfsHash: result.IpfsHash,
      timestamp: result.Timestamp,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload file to IPFS',
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${4000}`);
});

// server.js - Express server for SMPTE Test Card Generator
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Set up middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Set up file upload storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'logo-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// Default settings path
const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(SETTINGS_FILE))) {
  fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
}

// Default settings
const defaultSettings = {
  title: "OB 1 STUDIO",
  channel: "NVP S.p.A.",
  resolution: "1920x1080",
  frameRate: 25,
  scanMode: "Progressive",
  colorSpace: "Rec.709",
  notes: "",
  logo: "",
  showBars: true,
  showTimecode: true,
  showFrameCounter: true,
  showSync: true,
  showCenterCircle: true,
  showInfoBox: true,
  alternateMode: false,
  lastUpdate: new Date().toISOString()
};

// Initialize settings file if it doesn't exist
if (!fs.existsSync(SETTINGS_FILE)) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
}

// Get settings
function getSettings() {
  try {
    const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading settings file:', err);
    return defaultSettings;
  }
}

// Save settings
function saveSettings(settings) {
  try {
    settings.lastUpdate = new Date().toISOString();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return true;
  } catch (err) {
    console.error('Error saving settings file:', err);
    return false;
  }
}

// API Routes
app.get('/api/settings', (req, res) => {
  const settings = getSettings();
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const currentSettings = getSettings();
  const newSettings = { ...currentSettings, ...req.body };
  
  if (saveSettings(newSettings)) {
    // Emit settings update to all connected clients
    io.emit('settings-update', newSettings);
    res.json({ success: true, settings: newSettings });
  } else {
    res.status(500).json({ success: false, message: 'Failed to save settings' });
  }
});

// Logo upload endpoint
app.post('/api/upload-logo', upload.single('logo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const logoPath = `/uploads/${req.file.filename}`;
  
  // Update settings with the new logo path
  const currentSettings = getSettings();
  const newSettings = { ...currentSettings, logo: logoPath };
  
  if (saveSettings(newSettings)) {
    // Emit settings update to all connected clients
    io.emit('settings-update', newSettings);
    res.json({ success: true, logoPath });
  } else {
    res.status(500).json({ success: false, message: 'Failed to save settings' });
  }
});

// Reset settings endpoint
app.post('/api/reset-settings', (req, res) => {
  if (saveSettings(defaultSettings)) {
    io.emit('settings-update', defaultSettings);
    res.json({ success: true, settings: defaultSettings });
  } else {
    res.status(500).json({ success: false, message: 'Failed to reset settings' });
  }
});

// Serve the React app for any other route (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send current settings to newly connected client
  socket.emit('settings-update', getSettings());
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
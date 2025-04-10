// client/src/components/OutputPage.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import './OutputPage.css';

// SMPTE Color Constants
const SMPTE_COLORS = {
  WHITE: '#FFFFFF',
  YELLOW: '#FFFF00',
  CYAN: '#00FFFF',
  GREEN: '#00FF00',
  MAGENTA: '#FF00FF',
  RED: '#FF0000',
  BLUE: '#0000FF',
  BLACK: '#000000',
};

const OutputPage = ({ settings, socket }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [frameCount, setFrameCount] = useState(0);
  const [blinkState, setBlinkState] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);
  const logoRef = useRef(new Image());

  // Update settings when they change from props or socket
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('settings-update', (updatedSettings) => {
      setLocalSettings(updatedSettings);
    });

    return () => {
      socket.off('settings-update');
    };
  }, [socket]);

  // Parse resolution and set canvas dimensions
  useEffect(() => {
    if (localSettings && localSettings.resolution) {
      const [w, h] = localSettings.resolution.split('x').map(Number);
      setWidth(w);
      setHeight(h);
    }
  }, [localSettings]);

  // Load logo image if it exists
  useEffect(() => {
    if (localSettings && localSettings.logo) {
      logoRef.current = new Image();
      logoRef.current.src = localSettings.logo;
    }
  }, [localSettings]);

  // Blink effect for sync indicator
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinkState(prev => !prev);
    }, 1000);

    return () => {
      clearInterval(blinkInterval);
    };
  }, []);

  // Format timecode based on frame rate
  const formatTimecode = useCallback(() => {
    if (!localSettings) return '00:00:00:00';
    
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    const frameRate = parseFloat(localSettings.frameRate);
    const frames = Math.floor((now.getMilliseconds() / 1000) * frameRate)
      .toString()
      .padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}:${frames}`;
  }, [localSettings]);

  // Format frame count
  const formatFrameCount = useCallback(() => {
    return frameCount.toString().padStart(8, '0');
  }, [frameCount]);

  // Draw standard SMPTE color bars
  const drawColorBars = useCallback((ctx, w, h) => {
    const barWidth = w / 7;
    const colorOrder = [
      SMPTE_COLORS.WHITE,
      SMPTE_COLORS.YELLOW,
      SMPTE_COLORS.CYAN,
      SMPTE_COLORS.GREEN,
      SMPTE_COLORS.MAGENTA,
      SMPTE_COLORS.RED,
      SMPTE_COLORS.BLUE
    ];
    
    // Draw main color bars (top 2/3)
    const upperHeight = h * 0.67;
    for (let i = 0; i < colorOrder.length; i++) {
      ctx.fillStyle = colorOrder[i];
      ctx.fillRect(i * barWidth, 0, barWidth, upperHeight);
    }
    
    // Draw bottom bars
    const lowerHeight = h - upperHeight;
    
    // Blue bars
    ctx.fillStyle = SMPTE_COLORS.BLUE;
    ctx.fillRect(0, upperHeight, barWidth, lowerHeight);
    ctx.fillRect(3 * barWidth, upperHeight, barWidth, lowerHeight);
    ctx.fillRect(6 * barWidth, upperHeight, barWidth, lowerHeight);
    
    // Black bars
    ctx.fillStyle = SMPTE_COLORS.BLACK;
    ctx.fillRect(1 * barWidth, upperHeight, barWidth, lowerHeight);
    ctx.fillRect(5 * barWidth, upperHeight, barWidth, lowerHeight);
    
    // Magenta bar
    ctx.fillStyle = SMPTE_COLORS.MAGENTA;
    ctx.fillRect(2 * barWidth, upperHeight, barWidth, lowerHeight);
    
    // Cyan bar
    ctx.fillStyle = SMPTE_COLORS.CYAN;
    ctx.fillRect(4 * barWidth, upperHeight, barWidth, lowerHeight);
  }, []);
  
  // Draw center circle for alignment
  const drawCenterCircle = useCallback((ctx, w, h) => {
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = Math.min(w, h) * 0.05;
    
    ctx.strokeStyle = SMPTE_COLORS.WHITE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner crosshair
    ctx.beginPath();
    ctx.moveTo(centerX - radius, centerY);
    ctx.lineTo(centerX + radius, centerY);
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX, centerY + radius);
    ctx.stroke();
  }, []);
  
  // Draw pulsing sync indicator
  const drawSyncIndicator = useCallback((ctx, w, h) => {
    const size = Math.min(w, h) * 0.03;
    const padding = 20;
    
    // Alternate between white and red
    ctx.fillStyle = blinkState ? SMPTE_COLORS.RED : SMPTE_COLORS.WHITE;
    ctx.fillRect(padding, padding, size, size);
    
    // Add border
    ctx.strokeStyle = SMPTE_COLORS.WHITE;
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, padding, size, size);
  }, [blinkState]);
  
  // Draw frame counter
  const drawFrameCounter = useCallback((ctx, w, h) => {
    const padding = 50;
    const fontSize = Math.min(w, h) * 0.025;
    
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.fillStyle = SMPTE_COLORS.WHITE;
    ctx.textBaseline = 'top';
    ctx.fillText(
      `Frame: ${formatFrameCount()}`, 
      padding, 
      h - padding - fontSize * 2
    );
  }, [formatFrameCount]);
  
  // Draw timecode display
  const drawTimecode = useCallback((ctx, w, h) => {
    const padding = 20;
    const fontSize = Math.min(w, h) * 0.035;
    
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.fillStyle = SMPTE_COLORS.WHITE;
    ctx.textBaseline = 'top';
    ctx.fillText(
      formatTimecode(), 
      padding, 
      h - padding - fontSize
    );
  }, [formatTimecode]);
  
  // Draw information box
  const drawInfoBox = useCallback((ctx, w, h) => {
    if (!localSettings) return;
    
    const boxWidth = w * 0.25;
    const boxHeight = h * 0.18;
    const padding = 20;
    const cornerRadius = 10;
    const fontSize = Math.min(w, h) * 0.015;
    const lineHeight = fontSize * 1.4;
    
    // Box position (top right)
    const boxX = w - boxWidth - padding;
    const boxY = padding;
    
    // Draw semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.strokeStyle = SMPTE_COLORS.WHITE;
    ctx.lineWidth = 2;
    
    // Rounded rectangle
    ctx.beginPath();
    ctx.moveTo(boxX + cornerRadius, boxY);
    ctx.lineTo(boxX + boxWidth - cornerRadius, boxY);
    ctx.arc(boxX + boxWidth - cornerRadius, boxY + cornerRadius, cornerRadius, Math.PI * 1.5, 0);
    ctx.lineTo(boxX + boxWidth, boxY + boxHeight - cornerRadius);
    ctx.arc(boxX + boxWidth - cornerRadius, boxY + boxHeight - cornerRadius, cornerRadius, 0, Math.PI * 0.5);
    ctx.lineTo(boxX + cornerRadius, boxY + boxHeight);
    ctx.arc(boxX + cornerRadius, boxY + boxHeight - cornerRadius, cornerRadius, Math.PI * 0.5, Math.PI);
    ctx.lineTo(boxX, boxY + cornerRadius);
    ctx.arc(boxX + cornerRadius, boxY + cornerRadius, cornerRadius, Math.PI, Math.PI * 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Draw title
    ctx.font = `bold ${fontSize * 1.2}px sans-serif`;
    ctx.fillStyle = SMPTE_COLORS.WHITE;
    ctx.textBaseline = 'top';
    ctx.fillText(localSettings.title, boxX + 10, boxY + 10);
    
    // Draw channel
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillText(localSettings.channel, boxX + 10, boxY + 10 + lineHeight);
    
    // Draw technical specs
    ctx.fillText(`Resolution: ${localSettings.resolution}`, boxX + 10, boxY + 10 + lineHeight * 3);
    ctx.fillText(`Frame Rate: ${localSettings.frameRate} fps`, boxX + 10, boxY + 10 + lineHeight * 4);
    ctx.fillText(`Scan Mode: ${localSettings.scanMode}`, boxX + 10, boxY + 10 + lineHeight * 5);
    ctx.fillText(`Color Space: ${localSettings.colorSpace}`, boxX + 10, boxY + 10 + lineHeight * 6);
    
    // Draw notes if available
    if (localSettings.notes) {
      ctx.fillText(`Notes: ${localSettings.notes}`, boxX + 10, boxY + 10 + lineHeight * 8);
    }
  }, [localSettings]);
  
  // Draw logo
  const drawLogo = useCallback((ctx, w, h) => {
    const padding = 20;
    const maxLogoWidth = w * 0.15;
    const maxLogoHeight = h * 0.1;
    
    // Calculate scaled dimensions while maintaining aspect ratio
    const logoRatio = logoRef.current.width / logoRef.current.height;
    let logoWidth, logoHeight;
    
    if (logoRatio >= 1) {
      // Wide logo
      logoWidth = Math.min(maxLogoWidth, logoRef.current.width);
      logoHeight = logoWidth / logoRatio;
    } else {
      // Tall logo
      logoHeight = Math.min(maxLogoHeight, logoRef.current.height);
      logoWidth = logoHeight * logoRatio;
    }
    
    // Position at bottom right corner
    const logoX = w - logoWidth - padding;
    const logoY = h - logoHeight - padding;
    
    // Draw logo
    ctx.drawImage(logoRef.current, logoX, logoY, logoWidth, logoHeight);
  }, []);

  // Main drawing function for the test card
  const drawTestCard = useCallback(() => {
    if (!canvasRef.current || !localSettings) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, w, h);
    
    if (localSettings.alternateMode) {
      // Draw alternate mode (black background with yellow square)
      ctx.fillStyle = SMPTE_COLORS.BLACK;
      ctx.fillRect(0, 0, w, h);
      
      // Draw yellow square in top-right corner
      const squareSize = Math.min(w, h) * 0.1;
      ctx.fillStyle = SMPTE_COLORS.YELLOW;
      ctx.fillRect(w - squareSize - 20, 20, squareSize, squareSize);
    } else if (localSettings.showBars) {
      // Draw SMPTE color bars
      drawColorBars(ctx, w, h);
    } else {
      // Default background if no bars and not alternate mode
      ctx.fillStyle = SMPTE_COLORS.BLACK;
      ctx.fillRect(0, 0, w, h);
    }
    
    // Draw center circle for alignment
    if (localSettings.showCenterCircle) {
      drawCenterCircle(ctx, w, h);
    }
    
    // Draw sync indicator
    if (localSettings.showSync) {
      drawSyncIndicator(ctx, w, h);
    }
    
    // Draw frame counter
    if (localSettings.showFrameCounter) {
      drawFrameCounter(ctx, w, h);
    }
    
    // Draw timecode
    if (localSettings.showTimecode) {
      drawTimecode(ctx, w, h);
    }
    
    // Draw info box
    if (localSettings.showInfoBox) {
      drawInfoBox(ctx, w, h);
    }
    
    // Draw logo if available
    if (localSettings.logo && logoRef.current.complete) {
      drawLogo(ctx, w, h);
    }
  }, [
    localSettings, 
    drawColorBars, 
    drawCenterCircle, 
    drawSyncIndicator, 
    drawFrameCounter, 
    drawTimecode, 
    drawInfoBox, 
    drawLogo
  ]);
  
  // Animation loop for continuous rendering
  useEffect(() => {
    let lastTimestamp = 0;
    let frameCounter = 0;
    const frameRate = localSettings?.frameRate ? parseFloat(localSettings.frameRate) : 25;
    const frameTime = 1000 / frameRate; // ms per frame
    
    const animate = (timestamp) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      
      const elapsed = timestamp - lastTimestamp;
      
      if (elapsed >= frameTime) {
        // Update frame counter
        frameCounter++;
        setFrameCount(frameCounter);
        
        // Draw frame
        drawTestCard();
        
        // Update timestamp
        lastTimestamp = timestamp - (elapsed % frameTime);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [localSettings, drawTestCard]);
  
  return (
    <div className="output-page">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="test-card-canvas"
      />
    </div>
  );
};

export default OutputPage;
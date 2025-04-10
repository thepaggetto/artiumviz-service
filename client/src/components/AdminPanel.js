// client/src/components/AdminPanel.js
import React, { useState, useEffect, useRef } from 'react';
import './AdminPanel.css';

const AdminPanel = ({ settings, saveSettings, uploadLogo, resetSettings }) => {
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  const outputUrlRef = useRef(null);
  const saveTimerRef = useRef(null);

  // Update local settings when props change
  useEffect(() => {
    setLocalSettings({ ...settings });
  }, [settings]);

  // Calculate output page URL
  const outputUrl = `${window.location.origin}/output`;

  // Update preview URL with latest settings for the iframe
  useEffect(() => {
    setPreviewUrl(`${outputUrl}?${new Date().getTime()}`);
  }, [localSettings, outputUrl]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setLocalSettings(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setSaveError(null);
      
      // If there's a new logo file, upload it first
      if (logoFile) {
        const logoResult = await uploadLogo(logoFile);
        if (logoResult.success && logoResult.logoPath) {
          setLocalSettings(prev => ({
            ...prev,
            logo: logoResult.logoPath
          }));
        }
        setLogoFile(null); // Clear the logo file state after upload
      }
      
      // Save the updated settings
      const result = await saveSettings(localSettings);
      
      if (result.success) {
        setSaveSuccess(true);
        
        // Clear the success message after a delay
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
        }
        saveTimerRef.current = setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } else {
        setSaveError('Failed to save settings');
      }
    } catch (err) {
      setSaveError(err.message || 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle logo file selection
  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  // Handle reset to defaults
  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      try {
        setIsSaving(true);
        setSaveError(null);
        
        const result = await resetSettings();
        
        if (result.success) {
          setSaveSuccess(true);
          
          if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
          }
          saveTimerRef.current = setTimeout(() => {
            setSaveSuccess(false);
          }, 3000);
        } else {
          setSaveError('Failed to reset settings');
        }
      } catch (err) {
        setSaveError(err.message || 'An error occurred');
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Copy output URL to clipboard
  const copyOutputUrl = () => {
    if (outputUrlRef.current) {
      outputUrlRef.current.select();
      document.execCommand('copy');
      alert('Output URL copied to clipboard!');
    }
  };

  return (
    <div className="admin-panel">
      <header className="header">
        <h1>SMPTE Test Card Generator</h1>
        <p>Admin Control Panel</p>
      </header>

      <div className="main-content">
        <div className="settings-form-container">
          <form onSubmit={handleSubmit} className="settings-form">
            <h2>Test Card Settings</h2>

            {/* Basic Information */}
            <div className="form-section">
              <h3>Basic Information</h3>
              
              <div className="form-group">
                <label htmlFor="title">Title:</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={localSettings.title}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="channel">Channel:</label>
                <input
                  type="text"
                  id="channel"
                  name="channel"
                  value={localSettings.channel}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes:</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={localSettings.notes}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="logo">Logo:</label>
                <input
                  type="file"
                  id="logo"
                  name="logo"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
                {settings.logo && (
                  <div className="current-logo">
                    <p>Current logo: {settings.logo.split('/').pop()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Parameters */}
            <div className="form-section">
              <h3>Technical Parameters</h3>
              
              <div className="form-group">
                <label htmlFor="resolution">Resolution:</label>
                <select
                  id="resolution"
                  name="resolution"
                  value={localSettings.resolution}
                  onChange={handleInputChange}
                >
                  <option value="1920x1080">1920x1080 (FHD)</option>
                  <option value="1280x720">1280x720 (HD)</option>
                  <option value="3840x2160">3840x2160 (UHD 4K)</option>
                  <option value="720x576">720x576 (PAL SD)</option>
                  <option value="720x480">720x480 (NTSC SD)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="frameRate">Frame Rate:</label>
                <select
                  id="frameRate"
                  name="frameRate"
                  value={localSettings.frameRate}
                  onChange={handleInputChange}
                >
                  <option value="25">25 fps</option>
                  <option value="30">30 fps</option>
                  <option value="50">50 fps</option>
                  <option value="60">60 fps</option>
                  <option value="59.94">59.94 fps</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="scanMode">Scan Mode:</label>
                <select
                  id="scanMode"
                  name="scanMode"
                  value={localSettings.scanMode}
                  onChange={handleInputChange}
                >
                  <option value="Progressive">Progressive</option>
                  <option value="Interlaced">Interlaced</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="colorSpace">Color Space:</label>
                <select
                  id="colorSpace"
                  name="colorSpace"
                  value={localSettings.colorSpace}
                  onChange={handleInputChange}
                >
                  <option value="Rec.709">Rec.709</option>
                  <option value="Rec.2020">Rec.2020</option>
                  <option value="sRGB">sRGB</option>
                </select>
              </div>
            </div>

            {/* Display Options */}
            <div className="form-section">
              <h3>Display Options</h3>
              
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="showBars"
                  name="showBars"
                  checked={localSettings.showBars}
                  onChange={handleInputChange}
                />
                <label htmlFor="showBars">Show SMPTE Color Bars</label>
              </div>

              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="showTimecode"
                  name="showTimecode"
                  checked={localSettings.showTimecode}
                  onChange={handleInputChange}
                />
                <label htmlFor="showTimecode">Show Timecode</label>
              </div>

              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="showFrameCounter"
                  name="showFrameCounter"
                  checked={localSettings.showFrameCounter}
                  onChange={handleInputChange}
                />
                <label htmlFor="showFrameCounter">Show Frame Counter</label>
              </div>

              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="showSync"
                  name="showSync"
                  checked={localSettings.showSync}
                  onChange={handleInputChange}
                />
                <label htmlFor="showSync">Show Sync Indicator</label>
              </div>

              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="showCenterCircle"
                  name="showCenterCircle"
                  checked={localSettings.showCenterCircle}
                  onChange={handleInputChange}
                />
                <label htmlFor="showCenterCircle">Show Center Circle</label>
              </div>

              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="showInfoBox"
                  name="showInfoBox"
                  checked={localSettings.showInfoBox}
                  onChange={handleInputChange}
                />
                <label htmlFor="showInfoBox">Show Info Box</label>
              </div>

              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="alternateMode"
                  name="alternateMode"
                  checked={localSettings.alternateMode}
                  onChange={handleInputChange}
                />
                <label htmlFor="alternateMode">Use Alternate Mode (Black background with yellow square)</label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button type="submit" disabled={isSaving} className="save-button">
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
              <button type="button" onClick={handleReset} disabled={isSaving} className="reset-button">
                Reset to Defaults
              </button>
            </div>

            {/* Save Status Messages */}
            {saveSuccess && (
              <div className="success-message">Settings saved successfully!</div>
            )}
            {saveError && (
              <div className="error-message">Error: {saveError}</div>
            )}
          </form>
        </div>

        <div className="preview-container">
          <h2>Live Preview</h2>
          <div className="preview-frame">
            {previewUrl && (
              <iframe
                src={previewUrl}
                title="Test Card Preview"
                className="preview-iframe"
              ></iframe>
            )}
          </div>
          
          <div className="output-url-container">
            <h3>Output URL</h3>
            <p>Use this URL as a browser source in OBS, vMix or CasparCG:</p>
            <div className="output-url-input">
              <input
                type="text"
                ref={outputUrlRef}
                value={outputUrl}
                readOnly
              />
              <button onClick={copyOutputUrl} className="copy-button">Copy URL</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
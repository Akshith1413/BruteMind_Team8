import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { AudioSynth } from '../utils/AudioSynth';
import { Sun, Moon, Volume2, VolumeX, Eye, EyeOff, ShieldAlert, Cpu } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function AuthCard() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const cardRef = useRef(null);
  const formContainerRef = useRef(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('');
  const [specialty, setSpecialty] = useState('General Diagnostics');
  
  // Loading & Scanning States
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Store actions/states
  const { login, signup, theme, toggleTheme, isMuted, toggleMute } = useAuthStore();

  // Morph height and transition form panels using GSAP
  useGSAP(() => {
    // Save current heights and morph smoothly
    gsap.killTweensOf(cardRef.current);
    
    // Animate content opacity
    gsap.fromTo(formContainerRef.current,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.1 }
    );

    // Height morphing transition
    gsap.fromTo(cardRef.current,
      { scale: 0.98, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' },
      { scale: 1, boxShadow: 'var(--glass-shadow)', duration: 0.4, ease: 'back.out(1.2)' }
    );
  }, [isLogin]);

  const handleToggleMode = () => {
    AudioSynth.playTransition();
    setErrorMsg('');
    setIsLogin(!isLogin);
  };

  const handleFocus = () => {
    AudioSynth.playHover();
  };

  const handleInputClick = () => {
    AudioSynth.playClick();
  };

  const handleFieldChange = (setter) => (e) => {
    setter(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (isLogin && (!email || !pin)) {
      AudioSynth.playAlert();
      setErrorMsg('Please enter both clinical email and PIN.');
      return;
    }
    if (!isLogin && (!username || !email || !pin)) {
      AudioSynth.playAlert();
      setErrorMsg('Please populate all clinical credentials.');
      return;
    }

    // Trigger terminal scanning sequence
    setIsScanning(true);
    setScanProgress(0);
    setScanStatus('ESTABLISHING SECURE HANDSHAKE...');
    AudioSynth.playTransition();

    const scanSteps = [
      { progress: 20, status: 'SYNCING CLINICAL REGISTRIES...' },
      { progress: 50, status: 'RETRIEVING BIOMETRIC KEYPAIRS...' },
      { progress: 80, status: 'VALIDATING SECURE CREDENTIALS...' },
      { progress: 100, status: 'ACCESS AUTHORIZED. HEALOS ONLINE.' },
    ];

    try {
      // Loop over scanning progress
      for (const step of scanSteps) {
        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            setScanProgress(step.progress);
            setScanStatus(step.status);
            // Quick hover chime on progress tick
            AudioSynth.playHover();
            resolve();
          }, 450);
        });
      }

      // Execute actual authentication
      if (isLogin) {
        await login(email, pin);
      } else {
        await signup(username, email, specialty, pin);
      }
    } catch (err) {
      setIsScanning(false);
      AudioSynth.playAlert();
      setErrorMsg(err.message || 'Verification rejected by server.');

      // Shake card to notify error visually
      gsap.fromTo(cardRef.current,
        { x: -10 },
        { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' }
      );
    }
  };

  return (
    <div className="auth-card-container">
      {/* Outer Glow ring following the glassmorphic state */}
      <div 
        ref={cardRef} 
        className="glass-card"
        style={{
          '--accent-border': theme === 'light' ? 'rgba(2, 132, 199, 0.15)' : 'rgba(0, 242, 254, 0.15)',
        }}
      >
        {/* Top Control Bar */}
        <div className="control-bar">
          <div className="system-tag text-mono">
            <Cpu size={14} className="sys-icon spinner" />
            <span>HEALOS v1.0.4 // LOCALHOST</span>
          </div>
          <div className="actions">
            <button 
              onClick={() => { AudioSynth.init(); toggleMute(); }} 
              className="ctrl-btn" 
              title="Toggle Audio Feedback"
              aria-label="Toggle Audio Feedback"
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <button 
              onClick={toggleTheme} 
              className="ctrl-btn" 
              title="Switch Visual Mode"
              aria-label="Switch Visual Mode"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>

        {isScanning ? (
          /* High-Tech Terminal Scanning Overlay */
          <div className="scanning-sequence text-mono">
            <div className="scanner-line"></div>
            <div className="terminal-title glow-text">SECURE SCANNING IN PROGRESS</div>
            <div className="progress-value">{scanProgress}%</div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${scanProgress}%` }}></div>
            </div>
            <div className="terminal-log">{scanStatus}</div>
          </div>
        ) : (
          /* Normal Auth Forms */
          <div ref={formContainerRef}>
            <div className="card-header">
              <h2 className="text-tech glow-text">
                {isLogin ? 'CLINICAL INGRESS' : 'DIAGNOSTIC ENROLLMENT'}
              </h2>
              <p className="card-subtitle">
                {isLogin 
                  ? 'Input authorization keypair to load diagnostic cores.' 
                  : 'Enroll in the biometric registry to start modeling clinical pipelines.'}
              </p>
            </div>

            {errorMsg && (
              <div className="error-alert text-mono">
                <ShieldAlert size={16} className="error-icon" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="input-group">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={handleFieldChange(setUsername)}
                    onFocus={handleFocus}
                    onClick={handleInputClick}
                    placeholder=" "
                    className="tech-input"
                    id="username-field"
                  />
                  <label htmlFor="username-field" className="input-label">CLINICIAN NAME</label>
                  <span className="input-glow-line"></span>
                </div>
              )}

              <div className="input-group">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={handleFieldChange(setEmail)}
                  onFocus={handleFocus}
                  onClick={handleInputClick}
                  placeholder=" "
                  className="tech-input"
                  id="email-field"
                />
                <label htmlFor="email-field" className="input-label">CLINICAL EMAIL</label>
                <span className="input-glow-line"></span>
              </div>

              {!isLogin && (
                <div className="input-group">
                  <select
                    value={specialty}
                    onChange={handleFieldChange(setSpecialty)}
                    onFocus={handleFocus}
                    onClick={handleInputClick}
                    className="tech-input tech-select"
                    id="specialty-field"
                  >
                    <option value="General Diagnostics">General Diagnostics</option>
                    <option value="Neural Pathologist">Neural Pathologist</option>
                    <option value="Genomic Specialist">Genomic Specialist</option>
                    <option value="Cardiovascular Clinician">Cardiovascular Clinician</option>
                  </select>
                  <label htmlFor="specialty-field" className="input-label">MEDICAL DISCIPLINE</label>
                  <span className="input-glow-line"></span>
                </div>
              )}

              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  maxLength={4}
                  pattern="[0-9]*"
                  value={pin}
                  onChange={handleFieldChange(setPin)}
                  onFocus={handleFocus}
                  onClick={handleInputClick}
                  placeholder=" "
                  className="tech-input text-mono"
                  style={{ letterSpacing: '8px' }}
                  id="pin-field"
                />
                <label htmlFor="pin-field" className="input-label">4-DIGIT SECURITY PIN</label>
                <button
                  type="button"
                  onClick={() => { AudioSynth.playClick(); setShowPassword(!showPassword); }}
                  className="pwd-toggle"
                  title="Toggle Password Visibility"
                  aria-label="Toggle Password Visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <span className="input-glow-line"></span>
              </div>

              {isLogin && (
                <div className="sandbox-hint text-mono">
                  Sandbox Bypass: <strong>admin@healos.ai</strong> / PIN: <strong>1234</strong>
                </div>
              )}

              <button
                type="submit"
                onMouseEnter={handleFocus}
                onClick={handleInputClick}
                className="submit-btn text-tech"
              >
                <span>{isLogin ? 'DECRYPT & ACCESS' : 'ENROLL CLINICIAN'}</span>
                <div className="btn-glitch-overlay"></div>
              </button>
            </form>

            <div className="mode-switcher text-mono">
              <span>{isLogin ? 'NEW FIELD USER?' : 'EXISTING REGISTRY?'}</span>
              <button 
                onClick={handleToggleMode} 
                className="switch-mode-btn"
                title="Toggle Mode"
                aria-label="Toggle Mode"
              >
                {isLogin ? 'ENROLL MEMBER' : 'AUTHORIZE INGRESS'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .auth-card-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 100vh;
          position: relative;
          z-index: 10;
          padding: 20px;
        }

        .glass-card {
          width: 440px;
          max-width: 100%;
          background: var(--glass-bg);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          box-shadow: var(--glass-shadow);
          padding: 30px;
          position: relative;
          overflow: hidden;
          transition: var(--theme-transition);
          background-image: var(--card-noise);
          background-size: 8px 8px;
        }

        .control-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 25px;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 12px;
        }

        .system-tag {
          font-size: 11px;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 6px;
          letter-spacing: 1px;
        }

        .sys-icon {
          color: var(--accent-primary);
        }

        .spinner {
          animation: spin 6s linear infinite;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        .ctrl-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .ctrl-btn:hover {
          color: var(--accent-primary);
          background: rgba(255, 255, 255, 0.05);
        }

        .card-header {
          margin-bottom: 25px;
        }

        .card-header h2 {
          font-size: 22px;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
          color: var(--text-primary);
        }

        .card-subtitle {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid var(--accent-warn);
          color: var(--accent-warn);
          padding: 10px 14px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 11px;
          text-shadow: 0 0 4px var(--accent-warn-glow);
          line-height: 1.3;
        }

        .error-icon {
          flex-shrink: 0;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .tech-input {
          background: var(--neumorphic-press);
          border: 1px solid var(--glass-border);
          padding: 14px 16px;
          border-radius: 8px;
          color: var(--text-primary);
          font-family: var(--font-sans);
          font-size: 14px;
          outline: none;
          transition: all 0.3s ease;
        }

        .tech-select {
          appearance: none;
          cursor: pointer;
        }

        .tech-input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 10px var(--accent-glow);
        }

        .input-label {
          position: absolute;
          left: 16px;
          top: 14px;
          color: var(--text-secondary);
          font-size: 12px;
          font-family: var(--font-mono);
          letter-spacing: 1.5px;
          pointer-events: none;
          transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
        }

        /* Float Labels */
        .tech-input:focus ~ .input-label,
        .tech-input:not(:placeholder-shown) ~ .input-label {
          transform: translateY(-25px) scale(0.85);
          left: 6px;
          color: var(--accent-primary);
          text-shadow: 0 0 8px var(--accent-glow);
        }

        .pwd-toggle {
          position: absolute;
          right: 14px;
          top: 14px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pwd-toggle:hover {
          color: var(--accent-primary);
        }

        .sandbox-hint {
          font-size: 10px;
          color: var(--text-muted);
          text-align: center;
          margin-top: -5px;
          letter-spacing: 0.5px;
        }

        .sandbox-hint strong {
          color: var(--text-secondary);
        }

        .submit-btn {
          position: relative;
          background: linear-gradient(135deg, var(--accent-secondary), var(--accent-primary));
          border: none;
          color: #fff;
          padding: 14px;
          font-weight: 600;
          font-size: 14px;
          border-radius: 8px;
          cursor: pointer;
          overflow: hidden;
          letter-spacing: 1px;
          box-shadow: 0 4px 15px var(--accent-glow-sec);
          transition: all 0.3s ease;
        }

        .submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px var(--accent-glow), 0 0 8px var(--accent-glow-sec);
        }

        .submit-btn:active {
          transform: translateY(1px);
        }

        .mode-switcher {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 25px;
          font-size: 11px;
          color: var(--text-secondary);
        }

        .switch-mode-btn {
          background: transparent;
          border: none;
          color: var(--accent-primary);
          font-weight: bold;
          cursor: pointer;
          letter-spacing: 0.5px;
          text-decoration: underline;
        }

        .switch-mode-btn:hover {
          text-shadow: 0 0 8px var(--accent-glow);
        }

        /* Scanning Terminal Styles */
        .scanning-sequence {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 10px;
          position: relative;
          min-height: 280px;
          text-align: center;
        }

        .scanner-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent-primary), transparent);
          box-shadow: 0 0 8px var(--accent-primary);
          animation: scanVertical 2.2s linear infinite;
        }

        @keyframes scanVertical {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }

        .terminal-title {
          font-size: 14px;
          font-weight: bold;
          letter-spacing: 1.5px;
          color: var(--accent-primary);
          margin-bottom: 25px;
        }

        .progress-value {
          font-size: 48px;
          font-weight: bold;
          color: var(--text-primary);
          margin-bottom: 15px;
          text-shadow: 0 0 10px var(--accent-glow);
        }

        .progress-bar-container {
          width: 100%;
          height: 6px;
          background: var(--neumorphic-press);
          border: 1px solid var(--glass-border);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 25px;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-secondary), var(--accent-primary));
          border-radius: 4px;
          box-shadow: 0 0 6px var(--accent-primary);
          transition: width 0.3s ease;
        }

        .terminal-log {
          font-size: 11px;
          color: var(--text-secondary);
          letter-spacing: 1px;
          height: 15px;
        }
      `}</style>
    </div>
  );
}

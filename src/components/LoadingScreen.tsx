const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      <div className="loading-section">
        <h1 className="loading-title">
          We are <span className="gradient-text">drivers of change</span>
        </h1>

        <div className="loading-divider">
          <div className="divider-line"></div>
          <svg width="5" height="4" viewBox="0 0 5 4" fill="none" xmlns="http://www.w3.org/2000/svg" className="divider-dot">
            <circle cx="2.5" cy="2" r="2" fill="url(#paint0_linear)"/>
            <defs>
              <linearGradient id="paint0_linear" x1="0.5" y1="2" x2="4.5" y2="2" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0ECC7E"/>
                <stop offset="1" stopColor="#53C0D2"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <p className="loading-description">
          At Making Sense, innovation thrives through our commitment to staying at the forefront of technology. We foster an environment where our people are encouraged to explore, experiment, and grow, turning challenges into opportunities to lead and excel.
        </p>

        <div className="loading-spinner">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clipPath)">
              <g transform="matrix(0.028 0 0 0.028 28 28)">
                <foreignObject x="-1035.71" y="-1035.71" width="2071.43" height="2071.43">
                  <div
                    style={{
                      background: 'conic-gradient(from 90deg, rgba(14, 204, 126, 1) 0deg, rgba(83, 192, 210, 0) 360deg)',
                      height: '100%',
                      width: '100%',
                      opacity: 1,
                    }}
                  />
                </foreignObject>
              </g>
            </g>
            <path d="M56 28C56 43.464 43.464 56 28 56C12.536 56 0 43.464 0 28C0 12.536 12.536 0 28 0C43.464 0 56 12.536 56 28ZM8.4 28C8.4 38.8248 17.1752 47.6 28 47.6C38.8248 47.6 47.6 38.8248 47.6 28C47.6 17.1752 38.8248 8.4 28 8.4C17.1752 8.4 8.4 17.1752 8.4 28Z" fill="url(#spinnerGradient)"/>
            <defs>
              <clipPath id="clipPath">
                <path d="M56 28C56 43.464 43.464 56 28 56C12.536 56 0 43.464 0 28C0 12.536 12.536 0 28 0C43.464 0 56 12.536 56 28ZM8.4 28C8.4 38.8248 17.1752 47.6 28 47.6C38.8248 47.6 47.6 38.8248 47.6 28C47.6 17.1752 38.8248 8.4 28 8.4C17.1752 8.4 8.4 17.1752 8.4 28Z"/>
              </clipPath>
              <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0ECC7E" stopOpacity="1"/>
                <stop offset="100%" stopColor="#53C0D2" stopOpacity="0"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;

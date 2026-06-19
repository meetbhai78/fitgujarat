// ========================================
// Gujarat Step Counter - Ad Integration (Start.io)
// ========================================

const AdManager = {
  shownCount: 0,
  navigationCount: 0,
  maxAdsPerSession: 6, // limit to 6 ads as requested by the user

  init() {
    console.log('[AdManager] Initializing...');
    this.shownCount = parseInt(localStorage.getItem('ads_shown_count') || '0');
    
    // Reset daily shown count if it's a new day
    const lastAdDate = localStorage.getItem('last_ad_date') || '';
    const today = new Date().toISOString().split('T')[0];
    if (lastAdDate !== today) {
      this.shownCount = 0;
      localStorage.setItem('ads_shown_count', '0');
      localStorage.setItem('last_ad_date', today);
    }
    
    // Trigger ad on startup after a 6-second delay to let the dashboard render
    setTimeout(() => {
      this.showAd('startup');
    }, 6000);
  },

  async showAd(placement) {
    if (this.shownCount >= this.maxAdsPerSession) {
      console.log(`[AdManager] Ad cap reached (${this.maxAdsPerSession}). Skipping ad for ${placement}.`);
      return;
    }

    const isNative = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();

    if (isNative && window.Capacitor.Plugins && window.Capacitor.Plugins.StartIo) {
      try {
        console.log(`[AdManager] Showing native Start.io Interstitial Video Ad for placement: ${placement}`);
        const result = await window.Capacitor.Plugins.StartIo.showInterstitial();
        if (result && result.success) {
          this.shownCount++;
          localStorage.setItem('ads_shown_count', String(this.shownCount));
          console.log(`[AdManager] Native ad displayed. Today's count: ${this.shownCount}/${this.maxAdsPerSession}`);
        }
      } catch (err) {
        console.error(`[AdManager] Native ad failed for ${placement}:`, err);
      }
    } else {
      console.log(`[AdManager] [Web-Simulation] Triggering simulated video ad for: ${placement}`);
      await this.showSimulatedAd(placement);
      this.shownCount++;
      localStorage.setItem('ads_shown_count', String(this.shownCount));
      console.log(`[AdManager] Simulated ad displayed. Today's count: ${this.shownCount}/${this.maxAdsPerSession}`);
    }
  },

  showSimulatedAd(placement) {
    return new Promise((resolve) => {
      // Create premium glassmorphic ad overlay
      const overlay = document.createElement('div');
      overlay.id = 'simulatedAdOverlay';
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 200000;
        background: rgba(10, 14, 23, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        color: #ffffff;
        font-family: 'Outfit', 'Inter', sans-serif;
        padding: 24px;
        opacity: 0;
        transition: opacity 0.4s ease;
      `;

      const content = document.createElement('div');
      content.style.cssText = `
        width: 100%;
        max-width: 450px;
        background: linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 28px;
        padding: 32px 24px;
        text-align: center;
        box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
        position: relative;
        overflow: hidden;
      `;

      // Glow effect
      const glow = document.createElement('div');
      glow.style.cssText = `
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255, 107, 53, 0.15) 0%, transparent 60%);
        pointer-events: none;
      `;
      content.appendChild(glow);

      content.innerHTML += `
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #FF6B35; font-weight: 800; margin-bottom: 8px;">
          Start.io Sponsored Ad
        </div>
        <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 20px; background: linear-gradient(90deg, #FF6B35, #F7C948); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          Video Ad Simulation
        </h2>
        
        <!-- Video Simulator Box -->
        <div style="
          width: 100%;
          height: 200px;
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        ">
          <!-- Play indicator -->
          <div id="adPlayIcon" style="font-size: 48px; margin-bottom: 8px; animation: pulseScale 1.5s infinite ease-in-out;">🎬</div>
          <div style="font-size: 13px; color: rgba(255,255,255,0.7); font-weight: 500;">Playing Premium Video Ad...</div>
          
          <!-- Progress Bar -->
          <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: rgba(255,255,255,0.1);">
            <div id="adProgressBar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #FF6B35, #F7C948); transition: width 0.1s linear;"></div>
          </div>
        </div>

        <div style="font-size: 12px; color: rgba(255,255,255,0.5); line-height: 1.5; margin-bottom: 16px;">
          Placement: <strong style="color: #ffffff;">${placement}</strong><br>
          This is a preview of the video ad that loads on mobile devices.
        </div>
        
        <button id="adCloseBtn" disabled style="
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255,255,255,0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 12px 28px;
          font-weight: 700;
          font-size: 14px;
          cursor: not-allowed;
          transition: all 0.3s ease;
          width: 100%;
        ">
          Skip Ad (5s)
        </button>
      `;

      // Keyframes
      const style = document.createElement('style');
      style.innerHTML = `
        @keyframes pulseScale {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `;
      document.head.appendChild(style);

      overlay.appendChild(content);
      document.body.appendChild(overlay);

      // Fade in
      setTimeout(() => { overlay.style.opacity = '1'; }, 10);

      const closeBtn = content.querySelector('#adCloseBtn');
      const progressBar = content.querySelector('#adProgressBar');

      let secondsLeft = 5;
      const duration = 5000;
      let elapsed = 0;
      const intervalMs = 100;

      const countdownTimer = setInterval(() => {
        elapsed += intervalMs;
        const progress = Math.min((elapsed / duration) * 100, 100);
        if (progressBar) progressBar.style.width = `${progress}%`;

        if (elapsed % 1000 === 0) {
          secondsLeft--;
          if (secondsLeft > 0) {
            closeBtn.textContent = `Skip Ad (${secondsLeft}s)`;
          }
        }

        if (elapsed >= duration) {
          clearInterval(countdownTimer);
          closeBtn.disabled = false;
          closeBtn.textContent = 'Skip Ad ➔';
          closeBtn.style.background = 'linear-gradient(90deg, #FF6B35, #F7C948)';
          closeBtn.style.color = '#0A0E17';
          closeBtn.style.cursor = 'pointer';
          closeBtn.style.border = 'none';
          closeBtn.style.boxShadow = '0 4px 12px rgba(255, 107, 53, 0.3)';
        }
      }, intervalMs);

      closeBtn.addEventListener('click', () => {
        if (closeBtn.disabled) return;
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.remove();
          style.remove();
          resolve();
        }, 400);
      });
    });
  },

  handleNavigation() {
    this.navigationCount++;
    console.log(`[AdManager] Page navigation detected. Count: ${this.navigationCount}`);
    
    // Show ad every 3 page transitions (e.g. going from dashboard to leaderboard to profile, etc.)
    if (this.navigationCount % 3 === 0) {
      this.showAd('navigation');
    }
  },

  handleSync() {
    console.log(`[AdManager] Step sync detected.`);
    this.showAd('sync');
  }
};

window.AdManager = AdManager;

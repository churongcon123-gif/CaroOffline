// Sound system sử dụng Web Audio API để tự tổng hợp âm thanh bằng code
class SoundSystem {
  static getAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  static isEnabled() {
    return localStorage.getItem('sound_enabled') !== 'false';
  }

  static toggle(enabled) {
    localStorage.setItem('sound_enabled', enabled ? 'true' : 'false');
  }

  // Tiếng click cờ
  static playClick() {
    if (!this.isEnabled()) return;
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn('Audio play click error:', e);
    }
  }

  // Tiếng tin nhắn chat (ting)
  static playChat() {
    if (!this.isEnabled()) return;
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // nốt A5
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.warn('Audio play chat error:', e);
    }
  }

  // Đếm ngược 5 giây cuối (bíp)
  static playTick() {
    if (!this.isEnabled()) return;
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {
      console.warn('Audio play tick error:', e);
    }
  }

  // Chiến thắng (giai điệu vui)
  static playWin() {
    if (!this.isEnabled()) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.15, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.25);
      });
    } catch (e) {
      console.warn('Audio play win error:', e);
    }
  }

  // Thất bại (giai điệu buồn)
  static playLose() {
    if (!this.isEnabled()) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const notes = [392.00, 349.23, 311.13, 261.63]; // G4, F4, D#4, C4

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.12, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.35);
      });
    } catch (e) {
      console.warn('Audio play lose error:', e);
    }
  }
}

export default SoundSystem;

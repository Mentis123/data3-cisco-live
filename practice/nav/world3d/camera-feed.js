/* Rear camera feed for the AR magic window.

   The feed is a plain <video> element sitting behind a transparent WebGL
   canvas, not a VideoTexture inside the scene. Uploading video frames to a GPU
   texture every frame is slow on WebKit — three.js's own webcam example has a
   long history of stalling on iPhone Safari — whereas a DOM video is composited
   by the browser and costs our frame budget nothing. It also degrades better:
   in Low Power Mode the overlay drops to 30fps while the real world behind it
   keeps moving smoothly.

   iOS lifecycle is the fiddly part. Capture is suspended when the page hides,
   the track can end outright on screen lock, and stream.active still reports
   true while the element shows black frames — so recovery listens to the track,
   the page and the back/forward cache rather than trusting any one signal. */

const CONSTRAINTS = {
  audio: false,
  video: {
    facingMode: { ideal: 'environment' },
    // 720p is plenty for a backdrop and markedly cheaper than asking for the
    // sensor's maximum, which costs battery and heat for no visible gain.
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 30 }
  }
};

export class CameraFeed {
  constructor(video, { onStateChange } = {}) {
    this.video = video;
    this.stream = null;
    this.onStateChange = onStateChange || (() => {});
    this.active = false;

    this.video.setAttribute('playsinline', '');   // without this iOS hijacks to fullscreen
    this.video.setAttribute('autoplay', '');
    this.video.muted = true;

    this.handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      const track = this.stream && this.stream.getVideoTracks()[0];
      if (!track || track.readyState === 'ended') this.start().catch(() => {});
      else this.video.play().catch(() => {});
    };
    this.handlePageShow = event => {
      if (event.persisted) this.start().catch(() => {});
    };
    document.addEventListener('visibilitychange', this.handleVisibility);
    window.addEventListener('pageshow', this.handlePageShow);
  }

  async start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera unavailable in this browser.');
    }
    // iOS allows only one active capture; a second request silently kills the
    // first, so always release before re-acquiring.
    this.stop({ keepListeners: true });

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS);
    } catch (error) {
      // Some devices have no rear camera at all — fall back to any camera
      // before giving up on the experience.
      if (error && (error.name === 'OverconstrainedError' || error.name === 'NotFoundError')) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      } else {
        throw error;
      }
    }

    this.stream = stream;
    this.video.srcObject = stream;
    await this.video.play().catch(() => {});

    const track = stream.getVideoTracks()[0];
    if (track) {
      track.addEventListener('ended', () => {
        this.active = false;
        this.onStateChange('ended');
        if (document.visibilityState === 'visible') this.start().catch(() => {});
      });
      track.addEventListener('mute', () => this.onStateChange('muted'));
      track.addEventListener('unmute', () => {
        this.video.play().catch(() => {});
        this.onStateChange('live');
      });
    }

    this.active = true;
    this.onStateChange('live');
    return stream;
  }

  /* stop(), not pause(). Pausing the element leaves the camera hardware running
     — battery drains and the recording indicator stays lit, which users read
     as the site still watching them. */
  stop({ keepListeners = false } = {}) {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.video.srcObject = null;
    this.active = false;
    if (!keepListeners) {
      document.removeEventListener('visibilitychange', this.handleVisibility);
      window.removeEventListener('pageshow', this.handlePageShow);
    }
  }
}

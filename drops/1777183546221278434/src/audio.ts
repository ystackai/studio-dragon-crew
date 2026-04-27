export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private tidalOsc: OscillatorNode | null = null;
  private tidalLpf: BiquadFilterNode | null = null;
  private tidalGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  noiseSource: AudioBufferSourceNode | null = null;
  private noiseHpf: BiquadFilterNode | null = null;
  private noiseGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private delayWet: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private started = false;

  init() {
    this.ctx = new AudioContext();
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -20;
    this.compressor.knee.value = 10;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.1;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;

     // 56 BPM tidal pulse: 60 Hz sine, low-pass filtered
    this.tidalOsc = this.ctx.createOscillator();
    this.tidalOsc.type = 'sine';
    this.tidalOsc.frequency.value = 60;

    this.tidalLpf = this.ctx.createBiquadFilter();
    this.tidalLpf.type = 'lowpass';
    this.tidalLpf.frequency.value = 200;
    this.tidalLpf.Q.value = 1.5;

    this.tidalGain = this.ctx.createGain();
    this.tidalGain.gain.value = 0.3;

    this.tidalOsc.connect(this.tidalLpf);
    this.tidalLpf.connect(this.tidalGain);

     // Delay network: 0.8s feedback
    this.delayNode = this.ctx.createDelay(2);
    this.delayNode.delayTime.value = 0.8;

    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.value = 0.3;

    this.delayWet = this.ctx.createGain();
    this.delayWet.gain.value = 0.3;

    this.masterGain.connect(this.compressor);
    this.masterGain.connect(this.delayNode);
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.delayWet);
    this.delayWet.connect(this.compressor);

    this.tidalGain.connect(this.masterGain);
    this.compressor.connect(this.ctx.destination);

    this.tidalOsc.start();

     // Pre-generate white noise buffer for coral chimes
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 2;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
     }

    this.noiseHpf = this.ctx.createBiquadFilter();
    this.noiseHpf.type = 'highpass';
    this.noiseHpf.frequency.value = 2000;
    this.noiseHpf.Q.value = 0.7;

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = 0;

    this.noiseHpf.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);
  }

  resume() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.started) {
      this.started = true;
    }
  }

  playNoiseBurst(velocity: number, offset?: number) {
    if (!this.ctx || !this.noiseBuffer || !this.noiseSource || this.noiseSource === null) {
      if (!this.ctx || !this.noiseBuffer) return;
      this.noiseSource = this.ctx.createBufferSource();
      this.noiseSource.buffer = this.noiseBuffer;
      this.noiseSource.connect(this.noiseHpf!);
    }

    if (!this.noiseSource) return;

    const t = this.ctx.currentTime + (offset || 0);
    const volume = Math.min(velocity * 0.4, 0.35);

    try {
      this.noiseSource.stop(t + 0.6);
    } catch (_) {}

    this.noiseSource = this.ctx.createBufferSource();
    this.noiseSource.buffer = this.noiseBuffer;
    this.noiseSource.connect(this.noiseHpf!);
    this.noiseSource.start(t);

    this.noiseGain!.gain.setTargetAtTime(volume, t, 0.02);
    this.noiseGain!.gain.setTargetAtTime(0, t + 0.15, 0.08);
   }

  update(intensity: number, velocity: number, time: number) {
    if (!this.ctx) return;

     // Tidal pulse: 56 BPM means ~0.93s per beat
    const bpm56Freq = 56 / 60;
    const tidalMod = Math.sin(time * bpm56Freq * Math.PI * 2) * 0.5 + 0.5;
    this.tidalGain!.gain.value = 0.15 + tidalMod * 0.25;

     // LPF opens slightly with breath
    if (this.tidalLpf) {
      this.tidalLpf.frequency.value = 180 + intensity * 400;
     }

     // Noise chime mapped to velocity
    if (velocity > 0.02) {
      this.playNoiseBurst(velocity);
    }
  }

  drain() {
    if (!this.ctx || !this.noiseGain) return;
    const t = this.ctx.currentTime;
    this.noiseGain.gain.setTargetAtTime(0, t, 0.05);
  }

  destroy() {
    if (this.tidalOsc) this.tidalOsc.stop();
    if (this.noiseSource) this.noiseSource.stop();
    if (this.ctx) this.ctx.close();
  }
}

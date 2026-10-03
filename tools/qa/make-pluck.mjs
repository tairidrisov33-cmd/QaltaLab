import { writeFileSync, mkdirSync } from 'node:fs';
mkdirSync(new URL('./.out/', import.meta.url), { recursive: true });
const rate = 48000, secs = 40, n = rate * secs, gap = 1.6;
const notes = [147, 196, 262, 294];
const buf = Buffer.alloc(44 + n * 2);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(rate, 24);
buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
for (let i = 0; i < n; i++) {
  const t = i / rate, k = Math.floor(t / gap), tt = t - k * gap, f = notes[k % notes.length];
  const env = Math.exp(-tt / 0.6) * Math.min(1, tt / 0.004);
  // щипок: второй обертон громче основного тона
  const v = env * (0.25 * Math.sin(2 * Math.PI * f * t) + 0.45 * Math.sin(2 * Math.PI * 2 * f * t) + 0.2 * Math.sin(2 * Math.PI * 3 * f * t) + 0.08 * Math.sin(2 * Math.PI * 4 * f * t)) + 0.004 * (Math.random() - 0.5);
  buf.writeInt16LE(Math.round(v * 30000), 44 + i * 2);
}
writeFileSync(new URL('./.out/pluck.wav', import.meta.url), buf);

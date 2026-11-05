#!/usr/bin/env python3
"""Synthesises the small UI sound effects (pure Python, no deps)."""
import math
import os
import struct
import wave

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "sounds")
os.makedirs(OUT, exist_ok=True)
SR = 44100


def env(t, dur, a=0.005, r=0.25):
    if t < a:
        return t / a
    rem = dur - t
    return max(0.0, min(1.0, rem / (dur * r))) if rem < dur * r else 1.0


def tone(freq, dur, vol=0.5, kind="sine", harmonics=(1.0, 0.35, 0.12), decay=4.0):
    n = int(SR * dur)
    out = []
    for i in range(n):
        t = i / SR
        s = 0.0
        for k, h in enumerate(harmonics, start=1):
            if kind == "square":
                s += h * (1 if math.sin(2 * math.pi * freq * k * t) > 0 else -1) * 0.3
            else:
                s += h * math.sin(2 * math.pi * freq * k * t)
        s *= math.exp(-decay * t) * env(t, dur)
        out.append(s * vol)
    return out


def mix(*tracks):
    n = max(len(t) for t, _ in tracks) if tracks else 0
    buf = [0.0] * n
    for tr, offset in tracks:
        o = int(offset * SR)
        for i, v in enumerate(tr):
            if o + i < len(buf):
                buf[o + i] += v
            else:
                buf.append(v)
    return buf


def seq(notes):
    """notes: list of (freq, start, dur, vol)"""
    tracks = [(tone(f, d, v), s) for f, s, d, v in notes]
    total = max(s + d for _, s, d, _ in notes)
    buf = [0.0] * int(total * SR + 10)
    for tr, s in tracks:
        o = int(s * SR)
        for i, v in enumerate(tr):
            if o + i < len(buf):
                buf[o + i] += v
    return buf


def save(name, samples):
    peak = max(1e-9, max(abs(s) for s in samples))
    g = 0.85 / peak if peak > 0.85 else 1.0
    with wave.open(os.path.join(OUT, name), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s * g)) * 32767)) for s in samples))


C5, E5, G5, C6, E6, G6 = 523.25, 659.25, 783.99, 1046.5, 1318.5, 1568.0

save("correct.wav", seq([(E5, 0.0, 0.18, 0.5), (C6, 0.09, 0.32, 0.55)]))
save("combo.wav", seq([(C5, 0.0, 0.14, 0.4), (E5, 0.07, 0.14, 0.4), (G5, 0.14, 0.14, 0.45), (C6, 0.21, 0.4, 0.55)]))
save("wrong.wav", seq([(220.0, 0.0, 0.16, 0.45), (174.6, 0.12, 0.30, 0.45)]))
save("complete.wav", seq([
    (C5, 0.00, 0.20, 0.4), (E5, 0.12, 0.20, 0.4), (G5, 0.24, 0.20, 0.45),
    (C6, 0.36, 0.55, 0.5), (E6, 0.36, 0.55, 0.25), (G6, 0.52, 0.6, 0.3)]))
save("tap.wav", tone(1400, 0.045, 0.3, decay=60))
save("unlock.wav", seq([(G5, 0.0, 0.12, 0.4), (C6, 0.08, 0.12, 0.4), (G6, 0.16, 0.4, 0.45)]))
print("sounds ok")

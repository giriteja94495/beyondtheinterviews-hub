---
categories:
  - Engineering
topics:
  - distributed systems
sources:
updated: 2026-02-10
---
Time-series databases compress data using a simple idea: **delta encoding**. Most TS data has low variance (consecutive values are usually close together.) That predictability is what makes compression so effective.

## Delta encoding for values

Instead of storing the full value each time, store the **difference** from the previous point. 

**Example:** CPU usage recorded every second:

**Raw values:**

```
[62.8]  [63.0]  [62.9]  [63.2]
```

**Delta encoded:**

```
[62.8]  [+0.2]  [-0.1]  [+0.3]
```

First value is stored as is; the rest are deltas.

## Varints for smaller storage

Those deltas are usually tiny. Many time-series engines store them as **varints** (variable-length integers) : small deltas take fewer bytes than fixed 32/64-bit numbers. Storage becomes cheaper.

**Trade-off:** You use a bit of compute to reconstruct the values when reading.

## Delta-of-delta for timestamps

Time-series databases do something extra for timestamps: **delta-of-delta encoding**.

When timestamps come at regular intervals (e.g., every 5 seconds):

**Raw timestamps:**

```
2000,  2005,  2010,  2015,  2020
```

**First-order deltas:**

```
5,  5,  5,  5,  5...
```

**Delta-of-deltas:**

```
5,  0,  0,  0,  0...
```

When intervals are consistent, the second-order deltas are mostly zeros and zeros compress extremely well.

Simple concept. Huge impact on storage.

 Rebuilding values from deltas is just repeated addition (`value[i] = value[i-1] + delta[i]`), and delta-of-delta just does that twice instead of once. Both are cheap, fixed-cost, predictable work.

The real cost is in decoding the **varints**. Because a varint's byte-length varies per value, the decoder can't know where one number ends and the next begins until it reads a continuation bit byte-by-byte, unlike fixed-width deltas, where every value's position is known in advance. That serial, unpredictable byte-walk is what actually costs CPU cycles on read,  not the addition used to undo the delta encoding itself.
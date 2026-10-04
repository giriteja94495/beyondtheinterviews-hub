---
categories:
  - Engineering
topics:
  - ai
sources:
updated: 2026-01-18
---

The agent system exposes a memory tool , and the model triggers it based on a memory policy.  

When triggered, the system writes to an external store (vector DB) and later retrieves relevant bits back into the context window.  
  
The 2 common write paths it can follow :  
  
- Explicit write (hot path):  The agent identifies that something is important during the conversation and saves it immediately using tool calling. This updates long-term memory right away, so it can be used in the next turn.  
  
- Implicit write (background): The agent responds first, and a background process later summarizes/extracts useful facts and writes them to long-term memory either after a session or during periodic intervals, This avoids latency, but the memory may not be available instantly for the next message.  
  ![[explicit vs implicit memory.png]]

But what kind of data goes to long-term memory ?  

It typically falls under these 3 buckets:

- [[Agent Memory Types]] (semantic, episodic, and procedural memory)
  
This kind of context memory management, by offloading context to long-term memory, helps prevent memory bloat and keeps the context window clean with relevant and sufficient data
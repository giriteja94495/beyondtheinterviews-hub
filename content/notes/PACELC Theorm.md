---
categories:
  - Engineering
topics:
  - distributed systems
sources:
updated: 2026-03-11
---

[[CAP Theorm]] is probably the most over quoted concept in distributed systems.  
  
But here’s something beyond CAP that very few talk about.  
  
CAP has 2 problems :  
- In CAP-consistency we wait for all the nodes to sync before responding. And this definetly hurts performance, and infact most of the systems don’t need this level of strictness.  
  
- In CAP-availability we ignore latency and say that every request will recieve a response right, it doesn’t care if it takes a 100ms or even a minute. So we are ignoring customer experience here even though it’s available.  
  
And in practice we deal more with latency and partial failures more than full network partition right (because of modern hardware and well designed systems)  
  
This is where PACELC comes in:  
  
If partition occurs -> choose between availability and consistency.  
  
If no partition -> choose between consistency and latency.  
  
CAP explains failure-time tradeoffs.  
PACELC explains real-world system design..

![[pacelc.png]]
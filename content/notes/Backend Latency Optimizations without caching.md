---
categories:
  - Engineering
topics:
  - distributed systems
sources:
updated: 2026-02-17
---

Some fundamental server-side latency optimizations before introducing caching :  

- Reduce the payload size (avoid sending unnecessary extra fields/data over the network, fetch only the required fields instead of using SELECT *)  

- Move non-critical and long running tasks out of the request flow (like say a image processing, or another external network call, analytics etc.,, handle them asynchronously)  

- Use pagination when returning huge amounts of data.  

- Use efficient formats wherever possible (serialization/deserialization speed matters, so formats like protobufs can be significantly faster than json)  
  
- Use HTTP/2 or HTTP/3 where possible (they support multiplexing, and allow multiple requests over a single connection and reducing network overhead)  

- Optimize slow database queries by proper database indexing, identifying and resolving N+1 queries, using connection pooling (keeps reusable TCP/DB connections warm, avoids creating new connections for every request, and improves latency)
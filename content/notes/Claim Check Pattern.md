---
categories:
  - Engineering
topics:
  - distributed systems
sources:
updated: 2026-01-18
---
Messaging systems are not made for large payloads.  
  
When there is a large payload to send across two services, it can be pushed through a messaging system only up to its message size limits.  
  
Those limits can be increased, but only up to what the messaging system can realistically support.  
  
We can go with chunking like splitting the payload into smaller messages.  
It works, but it introduces batching logic, complexity of combining chunks together etc.  
  
A cleaner solution would be to use the Claim-Check pattern:  
- Store the large payload in external storage  
- Publish a small message containing a reference (object key)  
- Let consumers fetch the payload only when needed through the token  
  
So now the messaging system carries just metadata and not megabytes of the payloads.  
  
One important detail is that this becomes a two-step operation:  
- Write to storage  
- Send message to the messaging system  
  
It’s no longer Atomic, meaning:  
- If message send fails after storage write → orphaned blob  
- If storage write fails but message sent to the messaging system → broken reference  
  
So in production, it would become super important to implement this along with cautions like :  
- Retry logic  
- Idempotent object keys  
- Transactional outbox or cleanup

![[claim check pattern.png]]
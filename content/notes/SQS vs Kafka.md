---
categories:
  - Engineering
topics:
  - distributed systems
sources:
updated: 2026-05-19
---
  
With SQS:  
  
- multiple similar workers read from the same queue, but each message is picked up by only one worker.  
  
- Once a worker receives a message, SQS hides it for the visibility timeout period.  
  
- If the worker finishes, it deletes the message. If it fails or times out, the message becomes visible again for another worker to process.  
  
This model works well when we want to distribute work across workers doing the same kind of job.  
  
---------------- 
  
Whereas with Kafka  
  
consumers are organized differently.  
  
- In Kafka we are basically writing to a durable, append-only log.  
  
- Each consumer group tracks its own offset, which means it can retry failed processing, replay older events, rewind to a previous offset, and reprocess data if needed.  
  
That is useful when different components need to react to the same event independently
---
categories:
  - Engineering
topics:
  - distributed systems
sources:
  - article
updated: 2026-02-06
---
## What is Kafka?

[Kafka documentation](https://kafka.apache.org/41/getting-started/introduction/) states that Apache Kafka is an open-source, highly scalable, durable, fault-tolerant distributed event streaming platform. A variety of companies use Kafka in production systems, you can access the list of companies that use Kafka [here](https://cwiki.apache.org/confluence/display/KAFKA/Powered+By).
A stream is a continuous flow of data (records/messages/events). These messages are published by producers and consumers read and process them. Kafka, or any streaming platform, handles this workflow efficiently by possessing the following capabilities:

- Collect the data sent from multiple producers, and store them
- Make sure the stored messages are not lost even during outages or failures
- Be scalable in case of heavy load
- Exhibit fault tolerant behavior
- Enable access to multiple consumers

![[kafka-streaming-platform.webp]]

  

In a nutshell, Kafka works on the traditional client-server architecture. The server is Kafka, the producer and the consumer are the clients. The communication between client and server happens via [customized high-performance TCP protocol](https://kafka.apache.org/protocol.html) implemented by the Kafka team. There are [client libraries](https://cwiki.apache.org/confluence/display/KAFKA/Clients) available for almost all programming languages.

## Kafka Architecture

On a higher level, this is how the Kafka architecture looks. In the sections below we will go over all the key components.


![[kafka-architecture.webp]]

## Message Structure

A **message** (also called data, record, or event) is the basic unit of data stored inside the Kafka log. We can think of a message like a row in a database. 

This message or event represents something that happened (like a trigger for async processing).

  
![[kafka-message-structure.webp]]  

An event describes something that happened. For example, in an e-commerce system, examples of events can be an order is created, an item is added to cart, an order is delivered. In Kafka, we read or write data in the form of events. We can send this data in XML, JSON, or Avro.

Each message is a key-value pair, which looks like this:

```
{  "order_id": "order-1234",  "order_amount": "50.00",  "created_by": "praddy",  "created_on": "2026-02-09T22:02:00Z"}
```

## Topics

![[kafka-topics.webp]]


In a real system, there are multiple kinds of events flowing continuously like orders, payments, and application logs. It makes sense to group these related events together, and in Kafka this grouping is called a topic.

A topic is a logical abstraction: it is a named stream that groups related records together.

> We can think of Kafka topics like a table in a database (collection of related records), or a folder in a file system (collection of related files).

Every Kafka message is published to exactly one topic. We can have multiple topics in our Kafka cluster each storing a specific category of events.

Topics are the way you publish and subscribe to data in Kafka. When you publish a message, you publish it to a topic, and when you consume a message, you consume it from a topic. Topics are always multi-producer; that is, a topic can have zero, one, or many producers that write data to it.

Internally, each topic is a combination of multiple partitions.

## Partitions

[Hussein Nasser](https://hnasr.substack.com/) always quotes that the best way to work with billions of rows in a database is to avoid working with billions of rows. That’s exactly how Kafka works.

Just like how a database shards data when a single node becomes a write bottleneck, Kafka scales write throughput by increasing the number of partitions in a topic. This allows writes to happen in parallel.

A partition is an ordered, immutable, append-only log of messages (just like write-ahead logs in databases). Since messages are always appended, they can be read in the same order from beginning to end.

Partitioning gives Kafka the ability to scale out, meaning partitions can spread across a cluster of machines and hold more data than a single machine could handle. Since it is partitioned, everything like storage, reads, and writes gets distributed across the cluster: producers can write to multiple partitions in parallel, and consumers can read from multiple partitions in parallel.

Each partition contains a different subset of the topic’s data. If we take the union of records across all partitions, we get all the records that belong to the topic.

**Offset:** Offset is a unique identifier assigned to each message within a partition. It is like the position number of that message in the log (0, 1, 2, and so on).

We will talk about why offsets are useful in the Consumers section below.

Important note: these logs are persistent meaning every message received is immediately written to disk.

Below is a simple example of a single producer and a single consumer writing and reading from a two-partition topic. The image is from [LinkedIn’s Engineering Blog](https://engineering.linkedin.com/kafka/benchmarking-apache-kafka-2-million-writes-second-three-cheap-machines).

![[kafka-partitions.webp]]

## Kafka Broker

Kafka brokers are the servers that run Kafka. We talked about how producers publish data to a topic and consumers consume from the topic. We also talked about how the data is appended into an append-only log inside partitions. But where does all of this actually live and run?

That’s where brokers come in.

When a producer publishes an event to a topic, Kafka automatically routes that event to the correct partition of that topic. That partition is stored on some broker, and the broker is responsible for receiving the write request and persisting the event to disk. Similarly, when a consumer subscribes to a topic, it reads the data by fetching messages from the brokers that host the partitions for that topic.

A Kafka cluster is simply a group of multiple brokers working together. Having multiple brokers allows Kafka to distribute partitions across machines, handle high traffic, and stay available even if one broker goes down. By adding more brokers, Kafka can scale horizontally without changing producer or consumer code.

## Producers

A producer is a client application that publishes events to Kafka topics. Producers send records to a topic, and Kafka routes those records to the appropriate partitions, which are stored on brokers.

**Question:** We said producers send data to a topic and data ends up in a partition on a broker. How does Kafka decide which partition a record should go to? And can producers control that?

**Answer:**

Kafka follows a few simple rules:

- If the producer does not provide a key, Kafka distributes records across partitions to balance load (commonly round-robin or sticky partitioning depending on the client)
- If the producer does provide a key, Kafka uses that key to consistently choose a partition

Under the hood, this is usually:

- `Partition no = hash(key) % p`, where `p` = number of partitions
- Messages with the same key always go to the same partition, which means they are stored in order within that partition
- If we decide to change the number of partitions `p` later (increase or decrease), the same key may start routing to a different partition, so there might not be ordering guarantee. It is always advised to choose the partition number up front based on the parallelism and throughput needs.

If needed, producers can also:

- Directly specify the partition number, or
- Implement a custom partitioning logic (useful, but should be done carefully to avoid hot partitions and uneven load)

> I will dedicate a separate article to discuss the internals of the Kafka producer in the upcoming weeks.

## Consumers

A consumer is a client application that subscribes to one or more Kafka topics and reads records from them. Internally, consumers always read from partitions, not from a topic as a whole. They work on a pull-based model.

Here’s a wonderful write up from [this page](https://kafka.apache.org/41/design/design/#the-producer) of Kafka documentation, as to why they chose pull over push for consumers.

![[kafka-consumers-pull.webp]]

  
**Question:** 

If a topic has multiple partitions and you spin up multiple consumers, how does Kafka decide who reads what, and how does it avoid two consumers accidentally processing the same message while preserving ordering?

**Answer:**

If consumers were allowed to read partitions independently without any coordination, then every consumer could end up reading the same partitions and hence the same messages, leading to duplicate processing.

Kafka solves this by introducing **consumer groups**. A consumer group is just a logical grouping of consumers identified by the same `group.id`. When multiple consumers join the same group, Kafka treats them like a team that wants to share the work, and it enforces a very important rule:

- Each partition is assigned to at most one consumer within the group

A consumer can read from one or more partitions, but no two consumers in the same group will read from the same partition at the same time. This keeps ordering intact (since each partition is an ordered log) and ensures that each message is processed only once per consumer group.

- If number of consumers in a consumer group < number of partitions of the topic it is consuming from, each consumer is assigned multiple partitions
- If number of consumers in a consumer group == number of partitions of the topic it is consuming from, each consumer is assigned exactly one partition
- If number of consumers in a consumer group > number of partitions of the topic it is consuming from, extra consumers remain idle for that topic
- If a consumer group subscribes to multiple topics, this assignment logic is applied independently per topic

Now remember the offset we briefly introduced earlier as the position number (0, 1, 2, and so on) of a message inside a partition. This is exactly why offsets are useful. As consumers read from a partition, Kafka tracks how far they have read using offsets, and these offsets are tracked per consumer group, per partition.  

Kafka stores these committed offsets inside an internal Kafka topic called `__consumer_offsets`, which is how Kafka can remember progress even if a consumer crashes or restarts. Because of this, consumers can resume from where they left off after failures, and different consumer groups can consume the same topic independently with their own progress.

> I will dedicate a separate article to discuss the internals of Kafka consumers.

## Replication

Till now, we have talked about how partitions store data on brokers. But if a partition existed on only one broker, Kafka would not be fault tolerant. If that broker went down, data would be unavailable or even lost. Kafka solves this using **replication**.  

- **Leader replica:** Each partition has one replica elected as the leader, and that leader lives on a broker. Producers and consumers always talk to the leader for that partition.
- **Follower replicas:** The same partition is replicated onto other brokers as followers. Followers do not serve client traffic, they passively replicate data from the leader.
- **Distributed leadership:** In the architecture diagram above, notice how leaders are spread across brokers (example: Partition A-0 leader on Broker 1, Partition A-1 leader on Broker 2). This is intentional so read and write load is distributed and no single broker becomes a hotspot.
- **ISR (In-Sync Replicas):** Followers that are fully caught up with the leader are part of the ISR. ISR is critical because only an in-sync follower can safely be promoted as the next leader without losing acknowledged data.
- **Failover:** If the broker hosting a partition leader goes down, Kafka promotes one of the ISR followers as the new leader, so producers and consumers can continue operating with minimal downtime. When the failed broker returns, it usually rejoins as a follower and starts replicating again.

At this point, we understand what replication is and why Kafka uses leaders, followers, and ISR. But this naturally raises the next question: who tracks broker liveness, who decides leaders, and who coordinates failover and metadata updates? That responsibility belongs to Kafka’s control plane: the **KRaft Controller**.

## KRaft Controller

Kafka replication and failover only work if the cluster has a single, consistent authority that coordinates metadata changes. That role is handled by the Kafka Controller (Kafka’s control plane).

At a high level, the controller’s responsibilities include:

- **Leader assignment:** deciding which replica is the leader for each partition
- **Managing replication state:** tracking replicas and maintaining the ISR set
- **Broker health monitoring:** detecting when brokers go down or come back up
- **Failover coordination:** when a leader broker fails, promoting an in-sync follower as the new leader so the partition stays available

Earlier versions of Kafka relied on ZooKeeper for this coordination. Modern Kafka replaces ZooKeeper with KRaft (Kafka Raft), where Kafka manages this metadata internally with no external dependency.

One important note: the controller does not handle data traffic. Producers and consumers do not talk to it directly. It coordinates the cluster in the background so Kafka keeps working correctly even as brokers come and go.
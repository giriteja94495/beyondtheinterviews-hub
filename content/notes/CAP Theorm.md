---
categories:
  - Engineering
topics:
  - distributed systems
sources:
updated: 2026-01-29
---
Let's start by understanding the basic definition of CAP, and then lets delve deep to understand the what, why and how.

CAP Theorem states that in a distributed system, you can have only 2 out of the 3 of the following properties:

## Consistency

Every read receives the most recent write or an error. Consistency means that all clients see the same data at the same time, no matter which node they connect to. For this to happen, whenever data is written to one node, it must be instantly forwarded or replicated to all the other nodes in the system before the write is deemed succesfull. Consistency as defined in the CAP theorem is quite different from the consistency guaranteed in ACID database transactions.[

## Availability

Every request received by a non-failing node in the system must result in a response, without the guarantee that it contains the most recent version of the data.

## Partition Tolerance

The system continues to operate despite arbitrary message loss or failure of part of the system (i.e., network partitions between nodes).

![[cap-theorm.png]]

  
In the real world, network failures are inevitable. Cables are cut, routers fail, and packets are dropped. Therefore, Partition Tolerance (P) is a requirement, not a choice.

When a partition occurs, we are left with a binary choice: Consistency (CP) or Availability (AP).

To be honest, i just picked the above definitions from [Wikipedia](https://en.wikipedia.org/wiki/CAP_theorem) and pasted them here, as they have stated it beautifully.

So now from the above definitions, the first question that may arise to you is : 

> Why cant there be a system with both consistency and availability ?

To understand why we can't have all three, let’s look at a practical example

![[cap-theorm-cluster-partition.png]]

Imagine a distributed system with two clusters located in different regions: Asia(the cluster on the left) and the USA(the cluster on the right). Under normal conditions, they sync perfectly. But then, a submarine cable is damaged, and the two regions lose connection. They are now "partitioned."

A user in Asia updates their profile. Since the Asia cluster cannot talk to the USA cluster, we have to make a design choice:


- **The CP Choice (Consistency):**  
    We want the USA user to see the updated data. But because the network is broken, we can't sync the update. To maintain consistency, we must return an error to the USA user (decreasing Availability). We'd rather show a "Service Unavailable" message than show the wrong data.
  
- **The AP Choice (Availability)**:  
    We want the system to have zero downtime. Even though the clusters can't talk, the USA cluster still responds to the user. However, the user sees the old, stale data because the Asia update hasn't arrived yet. The system is available, but the data is inconsistent.

## Which one should you choose ?

The choice totaly depends on the usecase of the application.

**CP based Applications**

- Ticket booking system (say a person booked a ticket, and partition happens, and if the pther person is able to see old data then even he can book the ticket, which is catastrophic, hence it has to be strongly consistent)
- Financial banking Banking Applications.

These applications need strong consitency.

**AP based Applications**

- Social Media App (if a person updates his name on his profile, and if you dont see it immediately (the correct data) thats okay, no one cares even if you sees stale data for sometime (but if the application goes down then thats not acceptable.))
- Business review service etc.

## Tools or types od DB for each usecase ?

**CP based Applications**

These kind of applications that demand strong consistency the db which satisfy these are :

- Postgres
- RDBMS

**AP based Applications**

these kind of applications which demand availability and where eventual consistency is okay then we use :

- DynamoDB
- Cassandra

[[PACELC Theorm]] is the extended version of CAP
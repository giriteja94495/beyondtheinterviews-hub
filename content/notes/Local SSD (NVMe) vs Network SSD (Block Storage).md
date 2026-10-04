---
categories:
  - Engineering
topics:
  - distributed systems
sources:
  - article
updated: 2026-02-09
---
## Local SSD (NVMe)

- The SSD is inside the machine, it is attached directly to the compute instance via PCIe,
- it is super fast, and has low latency, and high throughput,(no limit to IOPS unless the hardware is limited.. )
- Belongs to that one machine, If the machine crashes / is deleted, the data on that local disk can be lost.
- cannot detach and reattach to another instance

## Network SSD (Block Storage)

- The disk is not inside the machine, it is a separate disk that is attached to the machine over the network, (It lives on a separate storage system in the cloud/datacenter.)
- data survives instance reboots, terminations, and migrations because it is stored on a separate storage system.
- It is a bit slower than local SSD because the request goes through the network. meaning it has higher latency... (also has limited IOPS)
- What if even that seeprate storage system fails ? , i mean it can too so for that -> typically replicatation is done...
- **Examples**: AWS EBS gp3/io2, GCP Persistent Disk, Azure Managed Disk

## Use Cases

**Local SSD (NVMe):**

- Cache layers (Redis, Memcached working sets)
- Temp data, scratch space
- High-throughput OLTP where you replicate at app level
- Workloads that can tolerate loss and rebuild from elsewhere

**Network SSD (Block Storage):**

- Boot volumes
- Databases where persistence is required
- When you need to detach/reattach disks
- Workloads requiring durability and backup
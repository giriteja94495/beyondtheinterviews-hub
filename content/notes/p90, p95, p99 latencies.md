---
categories:
  - Engineering
topics:
  - distributed systems
sources:
updated: 2026-02-01
---
Super important latency metrics for production performance monitoring.

  
- **p50 (median)** : 50% of requests are faster than this, 50 % requests are slower than this. It's the middle value in the sorted list of latencies in a certain time period.
- **p95** : 95% of requests are faster. 5% of requests are slower than this.
- **p99** : 99% of requests are faster. 1 % of requests are slower than this. Catches the tail latency.

![[percentile-latency-graph.webp]]

As you can see in the graph, the tail latency is spikes after p90, this is because of the 10% of requests that are slower than p90.

So we wouldnt have been able to catch this if we had only looked at the p50 latency.  

If we would have just looked at the p95 latency also, wewould have understood okay there is a little bit of latency spike but not the tail latency.

So we look at p50 + p95 + p99 to get a complete picture of the latency distribution.  

As a gist, we can say :

- **p50** : Good for understanding baseline performance
- **p95/p99** : Super useful for SLOs in [[SLI vs SLO vs SLA]] and catching issues that only affect a subset of usersl
- High p99 can be because of db slowness, cold starts, cache misses, noisy neighbour, etc..
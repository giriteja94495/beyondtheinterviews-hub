---
categories:
  - Engineering
topics:
  - distributed systems
sources:
updated: 2025-12-29
---

While the basic LRU Cache is straightforward which removes the least recently used key-value pairs from the cache, but there are variations and optimizations to cater to specific needs for example like tracking the recency with timestamps etc for eviction decisions.

Similarly in an LRU, instead of keeping track of the exact LRU data, the 2 random data can be picked, and out of them the one which was least recently used can be evicted from the cache, this is called as 2-random cache eviction technique.

True LRU is expensive to implement at scale. Apparently these Randomized techniques have actually proven to be better than the usual LRU as it uses lesser memory and CPU overhead.

LRU is better for small caches and 2-random is better for large caches

You can research about it more and maybe read this article if this piques your curiosity -> [Why are Randomized Algorithms better than LRU?](https://danluu.com/2choices-eviction/)

In fact most in-memory databases use this kind of eviction policy, check this out: [Redis](https://redis.io/docs/latest/develop/reference/eviction/)
![[2-random-cache-eviction.png]]

## Why this counts as an optimization

It's an optimization on bookkeeping cost, not on eviction accuracy,  strict LRU and 2-random eviction pick roughly similar victims, but strict LRU pays a much heavier price to know exactly who the victim should be.

To always evict the exact least-recently-used item, a cache needs a live, ordered record of every access,  normally a doubly-linked list plus a hash map, where every single read (not just write) has to move that item to the front of the list. That turns every cache hit into a write against the ordering structure, and in a multi-threaded cache, that shared structure needs locking,  so concurrent reads start contending with each other just to update recency.

2-random skips all of that: sample 2 random entries when you need to evict, compare something cheap like their last-access timestamps, and kill the older one. No global structure to keep in sync, no lock contention on every read.

The reason this doesn't tank your hit rate is the same trick behind "power of two choices". Evicting a single random item risks killing something genuinely hot fairly often. But once you sample two candidates and evict the worse of the two, the odds of both picks landing on hot items drop sharply  which is also why "2-random" is the sweet spot; sampling 3, 4, or more barely improves things further from there.

Here's the corrected version, scaled up so the multiplication actually holds:

---

## Putting numbers on it

Say the cache holds 1,000 items, and 100 of them are "hot" (still needed) — so any single random pick has a 100/1000 = 10% chance of landing on a hot one. (Small caches with only a handful of items break this math, since removing one hot item from a tiny pool changes the odds a lot, but real caches are large enough that this approximation holds well.)

- **Sampling 1 random item:** a 1-in-10 chance it's hot. Mistake rate: **10%**.

- **Sampling 2 and evicting the older:** you only mess up if _both_ picks happen to be hot, since if only one is hot you'd naturally throw away the cold one instead. First pick: 10% chance of hot. Second pick, from the remaining 999 items with 99 hot ones left: ≈9.9% chance. Multiplied together: `10% × 9.9% ≈ 1%`. A **10x drop** from a single extra read.

- **Sampling 3:** you'd need all three to be hot: roughly `10% × 9.9% × 9.8% ≈ 0.1%`. Another 10x on paper, but that's shrinking an already-rare mistake (1-in-100) into an even rarer one (1-in-1000), while paying for a 3rd read on every single eviction, forever.

The jump from 1 to 2 samples buys a huge, meaningful improvement. which is exactly why 2-random is the sweet spot.

So the trade is: give up exact recency tracking, and its constant maintenance cost, for approximate recency that's cheap to compute on demand which is why Redis and similar in-memory stores use this instead of true LRU at real scale.
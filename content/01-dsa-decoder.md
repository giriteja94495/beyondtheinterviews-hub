# The 40-Pattern DSA Decoder
Recognition-first DSA. Stop memorizing solutions; learn the 40 doors.

## How to use this decoder
- Read a pattern's CUE before its solution. In interviews, 60% of the battle is naming the pattern in under 2 minutes.
- After every problem you solve, write one sentence: the pattern and why it applied. If you cannot, you did not learn it.
- Spaced repetition: re-solve each model problem on Day 3, Day 7, Day 21. Fail a review = restart the interval.
- Constraints are the cheapest filter: n <= 20 means backtracking/bitmask is fine; n <= 100000 means you need O(n log n) or better; O(n^2) is dead on arrival.

## Family: Windows and Pointers
### 1. Fixed-Size Sliding Window
CUE: "subarray/substring of size k", max/avg over every k-block.
CORE: add entering element, remove leaving element in O(1).
PROBLEMS: LC 643 Maximum Average Subarray I, LC 567 Permutation in String, LC 438 Find All Anagrams.
COMPLEXITY: O(n) time, O(1) space.
TRAP: window size is r-l+1; forgetting to subtract the element leaving the window.

### 2. Variable-Size Sliding Window
CUE: "longest/shortest contiguous... with at most/exactly k distinct..."
CORE: expand right always; shrink left while invalid. Works only when validity is monotone.
PROBLEMS: LC 3 Longest Substring Without Repeating, LC 76 Minimum Window Substring, LC 904 Fruit Into Baskets.
COMPLEXITY: O(n) time, O(k) space.
TRAP: shrinking with if instead of while; using windows with negative numbers (monotonicity breaks - go Prefix Sum).

### 3. Two Pointers (converging)
CUE: sorted array + pair/triplet/target sum.
CORE: move ends inward based on comparison against target.
PROBLEMS: LC 167 Two Sum II, LC 15 3Sum, LC 11 Container With Most Water.
COMPLEXITY: O(n log n) with sort, then O(n).
TRAP: not skipping duplicates in 3Sum.

### 4. Fast-Slow Pointers
CUE: linked list cycle, middle node, or "duplicate number in array of 1..n".
CORE: Floyd's tortoise-hare; on meeting, reset one pointer to head, advance both by 1 to find cycle start.
PROBLEMS: LC 141, LC 142 Linked List Cycle II, LC 287 Find the Duplicate, LC 876 Middle.
COMPLEXITY: O(n) time, O(1) space.
TRAP: finding the meeting point but botching the restart phase.

### 5. Prefix Sum + HashMap
CUE: "count subarrays with sum k", range sums with negatives.
CORE: prefix[i] - prefix[j] = k means prefix[j] = prefix[i] - k; store counts of seen prefixes.
PROBLEMS: LC 560 Subarray Sum Equals K, LC 974 Subarray Sums Divisible by K, LC 303 Range Sum.
COMPLEXITY: O(n) time, O(n) space.
TRAP: not seeding the map with {0:1} before the loop.

### 6. Hashing: Seen-Before and Grouping
CUE: "have I seen this?", frequency counts, group-by canonical key.
CORE: trade O(n) space for O(1) lookups; normalize keys (sorted signature for anagrams).
PROBLEMS: LC 1 Two Sum, LC 49 Group Anagrams, LC 128 Longest Consecutive Sequence.
COMPLEXITY: O(n) time, O(n) space.
TRAP: LC 128 - scan only from sequence starts (x-1 not in set), not from every element.

## Family: Stacks and Queues
### 7. Matching / Expression Stack
CUE: brackets, undo, evaluate postfix/infix expressions.
CORE: push unresolved tokens; pop when the current token resolves an earlier one.
PROBLEMS: LC 20 Valid Parentheses, LC 150 Evaluate RPN, LC 227 Basic Calculator II.
COMPLEXITY: O(n) time, O(n) space.
TRAP: operator precedence - apply * and / immediately, defer + and - with a sign.

### 8. Monotonic Stack
CUE: "next greater/smaller element", histogram, stock span, visible buildings.
CORE: keep the stack sorted by value; pop everything smaller when a new element arrives. Each index pushed once.
PROBLEMS: LC 739 Daily Temperatures, LC 496 Next Greater Element, LC 84 Largest Rectangle.
COMPLEXITY: O(n) time, O(n) space.
TRAP: store indices, not values; wrong strictness (< vs <=) with duplicates.

### 9. Monotonic Deque
CUE: max/min of every sliding window.
CORE: deque of indices with decreasing values; pop front when expired, pop back when smaller.
PROBLEMS: LC 239 Sliding Window Maximum, LC 1438 Longest Continuous Subarray With Abs Diff.
COMPLEXITY: O(n) time, O(k) space.
TRAP: leaving expired indices at the front.

### 10. Queue/Stack via Design
CUE: "implement X using Y", recent-counter, circular buffer.
CORE: amortized transfer between two stacks only when the out-stack is empty.
PROBLEMS: LC 232 My Queue, LC 225 My Stack, LC 933 Recent Calls.
COMPLEXITY: amortized O(1).
TRAP: shuffling elements on every operation instead of on empty.

## Family: Binary Search
### 11. Boundary Binary Search
CUE: sorted input + "first/last index where predicate true".
CORE: keep the invariant that the answer lies in [lo, hi]; shrink strictly every branch.
PROBLEMS: LC 704 Binary Search, LC 34 First and Last Position, LC 35 Search Insert.
COMPLEXITY: O(log n) time, O(1) space.
TRAP: mixing templates (< vs <=) causes infinite loops; overflow with (lo+hi)/2 in Java/C++.

### 12. Rotated Array Search
CUE: sorted-then-rotated; find min or target.
CORE: one half is always sorted - identify it, then check whether the target lies inside it.
PROBLEMS: LC 33 Search in Rotated Array, LC 153 Find Minimum, LC 81 with duplicates.
COMPLEXITY: O(log n) time, O(1) space.
TRAP: duplicates (LC 81) need lo++/hi-- shrink.

### 13. Binary Search on Answer
CUE: "minimize the maximum / maximize the minimum", answer range up to 10^9.
CORE: a monotone feasibility predicate; binary-search the answer space, greedy O(n) check per candidate.
PROBLEMS: LC 875 Koko Eating Bananas, LC 1011 Capacity to Ship, LC 410 Split Array Largest.
COMPLEXITY: O(n log R) time, O(1) space.
TRAP: bad bounds (lo = max(nums), hi = sum(nums)) and ceiling division errors.

## Family: Graphs and Grids
### 14. Grid Flood Fill (BFS/DFS)
CUE: islands, regions, connected cells.
CORE: 4-directional traversal with visited marking.
PROBLEMS: LC 200 Number of Islands, LC 733 Flood Fill, LC 695 Max Area of Island.
COMPLEXITY: O(mn) time and space.
TRAP: enqueueing without marking visited - duplicates blow the queue.

### 15. Shortest Path BFS
CUE: unweighted graph + "minimum steps/moves/turns".
CORE: BFS explores in level order; the first time you reach the target is optimal.
PROBLEMS: LC 127 Word Ladder, LC 752 Open the Lock, LC 365 Water Jug.
COMPLEXITY: O(V+E) time, O(V) space.
TRAP: incomplete neighbor generation (all 8 lock dials, all 26 letters).

### 16. Multi-Source BFS
CUE: distance from ALL gates/zeros/rotten oranges simultaneously.
CORE: seed the queue with every source at time 0; one sweep.
PROBLEMS: LC 542 01 Matrix, LC 1162 As Far From Land, LC 994 Rotting Oranges.
COMPLEXITY: O(mn) time and space.
TRAP: BFS from each cell separately - O((mn)^2) disaster.

### 17. Subsets Backtracking
CUE: "all combinations/subsets/power set".
CORE: include/exclude each element, or iterate from index i; copy the path at every node (subsets) or leaf (combinations).
PROBLEMS: LC 78 Subsets, LC 90 Subsets II, LC 39 Combination Sum.
COMPLEXITY: O(2^n * n) time, O(n) space.
TRAP: Subsets II duplicates - sort, then skip equal siblings at the same level.

### 18. Permutations Backtracking
CUE: "all arrangements", order matters.
CORE: used[] array (or swap-in-place), recurse, undo.
PROBLEMS: LC 46 Permutations, LC 47 Permutations II, LC 77 Combinations.
COMPLEXITY: O(n * n!) time, O(n) space.
TRAP: forgetting to unset used[] after the recursive call.

### 19. Grid/String DFS with Pruning
CUE: word search, palindrome partitioning, board + dictionary.
CORE: recurse cell by cell; prune when no trie prefix survives; restore state on exit.
PROBLEMS: LC 79 Word Search, LC 212 Word Search II, LC 131 Palindrome Partitioning.
COMPLEXITY: O(mn * 4^L) worst case.
TRAP: not unmarking the visited cell after recursion; no trie in LC 212 = TLE.

### 20. Topological Sort (Kahn's)
CUE: prerequisites, "valid ordering", build/install order.
CORE: repeatedly emit indegree-0 nodes and decrement successors. If emitted count < V, there is a cycle.
PROBLEMS: LC 207 Course Schedule, LC 210 Course Schedule II, LC 269 Alien Dictionary.
COMPLEXITY: O(V+E) time, O(V) space.
TRAP: inverted edge direction ([a,b] means b before a).

### 21. Union-Find
CUE: dynamic connectivity, counting components, redundant edge, merging accounts.
CORE: parent array + find with path compression + union by rank; decrement component count on successful merges.
PROBLEMS: LC 547 Friend Circles, LC 684 Redundant Connection, LC 721 Accounts Merge.
COMPLEXITY: near O(1) amortized per op.
TRAP: skipping path compression/rank - degenerates to O(n) chains.

## Family: Heaps and Ordering
### 22. Top-K Heap
CUE: "kth largest / k closest / k most frequent".
CORE: maintain a size-k MIN-heap when hunting the k largest; the root is the answer.
PROBLEMS: LC 215 Kth Largest, LC 347 Top K Frequent, LC 973 K Closest Points.
COMPLEXITY: O(n log k) time, O(k) space.
TRAP: wrong heap orientation - k largest needs a min-heap.

### 23. Two Heaps
CUE: running median, streaming quantiles.
CORE: max-heap for the lower half, min-heap for the upper; rebalance so sizes differ by at most 1.
PROBLEMS: LC 295 Find Median from Stream, LC 502 IPO, LC 480 Sliding Median.
COMPLEXITY: O(log n) insert, O(1) median.
TRAP: skipping the push-move-rebalance rotation.

### 24. K-Way Merge
CUE: k sorted lists/files/streams merged into one.
CORE: heap holds one cursor per source; pop the min, push that source's next element.
PROBLEMS: LC 23 Merge k Lists, LC 373 K Pairs Smallest Sums, LC 632 Smallest Range.
COMPLEXITY: O(N log k) time, O(k) space.
TRAP: heap tuples need a tiebreaker index or comparisons crash.

## Family: Intervals and Greedy
### 25. Merge/Insert Intervals
CUE: [start, end] pairs + merge/consolidate/insert.
CORE: sort by start; overlap iff cur.start <= last.end; extend with max().
PROBLEMS: LC 56 Merge Intervals, LC 57 Insert Interval, LC 452 Minimum Arrows.
COMPLEXITY: O(n log n) time.
TRAP: assigning last.end = end instead of max(last.end, end) - contained intervals truncate silently.

### 26. Activity Selection Greedy
CUE: "minimum removals / maximum compatible meetings".
CORE: sort by END time; greedily keep the earliest-finishing compatible interval.
PROBLEMS: LC 435 Non-overlapping Intervals, LC 452, LC 252 Meeting Rooms.
COMPLEXITY: O(n log n) time.
TRAP: sorting by start (merge-intervals reflex) gives wrong answers.

### 27. Min Rooms / Sweep Line
CUE: "how many rooms/resources are needed concurrently?"
CORE: min-heap of end times, or +1/-1 event sweep (end processed before start on ties).
PROBLEMS: LC 253 Meeting Rooms II, LC 1094 Car Pooling, LC 1851.
COMPLEXITY: O(n log n) time.
TRAP: tie-breaking - back-to-back meetings need the room freed first.

### 28. Jump-Game Greedy
CUE: maximize reach with local choices.
CORE: track the farthest reachable index; justify with an exchange argument.
PROBLEMS: LC 55 Jump Game, LC 45 Jump Game II, LC 406 Queue Reconstruction.
COMPLEXITY: O(n) time, O(1) space.
TRAP: asserting greedy without being able to say why it is safe.

## Family: Dynamic Programming
### 29. 1D Linear DP
CUE: dp[i] depends on dp[i-1], dp[i-2]; take-or-skip per index.
CORE: define the state precisely, roll two variables.
PROBLEMS: LC 70 Climbing Stairs, LC 198 House Robber, LC 91 Decode Ways.
COMPLEXITY: O(n) time, O(1) space.
TRAP: reaching for greedy on House Robber; botched base cases.

### 30. 2D Grid DP
CUE: paths through a grid, min path sum, obstacles.
CORE: dp[i][j] = f(up, left).
PROBLEMS: LC 62 Unique Paths, LC 64 Min Path Sum, LC 63 with obstacles.
COMPLEXITY: O(mn) time, O(n) rolled space.
TRAP: first row/column initialization when obstacles block them.

### 31. 0/1 Knapsack
CUE: pick each item at most once to hit a capacity/target; "partition into equal subsets".
CORE: dp[w] over items, iterate capacity BACKWARD.
PROBLEMS: LC 416 Partition Equal Subset, LC 494 Target Sum, LC 1049 Last Stone Weight.
COMPLEXITY: O(n*S) time, O(S) space.
TRAP: forward capacity loop lets one item be used twice.

### 32. Unbounded Knapsack
CUE: items reusable - coins making an amount, ribbon cutting.
CORE: dp[a] = best(dp[a - coin]); forward iteration permits reuse.
PROBLEMS: LC 322 Coin Change, LC 518 Coin Change II, LC 279 Perfect Squares.
COMPLEXITY: O(A * coins) time, O(A) space.
TRAP: loop order decides combinations vs permutations (518 vs 377).

### 33. LCS Family (two sequences)
CUE: two strings/arrays + longest common / edit operations.
CORE: dp over prefixes; match moves diagonally, else take max of top/left.
PROBLEMS: LC 1143 LCS, LC 72 Edit Distance, LC 718 Repeating Subarray.
COMPLEXITY: O(mn) time, O(min(m,n)) space.
TRAP: LCS vs Edit Distance transitions (2 moves vs 3 moves on mismatch).

### 34. String Segmentation DP
CUE: "can the string be segmented", palindromic substrings.
CORE: dp[i] over prefixes; check every dictionary word / palindrome ending at i.
PROBLEMS: LC 139 Word Break, LC 5 Longest Palindromic Substring, LC 647 Palindromic Substrings.
COMPLEXITY: O(n^2) time.
TRAP: substring slicing inside loops - hidden O(n^3); Decode Ways treats '0' as standalone.

### 35. Longest Increasing Subsequence
CUE: longest increasing chain, nesting envelopes, chains.
CORE: O(n^2) dp ending at i, or tails array + binary search for O(n log n).
PROBLEMS: LC 300 LIS, LC 354 Russian Doll Envelopes, LC 646 Longest Pair Chain.
COMPLEXITY: O(n log n) achievable.
TRAP: assuming tails[] is the actual subsequence - it only has the right length.

## Family: Specialized
### 36. Bit Manipulation
CUE: "every element appears twice except one", XOR tricks, bit counting.
CORE: XOR cancels pairs; n & (n-1) clears the lowest set bit.
PROBLEMS: LC 136 Single Number, LC 191 Hamming Weight, LC 338 Counting Bits.
COMPLEXITY: O(n) time, O(1) space.
TRAP: arithmetic right shift on negatives in Java/C++ (use unsigned shift).

### 37. Trie
CUE: prefix queries, autocomplete, wildcard dictionary, board + word list.
CORE: shared-prefix nodes; isWord flag separates word-end from mere prefix.
PROBLEMS: LC 208 Implement Trie, LC 211 Wildcard Matching, LC 212 Word Search II.
COMPLEXITY: O(L) per operation.
TRAP: conflating search vs startsWith semantics.

### 38. Linked List In-Place Rewiring
CUE: reverse/reorder/rotate a list with O(1) space mandated.
CORE: save next, redirect current, advance prev/curr; dummy head simplifies head mutations.
PROBLEMS: LC 206 Reverse List, LC 92 Reverse II, LC 143 Reorder List, LC 21 Merge Two Lists.
COMPLEXITY: O(n) time, O(1) space.
TRAP: overwriting .next before saving it.

### 39. Matrix Simulation
CUE: spiral order, rotate image in place, set zeroes.
CORE: maintain converging layer boundaries; rotation = transpose + reverse rows.
PROBLEMS: LC 54 Spiral Matrix, LC 48 Rotate Image, LC 73 Set Matrix Zeroes.
COMPLEXITY: O(mn) time.
TRAP: boundary drift when one row/column remains.

### 40. Cyclic Sort
CUE: values form a dense range 1..n + find missing/duplicate in O(1) space.
CORE: swap each value to its home index; scan for mismatches.
PROBLEMS: LC 268 Missing Number, LC 448 Find Disappeared, LC 41 First Missing Positive.
COMPLEXITY: O(n) time, O(1) space.
TRAP: incrementing i after a swap - the newly arrived value is unchecked; compare before swapping to avoid infinite loops on duplicates.

## The 60-second recognition drill
Once a week, pick 5 unseen problems. For each, spend 60 seconds MAX writing: pattern name, the cue that triggered it, and complexity. No coding. This is the exact skill the interview tests first.

## Litmus tests worth memorizing
- "Do I need the middle elements?" If no, two pointers; if yes, sliding window.
- "Can I sort without losing information?" If yes, sort first and re-examine.
- Negatives present? Sliding window breaks - think prefix sum + hashmap.
- "Minimize the max / maximize the min"? Binary search on answer.
- Constraints under 20? Backtracking or bitmask is intended.

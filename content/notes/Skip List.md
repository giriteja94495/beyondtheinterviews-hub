---
categories:
  - Engineering
topics:
  - distributed systems
sources:
updated: 2026-09-14
---
The Skip List data structure isn't very common it's not something we usually come across while learning or solving problems. What motivated me to learn about it was its usage in HNSW-based indexing for finding top-k nearest neighbours, and in indexing for vector databases, etc.

## Drawbacks of Linked lists

Linked Lists are dynamic data structures that store values in non-contiguous memory called nodes. Each node refers to the other using memory pointers. 

Linked lists are wonderful data structures that let us build without needing to estimate how much memory will be needed upfront. 

Arrays let us randomly access any element quickly, but insertion and deletion is slow because elements need to shift to make room or close the gap.

And Linked List came in to solve the weakness of arrays - Linked lists make inserting and deleting fast once we have reached the right spot, but getting to that spot is slow because there's no random access.

Drawbacks of general linked lists:

- Hard to search in less than O(n) time (binary search doesn't work, e.g.)
- Hard to jump to the middle

This is where skip lists come into the picture, as they try to resolve this drawback in Linked List and bring the search time down to O(log N). 

## Skip List Data Structure

Skip lists are a probabilistic data structure constructed from several layers of linked lists. It is called as probabilistic data structure because it uses random coin flips to build itself. 

The bottom layer is just a regular sorted linked list connecting an ordered sequence of elements. 

Each new layer above removes some elements from the underlying layer (based on a fixed probability), producing a sparser version of the layer below.

The diagram below shows a skip list.

![[skip-list.png]]

## How Search works in a Skip List

The search begins at the top layer and moves horizontally along its linked list. If the target element is found there, the search stops immediately  and returns, this is exactly why the sparse top layer is useful: finding the element early, at a sparser level, means fewer nodes had to be checked, keeping the time complexity low.

Searching in a skip list happens like this:

When searching for k:

- If k = key, done!
- If k < next key, go down a level.
- If k ≥ next key, go right.

This is what gives skip lists their efficiency: Skip lists offer O(log n) average complexity for both search and insertion/deletion.

Example : Finding 70.

![[search-node-skiplist.png]]

Here's also an explainer animated video, it'll help you understand this even better.

![[search-in-skiplist.mov]]

## How Insertion works in a Skip List

To insert a new key, we first need to find where it should go in the bottom layer of linked list and for this, we just reuse the same search logic we used before. As we apply the search logic and traverse we reach at a position in bottom list where we can’t go more to the right, and thats where we insert the new value on the right side of that position

While doing this search, we keep track of the last node visited at each level before as these are the predecessor nodes that'll point to our new node once inserted.

Once we insert the element in Level 0, how do we decide if it should be inserted in other levels or no ? 

The answer is that we flip a fair coin (p = 1/2) to decide if the node should be promoted one level up, or not. HEADS promotes it one level higher; TAILS stops the promotion. So HEADS then TAILS means the node reaches Level 1. This coin-flip decides the height randomly, which is why skip lists are called probabilistic

Example : Inserting 67 
![[insert-node-skiplist.png]]

![[inserting-in-skiplist.mov]]

## How Deletion works in Skip List 

Deletion operation in Skip List is pretty straightforward. We first perform search operation to find the location of the node. If we find the node, we simply delete it at all levels. Before deleting a node, we keep track of its predecessor at each level, so we can later point that predecessor directly to whatever comes after the deleted node


Delete 70 example : 
![[delete-node-skiplist.png]]

Delete 31 example : 

![[delete-in-skiplist.mov]]


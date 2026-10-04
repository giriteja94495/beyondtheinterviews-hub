---
categories:
  - Engineering
topics:
  - distributed systems
sources:
updated: 2026-02-26
---
A bad database index is worse than no index.  
  
Database indexing can be expensive if not done the right way.  
  
here are some best practices to follow :  
  
- add indexes based on actual query patterns, especially columns used in filters, joins, and sorting  

- use `explain analyze` before adding an index to understand the query path, and after adding it to confirm the database is using the right index properly.  
  
- indexes can slow down writes, because every insert, update, and delete may now need to change in both the original table and the related indexes table. So avoid adding unnecessary indexes.  
  
- avoid indexing huge fields like large text columns, because that can make the index bulky, slower, and more expensive to maintain  
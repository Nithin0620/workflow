## 2024-05-14 - Batching Prisma Issue Counts in Sprint Actions
**Learning:** In Prisma, calling `model.count()` multiple times in sequence with different `where` clauses causes N+1 (or 1+1) synchronous queries. The standard user directive says: always look for optimization opportunities such as adding necessary indexes in the schema and using aggregations (e.g., groupBy) instead of multiple sequential counting queries.
**Action:** Used `prisma.issue.groupBy` to get multiple counts with one roundtrip instead of doing consecutive `.count()` queries.

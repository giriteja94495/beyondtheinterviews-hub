---
categories:
  - Engineering
topics:
  - distributed systems
sources:
  - article
updated: 2026-06-16
---
TIL: Medallion Architecture is a layered way to organize data pipelines so data quality improves step by step.

## What is Medallion Architecture?

It is a pattern where data moves through 3 layers:

- **Bronze**: raw ingested data
- **Silver**: cleaned and validated data
- **Gold**: business-ready aggregated data

Simple idea: do not jump directly from raw to dashboards. First keep raw, then clean, then model for analytics.

## Bronze layer (raw)

Bronze stores source data as-is with minimal transformation.

Typical characteristics:

- append-only ingestion
- full raw records
- useful for reprocessing and audit/debug

Think of this as your "ground truth landing zone."

Small example (Bronze):

```
order_id=101, user_id=42, amount="1999", created_at="2026-06-16T10:11:12Z", source="mobile-app"order_id=101, user_id=42, amount="1999", created_at="2026-06-16T10:11:12Z", source="mobile-app"  (duplicate)
```

## Silver layer (refined)

Silver is where data quality improvements happen.

Typical operations:

- schema enforcement and normalization
- deduplication
- null handling and basic validations
- join/reference fixes

At this stage, data is trustworthy enough for most internal analytics and feature prep.

Small example (Silver):

```
order_id=101, user_id=42, amount=1999.00, created_date=2026-06-16, channel="mobile"
```

- duplicate removed
- amount converted to numeric type
- timestamp normalized to a standard date/time format

## Gold layer (curated/business)

Gold is optimized for consumption by BI tools, reports, and product metrics.

Typical operations:

- aggregations (daily, weekly, monthly)
- dimensional/star style modeling
- KPI-ready tables (for example: revenue by region, retention cohorts)

Gold should be stable, easy to query, and aligned with business definitions.

Small example (Gold):

```
date=2026-06-16, channel="mobile", total_orders=12450, total_revenue=24500000
```

This is now directly usable in dashboards/KPI reporting.

## Why this model works well

- easier debugging (you can inspect each stage)
- safer transformations (quality gates between layers)
- reusability (many gold datasets can reuse same silver data)
- better governance and lineage

## Quick mental model

```
Raw events/files -> Bronze -> Silver -> Gold -> BI/ML/Apps
```

That is the core of Bronze/Silver/Gold in data engineering.
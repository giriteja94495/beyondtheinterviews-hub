---
categories:
  - Engineering
topics:
  - distributed systems
sources:
updated: 2026-01-31
---
Simplest explanation of the 3 confusing terms in SRE :

Imagine we run a food delivery app like Zomato or Swiggy.

- **SLI** = How we measure delivery performance (Is the order reaching on time?)
- **SLO** = Our internal target (95% of orders should be delivered within 30 minutes)
- **SLA** = Our promise to customers (99% of orders will be delivered within 45 minutes, or money back)

## Ez explanation

- **SLI (Service Level Indicator)** : The actual measurement like API success rate, page load time etc. We dont set this, we measure it, this is the actual performance of the service, and our reality.

- **SLO (Service Level Objective)** : Our internal goal like "99.9% of API requests should succeed". More like what we want our SLI to be.
	-  Gives an error budget (how many times/how much time we can mess up): if SLO is 99.9%, you can be down for ~43 min/month

- **SLA (Service Level Agreement)** : Legal promise to customers with consequences.
    - "99.9% uptime or you get credits"
    - Always we should set stricter SLO than SLA (because if our SLO == SLA, then we might not meet the SLA)


So more like this :
- We design for SLO.
- We commit to SLA.
- We audit both using SLI.
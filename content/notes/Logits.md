---
categories:
  - Engineering
topics:
  - ai
sources:
  - article
updated: 2026-09-26
---
Given a probability p, which ranges from 0 to 1, the corresponding odds can also be calculated as : 

$$
\text{odds} = \frac{p}{1-p}
$$

meaning, 
- if p > 0.5 , then the odds are greater than 1 , so success is more likely. for example consider p = 0.75,  then the odds are 3 meaning you have a 3:1 favour so success is more likely. 
- if p = 0.5 then odds = 1, meaning there is a equal chance of success and failure. 
- if p < 0.5, then odds are less than 1, so success is less likely

The logit function is simply the logarithm of the odds:

$$
\text{z} = \text{logit}(p) = \log\left(\frac{p}{1-p}\right)
$$

![[logits.png]]

This transformation maps probabilities (0,1) to the entire real number range (−∞,∞).
The value of the logit function heads towards infinity as _p_ approaches 1 and towards negative infinity as it approaches 0.


It is heavily used in Logistic regression models, where the raw outputs / predictions (which are in an unconstrained range) need to be converted into probabilities. So we consider the raw output of the logistic regression model as the logit.

So how do we convert this into a probability? That's where [[Sigmoid activation function]] comes in,  it's the inverse of the logit function, and it maps that unconstrained logit back into the valid 0–1 probability range.







---
categories:
  - Engineering
topics:
  - ai
sources:
  - article
updated: 2026-09-26
---
The sigmoid function is basically just the inverse of [[Logits]]. 
The sigmoid function maps arbitrary real values back to the range [0, 1]. The larger the value, the closer to 1 you’ll get. 

From the above, we can derive:

$$
\text{logit}(p) = \log\left(\frac{p}{1-p}\right)
$$

$$
e^{\text{logit}} = \frac{p}{1-p}
$$

$$
e^{-\text{logit}} = \frac{1-p}{p}
$$

$$
e^{-\text{logit}} = \frac{1}{p} - \frac{p}{p} = \frac{1}{p} - 1
$$

$$
\frac{1}{p} = 1 + e^{-\text{logit}}
$$

$$
p = \frac{1}{1 + e^{-\text{logit}}}
$$

$$
p = \sigma(\text{z}) = \sigma(\text{logit}) = \frac{1}{1+e^{-\text{logit}}} = \frac{1}{1+e^{-z}}
$$

where σσ is the sigmoid function.

![[sigmoid.png]]

This is exactly what happens at the end of classification process like Logistic regression. 

There are other functions that map probabilities to reals (and vice-versa), so what’s so special about the logit and sigmoid? the gradients of the logit and sigmoid are simple to calculate. The reason why this is important is that many optimization and machine learning techniques make use of gradients, for example when estimating parameters for a neural network. 

The biggest drawback of the sigmoid function for many analytics practitioners is the so-called vanishing problem. 

this problem pertains not only to the sigmoid function, but any function that squeezes real values to the [0, 1] range. In neural networks, this [[Vanishing Gradient]] is often a problem. So you can find some alternatives. 




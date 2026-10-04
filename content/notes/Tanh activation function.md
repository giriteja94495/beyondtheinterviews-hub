---
categories:
  - Engineering
topics:
  - ai
sources:
  - article
updated: 2026-09-27
---
Tanh is hyperbolic tangent which is

$$
\tanh(z) = \frac{e^{z}-e^{-z}}{e^{z}+e^{-z}}
$$

![[tanh.png]]

Same S-shape as sigmoid, but notice the range: -1 to 1, not 0 to 1.

So it squashes number in any real range (- inf, inf) to (-1, 1) 

Its derivative is :

$$
\tanh'(z) = 1 - \tanh(z)^2
$$

![[tanh decay.png]]

Like the sigmoid neuron, its activation also saturates hence causing [[Vanishing Gradient]] .
but by $z=4$, the derivative has dropped to about 0.0013; by $z=6$, it's around 0.0000246 and then essentially zero, just like sigmoid. 

---------------------------- 

this peaks at 1.0 (at $z=0$) instead of [[Sigmoid activation function]] 0.25. 
So this has approx 4x stronger gradient right at the center. 

How is this centering around 0 useful ? 
weights tend to explore both positive and negative territory more naturally, rather than being biased in one direction from the start. As tanh is centered around 0. 

How is the derivative being 1 at z = 0 useful ? 
Because it means in the best case, a tanh layer doesn't shrink the gradient at all, and hence this decay happens slowly, means it learns faster. 

As you can see from the graph below, it shows how sigmoid and tanh decays for the same z. 

![[tanh vs sigmoid.png]]


Also note that the tanh neuron is simply a rescaled and shifted sigmoid, in particular the following holds: 
$$
\tanh(x) = 2\sigma(2x) - 1
$$

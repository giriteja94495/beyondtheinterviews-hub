---
categories:
  - Engineering
topics:
  - ai
sources:
  - article
updated: 2026-09-26
---
This is a very common problem when dealing with neural networks. 

When dealing with [[Sigmoid activation function]] activation function, one of the drawbacks is that it has vanishing gradient effect. 

As we all know when a neural netowork learns, it works backwards (backward propagation) from output to input layer by layer. And during its backward propagation it learns the weights, parameters etc. based on the loss / gradient right. 


**Derivative of the [[Logits]] function:**  

$$
\text{logit}(p) = \log\left(\frac{p}{1-p}\right) = \log(p) - \log(1-p)
$$

Differentiating term by term:  

$$
\frac{d}{dp}\,\text{logit}(p) = \frac{1}{p} + \frac{1}{1-p} = \frac{(1-p) + p}{p(1-p)} = \frac{1}{p(1-p)}
$$

**Derivative of the sigmoid function:**  

$$
p =\sigma(z) = \frac{1}{1+e^{-z}} \quad \Rightarrow \quad \sigma'(z) = \sigma(z)\big(1-\sigma(z)\big)
$$
Since $\sigma(z) = p$, we can write this more simply as:

$$
\sigma'(z) = p(1-p)
$$

As, we found:  

$$
\frac{d}{dp}\,\text{logit}(p) = \frac{1}{p(1-p)}
$$

Compare that to what we just got:  

$$
\sigma'(z) = p(1-p)
$$

These two are exact reciprocals of each other one is $p(1-p)$, the other is $\frac{1}{p(1-p)}$. This isn't a coincidence, and it isn't specific to logit and sigmoid, it's a general calculus rule that applies to any pair of inverse functions.

Now, when backprop works its way back to a weight $w$, it's not computing $\frac{\partial L}{\partial w}$ directly in one shot it breaks it apart using the chain rule, since $w$ affects the loss only through a chain of intermediate steps ($w \to z \to p \to L$) because :

- $w$ changes → this changes $z$ (since $z = wx+b$)
- $z$ changes → this changes $p$ (since $p = \sigma(z)$)
- $p$ changes → this changes $L$ (since $L$ is computed from $p$)

$$
\frac{\partial L}{\partial w} = \underbrace{\frac{\partial L}{\partial p}}_{\text{loss w.r.t. prediction}} \cdot \underbrace{\frac{\partial p}{\partial z}}_{\text{sigmoid's derivative}} \cdot \underbrace{\frac{\partial z}{\partial w}}_{\text{= }x}
$$
The middle term $\frac{\partial p}{\partial z} = p(1-p)$, the sigmoid's derivative is the one we need to look closely at, because it's the piece that misbehaves.

### Plotting it out

Let's compute $p(1-p)$ at a few points along $z$ (the logit) and see what happens:

| $z$ | $p=\sigma(z)$ | $\sigma'(z)=p(1-p)$ |
| --- | ------------- | ------------------- |
| 0   | 0.500         | 0.250               |
| 1   | 0.731         | 0.197               |
| 2   | 0.881         | 0.105               |
| 3   | 0.953         | 0.045               |
| 4   | 0.982         | 0.018               |
| 6   | 0.998         | 0.002               |
|     |               |                     |

![[saturation - vanishing g.png]]

Look at the shape: it peaks at just **0.25** at $z=0$, and rapidly flattens toward **0** as $z$ moves toward either $-6$ or $+6$. 

This curve above shows the behavior of a single neuron, at a single layer. It tells that if this neuron's logit is far from 0 (i.e., around -6, 6 or more), then its local gradient is tiny. hence this is called saturation.

As the number of layers increase,  say if there are 10 layers then : 

$$
0.25 \times 0.25 \times 0.25 \times 0.25 \times 0.25 \approx 0.00098
$$


![[vanishing gradient.png]]

**Vanishing gradient** is what happens when you chain many of these together across depth. Backprop multiplies the local gradients of every layer together as it works backward. So that network stops learning, or learns extremely slowly. 


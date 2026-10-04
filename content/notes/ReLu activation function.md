---
categories:
  - Engineering
topics:
  - ai
sources:
  - article
updated: 2026-09-27
---
ReLu is called as the Rectified Linear Unit. 

Just like [[Sigmoid activation function]] and [[Tanh activation function]], ReLU takes the raw logit $z = wx+b$ and transforms it into something else. But unlike those two, it doesn't squash anything into a bounded range.

$$
\text{ReLU}(z) = \max(0, z)
$$
- if z < 0 : then output is 0 
- elif z > 0 : output is z

![[relu.png]]

Since ReLU is defined piecewise, we differentiate each piece separately.

For $z < 0$: the function is just the constant $0$. The derivative of a constant is always $0$.  

$$
\text{ReLU}'(z) = 0 \quad \text{for } z<0
$$

For $z > 0$: the function is $\text{ReLU}(z) = z$. The derivative of $z$ with respect to $z$ is $1$.  

$$
\text{ReLU}'(z) = 1 \quad \text{for } z>0
$$
at z = 0 Relu is not defined, and so derivative also will be undefined. Hence there will be a sharp jump from 0 to 1 in the derivative graph. 

![[relu derivative.png]]


So the derivative is either 0, or 1. 
The advantages of this is that : 

- There wont be any [[Vanishing Gradient]] effect. 
- So when backprop is happening we are multiplying repeatedly with 1s, so learning is faster as it descends quickly in the gradient descent process.
- It is cheap to compute as computers are super fast at handling 0s and 1s, instead of computing $e^{-z}$ or $e^z$ for every neuron like how Tanh and Sigmoid does. 

One drawback of this activation function is that : 

Once $z<0$ for everything, $\text{ReLU}'(z) = 0$. Now look at the chain again:

$$
\frac{\partial L}{\partial w} = \frac{\partial L}{\partial a}\cdot\underbrace{\frac{\partial a}{\partial z}}_{=\,0}\cdot\frac{\partial z}{\partial w} = 0
$$

The gradient itself is 0. So the weights never get updated, irrespective of the learning rate $\eta$ . So learning never happens

$$
w_{\text{new}} = w_{\text{old}} - \eta \times 0 = w_{\text{old}}
$$

### The clean summary of what you figured out

$$
\text{High } \eta \;\longrightarrow\; \text{large -ve } w \;\longrightarrow\; z<0 \text{ for all inputs} \;\longrightarrow\; \frac{\partial a}{\partial z}=0 \;\longrightarrow\; \frac{\partial L}{\partial w}=0
$$


This problem is also called as the Dying Relu Problem. But with a proper setting of the learning rate this is less frequently an issue.

Thats why Leaky ReLu was introduced.
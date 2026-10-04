---
categories:
  - Engineering
topics:
  - ai
sources:
  - article
updated: 2026-10-01
---
Training a neural network means repeatedly computing gradients and updating weights, batch by batch, until the loss converges. 

But there are some problems : 
- Training takes too long (too much _data_ to process on one GPU in reasonable time)  
- The model itself doesn't fit in one GPU's memory at all

## Why does memory run out in the first place 

While training, a GPU has to simultaneously hold several things in memory, all at once:

- **Model parameters** : the learnable weights of the model
- **Optimizer states** : Optimizer states are extra values an optimizer keeps around to do its job, and exactly what gets stored depends on which optimizer is used. AdamW, for example, tracks first and second momentum estimates per parameter, on top of the parameters themselves.
- **Model activations** : intermediate values from the forward pass, kept around because backpropagation needs them to compute gradients. 
- **Gradients** : stored for each parameter of the model, same memory footprint as the model parameters.
- **Input data** : the current batch being processed, the memory footprint depends on the size and type of data being modeled. 

So if the total memory of all these things add up to be more than the GPU memory then thats when we see the "CUDA out of memory" exception. 

Now the question becomes what if a smaller batch size can be used to reduce memory. 
But it comes with a trade off. Batch size affects 2 different things. It is talked about in this paper [An Empirical Model of Large-Batch Training](https://arxiv.org/pdf/1812.06162)

- Smaller Batches → Cheaper to compute and is fast, but the gradient estimate becomes noisier (not reliable), and it would need more steps to reach a good result. 
- Larger Batches → gives a smoother, more accurate gradient estimate, but costs more memory and compute per step. 

![[batch-size vs memory.png]]

There are some tricks that can reduce how much memory training uses on a single GPU. But these tricks have limits and only come up to a certain point, and they usually come with a catch: saving memory often means doing more computation instead. 

So the only way to scale the neural network is by using multiple GPUs to our advantage. 

There are three main ways to split up model training so it can run across multiple machines : 

- [[Distributed Data Parallelism]]
- [[Model parallelism]]
- Fully Sharded Data Parallelism

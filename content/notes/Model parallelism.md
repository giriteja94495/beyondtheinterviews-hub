---
categories:
  - Engineering
topics:
  - ai
sources:
  - article
updated: 2026-10-02
---
We saw the 2 problems in scaling neural networks in this [[Strategies for scaling neural networks across multiple GPUs | post]]

[[Distributed Data Parallelism]] solves scaling when data is the bottleneck, but it assumes the whole model fits on one GPU. 

But what if the model itself is too big to fit ? 

Thats where Model Parallelism comes in. 

For scenarios where the model is too large to fit on a single GPU, we need model parallelism to distribute the parameters across multiple GPU devices. 

There are 2 main ways the models can be distributed : 

- we can either distribute the various layers / blocks across different GPUs (**pipeline parallelism**) eg : GPU-1 has layers 1–5, GPU-2 has layers 6-10, data flows sequentially through GPUs, one layer's output feeds the next GPU.

- split individual layers themselves across GPUs (**tensor parallelism**) meaning instead of dividing the neural network by layer (horizontally), you divide the tensors themselves (vertically). E.g., GPU-1 has half the weight matrix of _one_ layer, GPU-2 has the other half of the same layer, both GPUs work on the same layer simultaneously, each computing a slice of the weight matrix. 

Note Model Parallelism doesn't imply that the training happens in parallel!
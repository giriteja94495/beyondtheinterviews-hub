---
categories:
  - Engineering
topics:
  - ai
sources:
  - article
updated: 2026-10-02
---
Distributed Data Parallelism (DDP) is one of the strategy to Scale Neural Network Training Across Multiple GPUs. 

We saw the 2 problems in scaling neural networks in this [[Strategies for scaling neural networks across multiple GPUs | post]]

Distributed Data Parallelism solves scaling when data is the bottleneck,

The core idea is simple: we want to process larger batches of data by spreading the work across multiple GPUs. 

In practice, replicate the entire neural network model on each GPU, split the data batch across GPUs, and synchronize gradients.

The steps go like this : 
- Split the training dataset into batches. 
- Divide that batch data into equal shards (one per GPU). Each shard data is a subset of that particular batch data, together they cover the full batch.
- Define one neural network (architecture + initial weights)
- Copy that neural network to every GPU so each has the same weights at the start of training
- Place each data shard on different GPUs (Batch 0 → GPU 0, Batch 1 → GPU 1, …).
- All GPUs run forward pass at the same time on their respective shard data. Each gets its own loss / activations. 
- All GPUs run backward at the same time. Each computes local gradients from its shard (different data → usually different local grads).
- Gradient synchronization happens between the GPUs to exchange and combine gradients across GPUs (sum, then often average). After this, every GPU holds the same full gradient for all weights. 
- Weight update happens in parallel → Every GPU applies the same optimizer step with those same gradients. All model copies stay identical. 
- Load the next batch, split across GPUs, and repeat from step 5

![[distributed data parallel.mov]]

To keep the gradients synchronized in data parallel training, **all-reduce** communication primitive is used. 

Core Pytorch libraries / modules for implementing DDP 
```python
from torch.utils.data.distributed import DistributedSampler
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.distributed import init_process_group, destroy_process_group
```

- **`DistributedSampler`** (from `torch.utils.data.distributed`) is used to split the dataset so each GPU process gets its own unique set of rows, with no overlap between GPUs.

```python
DataLoader(dataset, batch_size=2, sampler=DistributedSampler(dataset))
```

- **`DistributedDataParallel`** (from `torch.nn.parallel`, imported as `DDP`)  `DDP` wraps your model so that gradients computed on each GPU get automatically synced and averaged across all GPUs during training.

```python
model = DDP(model, device_ids=[rank])
```

- **`init_process_group` and `destroy_process_group`** (from `torch.distributed`) `init_process_group` sets up the communication link between all GPU processes at the start of training, so they can talk to each other. `destroy_process_group` closes that link cleanly at the end.
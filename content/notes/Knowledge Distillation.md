---
categories:
  - Engineering
topics:
  - ai
sources:
  - article
updated: 2026-09-27
---

knowledge distillation or model distillation is the process of transferring knowledge from a large model to a smaller one

We already have a huge, smart model that's fully trained. But it's expensive at scale (costs a lot in compute and energy), needs heavy hardware, and can't fit on small devices, so for everyday use, we actually want a small, fast model: one that uses less compute and memory, responds quickly, and can run on smaller devices. Instead of training that small model from scratch on raw data, we have it copy the big model's predictions. This is knowledge distillation.

Google's Gemma models are distilled from Gemini. Meta's Llama 4 Scout and Maverick are distilled from the 2-trillion-parameter Behemoth model.

In 2006 published paper [Model Compression](https://www.researchgate.net/publication/221653840_Model_compression), At the time, models were tiny by today's standards (maybe 500MB to 1GB), but the problem then was that the best performing models weren't single models at all. They were ensembles : collections of hundreds or thousands of independently trained classifiers, whose predictions were averaged together for a final answer.

Ensembles worked well because training back then was noisy and sensitive to random initialization. Train a thousand slightly different models on the same spam-detection task, and some come out great, some come out mediocre. Averaging all of them would give better results.

The problem back then was that a thousand-model ensemble cant fit into a device with limited storage. So the Cornell paper proposed something clever: instead of shipping the whole ensemble, train one small model to mimic the ensemble's averaged output

The small model was not trained only on the original **hard labels** from the dataset, such as “spam” or “not spam.” Instead, it was trained to match the ensemble’s averaged probability output for example, 
$$
P(\text{spam}) = 0.73
$$
rather than simply 
$$
\text{spam} = 1
$$
These **soft labels** contain more information about the ensemble’s behavior, including how confident it is in each prediction. By learning these probability outputs, the small model is learning the behavior.
This soft, probability-based target is what makes the whole idea work, and it's the seed of everything that came after

The 2006 idea sat mostly unused until 2015, [Distilling the Knowledge in a Neural Network](https://arxiv.org/abs/1503.02531) at Google. This paper is where the field got its name and its "teacher/student" terminology. It also made a discovery that goes beyond the 2006 work: you don't need an ensemble at all. A single well-trained teacher model is enough. If you already have one big classifier and want to compress it, you're still better off training the small student on the teacher's soft probability output than on the dataset's hard labels.

They tested this on MNIST, the standard handwritten-digit dataset (0–9). 

Take a messy handwritten "5." 
A hard label says "5 = 100%, everything else = 0%," discarding any resemblance to other digits. 
The teacher's actual output before rounding to a final answer might look like: 
5 → 60%, 3 → 30%, 8 → 10%.

That 30% on "3" is information: it tells the student that this input resembles a 3 more than it resembles any other non-5 digit. So this paper called this **dark knowledge**: information about what an input is not, contained in the small soft non-zero probabilities that a hard label erases.  The teacher has already worked out these resemblances; the student only has to copy them, which is why it can use far fewer parameters than the teacher and still perform well.

This distillation process can happen pre-training, or post-training or both. 
Llamma does it during pre-training.

Google and Meta does [[Proper distillation - type of knowledge distillation]]

2 reasons why proper distillation is not used everywhere is that : 
- it requires access to teacher model's actual raw [[Logits]] 
- It is expensie : because u should build and maintain ur own teacher model first.
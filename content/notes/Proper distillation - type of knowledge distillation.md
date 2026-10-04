---
categories:
  - Engineering
topics:
  - ai
sources:
  - article
updated: 2026-09-27
---

Proper Distillation also called as the Standard Distillation is a type of [[Knowledge Distillation]] process. 

Here, the student model starts as a completely untrained, randomly initialized network, same as any model before training begins.

Here's the sequence at step 1:

1. Student has random weights. Feed it a piece of text.
2. Its prediction is garbage, essentially random probabilities over the vocabulary, since it hasn't learned anything yet.
3. The teacher (already fully trained, frozen) is fed the same text and produces its own soft distribution,  this one is meaningful, not random.
4. You compare the student's garbage output to the teacher's meaningful output, compute the loss, and backpropagate it through the student's neural network. The teacher's weights don't change; it's just being used to generate a target.
5. The student's weights shift a tiny bit toward matching the teacher.

Repeat this billions of times across the training corpus. Each step nudges the student a little closer to producing distributions like the teacher's. By the end, the student despite having far fewer parameters has gradually learned to approximate the teacher's behavior.
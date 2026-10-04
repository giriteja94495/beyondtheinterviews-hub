---
categories:
  - Engineering
topics:
  - ai
sources:
  - article
updated: 2026-09-20
---

![[jev.mov]]
video credits to https://x.com/BenjDicken

Jev is an AI model that consumes input and produces output VERY differently than ChatGPT, Claude, Grok. 
  
The models we're used to often give us long written answers, with explanations and reasoning jev returns structured answers your app can use directly, instead of generating those explanations.. 

The input is two things: 
- Text state to assess. Email, html, code, whatever. 
- A set of questions which will be asked about the attached state. 

The canonical example from TypeSafe's docs (the company that came up with Jev) is to identify the urgency of a support ticket. 

We pass the model the customer text + a single noul question "is this urgent?". 
Jev returns a full set of JSON. 
This JSON is not generated with token-by-token autoregression. Jev is not trained to produce sequences of text tokens, rather to answer questions, and guarantees well-formed responses. 

In the example below, we see it produces a 0.99 probability (on a 0-1.0 scale) that the answer is "yes." 
Jev supports exactly three types of questions (seconds example in video): 
- Noul: 0–1 probability that the answer to a yes/no question is "yes."
- Choice: Ask question with pre-defined set of answers. Jev chooses the best and assigns probabilities to each. 
- Score: Ask question with pre-defined scale of answers. Jev produces a position on the scale. 

![[jev-primitives.png]]

Jev computes answers for all questions in parallel, making responses super fast even for many questions in a single request. And Jev is super cheap and fast. Jev is a transformer encoder model. 

This might seem like a narrow set of capabilities, but in the right contexts leads to incredible potential. It also makes for a useful API / primitive for programming, since the outputs are type-safe and predictable in structure.

But some things to note about Jev is that : 
- Put in all the text you want, the only thing you’re going to get back is a floating point number. If Jev marks something as spam, which content signals tipped it off? 
- [Simon Willison](https://simonwillison.net/2026/Sep/21/jev/) tried one experiment where he said he scored every city in the San Francisco Bay Area on a yes/no answer to whether they were a Good city? with Jev, and it rated [Cupertino](https://en.wikipedia.org/wiki/Cupertino,_California) top and [East Palo Alto](https://en.wikipedia.org/wiki/East_Palo_Alto,_California)bottom. Huh.)  
- So, In practice, this all means that evals and structured experiments are even more important than they are for regular LLM projects


![[jev-api.png]]
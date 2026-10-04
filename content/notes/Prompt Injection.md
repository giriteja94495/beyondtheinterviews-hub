---
categories:
  - Engineering
topics:
  - ai
sources:
updated: 2026-09-18
---

Prompt injection isn’t a prompt problem, it is an architectural problem.  
  
Fixing prompts and making it better won’t solve it because LLMs can’t distinguish between instructions and data.  
  
The only way we can reduce the blast radius is by :  
  
- building the architecture assuming the LLM will leak, applying the principle of least privilege principle.  
  
- Isolating and limiting what the LLM can access, so that if it leaks, nothing critical is exposed.  
  
- the LLM should not be in charge of access control, let it request, let the backend decide based on user privileges  
  
- Log everything in order to trace back in case of an incident.  
  
- validate outputs using strict schema before using them.  
  
- conduct attack simulations prior, so that we catch hold of these leaks prior to a real prod leak.  
  
Best practice : Design assuming the model is compromised.
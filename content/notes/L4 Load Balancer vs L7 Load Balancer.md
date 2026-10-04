---
categories:
  - Engineering
topics:
  - distributed systems
sources:
updated: 2026-02-20
---
## L4 Load Balancer
  
- An L4 load balancer operates at the transport layer, and so it does not have access to URLs, HTTP payloads, headers, etc. Instead, it just utilizes the IP and port information to establish and route the connection.  
  
- To forward the request to a backend server, it typically performs NAT at the load balancer, where the destination is rewritten from the load balancer to the backend server.  
  
So the TCP connection from the client is forwarded to the server through the load balancer.  
  
- The downside is that since it cannot see the application payload or HTTP headers, things like caching, header modifications, or content-based routing are not possible.  
- Because it simply forwards TCP packets without inspecting the payload in a single TCP connection, so it is fast.  

- If traffic is raw TCP/UDP (like for databases) -> pick L4.  
  
## L7 Load Balancer
  
- An L7 load balancer operates at the application layer, and so it can see URLs, HTTP headers, cookies, methods, and sometimes even parts of the payload. It uses this application-level data to route requests, not just IP and port.  
  
- To forward traffic to backend services, it typically terminates the client tcp connection at the load balancer and then creates a separate tcp connection from the load balancer to the backend server.  
  
- an L7 load balancer also terminates TLS (HTTPS) meaning the client establishes an encrypted TLS connection to the LB, the LB decrypts the request so it can inspect URLs/headers for routing, and then it forwards the request to the backend (either re-encrypted or plain HTTP).  
  
- The upside is that since it can inspect HTTP, it enables things like path-based routing , header rewrites, sticky sessions, caching, rate limiting etc.  
  
- The downside is that because it has to terminate connections (2 tcp connectins being done) and parse HTTP and decrypt TLS, it adds more processing overhead than L4, so it’s typically slower than a pure L4 forwarder.  
  
- If traffic is http (like for REST APIs ) -> pick L7
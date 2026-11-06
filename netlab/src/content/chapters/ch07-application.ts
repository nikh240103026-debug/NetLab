import type { Chapter } from '@/lib/types';

const chapter: Chapter = {
  slug: 'application',
  number: 7,
  title: 'Application layer',
  shortTitle: 'Application',
  summary:
    'The application layer is where programs use the network. This chapter covers client-server and peer-to-peer models, DNS, HTTP and HTTPS, cookies and caching, DHCP, email, FTP, REST APIs, sockets and CDNs, and then follows one URL from the keyboard to the rendered page.',
  estMinutes: 75,
  learningObjectives: [
    'Compare client-server and peer-to-peer architectures and calculate file distribution time.',
    'Trace recursive and iterative DNS resolution and choose the correct record type for a task.',
    'Read HTTP messages, methods, status codes, cookie and cache headers, and compare HTTP versions and HTTPS.',
    'Describe the DHCP DORA exchange and the email delivery path using SMTP, POP3 and IMAP.',
    'Use dig, nslookup, curl, ipconfig and netstat to find application layer faults.',
  ],
  overviewVideoId: 'ch07-overview',
  sections: [
    {
      id: 'communication-models',
      title: 'Application layer and communication models',
      blocks: [
        { type: 'paragraph', text: 'The application layer holds the protocols that programs use to exchange meaningful messages, such as a web page or an email. An application protocol defines message types, syntax, field meanings and the rules for when to send and reply, and it leaves delivery to the transport layer. The first design choice is how the processes are organised: client-server, peer-to-peer or a hybrid.' },
        {
          type: 'points',
          items: [
            '**Process and socket**: programs running on hosts communicate through sockets, addressed by IP address, transport protocol and port.',
            '**Client and server**: the client starts the communication, and the server waits on a known port.',
            '**Transport choice**: TCP gives reliable, ordered delivery. UDP gives low overhead with no connection set-up.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch07-client-server-p2p',
          title: 'Client-server and peer-to-peer models',
          caption: 'In client-server, clients talk only to the server, and its upload capacity limits the service. In peer-to-peer, each host both uploads and downloads, so capacity grows with the number of peers.',
          kind: 'block',
          mermaid: `flowchart LR
    subgraph S1["Client-server"]
        C1["Client A"] -->|request| SV["Always-on server"]
        SV -->|response| C1
        C2["Client B"] -->|request| SV
        SV -->|response| C2
    end
    subgraph S2["Peer-to-peer"]
        P1["Peer 1"] -->|chunk| P2["Peer 2"]
        P2 -->|chunk| P3["Peer 3"]
        P3 -->|chunk| P1
    end`,
        },
        {
          type: 'table',
          headers: ['Feature', 'Client-server', 'Peer-to-peer'],
          rows: [
            ['Server', 'Always-on host with a stable address', 'No always-on server needed for data transfer'],
            ['Scaling', 'Capacity must be added as demand grows', 'Self-scaling, as each peer adds upload capacity'],
            ['Control', 'Central control of data and access', 'Harder to manage and secure'],
            ['Examples', 'Web, email, DNS, FTP', 'BitTorrent, blockchain networks'],
          ],
        },
        { type: 'callout', variant: 'formula', text: 'File distribution time for `N` peers and file size `F`. Client-server: `Dcs = max(N x F / us, F / dmin)`. Peer-to-peer: `Dp2p = max(F / us, F / dmin, N x F / (us + sum of ui))`.' },
        {
          type: 'example',
          title: 'Distributing a 10 Gbit file to 100 peers',
          steps: [
            'Given `F = 10,000 Mbit`, `N = 100`, `us = 100 Mbps`, and each peer has `di = 20 Mbps` and `ui = 5 Mbps`.',
            'Client-server: `N x F / us = 10,000 s` and `F / dmin = 500 s`, so `Dcs = 10,000 s`.',
            'P2P: `F / us = 100 s`, `F / dmin = 500 s`, and `N x F / (us + N x ui) = 1,000,000 / 600 = 1,666.7 s`, so `Dp2p = 1,666.7 s`.',
            'P2P is 6 times faster here, because every downloader also uploads.',
          ],
        },
        { type: 'callout', variant: 'real-world', text: 'In industry the "one server" is rarely one machine. A public web app sits behind DNS and a load balancer that spreads requests over many identical servers, yet clients still see client-server. Hybrids are common: video calls use a server for signalling and try a direct peer path for media (WebRTC), and Windows Delivery Optimization can fetch update pieces from other PCs on the LAN.' },
        {
          type: 'table',
          headers: ['Protocol', 'Transport', 'Port', 'Purpose'],
          rows: [
            ['DNS', 'UDP, TCP', '`53`', 'Name resolution'],
            ['HTTP / HTTPS', 'TCP; HTTP/3 uses QUIC over UDP', '`80` / `443`', 'Web'],
            ['DHCP', 'UDP', '`67` server, `68` client', 'Host configuration'],
            ['SMTP', 'TCP', '`25`, `587`, `465`', 'Mail relay and submission'],
            ['POP3 / IMAP', 'TCP', '`110`, `995` / `143`, `993`', 'Mailbox access'],
            ['FTP', 'TCP', '`21` control, `20` active data', 'File transfer'],
          ],
        },
      ],
    },
    {
      id: 'dns-system',
      title: 'DNS: hierarchy, records and resolution',
      videoId: 'ch07-dns-resolution',
      blocks: [
        { type: 'paragraph', text: 'People remember names such as `www.example.com`, while routers forward packets by IP address. The Domain Name System (DNS, RFC 1034 and RFC 1035) is a distributed, hierarchical database that maps names to addresses and other records. Nearly every other application depends on it.' },
        {
          type: 'points',
          items: [
            '**Transport**: port `53`. Normal queries use UDP. TCP is used for zone transfers and when a server sets the `TC` (truncated) flag on a response that is too large.',
            '**Distributed**: responsibility is delegated down a tree, so each organisation manages only its own zone.',
            '**Cached**: every answer carries a `TTL` in seconds, and resolvers reuse it until the TTL expires.',
            '**Message format**: a 12-byte header (`ID`, flags and four counts) followed by question, answer, authority and additional sections.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch07-dns-hierarchy',
          title: 'DNS name hierarchy',
          caption: 'Authority is delegated from the root to top-level domains and then to the zones of organisations. Each level only knows who is responsible for the level below.',
          kind: 'block',
          mermaid: `flowchart TD
    R1["Root zone"] --> T1["TLD .com"]
    R1 --> T2["TLD .org"]
    R1 --> T3["TLD .in"]
    T1 --> A1["example.com authoritative"]
    T2 --> A2["example.org authoritative"]
    T3 --> A3["ac.in delegated zone"]
    A1 --> H1["www.example.com A record"]
    A1 --> H2["mail.example.com A record"]
    A2 --> H3["www.example.org A record"]`,
        },
        {
          type: 'points',
          items: [
            '**Root servers**: know the name servers of every TLD. There are 13 named identities, `a` to `m.root-servers.net`, each served by many anycast instances.',
            '**TLD servers**: run generic TLDs such as `.com` and country codes such as `.in`, and refer queries to the authoritative servers of each domain.',
            '**Authoritative servers**: hold the records of a zone. Secondaries copy the primary by zone transfer (`AXFR` or `IXFR`) over TCP.',
            '**Recursive resolver**: run by an ISP, a company or a public provider (`8.8.8.8`, `1.1.1.1`). It does the lookup work and caches results.',
            '**Stub resolver**: a small operating system library that sends queries to the configured resolver.',
          ],
        },
        {
          type: 'table',
          headers: ['Type', 'Holds', 'Example'],
          rows: [
            ['A', 'IPv4 address', '`www.example.com. 300 IN A 203.0.113.10`'],
            ['AAAA', 'IPv6 address', '`www.example.com. 300 IN AAAA 2001:db8::10`'],
            ['CNAME', 'Alias to a canonical name', '`blog.example.com. IN CNAME www.example.com.`'],
            ['MX', 'Mail server and preference', '`example.com. IN MX 10 mail.example.com.`'],
            ['NS', 'Authoritative name server', '`example.com. IN NS ns1.example.com.`'],
            ['PTR', 'Name for an address (reverse)', '`10.113.0.203.in-addr.arpa. IN PTR www.example.com.`'],
            ['SOA', 'Zone serial number and timers', '`example.com. IN SOA ns1.example.com. admin.example.com. ...`'],
            ['TXT', 'Text, such as SPF policy', '`example.com. IN TXT "v=spf1 mx -all"`'],
          ],
        },
        { type: 'callout', variant: 'remember', text: 'A lower MX preference value means a higher priority. A CNAME cannot share a name with other records, so a zone apex such as `example.com` normally cannot be a CNAME.' },
        {
          type: 'diagram',
          id: 'ch07-dns-resolution-sequence',
          title: 'Recursive and iterative DNS resolution',
          caption: 'The client sends one recursive query. The resolver then makes iterative queries down the tree, caches what it learns and returns the answer. With empty caches this takes 8 DNS messages.',
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant C as Stub on client
    participant R as Recursive resolver
    participant N as Root server
    participant T as TLD server for com
    participant A as Authoritative server
    Note over C,R: Recursive query, final answer required
    C->>R: Query www.example.com type A, RD=1
    Note over R,A: Iterative queries, each reply is a referral or the answer
    R->>N: Query www.example.com type A
    N-->>R: Referral to com name servers
    R->>T: Query www.example.com type A
    T-->>R: Referral to ns1.example.com
    R->>A: Query www.example.com type A
    A-->>R: A 203.0.113.10 TTL 300, AA=1
    R-->>C: A 203.0.113.10 TTL 300, RA=1`,
        },
        {
          type: 'points',
          items: [
            '**Recursive query**: "give me the final answer". The client sets the `RD` (recursion desired) flag, and the resolver takes on all the work.',
            '**Iterative query**: "tell me the best you know". The server returns the answer or a referral to the next server.',
            '**Flags**: `AA` marks an authoritative answer, and `RA` shows that recursion is available. A cached answer from a resolver has `AA=0` and is non-authoritative.',
          ],
        },
        { type: 'callout', variant: 'exam-tip', text: 'Client to resolver is recursive, and resolver to root, TLD and authoritative is iterative. Fully recursive chains through the root are avoided, because they would put state and load on the root servers.' },
        {
          type: 'command-lab',
          title: 'Query a resolver with dig',
          command: 'dig www.example.com A @8.8.8.8',
          output: `; <<>> DiG 9.18.24 <<>> www.example.com A @8.8.8.8
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 41873
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 512
;; QUESTION SECTION:
;www.example.com.               IN      A

;; ANSWER SECTION:
www.example.com.        300     IN      A       203.0.113.10

;; Query time: 24 msec
;; SERVER: 8.8.8.8#53(8.8.8.8) (UDP)
;; WHEN: Tue Nov 03 10:15:42 IST 2026
;; MSG SIZE  rcvd: 60`,
          explanation: [
            '`status: NOERROR` means that the name exists. `NXDOMAIN` would mean that it does not, and `SERVFAIL` that the resolver could not get an answer.',
            '`flags: qr rd ra` means a response, recursion desired and recursion available. `aa` is absent, so the answer is non-authoritative.',
            '`QUERY: 1, ANSWER: 1` are section counts from the DNS header.',
            'The answer line gives name, TTL in seconds, class, type and value. It may be reused for 300 seconds.',
            '`SERVER: 8.8.8.8#53` and `(UDP)` show the resolver, port and transport. `Query time` drops to near 0 on a cache hit.',
          ],
        },
        {
          type: 'wireshark',
          filter: 'dns',
          whatToLook: [
            'Match each query to its response using the Transaction ID.',
            'Confirm UDP destination port 53 and the Recursion desired flag in the query.',
            'In the response, read the Answers section, the TTL and the Authoritative flag.',
          ],
        },
        { type: 'callout', variant: 'real-world', text: '**Home**: the router forwards DNS to the ISP resolver and offers its own LAN address as the DNS server through DHCP. **Office**: internal servers (Active Directory DNS or BIND) answer private names, and split-horizon DNS gives different answers inside and outside. **Cloud**: services such as Route 53 host authoritative zones, and teams lower the TTL to about `60` s before a migration. Clients can encrypt queries with DoT (TCP `853`) or DoH (TCP `443`).' },
        {
          type: 'troubleshoot',
          symptom: '`ping 8.8.8.8` works, but `ping www.example.com` reports that the host cannot be found.',
          checks: [
            'Run `ipconfig /all` or `resolvectl status` to see which DNS server is configured.',
            'Query another resolver directly with `nslookup www.example.com 8.8.8.8`. If that works, the configured resolver is at fault.',
            'Separate `NXDOMAIN` (wrong name or missing record) from `SERVFAIL` (resolver or DNSSEC fault) and a timeout (UDP `53` blocked).',
            'Check the `hosts` file for a stale entry, and flush the cache with `ipconfig /flushdns`.',
          ],
          fix: 'Correct the DNS server in DHCP or on the adapter, or repair the record on the authoritative server. Old answers stay in caches until their TTL expires.',
        },
      ],
    },
    {
      id: 'http-core',
      title: 'HTTP: messages, versions, methods and status codes',
      videoId: 'ch07-http-https-request',
      blocks: [
        { type: 'paragraph', text: 'HTTP (Hypertext Transfer Protocol) is the request-response protocol of the web. A client requests a resource named by a URL, and the server returns a status code and usually a body. HTTP is stateless, so the server keeps no memory of earlier requests unless a mechanism such as a cookie is added.' },
        {
          type: 'points',
          items: [
            '**URL parts**: in `https://www.example.com:443/docs/a.html?id=7`, the scheme is `https`, host `www.example.com`, port `443`, path `/docs/a.html` and query `id=7`.',
            '**Request line**: method, target and version, such as `GET /index.html HTTP/1.1`.',
            '**Status line**: version, code and reason phrase, such as `HTTP/1.1 200 OK`.',
            '**Headers**: `Name: value` lines closed by an empty line (`CRLF`). `Host` is mandatory in HTTP/1.1, as one IP address can host many sites.',
            '**Body**: optional. It carries form data or JSON in requests, and HTML, images or JSON in responses.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch07-http-message-block',
          title: 'HTTP request and response message structure',
          caption: 'Both messages have a start line, header lines, a blank line and an optional body. The request flows from browser to server, and the response flows back.',
          kind: 'block',
          mermaid: `flowchart TD
    subgraph S1["Request message"]
        R1["Request line: GET /index.html HTTP/1.1"] --> R2["Headers: Host, User-Agent, Accept"]
        R2 --> R3["Blank line CRLF"]
        R3 --> R4["Optional body, empty for GET"]
    end
    subgraph S2["Response message"]
        Q1["Status line: HTTP/1.1 200 OK"] --> Q2["Headers: Content-Type, Content-Length"]
        Q2 --> Q3["Blank line CRLF"]
        Q3 --> Q4["Body: HTML, JSON or image bytes"]
    end
    C1["Browser, the HTTP client"] -->|sends| R1
    R4 --> W1["Web server"]
    W1 -->|returns| Q1
    Q4 --> C2["Browser renders the body"]`,
        },
        {
          type: 'table',
          headers: ['Version', 'Standard', 'Transport', 'Key features', 'Limitation'],
          rows: [
            ['HTTP/1.0', '1996, RFC 1945', 'TCP', 'Headers, status codes, one connection per object by default', 'Costs 2 RTT per object'],
            ['HTTP/1.1', '1997, now RFC 9112', 'TCP', 'Persistent by default, mandatory `Host`, chunked transfer', 'Responses stay in order, so a slow one blocks others'],
            ['HTTP/2', '2015, now RFC 9113', 'TCP, with TLS in browsers', 'Binary frames, multiplexed streams, HPACK header compression', 'One lost TCP segment stalls all streams'],
            ['HTTP/3', '2022, RFC 9114', 'QUIC over UDP', 'Independent streams, QPACK, TLS 1.3 built in, connection migration', 'UDP `443` may be blocked, so clients fall back to HTTP/2'],
          ],
        },
        {
          type: 'table',
          headers: ['Method', 'Purpose', 'Safe', 'Idempotent'],
          rows: [
            ['GET', 'Read a resource', 'Yes', 'Yes'],
            ['HEAD', 'Like GET, but headers only', 'Yes', 'Yes'],
            ['POST', 'Submit data or create', 'No', 'No'],
            ['PUT', 'Create or replace at this URL', 'No', 'Yes'],
            ['PATCH', 'Partial update', 'No', 'Not guaranteed'],
            ['DELETE', 'Remove a resource', 'No', 'Yes'],
            ['OPTIONS', 'Ask which features are supported', 'Yes', 'Yes'],
          ],
        },
        {
          type: 'table',
          headers: ['Class', 'Meaning', 'Common codes'],
          rows: [
            ['1xx', 'Informational', '`100 Continue`, `101 Switching Protocols`'],
            ['2xx', 'Success', '`200 OK`, `201 Created`, `204 No Content`, `206 Partial Content`'],
            ['3xx', 'Redirection', '`301 Moved Permanently`, `302 Found`, `304 Not Modified`, `308 Permanent Redirect`'],
            ['4xx', 'Client error', '`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `429 Too Many Requests`'],
            ['5xx', 'Server error', '`500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable`, `504 Gateway Timeout`'],
          ],
        },
        { type: 'callout', variant: 'exam-tip', text: '`401` means that the client has not authenticated, while `403` means that access is refused even though the identity may be known. `502` and `504` usually come from a proxy whose backend failed or timed out.' },
        { type: 'callout', variant: 'formula', text: 'Non-persistent HTTP costs `2 RTT + Tt` per object. Persistent HTTP without pipelining costs `RTT + N x (RTT + Tt)` for `N` objects on one connection. `Tt = L / R` is the transmission time.' },
        {
          type: 'example',
          title: 'Base HTML file plus 5 images, RTT 100 ms, transmission ignored',
          steps: [
            'Serial non-persistent: 6 objects x 2 RTT = 12 RTT = `1200 ms`.',
            'Parallel non-persistent with 5 connections: 2 RTT for the base + 2 RTT for all images = `400 ms`.',
            'Persistent without pipelining: 1 RTT for TCP + 6 x 1 RTT = 7 RTT = `700 ms`.',
            'Persistent with pipelining or HTTP/2 multiplexing: 1 RTT for TCP + 1 RTT for the base + 1 RTT for all images = `300 ms`.',
          ],
        },
        {
          type: 'command-lab',
          title: 'Read a redirect and response headers with curl',
          command: 'curl -sI -L http://www.example.com/',
          output: `HTTP/1.1 301 Moved Permanently
Server: nginx
Date: Tue, 03 Nov 2026 04:45:10 GMT
Content-Type: text/html
Content-Length: 162
Connection: keep-alive
Location: https://www.example.com/

HTTP/2 200
server: nginx
date: Tue, 03 Nov 2026 04:45:11 GMT
content-type: text/html; charset=UTF-8
content-length: 1256
cache-control: public, max-age=300
etag: "6ae853e0-4e8"
last-modified: Mon, 02 Nov 2026 09:12:00 GMT
strict-transport-security: max-age=31536000`,
          explanation: [
            '`-s` hides progress, `-I` sends `HEAD` and shows only headers, and `-L` follows redirects.',
            '`301` with `Location` moves the client from plain HTTP to HTTPS, so two exchanges take place.',
            '`HTTP/2 200` shows that HTTP/2 was negotiated. Header names are lower case, and no reason phrase is sent.',
            '`cache-control: public, max-age=300` lets any cache store the page for 300 seconds, and `etag` is the validator for later revalidation.',
            '`strict-transport-security` (HSTS) tells the browser to use only HTTPS for this site for one year.',
          ],
        },
        { type: 'callout', variant: 'real-world', text: 'In production a load balancer or reverse proxy such as NGINX or HAProxy accepts client connections, often with HTTP/2 or HTTP/3, and forwards requests to backend servers over HTTP/1.1 or HTTP/2. One IP address can serve many sites because of the `Host` header, and the backend learns the real client address from `X-Forwarded-For`.' },
      ],
    },
    {
      id: 'cookies-caching-https',
      title: 'Cookies, web caching and HTTPS',
      blocks: [
        { type: 'paragraph', text: 'Plain HTTP forgets every request, transfers the same objects again and sends everything in clear text. Cookies add state, caches remove repeated transfers, and TLS protects the exchange. These three additions turn the basic protocol into the web in use today.' },
        {
          type: 'points',
          items: [
            '**Step 1**: the server sends `Set-Cookie: sid=a91f; Path=/; Secure; HttpOnly` in a response.',
            '**Step 2**: the browser stores it and adds `Cookie: sid=a91f` to later matching requests.',
            '**Step 3**: the server uses the value as a key into a session store, such as Redis, to find the logged-in user.',
          ],
        },
        {
          type: 'table',
          headers: ['Attribute', 'Effect'],
          rows: [
            ['`Expires`, `Max-Age`', 'Lifetime. Without them it is a session cookie, removed when the browser session closes'],
            ['`Domain`, `Path`', 'Which hosts and URLs receive the cookie'],
            ['`Secure`', 'Sent only over HTTPS'],
            ['`HttpOnly`', 'Hidden from JavaScript, which limits theft through XSS'],
            ['`SameSite`', 'Limits sending on cross-site requests, which helps against CSRF'],
          ],
        },
        {
          type: 'points',
          items: [
            '**Browser cache**: private to one user, on disk or in memory.',
            '**Forward proxy cache**: shared by an office or campus, and it reduces WAN traffic.',
            '**Reverse proxy or CDN cache**: placed in front of the origin, and it reduces server load.',
            '**Freshness**: a fresh object is served with no contact to the server. A stale object is revalidated with a conditional `GET`.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch07-browser-cache-decision',
          title: 'Browser cache decision',
          caption: 'A fresh copy needs no network traffic. A stale copy with a validator costs one round trip, and a 304 reply avoids sending the body again.',
          kind: 'flowchart',
          mermaid: `flowchart TD
    A1["Browser needs an object"] --> B1{"Copy in cache?"}
    B1 -->|No| C1["Send normal GET to server"]
    B1 -->|Yes| B2{"Still fresh by max-age?"}
    B2 -->|Yes| D1["Use copy with no network traffic"]
    B2 -->|No| B3{"Has ETag or Last-Modified?"}
    B3 -->|No| C1
    B3 -->|Yes| C2["Send conditional GET"]
    C2 --> B4{"Server status?"}
    B4 -->|304 Not Modified| D2["Update freshness and use copy"]
    B4 -->|200 OK| C3["Receive new body"]
    C1 --> C3
    C3 --> B5{"Cache-Control is no-store?"}
    B5 -->|Yes| D3["Use body and do not store"]
    B5 -->|No| D4["Store body and use it"]`,
        },
        {
          type: 'table',
          headers: ['Header', 'Sent in', 'Meaning'],
          rows: [
            ['`Cache-Control: max-age=600`', 'Response', 'Fresh for 600 seconds'],
            ['`Cache-Control: no-cache`', 'Response', 'May store, but must revalidate before each use'],
            ['`Cache-Control: no-store`', 'Response', 'Must not store at all'],
            ['`Cache-Control: private`', 'Response', 'Browser may store, shared caches may not'],
            ['`ETag: "v7"` and `If-None-Match: "v7"`', 'Response and request', 'Version tag check, which returns `304` when unchanged'],
            ['`Last-Modified` and `If-Modified-Since`', 'Response and request', 'Date based check, which returns `304` when unchanged'],
          ],
        },
        { type: 'callout', variant: 'formula', text: 'Average time with a cache: `Tavg = h x Thit + (1 - h) x Tmiss`, where `h` is the hit ratio. Uplink traffic with a shared cache: `Demand x (1 - byte hit ratio)`.' },
        {
          type: 'points',
          items: [
            '**Confidentiality**: symmetric encryption, such as AES-GCM, hides the content.',
            '**Integrity**: authenticated encryption detects any change in transit.',
            '**Authentication**: the server proves its identity with an X.509 certificate signed by a trusted certificate authority (CA). The browser checks the chain, the host name in the SAN field and the validity dates.',
            '**Key agreement**: TLS 1.3 (RFC 8446) uses ephemeral Diffie-Hellman, so recorded traffic stays safe if the server key later leaks. This is forward secrecy.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch07-tls-handshake',
          title: 'HTTPS connection with TLS 1.3 over TCP',
          caption: 'TCP takes one round trip, and TLS 1.3 adds one more before the first request. TLS 1.2 needs two round trips for its handshake.',
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant C as Browser
    participant S as Web server
    C->>S: TCP SYN to port 443
    S->>C: TCP SYN-ACK
    C->>S: TCP ACK
    C->>S: ClientHello with versions, key share, SNI
    S->>C: ServerHello with key share
    S->>C: Encrypted Certificate, CertificateVerify, Finished
    C->>S: Encrypted Finished
    C->>S: Encrypted HTTP GET /index.html
    S->>C: Encrypted HTTP 200 OK with body`,
        },
        { type: 'callout', variant: 'exam-tip', text: 'HTTPS is HTTP inside TLS, on port `443`. Asymmetric cryptography authenticates the server and agrees the keys, and symmetric cryptography protects the data, because it is much faster. An observer still sees the IP addresses, ports and usually the SNI host name, but not the path, cookies or body.' },
        { type: 'callout', variant: 'real-world', text: 'Public sites commonly use free 90-day certificates from Let\'s Encrypt, renewed automatically through ACME. Load balancers and CDNs often terminate TLS and forward traffic to backends, and service meshes use mutual TLS between microservices. Company firewalls may inspect TLS by installing their own CA certificate on managed laptops.' },
        {
          type: 'wireshark',
          filter: 'tls.handshake.type == 1',
          whatToLook: [
            'Open the ClientHello and read the supported_versions extension.',
            'Read the server_name extension, which shows the SNI host name in clear text.',
            'Change the filter to tls.handshake.type == 2 to see the ServerHello and the chosen cipher suite.',
            'Confirm that later traffic appears only as encrypted Application Data records.',
          ],
        },
        {
          type: 'mini-lab',
          title: 'Watch cookies and caching in the browser',
          goal: 'See `Set-Cookie`, cache headers and cache hits in real traffic.',
          steps: [
            'Open any HTTPS site, press `F12` and choose the **Network** tab.',
            'Reload. Click the main document and read `Status`, `Cache-Control`, `ETag` and `Set-Cookie`.',
            'Reload again, and look for rows marked `304` or served from disk or memory cache.',
            'Tick **Disable cache** and reload, then compare the transferred bytes and the load time.',
            'Open the cookie storage view and check the `HttpOnly` and `Secure` columns.',
          ],
          expected: 'The second load transfers fewer bytes, with objects from cache or with `304`. With the cache disabled, objects return `200` and the load takes longer.',
        },
      ],
    },
    {
      id: 'dhcp-process',
      title: 'DHCP: automatic IP configuration',
      videoId: 'ch07-dhcp-dora',
      blocks: [
        { type: 'paragraph', text: 'A host needs an IP address, subnet mask, default gateway and DNS server before it can use the network. DHCP (Dynamic Host Configuration Protocol, RFC 2131) supplies these automatically for a limited time called a lease. It runs over UDP, with servers on port `67` and clients on port `68`.' },
        {
          type: 'points',
          items: [
            '**Pool and reservation**: addresses come from a configured range. A reservation ties a fixed address to a MAC address, which suits printers.',
            '**Options**: mask (`1`), router (`3`), DNS (`6`), requested IP (`50`), lease time (`51`), message type (`53`), server identifier (`54`).',
            '**Fields**: `xid` matches replies to requests, `ciaddr` is the current client IP, `yiaddr` is "your" IP, `giaddr` is the relay address and `chaddr` is the client MAC.',
            '**Why broadcast**: a new client has no address and does not know the server, so it sends from `0.0.0.0` to `255.255.255.255`.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch07-dhcp-dora-sequence',
          title: 'DHCP DORA exchange and lease renewal',
          caption: 'Discover and Request are broadcast by the client. Offer and Ack carry the address in yiaddr, and the server sends them by broadcast or unicast according to the client flag. Renewal at T1 is a unicast Request.',
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant C as Client AA-BB-CC-DD-EE-01
    participant S as DHCP server 192.168.1.1
    Note over C: No address yet, source is 0.0.0.0
    C->>S: DHCPDISCOVER broadcast, UDP 68 to 67, xid=0x3A7C
    S->>C: DHCPOFFER yiaddr=192.168.1.50, lease 86400 s, UDP 67 to 68
    C->>S: DHCPREQUEST broadcast, requested IP and server ID
    S->>C: DHCPACK yiaddr=192.168.1.50, mask, router, DNS, lease
    Note over C: ARP probe, then configure the address
    Note over C,S: At T1, half of the lease, renew
    C->>S: DHCPREQUEST unicast, ciaddr=192.168.1.50
    S->>C: DHCPACK with a new lease`,
        },
        {
          type: 'table',
          headers: ['Message', 'From', 'Source to destination', 'Purpose'],
          rows: [
            ['`DHCPDISCOVER`', 'Client', '`0.0.0.0:68` to `255.255.255.255:67`', 'Find any DHCP server'],
            ['`DHCPOFFER`', 'Server', '`192.168.1.1:67` to client port `68`', 'Propose an address, lease and options'],
            ['`DHCPREQUEST`', 'Client', '`0.0.0.0:68` to `255.255.255.255:67`', 'Accept one offer by naming its server ID'],
            ['`DHCPACK`', 'Server', '`192.168.1.1:67` to client port `68`', 'Commit the lease'],
          ],
        },
        { type: 'callout', variant: 'exam-tip', text: 'DHCPREQUEST is broadcast so that every server learns which offer was accepted, and the others can return their addresses to the pool. Other messages: `DHCPNAK` refuses a request, `DHCPDECLINE` reports an address already in use, `DHCPRELEASE` gives up a lease and `DHCPINFORM` asks for options only.' },
        {
          type: 'points',
          items: [
            '**Renewal at T1**: at 50 percent of the lease, the client unicasts a DHCPREQUEST to its server.',
            '**Rebinding at T2**: at 87.5 percent of the lease, the client broadcasts a DHCPREQUEST to any server.',
            '**Expiry**: with no reply, the client must stop using the address and restart from Discover.',
            '**Relay agent**: routers stop broadcasts, so a router interface forwards DHCP messages as unicast to a central server and writes its own address in `giaddr`. The server uses `giaddr` to choose the pool.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch07-dhcp-client-states',
          title: 'DHCP client state machine',
          caption: 'A client moves from INIT to BOUND through DORA, and then between BOUND, RENEWING and REBINDING as lease timers expire.',
          kind: 'working-diagram',
          mermaid: `stateDiagram-v2
    [*] --> INIT
    INIT --> SELECTING: send DISCOVER
    SELECTING --> REQUESTING: pick OFFER, send REQUEST
    REQUESTING --> BOUND: receive ACK
    REQUESTING --> INIT: receive NAK
    BOUND --> RENEWING: T1 expires, unicast REQUEST
    RENEWING --> BOUND: receive ACK
    RENEWING --> INIT: receive NAK
    RENEWING --> REBINDING: T2 expires, broadcast REQUEST
    REBINDING --> BOUND: receive ACK
    REBINDING --> INIT: lease expires or NAK
    BOUND --> [*]: send RELEASE`,
        },
        { type: 'callout', variant: 'formula', text: '`T1 = 0.5 x lease` and `T2 = 0.875 x lease`. For an 8-hour lease, `T1 = 4 h` and `T2 = 7 h`.' },
        {
          type: 'command-lab',
          title: 'Read a DHCP lease on Windows',
          command: 'ipconfig /all',
          output: `Wireless LAN adapter Wi-Fi:

   Physical Address. . . . . . . . . : AA-BB-CC-DD-EE-01
   DHCP Enabled. . . . . . . . . . . : Yes
   Autoconfiguration Enabled . . . . : Yes
   IPv4 Address. . . . . . . . . . . : 192.168.1.50(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Lease Obtained. . . . . . . . . . : Tuesday, 3 November 2026 09:00:12
   Lease Expires . . . . . . . . . . : Wednesday, 4 November 2026 09:00:12
   Default Gateway . . . . . . . . . : 192.168.1.1
   DHCP Server . . . . . . . . . . . : 192.168.1.1
   DNS Servers . . . . . . . . . . . : 192.168.1.1`,
          explanation: [
            '`DHCP Enabled: Yes` means that the adapter gets its settings automatically.',
            '`IPv4 Address` is the `yiaddr` from the DHCPACK, and the mask gives a `/24` network.',
            '`Lease Obtained` and `Lease Expires` are 24 hours apart, so T1 falls at 12 hours and T2 at 21 hours.',
            '`Default Gateway`, `DNS Servers` and `DHCP Server` come from options 3, 6 and 54. A home router often fills all three roles.',
            'Run `ipconfig /release` and then `ipconfig /renew` to force a new DORA exchange.',
          ],
        },
        {
          type: 'case-study',
          title: 'Central DHCP for a multi-VLAN office',
          scenario: 'A company routes user VLAN 10 (`192.168.10.0/24`) and VLAN 20 (`192.168.20.0/24`) on a Layer 3 switch. One DHCP server at `10.0.50.10` in the data centre must serve both, but broadcasts stop at the router.',
          steps: [
            'Add a relay on each VLAN interface: `interface vlan 10`, then `ip helper-address 10.0.50.10`. Repeat for `vlan 20`.',
            'The relay receives the DISCOVER, sets `giaddr` to `192.168.10.1` and unicasts it to the server on UDP `67`.',
            'The server matches `giaddr` to the `192.168.10.0/24` scope and offers from that pool. The reply returns through the relay.',
            'Enable `ip dhcp snooping` on access switches and mark the uplink with `ip dhcp snooping trust`, so that a rogue router on a user port cannot hand out addresses.',
            'Use short leases of 1 to 8 hours on guest Wi-Fi and longer leases of several days on wired desktops, and monitor pool usage.',
          ],
        },
        {
          type: 'troubleshoot',
          symptom: 'A laptop shows an address in `169.254.x.x` and has no internet access.',
          checks: [
            'Recognise the APIPA link-local range `169.254.0.0/16`. The host assigned it because no DHCP reply arrived.',
            'Check the link, Wi-Fi association and the access VLAN of the switch port.',
            'Run `ipconfig /renew` while capturing with the display filter `dhcp`. Discovers with no Offer point to the server or relay.',
            'On the router check `ip helper-address`, `show ip dhcp pool` for an exhausted pool and `show ip dhcp conflict`.',
          ],
          fix: 'Restore the path to the server, correct the relay address, or enlarge the pool. Then run `ipconfig /release` and `ipconfig /renew`.',
        },
        { type: 'callout', variant: 'real-world', text: '**Home**: the router is a DHCP server on its LAN side and a DHCP client toward the ISP on its WAN side. **Office**: Windows Server or ISC Kea runs centrally, with relays on each VLAN. **Cloud**: a VPC provides a built-in DHCP service, which gives each instance its assigned private IP and DNS settings.' },
      ],
    },
    {
      id: 'email-protocols',
      title: 'Email: SMTP, POP3 and IMAP',
      videoId: 'ch07-email-smtp-imap',
      blocks: [
        { type: 'paragraph', text: 'Email is asynchronous, so the sender and the receiver need not be online at the same time. Servers store messages and forward them, and the protocols divide into two jobs. SMTP pushes mail toward the destination, while POP3 or IMAP lets the recipient pull it from the mailbox.' },
        {
          type: 'points',
          items: [
            '**User agent (MUA)**: the program that reads and writes mail, such as Outlook, Thunderbird or a webmail page.',
            '**Submission agent (MSA)**: accepts mail from authenticated users, normally on port `587`.',
            '**Transfer agent (MTA)**: relays mail between domains with SMTP on TCP `25`, such as Postfix or Exchange.',
            '**Delivery agent (MDA)**: stores mail in the mailbox of the recipient.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch07-email-architecture',
          title: 'Email delivery architecture',
          caption: 'Alice submits mail with SMTP. Her relay finds the mail server of the destination through an MX lookup and pushes the message with SMTP. Bob later pulls it with IMAP or POP3.',
          kind: 'block',
          mermaid: `flowchart LR
    subgraph S1["Sender domain example.com"]
        A1["Alice mail client MUA"]
        A2["Submission server MSA"]
        A3["Outgoing relay MTA"]
    end
    D1["DNS lookup of MX for example.org"]
    subgraph S2["Receiver domain example.org"]
        B1["Incoming relay MTA"]
        B2["Mailbox store MDA"]
        B3["IMAP or POP3 access server"]
        B4["Bob mail client MUA"]
    end
    A1 -->|SMTP 587 with TLS| A2
    A2 -->|queue| A3
    A3 -->|MX query| D1
    D1 -->|MX answer| A3
    A3 -->|SMTP 25| B1
    B1 -->|deliver| B2
    B2 -->|read| B3
    B4 -->|IMAP 993 or POP3 995| B3
    B3 -->|messages| B4`,
        },
        {
          type: 'example',
          title: 'SMTP dialogue between two mail servers',
          steps: [
            'After TCP connects to port `25`, the server sends `220 mail.example.org ESMTP`.',
            'Client: `EHLO mail.example.com`. Server: `250-mail.example.org`, followed by its extensions such as `250 STARTTLS`.',
            'Client: `MAIL FROM:<alice@example.com>`. Server: `250 OK`.',
            'Client: `RCPT TO:<bob@example.org>`. Server: `250 OK`.',
            'Client: `DATA`. Server: `354 End data with <CR><LF>.<CR><LF>`.',
            'Client sends headers, a blank line, the body and a line with a single dot. Server: `250 OK queued`.',
            'Client: `QUIT`. Server: `221 Bye`.',
          ],
        },
        {
          type: 'table',
          headers: ['Feature', 'SMTP', 'POP3', 'IMAP'],
          rows: [
            ['Job', 'Send and relay (push)', 'Download (pull)', 'Remote mailbox access (pull)'],
            ['TCP ports', '`25`, `587`, `465`', '`110`, `995` with TLS', '`143`, `993` with TLS'],
            ['Where mail stays', 'Queue while in transit', 'Often removed after download', 'On the server'],
            ['Folders and sync', 'None', 'None', 'Folders, flags, server search, partial fetch'],
            ['Standard', 'RFC 5321', 'RFC 1939', 'RFC 9051'],
          ],
        },
        {
          type: 'points',
          items: [
            '**Envelope and message**: `MAIL FROM` and `RCPT TO` form the SMTP envelope. RFC 5322 defines the headers such as `From`, `To` and `Subject`.',
            '**MIME**: SMTP began as 7-bit ASCII, so MIME adds `Content-Type` and base64 encoding for attachments, which enlarges them by about 33 percent.',
            '**SPF**: a DNS `TXT` record that lists the servers allowed to send for a domain.',
            '**DKIM**: a signature added by the sending domain, with the public key published in DNS.',
            '**DMARC**: a DNS policy that tells receivers how to treat mail failing SPF and DKIM checks.',
          ],
        },
        { type: 'callout', variant: 'exam-tip', text: 'HTTP is mainly pull, and SMTP is push. SMTP cannot fetch mail from a mailbox, so a reader needs POP3, IMAP or webmail. HTTP sends each object in its own response, while SMTP places all objects of a mail in one multipart message.' },
        {
          type: 'command-lab',
          title: 'Find the mail servers of a domain',
          command: 'nslookup -type=MX example.com 8.8.8.8',
          output: `Server:  dns.google
Address:  8.8.8.8

Non-authoritative answer:
example.com     MX preference = 10, mail exchanger = mail1.example.com
example.com     MX preference = 20, mail exchanger = mail2.example.com

mail1.example.com       internet address = 203.0.113.25
mail2.example.com       internet address = 198.51.100.26`,
          explanation: [
            '`Server` and `Address` show the resolver that answered the query.',
            '`Non-authoritative answer` means that the reply came through a resolver and not from the zone itself.',
            '`preference = 10` wins, so a sending MTA tries `mail1` first and uses `mail2` as a backup.',
            'The last lines give the addresses to which SMTP connects on TCP `25`.',
          ],
        },
        { type: 'callout', variant: 'real-world', text: 'With webmail, the browser talks HTTPS to the provider, and only the server-to-server hop uses SMTP. Many residential ISPs block outbound port `25` to limit spam, so clients must submit on `587` or `465`. Most companies host on Microsoft 365 or Google Workspace by pointing their MX records there, and bulk senders must publish SPF, DKIM and DMARC or see mail rejected.' },
      ],
    },
    {
      id: 'ftp-rest-sockets-cdn',
      title: 'FTP, REST APIs, sockets and CDNs',
      blocks: [
        { type: 'paragraph', text: 'Several other tools complete the picture. FTP is the classic file transfer protocol, REST is the common way to build web APIs on HTTP, sockets are the programming interface below all of them, and CDNs link DNS and HTTP caching to deliver content from nearby servers.' },
        {
          type: 'points',
          items: [
            '**Two connections**: a control connection on TCP `21` stays open for the session, and a new data connection carries each file or listing.',
            '**Out-of-band control**: commands travel apart from the data, unlike HTTP. The server keeps state, such as the user and current directory.',
            '**Commands and replies**: `USER`, `PASS`, `LIST`, `RETR`, `STOR`, `PASV`, `PORT`, with replies such as `220`, `331`, `230`, `227`, `150` and `226`.',
            '**Security**: plain FTP sends passwords in clear text. Use SFTP (over SSH on port `22`) or FTPS (FTP with TLS). TFTP is a separate small protocol on UDP `69`, used for boot images and router firmware.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch07-ftp-passive',
          title: 'FTP download in passive mode',
          caption: 'Commands use the control connection on port 21. In passive mode the client also opens the data connection, to a port announced by the server.',
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant C as FTP client
    participant S as FTP server
    C->>S: TCP connect to port 21, control channel
    S->>C: 220 Service ready
    C->>S: USER and PASS
    S->>C: 230 User logged in
    C->>S: PASV
    S->>C: 227 Entering Passive Mode, port 50034
    C->>S: TCP connect to port 50034, data channel
    C->>S: RETR report.pdf on control channel
    S->>C: 150 Opening data connection
    S->>C: File bytes on data channel
    S->>C: 226 Transfer complete on control channel`,
        },
        {
          type: 'table',
          headers: ['Feature', 'Active mode', 'Passive mode'],
          rows: [
            ['Command', '`PORT 192,168,1,20,200,10`', '`PASV`, reply `227 Entering Passive Mode (192,0,2,10,195,114)`'],
            ['Data port', 'Client port `200 x 256 + 10 = 51210`', 'Server port `195 x 256 + 114 = 50034`'],
            ['Who connects', 'Server, from port `20` to the client', 'Client, to a high port on the server'],
            ['Client NAT', 'Often blocked, as NAT has no mapping', 'Works, but the server firewall must allow its port range'],
          ],
        },
        {
          type: 'points',
          items: [
            '**REST resource**: every object has a URL, such as `/v1/students/42`, and is usually represented as JSON.',
            '**Stateless**: each request carries everything needed, such as an `Authorization: Bearer` token, so any server behind the load balancer can answer.',
            '**Uniform interface**: standard methods and status codes, and responses can state whether they are cacheable.',
          ],
        },
        {
          type: 'table',
          headers: ['Action', 'Method and URL', 'Usual success status'],
          rows: [
            ['Create', '`POST /v1/students`', '`201 Created`'],
            ['Read', '`GET /v1/students/42`', '`200 OK`'],
            ['Replace', '`PUT /v1/students/42`', '`200 OK`'],
            ['Delete', '`DELETE /v1/students/42`', '`204 No Content`'],
          ],
        },
        {
          type: 'command-lab',
          title: 'Create a resource through a REST API',
          command: `curl -i -X POST https://api.example.com/v1/students -H 'Content-Type: application/json' -H 'Authorization: Bearer abc123' -d '{"name":"Asha","year":2}'`,
          output: `HTTP/2 201
content-type: application/json
location: /v1/students/42
cache-control: no-store

{"id":42,"name":"Asha","year":2}`,
          explanation: [
            '`-i` prints the response headers, `-X POST` sets the method and `-d` supplies the JSON body.',
            '`201` confirms that a new resource was created, and `location` gives its URL.',
            '`cache-control: no-store` stops caches from keeping this response.',
          ],
        },
        {
          type: 'points',
          items: [
            '**Socket types**: `SOCK_STREAM` uses TCP, and `SOCK_DGRAM` uses UDP.',
            '**TCP server calls**: `socket()`, `bind()`, `listen()`, `accept()`, `recv()`, `send()`, `close()`.',
            '**TCP client calls**: `socket()`, `connect()`, `send()`, `recv()`, `close()`.',
            '**UDP calls**: no `listen()` or `accept()`. Each datagram uses `sendto()` and `recvfrom()`.',
            '**Many clients on one port**: `accept()` returns a new socket per client, and the 4-tuple of source IP, source port, destination IP and destination port keeps connections apart.',
          ],
        },
        {
          type: 'command-lab',
          title: 'List open connections',
          command: 'netstat -ano | findstr ESTABLISHED',
          output: `  TCP    192.168.1.50:52144     203.0.113.10:443       ESTABLISHED     8124
  TCP    192.168.1.50:52145     203.0.113.10:443       ESTABLISHED     8124
  TCP    192.168.1.50:52198     198.51.100.25:443      ESTABLISHED     8124
  TCP    192.168.1.50:52210     203.0.113.25:993       ESTABLISHED     5560`,
          explanation: [
            'Columns are protocol, local socket, remote socket, state and process ID.',
            'The first two rows reach the same server and port, and they differ only by the local port.',
            'Port `443` means HTTPS, here from one browser process with PID `8124`.',
            'Port `993` means IMAP over TLS, from a mail client with PID `5560`.',
          ],
        },
        {
          type: 'points',
          items: [
            '**Problem**: a single origin is far from most users, which adds RTT, and all demand hits one site.',
            '**CDN**: a network of edge cache servers placed close to users, which serve copies of the content.',
            '**DNS link**: the site points `www` at a CDN name by `CNAME`. The DNS of the CDN returns a nearby edge based on resolver location and load, or one anycast address announced from many sites.',
            '**HTTP link**: edges obey `Cache-Control` and `ETag` like any shared cache. A miss goes to the origin, and the copy is stored.',
            '**Extras**: TLS termination near users, HTTP/3 support and absorption of DDoS traffic.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch07-cdn-routing',
          title: 'CDN request routing and edge caching',
          caption: 'DNS sends the user to a nearby edge, and HTTP caching decides whether the origin is contacted. Root and TLD steps are omitted for clarity.',
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant U as User browser
    participant R as Recursive resolver
    participant O as DNS of example.com
    participant D as DNS of the CDN
    participant E as Nearby edge server
    participant W as Origin web server
    U->>R: Query www.example.com
    R->>O: Query www.example.com
    O-->>R: CNAME www.example.com.cdn.example.net
    R->>D: Query the CDN name
    D-->>R: A 198.51.100.25, nearby edge
    R-->>U: CNAME and A 198.51.100.25
    U->>E: HTTPS GET /logo.png
    alt Edge cache hit
        E-->>U: 200 OK from cache
    else Edge cache miss
        E->>W: GET /logo.png
        W-->>E: 200 OK, max-age=86400
        E-->>U: 200 OK, copy stored
    end`,
        },
        {
          type: 'case-study',
          title: 'Results day at a university portal',
          scenario: 'A portal normally serves 500 requests per second from one origin. On results day demand reaches 20,000 requests per second, mostly for the same static files and landing page.',
          steps: [
            'Lower the DNS TTL to `300` s a day ahead, so that the change spreads quickly.',
            'Point `www.example.com` to `www.example.com.cdn.example.net` with a `CNAME`.',
            'Send `Cache-Control: public, max-age=86400` on versioned static files, and `s-maxage=60` on the landing page.',
            'At a 95 percent edge hit ratio, the origin gets `20,000 x 0.05 = 1,000` requests per second.',
            'Mark personal result pages `private, no-store`, so that an edge never shares them.',
          ],
        },
      ],
    },
    {
      id: 'url-to-page',
      title: 'End to end: what happens when you type a URL',
      blocks: [
        { type: 'paragraph', text: 'Typing a URL and pressing Enter triggers most of the protocols in this chapter, along with the layers below. This walk-through is a classic exam and interview question, and it is also the best way to troubleshoot. If you know the order of the steps, you can find the first step that fails.' },
        {
          type: 'diagram',
          id: 'ch07-url-journey',
          title: 'From URL to rendered page',
          caption: 'Caches can short-cut the path at several points. A redirect restarts the flow with a new URL. HTTP/3 replaces the separate TCP and TLS steps with one QUIC handshake.',
          kind: 'working-flowchart',
          mermaid: `flowchart TD
    A1["Type URL and press Enter"] --> A2["Parse scheme, host, port, path"]
    A2 --> B1{"Fresh copy in browser cache?"}
    B1 -->|Yes| G1["Render from cache"]
    B1 -->|No| B2{"IP of host in DNS cache?"}
    B2 -->|No| B3["Resolve name through DNS"]
    B2 -->|Yes| D1{"Open connection to reuse?"}
    B3 --> D1
    D1 -->|Yes| E1["Send HTTP request"]
    D1 -->|No| C1{"Destination on local subnet?"}
    C1 -->|Yes| C2["ARP for destination MAC"]
    C1 -->|No| C3["ARP for default gateway MAC"]
    C2 --> D2["TCP handshake to port 443 or 80"]
    C3 --> D2
    D2 --> D3{"Scheme is https?"}
    D3 -->|Yes| D4["TLS handshake and certificate check"]
    D3 -->|No| E1
    D4 --> E1
    E1 --> E2["Server or CDN returns response"]
    E2 --> F1{"Status class?"}
    F1 -->|3xx redirect| A2
    F1 -->|2xx success| G2["Parse HTML, fetch sub-resources"]
    F1 -->|4xx or 5xx| G3["Show error page"]
    G2 --> G4["Render page on screen"]`,
        },
        {
          type: 'points',
          items: [
            '**Network ready**: the host already has an IP address, mask, gateway and DNS server, usually from DHCP.',
            '**URL parsing**: the browser extracts the parts of the URL. HSTS may upgrade `http` to `https` before any packet leaves.',
            '**DNS**: the browser cache, the operating system cache and then the resolver are tried. The query itself travels through the gateway.',
            '**ARP**: a remote IP is reached by addressing the frame to the gateway MAC. ARP finds it if it is not already cached.',
            '**TCP and TLS**: the three-way handshake and then the TLS handshake. The home router applies NAT to the private source address on the way out.',
            '**HTTP exchange**: the `GET` reaches a CDN edge or load balancer, and perhaps an app server and database. The reply carries status, headers and body.',
            '**Rendering**: the browser parses the HTML, finds CSS, scripts and images, fetches them over the open connection and paints the page.',
          ],
        },
        { type: 'callout', variant: 'remember', text: 'Cold start order: DHCP, ARP, DNS, TCP, TLS, HTTP. Each step needs the one before it to have succeeded.' },
        {
          type: 'command-lab',
          title: 'Measure each phase of a page request',
          command: `curl -s -o /dev/null -w "dns=%{time_namelookup} tcp=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}\\n" https://www.example.com/`,
          output: 'dns=0.060214 tcp=0.100433 tls=0.140871 ttfb=0.201352 total=0.242118',
          explanation: [
            'All values are cumulative seconds from the start of the request.',
            '`dns=0.060` means that name lookup took about 60 ms.',
            '`tcp=0.100` means that the TCP handshake took about 40 ms, which is one RTT.',
            '`tls=0.141` means that the TLS handshake took about 40 ms, which fits one RTT of TLS 1.3.',
            '`ttfb=0.201` adds about 60 ms: one RTT of 40 ms and 20 ms of server work. `total=0.242` adds about 41 ms of download.',
          ],
        },
        {
          type: 'troubleshoot',
          symptom: 'A user reports that `https://www.example.com` does not open in the browser.',
          checks: [
            'Address: `ipconfig` shows a valid IP and gateway, not `169.254.x.x`.',
            'Reachability: `ping 192.168.1.1`, then `ping 8.8.8.8`, and `tracert 8.8.8.8` to find where the path stops.',
            'Name: `nslookup www.example.com` returns an address.',
            'Port: `Test-NetConnection www.example.com -Port 443` shows that the TCP test succeeded.',
            'Application: `curl -I https://www.example.com/` shows a status code. `4xx` points to the request, and `5xx` to the server.',
          ],
          fix: 'Fix the first step that fails, because all later steps depend on it. A certificate error at the TLS step points to the certificate, its chain or the clock on the client.',
        },
      ],
    },
  ],
  flashcards: [
    { front: 'What is the difference between recursive and iterative DNS queries?', back: 'Recursive: the server must return the final answer. Iterative: the server returns the answer or a referral to another server.' },
    { front: 'Which DNS record maps a name to an IPv6 address?', back: 'AAAA.' },
    { front: 'What does an MX record hold?', back: 'A mail server for the domain and a preference value. The lowest value has the highest priority.' },
    { front: 'What does DORA stand for?', back: 'Discover, Offer, Request, Acknowledge.' },
    { front: 'Which ports does DHCP use?', back: 'UDP 67 on the server and UDP 68 on the client.' },
    { front: 'What are T1 and T2 in DHCP?', back: 'T1 at 50 percent of the lease triggers a unicast renewal. T2 at 87.5 percent triggers a broadcast rebind.' },
    { front: 'What is a persistent HTTP connection?', back: 'One TCP connection stays open for several requests and responses, which saves a handshake per object.' },
    { front: 'Which transport does HTTP/3 use?', back: 'QUIC, which runs over UDP and includes TLS 1.3.' },
    { front: 'What does status 304 mean?', back: 'Not Modified. The cached copy is still valid, so no body is sent.' },
    { front: 'What is the difference between no-cache and no-store?', back: 'no-cache allows storing but requires revalidation before use. no-store forbids storing at all.' },
    { front: 'What does TLS provide to HTTPS?', back: 'Confidentiality, integrity and server authentication through certificates.' },
    { front: 'How do SMTP and IMAP differ?', back: 'SMTP pushes mail to servers. IMAP lets a reader access a mailbox kept on the server.' },
    { front: 'What is the difference between active and passive FTP?', back: 'In active mode the server opens the data connection. In passive mode the client opens it.' },
    { front: 'How does a CDN send users to a nearby server?', back: 'A CNAME leads to the DNS of the CDN, which returns a nearby edge address, or an anycast address is used.' },
  ],
  quiz: [
    {
      id: 'ch07-q1',
      question: 'Which DNS record type maps a host name to an IPv4 address?',
      options: ['AAAA', 'A', 'CNAME', 'PTR'],
      answerIndex: 1,
      explanation: 'An A record holds an IPv4 address. AAAA holds IPv6, CNAME holds an alias and PTR is used for reverse lookups.',
      difficulty: 'easy',
      topic: 'DNS and CDN',
    },
    {
      id: 'ch07-q2',
      question: 'What is the correct order of the DHCP address allocation messages?',
      options: ['Request, Discover, Acknowledge, Offer', 'Discover, Request, Offer, Acknowledge', 'Discover, Offer, Request, Acknowledge', 'Offer, Discover, Acknowledge, Request'],
      answerIndex: 2,
      explanation: 'The client discovers, the server offers, the client requests that offer and the server acknowledges it.',
      difficulty: 'easy',
      topic: 'DHCP',
    },
    {
      id: 'ch07-q3',
      question: 'Which HTTP status code means that the requested resource was not found on the server?',
      options: ['200', '301', '500', '404'],
      answerIndex: 3,
      explanation: '404 Not Found is a client error. 200 is success, 301 is a permanent redirect and 500 is a server error.',
      difficulty: 'easy',
      topic: 'HTTP',
    },
    {
      id: 'ch07-q4',
      question: 'Which protocol carries mail from the mail server of the sender to the mail server of the receiver?',
      options: ['SMTP', 'IMAP', 'POP3', 'FTP'],
      answerIndex: 0,
      explanation: 'SMTP pushes mail between servers. IMAP and POP3 are used by readers to access a mailbox.',
      difficulty: 'easy',
      topic: 'Email',
    },
    {
      id: 'ch07-q5',
      question: 'Which TCP port does the FTP control connection use by default?',
      options: ['20', '22', '21', '25'],
      answerIndex: 2,
      explanation: 'Port 21 carries FTP commands. Port 20 is the active mode data source, 22 is SSH and 25 is SMTP.',
      difficulty: 'easy',
      topic: 'FTP',
    },
    {
      id: 'ch07-q6',
      question: 'Which statement describes a peer-to-peer application?',
      options: ['All hosts download from one always-on server', 'Hosts exchange data directly, and each one adds upload capacity', 'Clients send requests but never upload any data', 'Every host must be a dedicated data centre server'],
      answerIndex: 1,
      explanation: 'Peers both consume and supply data, which makes P2P systems self-scaling.',
      difficulty: 'easy',
      topic: 'Models and sockets',
    },
    {
      id: 'ch07-q7',
      question: 'A recursive resolver contacts a root server, then a TLD server, then an authoritative server. What type of queries are these?',
      options: ['Recursive', 'Reverse', 'Zone transfer', 'Iterative'],
      answerIndex: 3,
      explanation: 'Each server replies with a referral or the answer, and the resolver itself asks the next server. That is iterative resolution.',
      difficulty: 'medium',
      topic: 'DNS and CDN',
    },
    {
      id: 'ch07-q8',
      question: 'Why is DHCPREQUEST normally broadcast even though the client has learned the server address from the offer?',
      options: ['So that the router can add the client to its routing table', 'So that every DHCP server learns which offer was accepted', 'Because UDP does not support unicast delivery', 'So that the switch can learn the MAC address of the server'],
      answerIndex: 1,
      explanation: 'The request names the chosen server ID. Other servers see it and return their offered addresses to the pool.',
      difficulty: 'medium',
      topic: 'DHCP',
    },
    {
      id: 'ch07-q9',
      question: 'A browser sends a GET with If-None-Match, and the resource has not changed. What does the server return?',
      options: ['304 Not Modified with no body', '200 OK with the full body', '204 No Content with a new cookie', '301 Moved Permanently with a Location header'],
      answerIndex: 0,
      explanation: 'A matching ETag means that the cached copy is valid, so the server sends 304 and no body.',
      difficulty: 'medium',
      topic: 'Caching and HTTPS',
    },
    {
      id: 'ch07-q10',
      question: 'A web server handles thousands of clients on TCP port 443 at once. What keeps the connections apart?',
      options: ['Each client uses a different server port', 'The server assigns each client a private MAC address', 'HTTP cookies select the connection in the kernel', 'The 4-tuple of source IP, source port, destination IP and destination port'],
      answerIndex: 3,
      explanation: 'TCP demultiplexes by the full 4-tuple, so all clients can share server port 443.',
      difficulty: 'medium',
      topic: 'Models and sockets',
    },
    {
      id: 'ch07-q11',
      question: 'A user reads one mailbox on a phone and a laptop and wants folders and read flags to stay in sync. Which choice fits best?',
      options: ['POP3 in download and delete mode', 'SMTP with STARTTLS', 'IMAP', 'MIME with base64'],
      answerIndex: 2,
      explanation: 'IMAP keeps mail, folders and flags on the server, so all devices see the same state.',
      difficulty: 'medium',
      topic: 'Email',
    },
    {
      id: 'ch07-q12',
      question: 'An observer on the path watches a TLS 1.3 HTTPS session without Encrypted ClientHello. What can the observer still read?',
      options: ['Cookie values', 'The server IP address and SNI host name', 'The URL path and query string', 'The response body'],
      answerIndex: 1,
      explanation: 'IP addresses, ports and usually SNI are visible. Headers, path, cookies and body are inside encrypted records.',
      difficulty: 'medium',
      topic: 'Caching and HTTPS',
    },
    {
      id: 'ch07-q13',
      question: 'A page has a base HTML file and 4 images. RTT is 50 ms and transmission time is negligible. What are the response times for serial non-persistent HTTP and for persistent HTTP without pipelining?',
      options: ['250 ms and 300 ms', '500 ms and 250 ms', '500 ms and 300 ms', '600 ms and 350 ms'],
      answerIndex: 2,
      explanation: 'Non-persistent: 5 objects x 2 RTT x 50 ms = 500 ms. Persistent: 1 RTT for TCP + 5 RTT for objects = 6 x 50 ms = 300 ms.',
      difficulty: 'hard',
      topic: 'HTTP',
    },
    {
      id: 'ch07-q14',
      question: 'Why does active mode FTP commonly fail when the client is behind home NAT, while passive mode works?',
      options: ['In active mode the server opens the data connection toward the client, and NAT has no mapping for it', 'In active mode the control connection uses UDP, which NAT drops', 'In passive mode the data travels over port 21 together with the commands', 'In passive mode NAT is bypassed because FTP uses public client addresses'],
      answerIndex: 0,
      explanation: 'NAT permits outbound connections. An unsolicited inbound connection from port 20 has no mapping, whereas in passive mode the client connects outward.',
      difficulty: 'hard',
      topic: 'FTP',
    },
    {
      id: 'ch07-q15',
      question: 'www.example.com is a CNAME for a name inside a CDN. What normally chooses the nearby edge server for a user?',
      options: ['The authoritative DNS of the CDN, using resolver location and edge load', 'The root server, using the country of the querying resolver', 'The origin server, by returning a 302 to every first request', 'The browser, by pinging every edge server before connecting'],
      answerIndex: 0,
      explanation: 'The CNAME hands resolution to the DNS of the CDN, which selects an edge. Root servers only refer queries to TLD servers.',
      difficulty: 'hard',
      topic: 'DNS and CDN',
    },
  ],
  importantQuestions: [
    {
      q: 'Differentiate between an A record and a CNAME record.',
      marks: 2,
      modelAnswer: 'An A record maps a name directly to an IPv4 address. A CNAME record maps a name to another name, its canonical name, which is then resolved further.',
    },
    {
      q: 'What is an idempotent HTTP method? Give two examples.',
      marks: 2,
      modelAnswer: 'Sending the same request many times has the same effect on the server as sending it once. PUT and DELETE are idempotent, while POST is not.',
    },
    {
      q: 'Explain recursive and iterative DNS resolution with an example.',
      marks: 5,
      modelAnswer: 'Recursive: the client asks its resolver with RD=1, and the resolver must return the final answer or an error.\nIterative: each server returns the answer or a referral, and the asker contacts the next server.\nExample for www.example.com with empty caches: the client sends a recursive query to the resolver. The resolver asks a root server and gets a referral to the .com servers, asks a .com server and gets a referral to ns1.example.com, and asks that server and gets the A record with its TTL. The resolver caches and returns it. This takes 8 messages in total.',
    },
    {
      q: 'Explain the DHCP DORA process. Mention ports and key fields.',
      marks: 5,
      modelAnswer: 'DHCP uses UDP, with server port 67 and client port 68.\n1. Discover: the client broadcasts from 0.0.0.0 to 255.255.255.255 with a transaction ID (xid) and its MAC in chaddr.\n2. Offer: a server proposes an address in yiaddr with lease time, mask, router and DNS options.\n3. Request: the client broadcasts its choice, with requested IP and server ID options, so other servers withdraw.\n4. Ack: the server commits the lease, and the client configures the address.\nRenewal happens at T1 (50 percent of the lease) by unicast, and rebinding at T2 (87.5 percent) by broadcast.',
    },
    {
      q: 'Compare HTTP/1.1, HTTP/2 and HTTP/3.',
      marks: 5,
      modelAnswer: 'HTTP/1.1: text messages over TCP, persistent connections by default and a mandatory Host header. Responses stay in order, so a slow response blocks others, and browsers open about 6 parallel connections per host.\nHTTP/2: binary frames over TCP, many multiplexed streams on one connection and HPACK header compression. One lost TCP segment still stalls all streams.\nHTTP/3: runs over QUIC on UDP, with independent streams, built-in TLS 1.3, QPACK compression, faster set-up and connection migration.',
    },
    {
      q: 'Explain in detail what happens when a user types https://www.example.com in a browser and presses Enter.',
      marks: 10,
      modelAnswer: '1. Preconditions: the host has an IP address, mask, gateway and DNS server, usually from DHCP DORA.\n2. Parsing: the browser extracts scheme, host, port 443 and path. HSTS may force HTTPS.\n3. Browser cache: a fresh copy is rendered at once, with no network traffic.\n4. DNS: the browser and OS caches are checked. Otherwise the stub sends a recursive query over UDP 53 to the resolver, which iterates through root, TLD and authoritative servers and returns the A or AAAA record.\n5. ARP: for a remote destination the host finds the MAC of the default gateway.\n6. Forwarding: routers forward packets hop by hop, and the home router applies NAT.\n7. TCP: SYN, SYN-ACK and ACK to port 443 take one RTT.\n8. TLS: ClientHello, ServerHello, certificate and Finished. The browser validates the certificate chain, host name and dates. TLS 1.3 takes one RTT.\n9. HTTP: the browser sends GET with Host and cookies. A CDN edge or load balancer answers from cache or forwards to the origin. The response holds a status code, headers and a body.\n10. Status handling: 3xx restarts with a new URL, and 4xx or 5xx shows an error.\n11. Rendering: the browser parses HTML, fetches CSS, scripts and images over the open connection, stores cacheable objects and paints the page.',
    },
    {
      q: 'Draw and explain the email delivery architecture. Compare SMTP, POP3 and IMAP.',
      marks: 10,
      modelAnswer: 'Path: sender MUA to MSA, then outgoing MTA, then receiver MTA, then MDA and mailbox, then access server, then receiver MUA.\n1. The MUA submits mail to the MSA with SMTP on port 587 with authentication and TLS.\n2. The outgoing MTA looks up the MX record of the destination domain in DNS and picks the lowest preference value.\n3. It opens TCP port 25 and runs EHLO, MAIL FROM, RCPT TO, DATA and QUIT.\n4. The receiving MTA passes the message to the MDA, which stores it in the mailbox.\n5. The recipient reads it with IMAP, POP3 or webmail over HTTPS.\nComparison:\nSMTP: push protocol for sending and relaying, on ports 25, 587 and 465.\nPOP3: pull protocol on ports 110 and 995, which downloads mail, often removes it from the server, and has no folders.\nIMAP: pull protocol on ports 143 and 993, which keeps mail on the server with folders and flags and suits several devices.\nSPF, DKIM and DMARC, published in DNS, protect domains against forged senders.',
    },
  ],
  numericals: [
    {
      question: 'A web page has a base HTML file and 10 images. RTT is 50 ms and each object has a transmission time of 10 ms. Find the total response time with serial non-persistent HTTP and with persistent HTTP without pipelining. Ignore DNS and server processing.',
      steps: [
        'Total objects = 1 + 10 = 11.',
        'Non-persistent time per object = 2 RTT + transmission = 2 x 50 + 10 = 110 ms.',
        'Non-persistent total = 11 x 110 = 1210 ms.',
        'Persistent: one TCP setup = 50 ms. Each object then takes RTT + transmission = 50 + 10 = 60 ms.',
        'Persistent total = 50 + 11 x 60 = 50 + 660 = 710 ms.',
        'Check: the saving of 1210 - 710 = 500 ms equals 10 avoided TCP handshakes at 50 ms each.',
      ],
      answer: 'Non-persistent 1210 ms and persistent 710 ms, a saving of 500 ms.',
    },
    {
      question: 'The RTT from a client to its resolver is 4 ms. The RTT from the resolver is 30 ms to a root server, 40 ms to a TLD server and 60 ms to the authoritative server. Find the lookup time with (a) an empty resolver cache, (b) the NS records of the domain already cached and (c) the final answer already cached.',
      steps: [
        '(a) The client waits for the resolver, which queries all three levels: 4 + 30 + 40 + 60 = 134 ms.',
        '(b) The resolver asks only the authoritative server: 4 + 60 = 64 ms.',
        '(c) The resolver answers from its cache: 4 ms.',
      ],
      answer: '(a) 134 ms, (b) 64 ms, (c) 4 ms.',
    },
    {
      question: 'A campus proxy cache has a hit ratio of 0.8. A hit takes 10 ms, and a miss takes 210 ms including the cache lookup. Direct access without the proxy takes 200 ms. Web demand is 100 Mbps, and the byte hit ratio equals the hit ratio. Find the average access time, the improvement over direct access and the remaining uplink traffic.',
      steps: [
        'Tavg = h x Thit + (1 - h) x Tmiss = 0.8 x 10 + 0.2 x 210.',
        'Tavg = 8 + 42 = 50 ms.',
        'Improvement = (200 - 50) / 200 = 0.75, which is 75 percent.',
        'Uplink traffic = 100 x (1 - 0.8) = 20 Mbps.',
      ],
      answer: 'Average 50 ms, an improvement of 75 percent, and 20 Mbps of uplink traffic.',
    },
    {
      question: 'An HTTPS page needs a DNS lookup of 60 ms. RTT to the server is 40 ms, and the server takes 20 ms to prepare a response. TCP takes 1 RTT and TLS 1.3 takes 1 RTT. Find the time to first byte (TTFB). Also find it with TLS 1.2 (2 RTT), and for a later request on the same connection.',
      steps: [
        'DNS = 60 ms.',
        'TCP handshake = 40 ms, giving 100 ms so far.',
        'TLS 1.3 handshake = 40 ms, giving 140 ms so far.',
        'Request and first byte = RTT + server time = 40 + 20 = 60 ms, giving 200 ms.',
        'TLS 1.2 adds one more RTT: 200 + 40 = 240 ms.',
        'A later request on the same connection needs only RTT + server time = 60 ms.',
      ],
      answer: '200 ms with TLS 1.3, 240 ms with TLS 1.2 and 60 ms on the reused connection.',
    },
  ],
  keyTerms: [
    'Socket: Software interface between an application process and the transport layer',
    'Stub resolver: OS library that sends DNS queries to a configured recursive resolver',
    'Recursive resolver: DNS server that finds the final answer for clients and caches it',
    'Authoritative server: DNS server that holds the original records of a zone',
    'TTL: Time in seconds for which a DNS answer may be reused from a cache',
    'CNAME: DNS record that makes one name an alias of another name',
    'MX record: DNS record that names the mail servers of a domain with a preference',
    'Persistent connection: One TCP connection reused for several HTTP exchanges',
    'QUIC: Encrypted UDP based transport protocol that carries HTTP/3',
    'Cookie: Small value set by a server and returned by the browser to keep state',
    'ETag: Version tag of a resource, used to revalidate a cached copy',
    'TLS: Protocol that gives HTTPS encryption, integrity and server authentication',
    'DORA: DHCP exchange of Discover, Offer, Request and Acknowledge',
    'Lease: Period for which a DHCP client may use an assigned IP address',
    'Relay agent: Router function that forwards DHCP broadcasts to a remote server',
    'MTA: Mail server that relays messages between domains using SMTP',
    'IMAP: Mail access protocol that keeps messages and folders on the server',
    'REST: API style using stateless HTTP methods on resources named by URLs',
    'CDN: Distributed edge servers that cache content close to users',
  ],
  formulas: [
    { name: 'Non-persistent HTTP, one object', expression: 'T = 2 RTT + Tt', note: 'One RTT for TCP setup, one for request and response, plus transmission time Tt = L / R.' },
    { name: 'Serial non-persistent HTTP, N objects', expression: 'T = N x (2 RTT + Tt)' },
    { name: 'Parallel non-persistent HTTP', expression: 'T = 2 RTT + ceil(M / P) x 2 RTT', note: 'M referenced objects, P parallel connections, transmission time ignored.' },
    { name: 'Persistent HTTP without pipelining', expression: 'T = RTT + N x (RTT + Tt)' },
    { name: 'Persistent HTTP with pipelining', expression: 'T = 3 RTT', note: 'TCP setup, base file, then all objects in one round, transmission time ignored.' },
    { name: 'DNS lookup with empty cache', expression: 'Tdns = RTTresolver + RTTroot + RTTtld + RTTauth' },
    { name: 'Average time with a cache', expression: 'Tavg = h x Thit + (1 - h) x Tmiss', note: 'h is the hit ratio.' },
    { name: 'Uplink traffic with a shared cache', expression: 'Uplink = Demand x (1 - byte hit ratio)' },
    { name: 'DHCP timers', expression: 'T1 = 0.5 x lease, T2 = 0.875 x lease' },
    { name: 'Time to first byte over HTTPS', expression: 'TTFB = Tdns + RTT + k x RTT + RTT + Tserver', note: 'k = 1 for TLS 1.3 and k = 2 for TLS 1.2.' },
    { name: 'Client-server file distribution', expression: 'Dcs = max(N x F / us, F / dmin)' },
    { name: 'P2P file distribution', expression: 'Dp2p = max(F / us, F / dmin, N x F / (us + sum of ui))' },
  ],
  handsOnChecklist: [
    'Run dig or nslookup for the A, AAAA, MX, NS and TXT records of a domain, and note each TTL.',
    'Run dig +trace on a name, and identify the root, TLD and authoritative steps in the output.',
    'Run ipconfig /release and ipconfig /renew with Wireshark display filter dhcp, and find the four DORA messages.',
    'Use curl -sI -L on an HTTP URL to read the redirect, the status codes and the cache headers.',
    'In Cisco Packet Tracer, configure a DHCP pool and ip helper-address, and confirm that PCs in two VLANs get addresses.',
    'Start python -m http.server 8000 --bind 127.0.0.1, request a page with curl, and find the listening socket with netstat -an.',
  ],
};

export default chapter;

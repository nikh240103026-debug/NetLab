import type { Chapter } from '@/lib/types';

const chapter: Chapter = {
  slug: 'security',
  number: 8,
  title: 'Network security',
  shortTitle: 'Security',
  summary:
    "Network security protects the confidentiality, integrity and availability of data and services. This chapter builds from cryptography, hashing and PKI to TLS and IPsec, then covers firewalls, ACLs, IDS and IPS, common attacks with their detection and defenses, and secure network and Wi-Fi design.",
  estMinutes: 85,
  learningObjectives: [
    "Relate attacks and controls to the CIA triad and define core security terms.",
    "Compare symmetric and asymmetric cryptography and solve small RSA and Diffie-Hellman problems.",
    "Explain hashing, digital signatures, certificates and how a browser validates a certificate chain.",
    "Trace the TLS 1.3 handshake and IPsec tunnel operation, and choose a suitable VPN type.",
    "Write and evaluate ACLs, and compare stateless, stateful and next generation firewalls with IDS and IPS.",
    "Detect and defend against ARP spoofing, DNS poisoning, DoS, MITM and phishing, and design a segmented network with a DMZ and secure Wi-Fi.",
  ],
  overviewVideoId: 'ch08-overview',
  sections: [
    {
      id: 'security-goals-cia',
      title: 'Security goals and the CIA triad',
      blocks: [
        {
          type: 'paragraph',
          text: "Network security is the practice of keeping data and services safe while they move across networks you do not fully control. Every control in this chapter, from a password to a firewall, exists to protect one of three goals: confidentiality, integrity or availability.",
        },
        {
          type: 'points',
          items: [
            "**Confidentiality**: only authorized parties can read the data. Main tools are encryption, such as AES inside TLS, and access control.",
            "**Integrity**: any change to data is detected. Main tools are hashes, HMACs and digital signatures.",
            "**Availability**: the service answers when legitimate users need it. Main tools are redundancy, rate limiting and DDoS protection.",
            "**Related services**: authentication proves who you are talking to, authorization decides what they may do, and non-repudiation stops a sender denying a signed action.",
          ],
        },
        {
          type: 'paragraph',
          text: "Security discussions use precise words. A **vulnerability** is a weakness, a **threat** is anything that could exploit it, and an **attack** is the actual attempt. **Risk** combines how likely an attack is with how much damage it would do.",
        },
        {
          type: 'table',
          headers: ['Attack example', 'Type', 'Goal harmed', 'Typical control'],
          rows: [
            ['Eavesdropping on open Wi-Fi', 'Passive', 'Confidentiality', 'TLS, WPA3, VPN'],
            ['Changing a packet in transit', 'Active', 'Integrity', 'HMAC, AEAD cipher, digital signature'],
            ['Flooding a web server', 'Active', 'Availability', 'Rate limiting, CDN, scrubbing'],
            ['Posing as a bank website', 'Active', 'Authentication, then confidentiality', 'Certificates, MFA, user awareness'],
          ],
        },
        {
          type: 'callout',
          variant: 'remember',
          text: "Passive attacks only observe traffic, so they are hard to detect and are best prevented with encryption. Active attacks inject or change traffic, so the focus shifts to detection and response.",
        },
        {
          type: 'points',
          items: [
            "**Defense in depth**: use several independent layers, so one failure does not expose everything.",
            "**Least privilege**: give each user, host and service only the access it needs.",
            "**Default deny**: block everything, then permit only what is required.",
            "**Detection and response**: assume some attacks will succeed, so keep logs and rehearse the response.",
          ],
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: "Security looks different at each scale. **Home**: a router with a stateful firewall and WPA3. **Office LAN**: firewalls, VLANs, 802.1X and central logging. **ISP**: source address filtering (BCP 38) and DDoS scrubbing. **Cloud**: security groups, identity policies and managed certificates.",
        },
      ],
    },
    {
      id: 'symmetric-asymmetric-crypto',
      title: 'Symmetric and asymmetric cryptography',
      videoId: 'ch08-symmetric-asymmetric-crypto',
      blocks: [
        {
          type: 'paragraph',
          text: "Cryptography turns readable **plaintext** into unreadable **ciphertext** using an algorithm and a key. The algorithm is public and all secrecy rests in the key, a rule known as Kerckhoffs's principle. The two families of cryptography differ in how keys are used and shared.",
        },
        {
          type: 'table',
          headers: ['Property', 'Symmetric', 'Asymmetric'],
          rows: [
            ['Keys', 'One shared secret key', 'Public and private key pair per owner'],
            ['Speed', 'Very fast, often in hardware', 'Far slower, not used for bulk data'],
            ['Key size for about 128-bit strength', '128 bits (AES-128)', '3072-bit RSA or 256-bit ECC'],
            ['Main job', 'Encrypting data', 'Key agreement, signatures, identity'],
            ['Main problem', 'Sharing keys safely, `N(N-1)/2` keys', 'Trusting that a public key is genuine'],
            ['Examples', 'AES, ChaCha20, 3DES (legacy)', 'RSA, ECDSA, Ed25519, X25519, Diffie-Hellman'],
          ],
        },
        {
          type: 'points',
          items: [
            "**DES**: 64-bit block with a 56-bit key. Brute force broke it, so it is now only of historical interest.",
            "**3DES**: applies DES three times. It is slow, keeps the small 64-bit block and has been retired by NIST.",
            "**AES**: 128-bit block with 128-, 192- or 256-bit keys using 10, 12 or 14 rounds. It is the default choice today.",
            "**ChaCha20-Poly1305**: a stream cipher with a 256-bit key and built-in authentication, fast on phones without AES hardware.",
            "**Modes of operation**: `ECB` leaks patterns and should not be used. `CBC` chains blocks using an IV. `GCM` is **AEAD**, meaning it encrypts and authenticates together.",
          ],
        },
        {
          type: 'paragraph',
          text: "In asymmetric cryptography each party owns a key pair. The public key can be given to anyone, while the private key is never shared. Anything encrypted with the public key can only be decrypted with the private key, and only the private key can produce a signature that the public key verifies.",
        },
        {
          type: 'points',
          items: [
            "**RSA**: security rests on the difficulty of factoring a large `n`. Use at least 2048-bit keys.",
            "**Elliptic curve cryptography (ECC)**: gives the same strength with much smaller keys, for example P-256 and X25519.",
            "**Diffie-Hellman (DH)**: two parties agree on a shared secret over an open channel. It encrypts nothing by itself, and it does not authenticate anyone.",
          ],
        },
        {
          type: 'callout',
          variant: 'formula',
          text: "RSA: `n = p x q`, `phi(n) = (p-1)(q-1)`, choose `e` coprime to `phi(n)`, then find `d` so that `e x d mod phi(n) = 1`. Encrypt with `C = M^e mod n` and decrypt with `M = C^d mod n`. Diffie-Hellman: `A = g^a mod p`, `B = g^b mod p`, shared secret `s = B^a mod p = A^b mod p`.",
        },
        {
          type: 'example',
          title: 'RSA with small primes (classroom numbers only)',
          steps: [
            "Choose `p = 3` and `q = 11`, so `n = 33` and `phi(n) = 2 x 10 = 20`.",
            "Choose `e = 7`, which shares no factor with 20. Then `d = 3`, because `7 x 3 = 21` and `21 mod 20 = 1`.",
            "The public key is `(7, 33)` and the private key is `(3, 33)`.",
            "Encrypt `M = 4`: `C = 4^7 mod 33 = 16384 mod 33 = 16`.",
            "Decrypt: `M = 16^3 mod 33 = 4096 mod 33 = 4`, which is the original message.",
          ],
        },
        {
          type: 'diagram',
          id: 'ch08-dh-exchange',
          title: 'Diffie-Hellman key agreement',
          caption: 'Only p, g, A and B cross the network. Each side combines the other public value with its own private value and reaches the same secret. Real systems use 2048-bit groups or elliptic curves and sign the exchange.',
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant A as Alice
    participant B as Bob
    Note over A,B: Public values p=23 and g=5
    Note over A: Private a=6
    Note over B: Private b=15
    A->>B: Public A = 5^6 mod 23 = 8
    B->>A: Public B = 5^15 mod 23 = 19
    Note over A: s = 19^6 mod 23 = 2
    Note over B: s = 8^15 mod 23 = 2
    Note over A,B: Shared secret 2 never crossed the network`,
        },
        {
          type: 'callout',
          variant: 'remember',
          text: "Encrypt with the **receiver's public key** for confidentiality. Sign with the **sender's private key** for authenticity. Plain DH has no identity check, so a man in the middle can run one exchange with each side unless the values are signed.",
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: "Almost every secure protocol is **hybrid**. TLS, IPsec, SSH and WPA3 use asymmetric methods to authenticate and agree on a key, then AES or ChaCha20 for the data. Laptops and servers speed up AES with CPU instructions such as AES-NI.",
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: "Key counting is a favorite question. For `N` users, pairwise symmetric keys are `N(N-1)/2`, while asymmetric needs `2N` keys, that is `N` pairs.",
        },
      ],
    },
    {
      id: 'hashing-signatures-pki',
      title: 'Hashing, digital signatures, certificates and PKI',
      blocks: [
        {
          type: 'paragraph',
          text: "Encryption hides data, but it does not prove who sent the data or whether it changed. Hash functions, MACs and signatures provide those proofs. Certificates then answer the last question: how do you know a public key really belongs to `www.example.com`?",
        },
        {
          type: 'points',
          items: [
            "**Fixed length**: any input gives a fixed-size digest, such as 256 bits for SHA-256.",
            "**Preimage resistance**: given a digest, finding an input that produces it is infeasible.",
            "**Second preimage resistance**: given one input, finding a different input with the same digest is infeasible.",
            "**Collision resistance**: finding any two inputs with the same digest is infeasible. The birthday bound for an `n`-bit hash is about `2^(n/2)` trials.",
            "**Avalanche effect**: changing one input bit changes about half of the output bits.",
          ],
        },
        {
          type: 'table',
          headers: ['Mechanism', 'Key', 'Integrity', 'Proves origin', 'Non-repudiation', 'Examples'],
          rows: [
            ['Hash', 'None', 'Only against accidents', 'No', 'No', 'SHA-256, SHA-3. MD5 and SHA-1 are broken'],
            ['MAC', 'Shared secret', 'Yes', 'Yes, between key holders', 'No', 'HMAC-SHA256, Poly1305'],
            ['Digital signature', 'Private to sign, public to verify', 'Yes', 'Yes', 'Yes', 'RSA-PSS, ECDSA, Ed25519'],
          ],
        },
        {
          type: 'paragraph',
          text: "A **digital signature** is made by hashing the message and then applying the sender's private key to the hash. The receiver hashes the message independently and uses the sender's public key to check the signature. A signature gives no confidentiality, because the message itself is still readable.",
        },
        {
          type: 'example',
          title: 'Signing and verifying with the same small RSA key',
          steps: [
            "Alice hashes her message and, in this toy example, gets `h = 5`.",
            "She signs with her private key `(3, 33)`: `S = 5^3 mod 33 = 125 mod 33 = 26`.",
            "She sends the message together with `S = 26`.",
            "Bob hashes the received message himself and also gets `h = 5`.",
            "Bob applies Alice's public key `(7, 33)`: `26^7 mod 33 = 5`. The values match, so the signature is valid.",
            "If one bit of the message changed, the hash would differ and the check would fail. Real RSA signatures also add padding such as PSS.",
          ],
        },
        {
          type: 'paragraph',
          text: "A **certificate** is a signed document that binds a public key to a name. The X.509 format is used in TLS, and a **certificate authority (CA)** signs it after checking that the applicant controls the name. The system of CAs, policies and trust stores is called **public key infrastructure (PKI)**.",
        },
        {
          type: 'points',
          items: [
            "**Subject Alternative Name (SAN)**: the names the certificate covers. Browsers match the hostname against this field.",
            "**Public key, issuer and signature**: the subject's key, the CA that vouches for it, and the CA's signature over the certificate.",
            "**Validity**: the `Not Before` and `Not After` dates, plus a serial number used for revocation.",
            "**Extensions**: `Basic Constraints` says whether it may act as a CA, while `Key Usage` and `Extended Key Usage` limit its purpose.",
          ],
        },
        {
          type: 'diagram',
          id: 'ch08-cert-chain',
          title: 'Certificate chain of trust',
          caption: 'Each certificate is signed by the one above it. The server sends the leaf and the intermediate. The root is already in the trust store and anchors the chain.',
          kind: 'block',
          mermaid: `flowchart TD
    subgraph S1["Browser or OS trust store"]
        R1["Root CA - self-signed, key offline"]
    end
    subgraph S2["Sent by the server during TLS"]
        I1["Intermediate CA - issues leaf certs"]
        L1["Leaf cert - SAN www.example.com"]
    end
    subgraph S3["Held only by the server"]
        K1["Private key matching the leaf"]
    end
    R1 -->|signs| I1
    I1 -->|signs| L1
    K1 -->|proves ownership of| L1`,
        },
        {
          type: 'diagram',
          id: 'ch08-cert-validation',
          title: 'How a browser validates a server certificate',
          caption: 'Any failed check stops the connection or shows a warning. Exact order and revocation behavior vary by browser, but all of these checks must pass.',
          kind: 'working-flowchart',
          mermaid: `flowchart TD
    A1["Receive Certificate message"] --> A2{"Each issuer signature valid?"}
    A2 -->|No| X1["Abort and show warning"]
    A2 -->|Yes| A3{"Chain reaches trusted root?"}
    A3 -->|No| X1
    A3 -->|Yes| A4{"All certs within validity dates?"}
    A4 -->|No| X1
    A4 -->|Yes| A5{"Hostname matches SAN?"}
    A5 -->|No| X1
    A5 -->|Yes| A6{"Revoked per CRL or OCSP?"}
    A6 -->|Yes| X1
    A6 -->|No| A7{"CertificateVerify signature valid?"}
    A7 -->|No| X1
    A7 -->|Yes| A8["Trust server and continue handshake"]`,
        },
        {
          type: 'points',
          items: [
            "**Root CA**: a self-signed trust anchor preinstalled in operating systems and browsers. Its key is kept offline.",
            "**Intermediate CA**: signed by the root and used for daily issuing, so a compromise can be contained without replacing the root.",
            "**Revocation**: a **CRL** is a signed list of revoked serial numbers, and **OCSP** answers a query about one certificate. With OCSP stapling the server attaches the signed answer itself.",
            "**Certificate Transparency**: public append-only logs let domain owners spot certificates issued wrongly for their names.",
          ],
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: "Public websites automate certificates through the **ACME** protocol, used by Let's Encrypt. Automation matters because the CA/Browser Forum schedule cuts the maximum lifetime of public certificates in steps down to 47 days by 2029. Companies also run a private CA for internal servers and push its root to staff devices.",
        },
        {
          type: 'mini-lab',
          title: 'Sign a file and detect tampering with OpenSSL',
          goal: 'See that a signature verifies only for the exact file that was signed.',
          steps: [
            "Create a key: `openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out private.pem`.",
            "Extract the public key: `openssl pkey -in private.pem -pubout -out public.pem`.",
            "Create `note.txt` with any text, then sign it: `openssl dgst -sha256 -sign private.pem -out note.sig note.txt`.",
            "Verify it: `openssl dgst -sha256 -verify public.pem -signature note.sig note.txt`.",
            "Change one character in `note.txt` and run the verify command again.",
          ],
          expected: "The first verification prints `Verified OK`. After the edit, OpenSSL reports a verification failure because the hash no longer matches the signature.",
        },
      ],
    },
    {
      id: 'tls-handshake',
      title: 'TLS and the handshake',
      videoId: 'ch08-tls-handshake',
      blocks: [
        {
          type: 'paragraph',
          text: "**Transport Layer Security (TLS)** sits between TCP and the application and gives it confidentiality, integrity and server authentication. HTTPS is HTTP over TLS on TCP port `443`, and QUIC builds TLS 1.3 into a UDP-based transport. SSL and TLS 1.0 and 1.1 are deprecated, so modern systems use TLS 1.2 or 1.3.",
        },
        {
          type: 'points',
          items: [
            "**Negotiate**: agree on the TLS version, cipher suite and key exchange group.",
            "**Authenticate**: the server proves its identity with a certificate and a signature. Client certificates are optional and give mutual TLS.",
            "**Agree on keys**: both sides derive fresh session keys from ephemeral (EC)DHE values.",
            "**Confirm**: `Finished` messages cover the whole handshake transcript, so tampering or a forced downgrade is caught.",
          ],
        },
        {
          type: 'diagram',
          id: 'ch08-tls13-handshake',
          title: 'TLS 1.3 full handshake after TCP',
          caption: 'The client can send encrypted application data one round trip after the TCP handshake completes. Everything after ServerHello is encrypted.',
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant C as Client
    participant S as Server
    C->>S: TCP SYN
    S->>C: TCP SYN-ACK
    C->>S: TCP ACK
    Note over C,S: TLS 1.3 handshake starts
    C->>S: ClientHello with key_share, SNI, ciphers
    S->>C: ServerHello with key_share, chosen cipher
    Note over C,S: Both derive handshake keys using HKDF
    S->>C: EncryptedExtensions
    S->>C: Certificate chain
    S->>C: CertificateVerify signature
    S->>C: Finished
    C->>C: Validate chain and signature
    C->>S: Finished
    Note over C,S: Application traffic keys in use
    C->>S: HTTP request in encrypted record
    S->>C: HTTP response in encrypted record`,
        },
        {
          type: 'points',
          items: [
            "**ClientHello**: lists versions and cipher suites and carries a `key_share` and the server name in the `server_name` (SNI) extension.",
            "**ServerHello**: picks a cipher suite and returns its own `key_share`. Both sides can now compute the same secret and derive keys with HKDF.",
            "**Certificate and CertificateVerify**: the first delivers the chain. The second is a signature over the handshake so far, which proves the server holds the private key.",
            "**Finished**: an HMAC over the transcript, sent by both sides.",
            "**Record protocol**: application data is split into records and protected with an AEAD cipher such as `TLS_AES_128_GCM_SHA256`.",
          ],
        },
        {
          type: 'table',
          headers: ['Feature', 'TLS 1.2 (RFC 5246)', 'TLS 1.3 (RFC 8446)'],
          rows: [
            ['Full handshake', '2 round trips', '1 round trip, optional 0-RTT on resumption'],
            ['Key exchange', 'RSA key transport or (EC)DHE', '(EC)DHE, or PSK for resumption'],
            ['Forward secrecy', 'Only with (EC)DHE', 'Always in full handshakes'],
            ['Ciphers', 'CBC and AEAD suites', 'AEAD suites only'],
            ['Certificate on the wire', 'Cleartext', 'Encrypted'],
            ['Key derivation', 'TLS PRF', 'HKDF'],
          ],
        },
        {
          type: 'paragraph',
          text: "**Forward secrecy** means that stealing a server's long-term private key later does not decrypt recorded sessions. The session keys came from ephemeral values that were deleted, and the certificate key only signed the handshake. This is why TLS 1.3 removed RSA key transport.",
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: "Asymmetric cryptography in TLS handles authentication and key agreement, and symmetric cryptography carries the data. Be ready to state that `CertificateVerify` proves key possession and `Finished` protects the transcript.",
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: "Most sites terminate TLS at a load balancer, reverse proxy or CDN rather than on each application server. **HSTS** tells browsers to use only HTTPS for a site, and service meshes use **mutual TLS** between microservices. Browsers and CDNs are also deploying hybrid post-quantum key exchange such as `X25519MLKEM768`.",
        },
        {
          type: 'command-lab',
          title: 'Inspect a TLS session and its chain with openssl s_client',
          command: 'openssl s_client -connect www.example.com:443 -servername www.example.com',
          output: `CONNECTED(00000003)
depth=2 C = US, O = Example Trust, CN = Example Trust Root G2
verify return:1
depth=1 C = US, O = Example Trust, CN = Example Issuing CA R3
verify return:1
depth=0 CN = www.example.com
verify return:1
---
Certificate chain
 0 s:CN = www.example.com
   i:C = US, O = Example Trust, CN = Example Issuing CA R3
 1 s:C = US, O = Example Trust, CN = Example Issuing CA R3
   i:C = US, O = Example Trust, CN = Example Trust Root G2
---
Peer signing digest: SHA256
Peer signature type: RSA-PSS
Server Temp Key: X25519, 253 bits
---
SSL handshake has read 3187 bytes and written 412 bytes
Verification: OK
---
New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384
Server public key is 2048 bit
Verify return code: 0 (ok)`,
          explanation: [
            "`CONNECTED(00000003)`: the TCP connection succeeded. The number is only a local socket handle.",
            "`depth=2` to `depth=0`: OpenSSL checks from the root down to the leaf, and `verify return:1` means that step passed.",
            "`Certificate chain`: entry 0 is the leaf and entry 1 is the intermediate. The issuer (`i:`) of 0 equals the subject (`s:`) of 1, which is what makes it a chain. The root is not sent.",
            "`Peer signature type: RSA-PSS`: the algorithm used for the `CertificateVerify` signature.",
            "`Server Temp Key: X25519, 253 bits`: the ephemeral key exchange value, which is the source of forward secrecy.",
            "`New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384`: TLS 1.3 with AES-256-GCM for records and SHA-384 inside HKDF.",
            "`Verification: OK` and `Verify return code: 0 (ok)`: the chain validated against the local trust store.",
          ],
        },
        {
          type: 'wireshark',
          filter: 'tls.handshake.type == 1 or tls.handshake.type == 2',
          whatToLook: [
            "Type 1 is ClientHello. Expand it to find server_name, supported_versions and key_share.",
            "Type 2 is ServerHello. Note the chosen cipher suite. The legacy version field shows 0x0303, while supported_versions shows 0x0304 for TLS 1.3.",
            "Later handshake messages appear as Application Data records, because TLS 1.3 encrypts the certificate.",
            "Use the filter tls.alert_message to find handshake failures in other captures.",
          ],
        },
        {
          type: 'troubleshoot',
          symptom: "A browser shows a certificate error for an internal HTTPS site, while the server itself is running.",
          checks: [
            "Run `openssl s_client -connect intranet.example.com:443 -servername intranet.example.com` and read `Verify return code`.",
            "Code `10` means the certificate has expired. Also confirm that the client clock is correct.",
            "Codes `20` and `21` usually mean a missing intermediate or a private root that is not in the client's trust store.",
            "Check the name with `openssl x509 -noout -ext subjectAltName -in server.crt`. The common name alone is not enough for browsers.",
          ],
          fix: "Renew an expired certificate, configure the server to send the leaf plus intermediates, deploy the private root to clients, or reissue the certificate with the correct SAN.",
        },
      ],
    },
    {
      id: 'ipsec-vpn',
      title: 'IPsec and VPN types',
      videoId: 'ch08-vpn-tunnels',
      blocks: [
        {
          type: 'paragraph',
          text: "TLS protects one application connection at a time. **IPsec** works at the network layer, so it can protect all IP traffic between two hosts or sites without changing applications. A **virtual private network (VPN)** uses protection of this kind to build a private path over a shared network.",
        },
        {
          type: 'points',
          items: [
            "**ESP (IP protocol 50)**: provides encryption, integrity and anti-replay protection. Nearly all deployments use it.",
            "**AH (IP protocol 51)**: provides integrity and origin authentication, including unchanging IP header fields. It has no encryption and it does not survive NAT.",
            "**IKE (UDP 500)**: authenticates the peers and negotiates keys. IKEv2 (RFC 7296) is current. When NAT is detected, traffic moves to UDP `4500` (NAT-T).",
            "**Security Association (SA)**: a one-way agreement on keys and algorithms, identified by a 32-bit **SPI**. A two-way tunnel needs at least two SAs.",
          ],
        },
        {
          type: 'table',
          headers: ['Feature', 'Transport mode', 'Tunnel mode'],
          rows: [
            ['What is protected', 'Payload of the original packet', 'The entire original packet'],
            ['New outer IP header', 'No', 'Yes'],
            ['ESP packet layout', '`IP + ESP + TCP + data + trailer + ICV`', '`New IP + ESP + inner IP + TCP + data + trailer + ICV`'],
            ['Typical use', 'Host to host inside a trusted network', 'Gateway to gateway VPN, remote access'],
          ],
        },
        {
          type: 'diagram',
          id: 'ch08-ikev2-setup',
          title: 'IKEv2 setup followed by ESP data',
          caption: 'Two exchanges create the IKE SA and the first pair of child SAs. Data then flows in ESP, and each direction has its own SPI and keys.',
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant A as GatewayA
    participant B as GatewayB
    Note over A,B: IKE on UDP 500, moves to UDP 4500 if NAT is found
    A->>B: IKE_SA_INIT proposals, DH value, nonce
    B->>A: IKE_SA_INIT chosen proposal, DH value, nonce
    Note over A,B: IKE SA keys derived, later messages encrypted
    A->>B: IKE_AUTH identity, proof, child SA offer
    B->>A: IKE_AUTH identity, proof, chosen child SA
    Note over A,B: Pair of ESP SAs installed, one per direction
    A->>B: ESP packet with SPI and sequence number
    B->>A: ESP reply with its own SPI`,
        },
        {
          type: 'diagram',
          id: 'ch08-vpn-tunnel',
          title: 'Site-to-site VPN tunnel at work',
          caption: 'Internet routers see only the outer header between the two gateways. The private addresses and the payload stay encrypted inside ESP in tunnel mode.',
          kind: 'working-diagram',
          mermaid: `flowchart LR
    subgraph S1["Site A 10.1.0.0/16"]
        H1["Host 10.1.0.10"]
        G1["Gateway A 198.51.100.1"]
    end
    subgraph S2["Public Internet"]
        T1["Outer IP 198.51.100.1 to 203.0.113.2"]
        T2["ESP protocol 50 hides inner packet"]
    end
    subgraph S3["Site B 10.2.0.0/16"]
        G2["Gateway B 203.0.113.2"]
        H2["Server 10.2.0.20"]
    end
    H1 -->|1 plain packet| G1
    G1 -->|2 encrypt and encapsulate| T1
    T1 -->|3 routed on outer header| T2
    T2 -->|4 verify and decrypt| G2
    G2 -->|5 plain packet| H2`,
        },
        {
          type: 'table',
          headers: ['VPN type', 'What it connects', 'Common technology', 'Typical user'],
          rows: [
            ['Site-to-site', 'Two networks through gateways', 'IPsec tunnel mode with IKEv2', 'Branch office, cloud connection'],
            ['Remote access', 'One device to a company network', 'IKEv2, WireGuard, TLS VPN on TCP 443', 'Staff working from home'],
            ['MPLS L3VPN', 'Customer sites inside a provider network', 'MPLS labels and VRFs, not encrypted by default', 'Enterprise WAN'],
            ['SD-WAN', 'Many sites over several WAN links', 'IPsec overlays with central policy', 'Multi-branch company'],
            ['Zero trust access', 'One user to one application', 'TLS broker with identity and device checks', 'Replacing broad network access'],
          ],
        },
        {
          type: 'points',
          items: [
            "**Full tunnel**: all client traffic goes through the VPN. Inspection is easier, but company bandwidth carries everything.",
            "**Split tunnel**: only company prefixes use the VPN. It is faster, but the device talks to the Internet directly while connected.",
            "**WireGuard**: a modern, small VPN that runs over UDP with Curve25519 and ChaCha20-Poly1305. Its default port is `51820`.",
            "**GRE (IP protocol 47)**: only encapsulates and gives no encryption, so it is often carried inside IPsec.",
          ],
        },
        {
          type: 'command-lab',
          title: 'Check a site-to-site tunnel on a Cisco router',
          command: 'show crypto ipsec sa',
          output: `interface: GigabitEthernet0/1
    Crypto map tag: VPN-MAP, local addr 198.51.100.1

   local  ident (addr/mask/prot/port): (10.1.0.0/255.255.0.0/0/0)
   remote ident (addr/mask/prot/port): (10.2.0.0/255.255.0.0/0/0)
   current_peer 203.0.113.2 port 500
    #pkts encaps: 4821, #pkts encrypt: 4821, #pkts digest: 4821
    #pkts decaps: 4790, #pkts decrypt: 4790, #pkts verify: 4790
    #send errors 0, #recv errors 0

     local crypto endpt.: 198.51.100.1, remote crypto endpt.: 203.0.113.2
     current outbound spi: 0x9A3F21C7(2587828679)

     inbound esp sas:
      spi: 0x5D10E4B2(1561388210)
        transform: esp-256-aes esp-sha256-hmac ,
        in use settings ={Tunnel, }
        replay detection support: Y
        Status: ACTIVE(ACTIVE)

     outbound esp sas:
      spi: 0x9A3F21C7(2587828679)
        transform: esp-256-aes esp-sha256-hmac ,
        in use settings ={Tunnel, }
        Status: ACTIVE(ACTIVE)`,
          explanation: [
            "`local ident` and `remote ident`: the traffic this SA protects, here `10.1.0.0/16` to `10.2.0.0/16`.",
            "`current_peer 203.0.113.2 port 500`: the remote gateway. Port `4500` would appear if NAT-T were in use.",
            "`#pkts encaps` and `#pkts decaps`: both counters are rising, so traffic flows both ways. If encaps rises while decaps stays at 0, check the return path and the peer's configuration.",
            "`#send errors 0, #recv errors 0`: no packets failed during processing.",
            "`spi`: inbound and outbound values differ, which confirms that SAs are one-way.",
            "`transform: esp-256-aes esp-sha256-hmac`: ESP with AES-256 for encryption and HMAC-SHA-256 for integrity.",
            "`in use settings ={Tunnel, }` and `Status: ACTIVE(ACTIVE)`: tunnel mode is in use and the SA is working.",
          ],
        },
        {
          type: 'troubleshoot',
          symptom: "A site-to-site tunnel is up and ping works, but file transfers and some HTTPS pages stall.",
          checks: [
            "Confirm with `show crypto ipsec sa` that encaps and decaps counters both rise and errors stay at 0.",
            "Test the path MTU from a Windows host with `ping -f -l 1372 10.2.0.20`, or from Linux with `ping -M do -s 1372 10.2.0.20`. Both send a 1400-byte packet with DF set.",
            "ESP tunnel mode adds roughly 50 to 70 bytes, so a full 1500-byte packet will not fit.",
            "Check whether a firewall blocks ICMP type 3 code 4, which path MTU discovery depends on.",
          ],
          fix: "Lower the tunnel size with `ip mtu 1400`, clamp TCP with `ip tcp adjust-mss 1360`, and permit ICMP type 3 code 4 through firewalls.",
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: "**Cloud**: an AWS Site-to-Site VPN connection gives two IPsec tunnels for redundancy, usually with BGP. **Office**: a branch router builds IPsec to head office. **Home**: staff use a remote access client, often with MFA, and many routers now offer WireGuard.",
        },
      ],
    },
    {
      id: 'firewalls-acl-ids',
      title: 'Firewalls, ACLs, IDS and IPS',
      videoId: 'ch08-firewall-acl',
      blocks: [
        {
          type: 'paragraph',
          text: "A **firewall** enforces a security policy at the boundary between network zones. It can be a dedicated appliance, software on a host or a cloud service. Its rules decide which traffic may cross, and its logs show what was attempted.",
        },
        {
          type: 'table',
          headers: ['Type', 'What it inspects', 'Strength', 'Weakness', 'Where you find it'],
          rows: [
            ['Stateless packet filter', 'Each packet alone: IPs, ports, protocol, flags', 'Very fast and simple', 'No memory of connections, so return rules are broad', 'Router ACLs, AWS network ACLs'],
            ['Stateful firewall', 'Headers plus a table of active connections', 'Return traffic allowed automatically, invalid packets dropped', 'Blind to application content', 'Home routers, enterprise edge, AWS security groups'],
            ['Next generation firewall (NGFW)', 'Layers 3 to 7: application and user identity, IPS, optional TLS inspection', 'Policy by application and user', 'Cost, throughput limits, privacy concerns with TLS inspection', 'Enterprise edge and data center'],
            ['Web application firewall (WAF)', 'HTTP requests and responses', 'Filters web attacks such as SQL injection', 'Protects web applications only', 'In front of websites, CDNs'],
          ],
        },
        {
          type: 'diagram',
          id: 'ch08-stateful-firewall',
          title: 'How a stateful firewall handles a packet',
          caption: 'A packet of an existing flow is checked against the state table. Only a packet with no state entry is checked against the rule base, which makes established traffic fast.',
          kind: 'working-flowchart',
          mermaid: `flowchart TD
    P1["Packet arrives on interface"] --> P2{"5-tuple in state table?"}
    P2 -->|Yes| P3{"Valid for TCP state and sequence?"}
    P3 -->|Yes| P4["Forward and refresh idle timer"]
    P3 -->|No| P5["Drop and log invalid packet"]
    P2 -->|No| P6{"Policy rule permits new flow?"}
    P6 -->|No| P7["Drop or reject and log"]
    P6 -->|Yes| P8{"Valid start such as TCP SYN?"}
    P8 -->|No| P5
    P8 -->|Yes| P9["Create state entry with timeout"]
    P9 --> P10["Apply NAT if set and forward"]
    P4 --> P11["FIN, RST or timeout removes entry"]`,
        },
        {
          type: 'paragraph',
          text: "An **access control list (ACL)** is an ordered list of permit and deny entries applied to an interface in one direction. Routers and switches check ACLs in hardware, so they are widely used for basic filtering. A router ACL is stateless unless a stateful feature is added.",
        },
        {
          type: 'points',
          items: [
            "**First match wins**: entries are checked top down and checking stops at the first match, so order matters.",
            "**Implicit deny**: every ACL ends with an invisible `deny ip any any`.",
            "**One per direction**: an interface takes one ACL per protocol per direction.",
            "**Standard ACL** (1-99, 1300-1999): matches the source IP only, so place it close to the destination.",
            "**Extended ACL** (100-199, 2000-2699): matches source, destination, protocol and port, so place it close to the source.",
            "**Wildcard masks**: the inverse of a subnet mask. `/24` is `0.0.0.255`, `host` means `0.0.0.0` and `any` means `255.255.255.255`.",
            "**The `established` keyword**: `permit tcp any 192.168.10.0 0.0.0.255 established` matches only packets with ACK or RST set. It approximates state, but it does not track real connections.",
          ],
        },
        {
          type: 'diagram',
          id: 'ch08-acl-evaluation',
          title: 'ACL evaluation order',
          caption: 'Entries are tested in sequence order. The first match decides the result, and a packet matching nothing is dropped by the implicit deny.',
          kind: 'flowchart',
          mermaid: `flowchart TD
    A1["Packet reaches interface with ACL"] --> A2["Start at lowest sequence number"]
    A2 --> A3{"Packet matches this entry?"}
    A3 -->|Yes| A4{"Entry action is permit?"}
    A4 -->|Yes| A5["Forward packet and stop checking"]
    A4 -->|No| A6["Drop packet and stop checking"]
    A3 -->|No| A7{"More entries left?"}
    A7 -->|Yes| A8["Move to next entry"]
    A8 --> A3
    A7 -->|No| A9["Implicit deny drops packet"]`,
        },
        {
          type: 'example',
          title: 'Configure an extended ACL on an edge router',
          steps: [
            "`ip access-list extended OUTSIDE-IN` creates a named extended ACL and enters its configuration mode.",
            "`permit tcp any host 203.0.113.10 eq 443` allows HTTPS from any source to the public address of the web server.",
            "`permit tcp any host 203.0.113.10 eq 80` allows HTTP so that the server can redirect visitors to HTTPS.",
            "`permit udp any host 203.0.113.53 eq 53` allows DNS queries to the public authoritative DNS server.",
            "`deny ip any any log` makes the implicit deny visible and logs each drop, which helps detection.",
            "`interface GigabitEthernet0/0` followed by `ip access-group OUTSIDE-IN in` applies the ACL to traffic entering from the Internet. Inbound ACLs are checked before NAT, so the entries use public addresses.",
          ],
        },
        {
          type: 'command-lab',
          title: 'Verify the ACL and its hit counters',
          command: 'show access-lists OUTSIDE-IN',
          output: `Extended IP access list OUTSIDE-IN
    10 permit tcp any host 203.0.113.10 eq 443 (18427 matches)
    20 permit tcp any host 203.0.113.10 eq www (1092 matches)
    30 permit udp any host 203.0.113.53 eq domain (5310 matches)
    40 deny ip any any log (2764 matches)`,
          explanation: [
            "`Extended IP access list OUTSIDE-IN`: the ACL type and name.",
            "`10`, `20`, `30`, `40`: sequence numbers, assigned in steps of 10, so a new entry can be inserted between them.",
            "`eq www` and `eq domain`: IOS shows well-known ports by name. `www` is port `80` and `domain` is port `53`.",
            "`(18427 matches)`: packets that hit the entry. A counter stuck at 0 can mean the entry is shadowed by an earlier one or the ACL is on the wrong interface.",
            "`40 deny ip any any log (2764 matches)`: traffic that was dropped and logged. A sudden rise is an early sign of scanning or a misconfiguration.",
          ],
        },
        {
          type: 'troubleshoot',
          symptom: "After an ACL is applied to a router interface, the OSPF neighbor drops and some users lose access.",
          checks: [
            "Run `show ip interface GigabitEthernet0/0` to confirm which ACL is applied and in which direction.",
            "Run `show access-lists` and see which counters rise. The final deny rising shows wanted traffic falling through.",
            "Remember the implicit deny also blocks OSPF (IP protocol 89), DNS replies and ICMP unless they are permitted.",
            "Check that a broad entry higher up is not shadowing a more specific entry below it.",
          ],
          fix: "Add the missing entries, such as `permit ospf any any`, in the correct sequence position. Put specific entries before general ones, and test during a maintenance window with console access available.",
        },
        {
          type: 'paragraph',
          text: "Firewalls decide what may pass, but allowed traffic can still be malicious. An **intrusion detection system (IDS)** watches traffic and raises alerts. An **intrusion prevention system (IPS)** sits in the traffic path and can also block it.",
        },
        {
          type: 'table',
          headers: ['Feature', 'IDS', 'IPS'],
          rows: [
            ['Placement', 'Out of band, on a SPAN port or TAP', 'Inline in the traffic path'],
            ['Action', 'Alerts only', 'Drops packets, resets sessions, also alerts'],
            ['Effect of device failure', 'Traffic continues, visibility is lost', 'Can stop traffic unless it fails open'],
            ['Cost of a false positive', 'Wasted analyst time', 'Legitimate traffic blocked'],
          ],
        },
        {
          type: 'points',
          items: [
            "**Signature detection**: matches known attack patterns. It is precise but misses new attacks.",
            "**Anomaly detection**: compares traffic to a learned baseline. It can catch new attacks but raises more false positives.",
            "**Network and host sensors**: NIDS watches a network segment and HIDS runs on one host. Encrypted traffic pushes more detection onto hosts.",
            "**Alert quality**: a false positive alerts on harmless traffic, and a false negative misses a real attack. Rare attacks mean even a good sensor produces many false alerts.",
          ],
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: "Common open source sensors are **Suricata**, **Snort** and **Zeek**. Enterprises feed their alerts, with firewall and server logs, into a **SIEM** so analysts can correlate events. In the cloud, security groups are stateful per instance, network ACLs are stateless per subnet, and managed services offer IDS functions.",
        },
      ],
    },
    {
      id: 'attacks-and-defenses',
      title: 'Common attacks: detection and defense',
      videoId: 'ch08-common-attacks-defense',
      blocks: [
        {
          type: 'paragraph',
          text: "Most network attacks abuse a protocol that trusts too much or a person who trusts too much. For each attack below, learn the idea, the warning signs and the defense. Test only on networks you own or are authorized to assess, because unauthorized testing is illegal in most countries.",
        },
        {
          type: 'paragraph',
          text: "**ARP spoofing**: ARP has no authentication, and most hosts accept replies they never asked for. A host on the same LAN falsely claims the gateway's IP address with its own MAC, so victims send it their outbound traffic.",
        },
        {
          type: 'points',
          items: [
            "**Signs**: the gateway MAC changes, one MAC maps to several IPs in `arp -a`, and `arpwatch` or switch logs report flip-flops.",
            "**Defense**: DHCP snooping with **Dynamic ARP Inspection (DAI)**, static entries for critical hosts, small VLANs, and TLS so that intercepted traffic stays unreadable.",
          ],
        },
        {
          type: 'paragraph',
          text: "**DNS poisoning**: a resolver caches whatever answer it accepts. If a forged response matches the 16-bit transaction ID, source port and question, and arrives before the real one, the resolver stores a false address and serves it to every client until the TTL expires.",
        },
        {
          type: 'points',
          items: [
            "**Signs**: answers differ from a trusted resolver without a CDN reason, unexpected TTLs appear, and users see certificate warnings on familiar sites.",
            "**Defense**: source port randomization, **DNSSEC** validation, patched resolvers, closed recursion for outsiders, and DoT or DoH to protect the path between client and resolver. TLS certificate checks catch many redirects.",
          ],
        },
        {
          type: 'paragraph',
          text: "**DoS and DDoS**: the goal is to exhaust a resource so that real users are refused. Attacks may fill the link (volumetric), consume connection state (a **SYN flood** leaves half-open connections) or overload the application (HTTP floods). A DDoS uses many sources, and reflection uses spoofed requests so that open servers send large replies to the victim.",
        },
        {
          type: 'points',
          items: [
            "**Signs**: traffic far above the NetFlow or sFlow baseline, many `SYN_RECV` entries, a high ratio of SYNs to completed handshakes, and rising latency.",
            "**Defense**: SYN cookies, rate limiting, anycast and CDNs, ISP scrubbing centers, remote triggered black holing, closing open resolvers, and source address filtering (BCP 38).",
          ],
        },
        {
          type: 'paragraph',
          text: "**Man in the middle (MITM)**: the attacker gets into the path, then relays and possibly alters traffic while each side believes it is talking directly to the other. The position usually comes from ARP spoofing, DNS poisoning or a rogue access point, so MITM is often the goal of those attacks.",
        },
        {
          type: 'points',
          items: [
            "**Signs**: certificate warnings, an unexpected issuer on a known site, or a site that suddenly falls back to HTTP.",
            "**Defense**: strict certificate validation, HSTS, authenticated key exchange, mutual TLS where suitable, and a VPN on untrusted Wi-Fi. Users should never click through certificate warnings.",
          ],
        },
        {
          type: 'paragraph',
          text: "**Phishing**: deceptive messages persuade people to reveal credentials, approve a login or run malware. **Spear phishing** targets a named person with convincing details. It succeeds even on a perfectly configured network, because it attacks human judgment.",
        },
        {
          type: 'points',
          items: [
            "**Signs**: look-alike domains, urgency, mismatched links, and failed SPF, DKIM or DMARC checks in the mail headers.",
            "**Defense**: SPF, DKIM and DMARC on mail domains, URL and attachment filtering, user reporting, and MFA. FIDO2 and WebAuthn keys are bound to the real site, so a fake site cannot use them.",
          ],
        },
        {
          type: 'diagram',
          id: 'ch08-attack-defense',
          title: 'From symptom to likely attack and defense',
          caption: 'A simple triage path for a network team. Real incidents need evidence from logs and captures, and many faults that look like attacks turn out to be ordinary failures.',
          kind: 'flowchart',
          mermaid: `flowchart TD
    S1["Suspicious network symptom"] --> Q1{"Service slow or unreachable?"}
    Q1 -->|Yes| Q2{"Traffic far above baseline?"}
    Q2 -->|Yes| D1["Suspect DoS or DDoS"]
    D1 --> F1["Rate limit, SYN cookies, scrubbing"]
    Q2 -->|No| R1["Check faults and capacity"]
    Q1 -->|No| Q3{"Certificate warning in browser?"}
    Q3 -->|Yes| Q4{"DNS answer differs from trusted?"}
    Q4 -->|Yes| D3["DNS poisoning likely"]
    D3 --> F2["Flush cache, validate with DNSSEC"]
    Q4 -->|No| Q5{"Gateway MAC changed in ARP table?"}
    Q5 -->|Yes| D4["ARP spoofing likely"]
    D4 --> F3["Enable DHCP snooping and DAI"]
    Q5 -->|No| F4["Treat as MITM, inspect path, use VPN"]
    Q3 -->|No| Q6{"User got link asking for login?"}
    Q6 -->|Yes| D5["Suspect phishing"]
    D5 --> F5["Reset password, enforce MFA"]
    Q6 -->|No| L1["Keep monitoring logs and alerts"]`,
        },
        {
          type: 'table',
          headers: ['Attack', 'Layer abused', 'Goal harmed', 'Best first defense'],
          rows: [
            ['ARP spoofing', 'Link, inside one LAN', 'Confidentiality, integrity', 'Dynamic ARP Inspection'],
            ['DNS poisoning', 'Application, resolver cache', 'Integrity of name resolution', 'DNSSEC validation, port randomization'],
            ['SYN flood', 'Transport', 'Availability', 'SYN cookies, upstream filtering'],
            ['MITM', 'Any, usually via other attacks', 'Confidentiality, integrity', 'TLS with strict validation'],
            ['Phishing', 'Human user', 'Confidentiality of credentials', 'Phishing-resistant MFA, mail authentication'],
          ],
        },
        {
          type: 'command-lab',
          title: 'Read the ARP table for signs of spoofing (Windows)',
          command: 'arp -a',
          output: `Interface: 192.168.1.20 --- 0x7
  Internet Address      Physical Address      Type
  192.168.1.1           00-1a-2b-3c-4d-5e     dynamic
  192.168.1.30          00-1a-2b-3c-4d-5e     dynamic
  192.168.1.40          f4-8e-38-11-22-33     dynamic
  192.168.1.255         ff-ff-ff-ff-ff-ff     static
  224.0.0.22            01-00-5e-00-00-16     static`,
          explanation: [
            "`Interface: 192.168.1.20`: the local adapter this table belongs to.",
            "`192.168.1.1` is the gateway and `00-1a-2b-3c-4d-5e` is the MAC this host currently believes it has.",
            "`192.168.1.30` shows the **same MAC** as the gateway. This is the warning sign. It needs checking, because a router with two addresses or proxy ARP can look the same.",
            "`192.168.1.40`: a normal entry with its own MAC, learned dynamically.",
            "`192.168.1.255` and `224.0.0.22`: static broadcast and multicast mappings, which are normal on Windows.",
            "Compare the gateway entry with a recorded baseline or the router's real MAC using `show interfaces` on the router.",
          ],
        },
        {
          type: 'example',
          title: 'Enable DHCP snooping and Dynamic ARP Inspection on an access switch',
          steps: [
            "`ip dhcp snooping` and `ip dhcp snooping vlan 10` make the switch learn IP, MAC, VLAN and port bindings from DHCP exchanges.",
            "`ip arp inspection vlan 10` checks ARP messages arriving on untrusted ports in VLAN 10 against that binding table.",
            "On the uplink, use `interface GigabitEthernet0/24`, then `ip dhcp snooping trust` and `ip arp inspection trust`. Only ports toward trusted infrastructure are trusted.",
            "Hosts with static IPs have no DHCP binding, so permit them with an `arp access-list` and `ip arp inspection filter`, or their ARP traffic will be dropped.",
            "Verify with `show ip dhcp snooping binding` and `show ip arp inspection statistics vlan 10`.",
          ],
        },
        {
          type: 'wireshark',
          filter: 'arp.opcode == 2 or arp.duplicate-address-detected',
          whatToLook: [
            "ARP replies (opcode 2) that have no matching earlier request on your own network.",
            "One sender MAC address claiming several sender IP addresses, especially the gateway IP.",
            "Wireshark expert notes that report a duplicate use of an IP address.",
            "A steady repeating stream of replies for the gateway, which is unusual on a healthy LAN.",
          ],
        },
        {
          type: 'mini-lab',
          title: 'Build a personal ARP and DNS baseline',
          goal: 'Know what normal looks like, so that a change stands out.',
          steps: [
            "On your own network, find the gateway with `ipconfig` or `ip route`, then record its MAC from `arp -a` or `ip neigh`.",
            "Confirm no unexpected pair of IP addresses shares a MAC.",
            "Compare DNS answers with `nslookup example.com` and `nslookup example.com 8.8.8.8`.",
            "Run `dig example.com +dnssec` and look for the `ad` flag, which a validating resolver sets for authenticated data.",
            "Repeat on another day and compare the results.",
          ],
          expected: "The gateway MAC stays the same and no surprise duplicates appear. DNS answers may differ for large sites because CDNs return nearby servers, so check the owner of each address before suspecting poisoning.",
        },
        {
          type: 'case-study',
          title: 'Certificate warnings in a campus lab',
          scenario: "Students in one lab report certificate warnings on familiar HTTPS sites, and two laptops show the gateway `192.168.1.1` with MAC `00-1a-2b-3c-4d-5e`, which is not the router's real MAC.",
          steps: [
            "**Collect evidence**: the team saves `arp -a` output and a short packet capture from a lab PC.",
            "**Locate the source**: `show mac address-table address 001a.2b3c.4d5e` on the switch points to one access port.",
            "**Contain**: the port is shut down and the attached PC is examined. It is found to be infected with malware.",
            "**Fix the design gap**: DHCP snooping and DAI are enabled on the lab VLAN, and the lab is separated from staff networks.",
            "**Lesson**: TLS warnings did their job. Users who stopped at the warning exposed no passwords, so the team also adds this point to user awareness training.",
          ],
        },
        {
          type: 'troubleshoot',
          symptom: "A Linux web server is slow to accept new connections, while existing sessions and the link still work.",
          checks: [
            "Count half-open connections with `ss -tan state syn-recv | wc -l` and compare them with the normal value.",
            "Look in the kernel log for `Possible SYN flooding on port 443`.",
            "Confirm protection with `sysctl net.ipv4.tcp_syncookies`, which should return `1`.",
            "Compare flow records with the baseline to see the sources, ports and traffic volume.",
          ],
          fix: "Keep SYN cookies on, rate limit new connections at the firewall or load balancer, and ask the upstream ISP or DDoS provider to filter traffic if the link is saturated.",
        },
      ],
    },
    {
      id: 'secure-design-wifi',
      title: 'Secure network design and Wi-Fi security',
      blocks: [
        {
          type: 'paragraph',
          text: "Good design limits what an attacker can reach after one failure. The network is divided into zones of different trust, and traffic between zones must pass a policy point such as a firewall. Public servers are the most exposed, so they are kept apart from internal systems.",
        },
        {
          type: 'points',
          items: [
            "**DMZ**: a separate zone for services the Internet must reach, such as web, mail relay and public DNS.",
            "**Firewall layouts**: a three-legged firewall uses one device with outside, DMZ and inside interfaces. A dual firewall design places the DMZ between two devices, which is stronger but costs more.",
            "**Segmentation**: VLANs and subnets separate users, servers, voice, IoT and guests, with ACLs or firewalls controlling inter-VLAN traffic.",
            "**North-south and east-west**: north-south traffic crosses the network edge, while east-west traffic moves between internal systems. Attackers move east-west after gaining entry.",
            "**Microsegmentation and zero trust**: policy is applied per workload, and every request is verified by identity and device rather than trusted for its network location.",
            "**Management plane**: admin access goes through a hardened jump host with MFA on a separate management network.",
          ],
        },
        {
          type: 'diagram',
          id: 'ch08-dmz-architecture',
          title: 'Dual firewall DMZ architecture',
          caption: 'Only published services reach the DMZ, and only one application port goes from the DMZ inward. The database is reachable only from the application tier, and an IDS sensor receives a copy of traffic.',
          kind: 'block',
          mermaid: `flowchart TD
    I1["Internet"] --> R1["Edge router with anti-spoofing ACL"]
    R1 --> F1["Outer firewall - NGFW"]
    subgraph S1["DMZ 172.16.10.0/24"]
        W1["Reverse proxy and WAF"]
        W2["Public web server"]
        W3["Mail relay and public DNS"]
    end
    subgraph S2["Internal zones"]
        A1["App servers VLAN 20"]
        D1["Database VLAN 30"]
        U1["Staff LAN VLAN 40"]
        M1["Management VLAN 99"]
    end
    F1 -->|allow 443| W1
    F1 -->|allow 25 and 53| W3
    W1 --> W2
    W2 -->|one app port| F2["Inner firewall"]
    F2 --> A1
    A1 -->|SQL port only| D1
    U1 -->|outbound via proxy| F2
    M1 -->|SSH via jump host| F2
    F1 -.->|copy of traffic| N1["IDS sensor and SIEM"]`,
        },
        {
          type: 'table',
          headers: ['From', 'To', 'Default policy'],
          rows: [
            ['Internet', 'DMZ', 'Permit published services only, such as TCP `443` and TCP `25`'],
            ['Internet', 'Internal', 'Deny all'],
            ['DMZ', 'Internal', 'Deny, except one application port from the web tier'],
            ['Internal', 'DMZ', 'Permit required application and admin traffic'],
            ['Internal', 'Internet', 'Permit through a proxy or filter, and log it'],
            ['Management', 'All devices', 'Permit SSH and HTTPS from the jump host only'],
          ],
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: "If asked why a web server belongs in a DMZ, say this: it must accept connections from untrusted users, so it is the most likely host to be compromised. The DMZ stops that compromise from giving direct access to the internal network.",
        },
        {
          type: 'paragraph',
          text: "Wi-Fi sends frames through the air, so anyone in range can capture them. Wi-Fi security therefore needs both encryption and authentication at the link layer. **Personal** mode uses one shared passphrase, while **Enterprise** mode uses 802.1X to authenticate each user.",
        },
        {
          type: 'table',
          headers: ['Standard', 'Encryption', 'Authentication', 'Status'],
          rows: [
            ['WEP', 'RC4 with a 24-bit IV', 'Shared key', 'Broken, never use'],
            ['WPA', 'TKIP, based on RC4', 'PSK or 802.1X', 'Deprecated'],
            ['WPA2', 'AES-CCMP', 'PSK or 802.1X, with four-way handshake', 'Acceptable with a long passphrase'],
            ['WPA3', 'AES-CCMP or AES-GCMP', 'SAE or 802.1X, protected management frames required', 'Preferred'],
          ],
        },
        {
          type: 'diagram',
          id: 'ch08-wpa2-handshake',
          title: 'WPA2 four-way handshake',
          caption: 'The handshake proves both sides know the PMK without sending it. In WPA2-Personal, a captured handshake allows offline guessing of weak passphrases, which is the gap WPA3 SAE closes.',
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant C as Client
    participant P as AccessPoint
    Note over C,P: Both hold the PMK from passphrase or 802.1X
    P->>C: Message 1 ANonce
    Note over C: Derive PTK from PMK, nonces and MACs
    C->>P: Message 2 SNonce and MIC
    Note over P: Derive same PTK and check MIC
    P->>C: Message 3 encrypted GTK and MIC
    C->>P: Message 4 ACK and MIC
    Note over C,P: Install keys and start encrypted data`,
        },
        {
          type: 'points',
          items: [
            "**SAE in WPA3**: each password guess needs a live exchange with the access point, and past traffic stays protected if the password leaks later.",
            "**802.1X roles**: the client is the supplicant, the access point is the authenticator, and a RADIUS server authenticates the user. **EAP-TLS** with certificates is the strongest common method.",
            "**Threats to watch**: rogue access points, evil twin networks with a copied SSID, and forged deauthentication frames, which protected management frames stop.",
            "**Good practice**: use WPA3 or WPA2-AES, a long passphrase, a separate guest VLAN, wireless intrusion detection, and disable WPS.",
            "**Not real protection**: hiding the SSID or filtering MAC addresses, because both values can be seen in the air.",
          ],
        },
        {
          type: 'case-study',
          title: 'Securing a small online retailer',
          scenario: "A 60-person retailer runs its web shop, database and staff PCs on one flat `192.168.1.0/24` network behind a single router, with one shared Wi-Fi password. A compromise of the web server would expose everything.",
          steps: [
            "**Segment**: create separate VLANs for servers, database, staff, management and guests, each with its own subnet.",
            "**Add a DMZ**: place the web shop behind a firewall and WAF, publishing only TCP `443` to the Internet.",
            "**Protect data**: allow the database only from application servers on its SQL port, and encrypt that link with TLS.",
            "**Control administration**: permit SSH and HTTPS management only from a jump host with MFA.",
            "**Connect sites**: build a site-to-site IPsec tunnel to the warehouse, and give remote staff an IKEv2 or WireGuard client with MFA.",
            "**Fix Wi-Fi**: move staff to WPA2 or WPA3-Enterprise with 802.1X, and put guests on a separate VLAN with Internet access only.",
            "**Watch**: send firewall, IDS and server logs to a SIEM, and alert on any traffic hitting deny rules between DMZ and internal zones.",
          ],
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: "**Home**: use WPA3 where available and keep IoT devices on the guest network. **Campus and office**: use WPA2 or WPA3-Enterprise with eduroam-style 802.1X. **Cloud**: a public subnet with a load balancer acts as the DMZ, and a private subnet holds application and database tiers, with security groups between them.",
        },
      ],
    },
  ],
  flashcards: [
    { front: 'What does the CIA triad stand for?', back: 'Confidentiality, integrity and availability, the three core goals of security.' },
    { front: 'Symmetric versus asymmetric cryptography in one line?', back: 'Symmetric uses one shared key and is fast. Asymmetric uses a public and private key pair and is slower.' },
    { front: 'Why do real protocols use hybrid encryption?', back: 'Asymmetric methods solve authentication and key agreement, then fast symmetric ciphers carry the data.' },
    { front: 'How does an HMAC differ from a plain hash?', back: 'An HMAC uses a shared secret key, so an attacker who changes data cannot compute a valid tag.' },
    { front: 'How is a digital signature made and checked?', back: 'Hash the message and sign the hash with the private key. The receiver rehashes and verifies using the public key.' },
    { front: 'What does a certificate bind together?', back: 'A public key and a name, with a CA signature vouching for the link.' },
    { front: 'What is forward secrecy?', back: 'Stealing a long-term private key later cannot decrypt recorded sessions, because session keys came from ephemeral values.' },
    { front: 'How many round trips does a full handshake take in TLS 1.2 and TLS 1.3?', back: 'TLS 1.2 takes 2 round trips and TLS 1.3 takes 1 round trip, not counting the TCP handshake.' },
    { front: 'AH versus ESP?', back: 'ESP (IP protocol 50) encrypts and authenticates. AH (IP protocol 51) only authenticates and does not work through NAT.' },
    { front: 'Transport mode versus tunnel mode?', back: 'Transport protects the payload and keeps the original IP header. Tunnel protects the whole packet and adds a new IP header.' },
    { front: 'What two rules govern ACL processing?', back: 'First match wins, and an implicit deny drops anything that matches no entry.' },
    { front: 'IDS versus IPS?', back: 'An IDS is out of band and alerts only. An IPS is inline and can block traffic.' },
    { front: 'Which switch features stop ARP spoofing?', back: 'DHCP snooping builds a binding table and Dynamic ARP Inspection drops ARP messages that do not match it.' },
    { front: 'What is a DMZ?', back: 'A separate zone for public-facing servers, isolated by firewalls from both the Internet and the internal network.' },
  ],
  quiz: [
    {
      id: 'ch08-q1',
      question: 'A botnet floods a college web portal so that students cannot log in. Which security goal is directly harmed?',
      options: ['Confidentiality', 'Integrity', 'Availability', 'Non-repudiation'],
      answerIndex: 2,
      explanation: 'The portal cannot serve legitimate users, so availability is lost. No data needs to be read or changed for this attack to succeed.',
      difficulty: 'easy',
      topic: 'CIA triad',
    },
    {
      id: 'ch08-q2',
      question: 'Which of these is a symmetric cipher?',
      options: ['AES', 'RSA', 'ECDSA', 'Diffie-Hellman'],
      answerIndex: 0,
      explanation: 'AES uses the same key to encrypt and decrypt. RSA and ECDSA are asymmetric, and Diffie-Hellman is a key agreement method.',
      difficulty: 'easy',
      topic: 'Cryptography',
    },
    {
      id: 'ch08-q3',
      question: 'What is a basic property of a cryptographic hash function?',
      options: [
        'It can be reversed with a secret key',
        'It produces a fixed-length digest from any input',
        'Its output is always longer than its input',
        'It needs a public and private key pair',
      ],
      answerIndex: 1,
      explanation: 'A hash maps input of any size to a fixed-size digest, such as 256 bits for SHA-256. It is one-way and uses no key.',
      difficulty: 'easy',
      topic: 'Hashing and signatures',
    },
    {
      id: 'ch08-q4',
      question: 'Which attack falsely links the gateway IP address to another host MAC address on a LAN?',
      options: ['Phishing', 'DNS poisoning', 'SYN flood', 'ARP spoofing'],
      answerIndex: 3,
      explanation: 'ARP spoofing sends false ARP messages so that hosts map the gateway IP to the wrong MAC. DNS poisoning corrupts name records, not MAC mappings.',
      difficulty: 'easy',
      topic: 'Attacks and defenses',
    },
    {
      id: 'ch08-q5',
      question: 'What happens to a packet that matches no entry in a Cisco ACL?',
      options: [
        'It is forwarded normally',
        'It is dropped by the implicit deny',
        'It is sent to the default gateway for checking',
        'It is checked against the next interface ACL',
      ],
      answerIndex: 1,
      explanation: 'Every ACL ends with an invisible deny ip any any, so an unmatched packet is dropped.',
      difficulty: 'easy',
      topic: 'Firewalls and ACLs',
    },
    {
      id: 'ch08-q6',
      question: 'Where should a public web server normally be placed in a secure network design?',
      options: ['In the DMZ', 'On the staff LAN', 'In the database VLAN', 'In the management VLAN'],
      answerIndex: 0,
      explanation: 'A DMZ isolates exposed servers, so a compromise there does not give direct access to internal systems.',
      difficulty: 'easy',
      topic: 'Secure design and Wi-Fi',
    },
    {
      id: 'ch08-q7',
      question: 'A team of 20 people needs a separate symmetric key for every pair. How many keys are required?',
      options: ['40', '380', '190', '400'],
      answerIndex: 2,
      explanation: 'The count is N(N-1)/2 = 20 x 19 / 2 = 190. The value 40 is the 2N key count for asymmetric pairs, and 380 forgets to divide by 2.',
      difficulty: 'medium',
      topic: 'Cryptography',
    },
    {
      id: 'ch08-q8',
      question: 'Which key does a browser use to verify the CA signature on the leaf certificate of www.example.com?',
      options: [
        'The private key of www.example.com',
        'The public key of www.example.com',
        'The private key of the issuing CA',
        'The public key of the issuing CA',
      ],
      answerIndex: 3,
      explanation: 'The issuing CA signs with its private key, and anyone can verify using its public key, which is found in the intermediate certificate.',
      difficulty: 'medium',
      topic: 'PKI',
    },
    {
      id: 'ch08-q9',
      question: 'Which switch feature drops ARP messages whose IP and MAC do not match the DHCP snooping binding table?',
      options: ['Dynamic ARP Inspection', 'BPDU Guard', 'Storm control', 'Port mirroring'],
      answerIndex: 0,
      explanation: 'DAI validates ARP on untrusted ports against the bindings. BPDU Guard protects Spanning Tree, storm control limits floods, and mirroring only copies traffic.',
      difficulty: 'medium',
      topic: 'Attacks and defenses',
    },
    {
      id: 'ch08-q10',
      question: 'Why does a stateful firewall need fewer rules than a stateless filter to allow outbound web browsing?',
      options: [
        'It encrypts all reply traffic',
        'Replies match a state table entry created by the outbound connection',
        'It ignores port numbers completely',
        'It terminates TLS on behalf of every client',
      ],
      answerIndex: 1,
      explanation: 'The outbound flow creates a state entry, so replies pass automatically. A stateless filter must have separate broad rules for the return traffic.',
      difficulty: 'medium',
      topic: 'Firewalls and ACLs',
    },
    {
      id: 'ch08-q11',
      question: 'Which statement correctly separates an IPS from an IDS?',
      options: [
        'An IDS sits inline, while an IPS uses a SPAN port',
        'An IDS uses only anomaly detection, while an IPS uses only signatures',
        'An IPS sits inline and can drop traffic, while an IDS only alerts',
        'An IPS runs only on hosts, while an IDS runs only on networks',
      ],
      answerIndex: 2,
      explanation: 'Placement decides the capability. An inline IPS can block, while an out of band IDS sees a copy of the traffic and can only alert. Both can use either detection method.',
      difficulty: 'medium',
      topic: 'IDS and IPS',
    },
    {
      id: 'ch08-q12',
      question: 'In TLS 1.3, which message proves that the server holds the private key for its certificate?',
      options: ['ClientHello', 'EncryptedExtensions', 'ServerHello', 'CertificateVerify'],
      answerIndex: 3,
      explanation: 'CertificateVerify is a signature over the handshake transcript made with the private key. The Certificate message alone is public information that anyone could replay.',
      difficulty: 'medium',
      topic: 'TLS',
    },
    {
      id: 'ch08-q13',
      question: 'Someone records TLS 1.3 traffic today and steals the server certificate private key next year. Why can the recording still not be decrypted?',
      options: [
        'The certificate will have expired by then',
        'Session keys came from deleted ephemeral (EC)DHE values, and the certificate key only signed the handshake',
        'TLS 1.3 does not use symmetric encryption',
        'TCP headers are encrypted, so traffic cannot be recorded',
      ],
      answerIndex: 1,
      explanation: 'This is forward secrecy. The certificate key authenticates the server but plays no part in deriving the session keys, and the ephemeral private values no longer exist.',
      difficulty: 'hard',
      topic: 'TLS',
    },
    {
      id: 'ch08-q14',
      question: 'Why does AH fail through a typical NAT device, while ESP with NAT-T works?',
      options: [
        'The AH integrity check covers IP addresses that NAT rewrites, while ESP does not cover the outer IP header and NAT-T wraps it in UDP 4500',
        'AH runs only over IPv6, and NAT exists only in IPv4',
        'NAT devices can forward protocol 51 but not protocol 50',
        'AH runs over TCP, which NAT cannot translate',
      ],
      answerIndex: 0,
      explanation: 'NAT changes the source address, so the AH check fails at the receiver. ESP does not authenticate the outer header, and the UDP wrapper gives NAT a port to translate.',
      difficulty: 'hard',
      topic: 'IPsec and VPN',
    },
    {
      id: 'ch08-q15',
      question: 'Why does WPA3-Personal resist offline password guessing better than WPA2-Personal?',
      options: [
        'It hides the SSID from attackers',
        'It filters client MAC addresses by default',
        'SAE gives no captured data to test guesses against, so each guess needs a live exchange with the access point',
        'It replaces AES with RC4 for faster rekeying',
      ],
      answerIndex: 2,
      explanation: 'In WPA2-Personal, a captured four-way handshake lets guesses be tested offline. SAE removes that option, so guesses are slow, visible and can be limited.',
      difficulty: 'hard',
      topic: 'Secure design and Wi-Fi',
    },
  ],
  importantQuestions: [
    {
      q: 'State two differences between AH and ESP in IPsec.',
      marks: 2,
      modelAnswer: 'ESP (IP protocol 50) provides encryption as well as integrity, while AH (IP protocol 51) provides integrity and origin authentication only.\nThe AH check covers unchanging IP header fields, so AH fails through NAT, while ESP can pass using NAT-T on UDP 4500.',
    },
    {
      q: 'What is the implicit deny in an ACL, and why does it matter?',
      marks: 2,
      modelAnswer: 'It is an invisible deny ip any any at the end of every ACL, which drops any packet that matched no entry.\nIt matters because an ACL with only deny entries blocks everything, and required traffic such as routing protocols must be permitted explicitly.',
    },
    {
      q: 'Compare symmetric and asymmetric cryptography. Why do real protocols use both?',
      marks: 5,
      modelAnswer: 'Symmetric: one shared key, very fast, used for bulk data, for example AES and ChaCha20. Its main problem is key distribution, and N users need N(N-1)/2 keys.\nAsymmetric: a public and private key pair per owner, much slower, used for key agreement and signatures, for example RSA and ECC. N users need 2N keys, but a public key must be trusted through PKI.\nHybrid use: TLS and IPsec authenticate and agree on a key using asymmetric methods, then protect data with a symmetric AEAD cipher. This gives both easy key setup and high speed.',
    },
    {
      q: 'Explain how a digital signature is created and verified. Which security services does it provide?',
      marks: 5,
      modelAnswer: 'Creation: the sender hashes the message, for example with SHA-256, and applies the private key to the hash to produce the signature. Message and signature are sent together.\nVerification: the receiver hashes the received message and uses the public key to check the signature against that hash. A match means the signature is valid.\nServices: integrity, since any change alters the hash; authenticity, since only the private key holder could sign; and non-repudiation. It gives no confidentiality.\nThe public key must itself be trusted, which is the role of certificates and PKI.',
    },
    {
      q: 'Differentiate stateless, stateful and next generation firewalls with suitable uses.',
      marks: 5,
      modelAnswer: 'Stateless: checks each packet alone against rules on IPs, ports, protocol and flags. It is very fast but has no connection memory, so return traffic needs broad rules. Used in router ACLs.\nStateful: keeps a table of active connections by 5-tuple and TCP state. Replies are allowed automatically and invalid packets are dropped. Used at most network edges, and in home routers.\nNext generation: adds application and user identification, integrated IPS, threat intelligence and optional TLS inspection. It gives finer policy at higher cost. Used at enterprise edges and in data centers.',
    },
    {
      q: 'Explain ARP spoofing, how it can be detected, and how a network can be protected against it.',
      marks: 5,
      modelAnswer: 'Concept: ARP has no authentication and hosts accept unsolicited replies. A host on the LAN falsely claims the gateway IP with its own MAC, so traffic from victims reaches it first, enabling MITM or denial of service.\nDetection: the gateway MAC changes, one MAC maps to several IPs in arp -a, arpwatch or switch logs raise alerts, and captures show repeated unsolicited replies.\nProtection: DHCP snooping with Dynamic ARP Inspection on access switches, static entries for critical hosts, smaller VLANs, and end-to-end encryption such as TLS so intercepted traffic stays unreadable.',
    },
    {
      q: 'Describe the TLS 1.3 full handshake with a sequence of messages. Explain how the server is authenticated, how keys are derived, and how TLS 1.3 improves on TLS 1.2.',
      marks: 10,
      modelAnswer: 'After the TCP handshake, the client sends ClientHello with supported versions, cipher suites, SNI and a key_share.\nThe server replies with ServerHello, containing the chosen cipher suite and its own key_share.\nKey derivation: both sides combine the key shares using (EC)DHE to get a shared secret, then use HKDF with the transcript hash to derive handshake keys and later application keys.\nThe server then sends, encrypted: EncryptedExtensions, Certificate, CertificateVerify and Finished.\nAuthentication: the client validates the chain, dates, hostname and revocation status. CertificateVerify is a signature over the transcript, which proves the server holds the private key.\nFinished: both sides send an HMAC over the transcript, which detects tampering and downgrades.\nApplication data then flows in records protected by an AEAD cipher such as AES-GCM.\nImprovements over TLS 1.2: 1 round trip instead of 2, optional 0-RTT resumption, forward secrecy in all full handshakes because RSA key transport was removed, only AEAD ciphers, an encrypted certificate, and removal of weak legacy algorithms.',
    },
    {
      q: 'Design a secure network for a mid-sized company with a public website, a branch office, remote staff and Wi-Fi. Justify each control and describe how attacks are detected.',
      marks: 10,
      modelAnswer: 'Edge: an edge router with anti-spoofing ACLs, followed by a stateful firewall or NGFW with default deny.\nDMZ: web server, mail relay and public DNS, behind a WAF, publishing only required ports. A compromise here does not give direct access inside.\nInternal segmentation: separate VLANs for staff, application servers, database, voice, guests and management, with ACLs or an inner firewall between them. The database accepts connections only from application servers.\nManagement: a jump host with MFA on a separate VLAN.\nConnectivity: site-to-site IPsec with IKEv2 and ESP tunnel mode to the branch, and remote access through IKEv2 or WireGuard with MFA.\nData protection: TLS 1.2 or 1.3 for services, with certificates issued by a public or private CA and automated renewal.\nAccess layer: DHCP snooping and DAI against ARP spoofing, and port security or 802.1X.\nWi-Fi: WPA2 or WPA3-Enterprise with RADIUS for staff, and a guest SSID on an isolated VLAN.\nDetection: IDS or IPS sensors at the edge and DMZ, NetFlow baselines for DDoS, DNS monitoring and DNSSEC validation, and SPF, DKIM and DMARC for phishing. All logs go to a SIEM.\nAvailability: redundant links and firewalls, plus an ISP or CDN DDoS service.',
    },
  ],
  numericals: [
    {
      question: 'In RSA, p = 5, q = 11 and e = 3. Find n, phi(n) and d. Encrypt M = 7 and verify by decrypting.',
      steps: [
        'n = p x q = 5 x 11 = 55.',
        'phi(n) = (5 - 1)(11 - 1) = 4 x 10 = 40.',
        'd must satisfy 3 x d mod 40 = 1. Since 3 x 27 = 81 = 2 x 40 + 1, d = 27.',
        'Encrypt: C = 7^3 mod 55 = 343 mod 55 = 343 - 330 = 13.',
        'Decrypt using repeated squaring: 13^2 mod 55 = 4, 13^4 mod 55 = 16, 13^8 mod 55 = 36, 13^16 mod 55 = 31.',
        'Since 27 = 16 + 8 + 2 + 1, M = 31 x 36 x 4 x 13 mod 55. 31 x 36 mod 55 = 16, 16 x 4 mod 55 = 9, and 9 x 13 mod 55 = 7.',
      ],
      answer: 'n = 55, phi(n) = 40, d = 27, ciphertext C = 13, and decryption returns M = 7 (integers modulo 55).',
    },
    {
      question: 'In Diffie-Hellman, the public values are p = 17 and g = 3. Alice chooses a = 3 and Bob chooses b = 5. Find both public values and the shared secret.',
      steps: [
        'Alice computes A = 3^3 mod 17 = 27 mod 17 = 10.',
        'Bob computes B = 3^5 mod 17 = 243 mod 17 = 243 - 238 = 5.',
        'Alice computes s = B^a mod p = 5^3 mod 17 = 125 mod 17 = 125 - 119 = 6.',
        'Bob computes s = A^b mod p = 10^5 mod 17. 10^2 mod 17 = 15, 10^4 mod 17 = 225 mod 17 = 4, and 4 x 10 mod 17 = 6.',
        'Both results match. An observer sees 17, 3, 10 and 5, and would need to solve a discrete logarithm. That is trivial here, but infeasible at real key sizes.',
      ],
      answer: 'A = 10, B = 5, shared secret s = 6 (integers modulo 17).',
    },
    {
      question: 'A company has 100 employees who all need private communication with each other. How many keys are needed with symmetric and with asymmetric cryptography? How many new keys does a 101st employee add in each case?',
      steps: [
        'Symmetric: each pair needs one key, so K = N(N-1)/2 = 100 x 99 / 2 = 4950.',
        'Asymmetric: each person has one key pair, so K = 2N = 2 x 100 = 200.',
        'A 101st employee with symmetric keys needs one new key with each of the 100 existing employees, so 100 new keys.',
        'A 101st employee with asymmetric keys needs only one new key pair, so 2 new keys.',
      ],
      answer: 'Symmetric: 4950 keys. Asymmetric: 200 keys (100 pairs). A new user adds 100 symmetric keys or 2 asymmetric keys.',
    },
    {
      question: 'A cracking system tests 10^12 keys per second. Find the worst-case time to search all keys for DES (56-bit key) and AES-128. Take 1 year as 3.156 x 10^7 seconds.',
      steps: [
        'DES key space = 2^56 = 7.21 x 10^16 keys.',
        'DES time = 7.21 x 10^16 / 10^12 = 7.21 x 10^4 seconds. Dividing by 3600 gives about 20 hours.',
        'AES-128 key space = 2^128 = 3.40 x 10^38 keys.',
        'AES-128 time = 3.40 x 10^38 / 10^12 = 3.40 x 10^26 seconds.',
        'In years: 3.40 x 10^26 / 3.156 x 10^7 = 1.08 x 10^19 years.',
        'Each added key bit doubles the work, so the 72 extra bits multiply the time by 2^72.',
      ],
      answer: 'DES: about 20 hours. AES-128: about 1.08 x 10^19 years.',
    },
    {
      question: 'An IDS examines 1,000,000 events, of which 100 are real attacks. It detects 99 percent of attacks and wrongly flags 1 percent of benign events. How many alerts does it raise, and what fraction of them are real?',
      steps: [
        'True positives = 0.99 x 100 = 99.',
        'Benign events = 1,000,000 - 100 = 999,900.',
        'False positives = 0.01 x 999,900 = 9,999.',
        'Total alerts = 99 + 9,999 = 10,098.',
        'Precision = TP / (TP + FP) = 99 / 10,098 = 0.0098.',
        'A sensor that looks accurate still gives mostly false alerts when attacks are rare, which is why tuning and correlation matter.',
      ],
      answer: '10,098 alerts, of which about 0.98 percent are real attacks.',
    },
  ],
  keyTerms: [
    'CIA triad: Confidentiality, integrity and availability, the three core security goals',
    'Symmetric key: One shared secret used for both encryption and decryption',
    'Key pair: A linked public key and private key held by one owner',
    'AEAD: Cipher mode that encrypts and authenticates data together, such as AES-GCM',
    'Hash function: One-way function mapping any input to a fixed-length digest',
    'HMAC: Keyed hash that proves integrity and origin between key holders',
    'Digital signature: Private-key proof of origin and integrity, checked with the public key',
    'X.509 certificate: Signed document binding a public key to a named identity',
    'Certificate authority: Trusted organization that verifies applicants and signs certificates',
    'Forward secrecy: Stolen long-term keys cannot decrypt previously recorded sessions',
    'ESP: IPsec protocol 50 giving encryption, integrity and anti-replay protection',
    'Security association: One-way IPsec agreement on keys and algorithms, identified by an SPI',
    'Stateful firewall: Firewall that tracks connections and allows matching return traffic',
    'Implicit deny: Invisible final ACL rule that drops any packet no entry matched',
    'IPS: Inline sensor that detects and blocks malicious traffic',
    'DMZ: Isolated zone for public servers, between the Internet and the internal LAN',
    'Dynamic ARP Inspection: Switch feature that drops ARP messages failing binding checks',
    'DNSSEC: Signed DNS records that let resolvers detect forged answers',
    'SAE: WPA3 password exchange that resists offline dictionary guessing',
  ],
  formulas: [
    { name: 'Symmetric keys for N users', expression: 'K = N(N-1)/2', note: 'One shared key per pair of users.' },
    { name: 'Asymmetric keys for N users', expression: 'K = 2N', note: 'N key pairs, one public and one private key each.' },
    { name: 'RSA modulus and totient', expression: 'n = p x q, phi(n) = (p-1)(q-1)' },
    { name: 'RSA key relation', expression: 'e x d mod phi(n) = 1', note: 'e must be coprime to phi(n).' },
    { name: 'RSA encryption and decryption', expression: 'C = M^e mod n, M = C^d mod n', note: 'M must be smaller than n.' },
    { name: 'RSA signature', expression: 'S = H^d mod n, check H = S^e mod n', note: 'H is the hash of the message.' },
    { name: 'Diffie-Hellman public values', expression: 'A = g^a mod p, B = g^b mod p' },
    { name: 'Diffie-Hellman shared secret', expression: 's = B^a mod p = A^b mod p' },
    { name: 'Brute force effort', expression: 'Worst case = 2^k trials, average = 2^(k-1) trials', note: 'k is the key length in bits.' },
    { name: 'Hash collision effort', expression: 'About 2^(n/2) trials', note: 'Birthday bound for an n-bit hash.' },
    { name: 'IDS precision', expression: 'Precision = TP / (TP + FP)', note: 'Fraction of alerts that are real attacks.' },
  ],
  handsOnChecklist: [
    'Run openssl s_client against a public HTTPS site and identify the TLS version, cipher suite and certificate chain.',
    'Capture your own HTTPS visit in Wireshark and find the ClientHello and ServerHello messages.',
    'Generate an RSA key pair with OpenSSL, sign a text file, verify it, then edit the file and see verification fail.',
    'Run arp -a on your laptop, record the gateway MAC address, and check for unexpected duplicate MAC addresses.',
    'In Cisco Packet Tracer, build a small two-subnet network, apply an extended ACL that permits only web traffic, and verify it with show access-lists.',
    'Check your home router settings: confirm WPA2-AES or WPA3 is on, WPS is off, and guest devices are isolated.',
  ],
};

export default chapter;

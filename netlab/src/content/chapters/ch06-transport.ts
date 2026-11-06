import type { Chapter } from '@/lib/types';

const chapter: Chapter = {
  slug: 'transport',
  number: 6,
  title: 'Transport layer',
  shortTitle: 'Transport',
  summary:
    'How data moves between processes rather than only between hosts: ports and sockets, the UDP and TCP headers, connection setup and teardown, reliable transfer, RTT and timeout estimation, flow control, congestion control and QUIC.',
  estMinutes: 85,
  learningObjectives: [
    'Explain process-to-process delivery and how ports, sockets and the 4-tuple demultiplex incoming data.',
    'Read the UDP and TCP headers field by field and choose a suitable transport for an application.',
    'Trace TCP connection setup and teardown using sequence numbers and the TCP state machine.',
    'Explain reliable transfer and calculate SRTT, RTTVAR and RTO from RTT samples.',
    'Calculate usable window, throughput and BDP, and trace cwnd through every congestion control phase.',
    'Describe what QUIC changes compared with TCP plus TLS, and where each is used in production.',
  ],
  overviewVideoId: 'ch06-overview',
  sections: [
    {
      id: 'process-to-process-delivery',
      title: 'Process-to-process delivery, ports and sockets',
      blocks: [
        {
          type: 'paragraph',
          text: 'IP delivers a packet to a host, but a host runs many programs at once. The transport layer extends delivery from **host-to-host** to **process-to-process**, so a browser, an SSH session and a DNS lookup can share one IP address. It runs in the end hosts; ordinary routers forward packets without acting on the transport header.',
        },
        {
          type: 'points',
          items: [
            'The **network layer** is best effort. Packets can be lost, duplicated, reordered or corrupted.',
            'The **transport layer** adds port numbers. TCP also adds reliability, ordering, flow control and congestion control.',
            'The data unit is a **segment** in TCP and a **datagram** in UDP.',
            'The IP **Protocol** field selects the transport: `6` for TCP and `17` for UDP.',
            'A **port** is a 16-bit number from `0` to `65535`. A **socket** is the kernel endpoint a program opens to send and receive.',
          ],
        },
        {
          type: 'table',
          headers: ['Range', 'Name', 'Typical use'],
          rows: [
            ['`0` to `1023`', 'Well-known', '`22` SSH, `25` SMTP, `53` DNS, `67`/`68` DHCP, `80` HTTP, `123` NTP, `443` HTTPS'],
            ['`1024` to `49151`', 'Registered', 'Application services such as `3306` MySQL and `3389` RDP'],
            ['`49152` to `65535`', 'Dynamic or ephemeral', 'Temporary client ports. Linux defaults to `32768` to `60999` instead'],
          ],
        },
        {
          type: 'diagram',
          id: 'ch06-mux-demux',
          title: 'Demultiplexing on the receive path',
          caption: 'IP selects TCP or UDP from the Protocol field, then the transport header selects the socket. Sending reverses the path, which is multiplexing.',
          kind: 'block',
          mermaid: `flowchart TD
    A1["Packet arrives at host"]
    subgraph N1["Network layer"]
        I1["IP reads Protocol field"]
    end
    subgraph T1["Transport layer demultiplexing"]
        M1["TCP - match 4-tuple"]
        M2["UDP - match dest IP and port"]
    end
    subgraph H1["Application processes"]
        P1["Browser - socket on port 52144"]
        P2["SSH client - socket on port 52146"]
        P3["DNS stub - socket on port 53001"]
    end
    A1 --> I1
    I1 -->|Protocol 6| M1
    I1 -->|Protocol 17| M2
    M1 --> P1
    M1 --> P2
    M2 --> P3`,
        },
        {
          type: 'points',
          items: [
            '**Multiplexing** at the sender collects data from many sockets, adds port numbers and hands segments to IP.',
            '**Demultiplexing** at the receiver uses header fields to pick the socket.',
            'A **UDP socket** is matched by destination IP and port, so datagrams from many clients reach one socket.',
            'A **connected TCP socket** is matched by the 4-tuple: source IP, source port, destination IP, destination port.',
            'A **listening TCP socket** takes new SYNs. Each `accept()` returns a new connected socket, so thousands of clients can share port `443`.',
          ],
        },
        {
          type: 'callout',
          variant: 'remember',
          text: 'A server port is not used up by many clients. Each TCP connection is unique because its 4-tuple is unique.',
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'A home router runs PAT: it rewrites `192.168.1.20:52144` to something like `203.0.113.5:40001` and stores the mapping. Office ACLs filter on the same fields, for example `permit tcp any host 192.0.2.10 eq 443`. Cloud load balancers hash the 5-tuple (4-tuple plus protocol) so one flow stays on one backend.',
        },
        {
          type: 'command-lab',
          title: 'List TCP sockets on Windows',
          command: 'netstat -ano -p tcp',
          output: `Active Connections

  Proto  Local Address          Foreign Address        State           PID
  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       1120
  TCP    0.0.0.0:445            0.0.0.0:0              LISTENING       4
  TCP    192.168.1.20:52144     203.0.113.10:443       ESTABLISHED     8124
  TCP    192.168.1.20:52146     203.0.113.10:443       ESTABLISHED     8124
  TCP    192.168.1.20:52150     198.51.100.25:443      TIME_WAIT       0`,
          explanation: [
            'The header names the local socket, the remote socket, the TCP state and the owning process id.',
            'The two `LISTENING` rows are server sockets on all interfaces, so the foreign address is the placeholder `0.0.0.0:0`.',
            'The two `ESTABLISHED` rows have the same PID and the same remote socket. Only the source ports `52144` and `52146` differ, and that is enough to keep them apart.',
            'The `TIME_WAIT` row is a closed connection still held by the kernel, so no process owns it and the PID is `0`.',
          ],
        },
      ],
    },
    {
      id: 'udp-and-transport-choice',
      title: 'UDP and choosing between TCP and UDP',
      videoId: 'ch06-udp-vs-tcp',
      blocks: [
        {
          type: 'paragraph',
          text: 'UDP (RFC 768) adds only ports and a checksum to IP. It has no connection, retransmission, ordering or congestion control. That is useful when an application handles loss better itself, or when a setup round trip costs too much.',
        },
        {
          type: 'points',
          items: [
            '**Connectionless:** each datagram stands alone, and no handshake comes first.',
            '**Message-oriented:** one send produces one datagram, so message boundaries are preserved.',
            '**Best effort:** datagrams can be lost, duplicated or reordered with no notice to the sender.',
            '**Delivery modes:** UDP supports broadcast and multicast, which TCP cannot.',
            '**Closed port:** the receiving host normally returns ICMP Port Unreachable (type 3, code 3).',
          ],
        },
        {
          type: 'points',
          items: [
            'The header is **8 bytes**, with four 16-bit fields: source port, destination port, length and checksum.',
            '**Length** covers header plus data, so its minimum is `8`.',
            '**Checksum** covers a pseudo-header (IP addresses, protocol, UDP length), the header and the data. It is optional in IPv4, where `0` means unused, and normally mandatory in IPv6.',
            'The maximum IPv4 payload is `65535 - 20 - 8 = 65507` bytes. To avoid fragmentation on Ethernet, stay within `1500 - 20 - 8 = 1472` bytes.',
          ],
        },
        {
          type: 'table',
          headers: ['Feature', 'TCP', 'UDP'],
          rows: [
            ['Connection', 'Three-way handshake', 'None'],
            ['Reliability', 'ACKs and retransmission', 'None built in'],
            ['Ordering', 'In-order byte stream', 'Not guaranteed'],
            ['Boundaries', 'Not preserved', 'Preserved'],
            ['Rate control', 'Flow and congestion control', 'None built in'],
            ['Header size', '20 to 60 bytes', '8 bytes'],
            ['Delivery', 'Unicast only', 'Unicast, broadcast, multicast'],
            ['Typical uses', 'HTTPS, SSH, SMTP, databases', 'DNS, DHCP, NTP, RTP voice, QUIC'],
          ],
        },
        {
          type: 'diagram',
          id: 'ch06-transport-choice',
          title: 'Choosing a transport',
          caption: 'A simplified design decision. Real applications may combine transports, as DNS does when it falls back to TCP.',
          kind: 'flowchart',
          mermaid: `flowchart TD
    A1["Application needs a transport"]
    A2{"Short query and reply only?"}
    A3{"Is late data useless?"}
    A4{"Many streams on changing paths?"}
    U1["UDP - DNS, DHCP, NTP"]
    U2["UDP with RTP - voice, video, games"]
    Q1["QUIC over UDP - HTTP/3"]
    T1["TCP - HTTPS, SSH, SMTP, databases"]
    A1 --> A2
    A2 -->|Yes| U1
    A2 -->|No| A3
    A3 -->|Yes| U2
    A3 -->|No| A4
    A4 -->|Yes| Q1
    A4 -->|No| T1`,
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'DNS uses UDP `53` for most queries and TCP `53` for truncated replies and zone transfers. Voice uses RTP over UDP because a retransmitted packet arrives too late to play. Data centres carry VXLAN over UDP `4789`, and many VPNs tunnel over UDP because the inner TCP already handles reliability.',
        },
        {
          type: 'command-lab',
          title: 'A DNS query over UDP',
          command: 'dig @8.8.8.8 example.com A +noall +answer +stats',
          output: `example.com.    300    IN    A    203.0.113.10
;; Query time: 18 msec
;; SERVER: 8.8.8.8#53(8.8.8.8) (UDP)
;; WHEN: Thu Nov 05 10:12:41 IST 2026
;; MSG SIZE  rcvd: 56`,
          explanation: [
            'The answer line gives the name, TTL of `300` s, class `IN`, type `A` and the address. A documentation address is shown here.',
            '`Query time: 18 msec` covers one request and one reply, with no handshake before them.',
            'The `SERVER` line shows port `53` and transport `(UDP)`. Adding `+tcp` repeats the query over TCP, with a handshake first.',
            '`MSG SIZE rcvd: 56` is far below the `1472` byte limit, so the reply fits in one unfragmented datagram.',
          ],
        },
      ],
    },
    {
      id: 'tcp-segment-structure',
      title: 'TCP header and segment structure',
      blocks: [
        {
          type: 'paragraph',
          text: 'TCP gives applications a reliable, ordered, full-duplex byte stream between exactly two endpoints. RFC 9293 is the current specification. The application writes bytes, and TCP cuts them into segments, each with a header of 20 to 60 bytes.',
        },
        {
          type: 'diagram',
          id: 'ch06-tcp-header',
          title: 'TCP header layout',
          caption: 'Each row is 32 bits. The fixed header is 20 bytes, and options can add up to 40 more.',
          kind: 'block',
          mermaid: `flowchart TD
    subgraph R1["Bytes 0 to 3"]
        A1["Source port - 16 bits"]
        A2["Destination port - 16 bits"]
    end
    subgraph R2["Bytes 4 to 7"]
        B1["Sequence number - 32 bits"]
    end
    subgraph R3["Bytes 8 to 11"]
        C1["Acknowledgment number - 32 bits"]
    end
    subgraph R4["Bytes 12 to 15"]
        D1["Data offset - 4 bits"]
        D2["Reserved - 4 bits"]
        D3["8 flags CWR ECE URG ACK PSH RST SYN FIN"]
        D4["Window - 16 bits"]
    end
    subgraph R5["Bytes 16 to 19"]
        E1["Checksum - 16 bits"]
        E2["Urgent pointer - 16 bits"]
    end
    subgraph R6["Bytes 20 to 59 - optional"]
        F1["Options and padding - 0 to 40 bytes"]
    end
    R1 --> R2
    R2 --> R3
    R3 --> R4
    R4 --> R5
    R5 --> R6`,
        },
        {
          type: 'table',
          headers: ['Field', 'Size', 'Purpose'],
          rows: [
            ['Source and destination port', '16 bits each', 'Identify the socket at each end'],
            ['Sequence number', '32 bits', 'Number of the first payload byte. SYN and FIN each use one number'],
            ['Acknowledgment number', '32 bits', 'Next byte expected from the peer, valid when `ACK` is set'],
            ['Data offset', '4 bits', 'Header length in 32-bit words, from `5` (20 bytes) to `15` (60 bytes)'],
            ['Reserved', '4 bits', 'Sent as zero'],
            ['Flags', '8 bits', 'Control bits listed below'],
            ['Window', '16 bits', 'Free receive buffer, before window scaling is applied'],
            ['Checksum', '16 bits', 'Mandatory. Covers pseudo-header, header and payload'],
            ['Urgent pointer', '16 bits', 'Offset of urgent data, valid with `URG`, rarely used'],
            ['Options', '0 to 40 bytes', 'Negotiated features, padded to a 32-bit boundary'],
          ],
        },
        {
          type: 'points',
          items: [
            '`SYN` starts a connection and `FIN` ends one direction. `RST` aborts at once.',
            '`ACK` makes the acknowledgment field valid. It is set on every segment after the first SYN.',
            '`PSH` asks the receiver to pass buffered data to the application promptly.',
            '`ECE` and `CWR` carry ECN congestion signals (RFC 3168).',
            'TCP has no payload length field. The receiver computes it from the IP total length minus both header lengths.',
            'The 32-bit sequence space wraps after about 4.29 GB, which takes about 34 s at 1 Gbit/s. The timestamps option protects against wrapped numbers.',
          ],
        },
        {
          type: 'table',
          headers: ['Option', 'Kind', 'Length', 'Purpose'],
          rows: [
            ['MSS', '`2`', '4 bytes', 'Largest payload accepted, sent in SYN only'],
            ['Window scale', '`3`', '3 bytes', 'Shift count `0` to `14` for the Window field, SYN only'],
            ['SACK permitted', '`4`', '2 bytes', 'Agrees to use selective acknowledgment, SYN only'],
            ['SACK', '`5`', 'Variable', 'Lists byte ranges received out of order'],
            ['Timestamps', '`8`', '10 bytes', 'RTT measurement and wrapped sequence protection'],
          ],
        },
        {
          type: 'example',
          title: 'Following sequence and acknowledgment numbers',
          steps: [
            'Client ISN is `1000` and server ISN is `5000`. After the handshake, the next client byte is `1001` and the next server byte is `5001`.',
            'Client sends 500 bytes: `seq=1001 ack=5001 len=500`. These are bytes 1001 to 1500.',
            'Server replies with 300 bytes: `seq=5001 ack=1501 len=300`. The ACK travels on the data, which is called piggybacking.',
            'Client acknowledges with no data: `seq=1501 ack=5301 len=0`.',
            'A pure ACK uses no sequence number, so the next client data segment also starts at `seq=1501`.',
          ],
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: 'Sequence numbers count **bytes**, not segments. The in-order reply is `ack = seq + payload length`. SYN and FIN each count as one byte, and a pure ACK counts as zero.',
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'On Ethernet, MSS is `1500 - 20 - 20 = 1460` bytes. PPPoE broadband has an MTU of `1492`, so edge routers clamp it with the Cisco command `ip tcp adjust-mss 1452`. Network card offload (TSO) splits large buffers after capture, so a sender capture can show segments larger than the MTU.',
        },
      ],
    },
    {
      id: 'tcp-connection-management',
      title: 'Connection setup and teardown',
      videoId: 'ch06-tcp-three-way-handshake',
      blocks: [
        {
          type: 'paragraph',
          text: 'TCP must agree on starting sequence numbers and options before data flows, and must close each direction cleanly afterwards. Setup uses a three-way handshake. Teardown uses one FIN per direction, followed by a TIME_WAIT delay on the side that closed first.',
        },
        {
          type: 'points',
          items: [
            '**Step 1:** the client calls `connect()`, sends a SYN with its ISN and options, and enters `SYN_SENT`.',
            '**Step 2:** the listening server sends a SYN-ACK with its own ISN and `ack = client ISN + 1`, and enters `SYN_RCVD`.',
            '**Step 3:** the client sends `ack = server ISN + 1` and enters `ESTABLISHED`. The server enters `ESTABLISHED` when this arrives. This segment may carry data.',
            'Three messages are needed because each side must confirm that the other received its ISN. This also lets a client reject a stale SYN-ACK caused by an old duplicate SYN.',
            'ISNs are randomised (RFC 6528), so an off-path attacker cannot easily guess them.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch06-three-way-handshake',
          title: 'Three-way handshake',
          caption: 'Each SYN uses one sequence number. MSS and window scale are agreed here and cannot be negotiated later.',
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant C as Client
    participant S as Server
    Note over S: LISTEN
    Note over C: SYN_SENT
    C->>S: SYN seq=1000 MSS=1460 wscale=7
    Note over S: SYN_RCVD
    S->>C: SYN-ACK seq=5000 ack=1001 MSS=1460 wscale=7
    Note over C: ESTABLISHED
    C->>S: ACK seq=1001 ack=5001
    Note over S: ESTABLISHED
    C->>S: Data seq=1001 ack=5001 len=500
    S->>C: ACK seq=5001 ack=1501`,
        },
        {
          type: 'points',
          items: [
            'TCP is full duplex, so each direction closes separately. The side that calls `close()` first is the **active closer**.',
            'A FIN uses one sequence number and must be acknowledged. The passive side may send its ACK and FIN together, giving a three-segment close.',
            'The active closer holds `TIME_WAIT` for **2 MSL**. This lets it resend the last ACK if the peer FIN is retransmitted, and lets old duplicates of this 4-tuple expire.',
            '`RST` aborts at once, with no FIN exchange and no `TIME_WAIT`.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch06-teardown-states',
          title: 'Connection teardown states',
          caption: 'The upper path is the active closer and the CLOSE_WAIT path is the passive closer. CLOSING occurs when both sides close at the same time.',
          kind: 'working-diagram',
          mermaid: `stateDiagram-v2
    state "ESTABLISHED" as Est
    state "FIN_WAIT_1" as FinWait1
    state "FIN_WAIT_2" as FinWait2
    state "CLOSING" as ClosingS
    state "TIME_WAIT" as TimeWait
    state "CLOSE_WAIT" as CloseWait
    state "LAST_ACK" as LastAck
    state "CLOSED" as Done
    [*] --> Est
    Est --> FinWait1: app closes, send FIN
    FinWait1 --> FinWait2: recv ACK of FIN
    FinWait1 --> ClosingS: recv FIN, send ACK
    FinWait1 --> TimeWait: recv FIN-ACK, send ACK
    FinWait2 --> TimeWait: recv FIN, send ACK
    ClosingS --> TimeWait: recv ACK of FIN
    TimeWait --> Done: 2 MSL timer expires
    Est --> CloseWait: recv FIN, send ACK
    CloseWait --> LastAck: app closes, send FIN
    LastAck --> Done: recv ACK of FIN
    Done --> [*]`,
        },
        {
          type: 'diagram',
          id: 'ch06-tcp-state-machine',
          title: 'TCP state machine',
          caption: 'The 11 TCP states with the main transitions. Each label gives the event, then the segment sent in response.',
          kind: 'flowchart',
          mermaid: `stateDiagram-v2
    state "CLOSED" as Closed
    state "LISTEN" as Listen
    state "SYN_SENT" as SynSent
    state "SYN_RCVD" as SynRcvd
    state "ESTABLISHED" as Est
    state "FIN_WAIT_1" as FinWait1
    state "FIN_WAIT_2" as FinWait2
    state "CLOSING" as ClosingS
    state "TIME_WAIT" as TimeWait
    state "CLOSE_WAIT" as CloseWait
    state "LAST_ACK" as LastAck
    [*] --> Closed
    Closed --> Listen: passive open
    Closed --> SynSent: active open, send SYN
    Listen --> SynRcvd: recv SYN, send SYN-ACK
    Listen --> Closed: close
    SynSent --> Est: recv SYN-ACK, send ACK
    SynSent --> SynRcvd: recv SYN, send SYN-ACK
    SynSent --> Closed: close or timeout
    SynRcvd --> Est: recv ACK
    SynRcvd --> Listen: recv RST
    SynRcvd --> FinWait1: close, send FIN
    Est --> FinWait1: close, send FIN
    Est --> CloseWait: recv FIN, send ACK
    FinWait1 --> FinWait2: recv ACK of FIN
    FinWait1 --> ClosingS: recv FIN, send ACK
    FinWait1 --> TimeWait: recv FIN-ACK, send ACK
    FinWait2 --> TimeWait: recv FIN, send ACK
    ClosingS --> TimeWait: recv ACK of FIN
    CloseWait --> LastAck: close, send FIN
    LastAck --> Closed: recv ACK of FIN
    TimeWait --> Closed: 2 MSL timeout`,
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: 'The active closer passes through `FIN_WAIT_1`, `FIN_WAIT_2` and `TIME_WAIT`. The passive closer passes through `CLOSE_WAIT` and `LAST_ACK`. Only the active closer enters `TIME_WAIT`.',
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'A SYN flood fills the half-open queue with spoofed SYNs. Linux defends with SYN cookies (`net.ipv4.tcp_syncookies`), which encode connection state in the server ISN. `TIME_WAIT` lasts 60 s on Linux and 120 s by default on Windows.',
        },
        {
          type: 'points',
          items: [
            '`Connection refused`: an RST came back. The host is reachable but nothing listens on that port.',
            '`Connection timed out`: SYNs got no reply. A firewall may be dropping them, or the host is down. Linux retries for about 127 s by default.',
            '`Connection reset by peer`: an RST arrived on a live connection, often from a crashed application or a middlebox that lost its state.',
          ],
        },
        {
          type: 'command-lab',
          title: 'Watch setup and teardown with tcpdump',
          command: 'sudo tcpdump -ni eth0 host 203.0.113.10 and tcp port 443',
          output: `10:21:07.104512 IP 192.168.1.20.52144 > 203.0.113.10.443: Flags [S], seq 2971843301, win 64240, options [mss 1460,sackOK,TS val 410221 ecr 0,nop,wscale 7], length 0
10:21:07.126840 IP 203.0.113.10.443 > 192.168.1.20.52144: Flags [S.], seq 1180452967, ack 2971843302, win 65160, options [mss 1460,sackOK,TS val 99120 ecr 410221,nop,wscale 7], length 0
10:21:07.126911 IP 192.168.1.20.52144 > 203.0.113.10.443: Flags [.], ack 1, win 502, options [nop,nop,TS val 410243 ecr 99120], length 0
10:21:09.310220 IP 192.168.1.20.52144 > 203.0.113.10.443: Flags [F.], seq 518, ack 3881, win 501, options [nop,nop,TS val 412426 ecr 101250], length 0
10:21:09.332410 IP 203.0.113.10.443 > 192.168.1.20.52144: Flags [F.], seq 3881, ack 519, win 509, options [nop,nop,TS val 101325 ecr 412426], length 0
10:21:09.332470 IP 192.168.1.20.52144 > 203.0.113.10.443: Flags [.], ack 3882, win 501, options [nop,nop,TS val 412449 ecr 101325], length 0`,
          explanation: [
            'Line 1: `[S]` is the SYN. It carries the ISN and offers MSS `1460`, SACK, timestamps and window scale `7`.',
            'Line 2: `[S.]` is the SYN-ACK. Its `ack` is the client ISN plus one. The gap from line 1 is about `22.3` ms, the path RTT.',
            'Line 3: `[.]` is the final ACK. tcpdump now shows relative numbers, so `ack 1` means server ISN plus one. `win 502` is the raw field; with scale `7` it means `502 x 128 = 64256` bytes.',
            'Line 4: `[F.]` is a FIN from the client at `seq 518`, after 517 bytes of data. The client is the active closer.',
            'Line 5: the server sends its own FIN and `ack 519`, showing that the client FIN used one sequence number.',
            'Line 6: `ack 3882` acknowledges the server FIN. The client enters `TIME_WAIT`, and the server moves to `CLOSED`.',
          ],
        },
        {
          type: 'mini-lab',
          title: 'Capture your own handshake',
          goal: 'See the three-way handshake and connection close on a real connection.',
          steps: [
            'Start Wireshark on your active interface and apply the filter `tcp.port == 443`.',
            'In a terminal, run `curl -sI https://example.com`.',
            'Stop the capture and find the first packet with only `SYN` set.',
            'Read the relative `Seq` and `Ack` of the first three packets, and the MSS and window scale options in the SYN.',
            'Scroll to the end of the stream and note whether it closes with FIN or RST.',
          ],
          expected: 'The first three packets show `SYN` with `Seq=0`, `SYN, ACK` with `Seq=0 Ack=1`, and `ACK` with `Seq=1 Ack=1`. TLS data follows. Wireshark numbers are relative, so the raw ISNs differ.',
        },
        {
          type: 'wireshark',
          filter: 'tcp.flags.syn == 1 or tcp.flags.fin == 1 or tcp.flags.reset == 1',
          whatToLook: [
            'One SYN and one SYN-ACK at the start of each stream, showing setup without the data packets.',
            'SYN retransmissions with growing gaps, which point to a firewall drop or an unreachable host.',
            'An immediate RST after a SYN, which means the port is closed.',
            'A FIN in each direction, and which side sent its FIN first.',
          ],
        },
        {
          type: 'troubleshoot',
          symptom: 'A server collects thousands of sockets in `CLOSE_WAIT` and later fails with too many open files.',
          checks: [
            'Count them with `ss -tan state close-wait | wc -l`.',
            'Find the owning process with `ss -tanp state close-wait`.',
            'Review the error paths in that application for sockets that are never closed.',
          ],
          fix: '`CLOSE_WAIT` means the peer has closed but the local application has not called `close()`. This is an application socket leak, so fix the code; kernel tuning will not help. Many `TIME_WAIT` sockets are normal by contrast, and connection pooling helps if a busy client runs short of ephemeral ports.',
        },
      ],
    },
    {
      id: 'reliable-transfer-rtt',
      title: 'Reliable transfer and RTT estimation',
      blocks: [
        {
          type: 'paragraph',
          text: 'IP can lose, reorder or corrupt packets, so TCP rebuilds a reliable stream with checksums, sequence numbers, acknowledgments and retransmission. Duplicate ACKs give a fast loss signal, and timer expiry gives a slow one. The timer only works well if it tracks the real round-trip time of the path.',
        },
        {
          type: 'points',
          items: [
            '**Checksum:** a corrupted segment is discarded silently, and later retransmission recovers it.',
            '**Cumulative ACK:** `ack=N` means every byte before `N` has arrived.',
            '**Delayed ACK:** the receiver may wait for a second full-size segment, for under 500 ms. Linux typically starts near 40 ms and Windows uses 200 ms.',
            '**Out-of-order data:** the receiver buffers it and immediately sends a duplicate ACK.',
            '**SACK** (RFC 2018) reports received ranges, so the sender resends only what is missing.',
          ],
        },
        {
          type: 'table',
          headers: ['Scheme', 'ACK style', 'Buffers out of order?', 'Resends after loss'],
          rows: [
            ['Go-Back-N', 'Cumulative', 'No', 'Lost packet and everything after it'],
            ['Selective Repeat', 'Individual', 'Yes', 'Only the lost packet'],
            ['TCP', 'Cumulative, plus optional SACK', 'Yes', 'Usually only the missing segment'],
          ],
        },
        {
          type: 'diagram',
          id: 'ch06-segment-arrival',
          title: 'How a receiver handles an arriving segment',
          caption: 'A simplified receive path for an established connection. The ACK always names the next byte expected.',
          kind: 'working-flowchart',
          mermaid: `flowchart TD
    A1["Segment arrives from IP"]
    A2{"Checksum valid?"}
    A3["Discard silently"]
    A4{"Matches a socket or listener?"}
    A5["Reply with RST"]
    A6{"Inside receive window?"}
    A7["Drop and send ACK for next byte"]
    A8{"Seq equals next expected byte?"}
    A9["Buffer data, send duplicate ACK"]
    A10["Move data to receive buffer"]
    A11["Advance next byte, fill any gap"]
    A12["Send cumulative ACK with new rwnd"]
    A1 --> A2
    A2 -->|No| A3
    A2 -->|Yes| A4
    A4 -->|No| A5
    A4 -->|Yes| A6
    A6 -->|No| A7
    A6 -->|Yes| A8
    A8 -->|No| A9
    A8 -->|Yes| A10
    A10 --> A11
    A11 --> A12`,
        },
        {
          type: 'diagram',
          id: 'ch06-fast-retransmit',
          title: 'Fast retransmit after one lost segment',
          caption: 'Three duplicate ACKs trigger a resend before the timer expires. The next cumulative ACK then covers all the buffered data.',
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant S as Sender
    participant R as Receiver
    S->>R: seq=1001 len=1000
    R->>S: ack=2001
    S-xR: seq=2001 len=1000 lost
    S->>R: seq=3001 len=1000
    R->>S: ack=2001 duplicate 1
    S->>R: seq=4001 len=1000
    R->>S: ack=2001 duplicate 2
    S->>R: seq=5001 len=1000
    R->>S: ack=2001 duplicate 3
    Note over S: Fast retransmit starts
    S->>R: seq=2001 len=1000 resent
    R->>S: ack=6001 cumulative`,
        },
        {
          type: 'paragraph',
          text: 'An RTO that is too short causes needless retransmissions, and one that is too long stalls the connection after a loss. TCP therefore measures RTT samples and keeps a smoothed average plus a measure of variation (RFC 6298).',
        },
        {
          type: 'points',
          items: [
            '**Before any sample:** the initial RTO is 1 s.',
            '**First sample R:** `SRTT = R`, `RTTVAR = R / 2`, `RTO = SRTT + 4 x RTTVAR`.',
            '**Later samples:** update `RTTVAR` first, using the old `SRTT`, then update `SRTT`.',
            "**Karn's algorithm:** take no RTT samples from retransmitted segments, because the ACK could belong to either copy.",
            '**Backoff:** each timeout doubles the RTO until a valid sample arrives.',
            '**Limits:** RFC 6298 recommends a 1 s minimum RTO. Linux uses about 200 ms, which suits low-delay networks.',
          ],
        },
        {
          type: 'callout',
          variant: 'formula',
          text: '`RTTVAR = 3/4 x RTTVAR + 1/4 x |SRTT - R|`, then `SRTT = 7/8 x SRTT + 1/8 x R`, then `RTO = SRTT + max(G, 4 x RTTVAR)`, where `G` is the clock granularity.',
        },
        {
          type: 'example',
          title: 'RTO from the first two samples',
          steps: [
            'First sample is 80 ms: `SRTT = 80`, `RTTVAR = 40`, `RTO = 80 + 4 x 40 = 240` ms.',
            'Second sample is 120 ms: `RTTVAR = 0.75 x 40 + 0.25 x |80 - 120| = 30 + 10 = 40` ms.',
            '`SRTT = 0.875 x 80 + 0.125 x 120 = 70 + 15 = 85` ms.',
            '`RTO = 85 + 4 x 40 = 245` ms.',
          ],
        },
        {
          type: 'command-lab',
          title: 'Read live TCP estimates on Linux',
          command: 'ss -ti dst 203.0.113.10',
          output: `State  Recv-Q Send-Q Local Address:Port    Peer Address:Port
ESTAB  0      0       192.168.1.20:52144   203.0.113.10:443
     cubic wscale:7,7 rto:224 rtt:22.4/3.1 ato:40 mss:1460 pmtu:1500 rcvmss:1460 advmss:1460 cwnd:32 ssthresh:24 bytes_sent:184320 bytes_retrans:2920 bytes_acked:181400 send 16.7Mbps retrans:0/2 snd_wnd:65152`,
          explanation: [
            'The `ESTAB` row is one socket, identified by its local and peer addresses.',
            '`cubic wscale:7,7` names the congestion algorithm and the send and receive window scales.',
            '`rtt:22.4/3.1` is SRTT and RTTVAR in ms. Their RFC formula gives `22.4 + 4 x 3.1 = 34.8` ms, but `rto:224` is higher because of the Linux floor of about 200 ms.',
            '`cwnd:32 ssthresh:24`: cwnd is above ssthresh, so the sender is in congestion avoidance.',
            '`send 16.7Mbps` is `32 x 1460 x 8 / 0.0224 s`, the rate cwnd allows. It is an estimate, not measured throughput.',
            '`bytes_retrans:2920` and `retrans:0/2` show two 1460-byte segments resent in total, with none outstanding now.',
          ],
        },
      ],
    },
    {
      id: 'flow-control-sliding-window',
      title: 'Flow control and the sliding window',
      videoId: 'ch06-flow-control-window',
      blocks: [
        {
          type: 'paragraph',
          text: 'Flow control stops a fast sender from overflowing a slow receiver. The receiver advertises its free buffer space in the Window field, and the sender keeps unacknowledged data within that limit. The limit moves forward as acknowledgments arrive, which gives the sliding window its name.',
        },
        {
          type: 'points',
          items: [
            '**rwnd** is `RcvBuffer - (LastByteRcvd - LastByteRead)`.',
            '**Sender rule:** `LastByteSent - LastByteAcked <= min(cwnd, rwnd)`.',
            '**Usable window** is `min(cwnd, rwnd) - bytes in flight`.',
            'The left edge of the window is the ACK number. The right edge is the ACK number plus rwnd.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch06-sliding-window',
          title: 'Sliding window at the sender',
          caption: 'An ACK of 2001 with rwnd unchanged at 4000 moves the window right by 1000 bytes. Usable space grows from 2000 to 3000 bytes.',
          kind: 'working-diagram',
          mermaid: `flowchart TD
    subgraph W1["Before - ack 1001, rwnd 4000"]
        direction LR
        A1["ACKed - up to byte 1000"]
        A2["In flight - 1001 to 3000"]
        A3["Usable - 3001 to 5000"]
        A4["Blocked - 5001 onward"]
        A1 --> A2
        A2 --> A3
        A3 --> A4
    end
    subgraph W2["After - ack 2001, rwnd 4000"]
        direction LR
        B1["ACKed - up to byte 2000"]
        B2["In flight - 2001 to 3000"]
        B3["Usable - 3001 to 6000"]
        B4["Blocked - 6001 onward"]
        B1 --> B2
        B2 --> B3
        B3 --> B4
    end
    W1 -->|ACK slides window right| W2`,
        },
        {
          type: 'diagram',
          id: 'ch06-rwnd-exchange',
          title: 'rwnd shrinking to zero and recovering',
          caption: 'A 4000-byte receive buffer whose application is slow to read. The persist timer prevents deadlock if a window update is lost.',
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant S as Sender
    participant R as Receiver
    S->>R: seq=1001 len=1000
    S->>R: seq=2001 len=1000
    R->>S: ack=3001 rwnd=2000
    S->>R: seq=3001 len=1000
    S->>R: seq=4001 len=1000
    R->>S: ack=5001 rwnd=0
    Note over S: Stop sending, start persist timer
    S->>R: Window probe 1 byte seq=5001
    R->>S: ack=5001 rwnd=0
    Note over R: Application reads 2000 bytes
    R->>S: ack=5001 rwnd=2000 window update
    S->>R: seq=5001 len=1000`,
        },
        {
          type: 'points',
          items: [
            '**Zero window:** the sender stops and sends small probes on a persist timer until the window reopens.',
            '**Silly window syndrome:** tiny windows produce tiny segments. Under Clark\'s solution, the receiver waits until it can offer one MSS or half its buffer.',
            '**Nagle\'s algorithm:** a sender with small data waits for the outstanding ACK and groups the data. Interactive programs turn this off with `TCP_NODELAY`.',
            '**Window scaling** (RFC 7323): the 16-bit field limits the window to `65535` bytes. A shift `S` from `0` to `14` multiplies it by `2^S`, up to about 1 GiB.',
            '**BDP:** to fill a path, the window must reach bandwidth times RTT.',
          ],
        },
        {
          type: 'callout',
          variant: 'formula',
          text: '`Throughput <= Window / RTT` and `BDP = Bandwidth x RTT`.',
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'Linux and Windows autotune receive buffers. A 100 Mbit/s home line with a 20 ms RTT has a BDP of 250 KB, so even this needs window scaling. A 10 Gbit/s link between cloud regions at 100 ms needs 125 MB, far above default Linux limits.',
        },
        {
          type: 'case-study',
          title: 'Backup link stuck at 200 Mbit/s',
          scenario: 'A company replicates backups between two cloud regions over a 1 Gbit/s link with a 120 ms RTT. Throughput stays flat at 200 Mbit/s with almost no retransmissions.',
          steps: [
            'Implied window: `200 Mbit/s x 0.12 s = 24 Mbit`, which is 3 MB.',
            'Required window: `1 Gbit/s x 0.12 s = 120 Mbit`, which is 15 MB. The window is one fifth of the BDP.',
            'On the sender, `ss -ti` shows `cwnd x mss` at or above `snd_wnd`, and `snd_wnd` flat near 3 MB. The receiver is the limit, not the network.',
            'On the receiver, `sysctl net.ipv4.tcp_rmem` shows a maximum of `6291456`. Linux reserves part of that buffer for overhead, which fits the 3 MB window.',
            'Raise the limit with `sudo sysctl -w net.ipv4.tcp_rmem="4096 131072 33554432"`, and raise `net.ipv4.tcp_wmem` on the sender in the same way.',
            'Retest with `iperf3`. Autotuning now grows the window past 15 MB, and throughput reaches about 940 Mbit/s.',
          ],
        },
        {
          type: 'troubleshoot',
          symptom: 'A large transfer is slow or stalls even though the link is fast and shows little loss.',
          checks: [
            'Apply the Wireshark filter `tcp.analysis.zero_window`. Hits mean the receiving application is reading too slowly.',
            'Check for `WS` in both SYN packets. A middlebox that strips this option caps the window at 64 KB.',
            'Compare `cwnd x mss` with `snd_wnd` in `ss -ti` to see which limit is lower.',
          ],
          fix: 'If rwnd is the limit, speed up the reader or raise the buffer maximum. If scaling is stripped, fix the middlebox. If cwnd is the limit and retransmissions are present, investigate loss on the path instead.',
        },
        {
          type: 'mini-lab',
          title: 'Confirm throughput equals window divided by RTT',
          goal: 'Measure how a fixed window limits throughput once delay is added. This needs two Linux VMs on one host.',
          steps: [
            'On VM B, run `iperf3 -s`.',
            'On VM A, add delay with `sudo tc qdisc add dev eth0 root netem delay 50ms`, then confirm it with `ping`.',
            'On VM A, run `iperf3 -c <VM-B-IP> -w 64K -t 10` and note the bitrate.',
            'Run it again without `-w` so that autotuning applies.',
            'Remove the delay with `sudo tc qdisc del dev eth0 root`.',
          ],
          expected: 'The `-w 64K` run stays near `65536 x 8 / 0.05 s`, about 10.5 Mbit/s, or a little more because Linux adjusts requested buffer sizes. The autotuned run is much faster.',
        },
      ],
    },
    {
      id: 'congestion-control',
      title: 'Congestion control',
      videoId: 'ch06-congestion-control',
      blocks: [
        {
          type: 'paragraph',
          text: 'Flow control protects the receiver, while congestion control protects the network in between. If every sender transmits too fast, router queues overflow, packets drop and retransmissions add to the load. TCP avoids this by probing for capacity with a **congestion window** (`cwnd`) and cutting back when it detects congestion.',
        },
        {
          type: 'points',
          items: [
            'The sender limit is `min(cwnd, rwnd)`. The receiver advertises rwnd, but the sender only estimates cwnd.',
            'Routers usually give no rate information. Loss or an ECN mark is the signal.',
            '**AIMD** adds about 1 MSS per RTT and halves on loss. This forms a sawtooth and moves competing flows towards a fair share.',
            '**Self-clocking:** returning ACKs pace new data at about the rate the path delivers it.',
            '**Duplicate ACKs** show later segments still arrive, so the cut is moderate. A **timeout** is a stronger signal, so cwnd restarts from 1 MSS.',
          ],
        },
        {
          type: 'table',
          headers: ['Phase', 'Entered when', 'cwnd change', 'Effect'],
          rows: [
            ['Slow start', '`cwnd < ssthresh`', '`+1 MSS` per ACK', 'Doubles each RTT'],
            ['Congestion avoidance', '`cwnd >= ssthresh`', '`+MSS x MSS / cwnd` per ACK', 'About `+1 MSS` per RTT'],
            ['Fast retransmit', '3 duplicate ACKs', '`ssthresh = max(FlightSize / 2, 2 MSS)`', 'Resends the missing segment at once'],
            ['Fast recovery', 'After fast retransmit', '`cwnd = ssthresh + 3 MSS`, `+1 MSS` per extra duplicate', 'On new ACK, `cwnd = ssthresh`'],
            ['Timeout', 'RTO expires', '`ssthresh = max(FlightSize / 2, 2 MSS)`, `cwnd = 1 MSS`', 'Back to slow start, RTO doubled'],
          ],
        },
        {
          type: 'diagram',
          id: 'ch06-cwnd-phases',
          title: 'Congestion window phases in TCP Reno',
          caption: 'Follows RFC 5681. ssthresh is half of FlightSize with a floor of 2 MSS. A timeout during fast recovery also takes the timeout path.',
          kind: 'working-flowchart',
          mermaid: `flowchart TD
    A1["New connection with initial cwnd"]
    A2{"cwnd below ssthresh?"}
    A3["Slow start - add 1 MSS per ACK"]
    A4["Avoidance - add 1 MSS per RTT"]
    A5{"Loss detected?"}
    A6{"Which loss signal?"}
    B1["Set ssthresh to half of FlightSize"]
    B2["Fast retransmit missing segment"]
    B3["Fast recovery - cwnd = ssthresh + 3 MSS"]
    B4["Add 1 MSS per extra duplicate ACK"]
    B5{"New data ACKed?"}
    B6["Deflate cwnd to ssthresh"]
    C1["Set ssthresh to half of FlightSize"]
    C2["cwnd = 1 MSS, retransmit, double RTO"]
    A1 --> A2
    A2 -->|Yes| A3
    A2 -->|No| A4
    A3 --> A5
    A4 --> A5
    A5 -->|No| A2
    A5 -->|Yes| A6
    A6 -->|3 duplicate ACKs| B1
    A6 -->|Timeout| C1
    B1 --> B2
    B2 --> B3
    B3 --> B4
    B4 --> B5
    B5 -->|No| B4
    B5 -->|Yes| B6
    B6 --> A4
    C1 --> C2
    C2 --> A3`,
        },
        {
          type: 'callout',
          variant: 'formula',
          text: 'Average AIMD throughput is about `0.75 x W / RTT`, where `W` is the window at loss. The Mathis estimate for loss rate `p` is `Throughput = (MSS / RTT) x (1.22 / sqrt(p))`.',
        },
        {
          type: 'example',
          title: 'A short Reno trace',
          steps: [
            'Start with `cwnd = 1 MSS` and `ssthresh = 8 MSS`. Slow start gives 1, 2, 4, 8 MSS per RTT.',
            'At 8, cwnd has reached ssthresh, so congestion avoidance gives 9, then 10 MSS.',
            'Three duplicate ACKs arrive at `cwnd = 10`: `ssthresh = 5` and `cwnd = 5 + 3 = 8` during fast recovery.',
            'A new ACK deflates cwnd to 5, then linear growth gives 6, 7, 8 MSS.',
            'A timeout at `cwnd = 8` gives `ssthresh = 4` and `cwnd = 1`. The window then runs 1, 2, 4, 5 MSS.',
          ],
        },
        {
          type: 'table',
          headers: ['Algorithm', 'On 3 duplicate ACKs', 'On timeout', 'Status'],
          rows: [
            ['Tahoe', '`ssthresh` halved, `cwnd = 1 MSS`', 'Same', 'Historic, common in exams'],
            ['Reno', '`ssthresh` halved, fast recovery', '`cwnd = 1 MSS`', 'Teaching baseline, RFC 5681'],
            ['NewReno', 'Stays in recovery through partial ACKs', '`cwnd = 1 MSS`', 'RFC 6582, handles several losses per window'],
            ['CUBIC', 'Multiplies `cwnd` by `0.7`, then cubic growth', '`cwnd = 1 MSS`', 'Linux and current Windows default, RFC 9438'],
            ['BBR', 'Paces from a model of bandwidth and minimum RTT', 'Restarts low, then probes again', 'Large content providers, optional on Linux'],
          ],
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: '**Tahoe** drops to 1 MSS on every loss. **Reno** does so only on timeout. Numerical answers often assume slow start stops exactly at ssthresh, so state that assumption, and also state whether FlightSize equals cwnd.',
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'Linux starts at an initial window of 10 MSS (RFC 6928), not 1 MSS as in textbooks. With **ECN**, routers mark packets instead of dropping them; the receiver echoes the mark with `ECE` and the sender answers with `CWR`. Data centres pair ECN with DCTCP to keep queues short, and ISPs and home routers use queue managers such as `fq_codel` to limit bufferbloat.',
        },
        {
          type: 'command-lab',
          title: 'Watch cwnd react with iperf3',
          command: 'iperf3 -c 192.168.1.50 -t 5',
          output: `Connecting to host 192.168.1.50, port 5201
[  5] local 192.168.1.20 port 52210 connected to 192.168.1.50 port 5201
[ ID] Interval           Transfer     Bitrate         Retr  Cwnd
[  5]   0.00-1.00   sec  89.5 MBytes   751 Mbits/sec    0    412 KBytes
[  5]   1.00-2.00   sec   112 MBytes   940 Mbits/sec    0    625 KBytes
[  5]   2.00-3.00   sec   112 MBytes   940 Mbits/sec   42    438 KBytes
[  5]   3.00-4.00   sec   111 MBytes   931 Mbits/sec    0    512 KBytes
[  5]   4.00-5.00   sec   112 MBytes   940 Mbits/sec    0    571 KBytes
- - - - - - - - - - - - - - - - - - - - - - - - -
[ ID] Interval           Transfer     Bitrate         Retr
[  5]   0.00-5.00   sec   537 MBytes   901 Mbits/sec   42             sender
[  5]   0.00-5.04   sec   535 MBytes   890 Mbits/sec                  receiver`,
          explanation: [
            'The first lines show the client socket connecting to the default `iperf3` port `5201`.',
            'Interval `0.00-1.00` is slower at `751` Mbit/s because cwnd starts small and is still growing.',
            'Intervals near `940` Mbit/s are the practical payload limit of 1 Gbit/s Ethernet after headers.',
            'Interval `2.00-3.00` shows `42` retransmissions. Cwnd falls from `625` to `438` KBytes, about `0.7` times, which matches CUBIC.',
            'The last two intervals show cwnd growing again as the sender probes for capacity.',
            'The summary shows `537` MBytes sent and `535` MBytes received over a slightly longer interval, with `42` retransmissions in total.',
          ],
        },
      ],
    },
    {
      id: 'quic-overview',
      title: 'QUIC overview',
      blocks: [
        {
          type: 'paragraph',
          text: 'QUIC (RFC 9000) is a secure, multiplexed transport that normally runs in user space over UDP. It combines reliable delivery and congestion control with TLS 1.3 encryption (RFC 9001), and it is the transport under HTTP/3 (RFC 9114). It uses UDP because middleboxes often block new IP protocols, and kernel TCP stacks change slowly.',
        },
        {
          type: 'points',
          items: [
            '**Faster setup:** transport and crypto handshakes are combined, so a new connection needs 1 RTT. Resumption can use 0-RTT, but that data can be replayed, so it should be limited to safe requests.',
            '**Independent streams:** loss on one stream does not stall the others, which removes the transport-level head-of-line blocking of HTTP/2 over TCP.',
            '**Connection migration:** a Connection ID identifies the connection, so it can survive a move from Wi-Fi to mobile data.',
            '**Always encrypted:** payload and most header fields are protected, so middleboxes cannot depend on them.',
            '**Clear loss recovery:** packet numbers are never reused (RFC 9002), so RTT samples are not ambiguous.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch06-quic-stack',
          title: 'HTTPS over TCP compared with HTTP/3 over QUIC',
          caption: 'QUIC takes over reliability, stream multiplexing and encryption, and uses UDP only for ports and delivery through existing networks.',
          kind: 'block',
          mermaid: `flowchart TD
    subgraph S1["HTTP/2 stack"]
        A1["HTTP/2 streams"]
        A2["TLS 1.3 encryption"]
        A3["TCP - reliable byte stream"]
        A4["IP"]
        A1 --> A2
        A2 --> A3
        A3 --> A4
    end
    subgraph S2["HTTP/3 stack"]
        B1["HTTP/3 request mapping"]
        B2["QUIC streams, recovery, TLS 1.3"]
        B3["UDP - usually port 443"]
        B4["IP"]
        B1 --> B2
        B2 --> B3
        B3 --> B4
    end`,
        },
        {
          type: 'table',
          headers: ['Aspect', 'TCP with TLS 1.3', 'QUIC'],
          rows: [
            ['Runs in', 'OS kernel, with TLS in a library', 'Usually user space over UDP sockets'],
            ['Setup before first request', '2 RTT, 1 for TCP and 1 for TLS', '1 RTT, or 0-RTT on resumption'],
            ['Connection identity', '4-tuple, so an IP change breaks it', 'Connection ID, so it can survive an IP change'],
            ['Loss impact', 'One byte stream, so all HTTP/2 streams wait', 'Only the affected stream waits'],
            ['Visible to middleboxes', 'TCP header fully visible', 'Very few fields visible'],
          ],
        },
        {
          type: 'callout',
          variant: 'remember',
          text: 'QUIC does not make UDP reliable. QUIC implements reliability itself, and UDP only carries its packets.',
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'Servers advertise HTTP/3 with the `Alt-Svc` header or a DNS HTTPS record, and CDNs offer it widely. Some office firewalls block UDP `443` to keep traffic inspectable, so browsers fall back to TCP `443`. Always keep TCP open as well. QUIC can also cost more CPU per byte than kernel TCP, because of user-space processing and encryption.',
        },
      ],
    },
  ],
  flashcards: [
    {
      front: 'What does the transport layer add to IP delivery?',
      back: 'Process-to-process delivery using port numbers. TCP also adds reliability, ordering, flow control and congestion control.',
    },
    {
      front: 'What identifies a connected TCP socket?',
      back: 'The 4-tuple: source IP, source port, destination IP and destination port.',
    },
    {
      front: 'What are the four UDP header fields?',
      back: 'Source port, destination port, length and checksum, for a total of 8 bytes.',
    },
    {
      front: 'What are the minimum and maximum TCP header sizes?',
      back: '20 and 60 bytes. Data offset counts 32-bit words, from 5 to 15.',
    },
    {
      front: 'Which TCP flags use up a sequence number?',
      back: 'SYN and FIN use one each. A pure ACK uses none.',
    },
    {
      front: 'Write the three-way handshake using x and y as ISNs.',
      back: 'SYN seq=x, then SYN-ACK seq=y ack=x+1, then ACK seq=x+1 ack=y+1.',
    },
    {
      front: 'Why does TIME_WAIT exist?',
      back: 'To resend the last ACK if the peer FIN is retransmitted, and to let old duplicates expire. It lasts 2 MSL.',
    },
    {
      front: 'What do many CLOSE_WAIT sockets mean?',
      back: 'Peers have closed but the local application has not called close, which is usually a socket leak.',
    },
    {
      front: 'What is the difference between rwnd and cwnd?',
      back: 'rwnd protects the receiver and comes from the receiver. cwnd protects the network and is estimated by the sender. The limit is the smaller of the two.',
    },
    {
      front: 'What does Reno do after three duplicate ACKs?',
      back: 'Halves FlightSize into ssthresh, resends the missing segment, sets cwnd to ssthresh + 3 MSS and enters fast recovery.',
    },
    {
      front: "What is Karn's algorithm?",
      back: 'Take no RTT samples from retransmitted segments, and keep the backed-off RTO until a valid sample arrives.',
    },
    {
      front: 'How does QUIC survive a change of IP address?',
      back: 'It identifies the connection by a Connection ID instead of the 4-tuple.',
    },
  ],
  quiz: [
    {
      id: 'ch06-q1',
      question: 'Which values let the transport layer deliver data to the correct process on a host?',
      options: ['Source and destination MAC addresses', 'Source and destination port numbers', 'The IP TTL and Protocol fields', 'The TCP sequence and acknowledgment numbers'],
      answerIndex: 1,
      explanation: 'IP addresses identify the host, and port numbers identify the socket of the process.',
      difficulty: 'easy',
      topic: 'Ports and sockets',
    },
    {
      id: 'ch06-q2',
      question: 'How long is the UDP header?',
      options: ['20 bytes', '16 bytes', '12 bytes', '8 bytes'],
      answerIndex: 3,
      explanation: 'It has four 16-bit fields: source port, destination port, length and checksum.',
      difficulty: 'easy',
      topic: 'UDP',
    },
    {
      id: 'ch06-q3',
      question: 'What is the minimum length of a TCP header?',
      options: ['20 bytes', '8 bytes', '32 bytes', '60 bytes'],
      answerIndex: 0,
      explanation: 'With no options, Data offset is 5 words, which is 20 bytes. 60 bytes is the maximum.',
      difficulty: 'easy',
      topic: 'TCP header',
    },
    {
      id: 'ch06-q4',
      question: 'What does a listening server send after it receives a SYN?',
      options: ['FIN', 'RST', 'SYN-ACK', 'A pure ACK'],
      answerIndex: 2,
      explanation: 'The SYN-ACK carries the server ISN and acknowledges the client ISN plus one.',
      difficulty: 'easy',
      topic: 'Connection management',
    },
    {
      id: 'ch06-q5',
      question: 'What does the Window field in a TCP header advertise?',
      options: ['The congestion window of the sender', 'Free receive buffer space at the side sending this segment', 'The maximum segment size', 'The number of segments sent so far'],
      answerIndex: 1,
      explanation: 'The Window field carries rwnd, which is the flow control limit set by the receiver.',
      difficulty: 'easy',
      topic: 'Flow control',
    },
    {
      id: 'ch06-q6',
      question: 'What triggers TCP fast retransmit?',
      options: ['Expiry of the retransmission timer', 'A segment with RST set', 'A zero window advertisement', 'Three duplicate ACKs'],
      answerIndex: 3,
      explanation: 'Three duplicate ACKs indicate a missing segment while later segments still arrive, so TCP resends before the timer expires.',
      difficulty: 'easy',
      topic: 'Congestion control',
    },
    {
      id: 'ch06-q7',
      question: 'Two clients behind one NAT address connect to the same server IP and port 443. How does the server keep the connections separate?',
      options: ['It gives each client a different server port', 'It uses the MAC address of the NAT router', 'It uses the client source port in the 4-tuple', 'It uses the IP TTL value'],
      answerIndex: 2,
      explanation: 'NAT gives each flow a different public source port, so the two 4-tuples differ.',
      difficulty: 'medium',
      topic: 'Ports and sockets',
    },
    {
      id: 'ch06-q8',
      question: 'A client SYN has seq=7000 and the server picks ISN 9000. What are seq and ack in the SYN-ACK?',
      options: ['seq=7001 ack=9000', 'seq=9000 ack=7001', 'seq=9000 ack=7000', 'seq=9001 ack=7001'],
      answerIndex: 1,
      explanation: 'The server uses its own ISN as seq. Because the SYN uses one number, ack is 7000 + 1.',
      difficulty: 'medium',
      topic: 'Connection management',
    },
    {
      id: 'ch06-q9',
      question: 'A receiver gets an in-order segment with seq=2000 and 500 bytes of payload. Which ack number does it send?',
      options: ['2000', '2499', '2500', '2501'],
      answerIndex: 2,
      explanation: 'The segment holds bytes 2000 to 2499, so the next byte expected is 2500.',
      difficulty: 'medium',
      topic: 'Reliable transfer',
    },
    {
      id: 'ch06-q10',
      question: "What does Karn's algorithm require?",
      options: ['Ignore RTT samples from retransmitted segments', 'Retransmit after three duplicate ACKs', 'Halve cwnd on every ACK', 'Send a probe during a zero window'],
      answerIndex: 0,
      explanation: 'An ACK for a retransmitted segment could belong to either copy, so its RTT sample is unreliable.',
      difficulty: 'medium',
      topic: 'RTT and timeout',
    },
    {
      id: 'ch06-q11',
      question: 'A sender has cwnd = 20000 bytes, rwnd = 12000 bytes and 8000 bytes in flight. How many more bytes can it send now?',
      options: ['12000', '20000', '8000', '4000'],
      answerIndex: 3,
      explanation: 'Usable window = min(20000, 12000) - 8000 = 4000 bytes.',
      difficulty: 'medium',
      topic: 'Flow control',
    },
    {
      id: 'ch06-q12',
      question: 'A Reno sender has cwnd = 24 MSS, all in flight, and receives three duplicate ACKs. What are ssthresh and cwnd as it enters fast recovery?',
      options: ['ssthresh 12 MSS, cwnd 15 MSS', 'ssthresh 12 MSS, cwnd 1 MSS', 'ssthresh 24 MSS, cwnd 27 MSS', 'ssthresh 6 MSS, cwnd 9 MSS'],
      answerIndex: 0,
      explanation: 'ssthresh = 24 / 2 = 12 MSS and cwnd = ssthresh + 3 = 15 MSS. Setting cwnd to 1 MSS is the timeout response.',
      difficulty: 'medium',
      topic: 'Congestion control',
    },
    {
      id: 'ch06-q13',
      question: 'A path has 1 Gbit/s capacity and an 80 ms RTT. What is the smallest window scale shift that lets the TCP window cover the BDP?',
      options: ['6', '7', '8', '14'],
      answerIndex: 2,
      explanation: 'BDP = 10000000 bytes. 65535 x 128 = 8388480 is too small, while 65535 x 256 = 16776960 is enough, so the shift is 8.',
      difficulty: 'hard',
      topic: 'Flow control',
    },
    {
      id: 'ch06-q14',
      question: 'SRTT = 200 ms, RTTVAR = 40 ms and a new sample R = 120 ms. With alpha = 1/8, beta = 1/4, K = 4 and no minimum RTO, what is the new RTO?',
      options: ['310 ms', '390 ms', '350 ms', '430 ms'],
      answerIndex: 1,
      explanation: 'RTTVAR = 0.75 x 40 + 0.25 x 80 = 50 ms. SRTT = 0.875 x 200 + 0.125 x 120 = 190 ms. RTO = 190 + 4 x 50 = 390 ms.',
      difficulty: 'hard',
      topic: 'RTT and timeout',
    },
    {
      id: 'ch06-q15',
      question: 'Why does a lost packet in HTTP/3 over QUIC not stall unrelated requests as it can in HTTP/2 over TCP?',
      options: ['QUIC packets are never lost because of forward error correction', 'UDP guarantees in-order delivery', 'QUIC resends every stream after any loss', 'QUIC tracks ordering per stream, so only the affected stream waits'],
      answerIndex: 3,
      explanation: 'TCP delivers one ordered byte stream, so a gap blocks everything behind it. QUIC orders data within each stream separately.',
      difficulty: 'hard',
      topic: 'QUIC',
    },
  ],
  importantQuestions: [
    {
      q: 'Differentiate between a port and a socket.',
      modelAnswer: 'A port is a 16-bit number that identifies a service or process on a host. A socket is the kernel endpoint a process uses to communicate, addressed by IP and port. A TCP connection is identified by the full 4-tuple.',
      marks: 2,
    },
    {
      q: 'State the difference between flow control and congestion control.',
      modelAnswer: 'Flow control protects the receiver buffer using rwnd advertised by the receiver. Congestion control protects the network using cwnd estimated by the sender. The sender is limited by min(cwnd, rwnd).',
      marks: 2,
    },
    {
      q: 'Explain the TCP three-way handshake with sequence numbers. Why are two messages not enough?',
      modelAnswer: 'Client sends SYN seq=x and enters SYN_SENT.\nServer sends SYN-ACK seq=y ack=x+1 and enters SYN_RCVD.\nClient sends ACK seq=x+1 ack=y+1 and enters ESTABLISHED. The server enters ESTABLISHED when this arrives.\nMSS, window scale and SACK support are agreed in the SYN segments.\nTwo messages are not enough because the server would have no proof that the client received its ISN, and a stale duplicate SYN could open a false connection.',
      marks: 5,
    },
    {
      q: 'Compare TCP and UDP, and give two suitable applications for each with reasons.',
      modelAnswer: 'TCP is connection-oriented, reliable and ordered, has flow and congestion control, and uses a 20 to 60 byte header.\nUDP is connectionless and best effort, preserves message boundaries, supports multicast, and uses an 8 byte header.\nTCP suits HTTPS and SSH because all data must arrive correctly and in order.\nUDP suits DNS because one short query and reply needs no setup, and RTP voice because late packets are useless.',
      marks: 5,
    },
    {
      q: "Explain how TCP estimates RTT and computes RTO. What is Karn's algorithm?",
      modelAnswer: 'For a new sample R, TCP computes RTTVAR = 3/4 RTTVAR + 1/4 |SRTT - R|, then SRTT = 7/8 SRTT + 1/8 R.\nRTO = SRTT + max(G, 4 RTTVAR). The first sample sets SRTT = R and RTTVAR = R/2.\nKarn: take no samples from retransmitted segments, because the ACK is ambiguous.\nEach timeout doubles the RTO until a valid sample arrives.',
      marks: 5,
    },
    {
      q: 'Explain TCP congestion control, covering slow start, congestion avoidance, fast retransmit and fast recovery. Trace cwnd for an example.',
      modelAnswer: 'The sender limit is min(cwnd, rwnd), and loss is treated as a congestion signal.\nSlow start: while cwnd is below ssthresh, cwnd grows by 1 MSS per ACK, doubling each RTT.\nCongestion avoidance: from ssthresh onward, cwnd grows by about 1 MSS per RTT.\nFast retransmit: three duplicate ACKs set ssthresh = max(FlightSize/2, 2 MSS) and resend the missing segment.\nFast recovery: cwnd = ssthresh + 3 MSS, plus 1 MSS for each further duplicate ACK. A new ACK sets cwnd = ssthresh and avoidance continues.\nTimeout: ssthresh is set the same way, cwnd = 1 MSS, RTO doubles and slow start restarts.\nExample with ssthresh 8: 1, 2, 4, 8, 9, 10. Three duplicate ACKs give ssthresh 5, and after recovery cwnd runs 5, 6, 7, 8. A timeout at 8 gives ssthresh 4, and cwnd runs 1, 2, 4, 5.',
      marks: 10,
    },
    {
      q: 'Draw and explain the TCP state machine for connection establishment and termination. Why is TIME_WAIT needed?',
      modelAnswer: 'Setup, server: CLOSED to LISTEN on passive open, to SYN_RCVD on SYN, to ESTABLISHED on ACK.\nSetup, client: CLOSED to SYN_SENT on active open, to ESTABLISHED on SYN-ACK.\nActive close: ESTABLISHED to FIN_WAIT_1 on sending FIN, to FIN_WAIT_2 on its ACK, to TIME_WAIT on the peer FIN, to CLOSED after 2 MSL.\nPassive close: ESTABLISHED to CLOSE_WAIT on FIN, to LAST_ACK when the application closes, to CLOSED on the last ACK.\nSimultaneous close: FIN_WAIT_1 to CLOSING on FIN, then to TIME_WAIT on ACK.\nTIME_WAIT lets the active closer resend the last ACK if the peer FIN is retransmitted, and lets old duplicates of the same 4-tuple expire before the 4-tuple is reused.',
      marks: 10,
    },
  ],
  numericals: [
    {
      question: 'A TCP Reno sender starts with cwnd = 1 MSS and ssthresh = 16 MSS. Three duplicate ACKs arrive at the end of transmission round 9, and a timeout occurs at the end of round 14. Assume one round is one RTT, FlightSize equals cwnd, and slow start stops at ssthresh. Find cwnd for rounds 1 to 19 and ssthresh after each loss.',
      steps: [
        'Rounds 1 to 5 are slow start, doubling each round: 1, 2, 4, 8, 16 MSS.',
        'cwnd has reached ssthresh, so rounds 6 to 9 add 1 MSS per round: 17, 18, 19, 20 MSS.',
        'Three duplicate ACKs at cwnd = 20 give ssthresh = 20 / 2 = 10 MSS. After fast recovery, cwnd deflates to 10 MSS.',
        'Rounds 10 to 14 are congestion avoidance: 10, 11, 12, 13, 14 MSS.',
        'The timeout at cwnd = 14 gives ssthresh = 14 / 2 = 7 MSS and cwnd = 1 MSS.',
        'Rounds 15 to 17 are slow start: 1, 2, 4 MSS. Round 18 would be 8 but stops at ssthresh, giving 7 MSS. Round 19 is congestion avoidance: 8 MSS.',
      ],
      answer: 'cwnd by round is 1, 2, 4, 8, 16, 17, 18, 19, 20, 10, 11, 12, 13, 14, 1, 2, 4, 7, 8 MSS. ssthresh is 10 MSS after round 9 and 7 MSS after round 14.',
    },
    {
      question: 'A connection has no window scaling, so its maximum window is 65535 bytes. The RTT is 40 ms and the link capacity is 1 Gbit/s, with no loss. Find the maximum throughput and link utilisation.',
      steps: [
        'Window in bits = 65535 x 8 = 524280 bits.',
        'Throughput = 524280 / 0.040 s = 13107000 bit/s = 13.107 Mbit/s.',
        'Utilisation = 13.107 / 1000 = 0.0131, which is 1.31 percent.',
      ],
      answer: 'About 13.1 Mbit/s, which is about 1.31 percent of link capacity.',
    },
    {
      question: 'A sender has SRTT = 100 ms and RTTVAR = 20 ms. It measures R1 = 140 ms and then R2 = 80 ms. Using alpha = 1/8, beta = 1/4 and K = 4, and ignoring clock granularity and minimum RTO, find the RTO after each sample.',
      steps: [
        'R1: RTTVAR = 0.75 x 20 + 0.25 x |100 - 140| = 15 + 10 = 25 ms.',
        'R1: SRTT = 0.875 x 100 + 0.125 x 140 = 87.5 + 17.5 = 105 ms.',
        'R1: RTO = 105 + 4 x 25 = 205 ms.',
        'R2: RTTVAR = 0.75 x 25 + 0.25 x |105 - 80| = 18.75 + 6.25 = 25 ms.',
        'R2: SRTT = 0.875 x 105 + 0.125 x 80 = 91.875 + 10 = 101.875 ms.',
        'R2: RTO = 101.875 + 4 x 25 = 201.875 ms.',
      ],
      answer: 'RTO is 205 ms after R1 and 201.875 ms after R2.',
    },
    {
      question: 'A path has a capacity of 1 Gbit/s and an RTT of 50 ms. Find the BDP in bytes, the smallest window scale shift S that covers it, and the Window field value to advertise.',
      steps: [
        'BDP = 1000000000 x 0.05 = 50000000 bits = 6250000 bytes.',
        'With S = 6, the maximum window is 65535 x 64 = 4194240 bytes, which is too small.',
        'With S = 7, the maximum window is 65535 x 128 = 8388480 bytes, which is enough.',
        'Window field = 6250000 / 128 = 48828.125, rounded up to 48829.',
        'Check: 48829 x 128 = 6250112 bytes, which covers the BDP.',
      ],
      answer: 'BDP = 6250000 bytes (6.25 MB), S = 7, and the Window field value is 48829.',
    },
    {
      question: 'A long-lived TCP flow has MSS = 1460 bytes, RTT = 100 ms and loss rate p = 0.0001. Estimate its throughput with the Mathis formula.',
      steps: [
        'MSS / RTT = 1460 / 0.1 = 14600 bytes/s.',
        'sqrt(p) = sqrt(0.0001) = 0.01, so 1.22 / 0.01 = 122.',
        'Throughput = 14600 x 122 = 1781200 bytes/s.',
        'In bits, 1781200 x 8 = 14249600 bit/s, which is about 14.25 Mbit/s.',
      ],
      answer: 'About 14.25 Mbit/s, regardless of how fast the link is.',
    },
  ],
  keyTerms: [
    'Port number: 16-bit value that identifies a process or service on a host',
    'Socket: Kernel endpoint a program uses to send and receive data',
    '4-tuple: Source IP, source port, destination IP and destination port of a connection',
    'Multiplexing: Merging data from many sockets into segments handed to IP',
    'Demultiplexing: Delivering received data to the correct socket using header fields',
    'MSS: Largest TCP payload in one segment, excluding TCP and IP headers',
    'ISN: Initial sequence number chosen by each side at connection setup',
    'Cumulative ACK: Acknowledgment number that names the next byte expected',
    'SACK: TCP option that reports non-contiguous byte ranges already received',
    'rwnd: Receive window, the free buffer space the receiver advertises',
    'cwnd: Congestion window, the sender estimate of what the network can carry',
    'ssthresh: Threshold that separates slow start from congestion avoidance',
    'RTO: Retransmission timeout, computed from SRTT and RTTVAR',
    'SRTT: Smoothed round-trip time, a weighted average of RTT samples',
    'TIME_WAIT: State the active closer holds for 2 MSL before fully closing',
    'BDP: Bandwidth-delay product, the data a path can hold in flight',
    'AIMD: Additive increase, multiplicative decrease rule for adjusting cwnd',
    'QUIC: Encrypted, multiplexed transport over UDP, used by HTTP/3',
  ],
  formulas: [
    { name: 'MSS on a link', expression: 'MSS = MTU - IP header - TCP header', note: '1500 - 20 - 20 = 1460 bytes on IPv4 Ethernet with no options' },
    { name: 'Maximum UDP payload on IPv4', expression: 'Payload = 65535 - 20 - 8 = 65507 bytes' },
    { name: 'Usable send window', expression: 'Usable = min(cwnd, rwnd) - bytes in flight' },
    { name: 'Receive window', expression: 'rwnd = RcvBuffer - (LastByteRcvd - LastByteRead)' },
    { name: 'Window-limited throughput', expression: 'Throughput = Window / RTT' },
    { name: 'Bandwidth-delay product', expression: 'BDP = Bandwidth x RTT', note: 'The window must reach the BDP to fill the path' },
    { name: 'Scaled window', expression: 'Window in bytes = Window field x 2^S', note: 'S ranges from 0 to 14' },
    { name: 'Congestion avoidance growth', expression: 'cwnd = cwnd + MSS x MSS / cwnd per ACK', note: 'About 1 MSS per RTT' },
    { name: 'ssthresh on loss', expression: 'ssthresh = max(FlightSize / 2, 2 x MSS)' },
    { name: 'Smoothed RTT', expression: 'SRTT = (1 - 1/8) x SRTT + 1/8 x R' },
    { name: 'RTT variation', expression: 'RTTVAR = (1 - 1/4) x RTTVAR + 1/4 x |SRTT - R|', note: 'Update this before SRTT' },
    { name: 'Retransmission timeout', expression: 'RTO = SRTT + max(G, 4 x RTTVAR)', note: 'G is the clock granularity' },
    { name: 'Average AIMD throughput', expression: 'Average = 0.75 x W / RTT', note: 'W is the window at loss' },
    { name: 'Mathis estimate', expression: 'Throughput = (MSS / RTT) x (1.22 / sqrt(p))', note: 'p is the packet loss rate' },
  ],
  handsOnChecklist: [
    'List listening and established sockets with netstat -ano on Windows or ss -tuna on Linux, and match one socket to its process.',
    'Capture a TCP handshake and connection close in Wireshark, and write down the relative seq and ack numbers.',
    'Compare dig example.com with dig +tcp example.com in Wireshark, and count the packets before the answer arrives.',
    'Read cwnd, ssthresh, rtt and rto for a live connection using ss -ti on Linux.',
    'Measure throughput with iperf3 between two VMs, add 50 ms of delay with tc netem, and compare the results.',
    'Open browser DevTools, show the Protocol column, and find one site using h3 and one using h2.',
  ],
};

export default chapter;

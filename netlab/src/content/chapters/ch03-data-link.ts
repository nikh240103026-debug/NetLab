import type { Chapter } from '@/lib/types';

const chapter: Chapter = {
  slug: 'data-link',
  number: 3,
  title: 'Data link layer',
  shortTitle: 'Data link',
  summary:
    "The data link layer moves frames across a single link. This chapter covers framing, error detection and correction, flow control and ARQ, MAC protocols and CSMA/CD, the Ethernet frame, MAC addressing, ARP, switches, VLANs with 802.1Q trunking, and an overview of STP, each with how it is used in real networks.",
  estMinutes: 85,
  learningObjectives: [
    "Explain the services of the data link layer and compare byte-oriented and bit-oriented framing.",
    "Calculate parity, Internet checksum, CRC and Hamming check bits, and locate a single-bit error.",
    "Analyse stop-and-wait, Go-Back-N and Selective Repeat ARQ, including window limits and link efficiency.",
    "Derive ALOHA throughput and the CSMA/CD minimum frame size, and describe binary exponential backoff.",
    "Decode an Ethernet frame and a MAC address, and trace how ARP resolves an IPv4 address.",
    "Describe switch learning and forwarding, configure VLANs and 802.1Q trunks, and explain why STP blocks ports.",
  ],
  overviewVideoId: 'ch03-overview',
  sections: [
    {
      id: 'role-and-framing',
      title: 'Role of the data link layer and framing',
      videoId: 'ch03-framing-and-crc',
      blocks: [
        { type: 'paragraph', text: "The data link layer (Layer 2) moves a frame across one link, from a node to the next directly connected node. It wraps each network layer packet in a header and trailer, then hands the bits to the physical layer. Routing across networks belongs to Layer 3, while Layer 2 works one hop at a time." },
        { type: 'points', items: [
          "**Framing:** marks where each frame starts and stops in the bit stream.",
          "**Physical addressing:** carries the source and destination MAC addresses.",
          "**Error control:** detects damaged frames and, on some links, retransmits them.",
          "**Flow control:** stops a fast sender from overrunning a slow receiver.",
          "**Medium access control:** decides who may transmit on a shared channel.",
        ] },
        { type: 'paragraph', text: "IEEE 802 splits this layer into two sublayers. **LLC** (Logical Link Control, 802.2) faces the network layer, and **MAC** (Medium Access Control) handles addressing and channel access for a technology such as 802.3 Ethernet or 802.11 Wi-Fi." },
        { type: 'paragraph', text: "The physical layer delivers only a stream of bits, so the receiver needs a rule for finding frame boundaries. That rule must still work when the payload happens to contain the boundary pattern." },
        { type: 'table', headers: ["Method", "How it works", "Weakness", "Used in"], rows: [
          ["Byte count", "A header field gives the frame length", "One corrupted count loses synchronisation", "Rarely used alone"],
          ["Byte stuffing", "A flag byte marks each boundary, and an escape byte protects flag values in the data", "Overhead depends on the data", "PPP: flag `0x7E`, escape `0x7D`"],
          ["Bit stuffing", "Flag `01111110`, with a `0` added after five consecutive 1s", "Frame length varies with the data", "HDLC"],
          ["Coding violation", "Line code symbols that never carry data mark the boundaries", "Needs support in the line code", "100BASE-TX (4B/5B), 10 GbE (64B/66B)"],
        ] },
        { type: 'example', title: "Bit stuffing step by step", steps: [
          "Data to send: `0111111101`, which has seven 1s in a row.",
          "After the first five 1s the sender inserts a `0`: `011111` + `0` + `1101` gives `01111101101`.",
          "On the wire with flags: `01111110 01111101101 01111110`.",
          "The receiver removes any `0` that follows five 1s and recovers `0111111101`.",
        ] },
        { type: 'paragraph', text: "Byte stuffing in PPP works by escaping. A data byte `0x7E` is sent as `0x7D 0x5E`, and a data byte `0x7D` is sent as `0x7D 0x5D`, where the second byte is the original XOR `0x20`." },
        { type: 'callout', variant: 'exam-tip', text: "A `0` is stuffed after five 1s even when the next data bit is already `0`. So `111110` becomes `1111100`. Without this, the receiver could not tell which zeros to remove." },
        { type: 'callout', variant: 'remember', text: "The MAC addresses in a frame change at every router hop. The IP addresses stay the same along the path unless NAT rewrites them." },
        { type: 'callout', variant: 'real-world', text: "Ethernet marks frames with a preamble, a Start Frame Delimiter and a mandatory idle gap, and the NIC does this in hardware. Home broadband often runs PPP inside Ethernet (PPPoE), where Ethernet does the framing and the PPP flags are dropped. HDLC-style framing is still found on leased serial WAN links." },
      ],
    },
    {
      id: 'error-detection-correction',
      title: 'Error detection and correction',
      blocks: [
        { type: 'paragraph', text: "Noise, crosstalk and interference flip bits in transit. The sender adds redundant bits so the receiver can check the frame. **Detection codes** only reveal that an error happened, so the frame is discarded or resent, while **correction codes** (FEC) carry enough redundancy to repair it." },
        { type: 'points', items: [
          "**Single-bit error:** one bit flips. Common in memory and low-noise links.",
          "**Burst error:** several nearby bits are damaged. Common on real links, such as during an interference spike.",
          "**Hamming distance:** the number of bit positions in which two codewords differ. The minimum distance of a code sets its power.",
        ] },
        { type: 'table', headers: ["Method", "Check bits", "Detects", "Corrects", "Used in"], rows: [
          ["Single parity", "1", "Any odd number of bit errors", "None", "Serial links, simple memory"],
          ["2D parity", "1 per row and column", "All 1, 2 and 3 bit errors", "Single-bit", "Teaching, older storage"],
          ["Internet checksum", "16", "Most errors, but misses swapped words", "None", "IPv4 header, TCP, UDP"],
          ["CRC", "`r`, 32 in Ethernet", "All bursts up to `r` bits, nearly all others", "None", "Ethernet, Wi-Fi, disks"],
          ["Hamming (7,4)", "3", "Up to 2 bit errors if not correcting", "Single-bit", "Basis of ECC memory"],
        ] },
        { type: 'example', title: "Parity and Internet checksum", steps: [
          "**Parity:** data `1011001` has four 1s, so the even parity bit is `0` and the frame is `10110010`. If two bits flip, the count stays even and the error goes unnoticed.",
          "**Checksum:** add the 16-bit words: `0x1234 + 0xF0F0 = 0x10324`.",
          "Wrap the carry: `0x0324 + 0x1 = 0x0325`.",
          "Take the one's complement: `0xFFFF - 0x0325 = 0xFCDA`, which is sent as the checksum.",
          "The receiver adds all words: `0x1234 + 0xF0F0 + 0xFCDA = 0x1FFFE`, which wraps to `0xFFFF`. All ones means accept.",
        ] },
        { type: 'paragraph', text: "A **Cyclic Redundancy Check (CRC)** treats the frame bits as coefficients of a polynomial and divides them by an agreed generator `G(x)` in modulo-2 arithmetic, where subtraction is plain XOR with no borrows. The remainder is sent as the check bits, so the transmitted frame divides exactly by `G(x)`." },
        { type: 'points', items: [
          "`G` has degree `r`, one less than its bit length. For `10011`, `G(x) = x^4 + x + 1` and `r = 4`.",
          "The sender appends `r` zeros to the data and divides by `G` using XOR.",
          "The `r`-bit remainder replaces the zeros, and the frame is transmitted.",
          "The receiver divides the whole frame by `G`. A zero remainder means accept, and anything else means discard.",
        ] },
        {
          type: 'diagram',
          id: 'ch03-crc-division',
          title: "CRC division for data 1101011011",
          caption: "Each step XORs with the generator when the leading bit is 1 and brings down the next bit. Q is the quotient bit. The remainder 1110 replaces the four appended zeros.",
          kind: 'working-diagram',
          mermaid: `flowchart TD
    subgraph TX["Sender"]
        A1["Data 1101011011"] --> A2["Generator 10011, degree r = 4"]
        A2 --> A3["Dividend 11010110110000"]
        A3 --> B1["11010 XOR 10011 = 01001, Q=1"]
        B1 --> B2["10011 XOR 10011 = 00000, Q=1"]
        B2 --> B3["00001 leads with 0, Q=0"]
        B3 --> B4["00010 leads with 0, Q=0"]
        B4 --> B5["00101 leads with 0, Q=0"]
        B5 --> B6["01011 leads with 0, Q=0"]
        B6 --> B7["10110 XOR 10011 = 00101, Q=1"]
        B7 --> B8["01010 leads with 0, Q=0"]
        B8 --> B9["10100 XOR 10011 = 00111, Q=1"]
        B9 --> B10["01110 leads with 0, Q=0"]
        B10 --> C1["Remainder 1110, quotient 1100001010"]
        C1 --> C2["Transmit 11010110111110"]
    end
    subgraph RX["Receiver"]
        D1["Divide received frame by 10011"] --> D2{"Remainder 0000?"}
        D2 -->|Yes| D3["Accept frame"]
        D2 -->|No| D4["Discard frame"]
    end
    C2 --> D1`,
        },
        { type: 'points', items: [
          "CRC detects all single-bit errors, because `G` has more than one term.",
          "It detects all burst errors of length up to `r`.",
          "It detects every odd number of bit errors if `x + 1` is a factor of `G`.",
          "Ethernet CRC-32 has `r = 32`, so a random error pattern escapes with a chance of about 1 in 4 billion.",
        ] },
        { type: 'paragraph', text: "**Hamming code** corrects a single-bit error without any retransmission. Parity bits sit at positions that are powers of 2 (1, 2, 4, 8), and each one checks every position whose binary index includes that power. The receiver recomputes the checks to get a **syndrome**, and the syndrome value is the position of the wrong bit." },
        { type: 'table', headers: ["Parity bit", "Checks positions", "Position index rule"], rows: [
          ["P1", "1, 3, 5, 7", "Bit value 1 is set in the index"],
          ["P2", "2, 3, 6, 7", "Bit value 2 is set in the index"],
          ["P4", "4, 5, 6, 7", "Bit value 4 is set in the index"],
        ] },
        { type: 'example', title: "Hamming (7,4) with even parity, data 1101", steps: [
          "Place data in positions 3, 5, 6, 7: position 3 = `1`, 5 = `1`, 6 = `0`, 7 = `1`.",
          "P1 covers data `1, 1, 1`, so `P1 = 1`. P2 covers `1, 0, 1`, so `P2 = 0`. P4 covers `1, 0, 1`, so `P4 = 0`.",
          "Codeword in positions 1 to 7: `1010101`.",
          "Suppose `1010001` arrives. C1 checks `1, 1, 0, 1`, which is odd, so `C1 = 1`. C2 checks `0, 1, 0, 1`, which is even, so `C2 = 0`. C4 checks `0, 0, 0, 1`, which is odd, so `C4 = 1`.",
          "Syndrome `C4 C2 C1 = 101` is 5, so position 5 is flipped back.",
        ] },
        { type: 'callout', variant: 'formula', text: "Parity bits for `m` data bits: smallest `r` with `2^r >= m + r + 1`. Detecting `d` errors needs minimum distance `d + 1`. Correcting `t` errors needs minimum distance `2t + 1`." },
        { type: 'callout', variant: 'remember', text: "CRC guards against accidental errors, not attackers. Anyone who alters a frame can recompute the FCS, so protection against tampering needs cryptography such as MACsec or TLS." },
        { type: 'callout', variant: 'real-world', text: "Wired Ethernet only detects: a NIC or switch drops a frame with a bad FCS, and TCP recovers the data later. Wi-Fi is much noisier, so it combines FEC (BCC or LDPC), the FCS and link-level ACKs. Many 25G and faster Ethernet links add Reed-Solomon FEC, and server ECC memory uses an extended Hamming code." },
      ],
    },
    {
      id: 'flow-control-arq',
      title: 'Flow control and ARQ: stop-and-wait, Go-Back-N, Selective Repeat',
      videoId: 'ch03-sliding-window-arq',
      blocks: [
        { type: 'paragraph', text: "**Flow control** stops a fast sender from overwhelming a slow receiver. **ARQ** (Automatic Repeat reQuest) recovers lost or damaged frames by retransmitting them. Both rely on the same tools, so protocols usually implement them together." },
        { type: 'points', items: [
          "**Sequence number:** identifies each frame, so the receiver can spot duplicates and gaps.",
          "**ACK:** tells the sender which frames arrived. A **NAK** asks for a specific frame again.",
          "**Timer:** triggers a retransmission if no ACK arrives in time.",
          "**Window:** limits how many unacknowledged frames may be outstanding.",
        ] },
        { type: 'paragraph', text: "In **stop-and-wait ARQ**, the sender transmits one frame and waits for its ACK, resending if the timer expires. A 1-bit sequence number (0, 1) is enough to reject duplicates. It is simple, but it wastes the link whenever the round trip is long compared with the frame time." },
        { type: 'paragraph', text: "**Sliding window** protocols keep several frames in flight, and the window moves forward as ACKs arrive. **Go-Back-N** keeps the receiver simple: it accepts only the next expected frame, so one loss forces a resend of everything after it. **Selective Repeat** buffers out-of-order frames and resends just the missing ones." },
        { type: 'callout', variant: 'formula', text: "Transmission time `Tt = L / R`, propagation delay `Tp = d / v`, and `a = Tp / Tt`. Stop-and-wait efficiency is `U = 1 / (1 + 2a)`. With no errors, a window of `N` frames gives `U = min(1, N / (1 + 2a))`." },
        { type: 'table', headers: ["Feature", "Stop-and-wait", "Go-Back-N", "Selective Repeat"], rows: [
          ["Sender window", "1", "Up to `2^k - 1`", "Up to `2^(k-1)`"],
          ["Receiver window", "1", "1", "Same as sender"],
          ["Out-of-order frames", "Not applicable", "Discarded", "Buffered"],
          ["ACK style", "Per frame", "Cumulative", "Individual, optional NAK"],
          ["On a loss", "Resend that frame", "Resend the lost frame and all later ones", "Resend only the lost frame"],
          ["Receiver cost", "Lowest", "Low", "Highest, needs buffers and reordering"],
        ] },
        {
          type: 'diagram',
          id: 'ch03-sliding-window',
          title: "Sliding window with a lost frame in Go-Back-N",
          caption: "Go-Back-N with 3-bit sequence numbers and a window of 4. Here ACK n means the next expected frame is n. Losing frame 2 makes the receiver discard frames 3 and 4, so all three are resent after the timeout.",
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant S as Sender
    participant R as Receiver
    Note over S,R: Go-Back-N, k = 3, window N = 4
    S->>R: Frame 0
    R-->>S: ACK 1
    S->>R: Frame 1
    R-->>S: ACK 2
    Note over S: Window slides to frames 2 to 5
    S-xR: Frame 2 is lost
    S->>R: Frame 3
    Note over R: Expected 2, discard 3
    R-->>S: ACK 2 duplicate
    S->>R: Frame 4
    Note over R: Expected 2, discard 4
    R-->>S: ACK 2 duplicate
    Note over S: Timer for frame 2 expires
    S->>R: Frame 2 resent
    R-->>S: ACK 3
    S->>R: Frame 3 resent
    R-->>S: ACK 4
    S->>R: Frame 4 resent
    R-->>S: ACK 5`,
        },
        { type: 'example', title: "Why the window limits exist (k = 2, sequence numbers 0 to 3)", steps: [
          "**Go-Back-N with window 4 fails:** the sender sends 0, 1, 2, 3 and every ACK is lost. It resends 0, but the receiver now expects the next cycle's 0 and wrongly accepts the old copy.",
          "**Go-Back-N with window 3 works:** after 0, 1, 2 the receiver expects 3, so a resent 0 is rejected.",
          "**Selective Repeat with window 3 fails:** after 0, 1, 2 the receiver window is 3, 0, 1, so a resent 0 looks new.",
          "**Selective Repeat with window 2 works:** after 0, 1 the receiver window is 2, 3, so a resent 0 is recognised as a duplicate.",
        ] },
        { type: 'callout', variant: 'exam-tip', text: "State your ACK convention. Many textbooks use `ACK n` to mean the next expected frame is `n`, while others use it to mean frame `n` arrived. Either is accepted if you stay consistent." },
        { type: 'callout', variant: 'real-world', text: "Ethernet has no ARQ, so TCP recovers losses at Layer 4 with its own sliding window. Wi-Fi does ARQ at Layer 2 with block ACKs, which act like Selective Repeat, and 4G and 5G radio links do the same in RLC. For flow control, Ethernet offers 802.3x PAUSE frames (EtherType `0x8808`), and data centres use per-priority PFC (802.1Qbb) to keep storage traffic lossless." },
      ],
    },
    {
      id: 'mac-protocols',
      title: 'MAC protocols: ALOHA, CSMA and CSMA/CD',
      videoId: 'ch03-csma-cd-ethernet',
      blocks: [
        { type: 'paragraph', text: "When many stations share one channel, two simultaneous transmissions collide and both are lost. A **Medium Access Control protocol** decides who transmits and when. The families below trade simplicity against efficiency under load." },
        { type: 'points', items: [
          "**Channel partitioning:** TDMA, FDMA and CDMA give each station a fixed share.",
          "**Random access:** ALOHA and CSMA let stations transmit freely, then recover from collisions.",
          "**Taking turns:** polling and token passing grant permission in sequence.",
        ] },
        { type: 'paragraph', text: "In **pure ALOHA**, a station sends whenever it has a frame and waits a random time after a collision. A frame of duration T is at risk from any frame starting within a 2T window. **Slotted ALOHA** allows sending only at slot boundaries, which halves the vulnerable period to T and doubles the peak throughput." },
        { type: 'callout', variant: 'formula', text: "`G` is the offered load in frames per frame time, and `S` is the throughput. Pure ALOHA: `S = G e^(-2G)`, peak `0.184` at `G = 0.5`. Slotted ALOHA: `S = G e^(-G)`, peak `0.368` at `G = 1`." },
        { type: 'paragraph', text: "**CSMA** adds listening before talking, which avoids most collisions. Collisions still happen because of propagation delay: a station may sense an idle channel while another station's signal is still on its way." },
        { type: 'table', headers: ["Strategy", "If the channel is idle", "If the channel is busy"], rows: [
          ["1-persistent", "Send at once", "Keep sensing, send the moment it is idle. Used by classic Ethernet"],
          ["Non-persistent", "Send at once", "Wait a random time, then sense again"],
          ["p-persistent", "Send with probability `p`, else defer one slot", "Keep sensing until idle. Used on slotted channels"],
        ] },
        { type: 'paragraph', text: "**CSMA/CD** adds collision detection. A wired station compares what it sends with what it hears on the cable. On a collision it stops at once and sends a jam signal, so far less time is wasted than a whole frame." },
        {
          type: 'diagram',
          id: 'ch03-csma-cd-flow',
          title: "CSMA/CD transmission flowchart",
          caption: "Procedure of a half-duplex Ethernet station, with 1-persistent sensing and binary exponential backoff. The collision count n resets for each new frame.",
          kind: 'flowchart',
          mermaid: `flowchart TD
    A1["Frame ready, collisions n = 0"] --> A2{"Medium idle?"}
    A2 -->|No| A3["Keep sensing until idle"]
    A3 --> A2
    A2 -->|Yes| A4["Wait interframe gap of 96 bit times"]
    A4 --> A5["Transmit frame and monitor the medium"]
    A5 --> A6{"Collision detected?"}
    A6 -->|No| A7{"Whole frame sent?"}
    A7 -->|No| A5
    A7 -->|Yes| A8["Transmission successful"]
    A6 -->|Yes| A9["Abort data, send 32-bit jam signal"]
    A9 --> A10["Increment collision count n"]
    A10 --> A11{"n reached 16?"}
    A11 -->|Yes| A12["Discard frame, report failure"]
    A11 -->|No| A13["m = min of n and 10"]
    A13 --> A14["Pick K at random from 0 to 2^m - 1"]
    A14 --> A15["Wait K x 512 bit times"]
    A15 --> A2`,
        },
        { type: 'points', items: [
          "**Jam signal:** 32 bits, so every station notices the collision.",
          "**Backoff:** after collision `n`, pick `K` at random from `0` to `2^m - 1`, where `m = min(n, 10)`, then wait `K x 512` bit times.",
          "**Slot time:** 512 bit times, which is `51.2 µs` at 10 Mbps and `5.12 µs` at 100 Mbps.",
          "**Give up:** after 16 attempts the frame is discarded and the failure is reported upward.",
        ] },
        { type: 'callout', variant: 'formula', text: "A sender must still be transmitting when news of a collision returns, so `Tt >= 2 x Tp`, which gives `Lmin = 2 x Tp x R`. Classic 10 Mbps Ethernet fixes this at 512 bits, the 64-byte minimum frame." },
        { type: 'callout', variant: 'exam-tip', text: "After the third collision `K` is chosen from 0 to 7, so at 10 Mbps the longest wait is `7 x 51.2 = 358.4 µs`. Write `m = min(n, 10)` in your answer, because the range stops growing after the tenth collision." },
        { type: 'callout', variant: 'real-world', text: "Modern Ethernet is switched and full duplex, so each device has its own send and receive paths, there are no collisions, and CSMA/CD stays idle. 10 Gbps and faster links do not support half duplex at all. Wi-Fi still shares the air and uses **CSMA/CA**, since a radio cannot hear collisions while sending. Slotted ALOHA survives in the random access channels of 4G and 5G, and in RFID." },
        { type: 'case-study', title: "From shared hubs to a switched lab", scenario: "A college lab connects 40 PCs through 100 Mbps hubs. During practicals, downloads from the local server crawl and the network feels unusable.", steps: [
          "All 40 PCs share one collision domain and one half-duplex channel, so each averages at most `100 / 40 = 2.5 Mbps` at peak, and collisions waste more.",
          "The team replaces the hubs with switches, so every port becomes its own collision domain.",
          "Auto-negotiation selects full duplex, CSMA/CD stops being used, and each PC can send and receive at link speed together.",
          "The bottleneck moves to the server link, which is upgraded to 1 Gbps.",
          "Broadcasts still reach all 40 PCs, because a switch does not split a broadcast domain. VLANs solve that later in this chapter.",
        ] },
      ],
    },
    {
      id: 'ethernet-frame-mac-addressing',
      title: 'Ethernet frame and MAC addressing',
      blocks: [
        { type: 'paragraph', text: "**Ethernet** (IEEE 802.3) is the standard wired LAN technology, from home routers to data centres. Its frame format has stayed almost unchanged since the 1980s, while speeds have grown from 10 Mbps to hundreds of Gbps." },
        {
          type: 'diagram',
          id: 'ch03-ethernet-frame',
          title: "Ethernet II frame fields",
          caption: "Fields in transmission order. Frame size is counted from Destination MAC to FCS: 64 to 1518 bytes. Preamble, SFD and the interframe gap are not part of that count.",
          kind: 'block',
          mermaid: `flowchart LR
    subgraph PH["Physical layer lead-in"]
        A1["Preamble 7 bytes"] --> A2["SFD 1 byte"]
    end
    subgraph FR["MAC frame 64 to 1518 bytes"]
        B1["Destination MAC 6 bytes"] --> B2["Source MAC 6 bytes"]
        B2 --> B3["EtherType 2 bytes"]
        B3 --> B4["Payload 46 to 1500 bytes"]
        B4 --> B5["FCS CRC-32 4 bytes"]
    end
    A2 --> B1
    B5 --> C1["Interframe gap 12 bytes"]`,
        },
        { type: 'table', headers: ["Field", "Bytes", "Purpose"], rows: [
          ["Preamble", "7", "Alternating `10101010` pattern that synchronises the receiver clock"],
          ["SFD", "1", "`10101011`, marks the start of the frame"],
          ["Destination MAC", "6", "Unicast, multicast or broadcast receiver"],
          ["Source MAC", "6", "Sender interface, always unicast"],
          ["EtherType or Length", "2", "`0x0600` or above is an EtherType. `1500` or below is a length (802.3 with LLC)"],
          ["Payload", "46 to 1500", "Upper layer data, padded if shorter than 46 bytes"],
          ["FCS", "4", "CRC-32 over destination MAC through payload"],
        ] },
        { type: 'points', items: [
          "**Minimum frame:** 6 + 6 + 2 + 46 + 4 = 64 bytes.",
          "**Maximum frame:** 6 + 6 + 2 + 1500 + 4 = 1518 bytes, or 1522 bytes with an 802.1Q tag.",
          "**EtherType values:** `0x0800` IPv4, `0x0806` ARP, `0x86DD` IPv6, `0x8100` VLAN tag.",
          "**Jumbo frames:** payloads of about 9000 bytes, common in data centres and not part of the base standard.",
        ] },
        { type: 'example', title: "Ethernet overhead on the wire", steps: [
          "Every frame also costs 8 bytes of preamble and SFD, and a 12-byte interframe gap.",
          "Full-size frame: `1518 + 8 + 12 = 1538` bytes on the wire, so payload efficiency is `1500 / 1538 = 97.5%`.",
          "Minimum frame: `64 + 8 + 12 = 84` bytes, or 672 bits, so a 1 Gbps port carries at most `10^9 / 672 = 1,488,095` frames per second.",
          "This is the 1.488 Mpps per gigabit port quoted on switch datasheets.",
        ] },
        { type: 'paragraph', text: "A **MAC address** is a 48-bit address written as six hexadecimal bytes, such as `00:1A:2B:3C:4D:5E`. Unlike an IP address it has no routing hierarchy, so it is useful only on the local link. Vendors receive a 24-bit **OUI** and number their interfaces under it." },
        { type: 'points', items: [
          "**I/G bit:** lowest bit of the first byte. `0` is unicast, `1` is group (multicast or broadcast).",
          "**U/L bit:** next bit up. `0` is universally assigned by a vendor, `1` is locally administered.",
          "**Broadcast:** `FF:FF:FF:FF:FF:FF`, received by every station in the LAN.",
        ] },
        { type: 'table', headers: ["Address", "First byte", "I/G", "U/L", "Meaning"], rows: [
          ["`00:1A:2B:3C:4D:5E`", "`00000000`", "0", "0", "Unicast, vendor assigned"],
          ["`02:42:AC:11:00:02`", "`00000010`", "0", "1", "Unicast, locally administered (Docker container)"],
          ["`01:00:5E:00:00:FB`", "`00000001`", "1", "0", "IPv4 multicast"],
          ["`FF:FF:FF:FF:FF:FF`", "`11111111`", "1", "1", "Broadcast"],
        ] },
        {
          type: 'command-lab',
          title: "Read your MAC address on Linux",
          command: "ip link show eth0",
          output: `2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP mode DEFAULT group default qlen 1000
    link/ether 00:1a:2b:3c:4d:5e brd ff:ff:ff:ff:ff:ff`,
          explanation: [
            "`2: eth0` is the interface index and name.",
            "`BROADCAST,MULTICAST` are supported modes. `UP` means enabled by software, and `LOWER_UP` means the cable link is live.",
            "`mtu 1500` is the largest payload in one Ethernet frame.",
            "`link/ether 00:1a:2b:3c:4d:5e` is the MAC address, and `00:1a:2b` is the OUI.",
            "`brd ff:ff:ff:ff:ff:ff` is the Ethernet broadcast address.",
            "On Windows, `ipconfig /all` shows the same value as Physical Address, written with hyphens.",
          ],
        },
        { type: 'troubleshoot', symptom: "File transfers are slow, and a switch port shows rising CRC errors.", checks: [
          "Run `show interfaces fa0/1` twice, a minute apart, and compare input errors, CRC and runts.",
          "Compare speed and duplex at both ends. In a duplex mismatch, the half-duplex side logs late collisions, and the full-duplex side logs CRC errors and runts.",
          "Swap the patch cable, and look for damaged pairs, runs over 100 m or cable laid along power lines.",
          "On fibre, clean the connectors and check light levels with `show interfaces transceiver`.",
        ], fix: "Set both ends to auto-negotiation or the same fixed values, and replace any faulty cable or optic. Then run `clear counters` and confirm that the CRC count stops rising." },
        { type: 'callout', variant: 'real-world', text: "Phones and laptops now use random, locally administered MACs on Wi-Fi for privacy, so a U/L bit of `1` is common. Docker and cloud platforms also generate MACs for virtual interfaces, so a MAC identifies an interface rather than a physical machine." },
      ],
    },
    {
      id: 'arp-address-resolution',
      title: 'ARP: from IP address to MAC address',
      blocks: [
        { type: 'paragraph', text: "IP routes packets, but a NIC can deliver a frame only to a MAC address. **ARP** (Address Resolution Protocol, RFC 826) finds the MAC address that belongs to an IPv4 address on the local link. Its messages travel directly inside Ethernet frames with EtherType `0x0806`." },
        { type: 'points', items: [
          "A host first checks its **ARP cache**. If an entry exists, no ARP traffic is needed.",
          "On a miss, it broadcasts an **ARP request** to `FF:FF:FF:FF:FF:FF` naming the target IP.",
          "Every host in the LAN receives it, and only the owner of that IP sends a unicast **ARP reply**.",
          "The requester stores the mapping and sends the queued packet.",
          "**Off-subnet rule:** for a destination outside its subnet, a host resolves its **default gateway**, not the remote host. For `8.8.8.8`, host `192.168.1.20/24` builds a frame with the gateway MAC, while the IP header keeps `8.8.8.8`.",
        ] },
        {
          type: 'diagram',
          id: 'ch03-arp-exchange',
          title: "ARP request and reply through a switch",
          caption: "The request is a broadcast, so the switch floods it. The reply is a unicast, which reaches only the requester. The gateway also caches the sender mapping from the request.",
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant A as HostA 192.168.1.20
    participant W as Switch
    participant G as Gateway 192.168.1.1
    participant C as HostC 192.168.1.30
    Note over A: No cache entry for 192.168.1.1
    A->>W: Broadcast ARP request for 192.168.1.1
    W->>G: Flooded request
    W->>C: Flooded request
    Note over C: Target IP differs, ignore
    Note over G: Target IP matches, cache HostA
    G->>W: Unicast ARP reply with Gateway MAC
    W->>A: Forwarded on HostA port only
    Note over A: Cache entry, send queued packet`,
        },
        { type: 'table', headers: ["ARP field", "Bytes", "Value for IPv4 on Ethernet"], rows: [
          ["Hardware type", "2", "`1` (Ethernet)"],
          ["Protocol type", "2", "`0x0800` (IPv4)"],
          ["Hardware and protocol lengths", "1 + 1", "`6` and `4`"],
          ["Opcode", "2", "`1` request, `2` reply"],
          ["Sender MAC and sender IP", "6 + 4", "Filled by the sender"],
          ["Target MAC and target IP", "6 + 4", "Target MAC is all zeros in a request"],
        ] },
        {
          type: 'command-lab',
          title: "Read the ARP cache on Windows",
          command: "arp -a",
          output: `Interface: 192.168.1.20 --- 0x7
  Internet Address      Physical Address      Type
  192.168.1.1           00-1a-2b-3c-4d-01     dynamic
  192.168.1.30          00-1a-2b-3c-4d-1e     dynamic
  192.168.1.255         ff-ff-ff-ff-ff-ff     static
  224.0.0.22            01-00-5e-00-00-16     static
  224.0.0.251           01-00-5e-00-00-fb     static
  239.255.255.250       01-00-5e-7f-ff-fa     static`,
          explanation: [
            "`Interface: 192.168.1.20 --- 0x7` names the local adapter this cache belongs to, and `0x7` is its index.",
            "`192.168.1.1` is the default gateway. `dynamic` means it was learned through ARP and will expire when unused.",
            "`192.168.1.30` is another LAN host contacted recently.",
            "`192.168.1.255` is the subnet broadcast, mapped permanently to the broadcast MAC.",
            "The `224.x` and `239.x` lines are multicast groups. Their `01-00-5e` MACs are computed from the low 23 bits of the IP, so no ARP is needed.",
            "On Linux, `ip neigh show` gives the same data with states such as `REACHABLE` and `STALE`.",
          ],
        },
        { type: 'mini-lab', title: "Watch ARP happen", goal: "Force an ARP exchange with your gateway and match the capture to the cache.", steps: [
          "Find your gateway with `ipconfig` on Windows or `ip route` on Linux. This lab assumes `192.168.1.1`.",
          "Start Wireshark on your active adapter with the display filter `arp`.",
          "In an administrator terminal, clear the cache: `arp -d *` on Windows or `sudo ip neigh flush all` on Linux.",
          "Send one ping: `ping -n 1 192.168.1.1` on Windows or `ping -c 1 192.168.1.1` on Linux.",
          "Run `arp -a` and compare the new entry with the MAC in the ARP reply.",
        ], expected: "Wireshark shows a broadcast `Who has 192.168.1.1? Tell 192.168.1.20`, then a unicast reply `192.168.1.1 is at` followed by the gateway MAC, and the same MAC appears in the cache. Your own addresses will differ." },
        { type: 'wireshark', filter: "arp", whatToLook: [
          "Request: Ethernet destination ff:ff:ff:ff:ff:ff, Type 0x0806, opcode 1, target MAC all zeros.",
          "Reply: Ethernet destination is the requester's MAC, opcode 2, and the sender MAC is the answer.",
          "Length: 42 bytes on the sending host, before the NIC pads it, and 60 bytes on a receiving host. The 4-byte FCS is removed by the NIC, and preamble and SFD never appear in a capture.",
          "Repeated requests with no reply mean the target is unreachable. Two different replies for one IP suggest a duplicate or spoofed address.",
        ] },
        { type: 'troubleshoot', symptom: "`ping 192.168.1.30` from a host on the same LAN prints `Destination host unreachable`.", checks: [
          "Run `arp -a` or `ip neigh show`. A missing entry or a `FAILED` state means nobody answered the ARP request.",
          "Compare IP and mask on both hosts with `ipconfig` or `ip addr`. A wrong mask makes a host treat a local address as remote.",
          "Confirm that both hosts are in the same VLAN and that the target's link is up.",
          "If the entry is valid but ping only times out, Layer 2 works, so check the target's firewall instead.",
          "If different MACs keep answering for one IP, suspect a duplicate address or ARP spoofing.",
        ], fix: "Correct the mask or VLAN, restore the target's link, or remove the duplicate address. Then clear the stale entry with `arp -d` and ping again." },
        { type: 'callout', variant: 'real-world', text: "ARP has no authentication, so offices defend against **ARP spoofing** with Dynamic ARP Inspection on switches. Failover router pairs send **gratuitous ARP** to move an IP to a new MAC at once. IPv6 replaces ARP with Neighbor Discovery over ICMPv6, and cloud VPCs answer ARP inside the virtual network because no real broadcast domain exists there." },
      ],
    },
    {
      id: 'switches-mac-learning',
      title: 'Switches and MAC learning',
      videoId: 'ch03-switch-mac-learning',
      blocks: [
        { type: 'paragraph', text: "A **switch** connects the hosts of a LAN and forwards each frame only where it needs to go. It builds its MAC table by watching live traffic, with no configuration, and hosts never know it is there. This is why switches and the older bridges are called transparent." },
        { type: 'table', headers: ["Device", "Layer", "Forwards using", "Collision domains", "Broadcast domains"], rows: [
          ["Hub", "1", "Repeats bits out of every port", "1 shared", "1"],
          ["Switch", "2", "MAC table", "1 per port", "1 per VLAN"],
          ["Router", "3", "Routing table", "1 per port", "1 per port"],
        ] },
        { type: 'points', items: [
          "**Learn from the source:** record the source MAC and VLAN against the incoming port.",
          "**Forward on the destination:** look up the destination MAC to choose the output port.",
          "**Flood when unsure:** broadcast, unknown unicast and, without IGMP snooping, multicast go out of all ports in the VLAN except the incoming one.",
          "**Age out:** idle entries are removed, after 300 seconds by default on Cisco switches, so moved hosts are relearned.",
        ] },
        {
          type: 'diagram',
          id: 'ch03-switch-learning',
          title: "Switch learning and forwarding logic",
          caption: "Decision path for each frame in a store-and-forward switch. Learning always happens first, on the source address, and forwarding then depends only on the destination address.",
          kind: 'working-flowchart',
          mermaid: `flowchart TD
    A1["Frame arrives on port P in VLAN V"] --> A2{"FCS valid?"}
    A2 -->|No| A3["Drop the damaged frame"]
    A2 -->|Yes| A4["Learn source MAC on port P, reset age"]
    A4 --> A5{"Destination is broadcast or multicast?"}
    A5 -->|Yes| A6["Flood to VLAN V ports except P"]
    A5 -->|No| A7{"Destination in MAC table for VLAN V?"}
    A7 -->|No| A6
    A7 -->|Yes| A8{"Mapped port equals P?"}
    A8 -->|Yes| A9["Filter the frame, same segment"]
    A8 -->|No| A10["Forward out the mapped port only"]`,
        },
        { type: 'example', title: "Filling a MAC table (A on Fa0/1, B on Fa0/2, C on Fa0/3)", steps: [
          "The table is empty. **A sends to B:** learn A on Fa0/1. B is unknown, so flood to Fa0/2 and Fa0/3.",
          "**B replies to A:** learn B on Fa0/2. A is known, so forward only to Fa0/1. C sees nothing.",
          "**C broadcasts an ARP request:** learn C on Fa0/3. The broadcast floods to Fa0/1 and Fa0/2.",
          "**A sends to B again:** B is known, so forward only to Fa0/2.",
        ] },
        { type: 'table', headers: ["Forwarding mode", "Starts forwarding after", "Trade-off", "Typical use"], rows: [
          ["Store-and-forward", "The whole frame arrives and the FCS passes", "Higher latency, drops damaged frames", "Most campus switches"],
          ["Cut-through", "Reading the destination MAC", "Lowest latency, passes damaged frames", "Low-latency data centres"],
          ["Fragment-free", "The first 64 bytes", "Filters collision fragments", "Legacy half-duplex LANs"],
        ] },
        {
          type: 'command-lab',
          title: "Read a Cisco MAC table",
          command: "show mac address-table dynamic",
          output: `          Mac Address Table
-------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
  10    0011.2233.0011    DYNAMIC     Fa0/1
  20    0011.2233.0012    DYNAMIC     Fa0/2
  10    0011.2233.0013    DYNAMIC     Gi0/1
  20    0011.2233.0014    DYNAMIC     Gi0/1
Total Mac Addresses for this criterion: 4`,
          explanation: [
            "`Vlan` shows that learning is per VLAN, so each VLAN acts as a separate table.",
            "`Mac Address` uses Cisco dotted notation: three groups of four hex digits.",
            "`DYNAMIC` means learned from traffic and subject to aging. Manual entries show `STATIC`.",
            "`Fa0/1` and `Fa0/2` each have one directly connected host.",
            "Two addresses on `Gi0/1` mean several hosts sit behind that port, which is the sign of an uplink or trunk.",
            "`Total` counts the four entries listed. To watch learning, run `clear mac address-table dynamic`, ping, and read the table again.",
          ],
        },
        { type: 'callout', variant: 'remember', text: "Learn on the **source**, forward on the **destination**. A switch never learns from a destination address." },
        { type: 'callout', variant: 'exam-tip', text: "A switch splits collision domains but not broadcast domains. A 24-port switch with no VLANs has 24 collision domains and 1 broadcast domain." },
        { type: 'callout', variant: 'real-world', text: "Switch hardware keeps the table in CAM memory, so lookups keep up with line rate. A **MAC flooding** attack fills that table to force flooding, so office access ports use port security to limit MACs per port. Home Wi-Fi routers contain a small switch chip for their LAN ports, and hypervisors run software switches such as Open vSwitch for VMs." },
      ],
    },
    {
      id: 'vlans-trunking-stp',
      title: 'VLANs, 802.1Q trunking and STP overview',
      videoId: 'ch03-vlan-trunking',
      blocks: [
        { type: 'paragraph', text: "A switch normally forms one broadcast domain, which becomes noisy and insecure as a LAN grows. **VLANs** divide one physical network into separate logical LANs, and **trunks** carry them between switches. Redundant links between switches raise a second problem, loops, which **STP** solves." },
        { type: 'points', items: [
          "**Access port:** belongs to one VLAN and carries untagged frames to an end device.",
          "**Trunk port:** carries many VLANs between switches, or to a router, using 802.1Q tags.",
          "**Isolation:** traffic cannot cross between VLANs without a router or Layer 3 switch.",
          "**Native VLAN:** untagged frames on a trunk belong to it (VLAN 1 by default). It must match at both ends.",
          "**Inter-VLAN routing:** a router-on-a-stick uses one trunked port with a subinterface per VLAN (`interface gi0/0.10` with `encapsulation dot1Q 10`). Campus networks use a Layer 3 switch with `interface vlan 10`.",
        ] },
        { type: 'paragraph', text: "On a trunk, **IEEE 802.1Q** inserts a 4-byte tag between the source MAC and the EtherType, then recalculates the FCS. The maximum frame grows to 1522 bytes, and the tag is removed before the frame leaves an access port." },
        { type: 'table', headers: ["Tag field", "Bits", "Meaning"], rows: [
          ["TPID", "16", "`0x8100`, marks the frame as tagged"],
          ["PCP", "3", "Priority 0 to 7 for QoS (802.1p)"],
          ["DEI", "1", "Frame may be dropped first during congestion"],
          ["VID", "12", "VLAN ID. 0 and 4095 are reserved, leaving 1 to 4094"],
        ] },
        {
          type: 'diagram',
          id: 'ch03-vlan-trunk',
          title: "Two VLANs across an 802.1Q trunk",
          caption: "PC1 and PC3 share VLAN 10 across the trunk, and PC2 and PC4 share VLAN 20. Traffic between the VLANs must pass through R1, which has one subinterface per VLAN.",
          kind: 'block',
          mermaid: `flowchart LR
    subgraph FL1["Floor 1"]
        PC1["PC1 VLAN 10 10.0.10.11"]
        PC2["PC2 VLAN 20 10.0.20.12"]
        SW1["SW1 access switch"]
    end
    subgraph FL2["Floor 2"]
        PC3["PC3 VLAN 10 10.0.10.13"]
        PC4["PC4 VLAN 20 10.0.20.14"]
        SW2["SW2 access switch"]
    end
    R1["R1 subinterfaces Gi0/0.10 and Gi0/0.20"]
    PC1 ---|Access VLAN 10| SW1
    PC2 ---|Access VLAN 20| SW1
    PC3 ---|Access VLAN 10| SW2
    PC4 ---|Access VLAN 20| SW2
    SW1 ---|Trunk tagged 10 and 20| SW2
    SW2 ---|Trunk tagged 10 and 20| R1`,
        },
        { type: 'example', title: "Cisco VLAN and trunk configuration on SW1", steps: [
          "`vlan 10` then `name ENGINEERING` creates the VLAN. Repeat with `vlan 20` and `name ACCOUNTS`.",
          "`interface fa0/1`, `switchport mode access`, `switchport access vlan 10` assigns PC1. Use `fa0/2` and VLAN 20 for PC2.",
          "`interface gi0/1`, `switchport mode trunk` makes the uplink an 802.1Q trunk.",
          "`switchport trunk allowed vlan 10,20` limits the trunk to those VLANs.",
          "`show vlan brief` lists access ports per VLAN, and `show interfaces trunk` verifies the uplink.",
        ] },
        {
          type: 'command-lab',
          title: "Verify a trunk",
          command: "show interfaces trunk",
          output: `Port        Mode         Encapsulation  Status        Native vlan
Gi0/1       on           802.1q         trunking      1

Port        Vlans allowed on trunk
Gi0/1       10,20

Port        Vlans allowed and active in management domain
Gi0/1       10,20

Port        Vlans in spanning tree forwarding state and not pruned
Gi0/1       10,20`,
          explanation: [
            "`Mode on` means the port was set statically with `switchport mode trunk`.",
            "`Encapsulation 802.1q` is the tagging standard in use.",
            "`Status trunking` confirms that the link is actually running as a trunk.",
            "`Native vlan 1` is the untagged VLAN, and it must match the far end.",
            "`Vlans allowed on trunk` is the configured list, here `10,20`.",
            "`allowed and active` drops any allowed VLAN that does not exist on this switch.",
            "`spanning tree forwarding state` lists the VLANs whose traffic can pass right now. A VLAN missing here is blocked by STP or pruned.",
          ],
        },
        { type: 'mini-lab', title: "Build two VLANs in Packet Tracer", goal: "Prove that a VLAN spans a trunk and that VLANs are isolated from each other.", steps: [
          "In Cisco Packet Tracer, link two 2960 switches through `Gi0/1`. Attach PC1 and PC2 to SW1 `Fa0/1` and `Fa0/2`, and PC3 and PC4 to SW2 in the same way.",
          "Set IPs: PC1 `10.0.10.11/24`, PC3 `10.0.10.13/24`, PC2 `10.0.20.12/24`, PC4 `10.0.20.14/24`.",
          "On both switches, create VLANs 10 and 20, then put `Fa0/1` in VLAN 10 and `Fa0/2` in VLAN 20.",
          "Set `Gi0/1` to `switchport mode trunk` on both switches.",
          "Ping PC3 from PC1, then ping PC2 from PC1.",
        ], expected: "PC1 reaches PC3 across the trunk. PC1 cannot reach PC2, even on the same switch, because no router connects the VLANs. `show interfaces trunk` lists `Gi0/1` as trunking." },
        { type: 'troubleshoot', symptom: "PC1 and PC3 are both in VLAN 10 on different switches and cannot ping each other, though hosts on the same switch can.", checks: [
          "`show vlan brief` on both switches: VLAN 10 must exist on each, and each host port must be in it.",
          "`show interfaces trunk`: the link must show `trunking`, with VLAN 10 in the allowed list.",
          "Compare the native VLAN at both ends. A mismatch leaks untagged traffic between VLANs.",
          "After a ping, `show mac address-table vlan 10` should list the remote host on the trunk port.",
        ], fix: "Create the missing VLAN, set `switchport mode trunk` on both ends, and add the VLAN with `switchport trunk allowed vlan add 10`." },
        { type: 'callout', variant: 'remember', text: "Access port: one VLAN, untagged. Trunk port: many VLANs, tagged except for the native VLAN." },
        { type: 'paragraph', text: "Redundant links keep a LAN running after a failure, but they form loops, and Ethernet frames have no TTL. A looped broadcast circulates forever and multiplies at every switch, causing a **broadcast storm**, while MAC tables keep flapping between ports. **STP** (IEEE 802.1D) keeps the spare links connected but logically blocks them until they are needed." },
        { type: 'points', items: [
          "**Step 1, root bridge:** switches exchange BPDUs, and the lowest bridge ID wins. Bridge ID is the priority (default `32768`) followed by the MAC address.",
          "**Step 2, root ports:** every other switch picks its port with the lowest path cost to the root.",
          "**Step 3, designated ports:** each link picks one forwarding port, the one with the lowest cost to the root. A lower bridge ID breaks ties.",
          "**Step 4, block:** any remaining port is blocked but keeps receiving BPDUs.",
          "**Path cost:** 10 Mbps = 100, 100 Mbps = 19, 1 Gbps = 4, 10 Gbps = 2.",
          "**Timers:** hello 2 s, max age 20 s, forward delay 15 s, so classic convergence takes 30 to 50 s.",
        ] },
        {
          type: 'diagram',
          id: 'ch03-stp-topology',
          title: "STP port roles in a three-switch triangle",
          caption: "All links have equal speed and all switches use the default priority, so MAC address decides. SW1 is root, SW2 has the lower bridge ID on the SW2 to SW3 link, and the SW3 port on that link is blocked.",
          kind: 'block',
          mermaid: `flowchart TD
    SW1["SW1 root bridge, lowest bridge ID"]
    SW2["SW2 second lowest bridge ID"]
    SW3["SW3 highest bridge ID"]
    SW1 ---|SW1 designated and SW2 root| SW2
    SW1 ---|SW1 designated and SW3 root| SW3
    SW2 ---|SW2 designated and SW3 blocked| SW3`,
        },
        { type: 'table', headers: ["Port state", "Receives BPDUs", "Learns MACs", "Forwards data"], rows: [
          ["Blocking", "Yes", "No", "No"],
          ["Listening", "Yes", "No", "No"],
          ["Learning", "Yes", "Yes", "No"],
          ["Forwarding", "Yes", "Yes", "Yes"],
          ["Disabled", "No", "No", "No"],
        ] },
        { type: 'case-study', title: "The cable that stopped a lab block", scenario: "Minutes after a spare patch cable was plugged between two wall sockets in a lab, every PC in the building lost network access. STP had been disabled on the access switches to speed up PC boot.", steps: [
          "Remote login fails, so the engineer uses the console. CPU is near 100% and broadcast counters climb at line rate.",
          "`%SW_MATM-4-MACFLAP_NOTIF` log messages show one MAC moving between two ports, the signature of a loop.",
          "Following those ports leads to the two sockets. Removing the cable ends the storm within seconds.",
          "The team enables `spanning-tree mode rapid-pvst`, and sets `spanning-tree portfast` with `spanning-tree bpduguard enable` on PC ports, so PCs still come up fast and a looped port shuts down.",
          "`storm-control broadcast level 5` is added on access ports as a second safeguard.",
        ] },
        { type: 'callout', variant: 'exam-tip', text: "A 24-port switch with 3 VLANs has 24 collision domains and 3 broadcast domains. In STP questions, elect the root first, then root ports, then designated ports. Whatever remains is blocked." },
        { type: 'callout', variant: 'real-world', text: "Offices use separate VLANs for staff, voice, printers and guest Wi-Fi, with **RSTP** (802.1w) or Rapid PVST+ converging in seconds. ISPs stack tags with Q-in-Q (802.1ad, TPID `0x88A8`). Data centres replace STP with routed leaf-spine fabrics and carry tenants in **VXLAN**, whose 24-bit ID allows about 16 million segments against 4094 VLANs." },
      ],
    },
  ],
  flashcards: [
    { front: "State the bit stuffing rule.", back: "Insert a 0 after every five consecutive 1s in the data. The receiver removes it. This keeps the flag 01111110 out of the payload." },
    { front: "CRC of data 1101011011 with generator 10011?", back: "Append 4 zeros and divide with XOR. The remainder is 1110, so the transmitted frame is 11010110111110." },
    { front: "How do you find the number of Hamming parity bits?", back: "Take the smallest r with 2^r >= m + r + 1. For example, 4 data bits need 3 parity bits and 7 data bits need 4." },
    { front: "Maximum windows with k-bit sequence numbers?", back: "Go-Back-N: sender 2^k - 1, receiver 1. Selective Repeat: sender and receiver 2^(k-1) each." },
    { front: "Stop-and-wait efficiency formula?", back: "U = 1 / (1 + 2a), where a = Tp / Tt, the ratio of propagation delay to transmission time." },
    { front: "Peak throughput of pure and slotted ALOHA?", back: "Pure ALOHA 0.184 at G = 0.5. Slotted ALOHA 0.368 at G = 1." },
    { front: "Why does Ethernet have a 64-byte minimum frame?", back: "A sender must still be transmitting when a collision from the far end returns, or it cannot detect it. 512 bits covers the round trip of the classic 10 Mbps network." },
    { front: "What do the I/G and U/L bits of a MAC address mean?", back: "In the first byte, the lowest bit I/G is 0 for unicast and 1 for group. The next bit U/L is 0 for vendor assigned and 1 for locally administered." },
    { front: "How are ARP request and reply addressed?", back: "The request is a broadcast to FF:FF:FF:FF:FF:FF. The reply is a unicast to the requester." },
    { front: "What does a switch do with an unknown unicast frame?", back: "It floods the frame out of all ports in that VLAN except the incoming port, after learning the source MAC." },
    { front: "What is inside an 802.1Q tag?", back: "4 bytes: TPID 0x8100 (16 bits), PCP (3 bits), DEI (1 bit) and VLAN ID (12 bits). Usable VLANs are 1 to 4094." },
    { front: "How does STP build a loop-free tree?", back: "Elect the root bridge with the lowest bridge ID, pick a root port on every other switch, pick a designated port per link, and block the rest." },
  ],
  quiz: [
    { id: 'ch03-q1', question: "Which framing technique inserts a 0 after five consecutive 1s in the data?", options: ["Byte stuffing", "Bit stuffing", "Byte count", "Coding violation"], answerIndex: 1, explanation: "HDLC-style bit stuffing adds a 0 after five 1s, so the data can never imitate the flag 01111110.", difficulty: 'easy', topic: "Framing and error control" },
    { id: 'ch03-q2', question: "A single even parity bit fails to detect which error pattern?", options: ["One flipped bit", "Three flipped bits", "Two flipped bits", "Five flipped bits"], answerIndex: 2, explanation: "An even number of flips leaves the count of 1s even, so parity still passes. Any odd number of flips is caught.", difficulty: 'easy', topic: "Framing and error control" },
    { id: 'ch03-q3', question: "What is the length of an Ethernet MAC address?", options: ["48 bits", "32 bits", "64 bits", "128 bits"], answerIndex: 0, explanation: "A MAC address is 48 bits, or 6 bytes. 32 bits is the IPv4 address length and 128 bits is the IPv6 address length.", difficulty: 'easy', topic: "Ethernet and ARP" },
    { id: 'ch03-q4', question: "How is an ARP request addressed at Layer 2?", options: ["Unicast to the default gateway", "Unicast to the DNS server", "Multicast to 01:00:5E:00:00:01", "Broadcast to FF:FF:FF:FF:FF:FF"], answerIndex: 3, explanation: "The sender does not yet know the target MAC, so it broadcasts the request to every station in the LAN.", difficulty: 'easy', topic: "Ethernet and ARP" },
    { id: 'ch03-q5', question: "Which field does a switch use to fill its MAC table?", options: ["Destination MAC of frames", "Source IP of packets", "Source MAC of incoming frames", "EtherType of frames"], answerIndex: 2, explanation: "The source MAC shows which host sits behind the incoming port. The destination MAC is used for forwarding, not learning.", difficulty: 'easy', topic: "Switching" },
    { id: 'ch03-q6', question: "How many bits is the VLAN ID field in an 802.1Q tag?", options: ["12 bits", "8 bits", "16 bits", "24 bits"], answerIndex: 0, explanation: "12 bits give 4096 values. Values 0 and 4095 are reserved, which leaves 4094 usable VLANs.", difficulty: 'easy', topic: "VLANs and STP" },
    { id: 'ch03-q7', question: "Data 1101011011 is protected with generator 10011. What does the sender append before dividing, and what remainder results?", options: ["5 zeros, remainder 11100", "4 zeros, remainder 1110", "4 zeros, remainder 0111", "5 zeros, remainder 01110"], answerIndex: 1, explanation: "The generator has degree 4, so 4 zeros are appended. Dividing 11010110110000 by 10011 with XOR leaves 1110.", difficulty: 'medium', topic: "Framing and error control" },
    { id: 'ch03-q8', question: "How many Hamming parity bits are needed for 10 data bits?", options: ["3", "5", "6", "4"], answerIndex: 3, explanation: "We need 2^r >= 10 + r + 1. r = 3 gives 8 < 14, and r = 4 gives 16 >= 15, so r = 4.", difficulty: 'medium', topic: "Framing and error control" },
    { id: 'ch03-q9', question: "With 3-bit sequence numbers, what are the largest sender windows for Go-Back-N and Selective Repeat?", options: ["7 and 4", "8 and 4", "7 and 7", "8 and 8"], answerIndex: 0, explanation: "Go-Back-N allows 2^3 - 1 = 7. Selective Repeat allows 2^(3-1) = 4. Larger windows make old and new frames look alike.", difficulty: 'medium', topic: "Flow control and ARQ" },
    { id: 'ch03-q10', question: "What is the maximum throughput of slotted ALOHA, and at what offered load?", options: ["0.184 at G = 0.5", "0.368 at G = 0.5", "0.368 at G = 1", "0.5 at G = 1"], answerIndex: 2, explanation: "S = G e^(-G) peaks at G = 1, giving 1/e = 0.368. The value 0.184 at G = 0.5 belongs to pure ALOHA.", difficulty: 'medium', topic: "MAC protocols" },
    { id: 'ch03-q11', question: "A switch receives a unicast frame whose destination MAC is not in its table. What does it do?", options: ["Drops it and sends an error to the source", "Sends an ARP request for the destination", "Forwards it to the root bridge only", "Floods it out of all VLAN ports except the incoming port"], answerIndex: 3, explanation: "Unknown unicast is flooded within the VLAN. When the destination replies, the switch learns its port, and later frames are forwarded directly.", difficulty: 'medium', topic: "Switching" },
    { id: 'ch03-q12', question: "Host 192.168.1.20/24 sends a packet to 8.8.8.8 through gateway 192.168.1.1. Which addresses are in the frame leaving the host?", options: ["Gateway MAC as destination, 8.8.8.8 as destination IP", "MAC of 8.8.8.8 as destination, 8.8.8.8 as destination IP", "Gateway MAC as destination, 192.168.1.1 as destination IP", "Broadcast MAC as destination, 8.8.8.8 as destination IP"], answerIndex: 0, explanation: "The remote host is off-subnet, so the frame goes to the gateway MAC for this hop. The IP header keeps the final destination.", difficulty: 'medium', topic: "Ethernet and ARP" },
    { id: 'ch03-q13', question: "A 1 Mbps link carries 1000-byte frames with a one-way propagation delay of 20 ms. Ignoring ACK time, what is the smallest sliding window that gives 100% utilisation?", options: ["3 frames", "5 frames", "6 frames", "8 frames"], answerIndex: 2, explanation: "Tt = 8000 / 10^6 = 8 ms, so a = 20 / 8 = 2.5. The window must satisfy N >= 1 + 2a = 6.", difficulty: 'hard', topic: "Flow control and ARQ" },
    { id: 'ch03-q14', question: "A CSMA/CD network runs at 1 Gbps over 200 m of cable with signal speed 2 x 10^8 m/s. What is the minimum frame size for reliable collision detection?", options: ["125 bytes", "250 bytes", "512 bytes", "64 bytes"], answerIndex: 1, explanation: "Tp = 200 / (2 x 10^8) = 1 microsecond. Lmin = 2 x Tp x R = 2 x 10^-6 x 10^9 = 2000 bits = 250 bytes.", difficulty: 'hard', topic: "MAC protocols" },
    { id: 'ch03-q15', question: "Three switches form a triangle over equal-speed links, all at default priority. SW1 has the lowest MAC, SW2 the next and SW3 the highest. Which port does STP block?", options: ["SW1 port toward SW3", "SW2 port toward SW3", "SW1 port toward SW2", "SW3 port toward SW2"], answerIndex: 3, explanation: "SW1 is root, so all its ports are designated. On the SW2 to SW3 link both have equal cost to the root, SW2 wins on bridge ID, and the SW3 port blocks.", difficulty: 'hard', topic: "VLANs and STP" },
  ],
  importantQuestions: [
    { q: "What is bit stuffing? Give one example.", marks: 2, modelAnswer: "Bit stuffing inserts a 0 after every five consecutive 1s in the data, so the payload cannot imitate the flag 01111110. The receiver removes the added 0. Example: 0111111 becomes 01111101." },
    { q: "Differentiate a collision domain from a broadcast domain.", marks: 2, modelAnswer: "A collision domain is a segment where simultaneous transmissions interfere, and each switch port forms its own. A broadcast domain is the set of devices that receive a Layer 2 broadcast, and only routers or VLAN boundaries divide it." },
    { q: "Describe the Ethernet II frame format with the size and purpose of each field.", marks: 5, modelAnswer: "Preamble, 7 bytes: alternating bits that synchronise the receiver clock.\nSFD, 1 byte: 10101011, marks the frame start.\nDestination MAC and Source MAC, 6 bytes each: Layer 2 addresses.\nEtherType, 2 bytes: payload protocol, such as 0x0800 for IPv4. A value of 1500 or less is a length field in 802.3 format.\nPayload, 46 to 1500 bytes: padded if short.\nFCS, 4 bytes: CRC-32 over destination MAC through payload.\nFrame size from destination to FCS is 64 to 1518 bytes." },
    { q: "Explain how ARP resolves an IPv4 address. How does a host handle an off-subnet destination?", marks: 5, modelAnswer: "1. The host checks its ARP cache for the target IP.\n2. On a miss, it broadcasts an ARP request (EtherType 0x0806, opcode 1) carrying its own MAC and IP and the target IP.\n3. All hosts receive it, and only the owner of the target IP responds, with a unicast reply (opcode 2) containing its MAC.\n4. The requester caches the mapping for a limited time and sends the queued packet.\nOff-subnet: the host compares the destination with its own subnet. If it is remote, the host resolves the default gateway instead. The frame carries the gateway MAC, and the IP header keeps the remote destination IP." },
    { q: "Compare Go-Back-N and Selective Repeat ARQ.", marks: 5, modelAnswer: "Window: Go-Back-N sender up to 2^k - 1 and receiver 1. Selective Repeat sender and receiver up to 2^(k-1).\nOut-of-order frames: Go-Back-N discards them, while Selective Repeat buffers them.\nACKs: Go-Back-N uses cumulative ACKs, while Selective Repeat acknowledges frames individually and may use NAKs.\nOn a loss: Go-Back-N resends the lost frame and all later ones, while Selective Repeat resends only the lost frame.\nCost: Go-Back-N has a simple receiver but wastes bandwidth on noisy links. Selective Repeat uses bandwidth better but needs buffers and reordering logic." },
    { q: "Explain CSMA/CD with its procedure and binary exponential backoff. Derive the minimum frame size, and state why modern Ethernet no longer depends on it.", marks: 10, modelAnswer: "Procedure:\n1. Sense the medium. If busy, keep sensing until idle.\n2. After the 96-bit interframe gap, transmit while monitoring the medium.\n3. If no collision occurs until the frame is fully sent, transmission succeeds.\n4. On a collision, stop and send a 32-bit jam signal, then increment the collision count n.\n5. If n reaches 16, discard the frame and report failure.\n6. Otherwise, let m = min(n, 10), pick K at random from 0 to 2^m - 1, wait K x 512 bit times, and return to step 1.\nBackoff: the K range doubles with each collision, so waiting adapts to load. At 10 Mbps a slot is 51.2 microseconds.\nMinimum frame: a station detects a collision only while still sending. The worst case is a collision at the far end, which takes 2Tp to return. So L / R >= 2Tp, which gives Lmin = 2 x Tp x R. Classic Ethernet fixes this at 512 bits, or 64 bytes, and short payloads are padded to 46 bytes.\nToday: switches give each device a dedicated full-duplex link, so collisions cannot occur and CSMA/CD stays idle. 10 Gbps and faster links are full duplex only. Wi-Fi uses CSMA/CA, because radios cannot detect collisions while sending." },
    { q: "Explain how a switch learns and forwards frames. Show how VLANs and 802.1Q trunks extend this, and why STP is needed.", marks: 10, modelAnswer: "Learning: for each incoming frame, the switch records source MAC, VLAN and port in its MAC table and resets the aging timer (300 s by default on Cisco).\nForwarding: broadcast and unknown unicast are flooded out of all VLAN ports except the incoming one. A known destination goes out of its mapped port only. If that port is the incoming port, the frame is filtered.\nVLANs: each VLAN is a separate broadcast domain with its own learning and flooding. An access port belongs to one VLAN, and traffic between VLANs needs a router or Layer 3 switch.\nTrunks: 802.1Q inserts a 4-byte tag after the source MAC with TPID 0x8100, PCP, DEI and a 12-bit VLAN ID, so one link carries VLANs 1 to 4094. Untagged frames belong to the native VLAN, which must match at both ends.\nSTP: redundant links create loops, and Ethernet frames have no TTL, so broadcasts circulate forever and MAC tables flap. STP elects the root bridge with the lowest bridge ID, then a root port per switch and a designated port per link, and blocks the rest. A blocked port takes over if an active link fails. RSTP does this in seconds, against 30 to 50 s for classic STP." },
  ],
  numericals: [
    {
      question: "Find the CRC for data 1101011011 using generator 10011, and give the transmitted frame.",
      steps: [
        "The generator has 5 bits, so r = 4. Append 4 zeros: 11010110110000.",
        "11010 XOR 10011 = 01001, quotient bit 1. Bring down 1 to get 10011.",
        "10011 XOR 10011 = 00000, quotient bit 1. Bring down 1 to get 00001, quotient bit 0.",
        "Bring down 0 to get 00010, quotient bit 0. Bring down 1 to get 00101, quotient bit 0. Bring down 1 to get 01011, quotient bit 0.",
        "Bring down 0 to get 10110. 10110 XOR 10011 = 00101, quotient bit 1.",
        "Bring down 0 to get 01010, quotient bit 0. Bring down 0 to get 10100.",
        "10100 XOR 10011 = 00111, quotient bit 1. Bring down the last 0 to get 01110, quotient bit 0.",
        "Quotient is 1100001010 and the remainder is the last 4 bits, 1110.",
        "Transmitted frame = data + remainder = 11010110111110. Dividing this by 10011 leaves 0000, which confirms the result.",
      ],
      answer: "CRC remainder 1110 bits; transmitted frame 11010110111110 (14 bits)",
    },
    {
      question: "Encode data bits 1011 using even-parity Hamming (7,4), placing them in positions 3, 5, 6 and 7 in that order. Then locate the error if the receiver gets 0110001.",
      steps: [
        "Parity bits sit at positions 1, 2 and 4. Data gives position 3 = 1, position 5 = 0, position 6 = 1, position 7 = 1.",
        "P1 checks positions 3, 5, 7 = 1, 0, 1, which has two 1s, so P1 = 0.",
        "P2 checks positions 3, 6, 7 = 1, 1, 1, which has three 1s, so P2 = 1.",
        "P4 checks positions 5, 6, 7 = 0, 1, 1, which has two 1s, so P4 = 0.",
        "The codeword in positions 1 to 7 is 0110011.",
        "Received 0110001. Check 1 on positions 1, 3, 5, 7 = 0, 1, 0, 1 is even, so C1 = 0.",
        "Check 2 on positions 2, 3, 6, 7 = 1, 1, 0, 1 is odd, so C2 = 1.",
        "Check 4 on positions 4, 5, 6, 7 = 0, 0, 0, 1 is odd, so C4 = 1.",
        "Syndrome C4 C2 C1 = 110 in binary = 6, so bit 6 is wrong. Flipping it restores 0110011.",
      ],
      answer: "Codeword 0110011; the error is at bit position 6",
    },
    {
      question: "A 2000 km link runs at 1 Mbps with signal speed 2 x 10^8 m/s and carries 1000-byte frames. Ignoring ACK time, find the stop-and-wait efficiency and throughput, then the sliding window needed for 100% utilisation and the sequence number bits for it.",
      steps: [
        "Tt = L / R = 8000 bits / 10^6 bps = 8 ms.",
        "Tp = d / v = 2 x 10^6 m / 2 x 10^8 m/s = 10 ms.",
        "a = Tp / Tt = 10 / 8 = 1.25.",
        "Stop-and-wait efficiency U = 1 / (1 + 2a) = 1 / 3.5 = 0.2857, or 28.57%.",
        "Throughput = 0.2857 x 1 Mbps = 285.7 kbps.",
        "For full utilisation N >= 1 + 2a = 3.5, so N = 4 frames. A window of 3 would give only 3 / 3.5 = 85.7%.",
        "Go-Back-N: 2^k - 1 >= 4 gives k = 3. Selective Repeat: 2^(k-1) >= 4 gives k = 3.",
      ],
      answer: "Efficiency 28.57% (285.7 kbps); window of 4 frames, needing 3 sequence number bits",
    },
    {
      question: "A shared 200 kbps channel carries 200-bit frames, and all stations together offer 500 frames per second. Find the successful frames per second and the throughput in kbps for pure and slotted ALOHA.",
      steps: [
        "Frame time T = 200 bits / 200 kbps = 1 ms, so the channel fits 1000 frame times per second.",
        "G = 500 frames/s x 0.001 s = 0.5 frames per frame time.",
        "Pure ALOHA: S = G e^(-2G) = 0.5 x e^(-1) = 0.5 x 0.3679 = 0.1839.",
        "Successful frames = 0.1839 x 1000 = 183.9 per second. Cross-check: success probability e^(-1) x 500 frames = 183.9.",
        "Pure ALOHA throughput = 183.9 x 200 bits = 36.8 kbps. This is its peak, since G = 0.5.",
        "Slotted ALOHA: S = G e^(-G) = 0.5 x e^(-0.5) = 0.5 x 0.6065 = 0.3033.",
        "Successful frames = 0.3033 x 1000 = 303.3 per second, and throughput = 303.3 x 200 bits = 60.7 kbps.",
      ],
      answer: "Pure ALOHA about 184 frames/s (36.8 kbps); slotted ALOHA about 303 frames/s (60.7 kbps)",
    },
    {
      question: "A CSMA/CD network runs at 10 Mbps over 2 km of cable with signal speed 2 x 10^8 m/s. Find the minimum frame size. Then, using the standard 512-bit slot time, find the longest backoff after the third collision.",
      steps: [
        "Tp = 2000 m / 2 x 10^8 m/s = 10 microseconds, so the round trip is 20 microseconds.",
        "Lmin = 2 x Tp x R = 20 x 10^-6 s x 10^7 bps = 200 bits = 25 bytes.",
        "Slot time at 10 Mbps = 512 bits / 10^7 bps = 51.2 microseconds.",
        "After the third collision m = 3, so K ranges from 0 to 2^3 - 1 = 7.",
        "Longest wait = 7 x 51.2 = 358.4 microseconds.",
      ],
      answer: "Minimum frame 200 bits (25 bytes); longest backoff 358.4 microseconds",
    },
  ],
  keyTerms: [
    "Frame: Layer 2 data unit with a header, payload and trailer, sent across one link",
    "Bit stuffing: Adding a 0 after five consecutive 1s so data cannot imitate the flag",
    "FCS: Frame Check Sequence, the 4-byte CRC-32 value in the Ethernet trailer",
    "CRC: Error detection by modulo-2 division of the bits by a generator polynomial",
    "Hamming distance: Number of bit positions in which two codewords differ",
    "ARQ: Automatic Repeat reQuest, recovery using ACKs, timers and retransmission",
    "Sliding window: Range of sequence numbers a sender may transmit before an ACK arrives",
    "Go-Back-N: ARQ that resends the lost frame and every frame sent after it",
    "Selective Repeat: ARQ that resends only lost frames and buffers out-of-order ones",
    "CSMA/CD: Carrier sensing with collision detection, a jam signal and random backoff",
    "Binary exponential backoff: Random wait of K slots, with the K range doubling after each collision",
    "MAC address: 48-bit Layer 2 address of a network interface, written in hexadecimal",
    "OUI: First 24 bits of a vendor-assigned MAC address, identifying the manufacturer",
    "ARP: Protocol that resolves an IPv4 address to a MAC address on the local link",
    "MAC table: Switch table, or CAM table, mapping each learned MAC and VLAN to a port",
    "Collision domain: Segment in which simultaneous transmissions interfere with each other",
    "Broadcast domain: Set of devices that all receive a Layer 2 broadcast frame",
    "VLAN: Logical Layer 2 broadcast domain configured on switch ports",
    "802.1Q trunk: Link carrying many VLANs using a 4-byte tag with a 12-bit VLAN ID",
    "STP: IEEE 802.1D protocol that blocks redundant links to keep the LAN loop-free",
  ],
  formulas: [
    { name: "Hamming parity bits", expression: "2^r >= m + r + 1", note: "m data bits, r parity bits" },
    { name: "Code distance", expression: "Detect d errors: dmin >= d + 1. Correct t errors: dmin >= 2t + 1" },
    { name: "CRC codeword", expression: "T(x) = x^r M(x) + R(x)", note: "R(x) is the remainder of x^r M(x) divided by G(x) in modulo-2" },
    { name: "Transmission time", expression: "Tt = L / R", note: "L frame bits, R bit rate" },
    { name: "Propagation delay", expression: "Tp = d / v", note: "d distance, v signal speed" },
    { name: "Stop-and-wait efficiency", expression: "U = 1 / (1 + 2a), a = Tp / Tt" },
    { name: "Sliding window efficiency", expression: "U = min(1, N / (1 + 2a))", note: "Window of N frames, no errors" },
    { name: "Go-Back-N window", expression: "Ws <= 2^k - 1, Wr = 1", note: "k sequence number bits" },
    { name: "Selective Repeat window", expression: "Ws = Wr <= 2^(k-1)", note: "k sequence number bits" },
    { name: "Pure ALOHA throughput", expression: "S = G e^(-2G)", note: "Maximum 0.184 at G = 0.5" },
    { name: "Slotted ALOHA throughput", expression: "S = G e^(-G)", note: "Maximum 0.368 at G = 1" },
    { name: "CSMA/CD minimum frame", expression: "Lmin = 2 x Tp x R" },
    { name: "Binary exponential backoff", expression: "Wait = K x 512 bit times, K from 0 to 2^m - 1, m = min(n, 10)", note: "n is the collision count, give up at 16" },
    { name: "Ethernet payload efficiency", expression: "1500 / (1518 + 8 + 12) = 97.5%", note: "Full-size frame with preamble, SFD and interframe gap" },
  ],
  handsOnChecklist: [
    "Find your adapter MAC with ipconfig /all or ip link, then decode its OUI, I/G bit and U/L bit.",
    "Clear your ARP cache, ping the gateway, and capture the request and reply in Wireshark with the filter arp.",
    "Work out the CRC of 1101011011 with generator 10011 on paper, then divide the full frame to confirm a zero remainder.",
    "In Cisco Packet Tracer, run clear mac address-table dynamic, ping between PCs, and watch show mac address-table fill up.",
    "Build two VLANs across a trunk in Packet Tracer and verify them with show vlan brief and show interfaces trunk.",
    "Connect three switches in a triangle in Packet Tracer and use show spanning-tree to find the root, root ports and blocked port.",
  ],
};

export default chapter;

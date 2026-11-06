import type { Chapter } from '@/lib/types';

const chapter: Chapter = {
  slug: 'routing',
  number: 5,
  title: 'Network layer II: Routing',
  shortTitle: 'Routing',
  summary:
    'Routing computes the paths that packets should follow, and forwarding moves each packet along them one router at a time. This chapter covers router internals, longest prefix match, static and default routes, distance vector routing with RIP, link state routing with OSPF, path vector routing with BGP across autonomous systems, and a short overview of multicast.',
  estMinutes: 85,
  learningObjectives: [
    'Distinguish forwarding from routing and explain how the RIB and FIB relate to each other.',
    'Describe the main parts of a router and identify where queuing and packet loss occur.',
    'Apply longest prefix match by hand and configure static and default routes on Cisco and Linux.',
    'Compute shortest paths with Dijkstra and Bellman-Ford, and explain count to infinity and its remedies.',
    'Explain OSPF neighbor states, LSA flooding and areas, and read OSPF command output.',
    'Explain how BGP uses AS paths and policy to route between autonomous systems.',
  ],
  overviewVideoId: 'ch05-overview',
  sections: [
    {
      id: 'forwarding-vs-routing',
      title: 'Forwarding versus routing',
      blocks: [
        {
          type: 'paragraph',
          text: 'The network layer carries packets from a source host to a destination host across many links. It does this with two separate jobs. **Forwarding** moves one packet through one router, and **routing** works out the paths that packets should follow across the network.',
        },
        {
          type: 'points',
          items: [
            '**Forwarding** is a local action. The router reads the destination IP address, looks it up in a table and sends the packet out of one interface.',
            '**Routing** is a network-wide action. Routers, or a central controller, exchange information and compute the best paths.',
            'Routing fills the table. Forwarding reads the table.',
            'Road analogy: planning a trip on a map is routing. Taking the correct exit at one interchange is forwarding.',
          ],
        },
        {
          type: 'table',
          headers: ['Aspect', 'Forwarding', 'Routing'],
          rows: [
            ['Plane', 'Data plane', 'Control plane'],
            ['Scope', 'One router', 'Whole network or AS'],
            ['Time scale', 'Nanoseconds to microseconds per packet', 'Seconds to minutes'],
            ['Implemented in', 'ASIC, network processor or kernel fast path', 'Software on the router CPU'],
            ['Input', 'Destination IP address and the FIB', 'Protocol messages, link costs and policy'],
            ['Output', 'Exit interface and next hop', 'Best routes installed in the RIB and FIB'],
          ],
        },
        {
          type: 'paragraph',
          text: 'A router keeps routes in two tables. The **Routing Information Base (RIB)** collects routes from connected interfaces, static configuration and routing protocols, then selects the best route per prefix. The **Forwarding Information Base (FIB)** is a compact copy of those best routes, with next hop and layer 2 rewrite details ready for fast lookup.',
        },
        {
          type: 'points',
          items: [
            'At each hop the router decrements the IPv4 `TTL` by 1 and recalculates the header checksum.',
            'The router builds a new layer 2 frame, so source and destination MAC addresses change at every hop.',
            'Source and destination IP addresses stay the same unless NAT is applied.',
            'Each router decides independently. The full path is not stored in the packet.',
          ],
        },
        {
          type: 'command-lab',
          title: 'Watch hop-by-hop forwarding',
          command: 'traceroute -n 8.8.8.8',
          output: `traceroute to 8.8.8.8 (8.8.8.8), 30 hops max, 60 byte packets
 1  192.168.1.1  1.214 ms  1.082 ms  1.037 ms
 2  10.50.0.1  5.641 ms  5.802 ms  6.017 ms
 3  203.0.113.9  7.318 ms  7.256 ms  7.502 ms
 4  198.51.100.33  12.447 ms  12.391 ms  12.605 ms
 5  8.8.8.8  13.128 ms  13.044 ms  13.212 ms`,
          explanation: [
            'First line: probes start at `TTL` 1 and increase up to a limit of 30 hops. `-n` skips reverse DNS lookups.',
            'Hop `1`: the home router drops the probe when `TTL` reaches 0 and returns ICMP Time Exceeded. The three times are three separate probes.',
            'Hops `2` to `4`: ISP and transit routers. Each one made its own forwarding decision for the packet.',
            'Hop `5`: the destination itself answers, so the trace stops. On Windows, `tracert` does the same job using ICMP Echo Requests.',
          ],
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: 'To classify a task, ask whether it happens for **every packet**. If yes, it is data plane, such as a FIB lookup or a TTL decrement. If it builds or updates tables, it is control plane, such as running Dijkstra or sending a BGP UPDATE.',
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: '**Home:** a Wi-Fi router holds connected routes and one default route from the ISP. **ISP core:** border routers carry the full Internet table of about one million IPv4 prefixes. **Cloud and SDN:** a central controller computes routes and programs the FIB of many switches, so the control plane no longer sits inside each box.',
        },
      ],
    },
    {
      id: 'router-internals',
      title: 'Inside a router',
      blocks: [
        {
          type: 'paragraph',
          text: 'A router is a specialised computer built to move packets between interfaces at line rate. The generic design has four parts: input ports, a switching fabric, output ports and a routing processor. Knowing these parts explains where delay and packet loss come from.',
        },
        {
          type: 'points',
          items: [
            '**Input port:** terminates the physical link, removes the layer 2 header, looks up the destination in the FIB and queues the packet if the fabric is busy.',
            '**Switching fabric:** connects input ports to output ports.',
            '**Output port:** queues packets, schedules the next one to send, adds the new layer 2 header and transmits bits.',
            '**Routing processor:** a CPU that runs routing protocols and management tasks, builds the RIB and pushes updates into the FIB.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch05-router-architecture',
          title: 'Generic router architecture',
          caption: 'Data packets flow left to right through the input port, fabric and output port. Protocol packets are punted to the routing processor, which installs best routes into the FIB on each line card.',
          kind: 'block',
          mermaid: `flowchart LR
    L1["Incoming link"]
    L2["Outgoing link"]
    subgraph CP["Control plane"]
        RP["Routing processor CPU"]
        RIB["RIB from OSPF BGP and static"]
        RP --> RIB
    end
    subgraph PI["Input port"]
        I1["Line termination"]
        I2["Link layer decapsulation"]
        I3["FIB lookup and input queue"]
        I1 --> I2 --> I3
    end
    subgraph SF["Switching fabric"]
        F1["Memory, bus or crossbar"]
    end
    subgraph PO["Output port"]
        O1["Output queue and scheduler"]
        O2["Link layer encapsulation"]
        O3["Line termination"]
        O1 --> O2 --> O3
    end
    L1 --> I1
    I3 -->|Punt protocol packets| RP
    RIB -->|Installs FIB| I3
    I3 --> F1
    F1 --> O1
    O3 --> L2`,
        },
        {
          type: 'table',
          headers: ['Fabric type', 'How it works', 'Main limit', 'Typical use'],
          rows: [
            ['Memory', 'CPU copies the packet into shared memory, then out to the output port', 'Two memory accesses per packet', 'Home and software routers'],
            ['Bus', 'Input port places the packet on a shared bus and only the addressed output keeps it', 'One packet crosses at a time', 'Older and small routers'],
            ['Crossbar', 'A grid of crosspoints connects N inputs to N outputs', 'Conflict only when two inputs want the same output', 'Core routers and data center switches'],
          ],
        },
        {
          type: 'points',
          items: [
            '**Input queuing** occurs when the fabric is slower than the combined arrival rate. It causes **head of the line (HOL) blocking**: the front packet waits for a busy output and delays packets behind it that want a free output.',
            '**Output queuing** occurs when packets arrive for one output faster than its link can send. When the buffer fills, packets are dropped. This is the usual cause of congestion loss.',
            '**Scheduling** picks the next packet to send: FIFO, strict priority or weighted fair queuing.',
            '**Active queue management**, such as RED, drops packets early to signal TCP senders before the buffer is full.',
            '**Lookup methods:** TCAM hardware compares all prefixes in parallel, in one memory cycle, with entries ordered so that the first hit is the longest. Software routers use tree structures such as the LC-trie in Linux.',
          ],
        },
        {
          type: 'callout',
          variant: 'formula',
          text: 'Lookup budget: `T = packet size in bits / line rate`. A 64-byte packet on a 100 Gbps port gives `512 / (100 x 10^9) = 5.12 ns`. A fabric needs a rate of about `N x R` for N ports of rate R to avoid input queuing.',
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: '**Home:** a small system-on-chip forwards packets in the Linux kernel, often with hardware offload. **Office and data center:** switching ASICs with TCAM forward at line rate on every port. **ISP core:** each line card holds its own FIB copy so lookups do not touch the CPU. On Cisco this mechanism is CEF, shown by `show ip cef`.',
        },
      ],
    },
    {
      id: 'routing-table-lpm',
      title: 'The routing table and longest prefix match',
      blocks: [
        {
          type: 'paragraph',
          text: 'A routing table maps destination prefixes to next hops. Prefixes can overlap, so one address may match several entries. The rule that settles this is **longest prefix match (LPM)**: use the matching entry with the most network bits, because it is the most specific.',
        },
        {
          type: 'points',
          items: [
            '**Prefix and mask:** the destination block, for example `10.1.2.0/24`.',
            '**Next hop:** the IP address of the next router. It must be reachable on a connected network.',
            '**Exit interface:** the port used to send the packet, for example `Gi0/1`.',
            '**Administrative distance (AD):** how much the router trusts the source of the route. Lower wins.',
            '**Metric:** the cost computed by the protocol, compared only within one protocol.',
            '**Route summarization:** four routes from `10.1.0.0/24` to `10.1.3.0/24` can be advertised as one `10.1.0.0/22`, which keeps tables small.',
          ],
        },
        {
          type: 'table',
          headers: ['Prefix', 'Next hop', 'Exit interface', 'Source'],
          rows: [
            ['`10.0.0.0/8`', '`192.168.1.2`', '`Gi0/1`', 'OSPF'],
            ['`10.1.0.0/16`', '`192.168.1.6`', '`Gi0/2`', 'OSPF'],
            ['`10.1.2.0/24`', '`192.168.1.10`', '`Gi0/3`', 'Static'],
            ['`10.1.2.128/25`', '`192.168.1.14`', '`Gi0/4`', 'Static'],
            ['`0.0.0.0/0`', '`203.0.113.1`', '`Gi0/0`', 'Static default'],
          ],
        },
        {
          type: 'diagram',
          id: 'ch05-lpm-flowchart',
          title: 'Longest prefix match decision',
          caption: 'The default route 0.0.0.0/0 matches every address with length zero, so it wins only when nothing longer matches. The drop branch is reached only when the table has no default route.',
          kind: 'flowchart',
          mermaid: `flowchart TD
    A1["Packet arrives at input port"]
    A2["Read destination IP from header"]
    A3["Compare with every prefix in FIB"]
    A4{"Any prefix matches?"}
    A5["Drop and send ICMP unreachable"]
    A6{"More than one match?"}
    A7["Keep the longest prefix"]
    A8["Use the only match"]
    A9["Get next hop and exit interface"]
    A10{"TTL above 1?"}
    A11["Drop and send ICMP time exceeded"]
    A12["Decrement TTL, rewrite frame, send"]
    A1 --> A2
    A2 --> A3
    A3 --> A4
    A4 -->|No| A5
    A4 -->|Yes| A6
    A6 -->|Yes| A7
    A6 -->|No| A8
    A7 --> A9
    A8 --> A9
    A9 --> A10
    A10 -->|No| A11
    A10 -->|Yes| A12`,
        },
        {
          type: 'example',
          title: 'Longest prefix match using the table above',
          steps: [
            'Destination `10.1.2.200`: the last octet `200` is `11001000`. Its first bit is 1, so it falls in `10.1.2.128/25`, which covers `.128` to `.255`. All five entries match. The `/25` is longest, so forward to `192.168.1.14`.',
            'Destination `10.1.2.5`: the last octet `5` is `00000101`, so the `/25` fails. The longest remaining match is `/24`, so forward to `192.168.1.10`.',
            'Destination `10.1.77.9`: the third octet `77` is not `2`, so the `/24` and `/25` fail. The `/16` is longest, so forward to `192.168.1.6`.',
            'Destination `10.200.0.1`: only the `/8` and the default match. Forward to `192.168.1.2`.',
            'Destination `8.8.8.8`: only the default matches. Forward to `203.0.113.1`.',
          ],
        },
        {
          type: 'table',
          headers: ['Route source', 'Default AD on Cisco'],
          rows: [
            ['Connected', '0'],
            ['Static', '1'],
            ['eBGP', '20'],
            ['Internal EIGRP', '90'],
            ['OSPF', '110'],
            ['IS-IS', '115'],
            ['RIP', '120'],
            ['iBGP', '200'],
          ],
        },
        {
          type: 'callout',
          variant: 'remember',
          text: 'Order of decisions: **AD** chooses between protocols offering the same prefix, then **metric** chooses within one protocol. **LPM** chooses between different prefixes at forwarding time. A RIP route to `10.1.0.0/16` (AD 120) beats a static route to `10.0.0.0/8` (AD 1) for `10.1.2.3`, because prefix length is compared across different prefixes.',
        },
        {
          type: 'command-lab',
          title: 'Read a Linux routing table and test a lookup',
          command: 'ip route show && ip route get 10.20.30.40 && ip route get 8.8.8.8',
          output: `default via 192.168.1.1 dev wlp2s0 proto dhcp metric 600
10.8.0.0/24 dev tun0 proto kernel scope link src 10.8.0.2
10.20.0.0/16 via 10.8.0.1 dev tun0
192.168.1.0/24 dev wlp2s0 proto kernel scope link src 192.168.1.42 metric 600
10.20.30.40 via 10.8.0.1 dev tun0 src 10.8.0.2 uid 1000
    cache
8.8.8.8 via 192.168.1.1 dev wlp2s0 src 192.168.1.42 uid 1000
    cache`,
          explanation: [
            '`default via 192.168.1.1`: the default route, learned from DHCP, points at the home router.',
            '`10.8.0.0/24 dev tun0`: a connected route for the VPN tunnel. `scope link` means no next hop is needed.',
            '`10.20.0.0/16 via 10.8.0.1`: a company network reached through the VPN gateway.',
            '`192.168.1.0/24 dev wlp2s0`: the connected Wi-Fi LAN, with this laptop at `192.168.1.42`.',
            '`ip route get 10.20.30.40`: this matches both the default and the `/16`, and the `/16` wins, so the packet uses `tun0`.',
            '`ip route get 8.8.8.8`: only the default matches, so the packet uses Wi-Fi. On Windows, `route print` and `Find-NetRoute` give similar views.',
          ],
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'VPN clients use LPM on purpose. OpenVPN `redirect-gateway def1` adds `0.0.0.0/1` and `128.0.0.0/1` through the tunnel. Together they cover all IPv4 addresses and both beat the `/0` home default, so the original default route never needs deleting.',
        },
      ],
    },
    {
      id: 'static-and-default-routes',
      title: 'Static routing and the default route',
      videoId: 'ch05-static-vs-dynamic-routing',
      blocks: [
        {
          type: 'paragraph',
          text: 'A **static route** is entered by an administrator and stays until someone removes it. It adds no protocol traffic and is fully predictable, but it does not adapt to most failures on its own. A **default route** is a special static or learned route that catches all traffic with no more specific match.',
        },
        {
          type: 'points',
          items: [
            'Cisco: `ip route 10.2.0.0 255.255.0.0 10.1.1.2` sends `10.2.0.0/16` to next hop `10.1.1.2`.',
            'Linux: `sudo ip route add 10.2.0.0/16 via 10.1.1.2`.',
            'Windows: `route add 10.2.0.0 mask 255.255.0.0 10.1.1.2`.',
            'IPv6 on Cisco: `ipv6 route 2001:db8:2::/48 2001:db8:1::2`.',
            'Default route on Cisco: `ip route 0.0.0.0 0.0.0.0 203.0.113.1`. In IPv6 it is `::/0`.',
            'A **stub network** has one way out, so one default route replaces many specific routes.',
            'A **floating static route** has a raised AD, for example `ip route 0.0.0.0 0.0.0.0 198.51.100.1 200`. It enters the table only when the preferred route is gone.',
            'Two routers whose defaults point at each other will loop unknown traffic until `TTL` expires. A summary route to `Null0` discards unused addresses inside your own block.',
          ],
        },
        {
          type: 'table',
          headers: ['Aspect', 'Static routing', 'Dynamic routing'],
          rows: [
            ['Configuration', 'Manual on every router', 'Protocol learns routes after initial setup'],
            ['Failure handling', 'None unless tracked or floating', 'Automatic reconvergence'],
            ['Overhead', 'No protocol traffic or CPU', 'Bandwidth, CPU and memory'],
            ['Scale', 'Small networks and stub links', 'Medium to very large networks'],
            ['Control', 'Exact and predictable', 'Depends on protocol metrics and policy'],
            ['Typical use', 'Home, branch, cloud route tables', 'Campus, ISP and data center'],
          ],
        },
        {
          type: 'command-lab',
          title: 'Read a Cisco routing table',
          command: 'show ip route',
          output: `R1# show ip route
Codes: L - local, C - connected, S - static, R - RIP, O - OSPF, B - BGP
       * - candidate default

Gateway of last resort is 203.0.113.1 to network 0.0.0.0

S*    0.0.0.0/0 [1/0] via 203.0.113.1
      10.0.0.0/8 is variably subnetted, 4 subnets, 3 masks
C        10.1.1.0/24 is directly connected, GigabitEthernet0/1
L        10.1.1.1/32 is directly connected, GigabitEthernet0/1
S        10.2.0.0/16 [1/0] via 10.1.1.2
O        10.3.3.0/24 [110/20] via 10.1.1.2, 00:12:44, GigabitEthernet0/1
      203.0.113.0/24 is variably subnetted, 2 subnets, 2 masks
C        203.0.113.0/30 is directly connected, GigabitEthernet0/0
L        203.0.113.2/32 is directly connected, GigabitEthernet0/0`,
          explanation: [
            '`Codes`: the letter at the start of each line shows how the route was learned.',
            '`Gateway of last resort`: a default route exists, so unknown traffic goes to `203.0.113.1`.',
            '`S* 0.0.0.0/0 [1/0]`: a static candidate default. The brackets show `[AD/metric]`.',
            '`C 10.1.1.0/24` and `L 10.1.1.1/32`: the connected subnet and the address of this router on it.',
            '`S 10.2.0.0/16 [1/0] via 10.1.1.2`: a static route whose next hop sits on the connected subnet.',
            '`O 10.3.3.0/24 [110/20]`: an OSPF route with AD 110 and cost 20, learned 12 minutes 44 seconds ago.',
            '`C 203.0.113.0/30` and `L 203.0.113.2/32`: the WAN link towards the ISP, with `.1` at the provider.',
          ],
        },
        {
          type: 'mini-lab',
          title: 'Two LANs joined by static routes',
          goal: 'Make two LANs reach each other using one static route and one default route in Cisco Packet Tracer.',
          steps: [
            'Build PC-A, R1, R2 and PC-B in a line. Use LAN A `192.168.10.0/24`, LAN B `192.168.20.0/24` and link `10.0.12.0/30` with R1 at `.1` and R2 at `.2`.',
            'Set PC-A to `192.168.10.10` with gateway `192.168.10.1`, and PC-B to `192.168.20.10` with gateway `192.168.20.1`.',
            'On R1 run `ip route 192.168.20.0 255.255.255.0 10.0.12.2`.',
            'On R2 run `ip route 0.0.0.0 0.0.0.0 10.0.12.1`.',
            'On both routers run `show ip route`, then ping and trace from PC-A to `192.168.20.10`.',
          ],
          expected: 'R1 shows an `S` route and R2 shows `S*` with a gateway of last resort. The first ping may lose one packet during ARP, and the rest succeed. `tracert` shows `192.168.10.1`, `10.0.12.2`, then `192.168.20.10`.',
        },
        {
          type: 'troubleshoot',
          symptom: 'Ping from LAN A to LAN B times out, although R1 has a correct route to LAN B.',
          checks: [
            'Run `show ip route` on R2 and look for a route back to `192.168.10.0/24`. Forwarding is one way, so each direction needs its own route.',
            'Run `show ip interface brief` and confirm the interfaces are `up/up`.',
            'Check that the next hop is reachable: `ping 10.0.12.2` from R1.',
            'Confirm that the PCs have the correct default gateway using `ipconfig` or `ip route`.',
            'Run `tracert` from PC-A. If the trace passes R2 and then stops, replies may be missing their return path.',
          ],
          fix: 'Add the missing return route on R2, for example `ip route 192.168.10.0 255.255.255.0 10.0.12.1`, then repeat the ping.',
        },
        {
          type: 'case-study',
          title: 'Branch office with fibre and LTE backup',
          scenario: 'A branch has a fibre link as primary and an LTE link as backup. The team wants automatic failover without running a routing protocol to either ISP.',
          steps: [
            'Primary route: `ip route 0.0.0.0 0.0.0.0 203.0.113.1` with the default AD of 1.',
            'Backup route: `ip route 0.0.0.0 0.0.0.0 198.51.100.1 200`, which stays out of the table while the primary exists.',
            'Problem: if the ISP fails beyond the local link, the fibre interface stays `up`, so the primary route never leaves the table.',
            'Fix: define an `ip sla` probe that pings an address beyond the ISP, bind it with `track 1 ip sla 1 reachability`, and add `track 1` to the primary route.',
            'Result: when the probe fails, the tracked route is removed and the floating route takes over. When the probe recovers, the primary returns.',
          ],
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: '**Home:** the ISP gives your router a default route through DHCP or PPPoE. **Hosts:** the default gateway on a laptop is a default route. **Cloud:** an AWS VPC route table is a set of static routes, such as `10.0.0.0/16` to `local` and `0.0.0.0/0` to an internet gateway, and the most specific route wins.',
        },
      ],
    },
    {
      id: 'distance-vector-rip',
      title: 'Distance vector routing: Bellman-Ford and RIP',
      videoId: 'ch05-distance-vector-rip',
      blocks: [
        {
          type: 'paragraph',
          text: 'In **distance vector** routing, each router knows only the cost to its direct neighbors and the distance vectors those neighbors report. It computes its own best distances from these reports and sends the result to its neighbors. The computation is distributed, iterative and asynchronous, and it is based on the **Bellman-Ford** equation.',
        },
        {
          type: 'callout',
          variant: 'formula',
          text: 'Bellman-Ford: `Dx(y) = min over v { c(x,v) + Dv(y) }`. The best cost from x to y is the smallest value, over all neighbors v, of the link cost to v plus the cost that v reports to y.',
        },
        {
          type: 'points',
          items: [
            'A **distance vector** lists the destinations a router knows and its cost to each one.',
            'Each router tells only its **neighbors**, but it tells them about **all destinations**.',
            'A router recomputes when a local link cost changes or a neighbor sends a new vector.',
            'If its own vector changes, it sends the new vector to its neighbors.',
            'No router has a map of the network. Each one trusts what its neighbors report.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch05-dv-update-sequence',
          title: 'Distance vector update sequence',
          caption: 'Topology is A to B at cost 1 and B to C at cost 2. Vectors spread one hop per exchange until no router finds a shorter path.',
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant A as RouterA
    participant B as RouterB
    participant C as RouterC
    Note over A,C: Start, each router knows only direct links
    A->>B: Vector A=0 B=1
    C->>B: Vector C=0 B=2
    Note over B: B stores A at cost 1 and C at cost 2
    B->>A: Vector A=1 B=0 C=2
    B->>C: Vector A=1 B=0 C=2
    Note over A: A sets C = 1 + 2 = 3 via B
    Note over C: C sets A = 2 + 1 = 3 via B
    A->>B: Vector A=0 B=1 C=3
    C->>B: Vector A=3 B=2 C=0
    Note over B: No shorter path, table unchanged
    Note over A,C: Converged, sends only timer refreshes now`,
        },
        {
          type: 'example',
          title: 'One update at router X',
          steps: [
            'Router X has links to Y (cost 3), Z (cost 1) and W (cost 6).',
            'Vector from Y: `P=4 Q=9 R=2 S=7 T=9`. From Z: `P=8 Q=5 R=6 S=3 T=10`. From W: `P=2 Q=2 R=7 S=9 T=1`.',
            'P: via Y `3+4=7`, via Z `1+8=9`, via W `6+2=8`. Best is 7 via Y.',
            'Q: via Y `3+9=12`, via Z `1+5=6`, via W `6+2=8`. Best is 6 via Z.',
            'R: via Y `3+2=5`, via Z `1+6=7`, via W `6+7=13`. Best is 5 via Y.',
            'S: via Y `3+7=10`, via Z `1+3=4`, via W `6+9=15`. Best is 4 via Z.',
            'T: via Y `3+9=12`, via Z `1+10=11`, via W `6+1=7`. Best is 7 via W.',
          ],
        },
        {
          type: 'points',
          items: [
            '**RIP** (Routing Information Protocol) is the classic distance vector protocol. Its metric is hop count.',
            'The largest usable path is 15 hops. A metric of **16 means infinity**, or unreachable.',
            'Routers send updates every 30 seconds over UDP port 520. One message carries up to 25 routes.',
            'Cisco timers: update 30 s, invalid 180 s, hold-down 180 s, flush 240 s. RIP has AD 120.',
            'Hop count ignores bandwidth, so RIP may prefer two slow hops over three fast ones.',
          ],
        },
        {
          type: 'table',
          headers: ['Feature', 'RIPv1', 'RIPv2', 'RIPng'],
          rows: [
            ['Address family', 'IPv4', 'IPv4', 'IPv6'],
            ['Carries prefix length', 'No, classful', 'Yes, classless', 'Yes'],
            ['Update destination', 'Broadcast `255.255.255.255`', 'Multicast `224.0.0.9`', 'Multicast `ff02::9`'],
            ['Transport', 'UDP 520', 'UDP 520', 'UDP 521'],
            ['Authentication', 'None', 'Plain text or MD5', 'Relies on IPsec'],
            ['RFC', '1058', '2453', '2080'],
          ],
        },
        {
          type: 'command-lab',
          title: 'Watch RIPv2 updates on a Cisco router',
          command: 'debug ip rip',
          output: `R2# debug ip rip
RIP protocol debugging is on
*Mar  1 00:12:31: RIP: sending v2 update to 224.0.0.9 via GigabitEthernet0/0 (10.0.12.2)
*Mar  1 00:12:31: RIP: build update entries
*Mar  1 00:12:31:      192.168.20.0/24 via 0.0.0.0, metric 1, tag 0
*Mar  1 00:12:38: RIP: received v2 update from 10.0.12.1 on GigabitEthernet0/0
*Mar  1 00:12:38:      192.168.10.0/24 via 0.0.0.0 in 1 hops`,
          explanation: [
            '`sending v2 update to 224.0.0.9`: RIPv2 sends to its multicast group, from interface address `10.0.12.2`.',
            '`192.168.20.0/24 ... metric 1`: R2 advertises its own LAN. A neighbor will reach it in 1 hop.',
            '`received v2 update from 10.0.12.1`: the update from R1 arrives on the same link.',
            '`192.168.10.0/24 ... in 1 hops`: R1 advertises LAN A. Stop the output with `undebug all`.',
          ],
        },
        {
          type: 'paragraph',
          text: 'Distance vector has a well known weakness. Good news spreads quickly, but bad news spreads slowly. After a failure, a router can believe a stale report from a neighbor whose path actually runs through the router itself. The two then raise their costs step by step, which is called **count to infinity**.',
        },
        {
          type: 'diagram',
          id: 'ch05-count-to-infinity',
          title: 'Count to infinity after a link failure',
          caption: 'Line topology A to B to C with all costs 1 and no split horizon. A loop exists between A and B until the metric reaches 16, the value RIP treats as infinity.',
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant A as RouterA
    participant B as RouterB
    participant C as RouterC
    Note over A,B: Before failure, A has C=2 and B has C=1
    Note over B,C: Link B to C fails
    A->>B: Vector C=2
    Note over B: B sets C = 1 + 2 = 3 via A
    B->>A: Vector C=3
    Note over A: A sets C = 1 + 3 = 4 via B
    A->>B: Vector C=4
    Note over B: B sets C = 1 + 4 = 5 via A
    Note over A,B: Costs keep rising until 16 means unreachable`,
        },
        {
          type: 'points',
          items: [
            '**Maximum metric:** a small infinity of 16 limits how long counting can last.',
            '**Split horizon:** do not advertise a route out of the interface it was learned on.',
            '**Route poisoning:** advertise a failed route with metric 16 instead of staying silent.',
            '**Poison reverse:** if a route runs through a neighbor, tell that neighbor the metric is infinity.',
            '**Triggered updates:** send changes at once rather than waiting for the 30 second timer.',
            '**Hold-down timer:** after a route fails, ignore less attractive news about it for a set time.',
          ],
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: 'Split horizon and poison reverse stop loops between **two adjacent routers** only. In a cycle of three or more routers, stale routes can still circulate. Expect a question that asks why these remedies are not complete.',
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'RIP now survives mainly in small legacy networks, labs and some simple edge devices. Cisco EIGRP is an advanced distance vector protocol that avoids loops with the DUAL algorithm and uses bandwidth and delay as its metric. BGP also descends from the distance vector family.',
        },
      ],
    },
    {
      id: 'link-state-ospf',
      title: 'Link state routing: Dijkstra and OSPF',
      videoId: 'ch05-ospf-link-state',
      blocks: [
        {
          type: 'paragraph',
          text: 'In **link state** routing, each router describes only its own links, and it floods that description to every router in the area. All routers end up with an identical map called the **link state database (LSDB)**. Each router then runs **Dijkstra** on that map to build its own shortest path tree.',
        },
        {
          type: 'points',
          items: [
            'Step 1: discover neighbors with Hello packets.',
            'Step 2: assign a cost to each link.',
            'Step 3: build a **link state advertisement (LSA)** listing own links and costs.',
            'Step 4: flood the LSA reliably. Sequence numbers and age remove old copies.',
            'Step 5: run Dijkstra with itself as root.',
            'Step 6: install the first hop of each shortest path into the RIB.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch05-dijkstra-working',
          title: 'Dijkstra shortest path first',
          caption: 'D is the current best cost from the source. Each pass permanently fixes the unvisited router with the lowest D, then relaxes the links leaving it. Link costs must not be negative.',
          kind: 'working-flowchart',
          mermaid: `flowchart TD
    D1["Start at source router S"]
    D2["Set D of S to 0, all others infinity"]
    D3["Put all routers in unvisited set Q"]
    D4{"Is Q empty?"}
    D5["Pick u in Q with smallest D"]
    D6["Remove u from Q and mark it visited"]
    D7{"Unchecked neighbor v in Q?"}
    D8{"D of u plus cost below D of v?"}
    D9["Set D of v and previous of v to u"]
    D10["Build tree from previous pointers"]
    D11["Install first hops in routing table"]
    D1 --> D2
    D2 --> D3
    D3 --> D4
    D4 -->|No| D5
    D5 --> D6
    D6 --> D7
    D7 -->|Yes| D8
    D7 -->|No| D4
    D8 -->|Yes| D9
    D8 -->|No| D7
    D9 --> D7
    D4 -->|Yes| D10
    D10 --> D11`,
        },
        {
          type: 'example',
          title: 'Dijkstra from R1 on a small graph',
          steps: [
            'Links: R1-R2 cost 1, R1-R3 cost 4, R2-R3 cost 2, R2-R4 cost 7, R3-R4 cost 3.',
            'Visit R1 (0): R2 becomes 1, R3 becomes 4.',
            'Visit R2 (1): R3 improves to `1+2=3` via R2. R4 becomes `1+7=8` via R2.',
            'Visit R3 (3): R4 improves to `3+3=6` via R3.',
            'Visit R4 (6): no router is left to improve.',
            'Result: R2 = 1, R3 = 3, R4 = 6. All paths leave R1 through R2.',
          ],
        },
        {
          type: 'points',
          items: [
            '**OSPF** (Open Shortest Path First) is the common open link state protocol. OSPFv2 (RFC 2328) carries IPv4 and OSPFv3 (RFC 5340) adds IPv6.',
            'It runs directly over IP as **protocol 89**, and provides its own reliability.',
            'Multicast groups: `224.0.0.5` for all OSPF routers and `224.0.0.6` for the DR and BDR.',
            'Default timers on broadcast and point-to-point links: Hello 10 s, Dead 40 s. LSAs refresh every 30 minutes.',
            'The **Router ID** is a 32-bit value: configured manually, else the highest loopback address, else the highest active interface address.',
            '**Cost** is reference bandwidth divided by interface bandwidth, and path cost is the sum over outgoing interfaces. OSPF has AD 110.',
          ],
        },
        {
          type: 'callout',
          variant: 'formula',
          text: '`OSPF cost = reference bandwidth / interface bandwidth`, default reference 100 Mbps, minimum cost 1. So 10 Mbps costs 10, while 100 Mbps and 1 Gbps both cost 1. Fix this with `auto-cost reference-bandwidth 10000` on all routers.',
        },
        {
          type: 'table',
          headers: ['Type', 'Packet', 'Purpose'],
          rows: [
            ['1', 'Hello', 'Discovers neighbors and keeps them alive'],
            ['2', 'Database Description (DBD)', 'Summarises the LSDB by listing LSA headers'],
            ['3', 'Link State Request (LSR)', 'Asks for LSAs that are missing or older'],
            ['4', 'Link State Update (LSU)', 'Carries the full LSAs'],
            ['5', 'Link State Acknowledgment (LSAck)', 'Confirms received LSAs'],
          ],
        },
        {
          type: 'diagram',
          id: 'ch05-ospf-neighbor-states',
          title: 'OSPF neighbor state machine',
          caption: 'Normal progress from Down to Full. Two DROTHER routers on a broadcast segment stop at 2-Way by design. The Attempt state, used only on NBMA networks, is omitted.',
          kind: 'working-diagram',
          mermaid: `stateDiagram-v2
    state "2-Way" as TwoWay
    [*] --> Down
    Down --> Init: Hello received
    Init --> TwoWay: Own Router ID seen in Hello
    TwoWay --> ExStart: Adjacency required
    ExStart --> Exchange: Master and slave chosen
    Exchange --> Loading: DBD done and LSAs missing
    Exchange --> Full: DBD done and nothing missing
    Loading --> Full: LSR and LSU completed
    TwoWay --> Init: Own Router ID absent from Hello
    Full --> Down: Dead interval expired`,
        },
        {
          type: 'points',
          items: [
            '**Down:** no Hello heard recently.',
            '**Init:** a Hello arrived, but it does not list this router yet.',
            '**2-Way:** each router sees itself in the Hello of the other. DR and BDR election happens here.',
            '**ExStart:** the router with the higher Router ID becomes master, and the pair agrees a DBD sequence number.',
            '**Exchange:** DBD packets describe each LSDB.',
            '**Loading:** LSR asks for missing LSAs, LSU delivers them and LSAck confirms them.',
            '**Full:** the databases match and the adjacency is complete.',
            '**DR and BDR:** on a broadcast segment a full mesh needs `n(n-1)/2` adjacencies, so a Designated Router and a Backup reduce this to `2n-3`. Highest priority wins (default 1, and 0 never stands), then highest Router ID. An elected DR is not preempted.',
          ],
        },
        {
          type: 'callout',
          variant: 'remember',
          text: 'To form a neighbor relationship, these Hello values must match: **Area ID, Hello interval, Dead interval, subnet mask on broadcast links, authentication and stub flag**. Router IDs must be unique. MTU is not in the Hello, but a mismatch stalls the pair in ExStart or Exchange.',
        },
        {
          type: 'paragraph',
          text: 'Flooding and running Dijkstra get expensive as a network grows. OSPF therefore supports a two-level hierarchy of **areas**. Detailed topology stays inside an area, and other areas see only summarised prefixes.',
        },
        {
          type: 'diagram',
          id: 'ch05-ospf-areas',
          title: 'OSPF areas and router roles',
          caption: 'All areas attach to backbone Area 0. ABRs keep one LSDB per area and exchange summaries, while the ASBR injects external routes.',
          kind: 'block',
          mermaid: `flowchart LR
    subgraph A1["Area 1 Campus"]
        R1["R1 internal router"]
        R2["R2 internal router"]
    end
    subgraph A0["Area 0 Backbone"]
        ABR1["ABR1 in Area 0 and Area 1"]
        BB1["BB1 backbone router"]
        ABR2["ABR2 in Area 0 and Area 2"]
        ASBR1["ASBR1 edge to ISP"]
    end
    subgraph A2["Area 2 Data center"]
        R3["R3 internal router"]
        R4["R4 internal router"]
    end
    EXT["External network via BGP or static"]
    R1 --- ABR1
    R2 --- ABR1
    ABR1 --- BB1
    BB1 --- ABR2
    ABR2 --- R3
    ABR2 --- R4
    BB1 --- ASBR1
    ASBR1 --- EXT`,
        },
        {
          type: 'table',
          headers: ['LSA type', 'Name', 'Created by', 'Flooding scope'],
          rows: [
            ['1', 'Router LSA', 'Every router', 'Own area'],
            ['2', 'Network LSA', 'DR', 'Own area'],
            ['3', 'Summary LSA', 'ABR', 'Into other areas, carrying prefixes'],
            ['4', 'ASBR Summary LSA', 'ABR', 'Into other areas, locating the ASBR'],
            ['5', 'AS External LSA', 'ASBR', 'Whole OSPF domain except stub areas'],
            ['7', 'NSSA External LSA', 'ASBR in an NSSA', 'NSSA only, converted to type 5 by the ABR'],
          ],
        },
        {
          type: 'command-lab',
          title: 'Check OSPF neighbors on a shared Ethernet segment',
          command: 'show ip ospf neighbor',
          output: `R1# show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
2.2.2.2           1   FULL/BDR        00:00:36    10.0.12.2       GigabitEthernet0/0
3.3.3.3           1   FULL/DR         00:00:33    10.0.12.3       GigabitEthernet0/0
4.4.4.4           0   2WAY/DROTHER    00:00:38    10.0.12.4       GigabitEthernet0/0`,
          explanation: [
            '`Neighbor ID`: the Router ID of the neighbor, which need not be its interface address.',
            '`3.3.3.3 FULL/DR`: the DR, with the highest Router ID among equal priorities. R1 is fully adjacent to it.',
            '`2.2.2.2 FULL/BDR`: the Backup DR, also fully adjacent.',
            '`4.4.4.4 2WAY/DROTHER`: priority `0` means it can never be DR. R1 is also a DROTHER here, so stopping at `2WAY` is normal.',
            '`Dead Time`: counts down from 40 s and resets on each Hello, so values stay between 30 and 40 s.',
          ],
        },
        {
          type: 'wireshark',
          filter: 'ospf',
          whatToLook: [
            'IP header: Protocol 89, TTL 1, destination 224.0.0.5 for Hello packets.',
            'Hello packet: Router ID, Area ID, Hello Interval 10, Dead Interval 40, DR, BDR and the Active Neighbor list.',
            'Adjacency order: Hello, DB Description, LS Request, LS Update, LS Acknowledge.',
            'Use the filter ospf.msg == 4 to isolate LS Update packets, then expand each LSA to read its type and sequence number.',
          ],
        },
        {
          type: 'mini-lab',
          title: 'Move traffic by changing OSPF cost',
          goal: 'Form OSPF adjacencies between three routers and steer a route by changing a single interface cost.',
          steps: [
            'In Packet Tracer or GNS3, join R1, R2 and R3 in a triangle using `10.0.12.0/30`, `10.0.13.0/30` and `10.0.23.0/30`. Add `Loopback0` with `10.3.3.3/32` on R3.',
            'On each router run `router ospf 1`, set `router-id` to `1.1.1.1`, `2.2.2.2` or `3.3.3.3`, then run `network 10.0.0.0 0.255.255.255 area 0`.',
            'On R1 run `show ip ospf neighbor`, then `show ip route ospf`.',
            'Run `traceroute 10.3.3.3` from R1 and note the first hop.',
            'On the R1 interface facing R3, set `ip ospf cost 100`. Wait a few seconds and repeat the two checks.',
          ],
          expected: 'Both neighbors reach `FULL`. With links of cost 1, R1 first reaches `10.3.3.3/32` directly at `[110/2]`. After the change it goes through R2 at `[110/3]`, and the trace shows R2 first.',
        },
        {
          type: 'troubleshoot',
          symptom: '`show ip ospf neighbor` shows a neighbor stuck in `EXSTART` or `EXCHANGE`, or there is no neighbor at all.',
          checks: [
            'Stuck in `EXSTART` or `EXCHANGE`: compare interface MTU on both ends with `show interfaces`.',
            'Stuck in `INIT`: Hello packets pass one way only. Look for an ACL or a filter blocking `224.0.0.5` or IP protocol 89.',
            'No neighbor: compare Area ID, timers, mask and authentication using `show ip ospf interface`.',
            'Confirm that the interface is not set as `passive-interface`, because a passive interface sends no Hello.',
            'Run `debug ip ospf adj` to read the mismatch reason, and check for a duplicate Router ID.',
          ],
          fix: 'Correct the mismatch. For MTU, set the same value on both ends. `ip ospf mtu-ignore` only hides the problem. Re-check that the state reaches `FULL`.',
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: '**Office and campus:** OSPF is a common interior protocol, with areas split by building or site. **ISP:** the backbone runs OSPF or IS-IS to reach loopbacks and BGP next hops, while BGP carries customer and Internet routes. **Linux:** FRRouting lets a server run OSPF like a router.',
        },
      ],
    },
    {
      id: 'bgp-autonomous-systems',
      title: 'Autonomous systems and BGP path vector routing',
      videoId: 'ch05-bgp-internet-routing',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Internet is a network of networks. Each independently run network is an **autonomous system (AS)**, and **BGP** connects them. Inside an AS the goal is the shortest path, but between ASes the goal is to follow business policy while still avoiding loops.',
        },
        {
          type: 'points',
          items: [
            'An **AS** is a set of networks under one administration with one routing policy, identified by an **AS number (ASN)**.',
            'ASNs were 16-bit and are now 32-bit (RFC 6793). Private ranges are `64512` to `65534` and `4200000000` to `4294967294`. `64496` to `64511` is reserved for documentation.',
            '**Interior gateway protocols (IGP)**, such as OSPF, IS-IS and RIP, route inside an AS. An **exterior gateway protocol (EGP)**, which today means BGP, routes between ASes.',
            '**Stub AS:** one provider connection. **Multihomed AS:** two or more providers, carries no transit traffic. **Transit AS:** carries traffic for other ASes.',
            '**Provider and customer:** the customer pays for reachability. **Peers:** two networks exchange their own customer traffic, usually without payment, often at an Internet exchange point (IXP).',
            'Usual policy: prefer customer routes, then peer routes, then provider routes. Routes learned from a peer or provider are advertised only to customers.',
          ],
        },
        {
          type: 'paragraph',
          text: 'BGP is a **path vector** protocol. It works like distance vector, because neighbors exchange reachability, but each route carries the full list of ASes it crossed. A router uses that list to detect loops and apply policy. BGP-4 is defined in RFC 4271 and runs over **TCP port 179**.',
        },
        {
          type: 'diagram',
          id: 'ch05-bgp-as-topology',
          title: 'BGP topology across autonomous systems',
          caption: 'Arrows show how the route to 203.0.113.0/24 is advertised, and data traffic flows the opposite way. U1 prefers its customer route, so C1 learns AS_PATH 64497 64502 64500.',
          kind: 'block',
          mermaid: `flowchart LR
    subgraph AS0["AS 64500 Enterprise multihomed stub"]
        E1["E1 originates 203.0.113.0/24"]
    end
    subgraph AS1["AS 64501 Regional ISP A"]
        A1["A1 customer edge"]
        A2["A2 upstream edge"]
        A1 ---|iBGP| A2
    end
    subgraph AS2["AS 64502 Regional ISP B"]
        B1["B1 border"]
    end
    subgraph AS3["AS 64496 Tier 1 transit"]
        T1["T1 border"]
        T2["T2 border"]
        T1 ---|iBGP| T2
    end
    subgraph AS4["AS 64497 Tier 1 transit"]
        U1["U1 border"]
    end
    subgraph AS5["AS 64503 Content network"]
        C1["C1 border"]
    end
    E1 -->|eBGP| A1
    E1 -->|eBGP| B1
    A2 -->|eBGP to provider| T1
    B1 -->|eBGP to provider| U1
    T2 -->|eBGP peer| U1
    U1 -->|eBGP to customer| C1`,
        },
        {
          type: 'table',
          headers: ['Message', 'Purpose'],
          rows: [
            ['`OPEN`', 'Starts the session with version, own ASN, hold time and BGP identifier'],
            ['`UPDATE`', 'Advertises prefixes (NLRI) with path attributes, and withdraws old routes'],
            ['`KEEPALIVE`', 'Confirms the peer is alive, by default every 60 s with a 180 s hold time on Cisco'],
            ['`NOTIFICATION`', 'Reports an error and closes the session'],
          ],
        },
        {
          type: 'table',
          headers: ['Attribute', 'Category', 'Meaning'],
          rows: [
            ['`AS_PATH`', 'Well-known mandatory', 'ASes crossed, used for loop detection and path length'],
            ['`NEXT_HOP`', 'Well-known mandatory', 'IP address of the next router towards the prefix'],
            ['`ORIGIN`', 'Well-known mandatory', 'How the route entered BGP: IGP, EGP or incomplete'],
            ['`LOCAL_PREF`', 'Well-known discretionary', 'Sets the preferred exit inside one AS. Higher wins'],
            ['`MED`', 'Optional non-transitive', 'Hints to a neighbor AS which entry to use. Lower wins'],
            ['`COMMUNITY`', 'Optional transitive', 'Tag used by policy, such as `no-export`'],
          ],
        },
        {
          type: 'points',
          items: [
            '**Loop prevention:** a router rejects any route whose `AS_PATH` already contains its own ASN.',
            '**eBGP** runs between ASes, usually over a direct link with `TTL` 1, and the sender prepends its ASN. AD is 20.',
            '**iBGP** runs inside an AS and carries external routes across it. AD is 200. It keeps `AS_PATH` and, by default, the `NEXT_HOP` unchanged.',
            'iBGP routers do not pass iBGP-learned routes to other iBGP peers, so they need a full mesh or **route reflectors**.',
            '**Session states:** Idle, Connect, Active, OpenSent, OpenConfirm, Established.',
            '**Best path order (simplified, Cisco):** highest weight, highest `LOCAL_PREF`, locally originated, shortest `AS_PATH`, lowest `ORIGIN`, lowest `MED`, eBGP over iBGP, lowest IGP cost to `NEXT_HOP`, lowest router ID.',
            '**Hot potato routing:** the IGP cost step sends traffic to the nearest exit from the AS.',
          ],
        },
        {
          type: 'table',
          headers: ['Aspect', 'Distance vector (RIP)', 'Link state (OSPF)', 'Path vector (BGP)'],
          rows: [
            ['Scope', 'Inside an AS', 'Inside an AS', 'Between ASes'],
            ['What is shared', 'Whole distance vector', 'Own links only, as LSAs', 'Prefixes with AS path and attributes'],
            ['Shared with', 'Direct neighbors', 'All routers in the area', 'Configured peers'],
            ['Network view', 'Neighbor reports only', 'Full map of the area', 'AS-level paths'],
            ['Algorithm', 'Bellman-Ford', 'Dijkstra', 'Policy based best path'],
            ['Metric', 'Hop count', 'Cost from bandwidth', 'Policy, then AS path length'],
            ['Transport', 'UDP 520', 'IP protocol 89', 'TCP 179'],
            ['Convergence', 'Slow, loops possible', 'Fast', 'Slow by design, very stable at scale'],
            ['CPU and memory', 'Low', 'Higher', 'High on full table routers'],
          ],
        },
        {
          type: 'command-lab',
          title: 'Read a BGP table',
          command: 'show ip bgp',
          output: `R1# show ip bgp
BGP table version is 14, local router ID is 192.0.2.1
Status codes: s suppressed, d damped, h history, * valid, > best, i - internal
Origin codes: i - IGP, e - EGP, ? - incomplete

   Network          Next Hop            Metric LocPrf Weight Path
*> 198.51.100.0/24  192.0.2.9                0             0 64501 64496 64510 i
*                   192.0.2.13               0             0 64502 64497 64496 64510 i
*> 203.0.113.0/24   0.0.0.0                  0         32768 i`,
          explanation: [
            '`local router ID is 192.0.2.1`: the BGP identifier of this router.',
            '`*> 198.51.100.0/24`: valid and best. The path crosses 3 ASes through ISP A at `192.0.2.9`.',
            'Second line, `*` only: a valid backup with 4 ASes in its path, so it loses on `AS_PATH` length.',
            '`64510 i`: the last ASN is the origin AS, and the trailing `i` means ORIGIN is IGP.',
            '`203.0.113.0/24` with next hop `0.0.0.0`: this router originates the prefix. Weight `32768` is the Cisco default for local routes.',
          ],
        },
        {
          type: 'wireshark',
          filter: 'bgp',
          whatToLook: [
            'Transport: TCP port 179 and a normal three-way handshake before the first BGP message.',
            'OPEN message: Version 4, My AS, Hold Time and BGP Identifier.',
            'KEEPALIVE message: only 19 bytes, which is the BGP header alone.',
            'Use bgp.type == 2 to isolate UPDATE messages, then read Withdrawn Routes, Path Attributes such as AS_PATH and NEXT_HOP, and the NLRI prefix list.',
          ],
        },
        {
          type: 'mini-lab',
          title: 'Map your traffic to autonomous systems',
          goal: 'See how one trace from a laptop crosses several autonomous systems.',
          steps: [
            'Run `traceroute -n 8.8.8.8` on Linux or macOS, or `tracert -d 8.8.8.8` on Windows.',
            'Look up each public hop at `bgp.he.net`, or run `whois -h whois.cymru.com " -v 8.8.8.8"` on Linux or macOS.',
            'Write down the AS number and owner of each hop, and skip private addresses.',
            'Open the page for your ISP on `bgp.he.net` and view its upstream providers and peers.',
          ],
          expected: 'Hops fall into consecutive groups: your ISP, sometimes a transit or peering network, then `AS15169`, which is Google. Some routers may show `* * *` because they do not answer probes.',
        },
        {
          type: 'troubleshoot',
          symptom: '`show ip bgp summary` shows a neighbor in `Active` or `Idle` and it never reaches Established.',
          checks: [
            'Run `ping` to the neighbor address. `Active` means the router is trying and failing to complete the TCP session.',
            'Confirm that no ACL or firewall blocks TCP port 179.',
            'Check `neighbor x.x.x.x remote-as` on both sides. A wrong ASN makes the peer send a NOTIFICATION.',
            'When peering on loopbacks, confirm `update-source` and a route to the peer loopback. Over eBGP also add `ebgp-multihop`, because the default TTL is 1.',
            'Check that authentication passwords match.',
          ],
          fix: 'Correct the neighbor address, ASN or filter, then run `clear ip bgp x.x.x.x` if needed. Confirm that the summary shows a prefix count, which means Established.',
        },
        {
          type: 'case-study',
          title: 'A route leak takes down YouTube, February 2008',
          scenario: 'Pakistan Telecom was ordered to block YouTube within the country. It created a `/24` route from inside the `/22` that YouTube announced, and pointed it at a null interface. The route leaked to its upstream provider PCCW, which passed it to the wider Internet.',
          steps: [
            'Routers worldwide now held both the `/22` and the `/24`. **Longest prefix match** chose the `/24`, whatever the BGP attributes were.',
            'Traffic for those YouTube addresses went to Pakistan Telecom and was discarded, so the service failed for many users for about two hours.',
            'YouTube announced the same `/24`, then two more specific `/25` routes, to pull traffic back.',
            'PCCW stopped propagating the announcement, which ended the incident.',
            'Lesson: providers must filter what customers announce. Today **RPKI** lets a prefix owner publish a signed record of the ASN allowed to originate that prefix, and routers can reject other origins.',
          ],
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: 'Remember the direction: a route **advertisement** flows opposite to the **data** that uses it. Remember the protocols: BGP is **TCP 179**, OSPF is **IP protocol 89**, RIP is **UDP 520**. Examiners often swap these in options.',
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: '**Enterprise:** multihomed companies run BGP with two ISPs for failover. **Cloud:** AWS Direct Connect and Azure ExpressRoute exchange routes with customers over BGP. **Data center:** large Clos fabrics often run eBGP between switch layers (RFC 7938). **Anycast:** public resolvers such as `8.8.8.8` are announced from many sites, so BGP delivers users to a nearby one.',
        },
      ],
    },
    {
      id: 'multicast-overview',
      title: 'Multicast routing overview',
      blocks: [
        {
          type: 'paragraph',
          text: '**Multicast** delivers one stream to a group of interested receivers. The source sends a single copy, and routers replicate it only where paths branch. This saves bandwidth compared with sending a separate unicast copy to each receiver.',
        },
        {
          type: 'points',
          items: [
            '**Unicast** is one to one, **broadcast** is one to all on a subnet, **multicast** is one to a group, and **anycast** is one to the nearest of many.',
            'A receiver joins a **group address**, and the source need not know who has joined.',
            '**IGMP** (IP protocol 2) runs between hosts and the local router. IPv6 uses **MLD**, which is part of ICMPv6.',
            '**PIM** runs between routers. It is protocol independent because it reuses the existing unicast table.',
            '**PIM Dense Mode** floods traffic, then prunes branches with no receivers. **PIM Sparse Mode** builds trees only on request, starting from a **Rendezvous Point (RP)**.',
            '**Reverse path forwarding (RPF):** a router accepts a multicast packet only if it arrives on the interface used to reach the source. This prevents loops.',
            '**IGMP snooping:** a layer 2 switch watches IGMP messages and sends group traffic only to ports with receivers.',
          ],
        },
        {
          type: 'table',
          headers: ['Item', 'Value or role'],
          rows: [
            ['IPv4 group range', '`224.0.0.0/4`, from `224.0.0.0` to `239.255.255.255`'],
            ['Link-local control', '`224.0.0.0/24`, never forwarded, for example `224.0.0.5` for OSPF'],
            ['Source-specific multicast', '`232.0.0.0/8`, used with IGMPv3'],
            ['Administratively scoped', '`239.0.0.0/8`, private use inside an organisation'],
            ['IPv6 group range', '`ff00::/8`'],
            ['Ethernet mapping', '`01:00:5e` plus the low 23 bits of the group address'],
          ],
        },
        {
          type: 'diagram',
          id: 'ch05-multicast-pim-sm',
          title: 'Joining a group with IGMP and PIM Sparse Mode',
          caption: 'Simplified flow with intermediate routers omitted. The receiver first gets data on the shared tree through the RP, then the last hop router switches to the shortest path tree from the source.',
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant H as Receiver
    participant L as LastHopRouter
    participant P as RendezvousPoint
    participant F as FirstHopRouter
    participant S as Source
    H->>L: IGMP Report join 239.1.1.1
    L->>P: PIM Join for shared tree
    S->>F: Multicast data to 239.1.1.1
    F->>P: PIM Register carrying data
    P->>L: Data down the shared tree
    L->>H: Data to receiver
    L->>F: PIM Join for source tree
    F->>L: Data on shortest path tree
    L->>P: PIM Prune source from shared tree`,
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: 'Do not mix up the two protocols. **IGMP** works between a host and its first-hop router and says who wants the group. **PIM** works between routers and builds the tree that carries the traffic.',
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: '**ISP:** IPTV services carry channels as multicast inside the provider network. **Finance:** market data feeds use multicast within trading networks. **LAN:** mDNS uses `224.0.0.251`. **Public Internet:** multicast is not widely enabled across providers, so video streaming relies on unicast from CDNs. **Cloud:** most VPCs lack native multicast, and AWS offers it through Transit Gateway.',
        },
      ],
    },
  ],
  flashcards: [
    {
      front: 'What is the difference between forwarding and routing?',
      back: 'Forwarding moves one packet to the correct output interface inside one router. Routing computes network-wide paths and fills the table.',
    },
    {
      front: 'RIB versus FIB',
      back: 'The RIB is the control plane table that selects best routes from all sources. The FIB is the data plane copy used for fast packet lookup.',
    },
    {
      front: 'What is longest prefix match?',
      back: 'Among all routing entries that match a destination, the router uses the one with the longest prefix, because it is the most specific.',
    },
    {
      front: 'What is the default route?',
      back: '0.0.0.0/0 in IPv4 or ::/0 in IPv6. It matches everything with length zero, so it is used only when no longer prefix matches.',
    },
    {
      front: 'Administrative distance versus metric',
      back: 'AD compares different route sources for the same prefix, and lower wins. Metric compares paths within one protocol, and lower also wins.',
    },
    {
      front: 'State the Bellman-Ford equation.',
      back: 'Dx(y) = min over neighbors v of { c(x,v) + Dv(y) }.',
    },
    {
      front: 'What is count to infinity?',
      back: 'After a failure, routers reuse stale vectors from each other and raise the cost step by step until it reaches the infinity value, 16 in RIP.',
    },
    {
      front: 'Key facts about RIP',
      back: 'Hop count metric, 15 hops maximum, 16 is infinity, updates every 30 s, UDP port 520, AD 120. RIPv2 uses multicast 224.0.0.9.',
    },
    {
      front: 'Name the five OSPF packet types.',
      back: 'Hello, Database Description, Link State Request, Link State Update and Link State Acknowledgment.',
    },
    {
      front: 'List the OSPF neighbor states in order.',
      back: 'Down, Init, 2-Way, ExStart, Exchange, Loading, Full. Attempt also exists on NBMA networks.',
    },
    {
      front: 'ABR versus ASBR',
      back: 'An ABR connects Area 0 to another OSPF area. An ASBR injects routes from outside the OSPF domain.',
    },
    {
      front: 'Name the four BGP message types and the BGP port.',
      back: 'OPEN, UPDATE, KEEPALIVE and NOTIFICATION, over TCP port 179.',
    },
    {
      front: 'eBGP versus iBGP',
      back: 'eBGP runs between different ASes and prepends the ASN, AD 20. iBGP runs within one AS, leaves AS_PATH unchanged, AD 200, and needs a full mesh or route reflectors.',
    },
    {
      front: 'IGMP versus PIM',
      back: 'IGMP lets hosts tell the local router which multicast groups they want. PIM lets routers build the distribution tree between them.',
    },
  ],
  quiz: [
    {
      id: 'ch05-q1',
      question: 'Which of these is a data plane task in a router?',
      options: [
        'Running Dijkstra on the link state database',
        'Moving a packet to an output port using the FIB',
        'Exchanging BGP UPDATE messages with a neighbor',
        'Flooding an LSA to other routers in the area',
      ],
      answerIndex: 1,
      explanation: 'The data plane acts on each packet. The other three options are control plane tasks that build the tables.',
      difficulty: 'easy',
      topic: 'Forwarding vs routing',
    },
    {
      id: 'ch05-q2',
      question: 'A router has routes to 10.0.0.0/8 and 10.1.0.0/16. Which route carries a packet to 10.1.5.9?',
      options: [
        '10.0.0.0/8, because it is the larger network',
        '0.0.0.0/0, because it is always checked first',
        '10.1.0.0/16, because it has the longest matching prefix',
        'Either one, chosen at random per packet',
      ],
      answerIndex: 2,
      explanation: 'Both entries match the destination. Longest prefix match selects the most specific entry, which is the /16.',
      difficulty: 'easy',
      topic: 'Longest prefix match',
    },
    {
      id: 'ch05-q3',
      question: 'Which prefix is the IPv4 default route?',
      options: ['0.0.0.0/0', '255.255.255.255/32', '127.0.0.0/8', '224.0.0.0/4'],
      answerIndex: 0,
      explanation: 'A prefix length of 0 matches every address. The others are limited broadcast, loopback and multicast.',
      difficulty: 'easy',
      topic: 'Static and default routes',
    },
    {
      id: 'ch05-q4',
      question: 'In RIP, which hop count means that a destination is unreachable?',
      options: ['15', '30', '255', '16'],
      answerIndex: 3,
      explanation: 'RIP treats 16 as infinity, so the longest usable path is 15 hops. The value 30 is the update timer in seconds.',
      difficulty: 'easy',
      topic: 'Distance vector',
    },
    {
      id: 'ch05-q5',
      question: 'Which algorithm does each OSPF router run on its link state database?',
      options: ['Bellman-Ford', 'Dijkstra shortest path first', 'Spanning Tree Protocol', 'BGP best path selection'],
      answerIndex: 1,
      explanation: 'OSPF routers run Dijkstra with themselves as root on an identical LSDB. Bellman-Ford belongs to distance vector protocols.',
      difficulty: 'easy',
      topic: 'Link state and OSPF',
    },
    {
      id: 'ch05-q6',
      question: 'What transport does BGP use?',
      options: ['UDP port 520', 'IP protocol 89', 'TCP port 179', 'UDP port 179'],
      answerIndex: 2,
      explanation: 'BGP runs over TCP port 179, which gives it reliable delivery. UDP 520 is RIP and IP protocol 89 is OSPF.',
      difficulty: 'easy',
      topic: 'BGP and autonomous systems',
    },
    {
      id: 'ch05-q7',
      question: 'What is head of the line blocking in a router?',
      options: [
        'A packet at the front of an input queue waits for a busy output, delaying packets behind it that want a free output',
        'An output queue overflows, so newly arriving packets are dropped from the tail',
        'The scheduler always serves the high priority queue, so low priority packets starve',
        'The TCAM returns several matching entries for one destination address',
      ],
      answerIndex: 0,
      explanation: 'HOL blocking is an input queuing effect. The front packet blocks the others even when their outputs are free.',
      difficulty: 'medium',
      topic: 'Router internals',
    },
    {
      id: 'ch05-q8',
      question: 'What does split horizon do?',
      options: [
        'Divides a routing domain into separate areas',
        'Advertises failed routes with metric 16 to every neighbor',
        'Holds a failed route unchanged until a timer expires',
        'Stops a router advertising a route out of the interface it was learned on',
      ],
      answerIndex: 3,
      explanation: 'Split horizon removes a route from updates sent back toward its source. The other options describe areas, route poisoning and hold-down.',
      difficulty: 'medium',
      topic: 'Distance vector',
    },
    {
      id: 'ch05-q9',
      question: 'On an Ethernet segment with a DR, a BDR and two other routers, which pair stays in the 2-Way state?',
      options: ['DR and BDR', 'DR and a DROTHER', 'The two DROTHER routers', 'BDR and a DROTHER'],
      answerIndex: 2,
      explanation: 'DROTHER routers form full adjacencies only with the DR and BDR. Two DROTHER routers stop at 2-Way, which is normal.',
      difficulty: 'medium',
      topic: 'Link state and OSPF',
    },
    {
      id: 'ch05-q10',
      question: 'Why is a static route with administrative distance 200 described as floating, when OSPF also knows the prefix?',
      options: [
        'It moves between interfaces automatically according to load',
        'It stays out of the routing table until the lower distance route disappears',
        'It has no next hop, so the router looks it up each time',
        'It is shared with neighbors by a routing protocol',
      ],
      answerIndex: 1,
      explanation: 'OSPF has AD 110, which beats 200. The static route enters the table only when the OSPF route is lost, so it acts as a backup.',
      difficulty: 'medium',
      topic: 'Static and default routes',
    },
    {
      id: 'ch05-q11',
      question: 'A BGP router in AS 64500 receives an UPDATE with AS_PATH 64501 64500 64510. What does it do?',
      options: [
        'Rejects the route, because its own AS number is in the path',
        'Accepts it, because the path has only three AS numbers',
        'Accepts it and removes 64500 from the path',
        'Sends a NOTIFICATION and closes the TCP session',
      ],
      answerIndex: 0,
      explanation: 'Seeing its own ASN in AS_PATH means the route has already passed through this AS. This is how BGP prevents loops, and the session stays up.',
      difficulty: 'medium',
      topic: 'BGP and autonomous systems',
    },
    {
      id: 'ch05-q12',
      question: 'What does the reverse path forwarding check verify in multicast routing?',
      options: [
        'That the group address lies inside 224.0.0.0/4',
        'That at least one host sent an IGMP Report for the group',
        'That the source sent a PIM Register to the Rendezvous Point',
        'That the packet arrived on the interface the router uses to reach the source',
      ],
      answerIndex: 3,
      explanation: 'A router compares the arrival interface with its unicast route back to the source. A packet arriving on any other interface is dropped, which prevents loops.',
      difficulty: 'medium',
      topic: 'Multicast',
    },
    {
      id: 'ch05-q13',
      question: 'Routes: 192.168.0.0/16 to A, 192.168.32.0/19 to B, 192.168.40.0/21 to C, 0.0.0.0/0 to D. Which next hop does 192.168.48.1 use?',
      options: ['A, through the /16', 'B, through the /19', 'C, through the /21', 'D, through the default route'],
      answerIndex: 1,
      explanation: 'The third octet 48 is 00110000. The /19 covers third octets 32 to 63, so it matches. The /21 covers only 40 to 47, so it fails. The /19 is the longest match.',
      difficulty: 'hard',
      topic: 'Longest prefix match',
    },
    {
      id: 'ch05-q14',
      question: 'When does poison reverse fail to stop count to infinity?',
      options: [
        'When link costs are not all equal',
        'When triggered updates are enabled',
        'When the routers run RIPv2 rather than RIPv1',
        'When the routing loop involves three or more routers',
      ],
      answerIndex: 3,
      explanation: 'Poison reverse stops loops between two direct neighbors. In a longer cycle, a router can hear a stale route from a neighbor that does not route through it.',
      difficulty: 'hard',
      topic: 'Distance vector',
    },
    {
      id: 'ch05-q15',
      question: 'A router holds two BGP routes to one prefix. Route 1 has LOCAL_PREF 100 and AS_PATH length 2. Route 2 has LOCAL_PREF 200 and AS_PATH length 5. Weight is equal and neither is locally originated. Which is best?',
      options: [
        'Route 2, because LOCAL_PREF is compared before AS_PATH length',
        'Route 1, because a shorter AS_PATH always wins',
        'Route 1, because a lower LOCAL_PREF is preferred',
        'Both are installed and load shared by default',
      ],
      answerIndex: 0,
      explanation: 'Higher LOCAL_PREF wins, and it is checked before AS_PATH length. This lets an AS choose its exit by policy rather than by shortest path.',
      difficulty: 'hard',
      topic: 'BGP and autonomous systems',
    },
  ],
  importantQuestions: [
    {
      q: 'Differentiate between forwarding and routing.',
      modelAnswer:
        'Forwarding is the local, per-packet data plane action of moving a packet from an input interface to an output interface using the FIB.\nRouting is the network-wide control plane process of computing paths and filling the routing table.',
      marks: 2,
    },
    {
      q: 'What is a default route, and when is it used?',
      modelAnswer:
        'A default route is the entry 0.0.0.0/0 in IPv4 or ::/0 in IPv6, which matches every destination with prefix length zero.\nIt is used only when no longer prefix matches, typically on stub networks such as homes and branch offices.',
      marks: 2,
    },
    {
      q: 'Explain longest prefix match with an example.',
      modelAnswer:
        'Routing entries may overlap, so one destination can match several prefixes. The router selects the match with the most network bits because it is the most specific.\nExample table: 10.0.0.0/8 to R1, 10.1.0.0/16 to R2, 10.1.2.0/24 to R3, 0.0.0.0/0 to R4.\nDestination 10.1.2.9 matches all four, and the /24 wins, so R3.\nDestination 10.1.9.9 matches the /8, /16 and /0, and the /16 wins, so R2.\nDestination 8.8.8.8 matches only the /0, so R4.\nHardware performs this search with TCAM, and software routers use tries.',
      marks: 5,
    },
    {
      q: 'Explain the count to infinity problem and two remedies.',
      modelAnswer:
        'Take the line A-B-C with costs of 1. A reaches C at cost 2 through B. If link B-C fails, B may hear from A that C is at cost 2 and set its own cost to 3 via A, not knowing that the path of A runs through B.\nA then updates to 4 via B, B to 5 via A, and so on. A loop exists until the cost reaches infinity, which is 16 in RIP.\nSplit horizon: a router does not advertise a route out of the interface it was learned on.\nPoison reverse: a router advertises that route back to the neighbor with an infinite metric.\nBoth fix loops between two routers only. Triggered updates and hold-down timers also help.',
      marks: 5,
    },
    {
      q: 'Describe the main components of a router.',
      modelAnswer:
        'Input port: terminates the link, removes the layer 2 header, does the FIB lookup and queues the packet if the fabric is busy.\nSwitching fabric: connects inputs to outputs using memory, a bus or a crossbar.\nOutput port: queues packets, schedules them, adds the new layer 2 header and transmits.\nRouting processor: runs routing protocols, builds the RIB and updates the FIB.\nInput queuing can cause HOL blocking, and output queuing causes congestion loss when buffers overflow.',
      marks: 5,
    },
    {
      q: 'Compare distance vector and link state routing.',
      modelAnswer:
        'Information shared: distance vector sends its whole vector, and link state sends only the state of its own links.\nRecipients: distance vector tells direct neighbors, and link state floods to all routers in the area.\nView: distance vector relies on neighbor reports, and link state holds a complete map of the area.\nAlgorithm: Bellman-Ford versus Dijkstra.\nConvergence: distance vector is slower and can loop, while link state is faster.\nResources: distance vector uses less CPU and memory.\nExamples: RIP versus OSPF and IS-IS.',
      marks: 5,
    },
    {
      q: 'Explain the working of OSPF, covering neighbor formation, database synchronisation, route calculation and areas.',
      modelAnswer:
        'OSPF is a link state interior gateway protocol carried directly in IP as protocol 89 (RFC 2328 for IPv4).\nNeighbor formation: routers send Hello packets to 224.0.0.5 every 10 s, with a 40 s dead interval on common links. Area ID, timers, mask and authentication must match. States run Down, Init, 2-Way, ExStart, Exchange, Loading, Full.\nDR and BDR: on broadcast segments the highest priority, then highest Router ID, wins. DROTHER routers fully peer only with the DR and BDR, which reduces adjacencies from n(n-1)/2 to 2n-3.\nDatabase synchronisation: DBD packets summarise the LSDB, LSR asks for missing LSAs, LSU delivers them and LSAck confirms. LSAs are flooded reliably using sequence numbers and age.\nRoute calculation: each router runs Dijkstra on the identical LSDB with itself as root and installs first hops. Cost = reference bandwidth / interface bandwidth, with a default reference of 100 Mbps.\nAreas: a two-level hierarchy in which all areas attach to Area 0. ABRs join areas and generate Type 3 summaries, and ASBRs inject external Type 5 routes. Areas limit flooding and SPF runs, so OSPF scales to large networks.',
      marks: 10,
    },
    {
      q: 'Explain BGP: why it is needed, its messages, its attributes and how it selects a best path.',
      modelAnswer:
        'Need: the Internet consists of independently run autonomous systems. Interior protocols cannot scale to all Internet prefixes or express business policy, so BGP-4 (RFC 4271) connects ASes.\nType: path vector. Each route carries the AS_PATH, and a router rejects any route containing its own ASN, which prevents loops.\nTransport and messages: TCP port 179, using OPEN, UPDATE, KEEPALIVE and NOTIFICATION. Updates are incremental after the initial exchange.\neBGP and iBGP: eBGP runs between ASes and iBGP carries external routes within one AS. iBGP needs a full mesh or route reflectors.\nAttributes: AS_PATH, NEXT_HOP and ORIGIN are well-known mandatory. LOCAL_PREF sets the preferred exit, MED hints at the preferred entry, and COMMUNITY tags routes for policy.\nBest path (simplified): highest weight on Cisco, highest LOCAL_PREF, locally originated, shortest AS_PATH, lowest ORIGIN, lowest MED, eBGP over iBGP, lowest IGP cost to NEXT_HOP, lowest router ID.\nPolicy: networks usually prefer customer routes over peer routes over provider routes.',
      marks: 10,
    },
  ],
  numericals: [
    {
      question:
        'A router has this table: 172.16.0.0/16 to R1, 172.16.64.0/18 to R2, 172.16.96.0/19 to R3, 172.16.100.0/24 to R4, 0.0.0.0/0 to R5. Find the next hop for (a) 172.16.100.37, (b) 172.16.101.9, (c) 172.16.70.1, (d) 172.16.200.1, (e) 172.17.1.1.',
      steps: [
        'Convert each prefix into a third octet range with second octet 16: /16 covers 0 to 255, /18 covers 64 to 127, /19 covers 96 to 127, /24 covers only 100.',
        '(a) Third octet 100 matches /16, /18, /19, /24 and /0. The longest is /24, so R4.',
        '(b) Third octet 101 matches /16, /18, /19 and /0, but not /24. The longest is /19, so R3.',
        '(c) Third octet 70 is 01000110. It matches /18 (01xxxxxx) but not /19 (011xxxxx). The longest is /18, so R2.',
        '(d) Third octet 200 is 11001000. It fails /18 and /19, so only /16 and /0 match. The longest is /16, so R1.',
        '(e) Second octet 17 fails all 172.16 prefixes, so only /0 matches, which gives R5.',
      ],
      answer: 'Next hops: (a) R4, (b) R3, (c) R2, (d) R1, (e) R5.',
    },
    {
      question:
        'An undirected graph has link costs A-B 2, A-C 5, A-E 7, B-C 1, B-D 7, C-D 3, D-E 2. Use Dijkstra from A to find the least cost and first hop to every router.',
      steps: [
        'Start: D(A) = 0 and every other distance is infinity. Visited set is empty.',
        'Visit A (0): B = 2 via A, C = 5 via A, E = 7 via A.',
        'Visit B (2): C improves to 2 + 1 = 3 via B. D becomes 2 + 7 = 9 via B.',
        'Visit C (3): D improves to 3 + 3 = 6 via C.',
        'Visit D (6): E through D would be 6 + 2 = 8, which is not below 7, so E stays at 7 via A.',
        'Visit E (7): all routers are now visited.',
        'Trace back the paths: A-B, A-B-C, A-B-C-D and A-E.',
      ],
      answer: 'B = 2 cost units via B, C = 3 via B, D = 6 via B, E = 7 via E directly.',
    },
    {
      question:
        'Use synchronous Bellman-Ford on the same graph (A-B 2, A-C 5, A-E 7, B-C 1, B-D 7, C-D 3, D-E 2) to find distances from A. Show each round.',
      steps: [
        'Rule: new D(v) = min over neighbors u of D(u) + c(u,v), using values from the previous round. D(A) stays 0.',
        'Round 0: B, C, D and E are all infinity.',
        'Round 1: B = 2, C = 5, E = 7, D = infinity.',
        'Round 2: B = min(0+2, 5+1) = 2. C = min(0+5, 2+1) = 3. D = min(2+7, 5+3, 7+2) = 8. E = 7.',
        'Round 3: B = 2. C = 3. D = min(2+7, 3+3, 7+2) = 6. E = min(0+7, 8+2) = 7.',
        'Round 4: B = min(0+2, 3+1, 6+7) = 2. C = min(0+5, 2+1, 6+3) = 3. D = min(2+7, 3+3, 7+2) = 6. E = min(0+7, 6+2) = 7. Nothing changes, so the values have converged.',
        'With 5 routers, at most 4 rounds are needed, and this agrees with the bound.',
      ],
      answer: 'B = 2, C = 3, D = 6, E = 7 cost units, the same as Dijkstra. Values are final after round 3, and round 4 confirms them.',
    },
    {
      question:
        'An OSPF router can reach a destination by path P1 with one 100 Mbps link, or path P2 with two 1 Gbps links. Find the cost of each path and the winner with (a) the default reference of 100 Mbps, and (b) a reference of 10000 Mbps.',
      steps: [
        'Cost = reference bandwidth / interface bandwidth, with a minimum of 1.',
        '(a) 100 Mbps link: 100 / 100 = 1. 1 Gbps link: 100 / 1000 = 0.1, raised to the minimum of 1.',
        '(a) P1 = 1. P2 = 1 + 1 = 2. OSPF picks P1, the slower path.',
        '(b) 100 Mbps link: 10000 / 100 = 100. 1 Gbps link: 10000 / 1000 = 10.',
        '(b) P1 = 100. P2 = 10 + 10 = 20. OSPF picks P2.',
      ],
      answer: '(a) P1 = 1 and P2 = 2 cost units, P1 wins. (b) P1 = 100 and P2 = 20 cost units, P2 wins.',
    },
    {
      question:
        'A router port runs at 100 Gbps and receives 64-byte packets back to back, ignoring preamble and inter-frame gap. Find the time budget per lookup and the lookups per second. What fabric rate does a router with 32 such ports need to avoid input queuing?',
      steps: [
        'Packet size = 64 x 8 = 512 bits.',
        'T = 512 / (100 x 10^9) = 5.12 x 10^-9 s = 5.12 ns.',
        'Lookup rate = 100 x 10^9 / 512 = 195,312,500 per second, about 195.3 million.',
        'Fabric rate = N x R = 32 x 100 Gbps = 3200 Gbps = 3.2 Tbps.',
      ],
      answer: '5.12 ns per lookup, about 195.3 million lookups per second, and a 3.2 Tbps fabric.',
    },
  ],
  keyTerms: [
    'Forwarding: Local per-packet move from an input interface to the correct output interface.',
    'Routing: Network-wide process of computing paths and building the routing table.',
    'RIB: Control plane table that selects the best route per prefix from all sources.',
    'FIB: Data plane copy of the best routes, built for fast per-packet lookup.',
    'Longest prefix match: Lookup rule that picks the matching entry with the most network bits.',
    'Default route: The 0.0.0.0/0 or ::/0 entry used when no more specific prefix matches.',
    'Administrative distance: Cisco trust value used to choose between route sources. Lower wins.',
    'Metric: Cost value a routing protocol uses to compare paths to the same prefix.',
    'Distance vector: Routing in which neighbors exchange cost estimates for all destinations.',
    'Count to infinity: Slow rise of route costs after a failure as routers reuse stale vectors.',
    'Split horizon: Rule not to advertise a route out of the interface it was learned on.',
    'LSA: OSPF record that describes the links of a router, flooded across an area.',
    'ABR: OSPF router with interfaces in Area 0 and at least one other area.',
    'ASBR: OSPF router that injects routes from outside the OSPF domain.',
    'Autonomous system: Networks under one administration with one routing policy and an ASN.',
    'AS_PATH: BGP attribute that lists the AS numbers a route has crossed.',
    'TCAM: Memory that compares all stored prefixes in parallel for line-rate lookup.',
    'HOL blocking: Front packet waits for a busy output and delays packets behind it.',
    'IGMP: Protocol hosts use to tell the local router which multicast groups they want.',
    'PIM: Multicast routing protocol that builds distribution trees using the unicast table.',
  ],
  formulas: [
    {
      name: 'Bellman-Ford equation',
      expression: 'Dx(y) = min over v { c(x,v) + Dv(y) }',
      note: 'v ranges over the direct neighbors of x.',
    },
    {
      name: 'Dijkstra relaxation',
      expression: 'D(v) = min( D(v), D(u) + c(u,v) )',
      note: 'Applied to each unvisited neighbor v after visiting u. Costs must be non-negative.',
    },
    {
      name: 'Algorithm complexity',
      expression: 'Dijkstra O(V^2) with an array or O((V + E) log V) with a heap. Bellman-Ford O(V x E)',
    },
    {
      name: 'OSPF interface cost',
      expression: 'Cost = reference bandwidth / interface bandwidth',
      note: 'Default reference is 100 Mbps, and the minimum cost is 1.',
    },
    {
      name: 'OSPF adjacencies on a segment',
      expression: 'Full mesh = n(n-1)/2, with DR and BDR = 2n - 3',
      note: 'For n = 5 routers, 10 adjacencies fall to 7.',
    },
    {
      name: 'Router lookup budget',
      expression: 'T = packet size in bits / line rate',
      note: '64 bytes at 100 Gbps gives 5.12 ns.',
    },
    {
      name: 'Fabric rate',
      expression: 'Fabric rate = N x R',
      note: 'For N ports of rate R, this avoids input queuing.',
    },
    {
      name: 'Multicast MAC mapping',
      expression: 'MAC = 01:00:5e + low 23 bits of group IP',
      note: 'Five address bits are lost, so 32 IPv4 groups share each MAC address.',
    },
  ],
  handsOnChecklist: [
    'Print your laptop routing table with ip route or route print, and identify the default gateway and the connected routes.',
    'Use ip route get on Linux or Find-NetRoute on Windows to see which route is chosen for three different destinations.',
    'In Cisco Packet Tracer, connect two LANs using two routers, then make them reach each other with one static route and one default route.',
    'Configure RIPv2 on three routers in a simulator, shut down one link and watch the routes change with debug ip rip.',
    'Build a three-router OSPF triangle, read show ip ospf neighbor, then change an interface cost and confirm that the route moves.',
    'Trace the path to 8.8.8.8 and use bgp.he.net to work out which autonomous system each public hop belongs to.',
  ],
};

export default chapter;

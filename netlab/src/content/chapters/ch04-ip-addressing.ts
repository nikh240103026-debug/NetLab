import type { Chapter } from '@/lib/types';

const chapter: Chapter = {
  slug: 'ip-addressing',
  number: 4,
  title: 'Network layer I: IP addressing',
  shortTitle: 'IP addressing',
  summary:
    'How IP names and moves packets: the IPv4 header, classful and CIDR addressing, subnetting and VLSM, private ranges with NAT and PAT, ICMP tools, fragmentation, the DHCP link, and IPv6 with its transition methods and NDP.',
  estMinutes: 85,
  learningObjectives: [
    'Read every field of an IPv4 header and state its size, unit and purpose.',
    'Subnet a CIDR block by hand and design a VLSM plan for an office with mixed host counts.',
    'Trace how NAT and PAT rewrite addresses and ports using a translation table.',
    'Use ping and traceroute and explain the ICMP messages behind them.',
    'Calculate fragment sizes, offsets and flags for a datagram crossing a smaller MTU.',
    'Write and shorten IPv6 addresses, compare ARP with NDP, and choose a transition method.',
  ],
  overviewVideoId: 'ch04-overview',
  sections: [
    {
      id: 'ipv4-header-format',
      title: 'The IPv4 datagram and its header',
      blocks: [
        {
          type: 'paragraph',
          text: 'The network layer carries packets from a source host to a destination host across many links. IPv4 calls each packet a **datagram**, and routers forward every datagram independently, with no connection set up first. The header is all a router reads, so its fields explain most of how IP behaves.',
        },
        {
          type: 'points',
          items: [
            '**Connectionless:** routers keep no per-flow state, and two datagrams of one transfer may take different paths.',
            '**Best effort:** IP may lose, duplicate or reorder datagrams. TCP or the application handles recovery.',
            '**Header size:** 20 bytes without options and 60 bytes at most.',
            '**Hop by hop work:** each router decrements TTL, updates the header checksum and builds a new link-layer frame.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch04-ipv4-header',
          title: 'IPv4 header field layout',
          caption: 'Each row is one 32-bit word. The first five rows form the fixed 20-byte header.',
          kind: 'block',
          mermaid: `flowchart TD
    subgraph W1["Bytes 0 to 3"]
        direction LR
        H1["Version 4 bits"] --- H2["IHL 4 bits"] --- H3["DSCP 6 bits"] --- H4["ECN 2 bits"] --- H5["Total Length 16 bits"]
    end
    subgraph W2["Bytes 4 to 7"]
        direction LR
        H6["Identification 16 bits"] --- H7["Flags 3 bits"] --- H8["Fragment Offset 13 bits"]
    end
    subgraph W3["Bytes 8 to 11"]
        direction LR
        H9["TTL 8 bits"] --- H10["Protocol 8 bits"] --- H11["Header Checksum 16 bits"]
    end
    subgraph W4["Bytes 12 to 15"]
        H12["Source Address 32 bits"]
    end
    subgraph W5["Bytes 16 to 19"]
        H13["Destination Address 32 bits"]
    end
    subgraph W6["Bytes 20 to 59, if present"]
        H14["Options and padding 0 to 40 bytes"]
    end
    W1 --> W2
    W2 --> W3
    W3 --> W4
    W4 --> W5
    W5 --> W6`,
        },
        {
          type: 'table',
          headers: ['Field', 'Size', 'Purpose'],
          rows: [
            ['Version', '4 bits', 'Always `4` for IPv4.'],
            ['IHL', '4 bits', 'Header length in 32-bit words. Range `5` to `15`, so 20 to 60 bytes.'],
            ['DSCP and ECN', '6 + 2 bits', 'Priority marking and congestion signal. They replaced the old Type of Service byte.'],
            ['Total Length', '16 bits', 'Header plus data in bytes. Maximum 65,535.'],
            ['Identification', '16 bits', 'Same value on all fragments of one datagram.'],
            ['Flags', '3 bits', 'Reserved `0`, DF (Do not Fragment) and MF (More Fragments).'],
            ['Fragment Offset', '13 bits', 'Position of this data in the original payload, in units of 8 bytes.'],
            ['TTL', '8 bits', 'Hop limit. Each router subtracts 1, and at 0 the packet is dropped.'],
            ['Protocol', '8 bits', 'Payload type: ICMP `1`, TCP `6`, UDP `17`, GRE `47`, ESP `50`, OSPF `89`.'],
            ['Header Checksum', '16 bits', 'Covers the header only. Updated at every hop because TTL changes.'],
            ['Source, Destination', '32 bits each', 'Original sender and final receiver. Routers leave them alone unless NAT is used.'],
            ['Options', '0 to 40 bytes', 'Rarely used today. Padded to a 32-bit boundary.'],
          ],
        },
        {
          type: 'callout',
          variant: 'remember',
          text: 'Three fields use three different units: **IHL** counts 32-bit words, **Total Length** counts bytes and **Fragment Offset** counts 8-byte blocks. Mixing these up is the most common header mistake.',
        },
        {
          type: 'callout',
          variant: 'formula',
          text: 'Header bytes = `IHL x 4`. Data bytes = `Total Length - (IHL x 4)`. For `IHL = 5` and `Total Length = 1500`, the header is 20 bytes and the data is 1480 bytes.',
        },
        {
          type: 'example',
          title: 'Decoding a captured header',
          steps: [
            'Captured bytes: `45 00 00 54 ab cd 40 00 40 01 b3 97 c0 a8 0a 8c 08 08 08 08`.',
            '`0x45`: Version 4 and IHL 5, so the header is 20 bytes.',
            '`0x00`: DSCP 0 and ECN 0, which is normal best-effort traffic.',
            '`0x0054`: Total Length is 84 bytes, so 64 bytes of data follow the header.',
            '`0x4000` after the ID `0xabcd`: binary `0100 0000 0000 0000`, so DF = 1, MF = 0 and offset = 0.',
            '`0x40` and `0x01`: TTL is 64 and Protocol is 1, which is ICMP.',
            "`0xb397`: checksum. Adding all 16-bit words with this field set to zero gives `0x24c66`. Wrapping the carry gives `0x4c68`, and its one's complement is `0xb397`.",
            '`c0 a8 0a 8c` is source `192.168.10.140`, and `08 08 08 08` is destination `8.8.8.8`.',
          ],
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'Operating systems start TTL at 64 (Linux, macOS) or 128 (Windows), and routers often use 255, so a received TTL hints at the sender and its distance. Office networks mark voice traffic with DSCP 46 (Expedited Forwarding) so switches queue it first. High-end routers update TTL and checksum in hardware at line rate.',
        },
      ],
    },
    {
      id: 'classful-cidr-subnetting',
      title: 'Classful addressing, CIDR and subnetting',
      videoId: 'ch04-ipv4-addressing-subnetting',
      blocks: [
        {
          type: 'paragraph',
          text: 'An IPv4 address is a 32-bit number written as four decimal octets, such as `192.168.10.140`. Each address has a **network part** that routers use and a **host part** that identifies one interface on that network. The history of IP addressing is the history of how the boundary between these two parts is chosen.',
        },
        {
          type: 'points',
          items: [
            '**Classful (1981):** the first bits of the address fixed the boundary at `/8`, `/16` or `/24`.',
            '**The problem:** a firm with 2,000 hosts needed a class B block of 65,534 hosts, which wasted most of it, and routing tables grew fast.',
            '**CIDR (1993):** any prefix length is allowed, written `/n`. The boundary now comes from the prefix, not the first bits.',
            '**Longest prefix match:** a router picks the matching route with the longest prefix, so `192.168.10.128/26` beats `192.168.10.0/24`, which beats `0.0.0.0/0`.',
          ],
        },
        {
          type: 'table',
          headers: ['Class', 'Leading bits', 'First octet', 'Default prefix', 'Networks', 'Usable hosts each'],
          rows: [
            ['A', '`0`', '1 to 126', '`/8`', '126', '16,777,214'],
            ['B', '`10`', '128 to 191', '`/16`', '16,384', '65,534'],
            ['C', '`110`', '192 to 223', '`/24`', '2,097,152', '254'],
            ['D', '`1110`', '224 to 239', 'None', 'Multicast', 'Not applicable'],
            ['E', '`1111`', '240 to 255', 'None', 'Reserved', 'Not applicable'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Subnetting borrows bits from the host part to make more, smaller networks. A mask marks the network bits with 1s, and a bitwise AND of address and mask gives the network address. In every subnet the all-zero host value is the network address and the all-one host value is the directed broadcast, so neither is given to a host.',
        },
        {
          type: 'diagram',
          id: 'ch04-subnetting-binary-split',
          title: 'Subnetting a /24 with a binary split',
          caption: 'Borrowing 2 bits from the last octet creates 4 subnets of 64 addresses. The ss bits select the subnet and the h bits select the host.',
          kind: 'working-diagram',
          mermaid: `flowchart TD
    N["Given 192.168.10.0/24, need 4 subnets"] --> B["Last octet starts as hhhhhhhh"]
    B --> C["Borrow 2 bits as 2 power 2 is 4"]
    C --> D["Last octet becomes ss hhhhhh"]
    D --> M["New mask /26 is 255.255.255.192"]
    M --> S0["ss 00 gives 192.168.10.0/26"]
    M --> S1["ss 01 gives 192.168.10.64/26"]
    M --> S2["ss 10 gives 192.168.10.128/26"]
    M --> S3["ss 11 gives 192.168.10.192/26"]
    S0 --> R0["Hosts .1 to .62, broadcast .63"]
    S1 --> R1["Hosts .65 to .126, broadcast .127"]
    S2 --> R2["Hosts .129 to .190, broadcast .191"]
    S3 --> R3["Hosts .193 to .254, broadcast .255"]`,
        },
        {
          type: 'table',
          headers: ['Prefix', 'Mask', 'Block size', 'Usable hosts'],
          rows: [
            ['`/24`', '`255.255.255.0`', '256', '254'],
            ['`/25`', '`255.255.255.128`', '128', '126'],
            ['`/26`', '`255.255.255.192`', '64', '62'],
            ['`/27`', '`255.255.255.224`', '32', '30'],
            ['`/28`', '`255.255.255.240`', '16', '14'],
            ['`/29`', '`255.255.255.248`', '8', '6'],
            ['`/30`', '`255.255.255.252`', '4', '2'],
            ['`/31`', '`255.255.255.254`', '2', '2, on point-to-point links only (RFC 3021)'],
            ['`/32`', '`255.255.255.255`', '1', '1, a single host route'],
          ],
        },
        {
          type: 'callout',
          variant: 'formula',
          text: 'Subnets = `2^n` for `n` borrowed bits. Usable hosts = `2^h - 2` for `h` host bits. Block size = `256 - mask octet`. Network = `IP AND mask`. Broadcast = network with all host bits set to 1.',
        },
        {
          type: 'example',
          title: 'Which subnet holds 192.168.10.140/26?',
          steps: [
            'Mask `/26` is `255.255.255.192`, so the last octet has 2 network bits and 6 host bits.',
            'Block size is `256 - 192 = 64`, so subnets start at `.0`, `.64`, `.128` and `.192`.',
            '`140` in binary is `10 001100`. AND with `11 000000` gives `10 000000`, which is `128`.',
            'The network is `192.168.10.128/26`, hosts run from `.129` to `.190`, and the broadcast is `.191`.',
          ],
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: 'When a question asks for hosts, subtract 2. When it asks for subnets, do not subtract: modern practice counts all `2^n` subnets. Some older texts use `2^n - 2`, so state your assumption in the answer.',
        },
        {
          type: 'paragraph',
          text: 'Hosts use the mask for one daily decision: is the destination on my own subnet? If yes, the frame goes straight to the destination. If no, it goes to the default gateway. The IP destination stays the final host in both cases, and only the destination MAC differs.',
        },
        {
          type: 'diagram',
          id: 'ch04-host-forwarding-decision',
          title: 'How a host chooses local delivery or the gateway',
          caption: 'Every host runs this decision before sending. ARP is used for the next hop, never for a remote destination.',
          kind: 'flowchart',
          mermaid: `flowchart TD
    A["Packet for destination IP D"] --> B["AND D with own subnet mask"]
    B --> C{"Result equals own network?"}
    C -->|Yes| E1["Next hop is D itself"]
    C -->|No| F{"Default gateway configured?"}
    F -->|No| G["Report network unreachable"]
    F -->|Yes| H["Next hop is default gateway"]
    E1 --> J{"Next hop MAC in ARP cache?"}
    H --> J
    J -->|Yes| L["Build frame with next hop MAC"]
    J -->|No| K["Broadcast ARP request for next hop"]
    K --> M{"ARP reply received?"}
    M -->|Yes| L
    M -->|No| N["Report host unreachable"]
    L --> P["Send frame, IP destination stays D"]`,
        },
        {
          type: 'command-lab',
          title: 'Reading your address and routes on Linux',
          command: 'ip -4 addr show eth0; ip route',
          output: `2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    inet 192.168.10.140/26 brd 192.168.10.191 scope global dynamic eth0
       valid_lft 85912sec preferred_lft 85912sec
default via 192.168.10.129 dev eth0 proto dhcp src 192.168.10.140 metric 100
192.168.10.128/26 dev eth0 proto kernel scope link src 192.168.10.140 metric 100`,
          explanation: [
            '`mtu 1500`: the largest IP packet this interface sends without fragmenting.',
            '`inet 192.168.10.140/26`: the host address and prefix, so the subnet is `192.168.10.128/26`.',
            '`brd 192.168.10.191`: the directed broadcast, with all 6 host bits set to 1.',
            '`dynamic` and `valid_lft`: the address came from DHCP and its lease has 85,912 seconds left.',
            '`default via 192.168.10.129`: everything off-subnet goes to this gateway.',
            '`192.168.10.128/26 dev eth0`: destinations in this prefix are reached directly, with no gateway.',
          ],
        },
        {
          type: 'troubleshoot',
          symptom: 'Two PCs on the same switch cannot ping each other. PC A is `192.168.10.60/26` and PC B is `192.168.10.70/26`.',
          checks: [
            'Compute both networks. PC A is in `192.168.10.0/26` and PC B is in `192.168.10.64/26`.',
            'Run `arp -a` on PC A. With no entry for PC B, the packet went towards the gateway instead.',
            'Check whether a router has an interface in each subnet and whether both PCs have a gateway set.',
          ],
          fix: 'Same switch does not mean same subnet. Put both PCs in one subnet by correcting the address or mask, or give each subnet a router interface.',
        },
      ],
    },
    {
      id: 'vlsm-route-aggregation',
      title: 'VLSM design and route aggregation',
      videoId: 'ch04-vlsm-office-design',
      blocks: [
        {
          type: 'paragraph',
          text: 'Fixed-length subnetting gives every subnet the same size, which wastes addresses when a 100-host LAN sits beside a 2-host router link. **Variable Length Subnet Masking (VLSM)** lets each subnet of one block use its own prefix length. Its reverse, **route aggregation**, merges many prefixes into one route so routing tables stay small.',
        },
        {
          type: 'points',
          items: [
            '**Step 1:** list the subnets and sort them from the largest host count to the smallest.',
            '**Step 2:** add 2 to each host count, for the network and broadcast addresses, and round up to a power of 2.',
            '**Step 3:** allocate from the start of the free space. Every block must start on a multiple of its own size.',
            '**Step 4:** record the free space that remains, for later growth.',
          ],
        },
        {
          type: 'table',
          headers: ['Subnet', 'Hosts needed', 'Block', 'Allocated', 'Usable range', 'Broadcast'],
          rows: [
            ['Engineering', '100', '128', '`192.168.20.0/25`', '`.1` to `.126`', '`.127`'],
            ['Sales', '50', '64', '`192.168.20.128/26`', '`.129` to `.190`', '`.191`'],
            ['Admin', '20', '32', '`192.168.20.192/27`', '`.193` to `.222`', '`.223`'],
            ['Servers', '10', '16', '`192.168.20.224/28`', '`.225` to `.238`', '`.239`'],
            ['Router link', '2', '4', '`192.168.20.240/30`', '`.241` to `.242`', '`.243`'],
            ['Free', 'None', '12', '`192.168.20.244` to `.255`', 'Growth', 'None'],
          ],
        },
        {
          type: 'diagram',
          id: 'ch04-vlsm-office',
          title: 'VLSM design for one office',
          caption: 'One /24 is divided into blocks of 128, 64, 32, 16 and 4 addresses. The core router is the gateway of each LAN.',
          kind: 'block',
          mermaid: `flowchart TD
    ER["Edge router .241"] --- LK["Link 192.168.20.240/30"]
    LK --- CR["Core router .242"]
    subgraph T1["LANs carved from 192.168.20.0/24"]
        EN["Engineering, 100 hosts"]
        EP["192.168.20.0/25, gateway .1"]
        SA["Sales, 50 hosts"]
        SP["192.168.20.128/26, gateway .129"]
        AD["Admin, 20 hosts"]
        AP["192.168.20.192/27, gateway .193"]
        SV["Servers, 10 hosts"]
        VP["192.168.20.224/28, gateway .225"]
        FR["Free 192.168.20.244 to .255"]
    end
    CR --- EN
    CR --- SA
    CR --- AD
    CR --- SV
    CR -.- FR
    EN --- EP
    SA --- SP
    AD --- AP
    SV --- VP`,
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: 'Allocate largest first. If a `/30` is placed at `.0`, a later `/25` must jump to its next boundary at `.128`, and the addresses `.4` to `.127` are left in a gap that only smaller subnets can use.',
        },
        {
          type: 'paragraph',
          text: 'Aggregation, also called supernetting, works in the opposite direction. If several networks share leading bits and together fill a power-of-2 block starting on its boundary, one shorter prefix can represent them all. ISPs use this so the rest of the Internet carries one route rather than thousands.',
        },
        {
          type: 'example',
          title: 'Aggregating four /24 networks',
          steps: [
            'Networks: `172.16.168.0/24`, `172.16.169.0/24`, `172.16.170.0/24` and `172.16.171.0/24`.',
            'Third octets in binary: `10101000`, `10101001`, `10101010` and `10101011`.',
            'The first 6 bits, `101010`, are common, so the prefix is `16 + 6 = 22` bits.',
            'Summary: `172.16.168.0/22`, mask `255.255.252.0`, which covers exactly `.168` to `.171`.',
            'On a Cisco router, `ip route 172.16.168.0 255.255.252.0 10.0.0.2` replaces four static routes.',
          ],
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'Cloud networks use the same method. An AWS VPC might hold `10.0.0.0/16`, divided into `/24` subnets per tier and availability zone. AWS reserves 5 addresses in every subnet, so a `/24` gives 251 usable. Data centre fabrics often use `/31` on router links, which saves half the addresses compared with `/30`.',
        },
        {
          type: 'case-study',
          title: 'A growing Sales team in the branch office',
          scenario: 'The branch uses the plan above. Sales grows from 50 to 90 hosts, which does not fit in its `/26` of 62 usable addresses.',
          steps: [
            'Check the free space. Only `192.168.20.244` to `.255` remains, so no `/25` is available inside this `/24`.',
            'Request `192.168.21.0/24` from the company plan and give Sales `192.168.21.0/25`, with 126 usable hosts.',
            'Add a router subinterface: `interface Gi0/0.30`, `encapsulation dot1Q 30`, `ip address 192.168.21.1 255.255.255.128`.',
            'Create VLAN 30 on the switches, add a DHCP scope for the new subnet, and move the Sales ports.',
            'Mark `192.168.20.128/26` as free, and advertise `192.168.20.0/23` to head office as one route covering both `/24` blocks.',
          ],
        },
      ],
    },
    {
      id: 'private-ranges-nat-pat',
      title: 'Private and public ranges, NAT and PAT',
      videoId: 'ch04-nat-home-router',
      blocks: [
        {
          type: 'paragraph',
          text: 'IPv4 has about 4.3 billion addresses, and most regional registries ran out of free pools during the 2010s. Two ideas stretched the supply: **private ranges** that any organisation may reuse internally, and **NAT**, which rewrites addresses at the boundary so private hosts can reach the public Internet.',
        },
        {
          type: 'table',
          headers: ['Range', 'Use', 'Routed on the Internet?'],
          rows: [
            ['`10.0.0.0/8`', 'Private, RFC 1918. 16,777,216 addresses.', 'No'],
            ['`172.16.0.0/12`', 'Private, RFC 1918. `172.16.0.0` to `172.31.255.255`.', 'No'],
            ['`192.168.0.0/16`', 'Private, RFC 1918. Common in homes.', 'No'],
            ['`100.64.0.0/10`', 'Shared space for ISP carrier-grade NAT, RFC 6598.', 'No'],
            ['`169.254.0.0/16`', 'Link-local, self-assigned when DHCP fails.', 'No'],
            ['`127.0.0.0/8`', 'Loopback. Stays inside the host.', 'No'],
            ['`224.0.0.0/4`', 'Multicast.', 'Only where multicast routing is enabled'],
            ['`192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`', 'Documentation only, RFC 5737.', 'No'],
          ],
        },
        {
          type: 'points',
          items: [
            '**Static NAT:** one private address maps to one public address permanently. Used for servers reachable from outside.',
            '**Dynamic NAT:** private hosts borrow a public address from a pool, one each. The pool limits concurrent users.',
            '**PAT (NAT overload):** many private hosts share one public address, separated by port numbers. Home routers do this.',
            '**Port forwarding:** a static PAT entry that sends an inbound public port to one private host.',
            '**Limits:** outside hosts cannot start connections without a forward rule, and protocols carrying IP addresses in their payload, such as FTP and SIP, need helpers.',
          ],
        },
        {
          type: 'paragraph',
          text: 'A PAT device identifies each flow by protocol, addresses and ports. Outbound, it rewrites the source address and source port. Inbound, it uses the destination port to find the mapping and reverses it. TCP and UDP checksums cover the IP addresses through a pseudo-header, so those are recalculated along with the IP checksum.',
        },
        {
          type: 'diagram',
          id: 'ch04-nat-translation',
          title: 'PAT translation on a home router',
          caption: 'Outbound packets create the mapping and inbound replies use it. The server only ever sees the public socket.',
          kind: 'working-flowchart',
          mermaid: `flowchart TD
    A["LAN host sends packet"] --> B["Source 192.168.1.10:51000"]
    B --> C{"Mapping in NAT table?"}
    C -->|No| D["Pick free port on 198.51.100.7"]
    D --> E["Store inside to outside mapping"]
    E --> F["Rewrite source to 198.51.100.7:51000"]
    C -->|Yes| F
    F --> G["Recompute IP and TCP checksums"]
    G --> H["Send to server 203.0.113.50:443"]
    H --> I["Reply to 198.51.100.7:51000"]
    I --> J{"Destination port in NAT table?"}
    J -->|Yes| K["Rewrite dest to 192.168.1.10:51000"]
    K --> L["Recompute checksums and forward"]
    L --> M["LAN host receives reply"]
    J -->|No| N["Drop unless a port forward exists"]`,
        },
        {
          type: 'command-lab',
          title: 'Configuring and verifying PAT on a Cisco router',
          command: `configure terminal
access-list 10 permit 192.168.1.0 0.0.0.255
interface GigabitEthernet0/0
 ip nat inside
interface GigabitEthernet0/1
 ip nat outside
exit
ip nat inside source list 10 interface GigabitEthernet0/1 overload
end
show ip nat translations`,
          output: `Pro  Inside global        Inside local        Outside local      Outside global
tcp  198.51.100.7:51000   192.168.1.10:51000  203.0.113.50:443   203.0.113.50:443
tcp  198.51.100.7:1024    192.168.1.11:51000  203.0.113.50:443   203.0.113.50:443
udp  198.51.100.7:53211   192.168.1.12:53211  8.8.8.8:53         8.8.8.8:53`,
          explanation: [
            '`access-list 10` selects which inside sources may be translated. `0.0.0.255` is a wildcard mask, not a subnet mask.',
            '`ip nat inside` and `ip nat outside` mark the LAN-facing and WAN-facing interfaces.',
            '`overload` turns on PAT, so all hosts share the address of `GigabitEthernet0/1`.',
            'Inside local is the real private socket. Inside global is how the outside world sees that host.',
            'Row 1 keeps port `51000` because it is free. Row 2 has the same inside port on another host, so IOS assigns `1024` to keep the flows apart.',
            'Row 3 is a UDP DNS query. Both outside columns match because the outside address is not translated.',
          ],
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'A home router runs PAT and DHCP together. Many ISPs, especially mobile ones, add **carrier-grade NAT** using `100.64.0.0/10`, so one public address serves many customers. In the cloud, a NAT gateway lets private subnets start outbound connections while staying unreachable from outside. One public address offers about 64,000 ports per protocol.',
        },
        {
          type: 'mini-lab',
          title: 'Compare your private and public identities',
          goal: 'See PAT working by comparing the address your laptop holds with the one the Internet sees.',
          steps: [
            'Run `ipconfig` or `ip addr` and note your IPv4 address.',
            'Run `curl -4 ifconfig.me` to print the address that a public web server sees.',
            'Open the router status page and note its WAN address.',
          ],
          expected: 'Your laptop shows an RFC 1918 address. If the router WAN address matches the `curl` result, there is one layer of NAT. If the WAN address is in `100.64.0.0/10` or another private range, your ISP adds a second layer.',
        },
        {
          type: 'troubleshoot',
          symptom: 'A home camera server has a port forward on the router, yet it cannot be reached from outside.',
          checks: [
            'Compare the router WAN address with the `curl -4 ifconfig.me` result. A `100.64.x.x` WAN address means CGNAT.',
            'Confirm that the server has a reserved DHCP address, so the rule still points at the right host.',
            'Test from mobile data, because many routers do not support hairpin NAT from inside the LAN.',
            'Run `netstat -an` on the server and confirm that the service is listening on the expected port.',
          ],
          fix: 'Correct the rule and reserve the host address. Under CGNAT, ask the ISP for a public address, use IPv6, or use an outbound VPN tunnel.',
        },
      ],
    },
    {
      id: 'icmp-ping-traceroute',
      title: 'ICMP, ping and traceroute',
      videoId: 'ch04-icmp-ping-traceroute',
      blocks: [
        {
          type: 'paragraph',
          text: 'IP has no way to report problems by itself, so every IP implementation also includes **ICMP**. Routers and hosts use it to report errors and to answer diagnostic queries. ICMP messages travel inside IP datagrams with Protocol value `1`, and ICMP is treated as part of the network layer.',
        },
        {
          type: 'points',
          items: [
            '**Error messages** report a problem with a datagram. They carry its IP header and at least the first 8 bytes of its data, so the sender can match the error to a flow.',
            '**Query messages** ask and answer, such as the Echo Request and Echo Reply used by `ping`.',
            '**No errors about errors:** ICMP errors are not sent about other ICMP errors, about broadcast or multicast packets, or about non-first fragments. This prevents message storms.',
          ],
        },
        {
          type: 'table',
          headers: ['Type', 'Code', 'Name', 'Typical cause'],
          rows: [
            ['`8`', '`0`', 'Echo Request', 'Sent by `ping`.'],
            ['`0`', '`0`', 'Echo Reply', 'Answer to `ping`.'],
            ['`3`', '`0`', 'Network Unreachable', 'A router has no route.'],
            ['`3`', '`1`', 'Host Unreachable', 'The last router cannot reach the host, often an ARP failure.'],
            ['`3`', '`3`', 'Port Unreachable', 'No process is listening on that UDP port.'],
            ['`3`', '`4`', 'Fragmentation Needed', 'Packet is larger than the MTU and has DF set.'],
            ['`5`', '`1`', 'Redirect', 'A better next hop exists on the same subnet.'],
            ['`11`', '`0`', 'TTL Exceeded', 'TTL reached 0 in transit. Used by traceroute.'],
            ['`11`', '`1`', 'Reassembly Time Exceeded', 'Fragments did not all arrive at the destination.'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Traceroute uses TTL expiry to make each router reveal itself. It sends probes with TTL 1, then 2, then 3, and the router where TTL reaches 0 returns ICMP Type 11. The trace stops when the destination itself answers.',
        },
        {
          type: 'diagram',
          id: 'ch04-traceroute-sequence',
          title: 'Linux traceroute using TTL and ICMP',
          caption: 'Each round reaches one hop further. Replies are drawn directly but are routed back through the network like any other packet.',
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant H as Host
    participant R1 as Router 1
    participant R2 as Router 2
    participant D as Destination
    H->>R1: UDP probe TTL=1
    Note over R1: TTL reaches 0, probe dropped
    R1-->>H: ICMP Type 11 Time Exceeded
    H->>R1: UDP probe TTL=2
    R1->>R2: Forwarded with TTL=1
    Note over R2: TTL reaches 0, probe dropped
    R2-->>H: ICMP Type 11 Time Exceeded
    H->>R1: UDP probe TTL=3
    R1->>R2: Forwarded with TTL=2
    R2->>D: Forwarded with TTL=1
    Note over D: No process on this high UDP port
    D-->>H: ICMP Type 3 Code 3 Port Unreachable
    Note over H: Destination answered, trace stops`,
        },
        {
          type: 'command-lab',
          title: 'Testing reachability with ping',
          command: 'ping -c 4 8.8.8.8',
          output: `PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
64 bytes from 8.8.8.8: icmp_seq=1 ttl=117 time=14.2 ms
64 bytes from 8.8.8.8: icmp_seq=2 ttl=117 time=13.8 ms
64 bytes from 8.8.8.8: icmp_seq=3 ttl=117 time=14.6 ms
64 bytes from 8.8.8.8: icmp_seq=4 ttl=117 time=13.9 ms

--- 8.8.8.8 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3005ms
rtt min/avg/max/mdev = 13.800/14.125/14.600/0.311 ms`,
          explanation: [
            '`56(84) bytes`: 56 data bytes, plus the 8-byte ICMP header and 20-byte IP header, make 84.',
            '`64 bytes from`: the reply size without the IP header, which is 56 + 8.',
            '`icmp_seq`: the sequence number. A gap means a lost reply.',
            '`ttl=117`: TTL left in the reply. The next common start value is 128, which suggests about 11 hops on the return path.',
            '`time`: round-trip time for one request and its reply.',
            'The summary shows 4 sent, 4 received and `0% packet loss`. The average, `14.125` ms, is the mean of the four times.',
          ],
        },
        {
          type: 'command-lab',
          title: 'Mapping the path with traceroute',
          command: 'traceroute -n 8.8.8.8',
          output: `traceroute to 8.8.8.8 (8.8.8.8), 30 hops max, 60 byte packets
 1  192.168.1.1  1.214 ms  1.102 ms  1.087 ms
 2  100.64.12.1  8.341 ms  8.298 ms  8.410 ms
 3  * * *
 4  203.0.113.9  11.842 ms  12.031 ms  11.976 ms
 5  198.51.100.33  13.511 ms  13.402 ms  13.688 ms
 6  8.8.8.8  14.217 ms  14.089 ms  14.156 ms`,
          explanation: [
            'The first line gives the 30-hop limit and probe size. `-n` skips reverse DNS lookups.',
            'Each numbered line is one TTL value, with three probes and three round-trip times.',
            'Hop 1, `192.168.1.1`, is the home router.',
            'Hop 2, `100.64.12.1`, is in the shared CGNAT range, so this ISP uses carrier-grade NAT.',
            'Hop 3 shows `* * *`: this router sent no ICMP reply, often by policy. Later hops answer, so forwarding through it works.',
            'Hop 6 is the destination. Its Port Unreachable reply ends the trace.',
          ],
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: 'Linux `traceroute` sends UDP probes to high ports, starting at `33434`, and ends on ICMP Port Unreachable. Windows `tracert` sends ICMP Echo Requests and ends on Echo Reply. Both rely on TTL Exceeded for the hops between.',
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'Cloud and enterprise firewalls often drop ICMP Echo, so a failed `ping` does not prove that a host is down. Test the real service with `curl` or `nc`. Blocking all ICMP is a mistake, because it also blocks the Type 3 Code 4 messages that path MTU discovery needs.',
        },
        {
          type: 'wireshark',
          filter: 'icmp || (udp.dstport >= 33434 && udp.dstport <= 33534)',
          whatToLook: [
            'Run tracert or traceroute while capturing. Probes leave with IP TTL 1, then 2, then 3.',
            'Each TTL Exceeded reply has Type 11 Code 0, and its source IP is the router at that hop.',
            'Expand the payload of a Type 11 message to see the original IP header and first 8 bytes.',
            'Match each Echo Request to its Echo Reply using the Identifier and Sequence Number fields.',
          ],
        },
      ],
    },
    {
      id: 'fragmentation-and-mtu',
      title: 'Fragmentation and path MTU',
      blocks: [
        {
          type: 'paragraph',
          text: 'Every link has a **Maximum Transmission Unit (MTU)**, the largest IP packet it can carry in one frame. Ethernet gives 1500 bytes. When a datagram is larger than the next MTU, an IPv4 router may split it into **fragments**, and only the final destination joins them back together.',
        },
        {
          type: 'points',
          items: [
            '**Identification:** all fragments copy the same ID, so the receiver can group them.',
            '**MF flag:** `1` on every fragment except the last, which has `0`.',
            '**Fragment Offset:** where this data sits in the original payload, in 8-byte units. So every fragment except the last must carry a multiple of 8 data bytes.',
            '**Header cost:** each fragment gets its own IP header, so overhead grows.',
            '**Reassembly:** done only at the destination. If one fragment is lost, the whole datagram is discarded after a timeout.',
          ],
        },
        {
          type: 'example',
          title: 'A 4000-byte datagram crossing an MTU of 1500',
          steps: [
            'Total Length is 4000 with a 20-byte header, so the data is 3980 bytes.',
            'Each fragment can hold `1500 - 20 = 1480` data bytes. `1480 / 8 = 185`, a whole number, so 1480 is allowed.',
            'Fragment 1 carries bytes 0 to 1479, fragment 2 carries bytes 1480 to 2959, and fragment 3 carries the last 1020 bytes, 2960 to 3979.',
            'Offsets are `0 / 8 = 0`, `1480 / 8 = 185` and `2960 / 8 = 370`.',
          ],
        },
        {
          type: 'table',
          headers: ['Fragment', 'Data bytes', 'Total Length', 'Offset field', 'MF'],
          rows: [
            ['1', '1480', '1500', '0', '1'],
            ['2', '1480', '1500', '185', '1'],
            ['3', '1020', '1040', '370', '0'],
          ],
        },
        {
          type: 'callout',
          variant: 'formula',
          text: 'Data per fragment = `floor((MTU - header) / 8) x 8`. Offset = `data bytes sent before this fragment / 8`. Extra bytes on the wire = `(fragments - 1) x header`.',
        },
        {
          type: 'paragraph',
          text: 'Modern networks avoid fragmentation because it costs router effort and makes loss worse. In **path MTU discovery**, the sender sets DF = 1. A router that cannot forward the packet drops it and returns ICMP Type 3 Code 4 with the next-hop MTU, and the sender then uses a smaller size.',
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'Home PPPoE links have an MTU of 1492, VXLAN adds 50 bytes of overhead, and data centres often run jumbo frames of 9000 bytes. Edge routers commonly clamp TCP segment size, for example `ip tcp adjust-mss 1452` on a PPPoE interface, so that TCP never sends packets that need fragmenting.',
        },
        {
          type: 'mini-lab',
          title: 'Find the path MTU with ping',
          goal: 'Measure the largest packet that crosses your path without fragmentation.',
          steps: [
            'On Windows, run `ping -f -l 1472 8.8.8.8`. On Linux, run `ping -M do -s 1472 -c 2 8.8.8.8`.',
            'Note the arithmetic: 1472 data + 8 ICMP + 20 IP = 1500 bytes.',
            'Repeat with `1473`, which makes a 1501-byte packet.',
            'If `1472` fails, lower the size until replies return, and add 28 to get the path MTU.',
          ],
          expected: 'On plain Ethernet, `1472` succeeds and `1473` fails with `Packet needs to be fragmented but DF set` on Windows or `message too long` on Linux. On PPPoE, the largest working size is usually 1464, for a path MTU of 1492.',
        },
        {
          type: 'wireshark',
          filter: 'ip.flags.mf == 1 || ip.frag_offset > 0',
          whatToLook: [
            'Create fragments with ping -s 4000 8.8.8.8 on Linux or ping -l 4000 8.8.8.8 on Windows.',
            'All fragments of one ping share one Identification value.',
            'Wireshark shows the offset in bytes, so a displayed 1480 is the value 185 on the wire.',
            'The last fragment has More Fragments cleared and a smaller Total Length.',
          ],
        },
        {
          type: 'troubleshoot',
          symptom: 'After a VPN is enabled, `ping` and small pages work, but large downloads and some HTTPS sites hang.',
          checks: [
            'Test with DF set: `ping -M do -s 1472 198.51.100.20`, then lower the size until replies return.',
            'Add 28 to the largest working size to get the path MTU, and compare it with the tunnel MTU in `ip link`.',
            'Check whether a firewall drops ICMP Type 3 Code 4. If so, the sender never learns the limit, which is called a PMTUD black hole.',
          ],
          fix: 'Allow ICMP Type 3 Code 4, lower the tunnel MTU, or clamp TCP MSS with `ip tcp adjust-mss` on Cisco or a TCPMSS rule on Linux.',
        },
      ],
    },
    {
      id: 'ipv6-addressing-transition',
      title: 'IPv6 addressing and transition',
      videoId: 'ch04-ipv6-basics',
      blocks: [
        {
          type: 'paragraph',
          text: 'IPv6 replaces the 32-bit address with a 128-bit address, giving about 3.4 x 10^38 addresses. It is more than a larger space: the header is simpler, NAT is no longer needed for address sharing, and hosts can configure their own addresses.',
        },
        {
          type: 'points',
          items: [
            '**Format:** eight groups of four hex digits, separated by colons.',
            '**Rule 1:** drop leading zeros in a group, so `0db8` becomes `db8`.',
            '**Rule 2:** replace one longest run of all-zero groups with `::`, used only once per address.',
            '**Prefix:** written `/n`. A LAN is almost always a `/64`, leaving 64 bits for the interface ID.',
            '**No broadcast:** IPv6 uses multicast instead.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch04-ipv6-structure',
          title: 'IPv6 global unicast address structure',
          caption: 'The common 48 + 16 + 64 split, shown with a documentation address and the party that assigns each part.',
          kind: 'block',
          mermaid: `flowchart TD
    subgraph S1["Global unicast address, 128 bits"]
        direction LR
        G1["Global routing prefix 48 bits"] --- G2["Subnet ID 16 bits"] --- G3["Interface ID 64 bits"]
    end
    subgraph S2["Example 2001:db8:acad:12::a/64"]
        direction LR
        X1["2001:0db8:acad"] --- X2["0012"] --- X3["0000:0000:0000:000a"]
    end
    subgraph S3["Who assigns each part"]
        direction LR
        A1["RIR and ISP assign prefix"] --- A2["Site admin picks subnet"] --- A3["Host by SLAAC, DHCPv6 or manual"]
    end
    S1 --> S2
    S2 --> S3`,
        },
        {
          type: 'table',
          headers: ['Type', 'Prefix', 'Scope and use'],
          rows: [
            ['Global unicast', '`2000::/3`', 'Routable on the Internet.'],
            ['Link-local', '`fe80::/10`', 'One link only. Every IPv6 interface has one, and NDP uses it.'],
            ['Unique local', '`fc00::/7`, in practice `fd00::/8`', 'Private within a site, similar to RFC 1918.'],
            ['Multicast', '`ff00::/8`', '`ff02::1` is all nodes and `ff02::2` is all routers on the link.'],
            ['Loopback', '`::1/128`', 'Same role as `127.0.0.1`.'],
            ['Unspecified', '`::/128`', 'Source address before a host has one.'],
            ['Documentation', '`2001:db8::/32`', 'Examples only.'],
          ],
        },
        {
          type: 'example',
          title: 'Shortening an address and building an EUI-64 interface ID',
          steps: [
            'Start with `2001:0db8:0000:0000:0008:0000:0000:417a`.',
            'Drop leading zeros: `2001:db8:0:0:8:0:0:417a`.',
            'Two zero runs tie, so compress the first: `2001:db8::8:0:0:417a`.',
            'For EUI-64, split MAC `00:1a:2b:3c:4d:5e` in half and insert `ff:fe`: `00:1a:2b:ff:fe:3c:4d:5e`.',
            'Flip the seventh bit of the first byte, so `00` becomes `02`. The interface ID is `021a:2bff:fe3c:4d5e`.',
          ],
        },
        {
          type: 'table',
          headers: ['Feature', 'IPv4', 'IPv6'],
          rows: [
            ['Address size', '32 bits', '128 bits'],
            ['Header', '20 to 60 bytes', '40 bytes fixed, plus extension headers'],
            ['Header checksum', 'Yes', 'None, left to link and transport layers'],
            ['Hop counter and payload type', 'TTL, Protocol', 'Hop Limit, Next Header'],
            ['Fragmentation', 'Source or routers', 'Source only, with a minimum link MTU of 1280 bytes'],
            ['Host configuration', 'DHCP or manual', 'SLAAC, DHCPv6 or manual'],
            ['Address resolution', 'ARP', 'NDP'],
          ],
        },
        {
          type: 'points',
          items: [
            '**Dual stack:** hosts and routers run both protocols. DNS returns A and AAAA records. This is the most widely deployed method.',
            '**Tunnelling:** IPv6 packets ride inside IPv4 across IPv4-only sections, with Protocol value `41` for 6in4. Older automatic forms such as 6to4 are deprecated.',
            '**Translation:** NAT64 with DNS64 lets IPv6-only clients reach IPv4-only servers, using the prefix `64:ff9b::/96`.',
            '**464XLAT:** a small translator on the phone and NAT64 in the carrier network keep IPv4-only apps working on IPv6-only mobile networks.',
          ],
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'An ISP typically delegates a `/56` or `/60` to a home router with DHCPv6 Prefix Delegation, and a business site often gets a `/48`, which holds 65,536 `/64` subnets. Mobile carriers commonly run IPv6-only access with 464XLAT. In AWS, a VPC gets a `/56` and each subnet a `/64`.',
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: 'An address with `::` twice is invalid, because the length of each zero run could not be determined. Also remember that IPv6 has no broadcast address and that routers never fragment IPv6 packets.',
        },
      ],
    },
    {
      id: 'arp-ndp-dhcp-link',
      title: 'ARP versus NDP, and the DHCP link',
      blocks: [
        {
          type: 'paragraph',
          text: 'An address plan only works if hosts can obtain an address and find the MAC address of their next hop. IPv4 uses **DHCP** for the first job and **ARP** for the second. IPv6 folds address resolution and router discovery into **NDP**, which runs over ICMPv6.',
        },
        {
          type: 'table',
          headers: ['Aspect', 'ARP (IPv4)', 'NDP (IPv6)'],
          rows: [
            ['Carried in', 'Ethernet directly, EtherType `0x0806`', 'ICMPv6 inside IPv6, Next Header `58`'],
            ['Request', 'ARP Request, opcode 1', 'Neighbor Solicitation, Type 135'],
            ['Reply', 'ARP Reply, opcode 2', 'Neighbor Advertisement, Type 136'],
            ['Request sent to', 'Broadcast `ff:ff:ff:ff:ff:ff`', 'Solicited-node multicast `ff02::1:ffXX:XXXX`'],
            ['Router discovery', 'None, so DHCP or manual setup', 'Router Solicitation 133, Router Advertisement 134'],
            ['Duplicate check', 'Gratuitous or probe ARP', 'Duplicate Address Detection using Type 135'],
            ['Switch protection', 'Dynamic ARP Inspection', 'RA Guard and NDP inspection'],
          ],
        },
        {
          type: 'diagram',
          id: 'ch04-arp-ndp-exchange',
          title: 'Address resolution in ARP and NDP',
          caption: 'Both ask for a MAC address, but NDP disturbs fewer hosts and also finds routers and prefixes.',
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant A as Host A
    participant B as Host B
    participant R as Router
    Note over A,B: IPv4 address resolution
    A->>B: ARP Request, broadcast to whole LAN
    B-->>A: ARP Reply, unicast with MAC of B
    Note over A,B: IPv6 address resolution
    A->>B: Neighbor Solicitation to solicited-node group
    B-->>A: Neighbor Advertisement with MAC of B
    Note over A,R: IPv6 router discovery
    A->>R: Router Solicitation to all-routers group
    R-->>A: Router Advertisement with prefix and gateway`,
        },
        {
          type: 'command-lab',
          title: 'Reading the ARP cache on Windows',
          command: 'arp -a',
          output: `Interface: 192.168.10.140 --- 0xc
  Internet Address      Physical Address      Type
  192.168.10.129        00-1a-2b-3c-4d-5e     dynamic
  192.168.10.150        00-50-56-c0-00-08     dynamic
  192.168.10.191        ff-ff-ff-ff-ff-ff     static
  224.0.0.22            01-00-5e-00-00-16     static
  255.255.255.255       ff-ff-ff-ff-ff-ff     static`,
          explanation: [
            '`Interface: 192.168.10.140 --- 0xc`: the cache is per interface, and `0xc` is its index.',
            '`192.168.10.129`, `dynamic`: the default gateway, learned by ARP. The entry ages out if unused.',
            '`192.168.10.150`: another host on the same subnet.',
            '`192.168.10.191` and `255.255.255.255`: broadcast addresses, fixed to the all-ones MAC.',
            '`224.0.0.22`: a multicast address. These map to MACs that begin with `01-00-5e`.',
            'A remote server such as `8.8.8.8` never appears, because ARP resolves only next hops on the link. On Linux, `ip -6 neigh` shows the NDP cache.',
          ],
        },
        {
          type: 'callout',
          variant: 'remember',
          text: 'To reach a remote host, a device resolves the MAC address of its **gateway**, not of the remote host. MAC addresses change at every router, and the IP source and destination stay the same, unless NAT is used.',
        },
        {
          type: 'points',
          items: [
            '**DORA:** DHCP assigns addresses through Discover, Offer, Request and Acknowledge, over UDP ports 67 (server) and 68 (client).',
            '**What it delivers:** address, mask, default gateway, DNS servers and lease time.',
            '**Relay:** broadcasts do not cross routers, so each LAN gateway needs `ip helper-address` pointing at the central server.',
            '**Lease timers:** the client renews at 50 percent of the lease and rebinds at 87.5 percent.',
            '**Link to subnetting:** a scope must match the plan. For `192.168.20.128/26`, the scope is `.130` to `.190`, with gateway `.129`.',
            '**IPv6:** SLAAC builds an address from the Router Advertisement prefix, and DHCPv6 is optional.',
          ],
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'Office switches combine DHCP Snooping with Dynamic ARP Inspection to stop rogue servers and ARP spoofing, and they use RA Guard to block false IPv6 routers. In the cloud, the provider usually handles ARP and DHCP inside its virtual network, so a VM still sees normal behaviour with no real broadcast domain.',
        },
        {
          type: 'wireshark',
          filter: 'arp || icmpv6.type == 135 || icmpv6.type == 136',
          whatToLook: [
            'ARP Request: destination MAC is ff:ff:ff:ff:ff:ff, and the Info column reads Who has this IP.',
            'ARP Reply: unicast back to the asker, with the sender MAC filled in.',
            'Neighbor Solicitation: destination is an ff02::1:ff group, with a MAC beginning 33:33:ff.',
            'Neighbor Advertisement: carries the target link-layer address option.',
          ],
        },
        {
          type: 'troubleshoot',
          symptom: 'A laptop shows `169.254.23.7` and cannot reach anything beyond its own link.',
          checks: [
            'The `169.254.0.0/16` range means DHCP failed and the host self-assigned an address (APIPA).',
            'Check the cable or Wi-Fi association, and that the switch port is in the right VLAN.',
            'Run `ipconfig /release` then `ipconfig /renew`, and watch for DHCP traffic in Wireshark.',
            'On a routed LAN, check that the gateway has `ip helper-address` and that the scope has free addresses.',
          ],
          fix: 'Restore the path to the DHCP server, correct the VLAN or relay setting, or enlarge an exhausted scope. Then renew the lease.',
        },
      ],
    },
  ],
  flashcards: [
    { front: 'What does the IHL field count?', back: 'The IPv4 header length in 32-bit words. IHL 5 means 20 bytes and IHL 15 means 60 bytes.' },
    { front: 'Why is the IPv4 checksum updated at each router?', back: 'Each router decrements TTL, which changes the header, and the checksum covers the header.' },
    { front: 'How is a network address found from an IP and a mask?', back: 'Take the bitwise AND of the IP address and the mask.' },
    { front: 'How many usable hosts does a /27 have?', back: '5 host bits, so 2^5 - 2 = 30 usable hosts.' },
    { front: 'List the RFC 1918 private ranges.', back: '10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16.' },
    { front: 'In what order does VLSM allocate subnets?', back: 'Largest first, with each block starting on a multiple of its own size.' },
    { front: 'How does PAT differ from basic NAT?', back: 'PAT also rewrites port numbers, so many private hosts can share one public address.' },
    { front: 'What does a WAN address in 100.64.0.0/10 tell you?', back: 'The ISP uses carrier-grade NAT, so inbound port forwarding from the Internet will not work.' },
    { front: 'How does traceroute discover each hop?', back: 'It raises TTL one step at a time, and the router where TTL reaches 0 returns ICMP Type 11.' },
    { front: 'Which ICMP message does path MTU discovery depend on?', back: 'Type 3 Code 4, Fragmentation Needed, which carries the next-hop MTU.' },
    { front: 'Where are IPv4 fragments reassembled?', back: 'Only at the final destination, never at intermediate routers.' },
    { front: 'What is the usual structure of an IPv6 global unicast address?', back: '48-bit global routing prefix, 16-bit subnet ID and 64-bit interface ID.' },
    { front: 'Which NDP messages replace the ARP Request and Reply?', back: 'Neighbor Solicitation, Type 135, and Neighbor Advertisement, Type 136.' },
  ],
  quiz: [
    {
      id: 'ch04-q1',
      question: 'What is the minimum size of an IPv4 header?',
      options: ['8 bytes', '20 bytes', '40 bytes', '60 bytes'],
      answerIndex: 1,
      explanation: 'With IHL = 5 and no options, the header is 5 x 4 = 20 bytes. 60 bytes is the maximum, and 40 bytes is the fixed IPv6 header.',
      difficulty: 'easy',
      topic: 'IPv4 header',
    },
    {
      id: 'ch04-q2',
      question: 'Which of these is a private RFC 1918 address?',
      options: ['172.32.10.1', '192.169.1.1', '10.200.5.9', '11.0.0.1'],
      answerIndex: 2,
      explanation: '10.0.0.0/8 is private. The 172 private range ends at 172.31.255.255, and 192.169 and 11.0 are outside the private ranges.',
      difficulty: 'easy',
      topic: 'NAT and private ranges',
    },
    {
      id: 'ch04-q3',
      question: 'The Fragment Offset field counts in units of:',
      options: ['8 bytes', '1 byte', '4 bytes', '20 bytes'],
      answerIndex: 0,
      explanation: 'The 13-bit offset is measured in 8-byte blocks, which lets it cover the full 65,535-byte range of Total Length.',
      difficulty: 'easy',
      topic: 'Fragmentation',
    },
    {
      id: 'ch04-q4',
      question: 'Which ICMP message does the ping command send?',
      options: ['Type 3 Destination Unreachable', 'Type 11 Time Exceeded', 'Type 0 Echo Reply', 'Type 8 Echo Request'],
      answerIndex: 3,
      explanation: 'Ping sends Type 8 Echo Request, and the target answers with Type 0 Echo Reply.',
      difficulty: 'easy',
      topic: 'ICMP',
    },
    {
      id: 'ch04-q5',
      question: 'How long is an IPv6 address?',
      options: ['32 bits', '64 bits', '128 bits', '256 bits'],
      answerIndex: 2,
      explanation: 'An IPv6 address has 128 bits. The 64-bit figure is the usual size of the interface ID.',
      difficulty: 'easy',
      topic: 'IPv6',
    },
    {
      id: 'ch04-q6',
      question: 'Which protocol finds the MAC address for an IPv4 next hop on the local link?',
      options: ['ARP', 'DNS', 'DHCP', 'ICMP'],
      answerIndex: 0,
      explanation: 'ARP maps an IPv4 address to a MAC address on the local link. DNS maps names to IP addresses, and DHCP assigns IP addresses.',
      difficulty: 'easy',
      topic: 'ARP and NDP',
    },
    {
      id: 'ch04-q7',
      question: 'What is the network address of a host at 10.50.130.7/18?',
      options: ['10.50.0.0', '10.50.128.0', '10.50.130.0', '10.50.192.0'],
      answerIndex: 1,
      explanation: '/18 has mask 255.255.192.0, so the block size is 64 in the third octet. 130 falls in the block from 128 to 191, giving 10.50.128.0.',
      difficulty: 'medium',
      topic: 'Subnetting and CIDR',
    },
    {
      id: 'ch04-q8',
      question: 'In a VLSM plan, which is the longest prefix that still supports a LAN of 50 hosts?',
      options: ['/27', '/25', '/26', '/28'],
      answerIndex: 2,
      explanation: '50 hosts + 2 reserved = 52 addresses, which rounds up to 64, so /26 with 62 usable hosts. /27 has only 30, and /25 works but wastes space.',
      difficulty: 'medium',
      topic: 'Subnetting and CIDR',
    },
    {
      id: 'ch04-q9',
      question: 'Which single route exactly summarises 192.168.4.0/24, 192.168.5.0/24, 192.168.6.0/24 and 192.168.7.0/24?',
      options: ['192.168.4.0/23', '192.168.0.0/21', '192.168.4.0/24', '192.168.4.0/22'],
      answerIndex: 3,
      explanation: '4 is 00000100 and 7 is 00000111, so 6 bits of the third octet are common. 16 + 6 gives /22, covering exactly 4 to 7.',
      difficulty: 'medium',
      topic: 'Subnetting and CIDR',
    },
    {
      id: 'ch04-q10',
      question: 'What allows PAT to serve many private hosts through one public address?',
      options: [
        'It gives each host its own public address from a pool',
        'It tracks each flow by rewriting the source port as well as the source address',
        'It rewrites only the destination MAC address',
        'It fragments packets so that they share the public link',
      ],
      answerIndex: 1,
      explanation: 'PAT distinguishes flows by port. Replies arrive on a unique public port, which maps back to the correct private socket. Using a pool describes dynamic NAT.',
      difficulty: 'medium',
      topic: 'NAT and private ranges',
    },
    {
      id: 'ch04-q11',
      question: 'An IPv4 packet has IHL = 6 and Total Length = 1500. How many bytes of data does it carry?',
      options: ['1494 bytes', '1480 bytes', '1476 bytes', '1500 bytes'],
      answerIndex: 2,
      explanation: 'The header is 6 x 4 = 24 bytes, so the data is 1500 - 24 = 1476 bytes. Subtracting 6 ignores the 4-byte unit of IHL.',
      difficulty: 'medium',
      topic: 'IPv4 header',
    },
    {
      id: 'ch04-q12',
      question: 'Which message tells Linux traceroute, using default UDP probes, that it has reached the destination?',
      options: ['ICMP Type 11 Time Exceeded', 'ICMP Type 0 Echo Reply', 'TCP RST from the destination', 'ICMP Type 3 Code 3 Port Unreachable'],
      answerIndex: 3,
      explanation: 'The UDP probes target an unused high port, so the destination returns Port Unreachable. Type 11 comes from routers on the way, and Echo Reply ends Windows tracert.',
      difficulty: 'medium',
      topic: 'ICMP',
    },
    {
      id: 'ch04-q13',
      question: 'A 2000-byte IPv4 datagram with a 20-byte header crosses a link with MTU 620. How many fragments result, and what is the offset field of the last one?',
      options: ['4 fragments, last offset 225', '3 fragments, last offset 150', '4 fragments, last offset 1800', '4 fragments, last offset 180'],
      answerIndex: 0,
      explanation: 'Data is 1980 bytes and each fragment holds 600, a multiple of 8. That gives 600, 600, 600 and 180 bytes. The last fragment starts at byte 1800, and 1800 / 8 = 225.',
      difficulty: 'hard',
      topic: 'Fragmentation',
    },
    {
      id: 'ch04-q14',
      question: 'What is the EUI-64 interface ID for MAC address 00:1A:2B:3C:4D:5E?',
      options: ['001a:2bff:fe3c:4d5e', '021a:2bff:fe3c:4d5e', '021a:2bfe:ff3c:4d5e', '001a:2bfe:ff3c:4d5e'],
      answerIndex: 1,
      explanation: 'Insert ff:fe in the middle of the MAC, then flip the seventh bit of the first byte so that 00 becomes 02. The result is 021a:2bff:fe3c:4d5e.',
      difficulty: 'hard',
      topic: 'IPv6',
    },
    {
      id: 'ch04-q15',
      question: 'Host A (192.168.1.10/24, gateway 192.168.1.1) sends a packet to 192.168.2.20. Which addresses are in the frame leaving A?',
      options: [
        'MAC of 192.168.2.20 and destination IP 192.168.2.20',
        'MAC of the gateway and destination IP 192.168.1.1',
        'MAC of the gateway and destination IP 192.168.2.20',
        'Broadcast MAC and destination IP 192.168.2.20',
      ],
      answerIndex: 2,
      explanation: 'The destination is off-subnet, so A uses ARP to find the gateway MAC. The frame goes to the gateway, while the IP header still names the final host.',
      difficulty: 'hard',
      topic: 'ARP and NDP',
    },
  ],
  importantQuestions: [
    {
      q: 'Why is the header checksum in IPv4 updated at every router?',
      modelAnswer: 'Each router decrements TTL, which changes the header. The checksum covers the header only, so it must be updated before forwarding. IPv6 removed this field to reduce per-hop work.',
      marks: 2,
    },
    {
      q: 'Why can the first and last addresses of a subnet not be assigned to hosts?',
      modelAnswer: 'The all-zero host value is the network address and the all-one host value is the directed broadcast address. The exception is a /31 on a point-to-point link, under RFC 3021.',
      marks: 2,
    },
    {
      q: 'Explain how traceroute uses TTL and ICMP to find the path to a destination.',
      modelAnswer: 'Traceroute finds each router by forcing TTL to expire.\n1. The source sends probes with TTL = 1. The first router decrements TTL to 0, drops the probe and returns ICMP Type 11 Code 0, which reveals its address.\n2. The source repeats with TTL = 2, 3 and so on, discovering one more hop each time.\n3. Usually three probes per hop are sent, and each round-trip time is printed.\n4. Linux sends UDP to a high port, so the destination returns ICMP Type 3 Code 3. Windows tracert sends Echo Request, so the destination returns Echo Reply. Either reply ends the trace.\n5. A star means that no reply came within the timeout, often because of ICMP filtering.',
      marks: 5,
    },
    {
      q: 'Explain static NAT, dynamic NAT and PAT with a translation example.',
      modelAnswer: 'NAT rewrites IP addresses at a network boundary so that private hosts can use public addresses.\n1. Static NAT maps one private address to one public address permanently.\n2. Dynamic NAT maps hosts to a pool of public addresses, one address per host at a time.\n3. PAT maps many hosts to one public address by also rewriting the port.\nExample: 192.168.1.10:51000 and 192.168.1.11:51000 both connect to 203.0.113.50:443. The router sends them as 198.51.100.7:51000 and 198.51.100.7:1024. A reply to port 1024 is translated back to 192.168.1.11:51000.\n4. The IP checksum and the TCP or UDP checksum are recomputed after each rewrite.',
      marks: 5,
    },
    {
      q: 'Compare ARP and NDP.',
      modelAnswer: 'Both map an IP next hop to a MAC address.\n1. Carriage: ARP sits directly in Ethernet with EtherType 0x0806. NDP uses ICMPv6 inside IPv6.\n2. Request: ARP Request goes to the broadcast MAC, so every host processes it. Neighbor Solicitation, Type 135, goes to a solicited-node multicast group, so few hosts do.\n3. Reply: ARP Reply and Neighbor Advertisement, Type 136.\n4. Extra functions: NDP also gives router discovery with Types 133 and 134, Duplicate Address Detection and redirects.\n5. Security: both can be spoofed. Switches respond with Dynamic ARP Inspection and RA Guard.',
      marks: 5,
    },
    {
      q: 'Design a VLSM plan for 192.168.50.0/24 with LAN A of 60 hosts, LAN B of 28 hosts, LAN C of 12 hosts and two router links. Give each subnet, its host range and broadcast, and the remaining free space.',
      modelAnswer: 'Method: sort largest first, add 2 for the network and broadcast addresses, round up to a power of 2, and allocate on a block boundary.\nLAN A: 62 needs 64, so /26. 192.168.50.0/26, hosts .1 to .62, broadcast .63.\nLAN B: 30 needs 32, so /27. 192.168.50.64/27, hosts .65 to .94, broadcast .95.\nLAN C: 14 needs 16, so /28. 192.168.50.96/28, hosts .97 to .110, broadcast .111.\nLink 1: 4 addresses, so /30. 192.168.50.112/30, hosts .113 and .114, broadcast .115.\nLink 2: 4 addresses, so /30. 192.168.50.116/30, hosts .117 and .118, broadcast .119.\nCheck: used 64 + 32 + 16 + 4 + 4 = 120, so 256 - 120 = 136 addresses are free, from .120 to .255. These can be held as 192.168.50.120/29 and 192.168.50.128/25.\nWhy VLSM: five fixed /26 subnets would need 5 x 64 = 320 addresses and would not fit in a /24. The site is still advertised as the single route 192.168.50.0/24.',
      marks: 10,
    },
    {
      q: 'Explain IPv6 address structure, address types and the main IPv4 to IPv6 transition methods.',
      modelAnswer: 'Structure: 128 bits in eight hex groups. Leading zeros can be dropped, and one run of zero groups can be written as ::. A global unicast address usually has a 48-bit routing prefix, a 16-bit subnet ID and a 64-bit interface ID, as in 2001:db8:acad:12::a/64.\nTypes: global unicast 2000::/3 is routable. Link-local fe80::/10 stays on one link and exists on every interface. Unique local fc00::/7 is private to a site. Multicast ff00::/8 replaces broadcast. Loopback is ::1 and unspecified is ::.\nInterface ID: set by SLAAC using EUI-64 or random values, by DHCPv6, or manually.\nTransition methods:\n1. Dual stack runs IPv4 and IPv6 together on hosts and routers, and DNS returns A and AAAA records. It is the most common method, but both protocols must be managed.\n2. Tunnelling carries IPv6 inside IPv4 across IPv4-only networks, such as 6in4 with Protocol 41. It adds overhead and lowers the MTU.\n3. Translation with NAT64 and DNS64 lets IPv6-only clients reach IPv4-only servers using 64:ff9b::/96. 464XLAT extends this to IPv4-only apps on mobile networks.',
      marks: 10,
    },
  ],
  numericals: [
    {
      question: 'An organisation holds 172.16.0.0/16 and needs at least 30 subnets with at least 1000 hosts each. Find the prefix, the mask, the usable hosts per subnet and the range of the fourth subnet.',
      steps: [
        'Borrowed bits: 2^4 = 16 is too few and 2^5 = 32 is enough, so n = 5.',
        'New prefix: 16 + 5 = 21. The third octet is 11111000, so the mask is 255.255.248.0.',
        'Host bits: 32 - 21 = 11. Usable hosts: 2^11 - 2 = 2046, which meets the requirement.',
        'Block size in the third octet: 256 - 248 = 8. Subnets start at 172.16.0.0, 172.16.8.0, 172.16.16.0 and 172.16.24.0.',
        'The fourth subnet is 172.16.24.0/21. The next starts at 172.16.32.0, so the broadcast is 172.16.31.255.',
      ],
      answer: 'Prefix /21, mask 255.255.248.0, 32 subnets of 2046 usable hosts. Fourth subnet hosts 172.16.24.1 to 172.16.31.254, broadcast 172.16.31.255.',
    },
    {
      question: 'A host has the address 172.16.45.200/20. Find its network address, broadcast address, usable range and number of usable hosts.',
      steps: [
        'Mask: /20 is 255.255.240.0, so the third octet has 4 network bits and 4 host bits.',
        'Third octet: 45 = 00101101. AND with 11110000 gives 00100000 = 32, so the network is 172.16.32.0.',
        'Block size is 256 - 240 = 16. The next network is 172.16.48.0, so the broadcast is 172.16.47.255.',
        'Host bits: 32 - 20 = 12. Usable hosts: 2^12 - 2 = 4094.',
      ],
      answer: 'Network 172.16.32.0, broadcast 172.16.47.255, hosts 172.16.32.1 to 172.16.47.254, 4094 usable addresses.',
    },
    {
      question: 'Allocate 10.10.0.0/22 by VLSM to LAN A with 300 hosts, LAN B with 120 hosts, LAN C with 50 hosts, LAN D with 25 hosts and two router links. Give each subnet and the free space that remains.',
      steps: [
        'A /22 holds 2^10 = 1024 addresses.',
        'LAN A: 300 + 2 = 302, round up to 512, so /23. Allocate 10.10.0.0/23, hosts 10.10.0.1 to 10.10.1.254, broadcast 10.10.1.255.',
        'LAN B: 120 + 2 = 122, round up to 128, so /25. Allocate 10.10.2.0/25, hosts .1 to .126, broadcast 10.10.2.127.',
        'LAN C: 50 + 2 = 52, round up to 64, so /26. Allocate 10.10.2.128/26, hosts .129 to .190, broadcast 10.10.2.191.',
        'LAN D: 25 + 2 = 27, round up to 32, so /27. Allocate 10.10.2.192/27, hosts .193 to .222, broadcast 10.10.2.223.',
        'Links: 2 + 2 = 4, so /30. Allocate 10.10.2.224/30 and 10.10.2.228/30.',
        'Used: 512 + 128 + 64 + 32 + 4 + 4 = 744. Free: 1024 - 744 = 280 addresses, from 10.10.2.232 to 10.10.3.255.',
      ],
      answer: 'A 10.10.0.0/23, B 10.10.2.0/25, C 10.10.2.128/26, D 10.10.2.192/27, links 10.10.2.224/30 and 10.10.2.228/30, with 280 addresses free.',
    },
    {
      question: 'An ISP routes customer networks 10.20.64.0/24 through 10.20.71.0/24. Find one summary route and the addresses it covers. Can 10.20.72.0/24 be added and keep one exact summary?',
      steps: [
        'Third octets: 64 = 01000000 and 71 = 01000111.',
        'Common leading bits in the third octet: 01000, which is 5 bits.',
        'Prefix: 16 + 5 = 21. Mask: 255.255.248.0. Summary: 10.20.64.0/21.',
        'Check: 8 networks x 256 = 2048 = 2^11 addresses, matching 32 - 21 = 11 host bits, and 64 is a multiple of 8.',
        'Adding 72 = 01001000 leaves only 0100 in common. That gives 10.20.64.0/20, which covers 16 networks, 64 to 79, of which 7 are not in the list.',
      ],
      answer: 'Summary 10.20.64.0/21 covering 2048 addresses. With 10.20.72.0/24 added, no exact single summary exists, because /20 would also claim 7 other /24 networks.',
    },
    {
      question: 'A 3000-byte IPv4 datagram with a 20-byte header must cross a link with MTU 1000. Find the number of fragments and the data size, Total Length, offset and MF flag of each.',
      steps: [
        'Data to send: 3000 - 20 = 2980 bytes.',
        'Room per fragment: 1000 - 20 = 980 bytes. 980 / 8 = 122.5, so round down to 122 x 8 = 976 data bytes.',
        'Three full fragments carry 976 x 3 = 2928 bytes. The remainder is 2980 - 2928 = 52 bytes, so 4 fragments are needed.',
        'Offsets: 0, 976 / 8 = 122, 1952 / 8 = 244 and 2928 / 8 = 366.',
        'Total Lengths: 996, 996, 996 and 52 + 20 = 72 bytes.',
        'MF flags: 1, 1, 1 and 0. Check: 996 x 3 + 72 = 3060 bytes, which is 3000 plus 3 extra headers of 20 bytes.',
      ],
      answer: '4 fragments. Data 976, 976, 976 and 52 bytes. Total Length 996, 996, 996 and 72 bytes. Offset 0, 122, 244 and 366. MF 1, 1, 1 and 0.',
    },
  ],
  keyTerms: [
    'IHL: Internet Header Length, the IPv4 header size counted in 32-bit words',
    'TTL: Hop counter that each router decrements; the packet is dropped when it reaches zero',
    'CIDR: Classless addressing where a prefix length replaces fixed address classes',
    'Subnet mask: 32-bit value whose 1 bits mark the network part of an address',
    'VLSM: Using different prefix lengths inside one block to match each subnet size',
    'Route aggregation: Advertising one shorter prefix that covers many longer prefixes',
    'Private range: RFC 1918 block, 10.0.0.0/8, 172.16.0.0/12 or 192.168.0.0/16',
    'NAT: Rewriting IP addresses in packet headers as they cross a router',
    'PAT: NAT that also rewrites ports so many hosts can share one public address',
    'CGNAT: ISP-level NAT using the shared range 100.64.0.0/10 for its customers',
    'ICMP: Network-layer protocol carrying error reports and diagnostic queries',
    'MTU: Largest IP packet in bytes that a link can carry in one frame',
    'Path MTU discovery: Finding the smallest MTU on a path using DF and ICMP Type 3 Code 4',
    'Fragment offset: Position of fragment data in the original payload, in units of 8 bytes',
    'APIPA: Self-assigned 169.254.0.0/16 address used when DHCP fails',
    'SLAAC: IPv6 host builds its own address from a Router Advertisement prefix',
    'Dual stack: Running IPv4 and IPv6 side by side on the same host or router',
    'NDP: ICMPv6 protocol for neighbor resolution, router discovery and duplicate checks',
    'ARP: Resolves an IPv4 next-hop address to a MAC address on the local link',
  ],
  formulas: [
    { name: 'Network address', expression: 'Network = IP AND Mask' },
    { name: 'Broadcast address', expression: 'Broadcast = Network OR (NOT Mask)' },
    { name: 'Number of subnets', expression: 'S = 2^n', note: 'n is the number of borrowed bits.' },
    { name: 'Usable hosts per subnet', expression: 'H = 2^h - 2', note: 'h is the number of host bits. /31 and /32 are exceptions.' },
    { name: 'Block size', expression: 'Block = 256 - mask octet', note: 'Subnets start at multiples of the block size.' },
    { name: 'Addresses in a prefix', expression: 'A = 2^(32 - p)', note: 'Use 128 in place of 32 for IPv6.' },
    { name: 'IPv4 header length', expression: 'Header bytes = IHL x 4' },
    { name: 'Data per fragment', expression: 'D = floor((MTU - H) / 8) x 8', note: 'H is the IP header size, usually 20 bytes.' },
    { name: 'Fragment offset', expression: 'Offset = data bytes before this fragment / 8' },
    { name: 'Ping packet size', expression: 'IP packet = payload + 8 + 20', note: '8 bytes of ICMP header and 20 bytes of IP header.' },
    { name: 'IPv6 subnets in a prefix', expression: 'Subnets = 2^(64 - p)', note: 'A /48 gives 65,536 /64 subnets.' },
  ],
  handsOnChecklist: [
    'Find your IPv4 address, mask and gateway with ipconfig or ip addr, then calculate your network and broadcast addresses by hand.',
    'Build the 192.168.20.0/24 VLSM plan in Cisco Packet Tracer with one router and two switches, then ping between subnets.',
    'Run tracert or traceroute to 8.8.8.8 while Wireshark captures, and note the TTL and ICMP type at each hop.',
    'Find your path MTU using ping with DF set, adjusting the payload around 1472 bytes.',
    'Configure PAT on a Packet Tracer router and read show ip nat translations while a PC opens a web page on a server.',
    'List your IPv6 addresses and neighbor cache with ipconfig, or ip -6 addr and ip -6 neigh, and identify the link-local and global addresses.',
  ],
};

export default chapter;

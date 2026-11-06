import type { Chapter } from '@/lib/types';

const chapter: Chapter = {
  slug: 'modern-networking',
  number: 10,
  title: 'Modern networking',
  shortTitle: 'Modern networking',
  summary:
    'How current networks are built and run: SDN and NFV, cloud VPCs and load balancers, CDNs, leaf-spine data centers, QoS, monitoring with SNMP and NetFlow, automation, and a career roadmap for network engineers.',
  estMinutes: 80,
  learningObjectives: [
    'Explain the separation of control and data planes in SDN and trace an OpenFlow table-miss.',
    'Distinguish NFV from SDN and identify the roles of VNF, NFVI and MANO.',
    'Design a multi-tier VPC with subnets, route tables, security groups and a load balancer.',
    'Calculate cache hit latency, leaf-spine oversubscription, token bucket bursts and subnet sizes.',
    'Apply classification, queuing and shaping to protect voice traffic on a WAN link.',
    'Choose between SNMP, NetFlow and automation tools, and plan a network engineering career path.',
  ],
  overviewVideoId: 'ch10-overview',
  sections: [
    {
      id: 'sdn-control-data-plane',
      title: 'Software-defined networking',
      videoId: 'ch10-sdn-control-data-plane',
      blocks: [
        { type: 'paragraph', text: 'Every router or switch does two jobs: it decides where traffic should go, and it moves that traffic. **Software-defined networking (SDN)** separates these jobs. Decision logic moves to a central controller and devices keep the fast forwarding work, so the network can be programmed as one system.' },
        { type: 'points', items: [
          '**Data plane:** forwards packets using tables such as the MAC table, FIB and ACLs, usually in ASIC hardware at line rate.',
          '**Control plane:** builds those tables. In a traditional router this is OSPF, BGP or STP running on the device CPU.',
          '**Management plane:** how people and tools configure and observe a device, through SSH, SNMP and APIs.',
          '**SDN model:** control is logically centralized. A controller holds a global topology view and programs devices through an open interface.',
          '**Northbound API:** connects applications to the controller, usually REST with JSON.',
          '**Southbound API:** connects the controller to devices, for example OpenFlow, NETCONF, OVSDB or P4Runtime.',
          '**East-west API:** connects controller cluster members, so that one server failure does not stop the network.',
        ] },
        {
          type: 'diagram',
          id: 'ch10-sdn-architecture',
          title: 'SDN architecture',
          caption: 'Three layers of SDN. Applications state intent through the northbound API, and the controller programs the switches through the southbound API.',
          kind: 'block',
          mermaid: `flowchart TD
    subgraph AP["Application layer"]
        A1["Routing app"]
        A2["Load balancing app"]
        A3["Security policy app"]
    end
    subgraph CP["Control layer - control plane"]
        C1["SDN controller"]
        C2["Global topology and flow state"]
    end
    subgraph DP["Infrastructure layer - data plane"]
        S1["OpenFlow switch 1"]
        S2["OpenFlow switch 2"]
        S3["OpenFlow switch 3"]
    end
    A1 -->|Northbound REST API| C1
    A2 -->|Northbound REST API| C1
    A3 -->|Northbound REST API| C1
    C1 --- C2
    C1 -->|Southbound OpenFlow| S1
    C1 -->|Southbound OpenFlow| S2
    C1 -->|Southbound OpenFlow| S3
    S1 --- S2
    S2 --- S3`,
        },
        { type: 'paragraph', text: '**OpenFlow** began at Stanford and is now maintained by the Open Networking Foundation. A switch holds flow tables, and the controller adds or removes entries over TCP port `6653` (older deployments used `6633`), optionally with TLS. Each packet is matched against the entries, and the highest-priority match decides its treatment.' },
        { type: 'table', headers: ['Flow entry field', 'Purpose'], rows: [
          ['Match fields', 'Ingress port and headers such as `eth_dst`, `ipv4_src`, `tcp_dst`'],
          ['Priority', 'Highest-priority matching entry wins'],
          ['Counters', 'Packets and bytes matched'],
          ['Instructions', 'Actions such as output to a port, set a field, or go to the next table'],
          ['Timeouts', '`idle_timeout` and `hard_timeout` remove stale entries'],
          ['Cookie', 'Value the controller uses to identify its entries'],
        ] },
        {
          type: 'diagram',
          id: 'ch10-openflow-reactive',
          title: 'Reactive flow setup in OpenFlow',
          caption: 'The first packet of a new flow goes to the controller. Later packets of the flow stay in the data plane.',
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant HA as HostA
    participant SW as OFSwitch
    participant CT as Controller
    participant HB as HostB
    HA->>SW: First packet of new flow
    Note over SW: Only the table-miss entry matches
    SW->>CT: Packet-In with headers and buffer id
    Note over CT: Compute path using global view
    CT->>SW: Flow-Mod with match and output port
    CT->>SW: Packet-Out to release first packet
    SW->>HB: First packet forwarded
    HA->>SW: Next packets of same flow
    SW->>HB: Forwarded by the new flow entry`,
        },
        { type: 'points', items: [
          '**Reactive mode:** the first packet of a flow triggers a Packet-In. This adds setup delay and controller load.',
          '**Proactive mode:** the controller installs entries in advance. There is no first-packet delay, but more table space is used.',
          '**Table-miss entry:** priority `0` with all fields wildcarded. From OpenFlow 1.3, a packet with no matching entry is dropped unless this entry exists and sends it to the controller.',
        ] },
        { type: 'callout', variant: 'exam-tip', text: 'SDN moves the **control plane** to the controller, and the **data plane stays in the switches**. If the controller fails, installed entries keep forwarding, but new flows that need a controller decision cannot be set up.' },
        {
          type: 'command-lab',
          title: 'Read an OpenFlow flow table after h1 pings h2 five times',
          command: 'sudo ovs-ofctl -O OpenFlow13 dump-flows s1',
          output: ` cookie=0x0, duration=18.212s, table=0, n_packets=5, n_bytes=490, priority=1,in_port="s1-eth2",dl_src=00:00:00:00:00:02,dl_dst=00:00:00:00:00:01 actions=output:"s1-eth1"
 cookie=0x0, duration=18.204s, table=0, n_packets=4, n_bytes=392, priority=1,in_port="s1-eth1",dl_src=00:00:00:00:00:01,dl_dst=00:00:00:00:00:02 actions=output:"s1-eth2"
 cookie=0x0, duration=63.127s, table=0, n_packets=3, n_bytes=182, priority=0 actions=CONTROLLER:65535`,
          explanation: [
            'Line 1 is the h2 to h1 flow. It matches `in_port` and both MAC addresses, then outputs on `s1-eth1`. Its counters show all 5 echo replies at 98 bytes each, so `n_bytes=490`.',
            'Line 2 is the h1 to h2 flow, with only 4 echo requests (`392` bytes). The first request reached the controller before this entry existed.',
            'Line 3 is the table-miss entry: `priority=0`, no match fields and `actions=CONTROLLER:65535`. Its 3 packets are the ARP request (42), the ARP reply (42) and the first echo request (98), which total `182` bytes.',
          ],
        },
        { type: 'wireshark', filter: 'openflow_v4', whatToLook: [
          'Capture on the loopback interface of the Mininet VM, because the controller and switch share one host.',
          'Type 10 is Packet-In. Expand it to read the reason, the match with in_port, and the enclosed frame.',
          'Type 14 is Flow-Mod and type 13 is Packet-Out. Both follow the Packet-In from controller to switch.',
          'Use openflow_v4.type == 10 to list only Packet-In messages.',
        ] },
        {
          type: 'mini-lab',
          title: 'Watch a flow entry appear in Mininet',
          goal: 'See the reactive setup in action and show that the data plane survives without a controller.',
          steps: [
            'Start the controller: `ryu-manager ryu.app.simple_switch_13`.',
            'In a second terminal, start the network: `sudo mn --topo single,2 --mac --switch ovsk,protocols=OpenFlow13 --controller remote`.',
            'At the Mininet prompt, run `sh ovs-ofctl -O OpenFlow13 dump-flows s1`. Only the table-miss entry appears.',
            'Run `h1 ping -c 5 h2` and compare the first RTT with the others.',
            'Dump the flows again, then stop the controller and ping once more.',
          ],
          expected: 'The first RTT is clearly higher because it includes the controller round trip. Two `priority=1` entries appear, and pings still work without the controller. Counters may be slightly higher if hosts also send IPv6 neighbor discovery.',
        },
        { type: 'callout', variant: 'real-world', text: 'Pure OpenFlow appears in labs, research networks and some large WANs, and Google described it in its B4 inter-datacenter WAN. Enterprises usually meet SDN through **Cisco ACI**, **Cisco SD-Access**, **VMware NSX** and **SD-WAN** products, which keep central policy but use protocols such as VXLAN, LISP, OpFlex and Geneve.' },
      ],
    },
    {
      id: 'nfv-virtual-functions',
      title: 'Network functions virtualization',
      blocks: [
        { type: 'paragraph', text: 'Networks traditionally used one dedicated appliance per function: a router, a firewall, a load balancer. **Network functions virtualization (NFV)** turns these functions into software on standard servers, as virtual machines or containers. Telecom operators proposed the idea in 2012, and ETSI defined the reference architecture.' },
        { type: 'points', items: [
          '**VNF (virtual network function):** a network function as software, such as a virtual router, firewall or 5G user plane function.',
          '**NFVI (NFV infrastructure):** the servers, storage, switches and virtualization layer on which VNFs run.',
          '**MANO (management and orchestration):** deploys, scales and heals VNFs through the NFV Orchestrator (NFVO), VNF Manager (VNFM) and Virtualized Infrastructure Manager (VIM), such as OpenStack.',
          '**Service function chaining:** steers traffic through an ordered list of functions, for example firewall, then IDS, then NAT.',
          '**Performance:** standard kernels are slow at packet processing, so VNFs use DPDK (user-space packet processing) and SR-IOV (direct access to the network card).',
        ] },
        {
          type: 'diagram',
          id: 'ch10-nfv-architecture',
          title: 'ETSI NFV architecture',
          caption: 'MANO manages the lifecycle of VNFs, and VNFs consume virtual resources that the NFVI provides from standard hardware.',
          kind: 'block',
          mermaid: `flowchart TD
    subgraph MO["MANO - management and orchestration"]
        M1["NFV Orchestrator"]
        M2["VNF Manager"]
        M3["Virtualized Infrastructure Manager"]
    end
    subgraph VF["Virtual network functions"]
        V1["Virtual router"]
        V2["Virtual firewall"]
        V3["Virtual load balancer"]
    end
    subgraph NI["NFVI - NFV infrastructure"]
        H2["Virtual compute storage and network"]
        H1["Hypervisor or container runtime"]
        H3["Standard servers and switches"]
    end
    M1 --> M2
    M1 --> M3
    M2 -->|Lifecycle| V2
    M3 -->|Allocates| H1
    V1 -->|Runs on| H2
    V2 -->|Runs on| H2
    V3 -->|Runs on| H2
    H2 --> H1
    H1 --> H3`,
        },
        { type: 'table', headers: ['Aspect', 'SDN', 'NFV'], rows: [
          ['Core idea', 'Separates control from forwarding', 'Separates function from hardware'],
          ['Main target', 'Switching and routing behavior', 'Firewalls, routers, NAT, 5G core'],
          ['Key parts', 'Controller, northbound and southbound APIs', 'VNF, NFVI, MANO'],
          ['Origin', 'Campus and research networks', 'Telecom operators, through ETSI'],
        ] },
        { type: 'callout', variant: 'remember', text: 'SDN and NFV are independent and complementary. Either one works alone, and many networks combine them: a controller steers traffic through a chain of VNFs.' },
        { type: 'callout', variant: 'real-world', text: 'ISPs run the 5G core and broadband gateways as software. Branch offices use a single **uCPE** server hosting SD-WAN and firewall VNFs. In the cloud, a vendor firewall image from a marketplace is a VNF on a virtual machine.' },
      ],
    },
    {
      id: 'cloud-vpc-networking',
      title: 'Cloud networking: VPC and load balancers',
      videoId: 'ch10-cloud-vpc-networking',
      blocks: [
        { type: 'paragraph', text: 'A **virtual private cloud (VPC)** is a logically isolated network that you define inside a public cloud. You choose the address range, split it into subnets and control routing and filtering, as in an office network. The routers and switches are virtual, implemented by the software-defined fabric of the provider.' },
        { type: 'points', items: [
          '**VPC range:** a private CIDR block such as `10.0.0.0/16`. Avoid overlap with office LANs and other VPCs, because overlapping ranges cannot be routed directly over peering or VPN.',
          '**Subnet:** a slice of the VPC range. In AWS each subnet lives in one availability zone (AZ), an isolated group of data centers within a region.',
          '**Route table:** sets the next hop for a subnet. Every table has a `local` route covering the VPC range.',
          '**Public subnet:** its route table sends `0.0.0.0/0` to an **internet gateway (IGW)**, which does one-to-one NAT between private and public addresses.',
          '**Private subnet:** has no route to the IGW. For outbound updates, `0.0.0.0/0` points to a **NAT gateway** in a public subnet, which only allows connections started from inside.',
          '**Reserved addresses:** AWS reserves 5 per subnet. In `10.0.1.0/24` these are `.0` (network), `.1` (VPC router), `.2` (DNS), `.3` (future use) and `.255` (last), leaving 251.',
          '**Other clouds:** Azure calls it a VNet, with subnets that span zones. A Google VPC is global, with regional subnets.',
        ] },
        {
          type: 'diagram',
          id: 'ch10-vpc-design',
          title: 'Three-tier VPC design',
          caption: 'Only the load balancer faces the internet. App servers reach out through a NAT gateway in their own zone, and the data tier has no internet route.',
          kind: 'block',
          mermaid: `flowchart TD
    U1["Internet users"]
    GW["Internet gateway"]
    subgraph VP["VPC 10.0.0.0/16 across two zones"]
        subgraph PB["Public tier default route to IGW"]
            LB["Application load balancer"]
            NA["NAT gateway AZ-A 10.0.1.0/24"]
            NB["NAT gateway AZ-B 10.0.2.0/24"]
        end
        subgraph AT["App tier default route to NAT"]
            WA["App server AZ-A 10.0.11.0/24"]
            WB["App server AZ-B 10.0.12.0/24"]
        end
        subgraph DT["Data tier no internet route"]
            DA["DB primary AZ-A 10.0.21.0/24"]
            DS["DB standby AZ-B 10.0.22.0/24"]
        end
    end
    U1 -->|HTTPS 443| GW
    GW --> LB
    LB -->|SG allows 8080| WA
    LB -->|SG allows 8080| WB
    WA -->|SG allows 5432| DA
    WB -->|SG allows 5432| DA
    DA -->|Replication| DS
    WA -->|Outbound only| NA
    WB -->|Outbound only| NB
    NA --> GW
    NB --> GW`,
        },
        { type: 'table', headers: ['Feature', 'Security group', 'Network ACL'], rows: [
          ['Applies to', 'Network interface of an instance', 'Whole subnet'],
          ['State', 'Stateful: return traffic is allowed automatically', 'Stateless: return traffic needs its own rule'],
          ['Rules', 'Allow only', 'Allow and deny'],
          ['Evaluation', 'All rules are considered', 'Numbered order, first match wins'],
        ] },
        { type: 'callout', variant: 'exam-tip', text: 'A NACL is stateless, so a subnet serving HTTPS needs inbound `443` and outbound ephemeral ports `1024-65535` for the replies. A security group needs only the inbound `443` rule.' },
        { type: 'callout', variant: 'real-world', text: 'Security groups can reference each other: `sg-alb` allows `443` from `0.0.0.0/0`, `sg-app` allows `8080` only from `sg-alb`, and `sg-db` allows `5432` only from `sg-app`. New servers gain access with no IP addresses in the rules. Offices connect to a VPC using IPsec VPN or a private circuit such as AWS Direct Connect or Azure ExpressRoute.' },
        { type: 'paragraph', text: 'A **load balancer** presents one address to clients and spreads requests across a pool of servers. It adds capacity, because servers can be added behind it, and availability, because failed servers are removed from rotation.' },
        { type: 'points', items: [
          '**Layer 4:** forwards TCP or UDP flows using the 5-tuple without reading application data, so it is fast and handles very high connection rates.',
          '**Layer 7:** terminates the client connection, reads HTTP and routes on host, path or headers. For example, `/api/` and `/images/` can go to different pools.',
          '**Algorithms:** round robin, weighted round robin, least connections, and source IP or consistent hash.',
          '**Health checks:** the balancer probes each target, for example `GET /health` every 30 seconds, and skips failed targets.',
          '**TLS termination and affinity:** a Layer 7 balancer can hold the certificates, and sticky sessions keep one client on one server.',
        ] },
        {
          type: 'diagram',
          id: 'ch10-load-balancer-flow',
          title: 'Load balancer request decision',
          caption: 'A Layer 7 listener routes on HTTP content and a Layer 4 listener on the flow tuple. Both send traffic only to targets that pass health checks.',
          kind: 'flowchart',
          mermaid: `flowchart TD
    A1["Client request reaches listener"]
    A2{"Layer 7 listener?"}
    A3["Terminate TLS and parse HTTP"]
    A4["Match host and path rule"]
    A5["Read 5-tuple of the flow"]
    A6["Select target group"]
    A7{"Healthy target available?"}
    A8["Return 503 or reset connection"]
    A9["Pick target by algorithm"]
    A10["Forward request to backend"]
    A11["Backend response returns to client"]
    H1["Health checker probes each target"]
    H2["Mark target healthy or unhealthy"]
    A1 --> A2
    A2 -->|Yes| A3
    A3 --> A4
    A4 --> A6
    A2 -->|No| A5
    A5 --> A6
    A6 --> A7
    A7 -->|No| A8
    A7 -->|Yes| A9
    A9 --> A10
    A10 --> A11
    H1 --> H2
    H2 --> A7`,
        },
        {
          type: 'troubleshoot',
          symptom: 'A web server in a public subnet has a public IP, but `curl` from the internet times out.',
          checks: [
            'Route table: does the subnet send `0.0.0.0/0` to an internet gateway?',
            'Security group: is inbound TCP `443` allowed from the client range?',
            'Network ACL: are inbound `443` and outbound `1024-65535` both allowed?',
            'Host: does `ss -tln` show the service on `0.0.0.0:443`, not only on `127.0.0.1`?',
            'VPC Flow Logs: `REJECT` means a filter blocked it. No records means traffic never arrived.',
          ],
          fix: 'Correct the first failed layer, working from the outside in. The usual causes are a missing IGW route or a NACL that blocks return traffic on ephemeral ports.',
        },
      ],
    },
    {
      id: 'cdn-caching',
      title: 'CDN and caching',
      videoId: 'ch10-cdn-caching',
      blocks: [
        { type: 'paragraph', text: 'Light in optical fiber covers about 200 km per millisecond, so a distant server always adds delay, however fast the link. A **content delivery network (CDN)** places caching servers close to users, in sites called **points of presence (PoPs)**. Most requests are answered nearby, and the **origin** server sees only a fraction of the load.' },
        { type: 'points', items: [
          '**Origin:** the authoritative server or storage bucket holding the original content.',
          '**Edge server:** a cache in a PoP that answers users directly.',
          '**Cache key:** what identifies a stored object, normally host and URL plus any selected headers or query strings.',
          '**TTL:** how long an object stays fresh, set by `Cache-Control` or by CDN policy.',
          '**Revalidation:** a stale copy is checked with `If-None-Match`. An unchanged object returns `304 Not Modified`, with no body.',
          '**Purge:** removes an object before its TTL ends. Versioned names such as `app.3f2a.js` avoid the need.',
          '**Origin shield:** a middle cache tier that collapses many edge misses into fewer origin requests.',
          '**DNS-based routing:** the site name is a `CNAME` to the CDN, whose DNS returns an edge address near the resolver or client.',
          '**Anycast routing:** many PoPs announce the same IP with BGP, and internet routing delivers packets to a nearby one.',
        ] },
        {
          type: 'diagram',
          id: 'ch10-cdn-request-flow',
          title: 'CDN request flow',
          caption: 'A request ends in a hit, a revalidation or a miss. If revalidation does not return 304, the origin sends 200 with a new copy, which replaces the stored one.',
          kind: 'working-flowchart',
          mermaid: `flowchart TD
    C1["Client requests /logo.png"]
    C2["DNS CNAME points to CDN"]
    C3["Anycast or GeoDNS selects a PoP"]
    C4["TLS handshake with edge server"]
    C5{"Object in edge cache?"}
    C6{"Still within TTL?"}
    C7["Cache HIT - serve stored copy"]
    C8["Revalidate using If-None-Match"]
    C9{"Origin replies 304?"}
    C10["Refresh TTL - serve stored copy"]
    C11["Cache MISS - fetch from origin"]
    C12["Store object if headers allow"]
    C13["Send response to client"]
    C1 --> C2
    C2 --> C3
    C3 --> C4
    C4 --> C5
    C5 -->|Yes| C6
    C5 -->|No| C11
    C6 -->|Yes| C7
    C6 -->|No| C8
    C8 --> C9
    C9 -->|Yes| C10
    C9 -->|No| C12
    C11 --> C12
    C7 --> C13
    C10 --> C13
    C12 --> C13`,
        },
        { type: 'table', headers: ['Header', 'Set by', 'Meaning'], rows: [
          ['`Cache-Control: max-age=86400`', 'Origin', 'Fresh for 1 day in any cache'],
          ['`Cache-Control: s-maxage=600`', 'Origin', 'TTL for shared caches such as CDNs, overriding `max-age`'],
          ['`Cache-Control: no-store`', 'Origin', 'Do not store at all'],
          ['`Cache-Control: no-cache`', 'Origin', 'May store, but must revalidate before each reuse'],
          ['`ETag`', 'Origin', 'Version tag, sent back later in `If-None-Match`'],
          ['`Age`', 'Cache', 'Seconds since the copy was fetched or validated at the origin'],
        ] },
        { type: 'callout', variant: 'exam-tip', text: '`no-cache` does not mean "do not cache". It means store but revalidate before reuse. Only `no-store` forbids storage, and it suits private pages such as bank statements.' },
        { type: 'callout', variant: 'formula', text: 'Hit ratio `h = hits / (hits + misses)`. Average latency `T_avg = h x T_hit + (1 - h) x T_miss`. With `h = 0.9`, `T_hit = 20 ms` and `T_miss = 200 ms`, `T_avg = 18 + 20 = 38 ms`.' },
        {
          type: 'command-lab',
          title: 'Spot a CDN from the command line',
          command: 'dig +noall +answer www.example.com; curl -sI https://www.example.com/logo.png',
          output: `www.example.com.                 300  IN  CNAME  d111111abcdef8.cloudfront.net.
d111111abcdef8.cloudfront.net.   60   IN  A      203.0.113.21
d111111abcdef8.cloudfront.net.   60   IN  A      203.0.113.84

HTTP/2 200
content-type: image/png
content-length: 18342
cache-control: public, max-age=86400
etag: "5f2a-63c1"
age: 1832
x-cache: Hit from cloudfront
x-amz-cf-pop: BOM78-C1`,
          explanation: [
            'The `CNAME` hands the name to the CDN. The `A` records are edge addresses for this resolver, and their short TTL of `60` lets the CDN steer users quickly.',
            '`HTTP/2 200` with `content-length: 18342` is a normal response for an image of about 18 KB.',
            '`cache-control` lets any cache keep the object for 1 day, and `etag` is the version tag for later revalidation.',
            '`age: 1832` means the copy has spent 1832 seconds in cache, so it stays fresh for `86400 - 1832 = 84568` more seconds.',
            '`x-cache: Hit from cloudfront` confirms a hit, and `x-amz-cf-pop` names the PoP. Other CDNs use similar headers, such as `cf-cache-status` at Cloudflare.',
          ],
        },
        {
          type: 'case-study',
          title: 'University portal on results day',
          scenario: 'A portal normally serves 200 requests per second, but it sees 20,000 on results day, and its single on-site server keeps failing.',
          steps: [
            '**Split the content.** Logos, CSS and scripts get `Cache-Control: public, max-age=86400` and go through a CDN. Personal result pages get `no-store`.',
            '**Build the VPC.** Use public, app and data subnets in two AZs, as in the design above.',
            '**Balance and scale.** A Layer 7 balancer with `GET /health` checks fronts an auto-scaling group, scaled up before the announced time.',
            '**Check the numbers.** At a 92 percent hit ratio, the origin tier receives `20000 x 0.08 = 1600` requests per second, which the scaled pool can handle.',
          ],
        },
        { type: 'callout', variant: 'real-world', text: 'Streaming services go further: Netflix Open Connect appliances sit inside ISP networks, so popular video does not cross the ISP upstream links. CDNs also help dynamic pages, through TLS termination near the user, reused origin connections, DDoS absorption and a web application firewall.' },
      ],
    },
    {
      id: 'data-center-leaf-spine',
      title: 'Data center topologies: leaf-spine',
      videoId: 'ch10-data-center-leaf-spine',
      blocks: [
        { type: 'paragraph', text: 'Older data centers used a **three-tier** design of access, aggregation and core switches, built for north-south traffic between users and servers. Modern applications create mostly **east-west** traffic between servers, such as microservice calls and storage replication. **Leaf-spine**, a two-tier Clos fabric, gives every server pair a short, predictable path.' },
        { type: 'points', items: [
          '**Leaf switch:** a top-of-rack switch that connects servers. Every leaf connects to every spine.',
          '**Spine switch:** a high-capacity switch that connects only leaves. In the basic design, leaves do not link to leaves and spines do not link to spines.',
          '**Equal path length:** traffic between different leaves always crosses 3 switches: leaf, spine, leaf.',
          '**ECMP:** a leaf has one equal-cost route per spine, and a hash of the 5-tuple selects one per flow, so all links carry traffic and packets of a flow stay in order.',
          '**Routed underlay:** links are Layer 3, often running eBGP (RFC 7938) or OSPF, so STP blocks nothing.',
          '**Scale out:** add spines for bandwidth and leaves for servers. Spine port count limits the number of leaves, and leaf uplink count limits the number of spines.',
        ] },
        {
          type: 'diagram',
          id: 'ch10-leaf-spine-topology',
          title: 'Leaf-spine topology',
          caption: 'Every leaf links to every spine, so all cross-leaf paths are the same length. Servers attach only to leaves.',
          kind: 'block',
          mermaid: `flowchart TD
    subgraph SL["Spine layer"]
        SP1["Spine 1"]
        SP2["Spine 2"]
    end
    subgraph LL["Leaf layer - top of rack"]
        LF1["Leaf 1"]
        LF2["Leaf 2"]
        LF3["Leaf 3"]
        LF4["Leaf 4"]
    end
    subgraph RK["Server racks"]
        SA["Rack A servers"]
        SB["Rack B servers"]
        SC["Rack C servers"]
        SD["Rack D servers"]
    end
    SP1 --- LF1
    SP1 --- LF2
    SP1 --- LF3
    SP1 --- LF4
    SP2 --- LF1
    SP2 --- LF2
    SP2 --- LF3
    SP2 --- LF4
    LF1 --- SA
    LF2 --- SB
    LF3 --- SC
    LF4 --- SD`,
        },
        { type: 'table', headers: ['Property', 'Three-tier', 'Leaf-spine'], rows: [
          ['Main traffic', 'North-south', 'East-west'],
          ['Redundant links', 'STP blocks some Layer 2 links', 'All active through ECMP'],
          ['Server-to-server path', 'Varies from 1 to 5 switches', '3 switches across leaves, 1 within a leaf'],
          ['Growth', 'Scale up with a bigger core', 'Scale out by adding switches'],
          ['Spine or core failure', 'Possible STP reconvergence', 'Loses only that share of capacity'],
        ] },
        { type: 'callout', variant: 'formula', text: 'Oversubscription ratio `= total downlink capacity / total uplink capacity`. With `48 x 25G` down and `6 x 100G` up, the ratio is `1200 / 600 = 2:1`. A ratio of `1:1` is non-blocking.' },
        {
          type: 'example',
          title: 'Tracing one flow across the fabric',
          steps: [
            'Server `10.1.1.10` in Rack A opens a TCP connection to `10.1.4.20` in Rack D.',
            'Leaf 1 finds two equal-cost next hops for `10.1.4.0/24`: Spine 1 and Spine 2. The 5-tuple hash selects Spine 2 for this flow.',
            'Spine 2 has one route to `10.1.4.0/24`, through Leaf 4, which delivers the packet. A second flow with another source port may hash to Spine 1.',
            'If Spine 2 fails, Leaf 1 removes that next hop once BFD or BGP detects the failure, and rehashes flows to Spine 1.',
          ],
        },
        { type: 'paragraph', text: 'A routed fabric stops VLANs at each leaf, yet workloads such as VM migration may need the same Layer 2 segment across racks. **VXLAN** solves this by tunneling Ethernet frames in UDP across the routed underlay.' },
        { type: 'points', items: [
          '**VTEP:** the VXLAN tunnel endpoint, usually on a leaf, which encapsulates and decapsulates frames.',
          '**VNI:** a 24-bit segment ID, giving about 16 million segments against 4094 usable VLANs.',
          '**Encapsulation:** MAC-in-UDP on destination port `4789` (RFC 7348). It adds 50 bytes: outer Ethernet 14, outer IP 20, UDP 8, VXLAN 8. A 1500-byte inner packet needs an underlay IP MTU of at least `1550`.',
          '**BGP EVPN:** the control plane that advertises MAC and IP reachability between VTEPs, replacing flood-and-learn.',
          '**Entropy:** the outer UDP source port comes from a hash of the inner headers, so ECMP still spreads flows across spines.',
        ] },
        { type: 'callout', variant: 'real-world', text: 'Enterprises build this with Cisco Nexus, Arista or Juniper switches, using VXLAN with BGP EVPN and jumbo frames of about 9000 bytes. Hyperscale operators extend the same Clos idea to more stages, and some run the open-source SONiC switch operating system.' },
      ],
    },
    {
      id: 'qos-traffic-shaping',
      title: 'Quality of service',
      videoId: 'ch10-qos-traffic-shaping',
      blocks: [
        { type: 'paragraph', text: 'When traffic arrives faster than a link can send it, packets wait in a queue and may be dropped. **Quality of service (QoS)** decides which traffic gets priority during this congestion. QoS does not create bandwidth. It manages the bandwidth that exists.' },
        { type: 'points', items: [
          '**Metrics:** bandwidth, delay, jitter (variation in delay) and loss. Voice targets are one-way delay up to 150 ms (ITU-T G.114), jitter up to 30 ms and loss up to 1 percent.',
          '**Best effort:** no guarantees, the default on the internet.',
          '**IntServ:** per-flow reservation with RSVP. It is precise but does not scale to large networks.',
          '**DiffServ:** packets are marked into classes, and each hop applies a per-hop behavior (PHB). It scales well and is the model used in practice.',
          '**Classification:** identifies traffic by DSCP, ACL, port or application recognition such as Cisco NBAR.',
          '**Marking:** writes the class into the 6-bit DSCP field of the IP header, or the 3-bit PCP field of an 802.1Q tag at Layer 2.',
          '**Trust boundary:** the point where the network starts to believe markings, usually the IP phone or access switch.',
        ] },
        { type: 'table', headers: ['Traffic', 'PHB', 'DSCP', 'Binary'], rows: [
          ['Voice media', 'EF', '46', '`101110`'],
          ['Interactive video', 'AF41', '34', '`100010`'],
          ['Call signaling', 'CS3', '24', '`011000`'],
          ['Network control such as OSPF, BGP', 'CS6', '48', '`110000`'],
          ['Best effort', 'DF', '0', '`000000`'],
        ] },
        {
          type: 'diagram',
          id: 'ch10-qos-queuing',
          title: 'QoS queuing on a WAN edge',
          caption: 'Packets are classified and queued by class. The scheduler serves the policed priority queue first, then the weighted classes, and the shaper holds output to the contract rate.',
          kind: 'working-diagram',
          mermaid: `flowchart LR
    IN["Packets reach egress policy"]
    CL["Classifier reads DSCP or ACL"]
    MK["Marker sets DSCP if untrusted"]
    PL["Policer caps priority rate"]
    subgraph QS["Output queues"]
        Q1["Voice EF - LLQ strict priority"]
        Q2["Video AF41 - CBWFQ 30 percent"]
        Q3["Business AF21 - CBWFQ 20 percent"]
        Q4["Default - fair queue with WRED"]
    end
    DR["WRED early drop"]
    SC["Scheduler serves priority first"]
    SH["Shaper - token bucket at CIR"]
    TX["Transmit on WAN link"]
    IN --> CL
    CL --> MK
    MK -->|EF| PL
    PL --> Q1
    MK -->|AF41| Q2
    MK -->|AF21| Q3
    MK -->|All others| Q4
    Q4 -->|Random discard| DR
    Q1 --> SC
    Q2 --> SC
    Q3 --> SC
    Q4 --> SC
    SC --> SH
    SH --> TX`,
        },
        { type: 'points', items: [
          '**FIFO:** one queue with no priority, so a bulk transfer can delay voice.',
          '**Priority queuing (PQ):** the high queue is always served first, so lower queues can starve.',
          '**CBWFQ:** class-based weighted fair queuing guarantees a minimum bandwidth to each class.',
          '**LLQ:** low-latency queuing is CBWFQ plus a policed strict-priority queue. A common guideline keeps priority traffic within 33 percent of the link.',
          '**Tail drop and WRED:** tail drop discards arrivals when a queue is full, which can cause TCP global synchronization. WRED drops some packets early, starting with lower-priority marks.',
          '**Policing:** drops or re-marks excess traffic and adds no queuing delay. ISPs use it at ingress to enforce a contract.',
          '**Shaping:** buffers excess traffic and sends it later, which adds delay. Customers use it at egress to stay within a contract.',
        ] },
        { type: 'paragraph', text: 'A **token bucket** models both policing and shaping. Tokens enter at rate `r` and the bucket holds at most `b`. Sending a packet of `L` bits uses `L` tokens, so idle periods build up credit that allows a short burst.' },
        {
          type: 'diagram',
          id: 'ch10-token-bucket',
          title: 'Token bucket decision',
          caption: 'A packet is sent only when enough tokens exist. A shaper holds a nonconforming packet, while a policer drops or re-marks it.',
          kind: 'working-flowchart',
          mermaid: `flowchart TD
    T1["Tokens added at rate r"]
    T2["Bucket holds at most b tokens"]
    P1["Packet of L bits arrives"]
    D1{"At least L tokens available?"}
    S1["Remove L tokens and send"]
    D2{"Shaper or policer?"}
    S2["Hold packet in queue"]
    S3["Drop or re-mark packet"]
    T1 --> T2
    T2 --> D1
    P1 --> D1
    D1 -->|Yes| S1
    D1 -->|No| D2
    D2 -->|Shaper| S2
    D2 -->|Policer| S3
    S2 -->|Retry when tokens arrive| D1`,
        },
        { type: 'callout', variant: 'formula', text: 'Maximum data in time `t`: `b + r x t`. Maximum burst duration at port speed `M`: `S = b / (M - r)`. Cisco shaping interval: `Tc = Bc / CIR`. Assured Forwarding: `DSCP of AFxy = 8x + 2y`, so AF41 is `34`.' },
        { type: 'callout', variant: 'exam-tip', text: 'Do not write `S = b / M`. Tokens keep arriving during the burst, so the bucket drains at the net rate `M - r`.' },
        { type: 'callout', variant: 'real-world', text: 'An ISP may sell 10 Mb/s over a 1 Gb/s handoff and police at 10 Mb/s. Without a shaper, bursts from the customer router are dropped with no regard for class. Markings are also rarely honored across the public internet, so QoS works best on private WANs. Home routers use queue management such as `fq_codel` or CAKE to limit bufferbloat.' },
        {
          type: 'example',
          title: 'Cisco MQC policy for a 10 Mb/s WAN edge',
          steps: [
            'Define classes: `class-map match-any VOICE` with `match dscp ef`, and `class-map match-any VIDEO` with `match dscp af41`.',
            'Create the queuing policy: `policy-map WAN-EDGE`, with `class VOICE` and `priority 2500`, `class VIDEO` and `bandwidth 3000`, and `class class-default` and `fair-queue`.',
            'Nest it under a shaper: `policy-map SHAPE-10M`, then `class class-default`, `shape average 10000000` and `service-policy WAN-EDGE`.',
            'Apply it: under `interface GigabitEthernet0/1`, add `service-policy output SHAPE-10M`. A 1 Gb/s port never congests at 10 Mb/s by itself, so the shaper is what makes the queues act.',
          ],
        },
        {
          type: 'command-lab',
          title: 'Read QoS counters on a Cisco router',
          command: 'show policy-map interface GigabitEthernet0/1',
          output: ` GigabitEthernet0/1

  Service-policy output: SHAPE-10M

    Class-map: class-default (match-any)
      412870 packets, 219048454 bytes
      5 minute offered rate 6120000 bps, drop rate 12000 bps
      shape (average) cir 10000000, bc 40000, be 40000

      Service-policy : WAN-EDGE

        Class-map: VOICE (match-any)
          184223 packets, 40160614 bytes
          5 minute offered rate 1744000 bps, drop rate 0000 bps
          Match: dscp ef (46)
          Priority: 2500 kbps, burst bytes 62500, b/w exceed drops: 0

        Class-map: VIDEO (match-any)
          96024 packets, 115228800 bytes
          5 minute offered rate 2880000 bps, drop rate 0000 bps
          Match: dscp af41 (34)
          (queue depth/total drops/no-buffer drops) 0/12/0
          bandwidth 3000 kbps

        Class-map: class-default (match-any)
          132623 packets, 63659040 bytes
          5 minute offered rate 1496000 bps, drop rate 12000 bps
          (queue depth/total drops/no-buffer drops/flowdrops) 3/758/0/758
          Fair-queue: per-flow queue limit 16 packets`,
          explanation: [
            '`shape (average) cir 10000000` caps the parent policy at 10 Mb/s, and `bc 40000` gives `Tc = 40000 / 10000000 = 4 ms`.',
            '`VOICE` matches `dscp ef (46)`. Each G.711 packet is 218 bytes at 50 packets per second, or 87.2 kb/s, so `1744000` bps is 20 calls. This is below the `2500` kbps priority rate, hence `b/w exceed drops: 0`.',
            '`VIDEO` has a guaranteed `3000` kbps. The value `0/12/0` means its queue is empty now and 12 packets have been dropped since the counters were cleared.',
            '`class-default` shows 758 drops, so congestion falls on best-effort traffic first, as designed.',
            'The child offered rates add up to the parent: `1744000 + 2880000 + 1496000 = 6120000` bps.',
          ],
        },
        {
          type: 'troubleshoot',
          symptom: 'Voice calls become choppy whenever the nightly backup runs across the WAN link.',
          checks: [
            'Markings: do voice packets arrive as `dscp ef`, or has an access switch rewritten them to `0`?',
            'Policy: does `show policy-map interface` show the policy outbound on the WAN port with `VOICE` counters rising?',
            'Shaper: is the shape rate at or just below the ISP contract? If it is higher, drops occur inside the ISP with no priority.',
            'Priority class: are `b/w exceed drops` rising? If so, there are more calls than the priority rate allows.',
          ],
          fix: 'Mark voice as `EF` at the trust boundary, apply LLQ under a shaper just below the contract rate, size the priority class for the number of calls, and put the backup in a low-priority class.',
        },
        {
          type: 'mini-lab',
          title: 'Shape a Linux interface with a token bucket',
          goal: 'Apply a real token bucket filter and measure its effect on throughput.',
          steps: [
            'On the receiver, run `iperf3 -s`. On the sender, record a baseline with `iperf3 -c 10.0.0.2 -t 10`.',
            'On the sender, apply the shaper: `sudo tc qdisc add dev eth0 root tbf rate 10mbit burst 32kbit latency 50ms`.',
            'Repeat the `iperf3` test, then read the counters with `tc -s qdisc show dev eth0`.',
            'Remove the shaper: `sudo tc qdisc del dev eth0 root`.',
          ],
          expected: 'Throughput falls to about 10 Mb/s, and the `tc` output shows nonzero `overlimits`, because packets had to wait for tokens.',
        },
      ],
    },
    {
      id: 'network-monitoring',
      title: 'Network monitoring: SNMP and NetFlow',
      blocks: [
        { type: 'paragraph', text: 'Engineers cannot manage what they cannot see. **Network monitoring** collects device health, link usage and traffic details, so that faults can be found and capacity can be planned. Two classic tools answer different questions: **SNMP** shows how busy a link is, and **NetFlow** shows who is using it.' },
        { type: 'points', items: [
          '**Manager (NMS):** polls devices, stores the data and raises alerts. Examples are Zabbix, LibreNMS and PRTG.',
          '**Agent:** software on the device that answers SNMP requests.',
          '**MIB and OID:** the MIB is a structured database of objects, and an OID is the numeric path to one object, such as `1.3.6.1.2.1.1.3.0` for `sysUpTime`.',
          '**Operations:** `Get`, `GetNext`, `GetBulk`, `Set`, `Trap` and `Inform`.',
          '**Ports:** polling goes to UDP `161` on the agent. Traps and informs go to UDP `162` on the manager.',
        ] },
        {
          type: 'diagram',
          id: 'ch10-snmp-exchange',
          title: 'SNMP polling and notifications',
          caption: 'The manager polls the agent on UDP 161, while the agent pushes events to the manager on UDP 162. Only an inform is acknowledged.',
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant M as NMS
    participant A as Agent
    M->>A: GetRequest sysUpTime to UDP 161
    A->>M: Response with value
    M->>A: GetBulkRequest ifTable to UDP 161
    A->>M: Response with many rows
    Note over A: Link goes down
    A->>M: Trap linkDown to UDP 162
    A->>M: InformRequest to UDP 162
    M->>A: Response acknowledges inform`,
        },
        { type: 'table', headers: ['Version', 'Security', 'Notes'], rows: [
          ['SNMPv1', 'Community string in plaintext', 'Legacy, 32-bit counters'],
          ['SNMPv2c', 'Community string in plaintext', 'Adds `GetBulk`, `Inform` and 64-bit counters'],
          ['SNMPv3', 'Users with authentication and encryption (`authPriv`)', 'The right choice for production'],
        ] },
        {
          type: 'command-lab',
          title: 'Poll a router with SNMP',
          command: 'snmpget -v2c -c netlab-ro 192.168.1.1 sysName.0 sysUpTime.0 ifDescr.2 ifHighSpeed.2 ifHCInOctets.2',
          output: `SNMPv2-MIB::sysName.0 = STRING: edge-r1
DISMAN-EVENT-MIB::sysUpTimeInstance = Timeticks: (34567800) 4 days, 0:01:18.00
IF-MIB::ifDescr.2 = STRING: GigabitEthernet0/1
IF-MIB::ifHighSpeed.2 = Gauge32: 1000
IF-MIB::ifHCInOctets.2 = Counter64: 918273645`,
          explanation: [
            '`sysName` returns the configured hostname, `edge-r1`.',
            '`sysUpTime` counts hundredths of a second: `34567800` ticks is 345678 seconds, or 4 days and 78 seconds. A sudden drop means a reboot.',
            '`ifDescr.2` shows that interface index `2` is `GigabitEthernet0/1`, and `ifHighSpeed` gives its speed in Mb/s, here 1 Gb/s.',
            '`ifHCInOctets` is a 64-bit count of received bytes. A single value means little, so subtract two polls as shown next.',
          ],
        },
        {
          type: 'example',
          title: 'Link utilization from two SNMP polls',
          steps: [
            'Two polls 300 seconds apart give `918273645` and `2793273645`, a difference of `1875000000` octets.',
            'Average rate: `1875000000 x 8 / 300 = 50000000` b/s, or 50 Mb/s.',
            'Utilization on a 1 Gb/s link: `50 / 1000 = 5` percent. A 5-minute average can hide short bursts.',
          ],
        },
        { type: 'points', items: [
          '**Flow:** packets that share key fields. Traditional NetFlow uses 7 keys: source IP, destination IP, source port, destination port, protocol, ToS and input interface.',
          '**Exporter:** the device keeps flow records in a cache and exports them when a flow ends or times out.',
          '**Collector and analyzer:** receive records, often on UDP `2055`, and report top talkers and applications.',
          '**Versions:** v5 is a fixed IPv4 format, v9 is template-based (RFC 3954), and IPFIX is the IETF standard derived from v9 (RFC 7011, port `4739`).',
          '**Sampling:** sFlow and sampled NetFlow inspect 1 in N packets to keep load low on fast links.',
        ] },
        { type: 'table', headers: ['Tool', 'Question it answers', 'Data volume'], rows: [
          ['SNMP', 'Is it up? How busy is it?', 'Low'],
          ['Syslog (UDP `514`)', 'What events happened?', 'Low to medium'],
          ['NetFlow or IPFIX', 'Who talked to whom, and how much?', 'Medium'],
          ['Streaming telemetry (gNMI)', 'What is the state, second by second?', 'Medium to high'],
          ['Packet capture', 'What exactly was in the packets?', 'Very high'],
        ] },
        { type: 'callout', variant: 'remember', text: 'SNMP gives counters, NetFlow gives conversations, and packet capture gives full content. Start with the cheapest view, and go deeper only when you need to.' },
        { type: 'callout', variant: 'real-world', text: 'An office may poll with LibreNMS and view graphs in Grafana. ISPs use NetFlow for peering analysis and DDoS detection. In the cloud, VPC Flow Logs provide flow records and provider metrics replace SNMP.' },
        {
          type: 'troubleshoot',
          symptom: 'The NMS shows a router as down, but `ping` to the router works.',
          checks: [
            'From the NMS, run `snmpget -v2c -c netlab-ro 192.168.1.1 sysUpTime.0`. Does it time out?',
            'Do the SNMP version and community string, or the SNMPv3 user, match on both sides?',
            'Does the ACL in `snmp-server community netlab-ro RO 10` permit the NMS address?',
            'Does a firewall pass UDP `161`? Run `tcpdump -ni eth0 udp port 161` on the NMS to see whether replies return.',
          ],
          fix: 'Correct the mismatch, usually the community string or ACL. An agent stays silent on a wrong community, so a timeout is the normal symptom. Move to SNMPv3 `authPriv` in production.',
        },
      ],
    },
    {
      id: 'automation-career-roadmap',
      title: 'Automation and career roadmap',
      blocks: [
        { type: 'paragraph', text: 'Configuring 500 devices by hand is slow and error-prone. **Network automation** uses software to apply, check and document changes consistently, and treats configuration like source code. This section gives an overview of the tools and then shows how these skills fit into a career.' },
        { type: 'points', items: [
          '**YANG (RFC 7950):** a data modeling language that describes device configuration and state.',
          '**NETCONF (RFC 6241):** XML-based configuration over SSH on port `830`, with candidate configurations and commit.',
          '**RESTCONF (RFC 8040):** HTTP methods over HTTPS, using JSON or XML.',
          '**gNMI:** gRPC-based configuration and streaming telemetry.',
          '**Ansible:** an agentless tool that runs YAML playbooks over SSH or APIs.',
          '**Python libraries:** Netmiko drives SSH sessions, and NAPALM gives one interface across vendors.',
          '**Terraform:** declarative infrastructure as code, widely used to build VPCs, subnets and load balancers.',
          '**Idempotency:** applying the same desired state twice changes the device only the first time.',
        ] },
        {
          type: 'diagram',
          id: 'ch10-automation-pipeline',
          title: 'Network change pipeline',
          caption: 'A change is reviewed and tested like software before it reaches production, and a failed post-check triggers a rollback.',
          kind: 'working-flowchart',
          mermaid: `flowchart TD
    G1["Engineer commits change to Git"]
    G2["Peer reviews the change"]
    G3["CI runs lint and syntax checks"]
    G4["Test in a virtual lab"]
    G5{"Tests pass?"}
    G6["Deploy with Ansible"]
    G7["Run post-change checks"]
    G8{"Network healthy?"}
    G9["Change complete"]
    G10["Roll back to previous version"]
    G1 --> G2
    G2 --> G3
    G3 --> G4
    G4 --> G5
    G5 -->|No| G1
    G5 -->|Yes| G6
    G6 --> G7
    G7 --> G8
    G8 -->|Yes| G9
    G8 -->|No| G10`,
        },
        {
          type: 'command-lab',
          title: 'Run an idempotent Ansible playbook',
          command: 'ansible-playbook -i hosts.ini vlan20.yml',
          output: `PLAY [Ensure VLAN 20 exists] ***************************************

TASK [Create VLAN 20 on access switches] ***************************
changed: [sw1]
ok: [sw2]

PLAY RECAP *********************************************************
sw1 : ok=1  changed=1  unreachable=0  failed=0  skipped=0  rescued=0  ignored=0
sw2 : ok=1  changed=0  unreachable=0  failed=0  skipped=0  rescued=0  ignored=0`,
          explanation: [
            '`PLAY` names the goal, stated as a desired state and not as a list of commands.',
            '`changed: [sw1]` means VLAN 20 was missing on `sw1`, so Ansible created it.',
            '`ok: [sw2]` means VLAN 20 was already there, so nothing was touched. This is idempotency.',
            '`PLAY RECAP` totals each device. `unreachable=0` and `failed=0` show that the run succeeded everywhere.',
          ],
        },
        { type: 'paragraph', text: 'Network engineering has moved from configuring boxes toward designing and programming systems, but fundamentals still matter most. The stages below are a typical path, and time spent at each stage varies. Certification names change, so check the vendor site before you plan an exam.' },
        { type: 'table', headers: ['Stage', 'Typical role', 'Focus skills', 'Useful certifications'], rows: [
          ['Foundation', 'Student or intern', 'TCP/IP, subnetting, Linux, Wireshark, VLAN and routing labs', 'CompTIA Network+, Cisco CCNA'],
          ['0 to 2 years', 'NOC or support engineer', 'Monitoring, tickets, troubleshooting, change process', 'Cisco CCNA'],
          ['2 to 5 years', 'Network engineer', 'OSPF, BGP, firewalls, VPN, Python, Ansible', 'CCNP Enterprise, Juniper JNCIP'],
          ['Specialist', 'Cloud, security, data center or automation engineer', 'VPC design, zero trust, VXLAN EVPN, CI pipelines', 'AWS Advanced Networking, Azure AZ-700, CCNP Security'],
          ['Senior', 'Network architect', 'Multi-site design, capacity, cost, mentoring', 'CCIE, JNCIE'],
        ] },
        {
          type: 'diagram',
          id: 'ch10-career-roadmap',
          title: 'Network engineer career roadmap',
          caption: 'Most engineers build general skills first, then choose a specialization, and may later move into architecture.',
          kind: 'flowchart',
          mermaid: `flowchart TD
    R1["Foundations and home labs"]
    R2["NOC or support engineer"]
    R3["Network engineer"]
    R4{"Choose a specialization"}
    R5["Cloud network engineer"]
    R6["Network security engineer"]
    R7["Data center engineer"]
    R8["Network automation engineer"]
    R9["Network architect"]
    R1 --> R2
    R2 --> R3
    R3 --> R4
    R4 -->|Cloud| R5
    R4 -->|Security| R6
    R4 -->|Fabric| R7
    R4 -->|Code| R8
    R5 --> R9
    R6 --> R9
    R7 --> R9
    R8 --> R9`,
        },
        { type: 'points', items: [
          '**Build a lab:** use Cisco Packet Tracer, GNS3, EVE-NG, Containerlab or Mininet on your own laptop.',
          '**Show your work:** keep configurations, scripts and lab write-ups in a public Git repository, with no real credentials.',
          '**Prepare for interviews:** subnet by hand, explain what happens during `ping` and a web request, and read `traceroute` output and packet captures.',
        ] },
        { type: 'callout', variant: 'remember', text: 'Fundamentals outlast products. Subnetting appears in VPC design, routing in leaf-spine fabrics, and TCP behavior in QoS and CDN tuning.' },
      ],
    },
  ],
  flashcards: [
    { front: 'What are the three planes of a network device?', back: 'The data plane forwards packets, the control plane builds forwarding tables, and the management plane configures and monitors the device.' },
    { front: 'Northbound vs southbound API in SDN?', back: 'Northbound connects applications to the controller, usually REST. Southbound connects the controller to devices, such as OpenFlow or NETCONF.' },
    { front: 'Name the main fields of an OpenFlow flow entry.', back: 'Match fields, priority, counters, instructions, timeouts and cookie.' },
    { front: 'SDN vs NFV in one line each?', back: 'SDN separates control from forwarding. NFV separates network functions from dedicated hardware.' },
    { front: 'What are the ETSI NFV building blocks?', back: 'VNFs, NFVI and MANO. MANO contains the NFVO, VNFM and VIM.' },
    { front: 'Security group vs network ACL?', back: 'A security group is stateful, allow-only and on the interface. A NACL is stateless, allows and denies in numbered order, and is on the subnet.' },
    { front: 'Which addresses does AWS reserve in every subnet?', back: 'The first four (network, VPC router, DNS, future use) and the last address, so 5 in total.' },
    { front: 'no-store vs no-cache?', back: 'no-store forbids storing the response. no-cache allows storing it but requires revalidation before each reuse.' },
    { front: 'What is the wiring rule of leaf-spine?', back: 'Every leaf connects to every spine. Leaves do not link to leaves and spines do not link to spines.' },
    { front: 'What are the key VXLAN numbers?', back: 'UDP destination port 4789, a 24-bit VNI with about 16 million segments, and 50 bytes of overhead.' },
    { front: 'Policing vs shaping?', back: 'Policing drops or re-marks excess traffic with no added delay. Shaping buffers excess traffic and sends it later, which adds delay.' },
    { front: 'What are the DSCP values of EF and AF41?', back: 'EF is 46, binary 101110. AF41 is 34, binary 100010.' },
    { front: 'What do SNMP and NetFlow each tell you?', back: 'SNMP reports device health and counters, such as link utilization. NetFlow reports who talked to whom, on which ports, and how much.' },
  ],
  quiz: [
    {
      id: 'ch10-q1',
      question: 'In SDN, which function moves from individual switches to a central controller?',
      options: ['Packet forwarding at line rate', 'Control plane decision making', 'Ethernet frame encapsulation', 'Physical layer signaling'],
      answerIndex: 1,
      explanation: 'SDN centralizes the control plane. The switches keep the data plane, so they still forward packets and encapsulate frames.',
      difficulty: 'easy',
      topic: 'SDN',
    },
    {
      id: 'ch10-q2',
      question: 'Which load balancer can send /api requests and /images requests to different server pools?',
      options: ['A Layer 2 switch with MAC learning', 'A Layer 4 balancer using only the 5-tuple', 'A Layer 7 balancer that reads HTTP', 'A DNS server with one A record'],
      answerIndex: 2,
      explanation: 'The URL path is inside the HTTP request, so only a Layer 7 balancer can read it and route on it.',
      difficulty: 'easy',
      topic: 'Cloud networking',
    },
    {
      id: 'ch10-q3',
      question: 'What is the main idea of NFV?',
      options: ['Run network functions as software on standard servers', 'Replace software routers with custom ASIC appliances', 'Separate the control plane from the data plane', 'Encrypt all traffic between data centers'],
      answerIndex: 0,
      explanation: 'NFV decouples network functions from dedicated hardware. Separating the control and data planes is the idea of SDN.',
      difficulty: 'easy',
      topic: 'NFV',
    },
    {
      id: 'ch10-q4',
      question: 'What makes a VPC subnet public?',
      options: ['Its CIDR block is outside the RFC 1918 ranges', 'Its instances have no security group', 'Its route table has a default route to a NAT gateway', 'Its route table has a default route to an internet gateway'],
      answerIndex: 3,
      explanation: 'A public subnet is defined by its route to an internet gateway. A default route to a NAT gateway describes a private subnet.',
      difficulty: 'easy',
      topic: 'Cloud networking',
    },
    {
      id: 'ch10-q5',
      question: 'A playbook run twice changes a device only the first time. What is this property called?',
      options: ['Idempotency', 'Redundancy', 'Oversubscription', 'Encapsulation'],
      answerIndex: 0,
      explanation: 'An idempotent task checks the current state and acts only when it differs from the desired state.',
      difficulty: 'easy',
      topic: 'Automation',
    },
    {
      id: 'ch10-q6',
      question: 'On which default UDP port does an SNMP manager receive traps?',
      options: ['161', '162', '514', '2055'],
      answerIndex: 1,
      explanation: 'Traps and informs go to UDP 162 on the manager. UDP 161 is for polling the agent, 514 is syslog, and 2055 is a common NetFlow port.',
      difficulty: 'easy',
      topic: 'Monitoring',
    },
    {
      id: 'ch10-q7',
      question: 'An OpenFlow 1.3 switch receives a packet that matches only a table-miss entry with action CONTROLLER. What does the switch send?',
      options: ['Flow-Mod', 'Packet-Out', 'Packet-In', 'Features-Reply'],
      answerIndex: 2,
      explanation: 'Packet-In goes from switch to controller. Flow-Mod and Packet-Out travel from controller to switch, and Features-Reply belongs to connection setup.',
      difficulty: 'medium',
      topic: 'SDN',
    },
    {
      id: 'ch10-q8',
      question: 'A NACL allows inbound TCP 443 and allows outbound traffic only to TCP port 443. HTTPS clients cannot load a site in that subnet. Why?',
      options: ['NACLs cannot filter TCP traffic', 'Server replies to ephemeral client ports are blocked', 'The security group overrides the NACL', 'An internet gateway cannot carry TLS'],
      answerIndex: 1,
      explanation: 'A NACL is stateless. Replies go to the ephemeral port of the client, such as 50000, so outbound 1024-65535 must also be allowed.',
      difficulty: 'medium',
      topic: 'Cloud networking',
    },
    {
      id: 'ch10-q9',
      question: 'A WAN link is at 95 percent utilization and you must find which hosts are responsible. Which tool answers this most directly?',
      options: ['NetFlow or IPFIX records', 'SNMP sysUpTime polling', 'Syslog severity filtering', 'ICMP ping to the next hop'],
      answerIndex: 0,
      explanation: 'Flow records list source, destination, ports and volume, so they reveal top talkers. SNMP counters show how busy a link is, but not who is using it.',
      difficulty: 'medium',
      topic: 'Monitoring',
    },
    {
      id: 'ch10-q10',
      question: 'A response carries Cache-Control: no-cache. What may a CDN do?',
      options: ['Never store the response', 'Serve it for one day without checks', 'Serve it only to the client that first requested it', 'Store it but revalidate with the origin before each reuse'],
      answerIndex: 3,
      explanation: 'no-cache allows storage but requires revalidation. The directive that forbids storage is no-store.',
      difficulty: 'medium',
      topic: 'CDN',
    },
    {
      id: 'ch10-q11',
      question: 'A leaf has 40 x 10 Gb/s downlinks and 4 x 40 Gb/s uplinks. What is its oversubscription ratio?',
      options: ['2.5:1', '2:1', '1:1', '4:1'],
      answerIndex: 0,
      explanation: 'Downlink capacity is 400 Gb/s and uplink capacity is 160 Gb/s, so 400 / 160 = 2.5:1.',
      difficulty: 'medium',
      topic: 'Data center',
    },
    {
      id: 'ch10-q12',
      question: 'Which queuing method gives voice a strict-priority queue and guarantees minimum bandwidth to other classes?',
      options: ['FIFO', 'LLQ', 'WRED', 'Tail drop'],
      answerIndex: 1,
      explanation: 'LLQ is CBWFQ plus a policed strict-priority queue. WRED and tail drop are drop methods, and FIFO has no classes.',
      difficulty: 'medium',
      topic: 'QoS',
    },
    {
      id: 'ch10-q13',
      question: 'A token bucket has size 1 Mb and rate 10 Mb/s, and the port runs at 50 Mb/s. Starting full, how long can it send at port speed?',
      options: ['20 ms', '100 ms', '50 ms', '25 ms'],
      answerIndex: 3,
      explanation: 'S = b / (M - r) = 1 / (50 - 10) = 0.025 s = 25 ms. The value 20 ms comes from b / M, which ignores tokens that keep arriving during the burst.',
      difficulty: 'hard',
      topic: 'QoS',
    },
    {
      id: 'ch10-q14',
      question: 'A VXLAN fabric must carry 1500-byte inner IP packets without fragmentation. What is the minimum underlay IP MTU?',
      options: ['1500 bytes', '1518 bytes', '1550 bytes', '1600 bytes'],
      answerIndex: 2,
      explanation: 'The inner frame is 1500 + 14 = 1514 bytes. Adding VXLAN 8, UDP 8 and outer IP 20 gives 1550 bytes. 1600 would also work, but it is not the minimum.',
      difficulty: 'hard',
      topic: 'Data center',
    },
    {
      id: 'ch10-q15',
      question: 'A CDN has a hit ratio of 80 percent, a hit latency of 30 ms and a miss latency of 230 ms. What is the average latency?',
      options: ['46 ms', '130 ms', '190 ms', '70 ms'],
      answerIndex: 3,
      explanation: '0.8 x 30 + 0.2 x 230 = 24 + 46 = 70 ms. The value 130 ms is an unweighted mean, and 190 ms swaps the weights.',
      difficulty: 'hard',
      topic: 'CDN',
    },
  ],
  importantQuestions: [
    {
      q: 'Differentiate the control plane and the data plane.',
      marks: 2,
      modelAnswer: 'The control plane decides where traffic should go and builds forwarding tables, for example with OSPF or an SDN controller.\nThe data plane forwards each packet at high speed using those tables.',
    },
    {
      q: 'State two differences between traffic policing and traffic shaping.',
      marks: 2,
      modelAnswer: 'Policing drops or re-marks excess traffic, while shaping buffers it and sends it later.\nPolicing adds no queuing delay and can act on ingress or egress, while shaping adds delay and acts on egress.',
    },
    {
      q: 'Explain what happens when the first packet of a new flow reaches an OpenFlow switch using reactive forwarding.',
      marks: 5,
      modelAnswer: '1. The switch compares the headers with its flow table, and only the table-miss entry (priority 0, all wildcards) matches.\n2. The switch sends a Packet-In to the controller over TCP 6653, with the headers and a buffer id or the packet.\n3. The controller uses its global topology view to choose a path.\n4. It sends a Flow-Mod with match, priority, output action and timeouts, and a Packet-Out to release the first packet.\n5. Later packets match the new entry and are forwarded without the controller.\nThe trade-off is first-packet delay and controller load, which proactive installation avoids.',
    },
    {
      q: 'Compare security groups and network ACLs in a VPC. Why must a NACL permit ephemeral ports?',
      marks: 5,
      modelAnswer: 'Scope: a security group applies to a network interface, and a NACL applies to a subnet.\nState: a security group is stateful, and a NACL is stateless.\nRules: a security group has allow rules only, and all are considered. A NACL has allow and deny rules, evaluated in number order with first match winning.\nEphemeral ports: a client connects from a high source port to server port 443. The reply goes to that high port, and since a NACL does not track connections, outbound 1024-65535 must be allowed explicitly.',
    },
    {
      q: 'Explain how a CDN serves a request, covering request routing, hit, miss and revalidation.',
      marks: 5,
      modelAnswer: 'Routing: the site name is a CNAME to the CDN, and GeoDNS or anycast leads the client to a nearby PoP.\nHit: the edge holds a copy within its TTL and serves it directly, with the lowest latency.\nMiss: the edge has no copy, so it fetches from the origin or a shield, stores the object if headers allow, and replies.\nRevalidation: for a stale copy, the edge sends If-None-Match with the ETag. A 304 reply refreshes the TTL and the copy is served, while a 200 reply replaces it.\nAverage latency = h x T_hit + (1 - h) x T_miss, so a higher hit ratio lowers both latency and origin load.',
    },
    {
      q: 'Explain leaf-spine data center architecture with a neat diagram. Compare it with the three-tier design, and explain ECMP, oversubscription and VXLAN.',
      marks: 10,
      modelAnswer: 'Diagram: spines at the top, leaves below, every leaf linked to every spine, and servers attached to leaves.\nThree-tier limits: it was built for north-south traffic, STP blocks redundant links, server paths vary from 1 to 5 switches, and aggregation becomes a bottleneck for east-west traffic.\nLeaf-spine rules: leaves connect only to spines and servers, and spines connect only to leaves. Cross-leaf traffic always crosses 3 switches, which gives predictable latency.\nECMP: each leaf has one equal-cost route per spine and hashes the 5-tuple to select one. All links are active, packets of a flow stay in order, and a failed spine removes only its share of capacity.\nOversubscription: downlink capacity divided by uplink capacity on a leaf. 48 x 25G down and 6 x 100G up gives 1200 / 600 = 2:1.\nScaling: add spines for bandwidth and leaves for servers. Spine port count limits the number of leaves.\nVXLAN: carries Layer 2 segments over the routed underlay using MAC-in-UDP on port 4789 with a 24-bit VNI. VTEPs on leaves encapsulate frames, and BGP EVPN advertises reachability.',
    },
    {
      q: 'Explain the QoS tools on a WAN edge router: classification, marking, queuing, congestion avoidance and shaping. Include the token bucket with a numerical example.',
      marks: 10,
      modelAnswer: 'Classification: identifies traffic by DSCP, ACL, port or application.\nMarking: writes a class into the DSCP field at the trust boundary, for example EF 46 for voice and AF41 34 for video, so later hops can act quickly.\nQueuing: LLQ gives voice a policed strict-priority queue, and CBWFQ guarantees minimum bandwidth to other classes. The scheduler serves the priority queue first.\nCongestion avoidance: tail drop can cause TCP global synchronization. WRED drops some packets early, starting with lower-priority marks.\nShaping: buffers excess traffic to meet a contract rate and adds delay, while a policer drops or re-marks it.\nToken bucket: tokens arrive at rate r and the bucket holds at most b. A packet of L bits needs L tokens. Maximum data in time t is b + r x t, and burst duration at port speed M is S = b / (M - r).\nExample: b = 1 Mb, r = 10 Mb/s and M = 100 Mb/s give S = 1 / 90 = 11.11 ms.',
    },
  ],
  numericals: [
    {
      question: 'A router shapes traffic with a token bucket. The token rate is r = 10 Mb/s, the bucket size is b = 125 KB, and the port runs at M = 100 Mb/s. Starting with a full bucket, find (a) the maximum burst duration at port speed, (b) the data sent in that burst, and (c) the maximum data allowed in any 1 second interval. Take 1 KB = 1000 bytes.',
      steps: [
        'Convert the bucket to bits: b = 125 KB x 8 = 1000 kb = 1 Mb.',
        'During a burst, tokens leave at M and arrive at r, so the net drain is 100 - 10 = 90 Mb/s.',
        'Burst duration: S = b / (M - r) = 1 Mb / 90 Mb/s = 0.01111 s = 11.11 ms.',
        'Burst data: M x S = 100 Mb/s x 0.01111 s = 1.111 Mb, or about 138.9 KB.',
        'Check: b + r x S = 1 + 10 x 0.01111 = 1.111 Mb, which matches.',
        'Maximum in 1 second: b + r x t = 1 Mb + 10 Mb/s x 1 s = 11 Mb.',
      ],
      answer: 'S = 11.11 ms, burst data = 1.111 Mb (about 138.9 KB), maximum in 1 s = 11 Mb',
    },
    {
      question: 'A leaf-spine fabric uses leaves with 48 x 25 Gb/s server ports and 6 x 100 Gb/s uplinks. Each spine has 32 x 100 Gb/s ports, and each leaf connects once to each spine. Find (a) the oversubscription ratio, (b) the number of spines and the maximum number of leaves, (c) the maximum number of servers at one port each, and (d) the ratio after one spine fails.',
      steps: [
        'Downlink capacity per leaf = 48 x 25 = 1200 Gb/s.',
        'Uplink capacity per leaf = 6 x 100 = 600 Gb/s.',
        'Oversubscription = 1200 / 600 = 2:1.',
        'Each leaf has one uplink per spine, so 6 uplinks means 6 spines.',
        'Each leaf uses one port on every spine, so 32 spine ports allow at most 32 leaves.',
        'Maximum servers = 32 x 48 = 1536.',
        'After one spine fails, uplink capacity = 5 x 100 = 500 Gb/s, so the ratio = 1200 / 500 = 2.4:1.',
      ],
      answer: '2:1, 6 spines and 32 leaves, 1536 servers, 2.4:1 after one spine fails',
    },
    {
      question: 'A CDN serves 10,000 requests per second with an average object size of 200 KB. A hit takes 20 ms and a miss takes 200 ms. Find the average latency, origin requests per second and origin bandwidth at a hit ratio of (a) 90 percent and (b) 95 percent. Take 1 MB = 1000 KB.',
      steps: [
        'At 90 percent: T_avg = 0.90 x 20 + 0.10 x 200 = 18 + 20 = 38 ms.',
        'Misses = 10,000 x 0.10 = 1000 requests per second.',
        'Origin bandwidth = 1000 x 200 KB/s = 200 MB/s = 1600 Mb/s = 1.6 Gb/s.',
        'At 95 percent: T_avg = 0.95 x 20 + 0.05 x 200 = 19 + 10 = 29 ms.',
        'Misses = 10,000 x 0.05 = 500 requests per second.',
        'Origin bandwidth = 500 x 200 KB/s = 100 MB/s = 800 Mb/s = 0.8 Gb/s, half of the earlier value.',
      ],
      answer: '(a) 38 ms, 1000 requests/s, 1.6 Gb/s; (b) 29 ms, 500 requests/s, 0.8 Gb/s',
    },
    {
      question: 'An AWS VPC uses 10.20.0.0/16. Each of 3 availability zones needs one private subnet for 1000 instances, and AWS reserves 5 addresses per subnet. Find the smallest suitable prefix, allocate three subnets from the start of the VPC range, list the reserved addresses of the first subnet, and find how many subnets of that size fit in the VPC.',
      steps: [
        'Need 2^n - 5 >= 1000. n = 9 gives 507, which is too few, and n = 10 gives 1019, which is enough.',
        'Prefix = 32 - 10 = /22, a block of 1024 addresses, or 4 in the third octet.',
        'Subnet 1: 10.20.0.0/22, range 10.20.0.0 to 10.20.3.255.',
        'Subnet 2: 10.20.4.0/22, range 10.20.4.0 to 10.20.7.255.',
        'Subnet 3: 10.20.8.0/22, range 10.20.8.0 to 10.20.11.255.',
        'Reserved in subnet 1: 10.20.0.0, 10.20.0.1, 10.20.0.2, 10.20.0.3 and 10.20.3.255.',
        'Number of /22 subnets in a /16 = 2^(22 - 16) = 64.',
      ],
      answer: '/22 with 1019 usable addresses each: 10.20.0.0/22, 10.20.4.0/22 and 10.20.8.0/22; 64 such subnets fit',
    },
  ],
  keyTerms: [
    'Control plane: Logic that decides where traffic goes, such as routing protocols',
    'Data plane: Fast path that forwards packets using installed tables',
    'SDN controller: Central software that programs devices through southbound APIs',
    'OpenFlow: Southbound protocol that installs match-action flow entries in switches',
    'NFV: Running network functions such as firewalls as software on standard servers',
    'VPC: Logically isolated private network defined inside a public cloud',
    'Security group: Stateful allow-only filter applied to a cloud network interface',
    'Network ACL: Stateless subnet filter with numbered allow and deny rules',
    'Load balancer: Device that spreads requests across a pool of healthy servers',
    'CDN: Distributed edge servers that cache content close to users',
    'Cache hit ratio: Fraction of requests served from cache without contacting the origin',
    'Leaf-spine: Two-tier Clos fabric in which every leaf connects to every spine',
    'Oversubscription ratio: Total downlink capacity divided by total uplink capacity on a switch',
    'ECMP: Hash-based forwarding of flows over several equal-cost next hops',
    'VXLAN: Overlay that tunnels Ethernet frames in UDP using a 24-bit VNI',
    'DSCP: Six-bit IP header value that selects the per-hop QoS treatment',
    'Token bucket: Rate limiter that sends data only when enough tokens are available',
    'SNMP: Protocol to poll device counters and receive traps, on UDP 161 and 162',
    'NetFlow: Export of per-flow traffic records from network devices to a collector',
    'YANG: Data modeling language that describes device configuration and state',
  ],
  formulas: [
    { name: 'Oversubscription ratio', expression: 'Ratio = total downlink capacity / total uplink capacity', note: 'Calculated per leaf. 1:1 is non-blocking.' },
    { name: 'Leaf-spine scale', expression: 'Max leaves = ports per spine, spines = uplinks per leaf', note: 'Assumes one link from each leaf to each spine.' },
    { name: 'Cache hit ratio', expression: 'h = hits / (hits + misses)' },
    { name: 'Average CDN latency', expression: 'T_avg = h x T_hit + (1 - h) x T_miss', note: 'h is the hit ratio as a fraction.' },
    { name: 'Token bucket maximum data', expression: 'Data(t) = b + r x t', note: 'b is bucket size and r is token rate.' },
    { name: 'Token bucket burst duration', expression: 'S = b / (M - r)', note: 'M is the port speed and must exceed r.' },
    { name: 'Shaper interval', expression: 'Tc = Bc / CIR', note: 'Bc is the committed burst in bits.' },
    { name: 'Assured Forwarding DSCP', expression: 'DSCP of AFxy = 8x + 2y', note: 'AF41 = 34.' },
    { name: 'Usable addresses in an AWS subnet', expression: 'Usable = 2^(32 - prefix) - 5' },
    { name: 'Link utilization from SNMP', expression: 'Utilization = (delta octets x 8) / (delta t x speed) x 100', note: 'Speed in bits per second, delta t in seconds, result in percent.' },
  ],
  handsOnChecklist: [
    'Build a one-switch Mininet network with a Ryu controller, ping between hosts, and compare the flow table before and after.',
    'Capture OpenFlow traffic in Wireshark and find one Packet-In, its Flow-Mod and its Packet-Out.',
    'Use dig and curl -I on three large websites, and record the CNAME, Cache-Control, Age and cache status values.',
    'Draw a two-zone VPC on paper with public, app and data subnets, then calculate each CIDR block and its usable addresses.',
    'Limit a Linux interface with tc tbf, measure throughput with iperf3, and compare it with the configured rate.',
    'Install snmpd on a Linux VM, poll it twice with snmpget, and calculate interface utilization from the two counters.',
  ],
};

export default chapter;

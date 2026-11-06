import type { Chapter } from '@/lib/types';

const chapter: Chapter = {
  slug: 'intro-models',
  number: 1,
  title: 'Introduction, OSI and TCP/IP models',
  shortTitle: 'Intro and models',
  summary:
    'This chapter builds the vocabulary for the whole course: what a network is, the devices and media that form it, and how networks are classified by scale and topology. It then explains protocols and standards, the OSI and TCP/IP layer models and encapsulation header by header, introduces delay and throughput calculations, and ends with how ISPs and IXPs join separate networks into the Internet.',
  estMinutes: 75,
  learningObjectives: [
    'Define a computer network and identify its components, devices and the layer each device works at.',
    'Classify networks as PAN, LAN, MAN or WAN and compare bus, star, ring, mesh, tree and hybrid topologies.',
    'Explain the OSI and TCP/IP layers, map one to the other, and name the PDU, address and protocols at each layer.',
    'Trace encapsulation and decapsulation of a web request with correct headers, fields and sizes.',
    'Calculate transmission, propagation, nodal and end-to-end delay, throughput and bandwidth-delay product.',
    'Describe how ISPs, IXPs, transit and peering join independent networks into the Internet.',
  ],
  overviewVideoId: 'ch01-overview',
  sections: [
    {
      id: 'network-basics-and-devices',
      title: 'What a network is and what it is made of',
      blocks: [
        {
          type: 'paragraph',
          text: "A **computer network** is a set of autonomous devices joined by communication links so that they can exchange data and share resources. Each device can run on its own; the network only lets them cooperate. Two phones sharing a file and the global Internet both fit this definition.",
        },
        {
          type: 'points',
          items: [
            "**Message:** the information being moved, such as a web page, a file or a voice sample.",
            "**Sender:** the device that originates the message, such as a laptop.",
            "**Receiver:** the device the message is meant for, such as a web server.",
            "**Transmission medium:** the physical path, such as copper, optical fibre or radio.",
            "**Protocol:** the rules both ends follow. Without one, connected devices see only meaningless bits.",
          ],
        },
        {
          type: 'paragraph',
          text: "Devices play one of two roles. **End systems**, also called hosts, run applications: laptops, phones, servers, cameras. **Intermediate systems** such as switches and routers run no user applications and only move traffic between hosts.",
        },
        {
          type: 'table',
          headers: ['Device', 'Works up to', 'Reads', 'Job', 'Where you meet it'],
          rows: [
            ['NIC', 'L1 and L2', 'Frames for its own MAC', 'Connects a host to the medium and holds its MAC address', 'Every host'],
            ['Hub', 'L1 Physical', 'Nothing, only signals', 'Repeats bits out of all other ports; all ports share one collision domain', 'Legacy networks only'],
            ['Switch', 'L2 Data Link', 'Destination MAC', 'Forwards frames using a learned MAC table; each port is its own collision domain', 'Office floors, home LAN ports'],
            ['Access point', 'L2 Data Link', '802.11 and MAC headers', 'Bridges Wi-Fi clients onto the wired LAN', 'Home routers, office ceilings'],
            ['Router', 'L3 Network', 'Destination IP', 'Forwards packets between networks using a routing table; stops broadcasts', 'Home gateway, ISP core, cloud VPC'],
            ['Modem or ONT', 'L1, some L2', 'Line signals', 'Converts between the LAN and the ISP line: DSL, cable or fibre', 'Where the ISP line enters'],
            ['Firewall', 'L3 to L7', 'IPs, ports, sessions', 'Permits or blocks traffic by policy', 'Office edge, cloud security groups'],
          ],
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: "The box an ISP installs at home is not one device. It usually combines a **modem or ONT**, a **router with NAT**, a small **switch**, a **Wi-Fi access point**, a **DHCP server**, a **DNS forwarder** and a basic **firewall**. An office runs most of these as separate rack devices, and a cloud such as AWS offers them as services like route tables, NAT gateways and security groups.",
        },
        {
          type: 'paragraph',
          text: "The medium sets the speed, distance and cost of a link. **Guided** media carry signals along a physical path, and **unguided** media radiate them through space.",
        },
        {
          type: 'points',
          items: [
            "**Twisted pair:** Cat5e and Cat6 carry `1 Gbps` up to `100 m`. It is the standard for office desks.",
            "**Optical fibre:** carries light over long distances. Used for building uplinks, ISP backbones and home FTTH.",
            "**Coaxial cable:** still used by cable TV operators for DOCSIS broadband.",
            "**Radio:** Wi-Fi, 4G, 5G and Bluetooth. No cable, but a shared medium affected by walls, distance and interference.",
            "**Direction of flow:** simplex is one way only (keyboard to computer), half-duplex is both ways but one at a time (walkie-talkie, a Wi-Fi channel), and full-duplex is both ways at once (switched Ethernet, a phone call).",
          ],
        },
        {
          type: 'command-lab',
          title: 'See your own network identity',
          command: 'ipconfig /all',
          output: `Windows IP Configuration

   Host Name . . . . . . . . . . . . : LAB-PC01
   IP Routing Enabled. . . . . . . . : No

Wireless LAN adapter Wi-Fi:

   Connection-specific DNS Suffix  . : home
   Description . . . . . . . . . . . : Intel(R) Wi-Fi 6 AX201 160MHz
   Physical Address. . . . . . . . . : 3C-52-82-1A-7F-04
   DHCP Enabled. . . . . . . . . . . : Yes
   IPv4 Address. . . . . . . . . . . : 192.168.1.23(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1
   DHCP Server . . . . . . . . . . . : 192.168.1.1
   DNS Servers . . . . . . . . . . . : 192.168.1.1`,
          explanation: [
            "`Physical Address` is the 48-bit MAC of the NIC, used at Layer 2.",
            "`DHCP Enabled` is `Yes` and `DHCP Server` is `192.168.1.1`, so the home router leased this configuration to the laptop.",
            "`IPv4 Address` is the Layer 3 identity. `192.168.1.23` is a private address, valid only inside this LAN.",
            "`Subnet Mask` `255.255.255.0` means /24: any `192.168.1.x` address is reached directly.",
            "`Default Gateway` is the router that receives all traffic for other networks.",
            "`DNS Servers` points at the router, which forwards name lookups to the ISP resolver.",
            "On Linux, `ip addr` and `ip route` show the same facts.",
          ],
        },
      ],
    },
    {
      id: 'network-types',
      title: 'Network types: PAN, LAN, MAN and WAN',
      videoId: 'ch01-network-types-lan-wan',
      blocks: [
        {
          type: 'paragraph',
          text: "Networks are classified first by geographic scale, because scale decides who owns the links, which technology is practical and how much bandwidth costs. The usual classes are PAN, LAN, MAN and WAN. The boundaries are conventions, not hard limits.",
        },
        {
          type: 'points',
          items: [
            "**PAN (Personal Area Network):** links devices around one person, within about `10 m`, using Bluetooth or USB.",
            "**LAN (Local Area Network):** covers a home, building or campus under one owner. It uses Ethernet (IEEE `802.3`) and Wi-Fi (IEEE `802.11`), with high speed and low delay.",
            "**MAN (Metropolitan Area Network):** spans a city, up to about `50 km`, usually run by an ISP or cable operator over Metro Ethernet or fibre rings.",
            "**WAN (Wide Area Network):** spans countries and continents. Its links are normally rented from carriers, or owned by very large cloud providers.",
          ],
        },
        {
          type: 'table',
          headers: ['Type', 'Typical span', 'Owner', 'Technology', 'Typical speed', 'Example'],
          rows: [
            ['PAN', 'Up to about 10 m', 'The user', 'Bluetooth, USB, NFC', '2 Mbps Bluetooth to 10 Gbps or more on USB', 'Phone to earbuds'],
            ['LAN', 'Room to campus', 'Household or organisation', 'Ethernet, Wi-Fi', '1 Gbps to desks, 10 to 100 Gbps uplinks', 'Office floor, hostel Wi-Fi'],
            ['MAN', 'One city, up to about 50 km', 'ISP, cable operator, city body', 'Metro Ethernet, DWDM fibre rings', '1 to 100 Gbps', 'Bank branches across a city'],
            ['WAN', 'Country to global', 'Carriers, cloud providers', 'MPLS, leased lines, SD-WAN, submarine fibre', 'Tens of Mbps at a branch to 400 Gbps on a backbone', 'Company HQ to branches, cloud regions'],
          ],
        },
        {
          type: 'diagram',
          id: 'ch01-network-type-chooser',
          title: 'Choosing a network type',
          caption: 'Start from the distance and ownership of the devices. The result names the class and its most common technology.',
          kind: 'flowchart',
          mermaid: `flowchart TD
    Q1{"Devices within about 10 m?"}
    Q2{"Personal devices of one user?"}
    Q3{"Within one building or campus?"}
    Q4{"Within one city?"}
    N1["PAN - Bluetooth or USB"]
    N2["LAN - Ethernet or Wi-Fi"]
    N3["MAN - Metro Ethernet or fibre ring"]
    N4["WAN - MPLS, leased line or SD-WAN"]
    Q1 -->|Yes| Q2
    Q1 -->|No| Q3
    Q2 -->|Yes| N1
    Q2 -->|No| N2
    Q3 -->|Yes| N2
    Q3 -->|No| Q4
    Q4 -->|Yes| N3
    Q4 -->|No| N4`,
        },
        {
          type: 'points',
          items: [
            "**WLAN:** a LAN whose access links are Wi-Fi.",
            "**CAN:** a campus area network, several LANs joined on one site by a private backbone.",
            "**SAN:** a storage area network in data centres, using Fibre Channel or iSCSI.",
            "**VPN:** an encrypted tunnel that behaves like a private network across a public one. It is a logical network, not a geographic class.",
            "**Internetwork:** many networks joined by routers. The Internet is the largest one.",
          ],
        },
        {
          type: 'paragraph',
          text: "In industry the split that matters is cost. LAN capacity is bought once and is cheap, so engineers over-provision it. WAN capacity is rented monthly at a much higher price per Mbps, so WAN design focuses on caching, traffic priority and backup links. Companies now often run SD-WAN, which sends traffic over a mix of MPLS, broadband and 4G or 5G links.",
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: "One engineering college runs all four at once. A student's earbuds form a **PAN**, the lab switches and hostel Wi-Fi form a **LAN**, the fibre from the college to the ISP's city point of presence is a **MAN** segment, and the onward path to the National Knowledge Network or the public Internet is a **WAN**.",
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: "When asked to differentiate LAN and WAN, do not stop at distance. Compare **ownership, speed, delay, error rate and cost**: LANs are privately owned, fast and cheap per Mbps, while WANs use rented links with higher delay and cost.",
        },
      ],
    },
    {
      id: 'topologies',
      title: 'Topologies: how nodes and links are arranged',
      videoId: 'ch01-topologies-real-offices',
      blocks: [
        {
          type: 'paragraph',
          text: "A **topology** is the arrangement of nodes and links. The **physical topology** is how cables or radio links are actually laid, and the **logical topology** is how data flows over them. Each choice trades cost and cabling against what happens when something fails.",
        },
        {
          type: 'points',
          items: [
            "**Bus:** all nodes tap one shared cable with a terminator at each end. Cheap, but nodes collide on the shared medium and a cable break stops the segment.",
            "**Ring:** each node connects to two neighbours and data circulates around the loop. A single break stops a simple ring, while dual rings can wrap around it.",
            "**Star:** every node has its own link to a central device. A cable fault affects one node, but the centre is a single point of failure.",
            "**Mesh:** devices link directly to many or all others. A full mesh gives the most redundancy at the highest cost.",
            "**Tree:** stars joined in a hierarchy. A failed branch cuts off only what sits below it.",
            "**Hybrid:** a mix, such as a meshed core with star access. Most real networks are hybrids.",
          ],
        },
        {
          type: 'diagram',
          id: 'ch01-topology-gallery',
          title: 'Topology gallery',
          caption: 'Six standard topologies. In the bus, hosts share one cable. Ring arrows show one-way circulation. Plain lines in the others are full-duplex links. In the hybrid, the access switch is the centre of its own star of PCs.',
          kind: 'block',
          mermaid: `flowchart LR
    subgraph GB["Bus - one shared cable"]
        TX["Terminator"] --- B1["Host 1"]
        B1 --- B2["Host 2"]
        B2 --- B3["Host 3"]
        B3 --- TY["Terminator"]
    end
    subgraph GS["Star - central device"]
        S1["PC 1"] --- S0["Central switch"]
        S2["PC 2"] --- S0
        S3["PC 3"] --- S0
    end
    subgraph GR["Ring - one-way circle"]
        R1["Node 1"] --> R2["Node 2"]
        R2 --> R3["Node 3"]
        R3 --> R1
    end
    subgraph GM["Full mesh - 4 nodes, 6 links"]
        M1["Router 1"] --- M2["Router 2"]
        M1 --- M3["Router 3"]
        M1 --- M4["Router 4"]
        M2 --- M3
        M2 --- M4
        M3 --- M4
    end
    subgraph GT["Tree - stars in a hierarchy"]
        T0["Root switch"] --- T1["Branch switch 1"]
        T0 --- T2["Branch switch 2"]
        T1 --- T3["PC on branch 1"]
        T2 --- T4["PC on branch 2"]
    end
    subgraph GH["Hybrid - meshed core, star access"]
        H1["Core switch 1"] --- H2["Core switch 2"]
        H1 --- H3["Access switch with PCs"]
        H2 --- H3
    end`,
        },
        {
          type: 'table',
          headers: ['Topology', 'Links for n devices', 'Effect of one failure', 'Cost', 'Where used today'],
          rows: [
            ['Bus', '1 backbone plus n drops', 'Backbone break stops the segment', 'Low', 'Old 10BASE2 Ethernet; CAN bus in cars'],
            ['Ring', 'n', 'Break stops a simple ring; dual rings recover', 'Medium', 'Metro fibre rings; legacy Token Ring and FDDI'],
            ['Star', 'n, to a central device', 'Cable fault hits one device; centre failure hits all', 'Medium', 'Office floors, home networks'],
            ['Full mesh', 'n(n-1)/2', 'Traffic reroutes around most faults', 'High', 'Small WAN cores; partial mesh is more common'],
            ['Tree', 'n-1 for n nodes', 'Branch failure cuts off everything below it', 'Medium', 'Campus core, distribution and access layers'],
            ['Hybrid', 'Depends on the mix', 'Contained by the design', 'Varies', 'Almost every real network'],
          ],
        },
        {
          type: 'callout',
          variant: 'formula',
          text: "Full mesh of `n` devices: **links = n(n-1)/2** and **ports per device = n-1**. For 6 sites: `6 x 5 / 2 = 15` links and `30` ports in total, while a star needs only `6` links. Adding a seventh site costs `6` new mesh links but just `1` star link.",
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: "Physical and logical topology can differ. Ethernet on a **hub** is physically a star but logically a bus, because every frame reaches every port. Token Ring was physically a star but logically a ring. Modern switched Ethernet is a star both ways.",
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: "Cloud data centres use **spine-leaf**: every leaf switch connects to every spine switch, which gives many equal-cost paths between servers. It is a partial mesh, because leaves do not link to other leaves. Home Wi-Fi mesh systems are a wireless partial mesh of access points.",
        },
        {
          type: 'mini-lab',
          title: 'Build a star and break it',
          goal: "See the failure behaviour of a star topology in Cisco Packet Tracer, which is free with a Networking Academy account.",
          steps: [
            "Add a `2960` switch and three `PC-PT` computers. Connect each PC's `FastEthernet0` to a switch port with a copper straight-through cable.",
            "In Desktop, then IP Configuration, set the PCs to `192.168.10.1`, `192.168.10.2` and `192.168.10.3` with mask `255.255.255.0`.",
            "On PC1, open Command Prompt and run `ping 192.168.10.2` and `ping 192.168.10.3`.",
            "Delete only the cable to PC3 and repeat both pings.",
            "Delete the switch itself, simulating failure of the centre, and repeat both pings.",
          ],
          expected: "Step 3 succeeds, though the first reply may time out while ARP completes. In step 4, PC2 still replies and PC3 gives `Request timed out`, so one cable fault affects one node. In step 5 both pings fail, showing the single point of failure.",
        },
        {
          type: 'case-study',
          title: 'Topology of a three-floor office',
          scenario: "A company moves 120 staff onto three floors. Each floor has about 40 desks, 3 Wi-Fi access points and 1 printer. The site must survive the loss of any one core switch or uplink.",
          steps: [
            "**Access layer, star:** one `48`-port PoE switch per floor. The floor needs `40 + 3 + 1 = 44` ports, leaving `4` spare. Each desk gets its own Cat6 run, under the `100 m` limit.",
            "**Uplinks, tree:** each floor switch has two `10 Gbps` fibre uplinks running up the building riser.",
            "**Core, partial mesh:** two core switches are linked to each other, and each floor has one uplink to each core.",
            "**Edge:** two firewalls connect to two different ISPs, so one provider failure does not stop the site.",
            "**Failure review:** a desk cable affects one user, a floor switch affects one floor, and a core switch or uplink failure causes no outage. The whole design is a **hybrid**.",
          ],
        },
        {
          type: 'troubleshoot',
          symptom: "All users on one office floor lose the network at the same moment, while other floors are fine.",
          checks: [
            "The pattern points at a shared element of the tree: that floor's switch or its uplink, not the individual PCs.",
            "Check the switch power and port LEDs in the floor comms room.",
            "On the core switch, run `show interfaces status` and look for the uplink port showing `notconnect` or `err-disabled`.",
            "Inspect the fibre patch cables and transceivers, then ping the floor switch management IP from the core.",
          ],
          fix: "Replace the failed uplink, transceiver or switch. Add a second uplink to another core switch so that one fault no longer removes a whole floor.",
        },
      ],
    },
    {
      id: 'protocols-and-standards',
      title: 'Protocols and standards',
      blocks: [
        {
          type: 'paragraph',
          text: "A **protocol** defines the format and order of messages exchanged between communicating devices, and the actions taken when a message is sent or received. Devices from different vendors can talk only if they implement the same protocol the same way, which is why open standards matter.",
        },
        {
          type: 'points',
          items: [
            "**Syntax:** the format of the data. In IPv4, the first `4` bits are the version, and each address field is `32` bits.",
            "**Semantics:** what each value means. Protocol value `6` in IPv4 means the payload is TCP, and TTL `0` means the packet must be discarded.",
            "**Timing:** when to send and how fast. TCP retransmits after a timeout, and it slows down if the receiver's window shrinks.",
          ],
        },
        {
          type: 'diagram',
          id: 'ch01-protocol-exchange',
          title: 'Protocols fix message order',
          caption: 'A web request needs two protocols in order. TCP must finish its three-way handshake before HTTP can send a request. Time runs downward.',
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant C as Browser
    participant S as Web Server
    C->>S: TCP SYN seq=1000
    S->>C: TCP SYN-ACK seq=5000 ack=1001
    C->>S: TCP ACK seq=1001 ack=5001
    C->>S: HTTP GET /index.html
    S->>C: HTTP 200 OK with the page`,
        },
        {
          type: 'points',
          items: [
            "**Service:** what a layer offers to the layer above, such as reliable byte delivery by TCP.",
            "**Interface:** how the upper layer asks for that service, such as the sockets API.",
            "**Protocol:** the rules between **peer** layers on two machines. It can change without affecting the service above it.",
          ],
        },
        {
          type: 'table',
          headers: ['Body', 'Scope', 'Examples'],
          rows: [
            ['IETF', 'Internet protocols, published as RFCs', 'IP `RFC 791`, TCP `RFC 9293`, DNS `RFC 1035`, HTTP `RFC 9110`'],
            ['IEEE', 'LAN and wireless link standards', '`802.3` Ethernet, `802.11` Wi-Fi, `802.1Q` VLANs'],
            ['ITU-T', 'Telecom and optical systems', '`G.652` fibre, `G.984` GPON, `H.264` video'],
            ['ISO', 'General international standards', '`ISO/IEC 7498-1`, the OSI model'],
            ['3GPP', 'Mobile networks', '4G LTE, 5G NR'],
            ['ICANN and IANA', 'Global numbers and names', 'IP address blocks, port numbers, DNS root zone'],
          ],
        },
        {
          type: 'points',
          items: [
            "**De jure standard:** approved by a recognised body, such as IEEE `802.3`.",
            "**De facto standard:** adopted through wide use before or without formal approval. The DIX Ethernet II frame began this way and is still what most LANs send.",
            "**RFC process:** anyone can submit an Internet-Draft, and after review it may become an RFC. Not every RFC is a standard; some are informational or experimental.",
            "**RFC numbers are permanent:** changes get a new number. TCP `RFC 793` was replaced by `RFC 9293` in 2022.",
          ],
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: "Multi-vendor networks rely on these documents daily. A Cisco router and a Juniper router can run OSPF and BGP together because both follow the same RFCs, and a Wi-Fi 6 laptop of any brand joins a Wi-Fi 6 access point because both follow `802.11ax`. Proprietary protocols tend to lose out: Cisco ISL trunks gave way to open `802.1Q`.",
        },
      ],
    },
    {
      id: 'osi-and-tcp-ip-layers',
      title: 'OSI and TCP/IP layers',
      videoId: 'ch01-data-journey-osi-layers',
      blocks: [
        {
          type: 'paragraph',
          text: "Networking is too complex to build as one program, so it is split into **layers**. Each layer offers a service to the layer above, uses the layer below, and talks to its **peer** layer on the other machine through a protocol. A change inside one layer, such as moving from Wi-Fi to fibre, leaves the others untouched.",
        },
        {
          type: 'points',
          items: [
            "**Modularity:** each layer can be designed and replaced independently.",
            "**Interoperability:** vendors build to the same layer boundaries.",
            "**Troubleshooting:** a fault can be isolated layer by layer.",
            "**Common language:** engineers say L2 switch or L7 load balancer and are understood everywhere.",
          ],
        },
        {
          type: 'table',
          headers: ['OSI layer', 'Main job', 'PDU', 'Address', 'Examples'],
          rows: [
            ['7 Application', 'Network services for user programs', 'Data', 'Names, URLs', 'HTTP, DNS, SMTP'],
            ['6 Presentation', 'Data format, encryption, compression', 'Data', 'None', 'TLS, JPEG, UTF-8'],
            ['5 Session', 'Opens, manages and closes dialogs', 'Data', 'None', 'RPC, NetBIOS'],
            ['4 Transport', 'Process-to-process delivery, reliability, flow control', 'Segment, or datagram for UDP', 'Port', 'TCP, UDP'],
            ['3 Network', 'Host-to-host delivery across networks, routing', 'Packet', 'IP address', 'IP, ICMP, OSPF'],
            ['2 Data Link', 'Node-to-node delivery on one link, framing, error detection', 'Frame', 'MAC address', 'Ethernet, 802.11, PPP'],
            ['1 Physical', 'Bits as electrical, optical or radio signals', 'Bit', 'None', '1000BASE-T, fibre, radio'],
          ],
        },
        {
          type: 'paragraph',
          text: "OSI is a reference model from ISO that describes functions. The TCP/IP model describes the protocol suite the Internet really runs. `RFC 1122` defines four layers, and many textbooks teach five by splitting Link into Data Link and Physical.",
        },
        {
          type: 'diagram',
          id: 'ch01-osi-vs-tcpip',
          title: 'OSI versus TCP/IP layers',
          caption: 'OSI layers 5, 6 and 7 map to the TCP/IP application layer. OSI layers 1 and 2 map to the TCP/IP link layer. Transport and network map one to one.',
          kind: 'block',
          mermaid: `flowchart LR
    subgraph OS["OSI reference model"]
        O7["7 Application"]
        O6["6 Presentation"]
        O5["5 Session"]
        O4["4 Transport"]
        O3["3 Network"]
        O2["2 Data Link"]
        O1["1 Physical"]
    end
    subgraph TI["TCP/IP model - RFC 1122"]
        T4["Application - HTTP, DNS, TLS, SMTP"]
        T3["Transport - TCP, UDP"]
        T2["Internet - IP, ICMP"]
        T1["Link - Ethernet, Wi-Fi, ARP"]
    end
    O7 --- T4
    O6 --- T4
    O5 --- T4
    O4 --- T3
    O3 --- T2
    O2 --- T1
    O1 --- T1`,
        },
        {
          type: 'table',
          headers: ['Aspect', 'OSI', 'TCP/IP'],
          rows: [
            ['Layers', '7', '4 in RFC 1122, often taught as 5'],
            ['Origin', 'ISO reference model, 1984', 'ARPANET research; RFC 1122 in 1989'],
            ['Design order', 'Model first, protocols later', 'Protocols first, model described afterwards'],
            ['Session and presentation', 'Separate layers', 'Inside the application layer'],
            ['Network layer service', 'Connection-oriented and connectionless', 'Connectionless only, IP'],
            ['Transport layer service', 'Connection-oriented in the original model', 'Both: TCP and UDP'],
          ],
        },
        {
          type: 'points',
          items: [
            "**Why TCP/IP won:** it was running on ARPANET from 1983 and shipped in BSD UNIX, while OSI protocols arrived late and were complex.",
            "**Why OSI survives:** its layer numbers are still the industry vocabulary, as in L2, L3 and L7.",
            "**Where TLS fits:** it sits between TCP and the application. Courses often map it to presentation, while TCP/IP treats it as part of the application layer.",
          ],
        },
        {
          type: 'callout',
          variant: 'remember',
          text: "Layers from the bottom: **Please Do Not Throw Sausage Pizza Away** for Physical, Data Link, Network, Transport, Session, Presentation, Application. PDUs from L7 down: **data, segment, packet, frame, bits**. Addresses: **port at L4, IP at L3, MAC at L2**.",
        },
        {
          type: 'paragraph',
          text: "Now follow one request end to end. The sender moves down its stack, the network handles only the lower layers, and the server moves up its stack. Hosts process all layers, but switches and routers stop as soon as they can make a forwarding decision.",
        },
        {
          type: 'diagram',
          id: 'ch01-data-journey',
          title: 'End-to-end data journey',
          caption: 'A request from a laptop to a web server on port 443. The router loop repeats once per router, and the MAC addresses change on every link. A frame with a bad FCS or the wrong destination MAC is discarded at the receiver.',
          kind: 'working-flowchart',
          mermaid: `flowchart TD
    subgraph SL["Sender laptop - down the stack"]
        A1["L5-L7 HTTP request, TLS encrypts it"]
        A2["L4 TCP adds ports and sequence number"]
        A3["L3 IP adds source and dest IP"]
        A4["L2 Frame with MACs and FCS"]
        A5["L1 Bits sent on the medium"]
    end
    subgraph PT["Network path"]
        B1["Switch forwards by dest MAC"]
        B2["Router strips frame, reads dest IP"]
        B3{"Decrement TTL - still above 0?"}
        B4{"Route to dest IP found?"}
        B5["Drop packet, send ICMP error"]
        B6["Build new frame for next hop"]
        B7{"Another router ahead?"}
    end
    subgraph WS["Web server - up the stack"]
        C1["L1 NIC receives the bits"]
        C2["L2 Checks FCS and dest MAC"]
        C3["L3 Checks dest IP"]
        C4["L4 Dest port 443 selects process"]
        C5["L5-L7 TLS decrypts, server reads HTTP"]
    end
    A1 --> A2
    A2 --> A3
    A3 --> A4
    A4 --> A5
    A5 --> B1
    B1 --> B2
    B2 --> B3
    B3 -->|Yes| B4
    B3 -->|No| B5
    B4 -->|Yes| B6
    B4 -->|No| B5
    B6 --> B7
    B7 -->|Yes| B2
    B7 -->|No| C1
    C1 --> C2
    C2 --> C3
    C3 --> C4
    C4 --> C5`,
        },
        {
          type: 'points',
          items: [
            "**Switch:** reads only the Ethernet header and forwards the frame unchanged.",
            "**Router:** removes the frame, decrements TTL, finds the next hop and builds a new frame for the next link.",
            "**Home router:** also applies NAT, replacing the private source IP and port with its public ones.",
            "**Server:** checks each header on the way up and discards anything not addressed to it.",
            "**Reply:** follows the same process in reverse, and may take a different path.",
          ],
        },
        {
          type: 'paragraph',
          text: "The table follows one packet through a simplified three-router path. A Windows host starts TTL at `128`, and each router reduces it by one. Notice which columns change on every link and which do not.",
        },
        {
          type: 'table',
          headers: ['Link', 'Source MAC', 'Destination MAC', 'Source IP', 'Destination IP', 'TTL'],
          rows: [
            ['Laptop to home router', 'Laptop', 'Router LAN port', '`192.168.1.23`', '`203.0.113.10`', '128'],
            ['Home router to ISP router', 'Router WAN port', 'ISP router', '`198.51.100.7` after NAT', '`203.0.113.10`', '127'],
            ['ISP router to server gateway', 'ISP router', 'Server gateway', '`198.51.100.7`', '`203.0.113.10`', '126'],
            ['Server gateway to server', 'Server gateway', 'Server', '`198.51.100.7`', '`203.0.113.10`', '125'],
          ],
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: "Scope questions are common: data link is **hop to hop**, network is **host to host**, and transport is **process to process**. On a router hop **MAC addresses change** while **IP addresses stay the same**, unless NAT applies. A hub works at L1, a switch at L2 and a router at L3.",
        },
        {
          type: 'command-lab',
          title: 'Link Layer 3 addresses to Layer 2 addresses',
          command: 'arp -a',
          output: `Interface: 192.168.1.23 --- 0x7
  Internet Address      Physical Address      Type
  192.168.1.1           a4-2b-b0-6e-11-30     dynamic
  192.168.1.40          f0-18-98-22-9c-5e     dynamic
  192.168.1.255         ff-ff-ff-ff-ff-ff     static
  224.0.0.22            01-00-5e-00-00-16     static
  239.255.255.250       01-00-5e-7f-ff-fa     static
  255.255.255.255       ff-ff-ff-ff-ff-ff     static`,
          explanation: [
            "`Interface: 192.168.1.23` is the local NIC this table belongs to, and `0x7` is its interface index.",
            "`192.168.1.1` is the default gateway. Every frame for the Internet carries this MAC as its destination, even though the destination IP is a remote server.",
            "`192.168.1.40` is another host on the same LAN, reached directly at L2.",
            "`dynamic` entries were learned by ARP and age out. `static` entries here are fixed mappings.",
            "`ff-ff-ff-ff-ff-ff` is the broadcast MAC, and MACs starting `01-00-5e` are IPv4 multicast.",
            "On Linux, `ip neigh` shows the same table.",
          ],
        },
        {
          type: 'troubleshoot',
          symptom: "A laptop cannot open `https://example.com`, and the user reports that the Internet is down.",
          checks: [
            "**L1:** is the cable connected or Wi-Fi associated? Check the link status first.",
            "**L3 local:** run `ipconfig`. A `169.254.x.x` address means DHCP failed.",
            "**L3 gateway:** run `ping 192.168.1.1`. Failure points to the LAN or the router.",
            "**L3 remote:** run `ping 8.8.8.8`, then `tracert 8.8.8.8` to see where traffic stops.",
            "**L7 names:** run `nslookup example.com`. If the IP ping works but this fails, the fault is DNS.",
            "**L4 and L7:** run `curl -I https://example.com` to test the connection to the service itself.",
          ],
          fix: "Fix the lowest failing layer. For example, if `ping 8.8.8.8` succeeds but `nslookup` fails, repair the router's DNS forwarder or configure another resolver. Working upward layer by layer replaces guessing with evidence.",
        },
      ],
    },
    {
      id: 'encapsulation-and-headers',
      title: 'Encapsulation and headers',
      videoId: 'ch01-encapsulation-headers',
      blocks: [
        {
          type: 'paragraph',
          text: "**Encapsulation** is how layers cooperate. Each layer treats what the layer above gives it as opaque payload and adds its own **header**, and the data link layer also adds a **trailer**. The receiver reverses this in **decapsulation**, with each layer reading only the header written by its peer.",
        },
        {
          type: 'points',
          items: [
            "**Application:** produces the message, such as `GET /index.html HTTP/1.1`, encrypted by TLS on HTTPS.",
            "**Transport:** TCP adds at least `20` bytes with ports, sequence and acknowledgment numbers, flags, window and checksum, forming a **segment**.",
            "**Network:** IPv4 adds at least `20` bytes with addresses, TTL, protocol and checksum, forming a **packet**.",
            "**Data link:** Ethernet adds a `14` byte header with MACs and EtherType and a `4` byte FCS, forming a **frame**.",
            "**Physical:** sends bits as voltage, light or radio. Ethernet puts `8` bytes of preamble and SFD in front and leaves a `12` byte gap after each frame.",
          ],
        },
        {
          type: 'diagram',
          id: 'ch01-encapsulation',
          title: 'Encapsulation and decapsulation',
          caption: 'Read from the top. Each sender step wraps the previous unit in a new header. Edge labels on the receiver side show the field that selects the next protocol: EtherType, IP Protocol, then destination port.',
          kind: 'working-diagram',
          mermaid: `flowchart TD
    subgraph TX["Sender - encapsulation"]
        D1["Data - HTTP request"]
        D2["TCP 20 B + Data = Segment"]
        D3["IP 20 B + TCP + Data = Packet"]
        D4["Eth 14 B + IP + TCP + Data + FCS 4 B"]
        D5["Bits on the medium"]
    end
    subgraph RX["Receiver - decapsulation"]
        E1["NIC rebuilds the frame from bits"]
        E2["Data link checks FCS and dest MAC"]
        E3["IP checks dest IP, removes header"]
        E4["TCP checks port, removes header"]
        E5["Application reads the HTTP request"]
    end
    D1 -->|add ports and seq| D2
    D2 -->|add IP addresses| D3
    D3 -->|add MACs and FCS| D4
    D4 -->|line encoding| D5
    D5 -->|cable or radio| E1
    E1 --> E2
    E2 -->|EtherType 0x0800| E3
    E3 -->|Protocol 6| E4
    E4 -->|Dest port 443| E5`,
        },
        {
          type: 'table',
          headers: ['Header', 'Size', 'Main fields', 'Purpose'],
          rows: [
            ['Ethernet II', '14 B header, 4 B FCS', 'Destination MAC, Source MAC, EtherType, FCS', 'Delivery over one link, bit error detection'],
            ['IPv4', '20 B minimum, 60 B maximum', 'Version, IHL, Total Length, Identification, Flags, Fragment Offset, TTL, Protocol, Header Checksum, Source IP, Destination IP', 'Host-to-host delivery across networks'],
            ['IPv6', '40 B fixed', 'Version, Traffic Class, Flow Label, Payload Length, Next Header, Hop Limit, Source, Destination', 'Same role with 128-bit addresses'],
            ['TCP', '20 B minimum, 60 B maximum', 'Source Port, Destination Port, Sequence Number, Acknowledgment Number, Data Offset, Flags, Window, Checksum, Urgent Pointer', 'Reliable process-to-process delivery'],
            ['UDP', '8 B', 'Source Port, Destination Port, Length, Checksum', 'Simple process-to-process delivery'],
          ],
        },
        {
          type: 'points',
          items: [
            "**EtherType** names the payload of a frame: `0x0800` is IPv4, `0x86DD` is IPv6 and `0x0806` is ARP.",
            "**IP Protocol** names the payload of a packet: `6` is TCP, `17` is UDP and `1` is ICMP.",
            "**Destination port** names the receiving process: `443` is HTTPS, `53` is DNS and `22` is SSH.",
          ],
        },
        {
          type: 'example',
          title: 'Counting header overhead',
          steps: [
            "Application data: `1000` bytes.",
            "After TCP: `1000 + 20 = 1020` bytes. After IPv4: `1020 + 20 = 1040` bytes.",
            "After Ethernet: `1040 + 14 + 4 = 1058` bytes.",
            "Overhead: `58 / 1058 = 5.48%`.",
            "A full frame carries `1460` bytes of data in `1518` bytes, so overhead falls to `58 / 1518 = 3.82%`.",
            "A `1` byte payload is padded to the minimum `64` byte frame, so only `1 / 64 = 1.56%` of it is user data.",
          ],
        },
        {
          type: 'command-lab',
          title: 'Find the 1500-byte MTU limit',
          command: 'ping -n 2 -f -l 1472 8.8.8.8',
          output: `Pinging 8.8.8.8 with 1472 bytes of data:
Reply from 8.8.8.8: bytes=1472 time=24ms TTL=115
Reply from 8.8.8.8: bytes=1472 time=26ms TTL=115

Ping statistics for 8.8.8.8:
    Packets: Sent = 2, Received = 2, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 24ms, Maximum = 26ms, Average = 25ms

C:\\>ping -n 1 -f -l 1473 8.8.8.8

Pinging 8.8.8.8 with 1473 bytes of data:
Packet needs to be fragmented but DF set.

Ping statistics for 8.8.8.8:
    Packets: Sent = 1, Received = 0, Lost = 1 (100% loss),`,
          explanation: [
            "`-f` sets the Don't Fragment bit in the IP header, and `-l 1472` sets the ICMP payload size.",
            "`1472 + 8` of ICMP header `+ 20` of IP header `= 1500` bytes, exactly the Ethernet MTU, so the replies arrive.",
            "`Average = 25ms` is `(24 + 26) / 2`, the mean round-trip time of the two replies.",
            "The second command makes a `1501` byte packet. It cannot fit, and DF forbids splitting it, so it fails with `Packet needs to be fragmented but DF set.`",
            "On a PPPoE line the MTU is `1492`, so the largest working payload is `1464`.",
            "On Linux, the same test is `ping -M do -s 1472 8.8.8.8`.",
          ],
        },
        {
          type: 'wireshark',
          filter: 'tcp.port == 443',
          whatToLook: [
            'Frame line: bytes captured. A full-size packet usually shows 1514 bytes, because the NIC has already checked and removed the 4-byte FCS.',
            'Ethernet II: Destination, Source and Type IPv4 (0x0800). For a remote server, the destination MAC is your gateway.',
            'Internet Protocol Version 4: Header Length 20 bytes, Time to Live, Protocol TCP (6), Source Address and Destination Address.',
            'Transmission Control Protocol: Source Port, Destination Port 443, Sequence Number, Acknowledgment Number, Flags and Window.',
            'Transport Layer Security: Application Data records. The HTTP content is encrypted, so this is the deepest layer you can read without keys.',
            'On Wi-Fi without monitor mode, Wireshark usually shows Ethernet II because the driver presents 802.11 frames as Ethernet.',
          ],
        },
        {
          type: 'callout',
          variant: 'remember',
          text: "A header is written for its **peer**. Routers rewrite Layer 2 and update TTL, but TCP ports and the payload travel unchanged end to end unless NAT intervenes. The usual frame count of `1518` bytes excludes preamble and gap; with them, a full frame occupies `1538` bytes on the wire.",
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: "Every tunnel adds headers and shrinks the usable MTU. PPPoE on home broadband adds `8` bytes, giving an MTU of `1492`. VXLAN in cloud data centres adds `50` bytes, which is one reason cloud networks use jumbo frames: most AWS EC2 instances use an MTU of `9001` inside a VPC.",
        },
      ],
    },
    {
      id: 'delay-and-throughput',
      title: 'Delay and throughput basics',
      blocks: [
        {
          type: 'paragraph',
          text: "The Internet uses **packet switching**: data is split into packets, and each router stores a complete packet before forwarding it. At every router a packet loses time in four distinct ways. Knowing which one dominates tells an engineer whether to buy a faster link, move a server closer or fix a queue.",
        },
        {
          type: 'points',
          items: [
            "**Processing delay:** time to check the header and look up the output port.",
            "**Queuing delay:** time waiting in the output buffer behind other packets. It is the only one that varies strongly from moment to moment.",
            "**Transmission delay:** time to push all bits of the packet onto the link, `L/R`.",
            "**Propagation delay:** time for one bit to travel the length of the link, `d/s`.",
          ],
        },
        {
          type: 'diagram',
          id: 'ch01-nodal-delay',
          title: 'Four delays at one router',
          caption: 'The path of a packet through router A and over the link to router B. A packet that finds the output buffer full is dropped, which is how congestion turns into packet loss.',
          kind: 'working-diagram',
          mermaid: `flowchart TD
    subgraph RA["Inside router A"]
        P1["Packet fully received"]
        P2["Processing - header check and lookup"]
        Q1{"Output buffer full?"}
        P3["Queuing - waits in output buffer"]
        P4["Transmission - pushes bits, L over R"]
        X1["Packet dropped - loss"]
    end
    subgraph LK["On the link"]
        P5["Propagation - bits travel, d over s"]
    end
    P6["Router B receives the last bit"]
    P1 --> P2
    P2 --> Q1
    Q1 -->|Yes| X1
    Q1 -->|No| P3
    P3 --> P4
    P4 --> P5
    P5 --> P6`,
        },
        {
          type: 'table',
          headers: ['Delay', 'Cause', 'Formula', 'Depends on', 'Typical value'],
          rows: [
            ['Processing', 'Header check and route lookup', 'None', 'Router hardware', 'Microseconds'],
            ['Queuing', 'Waiting behind other packets', 'None; grows with `La/R`', 'Traffic load, buffer size', '0 to hundreds of ms'],
            ['Transmission', 'Pushing bits onto the link', '`L/R`', 'Packet size, link rate', '`12` microseconds for `1500` bytes at `1 Gbps`'],
            ['Propagation', 'Signal travel along the medium', '`d/s`', 'Distance, medium', '`5 ms` per `1000 km` of fibre'],
          ],
        },
        {
          type: 'callout',
          variant: 'formula',
          text: "**d_nodal = d_proc + d_queue + d_trans + d_prop**, where **d_trans = L/R** and **d_prop = d/s**. Across `N` identical links with empty queues, store and forward gives **d_e2e = N x (d_proc + d_trans + d_prop)**.",
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: "Transmission delay depends on **packet size and link rate**, not on distance. Propagation delay depends on **distance and medium**, not on packet size or link rate. Swapping them is the most common numerical mistake. Convert bytes to bits first.",
        },
        {
          type: 'example',
          title: 'One hop at two link speeds',
          steps: [
            "Given: `L = 1500 bytes = 12000 bits`, `d = 1000 km`, `s = 2 x 10^8 m/s`.",
            "Propagation: `d/s = 10^6 / (2 x 10^8) = 5 ms`, at any link speed.",
            "On a `10 Mbps` link: `L/R = 12000 / 10^7 = 1.2 ms`, so the total is `6.2 ms`.",
            "On a `1 Gbps` link: `L/R = 12000 / 10^9 = 0.012 ms`, so the total is `5.012 ms`.",
            "Conclusion: a link `100` times faster saved only about `1.2 ms`. On long paths, distance dominates delay.",
          ],
        },
        {
          type: 'points',
          items: [
            "**Bandwidth:** the rated capacity of a link, such as `100 Mbps`.",
            "**Throughput:** the rate actually delivered end to end. It is at most the **bottleneck**, the slowest link on the path.",
            "**Goodput:** the application data rate, after subtracting headers and retransmissions.",
            "**Latency versus bandwidth:** latency is how long one bit takes, and bandwidth is how many bits fit per second. Improving one does not fix the other.",
            "**Traffic intensity:** `La/R`, where `a` is the packet arrival rate. Near `1`, queuing delay climbs sharply. Above `1`, the queue grows until the buffer overflows and packets are lost.",
            "**Bits and bytes:** link rates use bits, with `1 Mbps = 10^6 bit/s`. File sizes use bytes, so multiply by `8` before dividing by the rate.",
          ],
        },
        {
          type: 'callout',
          variant: 'formula',
          text: "**Throughput = min(R1, R2, ..., RN)**. **Transfer time = file size in bits / throughput**. **Bandwidth-delay product = R x RTT**, the amount of data that can be in flight on the path.",
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: "A `100 Mbps` home plan shows about `11` to `12 MB/s` in a download manager: `100 / 8 = 12.5 MB/s`, minus header overhead. In the cloud, an RTT of about `200 ms` between India and the US west coast is mostly propagation, so extra bandwidth will not fix it. The fix is a CDN or a server in a nearer region.",
        },
        {
          type: 'command-lab',
          title: 'Read delay from ping',
          command: 'ping -n 4 8.8.8.8',
          output: `Pinging 8.8.8.8 with 32 bytes of data:
Reply from 8.8.8.8: bytes=32 time=21ms TTL=115
Reply from 8.8.8.8: bytes=32 time=19ms TTL=115
Reply from 8.8.8.8: bytes=32 time=44ms TTL=115
Reply from 8.8.8.8: bytes=32 time=20ms TTL=115

Ping statistics for 8.8.8.8:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 19ms, Maximum = 44ms, Average = 26ms`,
          explanation: [
            "`bytes=32` is the ICMP payload Windows sends by default.",
            "`time` is the round-trip time: propagation, transmission, queuing and processing in both directions.",
            "Propagation is fixed for a given path, so the `44ms` spike is most likely queuing delay at a busy link.",
            "`TTL=115` is the TTL left in the reply. If the server started at `128`, the reply crossed `13` routers.",
            "`Lost = 0 (0% loss)` means nothing was dropped, and `Average = 26ms` is `(21 + 19 + 44 + 20) / 4`.",
            "On Linux, use `ping -c 4 8.8.8.8`, which also prints `mdev`, a measure of jitter.",
          ],
        },
        {
          type: 'mini-lab',
          title: 'Measure real throughput on a LAN',
          goal: "Compare measured TCP throughput on Gigabit Ethernet with the limit calculated from header overhead.",
          steps: [
            "Install `iperf3` on two computers and connect both by Ethernet to the same gigabit switch or router.",
            "On computer A, whose address here is `192.168.1.40`, run `iperf3 -s`.",
            "On computer B, run `iperf3 -c 192.168.1.40 -t 10` and note the bitrate on the `receiver` line.",
            "Calculate the limit: `1460 / 1538 x 1000 Mbps = 949 Mbps`.",
            "Repeat the test with computer B on Wi-Fi.",
          ],
          expected: "Wired gigabit shows about `940 Mbps`, a little below `949 Mbps` because TCP timestamps use `12` more bytes per segment: `1448 / 1538 x 1000 = 941 Mbps`. Wi-Fi shows a lower, fluctuating rate, because the channel is shared and half-duplex.",
        },
        {
          type: 'troubleshoot',
          symptom: "Video calls freeze whenever someone uploads a large file, although a speed test still shows the full plan speed.",
          checks: [
            "During the upload, run `ping 192.168.1.1` and `ping 8.8.8.8` side by side.",
            "A typical result: the gateway stays at `1` to `3 ms`, while `8.8.8.8` jumps from `20 ms` to `400 ms` or more.",
            "Propagation cannot change in seconds, so the extra time is **queuing delay** at the upload bottleneck.",
            "Stop the upload. If RTT returns to normal within seconds, oversized buffers are the cause, a problem known as **bufferbloat**.",
          ],
          fix: "Enable smart queue management such as `fq_codel` or `CAKE` on the router, and shape upload to about `90%` of the plan rate so the queue forms where the router can manage it. Otherwise, schedule large uploads outside call hours.",
        },
      ],
    },
    {
      id: 'internet-structure',
      title: 'Internet structure: ISPs and IXPs',
      blocks: [
        {
          type: 'paragraph',
          text: "The Internet is not one network owned by one company. It is a **network of networks**: tens of thousands of independently run networks that agree to carry traffic for each other. Business contracts and geography shape its structure as much as technology does.",
        },
        {
          type: 'points',
          items: [
            "**Access ISP (Tier 3):** connects homes and offices over fibre, cable, DSL or mobile, and buys transit from larger providers.",
            "**Regional or national ISP (Tier 2):** aggregates access ISPs, peers with some networks and still pays for transit to reach the rest.",
            "**Tier 1 ISP:** a global backbone that reaches every network through its customers and peers, without paying anyone for transit.",
            "**IXP (Internet Exchange Point):** a neutral site with a shared Layer 2 switch fabric. Members connect their routers and exchange traffic directly.",
            "**Content networks:** Google, Netflix, Meta and CDNs run their own networks, peer at IXPs and place cache servers inside ISPs.",
          ],
        },
        {
          type: 'diagram',
          id: 'ch01-internet-hierarchy',
          title: 'Internet hierarchy',
          caption: 'Downward arrows show service sold by a provider to its customer. Payment flows upward and traffic flows both ways. Plain lines are peering. Regional ISP X is multihomed to two Tier 1 providers.',
          kind: 'block',
          mermaid: `flowchart TD
    M1["Full mesh of settlement-free peering"]
    subgraph T1["Tier 1 global backbones"]
        A1["Tier 1 ISP A"]
        A2["Tier 1 ISP B"]
    end
    subgraph T2["Tier 2 regional or national ISPs"]
        B1["Regional ISP X"]
        B2["Regional ISP Y"]
    end
    subgraph T3["Tier 3 access ISPs"]
        C1["Access ISP P"]
        C2["Access ISP Q"]
    end
    subgraph EG["Edge networks"]
        D1["Home users"]
        D2["Campus or office LAN"]
        D3["Mobile users"]
    end
    IX1["IXP - shared Layer 2 switch fabric"]
    CD1["CDN or content network"]
    M1 --- A1
    M1 --- A2
    A1 -->|transit| B1
    A2 -->|transit| B1
    A2 -->|transit| B2
    B1 -->|transit| C1
    B2 -->|transit| C2
    B1 ---|peering| IX1
    C2 ---|peering| IX1
    CD1 ---|peering| IX1
    C1 -->|access| D1
    C1 -->|access| D2
    C2 -->|access| D3`,
        },
        {
          type: 'table',
          headers: ['Aspect', 'Transit', 'Peering'],
          rows: [
            ['Payment', 'Customer pays provider, usually per Mbps', 'Usually settlement-free; each side pays its own costs'],
            ['Reach', 'The whole Internet', 'Only the peer and its customers'],
            ['Typical place', 'Private link to an upstream', 'IXP or private interconnect'],
            ['Main benefit', 'Complete reachability', 'Lower cost and lower delay'],
          ],
        },
        {
          type: 'points',
          items: [
            "**Autonomous system (AS):** a network under one routing policy, identified by an AS number. ASes exchange routes using BGP.",
            "**Point of presence (PoP):** a site where a provider has routers that customers can connect to.",
            "**Multihoming:** buying connectivity from two or more providers, so one failure does not cut off the network.",
            "**Flattening:** much traffic now comes from CDN caches inside or next to the access ISP, so it never touches a Tier 1 network.",
          ],
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: "Arelion, Lumen, NTT and Tata Communications are commonly listed as Tier 1 networks, though tier labels are informal and no body certifies them. **DE-CIX** in Frankfurt, **AMS-IX** in Amsterdam and **LINX** in London are major IXPs. India's **NIXI** exists to keep domestic traffic inside the country instead of routing it through overseas links.",
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: "An IXP is **not** an ISP. It sells no Internet access and only lets members exchange traffic. Peering is also **not transitive**: a peer does not give you access to its own providers.",
        },
        {
          type: 'command-lab',
          title: 'Watch a packet cross networks',
          command: 'tracert -d 8.8.8.8',
          output: `Tracing route to 8.8.8.8 over a maximum of 30 hops

  1     2 ms     1 ms     1 ms  192.168.1.1
  2     8 ms     7 ms     9 ms  10.64.0.1
  3     9 ms     8 ms    10 ms  198.51.100.33
  4     *        *        *     Request timed out.
  5    14 ms    13 ms    15 ms  198.51.100.90
  6    21 ms    20 ms    22 ms  203.0.113.9
  7    22 ms    21 ms    23 ms  203.0.113.130
  8    20 ms    21 ms    20 ms  8.8.8.8

Trace complete.`,
          explanation: [
            "`tracert` sends probes with TTL `1`, `2`, `3` and so on. Each router that reduces TTL to `0` returns ICMP Time Exceeded, which reveals its address. `-d` skips name lookups.",
            "Hop `1` is the home router. The three times are the RTTs of three probes.",
            "Hop `2` is a private `10.x` address inside the access ISP. The rise from about `1 ms` to `8 ms` is the last-mile link.",
            "Hop `4` shows `*` because that router does not answer probes. Hop `5` replies, so traffic is passing and this is not a fault.",
            "Hops `6` and `7` use a different address block, so the path has probably left the first ISP for a peer or upstream. The addresses here are documentation placeholders; look up real ones with `whois`.",
            "Hop `8` is the destination. It can be faster than hop `7` because routers answer probes at low priority.",
            "On Linux, use `traceroute -n 8.8.8.8`, which sends UDP probes by default rather than ICMP Echo.",
          ],
        },
        {
          type: 'case-study',
          title: 'A regional ISP joins an IXP',
          scenario: "A regional ISP carries `20 Gbps` at evening peak, all of it over a paid transit link to an upstream provider in another city. Flow records show that about `8 Gbps` goes to CDNs and local ISPs present at a nearby IXP.",
          steps: [
            "**Measure:** use NetFlow records to rank destination AS numbers and estimate the traffic that could move.",
            "**Connect:** lease two `10 Gbps` ports at the IXP and connect a border router, taking an address from the IXP peering LAN.",
            "**Peer:** open BGP sessions with the IXP route servers and directly with the large CDNs. Advertise only the ISP's own and customer prefixes.",
            "**Prefer:** set a higher `local-preference` on routes learned at the IXP so that BGP chooses them over transit.",
            "**Result:** transit falls from `20 Gbps` to about `12 Gbps`, RTT to local networks drops because traffic no longer visits the other city, and transit remains the fallback.",
          ],
        },
      ],
    },
  ],
  flashcards: [
    { front: 'Name the five components of data communication.', back: 'Message, sender, receiver, transmission medium and protocol.' },
    { front: 'What are the three elements of a protocol?', back: 'Syntax (format), semantics (meaning) and timing (when and how fast).' },
    { front: 'List the OSI layers from top to bottom.', back: 'Application, Presentation, Session, Transport, Network, Data Link, Physical.' },
    { front: 'List the TCP/IP layers in RFC 1122.', back: 'Application, Transport, Internet, Link.' },
    { front: 'What is the PDU at L4, L3, L2 and L1?', back: 'Segment (or UDP datagram), packet, frame, bits.' },
    { front: 'Which address belongs to which layer?', back: 'Port number at transport, IP address at network, MAC address at data link.' },
    { front: 'Hub, switch and router: what does each read?', back: 'A hub reads nothing and repeats bits. A switch reads MAC addresses. A router reads IP addresses.' },
    { front: 'How many links and ports does a full mesh of n devices need?', back: 'n(n-1)/2 links and n-1 ports on each device.' },
    { front: 'Transmission delay versus propagation delay?', back: 'Transmission is L/R, the time to push bits onto the link. Propagation is d/s, the time for a bit to travel the link.' },
    { front: 'What changes at each router hop without NAT?', back: 'MAC addresses, TTL, the IP header checksum and the FCS. IP addresses and ports stay the same.' },
    { front: 'Which field names the payload at each layer?', back: 'EtherType in Ethernet, Protocol in IPv4, Next Header in IPv6, and destination port in TCP and UDP.' },
    { front: 'What sets end-to-end throughput?', back: 'The bottleneck: the minimum link rate along the path, further reduced by congestion and overhead.' },
    { front: 'Transit versus peering?', back: 'Transit is paid access to the whole Internet. Peering is a usually free exchange of traffic between two networks and their customers only.' },
    { front: 'What is an IXP?', back: 'A facility with a shared Layer 2 switch where ISPs, CDNs and other networks connect and exchange traffic directly.' },
  ],
  quiz: [
    {
      id: 'ch01-q1',
      question: 'Which device forwards traffic based on the destination MAC address?',
      options: ['Hub', 'Switch', 'Router', 'Modem'],
      answerIndex: 1,
      explanation: 'A switch is a Layer 2 device that looks up the destination MAC in its MAC table. A hub has no addressing logic, a router uses IP addresses and a modem converts signals.',
      difficulty: 'easy',
      topic: 'Network basics',
    },
    {
      id: 'ch01-q2',
      question: 'A smartwatch paired with a phone over Bluetooth forms which type of network?',
      options: ['WAN', 'MAN', 'LAN', 'PAN'],
      answerIndex: 3,
      explanation: 'A personal area network links devices around one person, within about 10 m.',
      difficulty: 'easy',
      topic: 'Network types',
    },
    {
      id: 'ch01-q3',
      question: 'How many links does a full mesh of 5 devices need?',
      options: ['10', '5', '20', '25'],
      answerIndex: 0,
      explanation: 'n(n-1)/2 = 5 x 4 / 2 = 10. The answer 20 counts every link twice.',
      difficulty: 'easy',
      topic: 'Topologies',
    },
    {
      id: 'ch01-q4',
      question: 'Which body publishes Internet protocol standards as RFCs?',
      options: ['IEEE', 'ITU-T', 'IETF', 'ISO'],
      answerIndex: 2,
      explanation: 'The IETF publishes RFCs. IEEE handles link standards such as 802.3, and ISO published the OSI model.',
      difficulty: 'easy',
      topic: 'Protocols and standards',
    },
    {
      id: 'ch01-q5',
      question: 'Which OSI layer chooses paths and forwards packets between networks?',
      options: ['Data Link', 'Network', 'Transport', 'Session'],
      answerIndex: 1,
      explanation: 'The network layer handles logical addressing and routing. The data link layer works only over one link.',
      difficulty: 'easy',
      topic: 'OSI and TCP/IP',
    },
    {
      id: 'ch01-q6',
      question: 'What is the PDU at the data link layer called?',
      options: ['Bit', 'Segment', 'Packet', 'Frame'],
      answerIndex: 3,
      explanation: 'The data link layer builds frames. Segments belong to transport, packets to network and bits to physical.',
      difficulty: 'easy',
      topic: 'Encapsulation',
    },
    {
      id: 'ch01-q7',
      question: 'Which OSI layers together correspond to the TCP/IP application layer?',
      options: ['Session, Presentation and Application', 'Transport, Session and Presentation', 'Application only', 'Network, Transport and Application'],
      answerIndex: 0,
      explanation: 'TCP/IP has no separate session or presentation layers, so those functions fall inside its application layer.',
      difficulty: 'medium',
      topic: 'OSI and TCP/IP',
    },
    {
      id: 'ch01-q8',
      question: 'A packet crosses a router with no NAT on its way to a remote server. What does the router change?',
      options: ['Source and destination IP addresses', 'TCP source and destination ports', 'Source and destination MAC addresses, and the TTL', 'The HTTP request headers'],
      answerIndex: 2,
      explanation: 'The router builds a new frame for the next link, so the MAC addresses change, and it decrements TTL. IP addresses and ports stay the same without NAT.',
      difficulty: 'medium',
      topic: 'Encapsulation',
    },
    {
      id: 'ch01-q9',
      question: 'What is the transmission delay of a 1500-byte packet on a 100 Mbps link?',
      options: ['12 microseconds', '120 microseconds', '1.2 milliseconds', '15 microseconds'],
      answerIndex: 1,
      explanation: 'L = 1500 x 8 = 12000 bits, and 12000 / (100 x 10^6) = 120 microseconds. The answer 15 microseconds comes from forgetting to convert bytes to bits.',
      difficulty: 'medium',
      topic: 'Delay and throughput',
    },
    {
      id: 'ch01-q10',
      question: 'A path has links of 200 Mbps, 50 Mbps and 1 Gbps. What is the highest possible end-to-end throughput?',
      options: ['1 Gbps', '200 Mbps', 'About 417 Mbps', '50 Mbps'],
      answerIndex: 3,
      explanation: 'Throughput is limited by the bottleneck, min(200, 50, 1000) = 50 Mbps. The average of the rates has no physical meaning here.',
      difficulty: 'medium',
      topic: 'Delay and throughput',
    },
    {
      id: 'ch01-q11',
      question: 'How is a hub-based Ethernet LAN best described?',
      options: ['Physically a star, logically a bus', 'Physically a bus, logically a star', 'Physically and logically a ring', 'Physically a mesh, logically a star'],
      answerIndex: 0,
      explanation: 'Cables run to a central hub, forming a physical star, but the hub repeats every frame to all ports, so the devices share the medium like a bus.',
      difficulty: 'medium',
      topic: 'Topologies',
    },
    {
      id: 'ch01-q12',
      question: 'What is the main function of an Internet Exchange Point?',
      options: ['Selling paid transit to the rest of the Internet', 'Providing last-mile access to homes', 'Providing a shared switch where networks exchange traffic directly', 'Running the global DNS root zone'],
      answerIndex: 2,
      explanation: 'An IXP gives members a shared Layer 2 fabric on which their routers can peer. It is not an ISP and does not sell Internet access.',
      difficulty: 'medium',
      topic: 'Internet structure',
    },
    {
      id: 'ch01-q13',
      question: 'Packets of 1500 bytes arrive at a router output port at an average of 800 per second. The link rate is 10 Mbps. What is the traffic intensity and what does it imply?',
      options: ['0.12, so the queue is almost always empty', '0.96, so the queue is stable on average but queuing delay is large', '1.2, so the queue grows without limit', '9.6, so most packets are dropped'],
      answerIndex: 1,
      explanation: 'La/R = 12000 x 800 / (10 x 10^6) = 0.96. This is below 1, so the queue does not grow without limit, but queuing delay rises sharply as intensity nears 1.',
      difficulty: 'hard',
      topic: 'Delay and throughput',
    },
    {
      id: 'ch01-q14',
      question: 'A TCP segment carries 1460 bytes of data with no IP or TCP options, in an untagged Ethernet II frame. What is the frame size, counting the header and FCS but not the preamble?',
      options: ['1500 bytes', '1514 bytes', '1518 bytes', '1538 bytes'],
      answerIndex: 2,
      explanation: '1460 + 20 + 20 = 1500 bytes of IP packet, and 1500 + 14 + 4 = 1518. The value 1514 omits the FCS, and 1538 adds the 8-byte preamble and SFD and the 12-byte gap.',
      difficulty: 'hard',
      topic: 'Encapsulation',
    },
    {
      id: 'ch01-q15',
      question: 'ISP A buys transit from Tier 1 provider T and also peers with ISP B at an IXP. Which routes does A normally advertise to B over the peering session?',
      options: ['Only its own prefixes and those of its customers', 'Its full Internet table, including routes from T', 'Only the prefixes it learned from T', 'No routes, because the IXP switch routes all traffic'],
      answerIndex: 0,
      explanation: 'Peering covers only each side\'s own and customer networks. Advertising T\'s routes would let B use A\'s paid transit for free. The IXP fabric is a Layer 2 switch and makes no routing decisions.',
      difficulty: 'hard',
      topic: 'Internet structure',
    },
  ],
  importantQuestions: [
    {
      q: 'Differentiate between bandwidth and throughput.',
      modelAnswer: 'Bandwidth is the maximum data rate a link supports, for example 100 Mbps.\nThroughput is the rate actually delivered end to end. It is limited by the slowest link and by congestion, so it never exceeds the bottleneck rate.',
      marks: 2,
    },
    {
      q: 'What are the three key elements of a protocol?',
      modelAnswer: 'Syntax: the structure and format of the message fields.\nSemantics: the meaning of each field and the action it triggers.\nTiming: when data may be sent and how fast.',
      marks: 2,
    },
    {
      q: 'Explain the four components of nodal delay, with formulas where they exist.',
      modelAnswer: 'Processing delay: time to examine the header, check for errors and find the output port. Usually microseconds.\nQueuing delay: time waiting in the output buffer. It ranges from zero to many milliseconds and depends on traffic intensity La/R.\nTransmission delay: time to push all bits onto the link, d_trans = L/R. It depends on packet size and link rate, not distance.\nPropagation delay: time for a bit to travel the link, d_prop = d/s, with s about 2 x 10^8 m/s in fibre. It depends on distance and medium, not packet size.\nTotal: d_nodal = d_proc + d_queue + d_trans + d_prop.',
      marks: 5,
    },
    {
      q: 'Compare bus, ring, star and mesh topologies. How many links does a full mesh of 8 devices need?',
      modelAnswer: 'Bus: one shared cable. Low cost, but collisions occur and a backbone break stops the segment.\nRing: each node links to two neighbours, using n links. A break stops a simple ring, while dual rings recover.\nStar: each node links to a central device, using n links. A cable fault affects one node, but the centre is a single point of failure.\nMesh: direct links between devices. Highest redundancy and highest cost.\nFull mesh of 8 devices: 8 x 7 / 2 = 28 links, with 7 ports on each device.',
      marks: 5,
    },
    {
      q: 'Explain encapsulation and decapsulation with the headers added at each layer.',
      modelAnswer: 'Encapsulation: each layer treats data from above as payload and adds its own header.\nTransport: TCP adds at least 20 bytes with ports, sequence and acknowledgment numbers, forming a segment.\nNetwork: IPv4 adds at least 20 bytes with addresses, TTL and protocol, forming a packet.\nData link: Ethernet adds a 14-byte header with MACs and EtherType and a 4-byte FCS, forming a frame.\nPhysical: sends the frame as bits.\nDecapsulation: the receiver checks and removes each header in reverse. EtherType selects IP, the IP Protocol field selects TCP, and the destination port selects the application.',
      marks: 5,
    },
    {
      q: 'Describe the ISP hierarchy and the role of an IXP. Distinguish transit from peering.',
      modelAnswer: 'Tier 1 ISPs are global backbones that reach all networks without paying for transit, and they peer with each other.\nTier 2 ISPs are regional or national. They peer with some networks and buy transit for the rest.\nTier 3 ISPs are access providers that serve homes and offices and buy transit from above.\nAn IXP is a neutral site with a shared Layer 2 switch, where members exchange traffic directly. This lowers transit cost and delay.\nTransit is paid and reaches the whole Internet. Peering is usually settlement-free and reaches only the peer and its customers.',
      marks: 5,
    },
    {
      q: 'Explain the OSI reference model with the function of each layer, and compare it with the TCP/IP model.',
      modelAnswer: 'OSI is a seven-layer ISO reference model (ISO/IEC 7498-1).\n7 Application: network services for user programs, for example HTTP and DNS.\n6 Presentation: data format, encryption and compression.\n5 Session: opens, manages and closes dialogs.\n4 Transport: process-to-process delivery using ports, with segmentation, reliability and flow control. The PDU is the segment.\n3 Network: host-to-host delivery across networks, using IP addresses and routing. The PDU is the packet.\n2 Data Link: node-to-node delivery on one link, with framing, MAC addressing and error detection. The PDU is the frame.\n1 Physical: sends bits as electrical, optical or radio signals.\nComparison: TCP/IP has four layers: Application, Transport, Internet and Link. Its application layer covers OSI layers 5 to 7, and its link layer covers OSI layers 1 and 2.\nOSI defined the model before its protocols, whereas TCP/IP protocols came first.\nThe OSI network layer offers connection-oriented and connectionless service, and its original transport layer is connection-oriented. TCP/IP is connectionless at the Internet layer and offers both TCP and UDP at transport.\nOSI remains the teaching and troubleshooting vocabulary, while TCP/IP runs the Internet.',
      marks: 10,
    },
    {
      q: 'Trace a web request from a home laptop to a remote web server, stating which headers are added and which addresses change.',
      modelAnswer: 'Setup: laptop 192.168.1.23, home router as gateway, remote server 203.0.113.10 on port 443.\n1. DNS resolves the name to 203.0.113.10. The browser builds an HTTP request and TLS encrypts it.\n2. TCP, after its three-way handshake, adds a header with a source port and destination port 443, forming a segment.\n3. IP adds source and destination addresses and TTL, forming a packet. The destination is outside the subnet, so the next hop is the default gateway.\n4. ARP gives the gateway MAC. The link layer adds a header with source and destination MAC and an FCS, forming a frame, and the physical layer sends it as bits.\n5. A switch forwards by destination MAC without changing the frame.\n6. Each router removes the frame, decrements TTL, looks up the destination IP and builds a new frame. MAC addresses change on every link while IP addresses stay the same. The home router also applies NAT, replacing the private source IP and port.\n7. At the server, the NIC checks FCS and MAC, EtherType 0x0800 passes the packet to IPv4, Protocol 6 passes the segment to TCP, and port 443 passes the data to the web server process.\n8. The reply is encapsulated in the same way, and the home router reverses NAT before delivering it to the laptop.',
      marks: 10,
    },
  ],
  numericals: [
    {
      question: 'A router forwards a 1250-byte packet onto a 100 Mbps link that is 300 km long, with propagation speed 2 x 10^8 m/s. Processing delay is 50 microseconds and queuing delay is 2 ms. Find the nodal delay.',
      steps: [
        'L = 1250 x 8 = 10000 bits.',
        'd_trans = L / R = 10000 / (100 x 10^6) = 0.0001 s = 0.1 ms.',
        'd_prop = d / s = (300 x 10^3) / (2 x 10^8) = 0.0015 s = 1.5 ms.',
        'd_proc = 50 microseconds = 0.05 ms, and d_queue = 2 ms.',
        'd_nodal = 0.05 + 2 + 0.1 + 1.5 = 3.65 ms.',
      ],
      answer: '3.65 ms',
    },
    {
      question: 'A 1500-byte packet crosses 3 links through 2 routers using store and forward. Each link runs at 100 Mbps and is 400 km long, with propagation speed 2 x 10^8 m/s. Each router has a processing delay of 40 microseconds, and queues are empty. Find the end-to-end delay.',
      steps: [
        'L = 1500 x 8 = 12000 bits.',
        'Transmission per link = 12000 / (100 x 10^6) = 0.12 ms. For 3 links: 3 x 0.12 = 0.36 ms.',
        'Propagation per link = (400 x 10^3) / (2 x 10^8) = 2 ms. For 3 links: 3 x 2 = 6 ms.',
        'Processing at 2 routers = 2 x 0.04 = 0.08 ms.',
        'Total = 0.36 + 6 + 0.08 = 6.44 ms.',
      ],
      answer: '6.44 ms',
    },
    {
      question: 'A server sends a 250 MB file to a home user over links of 1 Gbps, 100 Mbps and 40 Mbps. Take 1 MB = 10^6 bytes and ignore overhead. Find the transfer time. What is the new time if the 40 Mbps link is upgraded to 200 Mbps?',
      steps: [
        'File size = 250 x 8 = 2000 megabits.',
        'Throughput = min(1000, 100, 40) = 40 Mbps.',
        'Time = 2000 / 40 = 50 s.',
        'After the upgrade, throughput = min(1000, 100, 200) = 100 Mbps, so the bottleneck has moved.',
        'New time = 2000 / 100 = 20 s.',
      ],
      answer: '50 s before the upgrade and 20 s after it',
    },
    {
      question: 'A 1 Gbps path has an RTT of 60 ms. Find the bandwidth-delay product in bits and in megabytes. What is the maximum throughput if TCP can have only a 65535-byte window in flight per RTT?',
      steps: [
        'BDP = R x RTT = 10^9 x 0.06 = 6 x 10^7 bits.',
        'In bytes: 6 x 10^7 / 8 = 7.5 x 10^6 bytes = 7.5 MB.',
        'Window-limited throughput = window / RTT = (65535 x 8) / 0.06.',
        '524280 bits / 0.06 s = 8738000 bit/s, about 8.74 Mbps.',
        'This is far below 1 Gbps, which is why TCP window scaling exists.',
      ],
      answer: 'BDP = 6 x 10^7 bits = 7.5 MB; window-limited throughput is about 8.74 Mbps',
    },
  ],
  keyTerms: [
    'Network: Autonomous devices linked by media that exchange data using shared protocols.',
    'Protocol: Agreed rules for message format, meaning, order and timing between peers.',
    'Host: End system such as a laptop, phone or server that runs applications.',
    'Topology: Physical or logical arrangement of nodes and links in a network.',
    'OSI model: Seven-layer ISO reference model used to describe network functions.',
    'TCP/IP model: Four-layer model of the Internet protocol suite, defined in RFC 1122.',
    'PDU: Protocol data unit, the named block of data handled at a given layer.',
    "Encapsulation: Adding each layer's header, and a trailer at layer 2, around upper-layer data.",
    'MTU: Largest IP packet a link can carry in one frame, 1500 bytes on standard Ethernet.',
    'Transmission delay: Time to push all bits of a packet onto the link, equal to L/R.',
    'Propagation delay: Time for one bit to travel the length of the link, equal to d/s.',
    'Queuing delay: Time a packet waits in a router output buffer before being sent.',
    'Throughput: Actual rate of successful data delivery, limited by the slowest link.',
    'RTT: Round-trip time, the time for a packet to reach a host and the reply to return.',
    'ISP: Company that sells Internet connectivity to customers and other networks.',
    'IXP: Facility with a shared switch where networks connect and exchange traffic directly.',
    'Transit: Paid service in which a provider carries traffic to the whole Internet.',
    "Peering: Direct exchange of traffic between two networks for their own customers' routes.",
    'Autonomous system: Group of IP networks under one routing policy, identified by an ASN.',
  ],
  formulas: [
    { name: 'Full mesh links', expression: 'links = n(n-1)/2', note: 'Each device needs n-1 ports.' },
    { name: 'Transmission delay', expression: 'd_trans = L / R', note: 'L in bits, R in bits per second.' },
    { name: 'Propagation delay', expression: 'd_prop = d / s', note: 's is about 2 x 10^8 m/s in fibre and copper, and 3 x 10^8 m/s in free space.' },
    { name: 'Nodal delay', expression: 'd_nodal = d_proc + d_queue + d_trans + d_prop' },
    { name: 'End-to-end delay', expression: 'd_e2e = N x (d_proc + d_trans + d_prop)', note: 'N identical links, store and forward, empty queues. If only routers process, count d_proc N-1 times.' },
    { name: 'Traffic intensity', expression: 'I = L x a / R', note: 'a is the average packet arrival rate. Keep I below 1.' },
    { name: 'End-to-end throughput', expression: 'T = min(R1, R2, ..., RN)', note: 'The slowest link on the path sets the limit.' },
    { name: 'Transfer time', expression: 'time = file size in bits / T' },
    { name: 'Bandwidth-delay product', expression: 'BDP = R x RTT', note: 'Data that can be in flight on the path.' },
    { name: 'Encapsulation efficiency', expression: 'efficiency = application data / total bytes sent' },
  ],
  handsOnChecklist: [
    'Run ipconfig /all or ip addr and note your IP address, MAC address, default gateway and DNS server.',
    'Ping your gateway, then run arp -a or ip neigh and find the MAC address of the gateway.',
    'Capture one HTTPS connection in Wireshark and note the EtherType, IP Protocol number and TCP ports of one packet.',
    'Build a star of three PCs and one switch in Cisco Packet Tracer, then remove one cable and observe which pings fail.',
    'Run tracert or traceroute to 8.8.8.8, count the hops and mark where the RTT rises most.',
    'Look up an IXP such as NIXI or DE-CIX on PeeringDB and list three of its member networks.',
  ],
};

export default chapter;

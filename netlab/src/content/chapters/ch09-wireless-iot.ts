import type { Chapter } from '@/lib/types';

const chapter: Chapter = {
  slug: 'wireless-iot',
  number: 9,
  title: 'Wireless, mobile and IoT networks',
  shortTitle: 'Wireless and IoT',
  summary:
    'Radio links lose power with distance, suffer interference and cannot detect collisions, so wireless networks need their own access methods. This chapter covers 802.11 CSMA/CA, RTS and CTS, frame types and association, Wi-Fi standards and channels, the 4G and 5G core with handover, Bluetooth and Zigbee, the IoT protocols MQTT and CoAP, and Mobile IP.',
  estMinutes: 80,
  learningObjectives: [
    'Explain how path loss, fading, interference and half-duplex radios shape wireless protocol design.',
    'Trace CSMA/CA, RTS and CTS, and the 802.11 association sequence frame by frame.',
    'Compare Wi-Fi standards and plan non-overlapping channels for a real building.',
    'Describe the 4G and 5G core functions and walk through a cellular handover.',
    'Choose between Bluetooth, Zigbee, MQTT and CoAP for a given IoT requirement.',
    'Explain how Mobile IP forwards packets and relate it to anchors in cellular networks.',
  ],
  overviewVideoId: 'ch09-overview',
  sections: [
    {
      id: 'wireless-challenges',
      title: 'Why wireless links behave differently',
      blocks: [
        {
          type: 'paragraph',
          text: 'A wired link gives a sender a stable, private channel. A radio link shares the air with every nearby transmitter, and its quality can change when someone walks past. Every mechanism in this chapter, from CSMA/CA to cellular handover, exists to cope with these physical facts.',
        },
        {
          type: 'points',
          items: [
            '**Path loss:** signal power falls with distance, in free space as the square of distance. Walls, floors and bodies add further loss.',
            '**Multipath fading:** reflected copies of a signal arrive at different times and add or cancel. Moving a laptop a few centimetres can change the received level.',
            '**Interference:** the 2.4 GHz ISM band is shared by Wi-Fi, Bluetooth, Zigbee and microwave ovens, so the noise level is never constant.',
            '**Half-duplex radios:** a station transmitting at high power cannot reliably hear a weak signal at the same time, so collision detection is impractical.',
            '**High bit error rate:** errors are common and are not always caused by congestion, so 802.11 acknowledges and retransmits at the link layer.',
            '**Mobility and open medium:** devices move between cells and need handover, and anyone in range can capture frames, so encryption is essential.',
          ],
        },
        {
          type: 'callout',
          variant: 'formula',
          text: 'Free-space path loss: `FSPL(dB) = 20 log10(d) + 20 log10(f) + 32.44`, with `d` in km and `f` in MHz. Received power: `Pr = Pt + Gt + Gr - FSPL`. SNR in dB is `Pr` minus the noise floor.',
        },
        {
          type: 'table',
          headers: ['Received signal', 'Quality', 'What usually works'],
          rows: [
            ['`-30` to `-50 dBm`', 'Excellent', 'Highest modulation, close to the AP'],
            ['`-50` to `-67 dBm`', 'Good', 'Video calls and VoIP; `-67 dBm` is a common design target'],
            ['`-67` to `-80 dBm`', 'Fair to weak', 'Browsing works, and the rate adapts downward'],
            ['Below `-80 dBm`', 'Poor', 'Frequent retries, and the connection may drop'],
          ],
        },
        {
          type: 'example',
          title: 'Link budget for a home AP through two walls',
          steps: [
            'Given: `Pt = 20 dBm`, AP antenna gain `3 dBi`, client antenna gain `0 dBi`, `f = 5180 MHz` (channel `36`), `d = 30 m = 0.03 km`, two brick walls at about `10 dB` each, noise floor `-90 dBm`.',
            'Free-space loss: `20 log10(0.03) + 20 log10(5180) + 32.44 = -30.46 + 74.29 + 32.44 = 76.27 dB`.',
            'Without walls: `Pr = 20 + 3 + 0 - 76.27 = -53.27 dBm`.',
            'With walls: `-53.27 - 20 = -73.27 dBm`.',
            'SNR: `-73.27 - (-90) = 16.73 dB`. The link works, but at a much lower modulation than it would use at `-53 dBm`.',
          ],
        },
        {
          type: 'callout',
          variant: 'remember',
          text: 'Decibel shortcuts: `+3 dB` doubles power and `+10 dB` multiplies it by 10. In free space, doubling the distance adds about `6 dB` of loss, and so does doubling the frequency.',
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'Home routers run 2.4 GHz and 5 GHz side by side because of this physics. 2.4 GHz reaches further through walls, while 5 GHz offers wider and cleaner channels. Offices solve coverage by installing many low-power APs rather than one loud one.',
        },
      ],
    },
    {
      id: 'wifi-csma-ca',
      title: '802.11 architecture and CSMA/CA',
      videoId: 'ch09-wifi-csma-ca',
      blocks: [
        {
          type: 'paragraph',
          text: 'IEEE 802.11 is the standard family behind Wi-Fi. It defines the radio formats and a MAC layer that lets many stations share one channel without central scheduling in the usual case. The basic access method is the Distributed Coordination Function (DCF), built on CSMA/CA.',
        },
        {
          type: 'points',
          items: [
            '**Station (STA):** any device with an 802.11 radio.',
            '**Access point (AP):** a station that bridges wireless frames to the wired network.',
            '**BSS:** one AP and its associated stations, identified by the BSSID, usually the radio MAC of the AP.',
            '**ESS:** several BSSs with the same SSID joined by a distribution system, usually switched Ethernet, so a device can roam and keep its IP address.',
            '**IBSS (ad hoc):** stations talking directly with no AP.',
          ],
        },
        {
          type: 'paragraph',
          text: 'Classic Ethernet listens while it sends and aborts on a collision. A radio cannot do this reliably, and what matters is the signal at the receiver, not at the sender. So 802.11 tries to avoid collisions before they happen and uses an ACK to confirm delivery.',
        },
        {
          type: 'diagram',
          id: 'ch09-csma-ca-flow',
          title: 'CSMA/CA under DCF',
          caption: 'A station sends at once only if the medium was idle for DIFS. Otherwise it runs a random backoff that freezes while the medium is busy, and every missing ACK widens the contention window.',
          kind: 'flowchart',
          mermaid: `flowchart TD
    A1["Frame ready to send"] --> A2{"Medium idle for DIFS?"}
    A2 -->|Yes| A8["Transmit the whole frame"]
    A2 -->|No| A3["Wait until medium idle for DIFS"]
    A3 --> A4["Pick k at random from 0 to CW"]
    A4 --> A5{"Is k zero?"}
    A5 -->|Yes| A8
    A5 -->|No| A6{"Medium idle for one slot?"}
    A6 -->|No| A7["Freeze k, resume after DIFS idle"]
    A7 --> A6
    A6 -->|Yes| A9["Decrement k by 1"]
    A9 --> A5
    A8 --> A10{"ACK within timeout?"}
    A10 -->|Yes| A11["Reset CW to CWmin"]
    A11 --> A12["Frame delivered"]
    A10 -->|No| A13["Set CW to 2CW plus 1 up to CWmax"]
    A13 --> A14{"Retry limit reached?"}
    A14 -->|No| A3
    A14 -->|Yes| A15["Drop frame and reset CW"]`,
        },
        {
          type: 'points',
          items: [
            '**Physical carrier sense:** the radio checks energy and preambles on the channel, called Clear Channel Assessment.',
            '**Interframe spaces:** `SIFS` is the shortest and protects an exchange in progress, such as an ACK. `DIFS` is longer and is what a station waits before contending with a new frame.',
            '**Binary exponential backoff:** `k` is drawn uniformly from `0` to `CW`. `CW` starts at `CWmin` and roughly doubles after each failure, up to `CWmax`.',
            '**Frozen counter:** while the medium is busy `k` does not change, so a station that has already waited keeps its advantage.',
            '**Stop and wait:** each unicast data frame needs an ACK after `SIFS`. Broadcast frames get no ACK and no retry.',
            '**Post-backoff:** after a success the station backs off again before its next frame, so it cannot monopolise the channel.',
          ],
        },
        {
          type: 'table',
          headers: ['PHY', 'Slot', 'SIFS', 'DIFS', 'CWmin', 'CWmax'],
          rows: [
            ['802.11b (DSSS, 2.4 GHz)', '20 µs', '10 µs', '50 µs', '31', '1023'],
            ['802.11g or n, 2.4 GHz, short slot', '9 µs', '10 µs', '28 µs', '15', '1023'],
            ['802.11a, n, ac, ax on 5 GHz', '9 µs', '16 µs', '34 µs', '15', '1023'],
          ],
        },
        {
          type: 'callout',
          variant: 'formula',
          text: 'Timing rules: `DIFS = SIFS + 2 x slot`. Backoff time `= k x slot`. Next window: `CW = 2 x CW + 1`, capped at `CWmax`, which gives `15, 31, 63, 127, 255, 511, 1023` on OFDM PHYs.',
        },
        {
          type: 'paragraph',
          text: 'Carrier sensing happens at the sender, but collisions happen at the receiver. If two stations can both reach the AP but not each other, each senses an idle channel and transmits. This is the **hidden terminal** problem.',
        },
        {
          type: 'diagram',
          id: 'ch09-hidden-terminal',
          title: 'Hidden terminal',
          caption: 'Stations A and C both reach access point B but cannot hear each other. Carrier sense at each sender reports idle, so their frames overlap at B.',
          kind: 'block',
          mermaid: `flowchart LR
    subgraph Z1["Out of range of station C"]
        A1["Station A"]
    end
    subgraph Z2["In range of both stations"]
        B1["Access point B"]
    end
    subgraph Z3["Out of range of station A"]
        C1["Station C"]
    end
    A1 -->|Data frame| B1
    C1 -->|Data frame| B1
    B1 --> X1["Frames overlap and collide at AP"]
    A1 -.-|Cannot hear each other| C1`,
        },
        {
          type: 'points',
          items: [
            '**Exposed terminal:** a station hears a nearby sender and defers, even though its own transmission to a different receiver would not have caused a collision. Capacity is wasted, but no frame is lost.',
            '**RTS and CTS:** the sender reserves the medium with RTS (`20` bytes) and the receiver answers with CTS (`14` bytes). A hidden station cannot hear the RTS but can hear the CTS.',
            '**Virtual carrier sense:** each frame has a `Duration` field in microseconds. Stations that overhear it load their **NAV** timer and treat the medium as busy until it expires.',
            '**Threshold:** RTS and CTS is used only above the configured RTS threshold. Many drivers default to `2347` bytes, which effectively turns it off.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch09-rts-cts-data-ack',
          title: 'Wi-Fi data transfer with RTS, CTS, DATA and ACK',
          caption: 'A station sending to the AP. SIFS keeps the four frames together, and the NAV keeps neighbours of both ends silent. Losing an RTS costs far less airtime than losing a long data frame.',
          kind: 'working-flowchart',
          mermaid: `flowchart TD
    A1["Station has frame above RTS threshold"] --> A2["Sense idle for DIFS, then back off"]
    A2 --> A3["Station sends RTS with Duration"]
    A3 --> A4["Neighbours of station set NAV"]
    A4 --> A5{"AP got RTS and its NAV is clear?"}
    A5 -->|No| A6["No CTS, so raise CW and retry"]
    A6 --> A2
    A5 -->|Yes| A7["AP waits SIFS and sends CTS"]
    A7 --> A8["Neighbours of AP set NAV"]
    A8 --> A9["Station waits SIFS and sends DATA"]
    A9 --> A10{"AP received DATA with good FCS?"}
    A10 -->|No| A11["No ACK, so raise CW and retry"]
    A11 --> A2
    A10 -->|Yes| A12["AP waits SIFS and sends ACK"]
    A12 --> A13["NAV expires, others contend after DIFS"]`,
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: 'Separate the two sensing methods. **Physical** carrier sense listens to the radio. **Virtual** carrier sense trusts the `Duration` field and sets the `NAV`. A station transmits only if both report idle. RTS and CTS addresses hidden terminals, not exposed terminals.',
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'Modern Wi-Fi rarely sends plain single frames. QoS traffic uses **EDCA** (802.11e), where voice waits less than background traffic, and data frames are aggregated into an A-MPDU with one Block Ack. APs use RTS and CTS or CTS-to-self mainly for long aggregates or to protect older stations, because the handshake costs airtime.',
        },
      ],
    },
    {
      id: 'wifi-frames-association',
      title: '802.11 frames and joining a network',
      blocks: [
        {
          type: 'paragraph',
          text: 'All 802.11 traffic falls into three frame families, identified by the 2-bit Type field in Frame Control. Before a station can send one data frame, management frames must find the network and associate with it, and the security handshake must finish.',
        },
        {
          type: 'points',
          items: [
            '**Header layout:** Frame Control (`2` bytes), Duration/ID (`2`), Address 1, 2 and 3 (`6` each), Sequence Control (`2`), optional Address 4 (`6`), optional QoS Control (`2`), Frame Body, FCS (`4`).',
            '**Why 3 or 4 addresses:** an AP is a relay, so a frame must name both the radio hop and the real source or destination.',
            '**Receiver first:** Address 1 is always the receiver on the radio hop and Address 2 is the transmitter.',
          ],
        },
        {
          type: 'table',
          headers: ['Type bits', 'Family', 'Common subtypes', 'Purpose'],
          rows: [
            ['`00`', 'Management', 'Beacon, Probe, Authentication, Association, Deauthentication', 'Find, join and leave a network'],
            ['`01`', 'Control', 'RTS, CTS, ACK, Block Ack, PS-Poll', 'Assist delivery of data frames'],
            ['`10`', 'Data', 'Data, QoS Data, Null', 'Carry payload or signal power state'],
          ],
        },
        {
          type: 'table',
          headers: ['To DS', 'From DS', 'Direction', 'Address 1', 'Address 2', 'Address 3', 'Address 4'],
          rows: [
            ['`0`', '`0`', 'Direct, or management', 'DA', 'SA', 'BSSID', 'Not used'],
            ['`1`', '`0`', 'Station to AP', 'BSSID', 'SA', 'DA', 'Not used'],
            ['`0`', '`1`', 'AP to station', 'DA', 'BSSID', 'SA', 'Not used'],
            ['`1`', '`1`', 'AP to AP, mesh or WDS', 'RA', 'TA', 'DA', 'SA'],
          ],
        },
        {
          type: 'diagram',
          id: 'ch09-wifi-association',
          title: 'Wi-Fi association on a WPA2-Personal network',
          caption: 'Scan, authenticate, associate, run the 4-way handshake, then get an IP address. Beacons allow passive scanning and probes allow active scanning. On a home router the AP and DHCP server are one box.',
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant S as Station
    participant A as Access point
    participant D as DHCP server
    A->>S: Beacon with SSID and capabilities
    S->>A: Probe Request
    A->>S: Probe Response
    S->>A: Authentication Request Open System
    A->>S: Authentication Response success
    S->>A: Association Request SSID rates RSN
    A->>S: Association Response status and AID
    Note over S,A: 4-way handshake derives PTK and delivers GTK
    A->>S: EAPOL Message 1 ANonce
    S->>A: EAPOL Message 2 SNonce and MIC
    A->>S: EAPOL Message 3 GTK and MIC
    S->>A: EAPOL Message 4 ACK
    Note over S,A: Port opens and data frames are now encrypted
    S->>D: DHCP Discover
    D->>S: DHCP Offer
    S->>D: DHCP Request
    D->>S: DHCP ACK`,
        },
        {
          type: 'points',
          items: [
            '**Scanning:** passive scanning listens for Beacons, sent about every `102.4 ms`. Active scanning sends a Probe Request on each channel.',
            '**Authentication frames:** in WPA2 these are a legacy Open System exchange that proves nothing. WPA3-Personal replaces them with SAE Commit and Confirm.',
            '**Association:** the station states its rates and security choice in the RSN element, and the AP assigns an Association ID (AID).',
            '**4-way handshake:** both sides prove they hold the PMK and derive the PTK for unicast traffic. The AP then delivers the GTK for group traffic. The passphrase is never sent.',
            '**Enterprise networks:** with 802.1X, an EAP exchange through a RADIUS server produces the PMK before the 4-way handshake.',
            '**Leaving or moving:** Deauthentication and Disassociation end the link. Reassociation moves a station to a new AP in the same ESS.',
          ],
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: 'Memorise the order: **scan, authenticate, associate, 4-way handshake, DHCP**. In 802.11, authentication frames come before association, and the IP address comes last.',
        },
        {
          type: 'wireshark',
          filter: 'wlan.fc.type_subtype == 0x08 || wlan.fc.type_subtype == 0x0b || wlan.fc.type_subtype == 0x00 || wlan.fc.type_subtype == 0x01 || eapol',
          whatToLook: [
            'Capture in monitor mode on Linux or open a public sample capture. In normal mode an adapter usually shows converted Ethernet frames, so 802.11 headers are missing.',
            'Beacon (0x08): read Beacon Interval, the SSID tag and the RSN Information tag.',
            'Authentication (0x0b): algorithm Open System, sequence 1 from the station and 2 from the AP.',
            'Association Response (0x01): status code 0 means success, and the Association ID is listed.',
            'EAPOL: four Key frames. Message 1 carries the ANonce, and Message 2 carries the SNonce and a MIC.',
            'Data frames: open Frame Control, read the To DS and From DS flags and match them to the address table.',
          ],
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'Campus networks centralise all of this. Lightweight APs tunnel to a wireless LAN controller using **CAPWAP** (UDP `5246` control, `5247` data), 802.1X checks each user through a RADIUS server (UDP `1812`), and 802.11k, v and r speed up roaming. Cloud-managed systems keep the same roles with the controller hosted off-site.',
        },
      ],
    },
    {
      id: 'wifi-standards-channels',
      title: 'Wi-Fi standards, channels and deployment',
      blocks: [
        {
          type: 'paragraph',
          text: 'Each 802.11 amendment changed the physical layer to gain speed or efficiency while keeping the same basic MAC. Channel planning then decides how much of that speed a building really gets, because all APs and clients on one channel share its airtime.',
        },
        {
          type: 'table',
          headers: ['Standard', 'Name', 'Year', 'Bands', 'Max width', 'Key feature', 'Max PHY rate'],
          rows: [
            ['802.11b', 'None', '1999', '2.4 GHz', '22 MHz', 'DSSS, CCK', '11 Mbps'],
            ['802.11a', 'None', '1999', '5 GHz', '20 MHz', 'OFDM, 64-QAM', '54 Mbps'],
            ['802.11g', 'None', '2003', '2.4 GHz', '20 MHz', 'OFDM, 64-QAM', '54 Mbps'],
            ['802.11n', 'Wi-Fi 4', '2009', '2.4, 5 GHz', '40 MHz', 'MIMO, 4 streams', '600 Mbps'],
            ['802.11ac', 'Wi-Fi 5', '2013', '5 GHz', '160 MHz', '256-QAM, downlink MU-MIMO', '6.9 Gbps'],
            ['802.11ax', 'Wi-Fi 6, 6E', '2021', '2.4, 5, 6 GHz', '160 MHz', 'OFDMA, 1024-QAM, TWT', '9.6 Gbps'],
            ['802.11be', 'Wi-Fi 7', '2024', '2.4, 5, 6 GHz', '320 MHz', '4096-QAM, Multi-Link Operation', '46 Gbps'],
          ],
        },
        {
          type: 'points',
          items: [
            '**2.4 GHz:** channels are `5 MHz` apart but about `20 MHz` wide, so only `1`, `6` and `11` avoid overlap. Long reach, but crowded.',
            '**5 GHz:** many separate 20 MHz channels such as `36`, `40`, `44`, `48` and `149` to `161`. Channels `52` to `144` are DFS channels, which must vacate on detecting radar.',
            '**6 GHz:** used only by Wi-Fi 6E and 7, with no legacy devices, and WPA3 is required. Available spectrum varies by country.',
            '**Channel bonding:** joining channels to 40, 80 or 160 MHz raises the peak rate but leaves fewer non-overlapping channels, so dense buildings use narrower ones.',
            '**Rate adaptation:** the radio picks a modulation and coding scheme (MCS) from the current SNR, which is why speed falls with distance.',
            '**OFDMA:** Wi-Fi 6 assigns groups of sub-carriers to different clients in one transmission, which cuts waiting when many small flows are active.',
          ],
        },
        {
          type: 'callout',
          variant: 'formula',
          text: 'Channel to centre frequency: 2.4 GHz band `f = 2407 + 5 x ch` MHz for channels `1` to `13`. 5 GHz band `f = 5000 + 5 x ch` MHz. So channel `6` is `2437 MHz` and channel `36` is `5180 MHz`.',
        },
        {
          type: 'command-lab',
          title: 'Read your Wi-Fi link on Windows',
          command: 'netsh wlan show interfaces',
          output: `There is 1 interface on the system:

    Name                   : Wi-Fi
    Description            : Intel(R) Wi-Fi 6 AX201 160MHz
    Physical address       : 02:1a:2b:3c:4d:5e
    State                  : connected
    SSID                   : CampusLab
    BSSID                  : 02:aa:bb:cc:dd:01
    Network type           : Infrastructure
    Radio type             : 802.11ax
    Authentication         : WPA2-Personal
    Cipher                 : CCMP
    Band                   : 5 GHz
    Channel                : 36
    Receive rate (Mbps)    : 1201
    Transmit rate (Mbps)   : 1201
    Signal                 : 86%`,
          explanation: [
            '`Name`, `Description`: the adapter, here a Wi-Fi 6 chipset.',
            '`Physical address`: the MAC address of this laptop on the radio hop.',
            '`State: connected`: association and the 4-way handshake have finished.',
            '`SSID`, `BSSID`: the network name, and the MAC of the AP radio serving you. Two APs in one ESS share an SSID but differ in BSSID.',
            '`Network type: Infrastructure`: traffic flows through an AP rather than directly between stations.',
            '`Radio type: 802.11ax`: the link is using Wi-Fi 6.',
            '`Authentication`, `Cipher`: WPA2 with a shared passphrase, and AES-CCMP encryption of data frames.',
            '`Band`, `Channel`: channel `36` is `5180 MHz`.',
            '`Receive rate`, `Transmit rate`: `1201 Mbps` is a PHY rate, matching 2 streams at 80 MHz with 1024-QAM. It is not throughput.',
            '`Signal: 86%`: a Windows scale, roughly `-57 dBm` using `dBm = percent / 2 - 100`.',
          ],
        },
        {
          type: 'callout',
          variant: 'remember',
          text: 'PHY rate is not throughput. Contention, headers, ACKs and retries usually leave about half to two thirds of the PHY rate for data, and all stations on the channel share that.',
        },
        {
          type: 'mini-lab',
          title: 'Map the Wi-Fi channels around you',
          goal: 'See which channels are crowded and decide which one you would pick for your own AP.',
          steps: [
            'On Windows run `netsh wlan show networks mode=bssid` (newer versions may ask for location permission). On Linux run `nmcli -f SSID,BSSID,CHAN,SIGNAL dev wifi list`.',
            'Note the BSSID, channel and signal of every entry. One SSID can appear many times, once per AP radio.',
            'Tally the networks per channel, separately for 2.4 GHz and 5 GHz.',
            'Mark any 2.4 GHz network that is not on `1`, `6` or `11` as overlapping its neighbours.',
            'Pick the best channel for a new AP and write one line of reasoning.',
          ],
          expected: 'A small channel table. 2.4 GHz is usually crowded around `1`, `6` and `11`, while 5 GHz has more free channels, so you can justify your choice with counts and signal levels.',
        },
        {
          type: 'troubleshoot',
          symptom: 'A laptop shows strong Wi-Fi signal in a hostel room, yet video calls stutter and `ping` to the gateway swings between 3 ms and 200 ms.',
          checks: [
            'Run `netsh wlan show interfaces`. A low rate at high signal points to interference, not distance.',
            'Run `ping -n 50 192.168.1.1` to the gateway. Spikes on this first hop prove the fault is local, not at the ISP.',
            'List neighbours with `netsh wlan show networks mode=bssid` and count the APs on your channel.',
            'Check whether the laptop is on 2.4 GHz, where Bluetooth and microwave ovens also interfere.',
            'Test a wired laptop on the same router. If it is steady, the radio link is the cause.',
          ],
          fix: 'Move to 5 GHz or 6 GHz, choose the least used channel, narrow the channel width to `20` or `40 MHz`, and place the AP clear of metal. Avoid raising transmit power, because it adds interference for neighbours.',
        },
        {
          type: 'case-study',
          title: 'Redesigning Wi-Fi in a college hostel',
          scenario: 'A four-floor hostel has 16 consumer routers on mixed channels, each with its own SSID. Students report drops when moving and slow evenings.',
          steps: [
            '**Survey:** a walk test with a Wi-Fi analyzer shows many routers on the same channels and overlapping cells.',
            '**Hardware:** replace them with controller-managed APs on one SSID, each with a wired uplink from a PoE switch.',
            '**Channel plan:** 5 GHz is primary at `40 MHz`. 2.4 GHz uses only `1`, `6` and `11`, and is disabled on alternate APs to reduce co-channel interference.',
            '**Roaming:** lower transmit power, raise the minimum basic rate to `12 Mbps` so cells stay small, and enable 802.11k, v and r.',
            '**Security:** use WPA2 or WPA3-Enterprise with 802.1X and RADIUS, so each student has a personal login.',
            '**Verification:** repeat the walk test, measure with `iperf3`, and monitor retry rate and channel utilisation.',
          ],
        },
      ],
    },
    {
      id: 'cellular-architecture',
      title: 'Cellular networks: 4G and 5G core, and handover',
      videoId: 'ch09-cellular-handover',
      blocks: [
        {
          type: 'paragraph',
          text: 'A cellular network covers a large area with many base stations, each serving a cell. Unlike Wi-Fi, it uses licensed spectrum and a central scheduler in the base station, and it must keep a session alive while the user moves at high speed.',
        },
        {
          type: 'points',
          items: [
            '**Frequency reuse:** a frequency can be used again in a cell far enough away, so capacity grows with the number of cells.',
            '**Cluster:** a group of `N` cells that uses the whole spectrum once. Hexagonal geometry allows `N = 1, 3, 4, 7, 9, 12` and so on.',
            '**Scheduled access:** the base station allocates time and frequency resource blocks to each user, so a connected phone does not contend. Random access is used only to get started.',
            '**Modern reuse:** LTE and 5G NR commonly use reuse `1`, with every cell on the same carrier, and control cell-edge interference by scheduling and beamforming. Clusters remain the classic theory from 2G.',
            '**Radio:** LTE uses OFDMA downlink and SC-FDMA uplink. 5G NR uses OFDM in both directions with scalable sub-carrier spacing.',
          ],
        },
        {
          type: 'callout',
          variant: 'formula',
          text: 'Cluster size `N = i^2 + ij + j^2`. Reuse distance `D = R x sqrt(3N)`. Channels per cell `k = S / N`, where `S` is the total channel count. For `N = 7`, `D = 4.58 R`.',
        },
        {
          type: 'diagram',
          id: 'ch09-4g-5g-core',
          title: '4G EPS and 5G System building blocks',
          caption: 'Both systems separate signalling from user traffic. Interface names are on the edges, and user packets travel on S1-U and S5 in 4G, or on N3 in 5G, inside GTP-U tunnels.',
          kind: 'block',
          mermaid: `flowchart LR
    subgraph L1["4G EPS"]
        UE4["UE"] -->|LTE Uu| ENB["eNodeB"]
        ENB -->|S1-MME| MME["MME mobility and signalling"]
        ENB -->|S1-U| SGW["S-GW user plane anchor"]
        MME -->|S6a| HSS["HSS subscriber data"]
        MME -->|S11| SGW
        SGW -->|S5| PGW["P-GW IP address and gateway"]
        PGW -->|SGi| NET4["Internet"]
    end
    subgraph L2["5G System"]
        UE5["UE"] -->|NR Uu| GNB["gNB"]
        GNB -->|N2| AMF["AMF registration and mobility"]
        GNB -->|N3| UPF["UPF user plane anchor"]
        AMF -->|N11| SMF["SMF session management"]
        SMF -->|N4| UPF
        AMF -->|N12| AUSF["AUSF authentication"]
        AMF -->|N8| UDM["UDM subscriber data"]
        SMF -->|N7| PCF["PCF policy"]
        UPF -->|N6| NET5["Data network"]
    end`,
        },
        {
          type: 'table',
          headers: ['Role', '4G (EPC)', '5G (5GC)'],
          rows: [
            ['Radio base station', 'eNodeB', 'gNB'],
            ['Registration and mobility', 'MME', 'AMF'],
            ['Session management', 'MME with S-GW and P-GW control', 'SMF'],
            ['User-plane anchor', 'S-GW and P-GW', 'UPF'],
            ['Subscriber data and authentication', 'HSS', 'UDM and AUSF'],
            ['Policy', 'PCRF', 'PCF'],
            ['Base station to base station link', 'X2', 'Xn'],
            ['Core signalling style', 'Point to point, Diameter and GTP-C', 'Service-based HTTP/2 APIs'],
          ],
        },
        {
          type: 'points',
          items: [
            '**GTP-U tunnels:** user packets are wrapped in GTP-U over UDP `2152` between the base station and the gateway, so the phone keeps its IP address as its radio cell changes.',
            '**Anchor:** the P-GW or UPF holds the IP address of the phone and is the point where traffic meets the Internet.',
            '**Service-based core:** 5G functions are software services that discover each other through the NRF and talk over HTTP/2.',
            '**NSA and SA:** Non-Standalone 5G adds an NR radio to a 4G core. Standalone 5G uses the 5G core, which enables slicing.',
            '**Network slicing:** one physical network carries logical networks tuned for broadband (eMBB), low latency (URLLC) or massive sensors (mMTC).',
            '**Bands:** FR1 is below `7.125 GHz`, for example band `n78` at 3.3 to 3.8 GHz. FR2 is millimetre wave from `24.25 GHz`.',
          ],
        },
        {
          type: 'paragraph',
          text: 'Handover moves an active connection from one cell to another. In LTE and 5G the network decides, using measurements reported by the phone. This differs from Wi-Fi, where the client normally decides when to roam.',
        },
        {
          type: 'diagram',
          id: 'ch09-lte-x2-handover',
          title: 'LTE X2-based handover',
          caption: 'The source prepares the target over X2, the UE switches cell using random access, and the MME then moves the downlink tunnel. Buffered data forwarded over X2 avoids loss. 5G follows the same flow over Xn, with the AMF, SMF and UPF.',
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant U as UE
    participant S as Source eNodeB
    participant T as Target eNodeB
    participant M as MME
    participant G as S-GW
    G->>S: Downlink data in GTP-U
    S->>U: Downlink data
    Note over U,T: Preparation
    U->>S: Measurement Report event A3
    S->>T: X2 Handover Request
    T->>S: X2 Handover Request Ack
    Note over U,T: Execution
    S->>U: RRC Connection Reconfiguration
    S->>T: SN Status Transfer
    S->>T: Forward buffered downlink data
    U->>T: Random access preamble
    T->>U: Random access response
    U->>T: RRC Reconfiguration Complete
    Note over T,G: Completion
    T->>M: Path Switch Request
    M->>G: Modify Bearer Request
    G->>M: Modify Bearer Response
    M->>T: Path Switch Request Ack
    G->>T: Downlink data on new path
    T->>S: UE Context Release`,
        },
        {
          type: 'points',
          items: [
            '**Trigger:** the UE reports event A3 when a neighbour cell beats the serving cell by an offset for a time-to-trigger. Hysteresis and this timer prevent ping-pong between cells.',
            '**Preparation:** the target runs admission control and reserves resources before the UE is told to move.',
            '**Execution:** the UE leaves the source and synchronises with the target. This is a hard handover, with an interruption of tens of milliseconds.',
            '**Completion:** the MME tells the S-GW to send downlink to the target, then the source releases the UE context.',
            '**Other cases:** without an X2 link the handover runs through the MME over S1. 3G WCDMA used soft handover, connected to two cells at once.',
            '**Idle mobility:** an idle phone does not hand over. It only reports tracking area changes and is paged for incoming traffic.',
          ],
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: 'State **who does what**: the UE measures, the source decides, the target admits, the MME requests the path switch, and the S-GW moves the tunnel. In 5G, write gNB, Xn, AMF, SMF and UPF, with the UPF updated over N4.',
        },
        {
          type: 'command-lab',
          title: 'See the mobile core from IP through a phone hotspot',
          command: 'tracert -d 8.8.8.8',
          output: `Tracing route to 8.8.8.8 over a maximum of 30 hops

  1     2 ms     1 ms     2 ms  192.168.43.1
  2    38 ms    29 ms    31 ms  10.71.128.1
  3    42 ms    35 ms    33 ms  10.71.130.17
  4    44 ms    37 ms    36 ms  203.0.113.9
  5    47 ms    41 ms    39 ms  198.51.100.22
  6    49 ms    43 ms    41 ms  8.8.8.8

Trace complete.`,
          explanation: [
            'Header: `-d` skips reverse DNS, so only IP addresses appear.',
            'Hop 1: the phone acting as a hotspot, a few milliseconds away over Wi-Fi.',
            'Hop 2: usually the mobile gateway, the P-GW or UPF. The jump to about `30 ms` is mostly radio scheduling. The base station is invisible because packets cross it inside a GTP-U tunnel.',
            'Hop 3: a router in the private network of the operator, commonly near its carrier-grade NAT.',
            'Hops 4 and 5: the operator edge and an upstream network, each adding only a little delay.',
            'Hop 6: the destination at `41` to `49 ms`. Most of the delay was added at hop 2.',
          ],
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'Operators now run the core as software in data centres and place UPFs near cities or at edge sites to cut latency. Phones usually get a private address behind carrier-grade NAT (`10.0.0.0/8` or `100.64.0.0/10`), which is why inbound connections to a phone normally fail.',
        },
      ],
    },
    {
      id: 'bluetooth-zigbee-iot',
      title: 'Bluetooth, Zigbee and IoT protocols',
      videoId: 'ch09-bluetooth-iot-mqtt',
      blocks: [
        {
          type: 'paragraph',
          text: 'IoT devices send small amounts of data, often from a battery, so low energy and low cost come ahead of speed. Two layers matter: the radio that moves bits, and the lightweight application protocol that moves messages.',
        },
        {
          type: 'points',
          items: [
            '**Bluetooth Classic:** 79 channels of `1 MHz` at 2.4 GHz, hopping `1600` times per second, at 1 to 3 Mbps. Used for audio headsets.',
            '**Piconet:** one central device with up to 7 active peripherals sharing a hop pattern. Piconets linked through a shared device form a scatternet.',
            '**Bluetooth Low Energy (BLE):** 40 channels of `2 MHz`. Channels `37`, `38` and `39` carry advertising and the other 37 carry data. Devices sleep most of the time.',
            '**GATT:** BLE data is exposed as services and characteristics that a phone can read, write or subscribe to.',
            '**Zigbee:** network and application layers on the IEEE 802.15.4 PHY and MAC, at `250 kbps` on 2.4 GHz with 16 channels (`11` to `26`), using CSMA/CA and AES-128.',
            '**Zigbee roles:** one coordinator forms the network, routers relay and stay powered, and end devices sleep and talk through a parent. The result is a mesh that routes around failures.',
            '**Thread and Matter:** Thread uses the same 802.15.4 radio but carries IPv6 through 6LoWPAN. Matter is an application layer above Thread and Wi-Fi.',
          ],
        },
        {
          type: 'table',
          headers: ['Technology', 'Band', 'Typical rate', 'Typical range', 'Topology', 'Typical use'],
          rows: [
            ['Wi-Fi', '2.4, 5, 6 GHz', 'Tens to hundreds of Mbps', '30 to 50 m indoors', 'Star through AP', 'Cameras, appliances'],
            ['BLE', '2.4 GHz', '125 kbps to 2 Mbps', '10 to 100 m', 'Star, or mesh', 'Wearables, beacons'],
            ['Zigbee', '2.4 GHz', '250 kbps', '10 to 100 m per hop', 'Mesh', 'Lighting, sensors'],
            ['LoRaWAN', 'Sub-GHz unlicensed', '0.3 to 50 kbps', '2 to 15 km', 'Star of stars', 'Meters, farming'],
            ['NB-IoT', 'Licensed cellular', 'Tens to low hundreds of kbps', 'Cell coverage', 'Star through eNodeB', 'Meters, trackers'],
          ],
        },
        {
          type: 'paragraph',
          text: 'MQTT is a publish and subscribe protocol that runs over TCP. Publishers and subscribers never address each other: they connect to a **broker** and agree only on topic names. One sensor can feed many consumers without knowing them, and outbound connections pass through NAT easily.',
        },
        {
          type: 'diagram',
          id: 'ch09-mqtt-pubsub',
          title: 'MQTT publish and subscribe',
          caption: 'Clients open TCP connections to the broker, which matches each published topic against subscriptions. The alert service gets only temperature, while the dashboard filter also matches humidity.',
          kind: 'block',
          mermaid: `flowchart LR
    subgraph P1["Publishers"]
        T1["Temp sensor topic home/lab/temp"]
        H1["Humidity sensor home/lab/humidity"]
    end
    subgraph B1["Broker on TCP 1883 or TLS 8883"]
        R1["Receives PUBLISH and checks ACL"]
        M1["Matches topic against subscriptions"]
        Q1["Stores retained and queued messages"]
    end
    subgraph S1["Subscribers"]
        D1["Dashboard filter home/lab/+"]
        A1["Alert service filter home/+/temp"]
    end
    T1 -->|PUBLISH| R1
    H1 -->|PUBLISH| R1
    R1 --> M1
    M1 --> Q1
    D1 -.->|SUBSCRIBE| M1
    A1 -.->|SUBSCRIBE| M1
    M1 -->|PUBLISH| D1
    M1 -->|PUBLISH| A1`,
        },
        {
          type: 'points',
          items: [
            '**Ports:** TCP `1883` in clear and `8883` with TLS.',
            '**Topics:** levels separated by `/`, as in `home/lab/temp`. `+` matches exactly one level. `#` matches all remaining levels and must come last.',
            '**Small header:** the fixed header is as small as `2` bytes, which suits constrained links.',
            '**Retained message:** the broker keeps the last message on a topic and gives it to new subscribers at once.',
            '**Last Will:** the broker publishes a stored message if a client vanishes without sending `DISCONNECT`.',
            '**Keep-alive:** `PINGREQ` and `PINGRESP` detect dead connections and keep NAT mappings open.',
          ],
        },
        {
          type: 'table',
          headers: ['QoS', 'Guarantee', 'Packets', 'Typical use'],
          rows: [
            ['`0`', 'At most once', '`PUBLISH`', 'Frequent readings where a loss is harmless'],
            ['`1`', 'At least once, duplicates possible', '`PUBLISH`, `PUBACK`', 'Most telemetry and alerts'],
            ['`2`', 'Exactly once', '`PUBLISH`, `PUBREC`, `PUBREL`, `PUBCOMP`', 'Commands or billing events that must not repeat'],
          ],
        },
        {
          type: 'paragraph',
          text: 'CoAP (RFC 7252) brings a REST model to constrained devices. It runs over UDP with methods such as `GET`, `POST`, `PUT` and `DELETE`, so a sensor looks like a tiny web server addressed by a `coap://` URI.',
        },
        {
          type: 'points',
          items: [
            '**Ports and header:** UDP `5683`, or `5684` with DTLS. The fixed header is `4` bytes.',
            '**Message types:** `CON` needs an `ACK` and is retransmitted with exponential backoff, `NON` needs none, and `RST` rejects a message.',
            '**Response codes:** these mirror HTTP, for example `2.05 Content` and `4.04 Not Found`.',
            '**Observe (RFC 7641):** a client registers once and the server pushes each change. **Block-wise transfer (RFC 7959)** splits large payloads.',
          ],
        },
        {
          type: 'table',
          headers: ['Feature', 'MQTT', 'CoAP', 'HTTP'],
          rows: [
            ['Transport', 'TCP', 'UDP', 'TCP, or QUIC for HTTP/3'],
            ['Model', 'Publish and subscribe via broker', 'Request and response, plus Observe', 'Request and response'],
            ['Minimum header', '2 bytes', '4 bytes', 'Text headers, often hundreds of bytes'],
            ['Reliability', 'QoS 0, 1, 2', '`CON` retransmission or `NON`', 'Relies on the transport'],
            ['Security', 'TLS on `8883`', 'DTLS on `5684`', 'TLS on `443`'],
            ['Good fit', 'Telemetry to cloud through NAT', 'Sleepy devices on 6LoWPAN', 'Gateways and web APIs'],
          ],
        },
        {
          type: 'command-lab',
          title: 'Publish one MQTT message and read the exchange',
          command: 'mosquitto_pub -h localhost -t home/lab/temp -m "27.4" -q 1 -d',
          output: `Client null sending CONNECT
Client null received CONNACK (0)
Client null sending PUBLISH (d0, q1, r0, m1, 'home/lab/temp', ... (4 bytes))
Client null received PUBACK (Mid: 1, RC:0)
Client null sending DISCONNECT`,
          explanation: [
            '`sending CONNECT`: after the TCP handshake to port `1883`, the client asks to start a session. `-d` turns on this debug output.',
            '`CONNACK (0)`: return code `0` means the broker accepted the connection.',
            '`PUBLISH (d0, q1, r0, m1, ...)`: not a duplicate, QoS `1`, not retained, packet ID `1`, then the topic and the `4` byte payload `27.4`.',
            '`PUBACK (Mid: 1, RC:0)`: the broker confirms packet ID `1` with reason code `0`, completing QoS 1 delivery.',
            '`sending DISCONNECT`: a clean close, so any Last Will message is discarded rather than published.',
          ],
        },
        {
          type: 'wireshark',
          filter: 'mqtt',
          whatToLook: [
            'Capture on the loopback adapter if the broker runs on your own laptop.',
            'Follow the order: TCP handshake to port 1883, then CONNECT, CONNACK and PUBLISH.',
            'Open a Publish Message and read the QoS, Retain and DUP flags, the topic and the message. Without TLS the payload is readable, which is why production systems use port 8883.',
            'For QoS 1, match the Message Identifier in PUBLISH and PUBACK.',
          ],
        },
        {
          type: 'mini-lab',
          title: 'Run your own MQTT broker',
          goal: 'See topics, wildcards and retained messages on one laptop.',
          steps: [
            'Install Eclipse Mosquitto and start the broker with `mosquitto -v`.',
            'In a second terminal run `mosquitto_sub -h localhost -t "home/+/temp" -q 1 -v`.',
            'In a third terminal run `mosquitto_pub -h localhost -t home/lab/temp -m 27.4 -q 1`.',
            'Publish to `home/lab/room1/temp` and note that the subscriber prints nothing, because `+` matches only one level.',
            'Publish with `-r` to retain the value, then start a new subscriber and watch it receive the value immediately.',
          ],
          expected: 'The subscriber prints `home/lab/temp 27.4`, ignores the deeper topic, and a late subscriber receives the retained value at once.',
        },
        {
          type: 'troubleshoot',
          symptom: 'A fleet of sensors reconnects to the MQTT broker every few minutes and the dashboard shows gaps in the data.',
          checks: [
            'Read the broker log. A line such as `Client sensor01 already connected, closing old connection` means two devices share one client ID.',
            'Compare the keep-alive interval with the NAT idle timeout on the path. A NAT that forgets an idle mapping first will silently kill the connection.',
            'Capture with `tcp.port == 1883` and check whether sessions end with `DISCONNECT`, a TCP reset, or plain silence.',
            'If TLS is used, test with `openssl s_client -connect broker.example.com:8883` to rule out an expired certificate.',
          ],
          fix: 'Give every device a unique client ID, set keep-alive below the NAT timeout (for example `60 s`), use persistent sessions with QoS 1, and add a random reconnect delay so the fleet does not reconnect all at once.',
        },
        {
          type: 'case-study',
          title: 'Cold-storage monitoring with Zigbee and MQTT',
          scenario: 'A warehouse must log the temperature of 120 cold rooms every minute and alert staff quickly if a room warms up. Cabling each room is too costly and battery sensors should last for years.',
          steps: [
            '**Radio:** Zigbee battery sensors, with mains-powered routers in corridors to carry multi-hop paths around metal walls. Wi-Fi would drain the batteries too fast.',
            '**Gateway:** a Zigbee coordinator translates readings to MQTT and publishes to topics such as `plant1/room07/temp` with QoS 1 over TLS on `8883`.',
            '**Broker:** per-device credentials and topic ACLs mean a gateway can publish only under its own prefix.',
            '**Consumers:** the alert service subscribes to `plant1/+/temp` and the logger to `plant1/#`. Retained messages give a new dashboard the latest values at once.',
            '**Failure detection:** a Last Will on `plant1/gateway/status` announces `offline` if the gateway disappears.',
            '**Outcome:** adding an audit logger later needs no firmware change, because publishers do not know their subscribers.',
          ],
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'Cloud IoT platforms such as AWS IoT Core expose MQTT over TLS as their main device interface. Smart-home hubs commonly bridge Zigbee or Thread devices to Wi-Fi and Ethernet, with an MQTT or vendor cloud connection beyond the hub.',
        },
        {
          type: 'callout',
          variant: 'remember',
          text: 'Choose by constraint. Phone accessory: **BLE**. Battery mesh in a building: **Zigbee** or **Thread**. Kilometres on a battery: **LoRaWAN** or **NB-IoT**. Telemetry to the cloud: **MQTT**. Sleepy device with a REST model over UDP: **CoAP**.',
        },
      ],
    },
    {
      id: 'mobile-ip',
      title: 'Mobile IP: keeping an address while moving',
      blocks: [
        {
          type: 'paragraph',
          text: 'An IP address also encodes location, because routers deliver packets to the network in its prefix. A device that moves to a new network normally gets a new address, which breaks its TCP connections. Mobile IP keeps one permanent address for the outside world and adds a tunnel to wherever the device is now.',
        },
        {
          type: 'points',
          items: [
            '**Mobile node (MN):** the moving device, with a permanent **home address**.',
            '**Home agent (HA):** a router on the home network that keeps the current binding and tunnels packets.',
            '**Foreign agent (FA):** a router on the visited network that registers visitors and ends the tunnel.',
            '**Care-of address (CoA):** the address that marks where the MN is reachable now.',
            '**Correspondent node (CN):** any host talking to the mobile node.',
            '**Agent discovery:** agents announce themselves with ICMP Agent Advertisements, and the MN can solicit one.',
            '**Registration:** the MN sends a Registration Request through the FA to the HA on UDP `434`. The HA records the binding with a lifetime and sends a Reply.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch09-mobile-ip-forwarding',
          title: 'Mobile IP packet forwarding',
          caption: 'The correspondent only knows the home address. The home agent intercepts, tunnels to the care-of address, and the foreign agent delivers. The reply skips the home agent, which is triangular routing.',
          kind: 'working-flowchart',
          mermaid: `flowchart TD
    A1["Correspondent node sends packet"] --> A2["Destination is home address"]
    A2 --> A3["IP routing delivers to home network"]
    A3 --> A4{"Mobile node registered away?"}
    A4 -->|No| A5["Deliver on the home link as usual"]
    A4 -->|Yes| A6["Home agent intercepts via proxy ARP"]
    A6 --> A7["Look up care-of address in binding"]
    A7 --> A8["Encapsulate with IP-in-IP protocol 4"]
    A8 --> A9["Outer destination is care-of address"]
    A9 --> A10["Foreign agent removes outer header"]
    A10 --> A11["Foreign agent delivers to mobile node"]
    A11 --> A12["Reply goes directly to correspondent"]`,
        },
        {
          type: 'example',
          title: 'Headers on a tunnelled packet',
          steps: [
            'Addresses: home address `192.0.2.50`, home agent `192.0.2.1`, care-of address `198.51.100.1`, correspondent `203.0.113.10`.',
            'Correspondent sends: source `203.0.113.10`, destination `192.0.2.50`.',
            'Home agent adds an outer header: source `192.0.2.1`, destination `198.51.100.1`, protocol `4`. The inner packet is unchanged.',
            'Foreign agent removes the outer header and delivers the inner packet on the local link.',
            'Reply: source `192.0.2.50`, destination `203.0.113.10`, sent directly with no tunnel.',
          ],
        },
        {
          type: 'points',
          items: [
            '**Triangular routing:** CN to HA to MN one way and MN to CN the other. It works but adds delay when the MN and CN are close together.',
            '**Route optimisation:** the CN learns the care-of address and tunnels directly to it, which requires CN support.',
            '**Reverse tunnelling (RFC 3024):** ingress filters may drop packets whose source is a home address on a foreign network, so outgoing traffic is tunnelled back through the HA.',
            '**Co-located care-of address:** the MN gets a local address, for example by DHCP, and ends the tunnel itself with no FA.',
            '**Mobile IPv6 (RFC 6275):** there is no foreign agent. The MN uses a local address as its CoA and sends Binding Updates, with route optimisation built in.',
          ],
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: 'Mobile IP is asymmetric by default. CN to MN is tunnelled through the HA, while MN to CN goes directly. Saying both directions are tunnelled is correct only when reverse tunnelling is enabled.',
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'Mobile IPv4 saw little public Internet use, but its ideas survive. A P-GW or UPF is an anchor much like a home agent, and GTP-U acts like its tunnel. Proxy Mobile IPv6 (RFC 5213) is an option on the LTE S5 interface, and QUIC connection IDs let a session survive an address change at the transport layer.',
        },
      ],
    },
  ],
  flashcards: [
    { front: 'Why does 802.11 use CSMA/CA and not CSMA/CD?', back: 'A half-duplex radio cannot reliably detect a collision while sending, and the collision matters at the receiver. So stations avoid collisions with backoff and confirm delivery with ACKs.' },
    { front: 'How is DIFS calculated?', back: 'DIFS = SIFS + 2 x slot time. On 802.11a that is 16 + 2 x 9 = 34 microseconds.' },
    { front: 'Why is SIFS the shortest interframe space?', back: 'It gives ACK, CTS and the DATA after CTS priority, so a new sender cannot interrupt an exchange in progress.' },
    { front: 'What happens to the backoff counter when the medium turns busy?', back: 'It freezes at its current value and resumes after the medium has been idle for DIFS.' },
    { front: 'What is the hidden terminal problem?', back: 'Two senders reach a common receiver but cannot hear each other, so carrier sense reports idle and their frames collide at the receiver.' },
    { front: 'What is the exposed terminal problem?', back: 'A station defers because it hears a nearby sender, although its own transmission to a different receiver would have been safe.' },
    { front: 'What is the NAV?', back: 'The Network Allocation Vector, a virtual carrier-sense timer loaded from the Duration field of overheard frames. The medium is treated as busy until it expires.' },
    { front: 'Name the three 802.11 frame families.', back: 'Management (Beacon, Probe, Authentication, Association), Control (RTS, CTS, ACK) and Data.' },
    { front: 'In what order does a station join a Wi-Fi network?', back: 'Scan, authenticate, associate, 4-way handshake, then DHCP.' },
    { front: 'Which 2.4 GHz channels do not overlap?', back: 'Channels 1, 6 and 11.' },
    { front: 'What replaces the MME and the S-GW plus P-GW in 5G?', back: 'The AMF handles registration and mobility, the SMF handles sessions, and the UPF carries user traffic.' },
    { front: 'Which node moves the downlink path in an LTE X2 handover?', back: 'The S-GW, after the MME sends it a Modify Bearer Request following the Path Switch Request from the target eNodeB.' },
    { front: 'What are the MQTT QoS levels?', back: 'QoS 0 is at most once, QoS 1 is at least once with PUBACK, and QoS 2 is exactly once with PUBREC, PUBREL and PUBCOMP.' },
    { front: 'What is triangular routing in Mobile IP?', back: 'Packets to the mobile node go through the home agent and its tunnel, while replies go directly from the mobile node to the correspondent.' },
  ],
  quiz: [
    {
      id: 'ch09-q1',
      question: 'Why does 802.11 avoid collisions rather than detect them as classic Ethernet does?',
      options: [
        'Radio frames can never collide',
        '802.11 frames have no checksum, so collisions cannot be noticed',
        'A half-duplex radio cannot listen well while sending, and the collision occurs at the receiver',
        'CSMA/CD works only on optical fibre',
      ],
      answerIndex: 2,
      explanation: 'The transmitted signal swamps the receiver of the same radio, and carrier state at the sender does not show what happens at the receiver.',
      difficulty: 'easy',
      topic: 'Wireless basics',
    },
    {
      id: 'ch09-q2',
      question: 'Which set of 2.4 GHz Wi-Fi channels does not overlap?',
      options: ['1, 2 and 3', '1, 6 and 11', '3, 5 and 7', '6, 7 and 8'],
      answerIndex: 1,
      explanation: 'Channels are 5 MHz apart but about 20 MHz wide, so they must be 5 channel numbers apart.',
      difficulty: 'easy',
      topic: 'Wi-Fi standards',
    },
    {
      id: 'ch09-q3',
      question: 'What is the main purpose of RTS and CTS?',
      options: [
        'Reduce collisions from hidden terminals by reserving the medium',
        'Encrypt the frame payload',
        'Select the highest modulation rate',
        'Let a station discover nearby access points',
      ],
      answerIndex: 0,
      explanation: 'A hidden station cannot hear the RTS but hears the CTS from the receiver and sets its NAV.',
      difficulty: 'easy',
      topic: '802.11 MAC',
    },
    {
      id: 'ch09-q4',
      question: 'Which 5G core function handles device registration and mobility?',
      options: ['UPF', 'SMF', 'UDM', 'AMF'],
      answerIndex: 3,
      explanation: 'The AMF handles access and mobility. The SMF manages sessions, the UPF forwards user data, and the UDM holds subscriber data.',
      difficulty: 'easy',
      topic: 'Cellular',
    },
    {
      id: 'ch09-q5',
      question: 'What is the default transport and port for unencrypted MQTT?',
      options: ['UDP 5683', 'TCP 1883', 'TCP 8883', 'UDP 1812'],
      answerIndex: 1,
      explanation: 'MQTT uses TCP 1883 in clear and 8883 with TLS. UDP 5683 is CoAP and UDP 1812 is RADIUS.',
      difficulty: 'easy',
      topic: 'Bluetooth and IoT',
    },
    {
      id: 'ch09-q6',
      question: 'How many active peripherals can one central device have in a Bluetooth Classic piconet?',
      options: ['1', '3', '7', '255'],
      answerIndex: 2,
      explanation: 'A piconet has one central device and up to 7 active peripherals.',
      difficulty: 'easy',
      topic: 'Bluetooth and IoT',
    },
    {
      id: 'ch09-q7',
      question: 'Which amendment introduced OFDMA so an AP can serve several clients in one transmission?',
      options: ['802.11g', '802.11n', '802.11ac', '802.11ax'],
      answerIndex: 3,
      explanation: '802.11ax (Wi-Fi 6) added OFDMA. 802.11ac added downlink MU-MIMO, and 802.11n added MIMO.',
      difficulty: 'medium',
      topic: 'Wi-Fi standards',
    },
    {
      id: 'ch09-q8',
      question: 'A station is counting down its backoff with k = 5 when the medium turns busy. What does it do?',
      options: [
        'Freezes k and resumes after the medium is idle for DIFS',
        'Draws a new random k from the same window',
        'Doubles CW at once and draws again',
        'Transmits immediately because it has already waited',
      ],
      answerIndex: 0,
      explanation: 'The counter holds its value, so stations that have waited longer keep their advantage. CW doubles only after a failed transmission.',
      difficulty: 'medium',
      topic: '802.11 MAC',
    },
    {
      id: 'ch09-q9',
      question: 'If the distance from an AP doubles in free space, how much does path loss increase?',
      options: ['3 dB', '6 dB', '10 dB', '20 dB'],
      answerIndex: 1,
      explanation: 'FSPL has the term 20 log10(d), and 20 log10(2) is about 6 dB.',
      difficulty: 'medium',
      topic: 'Wireless basics',
    },
    {
      id: 'ch09-q10',
      question: 'In an LTE X2 handover, which node actually moves the downlink GTP-U path to the target cell?',
      options: [
        'The HSS, after updating the subscriber record',
        'The P-GW, by assigning a new IP address to the UE',
        'The S-GW, after the MME sends Modify Bearer Request',
        'The source eNodeB, which keeps forwarding permanently',
      ],
      answerIndex: 2,
      explanation: 'The target sends Path Switch Request to the MME, and the MME asks the S-GW to switch. The UE keeps its IP address.',
      difficulty: 'medium',
      topic: 'Cellular',
    },
    {
      id: 'ch09-q11',
      question: 'Which topic matches the MQTT subscription filter home/+/temp?',
      options: ['home/lab/temp', 'home/lab/room1/temp', 'home/temp', 'office/lab/temp'],
      answerIndex: 0,
      explanation: 'The + wildcard matches exactly one level, so it cannot match zero levels or two levels.',
      difficulty: 'medium',
      topic: 'Bluetooth and IoT',
    },
    {
      id: 'ch09-q12',
      question: 'When a home agent tunnels a packet to a mobile node, what is the outer destination address?',
      options: [
        'The home address of the mobile node',
        'The address of the correspondent node',
        'The address of the home agent',
        'The care-of address',
      ],
      answerIndex: 3,
      explanation: 'The outer header routes to the care-of address, while the inner header keeps the home address as its destination.',
      difficulty: 'medium',
      topic: 'Mobile IP',
    },
    {
      id: 'ch09-q13',
      question: 'On 802.11a, SIFS = 16 µs, CTS = 28 µs, DATA = 248 µs and ACK = 28 µs. What Duration value does the RTS carry?',
      options: ['304 µs', '336 µs', '352 µs', '368 µs'],
      answerIndex: 2,
      explanation: 'RTS Duration covers everything after the RTS: 3 SIFS + CTS + DATA + ACK = 48 + 304 = 352 µs.',
      difficulty: 'hard',
      topic: '802.11 MAC',
    },
    {
      id: 'ch09-q14',
      question: 'A cellular plan changes its cluster size from N = 7 to N = 12 with the same spectrum and cell radius R. What happens?',
      options: [
        'Reuse distance falls to 3 R and channels per cell rise',
        'Reuse distance rises to 6 R and channels per cell fall by about 42 percent',
        'Reuse distance stays the same and only the handover rate changes',
        'Reuse distance rises to 4.58 R and channels per cell double',
      ],
      answerIndex: 1,
      explanation: 'D = R sqrt(3N) = R sqrt(36) = 6 R. Channels per cell go from S/7 to S/12, a fall of 5/12, about 42 percent.',
      difficulty: 'hard',
      topic: 'Cellular',
    },
    {
      id: 'ch09-q15',
      question: 'Packets from a mobile node on a foreign network are dropped because their source is its home address and the network applies ingress filtering. Which Mobile IP feature fixes this?',
      options: [
        'Registering a second home agent in the visited network',
        'Asking the correspondent to use triangular routing',
        'Lowering the registration lifetime',
        'Reverse tunnelling through the home agent',
      ],
      answerIndex: 3,
      explanation: 'With reverse tunnelling (RFC 3024), outgoing packets travel inside a tunnel to the home agent, so the visible source is topologically correct.',
      difficulty: 'hard',
      topic: 'Mobile IP',
    },
  ],
  importantQuestions: [
    {
      q: 'What is the hidden terminal problem?',
      modelAnswer: 'Two stations are each in range of a common receiver but out of range of each other. Carrier sensing cannot detect the other sender, so their frames collide at the receiver.',
      marks: 2,
    },
    {
      q: 'Why is SIFS shorter than DIFS?',
      modelAnswer: 'SIFS comes before ACK, CTS and the DATA after CTS, which belong to an exchange in progress. A station with a new frame must wait the longer DIFS, so the ongoing exchange always gets the medium first.',
      marks: 2,
    },
    {
      q: 'Explain the CSMA/CA procedure used by 802.11 DCF.',
      modelAnswer: '1. A station senses the medium. If idle for DIFS, it transmits.\n2. If busy, it waits until the medium is idle for DIFS and draws k from 0 to CW.\n3. It decrements k for each idle slot and freezes k while the medium is busy.\n4. At k = 0 it transmits the whole frame.\n5. The receiver checks the FCS and returns an ACK after SIFS.\n6. With no ACK, CW becomes 2CW + 1 up to CWmax and the station retries until the retry limit. After a success, CW returns to CWmin.',
      marks: 5,
    },
    {
      q: 'List the steps by which a station joins a WPA2-Personal Wi-Fi network.',
      modelAnswer: '1. Scanning: passive through Beacons or active through Probe Request and Response.\n2. Open System authentication: two frames that do not prove identity.\n3. Association Request and Response: rates and RSN are agreed, and the AP assigns an AID.\n4. 4-way handshake on EAPOL: ANonce and SNonce exchanged, PTK derived from the PMK, GTK delivered, MICs verified.\n5. Data frames are now encrypted, and the station gets an IP address by DHCP.',
      marks: 5,
    },
    {
      q: 'Compare MQTT and CoAP for IoT communication.',
      modelAnswer: 'MQTT: runs over TCP on port 1883, or 8883 with TLS. It uses publish and subscribe through a broker, has a 2-byte minimum fixed header, and offers QoS 0, 1 and 2. It suits telemetry to a cloud through NAT.\nCoAP: runs over UDP on port 5683, or 5684 with DTLS. It uses a REST request and response model with a 4-byte fixed header, CON and NON messages, and Observe for push. It suits sleepy devices on constrained networks such as 6LoWPAN.\nMQTT needs a broker and a persistent connection, while CoAP needs neither.',
      marks: 5,
    },
    {
      q: 'Explain how Mobile IP delivers packets to a mobile node on a foreign network.',
      modelAnswer: '1. Discovery: the mobile node hears an Agent Advertisement and learns a care-of address.\n2. Registration: it sends a Registration Request through the foreign agent to the home agent on UDP 434, and the home agent stores the binding.\n3. Interception: a packet to the home address reaches the home network, and the home agent intercepts it using proxy ARP.\n4. Tunnelling: the home agent encapsulates it with IP-in-IP, with the care-of address as outer destination.\n5. Delivery: the foreign agent removes the outer header and delivers it.\n6. Reply: the mobile node replies directly, which forms triangular routing.',
      marks: 5,
    },
    {
      q: 'Explain the hidden and exposed terminal problems. Describe how RTS, CTS and NAV work, with a timing calculation.',
      modelAnswer: 'Hidden terminal: A and C both reach AP B but cannot hear each other. Each senses idle and sends, and the frames collide at B.\nExposed terminal: a station hears a nearby sender and defers even though its own transmission to another receiver would be safe. This wastes capacity.\nRTS and CTS: after DIFS and backoff, the sender transmits a 20-byte RTS with a Duration value. After SIFS, the receiver returns a 14-byte CTS. DATA follows after SIFS, and an ACK after another SIFS.\nNAV: every station that overhears a Duration field sets its NAV and stays silent. A hidden station hears the CTS, so it defers.\nTiming on 802.11a with SIFS 16, CTS 28, DATA 248 and ACK 28 microseconds:\nRTS Duration = 3 x 16 + 28 + 248 + 28 = 352 microseconds.\nCTS Duration = 352 - 16 - 28 = 308 microseconds.\nData Duration = 16 + 28 = 44 microseconds.\nLimits: the handshake costs airtime and does not solve exposed terminals, so it is used only above an RTS threshold.',
      marks: 10,
    },
    {
      q: 'Describe the 4G and 5G core architectures and explain an LTE X2 handover.',
      modelAnswer: '4G EPC: the eNodeB connects over S1-MME to the MME, which handles signalling and mobility and uses the HSS for subscriber data. User data flows over S1-U to the S-GW, then over S5 to the P-GW, which assigns the IP address and connects over SGi to the Internet.\n5G core: the gNB connects over N2 to the AMF and over N3 to the UPF. The SMF manages sessions and controls the UPF over N4. AUSF, UDM and PCF provide authentication, subscriber data and policy through service-based HTTP/2 APIs. Slicing and edge UPFs are enabled.\nX2 handover:\n1. The UE sends a Measurement Report, such as event A3.\n2. The source sends X2 Handover Request, and the target admits and sends Ack.\n3. The source sends RRC Connection Reconfiguration to the UE, plus SN Status Transfer and buffered data to the target.\n4. The UE performs random access on the target and sends Reconfiguration Complete.\n5. The target sends Path Switch Request to the MME, and the MME sends Modify Bearer Request to the S-GW, which moves the downlink tunnel.\n6. The target sends UE Context Release to the source.\nThe IP address stays the same because the gateway remains the anchor.',
      marks: 10,
    },
  ],
  numericals: [
    {
      question: 'An AP transmits at 20 dBm on 2.4 GHz with 2 dBi antennas at both ends. Find the free-space path loss and received power at 100 m. How much extra loss would 5 GHz have at the same distance?',
      steps: [
        'FSPL = 20 log10(d) + 20 log10(f) + 32.44, with d in km and f in MHz.',
        'd = 0.1 km, so 20 log10(0.1) = -20 dB.',
        'f = 2400 MHz, so 20 log10(2400) = 67.60 dB.',
        'FSPL = -20 + 67.60 + 32.44 = 80.04 dB.',
        'Pr = 20 + 2 + 2 - 80.04 = -56.04 dBm.',
        'At 5000 MHz, 20 log10(5000) = 73.98 dB, so FSPL = 86.42 dB, which is 6.38 dB more.',
      ],
      answer: 'FSPL is about 80.0 dB, received power is about -56.0 dBm, and 5 GHz adds about 6.4 dB',
    },
    {
      question: 'An 802.11a station (slot 9 µs, DIFS 34 µs, CWmin 15) waits for a busy medium and then draws k = 6. After it counts down 4 slots, another station occupies the medium for 300 µs. Find the time from when the medium first went idle to the start of its transmission. Also find the mean backoff at CW = 15, 31 and 63.',
      steps: [
        'First wait: DIFS = 34 µs.',
        'Count 4 slots: 4 x 9 = 36 µs, so k = 2 remains and freezes.',
        'Medium busy: 300 µs.',
        'After the medium clears: DIFS = 34 µs, then 2 slots = 18 µs.',
        'Total = 34 + 36 + 300 + 34 + 18 = 422 µs.',
        'The mean of k drawn from 0 to CW is CW / 2 slots.',
        'CW = 15: 7.5 x 9 = 67.5 µs. CW = 31: 15.5 x 9 = 139.5 µs. CW = 63: 31.5 x 9 = 283.5 µs.',
      ],
      answer: '422 µs, with mean backoffs of 67.5 µs, 139.5 µs and 283.5 µs',
    },
    {
      question: 'On 802.11a, SIFS = 16 µs, CTS = 28 µs, DATA = 248 µs and ACK = 28 µs. Find the Duration values carried in the RTS, the CTS and the DATA frame.',
      steps: [
        'RTS Duration covers 3 SIFS + CTS + DATA + ACK.',
        'RTS Duration = 48 + 28 + 248 + 28 = 352 µs.',
        'CTS Duration = RTS Duration - SIFS - CTS = 352 - 16 - 28 = 308 µs.',
        'Check: 2 SIFS + DATA + ACK = 32 + 248 + 28 = 308 µs.',
        'DATA Duration = SIFS + ACK = 16 + 28 = 44 µs.',
      ],
      answer: 'RTS 352 µs, CTS 308 µs, DATA 44 µs',
    },
    {
      question: 'One 802.11a station sends 1500-byte IP packets at 54 Mbps with no collisions and no RTS or CTS. Use DIFS 34 µs, SIFS 16 µs, slot 9 µs, mean backoff of 7.5 slots, PHY preamble and header of 20 µs per frame, ACK of 14 bytes at 24 Mbps, and MAC overhead of 8 bytes LLC/SNAP + 24 bytes header + 4 bytes FCS. Ignore OFDM symbol rounding. Find the throughput at the IP layer.',
      steps: [
        'MAC frame = 1500 + 8 + 24 + 4 = 1536 bytes = 12288 bits.',
        'DATA time = 20 + 12288 / 54 = 20 + 227.56 = 247.56 µs.',
        'ACK time = 20 + 112 / 24 = 20 + 4.67 = 24.67 µs.',
        'Mean backoff = 7.5 x 9 = 67.5 µs.',
        'Cycle = 34 + 67.5 + 247.56 + 16 + 24.67 = 389.73 µs.',
        'Throughput = 12000 bits / 389.73 µs = 30.79 Mbps.',
        'Efficiency = 30.79 / 54 = 57 percent of the PHY rate.',
      ],
      answer: 'About 30.8 Mbps, which is about 57 percent of 54 Mbps',
    },
    {
      question: 'An operator has 28 MHz in each direction, 200 kHz carriers and 8 time slots per carrier. It uses a cluster size N = 7 across 50 cells. Find the voice channels per cell, the total simultaneous calls, the gain over no reuse, and the reuse distance for R = 1 km.',
      steps: [
        'Carriers = 28000 kHz / 200 kHz = 140.',
        'N = 7 corresponds to i = 2 and j = 1, because 4 + 2 + 1 = 7.',
        'Carriers per cell = 140 / 7 = 20.',
        'Channels per cell = 20 x 8 = 160.',
        'Total calls = 50 x 160 = 8000.',
        'Without reuse, total calls = 140 x 8 = 1120, so the gain = 8000 / 1120 = 7.14 times.',
        'D = R sqrt(3N) = 1 x sqrt(21) = 4.58 km.',
      ],
      answer: '160 channels per cell, 8000 simultaneous calls, a gain of about 7.14 times, and D of about 4.58 km',
    },
  ],
  keyTerms: [
    'BSS: Basic Service Set, one AP and the stations associated with it',
    'ESS: Several BSSs on one SSID joined by a distribution system, allowing roaming',
    'BSSID: MAC address that identifies one BSS, usually the radio MAC of the AP',
    'CSMA/CA: 802.11 channel access that senses the medium and backs off to avoid collisions',
    'DCF: Distributed Coordination Function, the contention-based 802.11 access method',
    'NAV: Virtual carrier-sense timer set from the Duration field of overheard frames',
    'Hidden terminal: Two senders out of range of each other that collide at a common receiver',
    'Exposed terminal: A sender that defers needlessly because it hears an unrelated transmission',
    'RSSI: Received signal strength indication, commonly reported in dBm',
    'SNR: Ratio of signal power to noise power, usually stated in dB',
    'OFDMA: Assigns groups of sub-carriers to different users within one transmission',
    'eNodeB: LTE base station that terminates the radio link and the S1 and X2 interfaces',
    'gNB: 5G NR base station connected to the AMF over N2 and the UPF over N3',
    'AMF: 5G core function for registration, access control and mobility',
    'UPF: 5G user-plane anchor that forwards packets between gNB and data network',
    'GTP-U: UDP tunnel on port 2152 that carries user packets across the mobile core',
    'Piconet: Bluetooth Classic group of one central device and up to 7 active peripherals',
    'Broker: MQTT server that receives publications and delivers them to subscribers',
    'Care-of address: IP address that marks where a mobile node is currently reachable',
    'Home agent: Router on the home network that tunnels packets to the mobile node',
  ],
  formulas: [
    { name: 'Free-space path loss', expression: 'FSPL(dB) = 20 log10(d) + 20 log10(f) + 32.44', note: 'd in km and f in MHz' },
    { name: 'Link budget', expression: 'Pr(dBm) = Pt(dBm) + Gt(dBi) + Gr(dBi) - Loss(dB)' },
    { name: 'Log-distance path loss', expression: 'PL(d) = PL(d0) + 10 n log10(d/d0)', note: 'n is about 2 in free space and 3 to 4 indoors' },
    { name: 'Signal to noise ratio', expression: 'SNR(dB) = Pr(dBm) - Noise(dBm)' },
    { name: 'Shannon capacity', expression: 'C = B log2(1 + S/N)', note: 'S/N is a plain ratio, not dB' },
    { name: 'DIFS', expression: 'DIFS = SIFS + 2 x slot' },
    { name: 'Backoff time', expression: 'T = k x slot, with k uniform from 0 to CW', note: 'Mean is CW/2 slots' },
    { name: 'Contention window growth', expression: 'CW next = 2 x CW + 1, capped at CWmax' },
    { name: 'RTS Duration', expression: 'Duration = 3 SIFS + CTS + DATA + ACK' },
    { name: 'Wi-Fi channel frequency', expression: 'f = 2407 + 5 x ch (2.4 GHz), f = 5000 + 5 x ch (5 GHz)', note: 'f in MHz' },
    { name: 'Cluster size', expression: 'N = i^2 + ij + j^2' },
    { name: 'Reuse distance', expression: 'D = R sqrt(3N)' },
    { name: 'Channels per cell', expression: 'k = S / N', note: 'S is the total number of channels' },
  ],
  handsOnChecklist: [
    'Run netsh wlan show interfaces or iw dev wlan0 link, and record the SSID, BSSID, channel, band, signal and rate.',
    'List nearby networks, draw a channel map for 2.4 GHz and 5 GHz, and choose the best channel for a new AP.',
    'Walk between two APs of one SSID while running a continuous ping to the gateway, and note lost replies and the BSSID change.',
    'Install Mosquitto, run a local broker, and test the + and # wildcards, retained messages and QoS 1.',
    'In Cisco Packet Tracer, build a WLAN with a wireless router, WPA2-PSK, DHCP and two laptops, then test it with ping.',
    'Tether your laptop to a phone hotspot, run tracert to 8.8.8.8, and compare the delay at each hop with your home Wi-Fi.',
  ],
};

export default chapter;

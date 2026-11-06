import type { Chapter } from '@/lib/types';

const chapter: Chapter = {
  slug: 'physical',
  number: 2,
  title: 'Physical layer',
  shortTitle: 'Physical layer',
  summary:
    'The physical layer turns bits into voltage, light or radio signals and carries them across a medium. This chapter covers analog and digital signals, transmission impairments, Nyquist and Shannon capacity, NRZ and Manchester encoding, copper, fiber and wireless media, FDM, TDM and statistical multiplexing, circuit, packet and virtual circuit switching, and the structured cabling used in real buildings.',
  estMinutes: 75,
  learningObjectives: [
    'Distinguish analog and digital signals, and relate bandwidth, bit rate and baud rate.',
    'Identify attenuation, distortion and noise, and calculate signal levels using decibels.',
    'Apply the Nyquist and Shannon formulas to find the capacity of a channel.',
    'Encode a bit stream in NRZ-L, NRZ-I and Manchester, and explain why clock recovery matters.',
    'Choose suitable guided or unguided media and plan a structured cabling layout with correct connectors.',
    'Compare FDM, TDM and statistical multiplexing, and circuit, packet and virtual circuit switching.',
  ],
  overviewVideoId: 'ch02-overview',
  sections: [
    {
      id: 'signals-and-impairments',
      title: 'Signals and transmission impairments',
      videoId: 'ch02-signal-encoding-attenuation',
      blocks: [
        {
          type: 'paragraph',
          text: 'The physical layer moves raw bits between two directly connected devices as a physical signal: voltage on copper, light in fiber or radio waves in air. It defines what a 1 and a 0 look like, how fast they are sent and which cables and connectors carry them. Signals weaken and pick up noise on the way, so this layer is also where distance limits come from.',
        },
        {
          type: 'points',
          items: [
            '**Medium**: the physical path, such as copper pairs, fiber strands or radio spectrum.',
            '**Signal**: the voltage levels, light pulses or radio waveforms that represent bits.',
            '**Timing**: the bit rate, and how sender and receiver stay in step.',
            '**Hardware interface**: connectors, pinouts and transceivers such as `RJ45` and `SFP`.',
            '**Not in scope**: framing, addressing and error checking belong to the data link layer and above. The physical layer delivers bits, right or wrong.',
          ],
        },
        {
          type: 'paragraph',
          text: 'An analog signal varies continuously and can take any value in a range. A digital signal uses a small set of discrete levels with sharp edges. Data and signal are separate ideas, so either kind of data can ride on either kind of signal.',
        },
        {
          type: 'table',
          headers: ['Property', 'Analog signal', 'Digital signal'],
          rows: [
            ['Values', 'Continuous, any level in a range', 'Discrete, a small set of levels'],
            ['Shape', 'Smooth wave', 'Sharp edges, square-like pulses'],
            ['Effect of noise', 'Noise stays in the signal and cannot be separated', 'Receiver decides the level, so small noise is removed'],
            ['Long distance', 'Amplifier, which also boosts noise', 'Repeater, which regenerates clean pulses'],
            ['Examples', 'Telephone voice pair, FM radio, Wi-Fi carrier', '`1000BASE-T` symbols on UTP, light pulses on fiber'],
          ],
        },
        {
          type: 'points',
          items: [
            '**Digital data on a digital signal**: Ethernet on UTP, using line coding.',
            '**Digital data on an analog signal**: Wi-Fi, DSL and cable modems, using modulation such as `QPSK` and `QAM`.',
            '**Analog data on a digital signal**: telephone voice sampled by PCM. `8000` samples per second x `8` bits gives `64 kb/s`.',
            '**Analog data on an analog signal**: FM radio.',
          ],
        },
        {
          type: 'paragraph',
          text: 'A sine wave is described by amplitude, frequency and phase. Fourier analysis shows that any signal, including a square digital pulse, is a sum of sine waves. The channel must pass enough of those frequencies or the pulse loses its shape.',
        },
        {
          type: 'points',
          items: [
            '**Amplitude**: peak strength, in volts or watts.',
            '**Frequency**: cycles per second in hertz. Period `T = 1 / f`.',
            '**Phase**: position of the wave relative to time zero, in degrees.',
            '**Time and frequency domain**: an oscilloscope shows level against time. A spectrum analyzer shows power against frequency.',
            '**Harmonics**: a square wave contains a fundamental plus odd harmonics. A narrow channel removes the high ones and rounds the edges.',
            '**Bandwidth**: in signal theory, a range of frequencies in Hz. Networking staff also say a link has 1 Gb/s of bandwidth, meaning data rate. Capacity formulas always use hertz.',
            '**Bit rate and baud rate**: bit rate counts data bits per second. Baud rate counts signal elements per second. One signal element can carry several bits.',
          ],
        },
        {
          type: 'callout',
          variant: 'formula',
          text: '`B = fmax - fmin` in hertz. `R = S x log2(L)`, where `R` is bit rate, `S` is baud rate and `L` is the number of signal levels. Four levels at `1000` baud carry `2000 b/s`.',
        },
        {
          type: 'paragraph',
          text: 'Every real medium changes the signal between transmitter and receiver. These changes are called impairments, and they set the length limit of every cable standard. The three families are attenuation, distortion and noise.',
        },
        {
          type: 'table',
          headers: ['Impairment', 'Cause', 'Effect', 'Industry countermeasure'],
          rows: [
            ['**Attenuation**', 'Heat loss in copper, absorption and scattering in fiber, spreading in air', 'Signal weakens with distance and with higher frequency', 'Length limits, repeaters, amplifiers, better cable grade'],
            ['**Delay distortion**', 'Frequency components travel at slightly different speeds', 'Pulses spread and overlap, called intersymbol interference', 'Equalizers in the PHY, single-mode fiber'],
            ['**Thermal noise**', 'Random electron motion in every conductor', 'Constant noise floor that cannot be removed', 'Stronger signal, low-noise receivers, coding'],
            ['**Crosstalk**', 'Coupling between adjacent pairs, `NEXT` at the near end and `FEXT` at the far end', 'Another signal leaks into yours', 'Tight twists, pair separators, shielding, DSP cancellation'],
            ['**Impulse noise**', 'Motors, lightning, power switching', 'Short bursts of bit errors', 'Separate data from power cables, FEC, retransmission'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Engineers measure gain and loss in decibels because ratios span many orders of magnitude. A decibel value is a logarithm of a ratio, so losses along a path can simply be added. Datasheets for cables, transceivers and radios all use this unit.',
        },
        {
          type: 'points',
          items: [
            '**Power ratio**: `dB = 10 log10(P2 / P1)`. A negative value is a loss and a positive value is a gain.',
            '**Voltage ratio**: `dB = 20 log10(V2 / V1)`, because power is proportional to voltage squared.',
            '**Absolute power**: `dBm` is power relative to 1 mW. `0 dBm = 1 mW` and `30 dBm = 1 W`.',
            '**Quick values**: `-3 dB` is about half the power. `-10 dB` is one tenth. `-20 dB` is one hundredth.',
          ],
        },
        {
          type: 'example',
          title: 'Reading a Cat 6 cable datasheet',
          steps: [
            'The datasheet gives about `20 dB` of loss per 100 m at 100 MHz.',
            'Power ratio = `10^(-20/10) = 0.01`, so only 1 percent of the launched power arrives.',
            'Voltage ratio = `10^(-20/20) = 0.1`, so a `2 V` signal arrives as `0.2 V`.',
            'If crosstalk sits `40 dB` below the launched level, the received SNR is `40 - 20 = 20 dB`, a power ratio of `100`.',
          ],
        },
        {
          type: 'callout',
          variant: 'remember',
          text: 'Decibels add, linear ratios multiply. A path of `-6 dB`, `+7 dB` and `-3 dB` nets `-2 dB`. Use `dB` for a ratio and `dBm` for an absolute power level, so `10 dBm - 3 dB = 7 dBm`.',
        },
        {
          type: 'points',
          items: [
            '**Amplifier**: boosts the analog waveform, including its noise. SNR never improves, and it degrades a little at every stage.',
            '**Repeater**: detects each symbol and sends a clean, retimed copy. Noise is removed unless a symbol was already decided wrongly.',
            '**Modern practice**: every switch port regenerates the signal, so a switch resets the 100 m copper limit. A hub was a multiport repeater.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch02-bit-path-working',
          title: 'Path of a bit from transmitter to receiver',
          caption: 'The physical layer has no error check of its own. A symbol decoded wrongly passes upward silently and is caught by the FCS at the data link layer.',
          kind: 'working-flowchart',
          mermaid: `flowchart TD
    A1["MAC hands frame bits to the PHY"] --> A2["Line encoder maps bits to symbols"]
    A2 --> A3["Driver launches signal on the medium"]
    A3 --> A4["Signal weakens and picks up noise"]
    A4 --> A5{"Segment limit reached?"}
    A5 -->|Yes| A6["Repeater detects each symbol"]
    A6 --> A7["Repeater retimes and resends symbol"]
    A7 --> A4
    A5 -->|No| A8["Clock recovered from transitions"]
    A8 --> A9["Receiver samples at symbol centre"]
    A9 --> A10{"Noise crossed the threshold?"}
    A10 -->|No| A11["Symbol decoded correctly"]
    A10 -->|Yes| A12["Bit decoded wrongly, no alarm here"]
    A11 --> A13["Bits pass up to data link layer"]
    A12 --> A13
    A13 --> A14{"FCS matches at data link?"}
    A14 -->|Yes| A15["Frame accepted"]
    A14 -->|No| A16["Frame discarded, CRC counter rises"]`,
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'At home, attenuation shows up as weak Wi-Fi behind two walls. In an office, it is why a switch sits on each floor within 90 m of every desk. At an ISP, `EDFA` optical amplifiers on long-haul fiber boost all wavelengths roughly every 80 km, with full electrical regeneration only after many spans because it costs far more.',
        },
        {
          type: 'mini-lab',
          title: 'See attenuation on your own Wi-Fi',
          goal: 'Watch signal strength and link rate fall as distance and walls increase.',
          steps: [
            'Connect your laptop to Wi-Fi and stand next to the access point.',
            'On Windows run `netsh wlan show interfaces` and note `Signal`, `Channel` and `Receive rate (Mbps)`. On Linux run `iw dev wlan0 link`.',
            'Run `ping -n 20 192.168.1.1` on Windows or `ping -c 20 192.168.1.1` on Linux, using your own gateway address.',
            'Repeat both steps one room away, and again two walls away.',
            'Record the three sets of values in a small table.',
          ],
          expected: 'Signal falls at each position and the link rate steps down as the radio picks a lower modulation. Average ping and its variation get worse at the far point. A 5 GHz network usually fades faster than 2.4 GHz.',
        },
      ],
    },
    {
      id: 'channel-capacity',
      title: 'Nyquist and Shannon capacity',
      blocks: [
        {
          type: 'paragraph',
          text: 'How fast can a channel carry bits? Two results answer this. The Nyquist limit gives the maximum rate set by bandwidth alone in a noiseless channel, and the Shannon limit, published in 1948, adds noise and gives the highest rate at which error-free communication is possible at all.',
        },
        {
          type: 'points',
          items: [
            '**Nyquist limit**: `C = 2B log2(L)`, with `B` in hertz and `L` signal levels. It assumes no noise.',
            '**Symbol rate cap**: a channel of `B` Hz carries at most `2B` symbols per second, so more bits per second must come from more levels per symbol.',
            '**Why levels cannot grow forever**: more levels sit closer together, and noise then makes the receiver confuse them.',
            '**Shannon limit**: `C = B log2(1 + S/N)`, with `S/N` as a linear power ratio. No code or number of levels can beat it.',
            '**Using both together**: Shannon gives the ceiling. Nyquist then tells you how many levels are needed for the rate you choose below that ceiling.',
          ],
        },
        {
          type: 'callout',
          variant: 'formula',
          text: 'Nyquist: `C = 2B log2(L)`. Shannon: `C = B log2(1 + S/N)`. Decibel conversion: `SNR_dB = 10 log10(S/N)`, so `S/N = 10^(SNR_dB / 10)`. Calculator tip: `log2(x) = log10(x) / 0.301`.',
        },
        {
          type: 'example',
          title: 'Sizing a 20 MHz Wi-Fi channel at 25 dB SNR',
          steps: [
            'Convert SNR: `S/N = 10^(25/10) = 316.2`.',
            'Shannon ceiling: `C = 20 MHz x log2(317.2) = 20 x 8.31 = 166.2 Mb/s` for one spatial stream.',
            'Nyquist symbol cap: `2B = 40 Msymbols/s`.',
            'Bits per symbol at the ceiling: `166.2 / 40 = 4.15`, so `16` levels give `2 x 20 x 4 = 160 Mb/s`, which is just below the ceiling.',
            'A real `802.11n` or `802.11ac` radio at this SNR delivers roughly 60 to 70 Mb/s per stream, because of OFDM overhead, error-correcting code and safety margin.',
          ],
        },
        {
          type: 'table',
          headers: ['Given in the problem', 'Use', 'Watch out for'],
          rows: [
            ['Noiseless channel and number of levels', 'Nyquist', 'Result is in b/s, with `log2` of the levels'],
            ['Noisy channel and SNR', 'Shannon', 'Convert dB to a linear ratio first'],
            ['SNR and a request for levels', 'Shannon, then Nyquist', 'Pick a rate at or below Shannon, then solve for `L`'],
            ['Baud rate and levels', '`R = S x log2(L)`', 'Baud is not the same as bandwidth'],
          ],
        },
        {
          type: 'table',
          headers: ['Real channel', 'Bandwidth', 'SNR', 'Shannon ceiling', 'Rate used in practice'],
          rows: [
            ['Telephone voice line', '3 kHz', '35 dB', '34.9 kb/s', '33.6 kb/s with a `V.34` modem'],
            ['Wi-Fi, one stream', '20 MHz', '25 dB', '166 Mb/s', 'About 60 to 70 Mb/s'],
            ['Wi-Fi, one stream', '80 MHz', '30 dB', '797 Mb/s', 'About 390 to 433 Mb/s'],
          ],
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: 'If a question gives SNR in dB, convert it before using Shannon. A common mistake is writing `log2(1 + 30)` for a 30 dB channel when the correct ratio is `1000`. If both limits apply, the smaller value wins.',
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'Radios and modems track Shannon in real time. Wi-Fi rate adaptation moves down the `MCS` table when SNR falls, from `256-QAM` to `64-QAM` to `QPSK`. DSL does bit loading, giving more bits to clean tones and fewer to noisy ones. MIMO adds parallel spatial streams, which multiplies capacity without widening the channel.',
        },
      ],
    },
    {
      id: 'line-encoding',
      title: 'Line encoding: NRZ and Manchester',
      blocks: [
        {
          type: 'paragraph',
          text: 'Line encoding maps bits to signal levels on the medium. A receiver has no separate clock wire, so it must recover timing from the transitions in the signal itself. A good code balances clock recovery, DC balance and the bandwidth it uses.',
        },
        {
          type: 'points',
          items: [
            '**Clock recovery**: the receiver locks onto edges. A long run with no edges lets its clock drift.',
            '**DC balance**: Ethernet copper ports couple through transformers, which block DC, so the average level must stay near zero.',
            '**Baseline wander**: long runs of one level shift the average that the receiver uses as its decision threshold.',
            '**Bandwidth use**: more transitions per bit need more spectrum.',
            '**NRZ-L**: the level holds for the whole bit. Here 1 is high and 0 is low. Long runs of either bit have no edges.',
            '**NRZ-I**: a 1 causes a transition at the start of the bit and a 0 causes none. Long runs of 1s are fixed, but long runs of 0s are not.',
            '**Manchester**: every bit has a transition in the middle. In IEEE 802.3, 1 is low to high and 0 is high to low. It is self-clocking and DC balanced, but it doubles the baud rate.',
            '**Differential Manchester**: the mid-bit transition is only for clocking. A 0 adds a transition at the start of the bit and a 1 does not. It was used by Token Ring.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch02-signal-encoding-waveforms',
          title: 'Signal and encoding waveform description',
          caption: 'Read each column top to bottom, one row per bit period, for the data bits 1 0 1 1 0. NRZ-I starts from a Low level. The first column contrasts the two signal forms.',
          kind: 'block',
          mermaid: `flowchart TD
    subgraph S4["Signal forms"]
        A1["Analog, smooth continuous wave"] -->|sampled by ADC| A2["Digital, discrete levels"]
    end
    subgraph S0["Bit period and data bit"]
        B1["T1 bit 1"] --> B2["T2 bit 0"]
        B2 --> B3["T3 bit 1"]
        B3 --> B4["T4 bit 1"]
        B4 --> B5["T5 bit 0"]
    end
    subgraph S1["NRZ-L, 1 is high, 0 is low"]
        L1["T1 High"] --> L2["T2 Low"]
        L2 --> L3["T3 High"]
        L3 --> L4["T4 High"]
        L4 --> L5["T5 Low"]
    end
    subgraph S2["NRZ-I, 1 flips level at bit start"]
        I1["T1 flip, Low to High"] --> I2["T2 stay High"]
        I2 --> I3["T3 flip, High to Low"]
        I3 --> I4["T4 flip, Low to High"]
        I4 --> I5["T5 stay High"]
    end
    subgraph S3["Manchester, IEEE 802.3 convention"]
        M1["T1 Low then High"] --> M2["T2 High then Low"]
        M2 --> M3["T3 Low then High"]
        M3 --> M4["T4 Low then High"]
        M4 --> M5["T5 High then Low"]
    end`,
        },
        {
          type: 'diagram',
          id: 'ch02-manchester-flowchart',
          title: 'Manchester encoding of one bit (IEEE 802.3)',
          caption: 'The mid-bit edge carries both the data and the clock. An extra edge at the bit boundary appears only when the next bit equals the current one.',
          kind: 'flowchart',
          mermaid: `flowchart TD
    A1["Take next data bit"] --> A2{"Is the bit 1?"}
    A2 -->|Yes| A3["First half Low"]
    A3 --> A4["Second half High"]
    A2 -->|No| A5["First half High"]
    A5 --> A6["Second half Low"]
    A4 --> A7["Mid-bit edge carries data and clock"]
    A6 --> A7
    A7 --> A8{"Next bit equals this bit?"}
    A8 -->|Yes| A9["Extra edge at bit boundary"]
    A8 -->|No| A10["No edge at bit boundary"]
    A9 --> A11{"More bits to send?"}
    A10 --> A11
    A11 -->|Yes| A1
    A11 -->|No| A12["Transmitter returns to idle"]`,
        },
        {
          type: 'table',
          headers: ['Code', 'Clock in signal', 'DC balanced', 'Baud for `R` b/s', 'Where used'],
          rows: [
            ['NRZ-L', 'No', 'No', '`R`', 'Serial links such as RS-232, with start and stop bits'],
            ['NRZ-I', 'Only on 1s', 'No', '`R`', '`100BASE-FX` with 4B/5B. USB uses the opposite rule with bit stuffing'],
            ['Manchester', 'Yes, every bit', 'Yes', '`2R`', '`10BASE-T` Ethernet, some RFID systems'],
            ['Differential Manchester', 'Yes, every bit', 'Yes', '`2R`', 'Token Ring, IEEE 802.5'],
          ],
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: 'Two Manchester conventions exist. IEEE 802.3 uses 1 as low to high, while the older G. E. Thomas convention uses 1 as high to low. State the convention in your answer before you draw the waveform.',
        },
        {
          type: 'example',
          title: 'Baud and frequency of 10 Mb/s Manchester',
          steps: [
            'Bit time = `1 / 10 Mb/s = 100 ns`.',
            'Each bit has two half-bit signal elements of `50 ns`, so the signal rate is `20 Mbaud`.',
            'All 1s or all 0s give an edge every `50 ns`, which is a `10 MHz` square wave.',
            'Alternating `1010` gives only mid-bit edges, one every `100 ns`, which is a `5 MHz` square wave.',
            'Efficiency is 50 percent, so `100 Mb/s` Manchester would need `200 Mbaud`. This is why Fast Ethernet moved to 4B/5B at `125 Mbaud`.',
          ],
        },
        {
          type: 'paragraph',
          text: 'Faster links use block codes and multilevel signalling, because Manchester wastes too much bandwidth. Block codes add just enough edges for clock recovery. Multilevel codes such as PAM send several bits per symbol.',
        },
        {
          type: 'table',
          headers: ['Standard', 'Coding', 'Symbol rate', 'Medium', 'Data rate'],
          rows: [
            ['`10BASE-T`', 'Manchester', '20 Mbaud', '1 pair each way', '10 Mb/s'],
            ['`100BASE-TX`', '4B/5B with MLT-3', '125 Mbaud', '1 pair each way', '100 Mb/s'],
            ['`1000BASE-T`', 'PAM-5, 2 data bits per symbol', '125 Mbaud', '4 pairs, both directions at once', '1 Gb/s'],
            ['`10GBASE-T`', 'PAM-16 with LDPC, 3.125 data bits per symbol', '800 Mbaud', '4 pairs, both directions at once', '10 Gb/s'],
            ['`1000BASE-SX`', '8B/10B NRZ', '1.25 GBd', '2 fibers', '1 Gb/s'],
            ['`10GBASE-SR`', '64B/66B NRZ', '10.3125 GBd', '2 fibers', '10 Gb/s'],
          ],
        },
        {
          type: 'mini-lab',
          title: 'Count transitions by hand',
          goal: 'See why clock recovery and bandwidth pull in opposite directions.',
          steps: [
            'On squared paper, draw the bits `11110000` as eight equal columns.',
            'Draw NRZ-L with 1 as high and 0 as low.',
            'Draw NRZ-I, starting from a low level.',
            'Draw Manchester using the IEEE 802.3 convention.',
            'Count the level changes inside each waveform, including the flip at the start of the first bit for NRZ-I.',
          ],
          expected: 'NRZ-L has `1` change, NRZ-I has `4` and Manchester has `14`, made of 8 mid-bit edges and 6 boundary edges. The four 0s in NRZ-L and NRZ-I have no edges at all, so the receiver clock could drift there.',
        },
      ],
    },
    {
      id: 'transmission-media',
      title: 'Guided and unguided media',
      videoId: 'ch02-transmission-media-cabling',
      blocks: [
        {
          type: 'paragraph',
          text: 'A transmission medium is the physical path between transmitter and receiver. Guided media such as twisted pair, coaxial cable and fiber keep the signal inside a conductor or a glass core. Unguided media send it through air or space, where everyone in range shares the spectrum.',
        },
        {
          type: 'points',
          items: [
            '**Twisted pair**: twisting makes outside noise couple equally into both wires. The receiver reads the difference between them, which cancels most of the noise.',
            '**Shielding**: `U/UTP` has no shield, `F/UTP` has foil around all pairs and `S/FTP` has a braid plus foil on each pair. Shielded cable needs correct grounding.',
            '**Coaxial cable**: a centre conductor, insulator, braided shield and jacket. `75 ohm` coax carries cable TV and DOCSIS, while `50 ohm` is used for RF and legacy `10BASE2`.',
            '**Optical fiber**: light stays in the core by total internal reflection, because the core has a higher refractive index than the cladding.',
            '**Propagation speed**: signals travel at about `2 x 10^8 m/s` in both copper and fiber, which is about 5 µs per km. Fiber wins on bandwidth and low loss, not on speed.',
          ],
        },
        {
          type: 'table',
          headers: ['Category', 'Bandwidth', 'Ethernet support', 'Where you see it'],
          rows: [
            ['Cat 3', '16 MHz', '`10BASE-T`, 100 m', 'Old telephone risers'],
            ['Cat 5e', '100 MHz', '`1000BASE-T` and `2.5GBASE-T`, 100 m', 'Homes, older offices'],
            ['Cat 6', '250 MHz', '`1000BASE-T` and `5GBASE-T`, 100 m. `10GBASE-T` to about 55 m', 'Most current offices'],
            ['Cat 6A', '500 MHz', '`10GBASE-T`, 100 m', 'New buildings, Wi-Fi 6 and Wi-Fi 7 access points'],
            ['Cat 7', '600 MHz', '10 Gb/s, 100 m, individually shielded. ISO class, not a TIA category', 'Rarely specified'],
            ['Cat 8', '2000 MHz', '`25GBASE-T` and `40GBASE-T`, 30 m', 'Data centre racks'],
          ],
        },
        {
          type: 'points',
          items: [
            '**Multimode fiber**: a wide 50 µm core lets light take many paths. Modal dispersion limits reach, but 850 nm VCSEL optics are cheap.',
            '**Single-mode fiber**: a 9 µm core carries one path, so reach is tens of km with 1310 nm or 1550 nm lasers. Loss is about 0.35 dB/km at 1310 nm and 0.2 dB/km at 1550 nm.',
            '**Strengths of fiber**: immune to electromagnetic interference, no ground loops, very low loss and hard to tap.',
            '**Weaknesses of fiber**: limited bend radius, more skilled termination and sensitivity to dirty connectors.',
          ],
        },
        {
          type: 'table',
          headers: ['Fiber type', 'Core and cladding', 'Light source', 'Typical reach', 'Typical use'],
          rows: [
            ['OM3 multimode', '50/125 µm', 'VCSEL, 850 nm', '`10GBASE-SR` 300 m, `100GBASE-SR4` 70 m', 'Data centre rows'],
            ['OM4 multimode', '50/125 µm', 'VCSEL, 850 nm', '`10GBASE-SR` 400 m, `100GBASE-SR4` 100 m', 'Data centres, building risers'],
            ['OS2 single-mode', '9/125 µm', 'Laser, 1310 or 1550 nm', '`10GBASE-LR` 10 km, `10GBASE-ER` 40 km', 'Campus, ISP, long haul'],
          ],
        },
        {
          type: 'example',
          title: 'Fiber link power budget',
          steps: [
            'An SFP launches at `-3 dBm` and its receiver sensitivity is `-20 dBm`, so the budget is `17 dB`.',
            'Fiber loss: `12 km x 0.4 dB/km = 4.8 dB` on OS2.',
            'Connectors: `2 x 0.5 dB = 1.0 dB`. Splices: `4 x 0.1 dB = 0.4 dB`.',
            'Total loss = `4.8 + 1.0 + 0.4 = 6.2 dB`.',
            'Received power = `-3 - 6.2 = -9.2 dBm`, leaving a margin of `-9.2 - (-20) = 10.8 dB`. The link will work, with room for ageing and repairs.',
          ],
        },
        {
          type: 'command-lab',
          title: 'Read the negotiated link on a Linux NIC',
          command: 'ethtool eth0',
          output: `Settings for eth0:
        Supported ports: [ TP ]
        Supported link modes:   10baseT/Half 10baseT/Full
                                100baseT/Half 100baseT/Full
                                1000baseT/Full
        Supports auto-negotiation: Yes
        Advertised link modes:  10baseT/Half 10baseT/Full
                                100baseT/Half 100baseT/Full
                                1000baseT/Full
        Speed: 1000Mb/s
        Duplex: Full
        Port: Twisted Pair
        Auto-negotiation: on
        MDI-X: off (auto)
        Link detected: yes`,
          explanation: [
            '`Supported ports: [ TP ]` means the NIC has a twisted pair port, which is `RJ45`.',
            '`Supported link modes` lists what this PHY can run. It has no `1000baseT/Half`, since half-duplex Gigabit is not used in practice.',
            '`Advertised link modes` is what the NIC offers its partner during auto-negotiation.',
            '`Speed: 1000Mb/s` and `Duplex: Full` are the negotiated result, so all four pairs are working.',
            '`Auto-negotiation: on` shows that the speed was agreed by both ends, not forced.',
            '`MDI-X: off (auto)` means Auto-MDIX is active and has not needed to swap pairs on this cable.',
            '`Link detected: yes` means the PHY sees a valid signal from the far end. This is the same state as the port LED.',
          ],
        },
        {
          type: 'paragraph',
          text: 'Unguided media are classified by frequency, because frequency decides range and wall penetration. Lower frequencies travel further and pass through walls better, while higher frequencies have more spectrum and therefore more capacity. All stations in range share the medium, so wireless capacity is always shared.',
        },
        {
          type: 'points',
          items: [
            '**Radio waves, 3 kHz to 1 GHz**: mostly omnidirectional and pass through walls. Used by AM, FM and TV broadcast.',
            '**Microwaves, 1 to 300 GHz**: more directional, and line of sight at higher frequencies. Wi-Fi, cellular, satellite and point-to-point links live here.',
            '**Infrared, 300 GHz to 400 THz**: blocked by walls. Used by remote controls and short indoor links.',
            '**Free-space loss**: received power falls with the square of distance, so doubling the distance costs `6 dB`. Moving from 2.4 GHz to 5 GHz costs about `6.4 dB` over the same path.',
            '**Multipath and fading**: reflections arrive out of phase and can cancel the signal. OFDM and MIMO are designed to handle this.',
          ],
        },
        {
          type: 'table',
          headers: ['System', 'Frequency', 'Typical range', 'Used for'],
          rows: [
            ['Wi-Fi, IEEE 802.11', '2.4, 5 and 6 GHz', 'Tens of metres indoors', 'Home and office access'],
            ['Bluetooth', '2.4 GHz', 'About 10 m', 'Personal devices'],
            ['Cellular, 4G and 5G', 'About 600 MHz to 6 GHz, plus mmWave near 26 GHz', 'Hundreds of metres to km', 'Mobile broadband'],
            ['Microwave backhaul', 'About 6 to 80 GHz', 'Up to tens of km, line of sight', 'ISP and tower links'],
            ['GEO satellite', 'Ku and Ka bands', '35,786 km altitude, RTT about 600 ms', 'Remote sites, maritime'],
            ['LEO satellite', 'Ku and Ka bands', 'About 550 km altitude, RTT about 25 to 60 ms', 'Rural broadband'],
          ],
        },
        {
          type: 'diagram',
          id: 'ch02-media-selection',
          title: 'Choosing a medium for a new link',
          caption: 'A simplified rule of thumb using 10 Gb/s optics for the fiber reach values. Cost, interference and existing ducts also affect the real choice.',
          kind: 'flowchart',
          mermaid: `flowchart TD
    A1["New link requirement"] --> A2{"Can you lay a cable?"}
    A2 -->|No| A3{"Clear line of sight over km?"}
    A3 -->|Yes| A4["Point-to-point microwave"]
    A3 -->|No| A5{"Inside a building?"}
    A5 -->|Yes| A6["Wi-Fi at 5 or 6 GHz"]
    A5 -->|No| A7["Cellular or LEO satellite"]
    A2 -->|Yes| A8{"Run longer than 100 m?"}
    A8 -->|Yes| A9{"Run longer than 400 m?"}
    A9 -->|Yes| A10["OS2 single-mode fiber"]
    A9 -->|No| A11["OM4 multimode fiber"]
    A8 -->|No| A12{"Need 10 Gb/s to the device?"}
    A12 -->|Yes| A13["Cat 6A copper"]
    A12 -->|No| A14["Cat 6 copper"]`,
        },
        {
          type: 'command-lab',
          title: 'Read the radio link on Linux Wi-Fi',
          command: 'iw dev wlan0 link',
          output: `Connected to 02:11:22:33:44:55 (on wlan0)
        SSID: CampusLab
        freq: 5180
        RX: 48211937 bytes (61204 packets)
        TX: 8123004 bytes (19877 packets)
        signal: -58 dBm
        rx bitrate: 433.3 MBit/s VHT-MCS 9 80MHz short GI VHT-NSS 1
        tx bitrate: 390.0 MBit/s VHT-MCS 8 80MHz short GI VHT-NSS 1`,
          explanation: [
            '`Connected to` shows the MAC address of the access point radio, called the BSSID.',
            '`freq: 5180` is 5180 MHz, which is channel `36` in the 5 GHz band.',
            '`signal: -58 dBm` is the received power. Around `-67 dBm` is a common design target for voice, so this is a healthy link.',
            '`rx bitrate: 433.3 MBit/s` comes from `VHT-MCS 9`, which is `256-QAM` with rate 5/6, on an `80MHz` channel with one spatial stream, `VHT-NSS 1`.',
            '`tx bitrate: 390.0 MBit/s` uses `VHT-MCS 8`, one step lower, showing that each direction adapts its rate separately.',
          ],
        },
        {
          type: 'troubleshoot',
          symptom: 'A laptop shows a strong 2.4 GHz Wi-Fi signal, but throughput drops to a few Mb/s and `ping` spikes at certain times.',
          checks: [
            'Compare signal with noise using `netsh wlan show interfaces` on Windows or `iw dev wlan0 link` on Linux. A strong signal alone does not mean a good SNR.',
            'Scan for neighbouring networks with `netsh wlan show networks mode=bssid` and look for overlap on channels `1`, `6` and `11`.',
            'Check whether the problem matches a microwave oven or Bluetooth use, since both share 2.4 GHz.',
            'Run `ping -n 50 192.168.1.1` to the gateway, so that ISP problems are ruled out.',
          ],
          fix: 'Move the client to the 5 GHz or 6 GHz band, or set the access point to the least crowded of channels `1`, `6` and `11`. For a desk that never moves, use a cable.',
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'A typical deployment uses all of these together. Cat 6A runs to each access point and desk, OM4 or OS2 fiber connects the floors, and OS2 goes to the ISP. Inside a cloud data centre, servers connect to the top-of-rack switch by short copper DAC cables or `AOC`, and racks connect upward by fiber.',
        },
      ],
    },
    {
      id: 'multiplexing',
      title: 'Multiplexing: FDM, TDM and statistical',
      videoId: 'ch02-multiplexing-fdm-tdm',
      blocks: [
        {
          type: 'paragraph',
          text: 'Multiplexing lets several signals share one physical link, because laying a separate cable for each user is too expensive. A multiplexer combines the inputs at the sender and a demultiplexer separates them at the receiver. The three classic methods divide the link by frequency, by fixed time slots or by demand.',
        },
        {
          type: 'points',
          items: [
            '**FDM**: each signal gets its own frequency band all the time. Guard bands stop neighbouring channels from interfering.',
            '**WDM**: FDM applied to light, where each signal gets its own wavelength. DWDM carries about 40 to 96 wavelengths on one fiber.',
            '**Synchronous TDM**: each input gets a fixed slot in every frame, in turn. If an input has nothing to send, its slot goes empty.',
            '**Statistical TDM**: slots are given on demand from a buffer. Each slot carries an address, because position no longer identifies the input.',
            '**Trade-off**: fixed methods guarantee capacity but waste it when idle. Statistical sharing uses capacity well, but delay varies and the buffer can overflow.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch02-multiplexing-working',
          title: 'How FDM, synchronous TDM and statistical TDM share a link',
          caption: 'FDM separates signals by frequency and synchronous TDM by slot position. Statistical TDM skips idle inputs, so each slot must carry an address.',
          kind: 'working-diagram',
          mermaid: `flowchart LR
    subgraph S1["FDM, share by frequency"]
        F1["Source A on carrier f1"] --> F4["Combiner adds guard bands"]
        F2["Source B on carrier f2"] --> F4
        F3["Source C on carrier f3"] --> F4
        F4 --> F5["Wideband link carries all at once"]
        F5 --> F6["Band-pass filters split channels"]
    end
    subgraph S2["Synchronous TDM, share by fixed time"]
        T1["Input A"] --> T4["Mux scans inputs in fixed order"]
        T2["Input B"] --> T4
        T3["Input C"] --> T4
        T4 --> T5["Frame slots A B C, idle slots wasted"]
        T5 --> T6["Demux uses slot position"]
    end
    subgraph S3["Statistical TDM, share on demand"]
        D1["Input A active"] --> D4["Mux buffers arriving data"]
        D2["Input B idle"] -->|no data| D4
        D3["Input C active"] --> D4
        D4 --> D5["Slots A C A C, each with address"]
        D5 --> D6["Demux reads address in each slot"]
    end`,
        },
        {
          type: 'table',
          headers: ['Feature', 'FDM', 'Synchronous TDM', 'Statistical TDM'],
          rows: [
            ['Shared resource', 'Frequency', 'Time, fixed slots', 'Time, slots on demand'],
            ['Signal type', 'Analog or modulated', 'Digital', 'Digital'],
            ['Idle input', 'Band stays unused', 'Slot stays empty', 'Others use the capacity'],
            ['How output is identified', 'By filter frequency', 'By slot position', 'By address in each slot'],
            ['Overhead', 'Guard bands', 'Framing bits', 'Address per slot, buffering'],
            ['Delay', 'Constant', 'Constant', 'Variable'],
            ['Real example', 'FM radio, DSL bands', 'T1, E1, SONET', 'Ethernet, IP routers, Wi-Fi'],
          ],
        },
        {
          type: 'callout',
          variant: 'formula',
          text: 'FDM: `B_total = n x B_channel + (n - 1) x B_guard`. TDM: `R_line = frames per second x bits per frame`. With one framing bit per frame, `bits per frame = n x bits per slot + 1`.',
        },
        {
          type: 'example',
          title: 'FDM bandwidth and TDM line rate',
          steps: [
            'FDM: five channels of `100 kHz` with `10 kHz` guard bands need `5 x 100 + 4 x 10 = 540 kHz`.',
            'TDM: four inputs of `1 Mb/s` send one byte per slot, so the frame rate is `1,000,000 / 8 = 125,000` frames per second.',
            'With one framing bit, each frame is `4 x 8 + 1 = 33` bits.',
            'Line rate = `33 x 125,000 = 4.125 Mb/s`, and frame time = `1 / 125,000 = 8 µs`.',
          ],
        },
        {
          type: 'example',
          title: 'Statistical multiplexing gain',
          steps: [
            'Ten users each send at `1 Mb/s` when active, and each is active 10 percent of the time. The shared link is `5 Mb/s`.',
            'With fixed slots of `1 Mb/s`, only `5` users fit.',
            'Average total load with statistical sharing is `10 x 0.1 x 1 = 1 Mb/s`, far below the link rate.',
            'The link overloads only if 6 or more users are active at once. The binomial probability is about `0.00015`, or 0.015 percent of the time.',
            'During those rare moments, the buffer absorbs the excess and delay rises. This gain is why data networks use statistical sharing.',
          ],
        },
        {
          type: 'callout',
          variant: 'exam-tip',
          text: 'In synchronous TDM, the line rate is the sum of all input rates plus framing, even when inputs are idle. In statistical TDM, the link can be smaller than the sum of input peaks. Use the phrase **slot position identifies the input** for synchronous TDM and **address identifies the input** for statistical TDM.',
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'DSL uses FDM on one copper pair: voice below 4 kHz, then upstream, then downstream up to about 1.1 MHz for ADSL. Wi-Fi uses OFDM, which is FDM with many narrow overlapping subcarriers. Backbone fiber uses DWDM, and each wavelength may carry IP traffic that is statistically multiplexed. Real networks stack several of these methods.',
        },
        {
          type: 'case-study',
          title: 'GPON fiber to the home stacks WDM and TDM',
          scenario: 'An ISP serves 32 homes from one fiber port in its exchange, using a passive optical splitter in the street. No powered equipment sits between the exchange and the home.',
          steps: [
            'The **OLT** in the exchange connects to one fiber, and a passive `1:32` splitter divides it to 32 home **ONTs**.',
            '**WDM** separates the two directions on the same strand: downstream at `1490 nm` at `2.488 Gb/s`, and upstream at `1310 nm` at `1.244 Gb/s`.',
            '**Downstream** is a TDM stream sent to all ONTs. Each ONT keeps only the frames with its own identifier, and encryption protects the rest.',
            '**Upstream** uses TDMA. The OLT grants each ONT its own time slots, so bursts from different homes do not collide at the splitter.',
            'The fixed share would be `2488 / 32 = 77.75 Mb/s` per home. Because homes are rarely all busy at once, the ISP can sell faster plans, which is statistical multiplexing gain.',
            'The evening peak is the real test. If too many homes are busy, speeds fall, so the ISP monitors port use and upgrades or splits busy ports.',
          ],
        },
      ],
    },
    {
      id: 'switching',
      title: 'Switching: circuit, packet and virtual circuit',
      videoId: 'ch02-switching-circuit-vs-packet',
      blocks: [
        {
          type: 'paragraph',
          text: 'A network cannot wire every pair of hosts together, so traffic passes through intermediate switching nodes. Switching decides how those nodes share their links. Circuit switching reserves capacity ahead of time, packet switching sends data in independently handled units, and virtual circuits combine a fixed path with packet-style sharing.',
        },
        {
          type: 'points',
          items: [
            '**Circuit switching**: three phases of setup, data transfer and teardown. Capacity is reserved on every link for the whole call, using FDM or TDM channels.',
            '**Datagram packet switching**: each packet carries a full destination address and is routed on its own. Packets may take different paths and arrive out of order.',
            '**Store and forward**: a router receives the whole packet and checks it before sending it on. This adds one transmission time at each hop.',
            '**Virtual circuit**: a path is set up first, as in a circuit, but capacity is shared as in packet switching. Packets carry a short label, and each switch swaps it for the next one.',
            '**Queueing**: when packets arrive faster than a link can send them, they wait in a buffer. If the buffer is full, they are dropped.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch02-circuit-vs-packet',
          title: 'Circuit switching compared with packet switching',
          caption: 'Circuit switching does its work before data flows, then runs at a fixed rate. Packet switching makes a decision per packet at every router, so delay varies.',
          kind: 'working-diagram',
          mermaid: `flowchart TD
    subgraph S1["Circuit switching"]
        C1["Setup request crosses each switch"] --> C2["Channel reserved on every link"]
        C2 --> C3["Accept returns to the caller"]
        C3 --> C4["Bits flow at fixed rate, no queues"]
        C4 --> C5["Silent periods waste the channel"]
        C5 --> C6["Teardown releases the channel"]
    end
    subgraph S2["Packet switching, datagram mode"]
        P1["Message split into packets"] --> P2["Header carries destination address"]
        P2 --> P3["Router stores the whole packet"]
        P3 --> P4["Table lookup selects output link"]
        P4 --> P5["Packet queues if link is busy"]
        P5 --> P6["Receiver reorders and reassembles"]
    end`,
        },
        {
          type: 'table',
          headers: ['Feature', 'Circuit', 'Datagram packet', 'Virtual circuit'],
          rows: [
            ['Setup before data', 'Required', 'None', 'Required'],
            ['Capacity', 'Reserved for the whole call', 'Shared on demand', 'Shared, reservation optional'],
            ['Address in each unit', 'None needed', 'Full destination address', 'Short VC label'],
            ['Path', 'Fixed', 'Can differ per packet', 'Fixed'],
            ['Order at receiver', 'Preserved', 'May be out of order', 'Preserved'],
            ['Delay', 'Setup, then constant', 'No setup, variable queueing', 'Setup, then variable queueing'],
            ['If a node fails', 'Call drops', 'Routers route around it', 'Circuit must be set up again'],
            ['Idle capacity', 'Wasted', 'Used by others', 'Used by others unless reserved'],
            ['Real example', 'Classic PSTN telephone call', 'IP on the Internet', 'ATM, Frame Relay, MPLS paths'],
          ],
        },
        {
          type: 'diagram',
          id: 'ch02-virtual-circuit-sequence',
          title: 'Virtual circuit setup, data and release',
          caption: 'The label has local meaning on each link. Switch1 swaps VCI 12 for 22 and Switch2 swaps VCI 22 for 63, using tables built during setup.',
          kind: 'working-diagram',
          mermaid: `sequenceDiagram
    participant A as HostA
    participant R1 as Switch1
    participant R2 as Switch2
    participant B as HostB
    A->>R1: Setup to HostB, VCI 12
    R1->>R2: Setup to HostB, VCI 22
    R2->>B: Setup to HostB, VCI 63
    B->>R2: Connected, VCI 63
    R2->>R1: Connected, VCI 22
    R1->>A: Connected, VCI 12
    Note over A,B: Each switch now maps in-VCI to out-VCI
    A->>R1: Data, VCI 12
    R1->>R2: Data, VCI 22
    R2->>B: Data, VCI 63
    A->>R1: Release, VCI 12
    R1->>R2: Release, VCI 22
    R2->>B: Release, VCI 63`,
        },
        {
          type: 'callout',
          variant: 'formula',
          text: 'Ignoring queueing and processing: circuit `T = Tsetup + L/R + hops x Tp`. One packet, store and forward: `T = hops x (L/R + Tp)`. `P` packets back to back: `T = (P + hops - 1) x (L/R) + hops x Tp`, where `L` is the packet size and `hops` is the number of links.',
        },
        {
          type: 'example',
          title: 'Sending 1,000,000 bits over 3 links of 1 Mb/s',
          steps: [
            'Propagation is `5 ms` per link. Circuit setup takes `100 ms`.',
            '**Circuit**: `100 + 1000 + 3 x 5 = 1115 ms`.',
            '**One large message, store and forward**: `3 x (1000 + 5) = 3015 ms`, since every hop must hold the entire message.',
            '**100 packets of 10,000 bits**, headers ignored: each takes `10 ms` per link, so `(100 + 3 - 1) x 10 + 3 x 5 = 1035 ms`.',
            'Splitting into packets removes most of the store-and-forward penalty and also lets other users share the links.',
          ],
        },
        {
          type: 'command-lab',
          title: 'See per-hop delay in a packet-switched path',
          command: 'traceroute -n 203.0.113.10',
          output: `traceroute to 203.0.113.10 (203.0.113.10), 30 hops max, 60 byte packets
 1  192.168.1.1     1.214 ms   1.102 ms   1.087 ms
 2  10.20.0.1       6.871 ms   7.012 ms   6.944 ms
 3  198.51.100.9    9.330 ms   9.218 ms   9.402 ms
 4  198.51.100.33  24.771 ms  24.903 ms  24.688 ms
 5  203.0.113.1    25.512 ms  25.340 ms  25.611 ms
 6  203.0.113.10   25.903 ms  26.022 ms  25.871 ms`,
          explanation: [
            'The first line shows the target, the hop limit of `30` and the probe size of `60` bytes. `-n` turns off name lookups.',
            'Hop `1`, `192.168.1.1`, is the home router at about 1 ms. Each hop shows three probes.',
            'Hop `2`, `10.20.0.1`, is the first ISP router at about 7 ms. The access network accounts for most of this delay.',
            'Between hop `3` and hop `4`, delay jumps by about `15.5 ms`. That is `7.75 ms` one way, and at 200 km per ms it suggests about `1550 km` of fiber.',
            'Hops `5` and `6` add little, so they are close to hop `4`.',
            'Each hop is a store-and-forward router. Times differ slightly between probes because of queueing, a sign that no capacity is reserved.',
          ],
        },
        {
          type: 'wireshark',
          filter: 'icmp && frame.len == 1442',
          whatToLook: [
            'Capture on a wired NIC while running ping -l 1400 192.168.1.1 on Windows or ping -s 1400 192.168.1.1 on Linux.',
            'Check the frame size: 14 bytes Ethernet + 20 bytes IP + 8 bytes ICMP + 1400 bytes data = 1442 bytes on wire.',
            'Note that the capture starts at the destination MAC. The 7 byte preamble and 1 byte SFD are consumed by the NIC, and the 4 byte FCS is normally stripped too. They belong to the boundary with the physical layer.',
            'Calculate the time on the wire: (8 + 1442 + 4) x 8 = 11632 bits, which takes 116.32 microseconds at 100 Mb/s and 11.632 microseconds at 1 Gb/s.',
            'Add frame.time_delta as a column and watch the gaps between frames vary, which shows statistical sharing and not a reserved circuit.',
          ],
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'Telephone networks were built on circuit switching, but most operators now carry voice as packets, for example VoLTE and SIP trunks. ISP backbones often run **MPLS**, which is a virtual circuit idea: routers forward on a 20-bit label and swap it at each hop. A packet-switched core can still reserve capacity through traffic engineering.',
        },
        {
          type: 'callout',
          variant: 'remember',
          text: 'Circuit is reserve then send. Datagram is send with a full address. Virtual circuit is set up a path, then send with a short label.',
        },
      ],
    },
    {
      id: 'structured-cabling-connectors',
      title: 'Structured cabling and connectors',
      blocks: [
        {
          type: 'paragraph',
          text: 'Structured cabling is a standard way of wiring a building so that any outlet can serve any device without new cable. The `TIA-568` and `ISO/IEC 11801` standards define its subsystems, length limits and test requirements. A well-built plant outlasts several generations of switches, often 15 years or more.',
        },
        {
          type: 'points',
          items: [
            '**Entrance facility**: where the ISP service enters the building, including the demarcation point.',
            '**Equipment room**: the main distribution frame, or MDF, with routers, firewalls and core switches.',
            '**Backbone cabling**: vertical runs between the equipment room and each floor, usually fiber.',
            '**Telecommunications room**: the intermediate distribution frame, or IDF, with access switches and patch panels on each floor.',
            '**Horizontal cabling**: solid-conductor cable from the patch panel to the outlet, in a star layout. It stays fixed for years.',
            '**Work area**: wall outlets and the stranded patch cords that connect PCs, phones and printers.',
          ],
        },
        {
          type: 'diagram',
          id: 'ch02-structured-cabling',
          title: 'Structured cabling subsystems in a building',
          caption: 'Signal path from the ISP handoff to a desk or access point. The fixed horizontal run is at most 90 m, and with patch cords the channel is at most 100 m.',
          kind: 'block',
          mermaid: `flowchart TD
    subgraph S1["Entrance facility"]
        E1["ISP fiber handoff at demarc"]
    end
    subgraph S2["Equipment room, the MDF"]
        R1["Edge router and firewall"] --> R2["Core switch"]
    end
    subgraph S3["Backbone cabling"]
        B1["OS2 or OM4 fiber riser"]
    end
    subgraph S4["Telecom room on each floor, the IDF"]
        T1["Fiber patch panel"] --> T2["Access switch with PoE"]
        T2 --> T3["Patch cord up to 5 m"]
        T3 --> T4["Copper patch panel"]
    end
    subgraph S5["Horizontal cabling"]
        H1["Solid Cat 6A, max 90 m"]
    end
    subgraph S6["Work area"]
        W1["RJ45 wall outlet"] --> W2["Patch cord to PC or phone"]
        W3["Ceiling outlet to Wi-Fi AP"]
    end
    E1 --> R1
    R2 --> B1
    B1 --> T1
    T4 --> H1
    H1 --> W1
    H1 --> W3`,
        },
        {
          type: 'callout',
          variant: 'remember',
          text: 'The copper channel is `100 m` in total: `90 m` of solid horizontal cable, called the permanent link, plus up to `10 m` of stranded patch cords across both ends. Stranded cable loses more per metre, so it is kept short.',
        },
        {
          type: 'table',
          headers: ['Connector', 'Medium', 'Typical use'],
          rows: [
            ['`RJ45`, also called 8P8C', 'Cat 5e to Cat 6A copper', 'PCs, access points, switch ports'],
            ['`RJ11`', 'Telephone pair', 'Analog phones, DSL'],
            ['`BNC`', '50 or 75 ohm coax', 'Legacy `10BASE2`, lab instruments, CCTV'],
            ['`F-type`', '75 ohm coax', 'Cable modems, TV'],
            ['`LC`', 'Fiber, small 1.25 mm ferrule, usually duplex', '`SFP` and `SFP+` modules, data centres'],
            ['`SC`', 'Fiber, 2.5 mm ferrule, push-pull', 'GPON ONTs, patch panels'],
            ['`ST`', 'Fiber, bayonet twist lock', 'Older campus installations'],
            ['`MPO/MTP`', '12 or 24 fibers in one ferrule', '40G and 100G parallel optics'],
          ],
        },
        {
          type: 'table',
          headers: ['Pin', 'T568A', 'T568B', '`100BASE-TX`', '`1000BASE-T`'],
          rows: [
            ['1', 'White-green', 'White-orange', 'TX+', 'BI_DA+'],
            ['2', 'Green', 'Orange', 'TX-', 'BI_DA-'],
            ['3', 'White-orange', 'White-green', 'RX+', 'BI_DB+'],
            ['4', 'Blue', 'Blue', 'Unused', 'BI_DC+'],
            ['5', 'White-blue', 'White-blue', 'Unused', 'BI_DC-'],
            ['6', 'Orange', 'Green', 'RX-', 'BI_DB-'],
            ['7', 'White-brown', 'White-brown', 'Unused', 'BI_DD+'],
            ['8', 'Brown', 'Brown', 'Unused', 'BI_DD-'],
          ],
        },
        {
          type: 'points',
          items: [
            '**Straight-through cable**: the same standard on both ends. It connects unlike devices, such as PC to switch.',
            '**Crossover cable**: `T568A` on one end and `T568B` on the other. It connects like devices, such as switch to switch, on older ports.',
            '**Auto-MDIX**: modern ports detect the wiring and swap pairs automatically, so crossover cables are rarely needed now.',
            '**Power over Ethernet**: the switch feeds power over the same cable. `802.3af` gives 15.4 W, `802.3at` gives 30 W and `802.3bt` gives up to 90 W at the source.',
            '**Transceivers**: `SFP` handles 1 Gb/s, `SFP+` handles 10 Gb/s and `QSFP28` handles 100 Gb/s. The module, and not the switch, sets the fiber type and reach.',
            '**Testing**: certify each permanent link with a cable analyzer for wire map, length, insertion loss and crosstalk. Keep the reports.',
          ],
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'In an office of 200 users across 4 floors, you would expect a small MDF, one IDF per floor, fiber risers and two Cat 6A runs per desk. Colour coding and labels at both ends of every cable save hours later. Wi-Fi access points also need horizontal runs, so the cabling plan must include ceiling locations.',
        },
        {
          type: 'case-study',
          title: 'A Gigabit desk stuck at 94 Mb/s',
          scenario: 'A user on a new Cat 6 run reports that large downloads from the file server stop at about 94 Mb/s, while colleagues get about 940 Mb/s. The switch and server are the same for everyone.',
          steps: [
            'Check the host first: `ethtool eth0` or the Windows adapter status shows `100 Mb/s` and full duplex, where `1000 Mb/s` was expected.',
            'Check the switch: `show interfaces GigabitEthernet0/12` confirms `100Mb/s` and shows CRC errors rising.',
            'Test the cable: a handheld tester reports pair `7-8` open at about 3 m, and the wall-to-panel run is clean, so the fault is in the patch cord.',
            'Explain the result: `1000BASE-T` needs all four pairs, while `100BASE-TX` uses only pins `1-2` and `3-6`. Auto-negotiation fell back to the speed that the damaged cord could support.',
            'Fix it: replace the crushed patch cord, then confirm `1000Mb/s` and about 940 Mb/s with `iperf3`. CRC counters stop rising after a `clear counters`.',
            'Prevent it: use cable management at the desk, and add a monitoring alert for ports that link below the expected speed.',
          ],
        },
        {
          type: 'command-lab',
          title: 'Check link speed and errors on a Cisco switch port',
          command: 'show interfaces GigabitEthernet0/12',
          output: `GigabitEthernet0/12 is up, line protocol is up (connected)
  Hardware is Gigabit Ethernet, address is 0011.2233.440c (bia 0011.2233.440c)
  MTU 1500 bytes, BW 100000 Kbit/sec, DLY 100 usec,
     reliability 254/255, txload 1/255, rxload 3/255
  Encapsulation ARPA, loopback not set
  Full-duplex, 100Mb/s, media type is 10/100/1000BaseTX
  5 minute input rate 1180000 bits/sec, 140 packets/sec
  5 minute output rate 420000 bits/sec, 95 packets/sec
     1840221 packets input, 1622038811 bytes, 0 no buffer
     Received 5120 broadcasts (4110 multicasts)
     0 runts, 0 giants, 0 throttles
     3172 input errors, 3170 CRC, 2 frame, 0 overrun, 0 ignored
     1204455 packets output, 398221004 bytes, 0 underruns
     0 output errors, 0 collisions, 0 interface resets`,
          explanation: [
            '`is up, line protocol is up` means the physical signal and the data link are both working. A link can be up and still be unhealthy.',
            '`BW 100000 Kbit/sec` shows that a Gigabit port is running at 100 Mb/s.',
            '`rxload 3/255` matches the input rate: `1.18 Mb/s` of `100 Mb/s` is about 1.2 percent, and `3/255` is also about 1.2 percent.',
            '`Full-duplex, 100Mb/s` is the negotiated result, which points to the downshift in the case study.',
            '`3172 input errors, 3170 CRC, 2 frame`: the frames arrived with bad checksums. `3170 / 1840221` is about 0.17 percent. CRC errors are the classic sign of a physical layer fault.',
            '`0 collisions` confirms that the port is full duplex. Collisions on a full-duplex port would suggest a duplex mismatch.',
          ],
        },
        {
          type: 'troubleshoot',
          symptom: 'A new fiber uplink between two switches stays down, and the port LED is off at both ends.',
          checks: [
            'Check that both optics match each other and the fiber: `SR` at 850 nm with OM3 or OM4, and `LR` at 1310 nm with OS2.',
            'Run `show interfaces status` to see whether the port is `notconnect`, `err-disabled` or showing an unsupported transceiver.',
            'Run `show interfaces transceiver` and read the receive power. A value near `-40 dBm` means no light is arriving.',
            'Check polarity: the transmit strand at one end must reach the receive port at the other end.',
            'Inspect both LC end faces with a fiber scope, and clean them before reconnecting. Never look into a live fiber.',
          ],
          fix: 'Swap the two LC connectors at one end if polarity is wrong, clean any dirty end faces and replace mismatched optics. Confirm that receive power is within the transceiver range and that the port shows `connected`.',
        },
        {
          type: 'mini-lab',
          title: 'Straight-through and crossover in Packet Tracer',
          goal: 'See how cable type affects link state on devices without automatic pair swapping.',
          steps: [
            'Open Cisco Packet Tracer and add two PCs, one `2960` switch and the copper cables.',
            'Connect `PC0` to the switch with a **straight-through** cable and wait for the link lights to turn green.',
            'Connect `PC0` directly to `PC1` on a spare port with a **straight-through** cable and note the light colour.',
            'Replace that cable with a **crossover** cable.',
            'Set the IP addresses to `192.168.10.1/24` and `192.168.10.2/24`, then run `ping 192.168.10.2` from `PC0`.',
          ],
          expected: 'The PC-to-switch link comes up green. The PC-to-PC link stays red with a straight-through cable and turns green with a crossover cable, after which `ping` succeeds. Real modern NICs usually hide this difference through Auto-MDIX.',
        },
      ],
    },
  ],
  flashcards: [
    { front: 'What does the physical layer transmit?', back: 'Raw bits as signals on a medium: voltage, light or radio waves. It has no notion of frames or addresses.' },
    { front: 'Bit rate versus baud rate', back: 'Bit rate is data bits per second. Baud rate is signal elements per second. R = S x log2(L).' },
    { front: 'State the Nyquist formula and its assumption', back: 'C = 2B log2(L). It assumes a noiseless channel with bandwidth B and L signal levels.' },
    { front: 'State the Shannon formula', back: 'C = B log2(1 + S/N), with S/N as a linear ratio. It is the upper limit for a noisy channel.' },
    { front: 'What do -3 dB and -10 dB mean?', back: '-3 dB is about half the power. -10 dB is one tenth of the power.' },
    { front: 'Amplifier versus repeater', back: 'An amplifier boosts the signal and its noise. A repeater detects symbols and regenerates a clean copy.' },
    { front: 'Why does NRZ-L fail on long runs of one bit?', back: 'There are no transitions, so the receiver clock can drift, and the baseline can wander.' },
    { front: 'Manchester rule in IEEE 802.3', back: 'Every bit has a mid-bit transition. A 1 is low to high and a 0 is high to low.' },
    { front: 'What is the cost of Manchester encoding?', back: 'It doubles the baud rate. 10 Mb/s needs 20 Mbaud, so efficiency is 50 percent.' },
    { front: 'What is the 90 plus 10 rule?', back: 'A copper channel is 100 m: 90 m of fixed horizontal cable plus up to 10 m of patch cords.' },
    { front: 'Which cable carries 10GBASE-T a full 100 m?', back: 'Cat 6A, rated to 500 MHz. Cat 6 reaches about 55 m at 10 Gb/s.' },
    { front: 'Single-mode versus multimode fiber', back: 'Single-mode has a 9 um core and laser light, for reach of many km. Multimode has a 50 um core and VCSEL light, for hundreds of metres.' },
    { front: 'Synchronous TDM versus statistical TDM', back: 'Synchronous TDM gives fixed slots, identified by position, and idle slots are wasted. Statistical TDM gives slots on demand, identified by an address.' },
    { front: 'Circuit, datagram and virtual circuit in one line each', back: 'Circuit: reserve a path, then send. Datagram: send each packet with a full address. Virtual circuit: set up a path, then send with a short label.' },
  ],
  quiz: [
    {
      id: 'ch02-q1',
      question: 'A long run of identical bits in NRZ-L produces no level transitions. What problem does this cause?',
      options: ['The bit rate doubles', 'The receiver can lose bit synchronisation', 'The signal needs twice the bandwidth', 'The transmitter must stop sending'],
      answerIndex: 1,
      explanation: 'The receiver recovers its clock from transitions. With no edges its clock drifts, and baseline wander can also shift its decision threshold.',
      difficulty: 'easy',
      topic: 'Line encoding',
    },
    {
      id: 'ch02-q2',
      question: 'What does attenuation do to a signal?',
      options: ['Adds random noise from nearby equipment', 'Shifts the signal to a higher frequency', 'Delays only the high-frequency components', 'Reduces its power as it travels along the medium'],
      answerIndex: 3,
      explanation: 'Attenuation is the loss of signal power with distance, usually stated in dB. Noise and delay distortion are separate impairments.',
      difficulty: 'easy',
      topic: 'Signals and impairments',
    },
    {
      id: 'ch02-q3',
      question: 'Which guided medium is immune to electromagnetic interference?',
      options: ['Optical fiber', 'Shielded twisted pair', 'Unshielded twisted pair', 'Coaxial cable'],
      answerIndex: 0,
      explanation: 'Fiber carries light in glass, so electrical noise does not couple into it. Shielding on copper reduces interference but does not remove it.',
      difficulty: 'easy',
      topic: 'Transmission media',
    },
    {
      id: 'ch02-q4',
      question: 'In FDM, what separates adjacent channels to prevent interference?',
      options: ['Time slots', 'Start and stop bits', 'Guard bands', 'Address headers'],
      answerIndex: 2,
      explanation: 'Guard bands are unused frequency gaps between channels. Time slots belong to TDM, and address headers belong to statistical TDM.',
      difficulty: 'easy',
      topic: 'Multiplexing',
    },
    {
      id: 'ch02-q5',
      question: 'Which switching method reserves capacity on every link for the whole duration of a call?',
      options: ['Circuit switching', 'Datagram packet switching', 'Message switching', 'Statistical multiplexing'],
      answerIndex: 0,
      explanation: 'Circuit switching reserves a channel on each link during setup and holds it until teardown, even during silence.',
      difficulty: 'easy',
      topic: 'Switching',
    },
    {
      id: 'ch02-q6',
      question: 'Which connector is normally used at the end of an 8-wire UTP Ethernet cable?',
      options: ['LC', 'BNC', 'SC', 'RJ45'],
      answerIndex: 3,
      explanation: 'RJ45, also called 8P8C, terminates 8-wire UTP. LC and SC are fiber connectors, and BNC is a coax connector.',
      difficulty: 'easy',
      topic: 'Structured cabling',
    },
    {
      id: 'ch02-q7',
      question: 'A noiseless channel has a bandwidth of 6 kHz and uses 4 signal levels. What is the maximum data rate?',
      options: ['12 kb/s', '24 kb/s', '36 kb/s', '48 kb/s'],
      answerIndex: 1,
      explanation: 'Nyquist: C = 2 x 6000 x log2(4) = 12000 x 2 = 24000 b/s.',
      difficulty: 'medium',
      topic: 'Channel capacity',
    },
    {
      id: 'ch02-q8',
      question: 'A channel has a bandwidth of 1 MHz and an SNR of 20 dB. What is its Shannon capacity?',
      options: ['3.33 Mb/s', '20 Mb/s', '6.66 Mb/s', '100 Mb/s'],
      answerIndex: 2,
      explanation: '20 dB is a ratio of 100. C = 1 MHz x log2(101) = 6.66 Mb/s. Using 20 directly as the ratio is the common mistake.',
      difficulty: 'medium',
      topic: 'Channel capacity',
    },
    {
      id: 'ch02-q9',
      question: 'What is the signal rate of 10 Mb/s Ethernet using Manchester encoding?',
      options: ['5 Mbaud', '10 Mbaud', '15 Mbaud', '20 Mbaud'],
      answerIndex: 3,
      explanation: 'Each bit has two signal elements because of the mid-bit transition, so the signal rate is 2 x 10 Mb/s = 20 Mbaud.',
      difficulty: 'medium',
      topic: 'Line encoding',
    },
    {
      id: 'ch02-q10',
      question: 'Synchronous TDM combines 4 inputs of 64 kb/s, one byte per slot, with no framing bits. What is the line rate?',
      options: ['64 kb/s', '128 kb/s', '256 kb/s', '512 kb/s'],
      answerIndex: 2,
      explanation: 'The frame rate is 64000 / 8 = 8000 frames per second. Each frame has 4 x 8 = 32 bits, so the rate is 32 x 8000 = 256 kb/s.',
      difficulty: 'medium',
      topic: 'Multiplexing',
    },
    {
      id: 'ch02-q11',
      question: 'Two buildings 8 km apart need a 10 Gb/s link. Which medium and wavelength fit best?',
      options: ['OM3 multimode at 850 nm', 'OS2 single-mode at 1310 nm', 'OM4 multimode at 850 nm', 'Cat 8 copper at 2000 MHz'],
      answerIndex: 1,
      explanation: '10GBASE-LR on OS2 at 1310 nm reaches 10 km. OM3 and OM4 reach only 300 m and 400 m at 10 Gb/s, and Cat 8 reaches 30 m.',
      difficulty: 'medium',
      topic: 'Transmission media',
    },
    {
      id: 'ch02-q12',
      question: 'What are the TIA-568 length limits for a copper horizontal permanent link and the full channel?',
      options: ['90 m permanent link and 100 m channel', '100 m permanent link and 110 m channel', '80 m permanent link and 90 m channel', '55 m permanent link and 65 m channel'],
      answerIndex: 0,
      explanation: 'The fixed run may be up to 90 m, with up to 10 m of patch cords across both ends, for a 100 m channel.',
      difficulty: 'medium',
      topic: 'Structured cabling',
    },
    {
      id: 'ch02-q13',
      question: 'A channel has a bandwidth of 1 MHz and a linear SNR of 63. Which design respects both the Shannon and Nyquist limits?',
      options: ['8 Mb/s using 16 signal levels', '4 Mb/s using 4 signal levels', '5 Mb/s using 4 signal levels', '10 Mb/s using 32 signal levels'],
      answerIndex: 1,
      explanation: 'Shannon: C = 1 MHz x log2(64) = 6 Mb/s, so 8 and 10 Mb/s are impossible. Nyquist: 4 levels give 2 x 1 MHz x 2 = 4 Mb/s, so 5 Mb/s cannot be carried on 4 levels.',
      difficulty: 'hard',
      topic: 'Channel capacity',
    },
    {
      id: 'ch02-q14',
      question: 'A 1500 byte packet crosses 3 links of 10 Mb/s by store and forward. Propagation is 1 ms per link. Ignoring queueing and processing, what is the total delay?',
      options: ['2.2 ms', '3.6 ms', '4.2 ms', '6.6 ms'],
      answerIndex: 3,
      explanation: 'Transmission time is 12000 / 10 Mb/s = 1.2 ms per link. Total delay = 3 x (1.2 + 1) = 6.6 ms, because each router must receive the whole packet before sending it on.',
      difficulty: 'hard',
      topic: 'Switching',
    },
    {
      id: 'ch02-q15',
      question: 'An optical transmitter launches 3 dBm into 40 km of fiber with a loss of 0.25 dB/km, plus 2 connectors of 0.5 dB each. What is the received power?',
      options: ['-8 dBm, about 0.16 mW', '-8 dBm, about 1.6 mW', '8 dBm, about 6.3 mW', '14 dBm, about 25 mW'],
      answerIndex: 0,
      explanation: 'Loss = 40 x 0.25 + 2 x 0.5 = 11 dB. Received power = 3 - 11 = -8 dBm, and 10^(-8/10) = 0.16 mW.',
      difficulty: 'hard',
      topic: 'Signals and impairments',
    },
  ],
  importantQuestions: [
    {
      q: 'Differentiate between bit rate and baud rate.',
      modelAnswer: 'Bit rate is the number of data bits sent per second. Baud rate is the number of signal elements sent per second.\nThey are related by R = S x log2(L), so 4 levels at 1000 baud carry 2000 b/s.',
      marks: 2,
    },
    {
      q: 'Define attenuation and state how it is measured.',
      modelAnswer: 'Attenuation is the loss of signal power as the signal travels along a medium.\nIt is measured in decibels: Loss = 10 log10(P_in / P_out), often quoted per km or per 100 m.',
      marks: 2,
    },
    {
      q: 'State the Nyquist and Shannon theorems. Find the capacity of a 3 kHz channel with an SNR of 30 dB.',
      modelAnswer: 'Nyquist: a noiseless channel of bandwidth B with L levels has C = 2B log2(L). Bandwidth limits the symbol rate to 2B.\nShannon: a noisy channel has C = B log2(1 + S/N). This is a hard ceiling, whatever the number of levels.\nCalculation: S/N = 10^(30/10) = 1000.\nC = 3000 x log2(1001) = 3000 x 9.967 = 29901 b/s, about 29.9 kb/s.\nUse Shannon for the ceiling, then Nyquist to find the levels for a chosen rate.',
      marks: 5,
    },
    {
      q: 'Encode the bits 1 0 1 1 0 using NRZ-L, NRZ-I and Manchester. Comment on clock recovery in each.',
      modelAnswer: 'NRZ-L, with 1 high and 0 low: High, Low, High, High, Low.\nNRZ-I, starting Low, with 1 flipping the level at bit start: High, High, Low, High, High.\nManchester, IEEE 802.3, with 1 low to high and 0 high to low: L-H, H-L, L-H, L-H, H-L.\nClock recovery: NRZ-L loses edges on any long run. NRZ-I loses edges only on long runs of 0s. Manchester has an edge in every bit, so it is self-clocking, at the cost of double the baud rate.',
      marks: 5,
    },
    {
      q: 'Compare circuit switching, datagram packet switching and virtual circuit switching.',
      modelAnswer: 'Circuit: setup, transfer and teardown phases. Capacity is reserved, delay is constant, idle capacity is wasted and no address is needed per unit. Example: PSTN.\nDatagram: no setup. Each packet has a full address and is routed on its own. Order is not guaranteed and delay varies, but links are used efficiently and routers can route around failures. Example: IP.\nVirtual circuit: path set up first, and packets carry a short label that is swapped per hop. Order is preserved, and capacity is shared unless reserved. Examples: ATM, Frame Relay, MPLS.',
      marks: 5,
    },
    {
      q: 'Explain FDM, synchronous TDM and statistical TDM with suitable diagrams. Calculate the line rate of a T1 carrier.',
      modelAnswer: 'FDM: each signal is modulated on its own carrier, and the bands are combined with guard bands between them. Total bandwidth = n x B_channel + (n - 1) x B_guard. The receiver splits channels with band-pass filters. All channels are sent at the same time. Examples: FM radio and DSL. WDM is the same idea for light.\nSynchronous TDM: a multiplexer scans inputs in fixed order and puts each into a fixed slot in a repeating frame. The demultiplexer identifies each input by slot position. Delay is constant, but idle slots are wasted. Line rate is at least the sum of the input rates. Examples: T1, E1 and SONET.\nStatistical TDM: a buffer feeds slots only from active inputs, and each slot carries an address. The link can be smaller than the sum of input peaks, but delay varies and the buffer can overflow. Examples: Ethernet and IP routers.\nT1 calculation: 24 channels x 8 bits + 1 framing bit = 193 bits per frame.\nLine rate = 193 x 8000 frames per second = 1.544 Mb/s.\nDiagrams: show sources, mux, shared link and demux for each, with frequency bands for FDM and slot sequences for the two TDM types.',
      marks: 10,
    },
    {
      q: 'Discuss guided and unguided transmission media. Propose a structured cabling design for a 3-floor office building with a link to an ISP.',
      modelAnswer: 'Guided media:\nTwisted pair: twisting and differential signalling reduce noise. Cat 5e handles 1 Gb/s at 100 m, Cat 6 handles 1 Gb/s at 100 m and 10 Gb/s to about 55 m, and Cat 6A handles 10 Gb/s at 100 m.\nCoax: 75 ohm is used for cable TV and DOCSIS.\nFiber: light is held by total internal reflection. Multimode OM4 reaches 400 m at 10 Gb/s. Single-mode OS2 reaches 10 km with LR optics, and it is immune to EMI.\nUnguided media: radio waves are omnidirectional and pass through walls. Microwaves are directional, and are used by Wi-Fi, cellular and satellite. Infrared is blocked by walls. All wireless capacity is shared, and it suffers from free-space loss and multipath.\nDesign:\n1. Entrance facility: ISP fiber handoff at the demarcation point.\n2. Equipment room on the ground floor: router, firewall and core switch.\n3. Backbone: OM4 or OS2 fiber riser to an IDF on each floor.\n4. Telecom rooms: access switch with PoE, and fiber and copper patch panels.\n5. Horizontal: Cat 6A in a star layout, permanent link up to 90 m.\n6. Work area: RJ45 outlets and patch cords, 100 m channel in total, plus ceiling outlets for Wi-Fi access points.\nLabel both ends of every cable, and certify each link with a cable analyzer.',
      marks: 10,
    },
  ],
  numericals: [
    {
      question: 'A noiseless channel has a bandwidth of 4 kHz. (a) Find the maximum data rate with 8 signal levels. (b) How many levels are needed to carry 48 kb/s?',
      steps: [
        'Nyquist formula: C = 2B log2(L).',
        '(a) C = 2 x 4000 x log2(8) = 8000 x 3 = 24000 b/s.',
        '(b) 48000 = 8000 x log2(L), so log2(L) = 6.',
        'L = 2^6 = 64 levels.',
      ],
      answer: '(a) 24 kb/s. (b) 64 levels.',
    },
    {
      question: 'A telephone line has a bandwidth of 3000 Hz and an SNR of 30 dB. Find its Shannon capacity.',
      steps: [
        'Convert SNR: S/N = 10^(30/10) = 1000.',
        'C = B log2(1 + S/N) = 3000 x log2(1001).',
        'log2(1001) = log10(1001) / log10(2) = 3.0004 / 0.30103 = 9.967.',
        'C = 3000 x 9.967 = 29901 b/s.',
      ],
      answer: 'About 29.9 kb/s',
    },
    {
      question: 'A channel has a bandwidth of 1 MHz and a linear S/N of 63. Find the upper limit on data rate. If a designer chooses 4 Mb/s, how many signal levels are needed?',
      steps: [
        'Shannon: C = 1000000 x log2(1 + 63) = 1000000 x log2(64) = 6 Mb/s.',
        'The chosen rate of 4 Mb/s is below this ceiling, so it is achievable.',
        'Nyquist: 4000000 = 2 x 1000000 x log2(L), so log2(L) = 2.',
        'L = 2^2 = 4 levels.',
      ],
      answer: 'Upper limit 6 Mb/s. 4 signal levels for 4 Mb/s.',
    },
    {
      question: 'A 10 mW signal enters a 5 km cable that loses 3 dB per km, then passes through an amplifier with 10 dB of gain. Find the output power in dBm and in mW.',
      steps: [
        'Input level = 10 log10(10 mW / 1 mW) = 10 dBm.',
        'Cable loss = 5 x 3 = 15 dB.',
        'Net change = -15 + 10 = -5 dB.',
        'Output level = 10 - 5 = 5 dBm.',
        'Output power = 10^(5/10) = 3.16 mW.',
      ],
      answer: '5 dBm, about 3.16 mW',
    },
    {
      question: 'A T1 carrier multiplexes 24 voice channels with synchronous TDM. Each channel sends 8 bits per frame, each frame has 1 framing bit, and there are 8000 frames per second. Find the frame size, line rate, framing overhead, frame time and efficiency.',
      steps: [
        'Frame size = 24 x 8 + 1 = 193 bits.',
        'Line rate = 193 x 8000 = 1544000 b/s = 1.544 Mb/s.',
        'Framing overhead = 1 x 8000 = 8000 b/s = 8 kb/s.',
        'Frame time = 1 / 8000 = 125 microseconds.',
        'Payload rate = 192 x 8000 = 1.536 Mb/s, so efficiency = 1.536 / 1.544 = 0.9948.',
      ],
      answer: '193 bits, 1.544 Mb/s, 8 kb/s overhead, 125 microseconds, about 99.5 percent efficiency',
    },
  ],
  keyTerms: [
    'Bandwidth: Range of frequencies a channel passes, in hertz, equal to fmax minus fmin',
    'Bit rate: Number of data bits sent per second',
    'Baud rate: Number of signal elements sent per second, also called symbol rate',
    'Attenuation: Loss of signal power along a medium, usually stated in dB',
    'Distortion: Change in signal shape because frequency components travel at different speeds',
    'Thermal noise: Random noise from electron motion in conductors, always present',
    'Crosstalk: Unwanted coupling of a signal from one wire pair into a neighbouring pair',
    'SNR: Ratio of signal power to noise power, often stated in dB',
    'Repeater: Device that detects symbols and regenerates a clean, retimed signal',
    'Nyquist limit: Maximum bit rate of a noiseless channel, C = 2B log2(L)',
    'Shannon capacity: Maximum error-free rate of a noisy channel, C = B log2(1 + S/N)',
    'Line coding: Mapping of bits to voltage or light levels on the medium',
    'Manchester encoding: Line code with a transition in the middle of every bit period',
    'Multiplexing: Sharing of one physical link among several signals or flows',
    'Guard band: Unused frequency gap separating adjacent FDM channels',
    'Statistical TDM: TDM that gives slots on demand and tags each slot with an address',
    'Store and forward: A router receives the whole packet before sending it onward',
    'Virtual circuit: Path set up in advance, with packets carrying a short label',
    'Permanent link: Fixed horizontal cable of at most 90 m from patch panel to outlet',
    'Auto-MDIX: Port feature that detects the wiring and swaps transmit and receive pairs',
  ],
  formulas: [
    { name: 'Bandwidth', expression: 'B = fmax - fmin', note: 'In hertz.' },
    { name: 'Bit rate from baud rate', expression: 'R = S x log2(L)', note: 'S is signal elements per second and L is the number of levels.' },
    { name: 'Nyquist limit', expression: 'C = 2B log2(L)', note: 'Noiseless channel.' },
    { name: 'Shannon capacity', expression: 'C = B log2(1 + S/N)', note: 'S/N is a linear power ratio, not dB.' },
    { name: 'SNR in decibels', expression: 'SNR_dB = 10 log10(S/N)', note: 'Inverse: S/N = 10^(SNR_dB / 10).' },
    { name: 'Attenuation in decibels', expression: 'Loss_dB = 10 log10(P_in / P_out)', note: 'For voltages, use 20 log10(V_in / V_out).' },
    { name: 'Absolute power', expression: 'P_dBm = 10 log10(P_mW / 1 mW)', note: '0 dBm = 1 mW and 30 dBm = 1 W.' },
    { name: 'Manchester signal rate', expression: 'Baud = 2 x R', note: '10 Mb/s needs 20 Mbaud.' },
    { name: 'FDM total bandwidth', expression: 'B_total = n x B_channel + (n - 1) x B_guard' },
    { name: 'TDM line rate', expression: 'R_line = frames per second x bits per frame', note: 'Bits per frame include framing bits.' },
    { name: 'Propagation delay', expression: 'Tp = d / v', note: 'v is about 2 x 10^8 m/s in copper and fiber.' },
    { name: 'Transmission delay', expression: 'Tt = L / R', note: 'L is packet size in bits and R is link rate in b/s.' },
    { name: 'Circuit switched delay', expression: 'T = Tsetup + L/R + hops x Tp', note: 'L is the entire message size.' },
    { name: 'Store and forward delay, P packets', expression: 'T = (P + hops - 1) x (L/R) + hops x Tp', note: 'L is the packet size. Queueing and processing are ignored.' },
  ],
  handsOnChecklist: [
    'Find the link speed, duplex and media type of your wired adapter with ethtool on Linux or Get-NetAdapter on Windows.',
    'Record Wi-Fi signal and link rate at three distances from the access point using netsh wlan show interfaces or iw dev wlan0 link.',
    'Draw NRZ-L, NRZ-I and Manchester waveforms by hand for the bits 11110000 and count the transitions in each.',
    'Calculate the Shannon ceiling for your own Wi-Fi channel, using its channel width and an SNR estimated from signal minus noise floor.',
    'Build a small network in Cisco Packet Tracer and test straight-through and crossover cables between PCs and a switch.',
    'Run tracert or traceroute to a distant site and estimate fiber distance from the largest jump in delay, at 200 km per ms one way.',
  ],
};

export default chapter;

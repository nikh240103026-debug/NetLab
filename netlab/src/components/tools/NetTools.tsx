'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Tabs from '@/components/ui/Tabs';
import { Card, HeaderBand } from '@/components/ui/primitives';
import {
  computeCrc,
  formatBits,
  formatPercent,
  formatRate,
  formatTime,
  ipDetails,
  linkMetrics,
  parseBinaryIPv4,
  parseIPv4,
  splitSubnets,
  subnetInfo,
} from '@/lib/netmath';

const TOOLS = [
  { id: 'subnet', label: 'Subnet and CIDR' },
  { id: 'ip', label: 'IP and binary' },
  { id: 'crc', label: 'CRC' },
  { id: 'delay', label: 'Bandwidth and delay' },
];

function Field({
  label,
  value,
  onChange,
  hint,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  type?: string;
}) {
  return (
    <label className="block min-w-0 text-sm">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="mt-1 h-10 w-full rounded border border-line bg-surface px-3 font-mono text-sm"
      />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function Output({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-line rounded border border-line">
      {rows.map(([name, value]) => (
        <div key={name} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-3 py-2 text-sm">
          <dt className="text-muted">{name}</dt>
          <dd className="break-all font-mono text-[13px]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Formula({ children }: { children: ReactNode }) {
  return (
    <aside className="rounded-r border-l-2 border-accent bg-accent-soft px-4 py-3 text-sm">
      <p className="font-mono text-[11px] font-semibold tracking-wider text-accent">FORMULA USED</p>
      <div className="mt-1 leading-6">{children}</div>
    </aside>
  );
}

function Worked({ children }: { children: ReactNode }) {
  return (
    <aside className="rounded-r border-l-2 border-success bg-success-soft px-4 py-3 text-sm">
      <p className="font-mono text-[11px] font-semibold tracking-wider text-success-ink">WORKED EXAMPLE (PREFILLED)</p>
      <div className="mt-1 leading-6">{children}</div>
    </aside>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded border border-danger bg-danger-soft px-3 py-2 text-sm text-danger-ink">
      {message}
    </p>
  );
}

function SubnetTool() {
  const [ip, setIp] = useState('192.168.10.0');
  const [prefix, setPrefix] = useState('24');
  const [parts, setParts] = useState('4');
  const prefixNum = Number(prefix.replace('/', ''));
  const info = useMemo(() => subnetInfo(ip, prefixNum), [ip, prefixNum]);
  const split = useMemo(() => splitSubnets(ip, prefixNum, Number(parts)), [ip, prefixNum, parts]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="IPv4 address" value={ip} onChange={setIp} />
        <Field label="Prefix length" value={prefix} onChange={setPrefix} hint="0 to 32" />
        <Field label="Split into N subnets" value={parts} onChange={setParts} hint="Rounded up to a power of 2" />
      </div>
      {!info ? (
        <ErrorBox message="Enter a valid IPv4 address and a prefix from 0 to 32." />
      ) : (
        <>
          <Output
            rows={[
              ['Network', `${info.network}/${info.prefix}`],
              ['Broadcast', info.broadcast],
              ['First host', info.firstHost],
              ['Last host', info.lastHost],
              ['Subnet mask', info.mask],
              ['Wildcard mask', info.wildcard],
              ['Total addresses', info.totalAddresses.toLocaleString('en-US')],
              ['Usable hosts', info.usableHosts.toLocaleString('en-US')],
            ]}
          />
          <div className="overflow-x-auto rounded border border-line p-3">
            <p className="mono-label mb-2">Binary view</p>
            <pre className="font-mono text-xs leading-6">
              {`Address    ${info.binary.ip}\nMask       ${info.binary.mask}\nNetwork    ${info.binary.network}\nBroadcast  ${info.binary.broadcast}`}
            </pre>
          </div>
          {split.ok ? (
            <div>
              <p className="mb-2 text-sm font-medium">
                {split.count} subnets of /{split.newPrefix}, each with {split.hostsEach.toLocaleString('en-US')} usable hosts
                {split.count !== split.requested && ` (${split.requested} rounded up to ${split.count})`}
              </p>
              <div className="overflow-x-auto rounded border border-line">
                <table className="w-full border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-accent-soft text-left">
                      {['#', 'Network', 'First host', 'Last host', 'Broadcast'].map((h) => (
                        <th key={h} scope="col" className="px-3 py-2 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {split.rows.map((r) => (
                      <tr key={r.index} className="border-t border-line">
                        <td className="px-3 py-1.5">{r.index}</td>
                        <td className="px-3 py-1.5">{r.network}</td>
                        <td className="px-3 py-1.5">{r.firstHost}</td>
                        <td className="px-3 py-1.5">{r.lastHost}</td>
                        <td className="px-3 py-1.5">{r.broadcast}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {split.truncated && <p className="mt-1 text-xs text-muted">Showing the first {split.rows.length} subnets.</p>}
            </div>
          ) : (
            <ErrorBox message={split.error} />
          )}
        </>
      )}
      <Formula>
        Network = IP AND mask. Broadcast = network OR wildcard. Usable hosts = 2^(32 - prefix) - 2. New prefix = prefix +
        ceil(log2 N).
      </Formula>
      <Worked>
        192.168.10.0/24 split into 4: borrow 2 bits, so the new prefix is /26 and the block size is 64. The subnets start at
        .0, .64, .128 and .192, each with 62 usable hosts.
      </Worked>
    </div>
  );
}

function IpTool() {
  const [dotted, setDotted] = useState('172.16.5.130');
  const [binary, setBinary] = useState('11000000.10101000.00000001.00000001');
  const fromDotted = useMemo(() => {
    const n = parseIPv4(dotted);
    return n === null ? null : ipDetails(n);
  }, [dotted]);
  const fromBinary = useMemo(() => {
    const n = parseBinaryIPv4(binary);
    return n === null ? null : ipDetails(n);
  }, [binary]);

  const rows = (d: NonNullable<typeof fromDotted>): [string, ReactNode][] => [
    ['Dotted decimal', d.dotted],
    ['Binary', d.binary],
    ['Decimal', d.decimal.toLocaleString('en-US')],
    ['Hexadecimal', d.hex],
    ['Class', d.ipClass],
    ['Default mask', d.defaultMask],
    ['Scope', d.scope],
    ['Private or public', d.isPrivate ? 'Private' : 'Not private'],
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <Field label="Dotted decimal to binary" value={dotted} onChange={setDotted} />
          {fromDotted ? <Output rows={rows(fromDotted)} /> : <ErrorBox message="Enter a valid IPv4 address." />}
        </div>
        <div className="space-y-3">
          <Field label="Binary to dotted decimal" value={binary} onChange={setBinary} hint="32 bits, dots optional" />
          {fromBinary ? <Output rows={rows(fromBinary)} /> : <ErrorBox message="Enter exactly 32 bits of 0 and 1." />}
        </div>
      </div>
      <Formula>
        Each octet = sum of bit x 2^position. Class by first octet: A 1 to 126, B 128 to 191, C 192 to 223, D 224 to 239, E 240
        to 255. Private: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16.
      </Formula>
      <Worked>
        172.16.5.130: 130 = 128 + 2 = 10000010. The first octet 172 makes it class B, and 172.16.0.0/12 makes it private, so it
        must pass through NAT to reach the internet.
      </Worked>
    </div>
  );
}

function CrcTool() {
  const [data, setData] = useState('1101011011');
  const [generator, setGenerator] = useState('10011');
  const result = useMemo(() => computeCrc(data, generator), [data, generator]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Data bits" value={data} onChange={setData} />
        <Field label="Generator" value={generator} onChange={setGenerator} hint="Bits (10011) or polynomial (x^4+x+1)" />
      </div>
      {'error' in result ? (
        <ErrorBox message={result.error} />
      ) : (
        <>
          <Output
            rows={[
              ['Generator bits', result.generator],
              ['CRC width r', result.degree],
              ['Data with r zeros', result.augmented],
              ['Quotient', result.quotient],
              ['CRC remainder', result.remainder],
              ['Transmitted frame', result.frame],
              ['Receiver remainder', `${result.receiverRemainder} (all zeros means no error detected)`],
            ]}
          />
          <div className="overflow-x-auto rounded border border-line p-3">
            <p className="mono-label mb-2">Long division steps (XOR)</p>
            <pre className="font-mono text-xs leading-5">
              {result.augmented}
              {'\n'}
              {result.steps
                .map((s) => {
                  const pad = ' '.repeat(s.position);
                  return `${pad}${s.divisor}   step at bit ${s.position}\n${pad}${s.after}`;
                })
                .join('\n')}
            </pre>
          </div>
        </>
      )}
      <Formula>
        Append r zeros, where r is the generator degree. Divide using XOR without borrows. Frame = data followed by the r bit
        remainder. The receiver divides the frame again and expects a zero remainder.
      </Formula>
      <Worked>
        Data 1101011011 with generator x^4 + x + 1 (10011): r = 4, the remainder is 1110, and the transmitted frame is
        11010110111110.
      </Worked>
    </div>
  );
}

function DelayTool() {
  const [frameBytes, setFrameBytes] = useState('1500');
  const [bandwidth, setBandwidth] = useState('100');
  const [distance, setDistance] = useState('2000');
  const [speed, setSpeed] = useState('200000000');
  const [windowSize, setWindowSize] = useState('7');
  const result = useMemo(
    () =>
      linkMetrics({
        frameBytes: Number(frameBytes),
        bandwidthMbps: Number(bandwidth),
        distanceKm: Number(distance),
        speedMps: Number(speed),
        windowSize: Number(windowSize),
      }),
    [frameBytes, bandwidth, distance, speed, windowSize],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Frame size (bytes)" value={frameBytes} onChange={setFrameBytes} />
        <Field label="Bandwidth (Mbps)" value={bandwidth} onChange={setBandwidth} />
        <Field label="Distance (km)" value={distance} onChange={setDistance} />
        <Field label="Signal speed (m/s)" value={speed} onChange={setSpeed} hint="About 2e8 in copper or fiber" />
        <Field label="Window size N" value={windowSize} onChange={setWindowSize} />
      </div>
      {!result ? (
        <ErrorBox message="All values must be positive numbers." />
      ) : (
        <Output
          rows={[
            ['Transmission delay Tt', formatTime(result.transmission)],
            ['Propagation delay Tp', formatTime(result.propagation)],
            ['Total one-way delay', formatTime(result.totalDelay)],
            ['Round trip time', formatTime(result.rtt)],
            ['Bandwidth-delay product (one way)', formatBits(result.bdpBits)],
            ['Bandwidth-delay product (RTT)', formatBits(result.bdpRttBits)],
            ['a = Tp / Tt', Number(result.a.toPrecision(5))],
            ['Stop-and-wait utilization', formatPercent(result.stopWaitUtil)],
            ['Stop-and-wait throughput', formatRate(result.stopWaitThroughput)],
            ['Sliding window utilization', formatPercent(result.slidingUtil)],
            ['Sliding window throughput', formatRate(result.slidingThroughput)],
            ['Window for full utilization', `N >= ${result.windowForFullUtil}`],
          ]}
        />
      )}
      <Formula>
        Tt = L / B. Tp = d / v. Total = Tt + Tp, ignoring queuing and processing. BDP = B x Tp. Stop-and-wait U = 1 / (1 + 2a).
        Sliding window U = min(1, N / (1 + 2a)). ACK transmission time is ignored.
      </Formula>
      <Worked>
        1500 byte frame, 100 Mbps, 2000 km: Tt = 12000 / 100e6 = 120 µs, Tp = 2e6 / 2e8 = 10 ms, a = 83.33. Stop-and-wait uses
        only about 0.6 percent of the link, and N = 7 only about 4.2 percent, which is why long links need large windows.
      </Worked>
    </div>
  );
}

export default function NetTools() {
  const [tool, setTool] = useState('subnet');
  return (
    <div>
      <HeaderBand
        label="CALCULATORS / RUNS IN YOUR BROWSER"
        title="Network tools"
        subtitle="Calculators for the numericals you will meet in exams and on the job."
      />
      <Tabs items={TOOLS} value={tool} onChange={setTool} label="Calculators" className="mt-4" />
      <Card className="mt-5 p-4 md:p-5">
        {tool === 'subnet' && <SubnetTool />}
        {tool === 'ip' && <IpTool />}
        {tool === 'crc' && <CrcTool />}
        {tool === 'delay' && <DelayTool />}
      </Card>
    </div>
  );
}

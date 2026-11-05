import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { C, F } from '../../theme';
import { MathView } from './Math';
import { texToSvg } from './tex';

/**
 * Lightweight markup used by all lesson content:
 *  - paragraphs separated by a blank line, "\n" = line break
 *  - $...$ inline TeX, $$...$$ display TeX (own line)
 *  - **bold**, ==highlight==
 *  - lines starting with "• " or "- " become bullets
 */
type Seg =
  | { t: 'text'; s: string; bold?: boolean; hl?: boolean }
  | { t: 'math'; s: string }
  | { t: 'dmath'; s: string };

function parseInline(src: string): Seg[] {
  const out: Seg[] = [];
  let i = 0;
  let buf = '';
  let bold = false;
  let hl = false;
  const flush = () => {
    if (buf) out.push({ t: 'text', s: buf, bold, hl });
    buf = '';
  };
  while (i < src.length) {
    const ch = src[i];
    if (ch === '\\' && src[i + 1] === '$') {
      buf += '$';
      i += 2;
      continue;
    }
    if (ch === '$') {
      const isDisplay = src[i + 1] === '$';
      const close = isDisplay ? src.indexOf('$$', i + 2) : src.indexOf('$', i + 1);
      if (close > i) {
        flush();
        const tex = src.slice(i + (isDisplay ? 2 : 1), close);
        out.push({ t: isDisplay ? 'dmath' : 'math', s: tex });
        i = close + (isDisplay ? 2 : 1);
        continue;
      }
    }
    if (ch === '*' && src[i + 1] === '*') {
      flush();
      bold = !bold;
      i += 2;
      continue;
    }
    if (ch === '=' && src[i + 1] === '=') {
      flush();
      hl = !hl;
      i += 2;
      continue;
    }
    buf += ch;
    i++;
  }
  flush();
  return out;
}

type Props = {
  children: string;
  size?: number;
  color?: string;
  align?: 'left' | 'center';
  hlColor?: string;
  style?: any;
  maxWidth?: number;
};

export const RichText = memo(function RichText({ children, size = 17, color = C.text, align = 'left', hlColor = C.gold, style, maxWidth }: Props) {
  const { width } = useWindowDimensions();
  const avail = maxWidth ?? width - 48;
  const paragraphs = useMemo(() => (children || '').split(/\n\s*\n/), [children]);
  return (
    <View style={style}>
      {paragraphs.map((p, pi) => (
        <View key={pi} style={{ marginBottom: pi < paragraphs.length - 1 ? size * 0.7 : 0 }}>
          {p.split('\n').map((line, li) => (
            <Line key={li} line={line} size={size} color={color} align={align} hlColor={hlColor} avail={avail} />
          ))}
        </View>
      ))}
    </View>
  );
});

function Line({ line, size, color, align, hlColor, avail }: { line: string; size: number; color: string; align: 'left' | 'center'; hlColor: string; avail: number }) {
  let bullet = false;
  let content = line;
  if (/^\s*(•|-)\s+/.test(line)) {
    bullet = true;
    content = line.replace(/^\s*(•|-)\s+/, '');
  }
  const segs = useMemo(() => parseInline(content), [content]);
  const rows: React.ReactNode[] = [];
  let current: React.ReactNode[] = [];
  let k = 0;
  const pushRow = () => {
    if (current.length) {
      rows.push(
        <View key={'r' + k++} style={[styles.row, { justifyContent: align === 'center' ? 'center' : 'flex-start' }]}>
          {current}
        </View>,
      );
    }
    current = [];
  };
  const textStyle = { fontSize: size, lineHeight: size * 1.45, color, fontFamily: F.semibold };
  segs.forEach((sg, si) => {
    if (sg.t === 'dmath') {
      pushRow();
      // shrink display math if too wide
      const t = texToSvg(sg.s, true);
      const natural = t.wEx * size * 1.15 * 0.5;
      const dsize = natural > avail ? (size * 1.15 * avail) / natural : size * 1.15;
      rows.push(
        <View key={'d' + k++} style={{ alignItems: 'center', marginVertical: size * 0.45 }}>
          <MathView tex={sg.s} size={dsize} color={color} display />
        </View>,
      );
    } else if (sg.t === 'math') {
      const t = texToSvg(sg.s, false);
      const natural = t.wEx * size * 0.5;
      const msize = natural > avail ? (size * avail) / natural : size;
      current.push(<MathView key={'m' + si} tex={sg.s} size={msize} color={color} />);
    } else {
      const parts = sg.s.split(/(\s+)/);
      parts.forEach((w, wi) => {
        if (!w) return;
        const st: any[] = [textStyle];
        if (sg.bold) st.push({ fontFamily: F.heavy });
        if (sg.hl) st.push({ color: hlColor, fontFamily: F.heavy });
        if (/^\s+$/.test(w)) {
          current.push(
            <Text key={`s${si}-${wi}`} style={st}>
              {' '}
            </Text>,
          );
        } else {
          current.push(
            <Text key={`w${si}-${wi}`} style={st}>
              {w}
            </Text>,
          );
        }
      });
    }
  });
  pushRow();
  if (bullet) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginVertical: 2 }}>
        <Text style={[textStyle, { color: C.primary, marginRight: 8, fontFamily: F.black }]}>•</Text>
        <View style={{ flex: 1 }}>{rows}</View>
      </View>
    );
  }
  return <View>{rows}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
});

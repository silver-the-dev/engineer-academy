import React from 'react';
import { Text, View } from 'react-native';
import { C, F, alpha } from '../../theme';
import type { Card } from '../../content/types';
import { RichText } from '../math/RichText';
import { DisplayMath } from '../math/Math';
import { Visual } from '../visuals/registry';

export function CardView({ card, width, color }: { card: Card; width: number; color: string }) {
  return (
    <View>
      {card.title ? <Text style={{ color, fontFamily: F.black, fontSize: 24, marginBottom: 12 }}>{card.title}</Text> : null}
      <RichText size={17}>{card.body}</RichText>
      {card.formula ? (
        <View style={{ marginTop: 14, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 16, backgroundColor: alpha(color, 0.12), borderWidth: 2, borderColor: alpha(color, 0.45) }}>
          <DisplayMath tex={card.formula} size={21} />
        </View>
      ) : null}
      {card.visual ? (
        <View style={{ marginTop: 16 }}>
          <Visual spec={card.visual} width={width} />
        </View>
      ) : null}
      {card.example ? (
        <View style={{ marginTop: 16, padding: 14, borderRadius: 16, backgroundColor: C.surface, borderLeftWidth: 5, borderLeftColor: C.cyan }}>
          <Text style={{ color: C.cyan, fontFamily: F.black, fontSize: 13, letterSpacing: 1, marginBottom: 6 }}>EXEMPLO RESOLVIDO</Text>
          <RichText size={16}>{card.example}</RichText>
        </View>
      ) : null}
      {card.tip ? (
        <View style={{ marginTop: 16, padding: 14, borderRadius: 16, backgroundColor: alpha(C.gold, 0.1), borderWidth: 1.5, borderColor: alpha(C.gold, 0.4) }}>
          <Text style={{ color: C.gold, fontFamily: F.black, fontSize: 13, letterSpacing: 1, marginBottom: 6 }}>💡 DICA</Text>
          <RichText size={15.5}>{card.tip}</RichText>
        </View>
      ) : null}
    </View>
  );
}

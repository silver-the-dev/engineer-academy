import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcqS, num, tf, fill, match, order, inter, plot, rmcq, table } from '../../helpers';
import { FnCurve, Pt, RectW, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt } from '../../../lib/random';

const t = String.raw;
const money = (x: number) => fmt(Math.round(x * 100) / 100, 2);
const pmt = (PV: number, i: number, n: number) => (PV * i) / (1 - (1 + i) ** -n);

/* ---------------- labs ---------------- */

/** Growth factor of simple (line) vs compound (exponential) interest. */
const jurosLab = () =>
  plot({
    view: { xMin: 0, xMax: 20, yMin: 0, yMax: 7 },
    params: [
      { key: 'i', label: 'i', min: 1, max: 10, step: 0.5, value: 8, color: C.gold, format: (v: number) => fmt(v, 1) + '% a.p.' },
      { key: 't', label: 't', min: 0, max: 20, step: 0.25, value: 10, color: C.p2, format: (v: number) => fmt(v, 2) + ' períodos' },
      { key: 'C', label: 'C', min: 100, max: 5000, step: 100, value: 1000, color: C.p4, format: (v: number) => 'R$ ' + v },
    ],
    render: ({ p }: any) => {
      const i = p.i / 100;
      return (
        <>
          <FnCurve f={(x) => 1 + i * x} color={C.p2} />
          <FnCurve f={(x) => (1 + i) ** x} color={C.p5} />
          <Seg x1={p.t} y1={0} x2={p.t} y2={Math.max(1 + i * p.t, (1 + i) ** p.t)} color={C.textDim} dash="4 4" />
          <Pt x={p.t} y={1 + i * p.t} color={C.p2} r={5} />
          <Pt x={p.t} y={(1 + i) ** p.t} color={C.p5} r={5} />
        </>
      );
    },
    info: ({ p }: any) => {
      const i = p.i / 100;
      return t`simples (azul): R\$ $${money(p.C * (1 + i * p.t))}$ · compostos (rosa): R\$ $${money(p.C * (1 + i) ** p.t)}$ · eixo vertical = fator $M/C$`;
    },
  });

/** Amortization schedule as stacked bars: amortization (bottom) + interest (top). */
const amortLab = () =>
  plot({
    view: { xMin: 0, xMax: 13, yMin: 0, yMax: 420 },
    tickLabels: false,
    params: [
      { key: 'm', label: 'sistema', min: 0, max: 1, step: 1, value: 0, color: C.gold, format: (v: number) => (v ? 'SAC' : 'Price') },
      { key: 'n', label: 'n', min: 3, max: 12, step: 1, value: 6, color: C.p2, format: (v: number) => String(v) + ' parcelas' },
      { key: 'i', label: 'i', min: 1, max: 6, step: 0.5, value: 4, color: C.p5, format: (v: number) => fmt(v, 1) + '% a.m.' },
    ],
    render: ({ p }: any) => {
      const n = Math.round(p.n), i = p.i / 100, PV = 1000;
      let saldo = PV;
      const P = pmt(PV, i, n);
      const bars: React.ReactNode[] = [];
      for (let k = 1; k <= n; k++) {
        const J = saldo * i;
        const A = p.m ? PV / n : P - J;
        bars.push(<RectW key={'a' + k} x={k - 0.4} y={0} w={0.8} h={A} color={C.p2} opacity={0.7} />);
        bars.push(<RectW key={'j' + k} x={k - 0.4} y={A} w={0.8} h={J} color={C.p3} opacity={0.8} />);
        saldo -= A;
      }
      return <>{bars}</>;
    },
    info: ({ p }: any) => {
      const n = Math.round(p.n), i = p.i / 100, PV = 1000;
      let saldo = PV, totJ = 0;
      const P = pmt(PV, i, n);
      for (let k = 1; k <= n; k++) {
        const J = saldo * i;
        totJ += J;
        saldo -= p.m ? PV / n : P - J;
      }
      return p.m
        ? t`SAC de R\$ $1000$: amortização fixa $${money(PV / n)}$ (azul), juros decrescentes (laranja) · total de juros R\$ $${money(totJ)}$`
        : t`Price de R\$ $1000$: parcela fixa R\$ $${money(P)}$ · juros caem e amortização sobe · total de juros R\$ $${money(totJ)}$`;
    },
  });

/* ---------------- unit ---------------- */

export const financeira: UnitDef = {
  id: 'f-fin',
  title: 'Matemática financeira',
  subtitle: 'Juros simples e compostos, taxas, descontos e financiamentos',
  icon: '💰',
  guide: t`Juros simples crescem em **linha reta**: $M=C(1+it)$. Compostos crescem **exponencialmente**: $M=C(1+i)^t$, e o prazo sai com logaritmo. Taxas compostas equivalentes: $(1+i_a)=(1+i_m)^{12}$; taxa real: $(1+i_{ap})=(1+i_r)(1+\text{inflação})$. Para comparar valores em datas diferentes, leve tudo para a mesma data dividindo/multiplicando por $(1+i)^n$. Financiamento Price: parcela fixa $PMT=PV\frac{i}{1-(1+i)^{-n}}$; SAC: amortização fixa $PV/n$ e parcelas decrescentes.`,
  lessons: [
    {
      id: 'f-fin-juros',
      title: 'Juros simples e compostos',
      parts: [
        {
          card: [
            {
              title: 'Capital, taxa, prazo e montante',
              body: t`Você empresta (ou aplica) um **capital** $C$ a uma **taxa** $i$ por período, durante $t$ períodos, e recebe o **montante** $M=C+J$.

• **Juros simples**: os juros de cada período incidem só sobre o capital inicial: $J=C\,i\,t$ e $M=C(1+it)$.
• **Juros compostos**: os juros de cada período entram no saldo e passam a render (juros sobre juros): $M=C(1+i)^t$.

Taxa e prazo precisam estar na **mesma unidade** (ao mês com meses, ao ano com anos).`,
              visual: jurosLab(),
              tip: 'Para t < 1 período, os simples rendem mais; em t = 1 empatam; depois disso, os compostos disparam.',
            },
          ],
          exercises: [
            gen((rng) => {
              const Cc = 100 * randInt(rng, 5, 50), i = randInt(rng, 1, 5), tt = randInt(rng, 2, 12);
              return num(t`Juros simples: capital R\$ $${Cc}$, taxa $${i}\%$ a.m., $${tt}$ meses. Quanto rende de juros?`, (Cc * i * tt) / 100, t`$J=Cit=${Cc}\cdot${fmt(i / 100)}\cdot${tt}=${money((Cc * i * tt) / 100)}$.`, { tol: 0.01, unit: 'R$' });
            }),
            gen((rng) => {
              const Cc = 100 * randInt(rng, 5, 50), i = randInt(rng, 1, 3), tt = randInt(rng, 2, 6);
              const M = Cc * (1 + i / 100) ** tt;
              return num(t`Juros compostos: R\$ $${Cc}$ a $${i}\%$ a.m. por $${tt}$ meses. Qual o montante? (centavos)`, M, t`$M=${Cc}\cdot${fmt(1 + i / 100)}^{${tt}}\approx${money(M)}$.`, { tol: 0.01, unit: 'R$' });
            }),
            inter('Escolha uma taxa e um prazo em que os juros SIMPLES rendem mais que os compostos.', 'plot', jurosLab().props, (v) => v.p.t > 0 && v.p.t < 1, 'qualquer prazo entre 0 e 1 período', t`Para $0<t<1$, $(1+i)^t<1+it$: a curva exponencial fica abaixo da reta.`),
            gen((rng) => {
              const Cc = 100 * randInt(rng, 10, 80), M = Cc + 10 * randInt(rng, 5, 60), tt = randInt(rng, 2, 10);
              const i = ((M - Cc) / (Cc * tt)) * 100;
              return num(t`Um capital de R\$ $${Cc}$ virou R\$ $${M}$ em $${tt}$ meses a juros simples. Qual a taxa mensal (em %, 2 casas)?`, i, t`$J=${M - Cc}=${Cc}\cdot i\cdot${tt}\Rightarrow i=${fmt(i, 2)}\%$.`, { tol: 0.01 });
            }),
            tf('A juros compostos, dobrar o prazo dobra o montante.', false, 'Dobrar o prazo eleva o fator ao quadrado: (1 + i)^(2t) = [(1 + i)^t]².'),
            gen((rng) => {
              const i = pick(rng, [2, 3, 4, 6, 8, 9, 12]);
              return num(`Regra do 72: com juros compostos de ${i}% ao ano, em quantos anos o capital dobra, aproximadamente?`, 72 / i, `72/${i} = ${fmt(72 / i, 1)} anos (o exato é ln 2/ln(1 + i) ≈ ${fmt(Math.log(2) / Math.log(1 + i / 100), 1)}).`, { tol: 0.05 });
            }),
            match('Associe a fórmula ao regime.', [[t`$M=C(1+it)$`, 'simples (cresce em reta)'], [t`$M=C(1+i)^t$`, 'compostos (exponencial)'], [t`$J=Cit$`, 'juros simples'], [t`$M=Ce^{rt}$`, 'capitalização contínua']], 'A contínua é o limite da composta com períodos cada vez menores.'),
            mcqS('R\\$ 1000 aplicados a 10% a.a. por 2 anos rendem quanto a mais nos compostos do que nos simples?', 'R\\$ 10', ['R\\$ 0', 'R\\$ 100', 'R\\$ 21'], 'Simples: 1200. Compostos: 1000·1,21 = 1210. Diferença: os juros do 2º ano sobre os 100 do 1º ano (10).'),
          ],
        },
        {
          card: {
            title: 'Descobrindo o prazo com logaritmos',
            body: t`Em $M=C(1+i)^t$, o prazo está no expoente. Tire o log dos dois lados:
$$t=\frac{\log(M/C)}{\log(1+i)}$$
Exemplo: em quanto tempo R\$ $1000$ viram R\$ $2000$ a $1\%$ a.m.? $t=\frac{\log2}{\log1{,}01}\approx69{,}7$ meses.`,
            tip: 'Se o prazo der fracionário, o banco normalmente conta o período inteiro seguinte (70 meses).',
          },
          exercises: [
            gen((rng) => {
              const i = pick(rng, [1, 2, 3, 5, 8, 10]);
              const k = pick(rng, [2, 3, 1.5]);
              const tt = Math.log(k) / Math.log(1 + i / 100);
              return num(`A ${i}% ao período (compostos), quantos períodos para o capital ser multiplicado por ${fmt(k)}? (2 casas)`, tt, t`$t=\frac{\log ${fmt(k)}}{\log ${fmt(1 + i / 100)}}\approx${fmt(tt, 2)}$.`, { tol: 0.02 });
            }),
            gen((rng) => {
              const Cc = 1000 * randInt(rng, 1, 9);
              const M = Cc * pick(rng, [1.21, 1.331, 1.4641]);
              const tt = Math.round(Math.log(M / Cc) / Math.log(1.1));
              return num(t`R\$ $${Cc}$ viram R\$ $${money(M)}$ a $10\%$ ao ano (compostos). Quantos anos?`, tt, t`$1{,}1^t=${fmt(M / Cc)}\Rightarrow t=${tt}$.`);
            }),
            gen((rng) => {
              const tt = randInt(rng, 2, 6);
              const k = pick(rng, [1.21, 1.44, 1.69]);
              const r = Math.sqrt(k) ** (2 / tt);
              return num(`Um capital foi multiplicado por ${fmt(k)} em ${tt} meses (compostos). Qual a taxa mensal em %? (2 casas)`, (r - 1) * 100, t`$(1+i)^{${tt}}=${fmt(k)}\Rightarrow i=${fmt(k)}^{1/${tt}}-1\approx${fmt((r - 1) * 100, 2)}\%$.`, { tol: 0.02 });
            }),
            order('Ordene os passos para achar o prazo t em M = C(1 + i)^t.', ['Divida: M/C = (1 + i)^t', 'Aplique log nos dois lados', 'Use log aᵗ = t·log a', 't = log(M/C)/log(1 + i)'], 'O log "derruba" o expoente.'),
            tf('A capitalização contínua M = C·e^(rt) rende mais que a mensal com a mesma taxa nominal anual r.', true, 'Quanto mais vezes os juros são incorporados, maior o montante; o limite é e^(rt).'),
            gen((rng) => {
              const r = pick(rng, [5, 8, 10, 12]);
              const tt = randInt(rng, 1, 10);
              return num(`R\\$ 1000 com capitalização contínua a ${r}% ao ano por ${tt} anos. Montante (centavos)?`, 1000 * Math.exp((r / 100) * tt), t`$1000\,e^{${fmt(r / 100)}\cdot${tt}}\approx${money(1000 * Math.exp((r / 100) * tt))}$.`, { tol: 0.01, unit: 'R$' });
            }),
            mcqS('Uma dívida no cartão a 12% a.m. dobra em quanto tempo, aproximadamente?', 'cerca de 6 meses', ['cerca de 12 meses', 'cerca de 2 meses', 'cerca de 24 meses'], 'Regra do 72: 72/12 = 6 (exato: ln 2/ln 1,12 ≈ 6,1).'),
          ],
        },
      ],
    },
    {
      id: 'f-fin-taxas',
      title: 'Taxas e descontos',
      parts: [
        {
          card: {
            title: 'Taxas proporcionais × equivalentes',
            body: t`• **Proporcionais** (regime simples): $12\%$ a.a. = $1\%$ a.m. (divide).
• **Equivalentes** (regime composto): produzem o mesmo montante no mesmo prazo:
$$(1+i_a)=(1+i_m)^{12}$$
$1\%$ a.m. composto equivale a $1{,}01^{12}-1\approx12{,}68\%$ a.a.

**Taxa nominal × efetiva**: "$12\%$ a.a. capitalizados mensalmente" é nominal; a efetiva é $1\%$ a.m., ou $12{,}68\%$ a.a.`,
          },
          exercises: [
            gen((rng) => {
              const im = pick(rng, [0.5, 1, 1.5, 2, 3]);
              const ia = ((1 + im / 100) ** 12 - 1) * 100;
              return num(`Taxa anual equivalente a ${fmt(im)}% a.m. (compostos), em % com 2 casas:`, ia, t`$(1+${fmt(im / 100)})^{12}-1\approx${fmt(ia, 2)}\%$.`, { tol: 0.02 });
            }),
            gen((rng) => {
              const ia = pick(rng, [10, 12, 15, 20, 26.82]);
              const im = ((1 + ia / 100) ** (1 / 12) - 1) * 100;
              return num(`Taxa mensal equivalente a ${fmt(ia)}% a.a. (compostos), em % com 3 casas:`, im, t`$(1+${fmt(ia / 100)})^{1/12}-1\approx${fmt(im, 3)}\%$.`, { tol: 0.002 });
            }),
            gen((rng) => {
              const ia = 12 * randInt(rng, 1, 3);
              return num(`Taxa mensal proporcional (juros simples) a ${ia}% a.a.:`, ia / 12, `${ia}/12 = ${ia / 12}% a.m.`, { unit: '%' });
            }),
            tf('2% ao mês compostos equivalem a 24% ao ano.', false, '1,02¹² − 1 ≈ 26,82% a.a. Os 24% são a taxa proporcional (simples).'),
            mcqS('"18% ao ano com capitalização mensal" significa:', '1,5% ao mês efetivos (≈ 19,56% ao ano efetivos)', ['18% ao ano efetivos', '18% ao mês', '1,8% ao mês'], 'Taxa nominal: divide por 12 para obter a efetiva do período.'),
            gen((rng) => {
              const a = randInt(rng, 5, 30), b = randInt(rng, 5, 30);
              const tot = ((1 + a / 100) * (1 + b / 100) - 1) * 100;
              return num(`Um preço sobe ${a}% e depois mais ${b}%. Qual o aumento total (em %)?`, tot, t`Fatores: $${fmt(1 + a / 100)}\cdot${fmt(1 + b / 100)}=${fmt(1 + tot / 100)}$: aumento de $${fmt(tot, 2)}\%$.`, { tol: 0.01 });
            }),
            gen((rng) => {
              const a = randInt(rng, 10, 50);
              const back = (1 - 1 / (1 + a / 100)) * 100;
              return num(`Um preço subiu ${a}%. De quantos % deve cair para voltar ao valor original? (2 casas)`, back, t`$1-\frac{1}{${fmt(1 + a / 100)}}\approx${fmt(back, 2)}\%$ — menos que ${a}%, porque a queda incide sobre um valor maior.`, { tol: 0.01 });
            }),
            fill('Complete com o regime correto.', 'Taxas ___ se convertem dividindo; taxas ___ se convertem por potência.', ['proporcionais', 'equivalentes'], ['nominais', 'reais'], 'Proporcional: simples. Equivalente: composto.'),
          ],
        },
        {
          card: {
            title: 'Inflação, taxa real e descontos',
            body: t`Se uma aplicação rende $i_{ap}$ (aparente) com inflação $\pi$, o ganho **real** é
$$(1+i_{ap})=(1+i_r)(1+\pi)\ \Rightarrow\ i_r=\frac{1+i_{ap}}{1+\pi}-1$$
(e **não** $i_{ap}-\pi$, embora seja uma aproximação para taxas pequenas).

**Desconto comercial simples** de um título de valor nominal $N$, antecipado $t$ períodos à taxa $d$: $D=N\,d\,t$, e você recebe $A=N(1-dt)$. O desconto **racional** usa o valor atual: $A=\frac{N}{1+it}$.`,
          },
          exercises: [
            gen((rng) => {
              const iap = randInt(rng, 8, 20), pi = randInt(rng, 3, 7);
              const ir = ((1 + iap / 100) / (1 + pi / 100) - 1) * 100;
              return num(`Uma aplicação rendeu ${iap}% num ano com inflação de ${pi}%. Qual o ganho real (em %, 2 casas)?`, ir, t`$\frac{${fmt(1 + iap / 100)}}{${fmt(1 + pi / 100)}}-1\approx${fmt(ir, 2)}\%$.`, { tol: 0.01 });
            }),
            gen((rng) => {
              const pi = randInt(rng, 3, 10);
              return rmcq(rng, `Com inflação de ${pi}% no ano, um salário reajustado em ${pi}%:`, 'mantém o poder de compra (ganho real 0%)', ['ganha poder de compra', 'perde poder de compra', `ganha ${pi}% de poder de compra`], 'Taxa aparente = inflação ⇒ taxa real = 0.');
            }),
            gen((rng) => {
              const N = 100 * randInt(rng, 10, 100), d = randInt(rng, 1, 4), tt = randInt(rng, 1, 6);
              return num(t`Um título de R\$ $${N}$ é descontado $${tt}$ meses antes do vencimento, com desconto comercial simples de $${d}\%$ a.m. Quanto se recebe?`, N * (1 - (d / 100) * tt), t`$A=N(1-dt)=${N}(1-${fmt(d / 100)}\cdot${tt})=${money(N * (1 - (d / 100) * tt))}$.`, { tol: 0.01, unit: 'R$' });
            }),
            gen((rng) => {
              const N = 100 * randInt(rng, 10, 60), i = randInt(rng, 1, 4), tt = randInt(rng, 2, 6);
              const A = N / (1 + (i / 100) * tt);
              return num(t`Desconto racional simples: título de R\$ $${N}$, $${tt}$ meses antes, a $${i}\%$ a.m. Valor atual (centavos)?`, A, t`$A=\frac{${N}}{1+${fmt(i / 100)}\cdot${tt}}\approx${money(A)}$.`, { tol: 0.01, unit: 'R$' });
            }),
            tf('Com as mesmas taxa e prazo, o desconto comercial é maior que o racional.', true, 'O comercial incide sobre o valor nominal (maior); o racional, sobre o valor atual.'),
            gen((rng) => {
              const d = randInt(rng, 5, 20), e = randInt(rng, 5, 20);
              const tot = (1 - (1 - d / 100) * (1 - e / 100)) * 100;
              return num(`Descontos sucessivos de ${d}% e ${e}% equivalem a um desconto único de quantos %?`, tot, t`$1-${fmt(1 - d / 100)}\cdot${fmt(1 - e / 100)}=${fmt(tot / 100, 4)}$, ou seja, $${fmt(tot, 2)}\%$ (menos que ${d + e}%).`, { tol: 0.01 });
            }),
            mcqS('Uma loja anuncia "10% de desconto à vista ou 2× sem juros (entrada + 30 dias)". A taxa de juros embutida no parcelado é cerca de:', '25% ao mês', ['10% ao mês', '5% ao mês', '0%'], 'À vista 90. Parcelado: paga 50 hoje e 50 em 30 dias. Financiou 40 e devolveu 50: 50/40 − 1 = 25%.'),
            match('Associe.', [['taxa aparente', 'o que o extrato mostra'], ['taxa real', 'ganho descontada a inflação'], ['desconto comercial', 'calculado sobre o valor nominal'], ['desconto racional', 'calculado sobre o valor atual']], 'Aparente × real e os dois tipos de desconto.'),
          ],
        },
      ],
    },
    {
      id: 'f-fin-serie',
      title: 'Financiamentos e séries de pagamentos',
      parts: [
        {
          card: {
            title: 'Dinheiro no tempo',
            body: t`R\$ $100$ hoje não valem o mesmo que R\$ $100$ daqui a um ano. Para comparar, leve os valores para a **mesma data**:
• do futuro para hoje (valor presente): $VP=\frac{VF}{(1+i)^n}$;
• de hoje para o futuro: $VF=VP(1+i)^n$.

Uma **série uniforme** de $n$ parcelas iguais $PMT$ (a primeira daqui a 1 período) tem valor presente
$$PV=PMT\cdot\frac{1-(1+i)^{-n}}{i}\quad\Longleftrightarrow\quad PMT=PV\cdot\frac{i}{1-(1+i)^{-n}}$$`,
            example: t`À vista R\$ $1000$ ou 3 parcelas de R\$ $350$ com juros de $2\%$ a.m.? VP das parcelas $=350\cdot\frac{1-1{,}02^{-3}}{0{,}02}\approx1009{,}35>1000$: à vista é melhor.`,
          },
          exercises: [
            gen((rng) => {
              const VF = 100 * randInt(rng, 10, 50), i = randInt(rng, 1, 5), n = randInt(rng, 2, 12);
              return num(t`Qual o valor presente de R\$ $${VF}$ a receber daqui a $${n}$ meses, a $${i}\%$ a.m.? (centavos)`, VF / (1 + i / 100) ** n, t`$\frac{${VF}}{${fmt(1 + i / 100)}^{${n}}}\approx${money(VF / (1 + i / 100) ** n)}$.`, { tol: 0.01, unit: 'R$' });
            }),
            gen((rng) => {
              const PV = 1000 * randInt(rng, 1, 20), i = pick(rng, [1, 1.5, 2, 3]), n = randInt(rng, 3, 24);
              return num(t`Financiamento de R\$ $${PV}$ em $${n}$ parcelas iguais (Price), juros de $${fmt(i)}\%$ a.m. Valor da parcela? (centavos)`, pmt(PV, i / 100, n), t`$PMT=${PV}\cdot\frac{${fmt(i / 100)}}{1-${fmt(1 + i / 100)}^{-${n}}}\approx${money(pmt(PV, i / 100, n))}$.`, { tol: 0.01, unit: 'R$' });
            }),
            gen((rng) => {
              const P = 50 * randInt(rng, 4, 20), i = pick(rng, [1, 2, 3]), n = randInt(rng, 3, 12);
              const PV = (P * (1 - (1 + i / 100) ** -n)) / (i / 100);
              return num(t`Quanto vale hoje uma série de $${n}$ parcelas mensais de R\$ $${P}$, a $${i}\%$ a.m.? (centavos)`, PV, t`$PV=${P}\cdot\frac{1-${fmt(1 + i / 100)}^{-${n}}}{${fmt(i / 100)}}\approx${money(PV)}$.`, { tol: 0.01, unit: 'R$' });
            }),
            gen((rng) => {
              const av = 100 * randInt(rng, 9, 20);
              const P = Math.round((av / 3) * pick(rng, [1.01, 1.03, 1.05]));
              const i = 0.02;
              const PV = (P * (1 - (1 + i) ** -3)) / i;
              const best = PV > av ? 'à vista' : 'parcelado';
              return rmcq(rng, t`À vista R\$ $${av}$ ou 3× de R\$ $${P}$ (1ª em 30 dias), com dinheiro rendendo $2\%$ a.m. Qual é melhor para o comprador?`, best, [best === 'à vista' ? 'parcelado' : 'à vista', 'tanto faz'], t`VP das parcelas $\approx${money(PV)}$ ${PV > av ? '>' : '<'} ${av}.`);
            }),
            tf('Numa série uniforme, somar as parcelas dá o valor presente do financiamento.', false, 'Somar ignora o valor do dinheiro no tempo; a soma é maior que o PV (a diferença são os juros).'),
            order('Ordene para comparar "à vista" com "parcelado".', ['Escolha a taxa de juros que o seu dinheiro renderia', 'Traga cada parcela para hoje dividindo por (1 + i)^n', 'Some os valores presentes', 'Compare com o preço à vista'], 'Tudo na mesma data!'),
            gen((rng) => {
              const PV = 1000 * randInt(rng, 5, 30), n = randInt(rng, 6, 24), i = pick(rng, [1, 2]);
              const P = pmt(PV, i / 100, n);
              return num(t`Financiou R\$ $${PV}$ em $${n}$ parcelas de R\$ $${money(P)}$. Quanto pagou de juros no total? (centavos)`, n * P - PV, t`$${n}\cdot${money(P)}-${PV}\approx${money(n * P - PV)}$.`, { tol: 0.05, unit: 'R$' });
            }),
          ],
        },
        {
          card: {
            title: 'Tabela Price × SAC',
            body: t`Em cada parcela: **juros** = saldo devedor × $i$; **amortização** = parcela − juros; o saldo cai pela amortização.

• **Price**: parcelas **iguais**. No começo quase tudo é juros; a amortização cresce.
• **SAC**: amortização **constante** $PV/n$; os juros caem e as parcelas **decrescem**. Paga-se menos juros no total (o saldo cai mais rápido).`,
            visual: amortLab(),
            example: t`SAC de R\$ $1200$ em 4 meses a $2\%$: amortização $300$. Parcelas: $300+24=324$, $300+18=318$, $312$, $306$.`,
          },
          exercises: [
            gen((rng) => {
              const PV = 1200 * randInt(rng, 1, 10), n = pick(rng, [3, 4, 6, 12]), i = pick(rng, [1, 2, 3]);
              return num(t`SAC: R\$ $${PV}$ em $${n}$ meses a $${i}\%$ a.m. Valor da 1ª parcela?`, PV / n + (PV * i) / 100, t`Amortização $${PV}/${n}=${PV / n}$; juros $${PV}\cdot${fmt(i / 100)}=${(PV * i) / 100}$. Parcela $=${PV / n + (PV * i) / 100}$.`, { tol: 0.01, unit: 'R$' });
            }),
            gen((rng) => {
              const PV = 1200 * randInt(rng, 1, 10), n = pick(rng, [3, 4, 6, 12]), i = pick(rng, [1, 2, 3]);
              const k = randInt(rng, 2, n);
              const parc = PV / n + (PV - (k - 1) * (PV / n)) * (i / 100);
              return num(t`SAC: R\$ $${PV}$ em $${n}$ meses a $${i}\%$ a.m. Valor da ${k}ª parcela?`, parc, t`Saldo antes dela: $${PV}-${k - 1}\cdot${PV / n}=${PV - (k - 1) * (PV / n)}$; juros $${money((PV - (k - 1) * (PV / n)) * (i / 100))}$; parcela $${money(parc)}$.`, { tol: 0.01, unit: 'R$' });
            }),
            gen((rng) => {
              const PV = 1000 * randInt(rng, 1, 10), n = randInt(rng, 4, 12), i = pick(rng, [1, 2, 3]);
              const P = pmt(PV, i / 100, n);
              const J1 = (PV * i) / 100;
              return num(t`Price: R\$ $${PV}$, $${n}$ parcelas de R\$ $${money(P)}$ a $${i}\%$ a.m. Quanto da 1ª parcela é amortização?`, P - J1, t`Juros $=${PV}\cdot${fmt(i / 100)}=${J1}$; amortização $=${money(P)}-${J1}=${money(P - J1)}$.`, { tol: 0.01, unit: 'R$' });
            }),
            inter('Compare: escolha o sistema e os parâmetros em que as parcelas DIMINUEM ao longo do tempo.', 'plot', amortLab().props, (v) => Math.round(v.p.m) === 1, 'SAC', 'No SAC a amortização é fixa e os juros caem: parcelas decrescentes.'),
            mcqS('Para o mesmo valor, prazo e taxa, qual sistema paga menos juros no total?', 'SAC', ['Price', 'os dois pagam igual', 'depende só do prazo'], 'No SAC o saldo devedor cai mais rápido, e os juros incidem sobre um saldo menor.'),
            tf('Na tabela Price, a amortização da última parcela é maior que a da primeira.', true, 'Parcela fixa e juros caindo ⇒ amortização crescente.'),
            {
              gen: (rng) => {
                const PV = 1200, n = 4, i = 0.02;
                const rows: (string | number)[][] = [];
                let s = PV;
                for (let k = 1; k <= n; k++) {
                  const J = s * i;
                  rows.push([k, money(s), money(J), money(PV / n), money(PV / n + J)]);
                  s -= PV / n;
                }
                const k = randInt(rng, 2, 4);
                return num(`Na tabela SAC abaixo (R\\$ 1200, 4 meses, 2% a.m.), qual o total de juros pagos?`, 24 + 18 + 12 + 6, 'Juros: 24 + 18 + 12 + 6 = 60.', { unit: 'R$', visual: table(['mês', 'saldo', 'juros', 'amort.', 'parcela'], rows, [k - 1]) });
              },
            },
            match('Associe cada item ao que o define.', [['Price', 'parcela constante'], ['SAC', 'amortização constante'], ['juros do mês', 'saldo devedor × taxa'], ['amortização do mês', 'parcela − juros']], 'A regra dos juros vale para os dois sistemas; o que muda é o que fica fixo.'),
          ],
        },
      ],
    },
  ],
};


'use client';

import { useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ResultadoSimulador = {
  custoCativo: number;
  custoLivre: number;
  economia: number;
  custoCativoSemSolar: number;
  custoLivreSemSolar: number;
  economiaSemSolar: number;
  memoria: {
    consumoTotal: number;
    valorBrutoCativo: number;
    descontoSolarCativo: number;
    descontoSolarLivre: number;
    tarifaMediaCativo: number;
    consumoPonta: number;
    consumoForaPonta: number;
    tarifas: { tp: number; tf: number; tl: number };
    icmsPercentual: number;
    geracaoSolar: number;
    compensacoes: { cc: number; cl: number };
  };
};

export default function SimuladorComparativoEnergia() {
  const [consumoPonta, setConsumoPonta] = useState('');
  const [consumoForaPonta, setConsumoForaPonta] = useState('');
  const [tarifaCativoPonta, setTarifaCativoPonta] = useState('');
  const [tarifaCativoForaPonta, setTarifaCativoForaPonta] = useState('');
  const [icms, setIcms] = useState('');
  const [tarifaLivre, setTarifaLivre] = useState('');
  const [estado, setEstado] = useState('');
  const [usarSolar, setUsarSolar] = useState(false);
  const [geracaoSolar, setGeracaoSolar] = useState('');
  const [compensacaoCativo, setCompensacaoCativo] = useState('100');
  const [compensacaoLivre, setCompensacaoLivre] = useState('100');
  const [resultado, setResultado] = useState<ResultadoSimulador | null>(null);
  const resultadoRef = useRef<HTMLDivElement>(null);

  const simular = () => {
    const cp = parseFloat(consumoPonta);
    const cf = parseFloat(consumoForaPonta);
    const tp = parseFloat(tarifaCativoPonta);
    const tf = parseFloat(tarifaCativoForaPonta);
    const i = parseFloat(icms) / 100;
    const tl = parseFloat(tarifaLivre);
    const gs = usarSolar ? parseFloat(geracaoSolar) : 0;
    const cc = parseFloat(compensacaoCativo) / 100;
    const cl = parseFloat(compensacaoLivre) / 100;

    const consumoTotal = cp + cf;
    const valorBrutoCativo = cp * tp + cf * tf;
    const descontoSolarCativo = Math.min(gs, consumoTotal) * ((tp + tf) / 2) * cc;
    const custoCativo = (valorBrutoCativo - descontoSolarCativo) * (1 + i);
    const descontoSolarLivre = Math.min(gs, consumoTotal) * tl * cl;
    const custoLivre = (consumoTotal * tl) - descontoSolarLivre;
    const custoCativoSemSolar = valorBrutoCativo * (1 + i);
    const custoLivreSemSolar = consumoTotal * tl;
    const economiaSemSolar = custoCativoSemSolar - custoLivreSemSolar;
    const economia = custoCativo - custoLivre;

    setResultado({
      custoCativo,
      custoLivre,
      economia,
      custoCativoSemSolar,
      custoLivreSemSolar,
      economiaSemSolar,
      memoria: {
        consumoTotal,
        valorBrutoCativo,
        descontoSolarCativo,
        descontoSolarLivre,
        tarifaMediaCativo: (tp + tf) / 2,
        consumoPonta: cp,
        consumoForaPonta: cf,
        tarifas: { tp, tf, tl },
        icmsPercentual: i,
        geracaoSolar: gs,
        compensacoes: { cc, cl }
      }
    });
  };

  const exportarPDF = async () => {
    const input = resultadoRef.current;
    if (!input || !resultado) return;

    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const logo = new Image();
    logo.src = 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Logo_TV_2015.png';

    logo.onload = () => {
      pdf.addImage(logo, 'PNG', 10, 10, 40, 15);
      pdf.setFontSize(16);
      pdf.text('Relatório Comparativo de Energia', 60, 20);

      const economiaText = resultado.economia > 0
        ? `Você economizaria aproximadamente R$ ${resultado.economia.toFixed(2)} por mês ao optar pelo mercado livre.`
        : `O mercado cativo está atualmente mais vantajoso neste cenário.`;

      pdf.setFontSize(12);
      pdf.text(economiaText, 10, 35);

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      const maxHeight = pdf.internal.pageSize.getHeight() - 50;
      const scaledHeight = Math.min(imgHeight, maxHeight);

      pdf.addImage(imgData, 'PNG', 0, 45, pdfWidth, scaledHeight);
      pdf.save('comparativo-energia.pdf');
    };
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h1 className="text-2xl font-bold text-center">Comparativo: Cativo vs Livre</h1>

      <input type="number" placeholder="Consumo Ponta (kWh)" className="w-full p-3 border rounded" value={consumoPonta} onChange={e => setConsumoPonta(e.target.value)} />
      <input type="number" placeholder="Consumo Fora-Ponta (kWh)" className="w-full p-3 border rounded" value={consumoForaPonta} onChange={e => setConsumoForaPonta(e.target.value)} />
      <input type="number" placeholder="Tarifa Cativo Ponta (R$/kWh)" className="w-full p-3 border rounded" value={tarifaCativoPonta} onChange={e => setTarifaCativoPonta(e.target.value)} />
      <input type="number" placeholder="Tarifa Cativo Fora-Ponta (R$/kWh)" className="w-full p-3 border rounded" value={tarifaCativoForaPonta} onChange={e => setTarifaCativoForaPonta(e.target.value)} />
      <input type="number" placeholder="ICMS (%)" className="w-full p-3 border rounded" value={icms} onChange={e => setIcms(e.target.value)} />
      <input type="number" placeholder="Tarifa Livre (R$/kWh)" className="w-full p-3 border rounded" value={tarifaLivre} onChange={e => setTarifaLivre(e.target.value)} />
      <input type="text" placeholder="Estado (UF)" className="w-full p-3 border rounded" value={estado} onChange={e => setEstado(e.target.value)} />

      <div className="flex items-center space-x-2">
        <input type="checkbox" id="usarSolar" checked={usarSolar} onChange={e => setUsarSolar(e.target.checked)} />
        <label htmlFor="usarSolar">Incluir geração solar na comparação?</label>
      </div>

      {usarSolar && (
        <>
          <input type="number" placeholder="Geração solar mensal (kWh)" className="w-full p-3 border rounded" value={geracaoSolar} onChange={e => setGeracaoSolar(e.target.value)} />
          <input type="number" placeholder="% de compensação no Cativo" className="w-full p-3 border rounded" value={compensacaoCativo} onChange={e => setCompensacaoCativo(e.target.value)} />
          <input type="number" placeholder="% de compensação no Livre" className="w-full p-3 border rounded" value={compensacaoLivre} onChange={e => setCompensacaoLivre(e.target.value)} />
        </>
      )}

      <button onClick={simular} className="bg-blue-600 text-white px-4 py-2 rounded w-full">Comparar Mercados</button>

      {resultado && (
        <div ref={resultadoRef} className="mt-6 space-y-4">
          <p><strong>Custo no Mercado Cativo:</strong> R$ {resultado.custoCativo.toFixed(2)}</p>
          <p><strong>Custo no Mercado Livre:</strong> R$ {resultado.custoLivre.toFixed(2)}</p>
          <p><strong>Economia estimada:</strong> R$ {resultado.economia.toFixed(2)}</p>

          <details className="bg-gray-50 p-3 border rounded">
            <summary className="cursor-pointer font-semibold">Memória de cálculo</summary>
            <ul className="mt-2 text-sm text-gray-700">
              <li><strong>Consumo total:</strong> {resultado.memoria.consumoTotal} kWh</li>
              <li><strong>Tarifa Cativo Ponta:</strong> R$ {resultado.memoria.tarifas.tp.toFixed(2)}</li>
              <li><strong>Tarifa Cativo Fora-Ponta:</strong> R$ {resultado.memoria.tarifas.tf.toFixed(2)}</li>
              <li><strong>Tarifa Livre:</strong> R$ {resultado.memoria.tarifas.tl.toFixed(2)}</li>
              <li><strong>Tarifa média Cativo:</strong> R$ {resultado.memoria.tarifaMediaCativo.toFixed(2)}</li>
              <li><strong>Valor bruto Cativo:</strong> R$ {resultado.memoria.valorBrutoCativo.toFixed(2)}</li>
              <li><strong>Desconto Solar Cativo:</strong> R$ {resultado.memoria.descontoSolarCativo.toFixed(2)}</li>
              <li><strong>Desconto Solar Livre:</strong> R$ {resultado.memoria.descontoSolarLivre.toFixed(2)}</li>
              <li><strong>ICMS:</strong> {Math.round(resultado.memoria.icmsPercentual * 100)}%</li>
              <li><strong>Geração solar:</strong> {resultado.memoria.geracaoSolar} kWh</li>
              <li><strong>Compensação Cativo:</strong> {Math.round(resultado.memoria.compensacoes.cc * 100)}%</li>
              <li><strong>Compensação Livre:</strong> {Math.round(resultado.memoria.compensacoes.cl * 100)}%</li>
            </ul>
          </details>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[{ name: 'Cativo', valor: resultado.custoCativo }, { name: 'Livre', valor: resultado.custoLivre }]}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              <Bar dataKey="valor" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>

          <button onClick={exportarPDF} className="mt-4 bg-green-600 text-white px-4 py-2 rounded w-full">
            Exportar como PDF
          </button>
        </div>
      )}
    </div>
  );
}


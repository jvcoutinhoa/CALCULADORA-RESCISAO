import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  TrendingDown, 
  TrendingUp,
  Settings,
  Calculator,
  AlertTriangle,
  Wallet,
  Download,
  User,
  Loader2,
  Briefcase,
  PiggyBank,
  Sun,
  Moon
} from 'lucide-react';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  // Alterar o Ícone e o Título da Aba do Navegador
  useEffect(() => {
    document.title = 'Simulador de Rescisão CLT';
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    // Cria um Favicon sofisticado (vetor SVG de calculadora minimalista)
    link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%232563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/><path d="M8 18h.01"/><path d="M12 14h.01"/><path d="M12 18h.01"/></svg>';
  }, []);

  // Efeito para aplicar o Tema Escuro na tag raiz do HTML
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Estados para os inputs do usuário (iniciando vazios)
  const [nomeFuncionario, setNomeFuncionario] = useState('');
  const [motivoRescisao, setMotivoRescisao] = useState('pedido'); // 'pedido' ou 'dispensa'
  const [admissao, setAdmissao] = useState('');
  const [saida, setSaida] = useState('');
  const [salarioBase, setSalarioBase] = useState('');
  const [saldoFgts, setSaldoFgts] = useState('');
  
  // Estados para o Contrato de Experiência
  const [isContratoExperiencia, setIsContratoExperiencia] = useState(false);
  const [diasAcordados, setDiasAcordados] = useState('90');

  // Estados para o Empréstimo
  const [temEmprestimo, setTemEmprestimo] = useState(false);
  const [valorEmprestimo, setValorEmprestimo] = useState('');
  const [parcelasTotais, setParcelasTotais] = useState('');
  const [parcelasPagas, setParcelasPagas] = useState('0');

  // Estado para o carregamento do PDF
  const [isGenerating, setIsGenerating] = useState(false);

  // Formatador de moeda
  const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  // Função para calcular o INSS
  const calcularINSS = (valor) => {
    if (valor <= 0) return 0;
    let inss = 0;
    let base = valor > 7786.02 ? 7786.02 : valor; 

    if (base > 1412.00) inss += 1412.00 * 0.075;
    else return base * 0.075;

    if (base > 2666.68) inss += (2666.68 - 1412.00) * 0.09;
    else return inss + (base - 1412.00) * 0.09;

    if (base > 4000.03) inss += (4000.03 - 2666.68) * 0.12;
    else return inss + (base - 2666.68) * 0.12;

    if (base > 7786.02) inss += (7786.02 - 4000.03) * 0.14;
    else return inss + (base - 4000.03) * 0.14;

    return inss;
  };

  // Motor de cálculo executado sempre que os estados mudarem
  const calculo = useMemo(() => {
    if (!admissao || !saida || !salarioBase) {
      return { valido: false, isVazio: true };
    }

    const dataAdm = new Date(admissao + "T00:00:00");
    const dataSai = new Date(saida + "T00:00:00");
    const salario = parseFloat(salarioBase);

    if (isNaN(dataAdm) || isNaN(dataSai) || isNaN(salario) || dataAdm >= dataSai || salario <= 0) {
      return { valido: false, isVazio: false };
    }

    const isDispensa = motivoRescisao === 'dispensa';

    // --- TEMPO DE TRABALHO GERAL ---
    const msPorDia = 1000 * 60 * 60 * 24;
    const diasTotais = Math.floor((dataSai - dataAdm) / msPorDia) + 1;
    let mesesCompletos = Math.floor(diasTotais / 30);
    const diasRestantes = diasTotais % 30;
    
    let textoTempo = `${mesesCompletos} meses`;
    if (diasRestantes > 0) textoTempo += ` e ${diasRestantes} dias`;

    // --- SALDO DE SALÁRIO ---
    let diasTrabalhadosNoMes = dataSai.getDate();
    if (diasTrabalhadosNoMes > 30) diasTrabalhadosNoMes = 30;
    const saldoSalario = (salario / 30) * diasTrabalhadosNoMes;

    // --- 13º PROPORCIONAL ---
    let start13 = dataAdm.getFullYear() === dataSai.getFullYear() ? dataAdm : new Date(dataSai.getFullYear(), 0, 1);
    let meses13 = 0;
    for (let m = start13.getMonth(); m <= dataSai.getMonth(); m++) {
      let startDay = (m === start13.getMonth()) ? start13.getDate() : 1;
      let endDay = (m === dataSai.getMonth()) ? dataSai.getDate() : new Date(dataSai.getFullYear(), m + 1, 0).getDate();
      let diasTrabalhadosNesteMes = endDay - startDay + 1;
      if (diasTrabalhadosNesteMes >= 15) meses13++;
    }
    const decimoTerceiro = (salario / 12) * meses13;

    // --- FÉRIAS VENCIDAS E PROPORCIONAIS ---
    let mesesFerias = Math.floor(diasTotais / 30);
    if (diasTotais % 30 >= 15) mesesFerias++; 

    const feriasVencidasAnos = Math.floor(mesesFerias / 12);
    const feriasProporcionaisMeses = mesesFerias % 12;

    const valorFeriasVencidas = feriasVencidasAnos * salario;
    const valorFeriasProporcionais = (feriasProporcionaisMeses / 12) * salario;
    const valorTercoFerias = (valorFeriasVencidas + valorFeriasProporcionais) / 3;

    // --- DESCONTOS LEGAIS (INSS) ---
    const inssSalario = calcularINSS(saldoSalario);
    const inss13 = calcularINSS(decimoTerceiro);

    // --- EMPRÉSTIMO ---
    let saldoDevedorEmprestimo = 0;
    if (temEmprestimo) {
      const vEmp = parseFloat(valorEmprestimo) || 0;
      const pTot = parseInt(parcelasTotais) || 1;
      const pPag = parseInt(parcelasPagas) || 0;
      const parcelaAtual = pTot > 0 ? (vEmp / pTot) : 0;
      saldoDevedorEmprestimo = Math.max(0, vEmp - (parcelaAtual * pPag));
    }

    // --- FGTS ---
    const fgtsInformado = parseFloat(saldoFgts);
    const fgtsEstimado = (salario * 0.08) * (diasTotais / 30);
    const baseFgts = !isNaN(fgtsInformado) && fgtsInformado > 0 ? fgtsInformado : fgtsEstimado;
    const isFgtsEstimado = isNaN(fgtsInformado) || fgtsInformado <= 0;
    const multaFgts = baseFgts * 0.4;
    const totalFgts = baseFgts + multaFgts;

    // --- CONTRATO DE EXPERIÊNCIA (Arts. 479 e 480 CLT) ---
    let multaArt479 = 0; 
    let multaArt480 = 0; 
    let isTerminoPrazo = false;

    if (isContratoExperiencia) {
      const diasAcordadosNum = parseInt(diasAcordados) || 90;
      const diasRestantesContrato = diasAcordadosNum - diasTotais;
      
      if (diasRestantesContrato > 0) {
        const valorMulta = (salario / 30) * diasRestantesContrato * 0.5;
        if (isDispensa) multaArt479 = valorMulta;
        else multaArt480 = valorMulta;
      } else {
        isTerminoPrazo = true;
      }
    }

    // --- MONTANDO ARRAYS PARA INTERFACE ---
    const proventos = [];
    proventos.push({ nome: `Saldo de Salário (${diasTrabalhadosNoMes} dias)`, valor: saldoSalario });
    if (meses13 > 0) proventos.push({ nome: `13º Salário Proporcional (${meses13}/12)`, valor: decimoTerceiro });
    if (feriasVencidasAnos > 0) proventos.push({ nome: `Férias Vencidas (${feriasVencidasAnos} ano/s)`, valor: valorFeriasVencidas });
    if (feriasProporcionaisMeses > 0) proventos.push({ nome: `Férias Proporcionais (${feriasProporcionaisMeses}/12)`, valor: valorFeriasProporcionais });
    proventos.push({ nome: `1/3 Constitucional sobre Férias`, valor: valorTercoFerias });
    if (multaArt479 > 0) proventos.push({ nome: `Multa Art. 479 (50% dias restantes)`, valor: multaArt479 });

    const descontos = [];
    if (inssSalario > 0) descontos.push({ nome: "INSS sobre Saldo de Salário", valor: inssSalario });
    if (inss13 > 0) descontos.push({ nome: "INSS sobre 13º Proporcional", valor: inss13 });
    if (saldoDevedorEmprestimo > 0) descontos.push({ nome: "Desconto de Empréstimo", valor: saldoDevedorEmprestimo });
    if (multaArt480 > 0) descontos.push({ nome: `Multa Art. 480 (50% dias restantes)`, valor: multaArt480 });

    const totalProventos = proventos.reduce((acc, curr) => acc + curr.valor, 0);
    const totalDescontos = descontos.reduce((acc, curr) => acc + curr.valor, 0);
    
    // --- LÍQUIDOS DOS CENÁRIOS ---
    const liquidoBase = totalProventos - totalDescontos;
    
    let tituloC1 = ''; let descC1 = '';
    let tituloC2 = ''; let descC2 = '';
    let valorDestaqueC2 = salario;
    let isDescontoC2 = true;
    let liquidoCenario1 = 0;
    let liquidoCenario2 = 0;
    let exibirCenarioUnico = false;

    if (isContratoExperiencia) {
      exibirCenarioUnico = true;
      if (isTerminoPrazo) {
        tituloC1 = "Término no Prazo do Contrato";
        descC1 = "O contrato terminou na data combinada. Saque do FGTS liberado (se dispensado), sem multa de 40% e sem aviso prévio.";
        liquidoCenario1 = liquidoBase + (isDispensa ? baseFgts : 0);
      } else {
        tituloC1 = isDispensa ? "Quebra Antecipada (Empregador)" : "Quebra Antecipada (Empregado)";
        descC1 = "Rescisão antes do prazo acordado. Inclui a multa de 50% dos dias restantes. Não há aviso prévio.";
        liquidoCenario1 = liquidoBase + (isDispensa ? totalFgts : 0);
      }
    } else if (!isDispensa) {
      tituloC1 = "Aviso Prévio Cumprido";
      descC1 = "Você trabalha normalmente os 30 dias após formalizar o pedido.";
      liquidoCenario1 = liquidoBase;

      tituloC2 = "Aviso Indenizado (Não Cumprido)";
      descC2 = "Você encerra as atividades imediatamente.";
      isDescontoC2 = true;
      liquidoCenario2 = liquidoBase - salario;
    } else {
      tituloC1 = "Aviso Prévio Trabalhado";
      descC1 = "A empresa exige o cumprimento. Inclui Saque do FGTS + Multa 40%.";
      liquidoCenario1 = liquidoBase + totalFgts;

      tituloC2 = "Aviso Prévio Indenizado";
      descC2 = "A empresa te dispensa. Recebe 1 Salário Extra + FGTS + Multa 40%.";
      isDescontoC2 = false;
      liquidoCenario2 = liquidoBase + salario + totalFgts;
    }

    const dataPagamento = new Date(dataSai);
    dataPagamento.setDate(dataPagamento.getDate() + 10);

    return {
      valido: true,
      textoTempo,
      admissaoStr: dataAdm.toLocaleDateString('pt-BR'),
      saidaStr: dataSai.toLocaleDateString('pt-BR'),
      prazoPagamentoStr: dataPagamento.toLocaleDateString('pt-BR'),
      salario,
      proventos,
      totalProventos,
      descontos,
      totalDescontos,
      isDispensa,
      fgts: {
        base: baseFgts,
        multa: multaFgts,
        total: totalFgts,
        estimado: isFgtsEstimado
      },
      cenarios: {
        t1: tituloC1, d1: descC1, l1: liquidoCenario1,
        t2: tituloC2, d2: descC2, l2: liquidoCenario2,
        valC2: valorDestaqueC2, isDescC2: isDescontoC2, unico: exibirCenarioUnico
      }
    };

  }, [admissao, saida, salarioBase, motivoRescisao, saldoFgts, temEmprestimo, valorEmprestimo, parcelasTotais, parcelasPagas, isContratoExperiencia, diasAcordados]);

  const handleGeneratePDF = () => {
    setIsGenerating(true);

    setTimeout(async () => {
      try {
        if (!window.html2pdf) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        const elemento = document.getElementById('relatorio-conteudo');
        const nomeArquivo = nomeFuncionario 
          ? `Rescisao_${nomeFuncionario.replace(/\s+/g, '_')}.pdf` 
          : 'Relatorio_Rescisao.pdf';

        const opcoes = {
          margin:       [10, 10, 10, 10], 
          filename:     nomeArquivo,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, logging: false },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        await window.html2pdf().set(opcoes).from(elemento).save();

      } catch (error) {
        console.error("Erro ao gerar PDF: ", error);
        window.print(); 
      } finally {
        setIsGenerating(false); 
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4 md:p-8 font-sans text-slate-800 dark:text-slate-200 flex flex-col transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-6 flex-grow w-full">
        
        {/* Cabeçalho Principal e Botão Gerar PDF */}
        <header className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
              <Calculator className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-500" /> 
              Simulador de Rescisão
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Preencha os parâmetros abaixo para calcular e gerar o documento em PDF.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center w-full sm:w-auto mt-4 sm:mt-0 gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center justify-center p-3 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              title={darkMode ? "Mudar para Tema Claro" : "Mudar para Tema Escuro"}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button 
              onClick={handleGeneratePDF}
              disabled={!calculo.valido || isGenerating}
              className={`flex items-center justify-center gap-2 px-5 py-3 text-white font-semibold rounded-lg transition-all shadow-md w-full sm:w-auto
                ${!calculo.valido ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 hover:shadow-lg active:scale-95'}
              `}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Formatando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Gerar Relatório (PDF)</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Painel de Configurações */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-blue-100 dark:border-slate-700 overflow-hidden transition-colors">
          <div className="bg-blue-50/50 dark:bg-slate-800/80 p-4 border-b border-blue-100 dark:border-slate-700">
             <h2 className="text-base font-semibold text-blue-900 dark:text-white flex items-center">
              <Settings className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Parâmetros do Cálculo
            </h2>
          </div>

          <div className="p-5 border-b border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo do Funcionário (Opcional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input 
                  type="text" 
                  placeholder="Ex: João da Silva"
                  value={nomeFuncionario} 
                  onChange={e => setNomeFuncionario(e.target.value)} 
                  className="w-full pl-10 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none transition-all dark:text-white" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Motivo da Rescisão</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <select 
                  value={motivoRescisao} 
                  onChange={e => setMotivoRescisao(e.target.value)} 
                  className="w-full pl-10 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none transition-all appearance-none cursor-pointer dark:text-white" 
                >
                  <option value="pedido">Pedido de Demissão</option>
                  <option value="dispensa">Demissão Sem Justa Causa</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Admissão</label>
              <input 
                type="date" 
                value={admissao} 
                onChange={e => setAdmissao(e.target.value)} 
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none transition-all dark:text-white" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Saída</label>
              <input 
                type="date" 
                value={saida} 
                onChange={e => setSaida(e.target.value)} 
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none transition-all dark:text-white" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Salário Bruto (R$)</label>
              <input 
                type="number" 
                min="0"
                step="0.01"
                placeholder="Ex: 2500.00"
                value={salarioBase} 
                onChange={e => setSalarioBase(e.target.value)} 
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none transition-all dark:text-white" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Saldo FGTS (Opcional)</label>
              <input 
                type="number" 
                min="0"
                step="0.01"
                placeholder="Ex: 1500.00"
                value={saldoFgts} 
                onChange={e => setSaldoFgts(e.target.value)} 
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none transition-all dark:text-white" 
              />
            </div>
          </div>

          <div className="p-5 border-t border-blue-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Bloco Contrato de Experiência */}
            <div>
              <div className="flex items-center mb-2">
                <label className="flex items-center text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isContratoExperiencia} 
                    onChange={e => setIsContratoExperiencia(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-900 focus:ring-blue-500 mr-2"
                  />
                  <Clock className="w-5 h-5 mr-2 text-slate-500 dark:text-slate-400" />
                  É Contrato de Experiência?
                </label>
              </div>
              
              {isContratoExperiencia && (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Dias Acordados no Contrato</label>
                  <input 
                    type="number" 
                    min="1"
                    max="90"
                    placeholder="Ex: 90"
                    value={diasAcordados} 
                    onChange={e => setDiasAcordados(e.target.value)} 
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none text-sm dark:text-white" 
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">Limite máx. de 90 dias previstos na CLT.</p>
                </div>
              )}
            </div>

            {/* Bloco de Empréstimo */}
            <div>
              <div className="flex items-center mb-2">
                <label className="flex items-center text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={temEmprestimo} 
                    onChange={e => setTemEmprestimo(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-900 focus:ring-blue-500 mr-2"
                  />
                  <Wallet className="w-5 h-5 mr-2 text-slate-500 dark:text-slate-400" />
                  Adicionar desconto de empréstimo
                </label>
              </div>
              
              {temEmprestimo && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Total Bruto</label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      placeholder="Ex: 2000"
                      value={valorEmprestimo} 
                      onChange={e => setValorEmprestimo(e.target.value)} 
                      className="w-full px-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none text-sm dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Parcelas</label>
                    <input 
                      type="number" 
                      min="1"
                      placeholder="Ex: 10"
                      value={parcelasTotais} 
                      onChange={e => setParcelasTotais(e.target.value)} 
                      className="w-full px-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none text-sm dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Pagas</label>
                    <input 
                      type="number" 
                      min="0"
                      placeholder="Ex: 3"
                      value={parcelasPagas} 
                      onChange={e => setParcelasPagas(e.target.value)} 
                      className="w-full px-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none text-sm dark:text-white" 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mensagem de Estado Vazio ou Erro */}
        {!calculo.valido ? (
          calculo.isVazio ? (
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 text-center rounded-xl print:hidden transition-all">
              <Calculator className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Aguardando Informações</h3>
              <p className="text-slate-500 dark:text-slate-400">Preencha as datas de admissão, saída e o salário bruto acima para iniciar a simulação da rescisão.</p>
            </div>
          ) : (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 p-8 text-center rounded-xl print:hidden transition-all">
              <AlertTriangle className="w-12 h-12 text-orange-400 dark:text-orange-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-orange-800 dark:text-orange-300">Parâmetros Inválidos</h3>
              <p className="text-orange-600 dark:text-orange-400">Verifique se o salário é maior que zero e se a data de saída é posterior à data de admissão.</p>
            </div>
          )
        ) : (
          /* --- ÁREA QUE SERÁ CONVERTIDA EM PDF --- */
          <div id="relatorio-conteudo" className={`${isGenerating ? 'bg-white dark:bg-slate-800 p-4 max-w-4xl mx-auto rounded-lg' : ''} transition-all duration-300`}>
            
            {/* Cabeçalho exclusivo para o PDF */}
            <div className={`border-b border-slate-200 dark:border-slate-700 hidden print:block ${isGenerating ? '!block mb-4 pb-3' : 'mb-6 pb-4'}`}>
              <h1 className={`${isGenerating ? 'text-xl' : 'text-2xl'} font-bold text-slate-900 dark:text-white flex items-center`}>
                <Calculator className={`${isGenerating ? 'w-5 h-5' : 'w-6 h-6'} mr-2 text-blue-600 dark:text-blue-500`} /> 
                Relatório de Rescisão: {motivoRescisao === 'pedido' ? 'Pedido de Demissão' : 'Sem Justa Causa'}
              </h1>
              {nomeFuncionario && (
                <div className={`mt-2 flex items-center text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg w-fit ${isGenerating ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'}`}>
                  <User className={`${isGenerating ? 'w-4 h-4' : 'w-5 h-5'} mr-2 text-slate-500 dark:text-slate-400`} />
                  <span className="font-semibold mr-1">Funcionário(a):</span> {nomeFuncionario}
                </div>
              )}
            </div>

            {/* Cards de Resumo */}
            <div className={`grid grid-cols-1 md:grid-cols-3 ${isGenerating ? 'gap-3 mb-4' : 'gap-4 mb-6'}`}>
              <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-3 ${isGenerating ? 'p-3' : 'p-5'}`}>
                <div className={`bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400 ${isGenerating ? 'p-2' : 'p-3'}`}>
                  <Calendar className={isGenerating ? 'w-5 h-5' : 'w-6 h-6'} />
                </div>
                <div>
                  <p className={`text-slate-500 dark:text-slate-400 font-medium ${isGenerating ? 'text-xs' : 'text-sm'}`}>Período</p>
                  <p className={`font-bold text-slate-800 dark:text-white ${isGenerating ? 'text-sm' : 'text-lg'}`}>{calculo.admissaoStr} a {calculo.saidaStr}</p>
                </div>
              </div>
              
              <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-3 ${isGenerating ? 'p-3' : 'p-5'}`}>
                <div className={`bg-purple-100 dark:bg-purple-900/40 rounded-lg text-purple-600 dark:text-purple-400 ${isGenerating ? 'p-2' : 'p-3'}`}>
                  <Clock className={isGenerating ? 'w-5 h-5' : 'w-6 h-6'} />
                </div>
                <div>
                  <p className={`text-slate-500 dark:text-slate-400 font-medium ${isGenerating ? 'text-xs' : 'text-sm'}`}>Tempo de Empresa</p>
                  <p className={`font-bold text-slate-800 dark:text-white ${isGenerating ? 'text-sm' : 'text-lg'}`}>{calculo.textoTempo}</p>
                </div>
              </div>

              <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-3 ${isGenerating ? 'p-3' : 'p-5'}`}>
                <div className={`bg-green-100 dark:bg-green-900/40 rounded-lg text-green-600 dark:text-green-400 ${isGenerating ? 'p-2' : 'p-3'}`}>
                  <DollarSign className={isGenerating ? 'w-5 h-5' : 'w-6 h-6'} />
                </div>
                <div>
                  <p className={`text-slate-500 dark:text-slate-400 font-medium ${isGenerating ? 'text-xs' : 'text-sm'}`}>Salário Base</p>
                  <p className={`font-bold text-slate-800 dark:text-white ${isGenerating ? 'text-sm' : 'text-lg'}`}>{formatadorMoeda.format(calculo.salario)}</p>
                </div>
              </div>
            </div>

            {/* Seção Principal */}
            <div className={`grid grid-cols-1 lg:grid-cols-2 ${isGenerating ? 'gap-4' : 'gap-6'}`}>
              
              {/* Coluna Esquerda: Detalhamento */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className={`border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/80 ${isGenerating ? 'p-3' : 'p-5'}`}>
                  <h2 className={`font-semibold flex items-center text-slate-800 dark:text-white ${isGenerating ? 'text-base' : 'text-lg'}`}>
                    <DollarSign className={`${isGenerating ? 'w-4 h-4' : 'w-5 h-5'} mr-2 text-slate-500 dark:text-slate-400`} />
                    Memória de Cálculo
                  </h2>
                </div>
                
                <div className={`${isGenerating ? 'p-4' : 'p-5'} flex flex-col flex-grow justify-between`}>
                  <div className={isGenerating ? 'mb-3' : 'mb-5'}>
                    <h3 className={`font-bold text-green-700 dark:text-green-400 uppercase tracking-wider flex items-center ${isGenerating ? 'text-[10px] mb-2' : 'text-sm mb-3'}`}>
                      <TrendingUp className={`${isGenerating ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} /> Valores a Receber (Proventos)
                    </h3>
                    <ul className="space-y-1.5">
                      {calculo.proventos.map((item, idx) => (
                        <li key={idx} className={`flex justify-between text-slate-600 dark:text-slate-300 ${isGenerating ? 'text-xs' : 'text-sm'}`}>
                          <span>{item.nome}</span>
                          <span className="font-medium text-slate-800 dark:text-white">{formatadorMoeda.format(item.valor)}</span>
                        </li>
                      ))}
                      <li className={`flex justify-between font-bold text-slate-800 dark:text-white border-t border-slate-100 dark:border-slate-700/50 ${isGenerating ? 'pt-2 mt-2 text-xs' : 'pt-3 mt-3 text-sm'}`}>
                        <span>Total Bruto</span>
                        <span className="text-green-600 dark:text-green-400">{formatadorMoeda.format(calculo.totalProventos)}</span>
                      </li>
                    </ul>
                  </div>

                  <div className={isGenerating ? 'mb-3' : 'mb-5'}>
                    <h3 className={`font-bold text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center ${isGenerating ? 'text-[10px] mb-2' : 'text-sm mb-3'}`}>
                      <TrendingDown className={`${isGenerating ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} /> Descontos (Impostos)
                    </h3>
                    <ul className="space-y-1.5">
                      {calculo.descontos.map((item, idx) => (
                        <li key={idx} className={`flex justify-between text-slate-600 dark:text-slate-300 ${isGenerating ? 'text-xs' : 'text-sm'}`}>
                          <span>{item.nome}</span>
                          <span className="font-medium text-red-500 dark:text-red-400">- {formatadorMoeda.format(item.valor)}</span>
                        </li>
                      ))}
                      <li className={`flex justify-between font-bold text-slate-800 dark:text-white border-t border-slate-100 dark:border-slate-700/50 ${isGenerating ? 'pt-2 mt-2 text-xs' : 'pt-3 mt-3 text-sm'}`}>
                        <span>Total de Descontos</span>
                        <span className="text-red-600 dark:text-red-400">- {formatadorMoeda.format(calculo.totalDescontos)}</span>
                      </li>
                    </ul>
                  </div>

                  {/* NOVO BLOCO DE FGTS (Aparece apenas na dispensa) */}
                  {calculo.isDispensa && (
                    <div className={`bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/50 ${isGenerating ? 'p-2' : 'p-3'}`}>
                      <h3 className={`font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center ${isGenerating ? 'text-[10px] mb-1' : 'text-xs mb-2'}`}>
                        <PiggyBank className={`${isGenerating ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} /> FGTS Liberado
                      </h3>
                      <ul className="space-y-1">
                        <li className={`flex justify-between text-blue-700 dark:text-blue-200 ${isGenerating ? 'text-[10px]' : 'text-xs'}`}>
                          <span>Saldo Base Acumulado {calculo.fgts.estimado && '(Estimado)'}</span>
                          <span className="font-medium">{formatadorMoeda.format(calculo.fgts.base)}</span>
                        </li>
                        <li className={`flex justify-between text-blue-700 dark:text-blue-200 ${isGenerating ? 'text-[10px]' : 'text-xs'}`}>
                          <span>Multa de 40%</span>
                          <span className="font-medium">{formatadorMoeda.format(calculo.fgts.multa)}</span>
                        </li>
                        <li className={`flex justify-between font-bold text-blue-900 dark:text-blue-100 border-t border-blue-200 dark:border-blue-800/50 ${isGenerating ? 'pt-1 mt-1 text-xs' : 'pt-2 mt-2 text-sm'}`}>
                          <span>Total FGTS a Sacar</span>
                          <span>{formatadorMoeda.format(calculo.fgts.total)}</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna Direita: Cenários */}
              <div className={isGenerating ? 'space-y-3' : 'space-y-6'}>
                <h2 className={`font-bold text-slate-800 dark:text-white px-1 ${isGenerating ? 'text-base' : 'text-xl'}`}>
                  {calculo.cenarios.unico ? 'Resumo da Rescisão' : 'Seus Cenários de Saída'}
                </h2>
                
                <div className={`rounded-xl border bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 shadow-sm relative overflow-hidden ${isGenerating ? 'p-4' : 'p-6'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className={`font-bold text-emerald-800 dark:text-emerald-300 flex items-center ${isGenerating ? 'text-base' : 'text-lg'}`}>
                        <CheckCircle2 className={`${isGenerating ? 'w-5 h-5' : 'w-6 h-6'} text-emerald-600 dark:text-emerald-400`} />
                        <span className="ml-2">{calculo.cenarios.t1}</span>
                      </h3>
                      <p className={`text-emerald-700 dark:text-emerald-400 mt-1 opacity-80 ${isGenerating ? 'text-[10px]' : 'text-sm'}`}>{calculo.cenarios.d1}</p>
                    </div>
                  </div>
                  <div className={`border-t border-emerald-200/50 dark:border-emerald-800/50 ${isGenerating ? 'mt-3 pt-3' : 'mt-4 pt-4'}`}>
                    <p className={`font-medium text-emerald-800 dark:text-emerald-300 mb-1 ${isGenerating ? 'text-xs' : 'text-sm'}`}>Líquido Final no seu Bolso (Total):</p>
                    <p className={`font-black text-emerald-600 dark:text-emerald-400 ${isGenerating ? 'text-2xl' : 'text-4xl'}`}>
                      {formatadorMoeda.format(calculo.cenarios.l1)}
                    </p>
                  </div>
                </div>

                {!calculo.cenarios.unico && (
                  <div className={`rounded-xl border ${calculo.cenarios.isDescC2 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/50' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50'} shadow-sm relative overflow-hidden ${isGenerating ? 'p-4' : 'p-6'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className={`font-bold ${calculo.cenarios.isDescC2 ? 'text-orange-800 dark:text-orange-300' : 'text-blue-800 dark:text-blue-300'} flex items-center ${isGenerating ? 'text-base' : 'text-lg'}`}>
                          {calculo.cenarios.isDescC2 ? 
                            <XCircle className={`${isGenerating ? 'w-5 h-5' : 'w-6 h-6'} text-orange-600 dark:text-orange-400`} /> : 
                            <CheckCircle2 className={`${isGenerating ? 'w-5 h-5' : 'w-6 h-6'} text-blue-600 dark:text-blue-400`} />
                          }
                          <span className="ml-2">{calculo.cenarios.t2}</span>
                        </h3>
                        <p className={`${calculo.cenarios.isDescC2 ? 'text-orange-700 dark:text-orange-400' : 'text-blue-700 dark:text-blue-300'} mt-1 opacity-80 ${isGenerating ? 'text-[10px]' : 'text-sm'}`}>{calculo.cenarios.d2}</p>
                      </div>
                    </div>
                    <div className={`font-medium inline-block rounded-lg ${isGenerating ? 'px-2 py-1 text-[10px] mb-2' : 'px-3 py-1.5 text-xs mb-3'} ${calculo.cenarios.isDescC2 ? 'bg-red-100/50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                      {calculo.cenarios.isDescC2 ? 'Multa/Desconto de ' : 'Acréscimo (Salário Extra) de '} 
                      {formatadorMoeda.format(calculo.cenarios.valC2)}
                    </div>
                    <div className={`border-t ${calculo.cenarios.isDescC2 ? 'border-orange-200/50 dark:border-orange-800/50' : 'border-blue-200/50 dark:border-blue-800/50'} ${isGenerating ? 'mt-1 pt-3' : 'mt-2 pt-4'}`}>
                      <p className={`font-medium ${calculo.cenarios.isDescC2 ? 'text-orange-800 dark:text-orange-300' : 'text-blue-800 dark:text-blue-300'} mb-1 ${isGenerating ? 'text-xs' : 'text-sm'}`}>Líquido Final no seu Bolso (Total):</p>
                      <p className={`font-black ${calculo.cenarios.isDescC2 ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'} ${isGenerating ? 'text-2xl' : 'text-4xl'}`}>
                        {formatadorMoeda.format(Math.max(0, calculo.cenarios.l2))}
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Quadro de Prazo */}
            <div className={`bg-slate-800 dark:bg-slate-950 rounded-xl shadow-md overflow-hidden text-white ${isGenerating ? 'mt-4' : 'mt-6'}`}>
              <div className={`md:flex items-center justify-between ${isGenerating ? 'p-4' : 'p-6'}`}>
                <div className="flex items-start space-x-3">
                  <div className="bg-slate-700 dark:bg-slate-800 p-2 rounded-full mt-1">
                    <Calendar className={`${isGenerating ? 'w-5 h-5' : 'w-8 h-8'} text-blue-400`} />
                  </div>
                  <div>
                    <h3 className={`${isGenerating ? 'text-base' : 'text-xl'} font-bold`}>Prazo Legal para Pagamento</h3>
                    <p className={`text-slate-300 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed ${isGenerating ? 'text-[10px]' : 'text-sm'}`}>
                      Pelo <strong className="text-white">Art. 477 da CLT</strong>, a empresa tem o prazo de <strong>10 dias corridos</strong> após a saída para efetuar o pagamento.
                    </p>
                  </div>
                </div>
                <div className={`text-left md:text-right border-t md:border-t-0 border-slate-700 dark:border-slate-800 min-w-[150px] ${isGenerating ? 'mt-3 md:mt-0 pt-3 md:pt-0' : 'mt-6 md:mt-0 pt-4 md:pt-0'}`}>
                  <p className={`text-slate-400 font-medium uppercase tracking-wider mb-1 ${isGenerating ? 'text-[10px]' : 'text-xs'}`}>Data Limite</p>
                  <p className={`font-black text-blue-400 ${isGenerating ? 'text-xl' : 'text-3xl'}`}>{calculo.prazoPagamentoStr}</p>
                </div>
              </div>
              <div className={`bg-slate-900 dark:bg-slate-900/50 flex items-center text-slate-300 ${isGenerating ? 'px-4 py-2 text-[10px]' : 'px-6 py-3 text-sm'}`}>
                <AlertTriangle className={`${isGenerating ? 'w-3 h-3' : 'w-5 h-5'} mr-2 text-yellow-500 flex-shrink-0`} />
                <span>
                  <strong className="text-white">Multa por atraso:</strong> Indenização extra de {formatadorMoeda.format(calculo.salario)}.
                </span>
              </div>
            </div>

          </div>
        )}

        {/* --- RODAPÉ / COPY DA PÁGINA --- */}
        <footer className="mt-8 pb-4 text-center text-slate-400 dark:text-slate-500 text-sm print:hidden">
          <p>
            &copy; {new Date().getFullYear()} Desenvolvido por <strong className="text-slate-500 dark:text-slate-400">João Vitor Coutinho</strong>. Todos os direitos reservados.
          </p>
        </footer>

      </div>
    </div>
  );
}
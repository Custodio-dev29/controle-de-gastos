class ControleGastos {
    constructor() {
        this.transacoes = this.carregarDados('transacoes');
        this.despesasFixas = this.carregarDados('despesasFixas');
        this.despesasCartao = this.carregarDados('despesasCartao');
        this.config = this.carregarDados('config')[0] || {
            diaFixas: 10,
            diaCartao: 10,
            parcInicio: 'atual'
        };
        this.inicializar();
    }

    inicializar() {
        this.form = document.getElementById('form-transacao');
        this.listaTransacoes = document.getElementById('lista-transacoes');
        this.mensagemVazia = document.getElementById('mensagem-vazia');
        this.filtroTipo = document.getElementById('filtro-tipo');
        this.filtroCategoria = document.getElementById('filtro-categoria');
        this.tipoSelect = document.getElementById('tipo');

        this.camposFixas = document.getElementById('campos-fixas');
        this.camposParceladas = document.getElementById('campos-parceladas');
        this.camposDataNormal = document.getElementById('campos-data-normal');

        document.getElementById('data').valueAsDate = new Date();

        this.form.addEventListener('submit', (e) => this.adicionarTransacao(e));
        this.filtroTipo.addEventListener('change', () => this.renderizarTransacoes());
        this.filtroCategoria.addEventListener('change', () => this.renderizarTransacoes());
        this.tipoSelect.addEventListener('change', () => this.atualizarCamposTipo());

        this.inicializarMenu();
        this.inicializarConfig();
        this.aplicarConfig();
        this.mostrarSecao('adicionar');
        this.renderizarTransacoes();
        this.renderizarFixas();
        this.renderizarCartao();
        this.renderizarPerspectiva();
        this.atualizarResumo();
    }

    inicializarMenu() {
        const hamburger = document.getElementById('menu-hamburger');
        const menuLateral = document.getElementById('menu-lateral');
        const menuOverlay = document.getElementById('menu-overlay');
        const menuFechar = document.getElementById('menu-fechar');

        const toggleMenu = () => {
            hamburger.classList.toggle('ativo');
            menuLateral.classList.toggle('ativo');
            document.body.style.overflow = menuLateral.classList.contains('ativo') ? 'hidden' : '';
        };

        hamburger.addEventListener('click', toggleMenu);
        menuOverlay.addEventListener('click', toggleMenu);
        menuFechar.addEventListener('click', toggleMenu);

        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                this.mostrarSecao(item.dataset.secao);
                toggleMenu();
            });
        });
    }

    inicializarConfig() {
        document.getElementById('config-dia-fixas').value = this.config.diaFixas;
        document.getElementById('config-dia-cartao').value = this.config.diaCartao;
        document.getElementById('config-parc-inicio').value = this.config.parcInicio;

        document.getElementById('btn-salvar-config').addEventListener('click', () => {
            this.config.diaFixas = parseInt(document.getElementById('config-dia-fixas').value);
            this.config.diaCartao = parseInt(document.getElementById('config-dia-cartao').value);
            this.config.parcInicio = document.getElementById('config-parc-inicio').value;
            localStorage.setItem('config', JSON.stringify([this.config]));
            this.aplicarConfig();
            alert('Configurações salvas!');
        });
    }

    aplicarConfig() {
        document.getElementById('fixa-dia').value = this.config.diaFixas;
        document.getElementById('cartao-vencimento').value = this.config.diaCartao;

        const parcAtual = document.getElementById('cartao-parc-atual');
        if (this.config.parcInicio === 'atual') {
            parcAtual.disabled = true;
            parcAtual.value = 1;
        } else {
            parcAtual.disabled = false;
        }
    }

    atualizarCamposTipo() {
        const tipo = this.tipoSelect.value;
        this.camposFixas.style.display = tipo === 'fixa' ? 'block' : 'none';
        this.camposParceladas.style.display = tipo === 'parcelada' ? 'block' : 'none';
        this.camposDataNormal.style.display = (tipo === 'receita' || tipo === 'despesa') ? 'block' : 'none';
        document.getElementById('data').required = (tipo === 'receita' || tipo === 'despesa');
    }

    mostrarSecao(secaoId) {
        document.querySelectorAll('.secao').forEach(s => s.classList.remove('ativa'));
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('ativo'));
        const secao = document.getElementById(`secao-${secaoId}`);
        if (secao) secao.classList.add('ativa');
        const menuItem = document.querySelector(`[data-secao="${secaoId}"]`);
        if (menuItem) menuItem.classList.add('ativo');
    }

    carregarDados(chave) {
        const dados = localStorage.getItem(chave);
        return dados ? JSON.parse(dados) : [];
    }

    salvarDados(chave, dados) {
        localStorage.setItem(chave, JSON.stringify(dados));
    }

    formatarValor(valor) {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    formatarData(data) {
        return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
    }

    obterNomeCategoria(cat) {
        const c = {
            salario: 'Salário', freelance: 'Freelance', investimentos: 'Investimentos',
            alimentacao: 'Alimentação', transporte: 'Transporte', moradia: 'Moradia',
            saude: 'Saúde', lazer: 'Lazer', educacao: 'Educação', outros: 'Outros'
        };
        return c[cat] || cat;
    }

    obterDataAtual() {
        return new Date().toISOString().split('T')[0];
    }

    adicionarTransacao(e) {
        e.preventDefault();
        const tipo = this.tipoSelect.value;

        if (tipo === 'fixa') return this.adicionarFixa();
        if (tipo === 'parcelada') return this.adicionarParcelada();

        const descricao = document.getElementById('descricao').value.trim();
        const valor = parseFloat(document.getElementById('valor').value);
        const categoria = document.getElementById('categoria').value;
        const data = document.getElementById('data').value;

        if (!descricao || isNaN(valor) || valor <= 0 || !data) return;

        this.transacoes.push({
            id: Date.now(), descricao, valor, tipo, categoria, data
        });
        this.salvarDados('transacoes', this.transacoes);
        this.renderizarTransacoes();
        this.atualizarResumo();
        this.form.reset();
        this.tipoSelect.value = 'receita';
        this.atualizarCamposTipo();
        document.getElementById('data').valueAsDate = new Date();
    }

    adicionarFixa() {
        const descricao = document.getElementById('descricao').value.trim();
        const valor = parseFloat(document.getElementById('valor').value);
        const categoria = document.getElementById('categoria').value;
        const dia = parseInt(document.getElementById('fixa-dia').value);
        const data = document.getElementById('data-fixa').value || this.obterDataAtual();

        if (!descricao || isNaN(valor) || valor <= 0 || isNaN(dia)) return;

        this.despesasFixas.push({
            id: Date.now(), nome: descricao, valor, dia, categoria, data
        });
        this.salvarDados('despesasFixas', this.despesasFixas);
        this.renderizarFixas();
        this.atualizarResumo();
        this.form.reset();
        this.tipoSelect.value = 'receita';
        this.atualizarCamposTipo();
        document.getElementById('data').valueAsDate = new Date();
    }

    adicionarParcelada() {
        const descricao = document.getElementById('descricao').value.trim();
        const valor = parseFloat(document.getElementById('valor').value);
        const categoria = document.getElementById('categoria').value;
        const cartaoNome = document.getElementById('cartao-nome').value.trim();
        const parcTotal = parseInt(document.getElementById('cartao-parc-total').value);
        const parcAtual = parseInt(document.getElementById('cartao-parc-atual').value);
        const vencimento = parseInt(document.getElementById('cartao-vencimento').value);
        const data = document.getElementById('data-parcela').value || this.obterDataAtual();

        if (!descricao || !cartaoNome || isNaN(valor) || valor <= 0 ||
            isNaN(parcTotal) || parcTotal < 2 || isNaN(parcAtual) || isNaN(vencimento)) return;

        const dataLancamento = new Date(data + 'T00:00:00');
        const mesInicio = dataLancamento.getMonth() + 1;

        this.despesasCartao.push({
            id: Date.now(), nome: descricao, bandeira: cartaoNome, valor,
            vencimento, parcAtual, parcTotal, mesInicio, categoria
        });
        this.salvarDados('despesasCartao', this.despesasCartao);
        this.renderizarCartao();
        this.renderizarPerspectiva();
        this.atualizarResumo();
        this.form.reset();
        this.tipoSelect.value = 'receita';
        this.atualizarCamposTipo();
        document.getElementById('data').valueAsDate = new Date();
    }

    excluirTransacao(id) {
        this.transacoes = this.transacoes.filter(t => t.id !== id);
        this.salvarDados('transacoes', this.transacoes);
        this.renderizarTransacoes();
        this.atualizarResumo();
    }

    excluirFixa(id) {
        this.despesasFixas = this.despesasFixas.filter(f => f.id !== id);
        this.salvarDados('despesasFixas', this.despesasFixas);
        this.renderizarFixas();
        this.atualizarResumo();
    }

    excluirCartao(id) {
        this.despesasCartao = this.despesasCartao.filter(c => c.id !== id);
        this.salvarDados('despesasCartao', this.despesasCartao);
        this.renderizarCartao();
        this.renderizarPerspectiva();
        this.atualizarResumo();
    }

    obterTransacoesFiltradas() {
        let filtradas = [...this.transacoes];
        const tf = this.filtroTipo.value;
        const cf = this.filtroCategoria.value;
        if (tf !== 'todos') filtradas = filtradas.filter(t => t.tipo === tf);
        if (cf !== 'todas') filtradas = filtradas.filter(t => t.categoria === cf);
        return filtradas.sort((a, b) => new Date(b.data) - new Date(a.data));
    }

    renderizarTransacoes() {
        const filtradas = this.obterTransacoesFiltradas();
        this.listaTransacoes.innerHTML = '';
        if (filtradas.length === 0) {
            this.mensagemVazia.style.display = 'block';
            return;
        }
        this.mensagemVazia.style.display = 'none';
        filtradas.forEach(t => {
            const li = document.createElement('li');
            li.className = 'transacao-item';
            li.innerHTML = `
                <div class="transacao-info">
                    <div class="transacao-descricao">${t.descricao}</div>
                    <div class="transacao-detalhes">
                        ${this.obterNomeCategoria(t.categoria)} • ${this.formatarData(t.data)}
                    </div>
                </div>
                <span class="transacao-valor ${t.tipo}">
                    ${t.tipo === 'receita' ? '+' : '-'}${this.formatarValor(t.valor)}
                </span>
                <button class="btn-excluir" onclick="app.excluirTransacao(${t.id})">Excluir</button>
            `;
            this.listaTransacoes.appendChild(li);
        });
    }

    renderizarFixas() {
        const lista = document.getElementById('lista-fixas');
        const msg = document.getElementById('mensagem-vazia-fixas');
        const container = document.getElementById('lista-fixas-container');
        lista.innerHTML = '';

        if (this.despesasFixas.length === 0) {
            container.style.display = 'none';
            return;
        }
        container.style.display = 'block';
        msg.style.display = 'none';

        this.despesasFixas.sort((a, b) => a.dia - b.dia).forEach(f => {
            const li = document.createElement('li');
            li.className = 'despesa-item';
            li.innerHTML = `
                <div class="despesa-info">
                    <div class="despesa-nome">${f.nome}</div>
                    <div class="despesa-detalhes">Dia ${f.dia} • ${this.obterNomeCategoria(f.categoria)}</div>
                </div>
                <span class="despesa-valor">${this.formatarValor(f.valor)}</span>
                <button class="btn-excluir" onclick="app.excluirFixa(${f.id})">Excluir</button>
            `;
            lista.appendChild(li);
        });
    }

    renderizarCartao() {
        const lista = document.getElementById('lista-cartao');
        const msg = document.getElementById('mensagem-vazia-cartao');
        const container = document.getElementById('lista-parcelas-container');
        lista.innerHTML = '';

        if (this.despesasCartao.length === 0) {
            container.style.display = 'none';
            return;
        }
        container.style.display = 'block';
        msg.style.display = 'none';

        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const anoAtual = new Date().getFullYear();

        this.despesasCartao.sort((a, b) => a.vencimento - b.vencimento).forEach(c => {
            const mesInicio = c.mesInicio || 1;
            const parcRestante = c.parcTotal - c.parcAtual + 1;
            const mesFinal = mesInicio + parcRestante - 1;

            const li = document.createElement('li');
            li.className = 'despesa-item';
            li.innerHTML = `
                <div class="despesa-info">
                    <div class="despesa-nome">${c.nome}</div>
                    <div class="despesa-detalhes">
                        ${c.bandeira} • Dia ${c.vencimento} • ${this.obterNomeCategoria(c.categoria)}
                    </div>
                    <div class="despesa-parc">
                        Parcela ${c.parcAtual}/${c.parcTotal} •
                        ${meses[mesInicio - 1]} → ${meses[(mesFinal - 1) % 12]}
                    </div>
                </div>
                <span class="despesa-valor">${this.formatarValor(c.valor)}</span>
                <button class="btn-excluir" onclick="app.excluirCartao(${c.id})">Excluir</button>
            `;
            lista.appendChild(li);
        });
    }

    renderizarPerspectiva() {
        const container = document.getElementById('perspectiva-meses');
        const listaMeses = document.getElementById('lista-meses');
        if (this.despesasCartao.length === 0) { container.style.display = 'none'; return; }
        container.style.display = 'block';
        listaMeses.innerHTML = '';

        const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

        const agora = new Date();
        const mesAtual = agora.getMonth() + 1;
        const anoAtual = agora.getFullYear();
        const dadosMeses = {};

        for (let i = 0; i < 12; i++) {
            const mes = ((mesAtual - 1 + i) % 12) + 1;
            const ano = anoAtual + Math.floor((mesAtual - 1 + i) / 12);
            const chave = `${ano}-${mes}`;
            dadosMeses[chave] = { mes, ano, nome: `${mesesesNomes[mes - 1]} ${ano}`, itens: [], total: 0 };
        }

        this.despesasCartao.forEach(c => {
            const mesInicio = c.mesInicio || 1;
            const parcRestante = c.parcTotal - c.parcAtual + 1;
            for (let p = 0; p < parcRestante; p++) {
                const mp = ((mesInicio - 1 + p) % 12) + 1;
                const ap = anoAtual + Math.floor((mesInicio - 1 + p) / 12);
                const chave = `${ap}-${mp}`;
                if (dadosMeses[chave]) {
                    dadosMeses[chave].itens.push({
                        nome: c.nome, valor: c.valor,
                        parcAtual: c.parcAtual + p, parcTotal: c.parcTotal
                    });
                    dadosMeses[chave].total += c.valor;
                }
            }
        });

        Object.values(dadosMeses).forEach(dados => {
            if (dados.itens.length === 0) return;
            const card = document.createElement('div');
            card.className = 'mes-card';
            if (dados.mes === mesAtual && dados.ano === anoAtual) card.classList.add('mes-atual');
            card.innerHTML = `
                <div class="mes-header">
                    <span class="mes-nome">${dados.nome}</span>
                    <span class="mes-total">-${this.formatarValor(dados.total)}</span>
                </div>
                <div class="mes-itens">
                    ${dados.itens.map(i => `
                        <div class="mes-item">
                            <span class="mes-item-nome">${i.nome}</span>
                            <span class="mes-item-parc">${i.parcAtual}/${i.parcTotal}</span>
                            <span class="mes-item-valor">-${this.formatarValor(i.valor)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            listaMeses.appendChild(card);
        });
    }

    atualizarResumo() {
        const receitas = this.transacoes.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0);
        const despesasTransacoes = this.transacoes.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0);
        const totalFixas = this.despesasFixas.reduce((a, f) => a + f.valor, 0);
        const totalCartao = this.despesasCartao.reduce((a, c) => a + c.valor, 0);
        const totalDespesas = despesasTransacoes + totalFixas + totalCartao;
        const saldo = receitas - totalDespesas;

        document.getElementById('total-receitas').textContent = this.formatarValor(receitas);
        document.getElementById('total-despesas').textContent = this.formatarValor(totalDespesas);
        document.getElementById('saldo').textContent = this.formatarValor(saldo);

        document.getElementById('total-receitas-hist').textContent = this.formatarValor(receitas);
        document.getElementById('total-despesas-hist').textContent = this.formatarValor(totalDespesas);
        document.getElementById('saldo-hist').textContent = this.formatarValor(saldo);

        const corSaldo = saldo >= 0 ? '#1e3a5f' : '#c0392b';
        document.getElementById('saldo').style.color = corSaldo;
        document.getElementById('saldo-hist').style.color = corSaldo;
    }

    exportarJSON() {
        const dados = {
            transacoes: this.transacoes,
            despesasFixas: this.despesasFixas,
            despesasCartao: this.despesasCartao,
            config: [this.config]
        };
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-gastos-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importarJSON(event) {
        const arquivo = event.target.files[0];
        if (!arquivo) return;

        const leitor = new FileReader();
        leitor.onload = (e) => {
            try {
                const dados = JSON.parse(e.target.result);
                if (dados.transacoes && Array.isArray(dados.transacoes)) {
                    this.transacoes = dados.transacoes;
                    this.despesasFixas = dados.despesasFixas || [];
                    this.despesasCartao = dados.despesasCartao || [];
                    if (dados.config && dados.config[0]) this.config = dados.config[0];
                } else if (Array.isArray(dados)) {
                    this.transacoes = dados;
                } else {
                    alert('Arquivo inválido.');
                    return;
                }
                this.salvarDados('transacoes', this.transacoes);
                this.salvarDados('despesasFixas', this.despesasFixas);
                this.salvarDados('despesasCartao', this.despesasCartao);
                localStorage.setItem('config', JSON.stringify([this.config]));
                this.aplicarConfig();
                this.renderizarTransacoes();
                this.renderizarFixas();
                this.renderizarCartao();
                this.renderizarPerspectiva();
                this.atualizarResumo();
                alert('Backup importado com sucesso!');
            } catch (err) {
                alert('Erro ao ler o arquivo.');
            }
        };
        leitor.readAsText(arquivo);
        event.target.value = '';
    }

    gerarRelatorioPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const receitas = this.transacoes.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0);
        const despesasTransacoes = this.transacoes.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0);
        const totalFixas = this.despesasFixas.reduce((a, f) => a + f.valor, 0);
        const totalCartao = this.despesasCartao.reduce((a, c) => a + c.valor, 0);
        const totalDespesas = despesasTransacoes + totalFixas + totalCartao;
        const saldo = receitas - totalDespesas;

        doc.setFontSize(20);
        doc.setTextColor(30, 58, 95);
        doc.text('Relatório de Gastos', 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 28, { align: 'center' });
        doc.setDrawColor(30, 58, 95);
        doc.line(20, 32, 190, 32);

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text('Resumo Financeiro', 20, 42);
        doc.setFontSize(11);
        doc.text(`Total de Receitas: R$ ${receitas.toFixed(2).replace('.', ',')}`, 20, 52);
        doc.setTextColor(45, 106, 79);
        doc.text(`+ R$ ${receitas.toFixed(2).replace('.', ',')}`, 140, 52);
        doc.setTextColor(0);
        doc.text(`Total de Despesas: R$ ${totalDespesas.toFixed(2).replace('.', ',')}`, 20, 60);
        doc.setTextColor(192, 57, 43);
        doc.text(`- R$ ${totalDespesas.toFixed(2).replace('.', ',')}`, 140, 60);
        doc.setTextColor(0);
        doc.setFontSize(12);
        doc.text(`Saldo: R$ ${saldo.toFixed(2).replace('.', ',')}`, 20, 72);

        let y = 86;

        if (this.despesasFixas.length > 0) {
            doc.setFontSize(12); doc.setTextColor(0);
            doc.text('Despesas Fixas', 20, y); y += 6;
            doc.autoTable({
                startY: y,
                head: [['Nome', 'Vencimento', 'Categoria', 'Valor']],
                body: this.despesasFixas.map(f => [f.nome, `Dia ${f.dia}`, this.obterNomeCategoria(f.categoria), `R$ ${f.valor.toFixed(2).replace('.', ',')}`]),
                theme: 'grid', headStyles: { fillColor: [230, 126, 34] },
                styles: { fontSize: 9 }, columnStyles: { 3: { cellWidth: 30, halign: 'right' } }
            });
            y = doc.lastAutoTable.finalY + 12;
        }

        if (this.despesasCartao.length > 0) {
            doc.setFontSize(12); doc.setTextColor(0);
            doc.text('Despesas de Cartão', 20, y); y += 6;
            doc.autoTable({
                startY: y,
                head: [['Compra', 'Cartão', 'Parcelas', 'Vencimento', 'Valor']],
                body: this.despesasCartao.map(c => [c.nome, c.bandeira, `${c.parcAtual}/${c.parcTotal}`, `Dia ${c.vencimento}`, `R$ ${c.valor.toFixed(2).replace('.', ',')}`]),
                theme: 'grid', headStyles: { fillColor: [142, 68, 173] },
                styles: { fontSize: 9 }, columnStyles: { 4: { cellWidth: 25, halign: 'right' } }
            });
            y = doc.lastAutoTable.finalY + 12;
        }

        if (this.transacoes.length > 0) {
            if (y > 240) { doc.addPage(); y = 20; }
            doc.setFontSize(12); doc.setTextColor(0);
            doc.text('Transações', 20, y); y += 6;
            doc.autoTable({
                startY: y,
                head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
                body: this.transacoes.sort((a, b) => new Date(a.data) - new Date(b.data))
                    .map(t => [this.formatarData(t.data), t.descricao, this.obterNomeCategoria(t.categoria),
                        t.tipo === 'receita' ? 'Receita' : 'Despesa',
                        `${t.tipo === 'receita' ? '+' : '-'}R$ ${t.valor.toFixed(2).replace('.', ',')}`]),
                theme: 'grid', headStyles: { fillColor: [30, 58, 95] },
                styles: { fontSize: 9 }, columnStyles: { 4: { cellWidth: 30, halign: 'right' } }
            });
        }

        doc.save(`relatorio-gastos-${new Date().toISOString().split('T')[0]}.pdf`);
    }
}

const app = new ControleGastos();
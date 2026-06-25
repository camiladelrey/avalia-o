/**
 * ========================================================
 * CYBERPASS - main.js
 * ========================================================
 * Gerador de senhas com Web Crypto API
 * Estilo Neon Futurista
 * ========================================================
 */

(function() {
    'use strict';

    // ---------- ELEMENTOS DOM ----------
    const senhaInput = document.getElementById('senhaInput');
    const gerarBtn = document.getElementById('gerarBtn');
    const copiarBtn = document.getElementById('copiarBtn');
    const toggleVisib = document.getElementById('toggleVisibilidade');
    const tamanhoSlider = document.getElementById('tamanhoSlider');
    const tamanhoValor = document.getElementById('tamanhoValor');
    const forcaBarra = document.getElementById('forcaBarra');
    const forcaLabel = document.getElementById('forcaLabel');
    const listaHist = document.getElementById('listaHistorico');
    const limparHistBtn = document.getElementById('limparHistorico');
    const toast = document.getElementById('toast');
    const contadorHist = document.getElementById('contadorHist');
    const bitsDisplay = document.getElementById('bitsDisplay');
    const timestamp = document.getElementById('timestamp');

    // Checkboxes
    const chkMaiusculas = document.getElementById('chkMaiusculas');
    const chkMinusculas = document.getElementById('chkMinusculas');
    const chkNumeros = document.getElementById('chkNumeros');
    const chkSimbolos = document.getElementById('chkSimbolos');

    // ---------- CONSTANTES ----------
    const CHARS = {
        maiusculas: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        minusculas: 'abcdefghijklmnopqrstuvwxyz',
        numeros: '0123456789',
        simbolos: '!@#$%^&*()_+-=[]{}|;:,.<>?/~'
    };

    // ---------- ESTADO ----------
    let senhaAtual = '';
    let historico = [];

    // ---------- TIMESTAMP ----------
    function atualizarTimestamp() {
        if (timestamp) {
            const agora = new Date();
            timestamp.textContent = agora.toLocaleTimeString('pt-BR');
        }
    }
    setInterval(atualizarTimestamp, 1000);
    atualizarTimestamp();

    // ---------- CARREGAR HISTÓRICO ----------
    function carregarHistorico() {
        try {
            const dados = sessionStorage.getItem('historicoSenhasNeon');
            if (dados) {
                historico = JSON.parse(dados);
                if (!Array.isArray(historico)) historico = [];
            }
        } catch (_) {
            historico = [];
        }
        if (historico.length > 5) historico = historico.slice(0, 5);
        renderizarHistorico();
    }

    function salvarHistorico() {
        try {
            if (historico.length > 5) historico = historico.slice(0, 5);
            sessionStorage.setItem('historicoSenhasNeon', JSON.stringify(historico));
        } catch (_) { /* ignora */ }
        renderizarHistorico();
    }

    // ---------- RENDERIZAR HISTÓRICO ----------
    function renderizarHistorico() {
        if (!listaHist) return;
        if (historico.length === 0) {
            listaHist.innerHTML = '<div class="log-empty">⏳ Aguardando geração...</div>';
            if (contadorHist) contadorHist.textContent = '0';
            return;
        }
        let html = '';
        historico.forEach((senha, index) => {
            const safe = senha.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            html += `
                <span class="chip-senha">
                    ${safe}
                    <button data-index="${index}" class="copiarChip" title="Copiar">📋</button>
                </span>
            `;
        });
        listaHist.innerHTML = html;
        if (contadorHist) contadorHist.textContent = historico.length;

        document.querySelectorAll('.copiarChip').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const idx = parseInt(this.getAttribute('data-index'), 10);
                if (!isNaN(idx) && historico[idx]) {
                    copiarSenha(historico[idx]);
                }
            });
        });
    }

    // ---------- ADICIONAR AO HISTÓRICO ----------
    function adicionarHistorico(senha) {
        if (!senha || senha.length === 0) return;
        historico = historico.filter(item => item !== senha);
        historico.unshift(senha);
        if (historico.length > 5) historico.pop();
        salvarHistorico();
    }

    // ---------- LIMPAR HISTÓRICO ----------
    function limparHistorico() {
        historico = [];
        salvarHistorico();
        mostrarToast('🗑️ Histórico limpo');
    }

    // ---------- GERAR SENHA (CRIPTOGRAFICAMENTE SEGURA) ----------
    function gerarSenha() {
        const comprimento = parseInt(tamanhoSlider.value, 10);
        const usarMaius = chkMaiusculas.checked;
        const usarMinus = chkMinusculas.checked;
        const usarNumeros = chkNumeros.checked;
        const usarSimbolos = chkSimbolos.checked;

        if (!usarMaius && !usarMinus && !usarNumeros && !usarSimbolos) {
            mostrarToast('⚠️ Selecione pelo menos um tipo de caractere');
            return '';
        }

        let alfabeto = '';
        if (usarMaius) alfabeto += CHARS.maiusculas;
        if (usarMinus) alfabeto += CHARS.minusculas;
        if (usarNumeros) alfabeto += CHARS.numeros;
        if (usarSimbolos) alfabeto += CHARS.simbolos;

        const randomValues = new Uint32Array(comprimento);
        window.crypto.getRandomValues(randomValues);

        let senha =

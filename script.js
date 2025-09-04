// Calculadora Radiológica - KV, mAs e Tempo
class CalculadoraRadiologica {
    constructor() {
        this.idadeAtual = 'newborn';
        this.tipoFisicoAtual = 'm';
        this.regiaoAtual = 'chest';
        this.iniciarEventos();
        this.atualizarTipoFisico();
    }

    // Inicializa todos os eventos da interface
    iniciarEventos() {
        // Seleção de idade
        document.querySelectorAll('.age-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selecionarBotao('.age-btn', e.target.closest('.age-btn'));
                this.idadeAtual = e.target.closest('.age-btn').dataset.age;
                this.atualizarTipoFisico();
                if (this.idadeAtual === 'adult') {
                    document.getElementById('body-type-section').scrollIntoView({ behavior: 'smooth' });
                } else {
                    document.getElementById('general-regions').scrollIntoView({ behavior: 'smooth' });
                }
                this.calcular();
            });
        });

        // Seleção de tipo físico
        document.querySelectorAll('.body-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selecionarBotao('.body-btn', e.target.closest('.body-btn'));
                this.tipoFisicoAtual = e.target.closest('.body-btn').dataset.body;
                document.getElementById('general-regions').scrollIntoView({ behavior: 'smooth' });
                this.calcular();
            });
        });

        // Seleção de região geral
        document.querySelectorAll('[data-region]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selecionarBotao('[data-region]', e.target.closest('[data-region]'));
                const regiao = e.target.closest('[data-region]').dataset.region;
                this.mostrarRegiaoEspecifica(regiao);
                setTimeout(() => {
                    document.getElementById(`${regiao}-specific`).scrollIntoView({ behavior: 'smooth' });
                }, 200);
            });
        });

        // Seleção de região específica
        document.querySelectorAll('[data-bodypart]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selecionarBotao('[data-bodypart]', e.target.closest('[data-bodypart]'));
                this.regiaoAtual = e.target.closest('[data-bodypart]').dataset.bodypart;
                document.getElementById('calculateBtn').scrollIntoView({ behavior: 'smooth' });
                this.calcular();
            });
        });

        // Botão calcular
        document.getElementById('calculateBtn').addEventListener('click', () => {
            this.calcular();
        });
    }

    // Ativa o botão selecionado
    selecionarBotao(seletor, botaoAtivo) {
        document.querySelectorAll(seletor).forEach(btn => btn.classList.remove('active'));
        botaoAtivo.classList.add('active');
    }

    // Mostra ou oculta tipo físico conforme idade
    atualizarTipoFisico() {
        const secaoTipo = document.getElementById('body-type-section');
        if (this.idadeAtual === 'adult') {
            secaoTipo.style.display = 'block';
        } else {
            secaoTipo.style.display = 'none';
            this.tipoFisicoAtual = 'm';
        }
    }

    // Calcula e exibe os parâmetros radiológicos
    calcular() {
        const parametros = this.obterParametros();
        this.exibirResultados(parametros);
    }

    // Retorna os parâmetros calculados
    obterParametros() {
        const dadosRegiao = this.obterDadosRegiao();

        // Tórax adulto tem regra especial
        if (this.idadeAtual === 'adult' && (this.regiaoAtual === 'chest' || this.regiaoAtual === 'chest-ap')) {
            const torax = this.parametrosTorax();
            return {
                kv: torax.kv,
                ma: torax.ma,
                mAs: torax.mAs,
                tempo: torax.tempo,
                equipamento: dadosRegiao.equipamento || 'MURAL-BUCKY'
            };
        }

        // Parâmetros padrão
        const kvBase = 60.0 + (dadosRegiao.kvMod || 0.0);
        const maPadrao = 200.0;
        const tempoBase = dadosRegiao.tempoBase;

        // Correção por idade
        const idade = this.parametrosIdade();
        const kvIdade = (idade.kv - 60.0);
        let kvFinal = kvBase + kvIdade;
        let maFinal = idade.ma;
        let tempoFinal = tempoBase;

        // Correção por tipo físico (adulto)
        if (this.idadeAtual === 'adult') {
            const mod = this.modificadorTipoFisico();
            kvFinal += mod.kvMod;
            tempoFinal *= mod.tempoMod;
        }

        // Cálculo de mAs
        let mAs = maFinal * tempoFinal;

        // Sanitização dos valores
        const kv = Math.max(40, Math.min(150, Math.round(kvFinal * 10) / 10));
        let ma = maFinal <= 100 ? 100 : 200;
        const tempo = Math.max(0.001, Math.min(5.0, Math.round(tempoFinal * 10000) / 10000));

        return {
            kv,
            ma,
            mAs: Math.round(ma * tempo * 1000) / 1000,
            tempo,
            equipamento: dadosRegiao.equipamento || 'MESA'
        };
    }

    // Parâmetros por idade
    parametrosIdade() {
        return {
            newborn: { kv: 40.0, ma: 25.0 },
            '1a5': { kv: 47.0, ma: 45.0 },
            '5a10': { kv: 52.0, ma: 65.0 },
            '10a18': { kv: 57.0, ma: 90.0 },
            adult: { kv: 60.0, ma: 200.0 }
        }[this.idadeAtual] || { kv: 60.0, ma: 200.0 };
    }

    // Parâmetros por região corporal
    obterDadosRegiao() {
        return {
            'skull-ap': { kvMod: 8.0, tempoBase: 0.2000, equipamento: 'MURAL-BUCKY' },
            'skull-lat': { kvMod: 5.0, tempoBase: 0.2000, equipamento: 'MURAL-BUCKY' },
            'face-sinuses': { kvMod: 10.0, tempoBase: 0.1600, equipamento: 'MURAL-BUCKY' },
            'face-nose-lat': { kvMod: -18.0, tempoBase: 0.0400, equipamento: 'MESA' },
            'face-orbits': { kvMod: 8.0, tempoBase: 0.1600, equipamento: 'MURAL-BUCKY' },
            'face-mandible': { kvMod: 6.0, tempoBase: 0.2000, equipamento: 'MURAL-BUCKY' },
            'cavum': { kvMod: 8.0, tempoBase: 0.2000, equipamento: 'MURAL-BUCKY' },
            'ribs-ap': { kvMod: 28.0, tempoBase: 0.2500, equipamento: 'MESA-GRADE' },
            'ribs-lat': { kvMod: 38.0, tempoBase: 0.3500, equipamento: 'MESA-GRADE' },
            'ribs-oblique': { kvMod: 33.0, tempoBase: 0.3000, equipamento: 'MESA-GRADE' },
            'chest': { kvMod: 32.0, tempoBase: 0.0200, equipamento: 'MURAL-BUCKY' },
            'chest-lat': { kvMod: 52.0, tempoBase: 0.0400, equipamento: 'MURAL-BUCKY' },
            'chest-ap': { kvMod: 37.0, tempoBase: 0.0250, equipamento: 'MURAL-BUCKY' },
            'humerus-ap': { kvMod: -3.0, tempoBase: 0.0500, equipamento: 'MURAL-BUCKY' },
            'humerus-lat': { kvMod: -3.0, tempoBase: 0.0500, equipamento: 'MURAL-BUCKY' },
            'forearm-ap': { kvMod: -12.0, tempoBase: 0.0400, equipamento: 'MESA' },
            'forearm-lat': { kvMod: -12.0, tempoBase: 0.0400, equipamento: 'MESA' },
            'shoulder-ap': { kvMod: -10.0, tempoBase: 0.1600, equipamento: 'MURAL-BUCKY' },
            'shoulder-ax': { kvMod: -12.0, tempoBase: 0.2000, equipamento: 'MESA' },
            'shoulder-y': { kvMod: 0.0, tempoBase: 0.2000, equipamento: 'MURAL-BUCKY' },
            'shoulder-lat': { kvMod: -8.0, tempoBase: 0.1600, equipamento: 'MURAL-BUCKY' },
            'hand-pa': { kvMod: -22.0, tempoBase: 0.0320, equipamento: 'MESA' },
            'hand-lat': { kvMod: -22.0, tempoBase: 0.0320, equipamento: 'MESA' },
            'hand-oblique': { kvMod: -22.0, tempoBase: 0.0320, equipamento: 'MESA' },
            'wrist-pa': { kvMod: -22.0, tempoBase: 0.0320, equipamento: 'MESA' },
            'wrist-lat': { kvMod: -22.0, tempoBase: 0.0320, equipamento: 'MESA' },
            'wrist-oblique': { kvMod: -21.0, tempoBase: 0.0320, equipamento: 'MESA' },
            'abdomen-ap': { kvMod: 5.0, tempoBase: 0.2800, equipamento: 'MESA-GRADE' },
            'abdomen-lat': { kvMod: 5.0, tempoBase: 0.2800, equipamento: 'MURAL-BUCKY' },
            'abdomen-oblique': { kvMod: 7.0, tempoBase: 0.2600, equipamento: 'MESA-GRADE' },
            'pelvis-ap': { kvMod: 12.0, tempoBase: 0.2800, equipamento: 'MESA-GRADE' },
            'pelvis-lat': { kvMod: 17.0, tempoBase: 0.3000, equipamento: 'MESA-GRADE' },
            'pelvis-oblique': { kvMod: 14.0, tempoBase: 0.2800, equipamento: 'MESA-GRADE' },
            'femur-ap': { kvMod: 12.0, tempoBase: 0.0500, equipamento: 'MESA-GRADE' },
            'femur-lat': { kvMod: 12.0, tempoBase: 0.0500, equipamento: 'MESA-GRADE' },
            'leg-ap': { kvMod: -5.0, tempoBase: 0.0400, equipamento: 'MESA' },
            'leg-lat': { kvMod: -5.0, tempoBase: 0.0400, equipamento: 'MESA' },
            'foot-ap': { kvMod: -22.0, tempoBase: 0.0400, equipamento: 'MESA' },
            'foot-lat': { kvMod: -22.0, tempoBase: 0.0400, equipamento: 'MESA' },
            'foot-oblique': { kvMod: -22.0, tempoBase: 0.0400, equipamento: 'MESA' },
            'ankle-ap': { kvMod: -18.0, tempoBase: 0.0320, equipamento: 'MESA' },
            'ankle-lat': { kvMod: -20.0, tempoBase: 0.0320, equipamento: 'MESA' },
            'elbow-ap': { kvMod: -12.0, tempoBase: 0.0400, equipamento: 'MESA' },
            'elbow-lat': { kvMod: -12.0, tempoBase: 0.0400, equipamento: 'MESA' },
            'knee-ap': { kvMod: -3.0, tempoBase: 0.0500, equipamento: 'MESA-GRADE' },
            'knee-lat': { kvMod: -5.0, tempoBase: 0.0500, equipamento: 'MESA-GRADE' },
            'hip-ap': { kvMod: 17.0, tempoBase: 0.2000, equipamento: 'MESA-GRADE' },
            'hip-lat': { kvMod: 20.0, tempoBase: 0.2500, equipamento: 'MESA-GRADE' },
            'finger-ap': { kvMod: -26.0, tempoBase: 0.0320, equipamento: 'MESA' },
            'finger-lat': { kvMod: -26.0, tempoBase: 0.0320, equipamento: 'MESA' },
            'calcaneus': { kvMod: -18.0, tempoBase: 0.0320, equipamento: 'MESA' }
        }[this.regiaoAtual] || { kvMod: 32.0, tempoBase: 0.0200, equipamento: 'MURAL-BUCKY' };
    }

    // Modificadores por tipo físico (adulto)
    modificadorTipoFisico() {
        if (this.idadeAtual !== 'adult') return { kvMod: 0.0, tempoMod: 1.0 };
        return {
            'p': { kvMod: -10.0, tempoMod: 0.65 },
            'm': { kvMod: 0.0, tempoMod: 1.0 },
            'g': { kvMod: 8.0, tempoMod: 1.2 },
            'gg': { kvMod: 15.0, tempoMod: 1.4 },
            'xl': { kvMod: 22.0, tempoMod: 1.6 }
        }[this.tipoFisicoAtual] || { kvMod: 0.0, tempoMod: 1.0 };
    }

    // Parâmetros específicos para tórax adulto
    parametrosTorax() {
        return {
            'p': { kv: 77, mAs: 18, ma: 200, tempo: 0.09 },
            'm': { kv: 82, mAs: 20, ma: 200, tempo: 0.10 },
            'g': { kv: 88, mAs: 25, ma: 200, tempo: 0.125 },
            'gg': { kv: 94, mAs: 30, ma: 200, tempo: 0.15 },
            'xl': { kv: 100, mAs: 40, ma: 200, tempo: 0.20 }
        }[this.tipoFisicoAtual] || { kv: 82, mAs: 20, ma: 200, tempo: 0.10 };
    }

    // Exibe os resultados na tela
    exibirResultados(param) {
        document.getElementById('kvValue').textContent = param.kv.toFixed(1);
        document.getElementById('maValue').textContent = param.ma.toFixed(1);
        document.getElementById('mAsValue').textContent = param.mAs.toString();

        // Equipamento recomendado
        if (param.equipamento) {
            const info = document.createElement('div');
            info.className = 'result-item equipment-info';
            info.innerHTML = `
                <div class="result-label">
                    <i class="fas fa-cogs"></i>
                    <span>Equipamento</span>
                </div>
                <div class="result-value">${param.equipamento}</div>
            `;
            const grid = document.querySelector('.results-grid');
            const existente = grid.querySelector('.equipment-info');
            if (existente) existente.remove();
            grid.appendChild(info);
        }
        this.animarResultados();
    }

    // Anima os resultados
    animarResultados() {
        document.querySelectorAll('.result-item').forEach((item, i) => {
            item.style.animation = 'none';
            setTimeout(() => {
                item.style.animation = `fadeIn 0.6s ease-out ${i * 0.1}s both`;
            }, 10);
        });
    }

    // Mostra regiões específicas
    mostrarRegiaoEspecifica(regiao) {
        document.getElementById('general-regions').style.display = 'none';
        document.querySelectorAll('.specific-regions').forEach(el => el.style.display = 'none');
        const especifica = document.getElementById(`${regiao}-specific`);
        if (especifica) {
            especifica.style.display = 'block';
            especifica.style.animation = 'fadeIn 0.5s ease-out';
        }
        const primeiro = especifica?.querySelector('[data-bodypart]');
        if (primeiro) {
            this.selecionarBotao('[data-bodypart]', primeiro);
            this.regiaoAtual = primeiro.dataset.bodypart;
            this.calcular();
        }
    }

    // Volta para regiões gerais
    mostrarRegiaoGeral() {
        document.querySelectorAll('.specific-regions').forEach(el => el.style.display = 'none');
        document.getElementById('general-regions').style.display = 'block';
        this.regiaoAtual = 'chest';
        this.selecionarBotao('[data-region]', document.querySelector('[data-region="torso"]'));
        this.calcular();
    }

    // Modal KV/mAs - simplificado para constante do equipamento
    abrirModalKvMas() {
        document.getElementById('kvmas-modal').style.display = 'flex';
        document.getElementById('kvmas-result').innerHTML = '';
        document.getElementById('kvmas-form').reset();
    }

    fecharModalKvMas() {
        document.getElementById('kvmas-modal').style.display = 'none';
    }

    // Calcula KV/mAs usando constante do equipamento
    calcularKvMas(event) {
        event.preventDefault();
        const constanteEquipamento = parseFloat(document.getElementById('input-thickness').value);
        const distancia = parseFloat(document.getElementById('input-distance').value);
        const regiao = document.getElementById('input-region').value;

        if (isNaN(constanteEquipamento) || isNaN(distancia) || !regiao) {
            this.mostrarModalKvMas('Preencha todos os campos corretamente.');
            return;
        }

        // Constantes de mA de Maron por região
        const constantesMA = {
            osseo: 200,
            extremidade: 100,
            respiratorio: 200,
            digestorio: 250,
            urinario: 250,
            'partes-moles': 150
        };
        let ma = constantesMA[regiao] || 200;
        let kv = constanteEquipamento;
        if (distancia > 100) kv += 5;
        let tempo = 0.1;
        let mas = Math.round(ma * tempo * 1000) / 1000;

        kv = Math.max(40, Math.min(150, kv));
        ma = Math.max(25, Math.min(800, ma));
        mas = Math.max(5, Math.min(100, mas));

        const resultado = `
            <p><strong>Resultado:</strong></p>
            <p>KV: <b>${kv}</b></p>
            <p>mA: <b>${ma}</b></p>
            <p>mAs: <b>${mas}</b></p>
            <p><small>Constante do equipamento: ${constanteEquipamento} | Distância: ${distancia}cm | Região: ${document.getElementById('input-region').selectedOptions[0].text}</small></p>
        `;
        this.mostrarModalKvMas(resultado);
    }

    mostrarModalKvMas(conteudo) {
        const modal = document.getElementById('kvmas-result-modal');
        document.getElementById('kvmas-result-modal-content').innerHTML = conteudo;
        modal.style.display = 'flex';
        document.getElementById('closeKvMasResultModal').onclick = () => modal.style.display = 'none';
        modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    }
}

// Estilos para notificações
const estilosNotificacao = document.createElement('style');
estilosNotificacao.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(estilosNotificacao);

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    window.calculadora = new CalculadoraRadiologica();
    efeitoHeader();
});

// Efeito de header ao rolar
function efeitoHeader() {
    const header = document.querySelector('.header');
    function debounce(fn, ms) {
        let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
    }
    const atualizar = debounce(() => {
        const scroll = window.pageYOffset || document.documentElement.scrollTop;
        if (scroll > 50) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    }, 10);
    window.addEventListener('scroll', atualizar, { passive: true });
    window.addEventListener('touchmove', atualizar, { passive: true });
}

// Ajuste do modal KV/mAs para novo cálculo
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('kvmas-form');
    if (form) {
        form.onsubmit = function(e) {
            window.calculadora.calcularKvMas(e);
        };
    }
});

// Calculadora Radiológica - KV, mAs e Tempo
class RadiologicalCalculator {
    constructor() {
        this.currentAge = null;
        this.currentBodyType = null;
        this.currentBodyPart = null;
        
        this.initializeEventListeners();
    }

    // Inicializar event listeners
    initializeEventListeners() {
        // Botões de idade
        document.querySelectorAll('.age-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectButton('.age-btn', e.target.closest('.age-btn'));
                this.currentAge = e.target.closest('.age-btn').dataset.age;
                this.updateBodyTypeSection();
                this.calculate();
            });
        });

        // Botões de tipo físico
        document.querySelectorAll('.body-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectButton('.body-btn', e.target.closest('.body-btn'));
                this.currentBodyType = e.target.closest('.body-btn').dataset.body;
                this.calculate();
            });
        });

        // Botões de região geral
        document.querySelectorAll('[data-region]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectButton('[data-region]', e.target.closest('[data-region]'));
                const region = e.target.closest('[data-region]').dataset.region;
                this.showSpecificRegionsInline(region);
            });
        });

        // Botões de região específica
        document.querySelectorAll('[data-bodypart]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectButton('[data-bodypart]', e.target.closest('[data-bodypart]'));
                this.currentBodyPart = e.target.closest('[data-bodypart]').dataset.bodypart;
                this.calculate();
            });
        });

        // Botão calcular
        document.getElementById('calculateBtn').addEventListener('click', () => {
            this.calculate();
        });

        // Constante do aparelho
        document.getElementById('equipment-constant').addEventListener('input', () => {
            this.calculate();
        });
    }

    // Selecionar botão ativo
    selectButton(selector, activeButton) {
        document.querySelectorAll(selector).forEach(btn => {
            btn.classList.remove('active');
        });
        activeButton.classList.add('active');
    }

    // Atualizar seção de tipo físico baseado na idade
    updateBodyTypeSection() {
        const bodyTypeSection = document.getElementById('body-type-section');
        if (this.currentAge === 'adult') {
            bodyTypeSection.style.display = 'block';
            // Scroll para tipo físico quando selecionar adulto
            setTimeout(() => {
                this.scrollToBodyType();
            }, 100);
        } else {
            bodyTypeSection.style.display = 'none';
            this.currentBodyType = null; // Limpar seleção
        }
    }

    // Calcular parâmetros radiológicos
    calculate() {
        // Verificar se todas as seleções necessárias foram feitas
        if (!this.currentAge || !this.currentBodyPart) {
            this.clearResults();
            return;
        }
        
        // Para adultos, verificar se o tipo físico foi selecionado
        if (this.currentAge === 'adult' && !this.currentBodyType) {
            this.clearResults();
            return;
        }
        
        const params = this.calculateParameters();
        this.displayResults(params);
    }

    // Limpar resultados
    clearResults() {
        document.getElementById('kvValue').textContent = '--';
        document.getElementById('maValue').textContent = '--';
        document.getElementById('mAsValue').textContent = '--';
        
        // Remover informações adicionais se existirem
        const existingEquipment = document.querySelector('.equipment-info');
        if (existingEquipment) {
            existingEquipment.remove();
        }
        
        const existingCalculation = document.querySelector('.calculation-info');
        if (existingCalculation) {
            existingCalculation.remove();
        }
    }

    // Funções de scroll para diferentes seções
    scrollToAgeSelection() {
        const ageSection = document.getElementById('age-selection');
        if (ageSection) {
            ageSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }

    scrollToBodyType() {
        const bodyTypeSection = document.getElementById('body-type-section');
        if (bodyTypeSection) {
            bodyTypeSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }

    scrollToBodyRegion() {
        const bodyRegionSection = document.getElementById('bodypart-section');
        if (bodyRegionSection) {
            bodyRegionSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }

    scrollToResults() {
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) {
            resultsSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }

    // Calcular parâmetros baseados na seleção usando a fórmula da modal
    calculateParameters() {
        // 1) Obter constante do aparelho
        const constante = parseFloat(document.getElementById('equipment-constant').value) || 20;
        
        // 2) Calcular espessura baseada na idade e tipo físico
        const thickness = this.calculateThickness();
        
        // 3) Determinar estrutura/região baseada na seleção
        const structure = this.getStructureFromBodyPart();
        
        // 4) Obter fatores de Maron
        const maronFactors = {
            'corpo-osseo': 0.5,
            'extremidades': 0.1,
            'aparelho-respiratorio': 0.1,
            'aparelho-digestorio': 0.3,
            'aparelho-urinario': 0.3
        };
        
        const fatorMaron = maronFactors[structure] || 0.1;
        
        // 5) Calcular KV usando a fórmula: KV = 2 * espessura + constante
        const kv = 2 * thickness + constante;
        
        // 6) Calcular mAs: mAs = KV * fatorMaron
        let mAs = kv * fatorMaron;
        
        // 7) Calcular tempo baseado na espessura
        let tempo = 0.1;
        if (thickness <= 10) tempo = 0.05;
        else if (thickness <= 20) tempo = 0.10;
        else if (thickness <= 30) tempo = 0.20;
        else tempo = 0.30;
        
        // 8) Calcular mA: mA = mAs / tempo
        const mA = mAs / tempo;
        
        // 9) Obter informações do equipamento
        const bodyPartParams = this.getBodyPartParameters();
        
        // 10) Sanitização e retorno
        const finalKV = Math.max(40, Math.min(150, Math.round(kv * 10) / 10));
        const finalMA = Math.max(25, Math.min(800, Math.round(mA * 10) / 10));
        const finalTime = Math.max(0.001, Math.min(5.0, Math.round(tempo * 10000) / 10000));
        const finalMAs = Math.round(mAs * 1000) / 1000;
        
        return {
            kv: finalKV,
            ma: finalMA,
            mAs: finalMAs,
            time: finalTime,
            equipment: bodyPartParams.equipment || 'MESA',
            thickness: thickness,
            constante: constante,
            fatorMaron: fatorMaron
        };
    }

    // Calcular espessura baseada na idade e tipo físico (valores realistas)
    calculateThickness() {
        // Espessura base por idade (em cm) - valores realistas baseados em anatomia
        const ageThickness = {
            newborn: 6,    // Recém-nascido: ~6cm (tórax)
            '1a5': 10,     // 1-5 anos: ~10cm (tórax)
            '5a10': 13,    // 5-10 anos: ~13cm (tórax)
            '10a18': 16,   // 10-18 anos: ~16cm (tórax)
            adult: 20      // Adulto: ~20cm (tórax)
        };
        
        let baseThickness = ageThickness[this.currentAge] || 20;
        
        // Ajustar espessura baseada no tipo físico (apenas adultos) - valores realistas
        if (this.currentAge === 'adult') {
            const bodyThicknessModifiers = {
                'p': -4,   // Pequeno: -4cm (16cm)
                'm': 0,    // Médio: sem alteração (20cm)
                'g': 4,    // Grande: +4cm (24cm)
                'gg': 8,   // Muito Grande: +8cm (28cm)
                'xl': 12   // Extra Grande: +12cm (32cm)
            };
            
            baseThickness += bodyThicknessModifiers[this.currentBodyType] || 0;
        }
        
        // Ajustar espessura baseada na região corporal selecionada
        const regionThicknessModifiers = this.getRegionThicknessModifiers();
        baseThickness += regionThicknessModifiers;
        
        return Math.max(3, baseThickness); // Mínimo de 3cm
    }

    // Obter modificadores de espessura por região corporal
    getRegionThicknessModifiers() {
        const regionModifiers = {
            // Cabeça - mais fina
            'skull-ap': -8,
            'skull-lat': -10,
            'face-sinuses': -12,
            'face-nose-lat': -15,
            'face-orbits': -10,
            'face-mandible': -8,
            'cavum': -8,
            
            // Tórax - espessura padrão
            'chest': 0,
            'chest-lat': 0,
            'chest-ap': 0,
            'ribs-ap': -2,
            'ribs-lat': -2,
            'ribs-oblique': -2,
            
            // Abdômen - mais espesso
            'abdomen-ap': 4,
            'abdomen-lat': 4,
            'abdomen-oblique': 4,
            
            // Pelve - mais espesso
            'pelvis-ap': 6,
            'pelvis-lat': 6,
            'pelvis-oblique': 6,
            
            // Membros superiores - mais finos
            'shoulder-ap': -6,
            'shoulder-ax': -8,
            'shoulder-y': -6,
            'shoulder-lat': -6,
            'humerus-ap': -10,
            'humerus-lat': -10,
            'elbow-ap': -12,
            'elbow-lat': -12,
            'forearm-ap': -14,
            'forearm-lat': -14,
            'wrist-pa': -16,
            'wrist-lat': -16,
            'wrist-oblique': -16,
            'hand-pa': -18,
            'hand-lat': -18,
            'hand-oblique': -18,
            'finger-ap': -20,
            'finger-lat': -20,
            
            // Membros inferiores - mais finos
            'hip-ap': -4,
            'hip-lat': -4,
            'femur-ap': -8,
            'femur-lat': -8,
            'knee-ap': -10,
            'knee-lat': -10,
            'leg-ap': -12,
            'leg-lat': -12,
            'ankle-ap': -16,
            'ankle-lat': -16,
            'foot-ap': -18,
            'foot-lat': -18,
            'foot-oblique': -18,
            'calcaneus': -18
        };
        
        return regionModifiers[this.currentBodyPart] || 0;
    }
    
    // Determinar estrutura baseada na região corporal selecionada
    getStructureFromBodyPart() {
        const structureMapping = {
            // Cabeça - corpo ósseo
            'skull-ap': 'corpo-osseo',
            'skull-lat': 'corpo-osseo',
            'face-sinuses': 'corpo-osseo',
            'face-nose-lat': 'corpo-osseo',
            'face-orbits': 'corpo-osseo',
            'face-mandible': 'corpo-osseo',
            'cavum': 'corpo-osseo',
            
            // Tórax - aparelho respiratório
            'chest': 'aparelho-respiratorio',
            'chest-lat': 'aparelho-respiratorio',
            'chest-ap': 'aparelho-respiratorio',
            'ribs-ap': 'corpo-osseo',
            'ribs-lat': 'corpo-osseo',
            'ribs-oblique': 'corpo-osseo',
            
            // Abdômen - aparelho digestório
            'abdomen-ap': 'aparelho-digestorio',
            'abdomen-lat': 'aparelho-digestorio',
            'abdomen-oblique': 'aparelho-digestorio',
            
            // Pelve - aparelho digestório
            'pelvis-ap': 'aparelho-digestorio',
            'pelvis-lat': 'aparelho-digestorio',
            'pelvis-oblique': 'aparelho-digestorio',
            
            // Membros superiores - extremidades
            'shoulder-ap': 'extremidades',
            'shoulder-ax': 'extremidades',
            'shoulder-y': 'extremidades',
            'shoulder-lat': 'extremidades',
            'humerus-ap': 'extremidades',
            'humerus-lat': 'extremidades',
            'elbow-ap': 'extremidades',
            'elbow-lat': 'extremidades',
            'forearm-ap': 'extremidades',
            'forearm-lat': 'extremidades',
            'wrist-pa': 'extremidades',
            'wrist-lat': 'extremidades',
            'wrist-oblique': 'extremidades',
            'hand-pa': 'extremidades',
            'hand-lat': 'extremidades',
            'hand-oblique': 'extremidades',
            'finger-ap': 'extremidades',
            'finger-lat': 'extremidades',
            
            // Membros inferiores - extremidades
            'hip-ap': 'extremidades',
            'hip-lat': 'extremidades',
            'femur-ap': 'extremidades',
            'femur-lat': 'extremidades',
            'knee-ap': 'extremidades',
            'knee-lat': 'extremidades',
            'leg-ap': 'extremidades',
            'leg-lat': 'extremidades',
            'ankle-ap': 'extremidades',
            'ankle-lat': 'extremidades',
            'foot-ap': 'extremidades',
            'foot-lat': 'extremidades',
            'foot-oblique': 'extremidades',
            'calcaneus': 'extremidades'
        };
        
        return structureMapping[this.currentBodyPart] || 'extremidades';
    }

    // Parâmetros base por idade (mantido para compatibilidade)
    getAgeParameters() {
        const ageParams = {
            newborn: { kv: 40.0, ma: 25.0, weight: 3.5 },
            '1a5': { kv: 47.0, ma: 45.0, weight: 12.0 },
            '5a10': { kv: 52.0, ma: 65.0, weight: 25.0 },
            '10a18': { kv: 57.0, ma: 90.0, weight: 45.0 },
            adult: { kv: 60.0, ma: 200.0, weight: 70.0 }
        };
        return ageParams[this.currentAge] || ageParams.adult;
    }

    // Parâmetros base por região corporal (valores realistas e atualizados)
    getBodyPartParameters() {
        const bodyPartParams = {
            // Crânio
            'skull-ap': { kvModifier: 8.0, baseTime: 0.2000, description: 'Crânio AP', dff: 1.0, equipment: 'MURAL-BUCKY' },
            'skull-lat': { kvModifier: 5.0, baseTime: 0.2000, description: 'Crânio Perfil', dff: 1.0, equipment: 'MURAL-BUCKY' },
            
            // Face
            'face-sinuses': { kvModifier: 10.0, baseTime: 0.1600, description: 'Seios da Face', dff: 1.0, equipment: 'MURAL-BUCKY' },
            'face-nose-lat': { kvModifier: -18.0, baseTime: 0.0400, description: 'Nariz Perfil', dff: 1.0, equipment: 'MESA' },
            'face-orbits': { kvModifier: 8.0, baseTime: 0.1600, description: 'Órbitas', dff: 1.0, equipment: 'MURAL-BUCKY' },
            'face-mandible': { kvModifier: 6.0, baseTime: 0.2000, description: 'Mandíbula', dff: 1.0, equipment: 'MURAL-BUCKY' },
            
            // Cavum
            'cavum': { kvModifier: 8.0, baseTime: 0.2000, description: 'Cavum', dff: 1.0, equipment: 'MURAL-BUCKY' },
            
            // Costelas
            'ribs-ap': { kvModifier: 28.0, baseTime: 0.2500, description: 'Costelas AP', dff: 1.0, equipment: 'MESA-GRADE' },
            'ribs-lat': { kvModifier: 38.0, baseTime: 0.3500, description: 'Costelas Lat', dff: 1.0, equipment: 'MESA-GRADE' },
            'ribs-oblique': { kvModifier: 33.0, baseTime: 0.3000, description: 'Costelas Oblíqua', dff: 1.0, equipment: 'MESA-GRADE' },
            
            // Tórax
            'chest': { kvModifier: 32.0, baseTime: 0.0200, description: 'Tórax PA', dff: 1.8, equipment: 'MURAL-BUCKY' },
            'chest-lat': { kvModifier: 52.0, baseTime: 0.0400, description: 'Tórax Lat', dff: 1.8, equipment: 'MURAL-BUCKY' },
            'chest-ap': { kvModifier: 37.0, baseTime: 0.0250, description: 'Tórax AP', dff: 1.0, equipment: 'MURAL-BUCKY' },
            
            // Úmero
            'humerus-ap': { kvModifier: -3.0, baseTime: 0.0500, description: 'Úmero AP', dff: 1.0, equipment: 'MURAL-BUCKY' },
            'humerus-lat': { kvModifier: -3.0, baseTime: 0.0500, description: 'Úmero Lat', dff: 1.0, equipment: 'MURAL-BUCKY' },
            
            // Antebraço
            'forearm-ap': { kvModifier: -12.0, baseTime: 0.0400, description: 'Antebraço AP', dff: 1.0, equipment: 'MESA' },
            'forearm-lat': { kvModifier: -12.0, baseTime: 0.0400, description: 'Antebraço Lat', dff: 1.0, equipment: 'MESA' },
            
            // Ombro
            'shoulder-ap': { kvModifier: -10.0, baseTime: 0.1600, description: 'Ombro AP', dff: 1.0, equipment: 'MURAL-BUCKY' },
            'shoulder-ax': { kvModifier: -12.0, baseTime: 0.2000, description: 'Ombro Axilar', dff: 1.0, equipment: 'MESA' },
            'shoulder-y': { kvModifier: 0.0, baseTime: 0.2000, description: 'Ombro Perfil (Y)', dff: 1.0, equipment: 'MURAL-BUCKY' },
            'shoulder-lat': { kvModifier: -8.0, baseTime: 0.1600, description: 'Ombro Lat', dff: 1.0, equipment: 'MURAL-BUCKY' },
            
            // Mão
            'hand-pa': { kvModifier: -22.0, baseTime: 0.0320, description: 'Mão PA', dff: 1.0, equipment: 'MESA' },
            'hand-lat': { kvModifier: -22.0, baseTime: 0.0320, description: 'Mão Lat', dff: 1.0, equipment: 'MESA' },
            'hand-oblique': { kvModifier: -22.0, baseTime: 0.0320, description: 'Mão Oblíqua', dff: 1.0, equipment: 'MESA' },
            
            // Punho
            'wrist-pa': { kvModifier: -22.0, baseTime: 0.0320, description: 'Punho PA', dff: 1.0, equipment: 'MESA' },
            'wrist-lat': { kvModifier: -22.0, baseTime: 0.0320, description: 'Punho Lat', dff: 1.0, equipment: 'MESA' },
            'wrist-oblique': { kvModifier: -21.0, baseTime: 0.0320, description: 'Punho Oblíqua', dff: 1.0, equipment: 'MESA' },
            
            // Abdômen
            'abdomen-ap': { kvModifier: 5.0, baseTime: 0.2800, description: 'Abdômen AP', dff: 1.0, equipment: 'MESA-GRADE' },
            'abdomen-lat': { kvModifier: 5.0, baseTime: 0.2800, description: 'Abdômen Lat', dff: 1.0, equipment: 'MURAL-BUCKY' },
            'abdomen-oblique': { kvModifier: 7.0, baseTime: 0.2600, description: 'Abdômen Oblíqua', dff: 1.0, equipment: 'MESA-GRADE' },
            
            // Pelve/Bacia
            'pelvis-ap': { kvModifier: 12.0, baseTime: 0.2800, description: 'Bacia AP', dff: 1.0, equipment: 'MESA-GRADE' },
            'pelvis-lat': { kvModifier: 17.0, baseTime: 0.3000, description: 'Bacia Lat', dff: 1.0, equipment: 'MESA-GRADE' },
            'pelvis-oblique': { kvModifier: 14.0, baseTime: 0.2800, description: 'Bacia Oblíqua', dff: 1.0, equipment: 'MESA-GRADE' },
            
            // Fêmur
            'femur-ap': { kvModifier: 12.0, baseTime: 0.0500, description: 'Fêmur AP', dff: 1.0, equipment: 'MESA-GRADE' },
            'femur-lat': { kvModifier: 12.0, baseTime: 0.0500, description: 'Fêmur Lat', dff: 1.0, equipment: 'MESA-GRADE' },
            
            // Perna
            'leg-ap': { kvModifier: -5.0, baseTime: 0.0400, description: 'Perna AP', dff: 1.0, equipment: 'MESA' },
            'leg-lat': { kvModifier: -5.0, baseTime: 0.0400, description: 'Perna Lat', dff: 1.0, equipment: 'MESA' },
            
            // Pé
            'foot-ap': { kvModifier: -22.0, baseTime: 0.0400, description: 'Pé AP', dff: 1.0, equipment: 'MESA' },
            'foot-lat': { kvModifier: -22.0, baseTime: 0.0400, description: 'Pé Lat', dff: 1.0, equipment: 'MESA' },
            'foot-oblique': { kvModifier: -22.0, baseTime: 0.0400, description: 'Pé Oblíqua', dff: 1.0, equipment: 'MESA' },
            
            // Tornozelo
            'ankle-ap': { kvModifier: -18.0, baseTime: 0.0320, description: 'Tornozelo AP', dff: 1.0, equipment: 'MESA' },
            'ankle-lat': { kvModifier: -20.0, baseTime: 0.0320, description: 'Tornozelo Lat', dff: 1.0, equipment: 'MESA' },
            
            // Outras regiões importantes
            'elbow-ap': { kvModifier: -12.0, baseTime: 0.0400, description: 'Cotovelo AP', dff: 1.0, equipment: 'MESA' },
            'elbow-lat': { kvModifier: -12.0, baseTime: 0.0400, description: 'Cotovelo Lat', dff: 1.0, equipment: 'MESA' },
            'knee-ap': { kvModifier: -3.0, baseTime: 0.0500, description: 'Joelho AP', dff: 1.0, equipment: 'MESA-GRADE' },
            'knee-lat': { kvModifier: -5.0, baseTime: 0.0500, description: 'Joelho Lat', dff: 1.0, equipment: 'MESA-GRADE' },
            'hip-ap': { kvModifier: 17.0, baseTime: 0.2000, description: 'Quadril AP', dff: 1.0, equipment: 'MESA-GRADE' },
            'hip-lat': { kvModifier: 20.0, baseTime: 0.2500, description: 'Quadril Lat', dff: 1.0, equipment: 'MESA-GRADE' },
            'finger-ap': { kvModifier: -26.0, baseTime: 0.0320, description: 'Dedo AP', dff: 1.0, equipment: 'MESA' },
            'finger-lat': { kvModifier: -26.0, baseTime: 0.0320, description: 'Dedo Lat', dff: 1.0, equipment: 'MESA' },
            'calcaneus': { kvModifier: -18.0, baseTime: 0.0320, description: 'Calcâneo Axial', dff: 1.0, equipment: 'MESA' }
        };
        
        return bodyPartParams[this.currentBodyPart] || bodyPartParams.chest;
    }

    // Modificadores por tipo físico (apenas adultos) - Novo sistema P, M, G, GG, XL
    getBodyTypeModifiers() {
        if (this.currentAge !== 'adult') {
            return { kvModifier: 0.0, timeModifier: 1.0000 };
        }
        
        const bodyModifiers = {
            'p': { kvModifier: -10.0, timeModifier: 0.6500, weight: 'Pequeno' },
            'm': { kvModifier: 0.0, timeModifier: 1.0000, weight: 'Médio' },
            'g': { kvModifier: 8.0, timeModifier: 1.2000, weight: 'Grande' },
            'gg': { kvModifier: 15.0, timeModifier: 1.4000, weight: 'Muito Grande' },
            'xl': { kvModifier: 22.0, timeModifier: 1.6000, weight: 'Extra Grande' }
        };
        
        return bodyModifiers[this.currentBodyType] || bodyModifiers.m;
    }

    // Parâmetros específicos para tórax AP e PA por biotipo
    getChestSpecificParams() {
        const chestParams = {
            'p': { kv: 77, mAs: 18, ma: 200, time: 0.09 },
            'm': { kv: 82, mAs: 20, ma: 200, time: 0.10 },
            'g': { kv: 88, mAs: 25, ma: 200, time: 0.125 },
            'gg': { kv: 94, mAs: 30, ma: 200, time: 0.15 },
            'xl': { kv: 100, mAs: 40, ma: 200, time: 0.20 }
        };
        
        return chestParams[this.currentBodyType] || chestParams.m;
    }

    // Exibir resultados
    displayResults(params) {
        // Formatar valores com maior precisão
        const formattedKV = params.kv.toFixed(1);
        const formattedMA = params.ma.toFixed(1);
        const formattedMAs = params.mAs.toString();
        
        document.getElementById('kvValue').textContent = formattedKV;
        document.getElementById('maValue').textContent = formattedMA;
        document.getElementById('mAsValue').textContent = formattedMAs;

        // Mostrar equipamento recomendado se disponível
        if (params.equipment) {
            const equipmentInfo = document.createElement('div');
            equipmentInfo.className = 'result-item equipment-info';
            equipmentInfo.innerHTML = `
                <div class="result-label">
                    <i class="fas fa-cogs"></i>
                    <span>Equipamento</span>
                </div>
                <div class="result-value">${params.equipment}</div>
            `;
            
            // Adicionar após o último resultado
            const resultsGrid = document.querySelector('.results-grid');
            const existingEquipment = resultsGrid.querySelector('.equipment-info');
            if (existingEquipment) {
                existingEquipment.remove();
            }
            resultsGrid.appendChild(equipmentInfo);
        }

        // Mostrar informações de cálculo se disponíveis
        if (params.thickness && params.constante && params.fatorMaron) {
            const calculationInfo = document.createElement('div');
            calculationInfo.className = 'result-item calculation-info';
            calculationInfo.innerHTML = `
                <div class="result-label">
                    <i class="fas fa-info-circle"></i>
                    <span>Detalhes do Cálculo</span>
                </div>
                <div class="result-value">
                    <small>Espessura: ${params.thickness}cm | Constante: ${params.constante} | Fator: ${params.fatorMaron}</small>
                </div>
            `;
            
            const resultsGrid = document.querySelector('.results-grid');
            const existingCalculation = resultsGrid.querySelector('.calculation-info');
            if (existingCalculation) {
                existingCalculation.remove();
            }
            resultsGrid.appendChild(calculationInfo);
        }
        
        // Adicionar animação aos resultados
        this.animateResults();
        
        // Scroll automático para os resultados
        setTimeout(() => {
            this.scrollToResults();
        }, 200);
    }

    // Animar resultados
    animateResults() {
        const resultItems = document.querySelectorAll('.result-item');
        resultItems.forEach((item, index) => {
            item.style.animation = 'none';
            setTimeout(() => {
                item.style.animation = `fadeIn 0.6s ease-out ${index * 0.1}s both`;
            }, 10);
        });
    }

    // Obter informações do paciente
    getPatientInfo() {
        const ageInfo = {
            newborn: 'Recém-nascido (0-1 mês)',
            '1a5': 'Criança (1 a 5 anos)',
            '5a10': 'Criança (5 a 10 anos)',
            '10a18': 'Criança (10 a 18 anos)',
            adult: 'Adulto'
        };

        const bodyTypeInfo = this.currentAge === 'adult' ? 
            ` - ${this.getBodyTypeDescription()}` : '';

        return ageInfo[this.currentAge] + bodyTypeInfo;
    }

    // Obter descrição detalhada do tipo físico
    getBodyTypeDescription() {
        const bodyModifiers = this.getBodyTypeModifiers();
        const descriptions = {
            'p': 'Pequeno',
            'm': 'Médio',
            'g': 'Grande',
            'gg': 'Muito Grande',
            'xl': 'Extra Grande'
        };
        
        return descriptions[this.currentBodyType] || descriptions.m;
    }

    // Obter informações da técnica
    getTechniqueInfo() {
        const bodyPartInfo = this.getBodyPartParameters();
        return bodyPartInfo.description;
    }







    // Atualizar interface
    updateUI() {
        // Atualizar botões ativos apenas se os valores existirem
        if (this.currentAge) {
            const ageButton = document.querySelector(`[data-age="${this.currentAge}"]`);
            if (ageButton) {
                ageButton.classList.add('active');
            }
        }
        
        if (this.currentAge === 'adult' && this.currentBodyType) {
            const bodyButton = document.querySelector(`[data-body="${this.currentBodyType}"]`);
            if (bodyButton) {
                bodyButton.classList.add('active');
            }
        }
        
        // Determinar região geral baseada na região específica atual
        const regionMapping = {
            // Cabeça
            'skull-ap': 'head',
            'skull-lat': 'head',
            'face-sinuses': 'head',
            'face-nose-lat': 'head',
            'face-orbits': 'head',
            'face-mandible': 'head',
            'cavum': 'head',
            
            // Tronco
            'chest': 'torso',
            'chest-lat': 'torso',
            'chest-ap': 'torso',
            'ribs-ap': 'torso',
            'ribs-lat': 'torso',
            'ribs-oblique': 'torso',
            'abdomen-ap': 'torso',
            'abdomen-lat': 'torso',
            'abdomen-oblique': 'torso',
            'pelvis-ap': 'torso',
            'pelvis-lat': 'torso',
            'pelvis-oblique': 'torso',
            
            // Membros Superiores
            'shoulder-ap': 'upper-limbs',
            'shoulder-ax': 'upper-limbs',
            'shoulder-y': 'upper-limbs',
            'shoulder-lat': 'upper-limbs',
            'humerus-ap': 'upper-limbs',
            'humerus-lat': 'upper-limbs',
            'elbow-ap': 'upper-limbs',
            'elbow-lat': 'upper-limbs',
            'forearm-ap': 'upper-limbs',
            'forearm-lat': 'upper-limbs',
            'wrist-pa': 'upper-limbs',
            'wrist-lat': 'upper-limbs',
            'wrist-oblique': 'upper-limbs',
            'hand-pa': 'upper-limbs',
            'hand-lat': 'upper-limbs',
            'hand-oblique': 'upper-limbs',
            'finger-ap': 'upper-limbs',
            'finger-lat': 'upper-limbs',
            
            // Membros Inferiores
            'hip-ap': 'lower-limbs',
            'hip-lat': 'lower-limbs',
            'femur-ap': 'lower-limbs',
            'femur-lat': 'lower-limbs',
            'knee-ap': 'lower-limbs',
            'knee-lat': 'lower-limbs',
            'leg-ap': 'lower-limbs',
            'leg-lat': 'lower-limbs',
            'ankle-ap': 'lower-limbs',
            'ankle-lat': 'lower-limbs',
            'foot-ap': 'lower-limbs',
            'foot-lat': 'lower-limbs',
            'foot-oblique': 'lower-limbs',
            'calcaneus': 'lower-limbs'
        };
        
        // Só atualizar região geral se houver uma região específica selecionada
        if (this.currentBodyPart) {
            const generalRegion = regionMapping[this.currentBodyPart];
            if (generalRegion) {
                document.querySelector(`[data-region="${generalRegion}"]`).classList.add('active');
                // Mostrar regiões específicas se necessário
                this.showSpecificRegionsInline(generalRegion);
            }
        }
        
        // Atualizar região específica se existir
        if (this.currentBodyPart) {
            const specificButton = document.querySelector(`[data-bodypart="${this.currentBodyPart}"]`);
            if (specificButton) {
                specificButton.classList.add('active');
            }
        }
        
        this.updateBodyTypeSection();
    }

    // Mostrar regiões específicas inline (na mesma seção)
    showSpecificRegionsInline(region) {
        // Ocultar regiões gerais
        document.getElementById('general-regions').style.display = 'none';
        
        // Ocultar todas as regiões específicas
        document.querySelectorAll('.specific-regions').forEach(el => {
            el.style.display = 'none';
        });
        
        // Mostrar região específica selecionada
        const specificRegion = document.getElementById(`${region}-specific`);
        if (specificRegion) {
            specificRegion.style.display = 'block';
            
            // Adicionar animação de entrada
            specificRegion.style.animation = 'fadeIn 0.5s ease-out';
            
            // Scroll para a região corporal
            setTimeout(() => {
                this.scrollToBodyRegion();
            }, 100);
        }
        
        // Não selecionar automaticamente nenhuma opção específica
        // O usuário deve escolher manualmente
    }

    // Mostrar regiões gerais
    showGeneralRegions() {
        // Ocultar regiões específicas
        document.querySelectorAll('.specific-regions').forEach(el => {
            el.style.display = 'none';
        });
        
        // Mostrar regiões gerais
        document.getElementById('general-regions').style.display = 'block';
        
        // Limpar seleção de região corporal
        this.currentBodyPart = null;
        
        // Limpar seleções ativas
        document.querySelectorAll('[data-region]').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Limpar resultados
        this.clearResults();
    }

    // Mostrar notificação
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Estilos da notificação
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
        
        document.body.appendChild(notification);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Mostrar seção de posicionamentos
    showPositioning() {
        // Ocultar calculadora
        document.querySelector('.main-container').style.display = 'none';
        
        // Mostrar seção de posicionamentos
        document.getElementById('positioning-section').style.display = 'block';
        
        // Inicializar categorias de posicionamentos
        this.initializePositioningCategories();
        
        // Adicionar event listeners para os botões de posicionamento
        this.initializePositioningButtons();
        
        // Scroll automático para o título
        setTimeout(() => {
            const positioningTitle = document.getElementById('positioning-title');
            if (positioningTitle) {
                positioningTitle.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }
        }, 100);
    }

    // Mostrar calculadora
    showCalculator() {
        // Ocultar seção de posicionamentos
        document.getElementById('positioning-section').style.display = 'none';
        
        // Mostrar calculadora
        document.querySelector('.main-container').style.display = 'grid';
    }

    // Inicializar categorias de posicionamentos
    initializePositioningCategories() {
        const categoryTabs = document.querySelectorAll('.category-tab');
        const categoryContents = document.querySelectorAll('.position-category');

        categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetCategory = tab.dataset.category;
                
                // Atualizar tabs ativas
                categoryTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Atualizar conteúdo ativo
                categoryContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === targetCategory) {
                        content.classList.add('active');
                    }
                });
            });
        });
    }

    // Inicializar botões de posicionamento
    initializePositioningButtons() {
        const viewPositionBtns = document.querySelectorAll('.view-position-btn');
        
        viewPositionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const positionCard = btn.closest('.position-card');
                const position = positionCard.dataset.position;
                this.showPositionModal(position);
            });
        });

        // Também permitir clicar no card inteiro
        const positionCards = document.querySelectorAll('.position-card');
        positionCards.forEach(card => {
            card.addEventListener('click', () => {
                const position = card.dataset.position;
                this.showPositionModal(position);
            });
        });
    }

    // Mostrar modal de posicionamento
    showPositionModal(position) {
        const modal = document.getElementById('position-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalInstructions = document.getElementById('modal-instructions');
        const modalEquipment = document.getElementById('modal-equipment');
        const imageLarge = document.querySelector('.position-image-large');

        // Obter dados do posicionamento
        const positionData = this.getPositionData(position);
        const imageSrc = this.getPositionImage(position, positionData.title);
        
        // Preencher modal
        modalTitle.textContent = positionData.title;
        modalInstructions.innerHTML = positionData.instructions;
        modalEquipment.innerHTML = positionData.equipment;
        if (imageSrc) {
            imageLarge.innerHTML = `<img class="position-photo" src="${imageSrc}" alt="${positionData.title}">`;
        } else {
            let iconEl = imageLarge.querySelector('#modal-icon');
            if (!iconEl) {
                iconEl = document.createElement('i');
                iconEl.id = 'modal-icon';
                imageLarge.innerHTML = '';
                imageLarge.appendChild(iconEl);
            }
            iconEl.className = positionData.icon;
        }
        
        // Mostrar modal
        modal.style.display = 'flex';
        
        // Fechar modal ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closePositionModal();
            }
        });
    }

    // Fechar modal de posicionamento
    closePositionModal() {
        const modal = document.getElementById('position-modal');
        modal.style.display = 'none';
    }

    // Obter imagem dedicada (com fallback)
    getPositionImage(position, title = '') {
        const imageMap = {
            // Cabeça / Face
            'skull-ap': 'images/CRÂNIO PERFIL .JPG',
            'skull-lateral': 'images/CRÂNIO PERFIL .JPG',
            'face-waters': 'images/CRÂNIO PERFIL .JPG',
            'sinuses-caldwell': 'images/CRÂNIO PERFIL .JPG',

            // Tórax
            'chest-pa': 'images/TÓRAX PA.JPG',
            'chest-lateral': 'images/TÓRAX PERFIL.JPG',
            'chest-ap': 'images/TÓRAX PA 2.JPG',
            'ribs-ap': 'images/TÓRAX LAWRELL.JPG',

            // Coluna
            'cervical-ap': 'images/CERVICAL AP.JPG',
            'cervical-lateral': 'images/CERVICAL PERFIL .JPG',
            'thoracic-ap': 'images/COLUNA TORÁCICA AP.JPG',
            'lumbar-ap': 'images/LOMBAR AP.JPG',

            // Membros superiores
            'shoulder-ap': 'images/OMBRO AP.JPG',
            'shoulder-y': 'images/OMBRO PERFIL .JPG',
            'elbow-ap': 'images/COTOVELO AP E PERFIL .JPG',
            'hand-pa': 'images/MÃO PA E PERFIL.JPG',

            // Membros inferiores
            'hip-ap': 'images/COXOFEMORAL AP.JPG',
            'knee-ap': 'images/JOELHO AP.JPG',
            'ankle-ap': 'images/TÍBIA E FÍBULA AP.JPG',
            'foot-ap': 'images/PÉ PA E OBL.JPG',

            // Abdômen / Pelve
            'abdomen-ap': 'images/ABDÔMEN .JPG',
            'abdomen-lateral': 'images/ABDÔMEN .JPG',
            'pelvis-ap': 'images/PELVE .JPG',
            'pelvis-lateral': 'images/PELVE .JPG'
        };

        const rawPath = imageMap[position];
        if (rawPath) return rawPath;

        const label = title || position;
        return `https://placehold.co/480x360?text=${encodeURIComponent(label)}`;
    }

    // Obter dados do posicionamento
    getPositionData(position) {
        const positionDatabase = {
            // Cabeça
            'skull-ap': {
                title: 'Crânio AP',
                icon: 'fas fa-brain',
                instructions: `
                    <ul>
                        <li>Paciente em decúbito dorsal</li>
                        <li>Cabeça centralizada no filme</li>
                        <li>Linha infraorbitomeatal perpendicular ao filme</li>
                        <li>Braços ao longo do corpo</li>
                        <li>Inspiração suave e prender a respiração</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 70-80</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.25s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 18×24 ou 24×30 cm, grade, mural</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> AP axial/PA para crânio, rotina</li>
                        <li><strong>Notas:</strong> Usado para avaliação geral do crânio, fraturas e lesões ósseas; alinhar OML/IOML conforme técnica escolhida.</li>
                    </ul>
                `
            },
            'skull-lateral': {
                title: 'Crânio Lateral',
                icon: 'fas fa-brain',
                instructions: `
                    <ul>
                        <li>Paciente em decúbito lateral</li>
                        <li>Cabeça em perfil perfeito</li>
                        <li>Linha infraorbitomeatal paralela ao filme</li>
                        <li>Braços elevados</li>
                        <li>Inspiração suave e prender a respiração</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 67-75</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.25s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 18×24 ou 24×30 cm, grade, mural</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> Lateral verdadeira de crânio</li>
                        <li><strong>Notas:</strong> Excelente para visualizar abóbada craniana, sela túrcica e paredes dos seios; importante manter superposição exata das hemimandíbulas.</li>
                    </ul>
                `
            },
            'face-waters': {
                title: 'Face - Waters',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>Paciente sentado</li>
                        <li>Queixo elevado</li>
                        <li>Boca aberta</li>
                        <li>Linha infraorbitomeatal a 37°</li>
                        <li>Braços para trás</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 65-75</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.20s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 18×24 cm, grade, mural</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> Parietoacantial (Waters) para face/seios</li>
                        <li><strong>Notas:</strong> Ideal para avaliação dos seios maxilares, órbitas e paredes da face média; ajustar queixo para manter MML adequada.</li>
                    </ul>
                `
            },
            'sinuses-caldwell': {
                title: 'Seios - Caldwell',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>Paciente sentado</li>
                        <li>Queixo no filme</li>
                        <li>Linha infraorbitomeatal a 15°</li>
                        <li>Braços para trás</li>
                        <li>Inspiração suave</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 70-80</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.20s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 18×24 cm, grade, mural</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> PA axial (Caldwell) para seios</li>
                        <li><strong>Notas:</strong> Demonstra bem seios frontais e etmoidais anteriores; inclinar a cabeça para manter o ângulo de 15° com OML.</li>
                    </ul>
                `
            },
            // Tórax
            'chest-pa': {
                title: 'Tórax PA',
                icon: 'fas fa-lungs',
                instructions: `
                    <ul>
                        <li>Erigido, queixo elevado, ombros projetados para frente</li>
                        <li>Tórax contra o IR, sem rotação; escápulas afastadas</li>
                        <li>SID 72" (183 cm) para menor magnificação</li>
                        <li>CR ⟂ ao IR em T7 (≈18-20 cm abaixo da vértebra proeminente)</li>
                        <li>Inspiração profunda e prender</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 110-125</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.025s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 35×43 cm, grade, retrato</li>
                        <li><strong>SID:</strong> 72" (183 cm)</li>
                        <li><strong>Projeção:</strong> PA ereto, rotina</li>
                        <li><strong>Notas:</strong> Inspirar profundamente e manter; usar alta kV para menor dose e melhor penetração pulmonar.</li>
                    </ul>
                `
            },
            'chest-lateral': {
                title: 'Tórax Lateral',
                icon: 'fas fa-lungs',
                instructions: `
                    <ul>
                        <li>Erigido, lado esquerdo contra o IR, verdadeiro lateral</li>
                        <li>Braços elevados e cruzados acima da cabeça</li>
                        <li>SID 72" (183 cm); sem rotação</li>
                        <li>CR ⟂ ao nível de T7, centrado no tórax médio</li>
                        <li>Inspiração profunda e prender</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 110-125</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.05s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 35×43 cm, grade, retrato</li>
                        <li><strong>SID:</strong> 72" (183 cm)</li>
                        <li><strong>Projeção:</strong> Lateral esquerda ereta, rotina</li>
                        <li><strong>Notas:</strong> Ombros e quadris alinhados; importante para avaliação de lesões retroesternais e retrocardíacas.</li>
                    </ul>
                `
            },
            'chest-ap': {
                title: 'Tórax AP',
                icon: 'fas fa-lungs',
                instructions: `
                    <ul>
                        <li>Paciente em decúbito dorsal</li>
                        <li>Filme atrás das costas</li>
                        <li>Braços para os lados</li>
                        <li>Inspiração profunda e prender</li>
                        <li>Escápulas afastadas</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 100-125</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.03s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 35×43 cm, grade, retrato</li>
                        <li><strong>SID:</strong> 72" sempre que possível (leito) ou ≥100 cm</li>
                        <li><strong>Projeção:</strong> AP supino ou semi-ereto (pacientes graves)</li>
                        <li><strong>Notas:</strong> Avaliar ampliação cardíaca; ideal para UTI, pós-operatório e controle de tubos.</li>
                    </ul>
                `
            },
            'ribs-ap': {
                title: 'Costelas AP',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>Paciente em decúbito dorsal</li>
                        <li>Braços elevados</li>
                        <li>Filme centralizado no tórax</li>
                        <li>Inspiração profunda e prender</li>
                        <li>Escápulas afastadas</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 90-110</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.30s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 35×43 cm, grade, mesa ou mural</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> AP costelas, geralmente por hemi-tórax (acima ou abaixo do diafragma)</li>
                        <li><strong>Notas:</strong> Utilizado para pesquisa de fraturas costais; pode exigir respiração em inspiração (costelas superiores) ou expiração (inferiores).</li>
                    </ul>
                `
            },
            // Coluna
            'cervical-ap': {
                title: 'Coluna Cervical AP',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>Paciente sentado</li>
                        <li>Queixo elevado</li>
                        <li>Linha infraorbitomeatal a 15-20°</li>
                        <li>Braços para trás</li>
                        <li>Inspiração suave</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 70-80</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.25s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 24×30 cm, grade, mural</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> AP axial cervical (C3–C7)</li>
                        <li><strong>Notas:</strong> Demonstra corpos vertebrais e espaços discais; pequena angulação cefálica é frequentemente necessária.</li>
                    </ul>
                `
            },
            'cervical-lateral': {
                title: 'Coluna Cervical Lateral',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>Paciente sentado</li>
                        <li>Perfil da cabeça</li>
                        <li>Queixo elevado</li>
                        <li>Braços para trás</li>
                        <li>Inspiração suave</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 70-80</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.25s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 24×30 cm, grade, mural</li>
                        <li><strong>SID:</strong> 150–180 cm (SID longo para ombros mais baixos)</li>
                        <li><strong>Projeção:</strong> Lateral verdadeira de coluna cervical</li>
                        <li><strong>Notas:</strong> Projeção de rotina para trauma cervical; incluir de C1 a C7/T1 quando possível.</li>
                    </ul>
                `
            },
            'thoracic-ap': {
                title: 'Coluna Torácica AP',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>Paciente em decúbito dorsal</li>
                        <li>Joelhos flexionados</li>
                        <li>Inspiração suave</li>
                        <li>Escápulas afastadas</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 80-100</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.30s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 35×43 cm, grade, mesa</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> AP coluna torácica</li>
                        <li><strong>Notas:</strong> Joelhos flexionados para reduzir a curvatura lombar; colimação estreita para reduzir dose à mama.</li>
                    </ul>
                `
            },
            'lumbar-ap': {
                title: 'Coluna Lombar AP',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>Paciente em decúbito dorsal</li>
                        <li>Braços para os lados</li>
                        <li>Joelhos flexionados</li>
                        <li>Inspiração suave</li>
                        <li>Pelve centralizada</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 80-100</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.30s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 35×43 cm, grade, mesa</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> AP coluna lombar</li>
                        <li><strong>Notas:</strong> Joelhos flexionados para reduzir lordose; útil na avaliação de corpos vertebrais, espaços discais e alinhamento.</li>
                    </ul>
                `
            },
            'lumbar-oblique': {
                title: 'Coluna Lombar Oblíqua',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>Corpo girado 45° (50° para L1-L2; 30° para L5-S1)</li>
                        <li>Lateroposterior apoiado, mantendo a coluna alinhada</li>
                        <li>CR em L3 (≈2,5 cm acima da crista)</li>
                        <li>Expiração leve ou suspensão</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 80-95</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.30s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 30×40 ou 35×43 cm, grade, mesa</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> Oblíqua posterior/anterior lombar (≈45° médio)</li>
                        <li><strong>Notas:</strong> Demonstra articulações zigapofisárias ("cachorro Scottie"); ajustar ângulo de rotação conforme nível lombar.</li>
                    </ul>
                `
            },
            'lumbar-l5s1': {
                title: 'Coluna Lombar Lateral L5-S1',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>Decúbito lateral verdadeiro; suporte sob a cintura para paralelismo</li>
                        <li>CR 4 cm (1,5") inferior à crista ilíaca</li>
                        <li>Angulação 5°-8° caudal se a coluna não estiver paralela</li>
                        <li>Respiração suspensa na expiração</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 90-100</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.30s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 24×30 cm, grade, mesa</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> Lateral localizada L5-S1</li>
                        <li><strong>Notas:</strong> Essencial para avaliação de espondilolistese e articulação lombo-sacra; pode exigir angulação caudal adicional.</li>
                    </ul>
                `
            },
            'thoracic-oblique': {
                title: 'Coluna Torácica Oblíqua',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>Paciente em perfil e rodar posteriormente ~20° (a partir do lateral verdadeiro)</li>
                        <li>CR em T7</li>
                        <li>Respiração: expiração (ou ortostática leve para desfocar costelas)</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 80-95</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.30s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 35×43 cm, grade, mesa/mural</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> Oblíqua torácica (RAO/LAO ou RPO/LPO)</li>
                        <li><strong>Notas:</strong> Melhora visualização das articulações zigapofisárias torácicas; frequentemente exame complementar.</li>
                    </ul>
                `
            },
            'sternum-oblique': {
                title: 'Esterno Oblíquo (RAO 15°-20°)',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>RAO 15°-20°, projetando esterno sobre a sombra do coração</li>
                        <li>Respiração ortostática suave para desfocar costelas OU expiração suspensa</li>
                        <li>CR no meio do esterno</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 70-80</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.40s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 24×30 cm, grade, mural</li>
                        <li><strong>SID:</strong> 75–100 cm (para magnificar e desfocar costelas)</li>
                        <li><strong>Projeção:</strong> RAO 15°–20° do esterno</li>
                        <li><strong>Notas:</strong> Técnica com respiração ortostática ajuda a desfocar costelas; usada em suspeita de fraturas esternais.</li>
                    </ul>
                `
            },
            // Membros Superiores
            'shoulder-ap': {
                title: 'Ombro AP',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>Paciente sentado</li>
                        <li>Braço em rotação neutra</li>
                        <li>Cotovelo flexionado a 90°</li>
                        <li>Ombro centralizado no filme</li>
                        <li>Braço oposto para trás</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 52-65</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.20s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 24×30 cm, grade, mural</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> AP ombro (rotação neutra ou interna/externa)</li>
                        <li><strong>Notas:</strong> Útil para luxações, fraturas da cabeça umeral e avaliação geral da articulação glenoumeral.</li>
                    </ul>
                `
            },
            'shoulder-y': {
                title: 'Ombro Y',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>Paciente sentado</li>
                        <li>Braço em rotação externa</li>
                        <li>Cotovelo flexionado a 90°</li>
                        <li>Ombro centralizado no filme</li>
                        <li>Braço oposto para trás</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 63-75</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.25s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 24×30 cm, grade, mural</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> Lateral escapular "Y" para ombro</li>
                        <li><strong>Notas:</strong> Excelente para demonstrar luxações anteriores/posteriores do ombro; corpo e acrômio formam o "Y".</li>
                    </ul>
                `
            },
            'elbow-ap': {
                title: 'Cotovelo AP',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>Paciente sentado</li>
                        <li>Braço estendido</li>
                        <li>Palma para cima</li>
                        <li>Cotovelo centralizado no filme</li>
                        <li>Braço oposto para trás</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 52-65</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.05s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 18×24 cm, sem grade, mesa</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> AP cotovelo</li>
                        <li><strong>Notas:</strong> Projeção de rotina para fraturas da cabeça do rádio, olécrano e úmero distal.</li>
                    </ul>
                `
            },
            'hand-pa': {
                title: 'Mão PA',
                icon: 'fas fa-hand-paper',
                instructions: `
                    <ul>
                        <li>Paciente sentado</li>
                        <li>Mão apoiada no filme</li>
                        <li>Dedos estendidos e separados</li>
                        <li>Punho em posição neutra</li>
                        <li>Braço oposto para trás</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 44-55</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.04s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 18×24 cm, sem grade, mesa</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> PA mão (rotina)</li>
                        <li><strong>Notas:</strong> Demonstra metacarpos, falanges e articulações interfalângicas; base para estudos de artrite e trauma.</li>
                    </ul>
                `
            },
            // Membros Inferiores
            'hip-ap': {
                title: 'Quadril AP',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>Paciente em decúbito dorsal</li>
                        <li>Pernas estendidas</li>
                        <li>Pés em rotação interna</li>
                        <li>Pelve centralizada no filme</li>
                        <li>Braços para os lados</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 75-90</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.25s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 24×30 ou 30×35 cm, grade</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> AP bacia/quadril, rotina</li>
                        <li><strong>Notas:</strong> Excelente para trauma de bacia e avaliação de quadril; incluir articulações sacroilíacas quando indicado.</li>
                    </ul>
                `
            },
            'hip-lat': {
                title: 'Quadril Lateral (Mod. Cleaves - Não Trauma)',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>Paciente em decúbito dorsal</li>
                        <li>Flexionar joelho e quadril afetados</li>
                        <li>Abduzir o fêmur ≈45° da vertical</li>
                        <li>Não realizar se houver suspeita de fratura de quadril</li>
                        <li>CR ⟂ ao quadril, no meio do fêmur proximal</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 75-90</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.25s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 24×30 cm, grade</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> Lateral modificada de Cleaves (frog-leg) – não trauma</li>
                        <li><strong>Notas:</strong> Contraindicado em fraturas suspeitas; ótimo para avaliar cabeça e colo femoral.</li>
                    </ul>
                `
            },
            'knee-ap': {
                title: 'Joelho AP',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>Paciente em decúbito dorsal</li>
                        <li>Perna estendida</li>
                        <li>Patela centralizada no filme</li>
                        <li>Pé em posição neutra</li>
                        <li>Braços para os lados</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 60-75</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.06s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 24×30 cm, grade (adulto)</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> AP joelho, rotina</li>
                        <li><strong>Notas:</strong> Pode exigir pequena angulação cefálica/caudal conforme biotipo; útil para alinhamento articular.</li>
                    </ul>
                `
            },
            'patella-axial': {
                title: 'Patela Tangencial/Axial (Settegast/Hughston)',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>Settegast: joelho flexionado 90° em prono</li>
                        <li>Hughston: joelho flexionado 50°-60° a partir da extensão completa</li>
                        <li>CR centrado no meio da patela (tangencial)</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 60-70</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.04s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 18×24 cm, sem grade</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> Tangencial axial (Settegast/Hughston)</li>
                        <li><strong>Notas:</strong> Indicado para avaliação de articulação femoropatelar e fraturas de patela; atenção ao conforto do paciente.</li>
                    </ul>
                `
            },
            'ankle-ap': {
                title: 'Tornozelo AP Mortise',
                icon: 'fas fa-shoe-prints',
                instructions: `
                    <ul>
                        <li>Paciente em decúbito dorsal</li>
                        <li>Rotacionar perna e pé 15°-20° internamente (linha intermaleolar paralela ao filme)</li>
                        <li>Maléolos centralizados no filme</li>
                        <li>Pé em flexão dorsal suave</li>
                        <li>CR ⟂, a meio caminho entre os maléolos</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 55-65</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.04s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 18×24 cm, sem grade</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> AP mortise, rotina para avaliação espaço tibiotalar</li>
                        <li><strong>Notas:</strong> Rotação correta mostra espaço articular uniforme; útil em entorses e fraturas maleolares.</li>
                    </ul>
                `
            },
            'foot-ap': {
                title: 'Pé Pediátrico AP (Método Kite)',
                icon: 'fas fa-shoe-prints',
                instructions: `
                    <ul>
                        <li>Pé pediátrico imobilizado; não tentar endireitar o pé</li>
                        <li>Realizar AP com o pé apoiado e colimação justa</li>
                        <li>Ambos os pés geralmente radiografados para comparação</li>
                        <li>Para lateral, manter a imobilização a 90°</li>
                        <li>CR ⟂ ao meio do pé</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 48-55</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.05s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 18×24 cm, sem grade</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> AP pediátrico, método Kite</li>
                        <li><strong>Notas:</strong> Usado para pé torto congênito; sempre comparar com lado oposto quando possível.</li>
                    </ul>
                `
            },
            'femur-lat': {
                title: 'Fêmur Lateral',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>Decúbito lateral verdadeiro</li>
                        <li>Flexionar o joelho afetado ~45°</li>
                        <li>Alinhar a linha média do fêmur ao centro do IR</li>
                        <li>CR no ponto médio do fêmur e do receptor</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 70-80</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.05s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 24×30 ou 35×43 cm, grade, mesa</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> Lateral verdadeiro de fêmur</li>
                        <li><strong>Notas:</strong> Cobrir tanto o quadril quanto o joelho em duas incidências, se necessário; importante em suspeita de fraturas diafisárias.</li>
                    </ul>
                `
            },
            'femur-lat-trauma': {
                title: 'Fêmur Lateral Trauma (Feixe Horizontal)',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>Paciente supino, manter membro sem movimento</li>
                        <li>IR vertical entre as pernas, próximo ao fêmur afetado</li>
                        <li>Feixe horizontal ⟂ ao ponto médio do fêmur e do IR</li>
                        <li>Imobilizar e evitar rotação</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 75-85</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.05s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 24×30 ou 35×43 cm, grade, vertical</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> Lateral de fêmur com feixe horizontal (trauma)</li>
                        <li><strong>Notas:</strong> Permite avaliação sem movimentar o membro; indicado em politraumatizados.</li>
                    </ul>
                `
            },
            // Abdômen
            'abdomen-ap': {
                title: 'Abdômen AP',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>Paciente em decúbito dorsal</li>
                        <li>Braços para os lados</li>
                        <li>Joelhos flexionados</li>
                        <li>Abdômen centralizado no filme</li>
                        <li>Inspiração suave</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 67-80</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.32s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 35×43 cm, grade</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> AP supino – rotina de abdômen agudo</li>
                        <li><strong>Notas:</strong> Usado em pesquisa de abdome agudo, obstruções e massas; incluir desde o diafragma até a sínfise púbica.</li>
                    </ul>
                `
            },
            'abdomen-lateral': {
                title: 'Abdômen Lateral',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>Paciente em decúbito lateral</li>
                        <li>Braços elevados</li>
                        <li>Joelhos flexionados</li>
                        <li>Abdômen centralizado no filme</li>
                        <li>Inspiração suave</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 67-80</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.32s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 35×43 cm, grade</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> Lateral de abdômen</li>
                        <li><strong>Notas:</strong> Complementar ao AP em quadros de abdome agudo; pode ajudar na detecção de níveis hidroaéreos.</li>
                    </ul>
                `
            },
            'pelvis-ap': {
                title: 'Pelve AP',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>Paciente em decúbito dorsal</li>
                        <li>Pernas estendidas</li>
                        <li>Pés em rotação interna</li>
                        <li>Pelve centralizada no filme</li>
                        <li>Braços para os lados</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 75-90</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.32s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 35×43 cm, grade</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> AP pelve</li>
                        <li><strong>Notas:</strong> Rotina para trauma de bacia, artroses e avaliação de anel pélvico.</li>
                    </ul>
                `
            },
            'pelvis-lateral': {
                title: 'Pelve Lateral',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>Paciente em decúbito lateral</li>
                        <li>Braços elevados</li>
                        <li>Joelhos flexionados</li>
                        <li>Pelve centralizada no filme</li>
                        <li>Inspiração suave</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 80-95</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.35s</li>
                    </ul>
                `,
                equipment: `
                    <ul>
                        <li><strong>IR/Grade/Tamanho:</strong> 35×43 cm, grade</li>
                        <li><strong>SID:</strong> 100–115 cm</li>
                        <li><strong>Projeção:</strong> Lateral de pelve</li>
                        <li><strong>Notas:</strong> Usada menos frequentemente; pode auxiliar na avaliação de fraturas complexas do anel pélvico.</li>
                    </ul>
                `
            }
        };
        
        return positionDatabase[position] || {
            title: 'Posicionamento',
            icon: 'fas fa-user',
            instructions: '<p>Instruções não disponíveis para este posicionamento.</p>',
            parameters: '<p>Parâmetros não disponíveis para este posicionamento.</p>',
            equipment: 'Não especificado'
        };
    }

    // Abrir modal de KV/mAs
    openKvMasModal() {
        document.getElementById('kvmas-modal').style.display = 'flex';
        document.getElementById('kvmas-result').innerHTML = '';
        document.getElementById('kvmas-form').reset();
    }

    // Fechar modal de KV/mAs
    closeKvMasModal() {
        document.getElementById('kvmas-modal').style.display = 'none';
    }

    // Calcular KV/mAs
    calculateKvMas(event) {
        event.preventDefault();
        const thickness = parseFloat(document.getElementById('input-thickness').value);
        const structure = document.getElementById('input-exam-area').value;
        const constante = parseFloat(document.getElementById('input-constante').value);

        if (!structure || isNaN(thickness) || isNaN(constante)) {
            this.showKvMasResultPopup('Preencha todos os campos corretamente.');
            return;
        }

        const maronFactors = {
            'corpo-osseo': 0.5,
            'extremidades': 0.1,
            'aparelho-respiratorio': 0.1,
            'aparelho-digestorio': 0.3,
            'aparelho-urinario': 0.3,
            'partes-moles': 0.01
        };
        const nomesEstrutura = {
            'corpo-osseo': 'Corpo Ósseo',
            'extremidades': 'Extremidades',
            'aparelho-respiratorio': 'Aparelho Respiratório', 
            'aparelho-digestorio': 'Aparelho Digestório',
            'aparelho-urinario': 'Aparelho Urinário',
            'partes-moles': 'Partes Moles'
        };
        const fatorMaron = maronFactors[structure] || 2;
        const kv = 2 * thickness + constante;
        let mAs = kv * fatorMaron;
        const ma1 = 100, ma2 = 200;
        const tempo1 = mAs / ma1, tempo2 = mAs / ma2;
        let tempo = 0.1;
        if (thickness <= 10) tempo = 0.05;
        else if (thickness <= 20) tempo = 0.10;
        else if (thickness <= 30) tempo = 0.20;
        else tempo = 0.30;
        const mA = mAs / tempo;

        // Mostra resultado no modal pop-up
        this.showKvMasResultPopup(`
            <p><strong>Resultado para ${nomesEstrutura[structure] || structure}:</strong></p>
            <p>kV: <b>${kv.toFixed(1)}</b></p>
            <p>mAs: <b>${mAs.toFixed(2)}</b></p>
            <p><strong>Se mA = 100:</strong> tempo = ${tempo1.toFixed(3)} s</p>
            <p><strong>Se mA = 200:</strong> tempo = ${tempo2.toFixed(3)} s</p>
            <p><small>Espessura: ${thickness}cm, Constante: ${constante}, Fator Maron: ${fatorMaron}</small></p>
        `);
    }

    showKvMasResultPopup(html) {
        const modal = document.getElementById('kvmas-result-modal');
        const content = document.getElementById('kvmas-result-popup');
        content.innerHTML = html;
        modal.style.display = 'flex';
        // Fechar ao clicar no X
        modal.querySelector('.close-kvmas-result').onclick = () => { modal.style.display = 'none'; };
        // Fechar ao clicar fora do conteúdo
        modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    }
}

// Adicionar estilos para notificações
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(notificationStyles);

// Inicializar calculadora quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.calculator = new RadiologicalCalculator();
    
    
});




// Cálculo específico (modal)
document.addEventListener('DOMContentLoaded', function() {
    const openBtn = document.getElementById('openSpecificCalcBtn');
    const modal = document.getElementById('specific-calc-modal');
    const closeBtn = document.getElementById('closeSpecificCalcBtn');
    const form = document.getElementById('specificCalcForm');
    const resultDiv = document.getElementById('specificCalcResult');

    if (openBtn && modal && closeBtn && form && resultDiv) {
        openBtn.onclick = () => { modal.style.display = 'block'; };
        closeBtn.onclick = () => { modal.style.display = 'none'; resultDiv.innerHTML = ''; };
        window.onclick = (e) => { if (e.target == modal) { modal.style.display = 'none'; resultDiv.innerHTML = ''; } };

        form.onsubmit = function(e) {
            e.preventDefault();
            const v1 = parseFloat(document.getElementById('valor1').value);
            const v2 = parseFloat(document.getElementById('valor2').value);
            const v3 = parseFloat(document.getElementById('valor3').value);
            if (v3 === 0) {
                resultDiv.innerHTML = '<span style="color:red;">Divisão por zero não permitida.</span>';
                return;
            }
            const resultado = (v1 * v2) / v3;
            resultDiv.innerHTML = `<strong>Resultado:</strong> ${resultado.toFixed(2)}`;
        };
    }
});

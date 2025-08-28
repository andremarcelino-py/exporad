// Calculadora Radiológica - KV, mAs e Tempo
class RadiologicalCalculator {
    constructor() {
        this.currentAge = 'newborn';
        this.currentBodyType = 'm';
        this.currentBodyPart = 'chest';
        
        this.initializeEventListeners();
        this.updateBodyTypeSection();
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
        } else {
            bodyTypeSection.style.display = 'none';
            this.currentBodyType = 'm'; // Reset para padrão
        }
    }

    // Calcular parâmetros radiológicos
    calculate() {
        const params = this.calculateParameters();
        this.displayResults(params);
    }

    // Calcular parâmetros baseados na seleção
    calculateParameters() {
        // 1) Base por região/projeção
        const bodyPartParams = this.getBodyPartParameters();
        
        // 2) Verificar se é tórax AP ou PA para aplicar valores específicos por biotipo
        if (this.currentAge === 'adult' && (this.currentBodyPart === 'chest' || this.currentBodyPart === 'chest-ap')) {
            const chestParams = this.getChestSpecificParams();
            return {
                kv: chestParams.kv,
                ma: chestParams.ma,
                mAs: chestParams.mAs,
                time: chestParams.time,
                equipment: bodyPartParams.equipment || 'MURAL-BUCKY'
            };
        }
        
        // 3) Cálculo padrão para outras projeções
        const kvBase = 60.0 + (bodyPartParams.kvModifier || 0.0);
        const maBase = 200.0;
        const timeBase = bodyPartParams.baseTime;
        
        // 4) Correções por idade
        const ageParams = this.getAgeParameters();
        const kvAgeDelta = (ageParams.kv - 60.0);
        let kvCorrected = kvBase + kvAgeDelta;
        let maCorrected = ageParams.ma;
        let timeCorrected = timeBase;
        
        // 5) Correções por biotipo (apenas adultos)
        if (this.currentAge === 'adult') {
            const bodyModifiers = this.getBodyTypeModifiers();
            kvCorrected += bodyModifiers.kvModifier;
            timeCorrected *= bodyModifiers.timeModifier;
        }
        
        // 6) Cálculo de mAs
        let mAs = maCorrected * timeCorrected;
        
        // 7) Sanitização e retorno
        const finalKV = Math.max(40, Math.min(150, Math.round(kvCorrected * 10) / 10));
        const finalMA = Math.max(25, Math.min(800, Math.round(maCorrected * 10) / 10));
        const finalTime = Math.max(0.001, Math.min(5.0, Math.round(timeCorrected * 10000) / 10000));
        
        return {
            kv: finalKV,
            ma: finalMA,
            mAs: Math.round(mAs * 1000) / 1000,
            time: finalTime,
            equipment: bodyPartParams.equipment || 'MESA'
        };
    }

    // Parâmetros base por idade
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
        const formattedMAs = params.mAs.toFixed(3);
        
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
        
        // Adicionar animação aos resultados
        this.animateResults();
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

    // Exportar dados para impressão
    exportToPrint() {
        const printWindow = window.open('', '_blank');
        const patientInfo = this.getPatientInfo();
        const techniqueInfo = this.getTechniqueInfo();
        
                // ...existing code...
        printWindow.document.write(`
            <html>
                <head>
                    <title>Relatório Radiológico</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
                        .parameter { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
                        .parameter-value { font-size: 24px; font-weight: bold; color: #0f0f23; }
                        .parameter-unit { color: #666; font-size: 14px; }
                        .footer { margin-top: 30px; text-align: center; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>ExpoRad</h1>
                        <h2>Relatório de Parâmetros Radiológicos</h2>
                    </div>
                    
                    <div class="info-grid">
                        <div>
                            <strong>Paciente:</strong> ${patientInfo}<br>
                            <strong>Técnica:</strong> ${techniqueInfo}<br>
                            <strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}
                        </div>
                        <div>
                            <strong>Tela:</strong> Padrão
                        </div>
                    </div>
                    
                    <div class="info-grid">
                        <div class="parameter">
                            <div class="parameter-value">${document.getElementById('kvValue').textContent}</div>
                            <div class="parameter-unit">kV</div>
                        </div>
                        <div class="parameter">
                            <div class="parameter-value">${document.getElementById('maValue').textContent}</div>
                            <div class="parameter-unit">mA</div>
                        </div>
                        <div class="parameter">
                            <div class="parameter-value">${document.getElementById('mAsValue').textContent}</div>
                            <div class="parameter-unit">mAs</div>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>ExpoRad - Calculadora Radiológica desenvolvida para técnicos de radiologia</p>
                        <p>🚀 Acertar a técnica usando a calculadora fica muito fácil!</p>
                    </div>
                </body>
            </html>
        `);
      
        printWindow.document.close();
        printWindow.print();
    }

    // Salvar configuração atual
    saveConfiguration() {
        const config = {
            age: this.currentAge,
            bodyType: this.currentBodyType,
            bodyPart: this.currentBodyPart,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('radiologicalCalculatorConfig', JSON.stringify(config));
        
        // Mostrar feedback
        this.showNotification('Configuração salva com sucesso!', 'success');
    }

    // Carregar configuração salva
    loadConfiguration() {
        const savedConfig = localStorage.getItem('radiologicalCalculatorConfig');
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                
                // Aplicar configuração
                this.currentAge = config.age;
                this.currentBodyType = config.bodyType;
                this.currentBodyPart = config.bodyPart;
                
                // Atualizar interface
                this.updateUI();
                this.calculate();
                
                this.showNotification('Configuração carregada com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao carregar configuração:', error);
                this.showNotification('Erro ao carregar configuração', 'error');
            }
        }
    }

    // Atualizar interface baseado na configuração
    updateUI() {
        // Atualizar botões ativos
        document.querySelector(`[data-age="${this.currentAge}"]`).classList.add('active');
        
        if (this.currentAge === 'adult') {
            document.querySelector(`[data-body="${this.currentBodyType}"]`).classList.add('active');
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
        
        const generalRegion = regionMapping[this.currentBodyPart] || 'torso';
        
        // Atualizar região geral
        document.querySelector(`[data-region="${generalRegion}"]`).classList.add('active');
        
        // Mostrar regiões específicas se necessário
        this.showSpecificRegionsInline(generalRegion);
        
        // Atualizar região específica
        document.querySelector(`[data-bodypart="${this.currentBodyPart}"]`).classList.add('active');
        
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
        }
        
        // Selecionar primeira opção específica por padrão
        const firstSpecificBtn = specificRegion?.querySelector('[data-bodypart]');
        if (firstSpecificBtn) {
            this.selectButton('[data-bodypart]', firstSpecificBtn);
            this.currentBodyPart = firstSpecificBtn.dataset.bodypart;
            this.calculate();
        }
    }

    // Mostrar regiões gerais
    showGeneralRegions() {
        // Ocultar regiões específicas
        document.querySelectorAll('.specific-regions').forEach(el => {
            el.style.display = 'none';
        });
        
        // Mostrar regiões gerais
        document.getElementById('general-regions').style.display = 'block';
        
        // Resetar seleção para tórax (padrão)
        this.currentBodyPart = 'chest';
        this.selectButton('[data-region]', document.querySelector('[data-region="torso"]'));
        this.calculate();
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
        const modalIcon = document.getElementById('modal-icon');
        const modalInstructions = document.getElementById('modal-instructions');
        const modalParameters = document.getElementById('modal-parameters');
        const modalEquipment = document.getElementById('modal-equipment');

        // Obter dados do posicionamento
        const positionData = this.getPositionData(position);
        
        // Preencher modal
        modalTitle.textContent = positionData.title;
        modalIcon.className = positionData.icon;
        modalInstructions.innerHTML = positionData.instructions;
        modalParameters.innerHTML = positionData.parameters;
        modalEquipment.innerHTML = positionData.equipment;
        
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
                equipment: 'MURAL-BUCKY'
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
                equipment: 'MURAL-BUCKY'
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
                equipment: 'MURAL-BUCKY'
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
                equipment: 'MURAL-BUCKY'
            },
            // Tórax
            'chest-pa': {
                title: 'Tórax PA',
                icon: 'fas fa-lungs',
                instructions: `
                    <ul>
                        <li>Paciente em posição ortostática</li>
                        <li>Tórax contra o filme</li>
                        <li>Braços para trás</li>
                        <li>Inspiração profunda e prender</li>
                        <li>Escápulas afastadas</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 95-120</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.025s</li>
                    </ul>
                `,
                equipment: 'MURAL-BUCKY'
            },
            'chest-lateral': {
                title: 'Tórax Lateral',
                icon: 'fas fa-lungs',
                instructions: `
                    <ul>
                        <li>Paciente em posição ortostática</li>
                        <li>Lado esquerdo contra o filme</li>
                        <li>Braços elevados</li>
                        <li>Inspiração profunda e prender</li>
                        <li>Escápulas afastadas</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 115-140</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.05s</li>
                    </ul>
                `,
                equipment: 'MURAL-BUCKY'
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
                equipment: 'MURAL-BUCKY'
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
                equipment: 'MESA-GRADE'
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
                equipment: 'MURAL-BUCKY'
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
                equipment: 'MURAL-BUCKY'
            },
            'thoracic-ap': {
                title: 'Coluna Torácica AP',
                icon: 'fas fa-user',
                instructions: `
                    <ul>
                        <li>Paciente em decúbito dorsal</li>
                        <li>Braços para os lados</li>
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
                equipment: 'MESA-GRADE'
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
                equipment: 'MESA-GRADE'
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
                equipment: 'MURAL-BUCKY'
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
                equipment: 'MURAL-BUCKY'
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
                equipment: 'MESA'
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
                equipment: 'MESA'
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
                equipment: 'MESA-GRADE'
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
                equipment: 'MESA-GRADE'
            },
            'ankle-ap': {
                title: 'Tornozelo AP',
                icon: 'fas fa-shoe-prints',
                instructions: `
                    <ul>
                        <li>Paciente em decúbito dorsal</li>
                        <li>Pé em flexão dorsal</li>
                        <li>Maléolos centralizados no filme</li>
                        <li>Perna estendida</li>
                        <li>Braços para os lados</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 47-60</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.04s</li>
                    </ul>
                `,
                equipment: 'MESA'
            },
            'foot-ap': {
                title: 'Pé AP',
                icon: 'fas fa-shoe-prints',
                instructions: `
                    <ul>
                        <li>Paciente sentado</li>
                        <li>Pé apoiado no filme</li>
                        <li>Dedos estendidos</li>
                        <li>Pé em posição neutra</li>
                        <li>Braço oposto para trás</li>
                    </ul>
                `,
                parameters: `
                    <ul>
                        <li><strong>KV:</strong> 44-55</li>
                        <li><strong>mA:</strong> 200-400</li>
                        <li><strong>Tempo:</strong> 0.05s</li>
                    </ul>
                `,
                equipment: 'MESA'
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
                equipment: 'MESA-GRADE'
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
                equipment: 'MURAL-BUCKY'
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
                equipment: 'MESA-GRADE'
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
                equipment: 'MESA-GRADE'
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
        const ma = parseFloat(document.getElementById('input-ma').value);
        const time = parseFloat(document.getElementById('input-time').value);
        const kv = parseFloat(document.getElementById('input-kv').value);

        if (isNaN(ma) || isNaN(time) || isNaN(kv)) {
            document.getElementById('kvmas-result').innerHTML = 'Preencha todos os campos corretamente.';
            return;
        }

        const mas = ma * time;
        document.getElementById('kvmas-result').innerHTML = `
            <p><strong>Resultado:</strong></p>
            <p>KV: <b>${kv}</b></p>
            <p>mAs: <b>${mas.toFixed(2)}</b> (mA × Tempo)</p>
        `;
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
    
    // Carregar configuração salva
    window.calculator.loadConfiguration();
    
    // Adicionar botões de ação adicionais
    addActionButtons();
});

// Adicionar botões de ação adicionais
function addActionButtons() {
    const actionButtons = document.createElement('div');
    actionButtons.className = 'action-buttons';
    
    // Botão salvar configuração
    const saveBtn = document.createElement('button');
    saveBtn.innerHTML = '<i class="fas fa-save"></i>';
    saveBtn.title = 'Salvar Configuração';
    saveBtn.className = 'save-btn';
    saveBtn.addEventListener('click', () => window.calculator.saveConfiguration());
    
    // Botão imprimir
    const printBtn = document.createElement('button');
    printBtn.innerHTML = '<i class="fas fa-print"></i>';
    printBtn.title = 'Imprimir Relatório';
    printBtn.className = 'print-btn';
    printBtn.addEventListener('click', () => window.calculator.exportToPrint());
    
    actionButtons.appendChild(saveBtn);
    actionButtons.appendChild(printBtn);
    document.body.appendChild(actionButtons);
}

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

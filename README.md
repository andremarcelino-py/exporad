# ExpoRad - Calculadora Radiológica

Uma calculadora moderna e intuitiva para técnicos de radiologia, desenvolvida para auxiliar na determinação dos parâmetros corretos de KV, mA e mAs para diferentes exames radiológicos.

## 🚀 Características

- **Interface moderna e responsiva** com design elegante e intuitivo
- **Cálculos precisos** baseados em parâmetros reais de radiologia
- **Suporte a diferentes faixas etárias**: Recém-nascido, 1 ano, 5 anos, 10 anos e Adulto
- **Tipos físicos variados** para adultos (Muito Magro até Muito Obeso)
- **Regiões corporais abrangentes**: Crânio, Face, Tórax, Abdômen, Membros, etc.
- **Valores realistas e corretos** de KV, mA e mAs
- **Recomendações de equipamento** (Mesa, Mural-Bucky, Mesa-Grade)
- **Funcionalidades extras**: Salvar configurações, imprimir relatórios

## 📋 Parâmetros Técnicos

### Faixas Etárias
- **Recém-nascido**: KV base 45, mA 25
- **1 ano**: KV base 50, mA 40
- **5 anos**: KV base 55, mA 60
- **10 anos**: KV base 60, mA 80
- **Adulto**: KV base 65, mA 200

### Tipos Físicos (Adultos)
- **Muito Magro** (45-55kg): -8 KV, 0.7x tempo
- **Magro** (55-65kg): -5 KV, 0.8x tempo
- **Magro-Médio** (65-75kg): -3 KV, 0.85x tempo
- **Médio** (70-80kg): 0 KV, 1.0x tempo
- **Médio-Forte** (80-90kg): +3 KV, 1.1x tempo
- **Forte** (90-100kg): +6 KV, 1.2x tempo
- **Obeso** (100-120kg): +10 KV, 1.3x tempo
- **Muito Obeso** (120kg+): +15 KV, 1.5x tempo

## 🛠️ Tecnologias Utilizadas

- **HTML5** - Estrutura semântica
- **CSS3** - Estilos modernos com variáveis CSS e gradientes
- **JavaScript ES6+** - Lógica de cálculo e interatividade
- **Font Awesome** - Ícones profissionais
- **Google Fonts** - Tipografia Inter

## 📱 Responsividade

A aplicação é totalmente responsiva e funciona perfeitamente em:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (480px - 767px)
- Mobile pequeno (< 480px)

## 🎨 Design

- **Paleta de cores moderna**: Azul ciano (#00d4ff) e laranja (#ff6b35)
- **Gradientes elegantes** para elementos visuais
- **Animações suaves** para melhor experiência do usuário
- **Logo personalizado** com efeitos hover
- **Interface intuitiva** com feedback visual

## 📊 Funcionalidades

### Cálculo Automático
- KV ajustado por idade, tipo físico e região corporal
- mA baseado na faixa etária
- mAs calculado automaticamente (mA × tempo)
- Tempo otimizado para cada região

### Regiões Corporais Suportadas
- **Cabeça e Pescoço**: Crânio, Face, Cavum
- **Tórax**: Costelas, Tórax (PA, Lat, AP)
- **Membros Superiores**: Úmero, Antebraço, Ombro, Mão, Punho
- **Tronco**: Abdômen, Pelve/Bacia
- **Membros Inferiores**: Fêmur, Perna, Pé, Tornozelo
- **Outras**: Cotovelo, Joelho, Quadril, Dedo, Calcâneo

### Funcionalidades Extras
- **Salvar configuração** no navegador
- **Imprimir relatório** com parâmetros
- **Notificações** de feedback
- **Animações** de resultados

## 🚀 Como Usar

1. **Selecione a faixa etária** do paciente
2. **Escolha o tipo físico** (apenas para adultos)
3. **Selecione a região corporal** geral
4. **Escolha a projeção específica** (AP, Lat, Oblíqua, etc.)
5. **Clique em "CALCULAR PARÂMETROS"**
6. **Visualize os resultados** de KV, mA e mAs

## 📄 Licença

Este projeto foi desenvolvido para uso educacional e profissional em radiologia.

## 👨‍⚕️ Desenvolvido para Técnicos de Radiologia

A ExpoRad foi criada pensando na praticidade e precisão necessárias para o trabalho diário dos técnicos de radiologia, oferecendo uma ferramenta confiável e fácil de usar.

---

**ExpoRad** - Acertar a técnica usando a calculadora fica muito fácil! 🚀

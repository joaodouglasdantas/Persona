const PERSONALITIES = {
  V: {
    id: 'V',
    name: 'Vermelho',
    color: '#E05252',
    colorRgb: '224, 82, 82',
    colorBg: 'rgba(224, 82, 82, 0.12)',
    colorBorder: 'rgba(224, 82, 82, 0.4)',
    icon: '🔴',
    title: 'Direto e Objetivo',
    tagline: 'Orientado a resultados, assertivo e determinado.',
    description: 'O perfil Vermelho é movido por poder, resultados e direção. São pessoas naturalmente competitivas, impacientes com processos lentos e fortemente orientadas para metas. Na comunicação, são diretos, claros e concisos, sempre focados em soluções práticas.',
    strengths: ['Determinação inabalável', 'Foco total em resultados', 'Liderança natural e espontânea', 'Decisões rápidas e assertivas', 'Alta produtividade sob pressão'],
    challenges: ['Pode parecer impaciente ou agressivo', 'Dificuldade em ouvir opiniões divergentes', 'Tende a desconsiderar aspectos emocionais', 'Pode atropelar pessoas em busca de resultados'],
    bodyLanguage: 'Postura inclinada para frente, contato visual firme, fala rápida e gestos propositais.',
    communicationTip: 'Seja direto, objetivo e foque nos resultados. Vá direto ao ponto e ofereça soluções, não problemas. Evite rodeios e sentimentalismos.',
    motivations: 'Poder, resultados concretos, eficiência e conquistas mensuráveis.',
    fears: 'Perda de controle, ineficiência e dependência de outros.',
    zoneLabel: 'RÁPIDO · TAREFA',
    quadrant: { xSign: -1, ySign: -1 }
  },
  A: {
    id: 'A',
    name: 'Amarelo',
    color: '#D4A017',
    colorRgb: '212, 160, 23',
    colorBg: 'rgba(212, 160, 23, 0.12)',
    colorBorder: 'rgba(212, 160, 23, 0.4)',
    icon: '🟡',
    title: 'Expansivo e Criativo',
    tagline: 'Sociável, entusiasmado e cheio de novas ideias.',
    description: 'O perfil Amarelo é impulsionado por energia, conexões sociais e novas ideias. São pessoas sociáveis, otimistas e entusiasmadas, que valorizam a interação e a criatividade. Pensam em voz alta e adoram conectar pessoas e compartilhar entusiasmo.',
    strengths: ['Alta criatividade e originalidade', 'Facilidade em criar conexões profundas', 'Otimismo contagiante', 'Adaptabilidade a novas situações', 'Comunicação envolvente e inspiradora'],
    challenges: ['Pode ser disperso e impulsivo', 'Dificuldade com estrutura e rotinas', 'Pode não terminar o que começa', 'Tende a superestimar possibilidades'],
    bodyLanguage: 'Sorrisos frequentes, gesticulação ampla, variação de tom de voz e postura aberta e convidativa.',
    communicationTip: 'Seja entusiasmado e use histórias, metáforas e analogias. Envolva a pessoa na conversa. Evite excesso de dados e tom frio.',
    motivations: 'Reconhecimento social, criatividade, novidades e interação constante com pessoas.',
    fears: 'Isolamento, rejeição e ambientes rígidos sem espaço para criatividade.',
    zoneLabel: 'RÁPIDO · PESSOAS',
    quadrant: { xSign: 1, ySign: -1 }
  },
  Ve: {
    id: 'Ve',
    name: 'Verde',
    color: '#2EBC6E',
    colorRgb: '46, 188, 110',
    colorBg: 'rgba(46, 188, 110, 0.12)',
    colorBorder: 'rgba(46, 188, 110, 0.4)',
    icon: '🟢',
    title: 'Calmo e Harmonioso',
    tagline: 'Empático, paciente e buscador de harmonia.',
    description: 'O perfil Verde prioriza harmonia, estabilidade e segurança emocional. São pessoas pacientes, acolhedoras e avessas a conflitos. Excelentes ouvintes que valorizam profundamente as relações interpessoais e o bem-estar coletivo acima de tudo.',
    strengths: ['Empatia excepcional', 'Paciência e estabilidade emocional', 'Habilidade de mediação de conflitos', 'Lealdade e confiabilidade', 'Escuta ativa profunda'],
    challenges: ['Dificuldade em dizer não', 'Pode evitar conflitos necessários', 'Tomada de decisão lenta por excesso de considerações', 'Pode acumular ressentimentos sem expressar'],
    bodyLanguage: 'Expressões faciais sutis, fala lenta e ponderada, postura estável e serena que transmite acolhimento.',
    communicationTip: 'Seja gentil, paciente e demonstre apoio genuíno. Explique o "porquê" das coisas e dê tempo para processar. Evite pressão e urgência injustificada.',
    motivations: 'Harmonia, segurança emocional, relações próximas e bem-estar do grupo.',
    fears: 'Conflitos diretos, mudanças bruscas e ambientes hostis ou instáveis.',
    zoneLabel: 'LENTO · PESSOAS',
    quadrant: { xSign: 1, ySign: 1 }
  },
  Az: {
    id: 'Az',
    name: 'Azul',
    color: '#3A87C8',
    colorRgb: '58, 135, 200',
    colorBg: 'rgba(58, 135, 200, 0.12)',
    colorBorder: 'rgba(58, 135, 200, 0.4)',
    icon: '🔵',
    title: 'Lógico e Detalhista',
    tagline: 'Analítico, preciso e orientado por dados e evidências.',
    description: 'O perfil Azul é guiado pela lógica, estrutura e precisão. São pessoas analíticas, cautelosas, metódicas e perfeccionistas. Valorizam a exatidão e a fundamentação em dados e evidências antes de qualquer decisão.',
    strengths: ['Análise profunda e precisa', 'Qualidade e perfeccionismo genuíno', 'Organização impecável', 'Pensamento crítico aguçado', 'Alta confiabilidade nos detalhes'],
    challenges: ['Pode ser excessivamente crítico', 'Paralisia por análise', 'Dificuldade com improvisos e mudanças', 'Pode parecer frio ou distante'],
    bodyLanguage: 'Tom de voz controlado, pausas longas para reflexão, gestos econômicos e atenção constante a detalhes.',
    communicationTip: 'Use precisão, estrutura e dados concretos. Organize argumentos em passos lógicos. Evite termos vagos, improvisos e exageros.',
    motivations: 'Qualidade, precisão, estrutura clara e resolução lógica de problemas complexos.',
    fears: 'Erros, imprecisões, caos e falta de planejamento.',
    zoneLabel: 'LENTO · TAREFA',
    quadrant: { xSign: -1, ySign: 1 }
  }
};

const CONFLICTS = [
  {
    pair: ['V', 'Ve'],
    title: 'Vermelho ✕ Verde',
    icon: '⚡',
    tension: 'Alta',
    tensionLevel: 3,
    description: 'O Vermelho, focado em velocidade e resultados, interpreta a cautela do Verde como indecisão ou falta de proatividade. O Verde, por sua vez, sente-se pressionado e desvalorizado pela abordagem direta e impaciente do Vermelho. A velocidade de um choca com a necessidade de harmonia e consenso do outro.',
    bridgeTip: 'Vermelhos devem desacelerar e explicar o "porquê" das decisões. Verdes precisam praticar assertividade e comunicar suas necessidades com mais clareza.',
    redSees: 'Indeciso, lento, sem proatividade',
    greenSees: 'Agressivo, impaciente, insensível',
    inCommon: 'Ambos buscam efetividade — por caminhos opostos.'
  },
  {
    pair: ['A', 'Az'],
    title: 'Amarelo ✕ Azul',
    icon: '⚡',
    tension: 'Alta',
    tensionLevel: 3,
    description: 'A natureza lógica e detalhista do Azul vê a espontaneidade do Amarelo como superficialidade ou falta de rigor. O Amarelo, por sua vez, acha o Azul excessivamente crítico, rígido e sem graça. A criatividade impulsiva do Amarelo entra em choque com a necessidade de estrutura e dados do Azul.',
    bridgeTip: 'Amarelos devem trazer mais dados e estrutura às suas ideias. Azuis devem abrir espaço para criatividade e tolerar mais a ambiguidade criativa.',
    redSees: 'Superficial, desorganizado, impulsivo',
    greenSees: 'Crítico demais, rígido, sem imaginação',
    inCommon: 'Ambos querem fazer bem-feito — com visões diferentes do que "bem-feito" significa.'
  },
  {
    pair: ['V', 'Az'],
    title: 'Vermelho × Azul',
    icon: '⚠️',
    tension: 'Moderada',
    tensionLevel: 2,
    description: 'Ambos são orientados a tarefas, mas o Vermelho quer velocidade e o Azul quer precisão. O Vermelho pode achar o Azul lento demais; o Azul pode achar o Vermelho superficial e precipitado. Com respeito mútuo, formam uma dupla poderosa: velocidade + qualidade.',
    bridgeTip: 'Definir juntos prazos e critérios de qualidade antes de começar elimina a maior parte das tensões.',
    redSees: 'Lento, perfeccionista ao extremo',
    greenSees: 'Precipitado, superficial nos detalhes',
    inCommon: 'Ambos são orientados a resultados e tarefas — há muito terreno comum.'
  },
  {
    pair: ['A', 'Ve'],
    title: 'Amarelo × Verde',
    icon: '🤝',
    tension: 'Baixa',
    tensionLevel: 1,
    description: 'Ambos são orientados a pessoas, o que cria uma afinidade natural. O Amarelo traz energia e entusiasmo; o Verde traz calma e empatia. Podem surgir pequenas tensões quando o Amarelo quer agir rápido e o Verde quer garantir que todos estejam bem.',
    bridgeTip: 'Um equilíbrio natural: Amarelos podem animar, Verdes podem acolher. Excelente dupla para ambientes colaborativos.',
    redSees: 'Às vezes lento e excessivamente cauteloso',
    greenSees: 'Às vezes impulsivo e pouco atento às emoções',
    inCommon: 'Ambos valorizam as pessoas e os relacionamentos — são naturalmente empáticos.'
  }
];

const COMPATIBILITY = {
  V: {
    V:  { level: 2, label: 'Competitivo',  desc: 'Dois Vermelhos podem ser uma dupla explosiva de resultados, mas precisam negociar liderança para não colidir.' },
    A:  { level: 4, label: 'Sinérgico',    desc: 'Vermelho + Amarelo é uma dupla de alto impacto: velocidade + energia. Ambos são rápidos e expansivos.' },
    Ve: { level: 1, label: 'Tenso',        desc: 'A maior tensão do modelo. Velocidade vs. harmonia. Requer muito esforço de ambos.' },
    Az: { level: 3, label: 'Funcional',    desc: 'Tarefa + tarefa. Velocidade vs. precisão. Com combinação de acordos, pode ser muito produtivo.' }
  },
  A: {
    V:  { level: 4, label: 'Sinérgico',    desc: 'Dupla de alta energia. Criatividade + execução. Podem mover montanhas juntos.' },
    A:  { level: 3, label: 'Explosivo',    desc: 'Dois Amarelos são muito criativos mas podem ter dificuldade em concluir projetos.' },
    Ve: { level: 4, label: 'Harmonioso',   desc: 'Pessoas + pessoas. Criam ambientes acolhedores e criativos. Excelente sinergia social.' },
    Az: { level: 1, label: 'Tenso',        desc: 'A maior tensão do modelo. Criatividade vs. estrutura. Requer adaptação mútua intensa.' }
  },
  Ve: {
    V:  { level: 1, label: 'Tenso',        desc: 'Harmonia vs. velocidade. Um dos pares mais desafiadores. Precisa de muita comunicação consciente.' },
    A:  { level: 4, label: 'Harmonioso',   desc: 'Dupla de calor humano. Juntos criam ambientes de segurança e criatividade.' },
    Ve: { level: 3, label: 'Sereno',       desc: 'Dois Verdes são muito harmoniosos, mas podem ter dificuldade em tomar decisões difíceis.' },
    Az: { level: 4, label: 'Complementar', desc: 'Verde + Azul é uma dupla sólida e confiável. Calor humano + precisão técnica.' }
  },
  Az: {
    V:  { level: 3, label: 'Funcional',    desc: 'Precisão + velocidade. Produtivo com acordos claros de processo.' },
    A:  { level: 1, label: 'Tenso',        desc: 'Estrutura vs. espontaneidade. Comunicação muito consciente é necessária.' },
    Ve: { level: 4, label: 'Complementar', desc: 'Dupla consistente: análise rigorosa + empatia. Excelentes em projetos de longo prazo.' },
    Az: { level: 2, label: 'Meticuloso',   desc: 'Dois Azuis produzem com alta qualidade, mas podem ser lentos por excesso de análise.' }
  }
};

const QUESTIONS = [
  {
    id: 1,
    stemSelf: "Quando você enfrenta um problema complexo, qual é a sua primeira reação?",
    stemOther: "Quando {name} enfrenta um problema complexo, qual costuma ser a primeira reação?",
    options: [
      { text: "Agir imediatamente, buscando a solução mais rápida e eficiente possível.", color: "V" },
      { text: "Conversar com outras pessoas, explorar ideias criativas e novas perspectivas.", color: "A" },
      { text: "Ouvir todos os envolvidos, buscar consenso e preservar os relacionamentos.", color: "Ve" },
      { text: "Analisar todos os dados e informações disponíveis antes de tomar qualquer atitude.", color: "Az" }
    ]
  },
  {
    id: 2,
    stemSelf: "Em uma reunião ou discussão em grupo, você tende a:",
    stemOther: "Em uma reunião ou discussão em grupo, {name} tende a:",
    options: [
      { text: "Liderar a conversa e direcionar o grupo para resultados e decisões concretas.", color: "V" },
      { text: "Animar o grupo, trazer novas ideias e manter o clima positivo e engajado.", color: "A" },
      { text: "Ouvir atentamente a todos antes de falar, evitando gerar conflitos.", color: "Ve" },
      { text: "Fazer perguntas detalhadas e verificar se tudo está bem fundamentado.", color: "Az" }
    ]
  },
  {
    id: 3,
    stemSelf: "Qual dessas situações te causa mais desconforto ou irritação?",
    stemOther: "Qual dessas situações costuma causar mais desconforto ou irritação em {name}?",
    options: [
      { text: "Processos lentos, burocracia excessiva e pessoas indecisas.", color: "V" },
      { text: "Ambientes rígidos, sem espaço para criatividade ou interação social.", color: "A" },
      { text: "Conflitos diretos, pressão intensa e falta de harmonia no grupo.", color: "Ve" },
      { text: "Imprecisões, improvisações e falta de dados ou planejamento sólido.", color: "Az" }
    ]
  },
  {
    id: 4,
    stemSelf: "Como você prefere que informações importantes sejam apresentadas a você?",
    stemOther: "Como {name} prefere receber informações importantes?",
    options: [
      { text: "De forma resumida, direto ao ponto, com foco no resultado e próximos passos.", color: "V" },
      { text: "De forma dinâmica e envolvente, com histórias, exemplos e analogias.", color: "A" },
      { text: "Com contexto e gentileza, explicando o impacto nas pessoas envolvidas.", color: "Ve" },
      { text: "Com dados, evidências, estrutura clara e etapas lógicas verificáveis.", color: "Az" }
    ]
  },
  {
    id: 5,
    stemSelf: "Quando você está em um ambiente social completamente novo, você tende a:",
    stemOther: "Quando {name} está em um ambiente social completamente novo, costuma:",
    options: [
      { text: "Tomar a iniciativa naturalmente e assumir um papel de liderança.", color: "V" },
      { text: "Se aproximar das pessoas com facilidade e criar conexões rapidamente.", color: "A" },
      { text: "Observar o ambiente com cautela antes de agir e ser seletivo nas novas relações.", color: "Ve" },
      { text: "Ficar em posição de observador, só se envolvendo quando for realmente necessário.", color: "Az" }
    ]
  },
  {
    id: 6,
    stemSelf: "Qual é a sua maior motivação ao trabalhar em um projeto desafiador?",
    stemOther: "Qual costuma ser a maior motivação de {name} ao trabalhar em um projeto desafiador?",
    options: [
      { text: "Alcançar resultados concretos e superar as metas estabelecidas.", color: "V" },
      { text: "Ter liberdade criativa e trabalhar com pessoas animadas e engajadas.", color: "A" },
      { text: "Contribuir para o bem-estar do grupo e criar um ambiente harmonioso.", color: "Ve" },
      { text: "Garantir que tudo seja feito com qualidade, precisão e excelência.", color: "Az" }
    ]
  },
  {
    id: 7,
    stemSelf: "Como você lida com prazos apertados e situações de urgência?",
    stemOther: "Como {name} costuma lidar com prazos apertados e situações de urgência?",
    options: [
      { text: "Funciona bem sob pressão, usa a adrenalina para entregar resultados.", color: "V" },
      { text: "Começa bem, mas pode se distrair com novas ideias no meio do caminho.", color: "A" },
      { text: "Prefere planejar com antecedência para evitar o estresse de última hora.", color: "Ve" },
      { text: "Organiza tudo meticulosamente, mas pode atrasar buscando a perfeição.", color: "Az" }
    ]
  },
  {
    id: 8,
    stemSelf: "Quando precisa convencer alguém de uma ideia ou decisão, você:",
    stemOther: "Quando {name} precisa convencer alguém de uma ideia ou decisão, costuma:",
    options: [
      { text: "Ir direto ao ponto, argumentando com fatos objetivos e eficiência.", color: "V" },
      { text: "Usar histórias, entusiasmo e apelar para as possibilidades positivas.", color: "A" },
      { text: "Buscar o consenso, mostrando como a ideia beneficia a todos.", color: "Ve" },
      { text: "Apresentar dados, evidências e argumentos lógicos bem estruturados.", color: "Az" }
    ]
  },
  {
    id: 9,
    stemSelf: "Em situações de conflito com outra pessoa, você geralmente:",
    stemOther: "Em situações de conflito com outra pessoa, {name} geralmente:",
    options: [
      { text: "Enfrenta diretamente, diz o que pensa com clareza e busca resolver rápido.", color: "V" },
      { text: "Tenta usar o humor ou a criatividade para aliviar a tensão.", color: "A" },
      { text: "Evita o confronto ao máximo e busca conciliar preservando o relacionamento.", color: "Ve" },
      { text: "Analisa a situação com distância emocional antes de se posicionar.", color: "Az" }
    ]
  },
  {
    id: 10,
    stemSelf: "Como você descreveria sua relação com regras, normas e estruturas?",
    stemOther: "Como seria descrita a relação de {name} com regras, normas e estruturas?",
    options: [
      { text: "Aceito regras quando fazem sentido para os resultados, mas as questiono quando não.", color: "V" },
      { text: "Prefiro flexibilidade — regras muito rígidas me sufocam e limitam a criatividade.", color: "A" },
      { text: "Respeito as regras pois trazem estabilidade e segurança para todos.", color: "Ve" },
      { text: "Valorizo regras claras e bem fundamentadas que garantam qualidade e consistência.", color: "Az" }
    ]
  },
  {
    id: 11,
    stemSelf: "Ao tomar uma decisão importante, o que pesa mais para você?",
    stemOther: "Ao tomar uma decisão importante, o que costuma pesar mais para {name}?",
    options: [
      { text: "O impacto direto nos resultados e na eficiência do processo.", color: "V" },
      { text: "O entusiasmo que a opção gera e o potencial de novidade e crescimento.", color: "A" },
      { text: "Como as pessoas envolvidas vão se sentir com cada opção.", color: "Ve" },
      { text: "Os dados disponíveis, os riscos calculados e a lógica por trás da escolha.", color: "Az" }
    ]
  },
  {
    id: 12,
    stemSelf: "Qual das opções abaixo melhor descreve o seu maior ponto forte?",
    stemOther: "Qual das opções abaixo melhor descreve o maior ponto forte de {name}?",
    options: [
      { text: "Determinação e capacidade de gerar resultados mesmo sob pressão extrema.", color: "V" },
      { text: "Criatividade, energia e facilidade natural de se conectar com as pessoas.", color: "A" },
      { text: "Empatia, paciência e habilidade de criar ambientes de harmonia.", color: "Ve" },
      { text: "Precisão, organização e capacidade de análise profunda e minuciosa.", color: "Az" }
    ]
  },
  {
    id: 13,
    stemSelf: "Quando alguém critica diretamente o seu trabalho, você:",
    stemOther: "Quando alguém critica diretamente o trabalho de {name}, a reação costuma ser:",
    options: [
      { text: "Ouvir rapidamente, avaliar se é útil para o resultado e seguir em frente.", color: "V" },
      { text: "Sentir-se atingido inicialmente, mas processar rápido e seguir motivado.", color: "A" },
      { text: "Levar um tempo para processar emocionalmente antes de conseguir responder.", color: "Ve" },
      { text: "Analisar detalhadamente se a crítica tem base lógica antes de aceitá-la.", color: "Az" }
    ]
  },
  {
    id: 14,
    stemSelf: "Como você prefere colaborar com outras pessoas em tarefas importantes?",
    stemOther: "Como {name} prefere colaborar com outras pessoas em tarefas importantes?",
    options: [
      { text: "Com papéis claros e autonomia total para decidir e executar.", color: "V" },
      { text: "Em equipes dinâmicas, com liberdade para trocar ideias e improvisar.", color: "A" },
      { text: "Em grupos coesos e harmoniosos onde todos se sentem valorizados.", color: "Ve" },
      { text: "Em processos bem definidos, com critérios claros de qualidade.", color: "Az" }
    ]
  },
  {
    id: 15,
    stemSelf: "Qual frase ressoa mais com a forma como você enxerga o mundo?",
    stemOther: "Qual frase ressoa mais com a forma como {name} enxerga o mundo?",
    options: [
      { text: "\"O mundo pertence aos que agem. Resultados falam mais alto que palavras.\"", color: "V" },
      { text: "\"A vida é feita de conexões. Cada pessoa que encontro tem algo para me ensinar.\"", color: "A" },
      { text: "\"O que realmente importa são as relações que construímos e o bem que fazemos.\"", color: "Ve" },
      { text: "\"A excelência está nos detalhes. Fazer bem-feito é o único jeito que conheço.\"", color: "Az" }
    ]
  }
];

function fisherYates(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleOptions(questions) {
  return fisherYates(questions).map(q => ({
    ...q,
    options: fisherYates(q.options)
  }));
}

function calculatePersonality(answers) {
  const scores = { V: 0, A: 0, Ve: 0, Az: 0 };
  answers.forEach(color => scores[color]++);
  const total = answers.length;
  const percentages = {};
  Object.keys(scores).forEach(k => {
    percentages[k] = Math.round((scores[k] / total) * 100);
  });
  const dominant = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  return { scores, percentages, dominant };
}

function getCompatibility(colorA, colorB) {
  return COMPATIBILITY[colorA]?.[colorB] || { level: 2, label: 'Neutro', desc: 'Relacionamento neutro.' };
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

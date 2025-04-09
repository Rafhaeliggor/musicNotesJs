class Partitura {
  constructor(containerId, options = {}) {
    this.options = {
      width: 500,         
      height: 170,        
      lineSpacing: 10,    
      lineColor: '#000',  
      lineWidth: 2,       
      ...options,
    };

    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container com ID "${containerId}" não encontrado.`);
      return;
    }

    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('viewBox', `0 0 ${this.options.width} ${this.options.height}`);
    this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
    this.container.appendChild(this.svg);

    this.drawStaff();
  }

  drawStaff() {
    const { width, height, lineSpacing, lineColor, lineWidth } = this.options;
    const startX = 50;
    const endX = width - 50;
    const centerY = height / 2;

    for (let i = 0; i < 5; i++) {
      const y = centerY - (2 * lineSpacing) + (i * lineSpacing);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', startX);
      line.setAttribute('y1', y);
      line.setAttribute('x2', endX);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', lineColor);
      line.setAttribute('stroke-width', lineWidth);
      this.svg.appendChild(line);
    }
  }

    addNote(x, pitch, type = 'quarter') {
    const { lineSpacing } = this.options;
    const centerY = this.options.height / 2;
    const y = centerY - (pitch * lineSpacing / 2);

    const noteHead = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    noteHead.setAttribute('cx', x + 4);
    noteHead.setAttribute('cy', y);
    noteHead.setAttribute('rx', 7);  
    noteHead.setAttribute('ry', 5.5);   
    noteHead.setAttribute('fill', '#000');
    this.svg.appendChild(noteHead);

    noteHead.setAttribute('transform', `rotate(${5}, ${x}, ${y})`);

    if (type !== 'whole') {
        const stem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        stem.setAttribute('x1', x + 10);  
        stem.setAttribute('y1', y);
        stem.setAttribute('x2', x + 10);
        stem.setAttribute('y2', y - 30);
        stem.setAttribute('stroke', '#000');
        stem.setAttribute('stroke-width', 2);
        this.svg.appendChild(stem);
    }
    }

async addClef(type = 'G', scale = .345) {
  const clefFiles = {
    G: 'assets/clef/G.svg',
    F: 'assets/clef/F.svg',
    D: 'assets/clef/D.svg'
  };

  const { lineSpacing, height } = this.options;
  const centerY = (height - 105) / 2;
  const startX = 50;

  try {
    const response = await fetch(clefFiles[type]);
    if (!response.ok) throw new Error(`Clave "${type}" não encontrada.`);
    const svgText = await response.text();

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    const clefPath = svgDoc.querySelector('path, g')?.outerHTML || svgText;

    const clefGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    clefGroup.setAttribute('class', `clef ${type.toLowerCase()}-clef`);

    let offsetY = 0;
    switch (type) {
      case 'G': offsetY = lineSpacing * 1.30; break;
      case 'F': offsetY = lineSpacing * 3.1;  break;
      case 'D': offsetY = 0;                  break;
    }

    clefGroup.setAttribute(
      'transform',
      `translate(${startX}, ${centerY + offsetY}) scale(${scale})` 
    );

    clefGroup.innerHTML = clefPath;
    this.svg.appendChild(clefGroup);

    this.clefOffset = 60 * scale; 

  } catch (error) {
    console.error('Erro ao carregar a clave:', error);
  }
}

addKeySignature(tonality) {
    const TONES = {
        'DOM': [[], ''], // Dó maior não tem acidentes
        'SOLM': [[4], '#'], // FÁ (posição 4) vira FÁ#
        'REM': [[4, 1], '#'], // FÁ (4) e DÓ (1) viram sustenidos
        'LAM': [[4, 1, 5], '#'], // FÁ (4), DÓ (1), SOL (5)
        'MIM': [[4, 1, 5, 2], '#'], // FÁ (4), DÓ (1), SOL (5), RÉ (2)
        'SIM': [[4, 1, 5, 2, 6], '#'], // FÁ (4), DÓ (1), SOL (5), RÉ (2), LÁ (6)
        'FA#M': [[4, 1, 5, 2, 6, 3], '#'], // FÁ (4), DÓ (1), SOL (5), RÉ (2), LÁ (6), MI (3)
        'DO#M': [[4, 1, 5, 2, 6, 3, 0], '#'], // FÁ (4), DÓ (1), SOL (5), RÉ (2), LÁ (6), MI (3), SI (0)
        'FAM': [[0], 'b'], // SI (posição 0) vira SIb
        'SIbM': [[0, 3], 'b'], // SI (0) e MI (3) viram bemóis
        'MIbM': [[0, 3, 6], 'b'], // SI (0), MI (3), LÁ (6)
        'LAbM': [[0, 3, 6, 2], 'b'], // SI (0), MI (3), LÁ (6), RÉ (2)
        'REbM': [[0, 3, 6, 2, 5], 'b'], // SI (0), MI (3), LÁ (6), RÉ (2), SOL (5)
        'SOLbM': [[0, 3, 6, 2, 5, 1], 'b'], // SI (0), MI (3), LÁ (6), RÉ (2), SOL (5), DÓ (1)
        'DObM': [[0, 3, 6, 2, 5, 1, 4], 'b'] // SI (0), MI (3), LÁ (6), RÉ (2), SOL (5), DÓ (1), FÁ (4)
    };

    const { lineSpacing } = this.options;
    const centerY = this.options.height / 2;
    const startX = 100; 
    
    if (!TONES[tonality]) {
        console.error('Tonalidade não encontrada:', tonality);
        return;
    }

    const [positions, accidentalType] = TONES[tonality];
    
    if (positions.length === 0) {
        return;
    }

    const accidentalSVGPath = `assets/clef/${accidentalType === '#' ? 'sharp' : 'bemol'}.svg`;
    
    positions.forEach((position, index) => {
        const y = centerY - (position * lineSpacing / 2);
        const x = startX + (index * 15);
        
        const accidental = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        accidental.setAttribute('href', accidentalSVGPath);
        accidental.setAttribute('x', x);
        accidental.setAttribute('y', y - 13); 
        accidental.setAttribute('width', '15');
        accidental.setAttribute('height', '25');
        this.svg.appendChild(accidental);
    });
}

drawScaleNotes(tonality, startX = 50) {
    const SCALE_NOTES = {
        'DOM': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
        'SOLM': ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
        'REM': ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
        'LAM': ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
        'MIM': ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
        'SIM': ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'],
        'FA#M': ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'],
        'DO#M': ['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B#'],
        'FAM': ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
        'SIbM': ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
        'MIbM': ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
        'LAbM': ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
        'REbM': ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
        'SOLbM': ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F'],
        'DObM': ['Cb', 'Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bb']
    };

    const NOTE_POSITIONS = {
        'C': -6, 'C#': -6, 'Db': -6, 'B#': -6, 'Cb': -5,
        'D': -5, 'D#': -5, 'Eb': -5, 'C##': -5, 'Db': -5,
        'E': -4, 'E#': -4, 'Fb': -4, 'D##': -4, 'Eb': -4,
        'F': -3, 'F#': -3, 'Gb': -3, 'E#': -3, 'Fb': -3,
        'G': -2, 'G#': -2, 'Ab': -2, 'F##': -2, 'Gb': -2,
        'A': -1, 'A#': -1, 'Bb': -1, 'G##': -1, 'Ab': -1,
        'B': 0, 'B#': 0, 'Cb': 0, 'A##': 0, 'Bb': 0
    };

    const { lineSpacing } = this.options;
    const centerY = this.options.height / 2;
    const noteSpacing = 30;
    const accidentalOffsetX = -15;
    const accidentalOffsetY = -12;
    const accidentalWidth = 15;
    const accidentalHeight = 25;
    const octaveSpan = 7; 

    if (!SCALE_NOTES[tonality]) {
        console.error('Tonalidade não encontrada:', tonality);
        return;
    }

    const scaleNotes = SCALE_NOTES[tonality];
    
    const tonicNote = scaleNotes[0];
    const tonicNatural = tonicNote.replace(/[#b]/, '');
    let basePosition = NOTE_POSITIONS[tonicNatural];
    
    scaleNotes.forEach((note, index) => {
        const x = startX + (index * noteSpacing);
        const hasAccidental = note.includes('#') || note.includes('b');
        const naturalNote = note.replace(/[#b]/, '');
        
        let position = basePosition + index;
        
        if (position >= octaveSpan) {
            position -= octaveSpan;
        }
        
        const y = centerY - (position * lineSpacing / 2);
        
        if (hasAccidental) {
            const accidentalType = note.includes('#') ? 'sharp' : 'bemol';
            const accidentalSVGPath = `assets/clef/${accidentalType}.svg`;
            
            const accidental = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            accidental.setAttribute('href', accidentalSVGPath);
            accidental.setAttribute('x', x + accidentalOffsetX);
            accidental.setAttribute('y', y + accidentalOffsetY - 6);
            accidental.setAttribute('width', accidentalWidth);
            accidental.setAttribute('height', accidentalHeight);
            this.svg.appendChild(accidental);
        }
        
        this.addNote(x, position, 'quarter');
    });
}

drawChordFromScale(tonality, chordType = 'major', startX = 50) {
    // Dicionários de escalas (mantidos do seu código)
    const SCALE_NOTES = {
        'DOM': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
        'SOLM': ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
        'REM': ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
        'LAM': ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
        'MIM': ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
        'SIM': ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'],
        'FA#M': ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'],
        'DO#M': ['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B#'],
        'FAM': ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
        'SIbM': ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
        'MIbM': ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
        'LAbM': ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
        'REbM': ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
        'SOLbM': ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F'],
        'DObM': ['Cb', 'Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bb']
    };

    const SCALE_NOTES_RELATIVE_MINOR = {
        'Am': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
        'Em': ['E', 'F#', 'G', 'A', 'B', 'C', 'D'],
        'Bm': ['B', 'C#', 'D', 'E', 'F#', 'G', 'A'],
        'F#m': ['F#', 'G#', 'A', 'B', 'C#', 'D', 'E'],
        'C#m': ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B'],
        'G#m': ['G#', 'A#', 'B', 'C#', 'D#', 'E', 'F#'],
        'D#m': ['D#', 'E#', 'F#', 'G#', 'A#', 'B', 'C#'],
        'A#m': ['A#', 'B#', 'C#', 'D#', 'E#', 'F#', 'G#'],
        'Dm': ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'],
        'Gm': ['G', 'A', 'Bb', 'C', 'D', 'Eb', 'F'],
        'Cm': ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
        'Fm': ['F', 'G', 'Ab', 'Bb', 'C', 'Db', 'Eb'],
        'Bbm': ['Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'Ab'],
        'Ebm': ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'Cb', 'Db'],
        'Abm': ['Ab', 'Bb', 'Cb', 'Db', 'Eb', 'Fb', 'Gb']
    };

    // Combina ambos os dicionários
    const ALL_SCALES = {...SCALE_NOTES, ...SCALE_NOTES_RELATIVE_MINOR};

    // Posições das notas (mantido do seu código)
    const NOTE_POSITIONS = {
        'C': -6, 'C#': -6, 'Db': -6, 'B#': -6, 'Cb': -5,
        'D': -5, 'D#': -5, 'Eb': -5, 'C##': -5, 'Db': -5,
        'E': -4, 'E#': -4, 'Fb': -4, 'D##': -4, 'Eb': -4,
        'F': -3, 'F#': -3, 'Gb': -3, 'E#': -3, 'Fb': -3,
        'G': -2, 'G#': -2, 'Ab': -2, 'F##': -2, 'Gb': -2,
        'A': -1, 'A#': -1, 'Bb': -1, 'G##': -1, 'Ab': -1,
        'B': 0, 'B#': 0, 'Cb': 0, 'A##': 0, 'Bb': 0
    };

    // Configurações de desenho
    const { lineSpacing } = this.options;
    const centerY = this.options.height / 2;
    const accidentalOffsetX = -15;
    const accidentalOffsetY = -12;

    // Verifica se a tonalidade existe
    if (!ALL_SCALES[tonality]) {
        console.error('Tonalidade não encontrada:', tonality);
        return;
    }

    // Pega as notas da escala
    const scaleNotes = ALL_SCALES[tonality];
    
    // Determina as notas do acorde baseado no tipo
    let chordNotes = [];
    if (chordType === 'major') {
        // Acorde maior: 1ª, 3ª e 5ª notas da escala maior
        chordNotes = [scaleNotes[0], scaleNotes[2], scaleNotes[4]];
    } else if (chordType === 'minor') {
        // Acorde menor: 1ª, 3ª menor (2 semitons acima) e 5ª
        chordNotes = [scaleNotes[0], scaleNotes[2], scaleNotes[4]];
    }

    // Desenha as notas do acorde (todas no mesmo X)
    chordNotes.forEach((note, index) => {
        const x = startX + 20;
        const naturalNote = note.replace(/[#b]/, '');
        const position = NOTE_POSITIONS[naturalNote];
        const y = centerY - (position * lineSpacing / 2);
        
        // Desenha acidente se necessário
        if (note.includes('#') || note.includes('b')) {
            const accType = note.includes('#') ? 'sharp' : 'bemol';
            const acc = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            acc.setAttribute('href', `assets/clef/${accType}.svg`);
            acc.setAttribute('x', x + accidentalOffsetX);
            acc.setAttribute('y', y + accidentalOffsetY);
            acc.setAttribute('width', '15');
            acc.setAttribute('height', '25');
            this.svg.appendChild(acc);
        }

        // Desenha a nota (com pequeno deslocamento horizontal para evitar sobreposição)
        this.addNote(x, position, 'quarter');
    });
}

}
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

}
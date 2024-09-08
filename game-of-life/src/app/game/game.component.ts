import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';

const BOARD_WIDTH = 400; // Largeur par défaut du plateau
const BOARD_HEIGHT = 400; // Hauteur par défaut du plateau
const RESOLUTION = 10; // Résolution de la grille

export type Bit = 0 | 1;
export type BitArray = Bit[];

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent implements OnInit, AfterViewInit {
cleanCanvas() {
  //suprime everything :/
  this.context!.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
  //also resets the board
  this.createGrid();
}

  @ViewChild('gameBoard', { static: false, read: ElementRef })
  private canvas: ElementRef<HTMLCanvasElement> = {} as ElementRef;

  private context!: CanvasRenderingContext2D | null;
  private gameBoard: BitArray[] = [];
  private animationId: number | null = null;

  // Nouvelles propriétés pour les fonctionnalités demandées
  public boardSizes = [
    { name: 'Petit', width: 200, height: 200 },
    { name: 'Moyen', width: 400, height: 400 },
    { name: 'Grand', width: 1000, height: 600 },
  ];
  public selectedSize = this.boardSizes[1]; // Taille moyenne par défaut
  public isRunning = false;
  public generation = 0;
  public livingCells = 0;
  public isPainting = false;

  ngAfterViewInit() {
    this.initializeCanvas();
    this.createGrid();
  }

  ngOnInit(): void {}

  // Initialise le canvas avec la taille sélectionnée
  private initializeCanvas(): void {
    this.canvas.nativeElement.width = this.selectedSize.width;
    this.canvas.nativeElement.height = this.selectedSize.height;
    this.context = this.canvas.nativeElement.getContext('2d');
  }

  // Crée une nouvelle grille
  public createGrid(): void {
    const numOfRows = this.selectedSize.height / RESOLUTION;
    const numOfColumns = this.selectedSize.width / RESOLUTION;
    this.gameBoard = this.setupGrid(numOfRows, numOfColumns);
    this.render(this.gameBoard);
    this.updateLivingCells();
  }

  // Configure la grille initiale
  private setupGrid(numOfRows: number, numOfColumns: number): BitArray[] {
    const binaryRandom = () => (Math.random() > 0.5 ? 1 : 0);
    return new Array(numOfRows)
      .fill(0)
      .map(() => new Array(numOfColumns).fill(0).map(binaryRandom));
  }

  // Dessine la grille sur le canvas
  private render(gameBoard: BitArray[]): void {
    const ctx = this.context;
    if (!ctx) return;

    gameBoard.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        ctx.beginPath();
        ctx.rect(
          colIndex * RESOLUTION,
          rowIndex * RESOLUTION,
          RESOLUTION,
          RESOLUTION
        );
        ctx.fillStyle = cell ? 'black' : 'white';
        ctx.fill();
      });
    });
  }

  // Fonction d'animation pour faire évoluer le jeu
  private animate(): void {
    this.gameBoard = this.createNextGen(this.gameBoard);
    this.render(this.gameBoard);
    this.generation++;
    this.updateLivingCells();
    if (this.isRunning) {
      this.animationId = requestAnimationFrame(() => this.animate());
    }
  }

  // Démarre ou arrête la simulation
  public toggleSimulation(): void {
    this.isRunning = !this.isRunning;
    if (this.isRunning) {
      this.animate();
    } else if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
  }

  // Réinitialise la simulation
  public resetSimulation(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.generation = 0;
    this.createGrid();
  }

  // Met à jour le compte des cellules vivantes
  private updateLivingCells(): void {
    let sum = 0;
    for (let i = 0; i < this.gameBoard.length; i++) {
      for (let j = 0; j < this.gameBoard[i].length; j++) {
        sum += this.gameBoard[i][j];
      }
    }
    this.livingCells = sum;
  }

  // Change la taille du plateau

  public selectedSizeIndex?: number;
  public changeBoardSize(): void {
    this.selectedSize = this.boardSizes[this.selectedSizeIndex!];
    this.initializeCanvas();
    this.resetSimulation();
  }

  // Gère le clic sur une cellule pour la peindre
  public onCellClick(event: MouseEvent): void {
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const col = Math.floor(x / RESOLUTION);
    const row = Math.floor(y / RESOLUTION);

    if (
      row >= 0 &&
      row < this.gameBoard.length &&
      col >= 0 &&
      col < this.gameBoard[0].length
    ) {
      this.gameBoard[row][col] = this.gameBoard[row][col] ? 0 : 1;
      this.render(this.gameBoard);
      this.updateLivingCells();
    }
  }

  // Gère le survol d'une cellule pour la mise en surbrillance
  public onCellHover(event: MouseEvent): void {
    if (!this.isPainting) return;

    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const col = Math.floor(x / RESOLUTION);
    const row = Math.floor(y / RESOLUTION);

    if (
      row >= 0 &&
      row < this.gameBoard.length &&
      col >= 0 &&
      col < this.gameBoard[0].length
    ) {
      this.highlightCell(row, col);
    }
  }

  // Met en surbrillance une cellule
  private highlightCell(row: number, col: number): void {
    const ctx = this.context;
    if (!ctx) return;

    ctx.beginPath();
    ctx.rect(col * RESOLUTION, row * RESOLUTION, RESOLUTION, RESOLUTION);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fill();
  }

  // Active ou désactive le mode peinture
  public togglePaintMode(): void {
    this.isPainting = !this.isPainting;
  }

  // Sauvegarde la configuration actuelle
  public saveCurrentSeed(): void {
    const seed = JSON.stringify(this.gameBoard);
    localStorage.setItem('savedSeed', seed);
    console.log('Configuration sauvegardée');
  }

  // Charge une configuration sauvegardée
  public loadSavedSeed(): void {
    const savedSeed = localStorage.getItem('savedSeed');
    if (savedSeed) {
      this.gameBoard = JSON.parse(savedSeed);
      this.render(this.gameBoard);
      this.updateLivingCells();
      console.log('Configuration chargée');
    } else {
      console.log('Aucune configuration sauvegardée trouvée');
    }
  }

  // La logique de génération suivante reste inchangée
  private createNextGen(gameBoard: BitArray[]): BitArray[] {
    const nextGen: BitArray[] = [];
    for (let i = 0; i < gameBoard.length; i++) {
      nextGen[i] = [...gameBoard[i]];
    }

    gameBoard.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const aliveNeighbors: Number = this.countOfLivingNeighbors(
          gameBoard,
          rowIndex,
          colIndex
        );
        const becomeEnVie = aliveNeighbors === 3;
        const resteEnVie = cell && aliveNeighbors === 2;
        const newCellValue = becomeEnVie || resteEnVie ? 1 : 0;

        nextGen[rowIndex][colIndex] = newCellValue;
      });
    });

    return nextGen;
  }

  // La logique de comptage des voisins vivants reste inchangée
  private countOfLivingNeighbors(
    gameBoard: BitArray[],
    rowIndex: number,
    colIndex: number
  ): Number {
    const TL = gameBoard[rowIndex - 1]?.[colIndex - 1];
    const T = gameBoard[rowIndex - 1]?.[colIndex];
    const TR = gameBoard[rowIndex - 1]?.[colIndex + 1];
    const L = gameBoard[rowIndex]?.[colIndex - 1];
    const R = gameBoard[rowIndex]?.[colIndex + 1];
    const BL = gameBoard[rowIndex + 1]?.[colIndex - 1];
    const B = gameBoard[rowIndex + 1]?.[colIndex];
    const BR = gameBoard[rowIndex + 1]?.[colIndex + 1];

    let aliveNeighbors = 0;

    if (TL !== undefined && TL === 1) aliveNeighbors++;
    if (T !== undefined && T === 1) aliveNeighbors++;
    if (TR !== undefined && TR === 1) aliveNeighbors++;
    if (L !== undefined && L === 1) aliveNeighbors++;
    if (R !== undefined && R === 1) aliveNeighbors++;
    if (BL !== undefined && BL === 1) aliveNeighbors++;
    if (B !== undefined && B === 1) aliveNeighbors++;
    if (BR !== undefined && BR === 1) aliveNeighbors++;
    return aliveNeighbors;
  }
}

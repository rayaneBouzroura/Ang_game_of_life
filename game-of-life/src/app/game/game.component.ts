import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  viewChild,
} from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular'; // Angular Data Grid Component
import { ColDef } from 'ag-grid-community';
import { filter } from 'rxjs';

const BOARD_WIDTH = 400; //1
const BOARD_HEIGHT = 400; //1
const RESOLUTION = 10;

export type Bit = 0 | 1;
export type BitArray = Bit[];

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent implements OnInit, AfterViewInit {
  createGrid() {
    throw new Error('Method not implemented.');
  }
  //inject ref  to canvas field template dans le html , pour pouvoir l'utiliser
  @ViewChild('gameBoard', { static: false, read: ElementRef })
  private canvas: ElementRef<HTMLCanvasElement> = {} as ElementRef;
  rows: number = 0;
  columns: number = 0;

  private context!: CanvasRenderingContext2D | null;

  //we change the specs of the canvas inside ngAfterViewInit
  ngAfterViewInit() {
    this.canvas.nativeElement.width = BOARD_WIDTH;
    this.canvas.nativeElement.height = BOARD_HEIGHT;
    this.context = this.canvas.nativeElement.getContext('2d');
    const numOfRows = BOARD_HEIGHT / RESOLUTION;
    const numOfColumns = BOARD_WIDTH / RESOLUTION;

    //init grid

    const gameBoard = this.setupGrid(numOfRows, numOfColumns);
    this.render(gameBoard);


    this.animate(gameBoard);
  }
  animate(gameBoard: BitArray[]) {
    requestAnimationFrame(() => this.animate(this.createNextGen(gameBoard)));
    this.render(gameBoard);
  }

  setupGrid(numOfRows: number, numOfColumns: number) {
    const binaryRandom = () => (Math.random() > 0.5 ? 1 : 0);

    const board: BitArray[] = new Array(numOfRows)
      .fill(0)
      .map(() => new Array(numOfColumns).fill(0).map(binaryRandom));

    console.log(board);

    return board;
  }

  render(gameBoard: BitArray[]) {
    const ctx = this.context;
    const res = RESOLUTION;
    gameBoard.forEach((row, rowIndex) => {
      row.forEach((c, collIndex) => {
        ctx!.beginPath();
        ctx!.rect(collIndex * res, rowIndex * res, res, res);
        ctx!.fillStyle = c ? 'black' : 'white';
        ctx!.fill();
        //ctx!.stroke();
      });
    });
  }
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

  private createNextGen(gameBoard: BitArray[]): BitArray[] {
    const nextGen: BitArray[] = [];
    //copy current state of board
    //not efficent mais bon
    for (let i = 0; i < gameBoard.length; i++) {
      nextGen[i] = [...gameBoard[i]];
    }

    gameBoard.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        //FIRST STEP
        //RETRIEVE ALL 8 NEIGHBORS OF A CELL
        //MAIS : CORNER CELL HAVE ONLY 3 NEIGHBORS
        //AND EDGE CELLS ONLY HAVE 5 NEIGHBORS
        //AND WE SHOULDNT CONSIDER THE ABSENCE OF THE EXTRA CELLS AS A DEAD NEIGHBOR

        //rules :

        //1. Any live cell with fewer than two live neighbours dies, as if by underpopulation.
        //2. Any live cell with two or three live neighbours lives on to the next generation.
        //3. Any dead cell with EXACLTLY three live neighbours become a live cell, as if by reproduction (segs)

        //pseudo logic
        // check if cell gonna be alive next iter
        const aliveNeighbors: Number = countOfLivingNeighbors(
          gameBoard,
          rowIndex,
          colIndex
        );
        const becomeEnVie = aliveNeighbors === 3;
        //check if cell will STAY alive next iter , check that its alive first then check that it has exactly 2 neighbors
        const resteEnVie = cell && aliveNeighbors === 2;
        const newCellValue = becomeEnVie || resteEnVie ? 1 : 0;

        nextGen[rowIndex][colIndex] = newCellValue;
      });
    });

    return nextGen;
  }
}

function countOfLivingNeighbors(
  gameBoard: BitArray[],
  rowIndex: number,
  colIndex: number
): Number {
  //TL | T | TR
  //---------
  //L  | C | R
  //---------
  //BL | B | BR

  //edge cases (hehe)
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

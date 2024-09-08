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
  }

  setupGrid(numOfRows: number, numOfColumns: number) {
    const binaryRandom = () => Math.random() > 0.5 ? 1 : 0;


    const board: BitArray[] = new Array(numOfRows)
      .fill(0)
      .map(() => new Array(numOfColumns).fill(0).map(binaryRandom));


    console.log(board);

    return board;


  }

  render(gameBoard: BitArray[]) {
    const ctx = this.context;
    const res = RESOLUTION;
    gameBoard.forEach((row,rowIndex) =>{
      row.forEach((c , collIndex) =>{
        ctx!.beginPath();
        ctx!.rect(collIndex * res , rowIndex * res , res , res);
        ctx!.fillStyle = c ? 'black' : 'white';
        ctx!.fill();
        ctx!.stroke();
      })
    })
  }
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }
}

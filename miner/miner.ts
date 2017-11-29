import { protractor, browser, by, element, ElementFinder, WebElement } from 'protractor';

export class Miner {

  private field: Array<Array<number>> = [];
  private total: number = 0;
  private elf: ElementFinder;
  private mines: number = 99;
  private EC = protractor.ExpectedConditions;
  
  private justClicked: string[] = [];
  
  constructor(private callback: () => void) {
    this.elf = element(by.id('game'));
    this.nextTurn();
  }
  nextTurn() {
    let theend: boolean = false;
    let looser: boolean = false;
    browser.executeScript((game) => {
      const children = game.childNodes;
      const squares = [];
      for (let i = 0; i < children.length; i++){
        if (children[i].getAttribute('class').indexOf('square') >= 0 && children[i].getAttribute('style') === null){
          squares.push({
            id: children[i].getAttribute('id'),
            classes: children[i].getAttribute('class')
          });
        }
      }
      return squares;
    }, this.elf).then((squares: any) => {
      this.field.length = 0;
      squares.forEach((square: {id: string, classes: string}) => {
        const indexes: number[] = square.id.split('_').map(el => (parseInt(el) - 1));
        if (indexes.length === 2) {
          if (this.field[indexes[0]] === undefined) {
            this.field[indexes[0]] = [];
          }
          if (square.classes.indexOf('blank') >= 0) {
            this.field[indexes[0]][indexes[1]] = -1;
          } else if (square.classes.indexOf('bombflagged') >= 0) {
            this.field[indexes[0]][indexes[1]] = -2;
          } else if (square.classes.indexOf('open') >= 0) {
            this.field[indexes[0]][indexes[1]] = parseInt(square.classes.replace(/.*open(\d).*/i, '$1'));
          } else if (square.classes.indexOf('bombrevealed') >= 0) {
            return;
          } else {
            theend = true;
            if (square.classes.indexOf('death') >= 0) {
              looser = true;
            }
          }
        }
      });
      if (!theend) {
        this.doSomething();
      } else if (looser) {
        this.log('Boom!')
        //browser.sleep(3000);
        this.startNewGame();
      }
    });
  }
  
  doSomething() {
    // new cycle
    // prepare field
    for (let x: number = 0; x < this.field.length; x++) {
      for (let y: number = 0; y < this.field[x].length; y++) {
        if (this.field[x][y] > 0) {
          this.field[x][y] -= this.getAround(x, y, -2);
        }
      }
    }
    // let's click
    let actionPerformed: boolean = this.obviousSearch();
    
    if (!actionPerformed) {
      // this.somethingRandom(); // to make record time uncomment this line and comment lines bellow
      
      actionPerformed = this.tryPattern121();
      actionPerformed = this.tryPattern1221();
      if (!actionPerformed) {
        this.somethingRandom();
      }
    }
    this.nextTurn();
  }
  
  log(message: any) {
    console.log(message);
  }

  private startNewGame() {
      browser.actions().click(element(by.id('face')), protractor.Button.LEFT).perform().then(() => {
      this.mines = 99;
      this.justClicked.length = 0;
      element(by.id('8_8')).click().then(() => {
        this.nextTurn();
      });
    });
  }
  private getAround(sx: number, sy: number, type: number): number {
    let count: number = 0;
    for ( let x: number = (sx > 0 ? (sx - 1) : 0); x < (sx < (this.field.length - 1) ? (sx + 2) : (sx + 1)); x++){
      for ( let y: number = (sy > 0 ? (sy - 1) : 0); y < (sy < (this.field[x].length - 1) ? (sy + 2) : (sy + 1)); y++){
        if (sx === x && sy === y) {
          continue;
        }
        if (this.field[x][y] === type) {
          count ++;
        }
      }
    }
    return count;
  }

  private performAround(sx: number, sy: number, type: number): number {
    let clicked: number = 0;
    for ( let x: number = (sx > 0 ? (sx - 1) : 0); x < (sx < (this.field.length - 1) ? (sx + 2) : (sx + 1)); x++){
      for ( let y: number = (sy > 0 ? (sy - 1) : 0); y < (sy < (this.field[x].length - 1) ? (sy + 2) : (sy + 1)); y++){
        if (sx === x && sy === y) {
          continue;
        }
        if (type === -1 && this.field[x][y] === -1) {
          if (this.flagMine(x, y)) {
            clicked++;
          }
        }
        if (type === 0 && this.field[x][y] === -1) {
          if (this.openSquare(x, y)) {
            clicked++;
          }
        }
      }
    }
    return clicked;
  }
  
  private flagMine(mx, my): boolean {
    if (this.justClicked.indexOf(mx + '-' + my) >= 0) {
      return false;
    }
    this.justClicked.push(mx + '-' + my);
    this.mines--;
    browser.actions().click(element(by.id((mx + 1) + '_' + (my + 1))), protractor.Button.RIGHT).perform();
    if (this.mines === 0){
      if (this.mines === 0){ // finish if need
        for (let x: number = 0; x < this.field.length; x++) {
          for (let y: number = 0; y < this.field[x].length; y++) {
            if (this.field[x][y] === -1 && !(x === mx && y === my)) {
              this.openSquareForce(x, y);
            }
          }
        }
      }
      const waitingForAlert = this.EC.alertIsPresent();
      browser.wait(waitingForAlert, 1000).then((alert) => {
        try {
          browser.switchTo().alert().then((alert) => {
            alert.getText().then((text: string) => {
              this.log(text);
              alert.sendKeys('protractor').then(() => {
                alert.accept();
                this.callback();
                browser.sleep(3000);
              });
            });
          }, (err) => {
            this.log(err);
          });
        } catch (err1) {
          this.log(err1);
        }
      }, (err) => {
        this.log('Almost done... Boom!');
        browser.sleep(1000);
        this.startNewGame();
      });
    }
    return true;
  }
  
  private openSquare(x, y): boolean {
    if (this.justClicked.indexOf(x + '-' + y) >= 0) {
      return false;
    }
    this.openSquareForce(x, y);
    return true;
  }

  private openSquareForce(x, y) {
    this.justClicked.push(x + '-' + y);
    browser.actions().click(element(by.id((x + 1) + '_' + (y + 1))), protractor.Button.LEFT).perform();
  }
  
  private obviousSearch(): boolean {
    let actionPerformed: boolean = false;
    for (let x: number = 0; x < this.field.length; x++) {
      for (let y: number = 0; y < this.field[x].length; y++) {
        if (this.field[x][y] > 0 && this.getAround(x, y, -1) === this.field[x][y]) {
          if (this.performAround(x, y, -1) > 0) {
            actionPerformed = true;
           }
        }
        if (this.field[x][y] === 0 && this.getAround(x, y, -1) > 0) {
          if (this.performAround(x, y, 0) > 0) {
            actionPerformed = true;
          }
        }
      }
    }
    return actionPerformed;
  }
  
  private tryPattern121(): boolean {
    let actionPerformed: boolean = false;
    for (let x: number = 0; x < this.field.length; x++) {
      for (let y: number = 0; y < this.field[x].length - 2; y++) {
        if (this.field[x][y] === 1 && this.field[x][y + 1] === 2 && this.field[x][y + 2] === 1) {
          if (x === 0 || (x > 0 && this.field[x - 1][y] != -1 && this.field[x - 1][y + 1] != -1 && this.field[x - 1][y + 2] != -1)) {
            actionPerformed = this.flagMine(x + 1, y);
            actionPerformed = this.openSquare(x + 1, y + 1);
            actionPerformed = this.flagMine(x + 1, y + 2);
          }
          if (x === this.field.length - 1 || (x < this.field.length - 1 && this.field[x + 1][y] != -1 && this.field[x + 1][y + 1] != -1 && this.field[x + 1][y + 2] != -1)) {
            actionPerformed = this.flagMine(x - 1, y);
            actionPerformed = this.openSquare(x - 1, y + 1);
            actionPerformed = this.flagMine(x - 1, y + 2);
          }
        }
      }
    }
    for (let y: number = 0; y < this.field[0].length; y++) {
      for (let x: number = 0; x < this.field.length - 2; x++) {
        if (this.field[x][y] === 1 && this.field[x + 1][y] === 2 && this.field[x + 2][y] === 1) {
          if (y === 0 || (y > 0 && this.field[x][y - 1] != -1 && this.field[x + 1][y - 1] != -1 && this.field[x + 2][y - 1] != -1)) {
            actionPerformed = this.flagMine(x, y + 1);
            actionPerformed = this.openSquare(x + 1, y + 1);
            actionPerformed = this.flagMine(x + 2, y + 1);
          }
          if (y === this.field[0].length - 1 || (y < this.field[0].length - 1 && this.field[x][y + 1] != -1 && this.field[x + 1][y + 1] != -1 && this.field[x + 2][y + 1] != -1)) {
            actionPerformed = this.flagMine(x, y - 1);
            actionPerformed = this.openSquare(x + 1, y - 1);
            actionPerformed = this.flagMine(x + 2, y - 1);
          }
        }
      }
    }
    return actionPerformed;
  }
  
  private tryPattern1221() {
    let actionPerformed: boolean = false;
    for (let x: number = 0; x < this.field.length; x++) {
      for (let y: number = 0; y < this.field[x].length - 3; y++) {
        if (this.field[x][y] === 1 && this.field[x][y + 1] === 2 && this.field[x][y + 2] === 2 && this.field[x][y + 3] === 1) {
          if (x === 0 || (x > 0 && this.field[x - 1][y] != -1 && this.field[x - 1][y + 1] != -1 && this.field[x - 1][y + 2] != -1 && this.field[x - 1][y + 3] != -1)) {
            actionPerformed = this.openSquare(x + 1, y);
            actionPerformed = this.flagMine(x + 1, y + 1);
            actionPerformed = this.flagMine(x + 1, y + 2);
            actionPerformed = this.openSquare(x + 1, y + 3);
          }
          if (x === this.field.length - 1 || (x < this.field.length - 1 && this.field[x + 1][y] != -1 && this.field[x + 1][y + 1] != -1 && this.field[x + 1][y + 2] != -1 && this.field[x + 1][y + 3] != -1)) {
            actionPerformed = this.openSquare(x - 1, y);
            actionPerformed = this.flagMine(x - 1, y + 1);
            actionPerformed = this.flagMine(x - 1, y + 2);
            actionPerformed = this.openSquare(x - 1, y + 3);
          }
        }
      }
    }
    for (let y: number = 0; y < this.field[0].length; y++) {
      for (let x: number = 0; x < this.field.length - 3; x++) {
        if (this.field[x][y] === 1 && this.field[x + 1][y] === 2 && this.field[x + 2][y] === 2 && this.field[x + 3][y] === 1) {
          if (y === 0 || (y > 0 && this.field[x][y - 1] != -1 && this.field[x + 1][y - 1] != -1 && this.field[x + 2][y - 1] != -1 && this.field[x + 3][y - 1] != -1)) {
            actionPerformed = this.openSquare(x, y + 1);
            actionPerformed = this.flagMine(x + 1, y + 1);
            actionPerformed = this.flagMine(x + 2, y + 1);
            actionPerformed = this.openSquare(x + 3, y + 1);
          }
          if (y === this.field[0].length - 1 || (y < this.field[0].length - 1 && this.field[x][y + 1] != -1 && this.field[x + 1][y + 1] != -1 && this.field[x + 2][y + 1] != -1 && this.field[x + 3][y + 1] != -1)) {
            actionPerformed = this.openSquare(x, y - 1);
            actionPerformed = this.flagMine(x + 1, y - 1);
            actionPerformed = this.flagMine(x + 2, y - 1);
            actionPerformed = this.openSquare(x + 3, y - 1);
          }
        }
      }
    }
    return actionPerformed;
  }
  
  private somethingRandom() {
    const probability: Array<Array<number>> = [];
    const probabilityCount: Array<Array<number>> = [];
    let blanksTotal: number = 0;
    for (let x: number = 0; x < this.field.length; x++) {
      for (let y: number = 0; y < this.field[x].length; y++) {
        if (this.field[x][y] === -1) {
          blanksTotal++;
        }
      }
    }
    for (let x: number = 0; x < this.field.length; x++) {
      for (let y: number = 0; y < this.field[x].length; y++) {
        if (this.field[x][y] > 0) {
          const blanks = this.getAround(x, y, -1);
          for ( let x1: number = (x > 0 ? (x - 1) : 0); x1 < (x < (this.field.length - 1) ? (x + 2) : (x + 1)); x1++){
            for ( let y1: number = (y > 0 ? (y - 1) : 0); y1 < (y < (this.field[x1].length - 1) ? (y + 2) : (y + 1)); y1++){
              if (this.field[x1][y1] === -1) {
                if (probability[x1] === undefined) {
                  probability[x1] = [];
                  probabilityCount[x1] = [];
                }
                if (probability[x1][y1] === undefined) {
                  probability[x1][y1] = 0;
                  probabilityCount[x1][y1] = 0;
                }
                probability[x1][y1] += (this.field[x][y] / blanks);
                probabilityCount[x1][y1]++;
              }
            }
          }
        }
      }
    }
    for (let x: number = 0; x < this.field.length; x++) {
      for (let y: number = 0; y < this.field[x].length; y++) {
        if (this.field[x][y] === -1 && (probability[x] === undefined || probability[x][y] === undefined)) {
          if (probability[x] === undefined) {
            probability[x] = [];
            probabilityCount[x] = [];
          }
          if (probability[x][y] === undefined) {
            probability[x][y] = this.mines / blanksTotal;
            probabilityCount[x][y] = 1;
          }
        }
      }
    }
    let minProbability: number;
    let minPX: number;
    let minPY: number;
    for (let x: number = 0; x < probability.length; x++) {
      if (probability[x] === undefined) {
        continue;
      }
      for (let y: number = 0; y < probability[x].length; y++) {
        if (probability[x][y] === undefined || isNaN(probability[x][y]) || this.field[x][y] !== -1) {
          continue;
        }
        const prob = probability[x][y] / probabilityCount[x][y];
        if ( prob < minProbability || minProbability === undefined) {
          minProbability = prob;
          minPX = x;
          minPY = y;
        }
      }
    }
    if (minProbability === undefined || isNaN(minProbability)) {
      return;
    }
    if (minProbability < .5) {
      this.openSquare(minPX, minPY);
    } else if ((minProbability > .5)) {
      this.flagMine(minPX, minPY);
    } else {
      if (Math.random() > .5) {
        this.flagMine(minPX, minPY);
      } else {
        this.openSquare(minPX, minPY);
      }
    }
  }
}

import { protractor, browser, by, element } from 'protractor';
import { Miner } from './miner';

describe('Miner', () => {

  const EC = protractor.ExpectedConditions;

  beforeEach(() => {
  });

  it('should be without mines on the first click', () => {
    browser.get('/');
    browser.wait(EC.visibilityOf(element(by.id('1_1'))), 3000);
    browser.manage().timeouts().implicitlyWait(5000);
    browser.wait(element(by.id('face')).click()).then( () => element(by.id('8_8')).click().then(() => {
      element(by.id('8_8')).getAttribute('class').then(classes => {
        const arr = classes.split(' ');
        let minecount = 0;
        for (let i = 0; i < arr.length; i++) {
          if (arr[i].indexOf('open') >= 0) {
            minecount = parseInt(arr[i].replace(/open/i, ''));
            break;
          }
        }
        expect<any>(minecount).toEqual(0);
      })
    }));
  });
  
  it('should win', () => {
    const miner = new Miner(() => {
      console.log('Well done!');
      expect<any>(element.all(by.className('facewin')).count()).toEqual(1);
    });
    miner.log('Ready to work!');
    /*const waitingForWin = EC.presenceOf(element(by.className('facewin')));
    browser.wait(waitingForWin, 6000000);*/
  });
});

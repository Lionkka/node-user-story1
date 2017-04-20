"use strict";
const fs = require('fs');
const stream = require('stream');

let getLines = new stream.Transform();
let getDigitsArray = new stream.Transform();
let getPatternArray = new stream.Transform();
let decodeDigits = new stream.Transform();
let savePattern = new stream.Transform();

let patterns = [];
let digits = [];
let currentPosition = 0;
let currentCharPosition = 0;
let line = 0;
let digitsPattern = {};

let getdigitsPattern = fs.createReadStream('patterns.txt', 'utf-8');
let getInvoiceDigits= fs.createReadStream('invoices.txt', 'utf-8');

savePattern._transform = savePatternFunc;
getLines._transform = getLinesFunc;
getDigitsArray._transform = getDigitsArrayFunc;
getPatternArray._transform = getDigitsArrayFunc;
decodeDigits._transform = decodeDigitsFunc;

getdigitsPattern
    .pipe(getPatternArray)
    .pipe(savePattern);

getInvoiceDigits
    .pipe(getLines)
    .pipe(getDigitsArray)
    .pipe(decodeDigits)
    .pipe(fs.createWriteStream('answer.txt'));


function savePatternFunc(chunk, encoding, done) {

    let dig = chunk.toString();
    let digits = JSON.parse(dig);

    for(let i=0; i<10; i++){
        digitsPattern[digits[i]] = i;
    }
    done();
}

function getLinesFunc(chunk, encoding, done) {
    let lines = chunk.toString().split('\n\n');

    let self = this;
    lines.forEach(function (line) {
        if(line)
        self.push(line);
    });
    done();
}
function decodeDigitsFunc(chunk, encoding, done){

    let digits = JSON.parse(chunk);
    let hasError = false;
    for (let k = 0; k < digits.length; k++) {
        if([digits[k]] in digitsPattern){
            this.push(''+digitsPattern[digits[k]]);
        }
        else {
            this.push('?');
            hasError = true;
        }
    }

    if(hasError)
        this.push(' ILLEGAL');
    this.push('\n');

    done();
}

function getDigitsArrayFunc(chunk, encoding, done) {
    let data = chunk.toString();
    for(let i=0; i < data.length; i++) {

        if (digits[currentPosition])
            digits[currentPosition] += data[i];
        else
            digits[currentPosition] = data[i];
        currentCharPosition++;

        if (currentCharPosition == 3) {
            currentCharPosition = 0;
            currentPosition++;
        }
        if(data[i+1] == '\n' || (line == 2 && digits.length == currentPosition  )){
            line++;
            currentPosition = 0;
            i++;

        }
        if(line == 3) {
            line = 0;
            this.push(JSON.stringify(digits));
            digits = [];


        }
    }
    done();
}
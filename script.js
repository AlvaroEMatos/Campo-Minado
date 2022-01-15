const numColorMap = {
    1: "#0100FB",
    2: "#017F01",
    3: "#FD0100",
    4: "#01017D",
    5: "#7F0102",
    6: "#00807F",
    7: "#000000",
    8: "#808080"
}
const widthTg = document.getElementById("width");
const heightTg = document.getElementById("height");
const minesCountTg = document.getElementById("mines-count");
const faceTg = document.getElementById("face");
const timeTg = document.getElementById("time");
const minesDisplayTg = document.getElementById("mines")

var mineField;
var hitsCount = 0;
var timer;
var gameStarted = false;

document.getElementById("face").addEventListener("click", ()=> {
    newGame();
});

newGame();

function newGame(){
    const width = parseInt(widthTg.value);
    const height = parseInt(heightTg.value);
    const gridTg = document.getElementById("grid");

    mineField = createMatrix(width, height);
    hitsCount = 0;
    gameStarted = false;

    grid.innerHTML = "";
    timeTg.innerText = "000";
    minesDisplayTg.innerText = minesCountTg.value.padStart(3, "0");;
    createGrid(gridTg, width, height);
    
    faceTg.innerText = '🙂';
    clearInterval(timer);
    console.log("newGame");
}

function startGame(x, y){
    const minesCount = parseInt(minesCountTg.value);

    gameStarted = true;

    addMines(mineField, minesCount, x , y)
    addMinesCount(mineField)
    timer = setInterval(()=>{
        var time = parseInt(timeTg.innerText);
        time++;
        timeTg.innerText =  String(time).padStart(3, "0"); 
    }, 1000);

    console.log("startGame");
}

function gameOver(table){
    const width = mineField[0].length;
    const height = mineField.length;

    for(let y = 0; y < height; y++){
        for(let x = 0; x < width; x++){
            const tr = table.rows[y];
            const td = tr.cells[x];
            const btn = td.children[0];
            if(btn === undefined) continue;

            btn.disabled = true;

            if(mineField[y][x] < 0){
                if(btn.innerText !== '🚩'){
                    btn.innerText = '💣';
                }
            }
            else if(btn.innerText === '🚩'){
                btn.innerText = '❌'; //x vermelho
            }
        }
    }
    


    faceTg.innerText = '🙁';
    clearInterval(timer);
    console.log("gameOver");
}

function victory(table){
    const width = mineField[0].length;
    const height = mineField.length;

    for(let y = 0; y < height; y++){
        for(let x = 0; x < width; x++){
            const tr = table.rows[y];
            const td = tr.cells[x];
            const btn = td.children[0];
            if(btn === undefined) continue;

            btn.disabled = true;
        }
    }

    faceTg.innerText = '😎';
    clearInterval(timer);
    console.log("victory")
}

function revealPosition(table, x, y){//se x, y for uma mina retorna true
    const queue = [{x: x, y: y}];

    while(queue.length !== 0){
        const{x, y} = queue.shift();

        const tr = table.rows[y];
        if(tr === undefined) continue;

        const td = tr.cells[x];
        if(td === undefined) continue;

        const btn = td.children[0];
        if(btn === undefined) continue;

        if(mineField[y][x] < 0){
            btn.remove();
            td.innerText = '💥';
            return true;
        }
        else if(mineField[y][x] > 0){
            btn.remove();
            td.innerText = mineField[y][x];
            td.style.color = numColorMap[mineField[y][x]];

            hitsCount++

            continue;
        }
        else{//flodfill
            btn.remove();

            hitsCount++
        }

        for (let i = -1; i <= 1; i++){
            for(let j = -1; j <= 1; j++){
                if(j === 0 && i === 0) continue;
                queue.push({x: x + i, y: y + j});
            }
        }
    }

    return false;
}

function createMatrix(width, height){
    return Array(height).fill(0).map(()=> Array(width).fill(0));
}

function addMines(mineField, minesCount, x, y){ //função interessante. não existe risco de loop infinito
    const width = mineField[0].length;
    const height = mineField.length;
    const mineFieldCount = width * height;
    var freePositionCount = 0;
    var intervals =  [];

    if(mineField[y - 2] !== undefined){
        const mapedMax =  map2dTo1d(width, width - 1, y - 2);
        intervals.push(createInterval(0, mapedMax));
    }
    if(mineField[y + 2] !== undefined){
        const mapedMin =  map2dTo1d(width, 0, y + 2);
        intervals.push(createInterval(mapedMin, mineFieldCount - 1));
    }

    

    for (let i = -1; i <= 1; i++){//todas as posições em volta de x , y não tem minas
        const ny = y + i;
        if(mineField[ny] === undefined) continue;

        const mapedMin = map2dTo1d(width, 0, ny);
        const mapedMax = map2dTo1d(width, width - 1, ny);
        let auxInervals = [createInterval(mapedMin, mapedMax)];

        for(let j = -1; j <= 1; j++){
            const nx = x + j;    
            if(mineField[ny][nx] === undefined) continue;

            const mapedIdx = map2dTo1d(width, nx, ny);
            const interval = auxInervals.pop();
            auxInervals = auxInervals.concat(splitInterval(interval, mapedIdx));

            freePositionCount++;
        }

        intervals = intervals.concat(auxInervals);
    }

    
   

    for(let i = 0; i < minesCount; i++){

        const rand1 = getRandomIntInclusive(1, mineFieldCount - i - freePositionCount);//menos as posições que não podem ter bombas
        let sum = 0;
        let idx;

        for (idx = 0; idx < intervals.length; idx++){//garente que todas as posições tenham a mesma probabilidade de seram escolhidas
            sum += intervals[idx].length;
            if(rand1 <= sum)break;
        }

        const rand2 = getRandomIntInclusive(intervals[idx].min, intervals[idx].max);
        const{x, y} = map1dTo2d(width, rand2);
        mineField[y][x] = -1;

        const interval = intervals.splice(idx, 1)[0];
        intervals = intervals.concat(splitInterval(interval, rand2));
    }

    function createInterval(min, max){
        return {min: min, max: max, length: max - min + 1};
    }

    function splitInterval(interval, i){
        const intervals = [];

        if(i !== interval.min) intervals.push(createInterval(interval.min, i - 1));
        if(i !== interval.max) intervals.push(createInterval(i + 1, interval.max));

        return intervals;
    }
}

function addMinesCount(mineField){//-1 = bomba //0 - 8 numero de bombas em volta

    for(let y = 0; y < mineField.length; y++){
        for(let x = 0; x < mineField[y].length; x++){

            if(mineField[y][x] < 0) continue;
            let minesCount = 0;

            for(let i= -1; i <= 1; i++){
                for(let j = -1; j <= 1; j++){
                    try{
                        if(mineField[y + i][x + j] < 0) minesCount++;
                    }
                    catch{
                        continue;
                    }
                }
            }

            mineField[y][x] = minesCount;
        }
    }
}

function getRandomIntInclusive(min, max) {// min <= x <= max
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function map2dTo1d(width, x, y){
    return y * width + x;
}

function map1dTo2d(width, idx){
    return {x: idx % width, y: Math.floor(idx / width)}
}

function createGrid(table, width, height) {
    
    for (let y = 0; y < height; y++){
        const tr = table.insertRow();

        for (let x = 0; x < width; x++){
            const td = tr.insertCell();
            const button = document.createElement("button");
            //button.innerText = ' ';//U+2001'
            td.appendChild(button);

            const togleFlagEvent = (ev) => {
                ev.preventDefault();

                if(ev.target.innerText === '🚩'){
                    //ev.target.innerText = ' ';//U+2001
                    ev.target.innerText = "";
                    button.addEventListener("click", revealPositionEvent);
                    
                    let minesCount = parseInt(minesDisplayTg.innerText);
                    minesCount = Math.min(parseInt(minesCountTg.value), ++minesCount);
                    minesDisplayTg.innerText =  String(minesCount).padStart(3, "0"); 
                }else{
                    ev.target.innerHTML = '🚩';
                    button.removeEventListener("click", revealPositionEvent);

                    let minesCount = parseInt(minesDisplayTg.innerText);
                    minesCount = Math.max(0, --minesCount);
                    minesDisplayTg.innerText =  String(minesCount).padStart(3, "0"); 
                }
            };
            const revealPositionEvent = () => {
                if(gameStarted === false) startGame(x, y);
                const isMine = revealPosition(table, x, y);


                if(isMine){
                    gameOver(table);
                }else if(hitsCount === (width * height - parseInt(minesCountTg.value))){
                    victory(table);
                }
            }

            button.addEventListener("click", revealPositionEvent);
            button.addEventListener("contextmenu", togleFlagEvent);
        }
    }
}

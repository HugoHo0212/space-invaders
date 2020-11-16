var gl;
var width = 0.12;
var height = 0.18;
var tri_width = 0.04;
var tri_height = 0.06;
var all_ver;
var cannon;
var aliens;
var color_buffer;
const green = vec4(0, 1, 0, 1);
const red = vec4(1, 0, 0, 1);
var vBuffer;
var cBuffer;
var frameCounter = 0;
var parameters;
var stop = 0;
var shootingCount = 0;
window.onload = function init(){
    const canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);

    if(!gl){
        alert( "WebGL isn't available" );
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    //position buffer
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    //color buffer
    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);

    var vColor = gl.getAttribLocation( program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    initData();
    render();
}

function initData(){
    // create initial x vertices for upper and lower
    stop = 0;
    var vertice_arr = createVerticesForX(0);
    var upper = [];
    var lower = [];

    // turn them into (x, y) vertices
    upper = vertice_arr[0].map(each => {
        return new Squares(vec2(each, 1));
    });
    lower = vertice_arr[1].map(each => {
        return new Squares(vec2(each, roundToDecimal( 1.00 - height - 0.02)));
    });

    //initial x-vertex for cannon
    var cannon_x = createVerticesForX(1)[0];
    //use initial x-vertex to create square 
    
    var cannonBalls = new Bullets();
    cannon = new Cannon (new Squares(vec2(cannon_x, roundToDecimal(-1.00 + height))), cannonBalls);
    //console.log("what the heck is can:", cannon.getCannon().getVertice(), '\n') 
    //use upper and lower to create alien
    var bullets = new Bullets();
    aliens = new Aliens(upper, lower, bullets);

    gl.clear(gl.COLOR_BUFFER_BIT);
    // get both upper and lower's vertices from alien
    var both = aliens.getBothVertices();
    color_buffer = [];
    both.forEach(()=>{
        color_buffer.push(red);
    });

    // all_ver contains alien and cannon vertice
    all_ver = both.concat(cannon.getCannon().getVertice());
    cannon.getCannon(). getVertice().forEach(() => {
        color_buffer.push(green);
    });
    
    //put vertice to vBuffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(all_ver), gl.STATIC_DRAW);
    //put color to cBuffer
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(color_buffer), gl.STATIC_DRAW);
    gl.drawArrays( gl.TRIANGLES, 0, all_ver.length);

    parameters = new Parameters(0.006, 0);
}

window.addEventListener("keydown", getKey, false)

function getKey(key){
    switch(key.key){
        case "ArrowLeft":
            //console.log("it is in event listener :", cannon.getCannon().getVertice())
            var x = cannon.getCannon().getVertex1()[0];
            if(roundToDecimal( x - 0.08) >= -1){
               //console.log("what is x in event: ", x) 
               cannon.move(-0.08); 
            }
            break;
        case "ArrowRight":
            var x = cannon.getCannon().getVertex1()[0];
            if(roundToDecimal( x + 0.08 + width) <= 1){
                cannon.move(0.08); 
            }
            break;
        case "q":
            stop = 1;
            break;
        case "r":        
            stop = 1;
            setTimeout(restart, 30);
            break;
    }
}

function restart(){
    frameCounter = 0;
    shootingCount = 0;
    initData();
    document.getElementById("alert").style.visibility = "hidden";
    render();
}

window.addEventListener("mousedown", getClick, false)

function getClick(button){
    //console.log("it is clicked")
    switch(button.button){
        case 0:
            if(shootingCount >= 40)
                cannon.shooting();        
            break;
    }
}

function removeHitAliens(aliens){
    var upper = aliens.getUpper();
    var lower = aliens.getLower();
    if(upper.length != 0){
        for(var i = 0; i < upper.length; i++){
            //console.log("in upper for loop and index and upper[i] is :", index, upper[i])
            if(cannon.hitAlien(upper[i]))
                aliens.deleteUpperAlien(i);
        }
    }
    if(lower.length != 0){
        for(var i = 0; i < lower.length; i++){
            //console.log("in lower for loop and index is: ", index)
            if(cannon.hitAlien(lower[i]))
                aliens.deleteLowerAlien(i);
        }
    }
    aliens.resize(); 
}

function render(){
    //console.log("what the heck is frameCount:", frameCounter, '\n')
    removeHitAliens(aliens);

    shootingCount ++;
    frameCounter ++;   
    var moveSpeed = parameters.getMove_speed();
    aliens.moveRandom(moveSpeed);
    aliens.shooting(150);
    aliens.falling(-0.0022);
    aliens.bulletsFalling(-0.0063);
    cannon.bulletsRising(0.008);
    aliens.removeOverBottomBullets();
    cannon.removeOverTopBullets();
    if(frameCounter % 120 == 0)
        parameters.setMoveSpeed(roundToDecimal( moveSpeed + 0.001));

    var both = aliens.getBothVertices();
    var aliensBulletsVer = aliens.getAllBulletsVertices();
    var cannonBallsVer = cannon.getAllBulletsVertices();
    color_buffer = [];
    both.forEach(()=>{
        color_buffer.push(red);
    });
    cannon.getCannon().getVertice().forEach(() => {
        color_buffer.push(green);
    });
    aliensBulletsVer.forEach(() => {
        color_buffer.push(red);
    });
    cannonBallsVer.forEach(() => {
        color_buffer.push(green);
    });
    // all_ver contains alien and cannon vertice
    all_ver = both.concat(cannon.getCannon().getVertice());
    all_ver = all_ver.concat(aliensBulletsVer, cannonBallsVer);
   
    //put vertice to vBuffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(all_ver), gl.STATIC_DRAW);

    //put color to cBuffer
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(color_buffer), gl.STATIC_DRAW);
    
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays( gl.TRIANGLES, 0, all_ver.length );

    checkWin(aliens);
    checkLose(aliens, cannon);

    if(!stop)
        window.requestAnimFrame(render); 
}

function checkLose(aliens, cannon){
    if(aliens.hitCannon(cannon) || aliens.checkHitBottom()){
        document.getElementById("alert").innerHTML = "GAME OVER: You Lose!";
        document.getElementById("alert").style.visibility = "visible";
        stop = 1;
    }
}

function checkWin(aliens){
    if(aliens.getUpper().length == 0 && aliens.getLower().length == 0){
        document.getElementById("alert").innerHTML = "Congratulations, You Win!";
        document.getElementById("alert").style.visibility = "visible";
        stop = 1;
    }
}

function checkVerticesForX(x, count, arr){
    if(x > -1.0 && x < roundToDecimal( 1.0 - width)){
        if(arr.length == 0)
            arr.push(x);
        else{
            arr.forEach(element => {
                if(x <= element && x >= roundToDecimal( element - width))
                    count ++;
                else if(x >= element && x <= roundToDecimal(element + width)){
                    count ++;
                }                  
            });
            if(count == 0){
                arr.push(x);
            }   
        }      
    }
    return arr;
}
function createVerticesForX(choice){
    var upper = [];
    var lower = [];
    var flag = 1;
    var result;
    if(choice == 0){
        while(flag){
            var x = randomNumForX();
            checkVerticesForX(x, 0, upper)     
            if(upper.length == 4){
                flag = 0;
            }
        }
        flag = 1;
        while(flag){
            var x = randomNumForX();
            checkVerticesForX(x, 0, lower)     
            if(lower.length == 4){
                flag = 0;
            }
        }
        upper.sort(function(a, b){return a - b});
        lower.sort(function(a, b){return a - b});
        result = [upper, lower];
        //console.log("see two result: ", result, '\n')
    }
    else if(choice == 1){
        flag = 1;
        while(flag){
            var x = randomNumForX();
            if(x > -1 && roundToDecimal( x + width) < 1){
                result = [x];
                flag = 0;
            }            
        }       
    }   
    return result;
}

function randomNumForX(){
    var x = Math.round(Math.random() *2 * 100) / 100 - 1.0;
    return roundToDecimal(x);
}

function roundToDecimal(num){
    return Math.round( num * 10000) / 10000;
}

// cannon
class Cannon{
    constructor(square, cannonBalls){
        this.cannon = square;
        this.cannonBalls = cannonBalls;
    }

    getCannon(){
        return this.cannon;
    }

    move(num){
        this.cannon.move(num);
    }
    getCannonBallObj(){
        return this.cannonBalls;
    }
    getCannonBalls(){
        return this.cannonBalls.getBullets();
    }

    getAllBulletsVertices(){
        return this.cannonBalls.getAllVertices();
    }
    //shooting
    shooting(){
        var x = roundToDecimal((this.cannon.getVertex1()[0] + tri_width));
        var y = roundToDecimal((this.cannon.getVertex1()[1] + 0.0001))
        var bullet = new Triangles(vec2(x, y), 1);
        this.cannonBalls.addBullet(bullet);
        shootingCount = 0;
    }

    bulletsRising(num){
        if(!this.cannonBalls.empty()){          
            this.cannonBalls.moving(num);
        }
    }

    removeOverTopBullets(){
        var arr = this.getCannonBalls();
        var n = 0;
        arr.forEach((each) => {
            if(each.getVertex1()[1] >= 1)
                n ++;       
        });
        for(var i = 0; i < n; i++){
            this.cannonBalls.popFirstBullet();
        }
    }

    hitAlien(alien){
        var ver1 = alien.getVertex1();
        var ver2 = alien.getVertex2();
        //console.log("what is ver1 and ver2 in hitAlien: ", ver1, ver2)
        if(this.cannonBalls.getBullets().length != 0){
            //console.log("what is the length of cannonballs: ", this.cannonBalls.getBullets().length)
            for(var i = 0; i < this.cannonBalls.getBullets().length; i++){
                //console.log("it is in for loop in hitAlien: " )
                var each = this.cannonBalls.getBullets()[i];
                var ver = each.getVertice();
                for(var j = 0; j < ver.length; j++){
                    var v = ver[j];
                    if(v[0] >= ver1[0] && v[0] <= ver2[0] && v[1] >= roundToDecimal(ver1[1] - height) && v[1] <= ver1[1]){
                        this.cannonBalls.deleteBullet(i);
                        return true;
                    }
                }                       
            }
        }    
        return false;
    }
}

class Bullets{
    constructor(){
        this.bullets = [];
    }
    addBullet(bullet){
        this.bullets.push(bullet);
    }
    popFirstBullet(){
        this.bullets.shift();
    }
    empty(){
        return (this.bullets.length == 0);
    }
    moving(num){
        this.bullets.map((each) =>{
            each.move(num);
        });
    }
    resize(){
        if(this.bullets.length != 0){
            var tem = [];
            for(var i = 0; i < this.bullets.length; i++){
                if(this.bullets[i] != undefined)
                    tem.push(this.bullets[i]);
            }
            this.bullets = tem;
        }
    }
    getBullets(){
        return this.bullets;
    }
    deleteBullet(index){
        delete this.bullets[index];
        this.resize();
    }
    getAllVertices(){
        var vertices = [];
        this.bullets.forEach(each => {
            vertices = vertices.concat(each.getVertice());
        });
        return vertices;
    }
}
// aliens
class Aliens{
    constructor(upper, lower, bullets){
        this.upper = upper;
        this.lower = lower;
        this.bullets = bullets;
    }
    hitCannon(cannon){
        var canVer1 = cannon.getCannon().getVertex1();
        var canVer2 = cannon.getCannon().getVertex2();
        var canVer3 = cannon.getCannon().getVertex3();
        var tem = this.bullets.getAllVertices();
        for(var i = 0; i < tem.length; i ++){
            if(tem[i][0] >= canVer1[0] && tem[i][0] <= canVer2[0] && tem[i][1] <= canVer1[1] && tem[i][1] >= canVer3[1]){
                return true;
            }
        }
        return false;
    }
    resize(){
        var len1 = this.upper.length;
        var len2 = this.lower.length;

        if(len1 != 0){
            var tem1 = [];
            for(var i =0; i < len1; i ++){
                if(this.upper[i] != undefined){
                    tem1.push(this.upper[i]);
                }
            }
            this.upper = tem1;
        }

        if(len2 != 0){
            var tem2 = [];
            for(var i =0; i < len2; i ++){
                if(this.lower[i] != undefined){
                    tem2.push(this.lower[i]);
                }
            }
            this.lower = tem2;
        }
    }
    getUpper(){
        return this.upper;
    }

    deleteUpperAlien(index){
        delete this.upper[index];
    }

    deleteLowerAlien(index){
        delete this.lower[index];
    }

    getLower(){
        return this.lower;
    }

    getBullets(){
        return this.bullets.getBullets();
    }

    removeOverBottomBullets(){
        var arr = this.getBullets();
        var remove = arr.some((each) => {
            if(each.getVertex1()[1] <= -1)
                return true;
            else
                return false;       
        });
        if(remove){
            for(var i =0; i < 4; i++){
                this.bullets.popFirstBullet();
            }
        }
    }
    getAllBulletsVertices(){
        return this.bullets.getAllVertices();
    }

    //aliens start shooting
    shooting(rate){
        if(frameCounter % rate == 0 || frameCounter == 1){
            if(this.lower.length == 0){
                this.shootingHelper(this.upper);
            }
            else{
                this.shootingHelper(this.lower);
            }
        }
    }
    shootingHelper(arr){
        arr.map((each) => {
            var x = roundToDecimal((each.getVertex1()[0] + tri_width));
            var y = roundToDecimal((each.getVertex1()[1] - height - tri_height - 0.0001))
            var bullet = new Triangles(vec2(x, y), 0);
            this.bullets.addBullet(bullet);
        });
    }
    bulletsFalling(num){
        if(!this.bullets.empty()){          
            this.bullets.moving(num);
        }
    }
    // aliens should drop down 
    falling(num){
        var both = this.upper.concat(this.lower);
        both.map((each) => {
            each.fall(num);
        });
    }

    checkHitBottom(){
        var both = this.upper.concat(this.lower);
        var hitBottom = both.some(any => {
            if(any.getVertex1()[1] - height <= -1)
                return true;
            else
                return false;
        });
        return hitBottom;
    }
    //
    moveRandom(num){
        if(frameCounter % 150 == 0){
            this.upper.forEach(each => {
                var rand = (Math.random() > 0.5)? 1 : -1;
                each.changeDirection(rand);
            });
            this.lower.forEach(each => {
                var rand = (Math.random() > 0.5)? 1 : -1;
                each.changeDirection(rand);
            }); 
        } 
        var dis = num;
        var len_up = this.upper.length;
        var len_low = this.lower.length;
        this.moveRandomHelper(len_up, dis, this.upper);
        this.moveRandomHelper(len_low, dis, this.lower);
    }

    moveRandomHelper(len, dis, arr){
        for(var i = 0; i < len; i++){
            var flag = 1;
            var x = arr[i].getVertex1()[0];                  
            if(i == 0){ 
                var counter = 0;     
                while(flag){
                    var direction = arr[i].getDirection();
                    //console.log("it is in getDirection, and flag is: ", direction);
                    var new_x = roundToDecimal(x + dis * direction);
                    if(direction == -1 && new_x > -1 && new_x < 1){
                        arr[i].move(roundToDecimal(-dis));
                        flag = 0;
                    }
                    else if(direction == 1 && arr[i + 1] != null){
                        var next =  arr[i + 1].getVertex1()[0];
                        if(next - width - x < 0.02){
                            arr[i].changeDirection();
                        }
                        if(this.noCollision(new_x, next)){
                            arr[i].move(roundToDecimal(dis));
                            flag = 0;
                        }
                        else{
                            arr[i].changeDirection();
                        }
                    }
                    else if(direction == 1 && arr[i + 1] == null)
                        if(roundToDecimal( new_x + width) < 1){
                            arr[i].move(roundToDecimal(dis));
                            flag = 0;
                        }
                        else{
                            arr[i].changeDirection();
                        }
                    else{
                        arr[i].changeDirection();
                    }
                    counter ++;
                    if(counter > 2){
                        flag = 0;
                        arr[i].changeDirection();
                    }     
                }
            }
            else if(i == len -1){
                var counter = 0; 
                while(flag){
                    var direction = arr[i].getDirection();
                    //console.log("it is in getDirection, and flag is: ", direction);
                    var new_x = roundToDecimal(x + dis * direction);
                    if(direction == 1 ){
                        new_x = roundToDecimal(arr[i].getVertex2()[0] + dis );
                        if(new_x < 1 && new_x > -1){
                            arr[i].move(roundToDecimal(dis));
                            flag = 0;
                        }
                        //console.log("what is new_x", new_x, '\n');
                        else{
                            arr[i].changeDirection();
                        }
                    }
                    else if(direction == -1 && arr[i - 1] != null){
                        var before =  arr[i - 1].getVertex1()[0];
                        if(x - width - before < 0.02){
                            arr[i].changeDirection();
                        }
                        if(this.noCollision(before, new_x)){
                            arr[i].move(roundToDecimal(-dis));
                            flag = 0;
                        }
                        else{
                            arr[i].changeDirection();
                        }
                    }
                    else if(direction == -1 && arr[i - 1] == null){
                        if(new_x > -1){
                            arr[i].move(roundToDecimal(-dis));
                            flag = 0;
                        }
                        else{
                            arr[i].changeDirection();
                        }
                    }                 
                    else{
                        arr[i].changeDirection();
                    }
                    counter ++;
                    if(counter > 2){
                        flag = 0;
                        arr[i].changeDirection();
                    }
                }
            }
            else{
                var counter = 0;
                while(flag){          
                    var direction = arr[i].getDirection();
                    //console.log("it is in getDirection, and flag is: ", direction);
                    var new_x = roundToDecimal(x + dis * direction);
                    if(direction == -1 && new_x < 1 && new_x > -1){
                        var before = arr[i - 1].getVertex1()[0];
                        if( x - before - width  < 0.02){
                            arr[i].changeDirection();
                        }
                        if(this.noCollision(before, new_x)){
                            //console.log("in left direction before is: ", before, "new_x is: ", new_x)
                            arr[i].move(roundToDecimal(-dis));
                            flag = 0;
                        }
                        else{
                            arr[i].changeDirection();
                        }
                        counter ++;
                    }
                    else if( direction == 1 && roundToDecimal(x + dis + width) < 1 && new_x > -1 && arr[i + 1] != null){
                        var next = arr[i + 1].getVertex1()[0];
                        if( next - width - x < 0.02){
                            arr[i].changeDirection();
                        }
                        if(this.noCollision(new_x, next)){
                            //console.log("in right direction before is: ", before, "new_x is: ", new_x)
                            arr[i].move(roundToDecimal(dis));
                            flag = 0;
                        }
                        else{
                            arr[i].changeDirection();
                        }
                        counter ++;
                    }
                    else{
                        arr[i].changeDirection();
                        counter ++;
                    }
                    if(counter > 2){
                        flag = 0;
                        arr[i].changeDirection();
                    }
                }
            }
        }
    }

    noCollision(left, right){
        return (left < roundToDecimal((right - width)));
    } 

    getBothVertices(){
        var both = this.upper.concat(this.lower);
        var vertices1 = both.map(each => {
            return each.getVertice();
        });
        both = [];
        vertices1.forEach( each => {
            both = both.concat(each);
        });
        return both;
    }
}

// square
class Squares{
    constructor(vertex_1){
        this.vertex_1 = vec2(vertex_1[0], vertex_1[1]);
        this.vertex_2 = vec2(roundToDecimal(vertex_1[0] + width), roundToDecimal(vertex_1[1]));
        this.vertex_3 = vec2(this.vertex_2[0], roundToDecimal(this.vertex_2[1] - height));
        this.vertex_4 = vec2(this.vertex_3[0], this.vertex_3[1]);
        this.vertex_5 = vec2(roundToDecimal(this.vertex_4[0] - width), this.vertex_4[1]);
        this.vertex_6 = vec2(vertex_1[0], vertex_1[1]);
        this.direction = (Math.random() > 0.5)? 1 : -1;
    }
    moveHelper(index, x, y){   
        var num = (x == 0) ? y : x;   
        this.vertex_1[index] = roundToDecimal(this.vertex_1[index] + num);
        this.vertex_2[index] = roundToDecimal(this.vertex_2[index] + num);
        this.vertex_3[index] = roundToDecimal(this.vertex_3[index] + num);
        this.vertex_4[index] = roundToDecimal(this.vertex_4[index] + num);
        this.vertex_5[index] = roundToDecimal(this.vertex_5[index] + num);
        this.vertex_6[index] = roundToDecimal(this.vertex_6[index] + num);      
    }
    move(x){
        this.moveHelper(0, x, 0);
    }

    fall(y){
        this.moveHelper(1, 0, y);
    }
        
    getVertice(){
        var vertice = [];
        vertice.push(this.vertex_1);
        vertice.push(this.vertex_2);
        vertice.push(this.vertex_3);
        vertice.push(this.vertex_4);
        vertice.push(this.vertex_5);
        vertice.push(this.vertex_6);
        return vertice;
    }
    getVertex1(){
        return this.vertex_1;
    }

    getVertex2(){
        return this.vertex_2;
    }

    getVertex3(){
        return this.vertex_3;
    }

    getDirection(){
        return this.direction;
    }

    setDirection(direct){
        this.direction = (direct > 0)? 1: -1;
    }

    changeDirection(){
        this.direction = - this.direction; 
    }
}

class Triangles{
    constructor(vertex_1, option){
        this.vertex_1 = vec2(vertex_1[0], vertex_1[1]);
        this.vertex_2 = vec2(roundToDecimal(vertex_1[0] + tri_width), roundToDecimal(vertex_1[1]));
        if(option == 0)
            this.vertex_3 = vec2(roundToDecimal((vertex_1[0] + this.vertex_2[0]) / 2), roundToDecimal(vertex_1[1] - tri_height));
        else if(option == 1)
            this.vertex_3 = vec2(roundToDecimal((vertex_1[0] + this.vertex_2[0]) / 2), roundToDecimal(vertex_1[1] + tri_height));
    }

    getVertex1(){
        return this.vertex_1;
    }

    getVertex2(){
        return this.vertex_2;
    }

    getVertex3(){
        return this.vertex_3;
    }

    move(num){         
        this.vertex_1[1] = roundToDecimal(this.vertex_1[1] + num);
        this.vertex_2[1] = roundToDecimal(this.vertex_2[1] + num);
        this.vertex_3[1] = roundToDecimal(this.vertex_3[1] + num);      
    }

    getVertice(){
        var vertice = [];
        vertice.push(this.vertex_1);
        vertice.push(this.vertex_2);
        vertice.push(this.vertex_3);
        return vertice;
    }
}

class Parameters{
    constructor(move_speed){
        this.move_speed = move_speed;
    }

    getMove_speed(){
        return this.move_speed;
    }

    setMoveSpeed(speed){
        this.move_speed = speed;
    }
}
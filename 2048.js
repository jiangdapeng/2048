const M = 4;

const CanvasHeight = 800;
const CanvasWidth = 800;
const BackgroundColor = '#E9C2A6';
const Margin = 30;

var processing = false;

var Grid = {

    data: undefined,
    Movement: undefined,
    MovementTemp: undefined,
    Temp: undefined,
    Upper: 0,
    StringData: undefined,
    BrickColor: ['#8FBC8F', '#00FF7F', '#007FFF', '#236B8E', '#FF7F00', '#FF2400', '#DB70DB', '#CD7F32', '', '', '', '', '', ''],
    GridWidth: 0,
    GridHeight: 0,

    //记录每个格子左上角的坐标位置
    //当然可以每次绘制的时候都进行计算，为了稍微加速缓存至此
    GridXs: undefined,
    GridYs: undefined,

    copyToTemp: function () {
        for (i = 0; i < M; i++) {
            for (j = 0; j < M; j++) {
                this.Temp[i][j] = this.data[i][j];
                this.MovementTemp[i][j] = this.Movement[i][j];
            }
        }
             
    },

    createGrid: function (M) {
        this.Upper = M;
        this.data = new Array(M);
        this.Movement = new Array(M);  //存储每个单元格在一次操作后移动的目标位置
        this.Temp = new Array(M);  //仅在数组旋转和还原时当作临时数组时使用
        this.MovementTemp = new Array(M);  //仅在数组旋转和还原时当作临时数组时使用
        this.GridXs = new Array(M);
        this.GridYs = new Array(M);

        this.GridWidth = (CanvasWidth - Margin * (M + 1)) / M;
        this.GridHeight = (CanvasHeight - Margin * (M + 1)) / M;

        for (i = 0; i < M; i++) {
            this.Temp[i] = new Array(M);
            this.MovementTemp[i] = new Array(M);
            this.data[i] = new Array(M);
            this.Movement[i] = new Array(M);

            //计算每个格子的坐标
            this.GridXs[i] = Margin + i * (this.GridWidth + Margin);
            this.GridYs[i] = Margin + i * (this.GridHeight + Margin);
        }

        this.clearGrid();

        return this;
    },

    setStringData: function (array) {
        this.StringData = array;
    },

    //在执行 MergeCore 之前请调用此方法
    //以清除上一次移动的记录
    beforeMerge: function() {
        for (i = 0; i < this.Upper; i++)
            for (j = 0; j < this.Upper; j++)
                this.Movement[i][j] = 0;
    },

    clearGrid: function () {
        for (i = 0; i < this.Upper; i++)
            for (j = 0; j < this.Upper; j++) {
                this.data[i][j] = 0;
                this.Temp[i][j] = 0;
                this.Movement[i][j] = 0;
                this.MovementTemp[i][j] = 0;
            }
    },

    //将 (x0, y0) 的方块合并到 (x, y)，位置，并清空初始位置。
    //如果 (x, y) 处已经存在方块，则进行合并改写。
    //同样，这里只考虑 X 轴方向。Y 轴方向将在旋转时考虑。
    mergeTo: function (x0, y0, x, y, newValue) {
        //if (x0 === x && y0 === y)
        //    return;

        //Movement 数组的内容：
        //0x30000000:  指示这个格子是否是新生成的
        //0x0F000000:  是否需要闪烁（留位给动画使用）
        //0x00FF0000:  X 轴方向移动的目标位置 （value - 8）
        //0x00008000:  是否进行合并 (1，进行了合并）
        //0x00007000:  单元格的最后值

        var orginal = this.data[x0][y0];
        this.Movement[x0][y0] = (x - x0 + 8) << 16;

        if (this.data[x][y] > 0) {
            this.Movement[x0][y0] |= 0x8000;
        }
        this.Movement[x0][y0] |= orginal;

        this.data[x][y] = newValue;
        this.data[x0][y0] = 0;
    },

    set: function (x, y, value) {
        //if (x >= this.Upper || y >= this.Upper || x < 0 || y < 0)
        //    return false;
        this.data[x][y] = value;
        return true;
    },

    get: function (x, y) {
        //if (x >= this.Upper || y >= this.Upper || x < 0 || y < 0)
        //    return undefined;
        return this.data[x][y];
    },

    getString: function (x, y) {
        //if (x >= this.Upper || y >= this.Upper || x < 0 || y < 0)
        //    return undefined;
        if (this.StringData == undefined)
            return this.data[x][y];

        return this.StringData[this.data[x][y]];
    }

}

var main;

function initialize() {
    main = Grid.createGrid(M);
    main.setStringData([0, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192]);
    main.set(2, 1, 2);
    main.set(1, 1, 2);
    main.set(3, 1, 1);
    //var k = 0;
    //for (i = 0; i < M; i++)
    //    for (j = 0; j < M; j++)
    //        main.set(j, i, ++k);

    
    return main;
}

function drawGrid(grid) {
    var drawing = document.getElementById('mainRegion');

    if (drawing.getContext) {
        var context = drawing.getContext('2d');

        context.fillStyle = BackgroundColor;
        context.fillRect(0, 0, CanvasWidth, CanvasHeight);

        var x = 0;
        var y = 0;

        context.shadowOffsetX = 5;
        context.shadowOffsetY = 5;
        context.shadowBlur = 4;
        context.shadowColor = '#A8A8A8';

        for (i = 0; i < grid.Upper; i++) {
            for (j = 0; j < grid.Upper; j++) {
                drawCell(grid, j, i, context);  // i -> row index, j-> column index
            }
        }

        context.shadowOffsetX = 3;
        context.shadowOffsetY = 3;
        context.shadowBlur = 3;
        context.shadowColor = '#D8D8BF';
        context.font = 'bold 40px Arial';
        context.fillStyle = '#2F2F4F';
        context.textAlign = 'center';

        for (i = 0; i < grid.Upper; i++) {
            for (j = 0; j < grid.Upper; j++) {
                drawString(grid, j, i, context);
                }
            }
        
    }
    else {
        alert('您的浏览器不支持<canvas>标签。');
    }
        
}

// 该方法不会创建 context 对象，也不会设置阴影效果，以便提升性能。
// 再调用此方法前请预先设置阴影效果。
function drawCell(grid, i, j, context) {
    var m = grid.Movement[i][j];

    var x = grid.GridXs[i]; // i * (Margin + grid.GridWidth) + Margin;
    var y = grid.GridYs[j]; //j * (Margin + grid.GridHeight) + Margin;

    if (m === undefined || (m & 0x7F000000) === 0)
        context.fillStyle = grid.BrickColor[grid.get(i, j)];
    else
        context.fillStyle = grid.BrickColor[0];

    context.fillRect(x, y, grid.GridWidth, grid.GridHeight);
}

// 该方法不会创建 context 对象，也不会设置文字颜色与阴影效果，以便提升性能。
// 再调用此方法前请预先设置阴影效果。
function drawString(grid, i, j, context) {
    var str = grid.getString(i, j);

    if (str <= 0) return;

    var x = grid.GridXs[i] + grid.GridWidth / 2;
    var y = grid.GridYs[j] + grid.GridHeight / 2 + 20;
    context.fillText(str, x, y)
}

function keyHandler(event) {
    if (processing)
        return;

    processing = true;
    switch (event.keyCode) {
        case 39: merge(main, 0); break;
        case 37: merge(main, 1); break;
        case 38: merge(main, 3); break;
        case 40: merge(main, 2); break;
    }

}

// direction = 0 右
// direction = 1 左
// direction = 2 上
// direction = 3 下
function merge(grid, direction) {
    //先进行合并操作
    if (direction === 2){
        transformGrid(grid);
        mergeCore(grid, 0);
        revertGrid(grid);
    }
    if (direction === 3) {
        transformGrid(grid);
        mergeCore(grid, 1);
        revertGrid(grid);
    }
    if (direction === 0 || direction === 1) {
        mergeCore(grid, direction);
    }

    //播放动画
    playAnimationMove(grid, direction);
}

// Core:
var dx = [1, -1, 0, 0];
var dy = [0, 0, 1, -1];
var ps = [M - 1, 0, M - 1, 0];
var pa = [0, M - 1, 0, M - 1];
function mergeCore(grid, direction) {
    grid.beforeMerge();

    var current, ob, l, exceedBorder, moved = false, x, y;
    //Thanks to DP
    //这里只考虑 X 轴方向的移动，Y 轴的移动前现将矩阵进行顺时针旋转，转换成 X 轴的移动
    for (y = 0; y < M; y++) {
        for (x = ps[direction]; x >= 0 && x < M; x -= dx[direction]) {  //从最终元素开始

            current = grid.get(x, y);
            if (current === 0) continue;

            exceedBorder = true;

            //直到碰到障碍或边界，检查是否可以合并
            for (l = x + dx[direction]; l >= 0 && l < M; l += dx[direction]) {
                ob = grid.get(l, y);

                if (ob === 0) continue;
                if (ob === current) {
                    //进行合并
                    moved = true;
                    grid.mergeTo(x, y, l, y, (ob + 1) * -1);
                    //grid.set(l, y, (ob + 1) * -1);  //避免同一个方块也在一个移动中合并两次
                    //grid.set(x, y, 0);
                }
                else {
                    //不能进行合并，把要移动的方块放在这里
                    if (x != l - dx[direction]) {
                        moved = true;
                        grid.mergeTo(x, y, l - dx[direction], y, current);
                        //grid.set(x, y, 0);  //顺序不能反，否则没有移动的时候值就不见了
                        //grid.set(l - dx[direction], y, current);
                    }
                }

                exceedBorder = false;

                break;
            }  //for l

            //这个方块没有被处理，说明越界了（前方没障碍），此时把它放到边界
            if (exceedBorder === true && x != l - dx[direction]) {
                moved = true;
                grid.mergeTo(x, y, l - dx[direction], y, current);
                //grid.set(x, y, 0);
                //grid.set(l - dx[direction], y, current);
            }

        }  //for x
    }  //for y

    var possiblePositions = new Array();

    //处理完了，把取相反数的格子还原
    for (i = 0; i < M; i++)
        for (j = 0; j < M; j++) {
            current = grid.get(i, j);

            if (current < 0)
                grid.set(i, j, -current);
            else if (current === 0 && moved) {  // 把空白的格子压入数组，以便随机产生一个新格子
                //--------------------->
                //恩，靠近边缘处的鸡绿稍高，酱紫貌似会简单一些？
                //为了提高鸡绿，就多放几个相同的好了
                x = Math.abs(ps[direction] - i) + 1;
                while (x-- > 0) {
                    possiblePositions.push(i << 8 | j);
                }
            }
        }

    if (!moved)
        return moved;

    //随机选择一个空位进行填充
    var index = Math.round(Math.random() * possiblePositions.length);
    var v = Math.random();
    var value = 1;
    if (v <= 0.60)
        value = 1;
    else if (v <= 0.90)
        value = 2;
    else if (v <= 0.95)
        value = 3;
    else
        value = 0;

    grid.NewBrick = 0;

    if (value != 0) {
        x = possiblePositions[index] >> 8;
        y = possiblePositions[index] & 0x00ff;

        grid.set(x, y, value);
        grid.Movement[x][y] |= 0x10000000;
    }

    return moved;
}

//顺时针旋转数组
function transformGrid(grid) {
    grid.copyToTemp();

    var i, j;
    for (i = 0; i < M; i++)
        for (j = 0; j < M; j++) {
            grid.set(i, j, grid.Temp[M - j - 1][i]);
        }
}

//逆时针旋转数组
//此时，要把 Movement 的内容作正确的变换
function revertGrid(grid) {
    grid.copyToTemp();

    var i, j, dex, dey, m;
    for (i = 0; i < M; i++)
        for (j = 0; j < M; j++) {
            //把 X 轴的变化量转移到 Y 轴
            //m = grid.MovementTemp[i][j];
            //if (m === 0) continue;

            //dex = m >> 24;
            //dey = (m & 0x00FF0000) >> 16;
            //dex = M - 1 - dex;
            grid.Movement[M - 1 - j][i] = grid.MovementTemp[i][j];
            grid.set(M - 1 - j, i, grid.Temp[i][j]);
        }
}

const animationMoveTime = 1000;
const frameDelay = 25;
const stepCount = 4;
const blinkCount = 4;

var currentStep = 0;
var intervalId;

//播放最新生成的格子的动画
//宽度不便，高从中部向两侧展开
function forEachNewBrickBlink(grid, context) {
    currentStep++;

    var i, j;

    for (i = 0; i < M; i++)
        for (j = 0; j < M; j++)
            if ((grid.Movement[i][j] & 0x70000000) != 0) {
                drawX = grid.GridXs[i];
                drawY = grid.GridYs[j];

                height = currentStep * grid.GridHeight / blinkCount;
                context.fillStyle = grid.BrickColor[grid.get(i, j)];
                context.fillRect(drawX, drawY + grid.GridHeight / 2 - height / 2, grid.GridWidth, height);
            }

    if (currentStep >= blinkCount) {
        finalShowGrid(grid);
        currentStep = 0;
    }
    else
        window.setTimeout(function () { forEachNewBrickBlink(grid, context); }, frameDelay);
}

//播放合并的格子的动画
//宽高均从中部向两侧展开
function forEachGridBlink(grid, context) {
    currentStep++;

    var i, j, merged, p, width, height, drawX, drawY;

    for (i = 0; i < M; i++)
        for (j = 0; j < M; j++) {
            m = grid.Movement[i][j];

            if (m != 0) {
                merged = m & 0x0F000000;
                v = m & 0x00007FFF;

                if (merged != 0) {
                    drawX = grid.GridXs[i];
                    drawY = grid.GridYs[j];

                    width = currentStep * grid.GridWidth / blinkCount;
                    height = currentStep * grid.GridHeight / blinkCount;
                    context.fillStyle = grid.BrickColor[grid.get(i, j)];
                    context.fillRect(drawX + grid.GridWidth / 2 - width / 2, drawY + grid.GridHeight / 2 - height / 2, width, height);
                }
            }
        }
        
    if (currentStep >= blinkCount) {
        currentStep = 0;
        window.setTimeout(function () { forEachNewBrickBlink(grid, context); }, frameDelay);
    }
    else
        window.setTimeout(function () { forEachGridBlink(grid, context); }, frameDelay);
}


function forEachGridMove(grid, direction, context) {
    currentStep++;

    var i, j, x, y, v, m, drawX, drawY, ox, oy, merged;

    for (i = 0; i < M;i++)
        for (j = 0; j < M; j++) {
            m = grid.Movement[i][j];
            if ((m & 0x00FFFFFF) != 0) {
                x = ((m & 0x00FF0000) >> 16) - 8;
                //y = (m & 0x00FF0000) >> 16;
                v = m & 0x00007FFF;
                merged = m & 0x00008000;
                context.fillStyle = grid.BrickColor[0];

                //这里需要改进，暂时先这样
                drawX = grid.GridXs[i];
                drawY = grid.GridYs[j];
                if (direction <= 1) {
                    x = x + i;
                    ox = drawX + (currentStep - 1) * (x - i) * (Margin + grid.GridWidth) / stepCount;
                    //oy = drawY + (currentStep - 1) * (y - j) * (Margin + grid.GridHeight) / stepCount;
                    context.fillRect(ox - 1, drawY - 1, grid.GridWidth + 2, grid.GridHeight + 2);
                    drawX += currentStep * (x - i) * (Margin + grid.GridWidth) / stepCount;
                    //drawY += currentStep * (y - j) * (Margin + grid.GridHeight) / stepCount;

                    if (merged != 0)
                        grid.Movement[x][j] |= 0x01000000;  //不能填符号位
                }
                else {  
                    x = x + j;
                    //ox = drawX + (currentStep - 1) * (x - i) * (Margin + grid.GridWidth) / stepCount;
                    oy = drawY + (currentStep - 1) * (x - j) * (Margin + grid.GridHeight) / stepCount;
                    context.fillRect(drawX - 1, oy - 1, grid.GridWidth + 2, grid.GridHeight + 2);
                    //drawX += currentStep * (x - i) * (Margin + grid.GridWidth) / stepCount;
                    drawY += currentStep * (x - j) * (Margin + grid.GridHeight) / stepCount;

                    if (merged != 0)
                        grid.Movement[i][x] |= 0x01000000;
                }
                context.fillStyle = grid.BrickColor[v];
                context.fillRect(drawX, drawY, grid.GridWidth, grid.GridHeight);
            }
        }

    if (currentStep >= stepCount) {
        currentStep = 0;
        drawGrid(grid);
        window.setTimeout(function () { forEachGridBlink(grid, context); }, frameDelay);
    }
    else
        window.setTimeout(function () { forEachGridMove(grid, direction, context); }, frameDelay);
}

function playAnimationMove(grid, direction) {
    var drawing = document.getElementById('mainRegion');

    var context = drawing.getContext('2d');

    context.shadowOffsetX = 5;
    context.shadowOffsetY = 5;
    context.shadowBlur = 4;
    context.shadowColor = '#A8A8A8';

    window.setTimeout(function () { forEachGridMove(grid, direction, context); }, frameDelay);
}

function finalShowGrid(grid) {
    for (i = 0; i < M; i++)
        for (j = 0; j < M; j++)
            grid.Movement[i][j] = 0;

    drawGrid(grid);
    processing = false;
}
var Shape = function(x, y, verx, very, fill) {
    this.x = x || 0;
    this.y = y || 0;
    var vertx = verx || [0, 10, 10, 0, 0];
    var verty = very || [0, 0, 10, 10, 0];
    var nvert = vertx.length;
    this.fill = fill || '#AAAAAA';
    this.selectedPoint = null;
    this.draw = function(ctx) {
        ctx.fillStyle = this.fill;
        ctx.beginPath();
        ctx.moveTo(vertx[0] + this.x, verty[0] + this.y);
        for (var i = 1; i < nvert; i++) {
            ctx.lineTo(vertx[i] + this.x, verty[i] + this.y);
        }
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fill();
    };
    this.outline = function(ctx, color, width) {
        ctx.fillStyle = this.fill;
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(vertx[0] + this.x, verty[0] + this.y);
        for (var i = 1; i < nvert; i++) {
            ctx.lineTo(vertx[i] + this.x, verty[i] + this.y);
        }
        ctx.stroke();
        for (var i = 0; i < nvert; i++) {
            ctx.beginPath();
            ctx.arc(vertx[i] + this.x, verty[i] + this.y, 5, 0, Math.PI * 2, true);
            if (this.selectedPoint == i) {
                ctx.fillStyle = '#AAAAAA';
                ctx.fill();
            }
            ctx.stroke();
        }
    };
    this.contains = function(mx, my) {
        var i, j, c = false;
        var testx = mx - this.x;
        var testy = my - this.y;
        for (var i = 0, j = nvert - 1; i < nvert; j = i++) {
            if (((verty[i] > testy) != (verty[j] > testy)) && (testx < (vertx[j] - vertx[i]) * (testy - verty[i]) / (verty[j] - verty[i]) + vertx[i])) {
                c = !c;
            }
        }
        return c;
    };
    this.isPoint = function(mx, my) {
        for (var i = 0; i < nvert; i++) {
            dx = vertx[i] + this.x - mx
            dy = verty[i] + this.y - my
            if (dx * dx + dy * dy <= 25) {
                this.selectedPoint = i;
                return {
                    x: vertx[i],
                    y: verty[i]
                };
            }
        }
        return false;
    };
    this.movePoint = function(mx, my) {
        if (this.selectedPoint === 0 || this.selectedPoint == nvert - 1) {
            vertx[0] = mx;
            vertx[nvert - 1] = mx;
            verty[0] = my;
            verty[nvert - 1] = my;
        } else {
            vertx[this.selectedPoint] = mx;
            verty[this.selectedPoint] = my;
        }
    };
    this.nudgePoint = function(x, y) {
        if (this.selectedPoint === 0 || this.selectedPoint == nvert - 1) {
            vertx[0] += x;
            vertx[nvert - 1] += x;
            verty[0] += y;
            verty[nvert - 1] += y;
        } else {
            vertx[this.selectedPoint] += x;
            verty[this.selectedPoint] += y;
        }
    }
    this.addPoint = function(mx, my) {
        var a = mx - this.x;
        var b = my - this.y;
        var dist = 10000;
        var spot = null;
        for (var i = 0; i < nvert - 1; i++) {
            var x1 = vertx[i];
            var x2 = vertx[i + 1];
            var y1 = verty[i];
            var y2 = verty[i + 1];
            var m1 = (y2 - y1) / (x2 - x1);
            var m2 = -1 / m1;
            var x = ((m1 * x1) - m2 * a - y1 + b) / (m1 - m2);
            var y = m2 * (x - a) + b;
            var distx = x - a < 0 ? a - x : x - a;
            var disty = y - b < 0 ? b - y : y - b;
            if (dist > distx + disty) {
                if ((x < x1 && x > x2) || (x > x1 && x < x2)) {
                    dist = distx + disty;
                    spot = i + 1;
                    newx = x;
                    newy = y;
                }
            }
            console.log(i, 'm1', parseInt(m1), 'm2', parseInt(m2), 'x', parseInt(x), 'y', parseInt(y));
        }
        vertx.splice(spot, 0, newx);
        verty.splice(spot, 0, newy);
        nvert += 1;
    };
    this.changePoint = function() {
        ////////////////
    };
    this.removePoint = function() {
        if (nvert > 4) {
            if (this.selectedPoint === 0) {
                vertx[nvert - 1] = vertx[1];
                verty[nvert - 1] = verty[1];
            }
            if (this.selectedPoint == nvert - 1) {
                vertx[0] = vertx[nvert - 2];
                verty[0] = verty[nvert - 2];
            }
            vertx.splice(this.selectedPoint, 1);
            verty.splice(this.selectedPoint, 1);
            nvert -= 1;
            if (this.selectedPoint == nvert - 1) {
                this.selectedPoint = 0;
            }
        }
    };
};

var CanvasState = function(canvasId) {
    var canvas = document.getElementById(canvasId);
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = canvas.getContext('2d');

    var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
    if (document.defaultView && document.defaultView.getComputedStyle) {
        this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10) || 0;
        this.stylePaddingTop = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10) || 0;
        this.styleBorderLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10) || 0;
        this.styleBorderTop = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10) || 0;
    }
    var html = document.body.parentNode;
    this.htmlTop = html.offsetTop;
    this.htmlLeft = html.offsetLeft;
    this.valid = false; // when set to false, the canvas will redraw everything
    this.shapes = []; // the collection of things to be drawn
    this.dragging = false; // Keep track of when we are dragging
    // the current selected object. In the future we could turn this into an array for multiple selection
    this.selection = null;
    this.dragoffx = 0; // See mousedown and mousemove events for explanation
    this.dragoffy = 0;

    var myState = this;
    canvas.oncontextmenu = function() {
        return false;
    };
    canvas.addEventListener('selectstart', function(e) {
        e.preventDefault();
        return false;
    }, false);
    canvas.addEventListener('mousedown', function(e) {
        var mouse = myState.getMouse(e);
        var mx = mouse.x;
        var my = mouse.y;
        var shapes = myState.shapes;
        var l = shapes.length;
        if (e.which === 3) {
            var point = myState.selection.isPoint(mouse.x, mouse.y);
            if (point) {
                myState.selection.changePoint();
            }
        }
        if (myState.selection) {
            var point = myState.selection.isPoint(mouse.x, mouse.y);
            if (!point) {
                myState.selection.selectedPoint = null;
                myState.selection = null;
            } else {
                myState.dragoffx = mx - point.x;
                myState.dragoffy = my - point.y;
                myState.dragging = true;
            }
            myState.valid = false;
        }
        for (var i = l - 1; i >= 0; i--) {
            if (shapes[i].contains(mx, my)) {
                var mySel = shapes[i];
                if (!point) {
                    myState.dragoffx = mx - mySel.x;
                    myState.dragoffy = my - mySel.y;
                }
                myState.dragging = true;
                myState.selection = mySel;
                myState.selection.id = i;
                myState.valid = false;
                return;
            }
        }
    }, true);
    canvas.addEventListener('mousemove', function(e) {
        var mouse = myState.getMouse(e);
        if (myState.dragging) {
            if (myState.selection.selectedPoint != null) {
                myState.selection.movePoint(mouse.x - myState.dragoffx, mouse.y - myState.dragoffy);
            } else {
                myState.selection.x = mouse.x - myState.dragoffx;
                myState.selection.y = mouse.y - myState.dragoffy;
            }
            myState.valid = false;
        }
    }, true);
    canvas.addEventListener('mouseup', function(e) {
        myState.dragging = false;
    }, true);
    canvas.addEventListener('dblclick', function(e) {
        var mouse = myState.getMouse(e);
        if (myState.selection) {
            if (myState.selection.selectedPoint == null) {
                myState.selection.addPoint(mouse.x, mouse.y);
            }
        } else {
            myState.addShape(new Shape(mouse.x - 5, mouse.y - 5));
        }
        myState.valid = false;
    }, true);
    window.addEventListener('keydown', function(e) {
        console.log(e.which);
        if (e.which == 116) {
            //e.preventDefault();
            alert('rendering');
            return null;
        }
        if (e.keyCode == 46) {
            if (myState.selection) {
                if (myState.selection.selectedPoint == null) {
                    myState.removeShape(myState.selection.id);
                    myState.selection = null;
                } else {
                    myState.selection.removePoint();
                }
            }
        }
        if (e.which == 34) {
            myState.bringShapeToFront(myState.selection.id);
        }
        if (e.which == 33) {
            myState.sendShapeToBack(myState.selection.id);
        }
        if (e.which == 38) {
            if (myState.selection) {
                if (myState.selection.selectedPoint != null) {
                    myState.selection.nudgePoint(0, -1);
                } else {
                    myState.selection.y -= 1;
                }
            }
        }
        if (e.which == 37) {
            if (myState.selection) {
                if (myState.selection.selectedPoint != null) {
                    myState.selection.nudgePoint(-1, 0);
                } else {
                    myState.selection.x -= 1;
                }
            }
        }
        if (e.which == 39) {
            if (myState.selection) {
                if (myState.selection.selectedPoint != null) {
                    myState.selection.nudgePoint(1, 0);
                } else {
                    myState.selection.x += 1;
                }
            }
        }
        if (e.which == 40) {
            if (myState.selection) {
                if (myState.selection.selectedPoint != null) {
                    myState.selection.nudgePoint(0, 1);
                } else {
                    myState.selection.y += 1;
                }
            }
        }
        myState.valid = false;
    }, true);
    this.selectionColor = 'rgb(51,153,255)';
    this.selectionWidth = 1;
    this.interval = 30;
    setInterval(function() {
        myState.draw();
    }, myState.interval);
    this.addShape = function(shape) {
        this.shapes.push(shape);
        this.valid = false;
    };
    this.bringShapeToFront = function(shape) {
        myState.shapes.push(myState.shapes[shape]);
        myState.shapes.splice(shape, 1);
        var i = myState.shapes.length - 1;
        myState.selection = myState.shapes[i];
        myState.selection.id = i;
        this.valid = false;
    };
    this.sendShapeToBack = function(shape) {
        myState.shapes.unshift(myState.shapes[shape]);
        myState.shapes.splice(shape + 1, 1);
        myState.selection = myState.shapes[0];
        myState.selection.id = 0;
        this.valid = false;
    };
    this.removeShape = function(shape) {
        this.shapes.splice(shape, 1);
        this.valid = false;
    };
    this.clear = function() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    };
    this.draw = function() {
        if (!this.valid) {
            var ctx = this.ctx;
            var shapes = this.shapes;
            this.clear();
            var l = shapes.length;
            for (var i = 0; i < l; i++) {
                shapes[i].draw(ctx);
            }
            if (this.selection != null) {
                var mySel = this.selection;
                mySel.outline(ctx, this.selectionColor, this.selectionWidth);
            }
            this.valid = true;
        }
    };
    this.getMouse = function(e) {
        var element = canvas,
            offsetX = 0,
            offsetY = 0,
            mx, my;
        if (element.offsetParent !== undefined) {
            do {
                offsetX += element.offsetLeft;
                offsetY += element.offsetTop;
            } while (element = element.offsetParent);
        }
        offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
        offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;
        mx = e.pageX - offsetX;
        my = e.pageY - offsetY;

        return {
            x: mx,
            y: my
        };
    };
};
var test = new Shape(19, 20, [10, 50, 3, 10], [10, 3, 50, 10], 'black');

var s = new CanvasState('canvas');
s.addShape(test);
s.addShape(new Shape(10, 10));
s.addShape(new Shape(25, 25));
test.draw(s.ctx);
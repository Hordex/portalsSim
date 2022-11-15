function Point(x,y){
    this.X = x;
    this.Y = y;
}

Point.prototype.Add = function(Other){
    return new Point(this.X + Other.X, this.Y + Other.Y);
};

Point.prototype.Multiply = function(scalar){
    return new Point(this.X * scalar, this.Y * scalar);
}

Point.prototype.Divide = function(scalar){
    return new Point(this.X * scalar, this.Y * scalar);
}

Point.prototype.Rotate = function(rotor){
    let sinx = Math.sin(rotor);
    let cosx = Math.cos(rotor);
    return new Point(x * cosx - y*sinx, x * sinx + y * cosx);
}

Point.prototype.LengthSquared = function(){
    return this.X * this.X + this.Y * this.Y;
}

function AABB(point1, point2){
    this.MinX = Math.min(point1.X,point2.X);
    this.MaxX = Math.max(point1.X,point2.X);
    this.MinY = Math.min(point1.Y,point2.Y);
    this.MaxY = Math.max(point1.Y,point2.Y);
}

AABB.prototype.IsPointIn = function(testPoint){
    return this.MinX <= testPoint.X && this.MaxX >= testPoint.X && this.MinY <= testPoint.Y && this.MaxY >= testPoint.Y;
}
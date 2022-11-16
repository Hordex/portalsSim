function Point(x,y){
    this.X = x;
    this.Y = y;
}

Point.prototype.Add = function(Other){
    return new Point(this.X + Other.X, this.Y + Other.Y);
};

Point.prototype.Subtract = function(Other){
    return new Point(this.X - Other.X, this.Y - Other.Y);
};

Point.prototype.Multiply = function(scalar){
    return new Point(this.X * scalar, this.Y * scalar);
}

Point.prototype.Divide = function(scalar){
    return new Point(this.X / scalar, this.Y / scalar);
}

Point.prototype.Rotate = function(rotor){
    let sinx = Math.sin(-rotor * Math.PI /180);
    let cosx = Math.cos(-rotor * Math.PI /180);
    return new Point(this.X * cosx - this.Y*sinx, this.X * sinx + this.Y * cosx);
}

Point.prototype.LengthSquared = function(){
    return this.X * this.X + this.Y * this.Y;
}

Point.prototype.Length = function(){
    return Math.sqrt(this.LengthSquared());
}

Point.prototype.Normalised = function(){
    return this.Divide(this.Length());
}

Point.prototype.NormalisedSafe = function(){
    let currentLength = this.Length(); 
    if(currentLength < 0.001){
        return new Point(this.X, this.Y);
    }
    return this.Divide(currentLength);
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
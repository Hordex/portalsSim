class Point {
    constructor(x, y) {
        this.X = x;
        this.Y = y;
    }
    Add(Other) {
        return new Point(this.X + Other.X, this.Y + Other.Y);
    }
    Subtract(Other) {
        return new Point(this.X - Other.X, this.Y - Other.Y);
    }
    Multiply(scalar) {
        return new Point(this.X * scalar, this.Y * scalar);
    }
    Divide(scalar) {
        return new Point(this.X / scalar, this.Y / scalar);
    }
    Rotate(rotor) {
        let sinx = Math.sin(-rotor * Math.PI / 180);
        let cosx = Math.cos(-rotor * Math.PI / 180);
        return new Point(this.X * cosx - this.Y * sinx, this.X * sinx + this.Y * cosx);
    }
    LengthSquared() {
        return this.X * this.X + this.Y * this.Y;
    }
    Length() {
        return Math.sqrt(this.LengthSquared());
    }
    Normalised() {
        return this.Divide(this.Length());
    }
    NormalisedSafe() {
        let currentLength = this.Length();
        if (currentLength < 0.001) {
            return new Point(this.X, this.Y);
        }
        return this.Divide(currentLength);
    }
}








class AABB {
    constructor(point1, point2) {
        this.MinX = Math.min(point1.X, point2.X);
        this.MaxX = Math.max(point1.X, point2.X);
        this.MinY = Math.min(point1.Y, point2.Y);
        this.MaxY = Math.max(point1.Y, point2.Y);
    }
    IsPointIn(testPoint) {
        return this.MinX <= testPoint.X && this.MaxX >= testPoint.X && this.MinY <= testPoint.Y && this.MaxY >= testPoint.Y;
    }
    PointsCCW(A,B,C){
        return (C.Y-A.Y) * (B.X-A.X) > (B.Y-A.Y) * (C.X-A.X);
    }
    DoLinesIntersect(A,B,C,D){
        // IDAF about colinearity
        return this.PointsCCW(A,C,D) != this.PointsCCW(B,C,D) && this.PointsCCW(A,B,C) != this.PointsCCW(A,B,D);
    }
    DoesLineIntersect(A,B){
        return this.DoLinesIntersect(A,B,new Point(this.MinX,this.MinY),new Point(this.MinX,this.MaxY)) ||
                this.DoLinesIntersect(A,B,new Point(this.MaxX,this.MinY),new Point(this.MaxX,this.MaxY)) ||
                this.DoLinesIntersect(A,B,new Point(this.MinX,this.MinY),new Point(this.MaxX,this.MinY)) ||
                this.DoLinesIntersect(A,B,new Point(this.MinX,this.MaxY),new Point(this.MaxX,this.MaxY));
    }
}


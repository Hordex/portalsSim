function SimulationState(){
    this.Scenario = null;
    this.Bounds = new AABB(new Point(0,0),new Point(SimSettings.arenaWidth,SimSettings.arenaHeight));
    this.Objects = [];
    this.Player = null;
    this.Bots = [];
}

// === SimObject
function SimObject(position, rotation){
    this.Position = position;
    this.Rotation = rotation;
    this.bDirty = false;
}

SimObject.prototype.Move = function(moveVector){
    let tmpPos = this.Position;
    this.Position = tmpPos.Add(moveVector);
    this.bDirty = true;
}

SimObject.prototype.Rotate = function(rotor){
    this.Rotation += rotor;
    this.bDirty = true;
}

// === Rectangle

function Rectangle(position, rotation, size){
    SimObject.call(this,position,rotation);
    this.LocalBB = new AABB(new Point(0,0),size);
}

Rectangle.prototype.IsOverlapping = function(position){
    return this.LocalBB.IsPointIn((position - this.Position).Rotate(-this.Rotation));
}

Rectangle.prototype = Object.create(SimObject.prototype);
Rectangle.prototype.constructor = Rectangle;

// === Circle

function Circle(postion, radius){
    SimObject.call(this,postion,0);
    this.Radius = radius;
}

Circle.prototype.IsOverlapping = function(position){
    return (position - this.Position).LengthSquared() <= this.Radius * this.Radius;
}

Circle.prototype = Object.create(SimObject.prototype);
Circle.prototype.constructor = Circle;

// === Character

function Character(position){
    SimObject.call(this,postion,0);
}

Character.prototype = Object.create(SimObject.prototype);
Character.prototype.constructor = Character;

// === Player

function Player(position){
    SimObject.call(this,postion,0);
}

Player.prototype = Object.create(SimObject.prototype);
Player.prototype.constructor = Player;

SimulationState.prototype.Init = function(inScenario){
    SimulationState.call(this);
    this.Scenario = inScenario;
}
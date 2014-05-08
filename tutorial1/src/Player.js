var Player = cc.Sprite.extend({
	ctor : function (x, y ,a){
		this._super();
		if(a == 1)
		this.initWithFile('images/player.png');
		else
		this.initWithFile('images/player2.png');

		this.nextDirection = Player.DIR.STILL;
		this.direction = Player.DIR.STILL;

		this.direction = Player.DIR.STILL;
		this.x = x;
		this.y = y;
		this.updatePosition();
	},
	updatePosition : function(){
		this.setPosition( cc.p (this.x,this.y));
	},
	update : function(dt){
		if( this.isAtCenter() ){
			if(! this.isPossibleToMove( this.nextDirection )) {
				this.nextDirection = Player.DIR.STILL;
			}
			this.direction = this.nextDirection;
		}

		switch ( this.direction ) {
        case Player.DIR.UP:
            this.y += Player.MOVE_STEP;
            break;
        case Player.DIR.DOWN:
            this.y -= Player.MOVE_STEP;
            break;
        case Player.DIR.LEFT:
            this.x -= Player.MOVE_STEP;
            break;
        case Player.DIR.RIGHT:
            this.x += Player.MOVE_STEP;
            break;
        }
        this.updatePosition();


      // console.log("x :" + this.x);
       // console.log("y :" + this.y);
	},
	getDirectionX : function (){
		return this.x;
	},
	getDirectionY : function (){
		return this.y;
	},
	setDirection : function ( dir ){
		this.direction = dir;
	},
	setNextDirection : function ( dir ){
		this.nextDirection = dir;
	},
	isAtCenter : function() {
		return (this.x + 20) % 40 ==0 & (this.y + 20)%40 == 0;
	},
	setMaze : function(maze){
		this.maze = maze;
	},
	isPossibleToMove: function( dir ) {
		if ( dir == Player.DIR.STILL ){
			return true;
		}
		this.nextBlockX = ( this.x - 20 ) / 40;
		this.nextBlockY = ( this.y - 20 ) / 40;
		switch ( this.nextDirection ) {
			case Player.DIR.UP:
				this.nextBlockY += 1;
				break;
			case Player.DIR.DOWN:
				this.nextBlockY -= 1;
				break;
			case Player.DIR.LEFT:
				this.nextBlockX -= 1;
				break;
			case Player.DIR.RIGHT:
				this.nextBlockX += 1;
				break;
		}
		return ! this.maze.isWall( this.nextBlockX, this.nextBlockY );
	},
	isDead : function (){
		var r = Math.round(( this.x - 20 ) / 40);
		var t = Math.round(( this.y - 20 ) / 40);
		return  this.maze.isMario(r,t);
	}
	
});
Player.MOVE_STEP = 5;
Player.DIR = {
	LEFT : 1,
	RIGHT : 2,
	UP : 3,
	DOWN : 4,
	STILL : 0
};
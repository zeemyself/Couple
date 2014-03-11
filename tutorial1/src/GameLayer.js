var GameLayer = cc.LayerColor.extend({
    init: function() {
        this.setKeyboardEnabled(true);
        this._super( new cc.Color4B( 127, 127, 127, 255 ) );
        this.setPosition( new cc.Point( 0, 0 ) );

        this.maze = new Maze();
        this.maze.setPosition( cc.p( 0, 40));
        this.addChild( this.maze );

        this.goal = new Goal(400,260);
        this.maze.addChild(this.goal);

        this.playerA = new Player(60, 60,1);
        this.playerA.setMaze( this.maze);
        this.maze.addChild( this.playerA);

        this.playerA.scheduleUpdate();

        this.playerB = new Player(740 ,460,2);
        this.playerB.setMaze( this.maze);
        this.maze.addChild( this.playerB);

        this.playerB.scheduleUpdate();

        this.scheduleUpdate();

        return true;
    },
    setDirection : function ( dir ){
        this.direction = dir;
    },
    onKeyDown : function ( e ){
         switch( e ) {
        case cc.KEY.left:
            this.playerA.setNextDirection( Player.DIR.LEFT );
            this.playerB.setNextDirection( Player.DIR.RIGHT );
            break;
        case cc.KEY.right:
            this.playerA.setNextDirection( Player.DIR.RIGHT );
            this.playerB.setNextDirection( Player.DIR.LEFT );
            break;
        case cc.KEY.up:
            this.playerA.setNextDirection( Player.DIR.UP );
            this.playerB.setNextDirection( Player.DIR.DOWN );
            break;
        case cc.KEY.down:
            this.playerA.setNextDirection( Player.DIR.DOWN );
            this.playerB.setNextDirection( Player.DIR.UP );
            break;
        case cc.KEY.space:
            console.log(this.playerB.getDirectionX());
            console.log(this.playerB.getDirectionY());
        }
        // this.check();
    },     
    onKeyUp : function (e){
        this.playerA.setNextDirection(Player.DIR.STILL);
        this.playerB.setNextDirection(Player.DIR.STILL);
        
    },
    update : function (){
         if(this.playerA.getDirectionX() == 380 && this.playerA.getDirectionY() == 260)
                if(this.playerB.getDirectionX() == 420 && this.playerB.getDirectionY() == 260)
            this.endgame();
    },
    endgame: function(){
        this.unscheduleUpdate();
        this.setKeyboardEnabled(false);
        console.log("FINISHHHH");
    }

});

var StartScene = cc.Scene.extend({
    onEnter: function() {
        this._super();
        var layer = new GameLayer();
        layer.init();
        this.addChild( layer );
    }
});


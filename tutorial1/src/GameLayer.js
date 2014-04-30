var GameLayer = cc.LayerColor.extend({
    init: function() {
        this.stageLabel = "";
        this.stage = 1;
        this.gameend = false;

        this.setKeyboardEnabled(true);
        this._super( new cc.Color4B( 127, 127, 127, 255 ) );
        this.setPosition( new cc.Point( 0, 0 ) );

        this.maze = new Maze(this.stage);
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

        this.time = 1000;
        this.timeLabel = cc.LabelTTF.create ('0' , 'Arial', 40);
        this.timeLabel.setPosition( new cc.Point(500,570));
        this.addChild(this.timeLabel);

        this.stageLabel = cc.LabelTTF.create ('0' , 'Arial', 30);
        this.stageLabel.setPosition( new cc.Point(200,570));
        this.addChild(this.stageLabel);

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
            // console.log(this.playerB.getDirectionX());
            // console.log(this.playerB.getDirectionY());
            console.log(this.stage);
        }

        if (this.gameend) {
            
            this.startGame();
        }
        // this.check();
    },     
    onKeyUp : function (e){
        this.playerA.setNextDirection(Player.DIR.STILL);
        this.playerB.setNextDirection(Player.DIR.STILL);
        
    },
    update : function (){
        this.stageLabel.setString("Stage ="+this.stage);
         if(this.playerA.getDirectionX() == 380 && this.playerA.getDirectionY() == 260)
                if(this.playerB.getDirectionX() == 420 && this.playerB.getDirectionY() == 260)
                     this.endgame();


    this.time--;
    this.timeLabel.setString("Time left : "+ parseInt(this.time)/100);
     if(this.time <= 0){
        this.unscheduleUpdate();
        this.endgame();
     }

    },
    setTime : function (t){
        this.time = t;
    },
    endgame: function(){
        this.gameend = true;
        this.unscheduleUpdate();
        // this.setKeyboardEnabled(false);
        this.removeChild(this.maze);
        // this.addChild('iamges/gameover.jpg');
        this.Gameover = new Gameover();
        this.Gameover.setPosition(cc.p(500, 400));
        this.addChild( this.Gameover );

        this.stage++;
        console.log("FINISHHHH");
        console.log(this.stage);
    },
    startGame : function(){
       
        if(this.stage = 2)
            this.setTime(2000);
        this.gameend = false;

        this.scheduleUpdate();
        this.removeChild( this.Gameover );

        this.maze = new Maze(this.stage);
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


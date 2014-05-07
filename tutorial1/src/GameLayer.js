var GameLayer = cc.LayerColor.extend({
    // this.stage = 1;
    init: function() {
        this.stageLabel = "";
        this.stage = 1;
        this.gameend = false;

        this.setKeyboardEnabled(true);
        this._super( new cc.Color4B( 127, 127, 127, 255 ) );
        this.setPosition( new cc.Point( 0, 0 ) );

        this.BF = cc.Sprite.create( 'images/castle4.jpg' );
        this.BF.setPosition( cc.p(400,300));
        this.addChild(this.BF);
        // this.maze = new Maze(this.stage);
        // this.maze.setPosition( cc.p( 0, 40));
        // this.addChild( this.maze );

        // this.goal = new Goal(400,260);
        // this.maze.addChild(this.goal);

        // this.playerA = new Player(60, 60,1);
        // this.playerA.setMaze( this.maze);
        // this.maze.addChild( this.playerA);

        // this.playerA.scheduleUpdate();

        // this.playerB = new Player(740 ,460,2);
        // this.playerB.setMaze( this.maze);
        // this.maze.addChild( this.playerB);

        // this.playerB.scheduleUpdate();

        // this.scheduleUpdate();
        this.createMenu();

        this.time = 1000;
        this.timeLabel = cc.LabelTTF.create (' ' , 'Arial', 40);
        this.timeLabel.setPosition( new cc.Point(500,570));
        this.addChild(this.timeLabel);

        this.stageLabel = cc.LabelTTF.create (' ' , 'Arial', 30);
        this.stageLabel.setPosition( new cc.Point(200,570));
        this.addChild(this.stageLabel);

        return true;
    },
    setDirection : function ( dir ){
        this.direction = dir;
    },
    onKeyDown : function ( e ){
        // console.log(e);
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
        case cc.KEY.enter:
            if(this.gameend)
            this.startGame();
            break;
        case cc.KEY.space:
            this.removeChild(this.text);
            this.startGame();
            break;
        case cc.KEY.alt:
            cc.log("now stage : "+this.stage);
        }

        
        // this.check();
    },     
    onKeyUp : function (e){
        if(e != cc.KEY.spacebar)
        this.playerA.setNextDirection(Player.DIR.STILL);
        this.playerB.setNextDirection(Player.DIR.STILL);
        
    },
    update : function (){
    
         if(this.playerA.getDirectionX() == 380 && this.playerA.getDirectionY() == 260){
                if(this.playerB.getDirectionX() == 420 && this.playerB.getDirectionY() == 260){
                     this.endgame();
                 }
             }


    this.time--;
    this.timeLabel.setString("Time left : "+ parseInt(this.time)/100);
     
    // var number = this.stage;
    this.stageLabel.setString("Stage :"+this.stage);

     if(this.time <= 0){
        this.unscheduleUpdate();
        this.gameOver();
     }

    },
    setTime : function (t){
        this.time = t;
    },
    gameOver : function (){
        this.gameend = true;
        this.unscheduleUpdate();

        this.removeChild(this.maze);

        this.Gameover = new Gameover(1);
        this.Gameover.setPosition(cc.p(400, 400));
        this.addChild( this.Gameover );
    },
    endgame: function(){ 
        // console.log("END");
        this.gameend = true;
        this.unscheduleUpdate();
        
        console.log("Test");
        // this.setKeyboardEnabled(false);
        this.removeChild(this.maze);

        console.log("Remove maze");
        // this.addChild('iamges/gameover.jpg');
        this.Gameover = new Gameover(2);
        this.Gameover.setPosition(cc.p(400, 400));
        this.addChild( this.Gameover );

        this.nextStage();
        console.log("FINISHHHH");
        console.log(this.stage);
    },
    startGame : function(){
        // var number = this.stage;
       
       // console.log(number);
        if(this.stage = 2)
            this.setTime(2000);
        this.gameend = false;
        if(this.stage != 1 ){
        // this.scheduleUpdate();
        this.removeChild( this.Gameover );
        }
        this.scheduleUpdate();

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

        


    },
    nextStage : function (){
        this.stage = this.stage + 1;
        console.log("Addd stage leaw na");
        // this.update();
    },
    createMenu : function (){
        // this.menuItem1 = new cc.MenuItemFont.create("Start Game !","images/start.png",this.startGame());
        // this.menuItem1.setPosition(new cc.Point(400,400));
        // this.menu = cc.Menu.create(this.menuItem1);
        // this.menu.setPosition(new cc.Point(0,0));
        // this.addChild(this.menu);
        this.setKeyboardEnabled(true);
        
        this.text = cc.LabelTTF.create('0','Arial',40);
        this.text.setPosition( new cc.Point( 300,300));
        this.addChild(this.text);

        this.text.setString("Press SPACEBAR to start game");
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


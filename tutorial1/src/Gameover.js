var Gameover = cc.Sprite.extend({
    ctor: function(x) {
        this._super();
        if(x == 1)
        this.initWithFile( 'images/GO.png' );
    	else if (x ==3 )
    	this.initWithFile(' images/dead.jpg');
    	else
    	this.initWithFile(' images/win.png');
    }
});
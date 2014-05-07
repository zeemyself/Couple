var Gameover = cc.Sprite.extend({
    ctor: function(x) {
        this._super();
        if(x == 1)
        this.initWithFile( 'images/GO.png' );
    	else
    	this.initWithFile(' images/win.png');
    }
});